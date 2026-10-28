import {TRINKETS} from './camp-loot.mjs';
import {GOODS} from './camp-economy.mjs';
import {HONORS} from './camp-honors.mjs';
import {QUESTS,titlesFor} from './camp-rewards.mjs';
import {SECRETS,growthTitles} from './camp-growth.mjs';
import {atlasIcon,RELIC_RECTS} from './atlas-art.mjs?v=reward60';

export function appendEarned(body,p){
  const overview=body.querySelector('.finale-lead');
  const shortcuts=document.createElement('span');shortcuts.className='finale-shortcuts';
  for(const [label,href] of [['历练星图','archive.html#journey'],['营中委托','archive.html#quests'],['百宝藏阁','archive.html#loot'],['军需装备','archive.html#armory']]){const a=document.createElement('a');a.textContent=label+' ↗';a.href=href;shortcuts.append(a);}
  overview.append(shortcuts);
  const groups=[['军功封赏',[
    `累计军饷 ${p.armory?.earned||0} 文 · 当前结余 ${p.armory?.balance||0} 文`,
    ...HONORS.flatMap(([rank,grade],c)=>p.honors?.[c]?[`第${c+1}回封赏 · ${rank} · ${grade}`]:[]),
  ]],['同袍与奇遇',[
    ...QUESTS.filter(q=>p.quests?.[q.id]?.claimed).map(q=>`${q.npc} · ${q.title} · 已领谢礼`),
    ...SECRETS.filter(s=>p.secrets?.[s.id]).map(s=>`营中奇遇 · ${s.name}`),
  ]],['所得称号',[
    ...[...new Set([...titlesFor(p),...growthTitles(p)])].map(title=>`获得称号 · ${title}`),
  ]],['随身装备',[
    ...GOODS.filter(g=>p.armory?.items?.[g.id]).map(g=>`${g.name} · ${p.armory.items[g.id]}阶${p.armory.equipped?.[g.slot]===g.id?' · 已装备':''}`),
  ]],...[...new Set(TRINKETS.map(t=>t.group))].map(group=>['收藏 · '+group,TRINKETS.filter(t=>t.group===group&&p.loot?.[t.id]).map(t=>`${t.name} ×${p.loot[t.id]} · ${t.rarity}`)])];
  const fragment=document.createDocumentFragment();
  for(const [label,rows] of groups){
    const section=document.createElement('section');section.className='finale-todo finale-earned';
    const title=document.createElement('h3');title.textContent=label;section.append(title);
    const list=document.createElement('details');list.open=true;
    const summary=document.createElement('summary');summary.textContent=label;list.append(summary);
    for(const text of rows.length?rows:['尚未获得，归营后仍可继续寻访。']){
      const row=document.createElement('p');row.textContent=text;
      if(label.startsWith('收藏 · ')){
        const item=TRINKETS.find(t=>text.startsWith(t.name+' ×'));
        if(item){const icon=document.createElement('span');icon.className='finale-relic-icon';atlasIcon(icon,item.art||'art/relics-v1.webp',item.rect||RELIC_RECTS[TRINKETS.indexOf(item)],item.name);row.prepend(icon);row.className='finale-relic-row';}
      }
      list.append(row);
    }
    section.append(list);fragment.append(section);
  }
  body.prepend(fragment);
  const onward=document.createElement('section');onward.className='finale-todo';
  const heading=document.createElement('h3');heading.textContent='凯旋之后 · 再启一程';onward.append(heading);
  for(const [label,description,href] of [
    ['补齐三星','重访各回，完成尚未达成的挑战条件。','archive.html#journey'],
    ['赴同袍之约','查看可接委托、任务进展与待领谢礼。','archive.html#quests'],
    ['补全百宝藏阁','查看未得藏品线索，整理重复藏品。','archive.html?filter=missing#loot'],
    ['精进弓术','进入演武场练习机关节奏。','field.html']
  ]){const row=document.createElement('article');row.className='finale-chapter';const a=document.createElement('a');a.className='finale-action';a.href=href;a.textContent=label+' →';const detail=document.createElement('p');detail.textContent=description;row.append(a,detail);onward.append(row);}
  body.append(onward);
}
