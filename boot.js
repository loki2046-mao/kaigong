/* Public-page startup: one self-contained game bundle, bounded network retries. */
(() => {
 const config=document.querySelector('script[data-game-entry]');if(!config)return;
 const entry=config.dataset.gameEntry,extra=config.dataset.extraEntry;
 const panel=document.createElement('aside');panel.id='startup-status';panel.setAttribute('role','status');
 Object.assign(panel.style,{position:'fixed',bottom:'16px',left:'50%',transform:'translateX(-50%)',maxWidth:'calc(100vw - 32px)',padding:'12px 18px',background:'#202c36',color:'#f5e6c7',border:'1px solid #b79a66',borderRadius:'6px',zIndex:'99999',font:'16px/1.6 sans-serif'});
 panel.textContent='正在进入校场…';document.body.append(panel);
 let ready=false;const slow=setTimeout(()=>{if(!ready)panel.textContent='资源加载较慢，正在重试连接…';},5000);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function start(){
  for(let n=0;n<3;n++){
   try{await import(new URL(entry+(n?'?retry='+n:''),location.href).href);ready=true;clearTimeout(slow);panel.remove();return;}
   catch(error){
    const network=error instanceof TypeError&&/fetch|load|import|network/i.test(error.message);
    if(!network||n===2){clearTimeout(slow);panel.replaceChildren(document.createTextNode('游戏未能加载完成。进度不会被清除。 '));const retry=document.createElement('button');retry.textContent='重新加载';retry.onclick=()=>location.reload();panel.append(retry);console.error('Game startup failed',error);return;}
    panel.textContent='连接中断，正在重新加载游戏…';await wait(800*(n+1));
   }
  }
 }
 // Stylesheet failures must not leave a permanently unstyled game.
 for(const link of document.querySelectorAll('link[rel=stylesheet]')){
  const original=link.href;let count=0;
  const retry=()=>{if(link.sheet||count>=2)return;count++;link.href=original+(original.includes('?')?'&':'?')+'retry='+count;};
  link.addEventListener('error',retry);setTimeout(retry,2500);
 }
 start();if(extra)import(new URL(extra,location.href).href).catch(()=>{});
})();
