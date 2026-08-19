/** Category selection and completeness decisions. */

function listCategories_() {
  return readTable_("Categories").filter(function (row) { return truthy_(row.active); }).map(cleanRow_);
}

function saveEventCategories(eventId, categoryIds) {
  var user = requireEventAccess_(eventId, true);
  categoryIds = Array.isArray(categoryIds) ? categoryIds : [];
  var valid = {};
  listCategories_().forEach(function (category) { valid[category.category_id] = true; });
  categoryIds.forEach(function (id) { if (!valid[id]) throw new Error("追蹤大項無效：" + id); });
  return withWriteLock_(function () {
    var existing = readTable_("EventCategories").filter(function (row) { return row.event_id === eventId; });
    var sheet = table_("EventCategories");
    var headers = headers_(sheet);
    existing.forEach(function (row) {
      var patch = {
        event_id: eventId,
        category_id: row.category_id,
        selected: categoryIds.indexOf(row.category_id) >= 0,
        confirmed_at: nowIso_(),
        confirmed_by: user.email
      };
      sheet.getRange(row._row, 1, 1, headers.length).setValues([headers.map(function (header) { return safeCell_(patch[header]); })]);
    });
    var existingIds = existing.map(function (row) { return row.category_id; });
    categoryIds.filter(function (categoryId) { return existingIds.indexOf(categoryId) < 0; }).forEach(function (categoryId) {
      appendObject_("EventCategories", {
        event_id: eventId,
        category_id: categoryId,
        selected: true,
        confirmed_at: nowIso_(),
        confirmed_by: user.email
      });
    });
    updateObject_("Events", "event_id", eventId, { completeness_status: "待確認", updated_at: nowIso_() });
    writeChange_("EventCategories", eventId, "replace", existing, categoryIds);
    return getEventDetail(eventId);
  });
}

function saveChecklistDecision(input) {
  input = input || {};
  var user = requireEventAccess_(input.eventId, true);
  if (["accepted", "not_applicable", "covered"].indexOf(input.status) < 0) throw new Error("檢核處理狀態無效。");
  if (input.status === "not_applicable" && !String(input.reason || "").trim()) throw new Error("標示不適用時必須填寫原因。");
  return withWriteLock_(function () {
    var decision = {
      decision_id: newId_("DEC"),
      event_id: input.eventId,
      category_id: input.categoryId,
      concept: String(input.concept || ""),
      status: input.status,
      reason: String(input.reason || "").trim(),
      actor: user.email,
      time: nowIso_()
    };
    appendObject_("ChecklistDecisions", decision);
    writeChange_("ChecklistDecision", decision.decision_id, "create", null, decision);
    return getEventDetail(input.eventId);
  });
}

function confirmChecklist(eventId) {
  requireEventAccess_(eventId, true);
  return withWriteLock_(function () {
    var detail = getEventDetail(eventId);
    var missing = detail.checklist.filter(function (item) { return item.status === "missing"; });
    if (!detail.selectedCategoryIds.length) throw new Error("請先勾選本案適用的大項。");
    if (missing.length) throw new Error("仍有 " + missing.length + " 項待處理，請補成任務或標示不適用後再確認。");
    var existing = findOne_("Events", "event_id", eventId);
    var updated = updateObject_("Events", "event_id", eventId, { completeness_status: "已確認", updated_at: nowIso_() });
    writeChange_("Event", eventId, "confirm-checklist", existing, updated);
    return getEventDetail(eventId);
  });
}

function addSuggestedTask(input) {
  input = input || {};
  var event = findOne_("Events", "event_id", input.eventId);
  if (!event) throw new Error("找不到活動。");
  var due = new Date(event.event_date);
  due.setDate(due.getDate() - 7);
  return saveTask({
    event_id: input.eventId,
    category_id: input.categoryId,
    item: input.concept,
    owner_email: event.pm,
    due: TrackerCore.dateKey(due),
    status: "未開始",
    notes: "由完整性檢核建議新增",
    source: "checklist"
  });
}
