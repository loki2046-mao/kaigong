import {line} from './scene.mjs?v=oct25-polish3';
const INK='#292b23', RED='#b43d2f';
const awardAtlas=typeof Image==='undefined'?null:new Image();if(awardAtlas)awardAtlas.src=(typeof location!=='undefined'&&location.pathname.includes('/tools/')?'../':'./')+'art/archer-cast-v2.webp';
const femaleAwardAtlas=typeof Image==='undefined'?null:new Image();if(femaleAwardAtlas)femaleAwardAtlas.src=(typeof location!=='undefined'&&location.pathname.includes('/tools/')?'../':'./')+'art/general-female-v2.webp';
const stageAwardAtlases=['recruit-female-v1.webp','silver-female-v1.webp'].map(name=>{if(typeof Image==='undefined')return null;const im=new Image();im.src=(typeof location!=='undefined'&&location.pathname.includes('/tools/')?'../':'./')+'art/'+name;return im;});
export function drawAwardDoodle(g,kind,character='male',tier=1){
 if(character==='female'&&tier!==1){const im=stageAwardAtlases[tier===2?1:0];if(im?.complete&&im.naturalWidth){g.drawImage(im,0,0,im.naturalWidth/3,im.naturalHeight/2,48,0,145,145);return;}} 
 if(character==='female'&&femaleAwardAtlas?.complete&&femaleAwardAtlas.naturalWidth){g.save();g.drawImage(femaleAwardAtlas,0,0,femaleAwardAtlas.naturalWidth/3,femaleAwardAtlas.naturalHeight/2,48,0,145,145);g.restore();return;}

 if(awardAtlas?.complete&&awardAtlas.naturalWidth){g.save();g.drawImage(awardAtlas,0,0,384,508,68,0,110,145);g.restore();return;}

 const ink='#82684b',red='#b66d55';g.save();g.lineWidth=2.6;g.strokeStyle=ink;g.fillStyle='#faf2df';g.lineCap='round';g.lineJoin='round';
 const stroke=(points)=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
 const oval=(x,y,rx,ry,fill='#faf2df')=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();g.stroke();};
 // A squat ink-drawn bean, with tiny feet and a loose kerchief.
 oval(115,104,23,20);oval(102,123,9,4);oval(130,123,9,4);oval(114,64,36,33);
 stroke([[108,32],[103,24],[114,29],[120,22]]);stroke([[81,53],[94,43],[131,39]]);oval(80,52,7,4,'#a7b5a0');stroke([[77,54],[69,64],[78,61]]);
 g.fillStyle=ink;for(const x of [103,123]){g.beginPath();g.arc(x,64,2,0,7);g.fill();}stroke([[111,75],[116,77],[120,74]]);g.strokeStyle='#d3a18b';stroke([[91,75],[98,75]]);stroke([[131,74],[137,74]]);g.strokeStyle=ink;
 if(kind==='supreme'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;oval(139+Math.cos(a)*7,29+Math.sin(a)*7,5,5,'#dba494');}oval(139,29,3,3,'#e6c879');stroke([[92,104],[75,91],[66,74]]);stroke([[135,102],[154,89],[163,72]]);for(const [x,y] of [[54,49],[180,46],[167,108]]){stroke([[x-5,y],[x+5,y]]);stroke([[x,y-5],[x,y+5]]);}}
 else if(kind==='clear'){stroke([[134,108],[156,90]]);oval(164,72,13,17,'#dcb590');stroke([[159,87],[153,100]]);oval(150,103,4,4);oval(156,106,4,4);stroke([[96,104],[85,95]]);}
 else if(kind==='time'){oval(165,100,19,22);stroke([[165,86],[165,100],[175,105]]);stroke([[157,75],[171,75]]);stroke([[137,107],[151,110]]);stroke([[94,107],[80,102]]);}
 else{oval(146,107,24,23,'#e5d6b7');oval(146,107,15,15);oval(146,107,5,5,'#c68269');stroke([[132,99],[140,104],[145,100]]);stroke([[91,104],[112,116],[125,116]]);stroke([[173,83],[187,76],[183,84]]);}
 stroke([[72,132],[161,132]]);g.restore();
}

export function posterCanvas(S){
 const p=document.createElement('canvas');p.width=1080;p.height=1440;
 const g=p.getContext('2d'),d=S.result.decree;
 const serif='"Kaiti SC", "STKaiti", "KaiTi", "Songti SC", serif';
 g.fillStyle='#f5ecd5';g.fillRect(0,0,p.width,p.height);
 g.strokeStyle='#b49c6c';g.lineWidth=2;g.strokeRect(42,42,996,1356);g.strokeRect(58,58,964,1324);
 const center=(s,y,size,color=INK)=>{g.font=`500 ${size}px ${serif}`;g.textAlign='center';g.fillStyle=color;g.fillText(s,540,y);};
 const lines=(s,y,size=38,color=INK)=>{g.font=`500 ${size}px ${serif}`;let row='',rows=[];for(const c of s){if(g.measureText(row+c).width>790){rows.push(row);row=c;}else row+=c;}if(row)rows.push(row);rows.forEach((r,i)=>center(r,y+i*58,size,color));return y+rows.length*58;};
 center(S.startFrom?`闯关战报 · 第 ${S.startFrom+1} 关起步`:`${d.contest} · 校场战报`,122,26,'#968464');
 center(d.heading.split('').join(' '),222,38,'#8c7956');center(d.grant,295,29,'#8c7956');
 center(d.rank,410,Math.min(112,780/d.rank.length),INK);
 center(d.citation,490,29,'#978366');
 g.save();g.translate(264,550);g.scale(2.3,2.3);drawAwardDoodle(g,S.result.artKind,S.result.character||S.character,S.result.outfitTier??1);g.restore();
 // Traditional seal order: first column on the right, second on the left.
 g.save();g.translate(844,729);g.rotate(-.10);g.strokeStyle=RED;g.fillStyle=RED;g.lineWidth=4;
 g.strokeRect(-80,-80,160,160);g.lineWidth=2;g.strokeRect(-70,-70,140,140);
 g.font=`500 61px ${serif}`;g.textAlign='center';g.textBaseline='middle';
 Array.from(d.seal).forEach((c,i)=>g.fillText(c,i<2?34:-34,i%2?34:-34));g.restore();
 const y=lines('御批：'+d.verdict,944,39);
 lines('恩赏：'+d.reward,y+28,29,'#96765b');
 line(g,160,1125,920,1125,'#c6b58f',1);
 center(`${S.score} 战功`,1198,48);
 center(S.result.reason==='clear'?S.result.grade.label:`本段满分 ${S.result.grade.top} · 尚待精进`,1250,27,'#8c7956');
 center('兵部校场司 録 · 御膳房会签',1335,25,'#8c7956');return p;
}
