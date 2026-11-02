/* More outfits in the look picker: overalls, cardigan, raincoat, cloak, apron, jacket.
   All six are free from the first picker (WHO ARE YOU?) and in CHANGE LOOK. Art-only: the save stays
   pixelpets.save.v2 with v 2, and player.look.outfit is an existing field (a new id is just a new value).
   Phone widths come from the Playwright projects (320, 375, 390). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const OLD = ['coat', 'hoodie', 'tunic', 'vest', 'sweater', 'dress'];
const NEW = ['overalls', 'cardigan', 'raincoat', 'cloak', 'apron', 'jacket'];

async function boot(page, save) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save || starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

test('new outfits are 16x16 in every facing, use only recolour keys, and read apart', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(([OLD, NEW]) => {
    const bad = [];
    for (const id of NEW) {
      const o = KEEPER_OUTFITS[id];
      if (!o) { bad.push(id + ' missing'); continue; }
      for (const f of ['down', 'up', 'right']) {
        if (!o[f] || o[f].length !== 2) { bad.push(id + ' ' + f + ' frames'); continue; }
        for (const fr of o[f]) {
          if (fr.length !== 16 || !fr.every(row => row.length === 16)) bad.push(id + ' ' + f + ' size');
          // t outfit colour, r accent, 3 skin, d charcoal. No Glimmerwell V N Q (D1083) and no fixed brights.
          for (const row of fr) if (/[^.tr3d]/.test(row)) bad.push(id + ' ' + f + ' key in ' + row);
        }
      }
      for (const f of ['down', 'right', 'up', 'left']) for (const n of [0, 1]) {
        const g = keeperGrid({ outfit: id }, f, n);
        if (g.length !== 16 || !g.every(row => row.length === 16)) bad.push(id + ' grid ' + f + n);
      }
    }
    const face = id => keeperGrid({ outfit: id }, 'down', 0).join('/');
    const all = OLD.concat(NEW), seen = {};
    for (const id of all) { const k = face(id); if (seen[k]) bad.push(id + ' looks like ' + seen[k]); seen[k] = id; }
    return {
      bad,
      list: KEEPER_LOOKS.outfit.slice(),
      kept: NEW.map(id => normalizeLook({ outfit: id }).outfit),
      unknown: normalizeLook({ outfit: 'not_an_outfit' }).outfit,
      owned: NEW.map(id => ownsLook(id, 'outfit')),
    };
  }, [OLD, NEW]);
  expect(r.bad).toEqual([]);
  expect(r.list).toEqual(OLD.concat(NEW));            // old ids keep their places; new ones go on the end
  expect(r.kept).toEqual(NEW);
  expect(r.unknown).toBe('coat');
  expect(r.owned).toEqual(NEW.map(() => true));        // free: no wardrobe flag, no Acorns
});

// A new player (no save): the intro reaches the mirror, the first picker (WHO ARE YOU?).
async function introMirror(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.id === 'intro');
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => ({
      look: !document.querySelector('#ovLook').hidden,
      waiting: !!(PixelPets.scene && PixelPets.scene.waiting),
    }));
    if (st.look) break;
    if (st.waiting) await page.keyboard.press('Space');
    await page.waitForTimeout(50);
  }
  await expect(page.locator('#ovLook')).toBeVisible();
  await page.waitForFunction(() => PixelPets.optionsReady === true);
}

test('the first picker offers every outfit as a 44px+ button with no sideways scroll', async ({ page }) => {
  await introMirror(page);
  await expect(page.locator('#lookTitle')).toHaveText('WHO ARE YOU?');
  const r = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#lookOutfit button'));
    const box = document.querySelector('#ovLook .look-scroll') || document.querySelector('#ovLook .ov-inner');
    return {
      opts: btns.map(b => b.dataset.opt),
      labels: btns.map(b => b.getAttribute('aria-label')),
      small: btns.filter(b => { const q = b.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).map(b => b.dataset.opt),
      sideScroll: document.documentElement.scrollWidth > window.innerWidth || box.scrollWidth > box.clientWidth,
    };
  });
  expect(r.opts).toEqual(OLD.concat(NEW));
  expect(r.labels).toEqual(OLD.concat(NEW).map(id => 'Outfit: ' + id));
  expect(r.small).toEqual([]);
  expect(r.sideScroll).toBe(false);
  await page.locator('#lookOutfit button[data-opt="raincoat"]').click();
  await page.locator('#lookOutfit').scrollIntoViewIfNeeded();
  await page.screenshot({ path: artifactsDir('more_outfits') + '/picker-' + page.viewportSize().width + '.png' });
  await page.locator('#lookDone').click();
  await expect(page.locator('#ovLook')).toBeHidden();
  // The intro shows the pick at once and commits it at the scene's end (D800).
  expect(await page.evaluate(() => PixelPets.keeper.look.outfit)).toBe('raincoat');
});

test('each new outfit saves through CHANGE LOOK; the save stays v2', async ({ page }) => {
  await boot(page);
  for (const id of NEW) {
    await page.locator('#settingsBtn').click();
    await page.locator('#setLook').click();
    await page.waitForSelector('#ovLook:not([hidden])');
    await page.locator('#lookOutfit button[data-opt="' + id + '"]').click();
    await expect(page.locator('#lookOutfit button[data-opt="' + id + '"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#lookDone').click();
    await page.waitForSelector('#ovLook', { state: 'hidden' });
    expect(await page.evaluate(() => PixelPets.keeper.look.outfit)).toBe(id);
  }
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.player.look.outfit).toBe('jacket');
  expect(saved.player.name).toBe('Tester');
  expect(saved.partnerId).toBe('petsmoke1');
  const keys = Object.keys(saved.player.look).sort();
  expect(keys).toEqual(expect.arrayContaining(['accent', 'hair', 'hairCol', 'outfit', 'outfitCol', 'skin']));
});

test('a save that already holds a new outfit loads with it', async ({ page }) => {
  const s = starterSave();
  s.player.look.outfit = 'cloak';
  await boot(page, s);
  expect(await page.evaluate(() => PixelPets.keeper.look.outfit)).toBe('cloak');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.player.look.outfit).toBe('cloak');
});

test('an old save with an old outfit is unchanged', async ({ page }) => {
  const s = starterSave();
  s.player.look = { skin: '5', hair: 'bun', hairCol: 'o', outfit: 'dress', outfitCol: 'b', accent: 'y' };
  await boot(page, s);
  const look = await page.evaluate(() => PixelPets.keeper.look);
  expect(look).toMatchObject(s.player.look);
});
