import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBackup,restoreBackup,RECOVERY_KEY} from '../profile-backup.mjs';
import {PROFILE_KEY} from '../camp-profile.mjs';
const fixture=()=>({active:0,slots:[{name:'Loki',character:'female',progress:{mission:0},records:{},loot:{'relic-0-1':2}},null,null]});
test('backup round trip retains earned items and three slots',()=>assert.deepEqual(parseBackup(JSON.stringify(fixture())),fixture()));
test('malformed and hostile backups cannot enter storage',()=>{for(const value of ['{}','null','{','{"active":0,"slots":[{"name":"a","character":"female","__proto__":{}},null,null]}'])assert.throws(()=>parseBackup(value));});
test('restore keeps exact previous book before replacing',()=>{const m=new Map([[PROFILE_KEY,'original']]);restoreBackup({getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)},fixture());assert.equal(m.get(RECOVERY_KEY),'original');assert.deepEqual(JSON.parse(m.get(PROFILE_KEY)),fixture());});
test('recovery write failure never overwrites live progress',()=>{let written=false;assert.throws(()=>restoreBackup({getItem:()=> 'original',setItem:k=>{if(k===RECOVERY_KEY)throw Error('quota');written=true;}},fixture()));assert.equal(written,false);});
