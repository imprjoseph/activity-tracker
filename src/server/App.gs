/** Web app entrypoints and initial setup. */

function doGet() {
  var template = HtmlService.createTemplateFromFile("src/client/Index");
  return template.evaluate()
    .setTitle("會議活動追蹤系統")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** First-run setup. Execute once from the Apps Script editor. */
function setupTracker() {
  var props = PropertiesService.getScriptProperties();
  var existingId = props.getProperty("TRACKER_SPREADSHEET_ID");
  if (existingId) requireRoles_([TrackerConstants.ROLES.ADMIN]);

  var db = existingId ? SpreadsheetApp.openById(existingId) : SpreadsheetApp.create("會議活動追蹤系統｜主資料庫");
  props.setProperty("TRACKER_SPREADSHEET_ID", db.getId());
  ensureTrackerSheets_(db);
  seedDefaults_();

  var email = activeEmail_();
  if (!email) throw new Error("無法取得目前 Google 帳號，請以公司帳號重新執行。");
  var existingAdmin = readTable_("Users").find(function (row) { return String(row.email).toLowerCase() === email; });
  if (!existingAdmin) {
    appendObject_("Users", {
      user_id: newId_("USR"),
      email: email,
      name: email.split("@")[0],
      role: TrackerConstants.ROLES.ADMIN,
      active: true,
      created_at: nowIso_(),
      updated_at: nowIso_()
    });
  }
  installReminderTriggers_();
  installBackupTrigger_();
  return { spreadsheetId: db.getId(), spreadsheetUrl: db.getUrl(), message: "初始化完成" };
}

function bootstrapApp() {
  var user = currentUser_();
  return {
    user: user,
    roleLabels: TrackerConstants.ROLE_LABELS,
    eventStatuses: TrackerConstants.EVENT_STATUSES,
    taskStatuses: TrackerConstants.TASK_STATUSES,
    importFields: TrackerConstants.IMPORT_FIELDS,
    events: listEvents(),
    categories: listCategories_(),
    dashboard: getDashboard(),
    reminderRules: isManager_(user) ? readTable_("ReminderRules").map(cleanRow_) : [],
    users: [TrackerConstants.ROLES.ADMIN, TrackerConstants.ROLES.BOSS, TrackerConstants.ROLES.PM].indexOf(user.role) >= 0 ? listUsers() : [],
    systemStatus: isManager_(user) ? { lastBackupAt: PropertiesService.getScriptProperties().getProperty("LAST_BACKUP_AT") || "尚未備份" } : {}
  };
}

function cleanRow_(row) {
  var result = {};
  Object.keys(row).forEach(function (key) { if (key !== "_row") result[key] = row[key]; });
  return result;
}

function getSystemInfo() {
  requireRoles_([TrackerConstants.ROLES.ADMIN]);
  var props = PropertiesService.getScriptProperties();
  var db = trackerDb_();
  return {
    spreadsheetId: db.getId(),
    spreadsheetUrl: db.getUrl(),
    uploadFolderId: props.getProperty("TRACKER_UPLOAD_FOLDER_ID") || "",
    backupFolderId: props.getProperty("TRACKER_BACKUP_FOLDER_ID") || "",
    lastBackupAt: props.getProperty("LAST_BACKUP_AT") || "",
    triggerCount: ScriptApp.getProjectTriggers().length,
    timeZone: TrackerConstants.TIME_ZONE
  };
}

function saveReminderRule(input) {
  requireRoles_([TrackerConstants.ROLES.ADMIN]);
  input = input || {};
  var rule = findOne_("ReminderRules", "rule_id", input.rule_id);
  if (!rule) throw new Error("找不到提醒規則。");
  var times = String(input.times || rule.times).split(",").map(function (time) { return time.trim(); }).filter(Boolean);
  if (!times.length || times.some(function (time) { return !/^([01]\d|2[0-3]):00$/.test(time); })) throw new Error("寄送時段格式須為整點 HH:00，多個時段以逗號分隔。");
  var cc = String(input.cc || "").trim().toLowerCase();
  var testRecipient = String(input.test_recipient || "").trim().toLowerCase();
  if (cc && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cc)) throw new Error("主管副知 Email 格式錯誤。");
  if (testRecipient && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testRecipient)) throw new Error("測試收件人 Email 格式錯誤。");
  var patch = {
    times: times.join(","),
    cc: cc,
    template: String(input.template || rule.template),
    enabled: input.enabled !== false,
    test_mode: input.test_mode !== false,
    test_recipient: testRecipient,
    daily_limit: Math.max(1, Math.min(500, Number(input.daily_limit || rule.daily_limit || 80))),
    updated_at: nowIso_()
  };
  if (patch.test_mode && !patch.test_recipient) throw new Error("測試模式必須設定測試收件人。");
  return withWriteLock_(function () {
    var updated = updateObject_("ReminderRules", "rule_id", input.rule_id, patch);
    writeChange_("ReminderRule", input.rule_id, "update", rule, updated);
    installReminderTriggers_();
    return updated;
  });
}
