import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
for(const [width,height] of [[320,568],[390,844],[1280,720]])for(const full of [false,true]){
 const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8766/camp.html');
 const expected=await page.evaluate(async full=>{
  const {showFinale}=await import('/ceremony-ui.mjs');const {TRINKETS}=await import('/camp-loot.mjs');const {QUESTS}=await import('/camp-rewards.mjs');const {SECRETS}=await import('/camp-growth.mjs');const {HONORS}=await import('/camp-honors.mjs');const {GOODS}=await import('/camp-economy.mjs');
  const p={name:'凯旋试射员',progress:{complete:true},records:Object.fromEntries(Array.from({length:60},(_,i)=>[i,{finished:true,shots:8,hits:5,perfect:0}])),honors:Object.fromEntries(HONORS.map(([rank,grade],i)=>[i,{rank,grade}])),loot:Object.fromEntries(TRINKETS.filter((_,i)=>full||i%3===0).map(i=>[i.id,2])),quests:Object.fromEntries(QUESTS.filter((_,i)=>full||i===0).map(q=>[q.id,{claimed:true,count:q.goal}])),secrets:full?Object.fromEntries(SECRETS.map(s=>[s.id,{at:1}])):{},armory:{earned:3200,balance:1200,items:Object.fromEntries(GOODS.map(g=>[g.id,2])),equipped:{bow:'steady'}},bestChapters:full?Object.fromEntries(HONORS.map((_,i)=>[i,{stars:3,accuracy:100,checks:[true,true,true]}])):{}};
  showFinale(p);return {owned:TRINKETS.filter(t=>p.loot[t.id]).map(t=>t.name),equipment:GOODS.map(g=>g.name)};
 },full);
 await page.waitForFunction(()=>!document.querySelector('.decree-loading'));
 const total=Number(await page.locator('#finale-dialog').getAttribute('data-page-count'));let visible='';
 for(let i=0;i<total;i++){
  const result=await page.locator('.finale-body').evaluate(e=>({dy:e.scrollHeight-e.clientHeight,dx:e.scrollWidth-e.clientWidth,text:e.innerText}));assert.ok(result.dy<=2&&result.dx<=2,JSON.stringify({width,full,i,...result}));visible+=result.text;
  if(i===0)await page.screenshot({path:`/tmp/finale-hero-${width}.png`});
  if(await page.locator('.finale-collection:visible').count())await page.screenshot({path:`/tmp/finale-collection-${width}.png`});
  if(i<total-1)await page.locator('.finale-pagination button').last().click();
 }
 for(const item of [...expected.owned,...expected.equipment])assert.ok(visible.includes(item),'missing '+item);
 assert.ok(!visible.includes('尚未获得，归营后仍可继续寻访。'));
 await page.getByLabel('选择战报分类').selectOption('所得藏品');assert.ok(await page.locator('.finale-collection:visible').count());
 assert.deepEqual(errors,[]);console.log({width,height,full,pages:total,categories:await page.locator('.finale-pagination option').count(),allOwnedShown:true});await page.close();
}
await browser.close();
