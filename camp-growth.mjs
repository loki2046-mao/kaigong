import {TRINKETS} from './camp-loot.mjs';
export const RANKS=['初试弓弦','校场新锐','百步好手','破阵先锋','飞鸿名将','弓道宗师'];
export const THRESHOLDS=[0,120,360,750,1300,2100];
export const SET_TITLES=['伙房知己','校场拾光人','营门守望者','马背旧友','山河收藏家','归营故人'];
export const SECRETS=[
{id:'comeback',name:'失之东隅',hint:'失手之后，仍有漂亮的下一箭。',gift:'relic-1-5'},
{id:'triple',name:'三箭惊营',hint:'让靶心接连响起三次。',gift:'relic-2-0'},
{id:'rider',name:'马背听风',hint:'马不停步，心却可以停稳。',gift:'relic-3-6'},
{id:'knot',name:'解铃人',hint:'细小的绳结，也值得认真瞄准。',gift:'relic-2-2'}];
export function growth(p){const best={};for(const source of [...(p.runs||[]).map(r=>r.records||{}),p.records||{}])for(const [key,r] of Object.entries(source)){const old=best[key]||{};best[key]={finished:old.finished||r.finished,hits:Math.max(old.hits||0,r.hits||0),perfect:Math.max(old.perfect||0,r.perfect||0)};}const records=Object.values(best);const xp=records.reduce((n,r)=>n+(r.finished?30:0)+Math.min(20,r.hits||0)*2+Math.min(10,r.perfect||0)*5,0);let level=0;while(level<THRESHOLDS.length-1&&xp>=THRESHOLDS[level+1])level++;return {xp,level,name:RANKS[level],next:THRESHOLDS[level+1]||null};}
export function sets(p){return SET_TITLES.map((title,g)=>{const items=TRINKETS.filter(i=>i.id.startsWith(`relic-${g}-`));return {id:g,name:items[0].group,title,count:items.filter(i=>p.loot?.[i.id]>0).length,items};});}
export function growthTitles(p){return [growth(p).name,...sets(p).filter(s=>s.count===8).map(s=>s.title),...SECRETS.filter(s=>p.secrets?.[s.id]).map(s=>s.name)];}
export function discover(p,result,bow){p.secrets??={};p.discoveryRun??={streak:0,missed:false};const run=p.discoveryRun;const comeback=run.missed&&result.kind==='perfect';run.streak=result.kind==='perfect'?run.streak+1:0;run.missed=!result.hit;const checks={comeback,triple:run.streak>=3,rider:bow.mounted&&result.kind==='perfect',knot:['rope','flagcord','latch'].includes(bow.kind)&&result.kind==='perfect'};const found=[];for(const secret of SECRETS){if(checks[secret.id]&&!p.secrets[secret.id]){p.secrets[secret.id]={at:Date.now()};p.loot??={};p.loot[secret.gift]=(p.loot[secret.gift]||0)+1;found.push(secret);}}return found;}
