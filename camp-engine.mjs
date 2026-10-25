import {LATER_CHAPTERS,CHAPTER_ENDINGS} from './camp-later.mjs';
import {makeBow,makeDraw,zoneAt,judge,flightTime} from './engine.mjs?v=camp-impact2';
export const MISSIONS=[
 {title:'先稳住这一箭',story:'伙头兵：想借弓？先让我看看你手稳不稳。',targets:['disc'],win:'行，手不抖。来帮我清几个破坛子。'},
 {title:'旧坛换新酒',story:'伙头兵：这些是空坛，放开手射。碎了算我的。',targets:['jar'],win:'好！这一箭够利落。营门那盏灯也交给你了。'},
 {title:'一箭落灯',story:'教头：看清楚，要断的是绳结，不是灯笼。',targets:['rope'],win:'知道往哪里射，比使蛮力重要。'},
 {title:'破盾露心',story:'教头：先破外盾，再取靶心。别急，一箭做一件事。',targets:['shield','disc'],win:'盾破了，心也准。这张弓，你拿得住。'},
 {title:'伙房小考',story:'伙头兵：最后三箭，打坛、断绳、取靶心。我们都看着呢。',targets:['jar','rope','disc'],win:'伙头兵把旧弓递过来：拿去吧。明日操练，别迟到。'}
];
export const CHAPTER_NAMES=['伙房借弓','营门当值','追风练场','马上试锋','飞鸿初试',...LATER_CHAPTERS.map(c=>c[0])];
const later=[
 ['营门当值',[
 ['晨哨摘灯','哨长：先卸下旧灯，别惊动歇息的弟兄。',['rope']],
 ['清点旧盾','军械官：两面旧盾，都交给你验。',['shield','shield']],
 ['远处的空坛','伙头兵把坛子搬远：这次还射得碎吗？',['jar']],
 ['一箭开营门','哨长：先断门闩绳，等门升起，再射门后的靶。',['latch','gate']],
 ['交班之前','灯、盾、靶，一件件办妥，才算当好了这班哨。',['rope','shield','disc']]]],
 ['追风练场',[
 ['靶动心不动','教头拉动滑索：盯住它将到的位置。',['disc']],
 ['旗开见靶','教头：旗帘开合有节奏。看准箭到时能不能穿过。',['flag']],
 ['风中的灯','绳结随风摆动，等稳了再松手。',['rope']],
 ['行进破盾','靶架还在动，破盾之后仍要重新瞄。',['shield','disc']],
 ['追风小考','三种移动目标，逐一拿下。',['jar','rope','disc']]]],
 ['马上试锋',[
 ['初上马背','骑射教头：先习惯马步，别急着满弓。',['disc']],
 ['马上击坛','马背起伏会带动箭头，看好力道区。',['jar']],
 ['驰马断绳','稳住上身，射的是绳结。',['rope']],
 ['骑射破阵','先破盾，再补一箭。马步不停。',['shield','disc']],
 ['骑射验收','一轮三箭，让马步和松弦合上拍子。',['jar','shield','disc']]]],
 ['飞鸿初试',[
 ['远阵开弓','教头换上远靶：今日试你真正的本事。',['disc']],
 ['风过营灯','风在变，绳结在摆。可以收弓重来。',['rope']],
 ['双盾连破','每一面盾都要单独瞄准，别照搬上一箭的力道。',['shield','shield','disc']],
 ['驰马追风','马背与靶架同时移动，提前判断落点。',['jar','disc']],
 ['飞鸿初试','从伙房借来的弓，如今已握得稳稳当当。',['jar','latch','gate','flag']]]]
];
for(const [chapter,rows] of [...later,...LATER_CHAPTERS])for(const [title,story,targets] of rows)MISSIONS.push({chapter,title,story,targets,win:title==='飞鸿初试'?'教头点头：此后，你可以独当一面了。':'办得漂亮。歇口气，再接下一项。'});
MISSIONS.forEach((m,i)=>{if(i%5===4)m.win=CHAPTER_ENDINGS[Math.floor(i/5)];});
export const TARGETS={latch:{name:'门闩绳结',hint:'射断绳结，拉起营门。',radius:19,y:410},gate:{name:'门后圆靶',hint:'营门已升起，取门后的靶心。',radius:29,y:442},flag:{name:'开合旗靶',hint:'旗帘会遮挡箭；看“到箭时”提示，再决定何时松手。',radius:32,y:442},disc:{name:'草靶',hint:'射中圆靶，先练稳松手。',radius:34,y:442},jar:{name:'空酒坛',hint:'射中坛身，把旧坛打碎。',radius:32,y:460},rope:{name:'吊灯绳结',hint:'瞄准灯上方发亮的绳结；射灯身不算。',radius:16,y:410},shield:{name:'训练木盾',hint:'第一箭破盾，第二箭取露出的靶心。',radius:38,y:442}};
export function createCamp(){return {mission:0,phase:0,shots:0,misses:0,hits:0,complete:false,awaitingNext:false};}
export function campTarget(s){return MISSIONS[s.mission].targets[s.phase];}
export function campBow(s){const kind=campTarget(s),spec=TARGETS[kind],bow={...makeBow(0,'camp-story'),index:0,chapter:0,mounted:false,moving:false,speed:0,targetAmplitude:0,distance:35,strength:1,gain:29,required:1,radius:spec.radius,targetY:spec.y,kind};const chapter=Math.floor(s.mission/5),step=s.mission%5; if(chapter){Object.assign(bow,{index:chapter===4?40:chapter===3?20:chapter*5,chapter:chapter===4?8:chapter,distance:40+chapter*8+step*3,mounted:chapter===3||chapter===4&&step>=3,rideAmplitude:chapter===3?10:15,moving:chapter===2||chapter===4,speed:chapter===2?.6+step*.12:chapter===4?.9:0,targetAmplitude:chapter===2?12+step*3:chapter===4?20:0,wind:chapter===4?5:0,radius:spec.radius*(chapter===4?.85:1)});} if(chapter>=5){const moving=[6,7,8,9].includes(chapter),mounted=chapter===8||chapter===9&&step>=3;Object.assign(bow,{index:s.mission,chapter,distance:Math.min(125,78+(chapter-5)*8+step*3),strength:1.2,wind:chapter===6||chapter===9?6:0,moving,mounted,speed:moving?.65+step*.1:0,targetAmplitude:moving?(chapter===7?12:20):0,rideAmplitude:mounted?12:0,radius:spec.radius*(chapter===7?.7:chapter===9?.8:.9)});} Object.assign(bow,zoneAt(bow,makeDraw()));return bow;}
export function flagOpen(bow,draw,offset=0){return bow.kind!=='flag'||Math.cos(((draw?.elapsed||0)+offset)*2*Math.PI/3.6)>-.25;}
export function campJudge(s,power,draw){const bow=campBow(s),r=judge(bow,power,draw);const aligned=['good','perfect'].includes(r.kind),blocked=aligned&&!flagOpen(bow,draw,flightTime(bow)),hit=aligned&&!blocked;return {...r,kind:blocked?'blocked':r.kind,blocked,hit,bodyHit:bow.kind==='rope'&&!hit&&r.impact.shotY>bow.targetY+18&&r.impact.shotY<bow.targetY+90};}
// Called once, only after the arrow reaches the target; misses preserve solved stages.
export function settleCamp(s,result){if(s.complete||s.awaitingNext)return false;s.shots++;if(!result.hit){s.misses++;return false;}s.hits++;if(s.phase+1<MISSIONS[s.mission].targets.length)s.phase++;else s.awaitingNext=true;return true;}
export function nextMission(s){if(!s.awaitingNext)return false;if(s.mission===MISSIONS.length-1){s.complete=true;return true;}s.mission++;s.phase=0;s.awaitingNext=false;return true;}
