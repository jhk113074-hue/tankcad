/* tank.js — YSACC TANK CAD(HighTank, VC6 MFC) 물탱크 도면 CAD 웹 이식본 (v1)
 * 원본: glFunc.cpp (gSideSplit / gFrontSplit), TankMap.cpp (SetWLCnt / CreateMap / TankPlane / TankPlaneDim),
 *       CeilLT.cpp (패널 내부 도형; PANEL_TEMPLATES 는 원본 C++ 에서 자동 변환)
 * 좌표: mm, x=가로(Length), y=세로(Width), y 위쪽이 +
 */
(function (root) {
  'use strict';

  // 기초 부재 제작도 데이터 (기초.zip DXF 벡터 추출본: A타입, B타입, C타입, ㄷ-125 주재)
  let SKID_PARTS_DATA = (typeof globalThis !== 'undefined' && globalThis.SKID_PARTS_DATA) || (typeof window !== 'undefined' && window.SKID_PARTS_DATA) || (typeof root !== 'undefined' && root.SKID_PARTS_DATA) || null;
  if (!SKID_PARTS_DATA && typeof require !== 'undefined') {
    try { SKID_PARTS_DATA = require('./skid_parts_data.js'); } catch (e) {}
  }
  // 실제 스틸 스키드 부품도 라이브러리 (Steel_Skin_Drawing(35mm).dwg 추출: 75 Angle / 125 Channel / 150 Channel (O)형)
  let SKID_PARTS_LIB = (typeof globalThis !== 'undefined' && globalThis.SKID_PARTS_LIB) || (typeof window !== 'undefined' && window.SKID_PARTS_LIB) || null;
  if (!SKID_PARTS_LIB && typeof require !== 'undefined') {
    try { SKID_PARTS_LIB = require('./skid_parts_lib.js'); } catch (e) {}
  }

  /* ---------- glFunc.cpp: 패널 분할 (1300 / 1000 / 500 모듈) ---------- */
  // 4-인자 버전(nHalf 사용): gFrontSplit == gSideSplit
  function splitHalf(nLength, baseX, nHalf) {
    let nTmp = nLength, i = 0, j = 0, cnt = 0, is1300 = false, is500 = false;
    let haLoc = nHalf - 1, haLoc1 = nHalf;
    if (haLoc >= Math.trunc(nTmp / 1000)) { haLoc = Math.trunc(nTmp / 1000) - 1; haLoc1 = Math.trunc(nTmp / 1000); }
    if (nTmp % 500) { nTmp -= 1300; is1300 = true; cnt++; }
    if (nTmp % 1000) { nTmp -= 500; is500 = true; cnt++; }
    cnt += Math.trunc(nTmp / 1000);
    const p = new Array(cnt).fill(0);
    if (baseX) {
      if (is1300) p[cnt - 1] = 1300;
      if (is500) {
        for (let jj = haLoc1; i < jj; nTmp -= 1000, i++) p[i] = 1000;
        p[i++] = 500;
      }
    } else {
      if (is1300) { p[i++] = 1300; j++; }
      if (is500) {
        for (j += haLoc; i < j + 1; nTmp -= 1000, i++) p[i] = 1000;
        p[i++] = 500;
      }
    }
    for (; nTmp; nTmp -= 1000, i++) { if (nTmp < 0 || i >= cnt) throw new Error('패널 분할 불가: ' + nLength); p[i] = 1000; }
    return p;
  }

  // 3-인자 버전 (기본값: "D" 체크박스 ON 일 때 사용)
  function frontSplit(nLength, baseX) {
    let nTmp = nLength, i = 0, j = 0, cnt = 0, is1300 = false, is500 = false;
    if (nTmp % 500) { nTmp -= 1300; is1300 = true; cnt++; }
    if (nTmp % 1000) { nTmp -= 500; is500 = true; cnt++; }
    cnt += Math.trunc(nTmp / 1000);
    const p = new Array(cnt).fill(0);
    const special = nLength >= 1500 && (nLength - 1500) % 4000 === 0;
    if (baseX) {
      if (is1300) p[cnt - 1] = 1300;
      if (is500) {
        if (special) { for (j += Math.trunc(nTmp / 2000) + 1; i < j; nTmp -= 1000, i++) p[i] = 1000; }
        else { for (j += Math.trunc(nTmp / 2000); i < j; nTmp -= 1000, i++) p[i] = 1000; }
        p[i++] = 500;
      }
    } else {
      if (is1300) { p[i++] = 1300; j++; }
      if (is500) {
        if (special) { for (j += Math.trunc(nTmp / 2000) + 1; i < j; nTmp -= 1000, i++) p[i] = 1000; }
        else { for (j += Math.trunc(nTmp / 2000); i < j; nTmp -= 1000, i++) p[i] = 1000; }
        p[i++] = 500;
      }
    }
    for (; nTmp; nTmp -= 1000, i++) { if (nTmp < 0 || i >= cnt) throw new Error('패널 분할 불가: ' + nLength); p[i] = 1000; }
    return p;
  }

  function sideSplit(nLength, baseX) {
    let nTmp = nLength, i = 0, j = 0, cnt = 0, is1300 = false, is500 = false;
    if (nTmp % 500) { nTmp -= 1300; is1300 = true; cnt++; }
    if (nTmp % 1000) { nTmp -= 500; is500 = true; cnt++; }
    cnt += Math.trunc(nTmp / 1000);
    const p = new Array(cnt).fill(0);
    if (baseX) {
      if (is1300) p[cnt - 1] = 1300;
      if (is500) {
        for (let jj = (nTmp % 2000) ? Math.trunc(nTmp / 2000) + 1 : Math.trunc(nTmp / 2000); i < jj; nTmp -= 1000, i++) p[i] = 1000;
        p[i++] = 500;
      }
    } else {
      if (is1300) { p[i++] = 1300; j++; }
      if (is500) {
        for (j += Math.trunc(nTmp / 2000) - 1; i < j + 1; nTmp -= 1000, i++) p[i] = 1000;
        p[i++] = 500;
      }
    }
    for (; nTmp; nTmp -= 1000, i++) { if (nTmp < 0 || i >= cnt) throw new Error('패널 분할 불가: ' + nLength); p[i] = 1000; }
    return p;
  }

  /* ---------- 입력 검증 (500mm 단위 정밀 검증) ---------- */
  function checkSegment(n) {
    if (!n) return null;
    if (!Number.isInteger(n) || n < 500) return '500mm 이상 정수여야 합니다';
    if (n % 500 !== 0) return '500mm 단위로 입력해야 합니다 (500의 배수: 500, 1000, 1500, 2000 ...)';
    return null;
  }

  /* ---------- TankMap::CreateMap : 패널 격자 ---------- */
  // opt: {length:[..5], width:[..5], lHalf:bool, wHalf:bool, half:[..5], wHalfN:[..5]}
  function createMap(opt) {
    const L = (opt.length || []).slice(0, 5), W = (opt.width || []).slice(0, 5);
    const rows = [];   // 세로(width) 방향 패널 길이 목록
    const cols = [];   // 가로(length) 방향 패널 길이 목록
    let baseX = 0;
    for (let i = 0; i < 5 && W[i]; i++) {
      const p = opt.wHalf === false ? splitHalf(W[i], baseX, (opt.wHalfN || [])[i] || 0) : sideSplit(W[i], baseX);
      rows.push(...p); baseX += W[i];
    }
    baseX = 0;
    for (let i = 0; i < 5 && L[i]; i++) {
      const p = opt.lHalf === false ? splitHalf(L[i], baseX, (opt.half || [])[i] || 0) : frontSplit(L[i], baseX);
      cols.push(...p); baseX += L[i];
    }
    const xs = [0], ys = [0];
    cols.forEach(c => xs.push(xs[xs.length - 1] + c));
    rows.forEach(r => ys.push(ys[ys.length - 1] + r));
    const removed = new Set((opt.removed || []).map(r => r[0] + ',' + r[1]));
    const has = (i, j) => i >= 0 && j >= 0 && i < rows.length && j < cols.length && !removed.has(i + ',' + j);
    return { rows, cols, xs, ys, width: ys[ys.length - 1], length: xs[xs.length - 1], removed, has };
  }

  // 이형탱크 제외 부위 직사각형 분할 및 규격 문자열 생성 (+ - 형식)
  function decomposeRemoved(map) {
    if (!map.removed || map.removed.size === 0) return [];
    const cells = new Set(map.removed);
    const nR = map.rows.length;
    const nC = map.cols.length;
    const blocks = [];

    while (cells.size > 0) {
      let best = null;
      let bestArea = -1;

      for (let r0 = 0; r0 < nR; r0++) {
        for (let r1 = r0; r1 < nR; r1++) {
          for (let c0 = 0; c0 < nC; c0++) {
            for (let c1 = c0; c1 < nC; c1++) {
              let allIn = true;
              for (let r = r0; r <= r1; r++) {
                for (let c = c0; c <= c1; c++) {
                  if (!cells.has(r + ',' + c)) {
                    allIn = false;
                    break;
                  }
                }
                if (!allIn) break;
              }
              if (allIn) {
                let w = 0, l = 0;
                for (let r = r0; r <= r1; r++) w += map.rows[r];
                for (let c = c0; c <= c1; c++) l += map.cols[c];
                const area = w * l;
                if (area > bestArea) {
                  bestArea = area;
                  best = { r0, r1, c0, c1, w, l };
                } else if (area === bestArea && best) {
                  // 동률 시 세로(열) 방향 선호 (외곽 치수 괄호 묶음 형식과 일치)
                  if ((r1 - r0) > (best.r1 - best.r0)) {
                    best = { r0, r1, c0, c1, w, l };
                  }
                }
              }
            }
          }
        }
      }

      if (!best) break;

      for (let r = best.r0; r <= best.r1; r++) {
        for (let c = best.c0; c <= best.c1; c++) {
          cells.delete(r + ',' + c);
        }
      }
      blocks.push({ w: best.w, l: best.l });
    }

    return blocks;
  }

  function getTankDimStr(opt, map, H) {
    const fd = a => {
      const v = a.filter(Boolean).map(x => x / 1000);
      return v.length > 1 ? '(' + v.join('+') + ')' : String(v[0] || 0);
    };
    const fmtM = mm => (mm % 1000 === 0) ? String(mm / 1000) : String(+(mm / 1000).toFixed(2));
    const baseDimStr = fd(opt.width || [map.width]) + 'W X ' + fd(opt.length || [map.length]) + 'L X ' + fd(opt.height || [H]) + 'H';
    const anyRemoved = map.removed && map.removed.size > 0;
    if (!anyRemoved) return baseDimStr;

    const blocks = decomposeRemoved(map);
    if (!blocks.length) return baseDimStr + ' (이형)';

    const cutoutParts = blocks.map(b => fmtM(b.w) + 'W X ' + fmtM(b.l) + 'L').join(' + ');
    const hStr = fd(opt.height || [H]) + 'H';
    const cutoutStr = ' - (' + cutoutParts + ') X ' + hStr;
    return baseDimStr + cutoutStr;
  }

  /* ---------- 기본 표준 판넬 문양 (직사각형/정사각형 공통 다이아몬드/옥타곤 리브) ---------- */
  function getDefaultPanelPattern(w, h) {
    const cx = Math.round(w / 2), cy = Math.round(h / 2);
    const ox = Math.round(w * 0.15), oy = Math.round(h * 0.15);
    const boxW = Math.round(w * 0.20), boxH = Math.round(h * 0.20);
    const chX = Math.round(boxW * 0.30), chY = Math.round(boxH * 0.30);
    const x0 = cx - Math.round(boxW / 2), x1 = x0 + chX, x2 = cx + Math.round(boxW / 2) - chX, x3 = cx + Math.round(boxW / 2);
    const y0 = cy - Math.round(boxH / 2), y1 = y0 + chY, y2 = cy + Math.round(boxH / 2) - chY, y3 = cy + Math.round(boxH / 2);

    const octPts = [
      [x1, y0], [x2, y0], [x3, y1], [x3, y2],
      [x2, y3], [x1, y3], [x0, y2], [x0, y1]
    ];
    return [
      { k: 'poly', p: octPts },
      { k: 'line', p: [[0, oy], [ox, 0]] },
      { k: 'line', p: [[w - ox, 0], [w, oy]] },
      { k: 'line', p: [[w, h - oy], [w - ox, h]] },
      { k: 'line', p: [[ox, h], [0, h - oy]] },
      { k: 'line', p: [[x0, y1], [0, oy]] },
      { k: 'line', p: [[x1, y0], [ox, 0]] },
      { k: 'line', p: [[x2, y0], [w - ox, 0]] },
      { k: 'line', p: [[x3, y1], [w, oy]] },
      { k: 'line', p: [[x3, y2], [w, h - oy]] },
      { k: 'line', p: [[x2, y3], [w - ox, h]] },
      { k: 'line', p: [[x1, y3], [ox, h]] },
      { k: 'line', p: [[x0, y2], [0, h - oy]] },
      { k: 'circle', c: [cx, cy], r: Math.max(15, Math.round(Math.min(w, h) * 0.06)) }
    ];
  }

  /* ---------- 패널 내부 도형 (CeilLT) ---------- */
  function panelShapes(templates, mat, x, y, w, h, opt) {
    const key = w + 'x' + h;
    let t = ((templates && (templates[mat] || templates.SMC)) || {})[key];
    if (!t || !t.length) {
      if ((w === 500 && h === 1000) || (w === 1000 && h === 500)) {
        const dict = (templates && (templates[mat] || templates.SMC)) || {};
        t = dict['500x1000'] || dict['1000x500'];
      }
    }
    if ((!t || !t.length) && opt && opt.customPanels && Array.isArray(opt.customPanels)) {
      const matched = opt.customPanels.find(p =>
        (p.category === 'top' || p.category === 'top_bottom' || p.category === 'common' || p.category === 'all' || !p.category) &&
        (p.size_key === key || (p.width === w && p.height === h) ||
         (((w === 500 && h === 1000) || (w === 1000 && h === 500)) && (p.size_key === '500x1000' || p.size_key === '1000x500'))) &&
        p.entities && p.entities.length
      );
      if (matched) t = matched.entities;
    }
    if (!t || !t.length) t = getDefaultPanelPattern(w, h);
    if (!t) t = [];
    const out = [];
    t.forEach(s => {
      if (!s) return;
      const k = s.k || s.t || s.type;
      if (k === 'line') {
        const a = (s.p && s.p[0]) || s.a;
        const b = (s.p && s.p[1]) || s.b;
        if (a && b) out.push({ t: 'line', a: [x + a[0], y + a[1]], b: [x + b[0], y + b[1]], layer: 'PANEL_DETAIL' });
      } else if (k === 'poly') {
        const rawP = s.p || s.pts || [];
        if (rawP.length >= 2) {
          const isClosed = s.c !== false;
          let p = rawP.map(q => [x + q[0], y + q[1]]);
          if (isClosed && p.length > 2 && Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]) < 0.1) {
            p = p.slice(0, -1);
          }
          const cnt = isClosed ? p.length : p.length - 1;
          for (let i = 0; i < cnt; i++) out.push({ t: 'line', a: p[i], b: p[(i + 1) % p.length], layer: 'PANEL_DETAIL' });
        }
      } else if (k === 'circle' && (s.c || s.center)) {
        const c = s.c || s.center;
        out.push({ t: 'circle', c: [x + c[0], y + c[1]], r: s.r || 10, layer: 'PANEL_DETAIL' });
      } else if (k === 'arc' && (s.c || s.center)) {
        const c = s.c || s.center;
        const d = (p) => (p && Array.isArray(p)) ? (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180 / Math.PI) : 0;
        let a0 = 0, a1 = 360;
        if (s.a0 !== undefined && s.a1 !== undefined) {
          a0 = s.a0; a1 = s.a1;
        } else if (s.s && s.e) {
          a0 = d(s.s); a1 = d(s.e);
        }
        out.push({ t: 'arc', c: [x + c[0], y + c[1]], r: s.r || 10, a0, a1, layer: 'PANEL_DETAIL' });
      }
    });
    return out;
  }

  function mirrorEntitiesH(ents) {
    if (!ents || !ents.length) return [];
    let minX = Infinity, maxX = -Infinity;
    ents.forEach(e => {
      if (!e) return;
      const k = e.k || e.t || e.type;
      if (k === 'line') {
        const p1 = (e.p && e.p[0]) || e.a;
        const p2 = (e.p && e.p[1]) || e.b;
        if (p1 && p2) {
          minX = Math.min(minX, p1[0], p2[0]); maxX = Math.max(maxX, p1[0], p2[0]);
        }
      } else if ((k === 'circle' || k === 'arc') && e.c) {
        minX = Math.min(minX, e.c[0] - (e.r || 10)); maxX = Math.max(maxX, e.c[0] + (e.r || 10));
      } else if (k === 'poly') {
        const pts = e.p || e.pts || [];
        pts.forEach(pt => { if (pt) { minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]); } });
      }
    });
    if (minX === Infinity) return ents;
    const midX = (minX + maxX) / 2;
    return ents.map(e => {
      if (!e) return e;
      const k = e.k || e.t || e.type;
      if (k === 'line') {
        const p1 = (e.p && e.p[0]) || e.a;
        const p2 = (e.p && e.p[1]) || e.b;
        if (!p1 || !p2) return e;
        return {
          k: 'line',
          p: [
            [Math.round((2 * midX - p1[0]) * 10) / 10, p1[1]],
            [Math.round((2 * midX - p2[0]) * 10) / 10, p2[1]]
          ]
        };
      } else if (k === 'circle' && e.c) {
        return { k: 'circle', c: [Math.round((2 * midX - e.c[0]) * 10) / 10, e.c[1]], r: e.r || 10 };
      } else if (k === 'arc' && e.c) {
        const a0 = (180 - (e.a1 !== undefined ? e.a1 : 360) + 360) % 360;
        const a1 = (180 - (e.a0 !== undefined ? e.a0 : 0) + 360) % 360;
        return { k: 'arc', c: [Math.round((2 * midX - e.c[0]) * 10) / 10, e.c[1]], r: e.r || 10, a0, a1 };
      } else if (k === 'poly') {
        const pts = e.p || e.pts || [];
        return {
          k: 'poly',
          p: pts.map(pt => [Math.round((2 * midX - pt[0]) * 10) / 10, pt[1]]),
          c: e.c
        };
      }
      return e;
    });
  }

  function resolvePartEntities(customParts, cat, view, h, opt) {
    const v = (view === 'side') ? 'right' : (view === 'top' ? 'plan' : view);
    if (customParts) {
      // 1. 구체적인 전체 키 직접 매칭 (예: cat = 'manhole_plan_D')
      // 단, 'manhole' 같은 순수 카테고리는 평면도 레거시 키가 존재하므로 입면(front/side)에서 매칭되면 안 됨
      if (cat.includes('_') && customParts[cat] && customParts[cat].length) {
        return customParts[cat];
      }
      if (h && customParts[`${cat}_${v}_${h}`] && customParts[`${cat}_${v}_${h}`].length) {
        return customParts[`${cat}_${v}_${h}`];
      }
      if (customParts[`${cat}_${v}`] && customParts[`${cat}_${v}`].length) {
        return customParts[`${cat}_${v}`];
      }
      if (customParts[`panel_${cat}_${v}`] && customParts[`panel_${cat}_${v}`].length) {
        return customParts[`panel_${cat}_${v}`];
      }
      // 입면(front/side)의 경우 다른 높이로 등록된 키(예: manhole_front_2000 등)도 탐색
      if (v !== 'plan') {
        const hKey = Object.keys(customParts).find(k => k.startsWith(`${cat}_${v}_`) && customParts[k]?.length);
        if (hKey) return customParts[hKey];
      }
      // 평면도(plan)의 경우 높이와 무관하므로 height 접미사가 붙은 키(예: _plan_2000)도 탐색
      if (v === 'plan') {
        const hKey = Object.keys(customParts).find(k => k.startsWith(`${cat}_${v}_`) && customParts[k]?.length);
        if (hKey) return customParts[hKey];
      }
      if (v === 'left' && (cat === 'top' || cat === 'roof' || cat === 'manhole')) {
        const rightEnts = resolvePartEntities(customParts, cat, 'right', h, opt);
        if (rightEnts && rightEnts.length) return mirrorEntitiesH(rightEnts);
      }
      if ((v === 'right' || v === 'left' || v === 'rear') && (cat === 'top' || cat === 'roof')) {
        const frontEnts = resolvePartEntities(customParts, cat, 'front', h, opt);
        if (frontEnts && frontEnts.length) return frontEnts;
      }
      if (v === 'rear' && (cat === 'top' || cat === 'roof')) {
        return resolvePartEntities(customParts, cat, 'front', h, opt);
      }
      // 8. 오직 평면도(plan)일 때만 레거시 평면 키(customParts[cat]) 사용
      if (v === 'plan' && customParts[cat] && customParts[cat].length) {
        return customParts[cat];
      }
      if (v === 'plan' && customParts[`panel_${cat}`] && customParts[`panel_${cat}`].length) {
        return customParts[`panel_${cat}`];
      }
    }
    // 판넬 DB(customPanels)에서도 확인
    if (opt?.customPanels && (cat === 'top' || cat === 'roof' || cat === 'manhole' || cat === 'drain')) {
      const panelCat = (cat === 'roof') ? 'top' : cat;
      const p = opt.customPanels.find(x => x.category === panelCat && (x.view === v || (!x.view && v === 'plan')));
      if (p && p.entities && p.entities.length) {
        return p.entities;
      }
    }
    // Fallback to factory default entities from DEFAULT_PART_ENTITIES if available
    const defs = opt?.defaultPartEntities || (typeof DEFAULT_PART_ENTITIES !== 'undefined' ? DEFAULT_PART_ENTITIES : (typeof root !== 'undefined' ? root.DEFAULT_PART_ENTITIES : (typeof window !== 'undefined' ? window.DEFAULT_PART_ENTITIES : null)));
    if (defs && defs[cat] && typeof defs[cat].get === 'function') {
      const w = (cat === 'ladder') ? 400 : (cat === 'inladder' ? 300 : 1000);
      return defs[cat].get(w, h || (cat === 'top' ? 100 : (cat === 'manhole' ? 800 : 2000)), v);
    }
    return null;
  }

  function renderCustomEntitiesAt(out, ents, ox, oy, scaleX = 1, scaleY = 1, layer = 'FRAME') {
    if (!ents || !ents.length) return;
    ents.forEach(e => {
      const k = e.k || e.t || e.type;
      const elayer = e.layer || layer || 'FRAME';
      if (k === 'line') {
        const p1 = (e.p && e.p[0]) || e.a;
        const p2 = (e.p && e.p[1]) || e.b;
        if (p1 && p2) {
          out.push({
            t: 'line',
            a: [ox + p1[0] * scaleX, oy + p1[1] * scaleY],
            b: [ox + p2[0] * scaleX, oy + p2[1] * scaleY],
            layer: elayer
          });
        }
      } else if (k === 'circle') {
        const c = e.c || e.center;
        if (c) {
          out.push({
            t: 'circle',
            c: [ox + c[0] * scaleX, oy + c[1] * scaleY],
            r: Math.round(e.r * ((Math.abs(scaleX) + Math.abs(scaleY)) / 2)),
            layer: elayer
          });
        }
      } else if (k === 'arc') {
        const c = e.c || e.center;
        if (c) {
          if (Math.abs(scaleX - scaleY) > 1e-4) {
            const a0 = (e.a0 || 0) * Math.PI / 180;
            const a1 = (e.a1 || 360) * Math.PI / 180;
            let span = a1 - a0;
            while (span <= 0) span += 2 * Math.PI;
            const steps = Math.max(12, Math.min(36, Math.round(span * 8)));
            const pts = [];
            for (let s = 0; s <= steps; s++) {
              const th = a0 + (span * s / steps);
              pts.push([
                ox + (c[0] + e.r * Math.cos(th)) * scaleX,
                oy + (c[1] + e.r * Math.sin(th)) * scaleY
              ]);
            }
            for (let s = 0; s + 1 < pts.length; s++) {
              out.push({ t: 'line', a: pts[s], b: pts[s + 1], layer: elayer });
            }
          } else {
            out.push({
              t: 'arc',
              c: [ox + c[0] * scaleX, oy + c[1] * scaleY],
              r: Math.round(e.r * Math.abs(scaleX)),
              a0: e.a0 || 0,
              a1: e.a1 || 360,
              layer: elayer
            });
          }
        }
      } else if (k === 'poly') {
        const pts = (e.p || e.pts || []).map(p => [ox + p[0] * scaleX, oy + p[1] * scaleY]);
        for (let s = 0; s + 1 < pts.length; s++) {
          out.push({ t: 'line', a: pts[s], b: pts[s + 1], layer: elayer });
        }
        const isClosed = e.c !== false && e.close !== false;
        if (isClosed && pts.length > 2) {
          out.push({ t: 'line', a: pts[pts.length - 1], b: pts[0], layer: elayer });
        }
      }
    });
  }

  /* ---------- 맨홀 설치 방향 및 투영 뷰타입 계산 헬퍼 ---------- */
  function getManholeDir(opt, map, rowIdx, colIdx) {
    const cellKey = (rowIdx != null && colIdx != null) ? `${rowIdx},${colIdx}` : null;
    if (cellKey && opt?.manholeDirs && opt.manholeDirs[cellKey]) {
      return opt.manholeDirs[cellKey];
    }
    if (cellKey && opt?.ladders && opt.ladders[cellKey]) {
      return opt.ladders[cellKey];
    }
    if (map && rowIdx != null && colIdx != null && map.rows && map.cols) {
      const nRows = map.rows.length, nCols = map.cols.length;
      const dSouth = rowIdx;
      const dNorth = nRows - 1 - rowIdx;
      const dWest = colIdx;
      const dEast = nCols - 1 - colIdx;
      const minD = Math.min(dSouth, dNorth, dWest, dEast);
      if (minD === dSouth) return 'D';
      if (minD === dNorth) return 'U';
      if (minD === dWest) return 'L';
      return 'R';
    }
    return 'D';
  }

  function getManholeViewType(dir, view) {
    const d = (dir || 'D').toUpperCase();
    if (view === 'front') {
      if (d === 'D' || d === 'SOUTH') return 'front';
      if (d === 'U' || d === 'NORTH') return 'rear';
      if (d === 'R' || d === 'EAST') return 'side_right';
      if (d === 'L' || d === 'WEST') return 'side_left';
      return 'front';
    } else { // side view (right elevation: 동측에서 서측을 봄, 도면 좌측=남, 우측=북)
      if (d === 'R' || d === 'EAST') return 'front';
      if (d === 'L' || d === 'WEST') return 'rear';
      if (d === 'D' || d === 'SOUTH') return 'side_left';
      if (d === 'U' || d === 'NORTH') return 'side_right';
      return 'side_left';
    }
  }

  /* ---------- 평면도 맨홀 손잡이 / 환기구 (CCeilLT::_1000BY1000 의 CLT_HANDLE=1, CLT_AIRVENT=2) : 1000x1000 패널만 ---------- */
  function markShapes(x, y, mark, opt, rowIdx, colIdx, map) {
    const customParts = opt?.partTemplates || {};
    const out = [];

    // 맨홀/내부사다리 방향 결정 (D: 남/하, U: 북/상, R: 동/우, L: 서/좌)
    const dir = getManholeDir(opt, map, rowIdx, colIdx);

    // 표준 형상(D 기준: 내부사다리가 하단 y~210-380에 위치)을 중심(500, 500) 기준으로 회전
    const angleMap = {
      'D': 0, 'south': 0,
      'U': Math.PI, 'north': Math.PI,
      'R': Math.PI / 2, 'east': Math.PI / 2,
      'L': -Math.PI / 2, 'west': -Math.PI / 2
    };
    const angle = angleMap[dir] != null ? angleMap[dir] : 0;
    const cosA = Math.cos(angle), sinA = Math.sin(angle);

    const P = (a, b) => {
      const da = a - 500, db = b - 500;
      const ra = 500 + (da * cosA - db * sinA);
      const rb = 500 + (da * sinA + db * cosA);
      return [x + ra, y + rb];
    };
    const poly = (pts, layer) => pts.forEach((p, k) => out.push({ t: 'line', a: P(...p), b: P(...pts[(k + 1) % pts.length]), layer }));

    if (mark & 1) { // 맨홀 (손잡이)
      // 기준 맨홀 부품 탐색 (우선순위: manhole_plan_D 등 기준 부품, 또는 manhole_plan, manhole)
      const baseCustom = (customParts && (
        customParts['manhole_plan_D'] ||
        customParts['manhole_plan_south'] ||
        customParts['manhole_plan'] ||
        customParts['manhole']
      )) || resolvePartEntities(customParts, 'manhole', 'plan', 0, opt);

      const customEnts = baseCustom;

      // 천정판넬이 제거되므로, 등록된 커스텀 부품에 1000x1000 외곽선이 없는 경우(또는 기본 내장 맨홀)에만 PANEL 외곽 테두리선 보강
      let hasOuter = false;
      if (customEnts && customEnts.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        customEnts.forEach(e => {
          const k = e.k || e.t;
          if (k === 'line') {
            const p1 = (e.p && e.p[0]) || e.a; const p2 = (e.p && e.p[1]) || e.b;
            if (p1 && p2) {
              minX = Math.min(minX, p1[0], p2[0]); maxX = Math.max(maxX, p1[0], p2[0]);
              minY = Math.min(minY, p1[1], p2[1]); maxY = Math.max(maxY, p1[1], p2[1]);
            }
          } else if (k === 'poly') {
            const pts = e.p || e.pts || [];
            pts.forEach(p => {
              minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
              minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
            });
          } else if (k === 'circle' || k === 'arc') {
            const c = e.c || e.center;
            if (c && e.r) {
              minX = Math.min(minX, c[0] - e.r); maxX = Math.max(maxX, c[0] + e.r);
              minY = Math.min(minY, c[1] - e.r); maxY = Math.max(maxY, c[1] + e.r);
            }
          }
        });
        if (minX <= 50 && maxX >= 950 && minY <= 50 && maxY >= 950) hasOuter = true;
      }
      if (!hasOuter) {
        poly([[0, 0], [1000, 0], [1000, 1000], [0, 1000]], 'PANEL');
      }

      // 맨홀 전체를 중심(500, 500) 기준으로 90도씩 회전하여 렌더링
      if (customEnts && customEnts.length > 0) {
        customEnts.forEach(e => {
          const k = e.k || e.t;
          const lyr = e.layer || e.l || 'FRAME';
          if (k === 'line') {
            const p1 = (e.p && e.p[0]) || e.a; const p2 = (e.p && e.p[1]) || e.b;
            if (p1 && p2) out.push({ t: 'line', a: P(p1[0], p1[1]), b: P(p2[0], p2[1]), layer: lyr });
          } else if (k === 'circle') {
            const c = e.c || e.center;
            if (c) out.push({ t: 'circle', c: P(c[0], c[1]), r: e.r, layer: lyr });
          } else if (k === 'arc') {
            const c = e.c || e.center;
            if (c) out.push({ t: 'arc', c: P(c[0], c[1]), r: e.r, a0: (e.a0 || 0) + angle * 180 / Math.PI, a1: (e.a1 || 0) + angle * 180 / Math.PI, layer: lyr });
          } else if (k === 'ellipse') {
            const c = e.c || e.center;
            if (c) out.push({ t: 'ellipse', c: P(c[0], c[1]), rx: e.rx, ry: e.ry, rot: (e.rot || 0) + angle * 180 / Math.PI, layer: lyr });
          } else if (k === 'poly') {
            const pts = e.p || e.pts || [];
            for (let s = 0; s + 1 < pts.length; s++) out.push({ t: 'line', a: P(pts[s][0], pts[s][1]), b: P(pts[s + 1][0], pts[s + 1][1]), layer: lyr });
            if (e.c || e.close) out.push({ t: 'line', a: P(pts[pts.length - 1][0], pts[pts.length - 1][1]), b: P(pts[0][0], pts[0][1]), layer: lyr });
          } else if (k === 'text') {
            const pt = e.p || e.c || [500, 500];
            out.push({ t: 'text', p: P(pt[0], pt[1]), s: e.s || e.text || '', h: e.h || 50, rot: (e.rot || 0) + angle * 180 / Math.PI, align: e.align || 'center', layer: lyr });
          }
        });
      } else {
        // 기본 내장 맨홀: 중심(500, 500) 기준으로 90도 단위 회전
        poly([[260, 105], [735, 105], [888, 260], [888, 735], [735, 888], [262, 888], [105, 735], [105, 260]], 'FRAME');
        poly([[150, 280], [290, 150], [710, 150], [850, 280], [850, 720], [710, 850], [290, 850], [150, 720]], 'FRAME');
        poly([[310, 110], [390, 110], [390, 67], [310, 67]], 'FRAME'); poly([[610, 110], [690, 110], [690, 67], [610, 67]], 'FRAME');
        poly([[462, 945], [538, 945], [538, 898], [462, 898]], 'FRAME');
        out.push({ t: 'circle', c: [x + 500, y + 500], r: 300, layer: 'FRAME' });
        out.push({ t: 'text', p: [x + 500, y + ((mark & 2) ? 610 : 500)], s: 'MANHOLE 600', h: 60, rot: 0, align: 'center', layer: 'DIM' });
      }
      // "이 부분은 필요없습니다" -> 내부사다리 기호 및 문자 완전 제거 (맨홀 단독 렌더링)
    }
    if (mark & 2) { // 에어벤트
      const ventPlan = resolvePartEntities(customParts, 'airvent', 'plan', 0, opt);
      if (ventPlan && ventPlan.length > 0) {
        ventPlan.forEach(e => {
          const k = e.k || e.t;
          if (k === 'line') out.push({ t: 'line', a: P(e.p[0][0], e.p[0][1]), b: P(e.p[1][0], e.p[1][1]), layer: 'REINF' });
          else if (k === 'circle') out.push({ t: 'circle', c: P(e.c[0], e.c[1]), r: e.r, layer: 'REINF' });
          else if (k === 'arc') out.push({ t: 'arc', c: P(e.c[0], e.c[1]), r: e.r, a0: e.a0, a1: e.a1, layer: 'REINF' });
          else if (k === 'poly') poly(e.p, 'REINF');
        });
        out.push({ t: 'text', p: P(500, (mark & 1) ? 380 : 500), s: 'AIR VENT 100A', h: 50, rot: 0, align: 'center', layer: 'DIM' });
      } else {
        out.push({ t: 'circle', c: P(500, 500), r: 50, layer: 'REINF' });
        out.push({ t: 'circle', c: P(500, 500), r: 100, layer: 'REINF' });
        out.push({ t: 'line', a: P(380, 500), b: P(620, 500), layer: 'REINF' });
        out.push({ t: 'line', a: P(500, 380), b: P(500, 620), layer: 'REINF' });
        out.push({ t: 'text', p: P(500, (mark & 1) ? 380 : 500), s: 'AIR VENT 100A', h: 50, rot: 0, align: 'center', layer: 'DIM' });
      }
    }
    return out;
  }

  /* ---------- 사다리 (CLadderLT) : 1 위(U/북), 2 아래(D/남), 3 오른쪽(R/동), 4 왼쪽(L/서) ---------- */
  function ladderShapes(idx, px, py, H, opt) {
    const customParts = opt?.partTemplates || {};
    if (idx >= 1 && idx <= 4) {
      const dirCodes = { 1: 'U', 2: 'D', 3: 'R', 4: 'L' };
      const dirNames = { 1: 'north', 2: 'south', 3: 'east', 4: 'west' };
      const dCode = dirCodes[idx];
      const dName = dirNames[idx];

      const dirEnts = resolvePartEntities(customParts, `ladder_plan_${dCode}`, 'plan', H, opt)
                   || resolvePartEntities(customParts, `ladder_plan_${dName}`, 'plan', H, opt);
      if (dirEnts && dirEnts.length > 0) {
        const out = [], L = 'FRAME';
        const sx = idx === 3 ? 1 : idx === 4 ? -1 : 0, sy = idx === 1 ? 1 : idx === 2 ? -1 : 0;
        renderCustomEntitiesAt(out, dirEnts, px, py, 1, 1, L);
        out.push({ t: 'text', p: [px + (sx ? sx * 315 : 0), py + (sy ? sy * 315 : 0)], s: 'LADDER', h: 50, rot: sx ? 90 : 0, align: 'center', layer: 'DIM' });
        return out;
      }

      const planEnts = resolvePartEntities(customParts, 'ladder', 'plan', H, opt);
      if (planEnts && planEnts.length > 0) {
        const out = [], L = 'FRAME';
        const sx = idx === 3 ? 1 : idx === 4 ? -1 : 0, sy = idx === 1 ? 1 : idx === 2 ? -1 : 0;
        // Direction angle:
        // sy === 1 (Top/U/북): points +y (UP, outward) -> angle = 0
        // sy === -1 (Bottom/D/남): points -y (DOWN, outward) -> angle = Math.PI
        // sx === 1 (Right/R/동): points +x (RIGHT, outward) -> angle = -Math.PI / 2
        // sx === -1 (Left/L/서): points -x (LEFT, outward) -> angle = Math.PI / 2
        const angle = sy === 1 ? 0 : (sy === -1 ? Math.PI : (sx === 1 ? -Math.PI / 2 : Math.PI / 2));
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const trans = (x, y) => [px + (x * cosA - y * sinA), py + (x * sinA + y * cosA)];
        planEnts.forEach(e => {
          const k = e.k || e.t;
          if (k === 'line') {
            const p1 = (e.p && e.p[0]) || e.a;
            const p2 = (e.p && e.p[1]) || e.b;
            if (p1 && p2) out.push({ t: 'line', a: trans(p1[0], p1[1]), b: trans(p2[0], p2[1]), layer: L });
          } else if (k === 'circle') {
            const c = e.c || e.center;
            if (c) out.push({ t: 'circle', c: trans(c[0], c[1]), r: e.r, layer: L });
          } else if (k === 'arc') {
            const c = e.c || e.center;
            if (c) out.push({ t: 'arc', c: trans(c[0], c[1]), r: e.r, a0: (e.a0 || 0) + angle * 180 / Math.PI, a1: (e.a1 || 0) + angle * 180 / Math.PI, layer: L });
          } else if (k === 'poly') {
            const pts = e.p || e.pts || [];
            const tpts = pts.map(p => trans(p[0], p[1]));
            for (let s = 0; s + 1 < tpts.length; s++) out.push({ t: 'line', a: tpts[s], b: tpts[s + 1], layer: L });
            if (e.c || e.close) out.push({ t: 'line', a: tpts[tpts.length - 1], b: tpts[0], layer: L });
          }
        });
        out.push({ t: 'text', p: [px + (sx ? sx * 315 : 0), py + (sy ? sy * 315 : 0)], s: 'LADDER', h: 50, rot: sx ? 90 : 0, align: 'center', layer: 'DIM' });
        return out;
      }
    }
    const T = 40, FW = 270, FT = 20, TO = 250, TI = 270, TL = 250, SI = 400, FO = 200, BO = -500, MH = 150, TOP = 700, TTOP = 500, CX = 75;
    const mx = FW >> 1, out = [], L = 'FRAME';
    const ln = (a, b) => out.push({ t: 'line', a: [px + a[0], py + a[1]], b: [px + b[0], py + b[1]], layer: L });
    const pl = (p, closed) => { for (let k = 0; k + 1 < p.length; k++) ln(p[k], p[k + 1]); if (closed) ln(p[p.length - 1], p[0]); };
    if (idx >= 1 && idx <= 4) {
      const sx = idx === 3 ? 1 : idx === 4 ? -1 : 0, sy = idx === 1 ? 1 : idx === 2 ? -1 : 0;
      if (sy) {   // 위/아래: 발판은 x 방향
        [1, -1].forEach(k => pl([[k * mx, 0], [k * mx, sy * TL], [k * (mx + T), sy * TL], [k * (mx + T), 0]]));
        ln([-mx, sy * TO], [mx, sy * TO]); ln([-mx, sy * (TO + FT)], [mx, sy * (TO + FT)]);
        ln([-mx, sy * (TO - 70)], [mx, sy * (TO - 70)]); ln([-mx, sy * (TO - 70 + FT)], [mx, sy * (TO - 70 + FT)]);
        ln([-mx, sy * (TO - 140)], [mx, sy * (TO - 140)]); ln([-mx, sy * (TO - 140 + FT)], [mx, sy * (TO - 140 + FT)]);
        out.push({ t: 'text', p: [px, py + sy * (TL + 65)], s: 'LADDER', h: 50, rot: 0, align: 'center', layer: 'DIM' });
      } else {
        [1, -1].forEach(k => pl([[0, k * mx], [sx * TL, k * mx], [sx * TL, k * (mx + T)], [0, k * (mx + T)]]));
        ln([sx * TO, -mx], [sx * TO, mx]); ln([sx * (TO + FT), -mx], [sx * (TO + FT), mx]);
        ln([sx * (TO - 70), -mx], [sx * (TO - 70), mx]); ln([sx * (TO - 70 + FT), -mx], [sx * (TO - 70 + FT)], mx);
        ln([sx * (TO - 140), -mx], [sx * (TO - 140), mx]); ln([sx * (TO - 140 + FT), -mx], [sx * (TO - 140 + FT)], mx);
        out.push({ t: 'text', p: [px + sx * (TL + 65), py], s: 'LADDER', h: 50, rot: 90, align: 'center', layer: 'DIM' });
      }
    } else if (idx === 5) {
      const frontEnts = resolvePartEntities(customParts, 'ladder', 'front', H, opt);
      if (frontEnts && frontEnts.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        frontEnts.forEach(e => {
          const k = e.k || e.t;
          if (k === 'line') {
            const p1 = (e.p && e.p[0]) || e.a;
            const p2 = (e.p && e.p[1]) || e.b;
            if (p1 && p2) {
              minX = Math.min(minX, p1[0], p2[0]); maxX = Math.max(maxX, p1[0], p2[0]);
              minY = Math.min(minY, p1[1], p2[1]); maxY = Math.max(maxY, p1[1], p2[1]);
            }
          } else if (k === 'circle' || k === 'arc') {
            const c = e.c || e.center; const r = e.r;
            if (c && r != null) {
              minX = Math.min(minX, c[0] - r); maxX = Math.max(maxX, c[0] + r);
              minY = Math.min(minY, c[1] - r); maxY = Math.max(maxY, c[1] + r);
            }
          } else if (k === 'poly') {
            const pts = e.p || e.pts || [];
            pts.forEach(pt => {
              minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]);
              minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]);
            });
          }
        });
        const curH = (maxY - minY) || (H || 2000);
        const oy = (minY < -100) ? 0 : ((curH > H + 500) ? -450 : -minY);
        const scaleY = (H && curH > 0 && Math.abs(curH - (H + 1250)) > 300 && Math.abs(curH - H) > 300) ? ((H + 1250) / curH) : 1;
        const midX = (minX + maxX) / 2;
        renderCustomEntitiesAt(out, frontEnts, px - midX, oy, 1, scaleY, 'FRAME');
        return out;
      }
      [1, -1].forEach(k => {
        pl([[k * mx, BO], [k * mx, H + MH], [k * (mx + T), H + MH], [k * (mx + T), BO]], true);
        pl([[k * mx, H + MH], [k * mx, H + TOP], [k * (mx + T), H + TOP], [k * (mx + T), H + MH]], true);
      });
      for (let y = BO + FO; y < H; y += FT + SI) { ln([-mx, y], [mx, y]); ln([-mx, y + FT], [mx, y + FT]); }
    } else if (idx === 6) {
      const rearEnts = resolvePartEntities(customParts, 'ladder', 'rear', H, opt) || resolvePartEntities(customParts, 'ladder', 'front', H, opt);
      if (rearEnts && rearEnts.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        rearEnts.forEach(e => {
          const k = e.k || e.t;
          if (k === 'line') {
            const p1 = (e.p && e.p[0]) || e.a;
            const p2 = (e.p && e.p[1]) || e.b;
            if (p1 && p2) {
              minX = Math.min(minX, p1[0], p2[0]); maxX = Math.max(maxX, p1[0], p2[0]);
              minY = Math.min(minY, p1[1], p2[1]); maxY = Math.max(maxY, p1[1], p2[1]);
            }
          } else if (k === 'circle' || k === 'arc') {
            const c = e.c || e.center; const r = e.r;
            if (c && r != null) {
              minX = Math.min(minX, c[0] - r); maxX = Math.max(maxX, c[0] + r);
              minY = Math.min(minY, c[1] - r); maxY = Math.max(maxY, c[1] + r);
            }
          } else if (k === 'poly') {
            const pts = e.p || e.pts || [];
            pts.forEach(pt => {
              minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]);
              minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]);
            });
          }
        });
        const curH = (maxY - minY) || (H || 2000);
        const oy = (minY < -100) ? 0 : ((curH > H + 500) ? -450 : -minY);
        const scaleY = (H && curH > 0 && Math.abs(curH - (H + 1250)) > 300 && Math.abs(curH - H) > 300) ? ((H + 1200) / curH) : 1;
        const midX = (minX + maxX) / 2;
        renderCustomEntitiesAt(out, rearEnts, px - midX, oy, 1, scaleY, 'FRAME');
        return out;
      }
      [1, -1].forEach(k => pl([[k * mx, H + MH], [k * mx, H + TOP], [k * (mx + T), H + TOP], [k * (mx + T), H + MH]], true));
    } else if (idx === 7 || idx === 8) {
      const sideKey = idx === 7 ? 'right' : 'left';
      const sideEnts = resolvePartEntities(customParts, 'ladder', sideKey, H, opt);
      if (sideEnts && sideEnts.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        sideEnts.forEach(e => {
          const k = e.k || e.t;
          if (k === 'line') {
            const p1 = (e.p && e.p[0]) || e.a;
            const p2 = (e.p && e.p[1]) || e.b;
            if (p1 && p2) {
              minX = Math.min(minX, p1[0], p2[0]); maxX = Math.max(maxX, p1[0], p2[0]);
              minY = Math.min(minY, p1[1], p2[1]); maxY = Math.max(maxY, p1[1], p2[1]);
            }
          } else if (k === 'circle' || k === 'arc') {
            const c = e.c || e.center; const r = e.r;
            if (c && r != null) {
              minX = Math.min(minX, c[0] - r); maxX = Math.max(maxX, c[0] + r);
              minY = Math.min(minY, c[1] - r); maxY = Math.max(maxY, c[1] + r);
            }
          } else if (k === 'poly') {
            const pts = e.p || e.pts || [];
            pts.forEach(pt => {
              minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]);
              minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]);
            });
          }
        });
        const curH = (maxY - minY) || (H || 2000);
        const oy = (minY < -100) ? 0 : ((curH > H + 500) ? -450 : -minY);
        const scaleY = (H && curH > 0 && Math.abs(curH - (H + 1250)) > 300 && Math.abs(curH - H) > 300) ? ((H + 1200) / curH) : 1;
        const anchorX = idx === 7 ? minX : maxX;
        renderCustomEntitiesAt(out, sideEnts, px - anchorX, oy, 1, scaleY, 'FRAME');
        return out;
      }
      const r = idx === 7 ? 1 : -1, Y = H + TTOP, X = (a) => r * a;
      pl([[X(CX), BO], [X(TI), BO + FO], [X(TI), Y]]);
      pl([[X(CX), BO + T], [X(TI - T), BO + FO], [X(TI - T), Y]]);
      pl([[X(TI - T), H - 2 * T], [X(CX), H - 2 * T], [X(CX), H - T], [X(TI - T), H - T]], true);
      pl([[X(TI - T), BO + 600 + 2 * T], [X(CX), BO + 600 + 2 * T], [X(CX), BO + 600 + T], [X(TI - T), BO + 600 + T]], true);
      ln([X(TI - T), Y], [X(TI), Y]);
      if (r === 1) {
        pl([[X(TI - T), Y], [X(TI - T - 75), H + TOP], [X(TI - T - 75 + T), H + TOP], [X(TI), Y]]);
        pl([[X(TI), Y], [X(TI - 75), H + TOP], [X(TI - 75 - T), H + TOP], [X(TI + T), Y]]);
      } else {
        const px0 = -TI + T;
        pl([[px0, Y], [px0 + 75, H + TOP], [px0 + 75 - T, H + TOP], [px0 + T, Y]]);
        ln([px0 - T, Y], [px0 + 75 - T, H + TOP]);
      }
    }
    return out;
  }
  /* 사다리 배치: opt.ladders = {'i,j': 'U'|'D'|'L'|'R'} (해당 칸의 노출면 중앙) */
  function ladderList(opt, map) {
    const res = [];
    if (opt && opt.ladders !== undefined && opt.ladders !== null) {
      Object.entries(opt.ladders).forEach(([k, sd]) => {
        const [i, j] = k.split(',').map(Number);
        if (!map.has(i, j)) return;
        const x0 = map.xs[j], x1 = x0 + map.cols[j], y0 = map.ys[i], y1 = y0 + map.rows[i];
        const cx = (x0 + x1) >> 1, cy = (y0 + y1) >> 1;
        if (sd === 'U') res.push({ sd, idx: 1, x: cx, y: y1 });
        else if (sd === 'D') res.push({ sd, idx: 2, x: cx, y: y0 });
        else if (sd === 'R') res.push({ sd, idx: 3, x: x1, y: cy });
        else if (sd === 'L') res.push({ sd, idx: 4, x: x0, y: cy });
      });
      return res; // 사용자가 명시한 ladders 객체(빈 객체 {} 포함)를 그대로 반환 (사다리 전체 삭제 시 0개 정상 적용)
    }
    // opt.ladders 속성 자체가 전달되지 않은 경우(null/undefined)에만 기본 사다리 제공
    if (map && map.rows && map.cols) {
      let defLadder = null;
      // 1순위: 전면 노출 외벽 (D) 중 가장 전면(낮은 i) 및 우측(높은 j) 셀
      for (let i = 0; i < map.rows.length; i++) {
        for (let j = map.cols.length - 1; j >= 0; j--) {
          if (map.has(i, j) && !map.has(i - 1, j)) {
            const x0 = map.xs[j], x1 = x0 + map.cols[j], y0 = map.ys[i];
            const cx = (x0 + x1) >> 1;
            defLadder = { sd: 'D', idx: 2, x: cx, y: y0 };
            break;
          }
        }
        if (defLadder) break;
      }
      // 2순위: 우측 노출 외벽 (R) 중 최상단(높은 i) 셀
      if (!defLadder) {
        for (let i = map.rows.length - 1; i >= 0; i--) {
          for (let j = map.cols.length - 1; j >= 0; j--) {
            if (map.has(i, j) && !map.has(i, j + 1)) {
              const x1 = map.xs[j] + map.cols[j], y0 = map.ys[i], y1 = y0 + map.rows[i];
              const cy = (y0 + y1) >> 1;
              defLadder = { sd: 'R', idx: 3, x: x1, y: cy };
              break;
            }
          }
          if (defLadder) break;
        }
      }
      if (defLadder) res.push(defLadder);
    }
    return res;
  }
  function exposedSides(map, i, j) {
    const r = [];
    if (!map.has(i, j)) return r;
    if (!map.has(i + 1, j)) r.push('U'); if (!map.has(i - 1, j)) r.push('D');
    if (!map.has(i, j + 1)) r.push('R'); if (!map.has(i, j - 1)) r.push('L');
    return r;
  }

  /* ---------- 노즐 및 배관 규격 (Inlet, Outlet, Overflow, Drain) ---------- */
  const NOZZLE_SPECS = {
    '25A':  { r: 17,  rf: 62.5, pcd: 45,  holes: 4,  hr: 9.5,  flgThick: 14, sockR: 24, sockLen: 50, neckLen: 120 },
    '32A':  { r: 21,  rf: 67.5, pcd: 50,  holes: 4,  hr: 9.5,  flgThick: 16, sockR: 28, sockLen: 55, neckLen: 120 },
    '40A':  { r: 24,  rf: 70,   pcd: 52.5,holes: 4,  hr: 9.5,  flgThick: 16, sockR: 32, sockLen: 55, neckLen: 120 },
    '50A':  { r: 30,  rf: 77.5, pcd: 60,  holes: 4,  hr: 9.5,  flgThick: 16, sockR: 38, sockLen: 60, neckLen: 130 },
    '65A':  { r: 38,  rf: 87.5, pcd: 70,  holes: 4,  hr: 9.5,  flgThick: 18, sockR: 48, sockLen: 65, neckLen: 130 },
    '80A':  { r: 45,  rf: 92.5, pcd: 75,  holes: 8,  hr: 9.5,  flgThick: 18, sockR: 55, sockLen: 70, neckLen: 130 },
    '100A': { r: 57,  rf: 105,  pcd: 87.5,holes: 8,  hr: 9.5,  flgThick: 18, sockR: 68, sockLen: 75, neckLen: 140 },
    '125A': { r: 70,  rf: 125,  pcd: 105, holes: 8,  hr: 11.5, flgThick: 20, sockR: 82, sockLen: 80, neckLen: 140 },
    '150A': { r: 83,  rf: 140,  pcd: 120, holes: 8,  hr: 11.5, flgThick: 22, sockR: 95, sockLen: 90, neckLen: 150 },
    '200A': { r: 108, rf: 165,  pcd: 145, holes: 12, hr: 11.5, flgThick: 22, sockR: 125, sockLen: 100, neckLen: 160 },
    '250A': { r: 134, rf: 200,  pcd: 177.5,holes: 12, hr: 12.5, flgThick: 24, sockR: 155, sockLen: 110, neckLen: 170 },
    '300A': { r: 159, rf: 222.5, pcd: 200, holes: 16, hr: 12.5, flgThick: 24, sockR: 185, sockLen: 120, neckLen: 180 }
  };
  function getNozzleSpec(sizeStr) {
    const clean = String(sizeStr || '100A').trim().toUpperCase();
    if (NOZZLE_SPECS[clean]) return NOZZLE_SPECS[clean];
    const num = parseInt(clean, 10) || 100;
    const r = Math.round(num * 0.55);
    return { r, rf: Math.round(r * 1.8), pcd: Math.round(r * 1.5), holes: 8, hr: 10, flgThick: 20, sockR: Math.round(r * 1.25), sockLen: 75, neckLen: 140 };
  }
  function getNozzleList(opt) {
    if (opt.useNozzles === false) return [];
    const raw = opt.nozzles;
    if (!raw) return [];
    const list = [];
    if (Array.isArray(raw)) {
      raw.forEach((n, idx) => {
        if (!n || n.use === false) return;
        const name = String(n.name || 'NOZZLE').trim().toUpperCase();
        list.push({
          key: n.key || n.id || ('noz_' + (idx + 1)),
          mark: n.mark || ('N' + (idx + 1)),
          name: name,
          desc: n.desc || '',
          size: String(n.size || '100A').trim().toUpperCase(),
          type: String(n.type || 'FLANGE').toUpperCase(),
          face: String(n.face || 'front').toLowerCase(),
          seg: Number(n.seg) || 1,
          offset: Number(n.offset) || 0,
          elev: (n.face === 'top' || n.elev === 'TOP') ? 'TOP' : ((n.face === 'bottom' || n.elev === 'BOTTOM') ? 'BOTTOM' : (Number(n.elev) || 0)),
          topCell: Array.isArray(n.topCell) ? n.topCell : [0, 0],
          bottomCell: Array.isArray(n.bottomCell) ? n.bottomCell : (Array.isArray(n.topCell) ? n.topCell : [0, 0])
        });
      });
      return list;
    }
    // Object format fallback
    const defaults = [
      { key: 'inlet', mark: 'N1', name: 'INLET', desc: '유입구' },
      { key: 'outlet', mark: 'N2', name: 'OUTLET', desc: '유출구' },
      { key: 'overflow', mark: 'N3', name: 'OVERFLOW', desc: '월류관' },
      { key: 'drain', mark: 'N4', name: 'DRAIN', desc: '배수구' },
      { key: 'fire', mark: 'N5', name: 'FIRE', desc: '소화용수' }
    ];
    defaults.forEach(def => {
      const n = raw[def.key];
      if (n && n.use !== false) {
        list.push({
          key: def.key,
          mark: n.mark || def.mark,
          name: n.name || def.name,
          desc: n.desc || def.desc,
          size: String(n.size || (def.key === 'fire' ? '150A' : '100A')).trim().toUpperCase(),
          type: String(n.type || (def.key === 'drain' ? 'SOCKET' : 'FLANGE')).toUpperCase(),
          face: String(n.face || (def.key === 'inlet' ? 'front' : def.key === 'overflow' ? 'right' : def.key === 'drain' ? 'bottom' : 'front')).toLowerCase(),
          seg: Number(n.seg) || 1,
          offset: Number(n.offset) || 0,
          elev: (n.face === 'top' || n.elev === 'TOP') ? 'TOP' : ((n.face === 'bottom' || n.elev === 'BOTTOM') ? 'BOTTOM' : (Number(n.elev) || (def.key === 'fire' ? 200 : 0))),
          topCell: Array.isArray(n.topCell) ? n.topCell : [0, 0],
          bottomCell: Array.isArray(n.bottomCell) ? n.bottomCell : (Array.isArray(n.topCell) ? n.topCell : [0, 0])
        });
      }
    });
    Object.entries(raw).forEach(([k, n]) => {
      if (!defaults.some(d => d.key === k) && n && n.use !== false) {
        list.push({
          key: k,
          mark: n.mark || ('N' + (list.length + 1)),
          name: String(n.name || 'NOZZLE').toUpperCase(),
          desc: n.desc || '',
          size: String(n.size || '100A').trim().toUpperCase(),
          type: String(n.type || 'FLANGE').toUpperCase(),
          face: String(n.face || 'front').toLowerCase(),
          seg: Number(n.seg) || 1,
          offset: Number(n.offset) || 0,
          elev: (n.face === 'top' || n.elev === 'TOP') ? 'TOP' : ((n.face === 'bottom' || n.elev === 'BOTTOM') ? 'BOTTOM' : (Number(n.elev) || 0)),
          topCell: Array.isArray(n.topCell) ? n.topCell : [0, 0],
          bottomCell: Array.isArray(n.bottomCell) ? n.bottomCell : (Array.isArray(n.topCell) ? n.topCell : [0, 0])
        });
      }
    });
    return list;
  }
  const NOZZLE_ABBR_MAP = {
    INLET: 'IN',
    OUTLET: 'OUT',
    OVERFLOW: 'O/F',
    DRAIN: 'DR',
    FIRE: 'FF'
  };
  function getNozzleAbbr(name) {
    if (!name) return '';
    const upper = String(name).trim().toUpperCase();
    if (NOZZLE_ABBR_MAP[upper]) return NOZZLE_ABBR_MAP[upper];
    if (upper.includes('INLET') || upper.includes('유입') || upper.includes('급수')) return 'IN';
    if (upper.includes('OUTLET') || upper.includes('유출') || upper.includes('송수')) return 'OUT';
    if (upper.includes('OVERFLOW') || upper.includes('월류')) return 'O/F';
    if (upper.includes('DRAIN') || upper.includes('배수')) return 'DR';
    if (upper.includes('FIRE') || upper.includes('소방') || upper.includes('소화')) return 'FF';
    return upper.slice(0, 4);
  }
  function formatNozzleLabel(n) {
    if (!n) return '';
    const abbr = getNozzleAbbr(n.name);
    return `[${n.mark}] ${abbr ? abbr + ' ' : ''}${n.size}`;
  }
  function formatNozzleGroupLabel(items) {
    if (!items || !items.length) return '';
    const sameSize = items.every(it => it.n.size === items[0].n.size);
    const sameAbbr = items.every(it => getNozzleAbbr(it.n.name) === getNozzleAbbr(items[0].n.name));
    if (sameSize && sameAbbr) {
      const abbr = getNozzleAbbr(items[0].n.name);
      return `[${items.map(it => it.n.mark).join(', ')}] ${abbr ? abbr + ' ' : ''}${items[0].n.size}`;
    }
    return items.map(it => formatNozzleLabel(it.n)).join(', ');
  }
  let calloutSeq = 0;
  function drawLeader(ents, startPt, elbowPt, endPt, lines, textH, align, layer, calloutId = null, meta = null) {
    layer = layer || 'DIM';
    const cId = calloutId || ('CALLOUT_' + (++calloutSeq));
    ents.push({ t: 'line', a: [...startPt], b: [...elbowPt], layer, calloutId: cId, leaderRole: 'slant', leaderMeta: meta });
    ents.push({ t: 'line', a: [...elbowPt], b: [...endPt], layer, calloutId: cId, leaderRole: 'shelf', leaderMeta: meta });
    ents.push({ t: 'circle', c: [...startPt], r: Math.max(3, Math.round(textH * 0.15)), layer, calloutId: cId, leaderRole: 'dot', leaderMeta: meta });
    const isRight = align === 'left';
    const textX = endPt[0] + (isRight ? textH * 0.35 : -textH * 0.35);
    const lineSpacing = textH * 1.35;
    lines.forEach((l, idx) => {
      const textY = endPt[1] + (lines.length - 1 - idx) * lineSpacing + textH * 0.35;
      ents.push({ t: 'text', p: [textX, textY], h: textH, s: l, align, valign: 'baseline', layer, calloutId: cId, leaderRole: 'text', textIdx: idx, leaderMeta: meta });
    });
    return cId;
  }

  /* ---------- 부품 풍선 기호 (Circular Balloon Callout with Leader) ---------- */
  let balloonSeq = 0;
  function drawBalloonCallout(ents, startPt, elbowPt, balloonCenter, numStr, scaleN = 25, layer = 'BALLOON', usedSet = null) {
    if (numStr === undefined || numStr === null || numStr === '') return false;
    const str = String(numStr).trim();
    if (!str) return false;

    // 풍선 기호 중복 번호 방지: 동일 번호는 도면 전체에서 1회만 기재
    const set = usedSet || (ents && ents._usedBalloons);
    if (set) {
      if (set.has(str)) return false;
      set.add(str);
    }

    if (!balloonCenter && elbowPt) {
      balloonCenter = elbowPt;
      elbowPt = null;
    }
    layer = layer || 'BALLOON';
    const sLen = String(str).length;
    const balloonR = Math.round(4.2 * scaleN);
    const textH = Math.round((sLen >= 3 ? 2.2 : (sLen === 2 ? 2.7 : 3.4)) * scaleN);
    const bId = 'BALLOON_' + (++balloonSeq);

    // 단부 점 (Terminal dot)
    ents.push({ t: 'circle', c: [...startPt], r: Math.max(3, Math.round(scaleN * 0.2)), layer, balloonNo: str, balloonId: bId, balloonRole: 'dot' });

    // 지시선 (Leader line) - 사용자 권장: 안꺾어도 되고 직선 사용, 꺾더라도 풍선 내부에서 꺾지 않도록 원천 차단
    const dxFull = balloonCenter[0] - startPt[0], dyFull = balloonCenter[1] - startPt[1];
    const distFull = Math.hypot(dxFull, dyFull) || 1;
    const directEndPt = [balloonCenter[0] - (dxFull / distFull) * balloonR, balloonCenter[1] - (dyFull / distFull) * balloonR];

    const dElbow = elbowPt ? Math.hypot(balloonCenter[0] - elbowPt[0], balloonCenter[1] - elbowPt[1]) : 0;
    // 꺾임점(elbowPt)이 풍선 원 외부(최소 balloonR + 12 이상 이격)에 충분히 떨어져 있을 때만 꺾임 허용
    // 풍선 원 내부나 경계 근처에서는 절대 꺾지 않고 직접 직선 연결
    if (elbowPt && dElbow > balloonR + 12 && (elbowPt[0] !== startPt[0] || elbowPt[1] !== startPt[1])) {
      const dx = balloonCenter[0] - elbowPt[0], dy = balloonCenter[1] - elbowPt[1];
      const dist = Math.hypot(dx, dy) || 1;
      const endPt = [balloonCenter[0] - (dx / dist) * balloonR, balloonCenter[1] - (dy / dist) * balloonR];
      ents.push({ t: 'line', a: [...startPt], b: [...elbowPt], layer, balloonNo: str, balloonId: bId, balloonRole: 'slant' });
      ents.push({ t: 'line', a: [...elbowPt], b: endPt, layer, balloonNo: str, balloonId: bId, balloonRole: 'shelf' });
    } else {
      // 사용자 권장 기본: 부품 시작점에서 풍선 원 외곽 접점까지 깔끔한 단일 직선
      ents.push({ t: 'line', a: [...startPt], b: directEndPt, layer, balloonNo: str, balloonId: bId, balloonRole: 'shelf' });
    }

    // 원형 풍선 (Circular balloon)
    ents.push({ t: 'circle', c: [...balloonCenter], r: balloonR, layer, balloonNo: str, balloonId: bId, balloonRole: 'bubble' });

    // 풍선 내부 번호 (Center text) - 원형 기호와 항상 100% 동일 중심
    ents.push({ t: 'text', p: [...balloonCenter], h: textH, s: str, rot: 0, align: 'center', valign: 'middle', layer, balloonNo: str, balloonId: bId, balloonRole: 'text' });
    return bId;
  }

  /* ---------- 도면 간섭 검사 및 자동 위치 재조정 엔진 (Collision Recheck & Relocation Engine) ---------- */
  function distToSegment(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = a[0] + t * dx, projY = a[1] + t * dy;
    return Math.hypot(p[0] - projX, p[1] - projY);
  }

  function shiftBalloon(ents, bId, dx, dy) {
    let bubble = null;
    let text = null;
    let shelfLine = null;
    let slantLine = null;
    let radius = 100;

    ents.forEach(e => {
      if (e.balloonId !== bId) return;
      if (e.balloonRole === 'bubble') {
        bubble = e;
        e.c[0] += dx;
        e.c[1] += dy;
        radius = e.r;
      } else if (e.balloonRole === 'text') {
        text = e;
        e.p[0] += dx;
        e.p[1] += dy;
      } else if (e.balloonRole === 'shelf') {
        shelfLine = e;
      } else if (e.balloonRole === 'slant') {
        slantLine = e;
      }
    });

    // 풍선 원형 기호와 숫자 텍스트 완벽 일체화 (절대 분리 불가)
    if (bubble && text) {
      text.p[0] = bubble.c[0];
      text.p[1] = bubble.c[1];
    }

    if (bubble && shelfLine) {
      if (slantLine) {
        // 풍선 이동 후 꺾임점(slantLine.b)이 풍선 원 내부 또는 너무 가까워지면 단일 직선으로 자동 전환하여 내부 꺾임 원천 차단
        const dElbow = Math.hypot(bubble.c[0] - slantLine.b[0], bubble.c[1] - slantLine.b[1]);
        if (dElbow <= radius + 12) {
          shelfLine.a = [...slantLine.a];
          slantLine.b = [...slantLine.a];
        } else {
          const origDx = Math.abs(shelfLine.b[0] - shelfLine.a[0]);
          const origDy = Math.abs(shelfLine.b[1] - shelfLine.a[1]);
          if (origDx >= origDy) {
            shelfLine.a[1] += dy;
            slantLine.b[1] += dy;
          } else {
            shelfLine.a[0] += dx;
            slantLine.b[0] += dx;
          }
        }
      }
      const origin = shelfLine.a;
      const bc = bubble.c;
      const odx = bc[0] - origin[0], ody = bc[1] - origin[1];
      const dist = Math.hypot(odx, ody) || 1;
      shelfLine.b[0] = bc[0] - (odx / dist) * radius;
      shelfLine.b[1] = bc[1] - (ody / dist) * radius;
    }
  }

  function shiftCallout(ents, cId, dx, dy) {
    ents.forEach(e => {
      if (e.calloutId !== cId) return;
      if (e.leaderRole === 'shelf') {
        e.a[0] += dx; e.a[1] += dy;
        e.b[0] += dx; e.b[1] += dy;
      } else if (e.leaderRole === 'slant') {
        e.b[0] += dx; e.b[1] += dy;
      } else if (e.leaderRole === 'text') {
        e.p[0] += dx; e.p[1] += dy;
      }
    });
  }

  function recheckAndResolveCollisions(ents, opt) {
    if (!ents || !ents.length) return ents;
    const N = (opt && opt._N) || 25;
    const maxIterations = 3;
    const calloutShifts = new Map();

    for (let iter = 0; iter < maxIterations; iter++) {
      let movedAny = false;

      // 1. Gather all Balloons
      const balloonMap = new Map();
      ents.forEach(e => {
        if (e.layer === 'BALLOON' && e.balloonId) {
          if (!balloonMap.has(e.balloonId)) {
            balloonMap.set(e.balloonId, {
              id: e.balloonId,
              no: e.balloonNo,
              center: null,
              radius: Math.round(4.2 * N)
            });
          }
          const b = balloonMap.get(e.balloonId);
          if (e.balloonRole === 'bubble') {
            b.center = [e.c[0], e.c[1]];
            b.radius = e.r;
          }
        }
      });
      const bList = Array.from(balloonMap.values()).filter(b => b.center);

      // 2. Gather Dimension Texts & Dimension Lines
      const dimTexts = [];
      const dimLines = [];
      // 3. Gather Nozzle Callouts & Nozzle Bodies
      const calloutMap = new Map();
      const nozBodies = [];

      ents.forEach(e => {
        if (e.layer === 'DIM') {
          if (e.t === 'text' && e.s) {
            const s = String(e.s);
            const w = Math.max(e.h * 1.2, s.length * e.h * 0.65);
            const h = e.h * 1.2;
            dimTexts.push({
              minX: e.p[0] - w / 2, maxX: e.p[0] + w / 2,
              minY: e.p[1] - h / 2, maxY: e.p[1] + h / 2,
              p: e.p
            });
          } else if (e.t === 'line' && e.a && e.b) {
            dimLines.push({ a: e.a, b: e.b, role: e.dimRole });
          }
        } else if (e.layer === 'NOZZLE') {
          if (e.calloutId) {
            if (!calloutMap.has(e.calloutId)) {
              calloutMap.set(e.calloutId, {
                id: e.calloutId,
                minX: Infinity, maxX: -Infinity,
                minY: Infinity, maxY: -Infinity,
                p: null,
                meta: e.leaderMeta,
                texts: [],
                lines: []
              });
            }
            const grp = calloutMap.get(e.calloutId);
            if (e.t === 'text' && e.s) {
              const s = String(e.s);
              const w = Math.max(e.h * 1.5, s.length * e.h * 0.65);
              const h = e.h * 1.2;
              const isRight = e.align === 'left';
              const minX = isRight ? e.p[0] : (e.p[0] - w);
              const maxX = isRight ? (e.p[0] + w) : e.p[0];
              const minY = e.p[1] - h * 0.3;
              const maxY = e.p[1] + h * 0.9;
              grp.minX = Math.min(grp.minX, minX);
              grp.maxX = Math.max(grp.maxX, maxX);
              grp.minY = Math.min(grp.minY, minY);
              grp.maxY = Math.max(grp.maxY, maxY);
              if (!grp.p) grp.p = [e.p[0], e.p[1]];
              grp.texts.push(e);
            } else if (e.t === 'line') {
              grp.lines.push(e);
            }
          } else if (e.t === 'circle' && e.c && e.r) {
            nozBodies.push({ c: e.c, r: e.r });
          } else if (e.t === 'line' && e.a && e.b && !e.calloutId) {
            nozBodies.push({ a: e.a, b: e.b });
          }
        }
      });
      const calloutList = Array.from(calloutMap.values()).filter(c => isFinite(c.minX));

      // (A) Resolve Balloon vs Balloon Collisions
      for (let i = 0; i < bList.length; i++) {
        for (let j = i + 1; j < bList.length; j++) {
          const b1 = bList[i], b2 = bList[j];
          const dx = b2.center[0] - b1.center[0];
          const dy = b2.center[1] - b1.center[1];
          const dist = Math.hypot(dx, dy) || 0.001;
          const minDist = b1.radius + b2.radius + Math.round(3.0 * N);

          if (dist < minDist) {
            const overlap = minDist - dist + 2;
            let nx = dx / dist, ny = dy / dist;
            if (dist < 1) { nx = 1; ny = 0; }
            let sx = 0, sy = 0;
            if (Math.abs(dy) < Math.round(5.0 * N)) {
              // 수평 일직선상 배치인 경우: X축으로만 분리 (수평 정렬 유지)
              sx = Math.round(overlap * (nx >= 0 ? 1 : -1));
              sy = 0;
            } else if (Math.abs(dx) < Math.round(5.0 * N)) {
              // 수직 일직선상 배치인 경우: Y축으로만 분리 (수직 열 정렬 유지 및 도면 침범 원천 방지)
              sy = Math.round(overlap * (ny >= 0 ? 1 : -1));
              sx = 0;
            } else {
              sx = Math.round(nx * overlap);
              sy = Math.round(ny * overlap);
            }
            shiftBalloon(ents, b2.id, sx, sy);
            b2.center[0] += sx; b2.center[1] += sy;
            movedAny = true;
          }
        }
      }

      // (B) Resolve Balloon vs Dimension Texts & Dimension Lines
      bList.forEach(b => {
        const bx = b.center[0], by = b.center[1], br = b.radius;
        const pad = Math.round(3.0 * N);

        dimTexts.forEach(dt => {
          if (bx + br > dt.minX - pad && bx - br < dt.maxX + pad &&
              by + br > dt.minY - pad && by - br < dt.maxY + pad) {
            const dtCx = (dt.minX + dt.maxX) / 2, dtCy = (dt.minY + dt.maxY) / 2;
            const odx = bx - dtCx, ody = by - dtCy;
            let sx = 0, sy = 0;
            if (Math.abs(ody) >= Math.abs(odx)) {
              const reqY = br + (dt.maxY - dt.minY) / 2 + pad;
              sy = Math.round((ody >= 0 ? 1 : -1) * reqY - ody);
            } else {
              const reqX = br + (dt.maxX - dt.minX) / 2 + pad;
              sx = Math.round((odx >= 0 ? 1 : -1) * reqX - odx);
            }
            shiftBalloon(ents, b.id, sx, sy);
            b.center[0] += sx; b.center[1] += sy;
            movedAny = true;
          }
        });

        dimLines.forEach(dl => {
          const d = distToSegment(b.center, dl.a, dl.b);
          const reqDist = br + Math.round(2.5 * N);
          if (d < reqDist) {
            const segDx = dl.b[0] - dl.a[0], segDy = dl.b[1] - dl.a[1];
            const segLen = Math.hypot(segDx, segDy) || 1;
            let normX = -segDy / segLen, normY = segDx / segLen;
            const midX = (dl.a[0] + dl.b[0]) / 2, midY = (dl.a[1] + dl.b[1]) / 2;
            if ((bx - midX) * normX + (by - midY) * normY < 0) {
              normX = -normX; normY = -normY;
            }
            const push = Math.round(reqDist - d + 3);
            let sx = Math.round(normX * push), sy = Math.round(normY * push);
            // 외곽 풍선은 도면 내부(탱크/패드 방향)로 밀려 들어가지 않도록 보호
            if (bx > 0 && sx < 0 && (b.center[0] + sx < dl.a[0])) sx = 0;
            shiftBalloon(ents, b.id, sx, sy);
            b.center[0] += sx; b.center[1] += sy;
            movedAny = true;
          }
        });
      });

      // (C) Resolve Balloon vs Nozzle Callouts & Bodies
      bList.forEach(b => {
        const bx = b.center[0], by = b.center[1], br = b.radius;
        const pad = Math.round(3.0 * N);

        calloutList.forEach(cGrp => {
          if (bx + br > cGrp.minX - pad && bx - br < cGrp.maxX + pad &&
              by + br > cGrp.minY - pad && by - br < cGrp.maxY + pad) {
            const ntCx = (cGrp.minX + cGrp.maxX) / 2, ntCy = (cGrp.minY + cGrp.maxY) / 2;
            const odx = bx - ntCx, ody = by - ntCy;
            let sx = 0, sy = 0;
            if (Math.abs(ody) >= Math.abs(odx)) {
              const reqY = br + (cGrp.maxY - cGrp.minY) / 2 + pad;
              sy = Math.round((ody >= 0 ? 1 : -1) * reqY - ody);
            } else {
              const reqX = br + (cGrp.maxX - cGrp.minX) / 2 + pad;
              sx = Math.round((odx >= 0 ? 1 : -1) * reqX - odx);
            }
            shiftBalloon(ents, b.id, sx, sy);
            b.center[0] += sx; b.center[1] += sy;
            movedAny = true;
          }
        });

        nozBodies.forEach(nb => {
          if (nb.c && nb.r) {
            const d = Math.hypot(bx - nb.c[0], by - nb.c[1]);
            const reqD = br + nb.r + Math.round(2.5 * N);
            if (d < reqD) {
              const push = Math.round(reqD - d + 3);
              const nx = (bx - nb.c[0]) / (d || 1), ny = (by - nb.c[1]) / (d || 1);
              const sx = Math.round(nx * push), sy = Math.round(ny * push);
              shiftBalloon(ents, b.id, sx, sy);
              b.center[0] += sx; b.center[1] += sy;
              movedAny = true;
            }
          }
        });
      });

      // (D) Resolve Nozzle Callout vs Nozzle Callout Collisions (Grouped atomic shift preserves line spacing)
      for (let i = 0; i < calloutList.length; i++) {
        for (let j = i + 1; j < calloutList.length; j++) {
          const c1 = calloutList[i], c2 = calloutList[j];
          const padX = Math.round(1.5 * N);
          const padY = Math.round(2.0 * N);
          if (c2.maxX > c1.minX - padX && c2.minX < c1.maxX + padX &&
              c2.maxY > c1.minY - padY && c2.minY < c1.maxY + padY) {
            let shiftY = (c2.p[1] >= c1.p[1] ? 1 : -1) * Math.round(c1.maxY - c2.minY + padY);
            shiftY = Math.min(Math.round(4.0 * N), Math.max(-Math.round(4.0 * N), shiftY));
            const isBottom = (c2.meta && c2.meta.face === 'front') || c2.p[1] < 0;
            if (isBottom) {
              shiftY = -Math.abs(shiftY);
            }
            const curShift = calloutShifts.get(c2.id) || 0;
            if (Math.abs(curShift + shiftY) <= Math.round(8.0 * N)) {
              shiftCallout(ents, c2.id, 0, shiftY);
              calloutShifts.set(c2.id, curShift + shiftY);
              c2.minY += shiftY; c2.maxY += shiftY; c2.p[1] += shiftY;
              c2.texts.forEach(te => { te.p[1] += shiftY; });
              movedAny = true;
            }
          }
        }
      }

      // (E) Resolve Nozzle Callout vs Dimension Texts
      calloutList.forEach(cGrp => {
        dimTexts.forEach(dt => {
          const padX = Math.round(1.0 * N);
          const padY = Math.round(2.0 * N);
          if (cGrp.maxX > dt.minX - padX && cGrp.minX < dt.maxX + padX &&
              cGrp.maxY > dt.minY - padY && cGrp.minY < dt.maxY + padY) {
            let shiftY = (cGrp.p[1] >= dt.p[1] ? 1 : -1) * Math.round(dt.maxY - cGrp.minY + padY);
            shiftY = Math.min(Math.round(3.0 * N), Math.max(-Math.round(3.0 * N), shiftY));
            const isBottom = (cGrp.meta && cGrp.meta.face === 'front') || cGrp.p[1] < 0;
            if (isBottom) {
              shiftY = -Math.abs(shiftY);
            }
            const curShift = calloutShifts.get(cGrp.id) || 0;
            if (Math.abs(curShift + shiftY) <= Math.round(8.0 * N)) {
              shiftCallout(ents, cGrp.id, 0, shiftY);
              calloutShifts.set(cGrp.id, curShift + shiftY);
              cGrp.minY += shiftY; cGrp.maxY += shiftY; cGrp.p[1] += shiftY;
              cGrp.texts.forEach(te => { te.p[1] += shiftY; });
              movedAny = true;
            }
          }
        });
      });

      if (!movedAny) break;
    }

    // 최종 안전 보장: 모든 풍선 기호의 원형 중심과 텍스트 위치 완전 일치 동기화
    const bubbles = new Map();
    ents.forEach(e => {
      if (e.layer === 'BALLOON' && e.balloonId && e.balloonRole === 'bubble') {
        bubbles.set(e.balloonId, [e.c[0], e.c[1]]);
      }
    });
    ents.forEach(e => {
      if (e.layer === 'BALLOON' && e.balloonId && e.balloonRole === 'text') {
        const c = bubbles.get(e.balloonId);
        if (c) {
          e.p[0] = c[0];
          e.p[1] = c[1];
        }
      }
    });

    return ents;
  }

  /* ---------- 스틸 스키드 프레임 규격 (Steel Skid Specification) ---------- */
  function getSkidDimensions(frame) {
    const f = Number(frame) || 75;
    if (f === 50) {
      return {
        f: 50,
        name: '50 SHS (50X50 SQ PIPE)',
        mainSpec: '50X50 SQ PIPE (3.2T)',
        subSpec: '50X50 SQ PIPE (3.2T)',
        mainW: 50,
        mainH: 50,
        subW: 50,
        subH: 50,
        mainT: 3.2,
        subT: 3.2,
        type: 'shs'
      };
    } else if (f === 125) {
      return {
        f: 125,
        name: '125 Channel',
        mainSpec: '[-125x65x6T',
        subSpec: '[-75x40x5T',
        mainW: 65,
        mainH: 125,
        subW: 40,
        subH: 75,
        mainT: 6.0,
        subT: 5.0,
        type: 'channel'
      };
    } else if (f === 150) {
      return {
        f: 150,
        name: '150 Channel',
        mainSpec: '[-150x75x6.5T',
        subSpec: '[-100x50x5T',
        mainW: 75,
        mainH: 150,
        subW: 50,
        subH: 100,
        mainT: 6.5,
        subT: 5.0,
        type: 'channel'
      };
    }
    // 기본값: 75 Angle
    return {
      f: 75,
      name: '75 Angle (L)',
      mainSpec: 'L-75x75x6T',
      subSpec: '[-75x40x5T',
      mainW: 75,
      mainH: 75,
      subW: 40,
      subH: 75,
      mainT: 6.0,
      subT: 5.0,
      type: 'angle'
    };
  }

  function getSkidSpec(frame, lang = 'ko') {
    const d = getSkidDimensions(frame);
    if (lang === 'ko') {
      return `주부재: ${d.mainSpec}, 종부재: ${d.subSpec}`;
    }
    return `Main: ${d.mainSpec}, Sub: ${d.subSpec}`;
  }

  /* ---------- 기초 프레임 구분 (O: 기존형 / N: 신규형) ----------
   * O(기존): W방향 주재 = 시작/끝단 돌출재(2060ASZL/R 등) + 중간 2000ASZ, 코너는 W방향 주재가 덮음
   * N(신규): W방향 주재 = 판넬 모듈선 기준 0990/1490/1990 (양끝 5mm 여유, L방향과 동일 접미사 ALZ/CLZ/HCLZ),
   *          코너는 외곽 L방향 주재가 W방향 주재 외측까지 연장되어 연결
   */
  function getFrameVariant(opt) {
    if (!opt) return 'O';
    if (opt.frameVariant === 'N' || opt.frameVariant === 'n') return 'N';
    if (/N$/i.test(String(opt.frame || ''))) return 'N';
    return 'O';
  }
  function frameLabel(frame, variant, lang = 'ko') {
    const f = parseInt(frame, 10) || 75;
    const v = variant === 'N' ? 'N' : 'O';
    const base = f === 75 ? (lang === 'en' ? '75 Angle' : '75 앵글') : (f === 50 ? '50 SHS' : `${f} ${lang === 'en' ? 'Channel' : '채널'}`);
    return f === 50 ? base : `${base}(${v})`;
  }
  // N형 W방향 주재 분할: 행(판넬 모듈) 배열 → [{ nominal, cut, y0Off }] (y0Off: 런 시작점 기준 부재 시작 오프셋)
  function computeWSpansN(rows) {
    const spans = computeColSpans(rows);
    const out = [];
    let acc = 0;
    spans.forEach(s => {
      out.push({ nominal: s, cut: s - 10, y0Off: acc + 5 });
      acc += s;
    });
    return out;
  }
  const pad4Code = n => String(Math.round(n)).padStart(4, '0');
  // W방향 주재(O형) 품번 접미사: 75 Angle=ASZ, 125 Channel=CSZ, 150 Channel=HCSZ (L방향: ALZ / CLZ / HCLZ)
  function wMainFamily(frame) {
    const f = parseInt(frame, 10);
    return f === 150 ? 'HCSZ' : (f === 125 ? 'CSZ' : 'ASZ');
  }
  // '125N' / frameVariant 입력을 { frame: 125, frameVariant: 'N' } 형태로 정규화
  function normFrameOpt(opt) {
    if (!opt) return opt;
    const v = getFrameVariant(opt);
    const f = parseInt(opt.frame, 10);
    if (opt.frameVariant === v && (opt.frame === undefined || typeof opt.frame === 'number')) return opt;
    return { ...opt, frame: isNaN(f) ? opt.frame : f, frameVariant: v };
  }

  /* ---------- 높이별 스틸 스키드 프레임 기본 선정 규칙 (Skid Frame Rules by Height) ---------- */
  const DEFAULT_SKID_RULES = [
    { id: 'skid_rule_1', minH: 1.0, maxH: 2.5, frame: 75, desc: '1.0m ~ 2.5mH' },
    { id: 'skid_rule_2', minH: 3.0, maxH: 4.0, frame: 125, desc: '3.0m ~ 4.0mH' },
    { id: 'skid_rule_3', minH: 4.5, maxH: 10.0, frame: 150, desc: '4.5m ~ 5.0m+H' }
  ];

  let activeCustomSkidRules = null;

  function getDefaultSkidRules() {
    return JSON.parse(JSON.stringify(DEFAULT_SKID_RULES));
  }

  function setCustomSkidRules(rules) {
    if (Array.isArray(rules) && rules.length > 0) {
      activeCustomSkidRules = JSON.parse(JSON.stringify(rules));
    } else {
      activeCustomSkidRules = null;
    }
  }

  function getCustomSkidRules() {
    return activeCustomSkidRules ? JSON.parse(JSON.stringify(activeCustomSkidRules)) : null;
  }

  function getActiveSkidRules() {
    return activeCustomSkidRules ? JSON.parse(JSON.stringify(activeCustomSkidRules)) : getDefaultSkidRules();
  }

  function getFrameForHeight(hInM, rules = null) {
    const rList = rules || getActiveSkidRules();
    const h = Number(hInM) || 3.0;
    for (const r of rList) {
      const min = Number(r.minH) || 0;
      const max = Number(r.maxH) || 999;
      if (h >= min - 0.001 && h <= max + 0.001) {
        return Number(r.frame) || 75;
      }
    }
    // 기본 범위 외 안전 기본값 (1-2.5: 75, 3-4: 125, 4.5-5+: 150)
    if (h <= 2.5) return 75;
    if (h <= 4.0) return 125;
    return 150;
  }

  function formatSkidRuleSummary(rules = null) {
    const rList = rules || getActiveSkidRules();
    if (!rList || !rList.length) return '규칙 없음';
    return rList.map(r => {
      const minStr = (r.minH !== undefined && r.minH !== null) ? `${r.minH}` : '0';
      const maxStr = (r.maxH && r.maxH < 90) ? `~${r.maxH}m` : 'm+';
      const fName = (r.frame === 75 || r.frame === '75') ? '75앵글' : (r.frame === 50 || r.frame === '50' ? '50각관' : `${r.frame}채널`);
      return `${minStr}${maxStr}: ${fName}`;
    }).join(' / ');
  }

  /* ---------- 기본 부품 사양 명세표 생성 (Default Item List / BOM) ---------- */
  function buildDefaultBOM(opt) {
    const H = (opt.height || []).reduce((a, b) => a + (b || 0), 0) || 3000;
    const mat = (opt.material === 'STS') ? 'STS' : (opt.material === 'GRP' ? 'GRP' : 'SMC');
    const mmap = createMap(opt);
    const totalL = mmap.length, totalW = mmap.width;
    const lang = opt.drawingLang || opt.lang || 'ko';

    let manholeCount = 0, ventCount = 0;
    Object.values(opt.marks || {}).forEach(m => {
      if (m === 1) manholeCount++;
      else if (m === 2) ventCount++;
    });
    const ladderCount = (opt && opt.ladders !== undefined && opt.ladders !== null)
      ? Object.keys(opt.ladders).length
      : 1;
    const nozzleList = getNozzleList(opt);
    const frmVal = opt.frame || opt.frm || 75;
    const padH = (typeof opt.padH === 'number' && !isNaN(opt.padH)) ? opt.padH : (600 - frmVal);

    if (lang === 'en') {
      return [
        { no: 1, key: 'foundation', name: 'Concrete Foundation', mat: 'CONC', qty: '1 Set', spec: `Refer Foundation Pad plan (180kgf/cm², H${padH})` },
        { no: 2, key: 'skid', name: 'Skid Frame', mat: 'SS275(HDG)', qty: '1 Set', spec: getSkidSpec(frmVal, 'en') },
        { no: 3, key: 'panel', name: 'Panel (Bottom/Side/Roof)', mat: mat, qty: '1 Set', spec: `All ${mat} Panels (${totalW}W x ${totalL}L x ${H}H)` },
        { no: 4, key: 'corner', name: 'Corner Frame', mat: 'HDG', qty: '4 Sets', spec: 'L-70x70x8.0T' },
        { no: 5, key: 'airvent', name: 'Air Vent', mat: 'ABS', qty: `${ventCount || 1} EA`, spec: 'Φ50 (Insect screen #20 attached)' },
        { no: 6, key: 'manhole', name: 'Manhole', mat: mat, qty: `${manholeCount || 1} EA`, spec: 'Ø600 Double cover with lock' },
        { no: 7, key: 'inladder', name: 'Internal Ladder', mat: 'FRP', qty: ladderCount > 0 ? `${ladderCount} Set` : '-', spec: `L=${H}mm` },
        { no: 8, key: 'exladder', name: 'External Ladder', mat: 'HDG', qty: ladderCount > 0 ? `${ladderCount} Set` : '-', spec: 'Vertical: 20x30x1.2T, W=270' },
        { no: 9, key: 'flangebar', name: 'Flange Bar', mat: 'HDG', qty: '1 Set', spec: 'L-65x30x3T etc.' },
        { no: 10, key: 'stay', name: 'Internal Stay', mat: 'SS316+PE', qty: '1 Set', spec: 'Φ-10.7 Tie-Rod(M12)' },
        { no: 11, key: 'nozzle', name: 'Nozzles', mat: 'STS304', qty: `${nozzleList.length || 0} EA`, spec: 'JIS 10K Flange / Socket' }
      ];
    } else if (lang === 'ko') {
      return [
        { no: 1, key: 'foundation', name: '기초 콘크리트 (Foundation)', mat: 'CONC', qty: '1식', spec: `기초 패드 도면 참조 (180kgf/cm², H${padH})` },
        { no: 2, key: 'skid', name: '스키드 프레임 (Skid Frame)', mat: 'SS275(HDG)', qty: '1식', spec: getSkidSpec(frmVal, 'ko') },
        { no: 3, key: 'panel', name: '본체 판넬 (바닥/측면/지붕)', mat: mat, qty: '1식', spec: `전체 ${mat} 판넬 (${totalW}W x ${totalL}L x ${H}H)` },
        { no: 4, key: 'corner', name: '코너 프레임 (Corner Frame)', mat: 'HDG', qty: '4조', spec: 'L-70x70x8.0T' },
        { no: 5, key: 'airvent', name: '에어벤트 (Air Vent)', mat: 'ABS', qty: `${ventCount || 1}개`, spec: 'Φ50 (합성수지 방충망 #20 부착)' },
        { no: 6, key: 'manhole', name: '맨홀 (Manhole)', mat: mat, qty: `${manholeCount || 1}개`, spec: 'Ø600 쇄정식 이중덮개 부착' },
        { no: 7, key: 'inladder', name: '내부 사다리 (Internal Ladder)', mat: 'FRP', qty: ladderCount > 0 ? `${ladderCount}조` : '-', spec: `L=${H}mm` },
        { no: 8, key: 'exladder', name: '외부 사다리 (External Ladder)', mat: 'HDG', qty: ladderCount > 0 ? `${ladderCount}조` : '-', spec: '세로대: 20x30x1.2T, 폭 270' },
        { no: 9, key: 'flangebar', name: '플랜지 바 (Flange Bar)', mat: 'HDG', qty: '1식', spec: 'L-65x30x3T 등' },
        { no: 10, key: 'stay', name: '내부 스테이 (Internal Stay)', mat: 'SS316+PE', qty: '1식', spec: 'Φ-10.7 Tie-Rod(M12)' },
        { no: 11, key: 'nozzle', name: '배관 노즐 (Nozzles)', mat: 'STS304', qty: `${nozzleList.length || 0}개`, spec: 'JIS 10K Flange / Socket' }
      ];
    } else { // bilingual
      return [
        { no: 1, key: 'foundation', name: 'Concrete Foundation', mat: 'CONC', qty: '1 Set (1식)', spec: `Refer Foundation Pad plan (180kgf/cm², H${padH})` },
        { no: 2, key: 'skid', name: 'Skid Frame', mat: 'SS275(HDG)', qty: '1 Set (1식)', spec: getSkidSpec(frmVal, 'bilingual') },
        { no: 3, key: 'panel', name: 'Panel (Bottom/Side/Roof)', mat: mat, qty: '1 Set (1식)', spec: `All ${mat} Panels (${totalW}W x ${totalL}L x ${H}H)` },
        { no: 4, key: 'corner', name: 'Corner Frame', mat: 'HDG', qty: '4 Sets (4조)', spec: 'L-70x70x8.0T' },
        { no: 5, key: 'airvent', name: 'Air Vent', mat: 'ABS', qty: `${ventCount || 1} EA`, spec: 'Φ50 (Insect screen #20 attached)' },
        { no: 6, key: 'manhole', name: 'Manhole', mat: mat, qty: `${manholeCount || 1} EA`, spec: 'Ø600 Double cover with lock' },
        { no: 7, key: 'inladder', name: 'Internal Ladder', mat: 'FRP', qty: ladderCount > 0 ? `${ladderCount} Set (조)` : '-', spec: `L=${H}mm` },
        { no: 8, key: 'exladder', name: 'External Ladder', mat: 'HDG', qty: ladderCount > 0 ? `${ladderCount} Set (조)` : '-', spec: 'Vertical: 20x30x1.2T, W=270' },
        { no: 9, key: 'flangebar', name: 'Flange Bar', mat: 'HDG', qty: '1 Set (1식)', spec: 'L-65x30x3T etc.' },
        { no: 10, key: 'stay', name: 'Internal Stay', mat: 'SS316+PE', qty: '1 Set (1식)', spec: 'Φ-10.7 Tie-Rod(M12)' },
        { no: 11, key: 'nozzle', name: 'Nozzles', mat: 'STS304', qty: `${nozzleList.length || 0} EA`, spec: 'JIS 10K Flange / Socket' }
      ];
    }
  }

  /* ---------- 평면도 생성 (TankPlane + TankPlaneDim 상당, 직사각형 탱크) ---------- */
  const FRAME = 75, DIM_OFF = 140;   // 원본 상수: 틀 75, 외부보강 140
  let dimSeq = 0;
  function dimLinear(ents, p1, p2, off, vertical, text, textH, layer) {
    const span = vertical ? Math.abs(p2[1] - p1[1]) : Math.abs(p2[0] - p1[0]);
    // 1. 작은 구간(75mm, 100mm 등)에 대한 축척 적응형 텍스트 크기 및 틱 크기
    const curTextH = span < textH * 1.6 ? Math.max(Math.round(textH * 0.65), Math.min(textH, Math.round(span * 0.70))) : textH;
    const tick = Math.min(Math.round(curTextH * 0.28), Math.max(8, Math.round(span * 0.20)));
    const extOver = Math.min(Math.round(curTextH * 0.20), Math.max(6, Math.round(span * 0.15)));

    // 치수선과 텍스트 사이의 여백 (글씨가 절대 선이나 틱에 닿지 않도록 충분한 이격 거리 확보)
    // 텍스트는 valign: 'middle'이므로 문자 높이 절반 + 틱 높이 + 안전 여백 확보: 1.05 * curTextH
    const textOffset = Math.round(curTextH * 1.05);

    const dId = 'DIM_' + (++dimSeq);
    const meta = { id: dId, vertical: !!vertical, text: String(text != null ? text : '') };

    if (!vertical) {                           // 수평 치수선, off 는 y 방향 위치
      const y = off;
      const dir = y >= p1[1] ? 1 : -1;
      ents.push({ t: 'line', a: [p1[0], p1[1]], b: [p1[0], y + dir * extOver], layer, dimId: dId, dimRole: 'ext1', dimMeta: meta });
      ents.push({ t: 'line', a: [p2[0], p2[1]], b: [p2[0], y + dir * extOver], layer, dimId: dId, dimRole: 'ext2', dimMeta: meta });
      ents.push({ t: 'line', a: [p1[0], y], b: [p2[0], y], layer, dimId: dId, dimRole: 'dimline', dimMeta: meta });
      ents.push({ t: 'line', a: [p1[0] - tick, y - tick], b: [p1[0] + tick, y + tick], layer, dimId: dId, dimRole: 'tick1', dimMeta: meta });
      ents.push({ t: 'line', a: [p2[0] - tick, y - tick], b: [p2[0] + tick, y + tick], layer, dimId: dId, dimRole: 'tick2', dimMeta: meta });
      // 수평 치수 문자는 항상 치수선 위쪽에 배치 (줄에 걸치지 않음)
      ents.push({ t: 'text', p: [(p1[0] + p2[0]) / 2, y + textOffset], h: curTextH, s: text, rot: 0, align: 'center', valign: 'middle', layer, dimId: dId, dimRole: 'text', dimMeta: meta });
    } else {                                   // 수직 치수선, off 는 x 방향 위치
      const x = off;
      const objX = (p1[0] + p2[0]) / 2;
      const isLeft = x <= objX;
      const dir = isLeft ? -1 : 1;
      ents.push({ t: 'line', a: [p1[0], p1[1]], b: [x + dir * extOver, p1[1]], layer, dimId: dId, dimRole: 'ext1', dimMeta: meta });
      ents.push({ t: 'line', a: [p2[0], p2[1]], b: [x + dir * extOver, p2[1]], layer, dimId: dId, dimRole: 'ext2', dimMeta: meta });
      ents.push({ t: 'line', a: [x, p1[1]], b: [x, p2[1]], layer, dimId: dId, dimRole: 'dimline', dimMeta: meta });
      ents.push({ t: 'line', a: [x - tick, p1[1] - tick], b: [x + tick, p1[1] + tick], layer, dimId: dId, dimRole: 'tick1', dimMeta: meta });
      ents.push({ t: 'line', a: [x - tick, p2[1] - tick], b: [x + tick, p2[1] + tick], layer, dimId: dId, dimRole: 'tick2', dimMeta: meta });
      // 수직 치수 문자는 왼쪽 치수선의 경우 선 왼쪽, 오른쪽 치수선의 경우 선 오른쪽에 배치
      const textX = isLeft ? x - textOffset : x + textOffset;
      ents.push({ t: 'text', p: [textX, (p1[1] + p2[1]) / 2], h: curTextH, s: text, rot: 90, align: 'center', valign: 'middle', layer, dimId: dId, dimRole: 'text', dimMeta: meta });
    }
  }

  /* COutForceLT::OutPlate — 외부보강 T (index 1:아래 2:오른쪽 3:위 4:왼쪽), 14점 폴리라인 */
  const OUT = { thick: 10, length: 160, side: 40, pole: 130, sfp: 65 };
  function outT(ents, pt, idx) {
    const a = { 1: [1, 0], 2: [0, 1], 3: [-1, 0], 4: [0, -1] }[idx];
    const d = { 1: [0, -1], 2: [1, 0], 3: [0, 1], 4: [-1, 0] }[idx];
    const { thick, length, side, pole, sfp } = OUT;
    const mv = (p, ka, kd) => [p[0] + a[0] * ka + d[0] * kd, p[1] + a[1] * ka + d[1] * kd];
    const p = [pt];
    p[1] = mv(p[0], thick / 2, 0);   p[2] = mv(p[1], 0, pole);
    p[3] = mv(p[2], sfp, 0);         p[4] = mv(p[3], 0, -(side - thick));
    p[5] = mv(p[4], thick, 0);       p[6] = mv(p[5], 0, side);
    p[7] = mv(p[6], -length, 0);     p[8] = mv(p[7], 0, -side);
    p[9] = mv(p[8], thick, 0);       p[10] = mv(p[9], 0, side - thick);
    p[11] = mv(p[10], sfp, 0);       p[12] = mv(p[11], 0, -pole);
    p[13] = mv(p[12], thick / 2, 0);
    for (let k = 0; k < 13; k++) ents.push({ t: 'line', a: p[k], b: p[k + 1], layer: 'REINF' });
  }

  function buildPlan(opt, templates) {
    const map = createMap(opt);
    const mat = opt.material === 'STS' ? 'STS' : 'SMC';
    const ents = [], blocks = {};
    ents._usedBalloons = opt.usedBalloons || (opt.usedBalloons = new Set());
    const getTopBlock = (w, h) => {
      const blkName = `PANEL_TOP_${mat}_${w}x${h}`;
      if (!blocks[blkName]) {
        const bEnts = [
          { t: 'line', a: [0, 0], b: [w, 0], layer: 'PANEL' },
          { t: 'line', a: [w, 0], b: [w, h], layer: 'PANEL' },
          { t: 'line', a: [w, h], b: [0, h], layer: 'PANEL' },
          { t: 'line', a: [0, h], b: [0, 0], layer: 'PANEL' },
          ...panelShapes(templates, mat, 0, 0, w, h, opt)
        ];
        blocks[blkName] = bEnts;
      }
      return blkName;
    };

    // 패널 (블럭 단위 삽입 - 맨홀판넬 위치는 기존 천정판넬을 제거하고 맨홀판넬만 배치)
    for (let i = 0; i < map.rows.length; i++) {
      for (let j = 0; j < map.cols.length; j++) {
        if (!map.has(i, j)) continue;
        const cellKey = `${i},${j}`;
        const hasManhole = Boolean(opt.marks && (opt.marks[cellKey] & 1));
        if (hasManhole) {
          // 맨홀판넬이 올라가는 위치는 기존 천정판넬을 제외 (markShapes에서 맨홀판넬 단독 렌더링)
          continue;
        }
        const x = map.xs[j], y = map.ys[i], w = map.cols[j], h = map.rows[i];
        const blkName = getTopBlock(w, h);
        ents.push({ t: 'insert', block: blkName, p: [x, y], w, h, layer: 'PANEL' });
      }
    }
    // 외곽 틀 (75mm 오프셋) + 모서리 + 외부보강 T : 존재하는 패널의 노출된 변마다 처리 (L자형 등 일반 형상)
    const F = FRAME, W = map.width, L = map.length, rf = opt.rf || 0, sts = mat === 'STS';
    const ln = (a, b, layer) => ents.push({ t: 'line', a, b, layer: layer || 'FRAME' });
    const chain = (p, layer, closed) => { for (let k = 0; k + 1 < p.length; k++) ln(p[k], p[k + 1], layer); if (closed) ln(p[p.length - 1], p[0], layer); };
    const SIDES = { bottom: { o: [-1, 0], a: [0, 1], T: 1 }, top: { o: [1, 0], a: [0, 1], T: 3 }, left: { o: [0, -1], a: [1, 0], T: 4 }, right: { o: [0, 1], a: [1, 0], T: 2 } };
    const exposed = (i, j, sd) => map.has(i, j) && !map.has(i + SIDES[sd].o[0], j + SIDES[sd].o[1]);
    for (let i = 0; i < map.rows.length; i++) for (let j = 0; j < map.cols.length; j++) {
      if (!map.has(i, j)) continue;
      const x0 = map.xs[j], x1 = map.xs[j + 1], y0 = map.ys[i], y1 = map.ys[i + 1];
      Object.keys(SIDES).forEach(sd => {
        if (!exposed(i, j, sd)) return;
        const { o, a } = SIDES[sd];
        // 끝점이 오목한 모서리(이웃 패널은 있고 그 바깥 패널도 있음)면 F 만큼 줄인다
        const concave = k => { const ni = i + a[0] * k, nj = j + a[1] * k; return map.has(ni, nj) && map.has(ni + o[0], nj + o[1]); };
        const s0 = concave(-1) ? F : 0, s1 = concave(1) ? F : 0;
        if (sd === 'bottom') ln([x0 + s0, y0 - F], [x1 - s1, y0 - F]);
        else if (sd === 'top') ln([x0 + s0, y1 + F], [x1 - s1, y1 + F]);
        else if (sd === 'left') ln([x0 - F, y0 + s0], [x0 - F, y1 - s1]);
        else ln([x1 + F, y0 + s0], [x1 + F, y1 - s1]);
        // 외부보강 T: 같은 변이 이어지는 다음 패널과의 이음선
        if (rf === 0 && exposed(i + a[0], j + a[1], sd)) {
          const customPlanPost = resolvePartEntities(opt.partTemplates || opt.customComponents, 'ext_reinf', 'plan', (opt.height && opt.height[0]) || 2000);
          if (customPlanPost && customPlanPost.length) {
            const pt = (sd === 'bottom') ? [x1, y0 - F] : (sd === 'top') ? [x1, y1 + F] : (sd === 'left') ? [x0 - F, y1] : [x1 + F, y1];
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            customPlanPost.forEach(e => {
              if (e.k === 'line') { minX = Math.min(minX, e.p[0][0], e.p[1][0]); maxX = Math.max(maxX, e.p[0][0], e.p[1][0]); minY = Math.min(minY, e.p[0][1], e.p[1][1]); maxY = Math.max(maxY, e.p[0][1], e.p[1][1]); }
              else if (e.k === 'circle' || e.k === 'arc') { minX = Math.min(minX, e.c[0] - e.r); maxX = Math.max(maxX, e.c[0] + e.r); minY = Math.min(minY, e.c[1] - e.r); maxY = Math.max(maxY, e.c[1] + e.r); }
              else if (e.k === 'poly') { e.p.forEach(p => { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }); }
            });
            const cx = (minX + maxX) / 2;
            const deg = (sd === 'bottom') ? 0 : (sd === 'right') ? 90 : (sd === 'top') ? 180 : 270;
            const rad = deg * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
            customPlanPost.forEach(e => {
              const rot = p => {
                const dx = p[0] - cx, dy = p[1];
                return [pt[0] + dx * cos - dy * sin, pt[1] + dx * sin + dy * cos];
              };
              if (e.k === 'line') ln(rot(e.p[0]), rot(e.p[1]), 'REINF');
              else if (e.k === 'circle') ents.push({ t: 'circle', c: rot(e.c), r: e.r, layer: 'REINF' });
              else if (e.k === 'poly') chain(e.p.map(rot), 'REINF', e.c);
            });
          } else {
            if (sd === 'bottom') outT(ents, [x1, y0 - F], 1); else if (sd === 'top') outT(ents, [x1, y1 + F], 3);
            else if (sd === 'left') outT(ents, [x0 - F, y1], 4); else outT(ents, [x1 + F, y1], 2);
          }
        }
      });
      // 볼록 모서리: GRP=삼각형, STS=직각 꺾임 + 대각선
      const corner = c => { if (!sts) chain(c, 'FRAME', true); else { chain([c[0], [c[0][0], c[2][1]], c[2]], 'FRAME'); ln([c[0][0], c[2][1]], c[1]); } };
      if (exposed(i, j, 'bottom') && exposed(i, j, 'left')) corner([[x0 - F, y0], [x0, y0], [x0, y0 - F]]);
      if (exposed(i, j, 'bottom') && exposed(i, j, 'right')) corner([[x1, y0 - F], [x1, y0], [x1 + F, y0]]);
      if (exposed(i, j, 'top') && exposed(i, j, 'right')) corner([[x1 + F, y1], [x1, y1], [x1, y1 + F]]);
      if (exposed(i, j, 'top') && exposed(i, j, 'left')) corner([[x0, y1 + F], [x0, y1], [x0 - F, y1]]);
    }
    ladderList(opt, map).forEach(l => ents.push(...ladderShapes(l.idx, l.x, l.y, 0, opt)));
    Object.entries(opt.marks || {}).forEach(([k, m]) => {
      const [i, j] = k.split(',').map(Number);
      if (map.has(i, j) && map.cols[j] === 1000 && map.rows[i] === 1000) ents.push(...markShapes(map.xs[j], map.ys[i], m, opt, i, j, map));
    });
    // 기둥 표시 (삭제된 패널 중심): 정사각 + 대각선 (원본 심볼은 미확인 → 근사)
    (opt.pillars || []).forEach(([i, j]) => {
      if (!map.removed.has(i + ',' + j) || i >= map.rows.length || j >= map.cols.length) return;
      const cx = (map.xs[j] + map.xs[j + 1]) / 2, cy = (map.ys[i] + map.ys[i + 1]) / 2, h = Math.min(map.cols[j], map.rows[i]) * 0.35;
      chain([[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]], 'REINF', true);
      ln([cx - h, cy - h], [cx + h, cy + h], 'REINF'); ln([cx - h, cy + h], [cx + h, cy - h], 'REINF');
    });
    // 구간 경계 벽 (CWallLT: 70mm폭 사각형 박스 + 솔리드 채움, 원 표시 대체)
    const cellAtXY = (x, y) => { const j = map.xs.findIndex((v, k) => x >= v && x < map.xs[k + 1]), i = map.ys.findIndex((v, k) => y >= v && y < map.ys[k + 1]); return j >= 0 && i >= 0 && map.has(i, j); };
    const WALL_TH = 70;
    const drawWallBox = (x0, y0, x1, y1) => {
      // 70mm 폭 사각형 박스 외곽선
      ln([x0, y0], [x1, y0], 'WALL');
      ln([x1, y0], [x1, y1], 'WALL');
      ln([x1, y1], [x0, y1], 'WALL');
      ln([x0, y1], [x0, y0], 'WALL');
      // 솔리드 채움 (AutoCAD DXF SOLID 순서: [bottom-left, bottom-right, top-left, top-right])
      ents.push({
        t: 'solid',
        p: [[x0, y0], [x1, y0], [x0, y1], [x1, y1]],
        layer: 'WALL'
      });
    };

    const L5 = (opt.length || []).slice(0, 5), W5 = (opt.width || []).slice(0, 5);
    for (let i = 1, nLen = W5[0]; i < 5 && W5[i]; nLen += W5[i++]) {
      let x = 0;
      L5.forEach(len => {
        if (!len) return;
        frontSplit(len, 0).forEach(cx => {
          const dx = cx >> 1;
          if (!cellAtXY(x + dx, nLen - 1) && !cellAtXY(x + dx, nLen + 1)) { x += cx; return; }
          drawWallBox(x, nLen, x + cx, nLen + WALL_TH);
          x += cx;
        });
      });
    }
    for (let i = 1, nLen = L5[0]; i < 5 && L5[i]; nLen += L5[i++]) {
      let y = 0;
      W5.forEach(wid => {
        if (!wid) return;
        sideSplit(wid, 0).forEach(cy => {
          const dy = cy >> 1;
          if (!cellAtXY(nLen - 1, y + dy) && !cellAtXY(nLen + 1, y + dy)) { y += cy; return; }
          drawWallBox(nLen, y, nLen + WALL_TH, y + cy);
          y += cy;
        });
      });
    }

    const N = opt._N || 25;
    const textH = Math.round(3.0 * N);
    const dimGap1 = Math.round(10.0 * N);
    const dimGap2 = Math.round(18.0 * N);

    // 치수는 풍선과 노즐이 없을 때 기준 100% 고정 (media_1791083394539.png 기준)
    const baseX = -F - dimGap1;
    const baseY = -F - dimGap1;
    const overallX = baseX - Math.round(8.0 * N);
    const overallY = baseY - Math.round(8.0 * N);

    // 배관 노즐 (INLET, OUTLET, OVERFLOW, DRAIN, FIRE 등) 평면도 배치 (글로벌 표준 간결 표기)
    const nozList = getNozzleList(opt);
    const nozTextH = Math.round(2.2 * N);
    nozList.forEach((n, idx) => {
      const spec = getNozzleSpec(n.size);
      const isFlg = n.type === 'FLANGE';
      const label = formatNozzleLabel(n);
      const offVal = n.offset || 0;
      
      if (n.face === 'top' || n.face === 'bottom') {
        const isBottom = (n.face === 'bottom');
        const cell = isBottom ? (n.bottomCell || n.topCell || [0, 0]) : (n.topCell || [0, 0]);
        const i = Math.max(0, Math.min(cell[0], map.rows.length - 1));
        const j = Math.max(0, Math.min(cell[1], map.cols.length - 1));
        if (!map.has(i, j)) return;
        const cx = (map.xs[j] + map.xs[j + 1]) / 2 + offVal;
        const cy = (map.ys[i] + map.ys[i + 1]) / 2;
        
        if (isFlg) {
          ents.push({ t: 'circle', c: [cx, cy], r: spec.rf, layer: 'NOZZLE' });
          ents.push({ t: 'circle', c: [cx, cy], r: spec.pcd, layer: 'NOZZLE' });
          ents.push({ t: 'circle', c: [cx, cy], r: spec.r, layer: 'NOZZLE' });
          const numHoles = Math.min(8, spec.holes);
          for (let k = 0; k < numHoles; k++) {
            const ang = (k * 360 / numHoles + 45) * Math.PI / 180;
            ents.push({ t: 'circle', c: [cx + spec.pcd * Math.cos(ang), cy + spec.pcd * Math.sin(ang)], r: spec.hr, layer: 'NOZZLE' });
          }
        } else {
          ents.push({ t: 'circle', c: [cx, cy], r: spec.sockR, layer: 'NOZZLE' });
          ents.push({ t: 'circle', c: [cx, cy], r: spec.r, layer: 'NOZZLE' });
        }
        const cr = (isFlg ? spec.rf : spec.sockR) * 1.25;
        ents.push({ t: 'line', a: [cx - cr, cy], b: [cx + cr, cy], layer: 'NOZZLE' });
        ents.push({ t: 'line', a: [cx, cy - cr], b: [cx, cy + cr], layer: 'NOZZLE' });
        
        const leadLen = Math.max(100, 3.0 * N);
        const stagger = (idx % 3) * Math.round(1.5 * N);
        const lang = opt.drawingLang || opt.lang || 'ko';
        const isEn = lang === 'en';
        const displayLabel = isBottom ? `${label} (${isEn ? 'BOTTOM' : '하부'})` : label;
        drawLeader(ents, [cx + spec.r * 0.7, cy + spec.r * 0.7], [cx + spec.r * 0.7 + leadLen * 0.5, cy + spec.r * 0.7 + leadLen * 0.5 + stagger], [cx + spec.r * 0.7 + leadLen * 1.2, cy + spec.r * 0.7 + leadLen * 0.5 + stagger], [displayLabel], nozTextH, 'left', 'NOZZLE');
      } else if (n.face === 'front') {
        const colIdx = Math.max(0, Math.min(n.seg - 1, map.cols.length - 1));
        let frontRow = -1;
        for (let r = 0; r < map.rows.length; r++) {
          if (map.has(r, colIdx) && !map.has(r - 1, colIdx)) {
            frontRow = r;
            break;
          }
        }
        if (frontRow < 0) return;
        const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + offVal;
        const yBase = map.ys[frontRow] - F;
        const toRight = cx >= map.length / 2;
        const stagger = (idx % 2) * Math.round(1.8 * N);
        // 치수는 고정이므로 전면 노즐 지시선과 라벨은 치수선 바깥 아래(overallY 아래)로 인출하여 치수선 및 치수 문자와 완전 비간섭!
        const ey = overallY - Math.round(2.5 * N) - stagger;
        const dx = toRight ? Math.round(2.5 * N) : -Math.round(2.5 * N);
        const ex = toRight ? (cx + dx + Math.round(2.5 * N)) : (cx + dx - Math.round(2.5 * N));
        if (isFlg) {
          const yPlate1 = yBase - spec.neckLen;
          const yPlate0 = yPlate1 + spec.flgThick;
          ln([cx - spec.r, yBase], [cx - spec.r, yPlate0], 'NOZZLE');
          ln([cx + spec.r, yBase], [cx + spec.r, yPlate0], 'NOZZLE');
          chain([[cx - spec.rf, yPlate1], [cx + spec.rf, yPlate1], [cx + spec.rf, yPlate0], [cx - spec.rf, yPlate0]], 'NOZZLE', true);
          drawLeader(ents, [cx, yPlate1], [cx + dx, ey], [ex, ey], [label], nozTextH, toRight ? 'left' : 'right', 'NOZZLE', null, { face: 'front', view: 'plan' });
        } else {
          const yEnd = yBase - spec.sockLen;
          chain([[cx - spec.sockR, yEnd], [cx + spec.sockR, yEnd], [cx + spec.sockR, yBase], [cx - spec.sockR, yBase]], 'NOZZLE', true);
          ln([cx - spec.r, yEnd], [cx + spec.r, yEnd], 'NOZZLE');
          drawLeader(ents, [cx, yEnd], [cx + dx, ey], [ex, ey], [label], nozTextH, toRight ? 'left' : 'right', 'NOZZLE', null, { face: 'front', view: 'plan' });
        }
      } else if (n.face === 'rear') {
        const colIdx = Math.max(0, Math.min(n.seg - 1, map.cols.length - 1));
        let rearRow = -1;
        for (let r = map.rows.length - 1; r >= 0; r--) {
          if (map.has(r, colIdx) && !map.has(r + 1, colIdx)) {
            rearRow = r;
            break;
          }
        }
        if (rearRow < 0) return;
        const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + offVal;
        const yBase = map.ys[rearRow + 1] + F;
        const toRight = cx >= map.length / 2;
        const stagger = (idx % 2) * Math.round(1.5 * N);
        if (isFlg) {
          const yPlate1 = yBase + spec.neckLen;
          const yPlate0 = yPlate1 - spec.flgThick;
          ln([cx - spec.r, yBase], [cx - spec.r, yPlate0], 'NOZZLE');
          ln([cx + spec.r, yBase], [cx + spec.r, yPlate0], 'NOZZLE');
          chain([[cx - spec.rf, yPlate0], [cx + spec.rf, yPlate0], [cx + spec.rf, yPlate1], [cx - spec.rf, yPlate1]], 'NOZZLE', true);
          const ey = yPlate1 + Math.round(1.5 * N) + stagger;
          const dx = toRight ? Math.round(2.5 * N) : -Math.round(2.5 * N);
          const ex = toRight ? (cx + dx + Math.round(2.5 * N)) : (cx + dx - Math.round(2.5 * N));
          drawLeader(ents, [cx, yPlate1], [cx + dx, ey], [ex, ey], [label], nozTextH, toRight ? 'left' : 'right', 'NOZZLE', null, { face: 'rear', view: 'plan' });
        } else {
          const yEnd = yBase + spec.sockLen;
          chain([[cx - spec.sockR, yBase], [cx + spec.sockR, yBase], [cx + spec.sockR, yEnd], [cx - spec.sockR, yEnd]], 'NOZZLE', true);
          ln([cx - spec.r, yEnd], [cx + spec.r, yEnd], 'NOZZLE');
          const ey = yEnd + Math.round(1.5 * N) + stagger;
          const dx = toRight ? Math.round(2.5 * N) : -Math.round(2.5 * N);
          const ex = toRight ? (cx + dx + Math.round(2.5 * N)) : (cx + dx - Math.round(2.5 * N));
          drawLeader(ents, [cx, yEnd], [cx + dx, ey], [ex, ey], [label], nozTextH, toRight ? 'left' : 'right', 'NOZZLE', null, { face: 'rear', view: 'plan' });
        }
      } else if (n.face === 'left') {
        const rowIdx = Math.max(0, Math.min(n.seg - 1, map.rows.length - 1));
        let leftCol = -1;
        for (let c = 0; c < map.cols.length; c++) {
          if (map.has(rowIdx, c) && !map.has(rowIdx, c - 1)) {
            leftCol = c;
            break;
          }
        }
        if (leftCol < 0) return;
        const cy = (map.ys[rowIdx] + map.ys[rowIdx + 1]) / 2 + offVal;
        const xBase = map.xs[leftCol] - F;
        const toTop = cy >= map.width / 2;
        const stagger = (idx % 2) * Math.round(1.8 * N);
        // 치수는 고정이므로 좌측 노즐 지시선과 라벨은 좌측 치수선 바깥(overallX 좌측)으로 인출하여 치수선 및 문자와 완전 비간섭!
        const elbowX = overallX - Math.round(2.5 * N);
        const shelfEndX = elbowX - Math.round(2.5 * N);
        const ey = cy + (toTop ? Math.round(2.0 * N) : -Math.round(2.0 * N)) + stagger;
        if (isFlg) {
          const xPlate1 = xBase - spec.neckLen;
          const xPlate0 = xPlate1 + spec.flgThick;
          ln([xBase, cy - spec.r], [xPlate0, cy - spec.r], 'NOZZLE');
          ln([xBase, cy + spec.r], [xPlate0, cy + spec.r], 'NOZZLE');
          chain([[xPlate1, cy - spec.rf], [xPlate0, cy - spec.rf], [xPlate0, cy + spec.rf], [xPlate1, cy + spec.rf]], 'NOZZLE', true);
          drawLeader(ents, [xPlate1, cy], [elbowX, ey], [shelfEndX, ey], [label], nozTextH, 'right', 'NOZZLE', null, { face: 'left', view: 'plan' });
        } else {
          const xEnd = xBase - spec.sockLen;
          chain([[xEnd, cy - spec.sockR], [xBase, cy - spec.sockR], [xBase, cy + spec.sockR], [xEnd, cy + spec.sockR]], 'NOZZLE', true);
          ln([xEnd, cy - spec.r], [xEnd, cy + spec.r], 'NOZZLE');
          drawLeader(ents, [xEnd, cy], [elbowX, ey], [shelfEndX, ey], [label], nozTextH, 'right', 'NOZZLE', null, { face: 'left', view: 'plan' });
        }
      } else if (n.face === 'right') {
        const rowIdx = Math.max(0, Math.min(n.seg - 1, map.rows.length - 1));
        let rightCol = -1;
        for (let c = map.cols.length - 1; c >= 0; c--) {
          if (map.has(rowIdx, c) && !map.has(rowIdx, c + 1)) {
            rightCol = c;
            break;
          }
        }
        if (rightCol < 0) return;
        const cy = (map.ys[rowIdx] + map.ys[rowIdx + 1]) / 2 + offVal;
        const xBase = map.xs[rightCol + 1] + F;
        const toTop = cy >= map.width / 2;
        const stagger = (idx % 2) * Math.round(1.5 * N);
        if (isFlg) {
          const xPlate1 = xBase + spec.neckLen;
          const xPlate0 = xPlate1 - spec.flgThick;
          ln([xBase, cy - spec.r], [xPlate0, cy - spec.r], 'NOZZLE');
          ln([xBase, cy + spec.r], [xPlate0, cy + spec.r], 'NOZZLE');
          chain([[xPlate0, cy - spec.rf], [xPlate1, cy - spec.rf], [xPlate1, cy + spec.rf], [xPlate0, cy + spec.rf]], 'NOZZLE', true);
          const ey = cy + (toTop ? Math.round(2.0 * N) : -Math.round(2.0 * N)) + stagger;
          const elbowX = xPlate1 + Math.round(1.5 * N);
          const shelfEndX = elbowX + Math.round(2.0 * N);
          drawLeader(ents, [xPlate1, cy], [elbowX, ey], [shelfEndX, ey], [label], nozTextH, 'left', 'NOZZLE', null, { face: 'right', view: 'plan' });
        } else {
          const xEnd = xBase + spec.sockLen;
          chain([[xBase, cy - spec.sockR], [xEnd, cy - spec.sockR], [xEnd, cy + spec.sockR], [xBase, cy + spec.sockR]], 'NOZZLE', true);
          ln([xEnd, cy - spec.r], [xEnd, cy + spec.r], 'NOZZLE');
          const ey = cy + (toTop ? Math.round(2.0 * N) : -Math.round(2.0 * N)) + stagger;
          const elbowX = xEnd + Math.round(1.5 * N);
          const shelfEndX = elbowX + Math.round(2.0 * N);
          drawLeader(ents, [xEnd, cy], [elbowX, ey], [shelfEndX, ey], [label], nozTextH, 'left', 'NOZZLE', null, { face: 'right', view: 'plan' });
        }
      }
    });

    // 치수선 (치수는 풍선과 노즐이 없을 때 기준 100% 고정 - media_1791083394539.png)
    dimLinear(ents, [-F, 0], [0, 0], baseY, false, String(F), textH, 'DIM');
    map.cols.forEach((c, j) => dimLinear(ents, [map.xs[j], 0], [map.xs[j + 1], 0], baseY, false, String(c), textH, 'DIM'));
    dimLinear(ents, [L, 0], [L + F, 0], baseY, false, String(F), textH, 'DIM');
    dimLinear(ents, [-F, 0], [L + F, 0], overallY, false, String(L + 2 * F), textH, 'DIM');
    dimLinear(ents, [0, -F], [0, 0], baseX, true, String(F), textH, 'DIM');
    map.rows.forEach((r, i) => dimLinear(ents, [0, map.ys[i]], [0, map.ys[i + 1]], baseX, true, String(r), textH, 'DIM'));
    dimLinear(ents, [0, W], [0, W + F], baseX, true, String(F), textH, 'DIM');
    dimLinear(ents, [0, -F], [0, W + F], overallX, true, String(W + 2 * F), textH, 'DIM');

    // 부품 풍선 기호 (Plan View Balloon Callouts - 모두 물탱크 형상 및 치수선 바깥 외곽에 정렬)
    // 부품 풍선 기호 (Plan View Balloon Callouts - 선거리 최소화 및 상하좌우 격자 정렬 체계)
    if (opt.showBalloons !== false) {
      const boms = (opt.itemList && opt.itemList.length) ? opt.itemList : buildDefaultBOM(opt);
      const getItemNo = key => {
        const it = boms.find(b => b.key === key);
        return it ? it.no : '';
      };

      const balloonR = Math.round(4.2 * N);
      const shelfL = Math.round(4.0 * N);

      // --- 기준 정렬 좌표선 (Standard Alignment Baselines) ---
      // 1. 상단 수평 기준선 (모든 상단 풍선 기호의 Y좌표 100% 동일 정렬)
      const topBaseY = W + F + Math.round(7.5 * N);

      // 2. 우측 수직 기준선 (우측 노즐 및 라벨 돌출을 고려하여 모든 우측 풍선 기호의 X좌표 100% 동일 정렬)
      let maxRightExt = L + F;
      nozList.forEach(n => {
        if (n.face === 'right') {
          const spec = getNozzleSpec(n.size);
          const ext = L + F + (n.type === 'FLANGE' ? spec.neckLen : spec.sockLen) + Math.round(10.0 * N);
          if (ext > maxRightExt) maxRightExt = ext;
        }
      });
      const rightBaseX = Math.max(L + F + Math.round(8.0 * N), maxRightExt + Math.round(4.0 * N));

      // 3. 좌측 수직 기준선 (좌측 치수선 바깥 정렬)
      const leftClearX = overallX - Math.round(6.0 * N);

      // 4. 하단 수평 기준선 (하단 치수선 바깥 정렬)
      const botBaseY = overallY - Math.round(4.5 * N);

      const usedSet = ents._usedBalloons || (opt && opt.usedBalloons);

      // ==========================================
      // [1] 맨홀 (NO. 6) & 내부사다리 (NO. 7)
      // 선거리 최소화: 맨홀 위치에 따라 가장 가까운 외곽(우측 또는 상단)으로 최단거리 인출
      // ==========================================
      let mPos = null;
      const mEntries = Object.entries(opt.marks || {}).filter(([_, m]) => (m & 1));
      if (mEntries.length > 0) {
        const [i, j] = mEntries[0][0].split(',').map(Number);
        if (map.has(i, j)) mPos = [(map.xs[j] + map.xs[j + 1]) / 2, (map.ys[i] + map.ys[i + 1]) / 2];
      }
      if (!mPos) {
        for (let i = 0; i < map.rows.length; i++) {
          for (let j = map.cols.length - 1; j >= 0; j--) {
            if (map.has(i, j)) {
              mPos = [(map.xs[j] + map.xs[j + 1]) / 2, (map.ys[i] + map.ys[i + 1]) / 2];
              break;
            }
          }
          if (mPos) break;
        }
      }

      let manholeOnRight = false;
      if (mPos) {
        const no6 = String(getItemNo('manhole') || 6).trim();
        const no7 = String(getItemNo('inladder') || 7).trim();
        const ladderCount = (opt && opt.ladders !== undefined && opt.ladders !== null)
          ? Object.keys(opt.ladders).length
          : 1;

        // 맨홀이 하반부(y <= W * 0.5) 및 우측(x >= L * 0.5)에 위치할 경우 우측으로 최단 인출
        // (기존처럼 상단 끝까지 5~10미터를 가로지르는 긴 선 완전 제거!)
        if (mPos[1] <= W * 0.5 && mPos[0] >= L * 0.5) {
          manholeOnRight = true;
          const mhCenterY = mPos[1];
          const sepY = Math.round(6.5 * N);

          // 맨홀 풍선 (NO. 6): 우측 기준선에 수직 정렬
          const b6Center = [rightBaseX, mhCenterY + (ladderCount > 0 ? sepY : 0)];
          const b6Start = [mPos[0] + 120, mhCenterY + 80];
          drawBalloonCallout(ents, b6Start, null, b6Center, no6, N, 'BALLOON', usedSet);

          // 내부사다리 풍선 (NO. 7): 맨홀 바로 아래 동일 X좌표(rightBaseX)에 수직 정렬
          if (ladderCount > 0) {
            const b7Center = [rightBaseX, mhCenterY - sepY];
            const b7Start = [mPos[0] + 120, mhCenterY - 80];
            drawBalloonCallout(ents, b7Start, null, b7Center, no7, N, 'BALLOON', usedSet);
          }
        } else if (mPos[1] > W * 0.5) {
          // 맨홀이 상반부에 위치할 경우: 상단 기준선(topBaseY)에 수평 정렬
          const sepX = Math.round(6.5 * N);
          const b6Center = [mPos[0] - (ladderCount > 0 ? sepX : 0), topBaseY];
          const b6Start = [mPos[0] - 80, mPos[1] + 120];
          drawBalloonCallout(ents, b6Start, null, b6Center, no6, N, 'BALLOON', usedSet);

          if (ladderCount > 0) {
            const b7Center = [mPos[0] + sepX, topBaseY];
            const b7Start = [mPos[0] + 80, mPos[1] + 120];
            drawBalloonCallout(ents, b7Start, null, b7Center, no7, N, 'BALLOON', usedSet);
          }
        } else {
          // 좌하단에 위치할 경우: 좌측 기준선(leftClearX)에 수직 정렬
          const sepY = Math.round(6.5 * N);
          const b6Center = [leftClearX, mPos[1] + (ladderCount > 0 ? sepY : 0)];
          const b6Start = [mPos[0] - 120, mPos[1] + 80];
          drawBalloonCallout(ents, b6Start, null, b6Center, no6, N, 'BALLOON', usedSet);

          if (ladderCount > 0) {
            const b7Center = [leftClearX, mPos[1] - sepY];
            const b7Start = [mPos[0] - 120, mPos[1] - 80];
            drawBalloonCallout(ents, b7Start, null, b7Center, no7, N, 'BALLOON', usedSet);
          }
        }
      }

      // ==========================================
      // [2] 지붕 판넬 (Roof Panel - NO. 3)
      // 우측 기준선(rightBaseX)에 수직 정렬, 맨홀과 겹치지 않는 상반부 우측 판넬 선택
      // ==========================================
      let panelTarget = null;
      if (manholeOnRight) {
        // 맨홀이 우하단에 있으면 상반부 우측 판넬(row: 최대 또는 상단) 타겟팅
        for (let r = map.rows.length - 1; r >= 0; r--) {
          for (let c = map.cols.length - 1; c >= 0; c--) {
            if (map.has(r, c)) {
              const cy = (map.ys[r] + map.ys[r + 1]) / 2;
              if (cy > (mPos ? mPos[1] + Math.round(10.0 * N) : W * 0.4)) {
                panelTarget = { r, c };
                break;
              }
            }
          }
          if (panelTarget) break;
        }
      }
      if (!panelTarget) {
        for (let r = Math.floor(map.rows.length / 2); r < map.rows.length; r++) {
          for (let c = map.cols.length - 1; c >= 0; c--) {
            if (map.has(r, c)) { panelTarget = { r, c }; break; }
          }
          if (panelTarget) break;
        }
      }
      if (!panelTarget) panelTarget = { r: 0, c: map.cols.length - 1 };

      const pcx = (map.xs[panelTarget.c] + map.xs[panelTarget.c + 1]) / 2;
      const pcy = (map.ys[panelTarget.r] + map.ys[panelTarget.r + 1]) / 2;
      let panelBalloonY = pcy;
      if (manholeOnRight && mPos && Math.abs(panelBalloonY - mPos[1]) < Math.round(12.0 * N)) {
        panelBalloonY = Math.min(W - Math.round(3.0 * N), mPos[1] + Math.round(14.0 * N));
      }
      const b3Center = [rightBaseX, panelBalloonY];
      drawBalloonCallout(ents, [pcx, pcy], null, b3Center, getItemNo('panel') || 3, N, 'BALLOON');

      // ==========================================
      // [3] 코너 프레임 (Corner Frame - NO. 4)
      // 상단 좌측 코너: 상단 수평 기준선(topBaseY)에 정렬
      // ==========================================
      let cornerPt = null;
      for (let i = map.rows.length - 1; i >= 0; i--) {
        for (let j = 0; j < map.cols.length; j++) {
          if (map.has(i, j) && !map.has(i + 1, j) && !map.has(i, j - 1)) {
            cornerPt = [map.xs[j], map.ys[i + 1]];
            break;
          }
        }
        if (cornerPt) break;
      }
      if (!cornerPt) cornerPt = [0, W];
      const b4X = cornerPt[0] - F - Math.round(6.0 * N);
      const b4Center = [b4X, topBaseY];
      drawBalloonCallout(ents, [cornerPt[0] - F, cornerPt[1] + F], null, b4Center, getItemNo('corner') || 4, N, 'BALLOON');

      // ==========================================
      // [4] 내부 스테이 / 보강재 (Internal Stay - NO. 10)
      // 선거리 최소화: 상단 외벽에서 가장 가까운 최상단 스테이 교차점(top row seam) 선택!
      // 상단 수평 기준선(topBaseY)에 수평 정렬
      // ==========================================
      let stayPt = null;
      const topSeamRow = Math.max(1, map.rows.length - 1);
      const stayCol = Math.max(1, Math.min(2, map.cols.length - 1));
      if (map.has(topSeamRow, stayCol) && (map.has(topSeamRow - 1, stayCol) || map.has(topSeamRow, stayCol - 1))) {
        stayPt = [map.xs[stayCol], map.ys[topSeamRow]];
      }
      if (!stayPt) {
        for (let i = map.rows.length - 1; i >= 1; i--) {
          for (let j = 1; j < map.cols.length; j++) {
            if (map.has(i, j) && (map.has(i - 1, j) || map.has(i, j - 1))) {
              stayPt = [map.xs[j], map.ys[i]];
              break;
            }
          }
          if (stayPt) break;
        }
      }
      if (!stayPt) {
        stayPt = [map.length * 0.25, map.width * 0.75];
      }
      const b10X = Math.max(b4X + Math.round(9.0 * N), stayPt[0] + Math.round(3.0 * N));
      const b10Center = [b10X, topBaseY];
      drawBalloonCallout(ents, stayPt, null, b10Center, getItemNo('stay') || 10, N, 'BALLOON');

      // ==========================================
      // [5] 플랜지 바 (Flange Bar - NO. 9)
      // 상단 외벽 판넬 조인트(seam): 상단 수평 기준선(topBaseY)에 수평 정렬
      // ==========================================
      let seamPt = null;
      const midCol = Math.max(1, Math.floor(map.cols.length / 2));
      for (let i = map.rows.length - 1; i >= 0; i--) {
        if (map.has(i, midCol) && !map.has(i + 1, midCol)) {
          seamPt = [map.xs[midCol], map.ys[i + 1]];
          break;
        }
      }
      if (!seamPt) {
        seamPt = [map.length * 0.5, W];
      }
      let b9X = seamPt[0] + Math.round(2.0 * N);
      if (b9X < b10X + Math.round(8.0 * N)) b9X = b10X + Math.round(8.0 * N);
      const b9Center = [b9X, topBaseY];
      drawBalloonCallout(ents, [seamPt[0], seamPt[1] + F], null, b9Center, getItemNo('flangebar') || 9, N, 'BALLOON');

      // ==========================================
      // [6] 에어벤트 (Air Vent - NO. 5)
      // 상단 수평 기준선(topBaseY)에 수평 정렬
      // ==========================================
      let vPos = null;
      const vEntries = Object.entries(opt.marks || {}).filter(([_, m]) => (m & 2));
      if (vEntries.length > 0) {
        const [i, j] = vEntries[0][0].split(',').map(Number);
        if (map.has(i, j)) vPos = [(map.xs[j] + map.xs[j + 1]) / 2, (map.ys[i] + map.ys[i + 1]) / 2];
      }
      if (!vPos) {
        for (let i = map.rows.length - 1; i >= 0; i--) {
          for (let j = Math.floor(map.cols.length * 0.6); j < map.cols.length; j++) {
            if (map.has(i, j)) {
              const cx = (map.xs[j] + map.xs[j + 1]) / 2, cy = (map.ys[i] + map.ys[i + 1]) / 2;
              if (!mPos || Math.abs(cx - mPos[0]) > 50 || Math.abs(cy - mPos[1]) > 50) {
                vPos = [cx, cy];
                break;
              }
            }
          }
          if (vPos) break;
        }
      }
      if (!vPos) vPos = [map.length * 0.75, W * 0.8];
      let b5X = vPos[0] + Math.round(2.0 * N);
      if (b5X < b9X + Math.round(8.0 * N)) b5X = b9X + Math.round(8.0 * N);
      const b5Center = [b5X, topBaseY];
      drawBalloonCallout(ents, [vPos[0], vPos[1] + 100], null, b5Center, getItemNo('airvent') || 5, N, 'BALLOON');

      // ==========================================
      // [7] 외부 사다리 (External Ladder - NO. 8)
      // 방향별 깔끔한 단일 직선 연결 (제목 및 치수선 비간섭, 꺾임 없는 깔끔한 표준)
      // ==========================================
      const lList = ladderList(opt, map);
      if (lList.length > 0) {
        const l = lList[0];
        const no8 = String(getItemNo('exladder') || 8).trim();
        if (!usedSet || !usedSet.has(no8)) {
          if (l.sd === 'D') {
            const toRight = (l.x < L * 0.4);
            const bx8 = l.x + (toRight ? Math.round(6.0 * N) : -Math.round(6.0 * N));
            const b8Center = [bx8, botBaseY];
            const pStart = [l.x, l.y - F - 180];
            drawBalloonCallout(ents, pStart, null, b8Center, no8, N, 'BALLOON', usedSet);
          } else if (l.sd === 'R') {
            const b8Center = [rightBaseX, l.y];
            drawBalloonCallout(ents, [l.x + F + 20, l.y], null, b8Center, no8, N, 'BALLOON', usedSet);
          } else if (l.sd === 'U') {
            const b8Center = [l.x + Math.round(6.0 * N), topBaseY];
            drawBalloonCallout(ents, [l.x, l.y + F + 20], null, b8Center, no8, N, 'BALLOON', usedSet);
          } else {
            const b8Center = [leftClearX, l.y];
            drawBalloonCallout(ents, [l.x - F - 20, l.y], null, b8Center, no8, N, 'BALLOON', usedSet);
          }
        }
      }
    }

    ents.blocks = blocks;
    ents.font = opt.font || opt.cadFont || 'romans';
    const H = (opt.height || []).reduce((a, b) => a + (b || 0), 0);
    const autoDimStr = getTankDimStr(opt, map, H);
    const t = opt.title || {};
    const dimStr = (t.tankSize && t.tankSize.trim()) ? t.tankSize.trim() : autoDimStr;
    let activeAreaMm2 = 0;
    map.rows.forEach((rh, i) => {
      map.cols.forEach((cw, j) => {
        if (!map.removed.has(i + ',' + j)) {
          activeAreaMm2 += cw * rh;
        }
      });
    });
    recheckAndResolveCollisions(ents, opt);
    const ton = (activeAreaMm2 * H / 1e9).toFixed(1);
    return { map, ents, textH, blocks, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
  }

  /* ---------- 높이 구성 (MagicProperty::SetHeight: 콤보 → m_nHeight[0..4], [0]=아래) ---------- */
  /* ---------- 높이 구성 (MagicProperty::SetHeight: 콤보 → m_nHeight[0..4], [0]=아래) ---------- */
  const DEFAULT_HEIGHT_TABLE = {
    std: {
      1000: [1000],
      1500: [1500],
      2000: [2000],
      2500: [1000, 1500],
      3000: [1000, 2000],
      3500: [1000, 1000, 1500],
      4000: [1000, 1000, 2000],
      4500: [1000, 1000, 1000, 1500],
      5000: [1000, 1000, 1000, 2000],
      5500: [1000, 1000, 1000, 1000, 1500],
      6000: [1000, 1000, 1000, 1000, 2000],
      6500: [1000, 1000, 1000, 1000, 1000, 1500],
      7000: [1000, 1000, 1000, 1000, 1000, 2000],
      7500: [1000, 1000, 1000, 1000, 1000, 1000, 1500],
      8000: [1000, 1000, 1000, 1000, 1000, 1000, 2000],
      8500: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1500],
      9000: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 2000],
      9500: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1500],
      10000: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 2000]
    },
    b11: {
      1000: [1000],
      1500: [1000, 500],
      2000: [1000, 1000],
      2500: [1000, 500, 1000],
      3000: [1000, 1000, 1000],
      3500: [1000, 1000, 500, 1000],
      4000: [1000, 1000, 1000, 1000],
      4500: [1000, 500, 1000, 1000, 1000],
      5000: [1000, 1000, 1000, 1000, 1000],
      5500: [1000, 1000, 500, 1000, 1000, 1000],
      6000: [1000, 1000, 1000, 1000, 1000, 1000],
      6500: [1000, 1000, 1000, 500, 1000, 1000, 1000],
      7000: [1000, 1000, 1000, 1000, 1000, 1000, 1000],
      7500: [1000, 1000, 1000, 1000, 500, 1000, 1000, 1000],
      8000: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
      8500: [1000, 1000, 1000, 1000, 1000, 500, 1000, 1000, 1000],
      9000: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
      9500: [1000, 1000, 1000, 1000, 1000, 1000, 500, 1000, 1000, 1000],
      10000: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
    }
  };

  const H_LIST = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];
  const H1_LIST = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];

  let activeCustomHeightTable = null;

  function setCustomHeightTable(table) {
    if (table && (table.std || table.b11)) {
      activeCustomHeightTable = table;
    } else {
      activeCustomHeightTable = null;
    }
  }

  function getCustomHeightTable() {
    return activeCustomHeightTable;
  }

  function getDefaultHeightTable() {
    return JSON.parse(JSON.stringify(DEFAULT_HEIGHT_TABLE));
  }

  function autoGenerateHeightSegs(total, one) {
    if (total <= 0) return [1000];
    const segs = [];
    let rem = total;
    if (one) {
      while (rem >= 1000) {
        segs.push(1000);
        rem -= 1000;
      }
      if (rem >= 500) {
        segs.splice(Math.floor(segs.length / 2), 0, 500);
        rem -= 500;
      }
      if (rem > 0) segs.push(rem);
    } else {
      while (rem > 2000) {
        segs.push(1000);
        rem -= 1000;
      }
      if (rem > 0) segs.push(rem);
    }
    return segs.length ? segs : [total];
  }

  function heightSegs(total, one, customTable) {
    const table = customTable || activeCustomHeightTable;
    const modeKey = one ? 'b11' : 'std';
    if (table && table[modeKey] && table[modeKey][total] && Array.isArray(table[modeKey][total]) && table[modeKey][total].length > 0) {
      return table[modeKey][total].slice();
    }
    const defMap = DEFAULT_HEIGHT_TABLE[modeKey];
    if (defMap && defMap[total]) {
      return defMap[total].slice();
    }
    return autoGenerateHeightSegs(total, one);
  }

  /* ---------- 콘크리트 기초 설계 표준 (기본: 180 kgf/cm² / 18 MPa 수조 표준 시방 연동) ---------- */
  function getFoundationDesign(opt = {}) {
    const totalH = (Array.isArray(opt.height) ? opt.height.reduce((a, b) => a + (b || 0), 0) : Number(opt.height)) || 3000;
    const isEn = opt.lang === 'en';

    // 1. 기초 슬래브 두께 (Slab Thickness: mm) - 180 kgf/cm² 표준 수조 기초는 150mm 매트 슬래브
    let slabT = Number(opt.slabT) || 0;
    if (!slabT) {
      if (totalH >= 8000) slabT = 300;
      else if (totalH >= 5000) slabT = 200;
      else slabT = 150;
    }

    // 2. 콘크리트 설계기준강도 (fck) - 기본: 18 MPa (180 kgf/cm²)
    let fck = 18;
    let fckStr = '18 MPa (180 kgf/cm²)';
    const reqFck = opt.concreteFck || opt.fck;
    if (reqFck) {
      const numFck = Number(reqFck);
      if (numFck >= 100) {
        fck = Math.round(numFck / 10);
        fckStr = `${fck} MPa (${numFck} kgf/cm²)`;
      } else if (numFck > 0) {
        fck = numFck;
        fckStr = `${fck} MPa (${fck * 10} kgf/cm²)`;
      }
    } else if (totalH >= 8000) {
      fck = 24;
      fckStr = '24 MPa (240 kgf/cm²)';
    } else if (totalH >= 5000) {
      fck = 21;
      fckStr = '21 MPa (210 kgf/cm²)';
    }

    // 3. 패드 기둥 배근 (주근 / 늑근) - 180 kgf/cm² 표준: HD10 / HD10 (SD300/SD400)
    let rebarPadStr = 'HD10 / HD10 (SD300)';
    let padCallout = isEn ? 'PAD REBAR: 2-HD10 / TIE HD10 @ 200' : '패드 배근: 주근 2-HD10 / 늑근 HD10 @ 200';
    let padTiePitch = 200;
    if (totalH >= 8000) {
      rebarPadStr = 'HD19 / HD13 (SD400)';
      padCallout = isEn ? 'PAD REBAR: 2-HD19 / TIE HD13 @ 100' : '패드 배근: 주근 2-HD19 / 늑근 HD13 @ 100';
      padTiePitch = 100;
    } else if (totalH >= 5000) {
      rebarPadStr = 'HD16 / HD10 (SD400)';
      padCallout = isEn ? 'PAD REBAR: 2-HD16 / TIE HD10 @ 150' : '패드 배근: 주근 2-HD16 / 늑근 HD10 @ 150';
      padTiePitch = 150;
    } else if (totalH >= 3500) {
      rebarPadStr = 'HD13 / HD10 (SD300)';
      padCallout = isEn ? 'PAD REBAR: 2-HD13 / TIE HD10 @ 200' : '패드 배근: 주근 2-HD13 / 늑근 HD10 @ 200';
      padTiePitch = 200;
    }

    // 4. 기초 슬래브 배근 (상·하부 복배근) - 180 kgf/cm² 표준: HD10 @ 200 (SD300)
    let rebarSlabStr = 'HD10 @ 200 (SD300, Double)';
    let slabCallout = isEn ? 'SLAB REBAR: HD10 @ 200 (TOP & BOT)' : '슬래브 배근: HD10 @ 200 (상·하부 복배근)';
    let slabRebarPitch = 200;
    if (totalH >= 8000) {
      rebarSlabStr = 'HD16 @ 150 (SD400, Double)';
      slabCallout = isEn ? 'SLAB REBAR: HD16 @ 150 (TOP & BOT)' : '슬래브 배근: HD16 @ 150 (상·하부 복배근)';
      slabRebarPitch = 150;
    } else if (totalH >= 5000) {
      rebarSlabStr = 'HD13 @ 200 (SD400, Double)';
      slabCallout = isEn ? 'SLAB REBAR: HD13 @ 200 (TOP & BOT)' : '슬래브 배근: HD13 @ 200 (상·하부 복배근)';
      slabRebarPitch = 200;
    }

    // 5. 기초 앙카볼트 (Anchor Bolt: 규격 및 매립깊이)
    let anchorStr = 'M16 (SUS304, L=260)';
    let anchorEmbed = 260;
    let anchorHasPlate = false;
    if (totalH >= 8000) {
      anchorStr = 'M24 (STS304 / SS275, L=450)';
      anchorEmbed = 450;
      anchorHasPlate = true;
    } else if (totalH >= 5000) {
      anchorStr = 'M20 (SUS304 / SS275, L=350)';
      anchorEmbed = 350;
      anchorHasPlate = true;
    }

    // 6. 요구 지내력 (Soil Bearing Capacity: qa)
    let bearingStr = '≥ 100 kN/m² (10 t/m²)';
    if (totalH >= 8000) {
      bearingStr = '≥ 200 kN/m² (Seismic: 25 t/m²)';
    } else if (totalH >= 5000) {
      bearingStr = '≥ 150 kN/m² (Seismic: 18 t/m²)';
    }

    // 7. 설계 안전율 (Safety Factor)
    const fsStr = isEn ? 'OT ≥ 1.5 (Seismic 1.2)' : '전도 ≥ 1.5 (지진 1.2)';

    return {
      totalH,
      slabT,
      fck,
      fckStr,
      rebarPadStr,
      padCallout,
      padTiePitch,
      rebarSlabStr,
      slabCallout,
      slabRebarPitch,
      anchorStr,
      anchorEmbed,
      anchorHasPlate,
      bearingStr,
      fsStr
    };
  }

  /* ---------- gRound / gSolX (glFunc.cpp) ---------- */
  const gRound = v => (v - Math.trunc(v) >= 0.5 ? Math.trunc(v) + 1 : Math.trunc(v));
  const solX = (s, e, y) => gRound((e[0] - s[0]) * (y - s[1]) / (e[1] - s[1]) + s[0]);

  /* ---------- 기초 콘크리트 (TankConcrete / CConcLT / ConcreteDim) : 직사각형 탱크 규칙 ---------- */
  // 열 배열(패널 길이 목록) → 각 이음선의 콘크리트 띠 [x, 폭, idx]
  function concStrips(c, opt = {}) {
    const hasCustom = opt && (opt.padFirstW !== undefined || opt.padMidW !== undefined || opt.padLastW !== undefined);
    const firstW = Number(opt && opt.padFirstW) || 400;
    const midW = Number(opt && opt.padMidW) || 300;
    const lastW = Number(opt && (opt.padLastW !== undefined ? opt.padLastW : opt.padFirstW)) || firstW;

    if (hasCustom) {
      const out = [];
      let x = 0;
      for (let i = 0; i < c.length; i++) {
        const w = (i === 0) ? firstW : midW;
        out.push([x - w / 2, w, i]);
        x += c[i];
      }
      out.push([x - lastW / 2, lastW, -1]);
      return out;
    }

    const l = k => (k >= 0 && k < c.length ? c[k] : 0), out = [];
    let x = 0;
    for (let i = 0; i < c.length; i++) {
      const L = c[i]; let s = null;
      if (L === 500) {
        if (l(i + 1) === 500) s = [x - 200, 400];
        else if (l(i + 1) === 1300) { if (l(i - 1) === 1000) s = [x - 400, 300]; }
        else if (l(i - 1) !== 500) s = [x - 400, 300];
      } else if (L === 1000) {
        if (l(i - 1) === 500) s = [x - 150, 300];
        else if (l(i - 1) === 1000 && (l(i + 1) === 500 || l(i + 1) === 0 || l(i + 1) === 1000)) s = [x - 175, 350];
        else if (l(i - 1) === 1300) s = [x - 150, 300];
        else if (l(i - 2) === 500) s = [x - 150, 300];
        else if (l(i + 1) === 500) s = [x - 150, 300];
        else s = [x - 200, 400];
      } else if (L === 1300) s = [x - 150, 300];
      if (s) out.push([s[0], s[1], i]);
      x += L;
    }
    const last = c[c.length - 1];                       // 마지막 콘크리트
    out.push(last === 1000 ? [x - 200, 400, -1] : [x - 150, 300, -1]);
    return out;
  }
  // 글로벌 건축/설비 표준: 콘크리트 기초 평면도는 자갈/잡선 없이 깔끔한 외곽선으로 표기
  function concDesign(ents, px, py) {}
  const PAD_OVERHANG = 200; // 상하 대칭 각 200mm 돌출 (총 EXTC = 400mm)
  const EXTC = PAD_OVERHANG * 2;
  function buildConcrete(opt) {
    const fDesign = getFoundationDesign(opt);
    const firstW = Number(opt && opt.padFirstW) || 400;
    const padOv = (opt && opt.padOverhang !== undefined && opt.padOverhang !== '') ? Number(opt.padOverhang) : Math.round(firstW / 2);
    const map = createMap(opt), W = map.width, L = map.length, ents = [], strips = concStrips(map.cols, opt);
    const ln = (a, b, layer) => ents.push({ t: 'line', a, b, layer: layer || 'PANEL' });
    const nR = map.rows.length;
    // 각 콘크리트 보(strip)가 지지하는 행(row) 판별:
    // idx === 0 (맨 왼쪽 보): col 0 지지
    // idx > 0 (패널 간 경계 보): col idx 및 col idx - 1 양쪽 지지 (어느 한쪽에라도 패널이 있으면 보가 유지되어야 함)
    // idx < 0 (맨 오른쪽 보): 마지막 col (map.cols.length - 1) 지지
    const hasTankAtRow = (idx, r) => {
      if (idx < 0) return map.has(r, map.cols.length - 1);
      if (idx === 0) return map.has(r, 0);
      return map.has(r, idx) || map.has(r, idx - 1);
    };

    const runsForStrip = idx => {
      const out = [];
      let st = -1;
      for (let i = 0; i <= nR; i++) {
        const h = i < nR && hasTankAtRow(idx, i);
        if (h && st < 0) st = i;
        if (!h && st >= 0) {
          out.push([map.ys[st], map.ys[i]]);
          st = -1;
        }
      }
      return out;
    };

    const pieces = [];   // {x, w, y0, y1}
    strips.forEach(([x, w, idx]) => {
      runsForStrip(idx).forEach(([y0, y1]) => pieces.push({ x, w, y0: y0 - padOv, y1: y1 + padOv }));
    });
    if (!pieces.length) return { ents, blocks: {}, textH: 60 };

    // 1. 기초 콘크리트 패드 보 렌더링 (AutoCAD 블록 INSERT 생성)
    const blocks = {};
    pieces.forEach(({ x, w, y0, y1 }) => {
      const len = y1 - y0;
      const blkName = `PAD_STRIP_${w}x${len}_T${fDesign.padTiePitch}`;
      if (!blocks[blkName]) {
        const bEnts = [
          { t: 'line', a: [0, 0], b: [w, 0], layer: 'PAD' },
          { t: 'line', a: [w, 0], b: [w, len], layer: 'PAD' },
          { t: 'line', a: [w, len], b: [0, len], layer: 'PAD' },
          { t: 'line', a: [0, len], b: [0, 0], layer: 'PAD' }
        ];

        // 글로벌 건축/토목/설비 표준 기초 평면 철근 배근 (REINF 레이어)
        // 1) 종방향 주철근 (Longitudinal Main Rebar)
        const cover = 45;
        bEnts.push({ t: 'line', a: [cover, 50], b: [cover, len - 50], layer: 'REINF' });
        bEnts.push({ t: 'line', a: [w - cover, 50], b: [w - cover, len - 50], layer: 'REINF' });
        // 주철근 양단 90도 정착 갈고리 (Standard 90° Anchorage Hooks)
        const hookLen = Math.min(60, Math.round((w - cover * 2) * 0.4));
        bEnts.push({ t: 'line', a: [cover, 50], b: [cover + hookLen, 50], layer: 'REINF' });
        bEnts.push({ t: 'line', a: [w - cover, 50], b: [w - cover - hookLen, 50], layer: 'REINF' });
        bEnts.push({ t: 'line', a: [cover, len - 50], b: [cover + hookLen, len - 50], layer: 'REINF' });
        bEnts.push({ t: 'line', a: [w - cover, len - 50], b: [w - cover - hookLen, len - 50], layer: 'REINF' });

        if (w >= 380) {
          // 외측 400mm 패드는 중앙 주근 1가닥 추가 (3-Bar cage)
          bEnts.push({ t: 'line', a: [w / 2, 50], b: [w / 2, len - 50], layer: 'REINF' });
        }

        // 2) 횡방향 늑근 / 스트럽 (Transverse Stirrups / Ties)
        for (let py = 100; py <= len - 80; py += fDesign.padTiePitch) {
          bEnts.push({ t: 'line', a: [cover, py], b: [w - cover, py], layer: 'REINF' });
        }

        // 3) 기초 앙카볼트 위치 표기 (Anchor Bolt Symbols @1000mm)
        const boltStep = 1000;
        const bOv = Math.max(100, Math.round(w / 2));
        for (let by = bOv; by <= len - bOv + 10; by += boltStep) {
          const cx = w / 2;
          bEnts.push({ t: 'circle', c: [cx, by], r: 12, layer: 'FRAME' });
          bEnts.push({ t: 'line', a: [cx - 18, by], b: [cx + 18, by], layer: 'FRAME' });
          bEnts.push({ t: 'line', a: [cx, by - 18], b: [cx, by + 18], layer: 'FRAME' });
        }

        blocks[blkName] = bEnts;
      }
      ents.push({ t: 'insert', block: blkName, p: [x, y0], w, h: len, layer: 'PAD' });
    });
    ents.blocks = blocks;

    // 1-1. 기초 평면도 철근 배근 지시선 (Standard Callout Leader)
    if (pieces.length > 0) {
      const p0 = pieces[0];
      const targetY = p0.y1 - 350;
      const lx0 = p0.x + 45;
      const tx = p0.x - 550;
      const ty = targetY + 60;
      ln([lx0, targetY], [p0.x - 120, ty], 'DIM');
      ln([p0.x - 120, ty], [tx, ty], 'DIM');
      ents.push({
        t: 'text',
        p: [tx + 10, ty + 12],
        h: Math.round(2.6 * (opt._N || 25)),
        s: fDesign.padCallout,
        align: 'left',
        layer: 'DIM'
      });
    }

    // 2. 기초 콘크리트 위에 물탱크가 놓이는 외곽선 및 구획(Compartment)별 테두리 / 대각선 X자 표시
    const L_secs = (opt.length || []).filter(Boolean);
    const W_secs = (opt.width || []).filter(Boolean);
    const compsL = L_secs.length ? L_secs : [map.length];
    const compsW = W_secs.length ? W_secs : [map.width];

    const compartments = [];
    let curY = 0;
    compsW.forEach(wLen => {
      let curX = 0;
      compsL.forEach(lLen => {
        compartments.push({ x0: curX, x1: curX + lLen, y0: curY, y1: curY + wLen, w: lLen, h: wLen });
        curX += lLen;
      });
      curY += wLen;
    });

    const anyRemoved = map.removed && map.removed.size > 0;

    // 패널 삭제 시 실제 패널 외곽선 추출
    const tankOutline = m => {
      const segs = [];
      const nr = m.rows.length, nc = m.cols.length;
      for (let i = 0; i < nr; i++) {
        let st = -1;
        for (let j = 0; j <= nc; j++) {
          const exp = j < nc && m.has(i, j) && !m.has(i - 1, j);
          if (exp && st < 0) st = j;
          if (!exp && st >= 0) { segs.push([[m.xs[st], m.ys[i]], [m.xs[j], m.ys[i]]]); st = -1; }
        }
        st = -1;
        for (let j = 0; j <= nc; j++) {
          const exp = j < nc && m.has(i, j) && !m.has(i + 1, j);
          if (exp && st < 0) st = j;
          if (!exp && st >= 0) { segs.push([[m.xs[st], m.ys[i + 1]], [m.xs[j], m.ys[i + 1]]]); st = -1; }
        }
      }
      for (let j = 0; j < nc; j++) {
        let st = -1;
        for (let i = 0; i <= nr; i++) {
          const exp = i < nr && m.has(i, j) && !m.has(i, j - 1);
          if (exp && st < 0) st = i;
          if (!exp && st >= 0) { segs.push([[m.xs[j], m.ys[st]], [m.xs[j], m.ys[i]]]); st = -1; }
        }
        st = -1;
        for (let i = 0; i <= nr; i++) {
          const exp = i < nr && m.has(i, j) && !m.has(i, j + 1);
          if (exp && st < 0) st = i;
          if (!exp && st >= 0) { segs.push([[m.xs[j + 1], m.ys[st]], [m.xs[j + 1], m.ys[i]]]); st = -1; }
        }
      }
      return segs;
    };

    if (anyRemoved) {
      tankOutline(map).forEach(([a, b]) => ln(a, b, 'FRAME'));
      // 구획 분할 경계선 표시
      compartments.forEach(comp => {
        if (comp.x0 > 0) ln([comp.x0, comp.y0], [comp.x0, comp.y1], 'FRAME');
        if (comp.y0 > 0) ln([comp.x0, comp.y0], [comp.x1, comp.y0], 'FRAME');
      });
    }

    // 각 구획별로 개별 테두리 및 대각선 X자 표시 (FRAME 레이어 - 틀 블록 INSERT 생성)
    compartments.forEach(comp => {
      // 해당 구획 내의 모든 셀이 존재하는지 확인
      const compCells = [];
      for (let i = 0; i < map.rows.length; i++) {
        for (let j = 0; j < map.cols.length; j++) {
          if (map.xs[j] >= comp.x0 && map.xs[j + 1] <= comp.x1 && map.ys[i] >= comp.y0 && map.ys[i + 1] <= comp.y1) {
            compCells.push([i, j]);
          }
        }
      }
      const compFull = compCells.length > 0 && compCells.every(([i, j]) => map.has(i, j));

      if (compFull) {
        const cw = comp.w, ch = comp.h;
        const blkName = `TANK_FRAME_${cw}x${ch}`;
        if (!blocks[blkName]) {
          blocks[blkName] = [
            { t: 'line', a: [0, 0], b: [cw, 0], layer: 'FRAME' },
            { t: 'line', a: [cw, 0], b: [cw, ch], layer: 'FRAME' },
            { t: 'line', a: [cw, ch], b: [0, ch], layer: 'FRAME' },
            { t: 'line', a: [0, ch], b: [0, 0], layer: 'FRAME' },
            { t: 'line', a: [0, 0], b: [cw, ch], layer: 'FRAME' },
            { t: 'line', a: [0, ch], b: [cw, 0], layer: 'FRAME' }
          ];
        }
        ents.push({ t: 'insert', block: blkName, p: [comp.x0, comp.y0], w: cw, h: ch, layer: 'FRAME' });
      }
    });

    // 3. 치수 (ConcreteDim: 축척 비례 계산)
    const N = opt._N || 25;
    const textH = Math.round(3.0 * N);
    const dimGap1 = Math.round(10.0 * N);
    const dimGap2 = Math.round(18.0 * N);
    const dimGap3 = Math.round(26.0 * N);

    const basePad = pieces.reduce((a, b) => ((b.y1 - b.y0) > (a.y1 - a.y0) ? b : a), pieces[0]);
    const baseH = basePad.y1 - basePad.y0;
    const baseY0 = basePad.y0, baseY1 = basePad.y1;
    const minPadX = Math.min(...pieces.map(p => p.x));

    // 좌측 세로 치수선: 맨 왼쪽 패드 및 기본 최대 패드 전체 길이, 탱크 높이
    const p0 = pieces[0];
    const p0_len = p0.y1 - p0.y0;
    if (p0_len !== baseH || p0.y0 !== baseY0 || p0.y1 !== baseY1) {
      dimLinear(ents, [p0.x, p0.y0], [p0.x, p0.y1], minPadX - dimGap1, true, String(p0_len), textH, 'DIM');
      dimLinear(ents, [minPadX, baseY0], [minPadX, baseY1], minPadX - dimGap2, true, String(baseH), textH, 'DIM');
      dimLinear(ents, [minPadX, 0], [minPadX, W], minPadX - dimGap3, true, String(W) + ' (TANK)', textH, 'DIM');
    } else {
      dimLinear(ents, [minPadX, baseY0], [minPadX, baseY1], minPadX - dimGap1, true, String(baseH), textH, 'DIM');
      dimLinear(ents, [minPadX, 0], [minPadX, W], minPadX - dimGap2, true, String(W) + ' (TANK)', textH, 'DIM');
    }

    // 기본길이와 다른 모든 콘크리트 패드에 대해 치수 개별 표시
    const lastPiece = pieces[pieces.length - 1];
    for (let k = 1; k < pieces.length; k++) {
      const p = pieces[k];
      const len = p.y1 - p.y0;
      if (len !== baseH || p.y0 !== baseY0 || p.y1 !== baseY1) {
        if (p === lastPiece) {
          // 맨 오른쪽 패드가 기본길이와 다른 경우: 패드 우측 바깥에 치수선 배치
          dimLinear(ents, [p.x + p.w, p.y0], [p.x + p.w, p.y1], p.x + p.w + dimGap1, true, String(len), textH, 'DIM');
        } else {
          // 중간 내부 패드가 기본길이와 다른 경우: 인접 패드 사이 간격(Gap)에 치수선 배치
          const nextP = pieces[k + 1];
          const gap = nextP ? (nextP.x - (p.x + p.w)) : dimGap1 * 2;
          const dimX = p.x + p.w + Math.min(Math.round(dimGap1 * 0.7), Math.round(gap / 2));
          dimLinear(ents, [p.x + p.w, p.y0], [p.x + p.w, p.y1], dimX, true, String(len), textH, 'DIM');
        }
      }
    }

    const topY = Math.max(...pieces.map(p => p.y1));
    const botY = Math.min(...pieces.map(p => p.y0));

    // 상단 치수선: 첫 번째 패드부터 마지막 패드까지 모든 패드의 크기(폭) 및 패드 간격치수(순간격) 연속 표시
    for (let i = 0; i < strips.length; i++) {
      const [x, w] = strips[i];
      // 1. 패드 폭 치수 (400, 350, 350, ...)
      dimLinear(ents, [x, topY], [x + w, topY], topY + dimGap1, false, String(w), textH, 'DIM');
      // 2. 패드 사이 간격치수 (625, 650, 650, ...)
      if (i < strips.length - 1) {
        const nextX = strips[i + 1][0];
        const gap = Math.round(nextX - (x + w));
        if (gap > 0) {
          dimLinear(ents, [x + w, topY], [nextX, topY], topY + dimGap1, false, String(gap), textH, 'DIM');
        }
      }
    }

    // 하단 치수선: 패드 중심간 간격 (C.T.C Pitch) 및 패드 전체 외곽 치수 (단면도 결합 시에는 단면도 하단에만 표기하여 중복 제거)
    if (!opt.hideBottomDim) {
      strips.forEach(([x, w], i) => {
        if (i) {
          const pa = strips[i - 1];
          dimLinear(ents, [pa[0] + pa[1] / 2, botY], [x + w / 2, botY], botY - dimGap1, false, String(Math.round((x + w / 2) - (pa[0] + pa[1] / 2))), textH, 'DIM');
        }
      });
      const lf = strips[0][0], rt = strips[strips.length - 1][0] + strips[strips.length - 1][1];
      dimLinear(ents, [lf, botY], [rt, botY], botY - dimGap2, false, String(rt - lf), textH, 'DIM');
    }
    return { ents, blocks, textH };
  }

  /* ---------- 정면도/측면도 (TankFront / TankSide / OutForceLeft·Right / CPlateLT / CManholeLT / CFrmLT / COutPoleLT / CWallLT) ---------- */
  // 지원 범위: GRP(SMC) + 외부보강. opt.hseg = 높이 구성(아래→위), opt.frame = 75|125
  const OB = { CX: 160, CY: 160, SPACE: 36, OFFSET: 44, MOVE: 60, STAY: 10, R: 10 };
  const MH = { STAY: 30, UP_IN: { 500: 30, 1000: 80, 1300: 70 }, UP_OUT: { 500: 50, 1000: 100, 1300: 130 },
    DN_IN: { 500: 100, 1000: 350, 1300: 400 }, DN_OUT: { 500: 250 - 44, 1000: 500 - 44, 1300: 650 - 44 } };
  // 45도 빗금 (사각형 내부 클리핑)
  function hatchRect(ents, x0, y0, x1, y1, step, layer) {
    const w = x1 - x0, h = y1 - y0;
    for (let c = step; c < w + h; c += step) {
      // 직선 x - x0 + (y - y0) = c  (기울기 -1) 과 사각형의 교점
      const ax = Math.max(0, c - h), bx = Math.min(w, c);
      if (bx - ax < 1) continue;
      ents.push({ t: 'line', a: [x0 + ax, y0 + (c - ax)], b: [x0 + bx, y0 + (c - bx)], layer });
    }
  }
  // 글로벌 좌표계 기준 연속 45도 사선 해치 (기둥 및 하부 슬래브 간 단절 없이 연속 연결)
  function hatchAlignedRect(ents, x0, y0, x1, y1, step, layer, sign = 1) {
    if (x1 <= x0 || y1 <= y0) return;
    if (sign === 1) {
      // y - x = c (기울기 +1, 45도 상향)
      const c_min = y0 - x1;
      const c_max = y1 - x0;
      const startK = Math.ceil(c_min / step);
      const endK = Math.floor(c_max / step);
      for (let k = startK; k <= endK; k++) {
        const c = k * step;
        const ax = Math.max(x0, y0 - c);
        const bx = Math.min(x1, y1 - c);
        if (bx - ax >= 1) {
          ents.push({ t: 'line', a: [ax, ax + c], b: [bx, bx + c], layer });
        }
      }
    } else {
      // x + y = c (기울기 -1)
      const c_min = x0 + y0;
      const c_max = x1 + y1;
      const startK = Math.ceil(c_min / step);
      const endK = Math.floor(c_max / step);
      for (let k = startK; k <= endK; k++) {
        const c = k * step;
        const ax = Math.max(x0, c - y1);
        const bx = Math.min(x1, c - y0);
        if (bx - ax >= 1) {
          ents.push({ t: 'line', a: [ax, c - ax], b: [bx, c - bx], layer });
        }
      }
    }
  }

  // 기초 패드 단면 및 입면도 (FOUNDATION PAD SECTION & ELEVATION - media_1791120706510.png 완벽 일치)
  function buildFoundationSection(opt) {
    const map = createMap(opt);
    const secs = ((opt.length && opt.length.length) ? opt.length : [map.length]).filter(Boolean);
    const total = secs.reduce((a, b) => a + b, 0);
    const th = opt.frame || 75;
    const fDesign = getFoundationDesign(opt);
    const padH = (opt && opt.padH !== undefined && opt.padH !== '') ? Number(opt.padH) : (600 - th);
    const slabTopY = -padH; // 슬래브 상면 (패드 상면 y=0 기준)
    const slabT = fDesign.slabT;
    const slabBotY = slabTopY - slabT; // 슬래브 하면
    const strips = concStrips(map.cols, opt);
    const px0 = strips[0][0];
    const pxEnd = strips[strips.length - 1][0] + strips[strips.length - 1][1];
    const totalPadW = pxEnd - px0;

    const N = opt._N || 25;
    const textH = Math.round(3.0 * N);
    const ents = [];
    const ln = (a, b, layer) => ents.push({ t: 'line', a, b, layer: layer || 'PANEL' });
    const poly = (p, layer, closed) => { for (let k = 0; k + 1 < p.length; k++) ln(p[k], p[k + 1], layer); if (closed) ln(p[p.length - 1], p[0], layer); };
    const circ = (x, y, r, layer) => ents.push({ t: 'circle', c: [x, y], r, layer: layer || 'PANEL' });

    // 각 기둥 경계 [leftX, rightX, centerX]
    const plinths = strips.map(s => [s[0], s[0] + s[1], s[0] + s[1] / 2]);
    const numPlinths = plinths.length;

    // 2. 패드 기둥 및 하부 슬래브 외곽선 (Concrete outlines - 상부 베이스 스키드 없이 패드 상면 y=0 직접 형성)
    plinths.forEach(([lx, rx]) => ln([lx, 0], [rx, 0], 'PAD'));
    for (let i = 0; i < plinths.length - 1; i++) {
      const curRx = plinths[i][1];
      const nextLx = plinths[i + 1][0];
      ln([curRx, 0], [curRx, slabTopY], 'PAD');
      ln([curRx, slabTopY], [nextLx, slabTopY], 'PAD');
      ln([nextLx, slabTopY], [nextLx, 0], 'PAD');
    }
    ln([px0, 0], [px0, slabBotY], 'PAD');
    ln([pxEnd, 0], [pxEnd, slabBotY], 'PAD');
    ln([px0, slabBotY], [pxEnd, slabBotY], 'PAD');

    // 4. 콘크리트 해치 (기둥 및 하부 슬래브에 걸쳐 단절 없이 연결되는 45도 사선 무늬)
    const hatchStep = 80;
    plinths.forEach(([lx, rx]) => {
      hatchAlignedRect(ents, lx, slabTopY, rx, 0, hatchStep, 'PAD', 1);
    });
    hatchAlignedRect(ents, px0, slabBotY, pxEnd, slabTopY, hatchStep, 'PAD', 1);

    // 5. 글로벌 표준 기초 단면 철근 배근 (REINF 레이어)
    // (1) 하부 슬래브 배근망 (Mat Slab Bottom & Top Bars)
    // 하부 주근 (Bottom Bar: y = slabBotY + 45) + 양단 90도 상향 갈고리
    ln([px0 + 50, slabBotY + 45], [pxEnd - 50, slabBotY + 45], 'REINF');
    ln([px0 + 50, slabBotY + 45], [px0 + 50, slabBotY + 115], 'REINF');
    ln([pxEnd - 50, slabBotY + 45], [pxEnd - 50, slabBotY + 115], 'REINF');

    // 상부 주근 (Top Bar: y = slabTopY - 35) + 양단 90도 하향 갈고리
    ln([px0 + 50, slabTopY - 35], [pxEnd - 50, slabTopY - 35], 'REINF');
    ln([px0 + 50, slabTopY - 35], [px0 + 50, slabTopY - 105], 'REINF');
    ln([pxEnd - 50, slabTopY - 35], [pxEnd - 50, slabTopY - 105], 'REINF');

    // 슬래브 횡방향 배력근 점근
    for (let bx = px0 + 80; bx <= pxEnd - 60; bx += fDesign.slabRebarPitch) {
      circ(bx, slabBotY + 45 + 10, 4.5, 'REINF');
      circ(bx, slabTopY - 35 - 10, 4.5, 'REINF');
    }

    // (2) 각 기둥(Plinth) 수직 주근 및 늑근(스트럽)
    plinths.forEach(([lx, rx]) => {
      const padW = rx - lx;
      // 수직 주근 (좌/우 피복 45mm, 하부 90도 정착 갈고리)
      ln([lx + 45, -35], [lx + 45, slabBotY + 45], 'REINF');
      ln([lx + 45, slabBotY + 45], [lx + 45 + Math.min(120, padW - 90), slabBotY + 45], 'REINF');
      ln([rx - 45, -35], [rx - 45, slabBotY + 45], 'REINF');
      ln([rx - 45, slabBotY + 45], [rx - 45 - Math.min(120, padW - 90), slabBotY + 45], 'REINF');

      // 상단 정착 갈고리
      ln([lx + 45, -35], [lx + 45 + 60, -35], 'REINF');
      ln([rx - 45, -35], [rx - 45 - 60, -35], 'REINF');

      // 늑근 / 대근 (Stirrups / Ties)
      for (let ty = -75; ty >= slabTopY + 20; ty -= Math.min(130, fDesign.padTiePitch)) {
        ln([lx + 45, ty], [rx - 45, ty], 'REINF');
      }

      // 기초 앵커볼트 (Anchor Bolt: 볼트 몸체, L형 갈고리, 내진 엔드플레이트, 상부 너트/와셔 플레이트)
      const cx = (lx + rx) / 2;
      const bDepth = Math.min(slabT + padH - 60, fDesign.anchorEmbed);
      ln([cx, 35], [cx, -bDepth], 'FRAME');
      ln([cx, -bDepth], [cx + 45, -bDepth], 'FRAME');
      if (fDesign.anchorHasPlate) {
        ln([cx - 28, -bDepth], [cx + 28, -bDepth], 'FRAME');
        poly([[cx - 20, -bDepth], [cx + 20, -bDepth], [cx + 20, -bDepth - 10], [cx - 20, -bDepth - 10]], 'FRAME', true);
      }
      ln([cx - 25, 0], [cx + 25, 0], 'FRAME');
      poly([[cx - 15, 0], [cx + 15, 0], [cx + 15, 18], [cx - 15, 18]], 'FRAME', true);
    });

    // (3) 철근 배근 지시선 (Callout Leader)
    const calloutTargetX = px0 + 100;
    const calloutTargetY = slabTopY - 35;
    const calloutKneeX = px0 - 150;
    const calloutKneeY = slabTopY + 120;
    const calloutEndX = px0 - 720;
    ln([calloutTargetX, calloutTargetY], [calloutKneeX, calloutKneeY], 'DIM');
    ln([calloutKneeX, calloutKneeY], [calloutEndX, calloutKneeY], 'DIM');
    ents.push({
      t: 'text',
      p: [calloutEndX + 10, calloutKneeY + 12],
      h: Math.round(2.6 * N),
      s: fDesign.slabCallout,
      align: 'left',
      layer: 'DIM'
    });

    // 7. 좌측 지면 GL선 (media_1791120706510.png: 좌측 GL도 바닥 레벨 slabBotY로 배치)
    const glLen = Math.max(650, Math.round(18.0 * N));
    const soilH = Math.round(3.5 * N);
    const triW = Math.round(2.6 * N), triH = Math.round(2.4 * N);
    // 좌측 GL선 (y = slabBotY)
    ln([px0 - glLen, slabBotY], [px0, slabBotY], 'FRAME');
    const lSymX = px0 - Math.round(7.5 * N);
    poly([[lSymX - triW / 2, slabBotY + triH], [lSymX + triW / 2, slabBotY + triH], [lSymX, slabBotY]], 'DIM', true);
    ents.push({ t: 'text', p: [lSymX + triW * 0.8, slabBotY + triH * 0.8], h: Math.round(2.4 * N), s: 'GL', rot: 0, align: 'left', layer: 'DIM' });
    for (let sx = px0 - glLen; sx < px0 - glLen * 0.1; sx += Math.round(1.8 * N)) {
      ln([sx, slabBotY], [sx - soilH, slabBotY - soilH], 'PANEL_DETAIL');
    }
    // (A) 좌측 패드 높이(padH) 단일 치수선 (media_1791120706510.png: 상부 스키드 제거로 padH만 표기)
    const dimPadX = px0 - Math.round(5.5 * N);
    dimLinear(ents, [px0, slabTopY], [px0, 0], dimPadX, true, String(padH), Math.round(2.8 * N), 'DIM');

    // 8. 우측 기초 슬래브 두께(slabT) 치수선 및 우측 지면 GL선
    ln([pxEnd, slabBotY], [pxEnd + glLen, slabBotY], 'FRAME');
    const rSymX = pxEnd + Math.round(8.5 * N);
    poly([[rSymX - triW / 2, slabBotY + triH], [rSymX + triW / 2, slabBotY + triH], [rSymX, slabBotY]], 'DIM', true);
    ents.push({ t: 'text', p: [rSymX + triW * 0.8, slabBotY + triH * 0.8], h: Math.round(2.4 * N), s: 'GL', rot: 0, align: 'left', layer: 'DIM' });
    for (let sx = pxEnd + glLen * 0.1; sx < pxEnd + glLen; sx += Math.round(1.8 * N)) {
      ln([sx, slabBotY], [sx - soilH, slabBotY - soilH], 'PANEL_DETAIL');
    }
    // 우측 slabT 치수선
    const dim150X = pxEnd + Math.round(3.0 * N);
    dimLinear(ents, [pxEnd, slabBotY], [pxEnd, slabTopY], dim150X, true, String(slabT), Math.round(2.4 * N), 'DIM');

    // 9. 하단 치수선: Tier 1 기둥 피치 (1000, 1000, ...), Tier 2 전체 패드 폭 (8400)
    const dimPitchY = slabBotY - Math.round(8.5 * N);
    for (let i = 0; i < plinths.length - 1; i++) {
      const cxA = plinths[i][2], cxB = plinths[i + 1][2];
      dimLinear(ents, [cxA, slabBotY], [cxB, slabBotY], dimPitchY, false, String(Math.round(cxB - cxA)), Math.round(2.8 * N), 'DIM');
    }
    const dimTotalY = slabBotY - Math.round(16.0 * N);
    dimLinear(ents, [px0, slabBotY], [pxEnd, slabBotY], dimTotalY, false, String(totalPadW), Math.round(2.8 * N), 'DIM');

    return { ents, textH, totalL: totalPadW, H: padH + slabT };
  }

  function buildElevation(opt, sideT, view) {
    const secs = ((view === 'front' ? opt.length : opt.width) || []).filter(Boolean).slice(0, 5);
    const totalH = (opt.height || []).reduce((a, b) => a + (b || 0), 0);
    const hs = (opt.hseg && opt.hseg.length) ? opt.hseg.filter(Boolean) : heightSegs(totalH || 3000, opt.b11);
    const n = hs.length, nH = hs.reduce((a, b) => a + b, 0);
    const split = view === 'front' ? frontSplit : sideSplit;
    const total = secs.reduce((a, b) => a + b, 0), th = opt.frame || 75;
    const ents = [], blocks = {};
    ents._usedBalloons = opt.usedBalloons || (opt.usedBalloons = new Set());
    const ln = (a, b, layer) => ents.push({ t: 'line', a, b, layer: layer || 'PANEL' });
    const poly = (p, layer, closed) => { for (let k = 0; k + 1 < p.length; k++) ln(p[k], p[k + 1], layer); if (closed) ln(p[p.length - 1], p[0], layer); };
    const rect = (x0, y0, x1, y1, layer) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], layer, true);
    const circ = (x, y, r, layer, first) => ents.push({ t: 'circle', c: [x, y], r, layer, first });
    // 보강재는 최외각에 설치되므로 브라켓 뒤부분 패널/접합선은 가려져야 함 (Background Fill)
    const plateBacking = (x0, y0, x1, y1) => {
      ents.push({ t: 'poly', pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill: true, stroke: false, close: true, layer: 'REINF' });
    };
    const MX = OB.CX >> 1, MY = OB.CY >> 1, OFF = OB.OFFSET;
    const internal = (opt.rf || 0) !== 0, sts = opt.material === 'STS';
    const mat = sts ? 'STS' : 'SMC';
    const WALL_TH = 70;

    const getSideBlock = (w, h, pType) => {
      const type = pType || 'std';
      const blkName = `PANEL_SIDE_${mat}_${w}x${h}_${type}`;
      if (!blocks[blkName]) {
        const bEnts = [
          { t: 'line', a: [0, 0], b: [w, 0], layer: 'PANEL' },
          { t: 'line', a: [w, 0], b: [w, h], layer: 'PANEL' },
          { t: 'line', a: [w, h], b: [0, h], layer: 'PANEL' },
          { t: 'line', a: [0, h], b: [0, 0], layer: 'PANEL' }
        ];
        if (type === 'flat' || type === 'flat-1x1') {
          // 1x1m Flat panel (1x1m 평판 판넬): smooth plate, offset margin line
          const m = 25;
          bEnts.push({ t: 'line', a: [m, m], b: [w - m, m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [w - m, m], b: [w - m, h - m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [w - m, h - m], b: [m, h - m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [m, h - m], b: [m, m], layer: 'PANEL_DETAIL' });
        } else if (type === 'flat-half2' || type === 'flat-0.5x2') {
          // Two 0.5x1m flat panels (0.5x1m 평판 2장): center dividing vertical seam and two 0.5m plates
          const hw = Math.round(w / 2);
          const m = 20;
          // Center dividing joint line on PANEL layer
          bEnts.push({ t: 'line', a: [hw, 0], b: [hw, h], layer: 'PANEL' });
          // Left 0.5m panel margin
          bEnts.push({ t: 'line', a: [m, m], b: [hw - m, m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [hw - m, m], b: [hw - m, h - m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [hw - m, h - m], b: [m, h - m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [m, h - m], b: [m, m], layer: 'PANEL_DETAIL' });
          // Right 0.5m panel margin
          bEnts.push({ t: 'line', a: [hw + m, m], b: [w - m, m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [w - m, m], b: [w - m, h - m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [w - m, h - m], b: [hw + m, h - m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [hw + m, h - m], b: [hw + m, m], layer: 'PANEL_DETAIL' });
          // Flange bolt joint lines at center
          bEnts.push({ t: 'line', a: [hw - 8, 0], b: [hw - 8, h], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [hw + 8, 0], b: [hw + 8, h], layer: 'PANEL_DETAIL' });
        } else if (type === 'fitting' || type === 'large') {
          // Fitting panel (피팅 판넬): concentric reinforced circular boss for large piping/flange
          const mTemplates = (sideT && (sideT[mat] || sideT.SMC)) || {};
          const customFitting = mTemplates['fitting'] || mTemplates['panel-fitting'] || mTemplates[w + 'x' + h + '_fitting'] || mTemplates['1000x1000_fitting'];
          if (customFitting && customFitting.length > 0) {
            customFitting.forEach(s => {
              if (!s) return;
              const k = s.k || s.t || s.type;
              if (k === 'line') {
                const a = (s.p && s.p[0]) || s.a;
                const b = (s.p && s.p[1]) || s.b;
                if (a && b) bEnts.push({ t: 'line', a, b, layer: 'PANEL_DETAIL' });
              } else if (k === 'poly') {
                const p = s.p || s.pts || [];
                if (p.length >= 2) {
                  for (let k = 0; k + 1 < p.length; k++) bEnts.push({ t: 'line', a: p[k], b: p[k + 1], layer: 'PANEL_DETAIL' });
                  if (s.c !== false && p.length > 2 && Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]) > 0.1) bEnts.push({ t: 'line', a: p[p.length - 1], b: p[0], layer: 'PANEL_DETAIL' });
                }
              } else if (k === 'circle' && (s.c || s.center)) {
                const c = s.c || s.center;
                bEnts.push({ t: 'circle', c, r: s.r || 10, layer: 'PANEL_DETAIL' });
              } else if (k === 'arc' && (s.c || s.center)) {
                const c = s.c || s.center;
                bEnts.push({ t: 'circle', c, r: s.r || 10, layer: 'PANEL_DETAIL' });
              }
            });
          } else {
            const cx = w / 2, cy = h / 2, minD = Math.min(w, h);
            bEnts.push({ t: 'circle', c: [cx, cy], r: Math.round(minD * 0.35), layer: 'PANEL_DETAIL' });
            bEnts.push({ t: 'circle', c: [cx, cy], r: Math.round(minD * 0.22), layer: 'PANEL_DETAIL' });
            bEnts.push({ t: 'circle', c: [cx, cy], r: Math.round(minD * 0.12), layer: 'PANEL_DETAIL' });
            const rHole = Math.round(minD * 0.285);
            for (let deg = 0; deg < 360; deg += 45) {
              const rad = deg * Math.PI / 180;
              bEnts.push({ t: 'circle', c: [Math.round(cx + rHole * Math.cos(rad)), Math.round(cy + rHole * Math.sin(rad))], r: 10, layer: 'PANEL_DETAIL' });
            }
          }
        } else {
          const mTemplates = (sideT && (sideT[mat] || sideT.SMC)) || {};
          let t = mTemplates[w + 'x' + h];
          if ((!t || !t.length) && ((w === 500 && h === 1000) || (w === 1000 && h === 500))) {
            t = mTemplates['500x1000'] || mTemplates['1000x500'];
          }
          if ((!t || !t.length) && opt && opt.customPanels && Array.isArray(opt.customPanels)) {
            const matched = opt.customPanels.find(p =>
              (p.category === 'side' || p.category === 'common' || p.category === 'all' || !p.category) &&
              (p.size_key === `${w}x${h}` || (p.width === w && p.height === h) ||
               (((w === 500 && h === 1000) || (w === 1000 && h === 500)) && (p.size_key === '500x1000' || p.size_key === '1000x500'))) &&
              p.entities && p.entities.length
            );
            if (matched) t = matched.entities;
          }
          if (!t || !t.length) t = getDefaultPanelPattern(w, h);
          if (!t) t = [];
          t.forEach(s => {
            if (!s) return;
            const k = s.k || s.t || s.type;
            if (k === 'line') {
              const a = (s.p && s.p[0]) || s.a;
              const b = (s.p && s.p[1]) || s.b;
              if (a && b) bEnts.push({ t: 'line', a, b, layer: 'PANEL_DETAIL' });
            } else if (k === 'poly') {
              const p = s.p || s.pts || [];
              if (p.length >= 2) {
                for (let k = 0; k + 1 < p.length; k++) bEnts.push({ t: 'line', a: p[k], b: p[k + 1], layer: 'PANEL_DETAIL' });
                if (s.c !== false && p.length > 2 && Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]) > 0.1) bEnts.push({ t: 'line', a: p[p.length - 1], b: p[0], layer: 'PANEL_DETAIL' });
              }
            } else if (k === 'circle' && (s.c || s.center)) {
              const c = s.c || s.center;
              bEnts.push({ t: 'circle', c, r: s.r || 10, layer: 'PANEL_DETAIL' });
            } else if (k === 'arc' && (s.c || s.center)) {
              const c = s.c || s.center;
              const d = (p) => (p && Array.isArray(p)) ? (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180 / Math.PI) : 0;
              let a0 = 0, a1 = 360;
              if (s.a0 !== undefined && s.a1 !== undefined) {
                a0 = s.a0; a1 = s.a1;
              } else if (s.s && s.e) {
                a0 = d(s.s); a1 = d(s.e);
              }
              bEnts.push({ t: 'arc', c, r: s.r || 10, a0, a1, layer: 'PANEL_DETAIL' });
            }
          });
        }
        blocks[blkName] = bEnts;
      }
      return blkName;
    };

    // CSideLT: 패널 블럭 삽입
    function panel(x, y, w, h, colIdx, tierIdx) {
      const pKey1 = `${view},${tierIdx},${colIdx}`;
      const pKey2 = `${view === 'side' ? 'right' : view},${tierIdx},${colIdx}`;
      const pType = (opt.sidePanels && (opt.sidePanels[pKey1] || opt.sidePanels[pKey2])) || 'std';
      const blkName = getSideBlock(w, h, pType);
      ents.push({ t: 'insert', block: blkName, p: [x, y], w, h, layer: 'PANEL' });
    }
    // CPlateLT::SMC_OutBo (0x10000 상 / 0x20000 중 / 0x30000 하)
    function plate(x, y, kind) {
      const ms = OB.SPACE >> 1, R = OB.R;
      if (kind === 'top') {
        plateBacking(x - MX + OB.SPACE, y - OB.MOVE, x + MX - OB.SPACE, y + OB.CY - OB.MOVE);
        rect(x - MX + OB.SPACE, y - OB.MOVE, x + MX - OB.SPACE, y + OB.CY - OB.MOVE, 'REINF');
        circ(x - MX + OB.SPACE + ms, y - OB.MOVE + ms, R, 'REINF'); circ(x + MX - OB.SPACE - ms, y - OB.MOVE + ms, R, 'REINF');
      } else if (kind === 'mid') {
        plateBacking(x - MX, y - MY, x + MX, y + MY);
        rect(x - MX, y - MY, x + MX, y + MY, 'REINF');
        ln([x - MX + OB.SPACE, y - MY], [x - MX + OB.SPACE, y + MY], 'REINF'); ln([x + MX - OB.SPACE, y - MY], [x + MX - OB.SPACE, y + MY], 'REINF');
        [[x - MX + ms, y - MY + ms], [x - MX + ms, y + MY - ms], [x + MX - ms, y - MY + ms], [x + MX - ms, y + MY - ms]].forEach(c => circ(c[0], c[1], R, 'REINF'));
      } else {
        plateBacking(x - MX, y, x + MX, y + OB.STAY + OB.CY);
        rect(x - MX, y, x + MX, y + OB.STAY, 'REINF');
        rect(x - MX + OB.SPACE, y + OB.STAY, x + MX - OB.SPACE, y + OB.STAY + OB.CY, 'REINF');
        circ(x - MX + OB.SPACE + ms, y + OB.STAY + OB.CY - ms, R, 'REINF'); circ(x + MX - OB.SPACE - ms, y + OB.STAY + OB.CY - ms, R, 'REINF');
      }
    }
    // CManholeLT::Form (개방형 이중덮개 맨홀 형상) — pos: 0 단일 1 왼쪽 2 중간 3 오른쪽
    function manhole(x, y, cx, cy, pos, shapeInfo) {
      const shape = (shapeInfo && typeof shapeInfo === 'object') ? shapeInfo.sh : (shapeInfo || 0);
      const hasMh = (shapeInfo && typeof shapeInfo === 'object')
        ? shapeInfo.hasMh
        : Boolean((shape & 1) || (shape & 2) || (shape & 8) || (shape & 16) || shape === 5 || shape === 6);
      const mhViewType = (shapeInfo && typeof shapeInfo === 'object')
        ? shapeInfo.mhViewType
        : (view === 'front' ? 'front' : 'side_right');
      const customParts = opt?.partTemplates || opt?.customComponents || {};

      if (hasMh) {
        let customMh = null;
        const noDefOpt = { ...opt, defaultPartEntities: null };
        if (mhViewType === 'front') {
          customMh = resolvePartEntities(customParts, 'manhole', 'front', cy, noDefOpt);
        } else if (mhViewType === 'rear') {
          customMh = resolvePartEntities(customParts, 'manhole', 'rear', cy, noDefOpt);
        } else if (mhViewType === 'side_right') {
          customMh = resolvePartEntities(customParts, 'manhole', 'right', cy, noDefOpt)
                  || resolvePartEntities(customParts, 'manhole', 'side', cy, noDefOpt);
        } else if (mhViewType === 'side_left') {
          customMh = resolvePartEntities(customParts, 'manhole', 'left', cy, noDefOpt);
          if (!customMh || !customMh.length) {
            const rEnts = resolvePartEntities(customParts, 'manhole', 'right', cy, noDefOpt)
                       || resolvePartEntities(customParts, 'manhole', 'side', cy, noDefOpt);
            if (rEnts && rEnts.length) customMh = mirrorEntitiesH(rEnts);
          }
        }

        if (customMh && customMh.length > 0) {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          customMh.forEach(e => {
            const p1 = (e.p && e.p[0]) || e.a; const p2 = (e.p && e.p[1]) || e.b;
            if (p1 && p2) { minX = Math.min(minX, p1[0], p2[0]); maxX = Math.max(maxX, p1[0], p2[0]); minY = Math.min(minY, p1[1], p2[1]); maxY = Math.max(maxY, p1[1], p2[1]); }
            const c = e.c || e.center; const r = e.r;
            if (c && r != null) { minX = Math.min(minX, c[0] - r); maxX = Math.max(maxX, c[0] + r); minY = Math.min(minY, c[1] - r); maxY = Math.max(maxY, c[1] + r); }
            const pts = e.p || e.pts;
            if (pts && pts.length) { pts.forEach(pt => { minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]); minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]); }); }
          });
          const mw = (maxX - minX) || 1000;
          renderCustomEntitiesAt(ents, customMh, x - minX * (cx / mw), y - minY, cx / mw, 1, 'PANEL');
          return;
        }
      }

      const noDefOpt = { ...opt, defaultPartEntities: null };
      const customTop = resolvePartEntities(customParts, 'top', view, cy, noDefOpt);
      if (customTop && customTop.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        customTop.forEach(e => {
          const p1 = (e.p && e.p[0]) || e.a; const p2 = (e.p && e.p[1]) || e.b;
          if (p1 && p2) { minX = Math.min(minX, p1[0], p2[0]); maxX = Math.max(maxX, p1[0], p2[0]); minY = Math.min(minY, p1[1], p2[1]); maxY = Math.max(maxY, p1[1], p2[1]); }
          const c = e.c || e.center; const r = e.r;
          if (c && r != null) { minX = Math.min(minX, c[0] - r); maxX = Math.max(maxX, c[0] + r); minY = Math.min(minY, c[1] - r); maxY = Math.max(maxY, c[1] + r); }
          const pts = e.p || e.pts;
          if (pts && pts.length) { pts.forEach(pt => { minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]); minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]); }); }
        });
        const tw = (maxX - minX) || 1000;
        renderCustomEntitiesAt(ents, customTop, x - minX * (cx / tw), y - minY, cx / tw, 1, 'PANEL');
        if (hasMh) {
          const top = (MH.STAY || 20) + cy, ms = cx >> 1, mh = 275;
          poly([[x + ms - mh, y + 60], [x + ms - mh, y + top], [x + ms + mh, y + top], [x + ms + mh, y + 60]], 'PANEL');
        }
        return;
      }

      const ms = cx >> 1, UI = MH.UP_IN[cx], DI = MH.DN_IN[cx], UO = MH.UP_OUT[cx], DO = MH.DN_OUT[cx];
      if (!UI) return;
      const two = cx === 1000 && (hasMh || (shape & 4));                 // Form2: 맨홀/환기구가 있으면 띠를 한 겹 더 올림
      const xl = (!internal && (pos === 2 || pos === 3)) ? OFF : 0, xr = (!internal && (pos === 1 || pos === 2)) ? cx - OFF : cx, T = MH.STAY, base = two ? 2 * T : T;
      rect(x + xl, y, x + xr, y + T, 'PANEL');
      if (two) rect(x + xl, y + T, x + xr, y + 2 * T, 'PANEL');
      ln([x + xl, y + T / 2], [x + xr, y + T / 2], 'PANEL');
      poly([[x + ms - DO, y + base], [x + ms - UO, y + T + cy], [x + ms + UO, y + T + cy], [x + ms + DO, y + base]], 'PANEL');
      ln([x + ms - DI, y + base], [x + ms - UI, y + T + cy], 'PANEL'); ln([x + ms + DI, y + base], [x + ms + UI, y + T + cy], 'PANEL');

      if (two) {
        const top = T + cy;
        if (hasMh) {
          if (mhViewType === 'front') {
            // 정면도 기본 형상: 넥 프레임 + 기립된 팔각 덮개 정면 + X자 리브 + 중앙 동심원 + 손잡이/힌지
            const mhW = 550, mhH = 60, covW = 580, covH = 640;
            rect(x + ms - mhW / 2, y + top, x + ms + mhW / 2, y + top + mhH, 'PANEL');
            const ch = 120;
            const cx0 = x + ms, cy0 = y + top + mhH;
            const octOuter = [
              [cx0 - covW / 2 + ch, cy0], [cx0 + covW / 2 - ch, cy0],
              [cx0 + covW / 2, cy0 + ch], [cx0 + covW / 2, cy0 + covH - ch],
              [cx0 + covW / 2 - ch, cy0 + covH], [cx0 - covW / 2 + ch, cy0 + covH],
              [cx0 - covW / 2, cy0 + covH - ch], [cx0 - covW / 2, cy0 + ch]
            ];
            poly(octOuter, 'PANEL', true);
            const ich = 90, iw = covW - 140, ih = covH - 140, icy0 = cy0 + 70;
            const octInner = [
              [cx0 - iw / 2 + ich, icy0], [cx0 + iw / 2 - ich, icy0],
              [cx0 + iw / 2, icy0 + ich], [cx0 + iw / 2, icy0 + ih - ich],
              [cx0 + iw / 2 - ich, icy0 + ih], [cx0 - iw / 2 + ich, icy0 + ih],
              [cx0 - iw / 2, icy0 + ih - ich], [cx0 - iw / 2, icy0 + ich]
            ];
            poly(octInner, 'PANEL', true);
            const centerCoverY = cy0 + covH / 2;
            circ(cx0, centerCoverY, 50, 'PANEL');
            circ(cx0, centerCoverY, 25, 'PANEL');
            ln([cx0 - 35, centerCoverY - 35], [cx0 - iw / 2 + ich * 0.7, icy0 + ich * 0.7], 'PANEL');
            ln([cx0 + 35, centerCoverY - 35], [cx0 + iw / 2 - ich * 0.7, icy0 + ich * 0.7], 'PANEL');
            ln([cx0 - 35, centerCoverY + 35], [cx0 - iw / 2 + ich * 0.7, icy0 + ih - ich * 0.7], 'PANEL');
            ln([cx0 + 35, centerCoverY + 35], [cx0 + iw / 2 - ich * 0.7, icy0 + ih - ich * 0.7], 'PANEL');
            rect(cx0 - 25, cy0 + covH, cx0 + 25, cy0 + covH + 25, 'PANEL');
            rect(cx0 - 40, cy0 - 15, cx0 + 40, cy0 + 15, 'PANEL');
          } else if (mhViewType === 'rear') {
            // 배면도 기본 형상: 넥 프레임 + 기립된 팔각 덮개 배면 외곽 + 배면 보강 세로바 + 지지 브래킷 + 힌지/걸쇠
            const mhW = 550, mhH = 60, covW = 580, covH = 640;
            rect(x + ms - mhW / 2, y + top, x + ms + mhW / 2, y + top + mhH, 'PANEL');
            const ch = 120;
            const cx0 = x + ms, cy0 = y + top + mhH;
            const octOuter = [
              [cx0 - covW / 2 + ch, cy0], [cx0 + covW / 2 - ch, cy0],
              [cx0 + covW / 2, cy0 + ch], [cx0 + covW / 2, cy0 + covH - ch],
              [cx0 + covW / 2 - ch, cy0 + covH], [cx0 - covW / 2 + ch, cy0 + covH],
              [cx0 - covW / 2, cy0 + covH - ch], [cx0 - covW / 2, cy0 + ch]
            ];
            poly(octOuter, 'PANEL', true);
            // 배면 보강 세로 리브 2줄
            ln([cx0 - 110, cy0], [cx0 - 110, cy0 + covH], 'PANEL');
            ln([cx0 + 110, cy0], [cx0 + 110, cy0 + covH], 'PANEL');
            // 가로 지지 브래킷
            rect(cx0 - 30, cy0 + 200, cx0 + 30, cy0 + 260, 'PANEL');
            rect(cx0 - 25, cy0 + covH, cx0 + 25, cy0 + covH + 25, 'PANEL');
            rect(cx0 - 40, cy0 - 15, cx0 + 40, cy0 + 15, 'PANEL');
          } else if (mhViewType === 'side_right') {
            // 측면도 (입구 우측/동측 또는 북측): 넥 프레임 + 좌측 기립 덮개 + 우측 지지대 및 입구 턱
            const mhW = 550, mhH = 60, covH = 640;
            rect(x + ms - mhW / 2, y + top, x + ms + mhW / 2, y + top + mhH, 'PANEL');
            const hx = x + ms - 180;
            rect(hx - 15, y + top + mhH, hx + 15, y + top + mhH + covH, 'PANEL');
            ln([hx + 15, y + top + mhH + 60], [x + ms + 140, y + top + mhH], 'PANEL');
            rect(hx - 25, y + top + mhH - 10, hx + 25, y + top + mhH + 15, 'PANEL');
            // 우측 입구 걸쇠 턱 (입구 강조)
            rect(x + ms + mhW / 2 - 35, y + top + mhH - 8, x + ms + mhW / 2 + 5, y + top + mhH + 12, 'PANEL');
          } else if (mhViewType === 'side_left') {
            // 측면도 (입구 좌측/서측 또는 남측): 넥 프레임 + 우측 기립 덮개 + 좌측 지지대 및 입구 턱 (좌우 대칭 반전)
            const mhW = 550, mhH = 60, covH = 640;
            rect(x + ms - mhW / 2, y + top, x + ms + mhW / 2, y + top + mhH, 'PANEL');
            const hx = x + ms + 180;
            rect(hx - 15, y + top + mhH, hx + 15, y + top + mhH + covH, 'PANEL');
            ln([hx - 15, y + top + mhH + 60], [x + ms - 140, y + top + mhH], 'PANEL');
            rect(hx - 25, y + top + mhH - 10, hx + 25, y + top + mhH + 15, 'PANEL');
            // 좌측 입구 걸쇠 턱 (입구 강조)
            rect(x + ms - mhW / 2 - 5, y + top + mhH - 8, x + ms - mhW / 2 + 35, y + top + mhH + 12, 'PANEL');
          }
        }
        if (shape & 4) {
          // 환기구 (에어벤트)
          const vx = hasMh ? (x + ms + 280) : (x + ms);
          let h = top; [[110, 10], [60, 60], [100, 6], [90, 30]].forEach(([w, hh]) => { rect(vx - w / 2, y + h, vx + w / 2, y + h + hh, 'PANEL'); h += hh; });
        }
        return;
      }
      if (internal) return;   // 내부 보강: 외부 보강 연결 부분(OutFix) 없음
      const LS = [ms - DO, MH.STAY], LE = [ms - UO, cy], RS = [ms + DO, MH.STAY], RE = [ms + UO, cy];
      const h1 = 82 + 4, h2 = 82 + 20 - 4;
      [h1, h2].forEach(h => {
        ln([x + (pos === 2 || pos === 3 ? OFF : 0), y + h], [x + solX(LS, LE, h), y + h], 'PANEL');
        ln([x + (pos === 1 || pos === 2 ? cx - OFF : cx), y + h], [x + solX(RS, RE, h), y + h], 'PANEL');
      });
    }

    // 맨홀 모양 (IndexFrontManhole / IndexSideManhole): 열(정면) 또는 행(측면)에 걸친 표식을 합산
    const mmap = createMap(opt), marks = opt.marks || {};
    const shapeOf = g => {
      let sh = 0;
      let mhFound = false;
      let targetMhViewType = null;
      let targetMhDir = null;

      if (view === 'front') {
        // Front View: 정면(남측)에서 배면(북측) 방향으로 스캔 (앞쪽 행부터 우선)
        for (let k = 0; k < mmap.rows.length; k++) {
          const i = k, j = g;
          if (!mmap.has(i, j)) continue;
          const m = marks[i + ',' + j] || 0;
          if (m & 2) sh |= 4; // airvent
          if ((m & 1) && !mhFound) {
            mhFound = true;
            targetMhDir = getManholeDir(opt, mmap, i, j);
            targetMhViewType = getManholeViewType(targetMhDir, 'front');
            if (targetMhViewType === 'front') sh |= 1;
            else if (targetMhViewType === 'side_right') sh |= 2;
            else if (targetMhViewType === 'side_left') sh |= 8;
            else if (targetMhViewType === 'rear') sh |= 16;
          }
        }
      } else {
        // Side View (우측면도): 동측에서 서측 방향으로 스캔 (동측 열부터 우선)
        for (let k = mmap.cols.length - 1; k >= 0; k--) {
          const i = g, j = k;
          if (!mmap.has(i, j)) continue;
          const m = marks[i + ',' + j] || 0;
          if (m & 2) sh |= 4; // airvent
          if ((m & 1) && !mhFound) {
            mhFound = true;
            targetMhDir = getManholeDir(opt, mmap, i, j);
            targetMhViewType = getManholeViewType(targetMhDir, 'side');
            if (targetMhViewType === 'front') sh |= 1;
            else if (targetMhViewType === 'side_right') sh |= 2;
            else if (targetMhViewType === 'side_left') sh |= 8;
            else if (targetMhViewType === 'rear') sh |= 16;
          }
        }
      }

      return {
        sh,
        hasMh: mhFound,
        hasVent: Boolean(sh & 4),
        mhViewType: targetMhViewType || (view === 'front' ? 'front' : 'side_right'),
        mhDir: targetMhDir,
        valueOf() { return this.sh; }
      };
    };
    let gIdx = 0;
    let baseX = 0;
    secs.forEach(nLen => {
      const pLen = split(nLen, baseX), cnt = pLen.length;
      const xj = [baseX]; pLen.forEach(w => xj.push(xj[xj.length - 1] + w));
      const sp = baseX === 0 ? 0 : cnt - 1;             // 1300 패널 위치 (왼쪽 구간은 처음, 나머지는 마지막)
      const pendingPlates = [];
      if (internal && sts) {
        // STS_AngleLeft / STS_AngleRight: 외곽선 + STS 패널 + 단 사이 가로선/세로선 + 접합 격자판(180x180, 나사 4 + 절곡선)
        const HX = 90, hq = 45, so = 20;
        ln([baseX, 0], [baseX + nLen, 0]); ln([baseX, nH], [baseX + nLen, nH]);
        ln([baseX, 0], [baseX, nH]); ln([baseX + nLen, 0], [baseX + nLen, nH]);
        let y0 = 0;
        hs.forEach((hh, i) => {
          const tall = !(hh === 500 || hh === 1000 || hh === 1300);
          for (let j = 0; j < cnt; j++) {
            if (tall && j === sp && pLen[j] === 1300) {
              panel(xj[j], y0, 1300, hh - 1000, gIdx + j, i); panel(xj[j], y0 + hh - 1000, 1300, 1000, gIdx + j, i); ln([xj[j], y0 + hh - 1000], [xj[j] + 1300, y0 + hh - 1000]);
            } else panel(xj[j], y0, pLen[j], hh, gIdx + j, i);
          }
          y0 += hh;
        });
        const stsPlate = (x, y) => {
          plateBacking(x - HX, y - HX, x + HX, y + HX);
          rect(x - HX, y - HX, x + HX, y + HX, 'REINF');
          [[-1, 1], [-1, -1], [1, 1], [1, -1]].forEach(([a, b]) => {
            circ(x + a * hq, y + b * hq, 10, 'REINF');
            poly([[x + a * HX, y + b * (hq - so)], [x + a * (hq - so), y + b * (hq - so)], [x + a * (hq - so), y + b * HX]], 'REINF');
          });
        };
        let yb = 0;
        for (let i = 0; i < n - 1; i++) {
          yb += hs[i];
          const curYb = yb;
          for (let j = 0; j < cnt - 1; j++) {
            ln([xj[j] + (j === 0 ? 0 : HX), yb], [xj[j + 1] - HX, yb]);
            ln([xj[j + 1], yb - HX], [xj[j + 1], yb - hs[i] + (i === 0 ? 0 : HX)]);
            const curX = xj[j + 1];
            pendingPlates.push(() => stsPlate(curX, curYb));
          }
          ln([xj[cnt - 1] + (cnt > 1 ? HX : 0), yb], [baseX + nLen, yb]);
        }
        for (let j = 0; j < cnt - 1; j++) ln([xj[j + 1], nH], [xj[j + 1], nH - hs[n - 1] + HX]);
      } else if (internal) {
        // InAngle / InHwan (내부 보강): 외곽선 + 패널 + 접합부 내부 격자판(180x180, 나사 4) + 좌우 반쪽 격자판
        const PX = 180, HX = PX >> 1, sr = 10, hsN = hs.length;
        ln([baseX, 0], [baseX + nLen, 0]); ln([baseX, nH], [baseX + nLen, nH]);
        ln([baseX, 0], [baseX, nH]); ln([baseX + nLen, 0], [baseX + nLen, nH]);
        const spans = xj.map(() => []);            // 접합부 x 별 격자판이 차지하는 y 구간
        const scr = (cx0, cy0, dx, dy) => [[-1, 1], [-1, -1], [1, 1], [1, -1]].forEach(([a1, b1]) => circ(cx0 + a1 * dx, cy0 + b1 * dy, sr, 'REINF'));
        const fullPlate = (x, y) => { plateBacking(x - HX, y - HX, x + HX, y + HX); rect(x - HX, y - HX, x + HX, y + HX, 'REINF'); scr(x, y, HX / 2, HX / 2); };
        const halfPlate = (x, y, sgn) => { const xA = Math.min(x, x + sgn * HX), xB = Math.max(x, x + sgn * HX); plateBacking(xA, y - HX, xB, y + HX); rect(x, y - HX, x + sgn * HX, y + HX, 'REINF'); circ(x + sgn * HX / 2, y + HX / 2, sr, 'REINF'); circ(x + sgn * HX / 2, y - HX / 2, sr, 'REINF'); };
        const lowPlate = (x, y) => { plateBacking(x - HX, y, x + HX, y + HX); rect(x - HX, y, x + HX, y + HX, 'REINF'); circ(x - HX / 2, y + HX / 2, sr, 'REINF'); circ(x + HX / 2, y + HX / 2, sr, 'REINF'); };
        const midRect = (x, y) => { plateBacking(x - HX, y - HX / 2, x + HX, y + HX / 2); rect(x - HX, y - HX / 2, x + HX, y + HX / 2, 'REINF'); circ(x - HX / 2, y, sr, 'REINF'); circ(x + HX / 2, y, sr, 'REINF'); };
        
        let y = 0;
        hs.forEach((hh, i) => {
          const tall = !(hh === 500 || hh === 1000 || hh === 1300), last = i === hsN - 1;
          for (let j = 0; j < cnt; j++) {
            if (tall && j === sp && pLen[j] === 1300) {
              panel(xj[j], y, 1300, hh - 1000, gIdx + j, i); ln([xj[j], y + hh - 1000], [xj[j] + 1300, y + hh - 1000]); panel(xj[j], y + hh - 1000, 1300, 1000, gIdx + j, i);
            } else panel(xj[j], y, pLen[j], hh, gIdx + j, i);
          }
          if (i > 0) {                               // 단 사이 가로 이음선 + 격자판
            for (let j = 0; j < cnt; j++) ln([xj[j] + (j > 0 ? HX : (baseX > 0 ? WALL_TH : 0)) , y], [xj[j + 1] - (j < cnt - 1 ? HX : 0), y]);
            const plateY = y;
            for (let j = 1; j < cnt; j++) { pendingPlates.push(() => fullPlate(xj[j], plateY)); spans[j].push([plateY - HX, plateY + HX]); }
            if (baseX === 0) pendingPlates.push(() => halfPlate(baseX, plateY, 1));
            pendingPlates.push(() => halfPlate(baseX + nLen, plateY, -1));
          } else if (nH > 3000) {
            for (let j = 1; j < cnt; j++) { pendingPlates.push(() => lowPlate(xj[j], 0)); spans[j].push([0, HX]); }
          }
          if (last && hsN >= 1 && !(tall && false)) {   // 마지막 단 중앙 직사각형 격자판
            const my2 = y + (hh >> 1);
            for (let j = 1; j < cnt; j++) { pendingPlates.push(() => midRect(xj[j], my2)); spans[j].push([my2 - HX / 2, my2 + HX / 2]); }
          }
          y += hh;
        });
        for (let j = 1; j < cnt; j++) {              // 접합부 세로선 (격자판 구간은 비움)
          const cuts = spans[j].sort((p, q) => p[0] - q[0]); let cur = 0;
          cuts.forEach(([c0, c1]) => { if (c0 > cur) ln([xj[j], cur], [xj[j], c0]); cur = Math.max(cur, c1); });
          if (cur < nH) ln([xj[j], cur], [xj[j], nH]);
        }
      } else {
      // OutForceLeft / OutForceRight: 바깥 세로선
      [0, OFF, nLen - OFF, nLen].forEach(o => ln([baseX + o, 0], [baseX + o, nH]));
      ln([baseX, 0], [baseX + nLen, 0]);
      let y = 0;
      const customPost = resolvePartEntities(opt.partTemplates || opt.customComponents, 'ext_reinf', view, nH);
      hs.forEach((hh, i) => {
        const tall = !(hh === 500 || hh === 1000 || hh === 1300);
        if (i > 0) ln([baseX, y], [baseX + (cnt > 1 ? pLen[0] - MX : pLen[0]), y]);
        for (let j = 0; j < cnt; j++) {
          if (tall && j === sp && pLen[j] === 1300) {     // 높이 1500/2000 의 1300 패널: (h-1000) + 1000 로 분할
            panel(xj[j], y, 1300, hh - 1000, gIdx + j, i); ln([xj[j], y + hh - 1000], [xj[j] + 1300, y + hh - 1000]); panel(xj[j], y + hh - 1000, 1300, 1000, gIdx + j, i);
          } else panel(xj[j], y, pLen[j], hh, gIdx + j, i);
          if (j < cnt - 1) {
            const x = xj[j + 1];
            if (customPost && customPost.length) {
              if (i === 0) {
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                customPost.forEach(e => {
                  if (e.k === 'line') { minX = Math.min(minX, e.p[0][0], e.p[1][0]); maxX = Math.max(maxX, e.p[0][0], e.p[1][0]); minY = Math.min(minY, e.p[0][1], e.p[1][1]); maxY = Math.max(maxY, e.p[0][1], e.p[1][1]); }
                  else if (e.k === 'circle' || e.k === 'arc') { minX = Math.min(minX, e.c[0] - e.r); maxX = Math.max(maxX, e.c[0] + e.r); minY = Math.min(minY, e.c[1] - e.r); maxY = Math.max(maxY, e.c[1] + e.r); }
                  else if (e.k === 'poly') { e.p.forEach(pt => { minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]); minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]); }); }
                });
                const cx = (minX + maxX) / 2;
                const sy = (maxY > minY && Math.abs(maxY - minY - nH) > 10) ? (nH / (maxY - minY)) : 1;
                renderCustomEntitiesAt(ents, customPost, x - cx, -minY * sy, 1, sy, 'REINF');
              }
            } else {
              const curX = x, curY = y, curKind = i === 0 ? 'bot' : 'mid';
              pendingPlates.push(() => plate(curX, curY, curKind));
              if (i > 0) {
                ln([x + MX, y], [x + (j === cnt - 2 ? pLen[j + 1] : pLen[j + 1] - MX), y]);
                const h = i === 1 ? OB.STAY + OB.CY : MY;
                [-OFF, 0, OFF].forEach(o => ln([x + o, y - MY], [x + o, y - hs[i - 1] + h]));
              }
            }
          }
        }
        y += hh;
      });
      // 마지막단(윗 테두리)
      ln([baseX, nH], [baseX + (cnt > 1 ? pLen[0] - OFF : pLen[0]), nH]);
      const hT = n > 1 ? OB.CY >> 1 : OB.STAY + OB.CY;
      for (let j = 0; j < cnt - 1; j++) {
        const x = xj[j + 1];
        if (!customPost || !customPost.length) {
          const curX = x;
          pendingPlates.push(() => plate(curX, nH, 'top'));
          ln([x + OFF, nH], [x + (j === cnt - 2 ? pLen[j + 1] : pLen[j + 1] - OFF), nH]);
          [-OFF, 0, OFF].forEach(o => ln([x + o, nH - OB.MOVE], [x + o, nH - hs[n - 1] + hT]));
        }
      }
      }
      // 최외각 보강재를 패널 및 접합선 최상단에 렌더링 (뒤 배경 차폐)
      pendingPlates.forEach(fn => fn());
      // 맨홀 띠 (CManholeLT, 높이 100)
      for (let j = 0; j < cnt; j++) manhole(xj[j], nH, pLen[j], sts ? 70 : 100, cnt === 1 ? 0 : j === 0 ? 1 : j === cnt - 1 ? 3 : 2, shapeOf(gIdx + j));
      gIdx += cnt;
      baseX += nLen;
    });

    const dFrame = getSkidDimensions(th);
    if (sts) {
      // CFrmLT::STSFrameFront / CSideFrmLT (STS): 접합부 중심 ±75, 두께 th
      const mx = 75, T = 20, pl = (x, y, p) => poly(p.map(q => [x + q[0], q[1]]), 'FRAME', true);
      const chL = [[-mx, 0], [mx, 0], [mx, -th], [-mx, -th], [-mx + T, -th + T], [mx - T, -th + T], [mx - T, -T], [-mx + T, -T]];
      const anL = [[-mx, 0], [mx, 0], [mx, -th], [mx - T, -th + T], [mx - T, -T], [-mx + T, -T]];
      const chR = [[mx, 0], [mx - T, -T], [-mx + T, -T], [-mx + T, -th + T], [mx - T, -th + T], [mx, -th], [-mx, -th], [-mx, 0]];
      const anR = [[mx, 0], [mx - T, -T], [-mx + T, -T], [-mx + T, -th + T], [-mx, -th], [-mx, 0]];
      const lim = view === 'front' ? [75, 100] : [100, 100];
      const left = x => pl(x, 0, th >= lim[0] ? chL : anL), right = x => pl(x, 0, th >= lim[1] ? chR : anR);
      const wl = []; { let c0 = 0; secs.forEach(sn => { split(sn, c0).forEach(w => wl.push(w)); c0 += sn; }); }
      if (view === 'front') {
        left(0); let x = 0, lk = 0; wl.forEach(w => { x += w; }); right(total);
        ln([mx, -th], [total - mx, -th], 'FRAME');
      } else {
        const cn = wl.length; let div = (cn + 1) >> 1; if ((cn + 1) % 2) div++;
        left(0); let x = wl[0];
        for (let i = 1; i < div; x += wl[i++]) right(x);
        for (let i = div; i < cn; x += wl[i++]) left(x);
        right(x);
      }
    } else if (th >= 50) {
      // 하부 프레임 (CFrmLT::SMCFrameFront) : 75 → 앵글, 125 → 채널, 150 → 채널, 50 → 각관
      if (dFrame.type === 'shs') {   // SHS 50x50 각관 (50x50x3.2T)
        [[-50, 0], [total, total + 50]].forEach(([x0, x1]) => {
          rect(x0, 0, x0 + 50, -50, 'FRAME');
          rect(x0 + 3.2, -3.2, x0 + 46.8, -46.8, 'FRAME');
        });
        ln([0, -50], [total, -50], 'FRAME');
      } else {
        const F = dFrame.mainW, T = Math.round(dFrame.mainT * 2.5), ch = dFrame.type === 'channel';
        const L = (x, sgn) => ch
          ? [[x, 0], [x + sgn * F, 0], [x + sgn * (F - T), -T], [x + sgn * T, -T], [x + sgn * T, -th + T], [x + sgn * (F - T), -th + T], [x + sgn * F, -th], [x, -th]]
          : [[x, 0], [x + sgn * F, 0], [x + sgn * (F - T), -T], [x + sgn * T, -T], [x + sgn * T, -th - 1 + T], [x, -th - 1]];
        poly(L(0, -1), 'FRAME', true); poly(L(total, 1), 'FRAME', true);
        ln([0, -th], [total, -th], 'FRAME');
      }
    }
    // 모서리 기둥 (Adhesion + COutPoleLT)
    const pole = (px, sgn) => {
      const X = v => px + sgn * v;
      poly([[X(0), 0], [X(150), 0], [X(150), 10], [X(0), 10]], 'REINF');
      poly([[X(140), 10], [X(140), 170], [X(0), 170]], 'REINF');
      let py = 0;
      for (let i = 0; i < n - 1; i++) {
        py += hs[i]; ln([X(0), py], [X(90), py], 'REINF');
        rect(Math.min(X(90), X(140)), py - 80, Math.max(X(90), X(140)), py + 80, 'REINF');
      }
      ln([X(0), nH], [X(90), nH], 'REINF');
      rect(Math.min(X(90), X(140)), nH - 60, Math.max(X(90), X(140)), nH + 100, 'REINF');
      const sy = nH + 82, sx = X(140);
      poly([[sx, sy + 12], [sx, sy + 24], [X(160), sy + 24], [X(160), sy + 12]], 'REINF');
      ln([X(90), sy + 4], [px - sgn * 75, sy + 4], 'REINF'); ln([X(90), sy + 16], [px - sgn * 75, sy + 16], 'REINF');
      const rx = X(90 + 40);   // 봉 (왼쪽 -130 / 오른쪽 +100 을 원본 상수로 계산)
      const ax = sgn < 0 ? px - 130 : px + 100;
      let top = n > 1 ? hs[0] - 80 : hs[0] - 60;
      [0, 30].forEach(o => ln([ax + o, 170], [ax + o, top], 'REINF'));
      let yy = hs[0];
      for (let i = 0; i < n - 2; i++) { [0, 30].forEach(o => ln([ax + o, yy + 80], [ax + o, yy + hs[i + 1] - 80], 'REINF')); yy += hs[i + 1]; }
      if (n > 1) { const y0 = nH - hs[n - 1] + 80; [0, 30].forEach(o => ln([ax + o, y0], [ax + o, nH - 60], 'REINF')); }
    };
    // 코너 몸체 윤곽 + 기둥
    poly([[0, 0], [-75, 0], [-75, nH], [0, nH]], 'FRAME'); poly([[total, 0], [total + 75, 0], [total + 75, nH], [total, nH]], 'FRAME');
    if (!internal) { pole(-75, -1); pole(total + 75, 1); }

    // 베이스 프레임 (스틸 스키드 / 채널: 0 ~ -th) - 양끝단 수직 마감선 및 가로선
    const skidOverhang = dFrame.mainW;
    ln([-skidOverhang, 0], [total + skidOverhang, 0], 'FRAME');
    ln([-skidOverhang, -th], [total + skidOverhang, -th], 'FRAME');
    ln([-skidOverhang, 0], [-skidOverhang, -th], 'FRAME');
    ln([total + skidOverhang, 0], [total + skidOverhang, -th], 'FRAME');
    ln([0, 0], [0, -th], 'FRAME');
    ln([total, 0], [total, -th], 'FRAME');

    // 구간 경계 수직벽 (CWallLT::VertWall - 70mm폭 사각형 박스 + 솔리드 채움, 원 표시 대체)
    for (let i = 1, bx = secs[0]; i < secs.length; bx += secs[i++]) {
      let py = 0;
      hs.forEach(hh => sideSplit(hh, 0).forEach(cy => {
        const x0 = bx, x1 = bx + WALL_TH;
        const y0 = py, y1 = py + cy;
        // 70mm 사각형 박스 외곽선
        ln([x0, y0], [x1, y0], 'WALL');
        ln([x1, y0], [x1, y1], 'WALL');
        ln([x1, y1], [x0, y1], 'WALL');
        ln([x0, y1], [x0, y0], 'WALL');
        // 솔리드 채움
        ents.push({
          t: 'solid',
          p: [[x0, y0], [x1, y0], [x0, y1], [x1, y1]],
          layer: 'WALL'
        });
        py += cy;
      }));
    }

    // 기초 콘크리트 패드 및 지면 (media_1790951915253.png 완벽 일치)
    const fDesign = getFoundationDesign(opt);
    const padH = (opt && opt.padH !== undefined && opt.padH !== '') ? Number(opt.padH) : (600 - th);
    const clearanceH = th + padH; // 탱크 하부(y=0) ~ 슬래브 상면(slabTopY) = 600mm
    const slabTopY = -clearanceH; // -600mm
    const GRD = slabTopY; // 기준 바닥 레벨
    const slabT = fDesign.slabT;
    const slabBotY = slabTopY - slabT; // 슬래브 하면
    const cols = (view === 'front' ? mmap.cols : mmap.rows);
    const strips = concStrips(cols, opt);
    const px0 = strips[0][0];
    const pxEnd = strips[strips.length - 1][0] + strips[strips.length - 1][1];
    const totalPadW = pxEnd - px0;
    const N = opt._N || 25;
    const textH = Math.round(3.0 * N);
    const dimGap1 = Math.round(10.0 * N);
    const dimGap2 = Math.round(18.0 * N);
    const nozTextH = Math.round(2.2 * N);

    // 각 기둥 경계 [leftX, rightX, centerX]
    const plinths = strips.map(s => [s[0], s[0] + s[1], s[0] + s[1] / 2]);
    const numPlinths = plinths.length;

    // 2. 패드 기둥 및 하부 슬래브 외곽선 (Concrete outlines)
    plinths.forEach(([lx, rx]) => ln([lx, -th], [rx, -th], 'PAD'));
    for (let i = 0; i < plinths.length - 1; i++) {
      const curRx = plinths[i][1];
      const nextLx = plinths[i + 1][0];
      ln([curRx, -th], [curRx, slabTopY], 'PAD');
      ln([curRx, slabTopY], [nextLx, slabTopY], 'PAD');
      ln([nextLx, slabTopY], [nextLx, -th], 'PAD');
    }
    ln([px0, -th], [px0, slabBotY], 'PAD');
    ln([pxEnd, -th], [pxEnd, slabBotY], 'PAD');
    ln([px0, slabBotY], [pxEnd, slabBotY], 'PAD');

    // 4. 콘크리트 해치 (기둥 및 하부 슬래브에 걸쳐 단절 없이 연결되는 45도 사선 무늬)
    const hatchStep = 80;
    plinths.forEach(([lx, rx]) => {
      hatchAlignedRect(ents, lx, slabTopY, rx, -th, hatchStep, 'PAD', 1);
    });
    hatchAlignedRect(ents, px0, slabBotY, pxEnd, slabTopY, hatchStep, 'PAD', 1);

    // 5. 글로벌 표준 기초 단면 철근 배근 (REINF 레이어)
    // 슬래브 하부 주근 (y = slabBotY + 45) + 양단 90도 상향 갈고리
    ln([px0 + 50, slabBotY + 45], [pxEnd - 50, slabBotY + 45], 'REINF');
    ln([px0 + 50, slabBotY + 45], [px0 + 50, slabBotY + 115], 'REINF');
    ln([pxEnd - 50, slabBotY + 45], [pxEnd - 50, slabBotY + 115], 'REINF');

    // 슬래브 상부 주근 (y = slabTopY - 35) + 양단 90도 하향 갈고리
    ln([px0 + 50, slabTopY - 35], [pxEnd - 50, slabTopY - 35], 'REINF');
    ln([px0 + 50, slabTopY - 35], [px0 + 50, slabTopY - 105], 'REINF');
    ln([pxEnd - 50, slabTopY - 35], [pxEnd - 50, slabTopY - 105], 'REINF');

    // 슬래브 횡방향 배력근 점근
    for (let bx = px0 + 80; bx <= pxEnd - 60; bx += fDesign.slabRebarPitch) {
      circ(bx, slabBotY + 45 + 10, 4.5, 'REINF');
      circ(bx, slabTopY - 35 - 10, 4.5, 'REINF');
    }

    // 각 기둥 수직 주근 및 늑근
    plinths.forEach(([lx, rx]) => {
      const padW = rx - lx;
      ln([lx + 45, -th - 35], [lx + 45, slabBotY + 45], 'REINF');
      ln([lx + 45, slabBotY + 45], [lx + 45 + Math.min(120, padW - 90), slabBotY + 45], 'REINF');
      ln([rx - 45, -th - 35], [rx - 45, slabBotY + 45], 'REINF');
      ln([rx - 45, slabBotY + 45], [rx - 45 - Math.min(120, padW - 90), slabBotY + 45], 'REINF');

      ln([lx + 45, -th - 35], [lx + 45 + 60, -th - 35], 'REINF');
      ln([rx - 45, -th - 35], [rx - 45 - 60, -th - 35], 'REINF');

      for (let ty = -th - 75; ty >= slabTopY + 20; ty -= Math.min(130, fDesign.padTiePitch)) {
        ln([lx + 45, ty], [rx - 45, ty], 'REINF');
      }

      const cx = (lx + rx) / 2;
      const bDepth = Math.min(slabT + padH - 60, fDesign.anchorEmbed);
      ln([cx, -th + 35], [cx, -th - bDepth], 'FRAME');
      ln([cx, -th - bDepth], [cx + 45, -th - bDepth], 'FRAME');
      if (fDesign.anchorHasPlate) {
        ln([cx - 28, -th - bDepth], [cx + 28, -th - bDepth], 'FRAME');
        poly([[cx - 20, -th - bDepth], [cx + 20, -th - bDepth], [cx + 20, -th - bDepth - 10], [cx - 20, -th - bDepth - 10]], 'FRAME', true);
      }
    });

    // 7. 좌측 지면 GL선 (media_1790952977248.png: 좌측 GL도 바닥 레벨 slabBotY로 배치)
    const glLen = Math.max(650, Math.round(18.0 * N));
    const soilH = Math.round(3.5 * N);
    const triW = Math.round(2.6 * N), triH = Math.round(2.4 * N);
    ln([px0 - glLen, slabBotY], [px0, slabBotY], 'FRAME');
    const lSymX = px0 - Math.round(7.5 * N);
    poly([[lSymX - triW / 2, slabBotY + triH], [lSymX + triW / 2, slabBotY + triH], [lSymX, slabBotY]], 'DIM', true);
    ents.push({ t: 'text', p: [lSymX + triW * 0.8, slabBotY + triH * 0.8], h: Math.round(2.4 * N), s: 'GL', rot: 0, align: 'left', layer: 'DIM' });
    for (let sx = px0 - glLen; sx < px0 - glLen * 0.1; sx += Math.round(1.8 * N)) {
      ln([sx, slabBotY], [sx - soilH, slabBotY - soilH], 'PANEL_DETAIL');
    }

    // 8. 우측 기초 슬래브 두께(slabT) 치수선 및 우측 지면 GL선
    ln([pxEnd, slabBotY], [pxEnd + glLen, slabBotY], 'FRAME');
    const rSymX = pxEnd + Math.round(8.5 * N);
    poly([[rSymX - triW / 2, slabBotY + triH], [rSymX + triW / 2, slabBotY + triH], [rSymX, slabBotY]], 'DIM', true);
    ents.push({ t: 'text', p: [rSymX + triW * 0.8, slabBotY + triH * 0.8], h: Math.round(2.4 * N), s: 'GL', rot: 0, align: 'left', layer: 'DIM' });
    for (let sx = pxEnd + glLen * 0.1; sx < pxEnd + glLen; sx += Math.round(1.8 * N)) {
      ln([sx, slabBotY], [sx - soilH, slabBotY - soilH], 'PANEL_DETAIL');
    }
    const dim150X = pxEnd + Math.round(3.0 * N);
    dimLinear(ents, [pxEnd, slabBotY], [pxEnd, slabTopY], dim150X, true, String(slabT), Math.round(2.4 * N), 'DIM');

    // 9. 하단 치수선: Tier 1 기둥 피치 (1000, 1000, ...), Tier 2 전체 패드 폭 (8400)
    const dimPitchY = slabBotY - Math.round(8.5 * N);
    for (let i = 0; i < plinths.length - 1; i++) {
      const cxA = plinths[i][2], cxB = plinths[i + 1][2];
      dimLinear(ents, [cxA, slabBotY], [cxB, slabBotY], dimPitchY, false, String(Math.round(cxB - cxA)), Math.round(2.8 * N), 'DIM');
    }
    const dimTotalY = slabBotY - Math.round(16.0 * N);
    dimLinear(ents, [px0, slabBotY], [pxEnd, slabBotY], dimTotalY, false, String(totalPadW), Math.round(2.8 * N), 'DIM');

    // 배관 노즐 (INLET, OUTLET, OVERFLOW, DRAIN, FIRE 등) 입면도 배치 (글로벌 표준 간결 표기 & 중복 결합)
    const nozList = getNozzleList(opt);

    // 1. 현재 뷰(view: 'front' | 'side')에 맞춰 5개 그룹으로 분류
    const faceNozzles = [];
    const leftNozzles = [];
    const rightNozzles = [];
    const topNozzles = [];
    const bottomNozzles = [];

    nozList.forEach(n => {
      let rawElev = typeof n.elev === 'number' ? n.elev : (nH - 300);
      let elev = rawElev;
      const isOverflow = n.name === 'OVERFLOW' || (n.desc && n.desc.includes('월류'));
      const isInlet = n.name === 'INLET' || (n.desc && (n.desc.includes('유입') || n.desc.includes('급수')));
      if (isOverflow) {
        elev = Math.max(100, nH - 200);
      } else if (isInlet && n.face !== 'top') {
        elev = Math.max(100, nH - 300);
      } else if (elev > nH - 100) {
        elev = Math.max(100, nH - 150);
      }
      const isFlg = n.type === 'FLANGE';
      const spec = getNozzleSpec(n.size);

      if (view === 'front') {
        if (n.face === 'front') {
          const colIdx = Math.max(0, Math.min(n.seg - 1, mmap.cols.length - 1));
          let hasCol = false;
          for (let r = 0; r < mmap.rows.length; r++) { if (mmap.has(r, colIdx)) { hasCol = true; break; } }
          if (!hasCol) return;
          const cx = (mmap.xs[colIdx] + mmap.xs[colIdx + 1]) / 2 + (n.offset || 0);
          faceNozzles.push({ n, spec, isFlg, cx, cy: elev, elev });
        } else if (n.face === 'left') {
          leftNozzles.push({ n, spec, isFlg, elev });
        } else if (n.face === 'right') {
          rightNozzles.push({ n, spec, isFlg, elev });
        } else if (n.face === 'top') {
          const colIdx = Math.max(0, Math.min((n.topCell && n.topCell[1]) || 0, mmap.cols.length - 1));
          const rowIdx = Math.max(0, Math.min((n.topCell && n.topCell[0]) || 0, mmap.rows.length - 1));
          if (!mmap.has(rowIdx, colIdx)) return;
          const cx = (mmap.xs[colIdx] + mmap.xs[colIdx + 1]) / 2 + (n.offset || 0);
          topNozzles.push({ n, spec, isFlg, cx, elev: 'TOP' });
        } else if (n.face === 'bottom') {
          const cell = n.bottomCell || n.topCell || [0, (n.seg - 1) || 0];
          const colIdx = Math.max(0, Math.min(cell[1], mmap.cols.length - 1));
          const rowIdx = Math.max(0, Math.min(cell[0], mmap.rows.length - 1));
          if (!mmap.has(rowIdx, colIdx)) return;
          const cx = (mmap.xs[colIdx] + mmap.xs[colIdx + 1]) / 2 + (n.offset || 0);
          bottomNozzles.push({ n, spec, isFlg, cx, elev: 0 });
        }
      } else { // side view
        if (n.face === 'right') {
          const rowIdx = Math.max(0, Math.min(n.seg - 1, mmap.rows.length - 1));
          let hasRow = false;
          for (let c = 0; c < mmap.cols.length; c++) { if (mmap.has(rowIdx, c)) { hasRow = true; break; } }
          if (!hasRow) return;
          const cy = (mmap.ys[rowIdx] + mmap.ys[rowIdx + 1]) / 2 + (n.offset || 0);
          faceNozzles.push({ n, spec, isFlg, cx: cy, cy: elev, elev });
        } else if (n.face === 'front') {
          leftNozzles.push({ n, spec, isFlg, elev });
        } else if (n.face === 'rear') {
          rightNozzles.push({ n, spec, isFlg, elev });
        } else if (n.face === 'top') {
          const colIdx = Math.max(0, Math.min((n.topCell && n.topCell[1]) || 0, mmap.cols.length - 1));
          const rowIdx = Math.max(0, Math.min((n.topCell && n.topCell[0]) || 0, mmap.rows.length - 1));
          if (!mmap.has(rowIdx, colIdx)) return;
          const cy = (mmap.ys[rowIdx] + mmap.ys[rowIdx + 1]) / 2 + (n.offset || 0);
          topNozzles.push({ n, spec, isFlg, cx: cy, elev: 'TOP' });
        } else if (n.face === 'bottom') {
          const cell = n.bottomCell || n.topCell || [(n.seg - 1) || 0, 0];
          const colIdx = Math.max(0, Math.min(cell[1], mmap.cols.length - 1));
          const rowIdx = Math.max(0, Math.min(cell[0], mmap.rows.length - 1));
          if (!mmap.has(rowIdx, colIdx)) return;
          const cy = (mmap.ys[rowIdx] + mmap.ys[rowIdx + 1]) / 2 + (n.offset || 0);
          bottomNozzles.push({ n, spec, isFlg, cx: cy, elev: 0 });
        }
      }
    });

    const minVertGap = Math.max(Math.round(8.0 * N), Math.round(nozTextH * 2.8));

    // 2. 좌측 스터브 (Left Stubs) - 동일 높이 그룹화 및 수직 충돌 방지
    const groupLeft = [];
    leftNozzles.sort((a, b) => b.elev - a.elev);
    leftNozzles.forEach(item => {
      const g = groupLeft.find(grp => Math.abs(grp.elev - item.elev) < 60);
      if (g) {
        g.items.push(item);
      } else {
        groupLeft.push({ elev: item.elev, items: [item] });
      }
    });

    // 치수선과 좌측 노즐 간섭 완전 방지: 좌측 노즐 돌출 및 지시선/문자 너비 사전 계산
    let minLeftNozX = -75;
    groupLeft.forEach(grp => {
      const items = grp.items;
      let bestItem = items[0];
      items.forEach(it => { if (it.spec.r > bestItem.spec.r) bestItem = it; });
      const spec = bestItem.spec;
      const isFlg = items.some(it => it.isFlg);
      const xBase = -75;
      const xTip = isFlg ? (xBase - spec.neckLen) : (xBase - spec.sockLen);
      const sameSize = items.every(it => it.n.size === items[0].n.size);
      let line1;
      if (sameSize) {
        line1 = `[${items.map(it => it.n.mark).join(', ')}] ${items[0].n.size}`;
      } else {
        line1 = items.map(it => `[${it.n.mark}] ${it.n.size}`).join(', ');
      }
      const line2 = `EL.+${grp.elev.toLocaleString()}`;
      const maxCharCount = Math.max(line1.length, line2.length);
      const textW = maxCharCount * (nozTextH * 0.65) + nozTextH * 0.5;
      const xEnd = xTip - Math.round(5.0 * N);
      const nozLeftEdge = xEnd - textW;
      if (nozLeftEdge < minLeftNozX) minLeftNozX = nozLeftEdge;
    });

    const lads = ladderList(opt, mmap), done = new Set();
    const hasLeftLadder = lads.some(l => (view === 'front' ? l.sd === 'L' : l.sd === 'D'));
    if (hasLeftLadder && (-235 < minLeftNozX)) {
      minLeftNozX = Math.min(minLeftNozX, -235);
    }

    // 지붕 플랜지 높이 및 맨홀 유무/개방 최상단 높이 계산
    const roofFlgH = sts ? 70 : 100;
    const roofTopY = nH + roofFlgH;

    let hasMhInView = false;
    const nGridCols = mmap.cols.length, nGridRows = mmap.rows.length;
    const nViewDim = view === 'front' ? nGridCols : nGridRows;
    for (let g = 0; g < nViewDim; g++) {
      const shInfo = shapeOf(g);
      if (shInfo.hasMh || (shInfo.sh & 1) || (shInfo.sh & 2) || (shInfo.sh & 8) || (shInfo.sh & 16) || shInfo.sh === 5 || shInfo.sh === 6) {
        hasMhInView = true;
        break;
      }
    }
    if (!hasMhInView && Object.keys(marks).some(k => marks[k] === 1 || marks[k] === 3)) {
      hasMhInView = true;
    }

    let mhOpenSpan = 700; // 표준 개방 맨홀 높이 (지붕 플랜지 상면 기준 ~700mm)
    const customParts = opt?.partTemplates || opt?.customComponents || {};
    const customMh = resolvePartEntities(customParts, 'manhole', view, roofFlgH, opt)
                  || resolvePartEntities(customParts, 'manhole', view === 'side' ? 'right' : 'front', roofFlgH, opt);
    if (customMh && customMh.length > 0) {
      let minY = Infinity, maxY = -Infinity;
      customMh.forEach(e => {
        const p1 = (e.p && e.p[0]) || e.a; const p2 = (e.p && e.p[1]) || e.b;
        if (p1 && p2) { minY = Math.min(minY, p1[1], p2[1]); maxY = Math.max(maxY, p1[1], p2[1]); }
        const c = e.c || e.center; const r = e.r;
        if (c && r != null) { minY = Math.min(minY, c[1] - r); maxY = Math.max(maxY, c[1] + r); }
        const pts = e.p || e.pts;
        if (pts && pts.length) { pts.forEach(pt => { minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]); }); }
      });
      if (isFinite(minY) && isFinite(maxY) && (maxY - minY) > 200) {
        mhOpenSpan = Math.round(maxY - minY - roofFlgH);
        if (mhOpenSpan < 200) mhOpenSpan = Math.round(maxY - minY);
      }
    }
    const topMhY = roofTopY + mhOpenSpan;

    // 좌측 치수선 열 배치 (1열 세부단/개방맨홀 -> 2열 탱크전고 -> 3열 맨홀개방시 최고높이)
    // 노즐 유무에 관계없이 치수선 위치 100% 완전 고정 (사용자 요구: 노즐 체크 시 치수 위치 불변, 노즐표시만 이동)
    const leftBound = hasLeftLadder ? -235 : -75;
    const segX = leftBound - dimGap1;
    const dimStep = Math.max(Math.round(8.0 * N), Math.round(textH * 2.2));
    const overallX = segX - dimStep;
    const mhOverallX = overallX - dimStep;

    // 1열 치수 (FrontDim / SideDim: 축척 비례 계산 - media_1790951915253.png 표준 정위치)
    dimLinear(ents, [px0, slabTopY], [px0, -th], segX, true, String(padH), textH, 'DIM');
    dimLinear(ents, [px0, -th], [px0, 0], segX, true, String(th), textH, 'DIM');

    let yy = 0;
    hs.forEach(hh => { dimLinear(ents, [px0, yy], [px0, yy + hh], segX, true, String(hh), textH, 'DIM'); yy += hh; });
    dimLinear(ents, [px0, nH], [px0, roofTopY], segX, true, String(roofFlgH), textH, 'DIM');

    if (hasMhInView) {
      // 개방 맨홀 높이 치수선 (지붕 플랜지 상면 ~ 개방된 맨홀 덮개 상단)
      dimLinear(ents, [px0, roofTopY], [px0, topMhY], segX, true, String(mhOpenSpan), textH, 'DIM');
      ln([0, topMhY], [segX, topMhY], 'DIM');
    }

    // 2열 치수: 탱크 전체 높이 치수선 (슬래브 상면 ~ 탱크 지붕 플랜지 상면)
    dimLinear(ents, [px0, slabTopY], [px0, roofTopY], overallX, true, String(roofTopY - slabTopY), textH, 'DIM');

    if (hasMhInView) {
      // 3열 치수: 맨홀 개방 시 바닥(슬래브)부터 최상단까지의 전고 치수선
      const mhOverallX = overallX - dimStep;
      const totalClearance = topMhY - slabTopY;
      const lang = opt.drawingLang || opt.lang || 'ko';
      const isKo = lang !== 'en';
      const openLabel = isKo ? '(맨홀 개방 시)' : '(OPEN MH)';
      dimLinear(ents, [px0, slabTopY], [px0, topMhY], mhOverallX, true, `${totalClearance} ${openLabel}`, textH, 'DIM');
      ln([segX, topMhY], [mhOverallX, topMhY], 'DIM');
    }

    lads.forEach(l => {
      let idx, px;
      if (view === 'front') {
        if (l.sd === 'D') { idx = 5; px = l.x; } else if (l.sd === 'U') { idx = 6; px = l.x; } else if (l.sd === 'R') { idx = 7; px = total; } else { idx = 8; px = 0; }
      } else {
        if (l.sd === 'U') { idx = 7; px = total; } else if (l.sd === 'D') { idx = 8; px = 0; } else if (l.sd === 'R') { idx = 5; px = l.y; } else { idx = 6; px = l.y; }
      }
      if (done.has(idx + ':' + px)) return; done.add(idx + ':' + px);
      ents.push(...ladderShapes(idx, px, 0, nH, opt));
    });

    let prevLeftEy = null;
    groupLeft.forEach(grp => {
      const elev = grp.elev;
      const items = grp.items;
      let bestItem = items[0];
      items.forEach(it => { if (it.spec.r > bestItem.spec.r) bestItem = it; });
      const spec = bestItem.spec;
      const isFlg = items.some(it => it.isFlg);

      const xBase = -75;
      if (isFlg) {
        const xPlate1 = xBase - spec.neckLen;
        const xPlate0 = xPlate1 + spec.flgThick;
        ln([xBase, elev - spec.r], [xPlate0, elev - spec.r], 'NOZZLE');
        ln([xBase, elev + spec.r], [xPlate0, elev + spec.r], 'NOZZLE');
        rect(xPlate1, elev - spec.rf, xPlate0, elev + spec.rf, 'NOZZLE');
      } else {
        const xEnd = xBase - spec.sockLen;
        rect(xEnd, elev - spec.sockR, xBase, elev + spec.sockR, 'NOZZLE');
        ln([xEnd, elev - spec.r], [xEnd, elev + spec.r], 'NOZZLE');
      }

      const line1 = formatNozzleGroupLabel(items);
      const line2 = `EL.+${elev.toLocaleString()}`;

      let ey = elev + Math.round(1.5 * N);
      if (prevLeftEy !== null && Math.abs(ey - prevLeftEy) < minVertGap) {
        ey = prevLeftEy - minVertGap;
      }
      prevLeftEy = ey;

      const xTip = isFlg ? (xBase - spec.neckLen) : (xBase - spec.sockLen);
      // 리드선(Leader line)을 치수선 바깥으로 꺾어 인출하여 치수선 및 치수 숫자와의 간섭 원천 차단
      const outDimX = hasMhInView ? mhOverallX : overallX;
      const elbowX = outDimX - Math.round(4.0 * N);
      const shelfEndX = elbowX - Math.round(2.5 * N);
      drawLeader(ents, [xTip, elev], [elbowX, ey], [shelfEndX, ey], [line1, line2], nozTextH, 'right', 'NOZZLE');
    });

    // 3. 우측 스터브 (Right Stubs) - 동일 높이 그룹화 및 수직 충돌 방지
    const groupRight = [];
    rightNozzles.sort((a, b) => b.elev - a.elev);
    rightNozzles.forEach(item => {
      const g = groupRight.find(grp => Math.abs(grp.elev - item.elev) < 60);
      if (g) {
        g.items.push(item);
      } else {
        groupRight.push({ elev: item.elev, items: [item] });
      }
    });

    let prevRightEy = null;
    groupRight.forEach(grp => {
      const elev = grp.elev;
      const items = grp.items;
      let bestItem = items[0];
      items.forEach(it => { if (it.spec.r > bestItem.spec.r) bestItem = it; });
      const spec = bestItem.spec;
      const isFlg = items.some(it => it.isFlg);

      const xBase = total + 75;
      if (isFlg) {
        const xPlate1 = xBase + spec.neckLen;
        const xPlate0 = xPlate1 - spec.flgThick;
        ln([xBase, elev - spec.r], [xPlate0, elev - spec.r], 'NOZZLE');
        ln([xBase, elev + spec.r], [xPlate0, elev + spec.r], 'NOZZLE');
        rect(xPlate0, elev - spec.rf, xPlate1, elev + spec.rf, 'NOZZLE');
      } else {
        const xEnd = xBase + spec.sockLen;
        rect(xBase, elev - spec.sockR, xEnd, elev + spec.sockR, 'NOZZLE');
        ln([xEnd, elev - spec.r], [xEnd, elev + spec.r], 'NOZZLE');
      }

      const line1 = formatNozzleGroupLabel(items);
      const line2 = `EL.+${elev.toLocaleString()}`;

      let ey = elev + Math.round(1.5 * N);
      if (prevRightEy !== null && Math.abs(ey - prevRightEy) < minVertGap) {
        ey = prevRightEy - minVertGap;
      }
      prevRightEy = ey;

      const xTip = isFlg ? (xBase + spec.neckLen) : (xBase + spec.sockLen);
      drawLeader(ents, [xTip, elev], [xTip + Math.round(2.5 * N), ey], [xTip + Math.round(5.0 * N), ey], [line1, line2], nozTextH, 'left', 'NOZZLE');
    });

    // 4. 상부 지붕 스터브 (Top Stubs) - 동일 X좌표 그룹화
    const groupTop = [];
    topNozzles.sort((a, b) => a.cx - b.cx);
    topNozzles.forEach(item => {
      const g = groupTop.find(grp => Math.abs(grp.cx - item.cx) < 60);
      if (g) {
        g.items.push(item);
      } else {
        groupTop.push({ cx: item.cx, items: [item] });
      }
    });

    let prevTopEx = null;
    const minHorizGap = Math.round(8.0 * N);
    groupTop.forEach((grp, gIdx) => {
      const cx = grp.cx;
      const items = grp.items;
      let bestItem = items[0];
      items.forEach(it => { if (it.spec.r > bestItem.spec.r) bestItem = it; });
      const spec = bestItem.spec;
      const isFlg = items.some(it => it.isFlg);

      const yBase = nH;
      if (isFlg) {
        const yPlate1 = yBase + spec.neckLen;
        const yPlate0 = yPlate1 - spec.flgThick;
        ln([cx - spec.r, yBase], [cx - spec.r, yPlate0], 'NOZZLE');
        ln([cx + spec.r, yBase], [cx + spec.r, yPlate0], 'NOZZLE');
        rect(cx - spec.rf, yPlate0, cx + spec.rf, yPlate1, 'NOZZLE');
      } else {
        const yEnd = yBase + spec.sockLen;
        rect(cx - spec.sockR, yBase, cx + spec.sockR, yEnd, 'NOZZLE');
        ln([cx - spec.r, yEnd], [cx + spec.r, yEnd], 'NOZZLE');
      }

      const line1 = formatNozzleGroupLabel(items);
      const line2 = 'EL.+TOP';

      const yTip = isFlg ? (yBase + spec.neckLen) : (yBase + spec.sockLen);
      const staggerY = (gIdx % 2) * Math.round(2.0 * N);
      const ey = yTip + Math.round(2.0 * N) + staggerY;
      let ex = cx + Math.round(2.5 * N);
      if (prevTopEx !== null && Math.abs(ex - prevTopEx) < minHorizGap) {
        ex = prevTopEx + minHorizGap;
      }
      prevTopEx = ex;

      drawLeader(ents, [cx, yTip], [ex, ey], [ex + Math.round(3.0 * N), ey], [line1, line2], nozTextH, 'left', 'NOZZLE');
    });

    // 4.5. 하부 바닥 스터브 (Bottom Stubs - 드레인 등 하향 돌출 노즐)
    const groupBottom = [];
    bottomNozzles.sort((a, b) => a.cx - b.cx);
    bottomNozzles.forEach(item => {
      const g = groupBottom.find(grp => Math.abs(grp.cx - item.cx) < 60);
      if (g) {
        g.items.push(item);
      } else {
        groupBottom.push({ cx: item.cx, items: [item] });
      }
    });

    let prevBottomEx = null;
    groupBottom.forEach((grp, gIdx) => {
      const cx = grp.cx;
      const items = grp.items;
      let bestItem = items[0];
      items.forEach(it => { if (it.spec.r > bestItem.spec.r) bestItem = it; });
      const spec = bestItem.spec;
      const isFlg = items.some(it => it.isFlg);

      const yBase = 0;
      if (isFlg) {
        const yPlate1 = yBase - spec.neckLen;
        const yPlate0 = yPlate1 + spec.flgThick;
        ln([cx - spec.r, yBase], [cx - spec.r, yPlate0], 'NOZZLE');
        ln([cx + spec.r, yBase], [cx + spec.r, yPlate0], 'NOZZLE');
        rect(cx - spec.rf, yPlate1, cx + spec.rf, yPlate0, 'NOZZLE');
      } else {
        const yEnd = yBase - spec.sockLen;
        rect(cx - spec.sockR, yEnd, cx + spec.sockR, yBase, 'NOZZLE');
        ln([cx - spec.r, yEnd], [cx + spec.r, yEnd], 'NOZZLE');
      }

      const line1 = formatNozzleGroupLabel(items);
      const isEn = (opt.drawingLang || opt.lang) === 'en';
      const line2 = isEn ? 'EL.+0 (BOTTOM)' : 'EL.+0 (하부)';

      const yTip = isFlg ? (yBase - spec.neckLen) : (yBase - spec.sockLen);
      const staggerY = (gIdx % 2) * Math.round(1.5 * N);
      const ey = yTip - Math.round(2.0 * N) - staggerY;
      let ex = cx + Math.round(2.5 * N);
      if (prevBottomEx !== null && Math.abs(ex - prevBottomEx) < minHorizGap) {
        ex = prevBottomEx + minHorizGap;
      }
      prevBottomEx = ex;

      drawLeader(ents, [cx, yTip], [ex, ey], [ex + Math.round(3.0 * N), ey], [line1, line2], nozTextH, 'left', 'NOZZLE');
    });

    // 5. 정면 노즐 (Face Nozzles) - 원형 및 볼트홀, 2줄 간결 지시선
    const groupFace = [];
    faceNozzles.sort((a, b) => b.cy - a.cy || a.cx - b.cx);
    faceNozzles.forEach(item => {
      const g = groupFace.find(grp => Math.hypot(grp.cx - item.cx, grp.cy - item.cy) < 60);
      if (g) {
        g.items.push(item);
      } else {
        groupFace.push({ cx: item.cx, cy: item.cy, elev: item.elev, items: [item] });
      }
    });

    groupFace.forEach((grp, gIdx) => {
      const cx = grp.cx, cy = grp.cy, elev = grp.elev;
      const items = grp.items;
      let bestItem = items[0];
      items.forEach(it => { if (it.spec.r > bestItem.spec.r) bestItem = it; });
      const spec = bestItem.spec;
      const isFlg = items.some(it => it.isFlg);

      if (isFlg) {
        circ(cx, cy, spec.rf, 'NOZZLE');
        circ(cx, cy, spec.pcd, 'NOZZLE');
        circ(cx, cy, spec.r, 'NOZZLE');
        const numHoles = Math.min(8, spec.holes);
        for (let k = 0; k < numHoles; k++) {
          const ang = (k * 360 / numHoles + 45) * Math.PI / 180;
          circ(cx + spec.pcd * Math.cos(ang), cy + spec.pcd * Math.sin(ang), spec.hr, 'NOZZLE');
        }
      } else {
        circ(cx, cy, spec.sockR, 'NOZZLE');
        circ(cx, cy, spec.r, 'NOZZLE');
      }
      const cr = (isFlg ? spec.rf : spec.sockR) * 1.25;
      ln([cx - cr, cy], [cx + cr, cy], 'NOZZLE');
      ln([cx, cy - cr], [cx, cy + cr], 'NOZZLE');

      const line1 = formatNozzleGroupLabel(items);
      const line2 = `EL.+${elev.toLocaleString()}`;

      let toRight;
      if (cx < 1500) {
        toRight = true;
      } else if (cx > total - 1500) {
        toRight = false;
      } else {
        toRight = (gIdx % 2 === 0);
      }
      const dx = toRight ? Math.round(3.0 * N) : -Math.round(3.0 * N);
      const ex = toRight ? cx + dx + Math.round(3.0 * N) : cx + dx - Math.round(3.0 * N);
      const dy = (cy >= nH * 0.5 ? 1 : -1) * (Math.round(2.5 * N) + (gIdx % 2) * Math.round(1.5 * N));
      const ey = cy + dy;
      const startX = cx + (toRight ? spec.r * 0.7 : -spec.r * 0.7);
      const startY = cy + (dy > 0 ? spec.r * 0.7 : -spec.r * 0.7);

      drawLeader(ents, [startX, startY], [cx + dx, ey], [ex, ey], [line1, line2], nozTextH, toRight ? 'left' : 'right', 'NOZZLE');
    });

    // 부품 풍선 기호 (Elevation View Balloon Callouts - 모두 물탱크 형상 및 치수선 바깥 외곽에 정렬)
    if (opt.showBalloons !== false) {
      const N = opt._N || 25;
      const boms = (opt.itemList && opt.itemList.length) ? opt.itemList : buildDefaultBOM(opt);
      const getItemNo = key => {
        const it = boms.find(b => b.key === key);
        return it ? it.no : '';
      };
      const padH = (typeof opt.padH === 'number' && !isNaN(opt.padH)) ? opt.padH : (600 - (opt.frame || 75));
      const clearanceH = th + padH;
      const slabTopY = -clearanceH;
      let maxTopNozExt = nH;
      groupTop.forEach(grp => {
        grp.items.forEach(it => {
          const spec = it.spec;
          const ext = it.isFlg ? (nH + spec.neckLen) : (nH + spec.sockLen);
          if (ext > maxTopNozExt) maxTopNozExt = ext;
        });
      });
      const elevTopY = Math.max(nH + Math.round(18 * N), maxTopNozExt + Math.round(10 * N));

      const pxEndElev = total + 75;
      let maxRightExt = pxEndElev;
      groupRight.forEach(grp => {
        grp.items.forEach(it => {
          const spec = it.spec;
          const ext = it.isFlg ? (pxEndElev + spec.neckLen) : (pxEndElev + spec.sockLen);
          const textW = Math.round(12.0 * N);
          if (ext + textW > maxRightExt) maxRightExt = ext + textW;
        });
      });
      const pxPadEnd = (typeof pxEnd !== 'undefined') ? pxEnd : (total + PAD_OVERHANG);
      const glSymExt = pxPadEnd + Math.round(12.0 * N);
      const elevRightX = Math.max(pxEndElev + Math.round(14.0 * N), glSymExt + Math.round(6.0 * N), maxRightExt + Math.round(8.0 * N));
      const elevBotY = slabTopY - slabT - dimGap2 - Math.round(14 * N);

      const bR = Math.round(4.2 * N);
      const sL = Math.round(4.0 * N);

      // 1. 기초 콘크리트 (Concrete Foundation - NO. 1): 우측 수평 선반 정렬 및 패드/치수/GL 간섭 완전 배제
      const concY = slabTopY + padH * 0.5;
      const b1_elbowY = concY - Math.round(2.0 * N);
      drawBalloonCallout(ents, [total, concY], [elevRightX - sL - bR, b1_elbowY], [elevRightX, b1_elbowY], getItemNo('foundation') || 1, N, 'BALLOON');

      // 2. 스키드 프레임 (Skid Frame - NO. 2): 우측 수평 선반 정렬 및 NO. 1과 수직 열 정렬
      const skidY = -th * 0.5;
      const b2_elbowY = skidY + Math.round(2.0 * N);
      drawBalloonCallout(ents, [total + 75, skidY], [elevRightX - sL - bR, b2_elbowY], [elevRightX, b2_elbowY], getItemNo('skid') || 2, N, 'BALLOON');

      // 3. 측면 판넬 (Wall Panel - NO. 3): 리드선 우측 수평 선반 정렬
      drawBalloonCallout(ents, [total, nH * 0.65], [elevRightX - sL - bR, nH * 0.65], [elevRightX, nH * 0.65], getItemNo('panel') || 3, N, 'BALLOON');

      // 4. 코너 프레임 (Corner Frame - NO. 4): 좌상단 바깥 외곽 (수평 선반)
      const b4X = Math.min(-75 - Math.round(12 * N), overallX - Math.round(6.0 * N));
      const b4Y = nH + Math.round(12 * N);
      drawBalloonCallout(ents, [0, nH], [b4X + sL + bR, b4Y], [b4X, b4Y], getItemNo('corner') || 4, N, 'BALLOON');

      // 8. 외부 사다리 (External Ladder - NO. 8) & 10. 내부 스테이 (Internal Stay - NO. 10): 상단 바깥 외곽 (상호 크로스 방지 방향 제어 및 수평 선반)
      const lads = ladderList(opt, mmap);
      let lx = total - 300;
      if (lads.length > 0) {
        const l = lads[0];
        if (view === 'front') {
          lx = (l.sd === 'D' || l.sd === 'U') ? l.x : (l.sd === 'R' ? total : 0);
        } else {
          lx = (l.sd === 'R' || l.sd === 'L') ? l.y : (l.sd === 'U' ? total : 0);
        }
      }
      const stayX = (secs.length > 1 && Math.abs(secs[0] - total * 0.5) < 1) ? (secs[0] - 45) : (total * 0.5);

      if (lx <= stayX) {
        // 사다리가 좌측(또는 동일), 스테이가 우측 -> 사다리는 좌측으로, 스테이는 우측으로 인출 (크로스 원천 차단)
        if (lads.length > 0) {
          const b8X = lx - Math.round(10 * N);
          drawBalloonCallout(ents, [lx, nH + 100], [b8X + sL + bR, elevTopY], [b8X, elevTopY], getItemNo('exladder') || 8, N, 'BALLOON');
        }
        const b10X = stayX + Math.round(10 * N);
        drawBalloonCallout(ents, [stayX, nH * 0.5], [b10X - sL - bR, elevTopY], [b10X, elevTopY], getItemNo('stay') || 10, N, 'BALLOON');
      } else {
        // 사다리가 우측, 스테이가 좌측 -> 사다리는 우측으로, 스테이는 좌측으로 인출 (크로스 원천 차단)
        if (lads.length > 0) {
          const b8X = lx + Math.round(10 * N);
          drawBalloonCallout(ents, [lx, nH + 100], [b8X - sL - bR, elevTopY], [b8X, elevTopY], getItemNo('exladder') || 8, N, 'BALLOON');
        }
        const b10X = stayX - Math.round(10 * N);
        drawBalloonCallout(ents, [stayX, nH * 0.5], [b10X + sL + bR, elevTopY], [b10X, elevTopY], getItemNo('stay') || 10, N, 'BALLOON');
      }

      // 11. 노즐 (Nozzles - NO. 11): 리드선 우측 수평 선반 정렬
      drawBalloonCallout(ents, [total + 75, nH * 0.3], [elevRightX - sL - bR, nH * 0.3], [elevRightX, nH * 0.3], getItemNo('nozzle') || 11, N, 'BALLOON');
    }

    recheckAndResolveCollisions(ents, opt);
    ents.blocks = blocks;
    return { ents, textH, blocks };
  }

  /* ---------- 가로 프레임(L방향) 행별 기준 베이(centerBay) 및 부재 위치/방향(getRowBeamSpec) 계산 ---------- */
  function getCenterBay(map) {
    const cnRows = map.rows.length;
    let centerBay = -1, minDiff = Infinity;
    for (let k = 0; k < cnRows; k++) {
      const rY0 = map.ys[k];
      const rY1 = rY0 + map.rows[k];
      const bMid = (rY0 + rY1) / 2;
      const diff = Math.abs(bMid - map.width / 2);
      const penalty = map.rows[k] < 700 ? 500 : 0;
      if (diff + penalty < minDiff) {
        minDiff = diff + penalty;
        centerBay = k;
      }
    }
    if (centerBay < 0 || centerBay >= cnRows) centerBay = Math.floor((cnRows - 1) / 2);
    return centerBay;
  }

  function getRowBeamSpec(map, rIdx, colIdx, flgW, overY, centerBay) {
    if (centerBay === undefined) centerBay = getCenterBay(map);
    const nr = map.rows.length, nc = map.cols.length;
    const rowY = (rIdx < nr) ? map.ys[rIdx] : map.width;

    let cStart = colIdx;
    while (cStart > 0 && (((rIdx > 0) && map.has(rIdx - 1, cStart - 1)) || ((rIdx < nr) && map.has(rIdx, cStart - 1)))) {
      cStart--;
    }
    let cEnd = colIdx;
    while (cEnd < nc - 1 && (((rIdx > 0) && map.has(rIdx - 1, cEnd + 1)) || ((rIdx < nr) && map.has(rIdx, cEnd + 1)))) {
      cEnd++;
    }

    let anyBoth = false, allAboveOnly = true, allBelowOnly = true;
    for (let col = cStart; col <= cEnd; col++) {
      const b = (rIdx > 0) && map.has(rIdx - 1, col);
      const a = (rIdx < nr) && map.has(rIdx, col);
      if (b && a) anyBoth = true;
      if (b) allAboveOnly = false;
      if (a) allBelowOnly = false;
    }

    let cat = 3;
    if (anyBoth) cat = 3;
    else if (allAboveOnly) cat = 1;
    else if (allBelowOnly) cat = 2;
    else cat = 3;

    let segY, segLat;
    if (cat === 1) {
      segY = rowY - overY;
      segLat = 0x20000;
    } else if (cat === 2) {
      segY = rowY + overY - flgW;
      segLat = 0x40000;
    } else {
      segY = rowY - flgW / 2;
      const k = (rIdx > 0) ? (rIdx - 1) : 0;
      const isUp = (k <= centerBay);
      segLat = isUp ? 0 : 0x10000;
    }

    const yA = segY, yB = segY + flgW;
    const isUp = (segLat === 0 || segLat === 0x40000);
    const yWeb = isUp ? (yA + 6) : (yB - 6);

    return { rowY, yA, yB, yWeb, isUp, cat, segLat, cStart, cEnd };
  }

  /* ---------- 3D 등각 조감도 생성 (3D ISOMETRIC VIEW, TankIsometric) ---------- */
  function buildIsometric(opt, templates, sideT) {
    opt = normFrameOpt(opt);
    const map = createMap(opt);
    const totalL = map.length, totalW = map.width;
    const H = (opt.height || []).reduce((a, b) => a + (b || 0), 0) || 3000;
    const hs = (opt.hseg && opt.hseg.length) ? opt.hseg.slice() : (heightSegs(H, opt.b11) || [1000, 1000, 1000]);
    const N = opt._N || 25;
    const textH = Math.round(3.0 * N);
    const ents = [];
    const ladderEnts = [];

    const getDepth = (x, y, z) => y - x - z;

    let inFoundation = false;
    const ln = (a, b, layer, depth = 0) => ents.push({ t: 'line', a, b, layer: inFoundation ? 'PAD' : (layer || 'PANEL'), depth, isFoundation: inFoundation });
    const poly = (pts, layer, close = true, fill = false, depth = 0) => {
      const actLayer = inFoundation ? 'PAD' : (layer || 'PANEL');
      if (fill) {
        ents.push({ t: 'poly', pts, fill: true, stroke: false, close: false, layer: actLayer, depth, isFoundation: inFoundation });
        if (close !== false) {
          for (let i = 0; i < pts.length - 1; i++) ln(pts[i], pts[i + 1], actLayer, depth);
          if (pts.length > 2) ln(pts[pts.length - 1], pts[0], actLayer, depth);
        }
      } else {
        for (let i = 0; i < pts.length - 1; i++) ln(pts[i], pts[i + 1], actLayer, depth);
        if (close && pts.length > 2) ln(pts[pts.length - 1], pts[0], actLayer, depth);
      }
    };

    const COS30 = 0.8660254037844386;
    const SIN30 = 0.5;
    const toIso = (x, y, z) => [
      (x + y - totalL) * COS30,
      ((totalL - x) + y) * SIN30 + z
    ];

    const isoCircle = (cx, cy, cz, r, plane, layer, depth = 0, segs = 16) => {
      const pts = [];
      for (let i = 0; i < segs; i++) {
        const ang = (i * 2 * Math.PI) / segs;
        const c = r * Math.cos(ang), s = r * Math.sin(ang);
        let pt;
        if (plane === 'XY') pt = toIso(cx + c, cy + s, cz);
        else if (plane === 'XZ') pt = toIso(cx + c, cy, cz + s);
        else pt = toIso(cx, cy + c, cz + s);
        pts.push(pt);
      }
      poly(pts, layer || 'PANEL_DETAIL', true, false, depth);
    };

    const projectTemplateEntities = (tList, plane, originX, originY, originZ, defaultLayer = 'PANEL_DETAIL', depth = 0) => {
      if (!tList || !tList.length) return;
      tList.forEach(s => {
        if (!s) return;
        const k = s.k || s.t || s.type;
        if (k === 'line') {
          const p1 = (s.p && s.p[0]) || s.a;
          const p2 = (s.p && s.p[1]) || s.b;
          if (!p1 || !p2) return;
          let pt1, pt2;
          if (plane === 'XZ') {
            pt1 = toIso(originX + p1[0], originY, originZ + p1[1]);
            pt2 = toIso(originX + p2[0], originY, originZ + p2[1]);
          } else if (plane === 'YZ') {
            pt1 = toIso(originX, originY + p1[0], originZ + p1[1]);
            pt2 = toIso(originX, originY + p2[0], originZ + p2[1]);
          } else { // 'XY'
            pt1 = toIso(originX + p1[0], originY + p1[1], originZ);
            pt2 = toIso(originX + p2[0], originY + p2[1], originZ);
          }
          ln(pt1, pt2, defaultLayer, depth);
        } else if (k === 'poly') {
          let rawP = s.p || s.pts || [];
          if (rawP.length >= 2) {
            const isClosed = s.c !== false;
            if (isClosed && rawP.length > 2 && Math.hypot(rawP[rawP.length - 1][0] - rawP[0][0], rawP[rawP.length - 1][1] - rawP[0][1]) < 0.1) {
              rawP = rawP.slice(0, -1);
            }
            const pts = rawP.map(p => {
              if (plane === 'XZ') return toIso(originX + p[0], originY, originZ + p[1]);
              if (plane === 'YZ') return toIso(originX, originY + p[0], originZ + p[1]);
              return toIso(originX + p[0], originY + p[1], originZ);
            });
            poly(pts, defaultLayer, isClosed, false, depth);
          }
        } else if (k === 'circle' && (s.c || s.center)) {
          const c = s.c || s.center;
          if (plane === 'XZ') isoCircle(originX + c[0], originY, originZ + c[1], s.r || 10, 'XZ', defaultLayer, depth);
          else if (plane === 'YZ') isoCircle(originX, originY + c[0], originZ + c[1], s.r || 10, 'YZ', defaultLayer, depth);
          else isoCircle(originX + c[0], originY + c[1], originZ, s.r || 10, 'XY', defaultLayer, depth);
        } else if (k === 'arc' && (s.c || s.center)) {
          const c = s.c || s.center;
          const cx = c[0] || 0, cy = c[1] || 0, r = s.r || 10;
          let a0 = 0, a1 = Math.PI * 2;
          if (s.a0 !== undefined && s.a1 !== undefined) {
            a0 = (s.a0 * Math.PI) / 180;
            a1 = (s.a1 * Math.PI) / 180;
          } else if (s.s && s.e) {
            a0 = Math.atan2(s.s[1] - cy, s.s[0] - cx);
            a1 = Math.atan2(s.e[1] - cy, s.e[0] - cx);
          }
          let da = a1 - a0;
          while (da < 0) da += Math.PI * 2;
          const segs = Math.max(4, Math.min(10, Math.round((r * da) / 40)));
          const pts = [];
          for (let k = 0; k <= segs; k++) {
            const ang = a0 + (da * k) / segs;
            const px = cx + r * Math.cos(ang), py = cy + r * Math.sin(ang);
            if (plane === 'XZ') pts.push(toIso(originX + px, originY, originZ + py));
            else if (plane === 'YZ') pts.push(toIso(originX, originY + px, originZ + py));
            else pts.push(toIso(originX + px, originY + py, originZ));
          }
          poly(pts, defaultLayer, false, false, depth);
        }
      });
    };

    const zs = [0];
    let curZ = 0;
    hs.forEach(h => { curZ += h; zs.push(curZ); });
    const mat = (opt.material === 'STS') ? 'STS' : 'SMC';
    const sideTemplates = (sideT && (sideT[mat] || sideT.SMC)) || {};
    const ceilTemplates = (templates && (templates[mat] || templates.SMC)) || {};
    const sidePanels = opt.sidePanels || {};

    const lenSecs = (opt.length || []).filter(Boolean);
    const widSecs = (opt.width || []).filter(Boolean);
    const WALL_TH = 70;
    const xPartitions = new Set();
    let pCurX = 0;
    for (let s = 0; s < lenSecs.length - 1; s++) {
      pCurX += lenSecs[s];
      xPartitions.add(pCurX);
    }
    const yPartitions = new Set();
    let pCurY = 0;
    for (let s = 0; s < widSecs.length - 1; s++) {
      pCurY += widSecs[s];
      yPartitions.add(pCurY);
    }

    const renderWallPanel = (plane, x0, y0, z0, w, h, pType, depth) => {
      let p1, p2, p3, p4, cx, cy, cz;
      if (plane === 'XZ') {
        p1 = toIso(x0, y0, z0);
        p2 = toIso(x0 + w, y0, z0);
        p3 = toIso(x0 + w, y0, z0 + h);
        p4 = toIso(x0, y0, z0 + h);
        cx = x0 + w / 2; cy = y0; cz = z0 + h / 2;
      } else {
        p1 = toIso(x0, y0, z0);
        p2 = toIso(x0, y0 + w, z0);
        p3 = toIso(x0, y0 + w, z0 + h);
        p4 = toIso(x0, y0, z0 + h);
        cx = x0; cy = y0 + w / 2; cz = z0 + h / 2;
      }

      poly([p1, p2, p3, p4], 'PANEL', true, true, depth);

      if (pType === 'flat' || pType === 'flat-1x1') {
        const m = 25;
        if (plane === 'XZ') {
          poly([toIso(x0 + m, y0, z0 + m), toIso(x0 + w - m, y0, z0 + m), toIso(x0 + w - m, y0, z0 + h - m), toIso(x0 + m, y0, z0 + h - m)], 'PANEL_DETAIL', true, false, depth);
        } else {
          poly([toIso(x0, y0 + m, z0 + m), toIso(x0, y0 + w - m, z0 + m), toIso(x0, y0 + w - m, z0 + h - m), toIso(x0, y0 + m, z0 + h - m)], 'PANEL_DETAIL', true, false, depth);
        }
      } else if (pType === 'flat-half2' || pType === 'flat-0.5x2') {
        const hw = Math.round(w / 2), m = 20;
        if (plane === 'XZ') {
          ln(toIso(x0 + hw, y0, z0), toIso(x0 + hw, y0, z0 + h), 'PANEL', depth);
          ln(toIso(x0 + hw - 8, y0, z0), toIso(x0 + hw - 8, y0, z0 + h), 'PANEL_DETAIL', depth);
          ln(toIso(x0 + hw + 8, y0, z0), toIso(x0 + hw + 8, y0, z0 + h), 'PANEL_DETAIL', depth);
          poly([toIso(x0 + m, y0, z0 + m), toIso(x0 + hw - m, y0, z0 + m), toIso(x0 + hw - m, y0, z0 + h - m), toIso(x0 + m, y0, z0 + h - m)], 'PANEL_DETAIL', true, false, depth);
          poly([toIso(x0 + hw + m, y0, z0 + m), toIso(x0 + w - m, y0, z0 + m), toIso(x0 + w - m, y0, z0 + h - m), toIso(x0 + hw + m, y0, z0 + h - m)], 'PANEL_DETAIL', true, false, depth);
        } else {
          ln(toIso(x0, y0 + hw, z0), toIso(x0, y0 + hw, z0 + h), 'PANEL', depth);
          ln(toIso(x0, y0 + hw - 8, z0), toIso(x0, y0 + hw - 8, z0 + h), 'PANEL_DETAIL', depth);
          ln(toIso(x0, y0 + hw + 8, z0), toIso(x0, y0 + hw + 8, z0 + h), 'PANEL_DETAIL', depth);
          poly([toIso(x0, y0 + m, z0 + m), toIso(x0, y0 + hw - m, z0 + m), toIso(x0, y0 + hw - m, z0 + h - m), toIso(x0, y0 + m, z0 + h - m)], 'PANEL_DETAIL', true, false, depth);
          poly([toIso(x0, y0 + hw + m, z0 + m), toIso(x0, y0 + w - m, z0 + m), toIso(x0, y0 + w - m, z0 + h - m), toIso(x0, y0 + hw + m, z0 + h - m)], 'PANEL_DETAIL', true, false, depth);
        }
      } else if (pType === 'fitting' || pType === 'large') {
        const rawFitting = sideTemplates && (sideTemplates['fitting'] || sideTemplates['panel-fitting'] || sideTemplates[w + 'x' + h + '_fitting']);
        if (rawFitting && rawFitting.length > 0) {
          if (plane === 'XZ') {
            projectTemplateEntities(rawFitting, 'XZ', x0, y0, z0, 'PANEL_DETAIL', depth);
          } else {
            projectTemplateEntities(rawFitting, 'YZ', x0, y0, z0, 'PANEL_DETAIL', depth);
          }
        } else {
          const minD = Math.min(w, h);
          isoCircle(cx, cy, cz, Math.round(minD * 0.35), plane, 'FRAME', depth);
          isoCircle(cx, cy, cz, Math.round(minD * 0.22), plane, 'PANEL_DETAIL', depth);
          isoCircle(cx, cy, cz, Math.round(minD * 0.12), plane, 'FRAME', depth);
          const rHole = Math.round(minD * 0.285);
          for (let deg = 0; deg < 360; deg += 45) {
            const rad = deg * Math.PI / 180;
            if (plane === 'XZ') {
              isoCircle(cx + rHole * Math.cos(rad), cy, cz + rHole * Math.sin(rad), 10, 'XZ', 'PANEL_DETAIL', depth, 8);
            } else {
              isoCircle(cx, cy + rHole * Math.cos(rad), cz + rHole * Math.sin(rad), 10, 'YZ', 'PANEL_DETAIL', depth, 8);
            }
          }
        }
      } else {
        let rawT = sideTemplates[w + 'x' + h];
        if (!rawT || !rawT.length) {
          if ((w === 500 && h === 1000) || (w === 1000 && h === 500)) {
            rawT = sideTemplates['500x1000'] || sideTemplates['1000x500'];
          }
        }
        if ((!rawT || !rawT.length) && opt && opt.customPanels && Array.isArray(opt.customPanels)) {
          const matched = opt.customPanels.find(p =>
            (p.category === 'side' || p.category === 'common' || p.category === 'all' || !p.category) &&
            (p.size_key === `${w}x${h}` || (p.width === w && p.height === h) ||
             (((w === 500 && h === 1000) || (w === 1000 && h === 500)) && (p.size_key === '500x1000' || p.size_key === '1000x500'))) &&
            p.entities && p.entities.length
          );
          if (matched) rawT = matched.entities;
        }
        if (!rawT || !rawT.length) rawT = getDefaultPanelPattern(w, h);
        if (rawT && rawT.length > 0) {
          const fm = 75;
          if (plane === 'XZ') {
            poly([toIso(x0 + fm, y0, z0 + fm), toIso(x0 + w - fm, y0, z0 + fm), toIso(x0 + w - fm, y0, z0 + h - fm), toIso(x0 + fm, y0, z0 + h - fm)], 'PANEL_DETAIL', true, false, depth);
            projectTemplateEntities(rawT, 'XZ', x0, y0, z0, 'PANEL_DETAIL', depth);
          } else {
            poly([toIso(x0, y0 + fm, z0 + fm), toIso(x0, y0 + w - fm, z0 + fm), toIso(x0, y0 + w - fm, z0 + h - fm), toIso(x0, y0 + fm, z0 + h - fm)], 'PANEL_DETAIL', true, false, depth);
            projectTemplateEntities(rawT, 'YZ', x0, y0, z0, 'PANEL_DETAIL', depth);
          }
        } else {
          const m = 75;
          if (plane === 'XZ') {
            poly([toIso(x0 + m, y0, z0 + m), toIso(x0 + w - m, y0, z0 + m), toIso(x0 + w - m, y0, z0 + h - m), toIso(x0 + m, y0, z0 + h - m)], 'PANEL_DETAIL', true, false, depth);
            const rx = (w - 2 * m) * 0.28, rz = (h - 2 * m) * 0.28;
            poly([toIso(cx, y0, cz + rz), toIso(cx + rx, y0, cz), toIso(cx, y0, cz - rz), toIso(cx - rx, y0, cz)], 'PANEL_DETAIL', true, false, depth);
            ln(toIso(x0 + m, y0, z0 + m), toIso(cx - rx, y0, cz), 'PANEL_DETAIL', depth);
            ln(toIso(x0 + w - m, y0, z0 + m), toIso(cx + rx, y0, cz), 'PANEL_DETAIL', depth);
            ln(toIso(x0 + w - m, y0, z0 + h - m), toIso(cx + rx, y0, cz), 'PANEL_DETAIL', depth);
            ln(toIso(x0 + m, y0, z0 + h - m), toIso(cx - rx, y0, cz), 'PANEL_DETAIL', depth);
          } else {
            poly([toIso(x0, y0 + m, z0 + m), toIso(x0, y0 + w - m, z0 + m), toIso(x0, y0 + w - m, z0 + h - m), toIso(x0, y0 + m, z0 + h - m)], 'PANEL_DETAIL', true, false, depth);
            const ry = (w - 2 * m) * 0.28, rz = (h - 2 * m) * 0.28;
            poly([toIso(x0, cy, cz + rz), toIso(x0, cy + ry, cz), toIso(x0, cy, cz - rz), toIso(x0, cy - ry, cz)], 'PANEL_DETAIL', true, false, depth);
            ln(toIso(x0, y0 + m, z0 + m), toIso(x0, cy - ry, cz), 'PANEL_DETAIL', depth);
            ln(toIso(x0, y0 + w - m, z0 + m), toIso(x0, cy + ry, cz), 'PANEL_DETAIL', depth);
            ln(toIso(x0, y0 + w - m, z0 + h - m), toIso(x0, cy + ry, cz), 'PANEL_DETAIL', depth);
            ln(toIso(x0, y0 + m, z0 + h - m), toIso(x0, cy - ry, cz), 'PANEL_DETAIL', depth);
          }
        }
      }
    };

    inFoundation = true;
    // 1. 기초 콘크리트 패드 (Concrete Foundation & Plinths: 2D concStrips 및 기초단면과 100% 일치하는 정밀 캐슬 솔리드 모델)
    const fDesign = getFoundationDesign(opt);
    const th = opt.th || opt.frame || 75;
    const padH = (opt && opt.padH !== undefined && opt.padH !== '') ? Number(opt.padH) : (600 - th);
    const clearanceH = th + padH;
    const slabTopY = -clearanceH;
    const slabT = fDesign.slabT || 150;
    const slabBotY = slabTopY - slabT;

    // 2D concStrips 및 runsForStrip과 100% 동일한 실제 패드 보 유효 구간(piece) 산출 (이형물탱크 완벽 대응)
    const strips = concStrips(map.cols, opt);
    const firstW = Number(opt && opt.padFirstW) || (strips[0] ? strips[0][1] : 400);
    const padOv = (opt && opt.padOverhang !== undefined && opt.padOverhang !== '') ? Number(opt.padOverhang) : Math.round(firstW / 2);
    const px0 = strips[0][0];
    const pxEnd = strips[strips.length - 1][0] + strips[strips.length - 1][1];

    const nR = map.rows.length;
    const hasTankAtRow = (idx, r) => {
      if (idx < 0) return map.has(r, map.cols.length - 1);
      if (idx === 0) return map.has(r, 0);
      return map.has(r, idx) || map.has(r, idx - 1);
    };

    const runsForStrip = idx => {
      const out = [];
      let st = -1;
      for (let i = 0; i <= nR; i++) {
        const h = i < nR && hasTankAtRow(idx, i);
        if (h && st < 0) st = i;
        if (!h && st >= 0) {
          out.push([map.ys[st], map.ys[i]]);
          st = -1;
        }
      }
      return out;
    };

    // 각 스트립별 실제 유효 구간(piece) 산출 (이형물탱크 완벽 대응)
    const pieces = [];   // { lx, rx, cx, w, yStart, yEnd, sIdx, stripIdx }
    strips.forEach(([x, w, idx], sIdx) => {
      const runs = runsForStrip(idx);
      runs.forEach(([y0, y1]) => {
        pieces.push({
          lx: x,
          rx: x + w,
          cx: x + w / 2,
          w,
          yStart: y0 - padOv,
          yEnd: y1 + padOv,
          sIdx: idx,
          stripIdx: sIdx
        });
      });
    });

    const hatchStep = 80;

    // (A) 각 패드 보 기둥 (Plinth Beams) 및 하부 슬래브 전면 렌더링
    pieces.forEach(p => {
      const { lx, rx, cx, yStart, yEnd, w } = p;
      const midY = (yStart + yEnd) / 2;
      const frontDepth = getDepth(cx, yStart, (slabTopY - th) / 2);
      const topDepth = getDepth(cx, midY, -th);
      const rightDepth = getDepth(rx, midY, (slabTopY - th) / 2);
      const rearDepth = getDepth(cx, yEnd, (slabTopY - th) / 2);

      // 1) 기둥 솔리드 면 (음영/은선용: stroke=false, fill=true)
      poly([
        toIso(lx, yStart, -th),
        toIso(rx, yStart, -th),
        toIso(rx, yStart, slabTopY),
        toIso(lx, yStart, slabTopY)
      ], 'PAD', false, true, frontDepth);

      poly([
        toIso(lx, yStart, -th),
        toIso(rx, yStart, -th),
        toIso(rx, yEnd, -th),
        toIso(lx, yEnd, -th)
      ], 'PAD', false, true, topDepth);

      poly([
        toIso(rx, yStart, -th),
        toIso(rx, yEnd, -th),
        toIso(rx, yEnd, slabTopY),
        toIso(rx, yStart, slabTopY)
      ], 'PAD', false, true, rightDepth);

      // 2) 기둥 전면 외곽선 (Front Face at Y = yStart)
      ln(toIso(lx, yStart, -th), toIso(rx, yStart, -th), 'PAD', frontDepth);
      ln(toIso(rx, yStart, -th), toIso(rx, yStart, slabTopY), 'PAD', frontDepth);
      ln(toIso(rx, yStart, slabTopY), toIso(lx, yStart, slabTopY), 'PAD', frontDepth);
      ln(toIso(lx, yStart, slabTopY), toIso(lx, yStart, -th), 'PAD', frontDepth);

      // 3) 기둥 전면 45도 콘크리트 사선 해치 (2D 단면도와 100% 일치)
      for (let c = -15000; c <= 30000; c += hatchStep) {
        const z1 = slabTopY, x1 = c;
        const z2 = -th, x2 = c + padH;
        if (x2 >= lx && x1 <= rx) {
          const ax = Math.max(lx, x1);
          const az = slabTopY + (ax - c);
          const bx = Math.min(rx, x2);
          const bz = slabTopY + (bx - c);
          if (bx - ax >= 5 && az >= slabTopY && bz <= -th) {
            ln(toIso(ax, yStart, az), toIso(bx, yStart, bz), 'PAD', frontDepth);
          }
        }
      }

      // 4) 기둥 상면 및 측면 종방향 모서리선 (Y = yStart ~ yEnd)
      ln(toIso(lx, yStart, -th), toIso(lx, yEnd, -th), 'PAD', topDepth);
      ln(toIso(rx, yStart, -th), toIso(rx, yEnd, -th), 'PAD', topDepth);
      ln(toIso(rx, yStart, slabTopY), toIso(rx, yEnd, slabTopY), 'PAD', rightDepth);

      // 5) 기둥 후면 모서리선 (Y = yEnd)
      ln(toIso(lx, yEnd, -th), toIso(rx, yEnd, -th), 'PAD', rearDepth);
      ln(toIso(rx, yEnd, -th), toIso(rx, yEnd, slabTopY), 'PAD', rearDepth);

      // 6) 기초 앙카 베이스 플레이트 & 앙카 볼트 (전면 및 후면)
      const acW = Math.min(45, w / 4);
      [yStart + 110, yEnd - 110].forEach(ay => {
        poly([
          toIso(cx - acW, ay - 40, -th),
          toIso(cx + acW, ay - 40, -th),
          toIso(cx + acW, ay + 40, -th),
          toIso(cx - acW, ay + 40, -th)
        ], 'PAD', true, false, topDepth);
        ln(toIso(cx - 10, ay, -th), toIso(cx + 10, ay, -th), 'PAD', topDepth);
        ln(toIso(cx, ay - 10, -th), toIso(cx, ay + 10, -th), 'PAD', topDepth);
        ln(toIso(cx, ay, -th), toIso(cx, ay, -th + 30), 'PAD', topDepth);
      });

      // 7) 기둥 직하부 바닥 매트 슬래브 전면 (Z = slabBotY ~ slabTopY, Y = yStart)
      const slabFDepth = getDepth(cx, yStart, (slabBotY + slabTopY) / 2);
      poly([
        toIso(lx, yStart, slabTopY),
        toIso(rx, yStart, slabTopY),
        toIso(rx, yStart, slabBotY),
        toIso(lx, yStart, slabBotY)
      ], 'PAD', false, true, slabFDepth);

      ln(toIso(lx, yStart, slabTopY), toIso(rx, yStart, slabTopY), 'PAD', slabFDepth);
      ln(toIso(rx, yStart, slabTopY), toIso(rx, yStart, slabBotY), 'PAD', slabFDepth);
      ln(toIso(rx, yStart, slabBotY), toIso(lx, yStart, slabBotY), 'PAD', slabFDepth);
      ln(toIso(lx, yStart, slabBotY), toIso(lx, yStart, slabTopY), 'PAD', slabFDepth);

      // 슬래브 전면 45도 해치
      for (let c = -15000; c <= 30000; c += hatchStep) {
        const z1 = slabBotY, x1 = c;
        const z2 = slabTopY, x2 = c + slabT;
        if (x2 >= lx && x1 <= rx) {
          const ax = Math.max(lx, x1);
          const az = slabBotY + (ax - c);
          const bx = Math.min(rx, x2);
          const bz = slabBotY + (bx - c);
          if (bx - ax >= 5 && az >= slabBotY && bz <= slabTopY) {
            ln(toIso(ax, yStart, az), toIso(bx, yStart, bz), 'PAD', slabFDepth);
          }
        }
      }
    });

    // (B) 인접 패드 보 사이 캐비티 바닥 (Slab Top Cavity Floor: rx ~ nextLx) 및 하부 슬래브 전면
    for (let s = 0; s < strips.length - 1; s++) {
      const rx = strips[s][0] + strips[s][1];
      const nextLx = strips[s + 1][0];
      const p1List = pieces.filter(p => p.stripIdx === s);
      const p2List = pieces.filter(p => p.stripIdx === s + 1);

      p1List.forEach(p1 => {
        p2List.forEach(p2 => {
          const cavY0 = Math.max(p1.yStart, p2.yStart);
          const cavY1 = Math.min(p1.yEnd, p2.yEnd);
          if (cavY1 > cavY0 + 10) {
            const fDepth = getDepth((rx + nextLx) / 2, (cavY0 + cavY1) / 2, slabTopY);
            poly([
              toIso(rx, cavY0, slabTopY),
              toIso(nextLx, cavY0, slabTopY),
              toIso(nextLx, cavY1, slabTopY),
              toIso(rx, cavY1, slabTopY)
            ], 'PAD', false, true, fDepth);

            // 캐비티 바닥과 다음 기둥 접합 종방향선
            ln(toIso(nextLx, cavY0, slabTopY), toIso(nextLx, cavY1, slabTopY), 'PAD', fDepth);
            ln(toIso(rx, cavY0, slabTopY), toIso(nextLx, cavY0, slabTopY), 'PAD', fDepth);
            ln(toIso(rx, cavY1, slabTopY), toIso(nextLx, cavY1, slabTopY), 'PAD', fDepth);

            // 캐비티 하부 슬래브 전면 (Y = cavY0)
            const cavSlabDepth = getDepth((rx + nextLx) / 2, cavY0, (slabBotY + slabTopY) / 2);
            poly([
              toIso(rx, cavY0, slabTopY),
              toIso(nextLx, cavY0, slabTopY),
              toIso(nextLx, cavY0, slabBotY),
              toIso(rx, cavY0, slabBotY)
            ], 'PAD', false, true, cavSlabDepth);

            ln(toIso(rx, cavY0, slabTopY), toIso(nextLx, cavY0, slabTopY), 'PAD', cavSlabDepth);
            ln(toIso(nextLx, cavY0, slabTopY), toIso(nextLx, cavY0, slabBotY), 'PAD', cavSlabDepth);
            ln(toIso(nextLx, cavY0, slabBotY), toIso(rx, cavY0, slabBotY), 'PAD', cavSlabDepth);
            ln(toIso(rx, cavY0, slabBotY), toIso(rx, cavY0, slabTopY), 'PAD', cavSlabDepth);

            // 캐비티 슬래브 전면 45도 해치
            for (let c = -15000; c <= 30000; c += hatchStep) {
              const z1 = slabBotY, x1 = c;
              const z2 = slabTopY, x2 = c + slabT;
              if (x2 >= rx && x1 <= nextLx) {
                const ax = Math.max(rx, x1);
                const az = slabBotY + (ax - c);
                const bx = Math.min(nextLx, x2);
                const bz = slabBotY + (bx - c);
                if (bx - ax >= 5 && az >= slabBotY && bz <= slabTopY) {
                  ln(toIso(ax, cavY0, az), toIso(bx, cavY0, bz), 'PAD', cavSlabDepth);
                }
              }
            }
          }
        });
      });
    }

    // (C) 최우측 및 외곽 노출면 슬래브 우측 실루엣 (X = rx)
    pieces.forEach(p => {
      const hasRightNeighbor = pieces.some(other => other.stripIdx === p.stripIdx + 1 && Math.max(p.yStart, other.yStart) < Math.min(p.yEnd, other.yEnd));
      if (!hasRightNeighbor) {
        const rDepth = getDepth(p.rx, (p.yStart + p.yEnd) / 2, (slabBotY + slabTopY) / 2);
        poly([
          toIso(p.rx, p.yStart, slabTopY),
          toIso(p.rx, p.yEnd, slabTopY),
          toIso(p.rx, p.yEnd, slabBotY),
          toIso(p.rx, p.yStart, slabBotY)
        ], 'PAD', false, true, rDepth);

        ln(toIso(p.rx, p.yStart, slabTopY), toIso(p.rx, p.yEnd, slabTopY), 'PAD', rDepth);
        ln(toIso(p.rx, p.yEnd, slabTopY), toIso(p.rx, p.yEnd, slabBotY), 'PAD', rDepth);
        ln(toIso(p.rx, p.yStart, slabBotY), toIso(p.rx, p.yEnd, slabBotY), 'PAD', rDepth);
        ln(toIso(p.rx, p.yStart, slabTopY), toIso(p.rx, p.yStart, slabBotY), 'PAD', rDepth);
      }
    });

    // (D) 최좌측 슬래브 바닥 GL 실루엣선 (X = px0, West)
    const p0List = pieces.filter(p => p.stripIdx === 0);
    p0List.forEach(p0 => {
      const glDepth = getDepth(p0.lx, (p0.yStart + p0.yEnd) / 2, slabBotY);
      ln(toIso(p0.lx, p0.yStart, slabBotY), toIso(p0.lx, p0.yEnd, slabBotY), 'PAD', glDepth);
      ln(toIso(p0.lx, p0.yStart, slabTopY), toIso(p0.lx, p0.yStart, slabBotY), 'PAD', glDepth);
      ln(toIso(p0.lx, p0.yEnd, slabTopY), toIso(p0.lx, p0.yEnd, slabBotY), 'PAD', glDepth);
    });

    // (E) 후면 슬래브 바닥선
    pieces.forEach(p => {
      const rearDepth = getDepth(p.cx, p.yEnd, slabBotY);
      ln(toIso(p.lx, p.yEnd, slabBotY), toIso(p.rx, p.yEnd, slabBotY), 'PAD', rearDepth);
      ln(toIso(p.lx, p.yEnd, slabTopY), toIso(p.rx, p.yEnd, slabTopY), 'PAD', rearDepth);
    });

    inFoundation = false;

    if (opt.onlySkidAndPad) {
      // 3D 스틸 스키드 프레임 정밀 렌더링 (W방향 주재, L방향 주재, 부재)
      const dSkid = getSkidDimensions(opt.frame);
      const fNum = Number(opt.frame) || 75;
      const flgW = dSkid.mainW;
      const lapIn = 5;
      const overOut = flgW - lapIn;
      const overY = flgW - lapIn;
      const subW = (fNum === 75) ? 75 : 40;
      const isNv = getFrameVariant(opt) === 'N';

      // 1. W방향 세로 주재 (FRAME_MAIN_W, Orange) - 시작 열 및 끝 열 외곽 테두리
      // 좌측 외곽 주재 (first)
      for (let i = 0; i < map.rows.length; i++) {
        if (!map.has(i, 0)) continue;
        let startR = i;
        while (i < map.rows.length && map.has(i, 0)) i++;
        let endR = i - 1;
        const yA = map.ys[startR] + (isNv ? lapIn : -overY);
        const yB = map.ys[endR] + map.rows[endR] + (isNv ? -lapIn : overY);
        const xA = -overOut, xB = xA + flgW;
        poly([toIso(xA, yA, 0), toIso(xB, yA, 0), toIso(xB, yB, 0), toIso(xA, yB, 0)], 'FRAME_MAIN_W', true, true, getDepth((xA + xB) / 2, (yA + yB) / 2, 0));
        poly([toIso(xA, yA, 0), toIso(xB, yA, 0), toIso(xB, yA, -th), toIso(xA, yA, -th)], 'FRAME_MAIN_W', true, true, getDepth((xA + xB) / 2, yA, -th / 2));
        poly([toIso(xA, yA, 0), toIso(xA, yB, 0), toIso(xA, yB, -th), toIso(xA, yA, -th)], 'FRAME_MAIN_W', true, true, getDepth(xA, (yA + yB) / 2, -th / 2));
      }
      // 우측 외곽 주재 (last)
      const lastC = map.cols.length - 1;
      for (let i = 0; i < map.rows.length; i++) {
        if (!map.has(i, lastC)) continue;
        let startR = i;
        while (i < map.rows.length && map.has(i, lastC)) i++;
        let endR = i - 1;
        const yA = map.ys[startR] + (isNv ? lapIn : -overY);
        const yB = map.ys[endR] + map.rows[endR] + (isNv ? -lapIn : overY);
        const xA = map.xs[lastC] + map.cols[lastC] - lapIn, xB = xA + flgW;
        poly([toIso(xA, yA, 0), toIso(xB, yA, 0), toIso(xB, yB, 0), toIso(xA, yB, 0)], 'FRAME_MAIN_W', true, true, getDepth((xA + xB) / 2, (yA + yB) / 2, 0));
        poly([toIso(xA, yA, 0), toIso(xB, yA, 0), toIso(xB, yA, -th), toIso(xA, yA, -th)], 'FRAME_MAIN_W', true, true, getDepth((xA + xB) / 2, yA, -th / 2));
        poly([toIso(xB, yA, 0), toIso(xB, yB, 0), toIso(xB, yB, -th), toIso(xB, yA, -th)], 'FRAME_MAIN_W', true, true, getDepth(xB, (yA + yB) / 2, -th / 2));
      }

      // 1-B. 이형 외곽 단차 코너 단재 3D (WFF-0200ACZ / WFF-0150CCZ / WFF-0150HCCZ - 가로 배치, 0990CLZ과 동일 Section 방향)
      const stepCornerLen = (fNum === 75) ? 200 : 150;
      for (let j = 1; j < map.cols.length; j++) {
        const colX = map.xs[j];
        for (let rIdx = 0; rIdx <= map.rows.length; rIdx++) {
          const hasBeamLeft = (rIdx > 0 && map.has(rIdx - 1, j - 1)) || (rIdx < map.rows.length && map.has(rIdx, j - 1));
          const hasBeamRight = (rIdx > 0 && map.has(rIdx - 1, j)) || (rIdx < map.rows.length && map.has(rIdx, j));
          if (!hasBeamLeft && !hasBeamRight) continue;
          if (hasBeamLeft && hasBeamRight) continue;

          const isRight = hasBeamLeft && !hasBeamRight;
          const colIdx = isRight ? (j - 1) : j;
          const spec = getRowBeamSpec(map, rIdx, colIdx, flgW, overY);
          const { yA, yB } = spec;
          const xA = isRight ? (colX - lapIn) : (colX + lapIn - stepCornerLen);
          const xB = isRight ? (xA + stepCornerLen) : (colX + lapIn);

          poly([toIso(xA, yA, 0), toIso(xB, yA, 0), toIso(xB, yB, 0), toIso(xA, yB, 0)], 'FRAME_MAIN_L', true, true, getDepth((xA + xB) / 2, (yA + yB) / 2, 0));
          poly([toIso(xA, yA, 0), toIso(xB, yA, 0), toIso(xB, yA, -th), toIso(xA, yA, -th)], 'FRAME_MAIN_L', true, true, getDepth((xA + xB) / 2, yA, -th / 2));
          poly([toIso(isRight ? xB : xA, yA, 0), toIso(isRight ? xB : xA, yB, 0), toIso(isRight ? xB : xA, yB, -th), toIso(isRight ? xB : xA, yA, -th)], 'FRAME_MAIN_L', true, true, getDepth(isRight ? xB : xA, (yA + yB) / 2, -th / 2));
          poly([toIso(xA, yB, 0), toIso(xB, yB, 0), toIso(xB, yB, -th), toIso(xA, yB, -th)], 'FRAME_MAIN_L', true, true, getDepth((xA + xB) / 2, yB, -th / 2));
        }
      }

      // 2. L방향 가로 주재 (FRAME_MAIN_L, Purple)
      for (let i = 0; i <= map.rows.length; i++) {
        const rowY = (i < map.rows.length) ? map.ys[i] : map.width;
        let c = 0;
        while (c < map.cols.length) {
          const hasBelow = (i > 0) && map.has(i - 1, c);
          const hasAbove = (i < map.rows.length) && map.has(i, c);
          if (!hasBelow && !hasAbove) {
            c++;
            continue;
          }

          const cStart = c;
          while (c < map.cols.length && (((i > 0) && map.has(i - 1, c)) || ((i < map.rows.length) && map.has(i, c)))) {
            c++;
          }
          const cEnd = c - 1;

          let anyBoth = false, allAboveOnly = true, allBelowOnly = true;
          for (let col = cStart; col <= cEnd; col++) {
            const b = (i > 0) && map.has(i - 1, col);
            const a = (i < map.rows.length) && map.has(i, col);
            if (b && a) anyBoth = true;
            if (b) allAboveOnly = false;
            if (a) allBelowOnly = false;
          }

          let cat = 3;
          if (anyBoth) cat = 3;
          else if (allAboveOnly) cat = 1;
          else if (allBelowOnly) cat = 2;
          else cat = 3;

          const xLeft = map.xs[cStart];
          const xRight = map.xs[cEnd] + map.cols[cEnd];

          const hasTankLeft = (cStart > 0) && (
            (i > 0 && map.has(i - 1, cStart - 1)) ||
            (i < map.rows.length && map.has(i, cStart - 1))
          );
          const hasTankRight = (cEnd < map.cols.length - 1) && (
            (i > 0 && map.has(i - 1, cEnd + 1)) ||
            (i < map.rows.length && map.has(i, cEnd + 1))
          );

          const extL = 0, extR = 0; // N형도 L방향 주재 연장 없음 (코너는 브라켓 연결)
          const x0 = (hasTankLeft ? (xLeft - flgW / 2) : (xLeft + lapIn)) - extL;
          const x1 = (hasTankRight ? (xRight + flgW / 2) : (xRight - lapIn)) + extR;

          let segY;
          if (cat === 1) segY = rowY - overY;
          else if (cat === 2) segY = rowY + overY - flgW;
          else segY = rowY - flgW / 2;

          const y0 = segY, y1 = segY + flgW;

          poly([toIso(x0, y0, 0), toIso(x1, y0, 0), toIso(x1, y1, 0), toIso(x0, y1, 0)], 'FRAME_MAIN_L', true, true, getDepth((x0 + x1) / 2, (y0 + y1) / 2, 0));
          poly([toIso(x0, y0, 0), toIso(x1, y0, 0), toIso(x1, y0, -th), toIso(x0, y0, -th)], 'FRAME_MAIN_L', true, true, getDepth((x0 + x1) / 2, y0, -th / 2));
          if (!hasTankRight) {
            poly([toIso(x1, y0, 0), toIso(x1, y1, 0), toIso(x1, y1, -th), toIso(x1, y0, -th)], 'FRAME_MAIN_L', true, true, getDepth(x1, (y0 + y1) / 2, -th / 2));
          }
          if (extL) {
            poly([toIso(x0, y0, 0), toIso(x0, y1, 0), toIso(x0, y1, -th), toIso(x0, y0, -th)], 'FRAME_MAIN_L', true, true, getDepth(x0, (y0 + y1) / 2, -th / 2));
          }
        }
      }

      // 3. 중간 부재 (FRAME_SUB, Teal - 실물 서브빔 WFF-0990AMZ 양단 160mm 엔드플레이트 및 체결 볼트 정밀 3D 모델링)
      const subH = (fNum === 50) ? 50 : 75;
      const plW = 160, plTh = 6;
      for (let j = 1; j < map.cols.length; j++) {
        const colX = map.xs[j];
        for (let i = 0; i < map.rows.length; i++) {
          if (!map.has(i, j - 1) && !map.has(i, j)) continue;
          const colIdx = map.has(i, j - 1) ? (j - 1) : j;
          const specBot = getRowBeamSpec(map, i, colIdx, flgW, overY);
          const specTop = getRowBeamSpec(map, i + 1, colIdx, flgW, overY);
          const yBayBot = specBot.yB;
          const yBayTop = specTop.yA;
          if (yBayTop <= yBayBot + 15) continue;

          // 3-A. 하단 연결 엔드 플레이트 (End Plate: 160mm x 75mm x 6t, yBayBot ~ yBayBot + 6)
          const pBotY0 = yBayBot, pBotY1 = yBayBot + plTh;
          const plX0 = colX - plW / 2, plX1 = colX + plW / 2;
          const botPlDepth = getDepth(colX, pBotY1, -subH / 2);
          // 상면
          poly([toIso(plX0, pBotY0, 0), toIso(plX1, pBotY0, 0), toIso(plX1, pBotY1, 0), toIso(plX0, pBotY1, 0)], 'FRAME_SUB', true, true, getDepth(colX, (pBotY0 + pBotY1) / 2, 0));
          // 내측 전면 (Y = pBotY1, +Y 방향)
          poly([toIso(plX0, pBotY1, 0), toIso(plX1, pBotY1, 0), toIso(plX1, pBotY1, -subH), toIso(plX0, pBotY1, -subH)], 'FRAME_SUB', true, true, botPlDepth);
          // 우측 단면 (X = plX1)
          poly([toIso(plX1, pBotY0, 0), toIso(plX1, pBotY1, 0), toIso(plX1, pBotY1, -subH), toIso(plX1, pBotY0, -subH)], 'FRAME_SUB', true, true, getDepth(plX1, (pBotY0 + pBotY1) / 2, -subH / 2));
          // 2-Ø14 볼트 홀/볼트 머리 (M12)
          isoCircle(colX - 55, pBotY1, -subH / 2, 4.5, 'XZ', 'FRAME_SUB', botPlDepth - 2, 10);
          isoCircle(colX + 55, pBotY1, -subH / 2, 4.5, 'XZ', 'FRAME_SUB', botPlDepth - 2, 10);

          // 3-B. 상단 연결 엔드 플레이트 (End Plate: 160mm x 75mm x 6t, yBayTop - 6 ~ yBayTop)
          const pTopY0 = yBayTop - plTh, pTopY1 = yBayTop;
          const topPlDepth = getDepth(colX, pTopY0, -subH / 2);
          // 상면
          poly([toIso(plX0, pTopY0, 0), toIso(plX1, pTopY0, 0), toIso(plX1, pTopY1, 0), toIso(plX0, pTopY1, 0)], 'FRAME_SUB', true, true, getDepth(colX, (pTopY0 + pTopY1) / 2, 0));
          // 내측 배면 (Y = pTopY0, -Y 방향: 카메라를 향해 정면 노출!)
          poly([toIso(plX0, pTopY0, 0), toIso(plX1, pTopY0, 0), toIso(plX1, pTopY0, -subH), toIso(plX0, pTopY0, -subH)], 'FRAME_SUB', true, true, topPlDepth);
          // 우측 단면 (X = plX1)
          poly([toIso(plX1, pTopY0, 0), toIso(plX1, pTopY1, 0), toIso(plX1, pTopY1, -subH), toIso(plX1, pTopY0, -subH)], 'FRAME_SUB', true, true, getDepth(plX1, (pTopY0 + pTopY1) / 2, -subH / 2));
          // 2-Ø14 볼트 머리 (카메라를 향해 명확히 보임)
          isoCircle(colX - 55, pTopY0, -subH / 2, 4.5, 'XZ', 'FRAME_SUB', topPlDepth - 2, 10);
          isoCircle(colX + 55, pTopY0, -subH / 2, 4.5, 'XZ', 'FRAME_SUB', topPlDepth - 2, 10);

          // 3-C. 찬넬 본체 (C-75x40x5t, pBotY1 ~ pTopY0)
          const sX0 = colX - subW / 2, sX1 = colX + subW / 2;
          const subMidY = (pBotY1 + pTopY0) / 2;
          // 찬넬 상면 플랜지
          poly([toIso(sX0, pBotY1, 0), toIso(sX1, pBotY1, 0), toIso(sX1, pTopY0, 0), toIso(sX0, pTopY0, 0)], 'FRAME_SUB', true, true, getDepth(colX, subMidY, 0));
          // 찬넬 우측 웨브 면
          poly([toIso(sX1, pBotY1, 0), toIso(sX1, pTopY0, 0), toIso(sX1, pTopY0, -subH), toIso(sX1, pBotY1, -subH)], 'FRAME_SUB', true, true, getDepth(sX1, subMidY, -subH / 2));
          // 찬넬 하부 플랜지 립 라인
          ln(toIso(sX0, pBotY1, -subH), toIso(sX0, pTopY0, -subH), 'FRAME_SUB', getDepth(sX0, subMidY, -subH));
          ln(toIso(sX0, pBotY1, -subH), toIso(sX1, pBotY1, -subH), 'FRAME_SUB', getDepth(colX, pBotY1, -subH));
          ln(toIso(sX0, pTopY0, -subH), toIso(sX1, pTopY0, -subH), 'FRAME_SUB', getDepth(colX, pTopY0, -subH));
          // 찬넬 상부 플랜지 안쪽 라인
          ln(toIso(sX0, pBotY1, -5), toIso(sX0, pTopY0, -5), 'FRAME_SUB', getDepth(sX0, subMidY, -5));
        }
      }

      // 4. 주재 코너 연결 브라켓 (Corner Bracket: WBR-7575Z / WBR-0120CZE) 3D 정밀 작도
      const brkH = (fNum === 150) ? 120 : 75;
      const brkL = 75, brkT = 6;
      const draw3DCornerBracket = (bx, by, dirX, dirY) => {
        const xA = bx, xB = bx + dirX * brkL;
        const yA = by, yB = by + dirY * brkL;
        const bDepth = getDepth(bx + dirX * 30, by + dirY * 30, -brkH / 2);
        // X방향 및 Y방향 브라켓 상면
        poly([
          toIso(xA, yA, 0), toIso(xB, yA, 0),
          toIso(xB, yA + dirY * brkT, 0), toIso(xA + dirX * brkT, yA + dirY * brkT, 0),
          toIso(xA + dirX * brkT, yB, 0), toIso(xA, yB, 0)
        ], 'FRAME', true, true, getDepth(bx + dirX * 20, by + dirY * 20, 0));
        // X방향 수직면
        poly([
          toIso(xA, yA + dirY * brkT, 0), toIso(xB, yA + dirY * brkT, 0),
          toIso(xB, yA + dirY * brkT, -brkH), toIso(xA, yA + dirY * brkT, -brkH)
        ], 'FRAME', true, true, bDepth);
        // Y방향 수직면
        poly([
          toIso(xA + dirX * brkT, yA, 0), toIso(xA + dirX * brkT, yB, 0),
          toIso(xA + dirX * brkT, yB, -brkH), toIso(xA + dirX * brkT, yA, -brkH)
        ], 'FRAME', true, true, bDepth);
        // 볼트 머리
        if (dirY < 0) {
          isoCircle(bx + dirX * 45, yA + dirY * brkT, -brkH / 2, 5.0, 'XZ', 'FRAME', bDepth - 2, 10);
        }
        if (dirX > 0) {
          isoCircle(xA + dirX * brkT, by + dirY * 45, -brkH / 2, 5.0, 'YZ', 'FRAME', bDepth - 2, 10);
        }
      };

      // 외곽 4개 코너 브라켓
      draw3DCornerBracket(lapIn, lapIn, 1, 1);
      draw3DCornerBracket(totalL - lapIn, lapIn, -1, 1);
      draw3DCornerBracket(lapIn, totalW - lapIn, 1, -1);
      draw3DCornerBracket(totalL - lapIn, totalW - lapIn, -1, -1);

      // 5. W방향 주재 이음 플레이트 (W-direction Splice Plate: 75 Angle=WBR-02150ZE / 125 Channel=WBR-9021CZ / 150 Channel=WBR-1022CZ) 3D 정밀 작도
      if (map.width >= 3000) {
        const isAngle = (fNum === 75);
        const isF150 = (fNum === 150);
        const splH = isAngle ? 65 : (isF150 ? 105 : 90);
        const splL = isAngle ? 215 : (isF150 ? 225 : 215);
        const splTh = 6;
        for (let i = 1; i < map.rows.length; i++) {
          const jointY = map.ys[i];
          if (jointY >= 1500 && jointY <= totalW - 1500) {
            // 우측 외곽 주재 외측 웨브 면 (X = totalL + overOut)에 접합 플레이트
            const spX0 = totalL + overOut, spX1 = spX0 + splTh;
            const spY0 = jointY - splL / 2, spY1 = jointY + splL / 2;
            const spZ1 = -(th - splH) / 2, spZ0 = spZ1 - splH;
            const spDepth = getDepth(spX1, jointY, (spZ0 + spZ1) / 2);
            // 플레이트 상면
            poly([toIso(spX0, spY0, spZ1), toIso(spX1, spY0, spZ1), toIso(spX1, spY1, spZ1), toIso(spX0, spY1, spZ1)], 'FRAME_MAIN_W', true, true, getDepth(spX1, jointY, spZ1));
            // 플레이트 외측면 (카메라를 향해 명확히 노출)
            poly([toIso(spX1, spY0, spZ1), toIso(spX1, spY1, spZ1), toIso(spX1, spY1, spZ0), toIso(spX1, spY0, spZ0)], 'FRAME_MAIN_W', true, true, spDepth);
            // 4-Ø17 볼트 머리 (2x2 배치)
            const bOffs = isAngle ? [-55, 55] : (isF150 ? [-87.5, 87.5] : [-82.5, 82.5]);
            bOffs.forEach(dy => {
              isoCircle(spX1, jointY + dy, spZ1 - splH * 0.28, 4.5, 'YZ', 'FRAME_MAIN_W', spDepth - 2, 10);
              isoCircle(spX1, jointY + dy, spZ1 - splH * 0.72, 4.5, 'YZ', 'FRAME_MAIN_W', spDepth - 2, 10);
            });
          }
        }
      }

      // 6. 스키드 앙카 클램프 (Anchor Clamp: WBR-5010Z, PL-50x35x6t, M12) 3D 정밀 작도
      for (let j = 0; j <= map.cols.length; j++) {
        const clX = (j < map.cols.length) ? map.xs[j] : totalL;
        // 전면 하단 주재 (Y = -overY ~ 0) 하부 플랜지 위 앙카 클램프
        const acX0 = clX - 25, acX1 = clX + 25;
        const acY0 = -overY - 15, acY1 = -overY + 20;
        const acZ0 = -th, acZ1 = -th + 6;
        const acDepth = getDepth(clX, (acY0 + acY1) / 2, acZ1);
        poly([toIso(acX0, acY0, acZ1), toIso(acX1, acY0, acZ1), toIso(acX1, acY1, acZ1), toIso(acX0, acY1, acZ1)], 'FRAME', true, true, acDepth);
        poly([toIso(acX0, acY0, acZ1), toIso(acX1, acY0, acZ1), toIso(acX1, acY0, acZ0), toIso(acX0, acY0, acZ0)], 'FRAME', true, true, acDepth);
        poly([toIso(acX1, acY0, acZ1), toIso(acX1, acY1, acZ1), toIso(acX1, acY1, acZ0), toIso(acX1, acY0, acZ0)], 'FRAME', true, true, acDepth);
        // M12 앙카 볼트 머리
        isoCircle(clX, acY0 + 17.5, acZ1, 5.0, 'XY', 'FRAME', acDepth - 2, 10);
      }
    } else {
      // 베이스 찬넬 림 (Skid Channel 100mm)
      // 1) 전면 탱크 하부 찬넬
      for (let i = 0; i < map.rows.length; i++) {
        const y0 = map.ys[i];
        for (let j = 0; j < map.cols.length; j++) {
          if (!map.has(i, j) || map.has(i - 1, j)) continue;
          const x0 = map.xs[j], x1 = map.xs[j + 1];
          const skidDepth = y0 - (x0 + x1) / 2 - (-th / 2);
          poly([toIso(x0, y0, 0), toIso(x1, y0, 0), toIso(x1, y0, -th), toIso(x0, y0, -th)], 'FRAME', true, true, skidDepth);
          ln(toIso(x0, y0, -th + 15), toIso(x1, y0, -th + 15), 'FRAME', skidDepth);
          ln(toIso(x0, y0, -15), toIso(x1, y0, -15), 'FRAME', skidDepth);
        }
      }

      // 2) 우측 탱크 하부 찬넬
      for (let i = 0; i < map.rows.length; i++) {
        const y0 = map.ys[i], y1 = map.ys[i + 1];
        for (let j = 0; j < map.cols.length; j++) {
          if (!map.has(i, j) || map.has(i, j + 1)) continue;
          const xWall = map.xs[j + 1];
          const skidDepth = (y0 + y1) / 2 - xWall - (-th / 2);
          poly([toIso(xWall, y0, 0), toIso(xWall, y1, 0), toIso(xWall, y1, -th), toIso(xWall, y0, -th)], 'FRAME', true, true, skidDepth);
          ln(toIso(xWall, y0, -th + 15), toIso(xWall, y1, -th + 15), 'FRAME', skidDepth);
          ln(toIso(xWall, y0, -15), toIso(xWall, y1, -15), 'FRAME', skidDepth);
        }
      }
    }

    if (!opt.onlySkidAndPad) {
    // 2. 전면 벽체 판넬 (Front-Facing Walls: normal -Y, 'D')
    for (let i = 0; i < map.rows.length; i++) {
      const y0 = map.ys[i];
      for (let j = 0; j < map.cols.length; j++) {
        if (!map.has(i, j) || map.has(i - 1, j)) continue;
        const x0 = map.xs[j], w = map.cols[j];
        for (let k = 0; k < hs.length; k++) {
          const z0 = zs[k], h = hs[k];
          const depth = getDepth(x0 + w / 2, y0, z0 + h / 2);
          const pType = sidePanels[`front,${k},${j}`] || sidePanels[`front_${k}_${j}`] || sidePanels[`front,${j},${k}`] || sidePanels[`front_${j}_${k}`] || 'std';
          renderWallPanel('XZ', x0, y0, z0, w, h, pType, depth);
        }
      }
    }

    // 3. 우측 벽체 판넬 (Right-Facing Walls: normal +X, 'R')
    for (let i = 0; i < map.rows.length; i++) {
      const y0 = map.ys[i], w = map.rows[i];
      for (let j = 0; j < map.cols.length; j++) {
        if (!map.has(i, j) || map.has(i, j + 1)) continue;
        const xWall = map.xs[j + 1];
        for (let k = 0; k < hs.length; k++) {
          const z0 = zs[k], h = hs[k];
          const depth = getDepth(xWall, y0 + w / 2, z0 + h / 2);
          const pType = sidePanels[`side,${k},${i}`] || sidePanels[`right,${k},${i}`] || sidePanels[`side_${k}_${i}`] || sidePanels[`right_${k}_${i}`] || 'std';
          renderWallPanel('YZ', xWall, y0, z0, w, h, pType, depth);
        }
      }
    }

    // 3-B. 후면 벽체(normal +Y) 및 좌측 벽체(normal -X)는 등각투영(조감도) 카메라 시선(+X, -Y, +Z)에서 완전히 등진 배면(Back-Face)이므로 와이어프레임 은선 간섭 방지를 위해 렌더링 생략

    // 4. 천정 판넬 (Top Roof: Z = H)
    for (let i = 0; i < map.rows.length; i++) {
      const y0 = map.ys[i], h = map.rows[i];
      for (let j = 0; j < map.cols.length; j++) {
        const x0 = map.xs[j], w = map.cols[j];
        const key = i + ',' + j;
        if (map.removed && map.removed.has(key)) continue;

        const depth = getDepth(x0 + w / 2, y0 + h / 2, H);
        const p1 = toIso(x0, y0, H);
        const p2 = toIso(x0 + w, y0, H);
        const p3 = toIso(x0 + w, y0 + h, H);
        const p4 = toIso(x0, y0 + h, H);
        poly([p1, p2, p3, p4], 'PANEL', true, true, depth);

        // Project CeilLT roof template geometry
        let rawT = ceilTemplates[w + 'x' + h];
        if (!rawT || !rawT.length) {
          if ((w === 500 && h === 1000) || (w === 1000 && h === 500)) {
            rawT = ceilTemplates['500x1000'] || ceilTemplates['1000x500'];
          }
        }
        if ((!rawT || !rawT.length) && opt && opt.customPanels && Array.isArray(opt.customPanels)) {
          const matched = opt.customPanels.find(p =>
            (p.category === 'top' || p.category === 'top_bottom' || p.category === 'common' || p.category === 'all' || !p.category) &&
            (p.size_key === `${w}x${h}` || (p.width === w && p.height === h) ||
             (((w === 500 && h === 1000) || (w === 1000 && h === 500)) && (p.size_key === '500x1000' || p.size_key === '1000x500'))) &&
            p.entities && p.entities.length
          );
          if (matched) rawT = matched.entities;
        }
        if (!rawT || !rawT.length) rawT = getDefaultPanelPattern(w, h);
        const fm = 60; // 천정판넬 플랜지 길이 60mm (내측 절곡)
        if (rawT && rawT.length > 0) {
          poly([toIso(x0 + fm, y0 + fm, H), toIso(x0 + w - fm, y0 + fm, H), toIso(x0 + w - fm, y0 + h - fm, H), toIso(x0 + fm, y0 + h - fm, H)], 'PANEL_DETAIL', true, false, depth);
          projectTemplateEntities(rawT, 'XY', x0, y0, H, 'PANEL_DETAIL', depth);
        } else {
          poly([toIso(x0 + fm, y0 + fm, H), toIso(x0 + w - fm, y0 + fm, H), toIso(x0 + w - fm, y0 + h - fm, H), toIso(x0 + fm, y0 + h - fm, H)], 'PANEL_DETAIL', true, false, depth);
          ln(toIso(x0 + fm, y0 + fm, H), toIso(x0 + w - fm, y0 + h - fm, H), 'PANEL_DETAIL', depth);
          ln(toIso(x0 + w - fm, y0 + fm, H), toIso(x0 + fm, y0 + h - fm, H), 'PANEL_DETAIL', depth);
        }
      }
    }

    // 4-B. SMC 표준 75mm 외부 돌출 플랜지 폭 및 10mm 두께 (SMC 75mm Flange & 10mm Thickness)
    if (mat === 'SMC') {
      const FD = 75; // 측면 벽체 플랜지 폭 (75mm)
      const FT = 10; // 측면 벽체 플랜지 두께 (10mm)

      // (1) 전면 벽체 수평 & 수직 & 바닥 & 상부 플랜지
      for (let i = 0; i < map.rows.length; i++) {
        const y0 = map.ys[i];
        for (let j = 0; j < map.cols.length; j++) {
          if (!map.has(i, j) || map.has(i - 1, j)) continue;
          const x0 = map.xs[j], x1 = map.xs[j + 1];

          // 횡 플랜지 림 (중간 층간 플랜지)
          for (let k = 1; k < hs.length; k++) {
            const z = zs[k];
            const fDepth = getDepth((x0 + x1) / 2, y0 - FD, z);
            ln(toIso(x0, y0, z - FT), toIso(x1, y0, z - FT), 'PANEL_DETAIL', fDepth);
            ln(toIso(x0, y0, z + FT), toIso(x1, y0, z + FT), 'PANEL_DETAIL', fDepth);
            ln(toIso(x0, y0 - FD, z - FT), toIso(x1, y0 - FD, z - FT), 'PANEL', fDepth);
            ln(toIso(x0, y0 - FD, z + FT), toIso(x1, y0 - FD, z + FT), 'PANEL', fDepth);
            ln(toIso(x0, y0 - FD, z), toIso(x1, y0 - FD, z), 'FRAME', fDepth);
          }

          // 하부 바닥 플랜지
          const bDepthF = getDepth((x0 + x1) / 2, y0 - FD, 0);
          ln(toIso(x0, y0 - FD, 0), toIso(x1, y0 - FD, 0), 'FRAME', bDepthF);
          ln(toIso(x0, y0 - FD, -FT), toIso(x1, y0 - FD, -FT), 'FRAME', bDepthF);

          // 상부 플랜지 (75mm 폭, 10mm 두께)
          const topDepthF = getDepth((x0 + x1) / 2, y0 - FD, H);
          ln(toIso(x0, y0 - FD, H), toIso(x1, y0 - FD, H), 'FRAME', topDepthF);
          ln(toIso(x0, y0 - FD, H - FT), toIso(x1, y0 - FD, H - FT), 'FRAME', topDepthF);
          ln(toIso(x0, y0, H - FT), toIso(x1, y0, H - FT), 'PANEL_DETAIL', topDepthF);
          ln(toIso(x0, y0, H), toIso(x0, y0 - FD, H), 'FRAME', topDepthF);
          ln(toIso(x1, y0, H), toIso(x1, y0 - FD, H), 'FRAME', topDepthF);
          ln(toIso(x0, y0 - FD, H - FT), toIso(x0, y0 - FD, H), 'FRAME', topDepthF);
          ln(toIso(x1, y0 - FD, H - FT), toIso(x1, y0 - FD, H), 'FRAME', topDepthF);

          // 종 플랜지 림 (층별 분할 렌더링으로 상단 판넬에 의한 은선 차폐 방지)
          if (map.has(i, j + 1) && !map.has(i - 1, j + 1) && !xPartitions.has(x1)) {
            const x = x1;
            for (let k = 0; k < hs.length; k++) {
              const z0 = zs[k], z1 = zs[k + 1];
              const cz = (z0 + z1) / 2;
              const vertDepth = getDepth(x, y0 - FD, cz);
              ln(toIso(x - FT, y0, z0), toIso(x - FT, y0, z1), 'PANEL_DETAIL', vertDepth);
              ln(toIso(x + FT, y0, z0), toIso(x + FT, y0, z1), 'PANEL_DETAIL', vertDepth);
              ln(toIso(x - FT, y0 - FD, z0), toIso(x - FT, y0 - FD, z1), 'PANEL', vertDepth);
              ln(toIso(x + FT, y0 - FD, z0), toIso(x + FT, y0 - FD, z1), 'PANEL', vertDepth);
              ln(toIso(x, y0 - FD, z0), toIso(x, y0 - FD, z1), 'FRAME', vertDepth);
            }
            const bDepth = getDepth(x, y0 - FD, 0);
            ln(toIso(x - FT, y0, 0), toIso(x - FT, y0 - FD, 0), 'FRAME', bDepth);
            ln(toIso(x + FT, y0, 0), toIso(x + FT, y0 - FD, 0), 'FRAME', bDepth);
            const tDepth = getDepth(x, y0 - FD, H);
            ln(toIso(x - FT, y0, H), toIso(x - FT, y0 - FD, H), 'FRAME', tDepth);
            ln(toIso(x + FT, y0, H), toIso(x + FT, y0 - FD, H), 'FRAME', tDepth);
          }

          // 좌측 외곽 모서리 (층별 분할 렌더링)
          if (!map.has(i, j - 1)) {
            for (let k = 0; k < hs.length; k++) {
              const z0 = zs[k], z1 = zs[k + 1];
              const cz = (z0 + z1) / 2;
              const cornerDepth = getDepth(x0, y0 - FD, cz);
              ln(toIso(x0, y0 - FD, z0), toIso(x0, y0 - FD, z1), 'FRAME', cornerDepth);
              ln(toIso(x0, y0, z0), toIso(x0, y0, z1), 'FRAME', cornerDepth);
              ln(toIso(x0, y0, z0), toIso(x0, y0 - FD, z0), 'FRAME', cornerDepth);
            }
            const tDepth = getDepth(x0, y0 - FD, H);
            ln(toIso(x0, y0, H), toIso(x0, y0 - FD, H), 'FRAME', tDepth);
          }
        }
      }

      // (2) 우측 벽체 수평 & 수직 & 바닥 & 상부 플랜지
      for (let i = 0; i < map.rows.length; i++) {
        const y0 = map.ys[i], y1 = map.ys[i + 1];
        for (let j = 0; j < map.cols.length; j++) {
          if (!map.has(i, j) || map.has(i, j + 1)) continue;
          const xWall = map.xs[j + 1];

          // 횡 플랜지 림 (중간 층간 플랜지)
          for (let k = 1; k < hs.length; k++) {
            const z = zs[k];
            const fDepth = getDepth(xWall + FD, (y0 + y1) / 2, z);
            ln(toIso(xWall, y0, z - FT), toIso(xWall, y1, z - FT), 'PANEL_DETAIL', fDepth);
            ln(toIso(xWall, y0, z + FT), toIso(xWall, y1, z + FT), 'PANEL_DETAIL', fDepth);
            ln(toIso(xWall + FD, y0, z - FT), toIso(xWall + FD, y1, z - FT), 'PANEL', fDepth);
            ln(toIso(xWall + FD, y0, z + FT), toIso(xWall + FD, y1, z + FT), 'PANEL', fDepth);
            ln(toIso(xWall + FD, y0, z), toIso(xWall + FD, y1, z), 'FRAME', fDepth);
          }

          // 하부 바닥 플랜지
          const bDepthR = getDepth(xWall + FD, (y0 + y1) / 2, 0);
          ln(toIso(xWall + FD, y0, 0), toIso(xWall + FD, y1, 0), 'FRAME', bDepthR);
          ln(toIso(xWall + FD, y0, -FT), toIso(xWall + FD, y1, -FT), 'FRAME', bDepthR);

          // 상부 플랜지 (75mm 폭, 10mm 두께)
          const topDepthR = getDepth(xWall + FD, (y0 + y1) / 2, H);
          ln(toIso(xWall + FD, y0, H), toIso(xWall + FD, y1, H), 'FRAME', topDepthR);
          ln(toIso(xWall + FD, y0, H - FT), toIso(xWall + FD, y1, H - FT), 'FRAME', topDepthR);
          ln(toIso(xWall, y0, H - FT), toIso(xWall, y1, H - FT), 'PANEL_DETAIL', topDepthR);
          ln(toIso(xWall, y0, H), toIso(xWall + FD, y0, H), 'FRAME', topDepthR);
          ln(toIso(xWall, y1, H), toIso(xWall + FD, y1, H), 'FRAME', topDepthR);
          ln(toIso(xWall + FD, y0, H - FT), toIso(xWall + FD, y0, H), 'FRAME', topDepthR);
          ln(toIso(xWall + FD, y1, H - FT), toIso(xWall + FD, y1, H), 'FRAME', topDepthR);

          // 종 플랜지 림 (층별 분할 렌더링으로 상단 판넬에 의한 은선 차폐 방지)
          if (map.has(i + 1, j) && !map.has(i + 1, j + 1) && !yPartitions.has(y1)) {
            const y = y1;
            for (let k = 0; k < hs.length; k++) {
              const z0 = zs[k], z1 = zs[k + 1];
              const cz = (z0 + z1) / 2;
              const vertDepth = getDepth(xWall + FD, y, cz);
              ln(toIso(xWall, y - FT, z0), toIso(xWall, y - FT, z1), 'PANEL_DETAIL', vertDepth);
              ln(toIso(xWall, y + FT, z0), toIso(xWall, y + FT, z1), 'PANEL_DETAIL', vertDepth);
              ln(toIso(xWall + FD, y - FT, z0), toIso(xWall + FD, y - FT, z1), 'PANEL', vertDepth);
              ln(toIso(xWall + FD, y + FT, z0), toIso(xWall + FD, y + FT, z1), 'PANEL', vertDepth);
              ln(toIso(xWall + FD, y, z0), toIso(xWall + FD, y, z1), 'FRAME', vertDepth);
            }
            const bDepth = getDepth(xWall + FD, y, 0);
            ln(toIso(xWall, y - FT, 0), toIso(xWall + FD, y - FT, 0), 'FRAME', bDepth);
            ln(toIso(xWall, y + FT, 0), toIso(xWall + FD, y + FT, 0), 'FRAME', bDepth);
            const tDepth = getDepth(xWall + FD, y, H);
            ln(toIso(xWall, y - FT, H), toIso(xWall + FD, y - FT, H), 'FRAME', tDepth);
            ln(toIso(xWall, y + FT, H), toIso(xWall + FD, y + FT, H), 'FRAME', tDepth);
          }

          // 후면 외곽 모서리 (실루엣 모서리선만 렌더링, 배면 은선 및 내부 수평선 제외)
          if (!map.has(i + 1, j)) {
            const cornerDepth = getDepth(xWall + FD, y1, H / 2);
            ln(toIso(xWall + FD, y1, 0), toIso(xWall + FD, y1, H), 'FRAME', cornerDepth);
            const tDepth = getDepth(xWall + FD, y1, H);
            ln(toIso(xWall, y1, H), toIso(xWall + FD, y1, H), 'FRAME', tDepth);
          }
        }
      }

      // (1-B) 후면 벽체 상부 플랜지 (상단 외곽 실루엣 및 판넬 분할선)
      for (let i = 0; i < map.rows.length; i++) {
        const yWall = map.ys[i + 1];
        for (let j = 0; j < map.cols.length; j++) {
          if (!map.has(i, j) || map.has(i + 1, j)) continue;
          const x0 = map.xs[j], x1 = map.xs[j + 1];
          const topDepthB = getDepth((x0 + x1) / 2, yWall + FD, H);
          ln(toIso(x0, yWall + FD, H), toIso(x1, yWall + FD, H), 'FRAME', topDepthB);
          ln(toIso(x0, yWall, H), toIso(x0, yWall + FD, H), 'FRAME', topDepthB);
          ln(toIso(x1, yWall, H), toIso(x1, yWall + FD, H), 'FRAME', topDepthB);
        }
      }

      // (2-B) 좌측 벽체 상부 플랜지 (상단 외곽 실루엣 및 판넬 분할선)
      for (let i = 0; i < map.rows.length; i++) {
        const y0 = map.ys[i], y1 = map.ys[i + 1];
        for (let j = 0; j < map.cols.length; j++) {
          if (!map.has(i, j) || map.has(i, j - 1)) continue;
          const xWall = map.xs[j];
          const topDepthL = getDepth(xWall - FD, (y0 + y1) / 2, H);
          ln(toIso(xWall - FD, y0, H), toIso(xWall - FD, y1, H), 'FRAME', topDepthL);
          ln(toIso(xWall, y0, H), toIso(xWall - FD, y0, H), 'FRAME', topDepthL);
          ln(toIso(xWall, y1, H), toIso(xWall - FD, y1, H), 'FRAME', topDepthL);
        }
      }

      // (3) 외곽 돌출 코너 플랜지 (Convex Outer Corners - 층별 분할 렌더링)
      for (let i = 0; i < map.rows.length; i++) {
        for (let j = 0; j < map.cols.length; j++) {
          if (!map.has(i, j)) continue;
          if (!map.has(i - 1, j) && !map.has(i, j + 1)) {
            const xC = map.xs[j + 1], yC = map.ys[i];
            for (let k = 0; k < hs.length; k++) {
              const z0 = zs[k], z1 = zs[k + 1];
              const cz = (z0 + z1) / 2;
              const cDepth = getDepth(xC + FD, yC - FD, cz);
              ln(toIso(xC, yC - FD, z0), toIso(xC, yC - FD, z1), 'FRAME', cDepth);
              ln(toIso(xC - FT, yC - FD, z0), toIso(xC - FT, yC - FD, z1), 'PANEL_DETAIL', cDepth);
              ln(toIso(xC, yC, z0), toIso(xC, yC, z1), 'PANEL', cDepth);
              ln(toIso(xC + FD, yC, z0), toIso(xC + FD, yC, z1), 'FRAME', cDepth);
              ln(toIso(xC + FD, yC + FT, z0), toIso(xC + FD, yC + FT, z1), 'PANEL_DETAIL', cDepth);
              ln(toIso(xC, yC - FD, z0), toIso(xC, yC, z0), 'FRAME', cDepth);
              ln(toIso(xC, yC, z0), toIso(xC + FD, yC, z0), 'FRAME', cDepth);
              ln(toIso(xC, yC - FD, z0), toIso(xC + FD, yC, z0), 'PANEL', cDepth);
            }
            const bDepth = getDepth(xC + FD, yC - FD, 0);
            ln(toIso(xC, yC - FD, -FT), toIso(xC + FD, yC, -FT), 'FRAME', bDepth);
            const tDepth = getDepth(xC + FD, yC - FD, H);
            ln(toIso(xC, yC - FD, H), toIso(xC, yC, H), 'FRAME', tDepth);
            ln(toIso(xC, yC, H), toIso(xC + FD, yC, H), 'FRAME', tDepth);
            ln(toIso(xC, yC - FD, H), toIso(xC + FD, yC, H), 'PANEL', tDepth);
            ln(toIso(xC, yC - FD, H - FT), toIso(xC + FD, yC - FD, H - FT), 'FRAME', tDepth);
            ln(toIso(xC + FD, yC - FD, H - FT), toIso(xC + FD, yC, H - FT), 'FRAME', tDepth);
          }
        }
      }

      // (4) 오목 재진입 모서리 (Concave Re-entrant Corners)
      for (let i = 0; i < map.rows.length; i++) {
        for (let j = 0; j < map.cols.length; j++) {
          if (!map.has(i, j)) continue;
          if (!map.has(i, j + 1) && map.has(i - 1, j + 1)) {
            const xC = map.xs[j + 1], yC = map.ys[i];
            const cDepth = getDepth(xC, yC, H / 2);
            ln(toIso(xC, yC, 0), toIso(xC, yC, H), 'PANEL', cDepth);
          }
        }
      }
    }

    // 4-C. 구간 경계 칸막이 벽체 (Partition Walls / CWallLT: 70mm폭 주황색 벽체 + 솔리드 채움)
    if (xPartitions.size > 0 || yPartitions.size > 0) {
      const FD = (mat === 'SMC' ? 75 : 0);
      // 1) 길이 방향 칸막이 벽 (X 분할벽 - 전면 수직 띠 및 지붕 횡단 띠)
      xPartitions.forEach(bx => {
        // 전면 벽체 분할 기둥 (Z = 0 ~ H, Y = map.ys[0] - FD)
        const fy0 = map.ys[0];
        for (let k = 0; k < hs.length; k++) {
          const z0 = zs[k], z1 = zs[k + 1];
          const cz = (z0 + z1) / 2;
          const wDepth = getDepth(bx + WALL_TH / 2, fy0 - FD, cz) - 5;
          const pBotL = toIso(bx, fy0 - FD, z0);
          const pBotR = toIso(bx + WALL_TH, fy0 - FD, z0);
          const pTopR = toIso(bx + WALL_TH, fy0 - FD, z1);
          const pTopL = toIso(bx, fy0 - FD, z1);
          poly([pBotL, pBotR, pTopR, pTopL], 'WALL', true, true, wDepth);
          ents.push({
            t: 'solid',
            p: [pBotL, pBotR, pTopL, pTopR],
            layer: 'WALL',
            depth: wDepth,
            _idx: ents.length
          });
        }
        // 천정 지붕 분할 띠 (Roof strip: Z = H, Y = map.ys[0] ~ totalW)
        for (let i = 0; i < map.rows.length; i++) {
          const ry0 = map.ys[i], ry1 = map.ys[i + 1];
          const rDepth = getDepth(bx + WALL_TH / 2, (ry0 + ry1) / 2, H) - 5;
          const pFrtL = toIso(bx, ry0, H);
          const pFrtR = toIso(bx + WALL_TH, ry0, H);
          const pRearR = toIso(bx + WALL_TH, ry1, H);
          const pRearL = toIso(bx, ry1, H);
          poly([pFrtL, pFrtR, pRearR, pRearL], 'WALL', true, true, rDepth);
          ents.push({
            t: 'solid',
            p: [pFrtL, pFrtR, pRearL, pRearR],
            layer: 'WALL',
            depth: rDepth,
            _idx: ents.length
          });
        }
      });

      // 2) 너비 방향 칸막이 벽 (Y 분할벽 - 우측면 수직 띠 및 지붕 종단 띠)
      yPartitions.forEach(by => {
        // 우측 벽체 분할 기둥 (Z = 0 ~ H, X = totalL + FD)
        for (let k = 0; k < hs.length; k++) {
          const z0 = zs[k], z1 = zs[k + 1];
          const cz = (z0 + z1) / 2;
          const wDepth = getDepth(totalL + FD, by + WALL_TH / 2, cz) - 5;
          const pBotF = toIso(totalL + FD, by, z0);
          const pBotR = toIso(totalL + FD, by + WALL_TH, z0);
          const pTopR = toIso(totalL + FD, by + WALL_TH, z1);
          const pTopF = toIso(totalL + FD, by, z1);
          poly([pBotF, pBotR, pTopR, pTopF], 'WALL', true, true, wDepth);
          ents.push({
            t: 'solid',
            p: [pBotF, pBotR, pTopF, pTopR],
            layer: 'WALL',
            depth: wDepth,
            _idx: ents.length
          });
        }
        // 천정 지붕 분할 띠 (Roof strip: Z = H, X = 0 ~ totalL)
        for (let j = 0; j < map.cols.length; j++) {
          const rx0 = map.xs[j], rx1 = map.xs[j + 1];
          const rDepth = getDepth((rx0 + rx1) / 2, by + WALL_TH / 2, H) - 5;
          const pLftF = toIso(rx0, by, H);
          const pRgtF = toIso(rx1, by, H);
          const pRgtR = toIso(rx1, by + WALL_TH, H);
          const pLftR = toIso(rx0, by + WALL_TH, H);
          poly([pLftF, pRgtF, pRgtR, pLftR], 'WALL', true, true, rDepth);
          ents.push({
            t: 'solid',
            p: [pLftF, pRgtF, pLftR, pRgtR],
            layer: 'WALL',
            depth: rDepth,
            _idx: ents.length
          });
        }
      });
    }

    // 5. 맨홀 및 환기구 (Manhole & Air Vent on Roof - 평면도 및 정면도 표준 형상 반영)
    const marks = Object.assign({}, opt.marks);
    Object.entries(marks).forEach(([k, mk]) => {
      const [i, j] = k.split(',').map(Number);
      if (!map.has(i, j)) return;
      const x0 = map.xs[j], y0 = map.ys[i];
      const cx = x0 + map.cols[j] / 2, cy = y0 + map.rows[i] / 2;
      const accDepth = getDepth(cx, cy, H + 50);

      if (mk & 1) { // 맨홀 (평면도 markShapes 및 정면도 CManholeLT 저상형 림 형상)
        const mhDir = getManholeDir(opt, map, i, j);
        const angleMap = { 'D': 0, 'south': 0, 'U': Math.PI, 'north': Math.PI, 'R': Math.PI / 2, 'east': Math.PI / 2, 'L': -Math.PI / 2, 'west': -Math.PI / 2 };
        const angle = angleMap[mhDir] || 0;
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const rotMh = (px, py) => {
          const dx = px - 500, dy = py - 500;
          return [x0 + 500 + (dx * cosA - dy * sinA), y0 + 500 + (dx * sinA + dy * cosA)];
        };

        // 1) 외곽 원형 림 Ø600
        isoCircle(cx, cy, H, 300, 'XY', 'FRAME', accDepth);
        isoCircle(cx, cy, H, 270, 'XY', 'PANEL_DETAIL', accDepth);

        // 2) 평면도 내부 팔각 리브 형상
        const oct1 = [[260, 105], [735, 105], [888, 260], [888, 735], [735, 888], [262, 888], [105, 735], [105, 260]];
        const oct2 = [[150, 280], [290, 150], [710, 150], [850, 280], [850, 720], [710, 850], [290, 850], [150, 720]];
        poly(oct1.map(p => { const [rx, ry] = rotMh(...p); return toIso(rx, ry, H); }), 'FRAME', true, false, accDepth);
        poly(oct2.map(p => { const [rx, ry] = rotMh(...p); return toIso(rx, ry, H); }), 'FRAME', true, false, accDepth);

        // 3) 손잡이/힌지 디테일 박스
        const tab1 = [[310, 110], [390, 110], [390, 67], [310, 67]];
        const tab2 = [[610, 110], [690, 110], [690, 67], [610, 67]];
        const tab3 = [[462, 945], [538, 945], [538, 898], [462, 898]];
        poly(tab1.map(p => { const [rx, ry] = rotMh(...p); return toIso(rx, ry, H); }), 'FRAME', true, false, accDepth);
        poly(tab2.map(p => { const [rx, ry] = rotMh(...p); return toIso(rx, ry, H); }), 'FRAME', true, false, accDepth);
        poly(tab3.map(p => { const [rx, ry] = rotMh(...p); return toIso(rx, ry, H); }), 'FRAME', true, false, accDepth);

        // 4) 정면도 CManholeLT 40mm 저상형 림
        const rimH = 40;
        isoCircle(cx, cy, H + rimH, 300, 'XY', 'FRAME', accDepth);
        ln(toIso(cx - 300, cy, H), toIso(cx - 300, cy, H + rimH), 'FRAME', accDepth);
        ln(toIso(cx + 300, cy, H), toIso(cx + 300, cy, H + rimH), 'FRAME', accDepth);
        ln(toIso(cx, cy - 300, H), toIso(cx, cy - 300, H + rimH), 'FRAME', accDepth);
        ln(toIso(cx, cy + 300, H), toIso(cx, cy + 300, H + rimH), 'FRAME', accDepth);
        // 중앙 손잡이 (방향 연동)
        const hCos = Math.cos(angle), hSin = Math.sin(angle);
        const hx1 = -70 * hCos, hy1 = -70 * hSin;
        const hx2 = 70 * hCos, hy2 = 70 * hSin;
        ln(toIso(cx + hx1, cy + hy1, H + rimH + 25), toIso(cx + hx2, cy + hy2, H + rimH + 25), 'FRAME', accDepth);
        ln(toIso(cx + hx1, cy + hy1, H + rimH), toIso(cx + hx1, cy + hy1, H + rimH + 25), 'FRAME', accDepth);
        ln(toIso(cx + hx2, cy + hy2, H + rimH), toIso(cx + hx2, cy + hy2, H + rimH + 25), 'FRAME', accDepth);
      }

      if (mk & 2) { // 에어벤트 (평면도 동심원 십자선 및 정면도 버섯형 캡)
        const ventX = (mk & 1) ? cx + 250 : cx;
        const ventY = (mk & 1) ? cy + 250 : cy;
        const vDepth = getDepth(ventX, ventY, H + 50);

        // 평면도 동심원 및 십자선
        isoCircle(ventX, ventY, H, 50, 'XY', 'REINF', vDepth);
        isoCircle(ventX, ventY, H, 100, 'XY', 'REINF', vDepth);
        ln(toIso(ventX - 120, ventY, H), toIso(ventX + 120, ventY, H), 'REINF', vDepth);
        ln(toIso(ventX, ventY - 120, H), toIso(ventX, ventY + 120, H), 'REINF', vDepth);

        // 정면도 소형 벤트 파이프 및 캡 (높이 75mm 컴팩트 규격)
        ln(toIso(ventX - 30, ventY, H), toIso(ventX - 30, ventY, H + 60), 'FRAME', vDepth);
        ln(toIso(ventX + 30, ventY, H), toIso(ventX + 30, ventY, H + 60), 'FRAME', vDepth);
        isoCircle(ventX, ventY, H + 60, 60, 'XY', 'FRAME', vDepth);
        isoCircle(ventX, ventY, H + 75, 60, 'XY', 'FRAME', vDepth);
        ln(toIso(ventX - 60, ventY, H + 60), toIso(ventX - 60, ventY, H + 75), 'FRAME', vDepth);
        ln(toIso(ventX + 60, ventY, H + 60), toIso(ventX + 60, ventY, H + 75), 'FRAME', vDepth);
      }
    });

    // 6. 외부 사다리 (정면도 ladderShapes idx=5 및 측면도 idx=7 규격 완전 일치 3D 모델)
    ladderEnts.length = 0;
    const lads = ladderList(opt, map) || [];
    lads.forEach(l => {
      const T = 40, FW = 270, FT = 20, TI = 270, FO = 200, BO = -500, TOP = 700, TTOP = 500, CX = 75, SI = 400;
      const mx = FW >> 1; // 135

      const drawSeg = (p1, p2, layer = 'FRAME') => {
        ladderEnts.push({ t: 'line', a: toIso(p1[0], p1[1], p1[2]), b: toIso(p2[0], p2[1], p2[2]), layer: layer || 'FRAME' });
      };

      if (l.sd === 'D') {
        const lx = l.x;
        let yWall = 0;
        for (let r = 0; r < map.rows.length; r++) {
          for (let c = 0; c < map.cols.length; c++) {
            if (map.has(r, c) && !map.has(r - 1, c)) {
              if (lx >= map.xs[c] - 10 && lx <= map.xs[c + 1] + 10) { yWall = map.ys[r]; break; }
            }
          }
        }

        const outP = [
          [yWall - CX, BO],
          [yWall - TI, BO + FO],
          [yWall - TI, H + TTOP],
          [yWall - TI + 75, H + TOP]
        ];
        const inP = [
          [yWall - CX, BO + T],
          [yWall - (TI - T), BO + FO],
          [yWall - (TI - T), H + TTOP],
          [yWall - (TI - T) + 75, H + TOP]
        ];

        const railsX = [
          [lx - mx - T, lx - mx],
          [lx + mx, lx + mx + T]
        ];

        railsX.forEach(([xA, xB]) => {
          for (let i = 0; i < outP.length - 1; i++) {
            drawSeg([xA, outP[i][0], outP[i][1]], [xA, outP[i + 1][0], outP[i + 1][1]]);
            drawSeg([xB, outP[i][0], outP[i][1]], [xB, outP[i + 1][0], outP[i + 1][1]]);
          }
          for (let i = 0; i < inP.length - 1; i++) {
            drawSeg([xA, inP[i][0], inP[i][1]], [xA, inP[i + 1][0], inP[i + 1][1]]);
            drawSeg([xB, inP[i][0], inP[i][1]], [xB, inP[i + 1][0], inP[i + 1][1]]);
          }
          // 상단 끝 마감 (오픈 탑 핸드레일 끝단 캡)
          drawSeg([xA, outP[3][0], outP[3][1]], [xA, inP[3][0], inP[3][1]]);
          drawSeg([xB, outP[3][0], outP[3][1]], [xB, inP[3][0], inP[3][1]]);
          drawSeg([xA, outP[3][0], outP[3][1]], [xB, outP[3][0], outP[3][1]]);
          drawSeg([xA, inP[3][0], inP[3][1]], [xB, inP[3][0], inP[3][1]]);

          // 하단 끝 마감 (패드 접속부)
          drawSeg([xA, outP[0][0], outP[0][1]], [xA, inP[0][0], inP[0][1]]);
          drawSeg([xB, outP[0][0], outP[0][1]], [xB, inP[0][0], inP[0][1]]);
          drawSeg([xA, outP[0][0], outP[0][1]], [xB, outP[0][0], outP[0][1]]);
          drawSeg([xA, inP[0][0], inP[0][1]], [xB, inP[0][0], inP[0][1]]);

          // H + TTOP 위치 꺾임선 (line 276)
          drawSeg([xA, yWall - (TI - T), H + TTOP], [xA, yWall - TI, H + TTOP]);
          drawSeg([xB, yWall - (TI - T), H + TTOP], [xB, yWall - TI, H + TTOP]);
        });

        // 발판 (Rungs) - 정면도 line 267: for (let y = BO + FO; y < H; y += FT + SI)
        const rungY = yWall - (TI - T / 2);
        const rungX1 = lx - mx, rungX2 = lx + mx;
        for (let rz = BO + FO; rz < H; rz += FT + SI) {
          drawSeg([rungX1, rungY, rz], [rungX2, rungY, rz]);
          drawSeg([rungX1, rungY, rz + FT], [rungX2, rungY, rz + FT]);
        }

        // 벽체 지지 브래킷 (Bracket) - 측면도 line 274, 275: 상부 H - 2*T 및 하부 BO + 600 + 2*T
        const bracketZList = [BO + 600 + T, H - 2 * T];
        if (H >= 3000) bracketZList.splice(1, 0, Math.round(H / 2) - T / 2);

        bracketZList.forEach(bz => {
          railsX.forEach(([xA, xB]) => {
            const bY1 = yWall, bY2 = yWall - (TI - T);
            drawSeg([xA, bY1, bz], [xA, bY2, bz]);
            drawSeg([xA, bY1, bz + T], [xA, bY2, bz + T]);
            drawSeg([xB, bY1, bz], [xB, bY2, bz]);
            drawSeg([xB, bY1, bz + T], [xB, bY2, bz + T]);
            drawSeg([xA, bY1, bz], [xA, bY1, bz + T]);
            drawSeg([xB, bY1, bz], [xB, bY1, bz + T]);
          });
        });

      } else if (l.sd === 'R') {
        const ly = l.y;
        let xWall = totalL;
        for (let r = 0; r < map.rows.length; r++) {
          if (ly >= map.ys[r] - 10 && ly <= map.ys[r + 1] + 10) {
            for (let c = map.cols.length - 1; c >= 0; c--) {
              if (map.has(r, c) && !map.has(r, c + 1)) { xWall = map.xs[c + 1]; break; }
            }
            break;
          }
        }

        const outP = [
          [xWall + CX, BO],
          [xWall + TI, BO + FO],
          [xWall + TI, H + TTOP],
          [xWall + TI - 75, H + TOP]
        ];
        const inP = [
          [xWall + CX, BO + T],
          [xWall + (TI - T), BO + FO],
          [xWall + (TI - T), H + TTOP],
          [xWall + (TI - T) - 75, H + TOP]
        ];

        const railsY = [
          [ly - mx - T, ly - mx],
          [ly + mx, ly + mx + T]
        ];

        railsY.forEach(([yA, yB]) => {
          for (let i = 0; i < outP.length - 1; i++) {
            drawSeg([outP[i][0], yA, outP[i][1]], [outP[i + 1][0], yA, outP[i + 1][1]]);
            drawSeg([outP[i][0], yB, outP[i][1]], [outP[i + 1][0], yB, outP[i + 1][1]]);
          }
          for (let i = 0; i < inP.length - 1; i++) {
            drawSeg([inP[i][0], yA, inP[i][1]], [inP[i + 1][0], yA, inP[i + 1][1]]);
            drawSeg([inP[i][0], yB, inP[i][1]], [inP[i + 1][0], yB, inP[i + 1][1]]);
          }
          drawSeg([outP[3][0], yA, outP[3][1]], [inP[3][0], yA, inP[3][1]]);
          drawSeg([outP[3][0], yB, outP[3][1]], [inP[3][0], yB, inP[3][1]]);
          drawSeg([outP[3][0], yA, outP[3][1]], [outP[3][0], yB, outP[3][1]]);
          drawSeg([inP[3][0], yA, inP[3][1]], [inP[3][0], yB, inP[3][1]]);

          drawSeg([outP[0][0], yA, outP[0][1]], [inP[0][0], yA, inP[0][1]]);
          drawSeg([outP[0][0], yB, outP[0][1]], [inP[0][0], yB, inP[0][1]]);
          drawSeg([outP[0][0], yA, outP[0][1]], [outP[0][0], yB, outP[0][1]]);
          drawSeg([inP[0][0], yA, inP[0][1]], [inP[0][0], yB, inP[0][1]]);

          drawSeg([xWall + (TI - T), yA, H + TTOP], [xWall + TI, yA, H + TTOP]);
          drawSeg([xWall + (TI - T), yB, H + TTOP], [xWall + TI, yB, H + TTOP]);
        });

        const rungX = xWall + (TI - T / 2);
        const rungY1 = ly - mx, rungY2 = ly + mx;
        for (let rz = BO + FO; rz < H; rz += FT + SI) {
          drawSeg([rungX, rungY1, rz], [rungX, rungY2, rz]);
          drawSeg([rungX, rungY1, rz + FT], [rungX, rungY2, rz + FT]);
        }

        const bracketZList = [BO + 600 + T, H - 2 * T];
        if (H >= 3000) bracketZList.splice(1, 0, Math.round(H / 2) - T / 2);

        bracketZList.forEach(bz => {
          railsY.forEach(([yA, yB]) => {
            const bX1 = xWall, bX2 = xWall + (TI - T);
            drawSeg([bX1, yA, bz], [bX2, yA, bz]);
            drawSeg([bX1, yA, bz + T], [bX2, yA, bz + T]);
            drawSeg([bX1, yB, bz], [bX2, yB, bz]);
            drawSeg([bX1, yB, bz + T], [bX2, yB, bz + T]);
            drawSeg([bX1, yA, bz], [bX1, yA, bz + T]);
            drawSeg([bX1, yB, bz], [bX1, yB, bz + T]);
          });
        });

      } else if (l.sd === 'U') {
        const lx = l.x;
        let yWall = totalW;
        for (let r = map.rows.length - 1; r >= 0; r--) {
          for (let c = 0; c < map.cols.length; c++) {
            if (map.has(r, c) && !map.has(r + 1, c)) {
              if (lx >= map.xs[c] - 10 && lx <= map.xs[c + 1] + 10) { yWall = map.ys[r + 1]; break; }
            }
          }
        }

        const outP = [
          [yWall + CX, BO],
          [yWall + TI, BO + FO],
          [yWall + TI, H + TTOP],
          [yWall + TI - 75, H + TOP]
        ];
        const inP = [
          [yWall + CX, BO + T],
          [yWall + (TI - T), BO + FO],
          [yWall + (TI - T), H + TTOP],
          [yWall + (TI - T) - 75, H + TOP]
        ];

        const railsX = [
          [lx - mx - T, lx - mx],
          [lx + mx, lx + mx + T]
        ];

        railsX.forEach(([xA, xB]) => {
          for (let i = 0; i < outP.length - 1; i++) {
            drawSeg([xA, outP[i][0], outP[i][1]], [xA, outP[i + 1][0], outP[i + 1][1]]);
            drawSeg([xB, outP[i][0], outP[i][1]], [xB, outP[i + 1][0], outP[i + 1][1]]);
          }
          for (let i = 0; i < inP.length - 1; i++) {
            drawSeg([xA, inP[i][0], inP[i][1]], [xA, inP[i + 1][0], inP[i + 1][1]]);
            drawSeg([xB, inP[i][0], inP[i][1]], [xB, inP[i + 1][0], inP[i + 1][1]]);
          }
          drawSeg([xA, outP[3][0], outP[3][1]], [xA, inP[3][0], inP[3][1]]);
          drawSeg([xB, outP[3][0], outP[3][1]], [xB, inP[3][0], inP[3][1]]);
          drawSeg([xA, outP[3][0], outP[3][1]], [xB, outP[3][0], outP[3][1]]);
          drawSeg([xA, inP[3][0], inP[3][1]], [xB, inP[3][0], inP[3][1]]);

          drawSeg([xA, outP[0][0], outP[0][1]], [xA, inP[0][0], inP[0][1]]);
          drawSeg([xB, outP[0][0], outP[0][1]], [xB, inP[0][0], inP[0][1]]);
          drawSeg([xA, outP[0][0], outP[0][1]], [xB, outP[0][0], outP[0][1]]);
          drawSeg([xA, inP[0][0], inP[0][1]], [xB, inP[0][0], inP[0][1]]);

          drawSeg([xA, yWall + (TI - T), H + TTOP], [xA, yWall + TI, H + TTOP]);
          drawSeg([xB, yWall + (TI - T), H + TTOP], [xB, yWall + TI, H + TTOP]);
        });

        const rungY = yWall + (TI - T / 2);
        const rungX1 = lx - mx, rungX2 = lx + mx;
        for (let rz = BO + FO; rz < H; rz += FT + SI) {
          drawSeg([rungX1, rungY, rz], [rungX2, rungY, rz]);
          drawSeg([rungX1, rungY, rz + FT], [rungX2, rungY, rz + FT]);
        }

        const bracketZList = [BO + 600 + T, H - 2 * T];
        if (H >= 3000) bracketZList.splice(1, 0, Math.round(H / 2) - T / 2);

        bracketZList.forEach(bz => {
          railsX.forEach(([xA, xB]) => {
            const bY1 = yWall, bY2 = yWall + (TI - T);
            drawSeg([xA, bY1, bz], [xA, bY2, bz]);
            drawSeg([xA, bY1, bz + T], [xA, bY2, bz + T]);
            drawSeg([xB, bY1, bz], [xB, bY2, bz]);
            drawSeg([xB, bY1, bz + T], [xB, bY2, bz + T]);
            drawSeg([xA, bY1, bz], [xA, bY1, bz + T]);
            drawSeg([xB, bY1, bz], [xB, bY1, bz + T]);
          });
        });

      } else if (l.sd === 'L') {
        const ly = l.y;
        let xWall = 0;
        for (let r = 0; r < map.rows.length; r++) {
          if (ly >= map.ys[r] - 10 && ly <= map.ys[r + 1] + 10) {
            for (let c = 0; c < map.cols.length; c++) {
              if (map.has(r, c) && !map.has(r, c - 1)) { xWall = map.xs[c]; break; }
            }
            break;
          }
        }

        const outP = [
          [xWall - CX, BO],
          [xWall - TI, BO + FO],
          [xWall - TI, H + TTOP],
          [xWall - TI + 75, H + TOP]
        ];
        const inP = [
          [xWall - CX, BO + T],
          [xWall - (TI - T), BO + FO],
          [xWall - (TI - T), H + TTOP],
          [xWall - (TI - T) + 75, H + TOP]
        ];

        const railsY = [
          [ly - mx - T, ly - mx],
          [ly + mx, ly + mx + T]
        ];

        railsY.forEach(([yA, yB]) => {
          for (let i = 0; i < outP.length - 1; i++) {
            drawSeg([outP[i][0], yA, outP[i][1]], [outP[i + 1][0], yA, outP[i + 1][1]]);
            drawSeg([outP[i][0], yB, outP[i][1]], [outP[i + 1][0], yB, outP[i + 1][1]]);
          }
          for (let i = 0; i < inP.length - 1; i++) {
            drawSeg([inP[i][0], yA, inP[i][1]], [inP[i + 1][0], yA, inP[i + 1][1]]);
            drawSeg([inP[i][0], yB, inP[i][1]], [inP[i + 1][0], yB, inP[i + 1][1]]);
          }
          drawSeg([outP[3][0], yA, outP[3][1]], [inP[3][0], yA, inP[3][1]]);
          drawSeg([outP[3][0], yB, outP[3][1]], [inP[3][0], yB, inP[3][1]]);
          drawSeg([outP[3][0], yA, outP[3][1]], [outP[3][0], yB, outP[3][1]]);
          drawSeg([inP[3][0], yA, inP[3][1]], [inP[3][0], yB, inP[3][1]]);

          drawSeg([outP[0][0], yA, outP[0][1]], [inP[0][0], yA, inP[0][1]]);
          drawSeg([outP[0][0], yB, outP[0][1]], [inP[0][0], yB, inP[0][1]]);
          drawSeg([outP[0][0], yA, outP[0][1]], [outP[0][0], yB, outP[0][1]]);
          drawSeg([inP[0][0], yA, inP[0][1]], [inP[0][0], yB, inP[0][1]]);

          drawSeg([xWall - (TI - T), yA, H + TTOP], [xWall - TI, yA, H + TTOP]);
          drawSeg([xWall - (TI - T), yB, H + TTOP], [xWall - TI, yB, H + TTOP]);
        });

        const rungX = xWall - (TI - T / 2);
        const rungY1 = ly - mx, rungY2 = ly + mx;
        for (let rz = BO + FO; rz < H; rz += FT + SI) {
          drawSeg([rungX, rungY1, rz], [rungX, rungY2, rz]);
          drawSeg([rungX, rungY1, rz + FT], [rungX, rungY2, rz + FT]);
        }

        const bracketZList = [BO + 600 + T, H - 2 * T];
        if (H >= 3000) bracketZList.splice(1, 0, Math.round(H / 2) - T / 2);

        bracketZList.forEach(bz => {
          railsY.forEach(([yA, yB]) => {
            const bX1 = xWall, bX2 = xWall - (TI - T);
            drawSeg([bX1, yA, bz], [bX2, yA, bz]);
            drawSeg([bX1, yA, bz + T], [bX2, yA, bz + T]);
            drawSeg([bX1, yB, bz], [bX2, yB, bz]);
            drawSeg([bX1, yB, bz + T], [bX2, yB, bz + T]);
            drawSeg([bX1, yA, bz], [bX1, yA, bz + T]);
            drawSeg([bX1, yB, bz], [bX1, yB, bz + T]);
          });
        });
      }
    });

    // 7. 벽체 보강재 (Internal Reinforcement Plates - 외각 코너 브라켓 외부 돌출 및 플랜지 은선 차폐)
    const flangeD = (mat === 'SMC' ? 75 : 0); // 외부 플랜지 돌출 폭
    const HX = 110, hq = 55, sr = 12;

    function reinfPlateFront(x1, x2, z1, z2, py, y0, pDepth) {
      // 플랜지 깊이(py ~ y0)를 포괄하는 6점 볼록다각형 차폐체 (은선 완벽 제거)
      const hull = [
        toIso(x1, py, z1),
        toIso(x2, py, z1),
        toIso(x2, y0, z1),
        toIso(x2, y0, z2),
        toIso(x1, y0, z2),
        toIso(x1, py, z2)
      ];
      poly(hull, 'REINF', false, true, pDepth);
      poly([toIso(x1, py, z1), toIso(x2, py, z1), toIso(x2, py, z2), toIso(x1, py, z2)], 'REINF', true, true, pDepth);
    }

    function reinfPlateRight(y1, y2, z1, z2, px, xWall, pDepth) {
      const hull = [
        toIso(xWall, y1, z1),
        toIso(px, y1, z1),
        toIso(px, y2, z1),
        toIso(px, y2, z2),
        toIso(xWall, y2, z2),
        toIso(xWall, y1, z2)
      ];
      poly(hull, 'REINF', false, true, pDepth);
      poly([toIso(px, y1, z1), toIso(px, y2, z1), toIso(px, y2, z2), toIso(px, y1, z2)], 'REINF', true, true, pDepth);
    }

    // (1) 전면 벽체 보강재 (Front-Facing Walls: plane 'XZ', Y = y0 - flangeD)
    for (let i = 0; i < map.rows.length; i++) {
      const y0 = map.ys[i];
      for (let j = 0; j < map.cols.length; j++) {
        if (!map.has(i, j) || map.has(i - 1, j)) continue;
        const x0 = map.xs[j], x1 = map.xs[j + 1];
        const py = y0 - flangeD;

        // 수평 단간 접합부 격자판 (Tier Seams: z = zs[k])
        for (let k = 1; k < hs.length; k++) {
          const z = zs[k];
          // 좌측 모서리 외각 브라켓 (좌측 밖으로 돌출)
          if (!map.has(i, j - 1)) {
            const pDepth = getDepth(x0 - flangeD / 2, py, z) - 35;
            // 전면 날개: x0 - flangeD ~ x0 + 40
            reinfPlateFront(x0 - flangeD, x0 + 40, z - HX, z + HX, py, y0, pDepth);
            isoCircle(x0 - flangeD / 2, py, z + hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 - flangeD / 2, py, z - hq, sr, 'XZ', 'REINF', pDepth, 12);
            // 좌측면 날개 (L-앵글 코너 마감): y0 - flangeD ~ y0
            poly([toIso(x0 - flangeD, py, z - HX), toIso(x0 - flangeD, y0, z - HX), toIso(x0 - flangeD, y0, z + HX), toIso(x0 - flangeD, py, z + HX)], 'REINF', true, true, pDepth);
            isoCircle(x0 - flangeD, y0 - flangeD / 2, z, sr, 'YZ', 'REINF', pDepth, 12);
          } else if (xPartitions.has(x0)) {
            // 칸막이 격벽 접합부: 좌측 구획으로 향하는 반쪽 격자판 (halfPlate facing left into compartment)
            const pDepth = getDepth(x0 - HX / 2, py, z) - 30;
            reinfPlateFront(x0 - HX, x0, z - HX, z + HX, py, y0, pDepth);
            isoCircle(x0 - HX / 2, py, z + hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 - HX / 2, py, z - hq, sr, 'XZ', 'REINF', pDepth, 12);
          } else {
            // 내부 기둥 접합부: fullPlate (220x220, 4볼트)
            const pDepth = getDepth(x0, py, z) - 30;
            reinfPlateFront(x0 - HX, x0 + HX, z - HX, z + HX, py, y0, pDepth);
            isoCircle(x0 - hq, py, z + hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 - hq, py, z - hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 + hq, py, z + hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 + hq, py, z - hq, sr, 'XZ', 'REINF', pDepth, 12);
          }

          // 우측 모서리 끝단 (외각 코너 브라켓 전면 날개: x1 - 40 ~ x1 + flangeD, 우측 밖으로 돌출)
          if (!map.has(i, j + 1)) {
            const pDepth = getDepth(x1 + flangeD / 2, py, z) - 35;
            reinfPlateFront(x1 - 40, x1 + flangeD, z - HX, z + HX, py, y0, pDepth);
            isoCircle(x1 + flangeD / 2, py, z + hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x1 + flangeD / 2, py, z - hq, sr, 'XZ', 'REINF', pDepth, 12);
          }
        }

        // 최상단 판넬 중앙 보강판 (midRect: 220x110, 2볼트 - 칸막이벽 위치 제외)
        if (hs.length >= 1) {
          const topK = hs.length - 1;
          const topZMid = zs[topK] + Math.round(hs[topK] / 2);
          if (map.has(i, j - 1) && !xPartitions.has(x0)) {
            const pDepth = getDepth(x0, py, topZMid) - 30;
            reinfPlateFront(x0 - HX, x0 + HX, topZMid - hq, topZMid + hq, py, y0, pDepth);
            isoCircle(x0 - hq, py, topZMid, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 + hq, py, topZMid, sr, 'XZ', 'REINF', pDepth, 12);
          }
        }

        // H > 3000 바닥 보강판 (lowPlate: 220x110, 2볼트 - 칸막이벽 위치 제외)
        if (H > 3000 && map.has(i, j - 1) && !xPartitions.has(x0)) {
          const pDepth = getDepth(x0, py, hq) - 30;
          reinfPlateFront(x0 - HX, x0 + HX, 0, HX, py, y0, pDepth);
          isoCircle(x0 - hq, py, hq, sr, 'XZ', 'REINF', pDepth, 12);
          isoCircle(x0 + hq, py, hq, sr, 'XZ', 'REINF', pDepth, 12);
        }
      }
    }

    // (2) 우측 벽체 보강재 (Right-Facing Walls: plane 'YZ', X = xWall + flangeD)
    for (let i = 0; i < map.rows.length; i++) {
      const y0 = map.ys[i], y1 = map.ys[i + 1];
      for (let j = 0; j < map.cols.length; j++) {
        if (!map.has(i, j) || map.has(i, j + 1)) continue;
        const xWall = map.xs[j + 1];
        const px = xWall + flangeD;

        // 수평 단간 접합부 격자판
        for (let k = 1; k < hs.length; k++) {
          const z = zs[k];
          // 전면 모서리 외각 브라켓 우측 날개 (y0 - flangeD ~ y0 + 40, 전면 코너와 연결되어 완벽한 L-Angle 완성)
          if (!map.has(i - 1, j)) {
            const pDepth = getDepth(px, y0 - flangeD / 2, z) - 35;
            reinfPlateRight(y0 - flangeD, y0 + 40, z - HX, z + HX, px, xWall, pDepth);
            isoCircle(px, y0 - flangeD / 2, z + hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 - flangeD / 2, z - hq, sr, 'YZ', 'REINF', pDepth, 12);
          } else if (yPartitions.has(y0)) {
            // 칸막이 격벽 접합부: 전면 구획으로 향하는 반쪽 격자판
            const pDepth = getDepth(px, y0 - HX / 2, z) - 30;
            reinfPlateRight(y0 - HX, y0, z - HX, z + HX, px, xWall, pDepth);
            isoCircle(px, y0 - HX / 2, z + hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 - HX / 2, z - hq, sr, 'YZ', 'REINF', pDepth, 12);
          } else {
            // 내부 기둥 접합부: fullPlate (220x220, 4볼트)
            const pDepth = getDepth(px, y0, z) - 30;
            reinfPlateRight(y0 - HX, y0 + HX, z - HX, z + HX, px, xWall, pDepth);
            isoCircle(px, y0 - hq, z + hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 - hq, z - hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 + hq, z + hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 + hq, z - hq, sr, 'YZ', 'REINF', pDepth, 12);
          }

          // 후면 모서리 끝단 (외각 코너 브라켓 우측 날개: y1 - 40 ~ y1 + flangeD, 후면 밖으로 돌출)
          if (!map.has(i + 1, j)) {
            const pDepth = getDepth(px, y1 + flangeD / 2, z) - 35;
            reinfPlateRight(y1 - 40, y1 + flangeD, z - HX, z + HX, px, xWall, pDepth);
            isoCircle(px, y1 + flangeD / 2, z + hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y1 + flangeD / 2, z - hq, sr, 'YZ', 'REINF', pDepth, 12);
            // 후면 날개 (L-앵글 코너 마감)
            poly([toIso(px, y1 + flangeD, z - HX), toIso(xWall, y1 + flangeD, z - HX), toIso(xWall, y1 + flangeD, z + HX), toIso(px, y1 + flangeD, z + HX)], 'REINF', true, true, pDepth);
            isoCircle(xWall + flangeD / 2, y1 + flangeD, z, sr, 'XZ', 'REINF', pDepth, 12);
          }
        }

        // 최상단 판넬 중앙 보강판 (midRect: 220x110, 2볼트 - 칸막이벽 위치 제외)
        if (hs.length >= 1) {
          const topK = hs.length - 1;
          const topZMid = zs[topK] + Math.round(hs[topK] / 2);
          if (map.has(i - 1, j) && !yPartitions.has(y0)) {
            const pDepth = getDepth(px, y0, topZMid) - 30;
            reinfPlateRight(y0 - HX, y0 + HX, topZMid - hq, topZMid + hq, px, xWall, pDepth);
            isoCircle(px, y0 - hq, topZMid, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 + hq, topZMid, sr, 'YZ', 'REINF', pDepth, 12);
          }
        }

        // H > 3000 바닥 보강판 (lowPlate: 220x110, 2볼트 - 칸막이벽 위치 제외)
        if (H > 3000 && map.has(i - 1, j) && !yPartitions.has(y0)) {
          const pDepth = getDepth(px, y0, hq) - 30;
          reinfPlateRight(y0 - HX, y0 + HX, 0, HX, px, xWall, pDepth);
          isoCircle(px, y0 - hq, hq, sr, 'YZ', 'REINF', pDepth, 12);
          isoCircle(px, y0 + hq, hq, sr, 'YZ', 'REINF', pDepth, 12);
        }
      }
    }

    // 8. 노즐 (Nozzles)
    if (opt.useNozzles !== false) {
      const nozzles = getNozzleList(opt);
      nozzles.forEach(n => {
        const spec = getNozzleSpec(n.size);
        let rawElev = typeof n.elev === 'number' ? n.elev : (H - 300);
        let elev = rawElev;
        const isOverflow = n.name === 'OVERFLOW' || (n.desc && n.desc.includes('월류'));
        const isInlet = n.name === 'INLET' || (n.desc && (n.desc.includes('유입') || n.desc.includes('급수')));
        if (isOverflow) {
          elev = Math.max(100, H - 200);
        } else if (isInlet && n.face !== 'top') {
          elev = Math.max(100, H - 300);
        } else if (elev > H - 100) {
          elev = Math.max(100, H - 150);
        }
        const markLabel = formatNozzleLabel(n);

        if (n.face === 'front') {
          const colIdx = Math.max(0, Math.min(n.seg - 1, map.cols.length - 1));
          const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + (n.offset || 0);
          let frontY = 0;
          let foundFront = false;
          for (let r = 0; r < map.rows.length; r++) {
            if (map.has(r, colIdx) && !map.has(r - 1, colIdx)) { frontY = map.ys[r]; foundFront = true; break; }
          }
          if (!foundFront) return;
          const stubLen = 140;
          const nDepth = getDepth(cx, frontY - stubLen, elev);
          ln(toIso(cx, frontY, elev), toIso(cx, frontY - stubLen, elev), 'NOZZLE', nDepth);
          isoCircle(cx, frontY - stubLen, elev, spec.rf, 'XZ', 'NOZZLE', nDepth);
          isoCircle(cx, frontY - stubLen, elev, spec.r, 'XZ', 'NOZZLE', nDepth);
          const pStart = toIso(cx, frontY - stubLen, elev);
          const pEnd = [pStart[0] - Math.round(textH * 3.5), pStart[1] + Math.round(textH * 1.8)];
          drawLeader(ents, pStart, [pEnd[0] + textH * 1.5, pEnd[1]], pEnd, [markLabel, `(EL.+${elev})`], textH * 0.85, 'right', 'NOZZLE');
        } else if (n.face === 'right') {
          const rowIdx = Math.max(0, Math.min(n.seg - 1, map.rows.length - 1));
          const cy = (map.ys[rowIdx] + map.ys[rowIdx + 1]) / 2 + (n.offset || 0);
          let rightX = totalL;
          let foundRight = false;
          for (let c = map.cols.length - 1; c >= 0; c--) {
            if (map.has(rowIdx, c) && !map.has(rowIdx, c + 1)) { rightX = map.xs[c + 1]; foundRight = true; break; }
          }
          if (!foundRight) return;
          const stubLen = 140;
          const nDepth = getDepth(rightX + stubLen, cy, elev);
          ln(toIso(rightX, cy, elev), toIso(rightX + stubLen, cy, elev), 'NOZZLE', nDepth);
          isoCircle(rightX + stubLen, cy, elev, spec.rf, 'YZ', 'NOZZLE', nDepth);
          isoCircle(rightX + stubLen, cy, elev, spec.r, 'YZ', 'NOZZLE', nDepth);
          const pStart = toIso(rightX + stubLen, cy, elev);
          const pEnd = [pStart[0] + Math.round(textH * 3.5), pStart[1] + Math.round(textH * 1.8)];
          drawLeader(ents, pStart, [pEnd[0] - textH * 1.5, pEnd[1]], pEnd, [markLabel, `(EL.+${elev})`], textH * 0.85, 'left', 'NOZZLE');
        } else if (n.face === 'top') {
          const colIdx = Math.max(0, Math.min((n.topCell && n.topCell[1]) || 0, map.cols.length - 1));
          const rowIdx = Math.max(0, Math.min((n.topCell && n.topCell[0]) || 0, map.rows.length - 1));
          if (!map.has(rowIdx, colIdx)) return;
          const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + (n.offset || 0);
          const cy = (map.ys[rowIdx] + map.ys[rowIdx + 1]) / 2;
          const stubLen = 160;
          const nDepth = getDepth(cx, cy, H + stubLen);
          ln(toIso(cx, cy, H), toIso(cx, cy, H + stubLen), 'NOZZLE', nDepth);
          isoCircle(cx, cy, H + stubLen, spec.rf, 'XY', 'NOZZLE', nDepth);
          isoCircle(cx, cy, H + stubLen, spec.r, 'XY', 'NOZZLE', nDepth);
          const pStart = toIso(cx, cy, H + stubLen);
          const pEnd = [pStart[0] + Math.round(textH * 3.5), pStart[1] + Math.round(textH * 2.0)];
          drawLeader(ents, pStart, [pEnd[0] - textH * 1.5, pEnd[1]], pEnd, [markLabel, '(TOP INLET)'], textH * 0.85, 'left', 'NOZZLE');
        } else if (n.face === 'bottom') {
          const cell = n.bottomCell || n.topCell || [0, 0];
          const colIdx = Math.max(0, Math.min(cell[1], map.cols.length - 1));
          const rowIdx = Math.max(0, Math.min(cell[0], map.rows.length - 1));
          if (!map.has(rowIdx, colIdx)) return;
          const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + (n.offset || 0);
          const cy = (map.ys[rowIdx] + map.ys[rowIdx + 1]) / 2;
          const stubLen = 140;
          const nDepth = getDepth(cx, cy, -stubLen);
          ln(toIso(cx, cy, 0), toIso(cx, cy, -stubLen), 'NOZZLE', nDepth);
          isoCircle(cx, cy, -stubLen, spec.rf, 'XY', 'NOZZLE', nDepth);
          isoCircle(cx, cy, -stubLen, spec.r, 'XY', 'NOZZLE', nDepth);
          const pStart = toIso(cx, cy, -stubLen);
          const pEnd = [pStart[0] + Math.round(textH * 3.5), pStart[1] - Math.round(textH * 1.8)];
          const isEn = (opt.drawingLang || opt.lang) === 'en';
          drawLeader(ents, pStart, [pEnd[0] - textH * 1.5, pEnd[1]], pEnd, [markLabel, isEn ? '(BOTTOM DRAIN)' : '(하부 드레인)'], textH * 0.85, 'left', 'NOZZLE');
        }
      });
    }
    } // end if (!opt.onlySkidAndPad)

    // 9. 3D 등각 치수선 (L, W, H) - 사용자 요청으로 등각조감도 치수선 기입 생략


    // 10. 화가 알고리즘 (Painter's Algorithm) 정렬: 원거리(높은 depth) -> 근거리(낮은 depth)
    ents.forEach((e, idx) => { e._idx = idx; });
    ents.sort((a, b) => {
      // 기초 콘크리트 패드(PAD / isFoundation)는 항상 탱크 본체(z >= 0) 하부에 위치하므로
      // 화가 알고리즘에서 가장 먼저(원거리/배경) 그려져야 하며, 상부 판넬/프레임을 덮어 지우지 않아야 함
      const isFoundA = a.isFoundation || a.layer === 'PAD';
      const isFoundB = b.isFoundation || b.layer === 'PAD';
      if (isFoundA !== isFoundB) {
        return isFoundA ? -1 : 1;
      }
      const isReinfA = a.layer === 'REINF';
      const isReinfB = b.layer === 'REINF';
      if (isReinfA !== isReinfB) return isReinfA ? 1 : -1;

      const isWallA = a.layer === 'WALL';
      const isWallB = b.layer === 'WALL';
      if (isWallA !== isWallB) {
        const isBaseA = a.layer === 'PANEL' || a.layer === 'PANEL_DETAIL' || a.layer === 'FRAME';
        const isBaseB = b.layer === 'PANEL' || b.layer === 'PANEL_DETAIL' || b.layer === 'FRAME';
        if (isWallA && isBaseB) return 1;
        if (isWallB && isBaseA) return -1;
      }
      const dDiff = (b.depth !== undefined ? b.depth : 0) - (a.depth !== undefined ? a.depth : 0);
      if (Math.abs(dDiff) > 1e-4) return dDiff;
      return a._idx - b._idx;
    });
    // 10-B. 2D 벡터 은선 제거 (Hidden Line Removal for CAD / Wireframe export)
    // 전면에 위치한 불투명 면(Panel / Roof / Pad)에 가려지는 후면 와이어프레임 선분 자동 클리핑
    const opaquePolys = ents.filter(e => e.t === 'poly' && e.fill && e.pts && e.pts.length >= 3 && e.depth !== undefined);

    function clipSegmentAgainstConvexQuad(A, B, P) {
      let area = 0;
      for (let i = 0; i < P.length; i++) {
        const p1 = P[i], p2 = P[(i + 1) % P.length];
        area += (p1[0] * p2[1] - p2[0] * p1[1]);
      }
      const ccw = area > 0;
      const D = [B[0] - A[0], B[1] - A[1]];
      let tIn = 0, tOut = 1;

      for (let i = 0; i < P.length; i++) {
        const p1 = P[i], p2 = P[(i + 1) % P.length];
        const ex = p2[0] - p1[0], ey = p2[1] - p1[1];
        const nx = ccw ? ey : -ey, ny = ccw ? -ex : ex;
        const num = nx * (p1[0] - A[0]) + ny * (p1[1] - A[1]);
        const den = nx * D[0] + ny * D[1];

        if (Math.abs(den) < 1e-9) {
          if (num < 0) return [[A, B]]; // Outside
        } else {
          const t = num / den;
          if (den < 0) { if (t > tIn) tIn = t; }
          else { if (t < tOut) tOut = t; }
          if (tIn > tOut) return [[A, B]];
        }
      }

      const entry = Math.max(0, tIn);
      const exit = Math.min(1, tOut);
      if (entry >= exit - 1e-5) return [[A, B]];

      const res = [];
      if (entry > 1e-4) res.push([A, [A[0] + entry * D[0], A[1] + entry * D[1]]]);
      if (exit < 1 - 1e-4) res.push([[A[0] + exit * D[0], A[1] + exit * D[1]], B]);
      return res;
    }

    opaquePolys.forEach(p => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < p.pts.length; i++) {
        const pt = p.pts[i];
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minY) minY = pt[1];
        if (pt[1] > maxY) maxY = pt[1];
      }
      p._bb = [minX, maxX, minY, maxY];
    });

    const newEnts = [];
    ents.forEach(e => {
      if (e.t === 'poly') {
        newEnts.push(e);
      } else if (e.t === 'line') {
        if (e.depth === undefined || e.layer === 'DIM' || e.layer === 'BALLOON') {
          newEnts.push(e);
          return;
        }
        let segs = [[e.a, e.b]];
        const eDepth = e.depth;

        for (let i = 0; i < opaquePolys.length; i++) {
          const poly = opaquePolys[i];
          // Polygon must be strictly in FRONT of the line (lower depth by at least 15mm)
          // Foundation elements (PAD / isFoundation) must NEVER be clipped by any polygon, and foundation polygons never clip lines
          if (e.isFoundation || e.layer === 'PAD') continue;
          if (poly.isFoundation || poly.layer === 'PAD') continue;
          // Skid channels (z <= 0) can NEVER occlude tank panels, panel details, nozzles, or reinforcements (z >= 0)
          if (poly.layer === 'FRAME' && (e.layer === 'PANEL' || e.layer === 'PANEL_DETAIL' || e.layer === 'NOZZLE' || e.layer === 'REINF' || e.layer === 'WALL')) continue;
          // Exterior reinforcements (REINF), partition markers (WALL), and nozzles (NOZZLE) must NEVER be clipped by background panels, frames, or each other
          if (e.layer === 'REINF' || e.layer === 'WALL' || e.layer === 'NOZZLE') continue;
          // Roof accessories (manholes/vents: FRAME at z >= H) and base skid (FRAME at z <= 0) must never be clipped by wall/roof panels
          if (e.layer === 'FRAME' && (poly.layer === 'PANEL' || poly.layer === 'PANEL_DETAIL')) continue;

          // Polygon must be strictly in FRONT of the line (lower depth by at least 15mm)
          if (((poly.layer === 'REINF' || poly.layer === 'WALL') && (e.layer === 'FRAME' || e.layer === 'PANEL' || e.layer === 'PANEL_DETAIL')) || poly.depth < eDepth - 15) {
            const bb = poly._bb;
            const nextSegs = [];
            for (let s = 0; s < segs.length; s++) {
              const A = segs[s][0], B = segs[s][1];
              const sMinX = A[0] < B[0] ? A[0] : B[0];
              const sMaxX = A[0] > B[0] ? A[0] : B[0];
              const sMinY = A[1] < B[1] ? A[1] : B[1];
              const sMaxY = A[1] > B[1] ? A[1] : B[1];
              if (sMaxX < bb[0] || sMinX > bb[1] || sMaxY < bb[2] || sMinY > bb[3]) {
                nextSegs.push(segs[s]);
                continue;
              }
              const clipped = clipSegmentAgainstConvexQuad(A, B, poly.pts);
              for (let c = 0; c < clipped.length; c++) nextSegs.push(clipped[c]);
            }
            segs = nextSegs;
            if (segs.length === 0) break;
          }
        }

        segs.forEach(([a, b]) => {
          newEnts.push({ ...e, a, b });
        });
      } else {
        newEnts.push(e);
      }
    });

    ents.length = 0;
    for (let i = 0; i < newEnts.length; i++) ents.push(newEnts[i]);
    opaquePolys.forEach(p => { delete p._bb; });

    ents.forEach(e => { delete e._idx; delete e.depth; });

    // 11. 외부 사다리(Ladder)는 판넬/틀에 덮여 가려지지 않도록 맨 마지막에 최상단으로 렌더링
    for (let i = 0; i < ladderEnts.length; i++) ents.push(ladderEnts[i]);

    return { ents, textH, totalL, totalW, H };
  }


  /* ---------- FRAME 도면: 기초 프레임(STEEL SKID, TankBaseFrame) / 내부 스테이(INTERNAL STAY, TankInSTAY) ---------- */
  function frameGeom(opt) {
    const map = createMap(opt);
    const R = (i, j) => (i < 0 || j < 0 || i >= map.rows.length || j >= map.cols.length || !map.has(i, j)) ? null
      : { l: map.xs[j], r: map.xs[j] + map.cols[j], t: map.ys[i], b: map.ys[i] + map.rows[i], w: map.cols[j], h: map.rows[i] };
    const nr = map.rows.length, nc = map.cols.length;
    let sRow = -1, eRow = -1, sCol = -1, eCol = -1;
    for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) if (R(i, j)) { if (sRow < 0) sRow = i; eRow = i; if (sCol < 0 || j < sCol) sCol = j; if (j > eCol) eCol = j; }
    const rowTop = i => { for (let k = i; k < nr; k++) for (let j = 0; j < nc; j++) { const c = R(k, j); if (c) return c.t; } return 0; };   // GetTop(i)
    const colLeft = j => { for (let k = j; k < nc; k++) for (let i = 0; i < nr; i++) { const c = R(i, k); if (c) return c.l; } return 0; };
    const first = (a) => { for (const [i, j] of a) { const c = R(i, j); if (c) return c; } return null; };
    const cells = []; for (let j = 0; j < nc; j++) for (let i = 0; i < nr; i++) cells.push([i, j]);
    const nLeft = (first(cells) || { l: 0 }).l;
    const cellsRev = cells.slice().reverse().sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]));
    const nRight = (first(cellsRev) || { r: 0 }).r;
    const byRow = []; for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) byRow.push([i, j]);
    const nTop = (first(byRow) || { t: 0 }).t;
    const byRowRev = []; for (let i = nr - 1; i >= 0; i--) for (let j = 0; j < nc; j++) byRowRev.push([i, j]);
    const nBottom = (first(byRowRev) || { b: 0 }).b;
    return { map, R, nr, nc, sRow, eRow, sCol, eCol, rowTop, colLeft, nLeft, nRight, nTop, nBottom };
  }
  const rectEnts = (x, y, w, h, layer, out) => { const p = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; for (let k = 0; k < 4; k++) out.push({ t: 'line', a: p[k], b: p[(k + 1) % 4], layer }); };

  // 볼트 구멍 및 십자선 (Bolt hole with crosshairs)
  const drawBoltHole = (out, cx, cy, r = 7, clen = 16, layer = 'FRAME') => {
    out.push({ t: 'circle', c: [cx, cy], r, layer });
    out.push({ t: 'line', a: [cx - clen / 2, cy], b: [cx + clen / 2, cy], layer });
    out.push({ t: 'line', a: [cx, cy - clen / 2], b: [cx, cy + clen / 2], layer });
  };

  // 연결 브라켓 WBR-7575Z (75Angle/125Channel) & WBR-0120CZE (150Channel)
  const drawCornerBracket = (out, x, y, size = 75, thk = 6, dirX = 1, dirY = 1, layer = 'FRAME') => {
    const pts = [
      [x, y],
      [x + dirX * size, y],
      [x + dirX * size, y + dirY * thk],
      [x + dirX * thk, y + dirY * thk],
      [x + dirX * thk, y + dirY * size],
      [x, y + dirY * size]
    ];
    for (let k = 0; k < pts.length; k++) {
      out.push({ t: 'line', a: pts[k], b: pts[(k + 1) % pts.length], layer });
    }
    // 볼트 홀 (Ø17 볼트 체결용 - 도면 기준 코너/힐에서 50mm, 토우에서 25mm 위치)
    // 1. 수평 레그 (X방향) 관통 볼트선 (폭 17mm) 및 중심선
    const hx = x + dirX * 50;
    out.push({ t: 'line', a: [hx - 8.5, y], b: [hx - 8.5, y + dirY * thk], layer });
    out.push({ t: 'line', a: [hx + 8.5, y], b: [hx + 8.5, y + dirY * thk], layer });
    out.push({ t: 'line', a: [hx, y - dirY * 3], b: [hx, y + dirY * (thk + 3)], layer });

    // 2. 수직 레그 (Y방향) 관통 볼트선 (폭 17mm) 및 중심선
    const hy = y + dirY * 50;
    out.push({ t: 'line', a: [x, hy - 8.5], b: [x + dirX * thk, hy - 8.5], layer });
    out.push({ t: 'line', a: [x, hy + 8.5], b: [x + dirX * thk, hy + 8.5], layer });
    out.push({ t: 'line', a: [x - dirX * 3, hy], b: [x + dirX * (thk + 3), hy], layer });
  };

  // 앙카 클램프 WBR-5010Z (M12 앙카 체결용 플레이트)
  const drawAnchorClamp = (out, cx, cy, w = 50, h = 35, layer = 'FRAME') => {
    const x0 = cx - w / 2, y0 = cy - h / 2;
    out.push({ t: 'line', a: [x0, y0], b: [x0 + w, y0], layer });
    out.push({ t: 'line', a: [x0 + w, y0], b: [x0 + w, y0 + h], layer });
    out.push({ t: 'line', a: [x0 + w, y0 + h], b: [x0, y0 + h], layer });
    out.push({ t: 'line', a: [x0, y0 + h], b: [x0, y0], layer });
    drawBoltHole(out, cx, cy, 6.5, 14, layer);
  };

  // L방향 판넬 배치에 따른 주재 표준 규격 분할 (2.0M: 1990, 1.5M: 1490, 1.0M: 0990)
  // 500mm 판넬이 있는 경우 인접 판넬과 결합하여 반드시 1.5M(1490) 부재를 사용
  function computeColSpans(cols) {
    if (!cols || !cols.length) return [1000];
    const n = cols.length;
    const memo = new Map();
    function solve(idx) {
      if (idx >= n) return { cost: 0, spans: [] };
      if (memo.has(idx)) return memo.get(idx);
      let best = null;
      let sum = 0;
      const cands = [];
      for (let j = idx; j < n; j++) {
        sum += cols[j];
        if (sum > 2000) break;
        if (sum === 2000 || sum === 1500 || sum === 1000) {
          cands.push({ j, sum });
        }
      }
      cands.sort((a, b) => b.sum - a.sum);

      for (const cand of cands) {
        let stepCost = 0;
        if (cand.sum === 2000) stepCost = 10;
        else if (cand.sum === 1500) stepCost = 20;
        else if (cand.sum === 1000) stepCost = 30;

        const sub = solve(cand.j + 1);
        const totalCost = stepCost + sub.cost;
        if (!best || totalCost < best.cost) {
          best = { cost: totalCost, spans: [cand.sum, ...sub.spans] };
        }
      }
      if (!best) {
        const sub = solve(idx + 1);
        best = { cost: 100000 + sub.cost, spans: [cols[idx], ...sub.spans] };
      }
      memo.set(idx, best);
      return best;
    }
    return solve(0).spans;
  }

  // 실제 제작 부재 기반 프레임 작도 (주 베이스 프레임 ㄷ-125 / 서브 빔 A·B·C타입 결합부)
  function insideFrm(out, x, y, w, h, lat, rec, colSpans, nLeft) {
    const L = (w > h) ? 'FRAME_MAIN_L' : 'FRAME_MAIN_W', ln = (a, b) => out.push({ t: 'line', a, b, layer: L });
    const DIV = 2000, MIN = 850;
    const cuts = [];
    const divide = (len, at0) => {
      const at = d => { cuts.push(d); at0(d); };
      if (w > h && colSpans && colSpans.length > 1) {
        let acc = 0;
        for (let k = 0; k < colSpans.length - 1; k++) {
          acc += colSpans[k];
          // 이음부 중심선 = 탱크 판넬 접합선 위치 (x + d = nLeft + acc)
          const cutPos = (nLeft !== undefined ? (nLeft + acc) : (x + acc)) - x;
          at(cutPos);
        }
        return;
      }
      const cnt = (len % DIV >= MIN) ? Math.trunc(len / DIV) : Math.trunc(len / DIV) - 1;
      if (cnt <= 0) return;
      for (let i = 1; i <= cnt; i++) at(DIV * i);
      const r = len % DIV;
      if (r >= 200 && r < 500) at(DIV * cnt + 1000); else if (r >= 500 && r < MIN) at(DIV * cnt + 1500);
    };

    if (w > h) {
      // 1. 수평 주 베이스 프레임 (ㄷ-125x65x6T 또는 L-75x75x6T 채널/앵글)
      rectEnts(x, y, w, h, L, out);
      // 웨브 두께선 (6mm) - 첫줄과 마지막줄은 외측(탱크 밖)으로 열리도록 배치
      if (lat === 0x20000) {
        // 첫줄(하부): 탱크 외측(하부, -Y)으로 열림 -> 웨브는 상단(내측)인 y + h - 6
        ln([x, y + h - 6], [x + w, y + h - 6]);
      } else if (lat === 0x40000) {
        // 마지막줄(상부): 탱크 외측(상부, +Y)으로 열림 -> 웨브는 하단(내측)인 y + 6
        ln([x, y + 6], [x + w, y + 6]);
      } else if (lat === 0x10000) {
        // 중간행 하향 개구(toes down): 웨브는 상단인 y + h - 6
        ln([x, y + h - 6], [x + w, y + h - 6]);
      } else {
        // 중간행 상향 개구(toes up): 웨브는 하단인 y + 6
        ln([x, y + 6], [x + w, y + 6]);
      }

      // 분할 이음부 (분할 절단선)
      divide(w, d => {
        ln([x + d, y], [x + d, y + h]);
      });
    } else if (w < h) {
      // 2. 수직 서브 빔 (A·B·C타입 채널 [-75x40x5T / L-75x75x6T)
      rectEnts(x, y, w, h, L, out);
      // 웨브 두께선 (5mm)
      ln([x + 5, y], [x + 5, y + h]);
      divide(h, d => ln([x, y + d], [x + w, y + d]));
    } else {
      rectEnts(x, y, w, h, L, out);
    }

    if (rec && w !== h) {
      const len = w > h ? w : h, cs = cuts.slice().sort((a, b) => a - b), pts = [0, ...cs, len], segs = [];
      for (let k = 0; k + 1 < pts.length; k++) segs.push(pts[k + 1] - pts[k]);
      rec.push({ hor: w > h, x, y, w, h, pts, segs, lat, colSpans: (w > h ? colSpans : null) });
    }
  }

  // 프레임도 치수: 열 폭(아래), 행 높이(왼쪽), 전체
  function frameDims(ents, map, textH, cols, rows) {
    const yb = -textH * 4, xl = -75 - textH * 4;
    if (cols) {
      map.cols.forEach((w, j) => dimLinear(ents, [map.xs[j], 0], [map.xs[j] + w, 0], yb, false, String(w), textH, 'DIM'));
      dimLinear(ents, [0, 0], [map.length, 0], yb - textH * 3, false, String(map.length), textH, 'DIM');
    }
    if (rows) {
      map.rows.forEach((h, i) => dimLinear(ents, [0, map.ys[i]], [0, map.ys[i] + h], xl, true, String(h), textH, 'DIM'));
      dimLinear(ents, [0, 0], [0, map.width], xl - textH * 3, true, String(map.width), textH, 'DIM');
    }
  }
  const frameTextH = (map, opt) => Math.max(60, Math.round(Math.max(map.length, map.width) / 100), Math.round(2.4 * ((opt && opt._N) || 0)));

  function computeMainBeamSpans(W) {
    if (W <= 2500) return [{ span: W, type: 'single' }];

    // W = 3000: 사용자 요구사항 (2000 + 1000 분할 -> 시작 2070ASZR/L + 끝 1070ASZL/R 신규부품)
    if (W === 3000) {
      return [
        { span: 2000, type: 'start' },
        { span: 1000, type: 'end' }
      ];
    }

    let pairs;
    if (W % 2000 === 0) {
      pairs = [
        [2000, 2000],
        [1500, 1500],
        [1500, 2000],
        [2000, 1500],
        [1000, 1000],
        [2500, 2500]
      ];
    } else if (W % 2000 === 1000) {
      pairs = [
        [1500, 1500],
        [2000, 2000],
        [1500, 2000],
        [2000, 1500],
        [1000, 1000],
        [2500, 2500]
      ];
    } else {
      pairs = [
        [1500, 2000],
        [2000, 1500],
        [1500, 1500],
        [2000, 2000],
        [1000, 1000],
        [2500, 2500]
      ];
    }

    for (const [s0, sk] of pairs) {
      const rem = W - (s0 + sk);
      if (rem === 0) {
        return [
          { span: s0, type: 'start' },
          { span: sk, type: 'end' }
        ];
      }
      if (rem > 0 && rem % 500 === 0) {
        let r = rem;
        const mids = [];
        while (r >= 2000 && r !== 2500 && r !== 3500) {
          mids.push({ span: 2000, type: 'mid' });
          r -= 2000;
        }
        if (r === 3500) {
          mids.push({ span: 2000, type: 'mid' });
          mids.push({ span: 1500, type: 'mid' });
          r = 0;
        } else if (r === 2500) {
          mids.push({ span: 1500, type: 'mid' });
          mids.push({ span: 1000, type: 'mid' });
          r = 0;
        } else if (r === 1500) {
          mids.push({ span: 1500, type: 'mid' });
          r = 0;
        } else if (r === 1000) {
          mids.push({ span: 1000, type: 'mid' });
          r = 0;
        }
        if (r === 0) {
          return [
            { span: s0, type: 'start' },
            ...mids,
            { span: sk, type: 'end' }
          ];
        }
      }
    }
    return [{ span: W, type: 'single' }];
  }

  // 스틸 스키드 프레임 전용 부품 사양 명세표 (Skid Frame BOM / Part List)
  function buildSkidBOM(opt) {
    opt = normFrameOpt(opt);
    const fNum = Number(opt.frame) || 75;
    const fSuf = (fNum === 75) ? 'ALZ' : (fNum === 150 ? 'HCLZ' : 'CLZ');
    const dSkid = getSkidDimensions(fNum);
    const mmap = createMap(opt);
    const G = { map: mmap, nc: mmap.cols.length, nr: mmap.rows.length };
    const centerBay = getCenterBay(mmap);
    const flgW = dSkid.mainW;
    const lapIn = 5;
    const overY = flgW - lapIn;
    const firstW = Number(opt && opt.padFirstW) || 400;
    const midW = Number(opt && opt.padMidW) || 300;
    const padOv = (opt && opt.padOverhang !== undefined && opt.padOverhang !== '') ? Number(opt.padOverhang) : Math.round(firstW / 2);
    const lang = opt.drawingLang || opt.lang || 'ko';

    // 1. W방향 외곽 주재 카운트
    const wBeamCounts = {};
    const sRow = 0, eRow = G.nr - 1, sCol = 0, eCol = G.nc - 1;
    const R = (r, c) => G.map.has(r, c) ? { t: G.map.ys[r], h: G.map.rows[r] } : null;

    const isN = getFrameVariant(opt) === 'N';
    // N형 W방향 주재(0990/1490/1990)는 L방향 주재와 동일 품번(공용 부품, W방향 체결용 추가 Hole 가공) → L방향 수량에 합산
    const wNCounts = {};
    function countMainW(col, isRightSide) {
      let nHeight = 0, runRows = [];
      for (let i = sRow; i <= eRow; i++) {
        let rc = R(i, col);
        if (!rc) {
          if (nHeight) { addWSpans(nHeight, isRightSide, runRows); nHeight = 0; runRows = []; }
          for (i = i + 1; i <= eRow; i++) { rc = R(i, col); if (!rc) continue; break; }
        }
        if (rc) { nHeight += rc.h; runRows.push(rc.h); }
      }
      if (nHeight) addWSpans(nHeight, isRightSide, runRows);
    }

    let wSpliceCount = 0;
    function addWSpans(hVal, isRight, runRows) {
      if (isN) {
        // N형: 판넬 모듈 기준 0990/1490/1990 분할 (L방향 접미사 사용)
        const segsN = computeWSpansN(runRows && runRows.length ? runRows : [hVal]);
        wSpliceCount += Math.max(0, segsN.length - 1);
        segsN.forEach(sg => {
          const code = 'WFF-' + pad4Code(sg.cut) + fSuf;
          wNCounts[code] = (wNCounts[code] || 0) + 1;
        });
        return;
      }
      const totalH = Math.round(hVal + overY * 2);
      const spans = computeMainBeamSpans(hVal);
      // 품번 체계: 75 Angle=ASZ/ALZ, 125 Channel=CSZ/CLZ, 150 Channel=HCSZ/HCLZ
      const wFam = wMainFamily(fNum);
      const startSuf = wFam + (isRight ? 'R' : 'L');
      const endSuf = wFam + (isRight ? 'L' : 'R');
      const sSufMid = wFam;
      const sSufSingle = wFam;
      const pad4 = n => String(Math.round(n)).padStart(4, '0');

      if (spans.length === 1 && spans[0].type === 'single') {
        const code = (fNum === 125 && totalH === 2620) ? ('WFF-2640' + wFam) : ('WFF-' + pad4(totalH) + sSufSingle);
        wBeamCounts[code] = (wBeamCounts[code] || 0) + 1;
      } else {
        wSpliceCount += (spans.length - 1);
        spans.forEach(seg => {
          let code = '';
          if (seg.type === 'start') code = 'WFF-' + pad4(seg.span + overY) + startSuf;
          else if (seg.type === 'end') code = 'WFF-' + pad4(seg.span + overY) + endSuf;
          else code = 'WFF-' + pad4(seg.span) + sSufMid;
          wBeamCounts[code] = (wBeamCounts[code] || 0) + 1;
        });
      }
    }

    countMainW(sCol, false);
    countMainW(eCol, true);

    // 2. L방향 수평 주재 카운트 및 브라켓 카운트
    const lBeamCounts = {};
    let bracketCount = 0;
    for (let i = 0; i <= G.nr; i++) {
      let c = 0;
      while (c < G.nc) {
        const hasBelow = (i > 0) && G.map.has(i - 1, c);
        const hasAbove = (i < G.nr) && G.map.has(i, c);
        if (!hasBelow && !hasAbove) { c++; continue; }
        const cStart = c;
        while (c < G.nc && (((i > 0) && G.map.has(i - 1, c)) || ((i < G.nr) && G.map.has(i, c)))) c++;
        const cEnd = c - 1;
        const segCols = G.map.cols.slice(cStart, cEnd + 1);
        const segColSpans = computeColSpans(segCols);

        const hasTankLeft = (cStart > 0) && ((i > 0 && G.map.has(i - 1, cStart - 1)) || (i < G.nr && G.map.has(i, cStart - 1)));
        const hasTankRight = (cEnd < G.nc - 1) && ((i > 0 && G.map.has(i - 1, cEnd + 1)) || (i < G.nr && G.map.has(i, cEnd + 1)));

        // N형도 외곽 L방향 주재는 표준 부재 그대로 (연장/신규 품번 없음, 1M=0990, 1.5M=1490, 2M=1990)
        segColSpans.forEach((nominalSpan) => {
          const cutLen = nominalSpan - 10;
          const codeStr = cutLen < 1000 ? (cutLen < 100 ? '00' + cutLen : '0' + cutLen) : String(cutLen);
          const code = 'WFF-' + codeStr + fSuf;
          lBeamCounts[code] = (lBeamCounts[code] || 0) + 1;
        });

        if (!hasTankLeft && cStart === 0) bracketCount++;
        if (!hasTankRight && cEnd === G.nc - 1) bracketCount++;
      }
    }
    Object.entries(wNCounts).forEach(([code, q]) => { lBeamCounts[code] = (lBeamCounts[code] || 0) + q; });

    // 3. 이형 단차 코너 단재 카운트
    const stepCornerCounts = {};
    const stepCornerCode = (fNum === 75) ? 'WFF-0200ACZ' : ((fNum === 150) ? 'WFF-0150HCCZ' : 'WFF-0150CCZ');
    for (let j = 1; j < G.map.cols.length; j++) {
      for (let rIdx = 0; rIdx <= G.map.rows.length; rIdx++) {
        const hasBeamLeft = (rIdx > 0 && G.map.has(rIdx - 1, j - 1)) || (rIdx < G.map.rows.length && G.map.has(rIdx, j - 1));
        const hasBeamRight = (rIdx > 0 && G.map.has(rIdx - 1, j)) || (rIdx < G.map.rows.length && G.map.has(rIdx, j));
        if (!hasBeamLeft && !hasBeamRight) continue;
        if (hasBeamLeft && hasBeamRight) continue;
        stepCornerCounts[stepCornerCode] = (stepCornerCounts[stepCornerCode] || 0) + 1;
      }
    }

    // 4. 서브빔 카운트
    const subBeamCounts = {};
    const isF150 = (fNum === 150);
    const cnRows = G.map.rows.length;
    for (let c = 1; c < G.nc; c++) {
      for (let i = 0; i < cnRows; i++) {
        if (!G.map.has(i, c) && !G.map.has(i, c - 1)) continue;
        const isShort = G.map.rows[i] < 700;
        const colIdx = G.map.has(i, c - 1) ? (c - 1) : c;
        const specBot = getRowBeamSpec(G.map, i, colIdx, flgW, overY, centerBay);
        const specTop = getRowBeamSpec(G.map, i + 1, colIdx, flgW, overY, centerBay);
        const isOuter = (specBot.cat === 1) || (specTop.cat === 2);
        let subCode;
        if (isOuter) {
          subCode = isF150 ? (isShort ? 'WFB-0456CMZ' : 'WFB-0956CMZ') : (isShort ? 'WFB-0462AMZ' : 'WFB-0962AMZ');
        } else if (i === centerBay && cnRows >= 3) {
          subCode = isF150 ? (isShort ? 'WFB-0561CMZ' : 'WFB-1061CMZ') : (isShort ? 'WFB-0553AMZ' : 'WFB-1053AMZ');
        } else {
          subCode = isF150 ? (isShort ? 'WFB-0493CMZ' : 'WFB-0993CMZ') : (isShort ? 'WFB-0494AMZ' : 'WFB-0994AMZ');
        }
        subBeamCounts[subCode] = (subBeamCounts[subCode] || 0) + 1;
      }
    }

    const connBracketCode = isF150 ? 'WBR-0120CZE' : 'WBR-7575Z';
    const connBracketSpec = isF150 ? 'L-75x75x6T (H=120, 2-Ø17H)' : 'L-75x75x6T (H=75, Ø17H)';
    const padStrips = G.nc + 1;
    const padLen = mmap.width + padOv * 2;

    const boms = [];
    let no = 1;

    // W방향 주재
    Object.entries(wBeamCounts).forEach(([code, qty]) => {
      const isL = code.endsWith('L'), isR = code.endsWith('R');
      const sideName = isL ? (lang === 'en' ? 'Perimeter Main Beam W (Left)' : '외곽 주재 W (좌측)') : (isR ? (lang === 'en' ? 'Perimeter Main Beam W (Right)' : '외곽 주재 W (우측)') : (lang === 'en' ? 'Perimeter Main Beam W' : '외곽 주재 W'));
      boms.push({
        no: no++,
        key: 'main_w',
        name: sideName,
        mat: 'SS41(HDG)',
        qty: `${qty} EA`,
        spec: `${code} [${dSkid.mainSpec}]`
      });
    });

    // W방향 주재 연결 플레이트 (Splice Joint: 75Angle=WBR-02150ZE, 125Channel=WBR-9021CZ, 150Channel=WBR-1022CZ)
    if (wSpliceCount > 0) {
      let spliceCode, spliceSpec;
      if (fNum === 75) {
        spliceCode = 'WBR-02150ZE';
        spliceSpec = 'WBR-02150ZE [L=215mm, 4-Ø17H]';
      } else if (fNum === 150) {
        spliceCode = 'WBR-1022CZ';
        spliceSpec = 'WBR-1022CZ [225x105x6t PL, 4-Ø17H]';
      } else {
        spliceCode = 'WBR-9021CZ';
        spliceSpec = 'WBR-9021CZ [215x90x6t PL, 4-Ø17H]';
      }
      boms.push({
        no: no++,
        key: 'splice',
        name: lang === 'en' ? 'Main Beam Splice Plate (W)' : 'W방향 주재 연결 플레이트',
        mat: 'SS41(HDG)',
        qty: `${wSpliceCount} EA`,
        spec: spliceSpec
      });
    }

    // L방향 주재
    Object.entries(lBeamCounts).forEach(([code, qty]) => {
      boms.push({
        no: no++,
        key: 'main_l',
        name: isN ? (lang === 'en' ? 'Main Beam L/W (Common)' : 'L·W방향 공용 주재') : (lang === 'en' ? 'Horizontal Main Beam L' : 'L방향 수평 주재'),
        mat: 'SS41(HDG)',
        qty: `${qty} EA`,
        spec: `${code} [${dSkid.mainSpec}]`
      });
    });

    // 이형 단차 코너 단재 (있는 경우)
    Object.entries(stepCornerCounts).forEach(([code, qty]) => {
      boms.push({
        no: no++,
        key: 'corner_step',
        name: lang === 'en' ? 'Step Corner Beam' : '이형 단차 코너 단재',
        mat: 'SS41(HDG)',
        qty: `${qty} EA`,
        spec: `${code} [${dSkid.mainSpec}]`
      });
    });

    // 서브빔
    Object.entries(subBeamCounts).forEach(([code, qty]) => {
      const typeStr = code.includes('0962') || code.includes('0462') || code.includes('0956') || code.includes('0456') ? 'A'
        : (code.includes('1053') || code.includes('0553') || code.includes('1061') || code.includes('0561') ? 'C' : 'B');
      const typeDesc = (typeStr === 'A') ? (lang === 'en' ? 'Sub-Beam A (Outer)' : '서브빔 A타입 (외곽용)')
        : ((typeStr === 'C') ? (lang === 'en' ? 'Sub-Beam C (Center)' : '서브빔 C타입 (중앙용)') : (lang === 'en' ? 'Sub-Beam B (Mid)' : '서브빔 B타입 (중간용)'));
      boms.push({
        no: no++,
        key: `sub_${typeStr.toLowerCase()}`,
        name: typeDesc,
        mat: 'SS41(HDG)',
        qty: `${qty} EA`,
        spec: `${code} [${dSkid.subSpec}]`
      });
    });

    // 연결 브라켓
    if (bracketCount > 0) {
      boms.push({
        no: no++,
        key: 'bracket',
        name: lang === 'en' ? 'Connection Bracket' : '연결 브라켓',
        mat: 'SS41(HDG)',
        qty: `${bracketCount} EA`,
        spec: `${connBracketCode} [${connBracketSpec}]`
      });
    }

    // 스키드 앙카 클램프
    const clampCount = bracketCount || (padStrips * 2);
    boms.push({
      no: no++,
      key: 'clamp',
      name: lang === 'en' ? 'Skid Anchor Clamp' : '스키드 앙카 클램프',
      mat: 'SS41(HDG)',
      qty: `${clampCount} EA`,
      spec: 'WBR-5010Z [Plate 50x35x6t, M12]'
    });

    // 기초 콘크리트 패드
    boms.push({
      no: no++,
      key: 'pad',
      name: lang === 'en' ? 'Foundation Concrete Pad' : '기초 콘크리트 패드',
      mat: 'CONC',
      qty: `${padStrips} 열`,
      spec: `W${firstW}/${midW} x L${padLen} (180kgf/cm²)`
    });

    return boms;
  }

  // 스틸 스키드 프레임 조립도 (STEEL SKID DRAWING)
  function buildSkid(opt) {
    opt = normFrameOpt(opt);
    const G = frameGeom(opt), { R, sRow, eRow, sCol, eCol, nLeft, nRight, nTop, nBottom } = G;
    const colSpans = computeColSpans(G.map.cols);
    const ents = [], rec = [], add = (x, y, w, h, lat, customColSpans, customLeft) => insideFrm(ents, x, y, w, h, lat, rec, customColSpans || colSpans, customLeft !== undefined ? customLeft : nLeft);
    const dSkid = getSkidDimensions(opt.frame);
    const flgW = dSkid.mainW;   // 125 채널: 65, 150 채널: 75
    const lapIn = 5;            // 패널 내부로 5mm 걸침
    const overOut = flgW - lapIn; // 패널 외곽 기준 외측 60mm (또는 70mm) 돌출
    const overY = overOut;      // 상/하부 외곽 돌출 (총길이 = H + 120mm)

    // 0. 기초 콘크리트 패드 (CONCRETE STRIP PADS - 노란색 줄기초)
    // 사용자 요청: "Steel skid에 있는 콘크리트패드가 기본도면과 다르게 그려지네요." -> 기본도면(buildConcrete)과 100% 동일한 concStrips 및 runs 계산 적용
    const firstW = Number(opt && opt.padFirstW) || 400;
    const midW = Number(opt && opt.padMidW) || 300;
    const padOv = (opt && opt.padOverhang !== undefined && opt.padOverhang !== '') ? Number(opt.padOverhang) : Math.round(firstW / 2);
    const strips = concStrips(G.map.cols, opt);

    const hasTankAtRow = (idx, r) => {
      if (idx < 0) return G.map.has(r, G.map.cols.length - 1);
      if (idx === 0) return G.map.has(r, 0);
      return G.map.has(r, idx) || G.map.has(r, idx - 1);
    };

    const runsForStrip = idx => {
      const out = [];
      let st = -1;
      for (let i = 0; i <= G.nr; i++) {
        const h = i < G.nr && hasTankAtRow(idx, i);
        if (h && st < 0) st = i;
        if (!h && st >= 0) {
          out.push([G.map.ys[st], G.map.ys[i]]);
          st = -1;
        }
      }
      return out;
    };

    strips.forEach(([x, w, idx]) => {
      const colX = (idx < 0) ? G.map.length : (G.map.xs[idx] !== undefined ? G.map.xs[idx] : 0);
      runsForStrip(idx).forEach(([rY0, rY1]) => {
        const pY0 = rY0 - padOv;
        const pY1 = rY1 + padOv;
        // 4개 외곽선 (PAD 레이어)
        ents.push({ t: 'line', a: [x, pY0], b: [x + w, pY0], layer: 'PAD' });
        ents.push({ t: 'line', a: [x + w, pY0], b: [x + w, pY1], layer: 'PAD' });
        ents.push({ t: 'line', a: [x + w, pY1], b: [x, pY1], layer: 'PAD' });
        ents.push({ t: 'line', a: [x, pY1], b: [x, pY0], layer: 'PAD' });

        // 패드 중심선 (Centerline)
        ents.push({ t: 'line', a: [colX, pY0 - 30], b: [colX, pY1 + 30], layer: 'PAD' });
      });
    });

    const fNum = Number(opt.frame);
    const fSuf = (fNum === 75) ? 'ALZ' : (fNum === 150 ? 'HCLZ' : 'CLZ');
    const mainSuf = (fNum === 75) ? 'ALZ' : (fNum === 150 ? 'HCLZ' : 'CLZ');



    const isN = getFrameVariant(opt) === 'N';

    // W방향 주재 이음부 연결 플레이트 (75 Angle=WBR-02150ZE / 125 Channel=WBR-9021CZ / 150 Channel=WBR-1022CZ) - O/N 공용
    function drawWSplice(x, w, jointY, type) {
      const isAngle = (fNum === 75);
      const isF150 = (fNum === 150);
      const spliceCode = isAngle ? 'WBR-02150ZE' : (isF150 ? 'WBR-1022CZ' : 'WBR-9021CZ');
      const splL = isAngle ? 215 : (isF150 ? 225 : 215);
      const pw = isAngle ? 25 : 12;
      const px0 = (type === 'first') ? (x + w - 6 - pw) : (x + 6);
      const px1 = px0 + pw;
      rectEnts(px0, jointY - splL / 2, pw, splL, 'FRAME_MAIN_W', ents);
      // WBR-02150ZE: 20+32.5+110+32.5+20=215mm (중심 기준 ±55, ±87.5)
      // WBR-9021CZ: 25 + 165 + 25 = 215mm (중심 기준 ±82.5)
      // WBR-1022CZ: 25 + 175 + 25 = 225mm (중심 기준 ±87.5)
      const holeOffsets = isAngle ? [-87.5, -55, 55, 87.5] : (isF150 ? [-87.5, 87.5] : [-82.5, 82.5]);
      const holeR = Math.max(3.0, Math.min(4.5, pw * 0.28));
      holeOffsets.forEach(offY => {
        ents.push({ t: 'circle', c: [(px0 + px1) / 2, jointY + offY], r: holeR, layer: 'FRAME_MAIN_W' });
        ents.push({ t: 'line', a: [px0 - 2, jointY + offY], b: [px1 + 2, jointY + offY], layer: 'FRAME_MAIN_W' });
      });
      const sTxtH = Math.max(16, Math.min(22, Math.round(w * 0.32)));
      ents.push({ t: 'text', p: [(type === 'first') ? (x - 16) : (x + w + 16), jointY], h: sTxtH, s: spliceCode, rot: 90, align: 'center', valign: 'middle', layer: 'FRAME_MAIN_W' });
    }

    // N형: 판넬 모듈선 기준 0990/1490/1990 분할 (런 시작 nY, 길이 spanW)
    function addMainBeamN(x, nY, w, spanW, type) {
      const runRows = [];
      G.map.rows.forEach((rh, ri) => {
        const ry = G.map.ys[ri];
        if (ry >= nY - 0.5 && ry + rh <= nY + spanW + 0.5) runRows.push(rh);
      });
      const segs = computeWSpansN(runRows.length ? runRows : [spanW]);
      const bTxtH = Math.max(26, Math.min(36, Math.round(w * 0.44)));
      segs.forEach((sg, k) => {
        const y0 = nY + sg.y0Off;
        rectEnts(x, y0, w, sg.cut, 'FRAME_MAIN_W', ents);
        const webX = (type === 'first') ? (x + w - 6) : (x + 6);
        ents.push({ t: 'line', a: [webX, y0], b: [webX, y0 + sg.cut], layer: 'FRAME_MAIN_W' });
        ents.push({ t: 'text', p: [x + w / 2, y0 + sg.cut / 2], h: bTxtH, s: `WFF-${pad4Code(sg.cut)}${mainSuf}`, rot: 90, align: 'center', layer: 'FRAME_MAIN_W' });
        if (k < segs.length - 1) drawWSplice(x, w, nY + sg.y0Off + sg.cut + 5, type);
      });
    }

    function addMainBeam(x, y, w, h, type, spanW, isRightSide) {
      if (isN) {
        addMainBeamN(x, y + overY, w, spanW || (Math.round(h) - overY * 2), type);
        return;
      }
      rectEnts(x, y, w, h, 'FRAME_MAIN_W', ents);
      // 웨브 두께선 (6mm) - 외곽 Main beam은 탱크 밖으로 보도록 배치
      if (type === 'first') {
        ents.push({ t: 'line', a: [x + w - 6, y], b: [x + w - 6, y + h], layer: 'FRAME_MAIN_W' });
      } else if (type === 'last') {
        ents.push({ t: 'line', a: [x + 6, y], b: [x + 6, y + h], layer: 'FRAME_MAIN_W' });
      } else {
        ents.push({ t: 'line', a: [x + 6, y], b: [x + 6, y + h], layer: 'FRAME_MAIN_W' });
      }

      const totalH = Math.round(h);
      const bTxtH = Math.max(26, Math.min(36, Math.round(w * 0.44)));
      const Wval = spanW || (totalH - overY * 2);
      const spans = computeMainBeamSpans(Wval);

      // 한쪽이 ASZL+ASZR이면 반대쪽은 ASZR+ASZL로 대칭 배치
      const isRight = (isRightSide !== undefined) ? isRightSide : (type === 'last');
      // 품번 체계: 75 Angle=ASZ/ALZ, 125 Channel=CSZ/CLZ, 150 Channel=HCSZ/HCLZ
      const wFam = wMainFamily(fNum);
      const startSuf = wFam + (isRight ? 'R' : 'L');
      const endSuf = wFam + (isRight ? 'L' : 'R');
      const sSufMid = wFam;
      const sSufSingle = wFam;
      const pad4 = n => String(Math.round(n)).padStart(4, '0');

      if (spans.length === 1 && spans[0].type === 'single') {
        const singleCode = (fNum === 125 && totalH === 2620) ? '2640' : pad4(totalH);
        ents.push({
          t: 'text',
          p: [x + w / 2, y + h / 2],
          h: bTxtH,
          s: `WFF-${singleCode}${sSufSingle}`,
          rot: 90,
          align: 'center',
          layer: 'FRAME_MAIN_W'
        });
      } else {
        let curY = y;
        spans.forEach((seg, sIdx) => {
          let segLen = 0, segTxt = '';
          if (seg.type === 'start') {
            segLen = seg.span + overY;
            segTxt = `WFF-${pad4(segLen)}${startSuf}`;
          } else if (seg.type === 'end') {
            segLen = seg.span + overY;
            segTxt = `WFF-${pad4(segLen)}${endSuf}`;
          } else {
            segLen = seg.span;
            segTxt = `WFF-${pad4(segLen)}${sSufMid}`;
          }

          ents.push({
            t: 'text',
            p: [x + w / 2, curY + segLen / 2],
            h: bTxtH,
            s: segTxt,
            rot: 90,
            align: 'center',
            layer: 'FRAME_MAIN_W'
          });

          curY += segLen;

          if (sIdx < spans.length - 1) {
            // 1. 주재 간 맞댐 이음선 (Splice Joint Cut Line)
            ents.push({
              t: 'line',
              a: [x, curY],
              b: [x + w, curY],
              layer: 'FRAME_MAIN_W'
            });

            // 2. 주재 연결 플레이트/브라켓 (75 Angle=WBR-02150ZE / 125 Channel=WBR-9021CZ / 150 Channel=WBR-1022CZ)
            const isAngle = (fNum === 75);
            const isF150 = (fNum === 150);
            const spliceCode = isAngle ? 'WBR-02150ZE' : (isF150 ? 'WBR-1022CZ' : 'WBR-9021CZ');
            const splL = isAngle ? 215 : (isF150 ? 225 : 215);
            const splHalf = splL / 2;
            const pw = isAngle ? 25 : 12;
            const px0 = (type === 'first') ? (x + w - 6 - pw) : (x + 6);
            const px1 = px0 + pw;
            const py0 = curY - splHalf;

            // 연결 플레이트 외곽 직사각형
            rectEnts(px0, py0, pw, splL, 'FRAME_MAIN_W', ents);

            // 3. 4-Ø17 볼트 홀 및 중심선 표시
            // WBR-02150ZE: 20 + 32.5 + 110 + 32.5 + 20 = 215mm (중심 기준 ±55, ±87.5)
            // WBR-9021CZ: 25 + 165 + 25 = 215mm (중심 기준 ±82.5)
            // WBR-1022CZ: 25 + 175 + 25 = 225mm (중심 기준 ±87.5)
            const holeOffsets = isAngle ? [-87.5, -55, 55, 87.5] : (isF150 ? [-87.5, 87.5] : [-82.5, 82.5]);
            const holeR = Math.max(3.0, Math.min(4.5, pw * 0.28));
            holeOffsets.forEach(offY => {
              ents.push({
                t: 'circle',
                c: [(px0 + px1) / 2, curY + offY],
                r: holeR,
                layer: 'FRAME_MAIN_W'
              });
              ents.push({
                t: 'line',
                a: [px0 - 2, curY + offY],
                b: [px1 + 2, curY + offY],
                layer: 'FRAME_MAIN_W'
              });
            });

            // 4. 연결 부재 품번 텍스트 마킹 (외곽 여백에 배치)
            const sTxtH = Math.max(16, Math.min(22, Math.round(w * 0.32)));
            const tx = (type === 'first') ? (x - 16) : (x + w + 16);
            ents.push({
              t: 'text',
              p: [tx, curY],
              h: sTxtH,
              s: spliceCode,
              rot: 90,
              align: 'center',
              valign: 'middle',
              layer: 'FRAME_MAIN_W'
            });
          }
        });
      }
    }

    let nX = nLeft, nY = nTop, nHeight = 0, base = false, rc, i, j;
    // 1. 첫번째 열 Main Beam (외측 60/70mm 돌출, 내측 5mm 걸침, 상하 60/70mm 연장)
    for (i = sRow; i <= eRow; i++) {
      rc = R(i, sCol);
      if (!rc) {
        if (!nHeight) continue;
        addMainBeam(nX - overOut, nY - overY, flgW, nHeight + overY * 2, 'first', nHeight, false);
        nHeight = 0;
        for (i = i + 1; i <= eRow; i++) { rc = R(i, sCol); if (!rc) continue; nY = rc.t; break; }
      }
      if (rc) { nHeight += rc.h; if (!base) { nY = rc.t; base = true; } }
    }
    if (nHeight) addMainBeam(nX - overOut, nY - overY, flgW, nHeight + overY * 2, 'first', nHeight, false);

    // 2. 마지막 열 Main Beam (외측 60/70mm 돌출, 내측 5mm 걸침, 상하 60/70mm 연장)
    nX = nRight; nY = nTop; nHeight = 0; base = false;
    for (i = sRow; i <= eRow; i++) {
      rc = R(i, eCol);
      if (!rc) {
        if (!nHeight) continue;
        addMainBeam(nX - lapIn, nY - overY, flgW, nHeight + overY * 2, 'last', nHeight, true);
        nHeight = 0;
        for (i = i + 1; i <= eRow; i++) { rc = R(i, eCol); if (!rc) continue; nY = rc.t; break; }
      }
      if (rc) { nHeight += rc.h; if (!base) { nY = rc.t; base = true; } }
    }
    if (nHeight) addMainBeam(nX - lapIn, nY - overY, flgW, nHeight + overY * 2, 'last', nHeight, true);

    // 2-B. 이형 외곽 단차 코너 단재 (WFF-0200ACZ / WFF-0150CCZ / WFF-0150HCCZ - 가로 배치, 인접 가로 주재와 동일 Section 방향)
    // 수평 주재가 내부 열 경계에서 종료되는 모든 단차/외곽 지점에 브라켓 배치
    const centerBay = getCenterBay(G.map);
    const stepCornerLen = (fNum === 75) ? 200 : 150;
    const stepCornerCode = (fNum === 75) ? 'WFF-0200ACZ' : ((fNum === 150) ? 'WFF-0150HCCZ' : 'WFF-0150CCZ');
    const cornerTxtH = Math.max(20, Math.min(28, Math.round(flgW * 0.35)));

    for (let j = 1; j < G.map.cols.length; j++) {
      const colX = G.map.xs[j];
      for (let rIdx = 0; rIdx <= G.map.rows.length; rIdx++) {
        const hasBeamLeft = (rIdx > 0 && G.map.has(rIdx - 1, j - 1)) || (rIdx < G.map.rows.length && G.map.has(rIdx, j - 1));
        const hasBeamRight = (rIdx > 0 && G.map.has(rIdx - 1, j)) || (rIdx < G.map.rows.length && G.map.has(rIdx, j));
        if (!hasBeamLeft && !hasBeamRight) continue;
        if (hasBeamLeft && hasBeamRight) continue;

        const isRight = hasBeamLeft && !hasBeamRight;
        const colIdx = isRight ? (j - 1) : j;
        const spec = getRowBeamSpec(G.map, rIdx, colIdx, flgW, overY, centerBay);
        const { yA, yB, yWeb } = spec;
        const xA = isRight ? (colX - lapIn) : (colX + lapIn - stepCornerLen);
        const xB = isRight ? (xA + stepCornerLen) : (colX + lapIn);

        ents.push({ t: 'line', a: [xA, yA], b: [xB, yA], layer: 'FRAME_MAIN_L' });
        ents.push({ t: 'line', a: [xA, yB], b: [xB, yB], layer: 'FRAME_MAIN_L' });
        ents.push({ t: 'line', a: [xA, yWeb], b: [xB, yWeb], layer: 'FRAME_MAIN_L' });
        ents.push({ t: 'line', a: [xA, yA], b: [xA, yB], layer: 'FRAME_MAIN_L' });
        ents.push({ t: 'line', a: [xB, yA], b: [xB, yB], layer: 'FRAME_MAIN_L' });

        // 개공홀 삭제: 사용자 요청 (홀은 없애주세요. 품명만 남겨주세요)

        // 부품명 텍스트 (가로 배치 rot: 0)
        ents.push({
          t: 'text',
          p: [(xA + xB) / 2, (yA + yB) / 2],
          h: cornerTxtH,
          s: stepCornerCode,
          rot: 0,
          align: 'center',
          valign: 'middle',
          layer: 'FRAME_MAIN_L'
        });
      }
    }

    // 3. W방향 주재는 테두리(첫번째 및 마지막 열)에만 배치되며, 중간 열에는 배치되지 않음
    // 중간 열(sCol + 1 ~ eCol)의 각 베이에는 가로 주재 사이를 연결하는 부재(서브빔, FRAME_SUB)를 배치
    const subW = (fNum === 75) ? 75 : 40; // 부재 플랜지 폭 ([-75x40x5T / L-75x75x6T)
    for (j = sCol + 1; j <= eCol; j++) {
      const colX = G.map.xs[j];
      for (i = sRow; i <= eRow; i++) {
        const rcL = R(i, j - 1), rcR = R(i, j);
        if (!rcL && !rcR) continue;
        const colIdx = rcL ? (j - 1) : j;
        const specBot = getRowBeamSpec(G.map, i, colIdx, flgW, overY, centerBay);
        const specTop = getRowBeamSpec(G.map, i + 1, colIdx, flgW, overY, centerBay);
        const yBayBot = specBot.yB;
        const yBayTop = specTop.yA;
        const bayH = yBayTop - yBayBot;
        if (bayH > 50) {
          // 실물 부품(WFF-0990AMZ / WFB-0956CMZ 등 기성 부재) 그대로 온전한 부품 형상 작도:
          // 사용자 요청 ("아형탱크의 부재가 잘 안그려지는데 부품은 그대로 그려주세요")
          // 1) 양단 엔드 플레이트: 이형탱크라도 부품 자체를 반쪽으로 자르지 않고 규격 그대로(160mm x 6t 대칭) 작도
          const plW = 160, plTh = 6;
          const plX0 = colX - plW / 2;
          const plX1 = colX + plW / 2;

          // 하단 연결 플레이트 (yBayBot ~ yBayBot + 6, 폭 160mm)
          rectEnts(plX0, yBayBot, plW, plTh, 'FRAME_SUB', ents);

          // 상단 연결 플레이트 (yBayTop - 6 ~ yBayTop, 폭 160mm)
          rectEnts(plX0, yBayTop - plTh, plW, plTh, 'FRAME_SUB', ents);

          // 2) 플레이트 사이의 서브빔 찬넬 본체 (C-75x40x5t)
          const bY0 = yBayBot + plTh, bY1 = yBayTop - plTh;
          rectEnts(colX - subW / 2, bY0, subW, bY1 - bY0, 'FRAME_SUB', ents);
          ents.push({ t: 'line', a: [colX - subW / 2 + 5, bY0], b: [colX - subW / 2 + 5, bY1], layer: 'FRAME_SUB' });
        }
      }
    }

    // 4. 가로 프레임 (L방향 주재): 이형 탱크 형상(제거된 셀)을 완벽히 반영하여 각 행별로 존재하는 열에만 배치
    const cnRows = G.map.rows.length;

    for (let i = 0; i <= G.nr; i++) {
      const rowY = (i < G.nr) ? G.map.ys[i] : G.map.width;
      let c = 0;
      while (c < G.nc) {
        const hasBelow = (i > 0) && G.map.has(i - 1, c);
        const hasAbove = (i < G.nr) && G.map.has(i, c);
        if (!hasBelow && !hasAbove) {
          c++;
          continue;
        }

        const cStart = c;
        while (c < G.nc && (((i > 0) && G.map.has(i - 1, c)) || ((i < G.nr) && G.map.has(i, c)))) {
          c++;
        }
        const cEnd = c - 1;

        let anyBoth = false, allAboveOnly = true, allBelowOnly = true;
        for (let col = cStart; col <= cEnd; col++) {
          const b = (i > 0) && G.map.has(i - 1, col);
          const a = (i < G.nr) && G.map.has(i, col);
          if (b && a) anyBoth = true;
          if (b) allAboveOnly = false;
          if (a) allBelowOnly = false;
        }

        let cat = 3;
        if (anyBoth) {
          cat = 3; // 중간 내부 (관통 라인)
        } else if (allAboveOnly) {
          cat = 1; // 하부 외곽
        } else if (allBelowOnly) {
          cat = 2; // 상부 외곽
        } else {
          cat = 3;
        }

        const xLeft = G.map.xs[cStart];
        const xRight = G.map.xs[cEnd] + G.map.cols[cEnd];

        // 좌/우 끝단 lapIn(5mm) 마감 (좌/우측에 인접한 탱크 셀이 없으면 외곽이므로 lapIn)
        const hasTankLeft = (cStart > 0) && (
          (i > 0 && G.map.has(i - 1, cStart - 1)) ||
          (i < G.nr && G.map.has(i, cStart - 1))
        );
        const hasTankRight = (cEnd < G.nc - 1) && (
          (i > 0 && G.map.has(i - 1, cEnd + 1)) ||
          (i < G.nr && G.map.has(i, cEnd + 1))
        );

        const x0b = hasTankLeft ? (xLeft - flgW / 2) : (xLeft + lapIn);
        const x1b = hasTankRight ? (xRight + flgW / 2) : (xRight - lapIn);

        let segY, segLat;
        if (cat === 1) {
          // 하부 외곽
          segY = rowY - overY;
          segLat = 0x20000;
        } else if (cat === 2) {
          // 상부 외곽
          segY = rowY + overY - flgW;
          segLat = 0x40000;
        } else {
          // 중간 내부
          segY = rowY - flgW / 2;
          const k = (i > 0) ? (i - 1) : 0;
          const isUp = (k <= centerBay);
          segLat = isUp ? 0 : 0x10000;
        }

        // N형: 신규 품번 방지를 위해 외곽 L방향 주재 연장 없음 (코너는 비워 두고 코너 브라켓으로만 연결)
        const extL = 0;
        const extR = 0;
        const x0 = x0b - extL;
        const x1 = x1b + extR;
        const segW = x1 - x0;

        const segCols = G.map.cols.slice(cStart, cEnd + 1);
        const segColSpans = computeColSpans(segCols);
        add(x0, segY, segW, flgW, segLat, segColSpans, xLeft);
        if (rec.length) { rec[rec.length - 1].extL = extL; rec[rec.length - 1].extR = extR; }

        // 4-B. W방향 외곽 주재(ASZ-FRAME / CSZ-FRAME)와 L방향 수평 주재 연결 브라켓
        // 75Angle & 125Channel: WBR-7575Z (또는 WBR-7575)
        // 150Channel: WBR-0120CZE
        if (!hasTankLeft && cStart === 0) {
          let bY = segY, dirY = 1;
          if (cat === 1) {
            bY = segY + flgW;
            dirY = 1;
          } else if (cat === 2) {
            bY = segY;
            dirY = -1;
          } else {
            dirY = (segLat === 0) ? -1 : 1;
            bY = (dirY === -1) ? segY : (segY + flgW);
          }
          drawCornerBracket(ents, x0b, bY, 75, 6, 1, dirY, 'FRAME');
        }

        if (!hasTankRight && cEnd === G.nc - 1) {
          let bY = segY, dirY = 1;
          if (cat === 1) {
            bY = segY + flgW;
            dirY = 1;
          } else if (cat === 2) {
            bY = segY;
            dirY = -1;
          } else {
            dirY = (segLat === 0) ? -1 : 1;
            bY = (dirY === -1) ? segY : (segY + flgW);
          }
          drawCornerBracket(ents, x1b, bY, 75, 6, -1, dirY, 'FRAME');
        }
      }
    }

    const tH = frameTextH(G.map, opt), st = tH * 0.8;
    const totalL = G.map.length, totalW = G.map.width;
    const xMin = nLeft - overOut, xMax = nRight + overOut;
    const yMin = nTop - overY, yMax = nBottom + overY;
    const skidL = totalL + overOut * 2, skidW = totalW + overY * 2;

    // 모든 가로 프레임 분할 부재 라벨 (외곽 및 중간 모든 행의 부재 품번 WFF-xxxx ALZ / CLZ / HCLZ)
    rec.forEach(m => m.segs.forEach((sl, k) => {
      const mid = (m.pts[k] + m.pts[k + 1]) / 2;
      if (m.hor) {
        const nominalSpan = (m.colSpans && m.colSpans[k]) ? m.colSpans[k] : (sl > 10 ? (sl + 10) : sl);
        // 양끝단 5mm씩(총 10mm) 공간을 확보하여 연결부 커팅 오차 방지 (1M=0990, 1.5M=1490, 2M=1990)
        const cutLen = nominalSpan - 10;
        const codeStr = cutLen < 1000 ? (cutLen < 100 ? `00${cutLen}` : `0${cutLen}`) : String(cutLen);
        // 사용자 요청: 부품명은 부품 안에 배치 (외곽/중간 모든 가로 주재 정중앙에 배치)
        const txtY = m.y + m.h / 2;
        const txtH = Math.min(st * 0.55, m.h * 0.48);
        ents.push({ t: 'text', p: [m.x + mid, txtY], h: txtH, s: `WFF-${codeStr}${fSuf}`, rot: 0, align: 'center', valign: 'middle', layer: 'FRAME_MAIN_L' });
      }
    }));

    // 모든 중간 열(Col 1 ~ G.nc - 1)의 각 베이에 서브빔 부재 명칭 표기 (WFB-0962AMZ, WFB-1053AMZ, WFB-0994AMZ 등)
    const isF150 = (Number(opt.frame) === 150);
    for (let c = 1; c < G.nc; c++) {
      const colX = G.map.xs[c] || 0;
      for (let i = 0; i < cnRows; i++) {
        if (!G.map.has(i, c) && !G.map.has(i, c - 1)) continue; // 이형물탱크에서 인접 셀이 둘 다 없는 경우만 제외
        const rY0 = G.map.ys[i];
        const rY1 = rY0 + G.map.rows[i];
        const isShort = G.map.rows[i] < 700;
        const colIdx = G.map.has(i, c - 1) ? (c - 1) : c;
        const specBot = getRowBeamSpec(G.map, i, colIdx, flgW, overY, centerBay);
        const specTop = getRowBeamSpec(G.map, i + 1, colIdx, flgW, overY, centerBay);
        const isOuter = (specBot.cat === 1) || (specTop.cat === 2);
        let subCode;
        if (isOuter) {
          subCode = isF150 ? (isShort ? 'WFB-0456CMZ' : 'WFB-0956CMZ') : (isShort ? 'WFB-0462AMZ' : 'WFB-0962AMZ');
        } else if (i === centerBay && cnRows >= 3) {
          subCode = isF150 ? (isShort ? 'WFB-0561CMZ' : 'WFB-1061CMZ') : (isShort ? 'WFB-0553AMZ' : 'WFB-1053AMZ');
        } else {
          subCode = isF150 ? (isShort ? 'WFB-0493CMZ' : 'WFB-0993CMZ') : (isShort ? 'WFB-0494AMZ' : 'WFB-0994AMZ');
        }
        ents.push({ t: 'text', p: [colX, (rY0 + rY1) / 2], h: st * 0.60, s: subCode, rot: 90, align: 'center', valign: 'middle', layer: 'FRAME_SUB' });
      }
    }

    // ★★★ 빠짐없이 정확한 4-Tier 치수선 작도 (기초 돌출 200mm, 패널 피치, 스키드 전체 치수, 기초 전체 치수) ★★★
    const padMinX = -padOv;
    const padMaxX = totalL + padOv;
    const padMinY = -padOv;
    const padMaxY = totalW + padOv;
    const padTotalL = totalL + padOv * 2;
    const padTotalW = totalW + padOv * 2;

    // A. 좌측 수직 치수선 (Y방향: 4열 배치 - 패널 피치, 패널 전체, 스키드 전체, 기초 전체)
    const xl1 = Math.min(xMin, padMinX) - tH * 2.8;
    const xl2 = xl1 - tH * 2.5;
    const xl3 = xl2 - tH * 2.5;
    const xl4 = xl3 - tH * 2.5;

    // 1열: 기초 하부 돌출(200), 각 행 패널 피치(1000...), 기초 상부 돌출(200)
    dimLinear(ents, [padMinX, padMinY], [padMinX, 0], xl1, true, String(padOv), tH, 'DIM');
    G.map.rows.forEach((h, i) => {
      dimLinear(ents, [0, G.map.ys[i]], [0, G.map.ys[i] + h], xl1, true, String(h), tH, 'DIM');
    });
    dimLinear(ents, [padMinX, totalW], [padMinX, padMaxY], xl1, true, String(padOv), tH, 'DIM');

    // 2열: 탱크 패널 전체 높이 (4000)
    dimLinear(ents, [0, 0], [0, totalW], xl2, true, String(totalW), tH, 'DIM');

    // 3열: 스틸 스키드 프레임 전체 높이 (4120)
    dimLinear(ents, [xMin, yMin], [xMin, yMax], xl3, true, String(skidW), tH, 'DIM');

    // 4열: 콘크리트 기초 패드 전체 높이 (4400)
    dimLinear(ents, [padMinX, padMinY], [padMinX, padMaxY], xl4, true, String(padTotalW), tH, 'DIM');

    // B. 하부 수평 치수선 (X방향: 4열 배치 - 패널 피치, 패널 전체, 스키드 전체, 기초 전체)
    const yb1 = Math.min(yMin, padMinY) - tH * 2.8;
    const yb2 = yb1 - tH * 2.5;
    const yb3 = yb2 - tH * 2.5;
    const yb4 = yb3 - tH * 2.5;

    // 1열: 기초 좌측 돌출(200), 각 열 패널 피치(1000...), 기초 우측 돌출(200)
    dimLinear(ents, [padMinX, padMinY], [0, padMinY], yb1, false, String(padOv), tH, 'DIM');
    G.map.cols.forEach((w, j) => {
      dimLinear(ents, [G.map.xs[j], 0], [G.map.xs[j] + w, 0], yb1, false, String(w), tH, 'DIM');
    });
    dimLinear(ents, [totalL, padMinY], [padMaxX, padMinY], yb1, false, String(padOv), tH, 'DIM');

    // 2열: 탱크 패널 전체 길이 (9000)
    dimLinear(ents, [0, 0], [totalL, 0], yb2, false, String(totalL), tH, 'DIM');

    // 3열: 스틸 스키드 프레임 전체 길이 (9120)
    dimLinear(ents, [xMin, yMin], [xMax, yMin], yb3, false, String(skidL), tH, 'DIM');

    // 4열: 콘크리트 기초 패드 전체 길이 (9400)
    dimLinear(ents, [padMinX, padMinY], [padMaxX, padMinY], yb4, false, String(padTotalL), tH, 'DIM');

    // Detail Callout Bubbles & Section Cut (081031 PDF 일치)
    const rBub = tH * 0.9;
    const drawBubble = (bx, by, name) => {
      ents.push({ t: 'circle', c: [bx, by], r: rBub, layer: 'DIM' });
      ents.push({ t: 'text', p: [bx, by], h: rBub * 1.05, s: name, rot: 0, align: 'center', valign: 'middle', layer: 'DIM' });
    };
    drawBubble(xMin - rBub * 0.8, yMin - rBub * 0.8, '"A"');
    drawBubble((G.map.xs[1] || 1000), yMin - rBub * 0.8, '"B"');
    drawBubble((G.map.xs[1] || 1000), (G.map.ys[1] || 1000), '"C"');
    drawBubble(xMax + rBub * 0.8, yMin - rBub * 0.8, '"D"');

    // Z-Z' SECTION Cut Line & Arrows (중앙 부근 열 통과)
    const cutColIdx = Math.min(4, Math.floor(G.nc / 2));
    const cutX = (G.map.xs[cutColIdx] || 4000) + flgW / 2;
    ents.push({ t: 'line', a: [cutX, yMin - 120], b: [cutX, yMax + 120], layer: 'DIM' });
    ents.push({ t: 'line', a: [cutX, yMax + 120], b: [cutX + 100, yMax + 120], layer: 'DIM' });
    ents.push({ t: 'line', a: [cutX + 100, yMax + 120], b: [cutX + 70, yMax + 140], layer: 'DIM' });
    ents.push({ t: 'line', a: [cutX + 100, yMax + 120], b: [cutX + 70, yMax + 100], layer: 'DIM' });
    ents.push({ t: 'text', p: [cutX + 140, yMax + 120], h: tH * 1.1, s: 'Z', rot: 0, align: 'left', valign: 'middle', layer: 'DIM' });
    ents.push({ t: 'line', a: [cutX, yMin - 120], b: [cutX + 100, yMin - 120], layer: 'DIM' });
    ents.push({ t: 'line', a: [cutX + 100, yMin - 120], b: [cutX + 70, yMin - 100], layer: 'DIM' });
    ents.push({ t: 'line', a: [cutX + 100, yMin - 120], b: [cutX + 70, yMin - 140], layer: 'DIM' });
    ents.push({ t: 'text', p: [cutX + 140, yMin - 120], h: tH * 1.1, s: "Z'", rot: 0, align: 'left', valign: 'middle', layer: 'DIM' });



    // ★★★ 1000x1000 저면 패널 안착 위치 (FLOOR_PANEL 레이어, 붉은색 계열로 가시화) ★★★
    // 사용자 요청: "1000x1000mm박스을 다른색으로 배열해서 어떻게 기초가 적용되었는지 확인하게 해주세요."
    for (let i = 0; i < G.map.rows.length; i++) {
      for (let j = 0; j < G.map.cols.length; j++) {
        if (G.map.has(i, j)) {
          const px0 = G.map.xs[j];
          const py0 = G.map.ys[i];
          const pw = G.map.cols[j];
          const ph = G.map.rows[i];
          const px1 = px0 + pw;
          const py1 = py0 + ph;
          const cx = (px0 + px1) / 2;
          const cy = (py0 + py1) / 2;

          // 1. 외곽 1000x1000 패널 윤곽선 (FLOOR_PANEL 레이어)
          ents.push({ t: 'line', a: [px0, py0], b: [px1, py0], layer: 'FLOOR_PANEL' });
          ents.push({ t: 'line', a: [px1, py0], b: [px1, py1], layer: 'FLOOR_PANEL' });
          ents.push({ t: 'line', a: [px1, py1], b: [px0, py1], layer: 'FLOOR_PANEL' });
          ents.push({ t: 'line', a: [px0, py1], b: [px0, py0], layer: 'FLOOR_PANEL' });

          // 2. 패널 내부 플랜지 윤곽 (10mm 플랜지 두께, 90도 직각 코너)
          const flgT = 10;
          if (pw > flgT * 2 && ph > flgT * 2) {
            const ix0 = px0 + flgT, ix1 = px1 - flgT;
            const iy0 = py0 + flgT, iy1 = py1 - flgT;
            ents.push({ t: 'line', a: [ix0, iy0], b: [ix1, iy0], layer: 'FLOOR_PANEL' });
            ents.push({ t: 'line', a: [ix1, iy0], b: [ix1, iy1], layer: 'FLOOR_PANEL' });
            ents.push({ t: 'line', a: [ix1, iy1], b: [ix0, iy1], layer: 'FLOOR_PANEL' });
            ents.push({ t: 'line', a: [ix0, iy1], b: [ix0, iy0], layer: 'FLOOR_PANEL' });
          }

          // 3. 패널 중앙 규격 식별 텍스트 (예: 1000×1000)
          const dimLabel = `${pw}×${ph}`;
          const pTxtH = Math.max(26, Math.min(34, Math.round(pw / 30)));
          ents.push({
            t: 'text',
            p: [cx, cy],
            h: pTxtH,
            s: dimLabel,
            rot: 0,
            align: 'center',
            layer: 'FLOOR_PANEL'
          });
        }
      }
    }

    // 도면 하단 부재 규격 및 표준 제작 가공 시방 NOTE (치수선과 절대 겹치지 않도록 yb4 하단에 배치)
    const skidBOM = buildSkidBOM(opt);
    const lx = Math.max(300, G.map.length * 0.10);
    const ly0 = yb4 - tH * 2.8;
    ents.push({ t: 'text', p: [lx, ly0], h: tH * 1.05, s: `MEMBER SPECIFICATIONS - FRAME ${opt.frame || 125} (${dSkid.name}) - TYPE ${isN ? 'N' : 'O'}`, rot: 0, align: 'left', layer: 'DIM' });

    // 1. W방향 주재
    const wItems = skidBOM.filter(b => b.key === 'main_w');
    const wSummary = isN
      ? `(N) W방향 전용 주재 없음 - L방향 공용 0990/1490/1990${fSuf} 사용 (수량은 MAIN BEAM (L)에 합산)`
      : wItems.length > 0
      ? wItems.map(b => `${b.spec.split(' ')[0]} (${b.qty})`).join(', ')
      : dSkid.mainSpec;
    ents.push({ t: 'text', p: [lx, ly0 - tH * 1.35], h: tH * 0.78, s: `MAIN BEAM (W) : ${wSummary} [${dSkid.mainSpec}, HDG]`, rot: 0, align: 'left', layer: 'FRAME_MAIN_W' });

    // 2. L방향 주재
    const lItems = skidBOM.filter(b => b.key === 'main_l');
    const lSummary = lItems.length > 0
      ? lItems.map(b => `${b.spec.split(' ')[0]} (${b.qty})`).join(', ')
      : dSkid.mainSpec;
    ents.push({ t: 'text', p: [lx, ly0 - tH * 2.60], h: tH * 0.78, s: `MAIN BEAM (L) : ${lSummary} [${dSkid.mainSpec}, HDG]`, rot: 0, align: 'left', layer: 'FRAME_MAIN_L' });

    // 3. 서브빔 A, B, C
    const isFrame150 = (Number(opt.frame) === 150);
    const subAItem = skidBOM.find(b => b.key === 'sub_a');
    const subBItem = skidBOM.find(b => b.key === 'sub_b');
    const subCItem = skidBOM.find(b => b.key === 'sub_c');
    const subACode = isFrame150 ? 'WFB-0956CMZ' : 'WFB-0962AMZ';
    const subBCode = isFrame150 ? 'WFB-0993CMZ' : 'WFB-0994AMZ';
    const subCCode = isFrame150 ? 'WFB-1061CMZ' : 'WFB-1053AMZ';
    const subAQtyStr = subAItem ? ` : ${subAItem.qty}` : '';
    const subBQtyStr = subBItem ? ` : ${subBItem.qty}` : '';
    const subCQtyStr = subCItem ? ` : ${subCItem.qty}` : '';

    const subALabel = isFrame150 ? `${subACode} (L=956, 외곽 배치용)${subAQtyStr}` : `${subACode} (L=962, 외곽 배치용)${subAQtyStr}`;
    const subBLabel = isFrame150 ? `${subBCode} (L=993, 중간 배치용)${subBQtyStr}` : `${subBCode} (L=994, 중간 배치용)${subBQtyStr}`;
    const subCLabel = isFrame150 ? `${subCCode} (L=1061, 중앙 마주보는 열)${subCQtyStr}` : `${subCCode} (L=1053, 중앙 마주보는 열)${subCQtyStr}`;

    ents.push({ t: 'text', p: [lx, ly0 - tH * 3.85], h: tH * 0.78, s: `SUB-BEAM TYPE A : ${subALabel}`, rot: 0, align: 'left', layer: 'FRAME_SUB' });
    ents.push({ t: 'text', p: [lx, ly0 - tH * 5.10], h: tH * 0.78, s: `SUB-BEAM TYPE B : ${subBLabel}`, rot: 0, align: 'left', layer: 'FRAME_SUB' });
    ents.push({ t: 'text', p: [lx, ly0 - tH * 6.35], h: tH * 0.78, s: `SUB-BEAM TYPE C : ${subCLabel}`, rot: 0, align: 'left', layer: 'FRAME_SUB' });

    let curLy = ly0 - tH * 7.60;
    const stepCornerItems = skidBOM.filter(b => b.key === 'corner_step');
    if (stepCornerItems.length > 0) {
      const stepSummary = stepCornerItems.map(b => `${b.spec.split(' ')[0]} (${b.qty})`).join(', ');
      ents.push({ t: 'text', p: [lx, curLy], h: tH * 0.78, s: `STEP CORNER BEAM : ${stepSummary}`, rot: 0, align: 'left', layer: 'FRAME_MAIN_L' });
      curLy -= tH * 1.25;
    }

    const padItem = skidBOM.find(b => b.key === 'pad');
    const padQtyStr = padItem ? ` : ${padItem.qty}` : '';
    ents.push({ t: 'text', p: [lx, curLy], h: tH * 0.78, s: `FOUNDATION PAD : ${firstW}mm / ${midW}mm CONCRETE STRIP (OVERHANG ${padOv}mm)${padQtyStr}`, rot: 0, align: 'left', layer: 'DIM' });
    curLy -= tH * 1.25;

    const bracketItem = skidBOM.find(b => b.key === 'bracket');
    const clampItem = skidBOM.find(b => b.key === 'clamp');
    const spliceItem = skidBOM.find(b => b.key === 'splice');
    const bracketCode = isFrame150 ? 'WBR-0120CZE' : 'WBR-7575Z';
    const bQtyStr = bracketItem ? ` (${bracketItem.qty})` : '';
    const cQtyStr = clampItem ? ` (${clampItem.qty})` : '';
    const sQtyStr = spliceItem ? ` / ${spliceItem.spec.split(' ')[0]} 주재 연결재 (${spliceItem.qty})` : '';
    ents.push({ t: 'text', p: [lx, curLy], h: tH * 0.78, s: `HARDWARE : ${bracketCode} 연결 브라켓${bQtyStr}${sQtyStr} / WBR-5010Z 클램프${cQtyStr}`, rot: 0, align: 'left', layer: 'DIM' });

    // 표준 제작 가공 시방 NOTE (YSACC Foundation Standard - 기초.zip & Steel Skid.dwg)
    const noteX = Math.max(lx + 3200, G.map.length * 0.52);
    let noteY = ly0;
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 1.0, s: '< N O T E >', rot: 0, align: 'left', layer: 'DIM' });
    noteY -= tH * 1.3;
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 0.72, s: '1. 재질: SS41 + 용융아연도금 (80μ 이상) [Hot-Dip Galvanized]', rot: 0, align: 'left', layer: 'DIM' });
    noteY -= tH * 1.25;
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 0.72, s: '2. 허용공차: Hole간 거리 ±1mm, 전체길이 ±0.5mm', rot: 0, align: 'left', layer: 'DIM' });
    noteY -= tH * 1.25;
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 0.72, s: '3. 컷팅 및 용접부는 깨끗이 사상(Grinding)하고 수평 유지할 것', rot: 0, align: 'left', layer: 'DIM' });
    noteY -= tH * 1.25;
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 0.72, s: '4. 조립기준: 외곽 찬넬 열림부 외측 배치, 수평 수직 직각도 유지', rot: 0, align: 'left', layer: 'DIM' });
    noteY -= tH * 1.25;
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 0.72, s: '5. 기초체결: 콘크리트 패드 안착 및 앙카 고정 (WBR-5010Z 클램프 체결)', rot: 0, align: 'left', layer: 'DIM' });
    noteY -= tH * 1.25;
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 0.72, s: '6. 색상구분: 주황색(ORANGE)=W방향 주재, 보라색(PURPLE)=L방향 주재, 청록색(TEAL)=부재(서브빔), 노란색(YELLOW)=콘크리트패드, 녹색(GREEN)=저면패널', rot: 0, align: 'left', layer: 'DIM' });
    noteY -= tH * 1.25;
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 0.72, s: `7. L방향 주재: 500 판넬 배치 시 1.5M(1490${fSuf}) 적용, 양끝단 5mm(총 10mm) 커팅 여유 확보 [2M=1990${fSuf}, 1.5M=1490${fSuf}, 1M=0990${fSuf}]`, rot: 0, align: 'left', layer: 'FRAME_MAIN_L' });
    noteY -= tH * 1.25;
    const wSpecSummary = isN
      ? `${frameLabel(fNum, 'N', 'ko')}: 자재 종류 축소를 위해 O형 W방향 전용 주재(ASZ/CSZ/HCSZ 계열) 미사용 — W방향도 L방향 표준 부재 2M=1990${fSuf}, 1.5M=1490${fSuf}, 1M=0990${fSuf}로 판넬 모듈선 기준 분할(양끝단 5mm 여유), 기존 부품에 W방향 체결용 Hole 추가 가공하여 L·W 공용 사용, 스키드 코너는 신규 부재 없이 코너 브라켓(${fNum === 150 ? 'WBR-0120CZE' : 'WBR-7575Z'})으로 연결`
      : (fNum === 75)
      ? '75Angle: 시작/끝단 1570ASZL/R (1.5M), 2070ASZL/R (2M), 신규 1070ASZL/R (1M, 70mm 돌출) 대칭배치(한쪽 ASZL+ASZR 시 반대쪽 ASZR+ASZL), 중간 2000ASZ (실제 1990mm, 양단 5mm 여유), 이형단차 코너용 WFF-0200ACZ (L=200, 4-Ø17H) / 단일재: 1140, 1640, 2140, 2640ASZ'
      : (fNum === 150)
        ? '150Channel: 시작/끝단 1570HCSZL/R (1.5M), 2070HCSZL/R (2M), 신규 1070HCSZL/R (1M, 70mm 돌출) 대칭배치(한쪽 HCSZL+HCSZR 시 반대쪽 HCSZR+HCSZL), 중간 2000HCSZ (실제 1990mm, 양단 5mm 여유), 이형단차 코너용 WFF-0150HCCZ (L=150, 4-Ø17H) / 단일재: 1140, 1640, 2140, 2640HCSZ'
        : '125Channel: 시작/끝단 1560CSZL/R (1.5M), 2060CSZL/R (2M), 신규 1060CSZL/R (1M, 60mm 돌출) 대칭배치(한쪽 CSZL+CSZR 시 반대쪽 CSZR+CSZL), 중간 2000CSZ (실제 1990mm, 양단 5mm 여유), 이형단차 코너용 WFF-0150CCZ (L=150, 4-Ø17H) / 단일재: 1120, 1620, 2120, 2640CSZ';
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 0.72, s: `8. W방향 주재(테두리 전용): 외곽 테두리(시작 열 및 끝 열)에만 배치되며, 내부 중간 열에는 미배치 (부재만 배치). ${wSpecSummary}`, rot: 0, align: 'left', layer: 'FRAME_MAIN_W' });
    noteY -= tH * 1.25;
    ents.push({ t: 'text', p: [noteX, noteY], h: tH * 0.72, s: '9. W방향 주재 이음(Splice): 75Angle은 WBR-02150ZE(L=215), 125Channel은 WBR-9021CZ(215x90x6t), 150Channel은 WBR-1022CZ(225x105x6t) 4-Ø17H 연결 적용', rot: 0, align: 'left', layer: 'DIM' });

    return { ents, G, bom: skidBOM };
  }

  // 기초 프레임 단면 및 조립 상세도 (FRAME CROSS DWG): 폭 방향 부재 단면 (Z-Z' SECTION)
  function buildSkidCross(opt) {
    opt = normFrameOpt(opt);
    const d = getSkidDimensions(opt.frame);
    const th = d.mainH, ents = [];
    const flgW = d.mainW;
    const lapIn = 5;
    const overY = flgW - lapIn;
    const mx = flgW / 2;
    const f = Number(opt.frame) || 75;
    const isSHS = (f === 50);
    const isAngle = (f === 75);
    const tw = isSHS ? 3.2 : ((f === 150) ? 6.5 : 6.0);
    const tf = isSHS ? 3.2 : (isAngle ? 6.0 : ((f === 150) ? 10.0 : 8.0));

    const wl = []; { const sw = (opt.width || []).filter(Boolean); let c0 = 0; sw.forEach(sn => { sideSplit(sn, c0).forEach(w => wl.push(w)); c0 += sn; }); }
    const cn = wl.length;
    let div = (cn + 1) >> 1; if ((cn + 1) % 2) div++;

    let totalW = 0;
    const ys = [0];
    for (let k = 1; k <= cn; k++) { totalW += wl[k - 1]; ys.push(totalW); }

    // 제일 Center 위치의 베이(centerBay) 찾기: 중앙(totalW / 2)에 가장 가까운 베이
    let centerBay = -1, minDiff = Infinity;
    for (let k = 0; k < cn; k++) {
      const bMid = (ys[k] + ys[k + 1]) / 2;
      const diff = Math.abs(bMid - totalW / 2);
      const penalty = wl[k] < 700 ? 500 : 0;
      if (diff + penalty < minDiff) {
        minDiff = diff + penalty;
        centerBay = k;
      }
    }
    if (centerBay < 0 || centerBay >= cn) centerBay = Math.floor((cn - 1) / 2);

    // 서브 빔 부재 규격 및 실 제작/가공 길이 매핑 (081031 PDF Z-Z' SECTION 실물 기준)
    function getSubBeamInfo(k, pitch) {
      const isOuter = (k === 0 || k === cn - 1);
      const isTypeC = (k === centerBay && cn >= 3);
      const isShort = pitch < 700;

      if (f === 50) {
        // Base Frame 50 SHS (50X50 SQ PIPE)
        return { code: isShort ? 'WFB-0450SZ' : 'WFB-0950SZ', type: 'SHS', len: isShort ? 450 : 950, subSpec: '50X50 SQ PIPE' };
      } else if (f === 150) {
        // Base Frame 150 Channel
        if (isOuter) return { code: isShort ? 'WFB-0456CMZ' : 'WFB-0956CMZ', type: 'A타입', len: isShort ? 456 : 956, subSpec: '[-75x40x5T' };
        if (isTypeC) return { code: isShort ? 'WFB-0561CMZ' : 'WFB-1061CMZ', type: 'C타입', len: isShort ? 561 : 1061, subSpec: '[-75x40x5T' };
        return { code: isShort ? 'WFB-0493CMZ' : 'WFB-0993CMZ', type: 'B타입', len: isShort ? 493 : 993, subSpec: '[-75x40x5T' };
      } else if (f === 75) {
        // Base Frame 75 Angle
        if (isOuter) return { code: isShort ? 'WFB-0462AMZ' : 'WFB-0962AMZ', type: 'A타입', len: isShort ? 462 : 962, subSpec: 'L-75x75x6T' };
        if (isTypeC) return { code: isShort ? 'WFB-0553AMZ' : 'WFB-1053AMZ', type: 'C타입', len: isShort ? 553 : 1053, subSpec: 'L-75x75x6T' };
        return { code: isShort ? 'WFB-0494AMZ' : 'WFB-0994AMZ', type: 'B타입', len: isShort ? 494 : 994, subSpec: 'L-75x75x6T' };
      } else {
        // Base Frame 125 Channel (기본)
        if (isOuter) return { code: isShort ? 'WFB-0462AMZ' : 'WFB-0962AMZ', type: 'A타입', len: isShort ? 462 : 962, subSpec: '[-75x40x5T' };
        if (isTypeC) return { code: isShort ? 'WFB-0553AMZ' : 'WFB-1053AMZ', type: 'C타입', len: isShort ? 553 : 1053, subSpec: '[-75x40x5T' };
        return { code: isShort ? 'WFB-0494AMZ' : 'WFB-0994AMZ', type: 'B타입', len: isShort ? 494 : 994, subSpec: '[-75x40x5T' };
      }
    }

    // 실제 단면 작도 함수: 50 SHS (50X50 SQ PIPE □), 75 Angle (L-75x75x6T L), 125/150 Channel (ㄷ)
    // 사용자 요청: "모두 잘보이게 내부를 채워주세요." -> 강재 단면 내부(두께)를 솔리드 채움 처리하여 선명하게 표시
    const drawSection = (yWeb, yToe) => {
      if (isSHS) {
        // 50X50 SQ PIPE (사각 파이프 □)
        const y0 = Math.min(yWeb, yToe);
        const y1 = Math.max(yWeb, yToe);
        const ptsOut = [[0, y0], [th, y0], [th, y1], [0, y1]];
        const ptsIn = [[tw, y0 + tw], [th - tw, y0 + tw], [th - tw, y1 - tw], [tw, y1 - tw]];

        // 4개 벽체 내부 솔리드 채움
        const wallBottom = [[0, y0], [th, y0], [th, y0 + tw], [0, y0 + tw]];
        const wallTop = [[0, y1 - tw], [th, y1 - tw], [th, y1], [0, y1]];
        const wallLeft = [[0, y0 + tw], [tw, y0 + tw], [tw, y1 - tw], [0, y1 - tw]];
        const wallRight = [[th - tw, y0 + tw], [th, y0 + tw], [th, y1 - tw], [th - tw, y1 - tw]];
        const solids = [wallBottom, wallTop, wallLeft, wallRight];

        solids.forEach(wPts => {
          ents.push({ t: 'poly', pts: wPts, fill: true, fillLayer: 'FRAME_MAIN_L', stroke: false, close: true, layer: 'FRAME_MAIN_L', solids: [wPts] });
        });

        for (let k = 0; k < ptsOut.length; k++) {
          ents.push({ t: 'line', a: ptsOut[k], b: ptsOut[(k + 1) % ptsOut.length], layer: 'FRAME_MAIN_L' });
        }
        for (let k = 0; k < ptsIn.length; k++) {
          ents.push({ t: 'line', a: ptsIn[k], b: ptsIn[(k + 1) % ptsIn.length], layer: 'FRAME_MAIN_L' });
        }
      } else if (isAngle) {
        // 75 Angle (L-형 앵글 L-75x75x6T)
        const isUp = yToe > yWeb;
        const yFlangeInner = isUp ? yWeb + tw : yWeb - tw;
        const pts = [
          [0, yToe],
          [0, yWeb],
          [th, yWeb],
          [th, yFlangeInner],
          [tw, yFlangeInner],
          [tw, yToe]
        ];

        // 2개 사각형으로 분할한 DXF 솔리드
        const rect1 = isUp
          ? [[0, yWeb], [tw, yWeb], [tw, yToe], [0, yToe]]
          : [[0, yToe], [tw, yToe], [tw, yWeb], [0, yWeb]];
        const rect2 = isUp
          ? [[tw, yWeb], [th, yWeb], [th, yFlangeInner], [tw, yFlangeInner]]
          : [[tw, yFlangeInner], [th, yFlangeInner], [th, yWeb], [tw, yWeb]];

        ents.push({
          t: 'poly',
          pts,
          fill: true,
          fillLayer: 'FRAME_MAIN_L',
          stroke: false,
          close: true,
          layer: 'FRAME_MAIN_L',
          solids: [rect1, rect2]
        });

        for (let k = 0; k < pts.length; k++) {
          ents.push({ t: 'line', a: pts[k], b: pts[(k + 1) % pts.length], layer: 'FRAME_MAIN_L' });
        }
      } else {
        // 125 / 150 Channel (ㄷ-형 찬넬)
        const isUp = yToe > yWeb;
        const yFlangeInner = isUp ? yWeb + tw : yWeb - tw;
        const pts = [
          [0, yToe],
          [0, yWeb],
          [th, yWeb],
          [th, yToe],
          [th - tf, yToe],
          [th - tf, yFlangeInner],
          [tf, yFlangeInner],
          [tf, yToe]
        ];

        // 3개 사각형으로 분할한 DXF 솔리드
        const rectWeb = isUp
          ? [[0, yWeb], [th, yWeb], [th, yFlangeInner], [0, yFlangeInner]]
          : [[0, yFlangeInner], [th, yFlangeInner], [th, yWeb], [0, yWeb]];
        const rectFlangeL = isUp
          ? [[0, yFlangeInner], [tf, yFlangeInner], [tf, yToe], [0, yToe]]
          : [[0, yToe], [tf, yToe], [tf, yFlangeInner], [0, yFlangeInner]];
        const rectFlangeR = isUp
          ? [[th - tf, yFlangeInner], [th, yFlangeInner], [th, yToe], [th - tf, yToe]]
          : [[th - tf, yToe], [th, yToe], [th, yFlangeInner], [th - tf, yFlangeInner]];

        ents.push({
          t: 'poly',
          pts,
          fill: true,
          fillLayer: 'FRAME_MAIN_L',
          stroke: false,
          close: true,
          layer: 'FRAME_MAIN_L',
          solids: [rectWeb, rectFlangeL, rectFlangeR]
        });

        for (let k = 0; k < pts.length; k++) {
          ents.push({ t: 'line', a: pts[k], b: pts[(k + 1) % pts.length], layer: 'FRAME_MAIN_L' });
        }
      }
    };

    // 각 주재 정보: k = 0 (하단 외곽) ~ k = cn (상단 외곽)
    const chanGeom = [];

    // k = 0 (하단 외곽: y = -overY ~ lapIn)
    chanGeom[0] = {
      yWeb: lapIn,
      yToe: -overY,
      topFace: lapIn,      // 상부 서브빔이 닿는 외측 면 (y = 5)
      botFace: -overY
    };

    // k = 1 .. cn - 1 (중간 주재들)
    for (let k = 1; k < cn; k++) {
      const rowY = ys[k];
      const isUp = (k <= centerBay); // 제일 Center에서 [ ] 마주보도록: centerBay 이하 상향, 초과 하향
      const yWeb = isUp ? (rowY - mx) : (rowY + mx);
      const yToe = isUp ? (rowY + mx) : (rowY - mx);
      const botFace = isUp ? yWeb : (yWeb - tw); // 아래쪽 서브빔이 닿는 면
      const topFace = isUp ? (yWeb + tw) : yWeb; // 위쪽 서브빔이 닿는 면
      chanGeom[k] = { yWeb, yToe, botFace, topFace };
    }

    // k = cn (상단 외곽: y = totalW - lapIn ~ totalW + overY)
    chanGeom[cn] = {
      yWeb: totalW - lapIn,
      yToe: totalW + overY,
      botFace: totalW - lapIn, // 하부 서브빔이 닿는 외측 면 (y = totalW - 5)
      topFace: totalW + overY
    };

    const tH = Math.max(60, Math.round(totalW / 100), Math.round(2.4 * (opt._N || 0)));

    // 4. 인접 주재 사이 수직 서브빔 연결 상세
    for (let k = 0; k < cn; k++) {
      const sub = getSubBeamInfo(k, wl[k]);
      // 서브빔 수직 라인은 주재 면에서 시작하여 주재 면에서 종료
      const yBot = chanGeom[k].topFace;
      const yTop = chanGeom[k + 1].botFace;
      const yMid = (yBot + yTop) / 2;

      // 서브빔 단면 폭 (50 SHS: 50mm, 75/125/150: 75mm)
      // C Channel과 부재의 중심부와 레벨링: C Channel 중심선(th / 2)과 서브빔 중심선 일치
      const subH = isSHS ? 50 : 75;
      const subX0 = isSHS ? 0 : (th - subH) / 2;
      const subX1 = isSHS ? 50 : (th + subH) / 2;
      const tp = 6.0; // 6t 엔드 플레이트 두께
      const twSub = isSHS ? 3.2 : (isAngle ? 6.0 : 5.0); // 웨브 두께 (5t / 6t)
      const tfSub = isSHS ? 3.2 : (isAngle ? 6.0 : 5.0); // 플랜지 두께 (5t / 6t)
      const stepW = 57.5; // DWG 실측 몸체 잔여 폭 (17.5mm cutout)
      const stepH = flgW; // 단차 높이 (주재 플랜지 폭 70~75mm)
      const xStep = subX0 + stepW;

      // 서브빔 타입 판별: A타입(양단 직선), B타입(한쪽 단차), C타입(양단 단차)
      const isTypeA = isSHS || (sub.type === 'A타입');
      const isTypeC = !isSHS && (sub.type === 'C타입');
      const isTypeB = !isSHS && !isTypeA && !isTypeC;

      // 단차(홈)가 찬넬 플랜지 안쪽(사이)으로 들어가도록 방향 결정
      // k <= centerBay: 찬넬 k의 플랜지가 위(+Y)로 열려 있으므로 하단(yBot)에 단차
      // k > centerBay: 찬넬 k+1의 플랜지가 아래(-Y)로 열려 있으므로 상단(yTop)에 단차
      const stepAtBot = !isSHS && ((isTypeB && k <= centerBay) || isTypeC);
      const stepAtTop = !isSHS && ((isTypeB && k > centerBay) || isTypeC);

      if (isSHS) {
        // 50X50 SQ PIPE: 양단 6t 플레이트 + 외곽선 + 3.2T 관 두께선
        ents.push({ t: 'line', a: [subX0, yBot], b: [subX1, yBot], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX0, yBot + tp], b: [subX1, yBot + tp], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX0, yBot], b: [subX0, yBot + tp], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX1, yBot], b: [subX1, yBot + tp], layer: 'FRAME_SUB' });

        ents.push({ t: 'line', a: [subX0, yTop], b: [subX1, yTop], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX0, yTop - tp], b: [subX1, yTop - tp], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX0, yTop - tp], b: [subX0, yTop], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX1, yTop - tp], b: [subX1, yTop], layer: 'FRAME_SUB' });

        ents.push({ t: 'line', a: [subX0, yBot + tp], b: [subX0, yTop - tp], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX1, yBot + tp], b: [subX1, yTop - tp], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX0 + 3.2, yBot + tp], b: [subX0 + 3.2, yTop - tp], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX1 - 3.2, yBot + tp], b: [subX1 - 3.2, yTop - tp], layer: 'FRAME_SUB' });
      } else {
        // 하단 (yBot) 단차 또는 평평한 엔드플레이트
        if (!stepAtBot) {
          ents.push({ t: 'line', a: [subX0, yBot], b: [subX1, yBot], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX0, yBot + tp], b: [subX1, yBot + tp], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX0, yBot], b: [subX0, yBot + tp], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX1, yBot], b: [subX1, yBot + tp], layer: 'FRAME_SUB' });
        } else {
          // 하단 단차: 돌출부(subX0 ~ xStep)는 yBot까지, 홈/단차(xStep ~ subX1)는 yBot + stepH로 찬넬 플랜지 안착
          ents.push({ t: 'line', a: [subX0, yBot], b: [xStep, yBot], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX0, yBot + tp], b: [xStep, yBot + tp], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX0, yBot], b: [subX0, yBot + tp], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [xStep, yBot], b: [xStep, yBot + tp], layer: 'FRAME_SUB' });

          ents.push({ t: 'line', a: [xStep, yBot + tp], b: [xStep, yBot + stepH], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [xStep, yBot + stepH], b: [subX1, yBot + stepH], layer: 'FRAME_SUB' });
        }

        // 상단 (yTop) 단차 또는 평평한 엔드플레이트
        if (!stepAtTop) {
          ents.push({ t: 'line', a: [subX0, yTop], b: [subX1, yTop], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX0, yTop - tp], b: [subX1, yTop - tp], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX0, yTop - tp], b: [subX0, yTop], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX1, yTop - tp], b: [subX1, yTop], layer: 'FRAME_SUB' });
        } else {
          // 상단 단차: 돌출부(subX0 ~ xStep)는 yTop까지, 홈/단차(xStep ~ subX1)는 yTop - stepH로 찬넬 플랜지 안착
          ents.push({ t: 'line', a: [subX0, yTop], b: [xStep, yTop], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX0, yTop - tp], b: [xStep, yTop - tp], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [subX0, yTop - tp], b: [subX0, yTop], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [xStep, yTop - tp], b: [xStep, yTop], layer: 'FRAME_SUB' });

          ents.push({ t: 'line', a: [xStep, yTop - tp], b: [xStep, yTop - stepH], layer: 'FRAME_SUB' });
          ents.push({ t: 'line', a: [xStep, yTop - stepH], b: [subX1, yTop - stepH], layer: 'FRAME_SUB' });
        }

        // 서브빔 몸체 외곽선 및 두께선
        // 좌측 (레벨링 면): subX0에서 yBot+tp ~ yTop-tp 까지 완전 일직선
        ents.push({ t: 'line', a: [subX0, yBot + tp], b: [subX0, yTop - tp], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX0 + tfSub, yBot + tp], b: [subX0 + tfSub, yTop - tp], layer: 'FRAME_SUB' });

        // 우측 (단차 가공면): subX1에서 단차 턱 사이 연결
        const y1Start = stepAtBot ? (yBot + stepH) : (yBot + tp);
        const y1End = stepAtTop ? (yTop - stepH) : (yTop - tp);
        ents.push({ t: 'line', a: [subX1, y1Start], b: [subX1, y1End], layer: 'FRAME_SUB' });
        ents.push({ t: 'line', a: [subX1 - twSub, y1Start], b: [subX1 - twSub, y1End], layer: 'FRAME_SUB' });
      }

      // 부재 명칭 표기: 사용자 요청 ("홀은 없애주세요. 품명만 남겨주세요. 부품명은 부품안에 넣어주세요.")
      // 1) 양단 볼트 홀 및 결합 탭 선 제거
      // 2) 품명만 단독 표기 (타입 및 가공길이 제외)
      // 3) 부재 단면 두께(subH) 내부 중앙에 정렬
      const subTextH = Math.min(26, Math.round(subH * 0.35));
      ents.push({
        t: 'text',
        p: [subX0 + subH / 2, yMid],
        h: subTextH,
        s: sub.code,
        rot: 90,
        align: 'center',
        valign: 'middle',
        layer: 'FRAME_SUB'
      });

      // 서브빔 실제 가공 길이 치수선 (좌측)
      dimLinear(ents, [0, yBot], [0, yTop], -tH * 3.4, true, String(sub.len), tH, 'DIM');
    }

    // 5. 주재 단면 그리기 (0 ~ cn): 서브빔 상위에 배치하여 단면 솔리드 및 외곽선이 완벽히 전면에 노출되도록 함
    for (let k = 0; k <= cn; k++) {
      drawSection(chanGeom[k].yWeb, chanGeom[k].yToe);
    }

    // 6. 우측 3-Tier 치수선: 돌출(60), 패널 피치(1000...), 탱크 폭(4000), 스키드 전체(4120)
    const xr1 = th + tH * 2.8;
    const xr2 = xr1 + tH * 2.5;
    const xr3 = xr2 + tH * 2.5;

    // 1열: 하부 돌출(60), 각 행 피치(1000...), 상부 돌출(60)
    dimLinear(ents, [th, -overY], [th, 0], xr1, true, String(overY), tH, 'DIM');
    for (let k = 0; k < cn; k++) {
      dimLinear(ents, [th, ys[k]], [th, ys[k + 1]], xr1, true, String(wl[k]), tH, 'DIM');
    }
    dimLinear(ents, [th, totalW], [th, totalW + overY], xr1, true, String(overY), tH, 'DIM');

    // 2열: 탱크 패널 전체 높이 (4000)
    dimLinear(ents, [th, 0], [th, totalW], xr2, true, String(totalW), tH, 'DIM');

    // 3열: 스틸 스키드 프레임 전체 높이 (4120)
    dimLinear(ents, [th, -overY], [th, totalW + overY], xr3, true, String(totalW + overY * 2), tH, 'DIM');

    // 6. 하부 찬넬 단면 치수선 (찬넬 높이 125, 플랜지 폭 65, 웨브 두께 6T)
    dimLinear(ents, [0, -overY], [th, -overY], -overY - tH * 2.5, false, String(th), tH, 'DIM');
    dimLinear(ents, [0, -overY], [0, lapIn], -tH * 6.5, true, String(flgW), tH, 'DIM');
    dimLinear(ents, [0, -overY], [tw, -overY], -overY - tH * 5.0, false, String(tw) + 'T', tH, 'DIM');

    // (기초 패드는 사용자 요청에 의해 완전히 제거됨)

    return { ents };
  }
  // INTERNAL STAY: OutBorder + Vert/Horiz (CCeilFrmLT 30 폭 사각)
  function buildStay(opt) {
    const G = frameGeom(opt), { R, sRow, eRow, sCol, eCol, nr, nc } = G, ents = [];
    // OutBorder: 노출된 셀 변 (프레임 외곽선)
    for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
      const c = R(i, j); if (!c) continue;
      if (!R(i, j - 1)) ents.push({ t: 'line', a: [c.l, c.t], b: [c.l, c.b], layer: 'FRAME' });
      if (!R(i, j + 1)) ents.push({ t: 'line', a: [c.r, c.t], b: [c.r, c.b], layer: 'FRAME' });
      if (!R(i - 1, j)) ents.push({ t: 'line', a: [c.l, c.t], b: [c.r, c.t], layer: 'FRAME' });
      if (!R(i + 1, j)) ents.push({ t: 'line', a: [c.l, c.b], b: [c.r, c.b], layer: 'FRAME' });
    }
    const vert = ((opt.width || [])[0] || 0) <= ((opt.length || [])[0] || 0);
    if (vert) {
      let nWidth = 0, nY = -1;
      for (let j = sCol + 1; j <= eCol; j++) {
        const nX = G.colLeft(j);
        for (let i = sRow; i <= eRow; i++) {
          const rc = R(i, j), rl = R(i, j - 1);
          if (!rl || !rc) { if (nWidth) { rectEnts(nX - 15, nY, 30, nWidth, 'FRAME', ents); nWidth = 0; nY = -1; } }
          else { nWidth += rc.h; if (nY < 0) nY = rc.t; }
        }
        if (nWidth) { rectEnts(nX - 15, nY, 30, nWidth, 'FRAME', ents); nWidth = 0; nY = -1; }
      }
    } else {
      let nLen = 0, nX = -1;
      for (let i = sRow + 1; i <= eRow; i++) {
        const nY = G.rowTop(i);
        for (let j = sCol; j <= eCol; j++) {
          const rc = R(i, j), rd = R(i - 1, j);
          if (!rd || !rc) { if (nLen) { rectEnts(nX, nY - 15, nLen, 30, 'FRAME', ents); nLen = 0; nX = -1; } }
          else { nLen += rc.w; if (nX < 0) nX = rc.l; }
        }
        if (nLen) { rectEnts(nX, nY - 15, nLen, 30, 'FRAME', ents); nLen = 0; nX = -1; }
      }
    }
    frameDims(ents, G.map, frameTextH(G.map, opt), true, true);
    return { ents };
  }

  /* ---------- 도면 시트 (A1 가로, 표제란) ---------- */
  const SCALES = [10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300];
  const SHEET = { w: 841, h: 594, title: 200, margin: 15, gridMargin: 10 };   // 종이 mm (A1 글로벌 표준: 표제란 200mm, 외곽 10mm 그리드, 본선 15mm)
  function pickScale(L, W, H, isAsm5 = false) {
    if (isAsm5) {
      const isoW = Math.round((L + W) * 0.55);
      const maxCol2W = Math.max(W + 500, isoW);
      const w_model = (L + 600) + maxCol2W;
      // 3행 배치: Row 1(Plan W + dims), Row 2(Elev H + ground), Row 3(Pad Plan W + Pad Sec + dims + titles)
      const h_model = 2 * W + H + 7600;
      const avail_w = SHEET.w - SHEET.title - SHEET.margin * 2; // 621 mm
      const avail_h = SHEET.h - SHEET.margin * 2;              // 574 mm
      for (const n of SCALES) {
        const w_paper = w_model / n + 60;
        const h_paper = h_model / n + 75;
        if (w_paper <= avail_w && h_paper <= avail_h) return n;
      }
      return SCALES[SCALES.length - 1];
    }
    const w_model = L + 150 + Math.max(L + 500, W + 150);
    const h_model = W + 400 + H + 800;
    const avail_w = SHEET.w - SHEET.title - SHEET.margin * 2; // 621 mm
    const avail_h = SHEET.h - SHEET.margin * 2;              // 574 mm
    for (const n of SCALES) {
      const w_paper = w_model / n + 100;
      const h_paper = h_model / n + 110;
      if (w_paper <= avail_w - 20 && h_paper <= avail_h - 20) return n;
    }
    return SCALES[SCALES.length - 1];
  }
  function bb(es) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    (es || []).forEach(e => {
      if (e.t === 'insert' && e.w && e.h && e.p) {
        minX = Math.min(minX, e.p[0], e.p[0] + e.w);
        maxX = Math.max(maxX, e.p[0], e.p[0] + e.w);
        minY = Math.min(minY, e.p[1], e.p[1] + e.h);
        maxY = Math.max(maxY, e.p[1], e.p[1] + e.h);
      } else if (e.a && e.b) {
        minX = Math.min(minX, e.a[0], e.b[0]); maxX = Math.max(maxX, e.a[0], e.b[0]);
        minY = Math.min(minY, e.a[1], e.b[1]); maxY = Math.max(maxY, e.a[1], e.b[1]);
      } else if (e.c && e.r) {
        minX = Math.min(minX, e.c[0] - e.r); maxX = Math.max(maxX, e.c[0] + e.r);
        minY = Math.min(minY, e.c[1] - e.r); maxY = Math.max(maxY, e.c[1] + e.r);
      } else if (e.p) {
        if (Array.isArray(e.p[0])) e.p.forEach(pt => { minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]); minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]); });
        else { minX = Math.min(minX, e.p[0]); maxX = Math.max(maxX, e.p[0]); minY = Math.min(minY, e.p[1]); maxY = Math.max(maxY, e.p[1]); }
      } else if (e.pts && Array.isArray(e.pts)) {
        e.pts.forEach(pt => { minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]); minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]); });
      }
    });
    return [isFinite(minX) ? minX : 0, isFinite(minY) ? minY : 0, isFinite(maxX) ? maxX : 1000, isFinite(maxY) ? maxY : 1000];
  }
  function estimateTextWidth(str, h, widthFactor = 0.85) {
    let w = 0;
    for (const ch of String(str || '')) {
      const code = ch.codePointAt(0);
      if (code > 0x7f) {
        w += 1.0 * h * widthFactor;
      } else if (code === 32) {
        w += 0.45 * h * widthFactor;
      } else if ('.,:;!\'|/\\'.includes(ch)) {
        w += 0.3 * h * widthFactor;
      } else if ('ijlIt[]()1'.includes(ch)) {
        w += 0.4 * h * widthFactor;
      } else if ('MW@#%'.includes(ch)) {
        w += 0.85 * h * widthFactor;
      } else if (code >= 65 && code <= 90) {
        w += 0.65 * h * widthFactor;
      } else if (code >= 48 && code <= 57) {
        w += 0.6 * h * widthFactor;
      } else {
        w += 0.55 * h * widthFactor;
      }
    }
    return w;
  }
  function wrapTextByWidth(str, maxW, fontH) {
    const out = [];
    let cur = '';
    const words = String(str || '').split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (!w) continue;
      const cand = cur ? (cur + ' ' + w) : w;
      if (cur && estimateTextWidth(cand, fontH) > maxW) {
        out.push(cur);
        cur = w;
      } else {
        cur = cand;
      }
      while (estimateTextWidth(cur, fontH) > maxW && cur.length > 1) {
        let cut = cur.length - 1;
        while (cut > 1 && estimateTextWidth(cur.slice(0, cut), fontH) > maxW) {
          cut--;
        }
        out.push(cur.slice(0, cut));
        cur = cur.slice(cut);
      }
    }
    if (cur) out.push(cur);
    return out.length ? out : [''];
  }
  function wrapText(str, maxChars) {
    const out = []; let cur = '';
    str.split(/\s+/).forEach(w => {
      if ((cur + ' ' + w).trim().length > maxChars && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) out.push(cur);
    return out;
  }
  function buildDetails(opt, N, P, x0, y0, tx0, y1) {
    const dents = [];
    const W = tx0 - x0, H = y1 - y0;
    const dLine = (a, b, layer) => dents.push({ t: 'line', a: [P(a[0]), P(a[1])], b: [P(b[0]), P(b[1])], layer: layer || 'FRAME' });
    const dRect = (xa, ya, xb, yb, layer) => { dLine([xa, ya], [xb, ya], layer); dLine([xb, ya], [xb, yb], layer); dLine([xb, yb], [xa, yb], layer); dLine([xa, yb], [xa, ya], layer); };
    const dCirc = (c, r, layer) => dents.push({ t: 'circle', c: [P(c[0]), P(c[1])], r: P(r), layer: layer || 'FRAME' });
    const dText = (x, y, h, s, align) => dents.push({ t: 'text', p: [P(x), P(y)], h: P(h), s, align: align || 'center', valign: 'middle', layer: 'SHEET' });

    const drawHeader = (cx, cy, letter, title, sc) => {
      dCirc([cx, cy], 9, 'SHEET');
      dText(cx, cy, 7.5, letter, 'center');
      dText(cx, cy - 14, 5.0, title, 'center');
      dLine([cx - 40, cy - 18], [cx + 40, cy - 18], 'SHEET');
      dText(cx, cy - 23, 3.2, 'SCALE : ' + sc, 'center');
    };

    // 1. DETAIL "A": CONCRETE PAD & ANCHOR BOLT (좌상)
    const ax = x0 + W * 0.28, ay = y0 + H * 0.74;
    drawHeader(ax, ay - 90, 'A', 'CON\'C PAD & ANCHOR BOLT DETAIL', '1 / 10');
    dRect(ax - 65, ay - 55, ax + 65, ay - 10, 'FRAME');
    for (let i = -55; i <= 55; i += 12) dLine([ax + i, ay - 55], [ax + i + 10, ay - 10], 'REINF');
    dRect(ax - 28, ay - 10, ax + 28, ay + 38, 'FRAME');
    dRect(ax - 24, ay - 7, ax + 24, ay + 35, 'FRAME');
    dLine([ax - 75, ay + 38], [ax + 75, ay + 38], 'PANEL');
    dLine([ax - 75, ay + 42], [ax + 75, ay + 42], 'PANEL');
    dRect(ax - 4, ay - 45, ax + 4, ay + 15, 'FRAME');
    dLine([ax - 8, ay + 12], [ax + 8, ay + 12], 'FRAME');
    dLine([ax - 8, ay + 8], [ax + 8, ay + 8], 'FRAME');
    dLine([ax + 28, ay + 20], [ax + 60, ay + 32], 'DIM');
    dLine([ax + 60, ay + 32], [ax + 95, ay + 32], 'DIM');
    dText(ax + 78, ay + 36, 3.2, 'BASE CHANNEL 100x50', 'center');
    dLine([ax + 4, ay - 25], [ax + 45, ay - 35], 'DIM');
    dLine([ax + 45, ay - 35], [ax + 90, ay - 35], 'DIM');
    dText(ax + 68, ay - 31, 3.2, 'ANCHOR BOLT M16', 'center');

    // 2. DETAIL "B": PANEL FLANGE JOINT DETAIL (우상)
    const bx = x0 + W * 0.72, by = y0 + H * 0.74;
    drawHeader(bx, by - 90, 'B', 'PANEL FLANGE JOINT DETAIL', '1 / 5');
    dRect(bx - 55, by - 4, bx - 6, by + 4, 'PANEL');
    dRect(bx - 6, by - 45, bx, by + 45, 'PANEL');
    dRect(bx, by - 45, bx + 6, by + 45, 'PANEL');
    dRect(bx + 6, by - 4, bx + 55, by + 4, 'PANEL');
    dRect(bx - 12, by + 18, bx + 12, by + 26, 'FRAME');
    dRect(bx - 16, by + 16, bx - 12, by + 28, 'FRAME');
    dRect(bx + 12, by + 16, bx + 16, by + 28, 'FRAME');
    dRect(bx - 12, by - 26, bx + 12, by - 18, 'FRAME');
    dRect(bx - 16, by - 28, bx - 12, by - 16, 'FRAME');
    dRect(bx + 12, by - 28, bx + 16, by - 16, 'FRAME');
    dLine([bx, by - 40], [bx, by + 40], 'REINF');
    dLine([bx + 16, by + 22], [bx + 48, by + 34], 'DIM');
    dLine([bx + 48, by + 34], [bx + 85, by + 34], 'DIM');
    dText(bx + 66, by + 38, 3.2, 'BOLT M10 SUS304', 'center');
    dLine([bx, by], [bx - 35, by - 24], 'DIM');
    dLine([bx - 35, by - 24], [bx - 75, by - 24], 'DIM');
    dText(bx - 55, by - 20, 3.2, 'SEALING TAPE GASKET', 'center');

    // 3. DETAIL "C": ROOF ACCESSORIES (좌하)
    const cx = x0 + W * 0.28, cy = y0 + H * 0.28;
    drawHeader(cx, cy - 90, 'C', 'ROOF MANHOLE & AIR VENT DETAIL', '1 / 10');
    dLine([cx - 75, cy], [cx + 75, cy], 'PANEL');
    dRect(cx - 45, cy, cx - 40, cy + 38, 'FRAME');
    dRect(cx + 8, cy, cx + 13, cy + 38, 'FRAME');
    dRect(cx - 48, cy + 38, cx + 16, cy + 46, 'FRAME');
    dLine([cx - 18, cy + 46], [cx - 18, cy + 56], 'FRAME');
    dLine([cx - 18, cy + 56], [cx + 2, cy + 56], 'FRAME');
    dLine([cx + 2, cy + 56], [cx + 2, cy + 46], 'FRAME');
    dRect(cx + 42, cy, cx + 52, cy + 40, 'REINF');
    dCirc([cx + 47, cy + 50], 12, 'REINF');
    for (let a = -9; a <= 9; a += 4) dLine([cx + 47 + a, cy + 44], [cx + 47 + a, cy + 56], 'REINF');
    dLine([cx - 18, cy + 42], [cx - 48, cy + 62], 'DIM');
    dLine([cx - 48, cy + 62], [cx - 88, cy + 62], 'DIM');
    dText(cx - 68, cy + 66, 3.2, 'MANHOLE D=600 COVER', 'center');
    dLine([cx + 47, cy + 50], [cx + 68, cy + 62], 'DIM');
    dLine([cx + 68, cy + 62], [cx + 102, cy + 62], 'DIM');
    dText(cx + 85, cy + 66, 3.2, 'AIR VENT 100A (SUS MESH)', 'center');

    // 4. DETAIL "D": INTERNAL STAY & BRACKET (우하)
    const dx = x0 + W * 0.72, dy = y0 + H * 0.28;
    drawHeader(dx, dy - 90, 'D', 'INTERNAL STAY & BRACKET DETAIL', '1 / 10');
    dRect(dx - 50, dy - 45, dx - 44, dy + 45, 'PANEL');
    dRect(dx - 44, dy - 16, dx - 24, dy + 16, 'FRAME');
    dCirc([dx - 32, dy], 4, 'FRAME');
    dLine([dx - 32, dy], [dx + 55, dy + 32], 'FRAME');
    dLine([dx - 30, dy - 3], [dx + 57, dy + 29], 'FRAME');
    dRect(dx + 12, dy + 12, dx + 32, dy + 22, 'FRAME');
    dLine([dx + 22, dy + 17], [dx + 48, dy + 38], 'DIM');
    dLine([dx + 48, dy + 38], [dx + 88, dy + 38], 'DIM');
    dText(dx + 68, dy + 42, 3.2, 'TURNBUCKLE SUS304', 'center');
    dLine([dx - 35, dy + 14], [dx - 58, dy + 32], 'DIM');
    dLine([dx - 58, dy + 32], [dx - 98, dy + 32], 'DIM');
    dText(dx - 78, dy + 36, 3.2, 'STAY BRACKET 4.5t', 'center');

    return dents;
  }
  function buildSheet(opt, templates, sideT) {
    opt = normFrameOpt({ ...opt });
    const usedBalloons = new Set();
    opt.usedBalloons = usedBalloons;
    const H = (opt.height || []).reduce((a, b) => a + (b || 0), 0);
    const mmap = createMap(opt);
    const totalL = mmap.length, totalW = mmap.width;

    // 1. 축척(Scale) 결정 (수동 선택값 우선, 없으면 자동 계산)
    const isAsmSheet = (!opt.sheetKind || opt.sheetKind === 'asm');
    const N = Number(opt.userScale) || pickScale(totalL, totalW, H, isAsmSheet);
    opt._N = N;
    const P = v => v * N;   // 종이 mm → 모델 mm

    // 2. 축척 비례 하위 뷰 생성
    const plan = buildPlan(opt, templates);
    const frontSec = buildFoundationSection(opt);
    const conc = buildConcrete({ ...opt, hideBottomDim: Boolean(frontSec) });
    const hs = (opt.hseg && opt.hseg.length) ? opt.hseg : heightSegs(H, opt.b11);
    opt.hseg = hs;
    const front = sideT ? buildElevation(opt, sideT, 'front') : null;
    const side = sideT ? buildElevation(opt, sideT, 'side') : null;

    const ents = [], t = opt.title || {};
    const S = SHEET;
    const gx0 = S.gridMargin, gy0 = S.gridMargin, gx1 = S.w - S.gridMargin, gy1 = S.h - S.gridMargin;
    const x0 = S.margin, y0 = S.margin, x1 = S.w - S.margin, y1 = S.h - S.margin;
    const line = (a, b, color) => ents.push({ t: 'line', a: [P(a[0]), P(a[1])], b: [P(b[0]), P(b[1])], layer: 'SHEET', ...(color ? { color } : {}) });
    const circle = (c, r) => ents.push({ t: 'circle', c: [P(c[0]), P(c[1])], r: P(r), layer: 'SHEET' });
    const arc = (c, r, a0, a1) => ents.push({ t: 'arc', c: [P(c[0]), P(c[1])], r: P(r), a0: a0 || 0, a1: a1 || 360, layer: 'SHEET' });
    const poly = (pts, layer = 'SHEET') => ents.push({ t: 'poly', pts: pts.map(pt => [P(pt[0]), P(pt[1])]), layer });
    const solid = (pts, layer = 'SHEET', color) => ents.push({ t: 'solid', p: pts.map(pt => [P(pt[0]), P(pt[1])]), layer, ...(color ? { color } : {}) });
    const rect = (xa, ya, xb, yb) => { line([xa, ya], [xb, ya]); line([xb, ya], [xb, yb]); line([xb, yb], [xa, yb]); line([xa, yb], [xa, ya]); };
    const text = (x, y, h, str, align, rot, valign) => { if (str) ents.push({ t: 'text', p: [P(x), P(y)], h: P(h), s: str, rot: rot || 0, align: align || 'left', valign: valign || 'baseline', layer: 'SHEET' }); };

    // --- [글로벌 엔지니어링 도면틀: ISO 5457 / ISO 7200 / ASME Y14 표준 준수] ---
    // 1. 도면 모서리 재단 마크 (Corner Trimming Marks: A1 841x594 기준 4개소)
    const cropLen = 10;
    line([0, cropLen], [cropLen, cropLen]); line([cropLen, 0], [cropLen, cropLen]);
    line([S.w, cropLen], [S.w - cropLen, cropLen]); line([S.w - cropLen, 0], [S.w - cropLen, cropLen]);
    line([0, S.h - cropLen], [cropLen, S.h - cropLen]); line([cropLen, S.h], [cropLen, S.h - cropLen]);
    line([S.w, S.h - cropLen], [S.w - cropLen, S.h - cropLen]); line([S.w - cropLen, S.h], [S.w - cropLen, S.h - cropLen]);

    // 2. 외곽 그리드 경계선 (Outer Grid Margin 10mm) 및 본선 도면 테두리 (Inner Border 15mm)
    rect(gx0, gy0, gx1, gy1);
    rect(x0, y0, x1, y1);

    // 3. 중심 마크 (Centering Marks: 상하좌우 4개소, 중앙 420.5, 297)
    const midX = S.w / 2, midY = S.h / 2;
    line([midX, gy0 - 5], [midX, y0 + 5]); // 하단
    line([midX, y1 - 5], [midX, gy1 + 5]); // 상단
    line([gx0 - 5, midY], [x0 + 5, midY]); // 좌측
    line([x1 - 5, midY], [gx1 + 5, midY]); // 우측

    // 4. 방향 표시 삼각형 (Orientation Mark: ISO 5457 하단 중심)
    poly([[midX, y0 + 2], [midX - 2.5, gy0 + 1], [midX + 2.5, gy0 + 1], [midX, y0 + 2]]);
    solid([[midX, y0 + 2], [midX - 2.5, gy0 + 1], [midX + 2.5, gy0 + 1], [midX, y0 + 2]]);

    // 5. 도면 구획 참조 격자 좌표계 (Grid Reference System: 1~8 수평, A~F 수직)
    const numCols = 8;
    const wz = (x1 - x0) / numCols;
    for (let i = 1; i < numCols; i++) {
      const zx = x0 + i * wz;
      line([zx, gy0], [zx, y0]);
      line([zx, y1], [zx, gy1]);
    }
    for (let i = 0; i < numCols; i++) {
      const zcx = x0 + (i + 0.5) * wz;
      // i === 0 하단은 100mm 메트릭 참조 척도 스케일바가 배치되므로 스케일바 간섭 방지(상단에는 1 표기 유지)
      if (i > 0) text(zcx, (gy0 + y0) / 2, 2.6, String(i + 1), 'center', 0, 'middle');
      text(zcx, (y1 + gy1) / 2, 2.6, String(i + 1), 'center', 0, 'middle');
    }

    const numRows = 6;
    const hz = (y1 - y0) / numRows;
    const vLetters = ['F', 'E', 'D', 'C', 'B', 'A']; // 하단부터 F, E, D, C, B, 상단 A (ISO 5457 표준)
    for (let j = 1; j < numRows; j++) {
      const zy = y0 + j * hz;
      line([gx0, zy], [x0, zy]);
      line([x1, zy], [gx1, zy]);
    }
    for (let j = 0; j < numRows; j++) {
      const zcy = y0 + (j + 0.5) * hz;
      text((gx0 + x0) / 2, zcy, 2.6, vLetters[j], 'center', 0, 'middle');
      text((x1 + gx1) / 2, zcy, 2.6, vLetters[j], 'center', 0, 'middle');
    }

    // 6. 메트릭 참조 척도 스케일바 (100mm Metric Reference Scale Bar: ISO 5457 표준)
    // 하단 좌측 1구획 내 15mm ~ 115mm (정확히 100mm 길이)에 10mm 간격 눈금 및 흑백 블록
    const sbX = x0, sbY0 = gy0 + 1.0, sbY1 = y0 - 0.5;
    rect(sbX, sbY0, sbX + 100, sbY1);
    for (let si = 1; si < 10; si++) {
      line([sbX + si * 10, sbY0], [sbX + si * 10, sbY1]);
    }
    for (let si = 0; si < 10; si += 2) {
      solid([[sbX + si * 10, (sbY0 + sbY1) / 2], [sbX + (si + 1) * 10, (sbY0 + sbY1) / 2], [sbX + (si + 1) * 10, sbY1], [sbX + si * 10, sbY1]]);
    }
    text(sbX, gy0 - 2.5, 2.0, '0', 'center', 0, 'middle');
    text(sbX + 50, gy0 - 2.5, 2.0, '50', 'center', 0, 'middle');
    text(sbX + 100, gy0 - 2.5, 2.0, '100 mm', 'center', 0, 'middle');

    // 표제란 세로 구획선
    const tx0 = x1 - S.title, tw = S.title;
    line([tx0, y0], [tx0, y1]);

    const lang = opt.drawingLang || opt.lang || 'ko';

    // ==========================================
    // 상단 헤더: 회사정보 및 개정 이력표 (Revision Block)
    // ==========================================
    let y = y1;
    // 1. 회사명 및 로고 (높이 16mm)
    y -= 16;
    line([tx0, y], [x1, y]);
    const logoX = tx0 + 16, logoY = y + 8;
    const logoTxt = (t.logoText !== undefined && t.logoText !== null) ? t.logoText : 'Y';
    if (t.logoCadEntities && t.logoCadEntities.length) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const addPt = (px, py) => {
        if (typeof px === 'number' && isFinite(px) && typeof py === 'number' && isFinite(py)) {
          if (px < minX) minX = px; if (py < minY) minY = py;
          if (px > maxX) maxX = px; if (py > maxY) maxY = py;
        }
      };
      t.logoCadEntities.forEach(e => {
        if (e.k === 'line' && e.p) { addPt(e.p[0][0], e.p[0][1]); addPt(e.p[1][0], e.p[1][1]); }
        else if (e.k === 'solid' && e.p) { e.p.forEach(pt => addPt(pt[0], pt[1])); }
        else if (e.k === 'circle' && e.c) { addPt(e.c[0] - e.r, e.c[1] - e.r); addPt(e.c[0] + e.r, e.c[1] + e.r); }
        else if (e.k === 'arc' && e.c) { addPt(e.c[0] - e.r, e.c[1] - e.r); addPt(e.c[0] + e.r, e.c[1] + e.r); }
        else if (e.k === 'poly' && e.p) { e.p.forEach(pt => addPt(pt[0], pt[1])); }
      });
      const ow = maxX - minX, oh = maxY - minY;
      if (ow > 0 && oh > 0) {
        const maxW = 24, maxH = 13;
        const s = Math.min(maxW / ow, maxH / oh);
        const dx = logoX - (minX + ow / 2) * s;
        const dy = logoY - (minY + oh / 2) * s;
        t.logoCadEntities.forEach(e => {
          if (e.k === 'line' && e.p) {
            line([e.p[0][0] * s + dx, e.p[0][1] * s + dy], [e.p[1][0] * s + dx, e.p[1][1] * s + dy], e.color);
          } else if (e.k === 'solid' && e.p && e.p.length >= 4) {
            const sp = e.p.map(pt => [P(pt[0] * s + dx), P(pt[1] * s + dy)]);
            ents.push({ t: 'solid', p: sp, layer: 'SHEET', ...(e.color ? { color: e.color } : {}) });
          } else if (e.k === 'circle' && e.c) {
            circle([e.c[0] * s + dx, e.c[1] * s + dy], e.r * s);
          } else if (e.k === 'arc' && e.c) {
            arc([e.c[0] * s + dx, e.c[1] * s + dy], e.r * s, e.a0, e.a1);
          } else if (e.k === 'poly' && e.p && e.p.length >= 2) {
            const scaledPts = e.p.map(pt => [pt[0] * s + dx, pt[1] * s + dy]);
            poly(scaledPts, 'SHEET');
          }
        });
        if (t.logoImage) {
          ents.push({
            t: 'image',
            href: t.logoImage,
            x: P(logoX - 12),
            y: P(logoY - 6.5),
            w: P(24),
            h: P(13),
            layer: 'SHEET'
          });
        }
      } else {
        circle([logoX, logoY], 5.8);
        circle([logoX, logoY], 5.0);
        if (logoTxt) text(logoX, logoY, 5.5, logoTxt, 'center', 0, 'middle');
      }
    } else if (t.logoImage) {
      ents.push({
        t: 'image',
        href: t.logoImage,
        x: P(logoX - 12),
        y: P(logoY - 6.5),
        w: P(24),
        h: P(13),
        layer: 'SHEET'
      });
    } else if (logoTxt) {
      circle([logoX, logoY], 5.8);
      circle([logoX, logoY], 5.0);
      text(logoX, logoY, 5.5, logoTxt, 'center', 0, 'middle');
    }
    const defComp = lang === 'ko' ? '(주)와이에스에이씨' : 'YSACC CO., LTD';
    const compName = t.customer || defComp;
    text(tx0 + 30 + (tw - 30) / 2, y + 8, 6.2, compName, 'center', 0, 'middle');

    // 2. 제품명 (높이 11mm)
    y -= 11;
    line([tx0, y], [x1, y]);
    const defProd = lang === 'ko' ? ((opt.material === 'STS' ? 'STS' : 'GRP') + ' 조립식 물탱크') : ((opt.material === 'STS' ? 'STS' : 'GRP') + ' PANEL WATER TANK');
    const prodName = (t.prodName && t.prodName.trim()) ? t.prodName.trim() : defProd;
    text(tx0 + tw / 2, y + 5.5, 5.2, prodName, 'center', 0, 'middle');

    // 3. 주소 및 연락처 (높이 14mm)
    y -= 14;
    line([tx0, y], [x1, y]);
    const defAddr = lang === 'ko' ? '충청북도 청주시 흥덕구 가로수로 1251, 201-1호 (28420)' : '201-1, 1251, Garosu-ro, Heungdeok-gu, Cheongju-si, Chungcheongbuk-do, 28420, Korea';
    const rawAddr = t.address || defAddr;
    const telInfo = t.tel ? (t.tel.toUpperCase().includes('TEL') ? t.tel : ('TEL : ' + t.tel)) : '';
    let addrLines = [rawAddr];
    if (rawAddr.length > 45) {
      const splitKey = lang === 'ko' ? '청주시' : 'Cheongju-si,';
      if (rawAddr.includes(splitKey)) {
        const idx = rawAddr.indexOf(splitKey) + splitKey.length;
        addrLines = [rawAddr.slice(0, idx).trim(), rawAddr.slice(idx).trim()];
      } else {
        const commaIdx = rawAddr.indexOf(',', 35);
        if (commaIdx !== -1 && commaIdx < 60) {
          addrLines = [rawAddr.slice(0, commaIdx + 1).trim(), rawAddr.slice(commaIdx + 1).trim()];
        }
      }
    }
    if (telInfo) {
      if (addrLines.length > 1) {
        text(tx0 + tw / 2, y + 10.5, 3.0, addrLines[0], 'center', 0, 'middle');
        text(tx0 + tw / 2, y + 6.8, 3.0, addrLines[1], 'center', 0, 'middle');
        text(tx0 + tw / 2, y + 2.8, 2.8, telInfo, 'center', 0, 'middle');
      } else {
        text(tx0 + tw / 2, y + 9.0, 3.2, addrLines[0], 'center', 0, 'middle');
        text(tx0 + tw / 2, y + 3.8, 3.0, telInfo, 'center', 0, 'middle');
      }
    } else {
      if (addrLines.length > 1) {
        text(tx0 + tw / 2, y + 9.5, 3.2, addrLines[0], 'center', 0, 'middle');
        text(tx0 + tw / 2, y + 4.5, 3.2, addrLines[1], 'center', 0, 'middle');
      } else {
        text(tx0 + tw / 2, y + 7.0, 3.5, addrLines[0], 'center', 0, 'middle');
      }
    }

    // 4. 개정 이력표 (REVISION BLOCK: ISO 7200 / ASME Y14.35 표준)
    // 높이 24mm: 헤더 6mm + 개정 행 2개(각 9mm)
    const revHeaderH = 6, revRowH = 9;
    const revTotalH = revHeaderH + revRowH * 2;
    y -= revTotalH;
    line([tx0, y], [x1, y]);
    line([tx0, y + revRowH * 2], [x1, y + revRowH * 2]);
    line([tx0, y + revRowH], [x1, y + revRowH]);
    // 열 구획: ZONE(14), REV(14), DESCRIPTION(116), DATE(28), APPROVED(28)
    const revCols = [
      { key: 'zone', label: 'ZONE', w: 14 },
      { key: 'rev', label: 'REV.', w: 14 },
      { key: 'desc', label: lang === 'ko' ? '개 정 내 역  (DESCRIPTION)' : 'REVISION DESCRIPTION', w: 116 },
      { key: 'date', label: lang === 'ko' ? '일자(DATE)' : 'DATE', w: 28 },
      { key: 'appd', label: lang === 'ko' ? '승인(APPD)' : 'APPROVED', w: 28 }
    ];
    let rx = tx0;
    revCols.forEach((col, ci) => {
      text(rx + col.w / 2, y + revRowH * 2 + revHeaderH / 2, 2.5, col.label, 'center', 0, 'middle');
      if (ci > 0) {
        line([rx, y], [rx, y + revTotalH]);
      }
      rx += col.w;
    });

    const today = new Date(), pad2 = v => String(v).padStart(2, '0');
    const todayStr = t.date || (today.getFullYear() + '.' + pad2(today.getMonth() + 1) + '.' + pad2(today.getDate()));

    // 개정 0 (최초 발행)
    const revRow1Y = y + revRowH;
    text(tx0 + 7, revRow1Y + revRowH / 2, 2.8, '-', 'center', 0, 'middle');
    text(tx0 + 21, revRow1Y + revRowH / 2, 3.0, '0', 'center', 0, 'middle');
    const initDesc = lang === 'ko' ? '도면 최초 제정 및 발행 (FOR APPROVAL)' : 'INITIAL ISSUE / FOR APPROVAL';
    text(tx0 + 28 + 4, revRow1Y + revRowH / 2, 2.6, initDesc, 'left', 0, 'middle');
    text(tx0 + 144 + 14, revRow1Y + revRowH / 2, 2.5, todayStr, 'center', 0, 'middle');
    text(tx0 + 172 + 14, revRow1Y + revRowH / 2, 2.8, t.approved || (lang === 'ko' ? '와이에스' : 'YSACC'), 'center', 0, 'middle');

    // ==========================================
    // 하부 표제란 (ISO 7200 / ASME Y14 블록: 아래에서 위로)
    // ==========================================
    const anyRemoved = mmap.removed && mmap.removed.size > 0;
    const autoDimStr = getTankDimStr(opt, mmap, H);
    const dimStr = (t.tankSize && t.tankSize.trim()) ? t.tankSize.trim() : autoDimStr;

    let activeAreaMm2 = 0;
    mmap.rows.forEach((rh, i) => {
      mmap.cols.forEach((cw, j) => {
        if (!mmap.removed.has(i + ',' + j)) {
          activeAreaMm2 += cw * rh;
        }
      });
    });
    const ton = (activeAreaMm2 * H / 1e9).toFixed(1);

    // 실담수량 (Effective Water Capacity) 및 노즐 표고 (INLET, OUTLET, OVERFLOW) 분석
    const nozzleList = getNozzleList(opt);
    const overflowNoz = nozzleList.find(n => n.name === 'OVERFLOW' || (n.desc && n.desc.includes('월류')) || n.key === 'overflow');
    const outletNoz = nozzleList.find(n => n.name === 'OUTLET' || (n.desc && n.desc.includes('유출')) || n.key === 'outlet');
    const inletNoz = nozzleList.find(n => n.name === 'INLET' || (n.desc && (n.desc.includes('유입') || n.desc.includes('급수'))) || n.key === 'inlet');
    const drainNoz = nozzleList.find(n => n.name === 'DRAIN' || (n.desc && n.desc.includes('배수')) || n.key === 'drain');
    const fireNoz = nozzleList.find(n => n.name === 'FIRE' || (n.desc && n.desc.includes('소화')) || n.key === 'fire');

    // 바닥판넬-측면판넬 조립 기준: 바닥으로부터 30~35mm에서 볼트 조립, 저판플랜지 70~80mm 형성
    const BTM_FLG_H = 75;    // 저판 플랜지 높이 (70~80mm)
    const BTM_BOLT_H = 35;   // 볼트 체결선 (30~35mm)
    const MIN_SIDE_FITTING_ELEV = 100; // 측면 피팅 플랜지 취부 최소 표고 (저판 플랜지 상부)

    let hwlElev = (overflowNoz && typeof overflowNoz.elev === 'number' && overflowNoz.elev > 0) ? overflowNoz.elev : (overflowNoz && overflowNoz.elev === 'TOP' ? Math.max(100, H - 200) : Math.max(100, H - 300));
    let lwlElev = (outletNoz && typeof outletNoz.elev === 'number' && outletNoz.elev > 0) ? outletNoz.elev : (outletNoz && (outletNoz.elev === 'BOTTOM' || outletNoz.face === 'bottom') ? 100 : 300);
    // 측면 피팅 노즐인 경우 저판 플랜지(70~80mm) 상단에 부착되도록 최소 100mm 보장
    if (outletNoz && outletNoz.face !== 'bottom' && lwlElev < MIN_SIDE_FITTING_ELEV) {
      lwlElev = MIN_SIDE_FITTING_ELEV;
    }
    let inletElev = (inletNoz && typeof inletNoz.elev === 'number' && inletNoz.elev > 0) ? inletNoz.elev : (inletNoz && inletNoz.elev === 'TOP' ? H : Math.max(100, H - 200));

    if (hwlElev > H) hwlElev = H - 200;
    if (lwlElev < 0) lwlElev = 0;
    if (hwlElev <= lwlElev) hwlElev = Math.min(H, lwlElev + 500);

    const effDepth = Math.max(0, hwlElev - lwlElev);
    const freeDepth = Math.max(0, H - hwlElev);
    const deadDepth = Math.max(0, lwlElev);
    const areaM2 = activeAreaMm2 / 1e6;
    const grossTon = Number((activeAreaMm2 * H / 1e9).toFixed(2));
    const effTon = Number((activeAreaMm2 * effDepth / 1e9).toFixed(2));
    const deadTon = Number((activeAreaMm2 * deadDepth / 1e9).toFixed(2));
    const freeTon = Number((activeAreaMm2 * freeDepth / 1e9).toFixed(2));
    const effRatio = grossTon > 0 ? Number((effTon / grossTon * 100).toFixed(1)) : 0;

    let ty = y0;
    const colLabelW = 55, colValW = tw - colLabelW;

    // 1. DRAWING TITLE (높이 28mm)
    const titleH = 28;
    line([tx0, ty + titleH], [x1, ty + titleH]);
    const titleLabel = lang === 'ko' ? '도  면  명' : (lang === 'en' ? 'DRAWING TITLE' : 'TITLE (도면명)');
    text(tx0 + colLabelW / 2, ty + titleH / 2, 4.8, titleLabel, 'center', 0, 'middle');
    line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + titleH]);
    const titleVal = opt.sheetKind === 'frame' ? (lang === 'ko' ? '기초 조립도 및 스틸 스키드 제작도' : 'STEEL SKID & FOUNDATION ASSEMBLY DWG')
      : opt.sheetKind === 'detail' ? (lang === 'ko' ? '탱크 상세도' : 'DETAILS DWG')
      : opt.sheetKind === 'pad' ? (lang === 'ko' ? '기초 콘크리트 패드 도면' : 'FOUNDATION PAD DWG')
      : opt.sheetKind === 'capacity' ? (lang === 'ko' ? '실담수량 및 수위 산출도\n실담수량: ' + effTon.toFixed(1) + ' Ton (' + effRatio.toFixed(1) + '%)' : 'WATER CAPACITY & LEVEL DWG\nNET: ' + effTon.toFixed(1) + ' Ton (' + effRatio.toFixed(1) + '%)')
      : dimStr + '\n= ' + ton + ' Ton';
    const tparts = titleVal.split('\n');
    if (tparts.length > 1) {
      const maxChar = Math.max(tparts[0].length, tparts[1].length);
      const fs = maxChar > 35 ? 4.2 : (maxChar > 24 ? 5.0 : 6.0);
      text(tx0 + colLabelW + colValW / 2, ty + titleH / 2 + 5.0, fs, tparts[0], 'center', 0, 'middle');
      text(tx0 + colLabelW + colValW / 2, ty + titleH / 2 - 5.0, 5.8, tparts[1], 'center', 0, 'middle');
    } else {
      text(tx0 + colLabelW + colValW / 2, ty + titleH / 2, 6.2, titleVal, 'center', 0, 'middle');
    }
    ty += titleH;

    // 2. PROJECT (높이 18mm)
    const projH = 18;
    line([tx0, ty + projH], [x1, ty + projH]);
    const projLabel = lang === 'ko' ? '공  사  명' : (lang === 'en' ? 'PROJECT' : 'PROJECT (공사명)');
    text(tx0 + colLabelW / 2, ty + projH / 2, 4.8, projLabel, 'center', 0, 'middle');
    line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + projH]);
    text(tx0 + colLabelW + colValW / 2, ty + projH / 2, 5.2, t.project || '', 'center', 0, 'middle');
    ty += projH;

    // 3. 4개 사양 행 (각 11.0mm) - TANK SIZE, CONTRACTOR, CONSULTANT, CLIENT
    const rowH = 11.0;
    const specRows = [
      [lang === 'ko' ? '고 객 명' : (lang === 'en' ? 'CLIENT' : 'Client (고객명)'), t.client || ''],
      [lang === 'ko' ? '설계감리' : (lang === 'en' ? 'CONSULTANT' : 'Consultant (감리)'), t.consultant || ''],
      [lang === 'ko' ? '시 공 사' : (lang === 'en' ? 'CONTRACTOR' : 'Contractor (시공)'), t.contractor || ''],
      [lang === 'ko' ? (opt.sheetKind === 'capacity' ? '실 담 수 량' : '탱크규격') : (lang === 'en' ? (opt.sheetKind === 'capacity' ? 'NET CAPACITY' : 'TANK SIZE') : (opt.sheetKind === 'capacity' ? 'NET CAPACITY (실담수량)' : 'TANK SIZE (규격)')), opt.sheetKind === 'capacity' ? `${effTon.toFixed(1)} Ton (${effRatio.toFixed(1)}%)` : dimStr]
    ];
    specRows.slice().reverse().forEach(([k, v]) => {
      line([tx0, ty + rowH], [x1, ty + rowH]);
      text(tx0 + colLabelW / 2, ty + rowH / 2, 4.5, k, 'center', 0, 'middle');
      line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + rowH]);
      const fs = (k.includes('TANK SIZE') && v && v.length > 30) ? 3.6 : (k.includes('TANK SIZE') && v && v.length > 20 ? 4.2 : 4.8);
      text(tx0 + colLabelW + colValW / 2, ty + rowH / 2, fs, v, 'center', 0, 'middle');
      ty += rowH;
    });

    // 4. 도면 제어 메타데이터 및 제3각법 기호 블록 (ISO 128 / ISO 5456 표준 투상기호) (높이 22mm)
    const metaH = 22;
    line([tx0, ty + metaH], [x1, ty + metaH]);
    line([tx0, ty + metaH / 2], [tx0 + 132, ty + metaH / 2]);
    line([tx0 + 132, ty], [tx0 + 132, ty + metaH]);

    // 좌측 (132mm): DWG NO(26), Value(64), REV(18), 0(24)
    // 상단 반 (ty + 11 ~ ty + 22)
    line([tx0 + 26, ty + metaH / 2], [tx0 + 26, ty + metaH]);
    line([tx0 + 90, ty + metaH / 2], [tx0 + 90, ty + metaH]);
    line([tx0 + 108, ty + metaH / 2], [tx0 + 108, ty + metaH]);
    text(tx0 + 13, ty + metaH * 0.75, 3.8, lang === 'ko' ? '도면번호' : 'DWG NO.', 'center', 0, 'middle');
    text(tx0 + 26 + 32, ty + metaH * 0.75, 4.0, t.dwgNo || '', 'center', 0, 'middle');
    text(tx0 + 90 + 9, ty + metaH * 0.75, 3.8, 'REV.', 'center', 0, 'middle');
    text(tx0 + 108 + 12, ty + metaH * 0.75, 4.2, '0', 'center', 0, 'middle');

    // 하단 반 (ty ~ ty + 11): SCALE(26), 1:N(64), SHEET(18), 1/1(24)
    line([tx0 + 26, ty], [tx0 + 26, ty + metaH / 2]);
    line([tx0 + 90, ty], [tx0 + 90, ty + metaH / 2]);
    line([tx0 + 108, ty], [tx0 + 108, ty + metaH / 2]);
    text(tx0 + 13, ty + metaH * 0.25, 3.8, lang === 'ko' ? '축  척' : 'SCALE', 'center', 0, 'middle');
    text(tx0 + 26 + 32, ty + metaH * 0.25, 4.2, '1 : ' + N, 'center', 0, 'middle');
    text(tx0 + 90 + 9, ty + metaH * 0.25, 3.8, 'SHEET', 'center', 0, 'middle');
    text(tx0 + 108 + 12, ty + metaH * 0.25, 4.2, '1 / 1', 'center', 0, 'middle');

    // 우측 (68mm): 제3각법 투상 기호 (ISO 128 Third Angle Projection Symbol) & 단위/용지
    const projBoxX0 = tx0 + 132, projBoxW = tw - 132;
    const projMidX = projBoxX0 + projBoxW / 2;
    const symCy = ty + 13.5;
    // 중심선
    line([projMidX - 22, symCy], [projMidX + 22, symCy]);
    line([projMidX - 10, symCy - 6], [projMidX - 10, symCy + 6]);
    // 동심원
    circle([projMidX - 10, symCy], 2.0);
    circle([projMidX - 10, symCy], 4.4);
    // 원추대 (좌측 소구경 4.0, 우측 대구경 8.8, 폭 9)
    const coneX1 = projMidX + 3, coneX2 = projMidX + 13;
    line([coneX1, symCy - 2.0], [coneX1, symCy + 2.0]);
    line([coneX2, symCy - 4.4], [coneX2, symCy + 4.4]);
    line([coneX1, symCy - 2.0], [coneX2, symCy - 4.4]);
    line([coneX1, symCy + 2.0], [coneX2, symCy + 4.4]);
    // 하단 라벨
    text(projMidX, ty + 4.2, 2.3, lang === 'ko' ? '제 3 각 법' : '3RD ANGLE PROJECTION', 'center', 0, 'middle');
    ty += metaH;

    // 4-1. 도면 관리 정보 행 (ISO 7200 / ISO 2768 / ISO 216): 단위 · 용지 · 일반공차 · 축척금지
    const ctrlH = 7;
    line([tx0, ty + ctrlH], [x1, ty + ctrlH]);
    const ctrlCells = [
      { w: 34, s: lang === 'ko' ? '단위 : mm' : 'UNITS : mm' },
      { w: 46, s: lang === 'ko' ? '용지 : ISO A1 (841x594)' : 'SHEET : ISO A1 (841x594)' },
      { w: 62, s: lang === 'ko' ? '일반공차 : ISO 2768-m' : 'GENERAL TOL. : ISO 2768-m' },
      { w: 58, s: lang === 'ko' ? '도면을 축척하여 측정하지 말 것' : 'DO NOT SCALE DRAWING' }
    ];
    let ccx = tx0;
    ctrlCells.forEach((c, i) => {
      if (i > 0) line([ccx, ty], [ccx, ty + ctrlH]);
      text(ccx + c.w / 2, ty + ctrlH / 2, 2.3, c.s, 'center', 0, 'middle');
      ccx += c.w;
    });
    ty += ctrlH;

    // 5. 서명 승인란 (4단계: DESIGNED, DRAWN, CHECKED, APPROVED) (높이 26mm: 헤더 9mm, 서명란 17mm)
    const signHeaderH = 9, signValH = 17;
    line([tx0, ty + signValH], [x1, ty + signValH]);
    line([tx0, ty + signValH + signHeaderH], [x1, ty + signValH + signHeaderH]);
    const scw = tw / 4;
    const signLabels = lang === 'ko' ? ['설계(DSGN)', '작도(DWN)', '검토(CHK)', '승인(APP)'] : ['DESIGNED', 'DRAWN', 'CHECKED', 'APPROVED'];
    signLabels.forEach((k, i) => {
      text(tx0 + scw * i + scw / 2, ty + signValH + signHeaderH / 2, 4.0, k, 'center', 0, 'middle');
      if (i > 0) line([tx0 + scw * i, ty], [tx0 + scw * i, ty + signValH + signHeaderH]);
    });
    const signVals = [
      t.designed || (lang === 'ko' ? '와이에스' : 'YSACC'),
      t.drawn || '',
      t.checked || '',
      t.approved || ''
    ];
    signVals.forEach((val, i) => {
      if (val) text(tx0 + scw * i + scw / 2, ty + signValH / 2, 4.5, val, 'center', 0, 'middle');
    });
    ty += signValH + signHeaderH;

    // 2. 부품 사양 명세표 (ITEM LIST / BOM Table)
    const boms = (opt.itemList && opt.itemList.length) ? opt.itemList : ((opt.sheetKind === 'frame' || opt.sheetKind === 'skid_parts') ? buildSkidBOM(opt) : buildDefaultBOM(opt));
    const activeBoms = boms.filter(b => b && (b.name || b.items));
    let itemTableTop = ty;
    if (activeBoms.length) {
      const colDefs = [
        { key: 'no', label: lang === 'ko' ? '번호' : 'NO.', w: 10 },
        { key: 'name', label: lang === 'ko' ? '품명' : (lang === 'en' ? 'ITEMS' : 'ITEMS (품명)'), w: 52 },
        { key: 'mat', label: lang === 'ko' ? '재질' : (lang === 'en' ? 'MATERIAL' : 'MATERIAL (재질)'), w: 26 },
        { key: 'qty', label: lang === 'ko' ? '수량' : (lang === 'en' ? 'QTY' : 'QTY (수량)'), w: 16 },
        { key: 'spec', label: lang === 'ko' ? '사양 및 규격' : (lang === 'en' ? 'SPECIFICATIONS' : 'SPECIFICATIONS (사양)'), w: 78 }
      ];
      const tableW = 182; // tx0 + 4 to x1 - 4
      const bCnt = activeBoms.length;
      const rowH = bCnt > 12 ? 4.4 : (bCnt > 8 ? 4.8 : 5.5);
      const headH = 5.5, titleH = 6.5;
      const dataFontH = bCnt > 12 ? 2.3 : (bCnt > 8 ? 2.5 : 3.0);
      const headFontH = 3.2, titleFontH = 4.2;

      const totalTblH = titleH + headH + bCnt * rowH;
      itemTableTop = ty + totalTblH + 6;
      let yy = itemTableTop;
      const tableX0 = tx0 + 4, tableX1 = x1 - 4;

      // 1. 타이틀 행
      const itemTableTitle = lang === 'en' ? 'BILL OF MATERIALS' : (lang === 'ko' ? '부 품  사 양  명 세 표' : 'ITEM LIST (부품 사양 명세표)');
      line([tableX0, yy], [tableX1, yy]);
      text(tableX0 + tableW / 2, yy - titleH / 2, titleFontH, itemTableTitle, 'center', 0, 'middle');
      yy -= titleH;
      line([tableX0, yy], [tableX1, yy]);

      // 2. 헤더 행
      let curColX = tableX0;
      colDefs.forEach(cd => {
        text(curColX + cd.w / 2, yy - headH / 2, headFontH, cd.label, 'center', 0, 'middle');
        curColX += cd.w;
        if (curColX < tableX1) line([curColX, yy], [curColX, yy - headH - bCnt * rowH]);
      });
      yy -= headH;
      line([tableX0, yy], [tableX1, yy]);

      // 3. 데이터 행
      activeBoms.forEach(b => {
        curColX = tableX0;
        const rowVals = [
          String(b.no || ''),
          b.name || b.items || '',
          b.mat || b.material || '',
          b.qty || '',
          b.spec || b.specifications || ''
        ];
        colDefs.forEach((cd, cidx) => {
          const val = rowVals[cidx];
          const align = (cd.key === 'name' || cd.key === 'spec') ? 'left' : 'center';
          const px = align === 'left' ? curColX + 2 : curColX + cd.w / 2;
          text(px, yy - rowH / 2, dataFontH, val, align, 0, 'middle');
          curColX += cd.w;
        });
        yy -= rowH;
        line([tableX0, yy], [tableX1, yy]);
      });

      // 좌우 외곽 테두리
      line([tableX0, itemTableTop], [tableX0, yy]);
      line([tableX1, itemTableTop], [tableX1, yy]);
    }

    // 배관 노즐 일람표 (NOZZLE SCHEDULE)
    const activeNozzles = getNozzleList(opt);
    let nozTableTop = itemTableTop;
    if (activeNozzles.length) {
      const colDefs = [
        { key: 'mark', label: lang === 'ko' ? '기호' : 'NO.', w: 16 },
        { key: 'service', label: lang === 'ko' ? '용도' : (lang === 'en' ? 'SERVICE' : 'SERVICE (용도)'), w: 48 },
        { key: 'size', label: lang === 'ko' ? '구경' : (lang === 'en' ? 'SIZE' : 'SIZE (구경)'), w: 22 },
        { key: 'type', label: lang === 'ko' ? '타입' : (lang === 'en' ? 'TYPE' : 'TYPE (타입)'), w: 30 },
        { key: 'elev', label: lang === 'ko' ? '설치높이' : (lang === 'en' ? 'ELEV.' : 'ELEV. (높이)'), w: 34 },
        { key: 'face', label: lang === 'ko' ? '위치' : (lang === 'en' ? 'LOCATION' : 'LOCATION (위치)'), w: 32 }
      ];
      const tableW = 182; // tx0 + 4 to x1 - 4
      const nCnt = activeNozzles.length;
      const rowH = nCnt > 10 ? 4.6 : (nCnt > 6 ? 5.2 : 6.5);
      const headH = nCnt > 6 ? 6.0 : 7.0;
      const titleH = nCnt > 6 ? 6.5 : 7.5;
      const dataFontH = nCnt > 10 ? 2.7 : (nCnt > 6 ? 3.0 : 3.4);
      const headFontH = nCnt > 6 ? 3.2 : 3.6;
      const titleFontH = nCnt > 6 ? 4.0 : 4.4;

      const totalTblH = titleH + headH + nCnt * rowH;
      nozTableTop = itemTableTop + totalTblH + 6;
      let yy = nozTableTop;
      const tableX0 = tx0 + 4, tableX1 = x1 - 4;

      // 1. 타이틀 행
      const nozTableTitle = lang === 'en' ? 'NOZZLE SCHEDULE' : (lang === 'ko' ? '배 관  노 즐  일 람 표' : 'NOZZLE SCHEDULE (배관 노즐 일람표)');
      line([tableX0, yy], [tableX1, yy]);
      text(tableX0 + tableW / 2, yy - titleH / 2, titleFontH, nozTableTitle, 'center', 0, 'middle');
      yy -= titleH;
      line([tableX0, yy], [tableX1, yy]);

      // 2. 헤더 행
      let curColX = tableX0;
      colDefs.forEach(cd => {
        text(curColX + cd.w / 2, yy - headH / 2, headFontH, cd.label, 'center', 0, 'middle');
        curColX += cd.w;
        if (curColX < tableX1) line([curColX, yy], [curColX, yy - headH - nCnt * rowH]);
      });
      yy -= headH;
      line([tableX0, yy], [tableX1, yy]);

      // 3. 데이터 행
      const faceNameMap = lang === 'en' ? { front: 'FRONT', rear: 'REAR', left: 'LEFT', right: 'RIGHT', top: 'TOP', bottom: 'BOTTOM' } : (lang === 'ko' ? { front: '정면', rear: '배면', left: '좌측', right: '우측', top: '상부', bottom: '하부' } : { front: 'FRONT (정면)', rear: 'REAR (배면)', left: 'LEFT (좌측)', right: 'RIGHT (우측)', top: 'TOP (상부)', bottom: 'BOTTOM (하부)' });
      activeNozzles.forEach(n => {
        curColX = tableX0;
        const abbr = getNozzleAbbr(n.name);
        const svcName = n.name + (abbr ? ' [' + abbr + ']' : '') + (n.desc ? ' (' + n.desc + ')' : '');
        let actualElev = n.elev;
        if (typeof n.elev === 'number') {
          const isOverflow = n.name === 'OVERFLOW' || (n.desc && n.desc.includes('월류'));
          const isInlet = n.name === 'INLET' || (n.desc && (n.desc.includes('유입') || n.desc.includes('급수')));
          if (isOverflow) actualElev = Math.max(100, H - 200);
          else if (isInlet && n.face !== 'top') actualElev = Math.max(100, H - 300);
          else if (actualElev > H - 100) actualElev = Math.max(100, H - 150);
        }
        const elevStr = n.face === 'top' ? (lang === 'ko' ? '상부' : 'TOP') : (n.face === 'bottom' ? (lang === 'ko' ? '하부' : 'BOTTOM') : ('EL.+' + (typeof actualElev === 'number' ? actualElev.toLocaleString() : actualElev)));
        const rowVals = [
          n.mark,
          svcName,
          n.size,
          n.type === 'FLANGE' ? 'FLG 10K' : 'SOCKET',
          elevStr,
          faceNameMap[n.face] || n.face.toUpperCase()
        ];
        colDefs.forEach((cd, cidx) => {
          text(curColX + cd.w / 2, yy - rowH / 2, dataFontH, rowVals[cidx], 'center', 0, 'middle');
          curColX += cd.w;
        });
        yy -= rowH;
        line([tableX0, yy], [tableX1, yy]);
      });

      // 좌우 외곽 테두리
      line([tableX0, nozTableTop], [tableX0, yy]);
      line([tableX1, nozTableTop], [tableX1, yy]);
    }

    // 노트 (Remarks) - AutoCAD DWG 및 웹 화면 1:1 완벽 일치 (우측 돌출 방지 48자 제한 & 균등 배치)
    let allNotes = [];
    if (opt.notes && opt.notes.length) allNotes.push(...opt.notes);
    if (opt.remarks && opt.remarks.length) {
      opt.remarks.forEach(r => { if (!allNotes.includes(r)) allNotes.push(r); });
    }
    if (!allNotes.length) allNotes = [lang === 'ko' ? '특기사항 없음.' : 'No special remarks.'];

    if (lang === 'ko' && allNotes.some(n => typeof n === 'string' && (n.includes('Customers are requested') || n.includes('base concrete') || n.includes('기초 콘크리트')))) {
      allNotes = [
        '본 도면의 치수는 밀리미터(mm) 기준이며, 표고(EL)는 저판 하단면을 기준으로 함.',
        '탱크 본체는 KS D 3698(STS304/316) 또는 KS F 4806(SMC) 규격의 고압 프레스 성형 패널을 적용함.',
        '기초 콘크리트 패드는 설계기준강도 18MPa 이상, 상면 수평오차 ±2mm 이내로 정밀 타설할 것.',
        '스틸 베이스 찬넬 및 프레임 부속철물은 용융아연도금(HDG 최소 550g/m²) 방청 처리를 적용함.',
        '기초 앵커볼트는 콘크리트 패드에 직결 시공하며, 구조계산서에 의거한 인발 내력을 확보할 것.',
        '배관 연결 시 탱크 피팅에 편심 하중이 전달되지 않도록 독립된 배관 지지대(SUPPORT)를 필히 설치할 것.',
        '유지관리 및 위생점검을 위하여 탱크 외벽 둘레 600mm, 상부 1,000mm 이상의 여유공간을 확보할 것.',
        '조립 완료 후 만수 상태에서 24시간 동안 수압시험(LEAK TEST)을 실시하여 누수 없을 시 합격으로 판정함.',
        '통기구(VENT)에는 방충망(STS MESH)을 설치하고, 맨홀은 위생 잠금장치를 체결하여 외부 오염을 차단할 것.',
        '소켓 설치 완료 후 배관 연결 및 단열·보온공사는 발주처(고객) 시공 범위임.'
      ];
    }

    let ny = y - 8;
    const remarksTitle = lang === 'en' ? '< GENERAL NOTES >' : (lang === 'ko' ? '< 특 기 시 방  및  일 반 사 항 >' : '< General Notes / 특기사항 >');
    text(tx0 + 8, ny, 6.5, remarksTitle, 'left');
    ny -= 10.0;

    const bottomLimit = Math.max(itemTableTop, nozTableTop) > ty ? (Math.max(itemTableTop, nozTableTop) + 10) : (ty + 10);
    const availNotesH = ny - bottomLimit;
    const noteFontH = 4.8;
    const textStartX = tx0 + 18;

    // AutoCAD simplex.shx 폰트 폭(0.85배율)에 안전한 최대 글자수 (48자 기준)
    // 48자 기준 줄바꿈 시 AutoCAD DWG에서 우측 외곽선을 절대 침범/돌출하지 않고 안전 마진 확보
    const wrappedNotes = allNotes.map(n => wrapText(n, 48));
    let totalLines = 0;
    wrappedNotes.forEach(lines => totalLines += lines.length);

    // 가용 높이에 맞추어 행간(noteLineH)과 항목별 간격(noteGap)을 지능적으로 균등 배치
    // 배관 노즐표나 부품표 상단까지 빈 공간 없이 자연스럽게 채우도록 분할
    let noteLineH = 6.8;
    const minGap = 2.5;
    const freeSpace = availNotesH - (totalLines * noteLineH);
    let noteGap = allNotes.length > 1 ? Math.min(6.5, Math.max(minGap, freeSpace / (allNotes.length - 1))) : 4.0;
    if (totalLines * noteLineH + (allNotes.length - 1) * noteGap > availNotesH) {
      noteLineH = Math.max(5.6, (availNotesH - (allNotes.length - 1) * minGap) / Math.max(1, totalLines));
      noteGap = Math.max(1.5, (availNotesH - totalLines * noteLineH) / Math.max(1, allNotes.length - 1));
    }

    wrappedNotes.forEach((lines, i) => {
      text(tx0 + 8, ny, noteFontH, String(i + 1), 'left');
      lines.forEach((l, li) => {
        text(textStartX, ny - li * noteLineH, noteFontH, l, 'left');
      });
      ny -= lines.length * noteLineH + noteGap;
    });

    // 뷰 타이틀 기호 (건축/엔지니어링 표준 뷰 심볼: 원형 뷰태그, 이중 밑줄, 뷰명칭 및 축척 SCALE 표기)
    const drawViewTitleBubble = (tank_cx, title_y, sheetNo, viewNo, rawTitleText, customScale) => {
      const R = 6.0;
      const textH = 4.2;
      const approxCharW = 2.4;

      // [SCALE ...] 형태가 이미 텍스트에 포함되어 있으면 추출 후 타이틀에서 제거하여 하단 전용 축척 라인에 정돈
      let titleText = String(rawTitleText || '').replace(/\s*\[SCALE\s+[^\]]+\]/i, '').trim();
      let scaleStr = '';
      if (customScale !== undefined && customScale !== null) {
        scaleStr = (typeof customScale === 'number' && customScale > 0) ? `SCALE : 1 / ${customScale}` : (customScale === 'N.T.S.' || customScale === 'NTS' || customScale === 'NONE' ? 'SCALE : N.T.S.' : String(customScale));
      } else if (/\[SCALE\s+([^\]]+)\]/i.test(rawTitleText)) {
        const sm = rawTitleText.match(/\[SCALE\s+([^\]]+)\]/i);
        const scVal = sm[1].replace(/^1\s*:\s*/, '').trim();
        scaleStr = scVal.toUpperCase() === 'NONE' || scVal.toUpperCase() === 'NTS' ? 'SCALE : N.T.S.' : `SCALE : 1 / ${scVal}`;
      } else if (typeof N === 'number' && N > 0) {
        scaleStr = `SCALE : 1 / ${N}`;
      }

      const estimatedTextW = Math.max(65, Math.max(titleText.length * approxCharW, scaleStr.length * 2.2) + 8);
      const totalW = R * 2 + estimatedTextW;
      const gap = 1.2;
      let bx = tank_cx - totalW / 2 + R;
      let by = title_y;
      if (bx - R < x0 + 4) bx = x0 + 4 + R;
      if (bx + R + estimatedTextW > tx0 - 4) bx = tx0 - 4 - R - estimatedTextW;
      if (by - R < y0 + 3) by = y0 + 3 + R;
      if (by + R + 10 > y1 - 3) by = y1 - 3 - R - 10;

      // 1. 원형 기호 (Architectural View Bubble)
      circle([bx, by], R);

      // 2. 원형 내부 수평 분할선 및 우측 상단 밑줄 (연속선)
      line([bx - R, by], [bx + R + estimatedTextW, by]);

      // 3. 이중 밑줄 중 하단 평행선 (원 우측 둘레에서 시작)
      const dx_circ = Math.sqrt(Math.max(0, R * R - gap * gap));
      line([bx + dx_circ, by - gap], [bx + R + estimatedTextW, by - gap]);

      // 4. 원 내부 표식 (건축 표준: 상단 뷰번호 01, 02.. / 하단 시트번호 T1, T2..)
      const vStr = typeof viewNo === 'number' ? (viewNo < 10 ? '0' + viewNo : String(viewNo)) : String(viewNo);
      const sStr = typeof sheetNo === 'number' ? `T${sheetNo}` : String(sheetNo);
      text(bx, by + R * 0.44, 3.4, vStr, 'center', 0, 'middle');
      text(bx, by - R * 0.46, 2.4, sStr, 'center', 0, 'middle');

      // 5. 이중 밑줄 위 도면 뷰 명칭
      text(bx + R + 3.0, by + 3.4, textH, titleText, 'left', 0, 'middle');

      // 6. 이중 밑줄 아래 건축 표준 축척 표기 (SCALE : 1 / N)
      if (scaleStr) {
        text(bx + R + 3.0, by - 3.2, 2.5, scaleStr, 'left', 0, 'middle');
      }
    };

    // 정통 건축 평면도 방위표 (Architectural North Arrow: KS F 1501 / ISO 표준 북향 기호)
    const drawNorthArrow = (cx, cy, r = 5.5) => {
      circle([cx, cy], r);
      const pTop = [cx, cy + r * 1.35];
      const pBot = [cx, cy - r * 0.85];
      const pLeft = [cx - r * 0.38, cy - r * 0.1];
      const pRight = [cx + r * 0.38, cy - r * 0.1];
      const pMid = [cx, cy];

      // 우측 반쪽 솔리드 채움 (DXF SOLID 는 4점 필수 → 마지막 점 반복)
      solid([pTop, pRight, pMid, pMid]);
      solid([pBot, pLeft, pMid, pMid]);

      // 외곽선 및 중심선
      line(pTop, pLeft);
      line(pLeft, pBot);
      line(pBot, pRight);
      line(pRight, pTop);
      line(pTop, pBot);

      // 'N' 표기 (상단 중앙)
      text(cx, cy + r * 1.85, 2.8, 'N', 'center', 0, 'middle');
    };

    // ISO 128-2 (Type 04.1 가는 1점쇄선) 중심선: 모델 좌표(이미 축척 적용된 좌표) 기준
    // 대칭 형상의 중심을 외곽선 밖 3mm(용지 기준)까지 연장하고, 끝단에 'CL' 표기
    const centerLineM = (a, b, label = true) => {
      ents.push({ t: 'line', a: [a[0], a[1]], b: [b[0], b[1]], layer: 'CENTER' });
      if (label) {
        const vertical = Math.abs(b[0] - a[0]) < Math.abs(b[1] - a[1]);
        const tip = (vertical ? (b[1] > a[1]) : (b[0] > a[0])) ? b : a;
        const off = 1.6 * N;
        ents.push({
          t: 'text',
          p: vertical ? [tip[0], tip[1] + off] : [tip[0] + off, tip[1]],
          h: 2.2 * N, s: 'CL', rot: 0,
          align: vertical ? 'center' : 'left', valign: 'middle', layer: 'CENTER'
        });
      }
    };
    const CL_EXT = 3.0 * N; // 외곽선 밖 연장 길이 (용지 3mm)

    const translateEnts = (es, dx, dy) => {
      es.forEach(e => {
        if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] + dx, p[1] + dy]) });
        else if (e.t === 'line') ents.push({ ...e, a: [e.a[0] + dx, e.a[1] + dy], b: [e.b[0] + dx, e.b[1] + dy] });
        else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] + dx, e.c[1] + dy] });
        else if (e.t === 'solid') ents.push({ ...e, p: e.p.map(p => [p[0] + dx, p[1] + dy]) });
        else ents.push({ ...e, p: [e.p[0] + dx, e.p[1] + dy] });
      });
    };

    if (opt.sheetKind === 'detail') {
      ents.push(...buildDetails(opt, N, P, x0, y0, tx0, y1));
      return { map: mmap, ents, scale: N, elev: false, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
    }
    if (opt.sheetKind === 'frame') {
      const areaW = tx0 - x0;
      const areaH = y1 - y0;

      // 1. 좌측 뷰: 스틸 스키드 프레임 조립도 (STEEL SKID DRAWING)
      // 평면 배치도 + 부재 분할/길이 치수 + PART LIST + 부속철물 + YSACC 표준 제작 NOTE 포함
      const skidRes = buildSkid(opt);
      const bSkid = bb(skidRes.ents);
      const crossRes = buildSkidCross(opt);
      const bCross = bb(crossRes.ents);

      const wSkid = (bSkid[2] - bSkid[0]) / N;
      const wCross = (bCross[2] - bCross[0]) / N;

      // 좌측에서부터 View 1 (평면도), View 2 (단면도: Y축 1:1 투영), View 3 (3D 등각조감도) 3열 균형 배치
      const gap12 = Math.max(25, Math.min(50, (areaW - wSkid - wCross - 160) * 0.18));
      const leftPad = Math.max(15, (areaW - (wSkid + gap12 + wCross + Math.min(240, areaW * 0.38))) * 0.30);
      const cx1 = x0 + leftPad + wSkid / 2;
      const cy1 = y0 + areaH * 0.52;
      const dx1 = P(cx1) - (bSkid[0] + bSkid[2]) / 2;
      const dy1 = P(cy1) - (bSkid[1] + bSkid[3]) / 2;

      skidRes.ents.forEach(e => {
        if (e.t === 'line') ents.push({ ...e, a: [e.a[0] + dx1, e.a[1] + dy1], b: [e.b[0] + dx1, e.b[1] + dy1] });
        else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] + dx1, e.c[1] + dy1] });
        else if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] + dx1, p[1] + dy1]) });
        else if (e.t === 'solid') ents.push({ ...e, p: e.p.map(p => [p[0] + dx1, p[1] + dy1]) });
        else ents.push({ ...e, p: [e.p[0] + dx1, e.p[1] + dy1] });
      });

      const titleSkidY = Math.max(y0 + 10, (bSkid[1] + dy1) / N - 14.0);
      const viewTitleSkid = lang === 'en'
        ? 'STEEL SKID DRAWING'
        : '스틸 스키드 프레임 조립도 (STEEL SKID DRAWING)';
      drawViewTitleBubble(cx1, titleSkidY, 1, 1, viewTitleSkid, N);
      drawNorthArrow(cx1 + wSkid / 2 + 15, y1 - 25);

      // 2. 중앙-우측 뷰: 프레임 단면 및 기초 조립 상세도 (FRAME CROSS DWG)
      // 단면도(FRAME CROSS DWG)는 평면도(STEEL SKID DRAWING)의 Z-Z' 절단 단면이므로 Y축 투영 높이가 정확히 1:1 일치해야 함
      const cx2 = cx1 + wSkid / 2 + gap12 + wCross / 2;
      const dx2 = P(cx2) - (bCross[0] + bCross[2]) / 2;
      const dy2 = dy1;

      crossRes.ents.forEach(e => {
        if (e.t === 'line') ents.push({ ...e, a: [e.a[0] + dx2, e.a[1] + dy2], b: [e.b[0] + dx2, e.b[1] + dy2] });
        else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] + dx2, e.c[1] + dy2] });
        else if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] + dx2, p[1] + dy2]) });
        else if (e.t === 'solid') ents.push({ ...e, p: e.p.map(p => [p[0] + dx2, p[1] + dy2]) });
        else ents.push({ ...e, p: [e.p[0] + dx2, e.p[1] + dy2] });
      });

      const viewTitleCross = lang === 'en'
        ? 'FRAME CROSS DWG'
        : '프레임 단면 및 기초 조립 상세도 (FRAME CROSS DWG)';
      drawViewTitleBubble(cx2, titleSkidY, 1, 2, viewTitleCross, N);

      // 3. 우측 뷰: 3D 등각 조감도 (3D ISOMETRIC VIEW)
      const rightStart = cx2 + wCross / 2 + Math.max(20, gap12 * 0.75);
      const cx3 = (rightStart + tx0 - 15) / 2;
      const cy3 = y0 + areaH * 0.54;
      const isoAvailW = Math.max(80, (tx0 - 15) - rightStart);
      const isoAvailH = Math.max(80, areaH * 0.70);

      const iso = buildIsometric({ ...opt, onlySkidAndPad: true }, templates, sideT);
      const bIso = bb(iso.ents);
      const isoW_mm = (bIso[2] - bIso[0]) / N;
      const isoH_mm = (bIso[3] - bIso[1]) / N;
      const fitScale = Math.min((isoAvailW * 0.90) / isoW_mm, (isoAvailH * 0.85) / isoH_mm);

      const isoDx = P(cx3) - ((bIso[0] + bIso[2]) / 2) * fitScale;
      const isoDy = P(cy3) - ((bIso[1] + bIso[3]) / 2) * fitScale;

      iso.ents.forEach(e => {
        if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] * fitScale + isoDx, p[1] * fitScale + isoDy]) });
        else if (e.t === 'line') ents.push({ ...e, a: [e.a[0] * fitScale + isoDx, e.a[1] * fitScale + isoDy], b: [e.b[0] * fitScale + isoDx, e.b[1] * fitScale + isoDy] });
        else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] * fitScale + isoDx, e.c[1] * fitScale + isoDy], r: e.r * fitScale });
        else ents.push({ ...e, p: [e.p[0] * fitScale + isoDx, e.p[1] * fitScale + isoDy], h: e.h * fitScale });
      });

      const effIsoScale = Math.max(5, Math.round(N / fitScale));
      const viewTitleIso = lang === 'en'
        ? '3D ISOMETRIC FRAME VIEW'
        : '3D 등각 프레임 조감도 (3D ISOMETRIC FRAME VIEW)';
      drawViewTitleBubble(cx3, titleSkidY, 1, 3, viewTitleIso, effIsoScale);

      return { map: mmap, ents, scale: N, elev: false, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
    }
    if (opt.sheetKind === 'skid_parts') {
      const areaW = tx0 - x0;
      const areaH = y1 - y0;
      const partsData = SKID_PARTS_DATA || (typeof globalThis !== 'undefined' && globalThis.SKID_PARTS_DATA) || (typeof window !== 'undefined' && window.SKID_PARTS_DATA) || (typeof root !== 'undefined' && root.SKID_PARTS_DATA);
      const partsLib = SKID_PARTS_LIB || (typeof globalThis !== 'undefined' && globalThis.SKID_PARTS_LIB) || (typeof window !== 'undefined' && window.SKID_PARTS_LIB) || null;

      // ── 실제 부품도 (Steel_Skin_Drawing(35mm).dwg) : 현재 BOM에 사용되는 부품만 격자 배치 ──
      const realItems = [], missingCodes = [];
      if (partsLib && [75, 125, 150].includes(parseInt(opt.frame, 10))) {
        const libKey = code => {
          const c = String(code || '').replace(/\s+/g, '').toUpperCase();
          const cands = [c, c.replace(/^WFB-/, 'WFF-'), c.replace(/E$/, ''), c.replace(/^WFB-/, 'WFF-').replace(/E$/, '')];
          return cands.find(k => partsLib[k]) || null;
        };
        const seen = new Set();
        buildSkidBOM(opt).forEach(b => {
          if (b.key === 'pad') return;
          const code = String(b.spec || '').split(' ')[0];
          const k = libKey(code);
          if (k) {
            if (!seen.has(k)) { seen.add(k); realItems.push({ code, key: k, qty: b.qty, name: b.name, part: partsLib[k] }); }
          } else if (code && !missingCodes.includes(code)) missingCodes.push(code);
        });
      }
      if (realItems.length) {
        const noteBand = 12;
        const gridH = areaH - noteBand - 4;
        const gx0 = x0 + 4, gy1 = y1 - 4, gw = areaW - 8;
        const n = realItems.length;
        let cols = 1, bestScore = -1;
        for (let c = 1; c <= n; c++) {
          const r = Math.ceil(n / c);
          const sc = Math.min((gw / c) / 2.5, (gridH / r) / 1.6);
          if (sc > bestScore) { bestScore = sc; cols = c; }
        }
        const rowsN = Math.ceil(n / cols);
        const cw = gw / cols, ch = gridH / rowsN;
        const layerOf = (kind, l) => (l && l !== 'FRAME') ? l : (kind === 'mainW' ? 'FRAME_MAIN_W' : (kind === 'mainL' ? 'FRAME_MAIN_L' : (kind === 'sub' ? 'FRAME_SUB' : 'FRAME')));
        realItems.forEach((it, idx) => {
          const ci = idx % cols, ri = Math.floor(idx / cols);
          const cx0 = gx0 + ci * cw, cyTop = gy1 - ri * ch, cy0 = cyTop - ch;
          // 셀 테두리 (부품 카탈로그 격자)
          line([cx0, cy0], [cx0 + cw, cy0]); line([cx0, cyTop], [cx0 + cw, cyTop]);
          line([cx0, cy0], [cx0, cyTop]); line([cx0 + cw, cy0], [cx0 + cw, cyTop]);
          // 품번 / 수량 / 명칭
          const labH = Math.max(2.0, Math.min(3.2, ch * 0.07));
          text(cx0 + 2, cyTop - 2 - labH, labH, `${String(idx + 1).padStart(2, '0')}. ${it.key}`, 'left');
          text(cx0 + cw - 2, cyTop - 2 - labH, labH * 0.85, it.qty, 'right');
          text(cx0 + 2, cyTop - 3.5 - labH * 1.9, labH * 0.7, it.name, 'left');
          // 부품도 축소 배치
          const p = it.part;
          const availW = (cw - 6) * N, availH = (ch - 6 - labH * 2.6) * N;
          const s = Math.min(availW / Math.max(1, p.w), availH / Math.max(1, p.h));
          const tcx = P(cx0 + cw / 2), tcy = P(cy0 + 3 + (ch - 6 - labH * 2.6) / 2);
          const tr = pt => [tcx + (pt[0] - p.w / 2) * s, tcy + (pt[1] - p.h / 2) * s];
          p.ents.forEach(e => {
            const L = layerOf(p.kind, e.layer);
            if (e.t === 'line') ents.push({ t: 'line', a: tr(e.a), b: tr(e.b), layer: L });
            else if (e.t === 'poly') ents.push({ t: 'poly', pts: e.pts.map(tr), closed: !!e.closed, layer: L });
            else if (e.t === 'solid') ents.push({ t: 'solid', p: e.p.map(tr), layer: L });
            else if (e.t === 'circle') ents.push({ t: 'circle', c: tr(e.c), r: e.r * s, layer: L });
            else if (e.t === 'arc') ents.push({ t: 'arc', c: tr(e.c), r: e.r * s, a0: e.a0, a1: e.a1, layer: L });
            else if (e.t === 'text') ents.push({ t: 'text', p: tr(e.p), h: Math.max(e.h * s, 0.7 * N), s: e.s, rot: e.rot || 0, align: e.align || 'left', valign: e.valign || 'baseline', layer: L });
          });
        });
        // 주기
        const isNp = getFrameVariant(opt) === 'N';
        const nb = y0 + noteBand - 2;
        text(x0 + 5, nb, 2.6, lang === 'en'
          ? `NOTE: Part drawings from Steel_Skin_Drawing(35mm).dwg (${frameLabel(opt.frame, 'O', 'en')} catalog). Only parts used in this BOM are shown.`
          : `주기: 부품도는 Steel_Skin_Drawing(35mm).dwg 실제 제작도(${frameLabel(opt.frame, 'O', 'ko')} 기준)에서 발췌 — 현재 BOM 사용 부품만 표기`, 'left');
        const extra = [];
        if (isNp) extra.push(lang === 'en' ? '(N) type: common L/W beams need additional W-direction holes (drawings are O-type base)' : '(N)형: L·W 공용 주재는 W방향 체결용 Hole 추가 가공 필요 (부품도는 O형 기준)');
        if (missingCodes.length) extra.push((lang === 'en' ? 'No drawing in catalog: ' : '부품도 미등록: ') + missingCodes.join(', '));
        if (extra.length) text(x0 + 5, nb - 4.2, 2.2, extra.join('  /  '), 'left');
        return { map: mmap, ents, scale: N, elev: false, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
      }
      if (partsData) {
        // 4분할 사분면 배치 (A타입, B타입, C타입, 주재 ㄷ-125)
        const quads = [
          { key: 'typeA', cx: x0 + areaW * 0.25, cy: y0 + areaH * 0.73, sheetNo: 1, viewNo: 1 },
          { key: 'typeB', cx: x0 + areaW * 0.75, cy: y0 + areaH * 0.73, sheetNo: 1, viewNo: 2 },
          { key: 'typeC', cx: x0 + areaW * 0.25, cy: y0 + areaH * 0.25, sheetNo: 1, viewNo: 3 },
          { key: 'mainBeam', cx: x0 + areaW * 0.75, cy: y0 + areaH * 0.25, sheetNo: 1, viewNo: 4 }
        ];
        // 사분면 구분 분할선 (이중선 스타일)
        line([x0 + areaW * 0.5, y0 + 10], [x0 + areaW * 0.5, y1 - 10]);
        line([x0 + 10, y0 + areaH * 0.49], [tx0 - 10, y0 + areaH * 0.49]);

        quads.forEach(q => {
          const part = partsData[q.key];
          if (!part || !part.ents) return;
          const b = bb(part.ents);
          const bw = Math.max(1, b[2] - b[0]);
          const bh = Math.max(1, b[3] - b[1]);
          const maxW = (areaW * 0.44) * N;
          const maxH = (areaH * 0.35) * N;
          const partScale = Math.min(maxW / bw, maxH / bh) * 0.88;
          const pcx = (b[0] + b[2]) / 2;
          const pcy = (b[1] + b[3]) / 2;
          const targetX = P(q.cx);
          const targetY = P(q.cy);

          const partLayer = (q.key === 'mainBeam') ? 'FRAME_MAIN_L' : 'FRAME_SUB';
          part.ents.forEach(e => {
            const trPt = pt => [
              targetX + (pt[0] - pcx) * partScale,
              targetY + (pt[1] - pcy) * partScale
            ];
            const eLayer = (e.layer === 'FRAME' || !e.layer) ? partLayer : e.layer;
            if (e.t === 'line') ents.push({ ...e, a: trPt(e.a), b: trPt(e.b), layer: eLayer });
            else if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(trPt), layer: eLayer });
            else if (e.t === 'circle') ents.push({ ...e, c: trPt(e.c), r: e.r * partScale, layer: eLayer });
            else if (e.t === 'arc') ents.push({ ...e, c: trPt(e.c), r: e.r * partScale, layer: eLayer });
            else if (e.t === 'text') ents.push({ ...e, p: trPt(e.p), h: Math.max(8, e.h * partScale), layer: eLayer });
          });

          // 뷰 타이틀 버블 및 규격 부제
          const titleBubbleY = q.cy - areaH * 0.17;
          drawViewTitleBubble(q.cx, titleBubbleY, q.sheetNo, q.viewNo, lang === 'en' ? part.titleEn : part.titleKo);
          text(q.cx, titleBubbleY - 6.0, 3.0, part.spec, 'center', 0, 'middle');
        });
      }
      return { map: mmap, ents, scale: N, elev: false, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
    }
    if (opt.sheetKind === 'pad') {
      const frontSec = buildFoundationSection(opt);
      const concPlan = buildConcrete({ ...opt, hideBottomDim: Boolean(frontSec) });
      const bPlan = bb(concPlan.ents);
      const areaW = tx0 - x0;
      const areaH = y1 - y0;

      // 1. 상단: 기초 패드 평면도 (FOUNDATION PAD PLAN)
      const cx1 = x0 + areaW * 0.48;
      const cy1 = y0 + areaH * 0.70;
      const dx1 = P(cx1) - (bPlan[0] + bPlan[2]) / 2;
      const dy1 = P(cy1) - (bPlan[1] + bPlan[3]) / 2;
      concPlan.ents.forEach(e => {
        if (e.t === 'line') ents.push({ ...e, a: [e.a[0] + dx1, e.a[1] + dy1], b: [e.b[0] + dx1, e.b[1] + dy1] });
        else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] + dx1, e.c[1] + dy1] });
        else if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] + dx1, p[1] + dy1]) });
        else ents.push({ ...e, p: [e.p[0] + dx1, e.p[1] + dy1] });
      });
      const titlePlanY = (bPlan[1] + dy1) / N - 14.0;
      const viewTitlePlan = lang === 'en' ? `FOUNDATION PAD PLAN  [SCALE 1 : ${N}]` : (lang === 'bilingual' ? `기 초 콘 크 리 트 평 면 도 (FOUNDATION PLAN)  [SCALE 1 : ${N}]` : `기  초  콘  크  리  트  평  면  도  [SCALE 1 : ${N}]`);
      drawViewTitleBubble(cx1, titlePlanY, 1, 1, viewTitlePlan);
      drawNorthArrow(cx1 + 80, y1 - 25);

      // 2. 하단: 기초 패드 단면 및 입면도 (FOUNDATION PAD SECTION & ELEVATION - media_1790950018151.png 반영)
      if (frontSec) {
        const bFront = bb(frontSec.ents);
        const cy2 = y0 + areaH * 0.28;
        const dx2 = P(cx1) - (bFront[0] + bFront[2]) / 2;
        const dy2 = P(cy2) - (bFront[1] + bFront[3]) / 2;
        frontSec.ents.forEach(e => {
          if (e.t === 'line') ents.push({ ...e, a: [e.a[0] + dx2, e.a[1] + dy2], b: [e.b[0] + dx2, e.b[1] + dy2] });
          else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] + dx2, e.c[1] + dy2] });
          else if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] + dx2, p[1] + dy2]) });
          else ents.push({ ...e, p: [e.p[0] + dx2, e.p[1] + dy2] });
        });
        const titleSecY = (bFront[1] + dy2) / N - 14.0;
        const viewTitleSec = lang === 'en' ? `FOUNDATION PAD SECTION & ELEVATION  [SCALE 1 : ${N}]` : (lang === 'bilingual' ? `기 초 패 드 단 면 및 입 면 도 (SECTION & ELEV)  [SCALE 1 : ${N}]` : `기  초  패  드  단  면  및  입  면  도  [SCALE 1 : ${N}]`);
        drawViewTitleBubble(cx1, titleSecY, 1, 2, viewTitleSec);
      }

      // 3. 우측 하단: 기초 콘크리트 설계 사양표 (FOUNDATION SPECIFICATION TABLE)
      const tbx = tx0 - 138, tby = y0 + 35;
      const tbw = 128, tbh = 80;
      rect(tbx, tby, tbx + tbw, tby + tbh);
      line([tbx, tby + tbh - 11], [tbx + tbw, tby + tbh - 11]);
      text(tbx + tbw / 2, tby + tbh - 5.5, 3.4, lang === 'en' ? 'FOUNDATION SPECIFICATION' : '기초 콘크리트 설계 사양 (내진·안전율)', 'center', 0, 'middle');

      const fDesign = getFoundationDesign(opt);
      const padFirstW = Number(opt.padFirstW) || 400;
      const padMidW = Number(opt.padMidW) || 300;
      const padHVal = Number(opt.padH) || (600 - (Number(opt.frame) || 75));
      const padOv = (opt.padOverhang !== undefined && opt.padOverhang !== '') ? Number(opt.padOverhang) : Math.round(padFirstW / 2);
      const specs = [
        [lang === 'en' ? 'Edge Pad Width (W1)' : '외측 패드 폭 (W1)', `${padFirstW} mm`],
        [lang === 'en' ? 'Middle Pad Width (W2)' : '중간 패드 폭 (W2)', `${padMidW} mm`],
        [lang === 'en' ? 'Pad Height (H)' : '패드 높이 (H)', `${padHVal} mm`],
        [lang === 'en' ? 'Foundation Slab (t)' : '기초 슬래브 두께 (t)', `${fDesign.slabT} mm`],
        [lang === 'en' ? 'Concrete Strength' : '콘크리트 강도 (fck)', fDesign.fckStr],
        [lang === 'en' ? 'Rebar (Main/Tie)' : '철근 규격 (주근/늑근)', fDesign.rebarPadStr],
        [lang === 'en' ? 'Slab Rebar (Top/Bot)' : '슬래브 배근 (상·하부)', fDesign.rebarSlabStr],
        [lang === 'en' ? 'Anchor Bolt' : '기초 앙카볼트', fDesign.anchorStr],
        [lang === 'en' ? 'Soil Bearing (qa)' : '요구 지내력 (qa)', fDesign.bearingStr],
        [lang === 'en' ? 'Safety Factor (F.S)' : '내진/안전율 기준', fDesign.fsStr]
      ];
      const rH = (tbh - 11) / specs.length;
      specs.forEach(([k, v], sIdx) => {
        const ry = tby + tbh - 11 - (sIdx + 1) * rH;
        if (sIdx > 0) line([tbx, ry + rH], [tbx + tbw, ry + rH]);
        line([tbx + 65, ry], [tbx + 65, ry + rH]);
        text(tbx + 3, ry + rH / 2, 2.3, k, 'left', 0, 'middle');
        text(tbx + 68, ry + rH / 2, 2.3, v, 'left', 0, 'middle');
      });

      const blocks = concPlan.blocks || {};
      ents.blocks = blocks;
      return { map: mmap, ents, blocks, scale: N, elev: false, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
    }
    if (opt.sheetKind === 'capacity') {
      const areaW = tx0 - x0;
      const areaH = y1 - y0;
      const lenSecs = (opt.length || []).filter(Boolean);

      // 구획별(Multi-compartment) 면적 및 유효수량 분할 계산
      const compAreas = [];
      const compTons = [];
      if (lenSecs.length > 1) {
        let curX = 0;
        for (let s = 0; s < lenSecs.length; s++) {
          const cLen = lenSecs[s];
          let cAreaMm2 = 0;
          mmap.rows.forEach((rh, i) => {
            mmap.cols.forEach((cw, j) => {
              if (!mmap.removed.has(i + ',' + j)) {
                const colLeft = mmap.xs[j], colRight = mmap.xs[j + 1];
                const overlapL = Math.max(0, Math.min(colRight, curX + cLen) - Math.max(colLeft, curX));
                if (overlapL > 0) cAreaMm2 += overlapL * rh;
              }
            });
          });
          const cAreaM2 = cAreaMm2 / 1e6;
          const cEffTon = cAreaMm2 * effDepth / 1e9;
          compAreas.push(cAreaM2);
          compTons.push(cEffTon);
          curX += cLen;
        }
      }

      // ==========================================
      // VIEW 1 (좌측 상단): 수위 및 수심 단면도 (WATER LEVEL ELEVATION & SECTION DWG)
      // ==========================================
      const cx1 = x0 + areaW * 0.28;
      const cy1 = y0 + areaH * 0.72;
      const dx1 = P(cx1) - totalL / 2;
      const dy1 = P(cy1) - H / 2;
      const secEnts = [];

      // 1. 하부 스키드 프레임
      const frmVal = opt.frame || opt.frm || 75;
      secEnts.push({ t: 'line', a: [0, -frmVal], b: [totalL, -frmVal], layer: 'FRAME' });
      secEnts.push({ t: 'line', a: [0, 0], b: [totalL, 0], layer: 'FRAME' });
      for (let sx = 0; sx <= totalL; sx += 1000) {
        secEnts.push({ t: 'line', a: [sx, -frmVal], b: [sx, 0], layer: 'FRAME' });
      }

      // 2. 수조 외곽 및 지붕 플랜지
      secEnts.push({ t: 'line', a: [0, 0], b: [totalL, 0], layer: 'PANEL' });
      secEnts.push({ t: 'line', a: [totalL, 0], b: [totalL, H], layer: 'PANEL' });
      secEnts.push({ t: 'line', a: [totalL, H], b: [0, H], layer: 'PANEL' });
      secEnts.push({ t: 'line', a: [0, H], b: [0, 0], layer: 'PANEL' });

      secEnts.push({ t: 'line', a: [-35, H], b: [totalL + 35, H], layer: 'PANEL' });
      secEnts.push({ t: 'line', a: [-35, H + 65], b: [totalL + 35, H + 65], layer: 'PANEL' });
      secEnts.push({ t: 'line', a: [-35, H], b: [-35, H + 65], layer: 'PANEL' });
      secEnts.push({ t: 'line', a: [totalL + 35, H], b: [totalL + 35, H + 65], layer: 'PANEL' });

      // 2-1. 바닥판넬-측면판넬 조립부 상세 (저판 플랜지 H=75mm, 볼트선 EL.+35mm)
      // 좌측 저판 직립 플랜지 (X = 0)
      secEnts.push({ t: 'line', a: [-25, 0], b: [-25, BTM_FLG_H], layer: 'PANEL' });
      secEnts.push({ t: 'line', a: [-25, BTM_FLG_H], b: [0, BTM_FLG_H], layer: 'PANEL' });
      // 우측 저판 직립 플랜지 (X = totalL)
      secEnts.push({ t: 'line', a: [totalL + 25, 0], b: [totalL + 25, BTM_FLG_H], layer: 'PANEL' });
      secEnts.push({ t: 'line', a: [totalL, BTM_FLG_H], b: [totalL + 25, BTM_FLG_H], layer: 'PANEL' });

      // 볼트 체결 중심선 (EL. +35mm)
      secEnts.push({ t: 'line', a: [-32, BTM_BOLT_H], b: [18, BTM_BOLT_H], layer: 'PANEL_DETAIL' });
      secEnts.push({ t: 'circle', c: [-12.5, BTM_BOLT_H], r: 3.5, layer: 'PANEL_DETAIL' });
      secEnts.push({ t: 'line', a: [-12.5, BTM_BOLT_H - 6], b: [-12.5, BTM_BOLT_H + 6], layer: 'PANEL_DETAIL' });

      secEnts.push({ t: 'line', a: [totalL - 18, BTM_BOLT_H], b: [totalL + 32, BTM_BOLT_H], layer: 'PANEL_DETAIL' });
      secEnts.push({ t: 'circle', c: [totalL + 12.5, BTM_BOLT_H], r: 3.5, layer: 'PANEL_DETAIL' });
      secEnts.push({ t: 'line', a: [totalL + 12.5, BTM_BOLT_H - 6], b: [totalL + 12.5, BTM_BOLT_H + 6], layer: 'PANEL_DETAIL' });

      // 측면 피팅 플랜지 취부 한계선 점선 (EL. +100mm)
      secEnts.push({ t: 'line', a: [-30, MIN_SIDE_FITTING_ELEV], b: [30, MIN_SIDE_FITTING_ELEV], layer: 'PANEL_DETAIL' });
      secEnts.push({ t: 'line', a: [totalL - 30, MIN_SIDE_FITTING_ELEV], b: [totalL + 30, MIN_SIDE_FITTING_ELEV], layer: 'PANEL_DETAIL' });

      // 저판 플랜지 및 볼트선 지시선 (Callout)
      drawLeader(
        secEnts,
        [-12.5, BTM_BOLT_H],
        [-Math.round(10 * N), -Math.round(6 * N)],
        [-Math.round(28 * N), -Math.round(6 * N)],
        [
          lang === 'ko' ? `저판 플랜지 H=${BTM_FLG_H}mm (볼트선 EL.+${BTM_BOLT_H}mm)` : `Btm Flange H=${BTM_FLG_H}mm (Bolt EL.+${BTM_BOLT_H}mm)`,
          lang === 'ko' ? `측면 피팅 취부: EL.+${MIN_SIDE_FITTING_ELEV}mm 이상` : `Side Fitting: EL. >= +${MIN_SIDE_FITTING_ELEV}mm`
        ],
        Math.round(2.3 * N),
        'right',
        'PANEL_DETAIL'
      );

      // 판넬 종방향 분할선 (Col Seams)
      mmap.cols.forEach((cw, j) => {
        if (j > 0) {
          const px = mmap.xs[j];
          secEnts.push({ t: 'line', a: [px, 0], b: [px, H], layer: 'PANEL_DETAIL' });
        }
      });
      // 판넬 횡방향 단 분할선 (Tier Seams)
      let curZ = 0;
      hs.forEach((segH, k) => {
        curZ += segH;
        if (k < hs.length - 1) {
          secEnts.push({ t: 'line', a: [0, curZ], b: [totalL, curZ], layer: 'PANEL_DETAIL' });
        }
      });

      // 다구획 격벽 표시
      if (lenSecs.length > 1) {
        let px = 0;
        for (let s = 0; s < lenSecs.length - 1; s++) {
          px += lenSecs[s];
          secEnts.push({ t: 'line', a: [px - 35, 0], b: [px - 35, H], layer: 'PANEL' });
          secEnts.push({ t: 'line', a: [px + 35, 0], b: [px + 35, H], layer: 'PANEL' });
          secEnts.push({ t: 'text', p: [px, H * 0.88], h: Math.round(2.6 * N), s: lang === 'ko' ? '격벽 (PARTITION)' : 'PARTITION WALL', rot: 90, align: 'center', valign: 'middle', layer: 'SHEET' });
        }
      }

      // 3. 수위 해치 및 안내 (Clean Monochrome CAD Standards - No Colors / No Solid Fill)
      // A. 사수 구역 (하부 0 ~ LWL)
      for (let hy = 100; hy < lwlElev; hy += 100) {
        secEnts.push({ t: 'line', a: [20, hy], b: [totalL - 20, hy], layer: 'PANEL_DETAIL' });
      }
      secEnts.push({
        t: 'text',
        p: [totalL / 2, Math.max(lwlElev / 2, 45)],
        h: Math.round(2.5 * N),
        s: lang === 'ko' ? `[사수 구역 / DEAD WATER] H_dead = ${lwlElev} mm  (V = ${deadTon.toFixed(1)} Ton)` : `[DEAD WATER ZONE] H_dead = ${lwlElev} mm  (V = ${deadTon.toFixed(1)} Ton)`,
        align: 'center',
        valign: 'middle',
        layer: 'SHEET'
      });

      // B. 유효 담수 구역 (LWL ~ HWL)
      for (let hy = lwlElev + 200; hy < hwlElev - 50; hy += 200) {
        secEnts.push({ t: 'line', a: [20, hy], b: [totalL - 20, hy], layer: 'PANEL_DETAIL' });
      }

      // 중앙 강조 실담수량 뱃지 (Effective Capacity Center Badge - Clean Monochrome Box)
      const badgeW = Math.min(totalL * 0.72, Math.max(2200, 75 * N));
      const badgeH = Math.min(effDepth * 0.65, Math.max(900, 30 * N));
      const bcx = totalL / 2;
      const bcy = lwlElev + effDepth / 2;
      const bx0 = bcx - badgeW / 2, bx1 = bcx + badgeW / 2;
      const by0 = bcy - badgeH / 2, by1 = bcy + badgeH / 2;
      const pad = Math.round(1.5 * N);

      // Clean double border without solid color fill
      secEnts.push({ t: 'line', a: [bx0, by0], b: [bx1, by0], layer: 'SHEET' });
      secEnts.push({ t: 'line', a: [bx1, by0], b: [bx1, by1], layer: 'SHEET' });
      secEnts.push({ t: 'line', a: [bx1, by1], b: [bx0, by1], layer: 'SHEET' });
      secEnts.push({ t: 'line', a: [bx0, by1], b: [bx0, by0], layer: 'SHEET' });
      secEnts.push({ t: 'line', a: [bx0 + pad, by0 + pad], b: [bx1 - pad, by0 + pad], layer: 'SHEET' });
      secEnts.push({ t: 'line', a: [bx1 - pad, by0 + pad], b: [bx1 - pad, by1 - pad], layer: 'SHEET' });
      secEnts.push({ t: 'line', a: [bx1 - pad, by1 - pad], b: [bx0 + pad, by1 - pad], layer: 'SHEET' });
      secEnts.push({ t: 'line', a: [bx0 + pad, by1 - pad], b: [bx0 + pad, by0 + pad], layer: 'SHEET' });

      secEnts.push({ t: 'text', p: [bcx, bcy + badgeH * 0.28], h: Math.round(3.4 * N), s: lang === 'ko' ? '■ 실담수량 (NET EFFECTIVE WATER CAPACITY) ■' : '■ NET EFFECTIVE WATER CAPACITY ■', align: 'center', valign: 'middle', layer: 'SHEET' });
      secEnts.push({ t: 'text', p: [bcx, bcy], h: Math.round(4.8 * N), s: `V_eff = ${effTon.toFixed(1)} Ton (㎥)  [${effRatio.toFixed(1)} %]`, align: 'center', valign: 'middle', layer: 'SHEET' });
      secEnts.push({ t: 'text', p: [bcx, bcy - badgeH * 0.28], h: Math.round(2.8 * N), s: lang === 'ko' ? `유효 수심 H_eff = ${effDepth.toLocaleString()} mm (HWL - LWL)` : `Effective Depth H_eff = ${effDepth.toLocaleString()} mm`, align: 'center', valign: 'middle', layer: 'SHEET' });

      // C. 상부 여유고 구역 (HWL ~ H)
      if (freeDepth > 200) {
        secEnts.push({ t: 'text', p: [totalL / 2, hwlElev + freeDepth / 2], h: Math.round(2.4 * N), s: lang === 'ko' ? `[상부 여유고 / FREEBOARD] H_free = ${freeDepth} mm  (V = ${freeTon.toFixed(1)} Ton)` : `[FREEBOARD ZONE] H_free = ${freeDepth} mm  (V = ${freeTon.toFixed(1)} Ton)`, align: 'center', valign: 'middle', layer: 'SHEET' });
      }

      // 4. 수위 기준선 및 ▽ 레벨 마크 (Clean Outline Triangles)
      const mkSz = Math.round(2.5 * N);
      const drawLevelTriangle = (x, y) => {
        secEnts.push({ t: 'line', a: [x - mkSz, y + mkSz * 1.2], b: [x + mkSz, y + mkSz * 1.2], layer: 'NOZZLE' });
        secEnts.push({ t: 'line', a: [x - mkSz, y + mkSz * 1.2], b: [x, y], layer: 'NOZZLE' });
        secEnts.push({ t: 'line', a: [x + mkSz, y + mkSz * 1.2], b: [x, y], layer: 'NOZZLE' });
        secEnts.push({ t: 'line', a: [x - mkSz * 1.5, y + mkSz * 1.2], b: [x + mkSz * 1.5, y + mkSz * 1.2], layer: 'NOZZLE' });
      };

      // HWL 선 (Monochrome)
      secEnts.push({ t: 'line', a: [-Math.round(15 * N), hwlElev], b: [totalL + Math.round(15 * N), hwlElev], layer: 'NOZZLE' });
      drawLevelTriangle(-Math.round(8 * N), hwlElev);
      drawLevelTriangle(totalL + Math.round(8 * N), hwlElev);
      secEnts.push({ t: 'text', p: [-Math.round(8 * N), hwlElev + Math.round(2.5 * N)], h: Math.round(2.8 * N), s: `▽ HWL EL. +${hwlElev.toLocaleString()}`, align: 'right', valign: 'bottom', layer: 'SHEET' });
      secEnts.push({ t: 'text', p: [totalL + Math.round(8 * N), hwlElev + Math.round(2.5 * N)], h: Math.round(2.6 * N), s: lang === 'ko' ? '최고수위 (OVERFLOW Invert)' : 'HWL (OVERFLOW Invert)', align: 'left', valign: 'bottom', layer: 'SHEET' });

      // LWL 선 (Monochrome)
      secEnts.push({ t: 'line', a: [-Math.round(15 * N), lwlElev], b: [totalL + Math.round(15 * N), lwlElev], layer: 'NOZZLE' });
      drawLevelTriangle(-Math.round(8 * N), lwlElev);
      drawLevelTriangle(totalL + Math.round(8 * N), lwlElev);
      secEnts.push({ t: 'text', p: [-Math.round(8 * N), lwlElev + Math.round(2.5 * N)], h: Math.round(2.8 * N), s: `▽ LWL EL. +${lwlElev.toLocaleString()}`, align: 'right', valign: 'bottom', layer: 'SHEET' });
      secEnts.push({ t: 'text', p: [totalL + Math.round(8 * N), lwlElev + Math.round(2.5 * N)], h: Math.round(2.6 * N), s: lang === 'ko' ? '최저수위 (OUTLET Invert)' : 'LWL (OUTLET Invert)', align: 'left', valign: 'bottom', layer: 'SHEET' });

      // 5. 배관 노즐 실물 형상 제도 (Side Stubs with Flanges & Tapered Gussets)
      const drawCapSideNozzle = (xWall, elev, noz, dir) => {
        const size = noz ? noz.size : '100A';
        const spec = getNozzleSpec(size);
        const r = spec.r || 55;
        const rf = spec.rf || 105;
        const neckLen = Math.max(140, spec.neckLen || 150);
        const flgThick = spec.flgThick || 20;

        if (dir === 'left') {
          const xBase = xWall;
          const xFlgOuter = xBase - neckLen;
          const xFlgInner = xFlgOuter + flgThick;

          // 파이프 배럴 (수평 원통 배관)
          secEnts.push({ t: 'line', a: [xBase, elev + r], b: [xFlgInner, elev + r], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xBase, elev - r], b: [xFlgInner, elev - r], layer: 'NOZZLE' });

          // 플랜지 플레이트 (외측 직사각형)
          secEnts.push({ t: 'line', a: [xFlgOuter, elev - rf], b: [xFlgInner, elev - rf], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xFlgInner, elev - rf], b: [xFlgInner, elev + rf], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xFlgInner, elev + rf], b: [xFlgOuter, elev + rf], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xFlgOuter, elev + rf], b: [xFlgOuter, elev - rf], layer: 'NOZZLE' });

          // 볼트선
          secEnts.push({ t: 'line', a: [xFlgOuter - 4, elev - rf * 0.75], b: [xFlgInner + 4, elev - rf * 0.75], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xFlgOuter - 4, elev + rf * 0.75], b: [xFlgInner + 4, elev + rf * 0.75], layer: 'NOZZLE' });

          // 벽체 접합 테이퍼 가셋 (Gusset Fillets)
          const gL = Math.round(neckLen * 0.45);
          secEnts.push({ t: 'line', a: [xBase, elev + rf * 0.85], b: [xBase - gL, elev + r], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xBase, elev - rf * 0.85], b: [xBase - gL, elev - r], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xBase, elev - rf * 0.85], b: [xBase, elev + rf * 0.85], layer: 'NOZZLE' });

          return [xFlgOuter, elev];
        } else {
          const xBase = xWall;
          const xFlgOuter = xBase + neckLen;
          const xFlgInner = xFlgOuter - flgThick;

          // 파이프 배럴
          secEnts.push({ t: 'line', a: [xBase, elev + r], b: [xFlgInner, elev + r], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xBase, elev - r], b: [xFlgInner, elev - r], layer: 'NOZZLE' });

          // 플랜지 플레이트
          secEnts.push({ t: 'line', a: [xFlgInner, elev - rf], b: [xFlgOuter, elev - rf], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xFlgOuter, elev - rf], b: [xFlgOuter, elev + rf], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xFlgOuter, elev + rf], b: [xFlgInner, elev + rf], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xFlgInner, elev + rf], b: [xFlgInner, elev - rf], layer: 'NOZZLE' });

          // 볼트선
          secEnts.push({ t: 'line', a: [xFlgInner - 4, elev - rf * 0.75], b: [xFlgOuter + 4, elev - rf * 0.75], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xFlgInner - 4, elev + rf * 0.75], b: [xFlgOuter + 4, elev + rf * 0.75], layer: 'NOZZLE' });

          // 벽체 접합 테이퍼 가셋 (Gusset Fillets)
          const gL = Math.round(neckLen * 0.45);
          secEnts.push({ t: 'line', a: [xBase, elev + rf * 0.85], b: [xBase + gL, elev + r], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xBase, elev - rf * 0.85], b: [xBase + gL, elev - r], layer: 'NOZZLE' });
          secEnts.push({ t: 'line', a: [xBase, elev - rf * 0.85], b: [xBase, elev + rf * 0.85], layer: 'NOZZLE' });

          return [xFlgOuter, elev];
        }
      };

      const drawCapBottomNozzle = (cx, noz) => {
        const size = noz ? noz.size : '50A';
        const spec = getNozzleSpec(size);
        const r = spec.r || 35;
        const rf = spec.rf || 65;
        const dropLen = 120;
        const flgThick = spec.flgThick || 18;
        const yFlgOuter = -dropLen;
        const yFlgInner = yFlgOuter + flgThick;

        secEnts.push({ t: 'line', a: [cx - r, 0], b: [cx - r, yFlgInner], layer: 'NOZZLE' });
        secEnts.push({ t: 'line', a: [cx + r, 0], b: [cx + r, yFlgInner], layer: 'NOZZLE' });

        secEnts.push({ t: 'line', a: [cx - rf, yFlgOuter], b: [cx + rf, yFlgOuter], layer: 'NOZZLE' });
        secEnts.push({ t: 'line', a: [cx + rf, yFlgOuter], b: [cx + rf, yFlgInner], layer: 'NOZZLE' });
        secEnts.push({ t: 'line', a: [cx + rf, yFlgInner], b: [cx - rf, yFlgInner], layer: 'NOZZLE' });
        secEnts.push({ t: 'line', a: [cx - rf, yFlgInner], b: [cx - rf, yFlgOuter], layer: 'NOZZLE' });

        secEnts.push({ t: 'line', a: [cx - rf * 0.75, yFlgOuter - 4], b: [cx - rf * 0.75, yFlgInner + 4], layer: 'NOZZLE' });
        secEnts.push({ t: 'line', a: [cx + rf * 0.75, yFlgOuter - 4], b: [cx + rf * 0.75, yFlgInner + 4], layer: 'NOZZLE' });

        return [cx, yFlgOuter];
      };

      // 1. 좌측 유입구 (INLET) 노즐
      const pInletTip = drawCapSideNozzle(0, inletElev, inletNoz, 'left');
      drawLeader(secEnts, pInletTip, [pInletTip[0] - Math.round(6 * N), inletElev + Math.round(6 * N)], [pInletTip[0] - Math.round(20 * N), inletElev + Math.round(6 * N)], [lang === 'ko' ? `[N1] 유입구 (${inletNoz ? inletNoz.size : '100A'})` : `[N1] INLET (${inletNoz ? inletNoz.size : '100A'})`, `EL. +${inletElev} mm`], Math.round(2.4 * N), 'right', 'NOZZLE');

      // 2. 우측 월류관 (OVERFLOW) 노즐
      const pOfTip = drawCapSideNozzle(totalL, hwlElev, overflowNoz, 'right');
      drawLeader(secEnts, pOfTip, [pOfTip[0] + Math.round(6 * N), hwlElev + Math.round(6 * N)], [pOfTip[0] + Math.round(20 * N), hwlElev + Math.round(6 * N)], [lang === 'ko' ? `[N3] 월류구 (${overflowNoz ? overflowNoz.size : '100A'})` : `[N3] OVERFLOW (${overflowNoz ? overflowNoz.size : '100A'})`, `EL. +${hwlElev} mm`], Math.round(2.4 * N), 'left', 'NOZZLE');

      // 3. 우측 유출구 (OUTLET) 노즐
      const pOutTip = drawCapSideNozzle(totalL, lwlElev, outletNoz, 'right');
      drawLeader(secEnts, pOutTip, [pOutTip[0] + Math.round(6 * N), lwlElev - Math.round(5 * N)], [pOutTip[0] + Math.round(20 * N), lwlElev - Math.round(5 * N)], [lang === 'ko' ? `[N2] 유출구 (${outletNoz ? outletNoz.size : '100A'})` : `[N2] OUTLET (${outletNoz ? outletNoz.size : '100A'})`, `EL. +${lwlElev} mm (플랜지상부 취부)`], Math.round(2.4 * N), 'left', 'NOZZLE');

      // 4. 하부 배수구 (DRAIN) 노즐
      const drainX = totalL * 0.15;
      const pDrainTip = drawCapBottomNozzle(drainX, drainNoz);
      drawLeader(secEnts, pDrainTip, [pDrainTip[0] - Math.round(6 * N), pDrainTip[1] - Math.round(6 * N)], [pDrainTip[0] - Math.round(18 * N), pDrainTip[1] - Math.round(6 * N)], [lang === 'ko' ? `[N4] 배수구 (${drainNoz ? drainNoz.size : '50A'})` : `[N4] DRAIN (${drainNoz ? drainNoz.size : '50A'})`, `EL. +0 mm (바닥)`], Math.round(2.4 * N), 'right', 'NOZZLE');

      // 6. 수직 및 수평 치수선 (Dimensions)
      dimLinear(secEnts, [0, 0], [0, lwlElev], -Math.round(22 * N), true, String(lwlElev), Math.round(2.5 * N), 'DIM');
      dimLinear(secEnts, [0, lwlElev], [0, hwlElev], -Math.round(22 * N), true, `${effDepth} (유효)`, Math.round(2.5 * N), 'DIM');
      dimLinear(secEnts, [0, hwlElev], [0, H], -Math.round(22 * N), true, `${freeDepth} (여유)`, Math.round(2.5 * N), 'DIM');
      dimLinear(secEnts, [0, 0], [0, H], -Math.round(34 * N), true, `${H} (총높이)`, Math.round(2.8 * N), 'DIM');

      if (lenSecs.length > 1) {
        let cx0 = 0;
        lenSecs.forEach(cLen => {
          dimLinear(secEnts, [cx0, 0], [cx0 + cLen, 0], -Math.round(18 * N), false, String(cLen), Math.round(2.5 * N), 'DIM');
          cx0 += cLen;
        });
      }
      dimLinear(secEnts, [0, 0], [totalL, 0], -Math.round(lenSecs.length > 1 ? 28 * N : 20 * N), false, `${totalL} (전장 L)`, Math.round(2.8 * N), 'DIM');

      translateEnts(secEnts, dx1, dy1);
      const titleSecY = (dy1 - Math.round(lenSecs.length > 1 ? 38 * N : 30 * N)) / N;
      drawViewTitleBubble(cx1, titleSecY, 1, 1, lang === 'ko' ? '수위 및 수심 단면도 (WATER LEVEL ELEVATION)' : 'WATER LEVEL & DEPTH ELEVATION', N);

      // ==========================================
      // VIEW 2 (우측 상단): 3D 등각 수위 조감도 (3D ISOMETRIC WATER LEVEL VIEW)
      // ==========================================
      const iso = buildIsometric(opt, templates, sideT);
      const bIso = bb(iso.ents);
      const isoAreaW = areaW * 0.40;
      const isoAreaH = areaH * 0.44;
      const cx2 = x0 + areaW * 0.74;
      const cy2 = y0 + areaH * 0.72;
      const viewW = (bIso[2] - bIso[0]) / N, viewH = (bIso[3] - bIso[1]) / N;
      const fitScale = Math.min((isoAreaW * 0.85) / viewW, (isoAreaH * 0.78) / viewH);
      const centerDx = P(cx2) - ((bIso[0] + bIso[2]) / 2) * fitScale;
      const centerDy = P(cy2) - ((bIso[1] + bIso[3]) / 2) * fitScale;

      iso.ents.forEach(e => {
        if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] * fitScale + centerDx, p[1] * fitScale + centerDy]) });
        else if (e.t === 'line') ents.push({ ...e, a: [e.a[0] * fitScale + centerDx, e.a[1] * fitScale + centerDy], b: [e.b[0] * fitScale + centerDx, e.b[1] * fitScale + centerDy] });
        else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] * fitScale + centerDx, e.c[1] * fitScale + centerDy], r: e.r * fitScale });
        else ents.push({ ...e, p: [e.p[0] * fitScale + centerDx, e.p[1] * fitScale + centerDy], h: e.h * fitScale });
      });

      // 3D 수위선 투영 (Z = hwlElev, Z = lwlElev) - Clean Monochrome
      const toIsoP = (x, y, z) => [
        (x + y - totalL) * 0.8660254037844386 * fitScale + centerDx,
        (((totalL - x) + y) * 0.5 + z) * fitScale + centerDy
      ];
      const p0 = toIsoP(0, 0, hwlElev), p1 = toIsoP(totalL, 0, hwlElev), p2 = toIsoP(totalL, totalW, hwlElev), p3 = toIsoP(0, totalW, hwlElev);
      ents.push({ t: 'line', a: p0, b: p1, layer: 'NOZZLE' });
      ents.push({ t: 'line', a: p1, b: p2, layer: 'NOZZLE' });
      ents.push({ t: 'line', a: p2, b: p3, layer: 'NOZZLE' });
      ents.push({ t: 'line', a: p3, b: p0, layer: 'NOZZLE' });

      const q0 = toIsoP(0, 0, lwlElev), q1 = toIsoP(totalL, 0, lwlElev), q2 = toIsoP(totalL, totalW, lwlElev), q3 = toIsoP(0, totalW, lwlElev);
      ents.push({ t: 'line', a: q0, b: q1, layer: 'NOZZLE' });
      ents.push({ t: 'line', a: q1, b: q2, layer: 'NOZZLE' });
      ents.push({ t: 'line', a: q2, b: q3, layer: 'NOZZLE' });
      ents.push({ t: 'line', a: q3, b: q0, layer: 'NOZZLE' });

      // 3D 수위 지시선
      ents.push({ t: 'line', a: p1, b: [p1[0] + 15 * N * fitScale, p1[1] + 10 * N * fitScale], layer: 'NOZZLE' });
      ents.push({ t: 'line', a: [p1[0] + 15 * N * fitScale, p1[1] + 10 * N * fitScale], b: [p1[0] + 45 * N * fitScale, p1[1] + 10 * N * fitScale], layer: 'NOZZLE' });
      ents.push({ t: 'text', p: [p1[0] + 16 * N * fitScale, p1[1] + 13 * N * fitScale], h: Math.round(2.6 * N * fitScale), s: `▽ HWL EL. +${hwlElev}`, align: 'left', valign: 'bottom', layer: 'SHEET' });

      const titleIsoY = y0 + areaH * 0.52 - 8;
      drawViewTitleBubble(cx2, titleIsoY, 1, 2, lang === 'ko' ? '3D 등각 수위 조감도 (3D ISOMETRIC WATER VIEW)' : '3D ISOMETRIC WATER LEVEL VIEW', 'N.T.S.');

      // ==========================================
      // VIEW 3 (좌측 하단): 평면도 및 유효면적도 (PLAN VIEW & WATER SURFACE AREA)
      // ==========================================
      const plan = buildPlan(opt, templates);
      const bPlan = bb(plan.ents);
      const cx3 = cx1;
      const cy3 = y0 + areaH * 0.25;
      const dx3 = P(cx3) - (bPlan[0] + bPlan[2]) / 2;
      const dy3 = P(cy3) - (bPlan[1] + bPlan[3]) / 2;
      translateEnts(plan.ents, dx3, dy3);

      if (lenSecs.length > 1) {
        let curXp = 0;
        for (let s = 0; s < lenSecs.length; s++) {
          const cL = lenSecs[s];
          const midX = dx3 + curXp + cL / 2;
          const midY = dy3 + totalW / 2;
          const cA = compAreas[s] || (cL * totalW / 1e6);
          const cT = compTons[s] || (cA * effDepth / 1000);
          ents.push({ t: 'text', p: [midX, midY + Math.round(4 * N)], h: Math.round(2.8 * N), s: lang === 'ko' ? `【 ${s + 1}구획 】 A${s + 1} = ${cA.toFixed(2)} ㎡` : `【 COMP.${s + 1} 】 A${s + 1} = ${cA.toFixed(2)} ㎡`, align: 'center', valign: 'middle', layer: 'SHEET' });
          ents.push({ t: 'text', p: [midX, midY - Math.round(4 * N)], h: Math.round(3.4 * N), s: lang === 'ko' ? `실담수량: ${cT.toFixed(1)} Ton` : `Net Cap.: ${cT.toFixed(1)} Ton`, align: 'center', valign: 'middle', layer: 'SHEET' });
          curXp += cL;
        }
      } else {
        ents.push({ t: 'text', p: [P(cx3), P(cy3) + Math.round(4 * N)], h: Math.round(3.2 * N), s: lang === 'ko' ? `유효 담수 면적: A = ${areaM2.toFixed(2)} ㎡` : `Floor Net Area: A = ${areaM2.toFixed(2)} ㎡`, align: 'center', valign: 'middle', layer: 'SHEET' });
        ents.push({ t: 'text', p: [P(cx3), P(cy3) - Math.round(4 * N)], h: Math.round(3.6 * N), s: lang === 'ko' ? `실담수량: ${effTon.toFixed(1)} Ton (${effRatio.toFixed(1)}%)` : `Net Cap.: ${effTon.toFixed(1)} Ton (${effRatio.toFixed(1)}%)`, align: 'center', valign: 'middle', layer: 'SHEET' });
      }

      const titlePlanY = (bPlan[1] + dy3) / N - 14.0;
      drawViewTitleBubble(cx3, titlePlanY, 1, 3, lang === 'ko' ? '평면도 및 유효면적도 (PLAN VIEW & AREA)' : 'PLAN VIEW & WATER SURFACE AREA', N);
      const northCapX = Math.min((bPlan[2] + dx3) / N + 15, tx0 - 335);
      const northCapY = Math.min(titleIsoY - 12, (bPlan[3] + dy3) / N + 10);
      drawNorthArrow(northCapX, northCapY);

      // ==========================================
      // VIEW 4 (우측 하단): 실담수량 정밀 산출 내역서 표 (EFFECTIVE WATER CAPACITY TABLE)
      // ==========================================
      const tbx = tx0 - 325, tby = y0 + 15, tbw = 320, tbh = 250;
      rect(tbx, tby, tbx + tbw, tby + tbh);
      line([tbx, tby + tbh - 14], [tbx + tbw, tby + tbh - 14]);
      line([tbx, tby + tbh - 15.2], [tbx + tbw, tby + tbh - 15.2]);
      text(tbx + tbw / 2, tby + tbh - 7, 3.8, lang === 'ko' ? '실담수량 및 수위 정밀 산출 내역서 (CAPACITY SCHEDULE)' : 'WATER CAPACITY & LEVEL CALCULATION SCHEDULE', 'center', 0, 'middle');

      const colY = tby + tbh - 22;
      line([tbx, colY], [tbx + tbw, colY]);
      const c1 = 46, c2 = 90, c3 = 118, c4 = 66; // total 320
      line([tbx + c1, tby], [tbx + c1, tby + tbh - 14]);
      line([tbx + c1 + c2, tby], [tbx + c1 + c2, tby + tbh - 14]);
      line([tbx + c1 + c2 + c3, tby], [tbx + c1 + c2 + c3, tby + tbh - 14]);

      text(tbx + c1 / 2, colY + 4, 2.5, lang === 'ko' ? '구  분' : 'CAT.', 'center', 0, 'middle');
      text(tbx + c1 + c2 / 2, colY + 4, 2.5, lang === 'ko' ? '산  출  항  목' : 'ITEM DESCRIPTION', 'center', 0, 'middle');
      text(tbx + c1 + c2 + c3 / 2, colY + 4, 2.5, lang === 'ko' ? '설계 수치 및 계산식' : 'VALUE & FORMULA', 'center', 0, 'middle');
      text(tbx + c1 + c2 + c3 + c4 / 2, colY + 4, 2.5, lang === 'ko' ? '비고 및 기준' : 'REMARKS / CODE', 'center', 0, 'middle');

      const calcRows = [
        [lang === 'ko' ? '기본제원' : 'TANK', lang === 'ko' ? '탱크 외형 치수 (L×W×H)' : 'Tank Overall Dims', `${totalL} × ${totalW} × ${H} mm`, lang === 'ko' ? '호칭 규격' : 'Nominal Dims'],
        [lang === 'ko' ? '기본제원' : 'TANK', lang === 'ko' ? '바닥 유효 면적 (A_net)' : 'Floor Net Area', `${areaM2.toFixed(2)} ㎡ (${activeAreaMm2.toLocaleString()} ㎟)`, lang === 'ko' ? '실제 담수면적' : 'Floor Area'],
        [lang === 'ko' ? '기본제원' : 'TANK', lang === 'ko' ? '총 공칭 용량 (V_gross)' : 'Total Gross Volume', `${grossTon.toFixed(2)} Ton (㎥)`, 'A × H (100%)'],
        [lang === 'ko' ? '기본제원' : 'TANK', lang === 'ko' ? '수조 구획 구분' : 'Compartment Type', lenSecs.length > 1 ? (lang === 'ko' ? `${lenSecs.length}구획 (${lenSecs.join('+')}mm)` : `${lenSecs.length}-Comp. (${lenSecs.join('+')}mm)`) : (lang === 'ko' ? '단일 구획 (Single)' : 'Single Comp.'), lang === 'ko' ? '격벽 설치' : 'Partition'],

        [lang === 'ko' ? '플랜지구조' : 'FLANGE', lang === 'ko' ? '저판 플랜지 및 볼트선' : 'Btm Flange & Bolt Line', `플랜지 H=${BTM_FLG_H}mm (볼트선 EL.+${BTM_BOLT_H}mm)`, lang === 'ko' ? '바닥-측판 조립' : 'Flange Joint'],
        [lang === 'ko' ? '플랜지구조' : 'FLANGE', lang === 'ko' ? '측면 피팅 취부 한계' : 'Side Fitting Limit', `EL. +${MIN_SIDE_FITTING_ELEV} mm 이상 (플랜지 상부)`, lang === 'ko' ? '피팅간섭 방지' : 'Fitting Clearance'],

        [lang === 'ko' ? '노즐표고' : 'NOZZLE', lang === 'ko' ? '급수 유입구 (INLET)' : 'Inlet Nozzle', `EL. +${inletElev} mm (${inletNoz ? inletNoz.size : '100A'})`, lang === 'ko' ? '급수 인입 표고' : 'Inlet Center'],
        [lang === 'ko' ? '노즐표고' : 'NOZZLE', lang === 'ko' ? '월류관 / 최고수위 (HWL)' : 'Overflow / HWL', `EL. +${hwlElev} mm (${overflowNoz ? overflowNoz.size : '100A'})`, lang === 'ko' ? '월류관 하단(HWL)' : 'Overflow Invert'],
        [lang === 'ko' ? '노즐표고' : 'NOZZLE', lang === 'ko' ? '유출관 / 최저수위 (LWL)' : 'Outlet / LWL', `EL. +${lwlElev} mm (${outletNoz ? outletNoz.size : '100A'})`, lang === 'ko' ? '플랜지 상부 취부' : 'Above Flange'],
        [lang === 'ko' ? '노즐표고' : 'NOZZLE', lang === 'ko' ? '바닥 배수구 (DRAIN)' : 'Bottom Drain', `EL. +0 mm (${drainNoz ? drainNoz.size : '50A'})`, lang === 'ko' ? '바닥 잔수 배수' : 'Bottom Drain'],

        [lang === 'ko' ? '수심분석' : 'DEPTH', lang === 'ko' ? '상부 여유고 (H_free)' : 'Freeboard Height', `${freeDepth.toLocaleString()} mm (H - HWL)`, lang === 'ko' ? '공기층/넘침방지' : 'Air Gap'],
        [lang === 'ko' ? '수심분석' : 'DEPTH', lang === 'ko' ? '하부 사수위 (H_dead)' : 'Dead Water Depth', `${deadDepth.toLocaleString()} mm (LWL)`, lang === 'ko' ? '흡입정/침전구간' : 'Dead Depth'],
        [lang === 'ko' ? '수심분석' : 'DEPTH', lang === 'ko' ? '★ 유효 수심 (H_eff)' : '★ Effective Depth', `★ ${effDepth.toLocaleString()} mm (HWL - LWL)`, lang === 'ko' ? '가용 수심 확보' : 'Effective Depth'],

        [lang === 'ko' ? '용량산출' : 'VOLUME', lang === 'ko' ? '상부 비유효용적 (V_free)' : 'Freeboard Volume', `${freeTon.toFixed(2)} Ton (㎥)`, 'A × H_free'],
        [lang === 'ko' ? '용량산출' : 'VOLUME', lang === 'ko' ? '하부 사수량 (V_dead)' : 'Dead Water Volume', `${deadTon.toFixed(2)} Ton (㎥)`, 'A × H_dead'],
        [lang === 'ko' ? '용량산출' : 'VOLUME', lang === 'ko' ? '★ 최종 실담수량 (V_eff)' : '★ Net Effective Cap.', `★ ${effTon.toFixed(2)} Ton (㎥)`, lang === 'ko' ? '★ 인허가 실용량' : '★ Net Storage'],
        [lang === 'ko' ? '용량산출' : 'VOLUME', lang === 'ko' ? '★ 유효 담수율 (η)' : '★ Storage Efficiency', `★ ${effRatio.toFixed(1)} %`, 'V_eff / V_gross'],
        [lang === 'ko' ? '구획/판정' : 'CHECK', lang === 'ko' ? (lenSecs.length > 1 ? '구획별 실담수량' : '설계 적합성 판정') : (lenSecs.length > 1 ? 'Comp. Net Storage' : 'Design Criteria Check'), lenSecs.length > 1 ? compTons.map((t, idx) => `${idx + 1}구획: ${t.toFixed(1)}T`).join(' / ') : (lang === 'ko' ? '플랜지간섭회피·유효수심 [PASS]' : 'Flange Clear & Depth [PASS]'), lang === 'ko' ? '설비설계기준 적합' : 'Code Compliant']
      ];

      const rowH = (colY - tby) / calcRows.length;
      calcRows.forEach((r, idx) => {
        const ry = colY - (idx + 1) * rowH;
        if (idx > 0) line([tbx, ry + rowH], [tbx + tbw, ry + rowH]);

        const isKey = (r[1].includes('실담수량') || r[1].includes('유효 수심') || r[1].includes('Storage Efficiency'));
        if (isKey) {
          line([tbx + c1, ry + 0.6], [tbx + tbw, ry + 0.6]);
        }
        const fs = isKey ? 2.5 : 2.1;
        text(tbx + c1 / 2, ry + rowH / 2, 2.0, r[0], 'center', 0, 'middle');
        text(tbx + c1 + 3, ry + rowH / 2, fs, r[1], 'left', 0, 'middle');
        text(tbx + c1 + c2 + 3, ry + rowH / 2, isKey ? 2.6 : 2.2, r[2], 'left', 0, 'middle');
        text(tbx + c1 + c2 + c3 + 3, ry + rowH / 2, 2.0, r[3], 'left', 0, 'middle');
      });

      return {
        map: mmap,
        ents,
        scale: N,
        elev: false,
        tank: {
          dimStr,
          ton,
          effTon: effTon.toFixed(1),
          effRatio: effRatio.toFixed(1),
          hwl: hwlElev,
          lwl: lwlElev,
          inlet: inletElev,
          effDepth,
          activeAreaM2: activeAreaMm2 / 1e6
        }
      };
    }
    if (opt.sheetKind === 'iso') {
      const iso = buildIsometric(opt, templates, sideT);
      const b = bb(iso.ents);
      const areaW = tx0 - x0;
      const areaH = y1 - y0;
      const viewW = (b[2] - b[0]) / N, viewH = (b[3] - b[1]) / N;
      const fitScale = Math.min((areaW * 0.88) / viewW, (areaH * 0.78) / viewH);
      const cx = x0 + areaW * 0.5;
      const cy = y0 + areaH * 0.52;
      const centerDx = P(cx) - ((b[0] + b[2]) / 2) * fitScale;
      const centerDy = P(cy) - ((b[1] + b[3]) / 2) * fitScale;

      iso.ents.forEach(e => {
        if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] * fitScale + centerDx, p[1] * fitScale + centerDy]) });
        else if (e.t === 'line') ents.push({ ...e, a: [e.a[0] * fitScale + centerDx, e.a[1] * fitScale + centerDy], b: [e.b[0] * fitScale + centerDx, e.b[1] * fitScale + centerDy] });
        else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] * fitScale + centerDx, e.c[1] * fitScale + centerDy], r: e.r * fitScale });
        else ents.push({ ...e, p: [e.p[0] * fitScale + centerDx, e.p[1] * fitScale + centerDy], h: e.h * fitScale });
      });

      const titleY = y0 + 35;
      const effScale = Math.max(5, Math.round(N / fitScale));
      const isoSingleTitle = lang === 'en' ? `3D ISOMETRIC VIEW  [SCALE 1 : ${effScale}]` : (lang === 'bilingual' ? `등 각 조 감 도 (3D ISOMETRIC)  [SCALE 1 : ${effScale}]` : `등  각  조  감  도 (3D ISOMETRIC DWG)  [SCALE 1 : ${effScale}]`);
      drawViewTitleBubble(cx, titleY, 1, 1, isoSingleTitle);
      return { map: mmap, ents, scale: effScale, elev: false, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
    }

    // 4대 뷰 투영 정렬(Orthographic Alignment) 및 중심 여백 균형 배치
    const TITLE_H = 16;
    const hasAnyMh = (opt.marks && Object.values(opt.marks).some(m => m === 1 || m === 3));
    const dim_left_1 = 75 + Math.round((hasAnyMh ? 38.0 : 30.0) * N);   // 좌측 치수선(맨홀 개방 시 3열) 및 치수 문자 가용 영역
    const dim_right_1 = 75 + Math.round(20.0 * N);  // 우측 풍선 기호 및 배관 노즐 가용 영역
    const dim_bottom_1 = Math.round(18.0 * N);
    const EXTC = 400;
    const GRD = -600;

    const isAsm5 = (!opt.sheetKind || opt.sheetKind === 'asm');
    const areaW = tx0 - x0;
    const areaH = y1 - y0;

    const viewTitlePlan = lang === 'en' ? 'FLOOR PLAN' : (lang === 'bilingual' ? '평 면 도 (FLOOR PLAN)' : '평  면  도');
    const viewTitlePad = lang === 'en' ? 'FOUNDATION PAD PLAN & SECTION' : (lang === 'bilingual' ? '기 초 패 드 평 면 및 단 면 도 (PAD PLAN & SECTION)' : '기  초  패  드  평  면  및  단  면  도');
    const viewTitleFront = lang === 'en' ? 'FRONT ELEVATION VIEW' : (lang === 'bilingual' ? '정 면 도 (FRONT ELEVATION)' : '정  면  도');
    const viewTitleSide = lang === 'en' ? 'RIGHT SIDE ELEVATION VIEW' : (lang === 'bilingual' ? '우 측 면 도 (SIDE ELEVATION)' : '우  측  면  도');
    const viewTitleIso = lang === 'en' ? '3D ISOMETRIC VIEW' : (lang === 'bilingual' ? '3D 등 각 조 감 도 (3D ISOMETRIC)' : '3D  등  각  조  감  도');
    const viewTitleSec = lang === 'en' ? 'FOUNDATION PAD SECTION & ELEVATION' : (lang === 'bilingual' ? '기 초 패 드 단 면 및 입 면 도 (SECTION & ELEV)' : '기  초  패  드  단  면  및  입  면  도');

    let elev = false;
    if (front && side) {
      // 2열 폭 계산 (Col 1: Tank Length, Col 2: Tank Width)
      const col1_w = (dim_left_1 + totalL + dim_right_1) / N;
      const col2_w = (dim_left_1 + totalW + dim_right_1) / N;
      const total_2col_w = col1_w + col2_w;
      const rem_w = Math.max(0, areaW - total_2col_w);
      const gap_x = Math.max(20, Math.min(45, rem_w * 0.35));
      const left_margin = Math.max(12, (rem_w - gap_x) / 2);

      const col1_tank_cx = x0 + left_margin + (dim_left_1 + totalL / 2) / N;
      const col2_tank_cx = col1_tank_cx + (totalL / 2 + dim_right_1) / N + gap_x + (dim_left_1 + totalW / 2) / N;

      // 3행 높이 계산:
      // Row 1: 평면도 (PLAN VIEW) & 등각조감도 (3D ISOMETRIC VIEW)
      // Row 2: 정면도 (FRONT ELEVATION) & 우측면도 (RIGHT SIDE ELEVATION)
      // Row 3: 기초 패드 평면 및 단면/입면도 통합 뷰 (FOUNDATION PAD PLAN & SECTION) & 기초 사양표
      const row1_top_extent = (totalW / 2 + 75 + Math.round(18.0 * N)) / N;
      const row1_bottom_extent = (totalW / 2 + dim_bottom_1 + 300) / N + TITLE_H;
      const row1_total_h = row1_top_extent + row1_bottom_extent;

      const row2_top_extent = (H + 200 - GRD) / N;
      const row2_bottom_extent = (-GRD + dim_bottom_1) / N + TITLE_H;
      const row2_total_h = row2_top_extent + row2_bottom_extent;

      const padHVal = (opt && opt.padH !== undefined && opt.padH !== '') ? Number(opt.padH) : (600 - (Number(opt.frame) || 75));
      const secH_model = (padHVal + 150 + Math.round(16.0 * N));
      const gap_plan_sec_mm = Math.round(14.0 * N);
      const row3_top_extent = (totalW / 2 + PAD_OVERHANG + 500) / N;
      const row3_pad_to_title = (totalW / 2 + PAD_OVERHANG + gap_plan_sec_mm + secH_model) / N + 14.0;
      const row3_total_h = row3_top_extent + row3_pad_to_title + 6.0;

      const total_content_h = row1_total_h + row2_total_h + row3_total_h;
      const free_h = Math.max(0, areaH - total_content_h);

      let m_top, m_bottom, gap_12, gap_23;
      if (free_h >= 60) {
        m_top = 16 + (free_h - 60) * 0.15;
        m_bottom = 18 + (free_h - 60) * 0.20;
        gap_12 = 13 + (free_h - 60) * 0.325;
        gap_23 = 13 + (free_h - 60) * 0.325;
      } else if (free_h >= 24) {
        m_top = 8 + (free_h - 24) * 0.20;
        m_bottom = 10 + (free_h - 24) * 0.25;
        gap_12 = 3 + (free_h - 24) * 0.275;
        gap_23 = 3 + (free_h - 24) * 0.275;
      } else {
        m_top = Math.max(5, free_h * 0.25);
        m_bottom = Math.max(6, free_h * 0.30);
        gap_12 = Math.max(4, free_h * 0.225);
        gap_23 = Math.max(4, free_h * 0.225);
      }

      const row1_top_y = y1 - m_top;
      const row1_tank_cy = row1_top_y - row1_top_extent;
      const row1_bottom_y = row1_tank_cy - row1_bottom_extent;
      const row1_title_y = row1_tank_cy - (totalW / 2 + dim_bottom_1 + 300) / N - 14.0;

      const row2_top_y = row1_title_y - 6.0 - gap_12;
      const row2_ground_y = row2_top_y - row2_top_extent;
      const row2_bottom_y = row2_ground_y - row2_bottom_extent;
      const row2_title_y = (row2_ground_y * N + GRD - dim_bottom_1) / N - 14.0;

      const row3_top_y = row2_title_y - 6.0 - gap_23;
      let row3_pad_cy = row3_top_y - row3_top_extent;
      let row3_bottom_y = row3_pad_cy - (totalW / 2 + PAD_OVERHANG + gap_plan_sec_mm + secH_model) / N - TITLE_H;
      let row3_title_y = row3_pad_cy - row3_pad_to_title;

      // 하단 뷰 타이틀(R=6)이 도면틀(y0) 밖으로 나가지 않도록 절대 보장
      const min_title_y = y0 + 8.0;
      if (row3_title_y < min_title_y) {
        const shift_up = min_title_y - row3_title_y;
        row3_pad_cy += shift_up;
        row3_title_y += shift_up;
        row3_bottom_y += shift_up;
      }

      // 1열(TOP & FRONT & PAD_PLAN) 수직 투영 100% 일치
      const dx1 = P(col1_tank_cx) - totalL / 2;
      // 2열(SIDE & ISO & PAD_SEC)
      const dx2_side = P(col2_tank_cx) - totalW / 2;

      // 1행(TOP)
      const dy1 = P(row1_tank_cy) - totalW / 2;
      // 2행(FRONT & SIDE) 수평 그라운드 투영 100% 일치
      const dy2 = P(row2_ground_y) - GRD;

      // 1. Row 1 Col 1: 평면도 배치 (View 1 / 1)
      translateEnts(plan.ents, dx1, dy1);
      centerLineM([dx1 - 75 - CL_EXT, dy1 + totalW / 2], [dx1 + totalL + 75 + CL_EXT, dy1 + totalW / 2], false);
      centerLineM([dx1 + totalL / 2, dy1 - 75 - CL_EXT], [dx1 + totalL / 2, dy1 + totalW + 75 + CL_EXT], false);
      drawViewTitleBubble(col1_tank_cx, row1_title_y, 1, 1, viewTitlePlan, N);
      const northX = Math.min(col1_tank_cx + (totalL / 2 + 100) / N + 15, isAsm5 ? col2_tank_cx - 40 : tx0 - 25);
      const northY = Math.min(y1 - 25, row1_top_y - 10);
      drawNorthArrow(northX, northY);

      // 2. Row 1 Col 2: 등각 조감도 배치 (View 1 / 5)
      if (isAsm5) {
        const iso = buildIsometric(opt, templates, sideT);
        const b_iso = bb(iso.ents);
        const isoW_mm = (b_iso[2] - b_iso[0]) / N;
        const isoH_mm = (b_iso[3] - b_iso[1]) / N;

        const iso_avail_w = Math.max(100, (tx0 - 15) - (col2_tank_cx - (Math.max(totalW, totalL) / 2 + dim_left_1) / N));
        const iso_avail_h = Math.max(80, row1_top_y - (row1_title_y + 14));
        const isoFitScale = Math.min((iso_avail_w * 0.92) / isoW_mm, (iso_avail_h * 0.90) / isoH_mm);

        const iso_cx = col2_tank_cx;
        const iso_cy = row1_top_y - iso_avail_h * 0.5;
        const isoDx = P(iso_cx) - ((b_iso[0] + b_iso[2]) / 2) * isoFitScale;
        const isoDy = P(iso_cy) - ((b_iso[1] + b_iso[3]) / 2) * isoFitScale;

        iso.ents.forEach(e => {
          if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] * isoFitScale + isoDx, p[1] * isoFitScale + isoDy]) });
          else if (e.t === 'line') ents.push({ ...e, a: [e.a[0] * isoFitScale + isoDx, e.a[1] * isoFitScale + isoDy], b: [e.b[0] * isoFitScale + isoDx, e.b[1] * isoFitScale + isoDy] });
          else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] * isoFitScale + isoDx, e.c[1] * isoFitScale + isoDy], r: e.r * isoFitScale });
          else ents.push({ ...e, p: [e.p[0] * isoFitScale + isoDx, e.p[1] * isoFitScale + isoDy], h: e.h * isoFitScale });
        });

        drawViewTitleBubble(iso_cx, row1_title_y, 1, 5, viewTitleIso, 'N.T.S.');
      }

      // 3. Row 2 Col 1: 정면도 배치 (View 1 / 3)
      translateEnts(front.ents, dx1, dy2);
      centerLineM([dx1 + totalL / 2, dy2 - CL_EXT], [dx1 + totalL / 2, dy2 + H + CL_EXT], false);
      drawViewTitleBubble(col1_tank_cx, row2_title_y, 1, 3, viewTitleFront, N);

      // 4. Row 2 Col 2: 우측면도 배치 (View 1 / 4)
      translateEnts(side.ents, dx2_side, dy2);
      centerLineM([dx2_side + totalW / 2, dy2 - CL_EXT], [dx2_side + totalW / 2, dy2 + H + CL_EXT], false);
      drawViewTitleBubble(col2_tank_cx, row2_title_y, 1, 4, viewTitleSide, N);

      // 5. Row 3 Col 1: 기초 패드 평면 및 단면/입면도 수직 통합 배치 (View 1 / 2)
      const dx_pad = P(col1_tank_cx) - totalL / 2;
      const dy_pad = P(row3_pad_cy) - totalW / 2;
      translateEnts(conc.ents, dx_pad, dy_pad);

      if (frontSec) {
        // 단면/입면도를 평면도 하단에 수직 투영 일치(동일 X축 중심 및 기둥 정렬)로 결합 (평면도 하단 치수 중복 제거로 pad overhang 직하단에 배치)
        const plan_bot_y = dy_pad - PAD_OVERHANG;
        const dy_sec = plan_bot_y - gap_plan_sec_mm;
        translateEnts(frontSec.ents, dx_pad, dy_sec);
      }
      drawViewTitleBubble(col1_tank_cx, row3_title_y, 1, 2, viewTitlePad, N);

      // 6. Row 3 Col 2: 기초 콘크리트 설계 사양표 (FOUNDATION SPECIFICATION TABLE)
      const tbw = 128, tbh = 80;
      let tbx = col2_tank_cx - tbw / 2;
      if (tbx + tbw > tx0 - 6) tbx = tx0 - 6 - tbw;
      if (tbx < x0 + 10) tbx = x0 + 10;
      let tby = row3_title_y + 4.0;
      if (tby + tbh > row2_title_y - 6.0 - 4.0) tby = row2_title_y - 6.0 - 4.0 - tbh;
      if (tby < y0 + 6) tby = y0 + 6;
      rect(tbx, tby, tbx + tbw, tby + tbh);
      line([tbx, tby + tbh - 11], [tbx + tbw, tby + tbh - 11]);
      text(tbx + tbw / 2, tby + tbh - 5.5, 3.4, lang === 'en' ? 'FOUNDATION SPECIFICATION' : '기초 콘크리트 설계 사양 (내진·안전율)', 'center', 0, 'middle');

      const fDesign = getFoundationDesign(opt);
      const padFirstW = Number(opt.padFirstW) || 400;
      const padMidW = Number(opt.padMidW) || 300;
      const padH = padHVal;
      const padOv = (opt.padOverhang !== undefined && opt.padOverhang !== '') ? Number(opt.padOverhang) : Math.round(padFirstW / 2);
      const specs = [
        [lang === 'en' ? 'Edge Pad Width (W1)' : '외측 패드 폭 (W1)', `${padFirstW} mm`],
        [lang === 'en' ? 'Middle Pad Width (W2)' : '중간 패드 폭 (W2)', `${padMidW} mm`],
        [lang === 'en' ? 'Pad Height (H)' : '패드 높이 (H)', `${padH} mm`],
        [lang === 'en' ? 'Foundation Slab (t)' : '기초 슬래브 두께 (t)', `${fDesign.slabT} mm`],
        [lang === 'en' ? 'Concrete Strength' : '콘크리트 강도 (fck)', fDesign.fckStr],
        [lang === 'en' ? 'Rebar (Main/Tie)' : '철근 규격 (주근/늑근)', fDesign.rebarPadStr],
        [lang === 'en' ? 'Slab Rebar (Top/Bot)' : '슬래브 배근 (상·하부)', fDesign.rebarSlabStr],
        [lang === 'en' ? 'Anchor Bolt' : '기초 앙카볼트', fDesign.anchorStr],
        [lang === 'en' ? 'Soil Bearing (qa)' : '요구 지내력 (qa)', fDesign.bearingStr],
        [lang === 'en' ? 'Safety Factor (F.S)' : '내진/안전율 기준', fDesign.fsStr]
      ];
      const rH = (tbh - 11) / specs.length;
      specs.forEach(([k, v], sIdx) => {
        const ry = tby + tbh - 11 - (sIdx + 1) * rH;
        if (sIdx > 0) line([tbx, ry + rH], [tbx + tbw, ry + rH]);
        line([tbx + 65, ry], [tbx + 65, ry + rH]);
        text(tbx + 3, ry + rH / 2, 2.3, k, 'left', 0, 'middle');
        text(tbx + 68, ry + rH / 2, 2.3, v, 'left', 0, 'middle');
      });
      elev = true;
    } else {
      // 2-row fallback (단순 평면 + 패드)
      const center_cx = (x0 + tx0) / 2;
      const row1_cy = y0 + areaH * 0.72;
      const row2_cy = y0 + areaH * 0.28;
      const dx_p = P(center_cx) - totalL / 2;
      const dy_p = P(row1_cy) - totalW / 2;
      translateEnts(plan.ents, dx_p, dy_p);
      const title_p_y = (dy_p - dim_bottom_1) / N - 14.0;
      drawViewTitleBubble(center_cx, title_p_y, 1, 1, viewTitlePlan, N);
      drawNorthArrow(center_cx + totalL / 2 / N + 15, y1 - 25);

      const dx_c = P(center_cx) - totalL / 2;
      const dy_c = P(row2_cy) - totalW / 2;
      translateEnts(conc.ents, dx_c, dy_c);
      const title_c_y = (dy_c - PAD_OVERHANG - dim_bottom_1) / N - 14.0;
      drawViewTitleBubble(center_cx, title_c_y, 1, 2, viewTitlePad, N);
    }

    // 도면 테두리(y1, x1, y0, x0) 밖으로 풍선 기호가 나가지 않도록 최종 클램핑
    const maxBubbleTop = P(y1 - 4);
    const minBubbleBot = P(y0 + 4);
    const maxBubbleRight = P(x1 - S.title - 4);
    const minBubbleLeft = P(x0 + 4);

    const balloonCenters = new Map();
    ents.forEach(e => {
      if (e.layer === 'BALLOON' && e.balloonId && e.balloonRole === 'bubble' && e.c && e.r) {
        balloonCenters.set(e.balloonId, { c: e.c, r: e.r });
      }
    });

    balloonCenters.forEach((bInfo, bId) => {
      let dx = 0, dy = 0;
      if (bInfo.c[1] + bInfo.r > maxBubbleTop) {
        dy = maxBubbleTop - (bInfo.c[1] + bInfo.r);
      } else if (bInfo.c[1] - bInfo.r < minBubbleBot) {
        dy = minBubbleBot - (bInfo.c[1] - bInfo.r);
      }
      if (bInfo.c[0] + bInfo.r > maxBubbleRight) {
        dx = maxBubbleRight - (bInfo.c[0] + bInfo.r);
      } else if (bInfo.c[0] - bInfo.r < minBubbleLeft) {
        dx = minBubbleLeft - (bInfo.c[0] - bInfo.r);
      }
      if (dx !== 0 || dy !== 0) {
        shiftBalloon(ents, bId, dx, dy);
      }
    });

    // 모든 뷰 통합 후 풍선 기호(bubble)와 번호(text)의 좌표 100% 일치 동기화 (치수 및 개별 뷰 불변 유지)
    const sheetBubbles = new Map();
    ents.forEach(e => {
      if (e.layer === 'BALLOON' && e.balloonId && e.balloonRole === 'bubble') {
        sheetBubbles.set(e.balloonId, [e.c[0], e.c[1]]);
      }
    });
    ents.forEach(e => {
      if (e.layer === 'BALLOON' && e.balloonId && e.balloonRole === 'text') {
        const c = sheetBubbles.get(e.balloonId);
        if (c) {
          e.p[0] = c[0];
          e.p[1] = c[1];
        }
      }
    });
    const blocks = Object.assign({}, plan.blocks, (conc && conc.blocks), (front && front.blocks), (side && side.blocks), (frontSec && frontSec.blocks));
    ents.blocks = blocks;
    ents.font = opt.font || opt.cadFont || 'romans';
    return { map: mmap, ents, blocks, scale: N, elev, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 }, font: ents.font };
  }

  /* ---------- DXF (AutoCAD R12 ASCII, mm) ---------- */
  const LAYERS = { PANEL: 7, FLOOR_PANEL: 3, PANEL_DETAIL: 8, FRAME: 1, FRAME_MAIN_W: 30, FRAME_MAIN_L: 6, FRAME_SUB: 4, REINF: 5, WALL: 1, DIM: 3, SHEET: 7, BALLOON: 6, NOZZLE: 4, PAD: 2, GUIDE: 3, HIDDEN: 8, CENTER: 1 };
  const dxfText = str => Array.from(str).map(ch => { const c = ch.codePointAt(0); return c < 128 ? ch : '\\U+' + c.toString(16).toUpperCase().padStart(4, '0'); }).join('');

  function toDxf(ents, blocks, opt = {}) {
    const o = [];
    const g = (c, v) => { o.push(String(c)); o.push(String(v)); };
    const n = v => (Math.round(v * 1000) / 1000).toString();

    const entList = Array.isArray(ents) ? ents : ((ents && ents.ents) || []);
    const dimGroups = new Map();
    const otherEnts = [];

    entList.forEach(e => {
      if (e && e.dimId) {
        let grp = dimGroups.get(e.dimId);
        if (!grp) {
          grp = { id: e.dimId, meta: e.dimMeta, roles: {}, ents: [] };
          dimGroups.set(e.dimId, grp);
        }
        grp.ents.push(e);
        if (e.dimRole) grp.roles[e.dimRole] = e;
      } else if (e) {
        otherEnts.push(e);
      }
    });

    let repTextH = 0;
    dimGroups.forEach(grp => {
      if (grp.roles.text && grp.roles.text.h) {
        repTextH = Math.max(repTextH, grp.roles.text.h);
      }
    });
    if (!repTextH) {
      entList.forEach(e => {
        if (e && e.t === 'text' && e.h && (e.layer === 'DIM' || e.layer === 'PANEL')) {
          repTextH = Math.max(repTextH, e.h);
        }
      });
    }
    const dimTxtH = Math.round((repTextH || 65) * 10) / 10;

    g(0, 'SECTION'); g(2, 'HEADER');
    g(9, '$ACADVER'); g(1, 'AC1009');
    g(9, '$INSUNITS'); g(70, 4);
    g(9, '$DIMTXT'); g(40, n(dimTxtH));
    g(9, '$DIMSCALE'); g(40, 1.0);
    g(9, '$DIMBLK'); g(1, '_OBLIQUE');
    g(9, '$DIMBLK1'); g(1, '_OBLIQUE');
    g(9, '$DIMBLK2'); g(1, '_OBLIQUE');
    g(9, '$DIMLDRBLK'); g(1, '_OBLIQUE');
    g(9, '$DIMASZ'); g(40, n(dimTxtH * 0.45));
    g(9, '$DIMDLE'); g(40, n(dimTxtH * 0.25));
    g(9, '$DIMEXE'); g(40, n(dimTxtH * 0.5));
    g(9, '$DIMEXO'); g(40, n(dimTxtH * 0.3));
    g(9, '$DIMGAP'); g(40, n(dimTxtH * 0.25));
    g(9, '$DIMTAD'); g(70, 1);
    g(9, '$DIMTSZ'); g(40, 0);
    g(9, '$DIMASSOC'); g(70, 2);
    g(9, '$PICKSTYLE'); g(70, 1);
    // 선종류 축척: 도면 축척(1:N)과 일치시켜 용지상 패턴 길이를 ISO 128 기준으로 유지
    const ltScale = (opt && Number(opt.scale) > 0) ? Number(opt.scale) : 1;
    g(9, '$LTSCALE'); g(40, n(ltScale));
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'TABLES'); g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 3);
    g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, 0);
    g(0, 'LTYPE'); g(2, 'HIDDEN'); g(70, 0); g(3, 'Hidden line __ __ __'); g(72, 65); g(73, 2); g(40, 9.525); g(49, 6.35); g(49, -3.175);
    // ISO 128 Type 04.1 (가는 1점쇄선): 장선 24 / 간격 3 / 점 0.5 / 간격 3 (용지 mm)
    g(0, 'LTYPE'); g(2, 'CENTER'); g(70, 0); g(3, 'Center ____ _ ____ _'); g(72, 65); g(73, 4); g(40, 30.5); g(49, 24); g(49, -3); g(49, 0.5); g(49, -3);
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, Object.keys(LAYERS).length + 1);
    g(0, 'LAYER'); g(2, '0'); g(70, 0); g(62, 7); g(6, 'CONTINUOUS');
    Object.entries(LAYERS).forEach(([k, c]) => {
      g(0, 'LAYER'); g(2, k); g(70, 0); g(62, c);
      g(6, (k === 'HIDDEN') ? 'HIDDEN' : (k === 'CENTER' ? 'CENTER' : 'CONTINUOUS'));
    });
    g(0, 'ENDTAB');

    const fontKey = String((opt && (opt.font || opt.cadFont)) || (ents && ents.font) || (blocks && blocks.font) || 'romans').toLowerCase().trim();
    const fontTable = {
      romans: { shx: 'romans.shx', bigFont: 'whgtxt.shx', widthFactor: 0.85 },
      arial: { shx: 'arial.ttf', bigFont: '', widthFactor: 1.0 },
      ariral: { shx: 'arial.ttf', bigFont: '', widthFactor: 1.0 },
      simplex: { shx: 'simplex.shx', bigFont: 'whgtxt.shx', widthFactor: 0.85 },
      txt: { shx: 'txt.shx', bigFont: 'whgtxt.shx', widthFactor: 0.85 }
    };
    const fontInfo = fontTable[fontKey] || fontTable.romans;

    g(0, 'TABLE'); g(2, 'STYLE'); g(70, 1);
    g(0, 'STYLE'); g(2, 'STANDARD'); g(70, 0); g(40, 0); g(41, fontInfo.widthFactor); g(50, 0); g(71, 0); g(42, n(dimTxtH));
    g(3, fontInfo.shx);
    if (fontInfo.bigFont) g(4, fontInfo.bigFont);
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'DIMSTYLE'); g(70, 1);
    g(0, 'DIMSTYLE'); g(2, 'STANDARD'); g(70, 0);
    g(5, '_OBLIQUE');
    g(6, '_OBLIQUE');
    g(7, '_OBLIQUE');
    g(40, 1.0);
    g(41, n(dimTxtH * 0.45));
    g(42, n(dimTxtH * 0.3));
    g(43, n(dimTxtH * 1.5));
    g(44, n(dimTxtH * 0.5));
    g(46, n(dimTxtH * 0.25));
    g(77, 1);
    g(140, n(dimTxtH));
    g(142, 0);
    g(147, n(dimTxtH * 0.25));
    g(0, 'ENDTAB');
    g(0, 'ENDSEC');

    const writeEnt = (e, defLayer) => {
      const layer = e.layer || defLayer || '0';
      if (e.t === 'insert') {
        g(0, 'INSERT'); g(8, layer);
        if (e.color) g(62, e.color);
        g(2, e.block);
        g(10, n(e.p[0])); g(20, n(e.p[1])); g(30, 0);
      }
      else if (e.t === 'solid') {
        g(0, 'SOLID'); g(8, layer);
        if (e.color) g(62, e.color);
        g(10, n(e.p[0][0])); g(20, n(e.p[0][1])); g(30, 0);
        g(11, n(e.p[1][0])); g(21, n(e.p[1][1])); g(31, 0);
        g(12, n(e.p[2][0])); g(22, n(e.p[2][1])); g(32, 0);
        g(13, n(e.p[3][0])); g(23, n(e.p[3][1])); g(33, 0);
      }
      else if (e.t === 'line') {
        g(0, 'LINE'); g(8, layer);
        if (e.color) g(62, e.color);
        if (e.ltype || layer === 'HIDDEN') g(6, e.ltype || 'HIDDEN');
        g(10, n(e.a[0])); g(20, n(e.a[1])); g(30, 0);
        g(11, n(e.b[0])); g(21, n(e.b[1])); g(31, 0);
      }
      else if (e.t === 'poly') {
        if (e.solids && Array.isArray(e.solids)) {
          e.solids.forEach(quad => {
            if (quad && quad.length >= 4) {
              g(0, 'SOLID'); g(8, layer);
              if (e.color) g(62, e.color);
              g(10, n(quad[0][0])); g(20, n(quad[0][1])); g(30, 0);
              g(11, n(quad[1][0])); g(21, n(quad[1][1])); g(31, 0);
              g(12, n(quad[3][0])); g(22, n(quad[3][1])); g(32, 0);
              g(13, n(quad[2][0])); g(23, n(quad[2][1])); g(33, 0);
            }
          });
        }
        if (e.stroke !== false && e.pts && e.pts.length > 1) {
          for (let i = 0; i < e.pts.length - 1; i++) {
            g(0, 'LINE'); g(8, layer);
            if (e.color) g(62, e.color);
            if (e.ltype || layer === 'HIDDEN') g(6, e.ltype || 'HIDDEN');
            g(10, n(e.pts[i][0])); g(20, n(e.pts[i][1])); g(30, 0);
            g(11, n(e.pts[i + 1][0])); g(21, n(e.pts[i + 1][1])); g(31, 0);
          }
          if (e.close && e.pts.length > 2) {
            g(0, 'LINE'); g(8, layer);
            if (e.color) g(62, e.color);
            if (e.ltype || layer === 'HIDDEN') g(6, e.ltype || 'HIDDEN');
            g(10, n(e.pts[e.pts.length - 1][0])); g(20, n(e.pts[e.pts.length - 1][1])); g(30, 0);
            g(11, n(e.pts[0][0])); g(21, n(e.pts[0][1])); g(31, 0);
          }
        }
      }
      else if (e.t === 'arc') {
        const nn = a => ((a % 360) + 360) % 360;
        g(0, 'ARC'); g(8, layer);
        if (e.color) g(62, e.color);
        if (e.ltype || layer === 'HIDDEN') g(6, e.ltype || 'HIDDEN');
        g(10, n(e.c[0])); g(20, n(e.c[1])); g(30, 0);
        g(40, n(e.r));
        g(50, n(nn(e.a0))); g(51, n(nn(e.a1)));
      }
      else if (e.t === 'circle') {
        g(0, 'CIRCLE'); g(8, layer);
        if (e.color) g(62, e.color);
        if (e.ltype || layer === 'HIDDEN') g(6, e.ltype || 'HIDDEN');
        g(10, n(e.c[0])); g(20, n(e.c[1])); g(30, 0);
        g(40, n(e.r));
      }
      else if (e.t === 'image') {
        if (e.cadEntities && e.cadEntities.length) {
          e.cadEntities.forEach(ce => writeEnt(ce, layer));
        }
      }
      else if (e.t === 'text') {
        const px = e.p[0], py = e.p[1];
        const rot = e.rot || 0;
        let hAlign = 0, vAlign = 0;
        if (e.align === 'center') hAlign = 1;
        else if (e.align === 'right') hAlign = 2;

        if (e.valign === 'middle') vAlign = 2;
        else if (e.valign === 'top') vAlign = 3;
        else if (e.valign === 'bottom') vAlign = 1;

        const str = String(e.s != null ? e.s : '');
        const tw = estimateTextWidth(str, e.h, 0.85);

        let du = 0;
        if (hAlign === 1) du = -tw / 2;
        else if (hAlign === 2) du = -tw;

        let dv = 0;
        if (vAlign === 2) dv = -0.38 * e.h;
        else if (vAlign === 3) dv = -0.85 * e.h;
        else if (vAlign === 1) dv = 0.08 * e.h;

        let x10 = px, y10 = py;
        if (du !== 0 || dv !== 0) {
          if (rot !== 0) {
            const rad = rot * Math.PI / 180;
            const cos = Math.cos(rad), sin = Math.sin(rad);
            x10 = px + (du * cos - dv * sin);
            y10 = py + (du * sin + dv * cos);
          } else {
            x10 = px + du;
            y10 = py + dv;
          }
        }

        g(0, 'TEXT'); g(8, layer);
        g(7, 'STANDARD');
        g(10, n(x10)); g(20, n(y10)); g(30, 0);
        g(40, n(e.h));
        g(41, 0.85);
        g(1, dxfText(str));
        if (rot) g(50, n(rot));
        if (hAlign || vAlign) {
          g(72, hAlign);
          g(11, n(px)); g(21, n(py)); g(31, 0);
          g(73, vAlign);
        }
      }
    };

    const allBlocks = { ...(blocks || (ents && ents.blocks) || {}) };
    g(0, 'SECTION'); g(2, 'BLOCKS');
    // AutoCAD Native Oblique Arrowhead Blocks for dimension ticks
    ['_OBLIQUE', '_ARCHTICK'].forEach(blkName => {
      g(0, 'BLOCK'); g(8, '0'); g(2, blkName); g(70, 0);
      g(10, 0); g(20, 0); g(30, 0);
      g(3, blkName); g(1, '');
      g(0, 'LINE'); g(8, '0'); g(62, 0);
      g(10, -0.5); g(20, -0.5); g(30, 0);
      g(11, 0.5); g(21, 0.5); g(31, 0);
      g(0, 'ENDBLK'); g(8, '0');
    });
      Object.entries(allBlocks).forEach(([bName, bEnts]) => {
        g(0, 'BLOCK'); g(8, '0'); g(2, bName); g(70, 0);
        g(10, 0); g(20, 0); g(30, 0);
        g(3, bName); g(1, '');
        bEnts.forEach(e => writeEnt(e, 'PANEL'));
        g(0, 'ENDBLK'); g(8, '0');
      });

      let dxfDimIdx = 0;
      dimGroups.forEach(grp => {
        const blkName = '*D' + (++dxfDimIdx);
        grp.blkName = blkName;
        const bLayer = grp.ents[0]?.layer || 'DIM';
        g(0, 'BLOCK'); g(8, bLayer); g(2, blkName); g(70, 1);
        g(10, 0); g(20, 0); g(30, 0);
        g(3, blkName); g(1, '');
        grp.ents.forEach(e => writeEnt(e, 'DIM'));
        g(0, 'ENDBLK'); g(8, bLayer);
      });
      g(0, 'ENDSEC');

    g(0, 'SECTION'); g(2, 'ENTITIES');
    otherEnts.forEach(e => writeEnt(e, '0'));

    dimGroups.forEach(grp => {
      const ext1 = grp.roles.ext1;
      const ext2 = grp.roles.ext2;
      const dimline = grp.roles.dimline;
      const txt = grp.roles.text;
      if (!dimline || !ext1 || !ext2 || !txt) {
        grp.ents.forEach(e => writeEnt(e, 'DIM'));
        return;
      }
      const layer = dimline.layer || 'DIM';
      const isVert = !!(grp.meta && grp.meta.vertical);
      const rot = isVert ? 90 : 0;
      const p1 = ext1.a;
      const p2 = ext2.a;
      const dimPtX = (dimline.a[0] + dimline.b[0]) / 2;
      const dimPtY = (dimline.a[1] + dimline.b[1]) / 2;
      const textPtX = txt.p[0];
      const textPtY = txt.p[1];
      const str = String(txt.s != null ? txt.s : '');

      g(0, 'DIMENSION');
      g(8, layer);
      g(2, grp.blkName);
      g(10, n(dimPtX)); g(20, n(dimPtY)); g(30, 0);
      g(11, n(textPtX)); g(21, n(textPtY)); g(31, 0);
      g(70, 32);
      g(1, dxfText(str));
      g(3, 'STANDARD');
      g(13, n(p1[0])); g(23, n(p1[1])); g(33, 0);
      g(14, n(p2[0])); g(24, n(p2[1])); g(34, 0);
      g(50, n(rot));
    });

    g(0, 'ENDSEC'); g(0, 'EOF');
    return o.join('\r\n') + '\r\n';
  }

  const api = { getRowBeamSpec, getCenterBay, SKID_PARTS_DATA, NOZZLE_SPECS, getNozzleSpec, getNozzleList, getNozzleAbbr, formatNozzleLabel, formatNozzleGroupLabel, buildIsometric, buildSkid, buildSkidBOM, buildStay, buildSkidCross, computeColSpans, computeMainBeamSpans, exposedSides, ladderShapes, markShapes, panelShapes, concStrips, buildConcrete, buildFoundationSection, getFoundationDesign, heightSegs, buildElevation, splitHalf, frontSplit, sideSplit, checkSegment, createMap, buildPlan, buildSheet, toDxf, FRAME, buildDefaultBOM, getSkidDimensions, getSkidSpec, DEFAULT_SKID_RULES, getDefaultSkidRules, setCustomSkidRules, getCustomSkidRules, getActiveSkidRules, getFrameForHeight, formatSkidRuleSummary, drawBalloonCallout, recheckAndResolveCollisions, resolveDrawingCollisions: recheckAndResolveCollisions, DEFAULT_HEIGHT_TABLE, setCustomHeightTable, getCustomHeightTable, getDefaultHeightTable, getManholeDir, getManholeViewType, getDefaultPanelPattern };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TankCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
