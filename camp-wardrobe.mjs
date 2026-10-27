export const OUTFITS=[{id:'recruit',name:'初入军营',tier:0,at:0},{id:'ranger',name:'游骑轻甲',tier:3,at:10},{id:'general',name:'赤甲将军',tier:1,at:15},{id:'silver',name:'银甲飞鸿',tier:2,at:20},{id:'winter',name:'雪境行军',tier:4,at:30}];
export function wardrobeProgress(p){return Math.max(p.progress?.complete?50:p.progress?.mission||0,...(p.runs||[]).map(r=>r.progress?.complete?50:r.progress?.mission||0));}
export function unlockedOutfits(p){return OUTFITS.filter(o=>wardrobeProgress(p)>=o.at);}
export function outfitTier(p,mission){const selected=unlockedOutfits(p).find(o=>o.id===p.outfit);if(selected)return selected.tier;return mission>=45?2:mission>=30?4:mission>=20?2:mission>=15?1:mission>=10?3:0;}
