import {storyState} from './camp-story.mjs';
import {MISSIONS,CHAPTER_NAMES} from './camp-engine.mjs';
import {TRINKETS} from './camp-loot.mjs';
import {chapterStars} from './camp-rewards.mjs';
import {chapterUnlocked} from './camp-challenge.mjs';
import {GOODS,account} from './camp-economy.mjs';
import {EQUIPMENT} from './camp-equipment.mjs';
export function objectiveOptions(p){
 const mission=Math.min(MISSIONS.length-1,p.progress?.mission||0);
 const options=[{id:'main',label:p.progress?.complete?'主线已通关':'继续军营历练',detail:p.progress?.complete?'六十关已完成，可追踪补星或收藏。':`${CHAPTER_NAMES[Math.floor(mission/5)]} · ${MISSIONS[mission].title}`,href:'camp.html',done:!!p.progress?.complete}];
 const story=storyState(p);options.push({id:'story',label:'老周 · 归营热饭',detail:story.stage==='complete'?'故事已完成，可回看营中往事。':['first-ready','reward'].includes(story.stage)?'老周有新的话要对你说。':'留一顿热饭，也为归人留一盏灯。',done:story.stage==='complete',href:'camp.html?story=warm-return'});
 options.push({id:'precision',label:'精进三试',detail:'时机、顺序、路线 · 独立战绩与首胜纪念',href:'field.html?mode=challenge'});
 for(let c=0;c<CHAPTER_NAMES.length;c++)if(chapterUnlocked(p,c)&&chapterStars(p,c)<3)options.push({id:'stars:'+c,label:'补星 · '+CHAPTER_NAMES[c],detail:`${chapterStars(p,c)} / 3 星 · 重挑战保留最佳纪录`,href:'camp.html?chapter='+c,kind:'stars'});
 for(const item of TRINKETS)if(!p.loot?.[item.id])options.push({id:'loot:'+item.id,label:'寻找 · '+item.name,detail:item.group+' · 可用 3 件重复藏品定向换取',href:'archive.html?item='+item.id+'#loot',kind:'loot'});
 return options;
}
export function currentObjective(p){const options=objectiveOptions(p);return options.find(o=>o.id===(p.objective||'main'))||{id:p.objective||'main',label:'目标已完成',detail:'这一项已收入军功录，选一个新目标吧。',done:true,href:'archive.html#journey'};}
export function rewardUse(item){if(EQUIPMENT[item.id])return {text:EQUIPMENT[item.id].note,action:'查看并装备',href:'archive.html?item='+item.id+'#loot'};return {text:`收录于「${item.group}」，集齐套组可获称号；重复藏品可兑换缺项。`,action:'查看藏品与套组',href:'archive.html?item='+item.id+'#loot'};}
export function nextPurchase(p){const a=account(p),g=GOODS.find(g=>!a.items[g.id]);return g?{...g,missing:Math.max(0,g.price-a.balance)}:null;}
