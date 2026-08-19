/** Event and task application service. */

function visibleEvents_() {
  var user = currentUser_();
  var events = readTable_("Events");
  if (isManager_(user)) return events;
  var memberships = {};
  readTable_("EventMembers").forEach(function (member) {
    if (String(member.user_id) === String(user.user_id) && String(member.permission) !== "none") memberships[member.event_id] = true;
  });
  return events.filter(function (event) {
    return String(event.pm).toLowerCase() === String(user.email).toLowerCase() || memberships[event.event_id];
  });
}

function listEvents() {
  var tasks = readTable_("Tasks");
  return visibleEvents_().map(function (event) {
    var eventTasks = tasks.filter(function (task) { return task.event_id === event.event_id; });
    var item = cleanRow_(event);
    item.metrics = TrackerCore.metrics(eventTasks, todayKey_());
    return item;
  }).sort(function (a, b) { return String(a.event_date).localeCompare(String(b.event_date)); });
}

function saveEvent(input) {
  var user = requireRoles_([TrackerConstants.ROLES.ADMIN, TrackerConstants.ROLES.BOSS, TrackerConstants.ROLES.PM]);
  input = input || {};
  if (!String(input.name || "").trim()) throw new Error("活動名稱不可空白。");
  if (!TrackerCore.dateKey(input.event_date)) throw new Error("請輸入有效的活動日期。");
  if (TrackerConstants.EVENT_STATUSES.indexOf(input.status || "進行中") < 0) throw new Error("活動狀態無效。");
  var pmEmail = String(input.pm || user.email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(pmEmail)) throw new Error("專案經理 Email 格式錯誤。");
  return withWriteLock_(function () {
    var existing = input.event_id ? findOne_("Events", "event_id", input.event_id) : null;
    if (existing) requireEventAccess_(existing.event_id, true);
    if (existing && input.version && Number(input.version) !== Number(existing.version)) throw new Error("活動已由其他人更新，請重新整理後再儲存。");
    var now = nowIso_();
    var event = {
      event_id: existing ? existing.event_id : newId_("EVT"),
      name: String(input.name).trim(),
      event_date: TrackerCore.dateKey(input.event_date),
      pm: pmEmail,
      status: input.status || "進行中",
      completeness_status: existing ? existing.completeness_status : "未檢核",
      version: existing ? Number(existing.version || 0) + 1 : 1,
      created_at: existing ? existing.created_at : now,
      updated_at: now
    };
    if (existing) updateObject_("Events", "event_id", event.event_id, event);
    else appendObject_("Events", event);
    writeChange_("Event", event.event_id, existing ? "update" : "create", existing, event);
    return event;
  });
}

function getEventDetail(eventId) {
  requireEventAccess_(eventId, false);
  var event = findOne_("Events", "event_id", eventId);
  if (!event) throw new Error("找不到活動。");
  var tasks = readTable_("Tasks").filter(function (task) { return task.event_id === eventId && !task.removed_at; }).map(cleanRow_);
  var selections = readTable_("EventCategories").filter(function (row) { return row.event_id === eventId && truthy_(row.selected); });
  var selectedIds = selections.map(function (row) { return row.category_id; });
  var decisions = readTable_("ChecklistDecisions").filter(function (row) { return row.event_id === eventId; });
  var rules = readTable_("ChecklistRules");
  var checklist = TrackerCore.checklist(tasks, selectedIds, rules, decisions);
  return {
    event: cleanRow_(event),
    tasks: tasks,
    metrics: TrackerCore.metrics(tasks, todayKey_()),
    selectedCategoryIds: selectedIds,
    checklist: checklist,
    importBatches: readTable_("ImportBatches").filter(function (row) { return row.event_id === eventId; }).slice(-20).reverse().map(cleanRow_),
    members: (function () {
      var users = {};
      readTable_("Users").forEach(function (user) { users[user.user_id] = user; });
      return readTable_("EventMembers").filter(function (row) {
        return row.event_id === eventId && String(row.permission) !== "none";
      }).map(function (row) {
        var item = cleanRow_(row);
        item.email = users[row.user_id] ? users[row.user_id].email : "";
        item.name = users[row.user_id] ? users[row.user_id].name : "";
        return item;
      });
    })()
  };
}

function saveTask(input) {
  input = input || {};
  requireEventAccess_(input.event_id, true);
  if (!String(input.item || "").trim()) throw new Error("追蹤項目不可空白。");
  if (!TrackerCore.dateKey(input.due)) throw new Error("截止日格式錯誤。");
  var ownerEmail = String(input.owner_email || currentUser_().email).trim().toLowerCase();
  if (ownerEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ownerEmail)) throw new Error("負責人 Email 格式錯誤。");
  var status = input.status || "未開始";
  if (TrackerConstants.TASK_STATUSES.indexOf(status) < 0) throw new Error("任務狀態無效。");
  return withWriteLock_(function () {
    var existing = input.task_id ? findOne_("Tasks", "task_id", input.task_id) : null;
    if (existing && existing.event_id !== input.event_id) throw new Error("任務活動不符。");
    if (existing && input.version && Number(input.version) !== Number(existing.version)) throw new Error("任務已由其他人更新，請重新整理後再儲存。");
    var now = nowIso_();
    var done = status === "完成" || !!input.completed_at;
    var task = {
      task_id: existing ? existing.task_id : newId_("TSK"),
      event_id: input.event_id,
      category_id: String(input.category_id || ""),
      item: String(input.item).trim(),
      owner_email: ownerEmail,
      due: TrackerCore.dateKey(input.due),
      original_due: existing ? (existing.original_due || existing.due) : TrackerCore.dateKey(input.due),
      done: done,
      status: status,
      notes: String(input.notes || "").trim(),
      source: existing ? existing.source : (input.source || "manual"),
      external_key: existing ? existing.external_key : (input.external_key || newId_("MANUAL")),
      version: existing ? Number(existing.version || 0) + 1 : 1,
      updated_at: now,
      completed_at: done ? (TrackerCore.dateKey(input.completed_at) || todayKey_()) : "",
      removed_at: ""
    };
    if (existing) updateObject_("Tasks", "task_id", task.task_id, task);
    else appendObject_("Tasks", task);
    writeChange_("Task", task.task_id, existing ? "update" : "create", existing, task);
    return task;
  });
}

function listMyWork() {
  var user = currentUser_();
  var allowedEvents = {};
  visibleEvents_().forEach(function (event) { allowedEvents[event.event_id] = event.name; });
  return readTable_("Tasks").filter(function (task) {
    return allowedEvents[task.event_id] && !task.removed_at && String(task.owner_email).toLowerCase() === String(user.email).toLowerCase();
  }).map(function (task) {
    var item = cleanRow_(task);
    item.event_name = allowedEvents[task.event_id];
    item.is_overdue = TrackerCore.dueForReminder(task, todayKey_());
    return item;
  }).sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); });
}
