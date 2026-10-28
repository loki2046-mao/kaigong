import{chromium}from'playwright';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const b=await chromium.launch({channel:'chrome',headless:true});
for(let chapter=0;chapter<12;chapter++){
 const p=await b.newPage({viewport:{width:390,height:844},acceptDownloads:true});await p.goto('http://127.0.0.1:8766/camp.html');
 const expected=await p.evaluate(async chapter=>{const profile={name:chapter===11?'龘𠮷曌':chapter===10?'十六个字的玩家姓名测试完整展示用':'Loki'};const {renderDecree}=await import('/ceremony-ui.mjs');renderDecree(document.querySelector('#chapter-decree'),profile,chapter);(await import('/report-pages.mjs')).prepareReport();document.querySelector('#result-dialog').showModal();window.drawnText=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.drawnText.push(text);return original.call(this,text,...args)};return(await import('/camp-honors.mjs')).decree(profile,chapter).body.replaceAll('\n','');},chapter);
 await p.waitForFunction(()=>!document.querySelector('.decree-loading'));const download=p.waitForEvent('download');await p.getByRole('button',{name:'保存制书图片',exact:true}).click();const file=await download;const path='/tmp/kaigong-decree-verified-'+chapter+'.png';await file.saveAs(path);const bytes=readFileSync(path);assert.equal(bytes.readUInt32BE(16),2400);assert.equal(bytes.readUInt32BE(20),1350);assert.ok((await p.evaluate(()=>window.drawnText.join(''))).includes(expected));console.log(chapter+1,file.suggestedFilename(),'text verified');await p.close();
}
await b.close();
