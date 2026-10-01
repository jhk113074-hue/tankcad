import json

src = open('web/index.src.html', encoding='utf-8').read()
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
print("Build OK:", len(out), "bytes")
