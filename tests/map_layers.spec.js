/* MAP_LAYERS acceptance 1-13 and 17. ROOM and TOWN are generated. REGION draws the backdrop unless the flag is forced off. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const PX = Object.fromEntries('hearthmoor:15,13,10;route1:7,7,6;fernbrook:11,11,9;proto:15,15,12;route2:7,7,6;route2_glen:15,15,12;hm_home_in:24,24,24;hm_home_up:24,24,24;hm_lodge_in:24,24,24;hm_lantern_in:24,24,24;hm_rook_in:24,24,24;cobblecrest:11,11,9;cobble_quarry:11,11,9;cc_lantern_in:24,24,24;cc_hall_in:24,24,24;mahopac:16,16,15;mahopac_obs:24,24,24;dream_2004:24,24,23;dream_party:24,24,24;dream_drive:24,24,24;highcharity:5,5,4;hc_airport_in:24,24,24;hc_command_in:24,24,24;hc_barracks_in:24,24,24;hc_marina_in:24,24,24;hc_school_in:24,24,24;hc_bank_in:24,24,24;hc_gym_in:24,24,24;hc_lantern_in:24,24,24;hc_church_in:24,24,24;hc_hall_in:24,24,24;hc_arena_in:24,24,24;hc_apt_in:24,24,24;hc_mall_1:24,24,24;hc_mall_2:24,24,24;fb_heights:15,15,12;rx_f1:24,17,13;rx_f2:24,17,13;rx_f3:24,17,13;rx_f4:24,17,13;sm_yard:21,20,17;sm_tunnel:21,20,17;sm_hold:21,20,17;sm_den:21,20,17;hm_hq_f1:24,24,18;hm_hq_f2:24,24,21;hm_school_in:23,22,19;hm_flats_lobby:24,24,24;hm_flats_5:21,20,17;fb_lantern_in:24,24,21;fb_hall_in:23,18,14'.split(';').map((row) => {
  const [id, nums] = row.split(':');
  const [a, b, c] = nums.split(',').map(Number);
  return [id, { 390: a, 375: b, 320: c }];
}));

function walked(extra, world) {
  const save = starterSave();
  Object.assign(save.flags, extra || {});
  save.world = world || { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' };
  return save;
}

async function boot(page, save, search) {
  await installSave(page.context(), save || walked(), { quietDay: true });
  await gotoGame(page, search || '');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#mapBtn').classList.contains('off'));
}

async function openMap(page) {
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.waitForFunction(() => PixelPets.mapLayer() && PixelPets.mapLayer().level);
}

async function sample(page, x, y) {
  return page.evaluate(({ x, y }) => {
    const c = document.querySelector('#regionCanvas'), g = c.getContext('2d');
    const layer = PixelPets.mapLayer();
    const logicalW = !layer || layer.level === 'region' ? 320 : c.getBoundingClientRect().width;
    const k = c.width / logicalW;
    const d = g.getImageData(Math.max(0, Math.floor((x + 0.5) * k)), Math.max(0, Math.floor((y + 0.5) * k)), 1, 1).data;
    return [d[0], d[1], d[2]];
  }, { x, y });
}

function near(rgb, hex) {
  const n = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  return rgb.every((v, i) => Math.abs(v - n[i]) <= 2);
}

test('acceptance 1: outdoors opens on TOWN, ROOM is denied, REGION draws the backdrop', async ({ page }) => {
  await boot(page);
  await openMap(page);
  const town = await page.evaluate(() => PixelPets.mapLayer());
  expect(town.level).toBe('town');
  expect(town.shown).toBe('hearthmoor');
  expect(town.title).toBe('HEARTHMOOR');
  expect(town.blurb).toBe('Hill village of the Keepers. Home.');
  expect(town.roomOff).toBe(true);
  expect(town.backdrop).toBe(true);
  const room = page.locator('#mapLevelRoom');
  expect(await room.getAttribute('aria-disabled')).toBe('true');
  expect(await room.getAttribute('disabled')).toBeNull();
  await expect(room).toHaveCSS('height', '44px');
  const before = town.denies;
  await room.click({ force: true });
  const stayed = await page.evaluate(() => PixelPets.mapLayer());
  expect(stayed.level).toBe('town');
  expect(stayed.denies).toBe(before + 1);
  expect(await page.evaluate(() => PixelPets.setRegionBackdrop(true))).toBe(false);
  await page.locator('#mapLevelRegion').click();
  await page.waitForFunction(() => PixelPets.mapLayer().level === 'region');
  await page.waitForFunction(() => {
    const c = document.querySelector('#regionCanvas');
    if (!c) return false;
    const g = c.getContext('2d'), k = c.width / 320;
    const d = g.getImageData(Math.floor(150.5 * k), Math.floor(30.5 * k), 1, 1).data;
    return d[0] === 0x2f && d[1] === 0x5a && d[2] === 0x3e;
  });
  const hill = await sample(page, 150, 30);
  const field = await sample(page, 70, 4);
  expect(near(hill, '#2f5a3e'), 'backdrop ' + hill).toBe(true);
  expect(near(field, '#2f5a3e'), 'backdrop ' + field).toBe(true);
  expect(await page.locator('#mapPlaceName').textContent()).toBe('HEARTHMOOR');
});

test('acceptance 2 and 9: home ROOM, town door ring, SEE INSIDE only after entering', async ({ page }) => {
  await boot(page, walked(), '?debug=1');
  await page.evaluate(() => PixelPets.goto('hm_home_in', 4, 6, 'up'));
  await openMap(page);
  const room = await page.evaluate(() => PixelPets.mapLayer());
  expect(room.level).toBe('room');
  expect(room.shown).toBe('hm_home_in');
  expect(room.ways).toEqual(expect.arrayContaining([
    expect.objectContaining({ tag: 'OUT', x: 4, y: 7 }),
    expect.objectContaining({ tag: 'UP', x: 1, y: 5 }),
  ]));
  expect(room.you).toEqual({ x: 4, y: 6 });
  await page.locator('#mapLevelTown').click();
  const town = await page.evaluate(() => PixelPets.mapLayer());
  expect(town.level).toBe('town');
  expect(town.shown).toBe('hearthmoor');
  const home = town.buildings.find((b) => b.label === 'YOUR HOME');
  expect(home.xy).toEqual([3, 5]);
  expect(home.entered).toBe(true);
  expect(town.you).toEqual({ x: 3, y: 5 });
  const school = town.buildings.find((b) => b.label === 'SCHOOLHOUSE');
  expect(school.entered).toBe(false);
  await page.evaluate((hit) => {
    const c = document.querySelector('#regionCanvas');
    const r = c.getBoundingClientRect();
    const p = PixelPets.mapLayer().px;
    c.dispatchEvent(new MouseEvent('click', { clientX: r.left + (hit.xy[0] + 0.5) * p, clientY: r.top + (hit.xy[1] + 0.5) * p, bubbles: true }));
  }, school);
  const locked = await page.evaluate(() => PixelPets.mapLayer());
  expect(locked.blurb).toBe('Not been inside yet.');
  expect(locked.see).toBe(false);
  await page.evaluate((hit) => {
    const c = document.querySelector('#regionCanvas');
    const r = c.getBoundingClientRect();
    const p = PixelPets.mapLayer().px;
    c.dispatchEvent(new MouseEvent('click', { clientX: r.left + (hit.xy[0] + 0.5) * p, clientY: r.top + (hit.xy[1] + 0.5) * p, bubbles: true }));
  }, home);
  const inside = await page.evaluate(() => PixelPets.mapLayer());
  expect(inside.seeLabel).toBe('SEE INSIDE');
  await page.locator('#mapSee').click();
  const backIn = await page.evaluate(() => PixelPets.mapLayer());
  expect(backIn.level).toBe('room');
  expect(backIn.shown).toBe('hm_home_in');
});

test('acceptance 3: SHOW ON MAP opens REGION @w1', async ({ page }) => {
  await boot(page);
  await page.locator('#questBtn').click();
  await page.waitForSelector('#ovQuest:not([hidden])');
  await page.waitForFunction(() => PixelPets.optionsReady === true);
  await page.locator('#questMap').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.waitForFunction(() => PixelPets.mapLayer().level === 'region');
  expect(await page.evaluate(() => PixelPets.mapLayer().level)).toBe('region');
});

test('acceptance 4 and 5: flats sections and fogged floor that sticks @w1', async ({ page }) => {
  await boot(page, walked({}, { map: 'hm_hq_f1', x: 6, y: 13, facing: 'up', respawn: 'hearthmoor' }), '?debug=1');
  await openMap(page);
  const f1 = await page.evaluate(() => PixelPets.mapLayer());
  expect(f1.shown).toBe('hm_hq_f1');
  expect(f1.chips.map((c) => c.label)).toEqual(['F1', '???']);
  expect(f1.ways).toEqual(expect.arrayContaining([
    expect.objectContaining({ tag: 'OUT', x: 6, y: 15 }),
    expect.objectContaining({ tag: 'UP', x: 12, y: 3 }),
  ]));
  await page.evaluate(() => { PixelPets.state.floorSeen.hm_flats_lobby = 1; PixelPets.goto('hm_flats_5', 2, 6, 'down'); });
  await page.locator('#mapClose').click();
  await openMap(page);
  const flats = await page.evaluate(() => PixelPets.mapLayer());
  expect(flats.shown).toBe('hm_flats_5');
  expect(flats.openings).toBe(9);
  expect(flats.sections).toEqual(['KITCHEN', 'BATH', 'LIZZY', 'HALL', 'OSSABELL', 'MARILOU', 'CALEB']);
  expect(flats.ways).toEqual([expect.objectContaining({ tag: 'LIFT', x: 0, y: 6 })]);
  expect(flats.chips.map((c) => c.label)).toEqual(['LOBBY', '5B']);
  expect(flats.title).toBe('AMBERHILL FLATS, 5B');
  await page.evaluate(() => PixelPets.goto('hm_hq_f2', 10, 4, 'down'));
  await page.locator('#mapClose').click();
  await openMap(page);
  expect((await page.evaluate(() => PixelPets.mapLayer())).chips.map((c) => c.label)).toEqual(['F1', 'F2']);
  const raw = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  expect(JSON.parse(raw).v).toBe(2);
  expect(JSON.parse(raw).floorSeen.hm_hq_f2).toBe(1);
  await page.context().addInitScript((save) => { localStorage.setItem('pixelpets.save.v2', save); }, raw);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.BUILD);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#mapBtn').classList.contains('off'));
  await openMap(page);
  const again = await page.evaluate(() => PixelPets.mapLayer());
  expect(again.chips.map((c) => c.label)).toEqual(['F1', 'F2']);
  expect(again.fog).toBe(false);
});

test('acceptance 6 and 7: grey roof keeps its name, and an unvisited exit reads ???', async ({ page }) => {
  await boot(page, walked(), '?debug=1');
  await openMap(page);
  const before = await page.evaluate(() => {
    const layer = PixelPets.mapLayer();
    const home = layer.buildings.find((b) => b.label === 'YOUR HOME');
    const c = document.querySelector('#regionCanvas'), g = c.getContext('2d');
    const scale = c.width / c.getBoundingClientRect().width;
    const p = layer.px;
    const [x0, y0, x1, y1] = home.rect;
    let m = 0, r = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = g.getImageData(Math.floor((x + 0.5) * p * scale), Math.floor((y + 0.5) * p * scale), 1, 1).data;
      if (d[0] === 0x56 && d[1] === 0x6c && d[2] === 0x86) m++;
      if (d[0] === 0xb1 && d[1] === 0x3e && d[2] === 0x53) r++;
    }
    const exit = layer.exits.find((e) => e.label === 'ROUTE 1');
    return { label: home.label, entered: home.entered, m, r, exit: exit && exit.shown };
  });
  expect(before.label).toBe('YOUR HOME');
  expect(before.entered).toBe(false);
  expect(before.m).toBeGreaterThan(0);
  expect(before.r).toBe(0);
  expect(before.exit).toBe('???');
  await page.evaluate(() => { PixelPets.state.mapSeen.route1 = 1; PixelPets.goto('hm_home_in', 4, 6, 'up'); });
  await page.locator('#mapClose').click();
  await openMap(page);
  await page.locator('#mapLevelTown').click();
  const after = await page.evaluate(() => {
    const layer = PixelPets.mapLayer();
    const home = layer.buildings.find((b) => b.label === 'YOUR HOME');
    const c = document.querySelector('#regionCanvas'), g = c.getContext('2d');
    const scale = c.width / c.getBoundingClientRect().width;
    const p = layer.px;
    const [x0, y0, x1, y1] = home.rect;
    let m = 0, r = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = g.getImageData(Math.floor((x + 0.5) * p * scale), Math.floor((y + 0.5) * p * scale), 1, 1).data;
      if (d[0] === 0x56 && d[1] === 0x6c && d[2] === 0x86) m++;
      if (d[0] === 0xb1 && d[1] === 0x3e && d[2] === 0x53) r++;
    }
    return { entered: home.entered, m, r, exit: layer.exits.find((e) => e.label === 'ROUTE 1').shown };
  });
  expect(after.entered).toBe(true);
  expect(after.r).toBeGreaterThan(0);
  expect(after.exit).toBe('ROUTE 1');
});

test('acceptance 8: SEE MAP opens a visited town and BACK TO ME returns', async ({ page }) => {
  await boot(page, walked({ 'story.reached_fernbrook': true }));
  await openMap(page);
  await page.locator('#mapLevelRegion').click();
  const box = await page.locator('#regionCanvas').boundingBox();
  await page.mouse.click(box.x + (168 / 320) * box.width, box.y + (104 / 192) * box.height);
  await expect(page.locator('#mapSee')).toHaveText('SEE MAP');
  await page.locator('#mapSee').click();
  const town = await page.evaluate(() => PixelPets.mapLayer());
  expect(town.level).toBe('town');
  expect(town.shown).toBe('fernbrook');
  expect(town.you).toBeNull();
  expect(town.back).toBe(true);
  await page.locator('#mapBack').click();
  const home = await page.evaluate(() => PixelPets.mapLayer());
  expect(home.level).toBe('town');
  expect(home.shown).toBe('hearthmoor');
  expect(home.you).toEqual({ x: 8, y: 8 });
  await page.locator('#mapLevelRegion').click();
  await page.mouse.click(box.x + (40 / 320) * box.width, box.y + (56 / 192) * box.height);
  const hidden = await page.evaluate(() => PixelPets.mapLayer());
  expect(hidden.level).toBe('region');
  expect(hidden.name).toBe('???');
  expect(hidden.see).toBe(false);
});

test('acceptance 10 and 11: the you-ring blinks, and the quest tile is marked', async ({ page }) => {
  await boot(page, walked(), '?debug=1');
  await openMap(page);
  const blink = await page.evaluate(() => {
    const blue = () => {
      const c = document.querySelector('#regionCanvas'), g = c.getContext('2d');
      const img = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < img.length; i += 4) if (img[i] === 0x3b && img[i + 1] === 0x5d && img[i + 2] === 0xc9) n++;
      return n;
    };
    PixelPets.mapBlinkAt(performance.now());
    const on = blue();
    PixelPets.mapBlinkAt(performance.now() - 600);
    const off = blue();
    return { on, off, quest: PixelPets.mapLayer().quest, target: PixelPets.quest && PixelPets.quest.target };
  });
  expect(blink.on).toBeGreaterThan(0);
  expect(blink.off).toBe(0);
  expect(blink.target && blink.target.map).toBe('hearthmoor');
  expect(blink.quest).toEqual({ x: blink.target.x, y: blink.target.y });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const steady = await page.evaluate(() => {
    const blue = () => {
      const c = document.querySelector('#regionCanvas'), g = c.getContext('2d');
      const img = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < img.length; i += 4) if (img[i] === 0x3b && img[i + 1] === 0x5d && img[i + 2] === 0xc9) n++;
      return n;
    };
    PixelPets.mapBlinkAt(performance.now() - 600);
    return blue();
  });
  expect(steady).toBeGreaterThan(0);
});

test('acceptance 12 and 13: no pan, and every layout fits with the spec tile size', async ({ page }) => {
  await boot(page, walked(), '?debug=1');
  await openMap(page);
  const width = page.viewportSize().width;
  const key = String(width);
  const px = await page.evaluate(() => {
    const out = {};
    ['hearthmoor', 'hm_home_in', 'hm_flats_5', 'hm_hq_f1', 'highcharity', 'fb_hall_in', 'hc_gym_in'].forEach((id) => { out[id] = PixelPets.mapTilePx(id); });
    const all = {};
    const ids = Object.keys(PixelPets.mapTilePx('hearthmoor') ? {} : {});
    return out;
  });
  for (const id of Object.keys(px)) expect(px[id][key]).toBe(PX[id][key]);
  const all = await page.evaluate((table) => {
    const bad = [];
    Object.keys(table).forEach((id) => {
      const got = PixelPets.mapTilePx(id);
      if (!got || got['390'] !== table[id]['390'] || got['375'] !== table[id]['375'] || got['320'] !== table[id]['320']) bad.push(id);
    });
    return bad;
  }, PX);
  expect(all).toEqual([]);
  const before = await page.evaluate(() => document.querySelector('.map-inner').scrollTop);
  await page.locator('#regionCanvas').hover();
  await page.mouse.wheel(0, 240);
  expect(await page.evaluate(() => document.querySelector('.map-inner').scrollTop)).toBe(before);
  for (const [level, id] of [['town', 'highcharity'], ['town', 'hearthmoor'], ['room', 'fb_hall_in'], ['room', 'hm_flats_5']]) {
    await page.evaluate(([lv, mid]) => PixelPets.previewMap(lv, mid), [level, id]);
    const fit = await page.evaluate(() => {
      const H = window.innerHeight, W = window.innerWidth;
      const nodes = ['#mapClose', '#mapLevelRoom', '#mapLevelTown', '#mapLevelRegion', '#regionCanvas', '.map-place'];
      return nodes.map((sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return { sel, ok: r.width > 0 && r.top >= -1 && r.bottom <= H + 1 && r.left >= -1 && r.right <= W + 1, h: r.height };
      });
    });
    for (const row of fit) {
      expect(row.ok, id + ' ' + row.sel).toBe(true);
      if (row.sel !== '#regionCanvas' && row.sel !== '.map-place') expect(row.h).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => PixelPets.mapLayer().px)).toBe(PX[id][key]);
  }
});

function hitBox(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

test('edge rings stay clear of the LIFT tag and the east exit label @w1', async ({ page }) => {
  await boot(page, walked(), '?debug=1');
  await page.evaluate(() => PixelPets.goto('hm_flats_5', 0, 6, 'right'));
  await openMap(page);
  await page.evaluate(() => PixelPets.mapBlinkAt(performance.now()));
  const room = await page.evaluate(() => {
    const layer = PixelPets.mapLayer();
    return { level: layer.level, shown: layer.shown, you: layer.you, quest: layer.quest, labels: layer.labels, rings: layer.rings };
  });
  expect(room.level).toBe('room');
  expect(room.shown).toBe('hm_flats_5');
  expect(room.you).toEqual({ x: 0, y: 6 });
  expect(room.quest).toEqual({ x: 0, y: 6 });
  const lift = room.labels.find((l) => l.text === 'LIFT');
  expect(lift).toBeTruthy();
  expect(room.rings.map((r) => r.kind)).toEqual(expect.arrayContaining(['you', 'quest']));
  for (const ring of room.rings) expect(hitBox(lift, ring), ring.kind + ' ' + JSON.stringify({ lift, ring })).toBe(false);

  await page.evaluate(() => PixelPets.goto('hearthmoor', 23, 8, 'left'));
  await page.locator('#mapClose').click();
  await openMap(page);
  await page.evaluate(() => PixelPets.mapBlinkAt(performance.now()));
  const town = await page.evaluate(() => {
    const layer = PixelPets.mapLayer();
    return {
      level: layer.level, shown: layer.shown, you: layer.you, quest: layer.quest,
      labels: layer.labels, rings: layer.rings,
      exit: layer.exits.find((e) => e.edge === 'east'),
    };
  });
  expect(town.level).toBe('town');
  expect(town.shown).toBe('hearthmoor');
  expect(town.you).toEqual({ x: 23, y: 8 });
  expect(town.quest).toEqual({ x: 22, y: 8 });
  expect(town.exit.shown).toBe('???');
  const east = town.labels.find((l) => l.text === '???' && l.edge === 'east');
  expect(east).toBeTruthy();
  expect(town.rings.map((r) => r.kind)).toEqual(expect.arrayContaining(['you', 'quest']));
  for (const ring of town.rings) expect(hitBox(east, ring), ring.kind + ' ' + JSON.stringify({ east, ring })).toBe(false);
});

test('acceptance 17: the backdrop is on, ??? stays, and the parchment returns when the flag is forced off', async ({ page }) => {
  await boot(page, walked(), '?debug=1');
  await page.waitForFunction(() => PixelPets.regionBackdropReady());
  await openMap(page);
  await page.locator('#mapLevelRegion').click();
  await page.waitForFunction(() => {
    const c = document.querySelector('#regionCanvas');
    if (!c) return false;
    const g = c.getContext('2d'), k = c.width / 320;
    const d = g.getImageData(Math.floor(150.5 * k), Math.floor(30.5 * k), 1, 1).data;
    return d[0] === 0x2f && d[1] === 0x5a && d[2] === 0x3e;
  });
  const on = await sample(page, 70, 4);
  expect(near(on, '#2f5a3e'), 'forest ' + on).toBe(true);
  expect(await page.evaluate(() => PixelPets.mapLayer().backdrop)).toBe(true);
  const box = await page.locator('#regionCanvas').boundingBox();
  await page.mouse.click(box.x + (40 / 320) * box.width, box.y + (56 / 192) * box.height);
  expect(await page.locator('#mapPlaceName').textContent()).toBe('???');
  expect(await page.evaluate(() => PixelPets.setRegionBackdrop(false))).toBe(true);
  const off = await sample(page, 150, 30);
  const field = await sample(page, 70, 4);
  expect(near(off, '#ef7d57'), 'parchment hill ' + off).toBe(true);
  expect(near(field, '#ffcd75'), 'parchment ' + field).toBe(true);
  expect(await page.evaluate(() => PixelPets.setRegionBackdrop(true))).toBe(true);
  await page.waitForFunction(() => {
    const c = document.querySelector('#regionCanvas');
    if (!c) return false;
    const g = c.getContext('2d'), k = c.width / 320;
    const d = g.getImageData(Math.floor(150.5 * k), Math.floor(30.5 * k), 1, 1).data;
    return d[0] === 0x2f && d[1] === 0x5a && d[2] === 0x3e;
  });
});
