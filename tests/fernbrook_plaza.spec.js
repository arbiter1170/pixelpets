/* FERNBROOK_PLAZA (D1243-D1247): the stream field east of the orchard crates is a plaza. Three Keepers and three Glimmerwell
   holders, each with a Walkling, face off over who controls Fernbrook while four townsfolk stand around them, scared. Phases
   come from one helper (game.js fbPlazaPhase, `fbplaza:` conds, D1244): argue; watch (the first trial is next: Lizzy's class,
   or story.heights_done on an older save, with no Seal) where everyone turns to the Hall; after (Seal, no pick yet); curfew
   (the crackdown to the pick, everyone indoors); and held_keepers /
   held_glimmer (Vincent's D1171: the picked side holds Fernbrook after Trial 1), where the other side and its Walklings vanish.
   The `hold` / `faceWhen` / `bangWhen` npc fields are the engine hook. Runs at 320, 375 and 390. Save stays v2, no new keys. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const KEEPERS = ['fbp_constable', 'fbp_sergeant', 'fbp_cadet'];
const GLIMMER = ['fbp_associate', 'fbp_bright_lead', 'fbp_junior_bright'];
const K_PETS = KEEPERS.map((id) => id + '_pet');
const G_PETS = GLIMMER.map((id) => id + '_pet');
const TOWNSFOLK = ['fbp_orchard_hand', 'fbp_weaver', 'fbp_stall_hand', 'fbp_elder'];
const ALL = KEEPERS.concat(GLIMMER, K_PETS, G_PETS, TOWNSFOLK);
const ARGUE = {};
const WATCH = { 'story.heights_done': true };
const HELD_K = { 'story.side_pick_done': true, 'story.side': 'keepers', 'story.seal1': true };
const HELD_G = { 'story.side_pick_done': true, 'story.side': 'glimmer', 'story.seal1': true };
const phase = (page) => page.evaluate(() => PixelPets.fbPlazaPhase());
const KEEPER_SIDE = { 'story.side_pick_done': true, 'story.side': 'keepers' };

function save(flags) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  Object.assign(s.flags, {
    'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true,
    'story.unlock_sides': true, 'story.unlock_rep': true, 'story.unlock_phone': true,
  }, flags || {});
  s.world = { map: 'fernbrook', x: 27, y: 12, facing: 'down', respawn: 'hearthmoor' };
  return s;
}

async function boot(page, flags, opts = {}) {
  if (opts.reduce !== false) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(flags), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.clock.set('tue', 10, 0); PixelPets.showTab('walk'); PixelPets.clearWild(); });
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
  expect(await page.evaluate(() => PixelPets.state.world)).toMatchObject({ map: 'fernbrook', x: 27, y: 12 });
}

const present = (page) => page.evaluate((ids) => Object.fromEntries(ids.map((id) => [id, !!(PixelPets.objPos(id) || {}).present])), ALL);
const facings = (page, ids) => page.evaluate((list) => Object.fromEntries(list.map((id) => [id, PixelPets.objPos(id).facing])), ids);
const plazaObj = (id) => `MAPDATA.detail_zzz_fernbrook_plaza.slicePatch.maps.fernbrook.addObjs.find(o => o.id === ${JSON.stringify(id)})`;

// Talks to one npc, returns the line it shows (and its speaker), then closes the box.
async function talk(page, id) {
  expect(await page.evaluate((nid) => PixelPets.talkTo(nid), id), id).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full, null, { timeout: 4000 });
  await expect(page.locator('#sbText')).toBeVisible();
  const r = await page.evaluate(() => ({ who: PixelPets.scene.who || '', text: PixelPets.scene.text }));
  await page.evaluate(() => PixelPets.endScene());
  await page.waitForFunction(() => !PixelPets.scene);
  return r;
}

async function setFlags(page, flags) {
  await page.evaluate((f) => { for (const [k, v] of Object.entries(f)) PixelPets.setFlag(k, v); }, flags);
}

test('the plaza joins the road, every person talks from a reachable tile, and no wild zone covers it', async ({ page }) => {
  await boot(page, ARGUE);
  const r = await page.evaluate(([ids]) => {
    const info = PixelPets.mapInfo, W = info.w, H = info.h;
    const seen = new Set(['25,8']), q = [[25, 8]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || PixelPets.tileInfo(nx, ny).blocked) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    const bad = [];
    for (const id of ids) {
      const o = PixelPets.objPos(id);
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((o.x + dx) + ',' + (o.y + dy)))) bad.push(id);
    }
    let plaza = 0;
    for (let y = 10; y <= 17; y++) for (let x = 18; x <= 29; x++) if (PixelPets.tileInfo(x, y).ch === 'P') plaza++;
    return { bad, plaza, w: W, h: H, zones: WORLD.fernbrook.zones, pond: [20, 21, 22, 23].every((x) => PixelPets.tileInfo(x, 12).ch === 'w'),
      snack: seen.has('28,16'), odile: (({ x, y }) => [x, y])(WORLD.fernbrook.objs.find((o) => o.id === 'odile')), west: WORLD.fernbrook.grid.slice(9, 19).map((r) => r.slice(0, 17)) };
  }, [ALL]);
  expect(r.bad).toEqual([]);
  expect(r.plaza).toBeGreaterThan(50);
  expect(r.pond).toBe(true);
  expect({ w: r.w, h: r.h }).toEqual({ w: 32, h: 32 }); // FERNBROOK_HOMES (#267) grew Fernbrook south
  expect(r.zones).toEqual([{ x: 3, y: 11, w: 13, h: 7 }]);
  expect(r.snack).toBe(true);
  expect(r.odile, 'Odile keeps her tile').toEqual([27, 9]);
  const base = await page.evaluate(() => MAPDATA.maps_slice.maps.fernbrook.grid.slice(9, 19).map((row) => row.slice(0, 17)));
  expect(r.west, 'the orchard half of rows 9-18 is unchanged').toEqual(base);
  // Stand by the orchard: wilds still turn up there, and never on the plaza.
  await page.evaluate(() => PixelPets.goto('fernbrook', 20, 9, 'down'));
  const spawned = await page.evaluate(() => { const out = []; for (let i = 0; i < 40; i++) { const w = PixelPets.spawnWild(); if (w) out.push([w.x, w.y]); } PixelPets.clearWild(); return out; });
  expect(spawned.length).toBeGreaterThan(0);
  for (const [x, y] of spawned) expect(x >= 3 && x < 16 && y >= 11 && y < 18, 'wild at ' + x + ',' + y).toBe(true);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('contested: both sides and their Walklings stand in the plaza, ringed by townsfolk', async ({ page }) => {
  await boot(page, ARGUE);
  const p = await present(page);
  for (const id of ALL) expect(p[id], id).toBe(true);
  const r = await page.evaluate((ids) => ids.map((id) => { const o = MAPDATA.detail_zzz_fernbrook_plaza.slicePatch.maps.fernbrook.addObjs.find((n) => n.id === id); return { id, pet: o.pet || null, look: o.look || null, faction: o.pet ? null : (PPRep.entry(o.name) || {}).faction }; }), ALL);
  const by = Object.fromEntries(r.map((x) => [x.id, x]));
  for (const id of KEEPERS) { expect(by[id].faction, id).toBe('keepers'); expect(by[id + '_pet'].pet, id).toMatch(/^[a-z]+\/[0-2]$/); }
  for (const id of GLIMMER) { expect(by[id].faction, id).toBe('glimmer'); expect(by[id + '_pet'].pet, id).toMatch(/^[a-z]+\/[0-2]$/); }
  for (const id of TOWNSFOLK) expect(by[id].faction, id).toBe('none');
  expect(KEEPERS.map((id) => by[id].look)).toEqual(['officer', 'captain', 'clerk']);
  expect(GLIMMER.map((id) => by[id].look)).toEqual(['associate', 'glimclerk', 'junior_bright']);   // LOOK_LOCK D2278: the Junior Bright's own Glimmer-set look, not the reference one
  // Every pet form is a real Walkling, and labels are unique across the game (contacts are keyed by name).
  const names = await page.evaluate((ids) => {
    const objs = MAPDATA.detail_zzz_fernbrook_plaza.slicePatch.maps.fernbrook.addObjs, mine = new Set(ids);
    const people = objs.filter((o) => mine.has(o.id) && !o.pet).map((o) => o.name), clash = [];
    for (const [mid, m] of Object.entries(WORLD)) for (const o of m.objs) if (o.name && people.includes(o.name) && !mine.has(o.id)) clash.push(mid + ':' + o.id);
    return { clash, forms: objs.filter((o) => o.pet).map((o) => !!BASE_STATS[o.pet]), people, keeperWord: people.filter((n) => /keeper/i.test(n)) };
  }, ALL);
  expect(names.clash).toEqual([]);
  expect(names.forms.every(Boolean)).toBe(true);
  expect(new Set(names.people).size).toBe(names.people.length);
  expect(names.keeperWord).toEqual([]);
});

test('argue phase: the sides face each other and hold still, townsfolk face in; watch phase: everyone faces the Hall', async ({ page }) => {
  await boot(page, KEEPER_SIDE, { reduce: false });
  const argue = await facings(page, KEEPERS.concat(GLIMMER, TOWNSFOLK));
  for (const id of KEEPERS) expect(argue[id], id).toBe('right');
  for (const id of GLIMMER) expect(argue[id], id).toBe('left');
  expect(TOWNSFOLK.map((id) => argue[id])).toEqual(['down', 'up', 'left', 'right']);
  // Walkers would have picked a route and glanced by now; the standoff never does, even with the holder next to them.
  const life = await page.evaluate((ids) => { PixelPets.wanderNow(); return PixelPets.npcLife().filter((n) => ids.includes(n.id)).map((n) => ({ id: n.id, route: n.route })); }, KEEPERS.concat(GLIMMER, TOWNSFOLK));
  expect(life.length).toBe(10);
  for (const n of life) expect(n.route, n.id).toBeNull();
  await page.waitForTimeout(1600);
  const held = await page.evaluate((ids) => ids.map((id) => { const o = PixelPets.objPos(id); return [id, o.x, o.y, o.moving, o.hold]; }), ALL);
  for (const [id, , , moving, hold] of held) { expect(moving, id).toBe(false); expect(hold, id).toBe(true); }
  const again = await facings(page, KEEPERS.concat(GLIMMER));
  expect(again).toEqual(Object.fromEntries(Object.keys(again).map((id) => [id, argue[id]])));
  // A talk turns the npc to the holder, and it turns back when the talk ends.
  await talk(page, 'fbp_sergeant');
  expect((await facings(page, ['fbp_sergeant'])).fbp_sergeant).toBe('right');
  // The "!" pulses over the shouting sides (balloons only; never on the townsfolk).
  await expect.poll(() => page.evaluate((ids) => PixelPets.npcLife().filter((n) => ids.includes(n.id) && n.last && n.last.glyph === 'emote_bang').length, KEEPERS.concat(GLIMMER)), { timeout: 9000 }).toBeGreaterThan(0);
  expect(await page.evaluate((ids) => PixelPets.npcLife().filter((n) => ids.includes(n.id) && n.last && n.last.glyph === 'emote_bang').length, TOWNSFOLK)).toBe(0);

  expect(await phase(page)).toBe('argue');
  await setFlags(page, WATCH);
  expect(await phase(page)).toBe('watch');
  const watch = await facings(page, KEEPERS.concat(GLIMMER, TOWNSFOLK));
  for (const id of Object.keys(watch)) expect(watch[id], id).toBe('up');
  const p = await present(page);
  for (const id of ALL) expect(p[id], id).toBe(true);

  // A Seal with no pick yet: the argument is back on.
  await setFlags(page, { 'story.seal1': true, 'story.side_pick_done': null });
  expect(await phase(page)).toBe('after');
  const after = await facings(page, KEEPERS.concat(GLIMMER));
  for (const id of KEEPERS) expect(after[id], id).toBe('right');
  for (const id of GLIMMER) expect(after[id], id).toBe('left');
});

test('talk lines: neutral is told to stay out, the same side greets and thanks, the other side brushes off', async ({ page }) => {
  await boot(page, ARGUE);
  const L = (id) => page.evaluate((src) => eval(src).lines, plazaObj(id));
  for (const id of KEEPERS.concat(GLIMMER)) {
    const line = await talk(page, id);
    expect(line.text, id).toBe((await L(id))['!story.side_pick_done']);
    expect(line.text, id).toMatch(/stay out of it|step back/i);
  }
  await setFlags(page, KEEPER_SIDE);
  for (const id of KEEPERS) {
    const line = await talk(page, id);
    expect(line.text, id).toBe((await L(id)).else);
    expect(line.text, id).toMatch(/thank/i);
  }
  for (const id of GLIMMER) {
    const line = await talk(page, id);
    expect(line.text, id).toBe((await L(id)).else);
    expect(line.text, id).not.toMatch(/thank/i);
  }
  await setFlags(page, { 'story.side': 'glimmer' });
  for (const id of GLIMMER) {
    const line = await talk(page, id);
    expect(line.text, id).toBe((await L(id))['story.side=glimmer']);
    expect(line.text, id).toMatch(/thank|helping|partner/i);
  }
  for (const id of KEEPERS) {
    const line = await talk(page, id);
    expect(line.text, id).toBe((await L(id))['story.side=glimmer']);
    expect(line.text, id).not.toMatch(/thank/i);
  }
  // The speaker label is the rank or role, and every faction npc says Keeper with a capital K.
  const who = await talk(page, 'fbp_bright_lead');
  expect(who.who).toBe('Bright Lead');   // the raw speaker key; NAMES_PASS D1738 shows Bright Lead Avery (names_pass.spec.js)
  const every = await page.evaluate(() => MAPDATA.detail_zzz_fernbrook_plaza.slicePatch.maps.fernbrook.addObjs.flatMap((o) => Object.values(o.lines || {}).concat(Object.values(o.chatter || {}))));
  for (const s of every) {
    expect(s, s).not.toMatch(/\bkeeper/);
    expect(s, s).not.toMatch(/faint|evolv|coins?\b|appeared|dex\b|trainer|go, [a-z]+!/i);
    expect(Array.from(s).length, s).toBeLessThanOrEqual(80);
  }
  const chatter = await page.evaluate(() => MAPDATA.detail_zzz_fernbrook_plaza.slicePatch.maps.fernbrook.addObjs.flatMap((o) => Object.values(o.chatter || {})));
  for (const s of chatter) expect(Array.from(s).length, s).toBeLessThanOrEqual(40);
});

test('watch phase lines: Keepers root for the holder to learn from Master Fen, Glimmerwell wants Fen out', async ({ page }) => {
  await boot(page, Object.assign({}, WATCH, KEEPER_SIDE));
  for (const id of KEEPERS) expect((await talk(page, id)).text, id).toMatch(/Master Fen/);
  expect((await talk(page, 'fbp_sergeant')).text).toMatch(/learn/i);
  await setFlags(page, { 'story.side': 'glimmer' });
  for (const id of GLIMMER) expect((await talk(page, id)).text, id).toMatch(/Fen/);
  expect((await talk(page, 'fbp_bright_lead')).text).toMatch(/Bright Lead runs that Hall/);
  expect((await talk(page, 'fbp_elder')).text).toMatch(/quiet before a trial/);
  // The Walklings narrate (no speaker), and look at the Hall too.
  const pet = await talk(page, 'fbp_constable_pet');
  expect(pet.who).toBe('');
  expect(pet.text).toMatch(/Hall/);
  // A neutral holder in the watch phase still hears each side's hope for the trial.
  await setFlags(page, { 'story.side_pick_done': null, 'story.side': null });
  expect((await talk(page, 'fbp_cadet')).text).toMatch(/Master Fen/);
  expect((await talk(page, 'fbp_associate')).text).toMatch(/Master Fen/);
  // After the Seal with no pick yet, both sides react to the Seal and still say stay out of it.
  await setFlags(page, { 'story.seal1': true });
  expect(await phase(page)).toBe('after');
  for (const id of KEEPERS.concat(GLIMMER)) {
    const line = await talk(page, id);
    expect(line.text, id).toBe(await page.evaluate((src) => eval(src).lines['fbplaza:after'], plazaObj(id)));
    expect(line.text, id).toMatch(/Seal|Trial|Tier 1|passed/);
  }
});

test('flip to keepers: Glimmerwell and their Walklings vanish, the Keepers thank their own; and the reverse', async ({ page }) => {
  await boot(page, KEEPER_SIDE);
  await setFlags(page, { 'story.seal1': true });
  expect(await phase(page)).toBe('held_keepers');
  let p = await present(page);
  for (const id of KEEPERS.concat(K_PETS, TOWNSFOLK)) expect(p[id], id).toBe(true);
  for (const id of GLIMMER.concat(G_PETS)) expect(p[id], id).toBe(false);
  expect(await page.evaluate(() => ['fbp_comfort_n', 'fbp_comfort_s', 'fbp_banner_n'].map((id) => PixelPets.objPos(id).present))).toEqual([false, false, true]);
  expect((await talk(page, 'fbp_sergeant')).text).toMatch(/You helped/);
  expect((await talk(page, 'fbp_weaver')).text).toMatch(/peace/);
  const calm = await facings(page, KEEPERS);
  for (const id of KEEPERS) expect(calm[id], id).toBe('down');
  expect(await page.evaluate(() => PixelPets.tileInfo(29, 13).blocked)).toBe(false);

  await setFlags(page, { 'story.side': 'glimmer' });
  expect(await phase(page)).toBe('held_glimmer');
  p = await present(page);
  for (const id of GLIMMER.concat(G_PETS, TOWNSFOLK)) expect(p[id], id).toBe(true);
  for (const id of KEEPERS.concat(K_PETS)) expect(p[id], id).toBe(false);
  expect(await page.evaluate(() => ['fbp_comfort_n', 'fbp_banner_n', 'fbp_banner_s'].map((id) => PixelPets.objPos(id).present))).toEqual([true, false, false]);
  expect((await talk(page, 'fbp_associate')).text).toMatch(/Thanks/);
  expect((await talk(page, 'fbp_stall_hand')).text).toMatch(/kiosk/);
  expect(await page.evaluate(() => PixelPets.tileInfo(25, 13).blocked)).toBe(false);

  await setFlags(page, { 'story.seal1': null });
  expect(await phase(page)).toBe('argue');
  p = await present(page);
  for (const id of ALL) expect(p[id], id).toBe(true);
});

// Morgan's review of #266 (Nov 3, 2026): on the Day 1 flow (#261) the Hall door opens after Lizzy's class and story.heights_done only
// comes after the pick, so the class turns "watch" on. And the crackdown curfew (POST_TRIAL_CRACKDOWN §5) empties the plaza.
test('watch on the Day 1 flow: Lizzy\'s class with no Seal turns everyone to the Hall; the Seal ends it', async ({ page }) => {
  await boot(page, { 'story.lizzy_class': true });
  expect(await phase(page)).toBe('watch');
  const f = await facings(page, KEEPERS.concat(GLIMMER));
  for (const id of KEEPERS.concat(GLIMMER)) expect(f[id], id).toBe('up');
  const p = await present(page);
  for (const id of ALL) expect(p[id], id).toBe(true);
  await setFlags(page, { 'story.seal1': true });
  expect(await phase(page)).toBe('after');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('curfew: from the crackdown to the pick the plaza people are indoors and the props stay; the pick brings the winners back', async ({ page }) => {
  await boot(page, { 'story.lizzy_class': true, 'story.seal1': true, 'story.post_trial_done': true, 'story.crackdown': true });
  expect(await phase(page)).toBe('curfew');
  const p = await present(page);
  for (const id of ALL) expect(p[id], id).toBe(false);
  expect(await page.evaluate(() => ['fbp_lamp_nw', 'fbp_bench_n', 'fbp_banner_n'].map((id) => !!(PixelPets.objPos(id) || {}).present))).toEqual([true, true, true]);
  await setFlags(page, KEEPER_SIDE);
  expect(await phase(page)).toBe('held_keepers');
  const q = await present(page);
  for (const id of KEEPERS.concat(K_PETS, TOWNSFOLK)) expect(q[id], id).toBe(true);
  for (const id of GLIMMER.concat(G_PETS)) expect(q[id], id).toBe(false);
});

test('the region map hold is untouched here: Fernbrook reads split, and the map check stays clean', async ({ page }) => {
  // The plaza reads the same flip rule as D1171, but the REGION_MAP / matchHold change belongs to claude/fernbrook-flip
  // (DAY1_TRIAL1_FLOW slice 8b). Update this test there.
  await boot(page, ARGUE);
  expect(await page.evaluate(() => PixelPets.devChecks().map)).toEqual([]);
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.locator('#mapLevelRegion').click();
  const r = await page.evaluate(() => ({ name: document.querySelector('#mapPlaceName').textContent, hold: document.querySelector('#mapHold').dataset.hold }));
  expect(r).toEqual({ name: 'FERNBROOK', hold: 'split' });
  await page.locator('#mapClose').click();
  // The phase helper is a read: switching phases writes nothing new to the save.
  const keys = () => page.evaluate(() => { const r = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return Object.keys(r).sort().join(','); });
  await setFlags(page, { 'story.reached_fernbrook': true });
  const before = await keys();
  for (const f of [WATCH, HELD_K, HELD_G]) { await setFlags(page, f); expect(await keys()).toBe(before); }
});

test('an old save on a former stream-field tile loads, and the visit writes no new save keys', async ({ page }) => {
  const s = save(KEEPER_SIDE);
  s.world = { map: 'fernbrook', x: 25, y: 13, facing: 'down', respawn: 'hearthmoor' };   // was tall grass; now the Sergeant's tile
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  const w = await page.evaluate(() => ({ map: PixelPets.state.world.map, blocked: PixelPets.tileInfo(PixelPets.state.world.x, PixelPets.state.world.y).blocked, v: PixelPets.state.v }));
  expect(w).toEqual({ map: 'fernbrook', blocked: false, v: 2 });
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.setFlag('story.reached_fernbrook', true); });   // setFlag saves
  const before = await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return { keys: Object.keys(r).sort(), flags: Object.keys(r.flags).sort() }; });
  await page.evaluate(() => PixelPets.goto('fernbrook', 27, 12, 'down'));
  for (const id of ['fbp_constable', 'fbp_associate', 'fbp_elder', 'fbp_cadet_pet']) await talk(page, id);
  await page.evaluate(() => PixelPets.setFlag('story.reached_fernbrook', true));
  const after = await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return { v: r.v, keys: Object.keys(r).sort(), flags: Object.keys(r.flags).sort(), raw: JSON.stringify(r) }; });
  expect(after.v).toBe(2);
  expect(after.keys).toEqual(before.keys);
  expect(after.flags).toEqual(before.flags);
  expect(after.raw).not.toMatch(/fbp_|fbplaza/);
});
