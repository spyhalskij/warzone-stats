(() => {
 const KEY = 'warzone-stats:view';
 const VERSION = 4;
 const base = document.querySelector('link[rel="icon"]').getAttribute('href').replace(/favicon\.svg$/, '');
 const groups = {
  all:['games','top10','wins','top10Rate','winRate','elims','deaths','ed','streak','avgElims','avgPlacement','avgSurvival','timePlayed'],
  placements:['games','top10','wins','top10Rate','winRate','avgPlacement','avgSurvival','timePlayed'],
  eliminations:['elims','deaths','ed','streak','avgElims']
 };
 const defaultSort = {all:'wins',placements:'wins',eliminations:'ed'};
 const defaults = {
  era:'wz2', mode:'br', group:'placements',
  sort:{br:{key:'wins',dir:'desc',group:'placements'},res:{key:'wins',dir:'desc',group:'placements'}}
 };
 const columns = {
  games:{decimals:0},timePlayed:{time:true},top10Rate:{percent:true},winRate:{percent:true},elims:{decimals:0},deaths:{decimals:0},
  ed:{decimals:2},streak:{decimals:0},avgElims:{decimals:0},wins:{decimals:0},
  top10:{decimals:0},avgPlacement:{decimals:0},avgSurvival:{time:true}
 };
  const validKey = (key, group) => key === 'name' || groups[group]?.includes(key);
 let saved = {};
 try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {}
 const query = new URL(location.href).searchParams;
 // Path routes are explicit user intent. Query is canonical on the root/fallback;
 // no-query static routes must never inherit a different saved/default era or mode.
 const path = location.pathname.match(/\/(wz1|wz2)\/(br|res)\/?$/);
 let era, mode;
 if (query.has('era') || query.has('mode')) {
   // On a static route with only one matching real page, relative controls use the
  // base URL; links there carry a query and expected mode if one is supplied.
  era = ['wz1','wz2'].includes(query.get('era')) ? query.get('era') : saved.era || defaults.era;
  mode = ['br','res'].includes(query.get('mode')) ? query.get('mode') : saved.mode || defaults.mode;
  if (path && (era !== path[1] || mode !== path[2])) { location.replace(`${base}?${query}#${era}-${mode}`); return; }
 } else if (path) {
  era = path[1]; mode = path[2];
 } else {
  era = ['wz1','wz2'].includes(saved.era) ? saved.era : defaults.era;
  mode = ['br','res'].includes(saved.mode) ? saved.mode : defaults.mode;
 }
 const normalizeGroup = value=>value==='career'?'placements':value;
 const savedGroup=normalizeGroup(saved.group);
 const priorGroup={br:normalizeGroup(saved.sort?.br?.group??savedGroup),res:normalizeGroup(saved.sort?.res?.group??savedGroup)};
 let group = groups[normalizeGroup(query.get('group'))||''] ? normalizeGroup(query.get('group')) : groups[savedGroup||''] ? savedGroup : defaults.group;
 const sort = {br:{...defaults.sort.br},res:{...defaults.sort.res}};
 if (saved.version===VERSION) {
  for (const boardMode of ['br','res']) {
   if (validKey(saved.sort?.[boardMode]?.key, priorGroup[boardMode])) sort[boardMode] = {key:saved.sort[boardMode].key,dir:saved.sort[boardMode].dir === 'asc' ? 'asc' : 'desc',group:priorGroup[boardMode]};
  }
 }
 if (query.has('group')) sort[mode] = {key:defaultSort[group],dir:'desc',group};
 if (validKey(query.get('sort'), group)) sort[mode] = {key:query.get('sort'),dir:query.get('dir') === 'asc' ? 'asc' : 'desc',group};
 if (sort[mode].key !== 'name' && !groups[group].includes(sort[mode].key)) sort[mode] = {key:defaultSort[group],dir:'desc'};
 window.warzoneState = {version:VERSION,era,mode,group,sort};
 const tables = [...document.querySelectorAll('table.leaderboard')];
 const seconds = text => {let result=0;for(const p of String(text).matchAll(/(\d+)([DHMS])/g))result+=+p[1]*{D:86400,H:3600,M:60,S:1}[p[2]];return result;};
 const compare = (a,b,key,dir) => {
  if (key === 'name') return (dir==='asc'?1:-1)*a.dataset.name.localeCompare(b.dataset.name);
  const ar=a.querySelector(`td[data-key="${key}"]`)?.dataset.value||'',br=b.querySelector(`td[data-key="${key}"]`)?.dataset.value||'';
  if(!ar&&!br)return a.dataset.name.localeCompare(b.dataset.name);if(!ar)return 1;if(!br)return-1;
  const diff=columns[key]?.time?seconds(ar)-seconds(br):Number(ar)-Number(br);
  return(dir==='asc'?1:-1)*diff||a.dataset.name.localeCompare(b.dataset.name);
 };
 function drawTable(table) {
  const currentMode=table.dataset.mode,current=sort[currentMode]||defaults.sort[currentMode],key=current.key,dir=current.dir;sort[currentMode].group=group;
  [...table.querySelectorAll('[data-tabs]')].forEach(cell=>{
   const active=cell.dataset.tabs.split(',').includes(group);
   cell.hidden=!active;cell.classList.toggle('is-sorted',active&&cell.dataset.key===key);
  });
  [...table.tHead.rows[0].cells].forEach(th=>{
   const button=th.querySelector('button');
   if(th.dataset.key===key){th.setAttribute('aria-sort',dir==='asc'?'ascending':'descending');th.querySelector('.chevron').textContent=dir==='asc'?'↑':'↓';}
   else{th.removeAttribute('aria-sort');th.querySelector('.chevron').textContent='';}
   const label=th.querySelector('.sr-only')?.textContent || 'Sort by player';
   button.setAttribute('aria-label',`${label}${th.dataset.key===key?', '+dir+'ending; activate to reverse':''}`);
  });
  const rows=[...table.tBodies[0].rows].sort((a,b)=>compare(a,b,key,dir));
  rows.forEach((row,i)=>{const rank=row.querySelector('[data-rank]');rank.textContent=String(i+1);rank.className=`rank${i<3?' rank-'+(i+1):''}`;table.tBodies[0].append(row);});
 }
 function updateOverlays() {
  document.querySelectorAll('.era-content:not([hidden]) .leaderboard-scroll').forEach(frame=>{
   frame.classList.toggle('has-overflow',frame.scrollWidth>frame.clientWidth+1);
   frame.classList.toggle('is-at-end',frame.scrollLeft+frame.clientWidth>=frame.scrollWidth-1);
  });
 }
 function applyState() {
  const validSort=sort[mode].key==='name'||groups[group].includes(sort[mode].key);
  if(!validSort || (sort[mode].group && sort[mode].group!==group))sort[mode]={key:defaultSort[group],dir:'desc',group};
  document.documentElement.dataset.era=era;document.documentElement.dataset.mode=mode;document.documentElement.dataset.group=group;
  document.querySelectorAll('.era-content').forEach(view=>{view.hidden=!(view.dataset.era===era&&view.dataset.mode===mode)});
  document.querySelectorAll('[data-era-target]').forEach(link=>{
   if(link.dataset.eraTarget===era)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
   link.href=`${base}?era=${link.dataset.eraTarget}&mode=${mode}&group=${group}`;link.dataset.ready='true';
  });
  document.querySelectorAll('[data-mode-target]').forEach(link=>{
   if(link.dataset.modeTarget===mode)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
   link.href=`${base}?era=${era}&mode=${link.dataset.modeTarget}&group=${group}`;link.dataset.ready='true';
  });
  document.querySelectorAll('.group-switch [data-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===group)));
  const activeTable=tables.find(table=>table.dataset.mode===mode);
  if(era==='wz2'&&activeTable)drawTable(activeTable);
 document.querySelectorAll('.leaderboard td[data-value=""]').forEach(cell=>cell.tabIndex=0);
 document.querySelectorAll('.br-time-note').forEach(note=>{note.hidden=!(era==='wz2'&&mode==='br'&&group!=='eliminations');});
 updateOverlays();
  const title=document.querySelector(`.era-content[data-era="${era}"][data-mode="${mode}"] h1`);
  if(title)document.title=title.textContent+' · Warzone Stats';
  const params=new URLSearchParams({era,mode,group,sort:sort[mode].key,dir:sort[mode].dir});
  if(!path)history.replaceState(null,'',`${base}?${params}#${era}-${mode}`);
  try{localStorage.setItem(KEY,JSON.stringify(window.warzoneState));}catch(_){}
  updateOverlays();
  document.documentElement.dataset.appReady='true';
 }
 window.addEventListener('resize',updateOverlays);
 document.querySelectorAll('.leaderboard-scroll').forEach(frame=>frame.addEventListener('scroll',updateOverlays,{passive:true}));
 document.querySelectorAll('[data-era-target],[data-mode-target]').forEach(link=>link.addEventListener('click',event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const target=new URL(link.href,location.origin);
  if(path){event.preventDefault();location.href=`${base}${target.search}`;return;}
  event.preventDefault();
  if(link.dataset.eraTarget)era=link.dataset.eraTarget;
  if(link.dataset.modeTarget)mode=link.dataset.modeTarget;
  const linkQuery=target.searchParams;
  if(linkQuery.has('group')&&linkQuery.get('group')!==group)group=linkQuery.get('group');
  if(linkQuery.has('sort'))sort[mode]={key:linkQuery.get('sort'),dir:linkQuery.get('dir')==='asc'?'asc':'desc',group};
  applyState();
 }));
 document.querySelectorAll('.group-switch [data-group]').forEach(button=>button.addEventListener('click',()=>{
  group=button.dataset.group;
  const sortKey=defaultSort[group];
  const direction='desc';
  sort[mode]={key:sortKey,dir:direction,group};
  window.warzoneState.group=group;
  applyState();
 }));
 document.querySelectorAll('table.leaderboard th[data-key] button').forEach(button=>button.addEventListener('click',()=>{
  const boardMode=button.closest('table').dataset.mode,key=button.closest('th').dataset.key,current=sort[boardMode];
  if(current.key===key)current.dir=current.dir==='desc'?'asc':'desc';
  else current.key=key,current.dir=key==='name'||key==='avgPlacement'?'asc':'desc';
  current.group=group;
  applyState();
 }));
applyState();
})();
