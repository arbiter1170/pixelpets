/* Walklings sound: tiny chiptune SFX synthesized with WebAudio (square / triangle / noise). No audio files.
   - The AudioContext is created/resumed only inside a user gesture (iOS + Chrome autoplay rules).
   - Mute is remembered in localStorage `pixelpets.mute` ('1' = muted). Muted = no audio nodes at all.
   - If WebAudio is missing or fails, every call is a silent no-op.
   - Stingers (stinger_seal/item/befriend/levelup/evolve) queue instead of stacking; see the player below.
   - Background loops (town, route, battle, wild combat, Glimmerwell, and the eight SuperGrok loops) are original tunes played by the same voices. Music on/off is S.settings.music. */
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
     ** Steps 1-2 stay OFF. Vincent decided Fri Oct 9 (MUSIC Q1) that the game respects the iPhone silent switch:
     IOS_PLAY_THROUGH_SILENT stays false, the session stays 'ambient', and music follows the switch the same way SFX do.
     Step 3 (the warm-up) and the first-tap sound fix below stay on. */
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
    try {
      const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, ac.sampleRate); s.connect(ac.destination);
      s.onended = () => { try { s.disconnect(); } catch (err) {} };
      s.start(0); warmed = true;
    } catch(e) {}
  }
  // First gesture unlocks audio; kept on so iOS can resume after an interruption (phone call, lock screen, another app's audio).
  // pointerdown/touchstart are not "activation" on iOS, so touchend/click/keydown do the real unlock; pointerdown is a harmless early try.
  const unlock = () => { if (muted) return; session(true); if (ensure()) { warm(); startWanted(); } };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (keep && !keep.paused) try { keep.pause(); } catch(e) {} }
    else if (ac && !muted && ac.state !== 'running') { try { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); } catch(e) {} }
  });

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);   // MIDI note -> Hz (72 = C5)
  // Safari keeps a stopped node that is still connected. A music loop makes a new chain every note,
  // and an iPhone tab that holds them is killed and reloaded after a few minutes. Drop the chain when it ends.
  function endChain(source, nodes){
    const drop = () => { for (const n of nodes) { try { n.disconnect(); } catch (e) {} } };
    try { source.onended = drop; } catch (e) {}
  }
  function tone(m, at, dur, type, vol, slideTo, dest){
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(typeof m === 'number' && m < 128 ? hz(m) : m.hz, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(dest || out); o.start(at); o.stop(at + dur + 0.03);
    endChain(o, [o, g]);
    return o;
  }
  const f = v => ({ hz: v });                          // raw frequency instead of a note
  function noise(at, dur, vol, freq, type, dest){
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; fl.type = type || 'lowpass'; fl.frequency.value = freq || 2000;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || out); s.start(at); s.stop(at + dur + 0.03);
    endChain(s, [s, fl, g]);
    return s;
  }
  const seq = (t, notes, step, dur, type, vol) => notes.forEach((m, i) => { if (m) tone(m, t + i * step, dur, type, vol); });

  // Square waves sound louder than triangles at the same level, so they run at ~1/3 the volume. Everything is under ~0.8 s except the evolution build-up.
  const SFX = {
    tap:      t => tone(84, t, 0.04, 'square', 0.15),
    // LR4: two soft tail thumps over a short fur brush. About 250 ms. No music duck.
    pet:      t => { noise(t, 0.05, 0.08, 900); tone(48, t + 0.02, 0.07, 'triangle', 0.45); tone(48, t + 0.18, 0.07, 'triangle', 0.4); },
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
    pop:      t => { noise(t, 0.05, 0.22, 1800); tone(f(880), t, 0.04, 'square', 0.1, 220); },
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
    const end = t0 + stLen(id);
    live.push({ id, bus, nodes, t0, end });
    duckMusic(t0, end);
    return true;
  }
  const stSounding = () => !!ac && live.some(s => s.t0 <= ac.currentTime && ac.currentTime < s.end);
  const stPending = () => !!ac && live.some(s => s.end > ac.currentTime + 0.02);

  /* MUSIC v0.1: original loops. No audio files.
     Town, route, battle, and the later rooms were pasted from design/specs/MUSIC.md.
     trial, rival, hall, harbour, route3, lab, dream, and episode_end were converted from SuperGrok MIDI
     (ASSET_HANDOFF v0.2 M1-M8) with tools/midi2music.py. Seven of those drum parts were varied after conversion (D169). */
  const KIT = {
    k: ['lowpass', 260, 90, 0.30],
    s: ['highpass', 1500, 110, 0.10],
    h: ['highpass', 6500, 30, 0.04],
  };
  const MUSIC = {
    town: { key: 'F major', bpm: 96, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.55,
      lead: { wave: 'triangle', gain: 0.22, notes: [
        [69,2],[72,1],[77,1],[76,2],[72,2],
        [74,3],[77,1],[81,2],[77,2],
        [74,2],[70,1],[72,1],[74,2],[77,2],
        [76,3],[74,1],[72,4],
        [69,1],[72,1],[77,2],[79,1],[77,1],[76,2],
        [76,2],[72,2],[69,2],[72,2],
        [74,2],[77,2],[76,1],[74,1],[76,2],
        [77,6],[74,1],[72,1] ] },
      bass: { wave: 'triangle', gain: 0.28, notes: [
        [41,2],[48,2],[45,2],[48,2],  [38,2],[45,2],[41,2],[45,2],
        [46,2],[53,2],[50,2],[53,2],  [48,2],[55,2],[52,2],[55,2],
        [41,2],[48,2],[45,2],[48,2],  [45,2],[52,2],[48,2],[52,2],
        [46,2],[53,2],[48,2],[55,2],  [41,4],[48,2],[41,2] ] },
      drums: ['k.h.s.h.','k.h.s.h.','k.h.s.h.','k.h.s.hh','k.h.s.h.','k.h.s.h.','k.h.s.h.','k.h.s.ss'] },
    route: { key: 'G major', bpm: 112, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.75,
      lead: { wave: 'square', gain: 0.055, notes: [
        [67,1],[71,1],[74,2],[71,1],[74,1],[79,2],
        [76,2],[72,1],[76,1],[79,3],[76,1],
        [74,1],[71,1],[67,2],[69,1],[71,1],[74,2],
        [69,1],[74,1],[78,2],[76,2],[74,2],
        [79,2],[76,1],[71,1],[76,2],[79,2],
        [79,1],[76,1],[72,2],[76,1],[79,1],[81,2],
        [78,2],[76,1],[74,1],[69,2],[78,2],
        [79,4],[74,2],[0,2] ] },
      bass: { wave: 'triangle', gain: 0.30, notes: [
        [43,2],[55,2],[50,2],[55,2],  [48,2],[60,2],[55,2],[60,2],
        [43,2],[55,2],[50,2],[55,2],  [50,2],[62,2],[57,2],[62,2],
        [40,2],[52,2],[47,2],[52,2],  [48,2],[60,2],[55,2],[60,2],
        [50,2],[62,2],[57,2],[62,2],  [43,2],[50,2],[43,4] ] },
      drums: ['k.hks.h.','k.hks.h.','k.hks.h.','k.hks.h.','k.hks.h.','k.hks.h.','k.hks.h.','k.hks.ss'] },
    battle: { key: 'A minor', bpm: 140, bars: 8, stepsPerBar: 16, gate: 0.9, perc: 1.0,
      lead: { wave: 'square', gain: 0.06, notes: [
        [69,2],[72,2],[76,2],[81,4],[79,2],[76,2],[72,2],
        [77,4],[76,2],[74,2],[72,4],[69,4],
        [71,2],[74,2],[79,4],[77,2],[76,2],[74,4],
        [76,6],[0,2],[69,2],[71,2],[72,2],[74,2],
        [76,2],[76,2],[81,2],[76,2],[79,2],[77,2],[76,2],[72,2],
        [74,2],[77,2],[81,4],[79,2],[77,2],[76,2],[74,2],
        [71,2],[74,2],[79,2],[83,2],[81,4],[79,4],
        [80,4],[76,2],[71,2],[68,2],[71,2],[74,2],[80,2] ] },
      bass: { wave: 'triangle', gain: 0.32, notes: [
        [45,2],[57,2],[45,2],[57,2],[45,2],[57,2],[45,2],[57,2],
        [41,2],[53,2],[41,2],[53,2],[41,2],[53,2],[41,2],[53,2],
        [43,2],[55,2],[43,2],[55,2],[43,2],[55,2],[43,2],[55,2],
        [45,2],[57,2],[45,2],[57,2],[45,2],[57,2],[45,2],[57,2],
        [45,2],[57,2],[45,2],[57,2],[45,2],[57,2],[45,2],[57,2],
        [41,2],[53,2],[41,2],[53,2],[41,2],[53,2],[41,2],[53,2],
        [43,2],[55,2],[43,2],[55,2],[43,2],[55,2],[43,2],[55,2],
        [40,2],[52,2],[40,2],[52,2],[40,2],[52,2],[44,2],[47,2] ] },
      drums: ['k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.k.hks.hh',
              'k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.s.s.ssss'] },
    // High Charity. Original loops: civic town, chapel, and the Event Hall. Lead and bass each sum to bars*stepsPerBar.
    charity: { key: 'Bb major', bpm: 92, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.42,
      lead: { wave: 'triangle', gain: 0.22, notes: [
        [70,2],[74,1],[77,1],[79,2],[77,2],
        [75,2],[74,1],[72,1],[74,2],[70,2],
        [72,2],[75,2],[74,1],[72,1],[70,2],
        [69,2],[70,2],[72,2],[74,2],
        [77,2],[81,1],[82,1],[81,2],[77,2],
        [79,2],[77,2],[75,2],[74,2],
        [75,1],[77,1],[79,2],[77,1],[75,1],[74,2],
        [72,2],[74,2],[70,4] ] },
      bass: { wave: 'triangle', gain: 0.26, notes: [
        [46,4],[53,4],  [51,4],[58,2],[51,2],
        [41,4],[48,4],  [46,2],[53,2],[50,2],[46,2],
        [46,4],[58,2],[53,2],  [51,4],[58,4],
        [51,4],[55,2],[58,2],  [41,4],[46,4] ] },
      drums: ['k..hs.h.','k..hs...','k..hs.h.','k..hs.s.','k..hs.h.','k..hs...','k..hs.h.','k..hss.s'] },
    chapel: { key: 'F major', bpm: 72, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.18,
      lead: { wave: 'triangle', gain: 0.22, notes: [
        [65,4],[69,4],
        [72,4],[69,2],[67,2],
        [69,2],[70,2],[72,4],
        [70,2],[69,2],[67,4],
        [65,2],[69,2],[72,2],[74,2],
        [72,4],[70,4],
        [69,2],[67,2],[69,2],[70,2],
        [72,2],[69,2],[65,4] ] },
      bass: { wave: 'triangle', gain: 0.24, notes: [
        [41,8], [48,8], [46,8], [43,8],
        [41,4],[48,4], [48,4],[46,4],
        [43,4],[46,4], [48,4],[41,4] ] },
      drums: ['....h...','....h...','....h...','....h..h','....h...','....h...','....h...','......hh'] },
    arcade: { key: 'C major', bpm: 128, bars: 8, stepsPerBar: 8, gate: 0.75, perc: 0.8,
      lead: { wave: 'square', gain: 0.07, notes: [
        [76,1],[79,1],[76,1],[72,1],[74,1],[76,1],[79,2],
        [81,1],[79,1],[76,2],[74,1],[72,1],[74,2],
        [72,1],[76,1],[79,1],[81,1],[79,2],[76,2],
        [74,1],[76,1],[74,1],[72,1],[69,2],[0,2],
        [79,1],[81,1],[79,1],[76,1],[72,1],[74,1],[76,2],
        [77,1],[76,1],[74,2],[76,1],[77,1],[79,2],
        [76,1],[74,1],[72,1],[74,1],[76,2],[79,2],
        [72,2],[76,2],[74,2],[72,2] ] },
      bass: { wave: 'triangle', gain: 0.28, notes: [
        [48,2],[60,2],[48,2],[60,2],  [43,2],[55,2],[43,2],[55,2],
        [41,2],[53,2],[41,2],[53,2],  [43,2],[55,2],[48,4],
        [45,2],[57,2],[45,2],[57,2],  [41,2],[53,2],[43,2],[55,2],
        [48,2],[55,2],[52,2],[55,2],  [43,2],[41,2],[48,4] ] },
      drums: ['k.h.s.h.','k.hks.h.','k.h.s.h.','k.s.s.s.','k.h.s.h.','k.hks.h.','k.h.s.h.','k.sss.ss'] },
// Wild walking battles: three upbeat loops, cycled so grass fights don't all sound like the trainer theme.
    wild_skip: { key: 'C major', bpm: 156, bars: 8, stepsPerBar: 8, gate: 0.85, perc: 0.85,
      lead: { wave: 'square', gain: 0.05, notes: [
        [72,1],[76,1],[79,1],[84,1],[79,1],[76,1],[72,2],
        [74,1],[77,1],[81,2],[79,1],[77,1],[74,2],
        [76,1],[79,1],[84,2],[81,1],[79,1],[76,2],
        [72,2],[67,1],[72,1],[76,2],[79,2],
        [84,1],[81,1],[79,1],[76,1],[79,2],[84,2],
        [81,1],[77,1],[74,2],[77,1],[81,1],[79,2],
        [76,1],[72,1],[67,1],[72,1],[76,1],[79,1],[84,2],
        [79,2],[76,2],[72,4] ] },
      bass: { wave: 'triangle', gain: 0.28, notes: [
        [48,2],[60,2],[55,2],[60,2],  [53,2],[65,2],[60,2],[65,2],
        [55,2],[67,2],[62,2],[67,2],  [48,2],[60,2],[52,2],[55,2],
        [45,2],[57,2],[52,2],[57,2],  [53,2],[65,2],[60,2],[65,2],
        [55,2],[67,2],[62,2],[67,2],  [48,2],[55,2],[48,4] ] },
      drums: ['k.h.s.h.','k.h.s.h.','k.h.s.h.','k.h.s.hh','k.h.s.h.','k.h.s.h.','k.h.s.h.','k.h.s.ss'] },
    wild_romp: { key: 'G major', bpm: 144, bars: 8, stepsPerBar: 8, gate: 0.8, perc: 0.9,
      lead: { wave: 'triangle', gain: 0.24, notes: [
        [67,1],[71,1],[74,2],[79,2],[74,1],[71,1],
        [72,1],[76,1],[79,2],[76,1],[72,1],[67,2],
        [74,2],[71,1],[74,1],[78,2],[76,2],
        [79,1],[76,1],[74,1],[71,1],[67,4],
        [79,2],[81,1],[79,1],[76,2],[74,2],
        [71,1],[74,1],[79,2],[76,2],[74,1],[71,1],
        [67,1],[72,1],[76,2],[79,1],[76,1],[74,2],
        [79,4],[74,2],[67,2] ] },
      bass: { wave: 'triangle', gain: 0.26, notes: [
        [43,2],[55,2],[50,2],[55,2],  [43,2],[55,2],[47,2],[55,2],
        [41,2],[53,2],[48,2],[53,2],  [43,2],[55,2],[50,2],[43,2],
        [40,2],[52,2],[47,2],[52,2],  [45,2],[57,2],[52,2],[57,2],
        [43,2],[55,2],[50,2],[55,2],  [43,4],[38,2],[43,2] ] },
      drums: ['k.hks.h.','k.hks.h.','k.hks.h.','k.hks.hh','k.hks.h.','k.hks.h.','k.hks.h.','k.hks.ss'] },
    wild_spark: { key: 'F major', bpm: 168, bars: 8, stepsPerBar: 8, gate: 0.7, perc: 0.7,
      lead: { wave: 'square', gain: 0.045, notes: [
        [77,1],[81,1],[84,1],[88,1],[84,1],[81,1],[77,2],
        [79,1],[82,1],[86,2],[84,1],[82,1],[79,2],
        [84,1],[81,1],[77,2],[81,1],[84,1],[88,2],
        [86,2],[84,1],[81,1],[77,4],
        [72,1],[77,1],[81,1],[84,1],[81,1],[77,1],[84,2],
        [88,1],[84,1],[81,2],[86,1],[84,1],[81,2],
        [77,2],[81,2],[84,2],[79,2],
        [84,2],[81,2],[77,4] ] },
      bass: { wave: 'triangle', gain: 0.26, notes: [
        [41,2],[53,2],[48,2],[53,2],  [46,2],[58,2],[53,2],[58,2],
        [48,2],[60,2],[55,2],[60,2],  [41,2],[53,2],[48,2],[41,2],
        [43,2],[55,2],[50,2],[55,2],  [46,2],[58,2],[53,2],[58,2],
        [41,2],[48,2],[53,2],[48,2],  [41,4],[46,2],[41,2] ] },
      drums: ['k.s.h.s.','k.s.h.s.','k.s.h.s.','k.s.hh.s','k.s.h.s.','k.s.h.s.','k.s.h.s.','k.s.s.ss'] },
    // Glimmerwell, heard by a Keeper: a slow first-meeting sting, then a darker fight loop.
    glimmer_first: { key: 'E phrygian', bpm: 76, bars: 8, stepsPerBar: 8, gate: 0.95, perc: 0.35,
      lead: { wave: 'square', gain: 0.035, notes: [
        [64,4],[65,2],[64,2],
        [67,3],[65,1],[64,4],
        [60,2],[65,2],[64,4],
        [70,4],[67,2],[65,2],
        [64,2],[72,2],[71,2],[65,2],
        [64,6],[0,2],
        [65,2],[64,2],[60,2],[58,2],
        [64,8] ] },
      bass: { wave: 'triangle', gain: 0.34, notes: [
        [40,8], [40,4],[34,4], [40,4],[41,4], [34,8],
        [40,4],[35,4], [40,6],[0,2], [41,4],[40,4], [40,8] ] },
      drums: ['k.......','k...s...','k.......','k.....s.','k...s...','k.......','k...s.s.','k.......'] },
    glimmer_battle: { key: 'D minor', bpm: 132, bars: 8, stepsPerBar: 16, gate: 0.85, perc: 0.85,
      lead: { wave: 'square', gain: 0.05, notes: [
        [62,2],[65,2],[69,4],[70,2],[69,2],[65,2],[62,2],
        [70,4],[69,2],[67,2],[65,4],[62,4],
        [62,2],[68,2],[69,4],[65,2],[62,2],[58,4],
        [65,6],[0,2],[62,2],[65,2],[67,2],[69,2],
        [74,2],[70,2],[69,2],[65,2],[69,4],[70,2],[69,2],
        [67,2],[65,2],[62,4],[70,4],[69,4],
        [62,2],[65,2],[69,2],[73,2],[74,4],[70,4],
        [69,4],[65,2],[62,2],[58,2],[62,2],[65,4] ] },
      bass: { wave: 'triangle', gain: 0.36, notes: [
        [38,2],[50,2],[38,2],[50,2],[38,2],[50,2],[38,2],[50,2],
        [46,2],[58,2],[46,2],[58,2],[46,2],[58,2],[46,2],[58,2],
        [45,2],[57,2],[45,2],[57,2],[45,2],[57,2],[45,2],[57,2],
        [38,2],[50,2],[38,2],[50,2],[38,2],[50,2],[38,2],[50,2],
        [38,2],[50,2],[38,2],[50,2],[38,2],[50,2],[38,2],[50,2],
        [41,2],[53,2],[41,2],[53,2],[41,2],[53,2],[41,2],[53,2],
        [36,2],[48,2],[36,2],[48,2],[36,2],[48,2],[36,2],[48,2],
        [38,2],[50,2],[38,2],[50,2],[38,2],[50,2],[44,2],[38,2] ] },
      drums: ['k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.k.h.ssss',
              'k.h.s.h.k.hks.h.','k.h.s.h.k.hks.h.','k.h.s.h.k.hks.s.','k.s.s.s.k.h.ssss'] },
    town_glimmer: { key: 'F Lydian', bpm: 108, bars: 8, stepsPerBar: 8, gate: 0.85, perc: 0.7,
      lead: { wave: 'square', gain: 0.048, notes: [
        [77,2],[79,1],[77,1],[76,2],[72,2],
        [74,2],[72,1],[71,1],[72,2],[69,2],
        [76,1],[77,1],[79,2],[81,2],[79,2],
        [77,4],[76,2],[72,2],
        [72,2],[74,2],[76,1],[77,1],[79,2],
        [76,2],[74,1],[71,1],[72,2],[69,2],
        [74,2],[76,2],[77,2],[79,2],
        [77,4],[72,2],[77,2] ] },
      bass: { wave: 'triangle', gain: 0.26, notes: [
        [41,4],[48,4],
        [46,4],[41,2],[48,2],
        [43,4],[50,4],
        [41,4],[48,4],
        [41,2],[48,2],[46,2],[41,2],
        [45,4],[41,2],[48,2],
        [43,4],[48,4],
        [41,4],[48,2],[41,2] ] },
      drums: ['k.h.s.h.','k.hks.h.','k.h.s.h.','k.s.s.s.','k.h.s.h.','k.hks.s.','k.h.s.h.','k.h.s.ss'] },
    quarry: { key: 'A minor', bpm: 96, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.88,
      lead: { wave: 'square', gain: 0.05, notes: [
        [69,2],[72,2],[69,2],[64,2],
        [67,2],[65,1],[64,1],[62,2],[60,2],
        [64,2],[67,2],[69,4],
        [72,2],[69,2],[64,2],[60,2],
        [69,1],[72,1],[76,2],[72,2],[69,2],
        [67,4],[64,2],[62,2],
        [64,2],[60,2],[64,2],[67,2],
        [69,4],[64,2],[0,2] ] },
      bass: { wave: 'triangle', gain: 0.32, notes: [
        [45,4],[40,4],
        [41,4],[38,4],
        [43,4],[40,4],
        [45,4],[48,4],
        [45,2],[52,2],[40,4],
        [38,4],[43,4],
        [41,4],[40,4],
        [45,4],[40,2],[45,2] ] },
      drums: ['k.h.s.h.','k.hk.s.h','k.h.s.h.','k.hks.h.','k.h.s.h.','k.hk.s.s','k.h.s.h.','k.h.s.ss'] },
    grove: { key: 'G major', bpm: 80, bars: 8, stepsPerBar: 8, gate: 0.95, perc: 0.22,
      lead: { wave: 'triangle', gain: 0.2, notes: [
        [67,4],[71,4],
        [74,2],[71,2],[67,4],
        [69,2],[71,2],[74,4],
        [72,2],[71,2],[67,4],
        [74,2],[76,2],[74,2],[71,2],
        [67,4],[69,2],[67,2],
        [71,2],[74,2],[71,2],[67,2],
        [67,6],[0,2] ] },
      bass: { wave: 'triangle', gain: 0.22, notes: [
        [43,8],
        [47,8],
        [45,8],
        [43,8],
        [43,4],[50,4],
        [48,8],
        [47,4],[45,4],
        [43,8] ] },
      drums: ['....h...','k...h...','....h...','....h..h','....h...','k...h...','....h...','......hh'] },
    // ASSET_HANDOFF v0.2 M1-M8. Literals pasted from the converter output. Drum bars on seven loops were varied after conversion (D169). rival is M2_rival_v2.
    trial: { key: 'D major', bpm: 150, bars: 8, stepsPerBar: 16, gate: 0.9, perc: 0.55,
      lead: { wave: 'square', gain: 0.06, notes: [[74,4],[76,2],[78,2],[79,4],[78,2],[76,2],[74,4],[81,2],[79,2],[78,4],[76,2],[74,2],[76,4],[78,2],[79,2],[81,4],[79,2],[78,2],[74,2],[76,2],[78,2],[79,2],[81,4],[79,2],[78,2],[81,4],[79,2],[78,2],[76,4],[78,2],[79,2],[74,4],[76,2],[74,2],[71,4],[74,2],[76,2],[78,4],[79,2],[81,2],[83,4],[81,2],[79,2],[74,4],[71,2],[69,2],[67,4],[69,2],[71,2]] },
      bass: { wave: 'triangle', gain: 0.28, notes: [[50,8],[45,8],[50,8],[57,8],[52,8],[47,8],[45,8],[50,16],[45,8],[47,8],[52,8],[55,8],[50,8],[45,8],[50,8]] },
      drums: ['k.h.s.hkk.h.s.hh','k.h.s.hkk.hks.hh','k.h.s.hkk.h.s.hh','k.h.s.hkk.hks.hh','k.h.s.hkk.h.s.hh','k.h.s.hkk.hks.hh','k.h.s.hkk.h.s.hh','k.h.s.hkk.s.ssss'] },
    rival: { key: 'E minor', bpm: 146, bars: 8, stepsPerBar: 16, gate: 0.9, perc: 0.55,
      lead: { wave: 'square', gain: 0.06, notes: [[64,4],[71,2],[64,2],[67,2],[69,2],[71,1],[72,1],[71,1],[64,2],[66,1],[67,1],[69,1],[71,1],[69,1],[67,1],[66,1],[64,2],[67,2],[69,1],[71,1],[69,1],[64,1],[71,2],[64,2],[67,1],[69,1],[71,1],[72,1],[74,1],[72,1],[71,1],[69,1],[67,1],[66,1],[64,1],[62,1],[64,2],[66,2],[64,1],[67,1],[69,1],[71,1],[69,1],[67,1],[64,1],[66,1],[64,1],[62,1],[64,1],[67,1],[64,4],[71,1],[69,1],[67,1],[64,1],[66,1],[67,1],[69,1],[71,1],[72,1],[71,1],[69,1],[64,1],[67,2],[69,2],[71,1],[72,1],[71,1],[69,1],[67,1],[66,1],[64,2],[62,1],[64,1],[66,1],[67,1],[64,1],[71,1],[64,1],[71,1],[67,1],[69,1],[67,1],[69,1],[71,1],[72,1],[74,1],[72,1],[71,1],[69,1],[67,1],[64,1],[62,1],[64,1],[66,1],[67,1],[69,1],[71,1],[72,1],[74,1],[72,1],[71,1],[69,1],[67,1],[66,1],[64,1],[62,1],[64,1]] },
      bass: { wave: 'square', gain: 0.05, notes: [[40,20],[45,4],[40,2],[47,2],[40,6],[47,2],[40,2],[45,2],[40,4],[47,2],[40,6],[43,4],[40,2],[45,2],[40,20],[45,4],[40,4],[47,4],[40,6],[47,2],[45,2],[40,2],[47,2],[45,2],[40,2],[47,2],[40,4],[45,2],[47,2],[40,2],[45,2],[40,4]] },
      drums: ['khhkshkhkhhkshkh','khhkshkhkhhkshkh','khhkshkhkhhkshkh','khhkshkhkhhkshkh','khhkshkhkhhkshkh','khhkshkhkhhkshkh','khhkshkhkhhkshkh','ksskssssksssssss'] },
    hall: { key: 'C major', bpm: 84, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.55,
      lead: { wave: 'triangle', gain: 0.22, notes: [[72,2],[76,1],[79,2],[76,1],[72,2],[74,2],[76,1],[77,2],[74,1],[72,2],[76,2],[79,1],[81,2],[79,1],[76,2],[74,2],[72,1],[71,2],[72,1],[74,2],[72,2],[76,1],[79,2],[81,1],[79,2],[77,2],[76,1],[74,2],[72,1],[71,2],[72,2],[76,2],[79,2],[76,2],[74,2],[72,1],[71,2],[69,1],[67,2]] },
      bass: { wave: 'triangle', gain: 0.28, notes: [[48,2],[55,2],[52,2],[48,4],[55,2],[52,2],[48,4],[55,2],[52,2],[48,4],[55,2],[52,2],[48,4],[55,2],[52,2],[48,4],[55,2],[52,2],[48,4],[55,2],[52,2],[48,4],[55,2],[52,2],[48,2]] },
      drums: ['k...s..h','k.h.s..h','k...s..h','k.h.s..h','k...s..h','k.h.s..h','k...s..h','k...s.ss'] },
    harbour: { key: 'A major', bpm: 100, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.55,
      lead: { wave: 'triangle', gain: 0.22, notes: [[81,1],[83,1],[85,1],[81,1],[83,1],[85,1],[83,1],[81,1],[83,1],[85,1],[86,1],[85,1],[83,1],[81,1],[80,1],[81,1],[85,1],[86,1],[88,1],[86,1],[85,1],[83,1],[81,1],[83,1],[81,1],[80,1],[78,1],[80,1],[81,1],[83,1],[81,1],[80,1],[81,1],[83,1],[85,1],[86,1],[85,1],[83,1],[81,1],[83,1],[85,1],[86,1],[88,1],[86,1],[85,1],[83,1],[81,1],[80,1],[83,1],[81,1],[80,1],[81,1],[83,1],[85,1],[83,1],[81,1],[80,1],[78,1],[80,1],[81,1],[80,1],[78,1],[76,1],[78,1]] },
      bass: { wave: 'triangle', gain: 0.28, notes: [[57,2],[64,2],[61,2],[57,4],[64,2],[61,2],[57,4],[64,2],[61,2],[57,4],[64,2],[61,2],[57,4],[64,2],[61,2],[57,4],[64,2],[61,2],[57,4],[64,2],[61,2],[57,4],[64,2],[61,2],[57,2]] },
      drums: ['k.hk.hs.','k.hk.hsh','k.hk.hs.','k.hk.hsh','k.hk.hs.','k.hk.hsh','k.hk.hs.','k.hk.sss'] },
    route3: { key: 'D major', bpm: 116, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.55,
      lead: { wave: 'square', gain: 0.06, notes: [[74,1],[76,1],[78,1],[74,1],[76,1],[78,1],[76,1],[74,1],[76,1],[78,1],[79,1],[78,1],[76,1],[74,1],[73,1],[74,1],[78,1],[79,1],[81,1],[79,1],[78,1],[76,1],[74,1],[76,1],[74,1],[73,1],[71,1],[73,1],[74,1],[76,1],[74,1],[73,1],[74,1],[76,1],[78,1],[79,1],[78,1],[76,1],[74,1],[76,1],[78,1],[79,1],[81,1],[79,1],[78,1],[76,1],[74,1],[73,1],[76,1],[74,1],[73,1],[74,1],[76,1],[78,1],[76,1],[74,1],[73,1],[71,1],[73,1],[74,1],[73,1],[71,1],[69,1],[71,1]] },
      bass: { wave: 'triangle', gain: 0.28, notes: [[50,2],[57,2],[54,2],[50,4],[57,2],[54,2],[50,4],[57,2],[54,2],[50,4],[57,2],[54,2],[50,4],[57,2],[54,2],[50,4],[57,2],[54,2],[50,4],[57,2],[54,2],[50,4],[57,2],[54,2],[50,2]] },
      drums: ['k.hhs.hk','k.hhs.h.','k.hhs.hk','k.hhs.h.','k.hhs.hk','k.hhs.h.','k.hhs.hk','k.hhsss.'] },
    lab: { key: 'B minor', bpm: 92, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.55,
      lead: { wave: 'triangle', gain: 0.22, notes: [[71,1],[74,1],[76,1],[71,1],[74,1],[76,1],[74,1],[71,1],[74,1],[76,1],[77,1],[76,1],[74,1],[71,1],[69,1],[71,1],[76,1],[77,1],[79,1],[77,1],[76,1],[74,1],[71,1],[74,1],[71,1],[69,1],[67,1],[69,1],[71,1],[74,1],[71,1],[69,1],[71,1],[74,1],[76,1],[77,1],[76,1],[74,1],[71,1],[74,1],[76,1],[77,1],[79,1],[77,1],[76,1],[74,1],[71,1],[69,1],[74,1],[71,1],[69,1],[71,1],[74,1],[76,1],[74,1],[71,1],[69,1],[67,1],[69,1],[71,1],[69,1],[67,1],[64,1],[67,1]] },
      bass: { wave: 'square', gain: 0.05, notes: [[47,2],[54,2],[50,2],[47,4],[54,2],[50,2],[47,4],[54,2],[50,2],[47,4],[54,2],[50,2],[47,4],[54,2],[50,2],[47,4],[54,2],[50,2],[47,4],[54,2],[50,2],[47,4],[54,2],[50,2],[47,2]] },
      drums: ['k.h..sh.','k.h..shh','k.h..sh.','k.h..shh','k.h..sh.','k.h..shh','k.h..sh.','k.h..sss'] },
    dream: { key: 'Eb major', bpm: 70, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.55,
      lead: { wave: 'triangle', gain: 0.22, notes: [[75,2],[79,1],[82,2],[79,1],[75,2],[77,2],[79,1],[80,2],[77,1],[75,2],[79,2],[82,1],[84,2],[82,1],[79,2],[77,2],[75,1],[73,2],[75,1],[77,2],[75,2],[79,1],[82,2],[80,1],[79,2],[77,2],[75,1],[73,2],[72,1],[70,2],[75,2],[79,2],[82,2],[79,2],[77,2],[75,1],[73,2],[70,1],[68,2]] },
      bass: { wave: 'triangle', gain: 0.28, notes: [[51,2],[58,2],[55,2],[51,4],[58,2],[55,2],[51,4],[58,2],[55,2],[51,4],[58,2],[55,2],[51,4],[58,2],[55,2],[51,4],[58,2],[55,2],[51,4],[58,2],[55,2],[51,4],[58,2],[55,2],[51,2]] },
      drums: ['h.....h.','h...k.h.','h.....h.','h...k.h.','h.....h.','h...k.h.','h.....h.','h...k...'] },
    episode_end: { key: 'G major', bpm: 88, bars: 8, stepsPerBar: 8, gate: 0.9, perc: 0.55,
      lead: { wave: 'square', gain: 0.06, notes: [[67,1],[71,1],[74,1],[71,1],[67,1],[69,1],[71,1],[67,1],[69,1],[71,1],[72,1],[71,1],[69,1],[67,1],[66,1],[67,1],[71,1],[74,1],[76,1],[74,1],[71,1],[69,1],[67,1],[69,1],[67,1],[66,1],[64,1],[66,1],[67,1],[69,1],[67,1],[66,1],[67,1],[71,1],[74,1],[72,1],[71,1],[69,1],[67,1],[69,1],[71,1],[69,1],[67,1],[66,1],[67,1],[69,1],[71,1],[67,1],[69,1],[67,1],[66,1],[67,1],[69,1],[71,1],[69,1],[67,1],[66,1],[64,1],[66,1],[67,1],[66,1],[64,1],[62,1],[64,1]] },
      bass: { wave: 'triangle', gain: 0.28, notes: [[43,2],[50,2],[47,2],[43,4],[50,2],[47,2],[43,4],[50,2],[47,2],[43,4],[50,2],[47,2],[43,4],[50,2],[47,2],[43,4],[50,2],[47,2],[43,4],[50,2],[47,2],[43,4],[50,2],[47,2],[43,2]] },
      drums: ['k...s.h.','k.h.s...','k...s.h.','k.h.s...','k...s.h.','k.h.s...','k...s.h.','k.hks...'] },
  };
  function musicCheck(){
    const bad = [];
    for (const [id, t] of Object.entries(MUSIC)) {
      const need = t.bars * t.stepsPerBar;
      for (const voice of ['lead', 'bass']) {
        const sum = t[voice].notes.reduce((s, n) => s + n[1], 0);
        if (sum !== need) bad.push(id + ' ' + voice + ' ' + sum + '!=' + need);
      }
      if (t.drums.length !== t.bars) bad.push(id + ' drum bars');
      t.drums.forEach((bar, i) => { if (bar.length !== t.stepsPerBar || /[^ksh.]/.test(bar)) bad.push(id + ' drum ' + i); });
    }
    return bad;
  }
  function musicSpec(id){
    const t = MUSIC[id];
    if (!t) return null;
    const voice = v => ({ wave: v.wave, gain: v.gain, notes: v.notes.map(n => [n[0], n[1]]) });
    return {
      key: t.key, bpm: t.bpm, bars: t.bars, stepsPerBar: t.stepsPerBar, gate: t.gate, perc: t.perc,
      lead: voice(t.lead), bass: voice(t.bass), drums: t.drums.slice(),
    };
  }
  let MUSIC_ON = true, MUSIC_VOL = 0.5, want = null, trk = null, token = 0;
  const FLAT = {};
  function eventsFor(id){
    if (FLAT[id]) return FLAT[id];
    const t = MUSIC[id], n = t.bars * t.stepsPerBar, by = Array.from({ length: n }, () => []);
    for (const voice of ['lead', 'bass']) {
      let s = 0;
      for (const [note, steps] of t[voice].notes) { if (note) by[s].push({ kind: voice, note, steps }); s += steps; }
    }
    t.drums.forEach((bar, b) => { for (let i = 0; i < bar.length; i++) if (bar[i] !== '.') by[b * t.stepsPerBar + i].push({ kind: 'd', drum: bar[i] }); });
    FLAT[id] = { by, n, stepSec: (60 / t.bpm) * 4 / t.stepsPerBar, stepsPerBar: t.stepsPerBar, gate: t.gate, perc: t.perc, lead: t.lead, bass: t.bass };
    return FLAT[id];
  }
  function canHear(){ return MUSIC_ON && !muted && !document.hidden && !!ac && ac.state === 'running'; }
  function duckMusic(t0, end){
    if (!trk || !trk.bus) return;
    try { trk.bus.gain.setTargetAtTime(MUSIC_VOL * 0.35, t0, 0.013); trk.bus.gain.setTargetAtTime(MUSIC_VOL, end, 0.1); } catch(e) {}
  }
  function schedule(cur){
    const info = cur.info, horizon = ac.currentTime + 0.3;
    if (cur.nextAt < ac.currentTime - 0.05) {
      const barSec = info.stepSec * info.stepsPerBar, late = ac.currentTime - cur.nextAt;
      const bars = Math.max(1, Math.ceil(late / barSec));
      cur.step = (cur.step + bars * info.stepsPerBar) % info.n;
      cur.nextAt += bars * barSec;
    }
    let guard = 0;
    while (cur.nextAt < horizon && guard++ < 80) {
      for (const e of cur.info.by[cur.step] || []) {
        if (e.kind === 'd') {
          const k = KIT[e.drum]; if (!k) continue;
          noise(cur.nextAt, k[2] / 1000, k[3] * info.perc, k[1], k[0], cur.bus);
          if (e.drum === 'k') tone({ hz: 120 }, cur.nextAt, 0.08, 'triangle', 0.35 * info.perc, 45, cur.bus);
        } else {
          const voice = e.kind === 'lead' ? info.lead : info.bass;
          tone(e.note, cur.nextAt, Math.max(0.02, e.steps * info.stepSec * info.gate), voice.wave, voice.gain, 0, cur.bus);
        }
      }
      cur.step = (cur.step + 1) % info.n;
      cur.nextAt += info.stepSec;
    }
  }
  function stopTrack(fadeSec){
    if (!trk) return;
    const old = trk; trk = null; clearInterval(old.timer);
    const now = ac ? ac.currentTime : 0;
    try {
      old.bus.gain.cancelScheduledValues(now);
      old.bus.gain.setValueAtTime(Math.max(0.0001, old.bus.gain.value || 0.0001), now);
      old.bus.gain.setTargetAtTime(0.0001, now, Math.max(0.01, fadeSec / 3));
    } catch(e) {}
    setTimeout(() => { try { old.bus.disconnect(); } catch(e) {} }, Math.round(fadeSec * 1000) + 120);
  }
  function startTrack(id, fadeIn){
    if (!ac) return;
    const info = eventsFor(id), bus = ac.createGain(), now = ac.currentTime;
    bus.connect(out);
    bus.gain.setValueAtTime(0.0001, now);
    if (fadeIn <= 0.001) bus.gain.setValueAtTime(MUSIC_VOL, now);
    else bus.gain.linearRampToValueAtTime(MUSIC_VOL, now + fadeIn);
    const cur = { id, bus, info, step: 0, nextAt: now + 0.02, timer: null };
    trk = cur;
    const tick = () => { if (trk === cur) schedule(cur); };
    cur.timer = setInterval(tick, 100);
    tick();
  }
  function startWanted(){
    if (!want || !canHear()) return;
    if (trk && trk.id === want) return;
    if (trk) stopTrack(0.4);
    startTrack(want, 0.4);
  }
  function music(id, opt){
    opt = opt || {};
    if (!id || !MUSIC[id]) return false;
    if (trk && trk.id === id && !opt.restart && !opt.delay && !opt.afterStingers && opt.minDelay == null && canHear()) { want = id; return true; }
    want = id;
    const my = ++token, fadeOut = (opt.fadeOut != null ? opt.fadeOut : 400) / 1000, fadeIn = (opt.fadeIn != null ? opt.fadeIn : 400) / 1000;
    const minDelay = opt.minDelay != null ? opt.minDelay : (opt.delay || 0), t0 = performance.now();
    if (trk && (opt.restart || trk.id !== id)) stopTrack(fadeOut);
    const attempt = () => {
      if (my !== token || want !== id) return;
      if (!canHear()) return;
      if (performance.now() - t0 < minDelay || (opt.afterStingers && stPending())) { setTimeout(attempt, 40); return; }
      if (trk && trk.id === id && !opt.restart) return;
      if (trk) stopTrack(fadeOut);
      startTrack(id, fadeIn);
    };
    attempt();
    return true;
  }
  function setMusic(on, gesture){
    MUSIC_ON = !!on;
    if (!MUSIC_ON) { token++; if (trk) stopTrack(0.1); return false; }
    if (gesture && !muted && ensure()) warm();
    startWanted();
    return true;
  }
  function pauseMusic(){ token++; if (trk) stopTrack(0.03); }
  function resumeMusic(){
    if (!want || !MUSIC_ON || muted || document.hidden || !ac) return;
    const begin = () => { if (!document.hidden && canHear() && (!trk || trk.id !== want)) startTrack(want, 0.4); };
    if (ac.state !== 'running') { try { const r = ac.resume(); if (r && r.then) r.then(begin).catch(() => {}); } catch(e) {} return; }
    begin();
  }

  let petAt = 0;
  function play(name, delay){
    if (name === 'pet' && performance.now() - petAt < 300) return false;
    const sid = /^stinger_/.test(name) && STINGERS[name.slice(8)] ? name.slice(8) : null;
    if (muted || (!SFX[name] && !sid)) return false;
    played.push(name); if (played.length > 50) played.shift();
    if (!ac || ac.state === 'closed') return false;     // not unlocked by a gesture yet: stay silent
    // iOS: resume() resolves a beat after the tap, so the tap's own sound used to be dropped while still 'suspended'/'interrupted'.
    // Within 1 s of a gesture's resume() it is scheduled anyway: queued nodes start once the context runs (or never, if it doesn't).
    if (ac.state !== 'running' && performance.now() - resumeAt > 1000) return false;   // not resuming from a gesture: stay silent
    if (sid) { try { return stinger(sid, delay); } catch(e) { return false; } }
    if (name === 'step' && stSounding()) return false;
    try { SFX[name](ac.currentTime + 0.01 + (delay || 0)); if (name === 'pet') petAt = performance.now(); return true; } catch(e) { return false; }
  }
  function setMuted(m){
    muted = !!m;
    if (muted) { if (ac) live.forEach(s => stCancel(s, ac.currentTime)); live = []; token++; if (trk) stopTrack(0.03); }
    try { if (muted) localStorage.setItem(MUTE_KEY, '1'); else localStorage.removeItem(MUTE_KEY); } catch(e) {}
    if (out && ac) { try { out.gain.setTargetAtTime(muted ? 0 : MASTER, ac.currentTime, 0.01); } catch(e) {} }
    session(!muted);                                   // muted: back to 'ambient', silent loop paused
    if (!muted && ensure()) { warm(); startWanted(); } // toggling is itself a gesture: unlock now
    return muted;
  }
  return { play, setMuted, toggle: () => setMuted(!muted), get muted(){ return muted; }, get available(){ return !!AC; },
    get state(){ return ac ? ac.state : 'none'; }, get session(){ return { playThroughSilent: IOS_PLAY_THROUGH_SILENT, type: navigator.audioSession ? navigator.audioSession.type : null, loop: keep ? (keep.paused ? 'paused' : 'playing') : 'none', warmed }; }, get played(){ return played.slice(); },
    names: Object.keys(SFX).concat(Object.keys(STINGERS).map(k => 'stinger_' + k)), get stingers(){ return live.map(s => s.id); },
    music, setMusic, pauseMusic, resumeMusic, musicCheck, musicSpec, musicIds: () => Object.keys(MUSIC),
    get musicOn(){ return MUSIC_ON; }, get musicTrack(){ return trk ? trk.id : null; }, get musicWant(){ return want; },
    get musicVol(){ return MUSIC_VOL; },
    set musicVol(v){ const n = +v; if (!Number.isFinite(n)) return; MUSIC_VOL = Math.max(0, Math.min(1, n));
      if (trk && ac) { try { trk.bus.gain.setTargetAtTime(MUSIC_VOL, ac.currentTime, 0.05); } catch(e) {} } } };
})();
