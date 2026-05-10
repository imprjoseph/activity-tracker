/* ════════════════════════════════════════════════════════════
   pages/contacts.js — Contacts Management Page (完整版)
   ════════════════════════════════════════════════════════════ */

const ContactsPage = {
  state: { contacts:[], total:0, page:1, search:'', company:'all' },

  MOCK: [
    { id:'CT001', name:'王志明', title:'數位轉型處長', dept:'數位轉型處', company:'數位發展部', companyId:'C001', phone:'02-2356-6101', email:'zmwang@moda.gov.tw', line:'', isPrimary:true, notes:'決策窗口，週三下午可聯繫', createdAt:'2023-03-15' },
    { id:'CT002', name:'陳雅琪', title:'科長', dept:'數位轉型處', company:'數位發展部', companyId:'C001', phone:'02-2356-6102', email:'yqchen@moda.gov.tw', line:'', isPrimary:false, notes:'負責採購流程', createdAt:'2023-03-15' },
    { id:'CT003', name:'李文傑', title:'副秘書長', dept:'秘書處', company:'中華民國醫師公會', companyId:'C004', phone:'02-2392-1326', email:'wjlee@tma.tw', line:'li-wen-jie', isPrimary:true, notes:'主要決策人，回應速度快', createdAt:'2021-11-05' },
    { id:'CT004', name:'黃淑芬', title:'活動組長', dept:'活動組', company:'中華民國醫師公會', companyId:'C004', phone:'02-2392-1320', email:'sfhuang@tma.tw', line:'huang.sf', isPrimary:false, notes:'負責現場執行協調', createdAt:'2021-11-05' },
    { id:'CT005', name:'林佳慧', title:'副主委', dept:'主委室', company:'國家通訊傳播委員會', companyId:'C003', phone:'02-2500-6601', email:'jhlin@ncc.gov.tw', line:'', isPrimary:true, notes:'主要窗口，需提早預約', createdAt:'2023-01-10' },
    { id:'CT006', name:'張育銘', title:'處長', dept:'海洋資源保育處', company:'海洋委員會', companyId:'C005', phone:'07-335-0025', email:'ymzhang@oac.gov.tw', line:'', isPrimary:true, notes:'高雄聯絡', createdAt:'2023-06-01' },
    { id:'CT007', name:'吳政翰', title:'研究員', dept:'研發處', company:'工業技術研究院', companyId:'C006', phone:'03-591-4000', email:'jhwu@itri.org.tw', line:'', isPrimary:true, notes:'初步接洽窗口', createdAt:'2024-02-14' },
  ],

  async render() {
    window.CurrentPage = ContactsPage;
    document.getElementById('pageContent').innerHTML = Utils.loadingHtml();
    await ContactsPage.load();
  },

  async load() {
    await new Promise(r => setTimeout(r, 200));
    let data = [...ContactsPage.MOCK];
    const { search } = ContactsPage.state;
    if (search) {
      const q=search.toLowerCase();
      data=data.filter(c=>c.name.toLowerCase().includes(q)||c.company.toLowerCase().includes(q)||c.email.toLowerCase().includes(q));
    }
    ContactsPage.state.contacts=data;
    ContactsPage.state.total=data.length;
    ContactsPage.renderPage();
  },

  search(val) { ContactsPage.state.search=val; ContactsPage.load(); },

  renderPage() {
    const content=document.getElementById('pageContent');
    const {contacts,total}=ContactsPage.state;
    content.innerHTML=`
      <div class="list-controls">
        <div class="list-filters">
          <span style="font-size:0.8rem;color:var(--text-muted)">共 ${total} 位聯絡人</span>
        </div>
        <button class="btn-secondary" style="font-size:0.78rem" onclick="ContactsPage.exportCsv()">匯出 CSV</button>
      </div>
      ${!contacts.length ? Utils.emptyHtml('👤','尚無聯絡人','新增客戶後，可為每家公司建立多位聯絡人') :
        `<div class="data-table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>姓名</th><th>職稱 / 部門</th><th>所屬公司</th>
              <th>電話</th><th>Email</th><th>LINE</th><th>主要聯絡</th><th>操作</th>
            </tr></thead>
            <tbody>${contacts.map(c=>`
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:30px;height:30px;border-radius:50%;background:${Utils.avatarColor(c.name)};display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:#fff;flex-shrink:0">${c.name[0]}</div>
                    <span style="font-weight:600">${Utils.escapeHtml(c.name)}</span>
                  </div>
                </td>
                <td>
                  <div style="font-size:0.85rem">${Utils.escapeHtml(c.title)}</div>
                  <div style="font-size:0.73rem;color:var(--text-muted)">${Utils.escapeHtml(c.dept)}</div>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    ${Utils.companyAvatar(c.company,22)}
                    <span style="font-size:0.82rem">${Utils.escapeHtml(c.company)}</span>
                  </div>
                </td>
                <td style="font-size:0.82rem;font-family:var(--font-mono)">${c.phone||'—'}</td>
                <td><a href="mailto:${c.email}" style="color:var(--accent);font-size:0.82rem" onclick="event.stopPropagation()">${c.email||'—'}</a></td>
                <td style="font-size:0.82rem;color:var(--text-muted)">${c.line||'—'}</td>
                <td>${c.isPrimary?'<span class="chip chip-active">主要</span>':'<span style="color:var(--text-muted);font-size:0.78rem">—</span>'}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn-icon" onclick="ContactsPage.openEdit('${c.id}')" title="編輯">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <a href="mailto:${c.email}" class="btn-icon" title="寄信" onclick="event.stopPropagation()" style="display:flex;align-items:center;justify-content:center;text-decoration:none;color:var(--text-secondary)">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="3" width="11" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M1 4l5.5 3.5L12 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                    </a>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}`;
  },

  openEdit(id) {
    const c=ContactsPage.MOCK.find(x=>x.id===id); if(!c) return;
    ModalManager.openContactForm(c);
  },

  exportCsv() {
    const {contacts}=ContactsPage.state;
    const h=['姓名','職稱','部門','所屬公司','電話','Email','LINE','是否主要聯絡'];
    const r=contacts.map(c=>[c.name,c.title,c.dept,c.company,c.phone||'',c.email||'',c.line||'',c.isPrimary?'是':'否']);
    const csv=[h,...r].map(row=>row.map(v=>`"${v}"`).join(',')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const el=document.createElement('a'); el.href=url; el.download=`imPR_聯絡人_${new Date().toISOString().slice(0,10)}.csv`;
    el.click(); URL.revokeObjectURL(url); Utils.toast('已匯出 CSV','success');
  },
};
