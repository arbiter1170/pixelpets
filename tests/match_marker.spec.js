// MATCH_MARKER (D818-D824): the standing "wants a match" balloon over holders who would battle.
// "Shown" means PixelPets.bubbles().match holds the object id; positions come from bubbles().boxes (map canvas px).
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save(flags) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  Object.assign(s.flags, flags || {});
  return s;
}

async function boot(page, flags, query = '?debug=1') {
  await installSave(page.context(), save(flags), { quietDay: true });
  await gotoGame(page, query);
  if (query.includes('debug')) {
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
    await page.evaluate(() => PixelPets.showTab('walk'));
    await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
  }
}

// Put the keeper on a tile and let a few frames draw.
async function at(page, map, x, y, facing = 'up') {
  const r = await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing]);
  expect(r && r.x === x && r.y === y).toBe(true);
  await page.waitForTimeout(150);
}

const bubbles = page => page.evaluate(() => PixelPets.bubbles());
const shown = async (page, id) => (await bubbles(page)).match.includes(id);
const markOf = (page, id) => page.evaluate(i => PixelPets.matchMarks().find(m => m.id === i) || null, id);

// A walkable tile at Manhattan distance d from the holder, off its sight line (and not its own tile).
function freeTile(page, id, d) {
  return page.evaluate(([id, d]) => {
    const q = PixelPets.objPos(id), line = (PixelPets.showSight(false).find(s => s.id === id) || { line: [] }).line.map(c => c.x + ',' + c.y);
    const taken = new Set(PixelPets.debugSnapshot ? [] : []);
    const out = [];
    for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) {
      if (Math.abs(dx) + Math.abs(dy) !== d) continue;
      const x = q.x + dx, y = q.y + dy;
      if (!PixelPets.tileInfo(x, y).walk || line.includes(x + ',' + y) || taken.has(x + ',' + y)) continue;
      out.push({ x, y, s: Math.abs(dx) });
    }
    out.sort((a, b) => a.s - b.s);
    return out[0] || null;
  }, [id, d]);
}

test('T1 D820/D818: shown within 6 tiles, gone at 7, drawn as the emote_match glyph', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('route1'));
  const six = await freeTile(page, 'route1_pia', 6), seven = await freeTile(page, 'route1_pia', 7);
  expect(six).not.toBeNull();
  expect(seven).not.toBeNull();
  await at(page, 'route1', six.x, six.y);
  expect(await shown(page, 'route1_pia')).toBe(true);
  await at(page, 'route1', seven.x, seven.y);
  expect(await shown(page, 'route1_pia')).toBe(false);
  // Sample the pixels from 3 tiles away, where the balloon is on the canvas at every width (at 320 the map is 206 px tall).
  const near = await freeTile(page, 'route1_pia', 3);
  await at(page, 'route1', near.x, near.y);
  const box = (await bubbles(page)).boxes.find(b => b.match === 'route1_pia');
  expect([box.w, box.h]).toEqual([9, 12]);
  // Read the box and its pixels in one task (same frame), or the 1 px bob can move it in between.
  // The drawn pixels are GLYPH.emote_match: every k cell one colour, every y cell one lighter colour, full alpha (no fade).
  // The day/night tint is drawn over the map, so the colours are compared with each other, not with PAL.
  const same = await page.evaluate(() => {
    const b = PixelPets.bubbles().boxes.find(x => x.match === 'route1_pia');
    const d = document.querySelector('#mapCanvas').getContext('2d').getImageData(b.x, b.y, 9, 12).data, rows = GLYPH.emote_match, seen = {};
    for (let y = 0; y < 12; y++) for (let x = 0; x < 9; x++) {
      const ch = rows[y][x]; if (ch === '.') continue;
      const i = (y * 9 + x) * 4, c = d[i] + ',' + d[i + 1] + ',' + d[i + 2];
      if (d[i + 3] !== 255) return false;
      if (seen[ch] && seen[ch] !== c) return false;
      seen[ch] = c;
    }
    const sum = c => c.split(',').reduce((a, v) => a + +v, 0);
    return !!(seen.k && seen.y && sum(seen.y) > sum(seen.k));
  });
  expect(same).toBe(true);
});

test('T2 D819: a beaten holder and a hall master whose Seal is held show nothing', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('route1'));
  const t = await freeTile(page, 'route1_pia', 4);
  await at(page, 'route1', t.x, t.y);
  expect(await shown(page, 'route1_pia')).toBe(true);
  await page.evaluate(() => PixelPets.setFlag('trainer.route1_pia', true));
  await page.waitForTimeout(150);
  expect(await shown(page, 'route1_pia')).toBe(false);
  expect((await markOf(page, 'route1_pia')).holder).toBeNull();
  await page.evaluate(() => PixelPets.goto('cc_hall_in'));
  expect((await markOf(page, 'hale')).holder).toBe('hall2_hale');
  await page.evaluate(() => { const S = PixelPets.state; S.seals = Object.assign({}, S.seals, { seal_cobblecrest: true }); });
  await page.waitForTimeout(100);
  expect((await markOf(page, 'hale')).holder).toBeNull();
});

test('T3 D821: hidden while a rest is due and through the 2-step grace, back on the step sight re-arms', async ({ page }) => {
  await boot(page, { 'spotted.route1_pia': true, 'rematch.route1_pia': true });
  await page.evaluate(() => PixelPets.goto('route1'));
  const t = await freeTile(page, 'route1_pia', 4);
  await at(page, 'route1', t.x, t.y);
  await page.evaluate(() => { const S = PixelPets.state; S.party[0].hpNow = 1; S.world.restDue = true; });
  await page.waitForTimeout(150);
  expect(await shown(page, 'route1_pia')).toBe(false);
  // Heal: the rest clears itself once nobody is hurt, and sets the 2-step grace.
  await page.evaluate(() => { delete PixelPets.state.party[0].hpNow; });
  await page.waitForFunction(() => !PixelPets.state.world.restDue);
  await page.waitForTimeout(100);
  const m = await markOf(page, 'route1_pia');
  expect(m.grace).toBe(2);
  expect(await shown(page, 'route1_pia')).toBe(false);
  // Two completed steps that stay within range and off the sight line.
  for (const dir of ['left', 'right']) {
    const r = await page.evaluate(d => PixelPets.walkStep(d), dir);
    expect(r.ok).toBe(true);
  }
  await page.waitForTimeout(150);
  expect((await markOf(page, 'route1_pia')).grace).toBe(0);
  expect(await shown(page, 'route1_pia')).toBe(true);
  const sight = await page.evaluate(() => PixelPets.showSight(false).find(s => s.id === 'route1_pia'));
  expect(sight.canSpot).toBe(true);
});

test('T4 D822: the talk marker wins while the keeper faces the holder', async ({ page }) => {
  await boot(page);
  await at(page, 'route1', 9, 6, 'right');
  await page.waitForTimeout(450);
  const b = await bubbles(page);
  expect(b.match).not.toContain('route1_pia');
  expect(b.boxes.some(x => !x.match && x.w === 8 && x.h === 8)).toBe(true);
  await at(page, 'route1', 9, 6, 'left');
  expect(await shown(page, 'route1_pia')).toBe(true);
});

test('T5 D822: during the spot "!" only the bang shows, and a win clears the mark for good', async ({ page }) => {
  await boot(page);
  await at(page, 'route1', 10, 10, 'up');
  const step = await page.evaluate(() => PixelPets.walkStep('up'));
  expect(step.ok).toBe(true);
  // The spot "!" starts on the next frame; read while it is up (600 ms).
  await page.waitForFunction(() => PixelPets.bubbles().boxes.some(x => !x.match && x.w === 9 && x.h === 12), null, { timeout: 2000 });
  const during = await bubbles(page);
  expect(during.match).toEqual([]);
  expect(during.boxes.some(x => !x.match && x.w === 9 && x.h === 12)).toBe(true);
  // Pia walks up and says her line; tap through it to the match.
  for (let i = 0; i < 30 && !(await page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on))); i++) {
    await page.keyboard.press(' ');
    await page.waitForTimeout(200);
  }
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on, null, { timeout: 8000 });
  await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.winBattle(); });
  const ok = page.locator('#btOk');
  await ok.waitFor({ state: 'visible', timeout: 8000 });
  await ok.click();
  await page.waitForFunction(() => !(PixelPets.battle && PixelPets.battle.on));
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(120);
    expect(await shown(page, 'route1_pia')).toBe(false);
  }
});

test('T6 D822: hidden in a scene, a battle and with an overlay open', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('route1'));
  const t = await freeTile(page, 'route1_pia', 4);
  await at(page, 'route1', t.x, t.y);
  expect(await shown(page, 'route1_pia')).toBe(true);
  expect(await page.evaluate(() => PixelPets.runSteps([['say', 'Pia', 'Hi.']]))).toBe(true);
  await page.waitForFunction(() => !document.querySelector('#ovScene').hidden);
  await page.waitForTimeout(150);
  expect((await bubbles(page)).match).toEqual([]);
  await page.evaluate(() => PixelPets.endScene && PixelPets.endScene());
  await page.waitForFunction(() => document.querySelector('#ovScene').hidden);
  await page.waitForTimeout(150);
  expect(await shown(page, 'route1_pia')).toBe(true);
  await page.locator('#gearFloat').click();   // Settings is an overlay
  await page.waitForFunction(() => !document.querySelector('#ovSettings').hidden);
  await page.waitForTimeout(150);
  expect((await bubbles(page)).match).toEqual([]);
  await page.keyboard.press('Escape');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => PixelPets.forceTrainer('route1_tam'));
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on);
  await page.waitForTimeout(150);
  expect((await bubbles(page)).match).toEqual([]);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('T7 D823: no bob under reduced motion, still shown', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => PixelPets.goto('route1'));
    const t = await freeTile(page, 'route1_pia', 4);
    await at(page, 'route1', t.x, t.y);
    const ys = new Set();
    for (let i = 0; i < 12; i++) {
      const b = (await bubbles(page)).boxes.find(x => x.match === 'route1_pia');
      expect(b).toBeTruthy();
      ys.add(b.y);
      await page.waitForTimeout(100);
    }
    expect(ys.size).toBe(1);
  });
});

test('T7 D823: the bob takes two y values 1 px apart', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('route1'));
  const t = await freeTile(page, 'route1_pia', 4);
  await at(page, 'route1', t.x, t.y);
  const ys = new Set();
  for (let i = 0; i < 14; i++) {
    ys.add((await bubbles(page)).boxes.find(x => x.match === 'route1_pia').y);
    await page.waitForTimeout(100);
  }
  const v = [...ys].sort((a, b) => a - b);
  expect(v.length).toBe(2);
  expect(v[1] - v[0]).toBe(1);
});

test('T8 D819: walk-up holders (Rook at the gate, the Wardens, Fen, Hale, Nia)', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('hearthmoor'));
  const g = await freeTile(page, 'rook_gate', 4);
  await at(page, 'hearthmoor', g.x, g.y, 'right');
  expect(await shown(page, 'rook_gate')).toBe(true);
  await page.evaluate(() => PixelPets.setFlag('story.rival1_done', true));
  await page.waitForTimeout(150);
  expect(await shown(page, 'rook_gate')).toBe(false);
  await page.evaluate(() => PixelPets.goto('rx_f1'));
  expect((await markOf(page, 'rx_wardens')).holder).toBe('rx_wardens');
  await page.evaluate(() => PixelPets.goto('fb_hall_in'));
  expect((await markOf(page, 'fen_hall')).holder).toBe('hall1_fen');           // a save that never picked a side: trial ready
  await page.evaluate(() => PixelPets.setFlag('story.side_pick_done', true));   // picked a side, no Heights yet: trial waits
  expect((await markOf(page, 'fen_hall')).holder).toBeNull();
  await page.evaluate(() => PixelPets.setFlag('story.heights_done', true));
  expect((await markOf(page, 'fen_hall')).holder).toBe('hall1_fen');
  await page.evaluate(() => PixelPets.goto('cc_hall_in'));
  expect((await markOf(page, 'hale')).holder).toBe('hall2_hale');
  await page.evaluate(() => PixelPets.setFlag('trainer.hall2_hale', true));
  expect((await markOf(page, 'hale')).holder).toBeNull();
  await page.evaluate(() => PixelPets.goto('hc_arena_in'));
  expect((await markOf(page, 'hc_nia')).holder).toBe('hc_tourney');
  await page.evaluate(() => PixelPets.setFlag('trainer.hc_tourney', true));
  expect((await markOf(page, 'hc_nia')).holder).toBeNull();
});

test('T9 D822: the quest arrow stacks above a match balloon, never on it', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('hearthmoor'));
  const g = await freeTile(page, 'rook_gate', 4);
  await at(page, 'hearthmoor', g.x, g.y, 'right');
  const rook = await page.evaluate(() => PixelPets.objPos('rook_gate'));
  const read = () => page.evaluate(() => ({ mark: PixelPets.bubbles().boxes.find(b => b.match === 'rook_gate') || null, arrow: PixelPets.cuePass() }));
  // On Rook's tile: the arrow's 9x9 box (outline included) ends at least 2 px above the balloon, centred on it.
  await page.evaluate(([x, y]) => PixelPets.cueForce({ x, y }), [rook.x, rook.y]);
  await page.waitForTimeout(200);
  let r = await read();
  expect(r.mark).toBeTruthy();
  expect(r.arrow && r.arrow.dir).toBe('down');
  expect(r.arrow.y - 1 + 9).toBeLessThanOrEqual(r.mark.y - 2);
  expect(Math.abs((r.arrow.x + 3.5) - (r.mark.x + 4.5))).toBeLessThanOrEqual(1);
  // On the tile beside Rook: the two boxes stay 2 px apart.
  await page.evaluate(([x, y]) => PixelPets.cueForce({ x: x + 1, y }), [rook.x, rook.y]);
  await page.waitForTimeout(200);
  r = await read();
  const A = { x: r.arrow.x - 1, y: r.arrow.y - 1, w: 9, h: 9 }, M = r.mark;
  const apart = A.x + A.w + 2 <= M.x || M.x + M.w + 2 <= A.x || A.y + A.h + 2 <= M.y || M.y + M.h + 2 <= A.y;
  expect(apart).toBe(true);
  // With no balloon on the tile, the arrow sits where main draws it: tile top - 12 (balloon top + 3, give or take the bobs).
  await page.evaluate(([x, y]) => PixelPets.cueForce({ x: x - 2, y }), [rook.x, rook.y]);
  await page.waitForTimeout(200);
  r = await read();
  expect(Math.abs(r.arrow.y - (r.mark.y + 3))).toBeLessThanOrEqual(2);
  await page.evaluate(() => PixelPets.cueForce(null));
});

test('T10 all: save unchanged, debug hooks inert without ?debug=1, 24 holders in data, quests check clean', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.setFlag('story.tutorial_done', true));   // already true: just writes the save
  const before = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return { v: s.v, keys: Object.keys(s).sort() }; });
  await page.evaluate(() => PixelPets.goto('route1'));
  const t = await freeTile(page, 'route1_pia', 4);
  await at(page, 'route1', t.x, t.y);
  expect(await shown(page, 'route1_pia')).toBe(true);
  await page.evaluate(() => PixelPets.setFlag('story.tutorial_done', true));
  const after = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return { v: s.v, keys: Object.keys(s).sort(), flags: Object.keys(s.flags).filter(k => /match/i.test(k)) }; });
  expect(after.v).toBe(2);
  expect(after.keys).toEqual(before.keys);
  expect(after.flags).toEqual([]);
  expect(await page.evaluate(() => (window.PPQuests && PPQuests.devCheck) ? PPQuests.devCheck() : []))
    .toEqual([]);
  // 24 kind:'trainer' objects across the map data (MATCH_MARKER section 4).
  let n = 0;
  for (const f of fs.readdirSync(path.join(__dirname, '..', 'data')).filter(f => f.endsWith('.json'))) {
    const walk = v => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') { if (v.kind === 'trainer') n++; Object.values(v).forEach(walk); } };
    walk(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8')));
  }
  expect(n).toBe(24);
  // Without debug (?debug=0 turns this tab's debug session off) the debug reads are inert.
  await page.goto('/?debug=0');
  await page.waitForFunction(() => window.PixelPets);
  expect(await page.evaluate(() => typeof PixelPets.matchMarks === 'function' ? PixelPets.matchMarks() : undefined)).toBeUndefined();
});
