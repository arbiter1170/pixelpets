/* Walklings sound: tiny chiptune SFX synthesized with WebAudio (square / triangle / noise). No audio files.
   - The AudioContext is created/resumed only inside a user gesture (iOS + Chrome autoplay rules).
   - Mute is remembered in localStorage `pixelpets.mute` ('1' = muted). Muted = no audio nodes at all.
   - If WebAudio is missing or fails, every call is a silent no-op.
   - Stingers (stinger_seal/item/befriend/levelup/evolve) queue instead of stacking; see the player below. */
'use strict';
const PPSound = (() => {
  const MUTE_KEY = 'pixelpets.mute';
  const MASTER = 0.2;                                  // low default volume
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null, out = null, noiseBuf = null, muted = false, resumeAt = -1e9;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch(e) {}
  const played = [];                                   // recent sound names (debug/tests)

  function ensure(){                                   // only ever called from a user gesture
    if (!AC) return null;
    try {
      if (!ac) {
        ac = new AC();
        out = ac.createGain(); out.gain.value = muted ? 0 : MASTER; out.connect(ac.destination);
        const n = Math.floor(ac.sampleRate * 0.4); noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended' || ac.state === 'interrupted') { resumeAt = performance.now(); const r = ac.resume(); if (r && r.catch) r.catch(() => {}); }
    } catch(e) { ac = null; }
    return ac;
  }
  /* iPhone Safari (Vincent's playtest: no sound). WebAudio on iOS plays in the "ambient" session, which the ring/silent switch mutes,
     and an AudioContext only really starts after something sounds inside a gesture. So, inside the unlocking gesture:
     1. navigator.audioSession.type = 'playback' (Safari 16.4+/iOS 17): sound plays with the silent switch on, like a video would;
     2. older iOS (no audioSession): start a looping, silent <audio> (a 0.5 s 8 kHz WAV built here), which moves the page into the same playback session;
     3. play a one-sample silent buffer through the context (the classic iOS warm-up) and resume() it.
     Muting drops back to 'ambient' and pauses the silent loop, so a muted game never holds the session (or pauses other apps' audio).
     Leaving the page pauses the loop; the next gesture brings it back. All of it is best-effort and silent on failure. */
  let keep = null, warmed = false;
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  function silentWav(){                                // 0.5 s of 8-bit silence, mono 8 kHz
    const n = 4000, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
    b.fill(128, 44); let bin = ''; for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
    return 'data:audio/wav;base64,' + btoa(bin);
  }
  function session(on){
    try { if (navigator.audioSession) navigator.audioSession.type = on ? 'playback' : 'ambient'; } catch(e) {}
    if (navigator.audioSession || !IOS) return;       // the API covers it; other browsers have no silent switch to beat
    try {
      if (on) {
        if (!keep) { keep = document.createElement('audio'); keep.src = silentWav(); keep.loop = true; keep.preload = 'auto';
                     keep.setAttribute('playsinline', ''); keep.setAttribute('x-webkit-airplay', 'deny'); keep.volume = 0; }
        if (keep.paused && !document.hidden) { const r = keep.play(); if (r && r.catch) r.catch(() => {}); }
      } else if (keep && !keep.paused) keep.pause();
    } catch(e) {}
  }
  function warm(){
    if (warmed || !ac) return;
    try { const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, ac.sampleRate); s.connect(ac.destination); s.start(0); warmed = true; } catch(e) {}
  }
  // First gesture unlocks audio; kept on so iOS can resume after an interruption (phone call, lock screen, another app's audio).
  // pointerdown/touchstart are not "activation" on iOS, so touchend/click/keydown do the real unlock; pointerdown is a harmless early try.
  const unlock = () => { if (muted) return; session(true); if (ensure()) warm(); };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (keep && !keep.paused) try { keep.pause(); } catch(e) {} }
    else if (ac && !muted && ac.state !== 'running') { try { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); } catch(e) {} }
  });

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);   // MIDI note -> Hz (72 = C5)
  function tone(m, at, dur, type, vol, slideTo, dest){
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(typeof m === 'number' && m < 128 ? hz(m) : m.hz, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(dest || out); o.start(at); o.stop(at + dur + 0.03);
    return o;
  }
  const f = v => ({ hz: v });                          // raw frequency instead of a note
  function noise(at, dur, vol, freq, type, dest){
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; fl.type = type || 'lowpass'; fl.frequency.value = freq || 2000;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || out); s.start(at); s.stop(at + dur + 0.03);
    return s;
  }
  const seq = (t, notes, step, dur, type, vol) => notes.forEach((m, i) => { if (m) tone(m, t + i * step, dur, type, vol); });

  // Square waves sound louder than triangles at the same level, so they run at ~1/3 the volume. Everything is under ~0.8 s except the evolution build-up.
  const SFX = {
    tap:      t => tone(84, t, 0.04, 'square', 0.15),
    feed:     t => { tone(f(620), t, 0.08, 'triangle', 0.5, 330); tone(f(660), t + 0.13, 0.08, 'triangle', 0.5, 350); tone(91, t + 0.3, 0.07, 'square', 0.12); },
    play:     t => seq(t, [72, 76, 79, 84], 0.06, 0.09, 'triangle', 0.45),
    rest:     t => seq(t, [79, 76, 72], 0.17, 0.24, 'triangle', 0.3),
    denied:   t => { tone(57, t, 0.07, 'square', 0.15); tone(54, t + 0.09, 0.1, 'square', 0.15); },
    step:     t => noise(t, 0.04, 0.3, 800),
    notice:   t => { tone(88, t, 0.05, 'square', 0.14); tone(93, t + 0.06, 0.07, 'square', 0.14); },
    encounter:t => { seq(t, [76, 79, 83, 88], 0.055, 0.07, 'square', 0.14); tone(52, t, 0.25, 'triangle', 0.5); tone(59, t + 0.25, 0.18, 'triangle', 0.45); },
    befriend: t => { seq(t, [72, 76, 79], 0.09, 0.1, 'square', 0.13); tone(84, t + 0.27, 0.35, 'square', 0.13);
                     seq(t, [48, 55], 0.14, 0.14, 'triangle', 0.5); tone(60, t + 0.27, 0.35, 'triangle', 0.5); },
    miss:     t => { tone(f(520), t, 0.13, 'triangle', 0.45, 240); noise(t, 0.05, 0.08, 1200); },
    flee:     t => { noise(t, 0.3, 0.12, 2400, 'highpass'); seq(t + 0.05, [76, 72, 67], 0.08, 0.1, 'triangle', 0.35); },
    evoBuild: t => {                                   // speeds up like the flashing sprite (~3.2 s)
      for (let e = 0, i = 0; e < 3100; e += Math.max(50, 420 - e / 8), i++)
        tone(60 + Math.round(e / 3200 * 24) + (i % 2 ? 7 : 0), t + e / 1000, 0.07, 'square', 0.12);
    },
    evoFanfare: t => { seq(t, [72, 76, 79, 84, 79], 0.1, 0.11, 'square', 0.13); tone(84, t + 0.5, 0.6, 'square', 0.13);
                       seq(t, [48, 52, 55, 60], 0.12, 0.13, 'triangle', 0.5); tone(48, t + 0.5, 0.6, 'triangle', 0.5); },
    levelup:  t => { tone(84, t, 0.08, 'triangle', 0.45); tone(91, t + 0.08, 0.22, 'triangle', 0.45); },
    cap:      t => seq(t, [88, 83, 88], 0.09, 0.2, 'triangle', 0.3),
    // BATTLE §8
    hit:      t => { noise(t, 0.08, 0.35, 1400); tone(f(180), t, 0.08, 'square', 0.12, 90); },
    hitStrong:t => { noise(t, 0.14, 0.45, 2200); tone(f(220), t, 0.14, 'square', 0.14, 70); tone(f(110), t + 0.05, 0.12, 'triangle', 0.5, 55); },
    hitWeak:  t => { noise(t, 0.05, 0.18, 700); tone(f(150), t, 0.05, 'triangle', 0.35, 110); },
    statUp:   t => seq(t, [67, 71, 74, 79], 0.05, 0.07, 'triangle', 0.4),
    statDown: t => seq(t, [79, 74, 71, 67], 0.05, 0.07, 'triangle', 0.4),
    heal:     t => { tone(f(500), t, 0.18, 'triangle', 0.4, 900); tone(84, t + 0.18, 0.12, 'triangle', 0.3); },
    tired:    t => { tone(f(440), t, 0.35, 'triangle', 0.45, 140); noise(t + 0.2, 0.15, 0.08, 600); },
    win:      t => { seq(t, [72, 76, 79, 84], 0.09, 0.1, 'square', 0.12); tone(88, t + 0.36, 0.3, 'square', 0.12); seq(t, [48, 55, 60], 0.12, 0.12, 'triangle', 0.45); },
    learn:    t => seq(t, [76, 81, 86], 0.08, 0.1, 'triangle', 0.3),          // quieter than levelup
  };

  /* Stingers (design STINGERS v0.1): short original jingles played by the same tone()/noise() voices. Data block pasted from the spec. */
  // Row: [startMs, note, durMs, wave, gain, slideToHz?]  note = MIDI (72 = C5) for square/triangle; for 'noise' it is the highpass cutoff in Hz (noise rows <= 400 ms: the noise buffer is 0.4 s).
  // Gains follow sfx.js: square ~0.12-0.13 (lead), 0.06-0.07 (harmony); triangle ~0.3-0.5 (bass/soft lead); noise <= 0.1 (sparkle).
  const STINGERS = {
    seal: [                                        // ~2.3 s  Trial Hall win: I - IV - V - I, ends on a held C6 + sparkle
      [0, 72, 110, 'square', 0.13], [110, 76, 110, 'square', 0.13], [220, 79, 110, 'square', 0.13], [330, 84, 250, 'square', 0.13],
      [600, 81, 130, 'square', 0.13], [740, 77, 130, 'square', 0.13], [880, 81, 130, 'square', 0.13], [1020, 84, 200, 'square', 0.13],
      [1240, 83, 110, 'square', 0.13], [1360, 86, 110, 'square', 0.13], [1480, 84, 800, 'square', 0.13],
      [1480, 76, 800, 'square', 0.06],                                                     // harmony: E5 under the last C6
      [0, 48, 300, 'triangle', 0.5], [330, 43, 250, 'triangle', 0.45], [600, 41, 260, 'triangle', 0.5], [880, 45, 330, 'triangle', 0.45],
      [1240, 43, 230, 'triangle', 0.45], [1480, 48, 800, 'triangle', 0.5],
      [1480, 5000, 400, 'noise', 0.1],                                                     // cymbal-ish sparkle
    ],
    item: [                                        // ~0.9 s  "found it!": quick climb, bright landing on E6
      [0, 79, 90, 'square', 0.12], [90, 84, 90, 'square', 0.12], [180, 83, 90, 'square', 0.12], [270, 86, 90, 'square', 0.12],
      [360, 88, 500, 'square', 0.12],
      [360, 84, 500, 'triangle', 0.3],                                                     // harmony: C6 under E6
      [0, 60, 170, 'triangle', 0.45], [180, 55, 170, 'triangle', 0.45], [360, 60, 500, 'triangle', 0.45],
      [360, 6000, 160, 'noise', 0.08],
    ],
    befriend: [                                    // ~1.3 s  warm: rise, a little sigh (F-E), home on C6
      [0, 76, 120, 'square', 0.12], [120, 79, 120, 'square', 0.12], [240, 81, 230, 'square', 0.12],
      [480, 77, 120, 'square', 0.12], [600, 76, 120, 'square', 0.12], [720, 84, 560, 'square', 0.12],
      [720, 76, 560, 'square', 0.06],                                                      // harmony: E5 under C6
      [0, 48, 230, 'triangle', 0.5], [240, 41, 230, 'triangle', 0.5], [480, 43, 230, 'triangle', 0.45], [720, 48, 560, 'triangle', 0.5],
    ],
    levelup: [                                     // ~0.75 s  whoop + G-major run up to G6 (keeps today's G6 triangle ending)
      [0, 67, 90, 'triangle', 0.3, 784],                                                   // slide G4 -> G5
      [90, 79, 60, 'square', 0.12], [150, 81, 60, 'square', 0.12], [210, 83, 60, 'square', 0.12], [270, 86, 60, 'square', 0.12],
      [330, 91, 400, 'triangle', 0.45],
      [330, 86, 400, 'square', 0.06],                                                      // harmony: D6 under G6
      [90, 55, 220, 'triangle', 0.45], [330, 55, 400, 'triangle', 0.45],
    ],
    evolve: [                                      // ~2.0 s  after evoBuild: vi - IV - V - I, minor lifting to major
      [0, 69, 120, 'square', 0.13], [120, 72, 120, 'square', 0.13], [240, 76, 220, 'square', 0.13],
      [480, 77, 120, 'square', 0.13], [600, 81, 120, 'square', 0.13], [720, 84, 220, 'square', 0.13],
      [960, 83, 110, 'square', 0.13], [1080, 86, 110, 'square', 0.13], [1200, 88, 800, 'square', 0.13],
      [1200, 84, 800, 'square', 0.06],                                                     // harmony: C6 under E6
      [0, 45, 450, 'triangle', 0.5], [480, 41, 450, 'triangle', 0.5], [960, 43, 230, 'triangle', 0.45], [1200, 48, 800, 'triangle', 0.5],
      [1200, 5000, 400, 'noise', 0.1],
    ],
  };

  // Player (STINGERS §5-§6): a different stinger queues behind the one sounding (80 ms gap), at most one playing + one queued;
  // the same stinger within 250 ms is one jingle, later it restarts; muting cancels everything; `step` is skipped under a stinger.
  const ST_GAP = 0.08, ST_SAME = 0.25, ST_MAX = 2;   // s gap between queued stingers; same-id repeat window; playing + queued
  let live = [];                                     // [{ id, bus, nodes, t0, end }] scheduled or sounding, in start order
  const stLen = id => (Math.max(...STINGERS[id].map(r => r[0] + r[2])) + 30) / 1000;
  function stCancel(s, now){                         // fast fade + stop; never clicks
    try { s.bus.gain.setTargetAtTime(0, now, 0.005); s.nodes.forEach(n => { try { n.stop(now + 0.03); } catch(e) {} }); } catch(e) {}
  }
  function stinger(id, delay){
    const now = ac.currentTime, at = now + 0.01 + (delay || 0);
    live = live.filter(s => s.end > now);
    const same = live.find(s => s.id === id);
    if (same && Math.abs(at - same.t0) < ST_SAME) return true;            // same moment (e.g. two `give` steps): one jingle
    if (same) { stCancel(same, now); live = live.filter(s => s !== same); } // retrigger cancels the previous instance
    if (live.length >= ST_MAX) return false;                               // one playing + one queued is enough: drop
    const t0 = Math.max(at, ...live.map(s => s.end + ST_GAP));             // queue behind whatever is still sounding
    const bus = ac.createGain(); bus.connect(out);
    const nodes = STINGERS[id].map(([ms, n, d, w, v, sl]) => w === 'noise'
      ? noise(t0 + ms / 1000, d / 1000, v, n, 'highpass', bus)
      : tone(n, t0 + ms / 1000, d / 1000, w, v, sl, bus));
    live.push({ id, bus, nodes, t0, end: t0 + stLen(id) });
    return true;
  }
  const stSounding = () => !!ac && live.some(s => s.t0 <= ac.currentTime && ac.currentTime < s.end);

  function play(name, delay){
    const sid = /^stinger_/.test(name) && STINGERS[name.slice(8)] ? name.slice(8) : null;
    if (muted || (!SFX[name] && !sid)) return false;
    played.push(name); if (played.length > 50) played.shift();
    if (!ac || ac.state === 'closed') return false;     // not unlocked by a gesture yet: stay silent
    // iOS: resume() resolves a beat after the tap, so the tap's own sound used to be dropped while still 'suspended'/'interrupted'.
    // Within 1 s of a gesture's resume() it is scheduled anyway: queued nodes start once the context runs (or never, if it doesn't).
    if (ac.state !== 'running' && performance.now() - resumeAt > 1000) return false;   // not resuming from a gesture: stay silent
    if (sid) { try { return stinger(sid, delay); } catch(e) { return false; } }
    if (name === 'step' && stSounding()) return false;
    try { SFX[name](ac.currentTime + 0.01 + (delay || 0)); return true; } catch(e) { return false; }
  }
  function setMuted(m){
    muted = !!m;
    if (muted) { if (ac) live.forEach(s => stCancel(s, ac.currentTime)); live = []; }
    try { if (muted) localStorage.setItem(MUTE_KEY, '1'); else localStorage.removeItem(MUTE_KEY); } catch(e) {}
    if (out && ac) { try { out.gain.setTargetAtTime(muted ? 0 : MASTER, ac.currentTime, 0.01); } catch(e) {} }
    session(!muted);                                   // muted: back to 'ambient', silent loop paused
    if (!muted && ensure()) warm();                    // toggling is itself a gesture: unlock now
    return muted;
  }
  return { play, setMuted, toggle: () => setMuted(!muted), get muted(){ return muted; }, get available(){ return !!AC; },
    get state(){ return ac ? ac.state : 'none'; }, get session(){ return { type: navigator.audioSession ? navigator.audioSession.type : null, loop: keep ? (keep.paused ? 'paused' : 'playing') : 'none', warmed }; }, get played(){ return played.slice(); },
    names: Object.keys(SFX).concat(Object.keys(STINGERS).map(k => 'stinger_' + k)), get stingers(){ return live.map(s => s.id); } };
})();
