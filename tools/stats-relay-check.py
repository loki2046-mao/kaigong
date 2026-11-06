import importlib.util,tempfile,pathlib,threading,urllib.request,urllib.error,json,time,uuid
spec=importlib.util.spec_from_file_location('relay','deploy/domestic/stats-relay.py');r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
with tempfile.TemporaryDirectory() as d:
 r.DB=str(pathlib.Path(d)/'db');r.init()
 server=r.ThreadingHTTPServer(('127.0.0.1',0),r.Handler);server.rates={};server.minute=0;server.rate_lock=threading.Lock()
 threading.Thread(target=server.serve_forever,daemon=True).start()
 base='http://127.0.0.1:'+str(server.server_port)
 def request(path,data=None,headers=None):
  req=urllib.request.Request(base+path,data=None if data is None else json.dumps(data).encode(),headers={'Origin':r.ORIGIN,'Content-Type':'application/json',**(headers or {})})
  try:
   with urllib.request.urlopen(req,timeout=2) as response: return response.status,json.load(response)
  except urllib.error.HTTPError as e:return e.code,json.load(e)
 today=r.datetime.now(r.timezone(r.timedelta(hours=8))).date().isoformat()
 visit={'day':today,'visitor':str(uuid.uuid4()),'event':str(uuid.uuid4())}
 def offline(*args,**kwargs):raise OSError('network offline')
 r.upstream=offline
 started=time.monotonic()
 assert request('/api/visits/visit',visit)[0]==202
 assert time.monotonic()-started<1,'local acceptance waits for network'
 assert request('/api/visits/visit',visit)[0]==202
 r.cycle();r.init() # restart keeps pending rows
 assert request('/health')[1]['pending']==1
 assert request('/api/visits/stats')[0]==503,'no fabricated zero counts'
 assert request('/api/visits/experience-stats')[0]==401
 assert request('/api/visits/visit',visit,{'Origin':'https://evil.test'})[0]==403
 counts={'day':today,'uv':12,'pv':17,'totalUv':141,'totalPv':316}
 calls=[]
 def online(path,body=None,headers=None):
  calls.append(path)
  return 200,({'ok':True} if path=='/visit' else counts)
 r.upstream=online;r.cycle()
 assert request('/health')[1]['pending']==0
 assert calls.count('/visit')==1
 r.cycle();assert calls.count('/visit')==1,'acknowledged event resent'
 r.upstream=offline
 with r.connect() as c:c.execute('UPDATE cache SET updated=?',(time.time()-120,))
 code,data=request('/api/visits/stats')
 assert code==200 and data['totalPv']==316 and data['stale'] is True
 assert request('/api/visits/experience-stats',headers={'Authorization':'Bearer wrong'})[0]==503
 with r.connect() as c:
  assert 'wrong' not in str(c.execute('SELECT * FROM cache').fetchall()),'private token cached'
 server.shutdown();server.server_close()
 print('PASS: offline acceptance <1s, durable restart, dedup, retry, cached stale counts, no private cache, Origin validation')
