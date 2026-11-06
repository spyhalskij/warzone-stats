(() => {
 const KEY = 'warzone-stats:view';
 const base = document.querySelector('link[rel="icon"]').getAttribute('href').replace(/favicon\.svg$/, '');
 const defaults = { era:'wz2', mode:'br', group:'career', sort:{br:{key:'score',dir:'desc'},res:{key:'score',dir:'desc'}} };
 let saved = {};
 try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {}
 const query = new URL(location.href).searchParams;
 const valid = (x, allowed) => allowed.includes(x);
 const era = valid(query.get('era'), ['wz1','wz2']) ? query.get('era') : valid(saved.era, ['wz1','wz2']) ? saved.era : defaults.era;
 const mode = valid(query.get('mode'), ['br','res']) ? query.get('mode') : valid(saved.mode, ['br','res']) ? saved.mode : defaults.mode;
 const group = valid(query.get('group'), ['career','eliminations','placements']) ? query.get('group') : valid(saved.group, ['career','eliminations','placements']) ? saved.group : defaults.group;
 const sort = saved.sort && typeof saved.sort === 'object' ? saved.sort : structuredClone(defaults.sort);
 if (valid(query.get('sort'), ['score','scorePerMin','games','timePlayed','elims','deaths','ed','streak','avgElims','wins','top10','avgPlacement','avgSurvival','name'])) sort[mode] = { key:query.get('sort'), dir:query.get('dir')==='asc'?'asc':'desc' };
 window.warzoneState = { era, mode, group, sort };
 const columns = {
  score:{decimals:0}, scorePerMin:{decimals:0}, games:{decimals:0}, timePlayed:{time:true},
  elims:{decimals:0}, deaths:{decimals:0}, ed:{decimals:2}, streak:{decimals:0}, avgElims:{decimals:0},
  wins:{decimals:0}, top10:{decimals:0}, avgPlacement:{decimals:0}, avgSurvival:{time:true}
 };
 const tables = [...document.querySelectorAll('table.leaderboard')];
 const tabOf = key => tables[0]?.querySelector(`th[data-key="${key}"]`)?.dataset.tab || 'career';
 const seconds = text => { let result=0; for (const p of String(text).matchAll(/(\d+)([DHMS])/g)) result += +p[1] * {D:86400,H:3600,M:60,S:1}[p[2]]; return result; };
 const compareValues = (a,b,key,dir) => {
  if (key === 'name') return (dir==='asc'?1:-1) * a.dataset.name.localeCompare(b.dataset.name);
  const ar=a.querySelector(`td[data-key="${key}"]`).dataset.value, br=b.querySelector(`td[data-key="${key}"]`).dataset.value;
  if (!ar && !br) return a.dataset.name.localeCompare(b.dataset.name);
  if (!ar) return 1; if (!br) return -1;
  const diff=columns[key]?.time?seconds(ar)-seconds(br):Number(ar)-Number(br);
  return (dir==='asc'?1:-1)*diff || a.dataset.name.localeCompare(b.dataset.name);
 };
 function drawTable(table) {
  const currentMode=table.dataset.mode, current=window.warzoneState.sort[currentMode] || defaults.sort[currentMode];
  const key=current.key,dir=current.dir;
  [...table.querySelectorAll('[data-tab]')].forEach(cell=>{
   const active=cell.dataset.tab===window.warzoneState.group, pinned=cell.classList.contains('priority');
   cell.hidden=!active&&!pinned; cell.classList.toggle('is-sorted',cell.dataset.key===key);
   cell.classList.toggle('outside-group',!active);
  });
  const headers=[...table.tHead.rows[0].cells];
  headers.forEach(th=>{
   if(th.dataset.key===key){th.setAttribute('aria-sort',dir==='asc'?'ascending':'descending');th.querySelector('.chevron').textContent=dir==='asc'?'↑':'↓';th.querySelector('button').setAttribute('aria-label',`${th.querySelector('button').textContent.trim()} column, ${dir==='asc'?'ascending':'descending'}. Activate to reverse.`)}
   else{th.removeAttribute('aria-sort');th.querySelector('.chevron').textContent='';}
  });
  const rows=[...table.tBodies[0].rows].sort((a,b)=>compareValues(a,b,key,dir));
  rows.forEach((row,i)=>{const rank=row.querySelector('[data-rank]');rank.textContent=String(i+1);rank.className=`rank${i<3?' rank-'+(i+1):''}`;table.tBodies[0].append(row);});
 }
 function applyState() {
  const {era,mode,group,sort}=window.warzoneState;
  document.documentElement.dataset.era=era;document.documentElement.dataset.mode=mode;document.documentElement.dataset.group=group;
  document.querySelectorAll('.era-content').forEach(view=>{view.hidden=!(view.dataset.era===era&&view.dataset.mode===mode)});
  document.querySelectorAll('.switch-option').forEach(link=>{
   const active=link.dataset.eraTarget===era||link.dataset.modeTarget===mode;
   if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('.group-switch [data-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===group)));
  const current=sort[mode]||defaults.sort[mode];sort[mode]=current;
  const activeTable=tables.find(table=>table.dataset.mode===mode);
  if(era==='wz2'&&activeTable)drawTable(activeTable);
  const title=document.querySelector(`.era-content[data-era="${era}"][data-mode="${mode}"] h1`);
  if(title)document.title=title.textContent+' · Warzone Stats';
  const params=new URLSearchParams({era,mode,group});
  if(era==='wz2'){params.set('sort',current.key);params.set('dir',current.dir)}
  history.replaceState(null,'',`${location.pathname}?${params}#${era}-${mode}`);
  try{localStorage.setItem(KEY,JSON.stringify(window.warzoneState))}catch(_){}
 }
 document.querySelectorAll('.switch-option').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();
  if(link.dataset.eraTarget)window.warzoneState.era=link.dataset.eraTarget;
  if(link.dataset.modeTarget)window.warzoneState.mode=link.dataset.modeTarget;
  applyState();
 }));
 document.querySelectorAll('.group-switch [data-group]').forEach(button=>button.addEventListener('click',()=>{
  const next=button.dataset.group;window.warzoneState.group=next;
  window.warzoneState.sort[window.warzoneState.mode]={key:{career:'score',eliminations:'elims',placements:'wins'}[next],dir:'desc'};
  applyState();
 }));
 document.querySelectorAll('table.leaderboard th[data-key] button').forEach(button=>button.addEventListener('click',()=>{
  const table=button.closest('table'),mode=table.dataset.mode,key=button.closest('th').dataset.key,current=window.warzoneState.sort[mode];
  if(current.key===key)current.dir=current.dir==='desc'?'asc':'desc';
  else{const first={name:'asc',score:'desc',scorePerMin:'desc',games:'desc',elims:'desc',deaths:'desc',ed:'desc',streak:'desc',avgElims:'desc',wins:'desc',top10:'desc',avgPlacement:'asc'}[key]||'desc';window.warzoneState.sort[mode]={key,dir:first}}
  window.warzoneState.group=tabOf(key);
  applyState();
 }));
 // Static pages contain one matching board with data-static-view; the root and Pages
 // 404 fallback contain all four, which lets direct query URLs stay fully static.
 applyState();
})();
