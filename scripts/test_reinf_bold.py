import json, subprocess, os
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon

with open('e:/tankcad/scripts/patch_sec7.js', 'w', encoding='utf-8') as f:
    f.write(r"""
const fs = require('fs');
let code = fs.readFileSync('web/tank.js', 'utf8');

const startIdx = code.indexOf('// 7. 벽체 보강재');
const endIdx = code.indexOf('// 8. 노즐');

const newSec7 = `// 7. 벽체 보강재 (Internal Reinforcement Plates: media_1791203608783.png 표준 보강 격자판 형상 - 플랜지 외측 전면 배치)
    const flangeD = 75; // 외부 플랜지 돌출 폭 (75mm)
    const HX = 110, hq = 55, sr = 12;

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
          // 좌측 모서리 또는 접합부
          if (!map.has(i, j - 1)) {
            // 외곽 좌측 끝: halfPlate (우향 110x220, 2볼트)
            const pDepth = getDepth(x0 + HX / 2, py, z) - 30;
            poly([toIso(x0, py, z - HX), toIso(x0 + HX, py, z - HX), toIso(x0 + HX, py, z + HX), toIso(x0, py, z + HX)], 'REINF', true, true, pDepth);
            poly([toIso(x0, py, z - HX), toIso(x0 + HX, py, z - HX), toIso(x0 + HX, py, z + HX), toIso(x0, py, z + HX)], 'REINF', true, false, pDepth);
            isoCircle(x0 + hq, py, z + hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 + hq, py, z - hq, sr, 'XZ', 'REINF', pDepth, 12);
          } else {
            // 내부 기둥 접합부: fullPlate (220x220, 4볼트)
            const pDepth = getDepth(x0, py, z) - 30;
            poly([toIso(x0 - HX, py, z - HX), toIso(x0 + HX, py, z - HX), toIso(x0 + HX, py, z + HX), toIso(x0 - HX, py, z + HX)], 'REINF', true, true, pDepth);
            poly([toIso(x0 - HX, py, z - HX), toIso(x0 + HX, py, z - HX), toIso(x0 + HX, py, z + HX), toIso(x0 - HX, py, z + HX)], 'REINF', true, false, pDepth);
            isoCircle(x0 - hq, py, z + hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 - hq, py, z - hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 + hq, py, z + hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 + hq, py, z - hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0, py, z, 18, 'XZ', 'REINF', pDepth, 12);
          }

          // 우측 모서리 끝단 (마지막 열인 경우): halfPlate (좌향 110x220, 2볼트)
          if (!map.has(i, j + 1)) {
            const pDepth = getDepth(x1 - HX / 2, py, z) - 30;
            poly([toIso(x1 - HX, py, z - HX), toIso(x1, py, z - HX), toIso(x1, py, z + HX), toIso(x1 - HX, py, z + HX)], 'REINF', true, true, pDepth);
            poly([toIso(x1 - HX, py, z - HX), toIso(x1, py, z - HX), toIso(x1, py, z + HX), toIso(x1 - HX, py, z + HX)], 'REINF', true, false, pDepth);
            isoCircle(x1 - hq, py, z + hq, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x1 - hq, py, z - hq, sr, 'XZ', 'REINF', pDepth, 12);
          }
        }

        // 최상단 판넬 중앙 보강판 (midRect: 220x110, 2볼트)
        if (hs.length >= 1) {
          const topK = hs.length - 1;
          const topZMid = zs[topK] + Math.round(hs[topK] / 2);
          if (map.has(i, j - 1)) {
            const pDepth = getDepth(x0, py, topZMid) - 30;
            poly([toIso(x0 - HX, py, topZMid - hq), toIso(x0 + HX, py, topZMid - hq), toIso(x0 + HX, py, topZMid + hq), toIso(x0 - HX, py, topZMid + hq)], 'REINF', true, true, pDepth);
            poly([toIso(x0 - HX, py, topZMid - hq), toIso(x0 + HX, py, topZMid - hq), toIso(x0 + HX, py, topZMid + hq), toIso(x0 - HX, py, topZMid + hq)], 'REINF', true, false, pDepth);
            isoCircle(x0 - hq, py, topZMid, sr, 'XZ', 'REINF', pDepth, 12);
            isoCircle(x0 + hq, py, topZMid, sr, 'XZ', 'REINF', pDepth, 12);
          }
        }

        // H > 3000 바닥 보강판 (lowPlate: 220x110, 2볼트)
        if (H > 3000 && map.has(i, j - 1)) {
          const pDepth = getDepth(x0, py, hq) - 30;
          poly([toIso(x0 - HX, py, 0), toIso(x0 + HX, py, 0), toIso(x0 + HX, py, HX), toIso(x0 - HX, py, HX)], 'REINF', true, true, pDepth);
          poly([toIso(x0 - HX, py, 0), toIso(x0 + HX, py, 0), toIso(x0 + HX, py, HX), toIso(x0 - HX, py, HX)], 'REINF', true, false, pDepth);
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
          // 전면 모서리 또는 접합부
          if (!map.has(i - 1, j)) {
            // 외곽 전면 끝: halfPlate (후향 110x220, 2볼트)
            const pDepth = getDepth(px, y0 + HX / 2, z) - 30;
            poly([toIso(px, y0, z - HX), toIso(px, y0 + HX, z - HX), toIso(px, y0 + HX, z + HX), toIso(px, y0, z + HX)], 'REINF', true, true, pDepth);
            poly([toIso(px, y0, z - HX), toIso(px, y0 + HX, z - HX), toIso(px, y0 + HX, z + HX), toIso(px, y0, z + HX)], 'REINF', true, false, pDepth);
            isoCircle(px, y0 + hq, z + hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 + hq, z - hq, sr, 'YZ', 'REINF', pDepth, 12);
          } else {
            // 내부 기둥 접합부: fullPlate (220x220, 4볼트)
            const pDepth = getDepth(px, y0, z) - 30;
            poly([toIso(px, y0 - HX, z - HX), toIso(px, y0 + HX, z - HX), toIso(px, y0 + HX, z + HX), toIso(px, y0 - HX, z + HX)], 'REINF', true, true, pDepth);
            poly([toIso(px, y0 - HX, z - HX), toIso(px, y0 + HX, z - HX), toIso(px, y0 + HX, z + HX), toIso(px, y0 - HX, z + HX)], 'REINF', true, false, pDepth);
            isoCircle(px, y0 - hq, z + hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 - hq, z - hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 + hq, z + hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 + hq, z - hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0, z, 18, 'YZ', 'REINF', pDepth, 12);
          }

          // 후면 모서리 끝단 (마지막 행인 경우): halfPlate (전향 110x220, 2볼트)
          if (!map.has(i + 1, j)) {
            const pDepth = getDepth(px, y1 - HX / 2, z) - 30;
            poly([toIso(px, y1 - HX, z - HX), toIso(px, y1, z - HX), toIso(px, y1, z + HX), toIso(px, y1 - HX, z + HX)], 'REINF', true, true, pDepth);
            poly([toIso(px, y1 - HX, z - HX), toIso(px, y1, z - HX), toIso(px, y1, z + HX), toIso(px, y1 - HX, z + HX)], 'REINF', true, false, pDepth);
            isoCircle(px, y1 - hq, z + hq, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y1 - hq, z - hq, sr, 'YZ', 'REINF', pDepth, 12);
          }
        }

        // 최상단 판넬 중앙 보강판 (midRect: 220x110, 2볼트)
        if (hs.length >= 1) {
          const topK = hs.length - 1;
          const topZMid = zs[topK] + Math.round(hs[topK] / 2);
          if (map.has(i - 1, j)) {
            const pDepth = getDepth(px, y0, topZMid) - 30;
            poly([toIso(px, y0 - HX, topZMid - hq), toIso(px, y0 + HX, topZMid - hq), toIso(px, y0 + HX, topZMid + hq), toIso(px, y0 - HX, topZMid + hq)], 'REINF', true, true, pDepth);
            poly([toIso(px, y0 - HX, topZMid - hq), toIso(px, y0 + HX, topZMid - hq), toIso(px, y0 + HX, topZMid + hq), toIso(px, y0 - HX, topZMid + hq)], 'REINF', true, false, pDepth);
            isoCircle(px, y0 - hq, topZMid, sr, 'YZ', 'REINF', pDepth, 12);
            isoCircle(px, y0 + hq, topZMid, sr, 'YZ', 'REINF', pDepth, 12);
          }
        }

        // H > 3000 바닥 보강판 (lowPlate: 220x110, 2볼트)
        if (H > 3000 && map.has(i - 1, j)) {
          const pDepth = getDepth(px, y0, hq) - 30;
          poly([toIso(px, y0 - HX, 0), toIso(px, y0 + HX, 0), toIso(px, y0 + HX, HX), toIso(px, y0 - HX, HX)], 'REINF', true, true, pDepth);
          poly([toIso(px, y0 - HX, 0), toIso(px, y0 + HX, 0), toIso(px, y0 + HX, HX), toIso(px, y0 - HX, HX)], 'REINF', true, false, pDepth);
          isoCircle(px, y0 - hq, hq, sr, 'YZ', 'REINF', pDepth, 12);
          isoCircle(px, y0 + hq, hq, sr, 'YZ', 'REINF', pDepth, 12);
        }
      }
    }
    `;

code = code.slice(0, startIdx) + newSec7 + code.slice(endIdx);

const vm = require('vm');
const sandbox = { console, Math, Number, String, Array, Object, isFinite, isNaN, parseInt, parseFloat, module: { exports: {} } };
const ctx = vm.createContext(sandbox);
vm.runInContext(code, ctx);
const Tank = sandbox.module.exports;
const opt = {
  type: 'SMC',
  material: 'SMC',
  length: [10000],
  width: [9000],
  height: [2000],
  hseg: [1000, 1000],
  padH: 525,
  padFirstW: 400,
  padOverhang: 200,
  manhole: 'roof'
};
const iso = Tank.buildIsometric(opt);
fs.writeFileSync('temp_ents.json', JSON.stringify(iso.ents));
""")

subprocess.run(['node', 'e:/tankcad/scripts/patch_sec7.js'], cwd='e:/tankcad', check=True)
with open('e:/tankcad/temp_ents.json', 'r', encoding='utf-8') as f:
    ents = json.load(f)

for f in ['scripts/patch_sec7.js', 'temp_ents.json']:
    if os.path.exists(f'e:/tankcad/{f}'):
        os.remove(f'e:/tankcad/{f}')

col = {
    'PAD': '#00bfff',
    'FRAME': '#ff9900',
    'PANEL': '#ffffff',
    'PANEL_DETAIL': '#888888',
    'REINF': '#f472b6',
    'NOZZLE': '#00ff00',
    'LADDER': '#ffff00',
    'INTERNAL': '#555555'
}

def render_plot(zoom=False):
    fig, ax = plt.subplots(figsize=(16, 12), facecolor='#0b1120')
    ax.set_facecolor('#0b1120')
    for idx, e in enumerate(ents):
        z = idx + 1
        if e.get('t') == 'poly':
            pts = e.get('pts', [])
            if e.get('fill') and len(pts) > 2:
                poly = Polygon(pts, closed=True, facecolor='#0b1120', edgecolor='none', zorder=z)
                ax.add_patch(poly)
            if e.get('stroke') is not False and len(pts) > 1:
                c = col.get(e.get('layer'), '#ffffff')
                lw = 2.2 if e.get('layer') == 'REINF' else 1.2
                poly = Polygon(pts, closed=(e.get('close') is not False), facecolor='none', edgecolor=c, linewidth=lw, zorder=z)
                ax.add_patch(poly)
        elif e.get('t') == 'line':
            a, b = e.get('a'), e.get('b')
            c = col.get(e.get('layer'), '#ffffff')
            lw = 2.2 if e.get('layer') == 'REINF' else 1.2
            ax.plot([a[0], b[0]], [a[1], b[1]], color=c, linewidth=lw, zorder=z)
        elif e.get('t') == 'circle':
            c = col.get(e.get('layer'), '#ffffff')
            center = e.get('c')
            r = e.get('r')
            circle = plt.Circle(center, r, facecolor='none', edgecolor=c, linewidth=1.8, zorder=z)
            ax.add_patch(circle)

    ax.set_aspect('equal')
    plt.axis('off')
    if zoom:
        ax.set_xlim(3500, 8500)
        ax.set_ylim(2000, 5500)
        suffix = '_zoom'
    else:
        ax.autoscale()
        suffix = ''
    fname = f'iso_reinf_bold{suffix}.png'
    out_path = f'C:/Users/jhk01/.gemini/antigravity/brain/ce3b05b0-c1eb-4c82-9c6a-a5c228224321/{fname}'
    plt.savefig(out_path, bbox_inches='tight', pad_inches=0.1, dpi=150, facecolor='#0b1120')
    plt.close()
    print(f'Rendered {fname}')

render_plot(False)
render_plot(True)
