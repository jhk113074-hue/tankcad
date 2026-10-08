const assert = require('assert');
const TankCore = require('./web/tank.js');

console.log('--- Testing Water Capacity DWG Sheet (sheetKind: "capacity") ---');

// Test 1: Single Compartment Standard Tank (6000 x 4000 x 3000)
const opt1 = {
  length: [6000],
  width: [4000],
  height: [3000],
  material: 'SMC',
  sheetKind: 'capacity',
  nozzles: [
    { mark: 'N1', name: 'INLET', size: '100A', type: 'FLANGE', face: 'front', elev: 2800, use: true },
    { mark: 'N2', name: 'OUTLET', size: '100A', type: 'FLANGE', face: 'front', elev: 400, use: true },
    { mark: 'N3', name: 'OVERFLOW', size: '100A', type: 'FLANGE', face: 'right', elev: 2700, use: true },
    { mark: 'N4', name: 'DRAIN', size: '50A', type: 'SOCKET', face: 'bottom', elev: 0, use: true }
  ]
};

const sheet1 = TankCore.buildSheet(opt1, {}, {});
assert(sheet1, 'Sheet should be created');
assert(sheet1.ents.length > 50, 'Entities should be generated');
console.log('Sheet 1 entities count:', sheet1.ents.length);
console.log('Tank 1 data:', sheet1.tank);

assert.strictEqual(sheet1.tank.hwl, 2700, 'HWL should be 2700');
assert.strictEqual(sheet1.tank.lwl, 400, 'LWL should be 400');
assert.strictEqual(sheet1.tank.effDepth, 2300, 'Effective depth should be 2300');

// Net area = 6m * 4m = 24 m2
// Gross volume = 24 * 3 = 72 Ton
// Effective volume = 24 * 2.3 = 55.2 Ton
// Ratio = 55.2 / 72 * 100 = 76.7%
assert.strictEqual(sheet1.tank.activeAreaM2, 24, 'Active area should be 24 m2');
assert.strictEqual(sheet1.tank.ton, '72.0', 'Gross volume should be 72.0 Ton');
assert.strictEqual(sheet1.tank.effTon, '55.2', 'Effective volume should be 55.2 Ton');
assert.strictEqual(sheet1.tank.effRatio, '76.7', 'Effective ratio should be 76.7%');

// Check that key drawing entities exist
const hasHWLText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('HWL'));
assert(hasHWLText, 'HWL text must exist in entities');

const hasLWLText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('LWL'));
assert(hasLWLText, 'LWL text must exist in entities');

const hasEffTonText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('55.2 Ton'));
assert(hasEffTonText, 'Effective ton text must exist in entities');

const hasScheduleTable = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('정밀 산출 내역서'));
assert(hasScheduleTable, 'Capacity schedule table must exist');

// Verification of Bottom Flange & Bolt line detail
const hasBtmFlangeText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('저판 플랜지 H=75mm'));
assert(hasBtmFlangeText, 'Bottom flange callout must exist in entities');

const hasSideFittingLimitText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('EL.+100mm 이상'));
assert(hasSideFittingLimitText, 'Side fitting elevation limit callout must exist in entities');

// Verification of Monochrome CAD (NO color overrides in 2D capacity sheet)
const coloredEnts = sheet1.ents.filter(e => e.color !== undefined);
assert.strictEqual(coloredEnts.length, 0, `There must be NO color overrides in 2D capacity sheet! Found: ${coloredEnts.length}`);

// No colored solids in drawing view
const coloredSolids = sheet1.ents.filter(e => e.t === 'solid' && e.color !== undefined);
assert.strictEqual(coloredSolids.length, 0, `There must be NO colored solid fills in 2D capacity sheet! Found: ${coloredSolids.length}`);

console.log('Test 1 passed (Monochrome verified, Flange detail verified)!');

// Test 2: Multi-compartment Tank (2구획: 4000+4000 x 3000 x 3000)
const opt2 = {
  length: [4000, 4000],
  width: [3000],
  height: [3000],
  material: 'SMC',
  sheetKind: 'capacity',
  nozzles: [
    { mark: 'N1', name: 'INLET', size: '100A', elev: 2800, use: true },
    { mark: 'N2', name: 'OUTLET', size: '100A', elev: 300, use: true },
    { mark: 'N3', name: 'OVERFLOW', size: '100A', elev: 2700, use: true },
    { mark: 'N4', name: 'DRAIN', size: '50A', elev: 0, use: true }
  ]
};

const sheet2 = TankCore.buildSheet(opt2, {}, {});
assert(sheet2, 'Multi-comp sheet should be created');
assert.strictEqual(sheet2.tank.effDepth, 2400, 'Effective depth should be 2400');
// Net area = 8m * 3m = 24 m2
// Eff Ton = 24 * 2.4 = 57.6 Ton
assert.strictEqual(sheet2.tank.effTon, '57.6', 'Effective volume should be 57.6 Ton');

const hasCompText = sheet2.ents.some(e => e.t === 'text' && e.s && (e.s.includes('1구획') || e.s.includes('2구획')));
assert(hasCompText, 'Multi-compartment text must exist');
console.log('Test 2 passed!');

// Test 3: Fallback defaults when nozzles not explicitly configured
const opt3 = {
  length: [5000],
  width: [3000],
  height: [2500],
  material: 'SMC',
  sheetKind: 'capacity'
};

const sheet3 = TankCore.buildSheet(opt3, {}, {});
assert(sheet3, 'Sheet with default nozzles should succeed');
assert(sheet3.tank.hwl > 0, 'Default HWL should be > 0');
assert(sheet3.tank.lwl > 0, 'Default LWL should be > 0');
assert(sheet3.tank.effDepth > 0, 'Default effDepth should be > 0');
assert(Number(sheet3.tank.effTon) > 0, 'Default effTon should be > 0');
console.log('Test 3 passed! Default calculations:', sheet3.tank);

console.log('ALL UNIT TESTS PASSED SUCCESSFULLY!');
