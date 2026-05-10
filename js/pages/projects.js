/* ════════════════════════════════════════════════════════════
   pages/projects.js — Project Association Page (完整版)
   ════════════════════════════════════════════════════════════ */

const ProjectsPage = {
  state: { projects:[], search:'', status:'all' },

  MOCK: [
    { id:'P001', name:'6G標準全球峰會 2026', type:'國際研討會', client:'數位發展部', clientId:'C001', status:'執行中', date:'2026-09-15', venue:'台北國際會議中心 TICC', budget:'NT$3,200,000', vendors:['富立音響','光影視覺','翻騰口譯','藍鯊攝影'], pm:'張佳豪', tags:['旗艦案','國際'] },
    { id:'P002', name:'2025海洋科技與資源論壇', type:'論壇', client:'海洋委員會', clientId:'C005', status:'執行中', date:'2025-08-22', venue:'高雄展覽館 B廳', budget:'NT$680,000', vendors:['捷勝舞台','豐群人力','全彩數位印刷'], pm:'王雅婷', tags:['政府標案'] },
    { id:'P003', name:'2025 NCC數位韌性國際研討會', type:'國際研討會', client:'國家通訊傳播委員會', clientId:'C003', status:'提案中', date:'2025-10-18', venue:'台大集思會議中心', budget:'NT$1,450,000', vendors:[], pm:'張佳豪', tags:['國際','電信'] },
    { id:'P004', name:'2026醫師公會全國聯合年會', type:'醫學年會', client:'中華民國醫師公會', clientId:'C004', status:'簽約完成', date:'2026-03-20', venue:'台北遠東香格里拉飯店', budget:'NT$2,100,000', vendors:['富立音響','藍鯊攝影','全視野直播','豐群人力'], pm:'王雅婷', tags:['醫學','年會'] },
    { id:'P005', name:'APEC衛生政策血糖防治研討會', type:'國際研討會', client:'衛生福利部', clientId:'C002', status:'完成', date:'2025-03-14', venue:'台北君悅酒店', budget:'NT$980,000', vendors:['富立音響','翻騰口譯','藍鯊攝影'], pm:'陳明志', tags:['衛福部','政府標案','國際'] },
  ],

  async render() {
    window.CurrentPage = ProjectsPage;
    document.getElementById('pageContent').innerHTML = Utils.loadingHtml();
    await ProjectsPage.load();
  },

  async load() {
    const { search, status } = ProjectsPage.state;
    let data = [];
    const isDemo = API.getStatus().isDemoMode;

    if (isDemo) {
      data = [...ProjectsPage.MOCK];
      if (search) {
        const q=search.toLowerCase();
        data=data.filter(p=>p.name.toLowerCase().includes(q)||p.client.toLowerCase().includes(q));
      }
      if (status!=='all') data=data.filter(p=>p.status===status);
    } else {
      try {
        const res = await API.call('getProjects', { search, status: status==='all'?'':status });
        if (res && res.success) {
          data = res.data || [];
        } else {
          Utils.toast('載入失敗：' + (res?.message||''), 'error');
        }
      } catch(e) {
        Utils.toast('載入失敗：' + e.message, 'error');
      }
    }

    ProjectsPage.state.projects = data;
    ProjectsPage.renderPage();
  },

  search(val) {
    ProjectsPage.state.search = val;
    ProjectsPage.load();
  },

  renderPage() {
    const content=document.getElementById('pageContent');
    const {projects}=ProjectsPage.state;
    const statusColors={'執行中':'chip-active','提案中':'chip-potential','簽約完成':'chip-teal','完成':'chip-inactive','暫停':'chip-warning'};
    content.innerHTML=`
      <div class="list-controls">
        <div class="list-filters">
          <select class="filter-select" onchange="ProjectsPage.filterStatus(this.value)">
            ${['all','執行中','提案中','簽約完成','完成'].map(s=>`<option value="${s}">${s==='all'?'全部狀態':s}</option>`).join('')}
          </select>
        </div>
        <span style="font-size:0.8rem;color:var(--text-muted);align-self:center">共 ${projects.length} 個專案</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px">
        ${projects.map(p=>`
          <div class="dashboard-card" style="cursor:pointer;transition:border-color 0.2s"
               onclick="ProjectsPage.openDetail('${p.id}')"
               onmouseenter="this.style.borderColor='var(--accent)'"
               onmouseleave="this.style.borderColor='var(--border)'">
            <div style="padding:20px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
                <div style="font-weight:700;font-size:0.92rem;line-height:1.3;flex:1;margin-right:10px">${Utils.escapeHtml(p.name)}</div>
                <span class="chip ${statusColors[p.status]||'chip-inactive'}">${p.status}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                <div style="display:flex;gap:8px;align-items:center">
                  <span>🏢</span><span>${Utils.escapeHtml(p.client)}</span>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                  <span>📍</span><span>${Utils.escapeHtml(p.venue)}</span>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                  <span>📅</span><span style="font-family:var(--font-mono)">${p.date}</span>
                  <span style="margin-left:auto;color:var(--accent);font-weight:600">${p.budget}</span>
                </div>
              </div>
              ${p.vendors.length?`
              <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
                <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px">配合供應商</div>
                <div class="tag-list">${p.vendors.map(v=>`<span class="tag">${v}</span>`).join('')}</div>
              </div>`:''}
              <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
                <span style="font-size:0.72rem;color:var(--text-muted)">PM: ${p.pm}</span>
                ${Utils.tags(p.tags)}
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  },

  openDetail(id) {
    const p=ProjectsPage.MOCK.find(x=>x.id===id); if(!p) return;
    const body=`
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="padding-bottom:14px;border-bottom:1px solid var(--border)">
          <div style="font-size:1.05rem;font-weight:700;margin-bottom:6px">${Utils.escapeHtml(p.name)}</div>
          <div style="display:flex;gap:8px">${Utils.tags(p.tags,true)}</div>
        </div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">專案類型</div><div class="info-value">${p.type}</div></div>
          <div class="info-item"><div class="info-label">狀態</div><div class="info-value">${p.status}</div></div>
          <div class="info-item"><div class="info-label">主辦客戶</div><div class="info-value">${Utils.escapeHtml(p.client)}</div></div>
          <div class="info-item"><div class="info-label">活動日期</div><div class="info-value mono">${p.date}</div></div>
          <div class="info-item"><div class="info-label">場地</div><div class="info-value">${Utils.escapeHtml(p.venue)}</div></div>
          <div class="info-item"><div class="info-label">預算金額</div><div class="info-value" style="color:var(--accent);font-weight:700">${p.budget}</div></div>
          <div class="info-item"><div class="info-label">專案負責人</div><div class="info-value">${p.pm}</div></div>
        </div>
        ${p.vendors.length?`<div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">配合供應商 (${p.vendors.length}家)</div>
          <div class="tag-list">${p.vendors.map(v=>`<span class="tag accent">${v}</span>`).join('')}</div>
        </div>`:''}
      </div>`;
    ModalManager.openDetailOnly(`專案詳情：${p.name}`, body);
  },

  filterStatus(s) {
    ProjectsPage.state.status = s;
    ProjectsPage.load();
  },
};
