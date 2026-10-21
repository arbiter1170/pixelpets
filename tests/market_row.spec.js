/* WORLD_CLOCK_TOWN P2. Hearthmoor grows to 24x34. Market Row: the store, the wardrobe, the diner, the court.
   Save v stays 2. Wardrobe buying is P3. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

function save(extra) {
  const s = starterSave();
  s.settings.follower = false;
  s.money = 200;
  s.flags['story.lizzy_met'] = true;
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

async function face(page, map, x, y, facing) {
  await page.evaluate(({ map, x, y, facing }) => PixelPets.goto(map, x, y, facing), { map, x, y, facing });
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  return page.evaluate(() => ({ id: PixelPets.scene.id, text: PixelPets.scene.text, who: PixelPets.scene.who }));
}

test('the row opens south and the three rooms use the wall kit', async ({ page }) => {
  await boot(page);
  const report = await page.evaluate(() => {
    const patch = MAPDATA.detail_zz_market.slicePatch.maps.hearthmoor;
    const keys = Object.keys(patch.gridRows).map(Number).sort((a, b) => a - b);
    const north = MAPDATA.maps_slice.maps.hearthmoor.grid[8];
    PixelPets.goto('hearthmoor', 9, 22, 'down');
    const row = [];
    for (let x = 0; x < 24; x++) row.push(PixelPets.tileInfo(x, 23).ch);
    const shares = ['hm_store', 'hm_wardrobe', 'hm_diner'].map(id => {
      const s = PixelPets.floorShare(id);
      return { id, tile: s && s.tile, share: s && s.share };
    });
    const walls = ['house_store', 'house_wardrobe', 'house_diner'].map(id => {
      const w = HOUSE_SKINS[id].wall;
      return { id, c: w.c, f: w.f, k: Object.values(w).indexOf('k') >= 0 };
    });
    const ward = MAPDATA.detail_zz_market.maps.hm_wardrobe.objs;
    return {
      h: PixelPets.goto('hearthmoor', 9, 28, 'up') && PixelPets.mapInfo.h,
      w: PixelPets.mapInfo.w,
      keys,
      row: row.join(''),
      north,
      lane: PixelPets.tileInfo(9, 8).ch,
      shares,
      walls,
      shop: ward.some(o => o.shop),
      wear: ward.some(o => o.wear || o.wardrobe),
      v: PixelPets.state.v,
      size: PPSave.MAP_SIZE.hearthmoor,
    };
  });
  expect(report.h).toBe(34);
  expect(report.w).toBe(24);
  expect(report.keys).toEqual([23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33]);
  expect(report.row).toBe('TTTTTTTTTppTTTTTTTTTTTTT');
  expect(report.lane).toBe('p');
  expect(report.north[9]).toBe('p');
  for (const row of report.shares) expect(row.share, row.id + ' ' + row.tile).toBeLessThanOrEqual(0.7);
  for (const wall of report.walls) {
    expect(wall.c, wall.id).not.toBe(wall.f);
    expect(wall.k, wall.id).toBe(false);
  }
  expect(report.shop).toBe(false);
  expect(report.wear).toBe(true);
  expect(report.size).toEqual([24, 34]);
  expect(report.v).toBe(2);
});

test('the store sells the usual snacks, and the night clerk takes the counter', async ({ page }) => {
  await boot(page);
  await at(page, 'tue', 12, 0);
  const day = await page.evaluate(() => {
    PixelPets.goto('hm_store', 2, 4, 'up');
    const clerk = MAPDATA.detail_zz_market.maps.hm_store.objs.find(o => o.id === 'hm_teague');
    return {
      ids: PixelPets.mapInfo.objs.map(o => o.id),
      name: clerk && clerk.name,
      look: clerk && clerk.look,
      slot: MAPDATA.detail_zz_market.friendSlots.STORE_CLERK,
    };
  });
  expect(day.ids).toContain('hm_teague');
  expect(day.ids).not.toContain('hm_quill');
  expect(day.name).toBe('Keeper Teague');
  expect(day.look).toBe('hm_teague');
  expect(day.slot).toBe('Keeper Teague / Keeper Quill');
  await page.keyboard.press('Space');
  await expect(page.locator('#ovShop')).toBeVisible();
  expect(await page.locator('#shopTitle').textContent()).toBe('Lamplight Provisions');
  expect(await page.locator('#shopFlavour').textContent()).toBe('Lantern stays lit. What do you need?');
  const before = await page.evaluate(() => ({ money: PixelPets.state.money, n: PixelPets.state.bag.heal_snack || 0 }));
  await page.locator('.shop-row[data-id="heal_snack"] .shop-buy').click();
  const after = await page.evaluate(() => ({ money: PixelPets.state.money, n: PixelPets.state.bag.heal_snack || 0, v: PixelPets.state.v }));
  expect(after.n).toBe(before.n + 1);
  expect(after.money).toBe(before.money - 50);
  expect(after.v).toBe(2);
  await page.locator('#shopClose').click();
  await expect(page.locator('#ovShop')).toBeHidden();

  await at(page, 'sun', 21, 0);
  const night = await page.evaluate(() => {
    PixelPets.goto('hm_store', 3, 4, 'up');
    return PixelPets.mapInfo.objs.map(o => o.id);
  });
  expect(night).toContain('hm_quill');
  expect(night).not.toContain('hm_teague');
});

test('Marigold opens Stitch & Lantern after her line', async ({ page }) => {
  await boot(page);
  const line = await face(page, 'hm_wardrobe', 9, 3, 'up');
  expect(line.text).toBe('Stitch & Lantern. Try anything on. Your Walkling too.');
  await page.keyboard.press('Space');
  await page.waitForSelector('#ovWardrobe:not([hidden])');
  await expect(page.locator('#wardTitle')).toHaveText('STITCH & LANTERN');
  const shop = await page.evaluate(() => document.getElementById('ovShop').hidden);
  expect(shop).toBe(true);
  await page.locator('#wardDone').click();
  await expect(page.locator('#ovWardrobe')).toBeHidden();
});

test('the diner serves priced meals, refuses a full Walkling, and keeps the Warm Bowl', async ({ page }) => {
  const s = save();
  s.party[0].hunger = 20;
  s.money = 100;
  await boot(page, s);
  await at(page, 'tue', 12, 0);
  const greet = await face(page, 'hm_diner', 4, 2, 'left');
  expect(greet.text).toBe('Sit anywhere. The stew is always on.');
  const prompts = await playScene(page, ['Coach Stew (30)']);
  expect(prompts).toEqual(['What will they eat?']);
  const ate = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { hunger: p.hunger, money: PixelPets.state.money, text: PixelPets.scene && PixelPets.scene.text };
  });
  expect(ate.hunger).toBeCloseTo(50, 3);
  expect(ate.money).toBe(70);

  await page.evaluate(() => { PixelPets.state.party[0].hunger = 99; });
  const full = await face(page, 'hm_diner', 4, 2, 'left');
  expect(full.text).toBe('Sit anywhere. The stew is always on.');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.optionsReady === true);
  await page.locator('#sbChoices button', { hasText: 'Berry Stack (40)' }).click();
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full && PixelPets.scene.text === 'Too full.');
  const held = await page.evaluate(() => ({
    hunger: PixelPets.state.party[0].hunger,
    money: PixelPets.state.money,
    text: PixelPets.scene.text,
  }));
  expect(held.hunger).toBeGreaterThan(98);
  expect(held.money).toBe(70);
  expect(held.text).toBe('Too full.');
  await playScene(page, []);

  await page.evaluate(() => { PixelPets.state.money = 0; PixelPets.state.party[0].hunger = 40; });
  await face(page, 'hm_diner', 4, 2, 'left');
  await playScene(page, ['Hearth Plate (70)']);
  const broke = await page.evaluate(() => ({
    hunger: PixelPets.state.party[0].hunger,
    money: PixelPets.state.money,
    toast: document.getElementById('toast').textContent,
    scene: PixelPets.scene,
  }));
  expect(broke.hunger).toBeCloseTo(40, 1);
  expect(broke.money).toBe(0);
  expect(broke.toast).toBe('Not enough Acorns.');
  expect(broke.scene).toBeFalsy();

  const bowl = save();
  bowl.party[0].hunger = 40;
  bowl.money = 10;
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  bowl.flags['daily.hello'] = today;
  bowl.flags['daily.warm_bowl'] = '2000-01-01';
  await page.context().clearCookies();
  await installSave(page.context(), bowl);
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await at(page, 'tue', 12, 0);
  await face(page, 'hm_diner', 4, 2, 'left');
  const bowlPrompts = await playScene(page, ['Warm Bowl']);
  expect(bowlPrompts).toEqual(['What will they eat?']);
  const fed = await page.evaluate(() => ({
    hunger: PixelPets.state.party[0].hunger,
    money: PixelPets.state.money,
    flag: PixelPets.state.flags['daily.warm_bowl'],
    v: PixelPets.state.v,
  }));
  expect(fed.hunger).toBeCloseTo(55, 1);
  expect(fed.money).toBe(10);
  expect(fed.flag).toBe(today);
  expect(fed.v).toBe(2);
});

test('the court shot is a line, and the schedules land on the row', async ({ page }) => {
  await boot(page);
  await at(page, 'sat', 10, 0);
  const shot = await face(page, 'hearthmoor', 12, 31, 'up');
  expect(shot.text).toBe('Take a shot. The hoop lantern flares.');
  await playScene(page, []);
  const cast = await page.evaluate(() => ({
    liz: PixelPets.clock.place('Lizzy'),
    pip: PixelPets.clock.place('Pip'),
    scene: PixelPets.scene,
    v: PixelPets.state.v,
  }));
  expect(cast.liz).toMatchObject({ map: 'hearthmoor', x: 14, y: 31, id: 'court_lizzy' });
  expect(cast.pip).toBe(null);
  expect(cast.scene).toBeFalsy();
  expect(cast.v).toBe(2);

  await at(page, 'tue', 16, 0);
  const after = await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 16, 32, 'up');
    const objs = PixelPets.mapInfo.objs;
    const file = MAPDATA.detail_zz_market;
    const looks = file.looks;
    const worn = {};
    for (const m of Object.values(file.maps || {})) {
      for (const o of m.objs || []) if (o.look) worn[o.id] = o.look;
    }
    const added = file.slicePatch && file.slicePatch.maps && file.slicePatch.maps.hearthmoor;
    for (const o of (added && added.addObjs) || []) if (o.look) worn[o.id] = o.look;
    return {
      pip: PixelPets.clock.place('Pip'),
      wren: PixelPets.clock.place('Wren'),
      onMap: {
        pip: objs.find(o => o.id === 'court_pip'),
        wren: objs.find(o => o.id === 'court_wren'),
      },
      keys: Object.keys(looks).filter(k => !k.startsWith('_')).sort(),
      worn,
    };
  });
  expect(after.pip).toMatchObject({ map: 'hearthmoor', x: 16, y: 31, id: 'court_pip' });
  expect(after.wren).toMatchObject({ map: 'hearthmoor', x: 17, y: 31, id: 'court_wren' });
  expect(after.onMap.pip).toMatchObject({ x: 16, y: 31 });
  expect(after.onMap.wren).toMatchObject({ x: 17, y: 31 });
  expect(after.onMap.pip.x + ',' + after.onMap.pip.y).not.toBe(after.onMap.wren.x + ',' + after.onMap.wren.y);
  expect(after.keys).toEqual([
    'hm_arlo', 'hm_court_regular', 'hm_diner_regular', 'hm_hesper', 'hm_marigold', 'hm_quill', 'hm_teague',
  ]);
  expect(after.worn).toMatchObject({
    hm_teague: 'hm_teague', hm_quill: 'hm_quill', hm_marigold: 'hm_marigold', hm_hesper: 'hm_hesper',
    diner_regular: 'hm_diner_regular', hm_arlo: 'hm_arlo', court_regular: 'hm_court_regular',
  });

  await at(page, 'tue', 12, 0);
  const lunch = await page.evaluate(() => {
    PixelPets.goto('hm_diner', 5, 6, 'up');
    const diner = PixelPets.mapInfo.objs.map(o => o.id);
    PixelPets.goto('hearthmoor', 2, 8, 'down');
    const town = PixelPets.mapInfo.objs.map(o => o.id);
    return { diner, town };
  });
  expect(lunch.diner).toContain('diner_bren');
  expect(lunch.town).not.toContain('hm_patrol');

  await at(page, 'sun', 23, 30);
  const closed = await face(page, 'hm_diner', 3, 3, 'up');
  expect(closed.text).toBe('Opens at 5. The stew stays on.');
});
