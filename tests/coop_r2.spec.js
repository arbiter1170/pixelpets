/* COOP_R2 Build 1. Two holders on the local Firebase emulators only. Never the live project.
   The file runs in the 390 project. 320 runs inside it. It shares one local emulator
   with Play together and the effect-budget check. The lock keeps those files
   from using the room at the same time. */
const { test, expect } = require('@playwright/test');
const { webkit } = require('playwright');
const fs = require('fs');
const { starterSave, installSave, gotoGame, artifactsDir } = require('./helpers');
const { ensureEmulator, releaseEmulator } = require('./emu_shared');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const SHOTS = artifactsDir('review-coop-r2');
const BASE = 'http://127.0.0.1:' + (process.env.PP_PORT || '8080');
let env = null;
function saveFor(uid, name){
  const s = starterSave();
  s.uid = uid; s.created = 1700000000000 + uid.length;
  s.player.name = name;
  s.player.look = { skin: '3', hair: 'short', hairCol: 'p', outfit: 'coat', outfitCol: 't', accent: 'r', accessory: 'none' };
  s.settings.tips = false; s.settings.music = false; s.settings.musicVol = 0;
  s.flags['story.phone_got'] = true; s.flags['story.tutorial_done'] = true;
  s.world = { map: 'hearthmoor', x: 8, y: 12, facing: 'down', respawn: 'hearthmoor' };
  s.party[0].nick = 'Drizzlet';
  return s;
}
function presence(uid, extra){
  const now = Date.now();
  return Object.assign({
    pv: 1, x: 6, y: 12, f: 'd', mv: 0,
    look: { sk: '3', hr: 'short', hc: 'p', of: 'coat', oc: 't', ac: 'r', ax: 'none' },
    pet: { sp: 'ember', st: 0, lv: 5 }, seals: 0, title: 0, vis: 'a',
    joined: now - 20000, seen: now + 180000, pt: now,
  }, extra || {});
}
async function rootSet(path, val){
  await env.withSecurityRulesDisabled(async ctx => {
    const r = ctx.database().ref(path);
    if (val == null) await r.remove(); else await r.set(val);
  });
}
async function rootGet(path){
  let out = null;
  await env.withSecurityRulesDisabled(async ctx => { out = (await ctx.database().ref(path).get()).val(); });
  return out;
}
async function wipe(){
  for (const p of ['rooms', 'config', 'friends', 'blocks', 'hidden', 'codes', 'friendInfo', 'parties']) await rootSet(p, null);
  await rootSet('roomCodes/AMB4RQ', { on: true });
  await rootSet('config/coop/on', true);
}
function watchErrors(page){
  page.ppErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') page.ppErrors.push(msg.text()); });
  page.on('pageerror', err => page.ppErrors.push(String(err)));
}
async function onWalk(page){
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.net && window.PixelPets.net.uid, null, { timeout: 25000 });
  await page.evaluate(() => { window.PixelPets.showTab('walk'); if (window.PixelPets.clearWild) window.PixelPets.clearWild(); });
}
async function boot(page, save){
  await installSave(page.context(), save, { quietDay: true });
  watchErrors(page);
  await gotoGame(page, '?cloud=emu&debug=1');
  await onWalk(page);
}
const PHONES = { 320: { width: 320, height: 568 }, 375: { width: 375, height: 667 }, 390: { width: 390, height: 844 } };
async function bootNew(browser, save, w){
  const ctx = await browser.newContext({ viewport: PHONES[w || 390], deviceScaleFactor: 2, isMobile: true, hasTouch: true, baseURL: BASE });
  const page = await ctx.newPage();
  await boot(page, save);
  return page;
}
async function enterCode(page, code){
  await page.locator('#settingsBtn').click();
  await page.locator('#setRoomCode').click();
  await page.locator('#roomCodeInput').fill(code || 'AMB-4RQ');
  await page.locator('#roomJoin').click();
}
async function closeSettings(page){
  if (await page.locator('#setClose').isVisible()) await page.locator('#setClose').click();
  if (await page.locator('#roomCodeOv').isVisible()) await page.locator('#roomCodeOv button:has-text("CLOSE")').click();
}
async function joinRoom(page, code){
  await enterCode(page, code || 'AMB-4RQ');
  await page.waitForFunction(() => window.PixelPets.net && window.PixelPets.net.room, null, { timeout: 15000 });
  await closeSettings(page);
}
function sees(uid){
  const n = window.PixelPets.net;
  return !!(n && n.others.some(o => o.uid === uid && o.drawn));
}
async function tapUid(page, uid){
  const pt = await page.evaluate(uid => {
    const n = window.PixelPets.net, o = n.others.find(x => x.uid === uid), c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect();
    return { x: (o.fx * 16 - n.cam.x + 8) / c.width * r.width + r.left, y: (o.fy * 16 - n.cam.y + 8) / c.height * r.height + r.top };
  }, uid);
  await page.mouse.click(pt.x, pt.y);
}
async function selfTap(page){
  const pt = await page.evaluate(() => {
    const n = window.PixelPets.net, c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect();
    return { x: (n.pos.x * 16 - n.cam.x + 8) / c.width * r.width + r.left, y: (n.pos.y * 16 - n.cam.y + 8) / c.height * r.height + r.top };
  });
  await page.mouse.click(pt.x, pt.y);
}
async function friends(a, b){
  await rootSet('friends/' + a + '/' + b, true);
  await rootSet('friends/' + b + '/' + a, true);
}
async function shot(page, name, sel){
  fs.mkdirSync(SHOTS, { recursive: true });
  const opts = { path: SHOTS + '/' + name, animations: 'disabled', scale: 'css' };
  if (sel) await page.locator(sel).screenshot(opts);
  else await page.screenshot(opts);
}
function normSave(raw){
  const o = JSON.parse(raw);
  delete o.last; delete o.debugSave;
  (o.party || []).forEach(p => { delete p.hunger; delete p.happy; delete p.energy; });
  return JSON.stringify(o);
}
async function hideTab(page, hidden){
  await page.evaluate(flag => {
    const proto = Document.prototype;
    if (!proto.__ppVis) {
      proto.__ppVis = true;
      Object.defineProperty(proto, 'hidden', { configurable: true, get(){ return !!proto.__ppHiddenFlag; } });
      Object.defineProperty(proto, 'visibilityState', { configurable: true, get(){ return proto.__ppHiddenFlag ? 'hidden' : 'visible'; } });
    }
    proto.__ppHiddenFlag = flag;
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

test.describe('B1', () => {
  test.describe.configure({ mode: 'serial', timeout: 180000 });
  test.beforeAll(async ({}, info) => {
    test.skip(info.project.name !== '390', 'runs in the 390 project; 320 runs inside it');
    test.setTimeout(600000);
    await ensureEmulator();
    env = await initializeTestEnvironment({ projectId: 'demo-walklings', database: { host: '127.0.0.1', port: 9000, rules: fs.readFileSync('database.rules.json', 'utf8') } });
    await rootSet('roomCodes/AMB4RQ', { on: true });
    await rootSet('config/coop/on', true);
  });
  test.afterAll(async () => {
    if (env) await env.cleanup();
    releaseEmulator();
  });
  test.beforeEach(async ({}, info) => { if (info.project.name === '390') await wipe(); });

  test('form a walk group at 390 and 320', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    for (const w of [390, 320]) {
      await wipe();
      const a = await bootNew(browser, saveFor('grpA' + w, 'Mia'), w);
      const b = await bootNew(browser, saveFor('grpB' + w, 'Juno'), w);
      const aUid = await a.evaluate(() => window.PixelPets.net.uid);
      const bUid = await b.evaluate(() => window.PixelPets.net.uid);
      await friends(aUid, bUid);
      await rootSet('friendInfo/' + aUid, { name: 'Mia', pet: 'Drizzlet' });
      await rootSet('friendInfo/' + bUid, { name: 'Juno', pet: 'Drizzlet' });
      await joinRoom(a); await joinRoom(b);
      const before = await a.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
      await a.evaluate(() => window.PPNet.debug().advancePolls());
      await b.evaluate(() => window.PPNet.debug().advancePolls());
      await b.waitForFunction(sees, aUid, { timeout: 8000 });
      await tapUid(b, aUid);
      await expect(b.locator('#holderCard button', { hasText: 'WALK TOGETHER' })).toBeVisible();
      await shot(b, 'b1_card_' + w + '.png', '#holderCard .net-card');
      await b.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
      await expect(a.locator('#coopAsk')).toBeVisible({ timeout: 5000 });
      await expect(a.locator('#coopAskTitle')).toContainText('Walk with Juno?');
      await shot(a, 'b1_ask_' + w + '.png', '#coopAsk .net-ask');
      await a.locator('#coopJoin').click();
      await expect(a.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2', { timeout: 2000 });
      await expect(b.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2', { timeout: 2000 });
      await shot(a, 'b1_strip_' + w + '.png', '#coopStrip');
      const dev = await a.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.net')).party);
      expect(dev.code).toBe('AMB4RQ');
      expect(dev.host).toBe(bUid);
      expect(dev.pid).toMatch(/^p[A-HJ-NP-Z2-9]{6}$/);
      await b.locator('#coopStrip .coop-head-btn').first().click();
      await b.locator('#holderCard button', { hasText: 'LEAVE GROUP' }).click();
      await expect.poll(async () => rootGet('parties/AMB4RQ'), { timeout: 2000 }).toBeNull();
      await expect(a.locator('#coopStrip')).toBeHidden({ timeout: 2000 });
      const after = await a.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
      expect(JSON.parse(after).v).toBe(2);
      expect(normSave(after)).toBe(normSave(before));
      expect(Object.keys(JSON.parse(after)).sort().join(',')).toBe(Object.keys(JSON.parse(before)).sort().join(','));
      expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
      expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
      await a.context().close(); await b.context().close();
    }
  });

  test('gates hide WALK TOGETHER', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = await bootNew(browser, saveFor('gateA', 'Mia'));
    const b = await bootNew(browser, saveFor('gateB', 'Juno'));
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    await rootSet('friends/' + aUid + '/' + bUid, true);
    await joinRoom(a); await joinRoom(b);
    await a.evaluate(() => window.PPNet.debug().advancePolls());
    await b.waitForFunction(sees, aUid, { timeout: 8000 });
    await tapUid(b, aUid);
    await expect(b.locator('#holderCard')).toBeVisible();
    expect(await b.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).count()).toBe(0);
    await b.locator('#holderCard button', { hasText: 'CLOSE' }).click();
    await friends(aUid, bUid);
    await b.evaluate(() => window.PPNet.debug().advancePolls());
    await b.locator('#settingsBtn').click();
    await b.locator('.net-pill', { hasText: 'SOLO' }).click();
    await closeSettings(b);
    expect(await b.locator('button', { hasText: 'WALK TOGETHER' }).count()).toBe(0);
    await a.context().close(); await b.context().close();

    await wipe();
    await rootSet('roomCodes/BBBBBB', { on: true });
    const c = await bootNew(browser, saveFor('gateC', 'Mia'));
    const d = await bootNew(browser, saveFor('gateD', 'Juno'));
    const cUid = await c.evaluate(() => window.PixelPets.net.uid);
    const dUid = await d.evaluate(() => window.PixelPets.net.uid);
    await friends(cUid, dUid);
    await joinRoom(c, 'AMB-4RQ');
    await joinRoom(d, 'BBB-BBB');
    expect(await c.locator('button', { hasText: 'WALK TOGETHER' }).count()).toBe(0);
    expect(await d.locator('button', { hasText: 'WALK TOGETHER' }).count()).toBe(0);
    await rootSet('blocks/' + cUid + '/' + dUid, Date.now());
    await rootSet('rooms/AMB4RQ/hearthmoor/r1/' + dUid, presence(dUid, { x: 10, y: 12 }));
    await c.evaluate(() => window.PPNet.debug().advancePolls());
    expect(await c.locator('button', { hasText: 'WALK TOGETHER' }).count()).toBe(0);
    expect(c.ppErrors, c.ppErrors.join('\n')).toEqual([]);
    await c.context().close(); await d.context().close();
  });

  test('a third holder cannot take the seat', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = await bootNew(browser, saveFor('seatA', 'Mia'));
    const b = await bootNew(browser, saveFor('seatB', 'Juno'));
    const cSave = saveFor('seatC', 'Ned');
    cSave.world.x = 16; cSave.world.y = 12;
    const c = await bootNew(browser, cSave);
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    const cUid = await c.evaluate(() => window.PixelPets.net.uid);
    await friends(aUid, bUid); await friends(aUid, cUid);
    await rootSet('friendInfo/' + aUid, { name: 'Mia', pet: 'Pip' });
    await rootSet('friendInfo/' + bUid, { name: 'Juno', pet: 'Pip' });
    await rootSet('friendInfo/' + cUid, { name: 'Ned', pet: 'Pip' });
    await joinRoom(a); await joinRoom(b); await joinRoom(c);
    await a.evaluate(() => window.PPNet.debug().advancePolls());
    await b.evaluate(() => window.PPNet.debug().advancePolls());
    await a.waitForFunction(sees, bUid, { timeout: 8000 });
    await tapUid(a, bUid);
    await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
    await expect(b.locator('#coopAsk')).toBeVisible({ timeout: 5000 });
    await b.locator('#coopJoin').click();
    await expect(a.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2', { timeout: 2000 });
    const pid = await a.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.net')).party.pid);
    await rootSet('parties/AMB4RQ/' + pid + '/invites/' + cUid, Date.now());
    await rootSet('parties/AMB4RQ/inbox/' + cUid + '/' + aUid, { pid, at: Date.now() });
    await expect(c.locator('#coopAsk')).toBeVisible({ timeout: 4000 });
    await c.locator('#coopJoin').click();
    await c.waitForTimeout(800);
    const guest = await rootGet('parties/AMB4RQ/' + pid + '/guest');
    expect(guest).toBe(bUid);
    await expect(c.locator('#coopStrip')).toBeHidden();
    expect(c.ppErrors, c.ppErrors.join('\n')).toEqual([]);
    await a.context().close(); await b.context().close(); await c.context().close();
  });

  test('three NOT NOWs mute invites until reload', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = await bootNew(browser, saveFor('muteA', 'Mia'));
    const b = await bootNew(browser, saveFor('muteB', 'Juno'));
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    await friends(aUid, bUid);
    await rootSet('friendInfo/' + aUid, { name: 'Mia', pet: 'Pip' });
    await rootSet('friendInfo/' + bUid, { name: 'Juno', pet: 'Pip' });
    await joinRoom(a); await joinRoom(b);
    await a.evaluate(() => window.PPNet.debug().advancePolls());
    await b.evaluate(() => window.PPNet.debug().advancePolls());
    await a.waitForFunction(sees, bUid, { timeout: 8000 });
    for (let i = 0; i < 3; i++) {
      await tapUid(a, bUid);
      await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
      await expect(b.locator('#coopAsk')).toBeVisible({ timeout: 4000 });
      await b.locator('#coopNotNow').click();
      await expect(b.locator('#coopAsk')).toBeHidden();
    }
    await tapUid(a, bUid);
    await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
    await b.waitForTimeout(1000);
    await expect(b.locator('#coopAsk')).toBeHidden();
    await b.reload(); await onWalk(b); await joinRoom(b);
    await b.evaluate(() => window.PPNet.debug().advancePolls());
    await a.waitForFunction(sees, bUid, { timeout: 8000 });
    await tapUid(a, bUid);
    await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
    await expect(b.locator('#coopAsk')).toBeVisible({ timeout: 5000 });
    expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
    await a.context().close(); await b.context().close();
  });

  test('LEAVE GROUP and Block end it', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = await bootNew(browser, saveFor('endA', 'Mia'));
    const b = await bootNew(browser, saveFor('endB', 'Juno'));
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    await friends(aUid, bUid);
    await rootSet('friendInfo/' + aUid, { name: 'Mia', pet: 'Pip' });
    await rootSet('friendInfo/' + bUid, { name: 'Juno', pet: 'Pip' });
    await joinRoom(a); await joinRoom(b);
    await a.evaluate(() => window.PPNet.debug().advancePolls());
    await b.evaluate(() => window.PPNet.debug().advancePolls());
    await a.waitForFunction(sees, bUid);
    await tapUid(a, bUid);
    await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
    await b.locator('#coopJoin').click();
    await expect(a.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2', { timeout: 2000 });
    await b.locator('#coopStrip .coop-head-btn').first().click();
    await b.locator('#holderCard button', { hasText: 'LEAVE GROUP' }).click();
    await expect(b.locator('#coopStrip')).toBeHidden({ timeout: 2000 });
    await expect(a.locator('#coopStrip .coop-head')).toHaveText('GROUP 1/2', { timeout: 2000 });
    const pid = await a.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.net')).party.pid);
    expect(await rootGet('parties/AMB4RQ/' + pid + '/guest')).toBeFalsy();
    await tapUid(a, bUid);
    await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
    await b.locator('#coopJoin').click();
    await expect(a.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2', { timeout: 2000 });
    await tapUid(a, bUid);
    await a.locator('#holderCard button', { hasText: 'BLOCK' }).click();
    await expect.poll(async () => rootGet('parties/AMB4RQ/' + pid), { timeout: 2000 }).toBeNull();
    await expect(a.locator('#coopStrip')).toBeHidden({ timeout: 2000 });
    await expect(b.locator('#coopStrip')).toBeHidden({ timeout: 2000 });
    expect(await a.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.net')).party)).toBeFalsy();
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    await a.context().close(); await b.context().close();
  });

  test('kill switch closes the group', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = await bootNew(browser, saveFor('killA', 'Mia'));
    const b = await bootNew(browser, saveFor('killB', 'Juno'));
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    await friends(aUid, bUid);
    await rootSet('friendInfo/' + aUid, { name: 'Mia', pet: 'Pip' });
    await rootSet('friendInfo/' + bUid, { name: 'Juno', pet: 'Pip' });
    await joinRoom(a); await joinRoom(b);
    await a.evaluate(() => window.PPNet.debug().advancePolls());
    await b.evaluate(() => window.PPNet.debug().advancePolls());
    await a.waitForFunction(sees, bUid);
    await tapUid(a, bUid);
    await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
    await b.locator('#coopJoin').click();
    await expect(a.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2', { timeout: 2000 });
    await rootSet('config/coop/on', false);
    await expect(a.locator('#toast')).toHaveText('Solo for now', { timeout: 5000 });
    await expect(b.locator('#toast')).toHaveText('Solo for now', { timeout: 5000 });
    await expect(a.locator('#coopStrip .coop-head')).toHaveText('Solo for now', { timeout: 5000 });
    await expect.poll(async () => rootGet('parties/AMB4RQ'), { timeout: 5000 }).toBeNull();
    await a.waitForFunction(sees, bUid, { timeout: 5000 });
    await tapUid(a, bUid);
    expect(await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).count()).toBe(0);
    const ctx = env.authenticatedContext(aUid);
    let denied = false;
    try {
      await ctx.database().ref('parties/AMB4RQ/pAAAAAA').set({ cv: 1, host: aUid, made: Date.now(), area: 'hearthmoor', members: {} });
    } catch (e) { denied = true; }
    expect(denied).toBe(true);
    await ctx.database().ref('parties/AMB4RQ/pAAAAAA').remove().catch(() => {});
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
    await a.context().close(); await b.context().close();
  });

  test('idle minute with 2 friends and 2 others stays within 14 reads', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('idleC', 'Mia'));
    const uid = await page.evaluate(() => window.PixelPets.net.uid);
    const seen = Date.now() + 180000;
    for (const id of ['idleA', 'idleB']) {
      await rootSet('rooms/AMB4RQ/hearthmoor/r1/' + id, presence(id, { x: id === 'idleA' ? 6 : 10, y: 12, seen, pt: seen, joined: seen - 20000 }));
      await rootSet('friends/' + uid + '/' + id, true);
      await rootSet('friends/' + id + '/' + uid, true);
      await rootSet('friendInfo/' + id, { name: id === 'idleA' ? 'Fern' : 'Moss', pet: 'Pip' });
    }
    for (const id of ['idleC1', 'idleC2']) {
      await rootSet('rooms/AMB4RQ/hearthmoor/r1/' + id, presence(id, { x: id === 'idleC1' ? 7 : 11, y: 12, seen, pt: seen, joined: seen - 20000 }));
    }
    await joinRoom(page);
    await page.waitForFunction(() => window.PixelPets.net && window.PixelPets.net.others.length >= 4, null, { timeout: 8000 });
    const delta = await page.evaluate(async () => {
      const before = window.PPNet.debug().reads;
      const real = Date.now.bind(Date);
      let skew = 0;
      Date.now = () => real() + skew;
      const step = ms => new Promise(resolve => { skew += ms; setTimeout(resolve, 300); });
      await step(30000);
      await step(30000);
      Date.now = real;
      return window.PPNet.debug().reads - before;
    });
    expect(delta).toBeLessThanOrEqual(14);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('closing the wardrobe writes the holder look once and reads nothing', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = await bootNew(browser, saveFor('wardA', 'Mia'));
    const b = await bootNew(browser, saveFor('wardB', 'Juno'));
    await a.evaluate(() => { PixelPets.state.money = 400; });
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    await joinRoom(a); await joinRoom(b);
    await b.waitForFunction(uid => {
      const n = window.PixelPets.net;
      return !!(n && n.others.some(o => o.uid === uid));
    }, aUid, { timeout: 8000 });
    await a.evaluate(() => window.openWardrobe());
    await a.waitForTimeout(400);
    await a.locator('#ovWardrobe .ward-tabs button[data-tab="holder"]').click();
    await a.locator('.ward-item[data-id="sash"] .ward-act').click();
    await expect(a.locator('#toast')).toHaveText('Keeper sash is yours.');
    await a.waitForTimeout(450);
    await a.locator('.ward-item[data-id="sash"] .ward-act').click();
    await expect(a.locator('#toast')).toHaveText('Wearing the Keeper sash.');
    await a.locator('#ovWardrobe .ward-tabs button[data-tab="colours"]').click();
    await a.locator('.ward-item[data-id="c"] .ward-act').click();
    await expect(a.locator('#toast')).toHaveText('Sky is yours.');
    await a.waitForTimeout(450);
    await a.locator('.ward-item[data-id="c"] .ward-act').click();
    await expect(a.locator('#toast')).toHaveText('Outfit colour: Sky.');
    const before = await a.evaluate(() => ({ reads: window.PPNet.debug().reads, writes: window.PPNet.debug().stats.writes }));
    await a.locator('#wardDone').click();
    const shard = await a.evaluate(() => window.PixelPets.net.room);
    await expect.poll(async () => {
      const look = await rootGet('rooms/AMB4RQ/hearthmoor/' + shard + '/' + aUid + '/look');
      return look && look.ax + '/' + look.oc;
    }, { timeout: 8000 }).toBe('sash/c');
    await b.waitForFunction(uid => {
      const n = window.PixelPets.net;
      const o = n && n.others.find(x => x.uid === uid);
      return !!(o && o.look && o.look.ax === 'sash' && o.look.oc === 'c');
    }, aUid, { timeout: 8000 });
    const after = await a.evaluate(() => ({ reads: window.PPNet.debug().reads, writes: window.PPNet.debug().stats.writes }));
    expect(after.reads - before.reads).toBe(0);
    expect(after.writes - before.writes).toBe(1);
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
    await a.context().close(); await b.context().close();
  });

  test('strip and sheet fit at 320 and 390', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    for (const w of [320, 390]) {
      await wipe();
      const a = await bootNew(browser, saveFor('fitA' + w, 'Mia'), w);
      const b = await bootNew(browser, saveFor('fitB' + w, 'Juno'), w);
      const aUid = await a.evaluate(() => window.PixelPets.net.uid);
      const bUid = await b.evaluate(() => window.PixelPets.net.uid);
      await friends(aUid, bUid);
      await rootSet('friendInfo/' + bUid, { name: 'Juno', pet: 'Pip' });
      await joinRoom(a); await joinRoom(b);
      await a.evaluate(() => window.PPNet.debug().advancePolls());
      await a.waitForFunction(sees, bUid);
      await tapUid(a, bUid);
      const labels = await a.locator('#holderCard button').evaluateAll(els => els.map(e => e.textContent.trim()));
      labels.forEach(t => expect(t.length).toBeLessThanOrEqual(30));
      const cardBtns = await a.locator('#holderCard button').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }));
      cardBtns.forEach(n => expect(n).toBeGreaterThanOrEqual(44));
      await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
      await expect(b.locator('#coopAsk')).toBeVisible({ timeout: 5000 });
      const askBtns = await b.locator('#coopAsk button').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { n: Math.min(r.width, r.height), t: e.textContent.trim() }; }));
      askBtns.forEach(o => { expect(o.t.length).toBeLessThanOrEqual(30); expect(o.n).toBeGreaterThanOrEqual(44); });
      await b.locator('#coopJoin').click();
      await expect(a.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2', { timeout: 2000 });
      const boxes = await a.evaluate(() => {
        const r = el => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
        const hit = (p, q) => p.w > 0 && q.w > 0 && p.x < q.r && p.r > q.x && p.y < q.b && p.b > q.y;
        const strip = r(document.querySelector('#coopStrip'));
        const say = r(document.querySelector('#sayBtn'));
        const env = r(document.querySelector('#envBadge'));
        const fc = document.querySelector('#fcTR');
        const fcR = r(fc);
        const fcOn = getComputedStyle(fc).display !== 'none' && fcR.w > 0 && fcR.h > 0;
        return { hitSay: hit(strip, say), hitEnv: hit(strip, env), hitFc: fcOn && hit(strip, fcR), heads: [...document.querySelectorAll('.coop-head-btn')].map(e => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)) };
      });
      expect(boxes.hitSay).toBe(false);
      expect(boxes.hitEnv).toBe(false);
      expect(boxes.hitFc).toBe(false);
      boxes.heads.forEach(n => expect(n).toBeGreaterThanOrEqual(44));
      expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
      await a.context().close(); await b.context().close();
    }
  });

  test('hidden tab greys the partner and drops at 60 s', async ({}, info) => {
    test.skip(info.project.name !== '390', '390 only');
    test.setTimeout(90000);
    // The suite's Chromium host-resolver arg is not a WebKit flag. Drop it for this launch.
    const browser = await webkit.launch({ args: [] });
    const a = await bootNew(browser, saveFor('hidA', 'Mia'), 390);
    const b = await bootNew(browser, saveFor('hidB', 'Juno'), 390);
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    await friends(aUid, bUid);
    await rootSet('friendInfo/' + aUid, { name: 'Mia', pet: 'Pip' });
    await rootSet('friendInfo/' + bUid, { name: 'Juno', pet: 'Pip' });
    await joinRoom(a); await joinRoom(b);
    await a.evaluate(() => window.PPNet.debug().advancePolls());
    await b.evaluate(() => window.PPNet.debug().advancePolls());
    await a.waitForFunction(sees, bUid);
    await tapUid(a, bUid);
    await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
    await b.locator('#coopJoin').click();
    await expect(a.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2', { timeout: 2000 });
    const pid = await a.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.net')).party.pid);
    await hideTab(b, true);
    await expect(a.locator('#coopStrip .coop-head-btn.away')).toBeVisible({ timeout: 2000 });
    const count = await a.locator('#coopStrip .coop-count').innerText();
    expect(count).toMatch(/^\d+$/);
    await shot(a, 'b1_strip_away_390.png', '#coopStrip');
    await hideTab(b, false);
    await expect(a.locator('#coopStrip .coop-head-btn.away')).toHaveCount(0, { timeout: 3000 });
    await hideTab(b, true);
    await expect(a.locator('#coopStrip .coop-head-btn.away')).toBeVisible({ timeout: 2000 });
    await a.evaluate(() => {
      const real = Date.now.bind(Date);
      Date.now = () => real() + 61000;
    });
    await expect.poll(async () => rootGet('parties/AMB4RQ/' + pid + '/members/' + bUid), { timeout: 4000 }).toBeNull();
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    await a.context().close(); await b.context().close();
    await browser.close();
  });

  test('an interior keeps the party online', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    test.setTimeout(50000);
    const a = await bootNew(browser, saveFor('inA', 'Mia'));
    const b = await bootNew(browser, saveFor('inB', 'Juno'));
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    await friends(aUid, bUid);
    await rootSet('friendInfo/' + bUid, { name: 'Juno', pet: 'Pip' });
    await joinRoom(a); await joinRoom(b);
    await a.evaluate(() => window.PPNet.debug().advancePolls());
    await a.waitForFunction(sees, bUid);
    await tapUid(a, bUid);
    await a.locator('#holderCard button', { hasText: 'WALK TOGETHER' }).click();
    await b.locator('#coopJoin').click();
    await expect(b.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2', { timeout: 2000 });
    await b.evaluate(() => window.PixelPets.goto('hm_lodge_in', 4, 4, 'up'));
    await expect.poll(async () => {
      const tree = await rootGet('rooms/AMB4RQ/hearthmoor');
      return !tree || !JSON.stringify(tree).includes(bUid);
    }, { timeout: 2000 }).toBe(true);
    await b.waitForTimeout(2000);
    expect(await b.evaluate(() => window.PixelPets.net.connected)).toBe(true);
    await expect(b.locator('#coopStrip .coop-head')).toHaveText('GROUP 2/2');
    expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
    await a.context().close(); await b.context().close();
  });
});
