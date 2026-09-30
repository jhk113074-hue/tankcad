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

  /* ---------- 입력 검증 (원본은 검증 없음 → 웹에서 추가) ---------- */
  function checkSegment(n) {
    if (!n) return null;
    if (!Number.isInteger(n) || n < 500) return '500mm 이상 정수여야 합니다';
    const r = n % 500;
    if (r !== 0 && r !== 300) return '패널 모듈(1300/1000/500)로 만들 수 없는 치수입니다 (500의 배수, 또는 500의 배수+300)';
    if (r === 300 && n < 1300) return '1300 패널이 필요하므로 1300 이상이어야 합니다';
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

  /* ---------- 패널 내부 도형 (CeilLT) ---------- */
  function panelShapes(templates, mat, x, y, w, h) {
    const key = w + 'x' + h;
    const t = (templates[mat] || templates.SMC)[key] || [];
    const out = [];
    t.forEach(s => {
      if (s.k === 'line') out.push({ t: 'line', a: [x + s.p[0][0], y + s.p[0][1]], b: [x + s.p[1][0], y + s.p[1][1]], layer: 'PANEL_DETAIL' });
      else if (s.k === 'poly') {
        const p = s.p.map(q => [x + q[0], y + q[1]]);
        const isClosed = s.c !== false;
        const cnt = isClosed ? p.length : p.length - 1;
        for (let i = 0; i < cnt; i++) out.push({ t: 'line', a: p[i], b: p[(i + 1) % p.length], layer: 'PANEL_DETAIL' });
      } else if (s.k === 'circle') out.push({ t: 'circle', c: [x + s.c[0], y + s.c[1]], r: s.r, layer: 'PANEL_DETAIL' });
      else if (s.k === 'arc') {
        const d = (p) => Math.atan2(p[1] - s.c[1], p[0] - s.c[0]) * 180 / Math.PI;
        out.push({ t: 'arc', c: [x + s.c[0], y + s.c[1]], r: s.r, a0: d(s.s), a1: d(s.e), layer: 'PANEL_DETAIL' });
      }
    });
    return out;
  }

  /* ---------- 평면도 맨홀 손잡이 / 환기구 (CCeilLT::_1000BY1000 의 CLT_HANDLE=1, CLT_AIRVENT=2) : 1000x1000 패널만 ---------- */
  function markShapes(x, y, mark) {
    const out = [], P = (a, b) => [x + a, y + b];
    const poly = (pts, layer) => pts.forEach((p, k) => out.push({ t: 'line', a: P(...p), b: P(...pts[(k + 1) % pts.length]), layer }));
    if (mark & 1) { // 맨홀 (손잡이)
      poly([[260, 105], [735, 105], [888, 260], [888, 735], [735, 888], [262, 888], [105, 735], [105, 260]], 'FRAME');
      poly([[150, 280], [290, 150], [710, 150], [850, 280], [850, 720], [710, 850], [290, 850], [150, 720]], 'FRAME');
      poly([[310, 110], [390, 110], [390, 67], [310, 67]], 'FRAME'); poly([[610, 110], [690, 110], [690, 67], [610, 67]], 'FRAME');
      poly([[462, 945], [538, 945], [538, 898], [462, 898]], 'FRAME');
      out.push({ t: 'circle', c: P(500, 500), r: 300, layer: 'FRAME' });
      out.push({ t: 'text', p: P(500, (mark & 2) ? 610 : 500), s: 'MANHOLE 600', h: 60, rot: 0, align: 'center', layer: 'DIM' });
    }
    if (mark & 2) { // 에어벤트
      out.push({ t: 'circle', c: P(500, 500), r: 50, layer: 'REINF' });
      out.push({ t: 'circle', c: P(500, 500), r: 100, layer: 'REINF' });
      out.push({ t: 'line', a: P(380, 500), b: P(620, 500), layer: 'REINF' });
      out.push({ t: 'line', a: P(500, 380), b: P(500, 620), layer: 'REINF' });
      out.push({ t: 'text', p: P(500, (mark & 1) ? 380 : 500), s: 'AIR VENT 100A', h: 50, rot: 0, align: 'center', layer: 'DIM' });
    }
    return out;
  }

  /* ---------- 사다리 (CLadderLT) : 1 위, 2 아래, 3 오른쪽, 4 왼쪽 (평면) / 5 정면, 6 뒤(상부만), 7 우측면, 8 좌측면 ---------- */
  function ladderShapes(idx, px, py, H) {
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
      [1, -1].forEach(k => {
        pl([[k * mx, BO], [k * mx, H + MH], [k * (mx + T), H + MH], [k * (mx + T), BO]], true);
        pl([[k * mx, H + MH], [k * mx, H + TOP], [k * (mx + T), H + TOP], [k * (mx + T), H + MH]], true);
      });
      for (let y = BO + FO; y < H; y += FT + SI) { ln([-mx, y], [mx, y]); ln([-mx, y + FT], [mx, y + FT]); }
    } else if (idx === 6) {
      [1, -1].forEach(k => pl([[k * mx, H + MH], [k * mx, H + TOP], [k * (mx + T), H + TOP], [k * (mx + T), H + MH]], true));
    } else if (idx === 7 || idx === 8) {
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
          if (sd === 'bottom') outT(ents, [x1, y0 - F], 1); else if (sd === 'top') outT(ents, [x1, y1 + F], 3);
          else if (sd === 'left') outT(ents, [x0 - F, y1], 4); else outT(ents, [x1 + F, y1], 2);
        }
      });
      // 볼록 모서리: GRP=삼각형, STS=직각 꺾임 + 대각선
      const corner = c => { if (!sts) chain(c, 'FRAME', true); else { chain([c[0], [c[0][0], c[2][1]], c[2]], 'FRAME'); ln([c[0][0], c[2][1]], c[1]); } };
      if (exposed(i, j, 'bottom') && exposed(i, j, 'left')) corner([[x0 - F, y0], [x0, y0], [x0, y0 - F]]);
      if (exposed(i, j, 'bottom') && exposed(i, j, 'right')) corner([[x1, y0 - F], [x1, y0], [x1 + F, y0]]);
      if (exposed(i, j, 'top') && exposed(i, j, 'right')) corner([[x1 + F, y1], [x1, y1], [x1, y1 + F]]);
      if (exposed(i, j, 'top') && exposed(i, j, 'left')) corner([[x0, y1 + F], [x0, y1], [x0 - F, y1]]);
    }
    ladderList(opt, map).forEach(l => ents.push(...ladderShapes(l.idx, l.x, l.y, 0)));
    Object.entries(opt.marks || {}).forEach(([k, m]) => {
      const [i, j] = k.split(',').map(Number);
      if (map.has(i, j) && map.cols[j] === 1000 && map.rows[i] === 1000) ents.push(...markShapes(map.xs[j], map.ys[i], m));
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

    // 배관 노즐 (INLET, OUTLET, OVERFLOW, DRAIN, FIRE 등) 평면도 배치
    const nozList = getNozzleList(opt);
    const nozTextH = Math.round(2.6 * N);
    nozList.forEach((n, idx) => {
      const spec = getNozzleSpec(n.size);
      const isFlg = n.type === 'FLANGE';
      const descStr = n.desc ? ` (${n.desc})` : '';
      const label1 = `[${n.mark}] ${n.name} ${n.size}${descStr}`;
      const label2 = `(${n.type})` + (n.face === 'top' ? ' [TOP]' : '');
      const offVal = n.offset || 0;
      
      if (n.face === 'top') {
        const i = Math.max(0, Math.min(n.topCell[0], map.rows.length - 1));
        const j = Math.max(0, Math.min(n.topCell[1], map.cols.length - 1));
        const cx = (map.xs[j] + map.xs[j + 1]) / 2 + offVal;
        const cy = (map.ys[i] + map.ys[i + 1]) / 2;
        
        if (isFlg) {
          ents.push({ t: 'circle', c: [cx, cy], r: spec.rf, layer: 'FRAME' });
          ents.push({ t: 'circle', c: [cx, cy], r: spec.pcd, layer: 'PANEL_DETAIL' });
          ents.push({ t: 'circle', c: [cx, cy], r: spec.r, layer: 'FRAME' });
          const numHoles = Math.min(8, spec.holes);
          for (let k = 0; k < numHoles; k++) {
            const ang = (k * 360 / numHoles + 45) * Math.PI / 180;
            ents.push({ t: 'circle', c: [cx + spec.pcd * Math.cos(ang), cy + spec.pcd * Math.sin(ang)], r: spec.hr, layer: 'FRAME' });
          }
        } else {
          ents.push({ t: 'circle', c: [cx, cy], r: spec.sockR, layer: 'FRAME' });
          ents.push({ t: 'circle', c: [cx, cy], r: spec.r, layer: 'FRAME' });
        }
        const cr = (isFlg ? spec.rf : spec.sockR) * 1.25;
        ents.push({ t: 'line', a: [cx - cr, cy], b: [cx + cr, cy], layer: 'PANEL_DETAIL' });
        ents.push({ t: 'line', a: [cx, cy - cr], b: [cx, cy + cr], layer: 'PANEL_DETAIL' });
        
        const leadLen = Math.max(120, 3.5 * N);
        const stagger = (idx % 3) * Math.round(1.5 * N);
        drawLeader(ents, [cx + spec.r * 0.7, cy + spec.r * 0.7], [cx + spec.r * 0.7 + leadLen * 0.6, cy + spec.r * 0.7 + leadLen * 0.6 + stagger], [cx + spec.r * 0.7 + leadLen * 1.4, cy + spec.r * 0.7 + leadLen * 0.6 + stagger], [label1, label2], nozTextH, 'left', 'DIM');
      } else if (n.face === 'front') {
        const colIdx = Math.max(0, Math.min(n.seg - 1, map.cols.length - 1));
        const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + offVal;
        const yBase = -F;
        const stagger = (idx % 3) * Math.round(1.5 * N);
        if (isFlg) {
          const yPlate1 = yBase - spec.neckLen;
          const yPlate0 = yPlate1 + spec.flgThick;
          ln([cx - spec.r, yBase], [cx - spec.r, yPlate0], 'FRAME');
          ln([cx + spec.r, yBase], [cx + spec.r, yPlate0], 'FRAME');
          chain([[cx - spec.rf, yPlate1], [cx + spec.rf, yPlate1], [cx + spec.rf, yPlate0], [cx - spec.rf, yPlate0]], 'FRAME', true);
          const ey = yPlate1 - Math.round(2.5 * N) - stagger;
          drawLeader(ents, [cx, yPlate1], [cx + Math.round(2.5 * N), ey], [cx + Math.round(5.5 * N), ey], [label1, label2], nozTextH, 'left', 'DIM');
        } else {
          const yEnd = yBase - spec.sockLen;
          chain([[cx - spec.sockR, yEnd], [cx + spec.sockR, yEnd], [cx + spec.sockR, yBase], [cx - spec.sockR, yBase]], 'FRAME', true);
          ln([cx - spec.r, yEnd], [cx + spec.r, yEnd], 'FRAME');
          const ey = yEnd - Math.round(2.5 * N) - stagger;
          drawLeader(ents, [cx, yEnd], [cx + Math.round(2.5 * N), ey], [cx + Math.round(5.5 * N), ey], [label1, label2], nozTextH, 'left', 'DIM');
        }
      } else if (n.face === 'rear') {
        const colIdx = Math.max(0, Math.min(n.seg - 1, map.cols.length - 1));
        const cx = (map.xs[colIdx] + map.xs[colIdx + 1]) / 2 + offVal;
        const yBase = W + F;
        const stagger = (idx % 3) * Math.round(1.5 * N);
        if (isFlg) {
          const yPlate1 = yBase + spec.neckLen;
          const yPlate0 = yPlate1 - spec.flgThick;
          ln([cx - spec.r, yBase], [cx - spec.r, yPlate0], 'FRAME');
          ln([cx + spec.r, yBase], [cx + spec.r, yPlate0], 'FRAME');
          chain([[cx - spec.rf, yPlate0], [cx + spec.rf, yPlate0], [cx + spec.rf, yPlate1], [cx - spec.rf, yPlate1]], 'FRAME', true);
          const ey = yPlate1 + Math.round(2.5 * N) + stagger;
          drawLeader(ents, [cx, yPlate1], [cx + Math.round(2.5 * N), ey], [cx + Math.round(5.5 * N), ey], [label1, label2], nozTextH, 'left', 'DIM');
        } else {
          const yEnd = yBase + spec.sockLen;
          chain([[cx - spec.sockR, yBase], [cx + spec.sockR, yBase], [cx + spec.sockR, yEnd], [cx - spec.sockR, yEnd]], 'FRAME', true);
          ln([cx - spec.r, yEnd], [cx + spec.r, yEnd], 'FRAME');
          const ey = yEnd + Math.round(2.5 * N) + stagger;
          drawLeader(ents, [cx, yEnd], [cx + Math.round(2.5 * N), ey], [cx + Math.round(5.5 * N), ey], [label1, label2], nozTextH, 'left', 'DIM');
        }
      } else if (n.face === 'left') {
        const rowIdx = Math.max(0, Math.min(n.seg - 1, map.rows.length - 1));
        const cy = (map.ys[rowIdx] + map.ys[rowIdx + 1]) / 2 + offVal;
        const xBase = -F;
        const stagger = (idx % 3) * Math.round(1.5 * N);
        if (isFlg) {
          const xPlate1 = xBase - spec.neckLen;
          const xPlate0 = xPlate1 + spec.flgThick;
          ln([xBase, cy - spec.r], [xPlate0, cy - spec.r], 'FRAME');
          ln([xBase, cy + spec.r], [xPlate0, cy + spec.r], 'FRAME');
          chain([[xPlate1, cy - spec.rf], [xPlate0, cy - spec.rf], [xPlate0, cy + spec.rf], [xPlate1, cy + spec.rf]], 'FRAME', true);
          const ey = cy + Math.round(2.5 * N) + stagger;
          drawLeader(ents, [xPlate1, cy], [xPlate1 - Math.round(2.5 * N), ey], [xPlate1 - Math.round(5.5 * N), ey], [label1, label2], nozTextH, 'right', 'DIM');
        } else {
          const xEnd = xBase - spec.sockLen;
          chain([[xEnd, cy - spec.sockR], [xBase, cy - spec.sockR], [xBase, cy + spec.sockR], [xEnd, cy + spec.sockR]], 'FRAME', true);
          ln([xEnd, cy - spec.r], [xEnd, cy + spec.r], 'FRAME');
          const ey = cy + Math.round(2.5 * N) + stagger;
          drawLeader(ents, [xEnd, cy], [xEnd - Math.round(2.5 * N), ey], [xEnd - Math.round(5.5 * N), ey], [label1, label2], nozTextH, 'right', 'DIM');
        }
      } else if (n.face === 'right') {
        const rowIdx = Math.max(0, Math.min(n.seg - 1, map.rows.length - 1));
        const cy = (map.ys[rowIdx] + map.ys[rowIdx + 1]) / 2 + offVal;
        const xBase = L + F;
        const stagger = (idx % 3) * Math.round(1.5 * N);
        if (isFlg) {
          const xPlate1 = xBase + spec.neckLen;
          const xPlate0 = xPlate1 - spec.flgThick;
          ln([xBase, cy - spec.r], [xPlate0, cy - spec.r], 'FRAME');
          ln([xBase, cy + spec.r], [xPlate0, cy + spec.r], 'FRAME');
          chain([[xPlate0, cy - spec.rf], [xPlate1, cy - spec.rf], [xPlate1, cy + spec.rf], [xPlate0, cy + spec.rf]], 'FRAME', true);
          const ey = cy + Math.round(2.5 * N) + stagger;
          drawLeader(ents, [xPlate1, cy], [xPlate1 + Math.round(2.5 * N), ey], [xPlate1 + Math.round(5.5 * N), ey], [label1, label2], nozTextH, 'left', 'DIM');
        } else {
          const xEnd = xBase + spec.sockLen;
          chain([[xBase, cy - spec.sockR], [xEnd, cy - spec.sockR], [xEnd, cy + spec.sockR], [xBase, cy + spec.sockR]], 'FRAME', true);
          ln([xEnd, cy - spec.r], [xEnd, cy + spec.r], 'FRAME');
          const ey = cy + Math.round(2.5 * N) + stagger;
          drawLeader(ents, [xEnd, cy], [xEnd + Math.round(2.5 * N), ey], [xEnd + Math.round(5.5 * N), ey], [label1, label2], nozTextH, 'left', 'DIM');
        }
      }
    });

    // 치수선 (축척 비례 계산)
    const textH = Math.round(3.0 * N);
    const dimGap1 = Math.round(10.0 * N);
    const dimGap2 = Math.round(18.0 * N);
    const baseY = -F - dimGap1, baseX = -F - dimGap1;
    dimLinear(ents, [-F, 0], [0, 0], baseY, false, String(F), textH, 'DIM');
    map.cols.forEach((c, j) => dimLinear(ents, [map.xs[j], 0], [map.xs[j + 1], 0], baseY, false, String(c), textH, 'DIM'));
    dimLinear(ents, [L, 0], [L + F, 0], baseY, false, String(F), textH, 'DIM');
    dimLinear(ents, [-F, 0], [L + F, 0], -F - dimGap2, false, String(L + 2 * F), textH, 'DIM');
    dimLinear(ents, [0, -F], [0, 0], baseX, true, String(F), textH, 'DIM');
    map.rows.forEach((r, i) => dimLinear(ents, [0, map.ys[i]], [0, map.ys[i + 1]], baseX, true, String(r), textH, 'DIM'));
    dimLinear(ents, [0, W], [0, W + F], baseX, true, String(F), textH, 'DIM');
    dimLinear(ents, [0, -F], [0, W + F], -F - dimGap2, true, String(W + 2 * F), textH, 'DIM');
    ents.blocks = blocks;
    const fd = a => { const v = a.filter(Boolean).map(x => x / 1000); return v.length > 1 ? '(' + v.join('+') + ')' : String(v[0] || 0); };
    const anyRemoved = map.removed && map.removed.size > 0;
    const H = (opt.height || []).reduce((a, b) => a + (b || 0), 0);
    const baseDimStr = fd(opt.width || []) + 'W X ' + fd(opt.length || []) + 'L X ' + fd(opt.height || [H]) + 'H';
    const autoDimStr = baseDimStr + (anyRemoved ? ' (이형)' : '');
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
  const H_LIST = [1000, 1300, 1500, 1800, 2000, 2300, 2500, 2800, 3000, 3300, 3500, 3800, 4000, 4300, 4500, 4800, 5000];
  const H_MAP = [[1000], [1300], [1500], [1300, 500], [2000], [1000, 1300], [1000, 1500], [1300, 1500], [1000, 2000],
    [1000, 1000, 1300], [1000, 1000, 1500], [1000, 1300, 1500], [1000, 1000, 2000], [1000, 1300, 2000],
    [1000, 1000, 1000, 1500], [1000, 1000, 1300, 1500], [1000, 1000, 1000, 2000]];
  const H1_LIST = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
  const H1_MAP = [[1000], [1000, 500], [1000, 1000], [1000, 500, 1000], [1000, 1000, 1000], [1000, 1000, 500, 1000],
    [1000, 1000, 1000, 1000], [1000, 500, 1000, 1000, 1000], [1000, 1000, 1000, 1000, 1000]];
  function heightSegs(total, one) {
    const i = (one ? H1_LIST : H_LIST).indexOf(total);
    return i < 0 ? null : (one ? H1_MAP : H_MAP)[i].slice();
  }

  /* ---------- gRound / gSolX (glFunc.cpp) ---------- */
  const gRound = v => (v - Math.trunc(v) >= 0.5 ? Math.trunc(v) + 1 : Math.trunc(v));
  const solX = (s, e, y) => gRound((e[0] - s[0]) * (y - s[1]) / (e[1] - s[1]) + s[0]);

  /* ---------- 기초 콘크리트 (TankConcrete / CConcLT / ConcreteDim) : 직사각형 탱크 규칙 ---------- */
  // 열 배열(패널 길이 목록) → 각 이음선의 콘크리트 띠 [x, 폭]
  function concStrips(c) {
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
    const map = createMap(opt), W = map.width, L = map.length, ents = [], strips = concStrips(map.cols);
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
      runsForStrip(idx).forEach(([y0, y1]) => pieces.push({ x, w, y0: y0 - PAD_OVERHANG, y1: y1 + PAD_OVERHANG }));
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

    const seen = {};
    const topY = Math.max(...pieces.map(p => p.y1));
    strips.forEach(([x, w], i) => {
      if (!seen[w]) { seen[w] = 1; dimLinear(ents, [x, topY], [x + w, topY], topY + dimGap1, false, String(w), textH, 'DIM'); }
      if (i) { const pa = strips[i - 1]; dimLinear(ents, [pa[0] + pa[1] / 2, -PAD_OVERHANG], [x + w / 2, -PAD_OVERHANG], -PAD_OVERHANG - dimGap1, false, String(Math.round((x + w / 2) - (pa[0] + pa[1] / 2))), textH, 'DIM'); }
    });
    const lf = strips[0][0], rt = strips[strips.length - 1][0] + strips[strips.length - 1][1];
    dimLinear(ents, [lf, -PAD_OVERHANG], [rt, -PAD_OVERHANG], -PAD_OVERHANG - dimGap2, false, String(rt - lf), textH, 'DIM');
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
  function buildElevation(opt, sideT, view) {
    const secs = ((view === 'front' ? opt.length : opt.width) || []).filter(Boolean).slice(0, 5);
    const hs = (opt.hseg || []).filter(Boolean), n = hs.length, nH = hs.reduce((a, b) => a + b, 0);
    const split = view === 'front' ? frontSplit : sideSplit;
    const total = secs.reduce((a, b) => a + b, 0), th = opt.frame || 75;
    const ents = [], blocks = {};
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
        if (type === 'flat') {
          // Flat panel (평판 판넬): smooth plate, offset margin line
          const m = 25;
          bEnts.push({ t: 'line', a: [m, m], b: [w - m, m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [w - m, m], b: [w - m, h - m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [w - m, h - m], b: [m, h - m], layer: 'PANEL_DETAIL' });
          bEnts.push({ t: 'line', a: [m, h - m], b: [m, m], layer: 'PANEL_DETAIL' });
        } else if (type === 'large') {
          // Large bore panel (대구경 판넬): concentric reinforced circular boss for large piping/flange
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
          const mTemplates = sideT[mat] || {};
          const t = mTemplates[w + 'x' + h] || [];
          t.forEach(s => {
            if (s.k === 'line') bEnts.push({ t: 'line', a: s.p[0], b: s.p[1], layer: 'PANEL_DETAIL' });
            else if (s.k === 'poly') {
              for (let k = 0; k + 1 < s.p.length; k++) bEnts.push({ t: 'line', a: s.p[k], b: s.p[k + 1], layer: 'PANEL_DETAIL' });
              if (s.c !== false) bEnts.push({ t: 'line', a: s.p[s.p.length - 1], b: s.p[0], layer: 'PANEL_DETAIL' });
            }
            else if (s.k === 'circle') bEnts.push({ t: 'circle', c: s.c, r: s.r, layer: 'PANEL_DETAIL' });
            else if (s.k === 'arc') {
              const d = (p) => Math.atan2(p[1] - s.c[1], p[0] - s.c[0]) * 180 / Math.PI;
              bEnts.push({ t: 'arc', c: s.c, r: s.r, a0: d(s.s), a1: d(s.e), layer: 'PANEL_DETAIL' });
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
      hs.forEach((hh, i) => {
        const tall = !(hh === 500 || hh === 1000 || hh === 1300);
        if (i > 0) ln([baseX, y], [baseX + (cnt > 1 ? pLen[0] - MX : pLen[0]), y]);
        for (let j = 0; j < cnt; j++) {
          if (tall && j === sp && pLen[j] === 1300) {     // 높이 1500/2000 의 1300 패널: (h-1000) + 1000 로 분할
            panel(xj[j], y, 1300, hh - 1000, gIdx + j, i); ln([xj[j], y + hh - 1000], [xj[j] + 1300, y + hh - 1000]); panel(xj[j], y + hh - 1000, 1300, 1000, gIdx + j, i);
          } else panel(xj[j], y, pLen[j], hh, gIdx + j, i);
          if (j < cnt - 1) {
            const x = xj[j + 1];
            plate(x, y, i === 0 ? 'bot' : 'mid');
            if (i > 0) {
              ln([x + MX, y], [x + (j === cnt - 2 ? pLen[j + 1] : pLen[j + 1] - MX), y]);
              const h = i === 1 ? OB.STAY + OB.CY : MY;
              [-OFF, 0, OFF].forEach(o => ln([x + o, y - MY], [x + o, y - hs[i - 1] + h]));
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
        plate(x, nH, 'top');
        ln([x + OFF, nH], [x + (j === cnt - 2 ? pLen[j + 1] : pLen[j + 1] - OFF), nH]);
        [-OFF, 0, OFF].forEach(o => ln([x + o, nH - OB.MOVE], [x + o, nH - hs[n - 1] + hT]));
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

    // 기초 콘크리트 (프레임 아래 ~ 지면 -600)
    const list = []; { let cx0 = 0; secs.forEach(sn => { split(sn, cx0).forEach(w => list.push(w)); cx0 += sn; }); }
    const GRD = -600;
    concStrips(list).forEach(([x, w]) => {
      poly([[x, -th], [x, GRD], [x + w, GRD], [x + w, -th]], 'PANEL', true);
      hatchRect(ents, x, GRD, x + w, -th, 100, 'PANEL_DETAIL');   // 콘크리트 패드 빗금
      concDesign(ents, x, GRD);
    });
    ln([0, GRD], [total, GRD], 'PANEL');

    // 치수 (FrontDim / SideDim: 축척 비례 계산)
    const N = opt._N || 25;
    const textH = Math.round(3.0 * N);
    const dimGap1 = Math.round(10.0 * N);
    const dimGap2 = Math.round(18.0 * N);
    const X0 = -75 - dimGap1;
    let yy = 0;
    hs.forEach(hh => { dimLinear(ents, [X0, yy], [X0, yy + hh], X0 - dimGap1, true, String(hh), textH, 'DIM'); yy += hh; });
    dimLinear(ents, [X0, nH], [X0, nH + 100], X0 - dimGap1, true, '100', textH, 'DIM');
    dimLinear(ents, [X0, 0], [X0, -th], X0 - dimGap1, true, String(th), textH, 'DIM');
    dimLinear(ents, [X0, -th], [X0, GRD], X0 - dimGap1, true, String(-GRD - th), textH, 'DIM');
    dimLinear(ents, [X0, GRD], [X0, nH + 100], X0 - dimGap2, true, String(nH + 100 - GRD), textH, 'DIM');
    const yb = GRD - dimGap1;
    let cx = 0;
    secs.forEach(sn => { split(sn, cx).forEach(w => { dimLinear(ents, [cx, GRD], [cx + w, GRD], yb, false, String(w), textH, 'DIM'); cx += w; }); });
    dimLinear(ents, [-75, GRD], [total + 75, GRD], GRD - dimGap2, false, String(total + 150), textH, 'DIM');
    const lads = ladderList(opt, mmap), done = new Set();
    lads.forEach(l => {
      let idx, px;
      if (view === 'front') {
        if (l.sd === 'D') { idx = 5; px = l.x; } else if (l.sd === 'U') { idx = 6; px = l.x; } else if (l.sd === 'R') { idx = 7; px = total; } else { idx = 8; px = 0; }
      } else {
        if (l.sd === 'U') { idx = 7; px = total; } else if (l.sd === 'D') { idx = 8; px = 0; } else if (l.sd === 'R') { idx = 5; px = l.y; } else { idx = 6; px = l.y; }
      }
      if (done.has(idx + ':' + px)) return; done.add(idx + ':' + px);
      ents.push(...ladderShapes(idx, px, 0, nH));
    });

    // 배관 노즐 (INLET, OUTLET, OVERFLOW, DRAIN, FIRE 등) 입면도 배치
    const nozList = getNozzleList(opt);
    const nozTextH = Math.round(2.6 * N);
    nozList.forEach((n, nIdx) => {
      const spec = getNozzleSpec(n.size);
      const isFlg = n.type === 'FLANGE';
      const elev = typeof n.elev === 'number' ? n.elev : (nH - 300);
      const elevStr = n.face === 'top' ? '[TOP]' : `EL.+${elev.toLocaleString()}`;
      const descTag = n.desc ? ` (${n.desc})` : '';
      const label1 = `[${n.mark}] ${n.name} ${n.size}${descTag}`;
      const label2 = `(${n.type}) ${elevStr}`;
      const stagger = (nIdx % 3) * Math.round(1.5 * N);

      const drawFaceNozzle = (cx, cy) => {
        if (isFlg) {
          circ(cx, cy, spec.rf, 'FRAME');
          circ(cx, cy, spec.pcd, 'PANEL_DETAIL');
          circ(cx, cy, spec.r, 'FRAME');
          const numHoles = Math.min(8, spec.holes);
          for (let k = 0; k < numHoles; k++) {
            const ang = (k * 360 / numHoles + 45) * Math.PI / 180;
            circ(cx + spec.pcd * Math.cos(ang), cy + spec.pcd * Math.sin(ang), spec.hr, 'FRAME');
          }
        } else {
          circ(cx, cy, spec.sockR, 'FRAME');
          circ(cx, cy, spec.r, 'FRAME');
        }
        const cr = (isFlg ? spec.rf : spec.sockR) * 1.25;
        ln([cx - cr, cy], [cx + cr, cy], 'PANEL_DETAIL');
        ln([cx, cy - cr], [cx, cy + cr], 'PANEL_DETAIL');
        const toRight = cx < total / 2;
        const dx = toRight ? Math.round(3.5 * N) : -Math.round(3.5 * N);
        const ex = toRight ? cx + dx + Math.round(3.0 * N) : cx + dx - Math.round(3.0 * N);
        const ey = cy + Math.round(3.0 * N) + stagger;
        drawLeader(ents, [cx + (toRight ? spec.r * 0.7 : -spec.r * 0.7), cy + spec.r * 0.7], [cx + dx, ey], [ex, ey], [label1, label2], nozTextH, toRight ? 'left' : 'right', 'DIM');
      };

      const drawLeftStub = (ey) => {
        const xBase = -75;
        const eyStag = ey + Math.round(2.5 * N) + stagger;
        if (isFlg) {
          const xPlate1 = xBase - spec.neckLen;
          const xPlate0 = xPlate1 + spec.flgThick;
          ln([xBase, ey - spec.r], [xPlate0, ey - spec.r], 'FRAME');
          ln([xBase, ey + spec.r], [xPlate0, ey + spec.r], 'FRAME');
          rect(xPlate1, ey - spec.rf, xPlate0, ey + spec.rf, 'FRAME');
          drawLeader(ents, [xPlate1, ey], [xPlate1 - Math.round(2.5 * N), eyStag], [xPlate1 - Math.round(5.5 * N), eyStag], [label1, label2], nozTextH, 'right', 'DIM');
        } else {
          const xEnd = xBase - spec.sockLen;
          rect(xEnd, ey - spec.sockR, xBase, ey + spec.sockR, 'FRAME');
          ln([xEnd, ey - spec.r], [xEnd, ey + spec.r], 'FRAME');
          drawLeader(ents, [xEnd, ey], [xEnd - Math.round(2.5 * N), eyStag], [xEnd - Math.round(5.5 * N), eyStag], [label1, label2], nozTextH, 'right', 'DIM');
        }
      };

      const drawRightStub = (ey) => {
        const xBase = total + 75;
        const eyStag = ey + Math.round(2.5 * N) + stagger;
        if (isFlg) {
          const xPlate1 = xBase + spec.neckLen;
          const xPlate0 = xPlate1 - spec.flgThick;
          ln([xBase, ey - spec.r], [xPlate0, ey - spec.r], 'FRAME');
          ln([xBase, ey + spec.r], [xPlate0, ey + spec.r], 'FRAME');
          rect(xPlate0, ey - spec.rf, xPlate1, ey + spec.rf, 'FRAME');
          drawLeader(ents, [xPlate1, ey], [xPlate1 + Math.round(2.5 * N), eyStag], [xPlate1 + Math.round(5.5 * N), eyStag], [label1, label2], nozTextH, 'left', 'DIM');
        } else {
          const xEnd = xBase + spec.sockLen;
          rect(xBase, ey - spec.sockR, xEnd, ey + spec.sockR, 'FRAME');
          ln([xEnd, ey - spec.r], [xEnd, ey + spec.r], 'FRAME');
          drawLeader(ents, [xEnd, ey], [xEnd + Math.round(2.5 * N), eyStag], [xEnd + Math.round(5.5 * N), eyStag], [label1, label2], nozTextH, 'left', 'DIM');
        }
      };

      const drawTopStub = (cx) => {
        const yBase = nH;
        const eyStag = yBase + Math.round(2.5 * N) + stagger;
        if (isFlg) {
          const yPlate1 = yBase + spec.neckLen;
          const yPlate0 = yPlate1 - spec.flgThick;
          ln([cx - spec.r, yBase], [cx - spec.r, yPlate0], 'FRAME');
          ln([cx + spec.r, yBase], [cx + spec.r, yPlate0], 'FRAME');
          rect(cx - spec.rf, yPlate0, cx + spec.rf, yPlate1, 'FRAME');
          drawLeader(ents, [cx, yPlate1], [cx + Math.round(2.5 * N), eyStag], [cx + Math.round(5.5 * N), eyStag], [label1, label2], nozTextH, 'left', 'DIM');
        } else {
          const yEnd = yBase + spec.sockLen;
          rect(cx - spec.sockR, yBase, cx + spec.sockR, yEnd, 'FRAME');
          ln([cx - spec.r, yEnd], [cx + spec.r, yEnd], 'FRAME');
          drawLeader(ents, [cx, yEnd], [cx + Math.round(2.5 * N), eyStag], [cx + Math.round(5.5 * N), eyStag], [label1, label2], nozTextH, 'left', 'DIM');
        }
      };

      if (view === 'front') {
        if (n.face === 'front') {
          const colIdx = Math.max(0, Math.min(n.seg - 1, mmap.cols.length - 1));
          const cx = (mmap.xs[colIdx] + mmap.xs[colIdx + 1]) / 2 + (n.offset || 0);
          drawFaceNozzle(cx, elev);
        } else if (n.face === 'left') {
          drawLeftStub(elev);
        } else if (n.face === 'right') {
          drawRightStub(elev);
        } else if (n.face === 'top') {
          const colIdx = Math.max(0, Math.min(n.topCell[1], mmap.cols.length - 1));
          const cx = (mmap.xs[colIdx] + mmap.xs[colIdx + 1]) / 2 + (n.offset || 0);
          drawTopStub(cx);
        }
      } else { // side view
        if (n.face === 'right') {
          const rowIdx = Math.max(0, Math.min(n.seg - 1, mmap.rows.length - 1));
          const cy = (mmap.ys[rowIdx] + mmap.ys[rowIdx + 1]) / 2 + (n.offset || 0);
          drawFaceNozzle(cy, elev);
        } else if (n.face === 'front') {
          drawLeftStub(elev);
        } else if (n.face === 'rear') {
          drawRightStub(elev);
        } else if (n.face === 'top') {
          const rowIdx = Math.max(0, Math.min(n.topCell[0], mmap.rows.length - 1));
          const cy = (mmap.ys[rowIdx] + mmap.ys[rowIdx + 1]) / 2 + (n.offset || 0);
          drawTopStub(cy);
        }
      }
    });
    ents.blocks = blocks;
    return { ents, textH, blocks };
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
  function pickScale(L, W, H) {
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
      if (e.a && e.b) {
        minX = Math.min(minX, e.a[0], e.b[0]); maxX = Math.max(maxX, e.a[0], e.b[0]);
        minY = Math.min(minY, e.a[1], e.b[1]); maxY = Math.max(maxY, e.a[1], e.b[1]);
      } else if (e.c && e.r) {
        minX = Math.min(minX, e.c[0] - e.r); maxX = Math.max(maxX, e.c[0] + e.r);
        minY = Math.min(minY, e.c[1] - e.r); maxY = Math.max(maxY, e.c[1] + e.r);
      } else if (e.p) {
        if (Array.isArray(e.p[0])) e.p.forEach(pt => { minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]); minY = Math.min(minY, pt[1]); maxY = Math.max(maxY, pt[1]); });
        else { minX = Math.min(minX, e.p[0]); maxX = Math.max(maxX, e.p[0]); minY = Math.min(minY, e.p[1]); maxY = Math.max(maxY, e.p[1]); }
      }
    });
    return [isFinite(minX) ? minX : 0, isFinite(minY) ? minY : 0, isFinite(maxX) ? maxX : 1000, isFinite(maxY) ? maxY : 1000];
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
    const H = (opt.height || []).reduce((a, b) => a + (b || 0), 0);
    const mmap = createMap(opt);
    const totalL = mmap.length, totalW = mmap.width;

    // 1. 축척(Scale) 결정 (수동 선택값 우선, 없으면 자동 계산)
    const N = Number(opt.userScale) || pickScale(totalL, totalW, H);
    opt._N = N;
    const P = v => v * N;   // 종이 mm → 모델 mm

    // 2. 축척 비례 하위 뷰 생성
    const plan = buildPlan(opt, templates);
    const conc = buildConcrete(opt);
    const front = (sideT && opt.hseg && opt.hseg.length) ? buildElevation(opt, sideT, 'front') : null;
    const side = (sideT && opt.hseg && opt.hseg.length) ? buildElevation(opt, sideT, 'side') : null;

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
    // 회사 로고 마크 (원형 Y 이니셜 엠블럼)
    const logoX = tx0 + 15, logoY = y + 8;
    circle([logoX, logoY], 5.8);
    circle([logoX, logoY], 5.0);
    text(logoX, logoY, 5.5, 'Y', 'center', 0, 'middle');
    const compName = t.customer || 'YSACC CO.,LTD';
    text(tx0 + 28 + (tw - 28) / 2, y + 8, 6.2, compName, 'center', 0, 'middle');

    // 2. 제품명 (높이 12mm)
    y -= 12;
    line([tx0, y], [x1, y]);
    const prodName = (opt.material === 'STS' ? 'STS' : 'GRP') + ' PANEL WATER TANK';
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
    const baseDimStr = fd(opt.width || []) + 'W X ' + fd(opt.length || []) + 'L X ' + fd(opt.height || [H]) + 'H';
    const autoDimStr = baseDimStr + (anyRemoved ? ' (이형)' : '');
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

    // 1. TITLE (높이 32mm, 폰트 5.5 / 6.5mm)
    const titleH = 32;
    line([tx0, ty + titleH], [x1, ty + titleH]);
    text(tx0 + colLabelW / 2, ty + titleH / 2, 5.5, 'TITLE', 'center', 0, 'middle');
    line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + titleH]);
    const titleVal = opt.sheetKind === 'frame' ? 'STEEL SKID DRAWING' : opt.sheetKind === 'detail' ? 'DETAILS DWG' : dimStr + '\n= ' + ton + ' Ton';
    const tparts = titleVal.split('\n');
    if (tparts.length > 1) {
      text(tx0 + colLabelW + colValW / 2, ty + titleH / 2 + 5.5, 6.2, tparts[0], 'center', 0, 'middle');
      text(tx0 + colLabelW + colValW / 2, ty + titleH / 2 - 5.5, 6.2, tparts[1], 'center', 0, 'middle');
    } else {
      text(tx0 + colLabelW + colValW / 2, ty + titleH / 2, 6.5, titleVal, 'center', 0, 'middle');
    }
    ty += titleH;

    // 2. PROJECT (높이 22mm, 폰트 5.0 / 5.2mm)
    const projH = 22;
    line([tx0, ty + projH], [x1, ty + projH]);
    text(tx0 + colLabelW / 2, ty + projH / 2, 5.0, 'PROJECT', 'center', 0, 'middle');
    line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + projH]);
    text(tx0 + colLabelW + colValW / 2, ty + projH / 2, 5.2, t.project || '', 'center', 0, 'middle');
    ty += projH;

    // 3. 5개 사양 행 (각 13.0mm, 폰트 4.8 / 5.0mm로 대폭 확대)
    const rowH = 13.0;
    const rows = [
      ['Client', t.client || ''],
      ['Consultant', t.consultant || ''],
      ['Main Contractor', t.contractor || ''],
      ['MEP Contractor', t.mep || ''],
      ['TANK SIZE', dimStr]
    ];
    rows.slice().reverse().forEach(([k, v]) => {
      line([tx0, ty + rowH], [x1, ty + rowH]);
      text(tx0 + colLabelW / 2, ty + rowH / 2, 4.8, k, 'center', 0, 'middle');
      line([tx0 + colLabelW, ty], [tx0 + colLabelW, ty + rowH]);
      text(tx0 + colLabelW + colValW / 2, ty + rowH / 2, 5.0, v, 'center', 0, 'middle');
      ty += rowH;
    });

    // 4. 서명란 / DATE / SCALE / Chart No. (각 13.0mm, 폰트 4.8 / 5.0mm)
    const today = new Date(), pad2 = v => String(v).padStart(2, '0');
    const info = [
      ['DWG NO.', t.dwgNo || ''],
      ['Chart No.', t.chartNo || ''],
      ['SCALE', '1 / ' + N],
      ['DATE', t.date || (today.getFullYear() + '.' + pad2(today.getMonth() + 1) + '.' + pad2(today.getDate()))]
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
    ['DRAWN', 'CHECKED', 'APPROVED'].forEach((k, i) => {
      text(tx0 + scw * i + scw / 2, ty + signValH + signHeaderH / 2, 4.8, k, 'center', 0, 'middle');
      if (i > 0) line([tx0 + scw * i, ty], [tx0 + scw * i, ty + signValH + signHeaderH]);
    });
    if (t.drawn) text(tx0 + scw / 2, ty + signValH / 2, 5.0, t.drawn, 'center', 0, 'middle');
    ty += signValH + signHeaderH;

    // 품명 표 (No. | ITEM) - 있을 경우 중간 하단에 품격있게 배치
    let partsTop = ty;
    if ((t.parts || []).length) {
      const ph = 8.5, n = Math.min(10, t.parts.length);
      partsTop = ty + (n + 1) * ph + 6;
      let yy = partsTop;
      const rowLn = () => line([tx0 + 4, yy], [x1 - 4, yy]);
      rowLn();
      text(tx0 + 16, yy - ph / 2, 4.2, 'No.', 'center', 0, 'middle');
      text(tx0 + tw / 2 + 10, yy - ph / 2, 4.2, 'ITEM', 'center', 0, 'middle');
      yy -= ph; rowLn();
      t.parts.slice(0, 10).forEach((p, i) => {
        text(tx0 + 16, yy - ph / 2, 4.0, String(i + 1), 'center', 0, 'middle');
        text(tx0 + 32, yy - ph / 2, 4.0, p, 'left', 0, 'middle');
        yy -= ph; rowLn();
      });
      line([tx0 + 4, partsTop], [tx0 + 4, yy]);
      line([tx0 + 28, partsTop], [tx0 + 28, yy]);
      line([x1 - 4, partsTop], [x1 - 4, yy]);
    }

    // 배관 노즐 일람표 (NOZZLE SCHEDULE)
    const activeNozzles = getNozzleList(opt);
    let nozTableTop = partsTop;
    if (activeNozzles.length) {
      const colDefs = [
        { key: 'mark', label: 'NO.', w: 16 },
        { key: 'service', label: 'SERVICE', w: 48 },
        { key: 'size', label: 'SIZE', w: 22 },
        { key: 'type', label: 'TYPE', w: 30 },
        { key: 'elev', label: 'ELEV.', w: 34 },
        { key: 'face', label: 'LOCATION', w: 32 }
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
      nozTableTop = partsTop + totalTblH + 6;
      let yy = nozTableTop;
      const tableX0 = tx0 + 4, tableX1 = x1 - 4;

      // 1. 타이틀 행
      line([tableX0, yy], [tableX1, yy]);
      text(tableX0 + tableW / 2, yy - titleH / 2, titleFontH, 'NOZZLE SCHEDULE', 'center', 0, 'middle');
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
      const faceNameMap = { front: 'FRONT (정면)', rear: 'REAR (배면)', left: 'LEFT (좌측)', right: 'RIGHT (우측)', top: 'TOP (상부)' };
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

    // 노트 (Remarks) - 상부 여백 최적화 및 글씨 크기 확대(4.8mm)로 시인성/가독성 극대화
    const allNotes = (opt.notes && opt.notes.length) ? opt.notes : (opt.remarks || []);
    let ny = y - 8;
    text(tx0 + 8, ny, 6.5, '<Remarks>', 'left');
    line([tx0 + 8, ny - 3], [tx0 + 85, ny - 3]);
    ny -= 11.0;

    const bottomLimit = Math.max(partsTop, nozTableTop) > ty ? (Math.max(partsTop, nozTableTop) + 10) : (ty + 10);
    const availNotesH = ny - bottomLimit;
    const noteLineH = 7.5;
    const noteFontH = 4.8;

    // 전체 라인 수 계산 (폭 46글자 기준 줄바꿈)
    const wrappedNotes = allNotes.map(n => wrapText(n, 46));
    let totalLines = 0;
    wrappedNotes.forEach(lines => totalLines += lines.length);

    // 가용 높이에 맞춘 동적 간격(gap) 산출 (최대 9.5mm)
    const freeSpace = availNotesH - (totalLines * noteLineH);
    const noteGap = allNotes.length > 1 ? Math.min(9.5, Math.max(4.0, freeSpace / (allNotes.length - 1))) : 6.0;

    wrappedNotes.forEach((lines, i) => {
      text(tx0 + 8, ny, noteFontH, String(i + 1), 'left');
      lines.forEach((l, li) => {
        text(tx0 + 20, ny - li * noteLineH, noteFontH, l, 'left');
      });
      ny -= lines.length * noteLineH + noteGap;
    });

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

    // 4대 뷰 투영 정렬(Orthographic Alignment) 및 중심 여백 균형 배치
    const TITLE_H = 16;
    const dim_left_1 = 75 + Math.round(26.0 * N);
    const dim_bottom_1 = Math.round(18.0 * N);
    const EXTC = 400;
    const GRD = -600;

    const len2 = Math.max(totalL, totalW);
    const col1_w = (dim_left_1 + totalL + 75) / N;
    const col2_w = (dim_left_1 + len2 + 75) / N;

    const row1_h = (EXTC + totalW + dim_bottom_1) / N + TITLE_H;
    const row2_h = front ? ((H + 100 - GRD + dim_bottom_1) / N + TITLE_H) : 0;

    const areaW = tx0 - x0; // 약 631mm
    const areaH = y1 - y0; // 약 574mm

    // 가로 여백 및 간격 균형 배분
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

    const col1_tank_cx = x0 + left_margin + (dim_left_1 + totalL / 2) / N;
    const col2_tank_cx = x0 + left_margin + col1_w + gap_x + (dim_left_1 + len2 / 2) / N;

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
        if (e.t === 'line') ents.push({ ...e, a: [e.a[0] + dx, e.a[1] + dy], b: [e.b[0] + dx, e.b[1] + dy] });
        else if (e.t === 'circle' || e.t === 'arc') ents.push({ ...e, c: [e.c[0] + dx, e.c[1] + dy] });
        else ents.push({ ...e, p: [e.p[0] + dx, e.p[1] + dy] });
      });
    };

    // 1행 뷰 배치 (TOP VIEW & BASIC CON'C)
    translateEnts(plan.ents, dx1, dy1);
    translateEnts(conc.ents, dx2_conc, dy1);

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

      // 5. 원 내부 표식: 상단 T, 하단 좌측 시트번호(1), 하단 우측 뷰번호(1~4)
      text(bx, by + R * 0.44, 3.4, 'T', 'center', 0, 'middle');
      text(bx - R * 0.48, by - R * 0.48, 2.5, String(sheetNo), 'center', 0, 'middle');
      text(bx + R * 0.48, by - R * 0.48, 2.5, String(viewNo), 'center', 0, 'middle');

      // 6. 이중 밑줄 위 한글 뷰 명칭 (가운데 정렬)
      const textX = bx + R + lineW / 2;
      text(textX, by + 3.6, 5.0, titleText, 'center', 0, 'middle');
    };

    // 1행 뷰 타이틀 (평면도 & 기초패드도) - 치수선과 절대 겹치지 않게 동일한 Y 선상에 수평 정렬
    const dimGap2 = Math.round(18.0 * N);
    const row1_title_y = (dy1 - PAD_OVERHANG - dimGap2) / N - 14.0;
    drawViewTitleBubble(col1_tank_cx, row1_title_y, 1, 1, '평  면  도');
    drawViewTitleBubble(col2_tank_cx, row1_title_y, 1, 2, '기  초  패  드  도');

    let elev = false;
    if (front && side) {
      // 2행 뷰 배치 (정면도 & 우측면도)
      translateEnts(front.ents, dx1, dy2);
      translateEnts(side.ents, dx2_side, dy2);

      // 2행 뷰 타이틀 - 동일한 Y 선상에 수평 정렬
      const row2_title_y = (dy2 + GRD - dim_bottom_1) / N - 14.0;
      drawViewTitleBubble(col1_tank_cx, row2_title_y, 1, 3, '정  면  도');
      drawViewTitleBubble(col2_tank_cx, row2_title_y, 1, 4, '우  측  면  도');
      elev = true;
    }
    const blocks = Object.assign({}, plan.blocks, (front && front.blocks), (side && side.blocks));
    ents.blocks = blocks;
    return { map: mmap, ents, blocks, scale: N, elev, tank: { dimStr, ton, activeAreaM2: activeAreaMm2 / 1e6 } };
  }

  /* ---------- DXF (AutoCAD R12 ASCII, mm) ---------- */
  const LAYERS = { PANEL: 7, PANEL_DETAIL: 8, FRAME: 1, REINF: 5, WALL: 1, DIM: 3, SHEET: 7 };
  const dxfText = str => Array.from(str).map(ch => { const c = ch.codePointAt(0); return c < 128 ? ch : '\\U+' + c.toString(16).toUpperCase().padStart(4, '0'); }).join('');
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
    ents.forEach(e => writeEnt(e, '0'));
    g(0, 'ENDSEC'); g(0, 'EOF');
    return o.join('\r\n') + '\r\n';
  }

  const api = { NOZZLE_SPECS, getNozzleSpec, getNozzleList, buildSkid, buildStay, buildSkidCross, exposedSides, ladderShapes, markShapes, panelShapes, concStrips, buildConcrete, heightSegs, buildElevation, splitHalf, frontSplit, sideSplit, checkSegment, createMap, buildPlan, buildSheet, toDxf, FRAME };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TankCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
