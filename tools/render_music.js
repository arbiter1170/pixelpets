#!/usr/bin/env node
/* tools/render_music.js: render MUSIC loops to WAV from the game's own sfx.js (no copy of the scheduler).
   Headless Chromium loads sfx.js on a blank page with an OfflineAudioContext standing in for the AudioContext. The 100 ms
   scheduler tick that startTrack() sets up is driven at each 100 ms suspend point of the offline render, so tone(), noise(),
   schedule(), the track bus (MUSIC_VOL 0.5), the master gain (MASTER 0.2) and the KEEPER_ANTHEM swell all run as in game.
   Each cue starts as a fresh music() call with fadeIn 0 (the march swells, as at the parade's first step), and the file is
   trimmed to whole loops from the first note (startTrack's 20 ms lead-in is cut).
   WAV level = the in-game level x 9 (+19.1 dB), as Design's previews (MUSIC.md, KEEPER_ANTHEM.md §10), mono 16-bit 44.1 kHz.
   With --compare DIR it reads DIR/<id>.wav (Design's reference render) and prints length, peak and RMS side by side (the
   reference's first N loops), and checks that the oscillators the game scheduled are the spec's notes: every lead, double
   and bass note (MIDI, wave, start step) against the cue's own data in sfx.js. Noise hits are random in both, so only their
   level is compared.
   Usage: node tools/render_music.js anthem_march anthem_dark anthem_hall [--loops 1] [--out handoff/audio/keeper_anthem]
          [--compare ../pixelpets-design/specs/keeper_anthem_preview] [--json out.json] [--near]
   Exit 1 if a render fails or a note differs. Players never load this file. */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const FLAGS = new Set(['--near']);
const ids = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && !FLAGS.has(args[i - 1])));
const LOOPS = Math.max(1, +opt('--loops', 1) | 0);
const OUT = path.resolve(ROOT, opt('--out', 'handoff/audio/keeper_anthem'));
const CMP = opt('--compare', null);
const JSON_OUT = opt('--json', null);
const NEAR = args.includes('--near');   // start at full (no swell), as music(id, { near: true })
const SR = 44100, BOOST = 9, LEAD_IN = 0.02;
if (!ids.length) { console.error('usage: node tools/render_music.js <music id> [...] [--loops N] [--out DIR] [--compare DIR]'); process.exit(2); }

function wav(file, x) {
  const b = Buffer.alloc(44 + x.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, b);
}
function readWav(file) {
  const b = fs.readFileSync(file);
  let p = 12, fmt = null, data = null;
  while (p + 8 <= b.length) { const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4); if (id === 'fmt ') fmt = p + 8; if (id === 'data') { data = [p + 8, n]; break; } p += 8 + n + (n & 1); }
  const ch = b.readUInt16LE(fmt + 2), sr = b.readUInt32LE(fmt + 4), n = data[1] / 2 / ch, x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = b.readInt16LE(data[0] + i * 2 * ch) / 32768;
  return { sr, x };
}
const db = v => +(20 * Math.log10(Math.max(v, 1e-9))).toFixed(1);
function stats(x, sr) {
  let pk = 0, q = 0, clip = 0; for (const v of x) { const a = Math.abs(v); pk = Math.max(pk, a); q += v * v; if (a >= 0.999) clip++; }
  let quiet = 1; for (let s = 0; s + sr <= x.length; s += sr) { let w = 0; for (let i = s; i < s + sr; i++) w += x[i] * x[i]; quiet = Math.min(quiet, Math.sqrt(w / sr)); }
  return { sec: +(x.length / sr).toFixed(3), samples: x.length, peakDbfs: db(pk), rmsDbfs: db(Math.sqrt(q / Math.max(1, x.length))), quietest1sDbfs: db(quiet), clipped: clip };
}

(async () => {
  const sfx = fs.readFileSync(path.join(ROOT, 'sfx.js'), 'utf8');
  const browser = await chromium.launch();
  const report = {};
  let bad = 0;
  try {
    for (const id of ids) {
      const page = await browser.newPage();
      const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.setContent('<!doctype html><title>render</title>');
      // The stand-ins go in before sfx.js runs: its IIFE reads AudioContext once.
      await page.evaluate(() => {
        window.__ticks = [];
        const realSI = window.setInterval.bind(window);
        window.setInterval = (fn, ms) => { if (ms === 100) { window.__ticks.push(fn); return -1; } if (ms === 200) return -2; return realSI(fn, ms); };   // 100 = the music tick (driven below), 200 = the node sweep (not needed offline)
        window.clearInterval = () => {};
        window.__log = [];
        const OAC = window.OfflineAudioContext;
        window.AudioContext = function () {
          const ctx = new OAC(1, Math.ceil(window.__len * 44100), 44100);
          window.__oac = ctx;
          const mk = ctx.createOscillator.bind(ctx);
          ctx.createOscillator = () => { const o = mk(), f = o.frequency, set = f.setValueAtTime.bind(f), ramp = f.exponentialRampToValueAtTime.bind(f), rec = { type: null, hz: 0, at: 0, slide: false };
            f.setValueAtTime = (v, t) => { rec.hz = v; rec.at = t; rec.type = o.type; window.__log.push(rec); return set(v, t); };
            f.exponentialRampToValueAtTime = (v, t) => { rec.slide = true; return ramp(v, t); };
            return o; };
          // the game checks ac.state === 'running' before it plays: the offline context renders on startRendering(), so it reads as running
          return new Proxy(ctx, { get(t, k) { if (k === 'state') return 'running'; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }, set(t, k, v) { t[k] = v; return true; } });
        };
        window.webkitAudioContext = undefined;
        try { localStorage.removeItem('pixelpets.mute'); } catch (e) {}
      });
      const spec = await page.evaluate(([src, id, loops, lead]) => {
        (0, eval)(src + '\n;window.PPSound = PPSound;');
        const t = PPSound.musicSpec(id);
        if (!t) return null;
        const loopSec = t.bars * t.stepsPerBar * (60 / t.bpm) * 4 / t.stepsPerBar;
        window.__len = loops * loopSec + lead + 0.05;
        return Object.assign(t, { loopSec });
      }, [sfx, id, LOOPS, LEAD_IN]);
      if (!spec) { console.error(id + ': not in MUSIC'); bad++; await page.close(); continue; }
      const out = await page.evaluate(async ([id, loopSec, loops, near]) => {
        PPSound.setMusic(true, true);                       // the "gesture": ensure() makes the (offline) context and the master gain
        PPSound.music(id, { fadeIn: 0, near });             // a fresh cue: startTrack(id, 0, !near) schedules its first 0.3 s at once
        const ctx = window.__oac, end = window.__len;
        for (let t = 0.1; t < end - 0.01; t += 0.1) {
          const at = Math.round(t * 44100 / 128) * 128 / 44100;
          ctx.suspend(at).then(() => { for (const f of window.__ticks) f(); ctx.resume(); });
        }
        const buf = await ctx.startRendering();
        const d = buf.getChannelData(0);
        return { data: Array.from(d), swell: PPSound.musicSwell, log: window.__log.map(r => [r.at, r.hz, r.type, r.slide ? 1 : 0]) };
      }, [id, spec.loopSec, LOOPS, NEAR]);
      if (errs.length) { console.error(id + ': page errors: ' + errs.join(' | ')); bad++; }
      const start = Math.round(LEAD_IN * SR), N = LOOPS * Math.round(spec.loopSec * SR);
      const x = new Float64Array(N);
      for (let i = 0; i < N; i++) x[i] = (out.data[start + i] || 0) * BOOST;
      fs.mkdirSync(OUT, { recursive: true });
      const file = path.join(OUT, id + '.wav');
      wav(file, x);
      const back = readWav(file);
      const row = { file: path.relative(ROOT, file), near: NEAR, inGamePeakDbfs: null, loopSec: +spec.loopSec.toFixed(3), loops: LOOPS, swell: out.swell ? { from: out.swell.from, sec: out.swell.sec } : null, game: stats(back.x, back.sr) };
      // the notes the game scheduled (pitched tones; the kick's 120 Hz slide is a drum) against the cue's own data
      const stepSec = (60 / spec.bpm) * 4 / spec.stepsPerBar, total = spec.bars * spec.stepsPerBar;
      const midi = hz => Math.round(69 + 12 * Math.log2(hz / 440));
      const got = out.log.filter(r => !r[3] && r[0] >= LEAD_IN - 1e-6 && r[0] < LEAD_IN + LOOPS * spec.loopSec - 1e-6)
        .map(r => [Math.round((r[0] - LEAD_IN) / stepSec), midi(r[1]), r[2]].join(':')).sort();
      const want = [];
      for (let L = 0; L < LOOPS; L++) for (const v of ['lead', 'bass']) {
        const V = spec[v]; let s = 0;
        for (const [n, k] of V.notes) { if (n) { want.push([L * total + s, n, V.wave].join(':')); if (V.double) want.push([L * total + s, n + V.double, V.wave].join(':')); } s += k; }
      }
      want.sort();
      const same = got.length === want.length && got.every((g, i) => g === want[i]);
      row.inGamePeakDbfs = +(row.game.peakDbfs - 20 * Math.log10(BOOST)).toFixed(1);
      row.notes = { scheduled: got.length, expected: want.length, same };
      if (!same) { bad++; console.error(id + ': scheduled notes differ from the data (' + got.length + ' vs ' + want.length + ')'); }
      if (CMP) {
        const ref = path.resolve(ROOT, CMP, id + '.wav');
        if (fs.existsSync(ref)) {
          const R = readWav(ref), n = Math.min(R.x.length, N);
          row.reference = Object.assign({ file: ref, fileSec: +(R.x.length / R.sr).toFixed(3) }, stats(R.x.subarray(0, n), R.sr));
          row.delta = { peakDb: +(row.game.peakDbfs - row.reference.peakDbfs).toFixed(1), rmsDb: +(row.game.rmsDbfs - row.reference.rmsDbfs).toFixed(1),
            lengthSame: row.game.samples === n && R.x.length % N === 0 };
        } else row.reference = null;
      }
      report[id] = row;
      const r = row.reference;
      console.log(`${id.padEnd(13)} ${row.game.sec.toFixed(3)} s (${LOOPS} loop${LOOPS > 1 ? 's' : ''} of ${row.loopSec} s) peak ${row.game.peakDbfs} dBFS, RMS ${row.game.rmsDbfs} dBFS, ` +
        `quietest 1 s ${row.game.quietest1sDbfs}, clipped ${row.game.clipped}; notes ${row.notes.scheduled}/${row.notes.expected} ${same ? 'same' : 'DIFFER'}` +
        (row.swell ? `; swell from ${row.swell.from} over ${row.swell.sec} s` : '') +
        (r ? ` | reference (first ${LOOPS} loop${LOOPS > 1 ? 's' : ''}): ${r.sec.toFixed(3)} s, peak ${r.peakDbfs}, RMS ${r.rmsDbfs}, quietest 1 s ${r.quietest1sDbfs} | delta peak ${row.delta.peakDb} dB, RMS ${row.delta.rmsDb} dB` : ''));
      await page.close();
    }
  } finally { await browser.close(); }
  if (JSON_OUT) fs.writeFileSync(path.resolve(ROOT, JSON_OUT), JSON.stringify(report, null, 1) + '\n');
  process.exit(bad ? 1 : 0);
})();
