const assert = require('assert');
const C = require('./web/tank.js');

console.log('=== TEST 1: Irregular Tank 3D Foundation Pad Geometry ===');
{
  // 10x8m tank with top-right cut out (columns 7, 8, 9 rows 4..7 deleted)
  const removed = [];
  for (let c = 7; c < 10; c++) {
    for (let r = 4; r < 8; r++) {
      removed.push([r, c]);
    }
  }

  const opt = {
    length: [10000],
    width: [8000],
    height: [1000, 1000, 1000],
    frame: 125,
    padH: 475,
    padW1: 400,
    padW2: 300,
    removed: removed
  };

  const iso = C.buildIsometric(opt);
  assert(iso && iso.ents && iso.ents.length > 0, 'Isometric entities should be generated');

  // Check concrete strips runsForStrip
  const map = C.createMap(opt);
  const strips = C.concStrips(map.cols, opt);
  assert.strictEqual(strips.length, 11, 'Should have 11 strips (10 spans + 1)');

  const nR = map.rows.length;
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

  // Strips 0..7 must have run up to 8000
  for (let s = 0; s <= 7; s++) {
    const runs = runsForStrip(strips[s][2]);
    assert(runs.length >= 1, `Strip ${s} should have runs`);
    assert.strictEqual(runs[0][1], 8000, `Strip ${s} should reach 8000`);
  }

  // Strips 8..10 must only run up to 4000 (cut out at 4000)
  for (let s = 8; s <= 10; s++) {
    const runs = runsForStrip(strips[s][2]);
    assert(runs.length >= 1, `Strip ${s} should have runs`);
    assert.strictEqual(runs[0][1], 4000, `Strip ${s} must be stepped down and reach exactly 4000`);
  }

  // Verify isometric has PAD entities
  const padEnts = iso.ents.filter(e => e.layer === 'PAD');
  assert(padEnts.length > 50, `Isometric should have concrete pad entities (got ${padEnts.length})`);

  console.log('✅ Irregular tank 3D foundation strips correctly stepped: Strips 0-7 = full length (8000), Strips 8-10 = stepped length (4000)');
}

console.log('\n=== TEST 2: Balloon Callout Leader Lines (Clean Straight / No Internal Elbows) ===');
{
  const opt = {
    length: [3000],
    width: [2000],
    height: [1000, 1000, 1000],
    marks: { '1,1': 1, '0,0': 2 }, // manhole, vent
    ladders: { 0: { type: 'internal' }, 1: { type: 'external' } }
  };

  const plan = C.buildPlan(opt);
  assert(plan && plan.ents, 'Plan entities should exist');

  // Verify callout circles in plan ents
  const balloonCircles = plan.ents.filter(e => e.type === 'circle' && (e.layer === 'NOZZLE_TEXT' || e.layer === 'DIM_TEXT' || e.r === 200 || e.r === 220));
  console.log(`Found ${balloonCircles.length} balloon circles in plan`);

  // Direct unit test of drawBalloonCallout
  const ents = [];
  C.drawBalloonCallout(ents, [1000, 1000], null, [1500, 1500], '8', 25, 'BALLOON');

  // Assert exactly 1 leader line
  const leaders = ents.filter(e => e.t === 'line' && (e.balloonRole === 'leader' || e.balloonRole === 'shelf'));
  assert.strictEqual(leaders.length, 1, 'Straight leader should produce exactly 1 line segment');
  const l = leaders[0];
  const dToCenter = Math.hypot(l.b[0] - 1500, l.b[1] - 1500);
  const balloonR = Math.round(4.2 * 25);
  assert(Math.abs(dToCenter - balloonR) < 1.0, `Leader line must terminate cleanly at balloon circumference (got ${dToCenter}, expected ${balloonR})`);

  // Test with an elbow that happens to be inside or very close to the balloon (< balloonR + 12)
  const elbowInsideEnts = [];
  C.drawBalloonCallout(elbowInsideEnts, [1000, 1000], [1510, 1510], [1500, 1500], '9', 25, 'BALLOON');
  const elbowLeaders = elbowInsideEnts.filter(e => e.t === 'line' && (e.balloonRole === 'leader' || e.balloonRole === 'shelf'));
  assert.strictEqual(elbowLeaders.length, 1, 'Elbow near/inside balloon must collapse into direct straight line to prevent bending inside');

  console.log('✅ Balloon callouts cleanly render straight leader lines terminating at circumference, preventing internal bends');
}

console.log('\n=== TEST 3: Steel Skid Rules Auto-Selection & Settings ===');
{
  assert.strictEqual(C.getFrameForHeight(1.0), 75, '1.0m tank -> 75 Angle');
  assert.strictEqual(C.getFrameForHeight(2.0), 75, '2.0m tank -> 75 Angle');
  assert.strictEqual(C.getFrameForHeight(2.5), 75, '2.5m tank -> 75 Angle');
  assert.strictEqual(C.getFrameForHeight(3.0), 125, '3.0m tank -> 125 Channel');
  assert.strictEqual(C.getFrameForHeight(4.0), 125, '4.0m tank -> 125 Channel');
  assert.strictEqual(C.getFrameForHeight(4.5), 150, '4.5m tank -> 150 Channel');
  assert.strictEqual(C.getFrameForHeight(5.0), 150, '5.0m tank -> 150 Channel');

  // Custom rules test
  const customRules = [
    { minH: 1.0, maxH: 3.0, frame: 50 },
    { minH: 3.5, maxH: 6.0, frame: 150 }
  ];
  C.setCustomSkidRules(customRules);
  assert.strictEqual(C.getFrameForHeight(2.0), 50, 'Custom rule 2.0m -> 50');
  assert.strictEqual(C.getFrameForHeight(4.0), 150, 'Custom rule 4.0m -> 150');

  // Reset to default
  C.setCustomSkidRules(C.DEFAULT_SKID_RULES);
  assert.strictEqual(C.getFrameForHeight(3.0), 125, 'Reset back to default 3.0m -> 125 Channel');

  const summary = C.formatSkidRuleSummary();
  assert(summary.includes('75') && summary.includes('125') && summary.includes('150'), 'Summary contains all default specs');
  console.log('✅ Skid rules auto-selection and custom rules working perfectly. Summary:', summary);
}

console.log('\n>>> ALL REGRESSION & UNIT TESTS PASSED SUCCESSFULLY! <<<');
