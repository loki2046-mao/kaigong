import {decree,playerName} from './camp-honors.mjs';

// Render text directly into pixels so downloaded calligraphy is device independent.
export async function saveDecree(p, chapter) {
  const d=decree(p,chapter), name=playerName(p);
  if(!document.querySelector('link[href*="decree-fonts.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./decree-fonts.css',import.meta.url).href;
    await new Promise((resolve,reject)=>{link.onload=resolve;link.onerror=()=>{link.remove();reject(new Error('书法字体载入失败，请重试'));};document.head.append(link);});
  }
  await document.fonts.load('48px DecreeScript',d.body+d.rank+name);
  if(!document.fonts.check('48px DecreeScript',d.body)) throw new Error('书法字体尚未载入，请稍后重试');
  const background=new Image();
  background.src=new URL('./art/decree-gaoshen-v5.webp',import.meta.url).href;
  await background.decode();
  const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1350;
  const ctx=canvas.getContext('2d');ctx.drawImage(background,0,0,2400,1350);
  ctx.fillStyle='#402c20';ctx.textAlign='center';ctx.font='82px DecreeScript';
  ctx.fillText('制书',1200,315);
  ctx.fillStyle='#8f2d1f';ctx.font='68px DecreeScript';ctx.fillText('授 '+d.rank,1200,420);
  ctx.fillStyle='#60472d';ctx.font='32px DecreeScript';ctx.fillText(d.grade+' · 武散阶',1200,480);
  ctx.textAlign='left';ctx.font='44px DecreeScript';
  let y=600;
  for(const paragraph of d.body.split('\n')){
    let line='';
    for(const char of paragraph){
      if(ctx.measureText(line+char).width>1810){ctx.fillText(line,295,y);y+=70;line='';}
      line+=char;
    }
    if(line){ctx.fillText(line,295,y);y+=80;}
  }
  ctx.font='28px DecreeScript';ctx.fillText('开弓 · 军功录　　第 '+(chapter+1)+' 卷',295,1040);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('图片生成失败，请重试');
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='开弓-第'+(chapter+1)+'卷-'+d.rank+'.png';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
