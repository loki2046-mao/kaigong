import {STORY_CHOICES,storyState,chooseStory,advanceStory,claimStory,storyChapter} from './camp-story.mjs';
import {atlasIcon} from './atlas-art.mjs?v=reward60';
export function installStory({profile,save,beforeOpen=()=>{}}){
 const dialog=document.createElement('dialog');dialog.className='journey-dialog story-dialog';dialog.setAttribute('aria-label','老周的故事：归营热饭');document.body.append(dialog);let history=0;
 const make=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
 const chapters=choice=>[
 ['一 · 夜饭未凉','暮色将至，巡营的弟兄还没回来。老周守着灶火：“饭能热，人也得找得着路。你替我拿个主意？”'],
 ['二 · 留一张席','“多亏你。空位我也留好了。”老周把两块练弓木牌摆到远处：“替我试试新兵明日用的靶，等他们回来，也有本事可学。”'],
 ['三 · 总有人等你',choice.ending]
 ];
 function paint(){const state=storyState(profile),choice=STORY_CHOICES[state.choice]||STORY_CHOICES.supper;dialog.replaceChildren();const top=make('div','');top.className='journey-heading';const close=make('button','×');close.setAttribute('aria-label','关闭故事');close.onclick=()=>dialog.close();top.append(make('h2','归营热饭'),close);dialog.append(top);
 const portrait=make('div','');portrait.className='story-portrait';atlasIcon(portrait,'art/npc-actions-v5.webp',[627,0,313.5,300],'伙头兵老周',[1254,1254]);dialog.append(portrait);
 const stage=state.stage==='new'||state.stage==='first'?0:state.stage==='first-ready'||state.stage==='second'?1:2;const [title,body]=chapters(choice)[state.stage==='complete'?history:stage];dialog.append(make('small','伙头兵老周 · 营中往事'),make('h3',title),make('p',body));const actions=make('div','');actions.className='story-actions';const button=(label,fn)=>{const b=make('button',label);b.onclick=()=>{const before=structuredClone(profile);fn();if(save()===false){for(const key of Object.keys(profile))delete profile[key];Object.assign(profile,before);paint();const error=make('p','保存未成功，当前步骤已保留，请稍后再试。');error.setAttribute('role','alert');dialog.append(error);return;}paint();};actions.append(b);};
 if(state.stage==='new'){for(const [id,c]of Object.entries(STORY_CHOICES))button(c.label,()=>chooseStory(profile,id));dialog.append(make('small','选择会改变谢礼与饭棚陈设，均可完整走完故事。'));}
 else if(state.stage==='first'||state.stage==='second'){dialog.append(make('p',state.stage==='first'?choice.task+' · 0 / 1':`替新兵试中两次靶心 · ${state.count} / 2`));const a=make('a','去校场办差 →');a.href=storyChapter(profile);a.onclick=()=>save();actions.append(a);dialog.append(make('small','圆靶与门后靶均可试。主线和重练计入，训练与同题试射不计入。'));}
 else if(state.stage==='first-ready')button('接下试靶的事',()=>advanceStory(profile));
 else if(state.stage==='reward'){dialog.append(make('p',`老周的谢礼：${choice.giftName} · 军饷 100 文`));button('收下谢礼 · 归营落座',()=>{if(claimStory(profile))history=2;});}
 else{dialog.append(make('small',`谢礼已收入行囊 · ${choice.giftName} · 饭棚陈设已点亮`));const pager=make('div','');pager.className='journey-pager';for(const [delta,label]of [[-1,'← 上一页'],[1,'下一页 →']]){const b=make('button',label);b.disabled=delta<0?history===0:history===2;b.onclick=()=>{history+=delta;paint();};pager.append(b);if(delta<0)pager.append(make('span',`${history+1} / 3`));}dialog.append(pager);}
 dialog.append(actions);
 }
 return ()=>{beforeOpen();history=0;paint();dialog.showModal();};
}
