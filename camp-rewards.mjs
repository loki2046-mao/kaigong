import {chapterScore} from './camp-challenge.mjs';
export const QUESTS=[{id:'cook',npc:'伙头兵老周',title:'新酒待客',story:'帮我击碎三只旧空坛，新酒就有地方放了。',kind:'jar',goal:3,reward:'伙房贵客'},{id:'guard',npc:'斥候阿雀',title:'灯火归营',story:'替晚归的弟兄卸下两盏旧灯，只射绳结。',kind:'rope',goal:2,reward:'灯火守望'},{id:'coach',npc:'教头沈砺',title:'马上见真章',story:'在马背上命中五箭，让大家看看你的稳劲。',kind:'mounted',goal:5,reward:'马上神射'}];
QUESTS.push(
 {id:'cook2',requires:'cook',npc:'伙头兵老周',title:'席前试弓',story:'酒坛收拾好了。再替我打中四次圆靶，给开席助助兴。',kind:'disc',goal:4,reward:'席间神箭'},
 {id:'guard2',requires:'guard',npc:'斥候阿雀',title:'开门迎归人',story:'旧灯卸下来了。再替我射断两次门闩绳，迎弟兄归营。',kind:'latch',goal:2,reward:'归营引路人'},
 {id:'coach2',requires:'coach',npc:'教头沈砺',title:'穿旗定心',story:'马步稳了，再穿过三次开合旗靶，练一练眼力与耐心。',kind:'flag',goal:3,reward:'穿旗定心'});
export function questAvailable(p,q){return !q.requires||!!p.quests?.[q.requires]?.claimed;}
export function chapterStars(profile,index){return Math.max(profile.bestChapters?.[index]?.stars||0,chapterScore(profile.records,index)?.stars||0);}
export function titlesFor(p){return ['初入军营',...Object.values(p.honors||{}).map(h=>h.rank),...QUESTS.filter(q=>p.quests?.[q.id]?.claimed).map(q=>q.reward),...(Array.from({length:12},(_,i)=>chapterStars(p,i)).some(n=>n===3)?['三星彩弓']:[]),...(p.progress?.complete?['封帅归来']:[])];}
export function questHit(p,result,kind,mounted){if(!result.hit)return;for(const q of QUESTS){const state=p.quests?.[q.id];if(state&&!state.claimed&&(q.kind===kind||q.kind==='perfect'&&result.kind==='perfect'||q.kind==='mounted'&&mounted))state.count=Math.min(q.goal,(state.count||0)+1);}}

const gifts={cook:'relic-1-2',guard:'relic-3-7',coach:'relic-3-0',cook2:'relic-0-1',guard2:'relic-2-2',coach2:'relic-5-2'};QUESTS.forEach(q=>q.gift=gifts[q.id]);
QUESTS.push({id:'scribe',npc:'书吏温简',title:'记下三次神射',story:'让我把三次正中靶心写进军中手记。',kind:'perfect',goal:3,reward:'笔下有名',gift:'relic-5-2'});
