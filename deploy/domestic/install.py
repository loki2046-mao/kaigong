"""Run as root after reviewing. No passwords, SSH changes, or personal-site writes."""
import hashlib, os, pathlib, subprocess, tempfile, time, zipfile, json, urllib.request
BASE = pathlib.Path('/var/www/kaigong-cn')
VERSION = '6.6.2-20261106'
ZIP_URL = 'https://f9cdb7c9.kaigong-loki.pages.dev/kaigong-6.6.2.zip'
ZIP_SHA = 'b04edbce489cb84bfcce8a70d36eeb5fb1c226f1349b7bbb6756836f740238a2'

def install(caddy_block):
    assert os.geteuid() == 0, 'Run with sudo'
    config = pathlib.Path('/etc/caddy/Caddyfile')
    original = config.read_bytes()
    if b'kaigong' in original:
        raise RuntimeError('Existing game config found; review before replacing')
    release = BASE / 'releases' / VERSION
    assert not release.exists(), 'Release already exists; inspect before retrying'
    BASE.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='kaigong-') as tmp:
        archive = pathlib.Path(tmp) / 'game.zip'
        subprocess.run(['curl','-fL','--retry','2','--connect-timeout','10','--max-time','240','-o',str(archive),ZIP_URL],check=True)
        assert hashlib.sha256(archive.read_bytes()).hexdigest() == ZIP_SHA, 'Release hash mismatch'
        with zipfile.ZipFile(archive) as z:
            for name in z.namelist():
                p=pathlib.PurePosixPath(name)
                assert not p.is_absolute() and '..' not in p.parts, 'Unsafe archive path'
            release.mkdir(parents=True)
            z.extractall(release)
    assert json.loads((release/'version.json').read_text())['version']=='6.6.2'
    # Filing link belongs to the CN domain. Text remains real HTML, using existing UI fonts.
    footer='<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2026074673号-1</a>'
    for p in release.glob('*.html'):
        s=p.read_text()
        if '</footer>' in s:s=s.replace('</footer>',' <span>·</span> '+footer+'</footer>')
        p.write_text(s)
    for p in release.rglob('*'):p.chmod(0o755 if p.is_dir() else 0o644)
    release.chmod(0o755)
    current=BASE/'current';pending=BASE/'current.next'
    assert not pending.exists()
    pending.symlink_to(release)
    old_link=os.readlink(current) if current.is_symlink() else None
    assert not current.exists() or current.is_symlink(), 'Unexpected current directory'
    os.replace(pending,current)
    sites=pathlib.Path('/etc/caddy/sites');sites.mkdir(exist_ok=True)
    block=sites/'kaigong.caddy'
    assert not block.exists(), 'Existing game site config found'
    block.write_text(caddy_block);block.chmod(0o644)
    candidate=pathlib.Path('/etc/caddy/Caddyfile.kaigong-next')
    candidate.write_bytes(original+b'\nimport /etc/caddy/sites/kaigong.caddy\n')
    subprocess.run(['caddy','validate','--config',str(candidate),'--adapter','caddyfile'],check=True)
    assert config.read_bytes()==original, 'Caddy config changed concurrently; refusing overwrite'
    backup=pathlib.Path('/etc/caddy/Caddyfile.before-kaigong-'+str(int(time.time())))
    backup.write_bytes(original)
    os.replace(candidate,config)
    try:
        subprocess.run(['systemctl','reload','caddy'],check=True)
        subprocess.run(['systemctl','is-active','--quiet','caddy'],check=True)
    except Exception:
        config.write_bytes(original)
        if old_link:
            pending.symlink_to(old_link);os.replace(pending,current)
        subprocess.run(['systemctl','reload','caddy'])
        raise
    print('KAIGONG_DEPLOYED',release,'BACKUP',backup,flush=True)

if __name__=='__main__':
    import sys
    install(pathlib.Path(sys.argv[1]).read_text())
