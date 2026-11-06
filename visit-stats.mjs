// This module never reads a character profile or game save.
const HOSTS=new Set(['kaigong-loki.pages.dev','kaigong.hiloki.cn']);
// Both production hosts expose the same-origin statistics gateway.
function apiBase(){return HOSTS.has(location.hostname)?'/api/visits':'';}
export function visitorUUID(){if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
export const visitDay=(now=Date.now())=>new Date(now+8*3600000).toISOString().slice(0,10);
export function dailyVisitor(storage,day,uuid=visitorUUID){
 let saved;try{saved=JSON.parse(storage.getItem('kg-visitor-v1'));}catch{}
 if(saved&&typeof saved.id==='string'&&/^[0-9a-f-]{36}$/i.test(saved.id))return saved.id;
 const id=uuid();try{storage.setItem('kg-visitor-v1',JSON.stringify({day,id}));}catch{}return id;
}
export const STATS_CACHE='kg-stats-cache-v1';
export function cachedStats(storage){try{return JSON.parse(storage.getItem(STATS_CACHE))}catch{return null}}
export function validCounts(data){return data&&['uv','pv','totalUv','totalPv'].every(k=>Number.isSafeInteger(data[k])&&data[k]>=0)}
if(typeof document!=='undefined'){
 const footer=document.querySelector('.credits');
 if(footer){
  const panel=document.createElement('details'),summary=document.createElement('summary'),note=document.createElement('p');
  panel.className='visit-stats';summary.textContent='今日访客 — · 浏览 — ｜ 累计访客 — · 浏览 —';
  note.textContent='今日按北京时间统计，累计从统计功能上线开始保留。两项访客均按匿名浏览器标识去重，浏览为页面打开次数，不代表开局人数；换设备、清理浏览器数据或拦截统计会影响结果。仅记录匿名访问标识，不上传姓名或存档。';
  panel.append(summary,note);footer.prepend(panel);
  const saveNote=document.createElement('p');
  saveNote.className='save-region-note';
  saveNote.textContent='存档提示：进度保存在当前设备的当前浏览器中。国内版与海外版存档独立；更换入口前，请在「档案」中导出存档，再到另一入口导入。清理浏览器数据可能导致进度丢失，请定期备份。';
  saveNote.style.cssText='max-width:680px;margin:10px auto 0;font-size:12px;line-height:1.7;opacity:.85;text-align:center;white-space:normal';
  footer.append(saveNote);
  const base=apiBase();
  if(!HOSTS.has(location.hostname)||!base){summary.textContent='访问统计仅正式站记录';}
  else{
   let recordedDay='',eventDay='',eventId='',busy=false;
   let hasStats=false;let visitorId;let recordBusy=false;
   const render=(data,cached=false)=>{if(!validCounts(data))return;hasStats=true;summary.replaceChildren();for(const label of [`${data.day===visitDay()?'今日':'最近同步日'}访客 ${data.uv.toLocaleString()} · 浏览 ${data.pv.toLocaleString()}`,`累计访客 ${data.totalUv.toLocaleString()} · 浏览 ${data.totalPv.toLocaleString()}${cached||data.stale?' · 待同步':''}`]){const line=document.createElement('span');line.textContent=label;summary.append(line);}};
   try{render(cachedStats(localStorage),true)}catch{}
   const request=async(path,options={})=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{return await fetch(base+path,{...options,credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});}finally{clearTimeout(timer)}};
   async function refresh(){
    if(busy||document.hidden)return;busy=true;
    try{
     const day=visitDay();
     // Reading public counts does not depend on storage or a successful write.
     const record=async()=>{try{if(recordedDay===day||recordBusy)return;recordBusy=true;
      if(!visitorId){try{visitorId=dailyVisitor(localStorage,day)}catch{visitorId=visitorUUID()}}
      if(eventDay!==day){eventDay=day;eventId=visitorUUID()}
      const response=await request('/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({day,visitor:visitorId,event:eventId})});
      if(response.ok)recordedDay=day;
     }catch{}finally{recordBusy=false}};void record();
     const response=await request('/stats');if(!response.ok)throw Error('stats unavailable');const data=await response.json();
     if(!validCounts(data)||!/^\d{4}-\d{2}-\d{2}$/.test(data.day))throw Error('invalid stats');
     render(data);try{localStorage.setItem(STATS_CACHE,JSON.stringify(data))}catch{}
    }catch{if(!hasStats)summary.textContent='统计连接较慢，稍后重试 · 不影响游戏';}finally{busy=false;}
   }
   // No render-loop work, no blocking game startup. Hidden tabs do not poll.
   setTimeout(refresh,1500);setTimeout(refresh,5000);setTimeout(refresh,16000);setTimeout(refresh,32000);window.addEventListener('online',refresh);setInterval(refresh,60000);document.addEventListener('visibilitychange',refresh);
  }
 }
}
