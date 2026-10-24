/* SHOP_EXIT hotfix (Vincent's playtest, Oct 23: "can't exit, force to buy").
   Every store, stall menu and the Travel Shelf must close without a purchase: X and Escape.
   The trap: the care walk's C1 coach card (#tutLayer, z 15) sat over the shop sheet (z 11) and covered X.
   Runs at 390, and at 320 through the @w1 copies. Save stays pixelpets.save.v2 with v 2. */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

function save(extra) {
  const s = starterSave();
  s.player.name = 'Tester';
  s.party[0].nick = 'Pipkit';
  s.party[0].hunger = 40;
  s.money = 0;
  s.flags['trainer.r2_lead'] = true;
  Object.assign(s.flags, extra || {});
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.clock.set('tue', 12, 0); });
}

// Every object that opens the shared shop sheet: o.shop stores, o.meals stall menus, and the Travel Shelf.
async function allStores(page) {
  return page.evaluate(() => {
    const out = [];
    for (const [map, m] of Object.entries(WORLD)) for (const o of (m.objs || [])) {
      if (o.shop || o.meals || o.id === 'travel_shelf') out.push({ map, id: o.id, meal: !o.shop && !!o.meals });
    }
    return out;
  });
}

async function standBy(page, s) {
  const spot = await page.evaluate(s => {
    PixelPets.goto(s.map);
    const o = PixelPets.mapInfo.objs.find(x => x.id === s.id);
    if (!o) return null;
    for (const t of [{ x: o.x, y: o.y + 1, f: 'up' }, { x: o.x, y: o.y - 1, f: 'down' }, { x: o.x + 1, y: o.y, f: 'left' }, { x: o.x - 1, y: o.y, f: 'right' }]) {
      const i = PixelPets.tileInfo(t.x, t.y);
      if (i && i.walk && !i.blocked) { PixelPets.goto(s.map, t.x, t.y, t.f); return { x: o.x, y: o.y }; }
    }
    return null;
  }, s);
  expect(spot, s.map + ' ' + s.id).toBeTruthy();
  return spot;
}

const shopUp = page => page.evaluate(() => !document.querySelector('#ovShop').hidden);

// TALK (Space) first. A shop-only prop (the Heights crate) is not talkable, so tap its tile instead.
async function openStore(page, s) {
  const spot = await standBy(page, s);
  await page.keyboard.press('Space');
  for (let i = 0; i < 30 && !(await shopUp(page)); i++) {
    await page.waitForTimeout(100);
    const sc = await page.evaluate(() => PixelPets.scene && PixelPets.scene.mode);
    if (sc && sc !== 'choice') await page.keyboard.press('Space');
    if (i === 6 && !sc) {
      const xy = await page.evaluate(({ x, y }) => {
        const c = document.querySelector('#mapCanvas'), cam = PixelPets.walk.cam, k = c.getBoundingClientRect().width / c.width;
        return { x: (x * 16 - cam.x + 8) * k, y: (y * 16 - cam.y + 8) * k };
      }, spot);
      await page.locator('#mapCanvas').click({ position: xy });
    }
  }
  await expect(page.locator('#ovShop'), s.map + ' ' + s.id + ' opens').toBeVisible();
  await page.waitForFunction(() => PixelPets.optionsReady !== false, null, { timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(550);   // the meal sheet's 500 ms tap guard
}

// X is on screen, at least 44 px, and the top element at its centre (nothing covers it).
async function closeBox(page) {
  return page.evaluate(() => {
    const x = document.querySelector('#shopClose'), r = x.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { x: r.left, y: r.top, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight, top: top ? (top.id || top.className || top.tagName) : null };
  });
}

async function wallet(page) {
  return page.evaluate(() => ({ money: PixelPets.state.money | 0, bag: JSON.stringify(PixelPets.state.bag || {}), v: PixelPets.state.v }));
}

async function expectClosedAndStays(page, label) {
  await expect(page.locator('#ovShop'), label).toBeHidden();
  await page.waitForTimeout(400);
  expect(await shopUp(page), label + ' stays shut').toBe(false);
  expect(await page.evaluate(() => !!PixelPets.scene), label + ' no scene left').toBe(false);
}

async function tapX(page, label) {
  const b = await closeBox(page);
  expect(b.w, label + ' X width').toBeGreaterThanOrEqual(44);
  expect(b.h, label + ' X height').toBeGreaterThanOrEqual(44);
  expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= b.vw && b.y + b.h <= b.vh, label + ' X on screen').toBe(true);
  expect(b.top, label + ' X not covered').toBe('shopClose');
  await page.touchscreen.tap(b.x + b.w / 2, b.y + b.h / 2);
}

async function everyStoreCloses(page) {
  test.setTimeout(240000);
  await boot(page, save());
  const stores = await allStores(page);
  expect(stores.length).toBeGreaterThanOrEqual(25);
  const w0 = await wallet(page);
  for (const s of stores) {
    const label = s.map + ' ' + s.id;
    await openStore(page, s);
    await tapX(page, label);
    await expectClosedAndStays(page, label + ' X');
    await openStore(page, s);
    await page.keyboard.press('Escape');
    await expectClosedAndStays(page, label + ' Escape');
  }
  expect(await wallet(page)).toEqual(w0);
}

// The trap. C1 is a soft card, so TALK still works under it; the store sheet opened beneath it.
async function careCardNeverCoversX(page) {
  test.setTimeout(240000);
  await boot(page, save({ 'story.tut_care': 'armed' }));
  const stores = (await allStores(page)).filter(s => !s.meal);
  expect(stores.length).toBeGreaterThanOrEqual(13);
  // Before any store. The first interior adds floorSeen; a key every store writes must still show up as extra.
  const before = await page.evaluate(() => Object.keys(PixelPets.state).sort());
  const w0 = await wallet(page);
  let shotDone = false;
  for (const s of stores) {
    const label = s.map + ' ' + s.id + ' (care walk C1)';
    await page.evaluate(() => PixelPets.restartCareWalk());
    await page.waitForFunction(() => PixelPets.lesson().card === 'C1', null, { timeout: 10000 });
    await openStore(page, s);
    if (!shotDone && s.id === 'travel_shelf') {
      shotDone = true;
      await page.screenshot({ path: path.join(artifactsDir('shop-exit'), 'c1-travel-shelf-' + page.viewportSize().width + '.png') });
    }
    await tapX(page, label);
    await expectClosedAndStays(page, label);
    // The walk falls back the way it does for a talk: tut_care goes to wait, and the next tray starts the lesson.
    expect(await page.evaluate(() => PixelPets.state.flags['story.tut_care']), label).toBe('wait');
  }
  expect(await wallet(page)).toEqual(w0);
  const after = await page.evaluate(() => Object.keys(PixelPets.state).sort());
  expect(after.filter(k => !before.includes(k))).toEqual(['floorSeen']);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
}

test('every store closes with X and Escape without buying', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 here; 320 runs the @w1 copy');
  await everyStoreCloses(page);
});
test('every store closes with X and Escape without buying @w1', async ({ page }) => {
  await everyStoreCloses(page);
});
test('the care walk card never covers a store X', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 here; 320 runs the @w1 copy');
  await careCardNeverCoversX(page);
});
test('the care walk card never covers a store X @w1', async ({ page }) => {
  await careCardNeverCoversX(page);
});
