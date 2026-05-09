/* ════════════════════════════════════════════════════════════
   pages/activities.js — Activity Timeline Page (完整版)
   ════════════════════════════════════════════════════════════ */

const ActivitiesPage = {
  state: { activities:[], total:0, page:1, search:'', type:'all' },

  MOCK: [
    { id:'A001', type:'CALL',     title:'電話追蹤 — 6G標準峰會確認場地', client:'數位發展部', contact:'王主任', date:'2025-05-10 14:30', content:'確認 TICC 場地預訂，9月15-17日，主辦方已簽核。下週提供正式合約。', nextAction:'等待合約回傳', createdBy:'業務一' },
    { id:'A002', type:'EMAIL',    title:'報價確認信 — 2026醫學年會', client:'中華民國醫師公會', contact:'李秘書長', date:'2025-05-10 11:20', content:'已寄出詳細報價單，含場地、音響、同步口譯三項。', nextAction:'5/17前等待回覆', createdBy:'業務一' },
    { id:'A003', type:'VISIT',    title:'客戶拜訪 — NCC數位韌性論壇提案', client:'國家通訊傳播委員會', contact:'陳副主委', date:'2025-05-09 16:00', content:'簡報完畢，對方對主視覺設計滿意，要求調整議程安排。', nextAction:'調整議程草案後提交', createdBy:'業務一' },
    { id:'A004', type:'QUOTE',    title:'報價單提交 — 6G標準峰會全案', client:'數位發展部', contact:'王主任', date:'2025-05-08 10:30', content:'全案報價 NT$3,200,000，含場地、設備、口譯、直播、主視覺。', nextAction:'等待內部簽核', createdBy:'專案管理' },
    { id:'A005', type:'CONTRACT', title:'合約簽署 — 2025海洋科技論壇', client:'海洋委員會', contact:'黃處長', date:'2025-05-07 09:00', content:'合約金額 NT$680,000，活動日期8月22日，高雄展覽館。', nextAction:'啟動執行規劃', createdBy:'業務一' },
    { id:'A006', type:'PROPOSAL', title:'提案簡報 — APEC衛生政策研討會', client:'衛生福利部', contact:'林司長', date:'2025-05-06 14:00', content:'三個視覺方向提案，對方偏好科技藍方向，要求修改活動流程。', nextAction:'修改提案後再次提交', createdBy:'業務一' },
    { id:'A007', type:'NOTE',     title:'內部備註 — 電信業者潛在名單整理', client:'（內部）', contact:'', date:'2025-05-05 17:30', content:'整理台灣大哥大、中華電信、遠傳三家潛在客戶聯絡窗口。', nextAction:'安排初訪', createdBy:'業務一' },
    { id:'A008', type:'CALL',     title:'電話初訪 — 台灣大哥大企業事業部', client:'台灣大哥大股份有限公司', contact:'張副總', date:'2025-05-02 10:00', content:'初步了解年度活動需求，對方有企業年會500人場次需求。', nextAction:'安排現場提案', createdBy:'業務一' },
  ],

  async render() {
    window.CurrentPage = ActivitiesPage;
    document.getElementById('pageContent').innerHTML = Utils.loadingHtml();
    await ActivitiesPage.load();
  },

  async load() {
    await new Promise(r => setTimeout(r, 200));
    let data = [...ActivitiesPage.MOCK];
    const { search, type } = ActivitiesPage.state;
    if (search) { const q=search.toLowerCase(); data=data.filter(a=>a.title.toLowerCase().includes(q)||a.client.toLowerCase().includes(q)); }
    if (type!=='all') data=data.filter(a=>a.type===type);
    ActivitiesPage.state.activities = data;
    ActivitiesPage.state.total = data.length;
    ActivitiesPage.renderPage();
  },

  search(val) { ActivitiesPage.state.search=val; ActivitiesPage.load(); },

  renderPage() {
    const content = document.getElementById('pageContent');
    const { activities, type } = ActivitiesPage.state;
    const typeOptions = [['all','全部類型'],...Object.entries(CONFIG.ACTIVITY_TYPES).map(([k,v])=>[k,v.icon+' '+v.label])];
    const typeFilter = typeOptions.map(([v,l])=>`<option value="${v}" ${type===v?'selected':''}>${l}</option>`).join('');
    const grouped = {};
    activities.forEach(a => { const d=a.date.split(' ')[0]; if(!grouped[d]) grouped[d]=[]; grouped[d].push(a); });
    const timelineHtml = Object.entries(grouped).map(([date,items])=>`
      <div style="margin-bottom:4px">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;padding:14px 0 6px;font-family:var(--font-mono)">${date}</div>
        ${items.map(a=>ActivitiesPage.renderItem(a)).join('')}
      </div>`).join('');
    content.innerHTML = `
      <div class="list-controls">
        <div class="list-filters">
          <select class="filter-select" onchange="ActivitiesPage.filterChange('type',this.value)">${typeFilter}</select>
        </div>
        <span style="font-size:0.8rem;color:var(--text-muted);align-self:center">共 ${activities.length} 筆紀錄</span>
      </div>
      ${!activities.length ? Utils.emptyHtml('📋','尚無追蹤紀錄','點擊右上角「新增追蹤」開始記錄業務活動') :
        `<div class="dashboard-card">
          <div class="card-header">
            <span class="card-title">📋 Activity Timeline</span>
            <button class="btn-secondary" style="font-size:0.78rem" onclick="ActivitiesPage.exportCsv()">匯出 CSV</button>
          </div>
          <div style="padding:0 8px 8px">${timelineHtml}</div>
        </div>`}`;
  },

  renderItem(a) {
    const ti=CONFIG.ACTIVITY_TYPES[a.type]||{label:a.type,icon:'📌',color:'gray'};
    const colorMap={blue:'#3B82F6',teal:'#00C2A8',success:'#22C55E',warning:'#FFAA00',info:'#3B82F6',danger:'#FF4D6D',gray:'#8890A8'};
    const color=colorMap[ti.color]||'#8890A8';
    const time=a.date.split(' ')[1]||'';
    return `<div class="timeline-item" style="cursor:pointer" onclick="ActivitiesPage.openDetail('${a.id}')">
      <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:${color}18;font-size:1rem;flex-shrink:0">${ti.icon}</div>
      <div class="timeline-content">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div class="timeline-title">${Utils.escapeHtml(a.title)}</div>
          <div class="timeline-time">${time}</div>
        </div>
        <div style="display:flex;gap:10px;margin:3px 0;flex-wrap:wrap">
          <span style="font-size:0.78rem;color:var(--text-secondary)">🏢 ${Utils.escapeHtml(a.client)}</span>
          ${a.contact?`<span style="font-size:0.78rem;color:var(--text-muted)">👤 ${Utils.escapeHtml(a.contact)}</span>`:''}
          <span style="font-size:0.72rem;padding:1px 8px;border-radius:12px;background:${color}18;color:${color}">${ti.label}</span>
        </div>
        ${a.content?`<div class="timeline-desc">${Utils.escapeHtml(a.content.slice(0,80))}${a.content.length>80?'…':''}</div>`:''}
        ${a.nextAction?`<div style="margin-top:4px;font-size:0.75rem;color:var(--warning)">→ ${Utils.escapeHtml(a.nextAction)}</div>`:''}
      </div>
    </div>`;
  },

  openDetail(id) {
    const a=ActivitiesPage.state.activities.find(x=>x.id===id); if(!a) return;
    const ti=CONFIG.ACTIVITY_TYPES[a.type]||{label:a.type,icon:'📌'};
    const body=`<div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--border)">
        <span style="font-size:1.6rem">${ti.icon}</span>
        <div><div style="font-size:1rem;font-weight:700">${Utils.escapeHtml(a.title)}</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">${a.date} · 記錄人：${a.createdBy}</div></div>
      </div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">類型</div><div class="info-value">${ti.label}</div></div>
        <div class="info-item"><div class="info-label">客戶</div><div class="info-value">${Utils.escapeHtml(a.client)}</div></div>
        <div class="info-item"><div class="info-label">聯絡人</div><div class="info-value">${Utils.escapeHtml(a.contact||'—')}</div></div>
        <div class="info-item"><div class="info-label">日期時間</div><div class="info-value mono">${a.date}</div></div>
      </div>
      ${a.content?`<div><div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">內容記錄</div>
        <div style="background:var(--bg-elevated);border-radius:var(--r-sm);padding:14px;font-size:0.87rem;line-height:1.7">${Utils.escapeHtml(a.content)}</div></div>`:''}
      ${a.nextAction?`<div style="background:rgba(255,170,0,0.08);border:1px solid rgba(255,170,0,0.2);border-radius:var(--r-sm);padding:12px">
        <div style="font-size:0.75rem;color:var(--warning);font-weight:600;margin-bottom:4px">後續行動</div>
        <div style="font-size:0.87rem">→ ${Utils.escapeHtml(a.nextAction)}</div></div>`:''}
    </div>`;
    ModalManager.openDetailOnly('追蹤紀錄詳情', body);
  },

  filterChange(field,val) { ActivitiesPage.state[field]=val; ActivitiesPage.load(); },

  exportCsv() {
    const {activities}=ActivitiesPage.state;
    const h=['類型','標題','客戶','聯絡人','日期','內容','後續行動'];
    const r=activities.map(a=>[CONFIG.ACTIVITY_TYPES[a.type]?.label||a.type,a.title,a.client,a.contact||'',a.date,a.content||'',a.nextAction||'']);
    const csv=[h,...r].map(row=>row.map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const el=document.createElement('a'); el.href=url; el.download=`imPR_追蹤紀錄_${new Date().toISOString().slice(0,10)}.csv`;
    el.click(); URL.revokeObjectURL(url); Utils.toast('已匯出 CSV','success');
  },
};
