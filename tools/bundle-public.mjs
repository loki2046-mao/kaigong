import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function bundlePublic(out){
 const built=new Map();
 async function bundle(src){
  src=src.split('?')[0];if(built.has(src))return built.get(src);
  const result=await build({entryPoints:[fileURLToPath(new URL(src,out))],bundle:true,write:false,format:'esm',target:'es2022',minify:true});
  const bytes=result.outputFiles[0].contents,hash=createHash('sha256').update(bytes).digest('hex').slice(0,12),name=src.replace('.mjs','')+'.'+hash+'.mjs';
  await writeFile(new URL(name,out),bytes);built.set(src,name);return name;
 }
 const boot=await readFile(new URL('../boot.js',import.meta.url)),bootName='boot.'+createHash('sha256').update(boot).digest('hex').slice(0,12)+'.js';await writeFile(new URL(bootName,out),boot);
 for(const name of await readdir(out))if(name.endsWith('.html')){
  let html=await readFile(new URL(name,out),'utf8');const scripts=[...html.matchAll(/<script type="module" src="([^"]+)"><\/script>/g)];if(!scripts.length)continue;
  const files=await Promise.all(scripts.map(m=>bundle(m[1])));
  for(const m of scripts)html=html.replace(m[0],'');
  html+=`<script defer src="${bootName}" data-game-entry="${files[0]}"${files[1]?` data-extra-entry="${files[1]}"`:''}></script>`;
  await writeFile(new URL(name,out),html);
 }
 console.log('Bundled public entries:',built.size);
}
