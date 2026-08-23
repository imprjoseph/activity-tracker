// ════════════════════════════════════════════════════════════
// imPR CRM — Google Apps Script Backend  v1.4.0
// 部署：Google Sheets > 擴充功能 > Apps Script > 新增部署
// 設定：類型=網頁應用程式 / 執行身分=我 / 存取=所有人
// ════════════════════════════════════════════════════════════

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const VERSION = '1.4.0';

const SHEETS = {
  USERS:'CRM_Users', CLIENTS:'CRM_Clients', VENDORS:'CRM_Vendors',
  CONTACTS:'CRM_Contacts', PROJECTS:'CRM_Projects', ACTIVITIES:'CRM_Activities',
  EVALUATIONS:'CRM_Evaluations', TAGS:'CRM_Tags', CATEGORIES:'CRM_Categories',
  FILES:'CRM_Files', SETTINGS:'CRM_Settings',
};

// ── Entry Points ─────────────────────────────────────────────
function doGet(e) {
  const callback = e && e.parameter ? e.parameter.callback : '';
  try {
    const p = e.parameter;
    const params = {};
    Object.keys(p).forEach(k => {
      try { params[k] = JSON.parse(p[k]); } catch { params[k] = p[k]; }
    });
    return webResponse(routeAction(params.action, params), callback);
  } catch(err) {
    return webResponse({ success:false, message:err.message }, callback);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    return jsonResponse(routeAction(body.action, body));
  } catch(err) {
    return jsonResponse({ success:false, message:err.message });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// JSONP 備援可避開部分 Safari／企業網路的跨網域 fetch 限制。
function webResponse(data, callback) {
  if (!callback) return jsonResponse(data);
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return jsonResponse({ success:false, message:'Invalid callback' });
  }
  return ContentService.createTextOutput(callback+'('+JSON.stringify(data)+');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// ── Router ───────────────────────────────────────────────────
function routeAction(action, p) {
  switch(action) {
    case 'ping':             return ping();
    case 'login':            return login(p);
    case 'getDashboard':     return getDashboard();
    case 'getClients':       return getClients(p);
    case 'getClient':        return getClient(p.id);
    case 'createClient':     return createClient(p);
    case 'updateClient':     return updateClient(p.id, p);
    case 'deleteClient':     return deleteRow(SHEETS.CLIENTS, p.id);
    case 'getVendors':       return getVendors(p);
    case 'getVendor':        return getVendor(p.id);
    case 'createVendor':     return createVendor(p);
    case 'updateVendor':     return updateVendor(p.id, p);
    case 'deleteVendor':     return deleteRow(SHEETS.VENDORS, p.id);
    case 'getContacts':      return getContacts(p);
    case 'createContact':    return createContact(p);
    case 'updateContact':    return updateRow(SHEETS.CONTACTS, p.id, p);
    case 'deleteContact':    return deleteRow(SHEETS.CONTACTS, p.id);
    case 'getActivities':    return getActivities(p);
    case 'createActivity':   return createActivity(p);
    case 'getProjects':      return getProjects(p);
    case 'createProject':    return createProject(p);
    case 'updateProject':    return updateRow(SHEETS.PROJECTS, p.id, p);
    case 'getEvaluations':   return getEvaluations(p);
    case 'createEvaluation': return createEvaluation(p);
    case 'getTags':          return { success:true, data:sheetToObjects(getSheet(SHEETS.TAGS)) };
    case 'createTag':        return createTag(p.name);
    case 'getCategories':    return { success:true, data:sheetToObjects(getSheet(SHEETS.CATEGORIES)) };
    default: return { success:false, message:'Unknown action: '+action };
  }
}

// ── Utilities ────────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); initHeaders(sheet, name); }
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).filter(r => r[0]).map(row => {
    const obj = {};
    headers.forEach((h,i) => { obj[h] = row[i] === '' ? null : row[i]; });
    return obj;
  });
}

function generateId(prefix) {
  return prefix+'_'+new Date().getTime()+'_'+Math.random().toString(36).slice(2,6).toUpperCase();
}

function now() {
  return Utilities.formatDate(new Date(),'Asia/Taipei','yyyy-MM-dd HH:mm:ss');
}

function today() {
  return Utilities.formatDate(new Date(),'Asia/Taipei','yyyy-MM-dd');
}

function applyFilter(data, p, fields) {
  let r = data;
  if (p.search) { const q=p.search.toLowerCase(); r=r.filter(x=>fields.some(f=>(x[f]||'').toString().toLowerCase().includes(q))); }
  if (p.status && p.status!=='all') r=r.filter(x=>x.status===p.status);
  if (p.category && p.category!=='all') r=r.filter(x=>x.category===p.category);
  if (p.level && p.level!=='all') r=r.filter(x=>x.level===p.level);
  return r;
}

function updateRow(sheetName, id, params) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rowIdx = data.findIndex((r,i) => i>0 && r[0]===id);
  if (rowIdx<0) return { success:false, message:'記錄不存在' };
  Object.entries(params).forEach(([key,val]) => {
    if (key.startsWith('_') || key==='action' || key==='id') return;
    const colIdx = headers.indexOf(key);
    if (colIdx>=0 && val!==undefined) sheet.getRange(rowIdx+1,colIdx+1).setValue(val);
  });
  const updIdx = headers.indexOf('updatedAt');
  if (updIdx>=0) sheet.getRange(rowIdx+1,updIdx+1).setValue(now());
  return { success:true, message:'已更新' };
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const rowIdx = data.findIndex((r,i) => i>0 && r[0]===id);
  if (rowIdx<0) return { success:false, message:'記錄不存在' };
  sheet.deleteRow(rowIdx+1);
  return { success:true, message:'已刪除' };
}

// ── Auth ─────────────────────────────────────────────────────
function ping() {
  return { success:true, message:'pong', version:VERSION, timestamp:now() };
}

function hashPassword(password) {
  return Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password+'impr_salt_2025')
  );
}

function normalizeUsername(value) {
  return String(value || '').normalize('NFKC').trim().replace(/\s+/g, '').toLowerCase();
}

function login(p) {
  const username = normalizeUsername(p.username);
  const password = p.password;
  if (!username||!password) return { success:false, message:'請輸入帳號密碼' };
  const users = sheetToObjects(getSheet(SHEETS.USERS));
  const user = users.find(u => normalizeUsername(u.username)===username && u.status==='啟用');
  if (!user) return { success:false, message:'帳號不存在或已停用' };
  if (user.passwordHash !== hashPassword(password)) return { success:false, message:'密碼錯誤' };
  // Update lastLogin
  try { updateRow(SHEETS.USERS, user.id, { lastLogin:now() }); } catch(e){}
  return { success:true, user:{ id:user.id, username:user.username, name:user.name, role:user.role, email:user.email } };
}

// ── Dashboard ────────────────────────────────────────────────
function getDashboard() {
  const clients    = sheetToObjects(getSheet(SHEETS.CLIENTS));
  const vendors    = sheetToObjects(getSheet(SHEETS.VENDORS));
  const activities = sheetToObjects(getSheet(SHEETS.ACTIVITIES));
  const projects   = sheetToObjects(getSheet(SHEETS.PROJECTS));
  const thisMonth  = today().slice(0,7);

  const recentActs = activities
    .sort((a,b)=>(b.date||'').localeCompare(a.date||''))
    .slice(0,8)
    .map(a=>({ type:a.type, title:a.title, company:a.client, time:(a.date||'').slice(0,16) }));

  const topClients = clients
    .filter(c=>c.status==='合作中')
    .sort((a,b)=>Number(b.projects||0)-Number(a.projects||0))
    .slice(0,5)
    .map((c,i)=>({ id:c.id, name:c.name, level:c.level,
      color:['#667eea','#E8681A','#f093fb','#4facfe','#43e97b'][i],
      projects:Number(c.projects||0), amount:'—' }));

  const monthlyTrend = [];
  for (let i=11;i>=0;i--) {
    const d=new Date(); d.setMonth(d.getMonth()-i);
    const m=Utilities.formatDate(d,'Asia/Taipei','yyyy-MM');
    monthlyTrend.push(clients.filter(c=>(c.createdAt||'').startsWith(m)).length||0);
  }

  return { success:true, data:{
    stats:{
      totalClients: clients.length,
      totalVendors: vendors.length,
      newThisMonth: clients.filter(c=>(c.createdAt||'').startsWith(thisMonth)).length,
      pendingFollow: clients.filter(c=>c.status==='潛在客戶'&&(c.tags||'').includes('需追蹤')).length,
      highPotential: clients.filter(c=>(c.tags||'').includes('高潛力')).length,
      expiringContracts: projects.filter(p=>{
        if(!p.endDate) return false;
        const diff=(new Date(p.endDate)-new Date())/86400000;
        return diff>0&&diff<30;
      }).length,
    },
    recentActivities: recentActs,
    topClients,
    monthlyTrend,
  }};
}

// ── Clients ──────────────────────────────────────────────────
function getClients(p) {
  let data = sheetToObjects(getSheet(SHEETS.CLIENTS));
  data = applyFilter(data, p, ['name','nameEn','taxId','email','phone']);
  const total = data.length;
  const page = parseInt(p.page||1), ps = parseInt(p.pageSize||20);
  return { success:true, data:data.slice((page-1)*ps,page*ps), total };
}

function getClient(id) {
  const item = sheetToObjects(getSheet(SHEETS.CLIENTS)).find(r=>r.id===id);
  if (!item) return { success:false, message:'客戶不存在' };
  const contacts   = sheetToObjects(getSheet(SHEETS.CONTACTS)).filter(c=>c.companyId===id);
  const activities = sheetToObjects(getSheet(SHEETS.ACTIVITIES)).filter(a=>a.clientId===id);
  return { success:true, data:{...item, contactList:contacts, activityList:activities} };
}

function createClient(p) {
  const id = generateId('C'); const ts = now();
  getSheet(SHEETS.CLIENTS).appendRow([
    id, p.name||'', p.nameEn||'', p.taxId||'', p.category||'',
    p.level||'B 級', p.industry||'', p.status||'潛在客戶',
    p.phone||'', p.email||'', p.website||'', p.address||'', p.region||'',
    p.logoUrl||'', p.notes||'',
    Array.isArray(p.tags)?p.tags.join(','):(p.tags||''),
    0, 0, ts, ts, p._user||'',
  ]);
  return { success:true, data:{id}, message:'客戶已建立' };
}

function updateClient(id, p) {
  return updateRow(SHEETS.CLIENTS, id, {
    name:p.name, nameEn:p.nameEn, taxId:p.taxId,
    category:p.category, level:p.level, status:p.status,
    phone:p.phone, email:p.email, website:p.website,
    address:p.address, region:p.region, notes:p.notes,
    tags:Array.isArray(p.tags)?p.tags.join(','):(p.tags||''),
    updatedAt:now(),
  });
}

// ── Vendors ──────────────────────────────────────────────────
function getVendors(p) {
  let data = sheetToObjects(getSheet(SHEETS.VENDORS));
  data = applyFilter(data, p, ['name','taxId','contactName','contactPhone']);
  const total = data.length;
  const page = parseInt(p.page||1), ps = parseInt(p.pageSize||20);
  return { success:true, data:data.slice((page-1)*ps,page*ps), total };
}

function getVendor(id) {
  const item = sheetToObjects(getSheet(SHEETS.VENDORS)).find(r=>r.id===id);
  if (!item) return { success:false, message:'供應商不存在' };
  const evals = sheetToObjects(getSheet(SHEETS.EVALUATIONS)).filter(e=>e.vendorId===id);
  return { success:true, data:{...item, evaluations:evals} };
}

function createVendor(p) {
  const id = generateId('V'); const ts = now();
  getSheet(SHEETS.VENDORS).appendRow([
    id, p.name||'', p.taxId||'', p.category||'', p.status||'配合中',
    p.region||'', p.contact||'', p.phone||'', p.email||'', p.line||'',
    p.address||'', p.payment||'月結30天', p.bankName||'', p.bankAccount||'', p.bankLast4||'',
    0, 0, 0, 0, 0,
    p.notes||'', Array.isArray(p.tags)?p.tags.join(','):(p.tags||''),
    '無合約', ts, ts, p._user||'',
  ]);
  return { success:true, data:{id}, message:'供應商已建立' };
}

function updateVendor(id, p) {
  return updateRow(SHEETS.VENDORS, id, {
    name:p.name, taxId:p.taxId, category:p.category, status:p.status,
    region:p.region, contactName:p.contact, contactPhone:p.phone,
    address:p.address, payment:p.payment, bankLast4:p.bankLast4,
    notes:p.notes, tags:Array.isArray(p.tags)?p.tags.join(','):(p.tags||''),
    updatedAt:now(),
  });
}

// ── Contacts ─────────────────────────────────────────────────
function getContacts(p) {
  let data = sheetToObjects(getSheet(SHEETS.CONTACTS));
  if (p.companyId) data = data.filter(c=>c.companyId===p.companyId);
  data = applyFilter(data, p, ['name','email','phone']);
  return { success:true, data, total:data.length };
}

function createContact(p) {
  const id = generateId('CT');
  getSheet(SHEETS.CONTACTS).appendRow([
    id, p.companyId||'', p.companyType||'',
    p.name||'', p.title||'', p.dept||'',
    p.phone||'', p.email||'', p.line||'', p.wechat||'',
    p.isPrimary||false, p.notes||'', now(), now(),
  ]);
  return { success:true, data:{id}, message:'聯絡人已建立' };
}

// ── Activities ───────────────────────────────────────────────
function getActivities(p) {
  let data = sheetToObjects(getSheet(SHEETS.ACTIVITIES));
  if (p.clientId) data = data.filter(a=>a.clientId===p.clientId);
  if (p.type && p.type!=='all') data = data.filter(a=>a.type===p.type);
  if (p.search) { const q=p.search.toLowerCase(); data=data.filter(a=>(a.title||'').toLowerCase().includes(q)||(a.client||'').toLowerCase().includes(q)); }
  data.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const page=parseInt(p.page||1), ps=parseInt(p.pageSize||20);
  return { success:true, data:data.slice((page-1)*ps,page*ps), total:data.length };
}

function createActivity(p) {
  const id = generateId('A');
  getSheet(SHEETS.ACTIVITIES).appendRow([
    id, p.type||'NOTE', p.title||'',
    p.clientId||'', p.client||'',
    p.contactId||'', p.contact||'',
    p.date||now(), p.content||'', p.nextAction||'', p.nextDate||'',
    '', now(), p._user||'',
  ]);
  try { updateRow(SHEETS.CLIENTS, p.clientId, { updatedAt:now() }); } catch(e){}
  return { success:true, data:{id}, message:'追蹤紀錄已建立' };
}

// ── Projects ─────────────────────────────────────────────────
function getProjects(p) {
  let data = sheetToObjects(getSheet(SHEETS.PROJECTS));
  if (p.clientId) data = data.filter(x=>x.clientId===p.clientId);
  if (p.status && p.status!=='all') data = data.filter(x=>x.status===p.status);
  if (p.search) { const q=p.search.toLowerCase(); data=data.filter(x=>(x.name||'').toLowerCase().includes(q)); }
  return { success:true, data, total:data.length };
}

function createProject(p) {
  const id = generateId('P');
  getSheet(SHEETS.PROJECTS).appendRow([
    id, p.name||'', p.type||'',
    p.clientId||'', p.client||'',
    p.status||'提案中', p.startDate||'', p.date||p.endDate||'',
    p.venue||'', p.budget||'', p.currency||'TWD', p.pm||'',
    Array.isArray(p.vendors)?p.vendors.join(','):(p.vendors||''),
    Array.isArray(p.tags)?p.tags.join(','):(p.tags||''),
    p.notes||'', now(), now(), p._user||'',
  ]);
  return { success:true, data:{id}, message:'專案已建立' };
}

// ── Evaluations ──────────────────────────────────────────────
function getEvaluations(p) {
  let data = sheetToObjects(getSheet(SHEETS.EVALUATIONS));
  if (p.vendorId) data = data.filter(e=>e.vendorId===p.vendorId);
  return { success:true, data, total:data.length };
}

function createEvaluation(p) {
  const id = generateId('E');
  const overall = ((Number(p.punctual||0)+Number(p.quality||0)+Number(p.price||0))/3).toFixed(1);
  getSheet(SHEETS.EVALUATIONS).appendRow([
    id, p.vendorId||'', p.vendor||'',
    p.projectId||'', p.project||'',
    p.date||today(),
    Number(p.punctual||0), Number(p.quality||0), Number(p.price||0),
    Number(overall), p.notes||'', p._user||'', now(),
  ]);
  try { updateRow(SHEETS.VENDORS, p.vendorId, { rating:overall, updatedAt:now() }); } catch(e){}
  return { success:true, data:{id,overall}, message:'評價已建立' };
}

function createTag(name) {
  if (!name) return { success:false, message:'請輸入標籤' };
  const id = generateId('T');
  getSheet(SHEETS.TAGS).appendRow([id, name, '#E8681A', 'general', now()]);
  return { success:true, data:{id,name} };
}

// ── Sheet Headers ────────────────────────────────────────────
function initHeaders(sheet, name) {
  const H = {
    Users:       ['id','username','passwordHash','name','role','email','status','lastLogin','createdAt'],
    Clients:     ['id','name','nameEn','taxId','category','level','industry','status','phone','email','website','address','region','logoUrl','notes','tags','contacts','projects','createdAt','updatedAt','createdBy'],
    Vendors:     ['id','name','taxId','category','status','region','contactName','contactPhone','contactEmail','contactLine','address','payment','bankName','bankAccount','bankLast4','rating','ratingPunctual','ratingQuality','ratingPrice','projects','notes','tags','contractStatus','createdAt','updatedAt','createdBy'],
    Contacts:    ['id','companyId','companyType','name','title','dept','phone','email','line','wechat','isPrimary','notes','createdAt','updatedAt'],
    Projects:    ['id','name','type','clientId','client','status','startDate','endDate','venue','budget','currency','pm','vendors','tags','notes','createdAt','updatedAt','createdBy'],
    Activities:  ['id','type','title','clientId','client','contactId','contact','date','content','nextAction','nextDate','attachments','createdAt','createdBy'],
    Evaluations: ['id','vendorId','vendor','projectId','project','date','punctual','quality','price','overall','notes','reviewer','createdAt'],
    Tags:        ['id','name','color','type','createdAt'],
    Categories:  ['id','name','type','parentId','createdAt'],
    Files:       ['id','entityType','entityId','name','url','size','mimeType','uploadedAt','uploadedBy'],
    Settings:    ['key','value','updatedAt'],
  };
  const logicalName = name.replace(/^CRM_/, '');
  const h = H[logicalName];
  if (h) {
    sheet.getRange(1,1,1,h.length).setValues([h])
      .setBackground('#0D1117').setFontColor('#E8681A').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
  }
}

// ── Setup (run once) ─────────────────────────────────────────
function setupSheets() {
  Object.values(SHEETS).forEach(n => getSheet(n));

  const usersSheet = getSheet(SHEETS.USERS);
  if (!sheetToObjects(usersSheet).find(u=>u.username==='admin')) {
    usersSheet.appendRow([
      generateId('U'),'admin',hashPassword('impr2025'),
      '系統管理員','SUPER_ADMIN','admin@impr.com.tw','啟用','',now()
    ]);
  }

  const tagsSheet = getSheet(SHEETS.TAGS);
  if (!sheetToObjects(tagsSheet).length) {
    ['高潛力','長期合作','高預算','需追蹤','年度標案','國際','推薦','旗艦案','政府標案','醫療'].forEach(n=>{
      tagsSheet.appendRow([generateId('T'),n,'#E8681A','general',now()]);
    });
  }

  SpreadsheetApp.getUi().alert('✅ imPR CRM 初始化完成！\n預設管理員帳號：admin\n預設密碼：impr2025\n\n請在部署後立即修改密碼。');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🚀 imPR CRM')
    .addItem('⚙️ 初始化系統工作表', 'setupSheets')
    .addSeparator()
    .addItem('ℹ️ 查看系統資訊', 'showInfo')
    .addToUi();
}

function showInfo() {
  const c = sheetToObjects(getSheet(SHEETS.CLIENTS)).length;
  const v = sheetToObjects(getSheet(SHEETS.VENDORS)).length;
  SpreadsheetApp.getUi().alert(`imPR CRM v${VERSION}\n客戶：${c} 筆\n供應商：${v} 筆\n狀態：正常`);
}
