/* STORES_AND_TOWN_LIFE P3a. 5.a budget on Market Row at 17:30.
   Chromium 390 only. A co-op friend's partner is on screen and shows no effect.
   WebKit has no CDP trace, so this file skips there. */
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { starterSave, installSave, gotoGame } = require('./helpers');
const { ensureEmulator, releaseEmulator, EMU_PORTS, emuQuery } = require('./emu_shared');

let env = null;
async function rootSet(p, val) {
  const backoff = [250, 500, 1000];
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await env.withSecurityRulesDisabled(async ctx => {
        const r = ctx.database().ref(p);
        if (val == null) await r.remove(); else await r.set(val);
      });
      return;
    } catch (e) {
      last = e;
      if (String(e && e.message || e).indexOf('fetch failed') < 0 || attempt === 3) throw e;
      await new Promise(r => setTimeout(r, backoff[attempt]));
    }
  }
  throw last;
}

function save() {
  const s = starterSave();
  s.player.name = 'Tester';
  s.party[0].nick = 'Pipkit';
  s.settings.follower = true;
  s.settings.music = false;
  s.settings.musicVol = 0;
  s.settings.tips = false;
  s.settings.effects = 'off';
  s.flags['story.phone_got'] = true;
  s.world = { map: 'hearthmoor', x: 10, y: 22, facing: 'down', respawn: 'hearthmoor' };
  return s;
}

async function frame(page, n) {
  await page.evaluate((n) => new Promise((resolve) => {
    let left = n;
    const step = () => { if (--left <= 0) resolve(0); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), n);
}

async function traceFrames(page, n) {
  const client = await page.context().newCDPSession(page);
  const chunks = [];
  let finish;
  const done = new Promise(r => { finish = r; });
  client.on('Tracing.dataCollected', e => { if (e && e.value) chunks.push.apply(chunks, e.value); });
  client.on('Tracing.tracingComplete', () => finish());
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await client.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline'] } });
  await frame(page, n);
  await client.send('Tracing.end');
  await done;
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await client.detach();
  let script = 0, paint = 0, raf = 0, paints = 0, big = 0, bigScript = 0;
  chunks.forEach(ev => {
    if (!ev || ev.ph !== 'X' || typeof ev.dur !== 'number') return;
    if (ev.name === 'FireAnimationFrame') {
      script += ev.dur; raf++;
      if (ev.dur >= 500) { big++; bigScript += ev.dur; }
    } else if (ev.name === 'Paint') { paint += ev.dur; paints++; }
  });
  return {
    frames: n,
    events: raf,
    paints,
    scriptMs: n ? script / 1000 / n : 0,
    paintMs: n ? paint / 1000 / n : 0,
    loopMs: big ? bigScript / 1000 / big : 0,
    loops: big,
  };
}

test.describe('effect budget', () => {
  test.describe.configure({ mode: 'serial', timeout: 180000 });
  test.beforeAll(async ({}, info) => {
    test.skip(info.project.name !== '390', '390 only');
    test.setTimeout(600000);
    await ensureEmulator();
    env = await initializeTestEnvironment({ projectId: 'demo-walklings', database: { host: '127.0.0.1', port: EMU_PORTS.database, rules: fs.readFileSync('database.rules.json', 'utf8') } });
    for (const p of ['rooms', 'config', 'friends', 'blocks', 'hidden', 'codes', 'friendInfo', 'parties']) await rootSet(p, null);
    await rootSet('roomCodes/AMB4RQ', { on: true });
  });
  test.afterAll(async () => {
    try { if (env) await env.cleanup(); } catch (e) {}
    releaseEmulator();
  });

  test('Market Row at 17:30 stays within 0.3 ms @slow', async ({ page, browserName }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    test.skip(browserName !== 'chromium', 'CDP trace is Chromium only');
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(String(err)));
    await installSave(page.context(), save(), { quietDay: true });
    await gotoGame(page, '?cloud=emu&debug=1' + emuQuery());
    await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.net && window.PixelPets.net.uid, null, { timeout: 25000 });
    await page.evaluate(() => PixelPets.showTab('walk'));
    await page.locator('#settingsBtn').click();
    await page.locator('#setRoomCode').click();
    await page.locator('#roomCodeInput').fill('AMB-4RQ');
    await page.locator('#roomJoin').click();
    await page.waitForFunction(() => window.PixelPets.net && window.PixelPets.net.room, null, { timeout: 15000 });
    if (await page.locator('#roomCodeOv').isVisible()) await page.locator('#roomCodeOv button:has-text("CLOSE")').click();
    if (await page.locator('#setClose').isVisible()) await page.locator('#setClose').click();
    const placed = await page.evaluate(() => {
      PixelPets.clock.set('tue', 17, 30);
      PixelPets.clock.freeze(true);
      const go = PixelPets.goto('hearthmoor', 9, 28, 'down');
      return { go, area: PixelPets.net.area, room: PixelPets.net.room, uid: PixelPets.net.uid };
    });
    expect(placed.go).toBeTruthy();
    expect(placed.area).toBe('hearthmoor');
    expect(placed.room).toBeTruthy();
    const friend = 'auraFriend1';
    const now = Date.now();
    await rootSet('rooms/AMB4RQ/' + placed.area + '/' + placed.room + '/' + friend, {
      pv: 1, x: 11, y: 28, f: 'd', mv: 0,
      look: { sk: '3', hr: 'short', hc: 'p', of: 'coat', oc: 't', ac: 'r', ax: 'none' },
      pet: { sp: 'ember', st: 0, lv: 5 }, seals: 0, title: 0, vis: 'a',
      joined: now - 20000, seen: now, pt: now - 1000,
    });
    await page.waitForFunction((uid) => {
      const n = window.PixelPets.net;
      const o = n && n.others.find(x => x.uid === uid && x.drawn && x.pet);
      if (!o || !n.cam) return false;
      const c = document.querySelector('#mapCanvas');
      const sx = Math.round(o.fx * 16 - n.cam.x);
      const sy = Math.round(o.fy * 16 - n.cam.y);
      return sx > -16 && sy > -16 && sx < c.width && sy < c.height;
    }, friend, { timeout: 8000 });
    await frame(page, 30);
    const off = await traceFrames(page, 90);
    const worn = await page.evaluate(() => {
      PixelPets.state.settings.effects = 'full';
      PixelPets.devGrant('emberwake');
      setAura(PixelPets.state.partnerId, 'emberwake');
      return { mode: PixelPets.aura.mode, drawn: PixelPets.aura.drawn, on: PixelPets.aura.on.emberwake };
    });
    expect(worn.mode).toBe('full');
    await frame(page, 45);
    const on = await traceFrames(page, 90);
    const still = await page.evaluate((uid) => {
      const n = window.PixelPets.net;
      const o = n && n.others.find(x => x.uid === uid);
      return { drawn: !!(o && o.drawn && o.pet), auraDrawn: PixelPets.aura.drawn, auraOn: PixelPets.aura.on.emberwake };
    }, friend);
    const delta = on.loopMs - off.loopMs;
    console.log('PP_AURA_PERF ' + JSON.stringify({
      off: { frames: off.frames, events: off.events, loops: off.loops, scriptMs: +off.scriptMs.toFixed(4), loopMs: +off.loopMs.toFixed(4), paintMs: +off.paintMs.toFixed(4) },
      on: { frames: on.frames, events: on.events, loops: on.loops, scriptMs: +on.scriptMs.toFixed(4), loopMs: +on.loopMs.toFixed(4), paintMs: +on.paintMs.toFixed(4) },
      deltaLoopMs: +delta.toFixed(4),
      friend: still,
    }));
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
    expect(off.loops).toBeGreaterThan(30);
    expect(on.loops).toBeGreaterThan(30);
    expect(still.drawn).toBe(true);
    expect(still.auraOn).toBeGreaterThan(0);
    expect(still.auraDrawn).toBeGreaterThan(0);
    expect(delta).toBeLessThanOrEqual(0.3);
  });
});
