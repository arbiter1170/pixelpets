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
  K:'#7a8aa0', // slate floor (Keeper House)
  // GLIMMERWELL_PALETTE v0.3.1 option (b). Appended only. Wine coat, soot trim, crimson accent.
  V:'#960e16', // wine
  N:'#18140f', // soot
  Q:'#c81818'}; // crimson accent (bag, card, sparkle; never text)

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
  ]},
  /* HUSHWATER B2: append-only. Signed-off halves from the A1 art pass, verbatim. */
  { id:'skink', habitat:{hot:6, mountain:3, meadow:1}, tiles:'grass',
    type:'EMBER', blurb:'A warm-rock skink. Basks all day.', stages:[
    { name:'Tindlet', col:{a:PAL.r,b:PAL.o,c:PAL.p,d:PAL.y,x:PAL.p}, half:['........','........','........','........','........','........','.......c','....aaaa','...aaaaa','...aieaa','...aeeaa','...aaxxx','....abbb','...aabbb','....abbb','....aa.c']},
    { name:'Cinderskink', col:{a:PAL.r,b:PAL.o,c:PAL.p,d:PAL.y,x:PAL.p}, half:['........','........','.......c','......cc','.....ccc','...aaacc','..aaaaaa','..aieaaa','..aeeaaa','..aaxxxx','...aaaaa','...abbbb','..aabbdd','...abbdd','...aabbb','..aa..dd']},
    { name:'Kilncrest', col:{a:PAL.r,b:PAL.o,c:PAL.p,d:PAL.y,x:PAL.w}, half:['...d..d.','..dd.ddd','..ddddda','.aaaaaaa','aaaaaaaa','aieaaaaa','aeeaaaaa','aaaaccca','.aaaaaaa','..aaabbb','xaaaabbb','xa.aabbb','...aabbb','..aaaabb','.aaa..ac','.xx....c']}
  ]},
  { id:'otter', habitat:{water:6, cold:4, snow:3, rain:2}, tiles:'shore',
    type:'FROST', blurb:'A spray otter with frosty whiskers.', stages:[
    { name:'Rimelet', col:{a:PAL.s,b:PAL.w,c:PAL.b,d:PAL.h,x:PAL.d}, half:['........','........','........','........','........','........','........','...a....','...aaaaa','...aieaa','..daeeaa','..aaaaax','..aabbbb','..aabbbb','....aaaa','...cc...']},
    { name:'Frostrill', col:{a:PAL.s,b:PAL.w,c:PAL.b,d:PAL.w,x:PAL.d}, half:['........','........','..d.....','..ad....','..aaaaaa','.aaaaaaa','.aaieaaa','.aaeeaaa','.daaaaax','.cdcdcdc','..aabbbb','.aaabbbb','.aaabbbb','..aabbbb','..aaaaaa','..cc..cc']},
    { name:'Spraymane', col:{a:PAL.c,b:PAL.w,c:PAL.b,d:PAL.s,x:PAL.n}, half:['..aa....','.aaaaaaa','.aaaaaaa','daieaaaa','daeeaaaa','dd.aaaax','bddbbbbb','dbbdbbbb','bdbbbbbb','.dbbbdbb','..aabbbb','.aaabbbb','aaaabbbb','.aaabbbb','.aaaaaaa','.cccc.cc']}
  ]},
  { id:'owl', habitat:{night:7, fog:5, forest:2}, tiles:'woods', uiHalo:true,
    type:'SHADE', blurb:'A hush owl. It hears the stream.', stages:[
    { name:'Hushlet', col:{a:PAL.p,b:PAL.w,c:PAL.n,d:PAL.y,x:PAL.h}, half:['........','........','........','........','........','..a.....','..aaaaaa','..abbbbb','..beebbb','..beebbb','..abbbbx','..caaaaa','..ccaaaa','...caaaa','....d.d.','........']},
    { name:'Quillhush', col:{a:PAL.p,b:PAL.w,c:PAL.n,d:PAL.y,x:PAL.h}, half:['........','........','.aa.....','..aa....','..aaaaaa','.abeeebb','.abeiebb','.abeeebb','.abbbbbx','.caabbbb','ccaaaaaa','ccaaxaaa','ccaaaaxa','.caaaaaa','....dd.d','........']},
    { name:'Vesperowl', col:{a:PAL.p,b:PAL.w,c:PAL.n,d:PAL.y,x:PAL.h}, half:['aa......','.aa.....','.aaaaaaa','aabbbbbb','abeeeebb','abeieebb','abeeeebb','aabbbbbx','caabbbbx','ccaaaaaa','ccaxaaxa','ccaaaaaa','ccaaxaax','cc.aaaaa','...dd.dd','........']}
  ]},
  { id:'snail', habitat:{mountain:5, rain:4, forest:2, fog:1}, tiles:'woods',
    type:'STONE', blurb:'A lichen snail with a mossy shell.', stages:[
    { name:'Lichlet', col:{a:PAL.h,b:PAL.m,c:PAL.d,d:PAL.g,x:PAL.l}, half:['........','........','........','......aa','.....aax','....cccc','...aadaa','...aieaa','...aeeaa','...aabaa','..bbbbbb','..bbbbbc','.bbbbbbb','.ccccccc','cccccccc','........']},
    { name:'Screeback', col:{a:PAL.h,b:PAL.m,c:PAL.d,d:PAL.g,x:PAL.l}, half:['........','........','.....axa','.....ccc','....aaaa','....adaa','...ccccc','..aaaaxa','..daieaa','..aaeeaa','..aaabaa','.bbbbbbb','.bbbbbbc','bbbbbbbb','cccccccc','cccccccc']},
    { name:'Cairnshell', col:{a:PAL.h,b:PAL.m,c:PAL.d,d:PAL.g,x:PAL.l}, half:['......aa','.....aax','.....ccc','....aaaa','....xdaa','...ccccc','...aaaaa','..aadaax','..cccccc','.aaaieaa','.adaeeax','.aaaabaa','bbbbbbbb','bbbbbbbc','cccccccc','cccccccc']}
  ]},
  // ARBITER_UNITS (indices 20-24; D837-D847). Glimmerwell built them as its first relays; the Arbiter's hum woke them.
  // One name, three attunement tiers in the stage slot (Quiet, Humming, Answering), never grown up (attune). boss: met as a
  // placed boss, kept out of the journal grid. befriendMul narrows the befriend zone. Spec: handoff/walklings/ARBITER_UNITS.md.
  { id:'tallybat', habitat:{}, labOnly:true, attune:true, boss:true, uiHalo:true, befriendMul:0.75, tiles:'grass',
    type:'SHADE', blurb:'A counting bat. Its wings blink one tally at a time.', stages:[
    { name:'Tallybat', col:{a:PAL.p,b:PAL.n,c:PAL.l,d:PAL.s,x:PAL.w}, half:[
      '........','....a.a.','....aaaa','....aaaa','....aiea','....aeea','....aaaa','c...aaaa',
      'cb.aaaaa','cbbaaaaa','cbbbaaaa','.cbbbaaa','..ccbaaa','....caa.','.....a.a','........']},
    { name:'Tallybat', col:{a:PAL.p,b:PAL.n,c:PAL.l,d:PAL.s,x:PAL.w}, half:[
      '....a.a.','....a.a.','....aaaa','....aaaa','....aiea','....aeea','....aaaa','c...axaa',
      'cb.aaaaa','cdbaaaaa','cbbbaaaa','.cdbbaaa','..ccbaaa','....caa.','.....a.a','........']},
    { name:'Tallybat', col:{a:PAL.p,b:PAL.n,c:PAL.l,d:PAL.s,x:PAL.w}, half:[
      '....a.a.','....ada.','....aaaa','....aaaa','....aiea','c...aeea','cb..aaaa','cbb.axaa',
      'cdbaaaaa','cbbaaaaa','cdbbaaaa','cbdbbaaa','.ccdbaaa','..ccaaa.','....ca.a','........']}
  ]},
  { id:'dimlamp', habitat:{}, labOnly:true, attune:true, boss:true, uiHalo:true, befriendMul:0.75, tiles:'grass',
    type:'SHADE', blurb:'A lamp-headed shade. Its glow asks you to rest.', stages:[
    { name:'Dimlamp', col:{a:PAL.d,b:PAL.l,c:PAL.h,d:PAL.s,x:PAL.w}, half:[
      '........','........','.....cc.','....cbbb','....bbbb','....bbdb','....cccc','...aaaaa',
      '..aaieaa','..aaeeaa','..aaaaaa','..aaaaaa','..aaaaaa','...aaaaa','...aa.aa','........']},
    { name:'Dimlamp', col:{a:PAL.d,b:PAL.l,c:PAL.h,d:PAL.s,x:PAL.w}, half:[
      '........','.....cc.','....cbbb','...cbbbb','...bbbdb','...bbbbb','...ccccc','..aaaaaa',
      '.aaaieaa','.aaaeeaa','.aadaaaa','.aaadaaa','.aaaadaa','..aaaaaa','..aaa.aa','........']},
    { name:'Dimlamp', col:{a:PAL.d,b:PAL.l,c:PAL.h,d:PAL.s,x:PAL.w}, half:[
      '.....cc.','....cbbb','...cbbbb','...bbbdb','..xbbbbb','..xbbbbb','...ccccc','..aaaaaa',
      '.aaaieaa','.aaaeeaa','aaadaaaa','aaaadaaa','.aaaadaa','..aaaaaa','..aaa.aa','..xx..xx']}
  ]},
  { id:'filecrow', habitat:{}, labOnly:true, attune:true, boss:true, uiHalo:true, befriendMul:0.75, tiles:'grass',
    type:'SHADE', blurb:'A file crow. It keeps a card for everything it sees.', stages:[
    { name:'Filecrow', col:{a:PAL.d,b:PAL.h,c:PAL.n,d:PAL.l,x:PAL.y}, half:[
      '........','........','........','........','.....aaa','....aaaa','....aiea','....aeea',
      '....aaax','.....aax','...cabbb','..ccabbb','..ccabbb','...caaaa','....aaaa','.....x..']},
    { name:'Filecrow', col:{a:PAL.d,b:PAL.h,c:PAL.n,d:PAL.l,x:PAL.y}, half:[
      '........','........','.......a','......aa','....aaaa','...aaaaa','...aaiea','...aaeea',
      '...aaaax','....aaax','..ccabbb','.ccdabbb','.cdcabbb','..ccaaaa','...aaaaa','....x.x.']},
    { name:'Filecrow', col:{a:PAL.d,b:PAL.h,c:PAL.n,d:PAL.l,x:PAL.y}, half:[
      '.......a','......aa','.....aaa','...aaaaa','...aaaaa','..aaaiea','..aaaeea','..aaaaax',
      '...aaaax','.cc.aaax','ccdcabbb','cdccadbb','ccdcaddd','.cccaaaa','..aaaaaa','...x..x.']}
  ]},
  { id:'cordhound', habitat:{}, labOnly:true, attune:true, boss:true, uiHalo:true, befriendMul:0.75, tiles:'grass',
    type:'SHADE', blurb:'A shadow pup on a cord. It never unplugs itself.', stages:[
    { name:'Cordhound', col:{a:PAL.n,b:PAL.m,c:PAL.l,d:PAL.s,x:PAL.y}, half:[
      '........','..c.....','..ac....','..aa....','..aaaaaa','.aaaaaaa','.aaaieaa','.aaaeeaa',
      '.aaaabbb','..aaabeb','..aaabbb','..aaaaaa','...aaaaa','...aa.aa','...aa.dx','........']},
    { name:'Cordhound', col:{a:PAL.n,b:PAL.m,c:PAL.l,d:PAL.s,x:PAL.y}, half:[
      '..c.....','..ac....','..ac....','..aa....','..aaaaaa','.aaaaaaa','.aaaieaa','.aaaeeaa',
      '.aaaabbb','.aaaabeb','.aadabbb','..aadaaa','..aaaaaa','...aa.aa','...aa.dx','......dx']},
    { name:'Cordhound', col:{a:PAL.n,b:PAL.m,c:PAL.l,d:PAL.s,x:PAL.y}, half:[
      '.c......','.ac.....','..ac....','..aac...','.aaaaaaa','.aaaaaaa','.aaaieaa','.aaaeeaa',
      '.aaaabbb','.aaaabeb','.aadabbb','.aaadaaa','.aaaadaa','..aaa.aa','..aaa.dx','.....ddx']}
  ]},
  { id:'humwisp', habitat:{}, labOnly:true, attune:true, boss:true, uiHalo:true, befriendMul:0.75, tiles:'grass',
    type:'SHADE', blurb:'A wisp off the cradle. It carries the hum.', stages:[
    { name:'Humwisp', col:{a:PAL.n,b:PAL.w,c:PAL.s,d:PAL.l,x:PAL.p}, half:[
      '........','........','.......a','......aa','.....aaa','....aaaa','...aaaaa','...aaiea',
      '...aaeea','...aacba','...aacba','....aaaa','....aaaa','.....aa.','....c..c','........']},
    { name:'Humwisp', col:{a:PAL.n,b:PAL.w,c:PAL.s,d:PAL.l,x:PAL.p}, half:[
      '........','.......a','......aa','.....aaa','....aaaa','...aaaaa','..aaaaaa','..aaaiea',
      '..aaaeea','..aaccbb','..aaccbb','...aaaaa','...aaaaa','....aaa.','...c..c.','....c..c']},
    { name:'Humwisp', col:{a:PAL.n,b:PAL.w,c:PAL.s,d:PAL.l,x:PAL.p}, half:[
      '.......a','......aa','.....aaa','...d.aaa','..daaaaa','..aaaaaa','.daaaaaa','.aaaaiea',
      '.aaaaeea','.aaaccbb','..aaccbb','..daaaaa','...aaaaa','...daaa.','..c..c.c','....c..c']}
  ]},
  // ROUTE_TO_GOVERNOR v0.1.1 §7 (D1855, D1857, D1862) and KILNMOUTH v0.1.1 §4.4 (indices 25-28, appended in landing order).
  // Names are PLACEHOLDER. tableOnly: wild only on an authored spawn table (never the any-species roll or a habitat pick).
  // spawnNear: a tile char the line prefers to spawn beside (the adder basks by drystone walls, D1871); idleMul stretches
  // the wild's idle between steps (the heron stands still, D1871). The heron's stages are full 16-column profiles.
  { id:'adder', habitat:{meadow:4, hot:4, storm:3, mountain:3}, tiles:'grass', tableOnly:true, spawnNear:'h', type:'VOLT', blurb:"A wall adder. Its zigzag back looks like a lightning mark.", stages:[
    { name:"Adderlet", col:{a:PAL.h,b:PAL.y,c:PAL.m,d:PAL.r,x:PAL.d}, half:['........','........','........','........','........','......aa','.....aaa','....aiea','....aeea','.....aad','......ab','....abab','..aababa','.abaabab','.caaaaaa','..cccccc']},
    { name:"Walladder", col:{a:PAL.m,b:PAL.y,c:PAL.d,d:PAL.r,x:PAL.k}, half:['........','........','......aa','.....aaa','....aaaa','....aiea','....aeea','.....aad','......ab','......ba','......ab','...aabaa','..abaaba','.abaabab','caaaaaaa','.ccccccc']},
    { name:"Zigzag", col:{a:PAL.m,b:PAL.y,c:PAL.d,d:PAL.r,x:PAL.w}, half:['....x..x','....b.bb','....aaaa','...aaaaa','...aaiea','...aaeea','...baaaa','....aaad','.....aab','.....aba','..aabaab','.aabaaba','abaabaab','baabaaba','caaaaaaa','cccccccc']}
  ]},
  { id:'heron', habitat:{water:6, rain:3, fog:3, night:3}, tiles:'shore', tableOnly:true, idleMul:3, type:'TIDE', blurb:"A striped reed-heron. It stands so still it becomes a reed.", stages:[
    { name:"Reedling", grid:['................','................','................','.......F........','.......G........','......GGG.......','......GkG.......','......GGGt......','.......GGtt.....','......GwGttt....','.....GwwGttt....','.....GwwGGtt....','......GwGGt.....','.......GGG......','.......F.F......','.......F.F......']},
    { name:"Stalker", grid:['.......F........','.......G........','.......G........','......GGG.......','......GkGt......','......GGGt......','.......GF.......','.......FG.......','.......GF.......','.......FGt......','......GwGtt.....','.....GwwGttt....','.....GwwGGttt...','......GwGGtt....','.......GGG......','.......F.F......']},
    { name:"Boomer", grid:['.......F........','.......G........','.......G.tt.....','......GGGtt.....','......GkGGt.....','......GGGG......','......GwFG......','.....GwwGF......','.....GwFGG......','.....GGFGGt.....','......GGGGtt....','.....tGGGGttt...','....ttGGGGGttt..','.....ttGGGGtt...','.......G..G.....','.......F..F.....']}
  ]},
  { id:'dipper', habitat:{water:6, cold:4, rain:2}, tiles:'shore', tableOnly:true, type:'TIDE', blurb:"Walks the stream bed. Hunches when the water runs cold.", stages:[
    { name:"Chick", col:{a:PAL.m,b:PAL.w,c:PAL.d,d:PAL.y,x:PAL.k}, half:['........','........','........','........','.....aaa','....aaaa','...aaaaa','...aeiaa','...aaaaa','.ccaaabb','c.caabbb','..caabbb','...caabb','....aaaa','......d.','.....dd.']},
    { name:"Walker", col:{a:PAL.m,b:PAL.w,c:PAL.d,d:PAL.y,x:PAL.k}, half:['........','........','.....aaa','....aaaa','...aaaaa','...aeiaa','...aaaax','..aaaaab','.caaaabb','ccaaabbb','ccaaabbb','.caaaabb','..caaaaa','...aaaaa','.....d..','....dd..']},
    { name:"Diver", col:{a:PAL.m,b:PAL.w,c:PAL.n,d:PAL.y,x:PAL.k}, half:['......c.','.....cc.','....aaaa','...aaaaa','..aaaaaa','..aaeiaa','..aaaaax','.aaaaaab','ccaaaabb','cccaabbb','cccaabbb','.ccaaabb','..caaaaa','...aaaaa','....d...','...dd...']}
  ]},
  { id:'jugwasp', habitat:{mountain:4, hot:3, meadow:2}, tiles:'grass', tableOnly:true, type:'STONE', blurb:"Shapes tiny clay jugs on warm banks. Carries one always.", stages:[
    { name:"Bearer", col:{a:PAL.y,b:PAL.h,c:PAL.o,d:PAL.r,x:PAL.k}, half:['........','........','...x....','....x...','.....aaa','....aeia','.bb..aaa','bbbb..xa','.bb..aaa','....aaxa','....aaaa','.....aax','......cc','.....ccc','.....ccc','......dd']},
    { name:"Potter", col:{a:PAL.y,b:PAL.h,c:PAL.o,d:PAL.r,x:PAL.k}, half:['........','..x.....','...x....','....xaaa','....aaaa','...aaeia','bbb..aaa','bbbb..xa','.bbb.aaa','.b..aaxa','...aaaaa','....aaax','.....ccc','....cccc','....cccc','.....ddd']},
    { name:"Cluster", col:{a:PAL.y,b:PAL.h,c:PAL.o,d:PAL.r,x:PAL.k}, half:['.x......','..x.....','...xaaaa','...aaaaa','...aaeia','bb..aaaa','bbbb..xa','bbbb.aaa','.bb.aaxa','...aaaaa','....aaax','.cc..ccc','cccccccc','cccccccc','.dd.dddd','........']}
  ]},
];

// HUSHWATER B0: one fallback stage for a species id this client does not know.
// Not a SPECIES row (that table stays append-only). One 16x16 grid, PAL keys only, not mirrored.
const UNKNOWN = { id: 'unknown', name: '???', stages: [{ name: '???', grid: [
  '................',
  '................',
  '....hhhhhhh.....',
  '...hh.....hh....',
  '...hh.....hh....',
  '..........hh....',
  '.........hh.....',
  '........hh......',
  '.......hh.......',
  '.......hh.......',
  '................',
  '.......hh.......',
  '.......hh.......',
  '................',
  '................',
  '................',
]}] };

/* One sheet per cell size, not one canvas per tile. WebKit keeps a heavy object per canvas
   even when the pixels are tiny, and a walk session was starting near two thousand of them.
   Callers still see width, height, getContext and drawImage. A 1px clear margin matches the
   transparent sample outside a standalone canvas when a blit is scaled. */
const sheetPools = new Map(), sheetScratchMap = new Map();
function sheetScratch(w, h){
  const k = w + 'x' + h;
  let c = sheetScratchMap.get(k);
  if (!c) { c = document.createElement('canvas'); sheetScratchMap.set(k, c); }
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, w, h);
  return c;
}
function sheetTake(w, h){
  const key = w + 'x' + h;
  let pool = sheetPools.get(key);
  if (!pool) sheetPools.set(key, pool = { sheets: [], free: [], strideX: w + 2, strideY: h + 2 });
  if (pool.free.length) return pool.free.pop();
  const strideX = pool.strideX, strideY = pool.strideY;
  const cols = Math.max(1, Math.min(24, Math.floor(960 / strideX)));
  const rows = Math.max(1, Math.min(16, Math.floor(480 / strideY)));
  let sheet = pool.sheets[pool.sheets.length - 1];
  if (!sheet || sheet.n >= cols * rows) {
    const c = document.createElement('canvas');
    c.width = cols * strideX + 1; c.height = rows * strideY + 1;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    sheet = { canvas: c, n: 0 };
    pool.sheets.push(sheet);
  }
  const i = sheet.n++, col = i % cols, row = (i / cols) | 0;
  return { sheet: sheet.canvas, x: 1 + col * strideX, y: 1 + row * strideY, w, h };
}
class SheetView {
  constructor(rect, recycle){
    this._sheet = rect.sheet; this._x = rect.x; this._y = rect.y; this._w = rect.w; this._h = rect.h;
    this._recycle = !!recycle; this._dead = false; this._ctx = null;
  }
  get width(){ return this._dead ? 0 : this._w; }
  get height(){ return this._dead ? 0 : this._h; }
  set width(v){ if (!v) this._release(); }
  set height(v){ if (!v) this._release(); }
  getContext(kind){
    if (kind && kind !== '2d') return null;
    if (!this._ctx) this._ctx = sheetViewContext(this);
    return this._ctx;
  }
  _release(){
    if (this._dead) return;
    this._dead = true;
    if (!this._recycle || !this._sheet || !this._sheet.width) return;
    const g = this._sheet.getContext('2d');
    g.clearRect(this._x - 1, this._y - 1, this._w + 2, this._h + 2);
    const pool = sheetPools.get(this._w + 'x' + this._h);
    if (pool) pool.free.push({ sheet: this._sheet, x: this._x, y: this._y, w: this._w, h: this._h });
  }
}
function sheetViewContext(view){
  const g = () => view._sheet.getContext('2d');
  return {
    canvas: view,
    get fillStyle(){ return g().fillStyle; }, set fillStyle(v){ g().fillStyle = v; },
    get globalAlpha(){ return g().globalAlpha; }, set globalAlpha(v){ g().globalAlpha = v; },
    get imageSmoothingEnabled(){ return g().imageSmoothingEnabled; },
    set imageSmoothingEnabled(v){ g().imageSmoothingEnabled = v; },
    fillRect(x, y, w, h){ g().fillRect(view._x + x, view._y + y, w, h); },
    clearRect(x, y, w, h){ g().clearRect(view._x + x, view._y + y, w, h); },
    getImageData(x, y, w, h){
      if (view._dead || !view._sheet.width) return g().createImageData(w | 0, h | 0);
      return g().getImageData(view._x + x, view._y + y, w, h);
    },
    putImageData(data, x, y){ if (!view._dead) g().putImageData(data, view._x + x, view._y + y); },
    drawImage(img){
      const args = Array.prototype.slice.call(arguments, 1), ox = view._x, oy = view._y;
      if (args.length <= 2) { args[0] = (+args[0] || 0) + ox; args[1] = (+args[1] || 0) + oy; }
      else if (args.length <= 4) { args[0] += ox; args[1] += oy; }
      else { args[4] += ox; args[5] += oy; }
      return CanvasRenderingContext2D.prototype.drawImage.apply(g(), [img].concat(args));
    },
  };
}
function sheetStamp(canvas){
  const w = canvas.width, h = canvas.height;
  const rect = sheetTake(w, h), g = rect.sheet.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(rect.x - 1, rect.y - 1, w + 2, h + 2);
  g.drawImage(canvas, rect.x, rect.y);
  return new SheetView(rect, true);
}
function sheetPaint(w, h, fn){
  const c = sheetScratch(w, h);
  fn(c.getContext('2d'), c);
  return sheetStamp(c);
}
// A cell on a canvas this caller owns (a building sheet). Not recycled into the shared sheets.
function sheetView(sheet, x, y, w, h){ return new SheetView({ sheet, x, y, w, h }, false); }
(function installSheetDraw(){
  if (typeof CanvasRenderingContext2D !== 'function') return;
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  if (orig.__sheet) return;
  function draw(img){
    if (img && img._sheet) {
      if (img._dead || !img._w || !img._sheet.width) return;
      const sx = img._x, sy = img._y, sw = img._w, sh = img._h, a = arguments;
      if (a.length <= 3) return orig.call(this, img._sheet, sx, sy, sw, sh, a[1] || 0, a[2] || 0, sw, sh);
      if (a.length <= 5) return orig.call(this, img._sheet, sx, sy, sw, sh, a[1], a[2], a[3], a[4]);
      return orig.call(this, img._sheet, sx + a[1], sy + a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
    }
    return orig.apply(this, arguments);
  }
  draw.__sheet = true;
  CanvasRenderingContext2D.prototype.drawImage = draw;
})();

/* Build an 18x18 sprite (16x16 + 1px outline border). mode: 'normal' | 'blink' | solid colour string.
   A half is 8 columns and mirrored. A grid longer than 8 is a full 16x16 of PAL keys and is not mirrored. */
function buildSprite(half, col, mode){
  const full = !!(half && half.length && String(half[0]).length > 8);
  const grid = full
    ? half.map(row => (String(row) + '................').slice(0, 16).split(''))
    : half.map(h => { h = (h + '........').slice(0,8); return (h + h.split('').reverse().join('')).split(''); });
  return sheetPaint(18, 18, g => {
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
  });
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
  // PARTNER_CARE D534-D535. 9x12, same outline as emote_heart. Level 2 swaps k for r at draw time.
  emote_hungry: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwywywywk',
    'kwooooowk',
    'kwwooowwk',
    'kwwwowwwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  emote_hurt: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwlllllwk',
    'kwllwllwk',
    'kwlwwwlwk',
    'kwllwllwk',
    'kwlllllwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  emote_tired: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwwwwccwk',
    'kwwwccwwk',
    'kwwccccwk',
    'kwwwccwwk',
    'kwwcwwwwk',
    'kwwwwwwwk',
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
  // PLAY_TOGETHER_P1 wheel glyphs (append only). 9x12 balloon frame, PAL keys.
  emote_wave: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwywywywk',
    'kwywywywk',
    'kyyyyyywk',
    'kwyyyyywk',
    'kwwyyywwk',
    'kwwyyywwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  emote_ask: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwwbbbwwk',
    'kwbwwwbwk',
    'kwwwwwbwk',
    'kwwwwbwwk',
    'kwwwbwwwk',
    'kwwwwwwwk',
    'kwwwbwwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  emote_laugh: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwkkwkkwk',
    'kwwwwwwwk',
    'kwrrrrrwk',
    'kwrwwwrwk',
    'kwwrrrwwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  emote_dots: [
    '.kkkkkkk.',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwmwmwmwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  emote_clap: [
    '.kkkkkkk.',
    'kwywwwywk',
    'kwwywywwk',
    'kwwwwwwwk',
    'kwwowowwk',
    'kwoowoowk',
    'kwooooowk',
    'kwwooowwk',
    'kwwwowwwk',
    'kwwwwwwwk',
    '.kwkkkkk.',
    '.kk......',
  ],
  // MATCH_MARKER D818 (variant A): the standing "wants a match" balloon. Same 9x12 frame and tail as the emotes above.
  emote_match: [
    '.kkkkkkk.',
    'kyyyyyyyk',
    'kyyyyyyyk',
    'kykykykyk',
    'kyykkkyyk',
    'kykkkkkyk',
    'kyykkkyyk',
    'kykykykyk',
    'kyyyyyyyk',
    'kyyyyyyyk',
    '.kykkkkk.',
    '.kk......',
  ],
  heart:['.r.r.','rrrrr','rrrrr','.rrr.','..r..'],
  apple:['..t..','.rrr.','rrrwr','rrrrr','.rrr.'],
  // PARTNER_UI D245. New glyphs. The 5x5 apple above stays the feed particle. The 8x8 star stays the GROW UP mark.
  ico_food:['...mgg.','...m...','.rr.rr.','rwrrrrr','rwrrrrr','rrrrrrr','.rr.rr.'],
  ico_joy:['.r.r.','rwrrr','rrrrr','.rrr.','..r..'],
  ico_nrg:['...ss','..ss.','.ssss','..ss.','.s...'],
  ico_grow:['..y..','.yyy.','yyyyy','.yyy.','.y.y.'],
  ico_pencil:['....r','...yr','..yy.','.yy..','h....'],
  // REMATCH_PARTY_STATS D290. 5x5 PAL. HP is a lime square with a white plus. XP is three rising bars.
  ico_hp:['lllll','llwll','lwwwl','llwll','lllll'],
  ico_xp:['....c','..c.c','..c.c','c.c.c','c.c.c'],
  z:['www','..w','.w.','w..','www'],
  // HEART_ALERT v0.2 badges (D156). 5x5, PAL only. Bowl for food, z for rest. Not the D245 icons.
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
function mkTile(fn){ return sheetPaint(16, 16, fn); }
function px(g,col,x,y,w=1,h=1){ g.fillStyle=col; g.fillRect(x,y,w,h); }
function grassBase(g, seed){ px(g,PAL.g,0,0,16,16); const r=rng(seed); for(let i=0;i<9;i++) px(g, r()<.5?PAL.l:PAL.t, (r()*16)|0, (r()*16)|0); }
// BRINEWICK floors v0.2 (design specs/brinewick_floors.py): FLOOR_FIX plank rule and calm test; no new palette keys.
const BRINEWICK_TILES = {
  floor_ropeplank: ["AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAGGGAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAABAAAAAAA", "AAAAAAAAAAAAAAAA", "GGGGGGGGGGGGGGGG", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAGGAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "GGGGGGGGGGGGGGGG"],
  floor_ropeplank_b: ["AAAAAAAAAAGAAAAA", "AAAAAAAAAAGAAAAA", "AAAAAAAAAAGAAAAA", "AAAAAAGGAAGAAAAA", "AAAAAAAAAAGAAAAA", "AAAAAAAAAAGAAAAA", "AAAAAAAAAAGAAAAA", "GGGGGGGGGGGGGGGG", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAABAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "GGGGGGGGGGGGGGGG"],
  floor_ropeplank_c: ["AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAABA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAGGAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "GGGGGGGGGGGGGGGG", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AGGGAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "GGGGGGGGGGGGGGGG"],
  floor_tarboard: ["FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFBFF", "FFpppFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "dddddddddddddddd", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFpppFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "dddddddddddddddd"],
  floor_tarboard_b: ["FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFpppF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "dddddddddddddddd", "FFFFFFFdFFFFFFFF", "FFFFFFFdFFFFFFFF", "FFFFFFFdFFFFFFFF", "FFFFFppdFFFFFFFF", "FFFFFFFdFFFFFFFF", "FFFFFFFdFFFFFFFF", "FFFFFFFdFFFFFFFF", "dddddddddddddddd"],
  floor_tarboard_c: ["FFFFFFFFFFFFFFFF", "FFFFFFFFpppFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFBFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "dddddddddddddddd", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FppFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "dddddddddddddddd"],
  floor_ferrydeck: ["hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhKKhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "KKKKKKKKKKKKKKKK", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "KKKKKKKKKKKKKKKK"],
  floor_ferrydeck_b: ["hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "KKKKKKKKKKKKKKKK", "hhhhhhhhhhhhhKhh", "hhhhhhhhhhhhhKhh", "hhhhhhhhhhhhhKhh", "hhhhhhhhhhhhhKhh", "hhhhhhhhhhhhhKhh", "hhhhhhhhhhhhhKhh", "hhhhhhhhhhhhhKhh", "KKKKKKKKKKKKKKKK"],
  floor_ferrydeck_c: ["hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "KKKKKKKKKKKKKKKK", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhKKhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "KKKKKKKKKKKKKKKK"],
  floor_sealed: ["wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwhw", "wwwwwwwwwwwwwwww", "wwwhwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwhwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww"],
  floor_sealed_b: ["wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwhwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwhww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwswwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww"],
  floor_sealed_c: ["wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwhw", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwhwwwwwwwww", "wwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwww"],
  rug_navy_runner: ["nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnbbnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnbbnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn", "nwnnnnnnnnnnnnwn"],
};
// FERNBROOK_HOMES (D1248-D1252): the three south-lane homes. Recolours of existing grids only (coach_plank, hall_flag, floor_loft,
// rug_fern, rug_kitchen) plus the house_wardrobe herringbone in y and A. PAL keys only, no new key. Rule 9 brief: handoff/maps/FERNBROOK_HOMES.md.
const FERNBROOK_HOMES_TILES = {
  floor_press: ["GGGGGBGGGGGGGGGG","GGBBBBGGGGGGGGGG","GGGGGBGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGBGG","GGGGGGGGGGGGGBGG","GGGGGGGGGGGGGBGG","FFFFFFFFFFFFFFFF","GGGGGGGGGBGGGGGG","GGGGGGGGGBBBGGGG","GGGGGGGGGBGGGGGG","FFFFFFFFFFFFFFFF","GBGGGGGGGGGGGGGG","GBGGGGGGGGGGGGGG","GBGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF"],
  press_flag: ["IIIIIIIIIIFIIIII","IhhhIIIIIIFIIIII","IIIIIIIIIIFIIIII","IIIIIIIIIIFIIIII","IIIIIIIIIIFIIIII","FFFFFFFFFFFIIIII","IIIIIFIIIIFIIIII","IIIIIFIhhIFIIIII","IIIIIFIIIIFIIIII","IIIIIFIIIIFIIIII","IIIIIFFFFFFFFFFF","IIIIIFIIIIBBFIII","IIIIIFIIIIIIFIII","FFFFFFIIIIIIFIII","IIIIIFIIIIIIFIII","IIIIIFIIIIIIFIII"],
  floor_press_b: ["GGGGGBGGGGGGGGGG","GGGGGBGGGGGGGGGG","GGGGGBGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGBGG","GGGGGGGBBBGGGBGG","GGGGGGGGGGGGGBGG","FFFFFFFFFFFFFFFF","GGGGGGGGGBGGGGGG","GGGGGGGGGBGGGGGG","GGGGGGGGGBGGGGGG","FFFFFFFFFFFFFFFF","GBGGGGGGGGGGGGGG","GBGBBGGGGGGGGGGG","GBGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF"],
  press_flag_b: ["IIIIIFIIIIIIIIII","IIIIIFIIIIIIhhhI","IIIIIFIIIIIIIIII","IIIIIFIIIIIIIIII","IIIIIFIIIIIIIIII","IIIIIFFFFFFFFFFF","IIIBBFIIIIFIIIII","IIIIIFIhhIFIIIII","IIIIIFIIIIFIIIII","IIIIIFIIIIFIIIII","FFFFFFFFFFFIIIII","IIIFIIIIIIFIIIII","IIIFIIIIIIFIIIII","IIIFIIIIIIFFFFFF","IIIFIIIIIIFIIIII","IIIFIIIIIIFIIIII"],
  floor_press_c: ["GGGGGBGGGGGGGGGG","GGGGGBGGGGGBBGGG","GGGGGBGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGBGG","GGGGGGGGGGGGGBAG","GGGGGGGGGGGGGBGG","FFFFFFFFFFFFFFFF","GGGGGGGGGBGGGGGG","GGGGGGGGGBGGGGGG","GGGGGGBBBBGGGGGG","FFFFFFFFFFFFFFFF","GBGGGGGGGGGGGGGG","GBGGGGGGGGGGGGGG","GBGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF"],
  press_flag_c: ["IIIIIFIIIIIIFIII","IIIIIFIIIIIIFIII","FFFFFFIIIIIIFIII","IIIIIFIIIIIIFIII","IIIIIFIIIIIIFBBI","IIIIIFFFFFFFFFFF","IIIIIFIIIIFIIIII","IIIIIFIhhIFIIIII","IIIIIFIIIIFIIIII","IIIIIFIIIIFIIIII","FFFFFFFFFFFIIIII","IIIIIIIIIIFIIIII","IIhhhIIIIIFIIIII","IIIIIIIIIIFIIIII","IIIIIIIIIIFIIIII","IIIIIIIIIIFIIIII"],
  rug_press: ["oooooooooooooooo","rrrrrrrrrrrrrrrr","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","oyoooyoooyoooyoo","oooyoooyoooyoooy","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","oooooooooooooooo","rrrrrrrrrrrrrrrr","oooooooooooooooo"],
  mat_press: ["FFFFFFFFFFFFFFFF","FBBBBBBBBBBBBBBF","FBBBBBBBBBBBBBBF","FBBBrrrrrrrrBBBF","FBBBrrrrrrrrBBBF","FBBBrrrrrrrrBBBF","FBBBrrrrrrrrBBBF","FBBBrrrrrrrrBBBF","FBBBrrrrrrrrBBBF","FBBBrrrrrrrrBBBF","FBBBrrrrrrrrBBBF","FBBBrrrrrrrrBBBF","FBBBrrrrrrrrBBBF","FBBBBBBBBBBBBBBF","FBBBBBBBBBBBBBBF","FFFFFFFFFFFFFFFF"],
  floor_picker: ["yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy"],
  floor_picker_b: ["yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyGyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA"],
  floor_picker_c: ["yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyyyyyAyyyyyyyA","yyyyyyyAyyyyyyyA","yyyyyyyAyGGyyyyA","yyyyyyyAyyyyyyyA","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy","yyyAyyyyyyyAyyyy"],
  rug_picker: ["DDDDDDDDDDDDDDDD","DDDgDDDDDDDDDgDD","DDgDgDDDDDDDDgDD","DDDgDgDDDDDgDgDD","DDDDgDgDDDDgDDDD","DDDDDgDDDDgDgDDD","DDDDDDDDDgDgDDDD","DDrDDDDDDDgDDDDD","DDDDDDDDDDDDDrDD","DDgDDDDDDDDDDDDD","DDgDgDDDDDgDDDDD","DDDgDgDDDgDgDDDD","DDDDgDgDDgDgDDDD","DDDDDgDDgDgDDDDD","DDDDDDDDDDgDDDDD","DDDDDDDDDDDDDDDD"],
  mat_picker: ["EEEEEEEEEEEEEEEE","EyyyyyyyyyyyyyyE","EyyyyyyyyyyyyyyE","EyyyggggggggyyyE","EyyyggggggggyyyE","EyyyggggggggyyyE","EyyyggggggggyyyE","EyyyggggggggyyyE","EyyyggggggggyyyE","EyyyggggggggyyyE","EyyyggggggggyyyE","EyyyggggggggyyyE","EyyyggggggggyyyE","EyyyyyyyyyyyyyyE","EyyyyyyyyyyyyyyE","EEEEEEEEEEEEEEEE"],
  floor_stitch: ["hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhKhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh"],
  floor_stitch_b: ["hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhKhhhh","hhhhhhhhhhhKhhhh","hhhhhhhhhhhKhhhh","hhhhhhhhhhhKhhhh","hhhhhhhhhhhKhhhh","hhhhhhhhhhhKhhhh","hhhhhhhhhhhKhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh"],
  floor_stitch_c: ["hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhyhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","KKKKKKKKKKKKKKKK","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhKKKhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh"],
  rug_patch: ["wrwrwrwrwbwbwbwb","rrrrrrrrbbbbbbbb","wrrrrrrrwbbbbbbb","rrrrrrrrbbbbbbbb","wrrrrrrrwbbbbbbb","rrrrrrrrbbbbbbbb","wrrrrrrrwbbbbbbb","rrrrrrrrbbbbbbbb","wpwpwpwpwlwlwlwl","ppppppppllllllll","wpppppppwlllllll","ppppppppllllllll","wpppppppwlllllll","ppppppppllllllll","wpppppppwlllllll","ppppppppllllllll"],
  mat_stitch: ["pppppppppppppppp","phhhhhhhhhhhhhhp","phhhhhhhhhhhhhhp","phhhwwwwwwwwhhhp","phhhwwwwwwwwhhhp","phhhwwwwwwwwhhhp","phhhwwwwwwwwhhhp","phhhwwwwwwwwhhhp","phhhwwwwwwwwhhhp","phhhwwwwwwwwhhhp","phhhwwwwwwwwhhhp","phhhwwwwwwwwhhhp","phhhwwwwwwwwhhhp","phhhhhhhhhhhhhhp","phhhhhhhhhhhhhhp","pppppppppppppppp"],
};
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
  // BRINEWICK: the quay. Weathered grey-blue planks with a rope-tan nail line, so the harbour never repeats High Charity's orange dock.
  T.Q = mkTile(g => { px(g,PAL.m,0,0,16,16); [0,4,8,12].forEach(y => px(g,PAL.d,0,y,16,1));
    [[3,1],[10,5],[6,9],[13,13]].forEach(([x,y]) => px(g,PAL.d,x,y,1,3));
    [[7,2],[1,6],[12,10],[4,14]].forEach(([x,y]) => px(g,PAL.h,x,y,2,1)); px(g,PAL.G,9,1,1,1); px(g,PAL.G,2,13,1,1); });
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
  // GLIMMERWELL_PALETTE v0.4.6 (design 241c654). New rx4b keys for the gated bay.
  // Pia's grids. The locked door is registered and never selected; the kit door is rx4b__face_door.
  {
    const paint = (g, rows) => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); }));
    const RX4B = {
      rx4b_floor_bay: [
        "hhhhhhhhhhhhhhhh",
        "hwwwwwwwhwwwwwww",
        "hwsswwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwdwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hhhhhhhhhhhhhhhh",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwsswwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwdw",
        "hwwwwwwwhwwwwwww"
      ],
      rx4b_guide_v: [
        "hhhhhhhNNhhhhhhh",
        "hwwwwwhQdhwwwwww",
        "hwsswwhddhwwwwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhQdhwwwwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhddhwwwwww",
        "hhhhhhhddhhhhhhh",
        "hwwwwwhQdhwwwwww",
        "hwwwwwhddhsswwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhQdhwwwwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhddhwwwwww"
      ],
      rx4b_guide_h: [
        "hhhhhhhhhhhhhhhh",
        "hwwwwwwwhwwwwwww",
        "hwsswwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hhhhhhhhhhhhhhhh",
        "NQdddQdddQdddQdN",
        "NddddddddddddddN",
        "hhhhhhhhhhhhhhhh",
        "hwwwwwwwhwsswwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww",
        "hwwwwwwwhwwwwwww"
      ],
      rx4b_guide_x: [
        "hhhhhhhddhhhhhhh",
        "hwwwwwhQdhwwwwww",
        "hwsswwhddhwwwwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhQdhwwwwww",
        "hhhhhhddddhhhhhh",
        "dQdddQdQQddddQdd",
        "dddddddQQddddddd",
        "hhhhhhddddhhhhhh",
        "hwwwwwhddhsswwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhQdhwwwwww",
        "hwwwwwhddhwwwwww",
        "hwwwwwhddhwwwwww"
      ],
      rx4b_glass: [
        "hhhhhhhhhhhhhhhh",
        "hwwwwwwwhwwwwwww",
        "mmmmmmmmmmmmmmmm",
        "mssssssssssssssm",
        "msswsssssswssssm",
        "mssswsssssswsssm",
        "msssswsssssssssm",
        "mssssssssssssssm",
        "mssssssssssssssm",
        "mssssssssssssssm",
        "mssssssssssssssm",
        "mssssssssssssssm",
        "mssssssssssssssm",
        "mmmmmmmmmmmmmmmm",
        "VVVVVVVVVVVVVVVV",
        "hwwwwwwwhwwwwwww"
      ],
      rx4b_dais: [
        "mmmmmmmmmmmmmmmm",
        "mwwwwwwwwwwwwwwm",
        "mhhhhhhhhhhhhhhm",
        "mhhhhhhhhhhhhhhm",
        "mhhhyhhhhhhyhhhm",
        "mhhhhhhhhhhhhhhm",
        "mhhhhhhhhhhhhhhm",
        "mhhhhhhsshhhhhhm",
        "mhhhhhhsshhhhhhm",
        "mhhhhhhhhhhhhhhm",
        "mhhhhhhhhhhhhhhm",
        "mhhhyhhhhhhyhhhm",
        "mhhhhhhhhhhhhhhm",
        "mhhhhhhhhhhhhhhm",
        "mhhhhhhhhhhhhhhm",
        "mmmmmmmmmmmmmmmm"
      ],
      rx4b__face: [
        "hhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhh",
        "wwwwwwwwwwwwwwww",
        "wwwwwwwwwwwwwwww",
        "wwwwwwwwwwwwwwww",
        "wwwwwwwwwwwwwwww",
        "wwwwwwwwwwwwwwww",
        "wwwwwwwwwwwwwwww",
        "wwwwwwwwwwwwwwww",
        "NNNNNNNNNNNNNNNN",
        "dddddddddddddddd",
        "VVVVVVVVVVVVVVVV",
        "wwwwwwwwwwwwwwww",
        "dddddddddddddddd",
        "dddddddddddddddd",
        "hhhhhhhhhhhhhhhh"
      ],
      rx4b__face_l: [
        "hhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhh",
        "hhwwwwwwwwwwwwww",
        "hhwwwwwwwwwwwwww",
        "hhwwwwwwwwwwwwww",
        "hhwwwwwwwwwwwwww",
        "hhwwwwwwwwwwwwww",
        "hhwwwwwwwwwwwwww",
        "hhwwwwwwwwwwwwww",
        "hhNNNNNNNNNNNNNN",
        "hhdddddddddddddd",
        "hhVVVVVVVVVVVVVV",
        "hhwwwwwwwwwwwwww",
        "hhdddddddddddddd",
        "hhdddddddddddddd",
        "hhhhhhhhhhhhhhhh"
      ],
      rx4b__face_win: [
        "hhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhh",
        "wwwmmmmmmmmmmwww",
        "wwwmssccmcccmwww",
        "wwwmssccmcccmwww",
        "wwwmccccmcccmwww",
        "wwwmccccmcccmwww",
        "wwwmccccmcccmwww",
        "wwwmccccmcccmwww",
        "NNNmmmmmmmmmmNNN",
        "NNdwwwwwwwwwwdNN",
        "ddVwwwwwwwwwwVdd",
        "VVwwwwwwwwwwwwVV",
        "dddddddddddddddd",
        "dddddddddddddddd",
        "hhhhhhhhhhhhhhhh"
      ],
      rx4b__face_door: [
        "hhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhh",
        "wwwwVVVVVVVVwwww",
        "wwwwVddddddVwwww",
        "wwwwVdNNNNdVwwww",
        "wwwwVdNNNNdVwwww",
        "wwwwVdNNNNdVwwww",
        "wwwwVdNNNNdVwwww",
        "wwwwVdNNNNdVwwww",
        "NNNdVdNNNydVdNNN",
        "ddddVdNNNNdVdddw",
        "VVVVVdNNNNdVVVVV",
        "wwwwVdNNNNdVwwww",
        "ddddVdNNNNdVdddd",
        "ddddVddddddVdddd",
        "hhhhVVVVVVVVhhhh"
      ],
      rx4b_door_locked: [
        "wwwwwwwhwwwwwwww",
        "wwwVVVVVVVVVVwww",
        "wwwVddddddddVwww",
        "wwwVdNNNNNNdVwww",
        "wwwVdNNNNNNdVwww",
        "wwwVdddNNdddVwww",
        "wwwVVVVddVVVVddw",
        "wwwVVVVddVVVVydw",
        "wwwVdddNNdddVdyw",
        "wwwVdNNNNNNdVddw",
        "wwwVdNNNNNNdVwww",
        "wwwVdNNNNNNdVwww",
        "hhhVdNNNNNNdVhhh",
        "VVVVdNNNNNNdVVVV",
        "hhhVdNNNNNNdVhhh",
        "dddddddddddddddd"
      ]
    };
    const floor = RX4B.rx4b_floor_bay;
    for (const [k, rows] of Object.entries(RX4B)) T[k] = mkTile(g => paint(g, rows));
    for (const k of ['rx4b_guide_v', 'rx4b_guide_h', 'rx4b_guide_x']) {
      const rows = RX4B[k];
      T[k + '_decal'] = mkTile(g => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.' && ch !== floor[y][x]) px(g, PAL[ch], x, y); })));
    }
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
  T.floor_keep_d = lozengeFloor([[3, 4, 'm'], [4, 4, 'm'], [11, 12, 'h']]);   // CABINET 1b: the Cabinet Room's third variant (Vincent, Nov 4)
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
  // BRINEWICK. Walls, mats and decals; the floors are grids in BRINEWICK_TILES (FLOOR_FIX rules). Rule 9 briefs in design specs/BRINEWICK.md.
  T.mat_brine_rest = doormat('n', 'w');
  T.wall_brine_rest = wallTop('w', 'h', [[3, 6, 'C'], [11, 9, 'n']]);
  T.wall_brine_rest_face = wallFace('w', 'h', 'n', [[6, 6, 'C']], null);
  T.wall_brine_rest_win = wallFace('w', 'h', 'n', [], [4, 2, 8, 7, 'n', 'c']);
  T.mat_chandler = doormat('F', 'o');
  T.wall_chandler = wallTop('m', 'd', [[4, 5, 'h'], [12, 10, 'F']]);
  T.wall_chandler_face = wallFace('m', 'd', 'F', [[5, 6, 'h']], null);
  T.wall_chandler_win = wallFace('m', 'd', 'F', [], [4, 2, 8, 7, 'F', 'c']);
  T.deck_lane = mkTile(g => { px(g, PAL.y, 7, 0, 2, 16); px(g, PAL.o, 7, 7, 2, 2); });
  T.mat_ferry = doormat('m', 'y');
  T.wall_ferry = wallTop('w', 'n', [[3, 6, 'h'], [10, 9, 'r']]);
  T.wall_ferry_face = wallFace('w', 'n', 'r', [[5, 7, 'h']], null);
  T.wall_ferry_win = wallFace('w', 'n', 'r', [], [3, 3, 10, 6, 'n', 's']);
  T.mat_depot = doormat('m', 'V');
  T.depot_line = mkTile(g => { px(g, PAL.V, 7, 0, 2, 16); });   // a painted wine aisle line, walkable decal
  T.wall_depot = wallTop('w', 'V', [[4, 6, 'h'], [11, 9, 'N']]);
  T.wall_depot_face = wallFace('w', 'V', 'h', [[6, 6, 'N']], null);
  T.wall_depot_win = wallFace('w', 'V', 'h', [], [4, 2, 8, 7, 'h', 's']);
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
    px(g, PAL.K, 0, 0, 16, 16); px(g, PAL.o, 0, 0, 16, 1); px(g, PAL.o, 0, 15, 16, 1);
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
  for (const [k, rows] of Object.entries(BRINEWICK_TILES)) if (!T[k]) T[k] = mkTile(g => paintGrid(g, rows));
  for (const [k, rows] of Object.entries(FERNBROOK_HOMES_TILES)) if (!T[k]) T[k] = mkTile(g => paintGrid(g, rows));
  // Market Row rooms. Store is a 2x2 grey-and-sky check (no white). Wardrobe is rose herringbone. Diner is a small black-and-butter check.
  const blockCheck = (a, b, shift) => {
    const rows = [];
    for (let y = 0; y < 16; y++) {
      let s = '';
      for (let x = 0; x < 16; x++) s += ((Math.floor((x + shift) / 2) + Math.floor(y / 2)) % 2) ? b : a;
      rows.push(s);
    }
    return rows;
  };
  const herring = shift => {
    const rows = [];
    for (let y = 0; y < 16; y++) {
      let s = '';
      const off = ((Math.floor(y / 4) + shift) % 2) * 2;
      for (let x = 0; x < 16; x++) s += ((x + off) % 4 === 3) ? 'G' : 'H';
      rows.push(s);
    }
    return rows;
  };
  const marketFloors = {
    floor_aisle: blockCheck('h', 'c', 0), floor_aisle_b: blockCheck('h', 'c', 2), floor_aisle_c: blockCheck('c', 'h', 1),
    floor_herring: herring(0), floor_herring_b: herring(1), floor_herring_c: herring(2),
    floor_diner: blockCheck('k', 'y', 0),
    mat_aisle: ['bbbbbbbbbbbbbbbb','bhhhhhhhhhhhhhhb','bhhhhhhhhhhhhhhb','bhhhhhhhhhhhhhhb','bhhccccccccccchb','bhhccccccccccchb','bhhccccccccccchb','bhhccccccccccchb','bhhccccccccccchb','bhhccccccccccchb','bhhccccccccccchb','bhhccccccccccchb','bhhhhhhhhhhhhhhb','bhhhhhhhhhhhhhhb','bhhhhhhhhhhhhhhb','bbbbbbbbbbbbbbbb'],
    mat_herring: ['JJJJJJJJJJJJJJJJ','JHHHHHHHHHHHHHHJ','JHHHHHHHHHHHHHHJ','JHHHHGGGGGGHHHHJ','JHHHHGGGGGGHHHHJ','JHHHHGGGGGGHHHHJ','JHHHHGGGGGGHHHHJ','JHHHHGGGGGGHHHHJ','JHHHHGGGGGGHHHHJ','JHHHHGGGGGGHHHHJ','JHHHHGGGGGGHHHHJ','JHHHHGGGGGGHHHHJ','JHHHHHHHHHHHHHHJ','JHHHHHHHHHHHHHHJ','JHHHHHHHHHHHHHHJ','JJJJJJJJJJJJJJJJ'],
    mat_diner: ['rrrrrrrrrrrrrrrr','ryyyyyyyyyyyyyr','ryyyyyyyyyyyyyr','ryykkkkkkkkkkyyr','ryykkkkkkkkkkyyr','ryykkkkkkkkkkyyr','ryykkkkkkkkkkyyr','ryykkkkkkkkkkyyr','ryykkkkkkkkkkyyr','ryykkkkkkkkkkyyr','ryykkkkkkkkkkyyr','ryykkkkkkkkkkyyr','ryyyyyyyyyyyyyr','ryyyyyyyyyyyyyr','ryyyyyyyyyyyyyr','rrrrrrrrrrrrrrrr'],
  };
  for (const [k, rows] of Object.entries(marketFloors)) T[k] = mkTile(g => paintGrid(g, rows));
  // ART_PASS v0.2 (D548-D563): hall terrace tiles and the Parked Coach floor. PAL keys only. No new key.
  const ART_PASS_TILES = {
    hall_moss: ["gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","ggggggggggglgggg","gggggggggggggggg","gggggggggggggggg","ggggEggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","ggggggggEggggggg","gggggggggggggggg","gggggggggggggpgg","gggggggggggggggg","gggggggggggggggg"],
    hall_moss_b: ["gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggglggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggEgggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","ggggggEggggggggg","gggggggggggggggg","gggggggggggggggg"],
    hall_moss_c: ["gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","ggggggggEggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gggggggggggggglg","gggggggggggggggg","ggyggggggggggggg","gggggggggggggggg","gggggggggggggggg"],
    hall_path: ["AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAGAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAABAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","ACAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAGAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAFAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA"],
    hall_path_b: ["AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAABAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAACAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAGAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAGAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA"],
    hall_path_c: ["AAAAAAAAAAAAAAAA","AAAAAAAAAAACAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAGAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAFAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAABA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA","AAAAAAAAAAAAAAAA"],
    hall_earth: ["HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHBHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHFHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHCHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHBH","HFHHHHHHHHHHHHHH","HHHHHHHHHGHHHHHH","HHHHHHHHHHHHHHHH"],
    hall_earth_b: ["HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHBH","HHHHHHHFHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHCHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHBHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHGHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH"],
    hall_earth_c: ["HHHHHHHHHHHHHHHH","HGHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHCHHHHH","HHHHHHHHHHHHHHHH","HHHHBHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHFHH","HHHHHHHHHHHHHHHH","HHHHHHHBHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH","HHHHHHHHHHHHHHHH"],
    hall_flag: ["IIIIIIIIIIEIIIII","ICCCIIIIIIEIIIII","IIIIIIIIIIEIIIII","IIIIIIIIIIEIIIII","IIIIIIIIIIEIIIII","EEEEEEEEEEEIIIII","IIIIIEIIIIEIIIII","IIIIIEICCIEIIIII","IIIIIEIIIIEIIIII","IIIIIEIIIIEIIIII","IIIIIEEEEEEEEEEE","IIIIIEIIIIggEIII","IIIIIEIIIIIIEIII","EEEEEEIIIIIIEIII","IIIIIEIIIIIIEIII","IIIIIEIIIIIIEIII"],
    hall_stepstone: ["gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gglggggggggggggg","gggIIIIIIggggggg","ggICCCIIIIgggggg","ggIIIIIIIIgggggg","ggIIIIIIEIgggggg","ggIIIIIIEIgggggg","ggIIIIIIEIgggggg","ggIIIIIIEIgggggg","ggIIIIIIIIgggggg","ggEEEEEEEEgggggg","ggggggggggggEggg","gggggggggggggggg","gggggggggggggggg"],
    hall_board: ["GGGGGGGGGGGGGGGG","GGAAAAAGGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGGGG","GGGGGGGGGAAAAGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGGGG","GGGGAAAAAAGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGGGG","GGGGGGGGGGGAAAGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF"],
    hall_dais: ["CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCwwCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCAACCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","DDDDDDDDDDDDDDDD"],
    hall_flag_b: ["IIIIIEIIIIIIIIII","IIIIIEIIIIIICCCI","IIIIIEIIIIIIIIII","IIIIIEIIIIIIIIII","IIIIIEIIIIIIIIII","IIIIIEEEEEEEEEEE","IIIggEIIIIEIIIII","IIIIIEICCIEIIIII","IIIIIEIIIIEIIIII","IIIIIEIIIIEIIIII","EEEEEEEEEEEIIIII","IIIEIIIIIIEIIIII","IIIEIIIIIIEIIIII","IIIEIIIIIIEEEEEE","IIIEIIIIIIEIIIII","IIIEIIIIIIEIIIII"],
    hall_stepstone_b: ["gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gglggggggggggggg","gggggIIIIIIggggg","ggggICCCIIIIgggg","ggggIIIIIIIIgggg","ggggIIIIIIEIgggg","ggggIIIIIIEIgggg","ggggIIIIIIEIgggg","ggggIIIIIIEIgggg","ggggIIIIIIIIgggg","ggggEEEEEEEEgggg","ggggggggggggEggg","gggggggggggggggg","gggggggggggggggg"],
    hall_board_b: ["GGGGGGGGGGGGGGGG","GGGGGGGGAAAAGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGGGG","GAAAAAGGGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGGGG","GGGGGGGGGGAAAAGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGGGG","GGGAAAAAGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF"],
    hall_dais_b: ["CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCwwCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCAACCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","CCCCCCCCCCCCCCCD","DDDDDDDDDDDDDDDD"],
    hall_flag_c: ["IIIIIEIIIIIIEIII","IIIIIEIIIIIIEIII","EEEEEEIIIIIIEIII","IIIIIEIIIIIIEIII","IIIIIEIIIIIIEggI","IIIIIEEEEEEEEEEE","IIIIIEIIIIEIIIII","IIIIIEICCIEIIIII","IIIIIEIIIIEIIIII","IIIIIEIIIIEIIIII","EEEEEEEEEEEIIIII","IIIIIIIIIIEIIIII","IICCCIIIIIEIIIII","IIIIIIIIIIEIIIII","IIIIIIIIIIEIIIII","IIIIIIIIIIEIIIII"],
    hall_stepstone_c: ["gggggggggggggggg","gggggggggggggggg","gggggggggggggggg","gglggggggggggggg","gggggggIIIIIIggg","ggggggICCCIIIIgg","ggggggIIIIIIIIgg","ggggggIIIIIIEIgg","ggggggIIIIIIEIgg","ggggggIIIIIIEIgg","ggggggIIIIIIEIgg","ggggggIIIIIIIIgg","ggggggEEEEEEEEgg","ggggggggggggEggg","gggggggggggggggg","gggggggggggggggg"],
    hall_board_c: ["GGGGGGGGGGGGGGGG","GGGGGAAAGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGAAAG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGGGG","GAAAAGGGGGGGGGBG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","GGGGGGGGGGGGGGGG","GGGGGGGGAAAAAAGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF"],
    hall_dais_c: ["CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCwwCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCAACCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","CCCDCCCCCCCCCCCC","DDDDDDDDDDDDDDDD"],
    hall_step: ["CCCCCCCCCCCCCCCC","gIIIIIIIIIIIIIII","gIIIIIIIIIIIIIII","EEEEEEEEEEEEEEEE","FFFFFFFFFFFFFFFF","CCCCCCCCCCCCCCCC","IIIIIIIIIIIIIIIg","IIIIIIIIIIIIIIIg","EEEEEEEEEEEEEEEE","FFFFFFFFFFFFFFFF","CCCCCCCCCCCCCCCC","lIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","EEEEEEEEEEEEEEEE","FFFFFFFFFFFFFFFF","IIIIIIIIIIIIIIII"],
    hall_dais_lip: ["CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","CCCCCCCDCCCCCCCC","wwwwwwwwwwwwwwww","IIIIIIIIIIIIIIII","IIIIIIIIIIIIIIII","FFFFFFFFFFFFFFFF","IIIIIIIIIIIIIIII"],
    hall_hop: ["gwwAAAAAAAAAAwwg","gFwwAAAAAAAAwwFg","ggFwwAAAAAAwwFgg","ggAFwwAAAAwwFAgg","gwwAFwwAAwwFAwwg","gFwwAFwwwwFAwwFg","ggFwwAFwwFAwwFgg","ggAFwwAFFAwwFAgg","ggAAFwwAAwwFGAgg","ggAGAFwwwwFAAAgg","ggAAAAFwwFAAAAgg","wwwwwwwwwwwwwwww","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","EEEEEEEEEEEEEEEE"],
    hall_ledge_seed: ["BBlBBBlBBBlBBBlB","BgBBBgBBBgBBBgBB","FFFFFFFFFFFFFFFF","BBBBBBBBBBBBBBBB","BBBlBBBlBBBlBBBl","BBBgBBBgBBBgBBBg","FFFFFFFFFFFFFFFF","BBBBBBBBBBBBBBBB","BBBAABBBBBBBBBBB","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_seed_b: ["BBBlBBBlBBBlBBBl","BBgBBBgBBBgBBBgB","FFFFFFFFFFFFFFFF","BBBBBBBBBBBBBBBB","BBBBlBBBlBBBlBBB","BBBBgBBBgBBBgBBB","FFFFFFFFFFFFFFFF","BBBBBBBBBBBBBBBB","BBBBBBBAABBBBBBB","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_rose: ["EEEEEEEEEEEEEEEE","ggllllgggggggggg","ggllllggprlllggg","ggggggggrrgggggg","gggprggggggggggg","gggrrgggggggprgg","ggggggprggggrrgg","ggggggrrgggggggg","EEEEEEEEEEEEEEEE","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_rose_b: ["EEEEEEEEEEEEEEEE","ggllllgggggggggg","ggllllgggglllggg","gprgggggggprgggg","grrgggggggrrgggg","ggggggprgggggggg","ggggggrrggggggpr","ggggggggggggggrr","EEEEEEEEEEEEEEEE","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_herb: ["FFFFFFFFFFFFFFFF","FFDFFFtFFFEFFFDF","FDDDFtttFEEEFDDD","FlDDFlttFDEEFlDD","FDDDFtttFEEEFDDD","FDDDFtttFEEEFDDD","FDDDFtttFEEEFDDD","FFgFFFgFFFgFFFgF","FFFFFFFFFFFFFFFF","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_herb_b: ["FFFFFFFFFFFFFFFF","FFtFFFDFFFDFFFEF","FtttFDDDFDDDFEEE","FlttFlDDFlDDFDEE","FtttFDDDFDDDFEEE","FtttFDDDFDDDFEEE","FtttFDDDFDDDFEEE","FFgFFFgFFFgFFFgF","FFFFFFFFFFFFFFFF","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_lily: ["CCCCCCCCCCCCCCCC","IIIIIIIIIIIIIIII","cccccccccccccccc","bbbbpbbbbbbbpbbb","bbslggbbbbblggbb","bbbgggbbbbbgggbb","bbbbbbbbbbbbbbbb","bbbbbbbbbbbbbbbb","EEEEEEEEEEEEEEEE","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_lily_b: ["CCCCCCCCCCCCCCCC","IIIIIIIIIIIIIIII","cccccccccccccccc","bbbbbbbbpbbbbbpb","bbbbbbblggbbblgg","bbbbbbbgggbbbggg","bbbbbbbbbbbbbbbb","bbbbbbbbbbbbbbbb","EEEEEEEEEEEEEEEE","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_tall: ["gggggggggggggggg","gyFygoFogyFygoFo","gyyygooogyyygooo","ggEgggEgggEgggEg","ggEgggEgggEgggEg","ggElggElggElggEl","ggEgggEgggEgggEg","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_tall_b: ["gggggggggggggggg","gggyFygoFogyFygo","gggyyygooogyyygo","ggggEgggEgggEggg","ggggEgggEgggEggg","ggggElggElggElgg","ggggEgggEgggEggg","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_lantern: ["JJJJJJJJJJJJJJJJ","gggggggggggggggg","JJJJJJJJJJJJJJJJ","JggJJJJJJJJJJJJJ","JJJJwyJJJJJJwyJJ","JJJJyyJJJJJJyyJJ","JJJJJJJJJJJJJggJ","JJJJJJJJJJJJJJJJ","EEEEEEEEEEEEEEEE","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    hall_ledge_lantern_b: ["JJJJJJJJJJJJJJJJ","gggggggggggggggg","JJJJJJJJJJJJJJJJ","JggJJJJJJJJJJJJJ","JJJJJJJJwyJJJJJJ","JJJJJJJJyyJJJJJJ","JJJJJJJJJJJJJggJ","JJJJJJJJJJJJJJJJ","EEEEEEEEEEEEEEEE","gggggggggggggggg","gggggggggggggggg","llllllllllllllll","CCCCCCCCCCCCCCCC","EIIIIIIIEIIIIIII","EIIIIIIIEIIIIIII","EEEEEEEEEEEEEEEE"],
    coach_plank: ["AAAAAGAAAAAAAAAA","AAGGGGAAAAAAAAAA","AAAAAGAAAAAAAAAA","FFFFFFFFFFFFFFFF","AAAAAAAAAAAAAGAA","AAAAAAAAAAAAAGAA","AAAAAAAAAAAAAGAA","FFFFFFFFFFFFFFFF","AAAAAAAAAGAAAAAA","AAAAAAAAAGGGAAAA","AAAAAAAAAGAAAAAA","FFFFFFFFFFFFFFFF","AGAAAAAAAAAAAAAA","AGAAAAAAAAAAAAAA","AGAAAAAAAAAAAAAA","FFFFFFFFFFFFFFFF"],
    coach_plank_b: ["AAAAAGAAAAAAAAAA","AAAAAGAAAAAAAAAA","AAAAAGAAAAAAAAAA","FFFFFFFFFFFFFFFF","AAAAAAAAAAAAAGAA","AAAAAAAGGGAAAGAA","AAAAAAAAAAAAAGAA","FFFFFFFFFFFFFFFF","AAAAAAAAAGAAAAAA","AAAAAAAAAGAAAAAA","AAAAAAAAAGAAAAAA","FFFFFFFFFFFFFFFF","AGAAAAAAAAAAAAAA","AGAGGAAAAAAAAAAA","AGAAAAAAAAAAAAAA","FFFFFFFFFFFFFFFF"],
    coach_plank_c: ["AAAAAGAAAAAAAAAA","AAAAAGAAAAAGGAAA","AAAAAGAAAAAAAAAA","FFFFFFFFFFFFFFFF","AAAAAAAAAAAAAGAA","AAAAAAAAAAAAAGBA","AAAAAAAAAAAAAGAA","FFFFFFFFFFFFFFFF","AAAAAAAAAGAAAAAA","AAAAAAAAAGAAAAAA","AAAAAAGGGGAAAAAA","FFFFFFFFFFFFFFFF","AGAAAAAAAAAAAAAA","AGAAAAAAAAAAAAAA","AGAAAAAAAAAAAAAA","FFFFFFFFFFFFFFFF"],
    coach_tile: ["CCCCCCCDCCCCCCCD","CwwCCCCDCCCCCCCD","CCCCCCCDCCCCCCCD","CCCCCCCDCCCCCCCD","CCCCCCCDCCCCCCCD","CCCCCCCDCCCCCCCD","CCCCCCCDCCCCCCCD","DDDDDDDDDDDDDDDD","CCCCCCCDCCCCCCCD","CCCCCCCDCwwCCCCD","CCCCCCCDCCCCCCCD","CCCCCCCDCCCCCCCD","CCCCCCCDCCCCCCCD","CCCCCCCDCCCCCCCD","CCCCCCCDCCCCCCCD","DDDDDDDDDDDDDDDD"],
    rug_coach: ["BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBGGBBBBBBB","BBBBBBGBBGBBBBBB","BBBBBGBBBBGBBBBB","BBBBGBBBBBBGBBBB","BBBBGBBBBBBGBBBB","BBBBBGBBBBGBBBBB","BBBBBBGBBGBBBBBB","BBBBBBBGGBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB","BBBBBBBBBBBBBBBB"],
  };
  // BRIGHTGATE_LAYOUT §7 palette ledger: one floor per room, no new PAL keys. The Lantern House's warm planks are the city's
  // one scuffed floor; Bright Mart's grey panels; the HQ lobby's polished soot-grey gloss; floor 2's light slate panels; the gala's
  // soot gloss with a honey inlay; Hall 4's navy storm stone. Mats in each room's own pair. PLACEHOLDER art until Pia's pass.
  T.floor_bg_plank = woodFloor('G', 'F', [0, 5, 10, 15], [[3, 1], [11, 6], [6, 11]], [[8, 3, 'A'], [2, 8, 'C']]);
  T.floor_bg_plank_b = woodFloor('G', 'F', [1, 6, 11], [[7, 2], [13, 8]], [[4, 4, 'A'], [9, 9, 'A'], [10, 10, 'A'], [14, 13, 'C']]);
  T.floor_bg_plank_c = woodFloor('G', 'F', [0, 6, 12], [[5, 1], [1, 8], [12, 10]], [[6, 7, 'F'], [7, 7, 'F'], [11, 3, 'A']]);
  T.floor_bg_panel = shopFloor('h', null);
  T.floor_bg_panel_b = shopFloor('h', 'y');
  T.floor_bg_panel_c = shopFloor('w', null);
  T.floor_bg_gloss = stoneFloor('d', 'N', [[3, 3, 'm'], [4, 4, 'm'], [11, 11, 'm']], null);
  T.floor_bg_gloss_b = stoneFloor('d', 'N', [[10, 2, 'm'], [11, 3, 'm'], [2, 12, 'h']], null);
  T.floor_bg_gloss_c = stoneFloor('d', 'N', [[6, 9, 'm'], [7, 10, 'm']], [9, 12, 3]);
  T.floor_bg_review = stoneFloor('m', 'h', [[4, 3, 'K'], [12, 10, 'K']], null);
  T.floor_bg_review_b = stoneFloor('m', 'h', [[9, 5, 'K']], [2, 12, 4]);
  T.floor_bg_review_c = stoneFloor('m', 'K', [[3, 11, 'h']], null);
  T.floor_bg_gala = parquetFloor('N', 'd', 'y');
  T.floor_bg_gala_b = parquetFloor('d', 'N', 'y');
  T.floor_bg_gala_c = parquetFloor('N', 'N', 'y');
  T.floor_bg_storm = stoneFloor('n', 'd', [[3, 4, 'b'], [12, 11, 'm']], null);
  T.floor_bg_storm_b = stoneFloor('n', 'd', [[9, 3, 'y'], [2, 12, 'b']], [5, 10, 4]);
  T.floor_bg_storm_c = stoneFloor('n', 'm', [[6, 6, 'b']], null);
  T.mat_bg_lantern = doormat('F', 'V');
  T.mat_bg_store = doormat('N', 'h');
  T.mat_bg_lobby = doormat('N', 'V');
  T.mat_bg_review = doormat('d', 'h');
  T.mat_bg_gala = doormat('V', 'y');
  T.mat_bg_storm = doormat('d', 'y');
  for (const [k, rows] of Object.entries(ART_PASS_TILES)) T[k] = mkTile(g => paintGrid(g, rows));
  // LANTERN_HOUSE_FERNBROOK draft tiles (oak parquet, wire plinth, cable run) live with the other room tiles, so the skin
  // check (maps_b8) finds them here; addCrackdownArt only fills a name that is still missing.
  for (const [k, rows] of Object.entries(CRACKDOWN_ART.tiles)) if (!T[k]) T[k] = mkTile(g => paintGrid(g, rows));
  // TRIAL_HALL_FERNBROOK_MAP §8.1 (D1189, D1195): the contested Hall's Glimmerwell floor and the worn Keeper flagstone. Sprites
  // pass (handoff/shots/trial_hall_fernbrook_art/ART_NOTES.md): P is a strict 8 px grid (h field, K grout, one N pin, one w tick),
  // Z keeps the old stone alive west of a straight N/w lip, U and I/C are the same light grid, M is a short lacquer box under a
  // clipped hedge. Light from the top left; floors have no outlines. PAL keys only, no new key, no Q. Only the flagged Hall
  // (HALL2_ON in game.js) paints these; today's fb_hall_in grid never uses P Z U M I C.
  const HALL2_TILES = {
    glim_tile: ["hhhhhhhKhhhhhhhK", "hhwhhhhKhhhhhhhK", "hwhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "KKKKKKKKKKKKKKKK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "KKKKKKKKKKKKKKKN"],
    glim_tile_b: ["hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhwhhK", "hhhhhhhKhhhwhhhK", "hhhhhhhKhhwhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "KKKKKKKKKKKKKKKK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "hhhhhhhKhhhhhhhK", "KKKKKKKKKKKKKKKN"],
    glim_seam: ["IIIIINwhhhhhhhhK", "ICCCINwhhhhhhhhK", "IIIIENwhhhhhhhhK", "IIFIINwhhhhhhhhK", "IIIFENwhhhhhhhhK", "IIIFINwhhhhhhhhK", "IIIIINwhhhhhhhhK", "EEEEENwKKKKKKKKK", "IIIEINwhhhhhhhhK", "IFIEINwhhhhhhhhK", "IIFIINwhhhhhhhhK", "IIIIFNwhhhhhhhhK", "IICCCNwhhhhhhhhK", "IIIgINwhhhhhhhhK", "IgllgNwhhhhhhhhK", "EEgEENwKKKKKKKKN"],
    glim_step: ["wwwwwwwwwwwwwwww", "hhhhhhhhhhhhhhhh", "hmhhhhhhhhhhhhmh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "KKKKKKKKKKKKKKKK", "wwwwwwwwwwwwwwww", "hhhhhhhhhhhhhhhh", "hmhhhhhhhhhhhhmh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "NNNNNNNNNNNNNNNN"],
    hall_ledge_glim: ["llllllllllllllgE", "lgggggggggggggEE", "gggggggggggggggE", "ggggEgggggggEggE", "gggggggggggggggE", "ggggggggggggggEE", "EEEEEEEEEEEEEEEE", "wwwwwwwwwwwwwwwh", "hhhhhhhhhhhhhhhm", "NddddddddNNNNNNN", "NNNNNNNNNNNNNNNN", "VrrVVVVVVVVVVVVN", "VVVVVVVVVVVVVVVN", "NNNNNNNNNNNNNNNN", "mmmmmmmmmmmmmmmm", "hhhhhhhhhhhhhhhK"],
    hall_ledge_glim_b: ["llllllllllllllgE", "lgggggggggggggEE", "gggggggggggggggE", "ggggEgggggggEggE", "gggggggggggggggE", "ggggggggggggggEE", "EEEEEEEEEEEEEEEE", "wwwwwwwwwwwwwwwh", "hhhhhhhhhhhhhhhm", "NddddddddNNNNNNN", "NNNNNNNyNNNNNNNN", "VrrVVVyVyVVVVVVN", "VVVVVVVyVVVVVVVN", "NNNNNNNNNNNNNNNN", "mmmmmmmmmmmmmmmm", "hhhhhhhhhhhhhhhK"],
    glim_dais: ["wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "hhhhhhhKhhhhhhhK", "KKKKKKKKKKKKKKKK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "hhhhhhhKhhhhhhhK", "KKKKKKKKKKKKKKKm"],
    glim_dais_lip: ["wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "hhhhhhhKhhhhhhhK", "KKKKKKKKKKKKKKKK", "wwwwwwwKwwwwwwwK", "wwwwwwwKwwwwwwwK", "hhhhhhhKhhhhhhhK", "wwwwwwwwwwwwwwww", "VVVVVVVVVVVVVVVV", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "NNNNNNNNNNNNNNNN"],
    hall_flag_worn: ["IIIIIIIIIIEIIIII", "ICCCIIIIIIEIIIII", "IIIIIIIIIIEIIIII", "IIIIIIIIIIEIICCI", "IIIIIIIIIIEIIIII", "EEEEEEEEEEEIIIII", "IIIIIEIIIIEIIIII", "IIIIIEICCIEIIIII", "IIFIIEIIIIEIIIII", "IIIFIEIIIIEIIIII", "IIIgFEEEEEEEEEEE", "IIIIlEIIIIggEIII", "IIIIgFIIIIIIEIII", "EEEEEEFIIIIIEIII", "IICIIEIFIIIIEIII", "IIIIIEIIgIIIEIII"],
  };
  for (const [k, rows] of Object.entries(HALL2_TILES)) T[k] = mkTile(g => paintGrid(g, rows));
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
  // PARTNER_DAY rooms (rule 9: inspiration brief, then existing tiles only). Each pairing is new: no other room uses it.
  house_bedroom: { remap: { '#':'wall_peach', W:'wall_peach_face', W2:'wall_peach_win', '.':'floor_pine', '=':'rug_sunflower', m:'mat_home', '^':'stair_home' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: floorFixVar('floor_pine'), wall: wallRow('GyBhmwBFGcsB') },
  house_hallway: { remap: { '#':'wall_plaster', W:'wall_plaster_face', W2:'wall_plaster_win', '.':'floor_loft', '~':'runner_hall', '=':'runner_hall', m:'mat_loft', '^':'stair_loft', E:'floor_loft' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1, '~':1, E:1 }, variants: floorFixVar('floor_loft'), wall: wallRow('GyFCIBFFGcsF') },
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
  // BRINEWICK. Plank, rope, brass and sea blue; the depot is the one wine-and-graphite room. Wall rows are unique to each room.
  bw_lantern: hcSkin('floor_ropeplank', 'wall_brine_rest', 'mat_brine_rest', { remap: { '=': 'rug_navy_runner' }, wall: wallRow('nbdwhnnFdcsn') }),
  bw_store: hcSkin('floor_tarboard', 'wall_chandler', 'mat_chandler', { wall: wallRow('mhdhKFFdFcsF') }),
  bw_hall: hcSkin('floor_ferrydeck', 'wall_ferry', 'mat_ferry', { decal: { q: 'deck_lane' }, walk: { q: 1 }, wall: wallRow('ncdwhrrdnswn') }),
  bw_depot: hcSkin('floor_sealed', 'wall_depot', 'mat_depot', { decal: { q: 'depot_line' }, walk: { q: 1 }, wall: wallRow('dmdmdVVddswV') }),
  // BRIGHTGATE_LAYOUT §7 (rule 9 previews approved, D2000-D2009): each room its own wall row and floor; Glimmerwell rooms inside
  // the Glimmerwell set (soot, wine, white, grey, slate, honey marks), Hall 4 neutral. The Lantern House is the old cream house
  // with a wine band at the wainscot and a soot plinth (D1490, D2009).
  bg_lantern: hcSkin('floor_bg_plank', 'wall_cream', 'mat_bg_lantern', { wall: wallRow('FCGCAVNFGcwF') }),
  bg_store: hcSkin('floor_bg_panel', 'wall_vault', 'mat_bg_store', { wall: wallRow('mwhwhyNdmcsh') }),
  bg_lobby: hcSkin('floor_bg_gloss', 'wall_vault', 'mat_bg_lobby', { remap: { E: 'lift_doors' }, walk: { E: 1 }, wall: wallRow('NwhwhVNdNswN') }),
  bg_review: hcSkin('floor_bg_review', 'wall_stone', 'mat_bg_review', { remap: { E: 'lift_doors' }, walk: { E: 1 }, wall: wallRow('dhmhmNNdmcwd') }),
  bg_gala: hcSkin('floor_bg_gala', 'wall_civic', 'mat_bg_gala', { remap: { '=': 'floor_bg_gala_c' }, wall: wallRow('NVpVpyNdyswN') }),
  bg_hall: hcSkin('floor_bg_storm', 'wall_slate', 'mat_bg_storm', { remap: { '=': 'floor_bg_storm_c' }, wall: wallRow('dmKmKyndycsd') }),   // Hall 4: navy storm stone, slate, copper-gold
  // HIGH_CHARITY_LAYOUT §7 palette ledger (rule 9 previews pending). Existing tile families only; each wall+floor pair is new.
  // B7. Observatory and the three dream rooms. `u` and `v` stay the shared window light and wall shadow.
  obs: { remap: { '#':'wall_obs_dome', W:'wall_obs_face', W2:'wall_obs_win', '.':'floor_dusk', m:'mat_dusk' }, decal: { v:'wall_shadow_obs', u:'window_light_obs', z:'star_tick_brass' }, walk: { v:1, u:1, z:1 }, variants: floorFixVar('floor_dusk'), wall: wallRow('FGdGFyFFynsF') },
  dream_2004: { remap: { '#':'wall_mist', W:'wall_mist_face', W2:'wall_mist_win', '.':'floor_mist', '=':'rug_mem' }, decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 }, variants: floorFixVar('floor_mist'), wall: wallRow('mhnhmcndmcwb') },
  dream_party: { remap: { '#':'wall_fest', W:'wall_fest_face', W2:'wall_fest_win', '.':'floor_party', p:'floor_lane' }, decal: { v:'wall_shadow', u:'window_light', q:'streamer' }, walk: { v:1, u:1, q:1 }, variants: {}, wall: wallRow('oyryocddrcwr') },
  dream_drive: { remap: { '#':'wall_night', W:'wall_night_face', W2:'wall_night_win', '.':'floor_asphalt' }, decal: { v:'wall_shadow', u:'window_light', j:'lane_paint' }, walk: { v:1, u:1, j:1 }, variants: houseVar('floor_asphalt', 'floor_asphalt_b', 'floor_asphalt_c'), wall: wallRow('mhdndmddmywd') },
  // B8. Fernbrook's two new rooms. Calm cream planks and a moss hall. Neither reuses a lantern, Calloway, Lodge, observatory or Keeper floor.
  // LANTERN_HOUSE_FERNBROOK §5.2, §8 (LH-1): the Lantern House as Fernbrook's wire station. Oak parquet (draft tiles in
  // CRACKDOWN_ART), the Keeper runner `,` and rug `=`, the Keeper mat, `K` the wire set's plinth (solid), `~` a brass cable
  // channel (walkable decal), and a green-and-gold wall row unique among the skins. `q`/`j` keep the orchard decals.
  fb_lantern: {
    remap: { '#':'wall_orchard', W:'wall_orchard_face', W2:'wall_orchard_win', '.':'floor_parquet_oak', '=':'rug_keeper', m:'mat_keep', ',':'rug_keep', h:'hearth_orchard', K:'wire_plinth' },
    decal: { v:'wall_shadow_orchard', u:'window_light_orchard', q:'leaf_orchard', j:'apple_speck', '~':'cable_run' },
    walk: { v:1, u:1, q:1, j:1, ',':1, h:1, '=':1, '~':1, K:0 },
    variants: { floor_parquet_oak: [['floor_parquet_oak_b', 0.18], ['floor_parquet_oak_c', 0.14]] },
    wall: wallRow('FyGJFyGFGcwF'),
  },
  fb_hall: {
    remap: { "#":"wall_bloom", "W":"wall_bloom_face", "W2":"wall_bloom_win", "f":"floor_bloom", "T":"hedge_bloom", "=":"rug_bloom", "m":"mat_bloom", ":":"hall_moss", ".":"hall_moss", ",":"hall_path", ";":"hall_flag", "b":"hall_stepstone", "z":"hall_board", "a":"hall_step", "d":"hall_dais", "e":"hall_dais_lip", "N":"hall_ledge_seed", "O":"hall_ledge_rose", "Q":"hall_ledge_herb", "L":"hall_ledge_lily", "G":"hall_ledge_tall", "J":"hall_ledge_lantern", "k":"hall_earth", "V":"hall_hop",
      /* TRIAL_HALL_FERNBROOK_MAP §8.1: the flagged contested Hall's east half. Unused by today's grid. */ "P":"glim_tile", "Z":"glim_seam", "U":"glim_step", "M":"hall_ledge_glim", "I":"glim_dais", "C":"glim_dais_lip" },
    decal: { v:'wall_shadow_bloom', u:'window_light_bloom', q:'petal_scatter', j:'leaf_scatter' },
    walk: { "v":1, "u":1, "q":1, "j":1, ",":1, ";":1, "b":1, "z":1, "a":1, "d":1, "e":1, "N":0, "O":0, "Q":0, "L":0, "G":0, "J":0, "k":1, "V":0, "P":1, "Z":1, "U":1, "M":0, "I":1, "C":1 },
    hop: { V: 'down' },
    variants: Object.assign({}, houseVar('floor_bloom', 'floor_bloom_b', 'floor_bloom_c'), {
      hall_moss: [["hall_moss_b", 0.3], ["hall_moss_c", 0.25]],
      hall_path: [["hall_path_b", 0.3], ["hall_path_c", 0.25]],
      hall_earth: [["hall_earth_b", 0.3], ["hall_earth_c", 0.25]],
      hall_flag: [["hall_flag_b", 0.3], ["hall_flag_c", 0.25]],
      hall_stepstone: [["hall_stepstone_b", 0.3], ["hall_stepstone_c", 0.25]],
      hall_board: [["hall_board_b", 0.3], ["hall_board_c", 0.25]],
      hall_dais: [["hall_dais_b", 0.3], ["hall_dais_c", 0.25]],
      hall_ledge_seed: [["hall_ledge_seed_b", 0.45]],
      hall_ledge_rose: [["hall_ledge_rose_b", 0.45]],
      hall_ledge_herb: [["hall_ledge_herb_b", 0.45]],
      hall_ledge_lily: [["hall_ledge_lily_b", 0.45]],
      hall_ledge_tall: [["hall_ledge_tall_b", 0.45]],
      hall_ledge_lantern: [["hall_ledge_lantern_b", 0.45]],
      glim_tile: [["glim_tile_b", 0.35]],
      hall_ledge_glim: [["hall_ledge_glim_b", 0.45]],
      hedge_bloom: [['hedge_bloom_b', 0.34], ['hedge_bloom_c', 0.33]],
      wall_bloom: [['wall_bloom_b', 0.34], ['wall_bloom_c', 0.33]]
    }),
    wall: wallRow('DCECDpgEEcsJ'),
  },
  // Market Row (D391). Cap differs from the face. No brick floors. No new PAL keys. k stays off the wall roles.
  house_store: {
    remap: { '#':'wall_plaster', W:'wall_plaster_face', W2:'wall_plaster_win', '.':'floor_aisle', m:'mat_aisle' },
    decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 },
    variants: { floor_aisle: [['floor_aisle_b', 0.22], ['floor_aisle_c', 0.18]] },
    wall: wallRow('ncbhnynFbcyr'),
  },
  house_wardrobe: {
    remap: { '#':'wall_cream', W:'wall_cream_face', W2:'wall_cream_win', '.':'floor_herring', m:'mat_herring' },
    decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 },
    variants: { floor_herring: [['floor_herring_b', 0.22], ['floor_herring_c', 0.18]] },
    wall: wallRow('JHJCGJJFJyHp'),
  },
  house_diner: {
    remap: { '#':'wall_log', W:'wall_log_face', W2:'wall_log_win', '.':'coach_plank', ',':'coach_tile', '=':'rug_coach', m:'mat_diner' },
    decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1, ',':1, '=':1 },
    variants: { coach_plank: [['coach_plank_b', 0.3], ['coach_plank_c', 0.2]] },
    wall: wallRow('FyornwCFryyo'),
  },
  // FERNBROOK_HOMES (D1248-D1252). One skin per south-lane home: own floor, rug, mat and wall row. Remap '#'/W keep the orchard
  // wall names for anything that reads them; the wall kit draws the walls. Press: honey boards + flagstone. Picker: sunny parquet.
  // Stitch: painted blue-grey boards + patchwork rug.
  fbh_press: {
    remap: { '#':'wall_orchard', W:'wall_orchard_face', W2:'wall_orchard_win', '.':'floor_press', ',':'press_flag', '=':'rug_press', m:'mat_press' },
    decal: { v:'wall_shadow', u:'window_light', j:'apple_speck' }, walk: { v:1, u:1, j:1, ',':1 },
    variants: { floor_press: [['floor_press_b', 0.22], ['floor_press_c', 0.18]], press_flag: [['press_flag_b', 0.3], ['press_flag_c', 0.25]] },
    wall: wallRow('FyBGBrFFFcwB'),
  },
  fbh_picker: {
    remap: { '#':'wall_orchard', W:'wall_orchard_face', W2:'wall_orchard_win', '.':'floor_picker', '=':'rug_picker', m:'mat_picker' },
    decal: { v:'wall_shadow', u:'window_light', q:'leaf_orchard' }, walk: { v:1, u:1, q:1 },
    variants: { floor_picker: [['floor_picker_b', 0.22], ['floor_picker_c', 0.18]] },
    wall: wallRow('ElFCDgEFGcwB'),
  },
  fbh_stitch: {
    remap: { '#':'wall_orchard', W:'wall_orchard_face', W2:'wall_orchard_win', '.':'floor_stitch', '=':'rug_patch', m:'mat_stitch' },
    decal: { v:'wall_shadow', u:'window_light', j:'leaf_scatter' }, walk: { v:1, u:1, j:1 },
    variants: { floor_stitch: [['floor_stitch_b', 0.22], ['floor_stitch_c', 0.18]] },
    wall: wallRow('mhdwhpmdpcsp'),
  },
  // WEIR_HUT §3.1, §5 (D1591): the weir hut. River-stone flags, a sacking rug and mat, the lipped weir trough and its planks.
  // Remap '#'/W keep the rough-stone names for anything that reads them; the wall kit draws the walls (cap I, face K).
  weir_hut: {
    remap: { '#':'wall_rough', W:'wall_rough_face', W2:'wall_rough_win', '.':'weir_flag', '=':'rug_sacking', m:'mat_sacking', w:'weir_trough', B:'weir_plank' },
    decal: { v:'wall_shadow', u:'window_light' }, walk: { v:1, u:1 },
    variants: { weir_flag: [['weir_flag_b', 0.22], ['weir_flag_c', 0.12]] },
    wall: wallRow('ICFKmFFFFcsB'),
  },
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
// HIGH_CHARITY_LAYOUT phase 1 room skins (rule 9 briefs in handoff/maps/HC_CITY_V2.md; each a new wall and floor pair).
// Kept out of HOUSE_SKINS: game.js adds them to SKINS and HOUSE_SKINS only while the city is on (HC_CITY_V2 or the preview).
const HC_CITY_SKINS = {
  hc_lantern_grand: hcSkin('floor_lantern', 'wall_cream', 'mat_lantern', { wall: wallRow('GyFCAyGFGcwF') }),
  hc_news_1: hcSkin('floor_warden', 'wall_stone', 'mat_hall', { wall: wallRow('mwdhmmddmcwd') }),
  hc_news_2: hcSkin('floor_keep', 'wall_stone', 'mat_hall', { wall: wallRow('dhdhmdddmcsd') }),
  hc_gov_1: hcSkin('floor_wardstone', 'wall_sage', 'mat_warden', { wall: wallRow('JyEDEJJFJcwJ') }),
  // CABINET_AND_COUNCILS 1b: the Cabinet Room shares floor 1's wall row (one house, one wall), on the Keeper House's slate floor with
  // a third variant (Vincent, Nov 4) and the navy civic runner (= - + *).
  hc_gov_2: (sk => { sk.variants.floor_keep.push(['floor_keep_d', 0.14]); return sk; })(hcSkin('floor_keep', 'wall_sage', 'mat_keep', {
    remap: { '=': 'rug_civic_v', '-': 'rug_civic_h', '+': 'rug_civic_turn', '*': 'rug_civic_end' }, walk: { '=': 1, '-': 1, '+': 1, '*': 1 },
    wall: wallRow('JyEDEJJFJcwJ') })),
  hc_gov_3: hcSkin('floor_clinic_warm', 'wall_cream', 'mat_lantern_warm', { remap: { '=': 'rug_coach' }, wall: wallRow('BrFCArGFGcwr') }),
  // WAR_MUSEUM v0.1.1 §4.3 (D2301): the Muster Road Museum. INTERIOR_WALLS kit, role string dmdJEyFFGnwF (deep Keeper green J face,
  // olive E edges, a gold y picture rail, warm F base; no window cells, glass highlight w, so no mint): no other interior has J walls.
  // The Long Watch on oak parquet (.), the Wing on pale cream stone (,), the sand runner up the seam (: and ;), the kids' rug (~).
  hc_museum_in: (sk => { sk.variants.floor_wing = [['floor_wing_b', 0.2]]; return sk; })(hcSkin('floor_parquet_oak', 'wall_sage', 'mat_keep', {
    weights: [0.2, 0.15], remap: { ',': 'floor_wing', ':': 'runner_museum_w', ';': 'runner_museum_e', '~': 'rug_reading' },
    walk: { ',': 1, ':': 1, ';': 1, '~': 1 }, wall: wallRow('dmdJEyFFGnwF') })),
};
const SKINS = Object.assign({ lab: LAB_SKIN, tunnel: TUNNEL_SKIN }, HOUSE_SKINS);
SKINS.school = HOUSE_SKINS.school = {"remap": {"#": "wall_wainscot_t", "W": "wall_wainscot_t_face", "W2": "wall_wainscot_t_win", ":": "floor_school_check", ",": "floor_school_tile", ".": "floor_school_lino", "=": "runner_school", "~": "rug_reading", "m": "mat_school"}, "decal": {}, "walk": {":": 1, ",": 1, "~": 1}, "wall": wallRow('tcnwhtndtcsn')};
SKINS.flats_lobby = HOUSE_SKINS.flats_lobby = {"remap": {"#": "wall_wainscot_n", "W": "wall_wainscot_n_face", "W2": "wall_wainscot_n_win", ",": "floor_lobby_tile", ".": "floor_lobby_terrazzo", "=": "rug_lobby", "E": "lift_doors", "S": "stairs_up", "m": "mat_lobby"}, "decal": {}, "walk": {",": 1, "E": 1, "S": 0}, "wall": wallRow('nbdwhnddncsb')};
SKINS.flats_home = HOUSE_SKINS.flats_home = {"remap": {"#": "wall_home_5b", "W": "wall_home_5b_face", "W2": "wall_home_5b_win", ",": "floor_terracotta", ".": "floor_honey", "=": "rug_kitchen", "~": "runner_hall", "_": "carpet_navy", "m": "mat_home_5b", "e": "floor_bath_tile", "a": "rug_sunflower", "n": "rug_fern", "r": "rug_domino", "k": "floor_paint_plank"}, "decal": {}, "walk": {",": 1, "~": 1, "_": 1, "e": 1, "a": 1, "n": 1, "r": 1, "k": 1}, "wall": wallRow('oypyopdFpcwp')};
// KILNMOUTH v0.1.1 (D1820, D1821, D1834; rule 9 previews approved): the packet's blockout chars are the grids. These skins map
// them to KILNMOUTH_ART tiles on Kilnmouth's maps only, so no global map char is redefined (the walk tables win, as on every skin).
const KM_GRASS = [['grass_b', 0.18], ['grass_c', 0.12], ['flower_patch', 0.05]];   // OUTDOOR_SKIN's grass, defined further down
SKINS.km_town = { remap: { g: 'g', o: 'km_shard', u: 'km_runnel_l', U: 'km_runnel_r', b: 'km_plank', v: 'km_ring', q: 'km_grate', e: 'km_rim', Y: 'km_setts',
  h: 'km_hillpath', C: 'km_hill', Q: 'km_tower_foot', k: 'km_kiln_foot', S: 'p', j: 'km_shards', m: 'km_mud', w: 'km_pool' },
  walk: { o: 1, u: 1, U: 1, b: 1, v: 1, q: 1, e: 1, Y: 1, h: 1, m: 1, C: 0, Q: 0, k: 0, S: 0, j: 0 }, decal: {},
  variants: { g: KM_GRASS, km_shard: [['km_shard_b', 0.22], ['km_shard_c', 0.18]] } };
SKINS.km_road = { remap: { g: 'g', C: 'km_clay', j: 'km_shards', m: 'km_mud', o: 'km_ford', a: 'km_ford_wet' },
  walk: { C: 0, j: 0, m: 1, o: 1, a: 1 }, decal: {}, variants: { g: KM_GRASS } };
// The six rooms (§6 palette ledger): each a new floor and wall pair and its own wall row.
SKINS.km_lantern = HOUSE_SKINS.km_lantern = hcSkin('floor_km_kettle', 'wall_km_kettle', 'mat_km_kettle', { wall: wallRow('GCFCAyFFGcwF') });
SKINS.km_store = HOUSE_SKINS.km_store = hcSkin('floor_km_shard', 'wall_km_sage', 'mat_km_shard', { wall: wallRow('EDFDEGFFGcwE') });
SKINS.km_bath = HOUSE_SKINS.km_bath = hcSkin('floor_km_bath', 'wall_km_bath', 'mat_km_bath', { remap: { w: 'km_basin', i: 'km_basin_top' }, walk: { w: 0, i: 0 }, wall: wallRow('mhdhmrdmrcwm') });
SKINS.km_council = HOUSE_SKINS.km_council = hcSkin('floor_km_flag', 'wall_km_rose', 'mat_km_council', { remap: { r: 'km_rail' }, walk: { r: 0 }, wall: wallRow('FHdHBGFFFcwB') });
SKINS.km_hall = HOUSE_SKINS.km_hall = hcSkin('floor_km_ch1', 'wall_km_kiln', 'mat_km_hall', { remap: { ',': 'floor_km_ch2', ':': 'floor_km_ch3', ';': 'floor_km_ch4', a: 'km_arch' },
  walk: { ',': 1, ':': 1, ';': 1, a: 0 }, wall: wallRow('dNdNmBddFowd') });
Object.assign(SKINS.km_hall.variants, { floor_km_ch2: [['floor_km_ch2_b', 0.18], ['floor_km_ch2_c', 0.16]], floor_km_ch3: [['floor_km_ch3_b', 0.18], ['floor_km_ch3_c', 0.16]],
  floor_km_ch4: [['floor_km_ch4_b', 0.18], ['floor_km_ch4_c', 0.16]] });
SKINS.km_stone = HOUSE_SKINS.km_stone = hcSkin('floor_km_slip', 'wall_km_stone', 'mat_km_stone', { remap: { d: 'km_dais' }, walk: { d: 1 }, wall: wallRow('NFdFBGddByoB') });
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
  A.glimmer_stand = mkTile(g => { px(g,PAL.w,1,7,14,3); px(g,PAL.h,1,10,14,1); px(g,PAL.d,2,11,1,5); px(g,PAL.d,13,11,1,5); [[3,'V'],[7,'s'],[11,'V']].forEach(([x,c]) => { px(g,PAL.d,x,3,2,1); px(g,PAL[c],x,4,2,3); px(g,PAL.w,x,4,1,1); }); px(g,PAL.V,1,7,14,1); });
  A.crate = mkTile(g => { px(g,PAL.d,1,3,14,13); px(g,PAL.o,2,4,12,11); px(g,PAL.d,2,9,12,1); for (let i=0;i<11;i++) px(g,PAL.d,2+i,4+i,1,1); px(g,PAL.y,3,5,1,1); });
  // Rook's Crossroads: a sealed quarry crate. Wine band, three air holes, one glow. Original; the orchard crate stays A.crate.
  A.rc_crate = mkTile(g => {
    px(g,PAL.d,2,3,12,12); px(g,PAL.o,3,4,10,10); px(g,PAL.d,3,3,10,1);
    px(g,PAL.V,3,8,10,2);
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
    oval(g, 7.5, 5 + f, 6, 5.5, PAL.d); oval(g, 7.5, 5 + f, 5, 4.5, PAL[col]); oval(g, 6, 4, 1.2, 1.2, PAL.w); px(g,PAL.d,7,10,2,1); px(g,PAL.h,7,11,1,4); px(g,PAL.h,8,13,1,1);
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
    px(g,PAL.V,4,2,1,1); px(g,PAL.V,11,3,1,1); px(g,PAL.V,3,6,1,1); px(g,PAL.V,12,5,1,1);
    px(g,PAL.d,7,8,2,7); px(g,PAL.m,5,15,6,1); px(g,PAL.d,5,3,6,6); px(g,PAL.V,6,4,4,4); px(g,PAL.w,6,4,2,1); px(g,PAL.y,7,5+f,2,2);
    px(g,PAL.Q,1,1,1,1); px(g,PAL.Q,14,1,1,1); px(g,PAL.Q,1,12,1,1); px(g,PAL.Q,14,10,1,1);
  }));
  // The Signal Review. Wine relay ring, the Capital screen face, and the loaned crate. PAL only. The ring stays off the maps.
  A.relay_ring = [0, 1, 2].map(f => mkTile(g => {
    const y = 12 - f;
    px(g, PAL.V, 2, y, 12, 1); px(g, PAL.V, 1, y - 1, 1, 2); px(g, PAL.V, 14, y - 1, 1, 2);
    px(g, PAL.y, 4, y, 2, 1); px(g, PAL.y, 10, y, 2, 1);
  }));
  A.capital_screen = mkTile(g => {
    px(g, PAL.d, 1, 1, 14, 14); px(g, PAL.k, 2, 2, 12, 12); px(g, PAL.V, 3, 3, 10, 8);
    px(g, PAL.y, 5, 5, 2, 2); px(g, PAL.y, 9, 5, 2, 2); px(g, PAL.w, 6, 9, 4, 1);
    px(g, PAL.m, 2, 12, 12, 2);
  });
  A.loan_crate = mkTile(g => {
    px(g, PAL.d, 1, 3, 14, 13); px(g, PAL.o, 2, 4, 12, 11); px(g, PAL.V, 2, 8, 12, 2);
    px(g, PAL.m, 5, 5, 6, 4); px(g, PAL.k, 6, 6, 1, 1); px(g, PAL.k, 9, 6, 1, 1); px(g, PAL.h, 7, 8, 2, 1);
  });
  // BRINEWICK: the Glimmer Cell crate (ASSET_HANDOFF T4, a cage and not a box), the same crate opened, and the Hall's tide gauge.
  A.cell_crate = [0, 1].map(f => mkTile(g => {
    px(g, PAL.d, 1, 2, 14, 14); px(g, PAL.m, 2, 3, 12, 12);
    oval(g, 7.5, 10.5, 4, 3, PAL.h); px(g, PAL.w, 6, 9, 1, 1); px(g, PAL.w, 9, 9, 1, 1);
    [3, 6, 9, 12].forEach(x => px(g, PAL.d, x, 3, 1, 12)); px(g, PAL.d, 2, 7, 12, 1);
    px(g, PAL.h, 2, 3, 12, 1); px(g, PAL.V, 5, 1, 6, 2); px(g, PAL.Q, 6 + f, 1, 3, 1);
  }));
  A.depot_crate = mkTile(g => {   // the depot's identical stock: cool grey slats, one wine leaf, soot stem
    px(g, PAL.d, 1, 3, 14, 13); px(g, PAL.h, 2, 4, 12, 11); px(g, PAL.K, 2, 8, 12, 1); px(g, PAL.K, 2, 12, 12, 1);
    px(g, PAL.w, 2, 4, 12, 1); px(g, PAL.V, 7, 5, 2, 2); px(g, PAL.N, 7, 7, 1, 1); px(g, PAL.d, 1, 15, 14, 1);
  });
  A.cell_crate_open = mkTile(g => {
    px(g, PAL.d, 1, 6, 14, 10); px(g, PAL.k, 2, 7, 12, 8); px(g, PAL.m, 2, 14, 12, 1);
    px(g, PAL.d, 0, 2, 13, 3); px(g, PAL.m, 1, 3, 11, 1); px(g, PAL.V, 4, 2, 5, 1);
  });
  A.tide_gauge = mkTile(g => {
    px(g, PAL.b, 2, 13, 12, 3); px(g, PAL.c, 3, 13, 4, 1);
    px(g, PAL.d, 6, 1, 4, 13); px(g, PAL.w, 7, 2, 2, 11);
    [3, 7, 11].forEach((y, i) => px(g, PAL[i === 1 ? 'r' : 'n'], 7, y, 2, 1));
    px(g, PAL.y, 6, 1, 4, 1);
  });
  A.census_tent = mkTile(g => {
    px(g,PAL.d,7,1,2,14); px(g,PAL.w,2,4,12,8); px(g,PAL.V,2,4,12,2); px(g,PAL.V,2,8,12,1);
    px(g,PAL.d,3,6,4,4); px(g,PAL.k,3,6,4,1); px(g,PAL.h,4,12,8,2);
  });
  A.glimmer_gate = mkTile(g => {
    px(g,PAL.d,1,4,2,12); px(g,PAL.d,13,4,2,12); px(g,PAL.V,1,4,14,3); px(g,PAL.w,3,5,10,1);
    px(g,PAL.y,7,8,2,2); px(g,PAL.o,6,9,4,1); px(g,PAL.V,7,11,2,2); px(g,PAL.m,2,14,12,1);
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
    for (let x = 3; x < 13; x += 2) { px(g, x % 4 ? PAL.V : PAL.w, x, 3, 2, 2); px(g, x % 4 ? PAL.w : PAL.V, x, 5, 2, 2); }
  });
  A.miner_lamps = mkTile(g => {
    px(g,PAL.o,1,3,14,2); px(g,PAL.d,1,5,14,1); px(g,PAL.o,1,12,14,2);
    [3,7,11].forEach(x => { px(g,PAL.d,x+1,6,1,3); px(g,PAL.y,x,9,3,3); px(g,PAL.d,x,11,3,1); px(g,PAL.h,x,9,1,1); });
  });
  // D133: retired. The pixels stay so nothing that still names the key draws a hole. No map places this kiosk.
  // Side changes go through Rook (D127), not a desk.
  A.switch_desk_glimmer = mkTile(g => ['..NNNNNNNNNNNN..', '..NwwwwwwwwwwN..', '..NwVwVwVwVwVN..', '..NNNNNNNNNNNN..', '...d........d...', '...d.hhhhhh.d...',
    '...d.hwhrhw.d...', '...d.hwhVhw.d...', '.VVVVVVVVVVVVVV.', '.NwwwwwwwwwwwwN.', '.NVVVVVVVVVVVVN.', '.NVVVwwVVwwVVVN.', '.NVVVwwVVwwVVVN.', '.NVVVVVVVVVVVVN.',
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
  A.rx4b_tank = [
    [
      "....mmmmmmmm....",
      "...mmmmmmmmmm...",
      "...NwcccccccN...",
      "...NwcccccccN...",
      "...NwcccccccN...",
      "...NwcccccccN...",
      "...NwVVVVVVdN...",
      "...NwVwVVVVdN...",
      "...NwVVVVVVdN...",
      "...NwVVVVwVdN...",
      "...NwVVVVVVdN...",
      "...NwVVVVVVdN...",
      "...NwVVwVVVdN...",
      "...NwVVhhVVdN...",
      "...dddddddddd...",
      "....dddddddd...."
    ],
    [
      "....mmmmmmmm....",
      "...mmmmmmmmmm...",
      "...NwcccccccN...",
      "...NwcccccccN...",
      "...NwcccccccN...",
      "...NwcccccccN...",
      "...NwVVVVwVdN...",
      "...NwVVVVVVdN...",
      "...NwVVwVVVdN...",
      "...NwVVVVVVdN...",
      "...NwVVVVVVdN...",
      "...NwVVVwVVdN...",
      "...NwVVVVVVdN...",
      "...NwVVhhVVdN...",
      "...dddddddddd...",
      "....dddddddd...."
    ]
  ].map(fr => mkTile(g => rxPaint(g, fr)));
  A.rx4b_tank.ms = 600;
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
    '.dookkkkVVVVVod.',
    '.dokhhhkVVVVVod.',
    '.dokwwwkVVVVVod.',
    '.dokkkkkVVVVVod.',
    '.doVVwVVVVVVVod.',
    '.doVVywVVVVVVod.',
    '.doVVVVwwVVVVod.',
    '.doVVVyyyyVVVod.',
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
    '.VVVVVVVV.......',
    '..VVVVVVVV......',
    '...VwyyyywV.....',
    '....VwywyywV....',
    '.....VwyyyywV...',
    '......VwwmmwwV..',
    '.......VwwwwwwV.',
    '........VVVVVVw.',
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
  // Market Row props. PAL only. The hoop ring holds a lantern; the bell hangs over the shop door.
  A.mr_cooler = mkTile(g => {
    px(g, PAL.n, 2, 2, 12, 13); px(g, PAL.h, 3, 3, 10, 8); px(g, PAL.c, 4, 4, 8, 6); px(g, PAL.s, 4, 4, 3, 2);
    px(g, PAL.b, 3, 12, 10, 2); px(g, PAL.y, 7, 12, 2, 1); px(g, PAL.d, 2, 15, 12, 1);
  });
  A.mr_bell = mkTile(g => {
    px(g, PAL.d, 7, 1, 2, 3); px(g, PAL.y, 5, 4, 6, 5); px(g, PAL.o, 6, 5, 4, 3); px(g, PAL.d, 7, 9, 2, 2); px(g, PAL.y, 6, 11, 4, 1);
  });
  A.mr_rack = mkTile(g => {
    px(g, PAL.d, 2, 2, 12, 2); px(g, PAL.o, 3, 4, 2, 10); px(g, PAL.o, 11, 4, 2, 10);
    px(g, PAL.r, 5, 5, 2, 7); px(g, PAL.b, 7, 6, 2, 6); px(g, PAL.g, 9, 5, 2, 8); px(g, PAL.d, 2, 14, 12, 1);
  });
  A.mr_curtain = mkTile(g => {
    px(g, PAL.d, 1, 1, 14, 2); px(g, PAL.p, 2, 3, 5, 12); px(g, PAL.r, 9, 3, 5, 12); px(g, PAL.C, 7, 4, 2, 10); px(g, PAL.d, 1, 15, 14, 1);
  });
  A.mr_hat = mkTile(g => {
    px(g, PAL.d, 7, 8, 2, 7); px(g, PAL.o, 4, 14, 8, 1); px(g, PAL.J, 4, 4, 8, 3); px(g, PAL.p, 3, 6, 10, 2); px(g, PAL.y, 7, 5, 2, 1);
  });
  A.mr_stove = mkTile(g => {
    px(g, PAL.n, 2, 4, 12, 11); px(g, PAL.d, 3, 5, 10, 6); px(g, PAL.k, 4, 6, 3, 3); px(g, PAL.k, 9, 6, 3, 3);
    px(g, PAL.o, 4, 11, 8, 2); px(g, PAL.r, 11, 2, 2, 2); px(g, PAL.y, 11, 2, 1, 1);
  });
  A.mr_bowl = mkTile(g => {
    px(g, PAL.o, 3, 8, 10, 5); px(g, PAL.y, 4, 9, 8, 3); px(g, PAL.r, 6, 9, 4, 2); px(g, PAL.d, 3, 13, 10, 1);
  });
  A.mr_hoop = mkTile(g => {
    px(g, PAL.d, 7, 1, 2, 14); px(g, PAL.o, 3, 3, 10, 8); px(g, PAL.h, 5, 5, 6, 4); px(g, PAL.y, 6, 6, 4, 2); px(g, PAL.n, 4, 11, 8, 1);
  });
  A.mr_chalk = mkTile(g => { px(g, PAL.w, 0, 7, 16, 1); px(g, PAL.w, 7, 0, 1, 16); px(g, PAL.y, 2, 8, 1, 1); });
  // TRIAL_HALL_FERNBROOK_MAP §8.2: the contested Hall's props (Keeper, seam and Glimmerwell). Sprites pass (ART_NOTES.md): Keeper
  // pieces are oak, mended J cloth and gold leaf with k shadow edges, a little uneven; Glimmerwell pieces are chrome, N lacquer and
  // V enamel with N outlines, symmetric and repeated. Text grids of PAL keys, '.' transparent. Used only by the flagged Hall overlay (data/detail_zz_hall_contested.json).
  const HALL2_ART = {
    banner_keeper_old: ["..AA............", "..AFCAAAAAAAAA..", "..AFAAAAAAAAAF..", "..AFEJJJJJJJJk..", "..AFEJJJAJJJJk..", "..AFEJJAAAJJJk..", "..AFEJJACAJJJk..", "..AFEJJAAAJJJk..", "..AFEJJJJJJJJk..", "..AFEJJJJCDDJk..", "..AFEJJJJDDCJk..", "..AFEJJJ.JJJJk..", "..AFEJJ...JJJk..", "..AFC.C....C....", ".GAFk...........", ".kkkk..........."],
    keep_honour_board: ["...AAAAAAAAAG...", "...AyyyJJyyyGk..", "...AFFFFFFFFGk..", "...AFGGGFGGFGk..", "...AFFFFFFFFGk..", "...AFGGFGGGFGk..", "...AFFFFFFFFGk..", "...AFAAAAFAFGk..", "...AFFFFFFFFGk..", "...AFAAFAAAFGk..", "...AFFFFFFFFGk..", "...AFyyyFyyFGk..", "...AFFFFFFFFGk..", "...GGGGGGGGGGk..", "....FG....FG.k..", "....kk....kk...."],
    banner_glim: ["..mwwwwwwwwwwm..", "...rVVVVVVVVp...", "...rVVVVyVVVp...", "...rVVVyVyVVp...", "...rVVVVyVVVp...", "...rVVVVVVVVp...", "...rVpVVVVpVp...", "...rVpVVVVpVp...", "...rVpVVVVpVp...", "...rVVVVVVVVp...", "...rVVVVVVVVp...", "...NNNNNNNNNN...", "................", "................", "................", "................"],
    banner_glim_stand: ["..mwwwwwwwwwwm..", "...rVVVVVVVVp...", "...rVVVVyVVVp...", "...rVVVyVyVVp...", "...rVVVVyVVVp...", "...rVpVVVVpVp...", "...rVpVVVVpVp...", "...rVVVVVVVVp...", "...NNNNNNNNNN...", ".......wh.......", ".......wh.......", ".......wh.......", ".......wh.......", "......mwhm......", ".....wwhhhm.....", ".....NNNNNN....."],
    banner_glim_half: ["..AA........wh..", "..AFCANVVVVVVwm.", "..AFAAANVVyVVp..", "..AFEJJJNyVyVp..", "..AFEJJJANyVVp..", "..AFEJJAAANVVp..", "..AFEJJACAJNVp..", "..AFEJJAAAJJNV..", "..AFEJJJJJJJJk..", "..AFEJJJJCDDJk..", "..AFEJJJJDDCJk..", "..AFEJJJ.JJJJk..", "..AFEJJ...JJJk..", "..AFC.C....C....", ".GAFk...........", ".kkkk..........."],
    glim_plaque: ["................", "................", "................", "...NNNNNNNNNN...", "...NwhhhhhhwN...", "...NhhhhhhhmN...", "...NVVVVyVVVN...", "...NrVVyVyVVN...", "...NVVVVyVVVN...", "...NhKKKKKKmN...", "...NwmmmmmmwN...", "...NNNNNNNNNN...", "................", "................", "................", "................"],
    glim_plaque_covered: ["................", "................", "................", "...NNNNNNNNNN...", "...NwhhFhhhwN...", "...NhCCCCCChN...", "...NVCFFFFCVN...", "...NrCCCCCCVN...", "...NVCFFFCCVN...", "...NhCCCCAAmN...", "...NwmCCCAFwN...", "...NNNNNNNNNN...", "................", "................", "................", "................"],
    crest_cover: ["................", "..NmmmmmmmmmmN..", "..NmdNNNdNNNdN..", "..NdNNNdNNNdNN..", "..NdNNNdNNNdNN..", "..NdNNNdNNNNdNw.", "..NNdNNNdNNNdVV.", "..NNdNNNdNNNdVV.", "..NNdNNNdNNNdN..", "..NdNNNNdNNNNN..", "..NNyyyyyyyyNN..", "..N.nggggggn.N..", "......nnnn......", "......nnnn......", "................", "................"],
    bulletin_keepers_x: ["................", ".AAAAAAAAAAAAAG.", ".AFFFFFFFFFFFFGk", ".AFCCFCFFCCCFFGk", ".AFCFFCFFCFCFFGk", ".AFCCCCFFCCCFFGk", ".AFCFFCFFFFFFFGk", ".AFCCCCFFNNNNNGk", ".AFFFFFFFNwVVNGk", ".AFFCCCFFNVyVNGk", ".AFFCFCFFNVVVNGk", ".AFFCCCFFNNNNNGk", ".GGGGGGGGGGGGGGk", "...FG.....FG...k", "...kk.....kk....", "................"],
    bulletin_glimmer_x: ["................", ".NddddddddddddN.", ".NNNNNNNNNNNNNN.", ".NNVVVVNNVVVVNN.", ".NNwwwwNNwwwwNN.", ".NNhyhhNNhyhhNN.", ".NNhhhhNNhhhhNN.", ".NNNNNNNNNNNNNN.", ".NCCFCNNNVVVVNN.", ".NCFFCCNNwwwwNN.", ".NNCCFCNNhyhhNN.", ".NNCCCNNNhhhhNN.", ".NNNNNNNNNNNNNN.", "...NN......NN...", "...NN......NN...", "................"],
    seam_rope: ["................", "......hw....hw..", "......ww....ww..", "......wh....wh..", "......wVp..pVh..", "......whVppVwh..", "......wh.VV.wh..", "......wh....wh..", "......wh....wh..", "......wh....wh..", "......wh....wh..", "......wh....wh..", ".....hwhm..hwhm.", ".....NNNN..NNNN.", "................", "................"],
    grout_bucket: ["................", "................", "................", "....m.....m.....", "....hwwwwwh.....", "....hCCCCCh.....", "....NCCCCAN.....", "....NdCNNNN.....", "....NdCNNNN.....", "....VrVVVVV.....", "....NdNNNNN.....", "....NdNNNNN.FF..", ".....NNNNN.hwF..", "..........hwwh..", "...........hm...", "................"],
    tile_crate: ["....w...........", "...whK....wh....", "..whhhK..whhK...", "..hhhhK.whhhhK..", "...hhK..hhhhK...", ".AAAAAAAAAAAAAG.", ".AGGGGGFGGGGGGk.", ".AGGyyGFGGGGGGk.", ".AGGyyGFGGGCCGk.", ".AGGGGGFGGGCFGk.", ".FFFFFFFFFFFFFk.", ".AGGGGGFGGGGGGk.", ".AGGGGGFGGGGGGk.", ".AGGGGGFGGGGGGk.", ".AGGGGGFGGGGGGk.", ".kkkkkkkkkkkkkk."],
    glim_planter: [".....gggggg.....", "....gllggggg....", "...gllllggggg...", "...gllllggggE...", "...ggllggggEE...", "...ggggggggEE...", "...ggggggggEE...", "...gggggggEEE...", "....gggEEEEE....", ".....gEEEEE.....", "..wwwwwwwwwwwh..", "..NdddddNNNNNN..", "..NNNNNNNNNNNN..", "..VrrVVVVVVVVV..", "..NNNNNNNNNNNN..", "...mmmmmmmmmm..."],
    comfort_lamp_off: ["................", "................", "......CCCC......", ".....CCCCCA.....", "....CCCCCCAA....", "....CCFCCCAA....", "....CCFCCCFA....", "...CCCFCCCFAA...", "...CCCCCCCCAA...", "....AACFFCAA....", "......FddF......", ".......dd.......", ".......dd.......", ".......dd.......", ".......dd.......", ".....mmmmmm....."],
  };
  for (const [k, rows] of Object.entries(HALL2_ART)) A[k] = mkTile(g => paint(g, rows));
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
    roof_coach: ["whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKwwhKmwhKmwhKw", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKwwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm", "whKmwhKmwhKmwhKm"],
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
    heal_lantern: ["................","................","..dddddddddd....","..md......m.....","..md.....ooo....","..md....ddddd...","..md....dyyyd...","..md....dywyd...","..md....dyyyd...","..md....ddddd...","..md...ddddddd..","..md...dwrwrwd..","..md...drrrrrd..","..md...dwrrrwd..",".ddddd.dwwrwwd..",".ddddd.ddddddd.."],
    acorn_board: ["................","................","....dddddddddd..",".....m......dm..",".....m......dm..","..nnnnnnnnn.dm..","..nbbbbbbbn.dm..","..nbbbdbbbn.dm..","..nbboooobn.dm..","..nbddddddn.dm..","..nbyoooybn.dm..","..nbyoooybn.dm..","..nbbyyybbn.dm..","..nnnnnnnnn.dm..","..........ddddd.","..........ddddd."],
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
    // WORLD_CLOCK_TOWN P4. Carts, stalls, a hatch and a snack tin. 16x16, PAL keys only.
    heights_tin: ["................","................",".....kkkkkk.....","...kkhhhhhhkk...","..khhwwhhhhhhk..","..kmhhhhhhhhmk..","..kkmmmmmmmmkk..","..kJJJJJJJJJJk..","..kJyyyyyyyyJk..","..kJyoGyoGyyJk..","..kJyyyyyyyyJk..","..kJJJJJJJJJJk..","..kdJJJJJJJJdk..","...kkkkkkkkkk...","....dddddddd....","................"],
    honesty_box_l: ["kkkkkkkkkkkkkkkk","kwwwllllwwwwllll","kwwwllllwwwwllll","kwwwllllwwwwllll","kkkkkkkkkkkkkkkk","..G..mmkkkmm....","..Gk.mhhhhhm...o","..Gk.mhhhhhm...y","..Gk.mmmmmmm...y",".kkkkkkkkkkkkkkk",".AAAAAAAAAAAAAAA",".FFFFFFFFFFFFFFF",".kGGGGGGGGGGGGGG",".kGGGFGGGGGFGGGG",".kGGGGGGGGGGGGGG",".kkkkkkkkkkkkkkk"],
    honesty_box_r: ["kkkkkkkkkkkkkkkk","wwwwllllwwwwlllk","wwwwllllwwwwlllk","wwwwllllwwwwlllk","kkkkkkkkkkkkkkkk","o......l.....G..","yy...p.w.y..kG..","yy....g.g...kG..","yy....BBB...kG..","kkkkkkkkkkkkkkk.","AAAAAAAAAAAAAAA.","FFFFFFFFFFFFFFF.","GGGGGGGGGGGGGGk.","GFGGGGGFGGGGGGk.","GGGGGGGGGGGGGGk.","kkkkkkkkkkkkkkk."],
    orchard_stall_l: ["kkkkkkkkkkkkkkkk","kgggCCCCggggCCCC","kgggCCCCggggCCCC","kgggCCCCggggCCCC","kggkkCCkkggkkCCk",".kG..kk..kk..kk.","..Gk..g.......g.","..Gk..ro......ro","..Gk.rrlr....rrl",".kkkkkkkkkkkkkkk",".AAAAAAAAAAAAAAA",".FFFFFFFFFFFFFFF",".kBBBBBBBBBBBBBB",".kBBBFBBBBBFBBBB",".kBBBBBBBBBBBBBB",".kkkkkkkkkkkkkkk"],
    orchard_stall_r: ["kkkkkkkkkkkkkkkk","ggggCCCCggggCCCk","ggggCCCCggggCCCk","ggggCCCCggggCCCk","kggkkCCkkggkkCCk",".kk..kk..kk..Gk.","......g.....kG..","......ro..l.kG..","r....rrlyyyykG..","kkkkkkkkkkkkkkk.","AAAAAAAAAAAAAAA.","FFFFFFFFFFFFFFF.","BBBBBBBBBBBBBBk.","BFBBBBBFBBBBBBk.","BBBBBBBBBBBBBBk.","kkkkkkkkkkkkkkk."],
    supply_post_l: ["kkkkkkkkkkkkkkkk","JJJJkJJJJkJJJJkJ","kJJkJJJJkJJJyyyJ",".kkJJJJkJJJJkJJJ","..kkkkkkkkkkkkkk","..kDJDEDDDDDDEDD","..kDJDEDDDDDDEDg","..kDJDEDDBDDDElD","..kDJDEDAAADDEGG","..kDDDEDDDDDDEDD","kkkkkkkkkkkkkkkk","kAAAAAAAAAAAAAAA","kEEEEEEEEEEEEEEE","kEEDEEEDEEEDEEED","kEEEEEEEEEEEEEEE","kkkkkkkkkkkkkkkk"],
    supply_post_r: ["kkkkkkkkkkkkkkkk","JJJkJJJJkJJJJkJJ","JyyyJJJkJJJJkJJk","JkJJJJkJJJJkJJk.","kkkkkkkkkkkkkk..","DDDDEkDDDDDJDk..","DDDDEyDDDDDJDk..","lDDDEoDDDDDJDk..","GDDDEDDDscDJDk..","DDDDEDDDDDDEDk..","kkkkkkkkkkkkkkkk","AAAAAAAAAAAAAAAk","EEEEEEEEEEEEEEEk","EEEDEEEDEEEDEEEk","EEEEEEEEEEEEEEEk","kkkkkkkkkkkkkkkk"],
    tool_cart_l: ["...kkkkkkkkkkkkk","..kmmmmmmmmmmmmm",".kkmmmmmmmmmmmmm","..ykyykyykyykyyk","....m...........","....m..G........","....m..hh.....A.","....m.hG.h...ABA","..kkkkkkkkkkkkkk",".kIIIIIIIIIIIIII",".kdIIIIdIIIIdIII",".kIIIIIkIIIIIIII",".kddddkkkddddddd",".....kdwdk......","......kkk.......",".......k........"],
    tool_cart_r: ["kkkkkkkkkkk.....","mmmmmmmmmmmk....","mmmmmmmmmmmkk...","yykyykyykyyk....",".........m......","...k.....m......","...y.....m......","...m..hw.m......","kkkkkkkkkkkk....","IIIIIIIIIIIIk..k","IdIIIIdIIIIdmmmm","IIIIIIkIIIII...k","dddddkkkddddk...","....kdwdk.......",".....kkk........","......k........."],
    watch_hatch_l: ["kkkkkkkkkkkkkkkk","bbbbnbbbbnbbbbnb","kbbnbbbbnbbbbwwn",".knbbbbnbbbbnbbb","..kkkkkkkkkkkkkk","..kCnCmCCCCCCmCC","..kCnCmCCCCCCmCC","..kCnCmCCChCCmCC","..kCnCmCChhhkmCw","..kCCCmCCCCCCmCC","kkkkkkkkkkkkkkkk","kAAAAAAAAAAAAAAA","kmmmmmmmmmmmmmmm","kmmCmmmCmmmCmmmC","kmmmmmmmmmmmmmmm","kkkkkkkkkkkkkkkk"],
    watch_hatch_r: ["kkkkkkkkkkkkkkkk","bbbnbbbbnbbbbnbb","nwwbbbbnbbbbnbbk","bnbbbbnbbbbnbbk.","kkkkkkkkkkkkkk..","CCCCmCCCCCCnCk..","CCCCmCCCCCCnCk..","CCCCmCyyCCCnCk..","cCwcmCooCCCnCk..","CCCCmCCCCCCmCk..","kkkkkkkkkkkkkkkk","AAAAAAAAAAAAAAAk","mmmmmmmmmmmmmmmk","mmmCmmmCmmmCmmmk","mmmmmmmmmmmmmmmk","kkkkkkkkkkkkkkkk"],
    waymark_cart_l: ["...kkkkkkkkkkkkk","..kJJJJJJJJJJJJJ",".kkJJJJJJJJJJJJJ","..ykyykyykyykyyk","....m...........","....m.......k...","....m.w.w...y...","....m.JJJ...o...","..kkkkkkkkkkkkkk",".kGGGGGGGGGGGGGG",".kFGGGGFGGGGFGGG",".kGGGGGkGGGGGGGG",".kFFFFkkkFFFFFFF",".....kdhdk......","......kkk.......",".......k........"],
    waymark_cart_r: ["kkkkkkkkkkk.....","JJJJJJJJJJJk....","JJJJJJJJJJJkk...","yykyykyykyyk....",".........m......",".........m......","..r......m......","CCCC.....m......","kkkkkkkkkkkk....","GGGGGGGGGGGGk..k","GFGGGGFGGGGFmmmm","GGGGGGkGGGGG...k","FFFFFkkkFFFFk...","....kdhdk.......",".....kkk........","......k........."],
    wicker_stall_l: ["kkkkkkkkkkkkkkkk","kAAADDDDAAAADDDD","kAAADDDDAAAADDDD","kAAADDDDAAAADDDD","kAAkkDDkkAAkkDDk",".kB..kk..kk..kk.","..Bk..G.G....G.G","..Bk.kAAAk..kAAA","..Bk.ABABA..ABAB",".kkkkkkkkkkkkkkk",".CCCCCCCCCCCCCCC",".FFFFFFFFFFFFFFF",".kGGGGGGGGGGGGGG",".kGGGFGGGGGFGGGG",".kGGGGGGGGGGGGGG",".kkkkkkkkkkkkkkk"],
    wicker_stall_r: ["kkkkkkkkkkkkkkkk","AAAADDDDAAAADDDk","AAAADDDDAAAADDDk","AAAADDDDAAAADDDk","kAAkkDDkkAAlkDDk",".kk..kk..kl.lBk.",".....G.G....kB..","k...kAAAk.l.lB..","A...ABABA..lkB..","kkkkkkkkkkkkkkk.","CCCCCCCCCCCCCCC.","FFFFFFFFFFFFFFF.","GGGGGGGGGGGGGGk.","GFGGGGGFGGGGGGk.","GGGGGGGGGGGGGGk.","kkkkkkkkkkkkkkk."],
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
// PARTNER_DAY (Vincent, Nov 2, 2026): Maze, Mom's calico-cat Walkling. NPC art only (not a species), 16x16, PAL keys,
// drawn like Buddy: sit, tail flick, blink and a night curl.
const MAZE_ART = {
  maze_sit: ["................", "................", "......k.....k...", ".....kok...kdk..", ".....koowwwddk..", ".....koowwwwdk..", ".....kwkwwwkwk..", ".....kwwwrwwwk..", "......kwwwwwk...", ".....kwwwwwwok..", "....kddwwwwoook.", "....kddwwwwwook.", "....kwwwwwwwwwk.", "....kwwkwwwkwwk.", "..kkkwwkwwwkwwk.", ".koooookkkkkkk.."],
  maze_tail: ["................", "................", "......k.....k...", ".....kok...kdk..", ".....koowwwddk..", ".....koowwwwdk..", ".....kwkwwwkwk..", ".....kwwwrwwwk..", "......kwwwwwk...", ".....kwwwwwwok..", "....kddwwwwoook.", "....kddwwwwwook.", "....kwwwwwwwwwk.", "....kwwkwwwkwwk.", ".k..kwwkwwwkwwk.", "koookkkkkkkkkk.."],
  maze_blink: ["................", "................", "......k.....k...", ".....kok...kdk..", ".....koowwwddk..", ".....koowwwwdk..", ".....kwkwwwwwk..", ".....kwwwrwwwk..", "......kwwwwwk...", ".....kwwwwwwok..", "....kddwwwwoook.", "....kddwwwwwook.", "....kwwwwwwwwwk.", "....kwwkwwwkwwk.", "..kkkwwkwwwkwwk.", ".koooookkkkkkk.."],
  maze_sleep: ["................", "................", "................", "................", "................", "......k.....k...", ".....kok...kdk..", ".....koowwwddk..", ".....kwddwddwk..", ".....kwwwrwwwk..", "....kkwwwwwwwkk.", "...kddwwwwwwoook", "...kddwwwwwwwook", "...kwwwwwwwwwwwk", "..kkwwwwwwwwwwwk", ".koookkkkkkkkkk."]
};
// DRAFT ART for Pia to redraw (POST_TRIAL_CRACKDOWN §10, §10a; LANTERN_HOUSE_FERNBROOK §8). Sliced 1:1 from the spec sheets
// (tank_sheet.png, both draft_art_sheet.png), PAL keys only, '.' clear; no V, N or Q pixel. A sprite is a base grid plus
// per-frame patches [x, y, rows] in which '_' keeps the base pixel. `mirror` names the right-facing copy (the grid reversed).
// Tanks are 64x40 and beams 96x40, bottom-centred on their cell (drawArt); the engine draws the ground shadow.
const CRACKDOWN_ART = {
  tiles: {
    floor_parquet_oak: ["GAAAAAAGGGGBGGGB","GGGGGGGGAGGBAGGB","GGGGGGGGAGGBAGGB","BBBBBBBBAGGBAGGB","GAAAAAAGAGGBAGGB","GGGGGGGGAGGBAGGB","GGGGGGGGAGGBAGGB","BBBBBBBBGGGBGGGB","GGGBGGGBGAAAAAAG","AGGBAGGBGGGGGGGG","AGGBAGGBGGGGGGGG","AGGBAGGBBBBBBBBB","AGGBAGGBGAAAAAAG","AGGBAGGBGGGGGGGG","AGGBAGGBGGGGGGGG","GGGBGGGBBBBBBBBB"],
    floor_parquet_oak_b: ["GAAAAAAGGGGBGGGB","GGGGGGGGAGGBAGGB","GGGGGGGGAGGBAGGB","BBBBBBBBAGGCCGGB","GAAAAAAGAGGBAGGB","GGGGGGGGAGGBAGGB","GGGGGGGGAGGBAGGB","BBBBBBBBGGGBGGGB","GGGBGGGBGAAAAAAG","AGGBAGGBGGGGGGGG","AGGBFGGBGGGGGGGG","AGGBAGGBBBBBBBBB","AGGBAGGBGAAAAAAG","AGGBAGGBGGGGGGGG","AGGBAGGBGGGGGGGG","GGGBGGGBBBBBBBBB"],
    floor_parquet_oak_c: ["GAAAAAAGGGGBGGGB","GGGGGGGGAGGBAGGB","GGGGGGGGAGGBAGGB","BBBBBBBBAGGBAGGB","GAAAAAAGAGGBAGGB","GGGGGGGGAGGBAFGB","GGGGGGGGAGGBAGGB","BBBBBBBBGGGBGGGB","GGGBGGGBGAAAAAAG","AGGBAGGBGCCCGGGG","AGGBAGGBAAAAGGGG","AGGBAGGBBBBBBBBB","AGGBAGGBGAAAAAAG","AGGBAGGBGGGGGGGG","AGGBAGGBGGGGGGGG","GGGBGGGBBBBBBBBB"],
    wire_plinth: ["AAAAAAAAAAAAAAAA","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","yyyyyyyyyyyyyyyy","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","BBBBBBBBBBBBBBBB","kkkkkkkkkkkkkkkk","kkkkkkkkkkkkkkkk"],
    cable_run: ["................","................","................","................","................","................","................","................","................","................","................","GGGGGGGGGGGGGGGG","FyFFFFyFFFFyFFFF","FFFFFFFFFFFFFFFF","kkkkkkkkkkkkkkkk","................"],
  },
  bases: {
    tank_cmd: [
      "...................................y............Fyyyyyy.........",
      "...................................y............FJJJJJJyy.......",
      "...................JEEEEJJJJ.......y............FJJJJJJ.........",
      "....................yy...yy........y.FGGGGF.....FJJJJ..yy.......",
      "...................y.FCCCF.y.......y.FFFFFFy....F...............",
      "..................y..FCyCF..y..ddDDyEEJJJJJJ....F...............",
      "..................y.CFyyyFC.yEEEEJJJJJJJJJJJJJJ.F...............",
      ".................y.CCFwwyFCC.yJJJJJJJJJJJJJJJJk.................",
      ".................y.CyFwwyFyC.yJJJJJJJJJJJJJJJJJJJJ..y...........",
      ".................y.CCFyyyFCC.yJJJJJJJJJJJJJJJJJJkk...dd.........",
      "..................y.CFyyyFC.ydJJJJJJJJJJJJJJJJJJkk...md.........",
      "..................y..FCyCF..ydJJJJJJJJJJJJJJJJJJkk...md.........",
      "...................y.FCCCF.ydddddddddddddddddddddd...md.........",
      "....................yy...yydyddyddyddyddyddyddyddyd..md.........",
      "......................yyydddddddddddddddddddddddddd..md.........",
      "............mDDDDDDDDDEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEJk.........",
      "...........mEEEEEEJJJJmdJEEEEyyyyyyyyJJJJmdJEE.EEEJJJ.Jk........",
      "...........mddJJJJJJJJmyJJJJ.yCCJJCCy.JJJmyJJF.FFFFFF.Fk........",
      "..........mdkykkJJJJJJmdJJJJ.yCCyyCCy.JJJmdJJJ.JJ...J.Jk........",
      "..........mydJJJJJJJJJmdJJJJ.yCCyyCCy.JJJmdJJG.GG.F.G.GJk.......",
      "...........dJJJJJJJJJJmyJJJJ.yCCJJCCy.JJJmyJJJ.JJ...J.JJk.......",
      ".........wy.JJJJJJJJJJmdJJJJJyCCCCCCyJJJJmdJJF.FFFFFF.FJk.......",
      "...........yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyk......",
      "........m..JJJJJJJJJJJmyJJJJJJJJJJJJJJJJJmyJJJJJJJJJJJJJJk......",
      ".......mddJJdddddddddJmdJdddddddddddddddJmdJdddddddddddJJk......",
      ".......mkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk......",
      "....FG..............GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGFF....",
      "......kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk......",
      "......mkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmk.....",
      ".....kkkdddkdddddddkdddddddkdddddddkdddddddkdddddddkdddmmmkk....",
      "....kkdddddddddkdddddddkdddddddkdddddddkdddddddkddddddmmmmmkk...",
      "....kddhmddddkkmkkdddkkmkkdddkkmkkdddkkmkkdddkkmkkdddmmdddmmk...",
      "...kkdmmmmdddkmmmkdddkmmmkdddkmmmkdddkmmmkdddkmmmkddkmmd.dmmk...",
      "....kddmmdddkmmdymkdkmmdymkdkmmdymkdkmmdymkdkmmdymkddmmdddmmk...",
      "....kkdddddddkmmmkdddkmmmkdddkmmmkdddkmmmkdddkmmmkddddmmmmmkk...",
      ".....kkkkkkkkkkmkkkkkkkmkkkkkkkmkkkkkkkmkkkkkkkmkkkkkkkmmmkk....",
      "......mkkmkkmkkkkkmkkmkkmkkmkkmkkmkkmkkkkkmkkmkkmkkmkkmkkmk.....",
      "................................................................",
      "................................................................",
      "................................................................",
    ],
    tank_esc: [
      "...................................h............................",
      "..................................mh............................",
      "...................JEEEEJJJJ......mh............................",
      ".................................mmh.FGGGGF.....FJJJJ...........",
      ".....................FCCCF......mmmh.FFFFFFy....FJJJJy..........",
      ".....................FCyCF.....ddDDhEEJJJJJJ....FJJJJ...........",
      "....................CFyyyFC.EEEEEJJJJJJJJJJJJJJ.F...............",
      "...................CCFwwyFCC.dJJJJJJJJJJJJJJJJk.................",
      "...................CyFwwyFyC.dJJJJJJJJJJJJJJJJJJJJ..y...........",
      "...................CCFyyyFCC.dJJJJJJJJJJJJJJJJJJkk...dd.........",
      "....................CFyyyFC.ddJJJJJJJJJJJJJJJJJJkk...md.........",
      ".....................FCyCF..ddJJJJJJJJJJJJJJJJJJkk...md.........",
      ".....................FCCCF.ddddddddddddddddddddddd...md.........",
      ".........................yddyddyddyddyddyddyddyddyd..md.........",
      "........................ddddddddddddddddddddddddddd..md.........",
      "............mDDDDDDDDDEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEJk.........",
      "...........mEEEEEEJJJJmdJEEEEEEJJJJJJJJJJmdJEE.EEEJJJ.Jk........",
      "...........mddJJJJJJJJmyJJJJJJJJJJJJJJJJJmyJJF.FFFFFF.Fk........",
      "..........mdkykkJJJJJJmdJJJJJJCCCCCJJJJJJmdJJJ.JJ...J.Jk........",
      "..........mydJJJJJJJJJmdJJJJJJCdCdCJJJJJJmdJJG.GG.F.G.GJk.......",
      "...........dJJJJJJJJJJmyJJJJJJCCdCCJJJJJJmyJJJ.JJ...J.JJk.......",
      ".........wy.JJFJJJJJJFmdJJJJFJJJJJJFJJJJJmFJJF.FFFFFF.FJk.......",
      "..........FmmmmmmFmmmmmmFmmmmmmFmmmmmmFmmmmmmFmmmmmmFmmmmk......",
      "........m..JJFJJJJJJFJmyJJJFJJJJJJFJJJJJJFyJJJJJFJJJJJJFJk......",
      ".......mdFJJddddFddddJmFJdddddFddddddFddJmdJFddddddFdddJJk......",
      ".......mkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk......",
      "....FG..............GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGFF....",
      "......kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk......",
      "......mkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmkkmk.....",
      ".....kkkdddkdddddddkdddddddkdddddddkdddddddkdddddddkdddmmmkk....",
      "....kkdddddddddkdddddddkdddddddkdddddddkdddddddkddddddmmmmmkk...",
      "....kddhmddddkkmkkdddkkmkkdddkkmkkdddkkmkkdddkkmkkdddmmdddmmk...",
      "...kkdmmmmdddkmmmkdddkmmmkdddkmmmkdddkmmmkdddkmmmkddkmmd.dmmk...",
      "....kddmmdddkmmdymkdkmmdymkdkmmdymkdkmmdymkdkmmdymkddmmdddmmk...",
      "....kkdddddddkmmmkdddkmmmkdddkmmmkdddkmmmkdddkmmmkddddmmmmmkk...",
      ".....kkkkkkkkkkmkkkkkkkmkkkkkkkmkkkkkkkmkkkkkkkmkkkkkkkmmmkk....",
      "......mkkmkkmkkkkkmkkmkkmkkmkkmkkmkkmkkkkkmkkmkkmkkmkkmkkmk.....",
      "................................................................",
      "................................................................",
      "................................................................",
    ],
    wire_wall: [
      "................................................",
      ".................yyyyyyyyyyyyyy.................",
      ".................yJJJJJJJJJJJJy.................",
      ".................yJEEEyyyyEEEJy.................",
      ".................yJJJyyyyyyJJJy.................",
      ".................yJJJJCCCCJJJJy.................",
      "................AyJJJJCwyCJJJJyA................",
      "................AyJJJJCyyCJJJJyA................",
      "................AyJJJJCCCCJJJJyA................",
      "..ww.............yJJJyyyyyyJJJy.............ww..",
      "..ww.............yJJJJGGGGJJJJy.............ww..",
      ".FhhFFFFFFFFFFFFFyJJJJJJJJJJJJyFFFFFFFFFFFFFhhF.",
      "ddGGdddddddddddddyGGGGGGGGGGGGGdddddddddddddGGdd",
      "..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..",
      "..GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..",
      "..GyyGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGyyG..",
      "..FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF..",
      "..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF..",
      "..AGGyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyFGGF..",
      "..AGGyyGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGyFGGF..",
      "..ABGyGdddddddddddddddddddddddddddddddddkGFGGF..",
      "..AGGyGdnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnkGFGBF..",
      "..AGGyGdddddddddddddddddddddddddddddddddkGFGGF..",
      "..ABGyGdddddddddmdddddddddddddddddddddddkGFGGF..",
      "..AGGyGddddddddmddddddddddddddddddddddddkGFGBF..",
      "..AGGyGdddddddmdddddddddddddddddddddddddkGFGGF..",
      "..ABGyGddddddmddddddddddddddddddddddddddkGFGGF..",
      "..AGGyGdddddmddddmddddddddddddddddddddddkGFGBF..",
      "..AGGyGddddmddddmdddddddddddddddddddddddkGFGGF..",
      "..ABGyGddddddddmddddddddddddddddddddddddkGFGGF..",
      "..AGGyGdddddddddddddddddddddddddddddddddkGFGBF..",
      "..AGGyGdddddddddddddddddddddddddddddddddkGFGGF..",
      "..ABGyGdddddddddddddddddddddddddddddddddkGFGGF..",
      "..AGGyGdddddddddddddddddddddddddddddddddkGFGBF..",
      "..AGGyGdddddddddddddddddddddddddddddddddkGFGGF..",
      "..ABGyGkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkGFGGF..",
      "..AGGyyGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGyFGBF..",
      "..AGGFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFGGF..",
      "..ABGGGyyyyyyyyyyyyyyyyyyyFGGwyFGGwyFGGFFFGGGF..",
      "..AGGGGGFGFGFGFGFGFGFGFGFGFGGyyFGGyyFGGFBFGGBF..",
      "..AGGBBGFGFGFGFGFGFGFGFGFGFGGFFFGGFFFGGFFFGGGFF.",
      "..ABGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGyF.",
      "..FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFF.",
      "....GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.FF.",
      "....FFyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyFF.FF.",
      "....FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.FF.",
      "...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...",
      "..dddddddddddddddddddddddddddddddddddddddddddd..",
    ],
  },
  art: {
    keeper_tank_cmd_l: {"base":"tank_cmd","f":[[[16,2,["__JE___J___.__","___y_.__y_.___","__y.FC__F.y.__","_y._FCyCF._y._","_y.CFy__FC.yE_","y.C_Fw_yFC_.yd","y.CyFw_yFyC.yd","y.C_Fy__FC_.yd","_y.CFy__FC.yd_","_y._FCyCF._yd_","__y.FC__F.yd__","___y_.__y_d___","_____y__d_____"]]],[[16,1,["_______________________________________..","__JE___J___.___________________________yy","___y_.__y_.____________________________..","__y.FC__F.y._____________________________","_y._FCyCF._y.____________________________","_y.CFy__FC.yE____________________________","y.C_Fw_yFC_.yd___________________________","y.CyFw_yFyC.yd___________________________","y.C_Fy__FC_.yd___________________________","_y.CFy__FC.yd____________________________","_y._FCyCF._yd____________________________","__y.FC__F.yd_____________________________","___y_.__y_d______________________________","_____y__d________________________________"]]],[],[[55,1,["..","yy",".."]]],[[17,2,["__.J___E___J__","___._y__._y___","__.y.F__CF.y__","_.y_.FCyCF_.y_","_.y.CF__yFC.y_",".y._CF_wyF_C.y",".y.CyF_wyFyC.y",".y._CF__yF_C.y","_.y.CF__yFC.y_","_.y_.FCyCF_.y_","__.y.F__CF.y__","___._y__._y___","_____.__y_____"]]],[[17,1,["______________________________________..","__.J___E___J__________________________yy","___._y__._y___________________________..","__.y.F__CF.y_________________________h__","_.y_.FCyCF_.y_______________________hwh_","_.y.CF__yFC.y________________________h__",".y._CF_wyF_C.y__________________________",".y.CyF_wyFyC.y__________________________",".y._CF__yF_C.y__________________________","_.y.CF__yFC.y___________________________","_.y_.FCyCF_.y___________________________","__.y.F__CF.y____________________________","___._y__._y_____________________________","_____.__y_______________________________"]]]],"ms":350,"mirror":"keeper_tank_cmd_r"},
    keeper_tank_cmd_l_move: {"base":"tank_cmd","f":[[[54,5,["_h_","hwh","_h_"]]],[[55,1,[".._","yy_","hhh","hwh","hhh"]],[6,28,["k_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk","_______________________________________________k____"]],[6,32,["______________________________________________d_____","__________m_______m_______m_______m_______m_________","_________y_______y_______y_______y_______y__________","____________________________________________________","k_mk_mk_m__mk_mk__k_mk_mk_mk_mk_m__mk_mk__k_mk_mk_mk"]]],[[4,0,["_______________________________.____________......._____","_____________________________________________yyyyyy..hh_","_______________.........___________________________yhhhh","_______________JEEEEJJJJ_________......__________JJhhwhh","_______________.yy...yy.__________GGGG_._____JJJJ__yhhh_","______________.y___C___y.__...._.FFFFFFy_____________h__","________________._C_C_.__..ddDDyEE______..._____________","_____________.y.__yy___.yEEEE_____________J_F___________","________________C_____C___________________k...__._______","________________y_ww__y_____________________JJ__y.._____","_____________y.C_______C.y_______________________d______","________________C_y_y_C_________________________________","______________y.___y___.y_JJJJJJJJJJJJJJJJJJkk__________","_______________y.FCCCF.yd__d__d__d__d__d__d__d._________","________________yy...yy_y__y__y__y__y__y__y__y__________","________..........yyydddddddddddddddddddddddddd..md_____","_______.mDDDDDDDDDEEE____EEEEEEEEEEEEEEE__E___EEEJk.____","________EEEEEE_____d_EEEE_yyyyyy_J____d_EE_EEEJJJ_J_____","______.mddJJ_______y________JJ________y__F_FFFFFF_F_____","_______dkykk_____________________________J_JJ_._J_Jk.___","______myd__________d________yy________d__G_GG_F_G_G_____","_____..d___________y____.___JJ___.____y__J_JJ...J_J_____","_____wy.JJJJJJJJJJmdJJJJJ_CCCCCC_JJJJmdJJF.FFFFFF.FJk.__","____.__yyyyyyyyyyyy_yyyyyyyyyyyyyyyyyy_yyyyyyyyyyyyyy___","___.m.._JJJJJJJJJ__y_JJJJJJJJJJJJJJJ__y_JJJJJJJJJJJ_____","____ddJJdddddddddJmdJdddddddddddddddJmdJdddddddddddJJ___",".._mkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..","FG..............GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGFF","__k__k__k__k__k__k__k__k__k__k__k__k__k__k__k__k__k__km_"]],[14,33,["y_m_____y_m_____y_m_____y_m_____y_m"]],[6,36,["km_km_km__m_km_km_km_km_k__km_km__m_km_km_km_km_km_km"]]],[[17,0,["__________________.____________.......__","________________________________yyyyyy..","__........._____________________________","__JEEEEJJJJ_________......__________JJ__","__.yy...yy.__________GGGG_._____JJJJ____","_.y___C___y.__...._.FFFFFFy___________h_","___._C_C_.__..ddDDyEE______..._______hwh",".y.__yy___.yEEEE_____________J_F______h_","___C_____C___________________k..._______","___y_ww__y_____________________JJ_______","y.C_______C.y___________________________","___C_y_y_C______________________________","_y.___y___.y_JJJJJJJJJJJJJJJJJJkk_______","__y.FCCCF.yd__d__d__d__d__d__d__d.______","___yy...yy_y__y__y__y__y__y__y__y_______","_____yyydddddddddddddddddddddddddd______"]],[53,29,["k"]],[15,32,["y_______y_______y_______y_______y____d","_m_______m_______m_______m_______m____"]]]],"ms":150,"mirror":"keeper_tank_cmd_r_move"},
    keeper_tank_cmd_l_hatch1: {"base":"tank_cmd","f":[[[37,0,["______FF","______yJ","______FJ","......FF","kkkkkkFF"]]]],"mirror":"keeper_tank_cmd_r_hatch1"},
    keeper_tank_cmd_l_hatch2: {"base":"tank_cmd","f":[[[37,0,["______FF","_JyJJ_yJ","_JJJJ_FJ",".2k2k.FF","kkkkkkFF"]]]],"mirror":"keeper_tank_cmd_r_hatch2"},
    keeper_tank_cmd_l_hatch3: {"base":"tank_cmd","f":[[[37,0,["_JJJJ_FF","_JyJJ_yJ","_JJJJ_FJ",".2k2k.FF","yJJJJyFF","J_____2_"]]]],"mirror":"keeper_tank_cmd_r_hatch3"},
    keeper_tank_cmd_off_l: {"base":"tank_cmd","f":[[[20,5,["___G___","__GGG__","__CCG__","G_CCG_G","__GGG__","__GGG__","___G___"]]]],"mirror":"keeper_tank_cmd_off_r"},
    keeper_tank_l: {"base":"tank_esc","f":[[[18,2,["JE___J___.","__________","__FC__F.__","__FCyCF.__","_CFy__FC._","C_Fw_yFC_.","CyFw_yFyC.","C_Fy__FC_.","_CFy__FC._","__FCyCF.__","__FC__F.d."]]],[[18,2,["JE___J___.__________________________","___________________________________y","__FC__F.___________________________.","__FCyCF.__________________________._","_CFy__FC.___________________________","C_Fw_yFC_.__________________________","CyFw_yFyC.__________________________","C_Fy__FC_.__________________________","_CFy__FC.___________________________","__FCyCF.____________________________","__FC__F.d.__________________________"]]],[],[[52,3,["_y","_.","._"]]],[[19,2,[".J___E___J","__________","__.F__CF__","__.FCyCF__","_.CF__yFC_","._CF_wyF_C",".CyF_wyFyC","._CF__yF_C","_.CF__yFC_","__.FCyCF__","__.F__CF._"]]],[[19,2,[".J___E___J_____________________________","__________________________________y_hhh","__.F__CF__________________________._hwh","__.FCyCF_________________________.__hhh","_.CF__yFC______________________________","._CF_wyF_C_____________________________",".CyF_wyFyC_____________________________","._CF__yF_C_____________________________","_.CF__yFC______________________________","__.FCyCF_______________________________","__.F__CF.______________________________"]]]],"ms":350,"mirror":"keeper_tank_r"},
    keeper_tank_l_move: {"base":"tank_esc","f":[[[54,5,["_h_","hwh","_h_"]]],[[55,2,["yy_","hhh","hwh","hhh"]],[6,28,["k_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk_mk","_______________________________________________k____"]],[6,32,["______________________________________________d_____","__________m_______m_______m_______m_______m_________","_________y_______y_______y_______y_______y__________","____________________________________________________","k_mk_mk_m__mk_mk__k_mk_mk_mk_mk_m__mk_mk__k_mk_mk_mk"]]],[[4,0,["_______________________________.________________________","______________________________.______________________hh_","_______________.........____________________________hhhh","_______________JEEEEJJJJ_____.___......_____.....__hhwhh","_________________.....______._____GGGG_._________.__hhh_","___________________C_______.mmm_.FFFFFFy_________y___h__","________________._C_C_._...ddDDhEE______...__JJJJ_______","_______________.__yy___.EEEEE_____________J_F___________","________________C_____C___________________k...__._______","________________y_ww__y_____________________JJ__y.._____","_______________C_______C.________________________d______","________________C_y_y_C_________________________________","___________________y___.__JJJJJJJJJJJJJJJJJJkk__________","_________________FCCCF._d__d__d__d__d__d__d__d._________","____________________.y__y__y__y__y__y__y__y__y__________","________............ddddddddddddddddddddddddddd..md_____","_______.mDDDDDDDDDEEE______EEEEEEEEEEEEE__E___EEEJk.____","________EEEEEE_____d_EEEEEE___________d_EE_EEEJJJ_J_____","______.mddJJ_______y______JJJJJ_______y__F_FFFFFF_F_____","_______dkykk_______________C_C___________J_JJ_._J_Jk.___","______myd__________d_______dCd________d__G_GG_F_G_G_____","_____..d__J______J_y____J_CCdCCJ______y__J_JJ...J_J_____","_____wy.JJFJJJJJJF_dJJJJFJJJJJJFJJJJJ_FJJ_.FFFFF_.FJk.__","____._FmmmmmmFmmmm_mFmmmmmmFmmmmmmFmmmmmmFmmmmmmFmmmm___","___.m.._JFJJJJJJF__y_JJFJJJJJJFJJJJJ_Fy_JJJJFJJJJJJF____","____dFJJddddFddddJmFJdddddFddddddFddJmdJFddddddFdddJJ___",".._mkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..","FG..............GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGFF","__k__k__k__k__k__k__k__k__k__k__k__k__k__k__k__k__k__km_"]],[14,33,["y_m_____y_m_____y_m_____y_m_____y_m"]],[6,36,["km_km_km__m_km_km_km_km_k__km_km__m_km_km_km_km_km_km"]]],[[19,0,["________________._____________________","_______________.______________________","........._____________________________","JEEEEJJJJ_____.___......_____.....__yy","__.....______._____GGGG_._________.___","____C_______.mmm_.FFFFFFy_________y_h_","_._C_C_._...ddDDhEE______...__JJJJ_hwh",".__yy___.EEEEE_____________J_F______h_","_C_____C___________________k..._______","_y_ww__y_____________________JJ_______","C_______C.____________________________","_C_y_y_C______________________________","____y___.__JJJJJJJJJJJJJJJJJJkk_______","__FCCCF._d__d__d__d__d__d__d__d.______","_____.y__y__y__y__y__y__y__y__y_______","___yyydddddddddddddddddddddddddd______"]],[53,29,["k"]],[15,32,["y_______y_______y_______y_______y____d","_m_______m_______m_______m_______m____"]]]],"ms":150,"mirror":"keeper_tank_r_move"},
    keeper_tank_off_l: {"base":"tank_esc","f":[[[20,5,["___G_____","__GGG____","__CCG____","G_CCG_G__","__GGG____","__GGG____","___G_____","_________","________."]]]],"mirror":"keeper_tank_off_r"},
    wire_wall: {"base":"wire_wall"},
    wire_wall_news: {"base":"wire_wall","f":[[[7,20,["cccccccccccccccccccccccccccccccccn","cttttttttttttttttttttttttttttttttn","cssssssssssssssssssssssssssssssssn","cttyyyyyyyyttwwwwwwwwwwwwwwwwwtttn","cttyJJJJJJyttwwwwwwwwwwwwwwwwwtttn","cttyJJyyJJyttttttttttttttttttttttn","cttyJJCCJJyttttttttttttttttttttttn","cttyJJCCJJyttssssssssssssssttttttn","cttyJyyyyJyttttttttttttttttttttttn","cttyJJJJJJyttssssssssssssssssttttn","cttGGGGGGGGttttttttttttttttttttttn","cttttttttttttttttttttttttttttttttn","nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn","yyynnnyyynnnyyynnnyyynnnyyynnnyyyn","nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn"]],[39,39,["gl"]]],[[7,20,["cccccccccccccccccccccccccccccccccn__","cttttttttttttttttttttttttttttttttn__","cttttttttttttttttttttttttttttttttn__","cttyyyyyyyyttwwwwwwwwwwwwwwwwwtttn__","cttyJJJJJJyttwwwwwwwwwwwwwwwwwtttn__","cssssssssssssssssssssssssssssssssn__","cttyJJCCJJyttttttttttttttttttttttn__","cttyJJCCJJyttssssssssssssssttttttn__","cttyJyyyyJyttttttttttttttttttttttn__","cttyJJJJJJyttssssssssssssssssttttn__","cttGGGGGGGGttttttttttttttttttttttn__","cttttttttttttttttttttttttttttttttn__","nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn__","nnnyyynnnyyynnnyyynnnyyynnnyyynnnyyy","nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn__","nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn__"]],[39,39,["gl"]]]],"ms":500},
    wire_wall_pres: {"base":"wire_wall","f":[[[7,20,["nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn","nttttttttttttttttttttttttttttttttn","nnnnnnnnnnnnnhwwwhhhhnnnnnnnnnnnnn","ctttttttttttthhhhhhhhttttttttttttn","ctyyJJttttttth223333htttttttJJyytn","ctyyJJttttttth2233334tttttttJJyytn","ctyyJJttttttth3k33k34tttttttJJyytn","ctyyJJttttttt33333334tttttttJJyytn","ctyyJJttttttt333FF334tttttttJJyytn","ctyyJJttttttt34444443tttttttJJyytn","ctyytttttttttttt44ttttttttttttyytn","ctGGttttEEEEEEyEwwEyEEEEEkttttGGtn","ctttttttJJJyyJyJwwJyJJyyJktttttttn","ctttttttJJJJJJyJwwJyJyJJJktttttttn","nwwwwwwwnnnnnnnnnnnnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn"]],[39,39,["gl"]]],[[7,20,["nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn","nttttttttttttttttttttttttttttttttn","nnnnnnnnnnnnnhwwwhhhhnnnnnnnnnnnnn","ctttttttttttthhhhhhhhttttttttttttn","ctyyJJttttttth223333htttttttJJyytn","ctyyJJttttttth2233334tttttttJJyytn","ctyyJJttttttth3k33k34tttttttJJyytn","ctyyJJttttttt33333334tttttttJJyytn","ctyyJJttttttt333kk334tttttttJJyytn","ctyyJJttttttt344kk443tttttttJJyytn","ctyytttttttttttt44ttttttttttttyytn","ctGGttttEEEEEEyEwwEyEEEEEkttttGGtn","ctttttttJJJyyJyJwwJyJJyyJktttttttn","ctttttttJJJJJJyJwwJyJyJJJktttttttn","nwwwwwwwwwnnnnnnnnnnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn"]],[39,39,["gl"]]]],"ms":260},
    relay_rack: {"base":[".......Fd.......",".......Fd.......",".......Fd.......","..yyyyyyyyyyyy..","..AGGGGGGGGGGF..","..AGGGGGGGGGGF..","..AGdddddddkGF..","..AGdddddddkGF..","..AGdyydlldssF..","..AGdddddddkGF..","..AGdddddddkGF..","..AGdssdyydBBF..","..AGdddddddkGF..","..AGdddddddkGF..","..AGdlldBBdyyF..","..AGdddddddkGF..","..AGdddddddkGF..","..AGdBBdssdllF..","..AGdddddddkGF..","..AGdddddddkGF..","..AGkkkkkkkkGF..","..AGGGGGGGGGGF..","..AGGGGGGGGGGF..","..AGyGyGyGyGGF..","..AGyGyGyGyGGF..","..AGGGGGGGGGGF..","..AGGGGGGGGGGF..","..FFFFFFFFFFFF..","...FFFFFFFFFF...","...FF......FF...","..kkkkkkkkkkkk..","................"],"f":[[],[[8,8,["BB"]],[5,11,["BB____ll"]],[5,14,["ss_ll_BB"]],[5,17,["ll____yy"]]]],"ms":700},
    switchboard: {"base":["................",".......ss.......",".......ss.......","......yyyy......",".AAAAAAAAAAAAAF.",".AGGGGGGGGGGGGF.",".AGBBBBBBBBBBGF.",".AGByByBByByBGF.",".AGBktkBBkBkBGF.",".AGBBtBBBBBBBGF.",".AGBytyBByByBGF.",".AGBktkBBkgkBGF.",".AGBBtBBBBgBBGF.",".AGBytyBBygyBGF.",".AGBkBtttkgkBGF.",".AGBBBBBBBgBBGF.",".AGByByBBygyBGF.",".AGBkBkByyykBGF.",".AGFFFFFFFFFFGF.",".AGGGGGGGGGGGGF.",".AGGGGGGGGGGGGF.",".FFFFFFFFFFFFFF.","AAAyyAAAyAAyAAAA","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","..FF........FF..","..FF........FF..","..FF........FF..","..FF........FF..",".kkkkkkkkkkkkkk.","................"]},
    wire_desk: {"base":["................","..........yyy...",".........yyF....","...........F....","...........F....","..JCddCJ...F....","..JCCCCJ..yyy...","..JJJJJJ........",".AAAAAAAAAAAAAF.",".AGGGGGyyGGGGGF.",".AGGGGGGGGGGGGF.",".FFFFFFFFFFFFFF.","..FF........FF..","..FF........FF..","..FF........FF..",".kkkkkkkkkkkkkk."]},
    wire_callbox: {"base":[".......yy.......",".......yy.......","......GGGG......","..AAAAAAAAAAAA..",".GGGGGGGGGGGGGG.",".GGGGGGGGGGGGGG.",".FFFFFFFFFFFFFF.","..EEEEEEEEEEEF..","..EJJJJJJJJJJF..","..EJcccccccnJF..","..EJtttttttnJF..","..EJttyytttnJF..","..EJttyFtttnJF..","..EJttyFtttnJF..","..EJttyytttnJF..","..EJtttttttnJF..","..EJJJJJJJJJJF..","..EJJJJJJJJJJF..","..EJJyyyyyyJJF..","..EJJGGGGGGJJF..","..EJJJJJJJJJJF..","..EJJJJJJJJJJF..","..EJGGGGGGGGJF..","..EJJJJJJJJJJF..","..EJJJJJJJJJJF..","..EJJJJJJJJJJF..","..EJJJJJJJJJJF..","..FFFFFFFFFFFF..","..FFFFFFFFFFFF..","..FFFFFFFFFFFF..",".kkkkkkkkkkkkkk.","................"]},
    curfew_notice: {"base":["................","..yyyyyyyyyyyy..","..yJJJJJJJJJJy..","..yJCCCCCCCCJy..","..yJJJJJJJJJJy..","..yJCCCCCCJJJy..","..yJJJJJJJJJJy..","..yJCCCCCCCJJy..","..yJJJJJJJJJJy..","..yyyyyyyyyyyy..",".......FF.......",".......FF.......",".......FF.......",".......FF.......",".......FF.......","......kkkk......"]},
    lantern_cordon: {"base":["................",".......FF.......",".......yy.......",".......yy.......","....FF.yy.FF....","....FF....FF....","....FF....FF....","....FF....FF....","....yyyyyyyy....","....JJJJJJJJ....","....FF....FF....","....FF....FF....","....FF....FF....","....FF....FF....","....FF....FF....","...kkkkkkkkkk..."]},
  },
};
// Paints CRACKDOWN_ART into TILES / WART (called from addExteriorArt) and code-draws the three pieces that are not grids:
// the translucent searchlight beams, the dust puffs and the emptied Glimmerwell stand. Existing names are never replaced.
function addCrackdownArt(T, A, paint){
  const C = CRACKDOWN_ART;
  for (const [k, rows] of Object.entries(C.tiles)) if (!T[k]) T[k] = paint(rows);
  const build = (base, patches) => {
    const g = base.map(r => r.split(''));
    for (const [x0, y0, rows] of patches || []) rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '_') g[y0 + y][x0 + x] = r[x]; });
    return g.map(r => r.join(''));
  };
  const flip = rows => rows.map(r => [...r].reverse().join(''));
  const make = (grids, ms) => { if (grids.length === 1 && !ms) return paint(grids[0]); const a = grids.map(paint); a.ms = ms; return a; };
  // Built on first draw, not at boot: each new cell size (64x40, 96x40, 48x48, 16x32, 32x16) opens a whole shared sheet
  // (sheetTake), about 6.5 MB of canvas for art only the crackdown and the Fernbrook Lantern House show (memory_walk budget).
  const lazy = (key, fn) => {
    if (key in A) return;
    const set = v => { Object.defineProperty(A, key, { value: v, writable: true, configurable: true, enumerable: true }); return v; };
    Object.defineProperty(A, key, { configurable: true, enumerable: true, get(){ return set(fn()); }, set });
  };
  for (const [k, s] of Object.entries(C.art)) {
    const grids = () => { const base = typeof s.base === 'string' ? C.bases[s.base] : s.base; return (s.f || [[]]).map(p => build(base, p)); };
    lazy(k, () => make(grids(), s.ms));
    if (s.mirror) lazy(s.mirror, () => make(grids().map(flip), s.ms));
  }
  // DRAFT (POST_TRIAL_CRACKDOWN §10a.2): the searchlight, 96x40. A cream cone from the lens (about 45,8) widening forward and
  // down to a warm pool on the ground (centre 80,31). The only translucent art. tank_beam_l is the same cone mirrored.
  const rgba = (key, a) => { const h = PAL[key]; return 'rgba(' + parseInt(h.slice(1, 3), 16) + ',' + parseInt(h.slice(3, 5), 16) + ',' + parseInt(h.slice(5, 7), 16) + ',' + a + ')'; };
  const beam = mirror => sheetPaint(96, 40, g => {
    const dot = (x, y, col) => { g.fillStyle = col; g.fillRect(mirror ? 95 - x : x, y, 1, 1); };
    for (let x = 45; x < 96; x++) {
      const top = Math.round(8 + (x - 45) * 0.3), bot = Math.round(9 + (x - 45) * 0.62), fade = x > 90 ? (96 - x) / 6 : 1;
      for (let y = top; y <= bot && y < 40; y++) {
        const mid = (y - top) / Math.max(1, bot - top), core = mid > 0.3 && mid < 0.7;
        dot(x, y, rgba(core ? 'w' : 'C', ((core ? 0.36 : 0.24) * fade).toFixed(2)));
      }
    }
    for (let y = 25; y < 38; y++) for (let x = 62; x < 96; x++) {
      const d = ((x - 80) / 15) ** 2 + ((y - 31) / 5.5) ** 2;
      if (d <= 1) dot(x, y, rgba(d < 0.4 ? 'w' : 'y', d < 0.4 ? 0.34 : 0.3));
    }
  });
  lazy('tank_beam_r', () => beam(false));
  lazy('tank_beam_l', () => beam(true));
  // DRAFT (§10a.2): dust behind the treads, 32x16, 3 frames at 160 ms. Dithered sand puffs at 55%, growing and lifting.
  lazy('tank_dust', () => {
    const dust = [0, 1, 2].map(f => sheetPaint(32, 16, g => {
      g.globalAlpha = 0.55;
      [[7, 12], [15, 11], [24, 12]].forEach(([cx, cy], i) => {
        const r = 2 + f + (i === 1 ? 1 : 0), yy = cy - f;
        for (let y = -r; y <= r; y++) for (let x = -r - 1; x <= r + 1; x++) {
          if ((x / (r + 1)) ** 2 + (y / r) ** 2 > 1 || (x + y + f) % 2) continue;
          px(g, PAL[y < 0 ? 'A' : 'G'], cx + x, yy + y);
        }
      });
      g.globalAlpha = 1;
    }));
    dust.ms = 160;
    return dust;
  });
  // DRAFT (POST_TRIAL_CRACKDOWN §10): the Glimmerwell stand left behind. A.glimmer_stand with the bottles gone and its wine
  // trim stripped to bare board; a torn price card hangs off the edge. No V, N or Q.
  if (!A.glimmer_stand_empty) A.glimmer_stand_empty = mkTile(g => {
    px(g, PAL.w, 1, 7, 14, 3); px(g, PAL.h, 1, 10, 14, 1); px(g, PAL.d, 2, 11, 1, 5); px(g, PAL.d, 13, 11, 1, 5);
    px(g, PAL.h, 1, 7, 14, 1); px(g, PAL.m, 3, 7, 3, 1); px(g, PAL.m, 9, 7, 2, 1);
    [[4, 6], [8, 6], [12, 6]].forEach(([x, y]) => px(g, PAL.h, x, y, 2, 1));
    px(g, PAL.F, 11, 10, 1, 2); px(g, PAL.C, 10, 12, 3, 3); px(g, PAL.h, 11, 13, 1, 1);
  });
}
// HIGH_CHARITY_LAYOUT §10 (A-rows): PLACEHOLDER art for the High Charity city preview. Draft quality, PAL keys only, no outside
// assets; Pia redraws before ship. Every grid carries a 2x2 y/d checker tag bottom-right (map tiles C Z U M: one `y` pixel).
// Keeper art uses `J`. Glimmerwell keys appear only on the teacup rim (`V`) and the card spark (`Q`). The tanks carry no gun.
const HC_CITY_ART = {
  tiles: {
    C: ["hhhmhhhmhhhmhhhm","hhhmhhhmhhhmhhhm","hhhmhhhmhhdmhhhm","mmmmmmmmmmmmmmmm","hmhhhmhhhmhhhmhh","hmhhhmhhhhhhhmhh","hmhhhmhhhmhhhmhh","mmmmmmmmmmmmmmmm","hhhmhhhmhhhmhhhm","hhhmhhhmhhhmhhhm","hhhmhhhmhhhmdhhm","mmmmmmmmmmmmmmmm","hmhhhmhhhmhhhmhh","hmdhhmhhhmhhhhhh","hmhhhmhhhmhhhmhh","mmmmmmmmmmmmmmmy"],
    Z: ["hhwwwwwmhhwwwwwm","hhwwwwwmhhwwwwwm","hhwwwwwmhhwwwwwm","mmwwwhwmmmwwwhwm","hmwwwwwhhmwwwwwh","hmwwwwwhhhwwwwwh","hmwwwwwhhmwwwwwh","mmwwhwwmmmwwhwwm","hhwwwwwmhhwwwwwm","hhwwwwwmhhwwwwwm","hhwwwwwmhhwwwwwm","mmwhwwwmmmwhwwwm","hmwwwwwhhmwwwwwh","hmwwwwwhhmwwwwwh","hmwwwwwhhmwwwwwh","mmhwwwwmmmhwwwwy"],
    U: ["wwwwwwwwwwwwwwww","hhhmhhhhhhhmhhhh","hhhmhhhhhhhmhhhh","mmmmmmmmmmmmmmmm","dddddddddddddddd","wmhhhmhhhhhhhmhh","wmhhhmhhhmhhhmhh","wmmmmmmmmmmmmmmm","whhmhhhmhhhmhhhm","whhmhhhmhhhmhhhm","whhmhhhmhhhmdhhm","wmmmmmmmmmmmmmmm","wmhhhmhhhmhhhmhh","wmdhhmhhhmhhhhhh","wwwwwwwwwwwwwwww","mmmmmmmmmmmmmmmy"],
    M: ["hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhh","llllllllllllllll","ggllgggggggggggg","gggggggggggllggg","ggggggglgggggggg","gggggggggggggggg","gggggggggggggglg","gggglggggggggggg","ggggglgggglggggg","gggggggggggggggg","glggggggggggglgg","ggggggggllgggggg","gggggggggggggggg","hhhhhhhhhhhhhhhh","hhhhhhhhhhhhhhhy"],
    door_chained: ["................","..dddddddddddd..","..dkkkkkkkkkkmmm","..d..d..d..d...m","..d..d..d..d..dd","..d..d..d..d....","..d..d..d..d....",".hmhmd.hh..hmhm.","..d..hddddmd....","..d..ddkmd.d....","..d..ddddd.d....","..d..d..d..d....","..d..d..d..d....","..d..d..d..d....","..d..d..d..d..yd","..dkkkkkkkkkk.dy"],
    roof_muster: ["dddddddkdddddddk","ddFFdddkdddddddk","dddddddkddddFddk","kkkkkkkkkkkkkkkk","dddkdddddddkdddd","dddkddddddFFdddd","dFdkdddddddkdddd","kkkkkkkkkkkkkkkk","dddddddkdddddddk","dddddFFkdddddddk","dddddddkdFdddddk","kkkkkkkkkkkkkkkk","dddkdddddddkdddd","dddkdddddddkdFFd","dddkdddddddkddyd","kkkkkkkkkkkkkkdy"],
    wall_muster: ["dddddddFdddddddd","dddFdddFdddddddd","dddddddFdddFdddd","dddddddFdddddddd","FFFFFFFFFFFFFFFF","dddddddddddddddd","kkFkkkkkFkkkkkFk","kkkkkkkkkkkkkkkk","dddddddddddddddd","ddddddddddFddddd","dddddddddddddddd","FFFFFFFFFFFFFFFF","dddFddddddddFddd","dddFdFddddddFddd","dddFddddddddFdyd","dddFddddddddFddy"],
  },
  art: {
    hc_lamp_box: [".....dddddd.....",".....ywyyyy.....",".....yywyyy.....",".....yyyyyy.....",".....yyyyyy.....","....dddddddd....",".......dmddddd..","......ddddhhhd..",".......dmdhmmd..",".......dmdmmmd..",".......dmddddd..",".......dm.......",".......dm.......",".......dm.......",".......dm.....yd",".....dddddd...dy"],
    hc_finial: [".......F........","......FyF.......",".....FFFFF......",".....FyyyF......","....oFywyFo.....","....oFywyFo.....",".....FyyyF......",".....FoooF......",".....FFFFF......","......FyF.......","......FFF.......",".....FFFFF......","....FoFFFoF.....","...FFFFFFFFF....","..FFFFFFFFFFF.yd","..............dy"],
    hc_lantern_wall_0: ["FFFFFFFFFFFFFFFF","FGFFFFFFFGFFFFFF","FowFFGFFFyyFFGFF","FooFFyyFFoyFFooF","FFFFFoyFFFFFFooF","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","FFFGFFFFFFFGFFFF","FFFywFFGFFFooFGF","FFFoyFFyyFFooFyy","FFFFFFFoyFFFFFoy","GGGGGGGGGGGGGGGG","FGFFFFFFFGFFFFFF","FywFFGFFFyyFGFFF","FoyFFooFFoyFyyyd","FFFFFooFFFFFoydy"],
    hc_lantern_wall_1: ["FFFFFFFFFFFFFFFF","FGFFFFFFFGFFFFFF","FyyFFGFFFooFFGFF","FoyFFyyFFooFFywF","FFFFFoyFFFFFFoyF","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","FFFGFFFFFFFGFFFF","FFFyyFFGFFFyyFGF","FFFoyFFooFFoyFyw","FFFFFFFooFFFFFoy","GGGGGGGGGGGGGGGG","FGFFFFFFFGFFFFFF","FooFFGFFFyyFGFFF","FooFFyyFFoyFowyd","FFFFFoyFFFFFoody"],
    hc_hold_spike: [".......m........",".......d........",".......d........",".......d........","...hhhhdhhhh....","...hdddddwwh....","...hhhhhhhhh....","....hhhdhhhh....","....hhhhhhhh....","..hhhhhdhhhh....","..hhhhhhhhhh....",".......d........","....GGGGGGGG....","...FFFFFFFFFF...","...FFFFFFFFFF.yd","..............dy"],
    hc_wait_tray: ["................","................","................","................","................","................","...wwwwwwwwwh...","...whhhhhhwww...","..wwwwwwwwwww...","..wwwwwwwwwwww..",".FFFFFFFFFFFFFF.",".FwhhhhhwwwwwwF.",".FGGGGGGGGGGGGF.",".FFFFFFFFFFFFFF.","..............yd","..............dy"],
    hc_permit_tray: ["................","................","................","................","................","...whhhhwwwww...","...wwwwwwwwwh...","..wwwwwwwwwww...","..wFFFFFFwwrw...",".FwwwwwwwwwwwFF.",".FwhhhhhwwwwwwF.",".FGGGGGGGGGGGGF.",".FGGGGGGGGGGGGF.",".FFFFFFFFFFFFFF.","..............yd","..............dy"],
    hc_lampstock_stamp: ["................","................","................","..........FF....","..........FF....","..........FG....","..........GG....","..........GG....","..........GG....","........FGFFFF..",".kkkkkkkFFFFFF..",".kFFFFFkdddddd..",".kdddddkdddddd..",".kkkkkkk........","..............yd","..............dy"],
    hc_teacups: ["................","................","................","................","................","................","................",".VVVVVV..hhhhh..",".wFFFhw..wFFhw..",".wwwwhww.wwwhww.",".wwwwhww.wwwhww.",".whhhhw..whhhw..","hhhhhhhhhhhhhhh.",".mmmmmm..mmmmm..","..............yd","..............dy"],
    hc_bright_card: ["................","................","................","................","................","................","................","................","...hhhhhhhhhh...","...hwwwwwwwwh...","...hmmmmmwwQh...","...hwwwwwwwwh...","...hmmmmmmmwh...","...hhhhhhhhhh...","..............yd","..............dy"],
    hc_desk_plate: ["................","................","................","................","................","................","................","................","................","..wwwwwwwwwwww..","..yyyyyyyyyyyG..","..yyFFFFFFFFyG..","..yyyyyyyyyyyG..",".FGGGGGGGGGGGGF.",".FFFFFFFFFFFFFyd","..............dy"],
    hc_lectern: ["................","................","................","..........yy....","..........yy....","...GGGGGGGFG....","..GwwwwGwwwwG...","..GwhhwGwhhwG...",".GGGGGGGGGGGGG..",".FFFFFFFFFFFFF..",".....GGGF.......","......GF........","......GF........","......GF........","......GF........","......GF........","......GF........","......GF........","......GF........","......GF........",".....GGFF.......","...GGGGGFFF.....","..FFFFFFFFFF..yd","..............dy"],
    hc_camera_cloth: ["................","................","......hhhh......",".....hwwhhh.....","....hwhhhhhh....","...dmhhhhhhhh...","..dmmhhhhhhhhh..","..dmmhhwhhhhhh..","...dmhhhhhhmhh..","....hhhhhhhmhh..","....hhwhhhmhhh..","....hhhhhmhhhh..","....hmhhhhhhmh..",".....h.hmhh.h...",".......dddd.....","......dmddmd....","......d.dm.d....",".....d..dm..d...",".....d..dm..d...","....d...dm...d..","....d...dm...d..","...d....dm....d.","...m....dm....yd","..............dy"],
    hc_wire_printer_0: ["................",".....wwwwwh.....",".....wwwwww.....",".....wmmmmw.....",".....wwwwww.....",".....wmmmww.....",".....wwwwww.....",".....wmmmmw.....","..ddkdkkkkkkdd..","..dwwwwwwwwwwd..","..dhhhhhhhhhhd..","..dhwmmmwmmmhd..","..dhmmwmmmwmhd..","..dhmmmmmmmmhd..","..dhhhhhhhhhhd..","..dmmmmmmmmmmd..","..dddddddddddd..","...mmmmmmmmmm...","....m......m....","....m......m....","....m......m....","....dddddddd....","....m......m..yd","..............dy"],
    hc_wire_printer_1: [".....wwwwwh.....",".....wwwwww.....",".....wmmmmw.....",".....wwwwww.....",".....wmmmww.....",".....wwwwww.....",".....wmmmmw.....",".....wwwdww.....","..ddkkkkkkkkdd..","..dwwwwwwwwwwd..","..dhhhhhhhhhhd..","..dhmmwmmmwmhd..","..dhwmmmwmmmhd..","..dhmmmmmmmmhd..","..dhhhhhhhhhhd..","..dmmmmmmmmmmd..","..dddddddddddd..","...mmmmmmmmmm...","....m......m....","....m......m....","....m......m....","....dddddddd....","....m......m..yd","..............dy"],
    hc_roll_ledger: ["................","................","..GGGGGGGGGGGG..","..GssccccccccG..","..GscccccccccG..","..GscFFFFFFFcG..","..GscFwwwwwFcG..","..GscFFFFFFFcG..","..GscGGGGGGGcG..","..GscFFFFFFFcG..","..GscFFwwwFFcG..","..GscFFFFFFFcG..","..GccccccccccG..","..GGGGGGGGGGGG..",".FGGGGGGGGGGGGF.",".FFFFFFFFFFFFFF.","...GF......GF...","...GF......GF...","...GF......GF...","...GF......GF...","...GF......GF...","..FFFFFFFFFFFF..","..............yd","..............dy"],
    hc_lantern_pin: ["................","................","................","................","................","................",".......F........","......FyF.......",".....FywyF......",".....FyyyF......",".....FyyyF......","......FyF.......","....rrrrrrr.....","...rBrrrrrBr....","....GGGGGGG.....",".......GF.......",".......GF.......",".......GF.......",".......GF.......",".......GF.......","......GGFF......","....GGGGFFFF....","...FFFFFFFFFF.yd","..............dy"],
    hc_chute_top: [".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....","....yyyyyyyy....","....FFFFFFFF....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....wFFFww.....",".....yGGGGF.....","....yyyyyyyy....","...FyyyyyyyyF...","...FGGGGGGGGF...","...FGkkkkkkGF...","...FGkkkkkkGF...","...FGyyyyyyGF...","...FGGGGGGGGF...","...FFFFFFFFFF...","....yyyyyyyy....","....FFFFFFFF....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....","....FFFFFFFF....","...FFFFFFFFFF.yd","..............dy"],
    hc_chute_mouth: [".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....","....yyyyyyyy....","....FFFFFFFF....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....","....yyyyyyyy....","....FFFFFFFF....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....",".....yGGGGF.....","....yyyyyyyy....","....FFFFFFFF....",".....yGGGGF.....","...FyyyyyyyyF...","..FGGGGGGGGGGF..",".FGkkkkkkkkkkGF.",".FGkwwwwwwwwkGF.",".FFFFFFFFFFFFFF.","................","...GwwwwwwwwG...","..FFFFFFFFFFFF..","..............yd","..............dy"],
    hc_stamp_table: ["................................","................................","....................FF..........","...............FF...FF..........","....wwrrrrwww..FF...FF..FFFFF...","....wwrrrrwrw..GG..dddd.FrrrF...",".GGGwwwwwwwwwGddddGrGGGGFFFFFGG.",".GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.",".FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.","..GF........................FF..","..GF........................FF..","..GF........................FF..","..GF........................FF..","..GF........................FF..","..GF........................FFyd","..............................dy"],
    hc_thanks_letters: [".....r...................r......",".wwywwwwww...........wwwwwwwww..",".wyyyywwww.....r.....wwwwwwwww..",".wyyyyywww.wwwwwwwww.wwwyywwww..",".wyyyywwww.wwwwwwwww.wwwyywwww..",".wwwwwwwww.wwrwrwbbw.wwwrrwwww..",".wwwwwwwww.wwrrrwbbw.wwrrrrwww..",".wbbbbbbbw.wwwrwwbbw.wwwrrwwww..",".wwwwwwwww.wwwwwwwww.wwwwwwwww..",".wbbbbbwww.wwwwwwwww.wbbbbbbbw..",".wwwwwrwrw.wwyyyyyyw.wyyyywwww..",".wwwwwwrww.wwwwwwwww.wwwwwwwww..",".wwwwwwwww.wwbbbbwww............","...........wwwwwwwww............","..............................yd","..............................dy"],
    hc_court_steps_w: ["hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","hhhhhhhhhhhhhhhh","dmhwwwwwwwwwwwww","dmhwwwwwwwwwwwww","dmhhhhhhhhhhhhhh","dmhmmmmmmmmmmmmm","dmhmmmmmmmmmmmmm","dmhwwwwwwwwwwwww","dmhwwwwwwwwwwwww","dmhhhhhhhhhhhhhh","dmhmmmmmmmmmmmmm","dmhmmmmmmmmmmmmm","dmhwwwwwwwwwwwww","dmhwwwwwwwwwwwww","dmhhhhhhhhhhhhhh","dmhmmmmmmmmmmmmm","dmhmmmmmmmmmmmmm","dmhwwwwwwwwwwwww","dmhwwwwwwwwwwwww","dmhhhhhhhhhhhhhh","dmhmmmmmmmmmmmmm","dmhmmmmmmmmmmmmm","dmhmmmmmmmmmmmmm","dmhddddddddddddd"],
    hc_court_steps: ["hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","hhhhhhhhhhhhhhhh","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","hhhhhhhhhhhhhhhh","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","hhhhhhhhhhhhhhhh","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww","hhhhhhhhhhhhhhhh","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","dddddddddddddddd"],
    hc_court_steps_e: ["hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","wwwwwwwwwwwwwwwh","hhhhhhhhhhhhhhhh","wwwwwwwwwwwwwhmd","wwwwwwwwwwwwwhmd","hhhhhhhhhhhhhhmd","mmmmmmmmmmmmmhmd","mmmmmmmmmmmmmhmd","wwwwwwwwwwwwwhmd","wwwwwwwwwwwwwhmd","hhhhhhhhhhhhhhmd","mmmmmmmmmmmmmhmd","mmmmmmmmmmmmmhmd","wwwwwwwwwwwwwhmd","wwwwwwwwwwwwwhmd","hhhhhhhhhhhhhhmd","mmmmmmmmmmmmmhmd","mmmmmmmmmmmmmhmd","wwwwwwwwwwwwwhmd","wwwwwwwwwwwwwhmd","hhhhhhhhhhhhhhmd","mmmmmmmmmmmmmhmd","mmmmmmmmmmmmmhmd","mmmmmmmmmmmmmhyd","dddddddddddddhdy"],
    hc_car_b: ["................................","................................","................................","..........bbbbbbbbbbb...........",".........bccccbccccccb..........","........bcwcccbcwccccnb.........",".......bccccccbcccccccnb........","......bbbbbbbbbbbbbbbbbbb.......","....bbbbbbbbbbbbbbbbbbbbbbbb....","...bwbbbbbbbbbbbbbbbbbbbbbbbb...","..bwbbbbbbbbbbbbbbbbbbbbbbbbbn..","..ybbbbbbbbbbbbdbbbbbbbbbbbbbr..","..ybbbbbbbbbbbbbbbbbbbbbbbbbbr..","..nnnnnnnnnnnnnnnnnnnnnnnnnnnn..","..dnnkkkknnnnnnnnnnnnnkkkknnnd..","...dkkmmkkddddddddddddkkmmkkd...","....kkmmkk............kkmmkk....",".....kkkk..............kkkk.....","................................","................................","................................","................................","..............................yd","..............................dy"],
    hc_car_r: ["................................","................................","................................","..........rrrrrrrrrrr...........",".........rccccrccccccr..........","........rcwcccrcwccccpr.........",".......rccccccrcccccccpr........","......rrrrrrrrrrrrrrrrrrr.......","....rrrrrrrrrrrrrrrrrrrrrrrr....","...rwrrrrrrrrrrrrrrrrrrrrrrrr...","..rwrrrrrrrrrrrrrrrrrrrrrrrrrp..","..yrrrrrrrrrrrrdrrrrrrrrrrrrro..","..yrrrrrrrrrrrrrrrrrrrrrrrrrro..","..pppppppppppppppppppppppppppp..","..dppkkkkpppppppppppppkkkkpppd..","...dkkmmkkddddddddddddkkmmkkd...","....kkmmkk............kkmmkk....",".....kkkk..............kkkk.....","................................","................................","................................","................................","..............................yd","..............................dy"],
    hc_car_t: ["................................","................................","................................","..........ttttttttttt...........",".........tcccctcccccct..........","........tcwccctcwccccnt.........",".......tcccccctcccccccnt........","......ttttttttttttttttttt.......","....tttttttttttttttttttttttt....","...twtttttttttttttttttttttttt...","..twtttttttttttttttttttttttttn..","..yttttttttttttdtttttttttttttr..","..yttttttttttttttttttttttttttr..","..nnnnnnnnnnnnnnnnnnnnnnnnnnnn..","..dnnkkkknnnnnnnnnnnnnkkkknnnd..","...dkkmmkkddddddddddddkkmmkkd...","....kkmmkk............kkmmkk....",".....kkkk..............kkkk.....","................................","................................","................................","................................","..............................yd","..............................dy"],
    hc_car_y: ["................................","................................","................................","..........yyyyyyyyyyy...........",".........yccccyccccccy..........","........ycwcccycwccccoy.........",".......yccccccycccccccoy........","......yyyyyyyyyyyyyyyyyyy.......","....yyyyyyyyyyyyyyyyyyyyyyyy....","...ywyyyyyyyyyyyyyyyyyyyyyyyy...","..ywyyyyyyyyyyyyyyyyyyyyyyyyyo..","..yyyyyyyyyyyyydyyyyyyyyyyyyyr..","..yyyyyyyyyyyyyyyyyyyyyyyyyyyr..","..oooooooooooooooooooooooooooo..","..dookkkkoooooooooooookkkkoood..","...dkkmmkkddddddddddddkkmmkkd...","....kkmmkk............kkmmkk....",".....kkkk..............kkkk.....","................................","................................","................................","................................","..............................yd","..............................dy"],
    hc_car_w: ["................................","................................","................................","..........wwwwwwwwwww...........",".........wccccwccccccw..........","........wcwcccwcwcccchw.........",".......wccccccwccccccchw........","......wwwwwwwwwwwwwwwwwww.......","....wwwwwwwwwwwwwwwwwwwwwwww....","...wwwwwwwwwwwwwwwwwwwwwwwwww...","..wwwwwwwwwwwwwwwwwwwwwwwwwwwh..","..ywwwwwwwwwwwwdwwwwwwwwwwwwwr..","..ywwwwwwwwwwwwwwwwwwwwwwwwwwr..","..hhhhhhhhhhhhhhhhhhhhhhhhhhhh..","..dhhkkkkhhhhhhhhhhhhhkkkkhhhd..","...dkkmmkkddddddddddddkkmmkkd...","....kkmmkk............kkmmkk....",".....kkkk..............kkkk.....","................................","................................","................................","................................","..............................yd","..............................dy"],
  },
  big: {
    hc_kindness_board: [".FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.",".FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF.",".FGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGF.",".FGJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJGF.",".FGJyJwwJJwwwJwwwJwwJJwwwJwwwJwwJJwwwJwwwJwyJGF.",".FGJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJGF.",".FGJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJGF.",".FGwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwGF.",".FGwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwGF.",".FGwGGGGGGwwwJJJJJwwwwwwwGGGGwwwwwJJJJJJwwwwyGF.",".FGwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwGF.",".FGwwJJJJJwwwwwwGGGGwwwwwwwJJJJJJwwwGGGGGwwwyGF.",".FGwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwGF.",".FGwGGGGwwwwwJJJJJJwwwwwwGGGGGwwwwJJJJwwwwwwyGF.",".FGwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwGF.",".FGwwJJJJJJwwwwwGGGGGwwwwwwJJJJwwwwwGGGGGGwwyGF.",".FGwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwGF.",".FGwGGGGGwwwwJJJJwwwwwwwwGGGGGGwwwJJJJJwwwwwyGF.",".FGwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwGF.",".FGwwJJJJwwwwwwwGGGGGGwwwwwJJJJJwwwwGGGGwwwwyGF.",".FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF.",".FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.",".....GF..................................GF.....",".....GF..................................GF.....",".....GF..................................GF.....",".....GF..................................GF.....",".....GF..................................GF.....",".....GF..................................GF.....",".....GF..................................GF.....",".....GF..................................GF.....","...FFFFFF..............................FFFFFF.yd","..............................................dy"],
    hc_mural: ["FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","FhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhF","FhhhhhhhhhhhhhhhhhJJJJJJJJJJJJJJJJJJJJJJJJJJJJhhhhhhhhhhhhhhhhhF","FhhhhhhhhhhhhhhhhhJJJwwJwwJwwJwwJwwJwwJwwJwwJJhhhhhhhhhhhhhhhhhF","FhhhhhyhhhhhhhhhhhJJJJJJJJJJJJJJJJJJJJJJJJJJJJhhhhhhhhhhhhhhhhhF","FhhhhoyhhhhhhhhhhhJJJJJJJJJJJJJJJJJJJJJJJJJJJJhhhhhhhhhhhhhhhhhF","FhhhhhhhhhhhhhhhhyJhhhhhhhhhhhhhhhhhhhhhhhhhyJhhhhhhhhhhyhhhhhhF","FhhhhhhhhhhhhhhhoyhhhhhhhhhhhhhhhhhhhhhhhhhoyhhhhhhhhhhoyhhhhhhF","FhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhF","FhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhF","FhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhF","FhhhhhhhhhhhhyhyhhhhhhhhhhhhhhhhhyhhyhhhhhhhhhhhhhhhhhyyhhhhhhhF","FhhhhhhhhhhhhywyhhhhhhhhhhhhhhhhhywwyhhhhhhhhhhhhhhhhhwyhhhhhhhF","FCCCCCCCCCCCCFCFCCCCCCCCCCCCCCCCCFCCFCCCCCCCCCCCCCCCCCFFCCCCCCCF","FCCCCCCCJJJCCFCFCCJJJCCCCCCCJJJCCFCCFCCJJJCCCCCCCJJJCCFFCCJJJCCF","FCCCCCCCJ22CCFCFCCJ22CCCCCCCJ22CCFCCFCCJ22CCCCCCCJ22CCFFCCJ22CCF","FCCCCCCC222CCFCFCC222CCCCCCC222CCFCCFCC222CCCCCCC222CCFFCC222CCF","FCCCCCCJJJJJJCCCJJJJJJCCCCCJJJJJJCCCCJJJJJJCCCCCJJJJJJCCJJJJJJCF","FCCCCCCJJyJJllCCCJJyJJCCCCCJJyJJCCCCCCJJyJJllCCCJJyJJCCCCJJyJJCF","FCCCCCCJJJJJllCCCJJJJJCCCCCJJJJJCCCCCCJJJJJllCCCJJJJJCCCCJJJJJCF","FCCCCCCCJJJCllCCCCJJJCCCCCCCJJJCCCCCCCCJJJCllCCCCJJJCCCCCCJJJCCF","FCCCCCCCdCdCCCCCCCdCdCCCCCCCdCdCCCCCCCCdCdCCCCCCCdCdCCCCCCdCdCCF","FEEEEEEEdEdllllEEEdEdEEEEEEEdEdEEEllllldEdEEEEEEEdEdEEEEEEdEdEEF","FggggggggggllllgggggggglllgggggggglllllgggggggggggggllllgggggggF","FggggggggggllllgggggggglllggggggggggggggggggggggggggllllgggggggF","FgggggggggggggggggggggglllggggggggggggggggggggggggggllllgggggggF","FggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggF","FggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggF","FggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggF","FggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggF","Fgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggyd","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFdy"],
    hc_motto_board: ["FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","FmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmF","FddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddF","FddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddF","FddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddF","FdddddwwwwddwwwddwwwddddwwwwddwwwddwwwddwwwddwwwddddwwwwddwwwddwwwddwwwdwwwddwwwddwwwddwwwddwwwF","FdddddwddwddwdwddwdwddddwddwddwdwddwdwddwdwddwdwddddwddwddwdwddwdwddwdwdwdwddwdwddwdwddwdwddwdwF","FdddddwdwwddwwwddwwwddddwdwwddwwwddwwwddwwwddwwwddddwdwwddwwwddwwwddwwwdwwwddwwwddwwwddwwwddwwwF","FdddddwddwddwdwddwdwddddwddwddwdwddwdwddwdwddwdwddddwddwddwdwddwdwddwdwdwdwddwdwddwdwddwdwddwdwF","FdddddwwwwddwwwddwwwdwddwwwwddwwwddwwwddwwwddwwwdwddwwwwddwwwddwwwddwwwdwwwddwwwddwwwddwwwddwwwF","FddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddF","FddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddF","FddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddF","FddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddF","Fdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddyd","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFdy"],
    hc_gate_arch: ["yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy","hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwyyyyyyyyyyyywwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyJJJJyyJJJJyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyww","wwJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJyJJJyyyyJJJyJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJww","wwJJJJJJyJJJJJyJJJJJyJJJJJyJJJJJyJyJJJywwyJJJyJJJJyJJJJJyJJJJJyJJJJJyJJJJJJJJJww","wwJJJJJJyJJJJJyJJJJJyJJJJJyJJJJJyJyJJJyyyyJJJyJJJJyJJJJJyJJJJJyJJJJJyJJJJJJJJJww","wwJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJyJJJJJJJJJJyJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJww","wwyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyJJJJJJJJJJyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwyyyyyyyyyyyywwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh","hhhhhhhhhhhhwwwwwwh..........................................hwwwwwwhhhhhhhhhhhh","hhhhhhhhhhhhwwwwh..............................................hwwwwhhhhhhhhhhhh","hwwwwwwwwwwhwwwh................................................hwwwhwwwwwwwwwwh","hwwwwwwwwwwhwwh..................................................hwwhwwwwwwwwwwh","hwwwwwwwwwwhwh....................................................hwhwwwwwwwwwwh","hwwwwwwwwwwhwh....................................................hwhwwwwwwwwwwh","hwwwwwwwwwwh..d.................................................d...hwwwwwwwwwwh","hwwwwwwwwwwh..d.................................................d...hwwwwwwwwwwh","hwwwwwwwwwwh..d.................................................d...hwwwwwwwwwwh","hwwwwwwwwwwh.yyy...............................................yyy..hwwwwwwwwwwh","hwyyyyyyyywh.ywy...............................................ywy..hwyyyyyyyywh","hwJJJJJJJJwh.yyy...............................................yyy..hwJJJJJJJJwh","hwJJJJJJJJwh.ddd...............................................ddd..hwJJJJJJJJwh","hwJJJwyJJJwh........................................................hwJJJwyJJJwh","hwJJJyyJJJwh........................................................hwJJJyyJJJwh","hwJJJyyJJJwh........................................................hwJJJyyJJJwh","hwJJyyyyJJwh........................................................hwJJyyyyJJwh","hwJJJJJJJJwh........................................................hwJJJJJJJJwh","hwJJJJJJJJwh........................................................hwJJJJJJJJwh","hwJJJJJJJJwh........................................................hwJJJJJJJJwh","hwJJJJJJJJwh........................................................hwJJJJJJJJwh","hwyyyyyyyywh........................................................hwyyyyyyyywh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hwwwwwwwwwwh........................................................hwwwwwwwwwwh","hhhhhhhhhhhh........................................................hhhhhhhhhhhh","hhhhhhhhhhhh........................................................hhhhhhhhhhhh","hhhhhhhhhhhh........................................................hhhhhhhhhhyd","dddddddddddd........................................................dddddddddddy"],
    hc_tank_escort_0: ["........................................FFF.....................",".......................................FywyF....................","......................................yFywyFy...................",".......................................FyyyF....................","........................................FFF.....................",".........................................d......................","..............................GGGGGG....ddd.....................",".............................GFFFFFFy...........................","...........................JJJJJJJJJ............................","................JJJJJ...JJJEEEEEJJJJJJJ.........................",".................AAA..JJEEEDDEEJJJJJJJJJk...........AAyAA.......","................ACyCAJJEEDDEEJJJJJJJJJJJJk...........mdd........","................AywyAJEEEEJJJJJJJJJJJJJJJJk..........mdd........","................ACyCAEEEJJJJJJJJJJJJJJJJJJJk.........mdd........",".................AAAJEJJJJJJJJJJJJJJJJJJJJJkk........mdd........","..................JJJJJJJJJJJJJJJJJJJJJJJJJJk........mdd........","..................dddddddddddddddddddddddddddd.......mdd........",".................dmymdmymdmymdmymdmymdmymdmymd.......mdd........","..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD........","..........EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.......",".........dJJJJJJJJJJJJJJmdJJJJGGGGGGGGJJJJmdJJAJJJJJJJAJJk......","........dJJJJJJJJJJJJJJJmyJJJJGCCCCCCGJJJJmyJJAGGGGGGGAJJJk.....","......kykJJJJJJJJJJJJJJJmdJJJJGCFCFCFGJJJJmdJJAJJJJJJJAJJJJk....","....wAdJJJJJJJJJJJJJJJJJmdJJJJGCCCCCCGJJJJmdJJAFFFFFFFAJJJJk....","....AyJJJJJJJJJJJJJJJJJJmyJJJJGGGGGGGGJJJJmyJJJJJJJJJJJJJJJk....","....dJJJJmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmJk....","....dJJJJJJJFJFJFJFJFJJJmdJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJk....","....mmmmmmmmmFmFmFmFmFmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm....","....dddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddydddd....","..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..","..FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF..","...FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...","....kdmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmdk....","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmkmk...","...kdmddkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkmdmmk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmmmk...","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","....kddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmk..yd",".....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...dy"],
    hc_tank_escort_1: ["........................................FFF.....................",".......................................FyyyF....................",".......................................FyyyF....................",".......................................FyyyF....................","........................................FFF.....................",".........................................d......................","..............................GGGGGG....ddd.....................",".............................GFFFFFFy...........................","...........................JJJJJJJJJ............................","................JJJJJ...JJJEEEEEJJJJJJJ.........................",".................AAA..JJEEEDDEEJJJJJJJJJk...........AAyAA.......","................ACyCAJJEEDDEEJJJJJJJJJJJJk...........mdd........","................AyyyAJEEEEJJJJJJJJJJJJJJJJk..........mdd........","................ACyCAEEEJJJJJJJJJJJJJJJJJJJk.........mdd........",".................AAAJEJJJJJJJJJJJJJJJJJJJJJkk........mdd........","..................JJJJJJJJJJJJJJJJJJJJJJJJJJk........mdd........","..................dddddddddddddddddddddddddddd.......mdd........",".................dmymdmymdmymdmymdmymdmymdmymd.......mdd........","..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD........","..........EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.......",".........dJJJJJJJJJJJJJJmdJJJJGGGGGGGGJJJJmdJJAJJJJJJJAJJk......","........dJJJJJJJJJJJJJJJmyJJJJGCCCCCCGJJJJmyJJAGGGGGGGAJJJk.....","......kykJJJJJJJJJJJJJJJmdJJJJGCFCFCFGJJJJmdJJAJJJJJJJAJJJJk....","....wAdJJJJJJJJJJJJJJJJJmdJJJJGCCCCCCGJJJJmdJJAFFFFFFFAJJJJk....","....AyJJJJJJJJJJJJJJJJJJmyJJJJGGGGGGGGJJJJmyJJJJJJJJJJJJJJJk....","....dJJJJmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmJk....","....dJJJJJJJFJFJFJFJFJJJmdJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJk....","....mmmmmmmmmFmFmFmFmFmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm....","....dddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddydddd....","..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..","..FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF..","...FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...","....kdmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmdk....","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmkmk...","...kdmddkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkmdmmk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmmmk...","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","....kddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmk..yd",".....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...dy"],
    hc_tank_escort_2: ["........................................FFF.....................",".......................................FGAGF....................",".......................................FGAGF....................",".......................................FGGGF....................","........................................FFF.....................",".........................................d......................","..............................GGGGGG....ddd.....................",".............................GFFFFFFy...........................","...........................JJJJJJJJJ............................","................JJJJJ...JJJEEEEEJJJJJJJ.........................",".................AAA..JJEEEDDEEJJJJJJJJJk...........AAyAA.......","................ACACAJJEEDDEEJJJJJJJJJJJJk...........mdd........","................AAAAAJEEEEJJJJJJJJJJJJJJJJk..........mdd........","................ACACAEEEJJJJJJJJJJJJJJJJJJJk.........mdd........",".................AAAJEJJJJJJJJJJJJJJJJJJJJJkk........mdd........","..................JJJJJJJJJJJJJJJJJJJJJJJJJJk........mdd........","..................dddddddddddddddddddddddddddd.......mdd........",".................dmymdmymdmymdmymdmymdmymdmymd.......mdd........","..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD........","..........EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.......",".........dJJJJJJJJJJJJJJmdJJJJGGGGGGGGJJJJmdJJAJJJJJJJAJJk......","........dJJJJJJJJJJJJJJJmyJJJJGCCCCCCGJJJJmyJJAGGGGGGGAJJJk.....","......kykJJJJJJJJJJJJJJJmdJJJJGCFCFCFGJJJJmdJJAJJJJJJJAJJJJk....","....wAdJJJJJJJJJJJJJJJJJmdJJJJGCCCCCCGJJJJmdJJAFFFFFFFAJJJJk....","....AyJJJJJJJJJJJJJJJJJJmyJJJJGGGGGGGGJJJJmyJJJJJJJJJJJJJJJk....","....dJJJJmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmJk....","....dJJJJJJJFJFJFJFJFJJJmdJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJk....","....mmmmmmmmmFmFmFmFmFmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm....","....dddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddydddd....","..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..","..FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF..","...FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...","....kdmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmdk....","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmkmk...","...kdmddkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkmdmmk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmmmk...","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","....kddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmk..yd",".....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...dy"],
    hc_tank_escort_3: ["........................................FFF.....................",".......................................FyyyF....................",".......................................FyyyF....................",".......................................FyyyF....................","........................................FFF.....................",".........................................d......................","..............................GGGGGG....ddd.....................",".............................GFFFFFFy...........................","...........................JJJJJJJJJ............................","................JJJJJ...JJJEEEEEJJJJJJJ.........................",".................AAA..JJEEEDDEEJJJJJJJJJk...........AAyAA.......","................ACyCAJJEEDDEEJJJJJJJJJJJJk...........mdd........","................AyyyAJEEEEJJJJJJJJJJJJJJJJk..........mdd........","................ACyCAEEEJJJJJJJJJJJJJJJJJJJk.........mdd........",".................AAAJEJJJJJJJJJJJJJJJJJJJJJkk........mdd........","..................JJJJJJJJJJJJJJJJJJJJJJJJJJk........mdd........","..................dddddddddddddddddddddddddddd.......mdd........",".................dmymdmymdmymdmymdmymdmymdmymd.......mdd........","..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD........","..........EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.......",".........dJJJJJJJJJJJJJJmdJJJJGGGGGGGGJJJJmdJJAJJJJJJJAJJk......","........dJJJJJJJJJJJJJJJmyJJJJGCCCCCCGJJJJmyJJAGGGGGGGAJJJk.....","......kykJJJJJJJJJJJJJJJmdJJJJGCFCFCFGJJJJmdJJAJJJJJJJAJJJJk....","....wAdJJJJJJJJJJJJJJJJJmdJJJJGCCCCCCGJJJJmdJJAFFFFFFFAJJJJk....","....AyJJJJJJJJJJJJJJJJJJmyJJJJGGGGGGGGJJJJmyJJJJJJJJJJJJJJJk....","....dJJJJmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmJk....","....dJJJJJJJFJFJFJFJFJJJmdJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJk....","....mmmmmmmmmFmFmFmFmFmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm....","....dddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddydddd....","..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..","..FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF..","...FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...","....kdmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmdk....","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmkmk...","...kdmddkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkmdmmk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmmmk...","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","....kddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmk..yd",".....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...dy"],
    hc_tank_command_0: ["........................................FFF....y................",".......................................FywyF...FJJJJJJJy........","......................................yFywyFy..FyJJJJJJJy.......",".......................................FyyyF...FJJJJJ.Jy........","........................................FFF....Fy..y............",".........................................d.....F................","..............................GGGGGG....ddd....F................",".............................GFFFFFFy..........F................","...........................JJJJJJJJJ...........F................","................JJJJJ...JJJEEEEEJJJJJJJ.........................",".................AAA..JJEEEDDEEJJJJJJJJJk...........AAyAA.......","................ACyCAJJEEDDEEJJJJJJJJJJJJk...........mdd........","................yywyyJEEEEJJJJJJJJJJJJJJJJk..........mdd........","................ACyCAEEEJJJJJJJJJJJJJJJJJJJk.........mdd........",".................AAAJEJJJJJJJJJJJJJJJJJJJJJkk........mdd........","..................JJJJJJJJJJJJJJJJJJJJJJJJJJk........mdd........","..................dddddddddddddddddddddddddddd.......mdd........",".................dmymdmymdmymdmymdmymdmymdmymd.......mdd........","..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD........","..........EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.......",".........dJJJJJJJJJJJJJJmdJJJJyyyyyyyyJJJJmdJJAJJJJJJJAJJk......","........dJJJJJJJJJJJJJJJmyJJJJyCCwyCCyJJJJmyJJAGGGGGGGAJJJk.....","......kykJJJJJJJJJJJJJJJmdJJJJyCCyyCCyJJJJmdJJAJJJJJJJAJJJJk....","....wAdJJJJJJJJJJJJJJJJJmdJJJJyAAAAAAyJJJJmdJJAFFFFFFFAJJJJk....","....AyJJJJJJJJJJJJJJJJJJmyJJJJyyyyyyyyJJJJmyJJJJJJJJJJJJJJJk....","....dJJJJyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyJk....","....dJJJJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJk....","....mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm....","....dddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddydddd....","..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..","..FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF..","...FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...","....kdmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmdk....","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmkmk...","...kdmddkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkmdmmk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmmmk...","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","....kddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmk..yd",".....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...dy"],
    hc_tank_command_1: ["........................................FFF....y................",".......................................FyyyF...FJJJJJJJJy.......",".......................................FyyyF...FyJJJJJJJy.......",".......................................FyyyF...FJJJJJ.JJ........","........................................FFF....Fy.....y.........",".........................................d.....F................","..............................GGGGGG....ddd....F................",".............................GFFFFFFy..........F................","...........................JJJJJJJJJ...........F................","................JJJJJ...JJJEEEEEJJJJJJJ.........................",".................AAA..JJEEEDDEEJJJJJJJJJk...........AAyAA.......","................ACyCAJJEEDDEEJJJJJJJJJJJJk...........mdd........","................yyyyyJEEEEJJJJJJJJJJJJJJJJk..........mdd........","................ACyCAEEEJJJJJJJJJJJJJJJJJJJk.........mdd........",".................AAAJEJJJJJJJJJJJJJJJJJJJJJkk........mdd........","..................JJJJJJJJJJJJJJJJJJJJJJJJJJk........mdd........","..................dddddddddddddddddddddddddddd.......mdd........",".................dmymdmymdmymdmymdmymdmymdmymd.......mdd........","..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD........","..........EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.......",".........dJJJJJJJJJJJJJJmdJJJJyyyyyyyyJJJJmdJJAJJJJJJJAJJk......","........dJJJJJJJJJJJJJJJmyJJJJyCCwyCCyJJJJmyJJAGGGGGGGAJJJk.....","......kykJJJJJJJJJJJJJJJmdJJJJyCCyyCCyJJJJmdJJAJJJJJJJAJJJJk....","....wAdJJJJJJJJJJJJJJJJJmdJJJJyAAAAAAyJJJJmdJJAFFFFFFFAJJJJk....","....AyJJJJJJJJJJJJJJJJJJmyJJJJyyyyyyyyJJJJmyJJJJJJJJJJJJJJJk....","....dJJJJyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyJk....","....dJJJJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJk....","....mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm....","....dddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddydddd....","..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..","..FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF..","...FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...","....kdmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmdk....","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmkmk...","...kdmddkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkmdmmk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmmmk...","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","....kddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmk..yd",".....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...dy"],
    hc_tank_command_2: ["........................................FFF....y................",".......................................FGAGF...FJJJJJJy.........",".......................................FGAGF...FyJJJJJJy........",".......................................FGGGF...FJJJJ.Jy.........","........................................FFF....Fy..y............",".........................................d.....F................","..............................GGGGGG....ddd....F................",".............................GFFFFFFy..........F................","...........................JJJJJJJJJ...........F................","................JJJJJ...JJJEEEEEJJJJJJJ.........................",".................AAA..JJEEEDDEEJJJJJJJJJk...........AAyAA.......","................ACACAJJEEDDEEJJJJJJJJJJJJk...........mdd........","................yAAAyJEEEEJJJJJJJJJJJJJJJJk..........mdd........","................ACACAEEEJJJJJJJJJJJJJJJJJJJk.........mdd........",".................AAAJEJJJJJJJJJJJJJJJJJJJJJkk........mdd........","..................JJJJJJJJJJJJJJJJJJJJJJJJJJk........mdd........","..................dddddddddddddddddddddddddddd.......mdd........",".................dmymdmymdmymdmymdmymdmymdmymd.......mdd........","..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD........","..........EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.......",".........dJJJJJJJJJJJJJJmdJJJJyyyyyyyyJJJJmdJJAJJJJJJJAJJk......","........dJJJJJJJJJJJJJJJmyJJJJyCCwyCCyJJJJmyJJAGGGGGGGAJJJk.....","......kykJJJJJJJJJJJJJJJmdJJJJyCCyyCCyJJJJmdJJAJJJJJJJAJJJJk....","....wAdJJJJJJJJJJJJJJJJJmdJJJJyAAAAAAyJJJJmdJJAFFFFFFFAJJJJk....","....AyJJJJJJJJJJJJJJJJJJmyJJJJyyyyyyyyJJJJmyJJJJJJJJJJJJJJJk....","....dJJJJyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyJk....","....dJJJJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJk....","....mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm....","....dddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddydddd....","..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..","..FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF..","...FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...","....kdmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmdk....","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmkmk...","...kdmddkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkmdmmk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmmmk...","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","....kddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmk..yd",".....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...dy"],
    hc_tank_command_3: ["........................................FFF....y................",".......................................FyyyF...FJJJJJJJJy.......",".......................................FyyyF...FyJJJJJJJy.......",".......................................FyyyF...FJJJJJ.JJ........","........................................FFF....Fy.....y.........",".........................................d.....F................","..............................GGGGGG....ddd....F................",".............................GFFFFFFy..........F................","...........................JJJJJJJJJ...........F................","................JJJJJ...JJJEEEEEJJJJJJJ.........................",".................AAA..JJEEEDDEEJJJJJJJJJk...........AAyAA.......","................ACyCAJJEEDDEEJJJJJJJJJJJJk...........mdd........","................yyyyyJEEEEJJJJJJJJJJJJJJJJk..........mdd........","................ACyCAEEEJJJJJJJJJJJJJJJJJJJk.........mdd........",".................AAAJEJJJJJJJJJJJJJJJJJJJJJkk........mdd........","..................JJJJJJJJJJJJJJJJJJJJJJJJJJk........mdd........","..................dddddddddddddddddddddddddddd.......mdd........",".................dmymdmymdmymdmymdmymdmymdmymd.......mdd........","..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD........","..........EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.......",".........dJJJJJJJJJJJJJJmdJJJJyyyyyyyyJJJJmdJJAJJJJJJJAJJk......","........dJJJJJJJJJJJJJJJmyJJJJyCCwyCCyJJJJmyJJAGGGGGGGAJJJk.....","......kykJJJJJJJJJJJJJJJmdJJJJyCCyyCCyJJJJmdJJAJJJJJJJAJJJJk....","....wAdJJJJJJJJJJJJJJJJJmdJJJJyAAAAAAyJJJJmdJJAFFFFFFFAJJJJk....","....AyJJJJJJJJJJJJJJJJJJmyJJJJyyyyyyyyJJJJmyJJJJJJJJJJJJJJJk....","....dJJJJyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyJk....","....dJJJJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJJmdJJJJJJJJJJJJJJJk....","....mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm....","....dddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddyddydddd....","..AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..","..FGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGF..","...FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...","....kdmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmdk....","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmkmk...","...kdmddkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkkmymmkkkkmdmmk...","...kddddkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkkmmmmkkkkmmmmk...","...kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...","....kddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmddmk..yd",".....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk...dy"],
  },
};
// Every key HC_CITY_ART adds (TILES or WART), with its §10 row. game.js reads this for the debug list and the PR body.
const HC_PLACEHOLDER_ART = {
  C: "A01 carriageway",
  Z: "A02 crosswalk",
  U: "A03 kerb bay",
  M: "A04 median",
  door_chained: "A93 chained door, empty lantern hook",
  roof_muster: "A92 Muster Hall roof",
  wall_muster: "A92 Muster Hall wall",
  hc_lamp_box: "A32+A33 lamp post with grey box",
  hc_finial: "A34 roof lantern finial",
  hc_lantern_wall_0: "A05 lantern wall, frame 0",
  hc_lantern_wall_1: "A05 lantern wall, frame 1",
  hc_hold_spike: "A67 HOLD spike",
  hc_wait_tray: "A70 waiting tray",
  hc_permit_tray: "A73 permit tray",
  hc_lampstock_stamp: "A74 LAMP STOCK stamp",
  hc_teacups: "A75 two teacups",
  hc_bright_card: "A76 bright-day card",
  hc_desk_plate: "A79 desk plate",
  hc_lectern: "A64 lectern",
  hc_camera_cloth: "A65 camera under a cloth",
  hc_wire_printer_0: "A66 wire printer, frame 0",
  hc_wire_printer_1: "A66 wire printer, frame 1",
  hc_roll_ledger: "A72 roll ledger in a glass case",
  hc_lantern_pin: "A78 lantern pin on a stand",
  hc_chute_top: "A71 orders chute, top",
  hc_chute_mouth: "A71 orders chute, mouth",
  hc_stamp_table: "A69 stamp table",
  hc_thanks_letters: "A77 thank-you letters",
  hc_car_b: "A25 runabout, blue",
  hc_car_r: "A25 runabout, red",
  hc_car_t: "A25 runabout, teal",
  hc_car_y: "A25 runabout, yellow",
  hc_car_w: "A25 runabout, white",
  hc_kindness_board: "A35 Kindness Board",
  hc_mural: "A36 Lantern Muster mural",
  hc_motto_board: "A68 motto board",
  hc_gate_arch: "A22 district gate arch",
  hc_court_steps_w: "A14 Keeper High Court wide steps, west end (v0.3)",
  hc_court_steps: "A14 Keeper High Court wide steps (v0.3)",
  hc_court_steps_e: "A14 Keeper High Court wide steps, east end (v0.3)",
  hc_tank_escort_0: "A24 Keeper tank, escort, frame 0",
  hc_tank_escort_1: "A24 Keeper tank, escort, frame 1",
  hc_tank_escort_2: "A24 Keeper tank, escort, frame 2",
  hc_tank_escort_3: "A24 Keeper tank, escort, frame 3",
  hc_tank_command_0: "A24 Keeper tank, command, frame 0",
  hc_tank_command_1: "A24 Keeper tank, command, frame 1",
  hc_tank_command_2: "A24 Keeper tank, command, frame 2",
  hc_tank_command_3: "A24 Keeper tank, command, frame 3",
  hc_lantern_wall: "A05 lantern wall (2 frames, 700 ms)",
  hc_wire_printer: "A66 wire printer (2 frames, 300 ms)",
  hc_tank_escort: "A24 Keeper tank, escort (4 frames, 350 ms)",
  hc_tank_command: "A24 Keeper tank, command (4 frames, 350 ms)",
};
// WEIR_HUT (D1591, D1599): the weir hut at Hushwater's Old Weir, room hw_weir_hut_in and its porch on hw_cut. The 27 grids
// as Vincent approved them in the previews (Nov 3, 2026), 16x16, PAL keys only, '.' clear. Each entry is a list of frames;
// two frames loop (the lamp shelf's pulse, the trough's water), and reduced motion holds frame 0. Tiles go to TILES, props to WART.
const WEIR_HUT_ART = {
  tiles: {
    weir_flag: [["IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIICIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIICIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIICIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIICIIIIIIIIII", "IIIIIIIIIIIIIIII"]],
    weir_flag_b: [["IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIGGGGIIIIIIII", "IIIIIIIGIIIIIIII", "IIIIIIIGIIIICIII", "IIIIIIIGGGGIIIII", "IIIIIIIIIIIIIIII", "IICIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII"]],
    weir_flag_c: [["IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIDDIIIIIII", "IIIIIDDDDDIIIIII", "IIIIDDDIDDDIIIII", "IIIIIDDDDDIIICII", "IIIIIIDDIIIIIIII", "IIIIIIIIIIIIIIII", "IICIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIICIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII"]],
    weir_trough: [["hhhhhhhhhhhhhhhh", "mmmmmmmmmmmmmmmm", "dddddddddddddddd", "nnbbbbbbbbbbbbnn", "bbbbbcbbbbbbbbbb", "bbbbccsbbbbbbbbb", "bbbbbbbbbbbcbbbb", "bbbbbbbbbbccsbbb", "bcbbbbbbbbbbbbbb", "ccsbbbbbbbbbbbbb", "bbbbbbbcbbbbbbbb", "bbbbbbccsbbbbbbb", "bbbbbbbbbbbbbbbb", "nnnnnnnnnnnnnnnn", "mmmmmmmmmmmmmmmm", "hhhhhhhhhhhhhhhh"], ["hhhhhhhhhhhhhhhh", "mmmmmmmmmmmmmmmm", "dddddddddddddddd", "nnbbbbbbbbbbbbnn", "bbbbbbbbbbbbbbbb", "bbbbbbcbbbbbbbbb", "bbbbbccsbbbbbcbb", "bbbbbbbbbbbbccsb", "bbbbbbbbbbbbbbbb", "bbcbbbbbbbbbbbbb", "bccsbbbbbbbbbbbb", "bbbbbbbbcbbbbbbb", "bbbbbbbccsbbbbbb", "nnnnnnnnnnnnnnnn", "mmmmmmmmmmmmmmmm", "hhhhhhhhhhhhhhhh"]],
    weir_plank: [["hhhhhhhhhhhhhhhh", "FGGGGGGFFGGGGGGF", "FGBGGGGFFGGGBGGF", "FGGGGGGFFGGGGGGF", "FGGGGBGFFGGGGGGF", "FGGGGGGFFGBGGGGF", "FGGGGGGFFGGGGGGF", "FGBGGGGFFGGGGGGF", "FGGGGGGFFGGGGBGF", "FGGGGGGFFGGGGGGF", "FGGGGBGFFGGGGGGF", "FGGGGGGFFGGGGGGF", "FGGGGGGFFGBGGGGF", "FGGGGGGFFGGGGGGF", "FFFFFFFFFFFFFFFF", "hhhhhhhhhhhhhhhh"]],
    rug_sacking: [["AAAAAAAAAAAAAAAA", "AAAAAAAAAACAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAGAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAGAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AACAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAGAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAACAAA", "AAAAAAAAAAAAAAAA"]],
    mat_sacking: [["FFFFFFFFFFFFFFFF", "FAAAAAAAAAAAAAAF", "FACCAACCAACCAACF", "FAAAAAAAAAAAAAAF", "FAFFFFFFFFFFFFAF", "FAAAAAAAAAAAAAAF", "FACCAACCAACCAACF", "FAAAAAAAAAAAAAAF", "FACCAACCAACCAACF", "FAAAAAAAAAAAAAAF", "FAFFFFFFFFFFFFAF", "FAAAAAAAAAAAAAAF", "FACCAACCAACCAACF", "FAAAAAAAAAAAAAAF", "FAAAAAAAAAAAAAAF", "FFFFFFFFFFFFFFFF"]],
  },
  props: {
    weir_case_board_l: [["................", "FFFFFFFFFFFFFFFF", "FGGGGGGGGGGGGGGG", "FGAAAAAAAAAAAAAA", "FGACCCCCAAArAAAA", "FGACmmmCAAAArAAA", "FGACmCmCAAAAArAA", "FGACCCCCrAAAAArA", "FGAAAAAAArAAAAAr", "FGAAwwwwAArAAAAA", "FGAAwgDwAAArrrrr", "FGAAwDgwrAAAAAAA", "FGAAwwwwArrAAAAA", "FGAAAAAAAAAAAAAA", "FFFFFFFFFFFFFFFF", ".FF............."]],
    weir_case_board_r: [["................", "FFFFFFFFFFFFFFFF", "GGGGGGGGGGGGGGGF", "AAAAAAAAAAAAAAGF", "AAAACCCCCAAAAAGF", "AAAArCmmCAAAAAGF", "AAArACmCCAwwwwGF", "AArAACCCCAwgDwGF", "ArAAAAAAAAwDgwGF", "rAAAAAAAAAwwwwGF", "AAAAACCCCAAArAGF", "rrrrrrCmCrrrAAGF", "AAAAACCCCAAAAAGF", "AAAAAAAAAAAAAAGF", "FFFFFFFFFFFFFFFF", ".............FF."]],
    weir_desk_l: [["................", "................", "................", "................", "................", "....CCCC........", "...CwwwwC.......", "GGGCwmmwCGGGGGGG", "GGGCwwwwCGGGGyGG", "FFFFFFFFFFFFFFFF", "FdFFFFFFFFFFFFFF", "Fd..............", "Fd..............", "Fd..............", "Fd..............", "dd.............."]],
    weir_desk_r: [["................", "................", "................", "................", "................", "..CCCCC.....B...", "..CmmmC....BBB..", "GGCCCCCGGGGBBBGG", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFdF", "..............dF", "..............dF", "..............dF", "..............dF", "..............dd"]],
    weir_jars_0: [["................", "................", "................", "..FF...FF...FF..", ".hhhh.hhhh.hhhh.", ".hmmh.hmmh.hmmh.", ".hwmh.hwmh.hwmh.", ".hmmh.hmmh.hmmh.", ".hmmh.hmmh.hmmh.", ".hmmh.hmmh.hmmh.", ".hmmh.hmmh.hmmh.", ".hhhh.hhhh.hhhh.", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", ".F............F.", "................"]],
    weir_jars_1: [["................", "................", "................", "..FF...FF...FF..", ".hhhh.hhhh.hhhh.", ".hmmh.hmmh.hmmh.", ".hmlh.hwmh.hwmh.", ".hlgh.hmmh.hmmh.", ".hglh.hmmh.hmmh.", ".hgmh.hmmh.hmmh.", ".hgmh.hmmh.hmmh.", ".hhhh.hhhh.hhhh.", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", ".F............F.", "................"]],
    weir_jars_2: [["................", "................", "................", "..FF...FF...FF..", ".hhhh.hhhh.hhhh.", ".hmmh.hmwh.hmmh.", ".hmlh.hwCh.hwmh.", ".hlgh.hwCh.hmmh.", ".hglh.hwmh.hmmh.", ".hgmh.hCmh.hmmh.", ".hgmh.hmmh.hmmh.", ".hhhh.hhhh.hhhh.", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", ".F............F.", "................"]],
    weir_jars_3: [["................", "................", "................", "..FF...FF...FF..", ".hhhh.hhhh.hhhh.", ".hmmh.hmwh.hmmh.", ".hmlh.hwCh.hmlh.", ".hlgh.hwCh.hlgh.", ".hglh.hwmh.hglh.", ".hgmh.hCmh.hgmh.", ".hgmh.hmmh.hgmh.", ".hhhh.hhhh.hhhh.", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", ".F............F.", "................"]],
    weir_lamp_shelf: [["................", "................", "..AA....AA...AA.", ".CCAA..CCAA.CCAA", ".CyCA..CyCA.CyCA", ".CCCA..CCCA.CCCA", "..d.....d....d..", "..dw....dw...dw.", "...w.....w....w.", "................", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", ".F............F.", ".F............F.", ".F............F.", ".FF..........FF."], ["................", "................", "..AA....AA...AA.", ".CCAA..CCAA.CCAA", ".CoCA..CoCA.CoCA", ".CCCA..CCCA.CCCA", "..d.....d....d..", "..dw....dw...dw.", "...w.....w....w.", "................", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", ".F............F.", ".F............F.", ".F............F.", ".FF..........FF."]],
    weir_keeper_lantern: [["................", "......FF........", ".....F..F.......", ".....CCCC.......", "....CIICCC......", "....CIIIICC.....", "...CIIIIIIC.....", "...CIICIIIIC....", "...CIIIIIIIC....", "....GyyyyG......", "....GGGGGG......", "FFFFFFFFFFFFFF..", "FBBBBBBBBBBBBF..", "FBFFFFFFFFFFBF..", "FBBBBBBBBBBBBF..", "FFFFFFFFFFFFFF.."]],
    weir_cot_head: [["................", "................", "................", "FFFFFFFFFFFFFFFF", "FIIIIIIIIIIIIIIF", "FICCCCCCCCCCCCIF", "FICwCCCCCCCCCCIF", "FICCCCCCCCCCCCIF", "FIIIIIIIIIIIIIIF", "FIIIIIIIIIIIIIIF", "FIIIIIIIIIIIIIIF", "FIIIIIIIIIIIIIIF", "FIIIIIIIIIIIIIIF", "FIIIIIIIIIIIIIIF", "FIIIIIIIIIIIIIIF", "FIIIIIIIIIIIIIIF"]],
    weir_cot_foot: [["FIIIIIIIIIIIIIIF", "FIIIIIIIIIIIIIIF", "FKKKKKKKKKKKKKKF", "FKmmmmmmmmmmmmKF", "FKKKKKKKKKKKKKKF", "FIIIIIIIIIIIIIIF", "FIIIIIIIIIIIIIIF", "FFFFFFFFFFFFFFFF", "Fd............dF", "Fd............dF", "dd............dd", "................", "................", "................", "................", "................"]],
    weir_stove: [["................", "........hh......", ".......hmmh.h...", "......hmmmmhh...", "......hhhhhh....", "..dddddddddddd..", "..dmmmmmmmmmmd..", "..dmddddddddmd..", "..dmdoooooodmd..", "..dmdyoyoyodmd..", "..dmddddddddmd..", "..dmmmmmmmmmmd..", "..dddddddddddd..", "..d..........d..", "..dd........dd..", "................"]],
    weir_easel: [["................", ".......FF.......", "..FFFFFFFFFFFF..", "..FCCCCCCCCCCF..", "..FCmmCCCCgCCF..", "..FCmCmCCgggCF..", "..FCCCmmCCgCCF..", "..FCCCCCCCmCCF..", "..FCmmmmmCCCCF..", "..FCCCCCCCCCCF..", "..FFFFFFFFFFFF..", "...F...FF...F...", "...F...FF...F...", "..F....FF....F..", "..F....FF....F..", ".FF...FFFF...FF."]],
    weir_files: [["................", "................", "................", "................", "...CwCwCCwCw....", "..wCCwCCwCCwC...", "..CwCCwCCwCCw...", "FFFFFFFFFFFFFFF.", "FBBBBBBBBBBBBBF.", "FBrBBBBBBBBBrBF.", "FBBBBBBBBBBBBBF.", "FFFFFFFFFFFFFFF.", "FBBBBBBBBBBBBBF.", "FBBBBBBBBBBBBBF.", "FFFFFFFFFFFFFFF.", "................"]],
    weir_doorpost: [["......FGGF......", "......FGGF..r...", "......FwwFr.r...", "......FGGF..r...", "......FGGF..r...", "......FwGF..r...", "......FGGF.GGG..", "......FGGF.GyG..", "......FwwF.GGG..", "......FGGF..y...", "......FGGF......", "......FwGF......", "......FGGF......", "......FGGF......", "......FwwF......", ".....FFFFFF....."]],
    weir_sluice: [["................", "......dddd......", "......dmmd......", ".......dd.......", ".....FFFFFF.....", ".....FGGGGF.....", ".....FGBGGF.....", ".....FGGGGF.....", ".....FGGBGF.....", ".....FGGGGF.....", ".....FGGGGF.....", "....sFGBGGFs....", "...cbFGGGGFbc...", "..cbbFFFFFFbbc..", "...sbbbbbbbbs...", "................"]],
    weir_boots: [["................", "................", "................", "................", "...dd.....dd....", "...dFd....dFd...", "...dFd....dFd...", "...dFd....dFd...", "...dFFd...dFFd..", "..ddFFFd.ddFFFd.", "..ddddddddddddd.", "..AACAACAACAACA.", "..CAACAACAAcsAA.", "..AACAACAACcAAA.", "................", "................"]],
    weir_net_crate: [["................", "................", "................", "................", "..hmhmhmhmhmh...", ".hFhFhFhFhFhFh..", ".mBmBmBmBmBmBm..", ".hFhFhFhFhFhFh..", ".mBmBmBmBmBmBm..", ".hFhFhFhFhFhFh..", "FFFFFFFFFFFFFFF.", "FBBBBBBFBBBBBBF.", "FBFFFFBFBFFFFBF.", "FBBBBBBFBBBBBBF.", "FFFFFFFFFFFFFFF.", "................"]],
    weir_oil_lamp: [["................", "................", "......dddd......", ".......dd.......", "......dmmd......", ".....dwyywd.....", ".....dyooyyd....", ".....dyoyyd.....", ".....dwyywd.....", "......dmmd......", ".....dddddd.....", "................", "...hhhhhhhhhh...", "..hmmmmmmmmmmh..", "..mmmmmmmmmmmm..", "................"]],
  },
};
// PROP_LIBRARY v0.1 (design specs/prop_library.json, verbatim). Art only: no map places these yet.
// Each entry: set, cells [w, h] in tiles, walk, place (floor | wall | decal | tile | water | roof | facade), rows of PAL keys.
// addExteriorArt registers <id> (whole art) and, for a multi-cell prop, <id>_0..n 16x16 slices (left to right, top to bottom).
const PROP_LIBRARY_ART = {
  "ph_bed_quilt":{"set":"home","cells":[1,2],"walk":false,"place":"floor","rows":["................",".dd..........dd.","dGFddddddddddGFd","dFFAAAAAAAAAAFFd","dFFAGGGGGGGGGFFd","dFFAGGGGGGGGGFFd","dFFAGGGGGGGGGFFd","dFFFFFFFFFFFFFFd","dFFwwwwwwwwwwFFd","dFFwwwwhhwwwwFFd",".ddwwwwwwwwwwdd.","..dhhhhhhhhhhd..",".dwwwwwwwwwwwwd.",".dhhhhhhhhhhhhd.",".drrrrrrrrrrrpd.",".droorrrroorrpd.",".droyrrrroyrrpd.",".drrrrrrrrrrrpd.",".drrrrrrrrrrrpd.",".drrrroorrrropd.",".drrrroyrrrropd.",".drrrrrrrrrrrpd.",".drrrrrrrrrrrpd.",".droorrrroorrpd.",".droyrrrroyrrpd.",".drrrrrrrrrrrpd.",".drrrrrrrrrrrpd.",".dppppppppppppd.","dGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFd",".dddddddddddddd.","................"]},
  "ph_bed_double":{"set":"home","cells":[2,2],"walk":false,"place":"floor","rows":[".dd..........................dd.","dGFddddddddddddddddddddddddddGFd","dFFAAAAAAAAAAAAAAAAAAAAAAAAAAFFd","dFFAGGGGGGGGGGGGGGGGGGGGGGGGGFFd","dFFAGGGGGGGGGGGGGGGGGGGGGGGGGFFd","dFFAGGGGGGGGGGGGGGGGGGGGGGGGGFFd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dFFdwwwwwwwwwwwddwwwwwwwwwwwdFFd","dFFdwwwwwwwwwwwddwwwwwwwwwwwdFFd","dFFdwwwwwwwwwwwddwwwwwwwwwwwdFFd",".dddwwwwwwwwwwwddwwwwwwwwwwwddd.","..ddhhhhhhhhhhhddhhhhhhhhhhhdd..",".dCCCCCCCCCCCCCCCCCCCCCCCCCCCCd.",".dCCCCCCCCCCCCCCCCCCCCCCCCCCCCd.",".dIIIIIIIIIIIIIIIIIIIIIIIIIIIId.",".dbbbbbbbbbbbbbbbbbbbbbbbbbbbnd.",".dbccbbbbccbbbbccbbbbccbbbbccnd.",".dbcsbbbbcsbbbbcsbbbbcsbbbbcsnd.",".dbbbbbbbbbbbbbbbbbbbbbbbbbbbnd.",".dbbbbbbbbbbbbbbbbbbbbbbbbbbbnd.",".dbbbbccbbbbccbbbbccbbbbccbbbnd.",".dbbbbcsbbbbcsbbbbcsbbbbcsbbbnd.",".dbbbbbbbbbbbbbbbbbbbbbbbbbbbnd.",".dbbbbbbbbbbbbbbbbbbbbbbbbbbbnd.",".dbccbbbbccbbbbccbbbbccbbbbccnd.",".dbcsbbbbcsbbbbcsbbbbcsbbbbcsnd.",".dbbbbbbbbbbbbbbbbbbbbbbbbbbbnd.",".dnnnnnnnnnnnnnnnnnnnnnnnnnnnnd.","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dddddddddddddddddddddddddddddd.","................................"]},
  "ph_side_table":{"set":"home","cells":[1,1],"walk":false,"place":"floor","rows":["......d.........",".....dod........",".....dyd........",".....dwhd.......",".....dwhdddd....","...dddwhdhhhd...","..dAAAwhAAAAAd..","..dAGGGGGGGGGd..","..dAGGGGGGGGGd..","..dFFFFFFFFFFd..","..dFFBBBBBBFFd..","..dFFFFyyFFFFd..","..dFFFFFFFFFFd..","..dFFddddddFFd..","..dFFd....dFFd..","...dd......dd..."]},
  "ph_rag_rug":{"set":"home","cells":[2,1],"walk":true,"place":"decal","rows":["................................","..........FFFFFFFFFFFF..........","......FFFFBBBBBBBBBBBBFFFF......","....FFBBBBBooooooooooBBBBBFF....","...FBBBoooooyyyyyyyyoooooBBBF...","..FBBBoooyyyyyrrrryyyyyoooBBBF..",".FBBBooyyyrrrrrrrrrrrryyyooBBBF.",".FBBoooCyrrroCoooooCrrryyCooBBF.",".FBBCooyyrCrooooCooorrCyyoooBBF.",".FBBBooyyyrrrrrrrrrrrryyyooBBBF.","..FBBBoooyyyyyrrrryyyyyoooBBBF..","...FBBBoooooyyyyyyyyoooooBBBF...","....FFBBBBBooooooooooBBBBBFF....","......FFFFBBBBBBBBBBBBFFFF......","..........FFFFFFFFFFFF..........","................................"]},
  "ph_dining_table":{"set":"home","cells":[2,1],"walk":false,"place":"floor","rows":["................................",".dddddddddddddddddddddddddddddd.","dAAAAAAAAAAAAAcccAAAAAAAAAAAAAAd","dAGGGGGGGGGBGGbbbbGGGBGGGGGGGGGd","dAGGGGGGGGGBGGbbbGGGgBGGGGGGGGGd","dAGGwwwwwGGBGGbbbGGGrBGwwwwwGGGd","dAGwwhhhwwGBGGbbbGGrGrwwhhhwwGGd","dAGGwwwwwGGBGGGGGGGGGBGwwwwwGGGd","dAGGGGGGGGGBGGGGGGGGGBGGGGGGGGGd","dAGGGGGGGGGBGGGGGGGGGBGGGGGGGGGd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dFFddddddddddddddddddddddddFFd.",".dFFd......................dFFd.",".dFFd......................dFFd.","..dd........................dd.."]},
  "ph_chair":{"set":"home","cells":[1,1],"walk":false,"place":"floor","rows":["....dddddddd....","...dAAAAAAAAd...","...dAGFGGFGGd...","...dAGFGGFGGd...","...dAGFGGFGGd...","...dAGFGGFGGd...","...dAGFGGFGGd...","...dAGGGGGGGd...","...dCCCCCCCCd...","...dCAAAAAAAd...","...dCAAAAAAAd...","...dFFFFFFFFd...","...dFddddddFd...","...dFd....dFd...","...dFd....dFd...","....d......d...."]},
  "ph_chair_up":{"set":"home","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","....d......d....","...dFd....dFd...","...dFddddddFd...","...dCCCCCCCCd...","...dCAAAAAAAd...","...dCAAAAAAAd...","...dAAAAAAAAd...","...dAGFGGFGGd...","...dAGFGGFGGd...","...dAGFGGFGGd...","...dAGFGGFGGd...","...dFFFFFFFFd...","....dddddddd....","................"]},
  "ph_dresser":{"set":"home","cells":[1,1],"walk":false,"place":"floor","rows":[".........dod....","........drdyd...",".........dcbd...",".........dbbd...","..ddddddddbbdd..",".dCCCCCCCCCCCCd.",".dCAAAAAAAAAAAd.",".dGGGGGGGGGGGFd.",".dGGGGGyyGGGGFd.",".dFFFFFFFFFFFFd.",".dGGGGGyyGGGGFd.",".dFFFFFFFFFFFFd.",".dGGGGGyyGGGGFd.",".dGGGGGGGGGGGFd.",".dFFddddddddFFd.","..dd........dd.."]},
  "ph_stove":{"set":"home","cells":[1,1],"walk":false,"place":"floor","rows":[".....d...dhmd...","...ddmdd.dhmd...","..dwwwwwddhmd...","..dhhhhhhdhmd...","..dhhhhhddhmdd..",".dhhhhhhhhhhhhd.",".dhmmmmmmmmmmmd.",".dhmmmmmmmmmmmd.",".dmmmmmmmmmmmmd.","..ddrrrrrrrrdd..","..ddrooyooordd..","..ddroooyoordd..","..dddddddddddd..",".dFFd......dFFd.",".dFFd......dFFd.","..dd........dd.."]},
  "ph_dish_dresser":{"set":"home","cells":[1,2],"walk":false,"place":"floor","rows":["..dddddddddddd..",".dGGGGGGGGGGGGd.",".dFFFwFFwFFwFFd.",".dFFwwwwwwwwwFd.",".dFFwbwwcwwbwFd.",".dFFwwwwwwwwwFd.",".dFFwwwwwwwwwFd.",".dFGGGGGGGGGGFd.",".dFFFwFFwFFwFFd.",".dFFwwwwwwwwwFd.",".dFFwbwwcwwbwFd.",".dFFwwwwwwwwwFd.",".dFFwwwwwwwwwFd.",".dFGGGGGGGGGGFd.",".dFFFFFFFFFFFFd.","dCCCCCCCCCCCCCCd","dCAAAAAAAAAAAAAd","dGGGGGGGFGGGGGFd","dGGGGGGGFGGGGGFd","dGGAAAAGFGAAAGFd","dGGAAAAGFGAAAGFd","dGGAAAAGFGAAAGFd","dGGAAAAyFyAAAGFd","dGGAAAAGFGAAAGFd","dGGAAAAGFGAAAGFd","dGGAAAAGFGAAAGFd","dGGGGGGGFGGGGGFd","dGGGGGGGFGGGGGFd","dFFddddddddddFFd",".dd..........dd.","................","................"]},
  "ph_wash_basin":{"set":"home","cells":[1,1],"walk":false,"place":"floor","rows":["...........d....","..........dhdd..","..........dwwwd.",".........dwwwhd.",".....ddddddwwhd.","...ddhhhhhdwwhd.","..dhhccccchwwhd.",".dhhcscccccwwhd.",".dAhhccccchhAAd.",".dAGGhhhhhGGGGd.",".dFFFFFFFFFFFFd.",".dFFFFFFFFFFFFd.",".dFFFFFFFFFFFFd.",".dFFddddddddFFd.",".dFFd......dFFd.","..dd........dd.."]},
  "ph_armchair":{"set":"home","cells":[1,1],"walk":false,"place":"floor","rows":["................","...dddddddddd...","..dCCCCCCCCCCd..","..dCHHHHBHHHHd..","..dCHHHHBHHHHd..","..dCHHHHBHHHHd..",".dHHHHHHBHHHHHd.",".dBBBHHHHHHBBBd.",".dBBBCCCCCCBBBd.",".dBBBCHHHHHBBBd.",".dBBBCHHHHHBBBd.",".dBBBCHHHHHBBBd.",".dFFFFFFFFFFFFd.",".dFFFFFFFFFFFFd.","..dFFddddddFFd..","...dd......dd..."]},
  "ph_pantry_sacks":{"set":"home","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","....dd..........","...dFFd.........","...dFFdd..dd....","..dCBCCIddFFd...",".dCCCCCCIdFFGd..",".dCCCCCCIAAAAGd.",".dCCCCCCAAAAAAGd","dICCCCCCAAAAAAGd",".dCCCCCCAAAAAAGd",".dCCCCCIAAAAAAGd",".dICCCCIGAAAAGGd","..dIIIIIdGGGGGd.",".dwwdIddwdGGGd..","..dd.d..d.ddd..."]},
  "pc_lectern":{"set":"civic","cells":[1,1],"walk":false,"place":"floor","rows":["................","...dddddddddd...","..dAwwwwhwwwAd..","..dAwmmwhmmwGd..","..dAwwwwhwwwGd..","..dAGGGGGGGGGd..","...ddFGFFFFdd...","....dFGFFFFd....","....dFGFFFFd....","....dFGFFFFd....","....dFGFFFFd....","....dFGFFFFd....","...ddFGFFFFdd...","..dGGGGGGGGGGd..","..dGFFFFFFFFFd..","...dddddddddd..."]},
  "pc_pew":{"set":"civic","cells":[2,1],"walk":false,"place":"floor","rows":["................................",".dddddddddddddddddddddddddddddd.","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dGFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dGFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dGFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dddddddddddddddddddddddddddddd.","dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dFFdddddddddddFFdddddddddddFFd.",".dFFd.........dFFd.........dFFd.",".dFFd.........dFFd.........dFFd.",".dFFd.........dFFd.........dFFd.","..dd...........dd...........dd.."]},
  "pc_council_table":{"set":"civic","cells":[3,1],"walk":false,"place":"floor","rows":["................................................",".dddddddddddddddddddddddddddddddddddddddddddddd.","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGoGGGGGGd","dGFFFFFwwwwwFFFFFFFFFFwFFFFFFFFwwwwwwFFFyyFFFFFd","dGFFFFFwhhhwFFFFFFFFFdFFFFFFFFFwwwwwwFFFyyFFFFFd","dbbbbbbwwwwwbbbbbbbbbbbbbbbbbbbwhhhhwbbbyybbbbbd","dnnnnnnwwwwwnnnnnnnnnnnnnnnnnnnwwwwwwnnnnnnnnnnd","dnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnd","dGFyFFFyFFFyFFFyFFFyFFFyFFFyFFFyFFFyFFFyFFFyFFFd","dGFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dGFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dddddddddddddddddddddddddddddddddddddddddddddd.",".dFFd.................dFFd.................dFFd.",".dFFd.................dFFd.................dFFd.","..dd...................dd...................dd.."]},
  "pc_high_chair":{"set":"civic","cells":[1,1],"walk":false,"place":"floor","rows":["....dddddddd....","...dyFFFFFFyd...","...dFbbbbbbFd...","...dFbnnnnnFd...","...dFbnnnnnFd...","...dFbnnnnnFd...","...dFbnnnnnFd...","...dFbnnnnnFd...","...dFFFFFFFFd...","...dbbbbbbbbd...","...dbnnnnnnnd...","...dbnnnnnnnd...","...dFFFFFFFFd...","...dFddddddFd...","...dFd....dFd...","....d......d...."]},
  "pc_rail":{"set":"civic","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","................","dddddddddddddddd","CCCCCCCCCCCCCCCC","CAAAAAAAAAAAAAAA","dGFddGFddGFddGFd","dGFddGFddGFddGFd","dGFddGFddGFddGFd","dGFddGFddGFddGFd","dGFddGFddGFddGFd","dGFddGFddGFddGFd","dGFddGFddGFddGFd","FFFFFFFFFFFFFFFF","dddddddddddddddd","................"]},
  "pc_rail_gate":{"set":"civic","cells":[1,1],"walk":true,"place":"decal","rows":["................",".d............d.","dyd..........dyd","GGFd........dGGF","GGFdd.......dGGF","GGFAGd......dGGF","GGFAGd......dGGF","GGFAGd......dGGF","GGFAGd......dGGF","GGFAGd......dGGF","GGFAGd......dGGF","GGFAGd......dGGF","GGFAGd......dGGF","GGFdd.......dGGF","ddd..........ddd","................"]},
  "pc_records":{"set":"civic","cells":[1,2],"walk":false,"place":"floor","rows":[".dddddddddddddd.","dGGGGGGGGGGGGGGd","dGFFFFFFFFFFFFFd","dGFdddFdddFdddFd","dGFdddFwCCFwCCFd","dGFdddFCCCFCCCFd","dGFdddFdddFdddFd","dGFFFFFFFFFFFFFd","dGFdddFdddFdddFd","dGFwCCFwCCFdddFd","dGFCCCFCCCFrrrFd","dGFdddFdddFrrrFd","dGFFFFFFFFFFFFFd","dGFdddFdddFdddFd","dGFwCCFdddFwCCFd","dGFCCCFdddFCCCFd","dGFdddFdddFdddFd","dGFFFFFFFFFFFFFd","dGFdddFdddFdddFd","dGFdddFwCCFwCCFd","dGFrrrFCCCFCCCFd","dGFrrrFdddFdddFd","dGFFFFFFFFFFFFFd","dGFdddFdddFdddFd","dGFwCCFwCCFdddFd","dGFCCCFCCCFdddFd","dGFdddFdddFdddFd","dGFFFFFFFFFFFFFd","dGFFFFFFFFFFFFFd","dFFddddddddddFFd",".dd..........dd.","................"]},
  "pc_clerk_desk":{"set":"civic","cells":[2,1],"walk":false,"place":"floor","rows":["................................","................................",".dddddddddddddddddddddddddddddd.","dAAAwwwwhwwwwAAwAAAAAAAAAAAAAAAd","dAGGwmmwhwmmwGGGwGGGGGGGGoGGGGGd","dAGGwwwwhwwwwGGGGdGGGGGGyyyGGGGd","dAGGwmmwhwmmwGGGGGGGGGGyyyyyGGGd","dAGGwwwwhwwwwGGGGGGGGGGGyyyGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFBBBBBBBBFFFFFFFFFFFFFFFFFFFFd","dFFBBBByBBBFFFFFFFFFFFFFFFFFFFFd","dFFBBBBBBBBFFFFFFFFFFFFFFFFFFFFd",".dFFddddddddddddddddddddddddFFd.",".dFFd......................dFFd.","..dd........................dd.."]},
  "pc_flag_stand":{"set":"civic","cells":[1,2],"walk":false,"place":"floor","rows":["..dyyd..........","..dhmd..........","..dhmddddddddd..","..dhmnnnnnnnnbd.","..dhmnnnnnnnnbd.","..dhmnnnnnnnnbd.","..dhmnnnnwnnnbd.","..dhmnnwwwwwnbd.","..dhmnnwnnnwnbd.","..dhmnnwnnnwnbd.","..dhmnnwwwwwnbd.","..dhmnnnnwnnnbd.","..dhmnnnnnnnnbd.","..dhmnnnnnnnnbd.","..dhmnnnnnnnnbd.","..dhmndndndndnd.","..dhmd.d.d.d.d..","..dhmd..........","..dhmd..........","..dhmd..........","..dhmd..........","..dhmd..........","..dhmd..........","..dhmd..........","..dhmd..........","..dhmd..........","..dhmd..........",".ddhmdd.........","dGGGGGGd........","dGFFFFFd........",".dddddd.........","................"]},
  "pc_ballot_box":{"set":"civic","cells":[1,1],"walk":false,"place":"floor","rows":["................","........ddd.....",".......dwwhd....","...dddddwwwdd...","..dAAAAAwwwAAd..","..dAGGddddGGGd..","..dFFFFFFFFFFd..","..dFFFFyyFFFFd..","..dFFFFyyFFFFd..","..dFFFFFFFFFFd..","..dFFFFFFFFFFd..","...dGGGGGGGGd...","...dFFddddFFd...","...dFFd..dFFd...","...dFFd..dFFd...","....dd....dd...."]},
  "pc_column":{"set":"civic","cells":[1,2],"walk":false,"place":"floor","rows":["..dddddddddddd..",".dwwwwwwwwwwwwd.",".dwCCCCCCCCCCCd.",".dIIIIIIIIIIIId.","..ddICIIhImIdd..","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","...dICIIhImId...","..ddICIIhImIdd..",".dCCCCCCCCCCCCd.",".dCIIIIIIIIIIId.",".dmmmmmmmmmmmmd.","..dddddddddddd..","................"]},
  "pk_bunk":{"set":"keeper","cells":[1,2],"walk":false,"place":"floor","rows":["................",".dddddddddddddd.","dGGGGGGGGGGGGGGd","dGFFFFFFFFFFFFFd","dGFFFFFFFFFFFFFd","dGFFFFFFFFFFFFFd",".ddwwwwwwwwwwdd.","..dwwwwwwwwwwd..","..dwwwwwwwwwwd..","..dhhhhhhhhhhd..",".dgggggggggggEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dyyyyyyyyyyyEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dEEEEEEEEEEEEd.","dGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFd",".dddddddddddddd.","................"]},
  "pk_map_desk":{"set":"keeper","cells":[2,1],"walk":false,"place":"floor","rows":[".......................dddd.....","......................dJJJJd....",".ddddddddddddddddddddddyyyydddd.","dAACCCCCCCCCCCCCCCIAAAAyooyAAAAd","dAGCCCCCCrCCCCCCCCIGGGGyooyGGGGd","dAGCCJCCCCCJCJCrCCIGGGGyooyGGGGd","dAGCCCCJCJCCCCCJCCIGGGGyyyyGGGGd","dAGCcccCCCCCbCCCCCIGGGGJJJJGGGGd","dAGCCCCCCCCCCCCCCCIGGGGGGGGGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dFFddddddddddddddddddddddddFFd.",".dFFd......................dFFd.","..dd........................dd.."]},
  "pk_lantern_stand":{"set":"keeper","cells":[1,1],"walk":false,"place":"floor","rows":["....dddddddd....","...dJJJJJJJJd...","....dJyyyyJd....","....dJooooJd....","....dJoyooJd....","....dJoowoJd....","....dJooooJd....","....dJyyyyJd....","...dJJJJJJJJd...","....dddgJddd....","......dgJd......","......dgJd......","....dddgJddd....","...dbbbbbbbbd...","...dbnnnnnnnd...","....dddddddd...."]},
  "pk_trunk":{"set":"keeper","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","................","..dddddddddddd..",".dyllnllllnllyd.",".dlggnggggngggd.",".dlggnggggngggd.",".dEEEnEEEEnEEEd.",".dJJJnJyyJnJJJd.",".dJJJnJyyJnJJJd.",".dJJJnJJJJnJJJd.",".dJJJnJJJJnJJJd.",".dJJJnJJJJnJJJd.",".dyJJnJJJJnJJyd.","..dddddddddddd..","................"]},
  "pk_gear_rack":{"set":"keeper","cells":[1,1],"walk":false,"place":"floor","rows":["................",".dddddddddddddd.","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd","dFFdFddddddddFFd","dFFGGGGd.ddddFFd","dFFGGGGddCCCdFFd","dFFAAyAdCCFCCFFd","dFFAAAAdCFFFCFFd","dFFAAAAdCCFCCFFd","dFFAAAAJJJCCdFFd","dFFddddyyydddFFd","dFFd..dyoyd.dFFd","dFFd..dyyyd.dFFd","dFFd...ddd..dFFd",".dd..........dd."]},
  "pk_radio_desk":{"set":"keeper","cells":[1,1],"walk":false,"place":"floor","rows":["...........dyd..","...........dmd..","..ddddddddddmd..",".dggggggggggggd.",".dgJJJJJJJJJJJd.",".dgmdmdJJyJyJJd.",".dgdmdmJJJrJJJd.",".dgJJJJJJJJJJJd.","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFd","dFFFFFFFFFFFFFFd","dFFFFFFFFFFFFFFd","dFFddddddddddFFd","dFFd........dFFd",".dd..........dd."]},
  "pk_boot_bench":{"set":"keeper","cells":[2,1],"walk":false,"place":"floor","rows":["................................","...ddddddddd....................","..dgggggggggd...................",".ddJJJJyJJJJddddddddddddddddddd.","dAAJJJJJJJJJAAAAAAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dFFddddddddddddddddddddddddddFFd","dFFdddd..ddd......ddd..ddd..dFFd","dFFdBFFddBFFd....dBFFddBFFd.dFFd","dFFdFFFddFFFd....dFFFddFFFd.dFFd","dFFdFFFddFFFd....dFFFddFFFd.dFFd","dFFddddd.dddd.....dddd.dddd.dFFd","dFFd........................dFFd",".dd..........................dd."]},
  "pk_supply_crate":{"set":"keeper","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","..dddddddddddd..",".dCCCCCCCCCCCCd.",".dCAAAAAAAAAAAd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.",".dAGGGGJgJJGGFd.",".dAFFFJJgJJFFFd.",".dAGGGGJgJGGGFd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.","..dddddddddddd..","................"]},
  "pk_pennant":{"set":"keeper","cells":[1,1],"walk":false,"place":"wall","rows":["..dddddddddddd..",".dyFFFFFFFFFFyd.","..ddyJJJJJJydd..","...dyJJJJJJyd...","...dyJJlgJJyd...","...dyJggggJyd...","...dyJJggJJyd...","...dyJJJJJJyd...","...dyJJJJJJyd...","....dJJJJJJd....",".....dJJJJd.....","......dJJd......",".......dd.......","................","................","................"]},
  "pg_desk":{"set":"glimmer","cells":[2,1],"walk":false,"place":"floor","rows":[".................NdddddddddddN..",".................NdVwVVVVVVVdN..",".................NdVVVVVVVVVdN..",".................NdVVQQQQVVVdN..",".................NdVVVVVVVVVdN..",".................NdddddddddddN..",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.",".NmmmwwwwwwNmNNNNNNNNNNNNNNNNNN.",".NNNNwhhhhwNNNNNNNNNNNNNNNNNNNN.",".NNNNwwwwwwNNNNNNNNNNNNNNNNNNNN.",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.","NVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVN",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.",".NmN........................NmN.",".NmN........................NmN.","..N..........................N.."]},
  "pg_chair":{"set":"glimmer","cells":[1,1],"walk":false,"place":"floor","rows":["....NNNNNNNN....","...NQQQQQQQQN...","...NQVVVVVVVN...","...NQVVVVVVVN...","...NQVVVVVVVN...","...NQVVVVVVVN...","...NQVVVVVVVN...","....NNNNNNNN....","...NQQQQQQQQN...","...NQVVVVVVVN...","...NQVVVVVVVN...","....NNNmmNNN....","...NNNNmmNNNN...","..NmmmmmmmmmmN..","...NNNNNNNNNN...","................"]},
  "pg_sofa":{"set":"glimmer","cells":[2,1],"walk":false,"place":"floor","rows":["...NNNNNNNNNNNNNNNNNNNNNNNNNN...","..NQQQQQQQQQQQQQQQQQQQQQQQQQQN..",".NNQVVVVVVVVVVVVVVVVVVVVVVVVVNN.","NdddVVVVVVVVVVVVVVVVVVVVVVVVdddN",".NNNVVVVVVVVVVVVVVVVVVVVVVVVNNN.",".NNNVVVVVVVVVVVVVVVVVVVVVVVVNNN.",".NNNQQQQQQQQQQQQNQQQQQQQQQQQNNN.",".NNNQVVVVVVVVVVVNVVVVVVVVVVVNNN.",".NNNQVVVVVVVVVVVNVVVVVVVVVVVNNN.",".NNNQVVVVVVVVVVVNVVVVVVVVVVVNNN.",".NNNQVVVVVVVVVVVNVVVVVVVVVVVNNN.",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.",".NmmN......................NmmN.",".NmmN......................NmmN.","..NN........................NN.."]},
  "pg_planter":{"set":"glimmer","cells":[1,1],"walk":false,"place":"floor","rows":["................","......NNNNN.....","....NNtttJJNN...","...NJgggtttJJN..","...NgggggtttJN..","..NJtgggttttJJN.","..NJttttttttJJN.","..NJttttttttJJN.","...NJttttttJJN..","..NddddddddddN..","..NdNNNNNNNNN...","..NVVVVVVVVVVN..","..NdNNNNNNNNN...","..NdNNNNNNNNN...","...N............","................"]},
  "pg_display_case":{"set":"glimmer","cells":[1,1],"walk":false,"place":"floor","rows":["...NNNNNNNNNN...","..NwwwwwwwwwwN..","..NwhhwhVhhhhN..","..NwhwVVVVVhhN..","..NwhhVhhhVhhN..","..NwhhVhhhVhhN..","..NwhhVwwwVhhN..","..NwhhhwQwhhhN..","..NwhhhhhhhhhN..","..NVVVVVVVVVVN..","..NdNNNNNNNNN...","..NdNNNNNNNNN...","..NdNNNNNNNNN...","..NdNNNNNNNNN...","...N............","................"]},
  "pg_kiosk":{"set":"glimmer","cells":[1,2],"walk":false,"place":"floor","rows":["................","...NNNNNNNNNN...","..NmmmmmmmmmmN..","..NmdddddddddN..","...NdNNNNNNNN...","...NdNNNNNNN....","...NdVVVVVVN....","...NdVVVVVVN....","...NdVwwwwVN....","...NdVVVVVVN....","...NdVhhhVVN....","...NdVVVVVVN....","...NdVhhhhVN....","...NdVVVVVVN....","...NdVQQVVVN....","...NdVVVVVVN....","...NdVVVVVVN....","...NdNNNNNNN....","...NdNNNNNNN....","...NdVVVVVVN....","...NdNNNNNNN....","...NdNNNNNNN....","...NdNNNNNNN....","...NdNNNNNNN....","...NdNNNNNNN....","...NdNNNNNNN....","...NdNNNNNNNN...","..NmmmmmmmmmmN..","..NmdddddddddN..","...NNNNNNNNNN...","................","................"]},
  "pg_water_cooler":{"set":"glimmer","cells":[1,1],"walk":false,"place":"floor","rows":[".....NhhhhN.....","....NwhhhhhN....","....NwhwhhhN....","....NwhhhhhN....","....NwhhhhhN....","....NwhhhhhN....","....NwhhhhhN....","...NwwwwwwwhN...","...NwwwwwwwhN...","...NwwwVVwNhN...","...NwwwwwwwhN...","...NwwwwwwwhN...","...NwwwwwwwhN...","...NhhhhhhhhN...","....NmmmmmmN....",".....NNNNNN....."]},
  "pg_reception":{"set":"glimmer","cells":[3,1],"walk":false,"place":"floor","rows":[".............................NdddddddddN........","............N................NdVwVVVVVdN........",".NNNNNNNNNNNwNNNNNNNNNNNNNNNNNdVVVVVVVdNNNNNNNN.","NhhhhhhhhhhhhhhhhhhhwwwwwhhhhhdddddddddhhhhhhhhN","NhmmmmmmmmmhhhmmmmmmwwwwwmmmmmmmmmmmmmmmmmmmmmmN","NddddddddddddddddddddddddddddddddddddddddddddddN",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.","NVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVN","NVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVN",".NNNNNdNNNNNNNNNdNNNNNNNNNdNNNNNNNNNdNNNNNNNNNN.",".NNNNNdNNNNNNNNNdNNNNNNNNNdNNNNNNNNNdNNNNNNNNNN.",".NNNNNdNNNNNNNNNdNNNNNNNNNdNNNNNNNNNdNNNNNNNNNN.","......N.........N.........N.........N...........","................................................"]},
  "pg_coffee_table":{"set":"glimmer","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","................","................","................",".NNNNNNNNNNNNNN.","NdddwwdddwwddddN","NdNmwwNNNwwNNNN.","NdNNVVVNNVVVNNN.","NdNNNVNNNNVNNNN.","NdNNNNNNNNNNNNN.",".NmN........NmN.",".NmN........NmN.",".NmN........NmN.","..N..........N..","................"]},
  "pg_lanyard_rack":{"set":"glimmer","cells":[1,1],"walk":false,"place":"wall","rows":["................",".NNNNNNNNNNNNNN.","NmmmmmmmmmmmmmmN","NmdddddddddddddN",".NNhNNhNNhNNhNN.",".NVNVVNVNNNVNVN.",".NVNVVNVN.NVNVN.",".NVNVVNVN.NVNVN.",".NVNVVNVN.NVNVN.",".NwwwwwwN.NwwwN.",".NwQwwQwN.NwQwN.",".NwwwwwwN.NwwwN.","..NNNNNN...NNN..","................","................","................"]},
  "pg_banner":{"set":"glimmer","cells":[1,1],"walk":false,"place":"wall","rows":["...NNNNNNNNNN...","..NmmmmmmmmmmN..","...NVVVVVVVVN...","...NVVVVVVVVN...","...NVVVVVVVVN...","...NwwwwwwwwN...","...NVVVVVVVVN...","....NNNNNNNN....","...NVVVVVVVVN...","...NVVVVVVVVN...","...NVVVVVVVVN...","...NVVVNNVVVN...","....NNN..NNN....","................","................","................"]},
  "pw_potters_wheel":{"set":"kiln","cells":[1,1],"walk":false,"place":"floor","rows":["................","......d.dd......",".....dIdIId.....","....dCCCCCCd....","....dCIIIIId....","....dCIIIIId....","...ddhhhhhhhdd..","..dhhhhhhhhhhhd.","..dmmhhhhhhhmmd.","...ddmmFFmmmdd..",".....ddFFddd....","...ddFGGGGGFdd..","..dGGGGGGGGGGGd.","..dFFFGGGGGFFFd.","...ddFFFFFFFdd..",".....ddddddd...."]},
  "pw_drying_rack":{"set":"kiln","cells":[2,1],"walk":false,"place":"floor","rows":[".dd..d..............d........dd.","dFFddId............dCd......dFFd","dFFdIIId..dd...dd.dCCCd..dd.dFFd","dFFdIIId.dCCd.dIIddCCCd.dIIddFFd","dFFdIIIddCCCCdIIIIdCCCddIIIIdFFd","dFFdIIIddCCCCdIIIIdCCCddIIIIdFFd","dAAAAAAAAACCAAAIIAAAAAAAAIIAAAAd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFddddddddddddddddddddddddddFFd","dFFddddd.dddd.dddd.dddd.dddddFFd","dFFdCwCCdIwIIdCwCCdIwIIdCwCCdFFd","dFFCCCCCCIIIICCCCCCIIIICCCCCCFFd","dFFdCCCCdIIIIdCCCCdIIIIdCCCCdFFd","dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd",".dddddddddddddddddddddddddddddd."]},
  "pw_kiln":{"set":"kiln","cells":[1,2],"walk":false,"place":"floor","rows":[".....dhmmmd.....",".....dhmmmd.....",".....dhmmmd.....",".....dhmBmdd....","....dBBBBBBBd...",".dddBBBBBBBBBdd.","dFFFFFFFFFFFFFFd",".dFBBBFBBBFBBBFd",".dBBBBBBBBBBBBBd","dFFFFFFFFFFFFFFd",".dBBFBBBFBBBFBBd","dGBBBBBBBBBBBBFB","dGFFFFFFFFFFFFFd","dGFBBBFBBBFBBBFd","dGBBBBBBBBBBBBFd","dGFFFFFFFFFFFFFd","dGBBFBBdddBBFBFd","dGBBBBdddddBBBFd","dGFFFdddddddFFFd","dGFBBddddddBBBFd","dGBBBdrrrrdBBBFd","dGFFFdrrrrdFFFFd","dGBBFdroordBFBFd","dGBBBdroordBBBFd","dGFFFdryordFFFFd","dGFBBdroyrdBBBFd","dGBBBdroordBBBFd","dGFFFFFFFFFFFFFd","hhhhhhhhhhhhhhhh","hmmmmmmmmmmmmmmm","dddddddddddddddd","................"]},
  "pw_clay_bin":{"set":"kiln","cells":[1,1],"walk":false,"place":"floor","rows":["................","................",".....ddddddd....","...ddGGGGGGGdd..","..dGGICIIIIIGGd.",".dGGIIIIIIIIIGGd",".dAGGIIIIIIIGFd.",".dAGGGGGGGGGGFd.",".dAmmmmmmmmmmFd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.",".dAmmmmmmmmmmFd.",".dAGGGGGGGGGGFd.","..dddddddddddd..","................"]},
  "pw_glaze_jars":{"set":"kiln","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","................","..........dddd..","..dddd...dCCCCd.",".dCCCCddddwyyFd.",".dCttFCCCCwyyFd.",".dCttFCrrFwyyFd.",".dCttFCrrFwyyFd.",".dCttFCrrFwyyFd.",".dCttFCrrFwyyFd.","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd","dFFddddddddddFFd","dFFd........dFFd",".dd..........dd."]},
  "pw_workbench":{"set":"kiln","cells":[2,1],"walk":false,"place":"floor","rows":["................................","................................",".dddddddddddddddddddddddddddddd.","dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd","dAGFCCCCCCCCCFGGGGIGGGGhhhhFFGGd","dAGGCCCCCCCCCGGGICIIIGGGGGGGGGGd","dBBBBBBBBBBBBBBIIIIIIIBBBBBBBBBd","dAGGGGGGGGGGGGGGIIIIIGGGyyyGGGGd","dAGGGGGGGGGGGGGGGGIGGGGGyyyGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dFFGGGGGGGGGGGGGGGGGGGGGGGGFFd.",".dFFddddddddddddddddddddddddFFd.",".dFFd......................dFFd.","..dd........................dd.."]},
  "pw_stoneware_stack":{"set":"kiln","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","................",".........ddddd..","...ddddddBCCCCd.","..dBCCCBddoBBBd.",".dBBCCCBBdoBBBBd","..dBBBBBddoBBBd.",".dBCCCCCBdoBBBBd","..dBBBBBddoBBBd.",".dBCCCCCBdoBBBd.",".ddBBBBBddoBBBd.","dBBCCCCCBBoBBBd.",".ddBBBBBddFFFFd.","...ddddd..dddd..","................"]},
  "pw_firewood":{"set":"kiln","cells":[1,1],"walk":false,"place":"floor","rows":["................","........d.......",".......dFd......","......dFAFd.....",".....dFAGAFd....",".....ddFAFdd....","....dFFFFFFFd...","...dFAAAFAAAFd..","...dFAGAFAGAFd..","...dFFFFFFFFFd..","..dFAFdFAFdFAFd.",".dFAGAFAGAFAGAFd","..dFAFdFAFdFAFd.","..ddFdddFdddFd..",".dFFFFFFFFFFFFd.","..dddddddddddd.."]},
  "pw_bath_bench":{"set":"kiln","cells":[2,1],"walk":false,"place":"floor","rows":["................................","................................","................................","................................",".dddddddddddddddddddddddddddddd.","dwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwd","dwAAAAAAAAAAAAAAAAAAAAAAAAAAAACd","dwCCCCCCCCCCCCCCCCCCCCCCCCCCCCCd","dwAAAAAAAAAAAAAAAAAAAAAAAAAAAACd","dwCCCCCCCCCCCCCCCCCCCCCCCCCCCCCd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd",".dGGddddddddddGGddddddddddddGGd.",".dGGd........dGGd..........dGGd.",".dGGd........dGGd..........dGGd.",".dGGd........dGGd..........dGGd.","..dd..........dd............dd.."]},
  "pw_bath_bucket":{"set":"kiln","cells":[1,1],"walk":false,"place":"floor","rows":["...........ddd..","..........dFFFd.","..........dFdd..",".....ddddddFd...","....dGGGGGGFd...","...dGnnnnnnFGd..","..dGnnbnnnnnnGd.","..dGGnnnnnnnFd..","..dGGGGGGGGGFd..","..dmmmmmmmmmFd..","..dGGGGGGGGGFd..","..dGGGGGGGGGFd..","..dmmmmmmmmmFd..","..dGGGGGGGGGFd..","...dddddddddd...","................"]},
  "ps_counter":{"set":"shop","cells":[2,1],"walk":false,"place":"floor","rows":[".......d............dwwwwd......","....d.dyd.d.........dhhrhd......","...dyddyddyd........dhrhhd......",".dddyyyyyyyddddddddddhyrhdddddd.","dCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCd","dCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd","dCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dGGBBBBBBGGGGBBBBBBGGGGBBBBBBGGd","dGGFFFFFFGGGGFFFFFFGGGGFFFFFFGGd","dGGFFFFFFGGGGFFFFFFGGGGFFFFFFGGd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dddddddddddddddddddddddddddddd.","................................"]},
  "ps_shelf_tall":{"set":"shop","cells":[1,2],"walk":false,"place":"floor","rows":[".dddddddddddddd.","dGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFd","dFFFFFwwwFFFFFFd","dFwwwFyyyFwwwFFd","dFrrrFyyyFcccFFd","dFrrrFyyyFcccFFd","dFrrrFyyyFcccFFd","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd","dFhhhFFFFFwwwFFd","dFCCCFwwwFoooFFd","dFCCCFgggFoooFFd","dFCCCFgggFoooFFd","dFCCCFgggFoooFFd","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd","dFFFFFFFhhhFFFFd","dFFwwwFFwwwFFFFd","dFFbbbFFwwwFFFFd","dFFbbbFFwwwFFFFd","dFFbbbFFwwwFFFFd","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd","dFFFFFFwwwFFFFFd","dFwwwFFBBBFwwwFd","dFAAAFFBBBFhhhFd","dFAAAFFBBBFhhhFd","dFAAAFFBBBFhhhFd","dFFddddddddddFFd",".dd..........dd.","................"]},
  "ps_apple_barrel":{"set":"shop","cells":[1,1],"walk":false,"place":"floor","rows":[".........d......","........dgd.....",".....dddoddd....","....dorrrrrrd...","...drrprrrrord..","..dArrrorrprrd..","..dAGrrrrrrrFd..","..dmmmmmmmmmmd..","..dAGGFGGFGGFd..","..dAGGFGGFGGFd..","..dAGGFGGFGGFd..","..dAGGFGGFGGFd..","..dmmmmmmmmmmd..","..dAGGFGGFGGFd..","...dddddddddd...","................"]},
  "ps_sack_pile":{"set":"shop","cells":[1,1],"walk":false,"place":"floor","rows":["................","................",".........ddd....","........dFFFd...","........dFFFd...","....ddddCCCCId..","...dyyyCCCCCCId.","..dyoyyyCCCCCIId",".dCCyyyCICCCCIId",".dCCCCCCICCCCIId","dICCCCCCIICCCIId",".dCCCCCCICCCCIId",".dICCCCIICCCIId.","..dIIIIIIIIIId..",".dyyIIIdddIdyd..","..ddddd...d.d..."]},
  "ps_produce_crate":{"set":"shop","cells":[1,1],"walk":false,"place":"floor","rows":["................","...d..d..d......","..dgddgddgd.d...","...dlddlddldgd..","..doodoodoolggd.","..doodoodoogggd.",".dAooGooGooGgFd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.",".dAFFFFFFFFFFFd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.",".dAGGGGGGGGGGFd.","..dddddddddddd..","................"]},
  "ps_display_table":{"set":"shop","cells":[2,1],"walk":false,"place":"floor","rows":["................................","..............ddd...............",".dddddddddddddwwwdddddddddddddd.","dsssssssssssssyyyswwwssssssssssd","dsccCCAcCCAcccyyycrrrccHHHHHHccd","dscAAAAAAAAAccyyycrrrccppppppccd","dsccAAAcAAAccccccccccccHHHHHHccd","dscccccccccccccccccccccHHHHHHccd","dscccccccccccccccccccccccccccccd","dscccccccccccccccccccccccccccccd","dccccccccccccccccccccccccccccccd","dbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbd","dbnbbbnbbbnbbbnbbbnbbbnbbbnbbbbd",".dFFddddddddddddddddddddddddFFd.",".dFFd......................dFFd.","..dd........................dd.."]},
  "ps_basket_stand":{"set":"shop","cells":[1,1],"walk":false,"place":"floor","rows":["................",".......dd.......","....dddFGdddd...","...dGwCwwCwwGd..","..dGGwwwwwwwGGd.","...dGGGGGGGGGd..","....dddFGdddd...","......dFddd.....","...dddGGGGGddd..","..dGrprrprrprGd.",".dGGrrrrrrrrrGGd","..dGGGGGGGGGGGd.","...dddGGGGGddd..","....dGGGGGGd....","....dGFFFFFd....",".....dddddd....."]},
  "ps_seconds_bin":{"set":"shop","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","................","......dddd......","....ddwIIIddd...","..ddCCIIIIBBBd..",".dGCCCCCBBBBBGd.",".dGFCCCFFFFFFFd.",".dGFFFFFFFFFFFd.",".dGFFwwwwwwFFFd.",".dGFFCCCrCCFFFd.",".dGFFCCCCCCFFFd.",".dGFFFFFFFFFFFd.",".dGFFFFFFFFFFFd.","..dddddddddddd..","................"]},
  "pn_bed_alcove":{"set":"lantern","cells":[1,2],"walk":false,"place":"floor","rows":["FFFFFFFFFFFFFFFF","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","EEEEEEEEEEEEEEEE","DEEdEEEdEEEdEEED","DEdddEdddEdddEED","DEdwwwwwwwwwwdED","DEdwwwwwwwwwwdED","DEdwwwwwwwwwwdED","DEdhhhhhhhhhhdED","DECCCCCCCCCCCCED","DEIIIIIIIIIIIIED","DEDDDDDDDDDDDEED","DEDCCDDDDCCDDEED","DEDCwDDDDCwDDEED","DEDDDDDDDDDDDEED","DEDDDDDDDDDDDEED","DEDDDDCCDDDDCEED","DEDDDDCwDDDDCEED","DEDDDDDDDDDDDEED","DEDDDDDDDDDDDEED","DEDCCDDDDCCDDEED","DEDCwDDDDCwDDEED","DEDDDDDDDDDDDEED","DEDDDDDDDDDDDEED","DEDDDDCCDDDDCEED","DEEEEEEEEEEEEEED","DGGGGGGGGGGGGGGD","DGFFFFFFFFFFFFFD","dddddddddddddddd","................","................"]},
  "pn_cot":{"set":"lantern","cells":[1,2],"walk":false,"place":"floor","rows":["................","................","..dddddddddddd..",".dAAAAAAAAAAAAd.",".dAGGGGGGGGGGGd.",".dAGGGGGGGGGGGd.","..dwwwwwwwwwwd..","..dwwwwwwwwwwd..","..dwwwwwwwwwwd..","..dhhhhhhhhhhd..",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dAAAAAAAAAAAFd.",".dAAAAAAAAAAAFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dHBBBBBBBBBBFd.",".dGGGGGGGGGGGGd.",".dFFddddddddFFd.",".dFFd......dFFd.","..dd........dd..","................"]},
  "pn_bedside":{"set":"lantern","cells":[1,1],"walk":false,"place":"floor","rows":["................","...dddd....ddd..","..dwwwwd..dFFFd.",".dCCCCId..dyyyd.","..dCCCIddddyoyd.","..dCCCIdwwdyoyd.","..dCCCIdwwdyyyd.",".dAAAAAAAAAAAAd.",".dAGGGGGGGGGGGd.",".dFFFFFFFFFFFFd.",".dFFFFFyFFFFFFd.",".dFFFFFFFFFFFFd.",".dFFddddddddFFd.",".dFFd......dFFd.",".dFFd......dFFd.","..dd........dd.."]},
  "pn_clock_tall":{"set":"lantern","cells":[1,2],"walk":false,"place":"floor","rows":["..dFFFFGGFFFFd..","..dFFFFFFFFFFd..",".dGFFFFFFFFFFFd.",".dGFFFFFwFFFFFd.",".dGFFFwwhwwFFFd.",".dGFFwwwdwwwFFd.",".dGFwwwwdwwwwFd.",".dGFhwwwdwwwhFd.",".dGFwwwwdddwwFd.",".dGFwwwwwwwwwFd.",".dGFFwwwwwwwFFd.",".dGFFFwwhwwFFFd.",".dGFFFFFwFFFFFd.","..ddGFFFFFFFdd..","...dGFddydFFd...","...dGFddydFFd...","...dGFddydFFd...","...dGFddydFFd...","...dGFddydFFd...","...dGFddydFFd...","...dGFdyyyFFd...","...dGFdyyyFFd...","...dGFdyyyFFd...","...dGFddddFFd...","...dGFFFFFFFd...","..ddGFFFFFFFdd..",".dGGGGGGGGGGGGd.",".dGFFFFFFFFFFFd.",".dGFFFFFFFFFFFd.","..dddddddddddd..","................","................"]},
  "pn_kettle_stove":{"set":"lantern","cells":[1,1],"walk":false,"place":"floor","rows":["................","......dddd......",".....dFFFFd.....",".....dCCCCCddd..","....dCwwwCCCCCd.","...dCCwwwCCCCd..","....dCCCCCCCd...","...dhhCCCCChmd..","..dhhhhhhhhhhmd.","..dhhhhhhhhhhmd.",".dmhhhhhhhhhhmmd","..dmhooyooohmmd.","..dmmoooooommmd.","...dmmmmmmmmmd..","....ddmmmmddd...","......dddd......"]},
  "pn_linen_shelf":{"set":"lantern","cells":[1,1],"walk":false,"place":"floor","rows":[".dddddddddddddd.","dGGGGGGGGGGGGGGd","dFCCCCCFDDDDDFFd","dFCCCCCFDDDDDFFd","dFIIIIIFEEEEEFFd","dFCCCCCFDDDDDFFd","dFCCCCCFDDDDDFFd","dGGGGGGGGGGGGGGd","dFHHHHHFCCCCCFFd","dFHHHHHFCCCCCFFd","dFBBBBBFIIIIIFFd","dFHHHHHFCCCCCFFd","dFHHHHHFCCCCCFFd","dGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFd",".dddddddddddddd."]},
  "pn_screen":{"set":"lantern","cells":[1,1],"walk":false,"place":"floor","rows":["......ddddd.....",".dddddGGGGGddddd","dGGGGGGCCCCGGGGG","dGCCCCGCCCCGCCCC","dGCCCCGCDDCGCCCC","dGCDDCGCEDCGCDDC","dGCEDCGCEDCGCEDC","dGCEDCGCEDCGCEDC","dGCEDCGCEDCGCEDC","dGCEDCGCCCCGCEDC","dGCCCCGCCCCGCCCC","dGCCCCGCCCCGCCCC","dGCCCCGCCCCGCCCC","dGCCCCdddddGCCCC","dGGGGGGGGGGGGGGG",".ddddddddddddddd"]},
  "pn_rest_rug":{"set":"lantern","cells":[2,1],"walk":true,"place":"decal","rows":[".FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.","FBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBF","FBCCCCCCCCCCCCCCCCCCCCCCCCCCCCBF","FBCBBBBBBBBBBBBBBBBBBBBBBBBBBCBF","FBCBBBBBBBBBBBBBBBBBBBBBBBBBBCBF","FBCBBBBBBBBBBBBBBBBBBBBBBBBBBCBF","FBCBBGGBBBGGBBBGGBBBGGBBBGGBBCBF","FBCBBGABBBGABBBGABBBGABBBGABBCBF","FBCBBGGBBBGGBBBGGBBBGGBBBGGBBCBF","FBCBBGGBBBGGBBBGGBBBGGBBBGGBBCBF","FBCBBBBBBBBBBBBBBBBBBBBBBBBBBCBF","FBCBBBBBBBBBBBBBBBBBBBBBBBBBBCBF","FBCBBBBBBBBBBBBBBBBBBBBBBBBBBCBF","FBCCCCCCCCCCCCCCCCCCCCCCCCCCCCBF","FBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBF",".FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF."]},
  "pn_hot_jug":{"set":"lantern","cells":[1,1],"walk":false,"place":"floor","rows":["................",".......dd.......","......dFFd......",".....dCCCCd.....",".....dBBBBd.....",".....dBoBBBd....","....doooooBBd...","...dBoCoooBBBd..","...doooooooBBd..","...dBoooooBBBd..","...dBoooooBBBd..","...dBBBoBBBBBd..","...ddBBBBBBBd...","..dCCCCCCCCCCd..","..dIIIIIIIIIId..","...dddddddddd..."]},
  "pv_fern":{"set":"nature","cells":[1,1],"walk":false,"place":"floor","rows":["......ddtdd.....",".....dglggtd....","...dddllggtdd...","..dggtggggtttd..","..dllltgtttggtd.",".dtgggllgggtgttd","..dtttggggttttd.","...dtttttttttd..","...dddddtdddd...","..dAAAAAAAAAAd..","..dBBBBBBBBBBd..","...dBBBBBBBFd...","...dBBBBBBBFd...","...dBBBBBBBFd...","...dBFFFFFFFd...","....dddddddd...."]},
  "pv_potted_tree":{"set":"nature","cells":[1,2],"walk":false,"place":"floor","rows":["........d.......",".....dddtddd....","....dggggggtd...","...dgtggggggtd..","..dglggtgglggtd.",".dgllggtglllgttd",".dtggggttglgggtd",".dgtggttggggggtd",".dgtttttggggggtd","dtgggtggggggggtt",".dggggggggggggtd",".dggggggggggggtd",".dtggggggggggttd",".dtgggggggggtttd","..dtgggggggtttd.","...dttggggtttd..","....dttGFtttd...",".....ddGFddd....",".....dFGFd......","......dGFd......","......dGFd......","..dddddGFddddd..",".dAAAAAAAAAAAAd.",".dBBBBBBBBBBBBd.","..dBBBBBBBBBFd..","..dBBBBBBBBBFd..","..dBBBBBBBBBFd..","..dBBBBBBBBBFd..","..dBBBBBBBBBFd..","..dBFFFFFFFFFd..","...dddddddddd...","................"]},
  "pv_herb_box":{"set":"nature","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","...ddd.ddd.ddd..","..dgptdggtdgwtd.",".dgpgtglgtgwgttd",".dglggglggglggtd",".dggggggggggggtd",".dtggttggttggttd",".dtttttttttttttd","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd","dAGFFFFFFFFFFGGd","dAGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFd",".dddddddddddddd.","................"]},
  "pv_flower_vase":{"set":"nature","cells":[1,1],"walk":false,"place":"floor","rows":[".....d..d...d...","....dyddrd.dod..","...drd.dgd.dd...","...dd.dggydrd...","..doddrdgddd....","...ddgddgdrgd...",".....dcnnbdd....",".....dcbbbd.....",".....dcbbbd.....","....ddcGAGddd...","...dAAAAAAAAAd..","...dGGGFAGGGGd..","....dddFGGddd...",".....ddFddd.....","....dFFFFFFd....",".....dddddd....."]},
  "pv_succulents":{"set":"nature","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","................","................","...ddd..........","..dlgtd....ddd..",".dggggtd..dlgtd.",".dtggttdddggggtd",".dCCCCdlgttggttd",".dBBBBggggthhhd.",".dBBBBtggttmmmd.","..ddddCCCCmmmmd.",".....dAAAAdddd..",".....dAAAAd.....","......dddd......","................"]},
  "pv_trellis":{"set":"nature","cells":[1,2],"walk":false,"place":"floor","rows":["..d....d....d...",".dGddddGd..dGd..",".dGlgrdGddddGd..",".dtggttGGGGGGd..",".dGtttdGddddGd..",".dGddddGlgtdGd..",".dGd..dtggttGd..",".dGddddGtttdGd..",".dGGGGGGGGGGGd..",".dGdlgtGddddGd..",".dGtggttd..dGd..",".dGdtttGd.ddGd..",".dGddddGddlgrd..",".dGGGGGGGtggttd.",".dGddddGddtttd..",".dlgtddGd.ddGd..","dtggttdGd..dGd..",".dtttddGddddGd..",".dGGGGGlgtGGGd..",".dGdddtggttdGd..",".dGd..dtttddGd..",".dGd..dGdddlgrd.",".dGddddGddtggttd",".dGGlgtGGGGtttd.",".dGtggttddddGd..","ddGdtttGddddGd..","AAAAAAAAAAAAAAd.","BBBBBBBBBBBBBBd.","dBBBBBBBBBBBFd..","dBFFFFFFFFFFFd..",".dddddddddddd...","................"]},
  "pv_reed_jar":{"set":"nature","cells":[1,1],"walk":false,"place":"floor","rows":[".....ddyd..d....","....dAyydddCd...","...dAAdydACCd...","....dAGGAAdCd...","....dGGGdAdGd...","....dGGGdGdGd...","....dGGGdGdGd...","....dGGGdGdGd...","....dIIIIIIGd...","....dwCCCCId....","....dwCCCCId....","....dwCCCCId....","....dwCCCCId....","....dwCCCCId....",".....dIIIId.....","......dddd......"]},
  "pv_sapling_tub":{"set":"nature","cells":[1,1],"walk":false,"place":"floor","rows":[".......ddd......",".....ddtttdd....","....dggggggtd...","...dglllgggttd..","...dggllggggtd..","...dtgggggottd..","...dttggggrttd..","....dtttFtttd...","...ddddtFtddd...","..dAFFFFFFFFFd..","..dGGGGGGGGGFd..","..dmmmmmmmmmFd..","..dGGGGGGGGGFd..","..dGGGGGGGGGFd..","...dddddddddd...","................"]},
  "pv_hanging_basket":{"set":"nature","cells":[1,1],"walk":false,"place":"wall","rows":[".......dmd......",".......dmd......","......ddmdd.....","....ddmdtdmdd...","...dglllggygtd..","..dttgrggggtttd.","...dAAAAAAAAtd..","...dGGGGGGGGd...","...dGFFFFFFGd...","...dgddddddgd...","...dtgddgddtgd..","....dtddtd.dtd..",".....d..d...d...","................","................","................"]},
  "pa_notice_pins":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["................",".dddddddddddddd.","dFFFFFFFFFFFFFFd","dFAAAAAAAAAAAAFd","dFAwwrwAAAAAAAFd","dFAwwwwACCrCCAFd","dFAwhhwACIIICAFd","dFAwwwwACCCCCAFd","dFAAAyryAAAAAAFd","dFAAAyyyAAGbAAFd","dFAAAyyyAAAAAAFd","dFFFFFFFFFFFFFFd",".dddddddddddddd.","................","................","................"]},
  "pa_region_map":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["................",".dddddddddddddd.","dAAAAAAAAAAAAAAd","dACCCCCCccCCCCGd","dACCDDDCccCCyCGd","dACDDDDDccCCrCGd","dACDDDDDccrCCCGd","dACDDDDrccDDDCGd","dACCDDrCccDDDDGd","dACCrCCCccDDDCGd","dACCCCCCccCCCCGd","dAGGGGGGGGGGGGGd",".dddddddddddddd.","................","................","................"]},
  "pa_landscape":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["................",".dddddddddddddd.","dyyyyyyyyyyyyyod","dyccccccccccccod","dycccccccyyyccod","dycccccccyyyccod","dycccccccyyyccod","dycccgccccccccod","dygglggggcctccod","dyggggggttttttod","dyggggggggggggod","dooooooooooooood",".dddddddddddddd.","................","................","................"]},
  "pa_charter":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["..dddddddddddd..",".dyFFFFFFFFFFyd.","..ddCCCCCCCIdd..","...dCmmmmmCId...","...dCCCCCCCId...","...dCmmmmCCId...","...dCCCCCCCId...","...dCmmmmmCId...","...dCCCCrCCId...","...dCCCrrrCId...","..ddCCCCrCCIdd..",".dyFFFFFFFFFFyd.","..dddddddddddd..","................","................","................"]},
  "pa_plate_shelf":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["................","................","....d...d...d...","...dwd.dwd.dwd..","..dhwwdhwwdhwwd.",".dwwbwwwrwwwgwwd",".dwbbbwrrrwgggwd",".dwwbwwwrwwwgwwd",".ddwwwdwwwdwwwd.","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd",".dFddddddddddFd.","..d..........d..","................","................","................"]},
  "pa_clock_round":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["................",".....dddddd.....","....dFFhFFFd....","...dGwwdwwwFd...","..dFwwwdwwwwFd..","..dFwwwdwwwwFd..","..dhwwwdwwwwhd..","..dFwwwdddwwFd..","..dFwwwwwwwwFd..","..dFwwwwwwwwFd..","...dFwwwwwwFd...","....dFFhFFFd....",".....dddddd.....","................","................","................"]},
  "pa_tool_pegs":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["................",".dddddddddddddd.","dCAAAAAAAAAAAAAd","dCAFAAAAFAAAFAAd","dCmmmAAmmmAAFAAd","dCmmmAAmAmAAFAAd","dCAGAAAmAmAAFAAd","dCAGAAAmAmAAFAAd","dCAGAAAmAmAyyyAd","dCAGAAAmAmAyyyAd","dCAAAAAAAAAAAAAd","dGGGGGGGGGGGGGGd",".dddddddddddddd.","................","................","................"]},
  "pa_calendar":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["................","....dddddddd....","...drrrrrrrrd...","...drrrrrrrrd...","...dwwwwwwwhd...","...dwwwwwwwhd...","...dwhwhwhwhd...","...dwwwwwwwhd...","...dwhwrwhwhd...","...dwwwwwwwhd...","...dwhwhwhwhd...","....dddddddd....","................","................","................","................"]},
  "pa_book_shelf":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["................","................","..dd..ddd..dddd.",".drrddGGyddppccd",".drrbbGGyggppccd",".drrbbGGyggppccd",".drrbbGGyggppccd",".drrbbGGyggppccd",".drrbbGGyggppccd","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd",".dFddddddddddFd.","..d..........d..","................","................","................"]},
  "pa_herb_bundles":{"set":"wall","cells":[1,1],"walk":false,"place":"wall","rows":["................",".dddddddddddddd.","dGGGGGGGGGGGGGGd",".ddCdddCdddCddd.","..dtd.dGd.dPd...",".dggtdAAGdppPd..",".dggtdAAGdppPd..",".dggtdAAGdppPd..",".dggtdAAGdppPd..",".dtttdGGGdPPPd..","..dtd.dGd.dPd...","...d...d...d....","................","................","................","................"]},
  "px_stall_orchard":{"set":"ext_market","cells":[2,2],"walk":false,"place":"floor","rows":[".dddddddddddddddddddddddddddddd.","dJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJd","dgggCCCgggCCCgggCCCgggCCCgggCCCd","dgggCCCgggCCCgggCCCgggCCCgggCCCd","dgggCCCgggCCCgggCCCgggCCCgggCCCd","dgggCCCgggCCCgggCCCgggCCCgggCCCd","dgggCCCgggCCCgggCCCgggCCCgggCCCd","dgggCCCgggCCCgggCCCgggCCCgggCCCd","dggFCCdggdCCdggdCCdggdCCdggdCCd.","dgGFCddgddCddgddCddgddCddgddCFd.",".dGFd..d..d..ddddd.d..d..d.dFFd.",".dGFd........dwwwwd........dFFd.",".dGFd........dyyyyd........dFFd.",".dGFd.d......dyyyyd.d.....ddFFd.",".dGFddgdd..ddgddddddgdd.ddgdFFd.",".dGFrorrrddrorrrddrorrrdrorrrFd.",".dGrrrrorrrrrrorrrrrrorrrrrorrd.","dAAArrrrrAArrrrrAArrrrrArrrrrAAd","dAGGGGrGGGGGGrGGGGGGrGGGGGrGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFFGFFFFFGFFFFFGFFFFFGFFFFFGFFd","dFFFGFFFFArArAAFGFArArAAFFFFGFFd","dFFFGFFFFAAAAAAFGFAAAAAAFFFFGFFd","dFFFGFFFFAAAAAAFGFAAAAAAFFFFGFFd","dFFFGFFFFAAAAAAFGFAAAAAAFFFFGFFd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dFFFddddddddddddddddddddddFFFd.",".dFFFd....................dFFFd.","..ddd......................ddd..","................................"]},
  "px_stall_stoneware":{"set":"ext_market","cells":[2,2],"walk":false,"place":"floor","rows":[".dddddddddddddddddddddddddddddd.","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd","dBBBCCCBBBCCCBBBCCCBBBCCCBBBCCCd","dBBBCCCBBBCCCBBBCCCBBBCCCBBBCCCd","dBBBCCCBBBCCCBBBCCCBBBCCCBBBCCCd","dBBBCCCBBBCCCBBBCCCBBBCCCBBBCCCd","dBBBCCCBBBCCCBBBCCCBBBCCCBBBCCCd","dBBBCCCBBBCCCBBBCCCBBBCCCBBBCCCd","dBBmCCdBBdCCdBBdCCdBBdCCdBBdCCd.","dBImCddBddCddBddCddBddCddBddCmd.",".dImd..d..d..d..d..d..d..d.dmmd.",".dImdddd.........dddd......dmmd.",".dImCCCCd.......dCCCCd.....dmmd.",".dImoBBBd.......doBBBd.....dmmd.",".dImoBBBd.ddddd.doBBBd.dddddmmd.",".dImoBBBddBCCCBddoBBBddBCCCBmmd.",".dImoBBBdBBCCCBBdoBBBdBBCCCBBmd.","dCCCCCCCCCBBBBBCCCCCCCCBBBBBCCCd","dCIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dCIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dCIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dIIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dmmmImmmmmImmmmmImmmmmImmmmmImmd","dmmmImmmCCCmmmmmImmmmBBBmmmmImmd","dmmmImmmCCCmmmIIIImmmBBBmmmmImmd","dmmmImmmCCCmmmIIIImmmBBBmmmmImmd","dmmmImmmCCCmmmIIIImmmBBBmmmmImmd","dmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmd",".dmmmddddddddddddddddddddddmmmd.",".dmmmd....................dmmmd.","..ddd......................ddd..","................................"]},
  "px_stall_brightgate":{"set":"ext_market","cells":[2,2],"walk":false,"place":"floor","rows":[".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.","NQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQN","NVVVNNNVVVNNNVVVNNNVVVNNNVVVNNN.","NVVVNNNVVVNNNVVVNNNVVVNNNVVVNNN.","NVVVNNNVVVNNNVVVNNNVVVNNNVVVNNN.","NVVVNNNVVVNNNVVVNNNVVVNNNVVVNNN.","NVVVNNNVVVNNNVVVNNNVVVNNNVVVNNN.","NVVVNNNVVVNNNVVVNNNVVVNNNVVVNNN.","NVVNNNNVVNNNNVVNNNNVVNNNNVVNNN..","NVdNN.NVN.N.NVN.N.NVN.N.NVN.NN..",".NdN...N.....N.....N.....N..NN..",".NdN.NNN...NNN...NNN........NN..",".NdNNhhhN.NhhhN.NhhhN.NNNNNNNN..",".NdNNhyhN.NhyhN.NhyhNNwwwwwwNN..",".NdNNhhhN.NhhhN.NhhhNNCCCVCCNN..",".NdNNhhhN.NhhhN.NhhhNNCCCVCCNN..",".NdNNhhhNNNhhhNNNhhhNNCCCVCCNNN.","NmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmN","NmdddddddddddddddddddddddddddddN","NmdddddddddddddddddddddddddddddN","NmdddddddddddddddddddddddddddddN","NddddddddddddddddddddddddddddddN",".NNNdNNNNNdNNNNNdNNNNNdNNNNNdNN.",".NNNdNNNVVVVVVNNdNwwwwwwNNNNdNN.",".NNNdNNNVVVVVVNNdNwwwwwwNNNNdNN.",".NNNdNNNVVVVVVNNdNwwwwwwNNNNdNN.",".NNNdNNNVVVVVVNNdNwwwwwwNNNNdNN.",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.","..NNN......................NNN..","..NNN......................NNN..","................................","................................"]},
  "px_stall_canvas":{"set":"ext_market","cells":[2,2],"walk":false,"place":"floor","rows":[".dddddddddddddddddddddddddddddd.","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dCCCIIICCCIIICCCIIICCCIIICCCIIId","dCCCIIICCCIIICCCIIICCCIIICCCIIId","dCCCIIICCCIIICCCIIICCCIIICCCIIId","dCCCIIICCCIIICCCIIICCCIIICCCIIId","dCCCIIICCCIIICCCIIICCCIIICCCIIId","dCCCIIICCCIIICCCIIICCCIIICCCIIId","dCCFIIdCCdIIdCCdIIdCCdIIdCCdIId.","dCGFIddCddIddCddIddCddIddCddIFd.",".dGFd..d..d..d..d..d..d..d.dFFd.",".dGFd......................dFFd.",".dGFd......................dFFd.",".dGFdddddd....ddddd...ddddddFFd.",".dGFdGGAGGd..dGGgGGd.dGGyGGdFFd.",".dGFGAAAAAGddGgggggGdGyyyyyGFFd.",".dGFGGGAGGGddGGGgGGGdGGGyGGGFFd.","dAAAAGGGGGAAAAGGGGGAAAGGGGGAAAAd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dAGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFFGFFFFFGFFFFFGFFFFFGFFFFFGFFd","dFFFGFFFFFwwwwwwwwwwwwGFFFFFGFFd","dFFFGFFFFFCCCCCCCCCCCCGFFFFFGFFd","dFFFGFFFFFCCCCCCCCCCCCGFFFFFGFFd","dFFFGFFFFFCCCCCCCCCCCCGFFFFFGFFd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dFFFddddddddddddddddddddddFFFd.",".dFFFd....................dFFFd.","..ddd......................ddd..","................................"]},
  "pl_lamp_keeper":{"set":"ext_lamp","cells":[1,2],"walk":false,"place":"floor","rows":[".....ddyddd.....","....dJJJJJJd....","...dJJJJJJJJd...","....dyyyyyyd....","....dyooooyd....","....dyowwoyd....","....dyowwoyd....","....dyooooyd....","....dyyyyyyd....","....dJJJJJJd....",".....ddgJdd.....","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......","......dgJd......",".....ddgJdd.....","....dbbbbbbd....","....dbnnnnnd....","....dbnnnnnd....",".....dddddd.....","................","................"]},
  "pl_lamp_glimmer":{"set":"ext_lamp","cells":[1,2],"walk":false,"place":"floor","rows":[".....NNQNNN.....","....NVVVVVVN....","...NVVVVVVVVN...","....NNNNNNNN....",".....NhhhhN.....",".....NhwwhN.....",".....NhwwhN.....",".....NhhhhN.....",".....NNNNNN.....","....NVVVVVVN....",".....NNdNNN.....","......NdN.......","......NdN.......","......NdNN......",".....NVVVVN.....","......NdNN......","......NdN.......","......NdN.......","......NdN.......","......NdN.......","......NdN.......","......NdN.......","......NdN.......","......NdN.......","......NdN.......",".....NNdNNN.....","....NddddddN....","....NdNNNNN.....","....NdNNNNN.....",".....N..........","................","................"]},
  "pl_lamp_civic":{"set":"ext_lamp","cells":[1,2],"walk":false,"place":"floor","rows":[".....ddnndd.....","....dnnnnnnd....","...dnnnnnnnnd...","....dnnnnnnd....","....dnCCCCnd....","....dnCyyCnd....","....dnCyyCnd....","....dnCCCCnd....","....dnnnnnnd....","....dnnnnnnd....",".....ddbndd.....","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......","......dbnd......",".....ddbndd.....","....dhhhhhhd....","....dhmmmmmd....","....dhmmmmmd....",".....dddddd.....","................","................"]},
  "pl_lamp_kiln":{"set":"ext_lamp","cells":[1,2],"walk":false,"place":"floor","rows":["................","....dddddddd....","...dFFFFFFFFd...","....dBBBBBBd....","....dBBBBBBd....","....dBooooBd....","....dBoyyoBd....","....dBoyyoBd....","....dBooooBd....","....dBBBBBBd....","....dBBBBBBd....","....dFFFFFFd....","....dABBBBBd....","....dABBBBBd....","....dFFFFFFd....","....dABBBBBd....","....dABBBBBd....","....dFFFFFFd....","....dABBBBBd....","....dABBBBBd....","....dFFFFFFd....","....dABBBBBd....","....dABBBBBd....","....dFFFFFFd....","....dABBBBBd....","....dABBBBBd....","...dCCCCCCCCd...","...dCIIIIIIId...","...dCIIIIIIId...","....dddddddd....","................","................"]},
  "pq_bench_wood":{"set":"ext_square","cells":[2,1],"walk":false,"place":"floor","rows":["................................","...dddddddddddddddddddddddddd...",".ddAAAAAAAAAAAAAAAAAAAAAAAAAAdd.",".ddGGGGGGGGGGGGGGGGGGGGGGGGGGdd.",".ddFFFFFFFFFFFFFFFFFFFFFFFFFFdd.",".ddGGGGGGGGGGGGGGGGGGGGGGGGGGdd.",".dddddddddddddddddddddddddddddd.",".ddAAAAAAAAAAAAAAAAAAAAAAAAAAdd.",".ddGGGGGGGGGGGGGGGGGGGGGGGGGGdd.",".ddFFFFFFFFFFFFFFFFFFFFFFFFFFdd.",".ddGGGGGGGGGGGGGGGGGGGGGGGGGGdd.","dmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmd",".dddddddddddddddddddddddddddddd.",".dd..........................dd.","................................","................................"]},
  "pq_bench_stone":{"set":"ext_square","cells":[2,1],"walk":false,"place":"floor","rows":["................................","................................","................................",".dddddddddddddddddddddddddddddd.","dCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCd","dCIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dCIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dCIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmd","dmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmd","dmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmd",".ddCCCCCCddddddddddddddCCCCCCdd.","..dCIIIIId............dCIIIIId..","..dCIIIIId............dCIIIIId..","..dCIIIIId............dCIIIIId..","...dddddd..............dddddd..."]},
  "pq_planter_flowers":{"set":"ext_square","cells":[1,1],"walk":false,"place":"floor","rows":["................","................",".......dd..d....","....dddrtddyd...","...drllgggrgtd..","..dgllylgwgggtd.",".dtwgrggggggrttd",".ddttggggggtttd.","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd","dAFFFFFFFFFFFFGd","dAGGGGGGGGGGGGGd","dAGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFd",".dddddddddddddd.","................"]},
  "pq_planter_urn":{"set":"ext_square","cells":[1,1],"walk":false,"place":"floor","rows":["........d.......",".....dddtddd....","....dggggggtd...","...dglllggggtd..","...dglllggggtd..","..dtggggggggttd.","...dgggggggttd..","...dttggggtttd..","....dttCCCttd...","...dCCCCCCCCCd..","...dCCIIIImCCd..","....dCIIIImdd...","....dCIIIImd....","...dCCCCCCCCd...","...dCIIIIIIId...","....dddddddd...."]},
  "pq_fountain":{"set":"ext_square","cells":[2,2],"walk":false,"place":"floor","rows":["...............d................","..............dsd...............","..............dswd..............","............d.dswd.d............","...........dsddswddsd...........","...........ddddswdddd...........","..........dsCCccccCCsd..........","..........dCccccccccCd..........","...........dCCccccCCd...........","............ddCIImdd............",".............dCIImd.............","...........dddCIImddd...........","........dddIIICIImIIIddd........","......ddICCCCCCIImCCCCCIdd......","....ddCCCCCCCbCIImbCCCCCCCdd....","...dICCCCbbcccCIImcbbbbCCCCId...","..dICCCbccccccCIImccccbbbCCCId..","..dCCCbcccccccCIImccccsssbCCCd..",".dICCbcccsssccCIImccccccbbbCCId.",".dICCbccccccccccccccccccbbbCCId.",".dICCbbcccccccccccccsssbbbbCCId.",".dmICCbbcccccsssccccccbbbbCCImd.",".dmIICCbbbbccccccccbbbbbbCCIImd.",".dmmIICCCbbbbbbbbbbbbbbCCCIImmd.",".dmmmmIIICCCCbbbbbbCCCCIIImmmmd.","..dmmmmmIIIIIICCCCIIIIIImmmmmd..","...dmmmmmmmIIIIIIIIIImmmmmmmd...","....dmmmmmmmmmmmmmmmmmmmmmmd....",".....ddmmmmmmmmmmmmmmmmmmdd.....",".......ddmmmmmmmmmmmmmmdd.......",".........dddddddddddddd.........","................................"]},
  "pq_statue_companion":{"set":"ext_square","cells":[1,2],"walk":false,"place":"floor","rows":["................","................",".....ddd........","....dhhhd.......","...dhwhhhd......","...dhhhhhd......","...dhhhhhd......","...ddhhhd.......","..dwhhhhmd......","..dwhhhhmdd.....","..dwhhhhhhhd....","..dwhhhhhhhd....","..dwhhhhmdd..d..","..dwhhhhmdhddhd.","..dwhhhhmddwhhd.","..dwhhhhmdhdhdhd","..dhhhhhhmhhhhhd","..dhhhhhhmhhhhhd","..dhhhhhhmmhhhd.","..dmmddddmmddd..",".ddmmddddmmdddd.","dCCCCCCCCCCCCCCd","dCIIIIIIIIIIIIId","dCIIIIIIIIIIIIId","dCIImmmmmmmmIIId","dCIImhhhhhhmIIId","dCIImmmmmmmmIIId","dCIIIIIIIIIIIIId","dmmmmmmmmmmmmmmd",".dddddddddddddd.","................","................"]},
  "pq_statue_lantern":{"set":"ext_square","cells":[1,2],"walk":false,"place":"floor","rows":[".........dyyyyd.",".........dyooyd.",".........dyooyd.",".........dyyyyd.","......ddd.dmdd..",".....dhhhddhd...","....dhwhhhdhd...","....dhhhhhdhd...","....dhhhhhhhd...","....ddhhhdhhd...","...dwhhhhhmd....","...dwhhhhhmd....","...dwhhhhhmd....","...dwmhhmhmd....","...dwmhhmhmd....","...dwmhhmhmd....","...dwmhhmhmd....","...dwmhhmhmd....","...dwmhhmhmd....","...dwmhhmhmd....","...dwmhhmhmd....","..dmmmmmmmmmdd..",".dCCCCCCCCCCCCd.",".dCIIIIIIIIIIId.",".dCIIIIIIIIIIId.",".dCIIIIIIIIIIId.",".dCIIIIIIIIIIId.",".dCIIIIIIIIIIId.",".dmmmmmmmmmmmmd.","..dddddddddddd..","................","................"]},
  "pb_handcart":{"set":"ext_goods","cells":[2,1],"walk":false,"place":"floor","rows":["....ddddd..dAAAAAAAd............","...dCwwCCd.dAAAAAAAd............",".ddCwwwwCCddFFFFFFFdddd.........","dAACwwwwCCAAAAAAAAAAAAAd........","dGGCCwwCCCGGAAAAAAAGGGGd......d.","dGGGCCCCCGGGGGGGGGGGGGGdddddddFd","dGGGGGGGGGGGGGGGGGGGGGGFFFFFFFFd","dGGGGGGGGGGGGGGGGGGGGGGdddddddd.","dGGGGGGGGGGGFGGGGGGGGGGd........","dFFFFFFFFFFFFFFFFFFFFFFd........",".ddddddddFFGGGFFddddddd.........","........dFGGdGGFd...............","........dFGGGGGFd...............","........dFFGGGFFd...............",".........dFFFFFd................","..........ddFdd................."]},
  "pb_barrow":{"set":"ext_goods","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","................","...dddddddddd...","..dhhhFGFFFhhd..","..dmFFFFFFFFFd..","..dmmmFFFFFmmd..","..dmmmmmmmmmmd..","..dmmmmmmmmmmdd.","..dmmmmmmmmmGGGd","..dddddddddmddd.","..dmmmd...dmd...","..dmmmd...dmd...","..ddddd...dmd...","....d......d....","................"]},
  "pb_crate_stack":{"set":"ext_goods","cells":[1,1],"walk":false,"place":"floor","rows":["....ddddddddd...","...dCCCCGCCCCd..","...dCACAGAAAAd..","...dCACAGAAAAd..","...dCACAGAAAAd..","...dCACAGAAAAd..","..ddGGCGGGGGGd..",".dAAAACAAAAAAAd.",".dAGGGCGGGGGGGd.",".dAGGGCGGGGGGGd.",".dFFFFCFFFFFFFd.",".dAGGGCGGGGGGGd.",".dAGGGCGGGGGGGd.",".dFFFFCFFFFFFFd.","..dddddddddddd..","................"]},
  "pb_barrels":{"set":"ext_goods","cells":[1,1],"walk":false,"place":"floor","rows":["................","................",".........dddd...","...dddd.dAAAAd..","..dAAAAdAAAFAAd.",".dAAAFAAAAAAAFd.",".dAAAAAFmmmmmmd.",".dmmmmmmAGGGGFd.",".dAGGGGFAGGGGFd.",".dAGGGGFAGGGGFd.",".dAGGGGFmmmmmmd.",".dmmmmmmAGGGGFd.",".dAGGGGFAGGGGFd.",".dAGGGGFdddddd..","..dddddd........","................"]},
  "pb_sacks":{"set":"ext_goods","cells":[1,1],"walk":false,"place":"floor","rows":["................","................",".......dd.......","......dFFdd.....",".....dICCIId....","...ddICCCCIId...","..dFFCCCCCCIFdd.",".dICCCCCCCCIAGGd","dICCCICCCCIIAAGG","dCCCCIICCIIIAAAG","dCCCCCIIIIIAAAAG","dICCCCIIIGAAAAGG","dIICCIIIdGGAAGGG",".dIIIIId.dGGGGGd","..ddIdd...ddGdd.","....d.......d..."]},
  "pb_notice_board":{"set":"ext_goods","cells":[2,1],"walk":false,"place":"floor","rows":[".dAAAAAAAAAAAAAAAAAAAAAAAAAAAAd.",".dBBBBBBBBBBBBBBBBBBBBBBBBBBBBd.","..dFFFFFFFFFFFFFFFFFFFFFFFFFFd..","..dFAAAAAAAAAAAAAAAAAAAAAAAAFd..","..dFAwrwAACrCAAyryAAwrwACrCAFd..","..dFAwwwAACCCAAyyyAAwwwACCCAFd..","..dFAwwwAACCCAAyyyAAwwwACCCAFd..","..dFAwwwAACCCAAyyyAAwwwACCCAFd..","..dFAAAAAAAAAAAAAAAAAAAAAAAAFd..","..dFFFFFFFFFFFFFFFFFFFFFFFFFFd..","...ddFFddddddddddddddddddFFdd...","....dFFd................dFFd....","....dFFd................dFFd....","....dFFd................dFFd....","....dFFd................dFFd....",".....dd..................dd....."]},
  "pj_jetty_deck":{"set":"ext_water","cells":[1,1],"walk":true,"place":"tile","rows":["AAAAAAAAAAAAAAAA","GFGGdGGGGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","AAAAAAAAAAAAAAAA","GGGGGGGGGGGGGdGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","AAAAAAAAAAAAAAAA","GGGGGGGGGGGdFGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","AAAAAAAAAAAAAAAA","GGGGGGGGGdGFGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF"]},
  "pj_jetty_end":{"set":"ext_water","cells":[1,1],"walk":true,"place":"tile","rows":["AAAAAAAAAAAAAAAA","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","AAAAAAAAAAAAAAAA","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","AAAAAAAAAACCCAAA","GGGGGGGGGwCGCCGG","GGGGGGGGCCGGGCCG","FFFFFFFFFCCGCCFF","AAAAAAAAAACCCAAA","GGGGGGGGGGGGGGGG","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF"]},
  "pj_pile":{"set":"ext_water","cells":[1,1],"walk":false,"place":"water","rows":["................","................","......ddddd.....",".....dAAAAAd....","....dGGGGGGAd...","....dGFFFFFd....","....dGFFFFFd....","....dGFFFFFd....","....dGFFFFFd....","....dGFFFFFd....","....dGFFFFFd....","...ddGFFFFFdd...","..dssssssssssd..","..dddwwwwwwddd..",".dcccddddddcccd.","..ddd......ddd.."]},
  "pj_bank_edge":{"set":"ext_water","cells":[1,1],"walk":false,"place":"water","rows":["CCCCmdCCCCmdCCCC","IIIImdIIIImdIIII","IIIImdIIIImdIIII","IIIImdIIIImdIIII","IIIImdIIIImdIIII","dddddddddddddddd","mmdmmmmmdmmmmdmm","mmdmmmmmdmmmmdmm","mmdmmmmmdmmmmdmm","mmdmmmmmdmmmmdmm","nnnnnnnnnnnnnnnn","dsssssdddddddddd",".ddddd..dssssd..",".........dddd...","................","................"]},
  "pj_bank_steps":{"set":"ext_water","cells":[1,1],"walk":true,"place":"tile","rows":["mmwwwwwwwwwwwwmm","mmCCCCCCCCCCCCmm","mmCCCCCCCCCCCCmm","mmmmmmmmmmmmmmmm","mmCCCCCCCCCCCCmm","mmIIIIIIIIIIIImm","mmIIIIIIIIIIIImm","mmmmmmmmmmmmmmmm","mmCCCCCCCCCCCCmm","mmIIIIIIIIIIIImm","mmIIIIIIIIIIIImm","mmmmmmmmmmmmmmmm","mmhhhhhhhhhhhhmm","mmmmmmmmmmmmmmmm","mmmmmmmmmmmmmmmm","mmddddddddddddmm"]},
  "pj_waterwheel":{"set":"ext_water","cells":[2,2],"walk":false,"place":"floor","rows":["..............ddd...............","............ddAAAddd............","..........ddFFAAAFFFdd..........","........ddFFFFAAAFFFFFdd........",".....dddFFFGGGGAGGGGGFFFdd......","....dAAAFGGGGddddddGGGGAAAd.....","....dAAAGGddd.dGd..dddGAAAd.....","....dAAAGd.....d......dAAAFd....","...dFFGGGd....dGd.....dGGGFFd...","...dFGGddGd....d.....dGddGGFd...","..dFFGd..dGd..dGd...dGd..dGFFd..","..dFGGd...dGd..dd..dGd...dGGFd..",".dFFGGd....dGdddGddGd....dGGFFd.",".dFFGd......dGmmmmGd......dGFFd.","dAAAGd......dmmmmmmd......dAAAd.","dAAAGdd.d.d.dmmhhmmdd.d.d.dAAAd.","dAAAAdGdGdGdGmmhhmmdGdGdGdGAAAd.",".dFFGdd.d.d.dmmmmmmdd.d.d.dGFFd.",".dFFGd......dGmmmmGd......dGFFd.",".dFFGGd....dGddddddGd....dGGFFd.","..dFGGd...dGd..dGd.dGd...dGGFd..","..dFFGd..dGd....d...dGd..dGFFd..","...dFGGddGd....dGd...dGddGGFd...","...dFAAAGd......d.....dAAAFFd...","....dAAAGd.....dGd....dAAAFd....","....dAAAGGddd...d..dddGAAAd.....",".....ddFFGGGGdddGddGGGGFFd......","..ddddddFFFGGGAAAGGGGFFFdddddd..",".dccssssssccccccccccccccccccccd.",".dccccccccccccccccwwwwwwwwccccd.",".dccccccccssssscccccccccccccccd.","..dddddddddddddddddddddddddddd.."]},
  "pj_rowboat":{"set":"ext_water","cells":[2,1],"walk":false,"place":"water","rows":["................................","................................","..........dddddddddddd..........","......ddddFFFFFFFFFFFFdddd......","....ddFFGFFGGGGGFFGGGGGFFFdd....","..ddFGGGGFFGAAAAFFAAGGGFFGGFdd..",".dFFGGGAAFFAAAAAFFAAAAAFFGGGFFd.",".dFGGAAAAFFAAAAAFFAAAAAFFAAGGFd.","dFFGGAAAAFFAAAAAFFAAAAAFFAAGGFFd",".dFFGGAAAFFAAAAAFFAAAAAFFAGGFFd.",".dFFFFGGGFFAAAAAFFAAAAAFFGFFFFd.","..ddFFFFFFFGGGGGFFGGGGGFFFFFdd..","....ddFFFFFFFFFFFFFFFFFFFFdd....","...dddddddFFFFFFFFFFFFddddddd...","..dssssssssssssssssssssssssssd..","...dddddddddddddddddddddddddd..."]},
  "pr_chimney_brick":{"set":"ext_roof","cells":[1,1],"walk":false,"place":"roof","rows":["................","....dddddddd....","...dhhhhhhhhd...","...dhmmmmmmmd...","....dABBBBFd....","....dABBBBFd....","....dFFFFFFd....","....dABBBBFd....","....dABBBBFd....","....dFFFFFFd....","....dABBBBFd....","....dABBBBFd....","....dFFFFFFd....","....dABBBBFd....","....dABBBBFd....",".....dddddd....."]},
  "pr_chimney_stone":{"set":"ext_roof","cells":[1,1],"walk":false,"place":"roof","rows":["......dddd......",".....dAAAAd.....",".....dBBBBd.....","...dddBBBBddd...","..dmmmmmmmmmmd..","...dCIIIIIImd...","...dCIIIIIImd...","...dCImIIIImd...","...dCIICIIImd...","...dCIIIImImd...","...dCIIIIICmd...","...dCImIIIImd...","...dCIIIIIImd...","...dCIIIImImd...","...dCIIIIIImd...","....dddddddd...."]},
  "pr_finial":{"set":"ext_roof","cells":[1,1],"walk":false,"place":"roof","rows":[".......d........","......dyd.......","......dyd.......","......dyd.......","......dydd......",".....dywyyd.....",".....dyyoyd.....",".....dyyoyd.....",".....dyyyyd.....",".....dGGGGd.....","....ddGGGGdd....","...dGGGGGGGGd...","...dGFFFFFFFd...","...dGFFFFFFFd...","....dddddddd....","................"]},
  "pr_vane":{"set":"ext_roof","cells":[1,1],"walk":false,"place":"roof","rows":["................","................","..dd...d....d...","..dddddmdddddd..","..dd..dmddd.d...","......dmJJgd....","......dmJJJJd...","......dmJJJd....","......dmddd.....","......dmd.......","......dmd.......","......dmd.......",".....ddmddd.....","....dhhhhhhd....","....dhmmmmmd....",".....dddddd....."]},
  "pr_dormer":{"set":"ext_roof","cells":[1,1],"walk":false,"place":"roof","rows":["................","...dddddddddd...","..dGGGGGGGGGGd..",".dGFFFFFFFFFFFd.",".dFFFFFFFFFFFFd.",".dFFFFFFFFFFFFd.","..dCCCCCCCCCCd..","..dCCscGcccCCd..","..dCCccGcccCCd..","..dCCGGGGGGCCd..","..dCCccGcccCCd..","..dCCccGcccCCd..","..dCCccGcccCCd..","..dCCCCCCCCCCd..","...dddddddddd...","................"]},
  "pr_banner_civic":{"set":"ext_roof","cells":[1,1],"walk":false,"place":"facade","rows":["...ddddddddddd..","..dmmmmmmmmmmmd.","...dnnnnnnnbdmd.","...dnnnnnnnbdd..","...dnnnnnnnbd...","...dnnwwwwnbd...","...dnnwnnwnbd...","...dnnwwwwnbd...","...dnnnnnnnbd...","...dnnnnnnnbd...","...dyyyyyyyyd...","...dnnnnnnnbd...","...dnnnddnnnd...","...dnnnddnnnd...","....ddd..ddd....","................"]},
  "pr_window_box":{"set":"ext_roof","cells":[1,1],"walk":false,"place":"facade","rows":["................","................","................","................","................","................","....ddddddddd...","..ddygrgwggtrd..",".dgrllllgrggggd.",".dtggggggggygttd",".ddtttttttttttd.","dAAAAAAAAAAAAAAd","dAGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFd",".dddddddddddddd.","................"]},
  "pd_tuft_paving":{"set":"ext_ground","cells":[1,1],"walk":true,"place":"decal","rows":["................","................","................","..g.l....g......","...g.t..........","...t............","................","................","..........g.l...","...........g.t..","...........t....",".....g.l........","......g.t.......","......t......g..","................","................"]},
  "pd_tuft_flowers":{"set":"ext_ground","cells":[1,1],"walk":true,"place":"decal","rows":["................","................","................","................","....wg..........","....l.y.........","...tgg..........","................","................","............w...","..........yl....","..........tgg...","................","........r.......","................","................"]},
  "pd_wear_patch":{"set":"ext_ground","cells":[1,1],"walk":true,"place":"decal","rows":["................","................","................","........g.......","......AAAAC.....","....ACAAAAAAA...","...AAAAAAAAAAA..","..ACAAAAAAAAAAg.","..AAAAAACAAAACA.","..gAAAAAAAAAAAA.","...AAAAAAAAAAA..","....AACAAAACA...","......AAAAA.....",".......g........","................","................"]},
  "pd_kerb_moss":{"set":"ext_ground","cells":[1,1],"walk":true,"place":"decal","rows":["................","................","................","......m.........",".......m........",".......m........","........m.......","........m.......","................","................","................","................","...g............","..ggt.....g..g..",".........ggt....","................"]}
};
// ROUTE_TO_GOVERNOR E6/E7 (D1869, yellow, settled): Route 4's three new tiles (y reeds, h drystone wall, l mown lawn) and its
// roadside props, PAL keys only, drawn from the packet's descriptions. water_trough and notice_board reuse built art.
const ROUTE4_ART = {
  tiles: {
    y: ["gggtggglggggtggg", "gglgggtyggglgtgg", "ggyggggyggtyggyg", "gtygglgyggtyglyg", "gtyggyglgttygyyg", "gtlggygygltyggyl", "ttlgtygygltylgyl", "ttytlyglgyttytyl", "gtytyyglgytltlyg", "gtltylgytyltylyg", "ttylyytlyyltyyyt", "tlyttyyttyltlyyt", "ttlttlyttlttltyt", "ttttttttttttttlt", "gtttgtttttgtttgt", "gggggggggggggggg"],
    h: ["dhhhdmmmhdhhhmmd", "hhwhdmhmhdhwhhmd", "hhhmdmmmmdhhhmmd", "dddddddddddddddd", "mmdhhhhmdmmmhhhd", "mhdhwhhmdmlmhwhd", "mmdhhhmmdmmmhhmd", "dddddddddddddddd", "hhhmdmmmhhdhhhmd", "hwhmdmlmhwdhhmmd", "hhmmdmmmmhdhmmmd", "dddddddddddddddd", "mmhhhdmmmhhhdmmm", "mlhwhdmhmwhhdmhm", "mmhhmdmmmhhmdmmm", "kkkkkkkkkkkkkkkk"],
    l: ["gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "tgtgtgtgtgtgtgtg", "gtgtgtgtgtgtgtgt", "tgtgtgtgtgtgtgtg", "gtgtgtgtgtgtgtgt", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "gggggggggggggggg", "tgtgtgtgtgtgtgtg", "gtgtgtgtgtgtgtgt", "tgtgtgtgtgtgtgtg", "gtgtgtgtgtgtgtgt"],
  },
  art: {
    milestone: ["................", "................", "................", "....dddddddd....", "....hwwhhhhm....", "....hwhhhhhm....", "....hmmmmhhm....", "....hhhhhhhm....", "....hmmmhhhm....", "....hhhhhhhm....", "....hmmmmhhm....", "....hhhhhhhm....", "....hhhhhhhm....", "...dhhhhhhhmd...", "...gddddddddg...", "................"],
    finger_post: ["................", "................", ".......ddd......", ".......dod......", "..dddddddoddd...", ".dyyyyyyyyyyyd..", "dyoooooooooood..", ".dyyyyyyyyyyyd..", "..dddddddoddd...", ".......dod......", "...ddddddodddd..", "..dyyyyyyyyyyyd.", "..dooooooooooood", "..dyyyyyyyyyyyd.", "...ddddddodddd..", ".......dod......", ".......dod......", ".......dod......", "......ddoddd....", "......dyyyyd....", "......doooodd...", "......dyyyyd....", "......ddoddd....", ".......dod......", ".......dod......", ".......dod......", ".......dod......", ".......dod......", ".......dod......", "......ddoddd....", ".....gddddddg...", "................"],
    road_bar: ["................", "................", "................", "................", ".kk..........kk.", ".dk..........dk.", "kkkkkkkkkkkkkkkk", "krrrrwwwwrrrrwwk", "krrrrwwwwrrrrwwk", "kkkkkkkkkkkkkkkk", ".dk..........dk.", ".dk..........dk.", ".dk..........dk.", ".dk..........dk.", "kdkk........kdkk", "................"],
    gate_arch_post: ["................", "....kkkkkkkk....", "...khhhhhhhhk...", "...kmmmmmmmmk...", "....kyyyyyyk....", "....kyooooyk....", "....kyooooyk....", "....kkyyyykk....", "....khhhhhhk....", "....khwhhhmk....", "....khhhhhmk....", "....khhhhhmk....", "....kmmmmmmk....", "....khhhhhmk....", "....khwhhhmk....", "....khhhhhmk....", "....khhhhhmk....", "....kmmmmmmk....", "....khhhhhmk....", "....khhhhhmk....", "....khwhhhmk....", "....khhhhhmk....", "....kmmmmmmk....", "....khhhhhmk....", "....khhhhhmk....", "....khhhhhmk....", "...khhhhhhhmk...", "...kmmmmmmmmk...", "..khhhhhhhhhmk..", "..kmmmmmmmmmmk..", "..kkkkkkkkkkkk..", "................"],
    capital_roofs: ["....................y...........", "...................yoy..........", "....y.............kkkkk.........", "...yoy...........krrrrrk........", "..kkkkk.........krrprrrrk.......", ".krrrrrk.......krrrrrrprrk......", "krrprrrrk.....krprrrrrrrrrk.....", "krrrrrprk....krrrrrprrrrrrrk....", "kprrrrrrrk..krrrrrrrrrrprrrrk...", "kCCCCCCCCk..kCCCCCCCCCCCCCCCk...", "kCyCCCyCCk..kCCyCCCCCyCCCCyCk...", "kCyCCCyCCk..kCCyCCCCCyCCCCyCk...", "kCCCCCCCCk..kCCCCCCCCCCCCCCCk...", "kkkkkkkkkk..kkkkkkkkkkkkkkkkk...", "................................", "................................"],
    capital_spire: [".......k........", ".......krr......", ".......krrr.....", ".......krr......", ".......k........", "......kmk.......", "......kmk.......", ".....kmhmk......", ".....kmhmk......", "....kmhhhmk.....", "....kmhhhmk.....", "...kmhhhhhmk....", "...kCCCCCCCk....", "...kCyCCCyCk....", "...kCCCCCCCk....", "...kkkkkkkkk...."],
    reed_clump: ["................", "......y.....y...", "......y..y..y...", "...y..l..y..l...", "...y..l..l..l...", "...l..l..l.yl...", "...l.ll..l.ll...", "...llgl.ll.lg...", "...lglg.lg.lg...", "..lglgglgglgg...", "..gtgtggtgtgtl..", "..tgtgttgtgtgt..", "..ttgttttgttt...", "...tttttttttt...", "....dddddddd....", "................"],
    clipped_tree: ["................", "................", "......kkkk......", "....kkggggkk....", "...kggllggggk...", "..kgglgggggtgk..", "..kglggggggtgk..", ".kgggggggggtttk.", ".kgggggggggtttk.", ".kggggggggttttk.", "..kgggggggtttk..", "..ktggggtttttk..", "...kttttttttk...", "....kkttttkk....", "......kkkk......", ".......dp.......", ".......dp.......", ".......dp.......", ".......dp.......", ".......dp.......", ".......dp.......", "......kdpk......", ".....kmmmmk.....", "....khhhhhhk....", "....khwhhhmk....", "....khhhhhmk....", "....kmmmmmmk....", "....kkkkkkkk....", "................", "................", "................", "................"],
    bin_tipped: ["................", "................", "................", "................", "................", "..kkkkkkkk......", ".kmmmmmmmhk.....", ".kmhhhhhhhkk....", ".kmhhhhhhhkdk...", ".kmmmmmmmhkdk...", "..kkkkkkkkkk....", "................", "..y.y.y..o.o.ww.", "..yyyyy..ooo.ww.", ".kkkkkkkkkkkkkk.", "................"],
    withy_bundle: ["................", "................", "................", ".....o.y.o......", "....oyoyoyo.....", "....oyoyoyo.....", "....oyoyoyo.....", "....ddddddd.....", "....oyoyoyo.....", "....oyoyoyo.....", "....oyoyoyo.....", "....ddddddd.....", "....oyoyoyo.....", "....oyoyoyo.....", "...gooyoyoog....", "................"],
  },
};
// BRIGHTGATE_LAYOUT v0.2 (design specs/BRIGHTGATE_LAYOUT.md §3.3, §9, §10 B01-B08, B37-B39; D2000 no mint): the city's new
// tiles by map char (I panel paving, L glide lane, x crossing, J planter kerb, b Cruiser stand bay, o Old Wick cobbles,
// d Lamp Works setts, O rail on setts, G company fence, V Concierge pad, N the clipped hedge at the city's edge, & a company
// flowerbed; lawns use Route 4's mown lawn `l`, which has no mint pixel) and Bright Mart's awning and lantern crate.
// PAL keys only, drawn from the packet's descriptions; no mint `l` anywhere. PLACEHOLDER art until Pia's pass.
const BRIGHTGATE_ART = {
    frames: {   // animated props: frames, then the shared beat in ms (every lamp on one timer, D1494)
      bg_lamp_ring_pulse: [["................", ".......yy.......", "....VyVVVVyV....", "....VVVVVVVV....", "......NNNN......", "......NwwN......", "......NyyN......", "......NwwN......", "......NNNN......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", "......dddd......", "......dddd......", "................"], ["................", "................", "....VyVVVVyV....", "....VVVVVVVV....", "......NNNN......", "......NwwN......", "......NwwN......", "......NwwN......", "......NNNN......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", "......dddd......", "......dddd......", "................"]],
    },
    tiles: {
      I: ["wwwwwwwhwwwwwwww", "wwwwwwwhwwwwwwww", "wwhwwwwhwwwwwwww", "wwwwwwwhwwwwwwww", "wwwwwwwhwwwwwwww", "wwwwwwwhwwwwwwww", "wwwwwwwhwwwwwwww", "hhhhhhhhhhhhhhhh", "wwwhwwwwwwwwwwwh", "wwwhwwwwwwwwwwwh", "wwwhwwwwwwwwwwwh", "wwwhwwwwwwhwwwwh", "wwwhwwwwwwwwwwwh", "wwwhwwwwwwwwwwwh", "wwwhwwwwwwwwwwwh", "hhhhhhhhhhhhhhhh"],
      L: ["mmmmmmmmmmmmmmmm", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh", "mmmmmmmmmmmmmmmm", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "hhwwmhwwhhwwmhww", "mmwwmmwwmmwwmmww", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh", "mmmmmmmmmmmmmmmm", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh"],
      x: ["mmmmmmmmmmmmmmmm", "mwwwhwwwmwwwhwww", "mwwwhwwwmwwwhwww", "mwwwhwwwmwwwhwww", "mwwwmwwwmwwwmwww", "hwwwmwwwhwwwmwww", "hwwwmwwwhwwwmwww", "hwwwmwwwhwwwmwww", "mwwwmwwwmwwwmwww", "mwwwhwwwmwwwhwww", "mwwwhwwwmwwwhwww", "mwwwhwwwmwwwhwww", "mwwwmwwwmwwwmwww", "hwwwmwwwhwwwmwww", "hwwwmwwwhwwwmwww", "hhhhmhhhhhhhmhhh"],
      J: ["dddddddddddddddd", "dggggggggggggggd", "dggtggggggggtggd", "dgggggggtggggggd", "dggggtgggggggggd", "dgggggggggtggggd", "dddddddddddddddd", "dddddddddddddddd", "dddddddddddddddd", "dddddddddddddddd", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "VVVVVVVVVVVVVVVV", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "kkkkkkkkkkkkkkkk"],
      b: ["VVVVVVVVVVVVVVVV", "Vhhhhhhhmhhhhhhh", "Vhhhhhhhmhhhhhhh", "Vhhhhhhhmhhhhhhh", "Vmmmmmmmmmmmmmmm", "Vhhhmhhhhhhhmhhh", "Vhhhmhhhhhhhmhhh", "Vhhhmhhhhhhhmhhh", "Vmhhmmhhmmhhmmhh", "Vhhhhhhhmhhhhhhh", "Vhhhhhhhmhhhhhhh", "Vhhhhhhhmhhhhhhh", "Vmmmmmmmmmmmmmmm", "Vhhhmhhhhhhhmhhh", "Vhhhmhhhhhhhmhhh", "VVVVVVVVVVVVVVVV"],
      o: ["CAAAABCAAAABCAAA", "AAAAABAAAAABAAAA", "AAAAABAAAAABAAAA", "FFFFFBFFFFFBFFFF", "BBBBBBBBBBBBBBBB", "BBCAAAABCAAAABCA", "BBAAAAABAAAAABAA", "BBAAAAABAAAAABAA", "BBFFFFFBFFFFFBFF", "BBBBBBBBBBBBBBBB", "CAAABCAAAABCAAAA", "AAAABAAAAABAAAAA", "AAAABAAAAABAAAAA", "AAAABAAAAABAAAAA", "FFFFBFFFFFBFFFFF", "BBBBBBBBBBBBBBBB"],
      d: ["mmmmmmmhmmmmmmmh", "mmmmmmmhmmmmmmmh", "dddddddhdddddddh", "hhhhhhhhhhhhhhhh", "mmmhmmmmmmmhmmmm", "mmmhmmmmmmmhmmmm", "dddhdddddddhdddd", "hhhhhhhhhhhhhhhh", "mmmmmmmhmmmmmmmh", "mmmmmmmhmmmmmmmh", "dddddddhdddddddh", "hhhhhhhhhhhhhhhh", "mmmhmmmmmmmhmmmm", "mmmhmmmmmmmhmmmm", "dddhdddddddhdddd", "hhhhhhhhhhhhhhhh"],
      O: ["mmmwhmmhmmmwhmmh", "mFFwhFFFFFFwhFFh", "dFFwhFFFFFFwhFFh", "hddwhddddddwhddh", "mmmwhmmmmmmwhmmm", "mmmwhmmmmmmwhmmm", "dFFwhFFFFFFwhFFd", "hFFwhFFFFFFwhFFh", "mddwhddddddwhddh", "mmmwhmmhmmmwhmmh", "dddwhddhdddwhddh", "hFFwhFFFFFFwhFFh", "mFFwhFFFFFFwhFFm", "mddwhddddddwhddm", "dddwhddddddwhddd", "hhhwhhhhhhhwhhhh"],
      G: ["wwwwwwwhwwwwwwww", "wNNwwwwhNNwwwwNN", "wyNwwwwhyNwwwwyN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "wNNwwwwhNNwwwwNN", "wNNwwwwhNNwwwwNN", "hNNhhhhhNNhhhhNN", "wNNhwwwwNNwwwwNN", "wNNhwwwwNNwwwwNN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "wNNhwwwwNNwwwwNN", "wNNhwwwwNNwwwwNN", "dddddddddddddddd", "hhhhhhhhhhhhhhhh"],
      V: ["dddddddddddddddd", "dyNNNNVVVVNNNNNN", "dNNNVVVVVVVVNNNN", "dNNVVNNNNNNVVNNN", "dNVVNNNNNNNNVVNN", "dNVNNNNNNNNNNVNN", "dVVNNNNyyNNNNVVN", "dVVNNNyyyyNNNVVN", "dVVNNNyyyyNNNVVN", "dVVNNNNyyNNNNVVN", "dNVNNNNNNNNNNVNN", "dNVVNNNNNNNNVVNN", "dNNVVNNNNNNVVNNN", "dNNNVVVVVVVVNNNN", "dNNNNNVVVVNNNNyN", "dNNNNNNNNNNNNNNN"],
      roof_bg_terracotta: ["FBGBBBBBFBGBBBBB", "FBBBBBBBFBBBBBBB", "FBBBBBBBFBBBBBBB", "FFFFFFFFFFFFFFFF", "BBBBFBGBBBBBFBGB", "BBBBFBBBBBBBFBBB", "BBBBFBBBBBBBFBBB", "FFFFFFFFFFFFFFFF", "FBGBBBBBFBGBBBBB", "FBBBBBBBFBBBBBBB", "FBBBBBBBFBBBBBBB", "FFFFFFFFFFFFFFFF", "BBBBFBGBBBBBFBGB", "BBBBFBBBBBBBFBBB", "BBBBFBBBBBBBFBBB", "FFFFFFFFFFFFFFFF"],
      wall_bg_cream: ["AAAAAAAAAAAAAAAA", "CCCCCACCCCCCCCCC", "CCCCCACCCCCCCCCC", "CCCCCACCCCCCCCCC", "CCCCCACCCCGCCCCC", "CCCCCACCCCCCCCCC", "CCCCCACCCCCCCCCC", "CCCCCACCCCCCCCCC", "AAAAAAAAAAAAAAAA", "CCCCCCCCCCCCACCC", "CCCCCCCCCCCCACCC", "CCCCCCCCCCCCACCC", "CCCGCCCCCCCCACCC", "CCCCCCCCCCCCACCC", "CCCCCCCCCCCCACCC", "FFFFFFFFFFFFFFFF"],
      N: ["tttttttttttttttt", "tggggggggggggggt", "tggtgggggggggtgt", "tggggggggtgggggt", "tggggggtgggggggt", "tggggggggggggggt", "tgggggggggggtggt", "tggggtgggggggggt", "tgtggggggggggggt", "tggggggggggggggt", "dddddddddddddddd", "tttttttttttttttt", "ttgttttgttttgttt", "tttttttttttttttt", "tttttttttttttttt", "kkkkkkkkkkkkkkkk"],
      "&": ["NNNNNNNNNNNNNNNN", "NttttttttttttttN", "NttgttttttttgttN", "NttVgtttgtttygtN", "NtttttttwgtttttN", "NttttttttttttttN", "NttttttttttttttN", "NttttgtttttttttN", "NttttVgtttgttttN", "NtttttttttwgtttN", "NttttttttttttttN", "NttgtttgttttgttN", "NttygttwgtttVgtN", "NttttttttttttttN", "NttttttttttttttN", "NNNNNNNNNNNNNNNN"],
    },
    art: {
      bg_awning: ["VVwwVVwwVVwwVVww", "VVwwVVwwVVwwVVww", "VVwwVVwwVVwwVVww", "VVwwVVwwVVwwVVww", "VVwwVVwwVVwwVVww", "VV..VV..VV..VV..", "................", "...NNNNNNNNNN...", "...NwwwsNsssN...", "...NssssNsssN...", "...NssssNsssN...", "...NssssNsssN...", "...NssssNsssN...", "...NNNNNNNNNN...", "...yyyyyyyyyy...", "................"],
      bg_lantern_crate: ["................", "................", "................", "....VV..VV.VV...", "....ww..ww.ww...", "....yw..yw.yw...", "....ww..ww.ww...", "....NN..NN.NN...", "..FFFFFFFFFFFF..", "..FGGGGGGGGGGF..", "..FGGGGGGGGGGF..", "..FFFFFFFFFFFF..", "..FGGGGGGGGGGF..", "..FGGGGGGGGGGF..", "..FFFFFFFFFFFF..", "................"],
      bg_rod: ["................", ".......mm.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", "....mmmmmmmm....", "...dddddddddd...", "...dddddddddd...", "...dddddddddd...", "................"],
      bg_rod_lit: [".......yw.......", "......ywwy......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", ".......yG.......", "....mmmmmmmm....", "...dddddddddd...", "...dddddddddd...", "...dddddddddd...", "................"],
      bg_coil: ["dddddddddddddddd", "dmymmmmmmmmmmymd", "dmmmmmmmmmmmmmmd", "dddddddddddddddd", "dmymmmmmmmmmmymd", "dmmmmmmmmmmmmmmd", "dddddddddddddddd", "dmymmmmmmmmmmymd", "dmmmmmmmmmmmmmmd", "dddddddddddddddd", "dmymmmmmmmmmmymd", "dmmmmmmmmmmmmmmd", "dddddddddddddddd", "dmymmmmmmmmmmymd", "dmmmmmmmmmmmmmmd", "dddddddddddddddd"],
      bg_lamp_ring: ["................", ".......yy.......", "....VyVVVVyV....", "....VVVVVVVV....", "......NNNN......", "......NwwN......", "......NyyN......", "......NwwN......", "......NNNN......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", "......dddd......", "......dddd......", "................"],
      bg_flame_lantern: ["................", "................", "................", ".....GGGGGG.....", ".....FFFFFF.....", ".....FyoyyF.....", ".....FyooyF.....", ".....FyooyF.....", ".....FyyyyF.....", ".....FFFFFF.....", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".....FFFFFF.....", ".....FFFFFF.....", "................"],
      bg_flame_lantern_swapped: ["................", "................", "................", ".....VVVVVV.....", ".....NNNNNN.....", ".....NwwwwN.....", ".....NwwwwN.....", ".....NwyywN.....", ".....NwwwwN.....", ".....NNNNNN.....", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".....FFFFFF.....", ".....FFFFFF.....", "................"],
      bg_bright_board: ["................................................", "................................................", "................................................", "................................................", "..NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN..", "..NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN..", "..NNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNN..", "..NNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNN..", "..NNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVNN..", "..NNwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwNN..", "..NNwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwNN..", "..NNwwwhhhhhhhhhhhhhhhhhhhhwwwyyyyyyyyyywwwwNN..", "..NNwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwNN..", "..NNwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwNN..", "..NNwwwhhhhhhhhhhhhhhhhhhhhwwwyyyyyyyywwwwwwNN..", "..NNwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwNN..", "..NNwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwNN..", "..NNwwwhhhhhhhhhhhhhhhhhhhhwwwyyyyyywwwwwwwwNN..", "..NNwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwNN..", "..NNwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwNN..", "..NNwwwhhhhhhhhhhhhhhhhhhhhwwwyyyywwwwwwwwwwNN..", "..NNwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwNN..", "..NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN..", "..NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN..", "......NN................................NN......", "......NN................................NN......", "......NN................................NN......", "......NN................................NN......", "......NN................................NN......", "......NN................................NN......", "......NN................................NN......", "................................................"],
      bg_switch_board: ["................", "................", "................", "................", "................", "................", ".NNNNNNNNNNNNNN.", ".NwwwwwhwwwwwwN.", ".NwwwwwhwwwwwwN.", ".NwowowhwwwwwwN.", ".NwwwwwhwwwwwwN.", ".NwwwwwhwywwwwN.", ".NwwwwwhwwwwwwN.", ".NhhhhhhhhhhhhN.", ".NwwwwwhwwwwwwN.", ".NwowwwhwywwwwN.", ".NwwwwwhwwwwwwN.", ".NwwwwwhwwwwwwN.", ".NwwwwwhwwwwwwN.", ".NNNNNNNNNNNNNN.", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", "................", "................"],
      bg_shelter: ["................................", "................................", "................................", "................................", "................................", "................................", "..NNNNNNNNNNNNNNNNNNNNNNNNNNNN..", "..NNNNNNNNNNNNNNNNNNNNNNNNNNNN..", "..VNNVVVVVVVVVVVVVVVVVVVVVVNNV..", "...NNssssssssssssssssssssssNN...", "...NNwwwwwwssssssssssssssssNN...", "...NNwwwwwwssssssssssssssssNN...", "...NNwwwwwwssssssssssssssssNN...", "...NNwwwwwwssssssssssssssssNN...", "...NNssssssssssssssssssssssNN...", "...NNssssssssssssssssssssssNN...", "...NNssssssssssssssssssssssNN...", "...NNssssssssssssssssssssssNN...", "...NNssssssssssssssssssssssNN...", "...NNssssssssssssssssssssssNN...", "...NNssssssssssssssssssssssNN...", "...NN......................NN...", "...NN......................NN...", "...NN......................NN...", "...NN.dddddddddddddddddddd.NN...", "...NN.dddddddddddddddddddd.NN...", "...NN.hh................hh.NN...", "...NN.hh................hh.NN...", "...NN.hh................hh.NN...", "...NN.hh................hh.NN...", "................................", "................................"],
      bg_seam_post: ["................", "................", "................", "....VVVVVVVV....", "....VVVVVVVV....", "......NNNN......", "......NwwN......", "......NwwN......", "......NNNN......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......NN.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".......FF.......", ".....dddddd.....", ".....dddddd.....", "................"],
      bg_scaffold: ["................", "................", "................", "................", "..GG........GG..", "..GG........GG..", "..FFFFFFFFFFFF..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..FFFFFFFFFFFF..", "..GGGGGGGGGGGG..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..FFFFFFFFFFFF..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..GG........GG..", "..FFFFFFFFFFFF..", "..GG........GG..", "..GG........GG..", "................", "................"],
      bg_washing: ["................", "................", ".F............F.", ".hhhhhhhhhhhhhh.", ".F.ww.oo.CC.bbF.", ".F.ww.oo.CC.bbF.", ".F.ww.oo.CC.bbF.", ".F.ww.oo.CC.bbF.", ".F.ww.oo.CC.bbF.", ".F............F.", ".F............F.", ".F............F.", ".F............F.", ".F............F.", ".F............F.", "................"],
      bg_wagon: ["................................", "................................", "................................", "................................", "...mmmmmmmm.........mmmmmmmm....", "...mmmmmmmm.........mmmmmmmm....", ".GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.", ".FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.", "....dddd................dddd....", "....dddd................dddd....", "....dddd................dddd....", "................................", "................................", "................................"],
      bg_baskets: ["................", "................", "................", "................", "....oF..oF.oF...", "....FF..FF.FF...", "....FF..FwwwF...", "....FF..FwwwF...", "..GGGGGGGGGGGG..", "..GGGGGGGGGGGG..", "..FFFFFFFFFFFF..", "..GGGGGGGGGGGG..", "..GGGGGGGGGGGG..", "..FFFFFFFFFFFF..", "................", "................"],
      bg_pool_ring: ["................", "......VVVV......", "....VVVVVVVV....", "...VV......VV...", "..VV........VV..", "..V..........V..", ".VV..........VV.", ".VV..........VV.", ".VV..........VV.", ".VV..........VV.", "..V..........V..", "..VV........VV..", "...VV......VV...", "....VVVVVVVV....", "......VVVV......", "................"],
      bg_lanyard_gate: [".VVVVVVVVVVVVVV.", ".VVVVVVVVVVVVVV.", ".VVssssssssssVV.", ".VVswwsssssssVV.", ".VVswwsssssssVV.", ".VVswwsssssssVV.", ".VVswwsssssssVV.", ".VVswwsssssssVV.", ".VVswwsssssssVV.", ".VVswwsssssssVV.", ".VVswwsssssssVV.", ".VVssssssssssVV.", ".VVhhhhhhhhhhVV.", "NNNNNNNNNNNNNNNN", "NNNNNNNyyNNNNNNN", "NNNNNNNNNNNNNNNN"],
      bg_lanyard_rack: ["................", "................", ".NNNNNNNNNNNNNN.", ".NNNNNNNNNNNNNN.", "...y..y..y..y...", ".....VVVVVVVVV..", ".....VVVVVVVVV..", ".....VVVVVVVVV..", ".....VVVVVVVVV..", ".....VVVVVVVVV..", ".....VVVVVVVVV..", ".....VVVVVVVVV..", "......w..w..w...", "......Q..Q..Q...", "................", "................"],
      bg_insign_plaque: ["................", "................", "................", "..NNNNNNNNNNNN..", "..NyyyyyyyyyyN..", "..NyyyyyyyyyyN..", "..NyNNNNNNNNyN..", "..NyyyyyyyyyyN..", "..NyyNNNNNNyyN..", "..NyyyyyyyyyyN..", "..NyyyyyyyyyyN..", "..NNNNNNNNNNNN..", "................", "................", "................", "................"],
      bg_outcomes_board: ["................", "NNNNNNNNNNNNNNNN", "NwwwwwwwwwwwwwwN", "NwVhhwVhhwVhhwwN", "NwhhhwhhhwhhhwwN", "NwwwwwwwwwwwwwwN", "NwVhhwVhhwVhhwwN", "NwhhhwhhhwhhhwwN", "NwwwwwwwwwwwwwwN", "NwVhhwVhhwVhhwwN", "NwhhhwhhhwhhhwwN", "NwwwwwwwwwwwwwwN", "NyyyyyyyyyyyyyyN", "NNNNNNNNNNNNNNNN", "................", "................"],
    },
};
// CABINET_AND_COUNCILS v0.2.2 phase 1b: the Cabinet Room hc_gov_2 (14x12), as Vincent approved the rule-9 previews (Wed Nov 4,
// 2026: 14x12, the seat tells as drawn, a third floor tile). Drawn in the scratch layout draft from PAL keys only, no outside
// assets, no Glimmerwell key (the wine-red pins and the Treasury's ribbon are `r`). Tiles go to TILES; props are 16x16, or 16x32
// drawn up from their cell (the head chair, the charter case). The table is 3x5 and the towns map 3x1, sliced left to right, top
// to bottom. The room's library pieces (pa_*, pc_*, pv_*, pn_*) are PROP_LIBRARY_ART's (#319).
const CABINET_ROOM_ART = {
  tiles: {
    rug_civic_v: ["KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnbnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnbnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK","KynnnnnnnnnnnnyK"],
    rug_civic_h: ["KKKKKKKKKKKKKKKK","yyyyyyyyyyyyyyyy","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnbnnnnnnnnnnn","nnnnnnnnnnnnbnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","yyyyyyyyyyyyyyyy","KKKKKKKKKKKKKKKK"],
    rug_civic_turn: ["KynnnnnnnnnnnnyK","Kynnnnnnnnnnnnyy","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kynnnnnnnnnnnnnn","Kyyyyyyyyyyyyyyy","KKKKKKKKKKKKKKKK"],
    rug_civic_end: ["KKKKKKKKKKKKKKKK","yyyyyyyyyyyyyyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","nnnnnnnnnnnnnyKK","yyyyyyyyyyyyyyKK","KKKKKKKKKKKKKKKK"],
  },
  props: {
    cab_chair_r: ["...ddd..........","..dyFyd.........","..dFbFd.........","..dFnFd.........","..dFnFd.........","..dynFdddddd....","..dynFFFFmFFd...","..dFnFdddddFd...","..dFnbbbbbbbbd..","..dFmbnnnnnnnd..","..dFFbnnnnnnnd..","..dFFFFFFFFFFd..","..dFdFddddddFd..","..dFdFd....dFd..","..dFdFd....dFd..","...d.d......d..."],
    cab_chair_l: ["..........ddd...",".........dyFyd..",".........dFbFd..",".........dFnFd..",".........dFnFd..","....ddddddFnyd..","...dFFmFFFFnyd..","...dFdddddFnFd..","..dbbbbbbbbnFd..","..dnnnnnnnbmFd..","..dnnnnnnnbFFd..","..dFFFFFFFFFFd..","..dFddddddFdFd..","..dFd....dFdFd..","..dFd....dFdFd..","...d......d.d..."],
    cab_chair_r_new: ["...ddd..........","..dyFyd.........","..dFbFd.........","..dFbFd.........","..dFbFd.........","..dynFdddddd....","..dynFGGGGGFd...","..dFnFdddddFd...","..dFnbbbbbbbbd..","..dFnbnnnnnnnd..","..dFFbnnnnnnnd..","..dFFFyFyFyFyd..","..dFdFddddddFd..","..dFdFd....dFd..","..dFdFd....dFd..","...d.d......d..."],
    cab_chair_up: ["................","....dddddddd....","...dbbbbbbbbd...","...dbnnnnnnnd...","...dbnnnnnnnd...","...dbnnnnnnnd...","..dyFFFFFFFFyd..","..dFbbbbbbbbFd..","..dFbnnnnnnnFd..","..dFbnwyyynnFd..","..dFbnyyyynnFd..","..dFbnnnnnnnFd..","..dFbnnnnnnnFd..","..dFFFFFFFFFFd..","..dFddddddddFd..","...d........d..."],
    cab_chair_head: ["................","................","................","................","................","................","................","................","................","................","......dddd......","...dddyyyyddd...","..dyFFFFFFFFyd..","..dFbbbbbbbbFd..","..dFbnnnnnnnFd..","..dFbnnnnnnnFd..","..dFbnnnnnnnFd..","..dFbnnnnnnnFd..","..dFbnnnnnnnFd..","..dFbnnnnnnnFd..",".dAFbnnnnnnnFAd.",".dGFbnnnnnnnFGd.",".dFFFFFFFFFFFFd.",".dFbbbbbbbbbbFd.",".dFbnnnnnnnnnFd.",".dFbnnnnnnnnnFd.",".dFbnnnnnnnnnFd.","..dFFFFFFFFFFd..","..dFddddddddFd..","..dFd......dFd..","..dFd......dFd..","...d........d..."],
    cab_gallery_chair: ["..........ddd...",".........dFFFd..",".........dFCFd..",".........dFAFd..",".........dFAFd..","....ddddddFAFd..","...dFFFFFFFAFd..","...dFdddddFAFd..","..dCCCCCCCCAFd..","..dAAAAAAACAFd..","..dAAAAAAACFFd..","..dFFFFFFFFFFd..","..dFddddddFdFd..","..dFd....dFdFd..","..dFd....dFdFd..","...d......d.d..."],
    cab_seat_board: ["................","..FFFFFFFFFFFF..","..FddddddddddF..","..FdCCCCCCCCdF..","..FddddddddddF..","..FddddddddddF..","..FdydydydydyF..","..FddddddddddF..","..FddddddddddF..","..FdddyddmdddF..","..FddddddddddF..","..FFFFFFFFFFFF..","................","................","................","................"],
    cab_seat_board_full: ["................","..FFFFFFFFFFFF..","..FddddddddddF..","..FdCCCCCCCCdF..","..FddddddddddF..","..FddddddddddF..","..FdydydydydyF..","..FddddddddddF..","..FddddddddddF..","..FdddyddydddF..","..FddddddddddF..","..FFFFFFFFFFFF..","................","................","................","................"],
    cab_chute_pipe: ["......yGGF......","......yGGF......","......yGGF......",".....yyyyyy.....",".....FFFFFF.....","......yGGF......","......yGGF......","......yGGF......","......yGGF......","......yGGF......",".....yyyyyy.....",".....FFFFFF.....","......yGGF......","................","................","................"],
    cab_out_slot: ["................","................","....dddddddd....","...dyyyyyyyGd...","...dyyyyyyyGd...","...dyyyyyyyGd...","...dyddddddGd...","...dyyyyyyyGd...","...dyyyyyyyGd...","...dGGGGGGGGd...","....dGGGGGGd....","....dFFFFFFd....",".....dddddd.....","................","................","................"],
    cab_charter_case: ["................","................","................","................","................","................","................","..dddddddddddd..",".dGGGGGGGGGGGGd.",".dyyyyyyyyyyyyd.",".dywwhhhhhhhhyd.",".dywCCCCCCCChyd.",".dywCCCCCCCChyd.",".dywCmmmmmmChyd.",".dyhCCCCCCCChyd.",".dyhCmmmmmmohyd.",".dyhCCCCCCrChyd.",".dyhCmmmCrrChyd.",".dyhCCCCrrrrhyd.",".dyhCCCCCrrChyd.",".dyhhhhhhhhhhyd.",".dyyyyyyyyyyyyd.",".dAAAAAAAAAAAAd.",".dAGGGGGGGGGGGd.",".dAGGGGGGGGGGGd.",".dAGGGGGGGGGGGd.","..dFFddddddFFd..","..dFFd....dFFd..","..dFFddddddFFd..","..dGGGGGGGGGGd..","..dFFddddddFFd..","..dFFd....dFFd.."],
    cab_table_0: [".ddddddddddddddd","dGGGGGGGGGGGGGGG","dGFFFFFFFFFFFFFF","dGFFFFFFFFFFFFFF","dGFFbbbbbbbbbbbb","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnCCCCCCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnChhhwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCCCCCCCnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn"],
    cab_table_1: ["dddddddddddddddd","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","bbbbbbbbbbbbbbbb","nnnnnnnnnnnnnnnn","nCwwwwwwwwCCCCCn","nCwwwwwwwwwwCdCn","nCwhhhhwwwwwCCdn","nCwwwhhhhhhwCCCy","nCwwwwwwwwwwCCCn","nCwwwhhhhhwwwwCn","nCwwwwwwwwwwwhCn","nCCCwwwwwwwwCCCn","nCCCCCCCCCCCCCCn","nnnnnnnnnnnnnnnn"],
    cab_table_2: ["ddddddddddddddd.","GGGGGGGGGGGGGGGd","FFFFFFFFFFFFFFFd","FFFFFFFFFFFFFFFd","bbbbbbbbbbbbFFFd","nnnnnnnnnnnnFFFd","nnnnAAArAAAnFFFd","nnnCGGGrGGGnFFFd","nnnCGGGrGGGnFFFd","nnnCrrrrrrrnFFFd","nnnCGGGrGGGnFFFd","nnnCGGGrGGGnFFFd","nnnCwwwwCCnnFFFd","nnnCCCCCCCnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd"],
    cab_table_3: ["dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnCCCCCCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnChhhwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCCCCCCCnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn"],
    cab_table_4: ["nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnwwhnnnnnn","nnnnnnnwwhwnnnnn","nnnnnnnwwhnnnnnn","nnnnnnnwwhnnnnnn","nnnnnnnwwhnnnnnn","nnnnnnnnnnnnnnnn"],
    cab_table_5: ["nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnCCCCCCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCwwwwCCnnFFFd","nnnChhhwCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCCCCCCCnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd"],
    cab_table_6: ["dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnCCCCCCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnChhhwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCCCCCCCnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn"],
    cab_table_7: ["nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnwnnnnnnn","nnnnnnnynnnnnnnn","nnnnnnddddnnnnnn","nnnnnnddddnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn"],
    cab_table_8: ["nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnCCCCCCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCwwwwCCnnFFFd","nnnChhhwCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCCCCCCCnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd"],
    cab_table_9: ["dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnCCCCCCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnChhhwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCCCCCCCnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn"],
    cab_table_10: ["nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnoynnnnnnn","nnnnnnnyynnnnnnn","nnnnnnnyynnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn","nnnnnnnnnnnnnnnn"],
    cab_table_11: ["nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnCCCCCCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCwwwwCCnnFFFd","nnnChhhwCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCCCCCCCnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd"],
    cab_table_12: ["dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnnnnnnnnnnn","dGFFbnCCCCCCCnnn","dGFFbnCwwwwCCnnn","dGFFbnCwwwwCCnnn","dGFFFFChhhwCCFFF","dGFFFFCwwwwCCFFF","dGFFFFCwwwwCCFFF","dFFFFFFFFFFFFFFF",".ddddddddddddddd",".ddddddddddddddd",".dFFd...........",".dFFd...........","..dd............"],
    cab_table_13: ["nnnnCCCCCCCCnnnn","nnnnCwwwwwCCnnnn","nnnnCwwwwwCCnnnn","nnnnCwwwwwCCnnnn","nnnnCwwwwwCCnnnn","nnnnCCCCCCCynnnn","nnnnnnnnnnnnnnnn","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","dddddddddddddddd","dddddddddddddddd","......dFFd......","......dFFd......",".......dd......."],
    cab_table_14: ["nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnnnnnnnnnnFFFd","nnnCCCCCCCnnFFFd","nnnCwwwwCCnnFFFd","nnnCwwwwCCnnFFFd","FFFChhhwCCFFFFFd","FFFCwwwwCCFFFFFd","FFFCwwwwCCFFFFFd","FFFFFFFFFFFFFFFd","ddddddddddddddd.","ddddddddddddddd.","...........dFFd.","...........dFFd.","............dd.."],
    cab_towns_map_0: ["................",".GGGGGGGGGGGGGGG",".FFFFFFFFFFFFFFF",".FFCCCCCCCCCCCCC",".FFCCCCCCCCCDCCC",".FFCCCCDDDDDDyDD",".FFCCDDyDDDDDFDD",".FFCDDDFDDDDDDDD",".FFCnDDDDDnnnnnD",".FFCCnnnnnDDDDDn",".FFCCCCCCCCCDCCC",".FFFFFFFFFFFFFFF",".FFFFFFFFFFFFFFF","................","................","................"],
    cab_towns_map_1: ["................","GGGGGGGGGGGGGGGG","FFFFFFFFFFFFFFFF","CCCCCCCCCCCCCCDC","CCCCCCCDDDDDDDDD","DDCCCDrDDDyDDDDD","DDDDDDFDDDFDDDDD","DDyDDDDDDDDDDDDD","DDFDnnnnnDDDDDnn","nnnnCCCCCnnnnnDC","CCCCCCCCCCCCCCCC","FFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFF","................","................","................"],
    cab_towns_map_2: ["................","GGGGGGGGGGGGGGG.","FFFFFFFFFFFFFFF.","CCCCCCCCCCCCCFF.","DDDDDDCCCCCCCFF.","DDDDDDDDCCyCCFF.","DyDDDDDDDCFCCFF.","DFDDDDyDDDDDCFF.","nnnDDDFDnnnnDFF.","CCCrnnnnDDDDCFF.","CCCFCCCCDCCCCFF.","FFFFFFFFFFFFFFF.","FFFFFFFFFFFFFFF.","................","................","................"],
    cab_sideboard_0: [".....dddd.......","....dwwwhd......","....dwwwhwd...dd","....dwwwhd...dwh",".ddddwwwhdddddhh","dAAAAAAAAAAAAyyy","dAGGGGGGGGGGGGGG","dAGGGGGGGGGGGGGG","dFFFFFFFFFdFFFFF","dFFFFFFFFFdFFFFF","dFFFFFFFyFdFyFFF","dFFFFFFFFFdFFFFF","dFFFFFFFFFdFFFFF",".dFFdddddd.ddddd",".dFFd...........","..dd............"],
    cab_sideboard_1: ["................","................",".dd.dd..........","dwhdwhd.........","dhhdhhddddddddd.","yyyyyyyAAAAAAAAd","GGGGGGGGGGGGGGGd","GGGGGGGGGGGGGGGd","FFFFFdFFFFFFFFFd","FFFFFdFFFFFFFFFd","FFFyFdFyFFFFFFFd","FFFFFdFFFFFFFFFd","FFFFFdFFFFFFFFFd","ddddd.ddddddFFd.","...........dFFd.","............dd.."],
  },
};
// WAR_MUSEUM v0.1.1 (design specs/WAR_MUSEUM.md; D2301, rule 9 previews approved by Vincent, Thu Nov 5, 2026): the Muster Road
// Museum's own art, the packet's art asks (§9) as drawn in the approved previews (specs/war_museum_preview/src, render_room.py and
// ext_art.py), pixel for pixel, so the build matches what Vincent saw. PAL keys only, no outside assets, no mint (s) anywhere;
// wine (V) only on the Wing pieces and the Wing banner. Tiles go to TILES; props are 16x16, 16x32 drawn up from their cell, or
// 32x16, also sliced <id>_0 and <id>_1 so a room places one slice per blocking cell (as the prop library does). The exterior
// pieces (ext) are E1 Banner Front's: the lintel (48x16, over the door), the two banners and the print decal. A-W1 (the old
// lantern shelf) is the prop library v0.2 lantern shelf, which landed, so it is not drawn here (§5.2). City only, like the room.
const WAR_MUSEUM_ART = {
  tiles: {
    floor_wing: ["IIIIIIIIIIIIIIII","ICCCCCCCCCCCCCCC","ICCCCCCCCCCCCCCC","ICCCCCCCCCCCCCCC","ICCCwCCCCCCCCCCC","ICCCCCCCCCCCCCCC","ICCCCCCCCCCCCCCC","ICCCCCCCCCCCCCCC","IIIIIIIIICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCwCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC"],   // A-F1
    floor_wing_b: ["IIIIIIIIIIIIIIII","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCACCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC","ICCCCCCCICCCCCCC"],   // A-F1
    runner_museum_w: ["GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA","GGAAAAAAAAAAAAAA"],   // A-F13
    runner_museum_e: ["AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG","AAAAAAAAAAAAAAGG"],   // A-F13
  },
  props: {
    wm_notice: ["..FFFFFFFFFFFF..","..FCCCCCCCCCCF..","..FCddddddddCF..","..FCCCCCCCCCCF..","..FCCmmmmmmCCF..","..FCCCCCCCCCCF..","..FCCCCCCCCCCF..","..FCCCCCCCCCCF..","..FCCCCCCCCCCF..","..FCCCCCCCCACF..","..FCACCCCCCCCF..","..FFFFFFFFFFFF..","................","................","................","................"],   // A-W3
    wm_plates_0: ["................",".FFFFFF..FFFFFF.",".FCCCCF..FCCCCF.",".FCCCCF..FCCCCF.",".FCCCCF..FCCCCF.",".FFFFFF..FFFFFF.","................",".FFFFFF..FFFFFF.",".FCCCCF..FCCCCF.",".FCCCCF..FCCCCF.",".FCCCCF..FCCCCF.",".FFFFFF..FFFFFF.","................","................","................","................"],   // A-W4, 0 of 4 filled
    wm_plates_1: ["................",".FFFFFF..FFFFFF.",".FhhhhF..FCCCCF.",".FmmmmF..FCCCCF.",".FhhhhF..FCCCCF.",".FFFFFF..FFFFFF.","................",".FFFFFF..FFFFFF.",".FCCCCF..FCCCCF.",".FCCCCF..FCCCCF.",".FCCCCF..FCCCCF.",".FFFFFF..FFFFFF.","................","................","................","................"],   // A-W4
    wm_plates_2: ["................",".FFFFFF..FFFFFF.",".FhhhhF..FhhhhF.",".FmmmmF..FmmmmF.",".FhhhhF..FhhhhF.",".FFFFFF..FFFFFF.","................",".FFFFFF..FFFFFF.",".FCCCCF..FCCCCF.",".FCCCCF..FCCCCF.",".FCCCCF..FCCCCF.",".FFFFFF..FFFFFF.","................","................","................","................"],   // A-W4
    wm_plates_3: ["................",".FFFFFF..FFFFFF.",".FhhhhF..FhhhhF.",".FmmmmF..FmmmmF.",".FhhhhF..FhhhhF.",".FFFFFF..FFFFFF.","................",".FFFFFF..FFFFFF.",".FhhhhF..FCCCCF.",".FmmmmF..FCCCCF.",".FhhhhF..FCCCCF.",".FFFFFF..FFFFFF.","................","................","................","................"],   // A-W4
    wm_plates_4: ["................",".FFFFFF..FFFFFF.",".FhhhhF..FhhhhF.",".FmmmmF..FmmmmF.",".FhhhhF..FhhhhF.",".FFFFFF..FFFFFF.","................",".FFFFFF..FFFFFF.",".FhhhhF..FhhhhF.",".FmmmmF..FmmmmF.",".FhhhhF..FhhhhF.",".FFFFFF..FFFFFF.","................","................","................","................"],   // A-W4
    wm_chapter: ["dGGGGGGGGGGGGGGd","dGCCCCCGFCCCCCGd","dGCJmmCGFCmmmCGd","dGCCCCCGFCCCCCGd","dGCmmmCGFCmmmCGd","dGCCCCCGFCCCCCGd","dGCmmmCGFCCCCCGd","dGCCCCCGFCCCCCGd","dGCmmmCGFCCCCCGd","dGCCCCCGFCCCCCGd","dGCCCCCGFCCCCCGd","dGGGGGGGGGGGGGGd",".dddddddddddddd.","................","................","................"],   // A-W5
    wm_lanterns_new: [".dddd.dddd.dddd.","dVVVVdVVVVdVVVVd","hhhhhhhhhhhhhhhh","hwwwwhwwwwhwwwwh","hwywwhwywwhwywwh","hwwwwhwwwwhwwwwh","hwwwwhwwwwhwwwwh","hwwwwhwwwwhwwwwh","hhhhhhhhhhhhhhhh","dVVVVdVVVVdVVVVd","wwwwwwwwwwwwwwww","IIIIIIIIIIIIIIII","dddddddddddddddd","................","................","................"],   // A-W2
    wm_wing_panel: ["NVVVVVVVVVVVVVVN","NVVVVVVVVVVVVVVN","NCCCCCCCCCCCCCCN","NCCCCCCVVCCCCCCN","NCCCCCwwwwCCCCCN","NCCCCCwwwwCCCCCN","NCCCCCwwwwCCCCCN","NCCCCCwwwwCCCCCN","NCCCCCwwwwCCCCCN","NCCCCCCCCCCCCCCN","NCChhhhhhhhhhCCN","NCCCCCCCCCCCCCCN",".NNNNNNNNNNNNNN.","................","................","................"],   // A-W6
    wm_sponsor: ["..NNNNNNNNNNNN..",".NVVVVVVVVVVVVN.",".NVVVVVVVVVVVVN.",".NVVyyyyyyyyVVN.",".NVVyyyyyyyyVVN.",".NVVyGGGGGGyVVN.",".NVVyyyyyyyyVVN.",".NVVyGGGGyyyVVN.",".NVVyyyyyyyyVVN.",".NVVVVVVVVVVVVN.",".NVVVVVVVVVVVVN.","..NNNNNNNNNNNN..","................","................","................","................"],   // A-W7
    wm_case_empty: ["..dddddddddddddddddddddddddddd..",".dwwwwwwwwwwwwwwwwwwwwwwwwwwwmd.",".dhwwwwwwwwwwwwwwwwwwwwwwwwwwmd.",".dhwwwwwwwwwwwwwwwwwwwwwwwwwwmd.",".dhwwwwwwwwwwwwwwwwwwwwwwwwwwmd.",".dhwwwwwwwwwwwwwwwwwwwwwwwwwwmd.",".dhwwwwwwwwwwCCCCCCwwwwwwwwwwmd.",".dhwwwwwwwwwwCCCCCCwwwwwwwwwwmd.",".dhhhhhhhhhhhhhhhhhhhhhhhhhhhmd.","dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dddddddddddddddddddddddddddddd."],   // A-F2, 2x1
    wm_mapcase: ["................................","................................",".dddddddddddddddddddddddddddddd.","dwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwd","dGAAAAAAAAAAAAttttCCCCCCCCCCCCGd","dGAAAAAAAAAAAAttttCCCCCCCCCCCCGd","dGAJAAAAAdAAAAttttCCCCCCCCCCCCGd","dGAAAAAdAAAAAAttttCCCCCCCCCCCCGd","dGAAAdAAAAAdyAttttCCCCCCCCCCCCGd","dGAAAAAAAAAAAAttttCCCCCCCCCCCCGd","dGAAAAAAAAAAAAttttCCCCCCCCCCCCGd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd",".dFFddddddddddddddddddddddddFFd.",".dFFd......................dFFd.",".dFFd......................dFFd.","..dd........................dd.."],   // A-F3, 2x1
    wm_road_lantern: ["................","................","................","................","................","................","................","................",".....dddddd.....",".....dddddd.....","....dddddddd....","....dyyyyyyd....","....dywyyyyd....","....dyyyyyyd....","....dyyyyyyd....","....dyyyyyyd....","....dyyyyyyddd..","....dyyyyyyGGGd.","....dyyyyyyGGGd.","....dyyyyyyGGGd.","....ddddddddFd..","....ddddddddd...",".....dddddd.....","...dddddddddd...","..dCCCCCCCCCmd..","..dIIIIIIIIImd..","..dIIIIIIIIImd..","..dIIIIIIIIImd..","..dIIIIIIIIImd..","..dIIIIIIIIImd..","..dIIIIIIIIImd..","..dIIIIIIIIImd.."],   // A-F4, 1x2
    wm_cart: ["..........dddddddd..............","..........dyyyyyyd..............","..........dywyyyyd..............","..........dyyyyyyd..............","..........dyyyyyyd..............","....dddddddddddddddddddd........","...dAAAAAAAAAAAAAAAAAAAAd....dd.","...dGGGGGGGGGGGGGGGGGGGGdddddmmd","...dGGGGGGGGGGGGGGGGGGGGFFFFFmmd","...dGGGGFGGGGGGGGGGGFGGGddddddd.","...dFFFFFFFFFFFFFFFFFFFFd.......","....ddFFFFFdddddddFFFFFd........","....dFFFmFFFd...dFFFmFFFd.......",".....dFFFFFd.....dFFFFFd........",".....dFFFFFd.....dFFFFFd........","......ddFdd.......ddFdd........."],   // A-F5, 2x1
    wm_scout_lamp: ["................","......dddd......",".....dGGGGd.....","....dGGGGGGdd...","....dGmmmmGGGd..","....dGmmmFGGGd..","....dGmmmmGGGd..","....dGmmmmGdd...","....dGGGGGGd....","...dddddddddd...","..dCCCCCCCCCCd..","..dIIIIIIIIIId..","..dIIIIIIIIIId..","..dIIIIIIIIIId..","..dIIIIIIIIIId..","...dddddddddd..."],   // A-F6
    wm_drum: ["................","................","................","................","........d.......","....ddddGdddd...","...dFGGGFGGGFd..","..dGFGGGFGGGFGd.",".dGGFAAAFAAAFGGd",".dGGFAAAFAAAFGGd",".dGGFAAAFAAAFGdd","dGGAFAAAFAAAFAGG",".dGGFAAAFAAAFGGd",".dGGFAAAFAAAFGGd",".dGGFAAAFAAAFGGd","..dGFGGGFGGGFGd.","...ddGGGGGGGdd..","..dFFdddGddFFd..","..dFFddddddFFd..","..dFFyyyyyyFFd..","..dFFyyyyyyFFd..","..dFFyyyyyyFFd..","..dFFddddddFFd..","..dFFFFFFFFFFd..","..dFFddddddFFd..","..dFFVCCCCVFFd..","..dFFVCCCCVFFd..","..dFFVCCCCVFFd..","..dFFddddddFFd..","..dFFd....dFFd..","...dd......dd...","................"],   // A-F7, 1x2
    wm_letters: ["................","..dddddddddddd..",".dGGGGGGGGGGGGd.",".dGhhhhhhhhhhGd.",".dGhwwwwwwwwhGd.",".dGhwwwwwwwwhGd.",".dGhwAAAAAAwhGd.",".dGhwCCCCCCwhGd.",".dGhwCCCCCCwhGd.",".dGhwwwwwwwwhGd.",".dGhwwwwwwwwhGd.",".dGhwAAAAAAwhGd.",".dGhwCCCCrCwhGd.",".dGhwCCCCCCwhGd.",".dGhwwwwwwwwhGd.",".dGhwwwwwwwwhGd.",".dGhwAAAAAAwhGd.",".dGhwCCCCCCwhGd.",".dGhwCCCCCCwhGd.",".dGhwwwwwwwwhGd.",".dGhwwwwwwwwhGd.",".dGhwAAAAAAwhGd.",".dGhwCCCCCCwhGd.",".dGhwCCCCCCwhGd.",".dGhwwwwwwwwhGd.",".dGhwwwwwwwwhGd.",".dGhhhhhhhhhhGd.",".dGFFFFFFFFFFGd.",".dGFFFFFFFFFFGd.",".dGFFFFFFFFFFGd.","..dddddddddddd..","................"],   // A-F8, 1x2
    wm_donation: ["....dd....dd....","...dyyddddyyd...","...dywoooooyd...","...dyooooooyd...","...dyooddooyd...","...dyooooooyd...","...dyooooooyd...","...dyooooooyd...","...dyyyyyyyyd...","....dddFFddd....","......dFFd......","......dFFd......","......dFFd......",".....ddFFdd.....","....dFFFFFFd....",".....dddddd....."],   // A-F9
    wm_friends: ["................","..dddddddddddd..",".dyyyyyyyyyyyyd.",".dJJJJJJJJJJJJd.",".dJJJJJJJJJJJJd.",".dJJyyyyyyyyJJd.",".dJJyyyyyyyyJJd.",".dJJJJJJJJJJJJd.",".dJJyyyyyyyyJJd.",".dJJyyyyyyyyJJd.",".dJJJJJJJJJJJJd.",".dJJEEEEEEEEJJd.",".dJJEEEEEEEEJJd.",".dJJJJJJJJJJJJd.",".dJJEEEEEEEEJJd.",".dJJEEEEEEEEJJd.",".dJJJJJJJJJJJJd.",".dJJEEEEEEEEJJd.",".dJJEEEEEEEEJJd.",".dJJJJJJJJJJJJd.",".dJJJJJJJJJJJJd.",".dJJJJJJJJJJJJd.","..ddFFddddFFdd..","...dFFd..dFFd...","...dFFd..dFFd...","...dFFd..dFFd...","...dFFd..dFFd...","...dFFd..dFFd...","...dFFd..dFFd...","...dFFd..dFFd...","...dFFd..dFFd...","....dd....dd...."],   // A-F10, 1x2
    wm_stamp_table: ["................","................","................","................","....dd..dd......","...drrddJJdddd..","..dArrAAJJAooAd.",".dAAAAAAAAAooAAd","dBBAAAAAAAAAAABB",".dBBBBBBABBBBBBd","..dBBBBBBBBBBBd.","...ddddFFddddd..","......dFFd......","......dFFd......","......dFFd......",".......dd......."],   // A-F11
    wm_stool: ["................","................","................","................","................","................","........d.......",".....dddrddd....","....drrrrrrrd...","...drrrrrrrrrd..","....drrrrrrrd...","....dFddrdFd....","....dFd.ddFd....","....dFd..dFd....","....dFd..dFd....",".....d....d....."],   // A-F11b
    wm_rope_post: ["................","......dddd......",".....dyyyyd.....",".....dyyyyd.....","......dyyddddddd","......dyyJJJJJJJ","......dyyddddddd","......dyyd......","......dyyd......","......dyyd......","......dyyd......","......dyyd......",".....ddyydd.....","....dGGGGGGd....","....dGGGGGGd....",".....dddddd....."],   // A-F12
  },
  ext: {
    wm_x_lintel: ["................................................","dddddddddddddddddddddddddddddddddddddddddddddddd","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC","CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC","CCCCCCmmCCmmCCmmCCmmCCmmCCmmCCmmCCmmCCmmCCCCCCCC","CCCCCCmmCCmmCCmmCCmmCCmmCCmmCCmmCCmmCCmmCCCCCCCC","CCCCCCmmCCmmCCmmCCmmCCmmCCmmCCmmCCmmCCmmCCCCCCCC","CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC","CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","dddddddddddddddddddddddddddddddddddddddddddddddd","................................................","................................................","................................................","................................................"],   // A-X1, 3x1
    wm_x_banner_keeper: ["................","dddddddddddddddd",".dddddddddddddd.","..dyJJJJJJJJyd..","..dyJJJJJJJJyd..","..dyJJJJJJJJyd..","..dyJJJJJJJJyd..","..dyJJyyyyJJyd..","..dyJyyyyyyJyd..","..dyJyooooyJyd..","..dyJyowooyJyd..","..dyJyooooyJyd..","..dyJyooooyJyd..","..dyJyooooyJyd..","..dyJyyyyyyJyd..","..dyJJyyyyJJyd..","..dyJJJJJJJJyd..","..dyJJJJJJJJyd..","..dyJJJJJJJJyd..","..dyJyyyyyyJyd..","..dyJJJJJJJJyd..","..dyJJggggJJyd..","..dyJJJJJJJJyd..","..dyJJJJJJJJyd..","..dyJJJJJJJJyd..","...dJdJdJdJdJd..","..dJdJdJdJdJd...","...d.d.d.d.d....","................","................","................","................"],   // A-X2, 1x2
    wm_x_banner_wing: ["................","dddddddddddddddd",".dddddddddddddd.","..dVCCCCCCCCVd..","..dVCCCCCCCCVd..","..dVCCCCCCCCVd..","..dVCCCCCCCCVd..","..dVCCVVVVCCVd..","..dVChhhhhhCVd..","..dVChwwwwhCVd..","..dVChwwwwhCVd..","..dVChwwwwhCVd..","..dVChwwwwhCVd..","..dVChwwwwhCVd..","..dVChhhhhhCVd..","..dVCCVVVVCCVd..","..dVCCCCCCCCVd..","..dVCCCCCCCCVd..","..dVCCCCCCCCVd..","..dVCVVVVVVCVd..","..dVCCCCCCCCVd..","..dVCChhhhCCVd..","..dVCCCCCCCCVd..","..dVCCCCCCCCVd..","..dVCCCCCCCCVd..","...dCdCdCdCdCd..","..dCdCdCdCdCd...","...d.d.d.d.d....","................","................","................","................"],   // A-X3, 1x2
    wm_x_prints: ["................","................","................","................","...mmm..........","...mmm.....m....","...mmm...m...m..","...mmm..........","...mmm....mmm...","...mmm....mmm...","..........mmm...","...mmm..........","...mmm..........","................","................","................"],   // A-X4, decal
  },
};
// PROP_LIBRARY v0.2 (design specs/prop_library_2.json, verbatim). Art only: no map places these yet.
// Same entry shape as PROP_LIBRARY_ART, plus: theme; frames (extra frames after rows, slow loop, ms; reduced motion holds rows);
// phases (time-of-day faces registered as <id>_<phase>; picked, never animated).
const PROP_LIBRARY_2_ART = {
  "pt_cuckoo":{"set":"clock","theme":"home","cells":[1,1],"walk":false,"place":"wall","rows":[".......dd.......","......dFFd......",".....dFGGFd.....","....dFGAAGFd....","...dFFFFFFFFd...","...dGAdyrdAFd...","...dGAwwwwAFd...","...dGAwdwwAFd...","...dGAwdddAFd...","...dGAwwwwAFd...","..dgGFFFFFFFgd..","...ddyddddydd...",".....d....d.....","................","................","................"]},
  "pt_mantel":{"set":"clock","theme":"home","cells":[1,1],"walk":false,"place":"floor","rows":[".......dd.......","......dAAd......",".....dAAAAd.....","....dAGyyGFd....","....dAydwyFd....","....dAwddwFd....","....dAywwyFd....","....dAGyyGFd.d..","..ddFFFFFFFFdyd.",".dCCCCCCCCCCyyd.","dAAAAAAAAAAAAAAd","dGGGGGGGGGGGGGGd",".dFFFFFFFFFFFFd.","..dFdddFFdddFd..","..dFd..dd..dFd..","...d........d..."]},
  "pt_station":{"set":"clock","theme":"civic","cells":[1,1],"walk":false,"place":"wall","rows":["................",".d......dddd....","dhd....dbbbbd...","dmd...dcbwhbbd..","dmd..dbwwdwwwbd.","dmmddbbwwdwwwbbd","dmmmmbhwwdddwhbd","dmmddbwwwwwwwwbd","dmd.dbbwwwwwwnbd","dmd..dbwwwwwnbd.","dmd...dbbwhnbd..",".d.....dbbbbd...","........dddd....","................","................","................"]},
  "pt_longcase_keeper":{"set":"clock","theme":"keeper","cells":[1,2],"walk":false,"place":"floor","rows":["......dyyd......",".....dyooyd.....","...dddyyyyddd...","..dgyyyyyyyyyd..","..dgJJJJJJJJEd..","..dgJJydhyJJEd..","..dgJywdwwyJEd..","..dgJyhdddhJEd..","..dgJywwwwyJEd..","..dgJywwhwyJEd..","..dgJJyyyyJJEd..","..dyyyyyyyyyyd..","...dgJJJJJJEd...","...dgJJJJJJEd...","...dgJyyyyJEd...","...dgJnynnJEd...","...dgJnynnJEd...","...dgJnynnJEd...","...dgJnynnJEd...","...dgJnynnJEd...","...dgJyyynJEd...","...dgJyyonJEd...","...dgJnnnnJEd...","...dgJyyyyJEd...","...dgJJJJJJEd...","...dgJJJJJJEd...","..dGGGGGGGGGGd..","..dGFFFFFFFFFd..","..dGFFFFFFFFFd..","..dFFddddddFFd..","..dFFd....dFFd..","...dd......dd..."],"frames":[["......dyyd......",".....dyooyd.....","...dddyyyyddd...","..dgyyyyyyyyyd..","..dgJJJJJJJJEd..","..dgJJydhyJJEd..","..dgJywdwwyJEd..","..dgJyhdddhJEd..","..dgJywwwwyJEd..","..dgJywwhwyJEd..","..dgJJyyyyJJEd..","..dyyyyyyyyyyd..","...dgJJJJJJEd...","...dgJJJJJJEd...","...dgJyyyyJEd...","...dgJnynnJEd...","...dgJnynnJEd...","...dgJnnynJEd...","...dgJnnynJEd...","...dgJnnynJEd...","...dgJnyyyJEd...","...dgJnyyoJEd...","...dgJnnnnJEd...","...dgJyyyyJEd...","...dgJJJJJJEd...","...dgJJJJJJEd...","..dGGGGGGGGGGd..","..dGFFFFFFFFFd..","..dGFFFFFFFFFd..","..dFFddddddFFd..","..dFFd....dFFd..","...dd......dd..."]],"ms":900},
  "pt_wall_glimmer":{"set":"clock","theme":"glimmer","cells":[1,1],"walk":false,"place":"wall","rows":["................","..NNNNNNNNNNNN..",".NmNNNNNNNNNNNN.",".NNNVVVVVVVVNNN.",".NNVVwwdwwwVVNN.",".NNVwwwdwwwwVNN.",".NNVwwwdwwwwVNN.",".NNVwwwdddwwVNN.",".NNVwwQwwwwwVNN.",".NNVwQwwwwwwVNN.",".NNVVwwwwwwVVNN.",".NNNVVVVVVVVNNN.",".NNNNwwwwwwNNNN.","................","................","................"]},
  "pt_punch_glimmer":{"set":"clock","theme":"glimmer","cells":[1,1],"walk":false,"place":"wall","rows":["................","...........NNNN.","..NNNNNNNNNdmmmN",".NddddddddNdwwQN",".NdNNVVVQNNddddN",".NdNVwdwVNNdwwQN",".NdNVwddVNNddddN",".NdNVwwwVNNdwwQN",".NdNNVVVNNNddddN",".NdNwwwNNNNdddmN",".NdhwwhhhNNdmmmN",".NdNNNNNNNNdmmmN","..N........NNNN.","................","................","................"]},
  "pt_punch_works":{"set":"clock","theme":"kiln","cells":[1,1],"walk":false,"place":"wall","rows":[".....dd.........","....dhhd...dddd.","..dddmdddddhCCCd",".dhhhhhhhhdhwwFd",".dhmmyyymmdhddd.",".dhmywdwymdhwwFd",".dhmywddymdhddd.",".dhmywwwymdhwwFd",".dhmmyyymmdhddd.",".dhmwwwmmmdhddCd",".dhhwwhhhmdhCCCd",".dhmmmmmmmdhCCCd","..dddddddd.dddd.","................","................","................"]},
  "pt_sundial_plaque":{"set":"clock","theme":"civic","cells":[1,1],"walk":false,"place":"wall","rows":["................","..dddddddddddd..",".dwwwwwwwwwwwwd.",".dwCCCCCCCCCCId.",".dwCCCIodICCCId.",".dwICCIydICCIId.",".dwCICIydICICId.",".dwCCCCydCCCCId.","dIICCCIydICCCIId",".dwCIIoydCIICId.",".dwCCmmmmmmCCId.",".dwIIIIIIIIIIId.","..dddddddddddd..","................","................","................"],"phases":{"am":["................","..dddddddddddd..",".dwwwwwwwwwwwwd.",".dwCCCCCCCCCCId.",".dwCCCIoCICCCId.",".dwICCIyCICCIId.","..dCICIyCICICId.",".dwddCCyICCCCId.","dIICCdIyCICCCIId",".dwCIIoyCCIICId.",".dwCCmmmmmmCCId.",".dwIIIIIIIIIIId.","..dddddddddddd..","................","................","................"],"pm":["................","..dddddddddddd..",".dwwwwwwwwwwwwd.",".dwCCCCCCCCCCId.",".dwCCCIoCICCCId.",".dwICCIyCICCIId.",".dwCICIyCICICd..",".dwCCCCyICCCdId.","dIICCCIyCIddCIId",".dwCIIoyCdIICId.",".dwCCmmmmmmCCId.",".dwIIIIIIIIIIId.","..dddddddddddd..","................","................","................"]}},
  "pt_hourglass_stand":{"set":"clock","theme":"kiln","cells":[1,1],"walk":false,"place":"floor","rows":["....dddddddd....","...dAAAAAAAAd...","...dAGGGGGGGd...","...dFwoooowFd...","...dFwoooohFd...","...dFdwoowdFd...","...dFddywddFd...","...dFdwywwdFd...","...dFwwyywwFd...","...dFwyyyywFd...","...dGGGGGGGGd...","....dddGFddd....",".....dFFFFd.....","....dFddFdFd....","...dFd.dFddFd...","....d...d..d...."]},
  "pt_water_clock":{"set":"clock","theme":"kiln","cells":[1,2],"walk":false,"place":"floor","rows":["................","................",".....dddddd.....","....dAAAAAAd....",".....dABBBddd...",".....dABBBdBAd..",".....dABBBdddBd.","....dABBBBBd.d..","...dABBBBBBFdcd.","...dABBBBBBFdd..","...dABBCCBBFdcd.","...dABBdCBBFdd..","...dABBCCBBFdcd.","...dABBCCBBFdd..","...dABBdCBBFdcd.","...dAyyyyyoFdd..","...dABBCCBBFdcd.","...dABBdCBBFdd..","...dABBCCBBFdcd.","...dABBCCBBFdd..","...dABBdCBBFdcd.","...dABBCCBBFdd..","...dABBCCBBFddd.","...dABBBBBBCccCd","...dAFFFFFFCCCCd","..dddddddddIIIId",".dGGGGGGGGGGGGGd",".dGFFFFFFFFFFFFd",".dGFFFFFFFFFFFFd","..dFFdddddddFFd.","..dFFd.....dFFd.","...dd.......dd.."]},
  "pf_rolltop":{"set":"desk","theme":"home","cells":[2,1],"walk":false,"place":"floor","rows":["........dddddddddddddddddddddd..","...ddd.dAAAAAAAAAAAAAAAAAAAAAFd.","..dyyyddAFFFFFFFFFFFFFFFFFFFFFd.",".dyyyyydAGGGGGGGGGGGGGGGGGGGGFd.",".doyyyydAFFFFFFFFFFFFFFFFFFFFFd.","..dwydddACwCFCCwFCCwFCCCFCwCFFd.",".dddydddACCCFCwCFCCCFCwCFCCCFFd.","dCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCd","dCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd","dAGGGyGGGGFFFFFFFFFFFFAGGGyGGGGd","dAFFFFFFFFFFFFFFFFFFFFAFFFFFFFFd","dAGGGyGGGGFFFFFFFFFFFFAGGGyGGGGd","dAGGGGGGGGddddddddddddAGGGGGGGGd","dFFdddddFFd..........dFFdddddFFd",".dd.....dd............dd.....dd."]},
  "pf_clerk_high":{"set":"desk","theme":"civic","cells":[1,1],"walk":false,"place":"floor","rows":[".............d..","..dddddddddddyd.",".dAAAAAAAAAAyyd.",".dGwwwwhwwwwGGd.","dAAwwwwhwwwwAAAd","dAAwwwwhwwwwAAAd","dGGGGGGGbGGGGGGd","dFFFFFFFFFFFFFFd","dFFFFFFFFFFFFFFd",".dFddddddddddFd.",".dFddAAAAAGddFd.",".dFddGGGGGGddFd.",".dFddFddddFddFd.",".dFddFFFFFFddFd.",".dFddFddddFddFd.","..d..d....d..d.."]},
  "pf_drafting":{"set":"desk","theme":"civic","cells":[2,1],"walk":false,"place":"floor","rows":[".......dddddddddddddddddyyyd....","......dwwwwwwwwwwwwwwwwwyyymd...",".....dwCCwwwwwwwwwwwwwwwCwCdmd..",".....dwCCwbbbbbbbbbbbbwwCCCddmd.",".....dwCCwbwwwwbwwrwwbwwCCCddmd.","....dwCCCwbwwwwbbbbbbbwwCCCCdmd.","...dwCCCCwbwwwwbwwwwwbwwCCCCmd..","...dwCCCCwbbbbbbbbbbbbwwCCCCmd..","...dwCCCCCCCCCCCCCCCCCCCCCCCmd..","..dmmmmmmmmmmmmmmmmmmmmmmmmmmd..","..dGGGGGGGGGGGGGGGGGGGGGGGGGGd..","...dddGFdddddddddddddddGFdddd...","....dGFFFFFFFFFFFFFFFFFFFFd.....","....dGddFdddddddddddddGddFd.....","...dGd..dFd.........dGd..dFd....","....d....d...........d....d....."]},
  "pf_drafting_glimmer":{"set":"desk","theme":"glimmer","cells":[2,1],"walk":false,"place":"floor","rows":[".......NNNNNNNNNNNNNNNNNwwwN....","......NmmmmmmmmmmmmmmmmmwwwmN...",".....NmddwwwwwwwwwwwwwwwdhdNmN..",".....NmddwhhhhhhhhhhhhwwdddNNmN.",".....NmddwhwwwwhwwQwwhwwdddNNmN.","....NmdddwhwwwwhhhhhhhwwddddNmN.","...NmddddwhwwwwhwwwwwhwwddddmN..","...NmddddwhhhhhhhhhhhhwwddddmN..","...NmdddddddddddddddddddddddmN..","..NmmmmmmmmmmmmmmmmmmmmmmmmmmN..","..NVVVVVVVVVVVVVVVVVVVVVVVVVVN..","...NNNNdNNNNNNNNNNNNNNNNdNNNN...",".....NddddddddddddddddddddN.....",".....NNNdNNNNNNNNNNNNNNNNdN.....","....N...NdN..........N...NdN....",".........N................N....."]},
  "pf_front_counter_civic":{"set":"desk","theme":"civic","cells":[2,1],"walk":false,"place":"floor","rows":["......................dwdddwd...","......d...............dwdwdwd...",".....dyd.............dcwcwcwd...",".....dwyd..ddddddd...dbbbbbbd...",".ddddyyyyddwwwhwwwddddbbbbbbddd.","dwwwwoooowwhhhhhhhwwwwbbbbbbwwwd","dwCCCCCCCCCCCCCCCCCCCCCCCCCCCCCd","dIIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dCCCCCCCICCCCCCCICCCCCCCICCCCCId","dbbbbbbbIbbbbbbbIbbbbbbbIbbbbbId","dbbbbbbbIbbbbbbbIbbbbbbbIbbbbbId","dCCCCCCCICCCCCCCICCCCCCCICCCCCId","dnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnd","dnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnd",".dIIIIIIIIIIIIIIIIIIIIIIIIIIIId.","..dddddddddddddddddddddddddddd.."]},
  "pf_field_desk_keeper":{"set":"desk","theme":"keeper","cells":[2,1],"walk":false,"place":"floor","rows":["................dddd............","...............dJJJJd....ddd....","...............dJyyJd...dmmmd...","...ddddddddddd.dJooJddddhmmmmd..","..dCCCChhhCCCCddJooJdwhdmmmmmd..",".ddwwhhwwwhhwwddJyyJdhhdddddd.d.","dygwwwwnwwwwhwggJJJJgggggggggdyd","dgJJJJJJJJJJJJJJJJJJJJJJJJJJJJd.","dyEEEEEEEEEEEEEEEEEEEEEEEEEEEEyd",".dAddddddGddddddddddddAddddddGdd","..dAAddGGd............dAAddGGdd.","...ddyGdd..............ddyGdd..d","...ddGFdd..............ddGFdd.d.","..dGGddAAd............dGGddAAd.d",".dGdd..ddAd..........dGdd..ddAd.","..d......d............d......d.."]},
  "pf_exec_glimmer":{"set":"desk","theme":"glimmer","cells":[2,2],"walk":false,"place":"floor","rows":["................................","................................","...NNNNNNNNNNNNNNN.........NNN..","..NhhhhhhhhhhhhhhhN.......NmmmN.","..NmddddddmddddddmN.......NVmVN.","..NmdddVddmdwwwwdmN.......NVmVN.","..NmdddVVdmddddddmN.......NVmVN.","..NmdVdVVdmdhhhddmN.......NVmVN.","..NmdVdVVdmddddQdmN.......NwmVN.","..NmddddddmddddddmN........NmVN.","..NmmmmmmmmmmmmmmmN........NmwN.","...NNNNNNNmNNNNNNN.........NmN..",".NNNNNNNmmmmmNNNNNNNNNNNNNNNmNN.","NmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmN","NmNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.","NmNNNNwwwwNNNNNNNNQQQQQQQQQNNNN.","NmNNNNhhhhNNNQQNNNVwVVVVVVVNNNN.","NmNNyNNNNNNNNNNNNNVVVVVNNNVNNNN.","NmNNNNNNNNNNNNNNNNVVVVVVVVVNNNN.",".NNNNNNNNNNNNNNNNNNNNNNNNNNNNN..","...NNNNNNNNNNNNNNNNNNNNNNNNNN...","...NNNNNNNNNNNNNNNNNNNNNNNNNN...","..NmdddddddddddddddddddddddddN..","..NmVVVVVVVVVVVVVVVVVVVVVVVVVN..","..NmdddddddddddddddddddddddddN..","..NmdddddddddddddddddddddddddN..","..NmdddddddddddddddddddddddddN..","...NmmmmNNNNNNNNNNNNNNNNmmmmN...","....NNNN................NNNN....","....NNNN................NNNN....","................................","................................"]},
  "pf_school_double":{"set":"desk","theme":"civic","cells":[2,1],"walk":false,"place":"floor","rows":["......................d.........",".dddddddddddddd..dddddgdddddddd.","dCCCCCCCCCCCCCCddCCCCwrCCCCCCCCd","dAAhwhhhAAAAwAAddAAAArrAAAAAwAAd","dAAmmmwmAAAAdAAddAAAAAAAAAAAdAAd","dGGGGGGGGGGGGGGddGGGGGGGGGGGGGGd","dGGGGGGGGGGGGGGddGGGGGGGGGGGGGGd","dGGGGGGGGGGGGGGddGGGGGGGGGGGGGGd","dFFFFFFFFFFFFFFddFFFFFFFFFFFFFFd",".dFddddddddddFd..dFddddddddddFd.",".dFddddddddddFddddFddddddddddFd.",".dAAAAAAAAAAAAAAAAAAAAAAAAAAAAd.",".dAGGGGGGGGGGGGGGGGGGGGGGGGGGGd.",".dFFFFFFFFFFFFFFFFFFFFFFFFFFFFd.","..dFdddddddddddFFdddddddddddFd..","...d...........dd...........d..."]},
  "pf_bureau":{"set":"desk","theme":"home","cells":[1,2],"walk":false,"place":"floor","rows":["....dord........","....drrbd.......",".ddddrrbddddddd.","dCCCCCCCCCCCCCCd",".dAGGGGGGGGGGFd.",".dACCCFCCFCCCFd.",".dACwrFCCFCwCFd.",".dACCCFwCFCwCFd.",".dAFFFFFFFFFFFd.",".dACCCFCCFCCCFd.",".dACwCFCrFwCCFd.",".dACCCFCCFCCCFd.","ddAGGGGGGGGGGFdd","CCCwwwwwwCCCyyCC","CAAwhhhhwAyyAAAA","GGGGGGGGGGGGGGGG","ddAGGGGGGGGGGFdd",".dAGGyGGGGyGGFd.",".dAGGGGGGGGGGFd.",".dFFFFFFFFFFFFd.",".dAGGGGGGGGGGFd.",".dAGGyGGGGyGGFd.",".dAGGGGGGGGGGFd.",".dFFFFFFFFFFFFd.",".dAGGGGGGGGGGFd.",".dAGGyGGGGyGGFd.",".dAGGGGGGGGGGFd.",".dFFFFFFFFFFFFd.",".dFFddddddddFFd.",".dFFd......dFFd.","..dd........dd..","................"]},
  "pf_teller_grille":{"set":"desk","theme":"civic","cells":[2,1],"walk":false,"place":"floor","rows":[".dhhhhhhhhhhhhhd................",".dmdydydydydydmd................",".dmdydydydydydmd................",".dmdydydydydydmd.dddd.dddddddd..",".dmdydydddydydmddwwwwdyoFyyoFyd.",".dmmmmydddymmmmddhhhhdooooooood.","dwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwd","dwCCCCCCCCCCCCCCCCCCCCCCCCCCCCCd","dIIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dCCCCCCCCCICCCCCCCCCICCCCCCCCCCd","dbbbbbbbbbIbbbbbbbbbIbbbbbbbbbbd","dCCCCCCCCCICCCCCCCCCICCCCCCCCCCd","dnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnd","dnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnd",".dnddddddddddddddddddddddddddnd.","..d..........................d.."]},
  "pf_firing_desk":{"set":"desk","theme":"kiln","cells":[2,1],"walk":false,"place":"floor","rows":["..........dFFFFFFFFFd...........","..........dFCCCCCCCFd......dddd.","..dddddddddFCrrCCrCFddd.dddFyyFd",".dCCCCCCCCdFCCCCrCCFdCCdICdFooFd",".dwdwdwdwwdFCoCoCoCFdCCCdCCFooFd",".dwddddwdwdFFFFFFFFFdCCCdCCFyyFd",".dwwwwwwwwdddddddddddFFFFFFdddd.","dCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCd","dCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd","dGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGd",".dABBFBBGGGGGGGGGGGGGGGGABBFBBd.",".dABBFBBFFFFFFFFFFFFFFFFABBFBBd.",".dAFFFFFddddddddddddddddAFFFFFd.",".dAFBBBBd..............dAFBBBBd.",".dAFBBBBd..............dAFBBBBd.","..dddddd................dddddd.."]},
  "pf_host_desk":{"set":"desk","theme":"lantern","cells":[2,1],"walk":false,"place":"floor","rows":[".....................dyd...dFd..",".....................dood..dwd..","................d....dyod.dwdwd.","....ddddddddd..dyd...dood.dCCCd.","...dwwwwhwwwwd.dwyd.dAAAAddCCCd.",".dddwIIwhwIIwddyyyyddBBBBddIIId.","dwwwwwwwhwwwwwwoooowBBBBBBwwwwwd","dwCCCCCCCCCCCCCCCCCCCCCCCCCCCCCd","dIIIIIIIIIIIIIIIIIIIIIIIIIIIIIId","dDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDd","dEEEEEEEEEDEEEEEEEEEEDEEEEEEEEEd","dDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDd",".ddAFddddddddddddddddddddddAFdd.","..dAFd....................dAFd..","..dAFd....................dAFd..","...dd......................dd..."]},
  "pm_switchboard":{"set":"machine","theme":"keeper","cells":[1,2],"walk":false,"place":"floor","rows":["....dddddddd....","..ddyyyyyyyydd..",".dggggggggggggd.",".dgJJJJJJJJJJJd.",".dgddddddddddJyd",".dgdydydyhyddJyd",".dgddddddhdddwdw",".dgdydhdyhyddwdw",".dgdddhddhdddJhd",".dgdydhdydhddJd.",".dgdddhdddhddJd.",".dgdydhdydhddJd.",".dgdddhddhdddJd.",".dgddgdhddrddJd.",".dgddddhdhdddJd.",".dgddddhdddddJd.",".dgJJJJhJJhJJJd.",".dgJJJJJhJJhJJd.","dCCCCCCCCCCCCCCd","dCAAAAAAAAAAAAAd","dGGGGGGGGGGGGGGd",".dgJJJJJJJJJJEd.",".dgJCCCCCCCCJEd.",".dgJAAAyyAAAJEd.",".dgJAAAAAAAAJEd.",".dgJGGGGGGGGJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dJJddddddddJJd.",".dJJd......dJJd.",".dJJd......dJJd.","..dd........dd.."],"frames":[["....dddddddd....","..ddyyyyyyyydd..",".dggggggggggggd.",".dgJJJJJJJJJJJd.",".dgddddddddddJyd",".dgdydydyhyddJyd",".dgddddddhdddwdw",".dgdydhdyhyddwdw",".dgdddhddhdddJhd",".dgdydhdydhddJd.",".dgdddhdddhddJd.",".dgdydhdydhddJd.",".dgdddhddhdddJd.",".dgddgdhddFddJd.",".dgddddhdhdddJd.",".dgddddhdddddJd.",".dgJJJJhJJhJJJd.",".dgJJJJJhJJhJJd.","dCCCCCCCCCCCCCCd","dCAAAAAAAAAAAAAd","dGGGGGGGGGGGGGGd",".dgJJJJJJJJJJEd.",".dgJCCCCCCCCJEd.",".dgJAAAyyAAAJEd.",".dgJAAAAAAAAJEd.",".dgJGGGGGGGGJEd.",".dgJJJJJJJJJJEd.",".dgJJJJJJJJJJEd.",".dJJddddddddJJd.",".dJJd......dJJd.",".dJJd......dJJd.","..dd........dd.."]],"ms":700},
  "pm_telegraph_desk":{"set":"machine","theme":"keeper","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","...dd...d.ddd...","..dFodddydhmmd..","..dyyyyoydmhmd..","..ddddddddmmmd..",".dCCCCCCCCCCwwd.",".dCAAyyyFAAAAAwd",".dGGGGGGGGGGGGwd",".dFFFFFFFFFFFFdw","..dFddddddddFdwd","..dFd......dFwd.","..dFd......dFdwd","..dFd......dFddw","..dFd.......dwwd","...d.........dd."]},
  "pm_wire_set_home":{"set":"machine","theme":"home","cells":[1,1],"walk":false,"place":"floor","rows":[".......dd.......","......d..d......","..dddddddddddd..",".dAAAAAAAAAAAFd.",".dAGmmmmGGCCCFd.",".dAmwmmmmGAAAFd.",".dAmhhhhmGCCCFd.",".dAmmmmmmGAAAFd.",".dAmmmmmmGGGGFd.",".dAGmmmmGGyGyFd.",".dFFFFFFFFFFFFd.","..dFdFddddFdFd..","..dFdFd..dFdFd..",".dFd.d....d.dFd.",".dFd........dFd.","..d..........d.."]},
  "pm_ledger_engine_civic":{"set":"machine","theme":"civic","cells":[1,1],"walk":false,"place":"floor","rows":["....dddddddd....","...dnnnnnnnnd...","..dnbccccccbnd..","..dnbddddddbnd..","..dnbdddddybnd..","..dnbdydyddbnd..","..dnbdydydybnd..","..dnbddddddbnd..","..dnnnnnnnnnnwd.","..dnCCCCCCCCnwwd","..dnCwhwhwhCnwhd","..dnChwhwhwCndd.","..dnCCCCCCCCnd..","..dnCCCCyCCCnd..","..dnnnnnnnnnnd..","...dnnddddnnd..."]},
  "pm_punch_sorter_civic":{"set":"machine","theme":"civic","cells":[2,1],"walk":false,"place":"floor","rows":["...dwwd....dwwd........dwwd.....","..dwdwdddddwdwdddd.ddddwdwd.....","..dwwwdCCCdwwwdCCCdCCCdwwwd.....","..dCmCdCmCdCmCdCmCdCmCdCmCd.....",".ddCCCdCCCdCCCdCCCdCCCdCCCddd...","dwwwwwwwwwwwwwwwwwwwwwwwwwwwmddd","dhhhhhhhhhhhhhhhhhhhhhhhhhhhmyyy","dhhhhhhhhhhhhhhhhhhhhhhhhhhhmydy","dhhhhhhhhhbbbbbbbbbbhhhhhhhhmydd","dhhhhhhhhhbbbbbbbbbbhhhhhhhhmyd.","dhhhhhhhhhhhhhhhhhhhhhhhhhhhmd..","dmmmmmmmmmmmmmmmmmmmmmmmmmmmmd..","dnnnnnnnnnnnnnnnnnnnnnnnnnnnnd..","dnnnnnnnnnnnnnnnnnnnnnnnnnnnnd..",".dnndddddddddddddddddddddnndd...","..dd.....................dd....."]},
  "pm_punch_sorter_glimmer":{"set":"machine","theme":"glimmer","cells":[2,1],"walk":false,"place":"floor","rows":["..NVwwN...NVwwN.......NVwwN.....","..NwQwNNNNNwQwNNNN.NNNNwQwN.....","..NwwwNmmmNwwwNmmmNmmmNwwwN.....","..NmdmNmdmNmdmNmdmNmdmNmdmN.....",".NNmmmNmmmNmmmNmmmNmmmNmmmNNN...","NVVVVVVVVVVVVVVVVVVVVVVVVVVVdNNN",".NNNNNNNNNNNNNNNNNNNNNNNNNNNdmmm",".NNNNNNNNNNNNNNNNNNNNNNNNNNNdmNm",".NNNNNNNNNVVVVVVVVVVNNNNNNNNdmNd",".NNNNNNNNNVVVVVVVVVVNNNNNNNNdmNN",".NNNNNNNNNNNNNNNNNNNNNNNNNNNdN..","NddddddddddddddddddddddddddddN..",".NNNNNNNNNNNNNNNNNNNNNNNNNNNN...",".NNNNNNNNNNNNNNNNNNNNNNNNNNNN...","..NN.....................NN.....","................................"]},
  "pm_workstation_glimmer":{"set":"machine","theme":"glimmer","cells":[1,1],"walk":false,"place":"floor","rows":["...NNNNNNNNNN...","..NhmmmmmmmmmN..","..NmddddddddmN..","..NmdwwwwdddmN..","..NmddddddQdmN..","..NmddddddddmN..","..NmmmmmmmmmmN..","...NNNNmmNNNN...","...NNNNmmNNNN...","..NdQQQQQQQQdN..","...NVhVhVhVVN...","...NNNNNNNNNN...","...NdddNNNNQN...","...NNNNNNNNNN...","....NNNNNNNN....","................"]},
  "pm_wall_screen_glimmer":{"set":"machine","theme":"glimmer","cells":[1,1],"walk":false,"place":"wall","rows":["................","................",".NNNNNNNNNNNNNN.",".NddddddddddwdN.",".NdddddddddwwdN.",".NdddddddddQQdN.",".NdddddddQdQQdN.",".NdddQdddVdQQdN.",".NdQdVdQdVdQQdN.",".NdVdVdVdVdQQdN.",".NdhhhhhhhhhhdN.",".NNNNNNNNNNNNNN.","................","................","................","................"],"frames":[["................","................",".NNNNNNNNNNNNNN.",".NddddddddddwdN.",".NdddddddddwwdN.",".NdddddddQdQQdN.",".NdddQdddVdQQdN.",".NdQdVdQdVdQQdN.",".NdVdVdVdVdQQdN.",".NdVdVdVdVdQQdN.",".NdhhhhhhhhhhdN.",".NNNNNNNNNNNNNN.","................","................","................","................"]],"ms":1200},
  "pm_relay_cabinet":{"set":"machine","theme":"glimmer","cells":[1,2],"walk":false,"place":"floor","rows":["...NNNNNNNNNN...","..NmmmmmmmmmmN..","..NddddddddddN..","..NdNNNNNNNVN...","..NdhhhhhhNVN...","..NdhQdwdhNVN...","..NdhddddhNVN...","..NdhdwdQhNVN...","..NdhddddhNVN...","..NdhwdQdhNVN...","..NdhddddhNVN...","..NdhhhhhhNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNNNNNmNVN...","..NdNNNNNmNVN...","..NdNNNNNmNVN...","..NdNNNNNmNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNmmmmmNVN...","..NdNNNNNNNVN...","..NdNmmmmmNVN...","..NdNNNNNNNVN...","..NdNmmmmmNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNNNNNNNNN...","...NNN....NN....","................"],"frames":[["...NNNNNNNNNN...","..NmmmmmmmmmmN..","..NddddddddddN..","..NdNNNNNNNVN...","..NdhhhhhhNVN...","..NdhwdQdhNVN...","..NdhddddhNVN...","..NdhdQdwhNVN...","..NdhddddhNVN...","..NdhwdQdhNVN...","..NdhddddhNVN...","..NdhhhhhhNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNNNNNmNVN...","..NdNNNNNmNVN...","..NdNNNNNmNVN...","..NdNNNNNmNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNmmmmmNVN...","..NdNNNNNNNVN...","..NdNmmmmmNVN...","..NdNNNNNNNVN...","..NdNmmmmmNVN...","..NdNNNNNNNVN...","..NdNNNNNNNVN...","..NdNNNNNNNNN...","...NNN....NN....","................"]],"ms":800},
  "pm_hand_press":{"set":"machine","theme":"civic","cells":[2,2],"walk":false,"place":"floor","rows":["................................","......dddddddddddddddddd........",".....dhhhhhhhhhhhhhhhhhhd.......",".....dmmmmmmmmmmmmmmmmmmd.......",".....dmmmmmmmmmmmmmmmmmmd.......",".....dkkkkkkkkkkkkkkkkkkdddddd..",".....dhmmdddddhmdddddmmkyyyyyyd.",".....dhmmd..ddhmdd..dmmyodddoyyd",".....dhmmd.dmmmmmmd.dmyydoddodyy",".....dhmmd..ddhmdd..dmykddood.dy",".....dhmmd...dhmd...dmommdyyodoy",".dd..dhmmd...dhmd...dmykddyyd.dy","dwwdddhmmdddddhmdddddmykddood.dy","wwwwwwhmmdhhhhhhhhhhdmyydoddodyy","hhhhhhhmmdkkkkkkkkkkdmmyodddoyyd","wwwwwwhmmdddddddddddorrrryyyyyd.","hhhhhhhmmdddkkkkkkddrrrrrmmddd..","dddCCCCCCCCCCCCCCCCCCCCCCCCCCd..","..dCAAAAAAAAAAAAAAAAAAAAAAAAAd..","..dGGGGGGGGGGGGGGGGGGGGGGGGGGd..","..dFFFFFFFFFFFFFFFFFFFFFFFFFFd..","...dhmmmmddddddddddddmmkmmkdd...","...dhmmmmd..........dmmkmmkd....","...dhmmmmd..........dmmkmmkd....","...dhmmmmddddddddddddmmkmmkd....","...dhmmmmmmmmmmmmmmmmmmmmmkd....","...dhmmkkkkkkkkkkkkkkkkkmmkd....","...dhmmdddddddddddddddddmmkd....","...dhmmd...............dmmkd....","..dkkkkkd.............dkkkkkd...","...ddddd...............ddddd....","................................"]},
  "pm_sewing_machine":{"set":"machine","theme":"home","cells":[1,1],"walk":false,"place":"floor","rows":["..d..ddddddd....",".dmddmmmmmmmddd.",".dmdddyyddddyyyd",".dmdd.dddmddyoyd","ddmdd...dmydydyd","bcmddd..dmddyryy","bbbdbbdddddddrwr","CCCCCCCCCCCCCCCC","CAAAAAAAAAAAAAAA","GGGGGGGGGGGGGGGG","dFFFdddddddddddd","dFFdFFFd.ddddFFd","dFFddddddddddFFd","dFFddFFFFFFFdFFd","dFdd.dddddddFFd.",".d..........dd.."]},
  "pm_acorn_till":{"set":"machine","theme":"shop","cells":[1,1],"walk":false,"place":"floor","rows":["................","................",".....dddddd.....","....dyyyyyyd....","...dyddddddyd...","...dydyydydyd...","...dyddddddyd...","..doyyyyyyyyod..","..doywhwhwhyoyd.","..doyhwhwhwyod..","..doywhwhwhyod..","..dooooooooood..","..doAAAAAAAAod..","..doAAAyyAAAod..","..dFFFFFFFFFFd..","...dFFddddFFd..."]},
  "pm_acorn_till_glimmer":{"set":"machine","theme":"glimmer","cells":[1,1],"walk":false,"place":"floor","rows":["................","................",".....NNNNNN.....","....NVVVVVVN....","...NVddddddVN...","...NVdwwdwdVN...","...NVddddddVN...","...NVVVVVVVVNN..","...NVwhwhwhVNVN.","...NVhwhwhwVNN..","...NVwhwhwhVN...","...NNNNNNNNNN...","...NmmmmmmmmN...","...NmmmQQmmmN...","...NNNNNNNNNN...","....NN....NN...."]},
  "pm_tube_station":{"set":"machine","theme":"civic","cells":[1,2],"walk":false,"place":"floor","rows":[".....dwyod......",".....dwyod......",".....dwyod......","....dmmmmmd.....",".....dwyod......",".....dwyod......",".....dwyod......",".....dwyod......",".....dwyod......","....dmmmmmd.....",".....dwyod......",".....dwyod......",".....dwyod......",".....dwyod......","....doooood.....","...ddoooooddd...","..dwwwwwwwwwId..","..dwCCCCCCCCId..","..dwCCmmmCCCId..","..dwCmyyhmCCId..","..dwCmwwhmCdId..","..dwCmwwhmCmId..","..dwCCmmmCCmId..","..dwCCCCCCCmId..","..dwnnnnnnnCId..","..dwnnnnnnnCId..","..dwCCCCCCCCId..","..dIIIIIIIIIId..","..dnnnnnnnnnnd..","..dnnnnnnnnnnd..","...dddddddddd...","................"]},
  "pm_tube_station_glimmer":{"set":"machine","theme":"glimmer","cells":[1,2],"walk":false,"place":"floor","rows":[".....NdmdN......",".....NdmdN......",".....NdmdN......","....NmmmmmN.....",".....NdmdN......",".....NdmdN......",".....NdmdN......",".....NdmdN......",".....NdmdN......","....NmmmmmN.....",".....NdmdN......",".....NdmdN......",".....NdmdN......",".....NdmdN......","....NQQQQQN.....","...NNQQQQQNN....","..NdddddddddN...","..NdNNNNNNNNN...","..NdNNmmmNNNN...","..NdNmVVhmNNN...","..NdNmwwhmNdN...","..NdNmwwhmNmN...","..NdNNmmmNNmN...","..NdNNNNNNNmN...","..NdVVVVVVVNN...","..NdVVVVVVVNN...","..NdNNNNNNNNN...","...NNNNNNNNNN...","..NVVVVVVVVVVN..","..NVVVVVVVVVVN..","...NddNNNNddN...","....NN....NN...."]},
  "pu_map_wide":{"set":"wall2","theme":"civic","cells":[2,1],"walk":false,"place":"wall","rows":["................................",".dddddddddddddddddddddddddddddd.","dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFd","dACCCCCCCCCCcCCCCCCCCCCCbCccccFd","dACCnCCCDCCCcydCCCDCCCCCbcccccFd","dACnwnCDCDCCCrCCCDCDCCcbccccccFd","dACCnCCCCCCrCCcCrCCCCCcbccccccFd","dACCCCCCrCCDCCccCCrCrCbcccccccFd","dACCCCrCCCDCDCCCccccydbcccccccFd","dACCrydCCCCCCCCCCCCCccccccccccFd","dACCCCCCCCCCCCCCCCCCCbccccccccFd","dFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd",".dddddddddddddddddddddddddddddd.","................................","................................","................................"]},
  "pu_oath_board_keeper":{"set":"wall2","theme":"keeper","cells":[1,1],"walk":false,"place":"wall","rows":["...dddddddddd...","..dyyyyyyyyyyd..","..dyJJJyyJJJod..","..dyJJyooyJJod..","..dyJggyyggJod..","..dyJJJJJJJJod..","..dyJyyyJyyJod..","..dyJJJJJJJJod..","..dyJyyJyyyJod..","..dyJJJJJJJJod..","..dyJggggggJod..","..dyoooooooood..","...dddddddddd...","................","................","................"]},
  "pu_roster_pegs":{"set":"wall2","theme":"keeper","cells":[1,1],"walk":false,"place":"wall","rows":["................","..dddddddddddd..",".dGCCCCCCCCCCFd.",".dGAdAAdAAdAAFd.",".dGAwgAwrAAAAFd.",".dGAAAAAAAAAAFd.",".dGAdAAdAAdAAFd.",".dGAwbAAAAwgAFd.",".dGAAAAAAAAAAFd.",".dGAdAAdAAdAAFd.",".dGAAAAwrAAAAFd.",".dFFFFFFFFFFFFd.","..dddddddddddd..","................","................","................"]},
  "pu_bright_board":{"set":"wall2","theme":"glimmer","cells":[1,1],"walk":false,"place":"wall","rows":["................","..NNNNNNNNNNNN..","..NQQQQQQQQQQN..","..NVwVVVVVVVVN..","..NwQwVwwwwwVN..","..NVwVVVVVVVVN..","..NVhhhhhhhhVN..","..NVVVVVVVVVVN..","..NVhhhhhhhhVN..","..NVVVVVVVVVVN..","..NVhhhhhhhhVN..","..NVVhhhhhhVVN..","..NNNNNNNNNNNN..","................","................","................"]},
  "pu_firebird_tile":{"set":"wall2","theme":"kiln","cells":[1,1],"walk":false,"place":"wall","rows":["................","...dddddddddd...","..dAAAAAAAAAAd..","..dAorooooooBd..","..dAroororCoBd..","..dArorBorryBd..","..dArrrrrrooBd..","..dAoorrBoooBd..","..dAooooooooBd..","..dAoyoyoyoyBd..","..dAyoyoyoyoBd..","..dABBBBBBBBBd..","...dddddddddd...","................","................","................"]},
  "pu_mirror_oval":{"set":"wall2","theme":"home","cells":[1,1],"walk":false,"place":"wall","rows":["................","......dddd......",".....dyyyGd.....","....dyGGGGGd....","...dyGhhwhGGd...","...dGGhwhhGFd...","..dyGhhwhhhGGd..","..dGGhwhhhhGFd..","...dGGhhhwGFd...","...dGGmmmhGFd...","....dGGGGGFd....",".....dGFFFd.....","......dddd......","................","................","................"]},
  "pu_hat_hooks":{"set":"wall2","theme":"home","cells":[1,1],"walk":false,"place":"wall","rows":["................",".dddddddddddddd.","dAAAAAAAAAAAAAAd","dGGGGGGGGGGGGGGd",".dddddddddddddd.","dggggdyyydbcd...","dJJyJdooodbnd...","dJJJJyyyyybnd...","dnnnnGGGGGbnd...",".dddddddddbnd...",".........dbnd...",".........dnnd...","..........dd....","................","................","................"]},
  "pu_tool_rack_kiln":{"set":"wall2","theme":"kiln","cells":[1,1],"walk":false,"place":"wall","rows":["................",".dddddddddddddd.","dFCCCCCCCCCCCCFd","dFAyAAAAAGAFAAFd","dFAmAwCAGGAFAAFd","dFAmACICGGAFAAFd","dFAmAACAGGAFAAFd","dFAmAAAAFAAFAAFd","dFAmAABAFAACAAFd","dFAyABBAFAAoAAFd","dFAAAAAAAAAoAAFd","dFFFFFFFFFFFFFFd",".dddddddddddddd.","................","................","................"]},
  "pu_pressed_flowers":{"set":"wall2","theme":"home","cells":[1,1],"walk":false,"place":"wall","rows":["................","...dddddddddd...","..dAAAAAAAAAAd..","..dGCCCCyCCCGd..","..dGCrCyoyCCGd..","..dGryrCgCpCGd..","..dGCgCCgpwpGd..","..dGCggCgggCGd..","..dGCgCCgCgCGd..","..dGCgCCgCgCGd..","..dGCCwwwwCCGd..","..dGGGGGGGGGGd..","...dddddddddd...","................","................","................"]},
  "pu_certificate":{"set":"wall2","theme":"civic","cells":[1,1],"walk":false,"place":"wall","rows":["................","..dddddddddddd..",".dAAAAAAAAAAAAd.",".dGCCCCCCCCCCGd.",".dGCoyddddddCGd.",".dGCyyCCCCCCCGd.",".dGCIIIIIIIICGd.",".dGCIIIIIIICCGd.",".dGCIIIIIorCCGd.",".dGCCCCCCrrCCGd.",".dGCCCCCCbCbCGd.",".dGGGGGGGGGGGGd.","..dddddddddddd..","................","................","................"]},
  "pu_key_board":{"set":"wall2","theme":"lantern","cells":[1,1],"walk":false,"place":"wall","rows":["................","..dddddddddddd..",".dGCCCCCCCCCCFd.",".dGdAAdAAdAdAFd.",".dGyAAwAAyAyAFd.",".dGyAAAAAyAyAFd.",".dGoyAAAAoyoyFd.",".dGdAAdAAdAdAFd.",".dGyAAyAAyAwAFd.",".dGyAAyAAyAAAFd.",".dGoyAoyAoyAAFd.",".dFFFFFFFFFFFFd.","..dddddddddddd..","................","................","................"]},
  "pu_barometer":{"set":"wall2","theme":"keeper","cells":[1,1],"walk":false,"place":"wall","rows":["......dddd......",".....dGFFFd.....",".....dyoood.....","....dowddwod....","...dowdwwddod...","...dodwwwdwyod..","..dyowwwdwwyod..","...dowwywwwyod..","...dowwwwwwyod..","....dowwwwyod...",".....doooood....",".....dGFFFd.....","......dddd......","................","................","................"]},
  "pu_lantern_shelf":{"set":"wall2","theme":"lantern","cells":[1,1],"walk":false,"place":"wall","rows":["................","...d............","..dJd..dd.......",".dJJJddddd..d...",".dJyyJwywCdddd..",".dJoyJwooCdwhhd.",".dJyyJwooCdhhhd.",".dJyyJwwwCdhhhd.",".dJJJJddddddddd.","dCCCCCCCCCCCCCCd","dFFFFFFFFFFFFFFd",".ddFddddddddFdd.","...d........d...","................","................","................"],"frames":[["................","...d............","..dJd..dd.......",".dJJJddddd..d...",".dJyyJwwyCdddd..",".dJyoJwooCdwhhd.",".dJyyJwyoCdhhhd.",".dJyyJwwwCdhhhd.",".dJJJJddddddddd.","dCCCCCCCCCCCCCCd","dFFFFFFFFFFFFFFd",".ddFddddddddFdd.","...d........d...","................","................","................"]],"ms":500},
  "pu_coach_timetable":{"set":"wall2","theme":"civic","cells":[1,1],"walk":false,"place":"wall","rows":["................","..dddddddddddd..",".dnbnnnnnnnnnnd.",".dnnnnnnnnnnnnd.",".dCCCCCCCCCCCId.",".dCbbbbCCbbbCId.",".dCCCCCCCCCCCId.",".dCbbbbCCbbbCId.",".dCCCCCCCCCCCId.",".dCbbbbCgygCgId.",".dCCCCCCCCCCCId.",".dIIIIIIIIIIIId.","..dddddddddddd..","................","................","................"]},
  "ph_rocking_chair":{"set":"home","theme":"home","cells":[1,1],"walk":false,"place":"floor","rows":["....dddddddd....","...dGAAAAAAFd...","...dGdAdAdAFd...","...dGdAdAdAFd...","...dGdAdAdAFd...","...dGdAdAdAFd...","..dGGdAdAdAyyd..","...doooooooyod..","...dorororoyyd..","...doorororyod..","..dAAAAAAAAAAd..",".d.dFddddddFd.d.","dFddFddddddFddFd",".dFFFFFFFFFFFFd.","..dddddddddddd..","................"]},
  "pw_pyrometer_post":{"set":"kiln","theme":"kiln","cells":[1,2],"walk":false,"place":"floor","rows":["......dddd......",".....dyyyyd.....","....dyodwood....","...dyodwwdood...","...dodwwwodood..","...dowwwowwyod..","...dowwdwwwyod..","...doywwwwyod...","....doywwyyod...",".....doooood....","......dhmdd.....","......dhmd......","......dhmd......","......dhmd......",".....ddhmdd.....","....dwwwwwmd....","....dhhddhmd....","....dhhddhmd....","....dhhhhhmd....",".....ddhmdd.....","......dhmd......","......dhmd......","......dhmd......","......dhmd......","....dddhmddd....","...dAAAAAAAAd...","...dBBBFBBBBd...","...dBBddddBBd...","...dFFdoodFFd...","...dBFdyodFBd...","...dBFBBBBFBd...","....dddddddd...."],"frames":[["......dddd......",".....dyyyyd.....","....dyodwood....","...dyodwwdyod...","...dodwwwodood..","...dowwwowwyod..","...dowwdwwwyod..","...doywwwwyod...","....doywwyyod...",".....doooood....","......dhmdd.....","......dhmd......","......dhmd......","......dhmd......",".....ddhmdd.....","....dwwwwwmd....","....dhhddhmd....","....dhhddhmd....","....dhhhhhmd....",".....ddhmdd.....","......dhmd......","......dhmd......","......dhmd......","......dhmd......","....dddhmddd....","...dAAAAAAAAd...","...dBBBFBBBBd...","...dBBddddBBd...","...dFFdoodFFd...","...dBFdyodFBd...","...dBFBBBBFBd...","....dddddddd...."]],"ms":650},
  "po_basket_bed":{"set":"care","theme":"home","cells":[1,1],"walk":false,"place":"floor","rows":["................","................","................","....dddddddd....","..ddFFFFFFFFdd..",".dFGAGAGAGAGAFd.","dFAGAGAGAGAGAGFd","dFGyryyyryyyrGFd","dFGyyyryyyyryGFd","dFGGyyyyyyyyGGFd","dFAGAGAGAGAGAGFd","dFGAGAGAGAGAGAFd","dFAGAGAGAGAGAGFd",".dFGAGAGAGAGAFd.","..dFFFFFFFFFFd..","...dFddddddFd..."]},
  "po_feeder_station":{"set":"care","theme":"home","cells":[1,1],"walk":false,"place":"floor","rows":[".....ddFFdd.....","....dGFFFFGd....","....dAGGGGFd....","....dAGGgGFd....","....dAGggGFd....","....dAGGGGFd....","....dAGGGGFd....","...doyGGGGprd...","..dwyyywdrrrwd..",".dCwhhhwChhhwCd.",".dCAAAAAAAAAAAd.",".dGGGGGGGGGGGGd.","..dFddddddddFd..","..dFd......dFdd.","...d........ddod","..............d."]},
  "po_toy_shelf":{"set":"care","theme":"home","cells":[1,1],"walk":false,"place":"floor","rows":["..dddddddddddd..",".dAAAAAAAAAAAAd.",".dGddddddddddFd.",".dGddd.ddddodFd.",".dGdwrdbbbdyyFd.",".dGrrrrbdbdyyFd.",".dGdrrdbbbdyyFd.",".dAAAAAAAAAAAAd.",".dFFFFFFFFFFFFd.",".dGdgddgdddwwFd.",".dGdggggd.dwdFd.",".dGdgddgd.dddFd.",".dGdggggdddddFd.",".dAAAAAAAAAAAAd.",".dGddddddddddFd.","..d..........d.."]},
  "po_perch_tree":{"set":"care","theme":"lantern","cells":[1,2],"walk":false,"place":"floor","rows":["................","................",".....ddddddd....","....dAAAAAAAd...",".....ddCAGdd.dd.","......dCAGdddFFd","......dCAGdFFdd.","......dCAFFdyyd.","......dCAGddyyd.","......dCAGd.dod.","..dd..dCAGd..d..",".dFFdddCAGd.....","..ddFFdCAGd.....","...dddFFAGd.....","...d..dCAGd.....","..dmd.dCAGd.....",".dmdmddgggd.....",".dmdmddCAJd.....","..dmd.dgggd.....","...d..dCAJd.....","......dgggd.....","......dCAJd.....","......dgggd.....","......dCAJd.....","......dgggd.....","......dCAJd.....","......dgggd.....","....dddCAJddd...","...dGGGGGGGGFd..","..dFFFFFFFFFFFd.","...dFFFFFFFFFd..","....ddddddddd..."]},
  "po_care_scale":{"set":"care","theme":"lantern","cells":[1,1],"walk":false,"place":"floor","rows":["................",".......d........","..dddddyd.......",".dyyyyyymd.dd...",".dyddydhmddyyd..",".ddddddhmdywwdd.","dCwwwCChmywwdwyd","dIIIIIIhmywdwwyd",".ddddddhmdywwyd.","......dhmddyyd..","......dhmd.dd...","..dddddhmddddd..",".dGGGGGGGGGGGGd.",".dGFFFFFFFFFFFd.","..dFddddddddFd..","...d........d..."]},
  "po_night_light":{"set":"care","theme":"home","cells":[1,1],"walk":false,"place":"floor","rows":["................",".....d....d.....","....dod..dod....","....dyddddyd....",".....dyyyyd.....","....dywyyyyd....","....dwyooyyd....","....dyooooyd....","....dyyooyyd....",".....dyyyyd.....","...dddddddddd...","..dCCCCCCCCCCd..","..dFFFFFFFFFFd..","...dFddddddFd...","...dFd....dFd...","....d......d...."]},
  "po_paw_mat":{"set":"care","theme":"home","cells":[1,1],"walk":true,"place":"decal","rows":["................","................","................",".GGGGGGGGGGGGGG.",".GAAAAAAAAAAAFG.",".GAAAAAGFAAFGAF.",".GAGAAFAAFAAFFG.",".GAAAAAFFAAFAAG.",".GAAAFAAAFAGFAG.",".GAFAGFAAAFFAAG.",".GAAFFAAAAAAAAG.",".GAAAAAAABBAAAG.",".GGGGGGGGGGBGGG.","................","................","................"]}
};
function addExteriorArt(T, A, city){   // city: HIGH_CHARITY_LAYOUT art only while the city is on (each new art size opens its own pool sheet)
  const paint = rows => sheetPaint(rows[0].length, rows.length, g => {
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') px(g, PAL[ch], x, y); }));
  });
  for (const [k, rows] of Object.entries(EXTERIOR_ART.tiles)) if (!T[k]) T[k] = paint(rows);
  for (const grp of ['art', 'big']) for (const [k, rows] of Object.entries(EXTERIOR_ART[grp])) if (!A[k]) A[k] = paint(rows);
  for (const [k, rows] of Object.entries(LIZZY_ART.tiles)) if (!T[k]) T[k] = paint(rows);
  for (const [k, rows] of Object.entries(LIZZY_ART.art)) if (!A[k]) A[k] = paint(rows);
  for (const [k, rows] of Object.entries(MAZE_ART)) if (!A[k]) A[k] = paint(rows);
  // WEIR_HUT: a one-frame entry is one canvas, a two-frame one an array (props: artFrame; tiles: cellImg in game.js).
  for (const [sec, dst] of [['tiles', T], ['props', A]]) for (const [k, fr] of Object.entries(WEIR_HUT_ART[sec])) if (!dst[k]) dst[k] = fr.length > 1 ? fr.map(paint) : paint(fr[0]);
  // HIGH_CHARITY placeholders. Existing names are never replaced. door_chained is also mirrored into WART like door_heavy.
  if (city) for (const [k, rows] of Object.entries(HC_CITY_ART.tiles)) if (!T[k]) T[k] = paint(rows);
  if (city) for (const grp of ['art', 'big']) for (const [k, rows] of Object.entries(HC_CITY_ART[grp])) if (!A[k]) A[k] = paint(rows);
  if (!A.door_chained && T.door_chained) A.door_chained = T.door_chained;
  const frames = (ids, ms) => { const a = ids.map(id => A[id]); a.ms = ms; return a; };
  // Frame 0 is what reduced motion shows: the tank lantern lit, the lantern wall lit, the printer at rest.
  if (A.hc_tank_escort_0 && !A.hc_tank_escort) A.hc_tank_escort = frames(['hc_tank_escort_0', 'hc_tank_escort_1', 'hc_tank_escort_2', 'hc_tank_escort_3'], 350);
  if (A.hc_tank_command_0 && !A.hc_tank_command) A.hc_tank_command = frames(['hc_tank_command_0', 'hc_tank_command_1', 'hc_tank_command_2', 'hc_tank_command_3'], 350);
  if (A.hc_lantern_wall_0 && !A.hc_lantern_wall) A.hc_lantern_wall = frames(['hc_lantern_wall_0', 'hc_lantern_wall_1'], 700);
  if (A.hc_wire_printer_0 && !A.hc_wire_printer) A.hc_wire_printer = frames(['hc_wire_printer_0', 'hc_wire_printer_1'], 300);
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
  // KILNMOUTH: its tiles and props; the two smoke loops are frame arrays (frame 0 = reduced motion)
  for (const [k, rows] of Object.entries(KILNMOUTH_ART.tiles)) if (!T[k]) T[k] = paint(rows);
  for (const [k, rows] of Object.entries(KILNMOUTH_ART.art)) if (!A[k]) A[k] = paint(rows);
  if (!A.km_kiln_smoke) { A.km_kiln_smoke = [A.km_kiln_smoke_0, A.km_kiln_smoke_1]; A.km_kiln_smoke.ms = 650; }
  if (!A.km_smoke) { A.km_smoke = [A.km_smoke_0, A.km_smoke_1]; A.km_smoke.ms = 700; }
  // ROUTE_TO_GOVERNOR: the new tiles by map char, the props, and the built trough tile as a prop (the fold's rest).
  for (const [k, rows] of Object.entries(ROUTE4_ART.tiles)) if (!T[k]) T[k] = paint(rows);
  for (const [k, rows] of Object.entries(ROUTE4_ART.art)) if (!A[k]) A[k] = paint(rows);
  if (!A.water_trough && T.water_trough) A.water_trough = T.water_trough;
  // BRIGHTGATE_LAYOUT: the city's tiles by map char and its props; the fleet's panel roof, wall, glass door, window strip and
  // badge plate (glimmer_fleet.js GW_ART) as plain art, so Brightgate's buildings use them outside the preview lot. None of
  // those five carries mint; the fleet pieces that do (lamp glass, cruiser lights) are copied mint-free where Brightgate places them.
  for (const [k, rows] of Object.entries(BRIGHTGATE_ART.tiles)) if (!T[k]) T[k] = paint(rows);
  for (const [k, rows] of Object.entries(BRIGHTGATE_ART.art)) if (!A[k]) A[k] = paint(rows);
  for (const [k, fr] of Object.entries(BRIGHTGATE_ART.frames)) if (!A[k]) { const a = fr.map(paint); a.ms = 1400; A[k] = a; }
  // The built Comfort Lamp and hedge planter carry mint glass and leaves; Brightgate takes honey copies (D2000: no mint in the city).
  const noMint = img => { if (!img || !img.width) return null; const c = sheetScratch(img.width, img.height), g = c.getContext('2d');
    const out = document.createElement('canvas'); out.width = img.width; out.height = img.height; const o = out.getContext('2d');
    g.clearRect(0, 0, img.width, img.height); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, img.width, img.height), p = d.data;
    const L = [1, 3, 5].map(i => parseInt(PAL.l.slice(i, i + 2), 16)), Y = [1, 3, 5].map(i => parseInt(PAL.y.slice(i, i + 2), 16));
    for (let i = 0; i < p.length; i += 4) if (p[i] === L[0] && p[i + 1] === L[1] && p[i + 2] === L[2]) { p[i] = Y[0]; p[i + 1] = Y[1]; p[i + 2] = Y[2]; }
    o.putImageData(d, 0, 0); return out; };
  if (!A.bg_comfort_lamp && A.comfort_lamp) { const f = [].concat(A.comfort_lamp).map(noMint).filter(Boolean); if (f.length) { A.bg_comfort_lamp = f.length > 1 ? f : f[0]; if (A.comfort_lamp.ms) A.bg_comfort_lamp.ms = A.comfort_lamp.ms; } }
  if (!A.bg_hedge_planter && A.hedge_planter) A.bg_hedge_planter = noMint(A.hedge_planter);
  if (!A.bg_vane && A.weathervane) A.bg_vane = noMint(A.weathervane);   // the dead vane, Old Wick and Hall 4
  if (typeof GW_ART === 'object') {
    for (const k of ['roof_gw_panel', 'wall_gw_panel']) if (!T[k] && GW_ART[k]) T[k] = paint(GW_ART[k][0]);
    for (const k of ['door_gw_glass', 'win_strip_gw']) if (!A[k] && GW_ART[k]) A[k] = paint(GW_ART[k][0]);
    // The fleet's built pieces, mint-free (honey for mint; D2000): the Cruiser (parked and gliding, east and west), the Concierge
    // (parked and flying), Bright Swap and the relay mast. The `_l` copies face west.
    const fix = rows => rows.map(r => r.replace(/l/g, 'y')), flipR = rows => rows.map(r => r.split('').reverse().join(''));
    for (const [to, from] of [['bg_cruiser', 'gw_cruiser'], ['bg_cruiser_move', 'gw_cruiser_move'], ['bg_concierge', 'gw_concierge'], ['bg_concierge_fly', 'gw_concierge_fly'], ['bg_swap_stall', 'gw_swap_stall'], ['bg_relay_mast', 'gw_relay_mast']]) {
      if (A[to] || !GW_ART[from]) continue;
      const mk = f => { const a = GW_ART[from].map(r => paint(f(fix(r)))); if (a.length === 1) return a[0]; a.ms = 400; return a; };
      A[to] = mk(r => r); if (/cruiser|concierge/.test(to)) A[to + '_l'] = mk(flipR);
    }
    if (!A.bg_badge && GW_ART.gw_badge) A.bg_badge = paint(GW_ART.gw_badge[0].map(r => r.replace(/l/g, 'y')));   // the badge plate, honey for mint (D2000)
  }
  addCrackdownArt(T, A, paint);   // POST_TRIAL_CRACKDOWN + LANTERN_HOUSE_FERNBROOK draft art
  // PROP_LIBRARY v0.1: each prop under its id, and a multi-cell prop also as <id>_0..n 16x16 slices (left to right, top to
  // bottom), so a room places one slice per blocking cell. A `tile` piece (jetty, steps) is also offered as a tile. Existing names stay.
  for (const [k, p] of Object.entries(PROP_LIBRARY_ART)) {
    if (!A[k]) A[k] = paint(p.rows);
    if (p.place === 'tile' && !T[k]) T[k] = A[k];
    const [w, h] = p.cells;
    if (w * h > 1) for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) {
      const id = k + '_' + (cy * w + cx);
      if (!A[id]) A[id] = paint(p.rows.slice(cy * 16, cy * 16 + 16).map(r => r.slice(cx * 16, cx * 16 + 16)));
    }
  }
  // PROP_LIBRARY v0.2: the same rules as v0.1. An animated prop is an array of frames (artFrame loops them `ms` apart and
  // reduced motion holds frame 0); its slices are frame 0. A time-of-day face is its own name <id>_<phase> (picked, never animated).
  for (const [k, p] of Object.entries(PROP_LIBRARY_2_ART)) {
    if (!A[k]) { if (p.frames) { const fr = [p.rows].concat(p.frames).map(paint); fr.ms = p.ms; A[k] = fr; } else A[k] = paint(p.rows); }
    for (const [ph, rows] of Object.entries(p.phases || {})) if (!A[k + '_' + ph]) A[k + '_' + ph] = paint(rows);
    const [w, h] = p.cells;
    if (w * h > 1) for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) {
      const id = k + '_' + (cy * w + cx);
      if (!A[id]) A[id] = paint(p.rows.slice(cy * 16, cy * 16 + 16).map(r => r.slice(cx * 16, cx * 16 + 16)));
    }
  }
  if (city) addHcParadeArt(T, A);   // HC_PARADE PLACEHOLDER art, city only, built on first draw
  // CABINET_AND_COUNCILS 1b: the Cabinet Room, city only like the rest of the Governor's House. Existing names are never replaced.
  if (city) {
    for (const [k, rows] of Object.entries(CABINET_ROOM_ART.tiles)) if (!T[k]) T[k] = paint(rows);
    for (const [k, rows] of Object.entries(CABINET_ROOM_ART.props)) if (!A[k]) A[k] = paint(rows);
  }
  // WAR_MUSEUM v0.1.1: the museum's tiles, props (a 32 px wide prop also as its two 16 px slices) and E1's exterior pieces, city only.
  if (city) {
    for (const [k, rows] of Object.entries(WAR_MUSEUM_ART.tiles)) if (!T[k]) T[k] = paint(rows);
    for (const [k, rows] of Object.entries(Object.assign({}, WAR_MUSEUM_ART.props, WAR_MUSEUM_ART.ext))) {
      if (!A[k]) A[k] = paint(rows);
      if (rows[0].length === 32 && rows.length === 16) for (let i = 0; i < 2; i++) if (!A[k + '_' + i]) A[k + '_' + i] = paint(rows.map(r => r.slice(i * 16, i * 16 + 16)));
    }
  }
}
// HC_PARADE §8 (D1355, D1356; design specs/HC_PARADE.md): PLACEHOLDER draft art for the parade, PAL keys only, from the sub-agent
// inspiration briefs in handoff/maps/HC_PARADE.md (rule 9). Pia redraws before HC_CITY_V2 ships. Installed only while the city is
// on, and built on first draw, not at boot (each new size opens a whole pool sheet; memory_walk). No gun on any of it.
// Sizes: rotor craft 48x32 (its shadow 40x10), the President's car 64x32, the President 16x16, crowd strips 64x16.
function addHcParadeArt(T, A){
  const lazy = (key, fn) => {
    if (key in A) return;
    const set = v => { Object.defineProperty(A, key, { value: v, writable: true, configurable: true, enumerable: true }); return v; };
    Object.defineProperty(A, key, { configurable: true, enumerable: true, get(){ return set(fn()); }, set });
  };
  const anim = (list, ms) => { list.ms = ms; return list; };
  const P = (g, mir, W) => (k, x, y, w = 1, h = 1) => { g.fillStyle = PAL[k]; g.fillRect(mir ? W - x - w : x, y, w, h); };
  // Keeper rotor craft, facing right (mir = facing left). f: rotor frame 0-3.
  const rotor = (f, mir) => sheetPaint(48, 32, g => {
    const d = P(g, mir, 48);
    d('J', 3, 15, 13, 3); d('D', 3, 15, 13, 1); d('J', 1, 10, 3, 6); d('D', 1, 10, 1, 5);                // tail boom and fin
    d('d', 0, 8, 5, 1); d('m', 2, 6, 1, 5);                                                              // tail rotor
    d('J', 15, 11, 24, 13); d('J', 13, 13, 2, 9); d('J', 39, 13, 2, 9); d('D', 16, 11, 22, 2);         // cabin
    d('C', 14, 20, 26, 2); d('A', 14, 22, 26, 1);                                                        // cream belly band
    d('F', 16, 15, 18, 1); d('G', 16, 16, 18, 1);                                                        // brass rail
    d('d', 32, 13, 7, 5); d('m', 33, 14, 5, 3); d('h', 36, 14, 1, 1);                                     // glass
    d('y', 22, 13, 3, 3); d('F', 23, 14, 1, 1);                                                          // lantern crest on the door
    d('F', 40, 17, 5, 5); d('y', 41, 18, 3, 3); d('w', 42, 19, 1, 1);                                     // caged nose lantern
    d('d', 18, 24, 1, 3); d('d', 34, 24, 1, 3); d('d', 13, 27, 28, 1); d('m', 13, 27, 2, 1);           // skids
    d('d', 26, 7, 2, 4);                                                                                 // mast
    if (f === 0) { d('d', 3, 7, 44, 1); d('m', 3, 6, 4, 1); }
    else if (f === 1) { for (let i = 0; i < 18; i++) d(i % 2 ? 'h' : 'm', 10 + i * 2, 3 + (i >> 1) % 2 + Math.floor(i / 6), 2, 1); }
    else if (f === 2) { d('d', 24, 2, 6, 1); d('d', 26, 3, 2, 4); d('d', 22, 8, 10, 1); }
    else { for (let i = 0; i < 18; i++) d(i % 2 ? 'h' : 'm', 10 + i * 2, 9 - Math.floor(i / 6), 2, 1); }
  });
  for (const [k, mir] of [['hc_rotor_r', false], ['hc_rotor_l', true]]) lazy(k, () => anim([0, 1, 2, 3].map(f => rotor(f, mir)), 70));
  // ROTOR_CRAFT v0.1.1 (D1385-D1394): Design's draft frames, carried in the city data (PP_HC_V2.art: deduplicated rows of PAL
  // keys; a legend char is [PAL key, alpha] for the translucent shadow and beam). They win over the engineer draft above.
  const R = typeof window !== 'undefined' && window.PP_HC_V2 && window.PP_HC_V2.art;
  if (R && R.rows && R.sprites) for (const [k, sp] of Object.entries(R.sprites)) lazy(k, () => {
    const fr = sp.frames.map(f => sheetPaint(sp.w, sp.h, g => f.forEach((ri, y) => { const row = R.rows[ri] || '';
      for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue;
        const lg = sp.legend && sp.legend[ch], key = lg ? lg[0] : ch; if (!PAL[key]) continue;
        g.globalAlpha = lg ? lg[1] : 1; g.fillStyle = PAL[key]; g.fillRect(x, y, 1, 1); } g.globalAlpha = 1; })));
    return fr.length === 1 && !sp.ms ? fr[0] : anim(fr, sp.ms || 400);
  });
  lazy('hc_rotor_shadow', () => sheetPaint(40, 10, g => {
    g.globalAlpha = 0.32; g.fillStyle = PAL.k;
    for (let y = 0; y < 10; y++) { const r = Math.round(20 * Math.sqrt(1 - ((y - 4.5) / 5) ** 2)); g.fillRect(20 - r, y, 2 * r, 1); }
    g.globalAlpha = 1;
  }));
  // The President's car, facing right (mir = left). v: 0 drive, 1 wheels turned, 'hand' the still, 'door' the rear door open.
  // v0.2 (relayed from Vincent's preview review, Tue Nov 3): a stately armoured car, 64x32 (four tiles long; the parked
  // runabouts are two), high armoured cabin, long bonnet, two pennants, a large rear window so the gloved hand reads.
  const car = (v, mir) => sheetPaint(64, 32, g => {
    const d = P(g, mir, 64);
    d('k', 3, 29, 58, 2);                                                                                // hard shadow
    d('J', 2, 16, 60, 11); d('E', 2, 25, 60, 2); d('D', 3, 16, 58, 1);                                   // armoured body, sill
    d('h', 3, 21, 58, 1); for (let x = 5; x < 60; x += 5) d('m', x, 18, 1, 1);                           // chrome strip, rivets
    d('J', 40, 13, 21, 4); d('D', 41, 13, 19, 1); d('w', 44, 14, 14, 1);                                 // long bonnet, its streak
    d('m', 60, 17, 3, 9); d('h', 61, 18, 1, 6); d('y', 61, 15, 2, 2); d('w', 62, 15, 1, 1);              // grille, headlamp
    d('m', 0, 18, 3, 8);                                                                                 // rear bumper
    d('J', 12, 3, 30, 13); d('E', 12, 3, 30, 1); d('D', 13, 4, 28, 1); d('k', 11, 4, 1, 12); d('k', 42, 4, 1, 12);   // armoured cabin
    d('k', 14, 6, 9, 8); d('k', 24, 6, 8, 8); d('k', 33, 6, 8, 8);                                       // tinted glass, three panes
    d('d', 15, 6, 3, 1); d('d', 25, 6, 3, 1); d('n', 34, 6, 5, 1); d('m', 39, 7, 1, 2);                  // glass glints
    d('y', 25, 17, 5, 5); d('F', 26, 18, 3, 3); d('y', 27, 19, 1, 1);                                    // Keeper crest on the rear door
    d('F', 49, 3, 1, 11); d('J', 50, 3, 5, 3); d('y', 54, 3, 1, 3);                                      // pennants on the front wings
    d('F', 56, 5, 1, 9); d('J', 57, 5, 4, 3); d('y', 60, 5, 1, 3);
    d('k', 7, 23, 10, 8); d('k', 44, 23, 10, 8); d('d', 8, 24, 8, 6); d('d', 45, 24, 8, 6);             // wheels under the wings
    const hub = v === 1 ? 1 : 0; d('m', 10 + hub, 26, 3, 2); d('m', 47 + hub, 26, 3, 2);
    if (v === 'hand') {                                                                                  // 1.6: the window down, one gloved hand
      d('J', 14, 6, 9, 3); d('d', 14, 9, 9, 1); d('k', 14, 10, 9, 4);
      d('C', 16, 9, 5, 4); for (const fx of [16, 18, 20]) d('C', fx, 6, 1, 3); d('w', 17, 9, 2, 1); d('C', 21, 10, 2, 2); d('J', 16, 13, 5, 1);   // a raised glove: three fingers, a thumb, the cuff
    }
    if (v === 'door') { d('k', 13, 6, 11, 20); d('y', 15, 24, 6, 1); d('J', 8, 9, 6, 20); d('D', 8, 9, 6, 1); d('h', 12, 17, 1, 2); }
  });
  for (const [sfx, mir] of [['r', false], ['l', true]]) {
    lazy('hc_pcar_' + sfx, () => car(0, mir));
    lazy('hc_pcar_' + sfx + '_move', () => anim([car(0, mir), car(1, mir)], 160));
    lazy('hc_pcar_hand_' + sfx, () => car('hand', mir));
    lazy('hc_pcar_door_' + sfx, () => car('door', mir));
  }
  // The President, minimal and half-seen (D1356): a dark long coat with a rim of light from behind; no face pixels.
  const pres = f => sheetPaint(16, 16, g => {
    const d = P(g, false, 16);
    d('k', 6, 1, 4, 4); d('y', 6, 0, 4, 1); d('y', 10, 1, 1, 3); d('C', 9, 0, 1, 1);                     // head, rim
    d('k', 5, 5, 6, 8); d('d', 6, 6, 1, 6); d('m', 8, 8, 1, 3); d('y', 11, 5, 1, 4); d('y', 5, 5, 1, 1); // coat, rim on shoulder and sleeve
    d('k', 4, 11, 8, 2); d('d', 5, 12, 6, 1);                                                            // hem
    if (f) { d('d', 5, 13, 2, 2); d('d', 9, 13, 2, 1); } else { d('d', 6, 13, 2, 2); d('d', 8, 13, 2, 2); }
  });
  lazy('hc_president', () => pres(0));
  lazy('hc_president_move', () => anim([pres(1), pres(0)], 180));
  // Crowd strips: rows of heads and shoulders seen from behind (one object fills four tiles). v 0-2; f 1 = the bob and the clap.
  const HAIR = ['k', 'd', 'F', '5', 'G', 'y', 'd', 'k'], COAT = ['m', 'I', 'A', 'B', 'h', 'K', 'm'];
  const strip = (v, f) => sheetPaint(64, 16, g => {
    const d = P(g, false, 64), up = f ? 1 : 0;
    for (let i = 0; i < 8; i++) { const x = 1 + i * 8; d(HAIR[(i + v * 3) % 8], x + 2, 2 - up, 4, 4); d(COAT[(i + v) % 7], x, 6 - up, 8, 3); }
    for (let i = 0; i < 7; i++) {
      const x = 4 + i * 8, coat = (v === 2 && i === 3) ? 'V' : COAT[(i * 3 + v) % 7];   // one supporter's vest: Glimmerwell wine (rule 11)
      d(HAIR[(i * 5 + v) % 8], x + 1, 6 - up, 5, 5); d(coat, x - 1, 10 - up, 9, 6 + up);
      if (v === 2 && i === 3) d('N', x + 3, 13 - up, 1, 1);
      if (f && i % 3 === 0 && !(v === 2 && i === 3)) { d('3', x - 1, 7, 1, 2); d('3', x + 7, 7, 1, 2); }
    }
    if (v === 1) { d('F', 14, 0, 1, 7); d('y', 15, 0, 3, 2); d('J', 15, 2, 3, 1); d('F', 46, 0, 1, 7); d('y', 47, 0, 3, 2); d('J', 47, 2, 3, 1); }
    if (v === 2) { d('2', 30, 0 - up, 3, 3); d('d', 30, 0 - up, 3, 1); }
  });
  for (const v of [0, 1, 2]) lazy('hc_crowd_' + 'abc'[v], () => anim([strip(v, 0), strip(v, 1)], 650));
  // E8 in a still: the crowd strips' clap frame, for the beat when the Officer raises a hand (reduced motion keeps frame 0).
  for (const v of [0, 1, 2]) lazy('hc_crowd_' + 'abc'[v] + '_clap', () => strip(v, 1));
}
// E5 on outdoor maps that opt in with "variants": true: plain grass `g` becomes one of these by tileHash (the rest stays `g`).
// Lab maps keep LAB_SKIN.variants; hand-placed chars (`f`, `t`, …) never vary.
const OUTDOOR_SKIN = { variants: { g: [['grass_b', 0.18], ['grass_c', 0.12], ['flower_patch', 0.05]] } };
// KILNMOUTH v0.1.1 (design repo, private; D1820-D1849, settled Wed Nov 4, 2026): the town and Claybank Road. PAL keys only, two
// colour families (town: cream C, terracotta B, shard paving A/B; company: slate K/m, soot N). Generated grids; tiles by name
// (the km_town / km_road skins map the packet chars to them), props by WART name. Frames: km_kiln_smoke (frame 0 = reduced motion).
const KILNMOUTH_ART = {
  tiles: {
    km_shard: ["AAAAABACAAAAAAFA", "ABAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAACAAAAAAAAAA", "AAABBAAAABAAAAAA", "AAAAAACAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAABBAAA", "AAAAAAAAAAAAAAAA", "ACAAAAAAAAAAAAAA", "AAAAAAABBFAAAAAA", "AAAAAAAAAABAAACA", "AAAAAAAAAAAFAAAA"],
    km_shard_b: ["AAAAAAAAAAAAACAA", "AAAAAAAAAAABAAAA", "AAACAAAAABAAAAAA", "AAAAAAAAAAAAAAAA", "AAABBAAFAAABAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAFAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAABBAAA", "ABAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAABBCAAAAAA", "AAAAAAABBAAAAAAA", "AAAAAAAAAAAAAAAA"],
    km_shard_c: ["AAAFAAAAAAAAAAAA", "AAGAAAAAAAABAAAA", "AAAFAAAAAAAAABAA", "AAAAAAAAAAAAAACA", "AAABBAAAAAAAAABA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAFAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAABBAAA", "BAAAAAAAACAAAAAA", "AAAAAAAAACAAAAAA", "AABAAAABBAAAAAAA", "AAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAA"],
    km_runnel: ["GGwFFFFFFFFNFwGG", "GGwFFFNFwFFFFwGG", "GGwFFFFFFFFFFwFF", "GGwFFFFFFFFFFwGG", "GGwFFFFFFFFFFwGG", "FFwFFwFFFFFFFwGG", "GGwFFFFFFFFFFwGG", "GGwFFFFFFFFFNwGG", "GGwFFFFFFFFFNwGG", "GGwFFFFFFFFFFwFF", "GGwFFFFFFFFFFwGG", "GGwFNFFFFFwFFwGG", "FFwFFFNFFFFFFwGG", "GGwFFFFFFFFFFwGG", "GGwFFFFFwFFFFwGG", "GGwFFFFFFFFFFwGG"],
    km_runnel_l: ["GGwFFFFFFFFFFFFN", "GGwFFFFFwFFFFFFF", "GGwFFFFFFFFFFFFF", "GGwFFNFFFFFNFFFF", "GGwFFFFFFFFFFFFF", "FFwFFwFFFFFFFFFF", "GGwFFFFFFFFFFFFF", "GGwFFFFFFFNFFFFN", "GGwFFFFFFFFFNFFF", "GGwFFFFFFFFFFFFF", "GGwFFFFFFFFFFFFF", "GGwFFFFFFFwFFFFF", "FFwFFFFFFFFFFFFF", "GGwFFFFFFFFFFFFF", "GGwFFwFFwFFFFFFF", "GGwFFFFFFFFFFFFF"],
    km_runnel_r: ["FFFFFFFwFFFFNwGG", "FFFFFFFFFwFFFwGG", "FFFFFFFFFFFFNwFF", "FFFFFFFFFFFFFwGG", "NFFFFFFFFFFFFwGG", "FFFFFFFFFFwFFwGG", "FFFFFFFNFFFFFwGG", "FFFFFFFFFFFFFwGG", "FFFFFFFFFFFFNwGG", "FFFFFFFFFFFFFwFF", "FFFFFFFFFFFFFwGG", "FFFFFFFFFFFFNwGG", "FFFFFFFFFFFFFwGG", "FFFFFFFFFFFFFwGG", "FFFFFFFFFFFFFwGG", "FFFFFFFwwFFFFwGG"],
    km_runnel_steam: ["GGwhhhhhhhhhhwGG", "GGwhhhhhhhhhhwGG", "GGwhwhhhhhhhhwGG", "GGwhhhhhhhhhhwGG", "GGwhhshhhhhhhwGG", "GGwhhhhhhhhhhwGG", "GGwhhhshhhhhhwGG", "GGwhhhhhhhhhhwGG", "GGwhhhhhhhhhhwGG", "GGwhhhwhhwhhhwGG", "GGwhhhhhhhhhhwGG", "GGwhhhwshhhhhwGG", "GGwhhhhhhhhhhwGG", "GGwhhhhhhhhhhwGG", "GGwhhhhhhhhhhwGG", "GGwhhhhhhwhhhwGG"],
    km_plank: ["FFFFFFFFFFFFFFFF", "GGGGGGGGGGGGGGGG", "GGFGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFA", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGFGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "FFAFFFFAFFFAFFFF", "GGGGGGGGGGGGGGGG", "GGGGGGFGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF"],
    km_ring: ["IIImIIIIIIIIIIII", "IIhIIIIhIIIIIhII", "IhIIIIIIIIIIIIII", "IIIIhIIIIIIIIIII", "IIIIIIIIIIwIIIII", "IIIIIIIIImIIIIII", "IwIIIIIIIIIIIIII", "IIwhIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIwIIIIIIIImII", "IIIIIIIIIIIIIwII", "IIIhIIwIIIIIIIwI", "IwIIIIIIIIIIIIII", "IIwIIIIIIIIImIII", "IIIIIIIIIIIIIIII", "IIIIIIhIIIIIIIII"],
    km_rim: ["CCCCCChCCwCCCCCG", "CCCCCCCCCCCCCCCG", "CCwCCCCCCCChCCCG", "CCCCCwCCCCCCCCCG", "CCCCCCCCCCCCCCCG", "CCCCCCCwCCCCCCCG", "CCCCCGCCCwCCCCCG", "CCCCCCCCCCCCCCCG", "CCCCCCCCwCCCCCCG", "CCCCCwCwCCCCwwCG", "CCCCCCCCCCCCCCCG", "CCCCCCCwCCGCCCCG", "CCCCCCCCCChCCCCG", "CCCCCCCCCCCCCCCG", "CCCCCCCCCCCCCCCG", "GGGGGGGGGGGGGGGG"],
    km_grate: ["kkkkkkkkkkkkkkkk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdhmdmmdhmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kmmdmmdmmdmmdmmk", "kkkkkkkkkkkkkkkk"],
    km_setts: ["KKKmKKKmKKKmKhKm", "KKKmKKKmKKKmKKKm", "KKKmKKKmKKKmKKKm", "KdKmKKKmdKKmKKKm", "KKKmKKKmKKKmKKKm", "KKKmKKKmKKKmKKKm", "KKKmKKKmKKKmKKKm", "mmmmmmmmmmmmmmmm", "mmKKdmKKKmKKKmKK", "mmKKKmKKKmKKKmKK", "mmKKKmKKKmKKKmKK", "mmhKKmKKKmKKdmKK", "mmKKKmKKKmKKKmKK", "mmKKKmKKdmKKKmKK", "mmKKKmKKKmKKKmKK", "mmmmmmmmmmmmmmmm"],
    km_hillpath: ["GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGmGGGGGGGGGGG", "GGGGmFGFFGGGmFAG", "GGGGGGAGGGGGGGAG", "GGGGGhhhGGGGGGGG", "GGGGGhhhGGGGGGGG", "GGGGAmGGGGGGGGGG", "GGGGGGFGFGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGAGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGAGGGG", "GGGGGGGGAGGGGGGG", "mGGGGGGAGGGGGGGG"],
    km_hill: ["FFFFFFFFFFFFFFFF", "FFFFFFFFGFFFFFFF", "FgFFFFBFFFFFFFFF", "GFFFFFFFFFFFFFFF", "FFFGGGFFFFFFFFFF", "FFFGGGFFFFFgFFFF", "FFFNFFFFgFFFFFFF", "BFFFFFFFFFFFFFFF", "FFFFFFFFFGFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFGFFFFFGGGGFF", "FFFFFFFFFFGGGGFF", "FFFFFBFFFFNFFFFF", "FGFFFgFFFFFFFFFF", "GFFFFFFFFFFFFFFF", "FFFFFFFFFFFGFFFF"],
    km_tower_foot: ["KKKKKKKKKKKKKKKm", "KKKKKKKKhKKKKKKK", "KKKKKKKKKKKKKKKK", "mKKKKKKKKKKKKKKK", "KKKKKKKKKKKKKKKK", "KKKKKKKmKKKKKKKK", "KKKKKKKKKKKKKKKK", "KKKKKKKKKKKKKKKK", "KKKKKKKhKKKKhKKK", "KKKKKKKKKKKKKKKK", "KKKKKKKKKKKKKKhK", "KKKKKhKKKKKKKKKK", "KKKKKKKKKKKKKKKK", "KKKKKKKKKKKKKKKK", "mKKKKKKKKKKmKKKK", "KKKKKKKKKKKKKKKK"],
    km_kiln_foot: ["BBBBBBBBBBFBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBABBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBFBB", "BBBBBBBBBBBBBBBF", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBABABBB", "BBBBBFBBBBBBBBFB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBABBBBB", "ABBBBBBBBBBBBBBB"],
    km_shards: ["ggggggtgggtggggg", "gggggtgggggggggg", "gggggggggggggggg", "gggggggggggggggg", "ggggggggggggggtg", "gggggggggggggggg", "gglgtgBBBBgggggg", "gggggggggAAAgggg", "gggggAAAgAAAgggg", "gggBBAABBBgBBBgg", "gggBBBgBBBgBBBgg", "ggggggGGBBAAAggg", "ggggFFFFFFFFFggg", "ggggFFFFFFFFFggg", "gggggggggggggggg", "gggggggggggggggg"],
    km_mud: ["FFFFFFFFFFFFFFFG", "FFFFFFFFFFFFGFFF", "FFFFFFFFFFFFFFFF", "FFFnnnFFFFFFFFFF", "FFnnnnnFFFFFFFFF", "FFFnnnFFFFFFGFFF", "FFNFFFFFFFFFFFFF", "FFFGFNFFFFFFNFFF", "FFFFFFFFFnnnFFFF", "FFFFFFFnbbbbbnFF", "FFFFFGFnbbbbbnNF", "FFFFFFFnnnnnnnFF", "FFFFFFFFFnnnFFFF", "FFFFFFFFFFFFFFFF", "FFFFGFFGFFFFFFFF", "FFFFFFFFFFFFFFFF"],
    km_pool: ["nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nndnnnnnnnnnnnnn", "nnnbbbbdnnnnnnnd", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnbbbnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnndndn", "nnnnnnnnnnnnnnnn"],
    km_clay: ["GGGGGGGGGGGGGGGG", "BBBBBBBBBBBBBBBB", "GBBGABBBBBBBBBBB", "FFFFFAFFFFFFFFFG", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "GBBBBBBBBBBBBBBB", "FFFFFFFAFFFFFFFF", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBGBABBBBBBB", "FFFFFFFFFFFFFFFF", "BBBBBBBBBBBBBBBB"],
    km_ford: ["bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbhwwhbbbbbbbbb", "bbhwwwwhbbbbbbbb", "bbhhwwhhbbbbbbbb", "bbbhhhhbbbbbbbbb", "bbbcbbbbbbbbbbcc", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbhhhhbb", "bbbbbbbbbhwwwwhb", "bbbbbbbbchwwwwhb", "bbbbbbbbbhhhhhhb", "bbbbbbcbbbhhhhbb", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb"],
    km_ford_wet: ["bbbbbbcbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbmmmmsbbbbbbbb", "bsmmmmmmbbbbbbbb", "bbmmmmmmbbbbbbbb", "bbbmmmmsbbbbbbbb", "bwwwwwwbbbsbbsbb", "bbbbbbbbbbbbsbbb", "bbbbbbbbbbmmmmbb", "bbbbbbbbbmmmmmmb", "bbbbbbbbbmmmmmmb", "bbbbbbbbbmmmmmmb", "bbbbbbbbwwwwwwbb", "bbbbbbbbbbsbbbbb", "bbbbbbbbbbbbbcbb"],
    roof_km_terra: ["FABBBBBBFABBBBBB", "FBBBBBBBFBBBBBBB", "FBBBBBBBFBBBBBBB", "FFFFFFFFFFFFFFFF", "BBBBFABBBBBBFABB", "BBBBFBBBBBBBFBBB", "BBBBFBBBBBBBFBBB", "FFFFFFFFFFFFFFFF", "FABBBBBBFABBBBBB", "FBBBBBBBFBBBBBBB", "FBBBBBBBFBBBBBBB", "FFFFFFFFFFFFFFFF", "BBBBFABBBBBBFABB", "BBBBFBBBBBBBFBBB", "BBBBFBBBBBBBFBBB", "FFFFFFFFFFFFFFFF"],
    roof_km_band: ["BABBBABBBABBBABB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "FFFFFFFFFFFFFFFF", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "FFFFFFFFFFFFFFFF", "BBBBBBBBBBBBBBBB", "BBBBBBBBBBBBBBBB", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF"],
    roof_km_kiln: ["NBFFFFFFNBFFFFFF", "NFFFFFFFNFFFFFFF", "NFFFFFFFNFFFFFFF", "NNNNNNNNNNNNNNNN", "FFFFNBFFFFFFNBFF", "FFFFNFFFFFFFNFFF", "FFFFNFFFFFFFNFFF", "NNNNNNNNNNNNNNNN", "NBFFFFFFNBFFFFFF", "NFFFFFFFNFFFFFFF", "NFFFFFFFNFFFFFFF", "NNNNNNNNNNNNNNNN", "FFFFNBFFFFFFNBFF", "FFFFNFFFFFFFNFFF", "FFFFNFFFFFFFNFFF", "NNNNNNNNNNNNNNNN"],
    roof_km_soot: ["NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "NNmNNNNNNNNNNNNN", "dddddddddddddddd", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "dddddddddddddddd", "NNNNNNNNNNNNNNNN", "NNNNNNNmNNNNmNNN", "NNNNNNNNNNNNNNNN", "dddddddddddddddd", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "ddddddddddddmddd"],
    wall_km_cream: ["CACCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "GGGGGGGGGGGGGGGG", "CCCCGCCCCCCCGCCC", "CCCCGCCCCCCCGCCC", "CCCCGCCCCCCCGCCC", "CCCCGCCCCCCCGCCC", "wCCCGCCCCCCCGCCC", "CCCCGCCCCCCCGCCC", "CCCCGCCCCCCCGCCC", "GGGGGGGGGGGGGGGw", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCC", "CCwCCCCCCCCCCCCC"],
    wall_km_soot: ["dddNdddNdddNdddN", "dddNdddNdddNdddN", "dddNdddNdddNdddN", "dddNdddNdddNdddN", "ddmNdddNdddNdddN", "dddNdddNdddNdddN", "dddNmddNdddNdddN", "dddNdddNdddNdddN", "dddNdddNdddNdddN", "dddNdddNdddNdddN", "dddNdddNdddNdddN", "dddNdddmdddNdddN", "dddNddmNdddNdddN", "dddNdddNdddNdddN", "dddNdddNdddNdddN", "dddNdddNdddNddmN"],
    floor_km_kettle: ["FFFFFFFFFFFFFFFF", "GGGGGGGGGGGFGGGG", "GGGGGGGGGGGFGGGG", "GGGGGGGGGGGFGGGG", "GGGGGGGGGGGFGGGG", "FFFFFFFFFFFFFFFF", "GGGGGFGGGGGGGGGG", "GGGGGFGGGGGGGGGG", "GGGGGFGGGGGGGGGG", "GGGGGFGGGGGGGGGG", "FFFFFFFFFFFFFFFF", "GGGGGGGGGGFGGGGG", "GGGGGGGGGGFGGGGG", "GGGGGGGGGGFGGGGG", "GGGGGGGGGGFGGGGG", "FFFFFFFFFFFFFFFF"],
    floor_km_kettle_b: ["FFFFFFFFFFFFFFFF", "GGGGFGGGGGGGGAGG", "GGGGFGGGGGGGGGGG", "GGGGFGGGGGGGGGGG", "GGGGFGGGGGGGGGGG", "FFFFFFFFFFFFFFFF", "GGGGGGGGGGGGGFGG", "GGGGGGGGGGGGGFGG", "GGGGGGGGGGGGGFGG", "GGGGGGGGGGGGGFGG", "FFFFFFFFFFFFFFFF", "GGGFAGGGGGGGGGGG", "GGGFGBGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF"],
    floor_km_kettle_c: ["FFFFFFFFFFFFFFFF", "GGGGGGFGGGGGGGGG", "GGGGGGFGGGGGGGGG", "GGGGGGFGGGBGGGGG", "GGAGGGFGGGGGGGGG", "FFFFFFFFFFFFFFFF", "GGGGGFGGGGGGGGAG", "GGGGGFGGGGGGGGGG", "GGGGGFGGGGGGGGGG", "GGGGGFGGGGGGGGGG", "FFFFFFFFFFFFFFFF", "GGGFGGGGGGGGGGGG", "GGGBGGGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "FFFFFFFFFFFFFFFF"],
    floor_km_shard: ["BBBBBBBBBBBBBBBB", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "BBBBBBBBBBBBBBBB", "BAAAAAAABAAAAAAA", "BAAAAAAABAAAAAAA", "BAAAAAAABAAAAAAA", "BBBBBBBBBBBBBBBB", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "BBBBBBBBBBBBBBBB", "BAAAAAAABAAAAAAA", "BAAAAAAABAAAAAAA", "BAAAAAAABAAAAAAA"],
    floor_km_shard_b: ["BBBBBBBBBBBBBBBB", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "BBBBBBBBBBBBBBBB", "BAAAAAAABAAAACAA", "BAAAAAAABAAAAAAA", "BAAAAAAABAAAAAAA", "BBBBBBBBBBBBBBBB", "AAAABAAAAAAABAAC", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "BBBBBBBBBBBBBBBB", "BAAAAAAABAAAAAAA", "BAAAAAAGBAAAAAAA", "BAAAAAAABAAAAAAA"],
    floor_km_shard_c: ["BBBBBBBBBBBBBGBB", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "BBBBBBBBBCBBBBBB", "BAAAAAAABAAAAAAA", "BAAAAAAABAAAAAAA", "BAAAAAAABAAAAAAA", "GBBBBBBBBBBBBBBB", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAA", "AAAABAAAAAAABAAG", "BBBBBBBBBBBBBBBB", "BAAAAAAABAAAAAAA", "BAAAAAAABAAAAAAA", "BAAAAAAABAAAAAAA"],
    floor_km_bath: ["hhhhhhhhhhhhhhhh", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hhhhhhhhhhhhhhhh", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC"],
    floor_km_bath_b: ["hhhhhhhhhhhhhhhh", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCGCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCGCCCC", "hhhhhhhhhhhhhhhh", "hCCCCCwChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC"],
    floor_km_bath_c: ["hhhhhhhhhhhhhhhh", "hCCCCCCChCwCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hwhhhhhhhhhhhwhh", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hGCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC", "hCCCCCCChCCCCCCC"],
    floor_km_flag: ["mmmmmmmmmmmmmmmm", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mmmmmmmmmmmmmmmm", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII"],
    floor_km_flag_b: ["mmmmmmmmmmmmmmmm", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIhIIIIII", "mIIIIImIIIIIIGII", "mhIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mmmmmmmmmmmmmmmm", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII"],
    floor_km_flag_c: ["mmmmmmmmmmmmmmmm", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIhIIIIII", "mIIIIImIIIIIIIII", "mIIIIImIIIIIIIII", "mmGmmmmmmmmmmmmm", "IIIIIIIIImhIIIII", "IIIIIIIIImIIIIIG", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII", "IIIIIIIIImIIIIII"],
    floor_km_ch1: ["dddddddddddddddd", "mmmmdmmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "dddddddddddddddd", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm", "dddddddddddddddd", "mmmmdmmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "dddddddddddddddd", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm"],
    floor_km_ch1_b: ["dddddddddddddddd", "mmmmdmmmKmmmdmmm", "mmmmdmmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "dddddddddddddddd", "dmmmmmmmdmmmmmmN", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm", "dddddddddddddddd", "mmmmdmmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "mmmmdmmmmNmmdmmm", "dddddddddddddddd", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm"],
    floor_km_ch1_c: ["dddddddddddddddd", "mmmmdKmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "ddddKddKdddddddd", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm", "dddddddddddddddd", "mmmmdmmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "mmmmdmmmmmmmdmmm", "dddddddddddddddd", "dmNmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm", "dmmmmmmmdmmmmmmm"],
    floor_km_ch2: ["mmmmmmmmmmmmmmmm", "KKKKmKKKKKKKmKKK", "KKKKmKKKKKKKmKKK", "KKKKmKKKKKKKmKKK", "mmmmmmmmmmmmmmmm", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK", "mmmmmmmmmmmmmmmm", "KKKKmKKKKKKKmKKK", "KKKKmKKKKKKKmKKK", "KKKKmKKKKKKKmKKK", "mmmmmmmmmmmmmmmm", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK"],
    floor_km_ch2_b: ["mmmmmmmmmmmmmmmm", "KKKKmKKKKKKKmKKK", "KKKKmKhKKKKKmKKK", "KKKhmKKKKKKKmKKK", "mmmmmmmmmmmmdmmm", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK", "mmmmmmmmmmmmmmmm", "KKKKmKKKKKKKmKKK", "KKKKmKKKKKKKmKKK", "KKKKmKKKKKKKmKKK", "mmmmmmmmmmmmmmmm", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK"],
    floor_km_ch2_c: ["mmmmmmmmmmmmmmmm", "KKKKmKKKKKKKmKKK", "KKKKmKKKKKKKmKKh", "KKKKmKKKKKKKmKKK", "mmmmmmmmmmmmmmmm", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK", "mKKKKKhKmKKKKdKK", "mmmmmmmmmmmmmmmm", "KKKKmKKKKKKKmKKK", "KKKKmKKKKKKKmKKK", "KKKKmKKKKKKKmKKK", "mmmmmmmmmmmmmmmm", "mKKKKKKKdKKKKKKK", "mKKKKKKKmKKKKKKK", "mKKKKKKKmKKKKKKK"],
    floor_km_ch3: ["mmmmmmmmmmmmmmmm", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "mmmmmmmmmmmmmmmm", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh", "mmmmmmmmmmmmmmmm", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "mmmmmmmmmmmmmmmm", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh"],
    floor_km_ch3_b: ["mmmmmmmmmmmmmmmm", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "mmmmmmmmmmmmmmmm", "mhhhhhhhmhhhhhhh", "mwhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh", "mmmmmmmmmmmmmmmm", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "mmmmmmmmmmmmmmmm", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhwh", "mhhhhhhhmhhhhKhh"],
    floor_km_ch3_c: ["mmmmmmmmmmmmmmmm", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "mmmmmmmmmmmmmmmm", "mhhhwhhhmhhhhhKh", "mhhhhhhhmKhhhhhh", "mhhhhhhhmhhhhhhh", "mmmmmmmmmmmmmmmm", "hhhhmhhhhhhhmhhh", "hhhhmhhhhhhhmhhh", "hhhhmhwhhhhhmhhh", "mmmmmmmmmmmmmmmm", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh", "mhhhhhhhmhhhhhhh"],
    floor_km_ch4: ["mmmmmmmmmmmmmmmm", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "mmmmmmmmmmmmmmmm", "mIIIIIIImIIIIIII", "mIIIIIIImIIIIIII", "mIIIIIIImIIIIIII", "mmmmmmmmmmmmmmmm", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "mmmmmmmmmmmmmmmm", "mIIIIIIImIIIIIII", "mIIIIIIImIIIIIII", "mIIIIIIImIIIIIII"],
    floor_km_ch4_b: ["mmmmmmmmmmmmmmmm", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "mmmmmmmmmmmmmmmm", "mIIIIIIImIIIIIII", "mIIIIIIImIIhIIII", "mIIIIIIImIIIIIII", "mmmmmmmmmmmmmmmm", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "IIIImIIIIhIImIII", "mmmmmmmmmmmmmmmm", "mIIIIIIImIIIIIII", "mIIIIIIImIIIGIII", "mIIIIIIImIIIIIII"],
    floor_km_ch4_c: ["mmmmmmmmmmmhmmmm", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "mmmmmmmmmmmmmmGm", "mIIIIIIImIIIIIII", "mIIIIIIImIIIIIII", "mIIIIIIImIIIIIII", "mmmmmmmmmmmmmmmm", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "IIIImIIIIIIImIII", "mmmmmmmmmmmmmmmm", "mIIIIIIhmIIIIIII", "mIIIIIIImIIIIIII", "mIIIIIIImIGIIIII"],
    floor_km_slip: ["FFFFFFFFFFFFFFFF", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "GGGGFFGGGGGGGGGG", "GGGGGGFGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGFGGGG", "GGGGGGGGGGGGFGGG", "GGGGGGGGGGGGFGGG", "GGFGGGGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG"],
    floor_km_slip_b: ["FFFFFFFFFFFFFFFF", "GGGGGGGGGGGGGGGG", "GGGGGGGGGAGGGGGG", "GGGGGGGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "GGGGFFGGGGGGGGGG", "GGGGGGFGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGFGGGG", "GGGGGGGAGGGGFGGG", "GGGGGGGGGGGGFGBG", "GGFGGGGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG"],
    floor_km_slip_c: ["FFFFFFFFFFFFFFFF", "GGGGGGGGGGGGGGGG", "GABBGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "GGGGFFGGGGGGGGGG", "GGGGGGFGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGBGGGG", "GGGGGGGGGGGGFGGG", "GGGGGGGGGGGGFGGG", "GGFGGGGGGGGGGGGG", "GGGFGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG", "GGGGGGGGGGGGGGGG"],
    mat_km_kettle: ["FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FrrrrrrrrrrrrrrF", "FrrFrFrFrFrFrFrF", "FrrFrFrFrFrFrFrF", "FrrFrFrFrFrFrFrF", "FrrFrFrFrFrFrFrF", "FrrFrFrFrFrFrFrF", "FrrFrFrFrFrFrFrF", "FrrFrFrFrFrFrFrF", "FrrFrFrFrFrFrFrF", "FrrrrrrrrrrrrrrF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF"],
    mat_km_shard: ["FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FDDDDDDDDDDDDDDF", "FDDFDFDFDFDFDFDF", "FDDFDFDFDFDFDFDF", "FDDFDFDFDFDFDFDF", "FDDFDFDFDFDFDFDF", "FDDFDFDFDFDFDFDF", "FDDFDFDFDFDFDFDF", "FDDFDFDFDFDFDFDF", "FDDFDFDFDFDFDFDF", "FDDDDDDDDDDDDDDF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF"],
    mat_km_bath: ["nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nhhhhhhhhhhhhhhn", "nhhnhnhnhnhnhnhn", "nhhnhnhnhnhnhnhn", "nhhnhnhnhnhnhnhn", "nhhnhnhnhnhnhnhn", "nhhnhnhnhnhnhnhn", "nhhnhnhnhnhnhnhn", "nhhnhnhnhnhnhnhn", "nhhnhnhnhnhnhnhn", "nhhhhhhhhhhhhhhn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn"],
    mat_km_council: ["FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FHHHHHHHHHHHHHHF", "FHHFHFHFHFHFHFHF", "FHHFHFHFHFHFHFHF", "FHHFHFHFHFHFHFHF", "FHHFHFHFHFHFHFHF", "FHHFHFHFHFHFHFHF", "FHHFHFHFHFHFHFHF", "FHHFHFHFHFHFHFHF", "FHHFHFHFHFHFHFHF", "FHHHHHHHHHHHHHHF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF"],
    mat_km_hall: ["NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "NBBBBBBBBBBBBBBN", "NBBNBNBNBNBNBNBN", "NBBNBNBNBNBNBNBN", "NBBNBNBNBNBNBNBN", "NBBNBNBNBNBNBNBN", "NBBNBNBNBNBNBNBN", "NBBNBNBNBNBNBNBN", "NBBNBNBNBNBNBNBN", "NBBNBNBNBNBNBNBN", "NBBBBBBBBBBBBBBN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN"],
    mat_km_stone: ["FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FGGGGGGGGGGGGGGF", "FGGFGFGFGFGFGFGF", "FGGFGFGFGFGFGFGF", "FGGFGFGFGFGFGFGF", "FGGFGFGFGFGFGFGF", "FGGFGFGFGFGFGFGF", "FGGFGFGFGFGFGFGF", "FGGFGFGFGFGFGFGF", "FGGFGFGFGFGFGFGF", "FGGGGGGGGGGGGGGF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFF"],
    km_basin_top: ["hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "hhhhhhhhhhhhhhhh", "wwwwwwwwwwwwwwww", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nndnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnndnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnndnnn", "nnnnnnnnnnnndnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn"],
    km_basin: ["nnnnnnnnnnnnnnnn", "nnnnnnnnnndnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnndnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnbbbbnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnndn", "nnnnnnnnnnnnnnnn", "nnnnnnnnnnnnnnnn", "nnnnndnnnndnnnnn", "nnnnnnnnnnnnnnnn"],
    km_rail: ["IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "IIIIIIIIIIIIIIII", "AAAAAAAAAAAAAAAA", "GGGGGGGGGGGGGGGG", "IIGGIIIIIIIIGGII", "IIGGIIIIIIIIGGII", "IIGGIIIIIIIIGGII", "IIGGIIIIIIIIGGII", "IIGGIIIIIIIIGGII", "IIGGIIIIIIIIGGII", "IIGGIIIIIIIIGGII", "mmmmmmmmmmmmmmmm", "mmmmmmmmmmmmmmmm"],
    km_arch: ["NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "FFFFFNFFFFFNFFFF", "FFFFFNFFFFFNFFFF", "FFFFFNFFFFFNFFFF", "FFFFFNFFFFFNFFFF", "FFFBFNFFFFFNFFBB", "FFFFFNFFFFFNFFFF", "FFFFFNFFFFFNFFFF", "FFFFFNFFFFFNFFFF", "FFFFFNFFBFFNFFFF", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN", "NNNNNNNNNNNNNNNN"],
    km_dais: ["BBBBBBBBBBBBBBBB", "BBBBBBBBGBBBBBBB", "BBBBBGGGGGGGBBBB", "BBBBGGGGBGGGGBBB", "BBBGGBBBBBBBGGBB", "BBGGBBBBGBBBBGGB", "BBGGBBGGGGGBBGGB", "BBGGBBGGGGGBBGGB", "BGGBBGGGFGGGBBGG", "BBGGBBGGGGGBBGGB", "BBGGBBGGGGGBBGGB", "BBGGBBBBGBBBBGGB", "BBBGGBBBBBBBGGBB", "BBBBGGGGBGGGGBBB", "BBBBBGGGGGGGBBBB", "BBBBBBBBGBBBBBBB"],
  },
  art: {
    km_tower: ["................................................................", "................................................................", "..............kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..............", ".............kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk.............", ".............kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk.............", ".............kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk.............", ".............kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk.............", "........kkkkkkNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNkkkkkk........", ".......kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk.......", ".......kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk.......", ".......kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk.......", ".......kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk.......", ".......kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk.......", "....kkkkNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNkkkk....", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNk...", "...kddddddddddddddddddddddddddddddddddddddddddddddddddddddddk...", "....kkkkkkhhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmkkkkkk....", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKddddddddmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKdNNNNNNdmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKdNNNNNNdmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKdNNNNNNdmKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmdNNNNNNdmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKdNNNNNNdKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKdNNNNNNdKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKdNNNNNNdKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKdNNNNNNdKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKdNNNNNNdKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKdNNNNNNdKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKdNNNNNNdKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKdNNNNNNdKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKddddddddKKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKKKKKKKKKKKKKmKKKKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKddddddddddddddddKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmdNNNNNNNNNNNNNNdmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKmKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKmKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........kmmmmmmmmmmmmmmdNNNNNNNNNNNNNNdmmmmmmmmmmmmmmk.........", ".........khhhhKKKKKKKKKKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", ".........khhhhKKKKKKKKKKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmk.........", "......kkkkhhhhKKKKKKKKKKdNNNNNNNNNNNNNNdKKKKKKKKmmmmmmkkkk......", ".....khhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhk.....", ".....kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.....", ".....kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.....", ".....kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.....", ".....kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.....", ".....kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.....", ".....kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.....", ".....kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.....", ".....kmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.....", ".....kddddddddddddddddddddddddddddddddddddddddddddddddddddk....."],
    km_kiln: ["................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................................................", "................kkkkkkkkkkkkkkkk................", "...............kFFFFFFFFFFFFFFFFk...............", "...............kFFFFFFFFFFFFFFFFk...............", "...............kFFFFFFFFFFFFFFFFk...............", "................kBBBBBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "...............kkBAABBBBBBBBBBBBkk..............", "..............kBBBAABBBBBBBBBBBBBBk.............", ".............kBBBBAABBBBBBBBBBBBBBBk............", "............kBBBBBAABBBBBBBBBBBBBBBBk...........", "............kBBBBBBBBBBBBBBBBBBBBBBBk...........", "...........kBBBBBBBBBBBBBBBBBBBBBBBBBk..........", "..........kBBBBBBBBBBBBBBBBBBBBBBBBBBBk.........", ".........kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk........", "........kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk.......", ".......kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk......", "......kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk.....", "......kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk.....", ".....kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk....", ".....kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk....", "....kBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBk...", "....kBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBk...", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBBk.", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kFAAAFFFFFFFFFFFFFFFFFNFFFFFFFFFFFFFFFFFFFFk..", "..kFAAAFFFFFFFFFFFFFFNNNNNNNFFFFFFFFFFFFFFFFFk..", "..kBAAABBBFBBBBBBBBNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNNBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBBBBBBBBBBBBBBBNNNNNNNNNNNNBBBBBBBBBBBBBBBk..", "..kBBBBBBBBBBBBBBBNNNNNNNNNNNNBBBBBBBBBBBBBBBk.."],
    km_kiln_smoke_0: ["..........................................kkhkk.", "....................................kkkkkkhhhhhk", "..................................kkmmmmmhhhhhhh", ".................................kmmmmmmmmhhhhhk", ".................................kmmmmmmmmmkhkk.", "................................kmmmmmmmmmmmk...", ".............................kkkkkmmmmmmmmmk....", "...........................kkhhhhhmmmmmmmmmk....", "..........................khhhhhhhhhmmmmmkk.....", "..........................khhhhhhhhhkkkkk.......", ".........................khhhhhhhhhhhk..........", "..........................khhhhhhhhhk...........", "..........................khhhhhhhhhk...........", "........................kkkkkhhhhhkk............", ".......................kmmmmmkkkkk..............", "......................kmmmmmmmk.................", ".....................kmmmmmmmmmk................", "......................kmmmmmmmk.................", ".......................kmmmmmk..................", "........................kkkkk...................", "................................................", "................kkkkkkkkkkkkkkkk................", "...............kFFFooooooooooFFFk...............", "...............kFFFFFFFFFFFFFFFFk...............", "...............kFFFFFFFFFFFFFFFFk...............", "................kBBBBBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "...............kkBAABBBBBBBBBBBBkk..............", "..............kBBBAABBBBBBBBBBBBBBk.............", ".............kBBBBAABBBBBBBBBBBBBBBk............", "............kBBBBBAABBBBBBBBBBBBBBBBk...........", "............kBBBBBBBBBBBBBBBBBBBBBBBk...........", "...........kBBBBBBBBBBBBBBBBBBBBBBBBBk..........", "..........kBBBBBBBBBBBBBBBBBBBBBBBBBBBk.........", ".........kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk........", "........kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk.......", ".......kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk......", "......kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk.....", "......kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk.....", ".....kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk....", ".....kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk....", "....kBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBk...", "....kBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBk...", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBBk.", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kFAAAFFFFFFFFFFFFFFFFFNFFFFFFFFFFFFFFFFFFFFk..", "..kFAAAFFFFFFFFFFFFFFNNNNNNNFFFFFFFFFFFFFFFFFk..", "..kBAAABBBFBBBBBBBBNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNNBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBBBBBBBBBBBBBBBNNNNNNNNNNNNBBBBBBBBBBBBBBBk..", "..kBBBBBBBBBBBBBBBNNNNNNNNNNNNBBBBBBBBBBBBBBBk.."],
    km_kiln_smoke_1: ["..............................................k.", "............................................kkhk", "......................................kkkkkkhhhh", "....................................kkmmmmmhhhhh", "...................................kmmmmmmmmhhhh", "...................................kmmmmmmmmmkhk", "..................................kmmmmmmmmmmmk.", "...............................kkkkkmmmmmmmmmk..", ".............................kkhhhhhmmmmmmmmmk..", "............................khhhhhhhhhmmmmmkk...", "............................khhhhhhhhhkkkkk.....", "...........................khhhhhhhhhhhk........", "............................khhhhhhhhhk.........", "............................khhhhhhhhhk.........", "..........................kkkkkhhhhhkk..........", ".........................kmmmmmkkkkk............", "........................kmmmmmmmk...............", ".......................kmmmmmmmmmk..............", "........................kmmmmmmmk...............", ".........................kmmmmmk................", "..........................kkkkk.................", "................kkkkkkkkkkkkkkkk................", "...............kFFFooooooooooFFFk...............", "...............kFFFFFFFFFFFFFFFFk...............", "...............kFFFFFFFFFFFFFFFFk...............", "................kBBBBBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "................kBAABBBBBBBBBBBk................", "...............kkBAABBBBBBBBBBBBkk..............", "..............kBBBAABBBBBBBBBBBBBBk.............", ".............kBBBBAABBBBBBBBBBBBBBBk............", "............kBBBBBAABBBBBBBBBBBBBBBBk...........", "............kBBBBBBBBBBBBBBBBBBBBBBBk...........", "...........kBBBBBBBBBBBBBBBBBBBBBBBBBk..........", "..........kBBBBBBBBBBBBBBBBBBBBBBBBBBBk.........", ".........kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk........", "........kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk.......", ".......kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk......", "......kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk.....", "......kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk.....", ".....kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk....", ".....kBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBk....", "....kBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBk...", "....kBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBk...", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "...kBBBBBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBBk.", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBBBBBBBBBBBBBBBBBBBBFBBBBBBk..", "..kFAAAFFFFFFFFFFFFFFFFFNFFFFFFFFFFFFFFFFFFFFk..", "..kFAAAFFFFFFFFFFFFFFNNNNNNNFFFFFFFFFFFFFFFFFk..", "..kBAAABBBFBBBBBBBBNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBBNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNNBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBAAABBBFBBBBBBBNNNNNNNNNNNNBBBBBBBBFBBBBBBk..", "..kBBBBBBBBBBBBBBBNNNNNNNNNNNNBBBBBBBBBBBBBBBk..", "..kBBBBBBBBBBBBBBBNNNNNNNNNNNNBBBBBBBBBBBBBBBk.."],
    km_stall: ["................................", "................................", "................................", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".kAAAAAAAAAAAAAAAAAAAAAAAAAAAAk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", "..kFFkkkkkkkkkkkkkkkkkkkkkkFFk..", "..kFFk....................kFFk..", "..kFFk....................kFFk..", "..kFFk....................kFFk..", "..kFFk....................kFFk..", "..kFFk....................kFFk..", "..kFFk....................kFFk..", "..kFFkkkkkkkkkkkkkkkkkkkkkkFFk..", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", "..kFFkkkkkkkkkkkkkkkkkkkkkkFFk..", "..kFFk....................kFFk..", "...kk......................kk...", "................................", "................................", "................................"],
    km_stall_ware: ["................................", "................................", "................................", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".kAAAAAAAAAAAAAAAAAAAAAAAAAAAAk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", "..kFFkkkkkkkkkkkkkkkkkkkkkkFFk..", "..kFFk................k...kFFk..", "..kFFk..............kkBkkkkFFk..", "..kFFkkkkkk..kkkk..kCCCCCCkFFk..", "..kFFkBBBBBkkAAAAk.kCCCCCCkFFk..", "..kFFkBBBBBkkAAAAk.kCCCCCCkFFk..", "..kFFkBBBBBkkAAAAk.kCCCCCCkFFk..", "..kFFkBBBBBkkAAAAkkkCCCCCCkFFk..", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", "..kFFkkkkkkkkkkkkkkkkkkkkkkFFk..", "..kFFk....................kFFk..", "...kk......................kk...", "................................", "................................", "................................"],
    km_stall_wool: ["................................", "................................", "................................", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".kAAAAAAAAAAAAAAAAAAAAAAAAAAAAk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", "..kFFkkkkkkkkkkkkkkkkkkkkkkFFk..", "..kFFkkkkkkk........kkkkkkkFFk..", "..kFFkrwwwwrkkkkkkkkyyyyyykFFk..", "..kFFkrrrrrrkhhhhhhkyyyyyykFFk..", "..kFFkrrrrrrkhhhhhhkyyyyyykFFk..", "..kFFkrrrrrrkhhhhhhkyyyyyykFFk..", "..kFFkrrrrrrkhhhhhhkyyyyyykFFk..", "..kFFkrrrrrrkhhhhhhkyyyyyykFFk..", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", "..kFFkkkkkkkkkkkkkkkkkkkkkkFFk..", "..kFFk....................kFFk..", "...kk......................kk...", "................................", "................................", "................................"],
    km_stall_coal: ["................................", "................................", "................................", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".kAAAAAAAAAAAAAAAAAAAAAAAAAAAAk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", "..kFFkkkkkkkkkkkkkkkkkkkkkkFFk..", "..kFFk...........kkkkkkkkkkFFk..", "..kFFkkkkkkkkk..kFFFFFFFFFkFFk..", "..kFFkddddddddk.kFGGGGGGGFkFFk..", "..kFFkddddddmdk.kFFFFFFFFFkFFk..", "..kFFkdddddddmk.kFGGGGGGGFkFFk..", "..kFFkdddkddddk.kFFFFFFFFFkFFk..", "..kFFkdmdmdkddkkkFFFFFFFFFkFFk..", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", "..kFFkkkkkkkkkkkkkkkkkkkkkkFFk..", "..kFFk....................kFFk..", "...kk......................kk...", "................................", "................................", "................................"],
    km_gauge: ["................", "......kkkk......", ".....kwwwhk.....", "....kkwwwhk.....", "...krrrwwhk.....", "....kkwwwhk.....", "....kkwwwhk.....", "...krrrwwhk.....", "....kkwwwhk.....", "....kkwwwhk.....", "...krrrwwhk.....", "....kkwwwhk.....", "....kkwwwhk.....", "...krrrwwhk.....", "....kkwwwhk.....", "....kkwwwhk.....", "...krrrwwhk.....", "....kkwwwhk.....", "....kkwwwhk.....", "...krrrwwhk.....", "....kkwwwhk.....", "....kkwwwhk.....", "...krrrwwhk.....", "....kkwwwhk.....", ".....kwwwhk.....", ".....kwwwhk.....", "....knnnnnnk....", "....knnnnnnk....", "....kkwwwhkk....", "...kmmmmmmmmk...", "...kmmmmmmmmk...", "...kmmmmmmmmk..."],
    km_hammer: ["................................", "................................", "................................", "................................", "................................", "...kkkkkkkkkkkkkkkkkkkkkkkkkk...", "..kFFFFFFFFFFFFFFFFFFFFFFFFFFk..", "..kFFFFFFFFFFFFFFFFFFFFFFFFFFk..", "..kFFFFFFFFFFFFFFFFFFFFFFFFFFk..", "..kFFFkkkkGGkkkkkkkkkkkkkkFFFk..", "..kFFFk..kGGk............kFFFk..", "..kFFFk..kGGk.......kkkkkkFFFk..", "..kFFFk..kGGk......kGGGGGGFFFk..", "..kFFFk..kGGk......kGGGGGGFFFk..", "..kFFFk..kGGk......kGGGGGGFFFk..", "..kFFFk..kGGk......kGGGGGGFFFk..", "..kFFFk..kGGk.......kkkkkkFFFk..", "..kFFFk..kGGk............kFFFk..", "..kFFFk..kGGk............kFFFk..", "..kFFFkkkkGGkkkk.........kFFFk..", "..kFFFkhhhhhhhhhk........kFFFk..", "..kFFFkmmmmmmmmmk........kFFFk..", "..kFFFkmmmmmmmmmk........kFFFk..", "..kFFFkmmmmmmmmmk........kFFFk..", "..kFFFkmmmmmmmmmk........kFFFk..", "..kFFFkkkkkkkkkk.........kFFFk..", "..kFFFkkkkkkkkkkkkkkkkkkkkFFFk..", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".kGGFFFFFFFFFFFFFFFFFFFFFFFFGGk.", ".kGGFFFFFFFFFFFFFFFFFFFFFFFFGGk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk.."],
    km_coach_shelter: ["................", "................", "................", "..kkkkkkkkkkkk..", ".kGGGGGGGGGGGGk.", ".kFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFk.", "..kFFkkkkkkFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFkkkkkkFFk..", "..kFFCCCCCCFFk..", "..kFFCddddCFFk..", "..kFFCCCCCCFFk..", "..kFFCdddCCFFk..", "..kFFCCCCCCFFk..", "..kFFCCCCCCFFk..", "..kFFkkkkkkFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFkkkkkkFFk..", ".kGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGk.", "..kkkkkkkkkkkk.."],
    km_porch: ["......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "....kkkFFkkk....", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "....kyyyyyyk....", "....kyooooyk....", "....kyowwoyk....", "....kyowwoyk....", "....kyowwoyk....", "....kyooooyk....", "....kyyyyyyk....", "....kFFFFFFk....", ".....kkkkkk.....", "................", "................", "................", "................", ".kkkkkkkkkkkkkk.", "kAAAAAAAAAAAAAAk", "kGGGGGGGGGGGGGGk", "kGGGGGGGGGGGGGGk", ".kFFkkkkkkkkFFk.", ".kFFk......kFFk.", ".kFFk......kFFk.", ".kFFk......kFFk.", ".kFFk......kFFk.", ".kFFk......kFFk.", "..kk........kk.."],
    km_awning: ["................................................", ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", "krrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwk", "krrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwk", "krrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwk", "krrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwk", "krrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwk", "krrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwk", "krrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwk", "krrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwwrrrrwwwk", "krrkkrrkkrrkkrrkkrrkkrrkkrrkkrrkkrrkkrrkkrrkkrrk", "krrkkrrkkrrkkrrkkrrkkrrkkrrkkrrkkrrkkrrkkrrkkrrk", ".kkFFkk..kk..kk..kk..kk..kk..kk..kk..kk..kkFFkk.", "..kFFk....................................kFFk..", "..kFFk....................................kFFk..", "..kFFk....................................kFFk..", "..kFFk..kkk..........kkk..........kkk.....kFFk..", "..kFFk.kBBBkkkk.....kBBBkkkk.....kBBBkkkk.kFFk..", "..kFFk.kBBBkCCCk....kBBBkCCCk....kBBBkCCCkkFFk..", "..kFFkkkBBBkCCCkk..kkBBBkCCCkk..kkBBBkCCCkkFFk..", "..kFFkAAAAAAAAAAAkkAAAAAAAAAAAkkAAAAAAAAAAAFFk..", "..kFFkGGGGGGGGGGGkkGGGGGGGGGGGkkGGGGGGGGGGGFFk..", "..kFFkGGGGGGGGGGGkkGGGGGGGGGGGkkGGGGGGGGGGGFFk..", "..kFFkGGGGGGGGGGGkkGGGGGGGGGGGkkGGGGGGGGGGGFFk..", "...kkkFFFFFFFFFFFkkFFFFFFFFFFFkkFFFFFFFFFFFkk...", ".....kGGGGGGGGGGGkkGGGGGGGGGGGkkGGGGGGGGGGGk....", ".....kGGGGGGGGGGGkkGGGGGGGGGGGkkGGGGGGGGGGGk....", ".....kGGGGGGGGGGGkkGGGGGGGGGGGkkGGGGGGGGGGGk....", ".....kGGGGGGGGGGGkkGGGGGGGGGGGkkGGGGGGGGGGGk....", ".....kGGGGGGGGGGGkkGGGGGGGGGGGkkGGGGGGGGGGGk....", "......kkkkkkkkkkk..kkkkkkkkkkk..kkkkkkkkkkk.....", "................................................"],
    km_chimney: ["................", "....kkkkkkkk....", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "...kBAABBBBBk...", "..kFFFFFFFFFFk..", "..kFFFFFFFFFFk..", "..kFFFFFFFFFFk..", "..kFFFFFFFFFFk..", "..kmmmmmmmmmmk..", "..kmmmmmmmmmmk..", "..kmmmmmmmmmmk..", "...kkkkkkkkkk..."],
    km_gate_post: ["................", "................", "................", "....kkkkkkkkk...", "...kGGGGGGGGGk..", "...kGGGGGGGGGk..", "..kGGkkFFFkkk...", "..kGGkkFFFk.....", "..kGGkkFFFk.....", "...kk.kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", ".....kmmmmmk....", ".....kmmmmmk....", ".....kmmmmmk....", "......kkkkk....."],
    km_bent_post: ["................", "................", "................", "................", "................", ".......kkkkkkk..", "......kFFFFFFFk.", "......kFFFFFFFk.", "......kFFFkkFFk.", "......kFFFkkFFk.", "......kFFFkkFFk.", "......kFFFkkFFk.", "......kFFFk.kk..", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", "......kFFFk.....", ".....kmmmmmk....", ".....kmmmmmk....", ".....kmmmmmk....", "......kkkkk....."],
    km_sluice: ["................", "................", ".....kkkkkk.....", "....kFFFFFFk....", "....kFFFFFFk....", "..kkkFFFFFFkkk..", ".kAAAAAAAAAAAAk.", ".kGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGk.", ".kGFFFFFFFFFFGk.", ".kGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGk.", "..kkFFFFFFFFkk..", "....kkkkkkkk...."],
    km_mural_board: ["................", ".kkkkkkkkkkkkkk.", "kGGGGGGGGGGGGGGk", "kAAAAAAAAAAAAAAk", "kCCCCCCCCCCCCCCk", "kCCCCCCCCCCCCCCk", "kCCCCCyyyyCCCCCk", "kAAoooyyyyoooAAk", "kCCoooCCCCoooCCk", "kCCooorrrroooCCk", "kCCCCrrrkrrCCCCk", "kAAAArrrrrrAAAAk", "kCCCCrrrrrrCCCCk", "kCCCCCCyyCCCCCCk", "kCCCCCCyyCCCCCCk", "kAAAAAAyyAAAAAAk", "kCCCCCCyyCCCCCCk", "kCCCCCCyyCCCCCCk", "kCCCCCCCCCCCCCCk", "kAAAAAAAAAAAAAAk", "kCCCCCCCCCCCCCCk", "kCCCCCCCCCCCCCCk", "kCCCCCCCCCCCCCCk", "kAAAAAAAAAAAAAAk", ".kkFFkkkkkkFFkk.", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "..kFFk....kFFk..", "...kk......kk..."],
    km_woodstack: ["................", "................", "................", "....k....k......", "..kkFkkkkFkk....", ".kFFGFFFFGFFk...", ".kFFFFFFFFFFkk..", ".kFFFFFFFFFFkFkk", "kFFGFFFFGFFFFGFF", "kFFFFFFFFFFFFFFF", "kFFFFFFFFFFFFFFF", "FGFFFFGFFFFGFFkk", "FFFFFFFFFFFFFFk.", "FFFFFFFFFFFFFFk.", "kFkkkkFkkkkFkk..", ".k....k....k...."],
    km_fence_gate: ["..kk...........kk...........kk..", ".kFFk.........kFFk.........kFFk.", ".kFFkkkkkkkkkkkFFkkkkkkkkkkkFFk.", "kAFFAAAAAAAAAAAFFAAAAAAAAAAAFFAk", "kGFFGGGGGGGGGGGFFGGGGGGGGGGGFFGk", "kGFFGGGGGGGGGGGFFGGGGGGGGGGGFFGk", ".kFFkkkkkkkkkkkFFkkkkkkkkkkkFFk.", ".kFFk.........kFFk.........kFFk.", ".kFFkkkkkkkkkkkFFkkkkkkkkkkkFFk.", "kAFFAAAAAAAAAAAFFAAAAAAAAAAAFFAk", "kGFFGGGGGGGGGGGFFGGGGGGGGGGGFFGk", "kGFFGGGGGGGGGGGFFGGGGGGGGGGGFFGk", ".kFFkkkkkkkkkkkFFkkkkkkkkkkkFFk.", ".kFFk.........kFFk.........kFFk.", ".kFFk.........kFFk.........kFFk.", "..kk...........kk...........kk.."],
    km_permit: [".......kk.......", "......kFFk......", "..kkkkkFFkkkkk..", ".kGGGGGGGGGGGGk.", ".kGGGGGGGGGGGGk.", ".kCCCCCCCCCCCCk.", ".kCCCCCCCCCCCCk.", ".kCCddddddddCCk.", ".kCCCCCCCCCCCCk.", ".kCCddddddCCCCk.", ".kCCCCCCCCCCCCk.", ".kCCCCCCCCCCCCk.", ".kCCCCCCCCCCCCk.", "..kkkkkkkkkkkk..", "................", "................"],
    km_slip: ["................", "................", "..kkkkkkkkkkkk..", ".kyyyyyyyyyyyyk.", ".kyyyyyyyyyyyyk.", ".kwwwwwwwwwwwwk.", ".kwwwwwwwwwwwwk.", ".kwwddddddddwwk.", ".kwwwwwwwwwwwwk.", ".kwwdddddddwwwk.", ".kwwwwwwwwwwwwk.", ".kwwwwwwwwwwwwk.", ".kwwwwwwwwwwwwk.", "..kkkkkkkkkkkk..", "................", "................"],
    km_by_order: ["................", "..kkkkkkkkkkkk..", ".kddddddddddddk.", ".kddddddddddddk.", ".kddddddddddddk.", ".kwwwwwwwwwwwwk.", ".kwwwwwwwwwwwwk.", ".kwwkkkkkkkkwwk.", ".kwwwwwwwwwwwwk.", ".kwwkkkkkkkkwwk.", ".kwwwwwwwwwwwwk.", ".kwwkkkkkwwwwwk.", ".kwwwwwwwwwwwwk.", ".kwwwwwwwwwwwwk.", "..kkkkkkkkkkkk..", "................"],
    km_bed_jug: ["...........BB...", ".FFFFFFFFFBBBBF.", ".FwwwwwwwwABBBF.", ".FwwwwwwwwABBBF.", ".FwwwwwwwwABBBF.", ".FhhhhhhhhBBBBF.", ".FrrrrrrrrrrrrF.", ".FrryyrryyrryyF.", ".FrrrrrrrrrrrrF.", ".FrrrrrrrrrrrrF.", ".FrrrrrrrrrrrrF.", ".FrryyrryyrryyF.", ".FrrrrrrrrrrrrF.", ".FrrrrrrrrrrrrF.", ".FFFFFFFFFFFFFF.", ".kkkkkkkkkkkkkk."],
    km_stove: [".............kddddk.............", ".............kddddk.............", ".........k...kddddk....k........", "........khk..kddddk...khk.......", ".......kkmkk.kddddk..kkmkk.kkk..", "......kmmmmmkmddddk.kmmmmmkmmmk.", ".....kmmmmmmmkddddkkmmmmmmmkkk..", "....kmmmmmmmmmddddkmmmmmmmmmk...", ".....kmmmmmmmkddddkkmmmmmmmk....", "...kkkmmmmmmmkddddkkmmmmmmmkk...", "..kddddddmdddddddddddddmdddddk..", "..kddddddddddddddddddddddddddk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "..kNNNNNddddddddddddddddNNNNNk..", "..kNNNNNddddddddddddddddNNNNNk..", "..kNNNNNddooooooooooooddNNNNNk..", "..kNNNNNddooyyyyyyyyooddNNNNNk..", "..kNNNNNddooyyyyyyyyooddNNNNNk..", "..kNNNNNddooyyyyyyyyooddNNNNNk..", "..kNNNNNddooooooooooooddNNNNNk..", "..kNNNNNddddddddddddddddNNNNNk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "..kNNNNNNNNNNNNNNNNNNNNNNNNNNk..", "...kkkkkkkkkkkkkkkkkkkkkkkkkk...", "................................"],
    km_vent: ["................", "..kkkkkkkkkkkk..", ".kddddddddddddk.", ".kdNNNNNNNNNNdk.", ".kdNNNNNNNNNNdk.", ".kdNmmmmmmmmNdk.", ".kdNNNNNNNNNNdk.", ".kdNNNNNNNNNNdk.", ".kdNmmmmmmmmNdk.", ".kdNNNNNNNNNNdk.", ".kdNNNNNNNNNNdk.", ".kdNmmmmmmmmNdk.", ".kdNNNNNNNNNNdk.", ".kddddddddddddk.", "..kkkkkkkkkkkk..", "................"],
    km_vent_lit: ["................", "..kkkkkkkkkkkk..", ".kddddddddddddk.", ".kdoooooooooodk.", ".kdoooooooooodk.", ".kdoyyyyyyyyodk.", ".kdoooooooooodk.", ".kdoooooooooodk.", ".kdoyyyyyyyyodk.", ".kdoooooooooodk.", ".kdoooooooooodk.", ".kdorrrrrrrrodk.", ".kdoooooooooodk.", ".kddddddddddddk.", "..kkkkkkkkkkkk..", "................"],
    km_firebox: ["................................................................", "................................................................", "................................................................", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".kddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddk.", ".kddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddk.", ".kddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNdNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNdddddddddddddddddddddNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNdddddddddddddddddddddddddddNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNddddddddddddddddkddddddddddddddddNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmdddddddddkkkkkkkkkkkkkkkkkkkddddddddmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmddddddkkkkkkkkkkkkkkkkkkkkkkkkkdddddmmNNNNNNNNNNk.", ".kNNNNNNNNNNddddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkddddddNNNNNNNNNk.", ".kNNNNNNNNNdddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkdddddNNNNNNNNk.", ".kNNNNNNNNNddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkddddNNNNNNNNk.", ".kNNNNNNNNdddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkdddddNNNNNNNk.", ".kNNNNNNNNddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkdddNNNNNNNNk.", ".kNNNNNNNNddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkddddNNNNNNNNk.", ".kNNNNNNNNddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkddddNNNNNNNNk.", ".kNNNNNNNNddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkddddNNNNNNNNk.", ".kNNNNNNNNddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkddddNNNNNNNNk.", ".kNNNNNNNNddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkddddNNNNNNNNk.", ".kNNNNNNNNddddkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkddddNNNNNNNNk.", "..kkkkkkkkkkkkkkkkkkkkddddddddddkddddddddddkkkkkkkkkkkkkkkkkkk..", "......................kkkkkkkkkkdkkkkkkkkkk....................."],
    km_firebox_lit: ["................................................................", "................................................................", "................................................................", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".kddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddk.", ".kddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddk.", ".kddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNNNNNNNNNNNdNNNNNNNNNNNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNNNNdddddddddddddddddddddNNNNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNNNNdddddddddddddddddddddddddddNNNNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmNNddddddddddddddddoddddddddddddddddNmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmdddddddddoooooooooooooooooooddddddddmmNNNNNNNNNNk.", ".kNNNNNNNNNNmmddddddooooooooooooooooooooooooodddddmmNNNNNNNNNNk.", ".kNNNNNNNNNNddddddoooooooooooooooooooooooooooooddddddNNNNNNNNNk.", ".kNNNNNNNNNdddddooooooooooooooooooooooooooooooooodddddNNNNNNNNk.", ".kNNNNNNNNNddddoooooooooooooooooyoooooooooooooooooddddNNNNNNNNk.", ".kNNNNNNNNdddddoooooooooooyyyyyyyyyyyyyooooooooooodddddNNNNNNNk.", ".kNNNNNNNNddddooooooooooyyyyyyyyyyyyyyyyyoooooooooodddNNNNNNNNk.", ".kNNNNNNNNddddoooooooooyyyyyyyyyyyyyyyyyyyooooooooddddNNNNNNNNk.", ".kNNNNNNNNddddooooooooyyyyyyyyyyyyyyyyyyyyyoooooooddddNNNNNNNNk.", ".kNNNNNNNNddddoooooooooyrrrrrrrrrrrrrrrryyooooooooddddNNNNNNNNk.", ".kNNNNNNNNddddoooooooooorrrrrrrrrrrrrrrryoooooooooddddNNNNNNNNk.", ".kNNNNNNNNddddoooooooooorrrrrrrrrrrrrrrrooooooooooddddNNNNNNNNk.", ".kNNNNNNNNddddoooooooooorrrrrrrrrrrrrrrrooooooooooddddNNNNNNNNk.", "..kkkkkkkkkkkkkkkkkkkkddddddddddoddddddddddkkkkkkkkkkkkkkkkkkk..", "......................kkkkkkkkkkdkkkkkkkkkk....................."],
    km_stone_gate: [".kkkkkkkkkkkkkk.", "khhhhhhhhhhhhhhk", "khhhhhhhhhhhhhhk", "kKKKKKKKKKKKKKKk", "kKKKKKKKKKKKKKKk", "kKKKmmmmmmmmKKKk", "kKKKmddddddmKKKk", "kKKKmmmmmmmmKKKk", "kKKKmmmmmmmmKKKk", "kKKKmddddddmKKKk", "kKKKmmmmmmmyKKKk", "kKKKmmmmmmmmKKKk", "kKKKmmmmmmmmKKKk", "kKKKmmmmmmmmKKKk", "kKKKKKKKKKKKKKKk", "kKKKKKKKKKKKKKKk"],
    km_hall_stone: ["................", "................", "................", "................", "................", "................", "................", "................", "........k.......", "......kkBkk.....", ".....kBBoBBk....", "....kBoooooBk...", "...kBByyoooBBk..", "...kBoyyooooBk..", "..kBBoyyooooBBk.", "..kBBoyyooooBBk.", "..kBBoyyooooBBk.", "..kBooyyoooooBk.", ".kBBBoooooooBBBk", "..kBBoooooooBBk.", "..kBBoooooooBBk.", "..kBBoooooooBBk.", "..kBBBoooooBBBk.", "...kBBoooooBBk..", "...kBBBBoBBBBk..", "...kkBBBBBBBk...", "..kFFFFFFFFFFk..", "..kFFFFFFFFFFk..", "..kFFFFFFFFFFk..", "...kkkkkkkkkk...", "................", "................"],
    km_plate: ["................", "................", "...kkkkkkkkkk...", "..kGGGGGGGGGGk..", "..kGAAAAAAAAGk..", "..kGAAAAAAAAGk..", "..kGAFFFFFFAGk..", "..kGAAAAAAAAGk..", "..kGAFFFFFAAGk..", "..kGAAAAAAAAGk..", "..kGAAAAAAAAGk..", "..kGGGGGGGGGGk..", "...kkkkkkkkkk...", "................", "................", "................"],
    km_notches: ["................", ".............hh.", ".........Frrrrh.", ".............hh.", ".............hh.", ".........Frrrrh.", ".............hh.", ".............hh.", ".........Frrrrh.", ".............hh.", ".............hh.", ".........Frrrrh.", ".............hh.", ".............hh.", ".............hh.", "................"],
    km_ticket_seat: ["................", "................", "...GGGGGGGGGG...", "...GAAAAAAAAG...", "...GGGGGGGGGG...", "...GGGGGGGGGG...", ".GGGGGGGGGGGGGG.", ".GGGGGGGGGGGGGG.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", ".FFFFFFFFFFFFFF.", "..kkkkkkkkkkkk.."],
    km_chair: ["................", "....kkkkkkkk....", "...kFFFFFFFFk...", "...kFGGGGGGFk...", "...kFGGGGGGFk...", "...kFGGGGGGFk...", "...kFGGGGGGFk...", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kFFkkkkFFk...", "...kFFk..kFFk...", "...kFFk..kFFk...", "...kFFk..kFFk...", "....kk....kk...."],
    km_chair_back: ["................", "....kkkkkkkk....", "...kFFFFFFFFk...", "...kFNNNNNNFk...", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kFFFFFFFFk...", "...kFFkkkkFFk...", "...kFFk..kFFk...", "...kFFk..kFFk...", "...kFFk..kFFk...", "....kk....kk...."],
    km_peg_board: ["................................", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFGGyGGGyGGGyGGGyGGGyGGGyGGGFk.", ".kFGGFFGGFFGGFFGGFFGGFFGGFFGGFk.", ".kFGGFFGGFFGGFFGGFFGGFFGGFFGGFk.", ".kFGGFFGGFFGGFFGGFFGGFFGGFFGGFk.", ".kFGGFFGGFFGGFFGGFFGGFFGGFFGGFk.", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFGGGGGGGGGGGGGGGGGGGGGGGGGGFk.", ".kFFFFFFFFFFFFFFFFFFFFFFFFFFFFk.", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..", "................................"],
    km_shelf: ["................", ".FFFFFFFFFFFFFF.", ".FNNNNNNNNNNNNF.", ".FNCCCNGGGNhhhF.", ".FNCCCNGGGNhhhF.", ".FNCCCNGGGNhhhF.", ".FNCCCNGGGNhhhF.", ".FFFFFFFFFFFFFF.", ".FNGGGNCCCNBBBF.", ".FNGGGNCCCNBBBF.", ".FNGGGNCCCNBBBF.", ".FNGGGNCCCNBBBF.", ".FNNNNNNNNNNNNF.", ".FNNNNNNNNNNNNF.", ".FFFFFFFFFFFFFF.", ".kkkkkkkkkkkkkk."],
    km_ware_shelf: ["................", ".FFFFFFFFFFFFFF.", ".FNNNNNNNNNNNNF.", ".FNBBBNAAANBBBF.", ".FNBBBNAAANBBBF.", ".FNBBBNAAANBBBF.", ".FNBBBNAAANBBBF.", ".FFFFFFFFFFFFFF.", ".FNCCCNBBBNAAAF.", ".FNCCCNBBBNAAAF.", ".FNCCCNBBBNAAAF.", ".FNCCCNBBBNAAAF.", ".FNNNNNNNNNNNNF.", ".FNNNNNNNNNNNNF.", ".FFFFFFFFFFFFFF.", ".kkkkkkkkkkkkkk."],
    km_minute_book: ["................", ".FFFFFFFFFFFFFF.", ".FNNNNNNNNNNNNF.", ".FNCCCNGGGNCCCF.", ".FNCCCNGGGNCCCF.", ".FNCCCNGGGNCCCF.", ".FNCCCNGGGNCCCF.", ".FFFFFFFFFFFFFF.", ".FNrrrNrrrNGGGF.", ".FNrrrNrrrNGGGF.", ".FNrrrNrrrNGGGF.", ".FNrrrNrrrNGGGF.", ".FNNNNNNNNNNNNF.", ".FNNNNNNNNNNNNF.", ".FFFFFFFFFFFFFF.", ".kkkkkkkkkkkkkk."],
    km_seconds_bin: ["................", "................", "......kk........", "...kkkAAkkk.....", "..kBBkAAkBBkk...", "..kBBCCkkBBCCk..", ".kFFFCCFFFFCCFk.", ".kFGGGGGGGGGGFk.", ".kFGGGGGGGGGGFk.", ".kFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFk.", ".kFFFFFFFFFFFFk.", "..kkkkkkkkkkkk.."],
    km_bench: ["................", "................", "................", "................", "................", ".kkkkkkkkkkkkkk.", "kGGGGGGGGGGGGGGk", "kFFFFFFFFFFFFFFk", "kFFFFFFFFFFFFFFk", ".kFFkkkkkkkkFFk.", ".kFFk......kFFk.", ".kFFk......kFFk.", ".kFFk......kFFk.", ".kFFk......kFFk.", "..kk........kk..", "................"],
    km_table: ["................", "................", "................", "................", "..kkkkkkkkkkkk..", ".kGGGGGGGGGGGGk.", ".kBBBBBBBBBBBBk.", ".kBBFFFFFFFFBBk.", ".kBBBBBBBBBBBBk.", ".kBBBBBBBBBBBBk.", ".kBBBBBBBBBBBBk.", ".kBBBBBBBBBBBBk.", ".kBBBBBBBBBBBBk.", "kFFFFFFFFFFFFFFk", "kFFFFFFFFFFFFFFk", ".kkkkkkkkkkkkkk."],
    km_mural: ["FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCyyyyyyyyyyyyCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCyyyyyyyyyyyyCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCyyyyyyyyyyyyooooooooooooooooCCCCCCGCCCCCCCGCCCCCCCGCCCCCooooooooooooooooyyyyyyyyyyyyCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCooooooooooooooooooCCCCCCGCCCCCCCGCCCCCCCGCCCCCooooooooooooooooooGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCoooooooooooooooooorrrrrrrrrrrrrrrrrrrrrrrrrrrrooooooooooooooooooGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCoooooooooooooooooorrrrrrrrrrrrrrrrrrrrrrrrrrrrooooooooooooooooooGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrryyyyyykyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrryyyyyyyyGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrryyyyyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCyyyyyyyyyyrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "GCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCyyyyyyyyyyrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCC", "GCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCooooGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCC", "GCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCooooGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCyyyyGCCCCCCC", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCooooGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "GCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCCGCCCCCCC", "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"],
    km_bunting: ["................", "NNNNNNNNNNNNNNNN", "VVV.VVV.VVV.VVV.", "VVV.VVV.VVV.VVV.", "VVV.VVV.VVV.VVV.", ".V...V...V...V..", "................", "................", "................", "................", "................", "................", "................", "................", "................", "................"],
    km_pipe: ["................", "................", "................", "................", "................", "................", "................", "........h.......", ".......mmm......", "wwwwwwwmmmwwwwww", "hhhhhhhmmmhhhhhh", "hhhhhhhmmmhhhhhh", "mmmmmmmmmmmmmmmm", ".......mmm......", "................", "................"],
    km_coal: ["................", "................", "......kkkk......", ".....kNNNNk.....", "....kFFFFFFk....", "....kFFFFFFk....", "....kFFFFFFFk...", "...kFFFFFFFFFk..", "..kFFFFFFFFFFFk.", "..kFFGGGGGGNFFk.", ".kFFFFFFFFFFFFFk", "..kFFNFNFdFFFFk.", "..kFFFFdFFFFFFk.", "...kFFFFFFFFFk..", "....kFFFFFFFk...", ".....kkkFkkk...."],
    km_window_glow: ["................", "................", "................", "................", "...yyyyFFyyyy...", "...yoooFFoooy...", "...yoooFFoooy...", "...FFFFFFFFFF...", "...yoooFFoooy...", "...yoooFFoooy...", "...yoooFFoooy...", "...yyyyFFyyyy...", "................", "................", "................", "................"],
    km_smoke_0: ["................", "...........www..", "..........wwwww.", ".........wwwwwww", "..........wwwww.", ".........hhwww..", "........hhhhh...", ".......hhhhhhh..", "........hhhhh...", ".......mmhhh....", "......mmmmm.....", ".....mmmmmmm....", "......mmmmm.....", ".......mmm......", "................", "................"],
    km_smoke_1: ["................", "................", ".............w..", "...........wwwww", "...........wwwww", "...........wwwww", "..........hhhw..", ".........hhhhh..", "........hhhhhhh.", ".........hhhhh..", "........mmhhh...", ".......mmmmm....", "......mmmmmmm...", ".......mmmmm....", "........mmm.....", "................"],
    km_pennant: ["................", ".......kk.......", "......kFFkkkkkk.", "......kFFyyyyyyk", "......kFFJJJJJJk", "......kFFJJJJJJk", "......kFFJJJJJJk", "......kFFJJJJJJk", "......kFFJJJJJJk", "......kFFkkkkkk.", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", "......kFFk......", ".....kmmmmk.....", ".....kmmmmk.....", "......kkkk......"],
    km_plate_bright: ["................", "................", "................", "................", ".NNNNNNNNNNNNNN.", ".wwwwwwwwwwwwww.", ".wwVVVVVVVVVVww.", ".wwwwwwwwwwwwww.", ".wwdddddddwwwww.", ".wwwwwwwwwwwwww.", ".wwwwwwwwwwwwww.", ".NNNNNNNNNNNNNN.", "................", "................", "................", "................"],
  },
};
