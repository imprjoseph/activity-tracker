/** Time-driven email reminders with grouping, quotas and idempotency. */

function installReminderTriggers_() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "runScheduledReminders") ScriptApp.deleteTrigger(trigger);
  });
  var hours = {};
  readTable_("ReminderRules").filter(function (rule) { return truthy_(rule.enabled); }).forEach(function (rule) {
    String(rule.times || "").split(",").forEach(function (time) {
      var hour = Number(String(time).trim().split(":")[0]);
      if (!isNaN(hour) && hour >= 0 && hour <= 23) hours[hour] = true;
    });
  });
  Object.keys(hours).forEach(function (hour) {
    ScriptApp.newTrigger("runScheduledReminders").timeBased().atHour(Number(hour)).everyDays(1).inTimezone(TrackerConstants.TIME_ZONE).create();
  });
}

function runScheduledReminders() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { skipped: true, reason: "locked" };
  try {
    var slot = Utilities.formatDate(new Date(), TrackerConstants.TIME_ZONE, "HH") + ":00";
    var taskRule = findOne_("ReminderRules", "rule_id", "RR_TASK_DAILY");
    var assignmentRule = findOne_("ReminderRules", "rule_id", "RR_ASSIGNMENT");
    var result = { slot: slot, tasks: 0, assignments: 0, failures: 0 };
    if (taskRule && truthy_(taskRule.enabled) && ruleHasSlot_(taskRule, slot)) sendTaskReminders_(taskRule, slot, result);
    if (assignmentRule && truthy_(assignmentRule.enabled) && ruleHasSlot_(assignmentRule, slot)) sendAssignmentReminders_(assignmentRule, slot, result);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function ruleHasSlot_(rule, slot) {
  return String(rule.times || "").split(",").map(function (time) { return String(time).trim(); }).indexOf(slot) >= 0;
}

function sentTodayCount_() {
  var today = todayKey_();
  return readTable_("ReminderLog").filter(function (log) {
    return String(log.sent_at).slice(0, 10) === today && log.result === "sent";
  }).length;
}

function sendTaskReminders_(rule, slot, result) {
  var events = {};
  readTable_("Events").forEach(function (event) { events[event.event_id] = event; });
  var groups = {};
  readTable_("Tasks").filter(function (task) {
    return !task.removed_at && TrackerCore.dueForReminder(task, todayKey_()) && task.owner_email;
  }).forEach(function (task) {
    var key = [task.owner_email, task.event_id].join("|");
    if (!groups[key]) groups[key] = { recipient: task.owner_email, event: events[task.event_id], items: [] };
    groups[key].items.push(task);
  });
  Object.keys(groups).forEach(function (key) {
    if (sendReminderGroup_("tasks", groups[key], rule, slot)) result.tasks += 1;
    else result.failures += 1;
  });
}

function sendAssignmentReminders_(rule, slot, result) {
  var groups = {};
  readTable_("Assignments").filter(function (assignment) {
    return TrackerCore.dueForReminder({ due: assignment.due, status: assignment.status, completed_at: assignment.completed_at }, todayKey_()) && ruleHasSlot_({ times: assignment.reminder_times || rule.times }, slot);
  }).forEach(function (assignment) {
    String(assignment.owner_emails).split(",").map(function (email) { return email.trim(); }).filter(Boolean).forEach(function (email) {
      var key = email + "|" + (assignment.event_id || "general");
      if (!groups[key]) groups[key] = { recipient: email, event: assignment.event_id ? findOne_("Events", "event_id", assignment.event_id) : null, items: [] };
      groups[key].items.push({
        task_id: assignment.assignment_id,
        item: assignment.title,
        due: assignment.due,
        status: assignment.status,
        notes: assignment.notes
      });
    });
  });
  Object.keys(groups).forEach(function (key) {
    if (sendReminderGroup_("assignments", groups[key], rule, slot)) result.assignments += 1;
    else result.failures += 1;
  });
}

function sendReminderGroup_(kind, group, rule, slot) {
  var entityIds = group.items.map(function (item) { return item.task_id; }).sort();
  var eventName = group.event ? group.event.name : "主管交辦";
  var dedupeKey = [kind, group.recipient, group.event ? group.event.event_id : "general", todayKey_(), slot].join(":");
  var priorLogs = readTable_("ReminderLog").filter(function (log) { return String(log.dedupe_key) === dedupeKey; });
  if (priorLogs.some(function (log) { return String(log.result) === "sent"; })) return true;
  var failedAttempts = priorLogs.filter(function (log) { return String(log.result) === "failed"; }).length;
  if (failedAttempts >= 3) return false;
  var batchId = newId_("MAIL");
  var destination = truthy_(rule.test_mode) ? String(rule.test_recipient || "").trim() : group.recipient;
  if (!destination) return logReminder_(dedupeKey, kind, entityIds, group.recipient, rule.cc, "failed", "測試收件人未設定", batchId);
  if (sentTodayCount_() >= Number(rule.daily_limit || 80)) return logReminder_(dedupeKey, kind, entityIds, destination, rule.cc, "failed", "已達每日寄信上限", batchId);
  var firstDue = group.items.map(function (item) { return item.due; }).sort()[0];
  var subject = (truthy_(rule.test_mode) ? "[TEST] " : "") + "【逾期提醒】" + eventName + "｜" + group.items.length + " 項待完成｜" + todayKey_().replace(/-/g, "/");
  var html = buildReminderHtml_(kind, group, batchId, firstDue, truthy_(rule.test_mode) ? group.recipient : "");
  while (failedAttempts < 3) {
    failedAttempts += 1;
    try {
    var options = { to: destination, subject: subject, htmlBody: html, name: "會議活動追蹤系統" };
    if (rule.cc && !truthy_(rule.test_mode)) options.cc = String(rule.cc);
    MailApp.sendEmail(options);
    logReminder_(dedupeKey, kind, entityIds, destination, options.cc || "", "sent", "", batchId);
    return true;
    } catch (error) {
      logReminder_(dedupeKey, kind, entityIds, destination, rule.cc, "failed", "第 " + failedAttempts + " 次寄送失敗：" + error.message, batchId);
    }
  }
  return false;
}

function buildReminderHtml_(kind, group, batchId, firstDue, originalRecipient) {
  var today = TrackerCore.parseDate(todayKey_());
  var rows = group.items.map(function (item) {
    var due = TrackerCore.parseDate(item.due);
    var days = due && today ? Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000)) : 0;
    return "<tr><td style='padding:10px;border-bottom:1px solid #e5e7eb'>" + escapeHtml_(item.item) + "</td><td style='padding:10px;border-bottom:1px solid #e5e7eb'>" + escapeHtml_(item.due) + "</td><td style='padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#b42318;font-weight:700'>" + days + " 天</td><td style='padding:10px;border-bottom:1px solid #e5e7eb'>" + escapeHtml_(item.status) + "</td><td style='padding:10px;border-bottom:1px solid #e5e7eb'>" + escapeHtml_(item.notes || "") + "</td></tr>";
  }).join("");
  return "<div style='font-family:Arial,sans-serif;color:#183b4e;max-width:760px;margin:auto'>" +
    "<div style='background:#183b4e;color:#fff;padding:22px 26px;border-radius:14px 14px 0 0'><div style='font-size:13px;opacity:.75'>CONFERENCE OPERATIONS</div><h2 style='margin:6px 0 0'>待完成事項提醒</h2></div>" +
    "<div style='padding:24px;border:1px solid #dbe5e8;border-top:0'><p>活動：<strong>" + escapeHtml_(group.event ? group.event.name : "主管直接交辦") + "</strong></p>" +
    (originalRecipient ? "<p style='background:#fff4d8;padding:10px'>測試模式：原收件人為 " + escapeHtml_(originalRecipient) + "</p>" : "") +
    "<p>共 " + group.items.length + " 項逾期／到期事項，最早截止日為 " + escapeHtml_(firstDue) + "。</p>" +
    "<table style='border-collapse:collapse;width:100%;font-size:14px'><thead><tr style='background:#eef5f5'><th style='padding:10px;text-align:left'>追蹤項目</th><th>截止日</th><th>逾期</th><th>狀態</th><th>備註</th></tr></thead><tbody>" + rows + "</tbody></table>" +
    "<p style='margin-top:20px'>請開啟系統更新狀態；若期限需調整，請留下原因並由專案經理確認。</p>" +
    "<p style='font-size:12px;color:#667085'>寄送批次 ID：" + escapeHtml_(batchId) + "｜類型：" + escapeHtml_(kind) + "</p></div></div>";
}

function logReminder_(dedupeKey, kind, entityIds, recipient, cc, result, error, batchId) {
  appendObject_("ReminderLog", {
    log_id: newId_("LOG"), dedupe_key: dedupeKey, kind: kind,
    entity_ids: entityIds.join(","), recipient: recipient, cc: cc || "",
    result: result, sent_at: nowIso_(), error: error || "", batch_id: batchId
  });
  return result === "sent";
}

function escapeHtml_(value) {
  return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function previewReminderRun() {
  requireRoles_([TrackerConstants.ROLES.ADMIN, TrackerConstants.ROLES.BOSS]);
  var dueTasks = readTable_("Tasks").filter(function (task) { return !task.removed_at && TrackerCore.dueForReminder(task, todayKey_()); });
  var dueAssignments = readTable_("Assignments").filter(function (assignment) {
    return TrackerCore.dueForReminder({ due: assignment.due, status: assignment.status, completed_at: assignment.completed_at }, todayKey_());
  });
  return { dueTasks: dueTasks.length, dueAssignments: dueAssignments.length, today: todayKey_() };
}
