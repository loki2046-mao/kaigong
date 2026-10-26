import {loadProfiles} from './camp-profile.mjs';
import {trialSeed,trialReview} from './camp-experience.mjs';
const date=new Date(Date.now()+8*3600000),seed=trialSeed(null,date),$=id=>document.getElementById(id);$('daily-name').textContent=seed.slice(6)+' · 百步追风';$('daily-link').href='camp.html?mode=trial&seed='+seed;
$('seed-form').onsubmit=e=>{e.preventDefault();location.href='camp.html?mode=trial&seed='+encodeURIComponent(trialSeed($('seed').value));};
const book=loadProfiles(localStorage),p=book.slots[book.active],rows=Object.entries(p.trials||{}).sort((a,b)=>b[1].score-a[1].score).slice(0,5);if(!rows.length)$('trial-best').textContent='还没有成绩，第一箭就从今天开始。';for(const [seed,r] of rows){const row=document.createElement('p'),link=document.createElement('a');link.href='camp.html?mode=trial&seed='+encodeURIComponent(seed);link.textContent=seed+' · '+r.score+' 分 · 再挑战 →';row.append(link,document.createElement('br'),document.createTextNode(trialReview(r)));$('trial-best').append(row);}
