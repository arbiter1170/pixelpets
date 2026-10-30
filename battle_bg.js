/* Walklings: battle scenes (BATTLE_BACKDROPS, D1009: red, off until Vincent approves). No dependencies beyond PAL.
   One scene per map id. Each is drawn from that map's own tiles (env.tile resolves the map's skin, wall kit and seeded
   variants), its own prop sprites (env.art) and PAL fills. No alpha anywhere, so every pixel is a palette colour.
   Outdoor: sky, a far layer and one landmark taken from the map, then the map's ground tiles from the horizon down.
   Indoor: the room's own back wall and floor rows (its grid, without objects), then a few of its props. Dreams get a
   dithered white wash. Layout follows drawBattle: the foe stands top right (x W-26, y H*0.18), the partner bottom left
   (x 6, y H-28). Landmarks and props (the "deco" layer) keep out of both boxes; boxes() names them for the tests. */
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
  const L = lay(W, H), S = { g, W, H, id, env, layer, fy: L.fy, my: L.my, hz: L.hz, r: rng(seedOf(id)), wet: [], on: layer !== 'deco',
    boxes: boxes(W, H, !!(ROOMS[id] && ROOMS[id].group)),
    night: /^night/.test(env.mode || ''), dull: /dull$/.test(env.mode || '') };
  S.P = (col, x, y, w = 1, h = 1) => { if (!S.on) return; g.fillStyle = PAL[col]; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  // Fill a rect with one map tile at scale s (1 or 0.5), clipped. cx/cy seed the map's tile variants; water is noted for anim.
  S.fill = (ch, x, y, w, h, s = 1, cx = 0, cy = 0) => {
    if (!S.on || w <= 0 || h <= 0) return;
    const step = 16 * s;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    for (let j = 0; j * step < h; j++) for (let i = 0; i * step < w; i++) {
      const img = env.tile(ch, cx + i, cy + j); if (img) g.drawImage(img, 0, 0, 16, 16, x + i * step, y + j * step, step, step);
    }
    g.restore();
    if (ch === 'w') S.wet.push([x, y, w, h, s]);
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
    const hits = (x, y, w, h) => S.boxes.some(([bx, bY, bw, bh]) => x < bx + bw && x + w > bx && y < bY + bh && y + h > bY);
    for (const k of [s, s * 0.75, s * 0.5]) {
      const w = Math.round(img.width * k), h = Math.round(img.height * k), x0 = Math.round(cx - w / 2), y0 = by - h, tries = [[x0, y0]];
      for (let x = x0 - 1; x >= 0; x--) tries.push([x, y0]);
      for (let x = x0 + 1; x + w <= W; x++) tries.push([x, y0]);
      for (let y = y0 - 1; y >= 0; y--) tries.push([x0, y]);
      const at = tries.find(([x, y]) => !hits(x, y, w, h));
      if (at) { g.drawImage(img, 0, 0, img.width, img.height, at[0], at[1], w, h); return true; }
    }
    return false;
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
  [3, 17].forEach(x => { P('k', x, hz - 15, 8, 1); P(a, x + 1, hz - 14, 6, 9); P(b, x + 1, hz - 11, 6, 2); P(a, x + 1, hz - 5, 2, 2); P(a, x + 5, hz - 5, 2, 2); });
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
      const x = 2, y = S.hz - 22;
      S.fill('R', x, y, 24, 16, 0.5, 8, 2); S.fill('H', x, y + 16, 24, 8, 0.5, 8, 4);
      S.P('d', x + 9, y + 18, 6, 6); S.P('o', x + 10, y + 19, 4, 5); S.P('y', x + 3, y + 18, 3, 3); S.P('y', x + 18, y + 18, 3, 3);
      S.art('lamp_post', 28, S.hz + 2, 0.5);
      S.art('planter_geranium', S.W - 10, S.H - 2);
    });
  },
  fernbrook(S){                                       // Fernbrook: the fenced orchard, the well, the pond
    sky(S);
    for (let x = -2; x < S.W; x += 9) S.fill('T', x, S.hz - 9, 8, 8, 0.5, x, 11);
    S.ground('g'); S.fill('F', 0, S.hz, S.W, 8, 0.5, 2, 10);
    S.fill('s', S.W - 34, S.hz + 24, 30, 12, 1, 20, 12); S.fill('w', S.W - 32, S.hz + 26, 26, 8, 1, 21, 13);
    S.deco(() => { S.art('lm_well', 13, S.hz + 14) || S.art('apple_crate', 13, S.hz + 14); S.art('apple_crate', S.W - 10, S.H - 2); });
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
      const x = 7, y = S.hz - 14; S.P('k', x + 1, y, 8, 14); S.P('k', x, y + 2, 10, 12); S.P('d', x + 2, y + 1, 1, 13); S.P('m', x, y + 13, 10, 1);
      S.art('barrel', 23, S.hz + 12); S.art('ore_cart', S.W - 11, S.H - 2) || S.art('rc_crate', S.W - 11, S.H - 2);
    });
  },
  hw_rim(S){                                          // Hushwater Rim: cool ridge, quarry rock, the Seam Spring
    sky(S); FAR.ridge(S); S.fill('K', 0, S.hz - 8, S.W, 8, 0.5, 2, 0);
    S.ground('c'); S.band('g', S.H - S.hz - 10, 10, 0.5);
    S.fill('s', 30, S.hz + 20, S.W - 34, 12, 1, 14, 8); S.fill('w', 32, S.hz + 22, S.W - 38, 8, 1, 14, 8);
    S.deco(() => { S.art('seam_stone', 12, S.hz + 12) || S.art('rock_big', 12, S.hz + 12); S.art('rock_small', S.W - 8, S.H - 3); });
  },
  hw_cut(S){                                          // Hushwater Cut: the gorge wall, the river, the Old Weir
    sky(S); FAR.cliff(S, S.hz - 24);
    S.ground('g', 2); S.band('s', 16, 2); S.band('w', 18, 12); S.band('s', 30, 2);
    S.fill('B', 28, S.hz + 16, 14, 16, 1, 20, 8);
    S.deco(() => { S.art('stone_marker', 12, S.hz + 13); S.art('comfort_lamp', S.W - 9, S.H - 2); });
  },
  hw_falls(S){                                        // Hushwater Falls: the falls out of the rock, the pool, spray
    sky(S); FAR.cliff(S, 6);
    S.ground('g', 4); S.band('t', S.H - S.hz - 12, 12, 0.5, S.W - 26, 26);
    S.deco(() => {
      S.fill('w', 12, 6, 12, S.hz - 4, 1, 15, 1); S.P('k', 11, 6, 1, S.hz - 6); S.P('k', 24, 6, 1, S.hz - 6);
      const pw = Math.min(28, S.W - 34);   // the pool stays left of the foe's box
      S.fill('s', 4, S.hz + 2, pw, 14, 0.5, 14, 11); S.fill('w', 6, S.hz + 4, pw - 4, 9, 1, 14, 12);
      const r = rng(seedOf('hw_falls_spray')); for (let i = 0; i < 14; i++) S.P(r() < .5 ? 'w' : 's', 8 + (r() * (pw - 6) | 0), S.hz + (r() * 5 | 0));
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
  hm_home_in: {}, hm_home_up: {}, hm_lodge_in: {}, hm_lantern_in: {}, hm_rook_in: {}, hm_hq_f1: {}, hm_hq_f2: {},
  hm_school_in: {}, hm_flats_lobby: {}, hm_flats_5: {}, hm_store: {}, hm_wardrobe: {}, hm_diner: {},
  cc_lantern_in: {}, mahopac_obs: {}, dream_2004: {}, dream_party: {}, dream_drive: {},
  hc_airport_in: {}, hc_command_in: {}, hc_barracks_in: {}, hc_marina_in: {}, hc_school_in: {}, hc_bank_in: {}, hc_gym_in: {},
  hc_lantern_in: {}, hc_church_in: {}, hc_hall_in: {}, hc_apt_in: {}, hc_mall_1: {}, hc_mall_2: {},
  sm_tunnel: {}, bw_lantern_in: {}, bw_store_in: {}, fb_lantern_in: {},
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
// Returns the water rects ([x, y, w, h, scale]) for anim().
function render(g, W, H, id, env, layer){
  g.imageSmoothingEnabled = false;
  const S = kit(g, W, H, id, env, layer);
  if (OUT[id]) OUT[id](S);
  else if (ROOMS[id]) { room(S, autoProps(env, ROOMS[id])); if (env.dream && !layer) dreamWash(S); }
  return S.wet;
}
// The moving part: the water rects take the second water frame every other half second. FULL motion only (the caller checks).
function anim(g, wet, frame, t){
  if (!wet || !wet.length || !frame || Math.floor(t / 500) % 2 === 0) return;
  g.imageSmoothingEnabled = false;
  for (const [x, y, w, h, s] of wet) {
    const step = 16 * s;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    for (let j = 0; j * step < h; j++) for (let i = 0; i * step < w; i++) g.drawImage(frame, 0, 0, 16, 16, x + i * step, y + j * step, step, step);
    g.restore();
  }
}

window.BattleBG = { scenes, render, anim, boxes, lay };
})();
