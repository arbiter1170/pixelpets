/* Walklings: battle scenes (BATTLE_BACKDROPS, D1009: red, settled by Vincent Oct 31, 2026). No dependencies beyond PAL.
   One scene per map id. Each is drawn from that map's own tiles (env.tile resolves the map's skin, wall kit and seeded
   variants), its own prop sprites (env.art) and PAL fills. No alpha anywhere, so every pixel is a palette colour.
   Outdoor: sky, a far layer and one landmark taken from the map, then the map's ground tiles from the horizon down.
   Indoor: the room's own back wall and floor rows (its grid, without objects), then a few of its props. Dreams get a
   dithered white wash. Layout follows drawBattle: the foe stands top right (x W-26, y H*0.18), the partner bottom left
   (x 6, y H-28). Landmarks and props (the "deco" layer) keep out of both boxes; boxes() names them for the tests.
   A building landmark comes from the map's own `roofs` entry (house(): its roof and wall tiles, door and window art, trim,
   gable), drawn flat (Nov 4: the Weir Hut on the Cut; Fernbrook's pond is the plaza's fountain). */
(function(){
'use strict';

function lay(W, H){
  const fy = Math.max(4, Math.round(H * 0.18)), my = H - 28;
  return { fy, my, hz: fy + 10 };
}
// The sprite boxes deco must not touch: foe and partner with their lunge room and ground shadow. A group battle (RegenX,
// the tunnels) adds the second foe (fx0 - 18, fy0 + 4) and the ally (mx0 + 18, my0 + 2).
function boxes(W, H, group){
  const L = lay(W, H), out = [[W - 29, L.fy - 3, 27, 23], [3, L.my - 3, 27, 23]];
  if (group) out.push([W - 47, L.fy + 1, 24, 22], [21, L.my - 1, 24, 22]);
  return out;
}
function seedOf(s){ let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed){ let a = seed || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// A prop sprite with every pixel fully solid or fully clear (a few lamps carry a soft glow), cached per sprite.
const solidCache = new WeakMap();
function solid(img){
  if (!img) return null;
  if (solidCache.has(img)) return solidCache.get(img);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height);
  let soft = false;
  for (let i = 3; i < d.data.length; i += 4) { const a = d.data[i]; if (a && a < 255) { d.data[i] = a >= 128 ? 255 : 0; soft = true; } }
  const out = soft ? (g.putImageData(d, 0, 0), c) : img;
  solidCache.set(img, out);
  return out;
}

/* ---------- the drawing kit ---------- */
function kit(g, W, H, id, env, layer){
  const L = lay(W, H), S = { g, W, H, id, env, layer, fy: L.fy, my: L.my, hz: L.hz, r: rng(seedOf(id)), wet: [], drew: [], on: layer !== 'deco',
    boxes: boxes(W, H, !!(ROOMS[id] && ROOMS[id].group)), low: L.my - 3,   // low: the partner box's top row (fixed deco ends above it)
    night: /^night/.test(env.mode || ''), dull: /dull$/.test(env.mode || '') };
  S.P = (col, x, y, w = 1, h = 1) => { if (!S.on) return; g.fillStyle = PAL[col]; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  // Fill a rect with one map tile at scale s (1 or 0.5), clipped. cx/cy seed the map's tile variants; water is noted for frame().
  S.fill = (ch, x, y, w, h, s = 1, cx = 0, cy = 0) => {
    if (!S.on || w <= 0 || h <= 0) return;
    S.tiles((i, j) => env.tile(ch, cx + i, cy + j), x, y, w, h, s);
    if (ch === 'w') S.wet.push([x, y, w, h, s]);
  };
  // The tiling under fill(): img(i, j) gives the 16x16 tile for column i, row j; scale s; clipped to the rect.
  S.tiles = (img, x, y, w, h, s = 1) => {
    const step = 16 * s;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    for (let j = 0; j * step < h; j++) for (let i = 0; i * step < w; i++) {
      const t = img(i, j); if (t) g.drawImage(t, 0, 0, 16, 16, x + i * step, y + j * step, step, step);
    }
    g.restore();
  };
  // A map cell as it is in the room (wall kit, skin, decal) at full scale. under: the floor char drawn first, for tiles
  // with open corners (pillars, stairs), as the walk map does.
  S.cell = (ch, cx, cy, x, y, under) => {
    if (!S.on) return;
    if (under && under !== ch) { const u = env.tile(under, cx, cy); if (u) g.drawImage(u, x, y); }
    const img = env.tile(ch, cx, cy), dec = env.decal();
    if (img) g.drawImage(img, x, y);
    if (dec) g.drawImage(dec, x, y);
    if (ch === 'w') S.wet.push([x, y, 16, 16, 1]);
  };
  // One of the map's own prop sprites, standing bottom-centred on (cx, by). Soft glow pixels are snapped solid or clear.
  // If it would touch a Walkling's box it slides left, then right, then up, then shrinks; no clear spot, no prop.
  S.art = (name, cx, by, s = 1) => {
    if (!S.on) return false;
    const img = solid(env.art(name)); if (!img) return false;
    return S.place(img.width, img.height, cx, by, s, 0, (x, y, w, h) => g.drawImage(img, 0, 0, img.width, img.height, x, y, w, h), 'art:' + name);
  };
  // Find a spot for a w x h thing (at scale s) standing bottom-centred on (cx, by) that touches no Walkling's box: slide left,
  // then right, then up, then shrink. off > 0 (a building in the front-right corner): slide right first, and it may stand up
  // to off px out of frame on the right before it shrinks.
  const hits = (x, y, w, h) => S.boxes.some(([bx, bY, bw, bh]) => x < bx + bw && x + w > bx && y < bY + bh && y + h > bY);
  S.place = (iw, ih, cx, by, s, off, draw, tag) => {
    for (const k of [s, s * 0.75, s * 0.5]) {
      const w = Math.round(iw * k), h = Math.round(ih * k), x0 = Math.round(cx - w / 2), y0 = by - h, tries = [[x0, y0]], side = [[], []];
      for (let x = x0 - 1; x >= 0; x--) side[0].push([x, y0]);
      for (let x = x0 + 1; x + w <= W + off; x++) side[1].push([x, y0]);
      tries.push(...(off ? side[1].concat(side[0]) : side[0].concat(side[1])));
      for (let y = y0 - 1; y >= 0; y--) tries.push([x0, y]);
      const at = tries.find(([x, y]) => !hits(x, y, w, h));
      if (at) { draw(at[0], at[1], w, h, k); S.drew.push(tag); return true; }
    }
    return false;
  };
  // A building from the map's own `roofs` entry (the roof kit: roof and wall tiles, door and window art, trim, a gable cut),
  // drawn at scale s, standing on (cx, by). Flat PAL only: no alpha, no glow. Slides like a prop; may lose a quarter off the right.
  S.house = (name, cx, by, s = 0.5, under) => {
    const r = env.roofs && env.roofs[name];
    if (!S.on || !r) return false;
    const n = r.x1 - r.x0 + 1, rows = r.y1 - r.y0 + 1, roof = env.named(r.roof) || env.tile('R', r.x0, r.y0), wall = env.named(r.wall) || env.tile('H', r.x0, r.y1 + 1);
    const door = solid(env.art(r.door)), win = solid(env.art([].concat(r.win || [])[0]));
    const d = (env.objs || []).find(o => o.kind === 'door' && o.x >= r.x0 && o.x <= r.x1 && o.y > r.y1 && o.y <= r.y1 + 2), dx = d ? d.x - r.x0 : -1;
    return S.place(n * 16, (rows + 1) * 16, cx, by, s, n * 4, (x, y, w, h, k) => {
      if (under) under(x, y, w, h);
      const t = 16 * k, rh = Math.round(rows * t), keep = document.createElement('canvas');
      keep.width = w; keep.height = rh; keep.getContext('2d').drawImage(g.canvas, x, y, w, rh, 0, 0, w, rh);   // what the gable's cut shows
      S.tiles(() => roof, x, y, w, rh, k);
      S.tiles(() => wall, x, y + rh, w, Math.round(t), k);
      if (r.shape === 'gable') for (let j = 0; j < rh; j++) {
        const cut = Math.round(Math.min(w / 2 - 2, rh - 1 - j)); if (cut <= 0) continue;   // the map's gable: 45 degrees
        g.clearRect(x, y + j, cut, 1); g.clearRect(x + w - cut, y + j, cut, 1);
        g.drawImage(keep, 0, j, cut, 1, x, y + j, cut, 1); g.drawImage(keep, w - cut, j, cut, 1, x + w - cut, y + j, cut, 1);
      }
      // the map's roof shading, in flat PAL: a dark edge on the gable and the eave, so a turf roof still reads on grass
      for (let j = 0; j < rh; j++) { const c = r.shape === 'gable' ? Math.max(0, Math.round(Math.min(w / 2 - 2, rh - 1 - j))) : 0; S.P('k', x + c, y + j); S.P('k', x + w - 1 - c, y + j); if (!j) S.P('k', x + c, y, w - 2 * c, 1); }
      S.P('d', x, y + rh - 1, w, 1);
      if (r.trim && PAL[r.trim]) { S.P(r.trim, x, y + rh, w, 1); S.P(r.trim, x, y + rh, 1, t); S.P(r.trim, x + w - 1, y + rh, 1, t); }
      for (let i = 0; i < n; i++) {
        const art = i === dx ? door : (dx >= 0 && Math.abs(i - dx) % 2 === 0) ? win : null;
        if (art) g.drawImage(art, 0, 0, art.width, art.height, Math.round(x + i * t), Math.round(y + rh), Math.round(t), Math.round(t));
      }
    }, 'house:' + name);
  };
  S.deco = fn => { const was = S.on; S.on = layer !== 'base'; fn(); S.on = was; };
  S.ground = (ch, cy = 0) => { S.fill(ch, 0, S.hz, W, 16, 0.5, 0, cy); S.fill(ch, 0, S.hz + 16, W, H - S.hz - 16, 1, 3, cy + 1); };
  S.band = (ch, dy, h, s = 1, x = 0, w = W) => S.fill(ch, x, S.hz + dy, w, h, s, 1, (dy >> 3) + 2);
  return S;
}

/* ---------- outdoor layers ---------- */
function sky(S){
  const { W, hz, P } = S, col = S.night ? 'n' : S.dull ? 'h' : 'c', band = S.night ? 'b' : S.dull ? 'w' : 's';
  P(col, 0, 0, W, hz); P(band, 0, hz - 3, W, 3);
  if (!S.dull && !S.night) { P('y', W - 11, 3, 6, 6); P('w', W - 10, 4, 2, 2); }
  if (!S.dull && S.night) {
    P('w', W - 11, 3, 5, 5); P('n', W - 9, 2, 4, 4);
    const r = rng(seedOf(S.id) ^ 77); for (let i = 0; i < Math.max(6, W / 8 | 0); i++) P('w', (r() * W) | 0, 1 + (r() * (hz - 12) | 0));
  }
}
const FAR = {
  hills(S, col = 'l', amp = 1){ const { W, hz, P } = S; for (let x = 0; x < W; x++) { const h = Math.round((4 + Math.sin(x / 6) * 2 + Math.sin(x / 2.3)) * amp); P(col, x, hz - h, 1, h); } },
  treeline(S, gap = 0){ const { W, hz } = S; for (let x = -4 + gap; x < W; x += 7) S.fill('T', x, hz - 8, 8, 8, 0.5, x, 0); },
  ridge(S, a = 'm', b = 'd'){
    const { W, hz, P, r } = S; let h = 10;
    for (let x = 0; x < W; x++) { h = Math.max(6, Math.min(16, h + (r() < .5 ? -1 : 1) * (r() < .6 ? 1 : 2))); P(a, x, hz - h, 1, h); P(b, x, hz - h, 1, 1); }
  },
  cliff(S, top){ S.fill('K', 0, top, S.W, S.hz - top, 1, 0, 0); S.P('k', 0, S.hz - 1, S.W, 1); },
  canopy(S){
    const { W, hz, P } = S;
    for (let x = -2; x < W; x += 9) { P('k', x + 1, 10, 4, hz - 10); P('p', x + 2, 10, 2, hz - 10); }
    P('t', 0, 0, W, 9);
    for (let x = -3; x < W + 3; x += 6) { P('t', x, 7, 8, 5); P('g', x + 2, 8, 3, 2); P('k', x + 1, 12, 6, 1); }
    for (let x = 1; x < W; x += 11) P('l', x, 2, 2, 1);
  },
  sea(S){
    const { W, hz, P, r } = S;
    P('b', 0, hz - 9, W, 9); P('n', 0, hz - 9, W, 1);
    for (let i = 0; i < Math.max(6, W / 6 | 0); i++) P(r() < .5 ? 'c' : 'w', (r() * W) | 0, hz - 8 + (r() * 7 | 0), 2, 1);
  },
  // Small houses from the map's own roof and wall tiles at half scale, standing on the horizon. xs: left edges, n: tiles wide.
  roofs(S, list){ list.forEach(([x, n, tall]) => { const t = tall || 1; S.fill('R', x, S.hz - 8 - 8 * t, 8 * n, 8, 0.5, x, 0); S.fill('H', x, S.hz - 8 * t, 8 * n, 8 * t, 0.5, x, 1); }); },
};

// BATTLE_BACKDROPS_ACT2 v0.1.1 (design specs/battle_backdrops_act2/recipes.js; BRIGHTGATE_LAYOUT v0.2): Brightgate's helpers.
// A far row of company blocks in flat PAL: wall, a seam every 4 px, a cap and a band (the white panel city).
FAR.blocks = (S, list, wall = 'w', seam = 'h', cap = 'N', band = 'V') => {
  const { hz, P } = S;
  list.forEach(([x, w, h]) => {
    P(wall, x, hz - h, w, h); for (let k = x + 3; k < x + w; k += 4) P(seam, k, hz - h + 3, 1, h - 3);
    P(cap, x, hz - h - 2, w, 2); P(band, x, hz - h, w, 1); P('d', x, hz - 1, w, 1);
  });
};
// A tall thin mast in flat PAL (the City Relay, a Calm Tower): no glow, one cap; `tip` is the lamp colour.
FAR.mast = (S, x, top, col = 'm', tip = 'h') => { const { hz, P } = S; P(col, x, top, 2, hz - top); P('d', x + 2, top + 2, 1, hz - top - 2); P(tip, x - 1, top - 2, 4, 2); };
// Brightgate's haze: the day sky's ice band reads close to mint between white blocks, so company scenes repaint it grey (D2000).
const haze = S => { if (!S.night && !S.dull) S.P('h', 0, S.hz - 3, S.W, 3); };
// Panel paving in flat PAL: white panels, soft grey seams (not navy), from the horizon down (B05).
const panels = (S, y0 = S.hz) => { const { W, H, P } = S; P('w', 0, y0, W, H - y0);
  for (let y = y0 + 6; y < H; y += 8) P('h', 0, y, W, 1); for (let x = 5; x < W; x += 8) for (let y = y0; y < H; y += 16) P('h', x, y, 1, 8); };

/* ---------- indoor: the room's own wall and floor ---------- */
const NOT_FLOOR = { '^': 1, m: 1 };
function room(S, o){
  const { W, H, hz, env } = S, cells = env.cells, mw = env.w, mh = env.h;
  const mid = mw >> 1, walk = (x, y) => env.walk(cells[y][x]);
  let face = 0; while (face < mh - 2 && !walk(mid, face + 1)) face++;          // the last wall row above the floor
  const n = Math.ceil(W / 16) + 1, inner = Math.max(1, mw - 2), x0 = 1 + Math.max(0, ((inner - n) >> 1) + (o.dx || 0));
  const col = i => 1 + ((x0 - 1 + i) % inner + inner) % inner, off = Math.floor((W - n * 16) / 2);
  // most common walkable char in the floor rows, for the cells that are not floor (stairs, mats, side walls)
  const tally = {}; for (let y = face + 1; y < mh - 1; y++) for (let x = 1; x < mw - 1; x++) { const ch = cells[y][x]; if (walk(x, y) && !NOT_FLOOR[ch]) tally[ch] = (tally[ch] || 0) + 1; }
  const base = (Object.entries(tally).sort((a, b) => b[1] - a[1])[0] || ['.'])[0];
  S.P('k', 0, 0, W, hz);
  for (let i = 0; i < n; i++) {
    const cx = col(i), x = off + i * 16;
    for (let k = 0; k <= face; k++) { const y = hz - 16 * (face - k + 1); if (y > -16) S.cell(cells[k][cx], cx, k, x, y); }
  }
  const rows = []; for (let y = face + 1 + (o.dy || 0); y < mh - 1; y++) rows.push(y);
  if (!rows.length) rows.push(Math.min(mh - 1, face + 1));
  for (let j = 0; hz + j * 16 < H; j++) {
    const cy = rows[j % rows.length];
    for (let i = 0; i < n; i++) { const cx = col(i); let ch = cells[cy][cx]; if (NOT_FLOOR[ch] || (cx === 0 || cx === mw - 1)) ch = base;
      if (!walk(cx, cy) && /[#W]/.test(ch)) ch = base;
      S.cell(ch, cx, cy, off + i * 16, hz + j * 16, base); }
  }
  if (o.ring) ring(S, o.ring);
  S.deco(() => {
    if (o.banner) banners(S, o.banner);
    const back = o.back || [], front = o.front || [];
    back.forEach((nm, i) => S.art(nm, 10 + i * 15, hz + 3));
    front.forEach((nm, i) => S.art(nm, W - 10 - i * 15, H - 2));
  });
}
// A painted floor ring between the two Walklings (Trial Halls and the arena).
function ring(S, col){
  const { W, H, hz, P } = S, cx = W / 2, cy = (hz + H) / 2 + 2, rx = W * 0.44, ry = (H - hz) * 0.30;
  for (let a = 0; a < 360; a += 2) { const t = a * Math.PI / 180; P(col, Math.round(cx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry)); }
  P(col, Math.round(cx) - 1, Math.round(cy) - 1, 3, 3);
}
// Two hall banners on the back wall, left of the foe.
function banners(S, [a, b]){
  const { hz, P } = S;
  const t = hz - 15 - Math.max(0, hz - 3 - S.low);   // on a short screen (61x45) the tails would touch the partner's box: lift them
  [3, 17].forEach(x => { P('k', x, t, 8, 1); P(a, x + 1, t + 1, 6, 9); P(b, x + 1, t + 4, 6, 2); P(a, x + 1, t + 10, 2, 2); P(a, x + 5, t + 10, 2, 2); });
}

/* ---------- the scenes ---------- */
const OUT = {
  route1(S){                                          // Route 1: the stream bank and its bridge, tall grass
    sky(S); FAR.hills(S); FAR.treeline(S);
    S.ground('g'); S.band('s', 20, 2); S.band('w', 22, 8); S.band('s', 30, 2);
    S.fill('B', S.W - 26, S.hz + 19, 14, 14, 1, 30, 8);
    S.band('t', S.H - S.hz - 12, 12, 0.5, S.W - 24, 24);
    S.deco(() => { S.art('signpost', 12, S.hz + 14); });
  },
  hearthmoor(S){                                      // Hearthmoor: the Warden's Lodge on the hill, the village path
    sky(S); FAR.hills(S, 'l', 1.4);
    S.ground('g'); S.band('p', 22, 8); S.band('f', 12, 8, 0.5, S.W - 22, 16);
    S.deco(() => {
      const x = 2, y = Math.min(S.hz - 22, S.low - 24);   // short screens: the lodge rises so its door stays above the partner
      S.fill('R', x, y, 24, 16, 0.5, 8, 2); S.fill('H', x, y + 16, 24, 8, 0.5, 8, 4);
      S.P('d', x + 9, y + 18, 6, 6); S.P('o', x + 10, y + 19, 4, 5); S.P('y', x + 3, y + 18, 3, 3); S.P('y', x + 18, y + 18, 3, 3);
      S.art('lamp_post', 28, S.hz + 2, 0.5);
      S.art('planter_geranium', S.W - 10, S.H - 2);
    });
  },
  fernbrook(S){                                       // Fernbrook: the fenced orchard and the well; the plaza and its fountain
    sky(S);
    for (let x = -2; x < S.W; x += 9) S.fill('T', x, S.hz - 9, 8, 8, 0.5, x, 11);
    S.ground('g'); S.fill('F', 0, S.hz, S.W, 8, 0.5, 2, 10);
    // FERNBROOK_PLAZA: the old pond is the plaza's fountain now, a cobble rim in the square's paving
    S.fill('P', S.W - 36, S.hz + 20, 36, S.H - S.hz - 20, 0.5, 18, 10);
    S.fill('c', S.W - 33, S.hz + 23, 30, 14, 0.5, 19, 11); S.fill('w', S.W - 30, S.hz + 26, 24, 8, 1, 20, 12);
    S.deco(() => { S.art('lm_well', 13, S.hz + 14) || S.art('apple_crate', 13, S.hz + 14); S.art('stone_urn', S.W - 8, S.H - 2) || S.art('apple_crate', S.W - 10, S.H - 2); });
  },
  proto(S){                                           // Old Meadow: the big tree, the pond, wild flowers
    sky(S); FAR.hills(S, 'l', 0.7); [8, 20].forEach(x => S.fill('T', x, S.hz - 9, 8, 8, 0.5, x, 3));
    S.ground('g'); S.band('f', 4, 8, 0.5, 2, 26);
    S.fill('s', 28, S.hz + 22, S.W - 30, 12, 1, 12, 4); S.fill('w', 30, S.hz + 24, S.W - 34, 8, 1, 13, 5);
    S.band('t', S.H - S.hz - 10, 10, 0.5, S.W - 20, 20);
    S.deco(() => { S.art('lm_big_tree', 12, S.hz + 6, 0.75); });
  },
  route2(S){                                          // Route 2: the creek running down, the bridge, the gate
    sky(S); FAR.hills(S, 'l', 1.2); FAR.treeline(S, 3);
    S.ground('g', 4);
    S.fill('s', 31, S.hz, 18, S.H - S.hz, 0.5, 14, 0); S.fill('w', 33, S.hz, 14, S.H - S.hz, 1, 14, 0);
    S.fill('B', 29, S.hz + 30, 22, 10, 1, 14, 8);
    S.band('t', S.H - S.hz - 12, 12, 0.5, S.W - 10, 10);
    S.deco(() => { S.art('glimmer_gate', 12, S.hz + 6) || S.art('signpost', 12, S.hz + 6); S.art('rock_big', S.W - 9, S.H - 2, 0.75); });
  },
  route2_glen(S){                                     // Wickerglen: under the roots, the sand-ringed pond, the lamps
    sky(S); FAR.canopy(S);
    S.ground('g', 6); S.band('t', 2, 8, 0.5, 0, 24);
    S.fill('s', 26, S.hz + 20, S.W - 26, 16, 1, 3, 12); S.fill('w', 29, S.hz + 23, S.W - 32, 10, 1, 3, 13);
    S.deco(() => { S.art('comfort_lamp', 10, S.hz + 12); S.art('comfort_lamp', S.W - 8, S.H - 2); });
  },
  cobble_quarry(S){                                   // Cobblecrest Quarry: the rock walls, the Old Seam, ore carts
    sky(S); FAR.cliff(S, S.hz - 20);
    S.ground('c'); S.band('t', S.H - S.hz - 14, 14, 0.5, 0, S.W);
    S.deco(() => {
      const x = 7, y = S.hz - 14, h = Math.min(14, S.low - y);   // short screens: a shorter mouth, clear of the partner
      S.P('k', x + 1, y, 8, h); S.P('k', x, y + 2, 10, h - 2); S.P('d', x + 2, y + 1, 1, h - 1); S.P('m', x, y + h - 1, 10, 1);
      S.art('barrel', 23, S.hz + 12); S.art('ore_cart', S.W - 11, S.H - 2) || S.art('rc_crate', S.W - 11, S.H - 2);
    });
  },
  hw_rim(S){                                          // Hushwater Rim: cool ridge, quarry rock, the Seam Spring
    sky(S); FAR.ridge(S); S.fill('K', 0, S.hz - 8, S.W, 8, 0.5, 2, 0);
    S.ground('c'); S.band('g', S.H - S.hz - 10, 10, 0.5);
    S.fill('s', 30, S.hz + 20, S.W - 34, 12, 1, 14, 8); S.fill('w', 32, S.hz + 22, S.W - 38, 8, 1, 14, 8);
    S.deco(() => { S.art('seam_stone', 12, S.hz + 12) || S.art('rock_big', 12, S.hz + 12); S.art('rock_small', S.W - 8, S.H - 3); });
  },
  hw_cut(S){                                          // Hushwater Cut: the gorge wall, the river, the Old Weir, the Weir Hut
    sky(S); FAR.cliff(S, S.hz - 24);
    S.ground('g', 2); S.band('s', 16, 2); S.band('w', 18, 12); S.band('s', 30, 2);
    S.fill('B', 28, S.hz + 16, 14, 16, 1, 20, 8);
    S.deco(() => {
      S.art('stone_marker', 12, S.hz + 13);
      // WEIR_HUT: the hut on the near bank, from the map's own roofs entry (turf roof, rock wall, barn door, slit window)
      // On a short screen the near bank is off the bottom, so the hut stands on a plank deck at the weir (the map's B tiles).
      const deck = (x, y, w, h) => { if (y + h < S.hz + 34) S.fill('B', x - 2, y + h - 4, w + 4, 6, 0.5, 20, 8); };
      if (!S.house('weir_hut', S.W - 17, S.H - 2, 0.5, deck)) S.art('comfort_lamp', S.W - 9, S.H - 2);
      S.art('weir_net_crate', 26, S.hz + 14, 0.75);
    });
  },
  hw_falls(S){                                        // Hushwater Falls: the falls out of the rock, the pool, spray
    sky(S); FAR.cliff(S, 6);
    S.ground('g', 4); S.band('t', S.H - S.hz - 12, 12, 0.5, S.W - 26, 26);
    // the pool and its spray are ground (base layer), so on a short screen the partner may stand in front of them
    const pw = Math.min(28, S.W - 34);   // the pool stays left of the foe's box
    S.fill('s', 4, S.hz + 2, pw, 14, 0.5, 14, 11); S.fill('w', 6, S.hz + 4, pw - 4, 9, 1, 14, 12);
    const r = rng(seedOf('hw_falls_spray')); for (let i = 0; i < 14; i++) S.P(r() < .5 ? 'w' : 's', 8 + (r() * (pw - 6) | 0), S.hz + (r() * 5 | 0));
    S.deco(() => {
      const fh = Math.min(S.hz - 4, S.low - 6);   // the falls end above the partner's box
      S.fill('w', 12, 6, 12, fh, 1, 15, 1); S.P('k', 11, 6, 1, Math.min(S.hz - 6, fh)); S.P('k', 24, 6, 1, Math.min(S.hz - 6, fh));
      S.art('rope_coil', S.W - 10, S.H - 2);
    });
  },
  route3(S){                                          // Route 3: the freight road, low roofs, the crate yard and the dock
    sky(S); FAR.hills(S); FAR.roofs(S, [[1, 2], [19, 1]]);
    S.ground('g'); S.band('c', 14, 10, 0.5);
    S.fill('D', 30, S.hz + 30, S.W - 30, 8, 1, 8, 34); S.fill('w', 30, S.hz + 38, S.W - 30, S.H - S.hz - 38, 1, 2, 33);
    S.deco(() => { S.art('crate_stack', 13, S.hz + 12); S.art('rc_crate', 26, S.hz + 22, 0.75) || S.art('crate_stack', 26, S.hz + 22, 0.75); });
  },
  brinewick(S){                                       // Brinewick: the sea, the quay, bollards and the windsock
    sky(S); FAR.sea(S); FAR.roofs(S, [[2, 2], [20, 1]]);
    S.fill('w', 0, S.hz, S.W, 8, 0.5, 5, 0); S.fill('Q', 0, S.hz + 8, S.W, S.H - S.hz - 8, 1, 6, 14);
    S.P('d', 0, S.hz + 8, S.W, 1);
    S.deco(() => { S.art('bollard', 12, S.hz + 18); S.art('windsock', S.W - 9, S.H - 2); });
  },
  // The towns and places where nobody fights in normal play (only debug hooks open a battle there).
  cobblecrest(S){ sky(S); S.fill('K', 0, S.hz - 16, S.W, 8, 0.5, 4, 0); FAR.roofs(S, [[0, 2], [22, 1]]); S.ground('g', 3); S.band('c', 22, 8);
    S.deco(() => { S.art('barrel', S.W - 9, S.H - 2); }); },
  mahopac(S){ sky(S); FAR.hills(S, 'l', 0.9); FAR.roofs(S, [[4, 1], [16, 2]]); S.ground('g', 5); S.band('f', 6, 8, 0.5, 0, 20); S.band('p', 26, 6, 0.5);
    S.deco(() => { S.art('lm_big_tree', S.W - 10, S.H - 2, 0.6); }); },
  highcharity(S){ sky(S); FAR.roofs(S, [[0, 1, 2], [9, 2, 3], [26, 1, 2]]); S.ground('P', 2); S.band('A', 18, 16, 1, S.W - 34, 30);
    S.deco(() => { S.art('flag_pole', 8, S.hz + 14) || S.art('lamp_post', 8, S.hz + 14); }); },
  fb_heights(S){ sky(S); FAR.hills(S, 'l', 1.6); FAR.roofs(S, [[6, 3]]); S.ground('g', 7); S.band('p', 8, 8, 0.5, 0, S.W);
    S.deco(() => { S.art('rock_big', S.W - 9, S.H - 2, 0.75); }); },
  hm_plaza(S){ sky(S); FAR.roofs(S, [[0, 2], [17, 2]]); S.ground('P', 1); S.band('f', 26, 8, 0.5, 0, 24); S.fill('w', S.W - 28, S.hz + 22, 24, 10, 1, 8, 6);
    S.deco(() => { S.art('bench_long', 14, S.hz + 14) || S.art('lamp_post', 14, S.hz + 14); }); },
  // ROUTE_TO_GOVERNOR §9.1 (D1875; BATTLE_BACKDROPS_ACT2 R6): Route 4's three maps, from their own tiles and props.
  route4(S){                                          // the downs: a drystone wall across the slope, the finger post at the fork
    sky(S); FAR.hills(S, 'm', 1.2); S.ground('g', 3); S.band('h', 14, 2);
    S.deco(() => { S.art('finger_post', 12, S.hz + 12) || S.art('stone_marker', 12, S.hz + 12); });
  },
  route4_reeds(S){                                    // the river road: the capital small and far left, the river, the cut's coping, reeds
    sky(S); FAR.roofs(S, [[1, 1]]); S.ground('g');
    S.fill('w', 0, S.hz + 22, S.W, 10, 1, 8, 31); S.band('P', 6, 2);
    [[S.W - 22, 2], [S.W >> 1, 5], [S.W - 8, 9]].forEach(([x, c]) => S.fill('y', x, S.hz + 18, 8, 4, 0.5, c, 30));
    S.deco(() => { S.art('road_bar', 12, S.hz + 14) || S.art('fence_post', 12, S.hz + 14); });
  },
  route4_withy(S){                                    // the withy beds: the pond ringed with reeds, a willow bundle
    sky(S); FAR.hills(S, 'l', 0.8); S.ground('g', 2);
    S.fill('s', 4, S.hz + 18, 30, 12, 0.5, 14, 9); S.fill('w', 6, S.hz + 20, 26, 8, 1, 14, 10); S.band('y', 10, 4);
    S.deco(() => { S.art('withy_bundle', S.W - 9, S.H - 2) || S.art('crate', S.W - 9, S.H - 2); });
  },
  // BRIGHTGATE_LAYOUT v0.2 (BATTLE_BACKDROPS_ACT2 v0.1.1 recipes; the stand-in chars swapped for the city's tiles: L the glide
  // lane, I panel paving, d setts, o cobbles). Haze grey, no mint (D2000).
  brightgate(S){ sky(S); haze(S); FAR.blocks(S, [[0, 12, 10], [14, 9, 14], [41, 10, 12], [54, 12, 9]]); FAR.blocks(S, [[26, 12, 8]], 'C', 'C', 'B', 'F');
    panels(S); S.band('L', 14, 8, 0.5); S.P('w', 0, S.hz + 17, S.W, 1);
    S.fill('I', 2, S.hz + 26, 28, 12, 0.5, 31, 19); S.fill('w', 5, S.hz + 28, 22, 8, 1, 32, 20);
    S.deco(() => { S.art('bg_comfort_lamp', 10, S.hz + 13) || S.art('lamp_post', 10, S.hz + 13); S.art('bg_hedge_planter', S.W - 9, S.H - 2); }); },
  bg_campus(S){ sky(S); haze(S); FAR.blocks(S, [[2, 30, 18]], 's', 'w', 'N', 'V'); S.P('V', 8, S.hz - 22, 18, 1); FAR.blocks(S, [[36, 10, 8], [50, 12, 10]]);
    S.ground('l', 5); S.band('I', 10, 8, 0.5); S.fill('w', S.W - 30, S.hz + 24, 26, 8, 1, 30, 30);
    S.deco(() => { S.art('banner_glim_stand', 10, S.hz + 14) || S.art('flag_pole', 10, S.hz + 14); S.art('bg_hedge_planter', S.W - 9, S.H - 2); }); },
  bg_works(S){ sky(S); haze(S); S.fill('K', 0, S.hz - 12, 30, 12, 0.5, 3, 3); S.P('N', 0, S.hz - 14, 30, 2); FAR.mast(S, 44, 2, 'm', 'h'); FAR.blocks(S, [[50, 13, 9]], 'm', 'd', 'N', 'y');
    S.ground('d', 4); S.fill('F', 0, S.hz, S.W, 8, 0.5, 46, 34);
    for (let x = 1; x < S.W; x += 4) S.P('F', x, S.hz + 14, 2, 5); S.P('h', 0, S.hz + 15, S.W, 1); S.P('h', 0, S.hz + 18, S.W, 1);
    S.band('D', 22, 8, 0.5); S.band('w', 30, 10);
    S.deco(() => { S.art('water_tank', 14, S.hz - 8, 0.75) || S.art('crate_stack', 14, S.hz + 12); S.art('tile_crate', S.W - 9, S.H - 2) || S.art('crate_stack', S.W - 9, S.H - 2); }); },
  bg_oldtown(S){ sky(S); FAR.hills(S, 'g', 0.8); FAR.roofs(S, [[0, 2], [16, 1], [24, 2, 2], [40, 1], [48, 2]]);
    S.ground('o', 6); S.band('o', 6, 8, 0.5); S.fill('s', S.W - 32, S.hz + 22, 30, 14, 1, 20, 30); S.fill('w', S.W - 30, S.hz + 24, 26, 10, 1, 21, 31);
    S.deco(() => { S.art('lamp_post', 12, S.hz + 14); S.art('bench_long', S.W - 12, S.H - 2); }); },
  bg_partner(S){ sky(S); FAR.blocks(S, [[0, 10, 8], [12, 10, 8], [24, 10, 8], [36, 10, 8], [48, 10, 8], [60, 10, 8]], 'h', 'm', 'N', 'V');
    S.ground('l', 2); S.band('I', 8, 8, 0.5); S.band('I', 26, 8, 0.5);
    S.deco(() => { S.art('bg_comfort_lamp', 12, S.hz + 14) || S.art('lamp_post', 12, S.hz + 14); S.art('bg_comfort_lamp', S.W - 8, S.H - 2) || S.art('bg_hedge_planter', S.W - 9, S.H - 2); }); },
};
// Every room (the whole interior list). back: props at the foot of the back wall, left of the foe; front: props in the
// front-right corner. Trial Halls add banners and a floor ring. group: a group battle happens here (boxes()).
const ROOMS = {
  cc_hall_in: { hall: true, banner: ['y', 'o'], ring: 'y', back: ['cairn'], front: ['wall_lantern'] },
  fb_hall_in: { hall: true, banner: ['r', 'D'], ring: 'r', back: ['bloom_urn'], front: ['bloom_pot'] },
  bw_hall_in: { hall: true, banner: ['b', 'w'], ring: 'w', back: ['mr_bell'], front: ['tide_gauge'] },
  hc_arena_in: { ring: 'r', back: ['arena_rope'], front: ['arena_stand'] },
  rx_f1: { group: true, back: ['rx_desk'], front: ['rx_pylon'] },
  rx_f2: { group: true, back: ['rx_rack'], front: ['lab_booth'] },
  rx_f3: { group: true, back: ['rx_shelf'], front: ['lab_file_cart'] },
  rx_f4: { group: true, back: ['lab_tank'], front: ['lab_terminal_bank'] },
  sm_yard: { group: true, dy: 4, back: ['tunnel_brace'], front: ['tunnel_cart'] },   // dy: floor rows below the sky patch
  sm_hold: { group: true, back: ['crate_stack'], front: ['barrel'] },
  sm_den: { group: true, back: ['tunnel_lamp'], front: ['tunnel_desk'] },
  r3_sanctuary: { back: ['comfort_lamp'], front: ['rest_bed'] },
  r3_ledger: { back: ['chart_table'], front: ['tunnel_ledger'] },
  r3_relay: { back: ['rx_rack'], front: ['rx_pylon'] },
  bw_depot_in: { back: ['glimmer_stand'], front: ['depot_crate'] },
  hm_home_in: {}, hm_home_up: {}, hm_home_room: {}, hm_home_hall: {}, hm_lodge_in: {}, hm_lantern_in: {}, hm_rook_in: {}, hm_hq_f1: {}, hm_hq_f2: {},
  hm_school_in: {}, hm_flats_lobby: {}, hm_flats_5: {}, hm_store: {}, hm_wardrobe: {}, hm_diner: {},
  cc_lantern_in: {}, mahopac_obs: {}, dream_2004: {}, dream_party: {}, dream_drive: {},
  hc_airport_in: {}, hc_command_in: {}, hc_barracks_in: {}, hc_marina_in: {}, hc_school_in: {}, hc_bank_in: {}, hc_gym_in: {},
  hc_lantern_in: {}, hc_church_in: {}, hc_hall_in: {}, hc_apt_in: {}, hc_mall_1: {}, hc_mall_2: {},
  sm_tunnel: {}, bw_lantern_in: {}, bw_store_in: {}, fb_lantern_in: {},
  fbh_press_in: {}, fbh_picker_in: {}, fbh_stitch_in: {},   // FERNBROOK_HOMES (on main without a scene; added with WEIR_HUT)
  hw_weir_hut_in: {},   // WEIR_HUT: no wilds or holders inside; listed so every room has a scene (its first two props)
  // Hall 4, VOLT (BATTLE_BACKDROPS_ACT2 v0.1.1): the storm tower.
  bg_hall_in: { hall: true, banner: ['n', 'y'], ring: 'c', back: ['bg_rod'], front: ['bg_coil'] },   // the recipe's mast and vane carry mint pixels; the hall's own rod and coil instead (D2000)
  bg_lantern_in: {}, bg_store_in: {}, bg_hq_lobby: {}, bg_review_in: {}, bg_gala_in: {},   // BRIGHTGATE_LAYOUT (BATTLE_BACKDROPS_ACT2): no battle designed; every room has a scene
};
// A room with no named props takes its own first two prop sprites (back, then front), so every room still shows its things.
function autoProps(env, o){
  if (o.back || o.front) return o;
  const seen = {}, list = [];
  (env.objs || []).forEach(ob => { if (ob.kind === 'prop' && ob.sprite && !seen[ob.sprite] && env.art(ob.sprite)) { seen[ob.sprite] = 1; list.push(ob.sprite); } });
  return Object.assign({}, o, { back: list.slice(0, 1), front: list.slice(1, 2) });
}
// Dreams: every colour steps one shade lighter inside PAL (dark -> mid -> light -> white), so the room reads soft and far off.
const LIGHTER = { k: 'd', d: 'm', m: 'h', h: 'w', n: 'b', b: 'c', c: 's', s: 'w', t: 'g', g: 'l', l: 'w', p: 'r', r: 'o', o: 'y', y: 'w' };
function dreamWash(S){
  const { g, W, H } = S, img = g.getImageData(0, 0, W, H), d = img.data, map = {};
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  for (const [a, b] of Object.entries(LIGHTER)) map[rgb(PAL[a]).join()] = rgb(PAL[b]);
  for (let i = 0; i < d.length; i += 4) { const to = map[d[i] + ',' + d[i + 1] + ',' + d[i + 2]]; if (to) { d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; } }
  g.putImageData(img, 0, 0);
}

const scenes = {};
Object.keys(OUT).forEach(id => { scenes[id] = { room: false }; });
Object.keys(ROOMS).forEach(id => { scenes[id] = { room: true, group: !!ROOMS[id].group, hall: !!ROOMS[id].hall }; });

// Draw map `id`'s scene onto g (W x H). layer: undefined = everything, 'deco' = landmarks and props only (tests).
// Returns the water rects ([x, y, w, h, scale]); any at all means the caller also renders a second water frame.
function render(g, W, H, id, env, layer){
  g.imageSmoothingEnabled = false;
  const S = kit(g, W, H, id, env, layer);
  if (OUT[id]) OUT[id](S);
  else if (ROOMS[id]) { room(S, autoProps(env, ROOMS[id])); if (env.dream && !layer) dreamWash(S); }
  api.last = { id, drew: S.drew.slice() };   // what the last render placed ('art:<name>', 'house:<roofs name>'), for the tests
  return S.wet;
}
// The moving part: a scene with water (render() returned wet rects) carries a second canvas, btAlt, drawn whole on the
// second water frame. Every other half second the caller draws that one. Swapping whole frames keeps anything drawn over
// the water (bridges, docks, props, spray) on top in both. FULL motion only (the caller checks).
function frame(bg, t){ return bg && bg.btAlt && bg.btAlt.width && Math.floor(t / 500) % 2 ? bg.btAlt : bg; }

// HIGH_CHARITY_LAYOUT phase 1: the four new chunks and the new rooms. game.js calls enableCity() only while the city is
// on (HC_CITY_V2 or ?debug=1&hccity=2), so every scene here always has its map in WORLD.
const HC_OUT = {
  hc_civic(S){ OUT.highcharity(S); },
  hc_exchange(S){ OUT.highcharity(S); },
  hc_waterfront(S){ sky(S); FAR.roofs(S, [[0, 1, 2], [20, 2, 3]]); S.ground('D', 2); S.band('w', 22, 10, 1, 0, S.W);
    S.deco(() => { S.art('rope_coil', 10, S.hz + 14) || S.art('lamp_post', 10, S.hz + 14); }); },
  hc_college(S){ sky(S); FAR.roofs(S, [[4, 2, 3]]); S.ground('g', 5); S.band('P', 20, 8, 0.5, 0, S.W);
    S.deco(() => { S.art('lm_big_tree', S.W - 10, S.H - 2, 0.6); }); },
};
const HC_ROOMS = { hc_news_1: {}, hc_news_2: {}, hc_gov_1: {}, hc_gov_3: {} };
// KILNMOUTH v0.1.1 §11.1 (BATTLE_BACKDROPS_ACT2 rows): Claybank Road, the town and Hall 5 from their own tiles and props; the
// other five rooms take the indoor recipe. The road's B10 look (the creek full, puddles) reads the map's soaked cells.
const KM_OUT = {
  km_road(S){                                         // the clay valley: clay hills, the track, a thin low creek with wide sand
    const row = (S.env.cells || [])[25] || [], soaked = row[5] === 'm';
    sky(S); FAR.ridge(S, 'B', 'F'); S.ground('g'); S.band('p', 18, 4);
    if (soaked) { S.band('w', 24, 6); [[6, 12], [S.W - 14, 16], [S.W >> 1, 30]].forEach(([x, y]) => S.P('c', x, S.hz + y, 5, 1)); S.P('h', 0, 2, S.W, 1); }
    else { S.band('s', 24, 3); S.band('w', 27, 3); }
    S.fill('j', S.W - 18, S.hz + 2, 16, 8, 0.5, 2, 20);
    S.deco(() => { S.art('km_hammer', 12, S.hz + 14, 0.75) || S.art('milestone', 12, S.hz + 14); });
  },
  kilnmouth(S){                                       // the flat cloud, two bottle kilns (one smoking east), the yard's clay, the gauge
    const { W, hz, P } = S;
    sky(S); P('h', 0, 0, W, 6); P('m', 0, 6, W, 1);
    [[4, false], [W - 18, true]].forEach(([x, warm]) => {
      P('B', x + 3, hz - 14, 8, 14); P('B', x + 5, hz - 19, 4, 5); P('F', x + 9, hz - 14, 2, 14); P('F', x + 5, hz - 20, 4, 1);
      if (warm) { P('m', x + 9, hz - 24, 3, 2); P('h', x + 12, hz - 27, 3, 2); P('w', x + 15, hz - 29, 2, 1); }
    });
    S.ground('p'); S.band('e', 20, 6, 0.5);
    S.deco(() => { S.art('km_gauge', 10, S.hz + 16, 0.75) || S.art('lamp_post', 10, S.hz + 16); });
  },
};
const KM_ROOMS = { km_hall_in: { hall: true, banner: ['r', 'o'], ring: 'y', back: ['km_vent_lit'], front: ['km_vent'] },
  km_lantern_in: {}, km_store_in: {}, km_bath_in: {}, km_council_in: {}, km_stone_in: {} };
Object.assign(OUT, KM_OUT); Object.assign(ROOMS, KM_ROOMS);
Object.keys(KM_OUT).forEach(id => { scenes[id] = { room: false }; });
Object.keys(KM_ROOMS).forEach(id => { scenes[id] = { room: true, group: false, hall: !!KM_ROOMS[id].hall }; });
function enableCity(){
  Object.assign(OUT, HC_OUT); Object.assign(ROOMS, HC_ROOMS);
  Object.keys(HC_OUT).forEach(id => { scenes[id] = { room: false }; });
  Object.keys(HC_ROOMS).forEach(id => { scenes[id] = { room: true, group: false, hall: false }; });
}
const api = { scenes, render, frame, boxes, lay, enableCity, last: null };
window.BattleBG = api;
})();
