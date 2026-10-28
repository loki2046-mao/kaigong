import {PROP_RECTS} from './atlas-art.mjs?v=reward60';
import {paintMechanism} from './mechanism-art.mjs?v=art7';
import {lanternFall} from './camp-effects.mjs';
const atlas=typeof Image!=='undefined'?new Image():null,straw=typeof Image!=='undefined'?new Image():null;
if(atlas)atlas.src=new URL('./art/camp-props-v1.webp',import.meta.url).href;
if(straw)straw.src=new URL('./art/target-straw-v2.webp',import.meta.url).href;
const rects=PROP_RECTS;
function sprite(g,key,x,y,w,h){if(!atlas?.complete||!atlas.naturalWidth)return false;g.drawImage(atlas,...rects[key],x-w/2,y-h/2,w,h);return true;}
const line=(g,x,y,a,b,w=3)=>{g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(a,b);g.stroke();};
export function paintCampTarget(kind,bodyHit=false,targetY=442,mechanism={}){return(g,{x,y,radius:r,base,arrived,hit,impactAge,reduced})=>{
 const broken=arrived&&hit,t=Math.max(0,impactAge);g.save();g.strokeStyle='#806044';
 if(kind==='flagcord'){
 paintMechanism(g,{kind:'flag',x,y:y+55,radius:30,base,broken,age:t,open:broken,reduced,straw});
 if(!broken){g.strokeStyle='#ffe3a0';line(g,x,y-35,x,y+10,3);g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();line(g,x-5,y-5,x+5,y+5,4);line(g,x+5,y-5,x-5,y+5,4);}
 }else if(['latch','gate','flag'].includes(kind)){
 paintMechanism(g,{kind,x,y,radius:r,base,broken,age:t,open:mechanism.open,reduced,straw});
 }else if(kind==='rope'){
 line(g,x-65,base,x-65,y-80,9);line(g,x-65,y-80,x+18,y-80,7);g.strokeStyle='#d1ba8c';line(g,x,y-80,x,y-8);
 const fall=lanternFall(targetY,t,reduced);g.save();g.translate(x,broken?fall.y:y+58);if(bodyHit&&arrived&&!reduced)g.rotate(Math.sin(t*25)*.15*Math.exp(-t*4));
 if(broken&&fall.landed)sprite(g,'ropeBroken',0,0,85,62);else sprite(g,'rope',0,0,66,88);g.restore();
 if(!broken){g.strokeStyle='#fff0a2';g.lineWidth=2;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();line(g,x-6,y-7,x+6,y+7,4);line(g,x+6,y-7,x-6,y+7,4);}
 }else{
 line(g,x-26,base,x-16,y+r,6);line(g,x+26,base,x+16,y+r,6);line(g,x-38,y+r+4,x+38,y+r+4,7);
 if(kind==='disc'){
 if(straw?.complete&&straw.naturalWidth)g.drawImage(straw,x-r*1.25,y-r*1.25,r*2.5,r*2.5);
 else{g.fillStyle='#b88e57';g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
 }else if(!broken)sprite(g,kind,x,y,r*2.3,r*2.3);
 else{const fall=reduced?1:Math.min(1,t/.48);sprite(g,kind+'Broken',x,y+(base-y-15)*fall,r*(2.3+fall*.7),r*2.1);}
 }
 if(!broken){g.strokeStyle='#fff1b6';line(g,x-5,y,x+5,y,1);line(g,x,y-5,x,y+5,1);}g.restore();
};}
