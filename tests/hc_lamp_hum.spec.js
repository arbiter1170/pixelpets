/* HC_LAMP_HUM (D1371, layout 4.2 and 4.5; Vincent approved the hum Nov 5 and 6, 2026): a soft hum within 2 tiles of each High Charity lamp post.
   Audio cannot be heard in a test, so this asserts the logic: the level the game works out (PixelPets.hcHum, ?debug=1 only) and what
   sfx.js does with it (PPSound.humInfo). Covers: level 0 at and beyond 2 tiles and above 0 near a post (and it rises as you close in);
   level 0 with sound off, Music off, in a room, on a non-city map, with a menu up, and while the page is hidden; ONE voice ever (a spy on
   createOscillator counts the 147 Hz hum oscillators, and a walk in and out never raises the live count above one pair); nothing
   starts before the first gesture (no AudioContext, no hum oscillators); save unchanged; zero console errors. Runs at 320, 375 and 390.
   The real-iPhone listen check is the rule 3 sign-off (Nina scripts it). Never signs in or touches Firebase. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'hc_city_v2.json'), 'utf8'));
const POSTS = DATA.maps.highcharity.objs.filter(o => o.sprite === 'hc_lamp_box');
const P = POSTS[0];                                   // (6,19)
// A tile 4+ from every post on the map (found from the data, so a layout change cannot break the check).
const FAR = (() => { for (let y = 3; y < 30; y++) for (let x = 3; x < 30; x++) if (POSTS.every(o => Math.hypot(o.x - x, o.y - y) >= 4)) return { x, y }; return null; })();

function save() {
  const s = starterSave();
  Object.assign(s.settings, { follower: false, controls: 'modern', textSpeed: 'fast', tips: false, music: true, musicVol: 0.5 });
  Object.assign(s.flags, { 'story.side_pick_done': true, 'story.hc_invite': true, 'story.hc_arrived': true, 'story.hc_greeted': true });
  s.world = { map: 'highcharity', x: FAR.x, y: FAR.y, facing: 'up', respawn: 'hearthmoor' };
  return s;
}
// Sound stays ON in this spec (no pixelpets.mute); the spy counts hum oscillators (147 Hz) created and still live.
async function boot(page, q = '?debug=1') {
  await page.addInitScript(({ s }) => {
    if (!sessionStorage.getItem('pp_seeded')) {
      const d = new Date(), day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      s.flags['daily.hello'] = day; s.flags['daily.warm_bowl'] = day; s.last = Date.now();
      localStorage.setItem('pixelpets.save.v2', JSON.stringify(s));
      sessionStorage.setItem('pp_seeded', '1');
    }
    localStorage.setItem('pixelpets.geo', 'deny'); localStorage.removeItem('pixelpets.mute');
    window.__hum = { made: 0, live: 0, maxLive: 0, ctxs: 0 };
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      const mk = AC.prototype.createOscillator;
      AC.prototype.createOscillator = function () {
        const o = mk.call(this); const wrapStart = o.start.bind(o), wrapStop = o.stop.bind(o); let on = false;
        o.start = function (...a) { if (o.frequency.value === 147 && !on) { on = true; window.__hum.made++; window.__hum.live++; window.__hum.maxLive = Math.max(window.__hum.maxLive, window.__hum.live); } return wrapStart(...a); };
        o.stop = function (...a) { if (on) { on = false; window.__hum.live--; } return wrapStop(...a); };
        return o;
      };
      window.AudioContext = window.webkitAudioContext = class extends AC { constructor(...a) { super(...a); window.__hum.ctxs++; } };
      window.AudioContext.prototype.createOscillator = AC.prototype.createOscillator;
    }
  }, { s: save() });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
const at = (page, x, y, map = 'highcharity') => page.evaluate(([m, x, y]) => PixelPets.goto(m, x, y, 'up'), [map, x, y]);
const info = page => page.evaluate(() => ({ h: PixelPets.hcHum(), s: PPSound.humInfo, live: window.__hum.live, made: window.__hum.made, ctxs: window.__hum.ctxs, state: PPSound.state }));
async function settle(page) { await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true); await page.waitForTimeout(220); }
// A real tap on the map would walk the holder, so the gesture is a keydown (one of sfx.js's unlock events) on the page.
async function gesture(page) { await page.keyboard.press('Shift'); await expect.poll(() => page.evaluate(() => PPSound.state)).toBe('running'); }

test('the level is 0 beyond 2 tiles, above 0 near a post, and rises as you close in', async ({ page }) => {
  await boot(page);
  expect(FAR).toBeTruthy();
  for (const [dx, dy, want] of [[0, -3, 'zero'], [0, -2, 'zero'], [-2, -1, 'zero'], [0, 1, 'some'], [1, 1, 'some'], [1, 0, 'some']]) {
    await at(page, P.x + dx, P.y + dy); await settle(page);
    const { h } = await info(page);
    if (want === 'zero') expect(h.level).toBe(0); else expect(h.level).toBeGreaterThan(0);
  }
  const lv = [];
  for (const [dx, dy] of [[1, 1], [0, 1]]) { await at(page, P.x + dx, P.y + dy); await settle(page); lv.push((await info(page)).h.level); }
  expect(lv[1]).toBeGreaterThan(lv[0]);                 // d 1 louder than d 1.41
  await at(page, FAR.x, FAR.y); await settle(page);
  const far = await info(page);
  expect(far.h.level).toBe(0); expect(far.h.dist).toBeGreaterThanOrEqual(4);
  expect(far.h.radius).toBe(2); expect(far.h.posts).toBeGreaterThanOrEqual(POSTS.length);
});

test('nothing starts before a gesture; after one, a single voice hums near a post', async ({ page }) => {
  await boot(page);
  await at(page, P.x, P.y + 1); await settle(page);
  let i = await info(page);
  expect(i.h.level).toBeGreaterThan(0);                 // the game wants a hum
  expect(i.ctxs).toBe(0); expect(i.state).toBe('none'); // but there is no AudioContext yet,
  expect(i.made).toBe(0); expect(i.s.voices).toBe(0);   // and not one hum oscillator
  await gesture(page);
  await expect.poll(async () => JSON.stringify(await info(page)), { timeout: 3000 }).toContain('"voices":1');
  i = await info(page);
  expect(i.live).toBe(1); expect(i.s.level).toBeGreaterThan(0); expect(i.s.peak).toBeLessThanOrEqual(0.03);
  // walk in and out of the radius many times: still one voice at any moment, and the same voice rises again
  for (let k = 0; k < 6; k++) { await at(page, FAR.x, FAR.y); await page.waitForTimeout(150); await at(page, P.x, P.y + 1); await page.waitForTimeout(150); }
  i = await info(page);
  expect(i.live).toBeLessThanOrEqual(1); expect(i.s.voices).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => window.__hum.maxLive)).toBe(1);
});

test('the level is 0 with sound off, Music off, in a room, off the city, with a menu up, and while hidden', async ({ page }) => {
  await boot(page);
  await at(page, P.x, P.y + 1); await settle(page); await gesture(page);
  await expect.poll(async () => (await info(page)).s.voices).toBe(1);
  const lvl = async () => (await info(page)).s;

  await page.evaluate(() => PPSound.setMuted(true)); expect((await lvl()).level).toBe(0); expect((await lvl()).voices).toBe(0);
  await page.evaluate(() => PPSound.setMuted(false)); await expect.poll(async () => (await lvl()).level).toBeGreaterThan(0);

  await page.evaluate(() => PPSound.setMusic(false)); expect((await lvl()).level).toBe(0); expect((await lvl()).voices).toBe(0);
  await page.evaluate(() => PPSound.setMusic(true, true)); await expect.poll(async () => (await lvl()).level).toBeGreaterThan(0);

  await page.evaluate(() => { document.querySelector('#ovSheet').hidden = false; });
  await expect.poll(async () => (await info(page)).h.level).toBe(0);
  await expect.poll(async () => (await lvl()).level).toBe(0);
  await page.evaluate(() => { document.querySelector('#ovSheet').hidden = true; });
  await expect.poll(async () => (await lvl()).level).toBeGreaterThan(0);

  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  expect((await lvl()).level).toBe(0); expect((await lvl()).voices).toBe(0);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(async () => (await lvl()).level).toBeGreaterThan(0);

  for (const room of ['hc_lantern_in', 'hc_news_1']) {
    await at(page, 8, 17, room); await settle(page);
    await expect.poll(async () => (await info(page)).s.level).toBe(0);
    expect((await info(page)).h.level).toBe(0);
  }
  await at(page, 20, 20, 'hearthmoor'); await settle(page);
  expect((await info(page)).s.level).toBe(0); expect((await info(page)).h.posts).toBe(0);
});

test('save unchanged: the hum adds no save key and keeps v 2; the debug hook is inert without ?debug=1', async ({ page }) => {
  await boot(page, '');
  expect(await page.evaluate(() => PixelPets.hcHum())).toBeFalsy();
  const snap = () => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('pixelpets.save.v2')); return { v: s.v, top: Object.keys(s).sort(), flags: Object.keys(s.flags).sort(), settings: Object.keys(s.settings).sort(), keys: Object.keys(localStorage).sort() }; });
  const before = await snap();
  await page.evaluate(() => { PixelPets.state; });
  await page.keyboard.press('Shift'); await page.waitForTimeout(1200);
  const after = await snap();
  expect(after.v).toBe(2); expect(before.v).toBe(2);
  expect(after.top).toEqual(before.top); expect(after.flags).toEqual(before.flags); expect(after.settings).toEqual(before.settings);
  expect(after.keys).toEqual(before.keys);
  expect(JSON.stringify(after)).not.toMatch(/hum/i);
});
