const dailyTasks=[
 {time:'1 HOUR',title:'Computer Science Coursework',detail:'Coursera, data structures course, or programming review.',tag:'Coursework'},
 {time:'1 HOUR',title:'GitHub Learning Upload',detail:'Plan what was learned, create a folder, and upload one small project to GitHub.',tag:'GitHub'},
 {time:'1 HOUR',title:'Projects / Portfolio',detail:'Canefor presentation, personal website, LinkedIn, resume, GitHub interface, or book exchange site.',tag:'Portfolio'},
 {time:'UNTIL 8 PM',title:'Fitness Block',detail:'Workout, walk, sport, stretching, or recovery routine.',tag:'Fitness'},
 {time:'8:00 PM - 9:00 PM',title:'Math 134 Review',detail:'Review definitions, examples, practice questions, and weak areas.',tag:'UAB Prep'},
 {time:'9:00 PM - 10:00 PM',title:'Physics 124 Review',detail:'30 minutes to 1 hour of physics review and problem solving.',tag:'UAB Prep'},
 {time:'UNTIL 11 PM',title:'Daily Time With Leena',detail:'',tag:'Family'},
 {time:'1 HOUR - 2 HOUR',title:'TechnolotApp.com / Record',detail:'Website features, analytics dashboard, company outreach, recording, and videos.',tag:'TechnolotApp'},
 {time:'15 MIN - 30 MIN',title:'Choose / Read Book',detail:'Pick a book and build a calm reading habit before sleep.',tag:'Reading'}
];
const weeklyTasks=['Computer Science Course','GitHub Upload','Portfolio Update','Fitness','Math 134','Physics 124','TechnolotApp','Reading'];
const $=s=>document.querySelector(s);
const get=(k,f)=>JSON.parse(localStorage.getItem(k)||JSON.stringify(f));
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const todayISO=()=>new Date().toISOString().slice(0,10);
function current(){return get('summerCurrent',{date:todayISO(),tasks:{},reflection:''});}
function saveCurrent(data){set('summerCurrent',data);updateProgress();}
function renderDaily(){
 const data=current();
 if(!data.date)data.date=todayISO();
 $('#todayDate').value=data.date;
 $('#dailyReflection').value=data.reflection||'';
 $('#dailyChecklist').innerHTML=dailyTasks.map((t,i)=>{
  const item=data.tasks[i]||{done:false,note:''};
  return `<article class="schedule-item ${item.done?'completed':''}"><input class="check daily-check" type="checkbox" data-i="${i}" ${item.done?'checked':''}><div><div class="schedule-time">${t.time}</div><p class="schedule-title">${t.title}</p><p class="schedule-detail">${t.detail}</p><span class="tag">${t.tag}</span></div><div class="work-note"><label>What did you complete?</label><textarea class="note-input" data-i="${i}" placeholder="Type details here...">${escapeHtml(item.note||'')}</textarea></div></article>`;
 }).join('');
 document.querySelectorAll('.daily-check').forEach(cb=>cb.addEventListener('change',e=>{const d=current();const i=e.target.dataset.i;d.tasks[i]=d.tasks[i]||{};d.tasks[i].done=e.target.checked;saveCurrent(d);renderDaily();}));
 document.querySelectorAll('.note-input').forEach(n=>n.addEventListener('input',e=>{const d=current();const i=e.target.dataset.i;d.tasks[i]=d.tasks[i]||{};d.tasks[i].note=e.target.value;saveCurrent(d);}));
}
function escapeHtml(str){return String(str).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function archiveToday(clearAfter=true){
 const data=current();
 data.date=$('#todayDate').value||todayISO();
 data.reflection=$('#dailyReflection').value||'';
 const hasWork=Object.values(data.tasks||{}).some(x=>x.done||x.note)||data.reflection.trim();
 if(!hasWork){ if(clearAfter) resetCurrent(); return; }
 const history=get('summerHistory',[]);
 const record={id:Date.now(),date:data.date,savedAt:new Date().toLocaleString(),tasks:data.tasks,reflection:data.reflection};
 const filtered=history.filter(r=>r.date!==record.date);
 filtered.unshift(record);
 set('summerHistory',filtered);
 if(clearAfter) resetCurrent(); else {saveCurrent(data);renderHistory();updateProgress();}
}
function resetCurrent(){set('summerCurrent',{date:todayISO(),tasks:{},reflection:''});renderDaily();renderHistory();updateProgress();}
function renderHistory(){
 const history=get('summerHistory',[]);
 $('#recordCount').textContent=history.length;
 if(!history.length){$('#historyList').innerHTML='<div class="empty">No saved records yet. Complete today\'s schedule, then press “Save Today to Records.”</div>';return;}
 $('#historyList').innerHTML=history.map(r=>{
  const done=Object.values(r.tasks||{}).filter(x=>x.done).length;
  const items=dailyTasks.map((t,i)=>{const item=(r.tasks||{})[i]||{}; if(!item.done&&!item.note)return ''; return `<div class="history-item"><strong>${item.done?'✓':'•'} ${t.title}</strong><p>${escapeHtml(item.note||'No note added.')}</p></div>`;}).join('');
  return `<article class="history-card"><div class="history-head"><div><h3>${formatDate(r.date)}</h3><small>Saved: ${r.savedAt}</small></div><span class="pill">${done}/${dailyTasks.length} completed</span></div><div class="history-items">${items||'<p class="section-note">No task details saved.</p>'}${r.reflection?`<div class="history-item"><strong>End-of-day reflection</strong><p>${escapeHtml(r.reflection)}</p></div>`:''}</div></article>`;
 }).join('');
}
function formatDate(iso){const d=new Date(iso+'T00:00:00');return d.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
function renderWeekly(){
 const saved=get('summerWeekly',{});
 $('#weeklyTracker tbody').innerHTML=weeklyTasks.map((task,r)=>`<tr><td>${task}</td>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,c)=>`<td><input type="checkbox" class="week-check" data-k="${r}-${c}" ${saved[`${r}-${c}`]?'checked':''}></td>`).join('')}</tr>`).join('');
 document.querySelectorAll('.week-check').forEach(cb=>cb.addEventListener('change',e=>{saved[e.target.dataset.k]=e.target.checked;set('summerWeekly',saved);updateProgress();}));
}
function pct(done,total){return total?Math.round(done/total*100):0}
function updateProgress(){
 const d=current(); const w=get('summerWeekly',{}); const history=get('summerHistory',[]);
 $('#todayProgress').textContent=pct(Object.values(d.tasks||{}).filter(x=>x.done).length,dailyTasks.length)+'%';
 $('#weeklyProgress').textContent=pct(Object.values(w).filter(Boolean).length,weeklyTasks.length*7)+'%';
 $('#recordCount').textContent=history.length;
}
$('#menuBtn').addEventListener('click',()=>$('#navLinks').classList.toggle('open'));
$('#todayDate').addEventListener('change',e=>{const d=current();d.date=e.target.value;saveCurrent(d);});
$('#dailyReflection').addEventListener('input',e=>{const d=current();d.reflection=e.target.value;saveCurrent(d);});
$('#saveRecord').addEventListener('click',()=>{archiveToday(false);alert('Today has been saved to Previous Records.');});
$('#resetToday').addEventListener('click',()=>{if(confirm('Save today to Previous Records and clear the schedule?')) archiveToday(true);});
$('#clearHistory').addEventListener('click',()=>{if(confirm('Clear all previous records?')){localStorage.removeItem('summerHistory');renderHistory();updateProgress();}});
$('#exportBtn').addEventListener('click',()=>{
 const data={current:current(),history:get('summerHistory',[]),weekly:get('summerWeekly',{}),exported:new Date().toLocaleString()};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lance-summer-plan-records.json';a.click();URL.revokeObjectURL(a.href);
});
renderDaily();renderWeekly();renderHistory();updateProgress();
