import { RANKS } from './content.mjs';
export const DURATION = 90;
export const GOAL = RANKS.length;
export function rankFor(cleared) { return cleared ? RANKS[Math.min(GOAL,cleared)-1].title : '白身'; }
export const TYPES = { soft:'蓄力',stubborn:'回扯',shaky:'抖弓',wind:'逆风',moving:'移动靶',willow:'射柳',volley:'连珠三箭' };
export const RECIPES=['soft','soft','soft','stubborn','shaky','wind','moving','soft','stubborn','volley','moving','wind','willow','shaky','volley','willow','moving','stubborn','wind','volley','moving','willow','wind','shaky','volley','willow','moving','wind','willow','volley'];
export function seedNumber(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function makeBow(index,seed){
 const i=Math.max(0,Math.min(GOAL-1,index)),r=seedNumber(`${seed}:${i}`),type=RECIPES[i];
 const width=i===0?40:i===1?30:i===2?24:Math.max(5.5,19-i*.46);
 const center=i<3?[68,75,79][i]:82+(r%5),min=center-width/2,max=center+width/2;
 const pWidth=Math.max(1.8,6-i*.14),perfectMin=center+width*.18,perfectMax=Math.min(max,perfectMin+pWidth);
 return {index:i,type,min,max,perfectMin,perfectMax,gain:31+Math.min(7,i*.2)+(r%3),wobble:type==='shaky'?Math.min(5,2.6+i*.07):0,
 wind:type==='wind'?12+i*.16:0,phase:(r%628)/100,speed:type==='moving'?1.1+i*.055:type==='willow'?1.25+i*.055:0,
 aimWidth:type==='moving'?Math.max(4.5,10-i*.16):Math.max(3.8,8-i*.14),aimPerfect:Math.max(1.6,3-i*.045),required:type==='volley'?3:1,
 bowName:RANKS[i].bowName.split(' · ')[0],rank:RANKS[i].title};
}
export function makeDraw(){return {raw:0,power:0,elapsed:0,rebound:false,arrow:0};}
export function isAim(bow){return bow?.type==='moving'||bow?.type==='willow';}
export function targetState(bow,draw){
 const t=draw?.elapsed||0;
 if(!isAim(bow))return {x:848,y:442,shotY:442};
 const amp=bow.type==='willow'?28:54;
 return {x:848+(bow.type==='willow'?Math.sin(t*.9+bow.phase)*16:0),y:442+Math.sin(t*bow.speed+bow.phase)*amp,shotY:580-(draw?.power||0)*2.2};
}
export function zoneAt(bow,draw=makeDraw()){
 if(isAim(bow)){const c=(580-targetState(bow,draw).y)/2.2;return {min:c-bow.aimWidth/2,max:c+bow.aimWidth/2,perfectMin:c-bow.aimPerfect/2,perfectMax:c+bow.aimPerfect/2};}
 const delta=bow.type==='volley'?((draw.arrow||0)-1)*1.6:0;
 return {min:bow.min+delta,max:bow.max+delta,perfectMin:bow.perfectMin+delta,perfectMax:bow.perfectMax+delta};
}
export function advanceDraw(draw,bow,dt,holding=true){
 draw.elapsed+=dt;if(!holding)return false;
 let gain=bow.gain;if(bow.wind)gain-=bow.wind*(.55+.45*Math.sin(draw.elapsed*2.6+bow.phase));
 draw.raw+=gain*dt;let rebounded=false;
 if(bow.type==='stubborn'&&!draw.rebound&&draw.raw>=57){draw.raw-=11;draw.rebound=true;rebounded=true;}
 draw.power=Math.max(0,draw.raw+bow.wobble*Math.sin(draw.elapsed*9));return rebounded;
}
export function judge(bow,power,draw){
 const zone=zoneAt(bow,draw);
 if(power<zone.min)return {kind:'short',gap:zone.min-power};
 if(power>zone.max)return {kind:'over',gap:power-zone.max};
 return {kind:power>=zone.perfectMin&&power<=zone.perfectMax?'perfect':'good',gap:0};
}
export function points(kind,streak){return (kind==='perfect'?250:100)+Math.min(5,Math.max(0,streak-1))*25;}
export function titleFor(cleared){return rankFor(cleared);}
