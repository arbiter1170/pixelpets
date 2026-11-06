/* BRIGHT_SHUTTLE (design specs/BRIGHTGATE_LAYOUT.md §17.1, §17.7 tests 14-15; D2090 and D2091 settled by Vincent, Wed Nov 4,
   2026; D2092, D2105, D2106 on their defaults; names PLACEHOLDER until Story's name check, D2097). The Act 2 way into
   Brightgate: the company's crew shuttle from Kilnmouth's works yard (53,16, from story.km_twin_lead) to Gate Plaza 32,37
   facing north; the way home from 32,38 to Hearthmoor 18,8 beside the Lantern Coach; Hearthmoor's mark (18,9) back to 32,37
   for every later visit; the works line (33,38) to the yard from story.km_council. Two narrations, once each
   (story.bg_shuttle, story.bg_shuttle_hm: additive, NOT_STEPS). Quest rows bg_ride (B4 to B5) and bg_home (H4 to B6).
   At 320, 375 and 390 (@w1 rows are data checks, at 320 only); Modern controls; reduced motion; zero console errors; the save
   stays pixelpets.save.v2, v 2, nothing written at load. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// Act 1 done and Ep 1 closed, a plain Keeper Cadet, posted and met (as tests/kilnmouth.spec.js seeds it).
const ACT1 = {
  'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true,
  'story.met_fen': true, 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true,
  'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'trainer.h1_cadet': true,
  'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true,
  'story.crackdown': true, 'story.hall1_shut': true, 'story.post_trial_done': true, 'story.fen_lean': 2, 'story.phone_got': true,
  'story.warden_called': true, 'story.warden_met': true, 'story.chi_met': true, 'story.chi_jars': 6, 'story.reached_route2': true,
  'story.met_census': true, 'story.reached_glen': true, 'story.shift_k': true, 'story.met_lead': true,
  'story.chi_done': true, 'story.orchard_lean': 'open', 'story.orchard_cleared': true, 'story.sway_fernbrook': 3,
  'story.ilse_call2': true, 'story.keeper_cadet': true, 'story.side_pick_done': true, 'story.ilse_call_old': true,
  'story.tour1_s1': true, 'story.slice_end': true, 'story.heights_done': true, 'story.seal2': true, 'story.cobble_end': true,
  'story.rpt_1': 'told', 'story.gb_done': true, 'story.rpt_2': 'kept', 'story.route3_open': true, 'story.reached_brinewick': true,
  'story.brine_depot': true, 'story.brine_freed': true, 'story.brine_dorian': true, 'story.seal3': true, 'story.ep1_end': true,
  'story.cover_done': true, 'story.rpt_old_seen': true, 'story.rpt_3': 'kept', 'story.hc_council_done': true, 'story.hc_arrived': true, 'story.hc_greeted': true,
};
const MET = Object.assign({}, ACT1, { 'story.a2_called': true, 'story.gov_posted': true, 'story.cv_mom': 'told', 'story.cv_mom_walk': true,
  'story.reached_route4': true, 'story.r4_fork': true, 'story.r4_walked': true, 'story.r4_adder_met': true, 'story.r4_heron_met': true,
  'story.hc_gov_met': true, 'story.km_assigned': true, 'story.reached_kilnmouth': true, 'story.km_arrived': true });
const CREW = Object.assign({}, MET, { 'story.km_storm': true, 'story.km_crew': true });              // B4 before the permit
const TWIN = Object.assign({}, CREW, { 'story.km_permit_seen': true, 'story.km_permit_to': 'town', 'story.sway_kilnmouth': 1,
  'story.km_twin_lead': true, 'story.pres_hint_default': true });                                       // B4 done: B5's key
const IN_BG = Object.assign({}, TWIN, { 'story.reached_brightgate': true, 'story.bg_shuttle': true });   // B5, after the first ride
const H4 = Object.assign({}, IN_BG, { 'story.seal4': true, 'story.ada_sky': true });                    // Hall 4 won
const COUNCIL = Object.assign({}, H4, { 'story.bg_shuttle_hm': true, 'story.km_seat_filled': true, 'story.km_council': true });

const LINE = {
  ks_sign: 'BRIGHT SHUTTLE · Brightgate. Free for partners and their guests. Step on the mark.',
  ks_att_first: 'The Lamp Works sends a shuttle for the tower crew. Guests ride free, Cadet. Have a bright day!',
  ks_att: 'One step to Brightgate. Mind the mark!',
  bs_first_ride: 'The shuttle hums to a stop. Nobody asks for a ticket. Nobody asks your name, either.',
  hs_sign: 'BRIGHT SHUTTLE · Brightgate. Free, every hour. A Glimmerwell kindness. Have a bright day!',
  hs_first_drop: "The shuttle sets you down beside the Lantern Coach. Its driver waves at the porter. He doesn't wave back.",
};
const Q_B5 = ['bg_ride', 'Ride the company shuttle from the Kilnmouth works yard to Brightgate.', 'Kilnmouth works yard', { map: 'kilnmouth', x: 53, y: 16 }];
const Q_H4 = ['bg_home', 'Take the shuttle home to Hearthmoor. The Lantern Coach waits there.', 'Brightgate shuttle stop', { map: 'brightgate', x: 32, y: 38 }];

const Q_HALL = ['bg_hall', 'Win Seal 4 at the Brightgate Trial Hall in Old Wick.', 'Brightgate Trial Hall', { map: 'bg_oldtown', x: 32, y: 15 }];   // D2351, PLACEHOLDER

function save(flags, world) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  s.settings.tips = false;
  Object.assign(s.flags, flags || {});
  s.world = Object.assign({ map: 'kilnmouth', x: 51, y: 20, facing: 'up', respawn: 'hearthmoor' }, world || {});
  s.seals = { seal_fernbrook: 1700000000000, seal_cobblecrest: 1700000000000, seal_brinewick: 1700000000000 };
  if (flags && flags['story.seal4']) s.seals.seal_brightgate = 1700000000000;
  s.party[0].xp = 4000; s.party[0].bx = 4 * 28 * 28;
  return s;
}
async function boot(page, s, opts = {}) {
  test.setTimeout(opts.long || 60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, opts.plain ? '' : '?debug=1');
  if (opts.plain) { await page.waitForFunction(() => window.PixelPets && PixelPets.state); return; }
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const where = page => page.evaluate(() => [PixelPets.mapInfo.id, PixelPets.state.world.x, PixelPets.state.world.y, PixelPets.state.world.facing]);
const quest = page => page.evaluate(() => { const q = PixelPets.quest; return q && [q.id, q.text, q.place, q.target || null]; });
const shown = page => page.evaluate(() => PixelPets.mapObjs.map(o => o.id));
const settled = (page, id) => page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, id);
async function goto(page, map, x, y, facing) {
  expect(await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down'])).toBeTruthy();
  await settled(page, map);
  await page.evaluate(() => PixelPets.clearWild());
}
async function step(page, dir) { await page.evaluate(d => PixelPets.walkStep(d), dir); await page.waitForFunction(() => !PixelPets.fading); await page.waitForTimeout(80); }
// The one line of an open say box (full), or null when none opens within the wait.
async function sayText(page, ms = 4000) {
  try { await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'say' && PixelPets.scene.full, null, { timeout: ms }); }
  catch (e) { return null; }
  return page.evaluate(() => PixelPets.scene.text);
}
async function closeSay(page) {
  for (let i = 0; i < 12 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(80); }
  expect(await page.evaluate(() => !!PixelPets.scene)).toBe(false);
}
// Modern controls: a tap on a tile walks there (an open warp included, so landing on it rides).
async function tapTile(page, x, y) {
  await expect.poll(() => page.evaluate(async () => {
    const a = Object.assign({}, PixelPets.walk.cam); await new Promise(r => setTimeout(r, 120)); const b = PixelPets.walk.cam;
    return a.x === b.x && a.y === b.y;
  }), { timeout: 5000 }).toBe(true);
  const r = await page.evaluate(({ x, y }) => {
    const mc = document.querySelector('#mapCanvas'), b = mc.getBoundingClientRect(), cam = PixelPets.walk.cam;
    const cx = b.left + ((x * 16 + 8 - cam.x) / mc.width) * b.width, cy = b.top + ((y * 16 + 8 - cam.y) / mc.height) * b.height;
    const opt = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt)); mc.dispatchEvent(new PointerEvent('pointerup', opt));
    return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
  }, { x, y });
  expect(r, 'tile ' + x + ',' + y + ' on screen').toBe(true);
}
// The open say box sits inside the viewport at this width (the line fits its box: no overflow, no clipped text).
async function boxFits(page) {
  const r = await page.evaluate(() => {
    const box = document.querySelector('#sbox'), el = document.querySelector('#sbText'), b = box.getBoundingClientRect();
    return { l: b.left, r: b.right, t: b.top, bt: b.bottom, w: innerWidth, h: innerHeight, over: el.scrollWidth > el.clientWidth + 1 || box.scrollHeight > box.clientHeight + 1 };
  });
  expect(r.l).toBeGreaterThanOrEqual(0); expect(r.r).toBeLessThanOrEqual(r.w + 0.5); expect(r.bt).toBeLessThanOrEqual(r.h + 0.5); expect(r.over).toBe(false);
}

test('BS1 (§17.7 test 14) the works yard stop: shown from the twin lead; the ride lands on Gate Plaza 32,37 facing north, narration once', async ({ page }) => {
  const s = save(TWIN);
  await boot(page, s);
  expect(await quest(page)).toEqual(Q_B5);
  const ids = await shown(page);
  for (const id of ['bs_kilnmouth', 'ks_sign', 'ks_attendant']) expect(ids, id).toContain(id);
  // the sign and the attendant (first visit), by Modern taps
  await tapTile(page, 49, 16);
  expect(await sayText(page)).toBe(LINE.ks_sign); await boxFits(page); await closeSay(page);
  await tapTile(page, 53, 17);
  expect(await sayText(page)).toBe(LINE.ks_att_first); await boxFits(page); await closeSay(page);
  // step on the mark: the built warp fade, then the arrival and its narration
  await tapTile(page, 53, 16);
  await settled(page, 'brightgate');
  expect(await where(page)).toEqual(['brightgate', 32, 37, 'up']);
  expect(await sayText(page)).toBe(LINE.bs_first_ride); await boxFits(page);
  await closeSay(page);
  const f = await flags(page);
  expect([f['story.reached_brightgate'], f['story.bg_shuttle'], f['story.bg_shuttle_hm']]).toEqual([true, true, undefined]);
  expect((await quest(page))[0]).not.toBe('bg_ride');
  // the narration is once: home and back again, and a second ride from the yard, play nothing on 32,37
  await step(page, 'down'); await settled(page, 'hearthmoor');
  expect(await sayText(page)).toBe(LINE.hs_first_drop); await closeSay(page);
  await step(page, 'down'); await settled(page, 'brightgate');
  expect(await where(page)).toEqual(['brightgate', 32, 37, 'up']);
  expect(await sayText(page, 800)).toBeNull();
  const st = await stored(page);
  expect(st.v).toBe(2);
  // the only new story flags (engine bookkeeping such as story.beat.* aside) are the arrival and the two narrations (D2105)
  expect(Object.keys(st.flags).filter(k => !(k in s.flags) && /^story\./.test(k) && !/^story\.(beat\.|early_)/.test(k)).sort()).toEqual(['story.bg_shuttle', 'story.bg_shuttle_hm', 'story.reached_brightgate']);
  expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
});

test('BS2 (test 14) no stop before the twin lead; a repeat ride says the short line and plays no narration', async ({ page }) => {
  await boot(page, save(CREW));
  const ids = await shown(page);
  for (const id of ['bs_kilnmouth', 'ks_sign', 'ks_attendant']) expect(ids, id).not.toContain(id);
  expect((await quest(page))[0]).not.toBe('bg_ride');
  // stepping on 53,16 without the lead goes nowhere
  await goto(page, 'kilnmouth', 53, 15, 'down');
  await step(page, 'down');
  expect(await where(page)).toEqual(['kilnmouth', 53, 16, 'down']);
  // a later visit: the attendant's repeat line, and the ride lands with no narration
  await page.evaluate(f => { for (const [k, v] of Object.entries(f)) PixelPets.setFlag(k, v); }, { 'story.km_permit_seen': true, 'story.km_twin_lead': true, 'story.reached_brightgate': true, 'story.bg_shuttle': true });
  await goto(page, 'kilnmouth', 52, 17, 'right');
  expect(await page.evaluate(() => PixelPets.talkTo('ks_attendant'))).toBe(true);
  expect(await sayText(page)).toBe(LINE.ks_att); await closeSay(page);
  await goto(page, 'kilnmouth', 53, 15, 'down');
  await step(page, 'down'); await settled(page, 'brightgate');
  expect(await where(page)).toEqual(['brightgate', 32, 37, 'up']);
  expect(await sayText(page, 800)).toBeNull();
});

test('BS3 (§17.7 test 15) after Hall 4: home to Hearthmoor 18,8 by the coach, the drop once; the mark at 18,9 comes back to 32,37', async ({ page }) => {
  const s = save(H4, { map: 'brightgate', x: 32, y: 36, facing: 'down' });
  await boot(page, s);
  expect(await quest(page)).toEqual(Q_H4);
  await step(page, 'down');
  expect(await where(page)).toEqual(['brightgate', 32, 37, 'down']);
  expect(await sayText(page, 800)).toBeNull();   // bg_shuttle is set: no first-ride line on a later step
  await step(page, 'down'); await settled(page, 'hearthmoor');
  expect(await where(page)).toEqual(['hearthmoor', 18, 8, 'up']);
  expect(await sayText(page)).toBe(LINE.hs_first_drop); await boxFits(page);
  await closeSay(page);
  expect((await flags(page))['story.bg_shuttle_hm']).toBe(true);
  expect((await quest(page))[0]).not.toBe('bg_home');
  // beside the Lantern Coach: the coach mark, Porter Bram and the coach sign are a tile or two west
  const near = await page.evaluate(() => PixelPets.mapObjs.filter(o => ['hm_to_hc', 'hm_bram', 'hm_sign_coach', 'bs_hearthmoor', 'hs_sign'].includes(o.id)).map(o => [o.id, o.x, o.y]).sort());
  expect(near).toEqual([['bs_hearthmoor', 18, 9], ['hm_bram', 15, 9], ['hm_sign_coach', 17, 9], ['hm_to_hc', 16, 9], ['hs_sign', 19, 9]]);
  await tapTile(page, 19, 9);
  expect(await sayText(page)).toBe(LINE.hs_sign); await boxFits(page); await closeSay(page);
  // the drop is once: walk off and back onto 18,8
  await goto(page, 'hearthmoor', 17, 8, 'right');
  await step(page, 'right');
  expect(await sayText(page, 800)).toBeNull();
  // later visits: Hearthmoor's mark returns to Gate Plaza
  await step(page, 'down'); await settled(page, 'brightgate');
  expect(await where(page)).toEqual(['brightgate', 32, 37, 'up']);
  expect(await sayText(page, 800)).toBeNull();
  const st = await stored(page);
  expect(st.v).toBe(2);
  expect(Object.keys(st.flags).filter(k => !(k in s.flags) && /^story\./.test(k) && !/^story\.(beat\.|early_)/.test(k))).toEqual(['story.bg_shuttle_hm']);
  expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
});

test('BS4 (test 15) the works mark 33,38: hidden before the council, then lands in the works yard 52,16 facing left', async ({ page }) => {
  await boot(page, save(IN_BG, { map: 'brightgate', x: 33, y: 37, facing: 'down' }));
  expect(await shown(page)).not.toContain('bs_gate_works');
  await step(page, 'down');
  expect(await where(page)).toEqual(['brightgate', 33, 38, 'down']);   // no leg reaches Kilnmouth before the council
  await page.evaluate(() => { PixelPets.setFlag('story.km_seat_filled', true); PixelPets.setFlag('story.km_council', true); });
  await goto(page, 'brightgate', 33, 37, 'down');
  expect(await shown(page)).toContain('bs_gate_works');
  await step(page, 'down'); await settled(page, 'kilnmouth');
  expect(await where(page)).toEqual(['kilnmouth', 52, 16, 'left']);
  // and the yard's mark beside it goes straight back
  await step(page, 'right'); await settled(page, 'brightgate');
  expect(await where(page)).toEqual(['brightgate', 32, 37, 'up']);
});

test('BS5 the first visit is always the shuttle, and no leg reaches High Charity @w1', async ({ page }) => {
  await boot(page, save(TWIN));
  const r = await page.evaluate(() => {
    const W = window.WORLD, city = id => id === 'brightgate' || /^bg_/.test(id);
    const into = [], out = [];
    for (const [id, m] of Object.entries(W)) for (const o of m.objs || []) {
      if (!(o.kind === 'warp' || o.kind === 'door') || !o.to) continue;
      if (!city(id) && city(o.to)) into.push([id, o.id, o.x, o.y, o.to, o.tx, o.ty, o.facing, o.when || null, o.need || null]);
      if (city(id) && !city(o.to)) out.push([id, o.id, o.x, o.y, o.to, o.tx, o.ty, o.facing, o.when || null]);
    }
    return { into: into.sort(), out: out.sort() };
  });
  // in: only the two shuttle marks; the yard's from B4 (the first visit), Hearthmoor's only after a first visit
  expect(r.into).toEqual([
    ['hearthmoor', 'bs_hearthmoor', 18, 9, 'brightgate', 32, 37, 'up', ['story.reached_brightgate'], null],
    ['kilnmouth', 'bs_kilnmouth', 53, 16, 'brightgate', 32, 37, 'up', ['story.km_twin_lead'], null],
  ]);
  // out: home to Hearthmoor by the coach, and the works line from the council; neither reaches High Charity
  expect(r.out).toEqual([
    ['brightgate', 'bs_gate_home', 32, 38, 'hearthmoor', 18, 8, 'up', ['story.reached_brightgate']],
    ['brightgate', 'bs_gate_works', 33, 38, 'kilnmouth', 52, 16, 'left', ['story.km_council']],
  ]);
  // every stop object stands on a free walk tile with a free walk neighbour, clear of the yard's door, shelter and coach mark
  const tiles = await page.evaluate(async () => {
    const out = {};
    for (const [map, ids] of [['kilnmouth', ['bs_kilnmouth', 'ks_sign', 'ks_attendant']], ['hearthmoor', ['bs_hearthmoor', 'hs_sign', 'hs_first_drop']], ['brightgate', ['bs_gate_home', 'bs_gate_works', 'bs_first_ride']]]) {
      PixelPets.goto(map); await new Promise(r => { const t = () => (PixelPets.mapInfo.id === map && !PixelPets.fading) ? r() : setTimeout(t, 30); t(); });
      const m = window.WORLD[map];
      for (const id of ids) {
        const o = m.objs.find(x => x.id === id), others = m.objs.filter(x => x !== o && x.x === o.x && x.y === o.y && x.kind !== 'decal');
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => PixelPets.tileInfo(o.x + dx, o.y + dy).walk && !m.objs.some(x => x.x === o.x + dx && x.y === o.y + dy && ['npc', 'sign', 'prop', 'trainer'].includes(x.kind)));
        out[map + ':' + id] = { walk: PixelPets.tileInfo(o.x, o.y).walk, shared: others.map(x => x.id), free: nb.length > 0 };
      }
    }
    return out;
  });
  for (const [k, t] of Object.entries(tiles)) expect([k, t.walk, t.free, t.shared], k).toEqual([k, true, true, []]);
  expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

// Old saves (D2105): nothing is written at load; a save at any Brightgate or Kilnmouth point loads and has a way out.
const OLD = [
  ['Kilnmouth, before the permit', CREW, { map: 'kilnmouth', x: 27, y: 37, facing: 'up' }],
  ['the works yard, twin lead read, never ridden', TWIN, { map: 'kilnmouth', x: 51, y: 20, facing: 'up' }],
  ['Gate Plaza from a debug placement (no shuttle flags)', Object.assign({}, TWIN, { 'story.reached_brightgate': true }), { map: 'brightgate', x: 36, y: 37, facing: 'up' }],
  ['Old Wick (no shuttle flags)', Object.assign({}, TWIN, { 'story.reached_brightgate': true }), { map: 'bg_oldtown', x: 62, y: 20, facing: 'left' }],
  ['the Brightgate Lantern House after Hall 4', H4, { map: 'bg_lantern_in', x: 6, y: 11, facing: 'up' }],
  ['Kilnmouth after the council', COUNCIL, { map: 'kilnmouth', x: 27, y: 37, facing: 'up' }],
];
for (const [who, fl, at] of OLD) {
  test(`BS6 an old save at ${who} loads unchanged and walks out`, async ({ page }) => {
    const s = save(fl, at);
    await boot(page, s, { plain: true });
    await page.waitForTimeout(400);
    const st = await stored(page);
    expect(st.v).toBe(2);
    for (const k of Object.keys(s.flags)) expect(st.flags[k], k).toEqual(s.flags[k]);
    expect(Object.keys(st.flags).filter(k => !(k in s.flags) && /^story\.(bg_|reached_brightgate)/.test(k))).toEqual([]);
    for (const k of Object.keys(s)) expect(Object.keys(st), k).toContain(k);
    expect(await page.evaluate(() => [PixelPets.state.world.map, PixelPets.state.world.x, PixelPets.state.world.y])).toEqual([at.map, at.x, at.y]);
    expect(await page.evaluate(() => !!PixelPets.scene)).toBe(false);
    // a way out, on foot from where the save stands (?debug=1 only for the read-only path check): Kilnmouth by Claybank Road
    // (unchanged); a Brightgate room or district by its way to Gate Plaza; Gate Plaza by the home mark 32,38
    await gotoGame(page, '?debug=1');
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state);
    await page.evaluate(() => PixelPets.showTab('walk'));
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
    const goal = await page.evaluate(() => { const id = PixelPets.mapInfo.id, to = id === 'kilnmouth' ? 'km_road' : 'brightgate';
      return id === 'brightgate' ? [{ x: 32, y: 38 }] : (window.WORLD[id].objs || []).filter(o => o.kind === 'warp' && o.to === to).map(o => ({ x: o.x, y: o.y })); });
    expect(goal.length, 'a way out of ' + at.map).toBeGreaterThan(0);
    const p = await page.evaluate(g => PixelPets.findPath(g), goal);
    expect(Array.isArray(p) && p.length > 0, 'a path out from ' + at.map).toBe(true);
    if (at.map === 'kilnmouth') return;
    await page.evaluate(() => PixelPets.goto('brightgate', 32, 37, 'down')); await settled(page, 'brightgate');
    await closeSay(page);   // a save without story.bg_shuttle hears the first-ride line on 32,37 once
    await step(page, 'down'); await settled(page, 'hearthmoor');
    expect((await where(page)).slice(0, 3)).toEqual(['hearthmoor', 18, 8]);
  });
}

test('BS7 quest rows (D2106): B4 to B5 and H4 to B6 read their text, place and target at each stage @w1', async ({ page }) => {
  await boot(page, save(TWIN));
  const rows = await page.evaluate(([MET, CREW, TWIN, IN_BG, H4, HOME]) => {
    const Q = window.PPQuests, at = f => { const q = Q.current({ flags: f, seals: {}, pets: 1 }); return q && [q.id, q.text, q.place, q.target || null]; };
    return { met: at(MET), crew: at(CREW), twin: at(TWIN), inbg: at(IN_BG), h4: at(H4), home: at(HOME),
      glim: [Q.resolve(Q.byId('bg_ride'), { flags: { 'story.side': 'glimmer' } }).text, Q.resolve(Q.byId('bg_home'), { flags: { 'story.side': 'glimmer' } }).text],
      check: Q.devCheck(MAPDATA), notSteps: ['story.bg_shuttle', 'story.bg_shuttle_hm'].every(f => Q.NOT_STEPS.includes(f)) };
  }, [MET, CREW, TWIN, IN_BG, H4, Object.assign({}, H4, { 'story.bg_shuttle_hm': true })]);
  expect(rows.twin).toEqual(Q_B5);
  expect(rows.h4).toEqual(Q_H4);
  // reached_brightgate and km_permit_seen, no seal4: the Hall row, never the Governor's km_report (Iris's call on the quest gap)
  expect(rows.inbg).toEqual(Q_HALL);
  expect(rows.glim).toEqual([Q_B5[1], Q_H4[1]]);   // one copy serves both sides
  for (const k of ['met', 'crew', 'inbg', 'home']) { expect(rows[k] && rows[k][0], k).not.toBe('bg_ride'); expect(rows[k] && rows[k][0], k).not.toBe('bg_home'); }
  expect(rows.check).toEqual([]);
  expect(rows.notSteps).toBe(true);
  // the tracked cue points at the works yard mark from the yard
  expect(await page.evaluate(() => PixelPets.quest.target)).toEqual(Q_B5[3]);
});
