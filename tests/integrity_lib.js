/* Checks for the data-integrity specs. Players never load this file.
   Map merge follows game.js (WORLD / TILE_DEF). Wording covers player-visible lines only. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const STAT_KEYS = ['hp', 'atk', 'def', 'spd'];
// stats.js comments on the creature lines and on byte: stage totals 192 / 256 / 320.
// Stage 0 and stage 1 are the stage-2 line times 0.6 and 0.8, largest remainder.
const STAGE_TOTAL = [192, 256, 320];
const STAGE_RATIO = [0.6, 0.8, 1];
const DIALOG_TOKENS = ['name', 'player', 'pet', 'species', 'type', 'suggest', 'rival', 'rivalType'];
const BATTLE_TOKENS = DIALOG_TOKENS.concat(['trainer', 'foe', 'title']);
const STANDING_TOKENS = ['name', 'side', 'from', 'to', 'faction'];
const TOAST_TOKENS = ['name', 'player', 'pet'];
const TOKEN_W = {
  name: 10, player: 10, pet: 10, species: 9, type: 5, suggest: 9, rival: 9, rivalType: 5,
  trainer: 16, foe: 12, title: 16, side: 12, from: 3, to: 3, faction: 16,
};
const SAY_MAX = 110;
const CHOICE_MAX = 30;

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function loadScript(rel, names) {
  const ctx = { console, window: {}, module: { exports: {} } };
  ctx.globalThis = ctx;
  ctx.window = ctx;
  ctx.root = ctx;
  vm.createContext(ctx);
  const tail = names.map(n => 'try { globalThis.' + n + ' = ' + n + '; } catch (e) {}').join('\n');
  vm.runInContext(read(rel) + '\n;' + tail, ctx, { filename: rel });
  return ctx;
}

function mapdata() {
  return loadScript('data/mapdata.js', ['MAPDATA']).MAPDATA;
}

function labWalk() {
  const line = read('sprites.js').split('\n').find(l => l.startsWith('const LAB_SKIN'));
  const ctx = {};
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(line.slice(0, line.indexOf(';') + 1) + '\nglobalThis.LAB_SKIN = LAB_SKIN;', ctx);
  return ctx.LAB_SKIN.walk;
}

function applyMapPatch(world, patch) {
  if (!patch || !patch.maps) return;
  for (const [id, pt] of Object.entries(patch.maps)) {
    const m = world[id];
    if (!m) continue;
    if (pt.set) Object.assign(m, JSON.parse(JSON.stringify(pt.set)));
    if (pt.gridRows) for (const [y, row] of Object.entries(pt.gridRows)) m.grid[+y] = row;
    for (const o of pt.replaceObjs || []) {
      const copy = JSON.parse(JSON.stringify(o));
      const k = m.objs.findIndex(x => x.id === o.id);
      if (k >= 0) m.objs[k] = copy;
      else m.objs.push(copy);
    }
    for (const o of pt.addObjs || []) m.objs.push(JSON.parse(JSON.stringify(o)));
  }
}

// Same order as the WORLD builder in game.js, including the Travel Shelf the engine adds.
function composeWorld(md) {
  const detail = Object.keys(md).filter(k => k.startsWith('detail_')).sort();
  const tiles = Object.assign({}, md.maps_slice.tiles, md.interiors.tiles,
    (md.cobblecrest && md.cobblecrest.tiles) || {},
    (md.cobblecrest && md.cobblecrest.roomTiles) || {},
    (md.highcharity && md.highcharity.tiles) || {},
    ...detail.map(k => md[k].tiles || {}));
  const world = JSON.parse(JSON.stringify(md.maps_slice.maps));
  applyMapPatch(world, md.interiors.slicePatch);
  if (md.act1_route2) {
    applyMapPatch(world, md.act1_route2.slicePatch);
    Object.assign(world, JSON.parse(JSON.stringify(md.act1_route2.maps)));
  }
  Object.assign(world, JSON.parse(JSON.stringify(md.interiors.maps)));
  if (world.hm_lantern_in && !world.hm_lantern_in.objs.some(o => o.id === 'travel_shelf')) {
    world.hm_lantern_in.objs.push({
      kind: 'prop', id: 'travel_shelf', x: 6, y: 2, sprite: 'travel_shelf', name: 'the Travel Shelf',
      lines: { else: 'Travel Shelf · Leave Acorns, take a snack. — I.' },
    });
  }
  if (md.cobblecrest) {
    applyMapPatch(world, md.cobblecrest.route2Patch);
    Object.assign(world, JSON.parse(JSON.stringify(md.cobblecrest.maps)));
    Object.assign(world, JSON.parse(JSON.stringify(md.cobblecrest.rooms)));
  }
  if (md.glimmer_path) applyMapPatch(world, md.glimmer_path.slicePatch);
  if (md.mahopac) {
    applyMapPatch(world, md.mahopac.slicePatch);
    Object.assign(world, JSON.parse(JSON.stringify(md.mahopac.maps)));
  }
  if (md.highcharity) {
    applyMapPatch(world, md.highcharity.slicePatch);
    Object.assign(world, JSON.parse(JSON.stringify(md.highcharity.maps)));
    Object.assign(world, JSON.parse(JSON.stringify(md.highcharity.rooms)));
  }
  if (md.heights) {
    Object.assign(world, JSON.parse(JSON.stringify(md.heights.maps)));
    applyMapPatch(world, md.heights.slicePatch);
  }
  if (md.civic) {
    Object.assign(world, JSON.parse(JSON.stringify(md.civic.maps)));
    applyMapPatch(world, md.civic.slicePatch);
  }
  if (md.town_board) applyMapPatch(world, md.town_board.slicePatch);
  for (const k of detail) applyMapPatch(world, md[k].slicePatch);
  if (md.fernbrook_rooms) {
    Object.assign(world, JSON.parse(JSON.stringify(md.fernbrook_rooms.maps || {})));
    applyMapPatch(world, md.fernbrook_rooms.slicePatch);
  }
  return { world, tiles };
}

function tileWalks(map, x, y, tiles, lab) {
  if (!map || !map.grid || y < 0 || x < 0 || y >= map.h || x >= map.w) return false;
  const row = map.grid[y];
  if (!row || x >= row.length) return false;
  const ch = row[x];
  if (map.skin === 'lab' && lab && Object.prototype.hasOwnProperty.call(lab, ch)) return !!lab[ch];
  return !!(tiles[ch] && tiles[ch].walk);
}

function mapProblems(world, tiles, lab) {
  const bad = [];
  for (const [id, map] of Object.entries(world)) {
    const seen = {};
    for (const o of map.objs || []) {
      if (!o.id) { bad.push(id + ': object missing id'); continue; }
      seen[o.id] = (seen[o.id] || 0) + 1;
      if (o.kind !== 'warp' && !(o.kind === 'door' && o.to)) continue;
      const where = id + ' ' + o.id;
      if (!o.to || !world[o.to]) { bad.push(where + ': target map missing ' + o.to); continue; }
      const dest = world[o.to];
      if (!Number.isInteger(o.tx) || !Number.isInteger(o.ty)) { bad.push(where + ': target tile missing'); continue; }
      if (o.ty < 0 || o.tx < 0 || o.ty >= dest.h || o.tx >= dest.w) {
        bad.push(where + ': target out of bounds ' + o.to + ' ' + o.tx + ',' + o.ty);
        continue;
      }
      if (!tileWalks(dest, o.tx, o.ty, tiles, lab)) {
        const ch = (dest.grid[o.ty] || '')[o.tx] || '?';
        bad.push(where + ': tile ' + o.to + ' ' + o.tx + ',' + o.ty + ' is not walkable (' + ch + ')');
      }
    }
    for (const [oid, n] of Object.entries(seen)) if (n > 1) bad.push(id + ': duplicate object id ' + oid);
    if (!map.safe) bad.push(id + ': no safe spot');
    else if (!tileWalks(map, map.safe.x, map.safe.y, tiles, lab)) {
      const ch = (map.grid[map.safe.y] || '')[map.safe.x] || '?';
      bad.push(id + ': safe tile not walkable ' + map.safe.x + ',' + map.safe.y + ' (' + ch + ')');
    }
  }
  return bad;
}

function repoMapProblems() {
  const md = mapdata();
  const built = composeWorld(md);
  return mapProblems(built.world, built.tiles, labWalk());
}

function copyTree(dir) {
  fs.mkdirSync(path.join(dir, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'tools', 'gen_mapdata.py'), path.join(dir, 'tools', 'gen_mapdata.py'));
  for (const name of fs.readdirSync(path.join(ROOT, 'data'))) {
    if (name.endsWith('.json')) fs.copyFileSync(path.join(ROOT, 'data', name), path.join(dir, 'data', name));
  }
}

function runGen(dir) {
  const r = spawnSync('python3', ['tools/gen_mapdata.py'], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || 'gen_mapdata failed').trim());
  return fs.readFileSync(path.join(dir, 'data', 'mapdata.js'), 'utf8');
}

function mapdataProblems(generated, committed) {
  if (generated === committed) return [];
  return ['data/mapdata.js does not match tools/gen_mapdata.py'];
}

function freshMapdata(mutate) {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'walklings-mapdata-'));
  try {
    copyTree(dir);
    if (mutate) mutate(dir);
    return runGen(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function largestRemainder(finalStats, ratio, target) {
  const raw = STAT_KEYS.map(k => finalStats[k] * ratio);
  const base = raw.map(v => Math.floor(v + 1e-9));
  let left = target - base.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v + 1e-9) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  const out = base.slice();
  if (left > 0) for (let n = 0; n < left; n++) out[order[n % order.length].i] += 1;
  else if (left < 0) {
    const rev = order.slice().reverse();
    for (let n = 0; n < -left; n++) out[rev[n % rev.length].i] -= 1;
  }
  const shaped = {};
  STAT_KEYS.forEach((k, i) => { shaped[k] = out[i]; });
  return shaped;
}

function stageProblems(base, speciesIds) {
  const bad = [];
  const want = new Set();
  for (const id of speciesIds) {
    for (let st = 0; st < 3; st++) want.add(id + '/' + st);
    const forms = [0, 1, 2].map(st => base[id + '/' + st]);
    if (forms.some(f => !f)) { bad.push(id + ': missing a stage line'); continue; }
    const final = forms[2];
    for (let st = 0; st < 3; st++) {
      const got = STAT_KEYS.reduce((n, k) => n + forms[st][k], 0);
      if (got !== STAGE_TOTAL[st]) bad.push(id + '/' + st + ': total ' + got + ', want ' + STAGE_TOTAL[st]);
      if (st === 2) continue;
      const exp = largestRemainder(final, STAGE_RATIO[st], STAGE_TOTAL[st]);
      for (const k of STAT_KEYS) if (forms[st][k] !== exp[k]) bad.push(id + '/' + st + ': ' + k + ' ' + forms[st][k] + ', want ' + exp[k]);
    }
  }
  for (const key of Object.keys(base)) if (!want.has(key)) bad.push('base stat with no species stage ' + key);
  return bad;
}

function speciesIds() {
  const src = read('sprites.js');
  const block = src.slice(src.indexOf('const SPECIES'), src.indexOf('const GLYPH'));
  return [...block.matchAll(/\bid:'([a-z0-9_]+)'/g)].map(m => m[1]);
}

function repoStageProblems() {
  const base = loadScript('stats.js', ['BASE_STATS']).BASE_STATS;
  return stageProblems(base, speciesIds());
}

function learnProblems(moves, learnsets, species) {
  const bad = [];
  for (const id of species || []) for (let st = 0; st < 3; st++) if (!learnsets[id + '/' + st]) bad.push(id + '/' + st + ': no learnset');
  for (const [form, rows] of Object.entries(learnsets)) {
    for (const row of rows || []) {
      const id = row[1];
      if (!moves[id]) bad.push(form + ': unknown move ' + id);
    }
  }
  return bad;
}

function trainerMoveProblems(trainers, moves) {
  const bad = [];
  const walk = (node, where) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.moves)) node.moves.forEach(id => { if (!moves[id]) bad.push(where + ': unknown move ' + id); });
    if (Array.isArray(node)) node.forEach(x => walk(x, where));
    else for (const [k, v] of Object.entries(node)) if (k !== 'moves') walk(v, where);
  };
  for (const [id, t] of Object.entries(trainers || {})) {
    if (id.startsWith('_') || !t || typeof t !== 'object') continue;
    walk(t, id);
  }
  return bad;
}

function repoLearnProblems() {
  const loaded = loadScript('moves.js', ['MOVES', 'LEARNSETS', 'TRAINERS']);
  const bad = learnProblems(loaded.MOVES, loaded.LEARNSETS, speciesIds());
  bad.push.apply(bad, trainerMoveProblems(loaded.TRAINERS, loaded.MOVES));
  const md = mapdata();
  for (const key of Object.keys(md)) if (md[key] && md[key].trainers) bad.push(...trainerMoveProblems(md[key].trainers, loaded.MOVES));
  return bad;
}

function shellList(src) {
  const m = src.match(/const SHELL = \[([\s\S]*?)\];/);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map(x => x[1] || x[2]);
}

function shellProblems(files, exists) {
  const bad = [];
  for (const file of files) {
    if (file === './' || file === '.') {
      if (!exists('.')) bad.push('shell file missing ' + file);
      continue;
    }
    const rel = file.replace(/^\.\//, '').split('?')[0];
    if (!exists(rel)) bad.push('shell file missing ' + file);
  }
  return bad;
}

function repoShellProblems() {
  const files = shellList(read('sw.js'));
  return shellProblems(files, rel => fs.existsSync(path.join(ROOT, rel)));
}

function fromCodes(codes) {
  return String.fromCharCode.apply(null, codes);
}

// Player-text bans, built from character codes so this file does not spell them.
function banPatterns() {
  const w1 = fromCodes([102, 97, 105, 110, 116]);
  const w2 = fromCodes([101, 118, 111, 108, 118]);
  const w3 = fromCodes([99, 111, 105, 110]);
  const w4 = fromCodes([97, 112, 112, 101, 97, 114, 101, 100]);
  const w5 = fromCodes([103, 111]);
  const w6 = fromCodes([100, 101, 120]);
  const w7 = fromCodes([116, 97, 109, 97, 103, 111, 116, 99, 104, 105]);
  return [
    new RegExp('\\b' + w1 + '(ed)?\\b', 'i'),
    new RegExp('\\b' + w2, 'i'),
    new RegExp('\\b' + w3 + 's?\\b', 'i'),
    new RegExp('\\b' + w4 + '\\b', 'i'),
    new RegExp('\\b' + w5 + ', [a-z]+!', 'i'),
    new RegExp('\\b[a-z]+' + w6 + '\\b', 'i'),
    new RegExp(w7, 'i'),
  ];
}

function maskIds(text) {
  return String(text).replace(/\bisFainted\b/g, '').replace(/\bdexGrid\b/g, '');
}

function tokensFor(item) {
  if (item.tokens) return item.tokens;
  if (item.kind === 'toast') return TOAST_TOKENS;
  if (item.kind === 'blurb' || item.kind === 'quest') return [];
  if (item.where && (item.where.indexOf('battle') >= 0 || item.where.indexOf('trainer') >= 0)) return BATTLE_TOKENS;
  if (item.where && item.where.indexOf('standing') >= 0) return STANDING_TOKENS;
  return DIALOG_TOKENS;
}

function wordingProblems(items) {
  const bans = banPatterns();
  const bad = [];
  for (const item of items) {
    const text = item.text;
    if (typeof text !== 'string' || text === '') continue;
    const where = (item.kind || 'say') + ' ' + (item.where || 'line');
    if (/  /.test(text)) bad.push(where + ': double space');
    const masked = maskIds(text);
    for (const re of bans) if (re.test(masked)) { bad.push(where + ': banned word'); break; }
    const allow = new Set(tokensFor(item));
    const found = [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
    for (const tok of found) if (!allow.has(tok)) bad.push(where + ': unknown token {' + tok + '}');
    const wide = text.replace(/\{(\w+)\}/g, (m, k) => 'x'.repeat(TOKEN_W[k] || (k.length + 2)));
    const n = [...wide].length;
    if (item.kind === 'choice' && n > CHOICE_MAX) bad.push(where + ': choice over ' + CHOICE_MAX + ' (' + n + ')');
    if ((item.kind === 'say' || item.kind === 'sign' || item.kind === 'quest') && n > SAY_MAX) bad.push(where + ': over ' + SAY_MAX + ' (' + n + ')');
  }
  return bad;
}

function addLine(items, kind, where, text, tokens) {
  if (typeof text !== 'string' || text === '' || text.charAt(0) === '@') return;
  items.push({ kind, where, text, tokens });
}

function walkSteps(items, node, where) {
  if (!Array.isArray(node)) return;
  if (node[0] === 'say') { addLine(items, 'say', where, node[2]); return; }
  if (node[0] === 'choice') {
    addLine(items, 'say', where + ' prompt', node[1]);
    for (const opt of node[2] || []) {
      if (!opt) continue;
      addLine(items, 'choice', where + ' label', opt[0]);
      walkSteps(items, opt[1], where);
    }
    return;
  }
  for (const child of node) walkSteps(items, child, where);
}

function walkJson(items, node, where) {
  if (Array.isArray(node)) {
    if (typeof node[0] === 'string' && (node[0] === 'say' || node[0] === 'choice' || node[0] === 'if')) {
      walkSteps(items, node, where);
      return;
    }
    node.forEach(child => walkJson(items, child, where));
    return;
  }
  if (!node || typeof node !== 'object') return;
  if (typeof node.kind === 'string') {
    const spot = where + (node.id ? ' ' + node.id : '');
    const kind = node.kind === 'sign' ? 'sign' : 'say';
    addLine(items, kind, spot + ' text', node.text);
    addLine(items, 'say', spot + ' deny', node.deny);
  }
  for (const [k, v] of Object.entries(node)) {
    if (k.charAt(0) === '_') continue;
    if (k === 'lines' && v && typeof v === 'object' && !Array.isArray(v)) {
      const kind = node.kind === 'sign' ? 'sign' : 'say';
      for (const [lk, lv] of Object.entries(v)) {
        if (lk.charAt(0) === '_') continue;
        if (typeof lv === 'string') addLine(items, kind, where + ' ' + (node.id || k) + ' ' + lk, lv);
        else walkJson(items, lv, where + '.' + k + '.' + lk);
      }
      continue;
    }
    if (k === 'walkAway' && Array.isArray(v)) {
      v.forEach((s, i) => { if (typeof s === 'string') addLine(items, 'toast', where + ' walkAway ' + i, s, TOAST_TOKENS); });
      continue;
    }
    if (k === 'panel' && v && typeof v === 'object') {
      for (const [pk, pv] of Object.entries(v)) if (pk !== 'who' && typeof pv === 'string') addLine(items, 'say', where + ' panel ' + pk, pv, BATTLE_TOKENS);
      continue;
    }
    if ((k === 'blurb' || k === 'toast') && typeof v === 'string') {
      addLine(items, k === 'toast' ? 'toast' : 'blurb', where + '.' + k, v);
      continue;
    }
    walkJson(items, v, where + '.' + k);
  }
}

function pullQuotes(src, re) {
  return [...src.matchAll(re)].map(m => m[1].replace(/\\'/g, "'").replace(/\\"/g, '"'));
}

function engineLines(items) {
  const game = read('game.js');
  for (const text of pullQuotes(game, /\b(?:blurb|keyNote):\s*'((?:\\'|[^'])*)'/g)) addLine(items, 'blurb', 'game.js blurb', text);
  for (const call of game.match(/toast\(([^;\n]*)\)/g) || []) {
    for (const text of pullQuotes(call, /'((?:\\'|[^'])*)'/g)) addLine(items, 'toast', 'game.js toast', text, TOAST_TOKENS);
  }
  for (const call of game.match(/toasts\.push\(([^;\n]*)\)/g) || []) {
    for (const text of pullQuotes(call, /'((?:\\'|[^'])*)'/g)) addLine(items, 'toast', 'game.js toast', text, TOAST_TOKENS);
  }
  for (const text of pullQuotes(game, /\['say',\s*(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"),\s*'((?:\\'|[^'])*)'/g)) addLine(items, 'say', 'game.js say', text);
  for (const name of ['HELLO_LINES', 'CTL_TOASTS', 'CD_MSG']) {
    const m = game.match(new RegExp('const ' + name + ' = \\{([\\s\\S]*?)\\};'));
    if (!m) continue;
    for (const text of pullQuotes(m[1], /'((?:\\'|[^'])*)'/g)) addLine(items, 'toast', 'game.js ' + name, text, TOAST_TOKENS);
  }
  for (const text of pullQuotes(game, /const (?:WELCOME_LINE|BAG_FULL_MSG|RENAME_OK|RENAME_BACK|RENAME_EMPTY) = '([^']*)'/g)) {
    addLine(items, 'toast', 'game.js line', text, TOAST_TOKENS);
  }
  const spr = read('sprites.js');
  const block = spr.slice(spr.indexOf('const SPECIES'), spr.indexOf('const GLYPH'));
  for (const m of block.matchAll(/id:'([a-z0-9_]+)'[\s\S]*?blurb:'((?:\\'|[^'])*)'/g)) addLine(items, 'blurb', 'species ' + m[1], m[2].replace(/\\'/g, "'"));

  const standing = loadScript('standing.js', []).PPStanding.CFG;
  for (const [sid, side] of Object.entries(standing.sides)) {
    side.tiers.forEach((tier, i) => {
      addLine(items, 'blurb', 'standing ' + sid + ' tier ' + i, tier.blurb, STANDING_TOKENS);
      addLine(items, 'toast', 'standing ' + sid + ' tier ' + i, tier.toast, STANDING_TOKENS);
    });
  }
  const sw = standing.switch;
  for (const key of ['letter', 'review', 'welcome']) {
    for (const [sid, text] of Object.entries(sw[key])) addLine(items, 'say', 'standing switch ' + key + ' ' + sid, text, STANDING_TOKENS);
  }
  for (const key of ['wait', 'refused', 'costLine']) addLine(items, 'say', 'standing switch ' + key, sw[key], STANDING_TOKENS);
  for (const key of ['option', 'ask', 'confirm', 'yes', 'no']) addLine(items, 'choice', 'standing switch ' + key, sw[key], STANDING_TOKENS);
  addLine(items, 'say', 'standing tab empty', standing.tab.empty, STANDING_TOKENS);
  addLine(items, 'say', 'standing tab pledged', standing.tab.pledged, STANDING_TOKENS);

  const quests = loadScript('quests.js', []).PPQuests;
  for (const e of quests.CHAIN) {
    addLine(items, 'quest', 'quest ' + e.id, e.text, []);
    if (e.glimmer) addLine(items, 'quest', 'quest ' + e.id + ' glimmer', e.glimmer.text, []);
  }
  for (const e of quests.SIDE) addLine(items, 'quest', 'side ' + e.id, e.text, []);
  quests.STUCK.forEach((text, i) => addLine(items, 'quest', 'stuck ' + i, text, []));

  const battle = loadScript('moves.js', ['BATTLE_TEXT', 'BEFRIEND_WARY_LINES', 'TRAINERS']);
  for (const [k, v] of Object.entries(battle.BATTLE_TEXT)) addLine(items, 'say', 'battle ' + k, v, BATTLE_TOKENS);
  for (const v of battle.BEFRIEND_WARY_LINES) addLine(items, 'say', 'battle wary', v, BATTLE_TOKENS);
  for (const [id, t] of Object.entries(battle.TRAINERS)) {
    if (!t || id.charAt(0) === '_') continue;
    for (const [k, v] of Object.entries(t.lines || {})) if (typeof v === 'string') addLine(items, 'say', 'trainer ' + id + ' ' + k, v, BATTLE_TOKENS);
    for (const [k, v] of Object.entries(t.panel || {})) if (k !== 'who' && typeof v === 'string') addLine(items, 'say', 'trainer ' + id + ' panel ' + k, v, BATTLE_TOKENS);
  }

  const mini = loadScript('minigames.js', []).PPMinigames;
  for (const id of mini.IDS) {
    addLine(items, 'say', 'minigame ' + id + ' rule', mini.RULE[id]);
    addLine(items, 'say', 'minigame ' + id + ' clear', mini.CLEAR[id]);
    addLine(items, 'say', 'minigame ' + id + ' fail', mini.FAIL[id]);
  }
  for (const line of read('minigames.js').split('\n')) {
    if (line.indexOf('lines.push([') < 0) continue;
    for (const text of pullQuotes(line, /'((?:\\'|[^'])*)'/g)) addLine(items, 'say', 'minigame finish', text);
    for (const text of pullQuotes(line, /"((?:\\"|[^"])*)"/g)) addLine(items, 'say', 'minigame finish', text);
  }

  const html = read('index.html').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const visible = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (visible) addLine(items, 'blurb', 'index.html', visible);
}

function playerLines() {
  const items = [];
  for (const name of fs.readdirSync(path.join(ROOT, 'data'))) {
    if (!name.endsWith('.json')) continue;
    walkJson(items, JSON.parse(read(path.join('data', name))), name);
  }
  const built = composeWorld(mapdata());
  for (const [id, map] of Object.entries(built.world)) {
    for (const o of map.objs || []) {
      const spot = 'world ' + id + ' ' + (o.id || '');
      const kind = o.kind === 'sign' ? 'sign' : 'say';
      addLine(items, kind, spot + ' text', o.text);
      addLine(items, 'say', spot + ' deny', o.deny);
      for (const [k, v] of Object.entries(o.lines || {})) if (typeof v === 'string' && k.charAt(0) !== '_') addLine(items, kind, spot + ' ' + k, v);
    }
  }
  engineLines(items);
  return items;
}

function repoWordingProblems() {
  return wordingProblems(playerLines());
}

module.exports = {
  SAY_MAX, CHOICE_MAX, STAGE_TOTAL, fromCodes, banPatterns,
  mapdataProblems, freshMapdata, read, mapProblems, repoMapProblems,
  stageProblems, repoStageProblems, learnProblems, repoLearnProblems,
  shellList, shellProblems, repoShellProblems,
  wordingProblems, playerLines, repoWordingProblems,
  DIALOG_TOKENS, BATTLE_TOKENS, STANDING_TOKENS,
};
