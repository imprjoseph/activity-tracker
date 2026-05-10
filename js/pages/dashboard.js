/* ════════════════════════════════════════════════════════════
   pages/dashboard.js — Dashboard Page
   ════════════════════════════════════════════════════════════ */

const DashboardPage = {

  async render() {
    const content = document.getElementById('pageContent');
    content.innerHTML = Utils.loadingHtml();

    let res;
    try {
      res = await API.getDashboard();
    } catch(e) {
      content.innerHTML = Utils.emptyHtml('⚠️', 'GAS 連線失敗', e.message + '\n\n請至「系統設定 → Sheets 連結」確認 GAS URL 正確。');
      return;
    }
    if (!res || !res.success) {
      content.innerHTML = Utils.emptyHtml('⚠️', '載入失敗', (res && res.message) || '請重新整理頁面');
      return;
    }

    const d = res.data;
    const { stats, recentActivities, topClients, monthlyTrend } = d;

    // Update badges
    document.getElementById('badge-clients').textContent = stats.totalClients;
    document.getElementById('badge-vendors').textContent = stats.totalVendors;

    const maxTrend = Math.max(...monthlyTrend);
    const months = ['1','2','3','4','5','6','7','8','9','10','11','12'];

    content.innerHTML = `
      <!-- STAT CARDS -->
      <div class="stats-grid">
        ${DashboardPage.statCard('客戶總數', stats.totalClients, '本月合作中客戶', 'accent-orange', 'orange',
          `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
          '+3 vs 上月', 'up'
        )}
        ${DashboardPage.statCard('供應商總數', stats.totalVendors, '已建檔供應商', 'accent-blue', 'blue',
          `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 7l7-5 7 5v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke="currentColor" stroke-width="1.5"/></svg>`,
          '+8 vs 上月', 'up'
        )}
        ${DashboardPage.statCard('本月新增', stats.newThisMonth, '新增客戶 / 供應商', 'accent-warning', 'warning',
          `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
          '本月進度', ''
        )}
        ${DashboardPage.statCard('待追蹤', stats.pendingFollow, '需要後續跟進', 'accent-danger', 'danger',
          `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
          '請盡快追蹤', 'down'
        )}
      </div>

      <!-- MAIN DASHBOARD GRID -->
      <div class="dashboard-grid">

        <!-- LEFT: Recent Activities + Monthly Trend -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Monthly Trend Chart -->
          <div class="dashboard-card">
            <div class="card-header">
              <span class="card-title">📈 月度客戶趨勢</span>
              <span class="card-action">2025 全年</span>
            </div>
            <div class="card-body">
              <div style="display:flex;align-items:flex-end;gap:3px;height:100px">
                ${monthlyTrend.map((v, i) => `
                  <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div style="
                      flex:1;background:${i === monthlyTrend.length-1 ? 'var(--accent)' : 'var(--accent-dim)'};
                      border-radius:3px 3px 0 0;
                      width:100%;
                      height:${Math.round((v/maxTrend)*80)}px;
                      min-height:4px;
                      transition:height 0.5s cubic-bezier(0.4,0,0.2,1);
                      cursor:pointer;
                    " title="${months[i]}月: ${v}"></div>
                    <span style="font-size:0.65rem;color:var(--text-muted);font-family:var(--font-mono)">${months[i]}</span>
                  </div>
                `).join('')}
              </div>
              <div style="margin-top:12px;display:flex;gap:20px">
                <div style="font-size:0.78rem;color:var(--text-muted)">最高 <span style="color:var(--text-primary);font-family:var(--font-mono);font-weight:600">${maxTrend}</span></div>
                <div style="font-size:0.78rem;color:var(--text-muted)">本月 <span style="color:var(--accent);font-family:var(--font-mono);font-weight:600">${monthlyTrend[monthlyTrend.length-1]}</span></div>
                <div style="font-size:0.78rem;color:var(--text-muted)">高潛力 <span style="color:var(--warning);font-family:var(--font-mono);font-weight:600">${stats.highPotential}</span></div>
              </div>
            </div>
          </div>

          <!-- Recent Activities -->
          <div class="dashboard-card">
            <div class="card-header">
              <span class="card-title">🕐 最近追蹤紀錄</span>
              <span class="card-action" onclick="navigate('activities')">查看全部</span>
            </div>
            <div class="card-body" style="padding:8px 0">
              <div class="activity-list">
                ${recentActivities.map(a => {
                  const typeInfo = CONFIG.ACTIVITY_TYPES[a.type] || { label: a.type, icon: '📌' };
                  return `
                  <div class="activity-item">
                    <div class="activity-dot ${(typeInfo.color || 'gray')}"></div>
                    <div class="activity-meta">
                      <div class="activity-title">${typeInfo.icon} ${Utils.escapeHtml(a.title)}</div>
                      <div class="activity-sub">${Utils.escapeHtml(a.company)}</div>
                    </div>
                    <div class="activity-time">${a.time}</div>
                  </div>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Quick Stats -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Alert Cards -->
          <div class="dashboard-card">
            <div class="card-header">
              <span class="card-title">🔔 系統提醒</span>
            </div>
            <div class="card-body" style="padding:12px 16px">
              <div class="quick-list">
                <div class="quick-item" onclick="navigate('clients')">
                  <div class="quick-item-left">
                    <div class="quick-item-icon" style="background:rgba(255,170,0,0.12)">⏰</div>
                    <div>
                      <div class="quick-item-name">即將到期合約</div>
                      <div class="quick-item-sub">30天內到期</div>
                    </div>
                  </div>
                  <span class="quick-item-badge badge-warning">${stats.expiringContracts} 件</span>
                </div>
                <div class="quick-item" onclick="navigate('clients')">
                  <div class="quick-item-left">
                    <div class="quick-item-icon" style="background:rgba(59,130,246,0.12)">🎯</div>
                    <div>
                      <div class="quick-item-name">高潛力客戶</div>
                      <div class="quick-item-sub">待跟進</div>
                    </div>
                  </div>
                  <span class="quick-item-badge badge-blue">${stats.highPotential} 家</span>
                </div>
                <div class="quick-item" onclick="navigate('activities')">
                  <div class="quick-item-left">
                    <div class="quick-item-icon" style="background:rgba(255,77,109,0.12)">📋</div>
                    <div>
                      <div class="quick-item-name">待追蹤客戶</div>
                      <div class="quick-item-sub">需要後續聯繫</div>
                    </div>
                  </div>
                  <span class="quick-item-badge badge-danger">${stats.pendingFollow} 家</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Clients -->
          <div class="dashboard-card" style="flex:1">
            <div class="card-header">
              <span class="card-title">⭐ 重要客戶</span>
              <span class="card-action" onclick="navigate('clients')">查看全部</span>
            </div>
            <div class="card-body" style="padding:8px 0">
              <div class="quick-list" style="padding:0 8px">
                ${topClients.map(c => `
                  <div class="quick-item" onclick="navigate('clients')">
                    <div class="quick-item-left">
                      <div class="quick-item-icon" style="background:${c.color}22;color:${c.color};font-size:0.85rem;font-weight:700">
                        ${c.name[0]}
                      </div>
                      <div>
                        <div class="quick-item-name" style="font-size:0.82rem">${Utils.escapeHtml(c.name)}</div>
                        <div class="quick-item-sub">${c.projects} 個專案 · ${c.amount}</div>
                      </div>
                    </div>
                    ${Utils.levelBadge(c.level)}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  statCard(label, value, sub, accentClass, iconClass, iconSvg, trend, trendDir) {
    return `
      <div class="stat-card ${accentClass}">
        <div class="stat-top">
          <span class="stat-label">${label}</span>
          <div class="stat-icon ${iconClass}">${iconSvg}</div>
        </div>
        <div class="stat-value">${value}</div>
        <div class="stat-trend ${trendDir}">
          ${trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : ''}
          ${sub} — ${trend}
        </div>
      </div>
    `;
  },
};
