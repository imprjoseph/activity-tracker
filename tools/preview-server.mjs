import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const index = fs.readFileSync(path.join(root, "src/client/Index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "src/client/Styles.html"), "utf8");
const app = fs.readFileSync(path.join(root, "src/client/App.html"), "utf8");

const events = [
  {event_id:"EVT_FORUM",name:"2026 跨境數位治理高峰論壇",event_date:"2026-09-18",pm:"pm@example.com",status:"進行中",completeness_status:"待確認",metrics:{total:42,completed:29,overdue:4,completionRate:69,onTimeRate:82}},
  {event_id:"EVT_BANK",name:"經濟金融暨公平待客研討會",event_date:"2026-10-06",pm:"linda@example.com",status:"進行中",completeness_status:"已確認",metrics:{total:31,completed:17,overdue:1,completionRate:54.8,onTimeRate:88.2}},
  {event_id:"EVT_SIG",name:"智慧網路 SIG 研討會",event_date:"2026-08-28",pm:"joseph@example.com",status:"進行中",completeness_status:"未檢核",metrics:{total:25,completed:21,overdue:3,completionRate:84,onTimeRate:76.2}},
  {event_id:"EVT_AWARDS",name:"年度產業創新獎頒獎典禮",event_date:"2026-11-12",pm:"amy@example.com",status:"規劃中",completeness_status:"待確認",metrics:{total:18,completed:4,overdue:0,completionRate:22.2,onTimeRate:100}}
];
const categories = [
  ["CAT_VENUE","現場佈置、燈光與動線"],["CAT_DESIGN","設計物與製作"],["CAT_VIP","貴賓接待"],["CAT_SPEAKER","講師追蹤"],["CAT_PRO","司儀、口譯等專業人員"],["CAT_CATERING","餐飲安排"],["CAT_VISIT","參訪安排"],["CAT_VIDEO","視訊會議及 AI 字幕"],["CAT_GIFT","伴手禮準備"],["CAT_BOOTH","展攤設置"],["CAT_INSURANCE","投保"],["CAT_VENDOR","廠商發包"]
].map(([category_id,name])=>({category_id,name,active:true}));
const tasks = [
  {task_id:"TSK_1",event_id:"EVT_FORUM",category_id:"CAT_VENUE",item:"完成會場第二次場勘",owner_email:"pm@example.com",due:"2026-08-06",status:"進行中",notes:"確認舞台與無障礙動線"},
  {task_id:"TSK_2",event_id:"EVT_FORUM",category_id:"CAT_SPEAKER",item:"收齊講者簡報與簡介",owner_email:"amy@example.com",due:"2026-08-12",status:"未開始",notes:"海外講者尚缺一份"},
  {task_id:"TSK_3",event_id:"EVT_FORUM",category_id:"CAT_DESIGN",item:"背板完稿送印",owner_email:"design@example.com",due:"2026-08-16",status:"進行中",notes:"等待主辦單位確認 Logo"},
  {task_id:"TSK_4",event_id:"EVT_FORUM",category_id:"CAT_CATERING",item:"確認特殊飲食名單",owner_email:"staff@example.com",due:"2026-08-20",status:"未開始",notes:""}
];
const dashboard = {eventCount:4,overall:{total:116,completed:71,overdue:8,completionRate:61.2,onTimeRate:82.6},completenessAlerts:3,byEvent:events.map((event,index)=>({...event,days_to_event:[41,59,20,96][index]})),byOwner:[{owner:"pm@example.com",metrics:{completionRate:68,onTimeRate:85,overdue:3}},{owner:"amy@example.com",metrics:{completionRate:55,onTimeRate:79,overdue:2}},{owner:"design@example.com",metrics:{completionRate:73,onTimeRate:88,overdue:1}}]};
const users = [{user_id:"USR_ADMIN",email:"admin@example.com",name:"王怡文",role:"admin",active:true},{user_id:"USR_PM",email:"pm@example.com",name:"陳專案",role:"pm",active:true},{user_id:"USR_AMY",email:"amy@example.com",name:"林執行",role:"staff",active:true}];
const boot = {user:users[0],roleLabels:{admin:"系統管理員",boss:"老闆／主管",pm:"專案經理",staff:"執行同仁",viewer:"唯讀／稽核"},eventStatuses:["規劃中","進行中","暫停","已完成","已封存"],taskStatuses:["未開始","進行中","待確認","完成","取消","不適用"],importFields:[],events,categories,dashboard,reminderRules:[{rule_id:"RR_TASK_DAILY",scope:"tasks",times:"09:00",cc:"boss@example.com",enabled:true,test_mode:true,test_recipient:"test@example.com",daily_limit:80},{rule_id:"RR_ASSIGNMENT",scope:"assignments",times:"09:00,13:00,18:00",cc:"boss@example.com",enabled:true,test_mode:true,test_recipient:"test@example.com",daily_limit:80}],users,systemStatus:{lastBackupAt:"2026-08-08T02:14:00+08:00"}};
const detail = {event:events[0],tasks,metrics:events[0].metrics,selectedCategoryIds:["CAT_VENUE","CAT_DESIGN","CAT_SPEAKER","CAT_CATERING","CAT_VIDEO","CAT_VENDOR"],checklist:[{categoryId:"CAT_VENUE",concept:"場勘／平面圖／動線",keywords:["場勘","平面圖","動線"],status:"covered"},{categoryId:"CAT_DESIGN",concept:"完稿／校稿／尺寸",keywords:["完稿","校稿","尺寸"],status:"covered"},{categoryId:"CAT_SPEAKER",concept:"交通／住宿／飲食",keywords:["交通","住宿","飲食"],status:"missing"},{categoryId:"CAT_VIDEO",concept:"網路備援／字幕權限",keywords:["網路備援","字幕權限"],status:"missing"}],importBatches:[{batch_id:"IMP_001",mode:"tracker",file_name:"論壇追蹤表_v4.xlsx",created_by:"pm@example.com",created_at:"2026-08-08T09:16",file_ref:"#"}],members:[{event_id:"EVT_FORUM",user_id:"USR_AMY",name:"林執行",email:"amy@example.com",permission:"edit",created_at:"2026-08-01T09:00"}]};
const myWork = tasks.slice(0,2).map((task)=>({...task,event_name:events[0].name,is_overdue:task.due<"2026-08-08"}));
const assignments = [{assignment_id:"ASN_1",title:"確認部會首長致詞稿版本",owner_emails:"admin@example.com",due:"2026-08-07",priority:"高",status:"進行中",notes:"下午前回覆主管",is_overdue:true}];

const mockScript = `<script>
const MOCK=${JSON.stringify({boot,detail,myWork,assignments})};
const mockRunner=(success,failure)=>new Proxy({}, {get(target,prop){
  if(prop==='withSuccessHandler')return (fn)=>mockRunner(fn,failure);
  if(prop==='withFailureHandler')return (fn)=>mockRunner(success,fn);
  return (...args)=>{setTimeout(()=>{let value=null;if(prop==='bootstrapApp')value=MOCK.boot;else if(prop==='listMyWork')value=MOCK.myWork;else if(prop==='listAssignments')value=MOCK.assignments;else if(prop==='getEventDetail')value=MOCK.detail;else if(prop==='previewReminderRun')value={today:'2026-08-08',dueTasks:8,dueAssignments:1};else if(prop==='getReminderLog')value=[];else value={};success?.(value)},80);return target}
}});
window.google={script:{run:mockRunner()}};
</script>`;

const html = index
  .replace('<?!= include_("src/client/Styles"); ?>', () => styles)
  .replace('<?!= include_("src/client/App"); ?>', () => mockScript + app);

http.createServer((request,response)=>{
  response.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"});
  response.end(html);
}).listen(4173,"127.0.0.1",()=>console.log("Preview: http://127.0.0.1:4173"));
