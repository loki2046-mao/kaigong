import { targetState, riderOffset } from './engine.mjs?v=crowd-clear-1';
const INK='#654a35', RED='#bd6952', GOLD='#edc460';
const atlas=typeof Image==='undefined'?null:new Image();
if(atlas) atlas.src=(typeof location!=='undefined'&&location.pathname.includes('/tools/')?'../':'./')+'art/bean-atlas-v1.png';
const sprites=[[106,170,239,260],[537,134,281,298],[923,95,375,345],[1359,85,385,352],[119,564,196,266],[550,565,237,268],[987,565,199,266],[1433,567,210,266]];
export function line(g,x,y,a,b,c=INK,w=3){g.beginPath();g.moveTo(x,y);g.lineTo(a,b);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.stroke()}
export function text(g,s,x,y,size=20,c=INK){g.fillStyle=c;g.font=`600 ${size}px system-ui`;g.fillText(s,x,y)}
function oval(g,x,y,rx,ry,c){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill()}
function sprite(g,n,x,y,h,tilt=0){if(!atlas?.complete||!atlas.naturalWidth)return;const [sx,sy,sw,sh]=sprites[n],w=h*sw/sh;g.save();g.translate(x,y);g.rotate(tilt);g.drawImage(atlas,sx,sy,sw,sh,-w/2,-h,w,h);g.restore()}
function hill(g,y,color,phase){g.beginPath();g.moveTo(0,720);g.lineTo(0,y);g.bezierCurveTo(240,y-65+phase,380,y+32,550,y-15);g.bezierCurveTo(760,y-65,870,y+20,1000,y-25);g.lineTo(1000,720);g.closePath();g.fillStyle=color;g.fill()}
export function drawScene(g,f){
 const {power=0,outcome=null,age=0,home=false}=f;
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const t=reduced?0:f.t||0,s=f.shapeScale||1,base=535;
 g.save();g.clearRect(0,0,1000,720);g.fillStyle='#eaf3ee';g.fillRect(0,0,1000,720);
 oval(g,775,95,28,28,'#f8edbd');
 for(let i=0;i<3;i++){const x=100+i*355+Math.sin(t*.06+i)*25,y=95+i%2*90;oval(g,x,y,58,9,'#fbfcf5');oval(g,x-15,y-7,26,12,'#fbfcf5')}
 hill(g,340,'#d6e4ce',0);hill(g,375,'#bfd3b5',30);hill(g,423,'#e4e5c6',0);hill(g,480,'#f3ead4',15);
 g.translate(0,base*(1-s));g.scale(1,s);
 // Decorative activity stays below the shooting corridor.
 for(let i=0;i<12;i++){const x=30+i*86,y=592+(i%3)*40,v=Math.sin(t*1.4+i)*4;line(g,x,y,x-4+v,y-11,'#aab88c',2);line(g,x,y,x+7+v,y-7,'#aab88c',2)}
 for(const x of [70,945]){line(g,x,500,x,361,'#b29f78',3);g.beginPath();g.moveTo(x,365);g.quadraticCurveTo(x+25,370+Math.sin(t*2)*5,x+48,366);g.lineTo(x+41,396+Math.sin(t*2)*4);g.quadraticCurveTo(x+20,391,x,395);g.closePath();g.fillStyle='#a8bcb0';g.fill()}
 const b=f.bow,target=targetState(b,f.draw,outcome?Math.min(age,f.shot?.flight||0):0);
 // Both impact and target use this same transform; rings remain faithful to judgement.
 const mapY=y=>base-66+(y-442)*1.05,tx=target.x,ty=mapY(target.y),radius=(b?.radius||44)*1.05;
 const arrived=outcome&&age>=(f.shot?.flight||.2),mood=f.crowdMood||(arrived?outcome:null),cheer=mood==='perfect'||mood==='good',miss=mood&&!cheer;
 const crowd=[[85,640,105],[205,680,96],[680,670,103],[820,688,112],[941,642,97]];
 crowd.forEach(([x,y,h],i)=>{const hop=reduced?0:cheer?Math.abs(Math.sin(age*13+i))*(outcome==='perfect'?13:5):Math.sin(t*1.4+i)*1.3;oval(g,x,y+2,h*.23,3,'#ded6bd');sprite(g,cheer?5:miss?(i%2?6:7):4,x,y-hop,h,!outcome&&power>20?Math.sin(t*2+i)*.04:0)});

 for(let step=20;step<=135;step+=20){const mx=500+(step-20)*3.2;line(g,mx,base+44,mx,base+49,'#c4b89a',2);text(g,String(step),mx-10,base+68,14,'#b4aa91')}
 oval(g,tx,base+6,30,5,'#ded6bd');line(g,tx-6,ty+radius*.7,tx-20,base+4,'#b09a72',4);line(g,tx+6,ty+radius*.7,tx+20,base+4,'#b09a72',4);
 if(b?.type==='willow'){line(g,tx,ty+radius,tx,ty-radius*2,'#99ac7c',3);oval(g,tx,ty,radius*.44,radius,'#8fa975')}else{oval(g,tx,ty,radius*1.18,radius*1.25,'#c7b18b');oval(g,tx,ty,radius,radius,RED);oval(g,tx,ty,radius*.14,radius*.14,GOLD)}
 const ride=b?.mounted&&!home,bob=ride?riderOffset(b,f.draw?.elapsed||0)*.8:0,h=ride?220:175,x=215,y=base+bob;
 oval(g,x,base+5,ride?69:29,5,'#dcd1b8');sprite(g,ride?(power>5?3:2):(power>5?1:0),x,y,h,power>70&&!reduced?Math.sin(t*22)*.012:0);
 if(ride)for(let i=0;i<3;i++){const k=(t*1.5+i/3)%1;g.globalAlpha=(1-k)*.25;oval(g,x-58-k*45,base-2-k*8,5+k*8,3+k*3,'#c3b795')}g.globalAlpha=1;
 text(g,`${b?.distance||20} 步`,tx-23,base+34,17,'#9c927c');
 if(!home&&!outcome){g.setLineDash([3,9]);g.globalAlpha=.35;line(g,tx-58,mapY(target.shotY),tx+25,mapY(target.shotY),'#897e65',2);g.setLineDash([]);g.globalAlpha=1}
 if(outcome&&f.shot){const k=Math.min(1,age/f.shot.flight),fromX=x+(ride?66:48),fromY=y-h*.53,endY=mapY(f.shot.shotY),ax=fromX+(f.shot.x-fromX)*k,ay=fromY+(endY-fromY)*k-Math.sin(k*Math.PI)*(25+(b?.distance||20)*.4);line(g,ax-26,ay-2,ax,ay,INK,2.5);line(g,ax-25,ay-2,ax-32,ay-7,RED,3);if(arrived&&outcome==='perfect')for(let i=0;i<8;i++){const a=i*Math.PI/4,r=12+age*42;g.globalAlpha=Math.max(0,1-age);line(g,tx+Math.cos(a)*r,ty+Math.sin(a)*r,tx+Math.cos(a)*(r+5),ty+Math.sin(a)*(r+5),GOLD,3)}g.globalAlpha=1}
 if((f.heckle||arrived)&&(outcome?arrived:power<1)){const speaker=(f.speaker??0)%crowd.length,[cx,cy,ch]=crowd[speaker],words=(f.heckle||(cheer?'好箭！再来！':'差一点，再试试！')).replace(/^[^：]+：/,''),rows=words.match(/.{1,11}/gu)||[],bw=350,bh=28+rows.length*33,bx=Math.max(18,Math.min(982-bw,cx-bw/2)),by=285-bh;
 g.save();g.fillStyle='#fffaf0';g.strokeStyle='#c1ac87';g.lineWidth=2;g.beginPath();g.roundRect(bx,by,bw,bh,18);g.fill();g.stroke();g.beginPath();g.moveTo(Math.max(bx+20,Math.min(bx+bw-20,cx))-9,by+bh-1);g.lineTo(Math.max(bx+20,Math.min(bx+bw-20,cx)),by+bh+12);g.lineTo(Math.max(bx+20,Math.min(bx+bw-20,cx))+9,by+bh-1);g.fill();rows.forEach((row,i)=>text(g,row,bx+18,by+35+i*33,28));oval(g,cx,cy+4,22,3,'#b9a47c');g.restore()}


 g.restore();
}
