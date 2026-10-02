import { isAim, targetState, zoneAt } from './engine.mjs';
const INK='#292b23', PAPER='#f2e9d6', RED='#b43d2f', GOLD='#e5b63c';
function path(g,points,fill=null,width=5,close=false){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(close)g.closePath();g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.strokeStyle=INK;if(fill){g.fillStyle=fill;g.fill()}if(width>0)g.stroke()}
function ellipse(g,x,y,rx,ry,fill,stroke=INK,width=4){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke()}}
export function line(g,x1,y1,x2,y2,color=INK,w=4){g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.stroke()}
export function text(g,t,x,y,size=20,color=INK){g.fillStyle=color;g.font=`bold ${size}px "Songti SC", serif`;g.fillText(t,x,y)}
function soldier(g,x,y,scale,cheer=false,instructor=false){
 g.save();g.translate(x,y);g.scale(scale,scale);
 const skin='#fff1d5',edge='#705342';
 ellipse(g,0,136,40,6,'#c5baa0',null);
 ellipse(g,-16,127,13,7,'#a78768',edge,3);ellipse(g,16,127,13,7,'#a78768',edge,3);
 ellipse(g,0,61,39,67,skin,edge,3);
 ellipse(g,0,105,32,24,instructor?'#bb7860':'#cab496',edge,3);
 line(g,-30,80,-44,cheer?43:99,skin,13);line(g,30,80,43,cheer?40:97,skin,13);
 ellipse(g,-12,36,2.8,3.5,edge,null);ellipse(g,12,37,2.8,3.5,edge,null);
 ellipse(g,-23,49,8,5,'#efb1a1',null);ellipse(g,23,49,8,5,'#efb1a1',null);
 ellipse(g,1,56,3,3,edge,null);
 // Soft tied kerchiefs and a hair bun, no brim or helmet.
 g.beginPath();g.moveTo(-36,12);g.quadraticCurveTo(-12,-8,34,13);g.quadraticCurveTo(7,22,-37,24);g.closePath();g.fillStyle=instructor?'#a86c57':'#a1b5a0';g.fill();g.strokeStyle=edge;g.lineWidth=3;g.stroke();
 ellipse(g,-35,21,7,6,instructor?'#a86c57':'#a1b5a0',edge,2);ellipse(g,0,-5,10,9,'#665346',edge,2);
 if(instructor){line(g,-6,65,-5,72,'#a69881',2);line(g,0,66,1,75,'#a69881',2);line(g,6,65,7,71,'#a69881',2);line(g,44,90,57,71,edge,5);line(g,58,71,63,21,'#a78768',4)}
 g.restore();
}
function hero(g,p,t,outcome,age,home=false,rankHits=0){
 const tier=rankHits>=12?2:rankHits>=6?1:0;
 const apron=['#d8b78f','#c49379','#bb876b'][tier],cloth=['#9bb9ae','#a8b6ce','#ccaa6d'][tier];
 const miss=outcome==='short'||outcome==='over',cheer=outcome==='perfect',strain=p>60;
 const skin=strain?'#ffe5c6':'#fff1d5',edge='#705342';
 g.save();g.translate(350,429);ellipse(g,0,185,96,9,'#bfb39a',null);
 g.translate(-p*.12,home?Math.sin(t*1.7)*2:0);g.rotate((home?-2:-p*.09-(miss?Math.sin(Math.min(1,age)*Math.PI)*8:0))*Math.PI/180);
 // Two tiny cloth shoes tucked under a big, squishy dumpling body.
 ellipse(g,-31,176,22,10,'#b39473',edge,3);ellipse(g,30,176,22,10,'#b39473',edge,3);
 ellipse(g,-6,64,81+(strain?3:0),105,skin,edge,4);
 // An old-fashioned cook's apron and a simple cloth waist tie.
 g.beginPath();g.moveTo(-45,101);g.quadraticCurveTo(-48,137,-37,161);g.quadraticCurveTo(-1,174,38,158);g.quadraticCurveTo(45,127,38,101);g.closePath();g.fillStyle=apron;g.fill();g.strokeStyle=edge;g.lineWidth=3;g.stroke();
 line(g,-59,104,54,104,cloth,8);ellipse(g,-54,104,8,7,cloth,edge,2);
 path(g,[[-58,107],[-70,125],[-52,120]],cloth,2,true);
 // The bow is too big; mitten hands and round sleeves wrap around it.
 const nockX=139-Math.min(100,p)*.9;
 line(g,51,70,140,68,edge,16);line(g,51,70,140,68,skin,11);
 line(g,-53,78,-74-p*.1,96,edge,16);line(g,-53,78,-74-p*.1,96,skin,11);
 line(g,-74-p*.1,96,nockX-4,66,edge,15);line(g,-74-p*.1,96,nockX-4,66,skin,10);
 ellipse(g,nockX,66,11,11,skin,edge,3);ellipse(g,145,68,12,13,skin,edge,3);
 // A blank little face: no eyebrows, nose, teeth or cheeky grin.
 ellipse(g,-38,28,15,8,'#efb7a7',null);ellipse(g,31,30,15,8,'#efb7a7',null);
 if(strain){line(g,-25,7,-17,10,edge,3);line(g,11,10,19,7,edge,3);ellipse(g,-3,29,7,8,'#d69582',edge,2)}
 else if(cheer){g.beginPath();g.moveTo(-27,13);g.quadraticCurveTo(-21,2,-15,13);g.moveTo(9,13);g.quadraticCurveTo(16,2,23,13);g.strokeStyle=edge;g.lineWidth=3;g.stroke();ellipse(g,-2,31,5,7,'#d69582',edge,2)}
 else{ellipse(g,-21,9,3.5,4.5,edge,null);ellipse(g,16,11,3.5,4.5,edge,null);ellipse(g,-2,31,3,3,edge,null)}
 if(miss){ellipse(g,-21,23,3,7,'#9ec2c7',null);ellipse(g,17,25,3,7,'#9ec2c7',null)}
 if(strain){g.beginPath();g.moveTo(-64,-4);g.quadraticCurveTo(-77,13,-69,16);g.quadraticCurveTo(-59,18,-64,-4);g.fillStyle='#a9c8c6';g.fill();}
 // A loose coloured kerchief tied at the side, with an uncooperative tuft.
 g.save();if(miss){g.translate(-age*18,-Math.sin(Math.min(age,1)*Math.PI)*35);g.rotate(-age*.15)}
 g.beginPath();g.moveTo(-72,-24);g.quadraticCurveTo(-31,-51,49,-24);g.quadraticCurveTo(23,-8,-70,-9);g.closePath();g.fillStyle=cloth;g.fill();g.strokeStyle=edge;g.lineWidth=3;g.stroke();
 ellipse(g,-73,-13,10,8,cloth,edge,2);
 g.beginPath();g.moveTo(-77,-10);g.quadraticCurveTo(-106,-13,-101,3);g.quadraticCurveTo(-84,11,-75,-4);g.closePath();g.fillStyle=cloth;g.fill();g.stroke();
 g.beginPath();g.moveTo(-75,-8);g.quadraticCurveTo(-87,9,-74,25);g.quadraticCurveTo(-62,14,-69,-7);g.closePath();g.fill();g.stroke();
 g.beginPath();g.moveTo(-13,-40);g.quadraticCurveTo(-26,-66,-10,-62);g.quadraticCurveTo(3,-59,-7,-45);g.moveTo(-8,-42);g.quadraticCurveTo(6,-60,13,-48);g.strokeStyle=edge;g.lineWidth=4;g.stroke();g.restore();
 const bend=p*.14;g.beginPath();g.moveTo(126,-87);g.bezierCurveTo(178+bend,-65,194+bend,12,155,67);g.bezierCurveTo(195+bend,120,165+bend,162,122,191);g.strokeStyle=edge;g.lineWidth=11;g.stroke();g.strokeStyle='#b99268';g.lineWidth=6;g.stroke();path(g,[[126,-87],[nockX,66],[122,191]],null,2);line(g,146,54,151,80,'#a96f56',10);
 if(!outcome||age<.07){line(g,nockX-17,66,248,66,edge,2.5);path(g,[[248,66],[235,60],[237,72]],edge,2,true);line(g,nockX-14,66,nockX-27,58,'#a96f56',4);line(g,nockX-14,66,nockX-27,74,'#a96f56',4)}
 g.restore();
}
function cloud(g,x,y,k=1){g.save();g.translate(x,y);g.scale(k,k);g.beginPath();g.moveTo(-40,8);g.bezierCurveTo(-55,-7,-34,-23,-20,-13);g.bezierCurveTo(-18,-37,15,-39,23,-15);g.bezierCurveTo(50,-27,65,7,41,12);g.lineTo(-40,12);g.fillStyle='#f9f0de';g.fill();g.strokeStyle='#d1c4aa';g.lineWidth=2;g.stroke();g.restore();}
function chicken(g,x,y,t,panic=false){g.save();g.translate(x,y);const bob=Math.sin(t*9)*(panic?4:1.5);line(g,-6,14,-9+Math.sin(t*10)*3,24,'#a97c4c',2);line(g,5,14,8-Math.sin(t*10)*3,24,'#a97c4c',2);ellipse(g,0,bob,17,14,'#fff1d5','#9c8062',2);ellipse(g,12,-10+bob,8,9,'#fff1d5','#9c8062',2);ellipse(g,14,-12+bob,1.5,2,INK,null);path(g,[[19,-10+bob],[27,-7+bob],[19,-5+bob]],'#d7a245',1.5,true);ellipse(g,11,-20+bob,3,4,'#c4735d',null);path(g,[[-13,-7+bob],[-25,-16+bob],[-22,2+bob]],'#e2bf82',2,true);g.restore();}
function camp(g,t,outcome,age,hits){
 // Warm, layered hills, slow clouds and little flags across the cookhouse.
 path(g,[[0,400],[0,347],[87,313],[180,350],[264,304],[379,359],[495,331],[594,379],[679,325],[782,352],[890,312],[1000,355],[1000,420]],'#ded6b5',0,true);
 path(g,[[0,444],[0,379],[125,348],[250,391],[355,355],[482,398],[592,363],[720,397],[855,346],[1000,391],[1000,444]],'#ead5b6',0,true);
 ellipse(g,126,245,27,27,'#e8c985',null);cloud(g,215+Math.sin(t*.13)*13,254,.7);cloud(g,532+Math.sin(t*.1)*18,294,.6);
 g.beginPath();g.moveTo(35,324);g.quadraticCurveTo(377,420,719,310);g.strokeStyle='#aa9676';g.lineWidth=2;g.stroke();
 for(let i=0;i<7;i++){const x=74+i*90,y=327+Math.sin((x-35)/684*Math.PI)*45;path(g,[[x,y],[x+21,y+3],[x+9+Math.sin(t*1.1+i)*2,y+28]],['#c78d76','#99afa2','#d7bb77'][i%3],1,true)}
 // The cookhouse is a little fabric stall rather than an empty outline.
 path(g,[[42,511],[42,382],[112,345],[187,382],[187,511]],'#ead7b5',2,true);
 path(g,[[23,386],[111,341],[204,386],[188,399],[29,399]],'#9fb5a3',2,true);
 line(g,58,399,58,522,'#a08460',4);line(g,180,399,180,522,'#a08460',4);
 text(g,'伙房',78,386,18,'#5f6754');
 // Steaming pot, firewood and a line of buns.
 line(g,37,507,191,507,'#a08460',8);for(let i=0;i<4;i++){ellipse(g,59+i*32,490,13,12,'#fff0d4','#bca98b',1.5);line(g,53+i*32,489,58+i*32,484,'#cebea1',1.3)}
 ellipse(g,106,553,39,24,'#8a9987','#6b735f',3);ellipse(g,106,537,43,9,'#bac4a8','#6b735f',3);line(g,66,549,52,549,'#6b735f',4);line(g,148,549,159,549,'#6b735f',4);
 for(let i=0;i<3;i++){const phase=(t*.45+i*.32)%1;g.globalAlpha=(1-phase)*.38;g.beginPath();g.moveTo(88+i*18,530-phase*48);g.bezierCurveTo(77+i*18,514-phase*48,109+i*18,505-phase*48,91+i*18,491-phase*48);g.strokeStyle='#faf2df';g.lineWidth=5;g.stroke()}g.globalAlpha=1;
 line(g,74,583,132,569,'#a08460',5);line(g,76,569,136,583,'#a08460',5);
 g.beginPath();g.moveTo(84,575);g.quadraticCurveTo(86,560,100,554+Math.sin(t*5)*4);g.quadraticCurveTo(100,568,114,554);g.quadraticCurveTo(125,574,115,578);g.fillStyle='#d8a265';g.fill();
 // A tiny band beside the target; drumsticks bounce without blocking the bow.
 ellipse(g,667,573,26,13,'#c39b75','#927354',2);ellipse(g,667,563,26,8,'#f0dfbf','#927354',2);
 const beat=Math.sin(t*12.15),lift=outcome==='perfect'?9:3;line(g,643,549,656,557-beat*lift,'#927354',2);line(g,690,549,677,557+beat*lift,'#927354',2);
 if(hits>=6){line(g,719,576,735,558,'#a78768',4);ellipse(g,734,559,10,10,'#dbc4a0','#927354',2)}
}
export function drawScene(g,frame){const {power=0,t=0,outcome=null,age=0,home=false,hits=0}=frame;g.save();g.clearRect(0,0,1000,720);
 const shapeScale=frame.shapeScale||1;g.translate(0,600*(1-shapeScale));g.scale(1,shapeScale);
 camp(g,t,outcome,age,hits);
 line(g,750,390,750,122,INK,4);const wave=Math.sin(t*1.4)*9;path(g,[[753,131],[932,154+wave],[906,192+wave],[931,247+wave],[752,223]],RED,3,true);text(g,'弓',809,204+wave,49,PAPER);line(g,750,122,750,108,INK,7);
 g.globalAlpha=.7;line(g,0,611,1000,611,'#9b937d',2);line(g,10,625,150,625,'#b9ac90',2);line(g,630,635,914,635,'#b9ac90',2);line(g,244,648,410,648,'#b9ac90',2);g.globalAlpha=1;
 const target=targetState(frame.bow,frame.draw);const zone=frame.bow?zoneAt(frame.bow,frame.draw):null;const hitY=outcome==='good'&&frame.bow?.type!=='willow'?(power<(zone?(zone.perfectMin+zone.perfectMax)/2:75)?43:-43):0;if(!home&&isAim(frame.bow)){g.setLineDash([6,8]);line(g,620,target.shotY,target.x,target.shotY,'#a89a7b',2);g.setLineDash([]);text(g,'箭路',636,target.shotY-9,16,'#8c8065');}if(frame.bow?.type==='wind'){for(let i=0;i<4;i++){const x=590+i*65+Math.sin(t*3)*12;line(g,x,295+i*13,x-40,295+i*13,'#719488',3);}text(g,'逆风',584,276,20,'#719488');}if(frame.bow?.type==='volley'){text(g,`连珠 ${frame.volley||0}/3`,806,335,24,RED);}const cheer=outcome==='perfect';soldier(g,166,479,.68,cheer);soldier(g,638,466,.74,cheer,true);if(hits>=3||home)soldier(g,727,468,.62,cheer);if(hits>=6)soldier(g,75,481,.61,cheer);if(hits>=10)soldier(g,964,460,.7,cheer);
 // Oversized straw target.
 g.save();g.translate(target.x,target.y);if(frame.bow?.type==='willow'){line(g,0,-92,0,172,'#8a7955',5);line(g,0,-58,-31,-80,'#8a7955',3);ellipse(g,0,0,14,23,cheer&&age>.2?GOLD:'#83a36a');text(g,'柳叶',-30,-108,21,'#719488');}else{if(cheer)g.rotate(Math.sin(age*13)*.035*Math.max(0,1-age));line(g,-21,40,-51,170,INK,8);line(g,22,40,55,170,INK,8);ellipse(g,0,0,75,84,'#c5a86e');for(let i=0;i<14;i++){const a=i*Math.PI/7;line(g,Math.cos(a)*64,Math.sin(a)*74,Math.cos(a)*74,Math.sin(a)*84,'#907751',2)}ellipse(g,0,0,53,60,RED,INK,3);ellipse(g,0,0,31,36,PAPER,INK,3);ellipse(g,0,0,12,15,GOLD,INK,3);if((outcome==='good'||cheer)&&age>.18){line(g,-32,hitY-4,0,hitY,INK,4);line(g,-32,hitY-4,-45,hitY-12,RED,5);line(g,-32,hitY-4,-46,hitY+3,RED,5)}}g.restore();
 const tremor=power>65?Math.sin(t*24)*(power-65)/25:0;g.save();g.translate(tremor,0);hero(g,power,t,outcome,age,home,home?0:hits);g.restore();
 if(outcome&&age>.02&&age<.21){const k=Math.min(1,(age-.02)/.18),miss=outcome==='short'||outcome==='over';const angle=-power*.09*Math.PI/180,fromX=350-power*.12+248*Math.cos(angle)-66*Math.sin(angle),fromY=429+248*Math.sin(angle)+66*Math.cos(angle);const endX=outcome==='short'?730:outcome==='over'&&!isAim(frame.bow)?930:target.x;const x=fromX+(endX-fromX)*k,y=fromY+((!miss&&frame.bow?.type!=='willow'?target.y+hitY:isAim(frame.bow)?target.shotY:miss?605:target.y)-fromY)*k;line(g,x-65,y-2,x,y,INK,3);path(g,[[x,y],[x-10,y-6],[x-10,y+6]],INK,2,true)}
 if(cheer){for(let i=0;i<14;i++){const a=i*2.399,x=target.x+Math.cos(a)*age*160,y=target.y+Math.sin(a)*age*140+age*age*60;g.globalAlpha=Math.max(0,1-age);line(g,x,y,x+5,y-8,i%2?RED:GOLD,4)}g.globalAlpha=1}
 // Hens scatter when an arrow misses, then wander back to the cookhouse.
 const panic=(outcome==='short'||outcome==='over')&&age<.8;
 chicken(g,195+(panic?Math.sin(age*Math.PI)*105:Math.sin(t*.6)*9),598,t,panic);
 chicken(g,910+(panic?Math.sin(age*Math.PI)*45:Math.sin(t*.5)*8),610,t+2,panic);
 if(outcome==='perfect'&&age<.6){text(g,'！',190,576-Math.sin(age*Math.PI)*8,19,'#b47d54');}
 if(outcome==='short'&&age>.22){line(g,703,605,756,598,INK,3)}if(outcome==='over'&&age>.22){line(g,900,596,952,615,INK,3)}
 g.restore()}
