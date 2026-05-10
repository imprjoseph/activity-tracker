/* ════════════════════════════════════════════════════════════
   auth.js — Authentication & Session Management  v1.3
   修復：login 統一走 demo 帳號驗證，GAS 連線後可從 Users Sheet 驗證
   ════════════════════════════════════════════════════════════ */

const Auth = (() => {
  const SESSION_KEY = 'impr_crm_session';

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

  // ── Login：永遠先比對本機 DEMO_USERS，成功就直接登入 ─────────
  // GAS Users Sheet 驗證為「未來擴充」，目前不啟用
  // 原因：GAS Users Sheet 需要先手動新增帳號才能使用，
  //       貿然呼叫會造成等待超時卡死
  async function login(username, password) {
    // Step 1：本機帳號驗證（永遠有效，包含 GAS 連線後）
    const localUser = CONFIG.DEMO_USERS.find(
      u => u.username === username && u.password === password
    );
    if (localUser) {
      const sessionUser = {
        username: localUser.username,
        name:     localUser.name,
        role:     localUser.role,
      };
      setSession(sessionUser);
      return { success: true, user: sessionUser };
    }

    // Step 2：若本機驗證失敗 + GAS 已連線，嘗試 GAS Users Sheet
    const gasUrl = localStorage.getItem('impr_gas_url') || '';
    const hasGAS  = gasUrl && !gasUrl.includes('YOUR_DEPLOYMENT_ID');

    if (hasGAS) {
      try {
        const res = await Promise.race([
          API.call('login', { username, password }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('GAS 連線逾時（8秒）')), 8000)
          ),
        ]);
        if (res && res.success) {
          setSession(res.user);
          return { success: true, user: res.user };
        }
        return { success: false, message: res?.message || '帳號或密碼錯誤' };
      } catch (e) {
        console.warn('[Auth] GAS login failed:', e.message);
        return { success: false, message: `帳號密碼錯誤（GAS：${e.message}）` };
      }
    }

    return { success: false, message: '帳號或密碼錯誤' };
  }

  function logout() {
    clearSession();
    window.location.reload();
  }

  return { getSession, setSession, clearSession, hasPermission, login, logout };
})();

// ── Login Handler ─────────────────────────────────────────────
async function handleLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.querySelector('.btn-login');

  errEl.classList.add('hidden');

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
