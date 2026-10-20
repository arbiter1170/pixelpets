/* PLAY_TOGETHER_P1. Two holders on the local Firebase emulators only. Never the live project.
   Every case runs in the 390 project (one worker, one emulator). Layout checks open their own 320 and 375 pages. */
const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const { starterSave, installSave, gotoGame } = require('./helpers');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const SHOTS = 'review-play-together';
const LOCK = require('path').join(__dirname, '..', 'test-logs', 'rtdb-play.lock');
async function lockEmu(){
  fs.mkdirSync(require('path').dirname(LOCK), { recursive: true });
  for (let i = 0; i < 240; i++) {
    try { fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' }); return; }
    catch (e) {
      let owner = 0;
      try { owner = parseInt(fs.readFileSync(LOCK, 'utf8'), 10); } catch (e2) {}
      let alive = false;
      if (owner) { try { process.kill(owner, 0); alive = true; } catch (e3) {} }
      if (!alive) { try { fs.unlinkSync(LOCK); } catch (e4) {} continue; }
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('emulator lock');
}
function unlockEmu(){
  try { if (fs.existsSync(LOCK) && fs.readFileSync(LOCK, 'utf8') === String(process.pid)) fs.unlinkSync(LOCK); } catch (e) {}
}
const BASE = 'http://127.0.0.1:' + (process.env.PP_PORT || '8080');
let emu = null, emuStarted = false, env = null;

const ADJ = ['Mossy','Amber','Sunny','Misty','Quiet','Brave','Cozy','Dewy','Ferny','Pebbly','Breezy','Starry','Rosy','Hazy','Mellow','Nimble','Plucky','Gentle','Cheery','Rustly','Twinkly','Snug','Merry','Clover','Maple','Hazel','Thistle','Puddly','Leafy','Drowsy','Bouncy','Woolly'];
const NOUN = ['Rambler','Wanderer','Strider','Hiker','Rover','Roamer','Trekker','Stroller','Forager','Drifter','Pathfinder','Tracker','Ambler','Voyager','Sprout','Pinecone','Acorn','Sparrow','Otter','Badger','Wren','Finch','Hedgehog','Moth','Toadstool','Puffin','Squirrel','Robin','Beetle','Lark','Newt','Fawn'];
function fnv(s){ let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function nameFor(uid){ const h = fnv(String(uid)); return ADJ[h % 32] + ' ' + NOUN[(h >>> 8) % 32]; }
function portOpen(port){
  return new Promise(res => { const s = net.connect({ port, host: '127.0.0.1' }, () => { s.end(); res(true); }); s.on('error', () => res(false)); });
}
function presence(extra){
  const now = Date.now();
  return Object.assign({
    pv: 1, x: 5, y: 12, f: 'd', mv: 0,
    look: { sk: '3', hr: 'short', hc: 'p', of: 'coat', oc: 't', ac: 'r', ax: 'none' },
    pet: { sp: 'ember', st: 0, lv: 5 }, seals: 0, title: 0, vis: 'a',
    joined: now - 20000, seen: now, pt: now - 1000,
  }, extra || {});
}
function saveFor(uid, name){
  const s = starterSave();
  s.uid = uid; s.created = 1700000000000 + uid.length;
  s.player.name = name;
  s.player.look = { skin: '3', hair: 'short', hairCol: 'p', outfit: 'coat', outfitCol: 't', accent: 'r', accessory: 'none' };
  s.settings.tips = false; s.settings.music = false; s.settings.musicVol = 0;
  s.flags['story.phone_got'] = true; s.flags['story.tutorial_done'] = true;
  s.world = { map: 'hearthmoor', x: 8, y: 12, facing: 'down', respawn: 'hearthmoor' };
  s.party[0].nick = name === 'Tester' ? 'Pomlet' : null;
  return s;
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
}
function watchErrors(page){
  page.ppErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') page.ppErrors.push(msg.text()); });
  page.on('pageerror', err => page.ppErrors.push(String(err)));
}
async function onWalk(page){
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.net && window.PixelPets.net.uid, null, { timeout: 25000 });
  await page.evaluate(() => {
    window.PixelPets.showTab('walk');
    if (window.PixelPets.clearWild) window.PixelPets.clearWild();
  });
}
async function boot(page, save, search){
  await installSave(page.context(), save, { quietDay: true });
  watchErrors(page);
  await gotoGame(page, search || '?cloud=emu&debug=1');
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
async function joinRoom(page){
  await enterCode(page, 'AMB-4RQ');
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
async function advanceClock(page, ms){
  await page.evaluate(async (ms) => {
    const real = Date.now.bind(Date);
    let extra = 0;
    Date.now = () => real() + extra;
    extra += ms;
    await new Promise(resolve => setTimeout(resolve, 500));
    Date.now = real;
  }, ms);
}
async function shot(page, name, sel){
  fs.mkdirSync(SHOTS, { recursive: true });
  const opts = { path: SHOTS + '/' + name, animations: 'disabled', scale: 'css' };
  if (sel) await page.locator(sel).screenshot(opts);
  else await page.screenshot(opts);
}

test.describe('Play together', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  // The whole file runs in the 390 project. With `workers: 2`, a 320 or 375 copy of this serial group
  // would run beside it on the same emulator and room code. 320 and 375 run inside 34 and 40 instead.
  test.beforeAll(async ({}, info) => {
    test.skip(info.project.name !== '390', 'runs in the 390 project; other widths run inside it');
    await lockEmu();
    const ready = await portOpen(9000) && await portOpen(9099) && await portOpen(8180);
    if (!ready) {
      emu = spawn('npx', ['firebase', 'emulators:start', '--only', 'auth,firestore,database', '--project', 'demo-walklings'], { detached: true, stdio: 'ignore' });
      emuStarted = true;
      for (let i = 0; i < 80; i++) {
        if (await portOpen(9000) && await portOpen(9099) && await portOpen(8180)) break;
        await new Promise(r => setTimeout(r, 500));
      }
    }
    if (!(await portOpen(9000))) throw new Error('database emulator did not start');
    env = await initializeTestEnvironment({ projectId: 'demo-walklings', database: { host: '127.0.0.1', port: 9000, rules: fs.readFileSync('database.rules.json', 'utf8') } });
    await rootSet('roomCodes/AMB4RQ', { on: true });
  });
  test.afterAll(async () => {
    if (env) await env.cleanup();
    if (emuStarted && emu && emu.pid) { try { process.kill(-emu.pid, 'SIGTERM'); } catch (e) { try { emu.kill('SIGTERM'); } catch (e2) {} } }
    unlockEmu();
  });
  test.beforeEach(async ({}, info) => { if (info.project.name === '390' || info.project.name === '320') await wipe(); });

  test('1 off when cloud is off', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const hits = [];
    page.on('request', r => { if (r.url().includes('firebase-database')) hits.push(r.url()); });
    page.on('websocket', ws => { if (ws.url().includes('9000')) hits.push(ws.url()); });
    await installSave(page.context(), saveFor('off1', 'Tester'), { quietDay: true });
    watchErrors(page);
    await gotoGame(page, '?debug=1');
    await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
    await page.waitForTimeout(800);
    expect(hits, 'check 1 no database sdk or socket').toEqual([]);
    expect(await page.locator('#playTogether').count()).toBe(0);
    expect(await page.locator('#sayBtn').count()).toBe(0);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('2 no code, no socket', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const socks = [];
    page.on('websocket', ws => { if (/9000/.test(ws.url())) socks.push(ws.url()); });
    await boot(page, saveFor('nocode1', 'Tester'));
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#playTogether')).toBeVisible();
    await expect(page.locator('#setRoomCode .set-val')).toHaveText(/ENTER/);
    await page.locator('#setRoomCode').click();
    await expect(page.locator('#roomCodeOv')).toBeVisible();
    await shot(page, 'room_code_390.png', '#roomCodeOv .ov-inner');
    await page.locator('#roomCodeOv button', { hasText: 'CLOSE' }).click();
    expect(await page.locator('#sayBtn').isVisible()).toBe(false);
    expect(socks, 'check 2 no RTDB socket').toEqual([]);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('3 bad code writes nothing', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('badcode1', 'Tester'));
    await enterCode(page, 'ZZZ-ZZZ');
    await expect(page.locator('#toast')).toHaveText("That code isn't open.");
    expect(await page.evaluate(() => window.PixelPets.net.room)).toBeFalsy();
    expect(await rootGet('rooms')).toBeFalsy();
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('4 to 8 see, move, ghosts, look, throttle', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = page, b = await bootNew(browser, saveFor('holderB', 'Birch'));
    await boot(a, saveFor('holderA', 'Tester'));
    await joinRoom(a); await joinRoom(b);
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    await a.waitForFunction(sees, bUid, { timeout: 3000 });
    await b.waitForFunction(sees, aUid, { timeout: 3000 });
    const look = await b.evaluate(uid => {
      const o = window.PixelPets.net.others.find(x => x.uid === uid);
      return { look: o.look, pet: o.pet };
    }, aUid);
    expect(look.look).toMatchObject({ sk: '3', hr: 'short', hc: 'p', of: 'coat', oc: 't', ac: 'r', ax: 'none' });
    expect(look.pet.sp).toBe('ember');
    expect(look.pet.st).toBe(0);
    const x0 = await a.evaluate(() => window.PixelPets.state.world.x);
    let glided = false;
    await a.keyboard.down('ArrowRight');
    const walkEnd = Date.now() + 5000;
    while (Date.now() < walkEnd) {
      const sample = await b.evaluate(uid => {
        const o = window.PixelPets.net.others.find(z => z.uid === uid);
        return o ? o.fx : null;
      }, aUid);
      if (typeof sample === 'number' && Math.abs(sample - Math.round(sample)) > 0.04) glided = true;
      const ax = await a.evaluate(() => window.PixelPets.state.world.x);
      if (ax >= x0 + 5) break;
      await a.waitForTimeout(40);
    }
    await a.keyboard.up('ArrowRight');
    const stopped = await a.evaluate(() => window.PixelPets.state.world);
    expect(stopped.x, 'check 5 five tiles').toBeGreaterThanOrEqual(x0 + 5);
    expect(glided, 'check 5 glide').toBe(true);
    await b.waitForFunction(({ uid, x, y }) => {
      const o = window.PixelPets.net.others.find(z => z.uid === uid);
      return o && o.x === x && o.y === y && o.f === 'r';
    }, { uid: aUid, x: stopped.x, y: stopped.y }, { timeout: 1500 });
    const before = await a.evaluate(() => window.PixelPets.net.stats.writes);
    let dir = 'ArrowRight';
    await a.keyboard.down(dir);
    const paceEnd = Date.now() + 10000;
    while (Date.now() < paceEnd) {
      const x = await a.evaluate(() => window.PixelPets.state.world.x);
      if (dir === 'ArrowRight' && x >= 14) {
        await a.keyboard.up('ArrowRight'); dir = 'ArrowLeft'; await a.keyboard.down('ArrowLeft');
      } else if (dir === 'ArrowLeft' && x <= 8) {
        await a.keyboard.up('ArrowLeft'); dir = 'ArrowRight'; await a.keyboard.down('ArrowRight');
      }
      await a.waitForTimeout(80);
    }
    await a.keyboard.up(dir);
    const writes = await a.evaluate(() => window.PixelPets.net.stats.writes);
    expect(writes - before, 'check 8 throttle').toBeLessThanOrEqual(26);
    expect(writes - before).toBeGreaterThan(8);
    await a.evaluate(() => window.PixelPets.goto('hearthmoor', 10, 12, 'down'));
    await b.evaluate(() => window.PixelPets.goto('hearthmoor', 8, 12, 'right'));
    await b.keyboard.down('ArrowRight');
    await b.waitForFunction(() => window.PixelPets.state.world.x >= 12, null, { timeout: 4000 });
    await b.keyboard.up('ArrowRight');
    expect(await b.evaluate(() => window.PixelPets.scene)).toBeFalsy();
    await a.evaluate(() => window.PixelPets.goto('hearthmoor', 15, 6, 'down'));
    await b.evaluate(() => window.PixelPets.goto('hearthmoor', 15, 7, 'up'));
    await b.keyboard.down('ArrowUp');
    await b.waitForFunction(() => window.PixelPets.state.world.map === 'hm_lodge_in', null, { timeout: 3000 });
    await b.keyboard.up('ArrowUp');
    expect(await b.evaluate(() => !!window.PixelPets.scene || (window.PixelPets.battle && window.PixelPets.battle.on))).toBe(false);
    await a.evaluate(() => window.PixelPets.goto('route1', 10, 8, 'down'));
    await b.evaluate(() => window.PixelPets.goto('route1', 10, 8, 'left'));
    await a.waitForFunction(uid => {
      const o = window.PixelPets.net.others.find(z => z.uid === uid);
      return o && o.drawn && Math.round(o.fx) === 10 && Math.round(o.fy) === 8;
    }, bUid, { timeout: 3000 });
    await b.waitForFunction(uid => {
      const o = window.PixelPets.net.others.find(z => z.uid === uid);
      return o && o.drawn && Math.round(o.fx) === 10 && Math.round(o.fy) === 8;
    }, aUid, { timeout: 3000 });
    await shot(a, 'route1_two_390.png', '#mapWrap');
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
    await b.context().close();
  });

  test('9 heartbeat is seen only', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('heart1', 'Tester'));
    await joinRoom(page);
    await page.waitForTimeout(500);
    const uid = await page.evaluate(() => window.PixelPets.net.uid);
    const w0 = await page.evaluate(() => window.PixelPets.net.stats.writes);
    const node0 = await rootGet('rooms/AMB4RQ/hearthmoor');
    await page.waitForTimeout(22000);
    const w1 = await page.evaluate(() => window.PixelPets.net.stats.writes);
    const node1 = await rootGet('rooms/AMB4RQ/hearthmoor');
    expect(w1 - w0, 'check 9 one heartbeat').toBe(1);
    const a = node0 && node0.r1 && node0.r1[uid], c = node1 && node1.r1 && node1.r1[uid];
    expect(c.x).toBe(a.x); expect(c.y).toBe(a.y); expect(c.f).toBe(a.f); expect(c.pt).toBe(a.pt);
    expect(c.seen).toBeGreaterThan(a.seen);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('10 leave and stale', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    test.setTimeout(90000);
    const a = page, b = await bootNew(browser, saveFor('staleB', 'Birch'));
    await boot(a, saveFor('staleA', 'Tester'));
    await joinRoom(a); await joinRoom(b);
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    await b.waitForFunction(sees, aUid);
    await a.close();
    await expect.poll(async () => b.evaluate(sees, aUid), { timeout: 5000 }).toBe(false);
    const fake = 'staleFake';
    await rootSet('rooms/AMB4RQ/hearthmoor/r1/' + fake, presence({ seen: Date.now(), joined: Date.now() - 5000 }));
    await b.waitForFunction(sees, fake, { timeout: 3000 });
    await b.waitForTimeout(65000);
    expect(await b.evaluate(sees, fake)).toBe(false);
    expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
    await b.context().close();
  });

  test('11 room cap and 12 friends first', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('cap1', 'Tester'));
    for (let i = 0; i < 20; i++) await rootSet('rooms/AMB4RQ/hearthmoor/r1/fake' + i, presence({ x: (i % 10) + 2, y: 12, joined: Date.now() - 60000 - i }));
    await joinRoom(page);
    expect(await page.evaluate(() => window.PixelPets.net.room)).toBe('r2');
    await page.evaluate(() => { localStorage.removeItem('pixelpets.net'); });
    await wipe();
    const uid = await page.evaluate(() => window.PixelPets.net.uid);
    for (let i = 0; i < 20; i++) await rootSet('rooms/AMB4RQ/hearthmoor/r1/fake' + i, presence({ joined: Date.now() - 60000 - i }));
    await rootSet('friends/' + uid + '/fake0', true);
    await rootSet('friends/fake0/' + uid, true);
    await page.reload();
    await onWalk(page);
    await joinRoom(page);
    expect(await page.evaluate(() => window.PixelPets.net.room), 'check 12 under 24').toBe('r1');
    await page.evaluate(() => localStorage.removeItem('pixelpets.net'));
    for (let i = 20; i < 24; i++) await rootSet('rooms/AMB4RQ/hearthmoor/r1/fake' + i, presence({ joined: Date.now() - 1000 - i }));
    await page.reload();
    await onWalk(page);
    await joinRoom(page);
    expect(await page.evaluate(() => window.PixelPets.net.room), 'check 12 hard cap').toBe('r2');
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('13 overflow repair', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    for (let i = 0; i < 19; i++) await rootSet('rooms/AMB4RQ/hearthmoor/r1/fake' + i, presence({ joined: Date.now() - 80000 - i }));
    const a = page, b = await bootNew(browser, saveFor('overB', 'Birch'));
    await boot(a, saveFor('overA', 'Tester'));
    await Promise.all([joinRoom(a), joinRoom(b)]);
    await a.waitForTimeout(5000);
    const rooms = await a.evaluate(() => window.PixelPets.net.room);
    const roomb = await b.evaluate(() => window.PixelPets.net.room);
    const tree = await rootGet('rooms/AMB4RQ/hearthmoor/r1');
    const live = tree ? Object.values(tree).filter(n => n && n.pv === 1 && Date.now() - n.seen < 60000 && !n.busy).length : 0;
    expect(live, 'check 13 r1 cap').toBeLessThanOrEqual(20);
    expect([rooms, roomb].includes('r2') || live <= 20).toBe(true);
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    await b.context().close();
  });

  test('14 area and 15 interior', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    test.setTimeout(50000);
    const a = page, b = await bootNew(browser, saveFor('areaB', 'Birch'));
    await boot(a, saveFor('areaA', 'Tester'));
    await joinRoom(a); await joinRoom(b);
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    await b.waitForFunction(sees, aUid);
    await a.evaluate(() => window.PixelPets.goto('route1', 10, 8, 'down'));
    await expect.poll(async () => {
      const tree = await rootGet('rooms/AMB4RQ/hearthmoor');
      return !tree || !JSON.stringify(tree).includes(aUid);
    }, { timeout: 2000 }).toBe(true);
    const r1 = await rootGet('rooms/AMB4RQ/route1');
    expect(JSON.stringify(r1 || '')).toContain(aUid);
    expect(await b.evaluate(sees, aUid)).toBe(false);
    await a.evaluate(() => window.PixelPets.goto('hearthmoor', 8, 12, 'down'));
    await a.evaluate(() => window.PixelPets.goto('hm_lodge_in', 4, 4, 'up'));
    await expect.poll(async () => {
      const tree = await rootGet('rooms/AMB4RQ/hearthmoor');
      return !tree || !JSON.stringify(tree).includes(aUid);
    }, { timeout: 1000 }).toBe(true);
    expect(await a.evaluate(() => window.PixelPets.net.others.length)).toBe(0);
    await a.evaluate(() => window.PixelPets.goto('hearthmoor', 8, 12, 'down'));
    await b.waitForFunction(sees, aUid, { timeout: 3000 });
    await a.evaluate(() => window.PixelPets.goto('hm_lodge_in', 4, 4, 'up'));
    await a.waitForTimeout(31000);
    expect(await a.evaluate(() => window.PixelPets.net.connected)).toBe(false);
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    await b.context().close();
  });

  test('16 battle hides both ways', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = page, b = await bootNew(browser, saveFor('batB', 'Birch'));
    await boot(a, saveFor('batA', 'Tester'));
    await joinRoom(a); await joinRoom(b);
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    await b.waitForFunction(sees, aUid);
    await a.evaluate(() => window.PixelPets.forceBattle('ember/0', 3));
    await expect.poll(async () => b.evaluate(sees, aUid), { timeout: 2000 }).toBe(false);
    expect(await a.evaluate(() => window.PixelPets.net.others.length)).toBe(0);
    const node = await rootGet('rooms/AMB4RQ/hearthmoor');
    expect(JSON.stringify(node)).toContain('"busy":1');
    for (let i = 0; i < 8; i++) {
      const on = await a.evaluate(() => !!(window.PixelPets.battle && window.PixelPets.battle.on));
      if (!on) break;
      const run = a.locator('#btRun');
      if (await run.isVisible()) await run.click();
      await a.waitForTimeout(700);
    }
    expect(await a.evaluate(() => !!(window.PixelPets.battle && window.PixelPets.battle.on))).toBe(false);
    await b.waitForFunction(sees, aUid, { timeout: 3000 });
    await a.waitForFunction(sees, bUid, { timeout: 3000 });
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    await b.context().close();
  });

  test('17 to 20 emote, phrase, rate', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = page, b = await bootNew(browser, saveFor('emoB', 'Birch'));
    await boot(a, saveFor('emoA', 'Tester'));
    await joinRoom(a); await joinRoom(b);
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    await b.waitForFunction(sees, aUid);
    await a.locator('#sayBtn').click();
    await a.locator('#sayEmotes button', { hasText: 'Wave' }).click();
    await b.waitForFunction(uid => {
      const o = window.PixelPets.net.others.find(x => x.uid === uid);
      return o && o.emote && o.emote.id === 'e_wave';
    }, aUid, { timeout: 2000 });
    await a.waitForTimeout(2100);
    await a.locator('#sayBtn').click();
    await a.locator('#sayPhrases button', { hasText: 'Hi there!' }).click();
    await expect(b.locator('#netBubble')).toHaveText('Hi there!', { timeout: 2000 });
    const box = await b.locator('#netBubble').boundingBox();
    const map = await b.locator('#mapWrap').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(map.x - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(map.x + map.width + 1);
    await a.waitForTimeout(2100);
    await a.locator('#sayBtn').click();
    await a.locator('#sayEmotes button', { hasText: 'Wave' }).click();
    await a.locator('#sayBtn').click();
    expect(await a.locator('#sayEmotes button').first().isDisabled()).toBe(true);
    const denied = await a.evaluate(() => window.PixelPets.net.rawWrite('e_heart'));
    expect(denied).toContain('PERMISSION_DENIED');
    const extra = await a.evaluate(async () => {
      const out = [];
      out.push(await window.PixelPets.net.rawWrite('hello'));
      return out[0];
    });
    expect(extra).toContain('PERMISSION_DENIED');
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    await b.context().close();
  });

  test('21 to 24 mute and block', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = page, b = await bootNew(browser, saveFor('blkB', 'Birch'));
    await boot(a, saveFor('blkA', 'Tester'));
    await joinRoom(a); await joinRoom(b);
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    await a.waitForFunction(sees, bUid);
    await rootSet('friends/' + aUid + '/' + bUid, true);
    await rootSet('friends/' + bUid + '/' + aUid, true);
    await rootSet('friendInfo/' + aUid, { name: 'Tester', pet: 'Pomlet' });
    await b.reload(); await onWalk(b);
    await joinRoom(b);
    await b.waitForFunction(sees, aUid);
    await tapUid(b, aUid);
    await expect(b.locator('#holderCard')).toBeVisible();
    const friendCard = await b.locator('#holderCard').innerText();
    expect(friendCard).toContain('Tester');
    expect(friendCard).toContain('FRIEND');
    expect(friendCard).toContain('Pomlet');
    await b.locator('#holderCard button', { hasText: 'MUTE' }).click();
    expect(await b.evaluate(() => { const m = JSON.parse(localStorage.getItem('pixelpets.net')).mutes; return Object.keys(m).length; })).toBe(1);
    await a.locator('#sayBtn').click();
    await a.locator('#sayPhrases button', { hasText: 'Hi there!' }).click();
    await b.waitForTimeout(600);
    expect(await b.locator('#netBubble').isVisible()).toBe(false);
    expect(await b.evaluate(sees, aUid)).toBe(true);
    await b.reload(); await onWalk(b);
    await joinRoom(b);
    expect(await b.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.net')).mutes).length)).toBe(1);
    await b.waitForFunction(sees, aUid);
    await tapUid(b, aUid);
    await b.locator('#holderCard button', { hasText: 'UNMUTE' }).click();
    expect(await b.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.net')).mutes).length)).toBe(0);
    await a.waitForTimeout(2100);
    await a.locator('#sayBtn').click();
    await a.locator('#sayPhrases button', { hasText: 'Hi there!' }).click();
    await expect(b.locator('#netBubble')).toHaveText('Hi there!', { timeout: 2000 });
    await b.locator('#holderCard button', { hasText: 'BLOCK' }).click();
    await expect(b.locator('#netUndo')).toContainText('Blocked. UNDO');
    await expect(b.locator('#friendList')).not.toContainText('Tester');
    await expect.poll(async () => b.evaluate(sees, aUid), { timeout: 3000 }).toBe(false);
    // The other holder learns a block on the 30 s hidden poll (COOP_R2 §2.4).
    await advanceClock(a, 30000);
    await expect.poll(async () => a.evaluate(sees, bUid), { timeout: 3000 }).toBe(false);
    expect(await rootGet('blocks/' + bUid + '/' + aUid)).toBeTruthy();
    expect(await rootGet('hidden/' + aUid + '/' + bUid)).toBeTruthy();
    expect(await rootGet('friends/' + bUid + '/' + aUid)).toBeFalsy();
    await b.locator('#netUndo button').click();
    await expect.poll(async () => b.evaluate(sees, aUid), { timeout: 3000 }).toBe(true);
    await tapUid(b, aUid);
    await b.locator('#holderCard button', { hasText: 'BLOCK' }).click();
    await b.locator('#holderCard').waitFor({ state: 'hidden' });
    await b.locator('#settingsBtn').click();
    await b.locator('#setBlocked').click();
    await b.locator('#blockedList button', { hasText: 'UNBLOCK' }).click();
    await b.locator('#blockedOv button', { hasText: 'CLOSE' }).click();
    await closeSettings(b);
    await b.reload(); await onWalk(b);
    await joinRoom(b);
    await a.reload(); await onWalk(a);
    await joinRoom(a);
    await b.waitForFunction(sees, aUid, { timeout: 5000 });
    expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
    await b.context().close();
  });

  test('25 solo and 26 friends only', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const b = page, a = await bootNew(browser, saveFor('soloA', 'Tester'));
    const c = await bootNew(browser, saveFor('soloC', 'Cedar'));
    await boot(b, saveFor('soloB', 'Birch'));
    await joinRoom(a); await joinRoom(b); await joinRoom(c);
    const aUid = await a.evaluate(() => window.PixelPets.net.uid);
    const bUid = await b.evaluate(() => window.PixelPets.net.uid);
    const cUid = await c.evaluate(() => window.PixelPets.net.uid);
    await rootSet('friends/' + aUid + '/' + bUid, true);
    await rootSet('friends/' + bUid + '/' + aUid, true);
    await b.locator('#settingsBtn').click();
    await b.locator('.net-pill', { hasText: 'SOLO' }).click();
    await expect.poll(async () => rootGet('rooms/AMB4RQ/hearthmoor'), { timeout: 1000 }).not.toBeNull();
    await expect.poll(async () => {
      const tree = await rootGet('rooms/AMB4RQ/hearthmoor');
      return !tree || !JSON.stringify(tree).includes(bUid);
    }, { timeout: 1000 }).toBe(true);
    expect(await b.evaluate(() => window.PixelPets.net.connected)).toBe(false);
    expect(await a.evaluate(sees, bUid)).toBe(false);
    await b.locator('.net-pill', { hasText: 'ON' }).click();
    await closeSettings(b);
    await a.waitForFunction(sees, bUid, { timeout: 3000 });
    await b.locator('#settingsBtn').click();
    await b.locator('.net-pill', { hasText: 'FRIENDS' }).click();
    await closeSettings(b);
    await b.waitForFunction(sees, aUid, { timeout: 3000 });
    expect(await b.evaluate(sees, cUid)).toBe(false);
    expect(await c.evaluate(sees, bUid)).toBe(false);
    // Friends poll every 60 s. Run that poll now so the check does not wait out the minute.
    await a.evaluate(() => window.PPNet.debug().advancePolls());
    await a.waitForFunction(sees, bUid, { timeout: 3000 });
    expect(b.ppErrors, b.ppErrors.join('\n')).toEqual([]);
    await a.context().close(); await c.context().close();
  });

  test('27 to 30 cards and names', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    let clash = null;
    for (let i = 0; i < 4000 && !clash; i++) {
      for (let j = i + 1; j < 4000; j++) {
        if (nameFor('n' + i) === nameFor('n' + j)) { clash = ['n' + i, 'n' + j]; break; }
      }
    }
    expect(clash).toBeTruthy();
    await rootSet('rooms/AMB4RQ/hearthmoor/r1/' + clash[0], presence({ joined: Date.now() - 5000, x: 6, y: 12 }));
    await rootSet('rooms/AMB4RQ/hearthmoor/r1/' + clash[1], presence({ joined: Date.now() - 1000, x: 7, y: 12 }));
    await boot(page, saveFor('cardMe', 'Tester'));
    await joinRoom(page);
    await page.waitForFunction(uid => window.PixelPets.net.others.some(o => o.uid === uid), clash[0]);
    const shown = await page.evaluate(ids => {
      const n = window.PixelPets.net;
      return ids.map(id => ({ id, name: (n.others.find(o => o.uid === id) || {}).name, base: n.nameFor(id) }));
    }, clash);
    expect(shown[0].name).toBe(shown[0].base);
    expect(shown[1].name).toBe(shown[1].base + ' 2');
    const again = await page.evaluate(id => window.PixelPets.net.nameFor(id), clash[0]);
    await page.reload();
    await onWalk(page);
    await joinRoom(page);
    expect(await page.evaluate(id => window.PixelPets.net.nameFor(id), clash[0])).toBe(again);
    await tapUid(page, clash[1]);
    await expect(page.locator('#holderCard')).toBeVisible();
    const card = await page.locator('#holderCard').innerText();
    expect(card).toContain(shown[1].name);
    expect(card).toContain('Pipkit');
    expect(card).not.toContain('Pomlet');
    expect(card).toContain('WAVE');
    expect(card).toContain('MUTE');
    expect(card).toContain('BLOCK');
    expect(card).toContain('CLOSE');
    expect(card).not.toContain('WLK-');
    expect(card.toLowerCase()).not.toContain('keeper');
    expect(card.toLowerCase()).not.toContain('trainer');
    await page.locator('#holderCard button', { hasText: 'CLOSE' }).click();
    const self = await page.evaluate(() => {
      const n = window.PixelPets.net, c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect();
      return { x: (n.pos.x * 16 - n.cam.x + 8) / c.width * r.width + r.left, y: (n.pos.y * 16 - n.cam.y + 8) / c.height * r.height + r.top };
    });
    await page.mouse.click(self.x, self.y);
    await expect(page.locator('#holderCard')).toBeVisible();
    const mine = await page.locator('#holderCard').innerText();
    expect(mine).toContain('Tester');
    expect(mine).toContain('YOUR HOLDER CODE');
    expect(mine).toContain('WLK-');
    expect(mine).not.toContain('MUTE');
    expect(mine).not.toContain('BLOCK');
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('31 add friend', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = page, b = await bootNew(browser, saveFor('frB', 'Birch'));
    await boot(a, saveFor('frA', 'Tester'));
    await joinRoom(a); await joinRoom(b);
    const codeB = await b.evaluate(() => window.PixelPets.state && document.querySelector('#friendCode') ? null : null);
    await b.locator('#phoneBtn').click();
    await b.locator('[data-app="friends"]').click();
    const shown = (await b.locator('#friendCode').innerText()).trim();
    await a.locator('#phoneBtn').click();
    await a.locator('[data-app="friends"]').click();
    await a.locator('#friendInput').fill(shown.replace('WLK-', 'PXP-'));
    await a.locator('#friendAdd').click();
    await expect(a.locator('#toast')).toHaveText('Added. Waiting for them.');
    const codeA = (await a.locator('#friendCode').innerText()).trim();
    await b.locator('#friendInput').fill(codeA);
    await b.locator('#friendAdd').click();
    await expect(b.locator('#toast')).toHaveText('You are friends now!');
    await a.evaluate(() => window.PPNet.debug().advancePolls());
    await expect(a.locator('#friendList')).toContainText('Birch');
    const uid = await a.evaluate(() => window.PixelPets.net.uid);
    for (let i = 0; i < 12; i++) await rootSet('friends/' + uid + '/full' + i, true);
    await rootSet('codes/WLK-AAAA-AAAA', 'strangerFull');
    await a.locator('#friendInput').fill('WLK-AAAA-AAAA');
    await a.locator('#friendAdd').click();
    await expect(a.locator('#toast')).toHaveText('Friend list is full.');
    await a.locator('#friendInput').fill('WLK-ZZZZ-ZZZZ');
    await a.locator('#friendAdd').click();
    await expect(a.locator('#toast')).toHaveText('No holder with that code.');
    expect(codeB).toBeNull();
    expect(a.ppErrors, a.ppErrors.join('\n')).toEqual([]);
    await b.context().close();
  });

  test('32 fail quietly', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const infos = [];
    page.on('console', msg => { if (msg.type() === 'info') infos.push(msg.text()); });
    await boot(page, saveFor('fail1', 'Tester'));
    await joinRoom(page);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#toast')).opacity === '0');
    await rootSet('config/net', { on: false });
    await page.waitForFunction(() => window.PixelPets.net && window.PixelPets.net.status === 'fail', null, { timeout: 8000 });
    await page.locator('#settingsBtn').click();
    await expect(page.locator('.net-status')).toHaveText('Solo for now');
    expect(await page.evaluate(() => window.PixelPets.net.nextRetryMs)).toBe(30000);
    expect(await page.evaluate(() => window.PixelPets.net.retryMs.join(','))).toBe('30000,120000,600000');
    expect(infos.filter(t => t.includes('playing solo')).length).toBe(1);
    const toastOn = await page.locator('#toast').evaluate(el => el.classList.contains('show') || getComputedStyle(el).opacity !== '0');
    expect(toastOn, 'check 32 no toast').toBe(false);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('33 save and 37 protocol and 35 privacy', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('save1', 'Tester'));
    await joinRoom(page);
    await rootSet('rooms/AMB4RQ/hearthmoor/r1/pv2guy', presence({ pv: 2, x: 9, y: 12 }));
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.PixelPets.net.others.some(o => o.pv === 2 || o.uid === 'pv2guy'))).toBe(false);
    const state = await page.evaluate(() => ({ v: window.PixelPets.state.v, show: window.PixelPets.state.settings.showOthers, q: window.PixelPets.questCheck }));
    expect(state.v).toBe(2);
    expect(state.show).toBe('on');
    expect(state.q).toEqual([]);
    const tree = await rootGet('rooms');
    const allowed = new Set(['pv','x','y','f','mv','look','pet','seals','title','vis','emote','lastEmoteAt','joined','seen','pt','busy']);
    const lookOk = new Set(['sk','hr','hc','of','oc','ac','ax']);
    const petOk = new Set(['sp','st','lv']);
    const walk = (node, path) => {
      if (!node || typeof node !== 'object') return;
      if (node.pv) {
        Object.keys(node).forEach(k => expect(allowed.has(k), path + ' ' + k).toBe(true));
        if (node.look) Object.keys(node.look).forEach(k => expect(lookOk.has(k)).toBe(true));
        if (node.pet) Object.keys(node.pet).forEach(k => expect(petOk.has(k)).toBe(true));
        expect(JSON.stringify(node)).not.toContain('Tester');
      } else Object.keys(node).forEach(k => walk(node[k], path + '/' + k));
    };
    walk(tree, 'rooms');
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('34 phone width', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 project runs 320 and 390');
    for (const w of [320, 390]) {
      const page = await bootNew(browser, saveFor('wide' + w, 'Tester'), w);
      await joinRoom(page);
      await page.locator('#sayBtn').click();
      const wheel = page.locator('#sayWheel .net-wheel');
      const fit = await wheel.evaluate(el => el.scrollHeight <= el.clientHeight + 1);
      expect(fit, 'wheel fits').toBe(true);
      const btns = await page.locator('#sayWheel button').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }));
      btns.forEach(n => expect(n).toBeGreaterThanOrEqual(44));
      await page.locator('#sayClose').click();
      const self = await page.evaluate(() => {
        const n = window.PixelPets.net, c = document.querySelector('#mapCanvas'), r = c.getBoundingClientRect();
        return { x: (n.pos.x * 16 - n.cam.x + 8) / c.width * r.width + r.left, y: (n.pos.y * 16 - n.cam.y + 8) / c.height * r.height + r.top };
      });
      await page.mouse.click(self.x, self.y);
      await expect(page.locator('#holderCard')).toBeVisible();
      const cardFit = await page.locator('#holderCard .net-card').evaluate(el => el.scrollHeight <= el.clientHeight + 1);
      expect(cardFit, 'card fits').toBe(true);
      const cardBtns = await page.locator('#holderCard button').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }));
      cardBtns.forEach(n => expect(n).toBeGreaterThanOrEqual(44));
      await page.locator('#holderCard button', { hasText: 'CLOSE' }).click();
      await page.locator('#settingsBtn').click();
      if (w === 390) await expect(page.locator('.net-status')).toHaveText(/^Room \d+ · \d+ here$/);
      const rows = await page.locator('#playTogether button').evaluateAll(els => els.map(e => e.getBoundingClientRect().height));
      rows.forEach(n => expect(n).toBeGreaterThanOrEqual(44));
      expect(page.ppErrors, w + ': ' + page.ppErrors.join('\n')).toEqual([]);
      await page.context().close();
    }
  });

  test('36 hidden tab', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    test.setTimeout(90000);
    await boot(page, saveFor('hide1', 'Tester'));
    await joinRoom(page);
    const uid = await page.evaluate(() => window.PixelPets.net.uid);
    await page.evaluate(flag => {
      const proto = Document.prototype;
      if (!proto.__ppVis) {
        proto.__ppVis = true;
        Object.defineProperty(proto, 'hidden', { configurable: true, get() { return !!proto.__ppHiddenFlag; } });
        Object.defineProperty(proto, 'visibilityState', { configurable: true, get() { return proto.__ppHiddenFlag ? 'hidden' : 'visible'; } });
      }
      proto.__ppHiddenFlag = flag;
      document.dispatchEvent(new Event('visibilitychange'));
    }, true);
    await page.waitForTimeout(61000);
    const tree = await rootGet('rooms/AMB4RQ/hearthmoor');
    expect(!tree || !JSON.stringify(tree).includes(uid)).toBe(true);
    expect(await page.evaluate(() => window.PixelPets.net.connected)).toBe(false);
    await page.evaluate(() => {
      Document.prototype.__ppHiddenFlag = false;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => window.PixelPets.net && window.PixelPets.net.room, null, { timeout: 3000 });
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('38 wording', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('word1', 'Tester'));
    await joinRoom(page);
    await page.locator('#phoneBtn').click();
    await page.locator('[data-app="friends"]').click();
    const text = await page.locator('#phoneFriends').innerText();
    expect(text).toContain('HOLDER');
    expect(text).toContain('YOUR HOLDER CODE');
    await expect(page.locator('#friendList li')).toHaveCount(12);
    await page.locator('#phoneFriends').evaluate(el => {
      let n = el;
      while (n && n.id !== 'ovPhone') {
        n.style.overflow = 'visible';
        n.style.maxHeight = 'none';
        n.style.height = 'auto';
        n.style.flex = '0 0 auto';
        n = n.parentElement;
      }
      el.style.height = el.scrollHeight + 'px';
    });
    await shot(page, 'friends_390.png', '#phoneFriends');
    expect(text.toLowerCase()).not.toContain('keeper');
    expect(text.toLowerCase()).not.toContain('trainer');
    await page.keyboard.press('Escape');
    const set = await page.locator('#settingsBtn').click().then(() => page.locator('#playTogether').innerText());
    expect(set.toLowerCase()).not.toContain('keeper');
    expect(set.toLowerCase()).not.toContain('trainer');
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('39 joined note shows after placement, then clears', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('hi1', 'Tester'));
    await enterCode(page, 'AMB-4RQ');
    const hi = page.locator('#netHi');
    await expect(hi).toBeVisible({ timeout: 15000 });
    await expect(hi).toHaveText('Joined. Say hi!');
    expect(await page.evaluate(() => !!window.PixelPets.net.room), 'shown only once placed').toBe(true);
    await expect(hi).toBeHidden({ timeout: 4000 });
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('40 settings: show label sits with its switch', async ({ browser }, info) => {
    test.skip(info.project.name !== '390', '390 project runs 320, 375 and 390');
    for (const w of [320, 375, 390]) {
      const page = await bootNew(browser, saveFor('lay' + w, 'Tester'), w);
      await page.locator('#settingsBtn').click();
      await expect(page.locator('#playTogether')).toBeVisible();
      const g = await page.evaluate(() => {
        const box = document.querySelector('#playTogether'), kids = [...box.children];
        const r = s => box.querySelector(s).getBoundingClientRect();
        return {
          iLab: kids.indexOf(box.querySelector('#setShowOthers')),
          iPills: kids.indexOf(box.querySelector('.net-pills')),
          iBlk: kids.indexOf(box.querySelector('#setBlocked')),
          labTop: r('#setShowOthers').top, labBot: r('#setShowOthers').bottom,
          pillsTop: r('.net-pills').top, blkBot: r('#setBlocked').bottom,
          labelled: box.querySelector('.net-pills').getAttribute('aria-labelledby'),
        };
      });
      expect(g.iLab, 'label after Room code and Blocked').toBeGreaterThan(g.iBlk);
      expect(g.iPills - g.iLab, 'label right before its switch').toBeLessThanOrEqual(2);
      expect(g.labTop).toBeGreaterThanOrEqual(g.blkBot);
      expect(g.pillsTop - g.labBot, 'label near its switch').toBeLessThanOrEqual(40);
      expect(g.labelled).toBe('setShowOthers');
      const sizes = await page.locator('#playTogether button').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }));
      expect(sizes.length).toBeGreaterThanOrEqual(5);
      sizes.forEach(n => expect(n).toBeGreaterThanOrEqual(44));
      expect(page.ppErrors, w + ': ' + page.ppErrors.join('\n')).toEqual([]);
      await page.context().close();
    }
  });

  test('41 coop switch is off when missing', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('coop1', 'Tester'));
    expect(await page.evaluate(() => window.PPNet.coopOn())).toBe(false);
    await joinRoom(page);
    await page.waitForFunction(() => window.PPNet.coopOn() === false);
    expect(await rootGet('config/coop/on')).toBeFalsy();
    await rootSet('config/coop/on', true);
    await page.waitForFunction(() => window.PPNet.coopOn() === true);
    await rootSet('config/coop/on', null);
    await page.waitForFunction(() => window.PPNet.coopOn() === false);
    expect(await page.locator('#playTogether').count()).toBe(1);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('42 idle minute stays within 12 reads', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('idle1', 'Tester'));
    const uid = await page.evaluate(() => window.PixelPets.net.uid);
    const seen = Date.now() + 180000;
    for (const id of ['idleA', 'idleB']) {
      await rootSet('rooms/AMB4RQ/hearthmoor/r1/' + id, presence({ x: id === 'idleA' ? 6 : 10, y: 12, seen, pt: seen, joined: seen - 20000 }));
      await rootSet('friends/' + uid + '/' + id, true);
      await rootSet('friends/' + id + '/' + uid, true);
      await rootSet('friendInfo/' + id, { name: id === 'idleA' ? 'Fern' : 'Moss', pet: 'Pip' });
    }
    await joinRoom(page);
    await page.waitForFunction(() => window.PixelPets.net && window.PixelPets.net.others.length >= 2, null, { timeout: 8000 });
    const delta = await page.evaluate(async () => {
      const before = window.PPNet.debug().stats.reads;
      const real = Date.now.bind(Date);
      let skew = 0;
      Date.now = () => real() + skew;
      const step = ms => new Promise(resolve => { skew += ms; setTimeout(resolve, 300); });
      await step(30000);
      await step(30000);
      Date.now = real;
      return window.PPNet.debug().stats.reads - before;
    });
    expect(delta, 'idle reads in 60 s').toBeGreaterThan(0);
    expect(delta, 'idle reads in 60 s').toBeLessThanOrEqual(12);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('43 co-op defaults on with no coop param', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('coopDef', 'Tester'));
    expect(await page.evaluate(() => new URLSearchParams(location.search).get('coop'))).toBe(null);
    expect(await page.evaluate(() => window.PPNet.coop.cfg.on)).toBe(true);
    await joinRoom(page);
    await rootSet('config/coop/on', true);
    await page.waitForFunction(() => window.PPNet.coopOn() === true);
    await rootSet('config/coop/on', null);
    await page.waitForFunction(() => window.PPNet.coopOn() === false);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('44 ?coop=0 turns co-op off', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await rootSet('config/coop/on', true);
    await boot(page, saveFor('coopOff', 'Tester'), '?cloud=emu&debug=1&coop=0');
    expect(await page.evaluate(() => new URLSearchParams(location.search).get('coop'))).toBe('0');
    expect(await page.evaluate(() => window.PPNet.coop.cfg.on)).toBe(false);
    await joinRoom(page);
    expect(await page.evaluate(() => window.PPNet.coopOn())).toBe(false);
    await rootSet('config/coop/on', null);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });

  test('45 server flag false means co-op is off', async ({ page }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    await boot(page, saveFor('coopSrv', 'Tester'));
    expect(await page.evaluate(() => window.PPNet.coop.cfg.on)).toBe(true);
    await joinRoom(page);
    await rootSet('config/coop/on', true);
    await page.waitForFunction(() => window.PPNet.coopOn() === true);
    await rootSet('config/coop/on', false);
    await page.waitForFunction(() => window.PPNet.coopOn() === false);
    await rootSet('config/coop/on', null);
    expect(page.ppErrors, page.ppErrors.join('\n')).toEqual([]);
  });
});
