/* BANK_AND_HOMES v0.1, first slice (design repo, private; D2220-D2223, D2227 lines only, D2231, D2233, D2234, D2246): the Acorns
   chip becomes a button (D2220) that opens the account sheet #ovBank with BOOK and LEDGER (D2221); every write to the bag goes
   through moneyDelta and the ledger (D2234); the dawn dividend and the Yesterday card (D2231); Mom's passbook and Teller Bodin's
   open book, both optional talks off the main path, and the re-voiced bank lines (D2222, D2233); the save fields (§12, D2246).
   bank.js, save.js normalizeBank, game.js (moneyDelta, openBank), data/detail_zzz_bank.json. Save stays pixelpets.save.v2, v 2.
   §13 T-B1 to T-B5 and T-B11; 320, 375, 390 (@w1 rows at 320 only); Modern controls; reduced motion; zero console errors. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay, boxesOverlap, shot } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.join(__dirname, '..');
const BANK = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'detail_zzz_bank.json'), 'utf8'));
const COVER = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'detail_zzz_act2_cover.json'), 'utf8'));
const dk = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const TODAY = () => dk(Date.now());
const DAYS_AGO = n => dk(Date.now() - n * 86400000);

// A Cadet after the posting (tests/act2_cover_story.spec.js), Supper played (told).
const POSTED = {
  'story.reached_route1': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_woke': true,
  'story.dream_study': true, 'story.lizzy_met': true, 'story.seal1': true, 'story.crackdown': true, 'story.post_trial_done': true,
  'story.phone_got': true, 'story.warden_called': true, 'story.warden_met': true, 'story.chi_done': true, 'story.shift_g': true,
  'story.orchard_lean': 'pack', 'story.orchard_cleared': true, 'story.sway_fernbrook': -2, 'story.ilse_call2': true,
  'story.keeper_cadet': true, 'story.cover': 'glimmer', 'story.side': 'keepers', 'story.side_pick_done': true, 'story.seal2': true,
  'story.seal3': true, 'story.route3_open': true, 'story.ep1_end': true, 'story.ilse_call3': true, 'story.a2_called': true,
  'story.cover_done': true, 'story.rpt_1': 'told', 'story.rpt_2': 'told', 'story.rpt_3': 'told', 'story.hc_council_done': true,
  'story.gov_posted': true,
};
const SUPPED = Object.assign({}, POSTED, { 'story.cv_mom': 'told', 'story.cv_mom_walk': true });
const HC = { map: 'highcharity', x: 49, y: 31, facing: 'down', respawn: 'hearthmoor' };

function save(opts = {}) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  s.money = opts.money != null ? opts.money : 744;
  Object.assign(s.flags, opts.flags || {});
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({}, opts.world || HC);
  if (opts.seals) s.seals = opts.seals;
  if (opts.bank !== undefined) s.bank = opts.bank;
  if (opts.extra) Object.assign(s, opts.extra);
  return s;
}
// Yesterday's lines (a Hall win, a rest, a buy, wild walks) and an older day, plus an October fold.
function ledger(lastAgo = 1) {
  const y = DAYS_AGO(lastAgo), y2 = DAYS_AGO(lastAgo + 1);
  return { led: [[y2, 'clip', 9], [y2, 'meal', -30, 'coach_stew'], [y, 'hall', 150, 'hall2_hale'], [y, 'rest', -5, 'hearthmoor'],
    [y, 'shop', -150, 'hc_shop.heal_snack'], [y, 'wild', 41]], fold: [['2026-10', 2310, 1980]], jars: [], shares: {} };
}
const BOOK = Object.assign({}, POSTED, { 'story.bank_book': true, 'story.bank_open': true });

async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
  await page.waitForTimeout(250);
}
const st = page => page.evaluate(() => JSON.parse(JSON.stringify(PixelPets.state)));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const bankOpen = page => page.evaluate(() => !document.querySelector('#ovBank').hidden);
const rect = (page, sel) => page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; }, sel);
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
// A real tap on the chip (touch pointer, then the click the browser makes).
async function tapChip(page) {
  const r = await rect(page, '#fcAcorns');
  await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2);
  await page.waitForTimeout(80);
}
async function drive(page, picks = [], ms = 60000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full || !(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick, labels, sc.text]);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.waitForTimeout(40); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const says = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);
async function talk(page, id, picks) {
  expect(await page.evaluate(i => PixelPets.talkTo(i), id)).toBe(true);
  return drive(page, picks || ['Not now']);
}
// Every target in the sheet: 44 px tall or more, inside the viewport, no sideways scroll.
async function sheetFits(page) {
  const vw = page.viewportSize().width, vh = page.viewportSize().height;
  const r = await page.evaluate(() => {
    const box = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom, t: e.textContent.trim() }; };
    const sheet = document.querySelector('#ovBank .bank-sheet'), page = document.querySelector('#bankPage');
    return { sheet: box(sheet), buttons: [...document.querySelectorAll('#ovBank button')].filter(b => b.offsetParent).map(box),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth || page.scrollWidth > page.clientWidth + 1 || sheet.scrollWidth > sheet.clientWidth + 1 };
  });
  expect(r.overflowX, 'no sideways overflow').toBe(false);
  expect(r.sheet.x).toBeGreaterThanOrEqual(0); expect(r.sheet.right).toBeLessThanOrEqual(vw + 0.5);
  expect(r.sheet.y).toBeGreaterThanOrEqual(0); expect(r.sheet.bottom).toBeLessThanOrEqual(vh + 0.5);
  for (const b of r.buttons) { expect(b.height, b.t).toBeGreaterThanOrEqual(44); expect(b.width, b.t).toBeGreaterThanOrEqual(44); }
  return r;
}

test.describe('D2220 the Acorns chip is a button (T-B2)', () => {
  test('a button 44 tall and 64+ wide, beside the area chip; aria-label follows the bag; a tap opens BOOK; X, Escape and a second tap close', async ({ page }) => {
    await boot(page, save({ money: 1284 }));
    const chip = await page.evaluate(() => { const c = document.querySelector('#fcAcorns'); return { tag: c.tagName, type: c.type, pe: getComputedStyle(c).pointerEvents, label: c.getAttribute('aria-label'), cls: c.className, caret: !!c.querySelector('.fc-caret') }; });
    expect(chip).toEqual({ tag: 'BUTTON', type: 'button', pe: 'auto', label: '1284 Acorns. Open your book.', cls: expect.stringContaining('fc-acorns hdr-acorns'), caret: true });
    const c = await rect(page, '#fcAcorns'), area = await rect(page, '#thChip');
    expect(Math.round(c.height)).toBe(44); expect(c.width).toBeGreaterThanOrEqual(64);
    expect(boxesOverlap(c, area)).toBe(false);
    expect(c.right).toBeLessThanOrEqual(page.viewportSize().width);
    // the arcade header stays a display
    expect(await page.evaluate(() => document.querySelector('#hdrAcorns').getAttribute('role'))).toBe('status');
    if (page.viewportSize().width !== 375) await shot(page, 'bank-chip');
    await page.evaluate(() => PixelPets.setMoney(1300));
    await expect(page.locator('#fcAcorns')).toHaveAttribute('aria-label', '1300 Acorns. Open your book.');
    await tapChip(page);
    expect(await bankOpen(page)).toBe(true);
    expect(await page.evaluate(() => document.querySelector('#bankPage').dataset.tab)).toBe('book');
    expect(await page.locator('#bankTitle').textContent()).toBe('YOUR ACORNS');   // bag mode: no book yet
    expect(await page.locator('#bankTabs button').allTextContents()).toEqual(['BOOK', 'LEDGER']);
    await sheetFits(page);
    // the chip stays in view above the sheet (or beside it), and a second tap there closes the book
    const sheet = await rect(page, '#ovBank .bank-sheet'), c2 = await rect(page, '#fcAcorns');
    expect(boxesOverlap(sheet, c2)).toBe(false);
    await tapChip(page);
    expect(await bankOpen(page)).toBe(false);
    await tapChip(page); expect(await bankOpen(page)).toBe(true);
    await page.click('#bankClose'); expect(await bankOpen(page)).toBe(false);
    await tapChip(page); expect(await bankOpen(page)).toBe(true);
    await page.keyboard.press('Escape'); expect(await bankOpen(page)).toBe(false);
    expect((await st(page)).v).toBe(2);
  });

  test('disabled in a scene, in a battle and under the opening tour; the gain flash runs and reduced motion snaps a spend', async ({ page }) => {
    await boot(page, save({ money: 120 }), { reduce: false });
    const off = () => page.evaluate(() => document.querySelector('#fcAcorns').disabled);
    expect(await off()).toBe(false);
    // a scene
    await page.evaluate(() => PixelPets.runScene('bank_book'));
    await expect.poll(off).toBe(true);
    await page.evaluate(() => document.querySelector('#fcAcorns').click());
    expect(await bankOpen(page)).toBe(false);
    await drive(page);
    await expect.poll(off).toBe(false);
    // a battle
    await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.healTeam(); return PixelPets.forceBattle('beetle/0', 3); });
    await page.waitForFunction(() => PixelPets.battle.on);
    await expect.poll(off).toBe(true);
    await page.evaluate(() => document.querySelector('#fcAcorns').click());
    expect(await bankOpen(page)).toBe(false);
    await page.evaluate(() => PixelPets.loseBattle());
    await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.panel === 'end', null, { timeout: 30000 });
    if (await page.evaluate(() => PixelPets.battle.on)) await page.click('#btOk');
    await page.waitForFunction(() => !PixelPets.battle.on, null, { timeout: 15000 });
    await page.waitForFunction(() => !PixelPets.scene);
    // the tour
    await page.evaluate(() => PixelPets.replayTour());
    await expect.poll(off).toBe(true);
    await page.keyboard.press('Escape');   // skip the tour
    await expect.poll(off).toBe(false);
    // gain flash (the built frame swap) and, with reduced motion, a spend snaps with no tick
    const frame = () => page.evaluate(() => { const c = document.querySelector('#fcAcorns .frame-art'); return c ? c.dataset.frame : ''; });
    await page.evaluate(() => PixelPets.setMoney(150));
    await expect.poll(frame, { timeout: 800 }).toBe('acorn_gain');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => PixelPets.setMoney(40));
    expect(await page.locator('#fcAcornN').textContent()).toBe('40');
  });
});

test.describe('D2221 the account sheet: BOOK and LEDGER (T-B2, T-B4 bag mode)', () => {
  test('bag mode before the book: YOUR ACORNS, BOOK and LEDGER only, the Yesterday card with no stamp and no dividend', async ({ page }) => {
    await boot(page, save({ money: 744, flags: POSTED, bank: ledger(1) }));
    const before = await st(page);
    await tapChip(page);
    expect(await page.locator('#bankTitle').textContent()).toBe('YOUR ACORNS');
    expect(await page.locator('#bankTabs button').allTextContents()).toEqual(['BOOK', 'LEDGER']);
    const card = page.locator('#ovBank .bk-card');
    await expect(card).toBeVisible();
    expect(await card.locator('.bk-stamp').count()).toBe(0);
    expect(await card.textContent()).not.toContain('Dawn dividend');
    expect(await card.locator('.bk-card-h').textContent()).toMatch(/^YESTERDAY · (SUN|MON|TUE|WED|THU|FRI|SAT)$/);
    expect(await page.locator('#ovBank .bk-split').count()).toBe(0);   // no jars before the book
    const after = await st(page);
    expect(after.money).toBe(before.money);
    expect(after.flags['daily.bank_dawn']).toBeUndefined();
    await sheetFits(page);
    // the card shows once a day: THANKS hides it and a reopen does not bring it back
    await card.locator('.bk-thanks').click();
    expect(await card.count()).toBe(0);
    await page.click('#bankClose'); await tapChip(page);
    expect(await page.locator('#ovBank .bk-card').count()).toBe(0);
  });

  for (const tab of ['book', 'ledger']) {
    test(`the open book, ${tab.toUpperCase()}: Civic Bank in slate and brass, tabs and rows 44 px, fits the width`, async ({ page }) => {
      await boot(page, save({ money: 744, flags: BOOK, bank: ledger(1) }));
      await tapChip(page);
      expect(await page.locator('#bankTitle').textContent()).toBe('CIVIC BANK');
      expect(await page.locator('#bankTabs button').allTextContents()).toEqual(['BOOK', 'LEDGER', 'JARS']);   // EXCHANGE waits on the stock app
      if (tab === 'ledger') await page.click('#bankTabs button[data-tab="ledger"]');
      expect(await page.locator('#bankPrompt').textContent()).toBe(tab === 'book' ? 'Counted and kept.' : 'Every Acorn, by day.');
      if (tab === 'book') {
        expect(await page.locator('#ovBank .bk-id').textContent()).toMatch(/^Book of Tester · Keeper Cadet\s*No\. \d{4}$/);
        expect(await page.locator('#ovBank .bk-split').textContent()).toBe('in bag 749  ·  in jars 0');
        expect(await page.locator('#ovBank .bk-sec').textContent()).toBe('LATELY');
        expect(await page.locator('#ovBank .bk-fee').textContent()).toBe('Kindness has no fee.');
        expect(await page.locator('#ovBank .bk-treasury').textContent()).toBe('Rates by leave of the Treasury.');   // D2227 tier 3, lines only
        if (page.viewportSize().width !== 375) await shot(page, 'bank-book-yesterday');
      } else {
        const bands = await page.locator('#ovBank .bk-band').allTextContents();
        expect(bands[0]).toMatch(/^TODAY · (SUN|MON|TUE|WED|THU|FRI|SAT)$/);
        expect(bands.length).toBe(3);
        const memos = await page.locator('#ovBank .bk-m').allTextContents();
        expect(memos).toEqual(['Dawn dividend', 'Wild walks', 'Lantern Market, Heal Snack', 'Lantern House rest', 'Hall win, Cobblecrest', 'Coach Stew', 'Scrapbook clips']);
        expect(await page.locator('#ovBank .bk-sub').allTextContents()).toEqual(['stamped at first open', 'Master Hale']);
        expect(await page.locator('#ovBank .bk-fold').textContent()).toBe('OCTOBER+2,310  ·  -1,980');
        // gains in J, spends in k: never red ink
        const inks = await page.evaluate(() => [...document.querySelectorAll('#ovBank .bk-n')].map(e => getComputedStyle(e).color));
        expect(new Set(inks)).toEqual(new Set(['rgb(47, 90, 62)', 'rgb(26, 28, 44)']));
        if (page.viewportSize().width !== 375) await shot(page, 'bank-ledger');
      }
      for (const r of await page.locator('#ovBank .bk-row').all()) expect((await r.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await sheetFits(page);
      await page.click('#bankTabs button[data-tab="jars"]');
      expect(await page.locator('#bankPrompt').textContent()).toBe('Jars wait. They never spoil.');
      await expect(page.locator('#ovBank .bk-soon')).toBeVisible();   // phase 2
      expect((await st(page)).v).toBe(2);
    });
  }
});

test.describe('D2231 the dawn dividend and the Yesterday card (T-B4)', () => {
  test('the first open of a real day pays 5 into the bag, stamps daily.bank_dawn, shows the card and clears the pip; a second open pays nothing', async ({ page }) => {
    await boot(page, save({ money: 744, flags: BOOK, bank: ledger(1) }));
    expect(await page.evaluate(() => document.querySelector('#fcAcorns').classList.contains('bank-due'))).toBe(true);   // the pip
    if (page.viewportSize().width !== 375) await shot(page, 'bank-chip-pip');
    await tapChip(page);
    const s1 = await st(page);
    expect(s1.money).toBe(749);
    expect(s1.flags['daily.bank_dawn']).toBe(TODAY());
    expect(s1.bank.led[s1.bank.led.length - 1]).toEqual([TODAY(), 'dawn', 5]);
    const card = page.locator('#ovBank .bk-card');
    expect(await card.locator('.bk-card-h').textContent()).toMatch(/^YESTERDAY · /);
    expect(await card.locator('.bk-kv').allTextContents()).toEqual(['Came in+191', 'Went out-155', 'Dawn dividend+5']);
    expect(await card.locator('.bk-remark').textContent()).toBe('"A Hall win. The Masters will talk."');
    await expect(card.locator('.bk-stamp')).toHaveText('KEPT');
    expect(await card.locator('.bk-stamp').evaluate(e => e.classList.contains('stamp-in'))).toBe(true);
    expect(await page.evaluate(() => document.querySelector('#fcAcorns').classList.contains('bank-due'))).toBe(false);
    const saved = await stored(page);
    expect([saved.v, saved.money, saved.flags['daily.bank_dawn']]).toEqual([2, 749, TODAY()]);
    await card.locator('.bk-thanks').click();
    await page.click('#bankClose');
    await tapChip(page);
    expect((await st(page)).money).toBe(749);
    expect(await page.locator('#ovBank .bk-card').count()).toBe(0);
    expect((await st(page)).bank.led.filter(r => r[1] === 'dawn').length).toBe(1);
  });

  test('a week away pays one dividend (no catch-up), says WELCOME BACK, never counts days or says missed @w1', async ({ page }) => {
    await boot(page, save({ money: 744, flags: Object.assign({}, BOOK, { 'daily.bank_dawn': DAYS_AGO(7) }), bank: ledger(7) }));
    await tapChip(page);
    expect((await st(page)).money).toBe(749);
    const card = page.locator('#ovBank .bk-card');
    expect(await card.locator('.bk-card-h').textContent()).toBe('WELCOME BACK');
    expect(await card.locator('.bk-since').textContent()).toMatch(/^Since [A-Z][a-z]{2} \d{1,2}:$/);
    const text = await card.textContent();
    expect(text).not.toMatch(/missed|days? away|\b7 days?\b|you were gone|lost/i);
    await shot(page, 'bank-welcome-back');
  });

  test('jars feed the step: 1,400 kept pays the cap of 12, still into the bag; reduced motion stamps at once @w1', async ({ page }) => {
    const b = ledger(1); b.jars = [{ id: 'j1', goal: '', saved: 1400 }];
    await boot(page, save({ money: 100, flags: BOOK, bank: b }), { reduce: true });
    await tapChip(page);
    const s = await st(page);
    expect(s.money).toBe(112);
    expect(s.bank.jars[0].saved).toBe(1400);   // never into a jar: no compounding
    expect(await page.locator('#ovBank .bk-split').textContent()).toBe('in bag 112  ·  in jars 1,400');
    expect(await page.locator('#ovBank .bk-stamp').evaluate(e => e.classList.contains('stamp-in'))).toBe(false);
    expect(await page.evaluate(() => [0, 199, 200, 600, 1399, 1400, 50000].map(PPBank.dividend))).toEqual([5, 5, 6, 8, 11, 12, 12]);
  });
});

test.describe('D2234 the ledger seam: moneyDelta (T-B3)', () => {
  test('every write to the bag goes through moneyDelta: a source scan of game.js and minigames.js @w1', async () => {
    const game = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8'), mini = fs.readFileSync(path.join(ROOT, 'minigames.js'), 'utf8');
    const start = game.indexOf('function moneyDelta('), end = game.indexOf('\n}\n', start);
    const outside = game.slice(0, start) + game.slice(end);
    expect(outside.match(/S\.money\s*(=(?!=)|\+=|-=|\+\+|--)/g)).toBeNull();
    expect(mini.match(/S\.money\s*(=(?!=)|\+=|-=)/g)).toBeNull();
    expect(game.slice(start, end)).toContain('battle.coop');   // D331: a co-op guest writes nothing
    // The wrapped sites: 13 in game.js and the Event Hall, plus three debug writes (the dawn dividend and the wallet are the bank's own).
    const sites = [...outside.matchAll(/moneyDelta\('([a-z_]+)'/g)].map(m => m[1]);
    const count = k => sites.filter(x => x === k).length;
    expect({ find: count('find'), look: count('look'), scene: count('scene'), meal: count('meal'), rest: count('rest'), tourney: count('tourney'),
      clip: count('clip'), shop: count('shop'), wild: count('wild'), debug: count('debug') })
      .toEqual({ find: 2, look: 2, scene: 2, meal: 1, rest: 1, tourney: 1, clip: 1, shop: 1, wild: 1, debug: 3 });
    expect(outside).toContain("moneyDelta(t.hall ? 'hall' : 'holder', money,");
    expect(mini).toContain("api.moneyDelta('event', n, id)");
  });

  test('plays: a shop buy, a wild win, a holder win, a scene payment and a debug set each write one memo; same-day lines merge; a refused buy writes nothing @w1', async ({ page }) => {
    await withOverlay(page, { scenes: { bank_t_pay: [['acorns', 7]] } }, 'detail_zz_bank_test');
    await boot(page, save({ money: 100 }));
    expect((await st(page)).bank).toEqual({ led: [], fold: [], jars: [], shares: {} });   // filled at load, nothing written yet
    await page.evaluate(() => PixelPets.openShop());
    const price = await page.evaluate(() => { const before = PixelPets.state.money; PixelPets.buyItem('heal_snack'); PixelPets.buyItem('heal_snack'); return before - PixelPets.state.money; });
    await page.evaluate(() => document.querySelector('#shopClose').click());
    let led = (await st(page)).bank.led;
    expect(led[0]).toEqual([TODAY(), 'open', 100]);   // brought forward, once
    expect(led[1]).toEqual([TODAY(), 'shop', -price, 'heal_snack']);   // two buys, one line
    // wild win
    await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.healTeam(); return PixelPets.forceBattle('beetle/0', 5); });
    await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
    await page.evaluate(() => PixelPets.winBattle());
    await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.panel === 'end', null, { timeout: 30000 });
    if (await page.evaluate(() => PixelPets.battle.on)) await page.click('#btOk');
    await page.waitForFunction(() => !PixelPets.battle.on, null, { timeout: 15000 });
    // holder win
    await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.healTeam(); return PixelPets.forceTrainer('route1_pia'); });
    await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
    await page.evaluate(() => PixelPets.winBattle());
    await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.panel === 'end', null, { timeout: 30000 });
    if (await page.evaluate(() => PixelPets.battle.on)) await page.click('#btOk');
    await page.waitForFunction(() => !PixelPets.battle.on, null, { timeout: 15000 });
    await page.waitForFunction(() => !PixelPets.scene);
    // a scene's ["acorns", n]
    await page.evaluate(() => PixelPets.runScene('bank_t_pay'));
    await drive(page);
    led = (await st(page)).bank.led;
    const srcs = led.map(r => r[1]);
    expect(srcs).toEqual(['open', 'shop', 'wild', 'holder', 'scene']);
    expect(led[2][2]).toBe(10);   // wild: 2 x level 5
    expect(led[3].slice(1)).toEqual(['holder', 50, 'route1_pia']);
    expect(led[4].slice(1)).toEqual(['scene', 7, 'bank_t_pay']);
    const money = (await st(page)).money;
    expect(money).toBe(100 - price + 10 + 50 + 7);
    // a refused buy writes nothing; the bag never goes below 0
    await page.evaluate(() => PixelPets.setMoney(0));
    const n = (await st(page)).bank.led.length;
    await page.evaluate(() => { PixelPets.openShop(); PixelPets.buyItem('heal_snack'); document.querySelector('#shopClose').click(); });
    expect((await st(page)).money).toBe(0);
    expect((await st(page)).bank.led.length).toBe(n);
    await page.evaluate(() => PixelPets.setMoney(-50));
    expect((await st(page)).money).toBe(0);
    // the ledger reads the memo for each
    await tapChip(page); await page.click('#bankTabs button[data-tab="ledger"]');
    expect(await page.locator('#ovBank .bk-m').allTextContents()).toEqual(['Debug', 'Acorns received', 'Holder win, Route 1', 'Wild walks', 'Heal Snack', 'Brought forward']);
  });

  test('60 lines and 12 folds at most: the oldest lines fold into their month; the oldest fold drops @w1', async ({ page }) => {
    const led = [];
    for (let i = 0; i < 60; i++) led.push(['2025-' + String(1 + Math.floor(i / 5)).padStart(2, '0') + '-0' + (1 + (i % 5)), 'wild', 3]);
    const fold = []; for (let m = 1; m <= 12; m++) fold.push(['2024-' + String(m).padStart(2, '0'), 10, 5]);
    await boot(page, save({ money: 50, bank: { led, fold, jars: [], shares: {} } }));
    await page.evaluate(() => PixelPets.setMoney(60));
    const b = (await st(page)).bank;
    expect(b.led.length).toBe(60);
    expect(b.fold.length).toBe(12);
    expect(b.fold[0][0]).toBe('2024-02');                  // 2024-01 dropped
    expect(b.fold[11]).toEqual(['2025-01', 3, 0]);         // the oldest line folded into January 2025
    expect(b.led[59]).toEqual([TODAY(), 'debug', 10]);
  });
});

test.describe('D2246 the save (T-B1)', () => {
  for (const kind of ['act1', 'act2', 'bare']) {
    test(`an old ${kind} save loads: v 2, the key, the bag byte-identical, the new fields default @w1`, async ({ page }) => {
      const s = save({ money: 4321, flags: kind === 'act2' ? SUPPED : kind === 'act1' ? { 'story.reached_route1': true } : {},
        world: kind === 'act1' ? { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' } : HC });
      if (kind === 'bare') { delete s.bag; delete s.seals; }
      await boot(page, s);
      const a = await st(page);
      expect(a.v).toBe(2);
      expect(a.money).toBe(4321);
      expect(a.bank).toEqual({ led: [], fold: [], jars: [], shares: {} });
      expect(a.home).toEqual({ stored: [], hc_apt: [], mail: [] });
      expect(a.garden).toEqual([]);
      const keys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('pixelpets.save')));
      expect(keys).toContain('pixelpets.save.v2');
      const saved = await stored(page);
      expect([saved.v, saved.money]).toEqual([2, 4321]);
    });
  }

  test('garbage in each new field is dropped or clamped; S.money untouched @w1', async ({ page }) => {
    const bank = { led: [['bad'], [TODAY(), 'wild', 5], [TODAY(), 'zzz', 3], [TODAY(), 'wild', 1.5], [TODAY(), 'shop', -9, 'x'.repeat(30)], [TODAY(), 'shop', -4, 'heal_snack']],
      fold: 'x', jars: [{ id: 'j1', goal: '', saved: -5 }, { id: 'bad' }, { id: 'j1', goal: '', saved: 9 }, { id: 'j2', goal: 'home_hc_apt', saved: 12.7, keep: 1 }], shares: { km_kiln: 99, x: -2 } };
    const s = save({ money: 77, bank, extra: { home: { hc_apt: ['pa_clock_round', 'not_a_prop', ''], stored: ['ph_armchair', 'nope', 3], mail: ['mom_pass', 'BAD', 'a', 'b', 'c'] }, garden: [1, { seed: 'berry', d: '2026-11-01' }, { seed: 'x', d: 'nope' }, null, null, null] } });
    await boot(page, s);
    const a = await st(page);
    expect(a.money).toBe(77);
    expect(a.bank.led).toEqual([[TODAY(), 'wild', 5], [TODAY(), 'shop', -4, 'heal_snack']]);
    expect(a.bank.fold).toEqual([]);
    expect(a.bank.jars).toEqual([{ id: 'j1', goal: '', saved: 0 }, { id: 'j2', goal: 'home_hc_apt', saved: 12, keep: 1 }]);
    expect(a.bank.shares).toEqual({ km_kiln: 10, x: 0 });
    expect(a.home).toEqual({ hc_apt: ['pa_clock_round', '', ''], stored: ['ph_armchair'], mail: ['mom_pass', 'a', 'b'] });
    expect(a.garden).toEqual([null, { seed: 'berry', d: '2026-11-01' }, null, null]);
    // idempotent
    const again = await page.evaluate(() => { const x = JSON.parse(JSON.stringify(PixelPets.state)); PPSave.normalizeV2(x); return [x.bank, x.home, x.garden]; });
    expect(again).toEqual([a.bank, a.home, a.garden]);
  });
});

test.describe('D2222, D2233 the two opening beats and the re-voiced lines (T-B5)', () => {
  test('Mom: the passbook is an optional talk after Supper, after her snack and before her repeat; never inside Supper', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, save({ flags: SUPPED, world: { map: 'hm_home_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' } }));
    // her daily snack still plays first when it is due (D1696)
    expect(await page.evaluate(() => PixelPets.talkTo('mom'))).toBe(true);
    expect(await sceneId(page)).toBe('cv_mom_snack');
    await drive(page);
    expect((await flags(page))['story.bank_book']).toBeUndefined();
    const quest0 = await page.evaluate(() => PixelPets.quest && PixelPets.quest.id);
    if (page.viewportSize().width !== 375) await shot(page, 'bank-beat1-before');
    expect(await page.evaluate(() => PixelPets.talkTo('mom'))).toBe(true);
    expect(await sceneId(page)).toBe('bank_book');
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
    if (page.viewportSize().width !== 375) await shot(page, 'bank-beat1');
    const lines = await drive(page);
    expect(lines).toEqual([['Mom', 'A better offer pays somewhere. Keep it in a book, not a sock.'],
      ['', 'She hands you a passbook. Civic Bank. Her name is crossed out; yours is pencilled in.'],
      ['Mom', 'The teller in High Charity knows me. Bodin. Tell him I said so.']]);
    expect((await flags(page))['story.bank_book']).toBe(true);
    await expect.poll(() => page.evaluate(() => PixelPets.toasts.includes("Mom's old passbook."))).toBe(true);
    expect(says(await talk(page, 'mom'))[0]).toBe("I told nobody. Well. Maze. She's a vault.");   // once: then her repeat
    expect(await page.evaluate(() => PixelPets.quest && PixelPets.quest.id)).toBe(quest0);       // off the main path
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
    // Supper (C-M) is not edited: no bank step inside it, same boxes as its own file
    const supper = await page.evaluate(() => MAPDATA.detail_zzz_act2_cover.scenes.cv_mom_supper);
    expect(supper).toEqual(COVER.scenes.cv_mom_supper);
    expect(JSON.stringify(supper)).not.toContain('bank');
    expect((await stored(page)).v).toBe(2);
  });

  test('Mom never offers it before Supper or on the glimmer side @w1', async ({ page }) => {
    await boot(page, save({ flags: Object.assign({}, SUPPED, { 'story.cv_mom_day': TODAY(), 'story.side': 'glimmer' }), world: { map: 'hm_home_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' } }));
    await talk(page, 'mom');
    expect((await flags(page))['story.bank_book']).toBeUndefined();
    const cond = k => page.evaluate(c => PixelPets.condRead(c).cond, k);
    await page.evaluate(() => { PixelPets.setFlag('story.side', 'keepers'); PixelPets.setFlag('story.cv_mom', null); });
    expect(await cond('story.cv_mom & !story.bank_book & !story.side=glimmer')).toBe(false);
  });

  test('Teller Bodin opens the book only after the posting; then the re-voiced lines play by key', async ({ page }) => {
    const room = { map: 'hc_bank_in', x: 2, y: 4, facing: 'up', respawn: 'hearthmoor' };
    await boot(page, save({ flags: Object.assign({}, SUPPED, { 'story.bank_book': true }), world: room }));
    const quest0 = await page.evaluate(() => PixelPets.quest && PixelPets.quest.id);
    if (page.viewportSize().width !== 375) await shot(page, 'bank-beat2-before');
    expect(await page.evaluate(() => PixelPets.talkTo('hc_ivo'))).toBe(true);
    expect(await sceneId(page)).toBe('bank_open');
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
    expect(await page.evaluate(() => PixelPets.shownName(PixelPets.scene.who))).toBe('Teller Bodin');
    if (page.viewportSize().width !== 375) await shot(page, 'bank-beat2');
    const lines = await drive(page);
    expect(says(lines)).toEqual(["Your mother's book. She kept it tidy. The Keepers draw a Cadet's pay on us now.",
      'Your bag stays yours. Jars we keep. Counted at dawn, any day you look in.', 'He stamps the first page: KEPT.']);
    expect((await flags(page))['story.bank_open']).toBe(true);
    await expect.poll(() => page.evaluate(() => PixelPets.toasts.includes('Your book is open.'))).toBe(true);
    expect(await page.evaluate(() => PixelPets.quest && PixelPets.quest.id)).toBe(quest0);
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
    expect(says(await talk(page, 'hc_ivo'))[0]).toBe('Counted and kept. Your bag is yours to spend. Your jars, we mind.');
    expect(says(await talk(page, 'hc_counter'))[0]).toBe('The counter is polished. Your jars are counted here at dusk.');
    // the book now opens with the dividend
    expect(await page.evaluate(() => document.querySelector('#fcAcorns').classList.contains('bank-due'))).toBe(true);
  });

  test('the re-voiced lines by key; the built glimmer line and the door sign unchanged @w1', async ({ page }) => {
    const room = { map: 'hc_bank_in', x: 2, y: 4, facing: 'up', respawn: 'hearthmoor' };
    await boot(page, save({ flags: Object.assign({}, POSTED), world: room }));
    const line = async (id, f) => { await page.evaluate(fl => { for (const [k, v] of Object.entries(fl)) PixelPets.setFlag(k, v); }, f || {}); return says(await talk(page, id))[0]; };
    expect(await line('hc_ivo')).toBe('Your Acorns stay in your bag. Books are for the posted.');
    expect(await line('hc_counter')).toBe('The counter is polished. Your Acorns stay in your bag, for now.');
    expect(await line('hc_ivo', { 'story.side': 'glimmer' })).toBe("We don't hold lanyards. Or Acorns.");
    expect(await line('hc_ivo', { 'story.bank_open': true })).toBe('We don\'t hold lanyards. We do keep old books. Yours is here.');
    expect(await line('hc_ivo', { 'story.side': 'keepers', 'story.bank_open': null, 'story.bank_book': true, 'story.gov_posted': null })).toBe('Your mother\'s book? Bring it back once the Keepers post you.');
    const sign = await page.evaluate(() => MAPDATA.highcharity.maps.highcharity.objs.find(o => o.id === 'hc_sign_bank').text);
    expect(sign).toBe('CIVIC BANK · Your Acorns are counted and kept. Withdrawals until dusk. Kindness has no fee.');
  });
});

test.describe('T-B11 words and limits', () => {
  test('every new player line is within 110 / 40 characters, and no bank string says debt, owe, loan, interest, credit, coins, bet or gamble @w1', async ({ page }) => {
    const sayLines = [], toasts = [];
    for (const steps of Object.values(BANK.scenes)) for (const s of steps) { if (s[0] === 'say') sayLines.push(s[2]); if (s[0] === 'toast') toasts.push(s[1]); }
    for (const pt of Object.values(BANK.objPatch)) if (pt && typeof pt === 'object') for (const grp of [pt.linesFirst, pt.linesSet, pt.linesBefore && pt.linesBefore.add]) for (const v of Object.values(grp || {})) if (v[0] !== '@') sayLines.push(v);
    for (const l of sayLines) expect(Array.from(l).length, l).toBeLessThanOrEqual(110);
    for (const t of toasts) expect(Array.from(t).length, t).toBeLessThanOrEqual(40);
    await boot(page, save({ flags: BOOK, bank: ledger(1) }));
    const copy = await page.evaluate(() => { PixelPets.openBank('book'); const a = document.querySelector('#ovBank').textContent; PixelPets.openBank('book'); PixelPets.openBank('ledger'); return a + document.querySelector('#ovBank').textContent; });
    const all = sayLines.concat(toasts, [copy]).join('\n');
    expect(all).not.toMatch(/\b(debts?|owe|owed|owes|loans?|interest|credit|overdraft|bets?|gamble|coins?)\b/i);
    expect(all).not.toMatch(/\btrainer\b/i);
    const bankSrc = fs.readFileSync(path.join(ROOT, 'bank.js'), 'utf8');
    expect(bankSrc).not.toMatch(/'[^']*\b(debt|owe|loan|interest|credit|coins?)\b[^']*'/i);
  });

  test('without ?debug=1 the hooks stay inert and the chip still opens the book @w1', async ({ page }) => {
    await installSave(page.context(), save({ money: 30 }), { quietDay: true });
    await gotoGame(page, '');
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === false && window.PPBank);
    await page.waitForTimeout(500);
    await page.evaluate(() => { const f = PixelPets.openBank; if (typeof f === 'function') f('book'); });   // the cheat wrapper keeps it inert
    expect(await bankOpen(page)).toBe(false);
    await page.evaluate(() => document.querySelector('#fcAcorns').click());
    expect(await bankOpen(page)).toBe(true);
  });
});
