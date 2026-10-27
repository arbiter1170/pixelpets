/* D797 Hearthmoor Plaza: a joined outdoor map west of the starting home. The west gate (rows 4-6) is open from the
   first morning, the walk is two-way and lands on the gate rows, every Keeper and civilian talks from a reachable tile,
   the town map lists each gate once under the right name, and the save stays v2 with no new keys. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const KEEPERS = ['hmp_watch', 'hmp_lamplighter', 'hmp_cadet'];
const CIVILIANS = ['hmp_sweeper', 'hmp_grower', 'hmp_weaver', 'hmp_kid'];

async function boot(page, world, flags) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  Object.assign(s.flags, flags || {});
  s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => { PixelPets.clock.set('tue', 10, 0); PixelPets.showTab('walk'); });
}

async function step(page, dir) {
  const from = await page.evaluate(() => PixelPets.state.world.map);
  await page.evaluate((d) => PixelPets.walkStep(d), dir);
  await page.waitForFunction((m) => PixelPets.state.world.map !== m && !PixelPets.fading, from, { timeout: 3000 });
  return page.evaluate(() => { const w = PixelPets.state.world; return { map: w.map, x: w.x, y: w.y, v: PixelPets.state.v }; });
}

const REACH = `() => {
  const info = PixelPets.mapInfo, W = info.w, H = info.h, safe = PixelPets.exteriors(info.id).safe;
  const seen = new Set([safe.x + ',' + safe.y]), q = [[safe.x, safe.y]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || PixelPets.tileInfo(nx, ny).blocked) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}`;

test('the west gate is open before the first partner and walks both ways on rows 4-6 @w1', async ({ page }) => {
  await boot(page, { map: 'hearthmoor', x: 1, y: 5 }, { 'story.starter_received': false });
  let w = await step(page, 'left');
  expect(w).toMatchObject({ map: 'hm_plaza', x: 24, y: 9, v: 2 });
  w = await step(page, 'right');
  expect(w).toMatchObject({ map: 'hearthmoor', x: 1, y: 5, v: 2 });
  for (const [y, py] of [[4, 8], [6, 10]]) {
    await page.evaluate((yy) => PixelPets.goto('hearthmoor', 1, yy, 'left'), y);
    await page.waitForFunction(() => !PixelPets.fading);
    w = await step(page, 'left');
    expect(w, 'gate row ' + y).toMatchObject({ map: 'hm_plaza', x: 24, y: py });
    w = await step(page, 'right');
    expect(w, 'back from plaza row ' + py).toMatchObject({ map: 'hearthmoor', x: 1, y });
  }
  const saved = await page.evaluate(() => { PixelPets.save && PixelPets.save(); return localStorage.getItem('pixelpets.save.v2'); });
  expect(JSON.parse(saved).v).toBe(2);
  expect(saved).not.toMatch(/hmp_|plaza_/);
});

test('the home door reaches the gate, and the plaza is safe ground with no wild rolls @w1', async ({ page }) => {
  await boot(page, { map: 'hearthmoor', x: 3, y: 6 });
  const path = await page.evaluate(() => PixelPets.findPath([{ x: 0, y: 6 }]));
  expect(path && path.length).toBeGreaterThan(0);
  await page.evaluate(() => PixelPets.goto('hm_plaza', 24, 9, 'left'));
  await page.waitForFunction(() => !PixelPets.fading);
  const info = await page.evaluate(() => { const m = MAPDATA.detail_zz_plaza.maps.hm_plaza; return { at: PixelPets.mapInfo.id, spawns: m.spawns, zones: m.zones.length, name: m.name }; });
  expect(info).toEqual({ at: 'hm_plaza', spawns: null, zones: 0, name: 'Hearthmoor Plaza' });
});

test('three Keepers and four civilians each talk from a reachable tile @w1', async ({ page }) => {
  await boot(page, { map: 'hm_plaza', x: 24, y: 9 }, {
    'story.rival1_done': true,
    'story.plaza_yes': true,
    'story.plaza_done': true,
    'story.plaza_sign_yes': true,
    'story.plaza_sign_done': true,
  });
  const r = await page.evaluate(([src, keepers, civ]) => {
    const seen = eval(src)(), objs = MAPDATA.detail_zz_plaza.maps.hm_plaza.objs, bad = [], who = {};
    for (const id of keepers.concat(civ)) {
      const o = objs.find((n) => n.id === id);
      if (!o) { bad.push(id + ' missing'); continue; }
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((o.x + dx) + ',' + (o.y + dy)));
      if (!near) bad.push(id + ' has no reachable talk tile');
      const e = window.PPRep && PPRep.entry(o.name);
      who[id] = e ? e.faction : null;
    }
    for (const o of objs.filter((n) => n.kind === 'sign' || (n.kind === 'prop' && n.lines))) {
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((o.x + dx) + ',' + (o.y + dy)))) bad.push(o.id + ' unreadable');
    }
    return { bad, who };
  }, [REACH, KEEPERS, CIVILIANS]);
  expect(r.bad).toEqual([]);
  for (const id of KEEPERS) expect(r.who[id], id).toBe('keepers');
  for (const id of CIVILIANS) expect(r.who[id], id).toBe('none');
  for (const id of KEEPERS.concat(CIVILIANS)) {
    expect(await page.evaluate((oid) => PixelPets.talkTo(oid), id), id).toBe(true);
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full, null, { timeout: 3000 });
    const text = await page.evaluate(() => PixelPets.scene.text);
    expect(text, id).toBe({
      hmp_watch: 'Plaza watch. Mind the little ones.',
      hmp_lamplighter: 'I light every lantern here at dusk.',
      hmp_cadet: 'Statue duty. The coat comes later.',
      hmp_sweeper: "Wishes in. Leaves out. That's my job.",
      hmp_grower: 'Fernbrook apples, fresh off the cart.',
      hmp_weaver: "Ember, tide, and bloom. Ilse's three.",
      hmp_kid: 'Vale says the chalk can stay till rain.',
    }[id]);
    expect(text.length, id).toBeGreaterThan(10);
    expect(text, id).not.toMatch(/faint|evolv|coins|appeared|dex\b/i);
    for (let i = 0; i < 20 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(60); }
    await page.waitForFunction(() => !PixelPets.scene, null, { timeout: 3000 });
  }
});

test('the officer coat is Vale alone, and rank lines follow the pledge @w1', async ({ page }) => {
  await boot(page, { map: 'hm_plaza', x: 24, y: 9 }, { 'story.starter_received': false });
  const art = await page.evaluate(() => {
    const objs = MAPDATA.detail_zz_plaza.maps.hm_plaza.objs;
    const L = Object.assign({}, MAPDATA.civic.looks, MAPDATA.detail_zz_plaza.looks);
    const row = (id) => {
      const o = objs.find((n) => n.id === id);
      return { look: o.look, art: L[o.look] };
    };
    const long = objs.filter((o) => o.kind === 'npc').flatMap((o) => Object.values(o.lines || {}).filter((s) => s.length > 40));
    return {
      vale: row('hmp_watch'), pryce: row('hmp_lamplighter'), lisse: row('hmp_cadet'), long,
      portrait: MAPDATA.civic.speakers['Officer Vale'],
      cadetPortrait: MAPDATA.detail_zz_plaza.speakers['Cadet Lisse'],
      officerSkin: MAPDATA.civic.looks.officer.skin,
      early: objs.find((n) => n.id === 'hmp_watch').lines['!story.starter_received'],
    };
  });
  expect(art.vale).toMatchObject({ look: 'hmp_vale', art: { outfit: 'coat', outfitCol: 'g', accent: 'y' } });
  expect(art.pryce.art.outfit).toBe('tunic');
  expect(art.pryce.art.outfitCol).toBe('g');
  expect(art.lisse.art).toMatchObject({ outfit: 'vest', outfitCol: 'g', accent: 'y' });
  expect(art.long).toEqual([]);
  expect(art.portrait).toBe('hmp_vale');
  expect(art.cadetPortrait).toBe('hmp_lisse');
  expect(art.vale.art.skin).not.toBe(art.officerSkin);
  expect(art.early).toBe("Ilse's lodge is east, past your door.");

  await boot(page, { map: 'hm_plaza', x: 21, y: 8 }, {
    'story.side': 'keepers',
    'story.plaza_yes': true,
    'story.plaza_done': true,
    'story.plaza_sign_yes': true,
    'story.plaza_sign_done': true,
  });
  await page.evaluate(() => PixelPets.setStanding('keepers', 99999));
  const say = async (id) => {
    expect(await page.evaluate((oid) => PixelPets.talkTo(oid), id), id).toBe(true);
    const text = await page.evaluate(() => PixelPets.scene.text);
    for (let i = 0; i < 8 && await page.evaluate(() => !!PixelPets.scene); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(40); }
    await page.waitForFunction(() => !PixelPets.scene);
    return text;
  };
  expect(await say('hmp_watch')).toBe("Warden's Ally. The west square is yours.");
  expect(await say('hmp_lamplighter')).toBe("Warden's Ally. I'll light your way home.");
  expect(await say('hmp_cadet')).toBe('Cadet Lisse. The watch will learn you.');
});

test('the town map lists each gate once, named for the other side @w1', async ({ page }) => {
  for (const [map, x, y, xy, label] of [['hearthmoor', 3, 6, [0, 5], 'HEARTHMOOR PLAZA'], ['hm_plaza', 24, 9, [25, 9], 'HEARTHMOOR']]) {
    await boot(page, { map, x, y });
    await page.waitForFunction(() => !document.querySelector('#mapBtn').classList.contains('off'));
    await page.locator('#mapBtn').click();
    await page.waitForSelector('#ovMap:not([hidden])');
    await page.waitForFunction(() => PixelPets.mapLayer() && PixelPets.mapLayer().level);
    const edge = map === 'hearthmoor' ? 'west' : 'east';
    const ex = await page.evaluate((ed) => PixelPets.mapLayer().exits.filter((e) => e.edge === ed && /HEARTHMOOR/.test(e.label)), edge);
    expect(ex.map((e) => [e.label, e.xy, e.shown]), map).toEqual([[label, xy, label]]);
  }
});
