import test from 'node:test';
import {arrowPose} from '../scene.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {femaleTierFor,makeBow,makeDraw,targetState,riderOffset,judge} from '../engine.mjs';

function render(age,{reduced=false,level=49,character='male'}={}){
 const sprites=[],strokes=[],labels=[],assets=[],releaseCells=[];
 const state={globalAlpha:1};
 const g=new Proxy(state,{get(o,k){if(k==='drawImage')return (...args)=>{assets.push(args[0]?.src);if(args[0]?.src?.includes('archer-release'))releaseCells.push([args[1],args[2]]);if(args[0]?.src?.includes('npc-actions'))sprites.push(args[2]);};if(k==='fillText')return s=>labels.push(s);if(k==='stroke')return ()=>strokes.push({color:o.strokeStyle,alpha:o.globalAlpha});return k in o?o[k]:()=>{};}});
 const context=vm.createContext({femaleTierFor,targetState,riderOffset,Image:class{complete=true;naturalWidth=1800;naturalHeight=1800},matchMedia:()=>({matches:reduced})});
 const source=readFileSync(new URL('../scene.mjs',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replaceAll('export ','');
 vm.runInContext(source,context);
 const bow=makeBow(level,'scene-test'),draw=makeDraw();
 const shot=judge(bow,(bow.perfectMin+bow.perfectMax)/2,draw).impact;
 context.drawScene(g,{character,bow,draw,shot,age:shot.flight+age,outcome:'perfect',crowdMood:'perfect',t:1});
 return {sprites,strokes,labels,assets,releaseCells};
}
test('四位看客保持各自身份，箭抵达后才出现喝彩符号',()=>{
 const before=render(-.01),after=render(.01);
 assert.deepEqual(before.sprites.slice(0,4),[0,300,620,925]);
 assert.deepEqual(after.sprites.slice(0,4),[0,300,620,925]);
 assert.ok(!before.labels.includes('✦'));assert.ok(after.labels.includes('✦'));
 assert.ok(!render(.01,{reduced:true}).labels.includes('✦'));
});
test('近远靶的神射光芒从落箭重新计时，减少动态时不闪烁',()=>{
 const sparks=result=>result.strokes.filter(s=>s.color==='#edc460');
 const near=sparks(render(.01,{level:0})),far=sparks(render(.01));
 assert.equal(near.length,9);assert.equal(far.length,9);
 assert.ok(Math.abs(near.at(-1).alpha-far.at(-1).alpha)<1e-9);
 assert.ok(far.at(-1).alpha>.9);
 assert.equal(sparks(render(.01,{reduced:true})).length,0);
});

test('女将三阶段放箭与骑射都使用完整六格图集，男弓手使用阶段图集',()=>{for(const level of [0,20,25,40,45]){const r=render(0,{level,character:'female'}),asset=level>=40?'silver-female':level>=20?'general-female-v2':'recruit-female';assert.ok(r.assets.some(x=>x?.includes(asset)));assert.ok(!r.assets.some(x=>x?.includes('archer-release')));}assert.ok(render(0,{level:24,character:'male'}).assets.some(x=>x?.includes('-male-v5')));});
test('箭沿切线转向，命中后固定在实际接触点，未命中不停在靶心',()=>{const from={x:300,y:380},shot={x:800,y:400,flight:.35};const start=arrowPose(from,shot,0,true),mid=arrowPose(from,shot,.175,true),end=arrowPose(from,shot,.35,true),later=arrowPose(from,shot,.8,true);assert.equal(start.x,300);assert.equal(start.y,380);assert.equal(end.x,800);assert.equal(end.y,400);assert.equal(later.x,end.x);assert.equal(later.y,end.y);assert.ok(end.angle>mid.angle);const miss=arrowPose(from,shot,.5,false);assert.ok(miss.x>800);const ground=arrowPose(from,{...shot,y:650},1,false,547);assert.ok(ground.grounded);assert.ok(Math.abs(ground.y-547)<1e-7);});

test('新兵与银甲站射骑射使用各自离弦图，晋升边界按已过关数',()=>{assert.equal(femaleTierFor(19),0);assert.equal(femaleTierFor(20),1);assert.equal(femaleTierFor(39),1);assert.equal(femaleTierFor(40),2);for(const [level,asset] of [[0,'recruit-female'],[40,'silver-female'],[45,'silver-female']]){const r=render(0,{level,character:'female'});assert.ok(r.assets.some(x=>x?.includes(asset)));assert.ok(!r.assets.some(x=>x?.includes('archer-release')));}});
