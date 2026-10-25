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
    const active = new Set();
    const si = window.setInterval.bind(window);
    const ci = window.clearInterval.bind(window);
    window.setInterval = function (fn, ms) {
      const id = si(fn, ms);
      active.add(id);
      return id;
    };
    window.clearInterval = function (id) { active.delete(id); return ci(id); };
    window.__ppIntervals = () => active.size;
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
    window.__ppAudioN = 0;
    const track = (n) => {
      if (!n || n.__ppTracked || typeof n.disconnect !== 'function') return n;
      n.__ppTracked = true;
      window.__ppAudioN++;
      const disc = n.disconnect;
      n.disconnect = function () {
        if (n.__ppTracked) { n.__ppTracked = false; window.__ppAudioN--; }
        return disc.apply(this, arguments);
      };
      return n;
    };
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      ['createOscillator', 'createGain', 'createBufferSource', 'createBiquadFilter'].forEach((name) => {
        const orig = AC.prototype[name];
        if (!orig) return;
        AC.prototype[name] = function () { return track(orig.apply(this, arguments)); };
      });
    }
    window.__ppAudio = () => window.__ppAudioN;
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
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state && window.PixelPets.state.v === 2);
  const boot = await sample(page);
  expect(boot.live).toBeLessThanOrEqual(80);
  expect(boot.mb).toBeLessThanOrEqual(8);
  expect(boot.intervals).toBeLessThanOrEqual(12);
  expect(boot.raf).toBeLessThanOrEqual(3);
  await cycle(page);
  const first = await sample(page);
  await cycle(page);
  const second = await sample(page);
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
  await page.waitForTimeout(600);
  const audio = await page.evaluate(() => window.__ppAudio());
  expect(audio).toBeLessThanOrEqual(8);
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(sv.v).toBe(2);
  expect(sv.party.length).toBe(6);
  expect(sv.box.length).toBeGreaterThanOrEqual(60);
});
