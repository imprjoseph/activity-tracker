/* ════════════════════════════════════════════════════════════
   config.js — System Configuration
   替換 GAS_ENDPOINT 為您的 Google Apps Script 部署 URL
   ════════════════════════════════════════════════════════════ */

const CONFIG = {
  // ── Google Apps Script Web App URL ──────────────────────────
  // 部署後貼上您的 GAS Deployment URL
  GAS_ENDPOINT: 'https://script.google.com/macros/s/AKfycby8cwHcoir8mSu_H7Eg1GIaoKSI0gVvg3MGFNrVosK5eIPe3UQ9AelWhDFNDWPXaKDfFQ/exec',

  // ── System Info ──────────────────────────────────────────────
  APP_NAME: 'imPR CRM',
  APP_VERSION: '1.3.1',
  COMPANY: '新動力公共關係顧問股份有限公司',

  // ── Spreadsheet Sheet Names ──────────────────────────────────
  SHEETS: {
    USERS:       'CRM_Users',
    CLIENTS:     'CRM_Clients',
    VENDORS:     'CRM_Vendors',
    CONTACTS:    'CRM_Contacts',
    PROJECTS:    'CRM_Projects',
    ACTIVITIES:  'CRM_Activities',
    EVALUATIONS: 'CRM_Evaluations',
    TAGS:        'CRM_Tags',
    CATEGORIES:  'CRM_Categories',
    FILES:       'CRM_Files',
    SETTINGS:    'CRM_Settings',
  },

  // ── Pagination ───────────────────────────────────────────────
  PAGE_SIZE: 20,

  // ── Client Categories ────────────────────────────────────────
  CLIENT_CATEGORIES: [
    '政府機關', '醫學會', '醫院', '藥廠', '科技公司',
    '電信業者', 'NGO', '學校單位', '金融機構', '媒體',
    '國際組織', '協會公會', '其他'
  ],

  CLIENT_LEVELS: ['S 級', 'A 級', 'B 級', 'C 級', '潛在'],

  CLIENT_STATUS: {
    ACTIVE:    '合作中',
    POTENTIAL: '潛在客戶',
    INACTIVE:  '停用',
  },

  // ── Vendor Categories ─────────────────────────────────────────
  VENDOR_CATEGORIES: [
    // 活動技術設備
    '音響', '燈光', '視訊 / LED', '直播技術', '硬體設備',
    // 場地 & 製作
    '展場搭建', '舞台設計', '印刷輸出', '平面設計',
    // 人員
    '工讀生 / 活動人力', '司儀 / 主持人', '口譯 / 翻譯',
    // 影像 & 媒體
    '攝影', '影片製作', 'YouTuber', 'Podcast',
    '媒體 / 記者', '網紅 / KOL',
    // 其他服務
    '交通 / 車輛', '餐飲供應', '旅宿住宿',
    '網站開發', '公關媒體', '其他'
  ],

  // ── Vendor Category Groups（用於分組顯示）──────────────────────
  VENDOR_CATEGORY_GROUPS: {
    '活動技術設備': ['音響', '燈光', '視訊 / LED', '直播技術', '硬體設備'],
    '場地 & 製作':  ['展場搭建', '舞台設計', '印刷輸出', '平面設計'],
    '人員':         ['工讀生 / 活動人力', '司儀 / 主持人', '口譯 / 翻譯'],
    '影像 & 媒體':  ['攝影', '影片製作', 'YouTuber', 'Podcast', '媒體 / 記者', '網紅 / KOL'],
    '其他服務':     ['交通 / 車輛', '餐飲供應', '旅宿住宿', '網站開發', '公關媒體', '其他'],
  },

  // ── Vendor Category Icons──────────────────────────────────────
  VENDOR_CATEGORY_ICONS: {
    '音響':              '🔊',
    '燈光':              '💡',
    '視訊 / LED':        '📺',
    '直播技術':          '📡',
    '硬體設備':          '🖥️',
    '展場搭建':          '🏗️',
    '舞台設計':          '🎭',
    '印刷輸出':          '🖨️',
    '平面設計':          '🎨',
    '工讀生 / 活動人力': '👷',
    '司儀 / 主持人':     '🎤',
    '口譯 / 翻譯':       '🌐',
    '攝影':              '📸',
    '影片製作':          '🎬',
    'YouTuber':          '▶️',
    'Podcast':           '🎙️',
    '媒體 / 記者':       '📰',
    '網紅 / KOL':        '⭐',
    '交通 / 車輛':       '🚐',
    '餐飲供應':          '🍱',
    '旅宿住宿':          '🏨',
    '網站開發':          '💻',
    '公關媒體':          '📣',
    '其他':              '📦',
  },

  VENDOR_STATUS: {
    ACTIVE:   '配合中',
    STANDBY:  '備用',
    INACTIVE: '停止配合',
  },

  // ── Activity Types ────────────────────────────────────────────
  ACTIVITY_TYPES: {
    CALL:    { label: '通話', color: 'blue',    icon: '📞' },
    EMAIL:   { label: 'Email', color: 'teal',  icon: '📧' },
    VISIT:   { label: '拜訪', color: 'success', icon: '🤝' },
    QUOTE:   { label: '報價', color: 'warning', icon: '💰' },
    PROPOSAL:{ label: '提案', color: 'info',    icon: '📋' },
    CONTRACT:{ label: '合約', color: 'danger',  icon: '📄' },
    NOTE:    { label: '備註', color: 'gray',    icon: '📝' },
  },

  // ── Project Types ─────────────────────────────────────────────
  PROJECT_TYPES: [
    '國際研討會', '記者會', '論壇', '展覽', '醫學年會',
    '電信活動', '政府標案', '啟動儀式', '頒獎典禮', '其他'
  ],

  // ── Regions ───────────────────────────────────────────────────
  REGIONS: [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '嘉義市', '宜蘭縣', '新竹縣', '苗栗縣',
    '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '花蓮縣',
    '台東縣', '澎湖縣', '金門縣', '連江縣', '全台', '海外'
  ],

  // ── User Roles & Permissions ──────────────────────────────────
  ROLES: {
    SUPER_ADMIN: {
      label: 'Super Admin',
      permissions: ['*'],
    },
    ADMIN: {
      label: 'Admin',
      permissions: ['read', 'create', 'edit', 'delete', 'export'],
    },
    SALES: {
      label: '業務人員',
      permissions: ['read', 'create', 'edit', 'activity:create'],
    },
    PM: {
      label: '專案管理',
      permissions: ['read', 'create', 'edit', 'project:manage'],
    },
    FINANCE: {
      label: '財務人員',
      permissions: ['read', 'finance:view', 'export'],
    },
    VIEWER: {
      label: '一般使用者',
      permissions: ['read'],
    },
  },

  // ── Demo Users (for offline / dev mode) ──────────────────────
  // Production: 改為從 GAS Users Sheet 驗證
  DEMO_USERS: [
    { username: 'admin',   password: 'impr2025', role: 'SUPER_ADMIN', name: '系統管理員' },
    { username: 'sales01', password: 'sales2025', role: 'SALES',      name: '業務一' },
    { username: 'pm01',    password: 'pm2025',    role: 'PM',         name: '專案管理' },
  ],

  // ── Color Palette for Avatars ─────────────────────────────────
  AVATAR_COLORS: [
    '#667eea', '#E8681A', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#a18cd1', '#fccb90',
  ],
};

// Freeze config
Object.freeze(CONFIG);
