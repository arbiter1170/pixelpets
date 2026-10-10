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
     Leaving the page pauses the loop; the next gesture brings it back. All of it is best-effort and silent on failure.
     ** Steps 1-2 are OFF: playing through the silent switch is an open red decision (MUSIC Q1, Vincent). With the flag false the game
     obeys the ring/silent switch and stays in 'ambient' (mixes with other apps' audio, never pauses them); step 3 (the warm-up) and
     the first-tap sound fix below stay on. Flip IOS_PLAY_THROUGH_SILENT to true once Q1 says so. */
  const IOS_PLAY_THROUGH_SILENT = false;
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
    if (!IOS_PLAY_THROUGH_SILENT) { try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch(e) {} return; }
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
  let stateHooked = false;
  const unlock = () => { if (muted) return; session(true); if (ensure()) { warm();
    if (!stateHooked) { stateHooked = true; try { ac.addEventListener('statechange', () => startWanted(400)); } catch(e) {} }
    startWanted(400); } };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (keep && !keep.paused) try { keep.pause(); } catch(e) {} pauseMusic(); }   // no music nodes while hidden
    else if (ac && !muted && ac.state !== 'running') { try { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); } catch(e) {} }
    else resumeMusic();                                // running already: same loop from bar 1, 400 ms fade-in
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
  // CARE_LOOP Q11 default: one chirp per type, pitch-shifted (hello, pats). Short and soft; two rising blips.
  const CHIRP_BASE = { ember: 79, tide: 74, bloom: 81, stone: 67, volt: 84, frost: 86, gust: 83, shade: 70, plain: 76 };
  for (const [k, m] of Object.entries(CHIRP_BASE)) SFX['chirp_' + k] = t => { tone(m, t, 0.06, 'triangle', 0.35, 440 * Math.pow(2, (m + 4 - 69) / 12)); tone(m + 7, t + 0.07, 0.07, 'triangle', 0.3); };

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
    try { duck(); } catch(e) {}
    return true;
  }
  const stSounding = () => !!ac && live.some(s => s.t0 <= ac.currentTime && ac.currentTime < s.end);

  /* ---------- MUSIC v0.1 (design/specs/MUSIC.md, 5b96fa9): three original loops played by tone()/noise(), no audio files ----------
     Data literal copied verbatim from MUSIC.md §3. A look-ahead scheduler (one 100 ms timer while a loop plays) books each step on
     AudioContext time, so the beat never drifts and nodes never pile up. Chain: voice -> track bus (crossfades) -> musicBus
     (MUSIC_VOL, ducked under stingers) -> out (MASTER). Nothing is created before the first tap; Sound OFF, Music OFF or a hidden
     page = no music nodes at all. Q1 (decided): the silent switch is respected (session stays 'ambient', see above). */
  const KIT = {                      // noise() percussion: [filterType, freqHz, durMs, gain]; k also gets a tone() thump
    k: ['lowpass', 260, 90, 0.30],   //   + tone({hz:120}, at, 0.08, 'triangle', 0.35, 45): a soft kick
    s: ['highpass', 1500, 110, 0.10],
    h: ['highpass', 6500, 30, 0.04],
  };
  const MUSIC = {
    town: { key: 'F major', bpm: 96, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.55,
      lead: { wave: 'triangle', gain: 0.22, notes: [
        [69,2],[72,1],[77,1],[76,2],[72,2],          // F    A C F E C
        [74,3],[77,1],[81,2],[77,2],                 // Dm   D F A F
        [74,2],[70,1],[72,1],[74,2],[77,2],          // Bb   D Bb C D F
        [76,3],[74,1],[72,4],                        // C    E D C
        [69,1],[72,1],[77,2],[79,1],[77,1],[76,2],   // F    A C F G F E
        [76,2],[72,2],[69,2],[72,2],                 // Am   E C A C
        [74,2],[77,2],[76,1],[74,1],[76,2],          // Bb C D F E D E
        [77,6],[74,1],[72,1] ] },                    // F    F, D C pickup back to bar 1
      bass: { wave: 'triangle', gain: 0.28, notes: [
        [41,2],[48,2],[45,2],[48,2],  [38,2],[45,2],[41,2],[45,2],
        [46,2],[53,2],[50,2],[53,2],  [48,2],[55,2],[52,2],[55,2],
        [41,2],[48,2],[45,2],[48,2],  [45,2],[52,2],[48,2],[52,2],
        [46,2],[53,2],[48,2],[55,2],  [41,4],[48,2],[41,2] ] },
      drums: ['k.h.s.h.','k.h.s.h.','k.h.s.h.','k.h.s.hh','k.h.s.h.','k.h.s.h.','k.h.s.h.','k.h.s.ss'] },

    route: { key: 'G major', bpm: 112, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.75,
      lead: { wave: 'square', gain: 0.055, notes: [
        [67,1],[71,1],[74,2],[71,1],[74,1],[79,2],   // G    G B D B D G
        [76,2],[72,1],[76,1],[79,3],[76,1],          // C    E C E G E
        [74,1],[71,1],[67,2],[69,1],[71,1],[74,2],   // G    D B G A B D
        [69,1],[74,1],[78,2],[76,2],[74,2],          // D    A D F# E D
        [79,2],[76,1],[71,1],[76,2],[79,2],          // Em   G E B E G
        [79,1],[76,1],[72,2],[76,1],[79,1],[81,2],   // C    G E C E G A
        [78,2],[76,1],[74,1],[69,2],[78,2],          // D    F# E D A F#
        [79,4],[74,2],[0,2] ] },                     // G    G D (breath)
      bass: { wave: 'triangle', gain: 0.30, notes: [
        [43,2],[55,2],[50,2],[55,2],  [48,2],[60,2],[55,2],[60,2],
        [43,2],[55,2],[50,2],[55,2],  [50,2],[62,2],[57,2],[62,2],
        [40,2],[52,2],[47,2],[52,2],  [48,2],[60,2],[55,2],[60,2],
        [50,2],[62,2],[57,2],[62,2],  [43,2],[50,2],[43,4] ] },
      drums: ['k.hks.h.','k.hks.h.','k.hks.h.','k.hks.h.','k.hks.h.','k.hks.h.','k.hks.h.','k.hks.ss'] },

    battle: { key: 'A minor', bpm: 140, bars: 8, stepsPerBar: 16, gate: 0.9, perc: 1.0,
      lead: { wave: 'square', gain: 0.06, notes: [
        [69,2],[72,2],[76,2],[81,4],[79,2],[76,2],[72,2],          // Am  A C E A G E C
        [77,4],[76,2],[74,2],[72,4],[69,4],                        // F   F E D C A
        [71,2],[74,2],[79,4],[77,2],[76,2],[74,4],                 // G   B D G F E D
        [76,6],[0,2],[69,2],[71,2],[72,2],[74,2],                  // Am  E . A B C D
        [76,2],[76,2],[81,2],[76,2],[79,2],[77,2],[76,2],[72,2],   // Am  E E A E G F E C
        [74,2],[77,2],[81,4],[79,2],[77,2],[76,2],[74,2],          // F   D F A G F E D
        [71,2],[74,2],[79,2],[83,2],[81,4],[79,4],                 // G   B D G B A G
        [80,4],[76,2],[71,2],[68,2],[71,2],[74,2],[80,2] ] },      // E7  G# E B G# B D G#
      bass: { wave: 'triangle', gain: 0.32, notes: [
        [45,2],[57,2],[45,2],[57,2],[45,2],[57,2],[45,2],[57,2],   // A
        [41,2],[53,2],[41,2],[53,2],[41,2],[53,2],[41,2],[53,2],   // F
        [43,2],[55,2],[43,2],[55,2],[43,2],[55,2],[43,2],[55,2],   // G
        [45,2],[57,2],[45,2],[57,2],[45,2],[57,2],[45,2],[57,2],   // A
        [45,2],[57,2],[45,2],[57,2],[45,2],[57,2],[45,2],[57,2],   // A
        [41,2],[53,2],[41,2],[53,2],[41,2],[53,2],[41,2],[53,2],   // F
        [43,2],[55,2],[43,2],[55,2],[43,2],[55,2],[43,2],[55,2],   // G
        [40,2],[52,2],[40,2],[52,2],[40,2],[52,2],[44,2],[47,2] ] },// E  ... G# B lead-in
      drums: ['k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.k.hks.hh',
              'k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.s.s.ssss'] },
  };
  // MUSIC Q5 (open, Design default = false): Trial Hall battles use the same `battle` loop. true = a Hall variant from the same
  // data, +8 bpm and up a whole tone.
  const HALL_BATTLE_VARIANT = false;
  MUSIC.battle_hall = Object.assign({}, MUSIC.battle, { key: 'B minor', bpm: MUSIC.battle.bpm + 8,
    lead: { ...MUSIC.battle.lead, notes: MUSIC.battle.lead.notes.map(([n, k]) => [n ? n + 2 : 0, k]) },
    bass: { ...MUSIC.battle.bass, notes: MUSIC.battle.bass.notes.map(([n, k]) => [n ? n + 2 : 0, k]) } });
  const DUCK = 0.35;                                   // stingers duck the music bus to 35 % (STINGERS §6)
  let musicOn = true, musicVol = 0.5, musicBus = null, want = null, wantGain = 1, trk = null, pend = null, mPaused = false;
  let mNodes = 0, mTicks = 0, mTickMs = 0, mTickSum = 0, mStarts = 0;            // debug counters (tests: no leak, cost per tick)
  const flatCache = {};
  function flat(id){                                   // [step, voice, note, steps], sorted by step
    if (flatCache[id]) return flatCache[id];
    const t = MUSIC[id], ev = [];
    for (const v of ['lead', 'bass']) { let st = 0; for (const [n, k] of t[v].notes) { if (n) ev.push([st, v, n, k]); st += k; } }
    t.drums.forEach((bar, b) => [...bar].forEach((c, i) => { if (c !== '.') ev.push([b * t.stepsPerBar + i, 'd', c, 1]); }));
    ev.sort((a, b) => a[0] - b[0]);
    const byStep = []; for (const e of ev) (byStep[e[0]] = byStep[e[0]] || []).push(e);
    return (flatCache[id] = byStep);
  }
  const canMusic = () => musicOn && !muted && !document.hidden && !!ac && ac.state === 'running';
  function bus(){ if (!musicBus) { musicBus = ac.createGain(); musicBus.gain.value = musicVol; musicBus.connect(out); } return musicBus; }
  function startTrack(id, fadeIn){
    const t = MUSIC[id]; if (!t) return;
    const g = ac.createGain(), now = ac.currentTime; g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, now);
    g.gain.setTargetAtTime(wantGain, now, Math.max(0.005, fadeIn / 3000)); g.connect(bus());
    trk = { id, g, t, ev: flat(id), n: t.bars * t.stepsPerBar, stepSec: 60 / t.bpm * 4 / t.stepsPerBar, nextAt: now + 0.06, step: 0, timer: 0 };
    trk.timer = setInterval(tick, 100); tick(); mStarts++;
  }
  function tick(){
    if (!trk || !ac) return;
    const c0 = performance.now(), T = trk, now = ac.currentTime;
    if (T.nextAt < now - 0.05) {                       // woke late (stall / throttled timer): jump to the next bar line, no burst
      const per = T.t.stepsPerBar, lost = Math.ceil((now - T.nextAt) / T.stepSec);
      T.step = (Math.ceil((T.step + lost) / per) * per) % T.n; T.nextAt = now + 0.05;
    }
    while (T.nextAt < now + 0.3) {
      for (const [, v, n, k] of (T.ev[T.step] || [])) {
        try {
          if (v === 'd') {
            const [ft, fq, ms, gn] = KIT[n]; noise(T.nextAt, ms / 1000, gn * T.t.perc, fq, ft, T.g); mNodes++;
            if (n === 'k') { tone(f(120), T.nextAt, 0.08, 'triangle', 0.35 * T.t.perc, 45, T.g); mNodes++; }
          } else { const vo = T.t[v]; tone(n, T.nextAt, k * T.stepSec * T.t.gate, vo.wave, vo.gain, null, T.g); mNodes++; }
        } catch(e) {}
      }
      T.step = (T.step + 1) % T.n; T.nextAt += T.stepSec;
    }
    const dt = performance.now() - c0; mTicks++; mTickSum += dt; mTickMs = Math.max(mTickMs, dt);
  }
  function stopTrack(fadeOut){
    if (!trk) return; const T = trk; trk = null; clearInterval(T.timer);
    try { T.g.gain.cancelScheduledValues(ac.currentTime); T.g.gain.setTargetAtTime(0, ac.currentTime, Math.max(0.005, fadeOut / 3000)); } catch(e) {}
    setTimeout(() => { try { T.g.disconnect(); } catch(e) {} }, fadeOut + 400);   // booked notes (<= 0.3 s ahead) die under the fade
  }
  function startWanted(fadeIn = 400){
    if (pend || !want || !canMusic()) return;
    if (trk && trk.id === want) return;
    if (trk) stopTrack(400);
    mPaused = false; startTrack(want, fadeIn);
  }
  // music(id, o): the wanted loop. Same loop = keep playing (only its gain follows o.gain); different = fade out o.fadeOut ms
  // (default 400) and start the new one from bar 1 after o.delay s, or once no stinger sounds (o.afterStingers, at least o.delay),
  // fading in over o.fadeIn ms (default 400). A start already pending keeps its timing and just takes the new id.
  function music(id, o = {}){
    want = id || null; wantGain = o.gain != null ? o.gain : 1;
    if (pend) { pend.fadeIn = o.fadeIn != null ? o.fadeIn : pend.fadeIn; return true; }
    if (!want) { if (trk) stopTrack(o.fadeOut != null ? o.fadeOut : 400); return true; }
    if (!canMusic()) return false;                     // recorded; starts on the first tap / when allowed
    if (trk && trk.id === want) { try { trk.g.gain.setTargetAtTime(wantGain, ac.currentTime, 0.15); } catch(e) {} return true; }
    if (trk) stopTrack(o.fadeOut != null ? o.fadeOut : 400);
    const fadeIn = o.fadeIn != null ? o.fadeIn : 400, delay = o.delay || 0;
    if (!delay && !o.afterStingers) { startTrack(want, fadeIn); return true; }
    const t0 = performance.now();
    pend = { fadeIn, timer: setInterval(() => {
      if (performance.now() - t0 < delay * 1000 || (o.afterStingers && stSounding())) return;
      clearInterval(pend.timer); const fi = pend.fadeIn; pend = null;
      if (want && canMusic() && !(trk && trk.id === want)) { if (trk) stopTrack(300); startTrack(want, fi); }
    }, 50) };
    return true;
  }
  function stopAll(fade){ if (pend) { clearInterval(pend.timer); pend = null; } stopTrack(fade); }
  function setMusic(on, gesture){ musicOn = !!on; if (!musicOn) stopAll(80); else { if (gesture && !muted && ensure()) warm(); startWanted(400); } return musicOn; }   // gesture: the Settings tap may unlock audio; boot never does
  function pauseMusic(){ if (trk || pend) { mPaused = true; stopAll(30); } }
  function resumeMusic(){ startWanted(400); }
  function setMusicVol(v){ musicVol = Math.max(0, Math.min(1, +v || 0)); if (musicBus) try { musicBus.gain.setTargetAtTime(musicVol, ac.currentTime, 0.05); } catch(e) {} }
  function duck(){                                     // re-plan the duck around every stinger still booked (keeps it down between two)
    if (!musicBus || !live.length) return;
    const g = musicBus.gain, now = ac.currentTime; g.cancelScheduledValues(now); g.setTargetAtTime(g.value, now, 0.001);
    for (const st of live) g.setTargetAtTime(musicVol * DUCK, Math.max(now, st.t0), 0.013);
    g.setTargetAtTime(musicVol, Math.max(...live.map(st => st.end)), 0.1);
  }

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
    if (muted) { if (ac) live.forEach(s => stCancel(s, ac.currentTime)); live = []; stopAll(30); }
    try { if (muted) localStorage.setItem(MUTE_KEY, '1'); else localStorage.removeItem(MUTE_KEY); } catch(e) {}
    if (out && ac) { try { out.gain.setTargetAtTime(muted ? 0 : MASTER, ac.currentTime, 0.01); } catch(e) {} }
    session(!muted);                                   // muted: back to 'ambient', silent loop paused
    if (!muted && ensure()) { warm(); startWanted(400); }   // toggling is itself a gesture: unlock now (and bring the music back)
    return muted;
  }
  return { play, setMuted, toggle: () => setMuted(!muted), get muted(){ return muted; }, get available(){ return !!AC; },
    get state(){ return ac ? ac.state : 'none'; }, get session(){ return { playThroughSilent: IOS_PLAY_THROUGH_SILENT, type: navigator.audioSession ? navigator.audioSession.type : null, loop: keep ? (keep.paused ? 'paused' : 'playing') : 'none', warmed }; }, get played(){ return played.slice(); },
    music, setMusic, pauseMusic, resumeMusic, get musicOn(){ return musicOn; }, get musicVol(){ return musicVol; }, set musicVol(v){ setMusicVol(v); },
    get hallVariant(){ return HALL_BATTLE_VARIANT; }, musicData: MUSIC,
    get musicState(){ return { want, playing: trk ? trk.id : null, pending: !!pend, paused: mPaused, on: musicOn, step: trk ? trk.step : null,
      bus: musicBus ? musicBus.gain.value : null, trackGain: trk ? trk.g.gain.value : null, vol: musicVol, nodes: mNodes, starts: mStarts, ticks: mTicks, maxTickMs: mTickMs, meanTickMs: mTicks ? mTickSum / mTicks : 0,
      timer: !!(trk && trk.timer), stepSec: trk ? trk.stepSec : null }; },
    names: Object.keys(SFX).concat(Object.keys(STINGERS).map(k => 'stinger_' + k)), get stingers(){ return live.map(s => s.id); } };
})();
