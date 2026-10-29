import {PROFILE_KEY,cleanName} from './camp-profile.mjs';
export const RECOVERY_KEY='kg-profiles-before-restore-v1';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function parseBackup(text){
 if(typeof text!=='string'||text.length>5_000_000)throw Error('请选择 5 MB 以内的开弓存档文件。');
 let book;try{book=JSON.parse(text);}catch{throw Error('文件不是有效的存档，请重新选择。');}
 if(!object(book)||!Array.isArray(book.slots)||book.slots.length!==3||!Number.isInteger(book.active)||book.active<0||book.active>2)throw Error('这不是开弓的三个档案备份。');
 const forbidden=new Set(['__proto__','constructor','prototype']);
 function inspect(value,depth=0){if(depth>40)throw Error('存档结构异常。');if(value&&typeof value==='object')for(const [key,child]of Object.entries(value)){if(forbidden.has(key))throw Error('存档含有不支持的字段。');inspect(child,depth+1);}}
 inspect(book);
 for(const p of book.slots){if(p===null)continue;
  if(!object(p)||typeof p.name!=='string'||[...p.name].length>64||!['female','male'].includes(p.character))throw Error('档案姓名或人物格式不正确。');
  if(p.progress!=null&&(!object(p.progress)||!Number.isInteger(p.progress.mission)||p.progress.mission<0||p.progress.mission>60))throw Error('档案关卡记录不正确。');
  p.name=cleanName(p.name);
  for(const key of ['records','loot','quests','honors','bestChapters','armory','stories','precisionRecords'])if(p[key]!=null&&!object(p[key]))throw Error('档案内容不完整：'+key);
  for(const [id,n]of Object.entries(p.loot||{}))if(!Number.isSafeInteger(n)||n<0)throw Error('藏品数量不正确。');
  for(const key of ['records','quests','honors','bestChapters','precisionRecords'])for(const row of Object.values(p[key]||{}))if(!object(row))throw Error('战绩记录格式不正确。');
  if(p.armory){for(const key of ['balance','earned'])if(p.armory[key]!=null&&(!Number.isFinite(p.armory[key])||p.armory[key]<0))throw Error('军饷记录不正确。');for(const key of ['items','equipped','receipts'])if(p.armory[key]!=null&&!object(p.armory[key]))throw Error('装备记录不正确。');if(p.armory.ledger!=null&&!Array.isArray(p.armory.ledger))throw Error('军饷账簿格式不正确。');}
  const story=p.stories?.['warm-return'];if(story&&(!object(story)||!['new','first','first-ready','second','reward','complete'].includes(story.stage)||story.stage!=='new'&&!['supper','lantern'].includes(story.choice)))throw Error('营中故事记录不正确。');
  if(p.runs!=null&&!Array.isArray(p.runs))throw Error('历练记录格式不正确。');
 }
 if(!book.slots.some(Boolean))throw Error('备份中没有弓手档案。');
 return book;
}
export function restoreBackup(storage,book){
 const verified=parseBackup(JSON.stringify(book)),previous=storage.getItem(PROFILE_KEY);
 // Write recovery first: if quota is exhausted, the original remains untouched.
 if(previous!==null)storage.setItem(RECOVERY_KEY,previous);
 storage.setItem(PROFILE_KEY,JSON.stringify(verified));
 return verified;
}
