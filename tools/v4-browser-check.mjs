import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir('qa/v4',{recursive:true});const results=[];
for(const [width,height] of [[1440,900],[1280,720],[390,844],[320,568],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<500,hasTouch:width<900});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8766/camp.html',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`qa/v4/camp-${width}.png`});
 const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth>innerWidth,scene:document.querySelector('canvas').getBoundingClientRect().toJSON(),draw:document.querySelector('#draw').getBoundingClientRect().toJSON(),font:document.fonts.check('20px KaigongDisplay'),body:document.body.scrollHeight,viewport:innerHeight}));
 const btn=page.locator('#draw');await btn.dispatchEvent('pointerdown',{button:0,isPrimary:true,pointerId:1});await page.waitForTimeout(200);await btn.dispatchEvent('pointerup',{pointerId:1});await page.waitForTimeout(900);await page.screenshot({path:`qa/v4/miss-${width}.png`});
 results.push({width,height,layout,errors});await context.close();}
await writeFile('qa/v4/layout.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
