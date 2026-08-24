/* ════════════════════════════════════════════════════════════
   pages/settings.js  v1.4
   分類 / 標籤 / 使用者：本機 localStorage 即時生效
   不再依賴 GAS 連線狀態
   ════════════════════════════════════════════════════════════ */

// ── 本機資料存取 helpers ────────────────────────────────────
const LocalDB = {
  // 客戶分類
  getClientCats() {
    const saved = localStorage.getItem('impr_client_cats');
    return saved ? JSON.parse(saved) : [...CONFIG.CLIENT_CATEGORIES];
  },
  saveClientCats(arr) {
    localStorage.setItem('impr_client_cats', JSON.stringify(arr));
    CONFIG.CLIENT_CATEGORIES.length = 0;
    arr.forEach(c => CONFIG.CLIENT_CATEGORIES.push(c));
  },
  // 供應商分類
  getVendorCats() {
    const saved = localStorage.getItem('impr_vendor_cats');
    return saved ? JSON.parse(saved) : [...CONFIG.VENDOR_CATEGORIES];
  },
  saveVendorCats(arr) {
    localStorage.setItem('impr_vendor_cats', JSON.stringify(arr));
    CONFIG.VENDOR_CATEGORIES.length = 0;
    arr.forEach(c => CONFIG.VENDOR_CATEGORIES.push(c));
  },
  // 標籤
  getTags() {
    const saved = localStorage.getItem('impr_tags');
    return saved ? JSON.parse(saved) : ['高潛力','長期合作','高預算','需追蹤','年度標案','國際','推薦','旗艦案','政府標案','醫療','電信','新客戶'];
  },
  saveTags(arr) { localStorage.setItem('impr_tags', JSON.stringify(arr)); },
  // 使用者
  getUsers() {
    const saved = localStorage.getItem('impr_users');
    return saved ? JSON.parse(saved) : [
      { id:'U001', name:'系統管理員', username:'admin',   password:'impr101',  role:'SUPER_ADMIN', status:'啟用', lastLogin:'2025-05-10 14:00' },
      { id:'U002', name:'業務一',     username:'sales01', password:'sales2025', role:'SALES',      status:'啟用', lastLogin:'2025-05-10 09:30' },
      { id:'U003', name:'專案管理',   username:'pm01',    password:'pm2025',    role:'PM',         status:'啟用', lastLogin:'2025-05-09 17:00' },
    ];
  },
  saveUsers(arr) {
    localStorage.setItem('impr_users', JSON.stringify(arr));
    // 同步更新 CONFIG.DEMO_USERS
    CONFIG.DEMO_USERS.length = 0;
    arr.filter(u => u.status === '啟用').forEach(u =>
      CONFIG.DEMO_USERS.push({ username: u.username, password: u.password, role: u.role, name: u.name })
    );
  },
};

// ── 初始化：把 localStorage 的分類同步回 CONFIG ────────────
(function initLocalDB() {
  const cc = localStorage.getItem('impr_client_cats');
  if (cc) {
    const arr = JSON.parse(cc);
    CONFIG.CLIENT_CATEGORIES.length = 0;
    arr.forEach(c => CONFIG.CLIENT_CATEGORIES.push(c));
  }
  const vc = localStorage.getItem('impr_vendor_cats');
  if (vc) {
    const arr = JSON.parse(vc);
    CONFIG.VENDOR_CATEGORIES.length = 0;
    arr.forEach(c => CONFIG.VENDOR_CATEGORIES.push(c));
  }
  const users = localStorage.getItem('impr_users');
  if (users) {
    const arr = JSON.parse(users);
    let migrated = false;
    let admin = arr.find(u => u.username === 'admin');
    if (!admin) {
      admin = { id:'U001', name:'系統管理員', username:'admin', password:'impr101', role:'SUPER_ADMIN', status:'啟用', lastLogin:'' };
      arr.unshift(admin);
      migrated = true;
    } else if (admin.password !== 'impr101' || admin.status !== '啟用') {
      admin.password = 'impr101';
      admin.status = '啟用';
      migrated = true;
    }
    if (migrated) localStorage.setItem('impr_users', JSON.stringify(arr));
    CONFIG.DEMO_USERS.length = 0;
    arr.filter(u => u.status === '啟用').forEach(u =>
      CONFIG.DEMO_USERS.push({ username: u.username, password: u.password, role: u.role, name: u.name })
    );
  }
})();

// ════════════════════════════════════════════════════════════
const SettingsPage = {
  activeTab: 'system',

  render() {
    window.CurrentPage = SettingsPage;
    const session = Auth.getSession();
    document.getElementById('pageContent').innerHTML = `
      <div class="settings-layout">
        <div class="settings-nav">
          ${[['system','⚙️  系統設定'],['users','👥  使用者管理'],
             ['categories','🏷️  分類管理'],['tags','🔖  標籤管理'],
             ['sheets','📊  Sheets 連結'],['about','ℹ️  關於系統']]
            .map(([id,label]) => `<div class="settings-nav-item${SettingsPage.activeTab===id?' active':''}"
              onclick="SettingsPage.switchTab('${id}')">${label}</div>`).join('')}
        </div>
        <div class="settings-panel" id="settingsPanel">
          ${SettingsPage.renderTab(SettingsPage.activeTab, session)}
        </div>
      </div>`;
  },

  search() {},

  switchTab(id) {
    SettingsPage.activeTab = id;
    document.querySelectorAll('.settings-nav-item').forEach((el, i) => {
      el.classList.toggle('active', ['system','users','categories','tags','sheets','about'][i] === id);
    });
    document.getElementById('settingsPanel').innerHTML =
      SettingsPage.renderTab(id, Auth.getSession());
  },

  renderTab(id, session) {
    switch(id) {
      case 'system':     return SettingsPage.tabSystem(session);
      case 'users':      return SettingsPage.tabUsers();
      case 'categories': return SettingsPage.tabCategories();
      case 'tags':       return SettingsPage.tabTags();
      case 'sheets':     return SettingsPage.tabSheets();
      case 'about':      return SettingsPage.tabAbout();
      default: return '';
    }
  },

  // ══ TAB: 系統設定 ═══════════════════════════════════════════
  tabSystem(session) {
    return `
      <div class="settings-section-title">⚙️ 系統設定</div>
      <div class="form-grid" style="margin-bottom:24px">
        <div class="form-field"><label>公司名稱</label>
          <input type="text" id="cfg_company" value="${CONFIG.COMPANY}" /></div>
        <div class="form-field"><label>系統版本</label>
          <input type="text" value="${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}" readonly style="font-family:var(--font-mono)" /></div>
        <div class="form-field"><label>預設顯示筆數</label>
          <select id="cfg_pagesize">
            ${[20,50,100].map(n=>`<option value="${n}" ${CONFIG.PAGE_SIZE===n?'selected':''}>${n} 筆</option>`).join('')}
          </select></div>
        <div class="form-field"><label>系統語言</label>
          <select><option>繁體中文</option></select></div>
      </div>
      <div class="settings-section-title">👤 目前登入帳號</div>
      <div style="display:flex;align-items:center;gap:12px;padding:16px;background:var(--bg-elevated);border-radius:var(--r-sm);margin-bottom:20px">
        <div class="user-avatar" style="width:44px;height:44px;font-size:1rem">${(session?.name||'A')[0]}</div>
        <div>
          <div style="font-weight:700;font-size:1rem">${session?.name||'未知'}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)">
            ${CONFIG.ROLES[session?.role]?.label||session?.role||''} · 帳號：${session?.username||''}
          </div>
        </div>
      </div>
      <button class="btn-primary" onclick="SettingsPage.saveSystem()">儲存設定</button>`;
  },

  saveSystem() {
    Utils.toast('設定已儲存', 'success');
  },

  // ══ TAB: 使用者管理 ══════════════════════════════════════════
  tabUsers() {
    const users = LocalDB.getUsers();
    return `
      <div class="settings-section-title">👥 使用者管理</div>
      <div class="plaintext-password-note">
        <strong>密碼採明碼顯示</strong>
        <span>僅限授權管理者於內部環境查看，請避免在公開場合開啟此頁。</span>
      </div>
      <div style="margin-bottom:16px;display:flex;justify-content:flex-end">
        <button class="btn-primary" onclick="SettingsPage.openAddUser()">＋ 新增使用者</button>
      </div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>姓名</th><th>帳號</th><th>密碼</th><th>角色</th><th>狀態</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:28px;height:28px;border-radius:50%;
                      background:${Utils.avatarColor(u.name)};
                      display:flex;align-items:center;justify-content:center;
                      font-size:0.72rem;font-weight:700;color:#fff">${u.name[0]}</div>
                    <span style="font-weight:600">${Utils.escapeHtml(u.name)}</span>
                  </div>
                </td>
                <td style="font-family:var(--font-mono);font-size:0.82rem">${Utils.escapeHtml(u.username)}</td>
                <td>
                  <span class="password-plaintext">${Utils.escapeHtml(u.password || '—')}</span>
                </td>
                <td><span class="chip chip-potential">${CONFIG.ROLES[u.role]?.label||u.role}</span></td>
                <td>
                  <span class="chip ${u.status==='啟用'?'chip-active':'chip-inactive'}">${u.status}</span>
                </td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn-icon" onclick="SettingsPage.openEditUser('${u.id}')" title="編輯">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    ${u.username !== 'admin' ? `
                    <button class="btn-icon" onclick="SettingsPage.toggleUserStatus('${u.id}')"
                      title="${u.status==='啟用'?'停用':'啟用'}"
                      style="color:${u.status==='啟用'?'var(--warning)':'var(--success)'}">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.2"/>
                        <path d="M4.5 6.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                      </svg>
                    </button>
                    <button class="btn-icon" onclick="SettingsPage.deleteUser('${u.id}','${Utils.escapeHtml(u.name)}')"
                      title="刪除" style="color:var(--danger)">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10 3.5l-.6 7a1 1 0 01-1 .9H4.6a1 1 0 01-1-.9L3 3.5"
                          stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;font-size:0.78rem;color:var(--text-muted)">
        💡 使用者資料儲存於本機，重新整理後仍保留。新增使用者後即可用該帳號登入。
      </div>`;
  },

  openAddUser() {
    const roleOptions = Object.entries(CONFIG.ROLES)
      .map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('');
    ModalManager.open('新增使用者', `
      <div class="form-grid">
        <div class="form-field">
          <label>姓名 <span class="required">*</span></label>
          <input type="text" id="u_name" placeholder="例：王小明" />
        </div>
        <div class="form-field">
          <label>帳號 <span class="required">*</span></label>
          <input type="text" id="u_username" placeholder="英數字，不含空格" style="font-family:var(--font-mono)" />
        </div>
        <div class="form-field">
          <label>密碼 <span class="required">*</span></label>
          <input type="text" id="u_password" placeholder="至少6位" style="font-family:var(--font-mono)" />
        </div>
        <div class="form-field">
          <label>角色</label>
          <select id="u_role">${roleOptions}</select>
        </div>
      </div>`, () => {
      const name     = document.getElementById('u_name').value.trim();
      const username = document.getElementById('u_username').value.trim();
      const password = document.getElementById('u_password').value.trim();
      const role     = document.getElementById('u_role').value;
      if (!name || !username || !password) { Utils.toast('請填寫所有必填欄位', 'warning'); return; }
      if (password.length < 6) { Utils.toast('密碼至少需要 6 位', 'warning'); return; }
      const users = LocalDB.getUsers();
      if (users.find(u => u.username === username)) { Utils.toast('帳號已存在', 'error'); return; }
      users.push({
        id: 'U' + Date.now(), name, username, password, role,
        status: '啟用', lastLogin: '—'
      });
      LocalDB.saveUsers(users);
      Utils.toast(`✅ 使用者「${name}」已新增，可用 ${username} 登入`, 'success');
      closeModal();
      SettingsPage.switchTab('users');
    });
  },

  openEditUser(id) {
    const users = LocalDB.getUsers();
    const u = users.find(x => x.id === id);
    if (!u) return;
    const roleOptions = Object.entries(CONFIG.ROLES)
      .map(([k,v]) => `<option value="${k}" ${u.role===k?'selected':''}>${v.label}</option>`).join('');
    ModalManager.open(`編輯使用者：${u.name}`, `
      <div class="form-grid">
        <div class="form-field">
          <label>姓名 <span class="required">*</span></label>
          <input type="text" id="u_name" value="${Utils.escapeHtml(u.name)}" />
        </div>
        <div class="form-field">
          <label>帳號</label>
          <input type="text" value="${Utils.escapeHtml(u.username)}" readonly
            style="font-family:var(--font-mono);opacity:0.6" />
        </div>
        <div class="form-field">
          <label>新密碼（留空表示不更改）</label>
          <input type="text" id="u_password" placeholder="留空不更改" style="font-family:var(--font-mono)" />
        </div>
        <div class="form-field">
          <label>角色</label>
          <select id="u_role">${roleOptions}</select>
        </div>
      </div>`, () => {
      const name     = document.getElementById('u_name').value.trim();
      const password = document.getElementById('u_password').value.trim();
      const role     = document.getElementById('u_role').value;
      if (!name) { Utils.toast('請填寫姓名', 'warning'); return; }
      if (password && password.length < 6) { Utils.toast('密碼至少 6 位', 'warning'); return; }
      const idx = users.findIndex(x => x.id === id);
      users[idx] = { ...users[idx], name, role, ...(password ? { password } : {}) };
      LocalDB.saveUsers(users);
      Utils.toast('✅ 使用者資料已更新', 'success');
      closeModal();
      SettingsPage.switchTab('users');
    });
  },

  toggleUserStatus(id) {
    const users = LocalDB.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx < 0) return;
    users[idx].status = users[idx].status === '啟用' ? '停用' : '啟用';
    LocalDB.saveUsers(users);
    Utils.toast(`已${users[idx].status}：${users[idx].name}`, 'success');
    SettingsPage.switchTab('users');
  },

  deleteUser(id, name) {
    if (!confirm(`確定要刪除使用者「${name}」？`)) return;
    const users = LocalDB.getUsers().filter(u => u.id !== id);
    LocalDB.saveUsers(users);
    Utils.toast(`已刪除：${name}`, 'success');
    SettingsPage.switchTab('users');
  },

  // ══ TAB: 分類管理 ════════════════════════════════════════════
  tabCategories() {
    const clientCats = LocalDB.getClientCats();
    const vendorCats = LocalDB.getVendorCats();
    return `
      <div class="settings-section-title">🏷️ 分類管理</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">

        <!-- 客戶分類 -->
        <div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:12px">
            客戶分類（${clientCats.length} 項）
          </div>
          <div id="clientCatList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;max-height:400px;overflow-y:auto">
            ${clientCats.map((c,i) => `
              <div style="display:flex;align-items:center;justify-content:space-between;
                padding:8px 12px;background:var(--bg-elevated);border-radius:var(--r-sm);
                border:1px solid var(--border)">
                <span style="font-size:0.85rem">${Utils.escapeHtml(c)}</span>
                <button onclick="SettingsPage.removeClientCat(${i})"
                  style="color:var(--danger);font-size:0.75rem;padding:2px 8px;
                    border-radius:4px;background:rgba(255,77,109,0.1);
                    border:none;cursor:pointer;flex-shrink:0">
                  移除
                </button>
              </div>`).join('')}
          </div>
          <div style="display:flex;gap:8px">
            <input type="text" id="newClientCat" placeholder="輸入新分類名稱" style="flex:1"
              onkeydown="if(event.key==='Enter') SettingsPage.addClientCat()" />
            <button class="btn-primary" onclick="SettingsPage.addClientCat()">新增</button>
          </div>
        </div>

        <!-- 供應商類型 -->
        <div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:12px">
            供應商類型（${vendorCats.length} 項）
          </div>
          <div id="vendorCatList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;max-height:400px;overflow-y:auto">
            ${vendorCats.map((c,i) => `
              <div style="display:flex;align-items:center;justify-content:space-between;
                padding:8px 12px;background:var(--bg-elevated);border-radius:var(--r-sm);
                border:1px solid var(--border)">
                <span style="font-size:0.85rem">${Utils.escapeHtml(c)}</span>
                <button onclick="SettingsPage.removeVendorCat(${i})"
                  style="color:var(--danger);font-size:0.75rem;padding:2px 8px;
                    border-radius:4px;background:rgba(255,77,109,0.1);
                    border:none;cursor:pointer;flex-shrink:0">
                  移除
                </button>
              </div>`).join('')}
          </div>
          <div style="display:flex;gap:8px">
            <input type="text" id="newVendorCat" placeholder="輸入新類型名稱" style="flex:1"
              onkeydown="if(event.key==='Enter') SettingsPage.addVendorCat()" />
            <button class="btn-primary" onclick="SettingsPage.addVendorCat()">新增</button>
          </div>
        </div>

      </div>
      <div style="margin-top:16px;font-size:0.78rem;color:var(--text-muted)">
        💡 分類儲存於本機，立即生效。新增客戶/供應商時的下拉選單會同步更新。
      </div>`;
  },

  addClientCat() {
    const input = document.getElementById('newClientCat');
    const val = input.value.trim();
    if (!val) { Utils.toast('請輸入分類名稱', 'warning'); return; }
    const cats = LocalDB.getClientCats();
    if (cats.includes(val)) { Utils.toast('此分類已存在', 'warning'); return; }
    cats.push(val);
    LocalDB.saveClientCats(cats);
    input.value = '';
    Utils.toast(`✅ 已新增客戶分類：${val}`, 'success');
    SettingsPage.switchTab('categories');
  },

  removeClientCat(idx) {
    const cats = LocalDB.getClientCats();
    const name = cats[idx];
    if (!confirm(`確定要移除分類「${name}」？`)) return;
    cats.splice(idx, 1);
    LocalDB.saveClientCats(cats);
    Utils.toast(`已移除：${name}`, 'success');
    SettingsPage.switchTab('categories');
  },

  addVendorCat() {
    const input = document.getElementById('newVendorCat');
    const val = input.value.trim();
    if (!val) { Utils.toast('請輸入類型名稱', 'warning'); return; }
    const cats = LocalDB.getVendorCats();
    if (cats.includes(val)) { Utils.toast('此類型已存在', 'warning'); return; }
    cats.push(val);
    LocalDB.saveVendorCats(cats);
    input.value = '';
    Utils.toast(`✅ 已新增供應商類型：${val}`, 'success');
    SettingsPage.switchTab('categories');
  },

  removeVendorCat(idx) {
    const cats = LocalDB.getVendorCats();
    const name = cats[idx];
    if (!confirm(`確定要移除類型「${name}」？`)) return;
    cats.splice(idx, 1);
    LocalDB.saveVendorCats(cats);
    Utils.toast(`已移除：${name}`, 'success');
    SettingsPage.switchTab('categories');
  },

  // ══ TAB: 標籤管理 ════════════════════════════════════════════
  tabTags() {
    const tags = LocalDB.getTags();
    return `
      <div class="settings-section-title">🔖 標籤管理（${tags.length} 個）</div>
      <div id="tagList" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;
        padding:16px;background:var(--bg-elevated);border-radius:var(--r-md);min-height:60px">
        ${tags.map((t,i) => `
          <span style="display:inline-flex;align-items:center;gap:6px;
            padding:6px 12px;border-radius:20px;
            background:var(--accent-dim);color:var(--accent);
            border:1px solid rgba(232,104,26,0.2);font-size:0.83rem;font-weight:500">
            ${Utils.escapeHtml(t)}
            <span onclick="SettingsPage.removeTag(${i})"
              style="cursor:pointer;opacity:0.6;font-size:1rem;line-height:1;
                width:16px;height:16px;display:flex;align-items:center;justify-content:center;
                border-radius:50%;hover:opacity:1"
              onmouseenter="this.style.opacity='1';this.style.background='rgba(255,77,109,0.2)'"
              onmouseleave="this.style.opacity='0.6';this.style.background='transparent'">×</span>
          </span>`).join('')}
        ${!tags.length ? '<span style="color:var(--text-muted);font-size:0.85rem">尚無標籤</span>' : ''}
      </div>
      <div style="display:flex;gap:8px;max-width:400px">
        <input type="text" id="newTag" placeholder="輸入新標籤名稱" style="flex:1"
          onkeydown="if(event.key==='Enter') SettingsPage.addTag()" />
        <button class="btn-primary" onclick="SettingsPage.addTag()">新增標籤</button>
      </div>
      <div style="margin-top:12px;font-size:0.78rem;color:var(--text-muted)">
        💡 標籤儲存於本機，即時生效。可在新增客戶/供應商時選用。
      </div>`;
  },

  addTag() {
    const input = document.getElementById('newTag');
    const val = input.value.trim();
    if (!val) { Utils.toast('請輸入標籤名稱', 'warning'); return; }
    const tags = LocalDB.getTags();
    if (tags.includes(val)) { Utils.toast('此標籤已存在', 'warning'); return; }
    tags.push(val);
    LocalDB.saveTags(tags);
    input.value = '';
    Utils.toast(`✅ 已新增標籤：${val}`, 'success');
    SettingsPage.switchTab('tags');
  },

  removeTag(idx) {
    const tags = LocalDB.getTags();
    const name = tags[idx];
    if (!confirm(`確定要刪除標籤「${name}」？`)) return;
    tags.splice(idx, 1);
    LocalDB.saveTags(tags);
    Utils.toast(`已刪除：${name}`, 'success');
    SettingsPage.switchTab('tags');
  },

  // ══ TAB: Sheets 連結 ════════════════════════════════════════
  tabSheets() {
    const status = API.getStatus();
    const saved  = localStorage.getItem('impr_gas_url') || '';
    const isDemo = status.isDemoMode;
    return `
      <div class="settings-section-title">📊 Google Apps Script 連結設定</div>

      <!-- 連線狀態 -->
      <div style="margin-bottom:20px;padding:14px 18px;
        background:${isDemo?'rgba(255,170,0,0.08)':'rgba(34,197,94,0.08)'};
        border:1px solid ${isDemo?'rgba(255,170,0,0.3)':'rgba(34,197,94,0.3)'};
        border-radius:var(--r-md);display:flex;align-items:center;gap:12px">
        <span style="font-size:1.4rem">${isDemo?'⚠️':'✅'}</span>
        <div>
          <div style="font-weight:700;color:${isDemo?'var(--warning)':'var(--success)'};font-size:0.9rem">
            ${isDemo?'Demo 模式（資料不會存入 Sheets）':'已連線 Google Sheets'}
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;font-family:var(--font-mono)">
            ${isDemo?'尚未設定 GAS URL':'URL：'+status.endpoint.slice(0,55)+(status.endpoint.length>55?'…':'')}
          </div>
        </div>
      </div>

      <!-- URL 輸入 -->
      <div class="form-field" style="max-width:640px;margin-bottom:12px">
        <label>GAS Web App URL</label>
        <input type="text" id="gasUrl"
          value="${saved.includes('YOUR_DEPLOYMENT_ID')||!saved?'':saved}"
          placeholder="https://script.google.com/macros/s/AKfycb.../exec"
          style="font-family:var(--font-mono);font-size:0.82rem" />
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">
          格式：https://script.google.com/macros/s/<strong>你的ID</strong>/exec
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:16px">
        <button class="btn-primary"   onclick="SettingsPage.saveGasUrl()">💾 儲存並套用</button>
        <button class="btn-secondary" onclick="SettingsPage.testConnection()">🔍 診斷連線</button>
        ${!isDemo?'<button class="btn-secondary" onclick="SettingsPage.clearGasUrl()" style="color:var(--danger)">🗑 清除</button>':''}
      </div>
      <div id="connStatus"></div>

      <!-- 部署步驟 -->
      <div style="margin:24px 0 10px" class="settings-section-title">📋 部署步驟</div>
      <div style="padding:16px;background:var(--bg-elevated);border-radius:var(--r-md)">
        <ol style="font-size:0.83rem;color:var(--text-secondary);line-height:2.2;padding-left:18px">
          <li>Google Sheets → <strong>擴充功能 → Apps Script</strong> → 貼上 gas/Code.gs → 儲存</li>
          <li>選函式 <code style="background:var(--bg-surface);padding:1px 6px;border-radius:3px">setupSheets</code> → ▶ 執行（首次需授權）</li>
          <li><strong>部署 → 新增部署</strong> → 網頁應用程式 → 存取：<strong>所有人</strong> → 複製 URL</li>
          <li>貼上 URL → 診斷連線確認 ✅ → 儲存並套用 → 手動重新整理</li>
        </ol>
      </div>`;
  },

  saveGasUrl() {
    const url = document.getElementById('gasUrl')?.value?.trim();
    if (!url) { Utils.toast('請輸入 GAS URL', 'warning'); return; }
    if (!url.startsWith('https://script.google.com/macros/s/')) {
      Utils.toast('URL 格式不正確', 'error'); return;
    }
    localStorage.setItem('impr_gas_url', url);
    const el = document.getElementById('connStatus');
    if (el) el.innerHTML = `
      <div style="padding:12px;background:rgba(34,197,94,0.08);
        border:1px solid rgba(34,197,94,0.25);border-radius:8px">
        <div style="color:var(--success);font-weight:700;margin-bottom:6px">✅ 已儲存！</div>
        <div style="font-size:0.83rem;color:var(--text-secondary);margin-bottom:10px">
          請手動重新整理頁面讓設定生效。
        </div>
        <button class="btn-primary" style="font-size:0.82rem" onclick="location.reload()">
          🔄 立即重新整理
        </button>
      </div>`;
    Utils.toast('✅ GAS URL 已儲存', 'success');
  },

  clearGasUrl() {
    if (!confirm('確定要清除 GAS URL？')) return;
    localStorage.removeItem('impr_gas_url');
    Utils.toast('已清除，重新載入中…', 'info');
    setTimeout(() => location.reload(), 800);
  },

  async testConnection() {
    const url = document.getElementById('gasUrl')?.value?.trim();
    const el  = document.getElementById('connStatus');
    if (!url || url.includes('YOUR_DEPLOYMENT_ID')) {
      el.innerHTML = `<div style="padding:12px;background:rgba(255,170,0,0.08);
        border:1px solid rgba(255,170,0,0.2);border-radius:8px;color:var(--warning)">
        ⚠️ 請先填入 GAS URL</div>`; return;
    }
    el.innerHTML = `<div style="color:var(--text-muted);padding:8px">🔍 連線測試中…</div>`;
    try {
      const pingUrl = url + (url.includes('?')?'&':'?') + 'action=ping';
      const res  = await fetch(pingUrl, { method:'GET' });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) {
        el.innerHTML = `<div style="padding:12px;background:rgba(255,77,109,0.08);
          border:1px solid rgba(255,77,109,0.2);border-radius:8px">
          <div style="color:var(--danger);font-weight:600;margin-bottom:4px">✕ 回應格式錯誤（非 JSON）</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">
            可能原因：部署未選「所有人」，或 Code.gs 語法錯誤
          </div></div>`; return;
      }
      if (data.success) {
        el.innerHTML = `<div style="padding:12px;background:rgba(34,197,94,0.08);
          border:1px solid rgba(34,197,94,0.2);border-radius:8px">
          <div style="color:var(--success);font-weight:600;margin-bottom:4px">✅ 連線成功！</div>
          <div style="font-size:0.8rem;color:var(--text-secondary)">
            版本：${data.version||'—'} ／ 時間：${data.timestamp||'—'}
          </div>
          <button class="btn-primary" style="font-size:0.8rem;margin-top:8px"
            onclick="SettingsPage.saveGasUrl()">💾 儲存並套用此 URL</button>
        </div>`;
      } else {
        el.innerHTML = `<div style="padding:12px;background:rgba(255,77,109,0.08);
          border:1px solid rgba(255,77,109,0.2);border-radius:8px">
          <div style="color:var(--danger);font-weight:600">✕ ${data.message||'GAS 回應失敗'}</div>
        </div>`;
      }
    } catch(e) {
      el.innerHTML = `<div style="padding:12px;background:rgba(255,77,109,0.08);
        border:1px solid rgba(255,77,109,0.2);border-radius:8px">
        <div style="color:var(--danger);font-weight:600;margin-bottom:6px">✕ 無法連線</div>
        <div style="font-size:0.78rem;color:var(--text-muted);line-height:1.9">
          ${e.message}<br>
          1️⃣ 確認已「部署」（非只儲存）<br>
          2️⃣ 存取設定 = <strong>所有人</strong><br>
          3️⃣ URL 格式正確：.../exec 結尾
        </div>
      </div>`;
    }
  },

  // ══ TAB: 關於 ════════════════════════════════════════════════
  tabAbout() {
    return `
      <div class="settings-section-title">ℹ️ 關於系統</div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="display:flex;align-items:center;gap:16px;padding:20px;
          background:var(--bg-elevated);border-radius:var(--r-md)">
          <img src="IMPR_LOGO.png" style="height:48px;object-fit:contain" />
          <div>
            <div style="font-size:1.1rem;font-weight:700">${CONFIG.APP_NAME}</div>
            <div style="font-size:0.83rem;color:var(--text-muted)">
              客戶與供應商管理系統 · v${CONFIG.APP_VERSION}
            </div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">
              ${CONFIG.COMPANY}
            </div>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">系統版本</div><div class="info-value mono">v${CONFIG.APP_VERSION}</div></div>
          <div class="info-item"><div class="info-label">技術架構</div><div class="info-value">GitHub Pages + Google Apps Script</div></div>
          <div class="info-item"><div class="info-label">資料庫</div><div class="info-value">Google Sheets</div></div>
          <div class="info-item"><div class="info-label">本機儲存</div><div class="info-value">localStorage（分類、標籤、使用者）</div></div>
        </div>
        <div style="padding:14px;background:var(--bg-elevated);border-radius:var(--r-sm);
          font-size:0.82rem;color:var(--text-muted);line-height:1.7">
          © 2025 新動力公共關係顧問股份有限公司<br>
          Impetus Public Relations Consultants Co., Ltd.<br>
          內部系統，請勿對外散布。
        </div>
      </div>`;
  },
};

// ════════════════════════════════════════════════════════════
/* EvaluationsPage */
const EvaluationsPage = {
  state: { evals: [], search: '' },
  MOCK: [
    { id:'E001', vendorId:'V001', vendor:'富立音響工程有限公司',  project:'6G標準峰會 2026',       date:'2025-04-20', punctual:5, quality:5, price:4, overall:4.8, notes:'設備完整，準時到場，音質表現優異',   reviewer:'張佳豪' },
    { id:'E002', vendorId:'V008', vendor:'藍鯊攝影工作室',        project:'APEC衛生政策研討會',    date:'2025-03-15', punctual:5, quality:5, price:5, overall:5.0, notes:'攝影品質超出預期，RAW檔交付快速',   reviewer:'陳明志' },
    { id:'E003', vendorId:'V003', vendor:'捷勝舞台設計工程',      project:'2025海洋科技論壇',      date:'2025-02-28', punctual:4, quality:5, price:4, overall:4.6, notes:'搭設精緻，唯搭建時間略長',           reviewer:'王雅婷' },
    { id:'E004', vendorId:'V005', vendor:'翻騰口譯有限公司',      project:'NCC數位韌性論壇',      date:'2025-01-15', punctual:5, quality:4, price:4, overall:4.7, notes:'口譯流暢，中英日三語切換順利',       reviewer:'張佳豪' },
  ],
  async render() {
    window.CurrentPage = EvaluationsPage;
    document.getElementById('pageContent').innerHTML = Utils.loadingHtml();
    await EvaluationsPage.load();
  },

  async load() {
    const { search } = EvaluationsPage.state;
    let data = [];
    const isDemo = API.getStatus().isDemoMode;

    if (isDemo) {
      // Demo 模式：直接用示範資料
      data = [...EvaluationsPage.MOCK];
    } else {
      // GAS 已連線：呼叫真實 API，成功就用 GAS 資料（即使是空陣列）
      try {
        const res = await API.call('getEvaluations', {});
        if (res && res.success) {
          data = res.data || [];   // ← 空陣列也接受，代表 Sheets 裡真的沒資料
        } else {
          Utils.toast('評價載入失敗：' + (res?.message || '請確認 GAS 連線'), 'error');
          data = [];
        }
      } catch(e) {
        Utils.toast('評價載入失敗：' + e.message, 'error');
        data = [];
      }
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(e =>
        (e.vendor||'').toLowerCase().includes(q) ||
        (e.project||'').toLowerCase().includes(q)
      );
    }
    // 確保數字型別正確
    data = data.map(e => ({
      ...e,
      punctual: Number(e.punctual||0),
      quality:  Number(e.quality||0),
      price:    Number(e.price||0),
      overall:  Number(e.overall||0),
    }));
    EvaluationsPage.state.evals = data;
    EvaluationsPage.renderPage();
  },

  search(val) {
    EvaluationsPage.state.search = val;
    EvaluationsPage.load();
  },
  renderPage() {
    const { evals } = EvaluationsPage.state;
    document.getElementById('pageContent').innerHTML = `
      <div class="list-controls">
        <div class="list-filters">
          <span style="font-size:0.8rem;color:var(--text-muted)">共 ${evals.length} 筆評價</span>
        </div>
        <button class="btn-secondary" style="font-size:0.78rem" onclick="EvaluationsPage.exportCsv()">匯出 CSV</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${!evals.length ? Utils.emptyHtml('⭐','尚無評價紀錄','每次專案結束後記錄供應商評分') :
          evals.map(e => `
          <div class="dashboard-card"><div style="padding:18px 20px">
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
                  <div class="rating-bar-wrap"><div class="rating-bar" style="width:${s/5*100}%"></div></div>
                  <div class="rating-score">${s}.0</div>
                </div>`).join('')}
            </div>
            ${e.notes?`<div style="margin-top:12px;font-size:0.83rem;color:var(--text-secondary);
              padding:10px;background:var(--bg-elevated);border-radius:var(--r-sm)">
              "${Utils.escapeHtml(e.notes)}" — ${e.reviewer}</div>`:''}
          </div></div>`).join('')}
      </div>`;
  },
  exportCsv() {
    const h = ['供應商','專案','日期','準時','品質','價格','整體','備註','評分人'];
    const r = EvaluationsPage.state.evals.map(e =>
      [e.vendor,e.project,e.date,e.punctual,e.quality,e.price,e.overall.toFixed(1),e.notes||'',e.reviewer]);
    const csv = [h,...r].map(row=>row.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `imPR_供應商評價_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); Utils.toast('已匯出 CSV','success');
  },
};
