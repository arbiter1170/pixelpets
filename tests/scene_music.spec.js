/* SCENE_MUSIC v0.1, slice 1 (design specs/SCENE_MUSIC.md, design branch claude/scene-music; D1890-D1909): the weir hut's own room
   loop `weir`. One MUSIC entry in sfx.js and one `music` key on hw_weir_hut_in (data/detail_zz_weir_hut.json); trackFor, music(),
   the scene steps, the Settings rows and the iPhone audio path are unchanged. T1-T8 are the spec's §9 rows for slice 1.
   Headless Chromium runs the AudioContext once the game's own unmute (a gesture) makes it. A spy wraps the node factories so a test
   can find the track's bus (the gain startTrack() connects to the master gain) and read the automation calls made on it. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const ROOM = 'hw_weir_hut_in';
// FNV-1a of JSON.stringify(musicSpec(id)). `weir`: computed from the design literal (SCENE_MUSIC.md §4.1). The others: computed from
// origin/main 47fb0c6's sfx.js (T1: every other loop stays as on main).
const WEIR_FNV = '1c515b52';
const MAIN_SPEC_FNV = { town: 'ae1a7a77', route: '5acf6566', battle: 'e0248118', charity: '5201d8eb', chapel: '4d644eb4', arcade: 'a7dabf56',
  wild_skip: 'be947cca', wild_romp: 'ec032d57', wild_spark: '71933125', glimmer_first: '853bfef1', glimmer_battle: '702a4c4d',
  town_glimmer: 'e0b44cf3', quarry: '1bc66c3b', grove: '4fb3ee32', trial: '8933c548', rival: '19362918', hall: '605c2dc0',
  harbour: 'e10c15be', route3: '28044496', lab: '588d4f16', dream: 'ca939dc8', arbiter_test: '17c46c8c', episode_end: 'e755ae15',
  anthem_march: 'd1633a01', anthem_dark: '26a44e54', anthem_hall: '91eaaf50', starter_pick: '7ec8e5d3' };
const KIT_SRC = "const KIT = {\n    k: ['lowpass', 260, 90, 0.30],\n    s: ['highpass', 1500, 110, 0.10],\n    h: ['highpass', 6500, 30, 0.04],\n  };";

function save(opts = {}) {
  const s = starterSave();
  Object.assign(s.settings, { follower: false, controls: 'modern', textSpeed: 'fast', tips: false, music: opts.music !== false, musicVol: 0.5 });
  s.steps = 40;
  Object.assign(s.flags, { 'story.early_done': true, 'story.phone_got': true, 'story.reached_glen': true, 'story.hw_reached': true,
    'story.warden_met': true, 'story.chi_met': true });   // the hut's door is open and its first-step meeting is not armed
  if (opts.side === 'glimmer') s.flags['story.side'] = 'glimmer';
  s.world = Object.assign({ map: 'hw_cut', x: 23, y: 13, facing: 'up', respawn: 'hearthmoor' }, opts.world || {});
  if (opts.old) { delete s.settings.music; delete s.settings.musicVol; }
  return s;
}
// mute: the stored Sound setting ('1' = Sound OFF, the suite's default; '0' = Sound ON, no gesture yet).
async function boot(page, { s = save(), mute = '1', reduce = false } = {}) {
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
    // wild Walklings never block the towpath or start a battle in these checks
    const arm = () => { if (!window.PixelPets || typeof PixelPets.clearWild !== 'function') { setTimeout(arm, 20); return; } setInterval(() => PixelPets.clearWild(), 15); };
    arm();
  }, mute);
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clearWild(); });
}
async function soundOn(page) {
  await page.evaluate(() => { PPSound.setMuted(false); PPSound.setMusic(true, true); PPSound.musicVol = 0.5; });
  await expect.poll(() => page.evaluate(() => PPSound.state)).toBe('running');
}
const settle = page => expect.poll(() => page.evaluate(() => !PixelPets.fading && !PixelPets.scene && !PixelPets.walk.path), { timeout: 15000 }).toBe(true);
const where = page => page.evaluate(() => PixelPets.state.world.map);
// the door step (23,13) faces the hut: one step up goes in; the mat (4,11) is one step down from the arrival tile (4,10)
async function walkIn(page) {
  await page.evaluate(() => { PixelPets.goto('hw_cut', 23, 13, 'up'); PixelPets.clearWild(); });
  await settle(page);
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect.poll(() => where(page), { timeout: 8000 }).toBe(ROOM);
  await settle(page);
}
async function walkOut(page) {
  await page.evaluate(() => PixelPets.walkStep('down'));
  await expect.poll(() => where(page), { timeout: 8000 }).toBe('hw_cut');
  await settle(page);
}
const busCalls = (page, from = 0) => page.evaluate((from) => {
  const n = window.__bus(); if (!n) return null;
  return window.__spy.targets.slice(from).filter(t => t.p === n.gain).map(t => [t.m, t.v == null ? null : Math.round(t.v * 10000) / 10000]);
}, from);
const mark = page => page.evaluate(() => window.__spy.targets.length);

test.describe('SCENE_MUSIC slice 1: the weir hut', () => {
  test('T1: weir is in MUSIC as the spec literal, 8 bars x 8 steps; every other loop and the KIT stay as on main', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(async () => {
      const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); };
      const sum = n => n.reduce((s, x) => s + x[1], 0), t = PPSound.musicSpec('weir');
      const out = { check: PPSound.musicCheck(), has: PPSound.musicIds().includes('weir'), weir: fnv(JSON.stringify(t)), others: {},
        shape: [t.key, t.bpm, t.bars, t.stepsPerBar, sum(t.lead.notes), sum(t.bass.notes)],
        range: [t.lead, t.bass].every(v => v.notes.every(n => n[0] === 0 || (n[0] >= 36 && n[0] <= 96))),
        gains: [t.lead, t.bass].every(v => v.gain > 0 && v.gain <= (v.wave === 'square' ? 0.08 : 0.35)),
        drums: t.drums.length === 8 && t.drums.every(b => /^[ksh.]{8}$/.test(b)),
        plain: !t.swell && [t.lead, t.bass].every(v => v.double == null && v.gate == null) };
      for (const id of PPSound.musicIds()) if (id !== 'weir') out.others[id] = fnv(JSON.stringify(PPSound.musicSpec(id)));
      const src = await (await fetch('sfx.js', { cache: 'no-store' })).text();
      out.kit = (src.match(/const KIT = \{[\s\S]*?\n  \};/) || [''])[0];
      return out;
    });
    expect(r.check).toEqual([]);
    expect(r.has).toBe(true);
    expect(r.weir, 'weir equals the SCENE_MUSIC §4.1 literal').toBe(WEIR_FNV);
    expect(r.shape).toEqual(['D minor', 72, 8, 8, 64, 64]);
    expect([r.range, r.gains, r.drums, r.plain]).toEqual([true, true, true, true]);
    expect(r.others).toEqual(MAIN_SPEC_FNV);
    expect(r.kit).toBe(KIT_SRC);
  });

  test('T2: the hut resolves to weir on both paths, by day and at night; the Hushwater maps and Hearthmoor do not change', async ({ page }) => {
    await boot(page, { s: save({ side: 'glimmer' }) });
    const r = await page.evaluate(([room]) => {
      const maps = [room, 'hw_cut', 'hw_rim', 'hw_falls', 'hearthmoor'];
      const read = () => maps.map(id => PixelPets.mapTrack(id));
      const out = { data: WORLD[room].music };
      PixelPets.clock.set('tue', 12, 0); PixelPets.clock.freeze(true); out.glimmerNoon = read();
      PixelPets.clock.set('tue', 23, 0); out.glimmerNight = read();
      PixelPets.setSide('keepers'); out.keepersNight = read();
      PixelPets.clock.set('tue', 12, 0); out.keepersNoon = read();
      PixelPets.clock.clear();
      return out;
    }, [ROOM]);
    expect(r.data).toBe('weir');
    expect(r.glimmerNoon).toEqual(['weir', 'route', 'route', 'grove', 'town_glimmer']);
    expect(r.glimmerNight).toEqual(['weir', 'route', 'route', 'grove', 'town_glimmer']);
    expect(r.keepersNight).toEqual(['weir', 'route', 'route', 'grove', 'town']);
    expect(r.keepersNoon).toEqual(['weir', 'route', 'route', 'grove', 'town']);
  });

  test('T3: in through the door: weir; out through the mat: route; back in: weir again from bar 1', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page);
    await soundOn(page);
    await walkIn(page);
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['weir', 'weir']);
    await walkOut(page);
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['route', 'route']);
    const n1 = await page.evaluate(() => window.__spy.gains.length);
    await walkIn(page);
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['weir', 'weir']);
    expect(await page.evaluate((n) => window.__spy.gains.slice(n).filter(g => g.__to && g.__to.__master).length, n1)).toBeGreaterThanOrEqual(1);   // a fresh weir bus
  });

  test('T4: nothing plays before the first tap; the first tap starts weir', async ({ page }) => {
    await boot(page, { s: save({ world: { map: ROOM, x: 4, y: 10, facing: 'up' } }), mute: '0' });
    expect(await page.evaluate(() => [PixelPets.state.world.map, PPSound.muted, PPSound.musicOn])).toEqual([ROOM, false, true]);
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, PPSound.state, window.__spy.made])).toEqual(['weir', null, 'none', 0]);
    // the first tap: a finger on the room's back wall (a wall tile, so the holder does not move), the way the unlock gesture lands
    const box = await page.evaluate(() => { const mc = document.querySelector('#mapCanvas'), r = mc.getBoundingClientRect(), cam = PixelPets.walk.cam, k = r.width / mc.width;
      return { x: r.left + ((1 + 0.5) * 16 - cam.x) * k, y: r.top + ((0 + 0.5) * 16 - cam.y) * k }; });
    await page.touchscreen.tap(box.x, box.y);
    await expect.poll(() => page.evaluate(() => PPSound.state)).not.toBe('none');
    const after = await page.evaluate(() => ({ want: PPSound.musicWant, track: PPSound.musicTrack, state: PPSound.state }));
    expect(after.want).toBe('weir');
    if (after.state === 'running') await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('weir');
  });

  test('T5: Music OFF stops weir and makes no node; Music ON starts it; Sound OFF makes no node; Sound ON brings it back', async ({ page }) => {
    await boot(page, { s: save({ world: { map: ROOM, x: 4, y: 10, facing: 'up' } }) });   // Sound OFF (the stored mute)
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack, PPSound.muted, window.__spy.osc])).toEqual(['weir', null, true, 0]);
    await page.evaluate(() => PPSound.setMuted(false));   // the Sound row: a tap
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('weir');
    await page.evaluate(() => PPSound.setMusic(false));   // the Music row
    expect(await page.evaluate(() => [PPSound.musicTrack, PPSound.musicWant])).toEqual([null, 'weir']);
    const n = await page.evaluate(() => window.__spy.osc);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__spy.osc)).toBe(n);
    await page.evaluate(() => PPSound.setMusic(true, true));
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('weir');
    await page.evaluate(() => PPSound.setMuted(true));
    const m = await page.evaluate(() => window.__spy.osc);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => [PPSound.musicTrack, window.__spy.osc])).toEqual([null, m]);
    await page.evaluate(() => PPSound.setMuted(false));
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('weir');
  });

  test('T6: the Music volume is the bus level weir plays at; volume 0 is silent; a stinger ducks it to 35 % and lets it back', async ({ page }) => {
    await boot(page, { s: save({ world: { map: ROOM, x: 4, y: 10, facing: 'up' } }) });
    await soundOn(page);
    await expect.poll(() => page.evaluate(() => PPSound.musicTrack)).toBe('weir');
    let m0 = await mark(page);
    await page.evaluate(() => { PPSound.musicVol = 0; });
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0]]);
    m0 = await mark(page);
    await page.evaluate(() => { PPSound.musicVol = 0.3; });
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0.3]]);
    m0 = await mark(page);
    expect(await page.evaluate(() => PPSound.play('stinger_item'))).toBe(true);
    expect(await busCalls(page, m0)).toEqual([['setTargetAtTime', 0.105], ['setTargetAtTime', 0.3]]);
    expect(await page.evaluate(() => PPSound.musicTrack)).toBe('weir');
  });

  test('T7: save unchanged (v 2, no new key) across the hut; an old save with no music keys loads and wants weir', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page);
    await soundOn(page);
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
    const keys = o => Object.keys(o).sort();
    // the baseline is a game-written save after a first walk in and out (arrivals save; a first room adds today's floorSeen)
    await walkIn(page); await walkOut(page);
    const s0 = await read();
    await walkIn(page);
    await expect.poll(() => page.evaluate(() => PPSound.musicWant)).toBe('weir');
    await walkOut(page);
    const s1 = await read();
    expect(s1.v).toBe(2);
    expect(keys(s1)).toEqual(keys(s0));
    expect(keys(s1.flags)).toEqual(keys(s0.flags));
    expect(keys(s1.settings)).toEqual(keys(s0.settings));
    expect(s1.settings).toEqual(s0.settings);
    expect(JSON.stringify(s1)).not.toContain('"weir"');   // no value names the cue (floorSeen's room id is the arrival's own)
    // an old save (no settings.music, no settings.musicVol) inside the hut
    const p2 = await page.context().browser().newPage({ viewport: page.viewportSize() });
    p2.ppErrors = []; p2.on('pageerror', e => p2.ppErrors.push(e.message)); p2.on('console', m => { if (m.type() === 'error') p2.ppErrors.push(m.text()); });
    await installSave(p2.context(), save({ old: true, world: { map: ROOM, x: 4, y: 10, facing: 'up' } }), { quietDay: true });
    await gotoGame(p2, '?debug=1');
    await p2.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
    expect(await p2.evaluate(() => [PixelPets.state.v, PixelPets.state.world.map, PPSound.musicWant, PPSound.musicOn])).toEqual([2, 'hw_weir_hut_in', 'weir', true]);
    expect(p2.ppErrors).toEqual([]);
    await p2.close();
  });

  test('T8: reduced motion changes no music call; zero console errors', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page, { reduce: true });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await soundOn(page);
    await page.evaluate(() => {
      window.__music = [];
      const orig = PPSound.music;
      PPSound.music = function (id, opt) { window.__music.push([id, opt ? Object.assign({}, opt) : null]); return orig.call(this, id, opt); };
    });
    await walkIn(page);
    await expect.poll(() => page.evaluate(() => [PPSound.musicWant, PPSound.musicTrack])).toEqual(['weir', 'weir']);
    await walkOut(page);
    await expect.poll(() => page.evaluate(() => PPSound.musicWant)).toBe('route');
    // the same calls a full-motion walk makes: the towpath's loop on the jump there, the room's on the door, the route's on the mat,
    // each with the built default fades
    expect(await page.evaluate(() => window.__music)).toEqual([['route', null], ['weir', null], ['route', null]]);
  });
});
