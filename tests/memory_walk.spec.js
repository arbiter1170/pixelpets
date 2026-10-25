/* Live canvases, backing store, DOM, timers and audio stay flat on a heavy save.
   The fixture is synthetic. It is not a copy of anyone's save. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function heavySave() {
  const s = starterSave();
  const lines = ['ember', 'tide', 'bloom'];
  s.party = [];
  for (let i = 0; i < 6; i++) {
    s.party.push({
      id: 'petheavy' + i, species: lines[i % 3], stage: i % 3, xp: 10, bx: 0,
      hunger: 70, happy: 70, energy: 70, nick: null, origin: 'wild',
    });
  }
  s.partnerId = 'petheavy0';
  s.box = [];
  for (let i = 0; i < 64; i++) {
    s.box.push({
      id: 'boxheavy' + i, species: lines[i % 3], stage: 0, xp: 0, bx: 0,
      hunger: 50, happy: 50, energy: 50, nick: null, origin: 'wild',
    });
  }
  s.dex = { seen: {}, caught: {}, legacy: [], hits: {} };
  for (const id of lines) for (let st = 0; st < 3; st++) {
    s.dex.seen[id + '/' + st] = true;
    s.dex.caught[id + '/' + st] = true;
  }
  s.bag = { heal_snack: 20, hearty_snack: 10, wake_tonic: 5, energy_sip: 5, joy_crumb: 8 };
  s.mapSeen = { hearthmoor: true, route1: true, fernbrook: true, route2: true, cobblecrest: true, mahopac: true };
  s.phoneBook = { met: {}, fav: {} };
  for (let i = 0; i < 30; i++) s.phoneBook.met['Walker ' + i] = true;
  s.ui = { sideTracked: 'main', sideSeen: ['phone'] };
  s.care = { d: '2026-10-25', steps: 400, finds: 0, stepBond: 0, battleBond: 0, firstCare: true };
  s.settings = {
    textSpeed: 'fast', battleAnims: true, follower: true, music: true, musicVol: 0.5,
    tips: false, controls: 'modern', effects: 'full', joystick: false, showOthers: 'on',
  };
  s.flags['story.phone_got'] = true;
  s.world = { map: 'route1', x: 39, y: 10, facing: 'right', respawn: 'hearthmoor' };
  s.player.name = 'Tester';
  return s;
}

async function armCounters(page) {
  await page.addInitScript(() => {
    window.__ppCanvases = [];
    const ce = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, opts) {
      const el = ce.call(this, tag, opts);
      if (String(tag).toLowerCase() === 'canvas') {
        try { window.__ppCanvases.push(new WeakRef(el)); } catch (e) {}
      }
      return el;
    };
    const active = new Map();   // interval id -> callback name, so the sound sweep timer can be told apart
    const si = window.setInterval.bind(window);
    const ci = window.clearInterval.bind(window);
    window.setInterval = function (fn, ms) {
      const id = si(fn, ms);
      active.set(id, (fn && fn.name) || '');
      return id;
    };
    window.clearInterval = function (id) { active.delete(id); return ci(id); };
    window.__ppIntervals = () => active.size;
    // sfx.js runs sweepChains every 200 ms only while a note chain is in flight, then clears it.
    window.__ppSweepOn = () => [...active.values()].includes('sweepChains');
    window.__ppRaf = 0;
    window.__ppRafMax = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) {
      window.__ppRaf++;
      if (window.__ppRaf > window.__ppRafMax) window.__ppRafMax = window.__ppRaf;
      return raf(function (t) {
        window.__ppRaf--;
        return cb(t);
      });
    };
    // Every audio node made, until it is disconnected. Sources (oscillators, buffer sources) only ever live for
    // one note; gains and filters can be long-lived buses.
    const nodes = new Set();
    const track = (n, source) => {
      if (!n || n.__ppTracked || typeof n.disconnect !== 'function') return n;
      const rec = { t: performance.now(), source };
      n.__ppTracked = rec;
      nodes.add(rec);
      const disc = n.disconnect;
      n.disconnect = function () {
        if (n.__ppTracked) { nodes.delete(n.__ppTracked); n.__ppTracked = null; }
        return disc.apply(this, arguments);
      };
      return n;
    };
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      ['createOscillator', 'createGain', 'createBufferSource', 'createBiquadFilter'].forEach((name) => {
        const orig = AC.prototype[name];
        if (!orig) return;
        const source = name === 'createOscillator' || name === 'createBufferSource';
        AC.prototype[name] = function () { return track(orig.apply(this, arguments), source); };
      });
    }
    window.__ppAudio = () => nodes.size;
    // connected nodes made before `mark` (sources only, or every kind)
    window.__ppAudioBefore = (mark, sourcesOnly) => { let n = 0; for (const r of nodes) if (r.t < mark && (!sourcesOnly || r.source)) n++; return n; };
  });
}

function sample(page) {
  return page.evaluate(() => {
    const refs = window.__ppCanvases || [];
    const keep = [];
    let px = 0;
    for (const r of refs) {
      const c = r.deref();
      if (!c) continue;
      keep.push(r);
      px += (c.width || 0) * (c.height || 0);
    }
    window.__ppCanvases = keep;
    return {
      live: window.PixelPets.canvases,
      mb: Math.round(px * 4 / 1048576 * 100) / 100,
      dom: document.getElementsByTagName('*').length,
      intervals: window.__ppIntervals(),
      raf: window.__ppRaf,
      audio: window.__ppAudio(),
    };
  });
}

const MAPS = ['route1', 'hearthmoor', 'fernbrook', 'route2', 'cobblecrest', 'mahopac', 'hm_home_in', 'hm_lantern_in', 'hm_store', 'cc_lantern_in', 'fb_lantern_in'];

// Music ON: every note started before `mark` must be disconnected by its deadline (stop + 120 ms in sfx.js
// endChain, about 700 ms for the longest note). Wait for that on state, then count what is still connected
// from before the mark (the long-lived buses). A chain or bus that is never dropped keeps this from settling.
async function settleAudio(page) {
  const mark = await page.evaluate(() => performance.now());
  await page.waitForFunction((mark) => window.__ppAudioBefore(mark, true) === 0, mark, { timeout: 5000 });
  return page.evaluate((mark) => ({
    music: PPSound.musicTrack, ac: PPSound.state,
    connected: window.__ppAudio(), old: window.__ppAudioBefore(mark, false),
  }), mark);
}
// Timers are compared with no notes in flight: the sound sweep timer only runs while a chain is live, so it
// would make the count depend on where the music happened to be. Stop the music, wait for the sweep timer
// to clear and every source to drop, sample, then start the music again.
async function sampleQuiet(page) {
  await page.evaluate(() => PPSound.setMusic(false));
  await page.waitForFunction(() => !PPSound.musicTrack && !window.__ppSweepOn() && window.__ppAudioBefore(Infinity, true) === 0, null, { timeout: 5000 });
  const s = await sample(page);
  await page.evaluate(() => PPSound.setMusic(true));
  await page.waitForFunction(() => !!PPSound.musicTrack, null, { timeout: 5000 });
  return s;
}

async function cycle(page) {
  const moved = await page.evaluate((maps) => {
    PixelPets.showTab('walk');
    const seen = new Set();
    const start = PixelPets.goto('route1', 39, 10, 'right');
    if (start && start.map) seen.add(start.map);
    const dirs = ['right', 'up', 'left', 'down'];
    let steps = 0;
    for (let i = 0; i < 40; i++) {
      const step = PixelPets.walkStep(dirs[i % 4]);
      if (step && step.ok) steps++;
    }
    for (let i = 0; i < 32; i++) {
      const id = maps[i % maps.length];
      const at = PixelPets.goto(id, 4, 4, 'down');
      if (at && at.map) seen.add(at.map);
    }
    return { maps: seen.size, steps };
  }, MAPS);
  expect(moved.maps).toBeGreaterThanOrEqual(6);
  expect(moved.steps).toBeGreaterThanOrEqual(20);
  for (let i = 0; i < 30; i++) {
    await page.locator('#questBtn').click();
    await expect(page.locator('#ovQuest')).toBeVisible();
    await page.waitForFunction(() => window.PixelPets.optionsReady === true);
    await page.locator('#questClose').click();
    await expect(page.locator('#ovQuest')).toBeHidden();
  }
}

test('a heavy save stays flat across walks, maps and Quest', async ({ page }, info) => {
  test.skip(info.project.name !== '390', 'memory is measured at 390');
  test.setTimeout(120000);
  await armCounters(page);
  await installSave(page.context(), heavySave(), { quietDay: true });
  // installSave mutes the game, and muted makes no audio nodes at all: unmute so the audio checks measure real music
  await page.context().addInitScript(() => localStorage.setItem('pixelpets.mute', '0'));
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state && window.PixelPets.state.v === 2);
  const boot = await sample(page);
  expect(boot.live).toBeLessThanOrEqual(80);
  expect(boot.mb).toBeLessThanOrEqual(8);
  expect(boot.intervals).toBeLessThanOrEqual(12);
  expect(boot.raf).toBeLessThanOrEqual(3);
  await cycle(page);
  const firstAudio = await settleAudio(page);
  // the Quest taps were real gestures, so the music must really be playing, or the audio checks prove nothing
  expect(firstAudio.music).toBeTruthy();
  expect(firstAudio.ac).toBe('running');
  const first = await sampleQuiet(page);
  await cycle(page);
  const secondAudio = await settleAudio(page);
  expect(secondAudio.music).toBeTruthy();
  // long-lived nodes from before each mark do not grow from pass to pass (a fading old bus may take a moment)
  await expect.poll(async () => (await settleAudio(page)).old, { timeout: 5000 }).toBeLessThanOrEqual(firstAudio.old);
  expect(secondAudio.connected).toBeLessThanOrEqual(firstAudio.connected + 24);
  const second = await sampleQuiet(page);
  expect(Math.abs(second.live - first.live)).toBeLessThanOrEqual(4);
  expect(Math.abs(second.mb - first.mb)).toBeLessThanOrEqual(0.25);
  expect(Math.abs(second.dom - first.dom)).toBeLessThanOrEqual(12);
  expect(second.intervals).toBe(first.intervals);
  expect(second.raf).toBeLessThanOrEqual(3);
  expect(second.live).toBeLessThanOrEqual(80);
  expect(second.mb).toBeLessThanOrEqual(8);
  await page.evaluate(() => {
    PPSound.setMusic(false);
    PPSound.setMuted(false);
    for (let i = 0; i < 24; i++) PPSound.play('step');
  });
  await settleAudio(page);
  const audio = await page.evaluate(() => window.__ppAudio());
  expect(audio).toBeLessThanOrEqual(8);
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(sv.v).toBe(2);
  expect(sv.party.length).toBe(6);
  expect(sv.box.length).toBeGreaterThanOrEqual(60);
});
