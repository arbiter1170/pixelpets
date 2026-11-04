/* Shared helpers for the Walklings smoke tests (tests/README.md). Players never load this file. */
const fs = require('fs');
const path = require('path');

const SHOTS = path.join('test-results', 'screenshots');

function starterSave() {
  return {
    v: 2,
    uid: 'smoketest0001',
    created: 1700000000000,
    last: Date.now(),
    party: [{
      id: 'petsmoke1',
      species: 'ember',
      stage: 0,
      xp: 10,
      hunger: 80,
      happy: 60,
      energy: 90,
      nick: null,
      origin: 'starter',
    }],
    partnerId: 'petsmoke1',
    box: [],
    orphans: [],
    flags: {
      'story.intro_seen': true,
      'story.starter_received': true,
      'story.starter_line': 'ember',
      'story.tutorial_done': true,
    },
    player: {
      name: 'Tester',
      look: { skin: '3', hair: 'short', hairCol: 'p', outfit: 'coat', outfitCol: 't', accent: 'r' },
    },
    // Modern controls by default for all play testing and QA (Vincent, Nov 4, 2026), as for a new game. A spec that is about
    // Arcade (the pad, TALK, the grips, the arcade HUD rows) opts in with s.settings.controls = 'arcade' and says why.
    // tests/controls.spec.js covers the missing-choice default.
    settings: { textSpeed: 'fast', battleAnims: true, follower: true, music: false, musicVol: 0, controls: 'modern' },
    world: { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' },
    dex: { seen: { 'ember/0': true }, caught: { 'ember/0': true }, legacy: [], hits: {} },
    bag: {},
    money: 0,
    seals: {},
  };
}

// quietDay stamps today's hello and Warm Bowl flags inside the browser, so the boot toasts never fire.
async function installSave(context, save, { quietDay = false } = {}) {
  await context.addInitScript(({ save, quietDay }) => {
    if (quietDay) {
      const d = new Date();
      const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      save.flags['daily.hello'] = day;
      save.flags['daily.warm_bowl'] = day;
    }
    save.last = Date.now();
    localStorage.setItem('pixelpets.save.v2', JSON.stringify(save));
    localStorage.setItem('pixelpets.geo', 'deny');
    localStorage.setItem('pixelpets.mute', '1');
  }, { save, quietDay });
}

function trackErrors(test, expect) {
  test.beforeEach(async ({ page }) => {
    page.ppErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') page.ppErrors.push(msg.text()); });
    page.on('pageerror', (err) => page.ppErrors.push(err.message));
  });
  test.afterEach(async ({ page }) => {
    expect(page.ppErrors, 'console errors / page errors:\n' + page.ppErrors.join('\n')).toEqual([]);
  });
}

async function gotoGame(page, search = '') {
  // 'commit' returns once the document starts. The app wait uses the test's own time,
  // so a slow script parse is not failed by a shorter navigation cap.
  await page.goto('/' + search, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.BUILD);
}

// Map-pass fixtures: adds `overlay` to MAPDATA as one more data/detail_*.json before the game boots.
// Call before gotoGame. For engine tests only; real maps live in data/.
async function withOverlay(page, overlay, key = 'detail_zz_test') {
  await page.route('**/data/mapdata.js*', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()) + '\nMAPDATA[' + JSON.stringify(key) + '] = ' + JSON.stringify(overlay) + ';\n';
    await route.fulfill({ status: 200, body, headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
  });
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

async function shot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name + '-' + page.viewportSize().width + '.png') });
}

// Review shots. PP_ARTIFACTS points at a writable folder when the default directory cannot be created.
function artifactsDir(sub) {
  const dir = path.join(process.env.PP_ARTIFACTS || '/opt/cursor/artifacts', sub || ''); // scan-ok: test-mistakes
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Plays an open scene to its end. Plain lines advance with Space (a first press completes the typing, a second one moves
// on); a choice box answers with the next label in `choices` (an exact button text), after the 500 ms tap guard.
// Returns the choice prompts seen, in order, so a test can check a confirm line. `onChoice(prompt, i)` runs before each answer.
async function playScene(page, choices = [], onChoice = null, onSeal = null) {
  const prompts = [];
  let left = choices.slice();
  for (let i = 0; i < 200; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, full: s.full, waiting: s.waiting, text: s.text };
    });
    if (!sc) return prompts;
    const sealUp = await page.locator('#ovBattle.seal-only').isVisible().catch(() => false);
    if (sealUp) { if (onSeal) await onSeal(); await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    if (sc.mode === 'choice') {
      // A tap completes the line without waiting for the frame loop, then the buttons answer.
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      // After a pick the mode reads 'choice' until the next line, while staging plays (BED_TUCK's walk to the bed):
      // only a box that shows buttons is a new choice. The shop sheet has its own buttons.
      const open = await page.locator('#sbChoices button:visible, #ovShop:visible').count();
      if (!open) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      const label = left.shift();
      if (label == null) throw new Error('scene asked "' + sc.text + '" but the test had no answer left');
      prompts.push(sc.text);
      if (onChoice) await onChoice(sc.text, prompts.length - 1);
      const shop = await page.locator('#ovShop').isVisible().catch(() => false);
      if (shop) {
        if (label === 'Not now') await page.locator('#shopClose').click();
        else {
          const name = label.replace(/\s+\(\d+\)\s*$/, '');
          const row = page.locator('#shopList .shop-row').filter({ has: page.locator('.shop-name', { hasText: name }) });
          await row.locator('.shop-buy').click();
        }
      } else await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(40);
      continue;
    }
    if (sc.mode === 'say') {
      if (!sc.waiting) { await page.waitForTimeout(40); continue; }
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(60);
  }
  throw new Error('scene did not end');
}

// Modern controls (the default, Vincent, Nov 4, 2026) have no header gear, no tab row and no TALK button: Settings is the dock's
// gear (#gearFloat), PET and WALKLINGS are the dock's #petFloat and #colFloat, each other screen has a WALK back button, and a
// tap on the map walks or talks. Arcade specs keep #settingsBtn, #tabs and TALK. These helpers tap whatever the layout on
// screen shows (body.ctl-modern), so a spec that opts into Arcade still works.
async function isModern(page) {
  await page.waitForFunction(() => /\bctl-(modern|arcade)\b/.test(document.body.className), null, { timeout: 8000 });
  return page.evaluate(() => document.body.classList.contains('ctl-modern'));
}
async function openSettings(page) {
  if (!(await isModern(page))) return page.locator('#settingsBtn').click();
  const gear = page.locator('#gearFloat');
  // Modern has its gear on the walk screen's dock only: fail fast instead of waiting out the test.
  await gear.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
  if (!(await gear.isVisible())) throw new Error('openSettings: the Modern gear is on the walk screen; go back to WALK first, or opt into Arcade');
  await gear.click();
}
// Debug tools (a ?debug=1 session): Arcade taps the DBG tag in its header; Modern has no header, so Settings -> Debug opens them.
async function openDebug(page) {
  if (!(await isModern(page))) return page.locator('#dbgTag').click();
  await openSettings(page);
  await page.locator('#setDebug').click();
}
async function showScreen(page, name) {
  if (!(await isModern(page))) return page.locator(`#tabs button[data-tab="${name}"]`).click();
  if (name === 'walk') {
    const back = page.locator('.screen.active .scr-back');
    if (await back.count()) await back.click();
    return;
  }
  return page.locator(name === 'pet' ? '#petFloat' : '#colFloat').click();
}
// A finger on the map canvas over tile (x, y), once the walk camera has stopped easing. In Modern a tap on a person or a
// sign next to the player talks; a tap further away walks there.
async function tapTile(page, x, y) {
  await page.waitForFunction(async () => {
    const a = Object.assign({}, PixelPets.walk.cam);
    await new Promise(r => setTimeout(r, 120));
    const b = PixelPets.walk.cam;
    return a.x === b.x && a.y === b.y;
  }, null, { timeout: 5000 });
  await page.evaluate(({ x, y }) => {
    const mc = document.querySelector('#mapCanvas'), b = mc.getBoundingClientRect(), cam = PixelPets.walk.cam;
    const cx = b.left + ((x * 16 + 8 - cam.x) / mc.width) * b.width, cy = b.top + ((y * 16 + 8 - cam.y) / mc.height) * b.height;
    const opt = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt));
    mc.dispatchEvent(new PointerEvent('pointerup', opt));
  }, { x, y });
}

// Modern talk: tap the tile the player faces (the person, sign or prop there answers, as TALK does in Arcade).
async function tapFacing(page) {
  const t = await page.evaluate(() => {
    const w = PixelPets.state.world, d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[w.facing] || [0, 1];
    return { x: w.x + d[0], y: w.y + d[1] };
  });
  await tapTile(page, t.x, t.y);
}

// A new game (no save) up to the first look picker, WHO ARE YOU?. Call after gotoGame with no save. If the intro opens the
// picker, stop there. PARTNER_DAY moved the first pick to the bedroom mirror (home_dress): play the intro to its end (the
// controls prompt takes MODERN, the default for play testing), stand at the mirror and tap it. Leaves #ovLook open with options armed.
async function newPlayerPicker(page) {
  await page.waitForFunction(() => window.PixelPets && PixelPets.scene && PixelPets.scene.id === 'intro', null, { timeout: 10000 });
  const lookOpen = () => page.evaluate(() => !document.querySelector('#ovLook').hidden);
  const step = async () => {
    const s = await page.evaluate(() => { const c = PixelPets.scene; return c && { mode: c.mode, full: !!c.full, waiting: !!c.waiting, text: c.text || '' }; });
    if (!s) return false;
    if (s.mode === 'choice' && s.full && await page.evaluate(() => PixelPets.optionsReady === true)) {
      const n = 0;   // the first button; on the controls prompt that is MODERN
      await page.locator('#sbChoices button').nth(n).click();
    } else if (s.waiting) await page.keyboard.press('Space');
    await page.waitForTimeout(40);
    return true;
  };
  for (let i = 0; i < 300 && !(await lookOpen()); i++) if (!(await step())) break;
  if (!(await lookOpen())) {
    await page.evaluate(() => PixelPets.goto('hm_home_room', 4, 3, 'up'));
    await tapFacing(page);   // Modern: tap the mirror to talk
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'home_dress', null, { timeout: 8000 });
    for (let i = 0; i < 100 && !(await lookOpen()); i++) if (!(await step())) break;
  }
  await page.waitForFunction(() => !document.querySelector('#ovLook').hidden && PixelPets.optionsReady === true, null, { timeout: 8000 });
}

module.exports = { SHOTS, starterSave, installSave, trackErrors, gotoGame, openSettings, openDebug, showScreen, tapTile, tapFacing, withOverlay, boxesOverlap, shot, artifactsDir, playScene, newPlayerPicker };
