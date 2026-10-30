/* Walklings - NEWS, the Block News paper on the Keeper1 (and the cracked handset).
   No DOM and no save of its own. game.js calls PPNews.edition(state) and paints the result.

   state = { flags, side, map, uid, day, signal } (the same facts Ribbit reads).
   Stories live in data/news.json (bundled into MAPDATA by tools/gen_mapdata.py), written with the
   walklings-lore-feed skill. Each story cites the lore index in the design repo and is gated with Ribbit's
   when terms ('story.flag', '!story.flag', 'story.side=glimmer').

   One edition per real day: the same state always returns the same edition. A new day reshuffles the
   features and briefs; a new story flag can bring a new lead. The lead is the eligible story with the
   highest `lead` number, so the newest story beat makes the front page. Features lean to the place you
   are standing in. Signal bars thin the briefs (D866's rule for Ribbit). */
(function (root) {
  'use strict';

  const HEADLINE_MAX = 48;
  const BODY_MAX = 110;
  const FEATURES_N = 5;
  const BRIEFS_N = 4;
  const SECTIONS = [
    { id: 'towns', label: 'TOWNS' },
    { id: 'roads', label: 'ROADS' },
    { id: 'halls', label: 'TRIAL HALLS' },
    { id: 'keepers', label: 'KEEPERS' },
    { id: 'glimmerwell', label: 'GLIMMERWELL' },
  ];
  const DESKS = {
    block: 'Block News',
    lantern: 'The Lantern Post',
    bright: 'Bright Notice',
  };
  const SECRET = /\b(chips?|chipped|chipping|tuning|implants?)\b/i;

  function rib() { return root.PPRibbit || (typeof require === 'function' ? require('./ribbit.js') : null); }
  function stories() {
    const d = typeof MAPDATA !== 'undefined' && MAPDATA && MAPDATA.news ? MAPDATA.news : root.PP_NEWS_DATA;
    return (d && Array.isArray(d.stories)) ? d.stories : [];
  }

  function publish(s) {
    return {
      id: s.id,
      section: s.section,
      desk: DESKS[s.desk] || DESKS.block,
      headline: s.headline,
      body: (s.body || []).slice(),
      region: s.region || '',
    };
  }

  function edition(state) {
    const R = rib();
    const st = state || {};
    const flags = st.flags || {};
    const side = R.normSide(st);
    const region = R.regionOf(String(st.map || ''));
    const day = String(st.day || '');
    const storySeed = [String(st.uid || ''), day, side, R.storyKey(flags)].join('\n');
    const rng = R.mulberry32(R.fnv1a('news\n' + storySeed));
    const pool = stories().filter(s => R.passes(s.when, flags, side));
    let lead = null;
    pool.forEach(s => { if (typeof s.lead === 'number' && (!lead || s.lead > lead.lead)) lead = s; });
    if (!lead && pool.length) lead = R.pickWeighted(pool, 1, rng, () => 1)[0];
    const rest = pool.filter(s => s !== lead);
    const features = R.pickWeighted(rest, FEATURES_N, rng, s => (region && s.region === region) ? 3 : 1);
    const left = rest.filter(s => features.indexOf(s) === -1);
    const bars = Number.isInteger(st.signal) ? Math.max(1, Math.min(4, st.signal)) : 4;
    const briefs = R.pickWeighted(left, BRIEFS_N, rng, () => 1).slice(0, Math.min(BRIEFS_N, bars));
    // Features print in section order, so the paper reads like a paper.
    const order = id => SECTIONS.findIndex(x => x.id === id);
    features.sort((a, b) => order(a.section) - order(b.section));
    return {
      // The unread key: a new day or a new lead. Walking to another map or losing signal is not a new edition.
      key: day + ':' + (lead ? lead.id : ''),
      day: day,
      lead: lead ? publish(lead) : null,
      features: features.map(publish),
      briefs: briefs.map(publish),
      thin: bars <= 1,
    };
  }

  function sectionLabel(id) {
    const s = SECTIONS.find(x => x.id === id);
    return s ? s.label : '';
  }

  function devCheck() {
    const R = rib();
    const bad = [];
    const all = stories();
    const ids = new Set();
    if (!all.length) bad.push('no news stories loaded');
    all.forEach(s => {
      if (ids.has(s.id)) bad.push('duplicate id: ' + s.id);
      ids.add(s.id);
      if (!sectionLabel(s.section)) bad.push('unknown section: ' + s.id);
      if (!DESKS[s.desk]) bad.push('unknown desk: ' + s.id);
      if (!s.lore || !s.lore.length) bad.push('story cites no lore: ' + s.id);
      const lines = [s.headline || ''].concat(s.body || []);
      if (!s.headline) bad.push('no headline: ' + s.id);
      if (Array.from(s.headline || '').length > HEADLINE_MAX) bad.push('headline over ' + HEADLINE_MAX + ': ' + s.id);
      if (!s.body || s.body.length < 1 || s.body.length > 3) bad.push('body needs 1-3 lines: ' + s.id);
      (s.body || []).forEach(l => { if (Array.from(l).length > BODY_MAX) bad.push('body line over ' + BODY_MAX + ': ' + s.id); });
      lines.forEach(l => {
        if (/\{|\}|  /.test(l)) bad.push('token or double space: ' + s.id);
        if (/[‘’“”]/.test(l)) bad.push('curly quote: ' + s.id);
        if (SECRET.test(l) && !(s.when || []).includes('story.side=glimmer')) bad.push('secret word off the Glimmer side: ' + s.id);
      });
      if (s.region === 'heights' && !(s.when || []).includes('story.heights_done')) bad.push('heights story missing the flag: ' + s.id);
      if (/sold/i.test(lines.join(' ')) && !(s.when || []).includes('story.quarry_bought')) bad.push('sold story missing the flag: ' + s.id);
    });
    const early = { flags: { 'story.phone_got': true }, side: 'keepers', map: 'hearthmoor', uid: 'demo', day: '2026-04-01' };
    const a = edition(early), b = edition(JSON.parse(JSON.stringify(early)));
    if (a.key !== b.key) bad.push('edition was not stable');
    if (!a.lead) bad.push('an early edition has no lead');
    const text = e => [e.lead].concat(e.features, e.briefs).filter(Boolean).map(s => s.headline + ' ' + s.body.join(' ')).join('\n');
    if (/RegenX|went dark|was sold|Brinewick|High Charity|Mahopac|Route 3/i.test(text(a))) bad.push('early edition leaked a later story');
    const featureIds = e => e.features.map(s => s.id).join();
    if (['2026-04-02', '2026-04-03', '2026-04-04'].every(d => featureIds(edition(Object.assign({}, early, { day: d }))) === featureIds(a))) bad.push('features did not change across four days');
    return bad;
  }

  const api = { edition: edition, devCheck: devCheck, sectionLabel: sectionLabel, SECTIONS: SECTIONS, HEADLINE_MAX: HEADLINE_MAX, BODY_MAX: BODY_MAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PPNews = api;
})(typeof window !== 'undefined' ? window : globalThis);
