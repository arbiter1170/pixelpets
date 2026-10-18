/* High Charity Event Hall. Five solo games, plus three pass-the-phone games (hop, relay, seek).
   No growth XP, no battle XP. Bond: +1 on a clear, at most 3 per local day, partner only.
   Each game can be finished 3 times a day. Quitting does not spend a try.
   The two-keeper clears stay off the five-game hall count. finish() pays the reward. */
(function (root) {
  'use strict';
  const IDS = ['lantern', 'shells', 'chirp', 'dash', 'pairs', 'hop', 'relay', 'seek'];
  const RULE = {
    lantern: 'Lanterns fall in three lanes. Catch 12. Arrows move, or tap a lane.',
    shells: 'Three shells. Watch the treat, then tap where it hid. Get 2 of 3.',
    chirp: 'Listen to the chirp, then tap the same beats. Get 2 of 3.',
    dash: 'Steer for a little bit. Collect 8 acorns. Puddles only make you slip.',
    pairs: 'Flip the cards. Match Ember, Tide, and Bloom in 8 flips.',
    hop: 'A rope swings. Both jump. Left is you, right is your friend. A quicker Walkling has a wider beat.',
    relay: 'Race to the flag. Tap your side to hop the logs. A quicker Walkling runs faster.',
    seek: 'Take turns hiding a treat. A happy Walkling sniffs a hint. A quick one shuffles more.',
  };
  const CLEAR = {
    lantern: 'The lanterns bob. {pet} glows.',
    shells: 'You found the treat. {pet} does a tiny hop.',
    chirp: '{pet} sings the last beat with you.',
    dash: '{pet} shakes off a puddle and keeps the shiny ones.',
    pairs: 'Three pairs, all kindled. {pet} looks proud.',
    hop: 'You jumped together. {pet} is still bouncing.',
    relay: 'The flags are down. What a race.',
    seek: 'Both Walklings had a turn. The bushes settle.',
  };
  const FAIL = {
    lantern: 'The lanterns drift off. {pet} yawns, still glad you tried.',
    shells: 'The shells settle. {pet} pats the empty one and giggles.',
    chirp: 'Almost. {pet} hums the last note for you.',
    dash: '{pet} sits in the sun to dry. The puddles win today.',
    pairs: 'The cards yawn and close. {pet} pats your hand.',
    hop: 'The rope clips a foot. {pet} giggles and sits.',
    relay: 'The race fades. {pet} tugs your sleeve.',
    seek: 'The bushes close up. {pet} shrugs.',
  };
  const FIRST = {
    lantern: ['hearty_snack', 1],
    shells: ['befriend_treat', 2],
    dash: ['acorns', 80],
    pairs: ['joy_crumb', 2],
    hop: ['joy_crumb', 2],
    relay: ['acorns', 40],
    seek: ['befriend_treat', 1],
  };
  const REPLAY = {
    lantern: ['heal_snack', 1],
    shells: ['befriend_treat', 1],
    chirp: ['energy_sip', 1],
    dash: ['acorns', 25],
    pairs: ['joy_crumb', 1],
    hop: ['joy_crumb', 1],
    relay: ['acorns', 15],
    seek: ['energy_sip', 1],
  };
  const CLEAR_FLAG = {
    lantern: 'story.hc_clear_lantern',
    shells: 'story.hc_clear_shells',
    chirp: 'story.hc_clear_chirp',
    dash: 'story.hc_clear_dash',
    pairs: 'story.hc_clear_pairs',
    hop: 'story.hc_clear_hop',
    relay: 'story.hc_clear_relay',
    seek: 'story.hc_clear_seek',
  };
  const TITLES = {
    lantern: 'Lantern Catch', shells: 'Treat Shells', chirp: 'Chirp Echo', dash: 'Plaza Dash', pairs: 'Kindled Pairs',
    hop: 'Rope Hop', relay: 'Flag Relay', seek: 'Sniff Seek',
  };

  const reduce = () => !!(root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let active = null;
  // game.js consts are not visible from this earlier script, so boot binds them.
  let api = {};
  const snd = (n, d) => { try { if (api.sfx) api.sfx(n, d); } catch (e) {} };
  function bind(next){ api = next || {}; }

  function announce(text) {
    const el = document.getElementById('playLive');
    if (el) el.textContent = text;
  }
  function canvas() { return document.getElementById('playCanvas'); }
  function g2() {
    const c = canvas(); if (!c) return null;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return g;
  }
  function px(g, col, x, y, w, h) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w, h); }
  function chirpId() {
    try {
      const p = api.pet();
      if (!p) return 'chirp_bloom';
      const sp = SPECIES.find(s => s.id === p.species);
      const t = sp && sp.type ? String(sp.type).toLowerCase() : 'bloom';
      return 'chirp_' + t;
    } catch (e) { return 'chirp_bloom'; }
  }
  const TYPE_COL = { EMBER: 'r', TIDE: 'b', BLOOM: 'g', STONE: 'm', VOLT: 'y', FROST: 's', GUST: 'c', SHADE: 'p' };
  function monName(p){ return api.monName ? api.monName(p) : 'Walkling'; }
  function spdOf(p){ const n = api.spd ? api.spd(p) : 48; return Number.isFinite(n) ? n : 48; }
  function colOf(p){
    try {
      const sp = SPECIES.find(s => s.id === (p && p.species));
      return PAL[TYPE_COL[sp && sp.type] || 'l'];
    } catch (e) { return PAL.l; }
  }
  function duo(){
    const me = api.pet ? api.pet() : null;
    const party = api.party ? api.party() : [];
    const other = party.find(p => me && p.id !== me.id);
    const guestSpecies = me && me.species === 'tide' ? 'bloom' : 'tide';
    const guest = { guest: true, species: guestSpecies, stage: 0, nick: 'Nib', happy: 70, level: 5 };
    return { a: me, b: other || guest };
  }
  function showPads(on, pair){
    const el = document.getElementById('playPads');
    if (!el) return;
    el.hidden = !on;
    if (!on || !pair) return;
    const b1 = document.getElementById('playP1'), b2 = document.getElementById('playP2');
    if (b1) b1.textContent = monName(pair.a);
    if (b2) b2.textContent = monName(pair.b);
  }

  function finish(id, res) {
    res = res || {};
    const lines = [];
    if (!IDS.includes(id) || !api.state) return lines;
    const S = api.state();
    if (res.quit) { lines.push(['', "We'll keep your seat."]); return lines; }
    const c = api.careDay();
    if ((c.mg[id] || 0) >= 3) { lines.push(['', 'This booth is tired. Come back tomorrow.']); return lines; }
    c.mg[id] = (c.mg[id] || 0) + 1;
    const who = '';
    if (!res.clear) {
      lines.push([who, FAIL[id]]);
      api.save();
      return lines;
    }
    lines.push([who, res.note || CLEAR[id]]);
    const flag = CLEAR_FLAG[id];
    const first = !S.flags[flag];
    const solo = id === 'lantern' || id === 'shells' || id === 'chirp' || id === 'dash' || id === 'pairs';
    if (first) {
      S.flags[flag] = true;
      if (solo) S.flags['story.hc_games'] = Math.min(5, (Number(S.flags['story.hc_games']) || 0) + 1);
    }
    if (id === 'chirp' && !S.flags['story.hc_tonic']) {
      const r = api.grantItem('wake_tonic', 1);
      if (r.added >= 1) {
        S.flags['story.hc_tonic'] = true;
        snd('stinger_item');
        lines.push(['', 'You got a Wake Tonic.']);
      } else {
        lines.push(['', "Your bag can't hold another Wake Tonic. We'll try again next clear."]);
        if (r.lost) api.toast(api.BAG_FULL_MSG);
      }
    } else {
      const pay = (first ? FIRST[id] : REPLAY[id]) || REPLAY[id];
      if (pay && pay[0] === 'acorns') {
        const n = pay[1];
        S.money = (S.money || 0) + n;
        snd('stinger_item');
        lines.push(['', api.playerName() + ' got ' + api.acorns(n) + '!']);
      } else if (pay) {
        const r = api.grantItem(pay[0], pay[1]);
        if (r.added > 0) {
          snd('stinger_item');
          lines.push(['', 'You got ' + api.itemLabel(pay[0], r.added) + '.']);
        }
        if (r.lost) api.toast(api.BAG_FULL_MSG);
      }
    }
    if ((c.minigameBond | 0) < 3) {
      c.minigameBond = (c.minigameBond | 0) + 1;
      api.addBond(api.pet(), 1);
      lines.push(['', '{pet} leans on you. You feel a little closer.']);
    } else {
      lines.push(['', "{pet} is happy, and that's enough closeness for today."]);
    }
    api.save();
    try { api.updateHUD(); } catch (e) {}
    return lines;
  }

  function devCheck() {
    const bad = [];
    IDS.forEach(id => {
      if (!RULE[id] || RULE[id].length > 110 || !CLEAR[id] || !FAIL[id] || !CLEAR_FLAG[id]) bad.push('missing copy ' + id);
    });
    if (FIRST.chirp) bad.push('chirp first prize is the Wake Tonic, not FIRST');
    return bad;
  }

  function hide() {
    const ov = document.getElementById('ovPlay');
    if (ov) ov.hidden = true;
    const c = canvas();
    if (c) { c.onpointerdown = c.onpointermove = c.onpointerup = null; }
    showPads(false);
    active = null;
  }

  function stop() {
    if (active && active.done) active.done({ quit: true, clear: false, score: active.score || 0 });
  }

  function play(id, hooks) {
    hooks = hooks || {};
    return new Promise(resolve => {
      if (!IDS.includes(id) || !canvas()) { resolve({ quit: true, clear: false, score: 0 }); return; }
      const ov = document.getElementById('ovPlay');
      const title = document.getElementById('playTitle');
      const rule = document.getElementById('playRule');
      if (title) title.textContent = TITLES[id] || 'Play';
      if (rule) rule.textContent = RULE[id];
      ov.hidden = false;
      try { if (api.fitCanvas) api.fitCanvas(canvas(), Math.min(window.innerWidth, 480) - 48, 320); } catch (e) {}
      if (hooks.onOpen) hooks.onOpen();
      let settled = false;
      const live = { id, score: 0, keys: {} };
      active = live;
      const finishPlay = res => {
        if (settled) return;
        settled = true;
        if (live.stopLoop) live.stopLoop();
        hide();
        if (hooks.onClose) hooks.onClose();
        resolve(res);
      };
      live.done = finishPlay;
      bootGame(live);
      showPads(id === 'hop' || id === 'relay', live.pair);
      announce(RULE[id]);
      let last = performance.now();
      const frame = t => {
        if (settled) return;
        const dt = Math.min(50, t - last); last = t;
        if (live.step && live.step(dt) === false) return;
        live.raf = requestAnimationFrame(frame);
      };
      live.stopLoop = () => { if (live.raf) cancelAnimationFrame(live.raf); };
      live.raf = requestAnimationFrame(frame);
      const c = canvas();
      const local = e => {
        const r = c.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
      };
      c.onpointerdown = e => { e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch (err) {} live.down = true; if (live.pointer) live.pointer(local(e), 'down'); };
      c.onpointermove = e => { if (live.down && live.pointer) live.pointer(local(e), 'move'); };
      c.onpointerup = e => { live.down = false; if (live.pointer) live.pointer(local(e), 'up'); };
    });
  }

  function bootGame(live) {
    if (live.id === 'lantern') bootLantern(live);
    else if (live.id === 'shells') bootShells(live);
    else if (live.id === 'chirp') bootChirp(live);
    else if (live.id === 'dash') bootDash(live);
    else if (live.id === 'hop') bootHop(live);
    else if (live.id === 'relay') bootRelay(live);
    else if (live.id === 'seek') bootSeek(live);
    else bootPairs(live);
  }

  function bootLantern(live) {
    live.lane = 1; live.score = 0; live.t = 0; live.spawn = 400; live.items = [];
    live.step = dt => {
      live.t += dt;
      const speed = (live.t < 10000 ? 80 : 110) * dt / 1000;
      live.spawn -= dt;
      if (live.spawn <= 0) {
        live.spawn += 700;
        const free = [0, 1, 2].filter(i => !live.items.some(it => it.lane === i && it.y < 150));
        if (free.length) live.items.push({ lane: free[(Math.random() * free.length) | 0], y: -10 });
      }
      live.items.forEach(it => {
        it.y += speed;
        if (!it.got && !it.miss && it.y >= 132 && it.y <= 158 && it.lane === live.lane) {
          it.got = true; live.score++; snd('tap'); announce('Caught ' + live.score + '.');
        } else if (!it.got && it.y > 168) it.miss = true;
      });
      live.items = live.items.filter(it => it.y < 200);
      drawLantern(live);
      if (live.t >= 30000) { live.done({ quit: false, clear: live.score >= 12, score: live.score }); return false; }
      return true;
    };
    live.onKey = (k, repeat) => {
      if (repeat) return;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') live.lane = Math.max(0, live.lane - 1);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') live.lane = Math.min(2, live.lane + 1);
      else if (k === '1' || k === '2' || k === '3') live.lane = +k - 1;
    };
    live.pointer = p => { live.lane = p.x < 58 ? 0 : p.x < 117 ? 1 : 2; };
  }

  function drawLantern(live) {
    const g = g2(); if (!g) return;
    px(g, PAL.k, 0, 0, 176, 176);
    for (let i = 0; i < 3; i++) px(g, i === live.lane ? PAL.n : PAL.d, 8 + i * 56, 8, 48, 160);
    live.items.forEach(it => {
      const x = 20 + it.lane * 56;
      px(g, PAL.y, x, it.y, 16, 18);
      px(g, PAL.o, x + 6, it.y + 4, 4, 8);
    });
    const bx = 16 + live.lane * 56;
    px(g, PAL.o, bx, 148, 32, 10);
    px(g, PAL.d, bx + 4, 144, 24, 6);
    g.fillStyle = PAL.w; g.font = '14px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText(String(live.score), 8, 2);
    g.fillText(String(Math.max(0, Math.ceil((30000 - live.t) / 1000))), 150, 2);
  }

  function bootShells(live) {
    const plan = [{ swaps: 3, ms: 520 }, { swaps: 4, ms: 420 }, { swaps: 5, ms: 340 }];
    live.round = 0; live.correct = 0; live.score = 0;
    const begin = () => {
      live.pos = (Math.random() * 3) | 0;
      live.queue = [];
      const p = plan[live.round];
      for (let i = 0; i < p.swaps; i++) {
        let a = (Math.random() * 3) | 0, b = (Math.random() * 3) | 0;
        if (a === b) b = (b + 1) % 3;
        live.queue.push([a, b]);
      }
      live.cursor = 0; live.swapMs = reduce() ? 0 : p.ms;
      live.phase = 'show'; live.wait = 700; live.show = true; live.picked = -1; live.flash = null;
    };
    begin();
    const advance = () => {
      if (live.phase === 'show') { live.show = false; live.phase = 'swap'; live.wait = live.swapMs; return; }
      if (live.phase === 'swap') {
        if (live.cursor < live.queue.length) {
          const [a, b] = live.queue[live.cursor++];
          if (live.pos === a) live.pos = b; else if (live.pos === b) live.pos = a;
          live.flash = [a, b];
          live.wait = live.swapMs;
        } else {
          live.phase = 'ask'; live.wait = 8000; live.flash = null; live.show = false;
          announce('Which shell?');
        }
        return;
      }
      if (live.phase === 'ask') { live.phase = 'reveal'; live.show = true; live.wait = 500; return; }
      if (live.phase === 'reveal') {
        if (live.picked === live.pos) { live.correct++; live.score = live.correct; }
        live.round++;
        if (live.round >= 3) { live.done({ quit: false, clear: live.correct >= 2, score: live.correct }); live.phase = 'over'; return; }
        begin();
      }
    };
    live.step = dt => {
      if (live.phase === 'over') return false;
      live.wait -= dt;
      let guard = 0;
      while (live.wait <= 0 && live.phase !== 'over' && live.phase !== 'ask' && guard++ < 12) advance();
      if (live.phase === 'ask' && live.wait <= 0) advance();
      drawShells(live);
      return live.phase !== 'over';
    };
    const pick = i => {
      if (live.phase !== 'ask') return;
      live.picked = i;
      live.phase = 'reveal'; live.show = true; live.wait = 500;
      snd(i === live.pos ? 'tap' : 'miss');
    };
    live.onKey = (k, repeat) => { if (!repeat && (k === '1' || k === '2' || k === '3')) pick(+k - 1); };
    live.pointer = (p, kind) => { if (kind !== 'down') return; const i = p.x < 58 ? 0 : p.x < 117 ? 1 : 2; pick(i); };
  }

  function drawShells(live) {
    const g = g2(); if (!g) return;
    px(g, PAL.k, 0, 0, 176, 176);
    for (let i = 0; i < 3; i++) {
      const x = 22 + i * 52, hot = live.flash && live.flash.includes(i);
      px(g, hot ? PAL.y : PAL.o, x, 70, 36, 28);
      px(g, PAL.d, x + 8, 78, 20, 8);
      if (live.show && live.pos === i) { px(g, PAL.o, x + 12, 96, 12, 10); px(g, PAL.d, x + 14, 98, 8, 4); }
    }
    g.fillStyle = PAL.w; g.font = '14px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText(live.correct + ' / 3', 8, 8);
  }

  function bootChirp(live) {
    const pats = [[1, 1, 0, 1], [1, 0, 1, 1], [0, 1, 1, 0]];
    live.round = 0; live.good = 0; live.score = 0;
    const arm = () => {
      live.pat = pats[live.round];
      live.phase = 'listen'; live.t = 0; live.heard = -1; live.taps = {}; live.bad = false; live.flash = false;
    };
    arm();
    const judge = () => {
      const ok = !live.bad && live.pat.every((bit, i) => (bit === 1) === !!live.taps[i]);
      if (ok) { live.good++; live.score = live.good; snd('tap'); }
      else snd('miss');
      live.round++;
      if (live.round >= 3) { live.done({ quit: false, clear: live.good >= 2, score: live.good }); live.phase = 'over'; return; }
      live.phase = 'gap'; live.t = 0;
    };
    live.step = dt => {
      if (live.phase === 'over') return false;
      live.t += dt;
      if (live.phase === 'gap') {
        if (live.t >= 700) arm();
        drawChirp(live); return true;
      }
      if (live.phase === 'listen') {
        const slot = Math.min(3, Math.floor(live.t / 500));
        if (slot !== live.heard && slot < 4) {
          live.heard = slot;
          live.flash = !!live.pat[slot];
          if (live.pat[slot]) snd(chirpId());
        }
        if (live.t >= 2000) { live.phase = 'echo'; live.t = 0; live.taps = {}; live.bad = false; live.flash = false; announce('Your turn.'); }
      } else if (live.phase === 'echo') {
        if (live.t >= 2000) judge();
      }
      drawChirp(live);
      return live.phase !== 'over';
    };
    const tap = () => {
      if (live.phase !== 'echo') return;
      let best = -1, dist = 181;
      for (let i = 0; i < 4; i++) {
        const d = Math.abs(live.t - (i * 500 + 250));
        if (d <= 180 && d < dist) { dist = d; best = i; }
      }
      if (best < 0 || live.taps[best]) return;
      live.taps[best] = true;
      if (!live.pat[best]) live.bad = true;
      live.flash = true;
      snd('tap');
    };
    live.onKey = (k, repeat) => { if (!repeat && (k === ' ' || k === 'Enter')) tap(); };
    live.pointer = (p, kind) => { if (kind === 'down') tap(); };
  }

  function drawChirp(live) {
    const g = g2(); if (!g) return;
    px(g, PAL.k, 0, 0, 176, 176);
    px(g, PAL.b, 28, 60, 120, 56);
    px(g, PAL.c, 36, 68, 104, 8);
    px(g, PAL.s, 48, 72, 16, 4);
    if (live.flash) px(g, PAL.y, 78, 40, 20, 16);
    const slot = live.phase === 'echo' ? Math.min(3, Math.floor(live.t / 500)) : -1;
    for (let i = 0; i < 4; i++) {
      px(g, i === slot ? PAL.y : PAL.n, 28 + i * 32, 140, 24, 16);
      if (live.phase === 'echo' && live.taps[i]) px(g, live.pat && live.pat[i] ? PAL.l : PAL.r, 34 + i * 32, 144, 12, 8);
    }
    g.fillStyle = PAL.w; g.font = '14px sans-serif'; g.textBaseline = 'top';
    g.fillText(live.good + ' / 3', 8, 8);
  }

  function bootDash(live) {
    live.x = 80; live.y = 148; live.score = 0; live.t = 0; live.spawn = 400; live.acorns = [];
    live.puddles = [{ x: 40, y: 70 }, { x: 120, y: 50 }, { x: 88, y: 110 }];
    live.stun = 0; live.aim = null;
    const far = (x, y) => Math.hypot(x - live.x, y - live.y) >= 24 && live.puddles.every(p => Math.hypot(x - p.x, y - p.y) >= 24);
    live.step = dt => {
      live.t += dt;
      if (live.stun > 0) live.stun -= dt;
      else {
        let dx = 0, dy = 0;
        if (live.keys.left) dx -= 1;
        if (live.keys.right) dx += 1;
        if (live.keys.up) dy -= 1;
        if (live.keys.down) dy += 1;
        if (live.aim) { dx = live.aim.x - live.x; dy = live.aim.y - live.y; if (Math.hypot(dx, dy) < 4) dx = dy = 0; }
        const len = Math.hypot(dx, dy) || 1;
        if (dx || dy) {
          const sp = 70 * dt / 1000;
          live.x = Math.max(12, Math.min(164, live.x + dx / len * sp));
          live.y = Math.max(12, Math.min(164, live.y + dy / len * sp));
        }
      }
      live.spawn -= dt;
      if (live.spawn <= 0) {
        live.spawn += 1100;
        if (live.acorns.length < 3) {
          for (let n = 0; n < 8; n++) {
            const x = 20 + Math.random() * 136, y = 20 + Math.random() * 120;
            if (far(x, y)) { live.acorns.push({ x, y }); break; }
          }
        }
      }
      live.acorns = live.acorns.filter(a => {
        if (live.stun <= 0 && Math.hypot(a.x - live.x, a.y - live.y) <= 14) { live.score++; snd('tap'); return false; }
        return true;
      });
      if (live.stun <= 0) live.puddles.forEach(p => {
        if (Math.hypot(p.x - live.x, p.y - live.y) <= 14) {
          live.stun = 600;
          const d = Math.hypot(live.x - p.x, live.y - p.y) || 1;
          live.x = Math.max(12, Math.min(164, live.x + (live.x - p.x) / d * 16));
          live.y = Math.max(12, Math.min(164, live.y + (live.y - p.y) / d * 16));
          snd('miss');
        }
      });
      drawDash(live);
      if (live.t >= 20000) { live.done({ quit: false, clear: live.score >= 8, score: live.score }); return false; }
      return true;
    };
    const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
    live.onKey = k => { if (dir[k]) { live.keys[dir[k]] = true; live.aim = null; } };
    live.onUp = k => { if (dir[k]) live.keys[dir[k]] = false; };
    live.pointer = (p, kind) => { if (kind === 'up') live.aim = null; else { live.aim = p; live.keys = {}; } };
  }

  function drawDash(live) {
    const g = g2(); if (!g) return;
    px(g, PAL.k, 0, 0, 176, 176);
    px(g, PAL.h, 0, 0, 176, 176);
    px(g, PAL.n, 0, 0, 176, 4);
    live.puddles.forEach(p => { px(g, PAL.b, p.x - 14, p.y - 10, 28, 20); px(g, PAL.c, p.x - 10, p.y - 6, 8, 3); px(g, PAL.s, p.x - 6, p.y - 4, 3, 2); });
    live.acorns.forEach(a => { px(g, PAL.y, a.x - 4, a.y - 4, 8, 8); px(g, PAL.o, a.x - 2, a.y - 2, 4, 4); });
    px(g, live.stun > 0 ? PAL.m : PAL.l, live.x - 6, live.y - 6, 12, 12);
    px(g, PAL.w, live.x - 2, live.y - 2, 3, 3);
    g.fillStyle = PAL.k; g.font = '14px sans-serif'; g.textBaseline = 'top';
    g.fillText(String(live.score), 6, 6);
  }

  function bootPairs(live) {
    const deck = ['ember', 'ember', 'tide', 'tide', 'bloom', 'bloom'];
    for (let i = deck.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const s = deck[i]; deck[i] = deck[j]; deck[j] = s; }
    live.deck = deck; live.up = []; live.lock = []; live.flip = 0; live.wait = 0; live.t = 0; live.score = 0; live.hold = null;
    const cols = { ember: PAL.r, tide: PAL.b, bloom: PAL.g };
    live.cols = cols;
    const open = i => {
      if (live.wait > 0 || live.lock[i] || live.up.includes(i) || live.flip >= 8 && live.up.length === 0) return;
      if (live.up.length === 2) return;
      live.up.push(i); live.flip++;
      snd('tap');
      if (live.up.length === 2) {
        const [a, b] = live.up;
        if (live.deck[a] === live.deck[b]) {
          live.lock[a] = live.lock[b] = true; live.up = []; live.score++;
          snd('play');
          if (live.lock.filter(Boolean).length === 6 && live.flip <= 8) {
            live.done({ quit: false, clear: true, score: live.flip }); live.phase = 'over'; return;
          }
        } else live.wait = 700;
      }
      // Flip 8 with a card still face-up and unmatched ends the round. A mismatch waits out its peek first.
      if (live.phase !== 'over' && live.flip >= 8 && live.wait <= 0 && live.up.length === 1) {
        live.done({ quit: false, clear: false, score: live.flip }); live.phase = 'over';
      }
    };
    live.step = dt => {
      if (live.phase === 'over') return false;
      live.t += dt;
      if (live.wait > 0) {
        live.wait -= dt;
        if (live.wait <= 0) { live.up = []; snd('miss'); }
      }
      drawPairs(live);
      if (live.t >= 45000) { live.done({ quit: false, clear: false, score: live.flip }); return false; }
      if (live.flip >= 8 && live.wait <= 0 && live.up.length === 0 && live.lock.filter(Boolean).length < 6) {
        live.done({ quit: false, clear: false, score: live.flip }); return false;
      }
      return true;
    };
    live.open = open;
    live.onKey = (k, repeat) => { if (!repeat && k >= '1' && k <= '6') open(+k - 1); };
    live.pointer = (p, kind) => {
      if (kind !== 'down') return;
      const col = p.x < 88 ? 0 : 1, row = p.y < 58 ? 0 : p.y < 116 ? 1 : 2;
      open(row * 2 + col);
    };
  }

  function drawPairs(live) {
    const g = g2(); if (!g) return;
    px(g, PAL.k, 0, 0, 176, 176);
    for (let i = 0; i < 6; i++) {
      const x = 16 + (i % 2) * 80, y = 12 + ((i / 2) | 0) * 52;
      const show = live.lock[i] || live.up.includes(i);
      if (show) {
        px(g, PAL.w, x, y, 64, 44);
        px(g, live.cols[live.deck[i]], x + 8, y + 8, 48, 28);
      } else {
        px(g, PAL.n, x, y, 64, 44);
        px(g, PAL.y, x, y, 64, 4); px(g, PAL.y, x, y + 40, 64, 4);
        px(g, PAL.y, x + 28, y + 16, 8, 8);
      }
    }
    g.fillStyle = PAL.w; g.font = '14px sans-serif'; g.textBaseline = 'top';
    g.fillText(String(live.flip), 4, 0);
  }

  function sideKeys(live){
    live.press = live.press || (() => {});
    live.onKey = (k, repeat) => {
      if (repeat) return;
      if (k === ' ' || k === 'f' || k === 'F' || k === 'ArrowLeft') live.press(0);
      if (k === 'Enter' || k === 'j' || k === 'J' || k === 'ArrowRight') live.press(1);
    };
  }
  function bootHop(live){
    const pair = duo();
    live.pair = pair; live.miss = 0; live.beat = 0; live.t = 0; live.air = [-9999, -9999];
    const windowFor = p => 180 + Math.min(80, Math.floor(spdOf(p) / 2));
    live.step = () => {
      const beat = Math.floor(live.t / 1000);
      if (beat > live.beat && live.beat < 12) {
        const center = live.beat * 1000 + 500;
        [0, 1].forEach(i => {
          const p = i === 0 ? pair.a : pair.b;
          if (Math.abs(live.air[i] - center) > windowFor(p)) live.miss++;
        });
        live.beat = beat;
        if (live.beat >= 12 || live.miss >= 6) {
          live.done({ quit: false, clear: live.miss < 6 && live.beat >= 12, score: Math.max(0, 12 - live.miss) });
          return false;
        }
      }
      drawHop(live);
      return true;
    };
    const prev = live.step;
    live.step = dt => { live.t += dt; return prev(); };
    live.press = i => { live.air[i] = live.t; snd('tap'); };
    sideKeys(live);
  }
  function drawHop(live){
    const g = g2(); if (!g) return;
    px(g, PAL.k, 0, 0, 176, 176);
    const phase = (live.t % 1000) / 1000;
    const rope = Math.abs(phase - 0.5) < 0.12 ? 150 : 40 + Math.sin(phase * Math.PI) * 90;
    px(g, PAL.y, 16, rope, 144, 3);
    [0, 1].forEach(i => {
      const up = live.t - live.air[i] < 260;
      const x = 36 + i * 80, y = up ? 112 : 132;
      px(g, colOf(i === 0 ? live.pair.a : live.pair.b), x, y, 18, 16);
      px(g, PAL.w, x + 4, y + 4, 4, 4);
    });
    g.fillStyle = PAL.w; g.font = '14px sans-serif'; g.textBaseline = 'top';
    g.fillText(String(live.miss), 8, 4);
  }
  function bootRelay(live){
    const pair = duo();
    live.pair = pair; live.t = 0; live.prog = [0, 0]; live.stun = [0, 0]; live.hop = [0, 0];
    live.blocks = [[22, 48, 74], [30, 56, 82]];
    live.step = dt => {
      live.t += dt;
      [0, 1].forEach(i => {
        const p = i === 0 ? pair.a : pair.b;
        if (live.stun[i] > 0) { live.stun[i] -= dt; return; }
        if (live.hop[i] > 0) live.hop[i] -= dt;
        const before = live.prog[i];
        live.prog[i] = Math.min(100, before + (28 + spdOf(p) * 0.12) * dt / 1000);
        if (live.hop[i] <= 0 && live.blocks[i].some(b => before < b && live.prog[i] >= b)) {
          live.stun[i] = 450; live.prog[i] = Math.max(0, live.prog[i] - 6); snd('miss');
        }
      });
      drawRelay(live);
      if (live.prog[0] >= 100 || live.prog[1] >= 100 || live.t >= 20000) {
        const tie = live.prog[0] === live.prog[1];
        const winner = tie ? -1 : (live.prog[0] > live.prog[1] ? 0 : 1);
        const names = [monName(pair.a), monName(pair.b)];
        const note = tie ? 'It is a tie. Both Walklings grin.' : names[winner] + ' reaches the flag first.';
        live.done({ quit: false, clear: true, score: Math.round(Math.max(live.prog[0], live.prog[1])), note });
        return false;
      }
      return true;
    };
    live.press = i => { if (live.stun[i] <= 0) { live.hop[i] = 280; snd('tap'); } };
    sideKeys(live);
  }
  function drawRelay(live){
    const g = g2(); if (!g) return;
    px(g, PAL.h, 0, 0, 176, 176);
    [0, 1].forEach(i => {
      const y = 28 + i * 78;
      px(g, PAL.n, 8, y, 160, 28);
      live.blocks[i].forEach(b => px(g, PAL.o, 8 + b * 1.5, y + 8, 10, 14));
      const x = 8 + live.prog[i] * 1.4;
      const lift = live.hop[i] > 0 ? -8 : 0;
      px(g, colOf(i === 0 ? live.pair.a : live.pair.b), x, y + 6 + lift, 14, 14);
    });
  }
  function bootSeek(live){
    const pair = duo();
    live.pair = pair; live.round = 0; live.pts = [0, 0]; live.phase = 'hide'; live.pos = 1; live.flash = null; live.picked = -1; live.hintT = 0;
    const petAt = i => i === 0 ? pair.a : pair.b;
    const hider = () => live.round === 0 ? 0 : 1;
    function startHide(){
      live.phase = 'hide'; live.flash = null; live.picked = -1;
      announce(monName(petAt(hider())) + ' hides the treat. Tap a bush.');
    }
    function beginShuffle(choice){
      live.pos = choice;
      const n = 2 + Math.min(3, Math.floor(spdOf(petAt(hider())) / 30));
      live.queue = [];
      for (let i = 0; i < n; i++) {
        let a = (Math.random() * 3) | 0, b = (Math.random() * 3) | 0;
        if (a === b) b = (b + 1) % 3;
        live.queue.push([a, b]);
      }
      live.cursor = 0; live.phase = 'shuffle'; live.wait = reduce() ? 0 : 280;
    }
    function startSeek(){
      live.phase = 'seek'; live.flash = null;
      const p = petAt(1 - hider());
      live.hintT = (p.happy || 0) >= 50 ? 500 : 0;
      announce(monName(p) + ' sniffs. Tap a bush.');
    }
    function pick(i){
      if (live.phase === 'hide') { beginShuffle(i); snd('tap'); }
      else if (live.phase === 'seek') {
        const seeker = 1 - hider();
        if (i === live.pos) live.pts[seeker]++;
        snd(i === live.pos ? 'tap' : 'miss');
        live.picked = i; live.phase = 'reveal'; live.wait = 700;
      }
    }
    live.step = dt => {
      if (live.phase === 'shuffle') {
        live.wait -= dt;
        let guard = 0;
        while (live.wait <= 0 && live.phase === 'shuffle' && guard++ < 8) {
          if (live.cursor < live.queue.length) {
            const [a, b] = live.queue[live.cursor++];
            if (live.pos === a) live.pos = b; else if (live.pos === b) live.pos = a;
            live.flash = [a, b];
            live.wait = reduce() ? 0 : 280;
          } else startSeek();
        }
      } else if (live.phase === 'seek' && live.hintT > 0) live.hintT -= dt;
      else if (live.phase === 'reveal') {
        live.wait -= dt;
        if (live.wait <= 0) {
          live.round++;
          if (live.round >= 2) {
            const names = [monName(pair.a), monName(pair.b)];
            live.done({ quit: false, clear: true, score: Math.max(live.pts[0], live.pts[1]), note: names[0] + ' ' + live.pts[0] + ', ' + names[1] + ' ' + live.pts[1] + '.' });
            return false;
          }
          startHide();
        }
      }
      drawSeek(live);
      return true;
    };
    live.pointer = (p, kind) => { if (kind === 'down') pick(p.x < 58 ? 0 : p.x < 117 ? 1 : 2); };
    live.onKey = (k, repeat) => { if (!repeat && k >= '1' && k <= '3') pick(+k - 1); };
    startHide();
  }
  function drawSeek(live){
    const g = g2(); if (!g) return;
    px(g, PAL.k, 0, 0, 176, 176);
    for (let i = 0; i < 3; i++) {
      const x = 18 + i * 52;
      const hot = live.flash && live.flash.includes(i);
      const hint = live.phase === 'seek' && live.hintT > 0 && i === live.pos;
      px(g, hot || hint ? PAL.y : PAL.g, x, 70, 40, 28);
      px(g, PAL.t, x + 8, 78, 24, 12);
      if ((live.phase === 'reveal' || live.phase === 'hide') && live.pos === i && live.phase === 'reveal') {
        px(g, PAL.o, x + 14, 96, 12, 8);
      }
    }
    g.fillStyle = PAL.w; g.font = '14px sans-serif'; g.textBaseline = 'top';
    g.fillText(live.pts[0] + ' - ' + live.pts[1], 8, 8);
  }
  function press(i){ if (active && active.press) active.press(i); }
  function keyDown(e) {
    if (!active) return false;
    if (e.key === 'Escape') { stop(); return true; }
    if (active.onKey) active.onKey(e.key, e.repeat);
    return true;
  }
  function keyUp(e) {
    if (!active) return false;
    if (active.onUp) active.onUp(e.key);
    return true;
  }

  root.PPMinigames = { IDS, RULE, CLEAR, FAIL, finish, play, stop, press, keyDown, keyUp, devCheck, bind, clock: () => (active && active.t) || 0 };
})(typeof window !== 'undefined' ? window : globalThis);
