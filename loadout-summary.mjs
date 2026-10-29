import {GOODS,account,loadout,applyLoadout} from './camp-economy.mjs';
import {activeEquipment,applyEquipment} from './camp-equipment.mjs';
import {ARROWS,unlockArrows} from './camp-experience.mjs';
export const PRESETS=[{id:'steady',name:'稳射',note:'放慢蓄力，留出调整时间。',items:['steady','broad','guard'],arrow:'heavy'},{id:'swift',name:'追风',note:'更快出箭，也更考验松手时机。',items:['swift','wind'],arrow:'light'},{id:'rider',name:'骑射',note:'收住马步起伏，稳住手腕。',items:['steady','wind','guard','saddle'],arrow:'heavy'}];
export function equipPreset(p,id){const preset=PRESETS.find(x=>x.id===id);if(!preset)return false;const a=account(p);a.equipped={};for(const item of preset.items){const g=GOODS.find(g=>g.id===item);if(a.items[item])a.equipped[g.slot]=item;}p.arrow=unlockArrows(p).includes(preset.arrow)?preset.arrow:'standard';return true;}
export function fittingState(p){return {loadout:loadout(p),tool:activeEquipment(p),arrow:unlockArrows(p).includes(p.arrow)?p.arrow:'standard'};}
export function applyFitting(b,state){const arrow=state.arrow||'standard';b.windScale=arrow==='light'?1.45:arrow==='heavy'?.55:1;b.gain*=arrow==='light'?1.2:arrow==='heavy'?.85:1;return applyLoadout(applyEquipment(b,state),state);}
export function loadoutSummary(p){const b=applyFitting({gain:100,radius:100,rideAmplitude:100,mounted:true},fittingState(p));const signed=n=>(n>0?'+':'')+Math.round(n)+'%';return [`蓄力速度 ${signed(b.gain-100)}`,`命中范围 ${signed(b.radius-100)}`,`受风偏移 ${signed(b.windScale*100-100)}`,`骑射起伏 ${signed(b.rideAmplitude-100)}`];}
