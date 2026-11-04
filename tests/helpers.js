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
    // ARCADE_GRIPS: a save with no controls choice now loads as modern, so the shared test save picks arcade on purpose.
    // Specs that test modern set controls: 'modern'; tests/controls.spec.js covers the missing-choice default.
    settings: { textSpeed: 'fast', battleAnims: true, follower: true, music: false, musicVol: 0, controls: 'arcade' },
    world: { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' },
    dex: { seen: { 'ember/0': true }, caught: { 'ember/0': true }, legacy: [], hits: {} },
    bag: {},
    money: 0,
    seals: {},
  };
}

// quietDay stamps today's hello and Warm Bowl flags inside the browser, so the boot toasts never fire.
// ACT1_KEEPER_JOIN §9 (D1546 B): a save that already picked a side (story.side_pick_done, no story.keeper_cadet) is moved to
// the Keepers once, at load. Fixtures written before that move are marked as already past it (story.ilse_call_old, the move's
// own guard), so they keep playing the face they were written for. `oldSave: true` leaves a fixture as a real old save.
async function installSave(context, save, { quietDay = false, oldSave = false } = {}) {
  const f = save && save.flags;
  if (!oldSave && f && f['story.side_pick_done'] && !f['story.keeper_cadet'] && !f['story.ilse_call_old']) f['story.ilse_call_old'] = true;
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
  await page.goto('./' + search, { waitUntil: 'commit' });
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

// A new game (no save) up to the first look picker, WHO ARE YOU?. Call after gotoGame with no save. If the intro opens the
// picker, stop there. PARTNER_DAY moved the first pick to the bedroom mirror (home_dress): play the intro to its end (the
// controls prompt takes ARCADE, so TALK works), stand at the mirror and TALK. Leaves #ovLook open with options armed.
async function newPlayerPicker(page) {
  await page.waitForFunction(() => window.PixelPets && PixelPets.scene && PixelPets.scene.id === 'intro', null, { timeout: 10000 });
  const lookOpen = () => page.evaluate(() => !document.querySelector('#ovLook').hidden);
  const step = async () => {
    const s = await page.evaluate(() => { const c = PixelPets.scene; return c && { mode: c.mode, full: !!c.full, waiting: !!c.waiting, text: c.text || '' }; });
    if (!s) return false;
    if (s.mode === 'choice' && s.full && await page.evaluate(() => PixelPets.optionsReady === true)) {
      const n = /walk/i.test(s.text) ? 1 : 0;
      await page.locator('#sbChoices button').nth(n).click();
    } else if (s.waiting) await page.keyboard.press('Space');
    await page.waitForTimeout(40);
    return true;
  };
  for (let i = 0; i < 300 && !(await lookOpen()); i++) if (!(await step())) break;
  if (!(await lookOpen())) {
    await page.evaluate(() => PixelPets.goto('hm_home_room', 4, 3, 'up'));
    await page.waitForFunction(() => document.querySelector('#talkBtn').classList.contains('ready'), null, { timeout: 8000 });
    await page.locator('#talkBtn').click();
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'home_dress', null, { timeout: 8000 });
    for (let i = 0; i < 100 && !(await lookOpen()); i++) if (!(await step())) break;
  }
  await page.waitForFunction(() => !document.querySelector('#ovLook').hidden && PixelPets.optionsReady === true, null, { timeout: 8000 });
}

module.exports = { SHOTS, starterSave, installSave, trackErrors, gotoGame, withOverlay, boxesOverlap, shot, artifactsDir, playScene, newPlayerPicker };
