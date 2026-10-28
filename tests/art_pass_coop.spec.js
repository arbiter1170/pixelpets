/* ART_PASS test 16. Two phones on the local emulators only. Never walklings-4cc89.
   The hall is not a shared co-op area (rules allow hearthmoor and route1). A real hall hop is
   checked on the hopping phone. The remote copy is the same one-write +2 a hop publishes. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { starterSave, installSave, gotoGame } = require('./helpers');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { ensureEmulator, releaseEmulator, EMU_PORTS, emuQuery } = require('./emu_shared');

const BASE = 'http://127.0.0.1:' + (process.env.PP_PORT || '8080');
let env = null;
function saveFor(uid, name, world){
  const s = starterSave();
  s.uid = uid;
  s.player.name = name;
  s.settings.tips = false;
  s.settings.music = false;
  s.settings.follower = true;
  s.flags['story.phone_got'] = true;
  s.flags['story.tutorial_done'] = true;
  s.flags['story.early_done'] = true;
  s.world = Object.assign({ map: 'hearthmoor', x: 8, y: 12, facing: 'down', respawn: 'hearthmoor' }, world || {});
  return s;
}
function watch(page){
  page.ppErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') page.ppErrors.push(msg.text()); });
  page.on('pageerror', err => page.ppErrors.push(String(err)));
}
async function boot(page, s){
  await installSave(page.context(), s, { quietDay: true });
  watch(page);
  await gotoGame(page, '?cloud=emu&debug=1' + emuQuery());
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.net && window.PixelPets.net.uid, null, { timeout: 25000 });
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
async function join(page){
  await page.locator('#settingsBtn').click();
  await page.locator('#setRoomCode').click();
  await page.locator('#roomCodeInput').fill('AMB-4RQ');
  await page.locator('#roomJoin').click();
  await page.waitForFunction(() => window.PixelPets.net && window.PixelPets.net.room, null, { timeout: 15000 });
  if (await page.locator('#setClose').isVisible()) await page.locator('#setClose').click();
  if (await page.locator('#roomCodeOv').isVisible()) await page.locator('#roomCodeOv button', { hasText: 'CLOSE' }).click();
}

test.describe('ART_PASS co-op hop', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  test.beforeAll(async ({}, info) => {
    test.skip(info.project.name !== '390', '390 only');
    test.setTimeout(600000);
    await ensureEmulator();
    env = await initializeTestEnvironment({ projectId: 'demo-walklings', database: { host: '127.0.0.1', port: EMU_PORTS.database, rules: fs.readFileSync('database.rules.json', 'utf8') } });
    await env.withSecurityRulesDisabled(async ctx => { await ctx.database().ref('roomCodes/AMB4RQ').set({ on: true }); });
  });
  test.afterAll(async () => {
    try { if (env) await env.cleanup(); } catch (e) {}
    releaseEmulator();
  });

  test('a hall hop is one two-cell step, and the remote copy glides that far', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = page;
    await boot(a, saveFor('hopA', 'Tester', { map: 'fb_hall_in', x: 7, y: 6, facing: 'down' }));
    const before = await a.evaluate(() => ({ y: PixelPets.state.world.y, steps: PixelPets.state.steps }));
    await a.keyboard.press('ArrowDown');
    await a.waitForFunction(() => PixelPets.state.world.y === 8 && !PixelPets.walk.to);
    const hopped = await a.evaluate(() => ({ y: PixelPets.state.world.y, steps: PixelPets.state.steps, v: PixelPets.tileInfo(7, 7).ch }));
    expect(hopped.y).toBe(8);
    expect(hopped.steps - before.steps).toBe(1);
    expect(hopped.v).toBe('V');
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);

    await a.evaluate(() => PixelPets.goto('hearthmoor', 8, 12, 'down'));
    await a.waitForFunction(() => !PixelPets.fading && PixelPets.state.world.map === 'hearthmoor');
    const bCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, baseURL: BASE });
    const b = await bCtx.newPage();
    await boot(b, saveFor('hopB', 'Birch'));
    await join(a); await join(b);
    const aUid = await a.evaluate(() => PixelPets.net.uid);
    await b.waitForFunction(uid => {
      const n = window.PixelPets.net;
      return !!(n && n.others.some(o => o.uid === uid && o.drawn));
    }, aUid, { timeout: 8000 });
    const y0 = await b.evaluate(uid => {
      const o = window.PixelPets.net.others.find(z => z.uid === uid);
      return { fy: o.fy, y: o.y };
    }, aUid);
    await a.evaluate(() => {
      const x = PixelPets.state.world.x, y = PixelPets.state.world.y;
      PixelPets.walk.from = { x, y };
      PixelPets.walk.to = { x, y: y + 2 };
      PixelPets.walk.prog = 0;
      PixelPets.walk.hop = true;
      PixelPets.state.world.y = y + 2;
      PixelPets.state.world.facing = 'down';
    });
    const samples = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 2500) {
      const fy = await b.evaluate(uid => {
        const o = window.PixelPets.net.others.find(z => z.uid === uid);
        return o ? o.fy : null;
      }, aUid);
      samples.push(fy);
      if (samples.length > 4 && Math.abs(fy - (y0.y + 2)) < 0.05) break;
      await b.waitForTimeout(40);
    }
    const moved = samples.filter(v => v != null);
    expect(moved.length).toBeGreaterThan(3);
    const end = moved[moved.length - 1];
    expect(end).toBeGreaterThan(y0.y + 1.5);
    expect(end).toBeLessThan(y0.y + 2.2);
    let back = false;
    for (let i = 1; i < moved.length; i++) if (moved[i] + 0.05 < moved[i - 1]) back = true;
    expect(back).toBe(false);
    const fractional = moved.some(v => Math.abs(v - Math.round(v)) > 0.04);
    expect(fractional).toBe(true);
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
    await bCtx.close();
  });
});
