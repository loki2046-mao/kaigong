import {test} from 'node:test';import assert from 'node:assert/strict';import {activeEquipment,applyEquipment} from '../camp-equipment.mjs';import {outfitTier,unlockedOutfits} from '../camp-wardrobe.mjs';
test('历史解锁和已选后期衣装不能提前带入第一回或重玩关卡',()=>{
 for(const character of ['female','male'])for(const outfit of ['ranger','general','silver','winter']){
  const p={character,outfit,progress:{mission:59,complete:true},runs:[{progress:{complete:true}}]};
  for(let mission=0;mission<10;mission++)assert.equal(outfitTier(p,mission),0);
  assert.equal(unlockedOutfits(p).length,5,'不删除已解锁衣装');
 }
 const p={outfit:'winter',progress:{mission:0},runs:[{progress:{complete:true}}]};
 for(const [mission,tier]of [[9,0],[10,3],[14,3],[15,1],[19,1],[20,2],[29,2],[30,4]])assert.equal(outfitTier(p,mission),tier);
});
test('未持有的工具无效，竞技模式禁用',()=>{assert.equal(activeEquipment({tool:'relic-1-2'}),null);assert.equal(activeEquipment({tool:'relic-1-2',loot:{'relic-1-2':1}},true),null);});
test('工具只修改指定参数且竞技模式不生效',()=>{assert.equal(applyEquipment({gain:100},{tool:'relic-1-2'}).gain,92);assert.equal(applyEquipment({gain:100},{tool:'relic-1-2',competitive:true}).gain,100);assert.equal(applyEquipment({mounted:true,rideAmplitude:20},{tool:'relic-3-0'}).rideAmplitude,18);});
test('原有三套解锁不推迟，穿回旧装，历史进度保留',()=>{const p={progress:{mission:20},outfit:'recruit'};assert.equal(outfitTier(p,20),0);assert.ok(unlockedOutfits(p).some(o=>o.id==='silver'));assert.ok(unlockedOutfits({runs:[{progress:{complete:true}}]}).some(o=>o.id==='silver'));});
import {migrateQuestTools} from '../camp-equipment.mjs';
import {grantLoot} from '../camp-loot.mjs';
import {QUESTS,questHit} from '../camp-rewards.mjs';
test('旧委托迁移赠品只补缺失原件，不重复增发',()=>{const p={quests:{cook:{claimed:true}},loot:{}};migrateQuestTools(p);migrateQuestTools(p);assert.equal(p.loot['relic-1-2'],1);});
test('同伴定向谢礼只消耗一次，领奖去重保持有效',()=>{const p={lootFocus:3};const item=grantLoot(p,'run-0-mission-1',()=>.5);assert.ok(item.id.startsWith('relic-3-'));assert.equal(p.lootFocus,undefined);assert.equal(grantLoot(p,'run-0-mission-1'),null);});
test('书吏委托只记神射，普通命中不增加',()=>{const p={quests:{scribe:{count:0}}};questHit(p,{hit:true,kind:'good'},'disc',false);assert.equal(p.quests.scribe.count,0);questHit(p,{hit:true,kind:'perfect'},'disc',false);assert.equal(p.quests.scribe.count,1);assert.ok(QUESTS.find(q=>q.id==='scribe').gift);});
