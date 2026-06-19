const dailyTasks = [
  {time:'1 HOUR', title:'Computer Science Coursework', detail:'Coursera, data structures course, or programming review.', tag:'Coursework'},
  {time:'1 HOUR', title:'GitHub Learning Upload', detail:'Plan what was learned, create a folder, and upload one small project to GitHub.', tag:'GitHub'},
  {time:'1 HOUR', title:'Projects / Portfolio', detail:'Canefor presentation, personal website, LinkedIn, resume, GitHub interface, or book exchange site.', tag:'Portfolio'},
  {time:'UNTIL 8 PM', title:'Fitness Block', detail:'Go to gym for a workout + cardio.', tag:'Fitness'},
  {time:'8:00 PM - 9:00 PM', title:'Math 134 Review', detail:'Review definitions, examples, practice questions, and weak areas.', tag:'UAB Prep'},
  {time:'9:00 PM - 10:00 PM', title:'Physics 124 Review', detail:'30 minutes to 1 hour of physics review and problem solving.', tag:'UAB Prep'},
  {time:'UNTIL 11 PM', title:'Daily Time With Leena', detail:'', tag:'Family'},
  {time:'1 HOUR - 2 HOUR', title:'TechnolotApp.com', detail:'Website features, analytics dashboard, company outreach, recording, and videos.', tag:'TechnolotApp'},
  {time:'15 MIN - 30 MIN BEFORE BED', title:'Choose / Read Book', detail:'Pick a book and build a calm reading habit before sleep.', tag:'Reading'}
];
const weeklyTasks = ['Computer Science Course','GitHub Upload','Portfolio Update','Fitness','Math 134','Physics 124','TechnolotApp','Reading'];
const goals = {
  'Computer Science':['Complete data structures course','Review programming 1-2 days per week','Upload 20 GitHub projects','Write README files for best projects'],
  'Internship Prep':['Create LinkedIn profile','Update resume','Practice interview questions','Apply to internship opportunities'],
  'Portfolio / Website':['Update personal website','Improve GitHub interface','Add Canefor presentation features','Improve community book exchange site'],
  'UAB Preparation':['Review Math 134','Review Physics 124','Build university study routine','Keep consistent sleep schedule'],
  'TechnolotApp':['Improve dashboard features','Track views and clicks','Reach out to companies','Record and make videos'],
  'Reading':['Choose a new book','Read 20-30 minutes nightly','Write short reflection notes','Build long-term focus']
};
const $ = s => document.querySelector(s);
const get = (k, f) => JSON.parse(localStorage.getItem(k) || JSON.stringify(f));
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
function renderDaily(){
  const saved = get('summerDaily', {});
  $('#dailyChecklist').innerHTML = dailyTasks.map((t,i)=>`<label class="schedule-item ${saved[i]?'completed':''}"><input class="check daily-check" type="checkbox" data-i="${i}" ${saved[i]?'checked':''}><div><div class="schedule-time">${t.time}</div><p class="schedule-title">${t.title}</p><p class="schedule-detail">${t.detail}</p></div><span class="tag">${t.tag}</span></label>`).join('');
  document.querySelectorAll('.daily-check').forEach(cb=>cb.addEventListener('change',e=>{saved[e.target.dataset.i]=e.target.checked;set('summerDaily',saved);renderDaily();updateProgress();}));
}
function renderWeekly(){
  const saved = get('summerWeekly', {});
  $('#weeklyTracker tbody').innerHTML = weeklyTasks.map((task,r)=>`<tr><td>${task}</td>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,c)=>`<td><input type="checkbox" class="week-check" data-k="${r}-${c}" ${saved[`${r}-${c}`]?'checked':''}></td>`).join('')}</tr>`).join('');
  document.querySelectorAll('.week-check').forEach(cb=>cb.addEventListener('change',e=>{saved[e.target.dataset.k]=e.target.checked;set('summerWeekly',saved);updateProgress();}));
}
function renderGoals(){
  const saved = get('summerGoals', {});
  $('#goalColumns').innerHTML = Object.entries(goals).map(([cat,items],ci)=>`<article class="goal-card"><h3>${cat}</h3>${items.map((item,ii)=>`<label class="goal-item"><input type="checkbox" class="goal-check" data-k="${ci}-${ii}" ${saved[`${ci}-${ii}`]?'checked':''}><span>${item}</span></label>`).join('')}</article>`).join('');
  document.querySelectorAll('.goal-check').forEach(cb=>cb.addEventListener('change',e=>{saved[e.target.dataset.k]=e.target.checked;set('summerGoals',saved);updateProgress();}));
}
function pct(done,total){return total?Math.round(done/total*100):0}
function updateProgress(){
  const d = get('summerDaily', {}); const w = get('summerWeekly', {}); const g = get('summerGoals', {});
  $('#todayProgress').textContent = pct(Object.values(d).filter(Boolean).length, dailyTasks.length)+'%';
  $('#weeklyProgress').textContent = pct(Object.values(w).filter(Boolean).length, weeklyTasks.length*7)+'%';
  $('#goalProgress').textContent = pct(Object.values(g).filter(Boolean).length, Object.values(goals).flat().length)+'%';
}
function animateBars(){document.querySelectorAll('.bar span').forEach(el=>setTimeout(()=>el.style.width=el.dataset.width+'%',150));}
$('#menuBtn').addEventListener('click',()=>$('#navLinks').classList.toggle('open'));
$('#resetToday').addEventListener('click',()=>{localStorage.removeItem('summerDaily');renderDaily();updateProgress();});
$('#exportBtn').addEventListener('click',()=>{
  const data = {daily:get('summerDaily',{}), weekly:get('summerWeekly',{}), goals:get('summerGoals',{}), exported:new Date().toLocaleString()};
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='lance-summer-plan-progress.json'; a.click(); URL.revokeObjectURL(a.href);
});
renderDaily();renderWeekly();renderGoals();updateProgress();animateBars();
