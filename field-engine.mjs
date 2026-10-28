import {makeBow,makeDraw,judge,flightTime,advanceDraw,zoneAt} from './engine.mjs';

export const EXERCISES=[
 {title:'断索开路',rule:'先断索，再趁门开取靶。',steps:['latch','gate'],theme:'autumn',ending:'绳断、门开、箭入。你已经读懂了机关的顺序。'},
 {title:'一箭双功',rule:'选稳妥双靶，或击小坛触发连锁。',steps:['disc','disc'],theme:'autumn',ending:'稳扎稳打和巧用机关，都能办成这件差事。'},
 {title:'护粮试射',rule:'瞄准车上的制动绳，射中就能停下粮车。',steps:['latch'],theme:'fort',ending:'粮车稳稳停住，伙头兵的晚饭保住了。'},
 {title:'听铃辨隙',rule:'看「到箭时」的开合提示，穿过两轮旗帘。',steps:['flag','flag'],theme:'outpost',ending:'两箭穿帘。看准空隙，比一直满弓更有用。'},
 {title:'风中取信',rule:'选普通靶过关，或断索取回风中的密信。',steps:['disc'],theme:'outpost',ending:'风声里的线索，已经留在你的演武册中。'},
 {title:'校尉演武',rule:'断索、穿门、过帘，最后击坛收阵。',steps:['latch','gate','flag','jar'],theme:'fort',ending:'机关有先后，开弓有取舍。六场演武，功成。'}
];
export function createExercise(index=0){return {index:Math.max(0,Math.min(5,index)),phase:0,route:'safe',shots:0,hits:0,perfect:0,misses:0,done:false,openedAt:null,elapsed:0};}
export function exerciseSteps(s){if(s.index===1&&s.route==='risk')return ['jar'];if(s.index===4&&s.route==='risk')return ['rope'];return EXERCISES[s.index].steps;}
export function exerciseBow(s){const kind=exerciseSteps(s)[s.phase];return {...makeBow(0,'field-training'),index:0,chapter:0,type:'soft',phase:.2,kind,distance:48+s.index*3,strength:1,gain:27,wobble:0,wind:s.index===4?5:0,mounted:false,moving:s.index===2||s.index===4,speed:s.index===2?1.5:.8,targetAmplitude:s.index===4?12:0,horizontalAmplitude:s.index===2?42:0,horizontalSpeed:s.index===2?.9:0,rideAmplitude:0,radius:s.index===1&&s.route==='risk'?19:kind==='latch'||kind==='rope'?22:32,targetY:kind==='latch'||kind==='rope'?410:442,required:1};}
export function exerciseOpen(s,elapsed){const kind=exerciseSteps(s)[s.phase];if(kind==='flag')return Math.cos(elapsed*2*Math.PI/3.6)>-.25;if(kind==='gate'&&s.openedAt!==null)return ((elapsed-s.openedAt)%4+4)%4<2.6;return true;}
export function exerciseJudge(s,power,draw=makeDraw()) {const b=exerciseBow(s),r=judge(b,power,draw),aligned=['good','perfect'].includes(r.kind),blocked=aligned&&!exerciseOpen(s,draw.elapsed+flightTime(b));return {...r,kind:blocked?'blocked':r.kind,blocked,hit:aligned&&!blocked};}
export function settleExercise(s,r){if(s.done)return false;s.shots++;if(!r.hit){s.misses++;return false;}s.hits++;if(r.kind==='perfect')s.perfect++;if(exerciseSteps(s)[s.phase]==='latch')s.openedAt=s.elapsed;if(s.phase+1<exerciseSteps(s).length)s.phase++;else s.done=true;return true;}
export function exerciseStars(s){return s.done?1+Number(s.misses===0)+Number(s.perfect>0):0;}
export function finishExercise(book,s){if(!s.done)return false;book.best??={};const row={stars:exerciseStars(s),shots:s.shots,perfect:s.perfect,route:s.route};const old=book.best[s.index];if(!old||row.stars>old.stars||row.stars===old.stars&&row.shots<old.shots)book.best[s.index]=row;if(s.index===4&&s.route==='risk')book.letter=true;book.progress={...s};return true;}
export function restoreExercise(raw){if(!raw||!Number.isInteger(raw.index)||raw.index<0||raw.index>5)return createExercise();const s={...createExercise(raw.index),...raw,route:raw.route==='risk'?'risk':'safe'};if(!Number.isInteger(s.phase)||s.phase<0||s.phase>=exerciseSteps(s).length)return createExercise(s.index);for(const k of ['shots','hits','perfect','misses','elapsed'])if(!Number.isFinite(s[k])||s[k]<0)s[k]=0;s.done=raw.done===true;s.openedAt=Number.isFinite(s.openedAt)?s.openedAt:null;return s;}

// The ruler slows inside the visible hit band; rendering and judgement keep one clock.
export function advanceExerciseDraw(draw,bow,dt,holding=true){
 const z=zoneAt(bow,draw);
 const near=holding&&draw.power>=z.min-1&&draw.power<=z.max+1;
 return advanceDraw(draw,near?{...bow,gain:bow.gain*.32}:bow,dt,holding);
}
