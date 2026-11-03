/* DAY1_TRIAL1_FLOW §6 and Slice 3 (Vincent, Nov 2, 2026): quest markers follow NPC schedules and routines, so the
   holder can always find the person a step needs. For every main step that needs a person, at every hour of a weekday,
   a Saturday and a Sunday, the marker's map and tile hold that person's body. Lizzy's own rows (school, diner, court,
   5B) are followed too. Read only: nothing is written to the save. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const BASE = { 'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true,
  'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true, 'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true };
// One row per step that needs a person: the flags that make it the current main step, who it needs, and (pinned) where.
const STEPS = [
  { id: 'fen_dusk', who: 'Master Fen', flags: {} },
  { id: 'fen_home', who: 'Master Fen', flags: { 'story.crates_seen': true } },
  { id: 'home_trip', who: 'Mom', flags: { 'story.crates_seen': true, 'story.fen_sent_home': true } },
  { id: 'home_trip', who: 'Mom', flags: { 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.mom_met': true, 'story.mom_chore': true }, mirrorOf: 'mom_sent' },
  { id: 'mom_class', who: 'Mom', flags: { 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_started': true, 'story.dream_toy': true, 'story.dream_party': true, 'story.dream_dad': true, 'story.dream_woke': true } },
  { id: 'lizzy_class', note: 'not met before', who: 'Lizzy', pin: { map: 'hm_school_in', x: 10, y: 3 }, flags: { 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.dream_woke': true, 'story.class_sent': true } },
  { id: 'lizzy_class', note: 'met', who: 'Lizzy', pin: { map: 'hm_school_in', x: 10, y: 3 }, flags: { 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.dream_woke': true, 'story.class_sent': true, 'story.lizzy_met': true } },
  { id: 'hall1', who: 'Master Fen', flags: { 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.dream_woke': true, 'story.class_sent': true, 'story.lizzy_class': true, 'story.lizzy_met': true, 'trainer.h1_cadet': true, 'trainer.h1_challenger': true, 'trainer.h1_local': true } },
  // POST_TRIAL_CRACKDOWN: post_trial is the Lantern House night (Amos); D1333: then Warden Ilse at the Lodge.
  { id: 'post_trial', who: 'Keeper Amos', flags: { 'story.crackdown': true, 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.dream_woke': true, 'story.class_sent': true, 'story.lizzy_class': true, 'story.lizzy_met': true, 'story.seal1': true }, seal: true },
  { id: 'warden_summons', who: 'Warden Ilse', flags: { 'story.crackdown': true, 'story.post_trial_done': true, 'story.warden_called': true, 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.dream_woke': true, 'story.class_sent': true, 'story.lizzy_class': true, 'story.lizzy_met': true, 'story.seal1': true }, seal: true },
];
const DAYS = ['mon', 'sat', 'sun'];

function save(flags, seal) {
  const s = starterSave();
  Object.assign(s.flags, BASE, flags);
  s.world = { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' };
  if (seal) s.seals = { seal_fernbrook: Date.now() };
  return s;
}
async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.whoAt === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
}
// In the page: every hour of each day, the marker target and who stands there.
const sweep = (page, days) => page.evaluate(days => {
  const out = [];
  for (const day of days) for (let h = 0; h < 24; h++) {
    PixelPets.clock.set(day, h, 30); PixelPets.clock.freeze(true);
    const q = PixelPets.quest, t = q && q.target;
    out.push({ day, h, id: q && q.id, mirrorOf: q && q.mirrorOf, target: t, who: t ? PixelPets.whoAt(t.map, t.x, t.y) : null });
  }
  return out;
}, days);

for (const row of STEPS) {
  test(`${row.id}${row.mirrorOf ? ' (' + row.mirrorOf + ')' : ''}${row.note ? ' (' + row.note + ')' : ''}: the marker holds ${row.who} at every hour`, async ({ page }) => {
    test.setTimeout(60000);
    const before = JSON.stringify(save(row.flags, row.seal).flags);
    await boot(page, save(row.flags, row.seal));
    const res = await sweep(page, DAYS);
    for (const r of res) {
      const tag = `${row.id} ${r.day} ${r.h}:30 -> ${JSON.stringify(r.target)} has ${JSON.stringify(r.who)}`;
      expect(r.id, tag).toBe(row.id);
      if (row.mirrorOf) expect(r.mirrorOf, tag).toBe(row.mirrorOf);
      expect(r.who, tag).toContain(row.who);
      if (row.pin) expect({ map: r.target.map, x: r.target.x, y: r.target.y }, tag).toEqual(row.pin);
    }
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
    expect(after.v).toBe(2);
    expect(JSON.stringify(save(row.flags, row.seal).flags)).toBe(before);
  });
}

test('the class pins Lizzy, Buddy, Pip and Wren at the Schoolhouse at any hour; after it her rows come back and the cue follows them', async ({ page }) => {
  test.setTimeout(60000);
  const pinned = { 'story.crates_seen': true, 'story.fen_sent_home': true, 'story.dream_woke': true, 'story.class_sent': true, 'story.lizzy_met': true };
  await boot(page, save(pinned));
  const during = await page.evaluate(() => {
    const out = [];
    for (const [day, h] of [['mon', 10], ['mon', 21], ['tue', 3], ['tue', 18], ['sat', 11], ['sun', 15]]) {
      PixelPets.clock.set(day, h, 0); PixelPets.clock.freeze(true);
      out.push({ day, h, room: PixelPets.whoAt('hm_school_in', 10, 3), buddy: PixelPets.whoAt('hm_school_in', 9, 3), pip: PixelPets.whoAt('hm_school_in', 3, 4), wren: PixelPets.whoAt('hm_school_in', 6, 4), plaza: PixelPets.whoAt('hearthmoor', 9, 20), where: PixelPets.whereNow('Lizzy').place });
    }
    return out;
  });
  for (const r of during) {
    const tag = JSON.stringify(r);
    expect(r.room, tag).toContain('Lizzy');
    expect(r.buddy, tag).toContain('Buddy');
    expect(r.pip, tag).toContain('Pip');
    expect(r.wren, tag).toContain('Wren');
    expect(r.plaza, tag).not.toContain('Lizzy');
    expect(r.where, tag).toBe('Schoolhouse');
  }
  // After the class: weekday school 8-3, Tue/Thu diner 5-7 PM, Saturday court 9-1, else home in 5B. The cue follows her.
  await page.evaluate(() => PixelPets.setFlag('story.lizzy_class', true));
  const after = await page.evaluate(() => {
    const out = [];
    for (const [day, h] of [['mon', 10], ['mon', 21], ['tue', 18], ['thu', 17], ['sat', 11], ['sat', 15], ['sun', 10]]) {
      PixelPets.clock.set(day, h, 30); PixelPets.clock.freeze(true);
      const s = PixelPets.npcSpot('Lizzy');
      out.push({ day, h, spot: s && { map: s.map, x: s.x, y: s.y }, who: s ? PixelPets.whoAt(s.map, s.x, s.y) : null });
    }
    return out;
  });
  const want = { 'mon10': 'hm_school_in', 'mon21': 'hm_flats_5', 'tue18': 'hm_diner', 'thu17': 'hm_diner', 'sat11': 'hearthmoor', 'sat15': 'hm_flats_5', 'sun10': 'hm_flats_5' };
  for (const r of after) {
    const tag = JSON.stringify(r);
    expect(r.spot && r.spot.map, tag).toBe(want[r.day + r.h]);
    expect(r.who, tag).toContain('Lizzy');
  }
});
