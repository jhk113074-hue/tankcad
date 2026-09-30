import re, json, sys
src = open('utf8/SideLT.cpp', encoding='utf-8', errors='ignore').read()
src = re.sub(r'//[^\n]*', '', src)
src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
hdr = open('utf8/SideLT.h', encoding='utf-8', errors='ignore').read()
DEFS = {}
for m in re.finditer(r'#define\s+(STS_\w+)\s+(\d+)', hdr): DEFS[m.group(1)] = int(m.group(2))
DEFS['STS_RADIUS'] = 500 - DEFS['STS_INNER1_1000BY1000']

def ev(e):
    e = e.strip()
    for k in sorted(DEFS, key=len, reverse=True): e = e.replace(k, '(%d)' % DEFS[k])
    if not re.fullmatch(r'[0-9+\-*/() .]+', e): raise ValueError(e)
    v = eval(e); return v

def body(name):
    m = re.search(r'void CSideLT::' + re.escape(name) + r'\s*\([^)]*\)\s*\{', src)
    if not m: return None
    i = m.end(); d = 1
    while d:
        c = src[i]; d += (c == '{') - (c == '}'); i += 1
    return src[m.end():i-1]

PT = r'pt\s*\+\s*CPoint\(\s*([^,()]+?(?:\([^()]*\))?[^,()]*?)\s*,\s*([^()]+?(?:\([^()]*\))?[^()]*?)\s*\)'
def parse(b, label):
    objs = {}; out = []; warn = []
    for st in b.split(';'):
        st = st.strip()
        if not st: continue
        m = re.match(r'(?:C\w+\s*\*\s*)?(\w+)\s*=\s*new\s+(C\w+)\s*\((.*)\)$', st)
        if m:
            objs[m.group(1)] = {'t': m.group(2), 'pts': {}}; continue
        if re.match(r'C\w+\s*\*\s*\w+\s*=\s*NULL$', st) or re.match(r'C\w+\s*\*\s*\w+$', st): continue
        m = re.match(r'(\w+)->SetPoint\(\s*(\d+)\s*,\s*' + PT + r'\s*\)$', st)
        if m:
            v, n, x, y = m.groups()
            if v not in objs: warn.append('NOOBJ ' + st[:80]); continue
            objs[v]['pts'][int(n)] = [ev(x), ev(y)]; continue
        m = re.match(r'(\w+)->(SetCenter|SetStart|SetEnd)\(\s*' + PT + r'\s*\)$', st)
        if m:
            v, k, x, y = m.groups(); objs[v][k] = [ev(x), ev(y)]; continue
        m = re.match(r'(\w+)->SetRadius\(\s*int\(GLFUNC::gGetDist\(\s*pt\+CPoint\((\d+),\s*(\d+)\),\s*pt\+CPoint\((\d+),\s*(\d+)\)\)\)\s*\)$', st)
        if m:
            import math
            v,a,b,c,d = m.groups(); objs[v]['r'] = int(math.hypot(int(a)-int(c), int(b)-int(d))); continue
        m = re.match(r'(\w+)->SetRadius\(\s*([^()]+?(?:\([^()]*\))?[^()]*?)\s*\)$', st)
        if m: objs[m.group(1)]['r'] = ev(m.group(2)); continue
        m = re.match(r'AddTail\((\w+)\)$', st)
        if m: out.append(dict(objs[m.group(1)])); continue
        warn.append(st[:120])
    res = []
    for o in out:
        t = o['t']
        if t == 'CLine': res.append({'k': 'line', 'p': [o['pts'][k] for k in sorted(o['pts'])]})
        elif t == 'CPolygon': res.append({'k': 'poly', 'p': [o['pts'][k] for k in sorted(o['pts'])]})
        elif t == 'CArc': res.append({'k': 'arc', 'c': o['SetCenter'], 's': o['SetStart'], 'e': o['SetEnd'], 'r': o['r']})
        else: res.append({'k': '?' + t})
    if warn: print(label, 'WARN', warn[:6], file=sys.stderr)
    return res

sizes = {'500x500':'_500BY500','500x1000':'_500BY1000','500x1300':'_500BY1300','500x1500':'_500BY1500','500x2000':'_500BY2000',
 '1000x500':'_1000BY500','1000x1000':'_1000BY1000','1000x1300':'_1000BY1300','1000x1500':'_1000BY1500','1000x2000':'_1000BY2000',
 '1300x500':'_1300BY500','1300x1000':'_1300BY1000'}
special = {'500x1000':('SMC500BY1000','STS500BY1000'),'1000x500':('SMC1000BY500','STS1000BY500'),'1000x1000':('SMC1000BY1000','STS1000BY1000')}
T = {'SMC': {}, 'STS': {}}
for key, fn in sizes.items():
    if key in special:
        T['SMC'][key] = parse(body(special[key][0]), special[key][0]); T['STS'][key] = parse(body(special[key][1]), special[key][1])
    else:
        r = parse(body(fn), fn); T['SMC'][key] = r; T['STS'][key] = r
json.dump(T, open('side_templates.json', 'w'))
for m in T:
    for k, v in T[m].items(): print(m, k, len(v), sorted(set(x['k'] for x in v)))
