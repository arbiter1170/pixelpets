/* HUSHWATER B1 maps plus B2: the 12 forms, full spawn tables, the three holders, and the west arrive step. */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, playScene, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const TABLES = {
  hw_rim: [['snail', 22, 19, 21], ['skink', 14, 19, 22], ['stone', 12, 19, 22], ['mole', 8, 19, 21], ['gust', 6, 20, 22], ['vane', 3, 20, 22], ['owl', 2, 21, 23]],
  hw_cut: [['otter', 20, 19, 22], ['snail', 14, 19, 21], ['crab', 12, 19, 22], ['dormouse', 8, 19, 22], ['moth', 8, 19, 21], ['skink', 6, 20, 22], ['frost', 4, 20, 22], ['owl', 3, 21, 23]],
  hw_falls: [['otter', 18, 20, 22], ['dormouse', 10, 20, 22], ['beetle', 10, 19, 21], ['snail', 8, 20, 22], ['shade', 6, 20, 23], ['frost', 5, 20, 22], ['owl', 4, 21, 23]],
};
const HOLDERS = {
  hw_climber: {
    name: 'Fenna', title: 'Ledge Climber', map: 'hw_rim',
    team: [
      { form: 'skink/0', level: 21, moves: ['tumble_charge', 'kiln_rush', 'pebble_flick', 'kindle_burst'] },
      { form: 'skink/1', level: 22, moves: ['pebble_flick', 'kindle_burst', 'boulder_drop', 'cinder_pounce'] },
    ],
    intro: 'Warm rocks, good grip, better company. Battle on the ledge?',
    win: 'You found your footing, {player}. Nice and steady.',
    lose: 'Slipped, huh? Rest a bit and climb back up.',
  },
  hw_angler: {
    name: 'Nils', title: 'Rill Angler', map: 'hw_cut',
    team: [
      { form: 'otter/0', level: 21, moves: ['ripple_jab', 'sleet_pelt', 'cold_snap', 'rime_rush'] },
      { form: 'otter/1', level: 22, moves: ['cold_snap', 'rime_rush', 'puddle_stomp', 'flurry_fluff'] },
    ],
    intro: 'Nothing bites in quiet water. Except my team. Ready?',
    win: 'Reeled right in, {player}. Fair catch.',
    lose: 'The stream wins again. Dry off and come back.',
  },
  hw_owlwatch: {
    name: 'Ottilie', title: 'Owl Watcher', map: 'hw_falls',
    team: [
      { form: 'owl/0', level: 22, moves: ['puff_shot', 'dusk_fang', 'updraft', 'nightfall'] },
      { form: 'snail/1', level: 22, moves: ['sap_sip', 'quarry_crash', 'scree_slide', 'boulder_drop'] },
      { form: 'otter/1', level: 23, moves: ['cold_snap', 'rime_rush', 'puddle_stomp', 'flurry_fluff'] },
    ],
    intro: 'Shh. The owls are listening. Let us give them something worth hearing.',
    win: 'Even the Roost Oak went quiet for that one, {player}.',
    lose: 'The owls saw that coming. Rest, then try again softly.',
  },
};
const NEW_IDS = ['skink', 'otter', 'owl', 'snail'];
const STARTERS = ['ember', 'tide', 'bloom'];

function fieldSave(extra) {
  const save = starterSave();
  save.steps = 40;
  save.flags['story.early_done'] = true;
  save.flags['story.phone_got'] = true;
  save.settings.controls = 'modern';
  save.settings.textSpeed = 'fast';
  Object.assign(save.flags, extra || {});
  return save;
}

function pet(id, species, extra) {
  return Object.assign({
    id,
    species,
    stage: 0,
    nick: null,
    origin: 'wild',
    xp: 3,
    bx: 4,
    hunger: 20,
    happy: 20,
    energy: 40,
    met: 1700000000000,
    moves: species === 'ember' ? ['tackle'] : ['zzfuture-spark'],
    evoMoves: [],
    mark: id,
  }, extra || {});
}

async function boot(page, save, search) {
  await installSave(page.context(), save || fieldSave(), { quietDay: true });
  await page.addInitScript(() => {
    const arm = () => {
      if (!window.PixelPets || typeof PixelPets.clearWild !== 'function') { setTimeout(arm, 20); return; }
      setInterval(() => PixelPets.clearWild(), 15);
    };
    arm();
  });
  await gotoGame(page, search == null ? '?debug=1' : search);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function world(page) {
  return page.evaluate(() => {
    const w = PixelPets.state.world;
    return { map: w.map, x: w.x, y: w.y, v: PixelPets.state.v };
  });
}

async function jump(page, map, x, y, facing) {
  await page.evaluate(({ map, x, y, facing }) => {
    PixelPets.goto(map, x, y, facing || 'down');
    PixelPets.clearWild();
  }, { map, x, y, facing });
}

async function settle(page, from) {
  await page.waitForFunction((fromMap) => {
    if (window.PixelPets && PixelPets.clearWild) PixelPets.clearWild();
    const w = PixelPets.state.world;
    return w.map !== fromMap && !PixelPets.fading;
  }, from, { timeout: 2000 });
  await page.evaluate(() => PixelPets.clearWild());
}

async function walkTo(page, x, y) {
  const from = await page.evaluate(() => PixelPets.state.world.map);
  const step = await page.evaluate(({ x, y }) => {
    PixelPets.clearWild();
    const path = PixelPets.findPath([{ x, y }]);
    if (!path) return { error: 'no path', map: PixelPets.state.world.map, x: PixelPets.state.world.x, y: PixelPets.state.world.y };
    let scene = false;
    for (const p of path) {
      const w = PixelPets.state.world;
      if (w.map !== PixelPets.state.world.map) break;
      let dir = null;
      if (p.x > w.x) dir = 'right';
      else if (p.x < w.x) dir = 'left';
      else if (p.y > w.y) dir = 'down';
      else if (p.y < w.y) dir = 'up';
      else continue;
      const s = PixelPets.walkStep(dir);
      if (s.scene) scene = true;
      if (!s.ok || s.scene || s.battle || PixelPets.fading) return { scene, battle: !!s.battle, fading: !!PixelPets.fading, map: s.map, x: s.x, y: s.y, text: s.text || '' };
    }
    const w = PixelPets.state.world;
    return { scene, fading: !!PixelPets.fading, map: w.map, x: w.x, y: w.y };
  }, { x, y });
  expect(step.error || '', 'path to ' + x + ',' + y + ' from ' + from).toBe('');
  expect(step.battle, 'a wild battle started').toBeFalsy();
  if (step.scene) await playScene(page);
  if (step.fading) await settle(page, from);
  await page.evaluate(() => PixelPets.clearWild());
  return world(page);
}

test('gates stay shut until Cobblecrest ends, then the stream walks both ways @w1', async ({ page }) => {
  test.setTimeout(120000);
  await boot(page);
  const glenStay = await page.evaluate(() => {
    PixelPets.goto('route2_glen', 23, 4, 'left');
    PixelPets.clearWild();
    const ids = PixelPets.mapObjs.map((o) => o.id);
    const back = { left: 'right', right: 'left', up: 'down', down: 'up' };
    const start = PixelPets.state.world.map;
    let left = start;
    for (const dir of ['up', 'down', 'left', 'right']) {
      PixelPets.clearWild();
      const s = PixelPets.walkStep(dir);
      if (s && s.map && s.map !== start) { left = s.map; break; }
      if (s && s.scene && PixelPets.endScene) PixelPets.endScene();
      if (s && s.ok && !s.scene && !s.battle) {
        const ret = PixelPets.walkStep(back[dir]);
        if (ret && ret.scene && PixelPets.endScene) PixelPets.endScene();
        if (ret && ret.map && ret.map !== start) { left = ret.map; break; }
      }
    }
    return { map: PixelPets.state.world.map, left, ids, battle: !!(PixelPets.battle && PixelPets.battle.on) };
  });
  expect(glenStay.ids).toContain('glen_east_log');
  expect(glenStay.ids).not.toContain('glen_east');
  expect(glenStay.battle).toBe(false);
  expect(glenStay.left).toBe('route2_glen');
  expect(glenStay.map).toBe('route2_glen');
  let here = await world(page);
  let ids;

  await jump(page, 'cobble_quarry', 0, 17, 'right');
  here = await world(page);
  expect(here).toMatchObject({ map: 'cobble_quarry', x: 0, y: 17 });
  ids = await page.evaluate(() => PixelPets.mapObjs.map((o) => o.id));
  expect(ids).toContain('q_west_rubble');
  expect(ids).not.toContain('q_west');

  await page.evaluate(() => {
    PixelPets.setFlag('story.cobble_end', true);
    PixelPets.setFlag('story.hw_reached', true);
    // Fenna, Nils and Ottilie stand on these paths. A beaten holder does not spot, so the route check stays a walk.
    for (const id of ['hw_climber', 'hw_angler', 'hw_owlwatch']) PixelPets.setFlag('trainer.' + id, true);
  });
  await jump(page, 'cobble_quarry', 1, 17, 'left');
  ids = await page.evaluate(() => PixelPets.mapObjs.map((o) => o.id));
  expect(ids).not.toContain('q_west_rubble');
  expect(ids).toContain('q_west');
  here = await walkTo(page, 0, 17);
  expect(here).toMatchObject({ map: 'hw_rim', x: 22, y: 12 });

  here = await walkTo(page, 0, 8);
  expect(here).toMatchObject({ map: 'hw_cut', x: 38, y: 12 });
  here = await walkTo(page, 0, 5);
  expect(here).toMatchObject({ map: 'hw_falls', x: 22, y: 6 });
  here = await walkTo(page, 0, 10);
  expect(here).toMatchObject({ map: 'route2_glen', x: 22, y: 4 });

  await jump(page, 'route2_glen', 22, 4, 'right');
  ids = await page.evaluate(() => PixelPets.mapObjs.map((o) => o.id));
  expect(ids).not.toContain('glen_east_log');
  here = await walkTo(page, 23, 4);
  expect(here).toMatchObject({ map: 'hw_falls', x: 1, y: 10 });
  here = await walkTo(page, 23, 6);
  expect(here).toMatchObject({ map: 'hw_cut', x: 1, y: 5 });
  here = await walkTo(page, 39, 12);
  expect(here).toMatchObject({ map: 'hw_rim', x: 1, y: 8 });
  here = await walkTo(page, 23, 12);
  expect(here).toMatchObject({ map: 'cobble_quarry', x: 1, y: 17 });
});

test('the first step in plays once, the rope stays, and the three holders appear', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, fieldSave({ 'story.cobble_end': true }));
  await jump(page, 'hw_rim', 22, 12, 'left');
  const east = await page.evaluate(() => PixelPets.walkStep('left'));
  expect(east.scene).toBe(true);
  expect(await page.evaluate(() => PixelPets.scene && PixelPets.scene.id)).toBe('hw_arrive');
  await playScene(page);
  expect(await page.evaluate(() => PixelPets.state.flags['story.hw_reached'])).toBe(true);
  await jump(page, 'hw_rim', 22, 12, 'left');
  const again = await page.evaluate(() => PixelPets.walkStep('left'));
  expect(again.scene).toBeFalsy();

  await page.evaluate(() => PixelPets.setFlag('story.hw_reached', null));
  await jump(page, 'route2_glen', 22, 4, 'right');
  let here = await walkTo(page, 23, 4);
  expect(here).toMatchObject({ map: 'hw_falls', x: 1, y: 10 });
  expect(await page.evaluate(() => PixelPets.scene)).toBeNull();
  const first = await page.evaluate(() => PixelPets.walkStep('right'));
  expect(first.scene).toBe(true);
  expect(first).toMatchObject({ map: 'hw_falls', x: 2, y: 10 });
  expect(first.text).toBe('The stream runs quiet here. Even the wild Walklings walk softly.');
  await playScene(page);
  expect(await page.evaluate(() => PixelPets.state.flags['story.hw_reached'])).toBe(true);

  await jump(page, 'hw_falls', 10, 2, 'up');
  let rope = await page.evaluate(() => PixelPets.mapObjs.map((o) => o.id));
  expect(rope).toContain('hw_stair_rope');
  expect(rope.some((id) => id.includes('lizzy'))).toBe(false);
  await page.evaluate(() => PixelPets.setFlag('story.hw_stair_open', true));
  await jump(page, 'hw_falls', 10, 2, 'up');
  rope = await page.evaluate(() => PixelPets.mapObjs.map((o) => o.id));
  expect(rope).not.toContain('hw_stair_rope');

  const shown = await page.evaluate((want) => {
    const trainers = PixelPets.debugCatalog().trainers.filter((id) => id.startsWith('hw_')).sort();
    const scenes = PixelPets.debugCatalog().scenes.filter((id) => id.includes('lizzy') && id.startsWith('hw_'));
    const rows = {};
    for (const id of Object.keys(want)) {
      const t = TRAINERS[id];
      rows[id] = t && {
        name: t.name, title: t.title,
        team: t.team.map((m) => ({ form: m.form, level: m.level, moves: m.moves.slice() })),
        intro: t.lines.intro, win: t.lines.win, lose: t.lines.lose,
      };
    }
    return { trainers, scenes, rows };
  }, HOLDERS);
  expect(shown.trainers).toEqual(['hw_angler', 'hw_climber', 'hw_owlwatch']);
  expect(shown.scenes).toEqual([]);
  for (const [id, want] of Object.entries(HOLDERS)) {
    expect(shown.rows[id], id).toEqual({
      name: want.name, title: want.title, team: want.team, intro: want.intro, win: want.win, lose: want.lose,
    });
  }
  for (const [id, want] of Object.entries(HOLDERS)) {
    const map = want.map;
    await jump(page, map, map === 'hw_cut' ? 37 : map === 'hw_rim' ? 21 : 2, map === 'hw_falls' ? 10 : 12, 'down');
    const objs = await page.evaluate(() => PixelPets.mapObjs);
    expect(objs.filter((o) => o.kind === 'trainer').map((o) => o.id), map).toEqual([id]);
    expect(objs.some((o) => /lizzy/i.test(o.id)), map).toBe(false);
  }

  await page.evaluate(() => PixelPets.setFlag('story.hc_council_done', true));
  await jump(page, 'hw_cut', 20, 4, 'up');
  let camp = await page.evaluate(() => PixelPets.mapObjs.map((o) => o.id));
  for (const id of ['hw_camp_table', 'hw_camp_lamp', 'hw_camp_banner', 'hw_camp_crate', 'hw_scout']) expect(camp).toContain(id);
  expect(camp).not.toContain('hw_relay_lamp_a');
  await page.evaluate(() => {
    PixelPets.setFlag('story.side', 'glimmer');
    PixelPets.setFlag('story.gb_invited', true);
  });
  await jump(page, 'hw_cut', 20, 11, 'up');
  camp = await page.evaluate(() => PixelPets.mapObjs.map((o) => o.id));
  expect(camp).not.toContain('hw_camp_table');
  expect(camp).toContain('hw_relay_lamp_a');
  expect(camp).toContain('hw_relay_lamp_b');

  expect(await page.evaluate(() => PixelPets.mapCheck())).toEqual([]);
  const px = await page.evaluate(() => ({
    falls: PixelPets.mapTilePx('hw_falls'),
    cut: PixelPets.mapTilePx('hw_cut'),
    rim: PixelPets.mapTilePx('hw_rim'),
  }));
  expect(px.falls).toMatchObject({ '390': 15, '375': 15, '320': 12 });
  expect(px.cut).toMatchObject({ '390': 9, '375': 9, '320': 7 });
  expect(px.rim).toMatchObject({ '390': 15, '375': 15, '320': 12 });

  await page.evaluate(() => PixelPets.showTab('walk'));
  try {
    await page.waitForFunction(() => !document.querySelector('#mapBtn').classList.contains('off'), null, { timeout: 2000 });
  } catch (err) {
    const why = await page.evaluate(() => ({
      open: [...document.querySelectorAll('[id^="ov"]')].filter((n) => !n.hidden).map((n) => n.id),
      walk: document.querySelector('#scr-walk').className,
      screen: document.body.getAttribute('data-screen'),
      mapBtn: document.querySelector('#mapBtn').className,
    }));
    throw new Error(JSON.stringify(why));
  }
  const room = await page.evaluate(() => {
    const preview = PixelPets.previewMap('town', 'hw_cut');
    return {
      preview,
      off: document.querySelector('#mapLevelRoom').classList.contains('off'),
      hidden: document.querySelector('#ovMap').hidden,
      scene: PixelPets.scene,
      fading: PixelPets.fading,
      level: preview ? PixelPets.mapLayer().level : null,
      place: document.querySelector('#mapPlaceName').textContent,
      blurb: document.querySelector('#mapPlaceBlurb').textContent,
    };
  });
  expect(room.preview, JSON.stringify(room)).toBe(true);
  expect(room.off).toBe(true);
  expect(room.level).toBe('town');
  expect(room.place).toBe('HUSHWATER');
  expect(room.blurb).toBe('A quiet stream, quarry to glen.');

  await page.evaluate(() => PixelPets.previewMap('region'));
  const box = await page.locator('#regionCanvas').boundingBox();
  const center = await page.evaluate(() => PixelPets.mapNodeCenter('hw_cut'));
  await page.mouse.click(box.x + center[0] * box.width / 320, box.y + center[1] * box.height / 192);
  const card = await page.evaluate(() => ({
    title: document.querySelector('#mapTitle').textContent,
    name: document.querySelector('#mapPlaceName').textContent,
    blurb: document.querySelector('#mapPlaceBlurb').textContent,
    hold: document.querySelector('#mapHold').dataset.hold,
  }));
  expect(card.title).toBe('THE AMBERWILD');
  expect(card.name).toBe('HUSHWATER CUT');
  expect(card.blurb).toBe('A quiet stream, quarry to glen.');
  expect(card.hold).toBe('wild');

  if (page.viewportSize().width === 390) {
    const dir = artifactsDir('screenshots');
    for (const id of ['hw_falls', 'hw_cut', 'hw_rim']) {
      await page.evaluate((mid) => PixelPets.previewMap('town', mid), id);
      await page.locator('#regionCanvas').screenshot({ path: path.join(dir, 'hushwater-' + id.slice(3) + '-390.png') });
    }
  }
});

test('spawn tables roll the Hushwater lines at Lv 19-23 @w1', async ({ page }) => {
  await boot(page);
  const tables = await page.evaluate(() => {
    const all = PixelPets.spawnTables();
    const out = {};
    for (const key of ['hw_rim', 'hw_cut', 'hw_falls']) {
      const t = all[key];
      out[key] = { stage2: t.stage2, rows: t.table.map((row) => row.slice()) };
    }
    const species = PixelPets.debugCatalog().species;
    const rolls = {};
    for (const key of Object.keys(out)) {
      const seen = new Set();
      const levels = [];
      for (let i = 0; i < 80; i++) {
        const idx = PixelPets.pickSpecies([], key);
        const id = species[idx] && species[idx].id;
        seen.add(id);
        levels.push(PixelPets.wildLv(idx, 0, key));
        levels.push(PixelPets.wildLv(idx, 1, key));
      }
      rolls[key] = { seen: [...seen], levels };
    }
    return { out, rolls, route2: (all.route2 && all.route2.table || []).length };
  });
  expect(tables.route2).toBeGreaterThan(3);
  for (const key of Object.keys(TABLES)) {
    const rows = tables.out[key].rows;
    expect(rows).toEqual(TABLES[key]);
    expect(tables.out[key].stage2).toBe(0.1);
    const ids = rows.map((row) => row[0]);
    for (const id of NEW_IDS) if (TABLES[key].some((row) => row[0] === id)) expect(ids).toContain(id);
    for (const row of rows) expect(STARTERS).not.toContain(row[0]);
    for (const id of tables.rolls[key].seen) expect(ids).toContain(id);
    for (const lv of tables.rolls[key].levels) {
      expect(lv).toBeGreaterThanOrEqual(19);
      expect(lv).toBeLessThanOrEqual(23);
    }
  }
});

test('a reload inside Hushwater stays in hw_cut @w1', async ({ page }) => {
  const save = fieldSave();
  save.world = { map: 'hw_cut', x: 37, y: 12, facing: 'left', respawn: 'hearthmoor' };
  await boot(page, save, '?debug=1');
  const here = await page.evaluate(() => {
    const w = PixelPets.state.world;
    return {
      map: w.map, x: w.x, y: w.y, v: PixelPets.state.v,
      cut: PPSave.MAP_SIZE.hw_cut,
      falls: PPSave.MAP_SIZE.hw_falls,
      rim: PPSave.MAP_SIZE.hw_rim,
    };
  });
  expect(here).toMatchObject({ map: 'hw_cut', x: 37, y: 12, v: 2, cut: [40, 16], falls: [24, 16], rim: [24, 16] });
});

test('an unknown pet with a taken id gets a fresh id and stays @w1', async ({ page }) => {
  await boot(page);
  const report = await page.evaluate(() => {
    const known = {
      id: 'sameid01', species: 'ember', stage: 0, nick: null, origin: 'starter', xp: 10, bx: 40,
      hunger: 80, happy: 80, energy: 90, met: 1700000000000, moves: ['tackle'], evoMoves: [],
    };
    const partyUnknown = {
      id: 'sameid01', species: 'zzfuture', stage: 4, nick: null, origin: 'wild', xp: 3, bx: 4,
      hunger: 20, happy: 20, energy: 0, met: 1700000000002, moves: ['zzfuture-spark', 'zzfuture-spark'],
      evoMoves: [9], mark: 'party-unk',
    };
    const boxUnknown = {
      id: 'sameid01', species: 'zzfuture', stage: 1, nick: 'Box', origin: 'wild', xp: 1, bx: 2,
      hunger: 77, happy: 66, energy: 55, met: 1700000000003, moves: ['only-zz'], evoMoves: [1], mark: 'box-unk',
    };
    const unique = {
      id: 'uniqzz99', species: 'zzfuture', stage: 0, nick: null, origin: 'wild', xp: 1, bx: 2,
      hunger: 11, happy: 12, energy: 13, met: 1700000000004, moves: ['only-zz'], evoMoves: [], mark: 'unique',
    };
    const raw = JSON.parse(JSON.stringify(PixelPets.state));
    raw.party = [known, partyUnknown];
    raw.box = [boxUnknown, unique];
    raw.orphans = [];
    raw.partnerId = 'sameid01';
    const once = PPSave.normalizeV2(JSON.parse(JSON.stringify(raw)));
    const twice = PPSave.normalizeV2(JSON.parse(JSON.stringify(once)));
    const ids = once.party.map((p) => p.id).concat(once.box.map((p) => p.id));
    const partyUnk = once.party.find((p) => p.mark === 'party-unk');
    const boxUnk = once.box.find((p) => p.mark === 'box-unk');
    const uniq = once.box.find((p) => p.mark === 'unique');
    const kept = once.party.find((p) => p.species === 'ember');
    const sameFields = (got, want) => {
      const g = Object.assign({}, got), w = Object.assign({}, want);
      delete g.id; delete w.id;
      return JSON.stringify(g) === JSON.stringify(w);
    };
    return {
      v: once.v,
      orphans: once.orphans,
      keptId: kept && kept.id,
      partyId: partyUnk && partyUnk.id,
      boxId: boxUnk && boxUnk.id,
      uniqId: uniq && uniq.id,
      partySame: sameFields(partyUnk, partyUnknown),
      boxSame: sameFields(boxUnk, boxUnknown),
      uniqSame: JSON.stringify(uniq) === JSON.stringify(unique),
      uniqueIds: new Set(ids).size === ids.length,
      stable: JSON.stringify(once.party.map((p) => p.id).concat(once.box.map((p) => p.id)))
        === JSON.stringify(twice.party.map((p) => p.id).concat(twice.box.map((p) => p.id))),
      counts: { party: once.party.length, box: once.box.length },
    };
  });
  expect(report.v).toBe(2);
  expect(report.orphans).toEqual([]);
  expect(report.counts).toEqual({ party: 2, box: 2 });
  expect(report.keptId).toBe('sameid01');
  expect(report.partyId).toMatch(/^[a-z0-9]{8}$/);
  expect(report.boxId).toMatch(/^[a-z0-9]{8}$/);
  expect(report.partyId).not.toBe('sameid01');
  expect(report.boxId).not.toBe(report.partyId);
  expect(report.boxId).not.toBe('sameid01');
  expect(report.uniqId).toBe('uniqzz99');
  expect(report.partySame).toBe(true);
  expect(report.boxSame).toBe(true);
  expect(report.uniqSame).toBe(true);
  expect(report.uniqueIds).toBe(true);
  expect(report.stable).toBe(true);
});

const LINES = {
  skink: { type: 'EMBER', tiles: 'grass', names: ['Tindlet', 'Cinderskink', 'Kilncrest'], halo: false,
    base: { 'skink/0': { hp: 39, atk: 60, def: 42, spd: 51 }, 'skink/1': { hp: 52, atk: 80, def: 56, spd: 68 }, 'skink/2': { hp: 65, atk: 100, def: 70, spd: 85 } } },
  otter: { type: 'FROST', tiles: 'shore', names: ['Rimelet', 'Frostrill', 'Spraymane'], halo: false,
    base: { 'otter/0': { hp: 48, atk: 51, def: 42, spd: 51 }, 'otter/1': { hp: 64, atk: 68, def: 56, spd: 68 }, 'otter/2': { hp: 80, atk: 85, def: 70, spd: 85 } } },
  owl: { type: 'SHADE', tiles: 'woods', names: ['Hushlet', 'Quillhush', 'Vesperowl'], halo: true,
    base: { 'owl/0': { hp: 45, atk: 48, def: 36, spd: 63 }, 'owl/1': { hp: 60, atk: 64, def: 48, spd: 84 }, 'owl/2': { hp: 75, atk: 80, def: 60, spd: 105 } } },
  snail: { type: 'STONE', tiles: 'woods', names: ['Lichlet', 'Screeback', 'Cairnshell'], halo: false,
    base: { 'snail/0': { hp: 57, atk: 42, def: 63, spd: 30 }, 'snail/1': { hp: 76, atk: 56, def: 84, spd: 40 }, 'snail/2': { hp: 95, atk: 70, def: 105, spd: 50 } } },
};

test('twelve Hushwater forms join the journal and a holder battle names Tindlet', async ({ page }) => {
  await boot(page, fieldSave({ 'story.cobble_end': true, 'story.hw_reached': true }));
  const info = await page.evaluate((lines) => {
    const ids = PPSave.SPECIES_IDS.slice();
    const journal = SPECIES.reduce((n, sp) => n + (sp.npcOnly ? 0 : sp.stages.length), 0);
    const forms = {};
    for (const id of Object.keys(lines)) {
      const sp = SPECIES.find((s) => s.id === id);
      forms[id] = {
        type: sp.type, tiles: sp.tiles, halo: !!sp.uiHalo,
        names: sp.stages.map((st) => st.name),
        base: Object.fromEntries([0, 1, 2].map((k) => [id + '/' + k, BASE_STATS[id + '/' + k]])),
        learn: [0, 1, 2].map((k) => (LEARNSETS[id + '/' + k] || []).map((row) => row.slice())),
        halves: sp.stages.map((st) => st.half && st.half.length === 16 && st.half.every((row) => row.length === 8)),
      };
    }
    return {
      v: PixelPets.state.v,
      ids, last: ids[ids.length - 1], forms: PPSave.FORM_IDS.length, journal,
      fetchAt: ids.indexOf('fetch'), formsOut: forms,
      rope: (MAPDATA.detail_hushwater.maps.hw_falls.objs.find((o) => o.id === 'hw_stair_rope') || {}).x,
      arrive: (MAPDATA.detail_hushwater.maps.hw_falls.objs.find((o) => o.id === 'hw_arrive_w') || {}).x,
    };
  }, LINES);
  expect(info.v).toBe(2);
  expect(info.ids).toHaveLength(20);
  expect(info.fetchAt).toBe(15);
  expect(info.last).toBe('snail');
  expect(info.ids.slice(-4)).toEqual(['skink', 'otter', 'owl', 'snail']);
  expect(info.forms).toBe(60);
  expect(info.journal).toBe(57);
  expect(info.arrive).toBe(2);
  expect(info.rope).toBe(11);
  for (const [id, want] of Object.entries(LINES)) {
    expect(info.formsOut[id].type, id).toBe(want.type);
    expect(info.formsOut[id].tiles, id).toBe(want.tiles);
    expect(info.formsOut[id].halo, id).toBe(want.halo);
    expect(info.formsOut[id].names, id).toEqual(want.names);
    expect(info.formsOut[id].base, id).toEqual(want.base);
    expect(info.formsOut[id].halves, id).toEqual([true, true, true]);
    expect(info.formsOut[id].learn[0], id).toHaveLength(9);
    expect(info.formsOut[id].learn[1].length, id).toBeGreaterThan(0);
    expect(info.formsOut[id].learn[2][1], id).toEqual([27, 'full_tilt']);
  }
  expect(info.formsOut.snail.learn[0][4]).toEqual([12, 'undertow']);
  expect(info.formsOut.snail.learn[1][0]).toEqual([0, 'boulder_drop']);

  if (page.viewportSize().width === 390) {
    const dir = artifactsDir('screenshots');
    await page.evaluate(() => PixelPets.setFlag('story.unlock_phone', true));
    if (await page.locator('#unlockCard').isVisible()) await page.locator('#unlockSkip').click();
    await expect(page.locator('#unlockCard')).toBeHidden();
    await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.id = 'hwSpecies';
      c.width = 390;
      c.height = 312;
      c.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:390px;height:312px;background:#1a1c2c';
      const g = c.getContext('2d');
      g.fillStyle = '#1a1c2c';
      g.fillRect(0, 0, 390, 312);
      g.font = '12px sans-serif';
      g.textAlign = 'center';
      const ring = (src) => {
        const c = document.createElement('canvas');
        c.width = c.height = 18;
        const cg = c.getContext('2d');
        const d = src.getContext('2d').getImageData(0, 0, 18, 18).data;
        const A = (x, y) => x >= 0 && y >= 0 && x < 18 && y < 18 && d[(y * 18 + x) * 4 + 3] > 0;
        cg.fillStyle = PAL.h;
        for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) {
          if (!A(x, y) && (A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1))) cg.fillRect(x, y, 1, 1);
        }
        cg.drawImage(src, 0, 0);
        return c;
      };
      ['skink', 'otter', 'owl', 'snail'].forEach((id, row) => {
        const sp = SPECIES.find((s) => s.id === id);
        for (let st = 0; st < 3; st++) {
          const stage = sp.stages[st];
          let img = buildSprite(stage.half, stage.col, 'normal');
          if (sp.uiHalo) img = ring(img);
          const x = 28 + st * 124;
          const y = 10 + row * 76;
          g.imageSmoothingEnabled = false;
          g.drawImage(img, x, y, 54, 54);
          g.fillStyle = '#f4f4f4';
          g.fillText(stage.name, x + 27, y + 68);
        }
      });
      document.body.appendChild(c);
    });
    await page.locator('#hwSpecies').screenshot({ path: path.join(dir, 'hushwater-species-390.png') });
    await page.evaluate(() => document.querySelector('#hwSpecies').remove());
    expect(await page.evaluate(() => {
      PixelPets.goto('hw_rim', 21, 12, 'down');
      PixelPets.clearWild();
      PixelPets.battle.textMs = 1;
      return PixelPets.forceTrainer('hw_climber');
    })).toBe(true);
    await page.waitForFunction(() => {
      const b = PixelPets.debugSnapshot().battle;
      const name = document.querySelector('#btFoeName') && document.querySelector('#btFoeName').textContent;
      return !!(b && b.state === 'CHOOSE' && name && name.includes('Tindlet'));
    });
    await expect(page.locator('#btFoeName')).toContainText('Tindlet');
    await page.locator('#ovBattle .bt-inner').screenshot({ path: path.join(dir, 'hushwater-battle-390.png') });
    await page.evaluate(() => PixelPets.winBattle());
  }
});
