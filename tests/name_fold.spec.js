/* Name fold runs once per save (QA, Nov 3, 2026). save.js folds an old name (FOLD_KEYS: Ash, Fen, ...) into the ranked name
   in phoneBook.met / phoneBook.fav / rep when the new key is absent. Play deletes the new key (unfavourite, trust back at base),
   and the old key stays on disk, so the fold must not run again: flags['fold.<old>'] records it. Old keys stay; v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save(extra) {
  const s = starterSave();
  s.settings.tips = false;
  s.settings.follower = false;
  s.flags['story.phone_got'] = true;
  if (extra) Object.assign(s, extra);
  return s;
}

async function boot(page, s) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
}

// Reload with what is on disk now (installSave's init script would put the seed back, so a later script wins).
async function reloadFromDisk(page) {
  const stored = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.context().addInitScript((v) => localStorage.setItem('pixelpets.save.v2', v), stored);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.PixelPets.state);
}

test('an old fav under Ash folds to Sefton once; unfavourite Sefton, reload, and Sefton stays off', async ({ page }) => {
  await boot(page, save({ phoneBook: { met: { Ash: true }, fav: { Ash: true } } }));
  expect(await page.evaluate(() => PixelPets.state.phoneBook.fav.Sefton)).toBe(true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const star = page.locator('.contact-star[data-fav="Sefton"]');
  await expect(star).toHaveText('ON');
  await star.click();
  await expect(page.locator('.contact-star[data-fav="Sefton"]')).toHaveText('FAV');
  const disk = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).phoneBook);
  expect(disk.fav.Sefton).toBeUndefined();
  expect(disk.fav.Ash).toBe(true);                  // the old key stays on disk
  await reloadFromDisk(page);
  const got = await page.evaluate(() => ({
    fav: PixelPets.state.phoneBook.fav, met: PixelPets.state.phoneBook.met, fold: PixelPets.state.flags['fold.Ash'], v: PixelPets.state.v,
  }));
  expect(got.fav.Sefton).toBeUndefined();
  expect(got.fav.Ash).toBe(true);
  expect(got.met.Sefton).toBe(true);
  expect(got.fold).toBe(true);
  expect(got.v).toBe(2);
});

test('rep {Fen: 60}, Master Fen drops to 50 (base, key deleted), save and reload, and trust stays 50', async ({ page }) => {
  await boot(page, save({ rep: { Fen: 60 }, phoneBook: { met: { Fen: true }, fav: {} } }));
  expect(await page.evaluate(() => PixelPets.repGet('Master Fen'))).toBe(60);
  const after = await page.evaluate(() => PixelPets.repAdd('Master Fen', -10));
  expect(after).toBe(50);
  const disk = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).rep);
  expect(disk['Master Fen']).toBeUndefined();       // sparse: back at base means no key
  expect(disk.Fen).toBe(60);                         // the old key stays on disk
  await reloadFromDisk(page);
  const got = await page.evaluate(() => ({ n: PixelPets.repGet('Master Fen'), rep: PixelPets.state.rep, v: PixelPets.state.v }));
  expect(got.n).toBe(50);
  expect(got.rep['Master Fen']).toBeUndefined();
  expect(got.rep.Fen).toBe(60);
  expect(got.v).toBe(2);
});

const FOLD = { Marisol: 'Master Marisol', Fen: 'Master Fen', Hale: 'Master Hale', Tobin: 'Associate Tobin',
  Hollis: 'Associate Hollis', Quinn: 'Associate Quinn', Imogen: 'Field Lead Imogen', Ash: 'Sefton' };

test('normalizeV2 twice on a save holding every old name is deep-equal, and every fold is marked @w1', async ({ page }) => {
  await boot(page, save());
  const out = await page.evaluate((fold) => {
    const s = JSON.parse(JSON.stringify(PixelPets.state));
    s.rep = {}; s.phoneBook = { met: {}, fav: {} };
    for (const k of Object.keys(s.flags)) if (k.startsWith('fold.')) delete s.flags[k];
    let i = 0;
    for (const from of Object.keys(fold)) { s.rep[from] = 55 + (i++); s.phoneBook.met[from] = true; s.phoneBook.fav[from] = true; }
    const once = PPSave.normalizeV2(JSON.parse(JSON.stringify(s)));
    const twice = PPSave.normalizeV2(JSON.parse(JSON.stringify(once)));
    return { once, twice };
  }, FOLD);
  expect(out.twice).toEqual(out.once);
  expect(out.once.v).toBe(2);
  let i = 0;
  for (const [from, to] of Object.entries(FOLD)) {
    const n = 55 + (i++);
    expect(out.once.flags['fold.' + from], from).toBe(true);
    expect(out.once.rep[from], from).toBe(n);         // old keys stay
    expect(out.once.rep[to], to).toBe(n);
    expect(out.once.phoneBook.met[to], to).toBe(true);
    expect(out.once.phoneBook.fav[to], to).toBe(true);
    expect(out.once.phoneBook.met[from], from).toBe(true);
  }
});

test('a save holding both keys keeps the new key and the old key; a fresh save gets no fold marks @w1', async ({ page }) => {
  await boot(page, save());
  const out = await page.evaluate(() => {
    const base = JSON.parse(JSON.stringify(PixelPets.state));
    for (const k of Object.keys(base.flags)) if (k.startsWith('fold.')) delete base.flags[k];
    const s = JSON.parse(JSON.stringify(base));
    s.rep = { Fen: 60, 'Master Fen': 72 };
    s.phoneBook = { met: { Ash: true, Sefton: true }, fav: { Ash: true } };
    const both = PPSave.normalizeV2(s);
    const fresh = JSON.parse(JSON.stringify(base));
    fresh.rep = {}; fresh.phoneBook = { met: {}, fav: {} };
    const plain = PPSave.normalizeV2(fresh);
    // A save that folded before this fix (both keys, no mark) and then had the new fav removed: one more copy, then never again.
    const pre = JSON.parse(JSON.stringify(base));
    pre.rep = {}; pre.phoneBook = { met: { Ash: true, Sefton: true }, fav: { Ash: true } };
    const pre1 = PPSave.normalizeV2(pre);
    delete pre1.phoneBook.fav.Sefton;
    const pre2 = PPSave.normalizeV2(JSON.parse(JSON.stringify(pre1)));
    return { both, plainFold: Object.keys(plain.flags).filter((k) => k.startsWith('fold.')), pre1Mark: pre1.flags['fold.Ash'], pre2 };
  });
  expect(out.both.rep['Master Fen']).toBe(72);       // the new key wins
  expect(out.both.rep.Fen).toBe(60);                  // the old key stays on disk
  expect(out.both.flags['fold.Fen']).toBe(true);
  expect(out.both.phoneBook.met.Sefton).toBe(true);
  expect(out.both.phoneBook.fav.Sefton).toBe(true);   // fav was absent under Sefton, so the one fold copies it
  expect(out.both.phoneBook.met.Ash).toBe(true);
  expect(out.both.flags['fold.Ash']).toBe(true);
  expect(out.both.v).toBe(2);
  expect(out.plainFold).toEqual([]);
  expect(out.pre1Mark).toBe(true);
  expect(out.pre2.phoneBook.fav.Sefton).toBeUndefined();
  expect(out.pre2.phoneBook.fav.Ash).toBe(true);
});

test('save.js FOLD_KEYS matches rep.js REP_CANON (PPRep.canon) @w1', async ({ page }) => {
  await boot(page, save());
  const canon = await page.evaluate(() => PPRep.canon());
  expect(canon).toEqual(FOLD);
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'save.js'), 'utf8');
  const m = src.match(/const FOLD_KEYS = (\{[\s\S]*?\});/);
  expect(m, 'FOLD_KEYS in save.js').toBeTruthy();
  const fold = Function('"use strict"; return (' + m[1] + ');')();
  expect(fold).toEqual(canon);
});
