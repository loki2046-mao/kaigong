// This module never reads a character profile or game save.
const API='/api/visits';
export const visitDay=(now=Date.now())=>new Date(now+8*3600000).toISOString().slice(0,10);
export function dailyVisitor(storage,day,uuid=()=>crypto.randomUUID()){
 let saved;try{saved=JSON.parse(storage.getItem('kg-visitor-v1'));}catch{}
 if(saved&&typeof saved.id==='string'&&/^[0-9a-f-]{36}$/i.test(saved.id))return saved.id;
 const id=uuid();try{storage.setItem('kg-visitor-v1',JSON.stringify({day,id}));}catch{}return id;
}
if(typeof document!=='undefined'){
 const footer=document.querySelector('.credits');
 if(footer){
  const panel=document.createElement('details'),summary=document.createElement('summary'),note=document.createElement('p');
  panel.className='visit-stats';summary.textContent='今日访客 — · 浏览 — ｜ 累计访客 — · 浏览 —';
  note.textContent='今日按北京时间统计，累计从统计功能上线开始保留。两项访客均按匿名浏览器标识去重，浏览为页面打开次数，不代表开局人数；换设备、清理浏览器数据或拦截统计会影响结果。仅记录匿名访问标识，不上传姓名或存档。';
  panel.append(summary,note);footer.prepend(panel);
  if(location.hostname!=='kaigong-loki.pages.dev'){summary.textContent='访问统计仅正式站记录';}
  else{
   let recordedDay='',eventDay='',eventId='',busy=false;
   const request=(path,options={})=>fetch(API+path,{...options,credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});
   async function refresh(){
    if(busy||document.hidden)return;busy=true;
    try{
     const day=visitDay();
     if(recordedDay!==day){
      const id=()=>dailyVisitor(localStorage,day);
      if(eventDay!==day){eventDay=day;eventId=crypto.randomUUID();}
      const visitor=navigator.locks?await navigator.locks.request('kg-visit-id',id):id();
      const response=await request('/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({day,visitor,event:eventId})});
      if(!response.ok)throw Error('stats unavailable');recordedDay=day;
     }
     const response=await request('/stats');if(!response.ok)throw Error('stats unavailable');const data=await response.json();
     if(data.day!==visitDay()||!Number.isSafeInteger(data.uv)||!Number.isSafeInteger(data.pv)||!Number.isSafeInteger(data.totalUv)||!Number.isSafeInteger(data.totalPv))throw Error('invalid stats');
     summary.replaceChildren();for(const label of [`今日访客 ${data.uv.toLocaleString()} · 浏览 ${data.pv.toLocaleString()}`,`累计访客 ${data.totalUv.toLocaleString()} · 浏览 ${data.totalPv.toLocaleString()}`]){const line=document.createElement('span');line.textContent=label;summary.append(line);}
    }catch{summary.textContent='访问统计暂不可用';}finally{busy=false;}
   }
   // No render-loop work, no blocking game startup. Hidden tabs do not poll.
   setTimeout(refresh,1500);setInterval(refresh,60000);document.addEventListener('visibilitychange',refresh);
  }
 }
}
