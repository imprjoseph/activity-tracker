/** Manager assignments with configurable three-slot reminders. */

function listAssignments() {
  var user = currentUser_();
  return readTable_("Assignments").filter(function (assignment) {
    return isManager_(user) || String(assignment.created_by).toLowerCase() === user.email || String(assignment.owner_emails).toLowerCase().split(/[,;\s]+/).indexOf(user.email) >= 0;
  }).map(function (assignment) {
    var item = cleanRow_(assignment);
    item.is_overdue = TrackerCore.dueForReminder({ due: item.due, status: item.status, completed_at: item.completed_at }, todayKey_());
    return item;
  }).sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); });
}

function saveAssignment(input) {
  var user = requireRoles_([TrackerConstants.ROLES.ADMIN, TrackerConstants.ROLES.BOSS, TrackerConstants.ROLES.PM]);
  input = input || {};
  if (!String(input.title || "").trim()) throw new Error("交辦事項不可空白。");
  if (!TrackerCore.dateKey(input.due)) throw new Error("交辦期限格式錯誤。");
  var owners = String(input.owner_emails || "").toLowerCase().split(/[,;\s]+/).filter(Boolean);
  if (!owners.length || owners.some(function (email) { return !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); })) throw new Error("請輸入有效的受指派人 Email。");
  if (input.event_id) requireEventAccess_(input.event_id, true);
  var reminderTimes = String(input.reminder_times || "09:00,13:00,18:00").split(",").map(function (time) { return time.trim(); }).filter(Boolean);
  if (!reminderTimes.length || reminderTimes.some(function (time) { return !/^([01]\d|2[0-3]):00$/.test(time); })) throw new Error("提醒時段格式須為整點 HH:00，多個時段以逗號分隔。");
  return withWriteLock_(function () {
    var existing = input.assignment_id ? findOne_("Assignments", "assignment_id", input.assignment_id) : null;
    if (existing && !isManager_(user) && String(existing.created_by).toLowerCase() !== user.email) throw new Error("你不能修改其他人建立的交辦事項。");
    var status = input.status || "未開始";
    var now = nowIso_();
    var assignment = {
      assignment_id: existing ? existing.assignment_id : newId_("ASN"),
      event_id: String(input.event_id || ""),
      title: String(input.title).trim(),
      owner_emails: owners.join(","),
      due: TrackerCore.dateKey(input.due),
      priority: input.priority || "一般",
      status: status,
      notes: String(input.notes || "").trim(),
      reminder_times: reminderTimes.join(","),
      created_by: existing ? existing.created_by : user.email,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
      completed_at: status === "完成" ? (TrackerCore.dateKey(input.completed_at) || todayKey_()) : ""
    };
    if (existing) updateObject_("Assignments", "assignment_id", assignment.assignment_id, assignment);
    else appendObject_("Assignments", assignment);
    writeChange_("Assignment", assignment.assignment_id, existing ? "update" : "create", existing, assignment);
    return assignment;
  });
}

function completeAssignment(assignmentId) {
  var assignment = findOne_("Assignments", "assignment_id", assignmentId);
  if (!assignment) throw new Error("找不到交辦事項。");
  var user = currentUser_();
  var owners = String(assignment.owner_emails).toLowerCase().split(",");
  if (!isManager_(user) && owners.indexOf(user.email) < 0) throw new Error("你不能完成此交辦事項。");
  return withWriteLock_(function () {
    var updated = updateObject_("Assignments", "assignment_id", assignmentId, { status: "完成", completed_at: todayKey_(), updated_at: nowIso_() });
    writeChange_("Assignment", assignmentId, "complete", assignment, updated);
    return updated;
  });
}
