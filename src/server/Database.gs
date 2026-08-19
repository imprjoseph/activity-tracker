/** Google Sheets repository layer. All data access passes through this file. */

function trackerDb_() {
  var id = PropertiesService.getScriptProperties().getProperty("TRACKER_SPREADSHEET_ID");
  if (!id) throw new Error("系統尚未初始化。請由管理員在 Apps Script 編輯器執行 setupTracker()。");
  return SpreadsheetApp.openById(id);
}

function nowIso_() {
  return Utilities.formatDate(new Date(), TrackerConstants.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function todayKey_() {
  return Utilities.formatDate(new Date(), TrackerConstants.TIME_ZONE, "yyyy-MM-dd");
}

function newId_(prefix) {
  return String(prefix || "ID") + "_" + Utilities.getUuid().replace(/-/g, "").slice(0, 18).toUpperCase();
}

function safeCell_(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Utilities.formatDate(value, TrackerConstants.TIME_ZONE, "yyyy-MM-dd");
  if (typeof value === "object") return JSON.stringify(value);
  var stringValue = String(value);
  return /^[=+\-@]/.test(stringValue) ? "'" + stringValue : stringValue;
}

function normalizeSheetValue_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, TrackerConstants.TIME_ZONE, "yyyy-MM-dd");
  return value;
}

function ensureTrackerSheets_(spreadsheet) {
  var schemas = TrackerConstants.SHEETS;
  Object.keys(schemas).forEach(function (name) {
    var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
    var expected = schemas[name];
    var current = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), expected.length)).getValues()[0] : [];
    var currentHeaders = current.map(String).filter(Boolean);
    var isTrailingExtension = currentHeaders.length > 0 && currentHeaders.every(function (header, index) {
      return expected[index] === header;
    });
    var needsHeader = expected.some(function (header, index) { return String(current[index] || "") !== header; });
    if (needsHeader) {
      if (sheet.getLastRow() > 0 && current.some(Boolean) && !isTrailingExtension) throw new Error("工作表 " + name + " 欄位與目前版本不符，請先備份後執行遷移。");
      sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
    }
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, expected.length)
      .setBackground("#183B4E")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold");
    sheet.autoResizeColumns(1, expected.length);
  });
}

function table_(name) {
  var sheet = trackerDb_().getSheetByName(name);
  if (!sheet) throw new Error("找不到系統工作表：" + name);
  return sheet;
}

function headers_(sheet) {
  var lastColumn = sheet.getLastColumn();
  return lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String) : [];
}

function readTable_(name) {
  var sheet = table_(name);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0].map(String);
  return values.slice(1).filter(function (row) {
    return row.some(function (value) { return value !== ""; });
  }).map(function (row, index) {
    var result = { _row: index + 2 };
    headers.forEach(function (header, column) { result[header] = normalizeSheetValue_(row[column]); });
    return result;
  });
}

function findOne_(name, key, value) {
  return readTable_(name).find(function (row) { return String(row[key]) === String(value); }) || null;
}

function appendObject_(name, object) {
  var sheet = table_(name);
  var headers = headers_(sheet);
  sheet.appendRow(headers.map(function (header) { return safeCell_(object[header]); }));
  return object;
}

function appendObjects_(name, objects) {
  if (!objects.length) return;
  var sheet = table_(name);
  var headers = headers_(sheet);
  var values = objects.map(function (object) {
    return headers.map(function (header) { return safeCell_(object[header]); });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
}

function updateObject_(name, key, value, patch) {
  var sheet = table_(name);
  var headers = headers_(sheet);
  var keyIndex = headers.indexOf(key);
  if (keyIndex < 0) throw new Error("找不到鍵值欄位：" + key);
  var rows = readTable_(name);
  var target = rows.find(function (row) { return String(row[key]) === String(value); });
  if (!target) throw new Error("找不到要更新的資料：" + value);
  Object.keys(patch).forEach(function (field) { if (headers.indexOf(field) >= 0) target[field] = patch[field]; });
  sheet.getRange(target._row, 1, 1, headers.length).setValues([
    headers.map(function (header) { return safeCell_(target[header]); })
  ]);
  delete target._row;
  return target;
}

function upsertObject_(name, key, object) {
  var existing = findOne_(name, key, object[key]);
  return existing ? updateObject_(name, key, object[key], object) : appendObject_(name, object);
}

function withWriteLock_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function writeChange_(entity, entityId, action, before, after, batchId) {
  appendObject_("ChangeLog", {
    change_id: newId_("CHG"),
    entity: entity,
    entity_id: entityId,
    action: action,
    before_json: before ? JSON.stringify(before) : "",
    after_json: after ? JSON.stringify(after) : "",
    actor: currentUser_().email,
    time: nowIso_(),
    batch_id: batchId || ""
  });
}

function seedDefaults_() {
  if (!readTable_("Categories").length) {
    appendObjects_("Categories", TrackerConstants.CATEGORIES.map(function (category) {
      return { category_id: category[0], name: category[1], active: true, version: 1, keywords: category[2] };
    }));
  }
  if (!readTable_("ChecklistRules").length) {
    var rules = [];
    TrackerConstants.CATEGORIES.forEach(function (category) {
      var keywords = category[2].split(",");
      var chunks = [];
      for (var index = 0; index < keywords.length; index += 3) chunks.push(keywords.slice(index, index + 3));
      chunks.forEach(function (chunk, chunkIndex) {
        rules.push({
          rule_id: "RULE_" + category[0].replace("CAT_", "") + "_" + (chunkIndex + 1),
          category_id: category[0],
          concept: chunk.join("／"),
          keywords: chunk.join(","),
          level: chunkIndex === 0 ? "最低必要" : "建議",
          condition: "",
          active: true,
          version: 1
        });
      });
    });
    appendObjects_("ChecklistRules", rules);
  }
  if (!readTable_("ReminderRules").length) {
    appendObjects_("ReminderRules", TrackerConstants.DEFAULT_REMINDER_RULES);
  }
}
