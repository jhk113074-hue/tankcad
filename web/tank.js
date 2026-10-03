/* tank.js — YSACC TANK CAD(HighTank, VC6 MFC) 물탱크 도면 CAD 웹 이식본 (v1)
 * 원본: glFunc.cpp (gSideSplit / gFrontSplit), TankMap.cpp (SetWLCnt / CreateMap / TankPlane / TankPlaneDim),
 *       CeilLT.cpp (패널 내부 도형; PANEL_TEMPLATES 는 원본 C++ 에서 자동 변환)
 * 좌표: mm, x=가로(Length), y=세로(Width), y 위쪽이 +
 */
(function (root) {
  'use strict';

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

  /* ---------- 패널 내부 도형 (CeilLT) ---------- */
  function panelShapes(templates, mat, x, y, w, h) {
    const key = w + 'x' + h;
    const t = ((templates && (templates[mat] || templates.SMC)) || {})[key] || [];
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
          const p = rawP.map(q => [x + q[0], y + q[1]]);
          const isClosed = s.c !== false;
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

  function resolvePartEntities(customParts, cat, view, h) {
    if (!customParts) return null;
    if (h && customParts[`${cat}_${view}_${h}`] && customParts[`${cat}_${view}_${h}`].length) {
      return customParts[`${cat}_${view}_${h}`];
    }
    if (customParts[`${cat}_${view}`] && customParts[`${cat}_${view}`].length) {
      return customParts[`${cat}_${view}`];
    }
    if (view === 'left') {
      const rightEnts = resolvePartEntities(customParts, cat, 'right', h);
      if (rightEnts && rightEnts.length) return mirrorEntitiesH(rightEnts);
    }
    if (view === 'rear') {
      return resolvePartEntities(customParts, cat, 'front', h);
    }
    if (view === 'plan' && customParts[cat] && customParts[cat].length) {
      return customParts[cat];
    }
    if (customParts[cat] && customParts[cat].length) {
      return customParts[cat];
    }
    return null;
  }

  function renderCustomEntitiesAt(out, ents, ox, oy, scaleX = 1, scaleY = 1, layer = 'FRAME') {
    if (!ents || !ents.length) return;
    ents.forEach(e => {
      if (e.k === 'line') {
        out.push({
          t: 'line',
          a: [ox + e.p[0][0] * scaleX, oy + e.p[0][1] * scaleY],
          b: [ox + e.p[1][0] * scaleX, oy + e.p[1][1] * scaleY],
          layer: layer || 'FRAME'
        });
      } else if (e.k === 'circle') {
        out.push({
          t: 'circle',
          c: [ox + e.c[0] * scaleX, oy + e.c[1] * scaleY],
          r: Math.round(e.r * ((Math.abs(scaleX) + Math.abs(scaleY)) / 2)),
          layer: layer || 'FRAME'
        });
      } else if (e.k === 'arc') {
        out.push({
          t: 'arc',
          c: [ox + e.c[0] * scaleX, oy + e.c[1] * scaleY],
          r: Math.round(e.r * ((Math.abs(scaleX) + Math.abs(scaleY)) / 2)),
          a0: e.a0 || 0,
          a1: e.a1 || 360,
          layer: layer || 'FRAME'
        });
      } else if (e.k === 'poly') {
        const pts = e.p.map(p => [ox + p[0] * scaleX, oy + p[1] * scaleY]);
        for (let k = 0; k + 1 < pts.length; k++) {
          out.push({ t: 'line', a: pts[k], b: pts[k + 1], layer: layer || 'FRAME' });
        }
        if (e.c && pts.length > 2) {
          out.push({ t: 'line', a: pts[pts.length - 1], b: pts[0], layer: layer || 'FRAME' });
        }
      }
    });
  }

  /* ---------- 평면도 맨홀 손잡이 / 환기구 (CCeilLT::_1000BY1000 의 CLT_HANDLE=1, CLT_AIRVENT=2) : 1000x1000 패널만 ---------- */
  function markShapes(x, y, mark, opt) {
    const customParts = opt?.partTemplates || {};
    const out = [], P = (a, b) => [x + a, y + b];
    const poly = (pts, layer) => pts.forEach((p, k) => out.push({ t: 'line', a: P(...p), b: P(...pts[(k + 1) % pts.length]), layer }));

    if (mark & 1) { // 맨홀 (손잡이) 및 직하부 내부사다리
      const mhPlan = resolvePartEntities(customParts, 'manhole', 'plan');
      if (mhPlan && mhPlan.length > 0) {
        mhPlan.forEach(e => {
          if (e.k === 'line') out.push({ t: 'line', a: P(e.p[0][0], e.p[0][1]), b: P(e.p[1][0], e.p[1][1]), layer: 'FRAME' });
          else if (e.k === 'circle') out.push({ t: 'circle', c: P(e.c[0], e.c[1]), r: e.r, layer: 'FRAME' });
          else if (e.k === 'arc') out.push({ t: 'arc', c: P(e.c[0], e.c[1]), r: e.r, a0: e.a0, a1: e.a1, layer: 'FRAME' });
          else if (e.k === 'poly') poly(e.p, 'FRAME');
        });
        out.push({ t: 'text', p: P(500, (mark & 2) ? 610 : 500), s: 'MANHOLE 600', h: 60, rot: 0, align: 'center', layer: 'DIM' });
      } else {
        poly([[260, 105], [735, 105], [888, 260], [888, 735], [735, 888], [262, 888], [105, 735], [105, 260]], 'FRAME');
        poly([[150, 280], [290, 150], [710, 150], [850, 280], [850, 720], [710, 850], [290, 850], [150, 720]], 'FRAME');
        poly([[310, 110], [390, 110], [390, 67], [310, 67]], 'FRAME'); poly([[610, 110], [690, 110], [690, 67], [610, 67]], 'FRAME');
        poly([[462, 945], [538, 945], [538, 898], [462, 898]], 'FRAME');
        out.push({ t: 'circle', c: P(500, 500), r: 300, layer: 'FRAME' });
        out.push({ t: 'text', p: P(500, (mark & 2) ? 610 : 500), s: 'MANHOLE 600', h: 60, rot: 0, align: 'center', layer: 'DIM' });
      }

      // 내부사다리 (IN-LADDER) 기호 (맨홀 직하부 탱크 내부 설치 위치)
      const inladPlan = resolvePartEntities(customParts, 'inladder', 'plan');
      if (inladPlan && inladPlan.length > 0) {
        inladPlan.forEach(e => {
          if (e.k === 'line') out.push({ t: 'line', a: P(e.p[0][0], e.p[0][1]), b: P(e.p[1][0], e.p[1][1]), layer: 'FRAME' });
          else if (e.k === 'circle') out.push({ t: 'circle', c: P(e.c[0], e.c[1]), r: e.r, layer: 'FRAME' });
          else if (e.k === 'arc') out.push({ t: 'arc', c: P(e.c[0], e.c[1]), r: e.r, a0: e.a0, a1: e.a1, layer: 'FRAME' });
          else if (e.k === 'poly') poly(e.p, 'FRAME');
        });
        out.push({ t: 'text', p: P(500, 210), s: 'IN-LADDER', h: 42, rot: 0, align: 'center', layer: 'DIM' });
      } else {
        const ladX1 = 360, ladX2 = 640;
        out.push({ t: 'line', a: P(ladX1, 230), b: P(ladX1, 380), layer: 'FRAME' });
        out.push({ t: 'line', a: P(ladX2, 230), b: P(ladX2, 380), layer: 'FRAME' });
        for (let ry = 250; ry <= 370; ry += 40) {
          out.push({ t: 'line', a: P(ladX1, ry), b: P(ladX2, ry), layer: 'FRAME' });
        }
        out.push({ t: 'text', p: P(500, 210), s: 'IN-LADDER', h: 42, rot: 0, align: 'center', layer: 'DIM' });
      }
    }
    if (mark & 2) { // 에어벤트
      const ventPlan = resolvePartEntities(customParts, 'airvent', 'plan');
      if (ventPlan && ventPlan.length > 0) {
        ventPlan.forEach(e => {
          if (e.k === 'line') out.push({ t: 'line', a: P(e.p[0][0], e.p[0][1]), b: P(e.p[1][0], e.p[1][1]), layer: 'REINF' });
          else if (e.k === 'circle') out.push({ t: 'circle', c: P(e.c[0], e.c[1]), r: e.r, layer: 'REINF' });
          else if (e.k === 'arc') out.push({ t: 'arc', c: P(e.c[0], e.c[1]), r: e.r, a0: e.a0, a1: e.a1, layer: 'REINF' });
          else if (e.k === 'poly') poly(e.p, 'REINF');
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

  /* ---------- 사다리 (CLadderLT) : 1 위, 2 아래, 3 오른쪽, 4 왼쪽 (평면) / 5 정면, 6 뒤(상부만), 7 우측면, 8 좌측면 ---------- */
  function ladderShapes(idx, px, py, H, opt) {
    const customParts = opt?.partTemplates || {};
    if (idx >= 1 && idx <= 4) {
      const planEnts = resolvePartEntities(customParts, 'ladder', 'plan', H);
      if (planEnts && planEnts.length > 0) {
        const out = [], L = 'FRAME';
        const sx = idx === 3 ? 1 : idx === 4 ? -1 : 0, sy = idx === 1 ? 1 : idx === 2 ? -1 : 0;
        const angle = sy === 1 ? 0 : (sy === -1 ? Math.PI : (sx === 1 ? Math.PI / 2 : -Math.PI / 2));
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const trans = (x, y) => [px + (x * cosA - y * sinA), py + (x * sinA + y * cosA)];
        planEnts.forEach(e => {
          if (e.k === 'line') out.push({ t: 'line', a: trans(e.p[0][0], e.p[0][1]), b: trans(e.p[1][0], e.p[1][1]), layer: L });
          else if (e.k === 'circle') out.push({ t: 'circle', c: trans(e.c[0], e.c[1]), r: e.r, layer: L });
          else if (e.k === 'arc') out.push({ t: 'arc', c: trans(e.c[0], e.c[1]), r: e.r, a0: e.a0, a1: e.a1, layer: L });
          else if (e.k === 'poly') {
            const tpts = e.p.map(p => trans(p[0], p[1]));
            for (let k = 0; k + 1 < tpts.length; k++) out.push({ t: 'line', a: tpts[k], b: tpts[k + 1], layer: L });
            if (e.c) out.push({ t: 'line', a: tpts[tpts.length - 1], b: tpts[0], layer: L });
          }
        });
        out.push({ t: 'text', p: [px + sx * 315, py + sy * 315], s: 'LADDER', h: 50, rot: sx ? 90 : 0, align: 'center', layer: 'DIM' });
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
      const frontEnts = resolvePartEntities(customParts, 'ladder', 'front', H);
      if (frontEnts && frontEnts.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        frontEnts.forEach(e => {
          if (e.k === 'line') {
            minX = Math.min(minX, e.p[0][0], e.p[1][0]); maxX = Math.max(maxX, e.p[0][0], e.p[1][0]);
            minY = Math.min(minY, e.p[0][1], e.p[1][1]); maxY = Math.max(maxY, e.p[0][1], e.p[1][1]);
          } else if (e.k === 'circle' || e.k === 'arc') {
            minX = Math.min(minX, e.c[0] - e.r); maxX = Math.max(maxX, e.c[0] + e.r);
            minY = Math.min(minY, e.c[1] - e.r); maxY = Math.max(maxY, e.c[1] + e.r);
          } else if (e.k === 'poly') {
            e.p.forEach(pt => {
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
      const rearEnts = resolvePartEntities(customParts, 'ladder', 'rear', H) || resolvePartEntities(customParts, 'ladder', 'front', H);
      if (rearEnts && rearEnts.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        rearEnts.forEach(e => {
          if (e.k === 'line') {
            minX = Math.min(minX, e.p[0][0], e.p[1][0]); maxX = Math.max(maxX, e.p[0][0], e.p[1][0]);
            minY = Math.min(minY, e.p[0][1], e.p[1][1]); maxY = Math.max(maxY, e.p[0][1], e.p[1][1]);
          } else if (e.k === 'circle' || e.k === 'arc') {
            minX = Math.min(minX, e.c[0] - e.r); maxX = Math.max(maxX, e.c[0] + e.r);
            minY = Math.min(minY, e.c[1] - e.r); maxY = Math.max(maxY, e.c[1] + e.r);
          } else if (e.k === 'poly') {
            e.p.forEach(pt => {
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
      const sideEnts = resolvePartEntities(customParts, 'ladder', sideKey, H);
      if (sideEnts && sideEnts.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        sideEnts.forEach(e => {
          if (e.k === 'line') {
            minX = Math.min(minX, e.p[0][0], e.p[1][0]); maxX = Math.max(maxX, e.p[0][0], e.p[1][0]);
            minY = Math.min(minY, e.p[0][1], e.p[1][1]); maxY = Math.max(maxY, e.p[0][1], e.p[1][1]);
          } else if (e.k === 'circle' || e.k === 'arc') {
            minX = Math.min(minX, e.c[0] - e.r); maxX = Math.max(maxX, e.c[0] + e.r);
            minY = Math.min(minY, e.c[1] - e.r); maxY = Math.max(maxY, e.c[1] + e.r);
          } else if (e.k === 'poly') {
            e.p.forEach(pt => {
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
    Object.entries(opt.ladders || {}).forEach(([k, sd]) => {
      const [i, j] = k.split(',').map(Number);
      if (!map.has(i, j)) return;
      const x0 = map.xs[j], x1 = x0 + map.cols[j], y0 = map.ys[i], y1 = y0 + map.rows[i];
      const cx = (x0 + x1) >> 1, cy = (y0 + y1) >> 1;
      if (sd === 'U') res.push({ sd, idx: 1, x: cx, y: y1 });
      else if (sd === 'D') res.push({ sd, idx: 2, x: cx, y: y0 });
      else if (sd === 'R') res.push({ sd, idx: 3, x: x1, y: cy });
      else if (sd === 'L') res.push({ sd, idx: 4, x: x0, y: cy });
    });
    // 사다리가 명시적으로 설정되지 않았거나 지정된 셀이 삭제된 경우,
    // 실제로 존재하는 노출 외벽 셀을 자동 탐색하여 유효한 기본 사다리 위치 제공
    if (res.length === 0 && map && map.rows && map.cols) {
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
          elev: (n.face === 'top' || n.elev === 'TOP') ? 'TOP' : (Number(n.elev) || 0),
          topCell: Array.isArray(n.topCell) ? n.topCell : [0, 0]
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
          type: String(n.type || 'FLANGE').toUpperCase(),
          face: String(n.face || (def.key === 'inlet' ? 'front' : def.key === 'overflow' ? 'right' : 'front')).toLowerCase(),
          seg: Number(n.seg) || 1,
          offset: Number(n.offset) || 0,
          elev: (n.face === 'top' || n.elev === 'TOP') ? 'TOP' : (Number(n.elev) || (def.key === 'fire' ? 200 : 0)),
          topCell: Array.isArray(n.topCell) ? n.topCell : [0, 0]
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
          elev: (n.face === 'top' || n.elev === 'TOP') ? 'TOP' : (Number(n.elev) || 0),
          topCell: Array.isArray(n.topCell) ? n.topCell : [0, 0]
        });
      }
    });
    return list;
  }
  function drawLeader(ents, startPt, elbowPt, endPt, lines, textH, align, layer) {
    layer = layer || 'DIM';
    ents.push({ t: 'line', a: startPt, b: elbowPt, layer });
    ents.push({ t: 'line', a: elbowPt, b: endPt, layer });
    ents.push({ t: 'circle', c: startPt, r: Math.max(3, Math.round(textH * 0.15)), layer });
    const isRight = align === 'left';
    const textX = endPt[0] + (isRight ? textH * 0.35 : -textH * 0.35);
    const lineSpacing = textH * 1.35;
    lines.forEach((l, idx) => {
      const textY = endPt[1] + (lines.length - 1 - idx) * lineSpacing + textH * 0.35;
      ents.push({ t: 'text', p: [textX, textY], h: textH, s: l, align, valign: 'baseline', layer });
    });
  }

  /* ---------- 부품 풍선 기호 (Circular Balloon Callout with Leader) ---------- */
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
    const balloonR = Math.round(3.8 * scaleN);
    const textH = Math.round(2.8 * scaleN);

    // 단부 점 (Terminal dot)
    ents.push({ t: 'circle', c: startPt, r: Math.max(3, Math.round(scaleN * 0.2)), layer, balloonNo: str });

    // 지시선 (Leader line)
    if (elbowPt && (elbowPt[0] !== startPt[0] || elbowPt[1] !== startPt[1])) {
      const dx = balloonCenter[0] - elbowPt[0], dy = balloonCenter[1] - elbowPt[1];
      const dist = Math.hypot(dx, dy) || 1;
      const endPt = [balloonCenter[0] - (dx / dist) * balloonR, balloonCenter[1] - (dy / dist) * balloonR];
      ents.push({ t: 'line', a: startPt, b: elbowPt, layer, balloonNo: str });
      ents.push({ t: 'line', a: elbowPt, b: endPt, layer, balloonNo: str });
    } else {
      const dx = balloonCenter[0] - startPt[0], dy = balloonCenter[1] - startPt[1];
      const dist = Math.hypot(dx, dy) || 1;
      const endPt = [balloonCenter[0] - (dx / dist) * balloonR, balloonCenter[1] - (dy / dist) * balloonR];
      ents.push({ t: 'line', a: startPt, b: endPt, layer, balloonNo: str });
    }

    // 원형 풍선 (Circular balloon)
    ents.push({ t: 'circle', c: balloonCenter, r: balloonR, layer, balloonNo: str });

    // 풍선 내부 번호 (Center text)
    ents.push({ t: 'text', p: balloonCenter, h: textH, s: str, rot: 0, align: 'center', valign: 'middle', layer, balloonNo: str });
    return true;
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
    const ladderCount = Object.keys(opt.ladders || {}).length || 1;
    const nozzleList = getNozzleList(opt);
    const padH = (typeof opt.padH === 'number' && !isNaN(opt.padH)) ? opt.padH : (600 - (opt.frame || 75));

    if (lang === 'en') {
      return [
        { no: 1, key: 'foundation', name: 'Concrete Foundation', mat: 'CONC', qty: '1 Set', spec: `Refer Foundation Pad plan (H${padH})` },
        { no: 2, key: 'skid', name: 'Skid Frame', mat: 'SS275(HDG)', qty: '1 Set', spec: 'Main: [-75x75x6T, Sub: [-75x40x5T' },
        { no: 3, key: 'panel', name: 'Panel (Bottom/Side/Roof)', mat: mat, qty: '1 Set', spec: `All ${mat} Panels (${totalW}W x ${totalL}L x ${H}H)` },
        { no: 4, key: 'corner', name: 'Corner Frame', mat: 'HDG', qty: '4 Sets', spec: 'L-70x70x8.0T' },
        { no: 5, key: 'airvent', name: 'Air Vent', mat: 'ABS', qty: `${ventCount || 1} EA`, spec: 'Φ50 (Insect screen #20 attached)' },
        { no: 6, key: 'manhole', name: 'Manhole', mat: mat, qty: `${manholeCount || 1} EA`, spec: 'Ø600 Double cover with lock' },
        { no: 7, key: 'inladder', name: 'Internal Ladder', mat: 'FRP', qty: `${ladderCount} Set`, spec: `L=${H}mm` },
        { no: 8, key: 'exladder', name: 'External Ladder', mat: 'HDG', qty: `${ladderCount} Set`, spec: 'Vertical: 20x30x1.2T, W=270' },
        { no: 9, key: 'flangebar', name: 'Flange Bar', mat: 'HDG', qty: '1 Set', spec: 'L-65x30x3T etc.' },
        { no: 10, key: 'stay', name: 'Internal Stay', mat: 'SS316+PE', qty: '1 Set', spec: 'Φ-10.7 Tie-Rod(M12)' },
        { no: 11, key: 'nozzle', name: 'Nozzles', mat: 'STS304', qty: `${nozzleList.length || 0} EA`, spec: 'JIS 10K Flange / Socket' }
      ];
    } else if (lang === 'ko') {
      return [
        { no: 1, key: 'foundation', name: '기초 콘크리트 (Foundation)', mat: 'CONC', qty: '1식', spec: `기초 패드 도면 참조 (H${padH})` },
        { no: 2, key: 'skid', name: '스키드 프레임 (Skid Frame)', mat: 'SS275(HDG)', qty: '1식', spec: '주찬넬: [-75x75x6T, 종찬넬: [-75x40x5T' },
        { no: 3, key: 'panel', name: '본체 판넬 (바닥/측면/지붕)', mat: mat, qty: '1식', spec: `전체 ${mat} 판넬 (${totalW}W x ${totalL}L x ${H}H)` },
        { no: 4, key: 'corner', name: '코너 프레임 (Corner Frame)', mat: 'HDG', qty: '4조', spec: 'L-70x70x8.0T' },
        { no: 5, key: 'airvent', name: '에어벤트 (Air Vent)', mat: 'ABS', qty: `${ventCount || 1}개`, spec: 'Φ50 (합성수지 방충망 #20 부착)' },
        { no: 6, key: 'manhole', name: '맨홀 (Manhole)', mat: mat, qty: `${manholeCount || 1}개`, spec: 'Ø600 쇄정식 이중덮개 부착' },
        { no: 7, key: 'inladder', name: '내부 사다리 (Internal Ladder)', mat: 'FRP', qty: `${ladderCount}조`, spec: `L=${H}mm` },
        { no: 8, key: 'exladder', name: '외부 사다리 (External Ladder)', mat: 'HDG', qty: `${ladderCount}조`, spec: '세로대: 20x30x1.2T, 폭 270' },
        { no: 9, key: 'flangebar', name: '플랜지 바 (Flange Bar)', mat: 'HDG', qty: '1식', spec: 'L-65x30x3T 등' },
        { no: 10, key: 'stay', name: '내부 스테이 (Internal Stay)', mat: 'SS316+PE', qty: '1식', spec: 'Φ-10.7 Tie-Rod(M12)' },
        { no: 11, key: 'nozzle', name: '배관 노즐 (Nozzles)', mat: 'STS304', qty: `${nozzleList.length || 0}개`, spec: 'JIS 10K Flange / Socket' }
      ];
    } else { // bilingual
      return [
        { no: 1, key: 'foundation', name: 'Concrete Foundation', mat: 'CONC', qty: '1 Set (1식)', spec: `Refer Foundation Pad plan (H${padH})` },
        { no: 2, key: 'skid', name: 'Skid Frame', mat: 'SS275(HDG)', qty: '1 Set (1식)', spec: 'Main: [-75x75x6T, Sub: [-75x40x5T' },
        { no: 3, key: 'panel', name: 'Panel (Bottom/Side/Roof)', mat: mat, qty: '1 Set (1식)', spec: `All ${mat} Panels (${totalW}W x ${totalL}L x ${H}H)` },
        { no: 4, key: 'corner', name: 'Corner Frame', mat: 'HDG', qty: '4 Sets (4조)', spec: 'L-70x70x8.0T' },
        { no: 5, key: 'airvent', name: 'Air Vent', mat: 'ABS', qty: `${ventCount || 1} EA`, spec: 'Φ50 (Insect screen #20 attached)' },
        { no: 6, key: 'manhole', name: 'Manhole', mat: mat, qty: `${manholeCount || 1} EA`, spec: 'Ø600 Double cover with lock' },
        { no: 7, key: 'inladder', name: 'Internal Ladder', mat: 'FRP', qty: `${ladderCount} Set (조)`, spec: `L=${H}mm` },
        { no: 8, key: 'exladder', name: 'External Ladder', mat: 'HDG', qty: `${ladderCount} Set (조)`, spec: 'Vertical: 20x30x1.2T, W=270' },
        { no: 9, key: 'flangebar', name: 'Flange Bar', mat: 'HDG', qty: '1 Set (1식)', spec: 'L-65x30x3T etc.' },
        { no: 10, key: 'stay', name: 'Internal Stay', mat: 'SS316+PE', qty: '1 Set (1식)', spec: 'Φ-10.7 Tie-Rod(M12)' },
        { no: 11, key: 'nozzle', name: 'Nozzles', mat: 'STS304', qty: `${nozzleList.length || 0} EA`, spec: 'JIS 10K Flange / Socket' }
      ];
    }
  }

  /* ---------- 평면도 생성 (TankPlane + TankPlaneDim 상당, 직사각형 탱크) ---------- */
  const FRAME = 75, DIM_OFF = 140;   // 원본 상수: 틀 75, 외부보강 140
  function dimLinear(ents, p1, p2, off, vertical, text, textH, layer) {
    const span = vertical ? Math.abs(p2[1] - p1[1]) : Math.abs(p2[0] - p1[0]);
    // 1. 작은 구간(75mm, 100mm 등)에 대한 축척 적응형 텍스트 크기 및 틱 크기
    const curTextH = span < textH * 1.6 ? Math.max(Math.round(textH * 0.65), Math.min(textH, Math.round(span * 0.70))) : textH;
    const tick = Math.min(Math.round(curTextH * 0.28), Math.max(8, Math.round(span * 0.20)));
    const extOver = Math.min(Math.round(curTextH * 0.20), Math.max(6, Math.round(span * 0.15)));

    // 치수선과 텍스트 사이의 여백 (글씨가 절대 선이나 틱에 닿지 않도록 충분한 이격 거리 확보)
    // 텍스트는 valign: 'middle'이므로 문자 높이 절반 + 틱 높이 + 안전 여백 확보: 1.05 * curTextH
    const textOffset = Math.round(curTextH * 1.05);

    if (!vertical) {                           // 수평 치수선, off 는 y 방향 위치
      const y = off;
      const dir = y >= p1[1] ? 1 : -1;
      ents.push({ t: 'line', a: [p1[0], p1[1]], b: [p1[0], y + dir * extOver], layer });
      ents.push({ t: 'line', a: [p2[0], p2[1]], b: [p2[0], y + dir * extOver], layer });
      ents.push({ t: 'line', a: [p1[0], y], b: [p2[0], y], layer });
      ents.push({ t: 'line', a: [p1[0] - tick, y - tick], b: [p1[0] + tick, y + tick], layer });
      ents.push({ t: 'line', a: [p2[0] - tick, y - tick], b: [p2[0] + tick, y + tick], layer });
      // 수평 치수 문자는 항상 치수선 위쪽에 배치 (줄에 걸치지 않음)
      ents.push({ t: 'text', p: [(p1[0] + p2[0]) / 2, y + textOffset], h: curTextH, s: text, rot: 0, align: 'center', valign: 'middle', layer });
    } else {                                   // 수직 치수선, off 는 x 방향 위치
      const x = off;
      const objX = (p1[0] + p2[0]) / 2;
      const isLeft = x <= objX;
      const dir = isLeft ? -1 : 1;
      ents.push({ t: 'line', a: [p1[0], p1[1]], b: [x + dir * extOver, p1[1]], layer });
      ents.push({ t: 'line', a: [p2[0], p2[1]], b: [x + dir * extOver, p2[1]], layer });
      ents.push({ t: 'line', a: [x, p1[1]], b: [x, p2[1]], layer });
      ents.push({ t: 'line', a: [x - tick, p1[1] - tick], b: [x + tick, p1[1] + tick], layer });
      ents.push({ t: 'line', a: [x - tick, p2[1] - tick], b: [x + tick, p2[1] + tick], layer });
      // 수직 치수 문자는 왼쪽 치수선의 경우 선 왼쪽, 오른쪽 치수선의 경우 선 오른쪽에 배치
      const textX = isLeft ? x - textOffset : x + textOffset;
      ents.push({ t: 'text', p: [textX, (p1[1] + p2[1]) / 2], h: curTextH, s: text, rot: 90, align: 'center', valign: 'middle', layer });
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
          ...panelShapes(templates, mat, 0, 0, w, h)
        ];
        blocks[blkName] = bEnts;
      }
      return blkName;
    };

    // 패널 (블럭 단위 삽입)
    for (let i = 0; i < map.rows.length; i++) {
      for (let j = 0; j < map.cols.length; j++) {
        if (!map.has(i, j)) continue;
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
      if (map.has(i, j) && map.cols[j] === 1000 && map.rows[i] === 1000) ents.push(...markShapes(map.xs[j], map.ys[i], m, opt));
    });
    // 기둥 표시 (삭제된 패널 중심): 정사각 + 대각선 (원본 심볼은 미확인 → 근사)
    (opt.pillars || []).forEach(([i, j]) => {
      if (!map.removed.has(i + ',' + j) || i >= map.rows.length || j >= map.cols.length) return;
      const cx = (map.xs[j] + map.xs[j + 1]) / 2, cy = (map.ys[i] + map.ys[i + 1]) / 2, h = Math.min(map.cols[j], map.rows[i]) * 0.35;
      chain([[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]], 'REINF', true);
      ln([cx - h, cy - h], [cx + h, cy + h], 'REINF'); ln([cx - h, cy + h], [cx + h, cy - h], 'REINF');
    });
    // 구간 경계 벽 (CWallLT: 반지름 20 원을 100mm 간격, 경계선에서 -30 떨어져 배치; 원본은 분할 시 baseX=0 사용)
    const cellAtXY = (x, y) => { const j = map.xs.findIndex((v, k) => x >= v && x < map.xs[k + 1]), i = map.ys.findIndex((v, k) => y >= v && y < map.ys[k + 1]); return j >= 0 && i >= 0 && map.has(i, j); };
    const WALL_R = 20, WALL_OFF = -30, WALL_INT = 100;
    const circ = (x, y, first) => ents.push({ t: 'circle', c: [x, y], r: WALL_R, layer: 'WALL', first });
    const L5 = (opt.length || []).slice(0, 5), W5 = (opt.width || []).slice(0, 5);
    for (let i = 1, nLen = W5[0]; i < 5 && W5[i]; nLen += W5[i++]) {
      let x = 0;
      L5.forEach(len => { if (!len) return; frontSplit(len, 0).forEach(cx => {
        const dx = cx >> 1; if (!cellAtXY(x + dx, nLen - 1) && !cellAtXY(x + dx, nLen + 1)) { x += cx; return; }
        ln([x, nLen], [x + cx, nLen], 'WALL');
        circ(x + dx, nLen + WALL_OFF);
        for (let k = 1; cx > dx + k * WALL_INT; k++) { circ(x + dx + k * WALL_INT, nLen + WALL_OFF); circ(x + dx - k * WALL_INT, nLen + WALL_OFF); }
        x += cx; }); });
    }
    for (let i = 1, nLen = L5[0]; i < 5 && L5[i]; nLen += L5[i++]) {
      let y = 0;
      W5.forEach(wid => { if (!wid) return; sideSplit(wid, 0).forEach(cy => {
        const dy = cy >> 1; if (!cellAtXY(nLen - 1, y + dy) && !cellAtXY(nLen + 1, y + dy)) { y += cy; return; }
        ln([nLen, y], [nLen, y + cy], 'WALL');
        circ(nLen + WALL_OFF, y + dy, true);
        for (let k = 1; cy > dy + k * WALL_INT; k++) { circ(nLen + WALL_OFF, y + dy + k * WALL_INT); circ(nLen + WALL_OFF, y + dy - k * WALL_INT); }
        y += cy; }); });
    }

    const N = opt._N || 25;

    // 배관 노즐 (INLET, OUTLET, OVERFLOW, DRAIN, FIRE 등) 평면도 배치 (글로벌 표준 간결 표기)
    const nozList = getNozzleList(opt);
    const nozTextH = Math.round(2.2 * N);
    nozList.forEach((n, idx) => {
      const spec = getNozzleSpec(n.size);
      const isFlg = n.type === 'FLANGE';
      const label = `[${n.mark}] ${n.size}`;
      const offVal = n.offset || 0;
      
      if (n.face === 'top') {
        const i = Math.max(0, Math.min(n.topCell[0], map.rows.length - 1));
        const j = Math.max(0, Math.min(n.topCell[1], map.cols.length - 1));
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
        drawLeader(ents, [cx + spec.r * 0.7, cy + spec.r * 0.7], [cx + spec.r * 0.7 + leadLen * 0.5, cy + spec.r * 0.7 + leadLen * 0.5 + stagger], [cx + spec.r * 0.7 + leadLen * 1.2, cy + spec.r * 0.7 + leadLen * 0.5 + stagger], [label], nozTextH, 'left', 'NOZZLE');
      } else if (n.face === 'front') {
        const colIdx = Math.max(0, Math.min(n.seg - 1, map.cols.length - 1));
        const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + offVal;
        const yBase = -F;
        const toRight = cx >= map.length / 2;
        const stagger = (idx % 2) * Math.round(1.5 * N);
        if (isFlg) {
          const yPlate1 = yBase - spec.neckLen;
          const yPlate0 = yPlate1 + spec.flgThick;
          ln([cx - spec.r, yBase], [cx - spec.r, yPlate0], 'NOZZLE');
          ln([cx + spec.r, yBase], [cx + spec.r, yPlate0], 'NOZZLE');
          chain([[cx - spec.rf, yPlate1], [cx + spec.rf, yPlate1], [cx + spec.rf, yPlate0], [cx - spec.rf, yPlate0]], 'NOZZLE', true);
          const ey = yPlate1 + Math.round(1.0 * N) + stagger;
          const dx = toRight ? Math.round(2.5 * N) : -Math.round(2.5 * N);
          const ex = toRight ? (cx + dx + Math.round(2.5 * N)) : (cx + dx - Math.round(2.5 * N));
          drawLeader(ents, [cx, yPlate1], [cx + dx, ey], [ex, ey], [label], nozTextH, toRight ? 'left' : 'right', 'NOZZLE');
        } else {
          const yEnd = yBase - spec.sockLen;
          chain([[cx - spec.sockR, yEnd], [cx + spec.sockR, yEnd], [cx + spec.sockR, yBase], [cx - spec.sockR, yBase]], 'NOZZLE', true);
          ln([cx - spec.r, yEnd], [cx + spec.r, yEnd], 'NOZZLE');
          const ey = yEnd + Math.round(1.0 * N) + stagger;
          const dx = toRight ? Math.round(2.5 * N) : -Math.round(2.5 * N);
          const ex = toRight ? (cx + dx + Math.round(2.5 * N)) : (cx + dx - Math.round(2.5 * N));
          drawLeader(ents, [cx, yEnd], [cx + dx, ey], [ex, ey], [label], nozTextH, toRight ? 'left' : 'right', 'NOZZLE');
        }
      } else if (n.face === 'rear') {
        const colIdx = Math.max(0, Math.min(n.seg - 1, map.cols.length - 1));
        const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + offVal;
        const yBase = W + F;
        const toRight = cx >= map.length / 2;
        const stagger = (idx % 2) * Math.round(1.5 * N);
        if (isFlg) {
          const yPlate1 = yBase + spec.neckLen;
          const yPlate0 = yPlate1 - spec.flgThick;
          ln([cx - spec.r, yBase], [cx - spec.r, yPlate0], 'NOZZLE');
          ln([cx + spec.r, yBase], [cx + spec.r, yPlate0], 'NOZZLE');
          chain([[cx - spec.rf, yPlate0], [cx + spec.rf, yPlate0], [cx + spec.rf, yPlate1], [cx - spec.rf, yPlate1]], 'NOZZLE', true);
          const ey = yPlate1 - Math.round(1.0 * N) - stagger;
          const dx = toRight ? Math.round(2.5 * N) : -Math.round(2.5 * N);
          const ex = toRight ? (cx + dx + Math.round(2.5 * N)) : (cx + dx - Math.round(2.5 * N));
          drawLeader(ents, [cx, yPlate1], [cx + dx, ey], [ex, ey], [label], nozTextH, toRight ? 'left' : 'right', 'NOZZLE');
        } else {
          const yEnd = yBase + spec.sockLen;
          chain([[cx - spec.sockR, yBase], [cx + spec.sockR, yBase], [cx + spec.sockR, yEnd], [cx - spec.sockR, yEnd]], 'NOZZLE', true);
          ln([cx - spec.r, yEnd], [cx + spec.r, yEnd], 'NOZZLE');
          const ey = yEnd - Math.round(1.0 * N) - stagger;
          const dx = toRight ? Math.round(2.5 * N) : -Math.round(2.5 * N);
          const ex = toRight ? (cx + dx + Math.round(2.5 * N)) : (cx + dx - Math.round(2.5 * N));
          drawLeader(ents, [cx, yEnd], [cx + dx, ey], [ex, ey], [label], nozTextH, toRight ? 'left' : 'right', 'NOZZLE');
        }
      } else if (n.face === 'left') {
        const rowIdx = Math.max(0, Math.min(n.seg - 1, map.rows.length - 1));
        const cy = (map.ys[rowIdx] + map.ys[rowIdx + 1]) / 2 + offVal;
        const xBase = -F;
        const toTop = cy >= map.width / 2;
        const stagger = (idx % 2) * Math.round(1.5 * N);
        if (isFlg) {
          const xPlate1 = xBase - spec.neckLen;
          const xPlate0 = xPlate1 + spec.flgThick;
          ln([xBase, cy - spec.r], [xPlate0, cy - spec.r], 'NOZZLE');
          ln([xBase, cy + spec.r], [xPlate0, cy + spec.r], 'NOZZLE');
          chain([[xPlate1, cy - spec.rf], [xPlate0, cy - spec.rf], [xPlate0, cy + spec.rf], [xPlate1, cy + spec.rf]], 'NOZZLE', true);
          const ey = cy + (toTop ? Math.round(2.0 * N) : -Math.round(2.0 * N)) + stagger;
          const elbowX = (-F - Math.round(18.0 * N)) - Math.round(3.0 * N);
          const shelfEndX = elbowX - Math.round(2.5 * N);
          drawLeader(ents, [xPlate1, cy], [elbowX, ey], [shelfEndX, ey], [label], nozTextH, 'right', 'NOZZLE');
        } else {
          const xEnd = xBase - spec.sockLen;
          chain([[xEnd, cy - spec.sockR], [xBase, cy - spec.sockR], [xBase, cy + spec.sockR], [xEnd, cy + spec.sockR]], 'NOZZLE', true);
          ln([xEnd, cy - spec.r], [xEnd, cy + spec.r], 'NOZZLE');
          const ey = cy + (toTop ? Math.round(2.0 * N) : -Math.round(2.0 * N)) + stagger;
          const elbowX = (-F - Math.round(18.0 * N)) - Math.round(3.0 * N);
          const shelfEndX = elbowX - Math.round(2.5 * N);
          drawLeader(ents, [xEnd, cy], [elbowX, ey], [shelfEndX, ey], [label], nozTextH, 'right', 'NOZZLE');
        }
      } else if (n.face === 'right') {
        const rowIdx = Math.max(0, Math.min(n.seg - 1, map.rows.length - 1));
        const cy = (map.ys[rowIdx] + map.ys[rowIdx + 1]) / 2 + offVal;
        const xBase = L + F;
        const toTop = cy >= map.width / 2;
        const stagger = (idx % 2) * Math.round(1.5 * N);
        if (isFlg) {
          const xPlate1 = xBase + spec.neckLen;
          const xPlate0 = xPlate1 - spec.flgThick;
          ln([xBase, cy - spec.r], [xPlate0, cy - spec.r], 'NOZZLE');
          ln([xBase, cy + spec.r], [xPlate0, cy + spec.r], 'NOZZLE');
          chain([[xPlate0, cy - spec.rf], [xPlate1, cy - spec.rf], [xPlate1, cy + spec.rf], [xPlate0, cy + spec.rf]], 'NOZZLE', true);
          const ey = cy + (toTop ? Math.round(2.0 * N) : -Math.round(2.0 * N)) + stagger;
          drawLeader(ents, [xPlate1, cy], [xPlate1 + Math.round(2.0 * N), ey], [xPlate1 + Math.round(4.5 * N), ey], [label], nozTextH, 'left', 'NOZZLE');
        } else {
          const xEnd = xBase + spec.sockLen;
          chain([[xBase, cy - spec.sockR], [xEnd, cy - spec.sockR], [xEnd, cy + spec.sockR], [xBase, cy + spec.sockR]], 'NOZZLE', true);
          ln([xEnd, cy - spec.r], [xEnd, cy + spec.r], 'NOZZLE');
          const ey = cy + (toTop ? Math.round(2.0 * N) : -Math.round(2.0 * N)) + stagger;
          drawLeader(ents, [xEnd, cy], [xEnd + Math.round(2.0 * N), ey], [xEnd + Math.round(4.5 * N), ey], [label], nozTextH, 'left', 'NOZZLE');
        }
      }
    });

    // 치수선 (축척 비례 계산 - 표준 정위치 고정)
    const textH = Math.round(3.0 * N);
    const dimGap1 = Math.round(10.0 * N);
    const dimGap2 = Math.round(18.0 * N);
    const baseX = -F - dimGap1;
    const baseY = -F - dimGap1;
    const overallX = -F - dimGap2;
    const overallY = -F - dimGap2;

    dimLinear(ents, [-F, 0], [0, 0], baseY, false, String(F), textH, 'DIM');
    map.cols.forEach((c, j) => dimLinear(ents, [map.xs[j], 0], [map.xs[j + 1], 0], baseY, false, String(c), textH, 'DIM'));
    dimLinear(ents, [L, 0], [L + F, 0], baseY, false, String(F), textH, 'DIM');
    dimLinear(ents, [-F, 0], [L + F, 0], overallY, false, String(L + 2 * F), textH, 'DIM');
    dimLinear(ents, [0, -F], [0, 0], baseX, true, String(F), textH, 'DIM');
    map.rows.forEach((r, i) => dimLinear(ents, [0, map.ys[i]], [0, map.ys[i + 1]], baseX, true, String(r), textH, 'DIM'));
    dimLinear(ents, [0, W], [0, W + F], baseX, true, String(F), textH, 'DIM');
    dimLinear(ents, [0, -F], [0, W + F], overallX, true, String(W + 2 * F), textH, 'DIM');

    // 부품 풍선 기호 (Plan View Balloon Callouts - 모두 물탱크 형상 및 치수선 바깥 외곽에 정렬)
    if (opt.showBalloons !== false) {
      const boms = (opt.itemList && opt.itemList.length) ? opt.itemList : buildDefaultBOM(opt);
      const getItemNo = key => {
        const it = boms.find(b => b.key === key);
        return it ? it.no : '';
      };

      const topBaseY = W + F + Math.round(18 * N);
      const topStaggerY = W + F + Math.round(28 * N);
      const rightBaseX = L + F + Math.round(18 * N);
      const botClearY = overallY - Math.round(14 * N);
      const leftClearX = overallX - Math.round(14 * N);

      // 1. 맨홀 (Manhole - NO. 6) & 내부사다리 (Internal Ladder - NO. 7): 맨홀 위치에 상호 무간섭 배치
      let mPos = null;
      const mEntries = Object.entries(opt.marks || {}).filter(([_, m]) => (m & 1));
      if (mEntries.length > 0) {
        const [i, j] = mEntries[0][0].split(',').map(Number);
        if (map.has(i, j)) mPos = [(map.xs[j] + map.xs[j + 1]) / 2, (map.ys[i] + map.ys[i + 1]) / 2];
      }
      if (!mPos) {
        for (let i = map.rows.length - 1; i >= 0; i--) {
          for (let j = map.cols.length - 1; j >= 0; j--) {
            if (map.has(i, j)) {
              mPos = [(map.xs[j] + map.xs[j + 1]) / 2, (map.ys[i] + map.ys[i + 1]) / 2];
              break;
            }
          }
          if (mPos) break;
        }
      }
      if (mPos) {
        const no6 = String(getItemNo('manhole') || 6).trim();
        const no7 = String(getItemNo('inladder') || 7).trim();
        const usedSet = ents._usedBalloons || (opt && opt.usedBalloons);

        // 맨홀 지시선 (NO. 6): 상단 좌측으로 인출
        const b6X = mPos[0] - Math.round(7.0 * N);
        drawBalloonCallout(ents, [mPos[0] - 120, mPos[1] + 150], [b6X, topBaseY - Math.round(4 * N)], [b6X, topBaseY], no6, N, 'BALLOON', usedSet);

        // 내부사다리 지시선 (NO. 7): 맨홀 직하부 내부사다리에서 상단 우측으로 인출 (내부사다리는 맨홀 위치)
        const b7X = mPos[0] + Math.round(7.0 * N);
        drawBalloonCallout(ents, [mPos[0] + 120, mPos[1] + 150], [b7X, topBaseY - Math.round(4 * N)], [b7X, topBaseY], no7, N, 'BALLOON', usedSet);
      }

      // 2. 에어벤트 (Air Vent - NO. 5): 상단 바깥으로 지시선 인출
      let vPos = null;
      const vEntries = Object.entries(opt.marks || {}).filter(([_, m]) => (m & 2));
      if (vEntries.length > 0) {
        const [i, j] = vEntries[0][0].split(',').map(Number);
        if (map.has(i, j)) vPos = [(map.xs[j] + map.xs[j + 1]) / 2, (map.ys[i] + map.ys[i + 1]) / 2];
      }
      if (!vPos) {
        for (let i = map.rows.length - 1; i >= 0; i--) {
          for (let j = 0; j < map.cols.length; j++) {
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
        if (!vPos && mPos) vPos = [mPos[0], mPos[1]];
      }
      if (vPos) {
        const xDiff = mPos ? Math.abs(vPos[0] - mPos[0]) : 999;
        const closeX = xDiff < Math.round(12 * N);
        const vBalloonY = closeX ? topStaggerY : topBaseY;
        const vBalloonX = closeX ? (vPos[0] + (vPos[0] < L / 2 ? -Math.round(8 * N) : Math.round(8 * N))) : vPos[0];
        drawBalloonCallout(ents, [vPos[0], vPos[1] + 120], [vBalloonX, vBalloonY - Math.round(5 * N)], [vBalloonX, vBalloonY], getItemNo('airvent') || 5, N, 'BALLOON');
      }

      // 3. 외부 사다리 (NO. 8): 하단 치수선(baseY / overallY) 바깥 아래로 인출하여 치수선 및 텍스트 1000/5150과 완전 비간섭
      const lList = ladderList(opt, map);
      if (lList.length > 0) {
        const l = lList[0];
        const no8 = String(getItemNo('exladder') || 8).trim();
        const usedSet = ents._usedBalloons || (opt && opt.usedBalloons);
        if (!usedSet || !usedSet.has(no8)) {
          if (l.sd === 'D') {
            // 하부 치수선(overallY) 아래로 완전히 빠져나오는 Y 좌표
            const balloonY = overallY - Math.round(8.0 * N);
            // 패널 중앙(x = 500)에 있는 치수 문자 '1000' 및 '5150'과의 겹침을 피하기 위해 x 오프셋 부여 (260mm)
            const toRight = (l.x + 300 <= L);
            const jogX = toRight ? 260 : -260;
            const pStart = [l.x, l.y - F - 230];
            const pElbow1 = [l.x + jogX, l.y - F - Math.round(4.0 * N)];
            const pElbow2 = [l.x + jogX, balloonY];
            const bx8 = l.x + jogX + (toRight ? Math.round(6.0 * N) : -Math.round(6.0 * N));
            const bR = Math.round(3.8 * N);
            const bTextH = Math.round(2.8 * N);
            const dotR = Math.max(3, Math.round(N * 0.2));

            ents.push({ t: 'circle', c: pStart, r: dotR, layer: 'BALLOON', balloonNo: no8 });
            ents.push({ t: 'line', a: pStart, b: pElbow1, layer: 'BALLOON', balloonNo: no8 });
            ents.push({ t: 'line', a: pElbow1, b: pElbow2, layer: 'BALLOON', balloonNo: no8 });
            const b8Entry = toRight ? [bx8 - bR, balloonY] : [bx8 + bR, balloonY];
            ents.push({ t: 'line', a: pElbow2, b: b8Entry, layer: 'BALLOON', balloonNo: no8 });
            ents.push({ t: 'circle', c: [bx8, balloonY], r: bR, layer: 'BALLOON', balloonNo: no8 });
            ents.push({ t: 'text', p: [bx8, balloonY], h: bTextH, s: no8, rot: 0, align: 'center', valign: 'middle', layer: 'BALLOON', balloonNo: no8 });
            if (usedSet) usedSet.add(no8);
          } else if (l.sd === 'R') {
            const ladSep = Math.max(120, Math.round(5.0 * N));
            drawBalloonCallout(ents, [l.x + F + 20, l.y], [l.x + F + Math.round(8 * N), l.y - ladSep], [rightBaseX, l.y - ladSep], no8, N, 'BALLOON', usedSet);
          } else if (l.sd === 'U') {
            drawBalloonCallout(ents, [l.x, l.y + F + 20], [l.x + Math.round(8 * N), topStaggerY], [l.x + Math.round(14 * N), topStaggerY], no8, N, 'BALLOON', usedSet);
          } else {
            const ladSep = Math.max(120, Math.round(5.0 * N));
            drawBalloonCallout(ents, [l.x - F - 20, l.y], [leftClearX + Math.round(8 * N), l.y - ladSep], [leftClearX, l.y - ladSep], no8, N, 'BALLOON', usedSet);
          }
        }
      }

      // 4. 지붕 판넬 (Roof Panel - NO. 3): 실제로 존재하는 최우측 판넬 선택
      let panelTarget = null;
      let maxRightX = -1;
      for (let r = 0; r < map.rows.length; r++) {
        for (let c = map.cols.length - 1; c >= 0; c--) {
          if (map.has(r, c)) {
            const rx = map.xs[c + 1];
            if (rx > maxRightX) {
              maxRightX = rx;
              panelTarget = { r, c };
            }
            break;
          }
        }
      }
      let panelPcy = null;
      if (panelTarget) {
        const pcx = (map.xs[panelTarget.c] + map.xs[panelTarget.c + 1]) / 2;
        panelPcy = (map.ys[panelTarget.r] + map.ys[panelTarget.r + 1]) / 2;
        let calloutPcy = panelPcy;
        const hasRightLadder = lList.some(l => l.sd === 'R' && Math.abs(l.y - calloutPcy) < Math.round(15 * N));
        if (hasRightLadder) {
          calloutPcy = (calloutPcy + Math.round(12 * N) < W) ? (calloutPcy + Math.round(12 * N)) : (calloutPcy - Math.round(12 * N));
        }
        drawBalloonCallout(ents, [pcx, panelPcy], [L + F + Math.round(6 * N), calloutPcy], [rightBaseX, calloutPcy], getItemNo('panel') || 3, N, 'BALLOON');
        panelPcy = calloutPcy;
      }

      // 5. 코너 프레임 (Corner Frame - NO. 4): 실제로 존재하는 좌상단(또는 외곽) 코너 탐색
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
      drawBalloonCallout(ents, [cornerPt[0] - F, cornerPt[1] + F], [cornerPt[0] - F - Math.round(6 * N), cornerPt[1] + F + Math.round(8 * N)], [cornerPt[0] - F - Math.round(14 * N), cornerPt[1] + F + Math.round(14 * N)], getItemNo('corner') || 4, N, 'BALLOON');

      // 6. 플랜지 바 (Flange Bar - NO. 9): 상단 외벽의 실제 존재하는 판넬 분할선 탐색
      let seamPt = null;
      for (let i = map.rows.length - 1; i >= 0; i--) {
        for (let j = 1; j < map.cols.length; j++) {
          if (map.has(i, j - 1) && map.has(i, j) && !map.has(i + 1, j - 1) && !map.has(i + 1, j)) {
            seamPt = [map.xs[j], map.ys[i + 1]];
            break;
          }
        }
        if (seamPt) break;
      }
      if (!seamPt) {
        for (let i = map.rows.length - 1; i >= 0; i--) {
          for (let j = 0; j < map.cols.length; j++) {
            if (map.has(i, j) && !map.has(i + 1, j)) {
              seamPt = [map.xs[j] + map.cols[j] * 0.5, map.ys[i + 1]];
              break;
            }
          }
          if (seamPt) break;
        }
      }
      if (seamPt) {
        let fbx = seamPt[0];
        if (mPos && Math.abs(fbx - mPos[0]) < Math.round(8 * N)) fbx += Math.round(8 * N);
        if (vPos && Math.abs(fbx - vPos[0]) < Math.round(8 * N)) fbx += Math.round(8 * N);
        drawBalloonCallout(ents, seamPt, [fbx, topStaggerY - Math.round(5 * N)], [fbx, topStaggerY], getItemNo('flangebar') || 9, N, 'BALLOON');
      }

      // 7. 내부 스테이 / 보강재 (Internal Stay - NO. 10): 존재하는 내부 스테이 교차점 또는 판넬 탐색
      let stayPt = null;
      for (let i = Math.floor(map.rows.length / 2); i < map.rows.length; i++) {
        for (let j = Math.floor(map.cols.length / 2); j < map.cols.length; j++) {
          if (map.has(i, j) && map.has(i - 1, j) && map.has(i, j - 1)) {
            stayPt = [map.xs[j], map.ys[i]];
            break;
          }
        }
        if (stayPt) break;
      }
      if (!stayPt) {
        for (let i = 1; i < map.rows.length; i++) {
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
        for (let i = 0; i < map.rows.length; i++) {
          for (let j = 0; j < map.cols.length; j++) {
            if (map.has(i, j)) {
              stayPt = [(map.xs[j] + map.xs[j + 1]) / 2, (map.ys[i] + map.ys[i + 1]) / 2];
              break;
            }
          }
          if (stayPt) break;
        }
      }
      if (stayPt) {
        let stayY = Math.max(stayPt[1], W * 0.75);
        if (typeof panelPcy === 'number' && Math.abs(stayY - panelPcy) < Math.round(10 * N)) {
          stayY = (panelPcy < W * 0.5) ? (panelPcy + Math.round(12 * N)) : (panelPcy - Math.round(12 * N));
        }
        drawBalloonCallout(ents, stayPt, [L + F + Math.round(6 * N), stayY], [rightBaseX, stayY], getItemNo('stay') || 10, N, 'BALLOON');
      }
    }

    ents.blocks = blocks;
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
    const ton = (activeAreaMm2 * H / 1e9).toFixed(1);
    return { map, ents, textH, blocks, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
  }

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
      5000: [1000, 1000, 1000, 2000]
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
      5000: [1000, 1000, 1000, 1000, 1000]
    }
  };

  const H_LIST = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
  const H_MAP = [[1000], [1500], [2000], [1000, 1500], [1000, 2000],
    [1000, 1000, 1500], [1000, 1000, 2000],
    [1000, 1000, 1000, 1500], [1000, 1000, 1000, 2000]];
  const H1_LIST = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
  const H1_MAP = [[1000], [1000, 500], [1000, 1000], [1000, 500, 1000], [1000, 1000, 1000], [1000, 1000, 500, 1000],
    [1000, 1000, 1000, 1000], [1000, 500, 1000, 1000, 1000], [1000, 1000, 1000, 1000, 1000]];

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
    const i = (one ? H1_LIST : H_LIST).indexOf(total);
    return i < 0 ? null : (one ? H1_MAP : H_MAP)[i].slice();
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
  // CConcLT::ConcDesign (자갈 무늬), 기준점 (px,py)
  function concDesign(ents, px, py) {
    [[150, 300, 40], [100, 180, 30], [130, 100, 20], [135, 70, 10], [120, 50, 10]].forEach(c => ents.push({ t: 'circle', c: [px + c[0], py + c[1]], r: c[2], layer: 'PANEL_DETAIL' }));
    [[[40, 50], [180, 200]], [[10, 100], [150, 250]], [[50, 200], [190, 350]]].forEach(l => ents.push({ t: 'line', a: [px + l[0][0], py + l[0][1]], b: [px + l[1][0], py + l[1][1]], layer: 'PANEL_DETAIL' }));
  }
  const PAD_OVERHANG = 200; // 상하 대칭 각 200mm 돌출 (총 EXTC = 400mm)
  const EXTC = PAD_OVERHANG * 2;
  function buildConcrete(opt) {
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
    if (!pieces.length) return { ents, textH: 60 };

    // 1. 기초 콘크리트 패드 보 렌더링
    pieces.forEach(({ x, w, y0, y1 }) => {
      const p = [[x, y0], [x + w, y0], [x + w, y1], [x, y1]];
      for (let k = 0; k < 4; k++) ln(p[k], p[(k + 1) % 4], 'PANEL');
      concDesign(ents, x, y0);
    });

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
      tankOutline(map).forEach(([a, b]) => ln(a, b, 'DIM'));
      // 구획 분할 경계선 표시
      compartments.forEach(comp => {
        if (comp.x0 > 0) ln([comp.x0, comp.y0], [comp.x0, comp.y1], 'DIM');
        if (comp.y0 > 0) ln([comp.x0, comp.y0], [comp.x1, comp.y0], 'DIM');
      });
    }

    // 각 구획별로 개별 테두리 및 대각선 X자 표시
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
        // 1. 해당 구획의 파란색(cyan) 사각 테두리
        const rect = [[comp.x0, comp.y0], [comp.x1, comp.y0], [comp.x1, comp.y1], [comp.x0, comp.y1]];
        for (let k = 0; k < 4; k++) ln(rect[k], rect[(k + 1) % 4], 'DIM');

        // 2. 해당 구획의 대각선 'X' 표시
        ln([comp.x0, comp.y0], [comp.x1, comp.y1], 'DIM');
        ln([comp.x0, comp.y1], [comp.x1, comp.y0], 'DIM');
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

    // 하단 치수선: 패드 중심간 간격 (C.T.C Pitch) 및 패드 전체 외곽 치수
    strips.forEach(([x, w], i) => {
      if (i) {
        const pa = strips[i - 1];
        dimLinear(ents, [pa[0] + pa[1] / 2, botY], [x + w / 2, botY], botY - dimGap1, false, String(Math.round((x + w / 2) - (pa[0] + pa[1] / 2))), textH, 'DIM');
      }
    });
    const lf = strips[0][0], rt = strips[strips.length - 1][0] + strips[strips.length - 1][1];
    dimLinear(ents, [lf, botY], [rt, botY], botY - dimGap2, false, String(rt - lf), textH, 'DIM');
    return { ents, textH };
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

  // 기초 패드 단면 및 입면도 (FOUNDATION PAD SECTION & ELEVATION - media_1790951915253.png 완벽 일치)
  function buildFoundationSection(opt) {
    const map = createMap(opt);
    const secs = ((opt.length && opt.length.length) ? opt.length : [map.length]).filter(Boolean).slice(0, 5);
    const total = secs.reduce((a, b) => a + b, 0);
    const th = opt.frame || 75;
    const padH = (opt && opt.padH !== undefined && opt.padH !== '') ? Number(opt.padH) : (600 - th);
    const clearanceH = th + padH; // 600mm
    const slabTopY = -clearanceH; // -600mm
    const slabT = 150;
    const slabBotY = slabTopY - slabT; // -750mm
    const px0 = -75;
    const pxEnd = total + 75;
    const totalPadW = pxEnd - px0; // 4150 for 4000mm

    const N = opt._N || 25;
    const textH = Math.round(3.0 * N);
    const ents = [];
    const ln = (a, b, layer) => ents.push({ t: 'line', a, b, layer: layer || 'PANEL' });
    const poly = (p, layer, closed) => { for (let k = 0; k + 1 < p.length; k++) ln(p[k], p[k + 1], layer); if (closed) ln(p[p.length - 1], p[0], layer); };
    const circ = (x, y, r, layer) => ents.push({ t: 'circle', c: [x, y], r, layer: layer || 'PANEL' });

    // 1. 패드 기둥 중심선 (Plinth centerlines)
    const cxs = [0];
    let curX = 0;
    secs.forEach(sn => {
      frontSplit(sn, curX).forEach(w => {
        curX += w;
        cxs.push(curX);
      });
    });
    const uniqueCxs = Array.from(new Set(cxs)).sort((a, b) => a - b);
    const numPlinths = uniqueCxs.length;

    // 각 기둥 경계 [leftX, rightX]
    const plinths = [];
    for (let i = 0; i < numPlinths; i++) {
      const cx = uniqueCxs[i];
      if (i === 0) {
        plinths.push([px0, 225, cx]);
      } else if (i === numPlinths - 1) {
        plinths.push([total - 225, pxEnd, cx]);
      } else {
        plinths.push([cx - 150, cx + 150, cx]);
      }
    }

    // 2. 패드 기둥 및 하부 슬래브 외곽선 (Concrete outlines)
    plinths.forEach(([lx, rx]) => ln([lx, -th], [rx, -th], 'PANEL'));
    for (let i = 0; i < plinths.length - 1; i++) {
      const curRx = plinths[i][1];
      const nextLx = plinths[i + 1][0];
      ln([curRx, -th], [curRx, slabTopY], 'PANEL');
      ln([curRx, slabTopY], [nextLx, slabTopY], 'PANEL');
      ln([nextLx, slabTopY], [nextLx, -th], 'PANEL');
    }
    ln([px0, -th], [px0, slabBotY], 'PANEL');
    ln([pxEnd, -th], [pxEnd, slabBotY], 'PANEL');
    ln([px0, slabBotY], [pxEnd, slabBotY], 'PANEL');

    // 3. 기둥 중심선 (Centerlines)
    uniqueCxs.forEach(cx => {
      ents.push({ t: 'line', a: [cx, -th + 80], b: [cx, slabBotY - 60], layer: 'CENTER' });
    });

    // 4. 콘크리트 해치 (기둥 및 하부 슬래브에 걸쳐 단절 없이 연결되는 45도 사선 무늬)
    const hatchStep = 80;
    plinths.forEach(([lx, rx]) => {
      hatchAlignedRect(ents, lx, slabTopY, rx, -th, hatchStep, 'PANEL_DETAIL', 1);
    });
    hatchAlignedRect(ents, px0, slabBotY, pxEnd, slabTopY, hatchStep, 'PANEL_DETAIL', 1);

    // 5. 상부 베이스 스키드 프레임 및 채널 클립 (FRAME 레이어 - 빨강)
    ln([-30, 0], [total + 30, 0], 'FRAME');
    // 좌측 단부 C-채널 클립 `[`
    ln([-30, -th], [-30, 0], 'FRAME');
    ln([-30, 0], [40, 0], 'FRAME');
    ln([40, 0], [40, -15], 'FRAME');
    ln([-30, -th], [40, -th], 'FRAME');
    ln([40, -th], [40, -th + 15], 'FRAME');
    // 중간 기둥 앵글 클립
    for (let i = 1; i < numPlinths - 1; i++) {
      const cx = uniqueCxs[i];
      ln([cx - 40, 0], [cx + 15, 0], 'FRAME');
      ln([cx - 5, 0], [cx - 5, -th], 'FRAME');
      ln([cx - 5, -th], [cx + 35, -th], 'FRAME');
    }
    // 우측 단부 C-채널 클립 `]`
    ln([total + 30, -th], [total + 30, 0], 'FRAME');
    ln([total - 40, 0], [total + 30, 0], 'FRAME');
    ln([total - 40, 0], [total - 40, -15], 'FRAME');
    ln([total - 40, -th], [total + 30, -th], 'FRAME');
    ln([total - 40, -th], [total - 40, -th + 15], 'FRAME');

    // 6. 단부 기둥 철근 배근 형상 (REINF 레이어 - media_1790951915253.png)
    // 좌측 기둥 철근
    ln([-50, -th - 80], [130, -th - 260], 'REINF');
    circ(-10, -th - 120, 12, 'REINF');
    circ(40, -th - 170, 12, 'REINF');
    circ(90, -th - 220, 12, 'REINF');
    ln([-100, -th - 180], [-60, -th - 140], 'REINF');
    ln([-115, -th - 195], [-75, -th - 155], 'REINF');
    ln([-55, slabTopY + 80], [5, slabTopY + 20], 'REINF');
    circ(-25, slabTopY + 50, 12, 'REINF');
    // 우측 기둥 철근 (대칭)
    ln([pxEnd - 25, -th - 80], [total - 130, -th - 260], 'REINF');
    circ(pxEnd - 65, -th - 120, 12, 'REINF');
    circ(total - 40, -th - 170, 12, 'REINF');
    circ(total - 90, -th - 220, 12, 'REINF');
    ln([pxEnd - 20, slabTopY + 80], [total - 5, slabTopY + 20], 'REINF');
    circ(pxEnd - 50, slabTopY + 50, 12, 'REINF');
    ln([pxEnd, slabTopY], [pxEnd, slabBotY - 35], 'FRAME');

    // 7. 좌측 지면 GL선 (media_1790952977248.png: 좌측 GL도 바닥 레벨 slabBotY = -750로 배치)
    const glLen = Math.max(650, Math.round(18.0 * N));
    const soilH = Math.round(3.5 * N);
    const triW = Math.round(2.6 * N), triH = Math.round(2.4 * N);
    // 좌측 GL선 (y = slabBotY = -750)
    ln([px0 - glLen, slabBotY], [px0, slabBotY], 'FRAME');
    const lSymX = px0 - Math.round(7.5 * N);
    poly([[lSymX - triW / 2, slabBotY + triH], [lSymX + triW / 2, slabBotY + triH], [lSymX, slabBotY]], 'DIM', true);
    ents.push({ t: 'text', p: [lSymX + triW * 0.8, slabBotY + triH * 0.8], h: Math.round(2.4 * N), s: 'GL', rot: 0, align: 'left', layer: 'DIM' });
    for (let sx = px0 - glLen; sx < px0 - glLen * 0.1; sx += Math.round(1.8 * N)) {
      ln([sx, slabBotY], [sx - soilH, slabBotY - soilH], 'PANEL_DETAIL');
    }
    // (A) 좌측 패드 높이(padH) 및 프레임 높이(th: 50,75,125,150mm) 치수선 (media_1790953596700.png)
    const dimPadX = px0 - Math.round(5.5 * N);
    dimLinear(ents, [px0, slabTopY], [px0, -th], dimPadX, true, String(padH), Math.round(2.8 * N), 'DIM');
    dimLinear(ents, [px0, -th], [px0, 0], dimPadX, true, String(th), Math.round(2.8 * N), 'DIM');

    // 8. 우측 150 단차 치수선 및 우측 지면 GL선 (media_1790951915253.png 우측)
    ln([pxEnd, slabBotY], [pxEnd + glLen, slabBotY], 'FRAME');
    const rSymX = pxEnd + Math.round(8.5 * N);
    poly([[rSymX - triW / 2, slabBotY + triH], [rSymX + triW / 2, slabBotY + triH], [rSymX, slabBotY]], 'DIM', true);
    ents.push({ t: 'text', p: [rSymX + triW * 0.8, slabBotY + triH * 0.8], h: Math.round(2.4 * N), s: 'GL', rot: 0, align: 'left', layer: 'DIM' });
    for (let sx = pxEnd + glLen * 0.1; sx < pxEnd + glLen; sx += Math.round(1.8 * N)) {
      ln([sx, slabBotY], [sx - soilH, slabBotY - soilH], 'PANEL_DETAIL');
    }
    // 우측 150 치수선
    const dim150X = pxEnd + Math.round(3.0 * N);
    dimLinear(ents, [pxEnd, slabBotY], [pxEnd, slabTopY], dim150X, true, String(slabT), Math.round(2.4 * N), 'DIM');

    // 9. 하단 치수선: Tier 1 기둥 피치 (1000, 1000, ...), Tier 2 전체 패드 폭 (4150)
    const dimPitchY = slabBotY - Math.round(8.5 * N);
    for (let i = 0; i < uniqueCxs.length - 1; i++) {
      const cxA = uniqueCxs[i], cxB = uniqueCxs[i + 1];
      dimLinear(ents, [cxA, slabBotY], [cxB, slabBotY], dimPitchY, false, String(cxB - cxA), Math.round(2.8 * N), 'DIM');
    }
    const dimTotalY = slabBotY - Math.round(16.0 * N);
    dimLinear(ents, [px0, slabBotY], [pxEnd, slabBotY], dimTotalY, false, String(totalPadW), Math.round(2.8 * N), 'DIM');

    return { ents, textH, totalL: totalPadW, H: clearanceH + slabT };
  }

  function buildElevation(opt, sideT, view) {
    const secs = ((view === 'front' ? opt.length : opt.width) || []).filter(Boolean).slice(0, 5);
    const hs = (opt.hseg || []).filter(Boolean), n = hs.length, nH = hs.reduce((a, b) => a + b, 0);
    const split = view === 'front' ? frontSplit : sideSplit;
    const total = secs.reduce((a, b) => a + b, 0), th = opt.frame || 75;
    const ents = [], blocks = {};
    ents._usedBalloons = opt.usedBalloons || (opt.usedBalloons = new Set());
    const ln = (a, b, layer) => ents.push({ t: 'line', a, b, layer: layer || 'PANEL' });
    const poly = (p, layer, closed) => { for (let k = 0; k + 1 < p.length; k++) ln(p[k], p[k + 1], layer); if (closed) ln(p[p.length - 1], p[0], layer); };
    const rect = (x0, y0, x1, y1, layer) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], layer, true);
    const circ = (x, y, r, layer, first) => ents.push({ t: 'circle', c: [x, y], r, layer, first });
    const MX = OB.CX >> 1, MY = OB.CY >> 1, OFF = OB.OFFSET;
    const internal = (opt.rf || 0) !== 0, sts = opt.material === 'STS';
    const mat = sts ? 'STS' : 'SMC';

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
          const cx = w / 2, cy = h / 2, minD = Math.min(w, h);
          bEnts.push({ t: 'circle', c: [cx, cy], r: Math.round(minD * 0.35), layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'circle', c: [cx, cy], r: Math.round(minD * 0.22), layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'circle', c: [cx, cy], r: Math.round(minD * 0.12), layer: 'PANEL_DETAIL' });
          const rHole = Math.round(minD * 0.285);
          for (let deg = 0; deg < 360; deg += 45) {
            const rad = deg * Math.PI / 180;
            bEnts.push({ t: 'circle', c: [Math.round(cx + rHole * Math.cos(rad)), Math.round(cy + rHole * Math.sin(rad))], r: 10, layer: 'PANEL_DETAIL' });
          }
        } else {
          const mTemplates = (sideT && (sideT[mat] || sideT.SMC)) || {};
          const t = mTemplates[w + 'x' + h] || [];
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
                if (s.c !== false && p.length > 2) bEnts.push({ t: 'line', a: p[p.length - 1], b: p[0], layer: 'PANEL_DETAIL' });
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
        rect(x - MX + OB.SPACE, y - OB.MOVE, x + MX - OB.SPACE, y + OB.CY - OB.MOVE, 'REINF');
        circ(x - MX + OB.SPACE + ms, y - OB.MOVE + ms, R, 'REINF'); circ(x + MX - OB.SPACE - ms, y - OB.MOVE + ms, R, 'REINF');
      } else if (kind === 'mid') {
        rect(x - MX, y - MY, x + MX, y + MY, 'REINF');
        ln([x - MX + OB.SPACE, y - MY], [x - MX + OB.SPACE, y + MY], 'REINF'); ln([x + MX - OB.SPACE, y - MY], [x + MX - OB.SPACE, y + MY], 'REINF');
        [[x - MX + ms, y - MY + ms], [x - MX + ms, y + MY - ms], [x + MX - ms, y - MY + ms], [x + MX - ms, y + MY - ms]].forEach(c => circ(c[0], c[1], R, 'REINF'));
      } else {
        rect(x - MX, y, x + MX, y + OB.STAY, 'REINF');
        rect(x - MX + OB.SPACE, y + OB.STAY, x + MX - OB.SPACE, y + OB.STAY + OB.CY, 'REINF');
        circ(x - MX + OB.SPACE + ms, y + OB.STAY + OB.CY - ms, R, 'REINF'); circ(x + MX - OB.SPACE - ms, y + OB.STAY + OB.CY - ms, R, 'REINF');
      }
    }
    // CManholeLT::Form (외부보강, 손잡이/환기구 없음) — pos: 0 단일 1 왼쪽 2 중간 3 오른쪽
    function manhole(x, y, cx, cy, pos, shape) {
      const ms = cx >> 1, UI = MH.UP_IN[cx], DI = MH.DN_IN[cx], UO = MH.UP_OUT[cx], DO = MH.DN_OUT[cx];
      if (!UI) return;
      const two = cx === 1000 && shape > 0;                 // Form2: 손잡이/환기구가 있으면 띠를 한 겹 더 올림
      const xl = (!internal && (pos === 2 || pos === 3)) ? OFF : 0, xr = (!internal && (pos === 1 || pos === 2)) ? cx - OFF : cx, T = MH.STAY, base = two ? 2 * T : T;
      rect(x + xl, y, x + xr, y + T, 'PANEL');
      if (two) rect(x + xl, y + T, x + xr, y + 2 * T, 'PANEL');
      ln([x + xl, y + T / 2], [x + xr, y + T / 2], 'PANEL');
      poly([[x + ms - DO, y + base], [x + ms - UO, y + T + cy], [x + ms + UO, y + T + cy], [x + ms + DO, y + base]], 'PANEL');
      ln([x + ms - DI, y + base], [x + ms - UI, y + T + cy], 'PANEL'); ln([x + ms + DI, y + base], [x + ms + UI, y + T + cy], 'PANEL');
      const solY = (a, b, xx) => gRound((b[1] - a[1]) * (xx - a[0]) / (b[0] - a[0]) + a[1]);
      if (two) {
        const top = T + cy;
        if (shape & 1) { const mh = 275, yy = solY([ms - 456, 60], [ms - 100, top], ms - mh); poly([[x + ms - mh, y + yy], [x + ms - mh, y + top], [x + ms + mh, y + top], [x + ms + mh, y + yy]], 'PANEL'); }
        if (shape & 2) {
          const y1 = solY([ms + 456, 60], [ms + 100, top], ms + 290), y2 = solY([ms + 456, 60], [ms + 100, top], ms + 310);
          poly([[x + ms + 290, y + y1], [x + ms + 290, y + top], [x + ms + 310, y + top], [x + ms + 310, y + y2]], 'PANEL');
        }
        if (shape & 4) {
          let h = top; [[110, 10], [60, 60], [100, 6], [90, 30]].forEach(([w, hh]) => { rect(x + ms - w / 2, y + h, x + ms + w / 2, y + h + hh, 'PANEL'); h += hh; });
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
    const shapeOf = g => { let sh = 0; const n = view === 'front' ? mmap.rows.length : mmap.cols.length;
      for (let k = 0; k < n; k++) { const i = view === 'front' ? k : g, j = view === 'front' ? g : k; if (!mmap.has(i, j)) continue;
        const m = marks[i + ',' + j] || 0; if (m === 3) return view === 'front' ? 5 : 6; if (m === 1) sh |= view === 'front' ? 1 : 2; if (m === 2) sh |= 4; }
      return sh; };
    let gIdx = 0;
    let baseX = 0;
    secs.forEach(nLen => {
      const pLen = split(nLen, baseX), cnt = pLen.length;
      const xj = [baseX]; pLen.forEach(w => xj.push(xj[xj.length - 1] + w));
      const sp = baseX === 0 ? 0 : cnt - 1;             // 1300 패널 위치 (왼쪽 구간은 처음, 나머지는 마지막)
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
          rect(x - HX, y - HX, x + HX, y + HX, 'REINF');
          [[-1, 1], [-1, -1], [1, 1], [1, -1]].forEach(([a, b]) => {
            circ(x + a * hq, y + b * hq, 10, 'REINF');
            poly([[x + a * HX, y + b * (hq - so)], [x + a * (hq - so), y + b * (hq - so)], [x + a * (hq - so), y + b * HX]], 'REINF');
          });
        };
        let yb = 0;
        for (let i = 0; i < n - 1; i++) {
          yb += hs[i];
          for (let j = 0; j < cnt - 1; j++) {
            ln([xj[j] + (j === 0 ? 0 : HX), yb], [xj[j + 1] - HX, yb]);
            ln([xj[j + 1], yb - HX], [xj[j + 1], yb - hs[i] + (i === 0 ? 0 : HX)]);
            stsPlate(xj[j + 1], yb);
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
        const fullPlate = (x, y) => { rect(x - HX, y - HX, x + HX, y + HX, 'REINF'); scr(x, y, HX / 2, HX / 2); };
        const halfPlate = (x, y, sgn) => { rect(x, y - HX, x + sgn * HX, y + HX, 'REINF'); circ(x + sgn * HX / 2, y + HX / 2, sr, 'REINF'); circ(x + sgn * HX / 2, y - HX / 2, sr, 'REINF'); };
        const lowPlate = (x, y) => { rect(x - HX, y, x + HX, y + HX, 'REINF'); circ(x - HX / 2, y + HX / 2, sr, 'REINF'); circ(x + HX / 2, y + HX / 2, sr, 'REINF'); };
        const midRect = (x, y) => { rect(x - HX, y - HX / 2, x + HX, y + HX / 2, 'REINF'); circ(x - HX / 2, y, sr, 'REINF'); circ(x + HX / 2, y, sr, 'REINF'); };
        let y = 0;
        hs.forEach((hh, i) => {
          const tall = !(hh === 500 || hh === 1000 || hh === 1300), last = i === hsN - 1;
          for (let j = 0; j < cnt; j++) {
            if (tall && j === sp && pLen[j] === 1300) {
              panel(xj[j], y, 1300, hh - 1000, gIdx + j, i); ln([xj[j], y + hh - 1000], [xj[j] + 1300, y + hh - 1000]); panel(xj[j], y + hh - 1000, 1300, 1000, gIdx + j, i);
            } else panel(xj[j], y, pLen[j], hh, gIdx + j, i);
          }
          if (i > 0) {                               // 단 사이 가로 이음선 + 격자판
            for (let j = 0; j < cnt; j++) ln([xj[j] + (j > 0 ? HX : 0) , y], [xj[j + 1] - (j < cnt - 1 ? HX : 0), y]);
            for (let j = 1; j < cnt; j++) { fullPlate(xj[j], y); spans[j].push([y - HX, y + HX]); }
            halfPlate(baseX, y, 1); halfPlate(baseX + nLen, y, -1);
          } else if (nH > 3000) {
            for (let j = 1; j < cnt; j++) { lowPlate(xj[j], 0); spans[j].push([0, HX]); }
          }
          if (last && hsN >= 1 && !(tall && false)) {   // 마지막 단 중앙 직사각형 격자판
            for (let j = 1; j < cnt; j++) { const my2 = y + (hh >> 1); midRect(xj[j], my2); spans[j].push([my2 - HX / 2, my2 + HX / 2]); }
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
              plate(x, y, i === 0 ? 'bot' : 'mid');
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
          plate(x, nH, 'top');
          ln([x + OFF, nH], [x + (j === cnt - 2 ? pLen[j + 1] : pLen[j + 1] - OFF), nH]);
          [-OFF, 0, OFF].forEach(o => ln([x + o, nH - OB.MOVE], [x + o, nH - hs[n - 1] + hT]));
        }
      }
      }
      // 맨홀 띠 (CManholeLT, 높이 100)
      for (let j = 0; j < cnt; j++) manhole(xj[j], nH, pLen[j], sts ? 70 : 100, cnt === 1 ? 0 : j === 0 ? 1 : j === cnt - 1 ? 3 : 2, shapeOf(gIdx + j));
      gIdx += cnt;
      baseX += nLen;
    });

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
    } else
    // 하부 프레임 (CFrmLT::SMCFrameFront) : 75 → 앵글, 125 → 채널
    if (th >= 50) {
      if (th === 50) {   // SHS 50x50 각관 (가정: 외경 50, 벽 5)
        [[-50, 0], [total, total + 50]].forEach(([x0, x1]) => { rect(x0, 0, x0 + 50, -50, 'FRAME'); rect(x0 + 5, -5, x0 + 45, -45, 'FRAME'); });
        ln([0, -50], [total, -50], 'FRAME');
      } else {
      const F = 75, T = 20, ch = th > 76;
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
    ln([-75, 0], [total + 75, 0], 'FRAME');
    ln([-75, -th], [total + 75, -th], 'FRAME');
    ln([-75, 0], [-75, -th], 'FRAME');
    ln([total + 75, 0], [total + 75, -th], 'FRAME');
    ln([0, 0], [0, -th], 'FRAME');
    ln([total, 0], [total, -th], 'FRAME');

    // 구간 경계 수직벽 (CWallLT::VertWall)
    for (let i = 1, bx = secs[0]; i < secs.length; bx += secs[i++]) {
      let py = 0;
      hs.forEach(hh => sideSplit(hh, 0).forEach(cy => {
        const dy = cy >> 1; circ(bx - 30, py + dy, 20, 'WALL', true);
        for (let k = 1; cy > dy + k * 100; k++) { circ(bx - 30, py + dy + k * 100, 20, 'WALL'); circ(bx - 30, py + dy - k * 100, 20, 'WALL'); }
        py += cy;
      }));
    }

    // 기초 콘크리트 패드 및 지면 (media_1790951915253.png 완벽 일치)
    const padH = (opt && opt.padH !== undefined && opt.padH !== '') ? Number(opt.padH) : (600 - th);
    const clearanceH = th + padH; // 탱크 하부(y=0) ~ 슬래브 상면(slabTopY) = 600mm
    const slabTopY = -clearanceH; // -600mm
    const GRD = slabTopY; // 기준 바닥 레벨
    const slabT = 150;
    const slabBotY = slabTopY - slabT; // -750mm
    const px0 = -75;
    const pxEnd = total + 75;
    const totalPadW = pxEnd - px0; // 4150 for 4000mm
    const N = opt._N || 25;
    const textH = Math.round(3.0 * N);
    const dimGap1 = Math.round(10.0 * N);
    const dimGap2 = Math.round(18.0 * N);
    const nozTextH = Math.round(2.2 * N);

    // 1. 패드 기둥 중심선 (Plinth centerlines)
    const cxs = [0];
    let curX = 0;
    secs.forEach(sn => {
      split(sn, curX).forEach(w => {
        curX += w;
        cxs.push(curX);
      });
    });
    const uniqueCxs = Array.from(new Set(cxs)).sort((a, b) => a - b);
    const numPlinths = uniqueCxs.length;

    // 각 기둥 경계 [leftX, rightX]
    const plinths = [];
    for (let i = 0; i < numPlinths; i++) {
      const cx = uniqueCxs[i];
      if (i === 0) {
        plinths.push([px0, 225, cx]);
      } else if (i === numPlinths - 1) {
        plinths.push([total - 225, pxEnd, cx]);
      } else {
        plinths.push([cx - 150, cx + 150, cx]);
      }
    }

    // 2. 패드 기둥 및 하부 슬래브 외곽선 (Concrete outlines)
    plinths.forEach(([lx, rx]) => ln([lx, -th], [rx, -th], 'PANEL'));
    for (let i = 0; i < plinths.length - 1; i++) {
      const curRx = plinths[i][1];
      const nextLx = plinths[i + 1][0];
      ln([curRx, -th], [curRx, slabTopY], 'PANEL');
      ln([curRx, slabTopY], [nextLx, slabTopY], 'PANEL');
      ln([nextLx, slabTopY], [nextLx, -th], 'PANEL');
    }
    ln([px0, -th], [px0, slabBotY], 'PANEL');
    ln([pxEnd, -th], [pxEnd, slabBotY], 'PANEL');
    ln([px0, slabBotY], [pxEnd, slabBotY], 'PANEL');

    // 3. 기둥 중심선 (Centerlines)
    uniqueCxs.forEach(cx => {
      ents.push({ t: 'line', a: [cx, -th + 80], b: [cx, slabBotY - 60], layer: 'CENTER' });
    });

    // 4. 콘크리트 해치 (기둥 및 하부 슬래브에 걸쳐 단절 없이 연결되는 45도 사선 무늬)
    const hatchStep = 80;
    plinths.forEach(([lx, rx]) => {
      hatchAlignedRect(ents, lx, slabTopY, rx, -th, hatchStep, 'PANEL_DETAIL', 1);
    });
    hatchAlignedRect(ents, px0, slabBotY, pxEnd, slabTopY, hatchStep, 'PANEL_DETAIL', 1);

    // 5. 상부 베이스 스키드 채널 클립 (FRAME 레이어 - 빨강)
    // 좌측 C-채널 클립 [
    ln([-30, 0], [40, 0], 'FRAME');
    ln([40, 0], [40, -15], 'FRAME');
    ln([-30, -th], [40, -th], 'FRAME');
    ln([40, -th], [40, -th + 15], 'FRAME');
    // 중간 기둥 앵글 클립
    for (let i = 1; i < numPlinths - 1; i++) {
      const cx = uniqueCxs[i];
      ln([cx - 40, 0], [cx + 15, 0], 'FRAME');
      ln([cx - 5, 0], [cx - 5, -th], 'FRAME');
      ln([cx - 5, -th], [cx + 35, -th], 'FRAME');
    }
    // 우측 C-채널 클립 ]
    ln([total - 40, 0], [total + 30, 0], 'FRAME');
    ln([total - 40, 0], [total - 40, -15], 'FRAME');
    ln([total - 40, -th], [total + 30, -th], 'FRAME');
    ln([total - 40, -th], [total - 40, -th + 15], 'FRAME');

    // 6. 단부 기둥 철근 배근 형상 (REINF 레이어 - media_1790951915253.png)
    // 좌측 기둥 철근
    ln([-50, -th - 80], [130, -th - 260], 'REINF');
    circ(-10, -th - 120, 12, 'REINF');
    circ(40, -th - 170, 12, 'REINF');
    circ(90, -th - 220, 12, 'REINF');
    ln([-100, -th - 180], [-60, -th - 140], 'REINF');
    ln([-115, -th - 195], [-75, -th - 155], 'REINF');
    ln([-55, slabTopY + 80], [5, slabTopY + 20], 'REINF');
    circ(-25, slabTopY + 50, 12, 'REINF');
    // 우측 기둥 철근 (대칭)
    ln([pxEnd - 25, -th - 80], [total - 130, -th - 260], 'REINF');
    circ(pxEnd - 65, -th - 120, 12, 'REINF');
    circ(total - 40, -th - 170, 12, 'REINF');
    circ(total - 90, -th - 220, 12, 'REINF');
    ln([pxEnd - 20, slabTopY + 80], [total - 5, slabTopY + 20], 'REINF');
    circ(pxEnd - 50, slabTopY + 50, 12, 'REINF');
    ln([pxEnd, slabTopY], [pxEnd, slabBotY - 35], 'FRAME');

    // 7. 좌측 지면 GL선 (media_1790952977248.png: 좌측 GL도 바닥 레벨 slabBotY = -750로 배치)
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

    // 8. 우측 150 단차 치수선 및 우측 지면 GL선 (media_1790951915253.png 우측)
    ln([pxEnd, slabBotY], [pxEnd + glLen, slabBotY], 'FRAME');
    const rSymX = pxEnd + Math.round(8.5 * N);
    poly([[rSymX - triW / 2, slabBotY + triH], [rSymX + triW / 2, slabBotY + triH], [rSymX, slabBotY]], 'DIM', true);
    ents.push({ t: 'text', p: [rSymX + triW * 0.8, slabBotY + triH * 0.8], h: Math.round(2.4 * N), s: 'GL', rot: 0, align: 'left', layer: 'DIM' });
    for (let sx = pxEnd + glLen * 0.1; sx < pxEnd + glLen; sx += Math.round(1.8 * N)) {
      ln([sx, slabBotY], [sx - soilH, slabBotY - soilH], 'PANEL_DETAIL');
    }
    const dim150X = pxEnd + Math.round(3.0 * N);
    dimLinear(ents, [pxEnd, slabBotY], [pxEnd, slabTopY], dim150X, true, String(slabT), Math.round(2.4 * N), 'DIM');

    // 9. 하단 치수선: Tier 1 기둥 피치 (1000, 1000, ...), Tier 2 전체 패드 폭 (4150)
    const dimPitchY = slabBotY - Math.round(8.5 * N);
    for (let i = 0; i < uniqueCxs.length - 1; i++) {
      const cxA = uniqueCxs[i], cxB = uniqueCxs[i + 1];
      dimLinear(ents, [cxA, slabBotY], [cxB, slabBotY], dimPitchY, false, String(cxB - cxA), Math.round(2.8 * N), 'DIM');
    }
    const dimTotalY = slabBotY - Math.round(16.0 * N);
    dimLinear(ents, [px0, slabBotY], [pxEnd, slabBotY], dimTotalY, false, String(totalPadW), Math.round(2.8 * N), 'DIM');

    // 배관 노즐 (INLET, OUTLET, OVERFLOW, DRAIN, FIRE 등) 입면도 배치 (글로벌 표준 간결 표기 & 중복 결합)
    const nozList = getNozzleList(opt);

    // 1. 현재 뷰(view: 'front' | 'side')에 맞춰 4개 그룹으로 분류
    const faceNozzles = [];
    const leftNozzles = [];
    const rightNozzles = [];
    const topNozzles = [];

    nozList.forEach(n => {
      const elev = typeof n.elev === 'number' ? n.elev : (nH - 300);
      const isFlg = n.type === 'FLANGE';
      const spec = getNozzleSpec(n.size);

      if (view === 'front') {
        if (n.face === 'front') {
          const colIdx = Math.max(0, Math.min(n.seg - 1, mmap.cols.length - 1));
          const cx = (mmap.xs[colIdx] + mmap.xs[colIdx + 1]) / 2 + (n.offset || 0);
          faceNozzles.push({ n, spec, isFlg, cx, cy: elev, elev });
        } else if (n.face === 'left') {
          leftNozzles.push({ n, spec, isFlg, elev });
        } else if (n.face === 'right') {
          rightNozzles.push({ n, spec, isFlg, elev });
        } else if (n.face === 'top') {
          const colIdx = Math.max(0, Math.min(n.topCell[1], mmap.cols.length - 1));
          const cx = (mmap.xs[colIdx] + mmap.xs[colIdx + 1]) / 2 + (n.offset || 0);
          topNozzles.push({ n, spec, isFlg, cx, elev: 'TOP' });
        }
      } else { // side view
        if (n.face === 'right') {
          const rowIdx = Math.max(0, Math.min(n.seg - 1, mmap.rows.length - 1));
          const cy = (mmap.ys[rowIdx] + mmap.ys[rowIdx + 1]) / 2 + (n.offset || 0);
          faceNozzles.push({ n, spec, isFlg, cx: cy, cy: elev, elev });
        } else if (n.face === 'front') {
          leftNozzles.push({ n, spec, isFlg, elev });
        } else if (n.face === 'rear') {
          rightNozzles.push({ n, spec, isFlg, elev });
        } else if (n.face === 'top') {
          const rowIdx = Math.max(0, Math.min(n.topCell[0], mmap.rows.length - 1));
          const cy = (mmap.ys[rowIdx] + mmap.ys[rowIdx + 1]) / 2 + (n.offset || 0);
          topNozzles.push({ n, spec, isFlg, cx: cy, elev: 'TOP' });
        }
      }
    });

    const minVertGap = Math.round(5.0 * N);

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

    const X0 = -75 - dimGap1;
    const overallX = -75 - dimGap2;

    // 치수 (FrontDim / SideDim: 축척 비례 계산 - media_1790951915253.png 표준 정위치)
    let yy = 0;
    hs.forEach(hh => { dimLinear(ents, [X0, yy], [X0, yy + hh], X0 - dimGap1, true, String(hh), textH, 'DIM'); yy += hh; });
    dimLinear(ents, [X0, nH], [X0, nH + 100], X0 - dimGap1, true, '100', textH, 'DIM');
    // 좌측 기초 패드 높이(padH) 및 프레임 높이(th: 50,75,125,150mm) 치수선 (media_1790953596700.png)
    dimLinear(ents, [px0, slabTopY], [px0, -th], X0 - dimGap1, true, String(padH), textH, 'DIM');
    dimLinear(ents, [px0, -th], [px0, 0], X0 - dimGap1, true, String(th), textH, 'DIM');
    // 탱크 전체 높이 치수선 (슬래브 상면 ~ 탱크 최상단)
    dimLinear(ents, [px0, slabTopY], [px0, nH + 100], overallX, true, String(nH + 100 - slabTopY), textH, 'DIM');

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

      const sameSize = items.every(it => it.n.size === items[0].n.size);
      let line1;
      if (sameSize) {
        line1 = `[${items.map(it => it.n.mark).join(', ')}] ${items[0].n.size}`;
      } else {
        line1 = items.map(it => `[${it.n.mark}] ${it.n.size}`).join(', ');
      }
      const line2 = `EL.+${elev.toLocaleString()}`;

      let ey = elev + Math.round(1.5 * N);
      if (prevLeftEy !== null && Math.abs(ey - prevLeftEy) < minVertGap) {
        ey = prevLeftEy - minVertGap;
      }
      prevLeftEy = ey;

      const xTip = isFlg ? (xBase - spec.neckLen) : (xBase - spec.sockLen);
      // 리드선(Leader line)을 치수선 바깥으로 꺾어 인출하여 치수선 및 치수 숫자와의 간섭 원천 차단
      const elbowX = overallX - Math.round(4.0 * N);
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

      const sameSize = items.every(it => it.n.size === items[0].n.size);
      let line1;
      if (sameSize) {
        line1 = `[${items.map(it => it.n.mark).join(', ')}] ${items[0].n.size}`;
      } else {
        line1 = items.map(it => `[${it.n.mark}] ${it.n.size}`).join(', ');
      }
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

      const sameSize = items.every(it => it.n.size === items[0].n.size);
      let line1;
      if (sameSize) {
        line1 = `[${items.map(it => it.n.mark).join(', ')}] ${items[0].n.size}`;
      } else {
        line1 = items.map(it => `[${it.n.mark}] ${it.n.size}`).join(', ');
      }
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

      const sameSize = items.every(it => it.n.size === items[0].n.size);
      let line1;
      if (sameSize) {
        line1 = `[${items.map(it => it.n.mark).join(', ')}] ${items[0].n.size}`;
      } else {
        line1 = items.map(it => `[${it.n.mark}] ${it.n.size}`).join(', ');
      }
      const line2 = `EL.+${elev.toLocaleString()}`;

      const toRight = cx >= total / 2;
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
      const elevTopY = nH + Math.round(18 * N);
      const pxEndElev = total + 75;
      const elevRightX = pxEndElev + Math.round(10.0 * N);
      const elevBotY = slabTopY - 150 - dimGap2 - Math.round(14 * N);

      // 1. 기초 콘크리트 (Concrete Foundation - NO. 1): 리드선(Leader line)을 아래쪽으로 꺾어 인출하여 NO. 2 및 600 치수선 간섭 원천 차단
      const concY = slabTopY + padH * 0.5;
      const b1_elbowY = concY - Math.round(2.0 * N);
      drawBalloonCallout(ents, [total, concY], [total + 75 + Math.round(3.5 * N), b1_elbowY], [elevRightX, b1_elbowY], getItemNo('foundation') || 1, N, 'BALLOON');

      // 2. 스키드 프레임 (Skid Frame - NO. 2): 리드선(Leader line)을 위쪽으로 꺾어 인출하여 NO. 1 및 치수선 간섭 원천 차단
      const skidY = -th * 0.5;
      const b2_elbowY = skidY + Math.round(2.0 * N);
      drawBalloonCallout(ents, [total + 75, skidY], [total + 75 + Math.round(3.5 * N), b2_elbowY], [elevRightX, b2_elbowY], getItemNo('skid') || 2, N, 'BALLOON');

      // 3. 측면 판넬 (Wall Panel - NO. 3): 리드선 우측 정렬
      drawBalloonCallout(ents, [total, nH * 0.65], [total + 75 + Math.round(3.5 * N), nH * 0.65], [elevRightX, nH * 0.65], getItemNo('panel') || 3, N, 'BALLOON');

      // 4. 코너 프레임 (Corner Frame - NO. 4): 좌상단 바깥 외곽
      drawBalloonCallout(ents, [0, nH], [-75 - Math.round(6 * N), nH + Math.round(10 * N)], [-75 - Math.round(16 * N), nH + Math.round(16 * N)], getItemNo('corner') || 4, N, 'BALLOON');

      // 8. 외부 사다리 (External Ladder - NO. 8) & 10. 내부 스테이 (Internal Stay - NO. 10): 상단 바깥 외곽 (상호 크로스 방지 방향 제어)
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
      const stayX = total * 0.5;

      if (lx <= stayX) {
        // 사다리가 좌측(또는 동일), 스테이가 우측 -> 사다리는 좌측으로, 스테이는 우측으로 인출 (크로스 원천 차단)
        drawBalloonCallout(ents, [lx, nH + 100], [lx, elevTopY - Math.round(5 * N)], [lx - Math.round(10 * N), elevTopY], getItemNo('exladder') || 8, N, 'BALLOON');
        drawBalloonCallout(ents, [stayX, nH * 0.5], [stayX, elevTopY - Math.round(5 * N)], [stayX + Math.round(10 * N), elevTopY], getItemNo('stay') || 10, N, 'BALLOON');
      } else {
        // 사다리가 우측, 스테이가 좌측 -> 사다리는 우측으로, 스테이는 좌측으로 인출 (크로스 원천 차단)
        drawBalloonCallout(ents, [lx, nH + 100], [lx, elevTopY - Math.round(5 * N)], [lx + Math.round(10 * N), elevTopY], getItemNo('exladder') || 8, N, 'BALLOON');
        drawBalloonCallout(ents, [stayX, nH * 0.5], [stayX, elevTopY - Math.round(5 * N)], [stayX - Math.round(10 * N), elevTopY], getItemNo('stay') || 10, N, 'BALLOON');
      }

      // 11. 노즐 (Nozzles - NO. 11): 리드선 우측 정렬
      drawBalloonCallout(ents, [total + 75, nH * 0.3], [total + 75 + Math.round(3.5 * N), nH * 0.3], [elevRightX, nH * 0.3], getItemNo('nozzle') || 11, N, 'BALLOON');
    }

    ents.blocks = blocks;
    return { ents, textH, blocks };
  }

  /* ---------- 3D 등각 조감도 생성 (3D ISOMETRIC VIEW, TankIsometric) ---------- */
  function buildIsometric(opt, templates, sideT) {
    const map = createMap(opt);
    const totalL = map.length, totalW = map.width;
    const H = (opt.height || []).reduce((a, b) => a + (b || 0), 0) || 3000;
    const hs = (opt.hseg && opt.hseg.length) ? opt.hseg.slice() : (heightSegs(H, opt.b11) || [1000, 1000, 1000]);
    const N = opt._N || 25;
    const textH = Math.round(3.0 * N);
    const ents = [];

    const getDepth = (x, y, z) => y - x - z;

    const ln = (a, b, layer, depth = 0) => ents.push({ t: 'line', a, b, layer: layer || 'PANEL', depth });
    const poly = (pts, layer, close = true, fill = false, depth = 0) => {
      if (fill) {
        ents.push({ t: 'poly', pts, fill: true, stroke: false, close: false, layer: layer || 'PANEL', depth });
        if (close !== false) {
          for (let i = 0; i < pts.length - 1; i++) ln(pts[i], pts[i + 1], layer, depth);
          if (pts.length > 2) ln(pts[pts.length - 1], pts[0], layer, depth);
        }
      } else {
        for (let i = 0; i < pts.length - 1; i++) ln(pts[i], pts[i + 1], layer, depth);
        if (close && pts.length > 2) ln(pts[pts.length - 1], pts[0], layer, depth);
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
          const rawP = s.p || s.pts || [];
          if (rawP.length >= 2) {
            const pts = rawP.map(p => {
              if (plane === 'XZ') return toIso(originX + p[0], originY, originZ + p[1]);
              if (plane === 'YZ') return toIso(originX, originY + p[0], originZ + p[1]);
              return toIso(originX + p[0], originY + p[1], originZ);
            });
            poly(pts, defaultLayer, s.c !== false, false, depth);
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
      } else {
        const rawT = sideTemplates[w + 'x' + h];
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

    // 1. 콘크리트 패드 (Concrete Foundation & Plinths: 300mm 기둥, 150mm 연속 바닥 슬래브, GL -750)
    const th = opt.th || opt.frame || 75;
    const padH = (opt && opt.padH !== undefined && opt.padH !== '') ? Number(opt.padH) : (600 - th);
    const clearanceH = th + padH; // 600mm
    const slabTopY = -clearanceH; // -600mm
    const slabT = 150;
    const slabBotY = slabTopY - slabT; // -750mm
    const GRD = slabBotY; // -750mm
    const px0 = -75;
    const pxEnd = totalL + 75;
    const PAD_OV = (opt.padOverhang !== undefined && opt.padOverhang !== '') ? Number(opt.padOverhang) : 200;
    const padPitch = (opt.pitch === 'custom' && opt.customPitch) ? opt.customPitch : ((opt.padPitch || opt.pitch) === 500 ? 500 : 1000);

    const firstW = Number(opt.padFirstW) || 300;
    const midW = Number(opt.padMidW) || 300;
    const lastW = Number(opt.padLastW !== undefined ? opt.padLastW : opt.padFirstW) || firstW;

    const nR = map.rows.length;
    const hasTankAtRow = (idx, r) => {
      if (Number.isInteger(idx)) {
        return (idx > 0 && map.has(r, idx - 1)) || (idx < map.cols.length && map.has(r, idx));
      }
      const c = Math.floor(idx);
      return map.has(r, c);
    };

    const runsForStrip = (idx) => {
      const out = [];
      let inR = false, sY = 0;
      for (let r = 0; r < nR; r++) {
        const has = hasTankAtRow(idx, r);
        if (has && !inR) { inR = true; sY = map.ys[r]; }
        else if (!has && inR) { inR = false; out.push([sY, map.ys[r]]); }
      }
      if (inR) out.push([sY, totalW]);
      if (out.length === 0) {
        for (let r = 0; r < nR; r++) {
          if (map.has(r, 0)) { out.push([map.ys[r], map.ys[r + 1]]); break; }
        }
      }
      return out;
    };

    // 패드 기둥 목록 생성 (Centerlines, bounds [lx, rx], map col idx)
    const cxs = [{ x: 0, idx: 0 }];
    let curX = 0;
    map.cols.forEach((colW, cIdx) => {
      if (padPitch === 500 && colW >= 1000) {
        cxs.push({ x: curX + colW / 2, idx: cIdx + 0.5 });
      }
      curX += colW;
      cxs.push({ x: curX, idx: cIdx + 1 });
    });

    const numPlinths = cxs.length;
    const plinths = [];
    for (let i = 0; i < numPlinths; i++) {
      const { x: cx, idx } = cxs[i];
      let lx, rx;
      if (i === 0) {
        lx = px0;
        rx = px0 + firstW;
      } else if (i === numPlinths - 1) {
        rx = pxEnd;
        lx = pxEnd - lastW;
      } else {
        lx = cx - midW / 2;
        rx = cx + midW / 2;
      }
      plinths.push({ lx, rx, cx, idx });
    }

    // 지반 기준선 (GL Line at z = slabBotY = -750)
    const glDepth = getDepth(px0 - 150, -PAD_OV, slabBotY);
    ln(toIso(px0 - 150, -PAD_OV, slabBotY), toIso(pxEnd + 150, -PAD_OV, slabBotY), 'PANEL_DETAIL', glDepth);
    ln(toIso(pxEnd, -PAD_OV, slabBotY), toIso(pxEnd, totalW + 150, slabBotY), 'PANEL_DETAIL', glDepth);

    // 하부 150mm 연속 바닥 슬래브 (Continuous 150mm Bottom Slab: z = slabBotY ~ slabTopY)
    // 기둥 및 기둥 간 개구부 구간별 면 분할 렌더링 (화가 알고리즘 정확도 유지, 내부 수직선 없는 단일 슬래브)
    const frontY = -PAD_OV;
    plinths.forEach((p, pIdx) => {
      const sDepth = getDepth((p.lx + p.rx) / 2, frontY, (slabTopY + slabBotY) / 2);
      poly([
        toIso(p.lx, frontY, slabTopY),
        toIso(p.rx, frontY, slabTopY),
        toIso(p.rx, frontY, slabBotY),
        toIso(p.lx, frontY, slabBotY)
      ], 'PANEL', false, true, sDepth);

      if (pIdx < numPlinths - 1) {
        const curRx = p.rx;
        const nextLx = plinths[pIdx + 1].lx;
        const cDepth = getDepth((curRx + nextLx) / 2, frontY, (slabTopY + slabBotY) / 2);
        poly([
          toIso(curRx, frontY, slabTopY),
          toIso(nextLx, frontY, slabTopY),
          toIso(nextLx, frontY, slabBotY),
          toIso(curRx, frontY, slabBotY)
        ], 'PANEL', false, true, cDepth);
        // 기둥 사이 개구부 바닥 상단 전면 모서리선
        ln(toIso(curRx, frontY, slabTopY), toIso(nextLx, frontY, slabTopY), 'PANEL', cDepth);
      }
    });
    // 슬래브 전면 외곽 테두리선 (하단 GL선 및 양측 단부 수직선)
    ln(toIso(px0, frontY, slabBotY), toIso(pxEnd, frontY, slabBotY), 'PANEL', glDepth);
    ln(toIso(px0, frontY, slabTopY), toIso(px0, frontY, slabBotY), 'PANEL', getDepth(px0, frontY, (slabTopY + slabBotY) / 2));
    ln(toIso(pxEnd, frontY, slabTopY), toIso(pxEnd, frontY, slabBotY), 'PANEL', getDepth(pxEnd, frontY, (slabTopY + slabBotY) / 2));

    // 각 기둥 (Plinth) 및 기둥 사이 캐비티 바닥/측벽 렌더링
    plinths.forEach((p, sIdx) => {
      const runs = runsForStrip(p.idx);

      runs.forEach(([y0, y1]) => {
        const yStart = y0 - PAD_OV;
        const frontPadDepth = getDepth((p.lx + p.rx) / 2, yStart, (slabTopY + -th) / 2);
        const topPadDepth = getDepth((p.lx + p.rx) / 2, (yStart + y0) / 2, -th);

        // 1) 기둥 전면 직사각형 (Front Face: Y = yStart, Z = slabTopY ~ -th)
        poly([
          toIso(p.lx, yStart, -th),
          toIso(p.rx, yStart, -th),
          toIso(p.rx, yStart, slabTopY),
          toIso(p.lx, yStart, slabTopY)
        ], 'PANEL', true, true, frontPadDepth);

        // 2) 전면 상판면 (Top Face: Y = yStart ~ y0, Z = -th)
        poly([
          toIso(p.lx, y0, -th),
          toIso(p.rx, y0, -th),
          toIso(p.rx, yStart, -th),
          toIso(p.lx, yStart, -th)
        ], 'PANEL', true, true, topPadDepth);

        // 3) 앵커 플레이트 & 볼트 (기둥 중심선 cx에 정렬)
        const acW = Math.min(35, (p.rx - p.lx) / 4);
        poly([
          toIso(p.cx - acW, yStart + 70, -th),
          toIso(p.cx + acW, yStart + 70, -th),
          toIso(p.cx + acW, yStart + 150, -th),
          toIso(p.cx - acW, yStart + 150, -th)
        ], 'FRAME', true, false, topPadDepth);
        isoCircle(p.cx, yStart + 110, -th, 12, 'XY', 'FRAME', topPadDepth);
        ln(toIso(p.cx, yStart + 110, -th), toIso(p.cx, yStart + 110, -th + 30), 'FRAME', topPadDepth);

        // 4) 기둥 간 캐비티 바닥 (Slab Top Floor at z = slabTopY) 및 기둥 우측 측벽 (Right-facing Wall)
        if (sIdx < numPlinths - 1) {
          const nextP = plinths[sIdx + 1];
          const curRx = p.rx;
          const nextLx = nextP.lx;

          // 기둥 우측 측벽 (Inner vertical cavity wall: x = curRx, z = slabTopY ~ -th, y = yStart ~ y1)
          const sideDepth = getDepth(curRx, (yStart + y1) / 2, (-th + slabTopY) / 2);
          poly([
            toIso(curRx, yStart, -th),
            toIso(curRx, y1, -th),
            toIso(curRx, y1, slabTopY),
            toIso(curRx, yStart, slabTopY)
          ], 'PANEL', true, true, sideDepth);
          ln(toIso(curRx, yStart, -th), toIso(curRx, y1, -th), 'PANEL', sideDepth);

          // 캐비티 바닥면 (Cavity floor on top of 150mm slab: z = slabTopY, x = curRx ~ nextLx, y = yStart ~ y1)
          const floorDepth = getDepth((curRx + nextLx) / 2, (yStart + y1) / 2, slabTopY);
          poly([
            toIso(curRx, yStart, slabTopY),
            toIso(nextLx, yStart, slabTopY),
            toIso(nextLx, y1, slabTopY),
            toIso(curRx, y1, slabTopY)
          ], 'PANEL', true, true, floorDepth);
        }

        // 5) 우측 최외곽 콘크리트 측면 (x = pxEnd, z = slabBotY ~ -th, y = yStart ~ y1)
        if (sIdx === numPlinths - 1) {
          const rightOuterDepth = getDepth(p.rx, (yStart + y1) / 2, (-th + slabBotY) / 2);
          poly([
            toIso(p.rx, yStart, -th),
            toIso(p.rx, y1, -th),
            toIso(p.rx, y1, slabBotY),
            toIso(p.rx, yStart, slabBotY)
          ], 'PANEL', true, true, rightOuterDepth);
          ln(toIso(p.rx, yStart, -th), toIso(p.rx, y1, -th), 'PANEL', rightOuterDepth);
          // 150mm 슬래브 경계선 표시
          ln(toIso(p.rx, yStart, slabTopY), toIso(p.rx, y1, slabTopY), 'PANEL', rightOuterDepth);

          let xWall = totalL;
          for (let r = map.rows.length - 1; r >= 0; r--) {
            if (map.ys[r + 1] === y1) {
              for (let j = map.cols.length - 1; j >= 0; j--) {
                if (map.has(r, j)) { xWall = map.xs[j + 1]; break; }
              }
              break;
            }
          }
          if (p.rx > xWall) {
            ln(toIso(xWall, y1, -th), toIso(p.rx, y1, -th), 'PANEL', rightOuterDepth);
            ln(toIso(xWall, y1, slabTopY), toIso(p.rx, y1, slabTopY), 'PANEL', rightOuterDepth);
            ln(toIso(xWall, y1, slabBotY), toIso(p.rx, y1, slabBotY), 'PANEL', rightOuterDepth);
          }
          ln(toIso(p.rx, y1, -th), toIso(p.rx, y1, slabBotY), 'PANEL', rightOuterDepth);
        }
      });
    });

    // 베이스 찬넬 림 (Skid Channel 100mm)
    // 1) 전면 탱크 하부 찬넬
    for (let i = 0; i < map.rows.length; i++) {
      const y0 = map.ys[i];
      for (let j = 0; j < map.cols.length; j++) {
        if (!map.has(i, j) || map.has(i - 1, j)) continue;
        const x0 = map.xs[j], x1 = map.xs[j + 1];
        const skidDepth = y0 - (x0 + x1) / 2 - (-th / 2);
        poly([toIso(x0, y0, 0), toIso(x1, y0, 0), toIso(x1, y0, -th), toIso(x0, y0, -th)], 'FRAME', true, true, skidDepth);
        ln(toIso(x0, y0, -th + 15), toIso(x1, y0, -th + 15), 'PANEL_DETAIL', skidDepth);
        ln(toIso(x0, y0, -15), toIso(x1, y0, -15), 'PANEL_DETAIL', skidDepth);
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
        ln(toIso(xWall, y0, -th + 15), toIso(xWall, y1, -th + 15), 'PANEL_DETAIL', skidDepth);
        ln(toIso(xWall, y0, -15), toIso(xWall, y1, -15), 'PANEL_DETAIL', skidDepth);
      }
    }

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
        const rawT = ceilTemplates[w + 'x' + h];
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
          if (map.has(i, j + 1) && !map.has(i - 1, j + 1)) {
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
          if (map.has(i + 1, j) && !map.has(i + 1, j + 1)) {
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

    // 5. 맨홀 및 환기구 (Manhole & Air Vent on Roof - 평면도 및 정면도 표준 형상 반영)
    const marks = Object.assign({}, opt.marks);
    Object.entries(marks).forEach(([k, mk]) => {
      const [i, j] = k.split(',').map(Number);
      if (!map.has(i, j)) return;
      const x0 = map.xs[j], y0 = map.ys[i];
      const cx = x0 + map.cols[j] / 2, cy = y0 + map.rows[i] / 2;
      const accDepth = getDepth(cx, cy, H + 50);

      if (mk & 1) { // 맨홀 (평면도 markShapes 및 정면도 CManholeLT 저상형 림 형상)
        // 1) 외곽 원형 림 Ø600
        isoCircle(cx, cy, H, 300, 'XY', 'FRAME', accDepth);
        isoCircle(cx, cy, H, 270, 'XY', 'PANEL_DETAIL', accDepth);

        // 2) 평면도 내부 팔각 리브 형상
        const oct1 = [[260, 105], [735, 105], [888, 260], [888, 735], [735, 888], [262, 888], [105, 735], [105, 260]];
        const oct2 = [[150, 280], [290, 150], [710, 150], [850, 280], [850, 720], [710, 850], [290, 850], [150, 720]];
        poly(oct1.map(p => toIso(x0 + p[0], y0 + p[1], H)), 'FRAME', true, false, accDepth);
        poly(oct2.map(p => toIso(x0 + p[0], y0 + p[1], H)), 'FRAME', true, false, accDepth);

        // 3) 손잡이/힌지 디테일 박스
        const tab1 = [[310, 110], [390, 110], [390, 67], [310, 67]];
        const tab2 = [[610, 110], [690, 110], [690, 67], [610, 67]];
        const tab3 = [[462, 945], [538, 945], [538, 898], [462, 898]];
        poly(tab1.map(p => toIso(x0 + p[0], y0 + p[1], H)), 'FRAME', true, false, accDepth);
        poly(tab2.map(p => toIso(x0 + p[0], y0 + p[1], H)), 'FRAME', true, false, accDepth);
        poly(tab3.map(p => toIso(x0 + p[0], y0 + p[1], H)), 'FRAME', true, false, accDepth);

        // 4) 정면도 CManholeLT 40mm 저상형 림
        const rimH = 40;
        isoCircle(cx, cy, H + rimH, 300, 'XY', 'FRAME', accDepth);
        ln(toIso(cx - 300, cy, H), toIso(cx - 300, cy, H + rimH), 'FRAME', accDepth);
        ln(toIso(cx + 300, cy, H), toIso(cx + 300, cy, H + rimH), 'FRAME', accDepth);
        ln(toIso(cx, cy - 300, H), toIso(cx, cy - 300, H + rimH), 'FRAME', accDepth);
        ln(toIso(cx, cy + 300, H), toIso(cx, cy + 300, H + rimH), 'FRAME', accDepth);
        // 중앙 손잡이
        ln(toIso(cx - 70, cy, H + rimH + 25), toIso(cx + 70, cy, H + rimH + 25), 'FRAME', accDepth);
        ln(toIso(cx - 70, cy, H + rimH), toIso(cx - 70, cy, H + rimH + 25), 'FRAME', accDepth);
        ln(toIso(cx + 70, cy, H + rimH), toIso(cx + 70, cy, H + rimH + 25), 'FRAME', accDepth);
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
    const ladderEnts = [];
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

    // 7. 모서리 보강 앵글
    for (let i = 0; i < map.rows.length; i++) {
      const y0 = map.ys[i];
      for (let j = 0; j < map.cols.length; j++) {
        if (!map.has(i, j)) continue;
        if (!map.has(i - 1, j)) {
          const rDepth = getDepth(map.xs[j], y0, H / 2);
          ln(toIso(map.xs[j], y0, 0), toIso(map.xs[j], y0, H), 'REINF', rDepth);
          ln(toIso(map.xs[j + 1], y0, 0), toIso(map.xs[j + 1], y0, H), 'REINF', rDepth);
        }
        if (!map.has(i, j + 1)) {
          const xWall = map.xs[j + 1];
          const rDepth = getDepth(xWall, map.ys[i], H / 2);
          ln(toIso(xWall, map.ys[i], 0), toIso(xWall, map.ys[i], H), 'REINF', rDepth);
          if (map.has(i + 1, j)) {
            ln(toIso(xWall, map.ys[i + 1], 0), toIso(xWall, map.ys[i + 1], H), 'REINF', rDepth);
          }
        }
      }
    }

    // 8. 노즐 (Nozzles)
    if (opt.useNozzles !== false) {
      const nozzles = getNozzleList(opt);
      nozzles.forEach(n => {
        const spec = getNozzleSpec(n.size);
        const elev = typeof n.elev === 'number' ? n.elev : 300;
        const markLabel = `[${n.mark}] ${n.name} ${n.size}`;

        if (n.face === 'front') {
          const colIdx = Math.max(0, Math.min(n.seg - 1, map.cols.length - 1));
          const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + (n.offset || 0);
          let frontY = 0;
          for (let r = 0; r < map.rows.length; r++) {
            if (map.has(r, colIdx) && !map.has(r - 1, colIdx)) { frontY = map.ys[r]; break; }
          }
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
          for (let c = map.cols.length - 1; c >= 0; c--) {
            if (map.has(rowIdx, c) && !map.has(rowIdx, c + 1)) { rightX = map.xs[c + 1]; break; }
          }
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
        }
      });
    }

    // 9. 3D 등각 치수선 (L, W, H) - 사용자 요청으로 등각조감도 치수선 기입 생략


    // 10. 화가 알고리즘 (Painter's Algorithm) 정렬: 원거리(높은 depth) -> 근거리(낮은 depth)
    ents.forEach((e, idx) => { e._idx = idx; });
    ents.sort((a, b) => {
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
          if (poly.depth < eDepth - 15) {
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
    ents.push(...newEnts);
    opaquePolys.forEach(p => { delete p._bb; });

    ents.forEach(e => { delete e._idx; delete e.depth; });

    // 11. 외부 사다리(Ladder)는 판넬/틀에 덮여 가려지지 않도록 맨 마지막에 최상단으로 렌더링
    ents.push(...ladderEnts);

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
  // CInsideFrmLT: 사각 + 긴 부재의 분할선 + (가로 부재) 격자 폴리곤. lat: 0x20000 위쪽 격자 / 0x40000 아래쪽 격자
  function insideFrm(out, x, y, w, h, lat, rec) {
    const L = 'FRAME', ln = (a, b) => out.push({ t: 'line', a, b, layer: L });
    const DIV = 2000, MIN = 1000;
    const cuts = [];
    const divide = (len, at0) => {
      const at = d => { cuts.push(d); at0(d); };
      const cnt = (len % DIV > MIN) ? Math.trunc(len / DIV) : Math.trunc(len / DIV) - 1;
      if (cnt <= 0) return;
      for (let i = 1; i <= cnt; i++) at(DIV * i);
      const r = len % DIV;
      if (r >= 200 && r < 500) at(DIV * cnt + 1000); else if (r >= 500 && r < MIN) at(DIV * cnt + 1500);
    };
    if (w > h) divide(w, d => ln([x + d, y], [x + d, y + h])); else if (w < h) divide(h, d => ln([x, y + d], [x + w, y + d]));
    if (rec && w !== h) {
      const len = w > h ? w : h, cs = cuts.slice().sort((a, b) => a - b), pts = [0, ...cs, len], segs = [];
      for (let k = 0; k + 1 < pts.length; k++) segs.push(pts[k + 1] - pts[k]);
      rec.push({ hor: w > h, x, y, w, h, pts, segs });
    }
    if (w > h && (lat === 0x20000 || lat === 0x40000)) {
      const up = lat === 0x20000, sg = up ? 1 : -1, y0 = up ? y + h : y;
      [1, -1].forEach(k => {
        const x0 = k > 0 ? x : x + w, s = k;
        const P = [[x0, y0], [x0, y0 + sg * 100], [x0 + s * 30, y0 + sg * 100], [x0 + s * 30, y0 + sg * 30], [x0 + s * 100, y0 + sg * 30], [x0 + s * 100, y0]];
        for (let q = 0; q < 6; q++) ln(P[q], P[(q + 1) % 6]);
      });
    }
    rectEnts(x, y, w, h, L, out);
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

  function buildSkid(opt) {
    const G = frameGeom(opt), { R, sRow, eRow, sCol, eCol, nLeft, nRight, nTop, nBottom } = G;
    const ents = [], rec = [], add = (x, y, w, h, lat) => insideFrm(ents, x, y, w, h, lat, rec);
    let nX = nLeft, nY = nTop, nHeight = 0, base = false, rc, i, j;
    // 왼쪽 세로 프레임
    for (i = sRow; i <= eRow; i++) {
      rc = R(i, sCol);
      if (!rc) {
        if (!nHeight) continue;
        add(nX - 75, nY, 75, nHeight + 75, 0x20000); nHeight = 0;
        for (i = i + 1; i <= eRow; i++) { rc = R(i, sCol); if (!rc) continue; nY = rc.t; break; }
      }
      if (rc) { nHeight += rc.h; if (!base) { nY = rc.t; base = true; } }
    }
    if (nHeight) add(nX - 75, nY, 75, nHeight + 75, 0x20000);
    // 오른쪽 세로 프레임
    nX = nRight; nY = nTop; nHeight = 0; base = false;
    for (i = sRow; i <= eRow; i++) {
      rc = R(i, eCol);
      if (!rc) {
        if (!nHeight) continue;
        add(nX, nY, 75, nHeight + 75, 0x20000); nHeight = 0;
        for (i = i + 1; i <= eRow; i++) { rc = R(i, eCol); if (!rc) continue; nY = rc.t; break; }
      }
      if (rc) { nHeight += rc.h; if (!base) { nY = rc.t; base = true; } }
    }
    if (nHeight) add(nX, nY, 75, nHeight + 75, 0x20000);
    // 가로 프레임 (행마다)
    nX = nLeft; nY = nTop; let nWidth = 0; base = false;
    let cntDown = Math.trunc((eRow + 2 - sRow) / 2) + ((eRow + 2 - sRow) % 2);
    for (i = sRow; i <= eRow; i++) {
      const lat = (cntDown-- > 0 || i === sRow) ? 0x20000 : 0x40000;
      for (j = sCol; j <= eCol; j++) {
        rc = R(i, j);
        if (!rc) {
          rc = R(i - 1, j);
          if (!rc) {
            if (nWidth) {
              nX === nLeft ? add(nX, nY, nWidth, 75, lat) : add(nX + 45, nY, nWidth - 45, 75, lat);
              nWidth = 0;
            }
            for (j = j + 1; j <= eCol; j++) { rc = R(i, j); if (!rc) continue; nX = rc.l; break; }
          }
        }
        if (rc) { nWidth += rc.w; if (!base) { nX = rc.l; base = true; } }
      }
      if (nWidth) nX === nLeft ? add(nX, nY, nWidth, 75, lat) : add(nX + 45, nY, nWidth - 45, 75, lat);
      nX = nLeft; nY = G.rowTop(i + 1); nWidth = 0; base = false;
    }
    // 마지막 행 위쪽 가로 프레임
    nX = nLeft; nY = nBottom; nWidth = 0; base = false;
    for (j = sCol; j <= eCol; j++) {
      rc = R(eRow, j);
      if (!rc) {
        if (nWidth) { nX === nLeft ? add(nX, nY, nWidth, 75, 0x40000) : add(nX + 45, nY, nWidth - 45, 75, 0x40000); nWidth = 0; }
        for (j = j + 1; j <= eCol; j++) { rc = R(eRow, j); if (!rc) continue; nX = rc.l; break; }
      }
      if (rc) { nWidth += rc.w; if (!base) { nX = rc.l; base = true; } }
    }
    if (nWidth) nX === nLeft ? add(nX, nY, nWidth, 75, 0x40000) : add(nX + 45, nY, nWidth - 45, 75, 0x40000);
    // 열 사이 세로 프레임
    for (j = sCol; j < eCol; j++) {
      for (i = sRow; i <= eRow; i++) {
        let rcL = R(i, j), rcR = R(i, j + 1);
        if (!rcL && !rcR) continue;
        if (!rcL) {
          if (sRow === i) { nX = rcR.l + 45 - 75; nY = rcR.t; nHeight = rcR.h + 75; } else { nX = rcR.l + 45 - 75; nY = rcR.t + 75; nHeight = rcR.h; }
          for (i = i + 1; i <= eRow; i++) { rcL = R(i, j); if (!rcL) { rcR = R(i, j + 1); if (!rcR) break; nHeight += rcR.h; } else break; }
          i--; if (i === eRow) nHeight += 75;
          add(nX, nY, 75, nHeight - 75, 0x20000);
        } else if (!rcR) {
          if (sRow === i) { nX = rcL.r; nY = rcL.t; nHeight = rcL.h + 75; } else { nX = rcL.r; nY = rcL.t + 75; nHeight = rcL.h; }
          for (i = i + 1; i <= eRow; i++) { rcR = R(i, j + 1); if (!rcR) { rcL = R(i, j); if (!rcL) break; nHeight += rcL.h; } else break; }
          i--; if (i === eRow) nHeight += 75;
          add(nX, nY, 75, nHeight - 75, 0x20000);
        } else add(rcL.r, rcL.t + 75, 45, rcL.h - 75, 0x20000);
      }
    }
    const tH = frameTextH(G.map, opt), st = tH * 0.8;
    rec.forEach(m => m.segs.forEach((sl, k) => {          // 부재(분할 조각)별 실제 길이
      const mid = (m.pts[k] + m.pts[k + 1]) / 2;
      if (m.hor) ents.push({ t: 'text', p: [m.x + mid, m.y + m.h / 2 - st * 0.35], h: st, s: String(sl), rot: 0, align: 'center', layer: 'DIM' });
      else ents.push({ t: 'text', p: [m.x + m.w / 2 + st * 0.35, m.y + mid], h: st, s: String(sl), rot: 90, align: 'center', layer: 'DIM' });
    }));
    frameDims(ents, G.map, tH, true, true);
    // 부품 목록 (길이별 수량)
    const cnt = {}; rec.forEach(m => m.segs.forEach(sl => { cnt[sl] = (cnt[sl] || 0) + 1; }));
    const list = Object.entries(cnt).sort((a, b) => b[0] - a[0]);
    const lx = G.map.length / 2 - 900, ly0 = -tH * 12;
    ents.push({ t: 'text', p: [lx, ly0], h: tH, s: 'PART LIST (FRAME ' + (opt.frame || 75) + ')', rot: 0, align: 'left', layer: 'DIM' });
    list.forEach(([l, n], i) => ents.push({ t: 'text', p: [lx, ly0 - (i + 1) * tH * 1.6], h: tH * 0.9, s: 'L=' + l + ' x ' + n + ' EA', rot: 0, align: 'left', layer: 'DIM' }));
    return { ents, G };
  }
  // 기초 프레임 단면도 (BaseFrameCross): 폭 방향 부재 단면
  function buildSkidCross(opt) {
    const th = opt.frame || 75, ents = [], mx = 75, T = 20, ch = th >= 100;
    const wl = []; { const sw = (opt.width || []).filter(Boolean); let c0 = 0; sw.forEach(sn => { sideSplit(sn, c0).forEach(w => wl.push(w)); c0 += sn; }); }
    const down = y => { const P = ch ? [[0, -mx], [T, -mx + T], [T, mx - T], [th - T, mx - T], [th - T, -mx + T], [th, -mx], [th, mx], [0, mx]]
      : [[0, -mx], [T, -mx + T], [T, mx - T], [th - T, mx - T], [th, mx], [0, mx]]; for (let k = 0; k < P.length; k++) ents.push({ t: 'line', a: [P[k][0], y + P[k][1]], b: [P[(k + 1) % P.length][0], y + P[(k + 1) % P.length][1]], layer: 'FRAME' }); };
    const up = y => { const P = ch ? [[0, -mx], [th, -mx], [th, mx], [th - T, mx - T], [th - T, -mx + T], [T, -mx + T], [T, mx - T], [0, mx]]
      : [[0, -mx], [th, -mx], [th - T, -mx + T], [T, -mx + T], [T, mx - T], [0, mx]]; for (let k = 0; k < P.length; k++) ents.push({ t: 'line', a: [P[k][0], y + P[k][1]], b: [P[(k + 1) % P.length][0], y + P[(k + 1) % P.length][1]], layer: 'FRAME' }); };
    const cn = wl.length; let div = (cn + 1) >> 1; if ((cn + 1) % 2) div++;
    let y = 0; down(0);
    const ys = [0]; for (let k = 1; k <= cn; k++) { y += wl[k - 1]; ys.push(y); (k < div ? up : (k < cn ? down : up))(y); }
    const tH = Math.max(60, Math.round(y / 100), Math.round(2.4 * (opt._N || 0))), xr = th + 75 + tH * 4;
    for (let k = 0; k < cn; k++) dimLinear(ents, [th, ys[k]], [th, ys[k + 1]], xr, true, String(wl[k]), tH, 'DIM');
    for (let k = 0; k < cn; k++) dimLinear(ents, [0, ys[k] + mx], [0, ys[k + 1] - mx], -tH * 3, true, String(wl[k] - 2 * mx), tH, 'DIM');   // 부재 사이 실제(순) 간격
    dimLinear(ents, [th, 0], [th, y], xr + tH * 3, true, String(y), tH, 'DIM');
    dimLinear(ents, [0, -mx], [th, -mx], -mx - tH * 3, false, String(th), tH, 'DIM');
    dimLinear(ents, [0, -mx], [0, mx], -tH * 6, true, String(2 * mx), tH, 'DIM');
    dimLinear(ents, [0, -mx], [T, -mx], -mx - tH * 6.5, false, String(T), tH, 'DIM');
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
  const SHEET = { w: 841, h: 594, title: 200, margin: 10 };   // 종이 mm (표제란 200mm 최적 확장)
  function pickScale(L, W, H, isAsm5 = false) {
    const extraIso = isAsm5 ? Math.max(1200, Math.round((L + W) * 0.65)) : 0;
    const w_model = L + 150 + Math.max(L + 500, W + 150) + extraIso;
    const h_model = W + 400 + H + 800;
    const avail_w = SHEET.w - SHEET.title - SHEET.margin * 2; // 621 mm
    const avail_h = SHEET.h - SHEET.margin * 2;              // 574 mm
    for (const n of SCALES) {
      const w_paper = w_model / n + (isAsm5 ? 120 : 100);
      const h_paper = h_model / n + 110;
      if (w_paper <= avail_w - 20 && h_paper <= avail_h - 20) return n;
    }
    return SCALES[SCALES.length - 1];
  }
  function bb(es) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    (es || []).forEach(e => {
      if (e.a && e.b) {
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
    opt = { ...opt };
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
    const conc = buildConcrete(opt);
    const hs = (opt.hseg && opt.hseg.length) ? opt.hseg : heightSegs(H, opt.b11);
    opt.hseg = hs;
    const front = sideT ? buildElevation(opt, sideT, 'front') : null;
    const side = sideT ? buildElevation(opt, sideT, 'side') : null;

    const ents = [], t = opt.title || {};
    const S = SHEET, x0 = S.margin, y0 = S.margin, x1 = S.w - S.margin, y1 = S.h - S.margin;
    const line = (a, b) => ents.push({ t: 'line', a: [P(a[0]), P(a[1])], b: [P(b[0]), P(b[1])], layer: 'SHEET' });
    const circle = (c, r) => ents.push({ t: 'circle', c: [P(c[0]), P(c[1])], r: P(r), layer: 'SHEET' });
    const rect = (xa, ya, xb, yb) => { line([xa, ya], [xb, ya]); line([xb, ya], [xb, yb]); line([xb, yb], [xa, yb]); line([xa, yb], [xa, ya]); };
    const text = (x, y, h, str, align, rot, valign) => { if (str) ents.push({ t: 'text', p: [P(x), P(y)], h: P(h), s: str, rot: rot || 0, align: align || 'left', valign: valign || 'baseline', layer: 'SHEET' }); };
    rect(x0, y0, x1, y1);
    const tx0 = x1 - S.title, tw = S.title;
    line([tx0, y0], [tx0, y1]);

    // 머리글 (회사 로고 및 영문 회사정보/주소 삽입)
    let y = y1;
    // 1. 회사명 및 로고 (높이 16mm)
    y -= 16;
    line([tx0, y], [x1, y]);
    // 회사 로고 마크 (원형 이니셜 엠블럼 - 설정값 연동)
    const logoX = tx0 + 15, logoY = y + 8;
    const logoTxt = (t.logoText !== undefined && t.logoText !== null) ? t.logoText : 'Y';
    if (logoTxt) {
      circle([logoX, logoY], 5.8);
      circle([logoX, logoY], 5.0);
      text(logoX, logoY, 5.5, logoTxt, 'center', 0, 'middle');
    }
    const compName = t.customer || 'YSACC CO.,LTD';
    text(tx0 + 28 + (tw - 28) / 2, y + 8, 6.2, compName, 'center', 0, 'middle');

    // 2. 제품명 (높이 12mm - 설정값 연동)
    y -= 12;
    line([tx0, y], [x1, y]);
    const defProd = (opt.material === 'STS' ? 'STS' : 'GRP') + ' PANEL WATER TANK';
    const prodName = (t.prodName && t.prodName.trim()) ? t.prodName.trim() : defProd;
    text(tx0 + tw / 2, y + 6, 5.5, prodName, 'center', 0, 'middle');

    // 3. 영문 주소 및 연락처 (높이 16mm)
    y -= 16;
    line([tx0, y], [x1, y]);
    const rawAddr = t.address || '201-1, 1251, Garosu-ro, Heungdeok-gu, Cheongju-si, Chungcheongbuk-do, 28420, Republic of Korea';
    const telInfo = t.tel ? (t.tel.toUpperCase().includes('TEL') ? t.tel : ('TEL : ' + t.tel)) : '';
    let addrLines = [rawAddr];
    if (rawAddr.length > 45) {
      const splitKey = 'Cheongju-si,';
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
        text(tx0 + tw / 2, y + 11.5, 3.2, addrLines[0], 'center', 0, 'middle');
        text(tx0 + tw / 2, y + 7.5, 3.2, addrLines[1], 'center', 0, 'middle');
        text(tx0 + tw / 2, y + 3.2, 3.0, telInfo, 'center', 0, 'middle');
      } else {
        text(tx0 + tw / 2, y + 10.0, 3.5, addrLines[0], 'center', 0, 'middle');
        text(tx0 + tw / 2, y + 4.5, 3.3, telInfo, 'center', 0, 'middle');
      }
    } else {
      if (addrLines.length > 1) {
        text(tx0 + tw / 2, y + 10.5, 3.5, addrLines[0], 'center', 0, 'middle');
        text(tx0 + tw / 2, y + 5.5, 3.5, addrLines[1], 'center', 0, 'middle');
      } else {
        text(tx0 + tw / 2, y + 8.0, 3.8, addrLines[0], 'center', 0, 'middle');
      }
    }

    // 하부 표 (아래에서 위로 - 칸 대폭 확대 및 글씨 시인성/가독성 극대화)
    const fd = a => { const v = a.filter(Boolean).map(x => x / 1000); return v.length > 1 ? '(' + v.join('+') + ')' : String(v[0] || 0); };
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
    let ty = y0;
    const colLabelW = 60, colValW = tw - colLabelW;

    const lang = opt.drawingLang || opt.lang || 'ko';

    // 1. TITLE (높이 32mm, 폰트 5.5 / 6.5mm)
    const titleH = 32;
    line([tx0, ty + titleH], [x1, ty + titleH]);
    const titleLabel = lang === 'ko' ? '도면명' : (lang === 'bilingual' ? 'TITLE (도면명)' : 'TITLE');
    text(tx0 + colLabelW / 2, ty + titleH / 2, 5.0, titleLabel, 'center', 0, 'middle');
    line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + titleH]);
    const titleVal = opt.sheetKind === 'frame' ? (lang === 'ko' ? '기초 프레임 및 스테이 도면' : 'STEEL SKID DRAWING') : opt.sheetKind === 'detail' ? (lang === 'ko' ? '탱크 상세도' : 'DETAILS DWG') : opt.sheetKind === 'pad' ? (lang === 'ko' ? '기초 콘크리트 패드 도면' : 'FOUNDATION PAD DWG') : dimStr + '\n= ' + ton + ' Ton';
    const tparts = titleVal.split('\n');
    if (tparts.length > 1) {
      const maxChar = Math.max(tparts[0].length, tparts[1].length);
      const fs = maxChar > 35 ? 4.2 : (maxChar > 24 ? 5.0 : 6.2);
      text(tx0 + colLabelW + colValW / 2, ty + titleH / 2 + 5.5, fs, tparts[0], 'center', 0, 'middle');
      text(tx0 + colLabelW + colValW / 2, ty + titleH / 2 - 5.5, 6.2, tparts[1], 'center', 0, 'middle');
    } else {
      text(tx0 + colLabelW + colValW / 2, ty + titleH / 2, 6.5, titleVal, 'center', 0, 'middle');
    }
    ty += titleH;

    // 2. PROJECT (높이 22mm, 폰트 5.0 / 5.2mm)
    const projH = 22;
    line([tx0, ty + projH], [x1, ty + projH]);
    const projLabel = lang === 'ko' ? '공사명' : (lang === 'bilingual' ? 'PROJECT (공사명)' : 'PROJECT');
    text(tx0 + colLabelW / 2, ty + projH / 2, 5.0, projLabel, 'center', 0, 'middle');
    line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + projH]);
    text(tx0 + colLabelW + colValW / 2, ty + projH / 2, 5.2, t.project || '', 'center', 0, 'middle');
    ty += projH;

    // 3. 5개 사양 행 (각 13.0mm, 폰트 4.8 / 5.0mm로 대폭 확대)
    const rowH = 13.0;
    const rows = [
      [lang === 'ko' ? '고객명' : (lang === 'bilingual' ? 'Client (고객명)' : 'Client'), t.client || ''],
      [lang === 'ko' ? '설계감리' : (lang === 'bilingual' ? 'Consultant (감리)' : 'Consultant'), t.consultant || ''],
      [lang === 'ko' ? '시공사' : (lang === 'bilingual' ? 'Contractor (시공)' : 'Main Contractor'), t.contractor || ''],
      [lang === 'ko' ? '설비공사' : (lang === 'bilingual' ? 'MEP (설비)' : 'MEP Contractor'), t.mep || ''],
      [lang === 'ko' ? '탱크규격' : (lang === 'bilingual' ? 'TANK SIZE (규격)' : 'TANK SIZE'), dimStr]
    ];
    rows.slice().reverse().forEach(([k, v]) => {
      line([tx0, ty + rowH], [x1, ty + rowH]);
      text(tx0 + colLabelW / 2, ty + rowH / 2, 4.8, k, 'center', 0, 'middle');
      line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + rowH]);
      const fs = (k.includes('TANK SIZE') && v && v.length > 30) ? 3.8 : (k.includes('TANK SIZE') && v && v.length > 20 ? 4.3 : 5.0);
      text(tx0 + colLabelW + colValW / 2, ty + rowH / 2, fs, v, 'center', 0, 'middle');
      ty += rowH;
    });

    // 4. 서명란 / DATE / SCALE / Chart No. (각 13.0mm, 폰트 4.8 / 5.0mm)
    const today = new Date(), pad2 = v => String(v).padStart(2, '0');
    const info = [
      [lang === 'ko' ? '도면번호' : (lang === 'bilingual' ? 'DWG NO. (도번)' : 'DWG NO.'), t.dwgNo || ''],
      [lang === 'ko' ? '도면식별' : (lang === 'bilingual' ? 'Chart No.' : 'Chart No.'), t.chartNo || ''],
      [lang === 'ko' ? '축척' : (lang === 'bilingual' ? 'SCALE (축척)' : 'SCALE'), '1 / ' + N],
      [lang === 'ko' ? '일자' : (lang === 'bilingual' ? 'DATE (일자)' : 'DATE'), t.date || (today.getFullYear() + '.' + pad2(today.getMonth() + 1) + '.' + pad2(today.getDate()))]
    ];
    info.forEach(([k, v]) => {
      line([tx0, ty + rowH], [x1, ty + rowH]);
      text(tx0 + colLabelW / 2, ty + rowH / 2, 4.8, k, 'center', 0, 'middle');
      line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + rowH]);
      text(tx0 + colLabelW + colValW / 2, ty + rowH / 2, 5.0, v, 'center', 0, 'middle');
      ty += rowH;
    });

    // 5. 서명 승인란 (DRAWN, CHECKED, APPROVED) (높이 30mm: 헤더 12mm, 서명란 18mm)
    const signHeaderH = 12, signValH = 18;
    line([tx0, ty + signValH], [x1, ty + signValH]);
    line([tx0, ty + signValH + signHeaderH], [x1, ty + signValH + signHeaderH]);
    const scw = tw / 3;
    const signLabels = lang === 'ko' ? ['작도', '검토', '승인'] : (lang === 'bilingual' ? ['작도(DWN)', '검토(CHK)', '승인(APP)'] : ['DRAWN', 'CHECKED', 'APPROVED']);
    signLabels.forEach((k, i) => {
      text(tx0 + scw * i + scw / 2, ty + signValH + signHeaderH / 2, 4.8, k, 'center', 0, 'middle');
      if (i > 0) line([tx0 + scw * i, ty], [tx0 + scw * i, ty + signValH + signHeaderH]);
    });
    if (t.drawn) text(tx0 + scw / 2, ty + signValH / 2, 5.0, t.drawn, 'center', 0, 'middle');
    ty += signValH + signHeaderH;

    // 2. 부품 사양 명세표 (ITEM LIST / BOM Table)
    const boms = (opt.itemList && opt.itemList.length) ? opt.itemList : buildDefaultBOM(opt);
    const activeBoms = boms.filter(b => b && (b.name || b.items));
    let itemTableTop = ty;
    if (activeBoms.length) {
      const colDefs = [
        { key: 'no', label: 'NO.', w: 12 },
        { key: 'name', label: lang === 'ko' ? '품명' : (lang === 'en' ? 'ITEMS' : 'ITEMS (품명)'), w: 44 },
        { key: 'mat', label: lang === 'ko' ? '재질' : (lang === 'en' ? 'MATERIAL' : 'MATERIAL (재질)'), w: 32 },
        { key: 'qty', label: lang === 'ko' ? '수량' : (lang === 'en' ? 'QTY' : 'QTY (수량)'), w: 18 },
        { key: 'spec', label: lang === 'ko' ? '사양 및 규격' : (lang === 'en' ? 'SPECIFICATIONS' : 'SPECIFICATIONS (사양)'), w: 76 }
      ];
      const tableW = 182; // tx0 + 4 to x1 - 4
      const bCnt = activeBoms.length;
      const rowH = bCnt > 12 ? 4.4 : (bCnt > 8 ? 4.8 : 5.5);
      const headH = 5.5, titleH = 6.5;
      const dataFontH = bCnt > 12 ? 2.5 : (bCnt > 8 ? 2.8 : 3.2);
      const headFontH = 3.2, titleFontH = 4.2;

      const totalTblH = titleH + headH + bCnt * rowH;
      itemTableTop = ty + totalTblH + 6;
      let yy = itemTableTop;
      const tableX0 = tx0 + 4, tableX1 = x1 - 4;

      // 1. 타이틀 행
      const itemTableTitle = lang === 'en' ? '2. ITEM LIST' : (lang === 'ko' ? '2. 부품 사양 명세표' : '2. ITEM LIST (부품 사양 명세표)');
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
        { key: 'mark', label: 'NO.', w: 16 },
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
      const nozTableTitle = lang === 'en' ? 'NOZZLE SCHEDULE' : (lang === 'ko' ? '배관 노즐 일람표' : 'NOZZLE SCHEDULE (배관 노즐 일람표)');
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
      const faceNameMap = lang === 'en' ? { front: 'FRONT', rear: 'REAR', left: 'LEFT', right: 'RIGHT', top: 'TOP' } : (lang === 'ko' ? { front: '정면', rear: '배면', left: '좌측', right: '우측', top: '상부' } : { front: 'FRONT (정면)', rear: 'REAR (배면)', left: 'LEFT (좌측)', right: 'RIGHT (우측)', top: 'TOP (상부)' });
      activeNozzles.forEach(n => {
        curColX = tableX0;
        const elevStr = n.face === 'top' ? 'TOP' : ('EL.+' + (typeof n.elev === 'number' ? n.elev.toLocaleString() : n.elev));
        const rowVals = [
          n.mark,
          n.name + (n.desc ? ' (' + n.desc + ')' : ''),
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
    if (!allNotes.length) allNotes = ['No special remarks.'];

    let ny = y - 8;
    const remarksTitle = lang === 'en' ? '<Remarks>' : (lang === 'ko' ? '<일반 사항 (Remarks)>' : '<Remarks / 일반 사항>');
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

    // 뷰 타이틀 기호 (T 1/1 원형 마크, 이중 밑줄 및 한글 뷰 명칭)
    const drawViewTitleBubble = (tank_cx, title_y, sheetNo, viewNo, titleText) => {
      const R = 6.0;
      const lineW = 75;
      const gap = 1.0;
      const bx = tank_cx - lineW / 2;
      const by = title_y;

      // 1. 원형 기호
      circle([bx, by], R);

      // 2. 원형 내부 수평 분할선 및 우측 상단 밑줄 (연속선)
      line([bx - R, by], [bx + R + lineW, by]);

      // 3. 원형 내부 하단 수직 분할선
      line([bx, by], [bx, by - R]);

      // 4. 이중 밑줄 중 하단 평행선 (원 우측 둘레에서 시작)
      const dx_circ = Math.sqrt(Math.max(0, R * R - gap * gap));
      line([bx + dx_circ, by - gap], [bx + R + lineW, by - gap]);

      // 5. 원 내부 표식: 상단 T, 하단 좌측 시트번호(1), 하단 우측 뷰번호(1~5)
      text(bx, by + R * 0.44, 3.4, 'T', 'center', 0, 'middle');
      text(bx - R * 0.48, by - R * 0.48, 2.5, String(sheetNo), 'center', 0, 'middle');
      text(bx + R * 0.48, by - R * 0.48, 2.5, String(viewNo), 'center', 0, 'middle');

      // 6. 이중 밑줄 위 한글 뷰 명칭 (가운데 정렬)
      const textX = bx + R + lineW / 2;
      text(textX, by + 3.6, 5.0, titleText, 'center', 0, 'middle');
    };

    if (opt.sheetKind === 'detail') {
      ents.push(...buildDetails(opt, N, P, x0, y0, tx0, y1));
      return { map: mmap, ents, scale: N, elev: false, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
    }
    if (opt.sheetKind === 'frame') {
      const placeFrame = (es, qx, qy, name) => {
        const b = bb(es), cx = x0 + (tx0 - x0) * qx, cy = y0 + (y1 - y0) * qy;
        const dx = P(cx) - (b[0] + b[2]) / 2, dy = P(cy) - (b[1] + b[3]) / 2;
        es.forEach(e => {
          if (e.t === 'line') ents.push({ ...e, a: [e.a[0] + dx, e.a[1] + dy], b: [e.b[0] + dx, e.b[1] + dy] });
          else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] + dx, e.c[1] + dy] });
          else ents.push({ ...e, p: [e.p[0] + dx, e.p[1] + dy] });
        });
        const lx = cx, ly = (b[1] + dy) / N - 10;
        const w = Math.max(40, name.length * 3.6);
        text(lx, ly, 5.5, name, 'center');
        line([lx - w / 2, ly - 2.5], [lx + w / 2, ly - 2.5]);
        text(lx, ly - 7.5, 3.5, 'SCALE  1 / ' + N, 'center');
      };
      placeFrame(buildStay(opt).ents, 0.45, 0.72, 'INTERNAL STAY DRAWING');
      placeFrame(buildSkid(opt).ents, 0.32, 0.26, 'STEEL SKID DRAWING');
      placeFrame(buildSkidCross(opt).ents, 0.78, 0.26, 'FRAME CROSS DWG');
      return { map: mmap, ents, scale: N, elev: false, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
    }
    if (opt.sheetKind === 'pad') {
      const concPlan = buildConcrete(opt);
      const frontSec = buildFoundationSection(opt);
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
      const tbx = tx0 - 135, tby = y0 + 35;
      const tbw = 125, tbh = 72;
      rect(tbx, tby, tbx + tbw, tby + tbh);
      line([tbx, tby + tbh - 13], [tbx + tbw, tby + tbh - 13]);
      text(tbx + tbw / 2, tby + tbh - 6.5, 3.8, lang === 'en' ? 'FOUNDATION SPECIFICATION' : '기초 콘크리트 설계 사양', 'center', 0, 'middle');

      const padFirstW = Number(opt.padFirstW) || 400;
      const padMidW = Number(opt.padMidW) || 300;
      const padHVal = Number(opt.padH) || (600 - (Number(opt.frame) || 75));
      const padOv = (opt.padOverhang !== undefined && opt.padOverhang !== '') ? Number(opt.padOverhang) : Math.round(padFirstW / 2);
      const specs = [
        [lang === 'en' ? 'First/Last Pad Width' : '외측 패드 폭 (W1)', `${padFirstW} mm`],
        [lang === 'en' ? 'Middle Pad Width' : '중간 패드 폭 (W2)', `${padMidW} mm`],
        [lang === 'en' ? 'Pad Height' : '패드 높이 (H)', `${padHVal} mm`],
        [lang === 'en' ? 'Pad Overhang' : '패드 돌출 (Ov)', `${padOv} mm`],
        [lang === 'en' ? 'Concrete Strength' : '콘크리트 강도', '21 MPa (210 kgf/cm²)'],
        [lang === 'en' ? 'Anchor Bolt' : '기초 앙카볼트', 'M16 (SUS304)']
      ];
      const rH = (tbh - 13) / specs.length;
      specs.forEach(([k, v], sIdx) => {
        const ry = tby + tbh - 13 - (sIdx + 1) * rH;
        if (sIdx > 0) line([tbx, ry + rH], [tbx + tbw, ry + rH]);
        line([tbx + 68, ry], [tbx + 68, ry + rH]);
        text(tbx + 4, ry + rH / 2, 2.6, k, 'left', 0, 'middle');
        text(tbx + 72, ry + rH / 2, 2.6, v, 'left', 0, 'middle');
      });

      return { map: mmap, ents, scale: N, elev: false, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
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
    const dim_left_1 = 75 + Math.round(30.0 * N);   // 좌측 치수선 2열 및 치수 문자 가용 영역
    const dim_right_1 = 75 + Math.round(16.0 * N);  // 우측 풍선 기호(리드선+반경) 가용 영역
    const dim_bottom_1 = Math.round(18.0 * N);
    const EXTC = 400;
    const GRD = -600;

    const len2 = Math.max(totalL, totalW);
    const col1_w = (dim_left_1 + totalL + dim_right_1) / N;
    const col2_w = (dim_left_1 + len2 + dim_right_1) / N;

    const row1_h = (EXTC + totalW + dim_bottom_1) / N + TITLE_H;
    const row2_h = front ? ((H + 100 - GRD + dim_bottom_1) / N + TITLE_H) : 0;

    const isAsm5 = (!opt.sheetKind || opt.sheetKind === 'asm');
    const areaW = tx0 - x0; // 약 600mm
    const areaH = y1 - y0; // 약 564mm

    // 가로 3열(또는 2열) 여백 및 간격 균형 배분
    let col1_tank_cx, col2_tank_cx, col3_cx, col3_avail_w;

    if (isAsm5) {
      // 3열 배치 (Col 1: 평면/정면, Col 2: 패드/측면, Col 3: 등각조감도)
      // Col 3에 쾌적한 전용 영역 할당
      const col3_target_w = Math.max(120, Math.min(180, areaW - col1_w - col2_w - 30));
      const total_3col_w = col1_w + col2_w + col3_target_w;
      const rem_w = Math.max(0, areaW - total_3col_w);
      const gap_x = Math.max(14, Math.min(25, rem_w / 4));
      const left_margin = Math.max(10, (areaW - total_3col_w - gap_x * 2) / 2);

      col1_tank_cx = x0 + left_margin + (dim_left_1 + totalL / 2) / N;
      col2_tank_cx = col1_tank_cx + (totalL / 2 + dim_right_1) / N + gap_x + (dim_left_1 + len2 / 2) / N;

      const col3_left = col2_tank_cx + (len2 / 2 + dim_right_1) / N + gap_x;
      col3_avail_w = Math.max(90, (tx0 - 10) - col3_left);
      col3_cx = col3_left + col3_avail_w / 2;
    } else {
      const total_views_w = col1_w + col2_w;
      const avail_w = Math.max(0, areaW - total_views_w);
      let left_margin = Math.max(16, avail_w * 0.28);
      let right_margin = Math.max(16, avail_w * 0.28);
      let gap_x = avail_w - left_margin - right_margin;
      if (gap_x > 50) {
        const extra = (gap_x - 50) / 2;
        left_margin += extra;
        right_margin += extra;
        gap_x = 50;
      }
      col1_tank_cx = x0 + left_margin + (dim_left_1 + totalL / 2) / N;
      col2_tank_cx = col1_tank_cx + (totalL / 2 + dim_right_1) / N + gap_x + (dim_left_1 + len2 / 2) / N;
    }

    // 세로 여백 및 간격 균형 배분
    const total_views_h = row1_h + row2_h;
    const avail_h = Math.max(0, areaH - total_views_h);
    let top_margin = Math.max(16, avail_h * 0.28);
    let bottom_margin = Math.max(16, avail_h * 0.28);
    let gap_y = avail_h - top_margin - bottom_margin;
    if (gap_y > 60) {
      const extra = (gap_y - 60) / 2;
      top_margin += extra;
      bottom_margin += extra;
      gap_y = 60;
    }

    const row1_tank_cy = y1 - top_margin - (PAD_OVERHANG + 50) / N - totalW / (2 * N);
    const row2_ground_y = y0 + bottom_margin + TITLE_H + dim_bottom_1 / N;

    // 1열(TOP & FRONT) 수직 투영 100% 일치
    const dx1 = P(col1_tank_cx) - totalL / 2;
    // 2열(CON'C & SIDE)
    const dx2_conc = P(col2_tank_cx) - totalL / 2;
    const dx2_side = P(col2_tank_cx) - totalW / 2;

    // 1행(TOP & CON'C) 수평 투영 및 중심 높이 100% 일치
    const dy1 = P(row1_tank_cy) - totalW / 2;
    // 2행(FRONT & SIDE) 수평 그라운드 투영 100% 일치
    const dy2 = P(row2_ground_y) - GRD;

    const translateEnts = (es, dx, dy) => {
      es.forEach(e => {
        if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] + dx, p[1] + dy]) });
        else if (e.t === 'line') ents.push({ ...e, a: [e.a[0] + dx, e.a[1] + dy], b: [e.b[0] + dx, e.b[1] + dy] });
        else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] + dx, e.c[1] + dy] });
        else ents.push({ ...e, p: [e.p[0] + dx, e.p[1] + dy] });
      });
    };

    // 1행 뷰 배치 (TOP VIEW & BASIC CON'C)
    translateEnts(plan.ents, dx1, dy1);
    translateEnts(conc.ents, dx2_conc, dy1);

    // 1행 뷰 타이틀 (평면도 & 기초패드도) - 치수선과 절대 겹치지 않게 동일한 Y 선상에 수평 정렬
    const dimGap2 = Math.round(18.0 * N);
    const row1_title_y = (dy1 - PAD_OVERHANG - dimGap2) / N - 14.0;
    const viewTitlePlan = lang === 'en' ? 'PLAN VIEW' : (lang === 'bilingual' ? '평 면 도 (PLAN VIEW)' : '평  면  도');
    const viewTitlePad = lang === 'en' ? 'FOUNDATION PAD PLAN' : (lang === 'bilingual' ? '기 초 패 드 도 (FOUNDATION PLAN)' : '기  초  패  드  도');
    drawViewTitleBubble(col1_tank_cx, row1_title_y, 1, 1, viewTitlePlan);
    drawViewTitleBubble(col2_tank_cx, row1_title_y, 1, 2, viewTitlePad);

    let elev = false;
    if (front && side) {
      // 2행 뷰 배치 (정면도 & 우측면도)
      translateEnts(front.ents, dx1, dy2);
      translateEnts(side.ents, dx2_side, dy2);

      // 2행 뷰 타이틀 - 동일한 Y 선상에 수평 정렬
      const row2_title_y = (dy2 + GRD - dim_bottom_1) / N - 14.0;
      const viewTitleFront = lang === 'en' ? 'FRONT ELEVATION' : (lang === 'bilingual' ? '정 면 도 (FRONT ELEVATION)' : '정  면  도');
      const viewTitleSide = lang === 'en' ? 'RIGHT SIDE ELEVATION' : (lang === 'bilingual' ? '우 측 면 도 (SIDE ELEVATION)' : '우  측  면  도');
      drawViewTitleBubble(col1_tank_cx, row2_title_y, 1, 3, viewTitleFront);
      drawViewTitleBubble(col2_tank_cx, row2_title_y, 1, 4, viewTitleSide);

      // 5. 등각 조감도 (View 5: 3D ISOMETRIC VIEW) 배치
      if (isAsm5 && col3_avail_w) {
        const iso = buildIsometric(opt, templates, sideT);
        const b_iso = bb(iso.ents);
        const isoW_mm = (b_iso[2] - b_iso[0]) / N;
        const isoH_mm = (b_iso[3] - b_iso[1]) / N;

        const iso_avail_h = Math.max(120, (row1_tank_cy + totalW / (2 * N)) - (row2_title_y + 12));
        const isoFitScale = Math.min((col3_avail_w * 0.90) / isoW_mm, (iso_avail_h * 0.85) / isoH_mm);

        const iso_cy = (row1_tank_cy + row2_ground_y) / 2 + 10;
        const isoDx = P(col3_cx) - ((b_iso[0] + b_iso[2]) / 2) * isoFitScale;
        const isoDy = P(iso_cy) - ((b_iso[1] + b_iso[3]) / 2) * isoFitScale;

        iso.ents.forEach(e => {
          if (e.t === 'poly') ents.push({ ...e, pts: e.pts.map(p => [p[0] * isoFitScale + isoDx, p[1] * isoFitScale + isoDy]) });
          else if (e.t === 'line') ents.push({ ...e, a: [e.a[0] * isoFitScale + isoDx, e.a[1] * isoFitScale + isoDy], b: [e.b[0] * isoFitScale + isoDx, e.b[1] * isoFitScale + isoDy] });
          else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] * isoFitScale + isoDx, e.c[1] * isoFitScale + isoDy], r: e.r * isoFitScale });
          else ents.push({ ...e, p: [e.p[0] * isoFitScale + isoDx, e.p[1] * isoFitScale + isoDy], h: e.h * isoFitScale });
        });

        const viewTitleIso = lang === 'en' ? '3D ISOMETRIC VIEW' : (lang === 'bilingual' ? '등 각 조 감 도 (3D ISOMETRIC)' : '등  각  조  감  도');
        drawViewTitleBubble(col3_cx, row2_title_y, 1, 5, viewTitleIso);
      }
      elev = true;
    }
    const blocks = Object.assign({}, plan.blocks, (front && front.blocks), (side && side.blocks));
    ents.blocks = blocks;
    return { map: mmap, ents, blocks, scale: N, elev, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
  }

  /* ---------- DXF (AutoCAD R12 ASCII, mm) ---------- */
  const LAYERS = { PANEL: 7, PANEL_DETAIL: 8, FRAME: 1, REINF: 5, WALL: 1, DIM: 3, SHEET: 7, BALLOON: 6, NOZZLE: 4 };
  const dxfText = str => Array.from(str).map(ch => { const c = ch.codePointAt(0); return c < 128 ? ch : '\\U+' + c.toString(16).toUpperCase().padStart(4, '0'); }).join('');

  function toDxf(ents, blocks) {
    const o = [];
    const g = (c, v) => { o.push(String(c)); o.push(String(v)); };
    const n = v => (Math.round(v * 1000) / 1000).toString();
    g(0, 'SECTION'); g(2, 'HEADER'); g(9, '$ACADVER'); g(1, 'AC1009'); g(9, '$INSUNITS'); g(70, 4); g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'TABLES'); g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 1);
    g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, 0);
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, Object.keys(LAYERS).length + 1);
    g(0, 'LAYER'); g(2, '0'); g(70, 0); g(62, 7); g(6, 'CONTINUOUS');
    Object.entries(LAYERS).forEach(([k, c]) => { g(0, 'LAYER'); g(2, k); g(70, 0); g(62, c); g(6, 'CONTINUOUS'); });
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'STYLE'); g(70, 1);
    g(0, 'STYLE'); g(2, 'STANDARD'); g(70, 0); g(40, 0); g(41, 0.85); g(50, 0); g(71, 0); g(42, 2.5);
    g(3, 'simplex.shx'); g(4, 'whgtxt.shx');
    g(0, 'ENDTAB');
    g(0, 'ENDSEC');

    const writeEnt = (e, defLayer) => {
      const layer = e.layer || defLayer || '0';
      if (e.t === 'insert') {
        g(0, 'INSERT'); g(8, layer);
        g(2, e.block);
        g(10, n(e.p[0])); g(20, n(e.p[1])); g(30, 0);
      }
      else if (e.t === 'line') {
        g(0, 'LINE'); g(8, layer);
        g(10, n(e.a[0])); g(20, n(e.a[1])); g(30, 0);
        g(11, n(e.b[0])); g(21, n(e.b[1])); g(31, 0);
      }
      else if (e.t === 'poly') {
        if (e.stroke !== false && e.pts && e.pts.length > 1) {
          for (let i = 0; i < e.pts.length - 1; i++) {
            g(0, 'LINE'); g(8, layer);
            g(10, n(e.pts[i][0])); g(20, n(e.pts[i][1])); g(30, 0);
            g(11, n(e.pts[i + 1][0])); g(21, n(e.pts[i + 1][1])); g(31, 0);
          }
          if (e.close && e.pts.length > 2) {
            g(0, 'LINE'); g(8, layer);
            g(10, n(e.pts[e.pts.length - 1][0])); g(20, n(e.pts[e.pts.length - 1][1])); g(30, 0);
            g(11, n(e.pts[0][0])); g(21, n(e.pts[0][1])); g(31, 0);
          }
        }
      }
      else if (e.t === 'arc') {
        const nn = a => ((a % 360) + 360) % 360;
        g(0, 'ARC'); g(8, layer);
        g(10, n(e.c[0])); g(20, n(e.c[1])); g(30, 0);
        g(40, n(e.r));
        g(50, n(nn(e.a0))); g(51, n(nn(e.a1)));
      }
      else if (e.t === 'circle') {
        g(0, 'CIRCLE'); g(8, layer);
        g(10, n(e.c[0])); g(20, n(e.c[1])); g(30, 0);
        g(40, n(e.r));
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

    const allBlocks = blocks || (ents && ents.blocks) || {};
    if (Object.keys(allBlocks).length > 0) {
      g(0, 'SECTION'); g(2, 'BLOCKS');
      Object.entries(allBlocks).forEach(([bName, bEnts]) => {
        g(0, 'BLOCK'); g(8, '0'); g(2, bName); g(70, 0);
        g(10, 0); g(20, 0); g(30, 0);
        g(3, bName); g(1, '');
        bEnts.forEach(e => writeEnt(e, 'PANEL'));
        g(0, 'ENDBLK'); g(8, '0');
      });
      g(0, 'ENDSEC');
    }

    g(0, 'SECTION'); g(2, 'ENTITIES');
    const entList = Array.isArray(ents) ? ents : ((ents && ents.ents) || []);
    entList.forEach(e => writeEnt(e, '0'));
    g(0, 'ENDSEC'); g(0, 'EOF');
    return o.join('\r\n') + '\r\n';
  }

  const api = { NOZZLE_SPECS, getNozzleSpec, getNozzleList, buildIsometric, buildSkid, buildStay, buildSkidCross, exposedSides, ladderShapes, markShapes, panelShapes, concStrips, buildConcrete, buildFoundationSection, heightSegs, buildElevation, splitHalf, frontSplit, sideSplit, checkSegment, createMap, buildPlan, buildSheet, toDxf, FRAME, buildDefaultBOM, drawBalloonCallout, DEFAULT_HEIGHT_TABLE, setCustomHeightTable, getCustomHeightTable, getDefaultHeightTable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TankCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
