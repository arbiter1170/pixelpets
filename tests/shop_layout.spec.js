/* SHOP_LAYOUT sections 2-4 and 2.8. The shared sheet, row states, the room band, and the free Lantern rest line.
   Widths are the Playwright projects (320, 375, 390). Save v stays 2. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, boxesOverlap, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const LINE_A = 'Your team rests up and feels full of energy. This Lantern House will remember you.';
const LINE_B = 'Your team is already rested. This Lantern House will remember you.';

function save(extra) {
  const s = starterSave();
  s.money = 55;
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.party[0].hunger = 40;
  s.party[0].energy = 100;
  return Object.assign(s, extra || {});
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => {
    PixelPets.showTab('walk');
    PixelPets.clock.set('tue', 12, 0);
  });
}

async function stand(page, map, x, y, facing) {
  await page.evaluate(({ map, x, y, facing }) => PixelPets.goto(map, x, y, facing), { map, x, y, facing });
  await page.waitForFunction(() => !window.PixelPets.fading);
}

async function reachChoice(page) {
  for (let i = 0; i < 30; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, waiting: s.waiting };
    });
    if (!sc) throw new Error('scene ended before a choice');
    if (sc.mode === 'choice') {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      return;
    }
    if (sc.waiting) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('no choice');
}

async function openHesper(page) {
  await stand(page, 'hm_diner', 4, 2, 'left');
  expect(await page.evaluate(() => PixelPets.talkTo('hm_hesper'))).toBe(true);
  await reachChoice(page);
  await page.waitForSelector('#ovShop:not([hidden])');
}

async function openProvisions(page) {
  await stand(page, 'hm_store', 2, 4, 'up');
  expect(await page.evaluate(() => PixelPets.talkTo('store_counter'))).toBe(true);
  await page.waitForSelector('#ovShop:not([hidden])');
}

async function sheetBox(page) {
  return page.evaluate(() => {
    const sheet = document.querySelector('#ovShop .shop-sheet').getBoundingClientRect();
    const list = document.querySelector('#shopList');
    const head = document.querySelector('#ovShop .shop-head').getBoundingClientRect();
    const x = document.querySelector('#shopClose').getBoundingClientRect();
    const rows = [...document.querySelectorAll('#shopList .shop-row')].map((r) => {
      const buy = r.querySelector('.shop-buy').getBoundingClientRect();
      const rr = r.getBoundingClientRect();
      return {
        id: r.dataset.id,
        name: r.querySelector('.shop-name').textContent,
        sub: r.querySelector('.shop-own').textContent,
        price: r.querySelector('.shop-price').textContent,
        btn: r.querySelector('.shop-buy').textContent,
        h: rr.height,
        bw: buy.width,
        bh: buy.height,
        bx: buy.x,
        by: buy.y,
      };
    });
    const c = document.querySelector('#mapCanvas');
    const g = c.getContext('2d', { willReadFrequently: true });
    const w = c.width, h = c.height, data = g.getImageData(0, 0, w, h).data;
    let y = 0;
    for (; y < h; y++) {
      let ink = false;
      for (let px = 0; px < w; px += 2) {
        const i = (y * w + px) * 4;
        if (data[i] !== 0x1a || data[i + 1] !== 0x1c || data[i + 2] !== 0x2c) { ink = true; break; }
      }
      if (ink) break;
    }
    const cr = c.getBoundingClientRect();
    const chip = document.querySelector('#fcAcorns');
    const cs = getComputedStyle(chip);
    return {
      sheetTop: sheet.top,
      sheetH: sheet.height,
      sheetW: sheet.width,
      headH: head.height,
      xw: x.width,
      xh: x.height,
      listSh: list.scrollHeight,
      listCh: list.clientHeight,
      rows,
      roomTop: cr.top + y * (cr.height / h),
      chipOp: Number(cs.opacity),
      priceOn: document.body.classList.contains('price-on'),
      zoom: window.PixelPets.mapInfo.scale,
      v: window.PixelPets.state.v,
      vh: window.innerHeight,
    };
  });
}

test('the diner sheet fits, one tap buys one, and a refused tap changes nothing', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  await openHesper(page);
  await page.waitForTimeout(400);
  const box = await sheetBox(page);
  const w = page.viewportSize().width;
  // Oct 28, 2026: under the Modern dock the sheet sits above the dock (it ran under the dock's band), and the camera frames the
  // room above the sheet. Was 577 / 301 / 400 and 185 / 56 before the dock.
  const sheetWant = w === 390 ? 408 : w === 320 ? 132 : 231;
  const roomWant = w === 390 ? 102 : w === 320 ? 12 : null;
  expect(Math.abs(box.sheetTop - sheetWant), 'sheet top ' + box.sheetTop).toBeLessThanOrEqual(20);
  expect(box.sheetH).toBeLessThanOrEqual(box.vh * 0.55 + 2);
  expect(box.headH).toBeGreaterThanOrEqual(60);
  expect(Math.round(box.xw)).toBeGreaterThanOrEqual(44);
  expect(Math.round(box.xh)).toBeGreaterThanOrEqual(44);
  expect(box.rows.map((r) => r.name)).toEqual(['Coach Stew', 'Berry Stack', 'Hearth Plate']);
  expect(box.rows.map((r) => r.sub)).toEqual(['Food +30, Joy +3', 'Food +20, Joy +8', 'Need 15 more']);
  expect(box.rows.map((r) => r.price)).toEqual(['30', '40', '70']);
  expect(box.rows.every((r) => r.btn === 'BUY' && r.bw >= 63 && r.bh >= 43 && r.h >= 55)).toBe(true);
  for (let i = 1; i < box.rows.length; i++) expect(box.rows[i].by - (box.rows[i - 1].by + box.rows[i - 1].bh)).toBeGreaterThanOrEqual(8);
  if (roomWant != null) expect(Math.abs(box.roomTop - roomWant), 'room top ' + box.roomTop).toBeLessThanOrEqual(16);
  expect(box.zoom).toBe(2);
  expect(box.chipOp).toBe(1);
  expect(box.priceOn).toBe(true);
  expect(box.v).toBe(2);
  const chip = await page.locator('#fcAcorns').boundingBox();
  const sheet = await page.locator('#ovShop .shop-sheet').boundingBox();
  expect(boxesOverlap(chip, sheet)).toBe(false);
  if (w === 390) await page.screenshot({ path: path.join(artifactsDir('shop-layout'), 'hesper-390.png') });

  const before = await page.evaluate(() => ({ money: PixelPets.state.money, hunger: PixelPets.state.party[0].hunger, bag: PixelPets.state.bag.heal_snack || 0 }));
  await page.locator('#shopList .shop-row[data-id="hearth_plate"] .shop-buy').click();
  await expect(page.locator('#toast')).toHaveText('Not enough Acorns.');
  await page.waitForFunction(() => !window.PixelPets.scene);
  const refused = await page.evaluate(() => ({ money: PixelPets.state.money, hunger: PixelPets.state.party[0].hunger, bag: PixelPets.state.bag.heal_snack || 0, v: PixelPets.state.v }));
  expect(refused.money).toBe(before.money);
  expect(refused.hunger).toBeCloseTo(before.hunger, 3);
  expect(refused.bag).toBe(before.bag);
  expect(refused.v).toBe(2);

  await openHesper(page);
  await page.locator('#shopList .shop-row[data-id="coach_stew"] .shop-buy').click();
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.mode === 'say' && s.text === 'Coach Stew is gone.';
  });
  const bought = await page.evaluate(() => ({ money: PixelPets.state.money, hunger: PixelPets.state.party[0].hunger, choices: document.querySelectorAll('#sbChoices button').length }));
  expect(bought.money).toBe(25);
  expect(bought.hunger).toBeCloseTo(70, 3);
  expect(bought.choices).toBe(0);
});

test('a long list scrolls inside the sheet and row states follow the balance', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  await openProvisions(page);
  await page.waitForTimeout(400);
  const box = await sheetBox(page);
  const w = page.viewportSize().width;
  expect(box.rows.length).toBe(9);
  expect(box.sheetH).toBeLessThanOrEqual(box.vh * 0.55 + 2);
  expect(box.listSh).toBeGreaterThan(box.listCh + 8);
  expect(box.rows[0].sub).toBe('Restores 40% HP.');
  expect(box.rows[1].sub).toBe('Need 95 more');
  expect(box.rows[4].sub).toBe('Need 5 more');
  expect(box.rows[5].sub).toBe('A sweet treat. JOY +20.');
  const head0 = await page.locator('#ovShop .shop-head').boundingBox();
  const x0 = await page.locator('#shopClose').boundingBox();
  await page.locator('#shopList').evaluate((el) => { el.scrollTop = el.scrollHeight; });
  const head1 = await page.locator('#ovShop .shop-head').boundingBox();
  const x1 = await page.locator('#shopClose').boundingBox();
  expect(Math.abs(head1.y - head0.y)).toBeLessThan(1);
  expect(Math.abs(x1.y - x0.y)).toBeLessThan(1);
  const last = await page.locator('#shopList .shop-row').last();
  await expect(last).toBeVisible();
  if (w === 320) await page.screenshot({ path: path.join(artifactsDir('shop-layout'), 'provisions-320.png') });

  await page.evaluate(() => { PixelPets.state.money = 0; });
  await page.locator('#shopList .shop-row[data-id="heal_snack"] .shop-buy').click();
  await expect(page.locator('#toast')).toHaveText('Not enough Acorns.');
  const held = await page.evaluate(() => ({ money: PixelPets.state.money, n: PixelPets.state.bag.heal_snack || 0 }));
  expect(held).toEqual({ money: 0, n: 0 });

  await page.evaluate(() => { PixelPets.state.money = 55; PixelPets.state.bag.heal_snack = 20; });
  await page.locator('#shopClose').click();
  await openProvisions(page);
  const full = page.locator('#shopList .shop-row[data-id="heal_snack"]');
  await expect(full.locator('.shop-buy')).toHaveText('FULL');
  await expect(full.locator('.shop-own')).toHaveText('Bag full');
  await full.locator('.shop-buy').click();
  await expect(page.locator('#toast')).toHaveText("Bag can't hold more.");
  expect(await page.evaluate(() => PixelPets.state.bag.heal_snack)).toBe(20);
});

test('Lanternfly motes buy in one tap, the wardrobe says Need N more, and the Heights crate has its name', async ({ page }) => {
  test.setTimeout(60000);
  const s = save();
  s.money = 3000;
  await boot(page, s);
  await stand(page, 'highcharity', 2, 2, 'down');
  const at = await page.evaluate(() => {
    const npc = (PixelPets.mapInfo.objs || []).find((o) => o.id === 'hc_shop');
    const tries = [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']];
    for (const t of tries) {
      const info = PixelPets.tileInfo(npc.x + t[0], npc.y + t[1]);
      if (info && info.walk && !info.blocked) {
        PixelPets.goto('highcharity', npc.x + t[0], npc.y + t[1], t[2]);
        return true;
      }
    }
    return false;
  });
  expect(at).toBe(true);
  await page.waitForFunction(() => !window.PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.talkTo('hc_shop'))).toBe(true);
  await page.waitForSelector('#ovShop:not([hidden])');
  const row = page.locator('.shop-row[data-id="lanternfly"]');
  await expect(row.locator('.shop-own')).not.toHaveText(/Need/);
  await expect(row.locator('.shop-buy')).toHaveText('BUY');
  await row.locator('.shop-buy').click();
  await expect(page.locator('#toast')).toHaveText('Lanternfly motes is yours.');
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(0);
  await expect(row.locator('.shop-buy')).toHaveText('OWNED');
  expect(await page.locator('#sbChoices button').count()).toBe(0);

  await page.evaluate(() => { PixelPets.state.money = 55; document.querySelector('#ovShop').hidden = true; });
  await page.evaluate(() => { PixelPets.goto('hm_wardrobe', 9, 4, 'up'); });
  await page.waitForFunction(() => !window.PixelPets.fading);
  await page.evaluate(() => openWardrobe());
  await page.waitForSelector('#ovWardrobe:not([hidden])');
  const ward = page.locator('.ward-item[data-id="wick_charm"]');
  await expect(ward.locator('.ward-state')).toHaveText('Need 65 more');
  await expect(ward.locator('.ward-act')).toHaveClass(/muted/);
  await ward.locator('.ward-act').click();
  await expect(page.locator('#toast')).toHaveText('Not enough Acorns.');
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(55);
  await page.locator('#wardDone').click();

  await stand(page, 'fb_heights', 13, 11, 'up');
  expect(await page.evaluate(() => PixelPets.talkTo('ht_stock'))).toBe(true);
  await page.waitForSelector('#ovShop:not([hidden])');
  await expect(page.locator('#shopTitle')).toHaveText('Heights Supply Crate');
});

test('the Travel Shelf before a partner opens empty, and reduced motion snaps the room', async ({ page }) => {
  test.setTimeout(60000);
  const s = save();
  s.party = [];
  s.partnerId = null;
  s.flags['story.starter_received'] = false;
  await boot(page, s);
  await stand(page, 'hm_lantern_in', 6, 3, 'up');
  expect(await page.evaluate(() => PixelPets.talkTo('travel_shelf'))).toBe(true);
  await page.waitForSelector('#ovShop:not([hidden])');
  await expect(page.locator('.shop-empty')).toHaveText("Empty for now. Ilse restocks once you've a partner.");
  expect(await page.locator('#shopList .shop-buy').count()).toBe(0);
  await page.locator('#shopClose').click();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stand(page, 'hm_store', 2, 4, 'up');
  const tops = await page.evaluate(() => new Promise((res) => {
    PixelPets.talkTo('store_counter');
    const tops = [];
    const measure = () => {
      const c = document.querySelector('#mapCanvas');
      const g = c.getContext('2d', { willReadFrequently: true });
      const w = c.width, h = c.height, data = g.getImageData(0, 0, w, h).data;
      let y = 0;
      for (; y < h; y++) {
        let ink = false;
        for (let px = 0; px < w; px += 4) {
          const i = (y * w + px) * 4;
          if (data[i] !== 0x1a || data[i + 1] !== 0x1c || data[i + 2] !== 0x2c) { ink = true; break; }
        }
        if (ink) break;
      }
      const r = c.getBoundingClientRect();
      return r.top + y * (r.height / h);
    };
    const t0 = performance.now();
    const step = () => {
      tops.push(measure());
      if (performance.now() - t0 < 200) requestAnimationFrame(step);
      else res(tops);
    };
    requestAnimationFrame(step);
  }));
  const lo = Math.min.apply(null, tops), hi = Math.max.apply(null, tops);
  expect(hi - lo, 'reduced motion room tops ' + lo + ' ' + hi).toBeLessThan(4);
});

test('the room eases into the band when motion is allowed', async ({ page }) => {
  await boot(page);
  await stand(page, 'hm_store', 2, 4, 'up');
  const tops = await page.evaluate(() => new Promise((res) => {
    PixelPets.talkTo('store_counter');
    const tops = [];
    const measure = () => {
      const c = document.querySelector('#mapCanvas');
      const g = c.getContext('2d', { willReadFrequently: true });
      const w = c.width, h = c.height, data = g.getImageData(0, 0, w, h).data;
      let y = 0;
      for (; y < h; y++) {
        let ink = false;
        for (let px = 0; px < w; px += 4) {
          const i = (y * w + px) * 4;
          if (data[i] !== 0x1a || data[i + 1] !== 0x1c || data[i + 2] !== 0x2c) { ink = true; break; }
        }
        if (ink) break;
      }
      const r = c.getBoundingClientRect();
      return r.top + y * (r.height / h);
    };
    const t0 = performance.now();
    const step = () => {
      tops.push(measure());
      if (performance.now() - t0 < 240) requestAnimationFrame(step);
      else res(tops);
    };
    requestAnimationFrame(step);
  }));
  expect(Math.abs(tops[tops.length - 1] - tops[0])).toBeGreaterThan(8);
});

test('arrow keys and Enter buy the selected row', async ({ page }) => {
  const s = save();
  s.money = 500;
  await boot(page, s);
  await openProvisions(page);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#shopList .shop-row').nth(1)).toHaveClass(/sel/);
  await page.keyboard.press('Enter');
  await expect(page.locator('#toast')).toHaveText('+1 Hearty Snack');
  expect(await page.evaluate(() => ({ money: PixelPets.state.money, n: PixelPets.state.bag.hearty_snack || 0 }))).toEqual({ money: 350, n: 1 });
});

test('a free Lantern rest says the refill line or the already-rested line', async ({ page }) => {
  test.setTimeout(60000);
  const s = save();
  s.party[0].energy = 60;
  await boot(page, s);
  await stand(page, 'hm_lantern_in', 1, 3, 'up');
  expect(await page.evaluate(() => PixelPets.talkTo('lantern_bed_a'))).toBe(true);
  await reachChoice(page);
  expect(await page.locator('#ovShop').isHidden()).toBe(true);
  await page.locator('#sbChoices button', { hasText: 'Rest a while' }).click();
  await page.waitForFunction((line) => window.PixelPets.scene && window.PixelPets.scene.text === line, LINE_A);
  expect(await page.evaluate(() => PixelPets.state.party[0].energy)).toBe(100);
  for (let i = 0; i < 8; i++) {
    const open = await page.evaluate(() => !!window.PixelPets.scene);
    if (!open) break;
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);
  }
  await page.waitForFunction(() => !window.PixelPets.scene);
  const filled = await page.evaluate(() => ({
    money: PixelPets.state.money,
    respawn: PixelPets.state.world.respawn,
    v: PixelPets.state.v,
  }));
  expect(filled).toEqual({ money: 55, respawn: 'hearthmoor', v: 2 });

  expect(await page.evaluate(() => PixelPets.talkTo('lantern_bed_a'))).toBe(true);
  await reachChoice(page);
  await page.evaluate(() => {
    PixelPets.state.party[0].energy = 100;
    const btn = [...document.querySelectorAll('#sbChoices button')].find((b) => b.textContent.indexOf('Rest a while') === 0);
    btn.click();
  });
  await page.waitForFunction((line) => window.PixelPets.scene && window.PixelPets.scene.text === line, LINE_B);
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(55);
});

test('a hurt Lantern rest stays a yes or no prompt with the chip', async ({ page }) => {
  const s = save();
  s.party[0].hpNow = 4;
  s.world.restDue = true;
  await boot(page, s);
  await stand(page, 'hm_lantern_in', 1, 3, 'up');
  expect(await page.evaluate(() => PixelPets.talkTo('lantern_bed_a'))).toBe(true);
  await reachChoice(page);
  expect(await page.locator('#ovShop').isHidden()).toBe(true);
  await expect(page.locator('#sbChoices button', { hasText: 'Rest (5 Acorns)' })).toBeVisible();
  const chip = await page.evaluate(() => ({
    op: Number(getComputedStyle(document.querySelector('#fcAcorns')).opacity),
    price: document.body.classList.contains('price-on'),
  }));
  expect(chip).toEqual({ op: 1, price: true });
});
