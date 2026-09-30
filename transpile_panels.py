import re, json, sys
src = open('/home/claude/cad/utf8/CeilLT.cpp', encoding='utf-8', errors='ignore').read()
src = re.sub(r'//[^\n]*', '', src)
src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)

DEFS={'STS_INNER1_1000BY1000':450,'STS_INNER2_1000BY1000':480,'STS_OUT1_1000BY1000':100,'STS_OUT2_1000BY1000':180}
def ev(e):
    e=e.strip()
    for k,v in DEFS.items(): e=e.replace(k,str(v))
    if not re.fullmatch(r'[0-9+\-*/() ]+',e): raise ValueError(e)
    return int(eval(e))
def sts_filter(b, sts):
    m = re.search(r'if\s*\(\s*nIndex\s*&\s*CLT_STS_TEMPLATE\s*\)\s*\{', b)
    if not m: return b
    i=m.end(); d=1
    while d:
        d += (b[i]=='{')-(b[i]=='}'); i+=1
    inner=b[m.end():i-1]
    return b[:m.start()] + (inner if sts else '') + b[i:]
def body(name):
    m = re.search(r'void CCeilLT::'+re.escape(name)+r'\s*\([^)]*\)\s*\{', src)
    if not m: return None
    i = m.end(); d = 1
    while d:
        c = src[i]
        d += (c=='{') - (c=='}')
        i += 1
    return src[m.end():i-1]

def parse(b, sts=False):
    b = sts_filter(b, sts)
    objs = {}; out = []; warn = []
    for st in b.split(';'):
        st = st.strip()
        if not st: continue
        m = re.match(r'(?:C\w+\s*\*\s*)?(\w+)\s*=\s*new\s+(C\w+)\s*\(([^)]*)\)$', st)
        if m:
            v, t, a = m.groups(); a = [x.strip() for x in a.split(',')]
            objs[v] = {'t': t, 'pts': {}, 'style': a[2] if len(a)>2 else None,
                       'n': int(a[3]) if len(a)>3 and a[3].isdigit() else None}
            continue
        m = re.match(r'(\w+)->SetPoint\(\s*(\d+)\s*,\s*pt\s*\+\s*CPoint\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)\s*\)$', st)
        if m:
            v,n,x,y = m.groups(); objs[v]['pts'][int(n)] = [ev(x),ev(y)]; continue
        m = re.match(r'(\w+)->(SetCenter|SetStart|SetEnd)\(\s*pt\s*\+\s*CPoint\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)\s*\)$', st)
        if m:
            v,k,x,y = m.groups(); objs[v][k] = [ev(x),ev(y)]; continue
        m = re.match(r'(\w+)->SetRadius\(\s*(-?\d+)\s*\)$', st)
        if m:
            objs[m.group(1)]['r'] = int(m.group(2)); continue
        m = re.match(r'AddTail\((\w+)\)$', st)
        if m:
            o = dict(objs[m.group(1)]); out.append(o); continue
        warn.append(st[:100])
    return out, warn

def clean(objs):
    res = []
    for o in objs:
        t = o['t']
        if t in ('CLine',):
            p = [o['pts'][k] for k in sorted(o['pts'])]
            res.append({'k':'line','p':p})
        elif t in ('CPolygon','CRectangle'):
            p = [o['pts'][k] for k in sorted(o['pts'])]
            res.append({'k':'poly','p':p})
        elif t == 'CPolyline':
            p = [o['pts'][k] for k in sorted(o['pts'])]
            res.append({'k':'pline','p':p})
        elif t == 'CCircle':
            res.append({'k':'circle','c':o['SetCenter'],'r':o['r']})
        elif t == 'CArc':
            res.append({'k':'arc','o':{k:o.get(k) for k in ('SetCenter','SetStart','SetEnd')},'r':o.get('r')})
        else:
            res.append({'k':'?'+t})
    return res

fn = {'500x1000':'_500BY1000','500x1300':'_500BY1300','1000x500':'_1000BY500',
      '1000x1300':'_1000BY1300','1300x500':'_1300BY500','1300x1000':'_1300BY1000'}
T = {'SMC':{}, 'STS':{}}
for key,name in fn.items():
    o,w = parse(body(name)); o2,_ = parse(body(name),True);T['STS'][key]=clean(o2);
    print(name, len(o), 'warn:', w[:5], file=sys.stderr)
    T['SMC'][key] = clean(o)
for mat in ('SMC','STS'):
    o,w = parse(body(mat+'1000BY1000'), mat=='STS')
    print(mat+'1000BY1000', len(o), 'warn:', w[:5], file=sys.stderr)
    T[mat]['1000x1000'] = clean(o)
json.dump(T, open('/home/claude/cad/panel_templates.json','w'))
for m in T:
    for k,v in T[m].items():
        print(m,k,len(v), sorted(set(x['k'] for x in v)))
