"""Loopback-only durable CN visit relay. No dependencies; never caches private data."""
import json, os, sqlite3, threading, time, urllib.request, urllib.error, uuid
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ORIGIN = 'https://kaigong.hiloki.cn'
UPSTREAM = os.environ.get('KAIGONG_STATS_UPSTREAM', 'https://kaigong-loki.pages.dev/api/visits')
DB = os.environ.get('KAIGONG_STATS_DB', '/var/lib/kaigong-stats/relay.sqlite3')
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def connect():
    c = sqlite3.connect(DB, timeout=5)
    c.execute('PRAGMA busy_timeout=5000')
    return c

def init():
    Path(DB).parent.mkdir(parents=True, exist_ok=True)
    with connect() as c:
        c.execute('PRAGMA journal_mode=WAL')
        c.executescript('''CREATE TABLE IF NOT EXISTS outbox(event TEXT PRIMARY KEY, body TEXT NOT NULL, created REAL NOT NULL, sent REAL, error TEXT);
        CREATE TABLE IF NOT EXISTS cache(id INTEGER PRIMARY KEY, body TEXT NOT NULL, updated REAL NOT NULL);''')

def valid(data):
    if not isinstance(data, dict) or set(data) != {'day','visitor','event'}: return False
    try:
        for key in ('visitor','event'):
            if str(uuid.UUID(data[key], version=4)) != data[key].lower(): return False
        day = datetime.strptime(data['day'], '%Y-%m-%d').date()
        today = datetime.now(timezone(timedelta(hours=8))).date()
        return 0 <= (today - day).days <= 7
    except (ValueError, TypeError, AttributeError): return False

def upstream(path, body=None, headers=None):
    h = {'User-Agent':'KaigongCN/6.6.4 Mozilla/5.0','Origin':ORIGIN}
    if body is not None: h['Content-Type']='application/json'
    h.update(headers or {})
    req = urllib.request.Request(UPSTREAM+path, data=body, headers=h)
    with OPENER.open(req, timeout=6) as r: return r.status, json.load(r)

def cycle():
    # A timeout may occur after commit: retry the SAME event ID; D1 deduplicates it.
    with connect() as c:
        rows = c.execute('SELECT event,body FROM outbox WHERE sent IS NULL AND error IS NULL ORDER BY created LIMIT 8').fetchall()
    for event, body in rows:
        try:
            status, data = upstream('/visit', body.encode())
            if not data.get('ok'): break
            with connect() as c: c.execute('UPDATE outbox SET sent=? WHERE event=?',(time.time(),event))
        except urllib.error.HTTPError as e:
            if e.code == 400:
                with connect() as c: c.execute('UPDATE outbox SET error=? WHERE event=?',('invalid_or_expired',event))
                continue
            break
        except (OSError, ValueError): break
    try:
        _, data = upstream('/stats')
        if not all(type(data.get(k)) is int and data[k] >= 0 for k in ('uv','pv','totalUv','totalPv')): return
        with connect() as c:
            c.execute('INSERT OR REPLACE INTO cache VALUES(1,?,?)',(json.dumps(data),time.time()))
            c.execute('DELETE FROM outbox WHERE sent IS NOT NULL AND sent<?',(time.time()-8*86400,))
    except (OSError, ValueError): pass

def sync_loop():
    while True:
        try: cycle()
        except Exception as e: print('sync_error',type(e).__name__,flush=True)
        time.sleep(15)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass  # Never log Authorization or anonymous IDs.
    def reply(self, status, data):
        raw=json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        self.end_headers()
        self.wfile.write(raw)
    def do_GET(self):
        route=self.path.split('?')[0]
        if route == '/health':
            with connect() as c:
                pending=c.execute('SELECT COUNT(*) FROM outbox WHERE sent IS NULL AND error IS NULL').fetchone()[0]
                failed=c.execute('SELECT COUNT(*) FROM outbox WHERE error IS NOT NULL').fetchone()[0]
                row=c.execute('SELECT updated FROM cache WHERE id=1').fetchone()
            return self.reply(200,{'ok':True,'pending':pending,'failed':failed,'syncedAt':row[0] if row else None})
        if route == '/api/visits/stats':
            with connect() as c: row=c.execute('SELECT body,updated FROM cache WHERE id=1').fetchone()
            if not row: return self.reply(503,{'error':'initial_sync_pending'})
            data=json.loads(row[0]); data.update(syncedAt=row[1],stale=time.time()-row[1]>90)
            return self.reply(200,data)
        if route == '/api/visits/experience-stats':
            auth=self.headers.get('Authorization','')
            if not auth.startswith('Bearer '): return self.reply(401,{'error':'unauthorized'})
            try:
                status,data=upstream('/experience-stats',headers={'Authorization':auth})
                return self.reply(status,data)
            except urllib.error.HTTPError as e: return self.reply(e.code,{'error':'unauthorized' if e.code==401 else 'upstream_unavailable'})
            except (OSError,ValueError): return self.reply(503,{'error':'upstream_unavailable'})
        self.reply(404,{'error':'not_found'})
    def do_POST(self):
        if self.path != '/api/visits/visit': return self.reply(404,{'error':'not_found'})
        if self.headers.get('Origin') != ORIGIN: return self.reply(403,{'error':'origin'})
        if not self.headers.get('Content-Type','').startswith('application/json'): return self.reply(415,{'error':'content_type'})
        try: length=int(self.headers.get('Content-Length','0'))
        except ValueError: return self.reply(400,{'error':'body'})
        if not 0 < length <= 512: return self.reply(413,{'error':'body_size'})
        try: data=json.loads(self.rfile.read(length))
        except (ValueError,OSError): return self.reply(400,{'error':'json'})
        if not valid(data): return self.reply(400,{'error':'invalid_visit'})
        # Per-address limit in memory, no IP written to the database. Caddy replaces header.
        peer=self.headers.get('X-Kaigong-Client-IP',self.client_address[0])
        now=int(time.time()//60)
        with self.server.rate_lock:
            if self.server.minute != now: self.server.rates.clear(); self.server.minute=now
            n=self.server.rates.get(peer,0)
            if n>=60: return self.reply(429,{'error':'rate_limited'})
            self.server.rates[peer]=n+1
        try:
            with connect() as c:
                if c.execute('SELECT COUNT(*) FROM outbox WHERE sent IS NULL').fetchone()[0]>=100000: return self.reply(503,{'error':'queue_full'})
                c.execute('INSERT OR IGNORE INTO outbox(event,body,created) VALUES(?,?,?)',(data['event'],json.dumps(data),time.time()))
            self.reply(202,{'ok':True,'queued':True,'day':data['day']})
        except sqlite3.Error: self.reply(503,{'error':'storage_unavailable'})

if __name__ == '__main__':
    init()
    server=ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('KAIGONG_STATS_PORT','8799'))),Handler)
    server.rates={};server.minute=0;server.rate_lock=threading.Lock()
    threading.Thread(target=sync_loop,daemon=True).start()
    server.serve_forever()
