/* HC_COURT_MOVE: the Keeper High Court moves to the south half of Charter Hill's Parade (D1354, settled by Vincent, Tue Nov 3,
   2026; design specs/HC_PARADE.md §3.1, specs/HIGH_CHARITY_LAYOUT.md v0.3 §3.3 and §7.6). Its front and wide steps face south
   onto Muster Road; the old corner at 8,45 is plain grass; Muster Road keeps its full nine-tile cross-section. Preview only
   (?debug=1&hccity=2, HC_CITY_V2 stays false). Runs at 320, 375 and 390; reduced motion; zero console errors; save unchanged. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const COURT = { x: 32, y: 26, box: [26, 21, 38, 25] };
const OLD = { x: 8, y: 45, box: [2, 38, 14, 44] };

function save() {
  const s = starterSave();
  Object.assign(s.settings, { follower: false, controls: 'modern', textSpeed: 'fast', tips: false });
  s.money = 20;
  Object.assign(s.flags, { 'story.side_pick_done': true, 'story.hc_invite': true, 'story.hc_arrived': true, 'story.hc_greeted': true });
  s.world = { map: 'highcharity', x: 32, y: 37, facing: 'up', respawn: 'hearthmoor' };
  return s;
}
async function boot(page) {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1&hccity=2');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
async function settle(page) { await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true); }
const where = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
async function endScene(page) {
  for (let i = 0; i < 60; i++) {
    if (!(await page.evaluate(() => !!PixelPets.scene))) return;
    await page.keyboard.press('Space'); await page.waitForTimeout(60);
  }
}

test('the Court stands on the Parade\'s south half: door 32,26 under its facade, front and wide steps facing south onto Muster Road', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(({ COURT, OLD }) => {
    const m = WORLD.hc_civic, g = m.grid, by = id => m.objs.find(o => o.id === id);
    const door = by('hc_court'), roof = m.roofs.court;
    const cells = (b, f) => { const out = []; for (let y = b[1]; y <= b[3]; y++) for (let x = b[0]; x <= b[2]; x++) out.push(f(x, y)); return out; };
    const steps = [];
    for (let x = COURT.box[0]; x <= COURT.box[2]; x++) { const o = m.objs.find(o => o.kind === 'decal' && o.x === x && o.y === COURT.box[3] + 1); steps.push(o && o.sprite); }
    return {
      door: door && { x: door.x, y: door.y, kind: door.kind, deny: door.deny, need: door.need },
      roof: roof && [roof.x0, roof.y0, roof.x1, roof.y1, roof.shape],
      // the facade sits directly above the door and the roof above that; the door's south side opens on walk tiles
      above: [g[COURT.y - 1][COURT.x], g[COURT.y - 2][COURT.x], g[COURT.y - 3][COURT.x]],
      south: [g[COURT.y][COURT.x], g[COURT.y + 1][COURT.x], g[COURT.y + 2][COURT.x]],
      box: cells(COURT.box, (x, y) => g[y][x]).join(''),
      steps, stepRows: [COURT.y, COURT.y + 1].map(y => g[y].slice(COURT.box[0], COURT.box[2] + 1)),
      sign: m.objs.filter(o => o.id === 'hc2_sign_court').map(o => [o.x, o.y, o.text]),
      oldCorner: cells(OLD.box, (x, y) => g[y][x]).join(''),
      oldObjs: m.objs.filter(o => o.x >= OLD.box[0] && o.x <= OLD.box[2] && o.y >= OLD.box[1] && o.y <= OLD.box[3] + 1).map(o => o.id),
      // Muster Road: rows 28-36, the nine-tile boulevard, across the whole chunk
      road: [28, 29, 30, 31, 32, 33, 34, 35, 36].map(y => g[y].slice(1, 63)),
      govTanks: ['hc2_tp_c1_gov_w', 'hc2_tp_c1_gov_e'].map(id => by(id) && [by(id).x, by(id).y]),
      check: PixelPets.charityCheck(),
    };
  }, { COURT, OLD });
  expect(r.door).toEqual({ x: 32, y: 26, kind: 'door', deny: 'The Court is not sitting.', need: 'story.hc_no_room' });
  expect(r.roof).toEqual([26, 21, 38, 23, 'gable']);
  expect(r.above).toEqual(['H', 'H', 'R']);
  expect(r.south).toEqual(['P', 'P', 'P']);          // top step, lower step, Muster Road's north sidewalk
  expect(r.box).toMatch(/^R{39}H{26}$/);             // 13 wide: three roof rows over two facade rows
  expect(r.stepRows).toEqual(['P'.repeat(13), 'P'.repeat(13)]);
  expect(r.steps).toEqual(['hc_court_steps_w'].concat(Array(11).fill('hc_court_steps'), ['hc_court_steps_e']));
  expect(r.sign).toEqual([[33, 26, 'KEEPER HIGH COURT.']]);
  expect(r.oldCorner).toBe('g'.repeat(13 * 7));     // the old corner is plain grass
  expect(r.oldObjs).toEqual([]);                     // nothing placed there, not even dressing
  for (const [i, row] of r.road.entries()) {
    expect(row, 'Muster Road row ' + (28 + i)).not.toMatch(/[TRHwF]/);
    if (i === 0 || i === 8) expect(row, 'sidewalk').toBe('P'.repeat(62));
    if ([2, 3, 5, 6].includes(i)) expect(row, 'carriageway').toMatch(/^[CZ]+$/);
  }
  expect(r.govTanks).toEqual([[20, 18], [43, 18]]);   // both tank posts by the Governor's House stay
  expect(r.check).toEqual([]);
});

test('an open path runs from both Muster Road mouths to the Court door, and a holder walks up the steps to its line', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('hc_civic', 32, 28, 'up'));
  await settle(page);
  // BFS on the live map with every blocker (cars, tanks, lamps, signs, people) in place
  const paths = await page.evaluate(() => {
    const W = PixelPets.mapInfo.w, H = PixelPets.mapInfo.h, goal = '32,26';
    const open = (x, y) => { const t = PixelPets.tileInfo(x, y); return t.walk && !t.blocked; };
    const bfs = start => {
      const seen = new Set([start.join(',')]), q = [start];
      while (q.length) {
        const [x, y] = q.shift();
        if (x + ',' + y === goal) return true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || !(open(nx, ny) || k === goal)) continue;
          seen.add(k); q.push([nx, ny]);
        }
      }
      return false;
    };
    const mouths = {};
    for (const o of WORLD.hc_civic.objs) if (o.kind === 'warp' && /^m_c1_[ws]_\d$/.test(o.id)) mouths[o.id] = bfs([o.x, o.y]);
    return mouths;
  });
  expect(Object.keys(paths).length).toBe(10);
  expect(Object.values(paths).every(Boolean), JSON.stringify(paths)).toBe(true);
  // walk it: sidewalk -> lower step -> top step (the door tile) -> the door
  for (const y of [27, 26]) {
    await page.evaluate(() => PixelPets.walkStep('up'));
    await expect.poll(() => where(page)).toEqual({ map: 'hc_civic', x: 32, y });
  }
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect(page.locator('#sbText')).toContainText('The Court is not sitting.');
  await endScene(page);
  expect((await where(page)).map).toBe('hc_civic');
});

test('the save is unchanged: the preview never writes it, and v stays 2', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.evaluate(() => PixelPets.goto('hc_civic', 32, 28, 'up'));
  await settle(page);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await settle(page);
  const after = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  expect(after).toBe(before);
  expect(JSON.parse(after).v).toBe(2);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the Court and its steps draw with reduced motion on; zero console errors', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await boot(page);
    await page.evaluate(() => PixelPets.goto('hc_civic', 32, 28, 'up'));
    await settle(page);
    const t = await page.evaluate(() => [PixelPets.tileInfo(32, 26).decal, PixelPets.tileInfo(26, 26).decal, PixelPets.tileInfo(38, 26).decal]);
    expect(t).toEqual(['hc_court_steps', 'hc_court_steps_w', 'hc_court_steps_e']);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  });
});
