/* STAIR_MARKER: flights, sills, glint, and the visited dim.
   Up openings are PAL.k across rows 0-2 (design d106bca); the tread edge and glint start at row 3. Down wells stay as specced. Save v stays 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const K = '#1a1c2c';
const W = '#f4f4f4';

const MARKS = [
  { map: 'hm_home_in', x: 1, y: 5, ch: '^', tile: 'stair_home', sprites: ['wayin_glint_up'] },
  { map: 'hm_home_up', x: 1, y: 5, ch: '^', tile: 'stair_loft', sprites: ['wayin_glint_down'] },
  { map: 'hm_hq_f1', x: 12, y: 3, ch: ';', sprites: ['step_up', 'wayin_glint_up'] },
  { map: 'hm_hq_f2', x: 10, y: 3, ch: 'i', sprites: ['step_down', 'wayin_glint_down'] },
  { map: 'hm_flats_lobby', x: 3, y: 2, ch: ',', sprites: ['door_step'] },
  { map: 'hm_flats_lobby', x: 4, y: 2, ch: ',', sprites: ['door_step'] },
  { map: 'hc_mall_1', x: 9, y: 5, ch: '.', ids: { hc_stair_art: 'step_up' }, sprites: ['step_up', 'wayin_glint_up'] },
  { map: 'hc_mall_2', x: 9, y: 5, ch: '.', ids: { hc_stair_art_up: 'step_down' }, sprites: ['step_down', 'wayin_glint_down'] },
  { map: 'rx_f1', x: 6, y: 2, ch: '^', tile: 'lab_stair', sprites: ['wayin_glint_up'] },
  { map: 'rx_f2', x: 6, y: 2, ch: '^', tile: 'lab_stair', sprites: ['wayin_glint_up'] },
  { map: 'rx_f2', x: 6, y: 20, ch: '.', sprites: ['step_down', 'wayin_glint_down'] },
  { map: 'rx_f3', x: 6, y: 2, ch: '^', tile: 'lab_stair', sprites: ['wayin_glint_up'] },
  { map: 'rx_f3', x: 6, y: 20, ch: '.', sprites: ['step_down', 'wayin_glint_down'] },
  { map: 'rx_f4', x: 6, y: 20, ch: '.', sprites: ['step_down', 'wayin_glint_down'] },
  { map: 'rx_f4', x: 7, y: 20, ch: '.', sprites: ['step_down', 'wayin_glint_down'] },
  { map: 'sm_tunnel', x: 9, y: 10, ch: '.', sprites: ['step_up', 'wayin_glint_up'] },
  { map: 'sm_yard', x: 9, y: 3, ch: '.', sprites: ['step_down', 'wayin_glint_down'] },
  { map: 'sm_hold', x: 14, y: 3, ch: '.', sprites: ['door_step'] },
  { map: 'sm_tunnel', x: 14, y: 3, ch: '.', sprites: ['door_step'] },
  { map: 'hearthmoor', x: 3, y: 5, ch: 'p', sprites: ['door_step'] },
  { map: 'hearthmoor', x: 20, y: 5, ch: 'p', sprites: ['door_step'] },
  { map: 'hearthmoor', x: 15, y: 6, ch: 'p', sprites: ['door_step'] },
  { map: 'hearthmoor', x: 11, y: 11, ch: 'g', sprites: ['door_step'] },
  { map: 'hearthmoor', x: 16, y: 13, ch: 'p', sprites: ['door_step'] },
  { map: 'hearthmoor', x: 4, y: 18, ch: 'g', sprites: ['door_step'] },
  { map: 'hearthmoor', x: 15, y: 18, ch: 'g', sprites: ['door_step'] },
  { map: 'cobblecrest', x: 5, y: 5, ch: 'p', sprites: ['door_step'] },
  { map: 'cobblecrest', x: 24, y: 6, ch: 'p', sprites: ['door_step'] },
  { map: 'fb_heights', x: 4, y: 5, ch: 'p', sprites: ['door_step'] },
  { map: 'fb_heights', x: 16, y: 5, ch: 'p', sprites: ['door_step'] },
  { map: 'fernbrook', x: 5, y: 5, ch: 'p', sprites: ['door_step'] },
  { map: 'fernbrook', x: 22, y: 6, ch: 'p', sprites: ['door_step'] },
  { map: 'highcharity', x: 32, y: 4, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 32, y: 9, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 52, y: 9, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 9, y: 11, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 22, y: 13, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 45, y: 15, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 18, y: 17, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 8, y: 25, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 11, y: 29, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 32, y: 29, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 49, y: 29, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 22, y: 34, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'highcharity', x: 55, y: 35, ch: 'P', sprites: ['door_step_warm'] },
  { map: 'mahopac', x: 5, y: 7, ch: 'p', sprites: ['door_step'] },
  { map: 'mahopac_obs', x: 4, y: 6, ch: 'm', tile: 'mat_dusk' },
];

function save() {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.music = false;
  return s;
}

async function boot(page) {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

test('marked tiles, black up-openings, glint, and floorSeen', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  const report = await page.evaluate(async (marks) => {
    const K = '#1a1c2c';
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const settle = () => new Promise((r) => {
      const tick = () => (PixelPets.fading ? requestAnimationFrame(tick) : requestAnimationFrame(() => requestAnimationFrame(r)));
      tick();
    });
    const hexOf = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map((n) => n.toString(16).padStart(2, '0')).join('');
    const sampleTile = (canvas) => {
      const d = canvas.getContext('2d').getImageData(0, 0, 16, 16).data;
      const colours = new Set();
      const rows = [];
      for (let y = 0; y < 16; y++) {
        let row = '';
        for (let x = 0; x < 16; x++) {
          const i = (y * 16 + x) * 4;
          if (!d[i + 3]) row += '.';
          else { const h = hexOf(d, i); colours.add(h); row += h === K ? 'k' : 'x'; }
        }
        rows.push(row);
      }
      return { rows, colours: [...colours] };
    };
    const cell = (tx, ty) => {
      const c = document.querySelector('#mapCanvas');
      const x0 = tx * 16 - PixelPets.walk.cam.x;
      const y0 = ty * 16 - PixelPets.walk.cam.y;
      if (x0 < 0 || y0 < 0 || x0 + 16 > c.width || y0 + 16 > c.height) return null;
      return c.getContext('2d').getImageData(x0, y0, 16, 16).data;
    };
    const T = buildTiles();
    const A = {};
    addExteriorArt(T, A);
    const pal = new Set(Object.values(PAL).map((c) => String(c).toLowerCase()));
    const art = {
      stair_home: sampleTile(T.stair_home),
      stair_loft: sampleTile(T.stair_loft),
      lab_stair: sampleTile(T.lab_stair),
      mat_dusk: sampleTile(T.mat_dusk),
      step_up: sampleTile(A.step_up),
      step_down: sampleTile(A.step_down),
      door_step: sampleTile(A.door_step),
      door_step_warm: sampleTile(A.door_step_warm),
    };
    const outside = [];
    for (const bag of Object.values(art)) for (const c of bag.colours) if (!pal.has(c)) outside.push(c);
    // Sample the home glint before any visit to the loft, or floorSeen would already hold it still.
    PixelPets.goto('hm_home_in', 4, 6, 'down');
    await settle();
    const home = [];
    const outsideGlint = [];
    let sawOn = false, sawOff = false;
    const first = cell(1, 5);
    for (let n = 0; n < 34; n++) {
      const d = cell(1, 5);
      if (!d) { home.push('offscreen'); break; }
      let on = false;
      for (let y = 4; y <= 4; y++) for (let x = 5; x <= 10; x++) {   // glint rows 3-4; row 3 is the white tread edge, so read the face row
        if (hexOf(d, (y * 16 + x) * 4) === '#f4f4f4') on = true;
      }
      if (on) sawOn = true; else sawOff = true;
      if (first) {
        for (let i = 0; i < 16 * 16; i++) {
          const y = Math.floor(i / 16), x = i % 16;
          if (y >= 3 && y <= 4 && x >= 5 && x <= 10) continue;
          if (d[i * 4] !== first[i * 4] || d[i * 4 + 1] !== first[i * 4 + 1] || d[i * 4 + 2] !== first[i * 4 + 2]) outsideGlint.push(i);
        }
      }
      home.push(on ? 1 : 0);
      await sleep(100);
    }
    const black = cell(1, 5);
    let opening = true, corners = true;
    if (black) {
      for (let y = 0; y <= 2; y++) for (let x = 2; x <= 13; x++) if (hexOf(black, (y * 16 + x) * 4) !== K) opening = false;
      for (const [x, y] of [[0, 0], [1, 0], [14, 0], [15, 0], [0, 1], [15, 1]]) if (hexOf(black, (y * 16 + x) * 4) === K) corners = false;
    } else opening = false;
    const rows = [];
    let map = '';
    for (const m of marks) {
      if (m.map !== map) {
        PixelPets.goto(m.map, m.x, Math.min(m.y + 1, PixelPets.mapInfo.h - 1), 'up');
        map = m.map;
        await settle();
      }
      const info = PixelPets.tileInfo(m.x, m.y);
      const objs = PixelPets.mapObjs.filter((o) => o.x === m.x && o.y === m.y);
      rows.push({
        map: m.map, x: m.x, y: m.y, ch: info.ch, tile: info.tile, walk: info.walk, blocked: info.blocked, part: info.part,
        sprites: objs.filter((o) => o.kind === 'decal').map((o) => o.sprite),
        ids: Object.fromEntries(objs.filter((o) => o.kind === 'decal').map((o) => [o.id, o.sprite])),
      });
    }
    PixelPets.goto('hm_hq_f1', 11, 5, 'up');
    await settle();
    const hq = cell(12, 3);
    let hqBlack = false;
    if (hq) {
      hqBlack = true;
      for (let y = 0; y <= 2; y++) for (let x = 2; x <= 13; x++) if (hexOf(hq, (y * 16 + x) * 4) !== K) hqBlack = false;
    }
    // d106bca: every up flight the spec covers opens into rows 0-2 of solid PAL.k, on screen (keeper two rows below).
    const upOpen = [];
    for (const m of marks.filter((mk) => (mk.sprites || []).includes('wayin_glint_up'))) {
      PixelPets.goto(m.map, m.x, Math.min(m.y + 2, PixelPets.mapInfo.h - 1), 'up');
      await settle();
      const d = cell(m.x, m.y);
      let ok = !!d;
      if (d) for (let y = 0; y <= 2; y++) for (let x = 2; x <= 13; x++) if (hexOf(d, (y * 16 + x) * 4) !== K) ok = false;
      upOpen.push(m.map + ' ' + m.x + ',' + m.y + (ok ? ' black' : ' NOT black'));
    }
    PixelPets.goto('hm_home_up', 4, 5, 'down');
    await settle();
    PixelPets.goto('hm_home_in', 4, 6, 'down');
    await settle();
    let dimLit = false;
    const dimBlack = { opening: true };
    for (let n = 0; n < 16; n++) {
      const d = cell(1, 5);
      if (!d) { dimBlack.opening = false; break; }
      for (let y = 4; y <= 4; y++) for (let x = 5; x <= 10; x++) if (hexOf(d, (y * 16 + x) * 4) === '#f4f4f4') dimLit = true;
      for (let y = 0; y <= 2; y++) for (let x = 2; x <= 13; x++) if (hexOf(d, (y * 16 + x) * 4) !== K) dimBlack.opening = false;
      await sleep(100);
    }
    const seen = PixelPets.state.floorSeen || null;
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    const junkIn = JSON.parse(JSON.stringify(raw));
    junkIn.floorSeen = { hm_home_up: 1, nope: 1, hm_home_in: 2, bad: 'x' };
    const junk = PPSave.normalizeV2(junkIn);
    const bareIn = JSON.parse(JSON.stringify(raw));
    delete bareIn.floorSeen;
    const bare = PPSave.normalizeV2(bareIn);
    const apt = { b: null, c: null };
    PixelPets.goto('highcharity', 25, 26, 'up');
    await settle();
    apt.b = PixelPets.mapObjs.filter((o) => o.x === 17 && o.y === 25).map((o) => o.id + ':' + o.kind);
    apt.c = PixelPets.mapObjs.filter((o) => o.x === 25 && o.y === 25).map((o) => o.id + ':' + o.kind);
    PixelPets.goto('hearthmoor', 15, 19, 'up');
    await settle();
    const sign = PixelPets.mapObjs.find((o) => o.id === 'hm_flats_sign');
    const lantern = PixelPets.mapObjs.find((o) => o.id === 'hm_lantern_post');
    const wayinAt = (x, y) => PixelPets.mapObjs.filter((o) => o.x === x && o.y === y && String(o.id || '').indexOf('wayin') === 0).map((o) => o.id);
    const lizzy = {
      sign, lantern,
      leaf: PixelPets.mapObjs.find((o) => o.id === 'hm_leaf_17_15'),
      sill: PixelPets.mapObjs.filter((o) => o.kind === 'decal' && o.y === 18 && o.x >= 15 && o.x <= 19).map((o) => o.x + ':' + o.sprite),
      band: PixelPets.mapObjs.filter((o) => o.x === 18 && o.y >= 15 && o.y <= 19).map((o) => o.id + '@' + o.x + ',' + o.y),
      // Polish puts the sign at (14,18) and the post at (18,19). Bren's beat is (1,7)-(1,9). No way-in marker on those cells, or on whatever cell the sign and post actually occupy.
      clear: [[14, 18], [18, 19], [1, 7], [1, 8], [1, 9]].flatMap(([x, y]) => wayinAt(x, y)),
      share: []
        .concat(sign ? wayinAt(sign.x, sign.y) : ['missing-sign'])
        .concat(lantern ? wayinAt(lantern.x, lantern.y) : ['missing-post']),
    };
    const flatsDoor = MAPDATA.detail_lizzy.slicePatch.maps.hearthmoor.addRoofs.flats.door;
    const roofs = MAPDATA.detail_b4.slicePatch.maps.highcharity.set.roofs;
    const shut = roofs.apt_c.door;
    const shutB = roofs.apt_b.door;
    const cap = PixelPets.devChecks().floorCap;
    const f5 = (() => { PixelPets.goto('hm_flats_5', 1, 6, 'up'); return PixelPets.tileInfo(0, 6).ch; })();
    return {
      art: {
        home: art.stair_home.rows.slice(0, 4),
        loft0: art.stair_loft.rows[0],
        lab: art.lab_stair.rows.slice(0, 4),
        up: art.step_up.rows.slice(0, 4),
        down0: art.step_down.rows[0],
        downWell: art.step_down.rows[15],
        corners: art.stair_home.rows[0][0] + art.step_up.rows[0][0] + art.lab_stair.rows[0][0],
        outside,
        glintFrames: Array.isArray(A.wayin_glint_up) ? A.wayin_glint_up.length : 0,
        glintMs: A.wayin_glint_up && A.wayin_glint_up.ms,
        stepAnim: Array.isArray(A.step_up) || Array.isArray(A.door_step) || Array.isArray(A.door_step_warm),
      },
      rows, home, sawOn, sawOff, outsideGlint: outsideGlint.length, opening, corners, hqBlack, upOpen,
      dimLit, dimOpening: dimBlack.opening,
      seen, v: PixelPets.state.v,
      junk: { v: junk.v, floorSeen: junk.floorSeen },
      bare: { v: bare.v, has: Object.prototype.hasOwnProperty.call(bare, 'floorSeen') },
      apt, lizzy, flatsDoor, shut, shutB, cap, f5,
    };
  }, MARKS);

  expect(report.art.outside).toEqual([]);
  expect(report.art.home.slice(0, 3), 'home: rows 0-2 PAL.k (d106bca)').toEqual(['..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..']);
  expect(report.art.home[3].includes('k'), 'home: the tread edge starts at row 3').toBe(false);
  expect(report.art.lab.slice(0, 3), 'lab: rows 0-2 PAL.k (d106bca)').toEqual(['..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..']);
  expect(report.art.lab[3].includes('k'), 'lab: the tread edge starts at row 3').toBe(false);
  expect(report.art.up.slice(0, 3), 'up: rows 0-2 PAL.k (d106bca)').toEqual(['..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..']);
  expect(report.art.up[3].includes('k'), 'up: the tread edge starts at row 3').toBe(false);
  expect(report.art.corners).toBe('...');
  expect(report.art.loft0.startsWith('k')).toBe(false);
  expect(report.art.down0.includes('k')).toBe(false);
  expect(report.art.downWell).toBe('..xkkkkkkkkkkx..');
  expect(report.art.glintFrames).toBe(6);
  expect(report.art.glintMs).toBe(500);
  expect(report.art.stepAnim).toBe(false);
  for (let i = 0; i < MARKS.length; i++) {
    const want = MARKS[i], got = report.rows[i];
    expect(got.ch, want.map + ' ' + want.x + ',' + want.y).toBe(want.ch);
    expect(got.part, want.map).toBe(null);
    expect(got.walk, want.map).toBe(true);
    expect(got.blocked, want.map).toBe(false);
    if (want.tile) expect(got.tile, want.map).toBe(want.tile);
    if (want.sprites) expect(got.sprites.slice().sort(), want.map + ' sprites').toEqual(want.sprites.slice().sort());
    if (want.ids) for (const [id, sprite] of Object.entries(want.ids)) expect(got.ids[id]).toBe(sprite);
  }
  expect(report.home).not.toContain('offscreen');
  expect(report.sawOn).toBe(true);
  expect(report.sawOff).toBe(true);
  expect(report.outsideGlint).toBe(0);
  expect(report.opening).toBe(true);
  expect(report.corners).toBe(true);
  expect(report.hqBlack).toBe(true);
  expect(report.upOpen.length).toBe(7);   // hm_home_in, hm_hq_f1, hc_mall_1, rx_f1, rx_f2, rx_f3, sm_tunnel
  for (const line of report.upOpen) expect(line, 'rows 0-2 PAL.k').toMatch(/ black$/);
  expect(report.dimLit).toBe(false);
  expect(report.dimOpening).toBe(true);
  expect(report.seen.hm_home_up).toBe(1);
  expect(report.v).toBe(2);
  expect(report.junk.v).toBe(2);
  expect(report.junk.floorSeen).toEqual({ hm_home_up: 1 });
  expect(report.bare.v).toBe(2);
  expect(report.bare.has).toBe(false);
  expect(report.apt.b.join(' ')).not.toContain('wayin');
  expect(report.apt.c.join(' ')).not.toContain('wayin');
  expect(report.lizzy.leaf).toMatchObject({ x: 18, y: 15 });
  expect(report.lizzy.sill).toEqual(['15:door_step']);
  expect([report.lizzy.sign.x, report.lizzy.sign.y]).not.toEqual([15, 18]);
  expect([report.lizzy.lantern.x, report.lizzy.lantern.y]).not.toEqual([15, 18]);
  expect(report.lizzy.clear).toEqual([]);
  expect(report.lizzy.share).toEqual([]);
  expect(report.lizzy.band.join(' ')).not.toContain('wayin');
  expect(report.flatsDoor).toBe('door_glass_awning');
  expect(report.shut).toBe('door_blue');
  expect(report.shutB).toBe('door_blue');
  expect(report.cap).toEqual([]);
  expect(report.f5).toBe('m');
});

test('reduced motion keeps the stair still', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  const pair = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const grab = (tx, ty) => {
      const c = document.querySelector('#mapCanvas');
      const x0 = tx * 16 - PixelPets.walk.cam.x, y0 = ty * 16 - PixelPets.walk.cam.y;
      return Array.from(c.getContext('2d').getImageData(x0, y0, 16, 16).data);
    };
    PixelPets.goto('hm_home_in', 4, 6, 'down');
    await settle();
    const a = grab(1, 5);
    await sleep(1500);
    const b = grab(1, 5);
    PixelPets.goto('hm_hq_f1', 11, 5, 'up');
    await settle();
    const c = grab(12, 3);
    await sleep(1500);
    const d = grab(12, 3);
    const same = (p, q) => p.length === q.length && p.every((n, i) => n === q[i]);
    return { home: same(a, b), hq: same(c, d), reduce: matchMedia('(prefers-reduced-motion: reduce)').matches };
  });
  expect(pair.reduce).toBe(true);
  expect(pair.home).toBe(true);
  expect(pair.hq).toBe(true);
});

test('home stairs and the observatory exit still warp, and a locked stair stays shut', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  await page.evaluate(() => PixelPets.goto('hm_home_in', 1, 6, 'up'));
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => page.evaluate(() => PixelPets.fading ? null : PixelPets.mapInfo.id)).toBe('hm_home_up');
  expect(await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual({ x: 2, y: 5 });
  await page.evaluate(() => PixelPets.goto('mahopac_obs', 4, 5, 'down'));
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => page.evaluate(() => PixelPets.fading ? null : PixelPets.mapInfo.id)).toBe('mahopac');
  expect(await page.evaluate(() => ({ x: PixelPets.state.world.x, y: PixelPets.state.world.y }))).toEqual({ x: 5, y: 8 });
  await page.evaluate(() => {
    PixelPets.setFlag('story.side', 'glimmer');
    PixelPets.setFlag('story.rx_enter', true);
    PixelPets.setFlag('story.rx_f1', false);
    PixelPets.goto('rx_f1', 6, 2, 'up');
  });
  await expect.poll(() => page.evaluate(() => !PixelPets.fading && PixelPets.mapInfo.id === 'rx_f1' && PixelPets.state.world.y === 2)).toBe(true);
  await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const r = c.getBoundingClientRect(), k = r.width / c.width;
    const x = r.left + (6 * 16 + 8 - PixelPets.walk.cam.x) * k;
    const y = r.top + (2 * 16 + 8 - PixelPets.walk.cam.y) * k;
    const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse' };
    c.dispatchEvent(new PointerEvent('pointerdown', opts));
    c.dispatchEvent(new PointerEvent('pointerup', opts));
  });
  await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.text)).toContain('The stair lock is still on.');
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('rx_f1');
});
