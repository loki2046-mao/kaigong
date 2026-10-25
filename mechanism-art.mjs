// Separate frame, sliding gate and folding flag layers keep openings truly transparent.
const sheet=typeof Image!=='undefined'?new Image():null;
if(sheet)sheet.src=new URL('./art/mechanisms-v1.webp',import.meta.url).href;
export function paintMechanism(g,{kind,x,y,radius:r,base,broken,age,open,reduced,straw}){
 const cy=kind==='latch'?y+33.6:y,top=cy-130,bottom=base+4,height=bottom-top;
 const ready=sheet?.complete&&sheet.naturalWidth;
 const layer=(rect,dx,dy,w,h)=>{if(ready)g.drawImage(sheet,...rect,dx,dy,w,h);};
 const lift=kind==='gate'?1:kind==='latch'&&broken?(reduced?1:Math.min(1,age/.7)):0;
 // Ground contact shadow anchors the large timber structure in the courtyard.
 g.save();g.fillStyle='#30271b30';g.beginPath();g.ellipse(x,bottom,91,7,0,0,Math.PI*2);g.fill();
 if(kind!=='latch'&&straw?.complete&&straw.naturalWidth)g.drawImage(straw,x-r*1.2,y-r*1.2,r*2.4,r*2.4);
 g.save();g.beginPath();g.rect(x-57,top+63,114,height-65);g.clip();
 if(kind==='flag'){
 const width=open?12:58;
 layer([1120,215,400,700],x-57,top+63,width,height-65);
 g.save();g.translate(x+57,0);g.scale(-1,1);layer([1120,215,400,700],0,top+63,width,height-65);g.restore();
 }else layer([650,215,405,680],x-58,top+63-lift*(height-35),116,height-63);
 g.restore();
 layer([0,0,640,1005],x-118,top,236,height);
 if(kind==='latch'){
 g.strokeStyle='#d7bd84';g.lineWidth=2;g.beginPath();g.moveTo(x,top+32);g.lineTo(x,broken?top+65:y);g.stroke();
 if(!broken){g.strokeStyle='#ffe4a2';g.lineWidth=3;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();g.lineWidth=5;g.beginPath();g.moveTo(x-6,y-7);g.lineTo(x+6,y+7);g.moveTo(x+6,y-7);g.lineTo(x-6,y+7);g.stroke();}
 }
 g.restore();
}
