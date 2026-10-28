// One bounded sheet at a time, with direct category navigation.
export function paginateFinale(dialog){
  dialog.classList.add('finale-paged');
  const hero=dialog.querySelector('.finale-hero'),body=dialog.querySelector('.finale-body');
  const children=[...body.children],metrics=body.querySelector('.finale-metrics'),lead=body.querySelector('.finale-lead'),scroll=body.querySelector('.finale-scroll');
  let page=0;
  const pages=[{nodes:[hero,metrics,lead],label:'凯旋战报',group:'凯旋战报'},{nodes:[scroll],label:'最后一道制书',group:'封赏制书'}];
  scroll.open=true;
  for(const section of body.querySelectorAll('.finale-todo')){
    const rows=[...section.querySelectorAll(':scope > .finale-chapter')],details=section.querySelector('details,.finale-item-list');
    const items=rows.length?rows:details?[...details.querySelectorAll(':scope > p')]:[];
    if(details)details.open=true;
    const collection=section.classList.contains('finale-collection');
    const size=collection?(innerWidth<700&&innerHeight<700?4:8):rows.length?(innerWidth<700?1:2):4;
    const label=section.querySelector('h3').textContent;
    const group=section.dataset.finaleGroup||'待完成';
    for(let i=0;i<Math.max(1,items.length);i+=size)pages.push({nodes:[section],section,items,visible:items.slice(i,i+size),label,group});
  }
  const nav=document.createElement('nav');nav.className='finale-pagination';
  const prev=document.createElement('button'),next=document.createElement('button'),jump=document.createElement('select');
  prev.textContent='← 上一页';next.textContent='下一页 →';jump.setAttribute('aria-label','选择战报分类');
  const groups=[...new Set(pages.map(p=>p.group))];
  for(const group of groups){const option=document.createElement('option');option.value=group;option.textContent=group;jump.append(option);}
  const counter=document.createElement('span');counter.className='finale-page-count';counter.setAttribute('aria-live','polite');
  const middle=document.createElement('div');middle.className='finale-page-picker';middle.append(jump,counter);
  nav.append(prev,middle,next);dialog.append(nav);dialog.dataset.pageCount=pages.length;
  const paint=()=>{
    const current=pages[page],siblings=pages.filter(p=>p.group===current.group);
    hero.hidden=!current.nodes.includes(hero);
    for(const el of children)el.hidden=!current.nodes.includes(el);
    for(const el of current.items||[])el.hidden=!current.visible.includes(el);
    dialog.dataset.finalePage=page;jump.value=current.group;
    prev.disabled=page===0;next.disabled=page===pages.length-1;
    counter.textContent=current.label+' · '+(siblings.indexOf(current)+1)+' / '+siblings.length;
    nav.setAttribute('aria-label',current.label);dialog.scrollTop=0;
  };
  jump.onchange=()=>{page=pages.findIndex(p=>p.group===jump.value);paint();};
  prev.onclick=()=>{if(page>0)page--;paint();};next.onclick=()=>{if(page<pages.length-1)page++;paint();};
  paint();
}
