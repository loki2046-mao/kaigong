import {renderDecree} from './ceremony-ui.mjs';
export function openHistoricalDecree(profile,chapter){
 let dialog=document.getElementById('history-decree');if(!dialog){dialog=document.createElement('dialog');dialog.id='history-decree';dialog.className='finale-dialog finale-paged decree-history-dialog';dialog.setAttribute('aria-label','重阅历史制书');document.body.append(dialog);}dialog.replaceChildren();const top=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button');title.textContent='第 '+(chapter+1)+' 回 · 封赏';close.textContent='返回';close.onclick=()=>dialog.close();top.append(title,close);const host=document.createElement('section');dialog.append(top,host);renderDecree(host,profile,chapter);dialog.showModal();
}
