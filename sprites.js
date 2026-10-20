/* Walklings sprite data. Creatures are 16x16, defined as the LEFT half (8 cols) and mirrored.
   Chars: . transparent, a main, b belly, c accent, d accent2, x extra, e eye (dark), i eye (shine).
   An outline is added automatically.
   habitat: spawn weight per environment tag (see env.js); tiles: preferred spawn spot on the map
   ('grass' = tall grass, 'shore' = next to water, 'woods' = next to trees). starter: offered as a first pet. uiHalo: draw a light rim around the
   sprite on dark UI cells (dex, collection, header) for dark-bodied species; the map art is unchanged.
   weatherOnly: env tags; the species spawns only while one of them is active and never in the any-species roll.
   Order matters: indices are runtime species numbers and ids are save-v2 form ids, so new lines are only ever appended.
   labOnly: never in the habitat roll or the 8% any-species roll. Met only where a map places it.
   npcOnly: never in a habitat roll, a spawn table, or the 8% any-species roll, and left out of the journal.
   A stage may use grid (16x16 PAL keys, not mirrored) when the art is not symmetric. half is still mirrored. */
'use strict';
const PAL = {k:'#1a1c2c',p:'#5d275d',r:'#b13e53',o:'#ef7d57',y:'#ffcd75',l:'#a7f070',g:'#38b764',t:'#257179',
  n:'#29366f',b:'#3b5dc9',c:'#41a6f6',s:'#73eff7',w:'#f4f4f4',h:'#94b0c2',m:'#566c86',d:'#333c57',
  // keeper skin tones (MAPS_SLICE K.1, light -> deep); appended only: no creature, tile, icon or glyph uses these keys
  '1':'#f9dcc0','2':'#efbb8e','3':'#d4955f','4':'#a96e43','5':'#7d4b2c','6':'#5a3520',
  // LANTERN_PALETTE_FIX: warm room keys, appended only. Used by the lantern tiles below.
  A:'#c9925e', // sand floor
  B:'#a8674a', // terracotta grout / chips
  C:'#e3d3ac', // cream wall
  D:'#9fae86', // sage line / hc wall
  E:'#5f6e4f', // dark sage wainscot
  F:'#5c4033', // warm shadow (replaces d in lantern shadows)
  G:'#b5845a', // checker partner / warm trim
  // CALLOWAY_RESKIN and WARDENS_HALL_RESKIN share these three. Defined once. A–G stay as written above.
  H:'#b9877a', // dusty rose plaster (Calloway wall)
  I:'#9c9382', // warm grey flagstone (Wardens floor)
  J:'#2f5a3e', // deep Keeper green (Wardens wainscot / runner)
  // MAHOPAC_OBS_FIX (D150): dusk violet floor. Appended once.
  P:'#9686a8', // dusk violet floor (observatory)
  // KEEPER_HQ_EXPAND (D150): slate lozenge. Appended once. A–J and P stay as written above.
  K:'#7a8aa0'}; // slate floor (Keeper House)

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
  ]},
  // Species 15. NPC only (D97/D98): a keeper never meets this line. Full grids, not mirrored halves.
  { id:'fetch', habitat:{}, npcOnly:true, tiles:'grass', type:'BLOOM', blurb:'A sunny field pup. Fetches seeds and plants them.',
    kit:{ form:'fetch/1', level:18, moves:['fetch_dash','briar_volley','thorn_lash','sap_sip'], nick:'Buddy' }, stages:[
    { name:'Fetchling', grid:[
      '................',
      '................',
      '................',
      '................',
      '................',
      '..........oy....',
      '.........oyyy...',
      '........oyykyy..',
      '........oyyyyyk.',
      '........yyyyww..',
      '..y.yyyyyyyyy...',
      '..yyyyyyyyyyw...',
      '...yyyyyyyyw....',
      '...yo.yo.yo.y...',
      '...ww.ww.ww.w...',
      '................']},
    { name:'Harvestail', grid:[
      '................',
      '................',
      '...........yy...',
      '..........yyyy..',
      '.........oyykyy.',
      '.........oyyyyyk',
      '..........oyyww.',
      'y.........oyrw..',
      'yy.yyyyyyyyyw...',
      '.yyyyyyyyyyyww..',
      '.oyyyyyyyyyyww..',
      '..yyyyyyyyyyw...',
      '..oy.oy...oy.y..',
      '..oy.oy...oy.y..',
      '..ww.ww...ww.w..',
      '................']},
    { name:'Hearthound', grid:[
      '..........yyy...',
      '.........yyyyy..',
      '........oyykyyy.',
      '........oyyyyyyk',
      '.........oyyyww.',
      'y........oyyrww.',
      'yy.......oyyww..',
      'yyyoyyyyyyyyyw..',
      '.yyyyyyyyyyyyww.',
      '.oyyyyyyyyyyyww.',
      '..yyyyyyyyyyyw..',
      '..yyygyyyyyyy...',
      '..oyy.oyy.oyy...',
      '..oyy.oyy.oyy...',
      '..www.www.www...',
      '................']}
  ]}
];

/* Build an 18x18 canvas (16x16 + 1px outline border). mode: 'normal' | 'blink' | solid colour string.
   A half is 8 columns and mirrored. A grid longer than 8 is a full 16x16 of PAL keys and is not mirrored. */
function buildSprite(half, col, mode){
  const full = !!(half && half.length && String(half[0]).length > 8);
  const grid = full
    ? half.map(row => (String(row) + '................').slice(0, 16).split(''))
    : half.map(h => { h = (h + '........').slice(0,8); return (h + h.split('').reverse().join('')).split(''); });
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
    else if (full) fill = PAL[ch] || PAL.m;
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
  // HEART_ALERT v0.2 badges (D156). 5x5, PAL only. Bowl for food, z for rest.
  badge_food: ['.....','y.y.y','ooooo','.ooo.','..o..'],
  badge_rest: ['wwww.','..w..','.w...','wwww.','.....'],
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
// FLOOR_FIX (D184-D186): 54 calm floor grids. Old floor tiles stay defined. No new palette keys.
const FLOOR_FIX_TILES = {
  floor_lino: ["DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDCDD","DDDDDDDDDDDDDDDD","DDDCDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDEDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD"],
  floor_lino_b: ["DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDCDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDEEDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDCCCDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD"],
  floor_lino_c: ["DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDwDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDEDDDDDDDDDDDDD","DDDEDDDDDDDDDDDD","DDDDDDDDDDDDDDDD","DDDDDDDDDDDDDDDD"],
  floor_sport: ["tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","ttttgttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","ttttttttttttgttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt"],
  floor_sport_b: ["tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttstttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttgtttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt"],
  floor_sport_c: ["tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttgtt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttnnttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt","tttttttttttttttt"],
  floor_pile: ["HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHBHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHBHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHBHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHBHH","HHHHHHHHHHHHHHHH"],
  floor_pile_b: ["HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHBHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHBHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHrHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH"],
  floor_pile_c: ["HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHBHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HBHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHCHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH"],
  floor_drill: ["EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEDDEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEJEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE"],
  floor_drill_b: ["EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEyyyEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE"],
  floor_drill_c: ["EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEDEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEJJEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE"],
  floor_boardwalk: ["KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","mmmmmmmmmmmmmmmm","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","KKKhKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKsKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","mmmmmmmmmmmmmmmm","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKhKKKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK"],
  floor_boardwalk_b: ["KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","mmmmmmmmmmmmmmmm","KKKKKKKKKmKKKKKK","KKKKKKKKKmKKKKKK","KKKKKKKKKmKKKKKK","KKKKKKKKKmKKKKKK","KKKKKKKKKmKKKKKK","KKKKKKKKKmKKKKKK","KKKKKKKKKmKKKKKK","mmmmmmmmmmmmmmmm","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","KKKKhKKKKKKKKKKK","KKKKKKKKKKKKKKKK"],
  floor_boardwalk_c: ["KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","mmmmmmmmmmmmmmmm","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","KKKKKKhhKKKKKKKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","mmmmmmmmmmmmmmmm","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKsKKK","KKKKKKKKKKKKKKKK","KKKKKKKKKKKKKKKK"],
  floor_ballroom: ["oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","oooGGGoooooooooo","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","BBBBBBBBBBBBBBBB","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","oooooooooooGoooo","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","BBBBBBBBBBBBBBBB"],
  floor_ballroom_b: ["oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","ooooooooooGooooo","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","BBBBBBBBBBBBBBBB","oooooBoooooooooo","oooooBoooooooooo","oooooBoooooooooo","oooooBoooooooooo","oooooBoooooooooo","oooooBoooooooooo","oooooBoooooooooo","BBBBBBBBBBBBBBBB"],
  floor_ballroom_c: ["oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","ooyooooooooooooo","oooooooooooooooo","oooooooooooooooo","BBBBBBBBBBBBBBBB","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","oooooooooGGGoooo","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","BBBBBBBBBBBBBBBB"],
  floor_clay: ["BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBGBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBFBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB"],
  floor_clay_b: ["BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBGGBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBFBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB"],
  floor_clay_c: ["BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBABBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBFFFBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB"],
  floor_civic: ["KKKKKKKKKKKmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmhmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm"],
  floor_civic_b: ["KmmmmKKKKKKKKKKK","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmdmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm"],
  floor_civic_c: ["KKKKKKKmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmhmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","Kmmmmmdmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm","Kmmmmmmmmmmmmmmm"],
  floor_wardstone: ["GGGGGGGGGGGGIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIICIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIGIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII"],
  floor_wardstone_b: ["GIIIGGGGGGGGGGGG","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIICIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII"],
  floor_wardstone_c: ["GGGGGGGGGIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIICIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIGIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII","GIIIIIIIIIIIIIII"],
  floor_pine: ["yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyAyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","AAAAAAAAAAAAAAAA","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyAyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","AAAAAAAAAAAAAAAA","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy"],
  floor_pine_b: ["yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","AAAAAAAAAAAAAAAA","yyyyyyyyyyyyAyyy","yyyyyyyyyyyyAyyy","yyyyyyyyyyyyAyyy","yyyyyyyyyyyyAyyy","yyyyyyyyyyyyAyyy","yyyyyyyyyyyyAyyy","yyyyyyyyyyyyAyyy","AAAAAAAAAAAAAAAA","yyyyyyyyyyyyyyyy","yyyyyAyyyyyyyyyy","yyyyyyyyyyyyyyyy"],
  floor_pine_c: ["yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","AAAAAAAAAAAAAAAA","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyCCCyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","AAAAAAAAAAAAAAAA","yyyyyyyyyyyyyyyy","yyGyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy"],
  floor_calloway: ["GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","BBBBBBBBBBBBBBBB","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGAAAGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","BBBBBBBBBBBBBBBB","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGAGGG","GGGGGGGGGGGGGGGG"],
  floor_calloway_b: ["GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","BBBBBBBBBBBBBBBB","GGGGGGGGGBGGGGGG","GGGGGGGGGBGGGGGG","GGGGGGGGGBGGGGGG","GGAGGGGGGBGGGGGG","GGGGGGGGGBGGGGGG","GGGGGGGGGBGGGGGG","GGGGGGGGGBGGGGGG","BBBBBBBBBBBBBBBB","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG"],
  floor_calloway_c: ["GGGGGGGGGGGGGGGG","GGGGGGGGGGAAAGGG","GGGGGGGGGGGGGGGG","BBBBBBBBBBBBBBBB","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","BBBBBBBBBBBBBBBB","GGGGGGGGGGGGGGGG","GGGGFGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG"],
  floor_mist: ["hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhwhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhwhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh"],
  floor_mist_b: ["hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhwhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhKhhhhhhhhh","hhhhhhKhhhhhhhhh","hhhhhhKhhhhhhhhh","hhhhhhKhhhhhhhhh","hhhhhhKhhhhhhhhh","hhhhhhKhhhhhhhhh","hhhhhhKhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh"],
  floor_mist_c: ["hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhKKKhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhchhhhhhhhhhhhh"],
  floor_loft: ["wwwwwwwwwwwwwwww","CCCCCCCCCCCCCCCC","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwhwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","CCCCCCCCCCCCCCCC","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwCwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww"],
  floor_loft_b: ["wwwwwwwwwwwwwwww","CCCCCCCCCCCCCCCC","wwwwwwwwwwwCwwww","wwwwwwwwwwwCwwww","wwwwwwwwwwwCwwww","wwwwwwwwwwwCwwww","wwwwwwwwwwwCwwww","wwwwwwwwwwwCwwww","wwwwwwwwwwwCwwww","CCCCCCCCCCCCCCCC","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwhwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww"],
  floor_loft_c: ["wwwwwwwwwwwwwwww","CCCCCCCCCCCCCCCC","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwyww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","CCCCCCCCCCCCCCCC","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwCCCwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww"],
  floor_dusk: ["PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPhPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","BBBBBBBBBBBBBBBB","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPhPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","BBBBBBBBBBBBBBBB","PPPPPPPPPPPPPPPP"],
  floor_dusk_b: ["PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPhPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","BBBBBBBBBBBBBBBB","PPPPPPPPBPPPPPPP","PPPPPPPPBPPPPPPP","PPPPPPPPBPPPPPPP","PPPPPPPPBPPPPPPP","PPPKPPPPBPPPPPPP","PPPPPPPPBPPPPPPP","PPPPPPPPBPPPPPPP","BBBBBBBBBBBBBBBB","PPPPPPPPPPPPPPPP"],
  floor_dusk_c: ["PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPwPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","BBBBBBBBBBBBBBBB","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPKKKPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","PPPPPPPPPPPPPPPP","BBBBBBBBBBBBBBBB","PPPPPPPPPPPPPPPP"],
  floor_den: ["FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFBFF","FFFFBFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFBFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF"],
  floor_den_b: ["FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFBBFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFBFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF"],
  floor_den_c: ["FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFGFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFBFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF"],
  floor_hold: ["IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IICIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIFII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII"],
  floor_hold_b: ["IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IICIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIGGIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIFII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII"],
  floor_hold_c: ["IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IICIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIGIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIFII","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII"],
  floor_rock: ["dddddddddddddddd","dddddddddddddddd","ddddddddddddnndd","ddnnnddddddddddd","ddnnnddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddmdddddd","ddddddddddmmdddd","ddddddddddddmddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd"],
  floor_rock_b: ["dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","ddddddddnnnndddd","ddddddddnnnndddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","ddddttdddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd"],
  floor_rock_c: ["dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","dddmdddddddddddd","ddddmmdddddddddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd","ddddddddddnnnddd","ddddddddddnnnddd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd"],
  floor_yard: ["EEEEEEEJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJgJJJJJJJJJ","JJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ"],
  floor_yard_b: ["EJJJJJJJJEEEEEEE","EJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ","EJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJgJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ"],
  floor_yard_c: ["JJJEEEEEEJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJDJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJgJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ","JJJJJJJJJJJJJJJJ"],
};

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

  // B2 RegenX floors: tinted grout, mint inlay, pale blue stripe, amber stripe, sound panel, stair.
  // Variants are scuff / glint / stain. Hand-placed grid chars are not in these tables, so they win.
  {
    const floor = LAB_TILES.lab_floor;
    const tint = (rows, from, to) => rows.map(r => r.split(from).join(to));
    const stamp = (rows, pts) => rows.map((r, y) => { const a = [...r]; for (const [x, yy, c] of pts) if (yy === y) a[x] = c; return a.join(''); });
    LAB_TILES.lab_floor_focus = tint(floor, 'h', 'c');
    LAB_TILES.lab_floor_records = tint(floor, 'h', 'y');
    const glint = [[3, 2, 's'], [5, 5, 'w'], [12, 6, 's'], [10, 11, 'w'], [4, 13, 's'], [13, 14, 'w']];
    const stain = [[4, 4, 'm'], [5, 4, 'd'], [6, 4, 'm'], [5, 5, 'm'], [4, 6, 'd'], [11, 10, 'm'], [12, 10, 'd'], [12, 11, 'm']];
    LAB_TILES.lab_floor_glint = stamp(floor, glint);
    LAB_TILES.lab_floor_stain = stamp(floor, stain);
    LAB_TILES.lab_focus_scuff = stamp(LAB_TILES.lab_floor_focus, stain);
    LAB_TILES.lab_focus_glint = stamp(LAB_TILES.lab_floor_focus, glint);
    LAB_TILES.lab_records_scuff = stamp(LAB_TILES.lab_floor_records, stain);
    LAB_TILES.lab_records_glint = stamp(LAB_TILES.lab_floor_records, glint);
    const inlay = [[6, 3, 'l'], [7, 3, 'l'], [8, 3, 'l'], [9, 3, 'l'], [5, 4, 'l'], [6, 4, 'g'], [7, 4, 'l'], [8, 4, 'l'], [9, 4, 'g'], [10, 4, 'l'], [6, 5, 'l'], [7, 5, 'l'], [8, 5, 'l'], [9, 5, 'l'], [7, 11, 'l'], [8, 11, 'l'], [6, 12, 'l'], [7, 12, 'g'], [8, 12, 'g'], [9, 12, 'l'], [7, 13, 'l'], [8, 13, 'l']];
    LAB_TILES.lab_inlay_mint = stamp(floor, inlay);
    const band = (rows, edge, mid) => rows.map((r, y) => (y >= 6 && y <= 9) ? ((y === 6 || y === 9) ? edge : mid) : r);
    LAB_TILES.lab_stripe_blue = band(LAB_TILES.lab_floor_focus, 's'.repeat(16), 's' + 'h'.repeat(14) + 's');
    LAB_TILES.lab_stripe_amber = band(LAB_TILES.lab_floor_records, 'y'.repeat(16), 'y' + 'h'.repeat(14) + 'y');
    const foam = ['wsssssshsssssssw', 'wscscschscscscsw', 'wsssssshsssssssw', 'wswswswhwswswsww', 'wsssssshsssssssw'];
    LAB_TILES.lab_wall_panel = LAB_TILES.lab_wall_face.map((r, y) => (y >= 1 && y <= 5) ? foam[y - 1] : r);
    // STAIR_MARKER: full-tile flight. The top two rows are PAL.k (D222 refinement) so the flight reads into the next room. Corners stay clear.
    LAB_TILES.lab_stair = ['..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..', '..kkkkkkkkkkkk..', '..lwwwwwwwwwwl..', '..dhhhhhhhhhhd..', '..dmmmmmmmmmmd..', '.lwwwwwwwwwwwwl.', '.dhhhhhhhhhhhhd.', '.dhhhhhhhhhhhhd.', '.dmmmmmmmmmmmmd.', 'lwwwwwwwwwwwwwwl', 'dmmmmmmmmmmmmmmd', 'dmmmmmmmmmmmmmmd', 'dmmmmmmmmmmmmmmd', 'dmmmmmmmmmmmmmmd', 'dmmmmmmmmmmmmmmd'];
  }
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
  function lanternFloor(a, b, grout, marks){
    return mkTile(g => {
      px(g, PAL[a], 0, 0, 8, 8); px(g, PAL[b], 8, 0, 8, 8); px(g, PAL[b], 0, 8, 8, 8); px(g, PAL[a], 8, 8, 8, 8);
      px(g, PAL[grout], 0, 0, 16, 1); px(g, PAL[grout], 0, 0, 1, 16);
      specks(g, marks || []);
    });
  }
  // Same face as wallFace, then a dark lower band, a trim rail and a warm foot. The window is drawn last.
  function wainFace(fill, line, wain, trim, marks, win){
    return mkTile(g => {
      px(g, PAL[fill], 0, 0, 16, 16);
      px(g, PAL[line], 0, 4, 16, 1); px(g, PAL[line], 0, 9, 16, 1);
      px(g, PAL[wain], 0, 14, 16, 2); px(g, PAL[line], 0, 13, 16, 1);
      specks(g, marks || []);
      px(g, PAL[wain], 0, 10, 16, 6); px(g, PAL[trim], 0, 9, 16, 1); px(g, PAL.F, 0, 15, 16, 1);
      if (win) {
        const [x, y, w, h, frame, glass] = win;
        px(g, PAL[frame], x, y, w, h);
        px(g, PAL[glass], x + 1, y + 1, w - 2, h - 2);
        px(g, PAL.s, x + 1, y + 1, Math.max(2, (w / 3) | 0), 2);
        px(g, PAL[frame], x + ((w / 2) | 0), y + 1, 1, h - 2);
      }
    });
  }
  // Calloway wallpaper: rose fill, sprig dots, a rail, wood wainscot. The window is drawn last.
  function sprigFace(fill, dot1, dot2, rail, wain, win){
    return mkTile(g => {
      px(g, PAL[fill], 0, 0, 16, 16);
      [[2, 1], [10, 1], [6, 5], [14, 5]].forEach(([x, y]) => { px(g, PAL[dot1], x, y, 1, 1); px(g, PAL[dot2], x, y + 1, 1, 1); });
      px(g, PAL[rail], 0, 8, 16, 1); px(g, PAL[wain], 0, 9, 16, 7); px(g, PAL.F, 3, 9, 1, 6); px(g, PAL.F, 11, 9, 1, 6); px(g, PAL.F, 0, 15, 16, 1);
      if (win) {
        const [x, y, w, h, fr, gl] = win;
        px(g, PAL[fr], x, y, w, h); px(g, PAL[gl], x + 1, y + 1, w - 2, h - 2); px(g, PAL[fr], x + (w >> 1), y + 1, 1, h - 2);
      }
    });
  }
  // Wardens timber boards over a green wainscot. The gold stud sits on the wainscot. The window is drawn last.
  function boardFace(fill, line, wain, rail, win){
    return mkTile(g => {
      px(g, PAL[fill], 0, 0, 16, 16);
      [0, 5, 10, 15].forEach(x => px(g, PAL[line], x, 0, 1, 9));
      px(g, PAL[rail], 0, 9, 16, 1); px(g, PAL[wain], 0, 10, 16, 6); px(g, PAL.y, 7, 12, 2, 2); px(g, PAL.F, 0, 15, 16, 1);
      if (win) {
        const [x, y, w, h, fr, gl] = win;
        px(g, PAL[fr], x, y, w, h); px(g, PAL[gl], x + 1, y + 1, w - 2, h - 2); px(g, PAL[fr], x + (w >> 1), y + 1, 1, h - 2);
      }
    });
  }
  function runnerTile(a, edge, mark){
    return mkTile(g => { px(g, PAL[a], 0, 0, 16, 16); px(g, PAL[edge], 0, 0, 1, 16); px(g, PAL[edge], 15, 0, 1, 16); px(g, PAL[mark], 7, 6, 2, 4); });
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
  T.floor_lantern = lanternFloor('A', 'G', 'B');
  T.floor_lantern_b = lanternFloor('A', 'G', 'B', [[4, 4, 'C'], [12, 11, 'B']]);
  T.floor_lantern_c = lanternFloor('G', 'A', 'B', [[11, 3, 'B'], [3, 12, 'C']]);
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
  T.wall_lantern = wallTop('C', 'D', [[2, 7, 'D'], [9, 5, 'G'], [13, 11, 'C']]);
  T.wall_lantern_face = wainFace('C', 'D', 'E', 'G', [[4, 6, 'D']], null);
  T.wall_lantern_win = wainFace('C', 'D', 'E', 'G', [], [4, 1, 8, 8, 'G', 'y']);
  T.wall_rose = wallTop('H', 'F', [[3, 6, 'C'], [11, 10, 'C']]);
  T.wall_rose_face = sprigFace('H', 'C', 'D', 'G', 'A', null);
  T.wall_rose_win = sprigFace('H', 'C', 'D', 'G', 'A', [4, 1, 8, 7, 'F', 'y']);
  T.floor_honey = woodFloor('G', 'F', [0, 5, 10, 15], [[3, 1], [11, 6], [6, 11]], [[8, 3, 'A'], [2, 8, 'B']]);
  T.floor_honey_b = woodFloor('A', 'F', [0, 5, 10, 15], [[7, 1], [2, 6], [13, 11]], [[5, 3, 'G'], [12, 8, 'B']]);
  T.floor_honey_c = woodFloor('G', 'B', [0, 5, 10, 15], [[10, 1], [5, 6], [1, 11]], [[13, 3, 'A'], [8, 13, 'F']]);
  T.wall_warden = wallTop('F', 'J', [[4, 6, 'G'], [12, 10, 'G']]);
  T.wall_warden_face = boardFace('G', 'F', 'J', 'y', null);
  T.wall_warden_win = boardFace('G', 'F', 'J', 'y', [4, 1, 8, 7, 'F', 'y']);
  T.floor_warden = stoneFloor('I', 'F', [[3, 3, 'C'], [11, 11, 'G']], null);
  T.floor_warden_b = stoneFloor('I', 'F', [[6, 4, 'D'], [12, 2, 'C']], [2, 5, 4]);
  T.floor_warden_c = stoneFloor('G', 'F', [[4, 10, 'I'], [13, 6, 'y']], [9, 12, 5]);
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
  T.rug_lantern = rug('E', 'y', 'C');
  T.rug_rook = rug('r', 'o', 'y');
  T.rug_calloway = rug('E', 'C', 'y');
  T.rug_warden = runnerTile('J', 'y', 'g');
  T.rug_keeper = rug('g', 'y', 'l');
  T.rug_ink = rug('b', 'n', 'c');
  T.rug_cobble = rug('o', 'm', 'y');
  T.rug_hall = rug('m', 'h', 'd');
  function doormat(a, b){ return mkTile(g => { px(g, PAL[a], 0, 0, 16, 16); px(g, PAL[b], 1, 3, 14, 10); for (let x = 3; x < 14; x += 2) px(g, PAL[a], x, 4, 1, 8); }); }
  T.mat_home = doormat('o', 'y');
  T.mat_loft = doormat('h', 'w');
  T.mat_lodge = doormat('d', 'o');
  T.mat_lantern = doormat('w', 'y');
  T.mat_lantern_warm = doormat('F', 'A');
  T.mat_rook = doormat('r', 'o');
  T.mat_calloway = doormat('F', 'G');
  T.mat_warden = doormat('J', 'y');
  T.mat_keeper = doormat('g', 'y');
  T.mat_ink = doormat('n', 'c');
  T.mat_cobble = doormat('m', 'o');
  T.mat_hall = doormat('d', 'h');
  T.mat_dusk = doormat('F', 'P');   // D230: observatory exit mat
  function gridTile(rows){ return mkTile(g => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); }))); }
  // STAIR_MARKER flights. Up opens into PAL.k (D222 refinement, Lissett via Vincent): solid black at the top, narrowing corners stay clear so the floor shows. Down keeps its dark well.
  T.stair_home = gridTile(['..kkkkkkkkkkkk..','..kkkkkkkkkkkk..','..kkkkkkkkkkkk..','..GwwwwwwwwwwG..','..FyyyyyyyyyyF..','..FBBBBBBBBBBF..','.GwwwwwwwwwwwwG.','.FAAAAAAAAAAAAF.','.FAAAAAAAAAAAAF.','.FBBBBBBBBBBBBF.','GwwwwwwwwwwwwwwG','FGGGGGGGGGGGGGGF','FGGGGGGGGGGGGGGF','FGGGGGGGGGGGGGGF','FGGGGGGGGGGGGGGF','FBBBBBBBBBBBBBBF']);
  T.stair_loft = gridTile(['GwwwwwwwwwwwwwwG','FCCCCCCCCCCCCCCF','FCCCCCCCCCCCCCCF','FCCCCCCCCCCCCCCF','FFFFFFFFFFFFFFFF','.GwwwwwwwwwwwwG.','.FGGGGGGGGGGGGF.','.FGGGGGGGGGGGGF.','.FFFFFFFFFFFFFF.','..GwwwwwwwwwwG..','..FBBBBBBBBBBF..','..FBBBBBBBBBBF..','..FFFFFFFFFFFF..','..FFFFFFFFFFFF..','..FFFFFFFFFFFF..','..FFFFFFFFFFFF..']);
  T.wall_shadow = mkTile(g => { px(g, PAL.d, 0, 0, 16, 1); px(g, PAL.m, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.d, x, 2, 1, 1); });
  T.window_light = mkTile(g => { px(g, PAL.d, 0, 0, 16, 1); px(g, PAL.m, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.d, x, 2, 1, 1); px(g, PAL.y, 4, 6, 8, 5); px(g, PAL.w, 6, 7, 4, 3); });
  T.wall_shadow_warm = mkTile(g => { px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.G, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.F, x, 2, 1, 1); });
  T.window_light_warm = mkTile(g => { px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.G, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.F, x, 2, 1, 1); px(g, PAL.y, 4, 6, 8, 5); px(g, PAL.C, 6, 7, 4, 3); });
  T.wall_shadow_rose = mkTile(g => { px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.B, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.F, x, 2, 1, 1); });
  T.window_light_rose = mkTile(g => { px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.B, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.F, x, 2, 1, 1); px(g, PAL.y, 4, 6, 8, 5); px(g, PAL.C, 6, 7, 4, 3); });
  T.wall_shadow_warden = mkTile(g => { px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.J, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.F, x, 2, 1, 1); });
  T.window_light_warden = mkTile(g => { px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.J, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.F, x, 2, 1, 1); px(g, PAL.y, 4, 6, 8, 5); px(g, PAL.C, 6, 7, 4, 3); });
  // KEEPER_HQ_EXPAND: warm ashlar over a navy wainscot with a gold rail, a slate lozenge, a vertical Keeper runner, and three zone floors.
  function ashlarFace(win){
    return mkTile(g => {
      px(g, PAL.h, 0, 0, 16, 16);
      px(g, PAL.m, 0, 0, 16, 1); px(g, PAL.m, 0, 4, 16, 1);
      px(g, PAL.m, 0, 1, 1, 3); px(g, PAL.m, 8, 1, 1, 3); px(g, PAL.m, 4, 5, 1, 3); px(g, PAL.m, 12, 5, 1, 3);
      px(g, PAL.n, 0, 10, 16, 6); px(g, PAL.y, 0, 9, 16, 1); px(g, PAL.d, 0, 15, 16, 1);
      if (win) {
        px(g, PAL.n, 4, 1, 8, 7); px(g, PAL.s, 5, 2, 6, 5); px(g, PAL.w, 5, 2, 2, 2); px(g, PAL.n, 7, 2, 1, 5);
      }
    });
  }
  function lozengeFloor(marks){
    return mkTile(g => {
      px(g, PAL.K, 0, 0, 16, 16);
      [[8, 4], [6, 6], [10, 6], [5, 8], [11, 8], [6, 10], [10, 10], [8, 12]].forEach(([x, y]) => px(g, PAL.m, x, y));
      px(g, PAL.y, 8, 8);
      specks(g, marks || []);
    });
  }
  T.wall_keep = mkTile(g => { px(g, PAL.h, 0, 0, 16, 16); px(g, PAL.m, 0, 0, 16, 1); px(g, PAL.m, 0, 8, 16, 1); px(g, PAL.m, 4, 1, 1, 7); px(g, PAL.m, 12, 9, 1, 5); px(g, PAL.n, 0, 14, 16, 2); px(g, PAL.y, 0, 13, 16, 1); });
  T.wall_keep_face = ashlarFace(false);
  T.wall_keep_win = ashlarFace(true);
  T.floor_keep = lozengeFloor([]);
  T.floor_keep_b = lozengeFloor([[12, 4, 'h']]);
  T.floor_keep_c = lozengeFloor([[5, 12, 'm'], [13, 3, 'h']]);
  T.rug_keep = mkTile(g => { px(g, PAL.g, 0, 0, 16, 16); px(g, PAL.y, 0, 0, 1, 16); px(g, PAL.y, 15, 0, 1, 16); px(g, PAL.J, 1, 0, 1, 16); px(g, PAL.J, 14, 0, 1, 16); px(g, PAL.y, 7, 7, 2, 2); });
  T.mat_keep = doormat('J', 'y');
  T.floor_keep_tile = mkTile(g => { px(g, PAL.h, 0, 0, 16, 16); px(g, PAL.m, 0, 0, 16, 1); px(g, PAL.m, 0, 8, 16, 1); px(g, PAL.m, 0, 0, 1, 16); px(g, PAL.m, 8, 0, 1, 16); px(g, PAL.w, 2, 2, 2, 1); });
  T.floor_keep_ops = mkTile(g => { px(g, PAL.K, 0, 0, 16, 16); [0, 4, 8, 12].forEach(i => { px(g, PAL.m, i, 0, 1, 16); px(g, PAL.m, 0, i, 16, 1); }); px(g, PAL.l, 2, 2); px(g, PAL.l, 10, 10); });
  T.floor_keep_carpet = mkTile(g => { px(g, PAL.D, 0, 0, 16, 16); px(g, PAL.E, 0, 0, 16, 1); px(g, PAL.E, 0, 15, 16, 1); [[4, 4], [12, 4], [8, 8], [4, 12], [12, 12]].forEach(([x, y]) => px(g, PAL.y, x, y)); });
  T.wall_shadow_keep = mkTile(g => { px(g, PAL.n, 0, 0, 16, 1); px(g, PAL.y, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.n, x, 2, 1, 1); });
  T.window_light_keep = mkTile(g => { px(g, PAL.n, 0, 0, 16, 1); px(g, PAL.y, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.n, x, 2, 1, 1); px(g, PAL.y, 4, 6, 8, 5); px(g, PAL.C, 6, 7, 4, 3); });
  // B6 High Charity rooms. One floor and one wall per room. `j` is a hand-placed scuff. `Y` is a keeper pilaster that breaks a long wall run.
  function padFloor(speck){ return mkTile(g => { px(g, PAL.h, 0, 0, 16, 16); px(g, PAL.m, 0, 0, 16, 1); px(g, PAL.m, 0, 0, 1, 16); specks(g, speck); }); }
  function deckFloor(speck){ return mkTile(g => { px(g, PAL.n, 0, 0, 16, 16); px(g, PAL.d, 0, 15, 16, 1); px(g, PAL.b, 0, 0, 1, 16); specks(g, speck); }); }
  function clinicFloor(fill, speck, grout){ grout = grout || 'c'; return mkTile(g => { px(g, PAL[grout], 0, 0, 16, 16); px(g, PAL[fill], 1, 1, 6, 6); px(g, PAL[fill], 9, 1, 6, 6); px(g, PAL[fill], 1, 9, 6, 6); px(g, PAL[fill], 9, 9, 6, 6); if (speck) px(g, PAL[speck], 4, 4, 2, 1); }); }
  function shopFloor(fill, speck){ return mkTile(g => { px(g, PAL.h, 0, 0, 16, 16); px(g, PAL[fill], 1, 1, 14, 14); px(g, PAL.w, 2, 2, 2, 1); if (speck) px(g, PAL[speck], 10, 8, 2, 1); }); }
  function marbleFloor(flip, crack){ return mkTile(g => { const a = flip ? PAL.h : PAL.w, b = flip ? PAL.w : PAL.h; px(g, a, 0, 0, 8, 8); px(g, b, 8, 0, 8, 8); px(g, b, 0, 8, 8, 8); px(g, a, 8, 8, 8, 8); px(g, PAL.s, 2, 2, 2, 1); if (crack) px(g, PAL.m, crack[0], crack[1], crack[2], 1); }); }
  function sandFloor(speck){ return mkTile(g => { px(g, PAL.y, 0, 0, 16, 16); specks(g, speck); px(g, PAL.o, 0, 15, 16, 1); }); }
  function parquetFloor(a, b, seam){ return mkTile(g => { px(g, PAL[seam], 0, 0, 16, 16); px(g, PAL[a], 1, 1, 6, 6); px(g, PAL[b], 9, 1, 6, 6); px(g, PAL[b], 1, 9, 6, 6); px(g, PAL[a], 9, 9, 6, 6); px(g, PAL.y, 3, 3, 2, 1); }); }
  function carpetFloor(a, b, speck){ return mkTile(g => { px(g, PAL[a], 0, 0, 16, 16); for (let y = 1; y < 15; y += 4) px(g, PAL[b], 0, y, 16, 1); specks(g, speck); }); }
  T.floor_pad = padFloor([[6, 6, 'w'], [12, 10, 'm']]);
  T.floor_pad_b = padFloor([[3, 8, 'd'], [11, 4, 'm'], [8, 12, 'd']]);
  T.floor_pad_c = padFloor([[9, 3, 'w'], [2, 11, 'y']]);
  T.floor_deck = deckFloor([[5, 4, 'c'], [12, 9, 'b']]);
  T.floor_deck_b = deckFloor([[2, 7, 'd'], [8, 3, 'c'], [13, 11, 's']]);
  T.floor_deck_c = deckFloor([[7, 10, 'b'], [4, 2, 'd']]);
  T.floor_bunk = woodFloor('t', 'g', [0, 5, 10, 15], [[2, 1], [9, 6], [6, 11]], [[4, 3, 'y'], [12, 8, 'd']]);
  T.floor_bunk_b = woodFloor('g', 't', [1, 6, 11], [[5, 2], [12, 7]], [[3, 9, 'd'], [10, 4, 'l']]);
  T.floor_bunk_c = woodFloor('t', 'd', [0, 6, 12], [[7, 1], [1, 8], [11, 10]], [[8, 5, 'g'], [14, 12, 'y']]);
  T.floor_dock = woodFloor('c', 'b', [1, 6, 11], [[3, 2], [10, 7], [5, 12]], [[8, 4, 's'], [2, 9, 'w']]);
  T.floor_dock_b = woodFloor('b', 'c', [0, 5, 10, 15], [[6, 1], [13, 6], [2, 11]], [[9, 8, 't'], [4, 3, 'd']]);
  T.floor_dock_c = woodFloor('c', 't', [2, 8, 14], [[4, 1], [11, 9]], [[7, 5, 's'], [1, 12, 'b']]);
  T.floor_lesson = woodFloor('y', 'w', [0, 4, 9, 14], [[6, 1], [12, 5], [3, 10]], [[8, 7, 'o'], [14, 2, 'h']]);
  T.floor_lesson_b = woodFloor('w', 'y', [1, 6, 12], [[4, 2], [10, 8]], [[2, 5, 'o'], [13, 11, 'h']]);
  T.floor_lesson_c = woodFloor('y', 'o', [0, 7, 13], [[8, 1], [2, 9], [12, 6]], [[5, 4, 'w'], [11, 12, 'n']]);
  T.floor_marble = marbleFloor(false, null);
  T.floor_marble_b = marbleFloor(true, [4, 10, 5]);
  T.floor_marble_c = marbleFloor(false, [9, 5, 4]);
  T.floor_court = woodFloor('o', 'r', [0, 5, 10, 15], [[4, 1], [11, 6], [2, 11]], [[7, 3, 'y'], [13, 8, 'w']]);
  T.floor_court_b = woodFloor('y', 'o', [1, 6, 12], [[8, 2], [3, 9]], [[12, 5, 'r'], [5, 12, 'w']]);
  T.floor_court_c = woodFloor('o', 'd', [0, 8, 14], [[6, 1], [13, 7], [2, 10]], [[9, 4, 'y'], [4, 13, 'r']]);
  T.floor_clinic = clinicFloor('w', null);
  T.floor_clinic_b = clinicFloor('s', 'l');
  T.floor_clinic_c = clinicFloor('l', 'w');
  T.floor_clinic_warm = clinicFloor('A', null, 'E');
  T.floor_clinic_warm_b = clinicFloor('A', 'C', 'E');
  T.floor_clinic_warm_c = clinicFloor('C', 'B', 'E');
  T.floor_nave = stoneFloor('w', 'h', [[3, 4, 'y'], [11, 11, 'o']], null);
  T.floor_nave_b = stoneFloor('h', 'w', [[6, 3, 'y'], [2, 10, 'o']], [8, 12, 4]);
  T.floor_nave_c = stoneFloor('w', 'y', [[9, 6, 'h'], [1, 2, 'o']], [4, 9, 5]);
  T.floor_parquet = parquetFloor('o', 'y', 'd');
  T.floor_parquet_b = parquetFloor('y', 'o', 'd');
  T.floor_parquet_c = parquetFloor('o', 'w', 'r');
  T.floor_sand = sandFloor([[2, 3, 'o'], [7, 6, 'w'], [12, 4, 'o'], [5, 11, 'o'], [10, 9, 'w'], [14, 13, 'd']]);
  T.floor_sand_b = sandFloor([[4, 2, 'd'], [9, 7, 'o'], [1, 10, 'w'], [13, 5, 'o'], [6, 14, 'd']]);
  T.floor_sand_c = sandFloor([[8, 1, 'w'], [3, 8, 'o'], [11, 12, 'd'], [15, 6, 'o'], [6, 4, 'y']]);
  T.floor_room = woodFloor('o', 'd', [2, 7, 12], [[5, 1], [1, 8], [10, 6]], [[8, 4, 'y'], [3, 12, 'p']]);
  T.floor_room_b = woodFloor('d', 'o', [0, 6, 11], [[7, 2], [13, 8]], [[4, 5, 'p'], [9, 12, 'y']]);
  T.floor_room_c = woodFloor('o', 'p', [1, 8, 14], [[3, 2], [11, 7], [6, 11]], [[12, 4, 'd'], [2, 9, 'y']]);
  T.floor_shop = shopFloor('w', null);
  T.floor_shop_b = shopFloor('s', 'c');
  T.floor_shop_c = shopFloor('h', 'b');
  T.floor_mezz = carpetFloor('p', 'm', [[4, 6, 'r'], [11, 10, 'w']]);
  T.floor_mezz_b = carpetFloor('m', 'p', [[2, 4, 'y'], [9, 12, 'r']]);
  T.floor_mezz_c = carpetFloor('p', 'r', [[7, 3, 'w'], [13, 8, 'm']]);
  T.wall_hangar = wallTop('b', 'n', [[2, 5, 'h'], [8, 8, 's'], [13, 4, 'h']]);
  T.wall_hangar_face = wallFace('b', 'n', 'm', [[4, 7, 'h']], null);
  T.wall_hangar_win = wallFace('b', 'n', 'm', [], [2, 2, 12, 6, 'n', 's']);
  T.wall_band = wallTop('n', 'b', [[4, 6, 'c'], [11, 9, 'c']]);
  T.wall_band_face = mkTile(g => { px(g, PAL.n, 0, 0, 16, 16); px(g, PAL.c, 0, 4, 16, 5); px(g, PAL.s, 0, 5, 16, 1); px(g, PAL.d, 0, 13, 16, 1); px(g, PAL.b, 0, 14, 16, 2); });
  T.wall_band_win = mkTile(g => { px(g, PAL.n, 0, 0, 16, 16); px(g, PAL.c, 0, 3, 16, 7); px(g, PAL.s, 1, 4, 6, 2); px(g, PAL.w, 9, 4, 4, 2); px(g, PAL.d, 0, 13, 16, 1); px(g, PAL.b, 0, 14, 16, 2); });
  T.wall_olive = wallTop('t', 'd', [[3, 6, 'g'], [10, 9, 'l']]);
  T.wall_olive_face = wallFace('t', 'g', 'd', [[6, 6, 'l']], null);
  T.wall_olive_win = wallFace('t', 'g', 'd', [], [4, 2, 8, 7, 'd', 'y']);
  T.wall_boat = wallTop('b', 'c', [[2, 6, 's'], [9, 10, 't']]);
  T.wall_boat_face = wallFace('c', 'b', 'd', [[5, 7, 's']], null);
  T.wall_boat_win = wallFace('c', 'b', 'd', [], [3, 3, 10, 6, 'd', 's']);
  T.wall_chalk = wallTop('y', 'o', [[4, 5, 'w'], [11, 9, 'n']]);
  T.wall_chalk_face = wallFace('y', 'o', 'n', [[6, 6, 'w']], null);
  T.wall_chalk_win = wallFace('y', 'o', 'n', [], [4, 2, 8, 6, 'n', 'w']);
  T.wall_vault = wallTop('w', 'h', [[3, 6, 'y'], [10, 8, 'm']]);
  T.wall_vault_face = wallFace('w', 'h', 'y', [[5, 7, 'm'], [11, 5, 'm']], null);
  T.wall_vault_win = wallFace('w', 'h', 'y', [], [5, 2, 6, 8, 'm', 'c']);
  T.wall_arch = wallTop('w', 'r', [[2, 6, 'o'], [9, 10, 'r']]);
  T.wall_arch_face = wallFace('w', 'r', 'r', [[6, 6, 'o']], null);
  T.wall_arch_win = wallFace('w', 'r', 'r', [], [3, 3, 10, 5, 'r', 'y']);
  T.wall_teal = wallTop('w', 'c', [[4, 5, 'l'], [11, 9, 's']]);
  T.wall_teal_face = wallFace('w', 'c', 'l', [[7, 6, 's']], null);
  T.wall_teal_win = wallFace('w', 'c', 'l', [], [4, 1, 8, 9, 'c', 's']);
  T.wall_sage = wallTop('D', 't', [[4, 5, 'E'], [11, 9, 'C']]);
  T.wall_sage_face = wainFace('D', 't', 't', 'E', [[7, 6, 'C']], null);
  T.wall_sage_win = wainFace('D', 't', 't', 'E', [], [4, 1, 8, 8, 't', 'y']);
  T.wall_chapel = wallTop('w', 'y', [[3, 6, 'o'], [12, 8, 'h']]);
  T.wall_chapel_face = wallFace('w', 'y', 'o', [[6, 7, 'h']], null);
  T.wall_chapel_win = wallFace('w', 'y', 'o', [], [6, 1, 4, 10, 'o', 'y']);
  T.wall_civic = wallTop('b', 'n', [[2, 6, 'y'], [8, 9, 'c'], [13, 5, 's']]);
  T.wall_civic_face = wallFace('b', 'n', 'y', [[5, 6, 'c']], null);
  T.wall_civic_win = wallFace('b', 'n', 'y', [], [3, 2, 10, 6, 'n', 's']);
  T.wall_drum = wallTop('r', 'o', [[2, 5, 'o'], [8, 8, 'd'], [13, 4, 'o']]);
  T.wall_drum_face = mkTile(g => { px(g, PAL.r, 0, 0, 16, 16); px(g, PAL.o, 0, 2, 16, 1); px(g, PAL.o, 0, 6, 16, 1); px(g, PAL.o, 0, 10, 16, 1); px(g, PAL.d, 2, 4, 3, 2); px(g, PAL.d, 11, 8, 3, 2); px(g, PAL.o, 0, 13, 16, 1); px(g, PAL.d, 0, 14, 16, 2); });
  T.wall_drum_win = mkTile(g => { px(g, PAL.r, 0, 0, 16, 16); px(g, PAL.o, 4, 2, 8, 8); px(g, PAL.y, 5, 3, 6, 6); px(g, PAL.w, 6, 4, 2, 2); px(g, PAL.o, 0, 13, 16, 1); px(g, PAL.d, 0, 14, 16, 2); });
  T.wall_peach = wallTop('p', 'm', [[4, 6, 'o'], [11, 9, 'w']]);
  T.wall_peach_face = wallFace('p', 'm', 'o', [[6, 7, 'w']], null);
  T.wall_peach_win = wallFace('p', 'm', 'o', [], [4, 3, 8, 6, 'o', 'y']);
  T.wall_glass = wallTop('s', 'c', [[3, 6, 'w'], [10, 10, 'b']]);
  T.wall_glass_face = mkTile(g => { px(g, PAL.c, 0, 0, 16, 13); px(g, PAL.s, 1, 1, 6, 8); px(g, PAL.w, 2, 2, 3, 3); px(g, PAL.b, 9, 1, 6, 8); px(g, PAL.s, 10, 2, 3, 3); px(g, PAL.m, 0, 13, 16, 1); px(g, PAL.h, 0, 14, 16, 2); });
  T.wall_glass_win = mkTile(g => { px(g, PAL.s, 0, 0, 16, 13); px(g, PAL.w, 2, 2, 5, 6); px(g, PAL.c, 9, 2, 5, 6); px(g, PAL.b, 0, 13, 16, 1); px(g, PAL.w, 0, 14, 16, 2); });
  T.wall_awning = wallTop('w', 'r', [[0, 6, 'y'], [0, 10, 'b']]);
  T.wall_awning_face = mkTile(g => { px(g, PAL.w, 0, 0, 16, 16); px(g, PAL.r, 0, 0, 16, 3); px(g, PAL.y, 0, 3, 16, 3); px(g, PAL.b, 0, 6, 16, 3); px(g, PAL.w, 0, 9, 16, 4); px(g, PAL.m, 0, 13, 16, 1); px(g, PAL.d, 0, 14, 16, 2); });
  T.wall_awning_win = mkTile(g => { px(g, PAL.w, 0, 0, 16, 16); px(g, PAL.r, 0, 0, 16, 2); px(g, PAL.y, 0, 2, 16, 2); px(g, PAL.b, 0, 4, 16, 2); px(g, PAL.n, 4, 7, 8, 5); px(g, PAL.c, 5, 8, 6, 3); px(g, PAL.d, 0, 13, 16, 1); px(g, PAL.o, 0, 14, 16, 2); });
  T.wall_mark = mkTile(g => { px(g, PAL.d, 0, 0, 16, 16); px(g, PAL.y, 0, 0, 16, 3); px(g, PAL.g, 0, 3, 16, 2); px(g, PAL.m, 3, 7, 10, 4); px(g, PAL.h, 5, 8, 6, 2); px(g, PAL.y, 0, 13, 16, 1); px(g, PAL.g, 0, 14, 16, 2); });
  T.mat_pad = doormat('h', 'y');
  T.mat_deck = doormat('n', 'c');
  T.mat_bunk = doormat('t', 'g');
  T.mat_dock = doormat('b', 'c');
  T.mat_lesson = doormat('y', 'w');
  T.mat_marble = doormat('h', 'w');
  T.mat_court = doormat('r', 'w');
  T.mat_clinic = doormat('c', 'w');
  T.mat_clinic_warm = doormat('t', 'C');
  T.mat_nave = doormat('p', 'y');
  T.mat_parquet = doormat('b', 'y');
  T.mat_sand = doormat('o', 'y');
  T.mat_room = doormat('p', 'o');
  T.mat_shop = doormat('w', 'c');
  T.mat_mezz = doormat('p', 'r');
  T.rug_nave = mkTile(g => { px(g, PAL.p, 0, 0, 16, 16); px(g, PAL.r, 2, 0, 12, 16); px(g, PAL.y, 4, 0, 2, 16); px(g, PAL.y, 10, 0, 2, 16); });
  T.rug_room = rug('b', 'c', 'w');
  T.pad_stripe = mkTile(g => { px(g, PAL.y, 0, 7, 16, 2); px(g, PAL.o, 0, 6, 16, 1); });
  T.court_stripe = mkTile(g => { px(g, PAL.w, 0, 7, 16, 2); });
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
  // Observatory interior. The cap is wall_obs_dome: TILES.wall_obs is the outdoor wall and must stay that tile.
  function obsFloor(extra){
    return mkTile(g => {
      px(g, PAL.P, 0, 0, 16, 16);
      px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.F, 0, 8, 16, 1);
      px(g, PAL.F, 5, 8, 1, 8); px(g, PAL.F, 11, 0, 1, 8);
      if (extra) extra(g);
    });
  }
  function obsFace(win){
    return mkTile(g => {
      px(g, PAL.n, 0, 0, 16, 16);
      [0, 8, 15].forEach(x => px(g, PAL.G, x, 0, 1, 9));
      px(g, PAL.C, 4, 3); px(g, PAL.y, 11, 6);
      px(g, PAL.G, 0, 9, 16, 1);
      px(g, PAL.F, 0, 10, 16, 6);
      px(g, PAL.B, 4, 10, 1, 5); px(g, PAL.B, 12, 10, 1, 5);
      px(g, PAL.k, 0, 15, 16, 1);
      if (win) { px(g, PAL.G, 5, 1, 6, 7); px(g, PAL.n, 6, 2, 4, 5); px(g, PAL.C, 7, 3); px(g, PAL.y, 8, 4); }
    });
  }
  T.wall_obs_dome = mkTile(g => {
    px(g, PAL.n, 0, 0, 16, 16); px(g, PAL.G, 0, 0, 16, 2); px(g, PAL.G, 7, 2, 2, 14);
    px(g, PAL.C, 3, 6); px(g, PAL.y, 12, 10);
  });
  T.wall_obs_face = obsFace(false);
  T.wall_obs_win = obsFace(true);
  T.floor_obs = obsFloor(null);
  T.floor_obs_b = obsFloor(g => { px(g, PAL.G, 3, 4); px(g, PAL.C, 12, 12); });
  T.floor_obs_c = obsFloor(g => { px(g, PAL.G, 9, 3, 3, 1); px(g, PAL.G, 10, 2, 1, 3); });
  T.star_tick_brass = mkTile(g => { px(g, PAL.G, 2, 8, 12, 1); px(g, PAL.G, 7, 4, 1, 9); px(g, PAL.C, 7, 8); });
  T.wall_shadow_obs = mkTile(g => { px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.G, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.F, x, 2, 1, 1); });
  T.window_light_obs = mkTile(g => { px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.G, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.F, x, 2, 1, 1); px(g, PAL.y, 4, 6, 8, 5); px(g, PAL.C, 6, 7, 4, 3); });
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
  // B8 Fernbrook rooms. New tile names only. Palette keys A–K and P stay as written above.
  // Wide cream boards: one soft seam and one short joint. Not the four-course brick pile.
  function orchardPlank(seam, joint, grain){
    return mkTile(g => {
      px(g, PAL.C, 0, 0, 16, 16);
      px(g, PAL.A, 0, seam, 16, 1);
      px(g, PAL.G, joint[0], joint[1], 1, joint[2]);
      px(g, PAL.G, grain[0], grain[1], 2, 1);
    });
  }
  T.floor_orchard = orchardPlank(8, [4, 1, 6], [11, 4]);
  T.floor_orchard_b = orchardPlank(8, [12, 9, 6], [2, 12]);
  T.floor_orchard_c = orchardPlank(7, [7, 0, 6], [3, 11]);
  T.hearth_orchard = mkTile(g => {
    px(g, PAL.C, 0, 0, 16, 16); px(g, PAL.A, 0, 8, 16, 1); px(g, PAL.G, 5, 12, 2, 1);
    px(g, PAL.B, 1, 0, 6, 3); px(g, PAL.F, 7, 0, 1, 3); px(g, PAL.B, 8, 0, 7, 3); px(g, PAL.F, 0, 3, 16, 1);
  });
  T.runner_orchard = mkTile(g => {
    px(g, PAL.C, 0, 0, 16, 16); px(g, PAL.A, 0, 8, 16, 1);
    px(g, PAL.l, 5, 0, 6, 16); px(g, PAL.g, 5, 0, 1, 16); px(g, PAL.g, 10, 0, 1, 16);
    px(g, PAL.o, 7, 4, 2, 5); px(g, PAL.C, 7, 11, 2, 2);
  });
  T.wall_orchard = wallTop('A', 'F', [[3, 6, 'g'], [8, 9, 'r'], [12, 5, 'E']]);
  T.wall_orchard_b = wallTop('A', 'F', [[5, 8, 'g'], [11, 4, 'B'], [2, 11, 'r']]);
  T.wall_orchard_c = wallTop('A', 'E', [[7, 6, 'g'], [13, 10, 'F'], [1, 4, 'r']]);
  T.wall_orchard_face = mkTile(g => {
    px(g, PAL.A, 0, 0, 16, 16); px(g, PAL.F, 0, 0, 2, 13); px(g, PAL.F, 14, 0, 2, 13); px(g, PAL.F, 0, 0, 16, 2);
    px(g, PAL.g, 6, 5, 1, 3); px(g, PAL.r, 7, 4, 1, 1); px(g, PAL.g, 8, 6, 1, 2);
    px(g, PAL.E, 0, 13, 16, 1); px(g, PAL.g, 0, 14, 16, 2);
  });
  T.wall_orchard_win = mkTile(g => {
    px(g, PAL.A, 0, 0, 16, 16); px(g, PAL.F, 0, 0, 2, 13); px(g, PAL.F, 14, 0, 2, 13); px(g, PAL.F, 0, 0, 16, 2);
    px(g, PAL.F, 4, 3, 8, 8); px(g, PAL.y, 5, 4, 6, 6); px(g, PAL.C, 6, 5, 3, 3); px(g, PAL.F, 8, 4, 1, 6);
    px(g, PAL.E, 0, 13, 16, 1); px(g, PAL.g, 0, 14, 16, 2);
  });
  T.rug_orchard = rug('g', 'r', 'A');
  T.mat_orchard = doormat('E', 'g');
  T.wall_shadow_orchard = mkTile(g => { px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.E, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.g, x, 2, 1, 1); });
  T.window_light_orchard = mkTile(g => {
    px(g, PAL.F, 0, 0, 16, 1); px(g, PAL.E, 0, 1, 16, 1); for (let x = 0; x < 16; x += 2) px(g, PAL.g, x, 2, 1, 1);
    px(g, PAL.y, 4, 6, 8, 5); px(g, PAL.C, 6, 7, 4, 3);
  });
  T.leaf_orchard = mkTile(g => { px(g, PAL.g, 6, 8, 3, 2); px(g, PAL.E, 8, 9, 2, 1); px(g, PAL.l, 5, 8, 1, 1); });
  T.apple_speck = mkTile(g => { px(g, PAL.r, 9, 10, 2, 2); px(g, PAL.g, 10, 9, 1, 1); });
  function mossFloor(seams, marks){
    return mkTile(g => {
      px(g, PAL.g, 0, 0, 16, 16); px(g, PAL.l, 0, 0, 16, 1);
      seams.forEach(([x, y]) => px(g, PAL.t, x, y, 2, 1));
      specks(g, marks);
    });
  }
  T.floor_moss = mossFloor([[2, 4], [9, 7], [5, 12]], [[4, 6, 'p'], [11, 3, 'l'], [7, 10, 'D'], [13, 13, 'p']]);
  T.floor_moss_b = mossFloor([[1, 3], [8, 9], [12, 14]], [[3, 8, 'p'], [10, 5, 'E'], [6, 13, 'l']]);
  T.floor_moss_c = mossFloor([[4, 2], [11, 8], [2, 13]], [[8, 4, 'p'], [14, 11, 'D'], [5, 9, 'l']]);
  function bloomBed(marks){
    return mkTile(g => {
      px(g, PAL.g, 0, 0, 16, 16);
      px(g, PAL.l, 1, 2, 3, 2); px(g, PAL.p, 2, 1, 1, 1);
      px(g, PAL.r, 8, 4, 2, 2); px(g, PAL.y, 9, 3, 1, 1);
      px(g, PAL.w, 5, 9, 2, 2); px(g, PAL.p, 6, 8, 1, 1);
      px(g, PAL.o, 11, 11, 2, 2); px(g, PAL.y, 12, 10, 1, 1);
      px(g, PAL.E, 3, 12, 1, 2); specks(g, marks);
    });
  }
  T.floor_bloom = bloomBed([]);
  T.floor_bloom_b = bloomBed([[7, 6, 'y'], [2, 11, 'w']]);
  T.floor_bloom_c = bloomBed([[12, 5, 'p'], [4, 8, 'r']]);
  function hedgeBloom(marks){
    return mkTile(g => {
      px(g, PAL.E, 0, 0, 16, 16); px(g, PAL.g, 1, 1, 14, 11); px(g, PAL.l, 2, 2, 4, 3); px(g, PAL.D, 8, 3, 4, 2);
      px(g, PAL.p, 5, 4, 1, 1); px(g, PAL.r, 11, 5, 1, 1); px(g, PAL.F, 0, 13, 16, 3); specks(g, marks);
    });
  }
  T.hedge_bloom = hedgeBloom([]);
  T.hedge_bloom_b = hedgeBloom([[3, 5, 'y'], [10, 2, 'p']]);
  T.hedge_bloom_c = hedgeBloom([[7, 6, 'w'], [12, 4, 'l']]);
  T.wall_bloom = wallTop('C', 'p', [[2, 6, 'p'], [9, 8, 'g'], [13, 4, 'r']]);
  T.wall_bloom_b = wallTop('C', 'D', [[6, 4, 'r'], [13, 7, 'p'], [1, 10, 'g']]);
  T.wall_bloom_c = wallTop('C', 'g', [[4, 9, 'p'], [10, 3, 'y'], [14, 11, 'D']]);
  T.wall_bloom_face = mkTile(g => {
    px(g, PAL.C, 0, 0, 16, 16);
    px(g, PAL.p, 2, 3, 2, 2); px(g, PAL.g, 3, 5, 1, 2); px(g, PAL.r, 10, 4, 2, 2); px(g, PAL.g, 11, 6, 1, 2);
    px(g, PAL.D, 0, 9, 16, 1); px(g, PAL.g, 0, 10, 16, 6); px(g, PAL.E, 0, 15, 16, 1);
  });
  T.wall_bloom_win = mkTile(g => {
    px(g, PAL.C, 0, 0, 16, 16);
    px(g, PAL.p, 1, 2, 1, 1); px(g, PAL.r, 13, 3, 1, 1);
    px(g, PAL.F, 4, 2, 8, 8); px(g, PAL.s, 5, 3, 6, 6); px(g, PAL.w, 6, 4, 2, 2); px(g, PAL.F, 8, 3, 1, 6);
    px(g, PAL.D, 0, 12, 16, 1); px(g, PAL.g, 0, 13, 16, 3);
  });
  T.rug_bloom = rug('C', 'p', 'g');
  T.mat_bloom = doormat('p', 'C');
  T.wall_shadow_bloom = mkTile(g => { px(g, PAL.E, 0, 0, 16, 1); px(g, PAL.D, 0, 1, 16, 1); for (let x = 1; x < 16; x += 3) px(g, PAL.p, x, 2, 1, 1); });
  T.window_light_bloom = mkTile(g => {
    px(g, PAL.E, 0, 0, 16, 1); px(g, PAL.D, 0, 1, 16, 1); for (let x = 1; x < 16; x += 3) px(g, PAL.p, x, 2, 1, 1);
    px(g, PAL.y, 3, 5, 10, 6); px(g, PAL.w, 5, 6, 5, 3);
  });
  T.petal_scatter = mkTile(g => { px(g, PAL.p, 4, 7, 1, 1); px(g, PAL.r, 8, 10, 1, 1); px(g, PAL.w, 11, 6, 1, 1); });
  T.leaf_scatter = mkTile(g => { px(g, PAL.g, 6, 9, 2, 1); px(g, PAL.l, 9, 8, 1, 1); px(g, PAL.E, 7, 10, 1, 1); });
  // D87 tunnel skin. Rock, not house planks. The puddle decal is only the wet pixels on tunnel_floor.
  const TUNNEL_TILES = {
    tunnel_floor: ['hhhmhhhmmmmmmhhh','hhhmwhhhmmmmmmhh','hhhmhhhmmmmmmhhh','hhhmdddddmmmmhhh','mmmmmmmmmmmmmmmm','mmmwwmmmmmmmdmmm','mmmhhmmmmmmmdmhh','mmmhhmmmmmmmdmhh','ddddhhmmmmmmmmhh','mmmmmmmmmmmmdmhh','mmmmhhmmmmmmdmmm','mmmmhhmmmmmmmmmm','wwmmhhdddddmmmmm','mmmmhhmmmmmmmmmm','mmmmhhmmmmmmwwmm','mmmmhhmmmmmmmmmm'],
    tunnel_floor_b: ['mhhmwmmhhmmwmmhm','mhhmmmmhhmmmmmhm','mmmmddmmmmmmddmm','wmmmmmmmmwmmmmmm','mmhhmmmmmmhhmmwm','mmhhmmmmmmhhmmmm','mmmmmmddmmmmmmmm','mmwmmmmmmmmhhmmm','mmmmmmmmmmhhmmwm','ddmmmmwmmmmmddmm','mmmmhhmmmmmmmmmm','wmmmhhmmmmwmmmmm','mmmmmmmmmmmmhhmm','mmmmmmddmmmmhhmm','wmmmmmmmmmmmmmhm','mmhhmmwmmmmmhhmw'],
    tunnel_floor_c: ['nnntnnnntttttnnn','nnntwnnnttttttnn','nnntnnnntttttnnn','nnntdddddttttnnn','tttttttttttttttt','tttwwtttttttdttt','ttthhtttttttnthh','ttthhtttttttnthh','ddddhhttttttttnn','ttttttttttttdtnn','tttthhttttttdttt','tttthhtttttttttt','sstthhdddddttttt','tttthhtttttttttt','tttthhttttttsstt','tttthhtttttttttt'],
    tunnel_wall: ['ddddnnddddddnndd','dmmmmndmmmmmndmd','dmhhhmndmhhhmdnd','dmhhhmndmhhhmndd','dmmmmnddmmmmnndd','nnnnndddddddnnnn','ddmmmmmmddmmmmdd','dmhhhhmmdmhhhhmd','dmhhhhmmdmhhhhmd','ddmmmmmmdmmmmmdd','nnnnnnnnnnnnnnnn','ddmmmmddmmmmmmdd','dmhhmmddmhhhhmdd','dmhhmmddmhhhhmdd','ddmmmmddmmmmmmdd','nnnnddddddddnnnn'],
    tunnel_wall_b: ['nnnnndddddddnnnn','ndmmmmmmddmmmmdn','ndmhhhhmmdmhhhdn','ndmhhhhmmdmhhhdn','ndmmmmmmddmmmmdn','nnnnnnnnnnnnnnnn','ddmmmmmmmmmmmmdd','dmhhhmmmmmmhhhmd','dmhhnmmmmmmnhhmd','dmhhhmmmmmmhhhmd','ddmmmmmmmmmmmmdd','nnndddddddddnnnn','dmmmmmmmmmmmmmmd','dmhhhhhhhhhhhhmd','dmmmmmmmmmmmmmmd','dddddddddddddddd'],
    tunnel_wall_c: ['dddddddddddddddd','dmmmmmdmmmmmdmmd','dmhhgmdmhhgmdmmd','dmhhgmdmhhgmdmmd','dmmmmmdmmmmmdmmd','dddddddddddddddd','nddmmmmmmmddmmmn','nmdmhhhhhmmdmmmn','nmdmhhhhhmmdmmmn','nddmmmmmmmddmmmn','nnnnnnnnnnnnnnnn','ddmmmmmmmmmmmmdd','dmhhhhmddmhhhhmd','dmhhhhmddmhhhhmd','ddmmmmmddmmmmmdd','nnnnnnnnnnnnnnnn'],
    tunnel_wall_face: ['mmmmmmmmmmmmmmmm','mhhhmmmmmmhhmmmm','mhhhmmmmmmhhmmmm','mmmmmmmmmmmmmmmm','mmmnnmmmmmmmmmmm','mmmnnmmmmmmmmwww','mmmmmmmmmmmmmmmm','mmhhmmmmmmmmmmmm','mmhhmmmmmmmmmmmm','mmmmmmmmmmhhmmmm','mmmmmmmmmmhhmmmm','mmmmmmmmmmmmmmmm','mmmmmmwmmmmmmmmm','mmmmmmmmmmmmmmmm','hhhhhhhhhhhhhhhh','dddddddddddddddd'],
    tunnel_wall_face_b: ['mmmmmmmmmmmmmmmm','mhhmmmmmmmmhhmmm','mhhmmmmmmmmhhmmm','mmmmmmmmmmmmmmmm','mmmmmmnnnnmmmmmm','mmmmmmnnnnmmmmmm','wwmmmmnnnnmmmmmm','mmmmmmnnnnmmmmmm','mmmmmmmmmmmmmmmm','mmhhmmmmmmmmhhmm','mmhhmmmmmmmmhhmm','mmmmmmmmmmmmmmmm','mmmmmmmmmmwmmmmm','mmmmmmmmmmmmmmmm','hhhhhhhhhhhhhhhh','dddddddddddddddd'],
    tunnel_wall_face_c: ['mmmmmmmmmmmmmmmm','mhhmmmmmmmmhhmmm','mhhmmmmmmmmhhmmm','mmmmmmmmmmmmmmmm','mmmmmmmmnnmmmmmm','mmmmmmmmnnmmmmmm','wwmmmmmmnnmmmmmm','mmmmmmmmnnmmmmmm','mmmmmmmmmmmmmmmm','mmmmhhmmmmmmmmmm','mmmmhhmmmmmmmmmm','mmmmmmmmmmmmmmmm','mmmmmmmmmmwmmmmm','mmmmmmmmmmmmmmmm','hhhhhhhhhhhhhhhh','dddddddddddddddd'],
    tunnel_mat: ['mmmmmmmmmmmmmmmm','mnnnnnnnnnnnnnnm','mnmmmmmmmmmmmmnm','mnmhhhhhhhhhhmnm','mnmhwwwwwwwwwhnm','mnmhhhhhhhhhhmnm','mnmhhhhhhhhhhmnm','mnmhddddddddhhnm','mnmhhhhhhhhhhmnm','mnmhwwwwwwwwwhnm','mnmhhhhhhhhhhmnm','mnmmmmmmmmmmmmnm','mnnnnnnnnnnnnnnm','mmmmmmmmmmmmmmmm','mmmmmmmmmmmmmmmm','dddddddddddddddd'],
    tunnel_rug: ['rprrrprrrprrrprr','prrrprrrprrrprrr','rrprrrprrrprrrpr','rprrrprrrprrrprr','prrrprrrprrrprrr','rrprrrprrrprrrpr','rprrrprrrprrrprr','prrrprrrprrrprrr','rrprrrprrrprrrpr','rprrrprrrprrrprr','prrrprrrprrrprrr','rrprrrprrrprrrpr','rprrrprrrprrrprr','prrrprrrprrrprrr','rrprrrprrrprrrpr','rprrrprrrprrrprr'],
    tunnel_sky: ['cccccccccccccccc','ccsssssccccccccc','cssssssscccccccc','cssssssssccccccc','ccsssssssccccccc','cccscssccccccccc','cccccccccccccccc','ccccccccccsssscc','cccccccccssssssc','cccccccccssssssc','ccccccccccsssscc','cccccccccccccccc','ccsssssssscccccc','cssssssssscccccc','ccsssssssscccccc','cccccccccccccccc'],
  };
  const puddle = TUNNEL_TILES.tunnel_floor.map(r => r.split(''));
  [[6,5,'n'],[7,5,'n'],[8,5,'t'],[5,6,'n'],[6,6,'t'],[7,6,'t'],[8,6,'b'],[9,6,'n'],[5,7,'n'],[6,7,'b'],[7,7,'s'],[8,7,'t'],[9,7,'n'],[6,8,'n'],[7,8,'t'],[8,8,'t'],[9,8,'n'],[7,9,'n'],[8,9,'t']].forEach(([x, y, ch]) => { puddle[y][x] = ch; });
  TUNNEL_TILES.tunnel_puddle = puddle.map(r => r.join(''));
  const paintGrid = (g, rows) => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); }));
  for (const [k, rows] of Object.entries(TUNNEL_TILES)) T[k] = mkTile(g => paintGrid(g, rows));
  for (const k of ['tunnel_sky', 'tunnel_puddle']) {
    const rows = TUNNEL_TILES[k], base = TUNNEL_TILES.tunnel_floor;
    T[k + '_decal'] = mkTile(g => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.' && ch !== base[y][x]) px(g, PAL[ch], x, y); })));
  }
  // FLOOR_FIX: paint the calm floors the same way as addExteriorArt (PAL key to px). Old names stay.
  for (const [k, rows] of Object.entries(FLOOR_FIX_TILES)) if (!T[k]) T[k] = mkTile(g => paintGrid(g, rows));
  return T;
}
// World sprites (MAPS_SLICE §2/§4 doors, signs, props, pickups; INTERIORS §2.2 furniture), 16x16, PAL only.
const LAB_SKIN = {"remap":{"#":"lab_wall","W":"lab_wall_face","W2":"lab_wall_win",".":"lab_floor","=":"lab_runner","m":"lab_mat","V":"lab_wall_win","L":"lab_door_locked",",":"lab_floor_scuff","~":"lab_floor_cable","o":"lab_floor_drain","|":"lab_guide_v","-":"lab_guide_h","+":"lab_guide_x","x":"lab_hazard","D":"lab_dais","g":"lab_glass","i":"lab_inlay_mint","b":"lab_stripe_blue","y":"lab_stripe_amber","n":"lab_wall_panel","^":"lab_stair"},"override":{"rx_f2":{".":"lab_floor_focus"},"rx_f3":{".":"lab_floor_records"},"rx_f4":{".":"lab_floor_bay"}},"walk":{"V":0,"L":0,",":1,"~":1,"o":1,"|":1,"-":1,"+":1,"x":0,"D":1,"g":0,"i":1,"b":1,"y":1,"n":0,"^":1},"decal":{"~":"lab_floor_cable","o":"lab_floor_drain","|":"lab_guide_v","-":"lab_guide_h","+":"lab_guide_x"},"variants":{"lab_floor_bay":[["lab_floor_scuff",0.14]],"lab_floor":[["lab_floor_scuff",0.14],["lab_floor_glint",0.12],["lab_floor_stain",0.10]],"lab_floor_focus":[["lab_focus_scuff",0.18],["lab_focus_glint",0.16]],"lab_floor_records":[["lab_records_scuff",0.18],["lab_records_glint",0.16]]},"wall":{"c":"h","C":"w","L":"m","f":"w","F":"h","T":"l","B":"d","S":"m","R":"m","G":"c","W":"s","D":"h"}};   // FERNBROOK_HEIGHTS §3: house char -> lab tile, plus per-map overrides. wall is the shared kit (INTERIOR_WALLS).
// B5. One skin per room: floor, wall face, baseboard. `v` is the wall-shadow decal, `u` the window light (it carries the same shadow band).
// A later batch can add a skin with SKINS.tunnel = TUNNEL_SKIN or SKINS[name] = HOUSE_SKINS[name] = { remap, decal, walk, variants }.
const houseVar = (base, b, c) => ({ [base]: [[b, 0.18], [c, 0.16]] });
// INTERIOR_WALLS role order: c cap, C highlight, L lip, f face, F face shade, T trim, B baseboard, S shadow, R frame, G glass, W shine, D door.
const wallRow = s => ({ c: s[0], C: s[1], L: s[2], f: s[3], F: s[4], T: s[5], B: s[6], S: s[7], R: s[8], G: s[9], W: s[10], D: s[11] });
// B6. New keys only. `Y` is the shared keeper pilaster. `j` is that room's floor scuff. `q` is a painted line where the skin asks for one.
const hcSkin = (floor, wall, mat, extra) => {
  extra = extra || {};
  const weights = extra.weights || [0.18, 0.16];
  const skin = {
    remap: Object.assign({ '#': wall, Y: 'wall_mark', W: wall + '_face', W2: wall + '_win', '.': floor, m: mat, j: floor + '_b' }, extra.remap || {}),
    decal: Object.assign({ v: 'wall_shadow', u: 'window_light' }, extra.decal || {}),
    walk: Object.assign({ v: 1, u: 1, j: 1, Y: 0 }, extra.walk || {}),
    variants: { [floor]: [[floor + '_b', weights[0]], [floor + '_c', weights[1]]] },
  };
  if (extra.wall) skin.wall = extra.wall;
  return skin;
};
// FLOOR_FIX variant weights (D184-D186). The main tile covers about 60% of plain floor cells.
const floorFixVar = name => ({ [name]: [[name + '_b', 0.22], [name + '_c', 0.18]] });
const HOUSE_SKINS = {
  // D153: one role table per skin. Cap differs from the face. Every interior skin opts in; the old wall tiles stay for exteriors.
  house_home: { remap: { '#':'wall_plaster', W:'wall_plaster_face', W2:'wall_plaster_win', '.':'floor_pine', '=':'rug_rag', m:'mat_home', '^':'stair_home' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: floorFixVar('floor_pine'), wall: { c:'G', C:'y', L:'F', f:'w', F:'h', T:'G', B:'B', S:'F', R:'G', G:'c', W:'s', D:'B' } },
  house_loft: { remap: { '#':'wall_cream', W:'wall_cream_face', W2:'wall_cream_win', '.':'floor_loft', '=':'rug_loft', m:'mat_loft', '^':'stair_loft' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: floorFixVar('floor_loft'), wall: wallRow('GyFCGoFFocsF') },
  house_lodge: { remap: { '#':'wall_warden', W:'wall_warden_face', W2:'wall_warden_win', '.':'floor_wardstone', '=':'rug_warden', m:'mat_warden' }, decal: { v:'wall_shadow_warden', u:'window_light_warden' }, walk: { v:1, u:1 }, variants: floorFixVar('floor_wardstone'), wall: wallRow('FGdCIJJFJcsF') },
  house_lantern: { remap: { '#':'wall_lantern', W:'wall_lantern_face', W2:'wall_lantern_win', '.':'floor_lantern', '=':'rug_lantern', m:'mat_lantern_warm' }, decal: { v:'wall_shadow_warm', u:'window_light_warm' }, walk: { v:1, u:1 }, variants: houseVar('floor_lantern', 'floor_lantern_b', 'floor_lantern_c'), wall: wallRow('BGFCDEEFEswF') },
  house_rook: { remap: { '#':'wall_rose', W:'wall_rose_face', W2:'wall_rose_win', '.':'floor_calloway', '=':'rug_calloway', m:'mat_calloway' }, decal: { v:'wall_shadow_rose', u:'window_light_rose' }, walk: { v:1, u:1 }, variants: floorFixVar('floor_calloway'), wall: wallRow('BHFHBGFFGcsF') },
  // Both Keeper House floors share this skin (D149). The old stone and ink tiles stay defined for anything that still names them.
  house_hq: { remap: { '#':'wall_keep', W:'wall_keep_face', W2:'wall_keep_win', '.':'floor_keep', '=':'rug_keep', m:'mat_keep', ',':'floor_keep_tile', ';':'floor_keep_ops', i:'floor_keep_carpet' }, decal: { v:'wall_shadow_keep', u:'window_light_keep' }, walk: { v:1, u:1, ',':1, ';':1, i:1 }, variants: houseVar('floor_keep', 'floor_keep_b', 'floor_keep_c'), wall: wallRow('nydCGynnncsn') },
  house_hq_up: { remap: { '#':'wall_keep', W:'wall_keep_face', W2:'wall_keep_win', '.':'floor_keep', '=':'rug_keep', m:'mat_keep', ',':'floor_keep_tile', ';':'floor_keep_ops', i:'floor_keep_carpet' }, decal: { v:'wall_shadow_keep', u:'window_light_keep' }, walk: { v:1, u:1, ',':1, ';':1, i:1 }, variants: houseVar('floor_keep', 'floor_keep_b', 'floor_keep_c'), wall: wallRow('nydCGynnncsn') },
  house_cc_lantern: { remap: { '#':'wall_rough', W:'wall_rough_face', W2:'wall_rough_win', '.':'floor_clay', '=':'rug_cobble', m:'mat_cobble' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: floorFixVar('floor_clay'), wall: wallRow('mhdnmhmnmcsF') },
  house_hall: { remap: { '#':'wall_slate', W:'wall_slate_face', W2:'wall_slate_win', '.':'floor_civic', ':':'floor_civic', i:'floor_slab', '=':'rug_hall', m:'mat_hall' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1, i:1 }, variants: floorFixVar('floor_civic'), wall: wallRow('hwdmdhdndcsn') },
  hc_airport: hcSkin('floor_pad', 'wall_hangar', 'mat_pad', { decal: { q: 'pad_stripe' }, walk: { q: 1 }, wall: wallRow('nhdbnhmdnswn') }),
  hc_command: hcSkin('floor_deck', 'wall_band', 'mat_deck', { wall: wallRow('bcdndcbddswd') }),
  hc_barracks: hcSkin('floor_drill', 'wall_olive', 'mat_bunk', { weights: [0.22, 0.18], wall: wallRow('dlntdgddmcsd') }),
  hc_marina: hcSkin('floor_boardwalk', 'wall_boat', 'mat_dock', { weights: [0.22, 0.18], wall: wallRow('bsncbsdnwswn') }),
  hc_school: hcSkin('floor_lino', 'wall_chalk', 'mat_lesson', { weights: [0.22, 0.18], wall: wallRow('oyFyGonFncwG') }),
  hc_bank: hcSkin('floor_marble', 'wall_vault', 'mat_marble', { wall: wallRow('hwmwhymmycsy') }),
  hc_gym: hcSkin('floor_sport', 'wall_arch', 'mat_court', { weights: [0.22, 0.18], decal: { q: 'court_stripe' }, walk: { q: 1 }, wall: wallRow('rowhorrmrcsp') }),
  hc_lantern: hcSkin('floor_clinic_warm', 'wall_sage', 'mat_clinic_warm', { decal: { v: 'wall_shadow_warm', u: 'window_light_warm' }, wall: wallRow('EDFDEtEFtswF') }),
  hc_church: hcSkin('floor_nave', 'wall_chapel', 'mat_nave', { remap: { '=': 'rug_nave' }, wall: wallRow('ywGwhoGFGcsB') }),
  hc_hall: hcSkin('floor_ballroom', 'wall_civic', 'mat_parquet', { weights: [0.22, 0.18], wall: wallRow('nbdbnyndycsn') }),
  hc_arena: hcSkin('floor_sand', 'wall_drum', 'mat_sand', { wall: wallRow('oyprpodpoywp') }),
  hc_apt: hcSkin('floor_pile', 'wall_peach', 'mat_room', { weights: [0.22, 0.18], remap: { '=': 'rug_room' }, wall: wallRow('mhdpdomdocsm') }),
  hc_mall: hcSkin('floor_shop', 'wall_glass', 'mat_shop', { wall: wallRow('swbcbwmmbswh') }),
  hc_mall_up: hcSkin('floor_mezz', 'wall_awning', 'mat_mezz', { wall: wallRow('rypwhbdmncsr') }),
  // B7. Observatory and the three dream rooms. `u` and `v` stay the shared window light and wall shadow.
  obs: { remap: { '#':'wall_obs_dome', W:'wall_obs_face', W2:'wall_obs_win', '.':'floor_dusk', m:'mat_dusk' }, decal: { v:'wall_shadow_obs', u:'window_light_obs', z:'star_tick_brass' }, walk: { v:1, u:1, z:1 }, variants: floorFixVar('floor_dusk'), wall: wallRow('FGdGFyFFynsF') },
  dream_2004: { remap: { '#':'wall_mist', W:'wall_mist_face', W2:'wall_mist_win', '.':'floor_mist', '=':'rug_mem' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: floorFixVar('floor_mist'), wall: wallRow('mhnhmcndmcwb') },
  dream_party: { remap: { '#':'wall_fest', W:'wall_fest_face', W2:'wall_fest_win', '.':'floor_party', p:'floor_lane' }, decal: { v:'wall_shadow', u:'window_light', q:'streamer' }, walk: { v:1, u:1, q:1 }, variants: {}, wall: wallRow('oyryocddrcwr') },
  dream_drive: { remap: { '#':'wall_night', W:'wall_night_face', W2:'wall_night_win', '.':'floor_asphalt' }, decal: { v:'wall_shadow', u:'window_light', j:'lane_paint' }, walk: { v:1, u:1, j:1 }, variants: houseVar('floor_asphalt', 'floor_asphalt_b', 'floor_asphalt_c'), wall: wallRow('mhdndmddmywd') },
  // B8. Fernbrook's two new rooms. Calm cream planks and a moss hall. Neither reuses a lantern, Calloway, Lodge, observatory or Keeper floor.
  fb_lantern: {
    remap: { '#':'wall_orchard', W:'wall_orchard_face', W2:'wall_orchard_win', '.':'floor_orchard', '=':'rug_orchard', m:'mat_orchard', ',':'runner_orchard', h:'hearth_orchard' },
    decal: { v:'wall_shadow_orchard', u:'window_light_orchard', q:'leaf_orchard', j:'apple_speck' },
    walk: { v:1, u:1, q:1, j:1, ',':1, h:1 },
    variants: Object.assign({}, houseVar('floor_orchard', 'floor_orchard_b', 'floor_orchard_c'), houseVar('wall_orchard', 'wall_orchard_b', 'wall_orchard_c')),
    wall: wallRow('GyFAFEgFFcwB'),
  },
  fb_hall: {
    remap: { '#':'wall_bloom', W:'wall_bloom_face', W2:'wall_bloom_win', '.':'floor_moss', ':':'floor_moss', f:'floor_bloom', T:'hedge_bloom', '=':'rug_bloom', m:'mat_bloom' },
    decal: { v:'wall_shadow_bloom', u:'window_light_bloom', q:'petal_scatter', j:'leaf_scatter' },
    walk: { v:1, u:1, q:1, j:1 },
    variants: Object.assign({}, houseVar('floor_moss', 'floor_moss_b', 'floor_moss_c'), houseVar('floor_bloom', 'floor_bloom_b', 'floor_bloom_c'), {
      hedge_bloom: [['hedge_bloom_b', 0.34], ['hedge_bloom_c', 0.33]],
      wall_bloom: [['wall_bloom_b', 0.34], ['wall_bloom_c', 0.33]],
    }),
    wall: wallRow('DCECDpgEEcsJ'),
  }
};
// Shared indoor wall kit (D151). Role letters, not PAL keys. `.` is empty. Mirrors are the other corner, the other side, and the other shadow.
// A skin opts in with `wall` (role -> PAL key). buildWallKit bakes `<skin>__<part>` once.
const WALL_KIT = (() => {
  const mirrorRows = rows => rows.map(r => [...r].reverse().join(''));
  const C16 = 'cccccccccccccccc', F16 = 'ffffffffffffffff', S16 = 'SSSSSSSSSSSSSSSS', Z16 = '................';
  const SIDE_W = 'cccccccccccccCcL';
  const capN = Array(12).fill(C16).concat(['CCCCCCCCCCCCCCCC', C16, 'LLLLLLLLLLLLLLLL', 'LLLLLLLLLLLLLLLL']);
  const capNw = Array(12).fill(C16).concat(['cccccccccccccCCC', 'ccccccccccccccCc', 'ccccccccccccccLL', 'ccccccccccccccLL']);
  const capS = ['LLLLLLLLLLLLLLLL', 'CCCCCCCCCCCCCCCC'].concat(Array(14).fill(C16));
  const capSw = ['ccccccccccccccLL', 'cccccccccccccCCC'].concat(Array(14).fill(SIDE_W));
  const jambL = ['LLLLLLLLLLLLLLLL', 'CCCCCCCCCCCCCCCL'].concat(Array(14).fill('ccccccccccccccCL'));
  // Side-wall door: the lip turns along the gap. West wall; _e is the mirror.
  const jambN = Array(13).fill(SIDE_W).concat(['cccccccccccccCCL', 'ccccccccccccLLLL', 'ccccccccccccLLLL']);
  const jambS = ['ccccccccccccLLLL', 'ccccccccccccLLLL', 'cccccccccccccCCL'].concat(Array(13).fill(SIDE_W));
  const face = ['FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF'].concat(Array(7).fill(F16), ['TTTTTTTTTTTTTTTT'], Array(3).fill(F16), ['BBBBBBBBBBBBBBBB', 'BBBBBBBBBBBBBBBB', 'FFFFFFFFFFFFFFFF']);
  const faceBody = 'FFffffffffffffff';
  const faceL = ['FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF'].concat(Array(7).fill(faceBody), ['FFTTTTTTTTTTTTTT'], Array(3).fill(faceBody), ['FFBBBBBBBBBBBBBB', 'FFBBBBBBBBBBBBBB', 'FFFFFFFFFFFFFFFF']);
  const faceWin = [
    'FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF',
    'fffRRRRRRRRRRfff', 'fffRWWGGRGGGRfff', 'fffRWWGGRGGGRfff', 'fffRGGGGRGGGRfff', 'fffRGGGGRGGGRfff', 'fffRGGGGRGGGRfff', 'fffRGGGGRGGGRfff',
    'TTTRRRRRRRRRRTTT', 'TTCCCCCCCCCCCCTT',
    F16, F16, 'BBBBBBBBBBBBBBBB', 'BBBBBBBBBBBBBBBB', 'FFFFFFFFFFFFFFFF'];
  const faceDoor = [
    'FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF',
    'ffffRRRRRRRRffff', 'ffffRDDDDDDRffff', 'ffffRDDDDDDRffff', 'ffffRDDDDDDRffff', 'ffffRDDDDDDRffff', 'ffffRDDDDDDRffff', 'ffffRDDDDDDRffff',
    'TTTTRDDDDCDRTTTT',
    'ffffRDDDDDDRffff', 'ffffRDDDDDDRffff', 'ffffRDDDDDDRffff',
    'BBBBRDDDDDDRBBBB', 'BBBBRDDDDDDRBBBB', 'FFFFRDDDDDDRFFFF'];
  const shadowN = [S16, 'S.S.S.S.S.S.S.S.'].concat(Array(14).fill(Z16));
  const shadowW = Array(16).fill('S...............');
  const shadowNw = shadowN.map(r => 'S' + r.slice(1));
  const sideW = Array(16).fill(SIDE_W);
  return {
    cap_n: capN, cap_nw: capNw, cap_ne: mirrorRows(capNw),
    cap_s: capS, cap_sw: capSw, cap_se: mirrorRows(capSw),
    side_w: sideW, side_e: mirrorRows(sideW),
    jamb_l: jambL, jamb_r: mirrorRows(jambL),
    jamb_n: jambN, jamb_s: jambS, jamb_n_e: mirrorRows(jambN), jamb_s_e: mirrorRows(jambS),
    face, face_l: faceL, face_r: mirrorRows(faceL), face_win: faceWin, face_door: faceDoor,
    shadow_n: shadowN, shadow_w: shadowW, shadow_e: mirrorRows(shadowW), shadow_nw: shadowNw, shadow_ne: mirrorRows(shadowNw),
  };
})();
function buildWallKit(skinId, wall){
  const out = {};
  for (const [part, rows] of Object.entries(WALL_KIT)) {
    if (rows.length !== 16 || rows.some(r => r.length !== 16)) throw new Error('wall kit grid ' + part);
    out[skinId + '__' + part] = mkTile(g => {
      rows.forEach((row, y) => [...row].forEach((role, x) => {
        if (role === '.') return;
        const key = wall[role];
        if (!key || !PAL[key] || key === 'k') throw new Error('wall kit ' + skinId + ' ' + part + ' role ' + role);
        px(g, PAL[key], x, y);
      }));
    });
  }
  return out;
}
// D87: # wall, W face, . floor. Floor variants are gravel (b) and damp (c). Wall variants use the same mix so a rock row is not one stamp.
// Y is a walkable sky decal (the yard patch). ~ is a walkable drip. = is the den rug. Odd W columns stay the rock face (no house window).
const TUNNEL_SKIN = {"remap":{"#":"tunnel_wall","W":"tunnel_wall_face","W2":"tunnel_wall_face",".":"tunnel_floor","=":"tunnel_rug","m":"tunnel_mat"},"override":{"sm_den":{".":"floor_den"},"sm_hold":{".":"floor_hold"},"sm_tunnel":{".":"floor_rock"},"sm_yard":{".":"floor_yard"}},"walk":{"Y":1,"~":1},"decal":{"Y":"tunnel_sky","~":"tunnel_puddle"},"variants":{"tunnel_floor":[["tunnel_floor_b",0.34],["tunnel_floor_c",0.33]],"floor_den":[["floor_den_b",0.22],["floor_den_c",0.18]],"floor_hold":[["floor_hold_b",0.22],["floor_hold_c",0.18]],"floor_rock":[["floor_rock_b",0.22],["floor_rock_c",0.18]],"floor_yard":[["floor_yard_b",0.22],["floor_yard_c",0.18]],"tunnel_wall":[["tunnel_wall_b",0.34],["tunnel_wall_c",0.33]],"tunnel_wall_face":[["tunnel_wall_face_b",0.34],["tunnel_wall_face_c",0.33]]},"wall":{"c":"d","C":"m","L":"n","f":"m","F":"d","T":"h","B":"n","S":"n","R":"d","G":"n","W":"h","D":"F"}};
const SKINS = Object.assign({ lab: LAB_SKIN, tunnel: TUNNEL_SKIN }, HOUSE_SKINS);
SKINS.school = HOUSE_SKINS.school = {"remap": {"#": "wall_wainscot_t", "W": "wall_wainscot_t_face", "W2": "wall_wainscot_t_win", ":": "floor_school_check", ",": "floor_school_tile", ".": "floor_school_lino", "=": "runner_school", "~": "rug_reading", "m": "mat_school"}, "decal": {}, "walk": {":": 1, ",": 1, "~": 1}, "wall": wallRow('tcnwhtndtcsn')};
SKINS.flats_lobby = HOUSE_SKINS.flats_lobby = {"remap": {"#": "wall_wainscot_n", "W": "wall_wainscot_n_face", "W2": "wall_wainscot_n_win", ",": "floor_lobby_tile", ".": "floor_lobby_terrazzo", "=": "rug_lobby", "E": "lift_doors", "S": "stairs_up", "m": "mat_lobby"}, "decal": {}, "walk": {",": 1, "E": 1, "S": 0}, "wall": wallRow('nbdwhnddncsb')};
SKINS.flats_home = HOUSE_SKINS.flats_home = {"remap": {"#": "wall_home_5b", "W": "wall_home_5b_face", "W2": "wall_home_5b_win", ",": "floor_terracotta", ".": "floor_honey", "=": "rug_kitchen", "~": "runner_hall", "_": "carpet_navy", "m": "mat_home_5b", "e": "floor_bath_tile", "a": "rug_sunflower", "n": "rug_fern", "r": "rug_domino", "k": "floor_paint_plank"}, "decal": {}, "walk": {",": 1, "~": 1, "_": 1, "e": 1, "a": 1, "n": 1, "r": 1, "k": 1}, "wall": wallRow('oypyopdFpcwp')};
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
  // Rook's Crossroads: a sealed quarry crate. Mint band, three air holes, one glow. Original; the orchard crate stays A.crate.
  A.rc_crate = mkTile(g => {
    px(g,PAL.d,2,3,12,12); px(g,PAL.o,3,4,10,10); px(g,PAL.d,3,3,10,1);
    px(g,PAL.l,3,8,10,2);
    px(g,PAL.k,5,6,1,1); px(g,PAL.k,10,6,1,1); px(g,PAL.k,7,12,1,1);
    px(g,PAL.y,8,7,1,1);
  });
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
  // D133: retired. The pixels stay so nothing that still names the key draws a hole. No map places this kiosk.
  // Side changes go through Rook (D127), not a desk.
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
  // B2 signature props (lobby bench, planter, sign-in; Focus booth and board; Records table, cart, lamp).
  A.lab_bench_wait = mkTile(g => rxPaint(g, ["................","................","................",".wwwwwwwwwwwwww.",".wssssssssssssw.",".wwwwwwwwwwwwww.",".m..m....m...m..",".m..m....m...m..",".mmmmmmmmmmmmm..","................","................","................","................","................","................","................"]));
  A.lab_planter = mkTile(g => rxPaint(g, ["................","................","..wwwwwwwwwwww..","..wkkkkkkkkkkkw.","..wkwwwwwwwwwkw.","..wkkkkkkkkkkkw.","..wwwwwwwwwwww..","...mmmmmmmmmm...","...m........m...","...m........m...","...mmmmmmmmmm...","................","................","................","................","................"]));
  A.lab_signin = mkTile(g => rxPaint(g, ["................",".mmmmmmmmmmmmmm.",".mllllllllllllm.",".mlkkkkkkkkkklm.",".mlkwwwwwwwwklm.",".mlkwllllwwwklm.",".mlkwwwwwwwwklm.",".mlkkkkkkkkkklm.",".mllllllllllllm.",".mmmmmmmmmmmmmm.","......mmmm......",".....mmmmmm.....",".....m....m.....",".....mmmmmm.....","................","................"]));
  A.lab_booth = mkTile(g => rxPaint(g, ["................",".ss..........ss.",".sc..........sc.",".ss..mmmmmm..ss.",".ss..mccccm..ss.",".ss..mkkkkm..ss.",".ss..mccccm..ss.",".ss..mmmmmm..ss.",".ss..........ss.",".wwwwwwwwwwwwww.",".whhhhhhhhhhhhw.",".wwwwwwwwwwwwww.","..m..........m..","..m..........m..","..mm........mm..","................"]));
  A.lab_whiteboard = mkTile(g => rxPaint(g, ["................","................","..mmmmmmmmmmmm..","..mwwwwwwwwwwwm.","..mwwwhhhhhwwwm.","..mwwwwwwwwwwwm.","..mwwwwwwhhhwwm.","..mwwwwwwwwwwwm.","..mwwwwwwwwwwwm.","..mmmmmmmmmmmmm.",".....m....m.....",".....m....m.....",".....mmmmmm.....","................","................","................"]));
  A.lab_sort_table = mkTile(g => rxPaint(g, ["................","..yyyy...oooo...","..ywyw...owow...","..yyyy...oooo...",".wwwwwwwwwwwwww.",".whhhhhhhhhhhhw.",".wwwwwwwwwwwwww.","..m..........m..","..m..........m..","..mmmmmmmmmmmm..","..m..........m..","..m..........m..","..mm........mm..","................","................","................"]));
  A.lab_file_cart = mkTile(g => rxPaint(g, ["................","..mmmmmmmmmmmm..","..myyyyyyyyyym..","..mwwwwwwwwwwm..","..myyyyyyyyyym..","..mwwwwwwwwwwm..","..mmmmmmmmmmmm..","....m......m....","....m......m....","..mmmmmmmmmmmm..","..m.o......o.m..","...o........o...","................","................","................","................"]));
  A.lab_archive_lamp = mkTile(g => rxPaint(g, ["................","................","......yyyy......",".....yooooy.....",".....yowwoy.....",".....yooooy.....","......yyyy......",".......mm.......",".......mm.......",".......mm.......","......mmmm......",".....mmmmmm.....","................","................","................","................"]));
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
  // D87 tunnel props. Wood and metal on the rock floor. Still frames (no outline).
  const TUNNEL_PROPS = {
    tunnel_cart: ['................','................','....oooooooo....','...ohhhhhhhhho..','...ohdddddddho..','...ohhhhhhhhho..','...odddddddddo..','....oooooooo....','..oo........oo..','.ohho......ohho.','.oddo......oddo.','..oo........oo..','................','................','................','................'],
    crate_stack: ['................','...dddddddddd...','...doooooooood..','...doooooooood..','...dooyoooooood.','...ddddddddddod.','...doooooooood..','..dddddddddddd..','..doooooooooood.','..doooooooooood.','..doooyoooooood.','..ddddddddddddd.','..doooooooooood.','..doooooooooood.','..dddddddddddd..','................'],
    barrel: ['................','................','.....dddddd.....','....dhhhhhhd....','....dhooooohd...','...ddhooooohdd..','...ddhooooohdd..','...ddhhhhhhdd...','...ddhooooohdd..','...ddhooooohdd..','...ddhhhhhhdd...','....dhooooohd...','....dhhhhhhd....','.....dddddd.....','......dddd......','................'],
    rope_coil: ['................','................','................','.....oooooo.....','....oyyyyyyo....','...oyooooooyo...','...oyooyyooyo...','...oyoyyyoyooy..','...oyooyyooyo...','...oyooooooyo...','....oyyyyyyo....','.....oooooo.....','......oooo......','................','................','................'],
    tunnel_brace: ['................','...oooooooooo...','...ohhhhhhhhho..','...oooooooooo...','....oo....oo....','....oo....oo....','....oo....oo....','...ooo....ooo...','...oo......oo...','..ooo......ooo..','..oo........oo..','..oo........oo..','.ooo........ooo.','.oooooooooooooo.','................','................'],
    lantern_hook: ['................','..oooooooooooo..','..oyyyyyyyyyyo..','..oooooooooooo..','.......oo.......','.......oo.......','......o..o......','.....o....o.....','.....o....o.....','......o..o......','.......oo.......','......oyyo......','.......oo.......','................','................','................'],
    tunnel_desk: ['................','................','..oooooooooooo..','..ohhhhhhhhhho..','..oddddddddddo..','..oooooooooooo..','...dd......dd...','...dd......dd...','...dd......dd...','...dd......dd...','...dd......dd...','..dddd....dddd..','................','................','................','................'],
    tunnel_ledger: ['................','................','................','....dddddddd....','....dwwwwwwd....','....dwddddwd....','....dwwwwwwd....','....dwddddwd....','....dwwwwwwd....','....dwyyywwd....','....dwwwwwwd....','....dddddddd....','................','................','................','................'],
    tunnel_lamp: ['................','................','......yyyy......','.....yhhhhy.....','.....yhooohy....','.....yhooohy....','......yyyy......','.......oo.......','.......oo.......','.......oo.......','......dddd......','.....dddddd.....','.....dyyyyd.....','................','................','................'],
  };
  for (const [k, rows] of Object.entries(TUNNEL_PROPS)) A[k] = mkTile(g => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); })));
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
  A.quilt_g = quilt('g'); A.quilt_l = quilt('l'); A.quilt_o = quilt('o');
  // B8 Fernbrook room props. Still frames, no outline. D103 owns the lines.
  A.heal_counter = mkTile(g => {
    px(g, PAL.F, 1, 6, 14, 8); px(g, PAL.A, 2, 7, 12, 5); px(g, PAL.E, 2, 6, 12, 1);
    px(g, PAL.s, 8, 3, 5, 3); px(g, PAL.c, 9, 4, 3, 2); px(g, PAL.w, 9, 4, 1, 1);
    px(g, PAL.F, 2, 13, 2, 2); px(g, PAL.F, 12, 13, 2, 2);
  });
  A.herb_rack = mkTile(g => {
    px(g, PAL.F, 2, 2, 12, 2);
    px(g, PAL.g, 3, 4, 2, 6); px(g, PAL.E, 6, 4, 2, 7); px(g, PAL.l, 9, 4, 2, 5); px(g, PAL.D, 12, 4, 2, 6);
    px(g, PAL.A, 3, 10, 2, 2); px(g, PAL.A, 6, 11, 2, 2); px(g, PAL.A, 9, 9, 2, 2); px(g, PAL.A, 12, 10, 2, 2);
  });
  A.orchard_lamp = mkTile(g => {
    px(g, PAL.F, 7, 12, 2, 3); px(g, PAL.A, 5, 11, 6, 1);
    px(g, PAL.y, 5, 5, 6, 6); px(g, PAL.o, 6, 6, 4, 4); px(g, PAL.C, 7, 7, 2, 2); px(g, PAL.F, 7, 3, 2, 2);
  });
  A.orchard_table = mkTile(g => {
    px(g, PAL.F, 2, 8, 12, 3); px(g, PAL.A, 3, 8, 10, 1); px(g, PAL.r, 6, 6, 2, 2); px(g, PAL.g, 7, 5, 1, 1);
    px(g, PAL.F, 3, 11, 2, 4); px(g, PAL.F, 11, 11, 2, 4);
  });
  A.cider_jug = mkTile(g => {
    px(g, PAL.F, 5, 3, 6, 2); px(g, PAL.A, 6, 2, 4, 1); px(g, PAL.o, 4, 5, 8, 8); px(g, PAL.y, 6, 7, 4, 3); px(g, PAL.F, 4, 13, 8, 2);
  });
  A.orchard_stool = mkTile(g => {
    px(g, PAL.A, 3, 6, 10, 3); px(g, PAL.F, 4, 9, 2, 5); px(g, PAL.F, 10, 9, 2, 5); px(g, PAL.g, 6, 7, 2, 1);
  });
  A.orchard_basket = mkTile(g => {
    px(g, PAL.A, 3, 6, 10, 8); px(g, PAL.F, 3, 6, 10, 1); px(g, PAL.g, 4, 4, 8, 2); px(g, PAL.l, 5, 3, 2, 1); px(g, PAL.E, 9, 4, 2, 1);
  });
  A.dais_lamp = mkTile(g => {
    px(g, PAL.F, 7, 12, 2, 3); px(g, PAL.C, 4, 11, 8, 1); px(g, PAL.y, 4, 4, 8, 7); px(g, PAL.p, 6, 6, 4, 3); px(g, PAL.F, 7, 2, 2, 2);
  });
  A.ribbon_stand = mkTile(g => {
    px(g, PAL.F, 7, 4, 2, 11); px(g, PAL.C, 4, 14, 8, 1);
    px(g, PAL.p, 3, 3, 3, 5); px(g, PAL.w, 7, 4, 2, 4); px(g, PAL.r, 10, 3, 3, 5);
  });
  A.bloom_urn = mkTile(g => {
    px(g, PAL.C, 5, 6, 6, 7); px(g, PAL.F, 6, 5, 4, 1); px(g, PAL.F, 4, 13, 8, 2);
    px(g, PAL.p, 6, 2, 2, 3); px(g, PAL.g, 8, 3, 2, 2); px(g, PAL.r, 5, 4, 1, 1);
  });
  A.bloom_pot = mkTile(g => {
    px(g, PAL.B, 4, 8, 8, 6); px(g, PAL.F, 3, 7, 10, 2); px(g, PAL.g, 5, 3, 6, 4); px(g, PAL.p, 6, 2, 2, 2); px(g, PAL.y, 9, 4, 1, 1);
  });
  A.petal_bowl = mkTile(g => {
    px(g, PAL.C, 3, 8, 10, 4); px(g, PAL.F, 4, 12, 8, 1); px(g, PAL.p, 5, 6, 2, 2); px(g, PAL.r, 8, 6, 2, 2); px(g, PAL.w, 7, 5, 2, 1);
  });
  A.bloom_basket = mkTile(g => {
    px(g, PAL.A, 3, 7, 10, 7); px(g, PAL.F, 3, 7, 10, 1); px(g, PAL.p, 4, 4, 3, 3); px(g, PAL.r, 8, 4, 3, 3); px(g, PAL.g, 6, 3, 3, 2);
  });
  A.bloom_bench = mkTile(g => {
    px(g, PAL.A, 1, 8, 14, 3); px(g, PAL.F, 2, 11, 2, 4); px(g, PAL.F, 12, 11, 2, 4); px(g, PAL.p, 6, 9, 1, 1); px(g, PAL.g, 9, 9, 1, 1);
  });
  A.petal_jar = mkTile(g => {
    px(g, PAL.s, 5, 4, 6, 8); px(g, PAL.C, 6, 3, 4, 2); px(g, PAL.p, 6, 6, 2, 2); px(g, PAL.w, 8, 7, 2, 2); px(g, PAL.F, 5, 12, 6, 2);
  });
  A.bloom_stool = mkTile(g => {
    px(g, PAL.C, 4, 7, 8, 3); px(g, PAL.p, 6, 8, 2, 1); px(g, PAL.F, 5, 10, 2, 4); px(g, PAL.F, 9, 10, 2, 4);
  });
  A.petal_cushion = mkTile(g => {
    px(g, PAL.p, 2, 6, 12, 6); px(g, PAL.r, 4, 8, 3, 2); px(g, PAL.w, 9, 7, 3, 2); px(g, PAL.C, 6, 9, 2, 1);
  });
  // B6 High Charity signature props. Candles, the fountain and the stair flight stay on one frame.
  A.weather_board = mkTile(g => {
    px(g, PAL.d, 1, 2, 14, 10); px(g, PAL.h, 2, 3, 12, 8); px(g, PAL.b, 3, 4, 6, 3); px(g, PAL.w, 4, 5, 3, 1);
    px(g, PAL.y, 9, 7, 4, 1); px(g, PAL.o, 12, 6, 1, 3); px(g, PAL.d, 6, 12, 4, 3);
  });
  A.bunk = mkTile(g => {
    px(g, PAL.d, 1, 1, 2, 14); px(g, PAL.d, 13, 1, 2, 14);
    px(g, PAL.t, 2, 3, 11, 3); px(g, PAL.g, 2, 3, 11, 1); px(g, PAL.w, 2, 4, 3, 1);
    px(g, PAL.t, 2, 9, 11, 3); px(g, PAL.y, 2, 9, 11, 1); px(g, PAL.w, 2, 10, 3, 1);
  });
  A.locker = mkTile(g => {
    px(g, PAL.m, 3, 1, 10, 13); px(g, PAL.h, 4, 2, 8, 5); px(g, PAL.h, 4, 8, 8, 5); px(g, PAL.d, 4, 7, 8, 1);
    px(g, PAL.y, 10, 4, 1, 2); px(g, PAL.y, 10, 10, 1, 2); px(g, PAL.d, 4, 14, 8, 1);
  });
  A.boat_rack = mkTile(g => {
    px(g, PAL.d, 3, 11, 2, 4); px(g, PAL.d, 11, 11, 2, 4); px(g, PAL.o, 2, 8, 12, 2);
    px(g, PAL.c, 3, 4, 10, 4); px(g, PAL.s, 4, 5, 8, 2); px(g, PAL.w, 6, 5, 2, 1); px(g, PAL.d, 7, 3, 2, 2);
  });
  A.net_hang = mkTile(g => {
    px(g, PAL.d, 2, 1, 12, 2);
    for (let y = 3; y < 14; y += 2) for (let x = 3 + (y % 4 ? 0 : 1); x < 13; x += 2) px(g, PAL.h, x, y, 1, 1);
    px(g, PAL.b, 4, 13, 8, 1);
  });
  A.rope_coil = mkTile(g => { px(g, PAL.o, 3, 5, 10, 8); px(g, PAL.y, 5, 7, 6, 4); px(g, PAL.o, 7, 8, 2, 2); px(g, PAL.d, 2, 13, 12, 1); });
  A.chalk_board = mkTile(g => {
    px(g, PAL.o, 1, 1, 14, 12); px(g, PAL.n, 2, 2, 12, 9); px(g, PAL.w, 3, 4, 6, 1); px(g, PAL.w, 3, 6, 8, 1); px(g, PAL.y, 3, 8, 4, 1);
    px(g, PAL.h, 2, 12, 12, 1); px(g, PAL.d, 4, 13, 2, 2); px(g, PAL.d, 10, 13, 2, 2);
  });
  A.vault_door = mkTile(g => {
    px(g, PAL.m, 2, 1, 12, 14); px(g, PAL.h, 4, 3, 8, 10); px(g, PAL.d, 7, 6, 2, 4); px(g, PAL.y, 6, 7, 4, 2); px(g, PAL.y, 7, 5, 2, 1); px(g, PAL.d, 3, 14, 10, 1);
  });
  A.grille = mkTile(g => {
    px(g, PAL.h, 2, 3, 12, 8); px(g, PAL.n, 3, 4, 10, 6); [4, 7, 10].forEach(x => px(g, PAL.m, x, 4, 1, 6)); px(g, PAL.m, 3, 6, 10, 1);
    px(g, PAL.y, 3, 11, 10, 2); px(g, PAL.d, 4, 13, 2, 2); px(g, PAL.d, 10, 13, 2, 2);
  });
  A.gym_mat = mkTile(g => { px(g, PAL.r, 1, 4, 14, 9); px(g, PAL.w, 2, 5, 12, 7); px(g, PAL.r, 3, 8, 10, 1); });
  A.clinic_shelf = mkTile(g => {
    px(g, PAL.w, 1, 2, 14, 11); px(g, PAL.c, 1, 2, 14, 2); px(g, PAL.h, 2, 5, 12, 1); px(g, PAL.h, 2, 9, 12, 1);
    [[3, 'l'], [6, 's'], [9, 'w'], [12, 'c']].forEach(([x, c]) => px(g, PAL[c], x, 6, 2, 3));
    px(g, PAL.w, 4, 10, 3, 2); px(g, PAL.c, 9, 10, 3, 2); px(g, PAL.d, 2, 13, 12, 1);
  });
  A.candle_stand = mkTile(g => { px(g, PAL.d, 4, 12, 8, 3); px(g, PAL.m, 7, 6, 2, 6); px(g, PAL.y, 6, 3, 4, 3); px(g, PAL.o, 7, 2, 2, 2); px(g, PAL.w, 7, 4, 1, 1); });
  A.hall_stage = mkTile(g => {
    px(g, PAL.o, 0, 6, 16, 6); px(g, PAL.y, 0, 6, 16, 2); px(g, PAL.d, 0, 11, 16, 2);
    px(g, PAL.r, 2, 8, 3, 2); px(g, PAL.b, 7, 8, 3, 2); px(g, PAL.y, 12, 8, 2, 2);
  });
  A.hall_chair = mkTile(g => { px(g, PAL.b, 4, 2, 8, 6); px(g, PAL.s, 5, 3, 6, 2); px(g, PAL.o, 3, 8, 10, 3); px(g, PAL.d, 4, 11, 2, 4); px(g, PAL.d, 10, 11, 2, 4); });
  A.arena_stand = mkTile(g => {
    px(g, PAL.r, 1, 8, 14, 6); px(g, PAL.o, 1, 8, 14, 2); px(g, PAL.r, 3, 5, 10, 3); px(g, PAL.y, 3, 5, 10, 1); px(g, PAL.d, 5, 3, 6, 2); px(g, PAL.m, 2, 13, 12, 2);
  });
  A.apt_desk = mkTile(g => {
    px(g, PAL.o, 1, 6, 14, 4); px(g, PAL.y, 2, 7, 6, 2); px(g, PAL.b, 9, 7, 4, 2); px(g, PAL.d, 2, 10, 2, 5); px(g, PAL.d, 12, 10, 2, 5); px(g, PAL.w, 4, 4, 4, 2);
  });
  A.shop_stall = mkTile(g => {
    px(g, PAL.r, 1, 1, 14, 3); px(g, PAL.y, 1, 2, 4, 1); px(g, PAL.b, 6, 2, 4, 1); px(g, PAL.w, 11, 2, 3, 1);
    px(g, PAL.o, 2, 5, 12, 6); px(g, PAL.d, 2, 7, 12, 1); px(g, PAL.d, 3, 11, 2, 4); px(g, PAL.d, 11, 11, 2, 4);
    px(g, PAL.y, 4, 8, 3, 2); px(g, PAL.c, 8, 8, 3, 2);
  });
  A.fountain_small = mkTile(g => {
    px(g, PAL.m, 2, 8, 12, 6); px(g, PAL.h, 3, 9, 10, 4); px(g, PAL.c, 4, 10, 8, 2); px(g, PAL.s, 6, 10, 4, 1);
    px(g, PAL.d, 7, 3, 2, 6); px(g, PAL.b, 5, 4, 6, 3); px(g, PAL.w, 6, 5, 2, 1);
  });
  A.stair_flight = mkTile(g => {
    px(g, PAL.m, 2, 2, 12, 2); px(g, PAL.h, 3, 3, 10, 1); px(g, PAL.m, 2, 6, 12, 2); px(g, PAL.h, 3, 7, 10, 1);
    px(g, PAL.m, 2, 10, 12, 2); px(g, PAL.h, 3, 11, 10, 1); px(g, PAL.y, 6, 12, 4, 2);
  });
  A.mall_bench = mkTile(g => { px(g, PAL.p, 1, 6, 14, 2); px(g, PAL.o, 1, 7, 14, 3); px(g, PAL.d, 2, 10, 2, 4); px(g, PAL.d, 12, 10, 2, 4); px(g, PAL.d, 7, 10, 2, 3); });
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
  A.kitchen_counter = mkTile(g => {   // dream_2004 kitchen: a wooden counter, cutting board, bowl of peas
    px(g, PAL.d, 1, 5, 14, 9); px(g, PAL.o, 2, 6, 12, 7); px(g, PAL.h, 1, 4, 14, 2); px(g, PAL.w, 3, 2, 5, 2); px(g, PAL.d, 3, 4, 5, 1);
    px(g, PAL.m, 10, 2, 3, 2); px(g, PAL.l, 11, 2, 1, 1); px(g, PAL.d, 7, 8, 2, 3); px(g, PAL.d, 1, 14, 14, 1);
  });
  A.tv_set = mkTile(g => {           // dream_2004: an old boxy TV on a low stand, seen from behind the couch
    px(g, PAL.d, 2, 2, 12, 9); px(g, PAL.m, 3, 3, 10, 7); px(g, PAL.t, 4, 4, 6, 5); px(g, PAL.g, 5, 6, 3, 2); px(g, PAL.s, 5, 4, 2, 1);
    px(g, PAL.y, 11, 4, 1, 1); px(g, PAL.r, 11, 6, 1, 1); px(g, PAL.d, 6, 0, 1, 2); px(g, PAL.d, 9, 0, 1, 2);
    px(g, PAL.o, 1, 11, 14, 2); px(g, PAL.d, 2, 13, 2, 2); px(g, PAL.d, 12, 13, 2, 2);
  });
  A.couch = mkTile(g => {            // dream_2004: Dad's couch, back to the viewer, facing the TV
    px(g, PAL.d, 0, 4, 16, 10); px(g, PAL.r, 1, 5, 14, 5); px(g, PAL.p, 1, 10, 14, 3); px(g, PAL.o, 2, 6, 5, 1); px(g, PAL.o, 9, 6, 5, 1);
    px(g, PAL.d, 7, 5, 1, 5); px(g, PAL.d, 1, 14, 2, 1); px(g, PAL.d, 13, 14, 2, 1);
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
/* ---------- map pass B4: building exteriors, path edges, outdoor props, landmarks ---------- */
// handoff/maps BUILDING_VARIETY rows 1-27. Text grids of PAL keys, "." transparent. tiles go to TILES (16x16), art to
// WART (16x16), big to WART (32x32 landmarks and wide doors, drawn bottom-centred on their cell). Existing names are never replaced.
const EXTERIOR_ART = {
  tiles: {
    // roofs (seamless; the engine adds the eave shadow and any shape cut)
    roof_tile_r: ["rorrrorrrorrrorr","rrrrrrrrrrrrrrrr","rrrrrrrrrrrrrrrr","prrpprrpprrpprrp","rrrorrrorrrorrro","rrrrrrrrrrrrrrrr","rrrrrrrrrrrrrrrr","rpprrpprrpprrppr","rorrrorrrorrrorr","rrrrrrrrrrrrrrrr","rrrrrrrrrrrrrrrr","prrpprrpprrpprrp","rrrorrrorrrorrro","rrrrrrrrrrrrrrrr","rrrrrrrrrrrrrrrr","rpprrpprrpprrppr"],
    roof_teal: ["tctttctttctttctt","tttttttttttttttt","tttttttttttttttt","nttnnttnnttnnttn","tttctttctttctttc","tttttttttttttttt","tttttttttttttttt","tnnttnnttnnttnnt","tctttctttctttctt","tttttttttttttttt","tttttttttttttttt","nttnnttnnttnnttn","tttctttctttctttc","tttttttttttttttt","tttttttttttttttt","tnnttnnttnnttnnt"],
    roof_shingle_g: ["tgggggtdtgggggtd","tttttttdtttttttd","tttttttdtttttttd","dddddddddddddddd","ggtdtgggggtdtggg","tttdtttttttdtttt","tttdtttttttdtttt","dddddddddddddddd","tgggggtdtgggggtd","tttttttdtttttttd","tttttttdtttttttd","dddddddddddddddd","ggtdtgggggtdtggg","tttdtttttttdtttt","tttdtttttttdtttt","dddddddddddddddd"],
    roof_shingle_p: ["prrrrrpdprrrrrpd","pppppppdpppppppd","pppppppdpppppppd","dddddddddddddddd","rrpdprrrrrpdprrr","popdpppppppdpppp","pppdpppppppdpppp","dddddddddddddddd","prrrrrpdprrrrrpd","pppppppdpppppppd","pppppppdpppppppd","dddddddddddddddd","rrpdprrrrrpdprrr","pppdpppppppdpppp","oppdpppppppdpppp","dddddddddddddddd"],
    roof_slab_h: ["hwwwwwhmhwwwwwhm","hhhhhhhmhhhhhhhm","hhhhhhhmhhhhhhhm","mmmmmmmmmmmmmmmm","wwhmhwwwwwhmhwww","hhhmhhhhhhhmhhhh","hhhmhhhhhhhmhhhh","mmmmmmmmmmmmmmmm","hwwwwwhmhwwwwwhm","hhhhhhhmhhhhhhhm","hhhhhhhmhhhhhhhm","mmmmmmmmmmmmmmmm","wwhmhwwwwwhmhwww","hhhmhhhhhhhmhhhh","hhhmhhhhhhhmhhhh","mmmmmmmmmmmmmmmm"],
    roof_flat_m: ["mhhmmmmdmhhmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmwmmdmmmmmmmd","mmmmmmmdmmmmmmmd","dddddddddddddddd","mmmdmhhmmmmdmhhm","mmmdmmmmmmmdmmmm","mmmdmmmmmmmdmmmm","mmmdmmmmmmmdmmwm","mmmdmmmmmmmdmmmm","mmmdmmmmmmmdmmmm","mmmdmmmmmmwdmmmm","dddddddddddddddd"],
    roof_gold: ["oyyyyyyyoyyyyyyy","oywwyyyyoywwyyyy","oyyyyyyyoyyyyyyy","oooooooooooooooo","yyyyoyyyyyyyoyyy","yyyyoywwyyyyoyww","yyyyoyyyyyyyoyyy","oooooooooooooooo","oyyyyyyyoyyyyyyy","oywwyyyyoywwyyyy","oyyyyyyyoyyyyyyy","oooooooooooooooo","yyyyoyyyyyyyoyyy","yyyyoywwyyyyoyww","yyyyoyyyyyyyoyyy","oooooooooooooooo"],
    roof_tile_o: ["yooryooryooryoor","yooryooryooryoor","yooryooryooryoor","yooryooryooryoor","yooryooryooryoor","yooryooryooryoor","yooryooryooryoor","rrrrrrrrrrrrrrrr","oryooryooryooryo","oryooryooryooryo","oryooryooryooryo","oryooryooryooryo","oryooryooryooryo","oryooryooryooryo","oryooryooryooryo","rrrrrrrrrrrrrrrr"],
    roof_slate_b: ["bnndcnndbnndbnnd","nnndnnndnnndnnnd","nnndnnndnnndnnnd","dddddddddddddddd","ndbnndbnndbnndbn","ndnnndnnndnnndnn","ndnnndnnndnnndnn","dddddddddddddddd","bnndbnndbnndbncd","nnndnnndnnndnnnd","nnndnnndnnndnnnd","dddddddddddddddd","ndbnndbnndbnndbn","ndnnndnnndnnndnn","ndnnndnnndnnndnn","dddddddddddddddd"],
    roof_thatch_g: ["lglglglglglglglg","gggtgggtgggtgggt","gggtgggtgggtgggt","tgtttgtttgtttgtt","lglglglglglglglg","gtgggtgggtgggtgg","gtgggtgggtgggtgg","tttgtttgtttgtttg","lglglglglglglglg","gggtgggtgggtgggt","gggtgggtgggtgggt","tgtttgtttgtttgtt","lglglglglglglglg","gtgggtgggtgggtgg","gtgggtgggtgggtgg","tttgtttgtttgtttg"],
    roof_thatch_y: ["wywywywywywywywy","yyyoyyyoyyyoyyyo","yyyoyyyoyyyoyyyo","oyoooyoooyoooyoo","wywywywywywywywy","yoyyyoyyyoyyyoyy","yoyyyoyyyoyyyoyy","oooyoooyoooyoooy","wywywywywywywywy","yyyoyyyoyyyoyyyo","yyyoyyyoyyyoyyyo","oyoooyoooyoooyoo","wywywywywywywywy","yoyyyoyyyoyyyoyy","yoyyyoyyyoyyyoyy","oooyoooyoooyoooy"],
    roof_gable_p: ["ppoppppdpppppppd","poyopppdpppppppd","ppoppppdppppprrd","dddldddddddddddd","pppdppppppodpppp","pppdpppppoyopppp","pppdrrppppodpppp","dddddddddddldddd","ppppppodpppppppd","pppppoyopppppppd","ppppppodpppppppd","dddddddldddddddd","popdppppprrdpopp","oyodpppppppdoyop","popdpppppppdpopp","dddddddddddddddd"],
    roof_hangar: ["cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","ncnnnnnnncnnnnnn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","cbbncbbncbbncbbn","ncnnnnnnncnnnnnn"],
    roof_flat_h: ["hhhhhhhmhhhhhhhm","hhhhhhhmhhhhhhhm","hhwwhhhmhhhhhhhm","hhhhhhhmhhhddhhm","hhhhhhhmhhhhhhhm","hhhhhhhmhhhhhhhm","hhhhhhhmhhhhhhhm","mmmmmmmmmmmmmmmm","hhhhhhhmhhhhhhhm","hhhhhhhmhhhhhhhm","hhhhhhhmhhwwhhhm","hhhddhhmhhhhhhhm","hhhddhhmhhhhhhhm","hhhhhhhmhhhhhhhm","hhhhhhhmhhhhhhhm","mmmmmmmmmmmmmmmm"],
    roof_seam_t: ["gttdgttdgttdgttd","gttdgttdgttdgttd","gttdgttdgttdgttd","gttdgttdgttdgttd","gttdgttdgttdgttd","lttdgttdlttdgttd","gttdgttdgttdgttd","gttdgttdgttdgttd","gttdgttdgttdgttd","gttdgttdgttdgttd","gttdgttdgttdgttd","gttdgttdgttdgttd","gttdlttdgttdlttd","gttdgttdgttdgttd","gttdgttdgttdgttd","gttdgttdgttdgttd"],
    roof_point: ["nnnmnmnnnnnmnmnn","nnmnnnmnnnmnnnmn","nmnnnnnmnmnnnnnm","mnnnnnnnmnnnnnnn","nnnnnnnnnnnnnnnn","mnnnnnnnmnnnnnnn","nmnnnnnmnmnnnnnm","hnmnnnmnhnmnnnmn","nnnmnmnnnnnmnmnn","nnmnnnmnnnmnnnmn","nmnnnnnmnmnnnnnm","mnnnnnnnmnnnnnnn","nnnnnnnnnnnnnnnn","mnnnnnnnmnnnnnnn","nmnnnnnmnmnnnnnm","hnmnnnmnhnmnnnmn"],
    roof_arch_r: ["oooyooopooooooop","rrrrrrrprrrrrrrp","rrrrrrrprrrrrrrp","pppppppppppppppp","ooooooopoooyooop","rrrrrrrprrrrrrrp","rrrrrrrprrrrrrrp","pppppppppppppppp","oooyooopooooooop","rrrrrrrprrrrrrrp","rrrrrrrprrrrrrrp","pppppppppppppppp","ooooooopoooyooop","rrrrrrrprrrrrrrp","rrrrrrrprrrrrrrp","pppppppppppppppp"],
    roof_board_t: ["cttttnttttcttttc","tttttntttttttttt","tttttntttttttttt","nnnnnnnnnnnnnnnn","tcttttcttttctntt","tttttttttttttntt","tttttttttttttntt","nnnnnnnnnnnnnnnn","ttnttttcttttcttt","ttnttttttttttttt","ttnttttttttttttt","nnnnnnnnnnnnnnnn","tttcttttctnttctt","ttttttttttnttttt","ttttttttttnttttt","nnnnnnnnnnnnnnnn"],
    roof_canvas: ["rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh","rrrpwwwhrrrpwwwh"],
    roof_flat_d: ["dddddddddddddddd","dmdddddddddddddd","dddddddddddddddd","ddmddddddddddddd","dmdddddmdddmhddd","dddddddddddddddd","ddddddmdddhmdhdd","dddddddddddmdddd","dddddddddddddddd","dddddddddddddddd","ddddddmdmdddmddd","dddddddddddddddd","ddddmdddddmddddd","ddddddhddddddddd","ddhddddhdddddddd","mddddddmdddddddd"],
    roof_glass: ["mmmmmmmmmmmmmmmm","mccsccccmccscccc","mcccscccmcccsccc","mccccsccmccccscc","mcccccscmcccccsc","mccccccsmccccccs","mcccccccmccccccc","msbbbbbbmsbbbbbb","mmmmmmmmmmmmmmmm","mccsccccmccscccc","mcccscccmcccsccc","mccccsccmccccscc","mcccccscmcccccsc","mccccccsmccccccs","mcccccccmccccccc","msbbbbbbmsbbbbbb"],
    roof_dome: ["wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wswhwwwhwswhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","hhhhhhhhhhhhhhhh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","mmmmmmmmmmmmmmmm"],
    roof_flat_w: ["wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwhlhwwhwwwwwwwh","wwhhhwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwhlhwwh","wwwwwwwhwwhhhwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","hhhhhhhhhhhhhhhh"],
    roof_rock: ["mmmmmddmmmmmdddd","mhmmmmmmmmmmmddm","mmmmmmdmmmmmdddm","mmmmmmddmmmddmmm","mmmmmmmdddddmhmm","mmmmmmmmddddmmmm","mdmmhmmmmdddmmmm","ddmmmmmmmdmggmmm","ddmmmmmmmmhmmmdd","dddmmmmmdmmmmmdd","dmggmmmdmmmmmmdd","mhmmmddmmmmmmddd","mmmmmdmhmmmddddd","mmmmmdmmmmmddddd","dmmmddmmmmmddddd","dmmmdddmmmgddddd"],
    roof_turf: ["gggggggtgggggggg","gggtgggggggggggg","gggggggggggggggg","llggglggglggglgg","ggggtggggggggggg","tggglggggggggggg","ggggggggglgggggg","tgggtgggtgggtggg","ggggglgggggggggg","gtgggggggggggggg","gggggggglggglggg","ggglggglggglgggl","gggggtgglggggggg","gggggggggggggggg","gggggggggggggggg","ggtgggtgggtlggtg"],
    // walls (seamless)
    wall_plaster: ["wwwwwwwwwwwwwwww","wwwwwwwwwwwyywww","wywwwwwwwwwwwyww","wwwwwwwwwwwwwwww","wyhwwwwwwwywwyww","wwwwwwwwwywwwwww","wwwwhwwwwwwwwwww","wwwywwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwyhwwwwwwww","wwwwwwwwwwwwwwww","wwywwwwwwwwwwwww","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww"],
    wall_log: ["oyyooooyyooooyyo","oooooooooooooooo","ooooodoooooooooo","dddddddddddddddd","oooyyooooyyooooy","oooooooooooooooo","oooooooooooodooo","dddddddddddddddd","yooooyyooooyyooo","oooooooooooooooo","oodooooooooooooo","dddddddddddddddd","oyyooooyyooooyyo","oooooooooooooooo","ooooooooodoooooo","dddddddddddddddd"],
    wall_white: ["wwwwwwwwwwwwwwww","wwwhwwwwwwwwwwww","wwwwwwwwwwwwwwww","hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwww","wwwwwwwwwwwhwwww","wwwwwwwwwwwwwwww","hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwww","wwwwwwhwwwwwwwww","wwwwwwwwwwwwwwww","hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwhw","wwwwwwwwwwwwwwww","hhhhhhhhhhhhhhhh"],
    wall_brick: ["orrrrrrhorrrrrrh","rrrrrrrhrrrrrrrh","rrrrrrrhrrrrrrrh","hhhhhhhhhhhhhhhh","rrrhorrrrrrhorrr","rrrhrrrrrrrhrrrr","rrrhrrrrrrrhrrrr","hhhhhhhhhhhhhhhh","orrrrrrhorrrrrrh","rrrrrrrhrrrrrrrh","rrrrrrrhrrrrrrrh","hhhhhhhhhhhhhhhh","rrrhorrrrrrhorrr","rrrhrrrrrrrhrrrr","rrrhrrrrrrrhrrrr","hhhhhhhhhhhhhhhh"],
    wall_ashlar_w: ["wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","hhhhhhhhhhhhhhhh","wwwhwwwwwwwhwwww","wwwhwwwwwwwhwwww","wwwhwwwwwwwhwwww","hhhhhhhhhhhhhhhh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","hhhhhhhhhhhhhhhh","wwwhwwwwwwwhwwww","wwwhwwwwwwwhwwww","wwwhwwwwwwwhwwww","hhhhhhhhhhhhhhhh"],
    wall_obs: ["hmmmmmmdhmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","dddddddddddddddd","mmmdhmmmmmmdhmmm","mmmdmmmmmmmdmmmm","mmmdmmmmmmmdmmmm","dddddddddddddddd","hmmmmmmdhmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","dddddddddddddddd","mmmdhmmmmmmdhmmm","mmmdmmmmmmmdmmmm","mmmdmmmmmmmdmmmm","dddddddddddddddd"],
    wall_stone: ["hhhhhhhhhmhhhhhh","hwwhhhhhhmhwwhhh","hhhhhhhhhmhhhhhh","hhhhhhhhhmhhhhhh","hhhhhhhhhmhhhhhh","hhhhhhhhhmhhhhhh","hhhhhhhhhmhhhhhh","mmmmmmmmmmmmmmmm","hhhhmhhhhhhhmhhh","hhhhmhwwhhhhmhww","hhhhmhhhhhhhmhhh","hhhhmhhhhhhhmhhh","hhhhmhhhhhhhmhhh","hhhhmhhhhhhhmhhh","hhhhmhhhhhhhmhhh","mmmmmmmmmmmmmmmm"],
    wall_timber: ["odyyyyyyyooyyyyy","odyyyyyyooyyyyyy","odyyyyyooyyyyyyy","odyyyyooyyyywyyy","odyyyooyyyyyyyyy","odyyooyyyyyyyyyy","odyooyyyyyyyyyyy","oooooooooooooooo","dddddddddddddddd","odyyyyyyyoyyyyyy","odyyyyyyyooyyyyy","odyyyyyyyyooyyyy","odyyywyyyyyooyyy","odyyyyyyyyyyooyy","odyyyyyyyyyyyooy","odyyyyyyyyyyyyoo"],
    wall_rough: ["dmmmddmmhmmmmmmm","mhmmmdmmmmmmmddd","mmmmmdmmmmmmmddd","mmmmmddmmmmmdmmm","mmmmddddmmmdmhmm","mmddmmmddddmmmmm","mddmhmmmdddmmmmm","dddmmmmmddmmmmmm","dddmmmmmdmhmmmdd","ddddmmmddmmmmmdd","dmmmdddddmmmmmdd","mhmmmddmmmmmmddd","mmmmmdmhmmmmdmmm","mmmmmdmmmmmdmhmm","mmmmddmmmmmmmmmm","mddddddmmmmmmmmm"],
    wall_pillar: ["dddhhhhhhhhhhddd","dddmmmmmmmmmmddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","ddddmhhwhmhmdddd","dddmmmmmmmmmmddd","dddhhhhhhhhhhddd"],
    wall_hangar: ["whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm","whhmwhhmwhhmwhhm"],
    wall_panel_m: ["mmmmmmmdmmmmmmmd","mhmmmhmdmhmmmhmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mmmmmmmdmmmmmmmd","mhmmmhmdmhmmmhmd","mmmmmmmdmmmmmmmd","dddddddddddddddd"],
    wall_batten_o: ["dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo","dyoorooodyoorooo"],
    wall_concrete: ["hhhhhhhhhhhhhhhh","hhhhhhwhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhmhhhhhhhmhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","mmmmmmmmmmmmmmmm","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhwh","hhhhhhhhhhhhhhhh","hhhmhhhhhhhmhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","mmmmmmmmmmmmmmmm"],
    wall_piles: ["oooooooooooooooo","oooooooooooooooo","dddddddddddddddd","oooooooooooooooo","oooooooooooooooo","dddddddddddddddd","oooooooooooooooo","oooooooooooooooo","dddddddddddddddd","dddoddddddddoddd","nnnodnnnnnnnodnn","nnnodnnnnnnnodnn","nnnodnbbnnnnodnn","nnnodnnnnnnnodbb","nnnodnnnbbnnodnn","nnnodnnnnnnnodnn"],
    wall_drum: ["mhhhhhhhhhhhhhhh","mhhhhhhhhhhhhhhh","mhhhhhhhhhhhhhhh","mmmmmmmmmmmmmmmm","mhhhhhhhhhhhhhhh","mhhhhhhhhhhhhhhh","myrrryrrryrrryrr","mrrrrrrrrrrrrrrr","mhhhhhhhmhhhhhhh","mhhhhhhhmhhhhhhh","mhhhhhhhmhhhhhhh","mmmmmmmmmmmmmmmm","mhhhhhhhmhhhhhhh","mhhhhhhhmhhhhhhh","mhhhhhhhmhhhhhhh","mmmmmmmmmmmmmmmm"],
    wall_stucco_o: ["oooooooooooooooy","rooooooorooooooo","oooooooooooooooo","yooooooooooooooo","oooooooooooooooo","oooorooyoooooooo","oooooooooooooooo","oooooooooooooooo","oooooooyooooyooo","oooooooooooooooo","ooooooooooooooyo","oooooroooooooooo","oooooooooooooooo","oooooooooooroooo","yooooooooooyoooo","oooooooooooooooo"],
    wall_yellow: ["yyyyyyyyyyyyyyyy","yyyywyyyyyyyyyyy","yyyyyyyyyyyyyyyy","oooooooooooooooo","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","oooooooooooooooo","yyyyyyyyyyyyyyyy","yyyyyyyyyyyywyyy","yyyyyyyyyyyyyyyy","oooooooooooooooo","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","oooooooooooooooo"],
    wall_civic: ["wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","bbbcbbbbbbbcbbbb","bbbbbbbbbbbbbbbb","hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwww"],
    wall_columns: ["hhhhhhhhhhhhhhhh","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","mwwhwhhmmwwhwhhm","hhhhhhhhhhhhhhhh"],
    wall_tile_s: ["swwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","hhhhhhhhhhhhhhhh","wwwhwwwhswwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","hhhhhhhhhhhhhhhh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","hhhhhhhhhhhhhhhh","wwwhswwhwwwhwwwh","wwwhwwwhwwwhwwwh","wwwhwwwhwwwhwwwh","hhhhhhhhhhhhhhhh"],
    wall_glass: ["mmmmmmmmmmmmmmmm","mcccccccmccccccc","mccccccsmccccccc","mcccccscmccccccs","mccccsccmcccccsc","mcccscccmccccscc","mccsccccmcccsccc","mcscccccmccscccc","msccccccmcsccccc","mcccccccmscccccc","mcccccccmccccccc","mccccccsmccccccc","mcccccccmccccccc","mbbbbbbbmbbbbbbb","mbbbbbbbmbbbbbbb","mbbbbbbbmbbbbbbb"],
    wall_lab_w: ["wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","llllllllllllllll","llllllllllllllll","hhhhhhhhhhhhhhhh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh"],
    wall_rock: ["dmggdddmhmmmdmmm","mhmmmdmmmmmmmdmd","mmmmmmdmmmmmdddm","mmmmmdddmmmddmgg","mmmmddddddddmhmm","mdddmggdddddmmmm","mddmhmmmddddmmmm","dddmmmmmddmmmmmm","dddmmmmmdmhmmmdd","ddggmmmddmmmmmdd","dmmmdddddmmmmmdd","mhmmmddmmmmmmdgg","mmmmmdmhmmmddmmm","mmmmmdmmmmmdmhmm","mmmmddmmmmmdmmmm","mdmddddmmmgdmmmm"],
    // E7 path edges: grass fringe drawn over a path cell on the side that touches grass
    path_edge_n: ["ggtggggggtgggtgg","gggggggggggggggg","l.gg..g.gg.gg..l","o..g..o..o.go..o","...o............","................","................","................","................","................","................","................","................","................","................","................"],
    path_edge_e: ["............olgg","..............gg",".............ggt","...........ogggg","..............gg","..............gg","............oggg","..............gg",".............ggg","............oggt","..............gg","............gggg","............oggg","..............gt","..............gg","............olgg"],
    path_edge_s: ["................","................","................","................","................","................","................","................","................","................","................","............o...","o..og.o..o..g..o","l..gg.gg.g..gg.l","gggggggggggggggg","ggtgggtggggggtgg"],
    path_edge_w: ["gglo............","gg..............","tg..............","gggo............","gggg............","gg..............","tggo............","ggg.............","gg..............","gggo............","gg..............","gg..............","ggggo...........","tgg.............","gg..............","gglo............"],
    path_corner_nw: ["ggglgg..........","glggggo.........","ggggg...........","lgggo...........","ggg.............","gg..............",".o..............","................","................","................","................","................","................","................","................","................"],
    path_corner_ne: ["..........gglggg",".........ogggglg","...........ggggg","...........ogggl",".............ggg","..............gg","..............o.","................","................","................","................","................","................","................","................","................"],
    path_corner_sw: ["................","................","................","................","................","................","................","................","................",".o..............","gg..............","ggg.............","lgggo...........","ggggg...........","glggggo.........","ggglgg.........."],
    path_corner_se: ["................","................","................","................","................","................","................","................","................","..............o.","..............gg",".............ggg","...........ogggl","...........ggggg",".........ogggglg","..........gglggg"],
    // phase 2 ground variants and decals (drawn, not placed yet)
    grass_b: ["gggggggggggggggg","gggggggggggggggg","gggggtgggggggggg","gggglgggggglgggg","gggllltggtgggggg","ggggtglggggggggg","gggggggggggggggg","gggggggggggggggg","gtgtgggggggggggg","gggggggggggglggg","ggggggggggglglgg","ggggggggggggtggg","gggggggggggggggg","gggggggtgggggggg","gggggggggggggggg","gggggggggggggggg"],
    grass_c: ["gggggggggggggggg","gggggggggggggggg","ggygggggggggglgt","ggggggggggggtltg","ggggggggggggtltg","gggggggggggltltg","gggggggggggggggg","gggglggggggtgggg","gggggglggggggggg","gggggtltgggggggg","gggggtltgglggggg","gggggtltgggggggg","gggggggggggggggg","ggggggggygggglgg","gggggggggggggggg","gggggggggggggggg"],
    flower_patch: ["gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","ggggpggggggggggg","gggpypgggggggggg","ggggpggggggwgggg","gggtggggggwywggg","gggggggggggwgggg","ggggggggggggglgg","gggggggggtgggggg","gggglgoggggggggg","gggggoyoggggpggg","ggggggogglgpypgg","ggggggggggggpggg","gggggggggggggggg","gggggggggggggggg"],
    puddle: ["................","................","................","................","................","................",".....bbbbbb.....","...bccccccccb...","..bccssscccccb..","..bccccccccccb..","..bbccccccscbb..","...bbbbbbbbbb...",".....bbbbbb.....","................","................","................"],
    leaf_litter: ["................","................",".........rr.....","..oo.....rp.....","..or............","................","................","...yy...........","...yr...........","............oo..","............or..",".....yy.........",".....yr.........","..........rr....","..........rp....","................"],
  },
  art: {
    // doors (drawn on the wall cell above the door object)
    door_plain_g: ["................","................","...dddddddddd...","...dggggggggd...","...dgllllllgd...","...dglgggglgd...","...dglgggglgd...","...dgllllllgd...","...dggggggggd...","...dgtttttygd...","...dgtggggygd...","...dgtggggtgd...","...dgtggggtgd...","...dgttttttgd...","...dggggggggd...","...dggggggggd..."],
    door_double: ["................","................","..dddddddddddd..","..dooooddooood..","..dyyyyddyyyyd..","..dooooddooood..","..dooooddooood..","..dooooddooood..","..dddddddddddd..","..dooooddooood..","..doooyddyoood..","..dooooddooood..","..dooooddooood..","..dooooddooood..","..dooooddooood..","..dooooddooood.."],
    door_glass: ["................","................","...mmmmmmmmmm...","...mhhhhhhhhm...","...mhsschcchm...","...mhsschcchm...","...mhsschcchm...","...mhccchcchm...","...mhccchcchm...","...mhccchcchm...","...mhccchcchm...","...mhhhhhhhhm...","...mhhhhhhyhm...","...mhhhhhhhhm...","...mhhhhhhhhm...","...mhhhhhhhhm..."],
    door_dutch: ["................","................","...dddddddddd...","...dooooooood...","...doyyyyyyod...","...doyyyyyyod...","...doyyyyyyod...","...dooooooood...","...dddddddddd...","...dyyyyyyyyd...","...dooooooood...","...dooooooood...","...doooooodod...","...dooooooood...","...dooooooood...","...dooooooood..."],
    door_iron: ["................","................","...mmmmmmmmmm...","...moodoodoom...","...moodoodoom...","...mmhmmmmmmm...","...moodoodoom...","...moodoodoom...","...moodoodoom...","...moodoodyom...","...moodoodoom...","...moodoodoom...","...mmmmmmmhmm...","...moodoodoom...","...moodoodoom...","...moodoodoom..."],
    door_tall_t: ["...dddddddddd...","...dttttttttd...","...dtssstsstd...","...dtssstsstd...","...dtssstsstd...","...dtssstsstd...","...dtssstsstd...","...dttttttttd...","...dttttttytd...","...dtnnnnnntd...","...dtnttttntd...","...dtnttttntd...","...dtnttttntd...","...dtnnnnnntd...","...dttttttttd...","...dttttttttd..."],
    door_keeper: ["................","................","...yyyyyyyyyy...","...yggggggggy...","...yggyyyyggy...","...yggyggyggy...","...yggyyyyggy...","...yggggggggy...","...ygggtggggy...","...ygggtggggy...","...ygggtggygy...","...ygggtggggy...","...ygggtggggy...","...ygggtggggy...","...ygggtggggy...","...ygggtggggy..."],
    door_arch: ["................","................","......dddd......","....dddddddd....","...ddooddoodd...","...doyoddoood...","...doooddoood...","...doooddoood...","...doooddoood...","...doooddoood...","...dooyddyood...","...doooddoood...","...doooddoood...","...doooddoood...","...doooddoood...","...doooddoood..."],
    door_slab: ["................","..wwwwwwwwwwww..","..wwwwwwwwwwww..","..mhhhhhhhhhhm..","..mhddddddddhm..","..mhdoooooodhm..","..mhdoooooodhm..","..mhdoooooodhm..","..mhdoooooodhm..","..mhddddddddhm..","..mhdoooooodhm..","..mhdooooyodhm..","..mhdoooooodhm..","..mhdoooooodhm..","..mhdoooooodhm..","..mhdoooooodhm.."],
    door_hangar: ["................","................","..dddddddddddd..","..dhhhhhhhhhhd..","..dmmmmmmmmmmd..","..dhhhhhhhhhhd..","..dmmmmmmmmmmd..","..dhhhhhhhhhhd..","..dmmmmmmmmmmd..","..dhhhhhhhhhhd..","..dmmmmmmmmmmd..","..dhhhhhhhhhhd..","..dmmmmmmmmmmd..","..dhhhyyyyhhhd..","..dmmmyyyymmmd..","..dhhhhhhhhhhd.."],
    door_hatch: ["................","................","...dddddddddd...","...dmmmmmmmmd...","...dmmmhhmmmd...","...dmmhcchmmd...","...dmhcscchmd...","...dmhcccchmd...","...dmmhcchmmd...","...dmmmhhmmmd...","...dmmmmmmmmd...","...dhhhhhhhhd...","...dmmmmmmymd...","...dmmmmmmmmd...","...dmmmmmmmmd...","...dmmmmmmmmd..."],
    door_barn: ["................","................","...dddddddddd...","...dyyyyyyyyd...","...dydoooodyd...","...dydoooodyd...","...dyodoodoyd...","...dyodoodoyd...","...dyooddooyd...","...dyddddddyd...","...dyooddooyd...","...dyodoodoyd...","...dyodoodoyd...","...dydoooodyd...","...dydoooodyd...","...dyyyyyyyyd..."],
    door_gate: ["................","..mmmmmyymmmmm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mhhhhhhhhhhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm..","..mdhdhdhdhdhm.."],
    door_blue: ["................","................","...dddddddddd...","...dbbbbbbbbd...","...dbccccccbd...","...dbcbbbbcbd...","...dbcbbbbcbd...","...dbccccccbd...","...dbbbbbbbbd...","...dbnnnnnybd...","...dbnbbbbnbd...","...dbnbbbbnbd...","...dbnbbbbnbd...","...dbnnnnnnbd...","...dbbbbbbbbd...","...dbbbbbbbbd..."],
    door_red: ["................","................","...dddddddddd...","...drrrrrrrrd...","...drscccccrd...","...drccccccrd...","...drccccccrd...","...drccccccrd...","...drrrrrrrrd...","...drpppppyrd...","...drprrrrprd...","...drprrrrprd...","...drprrrrprd...","...drpppppprd...","...drrrrrrrrd...","...drrrrrrrrd..."],
    door_heavy: ["................","..dddddddddddd..","..dhhhhhhhhhhd..","..dhhmmmmmmhhd..","..dhmmmmmmmmhd..","..dhmmmmmmmmhd..","..dhmmmmmmmmhd..","..dhmmmhhmmmhd..","..dhmmhhhhmmhd..","..dhhmhyyhmhhd..","..dhmmhhhhmmhd..","..dhmmmhhmmmhd..","..dhmmmmmmmmhd..","..dhmmmmmmmmhd..","..dhmmmmmmmmhd..","..dhhmmmmmmhhd.."],
    door_sliding: ["................","................","..hhhhhhhhhhhh..","..hcccchhcccch..","..hcccshhcccch..","..hccschhccsch..","..hcscchhcscch..","..hcccchhsccch..","..hcccchhcccch..","..hcccchhcccch..","..hcccchhcccch..","..hcccchhcccch..","..hcccchhcccch..","..hcccchhcccch..","..hcccchhcccch..","..hmmmmmmmmmmh.."],
    // windows, balconies and awnings (drawn on wall cells)
    win_round: ["................","................","................","......dddd......",".....dcdccd.....","....dcsdcccd....","....dcsdcccd....","...dddddddddd...","....dccdcccd....","....dccdcccd....",".....dcdccd.....","......dddd......","................","................","................","................"],
    win_shutter: ["................","................","................",".gggddddddddggg.",".gggdssdcccdggg.",".tttdssdcccdttt.",".gggddddddddggg.",".gggdccdcccdggg.",".tttdccdcccdttt.",".gggdccdcccdggg.",".gggddddddddggg.","...oooooooooo...","................","................","................","................"],
    win_arch: ["................","................","................",".....oooooo.....","....ooyowyoo....","....oyyoyyyo....","....oyyoyyyo....","....oyyoyyyo....","....oyyoyyyo....","....oyyoyyyo....","....oyyoyyyo....","....oyyoyyyo....","....oooooooo....","...hhhhhhhhhh...","................","................"],
    win_square: ["................","................","................","....oooooooo....","....ossoccco....","....ossoccco....","....oooooooo....","....occoccco....","....occoccco....","....occoccco....","....oooooooo....","...dddddddddd...","................","................","................","................"],
    win_keeper: ["................",".....yyyyyy.....",".....yssccy.....",".....yssccy.....",".....yssccy.....",".....yccccy.....",".....yyyyyy.....",".....yccccy.....",".....yccccy.....",".....yccccy.....",".....yccccy.....",".....yccccy.....",".....yyyyyy.....","....gggggggg....","................","................"],
    win_diamond: ["................","................","................","....dddddddd....","....dhchhchd....","....dhshhchd....","....dchcchcd....","....dhchhchd....","....dhchhchd....","....dchcchcd....","....dhchhchd....","....dddddddd....","...oooooooooo...","................","................","................"],
    win_box: ["................","................","....wwwwwwww....","....wsswcccw....","....wsswcccw....","....wccwcccw....","....wccwcccw....","....wccwcccw....","....wwwwwwww....","...lrlylrlylr...","...oooooooooo...","...oooooooooo...","...dddddddddd...","................","................","................"],
    win_lamp: ["................","................","................","................","....dddddddd....","....doodoood....","....dowdyyod....","....doydyyod....","....doydyyod....","....doodoood....","....dddddddd....","....mmmmmmmm....","................","................","................","................"],
    win_slit: ["................","................","......dddd......","......dcnd......","......dnnd......","......dnnd......","......dnnd......","......dnnd......","......dnnd......","......dnnd......","......dnnd......","......dnnd......","......dddd......","................","................","................"],
    win_strip: ["................","................","dddddddddddddddd","dcscccccdscccccd","dcccccccdccccccd","dddddddddddddddd","................","................","................","................","................","................","................","................","................","................"],
    win_band: ["................","................","................","hhhhhhhhhhhhhhhh","cccccscccccccscc","ccccscccccccsccc","ccccscccccccsccc","cccscccccccscccc","ccscccccccsccccc","hhhhhhhhhhhhhhhh","................","................","................","................","................","................"],
    win_rose: ["................","................",".....hhhhhh.....","....hhpppphh....","...hhppbppphh...","...hprpppprph...","..hhpppyyppphh..","..hpbppyypbpph..","..hhpppyyppphh..","...hprpppprph...","...hhpppbpphh...","....hhpppphh....",".....hhhhhh.....","................","................","................"],
    win_porthole: ["................","................","................",".......mm.......",".....mmmmmm.....","....mmccccmm....","....mcsscccm....","...mhcsscccmm...","...mmcccccchm...","....mccccccm....","....mmccccmm....",".....mmmmmm.....",".......mm.......","................","................","................"],
    win_tall: ["................",".....hhhhhh.....",".....hsscch.....",".....hsscch.....",".....hsscch.....",".....hsscch.....",".....hcccch.....",".....hhhhhh.....",".....hcccch.....",".....hcccch.....",".....hcccch.....",".....hcccch.....",".....hcccch.....",".....hhhhhh.....","....wwwwwwww....","................"],
    balcony_plant: ["................","....dddddddd....","....dscccccd....","....dccccccd....","....dccccccd....","....dccccccd....","...gddddddddg...","..gl.r.....gyl..",".hhhhhhhhhhhhhh.",".mhmhmhmhmhmhmh.",".mhmhmhmhmhmhmh.",".mhmhmhmhmhmhmh.",".mhmhmhmhmhmhmh.","................","................","................"],
    laundry_line: ["................","....dddddddd....","....dscccccd....","....dccccccd....","....dccccccd....","....dccccccd....","....dddddddd....","................","dhdddhdddhdddhdd",".rr..ww..bb..yy.",".rr..ww..bb..yy.",".rr..ww..bb..yy.",".rr......bb.....","................","................","................"],
    awning_r: ["................",".wrrwrrwrrwrrwr.",".wrrwrrwrrwrrwr.",".wrrwrrwrrwrrwr.",".wrrwrrwrrwrrwr.",".r.r.r.r.r.r.r..","...dddddddddd...","...dscccccccd...","...dccccccccd...","...dccccccccd...","...dccccccccd...","...dccccccccd...","...dccccccccd...","...dddddddddd...","................","................"],
    awning_b: ["................",".wbbwbbwbbwbbwb.",".wbbwbbwbbwbbwb.",".wbbwbbwbbwbbwb.",".wbbwbbwbbwbbwb.",".b.b.b.b.b.b.b..","...dddddddddd...","...dscccccccd...","...dccccccccd...","...dccccccccd...","...dccccccccd...","...dccccccccd...","...dccccccccd...","...dddddddddd...","................","................"],
    awning_y: ["................",".wyywyywyywyywy.",".wyywyywyywyywy.",".wyywyywyywyywy.",".wyywyywyywyywy.",".y.y.y.y.y.y.y..","...dddddddddd...","...dscccccccd...","...dccccccccd...","...dccccccccd...","...dccccccccd...","...dccccccccd...","...dccccccccd...","...dddddddddd...","................","................"],
    // roof features
    chimney: ["....mmmdddd.....","....ddddddd.....",".....rrrrp......",".....rrrrp......",".....rorrp......",".....rrrrp......",".....rrrrp......",".....rrrrp......",".....rrorp......",".....rrrrp......",".....rrrrp......","......pppp......","......pppp......","................","................","................"],
    mast: [".......rr.......",".......mh.......",".......mh.......",".......mh.......","....mmmmmmmm....",".......mh.......",".......mh.......",".......mh.......",".....mmmmmm.....",".......mh.......",".......mh.......",".......mh.......",".......mh.......",".......mh.......",".....dddddd.....",".....dddddd....."],
    clock_face: ["................","................",".......dd.......",".....ddmwdd.....","....dwwdwwwd....","...dwwwdwwwwd...","...dwwwdwwwwd...","..dmwwwddddwmd..","..dwwwwwrwwwwd..","...dwwwwwwwwd...","...dwwwwwwwwd...","....dwwwwwwd....",".....ddmwdd.....",".......dd.......","................","................"],
    bell: ["................","....oooooooo....","....oooooooo....","....o......o....","....o..dd..o....","....o..yy..o....","....o.yyyy.o....","....oywyyyyo....","....oyyyyyyo....","....oyyyyyyo....","....oyyyyyyo....","....oyyyyyyo....","....o..oo..o....","....o......o....","....o......o....","................"],
    bunting: ["................","dddd..dddddd..dd","rrr.yyy.bbb.yyy.","rrr.yyy.bbb.yyy.",".r...y...b...y..","................","................","................","................","................","................","................","................","................","................","................"],
    acorn_emblem: ["................",".......d........",".......d........","....oooooooo....","...dooooooood...","...dddddddddd...","...dddddddddd...","....yooooooy....","....yoyooooy....","....yyoooooy....","....yooooooy....","....yyooooyy....","......yyyy......","................","................","................"],
    // porch props
    planter_box: ["................","................","................","................","................","...r..y..w..r...","..ryryyywywryr..","...gl.gl.gl.gl..","..yyyyyyyyyyyy..","..oooooooooooo..","..oooooooooooo..","..oooooooooooo..","..oooooooooooo..","..dddddddddddd..","...dd......dd...","...dd......dd..."],
    fence_post: ["................","................","..y.........y...","..od........od..","..od........od..",".yyyyyyyyyyyyyy.",".oooooooooooooo.","..od........od..","..od........od..","..od........od..",".yyyyyyyyyyyyyy.",".oooooooooooooo.","..od........od..","..od........od..","..od........od..","..od........od.."],
    sign_lodge: ["................","................","................",".dyyyyyyyyyyyyd.",".oooooooooooooo.",".oodddodddoddoo.","oooooooooooooooo",".ooddddddddddoo.",".oooooooooooooo.",".dddddddddddddd.",".......do.......",".......do.......",".......do.......",".......do.......",".......do.......",".......do......."],
    lantern_sign: ["................","................","..dddddddddd....","..md......m.....","..md.....ooo....","..md....ddddd...","..md....dyyyd...","..md....dywyd...","..md....dyyyd...","..md....dyyyd...","..md....dyyyd...","..md....ddddd...","..md....ooooo...","..md............",".ddddd..........",".ddddd.........."],
    bench_long: ["................","................","................","................","yyyyyyyyyyyyyyyy","oodoooooooooodoo","..d..........d..","yydyyyyyyyyyydyy","oooooooooooooooo","dddddddddddddddd",".dd..........dd.",".dd..........dd.",".dd..........dd.",".dd..........dd.",".dd..........dd.","................"],
    cart_prop: ["................","...............d","..ggg..........d","..ggg..r......d.",".ddddddddddddd..",".dooodooodood...",".dooodooodood...",".dooodooodood...",".dooodooodood...",".dooodooodood...",".dddddddddddd...","...ddd...ddd....","..dhhhd.dhhhd...","..dhhhd.dhhhd...","...ddd...ddd....","................"],
    banner_keeper: ["..do............","..doyyyyyyyyy...","..doyyyyyyyyy...","..doggggggggg...","..dogggyyyggg...","..dogggylyggg...","..dogggyyyggg...","..doggggggggg...","..doggggggggg...","..doggggggggg...","..doggg...ggg...","..doggg...ggg...","..do.g.....g....","..do............",".dddd...........",".dddd..........."],
    keep_desk: ["................", "................", "...wwwww........", "..Cwhhhw..y.....", "..Cwhhww..nnCCC.", "..CCCCCC..nnCCC.", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", ".FFBBBBBBBBBBFF.", ".FFBGGGBBGGGBFF.", ".FFBBBBBBBBBBFF.", ".FF..........FF.", ".FF..........FF.", ".FF..........FF.", "................"],
    keep_desk_cpt: ["................", "...........y....", "..........ggg...", "..wwwww...ggg...", "..whhhw...ggg...", "..wwwww...ggg...", "yyyyyyyyyyyyyyyy", "FJJJJJJJJJJJJJJF", "FJJJJJJJJJJJJJJF", "FFFFFFFFFFFFFFFF", "FFBBBBBBBBBBBBFF", "FFBBBByyyyBBBBFF", "FFBBBBBBBBBBBBFF", "FFFFFFFFFFFFFFFF", "FF............FF", "FF............FF"],
    keep_cabinet: ["................", "..hhhhhhhhhhhh..", "..mmCCCmmmmmmm..", "..mmmmmyymmmmm..", "..mmmmmmmmmmmm..", "..mddddddddddm..", "..mmCCCmmmmmmm..", "..mmmmmyymmmmm..", "..mmmmmmmmmmmm..", "..mmmmmmmmmmmm..", "..mddddddddddm..", "..mmCCCmmmmmmm..", "..mmmmmyymmmmm..", "..mmmmmmmmmmmm..", "..mmmmmmmmmmmm..", "..mmmmmmmmmmmm.."],
    keep_wallmap_a: ["................", "FFFFFFFFFFFFFFFF", "FCCCCCCCCCcccccc", "FCDDDDDDCCcccccc", "FCDDDDDDCCcccccc", "FCDDDrDDCCcccccc", "FCDDDDDDCCCCCCCC", "FCCCCCCCBCCCCCCC", "FCCCDDDDBCCCCCCC", "FCCCDDDDBCCCCCCC", "FCCCDDDDBCCCCCCC", "FCCCCCCCCCCCCCCC", "FCCCCCCCCCCCCCCC", "FFFFFFFFFFFFFFFF", "FF..............", "FF.............."],
    keep_wallmap_b: ["................", "FFFFFFFFFFFFFFFF", "cccccCCCCCCCCCCC", "cccccCCCBCCCCCCC", "cccccCCCBCCCCCCC", "CCCCCCCCBCCCCCCC", "DDDDDDDCByCCCCCC", "DDDBBBBBrrBBBCCC", "DDDDDDDCrrCCCCCC", "DDDDDDDCBCCEEEEC", "DDDDDDDCBCCEgEEC", "DDDDDDDCBCCEEEEC", "CCCCCCCCCCCCCCCC", "FFFFFFFFFFFFFFFF", "................", "................"],
    keep_wallmap_c: ["................", "FFFFFFFFFFFFFFFF", "CCCCCCCCCCCCCCCF", "DDDDDCCCwwwwwwCF", "DDDDDCCCwhhhhwCF", "DDDgDCCCwwwwwwCF", "DDDDDCCCwhhhhwCF", "DDDDDCCCwwwwwwCF", "CCCCCCCCwhhhwwCF", "ccccccCCwwwwwwCF", "ccccccCCwwwwwwCF", "ccccccCCCCCCCCCF", "CCCCCCCCCCCCCCCF", "FFFFFFFFFFFFFFFF", "..............FF", "..............FF"],
    keep_radio: ["...C............", "..C.............", "..C.............", "..C.............", "nnnnnnnnnnnnnnnn", "dddddddddddddddd", "dmmmmmmdnnnnnnnd", "dmhhhhmdnmnmnmnd", "dmhkkhmdnmnmnmnd", "dmhhhhmdnmnmnmnd", "dmmmmmmdnnnnnnnd", "dddddddddddddddd", "dlldyydrrdlldssd", "dddddddddddddddd", "dddddddddddddddd", "dddddddddddddddd"],
    keep_radio_rack: ["...nnnnnnnnnn...", "...nddddddddn...", "...ndldldyydn...", "...nddddddddn...", "...nddddddddn...", "...nnnnnnnnnn...", "...nddddddddn...", "...ndssssdddn...", "...nddddddrdn...", "...nddddddddn...", "...nnnnnnnnnn...", "...nddddddddn...", "...ndldmmmmdn...", "...ndddmmmmdn...", "...nddddddddn...", "...nnnnnnnnnn..."],
    keep_insignia: ["................", "...yyyyyyyyyy...", "...ynnnnnnnny...", "...ynnnyynnny...", "...ynnCCCCnny...", "...ynnCyyCnny...", "...ynnCyyCnny...", "...ynnCCCCnny...", "...ynnnyynnny...", "...ynnnnnnnny...", "....nggggggn....", "....nnnnnnnn....", "......nnnn......", "......nnnn......", "................", "................"],
    keep_trophy: [".FFFFFFFFFFFFFF.", ".FhwhhhhhhhhhhF.", ".FhwhhhhhhhhrhF.", ".FhwyyyhhhhhrhF.", ".FhwyyyhhAAArhF.", ".FhwyyyhhAAArhF.", ".FhhhyhhhhhhhhF.", ".FFFFFFFFFFFFFF.", ".FhhhhhhhhhhhhF.", ".FhhyyhhbbhgghF.", ".FhhyyhhbbhgghF.", ".FhhyyhhbbhgghF.", ".FhhyyhhhhhgghF.", ".FhhhhhhhhhhhhF.", ".GGGGGGGGGGGGGG.", ".GGGGGGGGGGGGGG."],
    keep_evidence: [".FFFFFFFFFFFFFF.", ".FCCCCFFFFAAAAF.", ".FCyyCFscFAwwAF.", ".FCCCCFccFAAAAF.", ".FCCCCFccFAAAAF.", ".GGGGGGGGGGGGGG.", ".FDDDDDFFFFBBBF.", ".FDCCDDFhhFBBBF.", ".FDDDDDFhhFBBBF.", ".FDDDDDFhhFBBBF.", ".GGGGGGGGGGGGGG.", ".FwwwFCCCCCCCFF.", ".FwrwFCyCCCCCFF.", ".FwwwFCCCCCCCFF.", ".FwwwFCCCCCCCFF.", ".GGGGGGGGGGGGGG."],
    keep_locker: [".EEEEEEEEEEEEEE.", ".EJJJJJEEJJJJJE.", ".EJEEEJEEJEEEJE.", ".EJJJJJEEJJJJJE.", ".EJEEEJEEJEEEJE.", ".EJJJJJEEJJJJJE.", ".EJJJJJEEJJJJJE.", ".EJJJJJEEJJJJJE.", ".EJJJJyEEyJJJJE.", ".EJJJJyEEyJJJJE.", ".EJJJJJEEJJJJJE.", ".EJJJJJEEJJJJJE.", ".EJCCJJEEJJJJJE.", ".EJJJJJEEJJJJJE.", ".EJJJJJEEJJJJJE.", ".EEEEEEEEEEEEEE."],
    keep_bunk: ["................", "................", ".FFFFFFFFFFFFFF.", ".FCCCCCCCCCCCCF.", ".FCCCCCCCCCCCCF.", ".FCCCCCCCCCCCCF.", ".FggggggggggggF.", ".FggggggggggggF.", ".FggggggggggggF.", ".FJJJJJJJJJJJJF.", ".FggggggggggggF.", ".FggggggggggggF.", ".FggggggggggggF.", ".FyyyyyyyyyyyyF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF."],
    keep_table_tl: ["................", "................", "................", "................", "..FFFFFFFFFFFFFF", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGwwwwwGGGGG", "..FGGGwhhhwGGGGG", "..FGGGwhhwwGGGGG", "..FGGGwwwwwGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG"],
    keep_table_tr: ["................", "................", "................", "................", "FFFFFFFFFFFFFF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGCCCCGGGGGF..", "GGGGCCrCGGGGGF..", "GGGGCCCCGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF.."],
    keep_table_bl: ["..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGyyGGGGGG", "..FGGGGGyyGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FGGGGGGGGGGGGG", "..FFFFFFFFFFFFFF", "..FFFFFFFFFFFFFF", "...FF...........", "...FF...........", "...FF...........", "...FF..........."],
    keep_table_br: ["GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGyGGGGGGGGF..", "GGGnnnGGGGGGGF..", "GGGnnnGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "GGGGGGGGGGGGGF..", "FFFFFFFFFFFFFF..", "FFFFFFFFFFFFFF..", "...........FF...", "...........FF...", "...........FF...", "...........FF..."],
    keep_chair: ["................", "....FFFFFFFF....", "....FJJJJJJF....", "....FJJJJJJF....", "....FJJJJJJF....", "....FJJJJJJF....", "....FJJJJJJF....", "....FFFFFFFF....", "...FJJJJJJJJF...", "...FJJJJJJJJF...", "...FFFFFFFFFF...", "....FF....FF....", "....FF....FF....", "....FF....FF....", "....FF....FF....", "....FF....FF...."],
    keep_maptable: ["................", "................", "................", "................", "FFFFFFFFFFFFFFFF", "FCkCCCCCCCCCCCCF", "FCDDDDDCCccccCCF", "FCDDDDDCCccccCCF", "FCDDDDDCCccccCCF", "FCCCBBBBBBBBcCCF", "FCCCCCCCCCCCCkCF", "FCCCCCCCCCCCCCCF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", ".FF..........FF.", ".FF..........FF."],
    keep_lamp: ["................", "....yyyyyyyy....", "...AAAAAAAAAA...", "...AAyyyyyyAA...", "...AAyyyyyyAA...", "...AAAAAAAAAA...", "..y....CC....y..", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", "....FFFFFFFF....", "....FFFFFFFF...."],
    keep_lamp_wall: ["................", "................", ".......yy.......", "................", ".....yyyyyy.....", ".....yyCCyy.....", "...y.yyCCyy.y...", ".....yyyyyy.....", ".......GG.......", ".......GG.......", ".......GG.......", ".....GGGGGG.....", "................", "................", "................", "................"],
    keep_counter_l: ["................", "................", "....wwwwwww.....", "....whhhhhw.....", "....wwwwwww.....", "yyyyyyyyyyyyyyyy", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "Fnnnnnnnnnnnnnnn", "Fnnnnnnnnnnnnnnn", "Fnnyynnnnnnnnnnn", "Fnnyynnnnnnnnnnn", "Fnnnnnnnnnnnnnnn", "Fnnnnnnnnnnnnnnn", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF"],
    keep_counter_r: ["................", ".........G......", "........yyy.....", "........yyy.....", "................", "yyyyyyyyyyyyyyyy", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "nnnnnnnnnnnnnnnF", "nnnnnnnnnnnnnnnF", "nnnnnnnnnnnyynnF", "nnnnnnnnnnnyynnF", "nnnnnnnnnnnnnnnF", "nnnnnnnnnnnnnnnF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF"],
    keep_standing: ["................", "FFFFFFFFFFFFFFFF", "FJJJJJJJJJJJJJJF", "FJyyyyyyyyJJyyJF", "FJJJJJJJJJJJyyJF", "FJyyyyyyyyyyJJJF", "FJJJJJJJJJJJJJJF", "FJCCCCCCJJJJJJJF", "FJJJJJJJJJJJJJJF", "FJCCCCCCCCCJJJJF", "FJJJJJJJJJJJJJJF", "FJCCCCCJJJJJJJJF", "FJJJJJJJJJJJJJJF", "FFFFFFFFFFFFFFFF", "...FF......FF...", "...FF......FF..."],
    keep_notice: ["................", "................", "FFFFFFFFFFFFFFFF", "FAAAAAAAAAAAAAAF", "FAwrwwAAAAAwbwAF", "FAwwwwACgCCwwwAF", "FAwwwwACCCCwwwAF", "FAwwwwACCCCwwwAF", "FAAAAAAAAAAwwwAF", "FAACCCCCAAAAAAAF", "FAACCCCCAAAAAAAF", "FAACCCCCAAAAAAAF", "FAAAAAAAAAAAAAAF", "FFFFFFFFFFFFFFFF", "................", "................"],
    keep_crate: ["................", "................", "................", "................", "................", ".BBBBBBBBBBBBBB.", ".FGGGGGFGGGGGGF.", ".FGGyyGFGGGGGGF.", ".FGGyyGFGGGGGGF.", ".FGGGGGFGGGGGGF.", ".FFFFFFFFFFFFFF.", ".FGGGGGFGGGGGGF.", ".FGGGGGFGGGGGGF.", ".FGGGGGFGGGGGGF.", ".FGGGGGFGGGGGGF.", ".FFFFFFFFFFFFFF."],
    keep_crate_stack: ["...FFFFFFFFFF...", "...FGGGFGGGGF...", "...FGGGFGGGGF...", "...FGGGFGGGGF...", "...FGGGFGGGGF...", "...FGGGFGGGGF...", "...FFFFFFFFFF...", ".FFFFFFFFFFFFFF.", ".FGGGGGGGGGGGGF.", ".FGGGGGGGGyyGGF.", ".FGGGGGGGGGGGGF.", ".FFFFFFFFFFFFFF.", ".FGGGGGGGGGGGGF.", ".FGGGGGGGGGGGGF.", ".FGGGGGGGGGGGGF.", ".FFFFFFFFFFFFFF."],
    keep_plant: ["........ll......", ".....gg.ll......", ".....gg.ll......", "....lgg.llggg...", "...ElEg.llggg...", "...EEEg...ggg...", "...EEEggggggg...", "...EEEggggggg...", "......gggg......", "................", "................", "....AAAAAAAA....", "....BBBBBBBB....", "....BBBBBBBB....", "....BBBBBBBB....", "....BBBBBBBB...."],
    keep_kettle: ["................", "................", ".....yy.........", "...mmmmmm.......", "...mhhhmmmm.....", "...mhhhmm.......", "...mmmmmm..rrCC.", "...mmmmmm..CCCC.", ".GGGGGGGGGGGGGG.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF."],
    keep_coat: ["................", ".........nnnnn..", ".......FFnnnnn..", ".......FF.yyy...", "....JJJJF.......", "....JggJF.......", "....JggJF.......", "....JggJF.......", "....JggJF.......", "....JJJJF.......", "....JJJJF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", "....FFFFFFFF...."],
    keep_bench: ["................", "................", "................", "................", "................", "................", "GGGGGGGGGGGGGGGG", "FJJJJJJJJJJJJJJF", "FFFFFFFFFFFFFFFF", ".FF..........FF.", ".FF..........FF.", ".FF..........FF.", ".FF..........FF.", ".FF..........FF.", ".FF..........FF.", "................"],
    keep_stair: ["GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "yyyyyyyyyyyyyyyy"],
    lamp_post: [".....dddddd.....",".....ywyyyy.....",".....yywyyy.....",".....yyyyyy.....",".....yyyyyy.....","....dddddddd....",".......dm.......",".......dm.......",".......dm.......",".......dm.......",".......dm.......",".......dm.......",".......dm.......",".......dm.......",".......dm.......",".....dddddd....."],
    apple_crate: ["................","................","................","......g.....g...","......rr....rr..","...rr.rr.gg.rr..","...rrr..rrgrrgg.",".dddrrddrrdrrgg.",".dyyyyyyyyyyyyd.",".dooooooooooood.",".dddddddddddddd.",".dooooooooooood.",".dooooooooooood.",".dooooooooooood.",".dddddddddddddd.","................"],
    hedge_planter: ["................","................","........o.......","....grlggggg....","...glllllgtgg...","..glllllllgggg..","..gglllllgrggg..","..gggglggggggg..","..ggtggggggtgg..","...gggggggggg...","..wwggggggggww..","..hhhhhhhhhhhh..","..hhhhhhhhhhhh..","..hhhhhhhhhhhh..","..mmmmmmmmmmmm..","................"],
    ore_cart: ["................","................","................","...ddyhdddddd...","...hddhhddddd...","..dddddddddddd..","..dmmmmmmmmmmd..","..dmmmmmmmmmmd..","..dmmmmmmmmmmd..","..dmmmmmmmmmmd..","..dmmmmmmmmmmd..","..dddddddddddd..","....ddd...ddd...","....ddd...ddd...","odooodooodododoo","dddddddddddddddd"],
    slab_sign: ["................","..mmmmmmmmmmmm..","..mwwwwwwwwwwm..","..mhhhhhhhhhhm..","..mhhhhhhhhhhm..","..mhhddddddhhm..","..mhhhhhhhhhhm..","..mhddddddddhm..","..mhhhhhhhhhhm..","..mhhdddddhhhm..","..mhhhhhhhhhhm..","..mhhhhhhhhhhm..","..mhhhhhhhhhhm..","..mmmmmmmmmmmm..",".dmmmmmmmmmmmmd.",".dddddddddddddd."],
    windsock: ["................","..md............","..mdyyyy........","..mdoooowwwooo..","..mdoooowwwooow.","..mdoooowww.....","..md............","..md............","..md............","..md............","..md............","..md............","..md............","..md............",".dddd...........",".dddd..........."],
    bollard: ["................","................",".......yy.......",".......yy.......","...wwwwwwwwww...","...hhhhhhhhhh...","....hhhhhhhh....","....mmmmmmmd....","....mymmmmmd....","....mmmmmmmd....","....mmmmmmmd....","....mmmmmmmd....","....mmmmmmmd....","....mmmmmmmd....","....mmmmmmmm....","...dddddddddd..."],
    pole_rack: ["...y.o.y.o.y....","...o.y.o.y.o....",".d.o.y.o.y.o..d.",".ddodydodydoddd.",".d.o.y.o.y.o..d.",".d.o.y.o.y.o..d.",".d.o.y.o.y.o..d.",".d.o.y.o.y.o..d.",".d.o.y.o.y.o..d.",".d.o.y.o.y.o..d.",".d.o.y.o.y.o..d.",".ddodydodydoddd.",".d.o.y.o.y.o..d.",".d.o.y.o.y.o..d.",".d............d.",".d............d."],
    dummy: ["................","......yyyy......","......yooy......",".....yyooyy.....","......yooy......","......yyyy......","....yyyyyyyy....","....oooooooo....",".....rrprrr.....",".....rrprrr.....",".....rrprrr.....",".....rrprrr.....",".....rrprrr.....",".......do.......","....dddddddd....","....dddddddd...."],
    banner_red: ["..do............","..doyyyyyyyyy...","..doyyyyyyyyy...","..dorrrrrrrrr...","..dorrryyyrrr...","..dorrryyyrrr...","..dorrryyyrrr...","..dorrryyyrrr...","..dorrrrrrrrr...","..dorrrrrrrrr...","..dorrr...rrr...","..dorrr...rrr...","..do............","..do............",".dddd...........",".dddd..........."],
    rope_coil: ["................","................","................","................","................","................",".....oooooo....o","...oooyyyyooo.o.","..ooyyyooyyyooo.","..odyooddooyyo..",".ooyooddddooyoo.","..oyyooddooydo..","..ooyyyooyyyoo..","...oooyyyyooo...",".....oooooo.....","................"],
    flag_pole: ["...yh...........","...mhbbbbbbbbb..","...mhbwybbbbbb..","...mhbbbbbbb....","...mhbbbbbbb....","...mhbbbb.......","...mh...........","...mh...........","...mh...........","...mh...........","...mh...........","...mh...........","...mh...........","...mh...........","..dddd..........","..dddd.........."],
    planter_tall: ["................","........l.......",".......lllgg....","......lllllgg...","....ggglllglg...","...ggglglggggg..","...gggggggggg...","...gggggggggg...","....gggg.ggg....","...oooooooooo...","...rrrrrrrrrr...","...rrrrrrrrrr...","...rrrrrrrrrr...","...rrrrrrrrrr...","...pppppppppp...","....dd....dd...."],
    laundry_basket: ["................","................","................","......bbb.......","...wwwbbb.......","...wwwbbbrrr....","...wwwbbbrrr....","..oooooooooooo..","..oyoyoyoyoyoo..","..oooooooooooo..","..ooyoyoyoyoyo..","..oooooooooooo..","..oyoyoyoyoyoo..","..oooooooooooo..","..ooyoyoyoyoyo..","..dddddddddddd.."],
    bike: ["................","................","................","................","..........ddd...","......dddd.b....",".......bb..b....",".......b.b.b....","......b.b.b.b...","..ddddb.b.bdbd..",".dd..bd..bdbb.d.",".d..bbbbbbd.b.d.",".d....d...d...d.",".dd..dd...d...d.","..dddd.....ddd..","................"],
    slate_board: ["................","................",".....oooooo.....","....dddddddd....","....dmmmmmmd....","....dmwwwwmd....","....dmmmmmmd....","....dmwwwmmd....","....dmmmmmmd....","....dmhhhhmd....","....dmmmmmmd....","....dddddddd....","....o......o....","...o........o...","...o........o...","...o........o..."],
    poster_stand: ["................","......d..d......","....wwwwwwww....","....wbbbbbbw....","....wbcbbbbw....","....wbbbbbbw....","....wwwwwwww....","....wrrryyyw....","....wrrryyyw....","....wrrryyyw....","....wwwwwwww....","....wwwwwwww....","....d......d....","...d........d...","...d........d...","...d........d..."],
    stone_urn: ["................","................","......gggg......",".....glgggg.....","....gggggggg....","....ggggglgg....",".....gggggg.....","...wwwggggwww...","...wwwwwwwwww...","....wwwwwwww....","....hhwhhmhh....","....hhwhhmhh....","....hhwhhmhh....","....hhwhhmhh....","....hhwhhmhh....",".....mmmmmm....."],
    planter_round: ["................","......gggg......",".....llllgg.....","....gllllggg....","....gllllggg....","....ggggggtg....",".....gggggg.....","......gggg......",".......od.......",".....hhodhh.....","...hdooodoodh...","..hdoooodooodh..","..hdoooooooodh..","..hhddddddddhh..","...hhhhhhhhhh...",".....hhhhhh....."],
    cafe_table: ["................","................","................","......rr........",".....wrrwyw.....","..whhhhhhhhhhw..",".wwhhhhhhhhhhww.","..wwwwwmdwwwww..",".....wwmdww.....",".......md.......",".......md.......",".......md.......",".......md.......",".......md.......",".....dddddd.....",".....dddddd....."],
    lantern_hook: ["................","................",".......ddddddd..",".......doooooo..",".......do...m...",".......do...m...",".......do.ddddd.",".......do.dyyyd.",".......do.dywyd.",".......do.dyyyd.",".......do.dyyyd.",".......do.ddddd.",".......do.ooooo.",".......do.......",".....dddddd.....",".....dddddd....."],
    woodpile: ["................","................","................","................","................","................",".....oooo..oooo.","....oooyoooooyoo","....ooyyooooyyoo",".....oooo..oooo.","..oooo..oooo..oo",".oooyoooooyooooo",".ooyyooooyyooooy","..oooo..oooo..oo","................",".ddddddddddddddd"],
    barrel: ["................","................","...dddddddddd...","...oooroooroo...","..ddddrdddrddd..","..ooyorooorooo..","..ooyorooorooo..","..ooyorooorooo..","..ooyorooorooo..","..ooyorooorooo..","..ooyorooorooo..","..ddddrdddrddd..","..oooorooorooo..","...oooroooroo...","...dddddddddd...","................"],
    // outdoor props
    rock_big: ["................","................","................","................","................","................","................","........m.......",".....hhhhhmm....","....hwwhhhhmm...","...hhhhhhhhhmm..","...mhhhhhhhmmm..","...mmhhhhhmdmm..","....mmmmmmmmm...","....ddddddddd...","........m......."],
    rock_small: ["................","................","................","................","................","................","................","................","................","................","....mmm.........","..mhwhhmm.......","..mhhhhmm.hmm...","..mmmmmmmmmmmm..","....mmm...mmm...","..dddddddddddd.."],
    flowerbed: ["................","................","................","................","..r..y..w..r.p..",".ryryoywywrypyp.","..gddgddgddgdg..","..dlddlddlddldl.","..dddddddddddd..",".yyyyyyyyyyyyyy.",".oooooooooooooo.",".oooooooooooooo.",".oooooooooooooo.",".oooooooooooooo.",".dddddddddddddd.","................"],
    fence_h: ["................","................","..h.........h...","..wh........wh..","..wh........wh..","wwwhwwwwwwwwwhww","hhwhhhhhhhhhwhhh","..wh........wh..","..wh........wh..","..wh........wh..","wwwhwwwwwwwwwhww","hhwhhhhhhhhhwhhh","..wh........wh..","..wh........wh..","..wh........wh..",".gggggggggggggg."],
    stump: ["................","................","................","................","................","................","..........gl....",".......yy.......","....yyyyyyyy....","...yyoodoooyy...","...yyooooooyy...","...dyyyyyyyyd...","...doooyyoood...","...dooooooood.o.",".o.....oo.......","................"],
    bush: ["................","................","................","................","....tggggrgt....","...tglllggggt...","..tglllllgtggt..",".tglllllllggggt.",".tgglllllgggggt.",".tggtlllggggggt.",".tgggggggggtggt.",".ttggrgggggggtt.","..ttggggggggtt..","...ttggggggtt...","....tttttttt....","...dddddddddd..."],
    log: ["................","................","................","................","................","................","................","................",".........gl.....",".yyyyyyyyyyyyyy.",".yyooodoooodooo.",".oyooodoooodooo.",".yyooodoooodooo.",".dddddddddddddd.","....d...........","................"],
    stone_marker: ["................","................","................",".....hhhhhh.....","....hhwwhhhh....","....mhhhhhhm....","....mhhhhhhm....","....mhmmmmhm....","....mhhhhhhm....","....mhmmmmhm....","....mhhhhhhm....","....mhmmmhhm....","....mhhhhhgm....","....mghhhhhm....","....mhhhhhhm....","...dddddddddd..."],
    signpost: ["................","................",".......do.......","..yyyyyyyyyy....",".oooooooooooo...","..oooooooooo....",".......do.......",".....yyyyyyyyyy.","....oooooooooooo",".....oooooooooo.",".......do.......",".......do.......",".......do.......",".......do.......",".....dddddd.....",".....dddddd....."],
    hay_bale: ["................","................","................","................","................","................","................","..wwwwwwwwwwww..","..yyyoyyyyoyyy..","..yyooyyoyoyyo..","..yyyoyyyyoyyy..","..yyyoyyyyoyyy..","..yyyoyyyyoyyy..","..yyooyoyyoyyy..","..oooooooooooo..","................"],
    flower_clump: ["................","................","................","................","................","................","................",".......y........","...y...ww..w....","...rr......yy...","....gylllllg....","..gglpplllylgg..","..ggllllllrrgg..","..gggllllllggg..","....gggggggg....","................"],
    // STAIR_MARKER decals. step_up's top three rows (0–2) are PAL.k (D222 refinement, design d106bca). The tread edge starts at row 3 and the glint sits on rows 3–4, just under that opening.
    step_up: ["..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..hwwwwwwwwwwh..","..dhhhhhhhhhhd..","..dddddddddddd..",".hwwwwwwwwwwwwh.",".dhhhhhhhhhhhhd.",".dhhhhhhhhhhhhd.",".dddddddddddddd.","hwwwwwwwwwwwwwwh","dmmmmmmmmmmmmmmd","dmmmmmmmmmmmmmmd","dmmmmmmmmmmmmmmd","dmmmmmmmmmmmmmmd","dddddddddddddddd"],
    step_down: ["hwwwwwwwwwwwwwwh","dhhhhhhhhhhhhhhd","dhhhhhhhhhhhhhhd","dhhhhhhhhhhhhhhd","dkkkkkkkkkkkkkkd",".hwwwwwwwwwwwwh.",".dmmmmmmmmmmmmd.",".dmmmmmmmmmmmmd.",".dkkkkkkkkkkkkd.","..hwwwwwwwwwwh..","..dddddddddddd..","..dddddddddddd..","..dkkkkkkkkkkd..","..dkkkkkkkkkkd..","..dkkkkkkkkkkd..","..dkkkkkkkkkkd.."],
    door_step: ["..wwwwwwwwwwww..",".mhhhhhhhhhhhhm.",".mhhhhhhhhhhhhm.",".mmmmmmmmmmmmmm.","...d.d.d.d.d.d..","................","................","................","................","................","................","................","................","................","................","................"],
    door_step_warm: ["..wwwwwwwwwwww..",".GCCCCCCCCCCCCG.",".GCCCCCCCCCCCCG.",".GGGGGGGGGGGGGG.","...F.F.F.F.F.F..","................","................","................","................","................","................","................","................","................","................","................"],
    wayin_glint_up: ["................","................","................",".....wwwwww.....",".....wwwwww.....","................","................","................","................","................","................","................","................","................","................","................"],
    wayin_glint_down: ["................",".....wwwwww.....",".....wwwwww.....","................","................","................","................","................","................","................","................","................","................","................","................","................"],
  },
  big: {
    lm_lantern_post: ["............dddddddd............","..........dddddddddddd..........","..........dddddddddddd..........","...........dyyyooyyyd...........","...........dywwooyyyd...........","...........dywwooyyyd...........","...........dyyyooyyyd...........","...........dyyyooyyyd...........",".........dddddddddddddd.........","...........dddddddddd...........",".............dddmddd............","...............dd...............","...............dm...............","...............dm...............","...............dm...............","...............dm...............","..............dddd..............","...............dm...............","...............dm...............","...............dm...............","..............dddd..............","...............dm...............","...............dm...............","...............dm...............","...............dm...............",".............mmmmmm.............","............mmmmmmmm............","..........ggddddddddgg..........","........rllyddddddddwllr........",".......gyllolyllllolyllyg.......","........gggllllllllllggg........","..........gggggggggggg.........."],
    lm_well: ["..............gggg..............","............gggggggg............","..........tttttttttttt..........","........tttttttttttttttt........","......gggggggggggggggggggg......","....tttttttttttttttttttttttt....","..tttttttttttttttttttttttttttt..","gggggggggggggggggggggggggggggggg","tttttttttttttttttttttttttttttttt","tddddddddddddddddddddddddddddddt","......od................od......","......od................odddd...","......oddddddddhddddddddod..d...","......od.......h........od..d...","......od.......h........od..d...","......od.......h........od......","......od.......h........od......","......od.......h........od......","......od.....ddddd......od......","......od.....ooooo......od......","......od.....ooooo......od......","......od..mhhdddddhhhm..od......","......odmhhddddddddddhhmod......","......odhddbbcccbbbbbddhod......","......mhhddbbbbbbbbbbddhhm......","......mhhhddbbbbbbbbddhhhm......","......mmmhhhmhhhhhhmhhhmmm......",".......mmdmhhdhhhhhhdmmmd.......","........mmmmmmmmmmmmmmmm........",".......dddddddddddddddddd.......","................................","................................"],
    lm_statue: ["......................dddd......","...............mm.....yyyy......","............mmmmmmmm..ywyy......","............mmmmmmmm..yyyy......",".............hhhhhh...yyyy......",".............hmhhhh...hm........",".............hhhhhh...hm........",".............hhhhhh..hm.........",".............mhhhhm..hm.........",".............mhhhhmhhm..........","..........hhhmhhhhmhh...........","..........mhhmhhhhm.............","..........m..mhmhhm.............","..........m..mhmhhm.............",".........m...mhmhhm.............",".......dhdd..mhmhhm.............",".......dddd..mhmhhm.............",".......dddd..mmmhmm.............",".............mmmhmm.............",".............mmmhmm.............",".............mmmhmm.............","...........mmmmmmmmmm...........","...........mmmmmmmmmm...........",".........wwwwwwwwwwwwww.........",".........hhhhhhhhhhhhhh.........",".........hhhmmmmmmmmhhh.........",".........mmmmmmmmmmmmmm.........",".......hhhhhhhhhhhhhhhhhh.......",".......mmmmmmmmmmmmmmmmmm.......",".......mmmmmmmmmmmmmmmmmm.......",".......dddddddddddddddddd.......","................................"],
    lm_signal_mast: [".........y...dddddd...y.........",".............dorrrd.............","..........y..drrrrd..y..........",".............dddddd.............","............mmmmmmmm............","...............dd...............","...............mm...............","...............dd...............","...............hh...............","..............hddh..............","..............hmmh..............",".............hd..dh.............",".............hmmmmh.............","............h.d..d.h............","............h.dmmd.h............","...........h..d..d..h...........","...........h..mmmm..h...........","..........h...d..d...h..........","..........h..d.mm.d..h..........",".........h...d....d...h.........","........h....mmmmmm....h........","........h....d....d....h........",".......h.....d.mm.d.....h.......",".......h.....d....d.....h.......","......h......mmmmmm......h......","......h.....d......d.....h......",".....h......d..mm..d......h.....",".....h......hhhhhhhh......h.....","....h.......mmmmmmmm.......h....","..ddd.......mmmmmmmm.......ddd..","..ddd......dddddddddd......ddd..","................................"],
    lm_big_tree: ["................................","................................",".........ttggggggggggtt.........",".......tggglggggggggggggt.......",".....tggllllwllgggggggggggt.....","....tgllllwllllllgttgggggggt....","...tgglllllllllllgggggggggggt...","..tgglllllllllllllgggggggggggt..","..tgggllwllllllllggggggggttggt..",".ttggttllllllllllgggrggggggggtt.",".tgggggglllllllgggggggggggggggt.",".ttgggggggglgggggggggggggggggtt.",".ttggggttgggggggggggggggrggggtt.",".ttggggggrgggggggggggggggggggtt.","..ttggggggggggggggggggggggggtt..","..tttggggggggttgggggggttgggttt..","...tttggggggggggggggggggggttt...","....ttttggggggggggggggggtttt....",".....ttttttggggggggggtttttt.....",".......tttttttttttttttttt.......",".........tttttttttttttt.........",".............doyood.............",".............doyood.............",".............doyood.............",".............doyood.............",".............doyood.............",".............doyood.............",".............doyood.............","...........dddooooddd...........",".........dddodoooododdd.........",".........ddoddddddddodd.........","...........dddddddddd..........."],
    regenx_facade: ["hwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwh","hwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwh","hwsssssssssssssssssssssssssssswh","hwllllllllllllllllllllllllllllwh","hwlllwwllwwllwwllwwllwwllwwlllwh","hwllwwwllwwllwwllwwllwwllwwwllwh","hwlllwwllwwllwwllwwllwwllwwlllwh","hwllllllllllllllllllllllllllllwh","hwggggggggggggggggggggggggggggwh","hwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwh","hwhhhhhhhhllllllllllllhhhhhhhhwh","hwhsscccchllllllllllllhsscccchwh","hwhsscccchhhhhhhhhhhhhhsscccchwh","hwhcccccchhcccchhcccchhcccccchwh","hwhcccccchhcccchhcccchhcccccchwh","hwhcccccchhcccshhcccchhcccccchwh","hwhcccccchhccschhcccchhcccccchwh","hwhhhhhhhhhccschhccschhhhhhhhhwh","hwwwwwwwwwhcscchhcscchwwwwwwwwwh","hwwwwwwwwwhcccchhcscchwwwwwwwwwh","hwwwwwwwwwhcccchhsccchwwwwwwwwwh","hwwwwwwwwwhcccchhcccchwwwwwwwwwh","hwwwwwwwwwhcccchhcccchwwwwwwwwwh","hwwwwwwwwwhcccchhcccchwwwwwwwwwh","hwwwwwwwwwhcccchhcccchwwwwwwwwwh","hwwwwwwwwwhcccchhcccchwwwwwwwwwh","hwwwwwwwwwhcccchhcccchwwwwwwwwwh","hwwwwwwwwwhcccchhcccchwwwwwwwwwh","hwwwwwwwwwhcccchhcccchwwwwwwwwwh","hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh","mmmmmmmmmmhcccchhcccchmmmmmmmmmm","hwwwwwwwwwhmmmmmmmmmmhwwwwwwwwwh"],
    tunnel_mouth: ["................................",".......whh............whh.......","......hhhhh..........hhhhh......",".......hhh....gg......hhh.......","......gg.whh.......whh..........","........hhhhh.....hhhhh.........",".........hhhmmmmmmmhhh..gg......","........dmmmmmmmmmmmmmmd........","....whhmmmmmmmmmmmmmmmmmmwhh....","...hhhyyyyyyyyyyyyyyyyyyyyhhh...","....hhoooooooooooooooooooodd....","....mmddddddddddddddddddddmd....","...dmmoodkkkookkkkookkkdoomdd...","..dmmmoodkkokkkkkkkkokkdoomdmd..","..dmmmoodookkkkkkkkkkoodooyyyd..","..mmmmoodkkkkkkkkkkkkkkdooywym..",".dwhhmoodkkkkkkkkkkkkkkdooyyymd.",".hhhhhoodkkkkkkkkkkkkkkdooyyyhd.",".dhhhmoodkkkkkkkkkkkkkkdoodddhh.",".dmmmmoodkkkkkkkkkkkkkkdoomhhhd.",".dmmmmoodkkkkkkkkkkkkkkdoommmmd.",".dmmmmoodkkkkkkkkkkkkkkdoommmmd.",".ddmmmoodkkkkkkkkkkkkkkdoommmdd.","..dmmmoodkkkkkkkkkkkkkkdoommmd..","..ddmmoodkkkkkkkkkkkkkkdoommdd..","..ddmmoodkkkkkkkkkkkkkkdoommdd..","...ddmoodkkkkkkkkkkkkkkdoomdd...","....ddoodkkokkkokkkokkkdoodd....",".....doodmmommmommmommmdood.....","......oodkkokkkokkkokkkdoo......","......oodmmommmommmommmdoo......","......oodkkokkkokkkokkkdoo......"],
  },
};
const LIZZY_ART = {
  tiles: {
    roof_hip_t: ["ncttncttncttnctt", "ntttntttntttnttt", "ntttntttntttnttt", "nnnnnnnnnnnnnnnn", "ttncttncttncttnc", "ttntttntttntttnt", "ttntttntttntttnt", "nnnnnnnnnnnnnnnn", "ncttncttncttnctt", "ntttntttntttnttt", "ntttntttntttnttt", "nnnnnnnnnnnnnnnn", "ttncttncttncttnc", "ttntttntttntttnt", "ttntttntttntttnt", "nnnnnnnnnnnnnnnn"],
    wall_batten_w: ["wwwhwwwhwwwhwwwh", "wwwhwwwhwwwhwwwh", "wwwhwwwhwwwhwwwh", "wwwhwwwhwwwhwhwh", "wwwhwwwhwwwhwwwh", "whwhwwwhwwwhwwwh", "wwwhwwwhwwwhwwwh", "wwwhwwwhwwwhwwwh", "wwwhwwwhwwwhwwwh", "wwwhwwwhwwwhwwwh", "wwwhwwwhwhwhwwwh", "wwwhwwwhwwwhwwwh", "wwwhwwwhwwwhwwwh", "wwwhwwwhwwwhwwwh", "wwwhwwwhwwwhwwwh", "hhhhhhhhhhhhhhhh"],
    roof_flat_tank: ["wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "mmmmmmmmmmmmmmmm", "hhhhhhhhhhhhhhhh", "hhhhhhhmhhhhhhhh", "hhmhhhhhhhhhhhhh", "hhhhhhhhhhhhmhhh", "hhhhhwhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhmhhhhhhhhwhh", "hhhhhhhhhhmhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhwhhhhhmh", "hmhhhhhhhhhhhhhh", "hhhhhhmhhhhhhhhh", "hhhhhhhhhhhmhhhh"],
    wall_stucco_o_tall: ["yyyyyyyyyyyyyyyy", "yyyyyoyyyyyyyyyy", "yoyyyyyyyyyyyoyy", "yyyyyyyyyoyyyyyy", "yyyyyyyyyyyyyyyy", "yyyyyyyoyyyyyyyy", "yyyoyyyyyyyoyyyy", "oooooooooooooooo", "yyyyyyyyyyyyyyyy", "yyyyyyyyyyyyyyyy", "yyyyyyyyyyoyyyyy", "yyoyyyyyyyyyyyyy", "yyyyyyoyyyyyyyyy", "yyyyyyyyyyyyyyoy", "yyyyoyyyyyyyyyyy", "oooooooooooooooo"],
    wall_wainscot_t: ["nnnnnnnnnnnnnnnn", "tttttttttttttttt", "tttttttttttttttt", "tttttttttttttttt", "tttttttttttttttt", "ttttnttttttttttt", "tttttttttttttttt", "tttttttttttttttt", "tttttttttttttttt", "tttttttttttntttt", "tttttttttttttttt", "tttttttttttttttt", "tttttttntttttttt", "tttttttttttttttt", "tttttttttttttttt", "nnnnnnnnnnnnnnnn"],
    wall_wainscot_t_face: ["wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwnwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwnwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "cccccccccccccccc", "tttttttttttttttt", "tttntttntttntttn", "tttntttntttntttn", "tttntttntttntttn", "tttntttntttntttn", "tttntttntttntttn", "dddddddddddddddd"],
    wall_wainscot_t_win: ["wwwwwwwwwwwwwwww", "wwwwccccccccwwww", "wwwwcwscssscwwww", "wwnwcsscssscwwww", "wwwwcsscssscwwww", "wwwwcsscssscwwww", "wwwwccccccccwwww", "wwwwwwwwwwwwwwww", "cccccccccccccccc", "tttttttttttttttt", "tttntttntttntttn", "tttntttntttntttn", "tttntttntttntttn", "tttntttntttntttn", "tttntttntttntttn", "dddddddddddddddd"],
    floor_school_check: ["mmmmhhhhmmmmhhhh", "mwmmhhhhmmmmhhhh", "mmmmhhhhmmmmhhhh", "mmmmhhhhmmmmhhhh", "hhhhmmmmhhhhmmmm", "hhhhmmmmhhhhmmmm", "hhhhmmmmhhwhmmmm", "hhhhmmmmhhhhmmmm", "mmmmhhhhmmmmhhhh", "mmmmhhhhmmmmhhhh", "mmmmhhhhmmmmhhhh", "mmmmhhhhmmmmhhhh", "hhhhmmmmhhhhmmmm", "hhhhmmmmhhhhmwmm", "hhhhmmmmhhhhmmmm", "hhhhmmmmhhhhmmmm"],
    floor_school_tile: ["wwwwwwwhwwwwwwwh", "wwwwwwwhwwwwwwwh", "wwcwwwwhwwwwwwwh", "wwwwwwwhwwwwwwwh", "wwwwwwwhwwwwcwwh", "wwwwwwwhwwwwwwwh", "wwwwwwwhwwwwwwwh", "hhhhhhhhhhhhhhhh", "wwwhwwwwwwwhwwww", "wwwhwwwwwwwhwwww", "wwwhwwwwwwwhwwww", "wwwhwwcwwwwhwwww", "wwwhwwwwwwwhwwww", "wwwhwwwwwwwhwwww", "wwwhwwwwwwwhwwww", "hhhhhhhhhhhhhhhh"],
    floor_school_lino: ["CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCChCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCChCCCC", "DDDDDDDDDDDDDDDD", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCCChCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCChCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "hhhhhhhhhhhhhhhh"],
    runner_school: ["rrrrrrrrrrrrrrrr", "yyyyyyyyyyyyyyyy", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rorrrorrrorrrorr", "rrrorrrorrrorrro", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "yyyyyyyyyyyyyyyy", "rrrrrrrrrrrrrrrr"],
    rug_reading: ["nnnnnnnnnnnnnnnn", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbcbbybbbbbbbbb", "bbbbbbbbbbbcbbbb", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbbybbbbbbbbbbb", "bbbbbbbcbbbbbbbb", "bbbbbbbbbbbbybbb", "bbbbbbbbbbbbbbbb", "bbcbbbbbbbbbbbbb", "bbbbbbbbbbbbbcbb", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "nnnnnnnnnnnnnnnn"],
    mat_school: ["nnnnnnnnnnnnnnnn", "nttttttttttttttn", "nttttttttttttttn", "nttttttttttttttn", "nttttttttttttttn", "nttttttttttttttn", "nttttttttttttttn", "nttcctcctcctcctn", "nttcctcctcctcctn", "nttttttttttttttn", "nttttttttttttttn", "nttttttttttttttn", "nttttttttttttttn", "nttttttttttttttn", "nttttttttttttttn", "nnnnnnnnnnnnnnnn"],
    wall_wainscot_n: ["dddddddddddddddd", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnndnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnndnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnndnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "dddddddddddddddd"],
    wall_wainscot_n_face: ["wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwdwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwdwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "bbbbbbbbbbbbbbbb", "nnnnnnnnnnnnnnnn", "nnndnnndnnndnnnd", "nnndnnndnnndnnnd", "nnndnnndnnndnnnd", "nnndnnndnnndnnnd", "nnndnnndnnndnnnd", "dddddddddddddddd"],
    wall_wainscot_n_win: ["wwwwwwwwwwwwwwww", "wwwwnnnnnnnnwwww", "wwwwnwsnsssnwwww", "wwdwnssnsssnwwww", "wwwwnssnsssnwwww", "wwwwnssnsssnwwww", "wwwwnnnnnnnnwwww", "wwwwwwwwwwwwwwww", "bbbbbbbbbbbbbbbb", "nnnnnnnnnnnnnnnn", "nnndnnndnnndnnnd", "nnndnnndnnndnnnd", "nnndnnndnnndnnnd", "nnndnnndnnndnnnd", "nnndnnndnnndnnnd", "dddddddddddddddd"],
    floor_lobby_tile: ["hhwwwwwwhhwwwwwh", "whhwwwwwwhhwwwwh", "wwwwwwwwwwwwwwwh", "wwwwwwwwwwwwwwwh", "wwwwhhwwwwwwhhwh", "wwwwwhhwwwwwwhhh", "wwwwwwwwwwwwwwwh", "wwwwwwwwwwwwwwwh", "hhwwwwwwnhwwwwwh", "whhwwwwwwhhwwwwh", "wwwwwwwwwwwwwwwh", "wwwwwwwwwwwwwwwh", "wwwwhhwwwwwwhhwh", "wwwwwhhwwwwwwhhh", "wwwwwwwwwwwwwwwh", "hhhhhhhhhhhhhhhh"],
    floor_lobby_terrazzo: ["hhhhhhhhhhhhhhhh", "hwhhhwhhhhwhhhhh", "hhhhhhhhChhhhhhh", "hhwhhhhhhhhhmhhh", "hhhhhchhhhhhhhhh", "hhhhhhhhhwhhhhhh", "hmhhhhhhhhhhhhwh", "hhhhhhwhhhhhhhhh", "hhhhhhhhhhhchhhh", "hwhhhhhhhhhhhhhh", "hhhhhmhhhhhwhhhh", "hhhhhhhhhhhhhhhh", "hhchhhhhhhwhhhhh", "hhhhhhhwhhhhhhhh", "hhhhhhhhhmhhhhhh", "hhhhhhhhhhhhhhhh"],
    rug_lobby: ["nnnnnnnnnnnnnnnn", "wwwwwwwwwwwwwwww", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nbnnnbnnnbnnnbnn", "nnnbnnnbnnnbnnnb", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "wwwwwwwwwwwwwwww", "nnnnnnnnnnnnnnnn"],
    lift_doors: ["mmmmmmmyymmmmmmm", "mmmmmmymmymmmmmm", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "hhhwhhhdmhhhwhhh", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "hhhhhhhdmhhhhhhh", "dddddddddddddddd"],
    stairs_up: ["poooooooooooooop", "pddddddddddddddp", "poooooooooooooop", "poooooooooooooop", "pddddddddddddddp", "pyyyyyyyyyyyyyyp", "poooooooooooooop", "pddddddddddddddp", "poooooooooooooop", "poooooooooooooop", "pddddddddddddddp", "pyyyyyyyyyyyyyyp", "poooooooooooooop", "pddddddddddddddp", "poooooooooooooop", "poooooooooooooop"],
    mat_lobby: ["dddddddddddddddd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dnnwwnwwnwwnwwnd", "dnnwwnwwnwwnwwnd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dnnnnnnnnnnnnnnd", "dddddddddddddddd"],
    wall_home_5b: ["CCCCCCCCCCCCCCCC", "CCCCCCCCCyCCCCCC", "CCyCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCyCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CyCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCyCCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "oooooooooooooooo", "oooooooooooooooo", "yyyyyyyyyyyyyyyy", "dddddddddddddddd"],
    wall_home_5b_face: ["yyyyyyyyyyyyyyyy", "yyyyyyyyyyyyyyyy", "yyyyyyyyyyyyyyyy", "yypyyyyyyyyyyyyy", "yyyyyyyyyyyyyyyy", "yyyyyyyyyypyyyyy", "yyyyyyyyyyyyyyyy", "yyyyyyyyyyyyyyyy", "wwwwwwwwwwwwwwww", "CCCCCCCCCCCCCCCC", "CCyCCCCCCCCCCyCC", "CCCCCCCCCCCCCCCC", "oooooooooooooooo", "oooooooooooooooo", "yyyyyyyyyyyyyyyy", "dddddddddddddddd"],
    wall_home_5b_win: ["yyyyyyyyyyyyyyyy", "yyyywwwwwwwwyyyy", "yyyywwswssswyyyy", "yypywsswssswyyyy", "yyyywsswssswyyyy", "yyyywsswssswyyyy", "yyyywwwwwwwwyyyy", "yyyyyyyyyyyyyyyy", "wwwwwwwwwwwwwwww", "CCCCCCCCCCCCCCCC", "CCyCCCCCCCCCCyCC", "CCCCCCCCCCCCCCCC", "oooooooooooooooo", "oooooooooooooooo", "yyyyyyyyyyyyyyyy", "dddddddddddddddd"],
    floor_terracotta: ["ooooooopooooooop", "ooooooopooooooop", "ooyoooopooooooop", "ooooooopooooooop", "ooooooopooooyoop", "ooooooopooooooop", "ooooooopooooooop", "pppppppppppppppp", "ooopooooooopoooo", "ooopooooooopoooo", "ooopooooooopoooo", "ooopooyoooopoooo", "ooopooooooopoooo", "ooopooooooopoooo", "ooopooooooopoooo", "pppppppppppppppp"],
    floor_honey: ["yyyyyoyyyyyyyyyy", "yyyyyoyyywyyyyyy", "yyyyyoyyyyyyyyyy", "oooooooooooooooo", "yyyyyyyyyyyyoyyy", "yyywyyyyyyyyoyyy", "yyyyyyyyyyyyoyyy", "oooooooooooooooo", "yyoyyyyyyyyyyyyy", "yyoyyyyyyyyyywyy", "yyoyyyyyyyyyyyyy", "oooooooooooooooo", "yyyyyyyyyoyyyyyy", "yyyyyywyyoyyyyyy", "yyyyyyyyyoyyyyyy", "oooooooooooooooo"],
    rug_kitchen: ["rrrrrrrrrrrrrrrr", "yyyyyyyyyyyyyyyy", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rwrrrwrrrwrrrwrr", "rrrwrrrwrrrwrrrw", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrr", "yyyyyyyyyyyyyyyy", "rrrrrrrrrrrrrrrr"],
    runner_hall: ["gggggggggggggggg", "llllllllllllllll", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "gygggygggygggygg", "gggygggygggygggy", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "llllllllllllllll", "gggggggggggggggg"],
    carpet_navy: ["nnnnnnnnnnnnnnnn", "nnnnnnbnnnnnnnnn", "nbnnnnnnnnnnnnnn", "nnnnnnnnnnnbnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnbn", "nnnbnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnbnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnbnnn", "nnbnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnb", "nnnnnnbnnnnnnnnn"],
    mat_home_5b: ["pppppppppppppppp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "prryyryyryyryyrp", "prryyryyryyryyrp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "prrrrrrrrrrrrrrp", "pppppppppppppppp"],
    // LIZZY C 5B (D173). floor_paint_plank is redrawn for D184: 7px boards, k groove, n shade, a few flecks.
    floor_bath_tile: ["wwwwwwwhwwwwwwwh","wwwwwwwhwcwwwwwh","wwwwwwwhwwwwwwwh","wwwcwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwswwh","wwwwwwwhwwwwwwwh","hhhhhhhchhhhhhhc","wwwwwwwhwwwwwwwh","wwwwswwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwcwwwh","wcwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","wwwwwwwhwwwwwwwh","hhhhhhhchhhhhhhc"],
    rug_sunflower: ["yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyywyyyyyyyy","yyyyywywywyyyyyy","yyyyyywwwyyyyyyy","yyyywwwowwwyyyyy","yyyyyywwwyyyyyyy","yyyyywywywyyyyyy","yyyyyyywyyyyyyyy","yyyyyyylyyyyyyyy","yyyyyyllyyyyyyyy","yyyyyyylyyyyoyyy","yyoyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyoyyyyy","yyyyyyyyyyyyyyyy"],
    rug_fern: ["gggggggggggggggg","ggglggggggggglgg","gglglgggggggglgg","ggglglggggglglgg","gggglglgggglgggg","ggggglgggglglggg","ggggggggglglgggg","ggtggggggglggggg","gggggggggggggtgg","gglggggggggggggg","gglglggggglggggg","ggglglggglglgggg","gggglglgglglgggg","ggggglgglglggggg","gggggggggglggggg","gggggggggggggggg"],
    rug_domino: ["dddddddddddddddd","dwwwwwwwddwwwwwd","dwkwwwkwddwkwwwd","dwwwwwwwddwwwwwd","dwkwwwkwddwwkwwd","dmmmmmmmddwwwwwd","ddddddddddmmmmmd","dddddddddddddddd","dwwwwwddwwwwwwwd","dwwkwwddwwwwwkwd","dwwwwwddwwwkwwwd","dwwkwwddwkwwwwwd","dmmmmmddwmmmmmmd","dddddddddddddddd","dddddddddddddddd","dddddddddddddddd"],
    floor_paint_plank: ["dddddddddddddddd","dddddddddddrdddd","ddddbddddddddddd","dddddddddydddddd","dddddddddddddddd","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","kkkkkkkkkkkkkkkk","dddddddddgdddddd","dddddddddddddcdd","ddoddddddddddddd","dddddddddrdddddd","dddddddddddddddd","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","kkkkkkkkkkkkkkkk"],
  },
  art: {
    door_double_r: ["................", "..dddddddddddd..", "..drrrrdprrrrd..", "..drwssdpwssrd..", "..drsssdpsssrd..", "..drsssdpsssrd..", "..drsssdpsssrd..", "..drrrrdprrrrd..", "..drrrrdprrrrd..", "..drrrrdprrrrd..", "..drrrydpyrrrd..", "..drrrrdprrrrd..", "..drrrrdprrrrd..", "..drrrrdprrrrd..", "..drrrrdprrrrd..", "..dooooooooood.."],
    win_tall_pane: ["................", "....cccccccc....", "....cwswsssc....", "....csswsssc....", "....csswsssc....", "....csswsssc....", "....csswsssc....", "....cwwwwwwc....", "....csswwssc....", "....csswsssc....", "....csswsssc....", "....csswsssc....", "....csswsssc....", "....cccccccc....", "...wwwwwwwwww...", "................"],
    door_glass_awning: [".nwwnnwwnnwwnnw.", ".nwwnnwwnnwwnnw.", ".nwwnnwwnnwwnnw.", ".dddddddddddddd.", "....nnnnnnnn....", "....nscncscn....", "....ncsncccnydy.", "....nccncccnyyy.", "....nccncccn....", "....nccncccn....", "....nccncccn....", "....nccncccn....", "....nccncccn....", "....nccncccn....", "....nccncccn....", "....nccncccn...."],
    win_stack: ["................", "....nnnnnnnn....", "....nscncccn....", "....nccncccn....", "....nccncccn....", "....nccncccn....", "...wwwwwwwwww...", "................", "....nnnnnnnn....", "....nscncccn....", "....nccncccn....", "....nccncccn....", "....nccncccn....", "...wwwwwwwwww...", "................", "................"],
    weathervane: ["................", "........gggg....", ".......dglggg...", "........gggg....", ".......d........", ".......d........", ".......d........", ".......d........", "....ydddddy.....", ".......d........", ".......d........", ".......d........", ".......d........", ".......d........", ".......d........", ".......d........"],
    water_tank: ["................", "...dddddddddd...", "....hhhhhhhh....", "....mhmmmmmm....", "....mhmmmmmm....", "....mhmmmmmm....", "....dddddddd....", "....mhmmmmmm....", "....mhmmmmmm....", "....mhmmmmmm....", ".....d....d.....", ".....d....d.....", ".....d....d.....", ".....dddddd.....", ".....d....d.....", ".....d....d....."],
    hopscotch: ["................", "......wwww......", "......w..w......", "......w..w......", "......wwww......", "...wwww..wwww...", "...w..w..w..w...", "...w..w..w..w...", "...wwww..wwww...", "......wwww......", "......w..w......", "......w..w......", "......wwww......", "........y.......", ".......y.y......", "................"],
    water_bowl: ["................", "................", "................", "................", "................", "................", "................", "................", "................", "................", "....bswssssb....", "...bbbbbbbbbb...", "....nnnnnnnn....", "................", "................", "................"],
    planter_geranium: ["................", "................", "................", "................", "..rorrorrorror..", "..rrrrrrrrrrrr..", "...g..g..g..g...", "...g..g..g..g...", "...gl.gl.gl.gl..", "...g..g..g..g...", "..yyyyyyyyyyyy..", "..oooooooooooo..", "..oooooooooooo..", "..oooooooooooo..", "..pppppppppppp..", "................"],
    desk_school_small: ["................", "................", "................", ".....wwww.......", ".....whhw.......", ".....wwww.g.....", "..yyyyyyyyyyyy..", "..oooooooooooo..", "..oooooooooooo..", "..pppppppppppp..", "...d........d...", "...d........d...", "...d........d...", "...d........d...", "...d........d...", "...d........d..."],
    desk_teacher: ["................", "................", "................", "..........www...", "...yyyy...rrrw..", "...yooy...www...", "...yyyy...www...", ".yyyyyyyyyyyyyy.", ".oooooooooooooo.", ".ooppppoooooooo.", ".ooppppoooooooo.", ".ooppypoooooooo.", ".ooppppoooooooo.", ".oooooooooooooo.", ".p............p.", ".p............p."],
    walkling_cubbies: ["................", "yyyyyyyyyyyyyyyy", "oooooooooooooooo", "oppppoppppoppppo", "opwppopwppopwppo", "oppppoppppoppppo", "oyyyyobbbborrrro", "oyyyyobbbborrrro", "oooooooooooooooo", "oppppoppppoppppo", "opwppopwppopwppo", "oppppoppppoppppo", "oyyyyobbbborrrro", "oyyyyobbbborrrro", "oooooooooooooooo", "oooooooooooooooo"],
    water_trough: ["................", "................", "................", "................", "................", "................", "................", "................", ".hhhhhhhhhhhhhh.", ".msswsssssssssm.", ".mssssssswssssm.", ".mmmmmmmmmmmmmm.", ".mmmmmmmmmmmmmm.", ".mmmmmmmmmmmmmm.", "..d..........d..", "..d..........d.."],
    coat_pegs: ["................", "................", ".oooooooooooooo.", ".pphppphpppphpp.", "..ggg..yy..ooo..", "..yyy..yy..oro..", "..ggg..yy..oro..", "..ggg..yy..oro..", "..ggg..yy..oro..", "..ggg..yy..oro..", "..ggg..g...oro..", "..ggg......oro..", "................", "................", "................", "................"],
    map_stand: ["................", "..yyyyyyyyyyyy..", "..ylllllllllly..", "..ylgggglltlly..", "..ylggygllllly..", "..ylgggglcccly..", "..yllllllcccly..", "..yllllllcccly..", "..ylllllllllly..", "..yyyyyyyyyyyy..", ".......d........", ".......d........", ".......d........", ".......d........", ".......d........", "....dddddddd...."],
    lift_panel: ["................", "................", ".....mmmmmm.....", ".....mhhhhm.....", ".....mhddhm.....", ".....mhhhhm.....", ".....mhdyhm.....", ".....mhhhhm.....", ".....mhddhm.....", ".....mhhhhm.....", ".....mhddhm.....", ".....mhhhhm.....", ".....mhrhhm.....", ".....mmmmmm.....", "................", "................"],
    mailbox_wall: ["................", "................", ".dddddddddddddd.", ".dhhhdhhhdhhhdd.", ".dhmhdhmhdhmhdd.", ".dhhhdhhhdhhhdd.", ".dhhhdhhhdhhhdd.", ".dddddddddddddd.", ".dhhhdhhhdyyydd.", ".dhmhdhmhdyoydd.", ".dhhhdhhhdyyydd.", ".dhhhdhhhdyyydd.", ".dddddddddddddd.", ".dddddddddddddd.", "................", "................"],
    plant_pot_big: ["................", "................", ".......lgg......", ".......ggg......", "....lgg...lgg...", "....ggg...ggg...", ".......ldg......", ".....lggdggg....", ".....gggdggg....", "........d.......", "........d.......", "....yyyyyyyy....", "....oooooooo....", "....oooooooo....", "....oooooooo....", "....oooooooo...."],
    door_office_shut: ["................", "...pppppppppp...", "...poooooooop...", "...poyyyyyyop...", "...poyddddyop...", "...poydddyyop...", "...poyyyyyyop...", "...poooooooop...", "...poooooooop...", "...pooooooyop...", "...poowwwwoop...", "...poowwwwoop...", "...poowwwwoop...", "...poooooooop...", "...poooooooop...", "...poooooooop..."],
    stove: ["......h...h.....", "........h.......", "....hhhhhhhh....", "...dmmmmmmmmd...", "....mmmmmmmm....", "...dddddddddd...", ".hhhhhhhhhhhhhh.", ".wwwwwwwwwwwwww.", ".wwrwwrwwwwwwww.", ".wwwwwwwwwwwwww.", ".wwddddddddddww.", ".wwdmmmmmmmmdww.", ".wwdmmmmmmmmdww.", ".wwddddddddddww.", ".wwwwwwwwwwwwww.", ".wwwwwwwwwwwwww."],
    table_kitchen: ["................", "................", "................", "................", "....wyw..wrw....", "....www..www....", ".yyyyyyyyyyyyyy.", ".yyyyyyyyyyyyyy.", ".yyyyyyyyyyyyyy.", ".oooooooooooooo.", "..p..........p..", "..p..........p..", "..p..........p..", "..p..........p..", "..p..........p..", "..p..........p.."],
    radio: ["................", "..y........h....", "...........h..y.", ".y.........h....", "...........h....", "...........h....", "...oooooooooo...", "...rrrrrrrrrr...", "...rddddrrrrr...", "...rdmddrryrr...", "...rddmdrrrrr...", "...rdmddrryrr...", "...rrrrrrrrrr...", "................", "................", "................"],
    bed_quilt_o: ["................", ".yyyyyyyyyyyyyy.", ".oooooooooooooo.", ".oooooooooooooo.", "..wwwwwwwwwwww..", "..wwwwwwwwwwww..", "..wwwwwwwwwwww..", ".rrrrrrrrrrrrrr.", ".oooooooooooooo.", ".oooyoooooooyoo.", ".oooooooyoooooo.", ".oooooooyyyyooo.", ".oooooyoyyyyooo.", ".oooooooooyoooo.", ".oooooooooooooo.", "................"],
    desk_small: ["................", "................", "...wwwww........", "...wwwww........", "...hhhhh...b....", "...wwwww...h....", "...wwwww...h....", ".oooooooooooooo.", ".pppppppppppppp.", ".pppppppppppppp.", "..d..........d..", "..d..........d..", "..d..........d..", "..d..........d..", "..d..........d..", "..d..........d.."],
    bunk: [".p..p.........p.", ".p...p........p.", ".pwwwwwwwwwwwwp.", ".pccccccccccccp.", ".pccccccccccccp.", ".oooooooooooooo.", ".p............p.", ".p............p.", ".p............p.", ".pwwwwwwwwwwwwp.", ".pggggggggggggp.", ".pggggggggggggp.", ".oooooooooooooo.", ".p............p.", ".p.yyyyyyyyyy.p.", ".p.yyyyyyyyyy.p."],
    photo_wall: ["................", ".........ooooo..", ".yyyyyy..ococo..", ".yccccy..occco..", ".ycoooy..ooooo..", ".yccccy.........", ".yyyyyy.........", ".........yyyyyy.", ".........yccccy.", "...pppp..ycoyoy.", "...pccp..yccocy.", "...pccp..yccccy.", "...pppp..yyyyyy.", "................", "................", "................"],
    game_screen: ["................", "...........yyy..", ".ddddddddddyyyd.", ".dnnnnnnnnnnnnd.", ".dnnnnnnnnnnynd.", ".dnnllnnnnnnnnd.", ".dnnllnnnrrrnnd.", ".dnnnnnnnrrrnnd.", ".dnnnnnnnnnnnnd.", ".dnnnnnnnnnnnnd.", ".dddddddddddddd.", "......mmmm......", "......mmmm......", "....dddddddd....", "................", "................"],
    domino_table: ["................", "................", "................", "................", "................", ".llllllllllllll.", ".ggggggggggwggg.", ".ggdwgdwgdwdggg.", ".gggggggggggggg.", ".gggggggggggggg.", ".tttttttttttttt.", "..p..........p..", "..p..........p..", "..p..........p..", "..p..........p..", "..p..........p.."],
    beanbag: ["................", "................", "................", "................", "................", "................", "................", "................", "...bccccccccb...", "...bbbybbbbbb...", "..bbbnnnnynbbb..", "..bbbnnnnnnbbb..", "..bbybbbbbbybb..", "..bbbbbbbbbbbb..", "...bbbbbbbbbb...", "................"],
    bucket_drip: ["................", ".......s........", "........c.......", ".......s........", "................", "........s.......", "................", ".......s........", "................", "....wwwwwwww....", "....mssssssm....", "....mhhhhhhm....", "....mhhhhhhm....", "....mhhhhhhm....", "....mhhhhhhm....", "................"],
    tub_clawfoot: ["................","................","..h.............",".hmh............","..h.............","..m.............",".wwwwwwwwwwwwww.",".wcsscccccccccw.",".hccccccccccchh.",".whwwwwwwwwwwwh.",".wwwwwwwwwwwwwh.","..wwwwwwwwwwwh..","..hwwwwwwwwwhh..","...hhhhhhhhhh...","...yo......yo...","...o........o..."],
    sink_pedestal: ["................","....hhhhhhhh....","....hccccsch....","....hcccccch....","....hhhhhhhh....",".......h........","..hh..hmh..hh...",".wwwwwwwwwwwww..",".wwhccccccchww..",".hwwhhhhhhhwwh..","..hhwwwwwwwhh...",".....wwwwh......",".....wwwwh......",".....wwwwh......","....wwwwwwh.....","....hhhhhhh....."],
    wardrobe: [".oooooooooooooo.",".yyyyyyyyyyyyyy.",".oyyyyyypyyyyyo.",".oyoooooopooooo.",".oyoooooopooooo.",".oyooooyypyyooo.",".oyooooyopoyooo.",".oyoooooopooooo.",".oyoooooopooooo.",".oyoooooopooooo.",".oyoooooopooooo.",".oyoooooopooooo.",".oppppppppppppp.",".pppppppppppppp.",".p............p.","................"],
    planter_small: ["................","................","................","......l...l.....",".....lg..lg.....","...l.gg.lg..l...","...lg.g.g..gl...","....gg.ggggg....","......ggg.......","....rrrrrrrr....","....oooooooo....",".....oyooooo....",".....oooooo.....",".....rrrrrr.....","................","................"],
    dog_bed_big: ["................","................","................","................","................","...nnnnnnnnnn...","..nbbbbbbbbbbn..",".nbccccccccccbn.",".nbcbbbbbbbbcbn.",".nbbbbwbbbbbbbn.",".nbbbbbbbbbwbbn.",".nbcbbbbbbbbcbn.",".nbccccccccccbn.","..nnnnnnnnnnnn..","...dddddddddd...","................"],
    easel: ["......o.........","...wwwowwwwww...","...wwwwwwwwww...","...wcccwwyyww...","...wccwwyyyww...","...wwwwwwwwww...","...wllgwwwwrw...","...wgggggwrrw...","...wwwwwwwwww...","..oooooooooooo..","....o...o..o....","....o...o...o...","...o....o...o...","...o....o....o..","..o.....o....o..","..p.....p....p.."],
    paint_crate: ["................","................","................","................","................","...h..w....h....","..rrr.bbb.yyy...","..rwr.bwb.yyy.g.","..rrr.bbb.ooo.g.",".oooooooooooooo.",".oyyyyyyyyyyyyo.",".oopoooooooopoo.",".oooorooobooooo.",".oopoooooooopoo.",".pppppppppppppp.","................"],
    bed_single_g: ["................",".llllllllllllll.",".gggggggggggggg.",".gggggggggggggg.","..wwwwwwwwwwww..","..wwwwwwwwwwww..","..wwwwwwwwwwww..",".tttttttttttttt.",".gggggggggggggg.",".ggglggggggglgg.",".ggggggglgggggg.",".gggggggllllggg.",".ggggglgllllggg.",".ggggggggglgggg.",".gggggggggggggg.","................"],
    bed_single_p: ["................",".rrrrrrrrrrrrrr.",".pppppppppppppp.",".pppppppppppppp.","..wwwwwwwwwwww..","..wwwwwwwwwwww..","..wwwwwwwwwwww..",".kkkkkkkkkkkkkk.",".pppppppppppppp.",".ppprppppppprpp.",".ppppppprpppppp.",".ppppppprrrrppp.",".ppppprprrrrppp.",".ppppppppprpppp.",".pppppppppppppp.","................"],
    bed_single_b: ["................",".cccccccccccccc.",".bbbbbbbbbbbbbb.",".bbbbbbbbbbbbbb.","..wwwwwwwwwwww..","..wwwwwwwwwwww..","..wwwwwwwwwwww..",".nnnnnnnnnnnnnn.",".bbbbbbbbbbbbbb.",".bbbybbbbbbbybb.",".bbbbbbbybbbbbb.",".bbbbbbbyyyybbb.",".bbbbbybyyyybbb.",".bbbbbbbbbybbbb.",".bbbbbbbbbbbbbb.","................"],
    pipe_shiny: [".......oy.......",".......oy.......",".......oy.......","......yyyy......","......oooo......",".......oy.......",".......oy.......",".......ow.......","................","................","................","................","................","................","................","................"],
    leak_drip_0: ["....mmmmmm......",".....mhhm.......","......mm........",".......m........",".......s........","......csc.......",".......c........",".......b........","................","................","................","................","................","................","................","................"],
    leak_drip_1: ["....mmmmmm......",".....mhhm.......","......mm........",".......m........","................","................","................","................",".......s........","......csc.......",".......c........",".......b........","................","................","................","................"],
    leak_drip_2: ["....mmmmmm......",".....mhhm.......","......mm........",".......m........","................","................","................","................","................","................","................","................","................",".......s........",".....s...s......","......c.c......."],
    leak_puddle_0: ["................","................","................","................","................","................","....bbbbbbb.....","..bbcccccccbb...",".bcccsscccccbb..",".bccccccsccccb..",".bbcccccccccbb..","..bbbccccbbb....",".....bbbb.......","................","................","................"],
    leak_puddle_1: ["................","................","................","................","................","................","....bbbbbbb.....","..bbccssscccb...",".bccscccccsccbb.",".bccscccccscccb.",".bbccsssssccbb..","..bbbccccbbb....",".....bbbb.......","................","................","................"],
    buddy_sit: ["................","................","................","...........yy...","..........yyyy..",".........oyykyy.",".........oyyyyyk","..........oyyww.","..........oyrw..","......yyyyyyyw..","y...yyyyyyyyyww.","yy.yyyyyyyyyyww.",".yyyyyyyyyyyyw..",".oyyyyyyy.oy.y..","..ooyyyoo.oy.y..","...wwwww..ww.w.."],
    buddy_tail_up: ["................","................",".y..............",".yy........yy...","..y.......yyyy..","..yy.....oyykyy.","...y.....oyyyyyk","...yy.....oyyww.","....y.....oyrw..","....yyyyyyyyyw..","....yyyyyyyyyww.","...yyyyyyyyyyww.","..yyyyyyyyyyyw..",".oyyyyyyy.oy.y..","..ooyyyoo.oy.y..","...wwwww..ww.w.."],
    buddy_sleep: ["................","................","................","................","................","................","................","................","......yyyyyy....","....yyyyyyyyyy..","...yyyyyyyyoyyy.","..yyyyyyyyoyykky","..yyyyyyyyoyyyyk","..oyyyyyyyyywwyy","yyyooyyyyyywwww.",".yyyyoooooooooo."],
    buddy_z_0: ["................","................","................","................","................","................","................","........www.....","..........w.....",".........w......","........www.....","................","................","................","................","................"],
    buddy_z_1: ["...........wwww.",".............w..","............w...","...........wwww.","................","........hhh.....","..........h.....",".........h......","........hhh.....","................","................","................","................","................","................","................"],
  },
};
function addExteriorArt(T, A){
  const paint = rows => { const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length; const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); })); return c; };
  for (const [k, rows] of Object.entries(EXTERIOR_ART.tiles)) if (!T[k]) T[k] = paint(rows);
  for (const grp of ['art', 'big']) for (const [k, rows] of Object.entries(EXTERIOR_ART[grp])) if (!A[k]) A[k] = paint(rows);
  for (const [k, rows] of Object.entries(LIZZY_ART.tiles)) if (!T[k]) T[k] = paint(rows);
  for (const [k, rows] of Object.entries(LIZZY_ART.art)) if (!A[k]) A[k] = paint(rows);
  const frames = (ids, ms) => { const a = ids.map(id => A[id]); a.ms = ms; return a; };
  if (A.leak_drip_0) A.leak_drip = frames(['leak_drip_0', 'leak_drip_1', 'leak_drip_2'], 450);
  if (A.leak_puddle_0) A.leak_puddle = frames(['leak_puddle_0', 'leak_puddle_1'], 900);
  // D223: blank x4, glint x2, 500 ms. Frame 0 is blank, so reduced motion (artFrame) stays dark.
  if (A.wayin_glint_up && A.wayin_glint_down) {
    A.wayin_glint_up_on = A.wayin_glint_up;
    A.wayin_glint_down_on = A.wayin_glint_down;
    A.wayin_blank = paint(Array.from({ length: 16 }, () => '................'));
    const blank4 = ['wayin_blank', 'wayin_blank', 'wayin_blank', 'wayin_blank'];
    A.wayin_glint_up = frames(blank4.concat(['wayin_glint_up_on', 'wayin_glint_up_on']), 500);
    A.wayin_glint_down = frames(blank4.concat(['wayin_glint_down_on', 'wayin_glint_down_on']), 500);
  }
  // Blink is the sit grid with the two dark eye pixels closed. Design did not ship a blink grid.
  if (LIZZY_ART.art.buddy_sit) A.buddy_blink = paint(LIZZY_ART.art.buddy_sit.map(r => r.replace(/k/g, 'y')));
  for (const k of ['puddle', 'leaf_litter']) if (!A[k]) A[k] = T[k];   // `kind: "decal"` objects draw from WART
}
// E5 on outdoor maps that opt in with "variants": true: plain grass `g` becomes one of these by tileHash (the rest stays `g`).
// Lab maps keep LAB_SKIN.variants; hand-placed chars (`f`, `t`, …) never vary.
const OUTDOOR_SKIN = { variants: { g: [['grass_b', 0.18], ['grass_c', 0.12], ['flower_patch', 0.05]] } };
