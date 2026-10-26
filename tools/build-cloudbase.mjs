// Build a provider-neutral static upload bundle for CloudBase.
// Domestic site uses the public Cloudflare Worker stats API (absolute URL in visit-stats.mjs).
import{cp,mkdir,rm,writeFile,readFile}from'node:fs/promises';
import{execFileSync}from'node:child_process';
const root=new URL('../',import.meta.url),out=new URL('../release/cloudbase/',import.meta.url);
execFileSync(process.execPath,['tools/build-public.mjs'],{cwd:root,stdio:'inherit'});
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(new URL('release/public/',root),out,{recursive:true});
for(const file of ['_worker.js','_routes.json','_headers'])await rm(new URL(file,out),{force:true});
// Keep visit-stats.mjs as built: dual-host + absolute Worker API for hiloki.cn. Do not rewrite copy.
const client=await readFile(new URL('visit-stats.mjs',out),'utf8');
if(client.includes('访问统计迁移中'))throw new Error('CloudBase bundle must not contain migration stub text');
if(client.includes('__SUBDOMAIN__'))throw new Error('Set PUBLIC_STATS_BASE workers.dev subdomain before building CloudBase zip');
execFileSync('zip',['-q','-r','../kaigong-cloudbase-static.zip','.'],{cwd:out});
console.log('Created release/kaigong-cloudbase-static.zip (dual-domain stats client included).');
