export const GOODS=[
{id:'steady',slot:'bow',name:'定弦弓',price:90,note:'蓄力放慢 6% / 9% / 12%，便于细调。'},
{id:'swift',slot:'bow',name:'游骑弓',price:120,note:'蓄力加快 6% / 9% / 12%，适合熟练弓手。'},
{id:'wind',slot:'arrow',name:'沉羽箭',price:110,note:'风偏减少 10% / 15% / 20%。'},
{id:'broad',slot:'arrow',name:'校场箭',price:100,note:'命中范围增加 3% / 5% / 7%。'},
{id:'guard',slot:'guard',name:'稳腕护具',price:80,note:'蓄力放慢 3% / 4% / 5%。'},
{id:'saddle',slot:'mount',name:'合身马鞍',price:130,note:'骑射起伏减少 8% / 12% / 16%。'}
];
export const SLOT_NAMES={bow:'弓',arrow:'箭',guard:'护具',mount:'骑具'};
export function account(p){if(!p.armory)p.armory={balance:0,earned:0,items:{},equipped:{},receipts:{},ledger:[]};const a=p.armory;a.items??={};a.equipped??={};a.receipts??={};a.ledger??=[];return a;}
function credit(p,id,amount,label){const a=account(p);if(a.receipts[id])return 0;a.receipts[id]=true;a.balance+=amount;a.earned+=amount;a.ledger.unshift({id,label,amount,at:Date.now()});a.ledger=a.ledger.slice(0,60);return amount;}
export function migratePay(p){const a=account(p);if(a.migrated)return;const finished=new Set();for(const rows of [p.records,...(p.runs||[]).map(r=>r.records)])for(const [id,r]of Object.entries(rows||{}))if(r.finished)finished.add(id);for(const id of finished)credit(p,'first-'+id,40,'旧战绩补发 · 第'+(+id+1)+'关');for(let c=0;c<12;c++){if(Array.from({length:5},(_,i)=>String(c*5+i)).every(id=>finished.has(id)))credit(p,'chapter-'+c,80,'旧战绩补发 · 通章赏赐');if(p.bestChapters?.[c]?.stars===3)credit(p,'stars-'+c,60,'旧战绩补发 · 三星赏赐');}for(const [id,q]of Object.entries(p.quests||{}))if(q.claimed)credit(p,'quest-'+id,60,'旧委托补发');a.migrated=true;}
export function missionPay(p,mission,eventId){const a=account(p);if(a.receipts['finish-'+eventId])return {amount:0,first:false};const first=!a.receipts['first-'+mission];const amount=credit(p,first?'first-'+mission:'repeat-'+eventId,first?40:5,`${first?'首次通关':'重练通关'} · 第${mission+1}关`);a.receipts['finish-'+eventId]=true;let bonus=0;if(mission%5===4)bonus=credit(p,'chapter-'+Math.floor(mission/5),80,'通章赏赐 · 第'+(Math.floor(mission/5)+1)+'回');return {amount:amount+bonus,first,bonus};}
export function questPay(p,id){return credit(p,'quest-'+id,60,'委托赏赐');}
export function starPay(p,chapter,stars){return stars===3?credit(p,'stars-'+chapter,60,'三星赏赐 · 第'+(chapter+1)+'回'):0;}
export function buy(p,id){const a=account(p),g=GOODS.find(g=>g.id===id);if(!g||a.items[id]||a.balance<g.price)return false;a.balance-=g.price;a.items[id]=1;a.equipped[g.slot]=id;a.ledger.unshift({label:'购入 · '+g.name,amount:-g.price,at:Date.now()});a.ledger=a.ledger.slice(0,60);return true;}
export function upgradePrice(level){return level===1?90:level===2?150:null;}
export function upgrade(p,id){const a=account(p),g=GOODS.find(g=>g.id===id),cost=upgradePrice(a.items[id]);if(!g||cost===null||a.balance<cost)return false;a.balance-=cost;a.items[id]++;a.ledger.unshift({label:'强化 · '+g.name+' '+a.items[id]+'阶',amount:-cost,at:Date.now()});a.ledger=a.ledger.slice(0,60);return true;}
export function equip(p,id){const a=account(p),g=GOODS.find(g=>g.id===id);if(!g||!a.items[id])return false;if(a.equipped[g.slot]===id)delete a.equipped[g.slot];else a.equipped[g.slot]=id;return true;}
export function loadout(p,competitive=false){if(competitive)return {};const a=account(p),out={};for(const g of GOODS)if(a.equipped[g.slot]===g.id&&a.items[g.id]>=1)out[g.id]=Math.min(3,a.items[g.id]);return out;}
export function applyLoadout(b,s){if(s.competitive||s.trialSeed)return b;const l=s.loadout||{};if(l.steady)b.gain*=1-[.06,.09,.12][l.steady-1];if(l.swift)b.gain*=1+[.06,.09,.12][l.swift-1];if(l.guard)b.gain*=1-[.03,.04,.05][l.guard-1];if(l.wind)b.windScale*=1-[.1,.15,.2][l.wind-1];if(l.broad)b.radius*=1+[.03,.05,.07][l.broad-1];if(l.saddle&&b.mounted)b.rideAmplitude*=1-[.08,.12,.16][l.saddle-1];return b;}
