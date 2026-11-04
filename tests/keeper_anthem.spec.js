/* KEEPER_ANTHEM v0.2.1 (design specs/KEEPER_ANTHEM.md, design master 52f62a2; D1375-D1384, D1419-D1423): the Keeper anthem,
   one original melody in three synthesised arrangements (anthem_march, anthem_dark, anthem_hall), the engine bits that play
   them (M1-M4 in sfx.js), the scene hooks (M6-M8 in game.js), and the two anthem rooms behind HC_CITY_V2 (M10-M11).
   T1-T22 are the spec's §9 rows; each test names its row(s). The parade scene itself is PR #286's: its steps are driven here
   with PixelPets.runSteps (debug scene runner), never with hc_parade.
   Headless Chromium runs the AudioContext once the game's own unmute (a "gesture") makes it. A spy wraps the node factories
   so a test can find a track's bus (the gain startTrack() connects to the master gain) and the swell gain in front of it. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const IDS = ['anthem_march', 'anthem_dark', 'anthem_hall'];
// FNV-1a of a normalised musicSpec() per id. Other cues: computed from origin/main 6844bb7's sfx.js (T3: they stay as on main).
// The anthem cues: computed from the design literal (KEEPER_ANTHEM.md §3, master 52f62a2), so the game's data is the spec's.
const MAIN_SPEC_FNV = { town: 'ae1a7a77', route: '5acf6566', battle: 'e0248118', charity: '5201d8eb', chapel: '4d644eb4', arcade: 'a7dabf56',
  wild_skip: 'be947cca', wild_romp: 'ec032d57', wild_spark: '71933125', glimmer_first: '853bfef1', glimmer_battle: '702a4c4d',
  town_glimmer: 'e0b44cf3', quarry: '1bc66c3b', grove: '4fb3ee32', trial: '8933c548', rival: '19362918', hall: '605c2dc0',
  harbour: 'e10c15be', route3: '28044496', lab: '588d4f16', dream: 'ca939dc8', arbiter_test: '17c46c8c', episode_end: 'e755ae15',
  starter_pick: '7ec8e5d3' };
const LITERAL_FNV = { anthem_march: '781ed03a', anthem_dark: '3ccbbc3a', anthem_hall: 'bcc90cb2' };
// SCENE_MUSIC's scene loops (checked against their own literal in tests/scene_music.spec.js T1), left out of T3's main list
const SCENE_MUSIC_IDS = ['curfew', 'president', 'ledger', 'dawn', 'hearth', 'sweet', 'storm', 'hush'];
// The shared KIT, as on main (T3: unchanged).
const KIT_SRC = "const KIT = {\n    k: ['lowpass', 260, 90, 0.30],\n    s: ['highpass', 1500, 110, 0.10],\n    h: ['highpass', 6500, 30, 0.04],\n  };";
const SHEET = '[PLACEHOLDER] A framed sheet of music: EVERY ROOF A LANTERN. The Keeper anthem.';
const BANNED = /\b(faint(ed)?|evolv\w*|coins?|appeared|go, [a-z]+!|[a-z]+dex|trainer|monster|gym|rival)\b/i;

function save(opts = {}) {
  const s = starterSave();
  Object.assign(s.settings, { follower: false, controls: opts.controls || 'modern', textSpeed: 'fast', tips: false, music: opts.music !== false, musicVol: 0.5 });
  Object.assign(s.flags, { 'story.side_pick_done': true, 'story.hc_invite': true, 'story.hc_arrived': true, 'story.hc_greeted': true });
  if (opts.side === 'glimmer') s.flags['story.side'] = 'glimmer';
  s.world = Object.assign({ map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' }, opts.world || {});
  return s;
}
// mute: the save's stored Sound setting ('1' = Sound OFF, the suite's default; '0' = Sound ON, no gesture yet).
async function boot(page, { q = '?debug=1', s = save(), mute = '1' } = {}) {
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
    // Chrome's AudioParam.value does not follow automation, so the spy logs every automation call: { p, m, v }
    for (const m of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues']) {
      const f = AudioParam.prototype[m];
      AudioParam.prototype[m] = function (v) { spy.targets.push({ p: this, m, v: m === 'cancelScheduledValues' ? null : v }); return f.apply(this, arguments); };
    }
    // the newest track bus (startTrack's gain into the master gain) and swell gain (startTrack's gain into the swell's lowpass);
    // the note gains a first tick makes inside startTrack feed the bus or the swell gain, so they match neither
    window.__bus = () => { for (let i = spy.gains.length - 1; i >= 0; i--) if (spy.gains[i].__to && spy.gains[i].__to.__master) return spy.gains[i]; return null; };
    window.__swellGain = () => { for (let i = spy.gains.length - 1; i >= 0; i--) if (spy.gains[i].__to instanceof BiquadFilterNode) return spy.gains[i]; return null; };
  }, mute);
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
// Sound ON and Music ON with a gesture: the game's own unmute makes the context (headless runs it).
async function soundOn(page) {
  await page.evaluate(() => { PPSound.setMuted(false); PPSound.setMusic(true, true); PPSound.musicVol = 0.5; });
  await expect.poll(() => page.evaluate(() => PPSound.state)).toBe('running');
}
async function settle(page) { await expect.poll(() => page.evaluate(() => !PixelPets.fading && !PixelPets.scene)).toBe(true); }
async function sceneOpen(page) { await expect.poll(() => page.evaluate(() => !!PixelPets.scene)).toBe(true); }
async function endScene(page) {
  for (let i = 0; i < 80; i++) {
    if (!(await page.evaluate(() => !!PixelPets.scene))) return;
    await page.keyboard.press('Space'); await page.waitForTimeout(60);
  }
}
async function logMusic(page) {
  await page.evaluate(() => {
    window.__music = [];
    const orig = PPSound.music;
    PPSound.music = function (id, opt) { window.__music.push({ id, opt: opt ? Object.assign({}, opt) : null, at: performance.now() }); return orig.call(this, id, opt); };
  });
}
// The automation calls made on the current track's bus gain (or the swell gain) since `from` (an index into the spy log).
const busCalls = (page, from = 0, swell = false) => page.evaluate(([from, swell]) => {
  const n = swell ? window.__swellGain() : window.__bus(); if (!n) return null;
  return window.__spy.targets.slice(from).filter(t => t.p === n.gain).map(t => [t.m, t.v == null ? null : Math.round(t.v * 10000) / 10000]);
}, [from, swell]);
const mark = page => page.evaluate(() => window.__spy.targets.length);
// the bus reaches the Music volume: the fade-in ramp (or a set) to `vol` is its last value call
async function busAt(page, vol) {
  const calls = await busCalls(page);
  const last = calls.filter(c => c[0] !== 'cancelScheduledValues').pop();
  expect(last && last[1], JSON.stringify(calls)).toBe(vol);
}

test.describe('KEEPER_ANTHEM', () => {
  test('T1 T15 T16: three cues in MUSIC, the spec literal\'s data, 16 bars x 16 steps, and the checker\'s rules', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(([ids]) => {
      const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); };
      const voice = v => ({ wave: v.wave, gain: v.gain, double: v.double == null ? null : v.double, doubleGain: v.doubleGain == null ? null : v.doubleGain, gate: v.gate == null ? null : v.gate, notes: v.notes.map(n => [n[0], n[1]]) });
      const norm = t => JSON.stringify({ key: t.key, bpm: t.bpm, bars: t.bars, stepsPerBar: t.stepsPerBar, gate: t.gate, perc: t.perc,
        swell: t.swell ? { sec: t.swell.sec, from: t.swell.from, lpFrom: t.swell.lpFrom, lpTo: t.swell.lpTo } : null, lead: voice(t.lead), bass: voice(t.bass), drums: t.drums.slice() });
      const out = { check: PPSound.musicCheck(), ids: PPSound.musicIds(), cues: {} };
      for (const id of ids) {
        const t = PPSound.musicSpec(id), sum = n => n.reduce((s, x) => s + x[1], 0);
        out.cues[id] = { fnv: fnv(norm(t)), key: t.key, bpm: t.bpm, bars: t.bars, steps: t.stepsPerBar, loopSec: t.bars * 4 * 60 / t.bpm,
          lead: sum(t.lead.notes), bass: sum(t.bass.notes), range: t.lead.notes.every(n => n[0] === 0 || (n[0] >= 36 && n[0] <= 96 && (!t.lead.double || (n[0] + t.lead.double >= 36 && n[0] + t.lead.double <= 96)))) && t.bass.notes.every(n => n[0] === 0 || (n[0] >= 36 && n[0] <= 96)),
          drums: t.drums.length === 16 && t.drums.every(b => b.length === 16 && /^[ksh.]+$/.test(b)),
          gains: [t.lead, t.bass].every(v => [v.gain].concat(v.double ? [v.doubleGain] : []).every(g => g > 0 && g <= (v.wave === 'square' ? 0.08 : 0.35))),
          swell: t.swell || null, double: [t.lead.double, t.bass.double], vgate: [t.lead.gate, t.bass.gate], perc: t.perc, leadWave: t.lead.wave };
      }
      return out;
    }, [IDS]);
    expect(r.check).toEqual([]);
    for (const id of IDS) expect(r.ids, id).toContain(id);
    const c = r.cues;
    for (const id of IDS) {
      expect(c[id].fnv, id + ' equals the KEEPER_ANTHEM §3 literal').toBe(LITERAL_FNV[id]);
      expect([c[id].bars, c[id].steps, c[id].lead, c[id].bass], id).toEqual([16, 16, 256, 256]);
      expect(c[id].range && c[id].drums && c[id].gains, id).toBe(true);
    }
    // D1377: keys, tempos, loop lengths; D1421: the hall cue
    expect([c.anthem_march.key, c.anthem_march.bpm, c.anthem_march.loopSec]).toEqual(['Bb major', 120, 32]);
    expect([c.anthem_dark.key, c.anthem_dark.bpm, c.anthem_dark.loopSec]).toEqual(['Bb minor', 64, 60]);
    expect([c.anthem_hall.key, c.anthem_hall.bpm, c.anthem_hall.loopSec]).toEqual(['Bb major', 80, 48]);
    // the checker's shape rules: only the march swells; the dark bass is a held drone; the hall runs on today's engine
    expect(c.anthem_march.swell).toEqual({ sec: 48, from: 0.2, lpFrom: 700, lpTo: 12000 });
    expect(c.anthem_dark.swell).toBe(null);
    expect(c.anthem_dark.vgate).toEqual([undefined, 8]);
    expect(c.anthem_hall.swell).toBe(null);
    expect(c.anthem_hall.double).toEqual([undefined, undefined]);
    expect(c.anthem_hall.vgate).toEqual([undefined, undefined]);
    expect(c.anthem_hall.leadWave).toBe('triangle');
    expect(c.anthem_hall.perc).toBeLessThanOrEqual(0.4);
  });

  test('T2 T16: one melody: the dark lead is the march in the parallel minor, the hall lead is the march note for note', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const M = PPSound.musicSpec('anthem_march'), D = PPSound.musicSpec('anthem_dark'), H = PPSound.musicSpec('anthem_hall');
      const lower = n => { const d = ((n - 10) % 12 + 12) % 12; return [4, 9, 11].includes(d) ? n - 1 : n; };   // B-flat: degrees 3, 6, 7
      const inKey = (n, minor) => (minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]).includes(((n - 10) % 12 + 12) % 12);
      return {
        dark: M.lead.notes.length === D.lead.notes.length && M.lead.notes.every(([n, k], i) => D.lead.notes[i][1] === k && D.lead.notes[i][0] === (n ? lower(n) : 0)),
        hall: JSON.stringify(M.lead.notes) === JSON.stringify(H.lead.notes),
        hallBass: JSON.stringify(M.bass.notes) === JSON.stringify(H.bass.notes),
        keys: M.lead.notes.every(([n]) => !n || inKey(n, false)) && D.lead.notes.every(([n]) => !n || inKey(n, true)),
        march: [M.lead.wave, M.lead.double, M.lead.doubleGain],
        slower: D.bpm < M.bpm && H.bpm < M.bpm,
      };
    });
    expect(r).toEqual({ dark: true, hall: true, hallBass: true, keys: true, march: ['square', -12, 0.035], slower: true });
  });

  test('T3: every other cue and the KIT are as on main, none carries the new fields, and town starts with no swell', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(async ([anthem]) => {
      const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); };
      const out = { hash: {}, extra: [] };
      for (const id of PPSound.musicIds()) {
        if (anthem.includes(id)) continue;
        const t = PPSound.musicSpec(id); out.hash[id] = fnv(JSON.stringify(t));
        if (t.swell || ['lead', 'bass'].some(v => t[v].double != null || t[v].gate != null)) out.extra.push(id);
      }
      const src = await (await fetch('sfx.js', { cache: 'no-store' })).text();
      out.kit = (src.match(/const KIT = \{[\s\S]*?\n  \};/) || [''])[0];
      return out;
    }, [IDS.concat(SCENE_MUSIC_IDS)]);
    expect(r.hash).toEqual(MAIN_SPEC_FNV);
    expect(r.extra).toEqual([]);
    expect(r.kit).toBe(KIT_SRC);
    await soundOn(page);
    expect(await page.evaluate(() => { PPSound.music('town'); return [PPSound.musicTrack, PPSound.musicSwell]; })).toEqual(['town', null]);
  });

  test('T4 T5: the march swells on a fresh cue and starts near on `near`; the bus is the Music volume; a stinger ducks the bus, not the swell', async ({ page }) => {
    await boot(page);
    await soundOn(page);
    const a = await page.evaluate(() => { PPSound.music('anthem_march'); return PPSound.musicSwell; });
    expect(a).toMatchObject({ from: 0.2, sec: 48 });
    await busAt(page, 0.5);
    // the swell chain: a gain from 0.2 to 1 and a lowpass from 700 Hz to 12 kHz, both over 48 s, in front of the bus
    expect(await busCalls(page, 0, true)).toEqual([['setValueAtTime', 0.2], ['exponentialRampToValueAtTime', 1]]);
    // T5: the duck during the swell acts on the bus only
    const m0 = await mark(page);
    expect(await page.evaluate(() => PPSound.play('stinger_item'))).toBe(true);
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0.175], ['setTargetAtTime', 0.5]]);
    expect(await busCalls(page, m0, true)).toEqual([]);   // the swell is untouched: no reset, no duck
    expect(await page.evaluate(() => [PPSound.musicTrack, PPSound.musicSwell && PPSound.musicSwell.from])).toEqual(['anthem_march', 0.2]);
    // near: no swell chain, the bus at the Music volume
    const g0 = await page.evaluate(() => window.__spy.gains.length);
    const n = await page.evaluate(() => { PPSound.music('anthem_march', { near: true, restart: true }); return [PPSound.musicTrack, PPSound.musicSwell]; });
    expect(n).toEqual(['anthem_march', null]);
    expect(await page.evaluate((g0) => window.__spy.gains.slice(g0).filter(g => g.__to instanceof BiquadFilterNode).length, g0)).toBe(0);   // no new swell gain
    await busAt(page, 0.5);
  });

  test('T6: ["music", id] keeps 180 / 140 ms (Brinewick episode_end); options pass fadeOut, fadeIn, minDelay and near', async ({ page }) => {
    await boot(page);
    await logMusic(page);
    await page.evaluate(() => PixelPets.runSteps([['music', 'episode_end'], ['say', '', 'Hold.']]));
    await sceneOpen(page);
    await endScene(page);
    await page.evaluate(() => PixelPets.runSteps([['music', 'anthem_dark', { fadeOut: 900, fadeIn: 2400, minDelay: 1600, near: true }], ['say', '', 'Hold.']]));
    await sceneOpen(page);
    const log = await page.evaluate(() => window.__music);
    const ep = log.find(e => e.id === 'episode_end'), dk = log.find(e => e.id === 'anthem_dark');
    expect(ep.opt).toEqual({ fadeOut: 180, fadeIn: 140, near: false });   // minDelay undefined: music() treats it as none
    expect(ep.opt.minDelay).toBeUndefined();
    expect(dk.opt).toEqual({ fadeOut: 900, fadeIn: 2400, minDelay: 1600, near: true });
    await endScene(page);
  });

  test('T7: a `keep` cue carries over a scene warp; without keep, or under SKIP, the landing map\'s loop takes over', async ({ page }) => {
    await boot(page);
    await soundOn(page);
    const land = await page.evaluate(() => { const m = WORLD.route1, p = m.start || m.safe; return { x: p.x, y: p.y, track: PixelPets.mapTrack('route1') }; });
    expect(land.track).toBe('route');
    // keep: unbroken (the same track, its swell clock not restarted)
    await page.evaluate(l => PixelPets.runSteps([['music', 'anthem_march', { keep: true }], ['wait', 300], ['warp', 'route1', l.x, l.y, 'down'], ['say', '', 'Landed.']]), land);
    await expect.poll(() => page.evaluate(() => PixelPets.state.world.map)).toBe('route1');
    const t0 = await page.evaluate(() => PPSound.musicSwell && PPSound.musicSwell.t0);
    await expect.poll(() => page.evaluate(() => !!(PixelPets.scene && !PixelPets.fading))).toBe(true);
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, PPSound.musicSwell && PPSound.musicSwell.t0])).toEqual(['anthem_march', 'anthem_march', t0]);
    await endScene(page);
    // no keep: the warp lands on the map loop
    await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));
    await page.evaluate(l => PixelPets.runSteps([['music', 'anthem_march'], ['warp', 'route1', l.x, l.y, 'down'], ['say', '', 'Landed.']]), land);
    await expect.poll(() => page.evaluate(() => PixelPets.state.world.map)).toBe('route1');
    await expect.poll(() => page.evaluate(() => PPSound.musicWant)).toBe('route');
    await endScene(page);
    // SKIP: keep is set, then SKIP is tapped before the warp
    await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));
    await page.evaluate(l => PixelPets.runSteps([['music', 'anthem_march', { keep: true }], ['say', '', 'Skip me.'], ['warp', 'route1', l.x, l.y, 'down'], ['say', '', 'Landed.']]), land);
    await sceneOpen(page);
    expect(await page.evaluate(() => PPSound.musicWant)).toBe('anthem_march');
    await page.locator('#sbSkip').click();
    await expect.poll(() => page.evaluate(() => PixelPets.state.world.map)).toBe('route1');
    await expect.poll(() => page.evaluate(() => PPSound.musicWant)).toBe('route');
    await settle(page);
  });

  test('T8: the 2.5 hand-off: the march stops at once, the dark cue starts no earlier than 1.6 s later', async ({ page }) => {
    await boot(page);
    await soundOn(page);
    await logMusic(page);
    await page.evaluate(() => PixelPets.runSteps([['music', 'anthem_march', { keep: true }], ['wait', 400],
      ['music', 'anthem_dark', { fadeOut: 900, minDelay: 1600, fadeIn: 2400 }], ['say', 'Guard', 'Citizen. Back.']]));
    await expect.poll(() => page.evaluate(() => PPSound.musicWant)).toBe('anthem_dark');
    expect(await page.evaluate(() => PPSound.musicTrack)).toBe(null);
    const t1 = await page.evaluate(() => new Promise(res => { const tick = () => { if (PPSound.musicTrack === 'anthem_dark') res(performance.now()); else setTimeout(tick, 10); }; tick(); }));
    const t0 = await page.evaluate(() => window.__music.find(e => e.id === 'anthem_dark').at);
    expect(t1 - t0).toBeGreaterThanOrEqual(1600);
    expect(t1 - t0).toBeLessThan(2600);
    expect(await page.evaluate(() => PPSound.musicSwell)).toBe(null);   // only the march swells
    await endScene(page);
  });

  test('T9 T10: a Keepers scene that opens with its cue keeps it (no Glimmerwell sting); after its battle and at its end the map loop plays', async ({ page }) => {
    await boot(page);
    await soundOn(page);
    // T10 control: the same battle without the opening cue still gets the faction pre-scan
    await page.evaluate(() => PixelPets.setFlag('music.glimmer_met', false));
    await page.evaluate(() => PixelPets.runSteps([['say', '', 'Hold.'], ['battle', 'r2_lead']]));
    await sceneOpen(page);
    expect(await page.evaluate(() => PPSound.musicWant)).toMatch(/^glimmer_/);
    await page.evaluate(() => PixelPets.endScene());
    await page.evaluate(() => PPSound.music('town'));
    // T10: the anthem scene
    await logMusic(page);
    const met = await page.evaluate(() => !!PixelPets.state.flags['music.glimmer_met']);
    await page.evaluate(() => PixelPets.runSteps([['music', 'anthem_march', { keep: true }], ['say', '', 'The parade.'], ['battle', 'r2_lead'], ['say', '', 'After.']]));
    await sceneOpen(page);
    const start = await page.evaluate(() => ({ want: PPSound.musicWant, ids: window.__music.map(e => e.id), met: !!PixelPets.state.flags['music.glimmer_met'] }));
    expect(start.want).toBe('anthem_march');
    expect(start.ids).toEqual(['anthem_march']);
    expect(start.met).toBe(met);
    // T9: the battle, then the map loop (closeBattle), then the scene end leaves it
    for (let i = 0; i < 40 && !(await page.evaluate(() => PixelPets.battle && PixelPets.battle.on)); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(120); }
    await expect.poll(() => page.evaluate(() => !!(PixelPets.battle && PixelPets.battle.on))).toBe(true);
    await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.winBattle(); });
    await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.panel === 'end', null, { timeout: 30000 });
    if (await page.evaluate(() => PixelPets.battle.on)) await page.click('#btOk');
    await expect.poll(() => page.evaluate(() => PixelPets.battle.on)).toBe(false);
    const map = await page.evaluate(() => PixelPets.mapTrack(PixelPets.state.world.map));
    await expect.poll(() => page.evaluate(() => PPSound.musicWant)).toBe(map);
    await endScene(page);
    expect(await page.evaluate(() => PPSound.musicWant)).toBe(map);
  });

  test('T9 Glimmer path: a dark cue without keep ends on the exit warp\'s map loop', async ({ page }) => {
    await boot(page, { s: save({ side: 'glimmer' }) });
    await soundOn(page);
    const land = await page.evaluate(() => { const m = WORLD.route1, p = m.start || m.safe; return { x: p.x, y: p.y }; });
    await page.evaluate(l => PixelPets.runSteps([['music', 'anthem_dark'], ['say', '', 'The speech.'], ['warp', 'route1', l.x, l.y, 'down'], ['say', '', 'Away.']]), land);
    await sceneOpen(page);
    expect(await page.evaluate(() => PPSound.musicWant)).toBe('anthem_dark');
    await page.keyboard.press('Space'); await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => PixelPets.state.world.map)).toBe('route1');
    await expect.poll(() => page.evaluate(() => PPSound.musicWant)).toBe('route');
    await endScene(page);
    expect(await page.evaluate(() => PPSound.musicWant)).toBe('route');
  });

  test('T11: Sound OFF and Music OFF make no music node; turning them on starts the march near; Music volume 0 is silent', async ({ page }) => {
    await boot(page);   // Sound OFF (the stored mute)
    const off = await page.evaluate(() => { const n = window.__spy.osc; PixelPets.runSteps([['music', 'anthem_march', { keep: true }], ['say', '', 'Hold.']]); return { n }; });
    await sceneOpen(page);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, PPSound.muted, window.__spy.osc])).toEqual(['anthem_march', null, true, off.n]);
    await page.evaluate(() => PPSound.setMuted(false));   // the Sound row: a tap
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('anthem_march');
    expect(await page.evaluate(() => PPSound.musicSwell)).toBe(null);
    // Music OFF: stops within 100 ms, the wish stays, no node while off
    await page.evaluate(() => PPSound.setMusic(false));
    expect(await page.evaluate(() => PPSound.musicTrack)).toBe(null);
    const n2 = await page.evaluate(() => window.__spy.osc);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__spy.osc)).toBe(n2);
    await page.evaluate(() => PPSound.setMusic(true, true));
    expect(await page.evaluate(() => [PPSound.musicTrack, PPSound.musicSwell])).toEqual(['anthem_march', null]);
    const m0 = await mark(page);
    await page.evaluate(() => { PPSound.musicVol = 0; });
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0]]);
    await endScene(page);
  });

  test('T12: before the first gesture the step only records the wish; no AudioContext exists', async ({ page }) => {
    await boot(page, { mute: '0' });
    await page.evaluate(() => PixelPets.runSteps([['music', 'anthem_march', { keep: true }], ['say', '', 'Hold.']]));
    await sceneOpen(page);
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, PPSound.state, window.__spy.made])).toEqual(['anthem_march', null, 'none', 0]);
    await endScene(page);
  });

  test('T13 T14: save unchanged (v 2, no new key) across the cues, a warp and the rooms; reduced motion; zero console errors', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const s0 = save(); s0.flags['story.reached_route1'] = true;   // the landing map's own first-visit flag is not this packet's
    await boot(page, { s: s0 });
    await soundOn(page);
    const keys = o => Object.keys(o).sort();
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
    // the baseline is a game-written save after an interior visit (arrivals save; a first room adds today's floorSeen)
    await page.evaluate(() => { PixelPets.goto('hm_lodge_in', 4, 4, 'up'); PixelPets.goto('hearthmoor', 8, 8, 'down'); });
    const before = await read();
    const land = await page.evaluate(() => { const m = WORLD.route1, p = m.start || m.safe; return { x: p.x, y: p.y }; });
    await page.evaluate(l => PixelPets.runSteps([['music', 'anthem_march', { keep: true }], ['warp', 'route1', l.x, l.y, 'down'],
      ['music', 'anthem_dark', { fadeOut: 900, minDelay: 200, fadeIn: 400 }], ['say', '', 'Hold.']]), land);
    await sceneOpen(page);
    await endScene(page);
    await page.evaluate(() => PixelPets.goto('hc_barracks_in', 4, 4, 'up'));
    await expect.poll(() => page.evaluate(() => PPSound.musicWant)).toBe('charity');   // city off: the room keeps its loop
    const after = await read();
    expect(after.v).toBe(2);
    expect(keys(after)).toEqual(keys(before));
    expect(keys(after.flags)).toEqual(keys(before.flags));
    expect(keys(after.settings)).toEqual(keys(before.settings));
    expect(JSON.stringify(after).includes('anthem')).toBe(false);
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
  });

  test('T14: debug hooks inert without ?debug=1: ?hccity=2 alone leaves both rooms on charity and no city', async ({ page }) => {
    await boot(page, { q: '?hccity=2' });
    const r = await page.evaluate(() => ({ debug: PixelPets.debug, city: typeof PixelPets.hcCity === 'function' ? PixelPets.hcCity() : null,
      c: PixelPets.mapTrack('hc_command_in'), b: PixelPets.mapTrack('hc_barracks_in'), world: typeof window.WORLD, v: PixelPets.state.v }));
    expect(r).toEqual({ debug: false, city: null, c: 'charity', b: 'charity', world: 'undefined', v: 2 });
  });

  test('T17 T18: city on, the two Keeper rooms play anthem_hall; every other room is as with the roomPatch removed; city off both are charity', async ({ page }) => {
    const ROOMS = ['hc_airport_in', 'hc_lantern_in', 'hc_gov_1', 'hc_gov_3', 'hc_church_in', 'hc_hall_in', 'hm_hq_f1', 'hm_hq_f2', 'hm_lodge_in'];
    const read = () => page.evaluate(([rooms]) => ({ c: PixelPets.mapTrack('hc_command_in'), b: PixelPets.mapTrack('hc_barracks_in'),
      cm: WORLD.hc_command_in.music, bm: WORLD.hc_barracks_in.music, other: rooms.map(id => [id, PixelPets.mapTrack(id)]),
      objs: ['hc_command_in', 'hc_barracks_in'].map(id => WORLD[id].objs.map(o => o.id).sort().join(',')) }), [ROOMS]);
    await boot(page, { q: '?debug=1&hccity=2' });
    const on = await read();
    expect([on.c, on.b, on.cm, on.bm]).toEqual(['anthem_hall', 'anthem_hall', 'anthem_hall', 'anthem_hall']);
    // the same city without its roomPatch (debug: the data file with the key dropped)
    const p2 = await page.context().newPage();
    await p2.route('**/data/hc_city_v2.js*', async (route) => {
      const res = await route.fetch();
      await route.fulfill({ status: 200, body: (await res.text()) + '\ndelete window.PP_HC_V2.roomPatch;\n', headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
    });
    p2.ppErrors = []; p2.on('pageerror', e => p2.ppErrors.push(e.message));
    await gotoGame(p2, '?debug=1&hccity=2');
    await p2.waitForFunction(() => window.PixelPets && PixelPets.state);
    const bare = await p2.evaluate(([rooms]) => ({ c: PixelPets.mapTrack('hc_command_in'), b: PixelPets.mapTrack('hc_barracks_in'), other: rooms.map(id => [id, PixelPets.mapTrack(id)]),
      objs: ['hc_command_in', 'hc_barracks_in'].map(id => WORLD[id].objs.map(o => o.id).concat(id === 'hc_command_in' ? ['hc_anthem_sheet_c'] : ['hc_anthem_sheet_b']).sort().join(',')) }), [ROOMS]);
    expect(p2.ppErrors).toEqual([]);
    await p2.close();
    expect([bare.c, bare.b]).toEqual(['charity', 'charity']);
    expect(on.other).toEqual(bare.other);
    expect(on.objs).toEqual(bare.objs);   // the rooms gain the sheet and nothing else
    // city off (plain ?debug=1): as main
    const p3 = await page.context().newPage();
    await gotoGame(p3, '?debug=1&hccity=0');
    await p3.waitForFunction(() => window.PixelPets && PixelPets.state);
    expect(await p3.evaluate(() => [PixelPets.mapTrack('hc_command_in'), PixelPets.mapTrack('hc_barracks_in'), WORLD.hc_command_in.objs.some(o => /anthem/.test(o.id))])).toEqual(['charity', 'charity', false]);
    await p3.close();
  });

  test('T19: walk into the Barracks: anthem_hall; out through the mat: charity; back in: anthem_hall from bar 1', async ({ page }) => {
    await boot(page, { q: '?debug=1&hccity=2', s: save({ world: { map: 'hc_civic', x: 55, y: 25, facing: 'up' } }) });
    await soundOn(page);
    const door = await page.evaluate(() => { const d = WORLD.hc_civic.objs.find(o => o.kind === 'door' && o.id === 'hc_barracks'); return { x: d.x, y: d.y }; });
    const walkIn = async () => {
      await page.evaluate(d => PixelPets.goto('hc_civic', d.x, d.y, 'up'), door);
      await settle(page);
      await page.evaluate(() => PixelPets.walkStep('up'));
      await expect.poll(() => page.evaluate(() => PixelPets.state.world.map)).toBe('hc_barracks_in');
      await settle(page);
    };
    await walkIn();
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['anthem_hall', 'anthem_hall']);
    const n1 = await page.evaluate(() => window.__spy.gains.length);
    for (let i = 0; i < 6 && (await page.evaluate(() => PixelPets.state.world.map)) === 'hc_barracks_in'; i++) { await page.evaluate(() => PixelPets.walkStep('down')); await page.waitForTimeout(150); }
    await expect.poll(() => page.evaluate(() => PixelPets.state.world.map)).toBe('hc_civic');
    await expect.poll(() => page.evaluate(() => PPSound.musicWant)).toBe('charity');
    await walkIn();
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['anthem_hall', 'anthem_hall']);
    expect(await page.evaluate((n) => window.__spy.gains.slice(n).filter(g => g.__to && g.__to.__master).length, n1)).toBeGreaterThanOrEqual(2);   // charity's bus, then a new anthem_hall bus (a fresh start)
  });

  test('T20: at 23:00 and on a Glimmer save both rooms still want anthem_hall', async ({ page }) => {
    await boot(page, { q: '?debug=1&hccity=2', s: save({ side: 'glimmer' }) });
    const r = await page.evaluate(() => { PixelPets.clock.set('tue', 23, 0); PixelPets.clock.freeze(true);
      const out = { side: PixelPets.state.flags['story.side'], hh: PixelPets.clock.now().hh };
      out.rooms = ['hc_command_in', 'hc_barracks_in'].map(id => { PixelPets.goto(id, 4, 4, 'up'); return [id, PPSound.musicWant, PixelPets.mapTrack(id)]; });
      PixelPets.setSide('keepers');
      out.keepers = ['hc_command_in', 'hc_barracks_in'].map(id => PixelPets.mapTrack(id));
      return out; });
    expect(r.side).toBe('glimmer');
    expect(r.hh).toBe(23);
    expect(r.rooms).toEqual([['hc_command_in', 'anthem_hall', 'anthem_hall'], ['hc_barracks_in', 'anthem_hall', 'anthem_hall']]);
    expect(r.keepers).toEqual(['anthem_hall', 'anthem_hall']);
    await page.evaluate(() => PixelPets.clock.clear());
  });

  test('T21: in the room, Sound OFF keeps the wish with no node; Sound ON starts it; volume 0 is silent; a stinger ducks it', async ({ page }) => {
    await boot(page, { q: '?debug=1&hccity=2', s: save({ world: { map: 'hc_command_in', x: 4, y: 4, facing: 'up' } }) });
    await page.evaluate(() => PixelPets.goto('hc_command_in', 4, 4, 'up'));
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, window.__spy.osc])).toEqual(['anthem_hall', null, 0]);
    await soundOn(page);
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('anthem_hall');
    let m0 = await mark(page);
    await page.evaluate(() => { PPSound.musicVol = 0; });
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0]]);
    m0 = await mark(page);
    await page.evaluate(() => { PPSound.musicVol = 0.5; });
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0.5]]);
    m0 = await mark(page);
    expect(await page.evaluate(() => PPSound.play('stinger_item'))).toBe(true);
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0.175], ['setTargetAtTime', 0.5]]);
    expect(await page.evaluate(() => [PPSound.musicTrack, PPSound.musicSwell])).toEqual(['anthem_hall', null]);
  });

  test('T22: one framed sheet per room names the anthem (PLACEHOLDER), opens on a tap, clean wording, save unchanged', async ({ page }) => {
    const vw = page.viewportSize().width;
    for (const [rid, sid] of [['hc_command_in', 'hc_anthem_sheet_c'], ['hc_barracks_in', 'hc_anthem_sheet_b']]) {
      await boot(page, { q: '?debug=1&hccity=2', s: save({ world: { map: rid, x: 4, y: 4, facing: 'up' } }) });
      const before = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
      const signs = await page.evaluate(id => WORLD[id].objs.filter(o => o.kind === 'sign').map(o => ({ id: o.id, x: o.x, y: o.y, text: o.text })), rid);
      expect(signs).toEqual([{ id: sid, x: 4, y: 2, text: SHEET }]);
      expect(SHEET.length).toBeLessThanOrEqual(110);
      expect(BANNED.test(SHEET)).toBe(false);
      // the sheet's tile on screen, then a Modern tap on it: the holder walks beside it and its text opens
      const box = await page.evaluate(() => { const mc = document.querySelector('#mapCanvas'), r = mc.getBoundingClientRect(), cam = PixelPets.walk.cam, s = r.width / mc.width;
        return { x: r.left + ((4 + 0.5) * 16 - cam.x) * s, y: r.top + ((2 + 0.5) * 16 - cam.y) * s, size: 16 * s }; });
      // D1423 / rule 6: at 390 the room draws at 3x, so the tile is 48 px; at 320 and 375 every map tile is 32 px (2x), and the
      // sheet is also reached by the 44 px TALK button (below). The PR's spec-match table records this row as Differs.
      if (vw >= 390) expect(box.size).toBeGreaterThanOrEqual(44);
      else expect(box.size).toBeGreaterThanOrEqual(32);
      await page.touchscreen.tap(box.x, box.y);
      await expect(page.locator('#sbText')).toHaveText(SHEET, { timeout: 8000 });
      expect(await page.evaluate(() => [PixelPets.state.world.x, PixelPets.state.world.y])).toEqual([4, 3]);
      await endScene(page);
      expect(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'))).toBe(before);   // the city preview holds the save
      expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
    }
    // Arcade: facing the sheet, the TALK button (44 px) opens it too
    await boot(page, { q: '?debug=1&hccity=2', s: save({ controls: 'arcade', world: { map: 'hc_barracks_in', x: 4, y: 3, facing: 'up' } }) });
    const talk = await page.locator('#talkBtn').boundingBox();
    expect(talk.width).toBeGreaterThanOrEqual(44);
    expect(talk.height).toBeGreaterThanOrEqual(44);
    await page.locator('#talkBtn').click();
    await expect(page.locator('#sbText')).toHaveText(SHEET, { timeout: 8000 });
    await endScene(page);
  });
});
