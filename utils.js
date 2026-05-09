/* ════════════════════════════════════════════════════════════
   utils.js — Shared Utility Functions
   ════════════════════════════════════════════════════════════ */

const Utils = {

  // ── Toast Notifications ──────────────────────────────────────
  toast(message, type = 'info', duration = 3000) {
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '!' };
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ'}</div>
      <span>${message}</span>
    `;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-out');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  },

  // ── Format Date ──────────────────────────────────────────────
  formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch { return dateStr; }
  },

  // ── Relative Time ────────────────────────────────────────────
  relativeTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 30) return Utils.formatDate(dateStr);
    if (d > 0) return `${d} 天前`;
    if (h > 0) return `${h} 小時前`;
    if (m > 0) return `${m} 分鐘前`;
    return '剛剛';
  },

  // ── Status Chip HTML ─────────────────────────────────────────
  statusChip(status) {
    const map = {
      '合作中':  'chip-active',
      '潛在客戶': 'chip-potential',
      '停用':    'chip-inactive',
      '配合中':  'chip-active',
      '備用':    'chip-warning',
      '停止配合': 'chip-inactive',
    };
    const cls = map[status] || 'chip-inactive';
    return `<span class="chip ${cls}">${status}</span>`;
  },

  // ── Rating Stars HTML ─────────────────────────────────────────
  stars(rating, max = 5) {
    let html = '<div class="stars">';
    for (let i = 1; i <= max; i++) {
      html += `<span class="star ${i <= Math.round(rating) ? 'filled' : 'empty'}">★</span>`;
    }
    html += `<span style="font-size:0.72rem;color:var(--text-muted);margin-left:4px">${rating.toFixed(1)}</span></div>`;
    return html;
  },

  // ── Tags HTML ─────────────────────────────────────────────────
  tags(tagArr, accent = false) {
    if (!tagArr || !tagArr.length) return '<span style="color:var(--text-muted);font-size:0.75rem">—</span>';
    return `<div class="tag-list">${tagArr.map(t =>
      `<span class="tag${accent ? ' accent' : ''}">${t}</span>`
    ).join('')}</div>`;
  },

  // ── Avatar Color ──────────────────────────────────────────────
  avatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return CONFIG.AVATAR_COLORS[Math.abs(hash) % CONFIG.AVATAR_COLORS.length];
  },

  // ── Company Avatar ────────────────────────────────────────────
  companyAvatar(name, size = 32) {
    const char = (name || '?')[0];
    const color = Utils.avatarColor(name || '');
    return `<div class="company-avatar" style="background:${color};width:${size}px;height:${size}px">${char}</div>`;
  },

  // ── Level Badge ───────────────────────────────────────────────
  levelBadge(level) {
    const map = {
      'S 級': 'badge-danger',
      'A 級': 'badge-warning',
      'B 級': 'badge-blue',
      'C 級': 'badge-gray',
      '潛在': 'badge-teal',
    };
    return `<span class="chip ${map[level] || 'badge-gray'}">${level}</span>`;
  },

  // ── Debounce ─────────────────────────────────────────────────
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // ── Escape HTML ───────────────────────────────────────────────
  escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  },

  // ── Generate ID ───────────────────────────────────────────────
  generateId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  // ── Paginate Array ────────────────────────────────────────────
  paginate(arr, page, pageSize) {
    const start = (page - 1) * pageSize;
    return arr.slice(start, start + pageSize);
  },

  // ── Loading HTML ──────────────────────────────────────────────
  loadingHtml() {
    return `<div class="loading-spinner"><div class="spinner"></div></div>`;
  },

  // ── Empty State HTML ──────────────────────────────────────────
  emptyHtml(icon, title, sub) {
    return `<div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      <div class="empty-sub">${sub}</div>
    </div>`;
  },

  // ── Render Pagination ─────────────────────────────────────────
  renderPagination(total, page, pageSize, onPageChange) {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return '';

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        pages += `<button class="page-btn${i === page ? ' active' : ''}"
          onclick="(${onPageChange})(${i})">${i}</button>`;
      } else if (i === page - 3 || i === page + 3) {
        pages += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
      }
    }

    return `<div class="table-pagination">
      <span class="pagination-info">顯示 ${start}–${end} / 共 ${total} 筆</span>
      <div class="pagination-controls">
        <button class="page-btn" onclick="(${onPageChange})(${Math.max(1, page-1)})"
          ${page <= 1 ? 'disabled' : ''}>‹</button>
        ${pages}
        <button class="page-btn" onclick="(${onPageChange})(${Math.min(totalPages, page+1)})"
          ${page >= totalPages ? 'disabled' : ''}>›</button>
      </div>
    </div>`;
  },
};

// ── Global Search Handler (debounced) ────────────────────────
const handleGlobalSearch = Utils.debounce((val) => {
  if (val.length < 2) return;
  // Route to current page search
  if (window.CurrentPage && typeof window.CurrentPage.search === 'function') {
    window.CurrentPage.search(val);
  }
}, 400);

// ── Theme Toggle ─────────────────────────────────────────────
function toggleTheme() {
  const body = document.body;
  const isDark = body.dataset.theme === 'dark';
  body.dataset.theme = isDark ? 'light' : 'dark';
  document.getElementById('themeLabel').textContent = isDark ? '深色模式' : '淺色模式';
  localStorage.setItem('impr_theme', body.dataset.theme);
}

// ── Sidebar Toggle ───────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ── Apply saved theme ────────────────────────────────────────
(function() {
  const saved = localStorage.getItem('impr_theme');
  if (saved) {
    document.body.dataset.theme = saved;
    const label = document.getElementById('themeLabel');
    if (label) label.textContent = saved === 'dark' ? '淺色模式' : '深色模式';
  }
})();
