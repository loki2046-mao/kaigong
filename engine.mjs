import { RANKS } from './content.mjs?v=crowd-clear-1';
export const DURATION = 90;
export const GOAL = RANKS.length;
export function rankFor(cleared) { return cleared ? RANKS[Math.min(GOAL,cleared)-1].title : '白身'; }
export const TYPES = { soft:'蓄力',stubborn:'回扯',shaky:'抖弓',wind:'逆风',moving:'移动靶',willow:'射柳',volley:'连珠考核',mounted:'骑马射箭' };
export const CHAPTERS=['伙房练手','强弓远射','小靶考核','追风试炼','马上开弓','沙场初试','百步追风','穿杨试炼','踏雪骑射','封帅大比'];
export const RECIPES=['soft','soft','soft','stubborn','volley','soft','stubborn','wind','shaky','volley','soft','soft','willow','willow','volley','moving','moving','moving','wind','volley','mounted','mounted','mounted','mounted','volley','wind','willow','moving','mounted','volley'].concat(['wind','moving','wind','moving','volley','willow','shaky','willow','moving','volley','mounted','mounted','wind','mounted','volley','wind','willow','moving','mounted','volley']);
export function seedNumber(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function makeBow(index,seed){
 const i=Math.max(0,Math.min(GOAL-1,index)),r=seedNumber(`${seed}:${i}`),type=RECIPES[i];
 const chapter=Math.floor(i/5),step=i%5,strength=1+chapter*.12,distance=chapter===0?20+step*3:chapter===1?40+step*8:chapter===2?36+step*4:chapter===3?48+step*5:chapter===4?42+step*6:chapter===5?70+step*6:85+(chapter-6)*10+step*5;
 const radius=chapter===0?44-step*3:chapter===1?29-step:chapter===2?22-step*3:chapter===3?18-step:chapter===4?22-step*2:chapter===5?16-step*.6:Math.max(10,17-(chapter-6)*1.5-step*.5);
 const mounted=chapter===4||i===28||i===29||chapter===8||chapter===9&&step>=3,moving=chapter===3||i>=26&&i!==28;
 const speed=moving?.65+step*.16+(chapter>=5?.5+(chapter-5)*.08:0):type==='willow'?.5:0;
 const b={index:i,type,chapter,chapterName:CHAPTERS[chapter],distance,strength,radius,mounted,moving,speed,
 gain:i<3?31+(r%3):Math.max(21,31-chapter*1.4)+(r%2),wobble:type==='shaky'?3:0,wind:type==='wind'?5+chapter:0,phase:(r%628)/100,
 required:step===4?(i===49?3:2):1,bowName:RANKS[i].bowName.split(' · ')[0],rank:RANKS[i].title};
 Object.assign(b,zoneAt(b,makeDraw()));return b;
}
export function makeDraw(){return {raw:0,power:0,elapsed:0,rebound:false,arrow:0};}
export function isAim(bow){return !!bow;}
export function flightTime(bow){return .16+bow.distance*.0045;}
export function riderOffset(bow,t){return bow?.mounted?Math.sin(t*4.2+bow.phase)*18:0;}
export function targetState(bow,draw,timeOffset=0){
 if(!bow)return {x:848,y:442,shotY:442};
 const t=(draw?.elapsed||0)+timeOffset,amp=bow.moving?38:bow.type==='willow'?12:0;
 return {x:500+(Math.min(135,bow.distance)-20)*3.2,y:442+Math.sin(t*bow.speed+bow.phase)*amp,shotY:landingY(bow,draw?.power||0,draw?.elapsed||0)};
}
export function landingY(bow,power,t){
 // Fixed elevation: stronger bows lift the arrow; distance adds drop. Horse gait changes launch height.
 const drop=bow.distance*.62/bow.strength,wind=bow.wind?Math.sin(t*1.5+bow.phase)*7:0;
 return 580+drop-power*2.5*bow.strength+riderOffset(bow,t)+wind;
}
export function zoneAt(bow,draw=makeDraw()){
 const future=targetState(bow,draw,flightTime(bow)),t=draw.elapsed||0;
 const zero=landingY(bow,0,t),scale=2.5*bow.strength,c=(zero-future.y)/scale;
 const width=bow.radius*2/scale,perfect=bow.radius*.28/scale;
 return {min:c-width/2,max:c+width/2,perfectMin:c-perfect/2,perfectMax:c+perfect/2};
}
export function advanceDraw(draw,bow,dt,holding=true){
 draw.elapsed+=dt;if(!holding)return false;
 let gain=bow.gain;if(bow.wind)gain-=bow.wind*(.55+.45*Math.sin(draw.elapsed*2.6+bow.phase));
 draw.raw+=gain*dt;let rebounded=false;
 if(bow.type==='stubborn'&&!draw.rebound&&draw.raw>=57){draw.raw-=11;draw.rebound=true;rebounded=true;}
 draw.power=Math.max(0,draw.raw+bow.wobble*Math.sin(draw.elapsed*9));return rebounded;
}
export function judge(bow,power,draw=makeDraw()){
 const zone=zoneAt(bow,draw),impact=targetState(bow,draw,flightTime(bow)),shotY=landingY(bow,power,draw.elapsed||0);
 const kind=power<zone.min?'short':power>zone.max?'over':power>=zone.perfectMin&&power<=zone.perfectMax?'perfect':'good';
 return {kind,gap:kind==='short'?zone.min-power:kind==='over'?power-zone.max:0,impact:{x:impact.x,y:impact.y,shotY,flight:flightTime(bow),offset:shotY-impact.y}};
}
export function points(kind,streak){return (kind==='perfect'?250:100)+Math.min(5,Math.max(0,streak-1))*25;}
export function titleFor(cleared){return rankFor(cleared);}

export function maximumScore(from=0,to=GOAL){let arrows=0;for(let i=from;i<to;i++)arrows+=makeBow(i,'top').required;let total=0;for(let n=1;n<=arrows;n++)total+=points('perfect',n);return total;}
export function mastery(score,from=0,misses=0){const top=maximumScore(from),ratio=Math.max(0,Math.min(1,score/top)),stars=ratio>=.95?5:ratio>=.85?4:ratio>=.7?3:ratio>=.5?2:1;return {top,ratio,stars,label:from===0&&score===top&&misses===0?'百发百中 · 无双神射':`${'★'.repeat(stars)}${'☆'.repeat(5-stars)} · ${['初成','熟练','精湛','卓绝','传奇'][stars-1]}`,gap:Math.max(0,top-score)};}
