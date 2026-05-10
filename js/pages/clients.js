/* ════════════════════════════════════════════════════════════
   pages/clients.js — Client Management Page
   ════════════════════════════════════════════════════════════ */

const ClientsPage = {
  state: {
    clients: [],
    total: 0,
    page: 1,
    search: '',
    status: 'all',
    category: 'all',
    level: 'all',
    view: 'table',  // table | card
  },

  async render() {
    window.CurrentPage = ClientsPage;
    const content = document.getElementById('pageContent');
    content.innerHTML = Utils.loadingHtml();
    await ClientsPage.load();
  },

  async load() {
    const { search, status, category, level } = ClientsPage.state;
    let res;
    try {
      res = await API.getClients({ search, status, category, level });
    } catch(e) {
      Utils.toast('GAS 連線失敗：' + e.message, 'error');
      document.getElementById('pageContent').innerHTML = Utils.emptyHtml('⚠️','GAS 連線失敗', e.message);
      return;
    }
    if (!res || !res.success) { Utils.toast('載入失敗', 'error'); return; }
    ClientsPage.state.clients = res.data;
    ClientsPage.state.total   = res.total || res.data.length;
    document.getElementById('badge-clients').textContent = ClientsPage.state.total;
    ClientsPage.renderPage();
  },

  search(val) {
    ClientsPage.state.search = val;
    ClientsPage.state.page = 1;
    ClientsPage.load();
  },

  renderPage() {
    const content = document.getElementById('pageContent');
    const cats = ['all', ...CONFIG.CLIENT_CATEGORIES];
    const catOptions = cats.map(c => `<option value="${c}" ${ClientsPage.state.category===c?'selected':''}>${c==='all'?'所有分類':c}</option>`).join('');
    const statusOptions = [
      ['all','所有狀態'],['合作中','合作中'],['潛在客戶','潛在客戶'],['停用','停用']
    ].map(([v,l]) => `<option value="${v}" ${ClientsPage.state.status===v?'selected':''}>${l}</option>`).join('');
    const levelOptions = [
      ['all','所有等級'],['S 級','S 級'],['A 級','A 級'],['B 級','B 級'],['C 級','C 級'],['潛在','潛在']
    ].map(([v,l]) => `<option value="${v}" ${ClientsPage.state.level===v?'selected':''}>${l}</option>`).join('');

    content.innerHTML = `
      <div class="list-controls">
        <div class="list-filters">
          <select class="filter-select" onchange="ClientsPage.filterChange('status', this.value)">${statusOptions}</select>
          <select class="filter-select" onchange="ClientsPage.filterChange('category', this.value)">${catOptions}</select>
          <select class="filter-select" onchange="ClientsPage.filterChange('level', this.value)">${levelOptions}</select>
          <button class="btn-secondary" onclick="ClientsPage.exportCsv()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            匯出
          </button>
        </div>
        <div class="list-actions">
          <span style="font-size:0.8rem;color:var(--text-muted);align-self:center">共 ${ClientsPage.state.total} 家客戶</span>
          <button class="btn-icon ${ClientsPage.state.view==='table'?'active':''}" onclick="ClientsPage.setView('table')" title="表格">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="6" width="12" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="11" width="12" height="2" rx="0.5" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
          <button class="btn-icon ${ClientsPage.state.view==='card'?'active':''}" onclick="ClientsPage.setView('card')" title="卡片">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
        </div>
      </div>

      ${ClientsPage.state.view === 'table'
        ? ClientsPage.renderTable()
        : ClientsPage.renderCards()
      }
    `;
  },

  renderTable() {
    const { clients, page, total } = ClientsPage.state;
    const paged = Utils.paginate(clients, page, CONFIG.PAGE_SIZE);

    if (!clients.length) return Utils.emptyHtml('🏢', '尚無客戶資料', '點擊右上角「新增客戶」開始建立');

    return `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>公司名稱</th>
              <th>分類</th>
              <th>等級</th>
              <th>狀態</th>
              <th>地區</th>
              <th>聯絡人</th>
              <th>標籤</th>
              <th>建立日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${paged.map(c => `
              <tr onclick="ClientsPage.openDetail('${c.id}')">
                <td>
                  <div class="company-cell">
                    ${Utils.companyAvatar(c.name)}
                    <div>
                      <div style="font-weight:600;font-size:0.87rem">${Utils.escapeHtml(c.name)}</div>
                      <div style="font-size:0.73rem;color:var(--text-muted)">${Utils.escapeHtml(c.nameEn||'')}</div>
                    </div>
                  </div>
                </td>
                <td><span style="font-size:0.82rem;color:var(--text-secondary)">${c.category}</span></td>
                <td>${Utils.levelBadge(c.level)}</td>
                <td>${Utils.statusChip(c.status)}</td>
                <td style="font-size:0.82rem;color:var(--text-secondary)">${c.region||'—'}</td>
                <td>
                  <span style="font-size:0.82rem;color:var(--text-secondary)">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="margin-right:3px"><circle cx="6" cy="4" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M2 10c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                    ${c.contacts} 人
                  </span>
                </td>
                <td>${Utils.tags(c.tags?.slice(0,2))}</td>
                <td style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-muted)">${Utils.formatDate(c.createdAt)}</td>
                <td onclick="event.stopPropagation()">
                  <div style="display:flex;gap:4px">
                    <button class="btn-icon" onclick="ClientsPage.openEdit('${c.id}')" title="編輯">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button class="btn-icon" onclick="ClientsPage.confirmDelete('${c.id}','${Utils.escapeHtml(c.name)}')" title="刪除" style="color:var(--danger)">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10 3.5l-.6 7a1 1 0 01-1 .9H4.6a1 1 0 01-1-.9L3 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${Utils.renderPagination(total, page, CONFIG.PAGE_SIZE, 'ClientsPage.goPage')}
      </div>
    `;
  },

  renderCards() {
    const { clients } = ClientsPage.state;
    if (!clients.length) return Utils.emptyHtml('🏢', '尚無客戶資料', '點擊右上角「新增客戶」開始建立');
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
        ${clients.map(c => `
          <div class="dashboard-card" style="cursor:pointer;transition:border-color 0.2s"
               onclick="ClientsPage.openDetail('${c.id}')"
               onmouseenter="this.style.borderColor='var(--accent)'"
               onmouseleave="this.style.borderColor='var(--border)'">
            <div style="padding:20px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                <div style="display:flex;align-items:center;gap:10px">
                  ${Utils.companyAvatar(c.name, 40)}
                  <div>
                    <div style="font-weight:700;font-size:0.9rem">${Utils.escapeHtml(c.name)}</div>
                    <div style="font-size:0.73rem;color:var(--text-muted)">${c.category}</div>
                  </div>
                </div>
                ${Utils.statusChip(c.status)}
              </div>
              <div style="display:flex;gap:6px;margin-bottom:12px">
                ${Utils.levelBadge(c.level)}
                <span style="font-size:0.78rem;color:var(--text-muted);align-self:center">${c.region||''}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-muted);border-top:1px solid var(--border);padding-top:12px">
                <span>👤 ${c.contacts} 聯絡人</span>
                <span>📁 ${c.projects} 專案</span>
                <span>${Utils.formatDate(c.createdAt)}</span>
              </div>
              ${c.tags?.length ? `<div style="margin-top:10px">${Utils.tags(c.tags)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  filterChange(field, val) {
    ClientsPage.state[field] = val;
    ClientsPage.state.page = 1;
    ClientsPage.load();
  },

  setView(v) {
    ClientsPage.state.view = v;
    ClientsPage.renderPage();
  },

  goPage(p) {
    ClientsPage.state.page = p;
    ClientsPage.renderPage();
    document.getElementById('pageContent').scrollTo(0, 0);
  },

  openDetail(id) {
    const client = ClientsPage.state.clients.find(c => c.id === id);
    if (!client) return;
    ModalManager.openClientDetail(client);
  },

  openEdit(id) {
    const client = ClientsPage.state.clients.find(c => c.id === id);
    if (!client) return;
    ModalManager.openClientForm(client);
  },

  async confirmDelete(id, name) {
    if (!confirm(`確定要刪除「${name}」？此操作無法復原。`)) return;
    const res = await API.deleteClient(id);
    if (res.success) {
      Utils.toast(`已刪除：${name}`, 'success');
      ClientsPage.load();
    } else {
      Utils.toast('刪除失敗', 'error');
    }
  },

  exportCsv() {
    const { clients } = ClientsPage.state;
    const headers = ['公司名稱','公司英文名稱','統一編號','分類','等級','狀態','地區','電話','Email','建立日期'];
    const rows = clients.map(c => [
      c.name, c.nameEn||'', c.taxId||'', c.category, c.level, c.status,
      c.region||'', c.phone||'', c.email||'', c.createdAt
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `imPR_客戶清單_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    Utils.toast('已匯出 CSV', 'success');
  },
};
