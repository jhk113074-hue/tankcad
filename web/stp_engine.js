/* stp_engine.js - YSACC TANK CAD
 * 3D STEP Parser, WebGL 3D Assembly, and 3D CAD File Exporter
 * (C) 2026 YSACC CO.,LTD.
 */
(function (root) {
  'use strict';

  // =========================================================================
  // 1. Client-side ISO 10303-21 STEP File Parser
  // =========================================================================
  class ClientStepParser {
    constructor(stepText) {
      this.entities = {};
      this.points = {};
      this.vertices = {};
      this.edges = [];
      this.bounds = [0, 0, 0, 1000, 1000, 80];
      if (stepText) this.parse(stepText);
    }

    parse(text) {
      if (!text || typeof text !== 'string') return;
      const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
      const dataMatch = clean.match(/DATA\s*;([\s\S]*?)ENDSEC\s*;/i);
      if (!dataMatch) return;
      const data = dataMatch[1];

      const entityRegex = /#(\d+)\s*=\s*([A-Za-z0-9_]+)\s*\(([\s\S]*?)\)\s*;/g;
      let m;
      while ((m = entityRegex.exec(data)) !== null) {
        this.entities[parseInt(m[1], 10)] = { type: m[2].toUpperCase(), params: m[3].trim() };
      }

      this._extractPoints();
      this._extractEdges();
      this._computeBounds();
    }

    _parseNums(str) {
      const matches = str.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
      return matches ? matches.map(Number) : [];
    }

    _extractPoints() {
      for (const [id, ent] of Object.entries(this.entities)) {
        const eid = Number(id);
        if (ent.type === 'CARTESIAN_POINT') {
          const coords = this._parseNums(ent.params);
          if (coords.length >= 3) this.points[eid] = coords.slice(0, 3);
          else if (coords.length === 2) this.points[eid] = [coords[0], coords[1], 0];
        }
      }
      for (const [id, ent] of Object.entries(this.entities)) {
        const eid = Number(id);
        if (ent.type === 'VERTEX_POINT') {
          const m = ent.params.match(/#(\d+)/);
          if (m && this.points[Number(m[1])]) this.vertices[eid] = this.points[Number(m[1])];
        }
      }
    }

    _extractEdges() {
      const out = [];
      for (const ent of Object.values(this.entities)) {
        if (ent.type === 'EDGE_CURVE' || ent.type === 'LINE_CURVE') {
          const refs = (ent.params.match(/#(\d+)/g) || []).map(s => Number(s.slice(1)));
          if (refs.length >= 2) {
            const p1 = this.vertices[refs[0]] || this.points[refs[0]];
            const p2 = this.vertices[refs[1]] || this.points[refs[1]];
            if (p1 && p2) out.push({ a: p1, b: p2, type: 'line' });
          }
        } else if (ent.type === 'CIRCLE') {
          const nums = this._parseNums(ent.params);
          const axisRef = ent.params.match(/#(\d+)/);
          if (nums.length && axisRef) {
            const r = nums[nums.length - 1];
            const axEnt = this.entities[Number(axisRef[1])];
            if (axEnt) {
              const axRefs = (axEnt.params.match(/#(\d+)/g) || []).map(s => Number(s.slice(1)));
              const center = axRefs.length ? (this.points[axRefs[0]] || [0, 0, 0]) : [0, 0, 0];
              if (r > 0.5) {
                const segs = 16, cPts = [];
                for (let i = 0; i < segs; i++) {
                  const ang = (2 * Math.PI * i) / segs;
                  cPts.push([center[0] + r * Math.cos(ang), center[1] + r * Math.sin(ang), center[2]]);
                }
                for (let i = 0; i < segs; i++) out.push({ a: cPts[i], b: cPts[(i + 1) % segs], type: 'circle' });
              }
            }
          }
        }
      }
      this.edges = out;
    }

    _computeBounds() {
      if (!this.edges.length) return;
      let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      this.edges.forEach(e => {
        [e.a, e.b].forEach(p => {
          minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
          minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
          minZ = Math.min(minZ, p[2]); maxZ = Math.max(maxZ, p[2]);
        });
      });
      this.bounds = [minX, minY, minZ, maxX, maxY, maxZ];
    }
  }

  // =========================================================================
  // 2. Built-in Parametric 3D Panel Geometry (B-Rep Edges & Mesh Geometry)
  // =========================================================================
  function createParametric3DPanel(w = 1000, h = 1000, depth = 80, type = 'std') {
    const flange = 45, d = (type === 'flat' || type === 'roof') ? 25 : depth;
    const innerW = w - 2 * flange, innerH = h - 2 * flange;
    const edges = [];
    const addEdge = (a, b, t = 'line') => edges.push({ a, b, type: t });
    const addRect = (x0, y0, z0, x1, y1, z1, t = 'line') => {
      addEdge([x0, y0, z0], [x1, y0, z1], t);
      addEdge([x1, y0, z1], [x1, y1, z1], t);
      addEdge([x1, y1, z1], [x0, y1, z1], t);
      addEdge([x0, y1, z1], [x0, y0, z0], t);
    };

    // 1. Outer bolt flange perimeter at z = 0
    addRect(0, 0, 0, w, h, 0, 'flange');
    // 2. Inner flange step
    addRect(flange, flange, 0, w - flange, h - flange, 0, 'step');

    if (type === 'flat' || type === 'flat-1x1' || type === 'roof') {
      addRect(flange + 15, flange + 15, d, w - flange - 15, h - flange - 15, d, 'flat_plate');
      addEdge([flange, flange, 0], [flange + 15, flange + 15, d]);
      addEdge([w - flange, flange, 0], [w - flange - 15, flange + 15, d]);
      addEdge([w - flange, h - flange, 0], [w - flange - 15, h - flange - 15, d]);
      addEdge([flange, h - flange, 0], [flange + 15, h - flange - 15, d]);
    } else if (type === 'flat-half2') {
      const hw = Math.round(w / 2);
      addEdge([hw, 0, 0], [hw, h, 0], 'flange');
      addEdge([hw - 8, 0, 0], [hw - 8, h, 0], 'step');
      addEdge([hw + 8, 0, 0], [hw + 8, h, 0], 'step');
      addRect(flange, flange, d, hw - 15, h - flange, d, 'plate');
      addRect(hw + 15, flange, d, w - flange, h - flange, d, 'plate');
    } else {
      // Standard pressed SMC/STS panel with 3D embossed diamond apex and draft angle
      const cx = w / 2, cy = h / 2;
      const rx = innerW * 0.28, ry = innerH * 0.28;
      const topP = [cx, cy + ry, d];
      const rtP = [cx + rx, cy, d];
      const botP = [cx, cy - ry, d];
      const ltP = [cx - rx, cy, d];

      // Embossed diamond apex ring
      addEdge(topP, rtP, 'rib');
      addEdge(rtP, botP, 'rib');
      addEdge(botP, ltP, 'rib');
      addEdge(ltP, topP, 'rib');

      // 4 Crease lines connecting corner steps to diamond apex (draft angle 2.5 deg)
      addEdge([flange, flange, 0], ltP, 'crease');
      addEdge([w - flange, flange, 0], rtP, 'crease');
      addEdge([w - flange, h - flange, 0], rtP, 'crease');
      addEdge([flange, h - flange, 0], ltP, 'crease');

      addEdge(topP, [cx, h - flange, 0], 'crease');
      addEdge(botP, [cx, flange, 0], 'crease');
    }

    // Bolt holes on flange
    for (let by = 100; by < h; by += 100) {
      [[22, by], [w - 22, by]].forEach(([bx, bby]) => {
        const r = 6.5, segs = 8;
        for (let i = 0; i < segs; i++) {
          const a1 = (2 * Math.PI * i) / segs, a2 = (2 * Math.PI * (i + 1)) / segs;
          addEdge([bx + r * Math.cos(a1), bby + r * Math.sin(a1), 0], [bx + r * Math.cos(a2), bby + r * Math.sin(a2), 0], 'hole');
        }
      });
    }

    return { edges, bounds: [0, 0, 0, w, h, d], w, h, depth: d, type };
  }

  // =========================================================================
  // 3. Complete 3D Water Tank Assembly Builder
  // =========================================================================
  class Tank3DAssembly {
    constructor(opt, templates, sideT) {
      this.opt = opt || {};
      this.templates = templates;
      this.sideT = sideT;
      this.panels = [];
      this.skidBeams = [];
      this.concPads = [];
      this.accessories = [];
      this.nozzles = [];
      this.customStpModels = {};
      this._build();
    }

    _build() {
      const opt = this.opt;
      const L = (opt.length || [5000]).slice(0, 5);
      const W = (opt.width || [5000]).slice(0, 5);
      const H = (opt.height || [3000]).reduce((a, b) => a + (b || 0), 0) || 3000;
      const b11 = Boolean(opt.b11);
      const C = root.TankCore || {};
      const map = C.createMap ? C.createMap(opt) : {
        length: L.reduce((a, b) => a + b, 0),
        width: W.reduce((a, b) => a + b, 0),
        cols: L.filter(Boolean),
        rows: W.filter(Boolean),
        xs: [0],
        ys: [0],
        has: () => true
      };
      if (!map.xs || map.xs.length !== map.cols.length) {
        let cur = 0; map.xs = map.cols.map(c => { const x = cur; cur += c; return x; });
      }
      if (!map.ys || map.ys.length !== map.rows.length) {
        let cur = 0; map.ys = map.rows.map(r => { const y = cur; cur += y; return y; });
      }

      const hs = (opt.hseg && opt.hseg.length) ? opt.hseg : ((C.heightSegs && C.heightSegs(H, b11)) || [1000, 1000, 1000]);
      this.totalL = map.length;
      this.totalW = map.width;
      this.H = H;
      this.map = map;
      this.hs = hs;

      const zs = [0];
      let curZ = 0;
      hs.forEach(h => { curZ += h; zs.push(curZ); });
      this.zs = zs;

      const sidePanels = opt.sidePanels || {};

      // 1. Front Wall (Y = 0, facing -Y)
      for (let j = 0; j < map.cols.length; j++) {
        const x0 = map.xs[j], w = map.cols[j];
        for (let k = 0; k < hs.length; k++) {
          const z0 = zs[k], h = hs[k];
          const pType = sidePanels[`front,${k},${j}`] || sidePanels[`front_${k}_${j}`] || 'std';
          this.panels.push({
            face: 'front', col: j, tier: k, w, h, depth: 80,
            pos: [x0, 0, z0], rot: [0, 0, 0], type: pType,
            geom: createParametric3DPanel(w, h, 80, pType)
          });
        }
      }

      // 2. Right Wall (X = totalL, facing +X)
      for (let i = 0; i < map.rows.length; i++) {
        const y0 = map.ys[i], w = map.rows[i];
        for (let k = 0; k < hs.length; k++) {
          const z0 = zs[k], h = hs[k];
          const pType = sidePanels[`side,${k},${i}`] || sidePanels[`right,${k},${i}`] || 'std';
          this.panels.push({
            face: 'right', row: i, tier: k, w, h, depth: 80,
            pos: [this.totalL, y0, z0], rot: [0, 0, 90], type: pType,
            geom: createParametric3DPanel(w, h, 80, pType)
          });
        }
      }

      // 3. Back Wall (Y = totalW, facing +Y)
      for (let j = 0; j < map.cols.length; j++) {
        const x0 = map.xs[j], w = map.cols[j];
        for (let k = 0; k < hs.length; k++) {
          const z0 = zs[k], h = hs[k];
          const pType = sidePanels[`rear,${k},${j}`] || 'std';
          this.panels.push({
            face: 'back', col: j, tier: k, w, h, depth: 80,
            pos: [x0 + w, this.totalW, z0], rot: [0, 0, 180], type: pType,
            geom: createParametric3DPanel(w, h, 80, pType)
          });
        }
      }

      // 4. Left Wall (X = 0, facing -X)
      for (let i = 0; i < map.rows.length; i++) {
        const y0 = map.ys[i], w = map.rows[i];
        for (let k = 0; k < hs.length; k++) {
          const z0 = zs[k], h = hs[k];
          const pType = sidePanels[`left,${k},${i}`] || 'std';
          this.panels.push({
            face: 'left', row: i, tier: k, w, h, depth: 80,
            pos: [0, y0 + w, z0], rot: [0, 0, -90], type: pType,
            geom: createParametric3DPanel(w, h, 80, pType)
          });
        }
      }

      // 5. Roof Panels (Z = H, facing +Z)
      for (let i = 0; i < map.rows.length; i++) {
        const y0 = map.ys[i], rh = map.rows[i];
        for (let j = 0; j < map.cols.length; j++) {
          const x0 = map.xs[j], cw = map.cols[j];
          if (map.removed && map.removed.has(i + ',' + j)) continue;
          this.panels.push({
            face: 'roof', row: i, col: j, w: cw, h: rh, depth: 50,
            pos: [x0, y0, H], rot: [-90, 0, 0], type: 'roof',
            geom: createParametric3DPanel(cw, rh, 50, 'flat')
          });
        }
      }

      // 6. Bottom Panels (Z = 0, facing -Z)
      for (let i = 0; i < map.rows.length; i++) {
        const y0 = map.ys[i], rh = map.rows[i];
        for (let j = 0; j < map.cols.length; j++) {
          const x0 = map.xs[j], cw = map.cols[j];
          if (map.removed && map.removed.has(i + ',' + j)) continue;
          this.panels.push({
            face: 'bottom', row: i, col: j, w: cw, h: rh, depth: 50,
            pos: [x0, y0 + rh, 0], rot: [90, 0, 0], type: 'bottom',
            geom: createParametric3DPanel(cw, rh, 50, 'flat')
          });
        }
      }

      // 7. Internal Partition Wall (if partition wall active)
      if (opt.partCol && opt.partCol > 0 && opt.partCol < map.cols.length) {
        const partX = map.xs[opt.partCol];
        for (let i = 0; i < map.rows.length; i++) {
          const y0 = map.ys[i], w = map.rows[i];
          for (let k = 0; k < hs.length; k++) {
            const z0 = zs[k], h = hs[k];
            this.panels.push({
              face: 'partition', row: i, tier: k, w, h, depth: 80,
              pos: [partX, y0, z0], rot: [0, 0, 90], type: 'partition',
              geom: createParametric3DPanel(w, h, 80, 'std')
            });
          }
        }
      }

      // 8. Steel Base Skid Frame (Channel 75/100/125/150mm)
      const fH = Number(opt.frame) || 100;
      this.skidBeams.push({ pos: [0, 0, -fH], size: [this.totalL, 75, fH] });
      this.skidBeams.push({ pos: [0, this.totalW - 75, -fH], size: [this.totalL, 75, fH] });
      this.skidBeams.push({ pos: [0, 0, -fH], size: [75, this.totalW, fH] });
      this.skidBeams.push({ pos: [this.totalL - 75, 0, -fH], size: [75, this.totalW, fH] });
      // Cross skid beams along columns
      for (let j = 1; j < map.cols.length; j++) {
        this.skidBeams.push({ pos: [map.xs[j] - 37.5, 0, -fH], size: [75, this.totalW, fH] });
      }

      // 9. Concrete Foundation Pads (300~400mm width strips)
      const padW = 300, padH = 500, padExt = 200;
      for (let j = 0; j <= map.cols.length; j++) {
        const cx = (j === map.cols.length) ? this.totalL : map.xs[j];
        this.concPads.push({
          pos: [cx - padW / 2, -padExt, -fH - padH],
          size: [padW, this.totalW + padExt * 2, padH]
        });
      }

      // 10. Accessories: Manhole, Air Vent, External Ladder
      const mh = (opt.manholes && opt.manholes.length) ? opt.manholes : [{ r: 0, c: 0 }];
      mh.forEach(m => {
        const mx = (map.xs[m.c] || 0) + (map.cols[m.c] || 1000) / 2;
        const my = (map.ys[m.r] || 0) + (map.rows[m.r] || 1000) / 2;
        this.accessories.push({ type: 'manhole', pos: [mx, my, H], r: 350, h: 120 });
      });

      const vents = opt.vents || [{ r: 0, c: Math.max(0, map.cols.length - 1) }];
      vents.forEach(v => {
        const vx = (map.xs[v.c] || 0) + (map.cols[v.c] || 1000) / 2;
        const vy = (map.ys[v.r] || 0) + (map.rows[v.r] || 1000) / 2;
        this.accessories.push({ type: 'vent', pos: [vx, vy, H], r: 100, h: 250 });
      });

      const ladders = opt.ladders || [{ r: 0, c: 0, side: 'U' }];
      ladders.forEach(lad => {
        const lx = (map.xs[lad.c] || 0) + (map.cols[lad.c] || 1000) / 2;
        const ly = (lad.side === 'U' || lad.side === 'rear') ? this.totalW + 120 : -120;
        this.accessories.push({ type: 'ladder', pos: [lx, ly, 0], w: 450, h: H + 300 });
      });

      // 11. Nozzles
      const nozzles = opt.nozzles || [];
      nozzles.forEach(noz => {
        const face = noz.face || 'front';
        let nx = 0, ny = 0, nz = Number(noz.elev) || 500;
        const colW = (map.cols[noz.col] || 1000);
        const colX = (map.xs[noz.col] || 0) + colW / 2 + (Number(noz.offset) || 0);
        if (face === 'front') { nx = colX; ny = 0; }
        else if (face === 'rear') { nx = colX; ny = this.totalW; }
        else if (face === 'right') { nx = this.totalL; ny = (map.ys[noz.col] || 0) + 500; }
        else if (face === 'left') { nx = 0; ny = (map.ys[noz.col] || 0) + 500; }
        this.nozzles.push({ ...noz, pos: [nx, ny, nz] });
      });
    }

    // =======================================================================
    // 4. Three.js Interactive WebGL Scene Mesh & Group Builder
    // =======================================================================
    createThreeGroup(THREE, options = {}) {
      const group = new THREE.Group();
      const isSTS = this.opt.material === 'STS';

      // 1. PBR Materials
      const panelColor = isSTS ? 0xd0d5dc : 0xf2efe9;
      const matPanel = new THREE.MeshStandardMaterial({
        color: panelColor,
        roughness: isSTS ? 0.25 : 0.5,
        metalness: isSTS ? 0.85 : 0.05,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });

      const matRoof = new THREE.MeshStandardMaterial({
        color: isSTS ? 0xc8ced6 : 0xe5e2dc,
        roughness: 0.6,
        metalness: isSTS ? 0.8 : 0.05,
        side: THREE.DoubleSide
      });

      const matSkid = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.55,
        metalness: 0.75
      });

      const matConc = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.95,
        metalness: 0.05
      });

      const matManhole = new THREE.MeshStandardMaterial({
        color: 0xea580c,
        roughness: 0.4,
        metalness: 0.2
      });

      const matVent = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.35,
        metalness: 0.4
      });

      const matLadder = new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        roughness: 0.5,
        metalness: 0.5
      });

      const matNozzle = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.35,
        metalness: 0.7
      });

      const edgeLineMat = new THREE.LineBasicMaterial({
        color: 0x1e293b,
        linewidth: 1
      });

      // Center offset to place tank center at (0, 0, 0)
      const cx = this.totalL / 2, cy = this.totalW / 2, cz = this.H / 2;

      // Group lists for exploded view control
      const panelMeshList = [];

      // Helper to build 3D panel mesh with diamond embossing
      const buildPanelMesh = (p) => {
        const pGroup = new THREE.Group();
        const w = p.w, h = p.h, d = p.depth;
        const fl = 45;

        // Front face geometry with embossed diamond
        const geom = new THREE.BufferGeometry();
        const verts = [];
        const norms = [];

        // Simple sturdy 3D tray panel representation
        // Flange ring:
        const z0 = 0, z1 = d;
        // 4 corner outer: (0,0,z0), (w,0,z0), (w,h,z0), (0,h,z0)
        // 4 inner step: (fl, fl, z0), (w-fl, fl, z0), (w-fl, h-fl, z0), (fl, h-fl, z0)
        // Flange face quads (4 trapezoids):
        const addQuad = (p1, p2, p3, p4, n) => {
          verts.push(...p1, ...p2, ...p3, ...p1, ...p3, ...p4);
          for (let k = 0; k < 6; k++) norms.push(...n);
        };

        // Flange front rim
        addQuad([0, 0, z0], [w, 0, z0], [w - fl, fl, z0], [fl, fl, z0], [0, 0, 1]);
        addQuad([w - fl, fl, z0], [w, 0, z0], [w, h, z0], [w - fl, h - fl, z0], [0, 0, 1]);
        addQuad([fl, h - fl, z0], [w - fl, h - fl, z0], [w, h, z0], [0, h, z0], [0, 0, 1]);
        addQuad([0, 0, z0], [fl, fl, z0], [fl, h - fl, z0], [0, h, z0], [0, 0, 1]);

        if (p.type === 'roof' || p.type === 'bottom' || p.type === 'flat' || p.type === 'flat-1x1') {
          // Flat panel plate
          addQuad([fl, fl, z1], [w - fl, fl, z1], [w - fl, h - fl, z1], [fl, h - fl, z1], [0, 0, 1]);
          // Slanted sidewalls
          addQuad([fl, fl, z0], [w - fl, fl, z0], [w - fl, fl, z1], [fl, fl, z1], [0, -1, 0.3]);
          addQuad([w - fl, fl, z0], [w - fl, h - fl, z0], [w - fl, h - fl, z1], [w - fl, fl, z1], [1, 0, 0.3]);
          addQuad([w - fl, h - fl, z0], [fl, h - fl, z0], [fl, h - fl, z1], [w - fl, h - fl, z1], [0, 1, 0.3]);
          addQuad([fl, h - fl, z0], [fl, fl, z0], [fl, fl, z1], [fl, h - fl, z1], [-1, 0, 0.3]);
        } else {
          // Embossed diamond apex
          const midX = w / 2, midY = h / 2;
          const rx = (w - 2 * fl) * 0.28, ry = (h - 2 * fl) * 0.28;
          const apexT = [midX, midY + ry, z1];
          const apexR = [midX + rx, midY, z1];
          const apexB = [midX, midY - ry, z1];
          const apexL = [midX - rx, midY, z1];
          const apexC = [midX, midY, z1 + 5];

          // Center diamond cap (4 triangles)
          const addTri = (p1, p2, p3, n) => {
            verts.push(...p1, ...p2, ...p3);
            for (let k = 0; k < 3; k++) norms.push(...n);
          };
          addTri(apexT, apexR, apexC, [0.3, 0.3, 1]);
          addTri(apexR, apexB, apexC, [0.3, -0.3, 1]);
          addTri(apexB, apexL, apexC, [-0.3, -0.3, 1]);
          addTri(apexL, apexT, apexC, [-0.3, 0.3, 1]);

          // Embossed facets from inner step to diamond rim
          addQuad([fl, fl, z0], [w - fl, fl, z0], apexR, apexB, [0, -0.6, 0.8]);
          addQuad([w - fl, fl, z0], [w - fl, h - fl, z0], apexT, apexR, [0.6, 0, 0.8]);
          addQuad([w - fl, h - fl, z0], [fl, h - fl, z0], apexL, apexT, [0, 0.6, 0.8]);
          addQuad([fl, h - fl, z0], [fl, fl, z0], apexB, apexL, [-0.6, 0, 0.8]);
        }

        geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));

        const mat = (p.face === 'roof' || p.face === 'bottom') ? matRoof : matPanel;
        const mesh = new THREE.Mesh(geom, mat);
        pGroup.add(mesh);

        // Edge wireframe lines
        const lineVerts = [];
        p.geom.edges.forEach(e => {
          lineVerts.push(...e.a, ...e.b);
        });
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
        const lineSegs = new THREE.LineSegments(lineGeom, edgeLineMat);
        pGroup.add(lineSegs);

        return pGroup;
      };

      // Assemble all panels
      this.panels.forEach((p, idx) => {
        const pObj = buildPanelMesh(p);
        pObj.rotation.x = (p.rot[0] * Math.PI) / 180;
        pObj.rotation.y = (p.rot[1] * Math.PI) / 180;
        pObj.rotation.z = (p.rot[2] * Math.PI) / 180;

        // Position relative to tank center
        const ox = p.pos[0] - cx;
        const oy = p.pos[1] - cy;
        const oz = p.pos[2] - cz;
        pObj.position.set(ox, oy, oz);

        // Explode vector
        let ex = 0, ey = 0, ez = 0;
        if (p.face === 'front') ey = -1;
        else if (p.face === 'back') ey = 1;
        else if (p.face === 'left') ex = -1;
        else if (p.face === 'right') ex = 1;
        else if (p.face === 'roof') ez = 1;
        else if (p.face === 'bottom') ez = -1;

        panelMeshList.push({
          obj: pObj,
          origPos: new THREE.Vector3(ox, oy, oz),
          explodeDir: new THREE.Vector3(ex, ey, ez)
        });

        group.add(pObj);
      });

      // Base Skid Frame
      this.skidBeams.forEach(b => {
        const bGeom = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
        const bMesh = new THREE.Mesh(bGeom, matSkid);
        bMesh.position.set(
          b.pos[0] + b.size[0] / 2 - cx,
          b.pos[1] + b.size[1] / 2 - cy,
          b.pos[2] + b.size[2] / 2 - cz
        );
        group.add(bMesh);
      });

      // Concrete Pads
      this.concPads.forEach(cp => {
        const cGeom = new THREE.BoxGeometry(cp.size[0], cp.size[1], cp.size[2]);
        const cMesh = new THREE.Mesh(cGeom, matConc);
        cMesh.position.set(
          cp.pos[0] + cp.size[0] / 2 - cx,
          cp.pos[1] + cp.size[1] / 2 - cy,
          cp.pos[2] + cp.size[2] / 2 - cz
        );
        group.add(cMesh);
      });

      // Accessories: Manhole, Vent, Ladder
      this.accessories.forEach(acc => {
        if (acc.type === 'manhole') {
          const mhGeom = new THREE.CylinderGeometry(acc.r, acc.r, acc.h, 24);
          const mhMesh = new THREE.Mesh(mhGeom, matManhole);
          mhMesh.rotation.x = Math.PI / 2;
          mhMesh.position.set(acc.pos[0] - cx, acc.pos[1] - cy, acc.pos[2] + acc.h / 2 - cz);
          group.add(mhMesh);
        } else if (acc.type === 'vent') {
          const vGeom = new THREE.CylinderGeometry(acc.r * 0.4, acc.r * 0.4, acc.h, 16);
          const vMesh = new THREE.Mesh(vGeom, matVent);
          vMesh.rotation.x = Math.PI / 2;
          vMesh.position.set(acc.pos[0] - cx, acc.pos[1] - cy, acc.pos[2] + acc.h / 2 - cz);
          group.add(vMesh);
        } else if (acc.type === 'ladder') {
          const lGroup = new THREE.Group();
          const railGeom = new THREE.CylinderGeometry(20, 20, acc.h, 12);
          const r1 = new THREE.Mesh(railGeom, matLadder);
          const r2 = new THREE.Mesh(railGeom, matLadder);
          r1.position.set(-acc.w / 2, 0, acc.h / 2);
          r2.position.set(acc.w / 2, 0, acc.h / 2);
          lGroup.add(r1); lGroup.add(r2);
          // Rungs
          for (let rz = 250; rz < acc.h; rz += 300) {
            const rungGeom = new THREE.CylinderGeometry(12, 12, acc.w, 8);
            const rung = new THREE.Mesh(rungGeom, matLadder);
            rung.rotation.z = Math.PI / 2;
            rung.position.set(0, 0, rz);
            lGroup.add(rung);
          }
          lGroup.position.set(acc.pos[0] - cx, acc.pos[1] - cy, -cz);
          group.add(lGroup);
        }
      });

      // Nozzles
      this.nozzles.forEach(noz => {
        const nGroup = new THREE.Group();
        const pipeGeom = new THREE.CylinderGeometry(60, 60, 200, 16);
        const flangeGeom = new THREE.CylinderGeometry(110, 110, 25, 16);
        const pipe = new THREE.Mesh(pipeGeom, matNozzle);
        const flange = new THREE.Mesh(flangeGeom, matNozzle);
        flange.position.y = 90;
        nGroup.add(pipe); nGroup.add(flange);

        if (noz.face === 'front') {
          nGroup.rotation.x = Math.PI / 2;
          nGroup.position.set(noz.pos[0] - cx, -100 - cy, noz.pos[2] - cz);
        } else if (noz.face === 'rear') {
          nGroup.rotation.x = -Math.PI / 2;
          nGroup.position.set(noz.pos[0] - cx, this.totalW + 100 - cy, noz.pos[2] - cz);
        } else if (noz.face === 'right') {
          nGroup.rotation.z = -Math.PI / 2;
          nGroup.position.set(this.totalL + 100 - cx, noz.pos[1] - cy, noz.pos[2] - cz);
        } else if (noz.face === 'left') {
          nGroup.rotation.z = Math.PI / 2;
          nGroup.position.set(-100 - cx, noz.pos[1] - cy, noz.pos[2] - cz);
        }
        group.add(nGroup);
      });

      // API helpers on the group
      group.setExplode = function (factor) {
        const dist = 800 * factor;
        panelMeshList.forEach(p => {
          p.obj.position.copy(p.origPos).addScaledVector(p.explodeDir, dist);
        });
      };

      group.setWireframe = function (mode) {
        const isWire = (mode === 'wireframe');
        const showEdges = (mode !== 'shaded');
        matPanel.wireframe = isWire;
        matRoof.wireframe = isWire;
        edgeLineMat.visible = showEdges;
      };

      group.materials = [matPanel, matRoof, matSkid, matConc, matManhole, matVent, matLadder, matNozzle];

      return group;
    }

    // =======================================================================
    // 5. CAD File Exporters (3D STEP, 3D DXF, 3D OBJ)
    // =======================================================================
    toStepString() {
      const lines = [];
      lines.push('ISO-10303-21;');
      lines.push('HEADER;');
      lines.push("FILE_DESCRIPTION(('YSACC TANK CAD COMPLETE 3D ASSEMBLY'), '2;1');");
      lines.push(`FILE_NAME('Tank_Assembly_${this.totalL}x${this.totalW}x${this.H}.stp', '2026-10-01T00:00:00', ('YSACC CAD TEAM'), ('YSACC CO.,LTD'), 'TANKCAD 3D EXPORT ENGINE', 'TANKCAD', '');`);
      lines.push("FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));");
      lines.push('ENDSEC;');
      lines.push('DATA;');

      let eid = 1;
      const E = txt => { const s = `#${eid}=${txt};`; eid++; lines.push(s); return eid - 1; };

      const origin = E("CARTESIAN_POINT('', (0.0, 0.0, 0.0))");
      const dirZ = E("DIRECTION('', (0.0, 0.0, 1.0))");
      const dirX = E("DIRECTION('', (1.0, 0.0, 0.0))");

      E(`AXIS2_PLACEMENT_3D('ROOT_AXIS', #${origin}, #${dirZ}, #${dirX})`);

      this.panels.forEach((p, idx) => {
        const px = p.pos[0].toFixed(1), py = p.pos[1].toFixed(1), pz = p.pos[2].toFixed(1);
        const pPt = E(`CARTESIAN_POINT('P_${idx}', (${px}, ${py}, ${pz}))`);
        let pDirZ = dirZ, pDirX = dirX;
        if (p.face === 'front') {
          pDirZ = E("DIRECTION('', (0.0, -1.0, 0.0))");
          pDirX = E("DIRECTION('', (1.0, 0.0, 0.0))");
        } else if (p.face === 'right') {
          pDirZ = E("DIRECTION('', (1.0, 0.0, 0.0))");
          pDirX = E("DIRECTION('', (0.0, 1.0, 0.0))");
        } else if (p.face === 'back') {
          pDirZ = E("DIRECTION('', (0.0, 1.0, 0.0))");
          pDirX = E("DIRECTION('', (-1.0, 0.0, 0.0))");
        } else if (p.face === 'left') {
          pDirZ = E("DIRECTION('', (-1.0, 0.0, 0.0))");
          pDirX = E("DIRECTION('', (0.0, -1.0, 0.0))");
        } else if (p.face === 'roof') {
          pDirZ = E("DIRECTION('', (0.0, 0.0, 1.0))");
          pDirX = E("DIRECTION('', (1.0, 0.0, 0.0))");
        }
        E(`AXIS2_PLACEMENT_3D('COMP_${idx}_PLACEMENT', #${pPt}, #${pDirZ}, #${pDirX})`);
      });

      lines.push('ENDSEC;');
      lines.push('END-ISO-10303-21;');
      return lines.join('\n');
    }

    to3dDxfString() {
      const out = [];
      out.push('0\nSECTION\n2\nHEADER\n0\nENDSEC');
      out.push('0\nSECTION\n2\nENTITIES');

      const ln3 = (a, b, layer = 'PANEL') => {
        out.push(`0\nLINE\n8\n${layer}\n10\n${a[0].toFixed(2)}\n20\n${a[1].toFixed(2)}\n30\n${a[2].toFixed(2)}\n11\n${b[0].toFixed(2)}\n21\n${b[1].toFixed(2)}\n31\n${b[2].toFixed(2)}`);
      };

      this.panels.forEach(p => {
        const rad = (p.rot[2] * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        const transform = pt => {
          let x = pt[0], y = pt[1], z = pt[2];
          if (p.rot[0] === -90) { const ty = y; y = -z; z = ty; }
          else if (p.rot[0] === 90) { const ty = y; y = z; z = -ty; }
          const rx = x * cos - y * sin;
          const ry = x * sin + y * cos;
          return [rx + p.pos[0], ry + p.pos[1], z + p.pos[2]];
        };

        p.geom.edges.forEach(e => {
          ln3(transform(e.a), transform(e.b), 'PANEL_3D');
        });
      });

      out.push('0\nENDSEC\n0\nEOF');
      return out.join('\n');
    }

    toObjString() {
      const out = [];
      out.push('# YSACC TANK CAD - 3D Tank Assembly OBJ Export');
      out.push(`# Tank Size: ${this.totalL} x ${this.totalW} x ${this.H} mm`);
      out.push(`g TankAssembly\n`);

      let vOffset = 1;
      this.panels.forEach((p, pIdx) => {
        out.push(`o Panel_${p.face}_${pIdx}`);
        const rad = (p.rot[2] * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        const transform = pt => {
          let x = pt[0], y = pt[1], z = pt[2];
          if (p.rot[0] === -90) { const ty = y; y = -z; z = ty; }
          else if (p.rot[0] === 90) { const ty = y; y = z; z = -ty; }
          const rx = x * cos - y * sin;
          const ry = x * sin + y * cos;
          return [rx + p.pos[0], ry + p.pos[1], z + p.pos[2]];
        };

        p.geom.edges.forEach(e => {
          const p1 = transform(e.a), p2 = transform(e.b);
          out.push(`v ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} ${p1[2].toFixed(2)}`);
          out.push(`v ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} ${p2[2].toFixed(2)}`);
          out.push(`l ${vOffset} ${vOffset + 1}`);
          vOffset += 2;
        });
      });

      return out.join('\n');
    }
  }

  // =========================================================================
  // Exports
  // =========================================================================
  root.Tank3D = {
    ClientStepParser,
    createParametric3DPanel,
    Tank3DAssembly
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.Tank3D;
  }
})(typeof window !== 'undefined' ? window : global);
