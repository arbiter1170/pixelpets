/* LOOK_LOCK. Vincent (Nov 4, 2026): "We need to have a test in place that makes sure other NPCs do not resemble Rook, Mom,
   Lizzy, Ilse, the President, etc. Their style should be locked down." data/look_lock.json holds the locked cast, each one's
   signature (the recorded look and a hash of its drawn frames), the similarity rule and the known exceptions.
   (a) Lock: every locked look still matches its signature, and every NPC carrying a locked name wears its own look.
   (b) Lookalike: no other look or NPC shares a locked signature (rule below, settings in the json).
   (c) Palette lock, AGENTS rule 11: the on-duty Keeper and Glimmerwell NPCs stay in their scheme, and nobody outside them
       wears a uniform coat, a faction-only piece or a reference look.
   (d) Every look an NPC names exists (Route 4's Keepers once drew as villager), and retired looks stay defined and unworn.
   A clash that is already known is an exception in the json, each with its follow-up TODO, so the test is green and the
   list stays visible. An exception that no longer clashes fails too, so the list never goes stale.
   Similarity rule, applied to every look that is not the locked character's own:
     same hair:   same hair style and hair colour, plus the same top colour or the same (real) accessory;
     same outfit: same garment, top colour, trim and accessory, where the accessory or the fixed-colour swap is not empty;
     pixels:      drawn frames (down, up, right) agree on at least rule.pixel_threshold of their opaque pixels;
     mark:        a trait set the json names as the character's own (Rook's spiky orange hair, Lizzy's flower clip).
   cast[].shares_outfit names looks that wear the character's outfit set by a settled call (D2273: Juniper keeps the
   Associate coat and bag, Tobin keeps `associate`); only the same-outfit reason is waived for them, the rest still runs.
   A shared short brown cut or a green tunic alone never fails. The game is read only, through an eval hook on a served copy
   of game.js (as tests/people_looks_28.spec.js does); nothing is drawn for the player. Data checks run at 390; a light
   pass at every width checks what npcLook draws for each locked NPC. Save stays pixelpets.save.v2 with v 2, unchanged. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const LOCK = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'look_lock.json'), 'utf8'));
const CAST = LOCK.cast.filter(c => !c.pending);
const FACINGS = ['down', 'up', 'right', 'left'];

function save() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.settings.textSpeed = 'fast';
  s.settings.tips = false;
  s.flags['story.early_done'] = true;
  return s;
}

const BOOT_HOOK = 'try {\n  boot();\n';
async function exposeInternals(page) {
  await page.route('**/game.js*', async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    const at = body.indexOf(BOOT_HOOK);
    if (at >= 0 && body.indexOf(BOOT_HOOK, at + 1) < 0) body = body.slice(0, at) + 'window.__ll = { ev: s => eval(s) };\n' + body.slice(at);
    await route.fulfill({ status: 200, body, headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
  });
}
const inGame = (page, fn, arg) => page.evaluate(([src, a]) => window.__ll.ev('(' + src + ')')(a), [fn.toString(), arg === undefined ? null : arg]);

// hccity=2 (debug only) also merges the High Charity preview cast, so its people are checked too.
async function boot(page) {
  await exposeInternals(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1&hccity=2');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.BUILD);
  expect(await page.evaluate(() => typeof window.__ll), 'read hook: boot() line in game.js moved').toBe('object');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await inGame(page, () => { save(); return true; });   // the fixture is normalised on boot; compare from the game's own save
}

async function saveShape(page) {
  return page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: raw.v, keys: Object.keys(raw).sort(), flags: Object.keys(raw.flags).sort(), look: raw.player && raw.player.look };
  });
}

// Everything that can put a person on screen: map objects (resolved as npcLook does), scene casts, castAt casts and the
// speaker portraits (LOOK_OF_NAME). Plus every look, its frames for the pixel rule, and a hash of each locked look's frames.
async function collect(page, lockedKeys) {
  return inGame(page, (keys) => {
    const wearers = [];
    for (const [mid, m] of Object.entries(WORLD)) for (const o of m.objs || []) {
      if (!o || (o.kind !== 'npc' && o.kind !== 'trainer') || o.pet) continue;
      const key = o.look || (o.kind === 'trainer' ? (HOLDER_LOOK[o.id] || 'holder') : LOOK_OF_NAME[o.name]) || 'villager';
      const name = o.name || (o.kind === 'trainer' && TRAINERS[o.id] && TRAINERS[o.id].name) || null;
      wearers.push({ src: 'map', where: mid, id: o.id, name, key });
    }
    for (const [sc, list] of Object.entries(SCENE_CAST)) for (const c of list) if (c.look) wearers.push({ src: 'cast', where: sc, id: c.id, name: c.name, key: c.look });
    for (const [id, c] of Object.entries(CAST_AT_LOOK)) if (c && c.look) wearers.push({ src: 'castAt', where: 'castAt', id, name: c.name || null, key: c.look });
    for (const [n, k] of Object.entries(LOOK_OF_NAME)) if (typeof k === 'string' && NPC_LOOKS[k]) wearers.push({ src: 'speaker', where: 'portrait', id: n, name: n, key: k });
    const looks = {};
    for (const [k, v] of Object.entries(NPC_LOOKS)) if (k !== 'player' && v && typeof v === 'object') looks[k] = v;
    const grids = {};
    for (const k of Object.keys(looks)) grids[k] = ['down', 'up', 'right'].map(f => keeperGrid(looks[k], f, 0).join(''));
    const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
    const hash = {};
    for (const k of keys) if (looks[k]) hash[k] = fnv(['down', 'up', 'right', 'left'].map(f => [0, 1].map(fr => keeperGrid(looks[k], f, fr).join('/')).join('|')).join('#'));
    return { wearers, looks, grids, hash, holder: Object.assign({}, HOLDER_LOOK) };
  }, lockedKeys);
}

// ---- pure rule code (unit-tested below) ----
const canon = v => { const o = {}; for (const k of Object.keys(v || {}).sort()) if (k[0] !== '_') o[k] = v[k]; return o; };
const acc = l => (l && l.accessory) || 'none';
const extraOf = l => JSON.stringify(canon((l && l.extra) || {}));
const traits = l => [l.skin, l.hair, l.hairCol, l.outfit, l.outfitCol, l.accent, acc(l)].join(' ') + (l.extra ? ' extra' + extraOf(l) : '');
function pixelSim(a, b) {
  let same = 0, tot = 0;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < a[i].length; j++) {
    if (a[i][j] === '.' && b[i][j] === '.') continue;
    tot++; if (a[i][j] === b[i][j]) same++;
  }
  return tot ? same / tot : 0;
}
function markHit(mark, l) {
  return Object.entries(mark).every(([f, v]) => f === 'extra' ? extraOf(l) === JSON.stringify(canon(v)) : (f === 'accessory' ? acc(l) : l[f]) === v);
}
// Why look b resembles locked look a (empty = it doesn't).
function resemble(a, b, opts) {
  const why = [];
  if (a.hair === b.hair && a.hairCol === b.hairCol) {
    if (a.outfitCol === b.outfitCol) why.push('same hair (' + a.hair + ' ' + a.hairCol + ') and top colour ' + a.outfitCol);
    else if (acc(a) !== 'none' && acc(a) === acc(b)) why.push('same hair (' + a.hair + ' ' + a.hairCol + ') and ' + acc(a));
  }
  if (a.outfit === b.outfit && a.outfitCol === b.outfitCol && a.accent === b.accent && acc(a) === acc(b) && extraOf(a) === extraOf(b)
      && (acc(a) !== 'none' || extraOf(a) !== '{}')) why.push('same outfit set (' + [a.outfit, a.outfitCol, a.accent, acc(a)].join(' ') + ')');
  if (opts.gridA && opts.gridB) {
    const s = pixelSim(opts.gridA, opts.gridB);
    if (s >= opts.threshold) why.push('pixels ' + Math.round(s * 100) + '% alike');
  }
  for (const m of opts.marks || []) if (markHit(m, b)) why.push('signature mark ' + JSON.stringify(m));
  return why;
}
const who = (wearers, key) => {
  const seen = new Set();
  for (const w of wearers) if (w.key === key && w.src !== 'speaker') seen.add((w.name || w.id) + ' (' + w.id + ' @ ' + w.where + ')');
  return seen.size ? [...seen].slice(0, 4).join(', ') + (seen.size > 4 ? ' +' + (seen.size - 4) : '') : 'no NPC yet';
};

function lookalikeClashes(d) {
  const out = [];
  for (const c of CAST) {
    for (const k of c.keys) {
      const a = d.looks[k]; if (!a) continue;
      for (const [o, b] of Object.entries(d.looks)) {
        if (c.keys.includes(o)) continue;
        const why = resemble(a, b, { gridA: d.grids[k], gridB: d.grids[o], threshold: LOCK.rule.pixel_threshold, marks: c.marks })
          .filter(r => !((c.shares_outfit || []).includes(o) && r.startsWith('same outfit set')));
        if (why.length) out.push({ id: c.id + '|lookalike|' + o, msg: c.label + ' (' + k + ': ' + traits(a) + ') ~ look ' + o + ' (' + traits(b) + '), worn by ' + who(d.wearers, o) + ': ' + why.join('; ') });
      }
    }
    for (const w of d.wearers) {
      if (!c.keys.includes(w.key) || c.names.includes(w.name)) continue;
      out.push({ id: c.id + '|worn_by|' + (w.name || w.id), msg: (w.name || w.id) + ' (' + w.src + ' ' + w.id + ' @ ' + w.where + ') wears ' + w.key + ', ' + c.label + "'s own look (" + traits(d.looks[w.key]) + ')' });
    }
  }
  return out;
}

function lockClashes(d) {
  const out = [];
  for (const c of CAST) {
    if (c.keys.length > 1) out.push({ id: c.id + '|split|' + c.keys.join('+'), msg: c.label + ' is drawn with ' + c.keys.length + ' different looks: ' + c.keys.map(k => k + ' (' + (d.looks[k] ? traits(d.looks[k]) : 'missing') + ')').join(' vs ') });
    for (const k of c.keys) {
      const got = d.looks[k];
      if (!got) { out.push({ id: c.id + '|missing|' + k, msg: c.label + ': look ' + k + ' is not in NPC_LOOKS' }); continue; }
      if (JSON.stringify(canon(got)) !== JSON.stringify(canon(c.signature[k])))
        out.push({ id: c.id + '|drift|' + k, msg: c.label + ' look ' + k + ' changed: locked ' + traits(c.signature[k]) + ', now ' + traits(got) });
      else if (d.hash[k] !== c.grid[k])
        out.push({ id: c.id + '|art|' + k, msg: c.label + ' look ' + k + ' draws different pixels (frames hash ' + d.hash[k] + ', locked ' + c.grid[k] + '): a hair, outfit or accessory grid it uses was redrawn' });
    }
    const named = d.wearers.filter(w => c.names.includes(w.name));
    if (!named.length) out.push({ id: c.id + '|unseen|', msg: c.label + ': no NPC, cast or portrait carries any of ' + c.names.join(', ') + ' (renamed? update data/look_lock.json)' });
    for (const w of named) if (!c.keys.includes(w.key))
      out.push({ id: c.id + '|wears|' + w.id, msg: c.label + ' as ' + w.src + ' ' + w.id + ' @ ' + w.where + ' wears ' + w.key + ' (' + (d.looks[w.key] ? traits(d.looks[w.key]) : 'missing look') + '), not the locked ' + c.keys.join(' / ') });
  }
  return out;
}

function paletteClashes(d) {
  const P = LOCK.palette, out = [];
  const inScheme = (s, l) => s.top.includes(l.outfitCol) && s.trim.includes(l.accent)
    && s.buttons.includes(((l.extra || {}).o) || 'o') && !s.never.includes(acc(l));
  const lockedIds = new Set(), lockedNames = { keeper: new Set(), glimmer: new Set() };
  for (const [side, ids] of Object.entries(P.npcs)) for (const id of ids) {
    lockedIds.add(id);
    let keys = d.wearers.filter(w => w.src === 'map' && w.id === id);
    for (const w of keys) if (w.name) lockedNames[side].add(w.name);
    keys = keys.map(w => w.key);
    if (!keys.length && d.holder[id]) keys = [d.holder[id]];
    if (!keys.length) { out.push({ id: 'palette|missing|' + id, msg: 'locked ' + side + ' NPC ' + id + ' is not on any map or in HOLDER_LOOK' }); continue; }
    for (const k of new Set(keys)) {
      const l = d.looks[k];
      if (!l) { out.push({ id: 'palette|nolook|' + id, msg: side + ' NPC ' + id + ' wears ' + k + ', which is not in NPC_LOOKS' }); continue; }
      const ok = P.schemes[side].some(s => inScheme(P.sets[s], l));
      if (!ok) out.push({ id: 'palette|scheme|' + id, msg: side + ' NPC ' + id + ' wears ' + k + ' (' + traits(l) + '), outside the ' + P.schemes[side].join(' / ') + ' palette (top ' + l.outfitCol + ', trim ' + l.accent + ')' });
    }
  }
  const titled = (side, name) => !!name && (P.titles[side].some(t => new RegExp('\\b' + t + '\\b').test(name)) || lockedNames[side].has(name));
  for (const w of d.wearers) {
    if (w.src === 'speaker' || lockedIds.has(w.id)) continue;
    const l = d.looks[w.key]; if (!l) continue;
    const label = (w.name || w.id) + ' (' + w.src + ' ' + w.id + ' @ ' + w.where + ')';
    for (const u of P.uniform_core) if (!titled(u.side, w.name) && Object.entries(u.look).every(([f, v]) => l[f] === v))
      out.push({ id: 'palette|uniform|' + w.id, msg: label + ' has no ' + u.side + ' role but wears ' + w.key + ' (' + traits(l) + '), the ' + u.label });
    const own = P.faction_only[acc(l)];
    if (own && !titled(own, w.name)) out.push({ id: 'palette|piece|' + w.id, msg: label + ' wears the ' + own + '-only ' + acc(l) + ' (' + w.key + ')' });
    if (P.reference.includes(w.key)) out.push({ id: 'palette|reference|' + w.id, msg: label + ' wears the reference look ' + w.key + ', which no NPC may wear' });
  }
  return out;
}

// Splits found clashes into new ones (fail) and stale exceptions (fail too); known ones pass and stay listed.
function judge(found, section) {
  const ex = LOCK.exceptions.filter(e => e.check === section);
  const known = new Set(ex.map(e => e.clash));
  const seen = new Set(found.map(f => f.id));
  const uniq = [...new Map(found.map(f => [f.id, f])).values()];
  return {
    fresh: uniq.filter(f => !known.has(f.id)).map(f => f.msg + '  [exception id: ' + f.id + ']'),
    stale: ex.filter(e => !seen.has(e.clash)).map(e => e.clash + ' no longer clashes: remove it from data/look_lock.json exceptions (' + e.todo + ')'),
  };
}

const lockedKeys = () => [...new Set(CAST.flatMap(c => c.keys))];
async function run(page, testInfo) {
  test.skip(testInfo.project.name !== '390', 'data checks run once, at 390');
  await boot(page);
  const before = await saveShape(page);
  const d = await collect(page, lockedKeys());
  const after = await saveShape(page);
  expect(after).toEqual(before);
  expect(after.v).toBe(2);
  return d;
}

test('look_lock.json is well formed: every locked character has a signature, a frames hash and names', () => {
  expect(LOCK._about, 'the comment line says what the file guards').toMatch(/LOOK_LOCK/);
  const ids = LOCK.cast.map(c => c.id);
  expect(new Set(ids).size, 'cast ids are unique').toBe(ids.length);
  for (const id of ['rook', 'mom', 'lizzy', 'ilse', 'president', 'governor']) expect(ids, 'Vincent named ' + id).toContain(id);
  for (const c of LOCK.cast) {
    expect(c.label && c.names.length, c.id + ' label and names').toBeTruthy();
    expect(c.seen_as, c.id + ' says what makes them recognisable').toBeTruthy();
    if (c.pending) { expect(c.keys, c.id + ' pending slot has no keys yet').toEqual([]); expect(c.todo).toBeTruthy(); continue; }
    expect(c.keys.length, c.id + ' keys').toBeGreaterThan(0);
    for (const k of c.keys) { expect(c.signature[k], c.id + ' signature ' + k).toBeTruthy(); expect(c.grid[k], c.id + ' grid ' + k).toMatch(/^[0-9a-f]{8}$/); }
  }
  for (const e of LOCK.exceptions) for (const f of ['check', 'clash', 'todo', 'fix']) expect(e[f], 'exception ' + e.clash + ' needs ' + f).toBeTruthy();
});

test('the similarity rule catches a lookalike and passes ordinary townsfolk', () => {
  const rook = LOCK.cast.find(c => c.id === 'rook');
  const a = rook.signature.rook, o = { threshold: 1.1, marks: rook.marks };
  expect(resemble(a, Object.assign({}, a, { skin: '6', accent: 'y' }), o).length, 'same hair and hoodie colour').toBeGreaterThan(0);
  expect(resemble(a, { skin: '1', hair: 'spiky', hairCol: 'o', outfit: 'vest', outfitCol: 'g', accent: 'y' }, o).join(), 'his mark').toMatch(/signature mark/);
  expect(resemble(a, { skin: '4', hair: 'short', hairCol: 'd', outfit: 'tunic', outfitCol: 'g', accent: 'y' }, o), 'the villager').toEqual([]);
  expect(resemble(a, { skin: '3', hair: 'short', hairCol: 'd', outfit: 'hoodie', outfitCol: 'b', accent: 'w' }, o), 'same hoodie, other hair').toEqual([]);
  const g = ['..aa', '.bb.'], h = ['..aa', '.bc.'];
  expect(pixelSim(g, h)).toBeCloseTo(3 / 4);
  expect(resemble({ hair: 'x', outfit: 'coat', outfitCol: 'g', accent: 'y' }, { hair: 'z', outfit: 'coat', outfitCol: 'g', accent: 'y' }, { threshold: 1.1 }), 'a plain uniform coat alone is not a signature').toEqual([]);
});

test('(a) lock: every locked look matches its signature and every locked name wears it', async ({ page }, testInfo) => {
  const d = await run(page, testInfo);
  const r = judge(lockClashes(d), 'lock');
  expect(r.fresh, 'locked looks drifted').toEqual([]);
  expect(r.stale, 'stale lock exceptions').toEqual([]);
});

test('(b) lookalike: no other look or NPC shares a locked signature', async ({ page }, testInfo) => {
  const d = await run(page, testInfo);
  const r = judge(lookalikeClashes(d), 'lookalike');
  expect(r.fresh, 'new lookalikes').toEqual([]);
  expect(r.stale, 'stale lookalike exceptions').toEqual([]);
});

test('(c) palette lock: faction NPCs stay in their scheme and nobody else copies a uniform (rule 11)', async ({ page }, testInfo) => {
  const d = await run(page, testInfo);
  const r = judge(paletteClashes(d), 'palette');
  expect(r.fresh, 'palette lock breaches').toEqual([]);
  expect(r.stale, 'stale palette exceptions').toEqual([]);
});

// LOOK_LOCK fixes (Nov 4, 2026): Route 4's Keepers named a look that did not exist and drew as `villager`, unseen by (a)-(c).
// Every look a map NPC, cast or castAt names must be in NPC_LOOKS (no exceptions). A retired key stays defined, since saves
// and old data may name it, but nobody wears it.
test('(d) every look an NPC names exists, and retired looks stay defined and unworn', async ({ page }, testInfo) => {
  const d = await run(page, testInfo);
  const missing = [...new Set(d.wearers.filter(w => w.src !== 'speaker' && !d.looks[w.key]).map(w => w.key + ' (' + w.src + ' ' + w.id + ' @ ' + w.where + ')'))];
  expect(missing, 'NPCs naming a look that is not in NPC_LOOKS (they draw as villager)').toEqual([]);
  for (const [k, why] of Object.entries(LOCK.retired || {})) {
    if (k[0] === '_') continue;
    expect(d.looks[k], 'retired look ' + k + ' stays defined (' + why + ')').toBeTruthy();
    expect(d.wearers.filter(w => w.key === k).map(w => w.src + ' ' + w.id), 'nobody wears retired look ' + k).toEqual([]);
  }
});

test('light pass: npcLook draws each locked NPC in its locked look, modern controls, save unchanged', async ({ page }) => {
  await boot(page);
  const before = await saveShape(page);
  const want = Object.fromEntries(CAST.map(c => [c.id, { names: c.names, keys: c.keys }]));
  const res = await inGame(page, (want) => {
    const bad = [], seen = {};
    for (const m of Object.values(WORLD)) for (const o of m.objs || []) {
      if (!o || o.kind !== 'npc' || o.pet) continue;
      for (const [id, w] of Object.entries(want)) {
        if (!w.names.includes(o.name)) continue;
        seen[id] = (seen[id] || 0) + 1;
        const drawn = npcLook(o);
        const base = w.keys.map(k => NPC_LOOKS[k]);
        // Rook's lanyard is a story prop built from his own look (rookWithLanyard); his hair and colours stay his.
        const ok = base.includes(drawn) || (id === 'rook' && drawn && drawn.hair === base[0].hair && drawn.hairCol === base[0].hairCol && drawn.outfitCol === base[0].outfitCol);
        if (!ok && !(o.look && !w.keys.includes(o.look))) bad.push(id + ' ' + o.id);
      }
    }
    return { bad, seen, controls: S.settings.controls };
  }, want);
  expect(res.bad, 'drawn look is not the locked one').toEqual([]);
  expect(res.controls).toBe('modern');
  expect(Object.keys(res.seen).length, 'locked NPCs on the maps').toBeGreaterThan(5);
  const after = await saveShape(page);
  expect(after).toEqual(before);
  expect(after.v).toBe(2);
});
