/* Walklings - Ribbit, a read-only feed on the Keeper1 (and the cracked handset).
   No DOM and no save of its own. game.js calls PPRibbit.feed(state) and paints the result.

   state = { flags, side, map, uid, day }
   side is 'keepers' or 'glimmer' (keepers when unset). day is YYYY-MM-DD. map is the current map id or ''.
   The same state always returns the same post ids. uid, day, side, and story.* flags seed the desks
   and the trending row. The map is added only for local lines, so the place you are standing in shows
   up more often. A new day or a new story flag reshuffles locals and the trending tags.
   Block News and Chirp Worldwide still post about the whole map.

   when: 'story.flag' (absent is false), '!story.flag', or 'story.side=glimmer'. story.side reads the
   resolved side, so an unset pledge is keepers. */
(function (root) {
  'use strict';

  const LINE_MAX = 100;
  const LOCAL_N = 4;
  const DESK_EXTRA = 3;   // unpinned Block News / Chirp Worldwide posts per day (was 1 before the NEWS app pool)
  const BLOCK = { name: 'Block News', handle: 'blocknews', desk: 'Block News' };
  const CHIRP = { name: 'Chirp Worldwide', handle: 'chirpworld', desk: 'Chirp Worldwide' };
  // D861 Night Desk (placeholder copy, D863): one late post while state.night is true (the clock's late hours).
  const NIGHT = { name: 'Night Desk', handle: 'nightdesk', desk: 'Night Desk' };
  const NIGHT_POSTS = [
    { id: 'nd-glow', text: 'Lamps low. Let your Walkling sleep tonight.' },
    { id: 'nd-roads', text: 'Night shift: quiet roads, sleepy grass. Walk soft.' },
    { id: 'nd-share', text: 'Late chirp: rest now, walk tomorrow.' },
  ];

  const POSTS = [
    { id: 'bn-morning', kind: 'block', pin: true, text: 'Hearthmoor morning: the lantern is lit. Keeper House is open. Officer Bren has the road.' },
    { id: 'bn-seam', kind: 'block', pin: true, when: ['story.quarry_bought'], text: "Cobblecrest: Hale's quarry seam was sold. The old gate plate is down." },
    { id: 'bn-lamps', kind: 'block', pin: true, when: ['story.glen_cleared'], text: 'Wickerglen: the Comfort Lamps went dark after the glen was cleared.' },
    { id: 'bn-heights', kind: 'block', pin: true, when: ['story.heights_done'], text: 'Heights brief: RegenX is quiet. The tunnels are empty. Walklings hopped home.' },
    { id: 'bn-census', kind: 'block', when: ['!story.glen_cleared'], text: 'Route 2 bulletin: the Glow Census is counting. Comfort Lamps are still lit.' },
    { id: 'bn-mint', kind: 'block', when: ['story.side=glimmer'], text: "Fernbrook note: the mint stand is open. Smiles are free. Chairs are Fen's." },

    { id: 'ch-bowl', kind: 'chirp', pin: true, text: 'A holder and a Walkling shared a Warm Bowl on the hill. Nobody filed a form.' },
    { id: 'ch-fen', kind: 'chirp', text: 'Fen was talking to a blossom in the orchard. The blossom kept the secret.' },
    { id: 'ch-bren', kind: 'chirp', text: 'Officer Bren walked the Hearthmoor road again. The lantern waved, probably.' },
    { id: 'ch-seam', kind: 'chirp', when: ['story.quarry_bought'], text: 'The quarry seam has a new owner. Hale still packs a lunch. Kids are asking.' },
    { id: 'ch-lamps', kind: 'chirp', when: ['story.glen_cleared'], text: 'Those glen lamps went dark and the path misses them. Bring a snack anyway.' },
    { id: 'ch-rook', kind: 'chirp', when: ['story.rook_end'], text: "Rook's cart left Cobblecrest. Someone waved from the road. The board is up." },
    { id: 'ch-ridge', kind: 'chirp', when: ['story.heights_done'], text: 'RegenX closed the bright rooms. A Walkling hopped the ridge and looked pleased.' },

    { id: 'hm-tea', kind: 'local', region: 'hearthmoor', name: 'Hill Keeper', handle: 'lanternhill', desk: 'Hill Keeper', text: 'Lantern Hill is bright. Keeper House smells like tea and paper.' },
    { id: 'hm-bren', kind: 'local', region: 'hearthmoor', name: 'Road walker', handle: 'roadmoss', desk: 'Road walker', text: 'Officer Bren took the long road. The lantern stayed lit behind him.' },
    { id: 'hm-step', kind: 'local', region: 'hearthmoor', name: 'Porch sitter', handle: 'porchsit', desk: 'Porch sitter', text: 'A Walkling sat on the lodge step. A holder shared the sunny half.' },
    { id: 'hm-door', kind: 'local', region: 'hearthmoor', name: 'Lantern Keeper', handle: 'paperlantern', desk: 'Lantern Keeper', text: 'Keeper House asked citizens to step back. They asked nicely.' },

    { id: 'r1-grass', kind: 'local', region: 'route1', name: 'Route walker', handle: 'grassline', desk: 'Route walker', text: 'Wild grass on Route 1 is full of small noses. I stepped around them.' },
    { id: 'r1-free', kind: 'local', region: 'route1', name: 'Route walker', handle: 'freepoles', desk: 'Route walker', when: ['story.phone_got'], text: 'The Keeper1 was free. The poles stay with the Keepers.' },
    { id: 'r1-nap', kind: 'local', region: 'route1', name: 'Route walker', handle: 'longway', desk: 'Route walker', text: 'A Walkling napped in the Route 1 grass. I took the long way around.' },
    { id: 'r1-coats', kind: 'local', region: 'route1', name: 'Route walker', handle: 'greencoat', desk: 'Route walker', text: 'Two green coats stood in the grass and wished me a lawful day.' },

    { id: 'fb-fen', kind: 'local', region: 'fernbrook', name: 'Orchard hand', handle: 'fenchair', desk: 'Orchard hand', text: 'Fen says roots, then blossoms. The orchard is pretending to study.' },
    { id: 'fb-mint', kind: 'local', region: 'fernbrook', name: 'Orchard hand', handle: 'mintcup', desk: 'Orchard hand', text: 'The mint stand smiled at me. The nearest blossom did not.' },
    { id: 'fb-basket', kind: 'local', region: 'fernbrook', name: 'Orchard hand', handle: 'baskettry', desk: 'Orchard hand', text: 'Empty baskets by the hall. A Walkling tried one on for size.' },
    { id: 'fb-chair', kind: 'local', region: 'fernbrook', name: 'Orchard hand', handle: 'orchardnap', desk: 'Orchard hand', text: 'Fen left a chair under the trees. Nobody has to hurry today.' },
    { id: 'fb-partner', kind: 'local', region: 'fernbrook', name: 'Orchard hand', handle: 'mintcup', desk: 'Orchard hand', when: ['story.side=glimmer'], text: 'The mint stand called me partner. Fen still saved me a chair.' },

    { id: 'r2-census', kind: 'local', region: 'route2', name: 'Census walker', handle: 'censuswalk', desk: 'Census walker', text: 'Glow Census is on Route 2 with clipboards. The count is polite.' },
    { id: 'r2-lamps', kind: 'local', region: 'route2', name: 'Census walker', handle: 'lampcount', desk: 'Census walker', when: ['!story.glen_cleared'], text: 'Comfort Lamps along Route 2 are counted and still glowing.' },
    { id: 'r2-creek', kind: 'local', region: 'route2', name: 'Route walker', handle: 'creekstep', desk: 'Route walker', text: 'The creek talked over the census. A Walkling supervised the count.' },
    { id: 'r2-glen', kind: 'local', region: 'route2', name: 'Census walker', handle: 'glenpage', desk: 'Census walker', when: ['!story.glen_cleared'], text: 'The glen path still has its lamps. Census called the glow steady.' },
    { id: 'r2-stones', kind: 'local', region: 'route2', name: 'Route walker', handle: 'flatstone', desk: 'Route walker', text: 'Route 2 stones are flat enough for a slow walk with a Walkling.' },

    { id: 'wg-warm', kind: 'local', region: 'wickerglen', name: 'Glen walker', handle: 'lamplight', desk: 'Glen walker', when: ['!story.glen_cleared'], text: 'Wickerglen Comfort Lamps make the roots look friendly.' },
    { id: 'wg-nap', kind: 'local', region: 'wickerglen', name: 'Glen walker', handle: 'rootnap', desk: 'Glen walker', when: ['!story.glen_cleared'], text: 'I napped under a Comfort Lamp. The census tiptoed past me.' },
    { id: 'wg-hard', kind: 'local', region: 'wickerglen', name: 'Glen walker', handle: 'glownote', desk: 'Glen walker', when: ['!story.glen_cleared'], text: 'Glow Census likes this glen. The lamps are doing the hard work.' },
    { id: 'wg-dark', kind: 'local', region: 'wickerglen', name: 'Glen walker', handle: 'darkpath', desk: 'Glen walker', when: ['story.glen_cleared'], text: 'The Comfort Lamps went dark. Wickerglen is roots and quiet now.' },
    { id: 'wg-page', kind: 'local', region: 'wickerglen', name: 'Glen walker', handle: 'darkpath', desk: 'Glen walker', when: ['story.glen_cleared'], text: 'Census closed the glen page. Bring a light if you walk it.' },
    { id: 'wg-soft', kind: 'local', region: 'wickerglen', name: 'Glen walker', handle: 'softglen', desk: 'Glen walker', when: ['story.glen_cleared'], text: 'The glen is dark and soft. A Walkling brought its own little glow.' },

    { id: 'cc-race', kind: 'local', region: 'cobblecrest', name: 'Quarry kid', handle: 'quarrykid', desk: 'Quarry kid', text: 'Cobblecrest kids race the long road, not the seam.' },
    { id: 'cc-cart', kind: 'local', region: 'cobblecrest', name: 'Quarry kid', handle: 'cartwave', desk: 'Quarry kid', text: 'The quarry cart rattles past. Hale nods if you wave first.' },
    { id: 'cc-nap', kind: 'local', region: 'cobblecrest', name: 'Quarry kid', handle: 'pebblenap', desk: 'Quarry kid', text: 'Noon stone is warm. Pebblits nap where the signs allow it.' },
    { id: 'cc-hale', kind: 'local', region: 'cobblecrest', name: 'Quarry kid', handle: 'stonestep', desk: 'Quarry kid', when: ['!story.quarry_bought'], text: 'Hale still walks the quarry path. The seam looks like yesterday.' },
    { id: 'cc-sold', kind: 'local', region: 'cobblecrest', name: 'Quarry kid', handle: 'quarrykid', desk: 'Quarry kid', when: ['story.quarry_bought'], text: "They sold the seam. Hale's name came off the gate. Lunch is still here." },

    { id: 'ht-quiet', kind: 'local', region: 'heights', name: 'Ridge hand', handle: 'ridgehand', desk: 'Ridge hand', when: ['story.heights_done'], text: 'RegenX left the ridge quiet. The wind took the last bright sign.' },
    { id: 'ht-tunnel', kind: 'local', region: 'heights', name: 'Ridge hand', handle: 'tunnelnote', desk: 'Ridge hand', when: ['story.heights_done'], text: 'The old tunnels are empty. Walklings hopped toward the orchard.' },
    { id: 'ht-ken', kind: 'local', region: 'heights', name: 'Ridge hand', handle: 'kenwalk', desk: 'Ridge hand', when: ['story.heights_done'], text: 'Officer Ken walked with the Walklings. They hopped the whole way.' },
    { id: 'ht-kettle', kind: 'local', region: 'heights', name: 'Ridge hand', handle: 'kettleclean', desk: 'Ridge hand', when: ['story.heights_done'], text: 'The lab kettles are clean. The quiet machine still has no name.' },
    { id: 'ht-screen', kind: 'local', region: 'heights', name: 'Ridge hand', handle: 'floatglass', desk: 'Ridge hand', when: ['story.heights_done'], text: 'A little screen still floats in the RegenX bay. Staff call it a glitch.' },
  ];

  const BASE_N = POSTS.length;

  const TAGS = [
    { tag: '#LanternHill', w: 4 },
    { tag: '#Route1', w: 4 },
    { tag: '#Orchard', w: 4 },
    { tag: '#Hearthmoor', w: 2 },
    { tag: '#KeeperHouse', w: 2 },
    { tag: '#WildGrass', w: 2 },
    { tag: '#Walkling', w: 2 },
    { tag: '#Amberwild', w: 1 },
    { tag: '#GlowCensus', w: 1 },
    { tag: '#ComfortLamps', w: 1, when: ['!story.glen_cleared'] },
    { tag: '#LampsDark', w: 3, when: ['story.glen_cleared'] },
    { tag: '#SeamSold', w: 3, when: ['story.quarry_bought'] },
    { tag: '#RegenX', w: 3, when: ['story.heights_done'] },
    { tag: '#FloatScreen', w: 2, when: ['story.rx_bitlet'] },
    { tag: '#MintStand', w: 3, when: ['story.side=glimmer'] },
  ];

  const BASE_TAGS = TAGS.map(t => t.tag);
  // More posts live in data/ribbit_posts.json (bundled into MAPDATA by tools/gen_mapdata.py), written with the
  // walklings-lore-feed skill. Each cites the lore index; ids never clash with the posts above.
  const DATA = typeof MAPDATA !== 'undefined' && MAPDATA && MAPDATA.ribbit_posts ? MAPDATA.ribbit_posts : null;
  if (DATA) {
    (DATA.posts || []).forEach(p => { if (p && p.id && p.text) POSTS.push(p); });
    (DATA.tags || []).forEach(t => { if (t && t.tag) TAGS.push(t); });
  }

  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function span(seed, key, lo, hi) {
    return lo + (fnv1a(seed + '\n' + key) % (hi - lo + 1));
  }
  function storyKey(flags) {
    const f = flags || {};
    return Object.keys(f).filter(k => k.indexOf('story.') === 0).sort().map(k => k + '=' + String(f[k])).join('\n');
  }
  function normSide(st) {
    const s = st && st.side;
    if (s === 'glimmer' || s === 'keepers') return s;
    const f = st && st.flags && st.flags['story.side'];
    return f === 'glimmer' ? 'glimmer' : 'keepers';
  }
  function valueOf(key, flags, side) {
    if (key === 'story.side') return side;
    if (!flags || !Object.prototype.hasOwnProperty.call(flags, key)) return undefined;
    return flags[key];
  }
  function truthy(v) { return v !== undefined && v !== null && v !== false && v !== '' && v !== 0; }
  function cond(raw, flags, side) {
    let c = String(raw), neg = false;
    if (c.charAt(0) === '!') { neg = true; c = c.slice(1); }
    const eq = c.indexOf('=');
    let ok;
    if (eq !== -1) ok = String(valueOf(c.slice(0, eq), flags, side)) === c.slice(eq + 1);
    else ok = truthy(valueOf(c, flags, side));
    return neg ? !ok : ok;
  }
  function passes(when, flags, side) {
    if (!when || !when.length) return true;
    for (let i = 0; i < when.length; i++) if (!cond(when[i], flags, side)) return false;
    return true;
  }
  function regionOf(map) {
    const id = String(map || '');
    if (!id) return '';
    if (id === 'fb_heights' || id.indexOf('rx_') === 0 || id.indexOf('sm_') === 0) return 'heights';
    if (id === 'hearthmoor' || id.indexOf('hm_') === 0) return 'hearthmoor';
    if (id === 'route1' || id === 'proto') return 'route1';
    if (id === 'fernbrook' || id.indexOf('fb_') === 0) return 'fernbrook';
    if (id === 'route2') return 'route2';
    if (id === 'route2_glen') return 'wickerglen';
    if (id === 'cobblecrest' || id === 'cobble_quarry' || id.indexOf('cc_') === 0) return 'cobblecrest';
    if (id === 'mahopac' || id.indexOf('mahopac_') === 0) return 'mahopac';
    if (id === 'highcharity' || id.indexOf('hc_') === 0) return 'highcharity';
    if (id === 'route3' || id.indexOf('r3_') === 0) return 'route3';
    if (id === 'brinewick' || id.indexOf('bw_') === 0) return 'brinewick';
    return '';
  }
  function pickWeighted(items, n, rng, weightOf) {
    const pool = items.slice();
    const out = [];
    while (pool.length && out.length < n) {
      const weights = [];
      let total = 0;
      for (let i = 0; i < pool.length; i++) {
        const w = weightOf(pool[i]);
        const ww = w > 0 ? w : 1;
        weights.push(ww);
        total += ww;
      }
      let r = rng() * total, i = 0;
      for (; i < pool.length - 1; i++) {
        r -= weights[i];
        if (r < 0) break;
      }
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }
  // Most local lines are from the map you are standing in. The spare slot is the rest of the wild,
  // except Route 2 and Wickerglen, which lend that slot to each other.
  function pickLocals(eligible, region, n, rng) {
    const here = region ? eligible.filter(p => p.region === region) : [];
    const cousin = region === 'route2' ? 'wickerglen' : region === 'wickerglen' ? 'route2' : '';
    const near = cousin ? eligible.filter(p => p.region === cousin) : [];
    const used = new Set();
    const take = (pool, k) => {
      const fresh = pool.filter(p => !used.has(p.id));
      const got = pickWeighted(fresh, k, rng, () => 1);
      got.forEach(p => used.add(p.id));
      return got;
    };
    const out = [];
    if (here.length) out.push.apply(out, take(here, Math.min(here.length, n, 3)));
    if (out.length < n && near.length) out.push.apply(out, take(near, Math.min(near.length, n - out.length)));
    if (out.length < n) out.push.apply(out, take(eligible, n - out.length));
    return out;
  }
  function publish(p, seed) {
    const desk = p.kind === 'block' ? BLOCK : p.kind === 'chirp' ? CHIRP : null;
    return {
      id: p.id,
      name: desk ? desk.name : p.name,
      handle: desk ? desk.handle : p.handle,
      desk: desk ? desk.desk : (p.desk || p.name),
      text: p.text,
      chirps: span(seed, 'chirps:' + p.id, 2, 24),
    };
  }

  function feed(state) {
    const st = state || {};
    const flags = st.flags || {};
    const side = normSide(st);
    const map = String(st.map || '');
    const region = regionOf(map);
    const storySeed = [String(st.uid || ''), String(st.day || ''), side, storyKey(flags)].join('\n');
    const rngDesk = mulberry32(fnv1a('desk\n' + storySeed));
    const rngLocal = mulberry32(fnv1a('local\n' + storySeed + '\n' + map));
    const rngTag = mulberry32(fnv1a('tag\n' + storySeed));
    const ok = p => passes(p.when, flags, side);
    const pins = POSTS.filter(p => p.pin && ok(p));
    const extraPool = POSTS.filter(p => !p.pin && (p.kind === 'block' || p.kind === 'chirp') && ok(p));
    const extra = pickWeighted(extraPool, DESK_EXTRA, rngDesk, () => 1);
    // D866: state.signal (1-4 bars) thins the local lines; unset keeps all LOCAL_N. The picks stay a stable prefix.
    const bars = Number.isInteger(st.signal) ? Math.max(1, Math.min(4, st.signal)) : 4;
    const locals = pickLocals(POSTS.filter(p => p.kind === 'local' && ok(p)), region, LOCAL_N, rngLocal).slice(0, Math.min(LOCAL_N, bars));
    const tags = pickWeighted(TAGS.filter(t => passes(t.when, flags, side)), 3, rngTag, t => t.w || 1);
    const posts = pins.concat(extra).map(p => publish(p, storySeed)).concat(locals.map(p => publish(p, storySeed + '\n' + map)));
    if (st.night) {
      const n = NIGHT_POSTS[fnv1a('night\n' + storySeed) % NIGHT_POSTS.length];
      posts.splice(pins.length, 0, Object.assign(publish(n, storySeed), { name: NIGHT.name, handle: NIGHT.handle, desk: NIGHT.desk }));
    }
    return {
      trending: tags.map(t => ({ tag: t.tag, count: span(storySeed, 'tag:' + t.tag, 8, 42) })),
      posts: posts,
    };
  }

  function devCheck() {
    const bad = [];
    const ids = new Set();
    const regions = {};
    POSTS.forEach(p => {
      if (ids.has(p.id)) bad.push('duplicate id: ' + p.id);
      ids.add(p.id);
      const n = Array.from(p.text).length;
      if (n > LINE_MAX) bad.push('text over ' + LINE_MAX + ': ' + p.id + ' (' + n + ')');
      if (/\{|\}|  /.test(p.text)) bad.push('token or double space: ' + p.id);
      if (/[\u2018\u2019\u201C\u201D]/.test(p.text)) bad.push('curly quote: ' + p.id);
      if (p.region) regions[p.region] = (regions[p.region] || 0) + 1;
      if (p.region === 'heights' && !(p.when || []).includes('story.heights_done')) bad.push('heights line missing the flag: ' + p.id);
      if (/sold/i.test(p.text) && !(p.when || []).includes('story.quarry_bought')) bad.push('sold line missing the flag: ' + p.id);
    });
    NIGHT_POSTS.forEach(p => { if (Array.from(p.text).length > LINE_MAX) bad.push('night text over ' + LINE_MAX + ': ' + p.id); });
    if (feed({ flags: {}, uid: 'n', day: '2026-04-01', night: true }).posts.filter(p => p.handle === NIGHT.handle).length !== 1) bad.push('night desk should post once at night');
    if (feed({ flags: {}, uid: 'n', day: '2026-04-01' }).posts.some(p => p.handle === NIGHT.handle)) bad.push('night desk posted by day');
    const want = ['hearthmoor', 'route1', 'fernbrook', 'route2', 'wickerglen', 'cobblecrest', 'heights'];
    if (POSTS.length > BASE_N) want.push('mahopac', 'highcharity', 'route3', 'brinewick');
    want.forEach(r => {
      if ((regions[r] || 0) < 3) bad.push('region needs several lines: ' + r);
    });
    POSTS.slice(BASE_N).forEach(p => {
      if (!p.lore || !p.lore.length) bad.push('data post cites no lore: ' + p.id);
      if (p.kind === 'local' && !(p.region && p.handle && p.name)) bad.push('local post needs region, name and handle: ' + p.id);
      if (p.kind !== 'local' && p.kind !== 'block' && p.kind !== 'chirp') bad.push('data post kind: ' + p.id);
    });
    if (!POSTS.some(p => p.kind === 'block' && p.pin && !p.when)) bad.push('missing an open Block News pin');
    if (!POSTS.some(p => p.kind === 'chirp' && p.pin && !p.when)) bad.push('missing an open Chirp pin');
    const demo = feed({ flags: { 'story.phone_got': true }, side: 'keepers', map: 'hearthmoor', uid: 'demo', day: '2026-04-01' });
    if (!demo.posts.some(p => p.handle === 'blocknews' && /Hearthmoor/.test(p.text))) bad.push('demo missing Hearthmoor news');
    if (!demo.posts.some(p => p.handle === 'chirpworld' && /holder/i.test(p.text) && /Walkling/.test(p.text))) bad.push('demo missing the holder and Walkling chirp');
    if (demo.trending.length !== 3) bad.push('demo trending should be 3');
    const home = ['#LanternHill', '#Route1', '#Orchard', '#Hearthmoor', '#KeeperHouse', '#WildGrass', '#Walkling', '#Amberwild', '#GlowCensus', '#ComfortLamps'];
    // Data tags are gated by the lore check (design lore/lore_check.py); this guards the built-in set.
    demo.trending.forEach(t => { if (BASE_TAGS.indexOf(t.tag) !== -1 && home.indexOf(t.tag) === -1) bad.push('demo tag out of the early set: ' + t.tag); });
    if (demo.posts.some(p => /RegenX|went dark|was sold/i.test(p.text))) bad.push('demo feed leaked a later headline');
    const bought = feed({ flags: { 'story.phone_got': true, 'story.quarry_bought': true }, side: 'keepers', map: 'hearthmoor', uid: 'q', day: '1999-01-01' });
    const plain = feed({ flags: { 'story.phone_got': true }, side: 'keepers', map: 'hearthmoor', uid: 'q', day: '1999-01-01' });
    const sold = bought.posts.filter(p => /quarry|seam/i.test(p.text) && /sold/i.test(p.text));
    if (!sold.length) bad.push('quarry sale did not post');
    if (plain.posts.some(p => sold.some(s => s.text === p.text))) bad.push('quarry-sold line showed without the flag');
    const again = feed({ flags: { 'story.phone_got': true }, side: 'keepers', map: 'hearthmoor', uid: 'demo', day: '2026-04-01' });
    if (again.posts.map(p => p.id).join() !== demo.posts.map(p => p.id).join()) bad.push('feed was not stable');
    return bad;
  }

  const api = { feed: feed, devCheck: devCheck, LINE_MAX: LINE_MAX, passes: passes, regionOf: regionOf, storyKey: storyKey, normSide: normSide, fnv1a: fnv1a, mulberry32: mulberry32, pickWeighted: pickWeighted };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PPRibbit = api;
})(typeof window !== 'undefined' ? window : globalThis);
