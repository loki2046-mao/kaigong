import {chapterScore} from './camp-challenge.mjs';
import {TRINKETS} from './camp-loot.mjs';
import {QUESTS} from './camp-rewards.mjs';
import {SECRETS} from './camp-growth.mjs';
export const HONORS=[['陪戎校尉','从九品上'],['仁勇校尉','正九品上'],['御侮校尉','从八品上'],['宣节校尉','正八品上'],['翊麾校尉','从七品上'],['致果校尉','正七品上'],['振威校尉','从六品上'],['昭武校尉','正六品上'],['游击将军','从五品下'],['宁远将军','正五品下'],['定远将军','正五品上'],['云麾将军','从三品上']];
const MERITS=['初习弓矢，勤于肄业，进退有节，始见可嘉。','谨守营门，明辨先后，临事不苟，职守有成。','迎风试射，审势调弦，心手渐一，技艺日进。','驰马引弓，动中持正，弦发有准，足见精勤。','披坚执锐，屡试不怠，能以定志，成其良技。','远戍边营，备历险阻，持弓愈稳，临事愈明。','当风守望，不失其节，警备有方，堪任所寄。','穿杨校艺，审机应变，锐而能静，勇而有谋。','踏雪巡边，寒苦不辞，马步虽疾，弓心不移。','校场较艺，诸试有成，所习既精，足为军中之劝。','巡护粮道，清障启关，勤于所职，军行赖之。','自习射以至巡边，备经诸试，志不稍懈；能守其职，能济其事，宜加褒进，以劝来者。'];
export function awardHonors(p,c){if(!Number.isInteger(c)||!HONORS[c])return null;p.honors??={};if(p.honors[c])return null;const h={chapter:c,rank:HONORS[c][0],grade:HONORS[c][1],at:Date.now()};p.honors[c]=h;return h;}
export function earnedChapter(p,c){return [p.records,...(p.runs||[]).map(r=>r.records)].some(rows=>Array.from({length:5},(_,i)=>rows?.[c*5+i]?.finished).every(Boolean));}
export function restoreHonors(p){for(let c=0;c<12;c++)if(earnedChapter(p,c))awardHonors(p,c);}
export function playerName(p){const name=String(p.name||'').trim();return name&&name!=='无名弓手'?name:'——';}
export function decree(p,c){const [rank,grade]=HONORS[c];return {rank,grade,title:`授${playerName(p)}${rank}制`,body:`门下：\n${playerName(p)}，${MERITS[c]}\n可授${rank}。勉修武备，毋怠厥职。\n主者施行。`};}
export function completion(p){const sources=[p.records,...(p.runs||[]).map(r=>r.records)],chapters=HONORS.map((_,c)=>{const scores=[p.bestChapters?.[c],...sources.map(r=>chapterScore(r,c))].filter(Boolean);const score=scores.sort((a,b)=>b.stars-a.stars||b.accuracy-a.accuracy)[0];return {chapter:c,stars:score?.stars||0,checks:score?.checks||[false,false,false],finished:earnedChapter(p,c)};});const missing=TRINKETS.filter(t=>!p.loot?.[t.id]);const quests=QUESTS.filter(q=>!p.quests?.[q.id]?.claimed);const secrets=SECRETS.filter(s=>!p.secrets?.[s.id]);return {chapters,stars:chapters.reduce((n,c)=>n+c.stars,0),missing,quests,secrets,complete:chapters.every(c=>c.finished),collected:TRINKETS.length-missing.length,total:TRINKETS.length};}
