"""Reviewed incremental 6.6.4 update; no personal-site or SSH/auth changes."""
import base64,hashlib,io,json,os,pathlib,shutil,subprocess,time,urllib.request,zipfile
PAYLOAD='__PAYLOAD__'
SHA='__SHA__'
def run(*args):return subprocess.run(args,check=True)
assert os.geteuid()==0,'请使用 sudo python3 执行'
base=pathlib.Path('/var/www/kaigong-cn');current=base/'current';old=current.resolve()
assert json.loads((old/'version.json').read_text())['version']=='6.6.3','需要以 6.6.3 为基础更新'
release=base/'releases/6.6.4-20261106'
assert not release.exists(),'目标版本目录已存在，请先检查上次更新状态'
raw=base64.b64decode(PAYLOAD);assert hashlib.sha256(raw).hexdigest()==SHA,'更新包校验失败'
caddy=pathlib.Path('/etc/caddy/sites/kaigong.caddy');original=caddy.read_bytes()
backup=caddy.with_name('kaigong.caddy.before-664-'+str(int(time.time())));backup.write_bytes(original)
service=pathlib.Path('/etc/systemd/system/kaigong-stats.service')
assert not service.exists(),'统计服务已存在，请检查后再更新'
shutil.copytree(old,release)
app=pathlib.Path('/opt/kaigong-stats');app.mkdir(exist_ok=True)
with zipfile.ZipFile(io.BytesIO(raw)) as z:
 for name in z.namelist():
  p=pathlib.PurePosixPath(name);assert not p.is_absolute() and '..' not in p.parts
  data=z.read(name)
  if name.startswith('web/'):
   dest=release/name[4:];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data);dest.chmod(0o644)
  elif name=='stats-relay.py':(app/name).write_bytes(data);(app/name).chmod(0o644)
  elif name=='kaigong-stats.service':service.write_bytes(data);service.chmod(0o644)
  elif name=='kaigong.caddy':candidate=data
footer='<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2026074673号-1</a>'
for p in release.glob('*.html'):
 s=p.read_text()
 if '</footer>' in s and '京ICP备2026074673号-1' not in s:p.write_text(s.replace('</footer>',' <span>·</span> '+footer+'</footer>'))
if subprocess.run(['id','-u','kaigong-stats'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
 run('useradd','--system','--user-group','--no-create-home','--shell','/usr/sbin/nologin','kaigong-stats')
run('systemctl','daemon-reload');run('systemctl','enable','--now','kaigong-stats')
try:
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
 for i in range(10):
  try:
   with opener.open('http://127.0.0.1:8799/health',timeout=2) as r:assert json.load(r)['ok']
   break
  except (OSError,ValueError):
   if i==9:raise
   time.sleep(1)
 caddy.write_bytes(candidate)
 run('caddy','validate','--config','/etc/caddy/Caddyfile','--adapter','caddyfile')
 pending=base/'current.next';assert not pending.exists();pending.symlink_to(release);os.replace(pending,current)
 run('systemctl','reload','caddy');run('systemctl','is-active','--quiet','caddy')
except Exception:
 caddy.write_bytes(original)
 pending=base/'current.rollback';pending.symlink_to(old);os.replace(pending,current)
 subprocess.run(['systemctl','reload','caddy']);subprocess.run(['systemctl','disable','--now','kaigong-stats'])
 raise
print('KAIGONG_UPDATED',release,'LOCAL_STATS_READY','BACKUP',backup)
print('检查同步状态：curl -s http://127.0.0.1:8799/health')
