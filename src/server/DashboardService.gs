/** Dashboard and reporting formulas defined in the specification. */

function getDashboard() {
  var events = visibleEvents_();
  var tasks = readTable_("Tasks");
  var eventIds = {};
  events.forEach(function (event) { eventIds[event.event_id] = true; });
  var visibleTasks = tasks.filter(function (task) { return eventIds[task.event_id] && !task.removed_at; });
  var overall = TrackerCore.metrics(visibleTasks, todayKey_());
  var byEvent = events.map(function (event) {
    var eventTasks = visibleTasks.filter(function (task) { return task.event_id === event.event_id; });
    var item = cleanRow_(event);
    item.metrics = TrackerCore.metrics(eventTasks, todayKey_());
    var eventDate = TrackerCore.parseDate(event.event_date);
    var today = TrackerCore.parseDate(todayKey_());
    item.days_to_event = eventDate && today ? Math.ceil((eventDate.getTime() - today.getTime()) / 86400000) : null;
    return item;
  });
  var byOwnerMap = {};
  visibleTasks.forEach(function (task) {
    var owner = String(task.owner_email || "未指派").toLowerCase();
    if (!byOwnerMap[owner]) byOwnerMap[owner] = [];
    byOwnerMap[owner].push(task);
  });
  var byOwner = Object.keys(byOwnerMap).map(function (owner) {
    return { owner: owner, metrics: TrackerCore.metrics(byOwnerMap[owner], todayKey_()) };
  }).sort(function (a, b) { return b.metrics.overdue - a.metrics.overdue; });
  return {
    generatedAt: nowIso_(),
    eventCount: events.filter(function (event) { return ["已完成", "已封存"].indexOf(event.status) < 0; }).length,
    overall: overall,
    completenessAlerts: events.filter(function (event) { return event.completeness_status !== "已確認"; }).length,
    byEvent: byEvent,
    byOwner: byOwner
  };
}

function getAuditLog(limit) {
  requireRoles_([TrackerConstants.ROLES.ADMIN, TrackerConstants.ROLES.BOSS, TrackerConstants.ROLES.VIEWER]);
  return readTable_("ChangeLog").slice(-Math.min(Number(limit || 100), 500)).reverse().map(cleanRow_);
}

function getReminderLog(limit) {
  requireRoles_([TrackerConstants.ROLES.ADMIN, TrackerConstants.ROLES.BOSS]);
  return readTable_("ReminderLog").slice(-Math.min(Number(limit || 100), 500)).reverse().map(cleanRow_);
}
