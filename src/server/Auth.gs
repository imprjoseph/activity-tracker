/** Identity, role and event-level authorization. */

function activeEmail_() {
  return String(Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || "").trim().toLowerCase();
}

function currentUser_() {
  var email = activeEmail_();
  if (!email) throw new Error("無法取得公司 Google 帳號，請確認 Web App 僅限網域使用者並以使用者身分執行。");
  var user = readTable_("Users").find(function (row) { return String(row.email).toLowerCase() === email; });
  if (!user || !truthy_(user.active)) throw new Error("此帳號尚未啟用，請洽系統管理員：" + email);
  delete user._row;
  return user;
}

function truthy_(value) {
  return value === true || value === 1 || ["true", "1", "yes", "y", "是", "啟用"].indexOf(String(value).toLowerCase()) >= 0;
}

function requireRoles_(roles) {
  var user = currentUser_();
  if (roles.indexOf(user.role) < 0) throw new Error("你沒有執行此操作的權限。");
  return user;
}

function isManager_(user) {
  return [TrackerConstants.ROLES.ADMIN, TrackerConstants.ROLES.BOSS].indexOf((user || currentUser_()).role) >= 0;
}

function canAccessEvent_(eventId, write) {
  var user = currentUser_();
  if (write && user.role === TrackerConstants.ROLES.VIEWER) return false;
  if (isManager_(user)) return true;
  var event = findOne_("Events", "event_id", eventId);
  if (!event) return false;
  if (String(event.pm).toLowerCase() === String(user.email).toLowerCase()) return user.role !== TrackerConstants.ROLES.VIEWER || !write;
  var member = readTable_("EventMembers").find(function (row) {
    return String(row.event_id) === String(eventId) && String(row.user_id) === String(user.user_id);
  });
  if (!member) return false;
  if (String(member.permission) === "none") return false;
  return !write || ["edit", "manage"].indexOf(String(member.permission)) >= 0;
}

function canManageEventMembers_(eventId) {
  var user = currentUser_();
  if (isManager_(user)) return true;
  var event = findOne_("Events", "event_id", eventId);
  if (!event) return false;
  if (user.role === TrackerConstants.ROLES.PM && String(event.pm).toLowerCase() === String(user.email).toLowerCase()) return true;
  var member = readTable_("EventMembers").find(function (row) {
    return String(row.event_id) === String(eventId) && String(row.user_id) === String(user.user_id);
  });
  return user.role === TrackerConstants.ROLES.PM && member && String(member.permission) === "manage";
}

function requireEventAccess_(eventId, write) {
  if (!eventId || !canAccessEvent_(eventId, write)) throw new Error("你沒有此活動的存取權限。");
  return currentUser_();
}

function listUsers() {
  requireRoles_([TrackerConstants.ROLES.ADMIN, TrackerConstants.ROLES.BOSS, TrackerConstants.ROLES.PM]);
  return readTable_("Users").map(function (user) {
    delete user._row;
    return user;
  });
}

function saveUser(input) {
  requireRoles_([TrackerConstants.ROLES.ADMIN]);
  input = input || {};
  var email = String(input.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("請輸入有效的 Email。");
  if (!TrackerConstants.ROLE_LABELS[input.role]) throw new Error("角色無效。");
  return withWriteLock_(function () {
    var users = readTable_("Users");
    var existing = input.user_id ? users.find(function (row) { return String(row.user_id) === String(input.user_id); }) : users.find(function (row) { return String(row.email).toLowerCase() === email; });
    var duplicate = users.find(function (row) { return String(row.email).toLowerCase() === email && (!existing || row.user_id !== existing.user_id); });
    if (duplicate) throw new Error("此 Email 已有帳號。");
    var nextActive = input.active !== false;
    if (existing && existing.role === TrackerConstants.ROLES.ADMIN && (!nextActive || input.role !== TrackerConstants.ROLES.ADMIN)) {
      var activeAdmins = users.filter(function (row) { return row.role === TrackerConstants.ROLES.ADMIN && truthy_(row.active); });
      if (activeAdmins.length <= 1) throw new Error("系統至少必須保留一位啟用中的管理員。");
    }
    var now = nowIso_();
    var user = {
      user_id: existing ? existing.user_id : newId_("USR"),
      email: email,
      name: String(input.name || email.split("@")[0]).trim(),
      role: input.role,
      active: nextActive,
      created_at: existing ? existing.created_at : now,
      updated_at: now
    };
    if (existing) updateObject_("Users", "user_id", existing.user_id, user);
    else appendObject_("Users", user);
    writeChange_("User", user.user_id, existing ? "update" : "create", existing, user);
    return user;
  });
}

function saveEventMember(input) {
  input = input || {};
  if (!canManageEventMembers_(input.event_id)) throw new Error("你沒有管理此活動成員的權限。");
  if (["view", "edit", "manage", "none"].indexOf(String(input.permission)) < 0) throw new Error("案件權限無效。");
  var user = findOne_("Users", "user_id", input.user_id);
  if (!user || !truthy_(user.active)) throw new Error("找不到已啟用的使用者。");
  return withWriteLock_(function () {
    var sheet = table_("EventMembers");
    var headers = headers_(sheet);
    var existing = readTable_("EventMembers").find(function (row) {
      return String(row.event_id) === String(input.event_id) && String(row.user_id) === String(input.user_id);
    });
    var member = {
      event_id: String(input.event_id),
      user_id: String(input.user_id),
      permission: String(input.permission),
      created_at: existing ? existing.created_at : nowIso_()
    };
    if (existing) {
      sheet.getRange(existing._row, 1, 1, headers.length).setValues([headers.map(function (header) { return safeCell_(member[header]); })]);
    } else appendObject_("EventMembers", member);
    writeChange_("EventMember", input.event_id + ":" + input.user_id, existing ? "update" : "create", existing, member);
    return member;
  });
}
