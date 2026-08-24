/* ════════════════════════════════════════════════════════════
   auth.js — Authentication & Session Management  v1.3
   修復：login 統一走 demo 帳號驗證，GAS 連線後可從 Users Sheet 驗證
   ════════════════════════════════════════════════════════════ */

const Auth = (() => {
  const SESSION_KEY = 'impr_crm_session';

  // 統一帳號格式：全形轉半形、移除複製時夾帶的空白，並忽略大小寫。
  function normalizeUsername(value) {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      ...user, loginAt: Date.now(),
    }));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function hasPermission(perm) {
    const session = getSession();
    if (!session) return false;
    const role = CONFIG.ROLES[session.role];
    if (!role) return false;
    if (role.permissions.includes('*')) return true;
    return role.permissions.includes(perm);
  }

  // ── Login：帳號驗證完全在前端完成，不依賴跨網域 GAS ──────────
  async function login(username, password) {
    const normalizedUsername = normalizeUsername(username);

    // 管理員帳號與 Google Sheet CRM_Users 的明碼設定保持一致。
    // 放在 localStorage 之前，避免瀏覽器殘留舊設定造成登入失敗。
    if (normalizedUsername === 'admin') {
      if (password !== 'impr101') return { success: false, message: '密碼錯誤' };
      const adminUser = {
        username: 'admin',
        name: '系統管理員',
        role: 'SUPER_ADMIN',
      };
      setSession(adminUser);
      return { success: true, user: adminUser };
    }

    // 其他帳號使用本機「系統設定 → 使用者管理」資料。
    const localUser = CONFIG.DEMO_USERS.find(
      u => normalizeUsername(u.username) === normalizedUsername
    );
    if (localUser) {
      if (localUser.password !== password) {
        return { success: false, message: '密碼錯誤' };
      }
      const sessionUser = {
        username: localUser.username,
        name:     localUser.name,
        role:     localUser.role,
      };
      setSession(sessionUser);
      return { success: true, user: sessionUser };
    }
    return { success: false, message: '帳號不存在' };
  }

  function logout() {
    clearSession();
    window.location.reload();
  }

  return { getSession, setSession, clearSession, hasPermission, normalizeUsername, login, logout };
})();

// ── Login Handler ─────────────────────────────────────────────
async function handleLogin() {
  const userInput = document.getElementById('loginUser');
  const username = Auth.normalizeUsername(userInput.value);
  const password = document.getElementById('loginPass').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.querySelector('.btn-login');

  errEl.classList.add('hidden');
  userInput.value = username;

  if (!username || !password) {
    errEl.textContent = '請輸入帳號與密碼';
    errEl.classList.remove('hidden');
    return;
  }

  btn.innerHTML = '<span>驗證中…</span>';
  btn.disabled  = true;

  try {
    const result = await Auth.login(username, password);

    if (result.success) {
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
  } catch (e) {
    errEl.textContent = '系統錯誤：' + e.message;
    errEl.classList.remove('hidden');
    btn.innerHTML = '<span>登入系統</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btn.disabled = false;
  }
}

function handleLogout() {
  if (confirm('確定要登出系統？')) Auth.logout();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginPass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('loginUser')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginPass').focus();
  });
});
