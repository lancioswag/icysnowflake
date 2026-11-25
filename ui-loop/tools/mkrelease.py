#!/usr/bin/env python3
"""25 Nov (final handoff): freeze the app as public/release/<name>/ on the same Cloudflare site.
The release calls the DEMO copy of n8n (C – …: /navigator-claude, /assist-claude), keeps its answers under its own
storage key and has its own copy of cars.json, so later changes to / or /preview/ do not change it.
Usage: python3 mkrelease.py <name> <source-commit>"""
import pathlib, sys, json, shutil, datetime, hashlib
name, commit = sys.argv[1], sys.argv[2]
root = pathlib.Path(__file__).resolve().parents[2] / 'public'
s = (root / 'index.html').read_text(encoding='utf-8')
subs = [("storageKey: 'bevnav.v1'", "storageKey: 'bevnav.release.v1'")]
for a, b in subs:
    if s.count(a) != 1: sys.exit(f'pattern not found once: {a}')
    s = s.replace(a, b)
for must in ["navigator: '/navigator-claude'", "assist: '/assist-claude'", "fetch('cars.json')"]:
    if must not in s: sys.exit(f'expected {must}')
s = s.replace('<head>', f'<head>\n<meta name="robots" content="noindex">\n<meta name="bev-release" content="{name} {commit}">', 1)
out = root / 'release' / name
out.mkdir(parents=True, exist_ok=True)
(out / 'index.html').write_text(s, encoding='utf-8')
shutil.copy(root / 'cars.json', out / 'cars.json')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
(out / 'RELEASE.json').write_text(json.dumps({
    'name': name, 'source_commit': commit, 'built': datetime.datetime.utcnow().isoformat(timespec='seconds') + 'Z',
    'n8n': {'navigator': '/webhook/navigator-claude', 'assist': '/webhook/assist-claude', 'summary': '/webhook/summary', 'feedback': '/webhook/feedback'},
    'storage_key': 'bevnav.release.v1',
    'sha256': {'index.html': sha(out / 'index.html'), 'cars.json': sha(out / 'cars.json')},
}, indent=1), encoding='utf-8')
print('release built', out, len(s))
