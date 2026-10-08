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

const hasYSACCPartCodeA = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('WFF-0961AMZ') || e.s.includes('WFF-0962AMZ') || e.s.includes('WFF-0962 AMZ')));
assert(hasYSACCPartCodeA, 'YSACC Part Code WFF-0962AMZ (A타입) must exist on sub-beams');

const hasYSACCPartCodeB = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('WFF-0993AMZ') || e.s.includes('WFF-0994AMZ') || e.s.includes('WFF-0994 AMZ')));
assert(hasYSACCPartCodeB, 'YSACC Part Code WFF-0994AMZ (B타입) must exist on sub-beams');

const hasYSACCPartCodeC = sheet1.ents.some(e => e.t === 'text' && e.s && (e.s.includes('WFF-1051AMZ') || e.s.includes('WFF-1053AMZ') || e.s.includes('WFF-1053 AMZ')));
assert(hasYSACCPartCodeC, 'YSACC Part Code WFF-1053AMZ (C타입) must exist on sub-beams');

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

// 5. Check Frame Cross DWG details (No concrete pad as requested, 3-tier dimensions, Sub-beam)
const hasPadLayer = sheet1.ents.some(e => e.layer === 'PAD');
assert(!hasPadLayer, 'Concrete pad entities must be removed from FRAME CROSS DWG as requested by user');

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

console.log('✅ ALL STEEL SKID & FOUNDATION TESTS PASSED SUCCESSFULLY!');
