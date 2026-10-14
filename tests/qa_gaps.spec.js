/* Gaps the other specs leave open: map loops, the end card beside Mahopac, the live glimmer
   hall line, a fainted lead with someone still standing, and the minigame dev check.
   See tests/README.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const END_TEXT = "That's all for now. Explore, fill the Journal, and grow your friendships.";
const HALL_KEEPERS = 'The Trial Hall doors are open. Challenge Master Fen for the Fernbrook Seal.';
const HALL_GLIMMER = "Juniper's partnership tour ends at the Trial Hall. Fen's match is optional.";
const HALL_PLACE = 'Fernbrook Trial Hall';
const MAHOPAC_TEXT = 'Take your Walkling up the north trail to Mahopac.';

function benchSave() {
  const save = starterSave();
  save.party.push({
    id: 'petsmoke2', species: 'tide', stage: 0, xp: 10,
    hunger: 80, happy: 60, energy: 90, nick: null, origin: 'wild',
  });
  return save;
}

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.forceBattle === 'function');
}

async function bootBench(page) {
  await installSave(page.context(), benchSave(), { quietDay: true });
  await gotoDebug(page);
}

// Opens a battle, knocks the lead to 0 HP with a guaranteed hit, and waits until the game
// either asks who goes next or shows the end card. `mode` is 'up' (bench has HP, low energy) or 'down'.
async function knockOutLead(page, kind, mode) {
  const opened = await page.evaluate((kind) => {
    PixelPets.battle.textMs = 1;
    PixelPets.showTab('walk');
    if (kind === 'trainer') return PixelPets.forceTrainer('route1_pia');
    return PixelPets.forceBattle('tide/0', 3);
  }, kind);
  expect(opened).toBe(true);
  await page.waitForFunction(() => {
    const b = window.PixelPets.battle;
    return b && b.on && b.state === 'CHOOSE' && b.panel === 'acts';
  });
  const started = await page.evaluate((mode) => {
    const min = STAT_RULES.MOOD.minBattleNrg;
    const bench = PixelPets.state.party.find((p) => p.id === 'petsmoke2');
    if (!bench) return 'no-bench';
    if (mode === 'down') {
      bench.energy = min;
      bench.hpNow = 0;
      bench.faintUntil = Date.now() + 10 * 60000;
    } else {
      bench.energy = min - 1;
      delete bench.hpNow;
      delete bench.faintUntil;
    }
    PixelPets.setMoves(['stoke_up']);
    PixelPets.battle.rng = () => 0;
    PixelPets.battle.foePlan = { move: 'wobble' };
    if (!PixelPets.setHp('me', 1)) return 'no-hp';
    const fight = document.querySelector('[data-bact="fight"]');
    if (!fight) return 'no-fight';
    fight.click();
    const mv = document.querySelector('#btMoves button[data-move="stoke_up"]');
    if (!mv || mv.disabled) return 'no-move';
    mv.click();
    return 'go';
  }, mode);
  expect(started).toBe('go');
  await page.waitForFunction(() => {
    const b = window.PixelPets.battle;
    if (!b) return false;
    const sheet = document.querySelector('#ovSheet');
    const title = document.querySelector('#shTitle');
    const swap = sheet && !sheet.hidden && title && title.textContent === 'Who goes next?';
    return swap || b.panel === 'end';
  }, null, { timeout: 15000 });
  return page.evaluate(() => {
    const b = PixelPets.battle;
    const buttons = [...document.querySelectorAll('#shList button')].map((el) => ({
      disabled: el.disabled,
      text: el.textContent,
    }));
    return {
      on: b.on,
      kind: b.kind,
      result: b.result,
      panel: b.panel,
      me: b.me && b.me.petId,
      foeHp: b.foes && b.foes[0] ? b.foes[0].hp : 0,
      sheet: !document.querySelector('#ovSheet').hidden,
      title: document.querySelector('#shTitle').textContent,
      endHidden: document.querySelector('#btEnd').hidden,
      endTitle: document.querySelector('#btEndTitle').textContent,
      buttons,
      log: b.log.slice(),
      party: PixelPets.state.party.map((p) => ({
        id: p.id,
        energy: p.energy,
        hp: Number.isFinite(p.hpNow) ? p.hpNow : null,
        faint: !!(p.faintUntil && p.faintUntil > Date.now()),
      })),
      minNrg: STAT_RULES.MOOD.minBattleNrg,
    };
  });
}

test('map loops follow town, route, dream, charity, chapel, and arcade', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  const got = await page.evaluate(() => {
    const ids = ['hearthmoor', 'fernbrook', 'cobblecrest', 'hm_home_in', 'cc_hall_in', 'route2', 'proto', 'dream_2004', 'highcharity', 'hc_airport_in', 'hc_church_in', 'hc_hall_in', 'route2_glen', 'no-such-map'];
    const tracks = {};
    ids.forEach((id) => { tracks[id] = PixelPets.mapTrack(id); });
    const dream = MAPDATA.mahopac.maps.dream_2004;
    const glen = MAPDATA.act1_route2.maps.route2_glen;
    const rooms = MAPDATA.highcharity.rooms;
    const church = rooms.hc_church_in;
    const hall = rooms.hc_hall_in;
    const air = rooms.hc_airport_in;
    const meadow = MAPDATA.maps_slice.maps.proto;
    return {
      check: PixelPets.musicCheck(),
      ids: PixelPets.musicIds(),
      tracks,
      dream: { kind: dream.kind, backdrop: dream.backdrop, dream: dream.dream, music: dream.music || null },
      glen: { backdrop: glen.backdrop, music: glen.music || null, dream: glen.dream || null },
      church: { kind: church.kind, backdrop: church.backdrop, music: church.music },
      hall: { kind: hall.kind, backdrop: hall.backdrop, music: hall.music },
      air: { kind: air.kind, backdrop: air.backdrop, music: air.music },
      meadow: meadow.backdrop,
    };
  });
  expect(got.check).toEqual([]);
  for (const id of ['town', 'route', 'charity', 'chapel', 'arcade']) expect(got.ids).toContain(id);
  expect(got.tracks.hearthmoor).toBe('town');
  expect(got.tracks.fernbrook).toBe('town');
  expect(got.tracks.cobblecrest).toBe('town');
  expect(got.tracks.hm_home_in).toBe('town');
  expect(got.tracks.cc_hall_in).toBe('town');
  expect(got.tracks.route2).toBe('route');
  expect(got.meadow).toBe('meadow');
  expect(got.tracks.proto).toBe('route');
  expect(got.dream).toEqual({ kind: 'interior', backdrop: 'town', dream: 'young', music: null });
  expect(got.tracks.dream_2004).toBe('route');
  expect(got.tracks.highcharity).toBe('charity');
  expect(got.air).toEqual({ kind: 'interior', backdrop: 'town', music: 'charity' });
  expect(got.tracks.hc_airport_in).toBe('charity');
  expect(got.church).toEqual({ kind: 'interior', backdrop: 'town', music: 'chapel' });
  expect(got.tracks.hc_church_in).toBe('chapel');
  expect(got.hall).toEqual({ kind: 'interior', backdrop: 'town', music: 'arcade' });
  expect(got.tracks.hc_hall_in).toBe('arcade');
  expect(got.glen).toEqual({ backdrop: 'grove', music: null, dream: null });
  expect(got.tracks.route2_glen).toBeNull();
  expect(got.tracks['no-such-map']).toBeNull();
});

test('story.cobble_end is the end card, and Mahopac stays a side objective', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const got = await page.evaluate(() => {
    PixelPets.setFlag('story.cobble_end', true);
    const end = PixelPets.quest;
    PixelPets.setFlag('story.mom_met', true);
    PixelPets.setFlag('story.mom_chore', true);
    PixelPets.setFlag('story.mom_sent', true);
    const pets = PixelPets.state.party.length + PixelPets.state.box.length;
    const side = PPQuests.sideCurrent({ flags: PixelPets.state.flags, seals: PixelPets.state.seals, pets });
    const saved = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      id: PixelPets.quest.id,
      text: PixelPets.quest.text,
      place: PixelPets.quest.place,
      before: end && end.id,
      sideId: side && side.id,
      sideText: side && side.text,
      cobble: PixelPets.state.flags['story.cobble_end'],
      v: PixelPets.state.v,
      savedV: saved && saved.v,
    };
  });
  expect(got.before).toBe('end');
  expect(got.id).toBe('end');
  expect(got.text).toBe(END_TEXT);
  expect(got.place).toBe('The Amberwild');
  expect(got.sideId).toBe('mahopac');
  expect(got.sideText).toBe(MAHOPAC_TEXT);
  expect(got.cobble).toBe(true);
  expect(got.v).toBe(2);
  expect(got.savedV).toBe(2);
});

test('a glimmer pledge at the Fernbrook hall step shows the glimmer hall line', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const keepers = await page.evaluate(() => {
    PixelPets.setFlag('story.orchard_cleared', true);
    const q = PixelPets.quest;
    return { id: q.id, text: q.text, place: q.place };
  });
  expect(keepers).toEqual({ id: 'hall1', text: HALL_KEEPERS, place: HALL_PLACE });
  const glimmer = await page.evaluate(() => {
    PixelPets.setSide('glimmer');
    const q = PixelPets.quest;
    return { id: q.id, text: q.text, place: q.place, side: PixelPets.side };
  });
  expect(glimmer).toEqual({ id: 'hall1', text: HALL_GLIMMER, place: HALL_PLACE, side: 'glimmer' });
});

for (const kind of ['wild', 'trainer']) {
  test(`a fainted lead keeps a ${kind} battle going while the bench still has HP`, async ({ page }) => {
    await bootBench(page);
    const snap = await knockOutLead(page, kind, 'up');
    expect(snap.kind).toBe(kind);
    expect(snap.on).toBe(true);
    expect(snap.result).toBeNull();
    expect(snap.sheet).toBe(true);
    expect(snap.title).toBe('Who goes next?');
    expect(snap.endHidden).toBe(true);
    expect(snap.me).toBe('petsmoke1');
    expect(snap.foeHp).toBeGreaterThan(0);
    const ready = snap.buttons.filter((b) => !b.disabled);
    const benched = snap.buttons.filter((b) => b.disabled);
    expect(ready).toHaveLength(1);
    expect(ready[0].text).toContain('LOW NRG');
    expect(benched).toHaveLength(1);
    expect(benched[0].text).toContain('(in battle)');
    const lead = snap.party.find((p) => p.id === 'petsmoke1');
    const bench = snap.party.find((p) => p.id === 'petsmoke2');
    expect(lead.hp).toBe(0);
    expect(lead.faint).toBe(true);
    expect(bench.hp).toBeNull();
    expect(bench.faint).toBe(false);
    expect(bench.energy).toBe(snap.minNrg - 1);
    expect(snap.log.some((line) => /whole team is worn out/.test(line))).toBe(false);
  });
}

test('a fainted lead ends the battle when every other party member is already down', async ({ page }) => {
  await bootBench(page);
  const snap = await knockOutLead(page, 'wild', 'down');
  expect(snap.kind).toBe('wild');
  expect(snap.on).toBe(true);
  expect(snap.result).toBe('tired');
  expect(snap.panel).toBe('end');
  expect(snap.endHidden).toBe(false);
  expect(snap.endTitle).toBe('Your team is worn out...');
  expect(snap.sheet).toBe(false);
  expect(snap.me).toBe('petsmoke1');
  const lead = snap.party.find((p) => p.id === 'petsmoke1');
  const bench = snap.party.find((p) => p.id === 'petsmoke2');
  expect(lead.hp).toBe(0);
  expect(lead.faint).toBe(true);
  expect(bench.hp).toBe(0);
  expect(bench.faint).toBe(true);
  expect(bench.energy).toBeGreaterThanOrEqual(snap.minNrg);
  expect(snap.log.some((line) => /whole team is worn out/.test(line))).toBe(true);
});

test('the minigame dev check is empty', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  const problems = await page.evaluate(() => window.PPMinigames.devCheck());
  expect(problems).toEqual([]);
});
