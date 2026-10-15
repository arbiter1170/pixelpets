/* Walklings sprite data. Creatures are 16x16, defined as the LEFT half (8 cols) and mirrored.
   Chars: . transparent, a main, b belly, c accent, d accent2, x extra, e eye (dark), i eye (shine).
   An outline is added automatically.
   habitat: spawn weight per environment tag (see env.js); tiles: preferred spawn spot on the map
   ('grass' = tall grass, 'shore' = next to water, 'woods' = next to trees). starter: offered as a first pet. uiHalo: draw a light rim around the
   sprite on dark UI cells (dex, collection, header) for dark-bodied species; the map art is unchanged.
   weatherOnly: env tags; the species spawns only while one of them is active and never in the any-species roll.
   Order matters: indices are runtime species numbers and ids are save-v2 form ids, so new lines are only ever appended.
   labOnly: never in the habitat roll or the 8% any-species roll. Met only where a map places it. */
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
    type:'VOLT', blurb:'A buzzing city Walkling. Loves neon lights.', stages:[
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
  ]},
  // Index 14. A floating computer. labOnly: the Arbiter bay is the only place it appears.
  { id:'byte', habitat:{}, labOnly:true, tiles:'grass',
    type:'VOLT', blurb:'A floating little computer. Hums when it thinks.', stages:[
    { name:'Bitlet', col:{a:PAL.c,b:PAL.s,c:PAL.y,d:PAL.m,x:PAL.w}, half:[
      '........','.......c','......dc','..dddddd','.daaaaaa','.daaieaa','.daaeeaa','.dabbbaa',
      '..dddddd','...cc...','..c...c.','........','........','........','........','........']},
    { name:'Hoverbyte', col:{a:PAL.b,b:PAL.c,c:PAL.y,d:PAL.h,x:PAL.w}, half:[
      '.......c','......cc','.ddddddd','daaaaaaa','daaaieaa','daaaeeaa','dabbbbaa','daaaaaaa',
      '.ddddddd','...cc...','..c..c..','........','........','........','........','........']},
    { name:'Archivolt', col:{a:PAL.s,b:PAL.c,c:PAL.y,d:PAL.d,x:PAL.h}, half:[
      '.......c','......dc','....dddd','....dxdd','....aiea','....aeea','....abba','....aaaa',
      '....dxdd','....dddd','....dddd','....dddd','......cc','.....c..','....c..c','........']}
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
  phone:['.######.','#......#','#.####.#','#......#','#......#','#.####.#','.######.','...##...'],
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
  // COBBLECREST outdoor tiles: K rock face (solid), c gravel (walk + roam). Rm is the slate Hall roof (roofs.hall col m).
  T.K = mkTile(g => { px(g,PAL.d,0,0,16,16);
    for (let y = 0; y < 16; y += 4) { px(g,PAL.m,0,y,16,3); px(g,PAL.k,0,y+3,16,1); }
    [[1,1],[8,5],[3,9],[10,13]].forEach(([x,y]) => px(g,PAL.h,x,y,4,1)); });
  T.c = mkTile(g => { px(g,PAL.m,0,0,16,16); const r = rng(41);
    for (let i = 0; i < 8; i++) px(g, r() < 0.55 ? PAL.h : PAL.w, (r()*14+1)|0, (r()*14+1)|0, 2, 1);
    px(g,PAL.d,3,5,1,1); px(g,PAL.d,10,11,1,1); });
  T.Rm = mkTile(g => { px(g,PAL.m,0,0,16,16);
    for (let y = 0; y < 12; y += 4) { px(g,PAL.d,0,y+3,16,1); for (let x = (y/4)%2*4; x < 16; x += 8) px(g,PAL.d,x,y,1,3); px(g,PAL.h,((y/4)%2*4+2)%16,y+1,2,1); }
    px(g,PAL.d,0,12,16,4); px(g,PAL.k,0,15,16,1); });
  // INTERIORS §2.1 interior tiles (W2 = the window variant on odd columns)
  const planks = g => { px(g,PAL.o,0,0,16,16); [4,9,14].forEach(y => px(g,PAL.d,0,y,16,1)); [[6,0],[13,5],[3,10]].forEach(([x,y]) => px(g,PAL.d,x,y,1,4)); };
  T['#'] = mkTile(g => { planks(g); px(g,PAL.m,0,0,16,3); px(g,PAL.d,0,3,16,1); });
  T.W = mkTile(g => { planks(g); px(g,PAL.d,0,15,16,1); });
  T.W2 = mkTile(g => { planks(g); px(g,PAL.d,0,15,16,1); px(g,PAL.d,4,3,8,8); px(g,PAL.c,5,4,6,6); px(g,PAL.s,5,4,3,2); px(g,PAL.d,7,4,1,6); px(g,PAL.d,5,6,6,1); });
  T['.'] = mkTile(g => { px(g,PAL.y,0,0,16,16); [0,5,10,15].forEach(y => px(g,PAL.o,0,y,16,1)); [[3,1],[11,6],[6,11]].forEach(([x,y]) => px(g,PAL.o,x,y,1,4)); });
  T['='] = mkTile(g => { px(g,PAL.r,0,0,16,16); for (let y=2;y<16;y+=4) for (let x=(y%8?0:2);x<16;x+=4) px(g,PAL.p,x,y,1,1); });
  // COBBLECREST Hall: slate flagstones and a rock pillar.
  T[':'] = mkTile(g => { px(g,PAL.m,0,0,16,16); px(g,PAL.d,0,0,16,1); px(g,PAL.d,0,8,16,1); px(g,PAL.d,0,0,1,16); px(g,PAL.d,8,0,1,8); px(g,PAL.d,4,8,1,8); px(g,PAL.h,2,2,2,1); px(g,PAL.h,10,10,2,1); });
  T.X = mkTile(g => { px(g,PAL.k,3,0,10,16); px(g,PAL.d,4,1,8,14); px(g,PAL.m,6,2,2,12); px(g,PAL.h,6,3,1,4); px(g,PAL.k,3,0,10,1); px(g,PAL.k,3,15,10,1); });
  T.m = mkTile(g => { px(g,PAL.y,0,0,16,16); px(g,PAL.d,1,3,14,10); px(g,PAL.o,2,4,12,8); for (let x=3;x<14;x+=2) px(g,PAL.d,x,5,1,6); });
  // High Charity: plaza stone, dock planks, airship pad, and a blue civic roof (map cells stay R; roofs.col 'b').
  T.P = mkTile(g => { px(g,PAL.h,0,0,16,16); px(g,PAL.n,0,7,16,2); px(g,PAL.n,7,0,2,16);
    px(g,PAL.w,2,2,3,1); px(g,PAL.w,11,10,3,1); px(g,PAL.y,4,11,1,1); });
  T.D = mkTile(g => { px(g,PAL.o,0,0,16,16); [0,4,8,12].forEach(y => px(g,PAL.d,0,y,16,1));
    [[2,1],[9,5],[5,9],[12,13]].forEach(([x,y]) => px(g,PAL.d,x,y,1,3));
    px(g,PAL.t,0,14,16,2); px(g,PAL.y,6,2,1,1); });
  T.A = mkTile(g => { px(g,PAL.w,0,0,16,16); px(g,PAL.h,0,0,16,2); px(g,PAL.h,0,14,16,2);
    px(g,PAL.h,0,0,2,16); px(g,PAL.h,14,0,2,16); px(g,PAL.y,6,6,4,4); px(g,PAL.o,7,7,2,2);
    px(g,PAL.c,3,3,2,1); px(g,PAL.c,11,12,2,1); });
  T.Rb = mkTile(g => { px(g,PAL.b,0,0,16,16);
    for (let y = 0; y < 12; y += 4) { px(g,PAL.n,0,y+3,16,1); for (let x = (y/4)%2*4; x < 16; x += 8) px(g,PAL.n,x,y,1,3); px(g,PAL.h,((y/4)%2*4+2)%16,y+1,2,1); }
    px(g,PAL.n,0,12,16,4); px(g,PAL.k,0,15,16,1); });
  // Mahopac home stairs.
  T['^'] = mkTile(g => { px(g,PAL.o,0,0,16,16); [4,9,14].forEach(y => px(g,PAL.d,0,y,16,1));
    px(g,PAL.d,2,12,12,2); px(g,PAL.h,3,12,10,1); px(g,PAL.d,4,8,8,2); px(g,PAL.h,5,8,6,1); px(g,PAL.d,6,4,4,2); px(g,PAL.w,7,4,2,1); });
  // FERNBROOK_HEIGHTS §3 lab skin (design b9dadef): drawn in place of the house tiles on maps with "skin": "lab".
  const LAB_TILES = {"lab_floor":["hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwsswwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwwwwwwwhwsswwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww"],"lab_floor_bay":["hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwsswwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwlwhwwwwwww","hwwwwwwwhwwwwwww","hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwwwwwwwhwsswwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwlw","hwwwwwwwhwwwwwww"],"lab_wall":["mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","dddddddddddddddd","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh","hhhhhhhwhhhhhhhh"],"lab_wall_face":["wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","hhhhhhhhhhhhhhhh","llllllllllllllll","hhhhhhhhhhhhhhhh","dddddddddddddddd"],"lab_wall_win":["wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwwwwhwwwwwwww","wwwwmmmmmmmmwwww","wwwwmsssmccmwwww","wwwwmsccmccmwwww","wwwwmcccmccmwwww","wwwwmmmmmmmmwwww","wwwwmcccmccmwwww","wwwwmcccmccmwwww","wwwwmmmmmmmmwwww","wwwwwwwhwwwwwwww","hhhhhhhhhhhhhhhh","llllllllllllllll","hhhhhhhhhhhhhhhh","dddddddddddddddd"],"lab_runner":["hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwsswwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hhhhhhhhhhhhhhhh","slllslllslllslll","slllslllslllslll","hhhhhhhhhhhhhhhh","hwwwwwwwhwsswwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww"],"lab_mat":["hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwsswwwwhwwwwwww","hmmmmmmmmmmmmmmw","hmhhhhhhhhhhhhmw","hmhhsshhhhsshhmw","hmhhhhsssshhhhmw","hmhhhhhhhhhhhhmw","hmhhsshhhhsshhmh","hmhhhhsssshhhhmw","hmhhhhhhhhhhhhmw","hmhhhhhhhhhhhhmw","hmmmmmmmmmmmmmmw","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww"],"lab_floor_scuff":["hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwsswwwwhwwwwwww","hwwwwwwwhwwwwhww","hwwwwwwwhwwwwwww","hwwwhhwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwwwwwwwhwsswwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwhwww","hwwhwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww"],"lab_floor_cable":["hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwsswwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","dmddddmddddmdddd","kkkkkkkkkkkkkkkk","hwwwwwwwhwwwwwww","hwwwwwwwhwsswwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww"],"lab_floor_drain":["hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwsswwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwmmmmmmmmwwww","hwwwmhdddddmwwww","hwwwmdkkkkdmwwww","hwwwmddddddmwwww","hhhhmdkkkkdmhhhh","hwwwmddddddmwwww","hwwwmddddddmwwww","hwwwmmmmmmmmwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww"],"lab_guide_v":["hhhhhhhllhhhhhhh","hwwwwwhslhwwwwww","hwsswwhllhwwwwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww","hwwwwwhslhwwwwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww","hhhhhhhllhhhhhhh","hwwwwwhslhwwwwww","hwwwwwhllhsswwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww","hwwwwwhslhwwwwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww"],"lab_guide_h":["hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","hwsswwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hhhhhhhhhhhhhhhh","lslllslllslllsll","llllllllllllllll","hhhhhhhhhhhhhhhh","hwwwwwwwhwsswwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww","hwwwwwwwhwwwwwww"],"lab_guide_x":["hhhhhhhllhhhhhhh","hwwwwwhllhwwwwww","hwsswwhllhwwwwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww","hhhhhhsssshhhhhh","llllllswwsllllll","llllllswwsllllll","hhhhhhsssshhhhhh","hwwwwwhllhsswwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww","hwwwwwhllhwwwwww"],"lab_hazard":["yyyykkkkyyyykkkk","yyykkkkyyyykkkky","yykkkkyyyykkkkyy","ykkkkyyyykkkkyyy","kkkkyyyykkkkyyyy","kkkyyyykkkkyyyyk","kkyyyykkkkyyyykk","kyyyykkkkyyyykkk","yyyykkkkyyyykkkk","yyykkkkyyyykkkky","yykkkkyyyykkkkyy","ykkkkyyyykkkkyyy","kkkkyyyykkkkyyyy","kkkyyyykkkkyyyyk","kkyyyykkkkyyyykk","kyyyykkkkyyyykkk"],"lab_dais":["mmmmmmmmmmmmmmmm","mwwwwwwwwwwwwwwm","mhhhhhhhhhhhhhhm","mhhhhhhhhhhhhhhm","mhhhlhhhhhhlhhhm","mhhhhhhhhhhhhhhm","mhhhhhhhhhhhhhhm","mhhhhhhsshhhhhhm","mhhhhhhsshhhhhhm","mhhhhhhhhhhhhhhm","mhhhhhhhhhhhhhhm","mhhhlhhhhhhlhhhm","mhhhhhhhhhhhhhhm","mhhhhhhhhhhhhhhm","mhhhhhhhhhhhhhhm","mmmmmmmmmmmmmmmm"],"lab_glass":["hhhhhhhhhhhhhhhh","hwwwwwwwhwwwwwww","mmmmmmmmmmmmmmmm","mssssssssssssssm","msswsssssswssssm","mssswsssssswsssm","msssswsssssssssm","mssssssssssssssm","mssssssssssssssm","mssssssssssssssm","mssssssssssssssm","mssssssssssssssm","mssssssssssssssm","mmmmmmmmmmmmmmmm","llllllllllllllll","hwwwwwwwhwwwwwww"],"lab_door_locked":["wwwwwwwhwwwwwwww","wwwmmmmmmmmmmwww","wwwmhhhmmhhhmwww","wwwmhhhmmhhhmwww","wwwmhhhmmhhhmwww","wwwmhhhmmhhhmwww","wwwmrrrmmrrrmddw","wwwmrrrmmrrrmrdw","wwwmhhhmmhhhmdlw","wwwmhhhmmhhhmddw","wwwmhhhmmhhhmwww","wwwmhhhmmhhhmwww","hhhmhhhmmhhhmhhh","lllmhhhmmhhhmlll","hhhmhhhmmhhhmhhh","dddddddddddddddd"]};   // + BUILD_RX_F4_PILOT pilot tiles (fernbrook_heights_art.json -> pilot.tiles, verbatim)
  for (const [k, rows] of Object.entries(LAB_TILES)) T[k] = mkTile(g => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); })));
  // E4 decal layer: a decal tile is drawn over the floor (and its seeded variant) as only the pixels that differ from lab_floor_bay.
  for (const k of ['lab_floor_cable', 'lab_floor_drain', 'lab_guide_v', 'lab_guide_h', 'lab_guide_x']) {
    const rows = LAB_TILES[k], base = LAB_TILES.lab_floor_bay;
    T[k + '_decal'] = mkTile(g => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.' && ch !== base[y][x]) px(g, PAL[ch], x, y); })));
  }
  // B5 house interiors. Each room gets its own floor, wall face and baseboard. No k outline.
  const specks = (g, list) => list.forEach(([x, y, c]) => px(g, PAL[c], x, y));
  function woodFloor(base, seam, seams, knots, marks){
    return mkTile(g => {
      px(g, PAL[base], 0, 0, 16, 16);
      seams.forEach(y => px(g, PAL[seam], 0, y, 16, 1));
      knots.forEach(([x, y]) => px(g, PAL[seam], x, y, 1, 4));
      specks(g, marks || []);
    });
  }
  function stoneFloor(a, b, spec, crack){
    return mkTile(g => {
      px(g, PAL[a], 0, 0, 16, 16);
      px(g, PAL[b], 0, 0, 16, 1); px(g, PAL[b], 0, 8, 16, 1);
      px(g, PAL[b], 0, 0, 1, 8); px(g, PAL[b], 8, 0, 1, 8);
      px(g, PAL[b], 0, 8, 1, 8); px(g, PAL[b], 5, 8, 1, 8);
      specks(g, spec || []);
      if (crack) px(g, PAL[b], crack[0], crack[1], crack[2], 1);
    });
  }
  function cobbleFloor(shift, chip){
    return mkTile(g => {
      px(g, PAL.d, 0, 0, 16, 16);
      [[1, 1, 6, 4], [8, 2, 6, 4], [2, 7, 5, 4], [8, 8, 6, 5], [1, 12, 6, 3]].forEach(([x, y, w, h], i) => {
        px(g, (i + shift) % 2 ? PAL.h : PAL.m, x, y + (i === shift ? 1 : 0), w, h);
        px(g, PAL.w, x + 1, y + 1, 2, 1);
      });
      if (chip) px(g, PAL.o, chip[0], chip[1], 1, 1);
    });
  }
  function wallTop(fill, line, marks){
    return mkTile(g => { px(g, PAL[fill], 0, 0, 16, 16); px(g, PAL[line], 0, 0, 16, 2); specks(g, marks || []); });
  }
  function wallFace(fill, line, board, marks, win){
    return mkTile(g => {
      px(g, PAL[fill], 0, 0, 16, 16);
      px(g, PAL[line], 0, 4, 16, 1); px(g, PAL[line], 0, 9, 16, 1);
      px(g, PAL[board], 0, 14, 16, 2); px(g, PAL[line], 0, 13, 16, 1);
      specks(g, marks || []);
      if (win) {
        const [x, y, w, h, frame, glass] = win;
        px(g, PAL[frame], x, y, w, h);
        px(g, PAL[glass], x + 1, y + 1, w - 2, h - 2);
        px(g, PAL.s, x + 1, y + 1, Math.max(2, (w / 3) | 0), 2);
        px(g, PAL[frame], x + ((w / 2) | 0), y + 1, 1, h - 2);
      }
    });
  }
  function brickWall(board, win){
    return mkTile(g => {
      px(g, PAL.d, 0, 0, 16, 16);
      for (let row = 0; row < 4; row++) {
        const y = row * 4, off = row % 2 ? 0 : 4;
        for (let x = -8 + off; x < 16; x += 8) px(g, PAL.r, Math.max(0, x), y, Math.min(7, 16 - Math.max(0, x)), 3);
      }
      px(g, PAL.m, 0, 14, 16, 2);
      if (win) {
        px(g, PAL.d, 4, 2, 8, 8); px(g, PAL.c, 5, 3, 6, 6); px(g, PAL.s, 5, 3, 2, 2); px(g, PAL.d, 7, 3, 1, 6);
      } else px(g, PAL[board], 0, 14, 16, 2);
    });
  }
  function logWall(win){
    return mkTile(g => {
      px(g, PAL.d, 0, 0, 16, 16);
      for (let y = 0; y < 14; y += 4) { px(g, PAL.o, 0, y, 16, 3); px(g, PAL.y, 2, y, 3, 1); px(g, PAL.d, 10, y + 1, 2, 1); }
      px(g, PAL.d, 0, 14, 16, 2);
      if (win) { px(g, PAL.d, 6, 2, 4, 8); px(g, PAL.c, 7, 3, 2, 6); px(g, PAL.s, 7, 3, 1, 2); }
    });
  }
  T.house_floor_a = woodFloor('y', 'o', [0, 5, 10, 15], [[3, 1], [11, 6], [6, 11]], [[8, 3, 'd'], [2, 8, 'w']]);
  T.house_floor_b = woodFloor('y', 'o', [0, 5, 11, 15], [[7, 1], [2, 6], [12, 12]], [[4, 7, 'd'], [9, 2, 'd'], [13, 9, 'd']]);
  T.house_honey_c = woodFloor('y', 'd', [0, 6, 10, 15], [[5, 1], [13, 7], [1, 11]], [[10, 4, 'o'], [3, 13, 'o']]);
  T.house_loft = woodFloor('w', 'h', [1, 8, 14], [[4, 2], [12, 9]], [[6, 5, 'y'], [2, 12, 'y']]);
  T.house_loft_b = woodFloor('w', 'y', [1, 7, 14], [[8, 2], [2, 9]], [[11, 4, 'h'], [5, 12, 'o']]);
  T.house_loft_c = woodFloor('w', 'h', [0, 8, 15], [[6, 1], [14, 9]], [[3, 6, 'd'], [9, 11, 'y']]);
  T.house_log = woodFloor('o', 'd', [0, 4, 8, 12], [[2, 1], [9, 5], [5, 9]], [[12, 2, 'y'], [4, 7, 'd']]);
  T.house_log_b = woodFloor('o', 'd', [1, 5, 9, 13], [[6, 2], [13, 6], [3, 10]], [[8, 3, 'd'], [1, 8, 'd'], [11, 12, 'y']]);
  T.house_log_c = woodFloor('d', 'o', [0, 4, 8, 12], [[4, 1], [11, 5], [7, 9]], [[2, 6, 'o'], [14, 10, 'y']]);
  T.house_birch = woodFloor('w', 'y', [0, 8], [[5, 1], [12, 9]], [[3, 4, 'h'], [9, 12, 'h'], [14, 3, 's']]);
  T.house_birch_b = woodFloor('w', 'h', [0, 8], [[2, 1], [9, 9]], [[6, 5, 'y'], [13, 11, 'd']]);
  T.house_birch_c = woodFloor('h', 'w', [0, 8, 15], [[7, 1], [1, 9]], [[11, 4, 'w'], [4, 12, 'y']]);
  T.house_rook = woodFloor('r', 'd', [0, 4, 8, 12], [[3, 1], [10, 5], [6, 9]], [[8, 2, 'o'], [1, 7, 'o']]);
  T.house_rook_b = woodFloor('o', 'r', [0, 4, 8, 12], [[6, 1], [13, 5], [2, 9]], [[4, 6, 'd'], [11, 10, 'd']]);
  T.house_rook_c = woodFloor('r', 'o', [1, 5, 9, 13], [[4, 2], [11, 6], [8, 10]], [[2, 3, 'd'], [14, 8, 'y']]);
  T.floor_flag = stoneFloor('h', 'm', [[3, 3, 'w'], [11, 11, 'w']], null);
  T.floor_flag_b = stoneFloor('m', 'd', [[6, 4, 'h'], [12, 2, 'h']], [2, 5, 4]);
  T.floor_flag_c = stoneFloor('h', 'd', [[4, 10, 'w'], [13, 6, 'y']], [9, 12, 5]);
  T.floor_ink = woodFloor('t', 'n', [0, 8], [[4, 1], [11, 9]], [[7, 4, 'b'], [2, 12, 's']]);
  T.floor_ink_b = woodFloor('n', 't', [0, 8, 15], [[6, 1], [2, 9]], [[10, 5, 'b'], [13, 11, 'h']]);
  T.floor_ink_c = woodFloor('t', 'b', [1, 9], [[8, 2], [3, 10]], [[5, 6, 'n'], [12, 13, 's']]);
  T.floor_cobble = cobbleFloor(0, null);
  T.floor_cobble_b = cobbleFloor(1, [4, 6]);
  T.floor_cobble_c = cobbleFloor(2, [12, 10]);
  T.floor_hall = stoneFloor('m', 'd', [[2, 2, 'h'], [10, 10, 'h']], null);
  T.floor_hall_b = stoneFloor('h', 'm', [[4, 4, 'd'], [12, 11, 'w']], [3, 6, 5]);
  T.floor_hall_c = stoneFloor('m', 'h', [[7, 3, 'd'], [1, 12, 'd']], [8, 11, 6]);
  T.floor_slab = mkTile(g => { px(g, PAL.d, 0, 0, 16, 16); px(g, PAL.m, 2, 2, 12, 12); px(g, PAL.h, 3, 3, 10, 1); px(g, PAL.y, 7, 7, 2, 2); px(g, PAL.d, 4, 8, 8, 1); });
  T.wall_plaster = wallTop('w', 'h', [[4, 6, 'y'], [11, 9, 'y'], [7, 12, 'h']]);
  T.wall_plaster_face = wallFace('w', 'h', 'o', [[5, 6, 'y'], [12, 8, 'h']], null);
  T.wall_plaster_win = wallFace('w', 'h', 'o', [], [3, 2, 10, 8, 'o', 'c']);
  T.wall_cream = wallTop('y', 'o', [[3, 5, 'w'], [10, 8, 'w'], [6, 12, 'h']]);
  T.wall_cream_face = wallFace('y', 'w', 'd', [[8, 6, 'w']], null);
  T.wall_cream_win = wallFace('y', 'w', 'd', [], [5, 3, 6, 6, 'd', 's']);
  T.wall_log = logWall(false);
  T.wall_log_face = logWall(false);
  T.wall_log_win = logWall(true);
  T.wall_white = wallTop('w', 'm', [[2, 7, 's'], [9, 5, 'h'], [13, 11, 'w']]);
  T.wall_white_face = wallFace('w', 'h', 'm', [[4, 7, 's']], null);
  T.wall_white_win = wallFace('w', 'h', 'm', [], [4, 1, 8, 10, 'y', 'c']);
  T.wall_brick = brickWall('m', false);
  T.wall_brick_face = brickWall('o', false);
  T.wall_brick_win = brickWall('o', true);
  T.wall_stone = wallTop('m', 'd', [[2, 5, 'h'], [8, 8, 'h'], [13, 4, 'w']]);
  T.wall_stone_face = wallFace('m', 'd', 'h', [[6, 7, 'h'], [11, 3, 'w']], null);
  T.wall_stone_win = wallFace('m', 'd', 'h', [], [3, 2, 10, 8, 'd', 'h']);
  T.wall_panel = wallTop('t', 'n', [[4, 4, 'y'], [12, 8, 'b']]);
  T.wall_panel_face = mkTile(g => { px(g, PAL.n, 0, 0, 16, 16); [0, 5, 10, 15].forEach(x => px(g, PAL.t, x, 0, 4, 13)); px(g, PAL.y, 0, 13, 16, 1); px(g, PAL.g, 0, 14, 16, 2); });
  T.wall_panel_win = mkTile(g => { px(g, PAL.n, 0, 0, 16, 16); [0, 5, 10, 15].forEach(x => px(g, PAL.t, x, 0, 4, 13)); px(g, PAL.d, 6, 2, 4, 9); px(g, PAL.c, 7, 3, 2, 7); px(g, PAL.s, 7, 3, 1, 2); px(g, PAL.y, 0, 13, 16, 1); px(g, PAL.g, 0, 14, 16, 2); });
  T.wall_rough = wallTop('d', 'm', [[1, 4, 'h'], [6, 7, 'm'], [11, 3, 'h'], [14, 10, 'm'], [3, 12, 'h']]);
  T.wall_rough_face = wallFace('d', 'm', 'h', [[2, 6, 'h'], [9, 3, 'm'], [12, 8, 'h']], null);
  T.wall_rough_win = wallFace('d', 'm', 'h', [[2, 11, 'h']], [5, 3, 6, 6, 'm', 'n']);
  T.wall_slate = wallTop('m', 'd', [[0, 6, 'h'], [8, 6, 'd'], [4, 11, 'h'], [12, 11, 'd']]);
  T.wall_slate_face = wallFace('m', 'd', 'h', [[3, 6, 'h'], [10, 7, 'd']], null);
  T.wall_slate_win = wallFace('m', 'd', 'h', [], [2, 3, 12, 6, 'd', 'h']);
  function rug(a, b, c){ return mkTile(g => { px(g, PAL[a], 0, 0, 16, 16); for (let y = 2; y < 14; y += 4) for (let x = 1 + (y % 8 ? 0 : 2); x < 15; x += 4) px(g, PAL[(x + y) % 8 ? b : c], x, y, 2, 2); }); }
  T.rug_rag = rug('r', 'y', 'o');
  T.rug_loft = rug('p', 'w', 'y');
  T.rug_lodge = rug('d', 'o', 'y');
  T.rug_birch = rug('c', 'w', 's');
  T.rug_rook = rug('r', 'o', 'y');
  T.rug_keeper = rug('g', 'y', 'l');
  T.rug_ink = rug('b', 'n', 'c');
  T.rug_cobble = rug('o', 'm', 'y');
  T.rug_hall = rug('m', 'h', 'd');
  function doormat(a, b){ return mkTile(g => { px(g, PAL[a], 0, 0, 16, 16); px(g, PAL[b], 1, 3, 14, 10); for (let x = 3; x < 14; x += 2) px(g, PAL[a], x, 4, 1, 8); }); }
  T.mat_home = doormat('o', 'y');
  T.mat_loft = doormat('h', 'w');
  T.mat_lodge = doormat('d', 'o');
  T.mat_lantern = doormat('w', 'y');
  T.mat_rook = doormat('r', 'o');
  T.mat_keeper = doormat('g', 'y');
  T.mat_ink = doormat('n', 'c');
  T.mat_cobble = doormat('m', 'o');
  T.mat_hall = doormat('d', 'h');
  T.stair_home = mkTile(g => { px(g, PAL.y, 0, 0, 16, 16); [4, 9, 14].forEach(y => px(g, PAL.o, 0, y, 16, 1)); px(g, PAL.d, 2, 12, 12, 2); px(g, PAL.o, 3, 12, 10, 1); px(g, PAL.d, 4, 8, 8, 2); px(g, PAL.w, 5, 8, 6, 1); px(g, PAL.d, 6, 4, 4, 2); px(g, PAL.y, 7, 4, 2, 1); });
  T.stair_loft = mkTile(g => { px(g, PAL.w, 0, 0, 16, 16); [4, 9, 14].forEach(y => px(g, PAL.h, 0, y, 16, 1)); px(g, PAL.d, 2, 12, 12, 2); px(g, PAL.y, 3, 12, 10, 1); px(g, PAL.d, 4, 8, 8, 2); px(g, PAL.w, 5, 8, 6, 1); px(g, PAL.d, 6, 4, 4, 2); px(g, PAL.h, 7, 4, 2, 1); });
  T.wall_shadow = mkTile(g => { px(g, PAL.d, 0, 0, 16, 1); px(g, PAL.m, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.d, x, 2, 1, 1); });
  T.window_light = mkTile(g => { px(g, PAL.d, 0, 0, 16, 1); px(g, PAL.m, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.d, x, 2, 1, 1); px(g, PAL.y, 4, 6, 8, 5); px(g, PAL.w, 6, 7, 4, 3); });
  // B7. Observatory dome, cool memory planks, warm party floor, night asphalt. Decals paint only their marks.
  T.wall_dome = mkTile(g => {
    px(g, PAL.n, 0, 0, 16, 16);
    px(g, PAL.b, 0, 2, 16, 2); px(g, PAL.m, 1, 6, 14, 2); px(g, PAL.h, 3, 10, 10, 2);
    px(g, PAL.d, 0, 0, 1, 16); px(g, PAL.d, 8, 0, 1, 16);
    px(g, PAL.s, 4, 3, 1, 1); px(g, PAL.w, 12, 7, 1, 1);
  });
  T.wall_dome_face = mkTile(g => {
    px(g, PAL.n, 0, 0, 16, 16);
    px(g, PAL.b, 0, 1, 16, 2); px(g, PAL.m, 0, 5, 16, 2); px(g, PAL.h, 0, 9, 16, 2);
    [0, 5, 10, 15].forEach(x => px(g, PAL.d, x, 0, 1, 13));
    px(g, PAL.m, 0, 13, 16, 1); px(g, PAL.d, 0, 14, 16, 2);
  });
  T.wall_dome_win = mkTile(g => {
    px(g, PAL.n, 0, 0, 16, 16);
    px(g, PAL.b, 0, 1, 16, 2); px(g, PAL.m, 0, 5, 16, 2); px(g, PAL.h, 0, 9, 16, 2);
    [0, 15].forEach(x => px(g, PAL.d, x, 0, 1, 13));
    px(g, PAL.d, 6, 0, 4, 13); px(g, PAL.b, 7, 1, 2, 11); px(g, PAL.s, 7, 2, 2, 8); px(g, PAL.w, 7, 3, 1, 2);
    px(g, PAL.m, 0, 13, 16, 1); px(g, PAL.d, 0, 14, 16, 2);
  });
  function starFloor(shift){
    return mkTile(g => {
      px(g, PAL.n, 0, 0, 16, 16);
      px(g, PAL.b, 0, 8, 16, 1); px(g, PAL.b, 8, 0, 1, 16);
      [[1, 2], [5, 1], [12, 3], [3, 6], [14, 7], [6, 10], [11, 12], [2, 13], [9, 5], [15, 14]].forEach(([x, y], i) => {
        const col = (i + shift) % 3 === 0 ? PAL.w : (i + shift) % 3 === 1 ? PAL.s : PAL.c;
        px(g, col, (x + shift * 2) % 16, (y + shift) % 16, 1, 1);
      });
      if (shift === 0) px(g, PAL.s, 2, 4, 4, 1);
      if (shift === 1) { px(g, PAL.s, 2, 9, 5, 1); px(g, PAL.w, 4, 9, 1, 1); }
      if (shift === 2) { px(g, PAL.h, 10, 2, 1, 4); px(g, PAL.w, 10, 4, 1, 1); }
    });
  }
  T.floor_star = starFloor(0); T.floor_star_b = starFloor(1); T.floor_star_c = starFloor(2);
  T.star_tick = mkTile(g => { px(g, PAL.s, 2, 8, 12, 1); px(g, PAL.w, 6, 4, 1, 9); px(g, PAL.w, 3, 5, 1, 1); px(g, PAL.c, 11, 11, 1, 1); });
  T.wall_mist = mkTile(g => {
    px(g, PAL.h, 0, 0, 16, 16); px(g, PAL.m, 0, 0, 16, 2); px(g, PAL.c, 0, 6, 16, 1);
    px(g, PAL.w, 3, 4, 1, 1); px(g, PAL.w, 11, 10, 1, 1); px(g, PAL.b, 7, 13, 2, 1);
  });
  T.wall_mist_face = mkTile(g => {
    px(g, PAL.h, 0, 0, 16, 16); px(g, PAL.m, 0, 4, 16, 1); px(g, PAL.c, 0, 5, 16, 1);
    px(g, PAL.w, 2, 8, 1, 1); px(g, PAL.w, 12, 7, 1, 1);
    px(g, PAL.m, 0, 13, 16, 1); px(g, PAL.n, 0, 14, 16, 2);
  });
  T.wall_mist_win = mkTile(g => {
    px(g, PAL.h, 0, 0, 16, 16); px(g, PAL.m, 0, 4, 16, 1); px(g, PAL.c, 0, 5, 16, 1);
    px(g, PAL.n, 4, 1, 8, 10); px(g, PAL.c, 5, 2, 6, 8); px(g, PAL.s, 5, 2, 2, 2); px(g, PAL.n, 7, 2, 1, 8);
    px(g, PAL.m, 0, 13, 16, 1); px(g, PAL.n, 0, 14, 16, 2);
  });
  function memFloor(shift){
    return mkTile(g => {
      px(g, PAL.h, 0, 0, 16, 16);
      [0, 5, 11, 15].forEach((y, i) => px(g, PAL.m, 0, (y + (i === shift ? 1 : 0)) % 16, 16, 1));
      px(g, PAL.m, (3 + shift) % 16, 1, 1, 4); px(g, PAL.m, 11, 6, 1, 4);
      px(g, PAL.c, 6, (3 + shift) % 16, 1, 1); px(g, PAL.w, 13, 9, 1, 1);
      if (shift === 1) px(g, PAL.b, 2, 12, 3, 1);
      if (shift === 2) px(g, PAL.n, 8, 7, 4, 1);
    });
  }
  T.floor_mem = memFloor(0); T.floor_mem_b = memFloor(1); T.floor_mem_c = memFloor(2);
  T.rug_mem = mkTile(g => {
    px(g, PAL.c, 0, 0, 16, 16); px(g, PAL.h, 2, 2, 12, 12);
    for (let y = 4; y < 12; y += 3) for (let x = 4; x < 12; x += 3) px(g, PAL.s, x, y, 1, 1);
    px(g, PAL.w, 7, 7, 2, 2);
  });
  T.wall_fest = mkTile(g => {
    px(g, PAL.y, 0, 0, 16, 16); px(g, PAL.o, 0, 0, 16, 2);
    [[1, 'r'], [5, 'c'], [9, 'l'], [13, 'o']].forEach(([x, c]) => { px(g, PAL[c], x, 4, 3, 1); px(g, PAL[c], x + 1, 5, 1, 2); });
    px(g, PAL.w, 3, 11, 1, 1); px(g, PAL.r, 12, 13, 1, 1);
  });
  T.wall_fest_face = mkTile(g => {
    px(g, PAL.y, 0, 0, 16, 16); px(g, PAL.o, 0, 0, 16, 1);
    [[0, 'r'], [4, 'c'], [8, 'l'], [12, 'o']].forEach(([x, c]) => { px(g, PAL[c], x, 1, 3, 2); px(g, PAL[c], x + 1, 3, 1, 2); });
    px(g, PAL.o, 0, 13, 16, 1); px(g, PAL.d, 0, 14, 16, 2);
  });
  T.wall_fest_win = mkTile(g => {
    px(g, PAL.y, 0, 0, 16, 16); px(g, PAL.o, 0, 0, 16, 1);
    [[0, 'r'], [12, 'c']].forEach(([x, c]) => { px(g, PAL[c], x, 1, 3, 2); px(g, PAL[c], x + 1, 3, 1, 2); });
    px(g, PAL.o, 4, 5, 8, 6); px(g, PAL.s, 5, 6, 6, 4); px(g, PAL.w, 5, 6, 2, 1); px(g, PAL.o, 7, 6, 1, 4);
    px(g, PAL.o, 0, 13, 16, 1); px(g, PAL.d, 0, 14, 16, 2);
  });
  T.floor_party = mkTile(g => {
    px(g, PAL.y, 0, 0, 16, 16); px(g, PAL.o, 0, 0, 16, 1); px(g, PAL.o, 0, 15, 16, 1);
    [[2, 3, 'r'], [6, 2, 'w'], [11, 4, 'c'], [4, 8, 'o'], [9, 7, 'l'], [13, 11, 'r'], [3, 12, 'c'], [8, 13, 'w']].forEach(([x, y, c]) => px(g, PAL[c], x, y, 1, 1));
  });
  T.floor_lane = mkTile(g => {
    px(g, PAL.y, 0, 0, 16, 16); px(g, PAL.w, 1, 0, 6, 16); px(g, PAL.y, 7, 0, 2, 16); px(g, PAL.w, 9, 0, 6, 16);
    px(g, PAL.o, 0, 0, 1, 16); px(g, PAL.o, 15, 0, 1, 16); px(g, PAL.h, 4, 6, 1, 1); px(g, PAL.h, 12, 11, 1, 1);
  });
  T.streamer = mkTile(g => {
    px(g, PAL.r, 1, 0, 4, 1); px(g, PAL.r, 2, 1, 2, 1); px(g, PAL.r, 2, 2, 1, 2);
    px(g, PAL.c, 8, 0, 4, 1); px(g, PAL.c, 9, 1, 2, 1); px(g, PAL.c, 9, 2, 1, 2);
    px(g, PAL.y, 5, 0, 1, 3);
  });
  T.wall_night = mkTile(g => {
    px(g, PAL.n, 0, 0, 16, 16); px(g, PAL.d, 0, 0, 16, 3); px(g, PAL.m, 0, 3, 16, 1); px(g, PAL.d, 0, 8, 16, 1);
    px(g, PAL.h, 4, 6, 1, 1); px(g, PAL.y, 11, 12, 1, 1);
  });
  T.wall_night_face = mkTile(g => {
    px(g, PAL.n, 0, 0, 16, 16); px(g, PAL.d, 0, 0, 16, 2); px(g, PAL.m, 0, 6, 16, 1);
    px(g, PAL.d, 2, 8, 3, 2); px(g, PAL.d, 11, 9, 2, 2);
    px(g, PAL.d, 0, 13, 16, 1); px(g, PAL.m, 0, 14, 16, 2);
  });
  T.wall_night_win = mkTile(g => {
    px(g, PAL.n, 0, 0, 16, 16); px(g, PAL.d, 0, 0, 16, 2);
    px(g, PAL.d, 1, 2, 14, 8); px(g, PAL.y, 2, 3, 12, 6); px(g, PAL.o, 2, 3, 12, 1);
    px(g, PAL.w, 3, 5, 2, 2); px(g, PAL.g, 7, 5, 2, 2); px(g, PAL.c, 11, 5, 2, 2);
    px(g, PAL.d, 0, 13, 16, 1); px(g, PAL.m, 0, 14, 16, 2);
  });
  function asphalt(shift){
    return mkTile(g => {
      px(g, PAL.d, 0, 0, 16, 16);
      [[1, 1], [4, 3], [8, 2], [13, 4], [2, 7], [6, 6], [11, 8], [15, 6], [3, 11], [7, 13], [12, 12], [9, 15], [14, 10]].forEach(([x, y], i) => {
        px(g, (i + shift) % 2 ? PAL.m : PAL.n, (x + shift) % 16, (y + shift * 2) % 16, 1, 1);
      });
      if (shift === 1) px(g, PAL.m, 3, 8, 6, 2);
      if (shift === 2) { px(g, PAL.h, 10, 4, 1, 5); px(g, PAL.n, 11, 6, 2, 1); }
    });
  }
  T.floor_asphalt = asphalt(0); T.floor_asphalt_b = asphalt(1); T.floor_asphalt_c = asphalt(2);
  T.lane_paint = mkTile(g => { px(g, PAL.y, 1, 7, 14, 2); px(g, PAL.w, 1, 7, 14, 1); });
  return T;
}
// World sprites (MAPS_SLICE §2/§4 doors, signs, props, pickups; INTERIORS §2.2 furniture), 16x16, PAL only.
const LAB_SKIN = {"remap":{"#":"lab_wall","W":"lab_wall_face","W2":"lab_wall_win",".":"lab_floor","=":"lab_runner","m":"lab_mat","V":"lab_wall_win","L":"lab_door_locked",",":"lab_floor_scuff","~":"lab_floor_cable","o":"lab_floor_drain","|":"lab_guide_v","-":"lab_guide_h","+":"lab_guide_x","x":"lab_hazard","D":"lab_dais","g":"lab_glass"},"override":{"rx_f4":{".":"lab_floor_bay"}},"walk":{"V":0,"L":0,",":1,"~":1,"o":1,"|":1,"-":1,"+":1,"x":0,"D":1,"g":0},"decal":{"~":"lab_floor_cable","o":"lab_floor_drain","|":"lab_guide_v","-":"lab_guide_h","+":"lab_guide_x"},"variants":{"lab_floor_bay":[["lab_floor_scuff",0.14]]}};   // FERNBROOK_HEIGHTS §3: house char -> lab tile, plus per-map overrides
// B5. One skin per room: floor, wall face, baseboard. `v` is the wall-shadow decal, `u` the window light (it carries the same shadow band).
// A later batch can add a skin with SKINS.tunnel = TUNNEL_SKIN or SKINS[name] = HOUSE_SKINS[name] = { remap, decal, walk, variants }.
const houseVar = (base, b, c) => ({ [base]: [[b, 0.18], [c, 0.16]] });
const HOUSE_SKINS = {
  house_home: { remap: { '#':'wall_plaster', W:'wall_plaster_face', W2:'wall_plaster_win', '.':'house_floor_a', '=':'rug_rag', m:'mat_home', '^':'stair_home' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: houseVar('house_floor_a', 'house_floor_b', 'house_honey_c') },
  house_loft: { remap: { '#':'wall_cream', W:'wall_cream_face', W2:'wall_cream_win', '.':'house_loft', '=':'rug_loft', m:'mat_loft', '^':'stair_loft' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: houseVar('house_loft', 'house_loft_b', 'house_loft_c') },
  house_lodge: { remap: { '#':'wall_log', W:'wall_log_face', W2:'wall_log_win', '.':'house_log', '=':'rug_lodge', m:'mat_lodge' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: houseVar('house_log', 'house_log_b', 'house_log_c') },
  house_lantern: { remap: { '#':'wall_white', W:'wall_white_face', W2:'wall_white_win', '.':'house_birch', '=':'rug_birch', m:'mat_lantern' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: houseVar('house_birch', 'house_birch_b', 'house_birch_c') },
  house_rook: { remap: { '#':'wall_brick', W:'wall_brick_face', W2:'wall_brick_win', '.':'house_rook', '=':'rug_rook', m:'mat_rook' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: houseVar('house_rook', 'house_rook_b', 'house_rook_c') },
  house_hq: { remap: { '#':'wall_stone', W:'wall_stone_face', W2:'wall_stone_win', '.':'floor_flag', '=':'rug_keeper', m:'mat_keeper' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: houseVar('floor_flag', 'floor_flag_b', 'floor_flag_c') },
  house_hq_up: { remap: { '#':'wall_panel', W:'wall_panel_face', W2:'wall_panel_win', '.':'floor_ink', '=':'rug_ink', m:'mat_ink' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: houseVar('floor_ink', 'floor_ink_b', 'floor_ink_c') },
  house_cc_lantern: { remap: { '#':'wall_rough', W:'wall_rough_face', W2:'wall_rough_win', '.':'floor_cobble', '=':'rug_cobble', m:'mat_cobble' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: houseVar('floor_cobble', 'floor_cobble_b', 'floor_cobble_c') },
  house_hall: { remap: { '#':'wall_slate', W:'wall_slate_face', W2:'wall_slate_win', '.':'floor_hall', ':':'floor_hall', i:'floor_slab', '=':'rug_hall', m:'mat_hall' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1, i:1 }, variants: { floor_hall: [['floor_hall_b', 0.22], ['floor_hall_c', 0.18]] } },
  // B7. Observatory and the three dream rooms. `u` and `v` stay the shared window light and wall shadow.
  obs: { remap: { '#':'wall_dome', W:'wall_dome_face', W2:'wall_dome_win', '.':'floor_star' }, decal: { v:'wall_shadow', u:'window_light', z:'star_tick' }, walk: { v:1, u:1, z:1 }, variants: houseVar('floor_star', 'floor_star_b', 'floor_star_c') },
  dream_2004: { remap: { '#':'wall_mist', W:'wall_mist_face', W2:'wall_mist_win', '.':'floor_mem', '=':'rug_mem' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: houseVar('floor_mem', 'floor_mem_b', 'floor_mem_c') },
  dream_party: { remap: { '#':'wall_fest', W:'wall_fest_face', W2:'wall_fest_win', '.':'floor_party', p:'floor_lane' }, decal: { v:'wall_shadow', u:'window_light', q:'streamer' }, walk: { v:1, u:1, q:1 }, variants: {} },
  dream_drive: { remap: { '#':'wall_night', W:'wall_night_face', W2:'wall_night_win', '.':'floor_asphalt' }, decal: { v:'wall_shadow', u:'window_light', j:'lane_paint' }, walk: { v:1, u:1, j:1 }, variants: houseVar('floor_asphalt', 'floor_asphalt_b', 'floor_asphalt_c') }
};
const SKINS = Object.assign({ lab: LAB_SKIN }, HOUSE_SKINS);
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
  // Mahopac dreams: a pop-along toy, party balloons, the observatory lens, a drive-through tray, bowling pins.
  A.pop_toy = [0, 1].map(f => mkTile(g => {
    px(g,PAL.d,4,11,8,3); px(g,PAL.o,5,12,6,1); px(g,PAL.y,7,6,2,5);
    [[3,4,'r'],[11,4,'y'],[2,8,'c'],[12,8,'l']].forEach(([x,y,c], i) => { const dy = (f + i) % 2; px(g,PAL[c],x,y - dy,2,2); px(g,PAL.w,x,y - dy,1,1); });
  }));
  const balloon = col => [0, 1].map(f => mkTile(g => {
    oval(g, 7.5, 5 + f, 5, 4.5, PAL[col]); oval(g, 6, 4, 1.2, 1.2, PAL.w); px(g,PAL.d,7,10,2,1); px(g,PAL.h,7,11,1,4); px(g,PAL.h,8,13,1,1);
  }));
  A.balloon_r = balloon('r'); A.balloon_y = balloon('y'); A.balloon_c = balloon('c');
  A.telescope = mkTile(g => { px(g,PAL.d,3,13,10,2); px(g,PAL.m,7,8,2,5); px(g,PAL.d,2,6,12,3); px(g,PAL.h,3,7,10,1); px(g,PAL.c,11,5,3,3); px(g,PAL.s,12,5,1,1); px(g,PAL.y,1,7,2,1); });
  A.fry_tray = mkTile(g => { px(g,PAL.r,2,6,12,8); px(g,PAL.y,3,7,10,6); px(g,PAL.o,4,3,2,5); px(g,PAL.o,7,2,2,6); px(g,PAL.o,10,4,2,4); px(g,PAL.w,12,8,2,3); px(g,PAL.c,12,6,2,2); });
  A.pins = mkTile(g => { [4, 7, 10].forEach(x => { px(g,PAL.w,x,6,2,6); px(g,PAL.r,x,8,2,1); px(g,PAL.h,x,5,2,1); }); px(g,PAL.d,3,13,10,1); });
  // ACT1_ROUTE2 props.
  A.rubble = mkTile(g => { grassBase(g, 17);
    px(g,PAL.d,1,8,6,6); px(g,PAL.h,2,9,4,3); px(g,PAL.w,2,9,1,1);
    px(g,PAL.d,6,5,7,9); px(g,PAL.m,7,6,5,7); px(g,PAL.h,7,6,2,2);
    px(g,PAL.d,12,9,3,5); px(g,PAL.h,12,10,2,2); });
  A.comfort_lamp = [0, 1].map(f => mkTile(g => {
    px(g,PAL.l,4,2,1,1); px(g,PAL.l,11,3,1,1); px(g,PAL.l,3,6,1,1); px(g,PAL.l,12,5,1,1);
    px(g,PAL.d,7,8,2,7); px(g,PAL.m,5,15,6,1); px(g,PAL.d,5,3,6,6); px(g,PAL.l,6,4,4,4); px(g,PAL.w,6,4,2,1); px(g,PAL.y,7,5+f,2,2);
  }));
  A.census_tent = mkTile(g => {
    px(g,PAL.d,7,1,2,14); px(g,PAL.w,2,4,12,8); px(g,PAL.l,2,4,12,2); px(g,PAL.l,2,8,12,1);
    px(g,PAL.d,3,6,4,4); px(g,PAL.k,3,6,4,1); px(g,PAL.h,4,12,8,2);
  });
  A.glimmer_gate = mkTile(g => {
    px(g,PAL.d,1,4,2,12); px(g,PAL.d,13,4,2,12); px(g,PAL.l,1,4,14,3); px(g,PAL.w,3,5,10,1);
    px(g,PAL.y,7,8,2,2); px(g,PAL.o,6,9,4,1); px(g,PAL.l,7,11,2,2); px(g,PAL.m,2,14,12,1);
  });
  // COBBLECREST props.
  A.seam_stone = mkTile(g => {
    px(g,PAL.d,2,6,12,9); px(g,PAL.m,3,5,10,9); px(g,PAL.h,4,6,4,3); px(g,PAL.k,5,8,6,1);
    px(g,PAL.w,6,10,1,2); px(g,PAL.w,8,9,2,1); px(g,PAL.w,7,11,1,2); px(g,PAL.w,9,11,1,1);
  });
  A.cairn = mkTile(g => {
    px(g,PAL.d,3,12,10,3); px(g,PAL.m,4,12,8,2); px(g,PAL.h,4,12,3,1);
    px(g,PAL.d,4,8,8,4); px(g,PAL.m,5,8,6,3); px(g,PAL.h,5,8,2,1);
    px(g,PAL.d,6,4,5,4); px(g,PAL.h,6,4,3,2); px(g,PAL.y,8,5,1,1);
  });
  A.stall_counter = mkTile(g => {
    px(g,PAL.r,1,1,14,3); px(g,PAL.w,1,2,3,1); px(g,PAL.w,8,2,3,1); px(g,PAL.w,14,2,1,1);
    px(g,PAL.o,1,5,14,8); px(g,PAL.d,1,8,14,1); px(g,PAL.d,2,13,2,3); px(g,PAL.d,12,13,2,3);
    [[3,'r'],[6,'y'],[9,'g'],[12,'c']].forEach(([x,c]) => { px(g,PAL.k,x,9,2,3); px(g,PAL[c],x,10,2,2); });
  });
  A.stage_bunting = mkTile(g => {
    px(g,PAL.d,2,2,1,14); px(g,PAL.d,13,2,1,14); px(g,PAL.m,2,2,12,1);
    for (let x = 3; x < 13; x += 2) { px(g, x % 4 ? PAL.l : PAL.w, x, 3, 2, 2); px(g, x % 4 ? PAL.w : PAL.l, x, 5, 2, 2); }
  });
  A.miner_lamps = mkTile(g => {
    px(g,PAL.o,1,3,14,2); px(g,PAL.d,1,5,14,1); px(g,PAL.o,1,12,14,2);
    [3,7,11].forEach(x => { px(g,PAL.d,x+1,6,1,3); px(g,PAL.y,x,9,3,3); px(g,PAL.d,x,11,3,1); px(g,PAL.h,x,9,1,1); });
  });
  // GLIMMER_PATH BS (designer-delivered): the Glimmerwell Pledge desk, a mint kiosk with a brochure rack. In the table for
  // later map content; no map places it yet (the desks are options on existing NPC panels in this build).
  A.switch_desk_glimmer = mkTile(g => ['..ssssssssssss..', '..swwwwwwwwwws..', '..swlwlwlwlwls..', '..ssssssssssss..', '...d........d...', '...d.hhhhhh.d...',
    '...d.hwhrhw.d...', '...d.hwhlhw.d...', '.llllllllllllll.', '.swwwwwwwwwwwws.', '.slllllllllllls.', '.slllwwllwwllls.', '.slllwwllwwllls.', '.slllllllllllls.',
    '.dddddddddddddd.', '..d..........d..'].forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); })));
  A.arbiter = mkTile(g => ['................', '.....hhhhhh.....', '.......hh.......', '.......hh.......', '.mmmmmmmmmmmmmm.', '.mmhhhhhhhhhhmm.', '.mmhkkkkkkkkhmm.', '.mmhckkkkkkkhmm.', '.mmhkkkkkkkkhmm.', '.mmhkkkkkkkkhmm.', '.mmhkkkkkkkkhmm.', '.mmhhhhhhhhhhmm.', '.mmmmddddddmmmm.', '.mmmmmmmmmmmmmm.', '................', '................'].forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); })));
  // RegenX floors. Grids also live in data/heights_art.json.
  const rxPaint = (g, rows) => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); }));
  A.lab_bench = mkTile(g => rxPaint(g, ['................','..hhhhhhhh......','.hhkkkkkkhh.....','.hhkkkkkkhh.....','.hhkkkkkkhh.....','..hhhhhhhh......','.wwwwwwwwwwwwww.','.wwwwwwwwwwyyww.','.wwwwwwwwwllllw.','.wwwwwwwwwllllw.','.wwwwwwwwwwccww.','..mmmmmmmmmmmm..','..mdddmmmdddmm..','..mmmmmmmmmmmm..','..mdddmmmdddmm..','................']));
  A.rx_desk = mkTile(g => rxPaint(g, ['................','................','................','..wwwwwwwwwwww..','..wccwwwwwwccw..','..wkkwwwwwwkkw..','..wwwwwwwwwwww..','..mmmmmmmmmmmm..','..m..........m..','..m..........m..','..mmmmmmmmmmmm..','................','................','................','................','................']));
  A.rx_shelf = mkTile(g => rxPaint(g, ['................','.mmmmmmmmmmmmmm.','.mwwmwwmwwmwwmm.','.mmmmmmmmmmmmmm.','.mccmwcmwcmwcmm.','.mmmmmmmmmmmmmm.','.mwwmwwmwwmwwmm.','.mmmmmmmmmmmmmm.','.mhhmmhmmhmmhmm.','.mmmmmmmmmmmmmm.','................','................','................','................','................','................']));
  A.rx_terminal = mkTile(g => rxPaint(g, ['................','................','....dddddddd....','....dccccccd....','....dckkkkcd....','....dccccccd....','....dddddddd....','......dddd......','....wwwwwwww....','....wmmmmmmw....','....wwwwwwww....','......mmmm......','......m..m......','................','................','................']));
  A.rx_rack = mkTile(g => rxPaint(g, ['................','................','................','...mmmmmmmmmm...','...m.yy.yy.ym...','...m.ll.ll.lm...','...m.ll.ll.lm...','...m.yy.yy.ym...','...mmmmmmmmmm...','....m..m..m.....','....m..m..m.....','...mmmmmmmmmm...','................','................','................','................']));
  // FERNBROOK_HEIGHTS §3 lab props: a wall counter and a two-frame humming tank (600 ms; reduced motion holds frame 0).
  A.lab_counter = mkTile(g => rxPaint(g, ["................", "...dddd....h....", "...dscd....w....", "...dccd....l....", ".wwwwwwwwwwwwww.", ".wwwwwwwwwwwwww.", ".wwwwwwwwwwwwww.", ".llllllllllllll.", ".hhhhhhmmhhhhhh.", ".hhhhhhmmhhhhhh.", ".hhhhdhmmhdhhhh.", ".hhhhhhmmhhhhhh.", ".hhhhhhmmhhhhhh.", ".hhhhhhmmhhhhhh.", ".mmmmmmmmmmmmmm.", "................"]));
  A.lab_tank = [["....mmmmmmmm....", "...mmmmmmmmmm...", "...swcccccccs...", "...swcccccccs...", "...swcccccccs...", "...swcccccccs...", "...swllllllgs...", "...swlwllllgs...", "...swllllllgs...", "...swllllwlgs...", "...swllllllgs...", "...swllllllgs...", "...slllwlllgs...", "...slllhhllgs...", "...dddddddddd...", "....dddddddd...."], ["....mmmmmmmm....", "...mmmmmmmmmm...", "...swcccccccs...", "...swcccccccs...", "...swcccccccs...", "...swcccccccs...", "...swllllwlgs...", "...swllllllgs...", "...swllwlllgs...", "...swllllllgs...", "...swllllllgs...", "...swlllwllgs...", "...slllllllgs...", "...slllhhllgs...", "...dddddddddd...", "....dddddddd...."]].map(fr => mkTile(g => rxPaint(g, fr)));
  A.lab_tank.ms = 600;
  // BUILD_RX_F4_PILOT props (fernbrook_heights_art.json -> pilot.propArt, verbatim). lab_sign_offlimits is a wall decal.
  A.lab_terminal_bank = mkTile(g => rxPaint(g, ["................", "................", ".mmmmmmmmmmmmmm.", ".mddddddddddddm.", ".mkskdkskdkskdm.", ".mcccdllldcccdm.", ".mcccdllldcccdm.", ".mkkkdkkkdkkkdm.", ".mddddddddddddm.", ".mhwhwhwhwhwhhm.", ".mhhhhhhhhhhhhm.", ".mdlddddddddrdm.", ".mkkkkkkkkkkkkm.", ".mmmmmmmmmmmmmm.", ".kkkkkkkkkkkkkk.", "................"]));
  A.lab_workbench = mkTile(g => rxPaint(g, ["................", "..dddd..h.......", "..dscd..w.ww....", "..dccd..w.ll....", "..dddd..l.llkkk.", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "hhhhhhhhhhhhhhhh", ".mm..........mm.", ".mm..........mm.", ".mmhhhhhhhhhhmm.", ".mm..........mm.", ".mm..........mm.", ".mm..........mm.", "................"]));
  A.lab_cold = mkTile(g => rxPaint(g, ["mmmcmmmmmmmmcmmm", "mhddddddddddddhm", "mhdwwwwwwwwwwdhm", "mhdssssssssmsdhm", "mhdscscscssmsdhm", "mhdsbsbsbssssdhm", "mhddddddddddddhm", "mhhhhhhhhhhhhhhm", "mhddddddddddddhm", "mhdwwwwwwwwwwdhm", "mhdssssssssmsdhm", "mhdscscscssmsdhm", "mhdsbsbsbssssdhm", "mhddddddddddddhm", "mhhhhhhhhhhhhhhm", "mmmmmmmmmmmmmmmm"]));
  A.lab_shelf_samples = mkTile(g => rxPaint(g, [".mmmmmmmmmmmmmm.", ".m.wc..wl..wc.m.", ".m.cc..ll..cc.m.", ".m.cc..ll..cc.m.", ".mhhhhhhhhhhhhm.", ".m............m.", ".m.wl..ws..wl.m.", ".m.ll..ss..ll.m.", ".m.ll..ss..ll.m.", ".mhhhhhhhhhhhhm.", ".m............m.", ".m.wc..ww..ww.m.", ".m.cc..ww..ww.m.", ".m.cc..ww..ww.m.", ".mhhhhhhhhhhhhm.", ".mmmmmmmmmmmmmm."]));
  A.lab_display = mkTile(g => rxPaint(g, ["................", "................", "......ssss......", ".....swssss.....", ".....wslsss.....", "....sslsslss....", "....sgsggsss....", "....sssggsgs....", "....sssggsss....", "....sssggsss....", ".....ssggss.....", ".....ssggss.....", "....hhhhhhhh....", "...mmmmmmmmmm...", "...mmmmmmmmmm...", "...mmmmmmmmmm..."]));
  A.lab_sign_offlimits = mkTile(g => rxPaint(g, ["................", "................", "................", "..kkkkkkkkkkkk..", "..krrrrrrrrrrk..", "..krrrrrrrrrrk..", "..kwwwwwwwwwwk..", "..kwddddddddwk..", "..kwwwwwwwwwwk..", "..kwddddddwwwk..", "..kwwwwwwwwwwk..", "..kkkkkkkkkkkk..", "................", "................", "................", "................"]));
  A.lab_plaque = mkTile(g => rxPaint(g, ["................", "................", "................", "................", "...mmmmmmmmmm...", "...mhhhhhhhhm...", "...mhddddddhm...", "...mhhhhhhhhm...", "...mhddddhhhm...", "...mhhhhhhhhm...", "...mmmmmmmmmm...", ".......mm.......", ".......mm.......", ".......mm.......", ".......mm.......", ".......mm......."]));
  A.lab_scanner = mkTile(g => rxPaint(g, ["................", "................", "................", "......mmmm......", "......mlmm......", "......mmmm......", "...wwwwwwwwww...", "...hhhhhhhhhh...", "...hhsccccchh...", "...hhcccccchh...", "...hhhhhhhhhh...", "...hhhhhhhhhh...", "..dddddddddddd..", "..dddddddddddd..", "..dddddddddddd..", "................"]));
  A.rx_pylon = mkTile(g => rxPaint(g, ['................','.......cc.......','......cccc......','......ckkc......','......cccc......','.......cc.......','.......mm.......','.......mm.......','.......mm.......','.......mm.......','.......mm.......','......mmmm......','.....mmmmmm.....','................','................','................']));
  // High Charity props. One tile each; the airship sits on an A pad and the nave is a row of pews.
  A.airship = mkTile(g => { px(g,PAL.c,3,1,10,6); px(g,PAL.s,4,2,8,3); px(g,PAL.w,5,2,2,1);
    px(g,PAL.d,7,7,2,3); px(g,PAL.o,4,10,8,3); px(g,PAL.y,5,11,2,1); px(g,PAL.d,4,13,8,1); });
  A.pew = mkTile(g => { px(g,PAL.d,1,4,14,2); px(g,PAL.o,2,5,12,1); px(g,PAL.d,1,7,14,3); px(g,PAL.o,2,8,12,1);
    px(g,PAL.d,2,10,2,5); px(g,PAL.d,12,10,2,5); });
  A.altar = mkTile(g => { px(g,PAL.w,2,4,12,6); px(g,PAL.y,2,4,12,1); px(g,PAL.d,3,10,2,5); px(g,PAL.d,11,10,2,5);
    px(g,PAL.o,3,14,10,1); px(g,PAL.d,6,0,4,1); px(g,PAL.y,7,1,2,3); px(g,PAL.o,7,2,2,1); });
  A.school_desk = mkTile(g => { px(g,PAL.o,1,6,14,3); px(g,PAL.d,1,8,14,1); px(g,PAL.d,2,9,2,6); px(g,PAL.d,12,9,2,6);
    px(g,PAL.r,3,4,5,2); px(g,PAL.w,4,4,3,1); px(g,PAL.n,10,3,3,3); px(g,PAL.b,11,4,1,1); });
  A.bank_counter = mkTile(g => { px(g,PAL.n,1,5,14,8); px(g,PAL.h,1,5,14,2); px(g,PAL.w,2,6,4,1);
    px(g,PAL.d,2,13,2,3); px(g,PAL.d,12,13,2,3); px(g,PAL.w,4,9,5,2); px(g,PAL.k,4,10,5,1); px(g,PAL.y,11,8,2,2); });
  A.apt_bed = mkTile(g => { px(g,PAL.m,1,1,14,15); px(g,PAL.y,2,2,12,3); px(g,PAL.o,2,4,12,1);
    px(g,PAL.b,2,6,12,8); px(g,PAL.c,2,6,12,1); px(g,PAL.c,2,9,12,1); px(g,PAL.c,2,12,12,1); });
  A.mannequin = mkTile(g => { px(g,PAL.h,6,1,4,3); px(g,PAL.w,7,2,2,1); px(g,PAL.p,5,4,6,6); px(g,PAL.c,6,5,4,2);
    px(g,PAL.d,7,10,2,3); px(g,PAL.m,4,13,8,1); });
  A.barracks_banner = mkTile(g => { px(g,PAL.d,2,1,2,14); px(g,PAL.t,4,2,9,8); px(g,PAL.y,4,2,9,1); px(g,PAL.l,6,4,5,2);
    px(g,PAL.y,7,7,3,2); px(g,PAL.t,6,10,2,2); px(g,PAL.t,10,10,2,2); });
  A.skydock_console = mkTile(g => { px(g,PAL.d,1,4,14,10); px(g,PAL.o,2,5,12,8); px(g,PAL.n,3,6,10,4);
    px(g,PAL.y,4,7,2,2); px(g,PAL.o,7,7,2,2); px(g,PAL.c,10,7,2,2); px(g,PAL.d,3,14,2,2); px(g,PAL.d,11,14,2,2); });
  A.arena_rope = mkTile(g => { px(g,PAL.d,1,3,3,12); px(g,PAL.o,2,4,1,10); px(g,PAL.d,12,3,3,12); px(g,PAL.o,13,4,1,10);
    px(g,PAL.y,4,6,8,1); px(g,PAL.r,4,9,8,1); });
  A.hall_booth = mkTile(g => { px(g,PAL.d,1,2,1,13); px(g,PAL.d,14,2,1,13); px(g,PAL.y,1,2,14,3); px(g,PAL.o,3,3,3,1); px(g,PAL.o,9,3,3,1);
    px(g,PAL.o,2,6,12,6); px(g,PAL.d,2,8,12,1); px(g,PAL.y,6,9,4,2); });
  A.marina_buoy = mkTile(g => { px(g,PAL.b,0,12,16,4); px(g,PAL.c,2,12,4,1); px(g,PAL.y,6,4,4,7); px(g,PAL.o,6,6,4,2);
    px(g,PAL.w,7,5,1,1); px(g,PAL.d,7,3,2,1); px(g,PAL.d,8,11,1,3); });
  // Town boards. Grids copied from data/town_board_art.json.
  const paint = (g, rows) => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); }));
  A.bulletin_keepers = mkTile(g => paint(g, [
    '................',
    '.dddddddddddddd.',
    '.dddddddddddddd.',
    '.doookkkkkkkkod.',
    '.dookhhkkhhkkod.',
    '.dokkkkkkkkkkod.',
    '.dokkhhkkhhkkod.',
    '.dokkkkkyyykkod.',
    '.dokkkkyydykkod.',
    '.dokkkkkyyykkod.',
    '.dokkkkkooooood.',
    '.dddddddddddddd.',
    '.dddddddddddddd.',
    '....dd....dd....',
    '....dd....dd....',
    '................']));
  A.bulletin_glimmer = mkTile(g => paint(g, [
    '................',
    '.dddddddddddddd.',
    '.dddddddddddddd.',
    '.dookkkklllllod.',
    '.dokhhhklllllod.',
    '.dokwwwklllllod.',
    '.dokkkkklllllod.',
    '.dollwlllllllod.',
    '.dollswllllllod.',
    '.dollllwwllllod.',
    '.dolllsssslllod.',
    '.dddddddddddddd.',
    '.dddddddddddddd.',
    '....dd....dd....',
    '....dd....dd....',
    '................']));
  A.bulletin_plain = mkTile(g => paint(g, [
    '................',
    '.oooooooooooooo.',
    '.oddddddddddddo.',
    '.ooynwnnnnnnnoo.',
    '.ooncnncnnnnnoo.',
    '.oonnynwnnnnnoo.',
    '.oonnncnncnnnoo.',
    '.oonnnnynnnynoo.',
    '.oonnnnncnncnoo.',
    '.oonnnnnnwnnnoo.',
    '.oohnnnnnnnnhoo.',
    '.oddddddddddddo.',
    '.oooooooooooooo.',
    '....oo....oo....',
    '....oo....oo....',
    '................']));
  A.flyer_glimmer = mkTile(g => paint(g, [
    '................',
    '................',
    '...md...........',
    '.llllllll.......',
    '..llllllll......',
    '...lwyyyysl.....',
    '....lwywyysl....',
    '.....lwyyyysl...',
    '......lwwmmssl..',
    '.......lwwwwssl.',
    '........lllllls.',
    '................',
    '................',
    '................',
    '................',
    '................']));
  // B5 signature props. Hearth holds frame 0 when reduced motion is on.
  A.hearth = [0, 1].map(f => mkTile(g => {
    px(g, PAL.m, 1, 2, 14, 10); px(g, PAL.d, 2, 3, 12, 8); px(g, PAL.n, 4, 5, 8, 5);
    px(g, PAL.o, 5, 6 + (f ? 0 : 1), 6, 3); px(g, PAL.y, 6, 5 + f, 4, 2); px(g, PAL.y, 7, 4 + f, 2, 2);
    px(g, PAL.m, 1, 11, 14, 2); px(g, PAL.d, 3, 13, 2, 3); px(g, PAL.d, 11, 13, 2, 3);
  }));
  A.hearth.ms = 600;
  A.map_table = mkTile(g => {
    px(g, PAL.o, 1, 4, 14, 6); px(g, PAL.w, 2, 5, 12, 4); px(g, PAL.g, 3, 6, 4, 2); px(g, PAL.t, 8, 6, 3, 2); px(g, PAL.h, 12, 6, 1, 2);
    px(g, PAL.d, 1, 9, 14, 2); px(g, PAL.d, 2, 11, 2, 4); px(g, PAL.d, 12, 11, 2, 4);
  });
  A.house_chest = mkTile(g => {
    px(g, PAL.d, 2, 3, 12, 10); px(g, PAL.o, 3, 6, 10, 6); px(g, PAL.y, 3, 4, 10, 2); px(g, PAL.y, 7, 8, 2, 2); px(g, PAL.d, 4, 13, 2, 2); px(g, PAL.d, 10, 13, 2, 2);
  });
  A.plant_pot = mkTile(g => {
    px(g, PAL.l, 5, 2, 3, 2); px(g, PAL.g, 3, 3, 4, 3); px(g, PAL.l, 8, 4, 4, 3); px(g, PAL.g, 6, 6, 3, 2);
    px(g, PAL.o, 5, 8, 6, 4); px(g, PAL.d, 6, 9, 4, 2); px(g, PAL.d, 5, 12, 6, 2);
  });
  A.stool = mkTile(g => { px(g, PAL.o, 3, 6, 10, 3); px(g, PAL.y, 4, 6, 3, 1); px(g, PAL.d, 4, 9, 2, 5); px(g, PAL.d, 10, 9, 2, 5); });
  A.bench_short = mkTile(g => { px(g, PAL.o, 1, 7, 14, 3); px(g, PAL.y, 2, 7, 4, 1); px(g, PAL.d, 2, 10, 2, 4); px(g, PAL.d, 12, 10, 2, 4); px(g, PAL.d, 7, 10, 2, 3); });
  A.notice_board = mkTile(g => {
    px(g, PAL.d, 1, 1, 14, 12); px(g, PAL.w, 2, 2, 12, 10); px(g, PAL.y, 3, 3, 2, 1); px(g, PAL.h, 3, 5, 8, 1); px(g, PAL.h, 3, 7, 6, 1); px(g, PAL.y, 8, 8, 2, 1); px(g, PAL.h, 3, 9, 7, 1);
  });
  A.coat_rack = mkTile(g => {
    px(g, PAL.d, 3, 2, 10, 2); px(g, PAL.d, 7, 4, 2, 8); px(g, PAL.o, 2, 3, 3, 2); px(g, PAL.o, 11, 3, 3, 2);
    px(g, PAL.r, 5, 6, 4, 5); px(g, PAL.y, 6, 7, 1, 2); px(g, PAL.d, 4, 13, 8, 2);
  });
  A.lamp_stand = mkTile(g => {
    px(g, PAL.y, 5, 2, 6, 5); px(g, PAL.w, 6, 3, 3, 2); px(g, PAL.d, 7, 7, 2, 6); px(g, PAL.m, 4, 13, 8, 2);
  });
  A.radio_set = mkTile(g => {
    px(g, PAL.m, 2, 3, 12, 8); px(g, PAL.c, 3, 4, 6, 4); px(g, PAL.n, 4, 5, 4, 2); px(g, PAL.y, 10, 5, 2, 2); px(g, PAL.d, 4, 11, 2, 3); px(g, PAL.d, 10, 11, 2, 3); px(g, PAL.d, 3, 14, 10, 1);
  });
  A.chart_table = mkTile(g => {
    px(g, PAL.o, 1, 5, 14, 5); px(g, PAL.h, 2, 6, 12, 3); px(g, PAL.b, 3, 7, 5, 1); px(g, PAL.t, 9, 6, 1, 3); px(g, PAL.d, 1, 10, 14, 1); px(g, PAL.d, 2, 11, 2, 4); px(g, PAL.d, 12, 11, 2, 4);
  });
  A.kitchen_stove = mkTile(g => {
    px(g, PAL.y, 6, 1, 4, 3); px(g, PAL.o, 7, 2, 2, 2); px(g, PAL.d, 2, 4, 12, 8); px(g, PAL.m, 3, 5, 10, 5); px(g, PAL.n, 4, 6, 3, 3); px(g, PAL.y, 9, 6, 3, 2); px(g, PAL.d, 3, 12, 2, 3); px(g, PAL.d, 11, 12, 2, 3);
  });
  A.trophy_shelf = mkTile(g => {
    px(g, PAL.d, 1, 2, 14, 11); px(g, PAL.o, 2, 3, 12, 9);
    px(g, PAL.y, 3, 4, 2, 3); px(g, PAL.y, 7, 5, 2, 2); px(g, PAL.y, 11, 4, 2, 3);
    px(g, PAL.r, 4, 8, 3, 2); px(g, PAL.w, 9, 8, 3, 2); px(g, PAL.d, 2, 12, 12, 1);
  });
  A.pick_wall = mkTile(g => {
    px(g, PAL.m, 11, 2, 3, 2); px(g, PAL.d, 10, 3, 3, 2); px(g, PAL.o, 4, 8, 6, 2); px(g, PAL.d, 3, 9, 2, 4); px(g, PAL.y, 12, 2, 1, 1);
  });
  A.plinth = mkTile(g => {
    px(g, PAL.m, 3, 4, 10, 3); px(g, PAL.h, 4, 5, 8, 1); px(g, PAL.m, 5, 7, 6, 4); px(g, PAL.h, 6, 8, 4, 1); px(g, PAL.d, 3, 11, 10, 3); px(g, PAL.y, 7, 6, 2, 1);
  });
  const quilt = col => mkTile(g => {
    oval(g, 7.5, 10, 7, 5, PAL.d); oval(g, 7.5, 10, 6, 4, PAL.o); oval(g, 7.5, 9.5, 4.5, 2.5, PAL[col]);
    px(g, PAL.w, 3, 12, 10, 1); px(g, PAL.y, 5, 8, 3, 1); px(g, PAL.w, 4, 9, 2, 1);
  });
  A.quilt_r = quilt('r'); A.quilt_c = quilt('c'); A.quilt_y = quilt('y');
  // B7 signature props. Generic shapes only: a desk, a chart, blocks, a menu of plain squares.
  A.obs_desk = mkTile(g => {
    px(g, PAL.d, 1, 6, 14, 4); px(g, PAL.o, 2, 6, 12, 2); px(g, PAL.w, 3, 7, 5, 1); px(g, PAL.h, 4, 7, 3, 1);
    px(g, PAL.n, 10, 4, 3, 3); px(g, PAL.c, 11, 5, 1, 1); px(g, PAL.d, 2, 10, 2, 4); px(g, PAL.d, 12, 10, 2, 4);
  });
  A.star_roll = mkTile(g => {
    px(g, PAL.n, 2, 6, 12, 5); px(g, PAL.h, 3, 7, 10, 3); px(g, PAL.w, 5, 8, 1, 1); px(g, PAL.s, 8, 8, 1, 1); px(g, PAL.c, 7, 9, 1, 1);
    px(g, PAL.d, 2, 6, 2, 5); px(g, PAL.d, 12, 6, 2, 5);
  });
  A.obs_case = mkTile(g => {
    px(g, PAL.d, 3, 6, 10, 7); px(g, PAL.m, 4, 7, 8, 5); px(g, PAL.h, 4, 6, 8, 2); px(g, PAL.y, 7, 9, 2, 1); px(g, PAL.c, 6, 8, 1, 1);
  });
  A.dream_blocks = mkTile(g => {
    px(g, PAL.c, 2, 8, 4, 4); px(g, PAL.s, 3, 9, 1, 1); px(g, PAL.y, 6, 6, 4, 4); px(g, PAL.w, 7, 7, 1, 1);
    px(g, PAL.o, 5, 10, 4, 4); px(g, PAL.w, 6, 11, 1, 1); px(g, PAL.d, 2, 14, 10, 1);
  });
  A.dream_shelf = mkTile(g => {
    px(g, PAL.m, 1, 4, 14, 2); px(g, PAL.h, 1, 5, 14, 1); px(g, PAL.d, 2, 6, 2, 8); px(g, PAL.d, 12, 6, 2, 8); px(g, PAL.m, 1, 10, 14, 2);
    px(g, PAL.p, 6, 7, 4, 3); px(g, PAL.w, 7, 8, 2, 1); px(g, PAL.d, 7, 9, 1, 1);
  });
  A.dream_cushion = mkTile(g => { px(g, PAL.c, 3, 8, 10, 5); px(g, PAL.s, 4, 9, 8, 3); px(g, PAL.w, 5, 9, 2, 1); px(g, PAL.d, 3, 13, 10, 1); });
  A.menu_board = mkTile(g => {
    px(g, PAL.d, 2, 1, 12, 12); px(g, PAL.n, 3, 2, 10, 10); px(g, PAL.w, 4, 3, 8, 2);
    px(g, PAL.o, 4, 6, 3, 2); px(g, PAL.g, 8, 6, 3, 2); px(g, PAL.c, 4, 9, 3, 2); px(g, PAL.y, 8, 9, 3, 2);
    px(g, PAL.m, 7, 13, 2, 2); px(g, PAL.d, 4, 15, 8, 1);
  });
  A.order_post = mkTile(g => {
    px(g, PAL.m, 6, 3, 4, 8); px(g, PAL.h, 7, 4, 2, 2); px(g, PAL.d, 5, 2, 6, 2); px(g, PAL.n, 6, 8, 4, 3); px(g, PAL.y, 7, 9, 1, 1); px(g, PAL.d, 4, 14, 8, 2);
  });
  return A;
}
