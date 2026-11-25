#!/usr/bin/env python3
"""25 Nov: build public/preview/index.html from public/index.html.
The preview runs on the same Cloudflare site under /preview/, calls the TEST copy of n8n (/navigator-test)
and keeps its answers under its own storage key, so the public demo at / is not touched."""
import pathlib, sys
root = pathlib.Path(__file__).resolve().parents[2] / 'public'
s = (root / 'index.html').read_text(encoding='utf-8')
subs = [
    ("navigator: '/navigator-claude'", "navigator: '/navigator-test'"),
    ("storageKey: 'bevnav.v1'", "storageKey: 'bevnav.preview.v1'"),
    ("fetch('cars.json')", "fetch('/cars.json')"),
]
for a, b in subs:
    if s.count(a) != 1: sys.exit(f'pattern not found once: {a}')
    s = s.replace(a, b)
s = s.replace('<head>', '<head>\n<meta name="robots" content="noindex">', 1)
s = s.replace('<title>BEV Navigator', '<title>BEV Navigator (preview)', 1)
(root / 'preview').mkdir(exist_ok=True)
(root / 'preview' / 'index.html').write_text(s, encoding='utf-8')
print('preview built', len(s))
