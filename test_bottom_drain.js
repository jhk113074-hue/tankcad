const assert = require('assert');
const C = require('./web/tank.js');

console.log('=== TEST 1: Default Nozzle List DRAIN Face and Elevation ===');
const defaultNozs = C.getNozzleList({
  nozzles: {
    inlet: { use: true },
    drain: { use: true }
  }
});
const drainNoz = defaultNozs.find(n => n.name === 'DRAIN');
assert(drainNoz, 'DRAIN nozzle must exist in default list');
console.log('DRAIN nozzle:', drainNoz);
assert.strictEqual(drainNoz.face, 'bottom', 'DRAIN nozzle default face must be "bottom"');
assert(drainNoz.elev === 0 || drainNoz.elev === 'BOTTOM', 'DRAIN elevation should be 0 or BOTTOM');
assert(Array.isArray(drainNoz.bottomCell), 'DRAIN should have bottomCell array');
console.log('✅ Default DRAIN nozzle correctly configured for bottom floor face');

console.log('=== TEST 2: Plan View Rendering with Bottom Nozzle ===');
const plan = C.buildPlan({
  length: [4000],
  width: [3000],
  height: [1000, 1000, 1000],
  nozzles: [drainNoz]
});
assert(plan && plan.ents, 'Plan ents must exist');
const planTexts = plan.ents.filter(e => (e.t === 'text' || e.type === 'text') && ((e.s && e.s.includes('하부')) || (e.v && e.v.includes('하부'))));
assert(planTexts.length > 0, 'Plan should contain text element with (하부) tag for bottom nozzles');
console.log('✅ Plan view correctly renders bottom nozzle text:', planTexts.map(t => t.s || t.v));

console.log('=== TEST 3: Elevation View Rendering with Bottom Nozzle ===');
const elev = C.buildElevation({
  length: [4000],
  width: [3000],
  height: [1000, 1000, 1000],
  nozzles: [drainNoz]
});
assert(elev && elev.ents, 'Elevation ents must exist');
const elevBottomTexts = elev.ents.filter(e => (e.t === 'text' || e.type === 'text') && ((e.s && (e.s.includes('하부') || e.s.includes('EL.+0'))) || (e.v && (e.v.includes('하부') || e.v.includes('EL.+0')))));
assert(elevBottomTexts.length > 0, 'Elevation should render bottom nozzle callout with EL.+0 or 하부');
console.log('✅ Elevation view correctly renders bottom nozzle callout:', elevBottomTexts.map(t => t.s || t.v));

console.log('=== TEST 4: Isometric View Rendering with Bottom Nozzle ===');
const iso = C.buildIsometric({
  length: [4000],
  width: [3000],
  height: [1000, 1000, 1000],
  nozzles: [drainNoz]
});
assert(iso && iso.ents, 'Isometric ents must exist');
const isoNozEnts = iso.ents.filter(e => e.layer === 'NOZZLE' || ((e.t === 'text' || e.type === 'text') && ((e.s && e.s.includes('N4')) || (e.v && e.v.includes('N4')))));
assert(isoNozEnts.length > 0, 'Isometric should render bottom nozzle entities');
console.log('✅ Isometric view correctly renders bottom nozzle entities');

console.log('\n>>> ALL BOTTOM DRAIN TESTS PASSED SUCCESSFULLY! <<<');
