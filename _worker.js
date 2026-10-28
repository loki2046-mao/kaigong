// Pages service-binding proxy. Production hostname only: preview/custom domains get 403
// (use the public workers.dev Worker for CloudBase / hiloki.cn cross-origin stats).
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/visits/'))return env.ASSETS.fetch(request);
  if(url.hostname!=='kaigong-loki.pages.dev')return new Response('Production statistics only',{status:403});
  const route=url.pathname.slice('/api/visits'.length);
  if(!['/stats','/visit','/experience','/experience-stats'].includes(route))return new Response('Not found',{status:404});
  try{
   const internal=new URL('https://stats.internal'+route);
   return await env.STATS.fetch(new Request(internal,request));
  }catch{return Response.json({error:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
 }
};
