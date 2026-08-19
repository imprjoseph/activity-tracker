# 會議活動追蹤系統

依《會議活動追蹤系統功能規格暨分階段開發計畫書》建置的 Google Apps Script MVP。它保留 Excel 匯入習慣，增加活動完整性檢核、期限督辦、主管交辦、寄送稽核與管理報表。

## 已完成的 MVP 範圍

- 公司 Google 帳號、五種角色、後台帳號管理與案件層級權限。
- 活動、任務、我的工作、主管交辦與 Dashboard。
- CSV／XLSX／XLS 上傳、工作表選擇、欄位自動偵測與人工對應。
- 「更新追蹤表」及「更新進度」兩種模式、差異預覽、重複判斷、人工修改衝突保護、超過 20% 移除二次確認與不可硬刪的批次紀錄。
- 12 個追蹤大項、關鍵字／同義詞檢核、補成任務與不適用原因。
- 09:00 每日彙整與主管交辦 09:00／13:00／18:00 排程；測試模式、每日上限、合併寄送、失敗重試與冪等防重寄。
- 案件／人員完成率、準時率、逾期數、完整性狀態與 CSV 匯出。
- 每日 02:00 自動備份、30–90 天保存與管理員手動備份。
- Node 單元測試、GitHub Actions、資料字典、匿名樣本與 UAT 清單。

## 首次部署

1. 在 Google Apps Script 建立「開發環境」專案，並確認所屬 Google Cloud 專案已啟用 Google Drive API。
2. 複製 `.clasp.json.example` 為 `.clasp.json`，填入 Script ID。不得提交真實 `.clasp.json`。
3. 在本目錄執行 `clasp push`；部署前可執行 `npm test`。
4. 從 Apps Script 編輯器執行 `setupTracker()` 並完成授權。它會建立／遷移中央主資料庫、首位管理員、12 大項、提醒排程與每日備份排程。
5. 部署為 Web App：執行身分選「使用者存取網頁應用程式」、存取權限選公司網域。正式環境不可開放匿名存取。
6. 開啟 Web App，先在「管理後台」設定測試收件人。完成 UAT 前不要關閉測試模式。
7. 依相同步驟建立 staging 與 production 專案／Sheet；正式部署只使用 production Script ID。

## 安全與營運提醒

- 上傳原檔存於系統建立的受限 Drive 資料夾；不得將正式名單、護照、身分證、健康與航班資料提交至 GitHub。
- Apps Script 與 Gmail 配額依公司 Workspace 方案而異，上線前需用實際帳號驗證。
- 第一版提醒對象限內部同仁。若未來寄給講師或廠商，需另做同意、退訂與個資保存規則。
- 自動排程以 Asia/Taipei 執行。Apps Script 可能在整點附近執行，防重寄以「類型＋收件人＋活動＋日期＋時段」控制。
- 預設備份保留 60 天，可用 Script Property `BACKUP_RETENTION_DAYS` 調整為 30–90 天；公司仍需指定還原責任人並定期演練。

## 專案結構

```text
src/server   Apps Script 服務、權限、匯入、檢核、提醒、統計
src/client   Web App 介面與樣式
src/shared   共用欄位、狀態、資料規則與可測試核心函式
tests        匯入、檢核、提醒與統計測試
docs         資料字典、匿名樣本與驗收清單
```

## 尚待公司提供／確認

- 5–10 份去識別化 Excel 樣本，用來調整欄名別名與日期格式。
- 公司 Workspace 網域、預計人數、老闆副知策略、寄信配額與正式 Repo／部署核准人。
- 活動封存年限、個資刪除流程、PM 是否可代更新，以及正式備份與還原演練週期。

AI 語意判讀、Google Calendar、外部客戶登入與正式資料庫升級保留在第二階段，不影響目前規則式 MVP 上線驗證。

部署、權限、備份與還原操作請見 [`docs/deployment-and-recovery.md`](docs/deployment-and-recovery.md)。
