/* PixelPets sound: tiny chiptune SFX synthesized with WebAudio (square / triangle / noise). No audio files.
   - The AudioContext is created/resumed only inside a user gesture (iOS + Chrome autoplay rules).
   - Mute is remembered in localStorage `pixelpets.mute` ('1' = muted). Muted = no audio nodes at all.
   - If WebAudio is missing or fails, every call is a silent no-op. */
'use strict';
const PPSound = (() => {
  const MUTE_KEY = 'pixelpets.mute';
  const MASTER = 0.2;                                  // low default volume
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null, out = null, noiseBuf = null, muted = false;
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
      if (ac.state === 'suspended' || ac.state === 'interrupted') { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); }
    } catch(e) { ac = null; }
    return ac;
  }
  // First gesture unlocks audio; kept on so iOS can resume after an interruption (phone call etc.).
  const unlock = () => { if (!muted) ensure(); };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);   // MIDI note -> Hz (72 = C5)
  function tone(m, at, dur, type, vol, slideTo){
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(typeof m === 'number' && m < 128 ? hz(m) : m.hz, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.03);
  }
  const f = v => ({ hz: v });                          // raw frequency instead of a note
  function noise(at, dur, vol, freq, type){
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; fl.type = type || 'lowpass'; fl.frequency.value = freq || 2000;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(at); s.stop(at + dur + 0.03);
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
  };

  function play(name, delay){
    if (muted || !SFX[name]) return false;
    played.push(name); if (played.length > 50) played.shift();
    if (!ac || ac.state !== 'running') return false;   // not unlocked by a gesture yet: stay silent
    try { SFX[name](ac.currentTime + 0.01 + (delay || 0)); return true; } catch(e) { return false; }
  }
  function setMuted(m){
    muted = !!m;
    try { if (muted) localStorage.setItem(MUTE_KEY, '1'); else localStorage.removeItem(MUTE_KEY); } catch(e) {}
    if (out && ac) { try { out.gain.setTargetAtTime(muted ? 0 : MASTER, ac.currentTime, 0.01); } catch(e) {} }
    if (!muted) ensure();                              // toggling is itself a gesture: unlock now
    return muted;
  }
  return { play, setMuted, toggle: () => setMuted(!muted), get muted(){ return muted; }, get available(){ return !!AC; },
    get state(){ return ac ? ac.state : 'none'; }, get played(){ return played.slice(); }, names: Object.keys(SFX) };
})();
