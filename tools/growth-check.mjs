import {test} from 'node:test';
import assert from 'node:assert/strict';
import {growth,discover,sets,growthTitles} from '../camp-growth.mjs';
test('旧战绩与重新开局保留品阶，不重复累计旧关',()=>{const records={0:{finished:1,hits:20,perfect:10}};assert.equal(growth({records}).xp,120);assert.equal(growth({records,runs:[{records}]}).xp,120);assert.equal(growth({runs:[{records}]}).level,1);});
test('奇遇只奖励一次，失败打断连中',()=>{const p={};discover(p,{hit:false},{});assert.equal(discover(p,{hit:true,kind:'perfect'},{}).length,1);discover(p,{hit:true,kind:'perfect'},{});assert.equal(discover(p,{hit:true,kind:'perfect'},{}).length,1);assert.equal(discover(p,{hit:true,kind:'perfect'},{}).length,0);assert.equal(p.loot['relic-1-5'],1);});
test('六套收藏按不同物品解锁称号',()=>{const p={loot:{'relic-0-0':99}};assert.equal(sets(p)[0].count,1);for(let i=0;i<8;i++)p.loot[`relic-0-${i}`]=1;assert.ok(growthTitles(p).includes('伙房知己'));});
