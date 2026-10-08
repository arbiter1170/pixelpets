/* Kindle Wild sprite data. Creatures are 16x16, defined as the LEFT half (8 cols) and mirrored.
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
const GLYPH = {
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
  paw:['.##..##.','.##..##.','........','#..##..#','..####..','.######.','.######.','..#..#..'],
  walk:['..##....','.####...','.####...','..##.##.','....####','....####','.....##.','........'],
  book:['.######.','#......#','#.####.#','#......#','#.###..#','#......#','.######.','........'],
  friends:['.##..##.','.##..##.','........','###..###','###..###','###..###','........','........'],
  sound:['...#..#.','..##...#','####.#.#','####.#.#','####.#.#','..##...#','...#..#.','........'],
  mute:['...#....','..##....','####.#.#','####..#.','####.#.#','..##....','...#....','........'],
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
  return T;
}
