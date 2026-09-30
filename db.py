import os
import json
import math
import sqlite3
import ezdxf

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tank_panels.db")
PANEL_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "panel_templates.json")
SIDE_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "side_templates.json")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS panels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            material TEXT NOT NULL,         -- 'SMC', 'STS', etc.
            category TEXT NOT NULL,         -- 'top_bottom' (평면) 또는 'side' (입면)
            size_key TEXT NOT NULL,         -- '1000x1000', '1000x500', 등
            width INTEGER NOT NULL,         -- 가로 mm
            height INTEGER NOT NULL,        -- 세로 mm
            name TEXT NOT NULL,             -- 사용자 표시 명칭
            description TEXT DEFAULT '',    -- 판넬 형상 설명
            entities_json TEXT NOT NULL,    -- 엔티티 목록 (JSON)
            is_default INTEGER DEFAULT 0,   -- 기본 프리셋 여부 (1: 기본, 0: 사용자)
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(material, category, size_key)
        )
    """)
    conn.commit()

    # 데이터가 없으면 JSON 파일들로부터 초기 데이터 자동 시딩
    cur.execute("SELECT COUNT(*) FROM panels")
    count = cur.fetchone()[0]
    if count == 0:
        seed_defaults(conn)
    conn.close()

def seed_defaults(conn=None):
    close_at_end = False
    if conn is None:
        conn = get_connection()
        close_at_end = True

    cur = conn.cursor()
    cur.execute("DELETE FROM panels")

    # 1. 평면 (상·하부) 템플릿 로드
    if os.path.exists(PANEL_JSON_PATH):
        with open(PANEL_JSON_PATH, "r", encoding="utf-8") as f:
            pt = json.load(f)
        for mat, sizes in pt.items():
            for skey, ents in sizes.items():
                parts = skey.split("x")
                w = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 1000
                h = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1000
                name = f"{mat} {w}×{h} 평면 표준 판넬"
                cur.execute("""
                    INSERT OR REPLACE INTO panels 
                    (material, category, size_key, width, height, name, description, entities_json, is_default)
                    VALUES (?, 'top_bottom', ?, ?, ?, ?, '공장 표준 평면 엠보싱 문양', ?, 1)
                """, (mat, skey, w, h, name, json.dumps(ents, ensure_ascii=False)))

    # 2. 측면 (입면) 템플릿 로드
    if os.path.exists(SIDE_JSON_PATH):
        with open(SIDE_JSON_PATH, "r", encoding="utf-8") as f:
            st = json.load(f)
        for mat, sizes in st.items():
            for skey, ents in sizes.items():
                parts = skey.split("x")
                w = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 1000
                h = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1000
                name = f"{mat} {w}×{h} 측면 표준 판넬"
                cur.execute("""
                    INSERT OR REPLACE INTO panels 
                    (material, category, size_key, width, height, name, description, entities_json, is_default)
                    VALUES (?, 'side', ?, ?, ?, ?, '공장 표준 측면 아치/구멍 문양', ?, 1)
                """, (mat, skey, w, h, name, json.dumps(ents, ensure_ascii=False)))

    conn.commit()
    if close_at_end:
        conn.close()

def get_all_panels(material=None, category=None):
    conn = get_connection()
    cur = conn.cursor()
    query = "SELECT id, material, category, size_key, width, height, name, description, is_default, created_at, updated_at FROM panels WHERE 1=1"
    params = []
    if material and material != "ALL":
        query += " AND material = ?"
        params.append(material)
    if category and category != "ALL":
        query += " AND category = ?"
        params.append(category)
    query += " ORDER BY material, category, width DESC, height DESC"
    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def get_panel_by_id(pid):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM panels WHERE id = ?", (pid,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["entities"] = json.loads(d["entities_json"])
    return d

def save_panel(material, category, width, height, name, description, entities, is_default=0):
    size_key = f"{width}x{height}"
    conn = get_connection()
    cur = conn.cursor()
    ents_str = json.dumps(entities, ensure_ascii=False)
    cur.execute("""
        INSERT INTO panels (material, category, size_key, width, height, name, description, entities_json, is_default, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(material, category, size_key) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            entities_json = excluded.entities_json,
            is_default = excluded.is_default,
            updated_at = CURRENT_TIMESTAMP
    """, (material.upper(), category, size_key, width, height, name, description, ents_str, is_default))
    conn.commit()
    new_id = cur.lastrowid
    if not new_id:
        cur.execute("SELECT id FROM panels WHERE material = ? AND category = ? AND size_key = ?", (material.upper(), category, size_key))
        r = cur.fetchone()
        if r:
            new_id = r[0]
    conn.close()

    # JSON 파일 백업/동기화 (빌드 및 오프라인 대비)
    try:
        all_t = export_all_templates_dict()
        if os.path.exists(PANEL_JSON_PATH):
            with open(PANEL_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(all_t["panel_templates"], f, ensure_ascii=False, indent=2)
        if os.path.exists(SIDE_JSON_PATH):
            with open(SIDE_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(all_t["side_templates"], f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[WARN] Failed to write templates json: {e}")

    return new_id

def delete_panel(pid):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM panels WHERE id = ?", (pid,))
    deleted = cur.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def export_all_templates_dict():
    """TankCAD Web 엔진이 바로 사용할 수 있는 포맷으로 전체 템플릿 반환"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT material, category, size_key, entities_json, is_default FROM panels")
    rows = cur.fetchall()
    conn.close()

    pt = {}
    st = {}
    custom_map = {}
    for r in rows:
        mat = r["material"]
        cat = r["category"]
        skey = r["size_key"]
        ents = json.loads(r["entities_json"])
        is_def = r["is_default"]

        target = pt if cat == "top_bottom" else st
        if mat not in target:
            target[mat] = {}
        target[mat][skey] = ents
        if not is_def:
            custom_map[f"{mat}_{cat}_{skey}"] = True

    st["_custom"] = custom_map
    pt["_custom"] = custom_map
    return {"panel_templates": pt, "side_templates": st, "custom_map": custom_map}

def parse_dxf_string(dxf_content, target_w=None, target_h=None):
    """업로드된 DXF 문자열에서 선, 원, 호, 폴리라인, 블록(INSERT), 타원, 스플라인을 판넬 템플릿 형식으로 추출 및 (0,0) 정규화"""
    import tempfile
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".dxf", delete=False) as tf:
        tf.write(dxf_content)
        tmp_name = tf.name

    try:
        doc = ezdxf.readfile(tmp_name)
    finally:
        if os.path.exists(tmp_name):
            try: os.remove(tmp_name)
            except: pass

    msp = doc.modelspace()

    # 1. 블록(INSERT) 참조가 있다면 재귀적으로 분해(explode)하여 내부 기본 형상 추출
    for _ in range(5):
        inserts = list(msp.query("INSERT"))
        if not inserts:
            break
        for ins in inserts:
            try:
                ins.explode()
            except Exception:
                pass

    raw = []
    xs, ys = [], []

    for e in msp:
        dxftype = e.dxftype()
        if dxftype == 'LINE':
            p1 = [float(e.dxf.start.x), float(e.dxf.start.y)]
            p2 = [float(e.dxf.end.x), float(e.dxf.end.y)]
            raw.append({'k': 'line', 'p': [p1, p2]})
            xs.extend([p1[0], p2[0]])
            ys.extend([p1[1], p2[1]])
        elif dxftype == 'CIRCLE':
            c = [float(e.dxf.center.x), float(e.dxf.center.y)]
            r = float(e.dxf.radius)
            raw.append({'k': 'circle', 'c': c, 'r': r})
            xs.extend([c[0] - r, c[0] + r])
            ys.extend([c[1] - r, c[1] + r])
        elif dxftype == 'ARC':
            c = [float(e.dxf.center.x), float(e.dxf.center.y)]
            r = float(e.dxf.radius)
            a0 = math.radians(float(e.dxf.start_angle))
            a1 = math.radians(float(e.dxf.end_angle))
            s = [c[0] + r * math.cos(a0), c[1] + r * math.sin(a0)]
            e_pt = [c[0] + r * math.cos(a1), c[1] + r * math.sin(a1)]
            raw.append({'k': 'arc', 'c': c, 'r': r, 's': s, 'e': e_pt, 'a0': float(e.dxf.start_angle), 'a1': float(e.dxf.end_angle)})
            xs.extend([s[0], e_pt[0]])
            ys.extend([s[1], e_pt[1]])
        elif dxftype == 'LWPOLYLINE':
            pts = [[float(p[0]), float(p[1])] for p in e.get_points('xy')]
            if pts:
                is_closed = bool(getattr(e, 'closed', False))
                raw.append({'k': 'poly', 'p': pts, 'c': is_closed})
                for p in pts:
                    xs.append(p[0])
                    ys.append(p[1])
        elif dxftype == 'POLYLINE':
            pts = [[float(v.dxf.location.x), float(v.dxf.location.y)] for v in e.vertices]
            if pts:
                is_closed = bool(e.is_closed) if hasattr(e, 'is_closed') else False
                raw.append({'k': 'poly', 'p': pts, 'c': is_closed})
                for p in pts:
                    xs.append(p[0])
                    ys.append(p[1])
        elif dxftype in ('ELLIPSE', 'SPLINE'):
            try:
                pts = [[float(p.x), float(p.y)] for p in e.flattening(distance=2.0)]
                if pts:
                    is_closed = (math.hypot(pts[0][0] - pts[-1][0], pts[0][1] - pts[-1][1]) < 1e-2)
                    raw.append({'k': 'poly', 'p': pts, 'c': is_closed})
                    for p in pts:
                        xs.append(p[0])
                        ys.append(p[1])
            except Exception:
                pass

    if not raw or not xs or not ys:
        return []

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    dw = max_x - min_x
    dh = max_y - min_y

    sx = 1.0
    sy = 1.0
    if target_w and target_h and dw > 0 and dh > 0:
        target_w = float(target_w)
        target_h = float(target_h)
        if abs(dw - target_w) > 1.0 or abs(dh - target_h) > 1.0:
            sx = target_w / dw
            sy = target_h / dh

    sr = (sx + sy) / 2.0
    entities = []
    for item in raw:
        k = item['k']
        if k == 'line':
            p1 = [round((item['p'][0][0] - min_x) * sx, 1), round((item['p'][0][1] - min_y) * sy, 1)]
            p2 = [round((item['p'][1][0] - min_x) * sx, 1), round((item['p'][1][1] - min_y) * sy, 1)]
            entities.append({'k': 'line', 'p': [p1, p2]})
        elif k == 'circle':
            c = [round((item['c'][0] - min_x) * sx, 1), round((item['c'][1] - min_y) * sy, 1)]
            r = round(item['r'] * sr, 1)
            entities.append({'k': 'circle', 'c': c, 'r': r})
        elif k == 'arc':
            c = [round((item['c'][0] - min_x) * sx, 1), round((item['c'][1] - min_y) * sy, 1)]
            r = round(item['r'] * sr, 1)
            s = [round((item['s'][0] - min_x) * sx, 1), round((item['s'][1] - min_y) * sy, 1)]
            e_pt = [round((item['e'][0] - min_x) * sx, 1), round((item['e'][1] - min_y) * sy, 1)]
            entities.append({'k': 'arc', 'c': c, 'r': r, 's': s, 'e': e_pt})
        elif k == 'poly':
            pts = [[round((p[0] - min_x) * sx, 1), round((p[1] - min_y) * sy, 1)] for p in item['p']]
            entities.append({'k': 'poly', 'p': pts, 'c': item.get('c', False)})

    return entities

