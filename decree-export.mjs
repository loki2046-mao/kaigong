import {decree,playerName} from './camp-honors.mjs';

// Render text directly into pixels so downloaded calligraphy is device independent.
export async function saveDecree(p, chapter) {
  const d=decree(p,chapter), name=playerName(p);
  if(!document.querySelector('link[href*="decree-fonts.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./decree-fonts.css',import.meta.url).href;
    await new Promise((resolve,reject)=>{link.onload=resolve;link.onerror=()=>{link.remove();reject(new Error('书法字体载入失败，请重试'));};document.head.append(link);});
  }
  await Promise.all(['DecreeScript','DecreeRare'].map(font=>document.fonts.load('48px '+font,d.body+d.rank+name)));
  if(!document.fonts.check('48px DecreeScript',d.body)) throw new Error('书法字体尚未载入，请稍后重试');
  const background=new Image();
  background.src=new URL('./art/decree-gaoshen-v5.webp',import.meta.url).href;
  await background.decode();
  const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1350;
  const ctx=canvas.getContext('2d');ctx.drawImage(background,0,0,2400,1350);
  ctx.textAlign='center';ctx.textBaseline='middle';
  const column=(text,x,y,font,step,color='#402c20')=>{ctx.fillStyle=color;ctx.font=font+'px DecreeScript, DecreeRare';for(const char of text){ctx.fillText(char,x,y);y+=step;}};
  column('制书',2050,340,80,100,'#8f2d1f');
  // Fixed, right-to-left columns retain the on-screen calligraphic composition.
  const lines=[];for(const paragraph of d.body.split('\n')){const chars=Array.from(paragraph);while(chars.length)lines.push(chars.splice(0,13).join(''));}
  const spacing=Math.min(100,1100/Math.max(1,lines.length-1));
  for(const [index,line] of lines.entries())column(line,1870-index*spacing,325,43,53);
  column(d.rank,650,520,62,74);
  column(d.grade+'·武散阶',555,525,28,38,'#60472d');
  const nameSize=Math.min(43,510/Math.max(1,Array.from(name).length));
  column(name,415,350,nameSize,nameSize*1.12);
  ctx.fillStyle='#8f2d1f';ctx.strokeStyle='#8f2d1f';ctx.lineWidth=3;ctx.strokeRect(340,950,105,105);ctx.lineWidth=1;ctx.strokeRect(347,957,91,91);
  column('开弓',411,980,31,38,'#8f2d1f');column('拟制',373,980,31,38,'#8f2d1f');
  ctx.fillStyle='#60472d';ctx.font='24px DecreeScript, DecreeRare';ctx.textAlign='left';ctx.fillText('开弓 · 军功录　　第 '+(chapter+1)+' 卷',750,1035);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('图片生成失败，请重试');
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='开弓-第'+(chapter+1)+'卷-'+d.rank+'.png';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
