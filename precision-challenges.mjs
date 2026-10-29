import {account} from './camp-economy.mjs';
export const PRECISION=[
 {index:3,title:'听风穿帘',skill:'时机',rule:'两轮旗帘节奏不同，看箭到时的空隙。',gift:'relic-2-5',reward:'旗角布片'},
 {index:0,title:'启门取印',skill:'顺序',rule:'先断门索，再穿门取靶，最后收下印靶。',gift:'relic-5-3',reward:'封帅印拓'},
 {index:1,title:'巧箭清坛',skill:'路线',rule:'选稳妥双靶，或用一箭触发三坛连锁。',gift:'relic-0-0',reward:'封签酒坛'}
];
export function challengeReward(p,s){const spec=PRECISION.find(x=>x.index===s.index);if(!s.done||!spec)return null;p.precisionRecords??={};const old=p.precisionRecords[s.index],row={shots:s.shots,perfect:s.perfect,route:s.route,at:Date.now()};if(!old||row.shots<old.shots||row.shots===old.shots&&row.perfect>old.perfect)p.precisionRecords[s.index]=row;
 const a=account(p),id='precision-first-'+s.index;if(a.receipts[id])return {first:false,name:spec.reward};a.receipts[id]=true;a.balance+=50;a.earned+=50;a.ledger.unshift({id,label:'精进 · '+spec.title,amount:50,at:Date.now()});a.ledger=a.ledger.slice(0,60);p.loot??={};p.loot[spec.gift]=(p.loot[spec.gift]||0)+1;return {first:true,name:spec.reward};}
