import json
import re

pkg = json.load(open('package.json', encoding='utf-8'))
ver = pkg.get('version', '1.6.22')

src = open('web/index.src.html', encoding='utf-8').read()
src = re.sub(r'<title>.*?</title>', f'<title>YSACC TANK CAD v{ver}</title>', src)
src = re.sub(r'(<span class="ver-badge"[^>]*>)v[^<]*(</span>)', rf'\g<1>v{ver}\g<2>', src)
js = open('web/tank.js', encoding='utf-8').read()
tp = json.dumps(json.load(open('panel_templates.json')), separators=(',', ':'))
st = json.dumps(json.load(open('side_templates.json')), separators=(',', ':'))
skid_parts_js = open('web/skid_parts_data.js', encoding='utf-8').read()
try:
    skid_parts_lib_js = open('web/skid_parts_lib.js', encoding='utf-8').read()
except FileNotFoundError:
    skid_parts_lib_js = ''

out = (
    src.replace('/*__SKID_PARTS_DATA__*/', skid_parts_js.replace('</script>', '<\\/script>'))
    .replace('/*__SKID_PARTS_LIB__*/', skid_parts_lib_js.replace('</script>', '<\\/script>'))
    .replace('/*__TANK_JS__*/', js.replace('</script>', '<\\/script>'))
    .replace('/*__TEMPLATES__*/', tp)
    .replace('/*__SIDE_TEMPLATES__*/', st)
)

open('web/index.html', 'w', encoding='utf-8').write(out)
open('index.html', 'w', encoding='utf-8').write(out)
print(f"Build OK (v{ver}):", len(out), "bytes")
