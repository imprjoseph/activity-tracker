# imPR CRM · 客戶與供應商管理系統
## 新動力公共關係顧問股份有限公司 · 內部系統 v1.2.0

---

## 📐 系統架構

```
前端 (GitHub Pages)          後端 (Google Apps Script)
─────────────────────        ──────────────────────────
index.html                   Code.gs
styles/main.css       ←→     Google Sheets (資料庫)
js/config.js
js/auth.js
js/api.js
js/utils.js
js/pages/
  ├── dashboard.js
  ├── clients.js
  ├── vendors.js
  ├── contacts.js
  ├── activities.js
  ├── projects.js
  ├── settings.js
js/modals.js
js/app.js
gas/
  └── Code.gs               ← 部署到 Google Apps Script
```

---

## 🚀 部署步驟 (Step by Step)

### Step 1：建立 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com) 建立新試算表
2. 命名為：`imPR CRM Database`
3. 記下試算表的 URL（稍後不需要手動設定，GAS 會自動抓取）

### Step 2：部署 Google Apps Script

1. 在試算表中點擊：**擴充功能 → Apps Script**
2. 刪除預設的 `function myFunction() {}` 內容
3. 將 `gas/Code.gs` 的全部內容貼上
4. 點擊「**儲存**」（Ctrl+S）
5. 點擊上方「**部署**」→「**新增部署**」
6. 設定如下：
   - 類型：**網頁應用程式**
   - 執行身分：**我**
   - 誰可以存取：**所有人**
7. 點擊「**部署**」→ 複製「**網頁應用程式 URL**」
8. URL 格式：`https://script.google.com/macros/s/xxxxx/exec`

### Step 3：初始化資料庫工作表

1. 回到 Google Sheets
2. 點擊選單：**🚀 imPR CRM → ⚙️ 初始化系統工作表**
3. 授權執行（第一次需要授權）
4. 確認出現成功提示

**初始化後會自動建立以下工作表：**

為了能與既有的案件追蹤資料共用同一份 Google Sheet，CRM 分頁統一使用 `CRM_` 前綴。

| 工作表名稱 | 用途 |
|-----------|------|
| `CRM_Users` | 系統使用者帳號 |
| `CRM_Clients` | 客戶資料 |
| `CRM_Vendors` | 供應商資料 |
| `CRM_Contacts` | 聯絡人 |
| `CRM_Projects` | 專案關聯 |
| `CRM_Activities` | 追蹤紀錄 |
| `CRM_Evaluations` | 供應商評價 |
| `CRM_Tags` | 標籤管理 |
| `CRM_Categories` | 分類管理 |
| `CRM_Files` | 附件記錄 |
| `CRM_Settings` | 系統設定 |

### Step 4：設定前端 GAS URL

**方法 A（推薦）：修改 config.js**

開啟 `js/config.js`，找到以下行並替換：

```javascript
// 改前
GAS_ENDPOINT: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

// 改後（貼上你的實際 URL）
GAS_ENDPOINT: 'https://script.google.com/macros/s/AKfycbx...你的ID.../exec',
```

**方法 B：透過系統設定頁**

1. 登入系統後點左側「系統設定」
2. 點「Sheets 連結」分頁
3. 貼上 GAS URL 後點「儲存連結」
4. 點「測試連線」確認

### Step 5：部署至 GitHub Pages

1. 在 GitHub 建立新的 Repository（建議設為 Private）
2. 上傳所有檔案（除了 `gas/` 資料夾）
3. 進入 Repository → Settings → Pages
4. Source 選「**Deploy from a branch**」→ Branch 選 `main`
5. 儲存後等待約 1 分鐘
6. 系統網址格式：`https://[你的帳號].github.io/[repo名稱]/`

---

## 🔐 預設帳號

| 帳號 | 密碼 | 角色 | 備註 |
|------|------|------|------|
| `admin` | `impr2025` | Super Admin | **請部署後立即修改** |

---

## 👥 角色權限表

| 功能 | Super Admin | Admin | 業務 | 專案PM | 財務 | 一般 |
|------|:-----------:|:-----:|:----:|:------:|:----:|:----:|
| 查看客戶 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 新增/編輯客戶 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 刪除客戶 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 查看供應商 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 新增/編輯供應商 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 追蹤紀錄 | ✅ | ✅ | ✅ | ✅ | ❌ | 僅查看 |
| 財務資料 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 系統設定 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 使用者管理 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 匯出資料 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 📊 Google Sheets 資料欄位說明

### CRM_Clients 工作表欄位

| 欄位 | 說明 | 範例 |
|------|------|------|
| id | 系統ID（自動） | `C_1715000000_AB12` |
| name | 公司名稱 | `數位發展部` |
| nameEn | 英文名稱 | `Ministry of Digital Affairs` |
| taxId | 統一編號 | `12345678` |
| category | 分類 | `政府機關` |
| level | 等級 | `S 級` |
| status | 狀態 | `合作中` |
| phone | 電話 | `02-2356-6000` |
| email | Email | `service@moda.gov.tw` |
| region | 地區 | `台北市` |
| tags | 標籤（逗號分隔） | `高潛力,長期合作` |
| contacts | 聯絡人數（自動計算） | `3` |
| projects | 專案數（自動計算） | `8` |
| createdAt | 建立時間 | `2025-05-10 14:30:00` |
| updatedAt | 更新時間 | `2025-05-10 14:30:00` |

### CRM_Vendors 工作表欄位

| 欄位 | 說明 | 範例 |
|------|------|------|
| id | 系統ID（自動） | `V_1715000000_CD34` |
| name | 供應商名稱 | `富立音響工程有限公司` |
| taxId | 統一編號 | `11223344` |
| category | 類型 | `音響` |
| status | 狀態 | `配合中` |
| contactName | 聯絡人 | `王志明` |
| contactPhone | 聯絡電話 | `02-2345-6789` |
| payment | 付款方式 | `月結30天` |
| rating | 整體評分（自動計算） | `4.8` |
| ratingPunctual | 準時度 | `5` |
| ratingQuality | 品質 | `5` |
| ratingPrice | 價格合理性 | `4` |
| tags | 標籤 | `高品質,推薦` |

---

## 🔧 常見問題

### Q: 登入後顯示「Demo 模式」？
A: 尚未設定 GAS URL。請至「系統設定 → Sheets 連結」輸入部署 URL。

### Q: GAS 連線測試失敗？
A: 
1. 確認部署設定「誰可以存取」= **所有人**
2. 確認已點擊「重新部署」（修改 Code.gs 後必須重新部署）
3. 等待 1–2 分鐘讓 GAS 生效

### Q: 新增資料後 Sheets 沒有出現？
A: 請確認已執行「初始化系統工作表」，建立正確的欄位標頭。

### Q: 如何新增系統使用者？
A: 直接在 Google Sheets 的 `CRM_Users` 工作表新增一行，`passwordHash` 欄填入密碼的 SHA-256+salt 雜湊值。可在 GAS 編輯器執行 `hashPassword('你的密碼')` 取得。

### Q: 可以自訂客戶分類嗎？
A: 
- 短期：直接在 `js/config.js` 的 `CLIENT_CATEGORIES` 陣列修改
- 長期：在「系統設定 → 分類管理」新增（需 GAS 連線）

---

## 📁 檔案結構

```
impr-crm/
├── index.html              # 主程式入口
├── styles/
│   └── main.css            # 全域樣式（深色/淺色主題）
├── js/
│   ├── config.js           # ⭐ 系統設定（GAS URL 在此）
│   ├── auth.js             # 登入/登出/Session 管理
│   ├── api.js              # API 呼叫層（GAS + Demo 模式）
│   ├── utils.js            # 共用工具函式
│   ├── modals.js           # 彈窗管理（新增/編輯表單）
│   ├── app.js              # 主控制器/路由
│   └── pages/
│       ├── dashboard.js    # Dashboard 儀表板
│       ├── clients.js      # 客戶管理
│       ├── vendors.js      # 供應商管理
│       ├── contacts.js     # 聯絡人
│       ├── activities.js   # 追蹤紀錄 Timeline
│       ├── projects.js     # 專案關聯
│       └── settings.js     # 系統設定 + 供應商評價
├── gas/
│   └── Code.gs             # ⭐ Google Apps Script 後端（貼到 GAS）
└── README.md               # 本文件
```

---

## ⌨️ 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Ctrl + K` | 開啟全域搜尋 |
| `Ctrl + /` | 新增（依當前頁面） |
| `Esc` | 關閉彈窗 |

---

## 🔮 未來擴充規劃

| 功能 | 優先度 | 說明 |
|------|--------|------|
| Google Drive 附件上傳 | 高 | 合約/報價單直接上傳到 Drive |
| Email 整合 (Gmail API) | 高 | 從系統直接發送追蹤信 |
| 行事曆整合 | 中 | 活動日期同步 Google Calendar |
| 報表匯出 PDF | 中 | 客戶/供應商一覽表 PDF |
| LINE Notify 提醒 | 中 | 合約到期/待追蹤提醒 |
| 行動版最佳化 | 中 | 手機友善介面 |
| 批次匯入 CSV | 高 | 一次匯入大量客戶/供應商 |
| 進階搜尋 | 中 | 複合條件篩選 |
| 操作日誌 | 高 | 記錄所有新增/編輯/刪除操作 |

---

## 📞 技術支援

系統由 imPR 內部開發維護。  
如有問題請聯繫系統管理員。

© 2026 新動力公共關係顧問股份有限公司 · 內部使用，請勿對外散布
