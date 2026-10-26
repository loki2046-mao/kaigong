import { targetState, riderOffset, femaleTierFor } from './engine.mjs?v=oct25-polish3';
const INK='#654a35', RED='#bd6952', GOLD='#edc460';
const assetRoot=typeof location!=='undefined'&&location.pathname.includes('/tools/')?'../':'./';
function loadAsset(name){if(typeof Image==='undefined')return null;const im=new Image();im.src=assetRoot+'art/'+name;return im;}
const characterAssets=new Map();function characterAsset(name){if(!characterAssets.has(name))characterAssets.set(name,loadAsset(name));return characterAssets.get(name)}

const backgrounds=new Map();function fieldAsset(theme){if(!theme||theme==='autumn')return backdrop;const name='camp-'+theme+'-v4.webp';if(!backgrounds.has(name))backgrounds.set(name,loadAsset(name));return backgrounds.get(name);}
const atlas=loadAsset('archer-cast-v2.webp'),backdrop=loadAsset('camp-autumn-v2.webp'),targetArt=loadAsset('target-straw-v2.webp');
// Source rectangles preserve separate identities and never change NPC on a hit.
const sprites=[[0,0,384,508],[384,0,392,508],[776,0,380,516],[1156,0,380,516],[0,512,384,512],[384,512,384,512],[768,520,384,504],[1152,520,384,504]];
export function line(g,x,y,a,b,c=INK,w=3){g.beginPath();g.moveTo(x,y);g.lineTo(a,b);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.stroke()}
export function text(g,s,x,y,size=20,c=INK){g.fillStyle=c;g.font=`400 ${size}px KaigongDisplay, serif`;g.fillText(s,x,y)}
function oval(g,x,y,rx,ry,c){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill()}
function sprite(g,n,x,y,h,tilt=0,character='male',released=false,tier=1){const staged=character==='female'&&n<4;const recruitAtlas=staged&&tier===0?characterAsset('recruit-female-v1.webp'):null,silverAtlas=staged&&tier===2?characterAsset('silver-female-v1.webp'):null,femaleAtlas=staged&&tier===1?characterAsset('general-female-v2.webp'):null,releaseAtlas=released&&!staged?characterAsset('archer-release-v1.webp'):null;const sheet=staged?(tier===2?silverAtlas:tier===1?femaleAtlas:recruitAtlas):released&&releaseAtlas?.complete&&releaseAtlas.naturalWidth?releaseAtlas:character==='female'&&n<4?femaleAtlas:atlas;if(!sheet?.complete||!sheet.naturalWidth)return;let rect=sprites[n];if(staged){const cell=(n>=2?3:0)+(released?2:n%2),w=sheet.naturalWidth/3,h=sheet.naturalHeight/2;rect=[cell%3*w,Math.floor(cell/3)*h,w,h];}if(!staged&&sheet===releaseAtlas){const halfW=sheet.naturalWidth/2,halfH=sheet.naturalHeight/2;const cell=sheet===releaseAtlas?(n>=2?2:0)+(character==='female'?1:0):n;rect=[cell%2*halfW,Math.floor(cell/2)*halfH,halfW,halfH];}if(staged&&tier===0&&n<2)rect[3]=490;
if(!staged&&!released&&n===2)rect=[748,0,404,520];
if(staged&&tier===0&&n>=2){const col=released?2:n%2;rect=[col*512,498,col===2?512:548,526];}
if(staged&&tier===2&&n<2&&released)rect=[1004,0,532,512];
if(staged&&tier===2&&n===2&&!released)rect[2]*=540/512;const [sx,sy,sw,sh]=rect,w=h*(sheet===releaseAtlas&&character!=='female'?(n>=2?380/516:392/508):sw/sh);g.save();g.translate(x,y);g.rotate(tilt);
// The silver draw pose spills across its atlas cell: exclude the neighbouring
// idle horse's muzzle (left) and release pose's tail (lower right).
if(staged&&tier===2&&n>=2&&!released){
 const idle=n===2;
 const outline=idle?[[0,0],[512,0],[512,120],[540,120],[540,280],[512,290],[512,512],[0,512]]:[[0,0],[512,0],[512,280],[495,300],[495,512],[0,512],[0,290],[28,280],[28,120],[0,120]];
 g.beginPath();outline.forEach(([px,py],i)=>g[i?'lineTo':'moveTo'](-w/2+px/(idle?540:512)*w,-h+py/512*h));g.closePath();g.clip();
}
// New recruit mounted heads and bow tips also cross the nominal grid.
if(staged&&tier===0&&n>=2){
 const col=released?2:n%2;
 const points=col===0?[[0,0],[512,0],[512,120],[548,120],[548,292],[512,302],[512,526],[0,526]]:
 col===1?[[0,0],[512,0],[512,135],[548,135],[548,292],[512,302],[512,526],[0,526],[0,302],[44,292],[44,120],[0,120]]:
 [[0,0],[512,0],[512,526],[34,526],[34,440],[0,435],[0,305],[36,292],[36,135],[0,135]];
 g.beginPath();points.forEach(([px,py],i)=>g[i?'lineTo':'moveTo'](-w/2+px/sw*w,-h+py/sh*h));g.closePath();g.clip();
}
if(staged&&tier===2&&n<2){
 const points=released?[[20,0],[532,0],[532,512],[0,512],[0,280],[20,270]]:n===0?[[0,0],[512,0],[512,330],[504,340],[504,512],[0,512]]:[[0,0],[512,0],[512,275],[492,290],[492,430],[512,440],[512,512],[0,512]];
 g.beginPath();points.forEach(([px,py],i)=>g[i?'lineTo':'moveTo'](-w/2+px/sw*w,-h+py/sh*h));g.closePath();g.clip();
}
if(!staged&&!released&&n<3){
 const points=n===0?[[0,0],[384,0],[384,155],[334,155],[334,230],[384,230],[384,508],[0,508]]:
 n===1?[[0,0],[392,0],[392,250],[360,250],[360,508],[0,508]]:
 [[0,0],[404,0],[404,520],[0,520],[0,235],[32,230],[32,180],[0,175]];
 g.beginPath();points.forEach(([px,py],i)=>g[i?'lineTo':'moveTo'](-w/2+px/sw*w,-h+py/sh*h));g.closePath();g.clip();
}
if(staged&&tier===2&&n===1&&!released){
 // Lower-row bow tip occupies the gap between this pose's boots.
 g.beginPath();[[0,0],[512,0],[512,512],[390,512],[390,493],[330,493],[330,512],[0,512]].forEach(([px,py],i)=>g[i?'lineTo':'moveTo'](-w/2+px/sw*w,-h+py/sh*h));g.closePath();g.clip();
}
if(!staged&&sheet===releaseAtlas&&n<2){
 g.beginPath();[[0,0],[1,0],[1,1],[.78,1],[.78,.96],[.66,.96],[.66,1],[0,1]].forEach(([px,py],i)=>g[i?'lineTo':'moveTo'](-w/2+px*w,-h+py*h));g.closePath();g.clip();
}
if(!staged&&sheet===releaseAtlas&&n>=2){g.beginPath();[[0,0],[1,0],[1,.46],[.97,.46],[.97,1],[0,1]].forEach(([px,py],i)=>g[i?'lineTo':'moveTo'](-w/2+px*w,-h+py*h));g.closePath();g.clip();}
g.drawImage(sheet,sx,sy,sw,sh,-w/2,-h,w,h);g.restore()}
// A single trajectory supplies both arrow position and its tangent.
export function arrowPose(from,shot,age,hit,floor=Infinity){
 const duration=Math.max(.01,shot.flight),k=Math.max(0,age/duration),dx=shot.x-from.x,dy=shot.y-from.y;
 const bend=Math.max(8,Math.min(32,Math.abs(dx)*.045));
 let q=hit?Math.min(1,k):k;let grounded=false;if(!hit&&Number.isFinite(floor)){const root=(-(dy-bend)+Math.sqrt((dy-bend)**2+4*bend*Math.max(0,floor-from.y)))/(2*bend);if(q>=root){q=root;grounded=true;}}
 const x=from.x+dx*q,y=from.y+dy*q+bend*(q*q-q);
 return {x,y,angle:Math.atan2(dy+bend*(2*q-1),dx),arrived:k>=1,grounded};
}
function paintArrow(g,x,y,angle,{embedded=false,age=0,reduced=false,trail=false}={}){
 g.save();g.translate(x,y);g.rotate(angle);
 // The head disappears inside straw; the tail damps rapidly around a fixed contact point.
 if(embedded&&!reduced)g.rotate(Math.sin(age*82)*.055*Math.exp(-age*13));
 if(trail){g.save();g.globalAlpha=.19;line(g,-100,0,-34,0,'#fff2cc',3);g.restore();}
 line(g,-61,0,embedded?-5:-7,0,'#5d3923',2.8);line(g,-59,-.8,-8,-.8,'#c7a06b',.8);
 if(!embedded){g.beginPath();g.moveTo(0,0);g.lineTo(-10,-3);g.lineTo(-8,0);g.lineTo(-10,3);g.closePath();g.fillStyle='#c5ccca';g.fill();}
 for(const side of [-1,1]){g.beginPath();g.moveTo(-59,0);g.lineTo(-66,side*5);g.lineTo(-48,side*4);g.lineTo(-43,0);g.closePath();g.fillStyle='#a34834';g.fill();}
 g.restore();
}
function hill(g,y,color,phase){g.beginPath();g.moveTo(0,720);g.lineTo(0,y);g.bezierCurveTo(240,y-65+phase,380,y+32,550,y-15);g.bezierCurveTo(760,y-65,870,y+20,1000,y-25);g.lineTo(1000,720);g.closePath();g.fillStyle=color;g.fill()}
// Shared ink and sprite silhouettes keep each chapter in the same illustrated world.
const FIELD_PALETTES=[
 ['#eaf3ee','#d6e4ce','#bfd3b5','#e4e5c6','#f3ead4'],
 ['#eef0e5','#d9dfbd','#bbcba7','#dfddbb','#efe4c9'],
 ['#e8f2e9','#c8dfcd','#a9c6ae','#dce2bd','#efe8ce'],
 ['#e9eff2','#ccdce0','#adc7c9','#d6dfca','#eee6d2'],
 ['#f5eddd','#e1d7b8','#c9c69f','#ded9b3','#f0e3c7'],
 ['#f3e5d5','#dfceb2','#c5b99b','#ddd0b3','#ebdcc2'],
 ['#e6edf1','#c7d7dd','#a8bec5','#d4dbce','#ebe2cf'],
 ['#e8eee2','#cad8bf','#a4bd9d','#d6dcbb','#ece6cc'],
 ['#edf3f4','#d9e4e4','#c0d4d7','#e4e9df','#f4f1e7'],
 ['#f4e8d9','#dfd3b6','#c8bd9c','#e0d7b6','#f1e4c9']
];
export function fieldTransform(ratio,fit=false){const zoom=fit?Math.min(1,1.22/ratio):1,sy=ratio*zoom;return {x:500*(1-zoom),y:Math.min(535*(1-sy),704-690*sy),sx:zoom,sy};}
export function drawScene(g,f){
 const {power=0,outcome=null,age=0,home=false}=f;
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const t=reduced?0:f.t||0,s=f.shapeScale||1,base=535;
 const palette=FIELD_PALETTES[f.bow?.chapter||0];
 g.save();g.clearRect(0,0,1000,720);g.fillStyle=palette[0];g.fillRect(0,0,1000,720);
 oval(g,775,95,28,28,'#f8edbd');
 for(let i=0;i<3;i++){const x=100+i*355+Math.sin(t*.06+i)*25,y=95+i%2*90;oval(g,x,y,58,9,'#fbfcf5');oval(g,x-15,y-7,26,12,'#fbfcf5')}
 hill(g,340,palette[1],0);hill(g,375,palette[2],30);hill(g,423,palette[3],0);hill(g,480,palette[4],15);
 const sceneBackdrop=fieldAsset(f.theme),bg=sceneBackdrop?.complete&&sceneBackdrop.naturalWidth?sceneBackdrop:backdrop;
 if(bg?.complete&&bg.naturalWidth){
   const iw=bg.naturalWidth,ih=bg.naturalHeight||iw/1.5,ratio=1000/720*s;
   let sw=iw,sh=ih;if(iw/ih>ratio)sw=ih*ratio;else sh=iw/ratio;
   g.drawImage(bg,(iw-sw)/2,(ih-sh)/2,sw,sh,0,0,1000,720);
   if(!f.theme&&f.bow?.chapter>=5){g.save();g.fillStyle=f.bow.chapter===8?'rgba(51,81,105,.22)':'rgba(124,49,17,.09)';g.fillRect(0,0,1000,720);g.restore();}
 }
 // Falling leaves drift outside the target corridor; their cadence never signals hit timing.
 if(!reduced&&(!f.theme||f.theme==='autumn')&&f.bow?.chapter!==8)for(let i=0;i<9;i++){
   const lx=(i*143+t*(12+i%3*3))%1040-20,ly=(i*67+t*(8+i%4))%390;
   g.save();g.translate(lx,ly);g.rotate(t*.6+i);g.globalAlpha=.65;oval(g,0,0,3,7,i%2?'#d69937':'#e2b156');g.restore();
 }
 // Snow remains in the distant sky, above arrows and spectators.
 if(f.bow?.chapter===8)for(let i=0;i<18;i++){const sx=(i*137+Math.sin(t*.25+i)*12)%1000,sy=40+(i*53+(reduced?0:t*12))%260;oval(g,sx,sy,2,2,'#ffffff');}
 // Wind pennant follows the same signed gust used by the landing calculation.
 if(f.bow?.wind){const gust=Math.sin((f.draw?.elapsed||0)*1.5+f.bow.phase);line(g,910,170,910,270,'#5b4938',5);g.save();g.fillStyle='#b6533c';g.beginPath();g.moveTo(910,175);g.quadraticCurveTo(910+gust*35,185,910+gust*76,188);g.lineTo(910+gust*62,209);g.quadraticCurveTo(910+gust*25,204,910,198);g.fill();g.restore();}
 const transform=fieldTransform(s,f.fitWorld),worldShift=transform.y;g.translate(transform.x,worldShift);g.scale(transform.sx,transform.sy);
 const b=f.bow,target=targetState(b,f.draw,outcome?Math.min(age,f.shot?.flight||0):0);
 // Both impact and target use this same transform; rings remain faithful to judgement.
 const mapY=y=>base-150+(y-442)*1.05,tx=target.x,ty=mapY(target.y),radius=(b?.radius||44)*1.05;
 const impactAge=age-(f.shot?.flight||.2),arrived=!!outcome&&impactAge>=0,mood=outcome?(arrived?outcome:null):f.crowdMood,cheer=mood==='perfect'||mood==='good',miss=mood&&!cheer;
 const crowd=[[75,666,125],[340,682,139],[725,681,136],[935,669,132]];
 crowd.forEach(([x,y,h],i)=>{
   const hop=reduced?0:cheer?Math.abs(Math.sin(Math.max(0,impactAge)*10+i))*(outcome==='perfect'?12:5):Math.sin(t*1.4+i)*1.2;
   const tilt=reduced?0:miss?Math.sin(t*5+i)*.035:cheer?Math.sin(t*7+i)*.025:Math.sin(t*1.2+i)*.008;
   oval(g,x,y+2,h*.26,5,'#65412733');sprite(g,4+i,x,y-hop,h,tilt);
   if(cheer&&impactAge<.65&&!reduced){text(g,i===2?'♪':'✦',x+32,y-h-6-hop,22,'#fff3bb');}
 });

 const targetKick=arrived&&cheer&&!reduced?Math.sin(impactAge*48)*3*Math.exp(-impactAge*14):0;
 g.save();g.translate(targetKick,0);
 if(f.paintTarget){f.paintTarget(g,{x:tx,y:ty,radius,base,arrived,hit:cheer,impactAge,reduced,shotY:mapY(f.shot?.shotY??target.y)});}else{
 oval(g,tx,base+6,30,5,'#65412744');line(g,tx,ty+radius*.7,tx+radius*.55,base+4,'#8c603b',5);line(g,tx-radius*.35,ty+radius*.65,tx-radius*.85,base+4,'#6e452b',7);line(g,tx+radius*.35,ty+radius*.65,tx+radius*.85,base+4,'#6e452b',7);line(g,tx-radius*.7,base-30,tx+radius*.7,base-30,'#795133',5);
 if(b?.type==='willow'){
   line(g,tx,ty+radius,tx,ty-radius*2,'#65784a',3);oval(g,tx,ty,radius*.44,radius,'#668244');
 }else if(targetArt?.complete&&targetArt.naturalWidth){
   // The generated disc occupies 94% of its source; align that rim with the judgement radius.
   const size=radius*2/.94;g.drawImage(targetArt,tx-size/2,ty-size/2,size,size);
 }else{oval(g,tx,ty,radius*1.12,radius*1.12,'#c7b18b');oval(g,tx,ty,radius,radius,RED);}
 // Fine boundary and gold center make the scoring window unambiguous over painted straw.
 g.save();g.globalAlpha=.4;g.strokeStyle='#fff0c0';g.lineWidth=1.2;g.beginPath();g.arc(tx,ty,radius,0,Math.PI*2);g.stroke();g.restore();
 oval(g,tx,ty,radius*.14,radius*.14,GOLD);
 if(arrived&&cheer&&age-(f.shot?.flight||.2)<.32&&!reduced){const pulse=(age-(f.shot?.flight||.2))/.32;g.save();g.globalAlpha=(1-pulse)*.65;g.strokeStyle=outcome==='perfect'?GOLD:outcome==='good'?RED:'#b6a487';g.lineWidth=3*(1-pulse)+1;g.beginPath();g.ellipse(tx,mapY(f.shot?.shotY??target.y),radius+8+pulse*26,radius+8+pulse*26,0,0,Math.PI*2);g.stroke();g.restore();}
 }
 g.restore();
 const ride=b?.mounted&&!home,bob=ride?riderOffset(b,f.draw?.elapsed||0)*.8:0,h=ride?260:245,x=215,y=base+bob;
 oval(g,x,base+5,ride?69:29,5,'#42302144');const squeeze=!reduced&&!outcome?Math.min(1,power/100)*.035:0;g.save();g.translate(x-(outcome&&!reduced?Math.sin(Math.min(1,age/.14)*Math.PI)*3:0),y);g.scale(1+squeeze*.5,1-squeeze);sprite(g,ride?(!outcome&&power>5?3:2):(!outcome&&power>5?1:0),0,0,h,power>70&&!reduced?Math.sin(t*22)*.012:0,f.character,!!outcome,f.outfitTier??femaleTierFor(f.bow?.index??0));g.restore();
 if(ride)for(let i=0;i<3;i++){const k=(t*1.5+i/3)%1;g.globalAlpha=(1-k)*.25;oval(g,x-58-k*45,base-2-k*8,5+k*8,3+k*3,'#c3b795')}g.globalAlpha=1;
 g.save();g.fillStyle='#f8e9cbdd';g.beginPath();g.roundRect(tx-36,base+16,72,27,6);g.fill();text(g,`${b?.distance||20} 步`,tx-23,base+35,17,'#664a2d');g.restore();
 if(!home&&!outcome&&power>1){g.setLineDash([3,9]);g.globalAlpha=.35;line(g,tx-58,mapY(target.shotY),tx+25,mapY(target.shotY),'#897e65',2);g.setLineDash([]);g.globalAlpha=1}
 if(!home&&!outcome&&f.holding&&power>1){const ly=mapY(target.shotY),aligned=Math.abs(target.shotY-target.y)<=b.radius;g.save();g.strokeStyle=aligned?'#ffe4a2':'#f7eee0';g.globalAlpha=.8;g.lineWidth=2;g.beginPath();g.arc(tx,Math.max(230,Math.min(560,ly)),7,0,Math.PI*2);g.stroke();g.restore();}
 if(arrived&&!cheer&&f.shot&&impactAge<.8){g.save();g.strokeStyle='#f0be8a';g.globalAlpha=Math.max(0,1-impactAge/.8);const my=mapY(f.shot.shotY);line(g,tx-7,my-7,tx+7,my+7,'#f0be8a',2);line(g,tx+7,my-7,tx-7,my+7,'#f0be8a',2);g.restore();}
 if(f.campMemories>=1){g.save();g.globalAlpha=.85;line(g,17,base+38,17,base+94,'#71563c',3);g.fillStyle='#a34e3d';g.beginPath();g.moveTo(17,base+38);g.lineTo(55,base+42);g.lineTo(43,base+53);g.lineTo(17,base+55);g.fill();g.restore();}
 if(outcome&&f.shot){
   const from={x:x+(f.character==='female'?108:ride?90:92),y:y-h*(f.character==='female'?(ride?.80:.67):(ride?.72:.58))};
   const hit=outcome==='good'||outcome==='perfect'||!!f.obstacleHit,pass=hit&&f.projectileMode==='through',pose=arrowPose(from,{x:f.shot.x,y:mapY(f.shot.shotY),flight:f.shot.flight},age,hit&&!pass,base+12);if(hit&&f.projectileMode==='fall'&&pose.arrived){const fallAge=Math.max(0,age-f.shot.flight);pose.x+=Math.min(70,fallAge*80);pose.y=Math.min(base+10,pose.y+fallAge*fallAge*420);pose.angle+=Math.min(1.1,fallAge*2);pose.grounded=pose.y>=base+10;}
   // Misses cross the target plane and keep travelling. A low shot settles on the ground.
   if((hit&&!pass)||pose.x<1050)paintArrow(g,pose.x+(hit&&pose.arrived?targetKick:0),pose.y,pose.angle,{embedded:hit&&!pass&&f.projectileMode!=='fall'&&pose.arrived||pose.grounded,age:impactAge,reduced:reduced||pose.grounded,trail:!reduced&&!pose.arrived&&!pose.grounded});
   if(hit&&pose.arrived&&impactAge<.24&&!reduced){
     for(let i=0;i<7;i++){const a=-Math.PI*.8+i*.37,r=impactAge*(45+i*12);g.globalAlpha=Math.max(0,1-impactAge/.24);line(g,tx+Math.cos(a)*r,pose.y+Math.sin(a)*r,tx+Math.cos(a)*r+3,pose.y+Math.sin(a)*r+2,'#d6b17c',1.5);}g.globalAlpha=1;
   }
   if(hit&&pose.arrived&&outcome==='perfect'&&!reduced)for(let i=0;i<8;i++){const a=i*Math.PI/4,r=12+impactAge*42;g.globalAlpha=Math.max(0,1-impactAge/.35);line(g,tx+Math.cos(a)*r,ty+Math.sin(a)*r,tx+Math.cos(a)*(r+5),ty+Math.sin(a)*(r+5),GOLD,3)}g.globalAlpha=1;
 }

 if(!f.hideChatter&&(f.heckle||arrived)&&(outcome?arrived:power<1)){const speaker=(f.speaker??0)%crowd.length,[cx,cy,ch]=crowd[speaker],words=(f.heckle||(cheer?'好箭！再来！':'差一点，再试试！')).replace(/^[^：]+：/,''),rows=words.match(/.{1,11}/gu)||[],bw=350,bh=28+rows.length*33,bx=Math.max(18,Math.min(982-bw,cx-bw/2)),by=Math.max(255-bh,-worldShift/s+14);
 g.save();g.fillStyle='#fffaf0';g.strokeStyle='#c1ac87';g.lineWidth=2;g.beginPath();g.roundRect(bx,by,bw,bh,18);g.fill();g.stroke();g.beginPath();g.moveTo(Math.max(bx+20,Math.min(bx+bw-20,cx))-9,by+bh-1);g.lineTo(Math.max(bx+20,Math.min(bx+bw-20,cx)),by+bh+12);g.lineTo(Math.max(bx+20,Math.min(bx+bw-20,cx))+9,by+bh-1);g.fill();rows.forEach((row,i)=>text(g,row,bx+18,by+35+i*33,26));oval(g,cx,cy+4,22,3,'#b9a47c');g.restore()}


 g.restore();
}

export function paintCharacter(...args){return sprite(...args)}
