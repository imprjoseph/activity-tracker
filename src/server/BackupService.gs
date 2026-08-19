/** Daily Google Sheet backup with a configurable 30–90 day retention window. */

function backupFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("TRACKER_BACKUP_FOLDER_ID");
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (error) { props.deleteProperty("TRACKER_BACKUP_FOLDER_ID"); }
  }
  var folder = DriveApp.createFolder("會議活動追蹤系統｜每日備份");
  props.setProperty("TRACKER_BACKUP_FOLDER_ID", folder.getId());
  return folder;
}

function installBackupTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "runDailyBackup") ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger("runDailyBackup").timeBased().atHour(2).everyDays(1).inTimezone(TrackerConstants.TIME_ZONE).create();
}

function runDailyBackup() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { skipped: true, reason: "locked" };
  try {
    var db = trackerDb_();
    var folder = backupFolder_();
    var stamp = Utilities.formatDate(new Date(), TrackerConstants.TIME_ZONE, "yyyyMMdd_HHmmss");
    var copy = DriveApp.getFileById(db.getId()).makeCopy("活動追蹤備份_" + stamp, folder);
    var retention = Math.max(30, Math.min(90, Number(PropertiesService.getScriptProperties().getProperty("BACKUP_RETENTION_DAYS") || 60)));
    var cutoff = new Date().getTime() - retention * 86400000;
    var files = folder.getFiles();
    var pruned = 0;
    while (files.hasNext()) {
      var file = files.next();
      if (file.getId() !== copy.getId() && file.getDateCreated().getTime() < cutoff) {
        file.setTrashed(true);
        pruned += 1;
      }
    }
    var summary = { fileId: copy.getId(), fileUrl: copy.getUrl(), retainedDays: retention, pruned: pruned };
    writeChange_("Backup", copy.getId(), "create", null, summary);
    PropertiesService.getScriptProperties().setProperty("LAST_BACKUP_AT", nowIso_());
    return summary;
  } finally {
    lock.releaseLock();
  }
}

function createBackupNow() {
  requireRoles_([TrackerConstants.ROLES.ADMIN]);
  return runDailyBackup();
}
