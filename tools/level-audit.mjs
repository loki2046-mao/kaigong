import {writeFileSync} from 'node:fs';
import {makeBow,makeDraw,advanceDraw,judge,GOAL} from '../engine.mjs';
// Sample release opportunities from a fresh draw; each exam arrow resets its draw.
const rows=[];
for(let level=0;level<GOAL;level++){
 const windows=[];let unreachable=0;
 for(let seed=0;seed<40;seed++)for(const fps of [30,60,120]){
  const bow=makeBow(level,`audit-${seed}`),draw=makeDraw();
  let longest=0,run=0;
  for(let frame=0;frame<fps*8&&draw.power<102;frame++){
   advanceDraw(draw,bow,1/fps);
   run=['good','perfect'].includes(judge(bow,draw.power,draw).kind)?run+1:0;
   longest=Math.max(longest,run);
  }
  if(!longest)unreachable++;
  windows.push(longest/fps);
 }
 windows.sort((a,b)=>a-b);
 const b=makeBow(level,'audit-0');
 rows.push({level:level+1,chapter:b.chapterName,distance:b.distance,radius:b.radius,targetAmplitude:b.targetAmplitude,rideAmplitude:b.rideAmplitude,required:b.required,minWindow:windows[0],medianWindow:windows[60],maxWindow:windows.at(-1),unreachable});
}
writeFileSync(new URL('../qa/oct09-level-multiseed-audit.json',import.meta.url),JSON.stringify({seeds:40,fps:[30,60,120],samples:6000,rows},null,2)+'\n');
const failures=rows.filter(r=>r.unreachable);
console.log(JSON.stringify({levels:rows.length,samples:6000,unreachable:failures}));
if(failures.length)process.exitCode=1;
