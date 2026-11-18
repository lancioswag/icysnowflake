#!/usr/bin/env bash
# Renders every screen of the app with the saved n8n answers and builds the screen map.
# Needs: node + playwright, python3 + Pillow, Chrome at /usr/bin/google-chrome.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); APP=$(cd "$HERE/../../public" && pwd)
export OUT=${OUT:-/tmp/screens/} MAP_OUT=${MAP_OUT:-/tmp/map/site}
mkdir -p "$OUT" "$MAP_OUT/img" /tmp/leaflet
[ -f /tmp/leaflet/package/dist/leaflet.js ] || (cd /tmp/leaflet && npm pack leaflet@1.9.4 --silent >/dev/null && tar xzf leaflet-1.9.4.tgz)
export LEAFLET_JS=/tmp/leaflet/package/dist/leaflet.js
(cd "$APP" && python3 -m http.server 8765 >/dev/null 2>&1 &) ; sleep 1
NODE_PATH=${NODE_PATH:-/opt/npm-tools/node_modules} node "$HERE/screens.js"
python3 - <<PY
from PIL import Image; import json,os
o=os.environ['OUT']; m=os.environ['MAP_OUT']
for i in json.load(open(o+'list.json')):
    v=Image.open(o+i+'.v.png').convert('RGB'); v.resize((400,int(v.size[1]*400/v.size[0]))).save(m+'/img/'+i+'.t.jpg',quality=78)
    f=Image.open(o+i+'.f.png').convert('RGB'); f.resize((600,int(f.size[1]*600/f.size[0]))).save(m+'/img/'+i+'.f.jpg',quality=72)
PY
python3 "$HERE/gen.py"
python3 "$HERE/screens_md.py" "$HERE/../SCREENS.md"
rm -rf "$HERE/../../public/map" && cp -r "$MAP_OUT" "$HERE/../../public/map"
echo "Screens in $OUT, map in $MAP_OUT"
