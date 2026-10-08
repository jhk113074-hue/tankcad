const assert = require('assert');
const TankCore = require('./web/tank.js');

console.log('--- Testing Steel Skid & Foundation DWG Sheet (sheetKind: "frame") ---');

// Test 1: 10m x 8m x 3m Tank with 125 Channel (matching Steel Skid.dwg / media_1791447293957.png)
const opt1 = {
  length: [10000],
  width: [8000],
  height: [3000],
  material: 'SMC',
  frame: 125,
  sheetKind: 'frame',
  userScale: 50,
  lang: 'ko'
};

const sheet1 = TankCore.buildSheet(opt1, {}, {});
assert(sheet1, 'Sheet should be created');
assert(sheet1.ents && sheet1.ents.length > 50, 'Entities should be generated');
console.log('Sheet 1 entities count:', sheet1.ents.length);

// 1. Check View Titles
const hasSkidTitle = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('스틸 스키드') || e.s.includes('STEEL SKID')));
assert(hasSkidTitle, 'Left view title bubble (STEEL SKID DRAWING) must exist');

const hasCrossTitle = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('프레임 단면') || e.s.includes('FRAME CROSS')));
assert(hasCrossTitle, 'Right view title bubble (FRAME CROSS DWG) must exist');

// 2. Check Member Specifications and YSACC Part Codes
const hasMemberSpecs = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('MEMBER SPECIFICATIONS - FRAME 125'));
assert(hasMemberSpecs, 'MEMBER SPECIFICATIONS - FRAME 125 must exist in Skid drawing');

const hasMainSubSpec = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.toUpperCase().includes('125X65X6'));
assert(hasMainSubSpec, 'Main channel spec 125x65x6 must exist');

const hasYSACCPartCodeA = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('WFB-0962AMZ') || e.s.includes('WFF-0962AMZ') || e.s.includes('WFF-0962 AMZ')));
assert(hasYSACCPartCodeA, 'YSACC Part Code WFB-0962AMZ (A타입) must exist on sub-beams');

const hasYSACCPartCodeB = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('WFB-0994AMZ') || e.s.includes('WFF-0994AMZ') || e.s.includes('WFF-0994 AMZ')));
assert(hasYSACCPartCodeB, 'YSACC Part Code WFB-0994AMZ (B타입) must exist on sub-beams');

const hasYSACCPartCodeC = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('WFB-1053AMZ') || e.s.includes('WFF-1053AMZ') || e.s.includes('WFF-1053 AMZ')));
assert(hasYSACCPartCodeC, 'YSACC Part Code WFB-1053AMZ (C타입) must exist on sub-beams');

// 3. Check Standard Hardware Callouts & Real CAD Details
const hasCornerBrackets = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('WBR-7575Z & WBR-0160Z'));
assert(hasCornerBrackets, 'WBR-7575Z & WBR-0160Z corner bracket callout must exist');

const hasAnchorClamps = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('WBR-5010Z'));
assert(hasAnchorClamps, 'WBR-5010Z skid clamp callout must exist');

// 4. Check Fabrication NOTE block
const hasNoteHeader = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('< N O T E >'));
assert(hasNoteHeader, 'NOTE header must exist');

const hasGalvNote = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('SS41') && e.s.includes('용융아연도금'));
assert(hasGalvNote, 'Hot-dip galvanized SS41 note must exist');

const hasToleranceNote = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('±1mm'));
assert(hasToleranceNote, 'Tolerance ±1mm note must exist');

// 5. Check Concrete Pad on Skid Drawing and removed from Frame Cross DWG
const crossRes1 = TankCore.buildSkidCross(opt1);
const hasCrossPad = crossRes1.ents.some(e => e.layer === 'PAD');
assert(!hasCrossPad, 'Concrete pad entities must be removed from FRAME CROSS DWG as requested by user');

const skidRes1 = TankCore.buildSkid(opt1);
const hasSkidPad = skidRes1.ents.some(e => e.layer === 'PAD');
assert(hasSkidPad, 'Concrete pad entities must exist in STEEL SKID DRAWING as requested by user');

const hasOverhangDim = sheet1.ents.some(e => e.t === 'text' && e.s === '60');
assert(hasOverhangDim, '60mm overhang dimension must exist in drawings');

const hasTotalSkidDim = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s === '8120' || e.s === '10120' || e.s === '4120' || e.s === '9120'));
assert(hasTotalSkidDim, 'Overall skid dimension must exist in drawings');

const hasCrossSubBeam = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('[-75x40x5T') || e.s.includes('AMZ')));
assert(hasCrossSubBeam, 'Cross-section horizontal sub-beam must exist in FRAME CROSS DWG');

// 6. Test 2: 75 Angle Frame tank (e.g. 4000 x 3000 x 2000)
const opt2 = {
  length: [4000],
  width: [3000],
  height: [2000],
  material: 'SMC',
  frame: 75,
  sheetKind: 'frame',
  lang: 'en'
};

const sheet2 = TankCore.buildSheet(opt2, {}, {});
assert(sheet2, 'Sheet 2 should be created');
const hasAngleSpecs = sheet2.ents.some(e => e.t === 'text' && e.s && e.s.includes('MEMBER SPECIFICATIONS - FRAME 75'));
assert(hasAngleSpecs, 'MEMBER SPECIFICATIONS - FRAME 75 must exist for 75 angle frame');
const hasEnSkidTitle = sheet2.ents.some(e => e.t === 'text' && e.s && e.s.includes('STEEL SKID DRAWING'));
assert(hasEnSkidTitle, 'English view title STEEL SKID DRAWING must exist');
const hasEnCrossTitle = sheet2.ents.some(e => e.t === 'text' && e.s && e.s.includes('FRAME CROSS DWG'));
assert(hasEnCrossTitle, 'English view title FRAME CROSS DWG must exist');

// 6-1. Check W-direction catalog members for Frame 125, 75, 150
// 6-1. Check W-direction catalog members for Frame 125, 75, 150
console.log('--- Testing W-direction Catalog Standard Members (ASZL/ASZR/CSZL/CSZR/ASZ/CSZ) ---');
// Sheet 1 (Frame 125, W=8000 - even 2000 multiple -> 2060ASZL, 2000ASZ, 2060ASZR)
const has2060ASZL = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('2060ASZL'));
assert(has2060ASZL, 'Sheet 1 (Frame 125, W=8000) must have 2060ASZL at start of W-direction main beam');
const has2000ASZ = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('2000ASZ'));
assert(has2000ASZ, 'Sheet 1 (Frame 125, W=8000) must have 2000ASZ in middle of W-direction main beam');
const has2060ASZR = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('2060ASZR'));
assert(has2060ASZR, 'Sheet 1 (Frame 125, W=8000) must have 2060ASZR at end of W-direction main beam');

// Test 125 frame with W=7000 (odd 1000 multiple -> 1560ASZL, 2000ASZ, 1560ASZR)
const opt1_7000 = { length: [6000], width: [7000], height: [3000], frame: 125, sheetKind: 'frame' };
const skid1_7000 = TankCore.buildSkid(opt1_7000);
const leftBot = skid1_7000.ents.find(e => e.t === 'text' && e.p && e.p[0] < 500 && e.p[1] < 2000 && e.s && e.s.includes('1560'));
const leftTop = skid1_7000.ents.find(e => e.t === 'text' && e.p && e.p[0] < 500 && e.p[1] > 5000 && e.s && e.s.includes('1560'));
const rightBot = skid1_7000.ents.find(e => e.t === 'text' && e.p && e.p[0] > 5500 && e.p[1] < 2000 && e.s && e.s.includes('1560'));
const rightTop = skid1_7000.ents.find(e => e.t === 'text' && e.p && e.p[0] > 5500 && e.p[1] > 5000 && e.s && e.s.includes('1560'));

assert(leftBot && leftBot.s.includes('1560ASZL'), 'Left side start must be 1560ASZL');
assert(leftTop && leftTop.s.includes('1560ASZR'), 'Left side end must be 1560ASZR');
assert(rightBot && rightBot.s.includes('1560ASZR'), 'Right side start must be 1560ASZR');
assert(rightTop && rightTop.s.includes('1560ASZL'), 'Right side end must be 1560ASZL');

// Sheet 2 (Frame 75, W=3000 -> 2000 + 1000 partition with 2070ASZL and new 1070ASZR)
const has2070_3000 = sheet2.ents.some(e => e.t === 'text' && e.s && e.s.includes('2070ASZL'));
assert(has2070_3000, 'Sheet 2 (Frame 75, W=3000) must have 2070ASZL for 2000mm span');
const has1070_3000 = sheet2.ents.some(e => e.t === 'text' && e.s && e.s.includes('1070ASZR'));
assert(has1070_3000, 'Sheet 2 (Frame 75, W=3000) must have new part 1070ASZR for 1000mm span');

// Test 75 frame with W=6000 (even 2000 multiple -> 2070ASZL, 2000ASZ, 2070ASZR)
const opt2_6000 = { length: [4000], width: [6000], height: [2000], frame: 75, sheetKind: 'frame' };
const sheet2_6000 = TankCore.buildSheet(opt2_6000, {}, {});
const has2070ASZL = sheet2_6000.ents.some(e => e.t === 'text' && e.s && e.s.includes('2070ASZL'));
assert(has2070ASZL, 'Frame 75, W=6000 must have 2070ASZL at start of W-direction main beam');
const has2070ASZR = sheet2_6000.ents.some(e => e.t === 'text' && e.s && e.s.includes('2070ASZR'));
assert(has2070ASZR, 'Frame 75, W=6000 must have 2070ASZR at end of W-direction main beam');

// Frame 150 with W=7000 (odd 1000 multiple -> 1570CSZL, 2000CSZ, 1570CSZR)
const opt150 = { length: [6000], width: [7000], height: [4000], frame: 150, sheetKind: 'frame' };
const sheet150 = TankCore.buildSheet(opt150, {}, {});
const has1570CSZL = sheet150.ents.some(e => e.t === 'text' && e.s && e.s.includes('1570CSZL'));
assert(has1570CSZL, 'Frame 150, W=7000 must have 1570CSZL at start of W-direction main beam');
const has2000CSZ = sheet150.ents.some(e => e.t === 'text' && e.s && e.s.includes('2000CSZ'));
assert(has2000CSZ, 'Frame 150, W=7000 must have 2000CSZ in middle of W-direction main beam');
const has1570CSZR = sheet150.ents.some(e => e.t === 'text' && e.s && e.s.includes('1570CSZR'));
assert(has1570CSZR, 'Frame 150, W=7000 must have 1570CSZR at end of W-direction main beam');

// Frame 150 with W=6000 (even 2000 multiple -> 2070CSZL, 2000CSZ, 2070CSZR)
const opt150_6000 = { length: [6000], width: [6000], height: [4000], frame: 150, sheetKind: 'frame' };
const sheet150_6000 = TankCore.buildSheet(opt150_6000, {}, {});
const has2070CSZL = sheet150_6000.ents.some(e => e.t === 'text' && e.s && e.s.includes('2070CSZL'));
assert(has2070CSZL, 'Frame 150, W=6000 must have 2070CSZL at start of W-direction main beam');
const has2070CSZR = sheet150_6000.ents.some(e => e.t === 'text' && e.s && e.s.includes('2070CSZR'));
assert(has2070CSZR, 'Frame 150, W=6000 must have 2070CSZR at end of W-direction main beam');

// Verify computeMainBeamSpans
const spans7000 = TankCore.computeMainBeamSpans(7000);
assert.deepStrictEqual(spans7000.map(s => s.span), [1500, 2000, 2000, 1500], '7000mm width should partition into [1500, 2000, 2000, 1500]');
const spans8000 = TankCore.computeMainBeamSpans(8000);
assert.deepStrictEqual(spans8000.map(s => s.span), [2000, 2000, 2000, 2000], '8000mm width should partition into [2000, 2000, 2000, 2000]');
const spans2000 = TankCore.computeMainBeamSpans(2000);
assert.deepStrictEqual(spans2000, [{ span: 2000, type: 'single' }], '2000mm width should be single piece');

// 6-2. Verify hardware leader callouts removed from skid frame layout
const hasOldLeader = skidRes1.ents.some(e => e.t === 'text' && (e.s === 'WBR-5010Z' || e.s === 'WBR-0120Z' || e.s === 'WBR-9021CZ') && e.p && e.p[0] < -200);
assert(!hasOldLeader, 'Old hardware leader balloons must be removed from the frame layout');

// 7. Test 3: Skid Component Fabrication Sheet (sheetKind: 'skid_parts')
console.log('--- Testing Skid Parts Fabrication DWG Sheet (sheetKind: "skid_parts") ---');
const opt3 = {
  length: [10000],
  width: [8000],
  height: [3000],
  frame: 125,
  sheetKind: 'skid_parts',
  userScale: 50,
  lang: 'ko'
};

const sheet3 = TankCore.buildSheet(opt3, {}, {});
assert(sheet3, 'Sheet 3 (skid_parts) should be created');
assert(sheet3.ents && sheet3.ents.length > 200, 'Skid parts sheet should have > 200 entities');
console.log('Sheet 3 entities count:', sheet3.ents.length);

const hasTypeATitle = sheet3.ents.some(e => e.t === 'text' && e.s && e.s.includes('A타입 제작도'));
assert(hasTypeATitle, 'Type A fabrication drawing title must exist');

const hasTypeBTitle = sheet3.ents.some(e => e.t === 'text' && e.s && e.s.includes('B타입 제작도'));
assert(hasTypeBTitle, 'Type B fabrication drawing title must exist');

const hasTypeCTitle = sheet3.ents.some(e => e.t === 'text' && e.s && e.s.includes('C타입 제작도'));
assert(hasTypeCTitle, 'Type C fabrication drawing title must exist');

const hasMainBeamTitle = sheet3.ents.some(e => e.t === 'text' && e.s && (e.s.includes('주재') || e.s.includes('ㄷ-125')));
assert(hasMainBeamTitle, 'Main beam fabrication drawing title must exist');

// 8. Test 4: Irregular / L-shaped Skid Frame with removed cells
console.log('--- Testing Irregular / L-shaped Skid Frame with removed cells ---');
const opt4 = {
  length: [10000],
  width: [8000],
  height: [4000],
  frame: 150,
  removed: [[0, 5], [1, 5], [2, 5]],
  sheetKind: 'frame'
};
const sheet4 = TankCore.buildSheet(opt4, {}, {});
assert(sheet4 && sheet4.ents.length > 500, 'Sheet 4 (irregular skid) should be created without crashing');
console.log('Sheet 4 entities count:', sheet4.ents.length);

// 8-1. Test L-shaped 4000x4000 tank matching user screenshot (media_1791461996268_1951140e.png)
const optL = {
  length: [4000],
  width: [4000],
  height: [3000],
  frame: 125,
  removed: [[2, 2], [2, 3], [3, 2], [3, 3]],
  sheetKind: 'frame'
};
const concL = TankCore.buildConcrete(optL);
const skidL = TankCore.buildSkid(optL);

// Verify concrete pad geometry matches buildConcrete 100%
const concLBoxes = concL.ents.filter(e => e.t === 'insert' && e.layer === 'PAD').map(e => ({
  x0: e.p[0],
  x1: e.p[0] + e.w,
  y0: e.p[1],
  y1: e.p[1] + e.h
})).sort((a, b) => a.x0 - b.x0);

const skidLPadLines = skidL.ents.filter(e => e.layer === 'PAD' && e.t === 'line');
const vLinesL = skidLPadLines.filter(l => l.a[0] === l.b[0]);
const skidLBoxes = [];
const stripsL = TankCore.concStrips(TankCore.createMap(optL).cols, optL);
stripsL.forEach(([x, w, idx]) => {
  const linesAtX = vLinesL.filter(l => Math.abs(l.a[0] - x) < 1e-3);
  linesAtX.forEach(l => {
    const yMin = Math.min(l.a[1], l.b[1]);
    const yMax = Math.max(l.a[1], l.b[1]);
    skidLBoxes.push({ x0: x, x1: x + w, y0: yMin, y1: yMax });
  });
});
skidLBoxes.sort((a, b) => a.x0 - b.x0);

assert.strictEqual(concLBoxes.length, skidLBoxes.length, 'Pad strip count must match buildConcrete');
for (let i = 0; i < concLBoxes.length; i++) {
  assert.deepStrictEqual(skidLBoxes[i], concLBoxes[i], `Skid pad strip ${i} must match buildConcrete pad strip ${i} exactly`);
}
// Strip 3 and Strip 4 must terminate at Y = 2200 (not extending to Y = 4200)
assert.strictEqual(skidLBoxes[3].y1, 2200, 'Strip 3 must terminate at Y=2200');
assert.strictEqual(skidLBoxes[4].y1, 2200, 'Strip 4 must terminate at Y=2200 (not full length)');

// Verify no horizontal beams in removed cell area (X > 2005, Y > 2100)
const wrongHBeams = skidL.ents.filter(e => (e.layer === 'FRAME' || e.layer.startsWith('FRAME_')) && e.t === 'line' && e.a[0] > 2005 && e.a[1] > 2100 && e.b[0] > 2005 && e.b[1] > 2100);
assert.strictEqual(wrongHBeams.length, 0, 'No horizontal beams should exist in removed tank cells');

// Verify top-outer edge beam exists at Y=2000 step
const stepBeam = skidL.ents.find(e => (e.layer === 'FRAME' || e.layer.startsWith('FRAME_')) && e.t === 'line' && Math.abs(e.a[1] - 2060) < 1e-3 && Math.abs(e.b[1] - 2060) < 1e-3);
assert(stepBeam, 'Top-outer edge beam must exist at step Y=2000');

// Verify distinct layers & matching text layers for W-direction, L-direction, and Sub-beams
const hasMainWBeam = skidL.ents.some(e => e.layer === 'FRAME_MAIN_W' && e.t === 'line');
assert(hasMainWBeam, 'W-direction main beams must have layer FRAME_MAIN_W');
const hasMainWText = skidL.ents.some(e => e.layer === 'FRAME_MAIN_W' && e.t === 'text' && e.s && e.s.includes('WFF-'));
assert(hasMainWText, 'W-direction part names must have layer FRAME_MAIN_W');

const hasMainLBeam = skidL.ents.some(e => e.layer === 'FRAME_MAIN_L' && e.t === 'line');
assert(hasMainLBeam, 'L-direction main beams must have layer FRAME_MAIN_L');
const hasMainLText = skidL.ents.some(e => e.layer === 'FRAME_MAIN_L' && e.t === 'text' && e.s && e.s.includes('WFF-'));
assert(hasMainLText, 'L-direction part names must have layer FRAME_MAIN_L');

const hasSubBeamText = skidL.ents.some(e => e.layer === 'FRAME_SUB' && e.t === 'text' && e.s && e.s.includes('WFB-'));
assert(hasSubBeamText, 'Sub-beam part names must have layer FRAME_SUB');

// 9. Test 5: 500mm Panel combination -> 1.5M member (1490CLZ / 1490ALZ / 1490HCLZ)
console.log('--- Testing 500mm Panel Combination with 1.5M Members (1490CLZ / 1490ALZ / 1490HCLZ) ---');
const opt5_125 = { length: [5500], width: [4000], height: [3000], frame: 125, sheetKind: 'frame' };
const sheet5_125 = TankCore.buildSheet(opt5_125, {}, {});
const has1490CLZ = sheet5_125.ents.some(e => e.t === 'text' && e.s && e.s.includes('1490CLZ'));
assert(has1490CLZ, 'Must have 1490CLZ for 500mm panel combination with 125 frame');

const opt5_75 = { length: [5500], width: [4000], height: [2000], frame: 75, sheetKind: 'frame' };
const sheet5_75 = TankCore.buildSheet(opt5_75, {}, {});
const has1490ALZ = sheet5_75.ents.some(e => e.t === 'text' && e.s && e.s.includes('1490ALZ'));
assert(has1490ALZ, 'Must have 1490ALZ for 500mm panel combination with 75 angle frame');

const opt5_150 = { length: [5500], width: [4000], height: [5000], frame: 150, sheetKind: 'frame' };
const sheet5_150 = TankCore.buildSheet(opt5_150, {}, {});
const has1490HCLZ = sheet5_150.ents.some(e => e.t === 'text' && e.s && e.s.includes('1490HCLZ'));
assert(has1490HCLZ, 'Must have 1490HCLZ for 500mm panel combination with 150 channel frame');

// 10. Test 6: Verify 3D Isometric View (View 3) and Perimeter-Only W-direction Main Beams
console.log('--- Testing 3D Isometric View and Perimeter-Only W-direction Main Beams ---');
const hasIsoTitle = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('등각조감도') || e.s.includes('3D ISOMETRIC')));
assert(hasIsoTitle, 'Sheet 1 must have 3D ISOMETRIC VIEW (View 3) title bubble');

// Verify W-direction main beams (FRAME_MAIN_W) exist ONLY at perimeter (first and last columns)
const midWBeams = skidRes1.ents.filter(e => e.layer === 'FRAME_MAIN_W' && e.t === 'line' && e.a[0] > 500 && e.a[0] < 9500);
assert.strictEqual(midWBeams.length, 0, 'W-direction main beams must NOT exist in the middle columns (perimeter only)');

const midWTexts = skidRes1.ents.filter(e => e.layer === 'FRAME_MAIN_W' && e.t === 'text' && e.p[1] >= 0 && e.p[0] > 500 && e.p[0] < 9500);
assert.strictEqual(midWTexts.length, 0, 'W-direction part names must NOT exist in the middle columns');

// Verify intermediate columns have sub-beams (FRAME_SUB)
const midSubBeams = skidRes1.ents.filter(e => e.layer === 'FRAME_SUB' && e.t === 'line' && e.a[0] > 500 && e.a[0] < 9500);
assert(midSubBeams.length > 0, 'Intermediate columns must have sub-beams (FRAME_SUB)');

// 11. Test 7: Irregular 4000x4000 Tank with removed cell [3, 3] (user screenshot media_1791464487226_3d0f4500.png)
console.log('--- Testing User Case: 4000x4000 Tank with removed [3, 3] (1990 beam & new 1070ASZL) ---');
const optUser = {
  length: [4000],
  width: [4000],
  height: [3000],
  frame: 75,
  removed: [[3, 3]],
  sheetKind: 'frame'
};
const skidUser = TankCore.buildSkid(optUser);
// Check horizontal beam at Y=3000 across Col 2..3 has 1990ALZ (not 0990ALZ)
const hBeamCol23 = skidUser.ents.find(e => e.layer === 'FRAME_MAIN_L' && e.t === 'text' && e.p && e.p[0] > 2000 && e.p[0] < 4000 && Math.abs(e.p[1] - 3000) < 50);
assert(hBeamCol23, 'Horizontal beam at Y=3000 across Col 2..3 must exist');
assert.strictEqual(hBeamCol23.s, 'WFF-1990ALZ', 'Horizontal beam at Y=3000 across Col 2..3 must be WFF-1990ALZ (not 0990)');

// Check Column 3 (W=3000) has bottom 2070ASZR and top new part 1070ASZL
const col3Top = skidUser.ents.find(e => e.layer === 'FRAME_MAIN_W' && e.t === 'text' && e.p && e.p[0] > 3900 && e.p[1] > 2000);
assert(col3Top, 'Column 3 top W-direction part must exist');
assert.strictEqual(col3Top.s, 'WFF-1070ASZL', 'Column 3 top W-direction part must be new part WFF-1070ASZL (replacing 1570ASZL)');

const col3Bot = skidUser.ents.find(e => e.layer === 'FRAME_MAIN_W' && e.t === 'text' && e.p && e.p[0] > 3900 && e.p[1] < 2000);
assert(col3Bot, 'Column 3 bottom W-direction part must exist');
assert.strictEqual(col3Bot.s, 'WFF-2070ASZR', 'Column 3 bottom W-direction part must be WFF-2070ASZR');

console.log('✅ ALL STEEL SKID & FOUNDATION TESTS PASSED SUCCESSFULLY!');


