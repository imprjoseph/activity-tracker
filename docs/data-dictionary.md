# 資料字典

正式活動資料只存放於受限制的 Google Sheet 與 Drive；GitHub 僅保存程式、文件與匿名樣本。

| 工作表 | 主鍵／識別 | 用途 |
|---|---|---|
| Users | `user_id`、`email` | 帳號、角色、啟用狀態 |
| Events | `event_id` | 活動主檔、PM、活動日期、完整性狀態與版本 |
| EventMembers | `event_id`＋`user_id` | 案件層級權限 |
| Categories | `category_id` | 12 個追蹤大項，可停用與版本化 |
| EventCategories | `event_id`＋`category_id` | 每案勾選的大項與確認人 |
| ChecklistRules | `rule_id` | 關鍵字、概念與最低必要／建議層級 |
| ChecklistDecisions | `decision_id` | 補項、不適用、人工確認原因 |
| Tasks | `task_id` | 追蹤事項、目前期限、原始期限、負責人、來源、外部鍵值與軟刪除 |
| Assignments | `assignment_id` | 主管交辦、一至多人、優先級與提醒時段 |
| ImportBatches | `batch_id` | 原檔連結、欄位對應、模式、摘要與操作者 |
| ChangeLog | `change_id` | 實體前後值、操作人、時間與關聯批次 |
| ReminderRules | `rule_id` | 時段、副知、測試模式、每日上限 |
| ReminderLog | `dedupe_key` | 收件人、結果、錯誤與防重寄鍵 |

日期欄位以 `YYYY-MM-DD` 儲存；時間戳記使用 Asia/Taipei 的 ISO 格式。`Tasks.original_due` 在建立時固定保存，用於準時率計算；展延只更新 `due`。所有識別碼由 UUID 派生，不以試算表列號作為系統主鍵。
