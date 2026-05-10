/* ════════════════════════════════════════════════════════════
   pages/contacts.js  v1.4
   GAS 連線：讀真實 Contacts Sheet
   Demo 模式：顯示示範資料
   ════════════════════════════════════════════════════════════ */

const ContactsPage = {
  state: { contacts:[], total:0, page:1, search:'' },

  // Demo 模式示範資料（api.js isDemoMode = true 時使用）
  DEMO_DATA: [
    { id:'CT001', name:'王志明', title:'數位轉型處長', dept:'數位轉型處',      company:'數位發展部',             companyId:'C001', phone:'02-2356-6101', email:'zmwang@moda.gov.tw',  line:'',           isPrimary:true,  notes:'決策窗口，週三下午可聯繫', createdAt:'2023-03-15' },
    { id:'CT002', name:'陳雅琪', title:'科長',         dept:'數位轉型處',      company:'數位發展部',             companyId:'C001', phone:'02-2356-6102', email:'yqchen@moda.gov.tw',  line:'',           isPrimary:false, notes:'負責採購流程',             createdAt:'2023-03-15' },
    { id:'CT003', name:'李文傑', title:'副秘書長',     dept:'秘書處',          company:'中華民國醫師公會',       companyId:'C004', phone:'02-2392-1326', email:'wjlee@tma.tw',        line:'li-wen-jie', isPrimary:true,  notes:'主要決策人，回應速度快',   createdAt:'2021-11-05' },
    { id:'CT004', name:'黃淑芬', title:'活動組長',     dept:'活動組',          company:'中華民國醫師公會',       companyId:'C004', phone:'02-2392-1320', email:'sfhuang@tma.tw',      line:'huang.sf',   isPrimary:false, notes:'負責現場執行協調',         createdAt:'2021-11-05' },
    { id:'CT005', name:'林佳慧', title:'副主委',       dept:'主委室',          company:'國家通訊傳播委員會',     companyId:'C003', phone:'02-2500-6601', email:'jhlin@ncc.gov.tw',    line:'',           isPrimary:true,  notes:'主要窗口，需提早預約',     createdAt:'2023-01-10' },
    { id:'CT006', name:'張育銘', title:'處長',         dept:'海洋資源保育處',  company:'海洋委員會',             companyId:'C005', phone:'07-335-0025',  email:'ymzhang@oac.gov.tw',  line:'',           isPrimary:true,  notes:'高雄聯絡',                 createdAt:'2023-06-01' },
    { id:'CT007', name:'吳政翰', title:'研究員',       dept:'研發處',          company:'工業技術研究院',         companyId:'C006', phone:'03-591-4000',  email:'jhwu@itri.org.tw',    line:'',           isPrimary:true,  notes:'初步接洽窗口',             createdAt:'2024-02-14' },
  ],

  async render() {
    window.CurrentPage = ContactsPage;
    document.getElementById('pageContent').innerHTML = Utils.loadingHtml();
    await ContactsPage.load();
  },

  async load() {
    const { search } = ContactsPage.state;
    let data = [];

    try {
      const res = await API.call('getContacts', { search });
      if (res && res.success) {
        data = res.data || [];
      } else {
        throw new Error(res?.message || '載入失敗');
      }
    } catch(e) {
      // GAS 失敗或 Demo 模式 → 用示範資料
      data = [...ContactsPage.DEMO_DATA];
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          (c.email||'').toLowerCase().includes(q)
        );
      }
    }

    ContactsPage.state.contacts = data;
    ContactsPage.state.total    = data.length;
    ContactsPage.renderPage();
  },

  search(val) { ContactsPage.state.search = val; ContactsPage.load(); },

  renderPage() {
    const content = document.getElementById('pageContent');
    const { contacts, total } = ContactsPage.state;

    content.innerHTML = `
      <div class="list-controls">
        <div class="list-filters">
          <span style="font-size:0.8rem;color:var(--text-muted)">共 ${total} 位聯絡人</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary" style="font-size:0.78rem" onclick="ModalManager.openContactForm()">＋ 新增聯絡人</button>
          <button class="btn-secondary" style="font-size:0.78rem" onclick="ContactsPage.exportCsv()">匯出 CSV</button>
        </div>
      </div>

      ${!contacts.length
        ? Utils.emptyHtml('👤','尚無聯絡人資料','新增客戶後，可在客戶詳情頁新增聯絡人')
        : `<div class="data-table-wrap">
            <table class="data-table">
              <thead><tr>
                <th>姓名</th><th>職稱 / 部門</th><th>所屬公司</th>
                <th>電話</th><th>Email</th><th>LINE</th><th>主要聯絡</th><th>操作</th>
              </tr></thead>
              <tbody>
                ${contacts.map(c => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div style="width:30px;height:30px;border-radius:50%;
                        background:${Utils.avatarColor(c.name)};
                        display:flex;align-items:center;justify-content:center;
                        font-size:0.75rem;font-weight:700;color:#fff;flex-shrink:0">${c.name[0]}</div>
                      <span style="font-weight:600">${Utils.escapeHtml(c.name)}</span>
                    </div>
                  </td>
                  <td>
                    <div style="font-size:0.85rem">${Utils.escapeHtml(c.title||'—')}</div>
                    <div style="font-size:0.73rem;color:var(--text-muted)">${Utils.escapeHtml(c.dept||'')}</div>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px">
                      ${Utils.companyAvatar(c.company||'?', 22)}
                      <span style="font-size:0.82rem">${Utils.escapeHtml(c.company||'—')}</span>
                    </div>
                  </td>
                  <td style="font-size:0.82rem;font-family:var(--font-mono)">${c.phone||'—'}</td>
                  <td>
                    ${c.email
                      ? `<a href="mailto:${c.email}" style="color:var(--accent);font-size:0.82rem"
                          onclick="event.stopPropagation()">${c.email}</a>`
                      : '<span style="color:var(--text-muted)">—</span>'}
                  </td>
                  <td style="font-size:0.82rem;color:var(--text-muted)">${c.line||'—'}</td>
                  <td>
                    ${c.isPrimary
                      ? '<span class="chip chip-active">主要</span>'
                      : '<span style="color:var(--text-muted);font-size:0.78rem">—</span>'}
                  </td>
                  <td>
                    <div style="display:flex;gap:4px">
                      <button class="btn-icon" onclick="ContactsPage.openEdit('${c.id}')" title="編輯">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.2"
                            stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button class="btn-icon" onclick="ContactsPage.deleteContact('${c.id}','${Utils.escapeHtml(c.name)}')"
                        title="刪除" style="color:var(--danger)">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10 3.5l-.6 7a1 1 0 01-1 .9H4.6a1 1 0 01-1-.9L3 3.5"
                            stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      ${c.email ? `
                      <a href="mailto:${c.email}" class="btn-icon" title="寄信"
                        onclick="event.stopPropagation()"
                        style="display:flex;align-items:center;justify-content:center;text-decoration:none;color:var(--text-secondary)">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <rect x="1" y="3" width="11" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>
                          <path d="M1 4l5.5 3.5L12 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                        </svg>
                      </a>` : ''}
                    </div>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`
      }`;
  },

  openEdit(id) {
    const c = ContactsPage.state.contacts.find(x => x.id === id);
    if (c) ModalManager.openContactForm(c);
  },

  async deleteContact(id, name) {
    if (!confirm(`確定要刪除聯絡人「${name}」？`)) return;
    try {
      const res = await API.call('deleteContact', { id });
      if (res.success) {
        Utils.toast(`已刪除：${name}`, 'success');
        ContactsPage.load();
      } else {
        Utils.toast('刪除失敗：' + (res.message||''), 'error');
      }
    } catch(e) {
      Utils.toast('刪除失敗：' + e.message, 'error');
    }
  },

  exportCsv() {
    const { contacts } = ContactsPage.state;
    const h = ['姓名','職稱','部門','所屬公司','電話','Email','LINE','是否主要聯絡','備註'];
    const r = contacts.map(c => [
      c.name, c.title||'', c.dept||'', c.company||'',
      c.phone||'', c.email||'', c.line||'',
      c.isPrimary?'是':'否', c.notes||''
    ]);
    const csv = [h,...r].map(row => row.map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imPR_聯絡人_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.toast('已匯出 CSV', 'success');
  },
};
