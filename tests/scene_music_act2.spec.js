/* SCENE_MUSIC v0.1, slice 4 and the supper cue of slice 5 (design specs/SCENE_MUSIC.md; D1890-D1909, settled Wed Nov 4, 2026), on
   the Act 2 opener: Ilse's posting wants `ledger` (C10), the Governor meeting keeps the capital's own loop (C11, no step), and Mom's
   supper wants `hearth` (C12). The loops, `hush` and the two stingers are the same sfx.js block as the main build PR (the §4.1
   literal; tests/scene_music.spec.js there checks the Act 1 cues). Every cue is a plain ["music", id] step in the scene's own data
   (data/detail_zzz_act2_opener.json, data/detail_zzz_act2_cover.json); trackFor, music(), the music step, the Settings rows and the
   iPhone audio path are unchanged. Saves seed Modern controls (Vincent's standing QA rule). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const SCENE_IDS = ['curfew', 'president', 'ledger', 'dawn', 'hearth', 'sweet', 'storm', 'hush'];
// FNV-1a of JSON.stringify(musicSpec(id)), computed from the design literal (SCENE_MUSIC.md §4.1); the stingers' rows likewise.
const LITERAL_FNV = { curfew: 'b468198a', president: 'aa3fce1e', ledger: '94f05fb3', dawn: '3db394b2', hearth: '9e25f6f6',
  sweet: '91301751', storm: '944bc253', hush: '7be60263' };
const STINGER_FNV = { ink: 'c233ff12', call: '6fb371c1' };
// Every loop this branch already had keeps its spec (the same hashes as on main for these ids).
const BASE_SPEC_FNV = { town: 'ae1a7a77', route: '5acf6566', battle: 'e0248118', charity: '5201d8eb', chapel: '4d644eb4', arcade: 'a7dabf56',
  wild_skip: 'be947cca', wild_romp: 'ec032d57', wild_spark: '71933125', glimmer_first: '853bfef1', glimmer_battle: '702a4c4d',
  town_glimmer: 'e0b44cf3', quarry: '1bc66c3b', grove: '4fb3ee32', trial: '8933c548', rival: '19362918', hall: '605c2dc0',
  harbour: 'e10c15be', route3: '28044496', lab: '588d4f16', dream: 'ca939dc8', arbiter_test: '17c46c8c', episode_end: 'e755ae15',
  starter_pick: '7ec8e5d3' };
const BUILT_STINGERS = ['seal', 'item', 'befriend', 'levelup', 'evolve', 'starter'];
const LODGE = 'hm_lodge_in';

// A Cadet after the recall and the Lantern Council (as tests/act2_cover_story.spec.js), before or after Ilse's posting.
const CADET = {
  'story.reached_route1': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.dream_study': true, 'story.lizzy_met': true, 'story.seal1': true, 'story.crackdown': true, 'story.post_trial_done': true,
  'story.phone_got': true, 'story.warden_called': true, 'story.warden_met': true, 'story.chi_done': true, 'story.shift_g': true,
  'story.orchard_lean': 'pack', 'story.orchard_cleared': true, 'story.sway_fernbrook': -2, 'story.ilse_call2': true,
  'story.keeper_cadet': true, 'story.cover': 'glimmer', 'story.side': 'keepers', 'story.side_pick_done': true, 'story.seal2': true,
  'story.seal3': true, 'story.route3_open': true, 'story.ep1_end': true, 'story.ilse_call3': true, 'story.a2_called': true,
  'story.cover_done': true, 'story.rpt_1': 'told', 'story.rpt_2': 'told', 'story.rpt_3': 'told', 'story.hc_council_done': true,
};
function cadetSave(extra, world) {
  const s = starterSave();
  Object.assign(s.settings, { controls: 'modern', textSpeed: 'fast', tips: false, follower: false, music: true, musicVol: 0.5 });
  Object.assign(s.flags, CADET, extra || {});
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({ map: LODGE, x: 5, y: 7, facing: 'down', respawn: 'hearthmoor' }, world || {});
  s.seals = { seal_fernbrook: 1700000000000, seal_glim_1: 1700000000000, seal_glim_2: 1700000000000, seal_glim_3: 1700000000000 };
  s.standing = { keepers: 10, glimmer: 0 };
  return s;
}
// mute: the stored Sound setting ('1' = Sound OFF, the suite's default; '0' = Sound ON, no gesture yet).
async function boot(page, { s = cadetSave(), mute = '1', reduce = false } = {}) {
  if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await page.addInitScript((m) => {
    localStorage.setItem('pixelpets.mute', m);
    const AC = window.AudioContext || window.webkitAudioContext;
    const spy = window.__spy = { gains: [], osc: 0, made: 0, targets: [] };
    if (!AC) return;
    const wrap = (name, onMake) => { const f = AC.prototype[name]; AC.prototype[name] = function () { const n = f.apply(this, arguments); spy.made++; if (onMake) onMake(n); return n; }; };
    wrap('createGain', (g) => { if (/startTrack/.test(new Error().stack || '')) spy.gains.push(g); });
    wrap('createOscillator', () => { spy.osc++; });
    wrap('createBiquadFilter'); wrap('createBufferSource');
    const conn = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (to) { this.__to = to; if (to instanceof AudioDestinationNode) this.__master = true; return conn.apply(this, arguments); };
    for (const k of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues']) {
      const f = AudioParam.prototype[k];
      AudioParam.prototype[k] = function (v) { spy.targets.push({ p: this, m: k, v: k === 'cancelScheduledValues' ? null : v }); return f.apply(this, arguments); };
    }
    window.__bus = () => { for (let i = spy.gains.length - 1; i >= 0; i--) if (spy.gains[i].__to && spy.gains[i].__to.__master) return spy.gains[i]; return null; };
    const arm = () => {
      if (typeof PPSound === 'undefined' || !window.PixelPets) { setTimeout(arm, 10); return; }
      if (window.__music) return;
      window.__music = [];
      const orig = PPSound.music;
      PPSound.music = function (id, opt) { window.__music.push([id, opt ? JSON.parse(JSON.stringify(opt)) : null]); return orig.call(this, id, opt); };
    };
    arm();
  }, mute);
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0] && window.__music);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
  if (reduce) expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}
async function soundOn(page) {
  await page.evaluate(() => { PPSound.setMuted(false); PPSound.setMusic(true, true); PPSound.musicVol = 0.5; });
  await expect.poll(() => page.evaluate(() => PPSound.state)).toBe('running');
}
const busCalls = (page, from = 0) => page.evaluate((from) => {
  const n = window.__bus(); if (!n) return null;
  return window.__spy.targets.slice(from).filter(t => t.p === n.gain).map(t => [t.m, t.v == null ? null : Math.round(t.v * 10000) / 10000]);
}, from);
const mark = page => page.evaluate(() => window.__spy.targets.length);
const want = page => page.evaluate(() => PPSound.musicWant);
// a line is on screen, fully typed and waiting for the tap (so a Space press answers it, even on a slow machine)
const lineShows = (page, text) => expect.poll(() => page.evaluate(() => !!PixelPets.scene && PixelPets.scene.mode === 'say' && PixelPets.scene.waiting && PixelPets.scene.full && PixelPets.scene.text)).toBe(text);
const calls = page => page.evaluate(() => window.__music.map(c => c[0]));
// Plays the open scene to its end: lines, choices (from `picks`, else the first) and auto beats. Returns [[text, musicWant], ...].
async function drive(page, picks = [], ms = 60000) {
  const until = Date.now() + ms, seen = new Set(), lines = [];
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, want: PPSound.musicWant });
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      const pick = labels.find(l => picks.includes(l)) || labels[0];
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.waitForTimeout(30); continue; }
      if (!seen.has(sc.text)) { seen.add(sc.text); lines.push([sc.text, sc.want]); }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const at = (lines, re) => { const l = lines.find(([t]) => re.test(t)); if (!l) throw new Error('no line ' + re); return l[1]; };
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading && !PixelPets.scene, map);
  await page.waitForTimeout(200);
}
async function run(page, id, picks) {
  expect(await page.evaluate((id) => PixelPets.runScene(id), id), id).toBe(true);
  return drive(page, picks);
}

test.describe('SCENE_MUSIC slices 4-5 on the Act 2 opener: the posting and Mom\'s supper', () => {
  test('T1: the loops and stingers are the spec literal; musicCheck is clean; every loop already here is unchanged', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(async ([ids]) => {
      const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); };
      const out = { check: PPSound.musicCheck(), hash: {}, others: {}, names: PPSound.names.filter(n => /^stinger_/.test(n)) };
      for (const id of ids) out.hash[id] = fnv(JSON.stringify(PPSound.musicSpec(id)));
      for (const id of PPSound.musicIds()) if (!ids.includes(id)) out.others[id] = fnv(JSON.stringify(PPSound.musicSpec(id)));
      const src = await (await fetch('sfx.js', { cache: 'no-store' })).text();
      const i = src.indexOf('  const STINGERS = {'), j = src.indexOf('\n  };\n', i);
      const ST = new Function(src.slice(i, j + 5) + '\nreturn STINGERS;')();
      out.st = { ink: fnv(JSON.stringify(ST.ink)), call: fnv(JSON.stringify(ST.call)) };
      return out;
    }, [SCENE_IDS]);
    expect(r.check).toEqual([]);
    expect(r.hash, 'each loop equals the SCENE_MUSIC §4.1 literal').toEqual(LITERAL_FNV);
    expect(r.others).toEqual(BASE_SPEC_FNV);
    expect(r.st).toEqual(STINGER_FNV);
    expect(r.names).toEqual(BUILT_STINGERS.concat(['ink', 'call']).map(k => 'stinger_' + k));
  });

  test('T9 C10 C11: the posting wants ledger from Ilse\'s first line, the Lodge loop after; the call and the Governor carry no cue', async ({ page }) => {
    await boot(page);
    await soundOn(page);
    expect(await want(page)).toBe('town');
    const lines = await run(page, 'a2_posting');
    expect(at(lines, /Sit, Cadet\. Brinewick reached me/)).toBe('ledger');
    expect(at(lines, /In person, not on the wire/)).toBe('ledger');
    expect(lines.every(([, w]) => w === 'ledger')).toBe(true);
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['town', 'town']);
    expect(await calls(page)).toEqual(['ledger', 'town']);
    const data = await page.evaluate(async () => {
      const j = async f => (await (await fetch('data/' + f, { cache: 'no-store' })).json()).scenes;
      const a = await j('detail_zzz_act2_opener.json'), b = await j('detail_zzz_act2_cover.json'), c = await j('hc_city_v2.json');
      const cues = steps => JSON.stringify(steps).match(/\["music","[a-z_]+"/g) || [];
      const all = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, cues(v)]).filter(([, v]) => v.length));
      return { opener: all(a), cover: all(b), city: all(c), first: [a.a2_posting[0], b.cv_mom_gate[0], b.cv_mom_supper[0]] };
    });
    const m = id => '["music","' + id + '"';
    expect(data).toEqual({ opener: { a2_posting: [m('ledger')] }, cover: { cv_mom_gate: [m('hearth')], cv_mom_home: [m('hearth')], cv_mom_supper: [m('hearth')] },
      city: {}, first: [['music', 'ledger'], ['music', 'hearth'], ['music', 'hearth']] });
  });

  test('T9 C12: Mom wants hearth at "There you are", the town loop on the walk home, hearth again at supper, the room loop after', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page, { s: cadetSave({ 'story.gov_posted': true }, { map: 'hearthmoor', x: 12, y: 8, facing: 'left' }) });
    await soundOn(page);
    expect(await want(page)).toBe('town');
    const gate = await run(page, 'cv_mom_gate');
    expect(at(gate, /There you are\. Ilse kept you long enough/)).toBe('hearth');
    expect(await want(page)).toBe('town');   // End: the walk home hears Hearthmoor's own loop
    await goto(page, 'hm_home_room', 5, 7, 'up');
    const supper = await run(page, 'cv_mom_supper', ['Tell the truth']);
    expect(at(supper, /company lanyards in the drawer/)).toBe('hearth');
    expect(at(supper, /Is that a Glimmerwell lanyard/)).toBe('hearth');
    expect(at(supper, /So that's why you came home so tired/)).toBe('hearth');
    expect(supper.every(([, w]) => w === 'hearth')).toBe(true);
    const back = await page.evaluate(() => PixelPets.mapTrack('hm_home_room'));
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual([back, back]);
    expect((await calls(page)).filter(c => c === 'hearth').length).toBe(2);
    expect(await page.evaluate(() => window.__music.filter(c => c[0] === 'hearth').map(c => c[1]))).toEqual([{ fadeOut: 180, fadeIn: 140 }, { fadeOut: 180, fadeIn: 140 }]);
  });

  test('T9 C12: a pin save gets supper as one line at the gate or at home, on hearth', async ({ page }) => {
    const s = cadetSave({ 'story.gov_posted': true, 'story.cover': null }, { map: 'hm_home_in', x: 4, y: 8, facing: 'up' });
    s.seals = { seal_fernbrook: 1700000000000 };   // never wore the lanyard, no Glimmerwell Seal
    await boot(page, { s });
    const home = await run(page, 'cv_mom_home');
    expect(at(home, /A Keeper pin\. Look at you/)).toBe('hearth');
    expect(await want(page)).toBe(await page.evaluate(() => PixelPets.mapTrack('hm_home_in')));
  });

  test('T10 T11: hush is silent and the map loop comes back after the scene; each new stinger ducks the cue to 35 % and lets it back', async ({ page }) => {
    await boot(page);
    await soundOn(page);
    await page.evaluate(() => PixelPets.runSteps([['music', 'hearth'], ['say', 'Mom', 'One.'], ['music', 'hush'], ['say', 'Mom', 'Two.'], ['say', 'Mom', 'Three.']]));
    await lineShows(page, 'One.');
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('hearth');
    for (const id of ['stinger_ink', 'stinger_call']) {
      const m0 = await mark(page);
      expect(await page.evaluate(id => PPSound.play(id), id), id).toBe(true);
      expect(await busCalls(page, m0), id).toEqual([['setTargetAtTime', 0.175], ['setTargetAtTime', 0.5]]);
      await page.waitForTimeout(1700);
    }
    await page.keyboard.press('Space');
    await lineShows(page, 'Two.');
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['hush', 'hush']);
    await page.waitForTimeout(500);
    const n = await page.evaluate(() => window.__spy.osc);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__spy.osc), 'hush makes no oscillator').toBe(n);
    expect((await drive(page)).map(l => l[0])).toEqual(['Two.', 'Three.']);
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['town', 'town']);
    await page.evaluate(() => PPSound.setMuted(true));
    expect(await page.evaluate(() => [PPSound.play('stinger_ink'), PPSound.play('stinger_call')])).toEqual([false, false]);
  });

  test('T5 T6: Music OFF stops the cue and makes no node; Music ON brings it back; the volume row is the bus level; Sound OFF is silent', async ({ page }) => {
    await boot(page);   // Sound OFF (the stored mute)
    await page.evaluate(() => PixelPets.runSteps([['music', 'ledger'], ['say', 'Warden Ilse', 'Sit, Cadet.'], ['say', 'Warden Ilse', 'Good work.']]));
    await lineShows(page, 'Sit, Cadet.');
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, window.__spy.osc])).toEqual(['ledger', null, 0]);
    await page.evaluate(() => PPSound.setMuted(false));
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('ledger');
    await page.evaluate(() => PPSound.setMusic(false));
    const n = await page.evaluate(() => window.__spy.osc);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => [PPSound.musicTrack, PPSound.musicWant, window.__spy.osc])).toEqual([null, 'ledger', n]);
    await page.evaluate(() => PPSound.setMusic(true, true));
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('ledger');
    let m0 = await mark(page);
    await page.evaluate(() => { PPSound.musicVol = 0; });
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0]]);
    m0 = await mark(page);
    await page.evaluate(() => { PPSound.musicVol = 0.3; });
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0.3]]);
    await page.evaluate(() => PPSound.setMuted(true));
    const k = await page.evaluate(() => window.__spy.osc);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => [PPSound.musicTrack, window.__spy.osc])).toEqual([null, k]);
  });

  test('T4: nothing plays before the first tap; a Modern tap on the line starts the scene cue', async ({ page }) => {
    await boot(page, { mute: '0' });
    expect(await page.evaluate(() => [PixelPets.state.settings.controls, PPSound.muted, PPSound.musicOn])).toEqual(['modern', false, true]);
    expect(await page.evaluate(() => PixelPets.runScene('a2_posting'))).toBe(true);
    await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.full && PixelPets.scene.text)).toMatch(/Sit, Cadet/);
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, PPSound.state, window.__spy.made])).toEqual(['ledger', null, 'none', 0]);
    const box = await page.locator('#sbox').boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.3, box.y + box.height * 0.6);
    await expect.poll(() => page.evaluate(() => PPSound.state)).not.toBe('none');
    expect(await want(page)).toBe('ledger');
    if (await page.evaluate(() => PPSound.state) === 'running') await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('ledger');
  });

  test('T7 T8: the save is unchanged by the cues (v 2, no new key, no cue in any value); reduced motion changes no music call', async ({ page }) => {
    await boot(page, { reduce: true });
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
    const keys = o => Object.keys(o).sort();
    await goto(page, LODGE, 5, 7, 'down');
    const s0 = await read();
    const lines = await run(page, 'a2_posting');
    expect(lines.every(([, w]) => w === 'ledger')).toBe(true);
    const s1 = await read();
    expect(s1.v).toBe(2);
    expect(keys(s1)).toEqual(keys(s0));
    expect(s1.settings).toEqual(s0.settings);
    // the posting's own flag and its built beat mark, as without the cue
    expect(keys(s1.flags).filter(k => !(k in s0.flags))).toEqual(['story.beat.a2_posting', 'story.gov_posted']);
    for (const id of SCENE_IDS) expect(JSON.stringify(s1), id).not.toContain('"' + id + '"');
    // the same calls a full-motion posting makes (T9 C10): the cue with the built quick fade, then the room's loop again
    expect((await page.evaluate(() => window.__music)).slice(-2)).toEqual([['ledger', { fadeOut: 180, fadeIn: 140 }], ['town', { fadeOut: 400, fadeIn: 500 }]]);
  });
});
