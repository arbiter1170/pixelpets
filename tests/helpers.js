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
    settings: { textSpeed: 'fast', battleAnims: true, follower: true, music: false, musicVol: 0 },
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

module.exports = { SHOTS, starterSave, installSave, trackErrors, gotoGame, withOverlay, boxesOverlap, shot, artifactsDir, playScene };
