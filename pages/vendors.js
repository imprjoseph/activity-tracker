/* ════════════════════════════════════════════════════════════
   pages/vendors.js — Vendor Management Page
   ════════════════════════════════════════════════════════════ */

const VendorsPage = {
  state: {
    vendors: [],
    total: 0,
    page: 1,
    search: '',
    category: 'all',
    status: 'all',
  },

  async render() {
    window.CurrentPage = VendorsPage;
    const content = document.getElementById('pageContent');
    content.innerHTML = Utils.loadingHtml();
    await VendorsPage.load();
  },

  async load() {
    const { search, category, status } = VendorsPage.state;
    const res = await API.getVendors({ search, category, status });
    if (!res.success) { Utils.toast('載入失敗', 'error'); return; }
    VendorsPage.state.vendors = res.data;
    VendorsPage.state.total   = res.total || res.data.length;
    document.getElementById('badge-vendors').textContent = VendorsPage.state.total;
    VendorsPage.renderPage();
  },

  search(val) {
    VendorsPage.state.search = val;
    VendorsPage.state.page = 1;
    VendorsPage.load();
  },

  renderPage() {
    const content = document.getElementById('pageContent');
    const cats = ['all', ...CONFIG.VENDOR_CATEGORIES];
    const catOptions = cats.map(c =>
      `<option value="${c}" ${VendorsPage.state.category===c?'selected':''}>${c==='all'?'所有類型':c}</option>`
    ).join('');
    const statusOptions = [
      ['all','所有狀態'],['配合中','配合中'],['備用','備用'],['停止配合','停止配合']
    ].map(([v,l]) => `<option value="${v}" ${VendorsPage.state.status===v?'selected':''}>${l}</option>`).join('');

    const { vendors, page, total } = VendorsPage.state;
    const paged = Utils.paginate(vendors, page, CONFIG.PAGE_SIZE);

    content.innerHTML = `
      <div class="list-controls">
        <div class="list-filters">
          <select class="filter-select" onchange="VendorsPage.filterChange('status', this.value)">${statusOptions}</select>
          <select class="filter-select" onchange="VendorsPage.filterChange('category', this.value)">${catOptions}</select>
          <button class="btn-secondary" onclick="VendorsPage.exportCsv()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            匯出
          </button>
        </div>
        <span style="font-size:0.8rem;color:var(--text-muted);align-self:center">共 ${total} 家供應商</span>
      </div>

      ${!vendors.length
        ? Utils.emptyHtml('🏭', '尚無供應商資料', '點擊右上角「新增供應商」開始建立')
        : `<div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>供應商名稱</th>
                  <th>類型</th>
                  <th>狀態</th>
                  <th>地區</th>
                  <th>聯絡人</th>
                  <th>評分</th>
                  <th>配合專案</th>
                  <th>標籤</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                ${paged.map(v => `
                  <tr onclick="VendorsPage.openDetail('${v.id}')">
                    <td>
                      <div class="company-cell">
                        ${Utils.companyAvatar(v.name)}
                        <div>
                          <div style="font-weight:600;font-size:0.87rem">${Utils.escapeHtml(v.name)}</div>
                          <div style="font-size:0.73rem;color:var(--text-muted);font-family:var(--font-mono)">${v.taxId||''}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="chip chip-potential" style="font-size:0.72rem">${v.category}</span></td>
                    <td>${Utils.statusChip(v.status)}</td>
                    <td style="font-size:0.82rem;color:var(--text-secondary)">${v.region||'—'}</td>
                    <td>
                      <div style="font-size:0.83rem">${Utils.escapeHtml(v.contact||'—')}</div>
                      <div style="font-size:0.72rem;color:var(--text-muted)">${v.phone||''}</div>
                    </td>
                    <td>${Utils.stars(v.rating||0)}</td>
                    <td>
                      <span style="font-size:0.82rem;color:var(--text-secondary)">
                        📁 ${v.projects} 次
                      </span>
                    </td>
                    <td>${Utils.tags(v.tags?.slice(0,2))}</td>
                    <td onclick="event.stopPropagation()">
                      <div style="display:flex;gap:4px">
                        <button class="btn-icon" onclick="VendorsPage.openEdit('${v.id}')" title="編輯">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                        <button class="btn-icon" onclick="VendorsPage.confirmDelete('${v.id}','${Utils.escapeHtml(v.name)}')" title="刪除" style="color:var(--danger)">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10 3.5l-.6 7a1 1 0 01-1 .9H4.6a1 1 0 01-1-.9L3 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${Utils.renderPagination(total, page, CONFIG.PAGE_SIZE, 'VendorsPage.goPage')}
          </div>`
      }
    `;
  },

  filterChange(field, val) {
    VendorsPage.state[field] = val;
    VendorsPage.state.page = 1;
    VendorsPage.load();
  },

  goPage(p) {
    VendorsPage.state.page = p;
    VendorsPage.renderPage();
  },

  openDetail(id) {
    const vendor = VendorsPage.state.vendors.find(v => v.id === id);
    if (!vendor) return;
    ModalManager.openVendorDetail(vendor);
  },

  openEdit(id) {
    const vendor = VendorsPage.state.vendors.find(v => v.id === id);
    if (!vendor) return;
    ModalManager.openVendorForm(vendor);
  },

  async confirmDelete(id, name) {
    if (!confirm(`確定要刪除「${name}」？`)) return;
    const res = await API.deleteVendor(id);
    if (res.success) {
      Utils.toast(`已刪除：${name}`, 'success');
      VendorsPage.load();
    } else {
      Utils.toast('刪除失敗', 'error');
    }
  },

  exportCsv() {
    const { vendors } = VendorsPage.state;
    const headers = ['供應商名稱','統一編號','類型','狀態','地區','聯絡人','電話','評分','配合次數'];
    const rows = vendors.map(v => [
      v.name, v.taxId||'', v.category, v.status,
      v.region||'', v.contact||'', v.phone||'',
      (v.rating||0).toFixed(1), v.projects
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `imPR_供應商清單_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    Utils.toast('已匯出 CSV', 'success');
  },
};
