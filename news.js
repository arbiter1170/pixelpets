/* Walklings - NEWS, the Block News paper on the Keeper1 (and the cracked handset).
   No DOM and no save of its own. game.js calls PPNews.edition(state) and paints the result.

   state = { flags, side, map, uid, day, signal, hh, phase, sky, town, me }
     phase: dawn | day | dusk | night (PPClock). sky: clear | cloud | rain | snow | '' (the live sky).
     me: { holder, partner, partnerSpecies, partnerStage, seals, steps, acorns, seen: ['ember/0', ...] }
   Content lives in data/news.json (bundled into MAPDATA by tools/gen_mapdata.py), written with the
   walklings-lore-feed skill; every item cites the lore index in the design repo. Gates on any item:
     when  Ribbit's terms ('story.flag', '!story.flag', 'story.side=glimmer')
     sky   any of clear/cloud/rain/snow      phase  any of dawn/day/dusk/night
     me    partner, seals>=N, steps>=N, acorns>=N
   Text may carry only these tokens: {holder} {partner} {town} {seals} {steps}.

   Three editions a real day (MORNING before noon on the game clock, EVENING after, NIGHT in the late phase); the same
   state always returns the same edition. A new day or a new story flag reshuffles. The lead is the eligible story with
   the highest `lead` number, so the newest story beat makes the front page. Features lean to the place you stand in.
   Signal bars thin the briefs (D866's rule for Ribbit). */
(function (root) {
  'use strict';

  const HEADLINE_MAX = 48;
  const BODY_MAX = 110;
  const FEATURES_N = 5;
  const BRIEFS_N = 4;
  const VOICES_N = 3;
  const NOTICES_N = 3;
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
  const TOKENS = ['{holder}', '{partner}', '{town}', '{seals}', '{steps}'];
  const SKY = ['clear', 'cloud', 'rain', 'snow'];
  const PHASES = ['dawn', 'day', 'dusk', 'night'];
  const SECRET = /\b(chips?|chipped|chipping|tuning|implants?)\b/i;

  function rib() { return root.PPRibbit || (typeof require === 'function' ? require('./ribbit.js') : null); }
  function data() {
    const d = typeof MAPDATA !== 'undefined' && MAPDATA && MAPDATA.news ? MAPDATA.news : root.PP_NEWS_DATA;
    return d || {};
  }
  const list = k => Array.isArray(data()[k]) ? data()[k] : [];
  function ribbitPosts() {
    const d = typeof MAPDATA !== 'undefined' && MAPDATA && MAPDATA.ribbit_posts ? MAPDATA.ribbit_posts : null;
    return d && Array.isArray(d.posts) ? d.posts : [];
  }

  function meOk(terms, me) {
    if (!terms || !terms.length) return true;
    const m = me || {};
    return terms.every(t => {
      if (t === 'partner') return !!m.partner;
      const r = /^(seals|steps|acorns)>=(\d+)$/.exec(String(t));
      return !!r && (Number(m[r[1]]) || 0) >= Number(r[2]);
    });
  }
  function gate(st, side) {
    const R = rib();
    return x => R.passes(x.when, st.flags || {}, side)
      && (!x.sky || x.sky.indexOf(st.sky || '') !== -1)
      && (!x.phase || x.phase.indexOf(st.phase || '') !== -1)
      && meOk(x.me, st.me);
  }
  function fill(text, st) {
    const m = st.me || {};
    const steps = Math.max(0, Math.floor(Number(m.steps) || 0)).toLocaleString('en-US');
    return String(text || '')
      .split('{holder}').join(m.holder || 'A holder')
      .split('{partner}').join(m.partner || 'their Walkling')
      .split('{town}').join(st.town || 'town')
      .split('{seals}').join(String(Math.max(0, Number(m.seals) || 0)))
      .split('{steps}').join(steps);
  }
  function editionName(st) {
    if (st.phase === 'night') return 'NIGHT';
    return (Number(st.hh) || 0) < 12 ? 'MORNING' : 'EVENING';
  }
  function artOf(s) {
    if (!s.art) return null;
    const m = /^([a-z]+)(?:\/([0-2]))?$/.exec(String(s.art));
    return m ? { species: m[1], stage: Number(m[2] || 0) } : null;
  }

  function edition(state) {
    const R = rib();
    const st = state || {};
    const flags = st.flags || {};
    const side = R.normSide(st);
    const region = R.regionOf(String(st.map || ''));
    const day = String(st.day || '');
    const name = editionName(st);
    const storySeed = [String(st.uid || ''), day, side, R.storyKey(flags)].join('\n');
    const seed = storySeed + '\n' + name;
    const rng = R.mulberry32(R.fnv1a('news\n' + seed));
    const ok = gate(st, side);
    const pool = list('stories').filter(ok);
    let lead = null;
    pool.forEach(s => { if (typeof s.lead === 'number' && (!lead || s.lead > lead.lead)) lead = s; });
    if (!lead && pool.length) lead = R.pickWeighted(pool, 1, rng, () => 1)[0];
    const rest = pool.filter(s => s !== lead);
    // Weather and time pieces only exist in their moment, so they lean in when they can run.
    const features = R.pickWeighted(rest, FEATURES_N, rng, s => ((region && s.region === region) ? 3 : 1) * ((s.sky || s.phase) ? 3 : 1));
    const left = rest.filter(s => features.indexOf(s) === -1);
    const bars = Number.isInteger(st.signal) ? Math.max(1, Math.min(4, st.signal)) : 4;
    const briefs = R.pickWeighted(left, BRIEFS_N, rng, () => 1).slice(0, Math.min(BRIEFS_N, bars));
    // Features print in section order, so the paper reads like a paper.
    const order = id => SECTIONS.findIndex(x => x.id === id);
    features.sort((a, b) => order(a.section) - order(b.section));

    // Ribbit replies: the story's own, else one or two locals from its region that the holder could see today.
    const locals = ribbitPosts().filter(p => p.kind === 'local' && R.passes(p.when, flags, side));
    function publish(s, withReplies) {
      let replies = (s.replies || []).map(r => ({ name: r.name, handle: r.handle, text: fill(r.text, st) }));
      if (withReplies && !replies.length) {
        const near = locals.filter(p => p.region && p.region === s.region);
        replies = R.pickWeighted(near, 2, R.mulberry32(R.fnv1a('reply\n' + s.id + '\n' + seed)), () => 1).map(p => ({ name: p.name, handle: p.handle, text: p.text }));
      }
      return {
        id: s.id,
        section: s.section,
        desk: DESKS[s.desk] || DESKS.block,
        headline: fill(s.headline, st),
        body: (s.body || []).map(l => fill(l, st)),
        region: s.region || '',
        art: artOf(s),
        replies: replies,
        chirps: 3 + (R.fnv1a('chirps\n' + s.id + '\n' + storySeed) % 40),
      };
    }

    const voicePool = list('voices').filter(ok);
    const voices = R.pickWeighted(voicePool, VOICES_N, R.mulberry32(R.fnv1a('voices\n' + seed)), v => ((region && v.region === region) ? 3 : 1) * ((v.sky || v.phase) ? 3 : 1));
    const noticePool = list('notices').filter(n => ok(n) && (n.kind !== 'ad' || side === 'glimmer'));
    const ads = noticePool.filter(n => n.kind === 'ad');
    const plain = noticePool.filter(n => n.kind !== 'ad');
    const nrng = R.mulberry32(R.fnv1a('notices\n' + seed));
    const notices = R.pickWeighted(ads, side === 'glimmer' ? 1 : 0, nrng, () => 1)
      .concat(R.pickWeighted(plain, NOTICES_N, nrng, n => (region && n.region === region) ? 3 : 1)).slice(0, NOTICES_N);
    // One poll a day (not per edition), so a vote holds all day.
    const pollPool = list('polls').filter(ok);
    const poll = pollPool.length ? pollPool[R.fnv1a('poll\n' + storySeed) % pollPool.length] : null;
    let pct = null;
    if (poll) {
      const r = R.mulberry32(R.fnv1a('pct\n' + poll.id + '\n' + storySeed));
      const w = [r() + 0.35, r() + 0.35, r() + 0.35], t = w[0] + w[1] + w[2];
      const a = Math.round(w[0] / t * 100), b = Math.round(w[1] / t * 100);
      pct = [a, b, 100 - a - b];
    }
    const youPool = list('you').filter(ok);
    const you = youPool.length ? youPool[R.fnv1a('you\n' + seed) % youPool.length] : null;
    // Walkling of the day: only a form the holder has seen, so it never spoils; the partner if nothing else.
    const seen = ((st.me && st.me.seen) || []).filter(k => /^[a-z]+\/[0-2]$/.test(k)).sort();
    let spotlight = null;
    if (seen.length) {
      const k = seen[R.fnv1a('spot\n' + storySeed) % seen.length].split('/');
      spotlight = { species: k[0], stage: Number(k[1]) };
    } else if (st.me && st.me.partnerSpecies) spotlight = { species: st.me.partnerSpecies, stage: Number(st.me.partnerStage) || 0 };

    return {
      // The unread key: a new day or a new lead. Walking somewhere else, losing signal or a new edition time is not.
      key: day + ':' + (lead ? lead.id : ''),
      day: day,
      edition: name,
      lead: lead ? publish(lead, true) : null,
      features: features.map(s => publish(s, true)),
      briefs: briefs.map(s => publish(s, false)),
      ticker: briefs.concat(features.slice(0, 2)).map(s => fill(s.headline, st)),
      voices: voices.map(v => ({ id: v.id, who: fill(v.who, st), text: fill(v.text, st) })),
      notices: notices.map(n => ({ id: n.id, kind: n.kind, title: fill(n.title, st), text: fill(n.text, st) })),
      poll: poll ? { id: poll.id, q: fill(poll.q, st), options: poll.options.map(o => fill(o, st)), pct: pct } : null,
      you: you ? { id: you.id, headline: fill(you.headline, st), body: (you.body || []).map(l => fill(l, st)) } : null,
      spotlight: spotlight,
      thin: bars <= 1,
    };
  }

  // Scrapbook: every lead the holder can see now (story order), and one stored clipping by id. A clipping stays
  // readable after its story retires (a '!flag' term), because it is the holder's own history.
  function plainStory(s, st) {
    return {
      id: s.id, lead: s.lead, section: s.section, desk: DESKS[s.desk] || DESKS.block,
      headline: fill(s.headline, st), body: (s.body || []).map(l => fill(l, st)), art: artOf(s),
    };
  }
  function leadsFor(state) {
    const R = rib(), st = state || {};
    const ok = gate(st, R.normSide(st));
    return list('stories').filter(s => typeof s.lead === 'number' && ok(s)).sort((a, b) => a.lead - b.lead).map(s => plainStory(s, st));
  }
  function clipping(id, state) {
    const s = list('stories').find(x => x.id === id && typeof x.lead === 'number');
    return s ? plainStory(s, state || {}) : null;
  }

  function sectionLabel(id) {
    const s = SECTIONS.find(x => x.id === id);
    return s ? s.label : '';
  }

  function devCheck() {
    const bad = [];
    const ids = new Set();
    const all = list('stories');
    if (!all.length) bad.push('no news stories loaded');
    const lineCheck = (id, l, max, when) => {
      const toks = String(l).match(/\{[^}]*\}/g) || [];
      toks.forEach(t => { if (TOKENS.indexOf(t) === -1) bad.push('unknown token ' + t + ': ' + id); });
      if (/[{}]/.test(String(l).replace(/\{[a-z]+\}/g, ''))) bad.push('stray brace: ' + id);
      if (/ {2}/.test(l)) bad.push('double space: ' + id);
      if (/[‘’“”]/.test(l)) bad.push('curly quote: ' + id);
      if (max && Array.from(String(l).replace(/\{[a-z]+\}/g, 'Wwwwwwwwwwww')).length > max + 6) bad.push('line too long: ' + id);
      if (SECRET.test(l) && !(when || []).includes('story.side=glimmer')) bad.push('secret word off the Glimmer side: ' + id);
    };
    const gateCheck = x => {
      if (x.sky && !(Array.isArray(x.sky) && x.sky.length && x.sky.every(v => SKY.indexOf(v) !== -1))) bad.push('bad sky gate: ' + x.id);
      if (x.phase && !(Array.isArray(x.phase) && x.phase.length && x.phase.every(v => PHASES.indexOf(v) !== -1))) bad.push('bad phase gate: ' + x.id);
      if (x.me && !(Array.isArray(x.me) && x.me.every(v => v === 'partner' || /^(seals|steps|acorns)>=\d+$/.test(v)))) bad.push('bad me gate: ' + x.id);
      if (!x.lore || !x.lore.length) bad.push('cites no lore: ' + x.id);
      if (ids.has(x.id)) bad.push('duplicate id: ' + x.id);
      ids.add(x.id);
      if (x.region === 'heights' && !(x.when || []).includes('story.heights_done')) bad.push('heights item missing the flag: ' + x.id);
    };
    all.forEach(s => {
      gateCheck(s);
      if (!sectionLabel(s.section)) bad.push('unknown section: ' + s.id);
      if (!DESKS[s.desk]) bad.push('unknown desk: ' + s.id);
      if (!s.headline) bad.push('no headline: ' + s.id);
      if (!s.body || s.body.length < 1 || s.body.length > 3) bad.push('body needs 1-3 lines: ' + s.id);
      lineCheck(s.id, s.headline || '', HEADLINE_MAX, s.when);
      (s.body || []).forEach(l => lineCheck(s.id, l, BODY_MAX, s.when));
      (s.replies || []).forEach(r => lineCheck(s.id, r.text || '', 100, s.when));
      if (s.art && !artOf(s)) bad.push('bad art: ' + s.id);
      if (s.art && typeof SPECIES !== 'undefined' && !SPECIES.some(x => x.id === artOf(s).species)) bad.push('art is not a species: ' + s.id);
      if (/sold/i.test([s.headline].concat(s.body || []).join(' ')) && !(s.when || []).includes('story.quarry_bought')) bad.push('sold story missing the flag: ' + s.id);
    });
    list('voices').forEach(v => { gateCheck(v); lineCheck(v.id, v.text || '', 100, v.when); lineCheck(v.id, v.who || '', 32, v.when); });
    list('notices').forEach(n => {
      gateCheck(n);
      if (['notice', 'lost', 'ad'].indexOf(n.kind) === -1) bad.push('notice kind: ' + n.id);
      if (n.kind === 'ad' && !(n.when || []).includes('story.side=glimmer')) bad.push('ad off the Glimmer side: ' + n.id);
      lineCheck(n.id, n.title || '', 28, n.when); lineCheck(n.id, n.text || '', 90, n.when);
    });
    list('polls').forEach(q => { gateCheck(q); if (!q.options || q.options.length !== 3) bad.push('poll needs 3 options: ' + q.id); lineCheck(q.id, q.q || '', 48, q.when); (q.options || []).forEach(o => lineCheck(q.id, o, 24, q.when)); });
    list('you').forEach(y => { gateCheck(y); lineCheck(y.id, y.headline || '', HEADLINE_MAX, y.when); (y.body || []).forEach(l => lineCheck(y.id, l, BODY_MAX, y.when)); });

    const me = { holder: 'Tester', partner: 'Pipkit', partnerSpecies: 'ember', partnerStage: 0, seals: 0, steps: 120, acorns: 5, seen: ['ember/0'] };
    const early = { flags: { 'story.phone_got': true }, side: 'keepers', map: 'hearthmoor', uid: 'demo', day: '2026-04-01', hh: 9, phase: 'day', sky: 'clear', town: 'Hearthmoor', me: me };
    const a = edition(early), b = edition(JSON.parse(JSON.stringify(early)));
    if (JSON.stringify(a) !== JSON.stringify(b)) bad.push('edition was not stable');
    if (!a.lead) bad.push('an early edition has no lead');
    const text = e => [e.lead].concat(e.features, e.briefs).filter(Boolean).map(s => s.headline + ' ' + s.body.join(' ')).join('\n')
      + (e.voices || []).map(v => v.text).join('\n') + (e.notices || []).map(n => n.title + ' ' + n.text).join('\n') + (e.you ? e.you.headline + ' ' + e.you.body.join(' ') : '');
    if (/RegenX|went dark|was sold|Brinewick|High Charity|Mahopac|Route 3/i.test(text(a))) bad.push('early edition leaked a later story');
    if (/\{[a-z]+\}/.test(text(a))) bad.push('a token was not filled');
    const featureIds = e => e.features.map(s => s.id).join();
    if (['2026-04-02', '2026-04-03', '2026-04-04'].every(d => featureIds(edition(Object.assign({}, early, { day: d }))) === featureIds(a))) bad.push('features did not change across four days');
    if (list('voices').length && !a.voices.length) bad.push('an early edition has no voices');
    if (list('polls').length && !a.poll) bad.push('an early edition has no poll');
    if (a.spotlight && a.spotlight.species !== 'ember') bad.push('spotlight showed a form the holder has not seen');
    const leadNums = all.filter(s => s.lead !== undefined).map(s => s.lead);
    if (leadNums.some(n => !Number.isInteger(n))) bad.push('a lead is not a whole number');
    const firstLeads = leadsFor(early);
    if (firstLeads.length !== 1) bad.push('an early holder should have exactly one front page to clip, has ' + firstLeads.length);
    return bad;
  }

  const api = { edition: edition, leadsFor: leadsFor, clipping: clipping, devCheck: devCheck, sectionLabel: sectionLabel, SECTIONS: SECTIONS, TOKENS: TOKENS, HEADLINE_MAX: HEADLINE_MAX, BODY_MAX: BODY_MAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PPNews = api;
})(typeof window !== 'undefined' ? window : globalThis);
