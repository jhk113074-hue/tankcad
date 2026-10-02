import json
import re

pkg = json.load(open('package.json', encoding='utf-8'))
ver = pkg.get('version', '1.5.40')

src = open('web/index.src.html', encoding='utf-8').read()
src = re.sub(r'<span class="ver-badge">v[0-9.]+</span>', f'<span class="ver-badge">v{ver}</span>', src)
js = open('web/tank.js', encoding='utf-8').read()
tp = json.dumps(json.load(open('panel_templates.json')), separators=(',', ':'))
st = json.dumps(json.load(open('side_templates.json')), separators=(',', ':'))

out = (
    src.replace('/*__TANK_JS__*/', js.replace('</script>', '<\\/script>'))
    .replace('/*__TEMPLATES__*/', tp)
    .replace('/*__SIDE_TEMPLATES__*/', st)
)

open('web/index.html', 'w', encoding='utf-8').write(out)
open('index.html', 'w', encoding='utf-8').write(out)
print(f"Build OK (v{ver}):", len(out), "bytes")
