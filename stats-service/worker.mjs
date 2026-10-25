const SITE='https://kaigong-loki.pages.dev';
export const dayAt=(now=Date.now())=>new Date(now+8*3600000).toISOString().slice(0,10);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validVisit(data,day){return data&&Object.keys(data).sort().join(',')==='day,event,visitor'&&data.day===day&&uuid.test(data.visitor)&&uuid.test(data.event);}
function json(data,status=200,write=false){return Response.json(data,{status,headers:{'Access-Control-Allow-Origin':write?SITE:'*','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
async function digest(s){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export default {
 async fetch(request,env,ctx){
  const path=new URL(request.url).pathname,day=dayAt();
  if(path!=='/stats'&&path!=='/visit')return json({error:'not_found'},404);
  if(request.method==='OPTIONS'&&path==='/visit'){
   if(request.headers.get('Origin')!==SITE)return json({error:'origin'},403);
   return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':SITE,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'}});
  }
  const read=request.method==='GET'&&path==='/stats',write=request.method==='POST'&&path==='/visit';
  if(!read&&!write)return json({error:'method'},405);
  if(write&&request.headers.get('Origin')!==SITE)return json({error:'origin'},403);
  // Per-edge rate limit; CORS alone is not authentication or bot protection.
  if(!(await env.LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'})).success)return json({error:'rate_limited'},429,write);
  try{
   if(read){
    const key=new Request(new URL('/cached/'+day,request.url));
    const cached=await caches.default.match(key);if(cached)return cached;
    const row=await env.DB.prepare('SELECT uv,pv FROM daily WHERE day=?').bind(day).first();
    const total=await env.DB.prepare('SELECT uv,pv FROM totals WHERE id=1').first();
    const response=json({day,timezone:'Asia/Shanghai',uv:row?.uv||0,pv:row?.pv||0,totalUv:total?.uv||0,totalPv:total?.pv||0});
    const cache=response.clone();cache.headers.set('Cache-Control','public, max-age=30');ctx.waitUntil(caches.default.put(key,cache));return response;
   }
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'content_type'},415,true);
   // Read a bounded stream even if Content-Length is absent or incorrect.
   const reader=request.body?.getReader();if(!reader)return json({error:'body'},400,true);
   let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>512){await reader.cancel();return json({error:'too_large'},413,true);}chunks.push(value);}
   const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
   let data;try{data=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'json'},400,true);}
   if(!validVisit(data,day))return json({error:'invalid_visit',day},400,true);
   const visitor=await digest('kaigong:'+data.visitor);
   await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO all_visitors(visitor) VALUES(?)').bind(visitor),
    env.DB.prepare('INSERT OR IGNORE INTO visitors(day,visitor) VALUES(?,?)').bind(day,visitor),
    env.DB.prepare('INSERT OR IGNORE INTO events(day,event) VALUES(?,?)').bind(day,data.event)
   ]);
   return json({ok:true,day},200,true);
  }catch{return json({error:'unavailable'},503,write);}
 },
 async scheduled(event,env,ctx){
  // Keep daily aggregates, discard anonymous deduplication rows after three days.
  const cutoff=dayAt(Date.now()-3*86400000);
  ctx.waitUntil(env.DB.batch([env.DB.prepare('DELETE FROM visitors WHERE day<?').bind(cutoff),env.DB.prepare('DELETE FROM events WHERE day<?').bind(cutoff)]));
 }
};
