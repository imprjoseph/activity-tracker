/* ════════════════════════════════════════════════════════════
   pages/vendors.js — Vendor Management Page (完整更新版)
   供應商分類：音響/燈光/媒體/工讀生/司儀/口譯/攝影/影片製作/YouTuber/Podcast 等
   ════════════════════════════════════════════════════════════ */

const VendorsPage = {
  state: {
    vendors: [],
    total: 0,
    page: 1,
    search: '',
    category: 'all',
    group: 'all',
    status: 'all',
    view: 'table',  // table | card | group
  },

  // ── Demo 資料（貼近 imPR 實際合作廠商）─────────────────────
  MOCK: [
    // 音響
    { id:'V001', name:'富立音響工程有限公司', taxId:'11223344', category:'音響', status:'配合中', region:'台北市', contact:'王志明', phone:'02-2345-6789', email:'will@fuli-audio.com', rating:4.8, projects:15, tags:['推薦','大型活動'], notes:'主要音響廠商，有自有設備庫' },
    { id:'V002', name:'聲動音響科技', taxId:'22334400', category:'音響', status:'備用', region:'新北市', contact:'林建宏', phone:'02-8901-2233', email:'', rating:4.2, projects:6, tags:['中型活動'], notes:'' },
    // 燈光
    { id:'V003', name:'光影視覺股份有限公司', taxId:'22334455', category:'燈光', status:'配合中', region:'台北市', contact:'李美華', phone:'02-3456-7890', email:'light@optic.tw', rating:4.5, projects:12, tags:['穩定','推薦'], notes:'有 LED 洗牆燈、GOBO 等專業設備' },
    { id:'V004', name:'炫彩燈光工程', taxId:'33400055', category:'燈光', status:'配合中', region:'桃園市', contact:'陳俊安', phone:'03-456-7890', email:'', rating:4.3, projects:8, tags:[], notes:'' },
    // 視訊 / LED
    { id:'V005', name:'全視野直播技術', taxId:'44556677', category:'視訊 / LED', status:'配合中', region:'台北市', contact:'張文彬', phone:'02-4567-8901', email:'info@allview.tw', rating:4.3, projects:8, tags:['4K直播','推薦'], notes:'4K多機切換直播，有 LED 大螢幕租賃' },
    // 展場搭建
    { id:'V006', name:'捷勝舞台設計工程', taxId:'33445566', category:'展場搭建', status:'配合中', region:'桃園市', contact:'陳建志', phone:'03-234-5678', email:'', rating:4.6, projects:20, tags:['大型活動','推薦'], notes:'' },
    // 印刷輸出
    { id:'V007', name:'全彩數位印刷', taxId:'77889900', category:'印刷輸出', status:'配合中', region:'新北市', contact:'楊文龍', phone:'02-7890-1234', email:'', rating:4.4, projects:25, tags:['快速交件'], notes:'輸出最大 5m，備紙充足' },
    // 工讀生 / 活動人力
    { id:'V008', name:'豐群人力派遣', taxId:'66778899', category:'工讀生 / 活動人力', status:'配合中', region:'全台', contact:'黃建明', phone:'02-6789-0123', email:'hr@fongqun.com', rating:4.0, projects:30, tags:['量大','彈性'], notes:'可提供禮賓人員、引導員、報到組' },
    { id:'V009', name:'力展活動人力', taxId:'66000099', category:'工讀生 / 活動人力', status:'備用', region:'台北市', contact:'吳佳儀', phone:'02-5678-9999', email:'', rating:3.8, projects:10, tags:[], notes:'' },
    // 司儀 / 主持人
    { id:'V010', name:'林雅涵 司儀工作室', taxId:'', category:'司儀 / 主持人', status:'配合中', region:'台北市', contact:'林雅涵', phone:'0912-345-678', email:'yahan@mc.tw', rating:4.9, projects:22, tags:['推薦','中英雙語','政府活動'], notes:'曾主持總統府活動，有台語/英語主持能力' },
    { id:'V011', name:'陳志偉 主持人', taxId:'', category:'司儀 / 主持人', status:'配合中', region:'台北市', contact:'陳志偉', phone:'0923-456-789', email:'', rating:4.6, projects:15, tags:['科技活動','論壇'], notes:'擅長科技論壇、記者會' },
    // 口譯 / 翻譯
    { id:'V012', name:'翻騰口譯有限公司', taxId:'55667788', category:'口譯 / 翻譯', status:'配合中', region:'台北市', contact:'林語涵', phone:'02-5678-9012', email:'info@fanten.tw', rating:4.7, projects:10, tags:['推薦','英日韓','國際會議'], notes:'同步口譯設備齊全，可搭接收器' },
    { id:'V013', name:'全球通譯服務', taxId:'55000088', category:'口譯 / 翻譯', status:'備用', region:'台北市', contact:'謝文翰', phone:'02-4567-3333', email:'', rating:4.3, projects:5, tags:['英中'], notes:'' },
    // 攝影
    { id:'V014', name:'藍鯊攝影工作室', taxId:'88990011', category:'攝影', status:'配合中', region:'台北市', contact:'許家豪', phone:'02-8901-2345', email:'shark@photo.tw', rating:4.9, projects:18, tags:['推薦','高品質','RAW交件'], notes:'活動紀實、大頭照補拍皆可，交件速度快' },
    { id:'V015', name:'陳映辰 攝影師', taxId:'', category:'攝影', status:'配合中', region:'桃園市', contact:'陳映辰', phone:'0934-567-890', email:'', rating:4.5, projects:8, tags:['南部活動'], notes:'高雄、台南地區推薦' },
    // 影片製作
    { id:'V016', name:'動感影像製作有限公司', taxId:'99001122', category:'影片製作', status:'配合中', region:'台北市', contact:'吳宗翰', phone:'02-9012-3456', email:'info@motion.tw', rating:4.7, projects:12, tags:['推薦','宣傳片','活動紀錄'], notes:'快剪當天交件，精剪5工作天' },
    { id:'V017', name:'視野映畫工作室', taxId:'', category:'影片製作', status:'備用', region:'台中市', contact:'賴俊宇', phone:'04-234-5678', email:'', rating:4.2, projects:4, tags:['中部'], notes:'' },
    // YouTuber
    { id:'V018', name:'科技力 TechPower (YouTuber)', taxId:'', category:'YouTuber', status:'配合中', region:'台北市', contact:'阿力', phone:'0956-789-012', email:'techpower@yt.tw', rating:4.6, projects:3, tags:['科技','訂閱數50萬+'], notes:'專攻科技產業，觀眾為IT從業人員' },
    { id:'V019', name:'政策白話文 (YouTuber)', taxId:'', category:'YouTuber', status:'備用', region:'台北市', contact:'小白', phone:'', email:'policy@yt.tw', rating:4.4, projects:2, tags:['政府政策','知識型'], notes:'擅長政府政策解析，訂閱數20萬+' },
    // Podcast
    { id:'V020', name:'台灣科技週刊 Podcast', taxId:'', category:'Podcast', status:'配合中', region:'台北市', contact:'主持人：王大明', phone:'0967-890-123', email:'podcast@tech.tw', rating:4.5, projects:4, tags:['科技產業','每週更新'], notes:'每集平均 5 萬下載，Spotify 科技類 Top 10' },
    { id:'V021', name:'公衛好朋友 Podcast', taxId:'', category:'Podcast', status:'備用', region:'台北市', contact:'李醫師', phone:'', email:'health@podcast.tw', rating:4.3, projects:1, tags:['醫療衛生'], notes:'醫療衛生議題，聽眾多為醫護人員' },
    // 媒體 / 記者
    { id:'V022', name:'聯合新聞網 科技線', taxId:'', category:'媒體 / 記者', status:'配合中', region:'台北市', contact:'張記者', phone:'02-8080-0000', email:'tech@udn.com', rating:4.0, projects:8, tags:['科技線','主流媒體'], notes:'' },
    // 平面設計
    { id:'V023', name:'思維視覺設計工作室', taxId:'', category:'平面設計', status:'配合中', region:'台北市', contact:'蔡依婷', phone:'0945-678-901', email:'design@think.tw', rating:4.7, projects:14, tags:['推薦','主視覺','Keynote'], notes:'擅長國際會議主視覺、簡報設計' },
  ],

  async render() {
    window.CurrentPage = VendorsPage;
    const content = document.getElementById('pageContent');
    content.innerHTML = Utils.loadingHtml();
    await VendorsPage.load();
  },

  async load() {
    const { search, category, status, group } = VendorsPage.state;

    let allData;
    try {
      // 走 API（GAS 連線時讀真實資料，Demo 模式讀 api.js 的 MOCK）
      const res = await API.getVendors({ search, category: category==='all'?'':category, status: status==='all'?'':status });
      if (!res || !res.success) throw new Error(res?.message || '載入失敗');
      allData = res.data || [];
    } catch(e) {
      Utils.toast('載入失敗：' + e.message, 'error');
      document.getElementById('pageContent').innerHTML = Utils.emptyHtml('⚠️','載入失敗', e.message);
      return;
    }

    // 群組篩選（前端過濾）
    if (group !== 'all') {
      const groupCats = CONFIG.VENDOR_CATEGORY_GROUPS[group] || [];
      allData = allData.filter(v => groupCats.includes(v.category));
    }

    // 標籤/備註搜尋（補充 API 搜尋未涵蓋的欄位）
    if (search) {
      const q = search.toLowerCase();
      allData = allData.filter(v =>
        v.name.toLowerCase().includes(q) ||
        (v.contact||'').toLowerCase().includes(q) ||
        (v.tags||[]).some(t => t.toLowerCase().includes(q)) ||
        (v.notes||'').toLowerCase().includes(q)
      );
    }

    VendorsPage.state.vendors = allData;
    VendorsPage.state.total   = allData.length;
    document.getElementById('badge-vendors').textContent = allData.length;
    VendorsPage.renderPage();
  },

  search(val) {
    VendorsPage.state.search = val;
    VendorsPage.state.page = 1;
    VendorsPage.load();
  },

  renderPage() {
    const content = document.getElementById('pageContent');
    const { vendors, page, total, view, group, category, status } = VendorsPage.state;

    // ── Group tabs ────────────────────────────────────────────
    const groups = ['all', ...Object.keys(CONFIG.VENDOR_CATEGORY_GROUPS)];
    const groupTabs = groups.map(g => `
      <button class="group-tab${group===g?' active':''}" onclick="VendorsPage.filterChange('group','${g}')">
        ${g === 'all' ? '全部' : g}
        <span class="group-tab-count">${g==='all' ? VendorsPage.MOCK.length :
          VendorsPage.MOCK.filter(v => (CONFIG.VENDOR_CATEGORY_GROUPS[g]||[]).includes(v.category)).length
        }</span>
      </button>`).join('');

    // ── Category select (filtered by group) ───────────────────
    let catList = ['all'];
    if (group !== 'all') {
      catList = ['all', ...(CONFIG.VENDOR_CATEGORY_GROUPS[group]||[])];
    } else {
      catList = ['all', ...CONFIG.VENDOR_CATEGORIES];
    }
    const catOptions = catList.map(c =>
      `<option value="${c}" ${category===c?'selected':''}>${c==='all'?'所有類型':
        (CONFIG.VENDOR_CATEGORY_ICONS[c]||'') + ' ' + c}</option>`
    ).join('');

    const statusOptions = [
      ['all','所有狀態'],['配合中','✅ 配合中'],['備用','🔔 備用'],['停止配合','❌ 停止配合']
    ].map(([v,l]) => `<option value="${v}" ${status===v?'selected':''}>${l}</option>`).join('');

    const paged = Utils.paginate(vendors, page, CONFIG.PAGE_SIZE);

    content.innerHTML = `
      <style>
        .group-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
        .group-tab {
          padding:6px 14px; border-radius:20px; font-size:0.8rem; font-weight:500;
          background:var(--bg-elevated); color:var(--text-secondary);
          border:1px solid var(--border); cursor:pointer; transition:all 0.15s;
          display:flex; align-items:center; gap:6px;
        }
        .group-tab:hover { background:var(--bg-hover); color:var(--text-primary); }
        .group-tab.active { background:var(--accent-dim); color:var(--accent); border-color:rgba(232,104,26,0.3); }
        .group-tab-count {
          font-size:0.68rem; font-family:var(--font-mono);
          background:rgba(255,255,255,0.1); padding:1px 6px; border-radius:10px;
        }
        .group-tab.active .group-tab-count { background:rgba(232,104,26,0.2); }
        .cat-chip {
          display:inline-flex; align-items:center; gap:4px;
          padding:3px 10px; border-radius:12px; font-size:0.72rem; font-weight:500;
          background:var(--bg-hover); color:var(--text-secondary); white-space:nowrap;
        }
      </style>

      <!-- Group Tabs -->
      <div class="group-tabs">${groupTabs}</div>

      <!-- Controls -->
      <div class="list-controls">
        <div class="list-filters">
          <select class="filter-select" onchange="VendorsPage.filterChange('status',this.value)">${statusOptions}</select>
          <select class="filter-select" onchange="VendorsPage.filterChange('category',this.value)">${catOptions}</select>
          <button class="btn-secondary" onclick="VendorsPage.exportCsv()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            匯出 CSV
          </button>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:0.8rem;color:var(--text-muted)">共 ${total} 家</span>
          <button class="btn-icon${view==='table'?' active':''}" onclick="VendorsPage.setView('table')" title="表格">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="6" width="12" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="11" width="12" height="2" rx="0.5" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
          <button class="btn-icon${view==='card'?' active':''}" onclick="VendorsPage.setView('card')" title="卡片">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
        </div>
      </div>

      ${!vendors.length
        ? Utils.emptyHtml('🏭', '沒有符合條件的供應商', '試試清除篩選條件，或新增供應商')
        : view === 'table' ? VendorsPage.renderTable(paged, page, total)
                           : VendorsPage.renderCards(vendors)
      }
    `;
  },

  renderTable(paged, page, total) {
    return `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>供應商名稱</th>
              <th>類型</th>
              <th>狀態</th>
              <th>地區</th>
              <th>聯絡人</th>
              <th>評分</th>
              <th>配合次數</th>
              <th>標籤</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${paged.map(v => {
              const icon = CONFIG.VENDOR_CATEGORY_ICONS[v.category] || '📦';
              return `
              <tr onclick="VendorsPage.openDetail('${v.id}')">
                <td>
                  <div class="company-cell">
                    <div style="width:34px;height:34px;border-radius:8px;background:${Utils.avatarColor(v.name)}22;
                      display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">
                      ${icon}
                    </div>
                    <div>
                      <div style="font-weight:600;font-size:0.87rem">${Utils.escapeHtml(v.name)}</div>
                      <div style="font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono)">${v.taxId||'個人 / 無統編'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="cat-chip">${icon} ${v.category}</span>
                </td>
                <td>${Utils.statusChip(v.status)}</td>
                <td style="font-size:0.82rem;color:var(--text-secondary)">${v.region||'—'}</td>
                <td>
                  <div style="font-size:0.83rem;font-weight:500">${Utils.escapeHtml(v.contact||'—')}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted)">${v.phone||''}</div>
                </td>
                <td>${Utils.stars(v.rating||0)}</td>
                <td>
                  <span style="font-size:0.82rem;color:var(--text-secondary);font-family:var(--font-mono)">
                    ${v.projects} 次
                  </span>
                </td>
                <td>${Utils.tags((v.tags||[]).slice(0,2))}</td>
                <td onclick="event.stopPropagation()">
                  <div style="display:flex;gap:4px">
                    <button class="btn-icon" onclick="VendorsPage.openEdit('${v.id}')" title="編輯">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button class="btn-icon" title="新增評價" onclick="event.stopPropagation();ModalManager.openEvaluationForm('${v.id}','${Utils.escapeHtml(v.name)}')" style="color:var(--warning)">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6.5 8.4l-2.78 1.65.53-3.1L2 4.75l3.1-.45z" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button class="btn-icon" onclick="VendorsPage.confirmDelete('${v.id}','${Utils.escapeHtml(v.name)}')" title="刪除" style="color:var(--danger)">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10 3.5l-.6 7a1 1 0 01-1 .9H4.6a1 1 0 01-1-.9L3 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${Utils.renderPagination(total, page, CONFIG.PAGE_SIZE, 'VendorsPage.goPage')}
      </div>`;
  },

  renderCards(vendors) {
    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
        ${vendors.map(v => {
          const icon = CONFIG.VENDOR_CATEGORY_ICONS[v.category] || '📦';
          const color = Utils.avatarColor(v.name);
          return `
          <div class="dashboard-card" style="cursor:pointer;transition:border-color 0.2s"
               onclick="VendorsPage.openDetail('${v.id}')"
               onmouseenter="this.style.borderColor='var(--accent)'"
               onmouseleave="this.style.borderColor='var(--border)'">
            <div style="padding:18px">
              <!-- Header -->
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:40px;height:40px;border-radius:10px;background:${color}22;
                    display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">${icon}</div>
                  <div>
                    <div style="font-weight:700;font-size:0.88rem;line-height:1.3">${Utils.escapeHtml(v.name)}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted)">${v.category}</div>
                  </div>
                </div>
                ${Utils.statusChip(v.status)}
              </div>
              <!-- Rating -->
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                ${Utils.stars(v.rating||0)}
                <span style="font-size:0.78rem;color:var(--text-muted);font-family:var(--font-mono)">${v.projects} 次合作</span>
              </div>
              <!-- Contact -->
              <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px">
                👤 ${Utils.escapeHtml(v.contact||'—')}
                ${v.phone ? `&nbsp;·&nbsp;📞 ${v.phone}` : ''}
              </div>
              <!-- Tags -->
              ${(v.tags||[]).length ? `<div class="tag-list">${(v.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>` : ''}
              <!-- Notes preview -->
              ${v.notes ? `<div style="margin-top:8px;font-size:0.75rem;color:var(--text-muted);
                background:var(--bg-elevated);padding:7px 10px;border-radius:6px;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${Utils.escapeHtml(v.notes.slice(0,50))}${v.notes.length>50?'…':''}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  },

  filterChange(field, val) {
    VendorsPage.state[field] = val;
    // When switching group, reset category filter
    if (field === 'group') VendorsPage.state.category = 'all';
    VendorsPage.state.page = 1;
    VendorsPage.load();
  },

  setView(v) { VendorsPage.state.view = v; VendorsPage.renderPage(); },
  goPage(p)  { VendorsPage.state.page = p; VendorsPage.renderPage(); },

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
    try {
      const res = await API.deleteVendor(id);
      if (res.success) {
        Utils.toast(`已刪除：${name}`, 'success');
        VendorsPage.load();
      } else {
        Utils.toast('刪除失敗：' + (res.message||''), 'error');
      }
    } catch(e) {
      Utils.toast('刪除失敗：' + e.message, 'error');
    }
  },

  exportCsv() {
    const { vendors } = VendorsPage.state;
    const headers = ['供應商名稱','統一編號','類型','狀態','地區','聯絡人','電話','Email','評分','配合次數','標籤','備註'];
    const rows = vendors.map(v => [
      v.name, v.taxId||'', v.category, v.status, v.region||'',
      v.contact||'', v.phone||'', v.email||'',
      (v.rating||0).toFixed(1), v.projects,
      (v.tags||[]).join('、'), v.notes||''
    ]);
    const csv = [headers,...rows].map(r=>r.map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`imPR_供應商清單_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    Utils.toast('已匯出 CSV','success');
  },
};
