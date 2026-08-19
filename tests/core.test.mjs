import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const C = require("../src/shared/constants.js");
const Core = require("../src/shared/core.js");

test("自動辨識常見中文欄名", () => {
  const headers = ["工作項目", "截止日", "負責人信箱", "進度", "說明", "編號"];
  assert.deepEqual(Core.detectMapping(headers), {
    item: "工作項目",
    due: "截止日",
    completedAt: "",
    ownerEmail: "負責人信箱",
    status: "進度",
    notes: "說明",
    category: "",
    externalKey: "編號"
  });
});

test("匯入列會正規化日期、Email 並回報錯誤列", () => {
  const mapped = Core.mapRows([
    {項目:"確認場勘",期限:"2026/08/20",負責人:" PM@EXAMPLE.COM ",狀態:"進行中"},
    {項目:"",期限:"不是日期",負責人:"bad",狀態:"未知"}
  ], {item:"項目",due:"期限",ownerEmail:"負責人",status:"狀態"});
  assert.equal(mapped.items.length, 1);
  assert.equal(mapped.items[0].due, "2026-08-20");
  assert.equal(mapped.items[0].ownerEmail, "pm@example.com");
  assert.equal(mapped.errors[0].row, 3);
  assert.equal(mapped.errors[0].messages.length, 4);
});

test("更新追蹤表會辨識新增、更新、不變與移除", () => {
  const existing = [
    {task_id:"1",item:"場勘",owner_email:"a@example.com",due:"2026-08-10",status:"未開始",notes:"",external_key:"A",version:1},
    {task_id:"2",item:"印刷",owner_email:"b@example.com",due:"2026-08-11",status:"未開始",notes:"",external_key:"B",version:1},
    {task_id:"3",item:"餐點",owner_email:"c@example.com",due:"2026-08-12",status:"未開始",notes:"",external_key:"C",version:1}
  ];
  const incoming = [
    {item:"場勘",ownerEmail:"a@example.com",due:"2026-08-10",status:"完成",notes:"",externalKey:"A",completedAt:"2026-08-09"},
    {item:"印刷",ownerEmail:"b@example.com",due:"2026-08-11",status:"未開始",notes:"",externalKey:"B",completedAt:""},
    {item:"講師簡報",ownerEmail:"d@example.com",due:"2026-08-13",status:"未開始",notes:"",externalKey:"D",completedAt:""}
  ];
  const diff = Core.diffImport(existing, incoming, C.IMPORT_MODES.TRACKER);
  assert.equal(diff.added.length, 1);
  assert.equal(diff.updated.length, 1);
  assert.equal(diff.unchanged.length, 1);
  assert.equal(diff.removed.length, 1);
  assert.equal(diff.requiresDestructiveConfirm, true);
});

test("更新進度不列出刪除且只比較允許欄位", () => {
  const existing = [{task_id:"1",item:"舊名稱",owner_email:"a@example.com",due:"2026-08-10",status:"未開始",notes:"",external_key:"A"}];
  const incoming = [{item:"新名稱",ownerEmail:"a@example.com",due:"2026-08-10",status:"未開始",notes:"",externalKey:"A",completedAt:""}];
  const diff = Core.diffImport(existing, incoming, C.IMPORT_MODES.PROGRESS);
  assert.equal(diff.updated.length, 0);
  assert.equal(diff.removed.length, 0);
});

test("同一匯入檔內相同外部鍵值不會重複新增", () => {
  const item = {item:"場勘",ownerEmail:"a@example.com",due:"2026-08-10",status:"未開始",notes:"",externalKey:"A"};
  const diff = Core.diffImport([], [item, {...item}], C.IMPORT_MODES.TRACKER);
  assert.equal(diff.added.length, 1);
  assert.equal(diff.duplicates.length, 1);
});

test("完整性檢核支援同義關鍵字並保留人工不適用決定", () => {
  const tasks = [{item:"主持人彩排",notes:"設備測試"}];
  const rules = [
    {category_id:"CAT_PRO",concept:"司儀／主持人",keywords:"司儀,主持人",level:"最低必要",active:true},
    {category_id:"CAT_PRO",concept:"合約／費用",keywords:"合約,費用",level:"建議",active:true}
  ];
  const decisions = [{category_id:"CAT_PRO",concept:"合約／費用",status:"not_applicable",reason:"本案內部支援"}];
  const result = Core.checklist(tasks,["CAT_PRO"],rules,decisions);
  assert.equal(result[0].status,"covered");
  assert.equal(result[1].status,"not_applicable");
  assert.equal(result[1].reason,"本案內部支援");
});

test("統計排除取消／不適用，並正確計算完成率、準時率與逾期", () => {
  const tasks = [
    {due:"2026-08-05",status:"完成",completed_at:"2026-08-04"},
    {due:"2026-08-05",status:"完成",completed_at:"2026-08-06"},
    {due:"2026-08-07",status:"進行中"},
    {due:"2026-08-01",status:"取消"},
    {due:"2026-08-01",status:"不適用"}
  ];
  const result = Core.metrics(tasks,"2026-08-08");
  assert.equal(result.total,3);
  assert.equal(result.completed,2);
  assert.equal(result.overdue,1);
  assert.equal(result.completionRate,66.7);
  assert.equal(result.onTimeRate,50);
});

test("準時率以原始截止日計算，不因展延期限而改寫歷史", () => {
  const result = Core.metrics([
    {due:"2026-08-10",original_due:"2026-08-05",status:"完成",completed_at:"2026-08-08"}
  ],"2026-08-10");
  assert.equal(result.completionRate,100);
  assert.equal(result.onTimeRate,0);
});

test("匯入衝突會保留系統值，包含 Excel 刪除的情況", () => {
  const changed = {task_id:"1",item:"場勘",external_key:"A"};
  const removed = {task_id:"2",item:"印刷",external_key:"B"};
  const diff = {
    added:[], unchanged:[], duplicates:[],
    updated:[{existing:changed,incoming:{externalKey:"A"},changes:["status"]}],
    removed:[removed], removalRatio:0.5, requiresDestructiveConfirm:true
  };
  const result = Core.partitionConflicts(diff,["1","2"]);
  assert.equal(result.updated.length,0);
  assert.equal(result.removed.length,0);
  assert.equal(result.conflicts.length,2);
  assert.equal(result.requiresDestructiveConfirm,false);
});

test("完成、取消與未到期事項不寄提醒", () => {
  assert.equal(Core.dueForReminder({due:"2026-08-08",status:"進行中"},"2026-08-08"),true);
  assert.equal(Core.dueForReminder({due:"2026-08-08",status:"完成"},"2026-08-08"),false);
  assert.equal(Core.dueForReminder({due:"2026-08-08",status:"取消"},"2026-08-08"),false);
  assert.equal(Core.dueForReminder({due:"2026-08-09",status:"未開始"},"2026-08-08"),false);
});
