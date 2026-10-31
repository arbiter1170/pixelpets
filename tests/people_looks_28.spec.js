/* PEOPLE_LOOKS_28. Sprites' 28 approved people looks (preview v2 2026-10-29, Vincent approved Oct 29), main looks only,
   plus the brimhat accessory. Holders resolve through HOLDER_LOOK (was TRAINER_LOOK; kind 'trainer' and 'trainer.<id>'
   flags stay), named people through o.look or LOOK_OF_NAME. Brinewick's Lantern Host and Harbour Clerk get o.look on the
   map object, so their speakers entry (the name portrait) stays villager. Widths are the Playwright projects
   (320, 375, 390). Save stays pixelpets.save.v2 with v 2; this build adds no save field. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

// looks.json `look` per key (main look; alts are not wired).
const LOOKS = {
  kitekid_pia: { id: 'route1_pia', map: 'route1', look: { skin: '1', hair: 'pony', hairCol: 'o', outfit: 'hoodie', outfitCol: 'y', accent: 'r', accessory: 'scarf' } },
  beachcomber_tam: { id: 'route1_tam', map: 'route1', look: { skin: '5', hair: 'curls', hairCol: 'd', outfit: 'vest', outfitCol: 'c', accent: 'o', accessory: 'brimhat' } },
  mothwatch_ollie: { id: 'route1_ollie', map: 'route1', look: { skin: '3', hair: 'bob', hairCol: 'y', outfit: 'sweater', outfitCol: 'n', accent: 'y', accessory: 'glasses' } },
  rockhound_nell: { id: 'r2_rockhound', map: 'route2', look: { skin: '4', hair: 'bun', hairCol: 'r', outfit: 'tunic', outfitCol: 'm', accent: 'y', accessory: 'goggles' } },
  skipper_teo: { id: 'r2_skipper', map: 'route2', look: { skin: '2', hair: 'buzz', hairCol: 'd', outfit: 'tunic', outfitCol: 'c', accent: 'w', accessory: 'cap' } },
  stargazer_tilda: { id: 'r2_stargazer', map: 'route2', look: { skin: '6', hair: 'long', hairCol: 'h', outfit: 'dress', outfitCol: 'n', accent: 's', accessory: 'glasses' } },
  sketcher_lark: { id: 'q_sketcher', map: 'cobble_quarry', look: { skin: '1', hair: 'bob', hairCol: 'n', outfit: 'sweater', outfitCol: 'p', accent: 'y', accessory: 'satchel' } },
  mason_hobb: { id: 'q_mason', map: 'cobble_quarry', look: { skin: '5', hair: 'short', hairCol: 'w', outfit: 'vest', outfitCol: 'd', accent: 'o' } },
  sweeper_bix: { id: 'h2_sweeper', map: 'cc_hall_in', look: { skin: '3', hair: 'pony', hairCol: 'y', outfit: 'tunic', outfitCol: 'o', accent: 'w', accessory: 'goggles' } },
  cairn_cass: { id: 'h2_builder', map: 'cc_hall_in', look: { skin: '6', hair: 'bob', hairCol: 'y', outfit: 'vest', outfitCol: 't', accent: 'w' } },
  climber_fenna: { id: 'hw_climber', map: 'hw_rim', look: { skin: '2', hair: 'pony', hairCol: 'n', outfit: 'tunic', outfitCol: 'r', accent: 'w', accessory: 'satchel' } },
  angler_nils: { id: 'hw_angler', map: 'hw_cut', look: { skin: '4', hair: 'short', hairCol: 'o', outfit: 'vest', outfitCol: 'b', accent: 'y', accessory: 'brimhat' } },
  owlwatch_ottilie: { id: 'hw_owlwatch', map: 'hw_falls', look: { skin: '5', hair: 'long', hairCol: 'd', outfit: 'coat', outfitCol: 'm', accent: 'y', accessory: 'glasses' } },
  keeper_scout: { id: 'hw_scout', map: 'hw_cut', look: { skin: '1', hair: 'pony', hairCol: 'd', outfit: 'coat', outfitCol: 'g', accent: 'y', accessory: 'brimhat' } },
  lantern_della: { id: 'hm_lantern_host', map: 'hm_lantern_in', look: { skin: '3', hair: 'bun', hairCol: 'n', outfit: 'vest', outfitCol: 'r', accent: 'y' } },
  lantern_garnet: { id: 'cc_lantern_host', map: 'cc_lantern_in', look: { skin: '6', hair: 'curls', hairCol: 'h', outfit: 'vest', outfitCol: 'r', accent: 'y' } },
  lantern_ines: { id: 'hc_lantern_host', map: 'hc_lantern_in', look: { skin: '1', hair: 'long', hairCol: 'o', outfit: 'vest', outfitCol: 'r', accent: 'y', accessory: 'glasses' } },
  lantern_brine: { id: 'bw_lantern_host', map: 'bw_lantern_in', look: { skin: '4', hair: 'short', hairCol: 'w', outfit: 'vest', outfitCol: 'r', accent: 'y' } },
  neighbour_hattie: { id: 'hattie', map: 'hearthmoor', look: { skin: '4', hair: 'bun', hairCol: 'h', outfit: 'sweater', outfitCol: 'r', accent: 'w', accessory: 'scarf' } },
  orchard_odile: { id: 'odile', map: 'fernbrook', look: { skin: '2', hair: 'curls', hairCol: 'd', outfit: 'dress', outfitCol: 'b', accent: 'y', accessory: 'scarf' } },
  old_miner: { id: 'cc_miner', map: 'cobblecrest', look: { skin: '3', hair: 'short', hairCol: 'w', outfit: 'coat', outfitCol: 'd', accent: 'y' } },
  kid_pim: { id: 'pim', map: 'cobblecrest', look: { skin: '5', hair: 'curls', hairCol: 'd', outfit: 'hoodie', outfitCol: 'o', accent: 'w' } },
  keeper_amos: { id: 'amos', map: 'fb_lantern_in', look: { skin: '6', hair: 'short', hairCol: 'w', outfit: 'coat', outfitCol: 'g', accent: 'y', accessory: 'glasses' } },
  broker_mara: { id: 'sm_mara', map: 'sm_den', look: { skin: '1', hair: 'bob', hairCol: 'k', outfit: 'coat', outfitCol: 'd', accent: 'r', accessory: 'glasses' } },
  crate_jed: { id: 'sm_jed', map: 'sm_tunnel', look: { skin: '4', hair: 'short', hairCol: 'o', outfit: 'sweater', outfitCol: 'b', accent: 'y' } },
  watch_ken: { id: 'sm_ken', map: 'sm_hold', look: { skin: '6', hair: 'buzz', hairCol: 'd', outfit: 'coat', outfitCol: 'g', accent: 'y' } },
  stockup_kit: { id: 'ht_kit', map: 'fb_heights', look: { skin: '3', hair: 'pony', hairCol: 'd', outfit: 'vest', outfitCol: 'c', accent: 'w', accessory: 'satchel' } },
  harbour_clerk: { id: 'bw_clerk', map: 'brinewick', look: { skin: '5', hair: 'bun', hairCol: 'k', outfit: 'vest', outfitCol: 't', accent: 'w', accessory: 'glasses' } },
};
// brimhat rows 0-4 (rows 5-15 are empty), the same in both frames; left mirrors right.
const BRIMHAT_TOP = {
  down: ['................', '.....rrrrrr.....', '....tttttttt....', '..rrrrrrrrrrrr..', '...rrrrrrrrrr...'],
  right: ['................', '.....rrrrrr.....', '....tttttttt....', '.rrrrrrrrrrrrrr.', '...rrrrrrrrrr...'],
  up: ['................', '.....rrrrrr.....', '....tttttttt....', '..rrrrrrrrrrrr..', '...rrrrrrrrrr...'],
};
const HAIRS = ['short', 'long', 'spiky', 'bun', 'bob', 'pony', 'curls', 'buzz'];
const FACINGS = ['down', 'right', 'up', 'left'];

function save() {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.textSpeed = 'fast';
  s.flags['story.early_done'] = true;
  s.flags['story.phone_got'] = true;
  return s;
}

// game.js is one closure. A served copy (the file on disk is unchanged) adds an eval hook before boot(),
// as tests/intro_cutscene.spec.js does, so the spec can read HOLDER_LOOK, NPC_LOOKS, LOOK_OF_NAME and npcLook.
const BOOT_HOOK = 'try {\n  boot();\n';
async function exposeInternals(page) {
  await page.route('**/game.js*', async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    const at = body.indexOf(BOOT_HOOK);
    if (at >= 0 && body.indexOf(BOOT_HOOK, at + 1) < 0) body = body.slice(0, at) + 'window.__pl28 = { ev: s => eval(s) };\n' + body.slice(at);
    await route.fulfill({ status: 200, body, headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
  });
}
const inGame = (page, fn, arg) => page.evaluate(([src, a]) => window.__pl28.ev('(' + src + ')')(a), [fn.toString(), arg === undefined ? null : arg]);

async function boot(page) {
  await exposeInternals(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.BUILD);
  expect(await page.evaluate(() => typeof window.__pl28), 'read hook: boot() line in game.js moved').toBe('object');
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function saveShape(page) {
  return page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: raw.v, keys: Object.keys(raw).sort(), flags: Object.keys(raw.flags).sort() };
  });
}

// Every map object's look key, through the same resolver npcLook uses (game.js npcLook).
async function resolved(page) {
  return inGame(page, () => {
    const out = [];
    for (const [mid, m] of Object.entries(WORLD)) for (const o of m.objs || []) {
      if (!o || (o.kind !== 'npc' && o.kind !== 'trainer') || o.pet) continue;
      const key = o.look || (o.kind === 'trainer' ? (HOLDER_LOOK[o.id] || 'holder') : LOOK_OF_NAME[o.name]) || 'villager';
      const drawn = npcLook(o);
      out.push({ map: mid, id: o.id, kind: o.kind, name: o.name || null, key, same: drawn === NPC_LOOKS[key], drawn });
    }
    return out;
  });
}

test('each of the 28 people resolves to its own new look, with the looks.json fields', async ({ page }) => {
  await boot(page);
  const before = await saveShape(page);
  expect(await inGame(page, () => typeof HOLDER_LOOK === 'object' && typeof TRAINER_LOOK === 'undefined')).toBe(true);
  const all = await resolved(page);
  const defs = await inGame(page, keys => Object.fromEntries(keys.map(k => [k, NPC_LOOKS[k] || null])), Object.keys(LOOKS));
  expect(Object.keys(LOOKS)).toHaveLength(28);
  for (const [key, want] of Object.entries(LOOKS)) {
    const fields = Object.assign({}, defs[key]);
    delete fields.extra;
    expect(fields, key + ' definition').toEqual(want.look);
    const hits = all.filter(r => r.key === key);
    expect(hits.map(r => r.map + ':' + r.id), key + ' is worn by its NPC only').toEqual([want.map + ':' + want.id]);
    expect(hits[0].same, key + ' drawn by npcLook').toBe(true);
  }
  const after = await saveShape(page);
  expect(after).toEqual(before);
  expect(after.v).toBe(2);
});

test('holders keep their data kind and their battle entry', async ({ page }) => {
  await boot(page);
  const ids = Object.values(LOOKS).map(l => l.id);
  const info = await inGame(page, ids => ids.map(id => { const o = objById(id); return { id, kind: o && o.kind, holder: HOLDER_LOOK[id] || null }; }), ids);
  const holders = info.filter(r => r.holder);
  expect(holders.map(r => r.id).sort()).toEqual(['h2_builder', 'h2_sweeper', 'hw_angler', 'hw_climber', 'hw_owlwatch', 'q_mason', 'q_sketcher',
    'r2_rockhound', 'r2_skipper', 'r2_stargazer', 'route1_ollie', 'route1_pia', 'route1_tam', 'sm_mara']);
  for (const r of holders) expect(r.kind, r.id).toBe('trainer');
  const battles = await inGame(page, ids => ids.filter(id => !TRAINERS[id]), holders.map(r => r.id));
  expect(battles, 'every holder keeps its TRAINERS entry').toEqual([]);
});

test('brimhat follows the strict hat rule over every hair, facing and frame', async ({ page }) => {
  await boot(page);
  const res = await inGame(page, ({ HAIRS, FACINGS, TOP }) => {
    const acc = KEEPER_ACCESSORIES.brimhat, errs = [];
    if (!acc) return { missing: true };
    const shape = {};
    for (const f of ['down', 'right', 'up']) shape[f] = [0, 1].map(i => acc[f][i].join('|'));
    const want = {};
    for (const f of ['down', 'right', 'up']) want[f] = TOP[f].concat(Array(11).fill('................')).join('|');
    for (const f of ['down', 'right', 'up']) for (const i of [0, 1]) if (shape[f][i] !== want[f]) errs.push('grid ' + f + i);
    const chars = new Set(['down', 'right', 'up'].flatMap(f => acc[f].flatMap(fr => fr.join('').split(''))));
    // layered compose with a tag per pixel (mirrors keeperGrid), so hair pixels can be told apart from the hat
    function layered(look, facing, frame) {
      const L = Object.assign({}, KEEPER_LOOKS.defaults, look), f = facing === 'left' ? 'right' : facing;
      const hair = KEEPER_HAIR[L.hair][f][frame];
      const layers = [['body', KEEPER_ART[f][frame]], ['outfit', KEEPER_OUTFITS[L.outfit][f][frame]], ['hair', hair]];
      const a = L.accessory && L.accessory !== 'none' ? KEEPER_ACCESSORIES[L.accessory] : null;
      if (a) layers.push(['acc', a[f][frame]]);
      const line = a && a.hatLine && a.hatLine[f], brim = line ? line[frame] : null, rows = [], tags = [];
      for (let y = 0; y < 16; y++) {
        let r = ''; const t = [];
        for (let x = 0; x < 16; x++) {
          let c = '.', tg = null;
          for (const [nm, g] of layers) { if (brim != null && nm === 'hair' && y < brim) continue; if (g[y][x] !== '.') { c = g[y][x]; tg = nm; } }
          r += c; t.push(tg);
        }
        if (facing === 'left') { r = r.split('').reverse().join(''); t.reverse(); }
        rows.push(r); tags.push(t);
      }
      return { rows, tags };
    }
    function holes(rows) {
      const seen = new Set(), q = [];
      for (let y = -1; y <= 16; y++) for (let x = -1; x <= 16; x++) if (y < 0 || x < 0 || y >= 16 || x >= 16) { q.push([x, y]); seen.add(x + ',' + y); }
      const open = (x, y) => x < 0 || y < 0 || x >= 16 || y >= 16 || rows[y][x] === '.';
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (nx < -1 || ny < -1 || nx > 16 || ny > 16 || seen.has(k) || !open(nx, ny)) continue; seen.add(k); q.push([nx, ny]); } }
      let n = 0; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (rows[y][x] === '.' && !seen.has(x + ',' + y)) n++;
      return n;
    }
    let checked = 0;
    for (const hair of HAIRS) for (const f of FACINGS) for (const i of [0, 1]) {
      const look = { skin: '3', hair, hairCol: 'p', outfit: 'coat', outfitCol: 't', accent: 'r', accessory: 'brimhat' };
      const { rows, tags } = layered(look, f, i);
      const game = keeperGrid(look, f, i), base = KEEPER_LOOKS.base;
      const recol = rows.map(r => r.split('').map(c => c).join(''));
      if (game.length !== 16) errs.push('keeperGrid ' + hair + f + i);
      let bottom = -1;
      for (let y = 0; y < 6; y++) if (tags[y].includes('acc')) bottom = y;
      if (bottom !== 4) errs.push(`bottom ${bottom} at ${hair} ${f}${i}`);
      for (let y = 0; y <= bottom; y++) for (let x = 0; x < 16; x++) {
        if (tags[y][x] === 'hair') errs.push(`hair at ${hair} ${f}${i} (${x},${y})`);
        if (tags[y][x] === 'body' && y < bottom) errs.push(`head through hat at ${hair} ${f}${i} (${x},${y})`);
      }
      const bare = layered(Object.assign({}, look, { accessory: 'none' }), f, i).rows;
      if (holes(rows) > holes(bare)) errs.push(`see-through gap at ${hair} ${f}${i}`);
      // the game's own grid shows the hat where the tags say so (r -> accent, t -> outfitCol)
      for (let y = 0; y < 5; y++) for (let x = 0; x < 16; x++) if (tags[y][x] === 'acc' && game[y][x] !== ({ r: look.accent, t: look.outfitCol })[rows[y][x]]) errs.push(`colour at ${hair} ${f}${i} (${x},${y})`);
      checked++;
    }
    return { errs, checked, chars: [...chars].sort().join(''), hatLine: acc.hatLine, inCreator: KEEPER_LOOKS.accessory.includes('brimhat') };
  }, { HAIRS, FACINGS, TOP: BRIMHAT_TOP });
  expect(res.missing).toBeUndefined();
  expect(res.checked).toBe(64);
  expect(res.errs).toEqual([]);
  expect(res.chars).toBe('.rt');
  expect(res.hatLine).toEqual({ down: [5, 5], right: [5, 5], up: [5, 5] });
  expect(res.inCreator).toBe(false);
});

test('Brinewick host and clerk are drawn with the new looks; the Lantern Host name portrait stays villager', async ({ page }) => {
  await boot(page);
  let before = null;   // a map change saves the full shape once; the looks add nothing to it
  for (const [map, id, key] of [['bw_lantern_in', 'bw_lantern_host', 'lantern_brine'], ['brinewick', 'bw_clerk', 'harbour_clerk']]) {
    await inGame(page, ([m, id]) => { const o = WORLD[m].objs.find(q => q.id === id); PixelPets.goto(m, o.x, o.y + 1, 'up'); }, [map, id]);
    await page.waitForFunction(m => PixelPets.mapInfo.id === m, map);
    if (!before) before = await saveShape(page);
    const r = await inGame(page, ([id, key]) => {
      const o = CUR.objs.find(q => q.id === id);
      return { here: !!o && PixelPets.mapInfo.objs.some(q => q.id === id), look: o && o.look, same: !!o && npcLook(o) === NPC_LOOKS[key],
        grid: JSON.stringify(PixelPets.lookGrid(id)) === JSON.stringify(keeperGrid(NPC_LOOKS[key], 'down', 0)) };
    }, [id, key]);
    expect(r, id).toEqual({ here: true, look: key, same: true, grid: true });
  }
  const names = await inGame(page, () => ({
    host: LOOK_OF_NAME['Lantern Host'], clerk: LOOK_OF_NAME['Harbour Clerk'],
    speakers: MD.detail_zz_brinewick.speakers['Lantern Host'] + '/' + MD.detail_zz_brinewick.speakers['Harbour Clerk'],
    rep: !!(window.PPRep && PPRep.entry('Lantern Host')),
  }));
  expect(names).toEqual({ host: 'villager', clerk: 'villager', speakers: 'villager/villager', rep: true });
  const after = await saveShape(page);
  expect(after.v).toBe(2);
  expect(after.keys).toEqual(before.keys);
});

test('kept_shared people still wear villager and rook', async ({ page }) => {
  await boot(page);
  const all = await resolved(page);
  const one = (map, id) => all.find(r => r.map === map && r.id === id);
  for (const [map, id] of [['cobblecrest', 'ally_a'], ['sm_tunnel', 'sm_lookouts'], ['sm_hold', 'sm_haulers']]) {
    const r = one(map, id);
    if (!r) continue;   // group-fight ids that are scene-only are checked through HOLDER_LOOK below
    expect(r.key, id).toBe('villager');
  }
  const shared = await inGame(page, () => ({ lookouts: HOLDER_LOOK.sm_lookouts, haulers: HOLDER_LOOK.sm_haulers, jedAlly: HOLDER_LOOK.sm_jed_ally,
    neighbour: LOOK_OF_NAME['Cobble Neighbour'], ally: (objById('ally_a') || {}).name || null }));
  expect(shared).toEqual({ lookouts: 'villager', haulers: 'villager', jedAlly: 'villager', neighbour: 'villager', ally: 'Cobble Neighbour' });
  const rook = all.filter(r => r.key === 'rook');
  expect(rook.length).toBeGreaterThan(0);
  for (const r of rook) {
    expect(r.name === 'Rook' || /rook/.test(r.id), r.map + ':' + r.id).toBe(true);
    expect([r.drawn.hair, r.drawn.hairCol, r.drawn.outfit, r.drawn.outfitCol], r.id).toEqual(['spiky', 'o', 'hoodie', 'b']);
  }
  const villagers = all.filter(r => r.key === 'villager').map(r => r.id);
  for (const want of Object.values(LOOKS)) expect(villagers, want.id).not.toContain(want.id);
});
