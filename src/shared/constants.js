(function (root) {
  "use strict";

  var constants = Object.freeze({
    TIME_ZONE: "Asia/Taipei",
    ROLES: Object.freeze({
      ADMIN: "admin",
      BOSS: "boss",
      PM: "pm",
      STAFF: "staff",
      VIEWER: "viewer"
    }),
    ROLE_LABELS: Object.freeze({
      admin: "系統管理員",
      boss: "老闆／主管",
      pm: "專案經理",
      staff: "執行同仁",
      viewer: "唯讀／稽核"
    }),
    EVENT_STATUSES: Object.freeze(["規劃中", "進行中", "暫停", "已完成", "已封存"]),
    TASK_STATUSES: Object.freeze(["未開始", "進行中", "待確認", "完成", "取消", "不適用"]),
    IMPORT_MODES: Object.freeze({ TRACKER: "tracker", PROGRESS: "progress" }),
    IMPORT_MODE_LABELS: Object.freeze({ tracker: "更新追蹤表", progress: "更新進度" }),
    REQUIRED_IMPORT_FIELDS: Object.freeze(["item", "due"]),
    IMPORT_FIELDS: Object.freeze([
      { key: "item", label: "追蹤項目", required: true, aliases: ["追蹤項目", "工作項目", "任務", "項目", "待辦事項", "task", "item"] },
      { key: "due", label: "預計完成日期", required: true, aliases: ["預計完成日期", "預定完成日", "預計完成日", "截止日", "期限", "due", "due date"] },
      { key: "completedAt", label: "實際完成日期", required: false, aliases: ["實際完成日期", "完成日期", "完成日", "done", "completed at"] },
      { key: "ownerEmail", label: "負責人 Email", required: false, aliases: ["負責人 email", "負責人email", "負責人信箱", "email", "owner", "owner email"] },
      { key: "status", label: "狀態", required: false, aliases: ["狀態", "進度", "status"] },
      { key: "notes", label: "備註", required: false, aliases: ["備註", "說明", "notes", "note"] },
      { key: "category", label: "追蹤大項", required: false, aliases: ["追蹤大項", "大項", "分類", "category"] },
      { key: "externalKey", label: "外部鍵值", required: false, aliases: ["外部鍵值", "編號", "id", "external key", "task id"] }
    ]),
    SHEETS: Object.freeze({
      Users: ["user_id", "email", "name", "role", "active", "created_at", "updated_at"],
      Events: ["event_id", "name", "event_date", "pm", "status", "completeness_status", "version", "created_at", "updated_at"],
      EventMembers: ["event_id", "user_id", "permission", "created_at"],
      Categories: ["category_id", "name", "active", "version", "keywords"],
      EventCategories: ["event_id", "category_id", "selected", "confirmed_at", "confirmed_by"],
      ChecklistRules: ["rule_id", "category_id", "concept", "keywords", "level", "condition", "active", "version"],
      ChecklistDecisions: ["decision_id", "event_id", "category_id", "concept", "status", "reason", "actor", "time"],
      Tasks: ["task_id", "event_id", "category_id", "item", "owner_email", "due", "done", "status", "notes", "source", "external_key", "version", "updated_at", "completed_at", "removed_at", "original_due"],
      Assignments: ["assignment_id", "event_id", "title", "owner_emails", "due", "priority", "status", "notes", "reminder_times", "created_by", "created_at", "updated_at", "completed_at"],
      ImportBatches: ["batch_id", "event_id", "mode", "file_ref", "file_name", "summary_json", "mapping_json", "created_by", "created_at", "status"],
      ChangeLog: ["change_id", "entity", "entity_id", "action", "before_json", "after_json", "actor", "time", "batch_id"],
      ReminderRules: ["rule_id", "scope", "times", "cc", "template", "enabled", "test_mode", "test_recipient", "daily_limit", "updated_at"],
      ReminderLog: ["log_id", "dedupe_key", "kind", "entity_ids", "recipient", "cc", "result", "sent_at", "error", "batch_id"]
    }),
    DEFAULT_REMINDER_RULES: Object.freeze([
      { rule_id: "RR_TASK_DAILY", scope: "tasks", times: "09:00", cc: "", template: "default-task", enabled: true, test_mode: true, test_recipient: "", daily_limit: 80 },
      { rule_id: "RR_ASSIGNMENT", scope: "assignments", times: "09:00,13:00,18:00", cc: "", template: "default-assignment", enabled: true, test_mode: true, test_recipient: "", daily_limit: 80 }
    ]),
    CATEGORIES: Object.freeze([
      ["CAT_VENUE", "現場佈置、燈光與動線", "場勘,會勘,平面圖,動線,進場,撤場,舞台,背板,燈光,音響,安全,無障礙"],
      ["CAT_DESIGN", "設計物與製作", "主視覺,完稿,校稿,尺寸,數量,發包,到貨,驗收,印刷,製作"],
      ["CAT_VIP", "貴賓接待", "貴賓,名單,邀請,回覆,稱謂,座位,接待,致詞"],
      ["CAT_SPEAKER", "講師追蹤", "講師,邀約,簡介,簡報,交通,住宿,飲食,酬勞,文件"],
      ["CAT_PRO", "司儀、口譯等專業人員", "司儀,主持人,口譯,合約,費用,稿件,彩排,設備"],
      ["CAT_CATERING", "餐飲安排", "餐飲,餐點,人數,餐別,菜單,素食,飲食,送達,出餐,備品"],
      ["CAT_VISIT", "參訪安排", "參訪,路線,車輛,名單,接待窗口,保險,安全,雨備"],
      ["CAT_VIDEO", "視訊會議及 AI 字幕", "視訊,線上,平台,帳號,測試,網路,備援,字幕,錄影"],
      ["CAT_GIFT", "伴手禮準備", "伴手禮,禮品,品項,數量,名單,包裝,到貨,發放"],
      ["CAT_BOOTH", "展攤設置", "展攤,攤商,圖面,用電,網路,進場,撤場,加購,驗收"],
      ["CAT_INSURANCE", "投保", "投保,保險,險種,保期,保單,保費,送件"],
      ["CAT_VENDOR", "廠商發包", "廠商,發包,規格,詢價,比價,核准,報價,合約,交期,驗收,付款"]
    ])
  });

  root.TrackerConstants = constants;
  if (typeof module !== "undefined" && module.exports) module.exports = constants;
})(typeof globalThis !== "undefined" ? globalThis : this);
