"""Steel_Skin_Drawing(35mm).dwg -> web/skid_parts_lib.js 추출기

실제 스틸 스키드 부품도(75 Angle / 125 Channel / 150 Channel, (O)형) DWG를
LibreDWG(dwg2dxf)로 DXF 변환한 뒤, 3000 x 2500 셀 격자 단위로 부품을 잘라
TankCAD 엔티티 포맷(line/poly/circle/arc/text/solid)으로 저장한다.

사용법:
  dwg2dxf -y -o skin.dxf "예제도면/Steel_Skin_Drawing(35mm).dwg"
  python tools/extract_skin_parts.py skin.dxf
"""
import io
import json
import math
import re
import sys

import ezdxf
from ezdxf import recover, disassemble

SRC = sys.argv[1] if len(sys.argv) > 1 else 'skin.dxf'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'web/skid_parts_lib.js'

# 셀 격자 (DWG 원본 좌표)
X_EDGES = [96] + [3110 + 3000 * k for k in range(21)]          # 96, 3110, ... 63110
Y_EDGES = [2910, 5410, 7910, 10410, 12910, 15390]                # 아래 -> 위
# 행 의미 (위 -> 아래): 0=150 Channel, 1=125 Channel, 2=75 Angle, 3=브라켓, 4=부재(서브빔)
ROW_KIND = {0: ('main', 150), 1: ('main', 125), 2: ('main', 75), 3: ('bracket', 0), 4: ('sub', 0)}
# 원본 DWG에 품번 타이틀이 누락된 셀 (행/열 대칭 배치로 추정: 125행 9열=1560CSZL ↔ 150행 9열=1570HCSZL)
FALLBACK_TITLES = {(0, 9): 'WFF-1570HCSZL'}

R1 = lambda v: round(float(v), 1)


def cell_of(x, y):
    if x < X_EDGES[0] or x > X_EDGES[-1] or y < Y_EDGES[0] or y > Y_EDGES[-1]:
        return None
    c = max(i for i in range(len(X_EDGES) - 1) if x >= X_EDGES[i])
    r_from_bottom = max(i for i in range(len(Y_EDGES) - 1) if y >= Y_EDGES[i])
    r = (len(Y_EDGES) - 2) - r_from_bottom
    return (r, c)


def is_border(e):
    if e.dxftype() != 'LINE':
        return False
    a, b = e.dxf.start, e.dxf.end
    if (b - a).magnitude < 2000:
        return False
    if abs(a.x - b.x) < 1e-3 and any(abs(a.x - x) < 1 for x in X_EDGES):
        return True
    if abs(a.y - b.y) < 1e-3 and any(abs(a.y - y) < 1 for y in Y_EDGES):
        return True
    return False


def clean_text(s):
    s = s.replace('%%c', 'Ø').replace('%%C', 'Ø').replace('%%d', '°').replace('%%D', '°').replace('%%p', '±').replace('%%P', '±')
    s = s.replace('\\P', ' ').strip()
    return s


def layer_for(e, from_dim, doc):
    if from_dim:
        return 'DIM'
    lt = (e.dxf.get('linetype', 'BYLAYER') or 'BYLAYER').upper()
    if lt == 'BYLAYER':
        try:
            lt = (doc.layers.get(e.dxf.layer).dxf.linetype or '').upper()
        except Exception:
            lt = ''
    if 'CENT' in lt or 'CHAIN' in lt or 'DASHDOT' in lt:
        return 'CENTER'
    if 'HID' in lt or 'DASH' in lt:
        return 'HIDDEN'
    return 'FRAME'


def conv(e, from_dim, doc, out):
    t = e.dxftype()
    L = layer_for(e, from_dim, doc)
    if t == 'LINE':
        a, b = e.dxf.start, e.dxf.end
        if (b - a).magnitude < 1e-6:
            return
        out.append({'t': 'line', 'a': [R1(a.x), R1(a.y)], 'b': [R1(b.x), R1(b.y)], 'layer': L})
    elif t == 'CIRCLE':
        c = e.dxf.center
        out.append({'t': 'circle', 'c': [R1(c.x), R1(c.y)], 'r': R1(e.dxf.radius), 'layer': L})
    elif t == 'ARC':
        c = e.dxf.center
        out.append({'t': 'arc', 'c': [R1(c.x), R1(c.y)], 'r': R1(e.dxf.radius),
                    'a0': R1(e.dxf.start_angle), 'a1': R1(e.dxf.end_angle), 'layer': L})
    elif t in ('LWPOLYLINE', 'POLYLINE'):
        for v in e.virtual_entities():
            conv(v, from_dim, doc, out)
    elif t in ('SPLINE', 'ELLIPSE'):
        pts = [[R1(p.x), R1(p.y)] for p in e.flattening(1.0)]
        if len(pts) >= 2:
            out.append({'t': 'poly', 'pts': pts, 'closed': False, 'layer': L})
    elif t in ('SOLID', 'TRACE'):
        vs = [e.dxf.vtx0, e.dxf.vtx1, e.dxf.vtx3, e.dxf.vtx2]
        pts = [[R1(v.x), R1(v.y)] for v in vs]
        out.append({'t': 'solid', 'p': pts, 'layer': L})
    elif t == 'TEXT':
        s = clean_text(e.dxf.text)
        if not s:
            return
        h = e.dxf.height
        ha = e.dxf.get('halign', 0)
        va = e.dxf.get('valign', 0)
        p = e.dxf.align_point if (ha or va) and e.dxf.hasattr('align_point') else e.dxf.insert
        align = {0: 'left', 1: 'center', 2: 'right', 4: 'center'}.get(ha, 'left')
        valign = {0: 'baseline', 1: 'bottom', 2: 'middle', 3: 'top'}.get(va, 'baseline')
        if ha == 4:
            valign = 'middle'
        d = {'t': 'text', 'p': [R1(p.x), R1(p.y)], 'h': R1(h), 's': s, 'rot': R1(e.dxf.get('rotation', 0)), 'align': align, 'layer': 'DIM'}
        if valign != 'baseline':
            d['valign'] = valign
        out.append(d)
    elif t == 'MTEXT':
        s = clean_text(e.plain_text())
        if not s:
            return
        ap = e.dxf.get('attachment_point', 1)
        align = ['left', 'center', 'right'][(ap - 1) % 3]
        valign = ['top', 'middle', 'bottom'][(ap - 1) // 3]
        p = e.dxf.insert
        rot = e.get_rotation() if hasattr(e, 'get_rotation') else e.dxf.get('rotation', 0)
        out.append({'t': 'text', 'p': [R1(p.x), R1(p.y)], 'h': R1(e.dxf.char_height), 's': s,
                    'rot': R1(rot), 'align': align, 'valign': valign, 'layer': 'DIM'})


def ent_center(d):
    if d['t'] == 'line':
        return ((d['a'][0] + d['b'][0]) / 2, (d['a'][1] + d['b'][1]) / 2)
    if d['t'] in ('circle', 'arc'):
        return tuple(d['c'])
    if d['t'] == 'text':
        return tuple(d['p'])
    pts = d.get('pts') or d.get('p')
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def ent_pts(d):
    if d['t'] == 'line':
        return [d['a'], d['b']]
    if d['t'] in ('circle', 'arc'):
        c, r = d['c'], d['r']
        return [[c[0] - r, c[1] - r], [c[0] + r, c[1] + r]]
    if d['t'] == 'text':
        return [d['p']]
    return d.get('pts') or d.get('p')


def shift(d, dx, dy):
    f = lambda p: [R1(p[0] - dx), R1(p[1] - dy)]
    d = dict(d)
    for k in ('a', 'b', 'c', 'p'):
        if k in d and isinstance(d[k], list) and d[k] and not isinstance(d[k][0], list):
            d[k] = f(d[k])
    if 'pts' in d:
        d['pts'] = [f(p) for p in d['pts']]
    if d['t'] == 'solid':
        d['p'] = [f(p) for p in d['p']]
    return d


def main():
    doc, _ = recover.readfile(SRC)
    msp = doc.modelspace()
    cells = {}
    for top in msp:
        if is_border(top):
            continue
        tt = top.dxftype()
        from_dim = tt in ('DIMENSION', 'LEADER', 'ARC_DIMENSION')
        prims = []
        if tt in ('DIMENSION', 'INSERT', 'LEADER', 'ARC_DIMENSION'):
            try:
                for v in disassemble.recursive_decompose(top.virtual_entities()):
                    conv(v, from_dim, doc, prims)
            except Exception as ex:
                print('skip', tt, ex)
        else:
            conv(top, False, doc, prims)
        for d in prims:
            cx, cy = ent_center(d)
            rc = cell_of(cx, cy)
            if rc is None:
                continue
            cells.setdefault(rc, []).append(d)

    lib = {}
    # 셀 경계를 가로지르는 조립 참고도(예: 1570ASZL+1570ASZR = 3140 조립)는 개별 부품도가 아니므로 제외
    span_boxes = []
    for (r, c), ents in cells.items():
        for d in ents:
            if d['t'] not in ('line', 'poly'):
                continue
            pts = ent_pts(d)
            xa, xb = min(p[0] for p in pts), max(p[0] for p in pts)
            ya, yb = min(p[1] for p in pts), max(p[1] for p in pts)
            if any(xa < xe - 5 and xb > xe + 5 for xe in X_EDGES[1:-1]):
                span_boxes.append((xa - 60, ya - 400, xb + 60, yb + 160))

    def in_span(d):
        pts = ent_pts(d)
        xa, xb = min(p[0] for p in pts), max(p[0] for p in pts)
        ya, yb = min(p[1] for p in pts), max(p[1] for p in pts)
        # 셀 경계선에 정확히 맞닿은 선 = 경계에서 끊어 그린 조립도 잔여선
        if d['t'] == 'line' and any(abs(p[0] - xe) < 3 for p in pts for xe in X_EDGES[1:-1]):
            return True
        return any(xa <= b[2] and xb >= b[0] and ya <= b[3] and yb >= b[1] for b in span_boxes)

    for (r, c), ents in sorted(cells.items()):
        ents = [d for d in ents if not in_span(d)]
        # 부품 품번 타이틀 = 셀 내 큰 글씨(h>=60) 중 WFF-/WBR- 패턴
        titles = [d for d in ents if d['t'] == 'text' and d['h'] >= 60 and re.match(r'^W(FF|BR|FB)-', d['s'])]
        if not titles and (r, c) in FALLBACK_TITLES:
            code = FALLBACK_TITLES[(r, c)]
            title = None
        elif not titles:
            print('no title cell', r, c, len(ents))
            continue
        else:
            title = sorted(titles, key=lambda d: -d['p'][1])[0]
            code = re.sub(r'\s+', '', title['s']).upper()
        body = [d for d in ents if d is not title]
        xs, ys = [], []
        for d in body:
            for p in ent_pts(d):
                xs.append(p[0]); ys.append(p[1])
        if not xs:
            continue
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
        kind, frame = ROW_KIND.get(r, ('etc', 0))
        if kind == 'main':
            kind = 'mainL' if re.search(r'LZ$', code) else 'mainW'
        lib[code] = {
            'code': code, 'row': r, 'col': c, 'kind': kind, 'frame': frame,
            'w': R1(x1 - x0), 'h': R1(y1 - y0),
            'ents': [shift(d, x0, y0) for d in body],
        }
    js = io.StringIO()
    js.write('// Generated by tools/extract_skin_parts.py from 예제도면/Steel_Skin_Drawing(35mm).dwg\n')
    js.write('// 실제 스틸 스키드 부품도 라이브러리 - 75 Angle / 125 Channel / 150 Channel (O)형\n')
    js.write('var SKID_PARTS_LIB = ' + json.dumps(lib, ensure_ascii=False, separators=(',', ':')) + ';\n')
    js.write('if (typeof window !== "undefined") { window.SKID_PARTS_LIB = SKID_PARTS_LIB; }\n')
    js.write('if (typeof globalThis !== "undefined") { globalThis.SKID_PARTS_LIB = SKID_PARTS_LIB; }\n')
    js.write('if (typeof module !== "undefined" && module.exports) { module.exports = SKID_PARTS_LIB; }\n')
    io.open(OUT, 'w', encoding='utf-8').write(js.getvalue())
    for k, v in lib.items():
        print(k, v['kind'], v['frame'], 'cell', v['row'], v['col'], 'n', len(v['ents']), 'size', v['w'], v['h'])
    print('parts', len(lib), 'bytes', len(js.getvalue()))


if __name__ == '__main__':
    main()
