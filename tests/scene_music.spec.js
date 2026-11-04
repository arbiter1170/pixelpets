/* SCENE_MUSIC v0.1, slices 2 and 3 (design specs/SCENE_MUSIC.md; D1890-D1909, settled Wed Nov 4, 2026): the scene loops `curfew`,
   `president`, `ledger`, `dawn`, `hearth`, `sweet`, `storm`, the silence `hush` and the stingers `stinger_ink` and `stinger_call`
   in sfx.js (the §4.1 literal; the Weir Hut's `weir` is PR #309's), and the Act 1 cues for the scenes built on main: the crackdown
   night (C1-C4), Ilse's debrief (C5), the enrolment (C8) and the recall (C9). Every cue is a plain ["music", id] step in the scene's
   own data (data/detail_zz_crackdown.json, data/detail_zz_keeper_join.json); trackFor, music(), the music step, the Settings rows
   and the iPhone audio path are unchanged. Headless Chromium runs the AudioContext once the game's own unmute (a gesture) makes it.
   A spy wraps the node factories so a test can find the track's bus and read the automation calls made on it. Saves seed Modern
   controls (Vincent's standing QA rule). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const SCENE_IDS = ['curfew', 'president', 'ledger', 'dawn', 'hearth', 'sweet', 'storm', 'hush'];
// FNV-1a of JSON.stringify(musicSpec(id)), computed from the design literal (SCENE_MUSIC.md §4.1); the stingers' rows likewise.
const LITERAL_FNV = { curfew: 'b468198a', president: 'aa3fce1e', ledger: '94f05fb3', dawn: '3db394b2', hearth: '9e25f6f6',
  sweet: '91301751', storm: '944bc253', hush: '7be60263' };
const STINGER_FNV = { ink: 'c233ff12', call: '6fb371c1' };
const SHAPE = { curfew: ['G minor', 80, 8, 8], president: ['Eb major', 84, 8, 8], ledger: ['D minor', 92, 8, 8], dawn: ['F major', 76, 8, 8],
  hearth: ['F major', 72, 8, 8], sweet: ['F Lydian', 100, 8, 8], storm: ['C minor', 104, 8, 16], hush: ['C major', 60, 1, 8] };
// Every loop on main (origin/main sfx.js, unchanged since 47fb0c6) keeps its spec.
const MAIN_SPEC_FNV = { town: 'ae1a7a77', route: '5acf6566', battle: 'e0248118', charity: '5201d8eb', chapel: '4d644eb4', arcade: 'a7dabf56',
  wild_skip: 'be947cca', wild_romp: 'ec032d57', wild_spark: '71933125', glimmer_first: '853bfef1', glimmer_battle: '702a4c4d',
  town_glimmer: 'e0b44cf3', quarry: '1bc66c3b', grove: '4fb3ee32', trial: '8933c548', rival: '19362918', hall: '605c2dc0',
  harbour: 'e10c15be', route3: '28044496', lab: '588d4f16', dream: 'ca939dc8', arbiter_test: '17c46c8c', episode_end: 'e755ae15',
  anthem_march: 'd1633a01', anthem_dark: '26a44e54', anthem_hall: '91eaaf50', starter_pick: '7ec8e5d3' };
const BUILT_STINGERS = ['seal', 'item', 'befriend', 'levelup', 'evolve', 'starter'];
const LODGE = 'hm_lodge_in';

// A new-flow save after the crackdown night (as tests/act1_keeper_join.spec.js), Modern controls.
const AFTER_NIGHT = {
  'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true,
  'story.met_fen': true, 'story.crate_a': true, 'story.crate_b': true, 'story.crate_c': true, 'story.tally_done': true,
  'story.tl_amos': true, 'story.tl_juniper': true, 'story.tl_done': true, 'story.crates_seen': true, 'story.fen_sent_home': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'trainer.h1_cadet': true,
  'trainer.h1_challenger': true, 'trainer.h1_local': true, 'trainer.hall1_fen': true, 'story.seal1': true,
  'story.crackdown': true, 'story.hall1_shut': true, 'story.post_trial_done': true, 'story.fen_lean': 2, 'story.phone_got': true,
  'story.warden_called': true,
};
function lodgeSave(extra) {
  const s = starterSave();
  Object.assign(s.settings, { controls: 'modern', textSpeed: 'fast', tips: false, follower: false, music: true, musicVol: 0.5 });
  Object.assign(s.flags, AFTER_NIGHT, extra || {});
  s.world = { map: LODGE, x: 5, y: 5, facing: 'up', respawn: 'hearthmoor' };
  s.standing = { keepers: 0, glimmer: 0 };
  s.seals = { seal_fernbrook: 1700000000000 };
  return s;
}
// The crackdown's own save (as tests/post_trial_crackdown.spec.js), Modern controls; the debug checkpoint seeds the rest.
function fernSave() {
  const s = starterSave();
  Object.assign(s.settings, { controls: 'modern', textSpeed: 'fast' });
  Object.assign(s.flags, { 'story.reached_route1': true, 'story.rival1_done': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true, 'story.phone_got': true });
  s.world = { map: 'fernbrook', x: 12, y: 8, facing: 'down', respawn: 'fernbrook' };
  s.standing = { keepers: 0, glimmer: 0 };
  return s;
}
// mute: the stored Sound setting ('1' = Sound OFF, the suite's default; '0' = Sound ON, no gesture yet).
async function boot(page, { s = lodgeSave(), mute = '1', reduce = false } = {}) {
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
    // every music() call, with the scene line showing when it was made
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
  await page.evaluate(() => PixelPets.showTab('walk'));
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
// Plays the open scene to its end: taps through lines, answers choices from `picks` (else the first) and lets auto beats run.
// Returns every line shown, with the cue wanted while it showed: [[text, musicWant], ...].
async function drive(page, picks = [], ms = 150000) {
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
      if (!sc.full) { await page.waitForTimeout(30); continue; }   // let the line finish typing, so every line is read
      if (!seen.has(sc.text)) { seen.add(sc.text); lines.push([sc.text, sc.want]); }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const at = (lines, re) => { const l = lines.find(([t]) => re.test(t)); if (!l) throw new Error('no line ' + re); return l[1]; };
async function runAtLodge(page, id) {
  expect(await page.evaluate((id) => PixelPets.runScene(id), id)).toBe(true);
  return drive(page);
}
// Walk out of the Trial Hall onto the doorstep; the crackdown starts on the first step (as tests/post_trial_crackdown.spec.js).
async function leaveHall(page) {
  await page.evaluate(() => PixelPets.goto('fb_hall_in', 7, 20));
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'fb_hall_in' && !PixelPets.fading);
  for (let i = 0; i < 8 && !(await page.evaluate(() => !!PixelPets.scene)); i++) {
    await page.evaluate(() => PixelPets.walkStep('down')); await page.waitForTimeout(260);
    await page.waitForFunction(() => !PixelPets.fading);
  }
}

test.describe('SCENE_MUSIC slices 2-3: the scene loops and the Act 1 cues', () => {
  test('T1: the loops and stingers are the spec literal; musicCheck is clean; every loop and stinger on main is unchanged', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(async ([ids]) => {
      const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); };
      const sum = n => n.reduce((s, x) => s + x[1], 0);
      const out = { check: PPSound.musicCheck(), hash: {}, shape: {}, others: {}, ok: {}, names: PPSound.names.filter(n => /^stinger_/.test(n)) };
      for (const id of ids) {
        const t = PPSound.musicSpec(id);
        out.hash[id] = fnv(JSON.stringify(t));
        out.shape[id] = [t.key, t.bpm, t.bars, t.stepsPerBar];
        out.ok[id] = sum(t.lead.notes) === t.bars * t.stepsPerBar && sum(t.bass.notes) === t.bars * t.stepsPerBar
          && [t.lead, t.bass].every(v => v.notes.every(n => n[0] === 0 || (n[0] >= 36 && n[0] <= 96)))
          && [t.lead, t.bass].every(v => v.gain > 0 && v.gain <= (v.wave === 'square' ? 0.08 : 0.35) && ['square', 'triangle'].includes(v.wave))
          && t.drums.length === t.bars && t.drums.every(b => b.length === t.stepsPerBar && /^[ksh.]+$/.test(b))
          && !t.swell && [t.lead, t.bass].every(v => v.double == null && v.gate == null);
      }
      // weir is PR #309's room loop (checked there); it is not part of this build
      for (const id of PPSound.musicIds()) if (!ids.includes(id) && id !== 'weir') out.others[id] = fnv(JSON.stringify(PPSound.musicSpec(id)));
      const src = await (await fetch('sfx.js', { cache: 'no-store' })).text();
      const i = src.indexOf('  const STINGERS = {'), j = src.indexOf('\n  };\n', i);
      const ST = new Function(src.slice(i, j + 5) + '\nreturn STINGERS;')();
      out.st = { ink: fnv(JSON.stringify(ST.ink)), call: fnv(JSON.stringify(ST.call)) };
      out.stLen = Object.fromEntries(['ink', 'call'].map(k => [k, Math.max(...ST[k].map(r => r[0] + r[2]))]));
      out.stKeys = Object.keys(ST);
      return out;
    }, [SCENE_IDS]);
    expect(r.check).toEqual([]);
    expect(r.hash, 'each loop equals the SCENE_MUSIC §4.1 literal').toEqual(LITERAL_FNV);
    expect(r.shape).toEqual(SHAPE);
    expect(r.ok).toEqual(Object.fromEntries(SCENE_IDS.map(id => [id, true])));
    expect(r.others).toEqual(MAIN_SPEC_FNV);
    expect(r.st, 'the stinger rows equal the literal').toEqual(STINGER_FNV);
    expect(r.stLen).toEqual({ ink: 1100, call: 1500 });
    expect(r.stKeys).toEqual(BUILT_STINGERS.concat(['ink', 'call']));
    expect(r.names).toEqual(BUILT_STINGERS.concat(['ink', 'call']).map(k => 'stinger_' + k));
  });

  test('T9 C1-C4: the crackdown night: curfew at the first tank, held into the Lantern House, the President, curfew again, dawn; then the map loop', async ({ page }) => {
    test.setTimeout(240000);
    await boot(page, { s: fernSave() });
    await soundOn(page);
    expect((await page.evaluate(id => PixelPets.checkpoint(id), 'crackdown_street')).ok).toBe(true);
    await leaveHall(page);
    expect(await page.evaluate(() => PixelPets.scene && PixelPets.scene.id)).toBe('crackdown_street');
    const lines = await drive(page, ['Keep it', "He's hiding something"]);
    expect(at(lines, /white beam slides up the road/)).not.toBe('curfew');      // before the first tank moves
    expect(at(lines, /this square is closed/)).toBe('curfew');                   // C1
    expect(at(lines, /Go to the Lantern House/)).toBe('curfew');
    expect(at(lines, /stay in here tonight/)).toBe('curfew');                    // C2: held over the warp (H)
    expect(at(lines, /The wire's on/)).toBe('curfew');
    expect(at(lines, /Block News, evening edition/)).toBe('president');          // C3: the wire set's first line
    expect(at(lines, /a curfew is in force tonight/)).toBe('president');
    expect(at(lines, /Good night\. Be kind in the streets/)).toBe('president');
    expect(at(lines, /Then who's been buying/)).toBe('curfew');                  // C3: back to curfew after his last line
    expect(at(lines, /Dusk to dawn/)).toBe('curfew');
    expect(at(lines, /At dawn the curfew lifts/)).toBe('dawn');                  // C4
    expect(at(lines, /sent boots/)).toBe('dawn');
    const calls = await page.evaluate(() => window.__music);
    const seq = calls.map(c => c[0]);
    const i = seq.indexOf('curfew');
    // the warp into the Lantern House plays no map loop between the first curfew and the President (the hold, M7)
    expect(seq.slice(i, seq.indexOf('president'))).toEqual(['curfew', 'curfew']);
    expect(calls[i][1]).toMatchObject({ fadeOut: 180, fadeIn: 140 });
    expect(calls.find(c => c[0] === 'dawn')[1]).toMatchObject({ fadeOut: 900, minDelay: 1600, fadeIn: 2400 });   // S
    // End: the map loop is wanted again, and plays
    const map = await page.evaluate(() => PixelPets.state.world.map);
    const back = await page.evaluate((m) => PixelPets.mapTrack(m), map);
    await expect.poll(() => want(page), { timeout: 15000 }).toBe(back);
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack), { timeout: 15000 }).toBe(back);
  });

  test('T9 C5: Ilse\'s debrief wants ledger from her first line; the Lodge loop after', async ({ page }) => {
    await boot(page);
    await soundOn(page);
    expect(await want(page)).toBe('town');
    const lines = await runAtLodge(page, 'warden_meet');
    expect(at(lines, /Sit down\. I had Fen's letter/)).toBe('ledger');
    expect(at(lines, /Say I sent you/)).toBe('ledger');
    expect(lines.every(([, w]) => w === 'ledger')).toBe(true);
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['town', 'town']);
    expect(await page.evaluate(() => window.__music.map(c => c[0]))).toEqual(['ledger', 'town']);
    // the reminder after the debrief changes nothing
    await runAtLodge(page, 'warden_after');
    expect(await page.evaluate(() => window.__music.map(c => c[0]))).toEqual(['ledger', 'town']);
  });

  test('T9 C8: the enrolment wants anthem_hall at the lanyard, not before; the Lodge loop after', async ({ page }) => {
    await boot(page, { s: lodgeSave({ 'story.warden_met': true, 'story.chi_met': true, 'story.orchard_lean': 'open', 'story.orchard_cleared': true, 'story.ilse_call2': true }) });
    const lines = await runAtLodge(page, 'enrol');
    expect(at(lines, /you're a Keeper Cadet/)).toBe('town');
    expect(at(lines, /their lanyard/)).toBe('anthem_hall');
    expect(at(lines, /Remember your home/)).toBe('anthem_hall');
    expect(await want(page)).toBe('town');
    expect(await page.evaluate(() => window.__music.filter(c => c[0] !== 'town').map(c => [c[0], c[1]]))).toEqual([['anthem_hall', { fadeOut: 180, fadeIn: 140, near: false }]]);
  });

  test('T9 C9: the recall wants ledger from Ilse\'s first line; the call before it changes nothing; the map loop after', async ({ page }) => {
    await boot(page, { s: lodgeSave({ 'story.warden_met': true, 'story.keeper_cadet': true, 'story.cover': 'glimmer', 'story.side': 'glimmer', 'story.seal3': true }) });
    expect(await want(page)).toBe('town_glimmer');   // a lanyard save hears the Glimmerwell town loop until the recall
    const lines = await runAtLodge(page, 'recall');
    expect(at(lines, /Take it off/)).toBe('ledger');
    expect(at(lines, /capital is waiting/)).toBe('ledger');
    const back = await page.evaluate(() => PixelPets.mapTrack(PixelPets.state.world.map));
    expect(await want(page)).toBe(back);
    expect(await page.evaluate(() => window.__music.map(c => c[0]))).toEqual(['ledger', back]);
    expect(back).toBe('town');   // the recall puts the Cadet back on the Keepers side
    // the data: the call card and the hut's meeting carry no music step (C7, C9); each cue sits where §5 puts it
    const data = await page.evaluate(async () => {
      const j = async f => (await (await fetch('data/' + f, { cache: 'no-store' })).json()).scenes;
      const a = await j('detail_zz_crackdown.json'), b = await j('detail_zz_keeper_join.json');
      const cues = steps => JSON.stringify(steps).match(/\["music","[a-z_]+"/g) || [];
      return { street: cues(a.crackdown_street), lantern: cues(a.crackdown_lantern), meet: cues(a.warden_meet), after: cues(a.warden_after),
        call: cues(a.ilse_call), enrol: cues(b.enrol), recall: cues(b.recall), recallCall: cues(b.ilse_recall_call), chi: cues(b.chi_meet).concat(cues(b.chi_report)),
        first: [a.warden_meet[0], b.recall[0], a.crackdown_lantern[0]] };
    });
    const m = id => '["music","' + id + '"';
    expect(data).toEqual({ street: [m('curfew')], lantern: [m('curfew'), m('president'), m('curfew'), m('dawn')], meet: [m('ledger')], after: [],
      call: [], enrol: [m('anthem_hall')], recall: [m('ledger')], recallCall: [], chi: [],
      first: [['music', 'ledger'], ['music', 'ledger'], ['music', 'curfew']] });
  });

  test('T10: hush is one bar of rests; it fades the cue out and schedules no note or drum; the map loop comes back after the scene', async ({ page }) => {
    await boot(page);
    await soundOn(page);
    expect(await page.evaluate(() => PPSound.musicSpec('hush'))).toEqual({ key: 'C major', bpm: 60, bars: 1, stepsPerBar: 8, gate: 0.9, perc: 0,
      lead: { wave: 'triangle', gain: 0.01, notes: [[0, 8]] }, bass: { wave: 'triangle', gain: 0.01, notes: [[0, 8]] }, drums: ['........'] });
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('town');
    await page.evaluate(() => PixelPets.runSteps([['music', 'ledger'], ['say', 'Warden Ilse', 'One.'], ['music', 'hush'], ['say', 'Warden Ilse', 'Two.'], ['say', 'Warden Ilse', 'Three.']]));
    await lineShows(page, 'One.');
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('ledger');
    await page.keyboard.press('Space');
    await lineShows(page, 'Two.');
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['hush', 'hush']);
    await page.waitForTimeout(500);   // ledger's 180 ms fade and the notes already scheduled have gone
    const n = await page.evaluate(() => window.__spy.osc);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__spy.osc), 'hush makes no oscillator').toBe(n);
    expect((await drive(page)).map(l => l[0])).toEqual(['Two.', 'Three.']);   // play the scene out
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['town', 'town']);
  });

  test('T11 T6: each new stinger ducks the playing cue to 35 % and lets it back; Sound OFF plays neither; the volume row is the bus level', async ({ page }) => {
    await boot(page);
    await soundOn(page);
    await page.evaluate(() => PPSound.music('curfew'));
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('curfew');
    for (const id of ['stinger_ink', 'stinger_call']) {
      const m0 = await mark(page);
      expect(await page.evaluate(id => PPSound.play(id), id), id).toBe(true);
      expect(await busCalls(page, m0), id).toEqual([['setTargetAtTime', 0.175], ['setTargetAtTime', 0.5]]);
      await page.waitForTimeout(1700);
    }
    let m0 = await mark(page);
    await page.evaluate(() => { PPSound.musicVol = 0; });
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0]]);
    m0 = await mark(page);
    await page.evaluate(() => { PPSound.musicVol = 0.3; });
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0.3]]);
    m0 = await mark(page);
    expect(await page.evaluate(() => PPSound.play('stinger_ink'))).toBe(true);
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0.105], ['setTargetAtTime', 0.3]]);
    await page.waitForTimeout(1300);
    await page.evaluate(() => PPSound.setMuted(true));
    expect(await page.evaluate(() => [PPSound.play('stinger_ink'), PPSound.play('stinger_call'), PPSound.stingers, PPSound.musicTrack])).toEqual([false, false, [], null]);
  });

  test('T5: Music OFF stops a scene cue and makes no node; Music ON brings it back; Sound OFF makes no node; Sound ON brings it back', async ({ page }) => {
    await boot(page);   // Sound OFF (the stored mute)
    await page.evaluate(() => PixelPets.runSteps([['music', 'president'], ['say', 'The President', 'Good evening.'], ['say', 'The President', 'Good night.']]));
    await lineShows(page, 'Good evening.');
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, PPSound.muted, window.__spy.osc])).toEqual(['president', null, true, 0]);
    await page.evaluate(() => PPSound.setMuted(false));   // the Sound row: a tap
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('president');
    await page.evaluate(() => PPSound.setMusic(false));   // the Music row
    expect(await page.evaluate(() => [PPSound.musicTrack, PPSound.musicWant])).toEqual([null, 'president']);
    const n = await page.evaluate(() => window.__spy.osc);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__spy.osc)).toBe(n);
    await page.evaluate(() => PPSound.setMusic(true, true));
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('president');
    await page.evaluate(() => PPSound.setMuted(true));
    const k = await page.evaluate(() => window.__spy.osc);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => [PPSound.musicTrack, window.__spy.osc])).toEqual([null, k]);
    await page.evaluate(() => PPSound.setMuted(false));
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('president');
  });

  test('T4: nothing plays before the first tap; a Modern tap on the line starts the scene cue', async ({ page }) => {
    await boot(page, { mute: '0' });   // Sound ON, Music ON, no gesture yet
    expect(await page.evaluate(() => [PixelPets.state.settings.controls, PPSound.muted, PPSound.musicOn])).toEqual(['modern', false, true]);
    await page.evaluate(() => PixelPets.runSteps([['music', 'ledger'], ['say', 'Warden Ilse', 'Sit, Cadet.'], ['say', 'Warden Ilse', 'Good work.'], ['say', 'Warden Ilse', 'Quiet work.']]));
    await lineShows(page, 'Sit, Cadet.');
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, PPSound.state, window.__spy.made])).toEqual(['ledger', null, 'none', 0]);
    const box = await page.locator('#sbox').boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.3, box.y + box.height * 0.6);   // a finger on the line (not the SKIP button)
    await expect.poll(() => page.evaluate(() => PPSound.state)).not.toBe('none');
    expect(await want(page)).toBe('ledger');
    if (await page.evaluate(() => PPSound.state) === 'running') await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('ledger');
  });

  test('T7: the save is unchanged by the cues (v 2, no new key, no cue in any value); an old save with no music keys loads', async ({ page }) => {
    await boot(page);
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
    const keys = o => Object.keys(o).sort();
    // the baseline is a game-written save: an arrival at the Lodge saves
    await page.evaluate((m) => PixelPets.goto(m, 5, 5, 'up'), LODGE);
    await page.waitForFunction(() => !PixelPets.fading && !PixelPets.scene);
    await page.waitForTimeout(300);
    const s0 = await read();
    await runAtLodge(page, 'warden_meet');
    const s1 = await read();
    expect(s1.v).toBe(2);
    expect(keys(s1)).toEqual(keys(s0));
    expect(keys(s1.settings)).toEqual(keys(s0.settings));
    expect(s1.settings).toEqual(s0.settings);
    // the debrief's own flag and its built beat mark, as on main
    expect(keys(s1.flags).filter(k => !(k in s0.flags))).toEqual(['story.beat.warden_meet', 'story.warden_met']);
    for (const id of SCENE_IDS) expect(JSON.stringify(s1), id).not.toContain('"' + id + '"');
    const old = lodgeSave(); delete old.settings.music; delete old.settings.musicVol;
    const p2 = await page.context().browser().newPage({ viewport: page.viewportSize() });
    p2.ppErrors = []; p2.on('pageerror', e => p2.ppErrors.push(e.message)); p2.on('console', m => { if (m.type() === 'error') p2.ppErrors.push(m.text()); });
    await installSave(p2.context(), old, { quietDay: true });
    await gotoGame(p2, '?debug=1');
    await p2.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
    expect(await p2.evaluate(() => [PixelPets.state.v, PPSound.musicOn, PPSound.musicWant])).toEqual([2, true, 'town']);
    expect(await p2.evaluate(() => { PixelPets.showTab('walk'); return PixelPets.runScene('warden_meet'); })).toBe(true);
    await expect.poll(() => p2.evaluate(() => PPSound.musicWant)).toBe('ledger');
    expect(p2.ppErrors).toEqual([]);
    await p2.close();
  });

  test('T8: reduced motion changes no music call; zero console errors', async ({ page }) => {
    await boot(page, { reduce: true });
    await soundOn(page);
    const lines = await runAtLodge(page, 'warden_meet');
    expect(lines.every(([, w]) => w === 'ledger')).toBe(true);
    // the same calls a full-motion debrief makes (T9 C5): the cue with the built quick fade, then the room's loop again
    expect(await page.evaluate(() => window.__music)).toEqual([['ledger', { fadeOut: 180, fadeIn: 140, near: false }], ['town', { fadeOut: 400, fadeIn: 500 }]]);
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('town');
  });
});
