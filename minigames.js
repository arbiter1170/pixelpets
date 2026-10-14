/* High Charity Event Hall. Five short games. No growth XP, no battle XP.
   Bond: +1 on a clear, at most 3 per local day, partner only (addBond already enforces that).
   Each booth can be finished 3 times a day. Quitting does not spend a try.
   The play step in game.js owns the overlay; finish() pays the reward. */
(function (root) {
  'use strict';
  const IDS = ['lantern', 'shells', 'chirp', 'dash', 'pairs'];
  const RULE = {
    lantern: 'Lanterns fall in three lanes. Catch 12. Arrows move, or tap a lane.',
    shells: 'Three shells. Watch the treat, then tap where it hid. Get 2 of 3.',
    chirp: 'Listen to the chirp, then tap the same beats. Get 2 of 3.',
    dash: 'Steer for a little bit. Collect 8 acorns. Puddles only make you slip.',
    pairs: 'Flip the cards. Match Ember, Tide, and Bloom in 8 flips.',
  };
  const CLEAR = {
    lantern: 'The lanterns bob. {pet} glows.',
    shells: 'You found the treat. {pet} does a tiny hop.',
    chirp: '{pet} sings the last beat with you.',
    dash: '{pet} shakes off a puddle and keeps the shiny ones.',
    pairs: 'Three pairs, all kindled. {pet} looks proud.',
  };
  const FAIL = {
    lantern: 'The lanterns drift off. {pet} yawns, still glad you tried.',
    shells: 'The shells settle. {pet} pats the empty one and giggles.',
    chirp: 'Almost. {pet} hums the last note for you.',
    dash: '{pet} sits in the sun to dry. The puddles win today.',
    pairs: 'The cards yawn and close. {pet} pats your hand.',
  };
  const FIRST = {
    lantern: ['hearty_snack', 1],
    shells: ['befriend_treat', 2],
    dash: ['acorns', 80],
    pairs: ['joy_crumb', 2],
  };
  const REPLAY = {
    lantern: ['heal_snack', 1],
    shells: ['befriend_treat', 1],
    chirp: ['energy_sip', 1],
    dash: ['acorns', 25],
    pairs: ['joy_crumb', 1],
  };
  const CLEAR_FLAG = {
    lantern: 'story.hc_clear_lantern',
    shells: 'story.hc_clear_shells',
    chirp: 'story.hc_clear_chirp',
    dash: 'story.hc_clear_dash',
    pairs: 'story.hc_clear_pairs',
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
    lines.push([who, CLEAR[id]]);
    const flag = CLEAR_FLAG[id];
    const first = !S.flags[flag];
    if (first) {
      S.flags[flag] = true;
      S.flags['story.hc_games'] = Math.min(5, (Number(S.flags['story.hc_games']) || 0) + 1);
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
      if (!RULE[id] || !CLEAR[id] || !FAIL[id] || !CLEAR_FLAG[id]) bad.push('missing copy ' + id);
    });
    if (FIRST.chirp) bad.push('chirp first prize is the Wake Tonic, not FIRST');
    return bad;
  }

  function hide() {
    const ov = document.getElementById('ovPlay');
    if (ov) ov.hidden = true;
    const c = canvas();
    if (c) { c.onpointerdown = c.onpointermove = c.onpointerup = null; }
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
      if (title) title.textContent = ({ lantern: 'Lantern Catch', shells: 'Treat Shells', chirp: 'Chirp Echo', dash: 'Plaza Dash', pairs: 'Kindled Pairs' })[id];
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

  root.PPMinigames = { IDS, RULE, CLEAR, FAIL, finish, play, stop, keyDown, keyUp, devCheck, bind };
})(typeof window !== 'undefined' ? window : globalThis);
