/* WORLD_CLOCK_TOWN P4. A store on every outdoor map except Mahopac.
   Save stays pixelpets.save.v2 with v 2. Accessories reuse wardrobe.<id>. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

const SHOTS = '/workspace/launch/world_clock_p4';

const STORES = [
  { map: 'hm_store', id: 'store_counter', x: 2, y: 3, sprite: 'kitchen_counter' },
  { map: 'hm_store', id: 'store_cooler', x: 10, y: 3, sprite: 'mr_cooler' },
  { map: 'route1', id: 'r1_halvard', x: 5, y: 7, front: true },
  { map: 'route1', id: 'r1_waymark_l', x: 6, y: 7, sprite: 'waymark_cart_l', front: true },
  { map: 'route1', id: 'r1_waymark_r', x: 7, y: 7, sprite: 'waymark_cart_r', front: true },
  { map: 'proto', id: 'om_tibbet', x: 5, y: 8, dawn: true, front: true },
  { map: 'proto', id: 'om_honesty_l', x: 6, y: 8, sprite: 'honesty_box_l', front: true },
  { map: 'proto', id: 'om_honesty_r', x: 7, y: 8, sprite: 'honesty_box_r', front: true },
  { map: 'fernbrook', id: 'fb_wynne', x: 25, y: 7, front: true },
  { map: 'fernbrook', id: 'fb_orchard_l', x: 26, y: 7, sprite: 'orchard_stall_l', front: true },
  { map: 'fernbrook', id: 'fb_orchard_r', x: 27, y: 7, sprite: 'orchard_stall_r', front: true },
  { map: 'fb_heights', id: 'ht_tin', x: 14, y: 10, sprite: 'heights_tin' },
  { map: 'route2', id: 'r2_saffie', x: 5, y: 7, front: true },
  { map: 'route2', id: 'r2_watch_l', x: 6, y: 7, sprite: 'watch_hatch_l', front: true },
  { map: 'route2', id: 'r2_watch_r', x: 7, y: 7, sprite: 'watch_hatch_r', front: true },
  { map: 'route2_glen', id: 'glen_ilka', x: 13, y: 7, front: true },
  { map: 'route2_glen', id: 'glen_wicker_l', x: 14, y: 7, sprite: 'wicker_stall_l', front: true },
  { map: 'route2_glen', id: 'glen_wicker_r', x: 15, y: 7, sprite: 'wicker_stall_r', front: true },
  { map: 'cobblecrest', id: 'cc_stall_l', x: 11, y: 6, sprite: 'stall_counter' },
  { map: 'cobblecrest', id: 'cc_stall_r', x: 13, y: 6, sprite: 'stall_counter' },
  { map: 'cobble_quarry', id: 'q_brannoch', x: 17, y: 16, front: true },
  { map: 'cobble_quarry', id: 'q_toolcart_l', x: 18, y: 16, sprite: 'tool_cart_l', front: true },
  { map: 'cobble_quarry', id: 'q_toolcart_r', x: 19, y: 16, sprite: 'tool_cart_r', front: true },
  { map: 'highcharity', id: 'hc_shop', x: 30, y: 22 },
  { map: 'highcharity', id: 'hc_baker', x: 36, y: 23 },
  { map: 'hw_cut', id: 'hw_teodor', x: 4, y: 4, front: true },
  { map: 'hw_cut', id: 'hw_fallstair_l', x: 5, y: 4, sprite: 'supply_post_l', front: true },
  { map: 'hw_cut', id: 'hw_fallstair_r', x: 6, y: 4, sprite: 'supply_post_r', front: true },
];

const P4_ART = [
  'heights_tin', 'honesty_box_l', 'honesty_box_r', 'orchard_stall_l', 'orchard_stall_r',
  'supply_post_l', 'supply_post_r', 'tool_cart_l', 'tool_cart_r', 'watch_hatch_l', 'watch_hatch_r',
  'waymark_cart_l', 'waymark_cart_r', 'wicker_stall_l', 'wicker_stall_r',
];

function save(extra) {
  const s = starterSave();
  s.settings.follower = false;
  s.player.name = 'Tester';
  s.party[0].nick = 'Pipkit';
  s.party[0].hunger = 40;
  s.party[0].happy = 40;
  s.money = 200;
  s.flags['trainer.r2_lead'] = true;
  if (extra) Object.assign(s, extra);
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function at(page, day, hh, mm) {
  await page.evaluate(({ day, hh, mm }) => PixelPets.clock.set(day, hh, mm), { day, hh, mm });
}

async function stand(page, map, id) {
  const spot = await page.evaluate(({ map, id }) => {
    let rec = null;
    for (const f of Object.values(MAPDATA)) {
      if (f && f.maps && f.maps[map] && f.maps[map].grid) rec = f.maps[map];
    }
    const seed = (rec && (rec.safe || rec.start || rec.respawn)) || { x: 2, y: 2 };
    PixelPets.goto(map, seed.x, seed.y, 'down');
    const o = PixelPets.mapInfo.objs.find(x => x.id === id);
    if (!o) return null;
    const tries = [
      { x: o.x, y: o.y + 1, facing: 'up' },
      { x: o.x, y: o.y - 1, facing: 'down' },
      { x: o.x + 1, y: o.y, facing: 'left' },
      { x: o.x - 1, y: o.y, facing: 'right' },
    ];
    for (const t of tries) {
      const info = PixelPets.tileInfo(t.x, t.y);
      if (info && info.walk && !info.blocked) {
        PixelPets.goto(map, t.x, t.y, t.facing);
        return t;
      }
    }
    return null;
  }, { map, id });
  expect(spot, map + ' ' + id).toBeTruthy();
  return spot;
}

test('each store stands on its tiles and the new art resolves', async ({ page }) => {
  await boot(page);
  await at(page, 'tue', 6, 0);
  const report = await page.evaluate(stores => {
    const bad = [];
    const artBad = [];
    for (const key of [
      'heights_tin', 'honesty_box_l', 'honesty_box_r', 'orchard_stall_l', 'orchard_stall_r',
      'supply_post_l', 'supply_post_r', 'tool_cart_l', 'tool_cart_r', 'watch_hatch_l', 'watch_hatch_r',
      'waymark_cart_l', 'waymark_cart_r', 'wicker_stall_l', 'wicker_stall_r',
    ]) {
      const rows = EXTERIOR_ART.art[key];
      if (!rows || rows.length !== 16 || rows.some(r => r.length !== 16)) artBad.push(key);
    }
    const seen = {};
    for (const s of stores) {
      if (seen[s.map]) continue;
      seen[s.map] = 1;
      let rec = null;
      for (const f of Object.values(MAPDATA)) {
        if (f && f.maps && f.maps[s.map] && f.maps[s.map].grid) rec = f.maps[s.map];
      }
      const seed = (rec && (rec.safe || rec.start || rec.respawn)) || { x: 2, y: 2 };
      PixelPets.goto(s.map, seed.x, seed.y, 'down');
      const info = PixelPets.mapInfo;
      const walk = new Uint8Array(info.w * info.h);
      const q = [];
      const push = (x, y) => {
        if (x < 0 || y < 0 || x >= info.w || y >= info.h) return;
        const i = y * info.w + x;
        if (walk[i]) return;
        const t = PixelPets.tileInfo(x, y);
        if (!t.walk || t.blocked) return;
        walk[i] = 1;
        q.push(x, y);
      };
      push(seed.x, seed.y);
      for (const o of info.objs) {
        if (o.kind === 'warp') push(o.x, o.y);
        if (o.kind === 'door') push(o.x, o.y + 1);
      }
      for (let i = 0; i < q.length; i += 2) {
        const x = q[i], y = q[i + 1];
        push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
      }
      seen[s.map] = { w: info.w, walk };
    }
    for (const s of stores) {
      PixelPets.goto(s.map, 2, 2, 'down');
      const o = PixelPets.mapInfo.objs.find(x => x.id === s.id);
      if (!o) { bad.push(s.id + ' missing'); continue; }
      if (o.x !== s.x || o.y !== s.y) bad.push(s.id + ' at ' + o.x + ',' + o.y);
      const bag = seen[s.map];
      const openSide = (x, y) => {
        if (y < 0 || x < 0 || y * bag.w + x >= bag.walk.length) return false;
        const t = PixelPets.tileInfo(x, y);
        return !!(t && t.walk && !t.blocked && bag.walk[y * bag.w + x]);
      };
      const south = openSide(s.x, s.y + 1);
      const any = south || openSide(s.x, s.y - 1) || openSide(s.x - 1, s.y) || openSide(s.x + 1, s.y);
      if (s.front && !south) bad.push(s.id + ' south unreachable');
      else if (!any) bad.push(s.id + ' no reachable side');
      if (s.sprite) {
        const shown = PixelPets.mapObjs.find(x => x.id === s.id);
        if (!shown || !shown.art) bad.push(s.id + ' art not drawn');
      }
    }
    PixelPets.goto('mahopac', 2, 2, 'down');
    const mah = PixelPets.mapInfo.objs.map(o => o.id);
    return {
      bad, artBad, mah: mah.filter(id => id.indexOf('p4_') === 0 || id === 'mp_store'),
      v: PixelPets.state.v,
      rep: PixelPets.repCheck(),
    };
  }, STORES);
  expect(report.artBad).toEqual([]);
  expect(report.bad).toEqual([]);
  expect(report.mah).toEqual([]);
  expect(report.rep).toEqual([]);
  expect(report.v).toBe(2);
  expect(P4_ART).toHaveLength(15);

  if (page.viewportSize().width === 390) {
    await stand(page, 'route1', 'r1_halvard');
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: SHOTS + '/p4_route1_390.png' });
  }
});

test('the Waymark Cart sells the Trail pin badge at 120 Acorns', async ({ page }) => {
  const s = save();
  await boot(page, s);
  await at(page, 'tue', 12, 0);
  const keysBefore = await page.evaluate(() => Object.keys(PixelPets.state).sort());
  await stand(page, 'route1', 'r1_halvard');
  await page.keyboard.press('Space');
  await expect(page.locator('#ovShop')).toBeVisible();
  expect(await page.locator('#shopTitle').textContent()).toBe('Waymark Cart');
  expect(await page.locator('#shopFlavour').textContent()).toBe('Waymark Cart. Keeper stock for the road, at town prices.');
  const rows = await page.locator('.shop-row').evaluateAll(list => list.map(r => ({
    id: r.dataset.id,
    price: r.querySelector('.shop-price').textContent,
    btn: r.querySelector('.shop-buy').textContent,
  })));
  expect(rows).toEqual([
    { id: 'heal_snack', price: '50', btn: 'BUY' },
    { id: 'energy_sip', price: '60', btn: 'BUY' },
    { id: 'befriend_treat', price: '80', btn: 'BUY' },
    { id: 'pin_badge', price: '120', btn: 'BUY' },
  ]);
  if (page.viewportSize().width === 390) {
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: SHOTS + '/p4_store_menu_390.png' });
  }

  await page.evaluate(() => { PixelPets.state.money = 119; });
  await page.locator('.shop-row[data-id="pin_badge"] .shop-buy').click();
  await expect(page.locator('#toast')).toHaveText('Not enough Acorns.');
  const denied = await page.evaluate(() => ({
    money: PixelPets.state.money,
    flag: PixelPets.state.flags['wardrobe.pin_badge'] === true,
    btn: document.querySelector('.shop-row[data-id="pin_badge"] .shop-buy').textContent,
    sub: document.querySelector('.shop-row[data-id="pin_badge"] .shop-own').textContent,
  }));
  expect(denied).toEqual({ money: 119, flag: false, btn: 'BUY', sub: 'A gold pin for trail walkers.' });

  await page.evaluate(() => { PixelPets.state.money = 120; });
  await page.locator('.shop-row[data-id="pin_badge"] .shop-buy').click();
  await expect(page.locator('#toast')).toHaveText('Trail pin badge is yours.');
  const bought = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      money: PixelPets.state.money,
      flag: PixelPets.state.flags['wardrobe.pin_badge'] === true,
      saved: raw.flags['wardrobe.pin_badge'] === true,
      v: raw.v,
      btn: document.querySelector('.shop-row[data-id="pin_badge"] .shop-buy').textContent,
      sub: document.querySelector('.shop-row[data-id="pin_badge"] .shop-own').textContent,
      price: document.querySelector('.shop-row[data-id="pin_badge"] .shop-price').textContent,
      keys: Object.keys(PixelPets.state).sort(),
      rawKeys: Object.keys(raw).sort(),
    };
  });
  expect(bought.money).toBe(0);
  expect(bought.flag).toBe(true);
  expect(bought.saved).toBe(true);
  expect(bought.v).toBe(2);
  expect(bought.btn).toBe('OWNED');
  expect(bought.sub).toBe('Yours');
  expect(bought.price).toBe('');
  expect(bought.keys).toEqual(keysBefore);
  expect(bought.rawKeys).toEqual(keysBefore);

  await page.locator('#shopClose').click();
  await expect(page.locator('#ovShop')).toBeHidden();
  await stand(page, 'hm_wardrobe', 'hm_marigold');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await page.keyboard.press('Space');
  await page.waitForSelector('#ovWardrobe:not([hidden])');
  await expect(page.locator('.ward-item[data-id="pin_badge"] .ward-act')).toHaveText('WEAR');
});

test('a stall snack is eaten on the spot and skips the Warm Bowl', async ({ page }) => {
  const s = save();
  s.money = 100;
  await boot(page, s);
  await at(page, 'tue', 12, 0);
  await page.evaluate(() => { PixelPets.state.flags['daily.warm_bowl'] = '2000-01-01'; });
  await stand(page, 'route1', 'r1_waymark_l');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe('Oatcakes in a cloth, still warm.');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.optionsReady === true);
  const labels = await page.locator('#shopList .shop-name').allTextContents();
  expect(labels).toEqual(['Waymark Oatcake']);
  if (page.viewportSize().width === 390) {
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: SHOTS + '/p4_snack_menu_390.png' });
  }
  const prompts = await playScene(page, ['Waymark Oatcake (30)']);
  expect(prompts).toEqual(['What will they eat?']);
  const ate = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { hunger: p.hunger, happy: p.happy, money: PixelPets.state.money, text: PixelPets.scene && PixelPets.scene.text };
  });
  expect(ate.hunger).toBeGreaterThan(40);
  expect(ate.happy).toBeGreaterThan(40);
  expect(ate.money).toBe(70);
  expect(ate.text).toBeFalsy();

  await page.evaluate(() => { PixelPets.state.party[0].hunger = 99; });
  await stand(page, 'route1', 'r1_waymark_l');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.optionsReady === true);
  await page.locator('#shopList .shop-row', { has: page.locator('.shop-name', { hasText: 'Waymark Oatcake' }) }).locator('.shop-buy').click();
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full && PixelPets.scene.text === 'Too full.');
  const full = await page.evaluate(() => ({
    hunger: PixelPets.state.party[0].hunger,
    money: PixelPets.state.money,
    text: PixelPets.scene.text,
  }));
  expect(full.hunger).toBeGreaterThan(98);
  expect(full.money).toBe(70);
  expect(full.text).toBe('Too full.');
  await playScene(page, []);

  await stand(page, 'hm_diner', 'hm_hesper');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.optionsReady === true);
  const diner = await page.locator('#shopList .shop-name').allTextContents();
  expect(diner).toContain('Warm Bowl');
  await page.evaluate(() => PixelPets.endScene());
});

test('Farmer Tibbet stands by the honesty box at dawn, and the box sells at noon @w1', async ({ page }) => {
  await boot(page);
  await at(page, 'tue', 6, 0);
  await stand(page, 'proto', 'om_tibbet');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe('Restocking at first light. The box is open all day.');
  await playScene(page, []);

  await at(page, 'tue', 12, 0);
  const noon = await page.evaluate(() => {
    PixelPets.goto('proto', 5, 10, 'up');
    return PixelPets.mapInfo.objs.some(o => o.id === 'om_tibbet');
  });
  expect(noon).toBe(false);
  await stand(page, 'proto', 'om_honesty_l');
  await page.keyboard.press('Space');
  await expect(page.locator('#ovShop')).toBeVisible();
  expect(await page.locator('#shopTitle').textContent()).toBe('Meadow Honesty Box');
  const ids = await page.locator('.shop-row').evaluateAll(list => list.map(r => r.dataset.id));
  expect(ids).toEqual(['joy_crumb', 'soft_berry', 'clover_crown']);
  const before = await page.evaluate(() => PixelPets.state.money);
  await page.locator('.shop-row[data-id="joy_crumb"] .shop-buy').click();
  const after = await page.evaluate(() => ({
    money: PixelPets.state.money,
    n: PixelPets.state.bag.joy_crumb || 0,
    v: PixelPets.state.v,
  }));
  expect(after.n).toBe(1);
  expect(after.money).toBe(before - 40);
  expect(after.v).toBe(2);
});

test('Kit, Odile, Watch Ivo, Imogen and the Old Miner keep their lines @w1', async ({ page }) => {
  await boot(page);
  await at(page, 'tue', 12, 0);
  const people = [
    ['fb_heights', 'ht_kit', 'Stock up before you go in. Heal Snacks. A Wake Tonic if a friend gets worn out.'],
    ['fernbrook', 'odile', "Fen's trees look brighter today."],
    ['route2', 'r2_watch', 'Citizen. Stay on the path if you can.'],
    ['route2_glen', 'r2_lead', 'Hm. Not the outcome I forecast, Tester.'],
    ['cobblecrest', 'cc_miner', 'Forty years Hale and I dug side by side. The Pebblits always showed us where to swing.'],
  ];
  for (const [map, id, line] of people) {
    await stand(page, map, id);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
    const got = await page.evaluate(() => ({
      text: PixelPets.scene.text,
      shop: document.getElementById('ovShop').hidden,
    }));
    expect(got.shop, id).toBe(true);
    expect(got.text, id).toBe(line);
    await page.evaluate(() => PixelPets.endScene());
    await page.waitForFunction(() => !PixelPets.scene);
  }
});
