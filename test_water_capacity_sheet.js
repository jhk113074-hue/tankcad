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
  freeboard: 300,
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
const hasBtmFlangeText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('H=75mm'));
assert(hasBtmFlangeText, 'Bottom flange callout must exist in entities');

const hasSideFittingLimitText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('EL.+100mm 이상'));
assert(hasSideFittingLimitText, 'Side fitting elevation limit callout must exist in entities');

// Verification of Top Roof Panel & Flange detail
const hasTopFlangeText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('H=70mm'));
assert(hasTopFlangeText, 'Top roof flange callout must exist in entities');

const hasRoofScheduleText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s.includes('천정 플랜지 및 판넬'));
assert(hasRoofScheduleText, 'Roof flange and panels row must exist in schedule table');

// Verification of WATER layer entities (Water Fill & Hatch)
const waterEnts = sheet1.ents.filter(e => e.layer === 'WATER');
assert(waterEnts.length > 0, `Water entities must exist on WATER layer! Found: ${waterEnts.length}`);
console.log('Water entities on WATER layer:', waterEnts.length);

// Verification of WATER-LEVEL symbol text (media_1791610199431_e1fd0094.png)
const hasWaterLevelSymbolText = sheet1.ents.some(e => e.t === 'text' && e.s && e.s === 'WATER-LEVEL');
assert(hasWaterLevelSymbolText, 'WATER-LEVEL text symbol must exist in entities');

console.log('Test 1 passed (Water visualization, symbols, flange detail verified)!');

// Test 2: Dynamic Freeboard Adjustment (opt.freeboard = 500)
const optFreeboard = {
  length: [6000],
  width: [4000],
  height: [3000],
  material: 'SMC',
  sheetKind: 'capacity',
  freeboard: 500, // 500mm freeboard
  nozzles: [
    { mark: 'N1', name: 'INLET', size: '100A', elev: 2800, use: true },
    { mark: 'N2', name: 'OUTLET', size: '100A', elev: 300, use: true },
    { mark: 'N4', name: 'DRAIN', size: '50A', elev: 0, use: true }
  ]
};

const sheetFreeboard = TankCore.buildSheet(optFreeboard, {}, {});
assert.strictEqual(sheetFreeboard.tank.hwl, 2500, 'HWL should be H - 500 = 2500 when freeboard=500');
assert.strictEqual(sheetFreeboard.tank.lwl, 300, 'LWL should be 300');
assert.strictEqual(sheetFreeboard.tank.effDepth, 2200, 'Effective depth should be 2200');
// Eff Ton = 24 * 2.2 = 52.8 Ton
assert.strictEqual(sheetFreeboard.tank.effTon, '52.8', 'Effective volume should be 52.8 Ton');
console.log('Test 2 passed (Dynamic freeboard adjustment verified)!');

// Test 3: Multi-compartment Tank (2구획: 4000+4000 x 3000 x 3000)
const opt3 = {
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

const sheet3 = TankCore.buildSheet(opt3, {}, {});
assert(sheet3, 'Multi-comp sheet should be created');
assert.strictEqual(sheet3.tank.effDepth, 2400, 'Effective depth should be 2400');
// Net area = 8m * 3m = 24 m2
// Eff Ton = 24 * 2.4 = 57.6 Ton
assert.strictEqual(sheet3.tank.effTon, '57.6', 'Effective volume should be 57.6 Ton');

const hasCompText = sheet3.ents.some(e => e.t === 'text' && e.s && (e.s.includes('1구획') || e.s.includes('2구획')));
assert(hasCompText, 'Multi-compartment text must exist');
console.log('Test 3 passed!');

// Test 4: Fallback defaults when nozzles not explicitly configured
const opt4 = {
  length: [5000],
  width: [3000],
  height: [2500],
  material: 'SMC',
  sheetKind: 'capacity'
};

const sheet4 = TankCore.buildSheet(opt4, {}, {});
assert(sheet4, 'Sheet with default nozzles should succeed');
assert(sheet4.tank.hwl > 0, 'Default HWL should be > 0');
assert(sheet4.tank.lwl > 0, 'Default LWL should be > 0');
assert(sheet4.tank.effDepth > 0, 'Default effDepth should be > 0');
assert(Number(sheet4.tank.effTon) > 0, 'Default effTon should be > 0');
console.log('Test 4 passed! Default calculations:', sheet4.tank);

console.log('ALL UNIT TESTS PASSED SUCCESSFULLY!');
