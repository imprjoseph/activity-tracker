/* ════════════════════════════════════════════════════════════
   api.js — Google Apps Script API Communication Layer
   v1.3 Fix: isDemoMode 現在會讀取 localStorage 的 GAS URL
   ════════════════════════════════════════════════════════════ */

const API = (() => {

  // ── 取得有效的 GAS URL（config.js 或 localStorage 擇優）──────
  function getEndpoint() {
    const saved = localStorage.getItem('impr_gas_url');
    if (saved && saved.trim() && !saved.includes('YOUR_DEPLOYMENT_ID')) {
      return saved.trim();
    }
    return CONFIG.GAS_ENDPOINT;
  }

  // ── Demo 模式判斷（同時檢查 config 及 localStorage）─────────
  function isDemoMode() {
    return getEndpoint().includes('YOUR_DEPLOYMENT_ID');
  }

  // ── Core GAS Call（含 10 秒逾時保護）────────────────────────
  async function call(action, params = {}) {
    const endpoint = getEndpoint();
    const session  = Auth.getSession();
    const payload  = {
      action,
      ...params,
      _user: session?.username || '',
      _role: session?.role     || '',
    };

    const READ_ACTIONS = [
      'getClients','getVendors','getContacts','getActivities',
      'getProjects','getDashboard','getEvaluations',
      'getTags','getCategories','getSettings','login','ping',
    ];

    // 10秒逾時 Promise
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('GAS 連線逾時（10秒），請確認部署設定')), 10000)
    );

    try {
      let fetchPromise;
      if (READ_ACTIONS.includes(action)) {
        const url = new URL(endpoint);
        Object.keys(payload).forEach(k =>
          url.searchParams.set(k, typeof payload[k] === 'string' ? payload[k] : JSON.stringify(payload[k]))
        );
        fetchPromise = fetch(url.toString(), { method: 'GET' })
          .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); });
      } else {
        fetchPromise = fetch(endpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body:    JSON.stringify(payload),
        }).then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); });
      }

      return await Promise.race([fetchPromise, timeout]);
    } catch (err) {
      console.error(`[API] ${action} failed:`, err.message);
      throw err;
    }
  }

  // ════════════════════════════════════════════════════════════
  // MOCK DATA（Demo 模式用）
  // ════════════════════════════════════════════════════════════
  const MOCK = {
    dashboard: {
      stats: {
        totalClients: 47, totalVendors: 83,
        newThisMonth: 6,  pendingFollow: 12,
        highPotential: 8, expiringContracts: 3,
      },
      recentActivities: [
        { type:'CALL',     title:'電話追蹤 — 衛福部國際衛生合作案', company:'衛生福利部',         time:'今天 14:30' },
        { type:'EMAIL',    title:'報價確認 — 2026醫學年會',         company:'中華民國醫師公會',   time:'今天 11:20' },
        { type:'VISIT',    title:'拜訪客戶 — NCC數位韌性論壇',      company:'國家通訊傳播委員會', time:'昨天 16:00' },
        { type:'QUOTE',    title:'提交報價單 — 6G標準峰會',         company:'數位發展部',         time:'昨天 10:30' },
        { type:'CONTRACT', title:'合約簽署 — 海洋科技論壇',         company:'海洋委員會',         time:'3天前' },
      ],
      topClients: [
        { id:'C001', name:'數位發展部',         level:'S 級', color:'#E8681A', projects:8, amount:'1,240萬' },
        { id:'C002', name:'衛生福利部',         level:'S 級', color:'#C8460A', projects:6, amount:'980萬'   },
        { id:'C003', name:'國家通訊傳播委員會', level:'A 級', color:'#667eea', projects:5, amount:'760萬'   },
        { id:'C004', name:'中華民國醫師公會',   level:'A 級', color:'#4facfe', projects:4, amount:'520萬'   },
        { id:'C005', name:'海洋委員會',         level:'B 級', color:'#43e97b', projects:3, amount:'340萬'   },
      ],
      monthlyTrend: [38,42,45,41,47,50,46,53,48,47,52,47],
    },
    clients: [
      { id:'C001', name:'數位發展部',             nameEn:'Ministry of Digital Affairs',             taxId:'12345678', category:'政府機關', level:'S 級', status:'合作中',  phone:'02-2356-6000', email:'service@moda.gov.tw',  region:'台北市', contacts:3, projects:8, tags:['高預算','長期合作','年度標案'], createdAt:'2023-03-15' },
      { id:'C002', name:'衛生福利部',             nameEn:'Ministry of Health and Welfare',           taxId:'23456789', category:'政府機關', level:'S 級', status:'合作中',  phone:'02-8590-6666', email:'mohw@mohw.gov.tw',      region:'台北市', contacts:4, projects:6, tags:['高潛力','長期合作'],           createdAt:'2022-08-20' },
      { id:'C003', name:'國家通訊傳播委員會',     nameEn:'National Communications Commission',       taxId:'34567890', category:'政府機關', level:'A 級', status:'合作中',  phone:'02-2500-6600', email:'ncc@ncc.gov.tw',        region:'台北市', contacts:2, projects:5, tags:['需追蹤','年度標案'],           createdAt:'2023-01-10' },
      { id:'C004', name:'中華民國醫師公會全國聯合會', nameEn:'Taiwan Medical Association',           taxId:'45678901', category:'醫學會',   level:'A 級', status:'合作中',  phone:'02-2392-1326', email:'mail@tma.tw',           region:'台北市', contacts:3, projects:4, tags:['高潛力','醫療'],               createdAt:'2021-11-05' },
      { id:'C005', name:'海洋委員會',             nameEn:'Ocean Affairs Council',                    taxId:'56789012', category:'政府機關', level:'B 級', status:'合作中',  phone:'07-335-0025',  email:'oac@oac.gov.tw',       region:'高雄市', contacts:2, projects:3, tags:['需追蹤'],                      createdAt:'2023-06-01' },
      { id:'C006', name:'工業技術研究院',         nameEn:'Industrial Technology Research Institute', taxId:'67890123', category:'科技公司', level:'A 級', status:'潛在客戶',phone:'03-591-3769',  email:'pr@itri.org.tw',       region:'桃園市', contacts:1, projects:0, tags:['高潛力','新客戶'],             createdAt:'2024-02-14' },
      { id:'C007', name:'台灣大哥大股份有限公司', nameEn:'Taiwan Mobile Co., Ltd.',                  taxId:'78901234', category:'電信業者', level:'B 級', status:'潛在客戶',phone:'02-6636-0600', email:'pr@taiwanmobile.com',  region:'台北市', contacts:2, projects:0, tags:['高潛力'],                      createdAt:'2024-03-28' },
      { id:'C008', name:'國立成功大學',           nameEn:'National Cheng Kung University',           taxId:'89012345', category:'學校單位', level:'C 級', status:'停用',   phone:'06-275-7575',  email:'pr@ncku.edu.tw',       region:'台南市', contacts:1, projects:1, tags:[],                              createdAt:'2022-05-20' },
    ],
    vendors: [
      { id:'V001', name:'富立音響工程有限公司', taxId:'11223344', category:'音響',              status:'配合中', region:'台北市', rating:4.8, projects:15, contact:'王志明', phone:'02-2345-6789', tags:['高品質','推薦'] },
      { id:'V002', name:'光影視覺股份有限公司', taxId:'22334455', category:'燈光',              status:'配合中', region:'台北市', rating:4.5, projects:12, contact:'李美華', phone:'02-3456-7890', tags:['穩定']         },
      { id:'V003', name:'捷勝舞台設計工程',     taxId:'33445566', category:'展場搭建',          status:'配合中', region:'桃園市', rating:4.6, projects:20, contact:'陳建志', phone:'03-234-5678',  tags:['大型活動','推薦'] },
      { id:'V004', name:'全視野直播技術',       taxId:'44556677', category:'視訊 / LED',        status:'配合中', region:'台北市', rating:4.3, projects:8,  contact:'張文彬', phone:'02-4567-8901', tags:['4K直播']        },
      { id:'V005', name:'翻騰口譯有限公司',     taxId:'55667788', category:'口譯 / 翻譯',       status:'備用',   region:'台北市', rating:4.7, projects:10, contact:'林語涵', phone:'02-5678-9012', tags:['英日韓','國際會議'] },
      { id:'V006', name:'豐群人力派遣',         taxId:'66778899', category:'工讀生 / 活動人力', status:'配合中', region:'全台',   rating:4.0, projects:30, contact:'黃建明', phone:'02-6789-0123', tags:['彈性','量大']  },
      { id:'V007', name:'全彩數位印刷',         taxId:'77889900', category:'印刷輸出',          status:'配合中', region:'新北市', rating:4.4, projects:25, contact:'楊文龍', phone:'02-7890-1234', tags:['快速交件']      },
      { id:'V008', name:'藍鯊攝影工作室',       taxId:'88990011', category:'攝影',              status:'配合中', region:'台北市', rating:4.9, projects:18, contact:'許家豪', phone:'02-8901-2345', tags:['高品質','推薦'] },
    ],
  };

  async function mockFetch(key, delay = 300) {
    await new Promise(r => setTimeout(r, delay));
    return { success: true, data: MOCK[key] };
  }

  // ════════════════════════════════════════════════════════════
  // PUBLIC API METHODS
  // ════════════════════════════════════════════════════════════

  // ── Dashboard ────────────────────────────────────────────────
  async function getDashboard() {
    if (isDemoMode()) return mockFetch('dashboard');
    return call('getDashboard');
  }

  // ── Clients ──────────────────────────────────────────────────
  async function getClients(params = {}) {
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 250));
      let data = [...MOCK.clients];
      if (params.search) {
        const q = params.search.toLowerCase();
        data = data.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.nameEn||'').toLowerCase().includes(q) ||
          (c.taxId||'').includes(q) ||
          (c.email||'').toLowerCase().includes(q)
        );
      }
      if (params.status   && params.status   !== 'all') data = data.filter(c => c.status   === params.status);
      if (params.category && params.category !== 'all') data = data.filter(c => c.category === params.category);
      if (params.level    && params.level    !== 'all') data = data.filter(c => c.level    === params.level);
      return { success: true, data, total: data.length };
    }
    return call('getClients', params);
  }

  async function getClient(id) {
    if (isDemoMode()) return { success: true, data: MOCK.clients.find(c => c.id === id) };
    return call('getClient', { id });
  }

  async function createClient(data) {
    if (isDemoMode()) {
      const newClient = { ...data, id:'C'+Date.now(), createdAt:new Date().toISOString().split('T')[0], projects:0, contacts:0 };
      MOCK.clients.unshift(newClient);
      return { success: true, data: newClient };
    }
    return call('createClient', data);
  }

  async function updateClient(id, data) {
    if (isDemoMode()) {
      const idx = MOCK.clients.findIndex(c => c.id === id);
      if (idx >= 0) MOCK.clients[idx] = { ...MOCK.clients[idx], ...data };
      return { success: true };
    }
    return call('updateClient', { id, ...data });
  }

  async function deleteClient(id) {
    if (isDemoMode()) {
      const idx = MOCK.clients.findIndex(c => c.id === id);
      if (idx >= 0) MOCK.clients.splice(idx, 1);
      return { success: true };
    }
    return call('deleteClient', { id });
  }

  // ── Vendors ──────────────────────────────────────────────────
  async function getVendors(params = {}) {
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 250));
      let data = [...MOCK.vendors];
      if (params.search) {
        const q = params.search.toLowerCase();
        data = data.filter(v =>
          v.name.toLowerCase().includes(q) ||
          (v.taxId||'').includes(q) ||
          (v.contact||'').toLowerCase().includes(q)
        );
      }
      if (params.category && params.category !== 'all') data = data.filter(v => v.category === params.category);
      if (params.status   && params.status   !== 'all') data = data.filter(v => v.status   === params.status);
      return { success: true, data, total: data.length };
    }
    return call('getVendors', params);
  }

  async function createVendor(data) {
    if (isDemoMode()) {
      const v = { ...data, id:'V'+Date.now(), rating:0, projects:0 };
      MOCK.vendors.unshift(v);
      return { success: true, data: v };
    }
    return call('createVendor', data);
  }

  async function updateVendor(id, data) {
    if (isDemoMode()) {
      const idx = MOCK.vendors.findIndex(v => v.id === id);
      if (idx >= 0) MOCK.vendors[idx] = { ...MOCK.vendors[idx], ...data };
      return { success: true };
    }
    return call('updateVendor', { id, ...data });
  }

  async function deleteVendor(id) {
    if (isDemoMode()) {
      const idx = MOCK.vendors.findIndex(v => v.id === id);
      if (idx >= 0) MOCK.vendors.splice(idx, 1);
      return { success: true };
    }
    return call('deleteVendor', { id });
  }

  // ── Activities ───────────────────────────────────────────────
  async function getActivities(params = {}) {
    if (isDemoMode()) return { success: true, data: [] };
    return call('getActivities', params);
  }

  async function createActivity(data) {
    if (isDemoMode()) return { success: true };
    return call('createActivity', data);
  }

  // ── Utility: 對外暴露 isDemoMode & getEndpoint 供 settings 用 ──
  function getStatus() {
    const endpoint = getEndpoint();
    const demo = isDemoMode();
    return {
      isDemoMode: demo,
      endpoint:   demo ? '（未設定）' : endpoint,
      source:     localStorage.getItem('impr_gas_url') ? 'localStorage' : 'config.js',
    };
  }

  return {
    // Data methods
    getDashboard,
    getClients, getClient, createClient, updateClient, deleteClient,
    getVendors,              createVendor, updateVendor, deleteVendor,
    getActivities, createActivity,
    // Utility
    getStatus,
    call,
  };
})();
