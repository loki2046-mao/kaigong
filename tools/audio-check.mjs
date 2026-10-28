import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoundscape} from '../audio.mjs';
test('凯旋播放专用音乐且不播放马蹄，静音和关闭庆典停止调度',()=>{
 const m=mock();let muted=false;const a=createSoundscape(()=>muted,m.Context,{horseBuffer:{}});a.ensure();
 a.update({state:'finale',bow:{mounted:true}});assert.ok(a.info().scheduledSteps>0);assert.equal(a.info().hoofSteps,0);
 const count=m.nodes.length;a.update({state:'finale'});assert.equal(m.nodes.length,count,'同一帧不重复开场音效');
 const steps=a.info().scheduledSteps;muted=true;m.setTime(1);a.update({state:'finale'});assert.equal(a.info().scheduledSteps,steps);
 muted=false;m.setTime(2);a.update({state:'paused'});assert.equal(a.info().scheduledSteps,steps);a.dispose();
});
function mock(){let contexts=0,nodes=[],clock=0;const parameter=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}});const node=()=>{const n={frequency:parameter(),gain:parameter(),threshold:parameter(),ratio:parameter(),Q:parameter(),connect(){},started:null,stopped:null,start(t){this.started=t},stop(t){this.stopped=t}};nodes.push(n);return n;};class Context{constructor(){contexts++;this.sampleRate=8000;this.state='running';this.destination={};}get currentTime(){return clock}createGain(){return node()}createOscillator(){return node()}createBiquadFilter(){return node()}createDynamicsCompressor(){return node()}createBufferSource(){return node()}createBuffer(){return {getChannelData:()=>new Float32Array(8000)}}resume(){return Promise.resolve()}close(){this.state='closed';return Promise.resolve()}}return {Context,nodes,setTime:t=>clock=t,contexts:()=>contexts};}
test('静音或用户还未激活时，音频更新不会创建 AudioContext',()=>{const m=mock();let muted=true;const a=createSoundscape(()=>muted,m.Context);a.update({state:'play'});a.beginPull();a.event('start');assert.equal(m.contexts(),0);muted=false;a.update({state:'play'});assert.equal(m.contexts(),0);assert.equal(a.ensure(),true);assert.equal(m.contexts(),1);});
test('松手、失手、暂停、静音都终止持续拉弓声',()=>{for(const action of ['release','fail','pause','mute']){const m=mock();let muted=false;const a=createSoundscape(()=>muted,m.Context);a.ensure();a.beginPull();assert.equal(a.info().pulling,true);if(action==='release')a.stopPull();if(action==='fail')a.event('short');if(action==='pause')a.update({state:'paused'});if(action==='mute'){muted=true;a.mute()}assert.equal(a.info().pulling,false);const sustained=m.nodes.filter(n=>n.started!==null);assert.ok(sustained.every(n=>n.stopped!==null));a.dispose();}});
test('调度只在游戏中进行；长停顿后不堆积过时音符',()=>{const m=mock();const a=createSoundscape(()=>false,m.Context);a.ensure();a.update({state:'play'});const first=a.info().scheduledSteps;m.setTime(2);const before=m.nodes.length;a.update({state:'play'});const fresh=m.nodes.slice(before).filter(n=>n.started!==null);assert.ok(fresh.length>0);assert.ok(fresh.every(n=>n.started>=2));const steps=a.info().scheduledSteps;assert.ok(steps>first);m.setTime(4);a.update({state:'paused'});assert.equal(a.info().scheduledSteps,steps);a.dispose();});

test('金区提示音采用实时判定区，不沿用开局位置；连续停留不反复响',()=>{
 const m=mock(),a=createSoundscape(()=>false,m.Context);
 a.ensure();a.update({state:'play'});a.beginPull();
 const bow={perfectMin:20,perfectMax:22},aimZone={perfectMin:40,perfectMax:42};
 const tones=()=>m.nodes.filter(n=>n.started!==null).length;
 const before=tones();
 a.update({state:'play',holding:true,power:21,bow,aimZone});
 assert.equal(tones(),before,'旧金区不能发提示音');
 a.update({state:'play',holding:true,power:41,bow,aimZone});
 assert.equal(tones(),before+1,'实时金区发一次提示音');
 a.update({state:'play',holding:true,power:41,bow,aimZone});
 assert.equal(tones(),before+1,'同一时刻不重复提示');
 a.dispose();
});

test('箭的实体音效采用短材质采样，命中脱靶不再播放结果音阶',()=>{for(const kind of ['release','good','perfect','short','over']){const m=mock(),a=createSoundscape(()=>false,m.Context);a.ensure();const before=m.nodes.length;a.event(kind,1,{power:70,distance:80});const sounds=m.nodes.slice(before).filter(n=>n.started!==null);assert.ok(sounds.length>0);assert.ok(sounds.every(n=>n.buffer),'实体音效不混入旋律振荡器');assert.ok(sounds.every(n=>n.stopped>n.started&&n.stopped-n.started<.5));a.dispose();}});

test('马蹄跟随关卡且独立于音乐：骑射响、站射暂停静音停',()=>{const m=mock();let muted=false;const a=createSoundscape(()=>muted,m.Context,{horseBuffer:{}});a.ensure();a.setLevels(0,1);a.update({state:'play',bow:{mounted:false}});assert.equal(a.info().hoofSteps,0);m.setTime(.2);a.update({state:'play',bow:{mounted:true}});assert.ok(a.info().hoofSteps>0);assert.equal(a.info().mounted,true);m.setTime(.5);a.update({state:'play',bow:{mounted:false}});assert.equal(a.info().mounted,false);a.update({state:'play',bow:{mounted:true}});a.update({state:'paused',bow:{mounted:true}});assert.equal(a.info().mounted,false);muted=true;a.update({state:'play',bow:{mounted:true}});assert.equal(a.info().mounted,false);});

test('陶坛、断绳、破盾和灯笼落地均产生独立材质声',()=>{for(const kind of ['jar','rope','shield','lantern_land']){const m=mock(),a=createSoundscape(()=>false,m.Context,{jarBuffer:{duration:1.4}});a.ensure();const n=m.nodes.length;a.event(kind);assert.ok(m.nodes.slice(n).some(x=>x.buffer&&x.started!==null),kind);}});

test('陶坛命中只播放真实陶罐缓冲，不叠加合成波形',()=>{const m=mock(),recording={duration:1.4},a=createSoundscape(()=>false,m.Context,{jarBuffer:recording});a.ensure();const before=m.nodes.length;a.event('jar');const sources=m.nodes.slice(before).filter(n=>n.started!==null);assert.equal(sources.length,1);assert.equal(sources[0].buffer,recording);assert.equal(a.info().jarReady,true);});
