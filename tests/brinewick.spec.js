/* BRINEWICK v0.1 (one-pager defaults B1-B14): the harbour south of Route 3, the Glimmerwell depot and the Faded Drizzlet (D165),
   Dorian Pell's first battle, Trial Hall #3 (Master Marisol, TIDE, Seal 3) and the Episode 1 card. Both sides. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const ROAD = {
  'story.seal1': true, 'story.seal2': true, 'story.cobble_end': true, 'story.reached_cobblecrest': true, 'story.rc_done': true,
  'story.route3_open': true, 'story.reached_route3': true,
};
const KEEPERS = Object.assign({}, ROAD, { 'story.hc_council_done': true, 'story.rook_end': 'ally', 'story.rook_quit': 'r5' });
const GLIMMER = Object.assign({}, ROAD, {
  'story.side': 'glimmer', 'story.side_pick_done': true, 'story.rook_end': 'stays', 'story.gb_invited': true, 'story.gb_relay_done': true,
  'story.gb_hollis': true, 'story.gb_done': true,
});

function save(flags, world, seals) {
  const s = starterSave();
  s.settings.follower = false;
  s.party[0].stage = 1; s.party[0].bx = 4 * 27 * 27;
  Object.assign(s.flags, flags);
  s.seals = seals || { seal_fernbrook: 1, seal_cobblecrest: 1 };
  s.money = 200;
  s.world = Object.assign({ map: 'brinewick', x: 10, y: 3, facing: 'down', respawn: 'cobblecrest' }, world || {});
  return s;
}
async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
const here = page => page.evaluate(() => ({ map: PixelPets.mapInfo.id, x: PixelPets.state.world.x, y: PixelPets.state.world.y }));
const settled = (page, id) => page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, id);
const flag = (page, f) => page.evaluate(k => PixelPets.state.flags[k], f);

// Plays the open scene (and any battle it opens) to its end. `wild` befriends a scene encounter; trainers are won.
async function run(page, choices = []) {
  const left = choices.slice(), says = [];
  let won = false;
  for (let i = 0; i < 400; i++) {
    const st = await page.evaluate(() => {
      const s = window.PixelPets.scene, b = window.PixelPets.battle;
      return { scene: !!s, mode: s && s.mode, full: s && s.full, waiting: s && s.waiting, text: s && s.text,
        battle: !!(b && b.on), panel: b && b.panel, kind: b && b.kind };
    });
    if (!st.scene && !st.battle) return says;
    if (await page.locator('#btOk').isVisible().catch(() => false)) { await page.locator('#btOk').click(); await page.waitForTimeout(30); continue; }
    if (st.battle) {
      if (!won) {
        if (st.panel !== 'acts' && st.panel !== 'end') {
          if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click();
          await page.waitForTimeout(30); continue;
        }
        await page.evaluate(k => { PixelPets.battle.textMs = 0; if (k === 'wild') PixelPets.forceBefriend(); else PixelPets.winBattle(); }, st.kind);
        won = true; await page.waitForTimeout(40); continue;
      }
      if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click();
      await page.waitForTimeout(30); continue;
    }
    won = false;
    if (st.mode === 'choice' && st.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      const label = left.shift();
      if (!label) throw new Error('choice "' + st.text + '" but the test had no answer left');
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(30); continue;
    }
    if (st.mode === 'say' && st.waiting) {
      if (!says.length || says[says.length - 1] !== st.text) says.push(st.text);
      await page.keyboard.press('Space'); await page.waitForTimeout(25); continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('scene did not finish');
}
async function talk(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing]);
  await settled(page, map);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !!PixelPets.scene || (PixelPets.battle && PixelPets.battle.on));
}
async function step(page, map, x, y, facing, key) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing]);
  await settled(page, map);
  await page.waitForTimeout(200);
  await page.keyboard.press(key);
}

test('Route 3 leads into Brinewick, Rook meets you on the north road, and the road leads back', async ({ page }) => {
  await boot(page, save(KEEPERS, { map: 'route3', x: 11, y: 45, facing: 'down' }));
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('route3');
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => here(page).then(h => h.y)).toBe(46);
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowDown');
  await settled(page, 'brinewick');
  expect(await here(page)).toEqual({ map: 'brinewick', x: 10, y: 1 });
  expect(await flag(page, 'story.reached_brinewick')).toBe(true);
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowDown');                       // onto Rook's tile trigger
  await page.waitForFunction(() => !!PixelPets.scene);
  const says = await run(page);
  expect(says.some(t => t.includes('white shed on the east pier'))).toBe(true);   // Keepers Rook quit at R5
  expect(await flag(page, 'story.brine_arrived')).toBe(true);
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('brine_depot');
  await shot(page, 'brinewick-arrive');
  await step(page, 'brinewick', 10, 1, 'up', 'ArrowUp');
  await settled(page, 'route3');
  expect(await here(page)).toMatchObject({ map: 'route3', x: 11, y: 46 });
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('Keepers: open the crate, befriend the Drizzlet, beat Dorian, earn the Brinewick Seal, then the Episode 1 card', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, save(Object.assign({}, KEEPERS, { 'story.reached_brinewick': true, 'story.brine_arrived': true }), { map: 'brinewick', x: 24, y: 12, facing: 'up' }));
  // The Hall stays shut until Dorian is beaten.
  await step(page, 'brinewick', 5, 12, 'up', 'ArrowUp');
  await page.waitForTimeout(400);
  expect((await here(page)).map).toBe('brinewick');
  for (let i = 0; i < 6 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(120); }
  await page.waitForFunction(() => !PixelPets.scene);

  await step(page, 'brinewick', 24, 11, 'up', 'ArrowUp');       // the depot door
  await settled(page, 'bw_depot_in');
  expect(await flag(page, 'story.brine_depot')).toBe(true);
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('brine_crate');
  await shot(page, 'brinewick-depot');
  await talk(page, 'bw_depot_in', 9, 3, 'up');                   // the Glimmer Cell crate
  await run(page, ['Open it']);
  expect(await flag(page, 'story.brine_freed')).toBe(true);
  expect(await flag(page, 'story.brine_drizzlet')).toBe(true);
  expect(await page.evaluate(() => PixelPets.state.party.concat(PixelPets.state.box).some(p => p.species === 'tide' && p.stage === 0))).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'bw_cell_open'))).toBe(true);
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('brine_dorian');

  await step(page, 'brinewick', 24, 13, 'up', 'ArrowUp');       // Dorian waits on the quay
  await page.waitForFunction(() => !!PixelPets.scene);
  await run(page);
  expect(await flag(page, 'story.brine_dorian')).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'dorian_bw'))).toBe(false);
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('hall3');

  await step(page, 'brinewick', 5, 12, 'up', 'ArrowUp');        // the Hall door opens now
  await settled(page, 'bw_hall_in');
  await shot(page, 'brinewick-hall');
  await talk(page, 'bw_hall_in', 5, 3, 'up');
  await run(page, ['Begin trial']);
  expect(await flag(page, 'story.seal3')).toBe(true);
  expect(await page.evaluate(() => !!PixelPets.state.seals.seal_brinewick)).toBe(true);
  expect(await page.evaluate(() => capLevelFor(PPStanding.chapterOf(PixelPets.state.flags)))).toBe(38);
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('ep1_end');

  await step(page, 'brinewick', 5, 12, 'down', 'ArrowDown');     // Rook waits outside the Hall
  await page.waitForFunction(() => !!PixelPets.scene);
  const says = await run(page);
  expect(says).toContain('EPISODE 1 COMPLETE · Thank you for playing Walklings!');
  expect(await flag(page, 'story.ep1_end')).toBe(true);
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('end');
  expect(await page.evaluate(() => ({ v: PixelPets.state.v, q: PixelPets.questCheck, g: PixelPets.glimmerCheck }))).toEqual({ v: 2, q: [], g: [] });
});

test('Glimmerwell: sign the manifest, pass the quarterly review, and close the quarter for Tier 3', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page, save(Object.assign({}, GLIMMER, { 'story.reached_brinewick': true, 'story.brine_arrived': true }),
    { map: 'brinewick', x: 24, y: 12, facing: 'up' }, { seal_glim_1: 1, seal_glim_2: 1 }));
  expect(await page.evaluate(() => PixelPets.quest.text)).toContain('white depot');
  await step(page, 'brinewick', 24, 11, 'up', 'ArrowUp');
  await settled(page, 'bw_depot_in');
  expect(await page.evaluate(() => PixelPets.quest.text)).toContain('Line twelve');
  const before = await page.evaluate(() => PixelPets.state.standing && PixelPets.state.standing.glimmer);
  await talk(page, 'bw_depot_in', 9, 3, 'up');
  await run(page, ['Sign the manifest']);
  expect(await flag(page, 'story.brine_manifest')).toBe('signed');
  expect(await flag(page, 'story.brine_freed')).toBe(true);
  expect(await page.evaluate(() => PixelPets.state.standing.glimmer)).toBeGreaterThan(before | 0);

  await step(page, 'brinewick', 24, 13, 'up', 'ArrowUp');
  await page.waitForFunction(() => !!PixelPets.scene);
  const review = await run(page);
  expect(review.some(t => t.includes('quarterly review'))).toBe(true);
  expect(await flag(page, 'story.brine_dorian')).toBe(true);

  await talk(page, 'bw_hall_in', 5, 3, 'up');
  await run(page, ['Close the quarter']);
  expect(await flag(page, 'story.seal3')).toBe(true);
  expect(await page.evaluate(() => !!PixelPets.state.seals.seal_glim_3)).toBe(true);
  expect(await page.evaluate(() => !!PixelPets.state.seals.seal_brinewick)).toBe(false);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('the Hall gauges teach turn order and the flood strips block the deck until answered', async ({ page }) => {
  await boot(page, save(Object.assign({}, KEEPERS, { 'story.reached_brinewick': true, 'story.brine_arrived': true, 'story.brine_dorian': true,
    'story.brine_freed': true, 'story.brine_depot': true, 'spotted.bw_deckhand': true, 'spotted.bw_ringer': true }), { map: 'bw_hall_in', x: 5, y: 11, facing: 'up' }));
  await step(page, 'bw_hall_in', 4, 9, 'up', 'ArrowUp');          // the flood strip is water, not deck
  await page.waitForTimeout(350);
  expect(await here(page)).toMatchObject({ map: 'bw_hall_in', x: 4, y: 9 });
  await talk(page, 'bw_hall_in', 5, 9, 'up');
  await run(page, ['The bigger one']);
  expect(await flag(page, 'story.h3_gauge_a')).toBeFalsy();
  await talk(page, 'bw_hall_in', 5, 9, 'up');
  await run(page, ['The faster one']);
  expect(await flag(page, 'story.h3_gauge_a')).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapObjs.some(o => o.id === 'h3_gauge_a'))).toBe(false);
  await talk(page, 'bw_hall_in', 5, 6, 'up');
  await run(page, ['Lower its SPD']);
  expect(await flag(page, 'story.h3_gauge_b')).toBe(true);
});

test('the Lantern House rests the team for Acorns, its host explains healing, and Brinewick sits on the region map', async ({ page }) => {
  await boot(page, save(Object.assign({}, KEEPERS, { 'story.reached_brinewick': true, 'story.brine_arrived': true }), { map: 'bw_lantern_in', x: 5, y: 6, facing: 'up' }));
  await talk(page, 'bw_lantern_in', 5, 3, 'up');
  const guide = await run(page, ['Got it']);
  expect(guide.some(t => t.includes('Acorns'))).toBe(true);
  await shot(page, 'brinewick-lantern');
  const node = await page.evaluate(() => PixelPets.mapNodeCenter('brinewick'));
  expect(node).not.toBeNull();
  expect(await page.evaluate(() => PixelPets.mapCheck())).toEqual([]);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

// A lost battle wakes the holder at the nearest Lantern House they know. LANTERN_NEAR and LANTERN_TOWNS had no Route 3 or
// Brinewick rows, so a wipe in Brinewick (or on Route 3 after resting there) woke the holder back in Hearthmoor.
async function wipe(page) {
  await page.evaluate(() => {
    PixelPets.battle.textMs = 1; PixelPets.battle.animMs = 0;
    PixelPets.showTab('walk');
    if (PixelPets.clearWild) PixelPets.clearWild();
  });
  expect(await page.evaluate(() => PixelPets.forceBattle('tide/0', 3))).toBe(true);
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 15000 });
  await page.evaluate(() => {
    const now = Date.now();
    for (const p of PixelPets.state.party) { p.hpNow = 0; p.faintUntil = now + 20 * 60000; }
    PixelPets.loseBattle();
  });
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.panel === 'end', null, { timeout: 15000 });
  await page.locator('#btOk').click();
  await page.waitForFunction(() => PixelPets.battle && !PixelPets.battle.on && !PixelPets.fading, null, { timeout: 15000 });
  await page.evaluate(() => { if (PixelPets.scene) PixelPets.endScene(); });
}

test('a wipe in Brinewick or on Route 3 wakes the holder at the Brinewick Lantern House @w1', async ({ page }) => {
  await boot(page, save(Object.assign({ 'story.reached_brinewick': true }, KEEPERS), { map: 'brinewick', x: 10, y: 3, respawn: 'brinewick' }));
  await wipe(page);
  await settled(page, 'bw_lantern_in');
  expect(await here(page)).toEqual({ map: 'bw_lantern_in', x: 2, y: 4 });
  expect(await page.locator('#toast').textContent()).toContain('Back at the Brinewick Lantern House.');
  // The save loader kept only the four older towns as a respawn; a Brinewick rest was dropped on the next load.
  expect(await page.evaluate(() => PixelPets.state.world.respawn)).toBe('brinewick');
  await page.evaluate(() => PixelPets.goto('route3', 6, 30, 'down'));
  await settled(page, 'route3');
  await wipe(page);
  await settled(page, 'bw_lantern_in');
  expect(await page.evaluate(() => PixelPets.state.world.respawn)).toBe('brinewick');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

// Rule 10 on the TOWN map: TOWN_DOOR_ART had no Brinewick rows, so its Lantern House and Chandlery doors carried no heart
// lantern or acorn board, unlike every other town.
test('the Brinewick TOWN map marks the Lantern House with the heart lantern and the Chandlery with the acorn board @w1', async ({ page }) => {
  const s = save(Object.assign({ 'story.reached_brinewick': true }, KEEPERS));
  s.settings.controls = 'modern';
  await boot(page, s);
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.waitForFunction(() => PixelPets.mapLayer() && PixelPets.mapLayer().level === 'town' && PixelPets.mapLayer().shown === 'brinewick');
  const mark = await page.evaluate(() => {
    const layer = PixelPets.mapLayer();
    const c = document.querySelector('#regionCanvas'), g = c.getContext('2d');
    const k = c.width / c.getBoundingClientRect().width, p = layer.px;
    // Exact PAL pixels on the door tile: r (#b13e53) is the lantern's heart, b (#3b5dc9) the board's face.
    const count = (b, rgb) => {
      let n = 0;
      for (let y = 0; y < p; y++) for (let x = 0; x < p; x++) {
        const d = g.getImageData(Math.floor((b.xy[0] * p + x + 0.5) * k), Math.floor((b.xy[1] * p + y + 0.5) * k), 1, 1).data;
        if (d[0] === rgb[0] && d[1] === rgb[1] && d[2] === rgb[2]) n++;
      }
      return n;
    };
    const find = id => layer.buildings.find(b => b.door === id);
    const at = id => find(id) && { heart: count(find(id), [177, 62, 83]), board: count(find(id), [59, 93, 201]) };
    return { bw_lantern: at('bw_lantern'), bw_store: at('bw_store') };
  });
  expect(mark.bw_lantern.heart).toBeGreaterThan(0);
  expect(mark.bw_store.board).toBeGreaterThan(0);
});
