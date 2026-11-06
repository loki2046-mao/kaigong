import test from 'node:test';import assert from 'node:assert/strict';import{spawnSync}from'node:child_process';
import worker,{dayAt,validVisit,rateLimitKey}from'../stats-service/worker.mjs';import{dailyVisitor,visitDay}from'../visit-stats.mjs';
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

test('国内代理限流仅信任实际服务器 IP，伪造头不能切换限流身份',()=>{
 const env={CN_PROXY_IP:'49.232.36.74'};
 const req=(peer,client)=>new Request('https://stats.internal/stats',{headers:{'CF-Connecting-IP':peer,'X-Kaigong-Client-IP':client}});
 assert.equal(rateLimitKey(req('49.232.36.74','1.2.3.4'),env),'cn:1.2.3.4');
 assert.equal(rateLimitKey(req('49.232.36.74','2001:db8::1'),env),'cn:2001:db8::1');
 assert.equal(rateLimitKey(req('8.8.8.8','1.2.3.4'),env),'8.8.8.8');
 assert.equal(rateLimitKey(req('49.232.36.74','arbitrary-key'),env),'49.232.36.74');
 assert.equal(rateLimitKey(req('49.232.36.74','1.2.3.4'),{}),'49.232.36.74');
});
test('分站统计必须提供管理员访问码，未授权不触碰数据库',async()=>{let accessed=false;const env={ADMIN_STATS_TOKEN:'test-admin',LIMITER:{limit:async()=>({success:true})},DB:{prepare(){accessed=true;throw Error('unexpected')}}};for(const token of ['', 'Bearer wrong']){const r=await worker.fetch(new Request('https://stats.test/experience-stats',{headers:{Authorization:token}}),env,{});assert.equal(r.status,401);assert.equal(r.headers.get('Cache-Control'),'no-store');}assert.equal(accessed,false);});

test('断网补报保留原日期，仅接受最近七天，未来与无效日期拒绝',()=>{
 const v={visitor:one,event:two};
 assert.ok(validVisit({...v,day:'2026-11-05'},'2026-11-06'));
 assert.ok(validVisit({...v,day:'2026-10-30'},'2026-11-06'));
 for(const day of ['2026-10-29','2026-11-07','2026-02-30','not-a-day'])assert.ok(!validVisit({...v,day},'2026-11-06'));
});
