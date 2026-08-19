/** CSV/XLS/XLSX upload, mapping, preview and confirmed import. */

function uploadFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("TRACKER_UPLOAD_FOLDER_ID");
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (error) { props.deleteProperty("TRACKER_UPLOAD_FOLDER_ID"); }
  }
  var folder = DriveApp.createFolder("會議活動追蹤系統｜匯入原檔與備份");
  props.setProperty("TRACKER_UPLOAD_FOLDER_ID", folder.getId());
  return folder;
}

function inspectImportFile(input) {
  input = input || {};
  requireEventAccess_(input.eventId, true);
  var fileName = String(input.fileName || "").trim();
  var extension = fileName.toLowerCase().split(".").pop();
  if (["csv", "xlsx", "xls"].indexOf(extension) < 0) throw new Error("只支援 .csv、.xlsx 或 .xls 檔案。");
  var encoded = String(input.base64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!encoded) throw new Error("沒有收到檔案內容。");
  var bytes = Utilities.base64Decode(encoded);
  if (bytes.length > 10 * 1024 * 1024) throw new Error("MVP 單檔上限為 10 MB，請拆分後再上傳。");

  var mime = input.mimeType || (extension === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  var blob = Utilities.newBlob(bytes, mime, fileName);
  var original = uploadFolder_().createFile(blob);
  var descriptor = {
    eventId: input.eventId,
    originalFileId: original.getId(),
    originalUrl: original.getUrl(),
    fileName: fileName,
    extension: extension,
    convertedSpreadsheetId: "",
    createdBy: currentUser_().email
  };

  if (extension !== "csv") {
    try {
      var converted = Drive.Files.create({
        name: "IMPORT_" + new Date().getTime() + "_" + fileName,
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [uploadFolder_().getId()]
      }, blob, { fields: "id,name" });
      descriptor.convertedSpreadsheetId = converted.id;
    } catch (error) {
      original.setDescription("轉換失敗：" + error.message);
      throw new Error("Excel 轉換失敗。請在 Apps Script 專案啟用進階 Google Drive API 後重試。詳細訊息：" + error.message);
    }
  }

  var token = Utilities.getUuid();
  CacheService.getScriptCache().put("import:" + token, JSON.stringify(descriptor), 1800);
  var tabs = listUploadedTabs_(descriptor);
  return {
    token: token,
    originalUrl: original.getUrl(),
    fileName: fileName,
    tabs: tabs
  };
}

function listUploadedTabs_(descriptor) {
  if (descriptor.extension === "csv") {
    var table = readUploadedTable_(descriptor, "CSV");
    return [{ name: "CSV", headers: table.headers, sample: table.rows.slice(0, 5), detectedMapping: TrackerCore.detectMapping(table.headers) }];
  }
  var spreadsheet = SpreadsheetApp.openById(descriptor.convertedSpreadsheetId);
  return spreadsheet.getSheets().map(function (sheet) {
    var table = readSheetTable_(sheet);
    return { name: sheet.getName(), headers: table.headers, sample: table.rows.slice(0, 5), detectedMapping: TrackerCore.detectMapping(table.headers) };
  });
}

function getImportDescriptor_(token) {
  var cached = CacheService.getScriptCache().get("import:" + String(token || ""));
  if (!cached) throw new Error("匯入工作階段已逾時，請重新選擇檔案。");
  var descriptor = JSON.parse(cached);
  if (descriptor.createdBy !== currentUser_().email) throw new Error("匯入工作階段不屬於目前帳號。");
  requireEventAccess_(descriptor.eventId, true);
  return descriptor;
}

function readUploadedTable_(descriptor, sheetName) {
  if (descriptor.extension === "csv") {
    var content = DriveApp.getFileById(descriptor.originalFileId).getBlob().getDataAsString("UTF-8").replace(/^\uFEFF/, "");
    var values = Utilities.parseCsv(content);
    return valuesToObjects_(values);
  }
  var spreadsheet = SpreadsheetApp.openById(descriptor.convertedSpreadsheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error("找不到指定工作表：" + sheetName);
  return readSheetTable_(sheet);
}

function readSheetTable_(sheet) {
  var values = sheet.getDataRange().getDisplayValues();
  return valuesToObjects_(values);
}

function valuesToObjects_(values) {
  if (!values || !values.length) throw new Error("檔案沒有資料。");
  var headers = values[0].map(function (value) { return String(value || "").trim(); });
  if (!headers.some(Boolean)) throw new Error("第一列必須是欄位名稱。");
  var duplicates = headers.filter(function (header, index) { return header && headers.indexOf(header) !== index; });
  if (duplicates.length) throw new Error("欄位名稱不可重複：" + duplicates.join("、"));
  var rows = values.slice(1).filter(function (row) { return row.some(function (value) { return String(value || "").trim() !== ""; }); }).map(function (row) {
    var object = {};
    headers.forEach(function (header, index) { if (header) object[header] = row[index]; });
    return object;
  });
  if (rows.length > 5000) throw new Error("MVP 單次匯入上限為 5,000 列，請拆分檔案。");
  return { headers: headers.filter(Boolean), rows: rows };
}

function validateMapping_(mapping, headers) {
  mapping = mapping || {};
  TrackerConstants.REQUIRED_IMPORT_FIELDS.forEach(function (field) {
    if (!mapping[field]) throw new Error("尚未對應必填欄位：" + field);
  });
  Object.keys(mapping).forEach(function (field) {
    if (mapping[field] && headers.indexOf(mapping[field]) < 0) throw new Error("對應欄位不存在：" + mapping[field]);
  });
}

function buildImportPreview_(input) {
  var descriptor = getImportDescriptor_(input.token);
  if ([TrackerConstants.IMPORT_MODES.TRACKER, TrackerConstants.IMPORT_MODES.PROGRESS].indexOf(input.mode) < 0) throw new Error("請選擇正確的匯入模式。");
  var table = readUploadedTable_(descriptor, input.sheetName);
  validateMapping_(input.mapping, table.headers);
  var mapped = TrackerCore.mapRows(table.rows, input.mapping);
  var existing = readTable_("Tasks").filter(function (task) { return task.event_id === descriptor.eventId && !task.removed_at; });
  var diff = TrackerCore.diffImport(existing, mapped.items, input.mode);
  var possibleConflicts = diff.updated.concat(diff.removed.map(function (task) {
    return { existing: task, incoming: null, changes: ["removed"] };
  }));
  diff = TrackerCore.partitionConflicts(diff, importProtectedTaskIds_(possibleConflicts));
  return { descriptor: descriptor, mapped: mapped, diff: diff, rowCount: table.rows.length };
}

function importProtectedTaskIds_(changes) {
  var candidates = {};
  (changes || []).forEach(function (change) { candidates[String(change.existing.task_id)] = change.existing; });
  var histories = {};
  readTable_("ChangeLog").forEach(function (log) {
    var taskId = String(log.entity_id || "");
    if (String(log.entity) !== "Task" || !candidates[taskId]) return;
    if (!histories[taskId]) histories[taskId] = [];
    histories[taskId].push(log);
  });
  return Object.keys(candidates).filter(function (taskId) {
    var task = candidates[taskId];
    var history = histories[taskId] || [];
    var lastImportIndex = -1;
    history.forEach(function (log, index) {
      if (/^import-/.test(String(log.action || ""))) lastImportIndex = index;
    });
    if (lastImportIndex < 0) return String(task.source || "") !== "import";
    return history.slice(lastImportIndex + 1).some(function (log) {
      return !/^import-/.test(String(log.action || ""));
    });
  });
}

function previewImport(input) {
  input = input || {};
  var preview = buildImportPreview_(input);
  return {
    rowCount: preview.rowCount,
    validCount: preview.mapped.items.length,
    errors: preview.mapped.errors.slice(0, 100),
    summary: {
      added: input.mode === TrackerConstants.IMPORT_MODES.PROGRESS ? 0 : preview.diff.added.length,
      unknown: input.mode === TrackerConstants.IMPORT_MODES.PROGRESS ? preview.diff.added.length : 0,
      updated: preview.diff.updated.length,
      unchanged: preview.diff.unchanged.length,
      duplicates: preview.diff.duplicates.length,
      conflicts: preview.diff.conflicts.length,
      removed: preview.diff.removed.length,
      removalRatio: preview.diff.removalRatio,
      requiresDestructiveConfirm: preview.diff.requiresDestructiveConfirm
    },
    changes: preview.diff.updated.slice(0, 50).map(function (change) {
      return { taskId: change.existing.task_id, item: change.existing.item, fields: change.changes };
    }),
    conflicts: preview.diff.conflicts.slice(0, 50).map(function (change) {
      return { taskId: change.existing.task_id, item: change.existing.item, fields: change.changes };
    }),
    additions: preview.diff.added.slice(0, 50),
    removals: preview.diff.removed.slice(0, 50).map(cleanRow_)
  };
}

function resolveCategoryId_(name) {
  var normalized = TrackerCore.normalizeHeader(name);
  if (!normalized) return "";
  var category = listCategories_().find(function (item) {
    return TrackerCore.normalizeHeader(item.name) === normalized || String(item.category_id).toLowerCase() === String(name).toLowerCase();
  });
  return category ? category.category_id : "";
}

function confirmImport(input) {
  input = input || {};
  return withWriteLock_(function () {
    // Confirmation always recalculates under the write lock so another user's
    // changes cannot slip in between preview and persistence.
    var preview = buildImportPreview_(input);
    if (preview.mapped.errors.length) throw new Error("仍有 " + preview.mapped.errors.length + " 列格式錯誤，請修正後再匯入。");
    if (preview.diff.requiresDestructiveConfirm && !input.confirmLargeRemoval) throw new Error("本次將標記移除超過 20% 的既有事項，請勾選二次確認。");
    var batchId = newId_("IMP");
    var now = nowIso_();
    var addedCount = 0;
    if (input.mode === TrackerConstants.IMPORT_MODES.TRACKER) {
      preview.diff.added.forEach(function (item) {
        var task = {
          task_id: newId_("TSK"), event_id: preview.descriptor.eventId,
          category_id: resolveCategoryId_(item.category), item: item.item,
          owner_email: item.ownerEmail, due: item.due, original_due: item.due, done: !!item.completedAt,
          status: item.status, notes: item.notes, source: "import",
          external_key: item.externalKey, version: 1, updated_at: now,
          completed_at: item.completedAt, removed_at: ""
        };
        appendObject_("Tasks", task);
        writeChange_("Task", task.task_id, "import-create", null, task, batchId);
        addedCount += 1;
      });
    }
    preview.diff.updated.forEach(function (change) {
      var oldTask = cleanRow_(change.existing);
      var item = change.incoming;
      var patch = {
        due: item.due,
        done: !!item.completedAt || item.status === "完成",
        status: item.status,
        owner_email: item.ownerEmail,
        notes: item.notes,
        completed_at: item.completedAt,
        version: Number(change.existing.version || 0) + 1,
        updated_at: now
      };
      if (input.mode === TrackerConstants.IMPORT_MODES.TRACKER) {
        patch.item = item.item;
        patch.external_key = item.externalKey;
        patch.category_id = resolveCategoryId_(item.category) || change.existing.category_id;
      }
      var updated = updateObject_("Tasks", "task_id", change.existing.task_id, patch);
      writeChange_("Task", change.existing.task_id, "import-update", oldTask, updated, batchId);
    });
    if (input.mode === TrackerConstants.IMPORT_MODES.TRACKER) {
      preview.diff.removed.forEach(function (task) {
        var updated = updateObject_("Tasks", "task_id", task.task_id, { removed_at: now, updated_at: now, version: Number(task.version || 0) + 1 });
        writeChange_("Task", task.task_id, "import-remove", task, updated, batchId);
      });
      updateObject_("Events", "event_id", preview.descriptor.eventId, { completeness_status: "待確認", updated_at: now });
    }
    var summary = {
      added: addedCount,
      unknown: input.mode === TrackerConstants.IMPORT_MODES.PROGRESS ? preview.diff.added.length : 0,
      updated: preview.diff.updated.length,
      unchanged: preview.diff.unchanged.length,
      duplicates: preview.diff.duplicates.length,
      conflicts: preview.diff.conflicts.length,
      removed: input.mode === TrackerConstants.IMPORT_MODES.TRACKER ? preview.diff.removed.length : 0
    };
    appendObject_("ImportBatches", {
      batch_id: batchId,
      event_id: preview.descriptor.eventId,
      mode: input.mode,
      file_ref: preview.descriptor.originalUrl,
      file_name: preview.descriptor.fileName,
      summary_json: JSON.stringify(summary),
      mapping_json: JSON.stringify(input.mapping),
      created_by: currentUser_().email,
      created_at: now,
      status: "completed"
    });
    writeChange_("ImportBatch", batchId, "complete", null, summary, batchId);
    return { batchId: batchId, summary: summary, event: getEventDetail(preview.descriptor.eventId) };
  });
}
