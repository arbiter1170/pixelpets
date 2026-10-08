/* Keeper (player) art and looks, MAPS_SLICE Phase K (K.1/K.2/K.5). Layered 16x16 frames: base body + outfit + hair
   ('.' = see-through, top-most wins), facings down/up/right x 2 walk frames, left = right mirrored. Chars are PAL keys
   (sprites.js) plus the skin keys '1'-'6'. Copied from Design's reference art (keeper_art.js, MAPS_SLICE v0.4.2). */
const F2 = (...rows) => [rows.map(r => r.slice(0, 16)), rows.map(r => r.slice(18, 34))];

// New palette colours (append to sprites.js PAL; additive, nothing existing uses these keys). Light -> deep.
const KEEPER_SKIN_PAL = { 1:'#f9dcc0', 2:'#efbb8e', 3:'#d4955f', 4:'#a96e43', 5:'#7d4b2c', 6:'#5a3520' };

const KEEPER_ART = {   // base body (bald head; hands; the outfit covers the 'n' torso)
  down: F2(
    '................  ................',
    '................  ................',
    '.....333333.....  .....333333.....',
    '....33333333....  ....33333333....',
    '...3333333333...  ...3333333333...',
    '...3333333333...  ...3333333333...',
    '...33k3333k33...  ...33k3333k33...',
    '...33k3333k33...  ...33k3333k33...',
    '....33333333....  ....33333333....',
    '......3333......  ......3333......',
    '....nnnnnnnn....  ....nnnnnnnn....',
    '...nnnnnnnnnn...  ...nnnnnnnnnn...',
    '...3nnnnnnnn3...  ...3nnnnnnnn3...',
    '....nnnnnnnn....  ....nnnnnnnn....',
    '....nnnn.nnn....  ....nnn.nnnn....',
    '....ddd...dd....  ....dd...ddd....'),
  up: F2(
    '................  ................',
    '................  ................',
    '.....333333.....  .....333333.....',
    '....33333333....  ....33333333....',
    '...3333333333...  ...3333333333...',
    '...3333333333...  ...3333333333...',
    '...3333333333...  ...3333333333...',
    '...3333333333...  ...3333333333...',
    '....33333333....  ....33333333....',
    '......3333......  ......3333......',
    '....nnnnnnnn....  ....nnnnnnnn....',
    '...nnnnnnnnnn...  ...nnnnnnnnnn...',
    '...3nnnnnnnn3...  ...3nnnnnnnn3...',
    '....nnnnnnnn....  ....nnnnnnnn....',
    '....nnnn.nnn....  ....nnn.nnnn....',
    '....ddd...dd....  ....dd...ddd....'),
  right: F2(
    '................  ................',
    '................  ................',
    '.....333333.....  .....333333.....',
    '....33333333....  ....33333333....',
    '...3333333333...  ...3333333333...',
    '...3333333333...  ...3333333333...',
    '...33333333k33..  ...33333333k33..',
    '...33333333k3...  ...33333333k3...',
    '....33333333....  ....33333333....',
    '......3333......  ......3333......',
    '.....nnnnnn.....  .....nnnnnn.....',
    '.....nnnnnn.....  .....nnnnnn.....',
    '.....nnnnnn3....  .....nnnnnn.....',
    '.....nnnnnn.....  .....nnnnnn.....',
    '.....nnn.nn.....  ......nnnn......',
    '.....dd...dd....  ......dddd......'),
};

const KEEPER_HAIR = {
  short: {
    down: F2(
      '................  ................',
      '.....pppppp.....  .....pppppp.....',
      '....pppppppp....  ....pppppppp....',
      '...pppppppppp...  ...pppppppppp...',
      '...ppppp..ppp...  ...ppppp..ppp...',
      '...pp.......p...  ...pp.......p...',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
    up: F2(
      '................  ................',
      '.....pppppp.....  .....pppppp.....',
      '....pppppppp....  ....pppppppp....',
      '...pppppppppp...  ...pppppppppp...',
      '...pppppppppp...  ...pppppppppp...',
      '...pppppppppp...  ...pppppppppp...',
      '...pppppppppp...  ...pppppppppp...',
      '....pppppppp....  ....pppppppp....',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
    right: F2(
      '................  ................',
      '.....pppppp.....  .....pppppp.....',
      '....ppppppppp...  ....ppppppppp...',
      '...ppppppppppp..  ...ppppppppppp..',
      '...pppppppp.pp..  ...pppppppp.pp..',
      '...pppppp.......  ...pppppp.......',
      '...pppp.........  ...pppp.........',
      '...ppp..........  ...ppp..........',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
  },
  long: {
    down: F2(
      '................  ................',
      '.....pppppp.....  .....pppppp.....',
      '....pppppppp....  ....pppppppp....',
      '...pppppppppp...  ...pppppppppp...',
      '..ppppp..ppppp..  ..ppppp..ppppp..',
      '..ppp......ppp..  ..ppp......ppp..',
      '..pp........pp..  ..pp........pp..',
      '..pp........pp..  ..pp........pp..',
      '..pp........pp..  ..pp........pp..',
      '..pp........pp..  ..pp........pp..',
      '..pp........pp..  ..pp........pp..',
      '..p..........p..  ...p........p...',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
    up: F2(
      '................  ................',
      '.....pppppp.....  .....pppppp.....',
      '....pppppppp....  ....pppppppp....',
      '...pppppppppp...  ...pppppppppp...',
      '...pppppppppp...  ...pppppppppp...',
      '..pppppppppppp..  ..pppppppppppp..',
      '..pppppppppppp..  ..pppppppppppp..',
      '..pppppppppppp..  ..pppppppppppp..',
      '..pppppppppppp..  ..pppppppppppp..',
      '..pppppppppppp..  ..pppppppppppp..',
      '..pppppppppppp..  ..pppppppppppp..',
      '...pppppppppp...  ...pppppppppp...',
      '....pp.pp.pp....  .....pp.pp.pp...',
      '................  ................',
      '................  ................',
      '................  ................'),
    right: F2(
      '................  ................',
      '.....pppppp.....  .....pppppp.....',
      '....ppppppppp...  ....ppppppppp...',
      '...ppppppppppp..  ...ppppppppppp..',
      '..ppppppppp.pp..  ..ppppppppp.pp..',
      '..ppppppp.......  ..ppppppp.......',
      '..pppppp........  ..pppppp........',
      '..ppppp.........  ..ppppp.........',
      '..ppppp.........  ..ppppp.........',
      '..pppp..........  ..pppp..........',
      '..pppp..........  .pppp...........',
      '..ppp...........  .ppp............',
      '..p.............  .p..............',
      '................  ................',
      '................  ................',
      '................  ................'),
  },
  spiky: {
    down: F2(
      '....p..pp..p....  ....p..pp..p....',
      '...pp.pppp.pp...  ...pp.pppp.pp...',
      '..pppppppppppp..  ..pppppppppppp..',
      '..pppppppppppp..  ..pppppppppppp..',
      '...pppp.pp.ppp..  ...pppp.pp.ppp..',
      '...p..p.....p...  ...p..p.....p...',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
    up: F2(
      '....p..pp..p....  ....p..pp..p....',
      '...pp.pppp.pp...  ...pp.pppp.pp...',
      '..pppppppppppp..  ..pppppppppppp..',
      '..pppppppppppp..  ..pppppppppppp..',
      '...pppppppppp...  ...pppppppppp...',
      '...pppppppppp...  ...pppppppppp...',
      '....pppppppp....  ....pppppppp....',
      '....pp.pp.pp....  ....pp.pp.pp....',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
    right: F2(
      '..p...p..p......  ..p...p..p......',
      '..ppp.ppp.pp....  ..ppp.ppp.pp....',
      '.pppppppppppp...  .pppppppppppp...',
      '..pppppppppppp..  ..pppppppppppp..',
      '.pppppppppp.pp..  .pppppppppp.pp..',
      '..pppppp........  ..pppppp........',
      '.ppppp..........  .ppppp..........',
      '...ppp..........  ...ppp..........',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
  },
  bun: {
    down: F2(
      '......pppp......  ......pppp......',
      '......prrp......  ......prrp......',
      '.....pppppp.....  .....pppppp.....',
      '....pppppppp....  ....pppppppp....',
      '...ppp....ppp...  ...ppp....ppp...',
      '...pp......pp...  ...pp......pp...',
      '...p........p...  ...p........p...',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
    up: F2(
      '.....pppppp.....  .....pppppp.....',
      '.....pppppp.....  .....pppppp.....',
      '.....prrrrp.....  .....prrrrp.....',
      '....pppppppp....  ....pppppppp....',
      '...pppppppppp...  ...pppppppppp...',
      '...pppppppppp...  ...pppppppppp...',
      '...pppppppppp...  ...pppppppppp...',
      '....pppppppp....  ....pppppppp....',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
    right: F2(
      '..ppp...........  ..ppp...........',
      '.ppprpppppp.....  .ppprpppppp.....',
      '.ppprppppppp....  .ppprppppppp....',
      '..ppppppppppp...  ..ppppppppppp...',
      '...pppppppp.pp..  ...pppppppp.pp..',
      '...pppppp.......  ...pppppp.......',
      '...pppp.........  ...pppp.........',
      '...ppp..........  ...ppp..........',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................'),
  },
};

const KEEPER_OUTFITS = {
  coat: {   // travel coat + scarf (accent) whose tail flutters + satchel on a strap
    down: F2(
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '....rrrrrrrr....  ....rrrrrrrr....',
      '...ttrrrrrrtt...  ...ttrrrrrrtt...',
      '...tttrttottt...  ...ttttrtottt...',
      '....trrtttoo....  ....ttrtttoo....',
      '....ttrttttoo...  ....tttrtttoo...',
      '................  ................',
      '................  ................'),
    up: F2(
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '....rrrrrrrr....  ....rrrrrrrr....',
      '...ttrrrrrrtt...  ...ttrrrrrrtt...',
      '...ottrrttttt...  ...otttrrtttt...',
      '....oottrttt....  ....ootttrtt....',
      '...oootttrtt....  ...oootttrrt....',
      '................  ................',
      '................  ................'),
    right: F2(
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '.....rrrrrr.....  .....rrrrrr.....',
      '..rrrrrttrrt....  .rrrrrrttrrt....',
      '.rr.oottttt.....  .r..oottttt.....',
      '....oottttt3....  ....oott3tt.....',
      '....oottttttt...  ....ootttttt....',
      '................  ................',
      '................  ................'),
  },
  hoodie: { // hooded top: hood behind the head, drawstrings + pocket trim (accent)
    down: F2(
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '...t........t...  ...t........t...',
      '...tt......tt...  ...tt......tt...',
      '...tttr..rttt...  ...tttr..rttt...',
      '...tttrttrttt...  ...ttrttttrtt...',
      '...tttttttttt...  ...tttttttttt...',
      '....ttrrrrtt....  ....ttrrrrtt....',
      '....tttttttt....  ....tttttttt....',
      '................  ................',
      '................  ................'),
    up: F2(
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '...tt......tt...  ...tt......tt...',
      '...tttttttttt...  ...tttttttttt...',
      '...tdttttttdt...  ...tdttttttdt...',
      '...tdttttttdt...  ...tdttttttdt...',
      '....tddddddt....  ....tddddddt....',
      '....tttttttt....  ....tttttttt....',
      '................  ................',
      '................  ................'),
    right: F2(
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '...tt...........  ...tt...........',
      '...ttt..........  ...ttt..........',
      '...ttttt.r......  ...ttttt.r......',
      '....tttttrt.....  ....ttttrtt.....',
      '.....tttttt.....  .....tttttt.....',
      '.....ttrrrt3....  .....trr3rt.....',
      '.....tttttt.....  .....tttttt.....',
      '................  ................',
      '................  ................'),
  },
  tunic: {  // belted tunic: V neck, short sleeves, sash (accent) with a pouch, flared hem
    down: F2(
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '....ttt..ttt....  ....ttt..ttt....',
      '...ttttrrtttt...  ...ttttrrtttt...',
      '...3tttttttt3...  ...3tttttttt3...',
      '....rrrrrroo....  ....rrrrrroo....',
      '...ttrttttttt...  ...tttrtttttt...',
      '................  ................',
      '................  ................'),
    up: F2(
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '....tttttttt....  ....tttttttt....',
      '...tttttttttt...  ...tttttttttt...',
      '...3tttttttt3...  ...3tttttttt3...',
      '....oorrrrrr....  ....oorrrrrr....',
      '...tttttrrttt...  ...ttttrrtttt...',
      '................  ................',
      '................  ................'),
    right: F2(
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '................  ................',
      '.....tt..t......  .....tt..t......',
      '.....tttttt.....  .....tttttt.....',
      '.....tttttt3....  .....ttt3tt.....',
      '.....rrrrro3....  .....rrr3ro.....',
      '....rtttttt.....  ...rttttttt.....',
      '................  ................',
      '................  ................'),
  },
};

// Player looks (MAPS_SLICE K.2 / K.5). `player.look` = {skin, hair, hairCol, outfit, outfitCol, accent}.
const KEEPER_LOOKS = {
  slots:    ['skin', 'hair', 'hairCol', 'outfit', 'outfitCol', 'accent'],
  base:     { skin:'3', hairCol:'p', outfitCol:'t', accent:'r' },   // the art chars each colour slot recolours
  defaults: { skin:'3', hair:'short', hairCol:'p', outfit:'coat', outfitCol:'t', accent:'r' },
  skin:      ['1', '2', '3', '4', '5', '6'],                 // KEEPER_SKIN_PAL, light -> deep
  hair:      ['short', 'long', 'spiky', 'bun'],              // KEEPER_HAIR shapes
  hairCol:   ['p', 'd', 'o', 'y', 'r', 'h', 'n'],
  outfit:    ['coat', 'hoodie', 'tunic'],                    // KEEPER_OUTFITS shapes
  outfitCol: ['t', 'b', 'g', 'p', 'n', 'r', 'm'],
  accent:    ['r', 'y', 'c', 'l', 'w', 'o', 'p'],
  legacySkin: { y:'2', o:'4', r:'5' },                       // v0.4 skin swatches -> nearest new tone
  examples: [                                                // shown in keeper_preview.png and used by K.7
    { skin:'3', hair:'short', hairCol:'p', outfit:'coat',   outfitCol:'t', accent:'r' },   // the default
    { skin:'1', hair:'long',  hairCol:'y', outfit:'tunic',  outfitCol:'g', accent:'r' },
    { skin:'5', hair:'spiky', hairCol:'d', outfit:'hoodie', outfitCol:'r', accent:'w' },
    { skin:'2', hair:'bun',   hairCol:'o', outfit:'coat',   outfitCol:'b', accent:'y' },
    { skin:'6', hair:'bun',   hairCol:'h', outfit:'tunic',  outfitCol:'p', accent:'c' },
    { skin:'4', hair:'long',  hairCol:'n', outfit:'hoodie', outfitCol:'m', accent:'l' },
    { skin:'3', hair:'spiky', hairCol:'r', outfit:'tunic',  outfitCol:'n', accent:'o' },
    { skin:'5', hair:'short', hairCol:'y', outfit:'coat',   outfitCol:'g', accent:'p' },
  ],
};

// People (Phase M NPCs, trainers): looks too, with any PAL keys; `extra` = one-pass swaps of fixed chars (o n d only).
const KEEPER_SWAPS = {
  player:    {},                                                                                             // = player.look
  ilse:      { skin:'2', hair:'bun',   hairCol:'h', outfit:'coat',   outfitCol:'p', accent:'y', extra:{ o:'g' } }, // grey bun, plum coat, green satchel
  rook:      { skin:'3', hair:'spiky', hairCol:'o', outfit:'hoodie', outfitCol:'b', accent:'w' },                    // "your friend with the spiky hair"
  villager:  { skin:'4', hair:'short', hairCol:'d', outfit:'tunic',  outfitCol:'g', accent:'y' },                    // Hattie, Odile, Mrs. Calloway, Amos
  trainer:   { skin:'2', hair:'short', hairCol:'m', outfit:'hoodie', outfitCol:'c', accent:'o' },                    // route trainers
  associate: { skin:'5', hair:'short', hairCol:'d', outfit:'coat',   outfitCol:'l', accent:'w', extra:{ o:'w' } }, // Glimmerwell mint coat, white scarf + cradle bag
  fen:       { skin:'4', hair:'long',  hairCol:'w', outfit:'tunic',  outfitCol:'g', accent:'l' },                    // Master Fen, orchard keeper
};

// Normalize a saved look (K.5): null/non-object -> null; migrates the v0.4 shape {hair:<colour>, skin, coat, scarf};
// each slot not in its option list -> its default. Unknown keys survive. Pure; safe to call on every load.
function normalizeLook(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const L = KEEPER_LOOKS, out = Object.assign({}, v);
  if (typeof v.hair === 'string' && v.hair.length === 1 && !('hairCol' in v)) { out.hairCol = v.hair; out.hair = L.defaults.hair; }
  if ('coat' in v)  { if (!('outfitCol' in v)) out.outfitCol = v.coat; delete out.coat; }
  if ('scarf' in v) { if (!('accent' in v)) out.accent = v.scarf; delete out.scarf; }
  if (typeof out.skin === 'string' && L.legacySkin[out.skin]) out.skin = L.legacySkin[out.skin];
  for (const k of L.slots) if (!L[k].includes(out[k])) out[k] = L.defaults[k];
  return out;
}

// Compose one 16x16 frame (array of 16 strings of PAL keys / '.') for a look or a KEEPER_SWAPS entry.
// Missing slots use the defaults (null look = default keeper). left = right mirrored. One-pass recolour (no chaining).
function keeperGrid(look, facing, frame) {
  const L = Object.assign({}, KEEPER_LOOKS.defaults, look || {}), B = KEEPER_LOOKS.base;
  const f = facing === 'left' ? 'right' : facing;
  const layers = [KEEPER_ART[f][frame], KEEPER_OUTFITS[L.outfit][f][frame], KEEPER_HAIR[L.hair][f][frame]];
  const sw = Object.assign({}, L.extra || {}, { [B.skin]:L.skin, [B.hairCol]:L.hairCol, [B.outfitCol]:L.outfitCol, [B.accent]:L.accent });
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      let c = '.';
      for (const g of layers) if (g[y][x] !== '.') c = g[y][x];
      r += c === '.' ? '.' : (sw[c] || c);
    }
    rows.push(facing === 'left' ? r.split('').reverse().join('') : r);
  }
  return rows;
}
