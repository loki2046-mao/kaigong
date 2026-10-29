import {chapterUnlocked} from './camp-challenge.mjs';
import {account} from './camp-economy.mjs';
export const STORY_ID='warm-return';
export const STORY_CHOICES={
 supper:{label:'先备热饭',task:'击碎一只旧空坛',kind:'jar',gift:'relic-0-4',giftName:'红绳葫芦',ending:'老周把一只红绳葫芦挂到饭棚前。往后晚归的人，远远就知道这里还有热饭。'},
 lantern:{label:'先留归灯',task:'射断一处旧灯绳',kind:'rope',gift:'relic-2-2',giftName:'灯穗结',ending:'老周把灯穗系在饭棚的新灯下。往后暮色落下，这盏灯总替归人留着。'}
};
export function storyState(p){return p.stories?.[STORY_ID]||{stage:'new',choice:null,count:0};}
export function chooseStory(p,choice){if(!STORY_CHOICES[choice]||storyState(p).stage!=='new')return false;p.stories??={};p.stories[STORY_ID]={stage:'first',choice,count:0,startedAt:Date.now()};return true;}
export function storyShot(p,result,kind){const state=storyState(p);if(!result.hit||!['first','second'].includes(state.stage))return false;const expected=state.stage==='first'?STORY_CHOICES[state.choice]?.kind:'disc';if(kind!==expected&&!(state.stage==='second'&&kind==='gate'))return false;state.count++;const goal=state.stage==='first'?1:2;if(state.count>=goal){state.stage=state.stage==='first'?'first-ready':'reward';state.count=0;}return true;}
export function advanceStory(p){const state=storyState(p);if(state.stage!=='first-ready')return false;state.stage='second';state.count=0;return true;}
export function claimStory(p){const state=storyState(p);if(state.stage!=='reward')return false;const choice=STORY_CHOICES[state.choice],a=account(p),receipt='story-'+STORY_ID;if(a.receipts[receipt]){state.stage='complete';return false;}a.receipts[receipt]=true;a.balance+=100;a.earned+=100;a.ledger.unshift({id:receipt,label:'归营热饭 · 老周谢礼',amount:100,at:Date.now()});a.ledger=a.ledger.slice(0,60);p.loot??={};p.loot[choice.gift]=(p.loot[choice.gift]||0)+1;state.stage='complete';state.completedAt=Date.now();return true;}
export function storyChapter(p){const stage=storyState(p).stage;return (stage==='first'||stage==='second')&&chapterUnlocked(p,0)?'camp.html?chapter=0':'camp.html';}
