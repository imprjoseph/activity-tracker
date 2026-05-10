/* ════════════════════════════════════════════════════════════
   pages/settings.js — Settings + EvaluationsPage (完整版)
   ════════════════════════════════════════════════════════════ */

const SettingsPage = {
  activeTab: 'system',

  render() {
    window.CurrentPage = SettingsPage;
    const session=Auth.getSession();
    document.getElementById('pageContent').innerHTML=`
      <div class="settings-layout">
        <div class="settings-nav">
          ${[['system','⚙️  系統設定'],['users','👥  使用者管理'],['categories','🏷️  分類管理'],['tags','🔖  標籤管理'],['sheets','📊  Sheets 連結'],['about','ℹ️  關於系統']].map(
            ([id,label])=>`<div class="settings-nav-item${SettingsPage.activeTab===id?' active':''}"
              onclick="SettingsPage.switchTab('${id}')">${label}</div>`).join('')}
        </div>
        <div class="settings-panel" id="settingsPanel">
          ${SettingsPage.renderTab(SettingsPage.activeTab, session)}
        </div>
      </div>`;
  },

  search() {},

  switchTab(id) {
    SettingsPage.activeTab=id;
    const session=Auth.getSession();
    document.getElementById('settingsPanel').innerHTML=SettingsPage.renderTab(id,session);
    document.querySelectorAll('.settings-nav-item').forEach(el=>{
      el.classList.toggle('active', el.textContent.includes(id==='system'?'系統':id==='users'?'使用':id==='categories'?'分類':id==='tags'?'標籤':id==='sheets'?'Sheets':'關於'));
    });
    SettingsPage.render();
  },

  renderTab(id, session) {
    switch(id) {
      case 'system':   return SettingsPage.tabSystem(session);
      case 'users':    return SettingsPage.tabUsers();
      case 'categories': return SettingsPage.tabCategories();
      case 'tags':     return SettingsPage.tabTags();
      case 'sheets':   return SettingsPage.tabSheets();
      case 'about':    return SettingsPage.tabAbout();
      default: return '';
    }
  },

  tabSystem(session) {
    return `<div class="settings-section-title">⚙️ 系統設定</div>
    <div class="form-grid" style="margin-bottom:24px">
      <div class="form-field"><label>公司名稱</label><input type="text" value="${CONFIG.COMPANY}" /></div>
      <div class="form-field"><label>系統版本</label><input type="text" value="${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}" readonly style="font-family:var(--font-mono)" /></div>
      <div class="form-field"><label>預設顯示筆數</label>
        <select><option>20筆</option><option>50筆</option><option>100筆</option></select></div>
      <div class="form-field"><label>系統語言</label><select><option>繁體中文</option><option>English</option></select></div>
    </div>
    <div class="settings-section-title">👤 目前帳號</div>
    <div style="display:flex;align-items:center;gap:12px;padding:16px;background:var(--bg-elevated);border-radius:var(--r-sm);margin-bottom:20px">
      <div class="user-avatar" style="width:44px;height:44px;font-size:1rem">${(session?.name||'A')[0]}</div>
      <div>
        <div style="font-weight:700;font-size:1rem">${session?.name||'未知'}</div>
        <div style="font-size:0.82rem;color:var(--text-muted)">${session?.role?(CONFIG.ROLES[session.role]?.label||session.role):''} · 帳號：${session?.username||''}</div>
      </div>
    </div>
    <button class="btn-primary" onclick="Utils.toast('設定已儲存','success')">儲存設定</button>`;
  },

  tabUsers() {
    const users=[
      { name:'系統管理員', username:'admin',   role:'SUPER_ADMIN', status:'啟用', lastLogin:'2025-05-10 14:00' },
      { name:'業務一',     username:'sales01', role:'SALES',       status:'啟用', lastLogin:'2025-05-10 09:30' },
      { name:'專案管理',   username:'pm01',    role:'PM',          status:'啟用', lastLogin:'2025-05-09 17:00' },
    ];
    return `<div class="settings-section-title">👥 使用者管理</div>
    <div style="margin-bottom:16px;display:flex;justify-content:flex-end">
      <button class="btn-primary" onclick="SettingsPage.openAddUser()">+ 新增使用者</button>
    </div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr><th>姓名</th><th>帳號</th><th>角色</th><th>狀態</th><th>最後登入</th><th>操作</th></tr></thead>
        <tbody>${users.map(u=>`<tr>
          <td><div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:${Utils.avatarColor(u.name)};display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:#fff">${u.name[0]}</div>
            <span style="font-weight:600">${u.name}</span></div></td>
          <td style="font-family:var(--font-mono);font-size:0.82rem">${u.username}</td>
          <td><span class="chip chip-potential">${CONFIG.ROLES[u.role]?.label||u.role}</span></td>
          <td><span class="chip chip-active">${u.status}</span></td>
          <td style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-muted)">${u.lastLogin}</td>
          <td><div style="display:flex;gap:4px">
            <button class="btn-icon" onclick="Utils.toast('使用者編輯功能建置中','info')">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  },

  tabCategories() {
    return `<div class="settings-section-title">🏷️ 客戶分類管理</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div>
        <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:10px">客戶分類</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
          ${CONFIG.CLIENT_CATEGORIES.map((c,i)=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--r-sm)">
              <span style="font-size:0.85rem">${c}</span>
              <button style="color:var(--danger);font-size:0.75rem;padding:2px 8px;border-radius:4px;background:rgba(255,77,109,0.1)"
                onclick="Utils.toast('刪除分類功能需 GAS 連線後啟用','info')">移除</button>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <input type="text" id="newCat" placeholder="新增分類名稱" style="flex:1" />
          <button class="btn-primary" onclick="Utils.toast('新增分類功能需 GAS 連線後啟用','info')">新增</button>
        </div>
      </div>
      <div>
        <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:10px">供應商類型</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${CONFIG.VENDOR_CATEGORIES.slice(0,8).map(c=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--r-sm)">
              <span style="font-size:0.85rem">${c}</span>
            </div>`).join('')}
          <div style="color:var(--text-muted);font-size:0.78rem;padding:4px 12px">…還有 ${CONFIG.VENDOR_CATEGORIES.length-8} 項</div>
        </div>
      </div>
    </div>`;
  },

  tabTags() {
    const tags=['高潛力','長期合作','高預算','需追蹤','年度標案','國際','推薦','旗艦案','政府標案','醫療','電信','新客戶'];
    return `<div class="settings-section-title">🔖 標籤管理</div>
    <div class="tag-list" style="margin-bottom:20px">
      ${tags.map(t=>`<span class="tag accent" style="cursor:pointer;padding:6px 14px;font-size:0.83rem">${t}
        <span style="margin-left:6px;opacity:0.5;cursor:pointer" onclick="Utils.toast('刪除標籤需 GAS 連線','info')">×</span>
      </span>`).join('')}
    </div>
    <div style="display:flex;gap:8px;max-width:400px">
      <input type="text" placeholder="新增標籤…" style="flex:1" />
      <button class="btn-primary" onclick="Utils.toast('新增標籤需 GAS 連線後啟用','info')">新增</button>
    </div>`;
  },

  tabSheets() {
    const status = API.getStatus();
    const saved  = localStorage.getItem('impr_gas_url') || '';
    const displayUrl = saved || CONFIG.GAS_ENDPOINT;
    const isDemo = status.isDemoMode;
    const modeColor = isDemo ? 'rgba(255,170,0,0.1)' : 'rgba(34,197,94,0.08)';
    const modeBorder = isDemo ? 'rgba(255,170,0,0.3)' : 'rgba(34,197,94,0.3)';
    const modeColor2 = isDemo ? 'var(--warning)' : 'var(--success)';
    const modeIcon = isDemo ? '⚠️' : '✅';
    const modeText = isDemo ? 'Demo 模式（資料不會存入 Sheets）' : '已連線 Google Sheets';
    return '<div class="settings-section-title">📊 Google Apps Script 連結設定</div>' +
    '<div style="margin-bottom:20px;padding:14px 18px;background:'+modeColor+';border:1px solid '+modeBorder+';border-radius:var(--r-md);display:flex;align-items:center;gap:12px">' +
      '<span style="font-size:1.4rem">'+modeIcon+'</span>' +
      '<div>' +
        '<div style="font-weight:700;color:'+modeColor2+';font-size:0.9rem">'+modeText+'</div>' +
        '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;font-family:var(--font-mono)">來源：'+status.source+' URL：'+status.endpoint.slice(0,50)+(status.endpoint.length>50?'…':'')+'</div>' +
      '</div>' +
    '</div>' +
    '<div class="form-field" style="max-width:640px;margin-bottom:12px">' +
      '<label>GAS Web App URL <span style="color:var(--danger)">*</span></label>' +
      '<input type="text" id="gasUrl" value="'+(saved.includes('YOUR_DEPLOYMENT_ID')||!saved?'':saved)+'" placeholder="https://script.google.com/macros/s/AKfycb.../exec" style="font-family:var(--font-mono);font-size:0.82rem" />' +
      '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">格式：https://script.google.com/macros/s/<strong>你的ID</strong>/exec</div>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-bottom:20px">' +
      '<button class="btn-primary" onclick="SettingsPage.saveGasUrl()">💾 儲存並套用</button>' +
      '<button class="btn-secondary" onclick="SettingsPage.testConnection()">🔍 診斷連線</button>' +
      (!isDemo ? '<button class="btn-secondary" onclick="SettingsPage.clearGasUrl()" style="color:var(--danger)">🗑 清除 URL</button>' : '') +
    '</div>' +
    '<div id="connStatus"></div>' +
    '<div style="margin:24px 0 12px" class="settings-section-title">📋 部署步驟</div>' +
    '<div style="padding:16px;background:var(--bg-elevated);border-radius:var(--r-md)">' +
      '<ol style="font-size:0.83rem;color:var(--text-secondary);line-height:2.2;padding-left:18px">' +
        '<li>開啟 Google Sheets → <strong>擴充功能 → Apps Script</strong></li>' +
        '<li>貼上 gas/Code.gs 全部內容 → 儲存</li>' +
        '<li>選函式 <code style="background:var(--bg-surface);padding:1px 6px;border-radius:3px">setupSheets</code> → ▶ 執行（第一次須授權）</li>' +
        '<li>點「<strong>部署 → 新增部署</strong>」→ 類型：網頁應用程式 → 存取：<strong>所有人</strong> → 複製 URL</li>' +
        '<li>貼上到上方欄位 → 儲存並套用 → 診斷連線確認 ✅</li>' +
      '</ol>' +
    '</div>' +
    '<div style="margin:20px 0 12px" class="settings-section-title">必要工作表</div>' +
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">' +
      Object.values(CONFIG.SHEETS).map(s=>'<div style="padding:9px 12px;background:var(--bg-elevated);border-radius:var(--r-sm);font-family:var(--font-mono);font-size:0.8rem;color:var(--text-secondary)">📄 '+s+'</div>').join('') +
    '</div>';
  },

  tabAbout() {
    return `<div class="settings-section-title">ℹ️ 關於系統</div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;align-items:center;gap:16px;padding:20px;background:var(--bg-elevated);border-radius:var(--r-md)">
        <div class="brand-mark" style="width:56px;height:56px;font-size:1.3rem">iP</div>
        <div>
          <div style="font-size:1.1rem;font-weight:700">${CONFIG.APP_NAME}</div>
          <div style="font-size:0.83rem;color:var(--text-muted)">客戶與供應商管理系統 · 版本 ${CONFIG.APP_VERSION}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${CONFIG.COMPANY}</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">系統版本</div><div class="info-value mono">v${CONFIG.APP_VERSION}</div></div>
        <div class="info-item"><div class="info-label">技術架構</div><div class="info-value">GitHub Pages + Google Apps Script</div></div>
        <div class="info-item"><div class="info-label">資料庫</div><div class="info-value">Google Sheets</div></div>
        <div class="info-item"><div class="info-label">建置日期</div><div class="info-value mono">2025-05-10</div></div>
      </div>
      <div style="padding:14px;background:var(--bg-elevated);border-radius:var(--r-sm);font-size:0.82rem;color:var(--text-muted);line-height:1.7">
        此系統為 imPR 新動力公關顧問內部使用之 CRM+VMS 系統。<br>
        前端部署於 GitHub Pages，後端使用 Google Apps Script，資料存儲於 Google Sheets。<br>
        © 2025 新動力公共關係顧問股份有限公司 · 內部系統，請勿對外散布。
      </div>
    </div>`;
  },

  saveGasUrl() {
    const url = document.getElementById('gasUrl')?.value?.trim();
    if (!url) { Utils.toast('請輸入 GAS URL','warning'); return; }
    if (!url.startsWith('https://script.google.com/macros/s/')) {
      Utils.toast('URL 格式不正確，請確認是否為 GAS 部署網址','error'); return;
    }
    localStorage.setItem('impr_gas_url', url);
    Utils.toast('✅ 已儲存！正在重新載入系統…','success');
    setTimeout(() => location.reload(), 1200);
  },

  clearGasUrl() {
    if (!confirm('確定要清除 GAS URL？系統將回到 Demo 模式。')) return;
    localStorage.removeItem('impr_gas_url');
    Utils.toast('已清除，重新載入中…','info');
    setTimeout(() => location.reload(), 1000);
  },

  async testConnection() {
    const url = document.getElementById('gasUrl')?.value?.trim();
    const statusEl = document.getElementById('connStatus');
    if (!url || url.includes('YOUR_DEPLOYMENT_ID')) {
      statusEl.innerHTML = `<div style="padding:12px;background:rgba(255,170,0,0.08);border:1px solid rgba(255,170,0,0.2);border-radius:8px;color:var(--warning)">
        ⚠️ 請先輸入 GAS URL 再測試</div>`; return;
    }
    statusEl.innerHTML = `<div style="color:var(--text-muted);padding:8px">🔍 診斷中，請稍候…</div>`;
    const pingUrl = url.includes('?') ? url + '&action=ping' : url + '?action=ping';
    try {
      const res  = await fetch(pingUrl, { method:'GET', mode:'cors' });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) {
        statusEl.innerHTML = `<div style="padding:12px;background:rgba(255,77,109,0.08);border:1px solid rgba(255,77,109,0.2);border-radius:8px">
          <div style="color:var(--danger);font-weight:600;margin-bottom:6px">✕ 回應格式錯誤（非 JSON）</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">可能原因：GAS 部署未選「所有人可存取」，或 Code.gs 有語法錯誤</div>
          <details style="margin-top:8px"><summary style="cursor:pointer;font-size:0.78rem;color:var(--text-muted)">查看原始回應</summary>
          <pre style="font-size:0.72rem;margin-top:4px;overflow:auto;max-height:100px">${text.slice(0,300)}</pre></details>
        </div>`; return;
      }
      if (data.success) {
        statusEl.innerHTML = `<div style="padding:12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px">
          <div style="color:var(--success);font-weight:600;margin-bottom:4px">✅ 連線成功！</div>
          <div style="font-size:0.8rem;color:var(--text-secondary)">
            GAS 版本：${data.version||'—'} ／ 伺服器時間：${data.timestamp||'—'}
          </div>
          <div style="margin-top:8px">
            <button class="btn-primary" style="font-size:0.8rem"
              onclick="SettingsPage.saveGasUrl()">💾 儲存並套用此 URL</button>
          </div>
        </div>`;
      } else {
        statusEl.innerHTML = `<div style="padding:12px;background:rgba(255,77,109,0.08);border:1px solid rgba(255,77,109,0.2);border-radius:8px">
          <div style="color:var(--danger);font-weight:600">✕ GAS 回應失敗</div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">${data.message||'未知錯誤'}</div>
        </div>`;
      }
    } catch(e) {
      statusEl.innerHTML = `<div style="padding:12px;background:rgba(255,77,109,0.08);border:1px solid rgba(255,77,109,0.2);border-radius:8px">
        <div style="color:var(--danger);font-weight:600;margin-bottom:6px">✕ 無法連線到 GAS</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px">錯誤：${e.message}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);line-height:1.8">
          請確認：<br>
          1️⃣ GAS 已部署（不是只儲存，要點「部署」）<br>
          2️⃣ 部署設定「誰可以存取」= <strong>所有人</strong><br>
          3️⃣ URL 格式為 https://script.google.com/macros/s/.../exec<br>
          4️⃣ 修改 Code.gs 後必須重新部署（版本會更新）
        </div>
      </div>`;
    }
  },

  openAddUser() { Utils.toast('新增使用者功能需 GAS 連線後啟用','info'); },
};

/* ════ EvaluationsPage ════ */
const EvaluationsPage = {
  state: { evals:[], vendor:'all' },

  MOCK: [
    { id:'E001', vendorId:'V001', vendor:'富立音響工程有限公司', project:'6G標準峰會 2026', date:'2025-04-20', punctual:5, quality:5, price:4, overall:4.8, notes:'設備完整，準時到場，音質表現優異', reviewer:'張佳豪' },
    { id:'E002', vendorId:'V008', vendor:'藍鯊攝影工作室', project:'APEC衛生政策研討會', date:'2025-03-15', punctual:5, quality:5, price:5, overall:5.0, notes:'攝影品質超出預期，RAW檔交付快速', reviewer:'陳明志' },
    { id:'E003', vendorId:'V003', vendor:'捷勝舞台設計工程', project:'2025海洋科技論壇', date:'2025-02-28', punctual:4, quality:5, price:4, overall:4.6, notes:'搭設精緻，唯搭建時間略長', reviewer:'王雅婷' },
    { id:'E004', vendorId:'V005', vendor:'翻騰口譯有限公司', project:'NCC數位韌性論壇', date:'2025-01-15', punctual:5, quality:4, price:4, overall:4.7, notes:'口譯流暢，中英日三語切換順利', reviewer:'張佳豪' },
  ],

  async render() {
    window.CurrentPage = EvaluationsPage;
    document.getElementById('pageContent').innerHTML = Utils.loadingHtml();
    await new Promise(r=>setTimeout(r,200));
    EvaluationsPage.state.evals=[...EvaluationsPage.MOCK];
    EvaluationsPage.renderPage();
  },

  search(val) {
    const q=val.toLowerCase();
    EvaluationsPage.state.evals=EvaluationsPage.MOCK.filter(e=>e.vendor.toLowerCase().includes(q)||e.project.toLowerCase().includes(q));
    EvaluationsPage.renderPage();
  },

  renderPage() {
    const content=document.getElementById('pageContent');
    const {evals}=EvaluationsPage.state;
    content.innerHTML=`
      <div class="list-controls">
        <div class="list-filters"><span style="font-size:0.8rem;color:var(--text-muted)">共 ${evals.length} 筆評價紀錄</span></div>
        <button class="btn-secondary" style="font-size:0.78rem" onclick="EvaluationsPage.exportCsv()">匯出 CSV</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${!evals.length?Utils.emptyHtml('⭐','尚無評價紀錄','每次專案結束後記錄供應商評分'):
          evals.map(e=>`
            <div class="dashboard-card">
              <div style="padding:18px 20px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                  <div>
                    <div style="font-weight:700;font-size:0.92rem">${Utils.escapeHtml(e.vendor)}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted)">專案：${Utils.escapeHtml(e.project)} · ${e.date}</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-size:1.6rem;font-weight:700;font-family:var(--font-mono);color:var(--accent)">${e.overall.toFixed(1)}</div>
                    ${Utils.stars(e.overall)}
                  </div>
                </div>
                <div class="rating-widget">
                  ${[['準時程度',e.punctual],['品質水準',e.quality],['價格合理',e.price]].map(([l,s])=>`
                    <div class="rating-row">
                      <div class="rating-label">${l}</div>
                      <div class="rating-bar-wrap"><div class="rating-bar" style="width:${(s/5)*100}%"></div></div>
                      <div class="rating-score">${s}.0</div>
                    </div>`).join('')}
                </div>
                ${e.notes?`<div style="margin-top:12px;font-size:0.83rem;color:var(--text-secondary);padding:10px;background:var(--bg-elevated);border-radius:var(--r-sm)">"${Utils.escapeHtml(e.notes)}" — ${e.reviewer}</div>`:''}
              </div>
            </div>`).join('')}
      </div>`;
  },

  exportCsv() {
    const {evals}=EvaluationsPage.state;
    const h=['供應商','專案','日期','準時','品質','價格','整體評分','備註','評分人'];
    const r=evals.map(e=>[e.vendor,e.project,e.date,e.punctual,e.quality,e.price,e.overall.toFixed(1),e.notes||'',e.reviewer]);
    const csv=[h,...r].map(row=>row.map(v=>`"${v}"`).join(',')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const el=document.createElement('a'); el.href=url; el.download=`imPR_供應商評價_${new Date().toISOString().slice(0,10)}.csv`;
    el.click(); URL.revokeObjectURL(url); Utils.toast('已匯出 CSV','success');
  },
};
