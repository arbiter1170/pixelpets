/* STARTER_MOMENT: the Lodge pick loop, the reveal card, and the beats after the basket. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

function lodgeSave() {
  const s = starterSave();
  s.party = [];
  s.partnerId = null;
  s.box = [];
  s.dex = { seen: {}, caught: {}, legacy: [], hits: {} };
  delete s.flags['story.starter_received'];
  delete s.flags['story.starter_line'];
  s.flags['story.intro_seen'] = true;
  s.flags['story.tutorial_done'] = true;
  s.settings = Object.assign({}, s.settings, { textSpeed: 'fast', follower: true, music: true, musicVol: 1, effects: 'full' });
  s.world = { map: 'hm_lodge_in', x: 8, y: 7, facing: 'up', respawn: 'hearthmoor' };
  s.player.name = 'Tester';
  return s;
}

async function bootLodge(page, { reduced = false, effects = 'full', debug = true } = {}) {
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), lodgeSave(), { quietDay: true });
  await gotoGame(page, debug ? '?debug=1' : '');
  await page.evaluate((fx) => {
    PixelPets.state.settings.effects = fx;
    PixelPets.showTab('walk');
    // A save with no partner and no starter flag wakes on the Lodge doorstep. Step inside, off the hello trigger.
    PixelPets.goto('hm_lodge_in', 8, 7, 'up');
    PPSound.setMuted(false);
  }, effects);
}

async function sceneNow(page) {
  return page.evaluate(() => {
    const s = window.PixelPets && window.PixelPets.scene;
    if (!s) return null;
    return {
      mode: s.mode,
      text: s.text || '',
      full: s.full,
      ready: window.PixelPets.optionsReady === true,
      basket: document.getElementById('ovBasket').hidden === false,
      name: document.getElementById('sbName').hidden === false,
    };
  });
}

// Taps only. `skip` uses the SKIP control on say lines and still answers choices, the basket and the name.
async function playStarter(page, { skip = false, hello = null, line = 'ember', onBeat = null } = {}) {
  const stops = [];
  await page.evaluate(() => { PPSound.setMuted(false); PixelPets.runScene('starter'); });
  await page.waitForFunction(() => window.PixelPets.scene);
  for (let i = 0; i < 90; i++) {
    const sc = await sceneNow(page);
    if (!sc) return stops;
    if (onBeat) await onBeat(page, sc);
    const now = await sceneNow(page);
    if (!now) return stops;
    if (now.basket) {
      if (stops[stops.length - 1] !== 'basket') stops.push('basket');
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      if (await page.locator('#bkRow').isVisible()) {
        await page.locator('.basket[data-line="' + line + '"]').click();
        await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      }
      await page.locator('#bkYes').click();
      await page.waitForFunction(() => document.getElementById('ovBasket').hidden === true, null, { timeout: 5000 });
      continue;
    }
    if (now.name) {
      if (stops[stops.length - 1] !== 'name') stops.push('name');
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      await page.locator('#sbOk').click();
      continue;
    }
    if (now.mode === 'choice') {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true && window.PixelPets.scene && window.PixelPets.scene.full);
      const text = await page.evaluate(() => (window.PixelPets.scene && window.PixelPets.scene.text) || '');
      const key = 'choice:' + text;
      if (stops[stops.length - 1] !== key) stops.push(key);
      const label = hello && text.indexOf('Say hello?') >= 0 ? hello : null;
      const btn = label ? page.locator('#sbChoices button', { hasText: label }).first() : page.locator('#sbChoices button').first();
      await btn.click();
      continue;
    }
    if (now.mode === 'say') {
      if (skip) await page.locator('#sbSkip').click();
      else await page.locator('#sbText').click();
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(50);
  }
  throw new Error('starter scene did not end; stops=' + stops.join(' | '));
}

function beatKinds(stops) {
  return stops.map((s) => (s.indexOf('choice:') === 0 ? 'choice' : s));
}

trackErrors(test, expect);

test('starter moment music sums and the splice finds every insert @w1', async ({ page }) => {
  await bootLodge(page);
  const info = await page.evaluate(() => {
    const spec = PPSound.musicSpec('starter_pick');
    const lead = spec.lead.notes.reduce((s, n) => s + n[1], 0);
    const walk = (steps, hit) => {
      for (const st of steps || []) {
        if (!st) continue;
        if (st[0] === 'reveal' && st[1] === 'open') hit.open = true;
        if (st[0] === 'reveal' && st[1] === 'name') hit.name = true;
        if (st[0] === 'castPartner' && st[1] === 'holder') hit.holder = true;
        if (st[0] === 'castPartner' && st[1] === 'rival') hit.rival = true;
        if (st[0] === 'choice' && String(st[1]).indexOf('Say hello?') >= 0) hit.hello = true;
        if (st[0] === 'say' && String(st[2] || '').indexOf('Hearthmoor will want to meet') >= 0) hit.send = true;
        if (st[0] === 'say' && String(st[2] || '').indexOf('The wild starts past the gate') >= 0) hit.east = true;
        if (st[0] === 'if') { walk(st[2], hit); walk(st[3], hit); }
        if (st[0] === 'choice') for (const o of st[2] || []) walk(o[1], hit);
      }
    };
    const hit = {};
    walk(PixelPets.sceneScript('starter'), hit);
    const bad = PixelPets.spliceStarter([['say', '', 'keep me']], [
      { before: ['say', '', 'missing anchor'], steps: [['say', '', 'nope']] },
      { end: true, steps: [['say', '', 'still here']] },
    ]);
    return {
      music: PPSound.musicCheck(),
      stinger: PPSound.names.indexOf('stinger_starter') >= 0,
      lead, bpm: spec.bpm, bars: spec.bars,
      hit,
      misses: PixelPets.starterMoment().misses,
      dev: PixelPets.devChecks().starterMoment,
      badMisses: bad.misses.length,
      badEnd: JSON.stringify(bad.steps).indexOf('still here') >= 0,
      badNope: JSON.stringify(bad.steps).indexOf('nope') >= 0,
      started: PixelPets.probeScene(bad.steps),
    };
  });
  expect(info.music).toEqual([]);
  expect(info.stinger).toBe(true);
  expect(info.lead).toBe(64);
  expect(info.bpm).toBe(132);
  expect(info.bars).toBe(8);
  expect(info.hit).toMatchObject({ open: true, hello: true, name: true, holder: true, rival: true, send: true, east: true });
  expect(info.misses).toEqual([]);
  expect(info.dev).toEqual([]);
  expect(info.badMisses).toBe(1);
  expect(info.badEnd).toBe(true);
  expect(info.badNope).toBe(false);
  expect(info.started).toBe(true);
  for (let i = 0; i < 8 && await page.evaluate(() => !!window.PixelPets.scene); i++) {
    await page.locator('#sbText').click();
    await page.waitForTimeout(40);
  }
  await page.waitForFunction(() => !window.PixelPets.scene);
});

test('the Lodge pick plays the new loop and the card stays above the say box', async ({ page }) => {
  test.setTimeout(90000);
  await bootLodge(page);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hm_lodge_in');
  const keysBefore = await page.evaluate(() => Object.keys(PixelPets.state).sort());
  let reveal = null;
  const shot = { done: false };
  const stops = await playStarter(page, {
    hello: 'Hold out a hand',
    onBeat: async (p, sc) => {
      if (!reveal && sc.basket) {
        reveal = await p.evaluate(() => ({ music: PPSound.musicWant }));
      }
      if (sc.text && sc.text.indexOf('Learn each other') >= 0) {
        const there = await p.evaluate(() => PixelPets.mapInfo.objs.some((o) => o.id === 'partner'));
        reveal = Object.assign({}, reveal, { partner: there });
      }
      if (shot.done || !sc.text || sc.text.indexOf('hops out') < 0) return;
      shot.done = true;
      await p.waitForTimeout(700);
      const box = await p.evaluate(() => {
        const c = document.getElementById('ovReveal').getBoundingClientRect();
        const s = document.getElementById('sbox').getBoundingClientRect();
        return { top: c.top, bottom: c.bottom, width: c.width, boxTop: s.top, hidden: document.getElementById('ovReveal').hidden };
      });
      expect(box.hidden).toBe(false);
      expect(box.bottom).toBeLessThan(box.boxTop);
      expect(box.width).toBeGreaterThan(200);
      const w = p.viewportSize().width;
      if (w === 320 || w === 390) {
        await p.screenshot({ path: path.join(artifactsDir('starter-moment'), 'reveal-' + w + '.png') });
      }
      reveal = Object.assign({}, reveal, { card: true });
    },
  });
  const after = await page.evaluate(() => ({
    music: PPSound.musicWant,
    cast: PixelPets.mapInfo.objs.some((o) => o.id === 'partner' || o.id === 'rival_pet'),
    stingers: PPSound.played.filter((n) => n === 'stinger_starter').length,
    reveal: document.getElementById('ovReveal').hidden,
    v: PixelPets.state.v,
    keys: Object.keys(PixelPets.state).sort(),
    line: PixelPets.state.flags['story.starter_line'],
    got: PixelPets.state.flags['story.starter_received'],
  }));
  expect(reveal && reveal.music).toBe('starter_pick');
  expect(reveal && reveal.card).toBe(true);
  expect(reveal && reveal.partner).toBe(true);
  expect(beatKinds(stops)).toEqual(['choice', 'choice', 'basket', 'choice', 'name']);
  expect(after.music).toBe('town');
  expect(after.cast).toBe(false);
  expect(after.stingers).toBe(1);
  expect(after.reveal).toBe(true);
  expect(after.v).toBe(2);
  expect(after.keys).toEqual(keysBefore);
  expect(after.line).toBe('ember');
  expect(after.got).toBe(true);
});

test('SKIP from the first line stops only at the quiz, the baskets, the hello and the name', async ({ page }) => {
  test.setTimeout(90000);
  await bootLodge(page);
  const stops = await playStarter(page, { skip: true, hello: 'Crouch down low' });
  const left = await page.evaluate(() => document.getElementById('ovReveal').hidden);
  expect(beatKinds(stops)).toEqual(['choice', 'choice', 'basket', 'choice', 'name']);
  expect(left).toBe(true);
  expect(await page.evaluate(() => window.PixelPets.scene)).toBeFalsy();
});

test('reduced motion and effects off keep the card still @w1', async ({ page }) => {
  test.setTimeout(90000);
  await bootLodge(page, { reduced: true });
  let still = null;
  await playStarter(page, {
    hello: 'Share a crumb',
    onBeat: async (p, sc) => {
      if (still || !sc.text || sc.text.indexOf('hops out') < 0) return;
      still = await p.evaluate(() => ({
        motes: document.querySelectorAll('#ovReveal .rv-mote').length,
        transform: getComputedStyle(document.getElementById('rvPet')).transform,
        hidden: document.getElementById('ovReveal').hidden,
      }));
    },
  });
  expect(still.hidden).toBe(false);
  expect(still.motes).toBe(0);
  expect(still.transform === 'none' || still.transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
});

test('effects off draws no motes and no sprite transform @w1', async ({ page }) => {
  test.setTimeout(90000);
  await bootLodge(page, { effects: 'off' });
  let still = null;
  await playStarter(page, {
    onBeat: async (p, sc) => {
      if (still || !sc.text || sc.text.indexOf('hops out') < 0) return;
      still = await p.evaluate(() => ({
        motes: document.querySelectorAll('#ovReveal .rv-mote').length,
        transform: getComputedStyle(document.getElementById('rvPet')).transform,
      }));
    },
  });
  expect(still.motes).toBe(0);
  expect(still.transform === 'none' || still.transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
});

for (const hello of [
  ['Hold out a hand', 'bumps its head into your palm'],
  ['Crouch down low', 'nose to nose'],
  ['Share a crumb', 'takes the crumb very politely'],
]) {
  test('hello "' + hello[0] + '" reaches the name @w1', async ({ page }) => {
    test.setTimeout(90000);
    await bootLodge(page);
    let reaction = false;
    let named = false;
    await playStarter(page, {
      hello: hello[0],
      onBeat: async (p, sc) => {
        if (sc.text && sc.text.indexOf(hello[1]) >= 0) reaction = true;
        if (sc.name) named = true;
      },
    });
    expect(reaction).toBe(true);
    expect(named).toBe(true);
  });
}
