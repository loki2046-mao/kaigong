// Original martial pentatonic band: drums, low ostinato and short horn calls. Audio is scheduled only after a user gesture.
export function createSoundscape(isMuted, Context, assets={}) {
  let ctx=null,master=null,music=null,fx=null,nextBeat=0,step=0,pull=null,noise=null,wasPlaying=false,zoneAt=-99,musicLevel=.65,effectsLevel=.8,duckUntil=0;
  let hooves=null,horseSource=null,horseBuffer=assets.horseBuffer||null,horseLoading=null,horseError=null,hoofStep=0,wasMounted=false;
  let jarBuffer=assets.jarBuffer||null,jarLoading=null,jarError=null,wasCelebrating=false;
  const plucks=new Map(),foleyBuffers=new Map();let shotVariant=0;
  // Four eight-bar phrases: invitation, response, rising variation, resolution.
  const phrases=[
   [74,null,78,81,null,78,76,null,74,null,71,74,76,null,74,null,69,null,71,74,78,null,76,74,71,null,69,71,74,null,null,null],
   [78,null,81,86,null,83,81,null,78,76,74,null,76,null,78,null,81,null,78,76,74,null,71,69,71,74,76,null,74,null,null,null],
   [81,78,81,null,86,null,83,81,78,null,76,74,76,78,81,null,83,null,81,78,76,null,74,71,69,71,74,76,74,null,null,null],
   [78,null,76,74,71,null,69,null,74,null,78,81,78,null,76,null,74,71,69,null,66,null,69,71,74,null,78,76,74,null,null,null]
  ];
  const hz=n=>440*Math.pow(2,(n-69)/12);
  function ensure(){if(isMuted())return false;try{if(!ctx){const C=Context||window.AudioContext||window.webkitAudioContext;if(!C)return false;ctx=new C();master=ctx.createGain();master.gain.value=.85;const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=5;master.connect(limiter);limiter.connect(ctx.destination);music=ctx.createGain();music.gain.value=.48*musicLevel;music.connect(master);fx=ctx.createGain();fx.gain.value=.62*effectsLevel;fx.connect(master);hooves=ctx.createGain();hooves.gain.value=0;hooves.connect(fx);
      // A short, quiet room return glues instruments together without smearing arrow cues.
      if(ctx.createDelay){const delay=ctx.createDelay(.5),feedback=ctx.createGain(),returnGain=ctx.createGain();delay.delayTime.value=.145;feedback.gain.value=.21;returnGain.gain.value=.16;music.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(returnGain);returnGain.connect(master);}
      noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const a=noise.getChannelData(0);let x=0,seed=9281;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;x=(x+((seed/4294967296)*2-1)*.1)/1.04;a[i]=x*2;}nextBeat=ctx.currentTime+.06;prepareHorse();prepareProps();}if(ctx.state==='suspended')ctx.resume().catch(()=>{});return true}catch{return false}}
  function note(midi,time,dur=.18,gain=.13,bus=fx,type='triangle',slide=null){if(!ctx||isMuted())return;const o=ctx.createOscillator(),env=ctx.createGain(),filter=ctx.createBiquadFilter();o.type=type;o.frequency.setValueAtTime(hz(midi),time);if(slide!==null)o.frequency.exponentialRampToValueAtTime(hz(slide),time+dur);filter.type='lowpass';filter.frequency.value=type==='triangle'?2100:3100;env.gain.setValueAtTime(0,time);env.gain.linearRampToValueAtTime(gain,time+.006);env.gain.exponentialRampToValueAtTime(.0001,time+dur);o.connect(filter);filter.connect(env);env.connect(bus);o.start(time);o.stop(time+dur+.02)}
  function pluck(midi,time,gain=.2,duration=1.45,bus=music){
    if(!ctx||isMuted())return;
    const key=midi+':'+duration;let buffer=plucks.get(key);
    if(!buffer){const length=Math.ceil(ctx.sampleRate*duration),period=Math.max(2,Math.round(ctx.sampleRate/hz(midi)));buffer=ctx.createBuffer(1,length,ctx.sampleRate);const data=buffer.getChannelData(0),ring=new Float32Array(period);let seed=9281+midi;
      for(let i=0;i<period;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const phase=i/period*Math.PI*2;ring[i]=.56*Math.sin(phase)+.22*Math.sin(phase*2)+.1*Math.sin(phase*3)+(seed/4294967296*2-1)*.10;}
      for(let i=0;i<data.length;i++){const j=i%period,value=ring[j];ring[j]=.497*(value+ring[(j+1)%period]);data[i]=value*Math.min(1,i/(ctx.sampleRate*.003))*Math.exp(-i/(ctx.sampleRate*1.3));}
      plucks.set(key,buffer);
    }
    const source=ctx.createBufferSource(),env=ctx.createGain();source.buffer=buffer;env.gain.setValueAtTime(gain,time);source.connect(env);env.connect(bus);source.start(time);source.stop(time+duration);
  }
  function flute(midi,time,duration=.55,gain=.08){
    if(!ctx||isMuted())return;
    for(const [harmonic,weight] of [[1,1],[2,.16],[3,.06]]){const o=ctx.createOscillator(),env=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(hz(midi)*harmonic,time);o.frequency.linearRampToValueAtTime(hz(midi)*harmonic*1.003,time+duration*.6);env.gain.setValueAtTime(.0001,time);env.gain.linearRampToValueAtTime(gain*weight,time+.045);env.gain.setTargetAtTime(gain*weight*.7,time+.09,.12);env.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(env);env.connect(music);o.start(time);o.stop(time+duration+.02);}
  }
  function drum(time,strong=false){note(strong?43:48,time,strong?.28:.14,strong?.48:.24,music,'sine',strong?26:33);note(62,time,.04,strong?.09:.055,music,'triangle',43);rustle(time,.055,strong?.13:.075,1100,music);}
  function horn(midi,time){note(midi,time,.24,.075,music,'sawtooth');note(midi-12,time,.28,.09,music,'triangle');}

  function setLevels(m,e){musicLevel=Math.max(0,Math.min(1,Number(m)||0));effectsLevel=Math.max(0,Math.min(1,Number(e)||0));if(ctx){fx.gain.setTargetAtTime(.62*effectsLevel,ctx.currentTime,.04);music.gain.setTargetAtTime(.48*musicLevel,ctx.currentTime,.04);}}
  function rustle(time,dur=.08,gain=.15,frequency=1500,bus=fx){if(!ctx||isMuted())return;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=ctx.createGain();src.buffer=noise;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.8;env.gain.setValueAtTime(gain,time);env.gain.exponentialRampToValueAtTime(.0001,time+dur);src.connect(filter);filter.connect(env);env.connect(bus);src.start(time);src.stop(time+dur+.01)}
  // Short, non-musical material transients. Cached variants avoid identical repeated shots.
  function foley(kind,time,gain=1,pan=0,bus=fx){
    const variant=shotVariant%4,key=kind+variant;let buffer=foleyBuffers.get(key);
    const duration={string:.19,air:.22,straw:.23,dirt:.15,pass:.28,woodbreak:.36,paperfall:.28,snap:.09,creak:1.7}[kind];
    if(!buffer){buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate);const data=buffer.getChannelData(0);let seed=317+variant*811,low=0,prev=0;
      for(let i=0;i<data.length;i++){const t=i/ctx.sampleRate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/2147483648-1;low+=.16*(white-low);const high=white-prev;prev=white;const attack=Math.min(1,t/.002);let v=0;
        if(kind==='string'){const f=147+variant*9;v=(Math.sin(2*Math.PI*f*t)*.38+Math.sin(2*Math.PI*f*2.73*t)*.22+Math.sin(2*Math.PI*f*5.19*t)*.09)*Math.exp(-t*38)+high*.26*Math.exp(-t*170);}
        if(kind==='air'||kind==='pass'){const x=t/duration;v=(high*.16+low*.7)*Math.pow(Math.sin(Math.PI*x),kind==='air'?1.4:2)* (kind==='air'?.7:.4);}
        if(kind==='straw'){v=(low*1.8*Math.exp(-t*42)+white*.31*Math.exp(-t*76)+Math.sin(2*Math.PI*(143*t-110*t*t))*.36*Math.exp(-t*55));v+=high*.045*Math.exp(-t*15);}
        if(kind==='dirt'){v=low*.95*Math.exp(-t*60)+white*.19*Math.exp(-t*100);}
        if(kind==='woodbreak'){v=low*2*Math.exp(-t*28)+white*.48*Math.exp(-t*50)+Math.sin(t*2*Math.PI*187)*.25*Math.exp(-t*38);if(t>.07)v+=white*.24*Math.exp(-(t-.07)*30);}
        if(kind==='paperfall'){v=low*1.3*Math.exp(-t*32)+white*.32*Math.exp(-t*17)+Math.sin(t*2*Math.PI*126)*.2*Math.exp(-t*40);}
        if(kind==='snap'){v=high*.45*Math.exp(-t*95)+Math.sin(t*2*Math.PI*320)*.2*Math.exp(-t*65);}
        if(kind==='creak'){const swell=Math.sin(Math.PI*t/duration)**2;v=low*.17*swell*(.8+.2*Math.sin(t*3.1));}
        data[i]=Math.max(-.95,Math.min(.95,v*attack));
      }foleyBuffers.set(key,buffer);
    }
    const src=ctx.createBufferSource(),env=ctx.createGain();src.buffer=buffer;env.gain.value=gain;src.connect(env);if(ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=pan;env.connect(p);p.connect(bus);}else env.connect(bus);src.start(time);src.stop(time+duration+.01);return src;
  }
  function stopHorse(){if(horseSource){horseSource.stop(ctx.currentTime);horseSource=null;}}
  function prepareHorse(){
    if(horseBuffer)return Promise.resolve(true);if(horseLoading)return horseLoading;
    if(!ctx?.decodeAudioData||typeof location==='undefined')return Promise.resolve(false);
    const owner=ctx,root=location.pathname.includes('/tools/')?'../':'./';
    horseLoading=fetch(root+'audio/horse-path-loop.mp3').then(r=>{if(!r.ok)throw Error('horse audio '+r.status);return r.arrayBuffer();}).then(b=>owner.decodeAudioData(b)).then(b=>{if(ctx===owner)horseBuffer=b;return true;}).catch(e=>{horseError=String(e);horseLoading=null;return false;});return horseLoading;
  }
  function prepareProps(){if(jarBuffer)return Promise.resolve(true);if(jarLoading)return jarLoading;if(!ctx?.decodeAudioData||typeof location==='undefined')return Promise.resolve(false);const owner=ctx,root=location.pathname.includes('/tools/')?'../':'./';jarLoading=fetch(root+'audio/pot-break.mp3').then(r=>{if(!r.ok)throw Error('pot audio '+r.status);return r.arrayBuffer();}).then(b=>owner.decodeAudioData(b)).then(b=>{if(ctx===owner)jarBuffer=b;return true;}).catch(e=>{jarError=String(e);jarLoading=null;return false;});return jarLoading;}
  function stopPull(){if(!pull)return;const t=ctx.currentTime;pull.env.gain.cancelScheduledValues(t);pull.env.gain.setTargetAtTime(.0001,t,.018);pull.creak?.stop(t+.02);pull.osc.stop(t+.1);pull.wobble.stop(t+.1);pull.src.stop(t+.1);pull=null;}
  function beginPull(){if(!ensure())return;stopPull();const t=ctx.currentTime,o=ctx.createOscillator(),env=ctx.createGain(),w=ctx.createOscillator(),wg=ctx.createGain(),src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),ng=ctx.createGain();o.type='triangle';o.frequency.value=83;env.gain.value=.001;env.gain.setTargetAtTime(.008,t,.08);const creak=foley('creak',t,.4,-.25);w.frequency.value=5;wg.gain.value=3;w.connect(wg);wg.connect(o.frequency);o.connect(env);env.connect(fx);src.buffer=noise;src.loop=true;filter.type='bandpass';filter.frequency.value=950;ng.gain.value=.5;src.connect(filter);filter.connect(ng);ng.connect(env);o.start(t);w.start(t);src.start(t);pull={creak,osc:o,env,wobble:w,vibrato:wg,src,noiseGain:ng};}
  function event(kind,streak=0,details={}){if(!ensure())return;const t=ctx.currentTime;stopPull();music.gain.cancelScheduledValues(t);duckUntil=t+.55;music.gain.setValueAtTime(.12*musicLevel,t);music.gain.linearRampToValueAtTime(.48*musicLevel,t+.6);
    if(kind==='release'){shotVariant++;const force=.65+Math.max(0,Math.min(100,details.power??60))*.005;foley('string',t,force,-.3);foley('air',t+.018,force,.15);}
    else if(kind==='jar'){if(jarBuffer){const src=ctx.createBufferSource(),env=ctx.createGain();src.buffer=jarBuffer;env.gain.value=.95;src.connect(env);env.connect(fx);src.start(t);src.stop(t+(jarBuffer.duration||1.4));}}
    else if(kind==='rope'){foley('snap',t,.95,.3);}
    else if(kind==='lantern_land'){foley('paperfall',t,1.2,.3);}
    else if(kind==='shield'){foley('woodbreak',t,1.2,.3);}
    else if(kind==='start'){[74,78,81].forEach((n,i)=>note(n,t+i*.085,.16,.12));}
    else if(kind==='rebound'){foley('creak',t,.45,-.25);}
    else if(kind==='good'||kind==='perfect'){const distance=Math.max(20,details.distance||20),gain=Math.max(.55,1-distance/330);foley('straw',t,gain*(kind==='perfect'?1.12:1),.35);foley('string',t+.018,.13,.35);}
    else if(kind==='short'){foley('dirt',t,.65,.3);}
    else if(kind==='over'){foley('pass',t,.8,.6);}
    else if(kind==='clear'){[74,78,81,86,83,86].forEach((n,i)=>note(n,t+i*.11,.3,.15));}
    else if(kind==='end'){[74,71,69].forEach((n,i)=>note(n,t+i*.14,.24,.1));}
  }
  function update({state,holding=false,power=0,bow=null,aimZone=bow}){if(!ctx)return;const t=ctx.currentTime;const celebrating=state==='finale',playing=(state==='play'||celebrating)&&!isMuted();master.gain.setTargetAtTime(isMuted()?0:.85,t,.03);
    if(playing&&celebrating&&!wasCelebrating){
      stopPull();stopHorse();nextBeat=t+.04;step=0;
      // A brief arrival flourish; use the effects bus and respect existing volume controls.
      [50,57,62,66,69,74].forEach((m,i)=>note(m,t+i*.09,.45,.1,fx,'triangle'));
      rustle(t,.18,.09,1800,fx);
    }
    wasCelebrating=playing&&celebrating;
    if(playing&&!wasPlaying){nextBeat=t+.04;step=0;}if(!playing){nextBeat=t+.04;if(pull)stopPull();}wasPlaying=playing;
    music.gain.setTargetAtTime(playing?(t<duckUntil?.12:.48)*musicLevel:0,t,.08);
    const mounted=playing&&!celebrating&&!!bow?.mounted;
    hooves.gain.setTargetAtTime(mounted?.85:0,t,.025);
    if(mounted&&horseBuffer&&!horseSource){horseSource=ctx.createBufferSource();horseSource.buffer=horseBuffer;horseSource.loop=true;horseSource.connect(hooves);horseSource.start(t);hoofStep++;}
    if(!mounted)stopHorse();
    wasMounted=mounted;
    if(playing){if(nextBeat<t-.15){nextBeat=t+.04;step=Math.ceil(step/32)*32;}let count=0;while(nextBeat<t+.12&&count++<8){
      if(celebrating){const melody=[62,66,69,74,73,69,66,69,74,78,76,74,69,66,62,69],i=step%32;pluck(50+(i%8===4?7:0),nextBeat,.24,.9);if(i%2===0){flute(melody[Math.floor(i/2)],nextBeat,.7,.12);}if(i%8===0){drum(nextBeat,true);horn(62,nextBeat);}if(i%8===4)drum(nextBeat);nextBeat+=60/108/2;step++;continue;}
      const i=step%32,phrase=Math.floor(step/32)%4,n=phrases[phrase][i],bar=Math.floor(i/8),roots=[50,45,47,50],root=roots[bar];
      const intensity=bow?.chapter>=8?1.2:1;
      // Eighth-note low strings drive the rhythm; upper melody leaves room for impacts.
      pluck(root+(i%4===2?7:12),nextBeat,.18*intensity,.38);
      if(n!==null&&i%2===0)pluck(n-12,nextBeat,.23,.65);
      if(i%8===0){pluck(root-12,nextBeat,.38,.7);drum(nextBeat,true);}
      if(i%8===4)drum(nextBeat,true);
      
      if(phrase%2===1&&i%8===0)horn(root+24,nextBeat);
      

      nextBeat+=60/(bow?.mounted?136:bow?.chapter>=8?140:128)/2;step++;
    }}
    if(pull&&holding){pull.osc.frequency.setTargetAtTime(83+power*.4,t,.035);pull.vibrato.gain.setTargetAtTime(1+power*.018,t,.03);pull.noiseGain.gain.setTargetAtTime(.4+power*.003,t,.03);if(aimZone&&power>=aimZone.perfectMin&&power<=aimZone.perfectMax&&t-zoneAt>.65){note(86,t,.11,.08);zoneAt=t;}}
    else if(pull)stopPull();
  }
  function mute(){if(!ctx)return;stopPull();if(isMuted())stopHorse();master.gain.setTargetAtTime(isMuted()?0:.85,ctx.currentTime,.02);}
  function dispose(){stopPull();stopHorse();if(ctx)ctx.close();ctx=null;}
  return {prepareProps,prepareHorse,setLevels,ensure,beginPull,stopPull,event,update,mute,dispose,info:()=>({ready:!!ctx,state:ctx?.state||'unavailable',scheduledSteps:step,pulling:!!pull,mounted:wasMounted,hoofSteps:hoofStep,jarReady:!!jarBuffer,jarError,horseReady:!!horseBuffer,horseError})};
}
