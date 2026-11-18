import json, os, re, sys
o = os.environ.get('OUT', '/tmp/screens/')
out = ['# Text of every screen (390 px, saved n8n answers)', '', 'Screenshots: https://icy-snowflake-1754.ricordatilamail18.workers.dev/map/ · ids as in the map. First line = title in the top bar.', '']
for i in json.load(open(o + 'list.json')):
    p = o + i + '.txt'
    t = open(p, encoding='utf-8').read() if os.path.exists(p) else ''
    t = re.sub(r'\n{2,}', '\n', t).strip()
    out += ['## ' + i, '```', t, '```', '']
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(out))
