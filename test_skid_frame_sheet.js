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

// 2. Check Part List and YSACC Part Codes
const hasPartList = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('PART LIST - FRAME 125'));
assert(hasPartList, 'PART LIST - FRAME 125 must exist in Skid drawing');

const hasMainSubSpec = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.toUpperCase().includes('125X65X6'));
assert(hasMainSubSpec, 'Main channel spec 125x65x6 must exist');

const hasYSACCPartCodeA = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('WFF-0961AMZ'));
assert(hasYSACCPartCodeA, 'YSACC Part Code WFF-0961AMZ must be mapped in Part List');

const hasYSACCPartCodeMain = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('WFF-1990CLZ'));
assert(hasYSACCPartCodeMain, 'YSACC Part Code WFF-1990CLZ (주재) must be mapped in Part List');

// 3. Check Standard Hardware Callouts
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

// 5. Check Frame Cross DWG details (Concrete Pad, Anchor Bolt, Dimensions)
const hasPadLayer = sheet1.ents.some(e => e.layer === 'PAD');
assert(hasPadLayer, 'Concrete pad entities must exist in FRAME CROSS DWG');

const hasAnchorBoltCallout = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('M12 앙카볼트'));
assert(hasAnchorBoltCallout, 'M12 anchor bolt callout must exist in FRAME CROSS DWG');

const hasPadWidthDim = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('패드폭'));
assert(hasPadWidthDim, 'Pad width dimension must exist in FRAME CROSS DWG');

const hasPadHeightDim = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('패드높이'));
assert(hasPadHeightDim, 'Pad height dimension must exist in FRAME CROSS DWG');

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
const hasAnglePartList = sheet2.ents.some(e => e.t === 'text' && e.s && e.s.includes('PART LIST - FRAME 75'));
assert(hasAnglePartList, 'PART LIST - FRAME 75 must exist for 75 angle frame');
const hasEnSkidTitle = sheet2.ents.some(e => e.t === 'text' && e.s && e.s.includes('STEEL SKID DRAWING'));
assert(hasEnSkidTitle, 'English view title STEEL SKID DRAWING must exist');
const hasEnCrossTitle = sheet2.ents.some(e => e.t === 'text' && e.s && e.s.includes('FRAME CROSS DWG'));
assert(hasEnCrossTitle, 'English view title FRAME CROSS DWG must exist');

console.log('✅ ALL STEEL SKID & FOUNDATION TESTS PASSED SUCCESSFULLY!');
