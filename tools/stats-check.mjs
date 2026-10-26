import test from 'node:test';import assert from 'node:assert/strict';import{spawnSync}from'node:child_process';
import worker,{dayAt,validVisit}from'../stats-service/worker.mjs';import{dailyVisitor,visitDay}from'../visit-stats.mjs';
const one='11111111-1111-4111-8111-111111111111',two='22222222-2222-4222-8222-222222222222';
const PAGES='https://kaigong-loki.pages.dev',CN='https://kaigong.hiloki.cn',EVIL='https://evil.test';
test('统计按北京时间跨日，匿名ID跨日复用以便累计去重',()=>{const t=Date.parse('2026-10-25T16:00:00Z');assert.equal(dayAt(t),'2026-10-26');assert.equal(visitDay(t-1),'2026-10-25');const map=new Map(),s={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};assert.equal(dailyVisitor(s,'2026-10-25',()=>one),one);assert.equal(dailyVisitor(s,'2026-10-25',()=>two),one);assert.equal(dailyVisitor(s,'2026-10-26',()=>two),one);assert.equal(map.size,1);});
test('拒绝多余字段、姓名或伪造日期',()=>{const d=dayAt(),v={day:d,visitor:one,event:two};assert.ok(validVisit(v,d));assert.ok(!validVisit({...v,name:'不得上传'},d));assert.ok(!validVisit({...v,day:'2000-01-01'},d));assert.ok(!validVisit({...v,visitor:'bad'},d));});
test('来源、请求类型、限流与超长请求在访问数据库前被拦截',async()=>{let accessed=false;const env={DB:{prepare(){accessed=true;throw Error('unexpected')}},LIMITER:{limit:async()=>({success:true})}};const run=(path,options)=>worker.fetch(new Request('https://stats.test'+path,options),env,{waitUntil(){}});assert.equal((await run('/visit',{method:'POST',headers:{Origin:EVIL}})).status,403);assert.equal((await run('/visit',{method:'GET'})).status,405);assert.equal((await run('/visit',{method:'POST',headers:{Origin:PAGES,'Content-Type':'application/json'},body:'x'.repeat(513)})).status,413);env.LIMITER.limit=async()=>({success:false});assert.equal((await run('/stats',{})).status,429);assert.equal(accessed,false);});
test('双 Origin 白名单：pages.dev 与 hiloki.cn 允许，evil 拒绝；CORS 回显对应 Origin',async()=>{
 const env={DB:{prepare(){throw Error('unexpected')}},LIMITER:{limit:async()=>({success:true})}};
 const run=(path,options)=>worker.fetch(new Request('https://stats.test'+path,options),env,{waitUntil(){}});
 for(const origin of [PAGES,CN]){
  const pre=await run('/visit',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST'}});
  assert.equal(pre.status,204,origin+' OPTIONS');
  assert.equal(pre.headers.get('Access-Control-Allow-Origin'),origin);
  assert.equal(pre.headers.get('Access-Control-Allow-Methods'),'POST');
  const post=await run('/visit',{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain'},body:'{}'});
  assert.equal(post.status,415,origin+' bad content-type still CORS');
  assert.equal(post.headers.get('Access-Control-Allow-Origin'),origin);
 }
 const badOpt=await run('/visit',{method:'OPTIONS',headers:{Origin:EVIL}});
 assert.equal(badOpt.status,403);
 assert.notEqual(badOpt.headers.get('Access-Control-Allow-Origin'),EVIL);
 const badPost=await run('/visit',{method:'POST',headers:{Origin:EVIL,'Content-Type':'application/json'},body:'{}'});
 assert.equal(badPost.status,403);
 const get=await run('/stats',{method:'GET',headers:{Origin:CN}});
 // GET may be * or echoed whitelist; either is fine if not echoing evil
 assert.ok(['*',CN].includes(get.headers.get('Access-Control-Allow-Origin')));
});
test('真实SQL事务去重、累计UV/PV及保留每日汇总',()=>{const code=`import sqlite3,pathlib
c=sqlite3.connect(':memory:');c.executescript(pathlib.Path('stats-service/schema.sql').read_text())
for visitor,event in [('a','1'),('a','1'),('a','2'),('b','3')]:
 with c:
  c.execute('INSERT OR IGNORE INTO all_visitors VALUES(?)',(visitor,))
  c.execute('INSERT OR IGNORE INTO visitors VALUES(?,?)',('2026-10-26',visitor))
  c.execute('INSERT OR IGNORE INTO events VALUES(?,?)',('2026-10-26',event))
assert c.execute('SELECT uv,pv FROM daily').fetchone()==(2,3)
c.execute('DELETE FROM visitors');c.execute('DELETE FROM events')
assert c.execute('SELECT uv,pv FROM daily').fetchone()==(2,3)
assert c.execute('SELECT uv,pv FROM totals').fetchone()==(2,3)
with c:
 c.execute('INSERT OR IGNORE INTO all_visitors VALUES(?)',('a',))
 c.execute('INSERT INTO visitors VALUES(?,?)',('2026-10-27','a'))
 c.execute('INSERT INTO events VALUES(?,?)',('2026-10-27','4'))
assert c.execute('SELECT uv,pv FROM totals').fetchone()==(2,4)
assert c.execute('SELECT uv,pv FROM daily WHERE day=?',('2026-10-27',)).fetchone()==(1,1)
`;const result=spawnSync('python3',['-c',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);});
