import {PRECISION,challengeReward} from './precision-challenges.mjs';
import {fittingState,loadoutSummary} from './loadout-summary.mjs';
import {EXERCISES,createExercise,exerciseSteps,exerciseBow,exerciseOpen,exerciseJudge,settleExercise,exerciseStars,finishExercise,restoreExercise,advanceExerciseDraw} from './field-engine.mjs';
import {makeDraw,advanceDraw,zoneAt,flightTime} from './engine.mjs';
import {drawScene} from './scene.mjs';
import {paintCampTarget} from './camp-art.mjs';
import {projectileFor,lanternFall} from './camp-effects.mjs';
import {aimCue} from './aim-ui.mjs';
import {createSoundscape} from './audio.mjs';
import {loadProfiles,persistProfiles} from './camp-profile.mjs';
import {outfitTier} from './camp-wardrobe.mjs';

const $=id=>document.getElementById(id),canvas=$('scene'),g=canvas.getContext('2d');
const profiles=loadProfiles(localStorage),profile=profiles.slots[profiles.active];
const fieldMode=new URLSearchParams(location.search).get('mode'),challenge=fieldMode==='challenge',fitting=fieldMode==='fitting';let equipped=true;
const key=(challenge?'kg-precision-v1-slot-':fitting?'kg-fitting-v1-slot-':'kg-field-v1-slot-')+profiles.active;
const LESSONS=['辨清机关顺序','选择稳妥或巧射','追踪移动目标','判断到箭时机','发现隐藏支路','组合运用机关'];
let book={best:{}},s,draw,bow,result=null,age=0,settled=false,holding=false,tap=false,pointer=null,bounds=null,last=performance.now(),shapeScale=1,muted=true,groundPlayed=false,chainPlayed=false,lastOpen=null,presented=false;
try{book=JSON.parse(localStorage.getItem(key))||book;}catch{}
if(!book||typeof book!=='object'||Array.isArray(book))book={best:{}};
if(!book.best||typeof book.best!=='object'||Array.isArray(book.best))book.best={};s=restoreExercise(book.progress);if(challenge&&!PRECISION.some(x=>x.index===s.index))s=createExercise(3);if(challenge&&!book.progress)s=createExercise(3);
const band=createSoundscape(()=>muted);
const cartArt=new Image();cartArt.src=new URL('./art/grain-cart-v1.webp',import.meta.url).href;
function text(id,value){if($(id).textContent!==String(value))$(id).textContent=value;}
function save(){book.progress={...s};try{localStorage.setItem(key,JSON.stringify(book));text('save-state','演武进度已保存');}catch{text('save-state','存储不可用 · 本次进度仅保留在页面');}}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);g.setTransform(canvas.width/1000,0,0,canvas.height/720,0,0);shapeScale=r.width*720/(r.height*1000);if(holding&&bounds)bounds=$('draw').getBoundingClientRect();}
new ResizeObserver(resize).observe(canvas);
function resetDraw(){s.challenge=challenge;if(fitting){s.fitting=equipped?fittingState(profile):{arrow:'standard',loadout:{}};s.fittingMounted=(profile.progress?.mission||0)>=15;}draw={...makeDraw(),elapsed:s.elapsed};bow=exerciseBow(s);result=null;age=0;settled=false;groundPlayed=false;chainPlayed=false;holding=false;pointer=null;lastOpen=null;presented=false;if(s.done){const z=zoneAt(bow,draw);result=exerciseJudge(s,(z.min+z.max)/2,draw);result.hit=true;result.kind='good';result.blocked=false;age=result.impact.flight+2;settled=true;presented=true;groundPlayed=true;chainPlayed=true;}}
function ready(message){resetDraw();const ex=EXERCISES[s.index];document.body.dataset.theme=ex.theme;text('title',ex.title);text('progress',`训练 ${s.index+1} / 6 · 可反复练习`);text('rule',LESSONS[s.index]+' · '+ex.rule);$('routes').hidden=![1,4].includes(s.index)||s.shots>0||s.done;text('safe',s.index===1?'稳妥 · 两箭双靶':'稳妥 · 普通靶');text('risk',s.index===1?'巧射 · 一箭连锁':'探秘 · 断索取信');$('safe').setAttribute('aria-pressed',String(s.route==='safe'));$('risk').setAttribute('aria-pressed',String(s.route==='risk'));$('aim').hidden=s.done;$('done-actions').hidden=!s.done;text('draw',tap?'轻点拉弓':'按住拉弓');$('draw').disabled=s.done;text('next',s.index===5?'查看所学 →':'下一项训练 →');text('objective',s.done?'已完成 · '+LESSONS[s.index]:`第 ${s.phase+1} / ${exerciseSteps(s).length} 步 · ${objective()}`);$('cancel').hidden=$('tap').hidden=s.done;text('attempts',s.shots?`已练 ${s.shots} 箭`:'尚未出箭');text('feedback',message||(s.done?EXERCISES[s.index].ending:'失手也没关系 · 完成步骤就能继续'));canvas.setAttribute('aria-label',ex.title+'。'+ex.rule);if(challenge){const spec=PRECISION.find(x=>x.index===s.index);text('title',spec.title);text('rule',spec.rule);text('progress','精进 '+(PRECISION.indexOf(spec)+1)+' / 3 · '+spec.skill);text('save-state','独立战绩 · 首次达成奖 50 文与纪念');}if(fitting){text('title','军需试弓');text('rule',equipped?loadoutSummary(profile).join(' · '):'普通器材 · 对照手感');text('progress','配装试射 · 不改主线成绩');text('save-state','独立练习 · 不消耗军饷');}}
function objective(){return s.index===2?'射中制动绳':s.index===4&&s.route==='risk'?'取回密信':({latch:'断索',gate:'穿门取靶',flag:'穿旗取靶',jar:s.index===1?'击坛连锁':'击坛收阵',disc:'命中圆靶',rope:'射断绳结'})[exerciseSteps(s)[s.phase]];}
function cancel(){holding=false;pointer=null;bounds=null;band.stopPull();if(draw&&!result&&!s.done){draw.raw=0;draw.power=0;draw.rebound=false;text('draw',tap?'轻点拉弓':'按住拉弓');}}
function hold(){if(result||s.done||document.querySelector('dialog[open]'))return;band.ensure();holding=true;band.beginPull();text('draw',tap?'再点出箭':'松手出箭');}
function release(){if(!holding)return;holding=false;band.stopPull();result=exerciseJudge(s,draw.power,draw);age=0;settled=false;$('draw').disabled=true;$('routes').hidden=true;band.event('release',0,{power:draw.power});text('feedback','箭在途中…');}
const button=$('draw');
for(const event of ['contextmenu','selectstart','dragstart'])button.addEventListener(event,e=>e.preventDefault());
button.onpointerdown=e=>{if(e.button!==0||e.isPrimary===false||pointer!==null)return;e.preventDefault();pointer=e.pointerId;bounds=button.getBoundingClientRect();button.setPointerCapture(pointer);if(tap&&holding)release();else hold();};
button.onpointermove=e=>{if(e.pointerId!==pointer||!holding||!bounds)return;if(e.clientX<bounds.left-12||e.clientX>bounds.right+12||e.clientY<bounds.top-12||e.clientY>bounds.bottom+12){cancel();text('feedback','已收弓 · 不计失手');}};
button.onpointerup=e=>{if(e.pointerId!==pointer)return;pointer=null;if(!tap)release();};
for(const event of ['pointercancel','lostpointercapture'])button.addEventListener(event,e=>{if(e.pointerId===pointer)cancel();});
$('cancel').onclick=()=>{cancel();text('feedback','已收弓 · 不计失手');};
$('tap').onclick=()=>{cancel();tap=!tap;text('tap',tap?'按住操作':'轻点操作');text('draw',tap?'轻点拉弓':'按住拉弓');};
window.addEventListener('keydown',e=>{if(e.code==='Escape'){cancel();return;}if(e.code!=='Space'||e.repeat||document.querySelector('dialog[open]')||e.target.closest('input,select,textarea,a')||e.target.closest('button')&&e.target!==button)return;e.preventDefault();if(tap&&holding)release();else hold();});
window.addEventListener('keyup',e=>{if(e.code==='Space'&&!tap){e.preventDefault();release();}});
for(const route of ['safe','risk'])$(route).onclick=()=>{if(s.shots||result||holding)return;s.route=route;ready();save();};
$('sound').onclick=()=>{muted=!muted;if(!muted)band.ensure();band.mute();text('sound',muted?'开启声音':'声音已开');$('sound').setAttribute('aria-pressed',String(!muted));};
$('retry').onclick=()=>{s=createExercise(s.index);ready();save();};
$('next').onclick=()=>{if(!s.done)return;if(challenge){const i=PRECISION.findIndex(x=>x.index===s.index);if(i===2){openBook();return;}s=createExercise(PRECISION[i+1].index);ready();save();return;}if(s.index===5){openBook();return;}s=createExercise(s.index+1);ready();save();};
function openBook(){cancel();save();band.update({state:'paused'});$('book-grid').replaceChildren();(challenge?PRECISION.map(x=>({...EXERCISES[x.index],...x})):EXERCISES).forEach((ex,position)=>{const index=challenge?ex.index:position;const b=document.createElement('button'),title=document.createElement('span'),score=document.createElement('small');title.textContent=ex.title;const best=book.best[index];score.textContent=challenge?(best?'最佳 '+best.shots+' 箭 · '+best.perfect+' 神射':'首胜 · 50 文与'+ex.reward):best?'已练过 · '+LESSONS[index]:'练习 · '+LESSONS[index];b.append(title,score);b.onclick=()=>{$('book').close();s=createExercise(index);ready();save();last=performance.now();};$('book-grid').append(b);});text('letter-note',book.letter?'密信已收：西哨风急，旗开两息。斥候：你找到的线索，下一次过帘就用得上。':'未取密信：第五试选择「断索取信」，可发现斥候留下的线索。');if(challenge){$('book').querySelector('h2').textContent='精进三试';text('book-intro','三种判断，三份纪念。重试保留最佳，首胜赏赐只领一次。');text('letter-note','当前配装不介入，所有人使用统一器材。');}if(!$('book').open)$('book').showModal();}
$('book-open').onclick=openBook;$('book-close').onclick=()=>$('book').close();
function pause(){cancel();save();band.update({state:'paused'});if(!document.querySelector('dialog[open]'))$('field-pause').showModal();}
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
$('resume').onclick=()=>{$('field-pause').close();last=performance.now();};
for(const dialog of document.querySelectorAll('dialog')){dialog.addEventListener('close',()=>{last=performance.now();});dialog.addEventListener('cancel',cancel);}
window.addEventListener('pagehide',save);

function line(ctx,x,y,x2,y2,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function paintTarget(){const kind=bow.kind;return(ctx,p)=>{const impact=p.arrived&&p.hit,t=Math.max(0,p.impactAge),open=exerciseOpen(s,draw.elapsed+(result?Math.min(age,result.impact.flight):0));
 if(s.index===2){
  ctx.save();const w=300,h=225,left=p.x-145,top=p.y-41;
  if(cartArt.complete&&cartArt.naturalWidth){
   if(impact){ctx.beginPath();ctx.rect(left-5,top-5,w+10,h+10);ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.clip('evenodd');}
   ctx.drawImage(cartArt,left,top,w,h);
  }
  ctx.restore();ctx.save();ctx.strokeStyle='#fff0b2';ctx.lineWidth=2;
  if(!impact){ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.stroke();line(ctx,p.x-5,p.y,p.x+5,p.y,2,'#fff0b2');}
  else{ctx.fillStyle='#f9e5b9';ctx.font='18px KaigongDisplay';ctx.textAlign='center';ctx.fillText('粮车已停',p.x,p.y-35);}
  ctx.restore();return;
 }
 paintCampTarget(kind,false,bow.targetY,{open})(ctx,p);
 if(s.index===1&&s.route==='risk'){
  // Collateral jars visibly break in succession after the struck trigger jar.
  for(let n=1;n<=2;n++){const hit=impact&&t>n*.12;paintCampTarget('jar')(ctx,{...p,x:p.x+n*76,y:p.y+18*n,radius:25,arrived:hit,hit,impactAge:t-n*.12});line(ctx,p.x+(n-1)*76,p.y+35+(n-1)*18,p.x+n*76,p.y+35+n*18,3,hit?'#d4a050':'#6b4d31');}
 }
 if(s.index===4&&s.route==='risk'){
  const fall=impact?Math.min(1,t/.5):0;ctx.save();ctx.translate(p.x+44,p.y+52+fall*65);ctx.rotate(impact?fall*.2:Math.sin(draw.elapsed)*.1);ctx.fillStyle='#f1dfaf';ctx.strokeStyle='#82522f';ctx.lineWidth=2;ctx.fillRect(-17,-12,34,25);ctx.strokeRect(-17,-12,34,25);line(ctx,-17,-12,0,1,1,'#82522f');line(ctx,17,-12,0,1,1,'#82522f');ctx.fillStyle='#a54935';ctx.fillRect(-3,-2,6,6);ctx.restore();
 }
};}
function feedback(){if(!result.hit)return result.blocked?'箭被挡住 · 等「到箭时：开」再放':result.kind==='short'?'偏低 · 下次多拉一点':'偏高 · 下次早点松手';if(s.index===2)return '制动绳已断 · 粮车停稳！';if(s.index===1&&s.route==='risk')return '一箭触发连锁 · 三坛齐落！';if(s.index===4&&s.route==='risk')return '学会探索支路 · 密信已记下';if(bow.kind==='latch')return '绳索已断 · 趁门开取后靶';return result.kind==='perfect'?'神射 · 正中靶心！':'命中 · 再取下一靶';}
function step(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(document.hidden||document.querySelector('dialog[open]')){band.update({state:'paused'});requestAnimationFrame(step);return;}
 if(!s.done&&!result){advanceExerciseDraw(draw,bow,dt,holding);s.elapsed=draw.elapsed;if(holding&&draw.power>=100)release();}
 if(result){age+=dt;if(!settled&&age>=result.impact.flight){settled=true;s.elapsed=draw.elapsed+result.impact.flight;settleExercise(s,result);band.event(result.hit?['disc','gate','flag'].includes(bow.kind)?result.kind:['latch'].includes(bow.kind)?'rope':bow.kind:result.blocked?'shield':result.kind,0,{distance:bow.distance});text('feedback',feedback());if(s.done){finishExercise(book,s);if(challenge){const latest=loadProfiles(localStorage),p=latest.slots[profiles.active];const reward=challengeReward(p,s);try{persistProfiles(localStorage,latest);book.lastReward=reward;}catch{book.lastReward={error:true};}}}save();}
  if(settled&&result.hit&&s.index===1&&s.route==='risk'&&!chainPlayed&&age-result.impact.flight>.24){chainPlayed=true;band.event('jar');}
  if(settled&&result.hit&&bow.kind==='rope'&&!groundPlayed&&lanternFall(bow.targetY,age-result.impact.flight).landed){groundPlayed=true;band.event('lantern_land');}
  const recovery=result.hit&&['rope','latch','jar'].includes(bow.kind)?.8:.35;
  if(settled&&!presented&&age>=result.impact.flight+recovery){const message=$('feedback').textContent;if(s.done){presented=true;$('cancel').hidden=$('tap').hidden=true;$('aim').hidden=true;$('done-actions').hidden=false;text('objective','已完成 · '+LESSONS[s.index]);text('feedback',EXERCISES[s.index].ending);text('attempts',`已练 ${s.shots} 箭`);text('next',s.index===5?'查看所学 →':'下一项训练 →');if(challenge){text('objective','精进完成 · '+s.shots+' 箭 / '+s.perfect+' 次神射');text('feedback',book.lastReward?.error?'奖励保存失败，请重试本关；不会重复扣除任何物品。':book.lastReward?.first?'首次达成 · '+book.lastReward.name+' · 军饷 +50 文':'已保留最佳战绩 · 首胜赏赐已领取');text('next',s.index===1?'查看精进册 →':'下一项精进 →');}}else ready(message);}
 }
 const z=zoneAt(bow,draw),open=exerciseOpen(s,draw.elapsed+flightTime(bow));
 if(!result&&!s.done){const cue=aimCue(draw.power,z,{holding,open,tap});text('aim-cue',cue.label);$('aim').dataset.state=cue.state;const gate=['gate','flag'].includes(bow.kind);text('field-cue',gate?`到箭时：${open?'开 · 可穿过':'合 · 等一等'}`:objective());if(gate&&open&&lastOpen===false)band.event('perfect',0,{distance:100});lastOpen=open;}else text('field-cue',s.done?'训练完成':!settled?'箭在途中…':result?.hit?'命中':'再试一箭');
 text('power',Math.round(draw.power)+'%');$('meter').setAttribute('aria-valuenow',String(Math.round(draw.power)));$('power-fill').style.width=draw.power+'%';$('zone').style.left=z.min+'%';$('zone').style.width=z.max-z.min+'%';$('gold').style.left=z.perfectMin+'%';$('gold').style.width=z.perfectMax-z.perfectMin+'%';$('zone').style.opacity=$('gold').style.opacity=open?'1':'.25';$('needle').style.left=draw.power+'%';
 band.update({state:s.done?'paused':'play',holding,power:draw.power,bow,aimZone:z});
 drawScene(g,{fitWorld:true,hideChatter:true,theme:EXERCISES[s.index].theme,character:profile.character||'female',outfitTier:outfitTier(profile,profile.progress?.mission||0),bow,draw,power:draw.power,t:s.elapsed,holding,shapeScale,outcome:result?.kind||null,shot:result?.impact,age,projectileMode:result?.blocked?'fall':projectileFor(bow.kind,!!result?.hit),obstacleHit:!!result?.blocked,paintTarget:paintTarget()});requestAnimationFrame(step);
}
ready();save();requestAnimationFrame(step);

if(fitting){$('book-open').hidden=true;const toggle=document.createElement('button');toggle.textContent='换普通器材';toggle.onclick=()=>{cancel();equipped=!equipped;toggle.textContent=equipped?'换普通器材':'换当前配装';s=createExercise(0);ready();};document.querySelector('header').append(toggle);const back=document.querySelector('header a:last-of-type');back.href='archive.html#armory';back.textContent='回军需处';}

if(challenge){document.querySelector('.field-label').textContent='精进三试';text('book-open','精进册');}
