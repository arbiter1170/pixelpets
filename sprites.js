/* Walklings sprite data. Creatures are 16x16, defined as the LEFT half (8 cols) and mirrored.
   Chars: . transparent, a main, b belly, c accent, d accent2, x extra, e eye (dark), i eye (shine).
   An outline is added automatically.
   habitat: spawn weight per environment tag (see env.js); tiles: preferred spawn spot on the map
   ('grass' = tall grass, 'shore' = next to water, 'woods' = next to trees). starter: offered as a first pet. uiHalo: draw a light rim around the
   sprite on dark UI cells (dex, collection, header) for dark-bodied species; the map art is unchanged.
   weatherOnly: env tags; the species spawns only while one of them is active and never in the any-species roll.
   Order matters: indices are runtime species numbers and ids are save-v2 form ids, so new lines are only ever appended. */
'use strict';
const PAL = {k:'#1a1c2c',p:'#5d275d',r:'#b13e53',o:'#ef7d57',y:'#ffcd75',l:'#a7f070',g:'#38b764',t:'#257179',
  n:'#29366f',b:'#3b5dc9',c:'#41a6f6',s:'#73eff7',w:'#f4f4f4',h:'#94b0c2',m:'#566c86',d:'#333c57',
  // keeper skin tones (MAPS_SLICE K.1, light -> deep); appended only: no creature, tile, icon or glyph uses these keys
  '1':'#f9dcc0','2':'#efbb8e','3':'#d4955f','4':'#a96e43','5':'#7d4b2c','6':'#5a3520'};

const SPECIES = [
  { id:'ember', starter:true, habitat:{hot:6, meadow:1, city:1}, tiles:'grass', type:'EMBER', blurb:'A cozy fire fox. Loves to play.', stages:[
    { name:'Pipkit', col:{a:PAL.o,b:PAL.y,c:PAL.r,d:PAL.y,x:PAL.r}, half:[
      '........','........','........','........','........',
      '...c....','...ac...','...aaaaa','..aaieaa','..aaeeaa',
      '..aaaabe','..aaabbb','...aabbb','...aaaaa','...aa...','........']},
    { name:'Emberfox', col:{a:PAL.o,b:PAL.y,c:PAL.r,d:PAL.y,x:PAL.r}, half:[
      '........','........','..c.....','..ac....','..aac..d',
      '..aaaacd','.aaaaaaa','.aaieaaa','.aaeeaaa','.aaaaabe',
      '..aaabbb','..abbbbb','..aabbbb','..aaabbb','..aa..aa','........']},
    { name:'Blazetail', col:{a:PAL.r,b:PAL.y,c:PAL.o,d:PAL.y,x:PAL.w}, half:[
      '.c......','.cd....d','.acd..dc','.aac.dcc','.aaaaaca',
      'caaaaaaa','.aaieaaa','caaeeaaa','.caaaabe','..aabbbb',
      '.dabbbbb','dcabbcbb','dcaabbcc','.daabbbb','..aaa.aa','..cc..cc']}
  ]},
  { id:'tide', starter:true, habitat:{water:6, rain:4, storm:2, park:1}, tiles:'shore', type:'TIDE', blurb:'A bubbly water drop. Very chill.', stages:[
    { name:'Drizzlet', col:{a:PAL.c,b:PAL.s,c:PAL.b,d:PAL.w,x:PAL.w}, half:[
      '........','........','........','........','.......a',
      '......aa','.....aaa','....adaa','...aaaaa','...aieaa',
      '...aeeaa','...aaaaa','...abbbb','....abbb','.....aaa','........']},
    { name:'Puddlepup', col:{a:PAL.c,b:PAL.w,c:PAL.b,d:PAL.s,x:PAL.w}, half:[
      '........','......bb','.....bdd','......bb','...aaaaa',
      '..aaaaaa','.caaaaaa','ccaieaaa','ccaeeaaa','.caaaabe',
      '..abbbbb','..abbbbb','..aabbbb','...aaaaa','...cc.cc','........']},
    { name:'Tidehound', col:{a:PAL.b,b:PAL.s,c:PAL.c,d:PAL.w,x:PAL.w}, half:[
      '...c....','..cc...c','..cbc.cb','.ccbbcbb','.caaaaaa',
      'caaaaaaa','caaieaaa','caaeeaaa','ccaaaabe','.caabbbb',
      'ccabbbbb','cdabbdbb','.caabbbb','..aaaaaa','..cc..cc','........']}
  ]},
  { id:'bloom', starter:true, habitat:{forest:6, park:4, meadow:4}, tiles:'grass', type:'BLOOM', blurb:'A sprouting bunny. Shy but brave.', stages:[
    { name:'Sproutbun', col:{a:PAL.l,b:PAL.w,c:PAL.g,d:PAL.o,x:PAL.r}, half:[
      '........','........','.....cc.','.......c','....a..c',
      '....a..c','...aaaaa','...aaaaa','..aaieaa','..aaeeaa',
      '..adaabb','...abbbb','...abbbb','...aaaaa','....aa..','........']},
    { name:'Bloomhop', col:{a:PAL.l,b:PAL.w,c:PAL.g,d:PAL.y,x:PAL.r}, half:[
      '........','......dd','.a...ddx','.a....dd','.aa....c',
      '..aa...c','..aa...c','..aaaaaa','.aaaaaaa','.aaieaaa',
      '.xaeeaaa','.aaaaabb','..abbbbb','..aabbbb','..aaaaaa','..cc..cc']},
    { name:'Thornhare', col:{a:PAL.g,b:PAL.l,c:PAL.t,d:PAL.r,x:PAL.y}, half:[
      '.c.....d','.ac...dx','.aac..dd','..aa.c.c','..aacccc',
      '.caaaaaa','ccaaaaaa','ccaieaaa','ccaeeaaa','ccdaaabe',
      '.caabbbb','ccabbbbb','ccabbdbb','.caabbbb','..aaaaaa','..cc..cc']}
  ]},
  /* --- wild-only lines (appended; never reorder: saves store species by index) --- */
  { id:'stone', habitat:{mountain:7, cold:1}, tiles:'woods',
    type:'STONE', blurb:'A sturdy little rock. Naps on mountaintops.', stages:[
    { name:'Pebblit', col:{a:PAL.m,b:PAL.h,c:PAL.d,d:PAL.l,x:PAL.s}, half:[
      '........','........','........','........','......d.',
      '.......d','....aaaa','...abbaa','..abbaaa','..aaieaa',
      '..aaeeaa','..caaaaa','..aacaaa','...aaaaa','....cc..','........']},
    { name:'Cragcub', col:{a:PAL.m,b:PAL.h,c:PAL.d,d:PAL.l,x:PAL.s}, half:[
      '........','.......x','.aa...xx','.aca.axx','.aaaaaaa',
      '.abaaaaa','.baaaaaa','.aaieaaa','.aaeeaaa','.caaaabe',
      '..aabbbb','.daabbbb','ddaabbbb','.daaaaaa','..aaa.aa','..cc..cc']},
    { name:'Peakroar', col:{a:PAL.m,b:PAL.h,c:PAL.d,d:PAL.l,x:PAL.s}, half:[
      '.......x','.....x.x','.b...xxx','bbb.aaaa','abbaaaaa',
      'aaaacaaa','caaaieaa','caaaeeaa','dcaaaaca','ddcaabbb',
      'dcaabbbb','.caabbcb','.caabbbb','..caaaaa','..aaaa..','..cccc..']}
  ]},
  { id:'volt', habitat:{city:7, storm:4}, tiles:'grass',
    type:'VOLT', blurb:'A buzzing city critter. Loves neon lights.', stages:[
    { name:'Zipmite', col:{a:PAL.y,b:PAL.w,c:PAL.o,d:PAL.c,x:PAL.o}, half:[
      '........','........','.......d','......dd','.......d',
      '.......c','....aaaa','...aaaaa','..caaaaa','..aaieaa',
      '..aaeeaa','..aaaaab','...abbbb','...aabbb','....aaaa','....cc..']},
    { name:'Voltwhisk', col:{a:PAL.y,b:PAL.w,c:PAL.o,d:PAL.c,x:PAL.o}, half:[
      '........','.c......','.ac.....','.aac...d','..aaaadd',
      '..aaaaad','.aaaaaaa','daaieaaa','.aaeeaaa','daaaaabe',
      '..aabbbb','..abbbbb','.caabbbb','..aaabbb','..aa..aa','........']},
    { name:'Teslynx', col:{a:PAL.y,b:PAL.w,c:PAL.o,d:PAL.c,x:PAL.o}, half:[
      'd.......','.c......','.cc....d','.acc..dd','.aaaaadd',
      'caaaaaaa','caaieaaa','daaeeaaa','dcaaaabe','.ccabbbb',
      'dccabbbb','.cabbdbb','..aabbbb','..aaaaaa','..aaa.aa','..cc..cc']}
  ]},
  { id:'frost', habitat:{snow:8, cold:3, mountain:2}, tiles:'grass',
    type:'FROST', blurb:'A fluffy snow sprite. Hums when it snows.', stages:[
    { name:'Chillbit', col:{a:PAL.w,b:PAL.s,c:PAL.c,d:PAL.b,x:PAL.h}, half:[
      '........','........','........','.......c','......cc',
      '.......c','....a.aa','...aaaaa','..aaaaaa','..aaieaa',
      '..aaeeaa','.aaaaaaa','..abbbbb','..aabbbb','...aaaaa','....dd..']},
    { name:'Frostfuzz', col:{a:PAL.w,b:PAL.s,c:PAL.c,d:PAL.b,x:PAL.h}, half:[
      '........','........','..c.....','..cc....','...aa.a.',
      '..aaaaaa','.aaaaaaa','.aaieaaa','aaaeeaaa','.aaaaaax',
      'aaaaaaaa','.aaaaabb','aaaaabbb','.aaaaabb','..aaaaaa','..dd..dd']},
    { name:'Glacitan', col:{a:PAL.w,b:PAL.s,c:PAL.c,d:PAL.b,x:PAL.h}, half:[
      'c.......','cc......','.cc.....','.ccaa...','..aaaaaa',
      '.aaaaaaa','caaieaaa','caaeeaaa','aaaaaaxx','caaaaaaa',
      'ccaaaabb','caaaabbb','aaaaabcb','.aaaabbb','..aaa.aa','..dd..dd']}
  ]},
  { id:'gust', habitat:{storm:7, windy:6, rain:3, mountain:1}, tiles:'grass',
    type:'GUST', blurb:'A breezy cloud bird. Rides the storm winds.', stages:[
    { name:'Puffkin', col:{a:PAL.h,b:PAL.w,c:PAL.m,d:PAL.y,x:PAL.c}, half:[
      '........','........','........','........','......b.',
      '...b.bbb','..bbbaaa','.baaaaaa','.aaaieaa','.aaaeeaa',
      '.caaaaad','..aaaaaa','..abbbbb','...bbbbb','....d.d.','........']},
    { name:'Gustwing', col:{a:PAL.h,b:PAL.w,c:PAL.m,d:PAL.y,x:PAL.c}, half:[
      '........','.......c','......cc','.....cca','....aaaa',
      '...aaaaa','..aaieaa','..aaeeaa','..aaaaad','c.aaaabd',
      'cc.abbbb','cccabbbb','.ccabbbb','...abbbb','....aaaa','....d.d.']},
    { name:'Galecrest', col:{a:PAL.h,b:PAL.w,c:PAL.m,d:PAL.y,x:PAL.c}, half:[
      '......d.','.....dd.','c.....dd','cc...aaa','ccc.aaaa',
      'cccaaaaa','.ccaieaa','.ccaeeaa','..caaaad','..caaabb',
      '.ccabbbb','.ccabbbb','..cabbbb','...abbbb','....aaaa','....d.d.']}
  ]},
  { id:'shade', habitat:{night:6, fog:4, forest:1}, tiles:'woods', uiHalo:true,   // dark body: light rim on dark UI cells only
    type:'SHADE', blurb:'A sleepy shadow cat. Wakes up after dark.', stages:[
    { name:'Duskmote', col:{a:PAL.p,b:PAL.n,c:PAL.d,d:PAL.y,x:PAL.s}, half:[
      '........','........','........','........','....a...',
      '....aa..','....aaaa','...aaaaa','..aaieaa','..aaeeaa',
      '..aaaaaa','..aaaaaa','...aaaaa','...a.aaa','....a.a.','........']},
    { name:'Nightling', col:{a:PAL.p,b:PAL.n,c:PAL.d,d:PAL.y,x:PAL.s}, half:[
      '........','.a......','.aa.....','.aba....','.abaaaaa',
      '..aaaaaa','c.aaaaaa','ccaieaaa','ccaeeaaa','c.aaaabe',
      '..abbbbb','..abbbbb','..aabbbb','...aaaaa','...aa.aa','........']},
    { name:'Eclipsar', col:{a:PAL.p,b:PAL.n,c:PAL.d,d:PAL.y,x:PAL.s}, half:[
      '.a......','.aa.....','.aba...d','.abaa.dd','..aaaaad',
      'c.aaaaaa','ccaieaaa','ccaeeaaa','cccaaabe','cccabbbb',
      'cc.abbbb','c..abbbb','...abbbb','..aaaaaa','..aaa.aa','..cc..cc']}
  ]},
  // CREATURES_SLICE.md lines (v0.2), indices 8-13. Ids are permanent and append-only (save v2 form ids).
  // Art: the designer's draft halves, copied here (design/ is never deployed).
  { id:'beetle', habitat:{park:5, forest:4, meadow:4, rain:1}, tiles:'grass',
    type:'BLOOM', blurb:'An apple-shelled beetle. Orchards love it.', stages:[
    { name:'Pomlet', col:{a:PAL.r,b:PAL.y,c:PAL.g,d:PAL.d,x:PAL.w}, half:[
      '........', '........', '........', '.......d', '.....ccd',
      '....aaaa', '...aaxaa', '..aaaaaa', '..aaieaa', '..aaeeaa',
      '..aaaaaa', '..abbbbb', '...abbbb', '....aaaa', '....d.d.', '........']},
    { name:'Pomshell', col:{a:PAL.r,b:PAL.y,c:PAL.g,d:PAL.d,x:PAL.w}, half:[
      '........', '....d...', '.....d..', '.....aaa', '....aaaa',
      '....aiea', '....aeea', '..ccaaad', '.caaaaad', 'ccaadaad',
      'ccaaaaad', '.caaadad', '.caaaaad', '..caaaad', '..d..d..', '........']},
    { name:'Orchardon', col:{a:PAL.r,b:PAL.y,c:PAL.g,d:PAL.d,x:PAL.w}, half:[
      '......x.', '.....xbx', '.......d', 'c.....aa', 'cc...aaa',
      'ccc.aaaa', '.ccaieaa', '.ccaeeaa', 'ccaaaaad', 'ccaadaad',
      'ccaaaaad', '.caadaad', '.caaaaad', '..aabbbd', '.d..d...', 'd..d....']}
  ]},
  { id:'mole', habitat:{meadow:5, forest:3, park:3, rain:2}, tiles:'grass',
    type:'BLOOM', blurb:'A sleepy mole. Plants things as it digs.', stages:[
    { name:'Loamlet', col:{a:PAL.m,b:PAL.h,c:PAL.g,d:PAL.r,x:PAL.y}, half:[
      '........', '........', '........', '......c.', '.......c',
      '....aaaa', '...aaaaa', '..aaaaaa', '..abieba', '..abeeba',
      '..aaaabb', '..aaaabd', '.xxaaaaa', '..aaaaaa', '...aaaaa', '........']},
    { name:'Burrowbloom', col:{a:PAL.m,b:PAL.h,c:PAL.g,d:PAL.r,x:PAL.y}, half:[
      '........', '.......d', '......dx', '.....c.d', '....aaaa',
      '...aaaaa', '..aaaaaa', '.aabieba', '.aabeeba', '.aaaaabb',
      '.aaaaabd', 'xxaaaaaa', 'xxaaaaaa', '.aaaaabb', '..aaaabb', '..aaa.aa']},
    { name:'Hedgewarden', col:{a:PAL.m,b:PAL.h,c:PAL.g,d:PAL.r,x:PAL.y}, half:[
      '...c...d', '..ccc.dx', '.ccccc.d', 'ccccaaaa', 'cccaaaaa',
      'ccaaaaaa', 'ccabieba', 'c.abeeba', '..aaaabb', '..aaaabd',
      'xxaaaaaa', 'xxaaaabb', 'xxaaabbb', '.aaaabbb', '..aaaaaa', '..aaa.aa']}
  ]},
  { id:'crab', habitat:{water:7, rain:4, fog:2}, tiles:'shore',
    type:'TIDE', blurb:'A tidepool crab. Collects beach glass.', stages:[
    { name:'Clinkit', col:{a:PAL.o,b:PAL.w,c:PAL.s,d:PAL.l,x:PAL.r}, half:[
      '........', '........', '........', '........', '........',
      '.....dcc', '....aaaa', 'x..aaaaa', 'xx.aieaa', 'xxaaeeaa',
      '.xaaaaaa', '..abbbbb', '...abbbb', '..a.a..a', '........', '........']},
    { name:'Shardpincer', col:{a:PAL.o,b:PAL.w,c:PAL.s,d:PAL.l,x:PAL.r}, half:[
      '........', '........', 'x.......', 'xx...c.d', 'xx..cbdc',
      '.x.aaaaa', '.xaaaaaa', '..aaaaaa', '..aaieaa', '..aaeeaa',
      '.aaaaaaa', '..abbbbb', '.a.abbbb', 'a.a.aaaa', '.a..a..a', '........']},
    { name:'Mosaicrab', col:{a:PAL.o,b:PAL.w,c:PAL.s,d:PAL.l,x:PAL.r}, half:[
      'x.......', 'xx......', 'xxx..c.d', 'xxx.cbdc', '.xx.dcbd',
      '..xaaaaa', '..aacadc', '..aaaaaa', '.aaaieaa', 'aaaaeeaa',
      'a.aaaaaa', '.aaabbbb', 'a.aabbbb', '.a.abbbb', 'a.a.aaaa', '.a..a..a']}
  ]},
  { id:'moth', habitat:{night:6, city:5, park:1}, tiles:'grass',
    type:'VOLT', blurb:'A fuzzy static moth. Drawn to bright lanterns.', stages:[
    { name:'Fuzzwick', col:{a:PAL.y,b:PAL.w,c:PAL.o,d:PAL.s,x:PAL.n}, half:[
      '........', '........', '........', '...d....', '....a...',
      '.....a..', '....bbbb', '...bbbbb', '..baieaa', '..baeeaa',
      '..bbaaaa', '...ccaaa', '...aaaaa', '...ccaaa', '....aaaa', '....d..d']},
    { name:'Filamoth', col:{a:PAL.y,b:PAL.w,c:PAL.o,d:PAL.s,x:PAL.n}, half:[
      '...d....', '....a...', '.....a..', 'cc....aa', 'caa..aaa',
      'caaabaaa', 'caaabiea', 'caaabeea', 'ccaaabbb', '.caaabbb',
      '..caabbb', '.caaabbb', 'ccaa.bbb', 'cca..bbb', '.....bb.', '......d.']},
    { name:'Halowatt', col:{a:PAL.y,b:PAL.w,c:PAL.o,d:PAL.s,x:PAL.n}, half:[
      '....dddd', '...d....', '....dddd', 'cc....aa', 'cca..aaa',
      'caaa.aaa', 'caaabiea', 'caaabeea', 'caxaabbb', 'caaaabbb',
      'ccaaabbb', '.caaabbb', 'caxaabbb', 'ccaa.bbb', 'cc...bbb', '......dd']}
  ]},
  { id:'vane', habitat:{storm:4, snow:3, windy:2}, weatherOnly:['storm','snow'], tiles:'grass',   // weather form: storm/snow only; ~1 in 10 there (spec draft: 8/8/3)
    type:'GUST', blurb:'A weathervane chick. Only seen in wild weather.', stages:[
    { name:'Vanelet', col:{a:PAL.c,b:PAL.w,c:PAL.y,d:PAL.s,x:PAL.m}, half:[
      '........', '........', '.......c', '......cc', '.......c',
      '....aaaa', '...aaaaa', '..aaieaa', '..aaeeaa', '..aaaaax',
      '.daaabbb', '..aaabbb', '...abbbb', '....aaaa', '....x.x.', '........']},
    { name:'Vanefledge', col:{a:PAL.c,b:PAL.w,c:PAL.y,d:PAL.s,x:PAL.m}, half:[
      '.......c', '......cc', '.....c.c', '.......c', '....aaaa',
      '...aaaaa', 'd.aaieaa', 'd.aaeeaa', 'aa.aaaax', 'aaaaabbb',
      '.aaaabbb', 'aaaaabbb', '.aa.abbb', '....aaaa', '....x.x.', '........']},
    { name:'Squallvane', col:{a:PAL.b,b:PAL.w,c:PAL.y,d:PAL.s,x:PAL.m}, half:[
      '.......c', 'c.....cc', 'cc...c.c', '.cc...aa', '..caaaaa',
      'd.aaaaaa', 'd.aaieaa', 'ddaaeeaa', 'aaaaaaax', 'aaaaabbb',
      'aaaaabbb', '.aaaabbb', 'aa.aabbb', 'a...abbb', '....aaaa', '....x.x.']}
  ]},
  { id:'dormouse', habitat:{night:8, fog:3, forest:2, cold:1}, tiles:'woods', uiHalo:true,   // main colour PAL.b (draft: PAL.n) so it reads on the night map
    type:'SHADE', blurb:'A humming night dormouse. Glows in the cold.', stages:[
    { name:'Dozmouse', col:{a:PAL.b,b:PAL.h,c:PAL.s,d:PAL.y,x:PAL.w}, half:[
      '........', '........', '........', '..aa....', '.acca...',
      '.accaaaa', '..aaaaaa', '..abbbbb', '..abiebb', '..abeebb',
      '..abbbbd', '...aaaaa', '..aaabbb', '..aaabbb', '...aaaaa', '...aa.aa']},
    { name:'Lullamouse', col:{a:PAL.b,b:PAL.h,c:PAL.s,d:PAL.y,x:PAL.w}, half:[
      '........', '.aa.....', 'acca....', 'acca....', 'accaaaaa',
      '.aaaaacc', '..aaaaaa', '..abbbbb', '..abiebb', '..abeebb',
      '..abbbbd', '..aaaaaa', '.aaaabbb', '.aaaabbb', '..aaaaaa', '..aaa.aa']},
    { name:'Moondozer', col:{a:PAL.b,b:PAL.h,c:PAL.s,d:PAL.y,x:PAL.w}, half:[
      'd.......', 'aa......', 'aca.....', 'acca....', '.accaaac',
      '..aaaacc', '..aaaaaa', 'c.abbbbb', 'ccabiebb', 'ccabeebb',
      'ccabbbbd', 'ccaaaaaa', '.caaabbb', 'c.aaabbb', '...aaaaa', '..aa..aa']}
  ]}
];

/* Build an 18x18 canvas (16x16 + 1px outline border). mode: 'normal' | 'blink' | solid colour string */
function buildSprite(half, col, mode){
  const grid = half.map(h => { h = (h + '........').slice(0,8); return (h + h.split('').reverse().join('')).split(''); });
  const c = document.createElement('canvas'); c.width = 18; c.height = 18;
  const g = c.getContext('2d');
  const filled = (x,y) => x>=0 && y>=0 && x<16 && y<16 && grid[y][x] !== '.';
  g.fillStyle = PAL.k;
  for (let y=-1; y<=16; y++) for (let x=-1; x<=16; x++)
    if (!filled(x,y) && (filled(x-1,y)||filled(x+1,y)||filled(x,y-1)||filled(x,y+1))) g.fillRect(x+1,y+1,1,1);
  const isEye = ch => ch==='e' || ch==='i';
  for (let y=0; y<16; y++) for (let x=0; x<16; x++){
    const ch = grid[y][x]; if (ch === '.') continue;
    let fill;
    if (mode !== 'normal' && mode !== 'blink') fill = mode;
    else if (isEye(ch)) {
      if (mode === 'blink') fill = (y<15 && isEye(grid[y+1][x])) ? col.a : PAL.k;
      else fill = ch === 'e' ? PAL.k : PAL.w;
    } else fill = col[ch] || PAL.m;
    g.fillStyle = fill; g.fillRect(x+1,y+1,1,1);
  }
  return c;
}

/* tiny pixel glyphs; chars are PAL keys */
// acorn / star: Design ICONS_SEALS (5d59b34) icon_acorn / icon_star, 8x8 colour, copied verbatim.
const GLYPH = {
  acorn: [
    '...pp...',
    '.rroorr.',
    'roorooor',
    'rrrrrrrr',
    '.yyyyyo.',
    '.ywyyyo.',
    '..yyyo..',
    '...yo...',
  ],
  star: [
    '...yy...',
    '...yy...',
    'yyyyyyyy',
    '.yyyyyo.',
    '..yyyo..',
    '.yyoyoo.',
    '.yo..oo.',
    'o......o',
  ],
  // 9x12 emote balloons: Design ICONS_SEALS (5d59b34) emote_*, copied verbatim; drawn at X = tileX + 4, Y = tileY - 15.
  emote_bang: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwwrrrwwk',
    'kwwrrrwwk',
    'kwwrrrwwk',
    'kwwwrwwwk',
    'kwwwwwwwk',
    'kwwrrrwwk',
    'kwwrrrwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  emote_sleep: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwwbbbbbk',
    'kwwwwwbbk',
    'kwwwwbbwk',
    'kwwwbbwwk',
    'kwwbbbbbk',
    'kbbbwwwwk',
    'kwbwwwwwk',
    'kbbbwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  emote_heart: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwrrwrrwk',
    'krwrrrrrk',
    'krrrrrrrk',
    'kwrrrrrwk',
    'kwwrrrwwk',
    'kwwwrwwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  emote_hearts: [
    '.kkkkkkk.',
    'kwwwwrwrk',
    'kwwwwrrrk',
    'kwwwwwrwk',
    'kwrwrwwwk',
    'krrrrrwwk',
    'krrrrrwwk',
    'kwrrrwwwk',
    'kwwrwwwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  heart:['.r.r.','rrrrr','rrrrr','.rrr.','..r..'],
  apple:['..t..','.rrr.','rrrwr','rrrrr','.rrr.'],
  z:['www','..w','.w.','w..','www'],
  spark:['.y.','yww','.y.'],
  bang:['y','y','y','.','y'],
  cloud:['..ww....','.wwww.ww','wwwwwwww'],
};
function drawGlyph(g, name, x, y){
  const gl = GLYPH[name];
  for (let j=0;j<gl.length;j++) for (let i=0;i<gl[j].length;i++){
    const ch = gl[j][i]; if (ch==='.') continue; g.fillStyle = PAL[ch]; g.fillRect((x|0)+i,(y|0)+j,1,1);
  }
}

/* 8x8 tab icons */
const ICONS = {
  // d-pad arrows: Design ICONS_SEALS icon_up/left/right/down as masks (CSS keeps the colour).
  up: [
    '........',
    '........',
    '...##...',
    '..####..',
    '.######.',
    '########',
    '........',
    '........',
  ],
  left: [
    '.....#..',
    '....##..',
    '...###..',
    '..####..',
    '..####..',
    '...###..',
    '....##..',
    '.....#..',
  ],
  right: [
    '..#.....',
    '..##....',
    '..###...',
    '..####..',
    '..####..',
    '..###...',
    '..##....',
    '..#.....',
  ],
  down: [
    '........',
    '........',
    '########',
    '.######.',
    '..####..',
    '...##...',
    '........',
    '........',
  ],
  paw:['.##..##.','.##..##.','........','#..##..#','..####..','.######.','.######.','..#..#..'],
  walk:['..##....','.####...','.####...','..##.##.','....####','....####','.....##.','........'],
  book:['.######.','#......#','#.####.#','#......#','#.###..#','#......#','.######.','........'],
  friends:['.##..##.','.##..##.','........','###..###','###..###','###..###','........','........'],
  sound:['...#..#.','..##...#','####.#.#','####.#.#','####.#.#','..##...#','...#..#.','........'],
  mute:['...#....','..##....','####.#.#','####..#.','####.#.#','..##....','...#....','........'],
  gear:['..#.#.#.','.#.###.#','##....##','.#....#.','##....##','.#.###.#','..#.#.#.','........'],
};

/* Tiles 16x16 */
function rng(seed){ return () => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed/0x7fffffff; }; }
function mkTile(fn){ const c=document.createElement('canvas'); c.width=c.height=16; fn(c.getContext('2d')); return c; }
function px(g,col,x,y,w=1,h=1){ g.fillStyle=col; g.fillRect(x,y,w,h); }
function grassBase(g, seed){ px(g,PAL.g,0,0,16,16); const r=rng(seed); for(let i=0;i<9;i++) px(g, r()<.5?PAL.l:PAL.t, (r()*16)|0, (r()*16)|0); }
function buildTiles(){
  const T = {};
  T.g = mkTile(g => grassBase(g, 7));
  T.f = mkTile(g => { grassBase(g, 3); [[3,3,'w'],[10,5,'y'],[6,11,'r'],[12,12,'w']].forEach(([x,y,c])=>{ px(g,PAL[c],x-1,y); px(g,PAL[c],x+1,y); px(g,PAL[c],x,y-1); px(g,PAL[c],x,y+1); px(g,PAL.y,x,y); }); });
  T.t = mkTile(g => { px(g,PAL.t,0,0,16,16);
    [[0,1],[5,0],[10,2],[2,8],[7,7],[12,9],[4,13]].forEach(([x,y])=>{ px(g,PAL.g,x,y+2,1,3); px(g,PAL.l,x+1,y,1,5); px(g,PAL.g,x+2,y+1,1,4); px(g,PAL.k,x,y+5,3,1); }); });
  T.p = mkTile(g => { px(g,PAL.y,0,0,16,16); const r=rng(11); for(let i=0;i<10;i++) px(g, r()<.6?PAL.o:PAL.w, (r()*16)|0, (r()*16)|0); });
  T.w = [0,1].map(f => mkTile(g => { px(g,PAL.b,0,0,16,16);
    [[2,3],[9,6],[4,11],[11,13]].forEach(([x,y])=>{ px(g,PAL.c,(x+f*2)%16,y,4,1); px(g,PAL.s,(x+f*2+1)%16,y-1,2,1); }); }));
  T.T = mkTile(g => { grassBase(g, 5);
    for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const d=(x-7.5)**2+(y-6.5)**2;
      if (d<=49) px(g,PAL.k,x,y); if (d<=36) px(g,PAL.t,x,y); if (d<=36 && (x-6)**2+(y-5)**2<=12) px(g,PAL.g,x,y); if ((x-5)**2+(y-4)**2<=2) px(g,PAL.l,x,y); }
    px(g,PAL.k,6,13,4,3); px(g,PAL.p,7,13,2,3); });
  // MAPS_SLICE §2 town tiles
  T.R = mkTile(g => { px(g,PAL.r,0,0,16,16);
    for (let y=0;y<12;y+=4){ px(g,PAL.p,0,y+3,16,1); for (let x=(y/4)%2*4;x<16;x+=8) px(g,PAL.p,x,y,1,3); px(g,PAL.o,((y/4)%2*4+2)%16,y+1,2,1); }
    px(g,PAL.p,0,12,16,4); px(g,PAL.k,0,15,16,1); });
  T.H = mkTile(g => { px(g,PAL.h,0,0,16,16); [3,7,11,15].forEach(y => px(g,PAL.m,0,y,16,1)); [[5,0],[12,4],[2,8],[9,12]].forEach(([x,y]) => px(g,PAL.m,x,y,1,3)); px(g,PAL.w,0,0,16,1); });
  T.F = mkTile(g => { grassBase(g, 9); [1,12].forEach(x => { px(g,PAL.h,x,3,3,12); px(g,PAL.w,x,3,2,11); }); [5,10].forEach(y => { px(g,PAL.h,0,y,16,2); px(g,PAL.w,0,y,16,1); }); });
  T.s = mkTile(g => { px(g,PAL.y,0,0,16,16); const r=rng(23); for(let i=0;i<12;i++) px(g, PAL.o, (r()*16)|0, (r()*16)|0); px(g,PAL.w,(r()*16)|0,(r()*16)|0); });
  T.B = mkTile(g => { px(g,PAL.o,0,0,16,16); [3,7,11,15].forEach(x => px(g,PAL.d,x,0,1,16)); px(g,PAL.d,0,0,16,1); px(g,PAL.d,0,15,16,1); px(g,PAL.y,1,2,1,1); px(g,PAL.y,9,9,1,1); });
  // INTERIORS §2.1 interior tiles (W2 = the window variant on odd columns)
  const planks = g => { px(g,PAL.o,0,0,16,16); [4,9,14].forEach(y => px(g,PAL.d,0,y,16,1)); [[6,0],[13,5],[3,10]].forEach(([x,y]) => px(g,PAL.d,x,y,1,4)); };
  T['#'] = mkTile(g => { planks(g); px(g,PAL.m,0,0,16,3); px(g,PAL.d,0,3,16,1); });
  T.W = mkTile(g => { planks(g); px(g,PAL.d,0,15,16,1); });
  T.W2 = mkTile(g => { planks(g); px(g,PAL.d,0,15,16,1); px(g,PAL.d,4,3,8,8); px(g,PAL.c,5,4,6,6); px(g,PAL.s,5,4,3,2); px(g,PAL.d,7,4,1,6); px(g,PAL.d,5,6,6,1); });
  T['.'] = mkTile(g => { px(g,PAL.y,0,0,16,16); [0,5,10,15].forEach(y => px(g,PAL.o,0,y,16,1)); [[3,1],[11,6],[6,11]].forEach(([x,y]) => px(g,PAL.o,x,y,1,4)); });
  T['='] = mkTile(g => { px(g,PAL.r,0,0,16,16); for (let y=2;y<16;y+=4) for (let x=(y%8?0:2);x<16;x+=4) px(g,PAL.p,x,y,1,1); });
  T.m = mkTile(g => { px(g,PAL.y,0,0,16,16); px(g,PAL.d,1,3,14,10); px(g,PAL.o,2,4,12,8); for (let x=3;x<14;x+=2) px(g,PAL.d,x,5,1,6); });
  return T;
}
// World sprites (MAPS_SLICE §2/§4 doors, signs, props, pickups; INTERIORS §2.2 furniture), 16x16, PAL only.
function buildWorldArt(){
  const A = {}, oval = (g, cx, cy, rx, ry, col) => { for (let y=0;y<16;y++) for (let x=0;x<16;x++) if (((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1) px(g,col,x,y); };
  A.door = mkTile(g => { px(g,PAL.d,3,2,10,14); px(g,PAL.o,4,3,8,13); px(g,PAL.d,7,4,1,12); px(g,PAL.y,10,9,1,2); px(g,PAL.d,4,2,8,1); });
  A.sign = mkTile(g => { px(g,PAL.d,7,9,2,7); px(g,PAL.o,7,9,1,6); px(g,PAL.d,1,2,14,8); px(g,PAL.o,2,3,12,6); px(g,PAL.y,4,4,8,1); px(g,PAL.y,4,6,6,1); px(g,PAL.k,1,10,14,1); });
  A.bed = mkTile(g => { px(g,PAL.d,1,0,14,16); px(g,PAL.w,2,1,12,4); px(g,PAL.h,2,4,12,1); px(g,PAL.r,2,5,12,10);
    for (let y=5;y<15;y+=4) for (let x=2+((y-5)/4%2)*3;x<14;x+=6) px(g,PAL.y,x,y,3,2); px(g,PAL.k,1,15,14,1); });
  A.rest_bed = mkTile(g => { oval(g,7.5,10,7,5,PAL.d); oval(g,7.5,10,6,4,PAL.o); oval(g,7.5,9.5,4.5,2.5,PAL.c); px(g,PAL.y,3,12,10,1); px(g,PAL.s,5,8,3,1); });
  A.bookshelf = mkTile(g => { px(g,PAL.d,1,0,14,16); px(g,PAL.k,2,1,12,14); [5,10].forEach(y => px(g,PAL.d,2,y,12,1));
    const cols = ['r','b','g','y','c','r','w']; [[1,4],[6,9],[11,14]].forEach(([y0,y1],j) => { for (let x=2,i=j;x<14;x+=2,i++) px(g,PAL[cols[i%cols.length]],x,y0+(i%2),1,y1-y0-(i%2)); }); });
  A.mirror = mkTile(g => { px(g,PAL.o,4,13,1,3); px(g,PAL.o,11,13,1,3); px(g,PAL.o,5,13,6,1); oval(g,7.5,6.5,5,6.5,PAL.o); oval(g,7.5,6.5,4,5.5,PAL.c); oval(g,7.5,6.5,3,4.5,PAL.s); px(g,PAL.w,6,3,1,3); px(g,PAL.w,7,2,1,1); });
  A.glowbox = mkTile(g => { px(g,PAL.d,1,3,14,12); px(g,PAL.o,2,4,12,10); px(g,PAL.k,3,5,8,8); px(g,PAL.c,4,6,6,6); px(g,PAL.s,4,6,3,2); px(g,PAL.y,12,6,1,1); px(g,PAL.y,12,9,1,1); px(g,PAL.d,3,15,2,1); px(g,PAL.d,11,15,2,1); });
  A.pet_terminal = mkTile(g => { px(g,PAL.m,1,2,14,14); px(g,PAL.h,2,3,12,12); px(g,PAL.k,3,4,10,4); px(g,PAL.t,4,5,8,2); [3,7,11].forEach((x,i) => { px(g,PAL.d,x,10,3,3); px(g,i===1?PAL.l:PAL.y,x+1,11,1,1); }); px(g,PAL.k,1,15,14,1); });
  A.table_small = mkTile(g => { px(g,PAL.d,4,10,1,6); px(g,PAL.d,11,10,1,6); oval(g,7.5,8,7,3,PAL.d); oval(g,7.5,7.5,6,2.2,PAL.o); px(g,PAL.w,7,3,3,4); px(g,PAL.h,7,6,3,1); px(g,PAL.w,10,4,1,2); });
  const wicker = g => { px(g,PAL.d,2,6,12,9); px(g,PAL.o,3,7,10,7); for (let y=7;y<14;y+=2) for (let x=3+(y%4?1:0);x<13;x+=2) px(g,PAL.y,x,y,1,1); px(g,PAL.k,2,15,12,1); };
  A.basket = mkTile(g => { wicker(g); px(g,PAL.w,2,4,12,3); px(g,PAL.c,3,5,10,1); px(g,PAL.y,7,3,2,1); });
  A.basket_empty = mkTile(g => { wicker(g); px(g,PAL.d,3,7,10,2); px(g,PAL.w,10,3,4,4); px(g,PAL.h,11,6,3,1); });
  A.wall_lantern = [0,1].map(f => mkTile(g => { px(g,PAL.d,7,0,2,3); px(g,PAL.d,5,3,6,1); px(g,PAL.y,5,4,6,8); px(g,PAL.d,6,5,4,6); px(g,PAL.o,7,7-f,2,3+f); px(g,PAL.y,7,8,2,1+f); px(g,PAL.d,5,12,6,1); }));
  A.floor_lantern = [0,1].map(f => mkTile(g => { oval(g,7.5,4.5,6+f,4+f,'rgba(255,205,117,.25)'); px(g,PAL.d,7,8,2,7); px(g,PAL.d,4,15,8,1); px(g,PAL.y,5,1,6,7); px(g,PAL.d,6,2,4,5); px(g,PAL.o,7,4-f,2,3+f); px(g,PAL.y,7,5,2,1); }));
  A.glimmer_stand = mkTile(g => { px(g,PAL.w,1,7,14,3); px(g,PAL.h,1,10,14,1); px(g,PAL.d,2,11,1,5); px(g,PAL.d,13,11,1,5); [[3,'l'],[7,'s'],[11,'l']].forEach(([x,c]) => { px(g,PAL.d,x,3,2,1); px(g,PAL[c],x,4,2,3); px(g,PAL.w,x,4,1,1); }); px(g,PAL.l,1,7,14,1); });
  A.crate = mkTile(g => { px(g,PAL.d,1,3,14,13); px(g,PAL.o,2,4,12,11); px(g,PAL.d,2,9,12,1); for (let i=0;i<11;i++) px(g,PAL.d,2+i,4+i,1,1); px(g,PAL.y,3,5,1,1); });
  A.pickup = mkTile(g => { oval(g,7.5,10,4,3.5,PAL.k); oval(g,7.5,10,3,2.5,PAL.r); px(g,PAL.w,6,9,1,1); px(g,PAL.y,7,6,2,2); px(g,PAL.w,12,4,1,1); px(g,PAL.y,11,4,3,1); px(g,PAL.y,12,3,1,3); });
  // Travel Shelf (INVENTORY §5): a short wooden shelf with snack jars, used at (6,2) in hm_lantern_in.
  A.travel_shelf = mkTile(g => {
    px(g,PAL.d,1,2,14,13); px(g,PAL.o,2,3,12,11); px(g,PAL.d,2,7,12,1); px(g,PAL.d,2,12,12,1);
    [[3,'r'],[6,'y'],[9,'g'],[12,'c']].forEach(([x,c]) => { px(g,PAL.k,x,4,2,3); px(g,PAL[c],x,5,2,2); });
    [[4,'y'],[7,'r'],[10,'o']].forEach(([x,c]) => { px(g,PAL.k,x,9,2,3); px(g,PAL[c],x,10,2,2); });
    px(g,PAL.k,1,15,14,1);
  });
  A.talk = ['.wwwwww.','wwwwwwww','wkwkwkww','wwwwwwww','.wwwwww.','..ww....','.w......','........'];   // 8x8 speech bubble (INTERIORS §6)
  return A;
}
