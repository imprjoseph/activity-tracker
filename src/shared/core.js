(function (root) {
  "use strict";

  var C = root.TrackerConstants;
  if (!C && typeof require === "function") C = require("./constants.js");

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeHeader(value) {
    return text(value).toLowerCase().replace(/[\s_\-（）()]/g, "");
  }

  function detectMapping(headers) {
    var normalized = headers.map(normalizeHeader);
    var result = {};
    C.IMPORT_FIELDS.forEach(function (field) {
      var aliases = field.aliases.map(normalizeHeader);
      var index = normalized.findIndex(function (header) { return aliases.indexOf(header) >= 0; });
      result[field.key] = index >= 0 ? headers[index] : "";
    });
    return result;
  }

  function parseDate(value) {
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    var raw = text(value);
    if (!raw) return null;
    var match = raw.match(/^(\d{4})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})日?$/);
    if (!match) return null;
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
    return date;
  }

  function dateKey(value) {
    var date = parseDate(value);
    if (!date) return "";
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function isComplete(task) {
    return !!dateKey(task.completedAt || task.completed_at || task.done) || ["完成", "取消", "不適用"].indexOf(text(task.status)) >= 0;
  }

  function taskKey(task) {
    var external = text(task.externalKey || task.external_key);
    if (external) return "external:" + external.toLowerCase();
    return [text(task.item).toLowerCase(), text(task.ownerEmail || task.owner_email).toLowerCase(), dateKey(task.due)].join("|");
  }

  function mapRows(rows, mapping) {
    var errors = [];
    var items = [];
    rows.forEach(function (row, rowIndex) {
      var item = {};
      Object.keys(mapping || {}).forEach(function (key) {
        if (mapping[key]) item[key] = row[mapping[key]];
      });
      item.item = text(item.item);
      item.ownerEmail = text(item.ownerEmail).toLowerCase();
      item.status = text(item.status) || (item.completedAt ? "完成" : "未開始");
      item.notes = text(item.notes);
      item.category = text(item.category);
      item.externalKey = text(item.externalKey) || "ROW-" + String(rowIndex + 2);
      item.due = dateKey(item.due);
      item.completedAt = dateKey(item.completedAt);
      var rowErrors = [];
      if (!item.item) rowErrors.push("追蹤項目不可空白");
      if (!item.due) rowErrors.push("預計完成日期格式錯誤");
      if (item.ownerEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(item.ownerEmail)) rowErrors.push("負責人 Email 格式錯誤");
      if (item.status && C.TASK_STATUSES.indexOf(item.status) < 0) rowErrors.push("不支援的狀態：" + item.status);
      if (rowErrors.length) errors.push({ row: rowIndex + 2, messages: rowErrors, source: row });
      else items.push(item);
    });
    return { items: items, errors: errors };
  }

  function changedFields(existing, incoming, mode) {
    var fieldMap = {
      item: "item",
      due: "due",
      completedAt: "completed_at",
      ownerEmail: "owner_email",
      status: "status",
      notes: "notes",
      externalKey: "external_key"
    };
    var allowed = mode === C.IMPORT_MODES.PROGRESS
      ? ["due", "completedAt", "ownerEmail", "status", "notes"]
      : Object.keys(fieldMap);
    return allowed.filter(function (field) {
      var oldValue = existing[fieldMap[field]];
      var newValue = incoming[field];
      if (field === "due" || field === "completedAt") oldValue = dateKey(oldValue);
      return text(oldValue) !== text(newValue);
    });
  }

  function diffImport(existingTasks, incomingItems, mode) {
    var existingMap = {};
    existingTasks.filter(function (task) { return !task.removed_at; }).forEach(function (task) { existingMap[taskKey(task)] = task; });
    var incomingMap = {};
    var added = [];
    var updated = [];
    var unchanged = [];
    var duplicates = [];
    incomingItems.forEach(function (item) {
      var key = taskKey(item);
      if (incomingMap[key]) {
        duplicates.push(item);
        return;
      }
      incomingMap[key] = item;
      var existing = existingMap[key];
      if (!existing) {
        added.push(item);
        return;
      }
      var changes = changedFields(existing, item, mode);
      if (changes.length) updated.push({ existing: existing, incoming: item, changes: changes });
      else unchanged.push({ existing: existing, incoming: item });
    });
    var removed = [];
    if (mode === C.IMPORT_MODES.TRACKER) {
      Object.keys(existingMap).forEach(function (key) {
        if (!incomingMap[key]) removed.push(existingMap[key]);
      });
    }
    var activeCount = Object.keys(existingMap).length;
    return {
      added: added,
      updated: updated,
      unchanged: unchanged,
      duplicates: duplicates,
      removed: removed,
      removalRatio: activeCount ? removed.length / activeCount : 0,
      requiresDestructiveConfirm: activeCount > 0 && removed.length / activeCount > 0.2
    };
  }

  function normalizeWords(value) {
    return text(value).toLowerCase().replace(/[\s、，,。；;／/\-_]/g, "");
  }

  function checklist(tasks, selectedCategories, rules, decisions) {
    var haystack = normalizeWords(tasks.filter(function (task) { return !task.removed_at && text(task.status) !== "取消"; }).map(function (task) { return [task.item, task.notes].join(" "); }).join(" "));
    var decisionMap = {};
    (decisions || []).forEach(function (decision) {
      decisionMap[[decision.category_id, decision.concept].join("|")] = decision;
    });
    var selected = {};
    selectedCategories.forEach(function (id) { selected[id] = true; });
    return rules.filter(function (rule) { return selected[rule.category_id] && String(rule.active) !== "false"; }).map(function (rule) {
      var words = text(rule.keywords).split(/[,，、|]/).map(text).filter(Boolean);
      var matched = words.some(function (word) { return haystack.indexOf(normalizeWords(word)) >= 0; });
      var decision = decisionMap[[rule.category_id, rule.concept].join("|")];
      return {
        categoryId: rule.category_id,
        concept: rule.concept,
        level: rule.level || "建議",
        matched: matched,
        status: matched ? "covered" : (decision ? decision.status : "missing"),
        reason: decision ? decision.reason : "",
        keywords: words
      };
    });
  }

  function metrics(tasks, today) {
    today = parseDate(today) || new Date();
    today.setHours(0, 0, 0, 0);
    var active = tasks.filter(function (task) { return !task.removed_at && ["取消", "不適用"].indexOf(text(task.status)) < 0; });
    var completed = active.filter(isComplete);
    var onTime = completed.filter(function (task) {
      var due = parseDate(task.original_due || task.due);
      var done = parseDate(task.completed_at || task.completedAt || task.done);
      return due && done && done.getTime() <= due.getTime();
    });
    var overdue = active.filter(function (task) {
      var due = parseDate(task.due);
      return due && due.getTime() < today.getTime() && !isComplete(task) && text(task.status) !== "暫停";
    });
    return {
      total: active.length,
      completed: completed.length,
      overdue: overdue.length,
      completionRate: active.length ? Math.round(completed.length / active.length * 1000) / 10 : 0,
      onTimeRate: completed.length ? Math.round(onTime.length / completed.length * 1000) / 10 : 0
    };
  }

  function partitionConflicts(diff, protectedTaskIds) {
    var protectedMap = {};
    (protectedTaskIds || []).forEach(function (id) { protectedMap[String(id)] = true; });
    var conflicts = [];
    var updated = (diff.updated || []).filter(function (change) {
      if (!protectedMap[String(change.existing.task_id)]) return true;
      conflicts.push(change);
      return false;
    });
    var removed = (diff.removed || []).filter(function (task) {
      if (!protectedMap[String(task.task_id)]) return true;
      conflicts.push({ existing: task, incoming: null, changes: ["removed"] });
      return false;
    });
    var result = {};
    Object.keys(diff).forEach(function (key) { result[key] = diff[key]; });
    result.updated = updated;
    result.removed = removed;
    result.conflicts = conflicts;
    var activeCount = updated.length + removed.length + conflicts.length + (diff.unchanged || []).length;
    result.removalRatio = activeCount ? removed.length / activeCount : 0;
    result.requiresDestructiveConfirm = activeCount > 0 && result.removalRatio > 0.2;
    return result;
  }

  function dueForReminder(item, today) {
    var due = parseDate(item.due);
    today = parseDate(today) || new Date();
    today.setHours(0, 0, 0, 0);
    return !!due && due.getTime() <= today.getTime() && !isComplete(item) && text(item.status) !== "暫停";
  }

  var api = {
    text: text,
    normalizeHeader: normalizeHeader,
    detectMapping: detectMapping,
    parseDate: parseDate,
    dateKey: dateKey,
    isComplete: isComplete,
    taskKey: taskKey,
    mapRows: mapRows,
    changedFields: changedFields,
    diffImport: diffImport,
    checklist: checklist,
    metrics: metrics,
    dueForReminder: dueForReminder,
    partitionConflicts: partitionConflicts
  };

  root.TrackerCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
