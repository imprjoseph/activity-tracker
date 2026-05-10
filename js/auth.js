/* ════════════════════════════════════════════════════════════
   auth.js — Authentication & Session Management
   ════════════════════════════════════════════════════════════ */

const Auth = (() => {
  const SESSION_KEY = 'impr_crm_session';

  // ── Get current session ─────────────────────────────────────
  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  // ── Save session ────────────────────────────────────────────
  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      ...user,
      loginAt: Date.now(),
    }));
  }

  // ── Clear session ───────────────────────────────────────────
  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // ── Check permission ────────────────────────────────────────
  function hasPermission(perm) {
    const session = getSession();
    if (!session) return false;
    const role = CONFIG.ROLES[session.role];
    if (!role) return false;
    if (role.permissions.includes('*')) return true;
    return role.permissions.includes(perm);
  }

  // ── Login ───────────────────────────────────────────────────
  async function login(username, password) {
    // 1. Try GAS authentication first
    if (CONFIG.GAS_ENDPOINT !== 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec') {
      try {
        const res = await API.call('login', { username, password });
        if (res.success) {
          setSession(res.user);
          return { success: true, user: res.user };
        }
        return { success: false, message: res.message };
      } catch (e) {
        console.warn('GAS auth failed, falling back to demo mode:', e);
      }
    }

    // 2. Demo mode (development)
    const user = CONFIG.DEMO_USERS.find(
      u => u.username === username && u.password === password
    );
    if (user) {
      const sessionUser = { username: user.username, name: user.name, role: user.role };
      setSession(sessionUser);
      return { success: true, user: sessionUser };
    }
    return { success: false, message: '帳號或密碼錯誤' };
  }

  // ── Logout ──────────────────────────────────────────────────
  function logout() {
    clearSession();
    window.location.reload();
  }

  return { getSession, setSession, clearSession, hasPermission, login, logout };
})();

// ── Login Handler ────────────────────────────────────────────
async function handleLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.querySelector('.btn-login');

  if (!username || !password) {
    errEl.textContent = '請輸入帳號與密碼';
    errEl.classList.remove('hidden');
    return;
  }

  btn.innerHTML = '<span>驗證中…</span>';
  btn.disabled = true;

  const result = await Auth.login(username, password);

  if (result.success) {
    errEl.classList.add('hidden');
    document.getElementById('loginScreen').style.opacity = '0';
    document.getElementById('loginScreen').style.transition = 'opacity 0.3s';
    setTimeout(() => {
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appShell').classList.remove('hidden');
      App.init(result.user);
    }, 300);
  } else {
    errEl.textContent = result.message || '帳號或密碼錯誤';
    errEl.classList.remove('hidden');
    btn.innerHTML = '<span>登入系統</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btn.disabled = false;
  }
}

function handleLogout() {
  if (confirm('確定要登出系統？')) Auth.logout();
}

// ── Enter key on login ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginPass')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('loginUser')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginPass').focus();
  });
});
