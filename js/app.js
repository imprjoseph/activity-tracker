/* ════════════════════════════════════════════════════════════
   app.js — Main Application Controller
   ════════════════════════════════════════════════════════════ */

const App = {
  currentPage: 'dashboard',

  pages: {
    dashboard:   { title: 'Dashboard',    breadcrumb: '首頁 / Dashboard',   actionLabel: '快速新增',   module: () => DashboardPage.render() },
    clients:     { title: '客戶管理',     breadcrumb: '首頁 / 客戶管理',    actionLabel: '新增客戶',   module: () => ClientsPage.render() },
    contacts:    { title: '聯絡人',       breadcrumb: '首頁 / 聯絡人',      actionLabel: '新增聯絡人', module: () => ContactsPage.render() },
    vendors:     { title: '供應商管理',   breadcrumb: '首頁 / 供應商管理',  actionLabel: '新增供應商', module: () => VendorsPage.render() },
    evaluations: { title: '供應商評價',   breadcrumb: '首頁 / 供應商評價',  actionLabel: '新增評價',   module: () => EvaluationsPage.render() },
    activities:  { title: '追蹤紀錄',     breadcrumb: '首頁 / 追蹤紀錄',    actionLabel: '新增追蹤',   module: () => ActivitiesPage.render() },
    projects:    { title: '專案關聯',     breadcrumb: '首頁 / 專案關聯',    actionLabel: '新增專案',   module: () => ProjectsPage.render() },
    settings:    { title: '系統設定',     breadcrumb: '首頁 / 系統設定',    actionLabel: '儲存設定',   module: () => SettingsPage.render() },
  },

  init(user) {
    // Set user info in sidebar
    document.getElementById('userName').textContent   = user.name;
    document.getElementById('userAvatar').textContent = user.name[0];
    document.getElementById('userRole').textContent   = CONFIG.ROLES[user.role]?.label || user.role;

    // Auto-restore theme
    const saved = localStorage.getItem('impr_theme') || 'dark';
    document.body.dataset.theme = saved;
    document.getElementById('themeLabel').textContent = saved === 'dark' ? '淺色模式' : '深色模式';

    // 顯示連線狀態列
    App.renderConnectionBadge();

    // Navigate to dashboard
    navigate('dashboard');
  },

  renderConnectionBadge() {
    const status  = API.getStatus();
    const isDemo  = status.isDemoMode;
    const topbar  = document.querySelector('.topbar-right');
    if (!topbar) return;

    // 移除舊的 badge
    const old = document.getElementById('connBadge');
    if (old) old.remove();

    const badge = document.createElement('div');
    badge.id = 'connBadge';
    badge.title = isDemo
      ? 'Demo 模式：資料只在瀏覽器中，不會寫入 Google Sheets'
      : '已連線 Google Sheets：資料即時寫入';
    badge.style.cssText = `
      display:flex;align-items:center;gap:5px;
      padding:4px 10px;border-radius:20px;cursor:pointer;
      font-size:0.73rem;font-weight:600;white-space:nowrap;
      background:${isDemo ? 'rgba(255,170,0,0.12)' : 'rgba(34,197,94,0.12)'};
      color:${isDemo ? '#FFAA00' : '#22C55E'};
      border:1px solid ${isDemo ? 'rgba(255,170,0,0.3)' : 'rgba(34,197,94,0.3)'};
    `;
    badge.innerHTML = `
      <span style="width:7px;height:7px;border-radius:50%;
        background:${isDemo ? '#FFAA00' : '#22C55E'};
        ${!isDemo ? 'animation:pulse 2s infinite' : ''}"></span>
      ${isDemo ? 'Demo 模式' : 'Sheets 連線中'}
    `;
    badge.onclick = () => navigate('settings');

    // 插入在 notification bell 前
    const bell = topbar.querySelector('.notification-bell');
    if (bell) topbar.insertBefore(badge, bell);
    else topbar.prepend(badge);
  },
};

// ── Navigation ───────────────────────────────────────────────
function navigate(pageId) {
  const page = App.pages[pageId];
  if (!page) return;

  App.currentPage = pageId;

  // Update topbar
  document.getElementById('pageTitle').textContent           = page.title;
  document.getElementById('breadcrumb').textContent          = page.breadcrumb;
  document.getElementById('topbarActionLabel').textContent   = page.actionLabel;
  document.getElementById('globalSearch').value             = '';

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });

  // Render module
  page.module();
}

// ── Keyboard Shortcuts ────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Escape closes modal
  if (e.key === 'Escape') {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay.classList.contains('hidden')) closeModal();
  }
  // Ctrl+K focuses search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('globalSearch').focus();
  }
  // Ctrl+/ opens create modal
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    openCreateModal();
  }
});

// ── Auto-login if session exists ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.getSession();
  if (session) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    App.init(session);
  }
});
