export const EQUIPMENT={
 'relic-3-7':{name:'行军地图',note:'主线关卡详情显示当前机关的行动顺序。'},
 'relic-5-2':{name:'教头手札',note:'主线拉弓时显示练习落点提示。'},
 'relic-1-2':{name:'护弓绳',note:'主线蓄力放慢 8%，留出细调时间。'},
 'relic-3-0':{name:'小马蹄铁',note:'主线骑射起伏减少 10%；站射不生效。'}
};
export function activeEquipment(p,competitive=false){return !competitive&&EQUIPMENT[p.tool]&&p.loot?.[p.tool]>0?p.tool:null;}
export function applyEquipment(b,s){if(s.trialSeed||s.competitive)return b;if(s.tool==='relic-1-2')b.gain*=.92;if(s.tool==='relic-3-0'&&b.mounted)b.rideAmplitude*=.9;return b;}

export function migrateQuestTools(p){if(p.questToolsV5)return;const gifts={cook:'relic-1-2',guard:'relic-3-7',coach:'relic-3-0',coach2:'relic-5-2'};p.loot??={};for(const [id,gift]of Object.entries(gifts))if(p.quests?.[id]?.claimed)p.loot[gift]=Math.max(1,p.loot[gift]||0);p.questToolsV5=true;}
