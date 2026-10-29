import {parseBackup,restoreBackup,RECOVERY_KEY} from './profile-backup.mjs';
export function installBackupUI(){
 const anchor=document.getElementById('backup'),message=document.getElementById('message');
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;
 const open=document.createElement('button');open.textContent='从备份恢复';open.type='button';open.onclick=()=>input.click();
 const undo=document.createElement('button');undo.textContent='恢复导入前的档案';undo.type='button';undo.hidden=!localStorage.getItem(RECOVERY_KEY);
 const group=document.createElement('section');group.id='backup-controls';anchor.before(group);const intro=document.createElement('p');intro.textContent='三个档案，一份备份。换设备前下载；恢复时可预览姓名与关卡。';group.append(intro,anchor,open,undo,input);
 const dialog=document.createElement('dialog');dialog.className='backup-dialog';dialog.setAttribute('aria-label','恢复档案预览');document.body.append(dialog);
 function preview(book){
  dialog.replaceChildren();const heading=document.createElement('h2');heading.textContent='恢复这份军籍';const desc=document.createElement('p');desc.textContent='将替换当前三个档案。现有进度会先留一份恢复副本。';dialog.append(heading,desc);
  for(const [i,p]of book.slots.entries()){const row=document.createElement('p');row.textContent=`${i+1} · ${p?p.name+' · '+(p.progress?.complete?'已通关':'第 '+((p.progress?.mission||0)+1)+' 关'):'空档案'}`;dialog.append(row);}
  const status=document.createElement('p');status.setAttribute('role','status');const actions=document.createElement('div');actions.className='backup-actions';const cancel=document.createElement('button');cancel.textContent='保留当前档案';cancel.onclick=()=>dialog.close();const apply=document.createElement('button');apply.textContent='确认恢复';apply.onclick=()=>{try{restoreBackup(localStorage,book);location.reload();}catch{status.textContent='恢复未完成，当前档案未被替换。请先下载备份并检查浏览器存储空间。';}};actions.append(cancel,apply);dialog.append(status,actions);dialog.showModal();
 }
 input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{if(file.size>5_000_000)throw Error('请选择 5 MB 以内的存档文件。');preview(parseBackup(await file.text()));}catch(e){message.textContent=e.message;}finally{input.value='';}};
 undo.onclick=()=>{try{preview(parseBackup(localStorage.getItem(RECOVERY_KEY)));}catch{message.textContent='恢复副本不可读取；现有档案仍然保留。';}};
}
