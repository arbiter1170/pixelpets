/* Kindle Wild - game logic. No dependencies. (Identifiers keep the old name: window.PixelPets, pixelpets.* storage keys.) */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const now = () => performance.now();

// Save: format v2 in `pixelpets.save.v2` (see save.js; v1 saves are migrated once, the v1 key is never written).
// EVO_XP (growth XP to evolve: 40 / 120) lives in stats.js, shared with save.js.
const EVO_CARE = [50, 60];         // min average care (food/joy/energy) to evolve
/* Stat decay. Real-time pacing is the default: hours for a stat to drain 100 -> 0.
   From full, a stat drops below the 25 "needs attention" line after 75% of these hours
   (food ~12h, joy ~15h, energy ~18h). Hunger < 20 still doubles joy loss. */
const HOURS_TO_EMPTY = { hunger: 16, happy: 20, energy: 24 };
const perSec = h => 100 / (h * 3600);
const REAL_RATE = { hunger: perSec(HOURS_TO_EMPTY.hunger), happy: perSec(HOURS_TO_EMPTY.happy), energy: perSec(HOURS_TO_EMPTY.energy) };
const FAST_RATE = { hunger: 1/10, happy: 1/12, energy: 1/25 };   // old demo pacing (pts/s): full -> starving in ~17 min
const OFFLINE_FLOOR = 10;          // catch-up decay never pushes a stat below this
const FAST_KEY = 'pixelpets.fast'; // debug fast mode, kept out of the save schema
const DEBUG_KEY = 'pixelpets.debug';   // ?debug=1 turns debug tools on (remembered), ?debug=0 off
function readDebugPref(){
  let on = false;
  try { on = localStorage.getItem(DEBUG_KEY) === '1'; } catch(e) {}
  const q = new URLSearchParams(location.search).get('debug');
  if (q !== null) { on = q === '1' || q === 'true'; try { if (on) localStorage.setItem(DEBUG_KEY, '1'); else localStorage.removeItem(DEBUG_KEY); } catch(e) {} }
  return on;
}
const DEBUG = readDebugPref();     // E/G/F keys, fast mode, "Pick a place" and the cheat console hooks need this
let fastMode = false;
const rate = () => fastMode ? FAST_RATE : REAL_RATE;   // points lost per second, every owned pet

/* Care balance. Cooldowns are per pet, stored as last-use Date.now() stamps in p.cd (missing = ready),
   so reloading can't skip them. Fast mode shrinks them by the same ratio as the food rate (~1/57.6). */
const CARE_CD_MIN = { feed: 20, play: 10, rest: 15 };            // real-mode cooldown, minutes (REST 15m: BATTLE §7.3 Q1, Vincent)
const FAST_CD_SCALE = REAL_RATE.hunger / FAST_RATE.hunger;       // ~0.0174: 20m -> ~21s, 10m -> ~10s, 15m REST -> ~16s
const CARE_XP = { feed: 2, play: 5, rest: 1 };                   // XP per care action (before the daily cap)
const CARE_XP_DAILY_CAP = 25;      // per pet per local calendar day (feed/play/rest)
const STEPS_PER_XP = 5;            // walking: 1 XP per 5 steps, remainder kept per pet in p.sr
const BEFRIEND_XP = 5;             // shares the explore cap below
const EXPLORE_XP_DAILY_CAP = 30;   // per pet per local day, shared by walking + befriending XP (p.ex)
const STEP_MS = 170;
const STEP_NRG = 0;               // walking no longer drains NRG (FOOD per step still applies)
const STEP_FOOD = 0.15;           // FOOD per step (unchanged)

/* ---------- sprites & tiles ---------- */
const SPR = SPECIES.map(sp => sp.stages.map(st => ({
  n: buildSprite(st.half, st.col, 'normal'),
  b: buildSprite(st.half, st.col, 'blink'),
  w: buildSprite(st.half, st.col, PAL.w),
  s: buildSprite(st.half, st.col, PAL.m),
  u: sp.uiHalo ? haloSprite(buildSprite(st.half, st.col, 'normal'), PAL.h) : null,
})));
// Light 1px ring around the outline so dark-bodied species read on the dark UI cells (map art unchanged).
function haloSprite(src, col){
  const c = document.createElement('canvas'); c.width = c.height = 18; const g = c.getContext('2d');
  const d = src.getContext('2d').getImageData(0, 0, 18, 18).data, A = (x, y) => x >= 0 && y >= 0 && x < 18 && y < 18 && d[(y * 18 + x) * 4 + 3] > 0;
  g.fillStyle = col;
  for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) if (!A(x, y) && (A(x-1, y) || A(x+1, y) || A(x, y-1) || A(x, y+1))) g.fillRect(x, y, 1, 1);
  g.drawImage(src, 0, 0); return c;
}
const TILES = buildTiles();

function ctx(c){ const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return g; }
function iconCanvas(c, grid, color){ const g = ctx(c); g.clearRect(0,0,c.width,c.height); g.fillStyle = color;
  grid.forEach((row,y) => [...row].forEach((ch,x) => { if (ch === '#') g.fillRect(x,y,1,1); })); }
// UI sprite (header, collection, dex, starter): dark species get their halo version on these dark cells.
function spriteCanvas(c, sp, stage, mode='n'){ const g = ctx(c), s = SPR[sp][stage]; g.clearRect(0,0,c.width,c.height); g.drawImage(mode === 'n' && s.u ? s.u : s[mode], 0, 0); }

/* ---------- state ---------- */
let S = null;
const rid = n => Array.from({length:n}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.random()*36|0]).join('');
// Saved pets name their species by stable string id (`species`); runtime-only things (sprites, wild creatures,
// encounters) keep using the SPECIES array index. spIndex/spi convert.
const SP_INDEX = Object.fromEntries(SPECIES.map((sp, i) => [sp.id, i]));
const spIndex = id => SP_INDEX[id];
const spi = p => SP_INDEX[p.species];
// lv = starting Level (battle XP): starters Lv 5, befriended wild creatures their own level.
function newPet(sp, stage=0, origin='wild', lv=STAT_RULES.STARTER_LEVEL){   // BATTLE §3.3: moves = defaultMoves(form, lv), evoMoves = [1..stage]
  return { id: rid(8), species: SPECIES[sp].id, stage, nick: null, origin, xp: stage ? EVO_XP[stage-1] : 0, bx: STAT_RULES.bxForLevel(lv), hunger: 80, happy: 80, energy: 90, met: Date.now(),
    moves: defaultMoves(SPECIES[sp].id + '/' + stage, lv), evoMoves: Array.from({ length: stage }, (_, i) => i + 1) };
}
let readOnly = false;              // a save from a newer build: play nothing, write nothing
function save(){ if (!S || readOnly) return; S.last = Date.now(); PPSave.writeV2(S); }
const allPets = () => [...S.party, ...S.box];
const pet = () => S.party.find(p => p.id === S.partnerId);
const nameOf = (sp, st) => SPECIES[sp].stages[st].name;
// Nicknames (CREATURES_SLICE §6): optional, offered after a befriend. Cleaned for display only; the saved string is never rewritten.
const NICK_MAX = 10;
const cleanNick = v => typeof v === 'string' ? v.normalize('NFKC').replace(/[^A-Za-z0-9 '.!?-]/g, '').replace(/\s+/g, ' ').trim().slice(0, NICK_MAX).trim() : '';
const petName = p => cleanNick(p.nick) || nameOf(spi(p), p.stage);
// Level comes from battle XP (p.bx, stats.js levelOf); growth XP (p.xp) only drives evolution.
const care = p => Math.round((p.hunger + p.happy + p.energy) / 3);
const canEvolve = p => p.stage < 2 && p.xp >= EVO_XP[p.stage] && care(p) >= EVO_CARE[p.stage];
const formOf = (sp, st) => SPECIES[sp].id + '/' + st;
const markSeen = (sp, st) => { S.dex.seen[formOf(sp, st)] = true; };
const markCaught = (sp, st) => { S.dex.seen[formOf(sp, st)] = S.dex.caught[formOf(sp, st)] = true; };

/* ---------- UI helpers ---------- */
const sfx = (name, delay) => { try { PPSound.play(name, delay); } catch(e) {} };
function renderSettingsGear(){
  const b = $('#settingsBtn');
  iconCanvas($('#settingsIcon'), ICONS.gear, PAL.y);
  b.setAttribute('aria-label', 'Settings'); b.title = 'Settings';
}
function renderSoundRow(){
  const m = PPSound.muted, b = $('#setSound');
  if (!b) return;
  b.setAttribute('aria-pressed', m ? 'false' : 'true');
  $('#setSoundVal').textContent = m ? 'OFF' : 'ON';
}
function renderFollowerBtn(){
  const on = !!(S && S.settings.follower !== false), b = $('#setFollower');
  if (!b) return;
  b.setAttribute('aria-pressed', String(on));
  $('#setFollowerVal').textContent = on ? 'ON' : 'OFF';
}
function openSettings(){
  if (overlayOpen() && $('#ovSettings').hidden) return;
  if (!$('#ovSettings').hidden) return;
  clearMoves(); renderSoundRow(); renderFollowerBtn();
  $('#ovSettings').hidden = false; lockTabs(true); sfx('tap');
  $('#setClose').focus({ preventScroll: true });
}
function closeSettings(){
  if ($('#ovSettings').hidden) return;
  $('#ovSettings').hidden = true; lockTabs(false);
}
let toastT = 0;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }

/* ---------- debug fast mode (?fast=1, F key, PixelPets.setFast) ---------- */
function readFastPref(){
  if (!DEBUG) return false;                    // fast mode is a debug tool: ignored (not stored) without ?debug=1
  let on = false;
  try { on = localStorage.getItem(FAST_KEY) === '1'; } catch(e) {}
  const q = new URLSearchParams(location.search).get('fast');   // ?fast=1 turns it on, ?fast=0 off (and remembers)
  if (q !== null) { on = q === '1' || q === 'true'; storeFastPref(on); }
  return on;
}
function storeFastPref(on){ try { if (on) localStorage.setItem(FAST_KEY, '1'); else localStorage.removeItem(FAST_KEY); } catch(e) {} }
function renderFastTag(){ $('#fastTag').hidden = !fastMode; }
function setFast(on, quiet){
  if (!DEBUG) return false;
  fastMode = !!on; storeFastPref(fastMode); renderFastTag();
  if (!quiet) toast(fastMode ? 'FAST MODE ON (debug decay)' : 'Fast mode off: real-time pacing');
  return fastMode;
}

let screen = 'pet';
function showTab(name){
  if (overlayOpen()) return;
  screen = name;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + name));
  $$('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  clearMoves();
  if (name === 'col') renderCollection();
  if (name === 'friends') { $('#friendCode').textContent = friendCode(); renderKeeperName(); }
  fitAll();
  if (name === 'walk' && !PPEnv.geoPref()) openGeoAsk();     // first Walk visit: ask about location (once)
}
const overlayOpen = () => !$('#ovBattle').hidden || !$('#ovSheet').hidden || !$('#ovEvolve').hidden || !$('#ovStarter').hidden || !$('#ovGeo').hidden || !$('#ovEnv').hidden || !$('#ovStats').hidden || !$('#ovReset').hidden || !$('#ovLook').hidden || !$('#ovSettings').hidden;

/* integer-scale canvases to fit their container */
function fitCanvas(c, maxW, maxH){
  let s = Math.min(maxW / c.width, maxH / c.height);
  s = s >= 1 ? Math.floor(s) : s;
  c.style.width = (c.width * s) + 'px'; c.style.height = (c.height * s) + 'px';
}
// Pet tab scene (fix for side bars on iPhone): the pixel canvas is widened to the frame's aspect ratio so it fills the full
// width with no dark side bars, at a crisp integer scale. Height is a little taller than the old 56-square (up to 64) when it
// still fits; short phones (320x568) step the scale/height down so the care buttons stay on screen without scrolling.
function setPetCanvas(s, H){
  const wrap = $('.pet-scene'), pc = $('#petCanvas');
  const frameW = Math.max(56, (wrap && wrap.clientWidth) || (Math.min(window.innerWidth, 480) - 12));
  const W = Math.max(56, Math.ceil(frameW / s));   // canvas CSS width >= frame; the wrap crops the < 1-cell excess
  if (pc.width !== W || pc.height !== H) { pc.width = W; pc.height = H; }
  pc.style.width = (W * s) + 'px'; pc.style.height = (H * s) + 'px';
}
function fitPetScene(){
  const ps = $('#scr-pet'), wrap = $('.pet-scene');
  const frameW = Math.max(56, (wrap && wrap.clientWidth) || (Math.min(window.innerWidth, 480) - 12));
  // Target a scene about as tall as the old square (or a bit taller), never a near-square at huge scale.
  const targetCssH = Math.max(168, Math.min(window.innerHeight * 0.40, 288));  // a bit taller now that CHANGE LOOK / FOLLOWER left the Pet tab
  const cands = [];
  for (let s = 4; s >= 2; s--) {
    for (const H of [64, 60, 56]) {
      if (H * s > targetCssH + 24) continue;         // keep the display near the target height
      if (Math.ceil(frameW / s) < 72 && s > 2) continue; // prefer a wide bitmap (not a near-square)
      cands.push([s, H]);
    }
  }
  if (!cands.length) {
    for (let s = 3; s >= 2; s--) for (const H of [64, 60, 56]) if (H * s <= targetCssH + 40) cands.push([s, H]);
  }
  if (!cands.length) cands.push([2, 56]);
  // Prefer taller display, then larger scale, then wider fill.
  cands.sort((a, b) => (b[1] * b[0] - a[1] * a[0]) || (b[1] - a[1]) || (b[0] - a[0]));
  if (!(ps.classList.contains('active') && ps.clientHeight)) return setPetCanvas(...cands[0]);
  const fitsAll = () => ps.scrollHeight - ps.clientHeight <= 0;
  const careOn = () => { const a = ps.querySelector('.actions'); return !a || a.getBoundingClientRect().bottom <= ps.getBoundingClientRect().bottom; };
  for (const c of cands) { setPetCanvas(...c); if (fitsAll()) return; }
  // Prefer the tallest size that keeps care buttons on screen (allow a few px of scrollHeight slack on short phones).
  for (const c of cands) { setPetCanvas(...c); if (careOn()) return; }
  setPetCanvas(...cands[cands.length - 1]);
}
function fitAll(){ fitBattle();
  const appW = Math.min(window.innerWidth, 480) - 36;
  fitPetScene();
  fitCanvas($('#evoCanvas'), appW - 28, window.innerHeight * 0.4);
  const mw = $('#mapWrap');
  if (screen === 'walk' && mw.clientWidth) {           // fill the map area at a crisp integer scale
    const c = $('#mapCanvas'), W = mw.clientWidth, H = mw.clientHeight;
    const s = W >= 176 ? Math.floor(W / 176) : W / 176;
    c.width = Math.min(24 * 16, Math.floor(W / s)); c.height = Math.min(20 * 16, Math.max(64, Math.floor(H / s)));
    c.style.width = (c.width * s) + 'px'; c.style.height = (c.height * s) + 'px';
  }
}
window.addEventListener('resize', fitAll);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitAll());   // re-measure once the pixel font has loaded (text heights change)

function setBar(el, v){ el.style.width = clamp(v,0,100) + '%'; el.classList.toggle('low', v < 25); }
function updateHUD(){
  const p = pet(); if (!p) return;
  const st = SPECIES[spi(p)].stages[p.stage];
  $('#hdrName').textContent = cleanNick(p.nick) || st.name;
  $('#hdrLv').textContent = 'Lv ' + levelOf(p);
  $('#hdrStage').textContent = '\u2605'.repeat(p.stage + 1) + '\u2606'.repeat(2 - p.stage);
  spriteCanvas($('#hdrIcon'), spi(p), p.stage);
  setBar($('#barHunger'), p.hunger); $('#valHunger').textContent = Math.round(p.hunger);
  setBar($('#barHappy'), p.happy);   $('#valHappy').textContent = Math.round(p.happy);
  setBar($('#barEnergy'), p.energy); $('#valEnergy').textContent = Math.round(p.energy);
  setBar($('#wBarEnergy'), p.energy);
  const goal = p.stage < 2 ? EVO_XP[p.stage] : Math.max(EVO_XP[1], p.xp);
  const base = p.stage === 0 ? 0 : EVO_XP[p.stage-1];
  const xpPct = p.stage < 2 ? (p.xp - base) / (goal - base) * 100 : 100;
  $('#barXp').style.width = clamp(xpPct,0,100) + '%'; $('#valXp').textContent = p.xp;
  $('#wXp').textContent = p.xp; $('#wSteps').textContent = S.steps;
  const cx = xpToday(p, 'cx'), ex = xpToday(p, 'ex');
  const setCount = (el, v, cap) => { const txt = v + '/' + cap; if (el.textContent !== txt) el.textContent = txt; el.classList.toggle('maxed', v >= cap); };
  setCount($('#dCare'), cx, CARE_XP_DAILY_CAP); setCount($('#dExp'), ex, EXPLORE_XP_DAILY_CAP); setCount($('#wExp'), ex, EXPLORE_XP_DAILY_CAP);
  const hint = $('#evoHint'), btn = $('#evolveBtn');
  if (p.stage >= 2) { hint.textContent = 'Final form! Keep exploring.'; hint.classList.remove('ready'); btn.hidden = true; }
  else if (canEvolve(p)) { hint.textContent = st.name + ' is ready to evolve!'; hint.classList.add('ready'); btn.hidden = false; }
  else { hint.textContent = 'Next form: GROW ' + p.xp + '/' + EVO_XP[p.stage] + '  CARE ' + care(p) + '/' + EVO_CARE[p.stage]; hint.classList.remove('ready'); btn.hidden = true; }
  updateCareButtons(); renderPetBadge(p);
}
// FAINTED 12m / TIRED on the Pet tab (BATTLE §7 badges); GLOWING stays on the stats card.
function renderPetBadge(p){
  const el = $('#petBadge'); if (!el) return; const b = hpBadge(p);
  el.hidden = !b; if (!b) return;
  if (el.textContent !== b) el.textContent = b; el.className = 'scene-badge ' + (b === 'TIRED' ? 'tired' : 'fainted');
}

/* ---------- care balance helpers ---------- */
const cdMs = act => CARE_CD_MIN[act] * 60000 * (fastMode ? FAST_CD_SCALE : 1);
function cdLeft(p, act){                     // ms until `act` is ready again for pet p (0 = ready)
  const last = p.cd && +p.cd[act]; if (!last) return 0;
  return clamp(last + cdMs(act) - Date.now(), 0, cdMs(act));   // clamp guards against clock changes
}
function fmtCd(ms){
  const sec = Math.ceil(ms / 1000);
  return sec >= 60 ? Math.ceil(sec / 60) + 'm' : '0:' + String(sec).padStart(2, '0');
}
// Diminishing returns, band by band: the part of a gain that lands below 50 counts in full, 50-80 at half,
// above 80 at a quarter. FEED (+25) from 49 / 50 / 51 ends at 62 / 62.5 / 63.5: no jump at the band edges.
const GAIN_BANDS = [[50, 1], [80, 0.5], [Infinity, 0.25]];
function careGain(base, cur){
  let v = cur, left = base;
  for (const [top, k] of GAIN_BANDS) {
    if (left <= 0) break;
    if (v >= top) continue;
    const need = (top - v) / k;               // base points it takes to fill this band
    if (left <= need) { v += left * k; left = 0; } else { v = top; left -= need; }
  }
  return v - cur;
}
function dayKey(ms){ const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
// Daily XP records on the pet: p.cx (care) and p.ex (explore), each { d: 'YYYY-MM-DD' (local), xp: earned that day,
// told: cap toast shown }. Missing or from another day = fresh record, so old saves just work.
function dailyRec(p, k){
  const d = dayKey(Date.now());
  if (!p[k] || typeof p[k] !== 'object' || p[k].d !== d) p[k] = { d, xp: 0, told: false };
  return p[k];
}
const xpToday = (p, k) => (p[k] && typeof p[k] === 'object' && p[k].d === dayKey(Date.now())) ? +p[k].xp || 0 : 0;   // read-only (HUD)
const careXpToday = p => dailyRec(p, 'cx');
const exploreXpToday = p => dailyRec(p, 'ex');
// Gives up to `n` growth XP under a daily cap. Returns the XP actually granted. (Growth XP never changes the Level.)
function grantCapped(p, k, cap, n){
  const r = dailyRec(p, k), g = clamp(cap - r.xp, 0, n);
  r.xp += g; p.xp += g;
  return g;
}
let xpChimeDelay = 0;                        // lets a fanfare finish before the cap chime
// Battle XP (from battles only; the battle build calls this per defeated/befriended foe). Uncapped per day, stops at
// Lv 50. A level-up plays the chime and says so. Never touches xp/cx/ex. Returns { gained, from, to }.
function grantBattleXp(p, n, quiet){   // quiet: the battle shows its own level-up lines in RESULTS
  const from = levelOf(p), before = p.bx;
  p.bx = clamp(before + Math.max(0, Math.round(n) || 0), 0, BX_CAP);
  const to = levelOf(p);
  if (to > from && !quiet) { sfx('levelup', xpChimeDelay); toast(petName(p) + ' grew to Lv ' + to + '!'); }
  return { gained: p.bx - before, from, to };
}
const grantCareXp = (p, n) => grantCapped(p, 'cx', CARE_XP_DAILY_CAP, n);
// Explore XP (walking + befriending). Shows the one-time "explored enough" toast when the cap is reached.
function grantExploreXp(p, n){
  const g = grantCapped(p, 'ex', EXPLORE_XP_DAILY_CAP, n), r = exploreXpToday(p);
  if (r.xp >= EXPLORE_XP_DAILY_CAP && !r.told) { r.told = true; sfx('cap', xpChimeDelay + 0.3); toast(petName(p) + ' has explored enough for today. Rest up!'); }
  return g;
}
const CD_MSG = { feed: ' is still digesting. Feed again in ', play: ' needs a breather. Play again in ', rest: " isn't sleepy yet. Rest again in " };
const BTN_LABEL = { feed: 'FEED', play: 'PLAY', rest: 'REST' };
function updateCareButtons(){
  const p = pet(); if (!p) return;
  $$('[data-act]').forEach(b => {
    const act = b.dataset.act, left = cdLeft(p, act), cd = left ? fmtCd(left) : '';
    if (b.dataset.cd !== cd) {               // label on top, countdown on a small second line (fits 320px phones)
      b.dataset.cd = cd; b.textContent = BTN_LABEL[act];
      if (cd) { const sm = document.createElement('small'); sm.className = 'cdt'; sm.textContent = cd; b.append(sm); }
      b.setAttribute('aria-label', cd ? BTN_LABEL[act] + ', ready in ' + cd : BTN_LABEL[act]);
    }
    b.classList.toggle('cooldown', !!left); b.setAttribute('aria-disabled', left ? 'true' : 'false');
  });
}

/* ---------- pet care ---------- */
const anim = { busyUntil: 0, jumpUntil: 0, sleepUntil: 0, parts: [] };
function addPart(type, x, y, vx=0, vy=-8, life=1.2){ anim.parts.push({ type, x, y, vx, vy, life, max: life }); }
const PET_H = 64, GROUND = PET_H - 14;                  // max logical height of the Pet tab scene (56..64, see fitPetScene)
function petPos(t){ const c = $('#petCanvas'), W = (c && c.width) || 56, H = (c && c.height) || 56, x = Math.round((W - 16) / 2 + Math.sin(t / 2200) * 7); return { x, y: H - 14 - 7 }; }

function doAction(act){
  const p = pet(); const t = now();
  if (t < anim.busyUntil) return;
  const left = cdLeft(p, act);
  if (left) { sfx('denied'); return toast(petName(p) + CD_MSG[act] + fmtCd(left) + '.'); }
  const pp = petPos(t);
  let msg;
  if (act === 'feed') {
    if (p.hunger >= 98) { sfx('denied'); return toast('Too full to eat!'); }
    p.hunger = clamp(p.hunger + careGain(25, p.hunger), 0, 100); p.happy = clamp(p.happy + 3, 0, 100);
    addPart('apple', pp.x + 6, pp.y - 4, 0, 4, 0.9);
    setTimeout(() => { for (let i=0;i<3;i++) addPart('heart', pp.x + 2 + i*5, pp.y, (i-1)*4, -10); }, 600);
    anim.busyUntil = t + 1100; msg = 'Yum! +FOOD';
  } else if (act === 'play') {
    if (isFainted(p)) { sfx('denied'); return toast(petName(p) + ' fainted and needs rest. REST, or wait ' + faintMinLeft(p) + 'm.'); }   // BATTLE §7.2
    if (p.energy < 10) { sfx('denied'); return toast('Too tired to play. REST first!'); }
    p.happy = clamp(p.happy + careGain(20, p.happy), 0, 100); p.energy = clamp(p.energy - 8, 0, 100); p.hunger = clamp(p.hunger - 4, 0, 100);
    anim.jumpUntil = t + 1200; anim.busyUntil = t + 1200;
    for (let i=0;i<4;i++) addPart(i%2 ? 'heart' : 'spark', pp.x + 1 + i*4, pp.y + 2, (i-1.5)*6, -14);
    msg = 'Wheee! +JOY';
  } else if (act === 'rest') {
    const hurt = Number.isFinite(p.hpNow) || isFainted(p);   // REST also restores 50% of max HP and clears Fainted (BATTLE §7.2)
    if (p.energy >= 98 && !hurt) { sfx('denied'); return toast('Not sleepy right now.'); }
    p.energy = clamp(p.energy + careGain(30, p.energy), 0, 100); p.hunger = clamp(p.hunger - 5, 0, 100);
    restPet(p, 'pet');
    anim.sleepUntil = t + 3000; anim.busyUntil = t + 3000; msg = 'Zzz... +ENERGY' + (hurt ? ' +HP' : '');
  } else return;
  if (!p.cd || typeof p.cd !== 'object') p.cd = {};
  p.cd[act] = Date.now();                    // start this action's cooldown (saved with the pet)
  sfx(act); xpChimeDelay = 0.45;
  const xp = grantCareXp(p, CARE_XP[act]), cx = careXpToday(p); xpChimeDelay = 0;
  if (cx.xp >= CARE_XP_DAILY_CAP && !cx.told) { cx.told = true; sfx('cap', 0.6); msg = petName(p) + ' learned all it can from care today. Go for a walk!'; }
  else if (act === 'play' && xp) msg += ' +' + xp + 'XP';
  toast(msg);
  updateHUD(); save();
}

const bgCache = {};
function makePetBg(H){
  if (bgCache[H]) return bgCache[H];
  const c = document.createElement('canvas'); c.width = 56; c.height = H; const g = ctx(c), G = H - 14;
  g.fillStyle = PAL.c; g.fillRect(0,0,56,H); g.fillStyle = PAL.s; g.fillRect(0,G-12,56,10);
  g.fillStyle = PAL.y; g.fillRect(45,4,6,6); g.fillStyle = PAL.w; g.fillRect(46,5,2,2);
  for (let x=0;x<56;x++){ const h = Math.round(4 + Math.sin(x/6)*2 + Math.sin(x/2.3)); g.fillStyle = PAL.l; g.fillRect(x, G-h, 1, h); }
  g.fillStyle = PAL.g; g.fillRect(0,G,56,14);
  const r = rng(9); for (let i=0;i<40;i++){ g.fillStyle = r()<.5 ? PAL.l : PAL.t; g.fillRect(r()*56|0, G + 1 + (r()*13|0), 1, 1); }
  return (bgCache[H] = c);
}
/* ---------- Pet tab backdrop (MAPS_SLICE §11.1) ---------- */
// Each map names the outdoor scene the Pet tab draws behind the pet. Today's only map (proto, the future Old Meadow) is a
// meadow; a missing or unknown value falls back to meadow. The scene gets the same time-of-day/weather tint as the Walk map
// (envTags() + drawWeather), and stays while an overlay/panel is open (the outdoor scene doesn't change).
const MAP_INFO = { proto: { name: 'Old Meadow', backdrop: 'meadow' } };
const BACKDROPS = ['town', 'route', 'meadow', 'grove'];
function backdropName(){ const b = ((S && MAP_INFO[S.world.map]) || {}).backdrop; return BACKDROPS.includes(b) ? b : 'meadow'; }
function skyMode(tags = envTags()){
  const has = k => tags.includes(k), dull = has('rain') || has('storm') || has('snow') || has('fog');
  return (has('night') ? 'night' : 'day') + (dull ? '-dull' : '');      // day | day-dull | night | night-dull
}
const bdCache = {};
function makeBackdrop(kind, H, mode, W = 56){
  W = Math.max(56, W | 0); H = H | 0;
  const key = kind + '|' + W + 'x' + H + '|' + mode; if (bdCache[key]) return bdCache[key];
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = ctx(c), G = H - 14;
  const night = mode.startsWith('night'), dull = mode.endsWith('dull'), r = rng(kind.length * 7 + 3 + W);
  const P = (col, x, y, w = 1, h = 1) => { g.fillStyle = PAL[col]; g.fillRect(x, y, w, h); };
  P(night ? 'n' : dull ? 'h' : 'c', 0, 0, W, G);                                   // sky
  P(night ? 'b' : dull ? 'w' : 's', 0, G - 12, W, 10);                            // horizon band
  if (!dull && !night) { P('y', W - 11, 4, 6, 6); P('w', W - 10, 5, 2, 2); }       // sun (right side)
  if (!dull && night) { P('w', W - 11, 4, 5, 5); P('n', W - 9, 3, 4, 4);           // moon
    for (let i = 0; i < Math.max(6, W / 9 | 0); i++) P('w', (r() * W) | 0, 2 + (r() * (G - 16) | 0)); }
  const hills = col => { for (let x = 0; x < W; x++) { const h = Math.round(4 + Math.sin(x/6)*2 + Math.sin(x/2.3)); P(col, x, G - h, 1, h); } };
  const nDots = Math.max(40, (W * 40 / 56) | 0);
  const ground = (base, a, b) => { P(base, 0, G, W, H - G); for (let i = 0; i < nDots; i++) P(r() < .5 ? a : b, r()*W|0, G + 1 + (r()*(H - G - 1)|0)); };
  const tree = (x, y) => { P('k', x + 4, y + 9, 3, 6); P('p', x + 5, y + 9, 1, 6);
    for (let j = 0; j < 10; j++) for (let i = 0; i < 11; i++) { const d = (i - 5) ** 2 + (j - 4.5) ** 2; if (d <= 26) P(d > 18 ? 'k' : (i - 4) ** 2 + (j - 3) ** 2 <= 5 ? 'g' : 't', x + i, y + j); } };
  if (kind === 'town') {
    const buildings = []; for (let x = 1; x < W - 12; ) { const w = 9 + (r() * 6 | 0), h = 7 + (r() * 8 | 0); buildings.push([x, h, w]); x += w + 1 + (r() * 3 | 0); }
    buildings.forEach(([x, h, w]) => { const top = G - h;
      P('h', x, top, w, h); for (let k = 0; k <= w / 2; k++) P('r', x + k, top - Math.ceil(w / 2) + k, w - 2 * k, 1);
      P(night ? 'y' : 'n', x + 2, top + 3, 2, 2); if (w > 10) P(night ? 'y' : 'n', x + w - 4, top + 3, 2, 2); });
    ground('g', 'l', 't'); P('y', 0, G + 6, W, 5); for (let i = 0; i < Math.max(12, W / 5 | 0); i++) P(r() < .6 ? 'o' : 'w', r()*W|0, G + 6 + (r()*5|0));
    P('d', W - 6, G - 14, 1, 20); P('k', W - 8, G - 17, 5, 4); P(night ? 'w' : 'y', W - 7, G - 16, 3, 2);
    if (night) { g.fillStyle = 'rgba(255,205,117,.35)'; g.fillRect(W - 11, G - 20, 11, 10); }
  } else if (kind === 'route') {
    hills('l'); ground('g', 'l', 't');
    for (let x = 0; x < W; x++) P('y', x, G + 4 + Math.round(Math.sin(x / 9) * 1.5), 1, 5);
    for (let i = 0; i < Math.max(9, W / 6 | 0); i++) P('o', r()*W|0, G + 5 + (r()*3|0));
    [[0, 9], [W - 12, 12]].forEach(([x0, w]) => { for (let x = x0; x < x0 + w; x += 2) { P('t', x, G - 4, 2, 4); P('l', x + 1, G - 6, 1, 4); P('g', x, G - 3, 1, 3); } });
  } else if (kind === 'grove') {
    P('t', 0, G - 18, W, 6); for (let x = -2; x < W; x += 7) { P('k', x + 1, G - 14, 4, 14); P('p', x + 2, G - 14, 2, 14); }
    for (let x = -4; x < W + 2; x += 6) { P('t', x, G - 22, 8, 6); P('g', x + 2, G - 21, 3, 2); }
    ground('t', 'g', 'k');
  } else {                                                                           // meadow: hills, flowers and a tree
    hills('l'); ground('g', 'l', 't'); tree(1, G - 14);
    const flowers = [[18, 2, 'w'], [30, 8, 'y'], [42, 3, 'r'], [50, 9, 'w'], [8, 10, 'y']];
    for (let x = 56; x < W - 4; x += 12) flowers.push([x, 2 + (r() * 8 | 0), r() < .5 ? 'w' : 'y']);
    flowers.forEach(([x, y, col]) => { if (x >= W) return; P(col, x - 1, G + y); P(col, x + 1, G + y); P(col, x, G + y - 1); P(col, x, G + y + 1); P('y', x, G + y); });
  }
  return (bdCache[key] = c);
}
function drawParticles(g, dt){
  anim.parts = anim.parts.filter(pt => (pt.life -= dt) > 0);
  for (const pt of anim.parts){
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    if (pt.type === 'apple') { if (pt.life > 0.3) drawGlyph(g, 'apple', pt.x, pt.y); }
    else if (pt.life > 0.15 || (pt.life*20|0) % 2) drawGlyph(g, pt.type, pt.x, pt.y);
  }
}
function drawPetScene(t, dt){
  const c = $('#petCanvas'), g = ctx(c), p = pet(); if (!p) return;
  const W = c.width, H = c.height, mode = skyMode();
  g.drawImage(makeBackdrop(backdropName(), H, mode, W), 0, 0);
  if (mode !== 'night') {
    const span = W + 24;
    drawGlyph(g, 'cloud', ((t / 120) % span) - 12, 6);
    drawGlyph(g, 'cloud', ((t / 180 + span / 2) % span) - 12, 12);
  }
  const sleeping = t < anim.sleepUntil;
  let { x, y } = petPos(sleeping ? anim.sleepUntil : t);
  let bob = Math.floor(t / 400) % 2;
  if (t < anim.jumpUntil) bob = -Math.round(Math.abs(Math.sin((anim.jumpUntil - t) / 1200 * Math.PI * 3)) * 7);
  if (sleeping) bob = 0;
  g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(x + 3, y + 17, 12, 2);
  const blink = sleeping || (t % 3200) < 140;
  g.drawImage(SPR[spi(p)][p.stage][blink ? 'b' : 'n'], x, y + bob);
  if (!sleeping && (p.hunger < 25 || p.happy < 25 || p.energy < 25) && Math.floor(t/500)%2) drawGlyph(g, 'bang', x + 16, y - 2);
  drawWeather(g, W, H, t, 0.18);                   // same night/fog/rain/storm/snow tint as the Walk map
  if (sleeping) {
    g.fillStyle = 'rgba(41,54,111,.55)'; g.fillRect(0, 0, W, H);
    g.fillStyle = PAL.w; g.fillRect(8, 5, 4, 4); g.fillStyle = PAL.k; g.fillRect(10, 5, 2, 2);
    if (Math.random() < dt * 2.5) addPart('z', x + 12, y, 3, -6, 1.4);
  }
  drawParticles(g, dt);
}

/* ---------- walk / map ---------- */
const MAP_SRC = [
  'TTTTTTTTTTTTTTTTTTTTTTTT',
  'TggggggttttgggTTggggtttT',
  'TgfgggtttttggggggfgttttT',
  'TggppppppppppppppgggtttT',
  'TggpggggggggwwwgpgggggTT',
  'TttpgTTggfggwwwgpggtttgT',
  'TttpgTggggggwwwwpggttttT',
  'TttpggggttttgwwgpggttttT',
  'TggpggggttttggggpgggggTT',
  'TggpppppppppppppppppgggT',
  'TfggggggpgggggggggfpgggT',
  'TgtttgggpgggTTgggggpgtgT',
  'TgttttggpgggTTggwwwpttgT',
  'TgttttggpggggggwwwwpttgT',
  'TggtttggpgfggggwwwgpggTT',
  'TgggggggppppppppppppgggT',
  'TTggfgggggtttttggggggggT',
  'TggggTTgggttttttgggfgggT',
  'TggggggggggtttggggggTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTT'];
const MAP = MAP_SRC.map(r => (r + 'T'.repeat(24)).slice(0, 24).split(''));
const MW = 24, MH = MAP.length, TS = 16;
const solid = (x,y) => x<0 || y<0 || x>=MW || y>=MH || MAP[y][x] === 'T' || MAP[y][x] === 'w';
const DIRS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
const walk = { fx: 3, fy: 3, from: null, to: null, prog: 0, dpad: null, drag: null, key: null, queued: null, target: null,
  intro: 0, cam: { x: 0, y: 0 } };
function clearMoves(){ walk.dpad = walk.drag = walk.key = walk.queued = walk.target = null; wild.chase = null; $$('.dp').forEach(b => b.classList.remove('on')); }

function targetDir(){
  const tg = walk.target; if (!tg) return null;
  const dx = tg.x - S.world.x, dy = tg.y - S.world.y;
  if (!dx && !dy) { walk.target = null; return null; }
  const opts = Math.abs(dx) >= Math.abs(dy) ? [[Math.sign(dx),0],[0,Math.sign(dy)]] : [[0,Math.sign(dy)],[Math.sign(dx),0]];
  for (const [ox,oy] of opts) if ((ox||oy) && !solid(S.world.x+ox, S.world.y+oy)) return [ox,oy];
  walk.target = null; return null;
}
const dirName = (dx, dy) => dx > 0 ? 'right' : dx < 0 ? 'left' : dy < 0 ? 'up' : 'down';
function tryStep(d){
  const p = pet();                           // the keeper walks with or without a partner (MAPS_SLICE K.1)
  const nx = S.world.x + d[0], ny = S.world.y + d[1];
  if (solid(nx, ny)) return;
  const w = wildAt(nx, ny);
  if (w) { if (p && w.x === nx && w.y === ny) meetWild(w); return; }   // bump = encounter; a creature just leaving that tile blocks briefly
  walk.from = { x: S.world.x, y: S.world.y }; walk.to = { x: nx, y: ny }; walk.prog = 0;
  S.world.facing = dirName(d[0], d[1]);
  S.world.x = nx; S.world.y = ny;
  followerStep();
}
function onLand(){
  const p = pet();
  S.steps++; if (S.steps % 2 === 0) sfx('step');   // quiet footstep on every other step
  if (S.steps % 50 === 0) toast(S.steps + ' steps! Nice walk.');
  if (!p) return;                            // energy/hunger/step XP only with a partner
  p.energy = clamp(p.energy - STEP_NRG, 0, 100); p.hunger = clamp(p.hunger - STEP_FOOD, 0, 100);
  p.sr = (+p.sr || 0) + 1;                   // per-pet step remainder, carried across sessions
  if (p.sr >= STEPS_PER_XP) { p.sr -= STEPS_PER_XP; grantExploreXp(p, 1); }
  updateHUD();
}
function updateWalk(dt, t){
  if (walk.intro) { if (t - walk.intro > 700) { walk.intro = 0; openEncounter(); } return; }
  if (walk.to) {
    walk.prog += dt * 1000 / STEP_MS;
    if (walk.prog >= 1) { walk.fx = walk.to.x; walk.fy = walk.to.y; walk.to = null; if (fol.to) { fol.fx = fol.x; fol.fy = fol.y; fol.to = null; } onLand(); }
    else { walk.fx = walk.from.x + (walk.to.x - walk.from.x) * walk.prog; walk.fy = walk.from.y + (walk.to.y - walk.from.y) * walk.prog;
      if (fol.to) { fol.fx = fol.from.x + (fol.to.x - fol.from.x) * walk.prog; fol.fy = fol.from.y + (fol.to.y - fol.from.y) * walk.prog; } }
  }
  if (!walk.to && !walk.intro && $('#ovBattle').hidden) {
    let d = walk.queued || (walk.dpad && DIRS[walk.dpad]) || (walk.drag && DIRS[walk.drag]) || (walk.key && DIRS[walk.key]);
    walk.queued = null;
    if (d) { walk.target = null; wild.chase = null; }
    else if (wild.chase) {                     // tapped a creature: walk up to it, meet it when adjacent
      const w = wild.list.find(o => o.id === wild.chase);
      if (!w) wild.chase = null;
      else if (Math.abs(w.x - S.world.x) + Math.abs(w.y - S.world.y) === 1 && !w.to) { meetWild(w); return; }
      else walk.target = { x: w.x, y: w.y };
    }
    if (!d) d = targetDir();
    if (d) tryStep(d);
  }
}
function drawMap(t){
  const c = $('#mapCanvas'), g = ctx(c), p = pet();
  syncFollower();
  const VW = c.width, VH = c.height;
  const px_ = walk.fx * TS, py_ = walk.fy * TS;
  walk.cam.x = Math.round(clamp(px_ + 8 - VW/2, 0, MW*TS - VW));
  walk.cam.y = Math.round(clamp(py_ + 8 - VH/2, 0, MH*TS - VH));
  const cx = walk.cam.x, cy = walk.cam.y, wf = Math.floor(t / 500) % 2;
  g.fillStyle = PAL.k; g.fillRect(0,0,VW,VH);
  for (let ty = Math.floor(cy/TS); ty <= Math.floor((cy+VH)/TS); ty++)
    for (let tx = Math.floor(cx/TS); tx <= Math.floor((cx+VW)/TS); tx++){
      if (tx<0||ty<0||tx>=MW||ty>=MH) continue;
      const ch = MAP[ty][tx]; const img = ch === 'w' ? TILES.w[wf] : TILES[ch];
      g.drawImage(img, tx*TS - cx, ty*TS - cy);
    }
  if (walk.target) { g.strokeStyle = PAL.y; g.lineWidth = 1; g.strokeRect(walk.target.x*TS - cx + .5, walk.target.y*TS - cy + .5, 15, 15); }
  const grassOver = (fx, fy) => { const gx = Math.round(fx), gy = Math.round(fy); if (MAP[gy] && MAP[gy][gx] === 't') g.drawImage(TILES.t, 0, 10, 16, 6, gx*TS - cx, gy*TS - cy + 10, 16, 6); };
  const drawPlayer = () => {                 // the keeper (MAPS_SLICE K.1): 2 walk frames, 1px bob only while moving
    const fr = keeperFrame(), sx = Math.round(px_ - cx) - 1, sy = Math.round(py_ - cy) - 2 - fr;
    g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(sx + 3, Math.round(py_ - cy) + 14, 12, 2);
    g.drawImage(keeperFrames(lookOf())[S.world.facing][fr], sx, sy);
    grassOver(walk.fx, walk.fy);
  };
  const drawFollower = () => {               // the partner, one tile behind (K.3); Tired = slower, lower bob
    const fx = Math.round(fol.fx * TS - cx) - 1, fy = Math.round(fol.fy * TS - cy) - 2 + (isFainted(p) ? 1 : 0);
    if (fx < -18 || fy < -18 || fx > VW || fy > VH) return;
    g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(fx + 3, Math.round(fol.fy * TS - cy) + 14, 12, 2);
    g.drawImage(SPR[spi(p)][p.stage][(t % 3000) < 120 ? 'b' : 'n'], fx, fy - followerBob(t));
    grassOver(fol.fx, fol.fy);
  };
  // y-sorted so creatures, the follower and the keeper overlap naturally (follower under the keeper on a shared tile)
  const ents = wild.list.map(w => ({ y: w.fy, draw: () => drawWild(g, w, cx, cy, VW, VH, t) }));
  if (fol.x != null && p) ents.push({ y: fol.fy, draw: drawFollower });
  ents.push({ y: walk.fy + 0.01, draw: drawPlayer });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
  wild.poofs = wild.poofs.filter(f => wild.clock - f.t < 500);
  for (const f of wild.poofs) { const k = (wild.clock - f.t) / 500, x = f.x*TS - cx, y = f.y*TS - cy;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy]) => drawGlyph(g, 'spark', x + 6 + dx*(3 + k*6), y + 6 + dy*(3 + k*6))); }
  drawWeather(g, VW, VH, t);
  if (walk.intro) { const k = Math.floor((t - walk.intro) / 120) % 2; if (k) { g.fillStyle = PAL.w; g.fillRect(0,0,VW,VH); } }
}

/* ---------- keeper (player) sprite: MAPS_SLICE K.1 ---------- */
// keeper.js composes 16x16 frames (keeperGrid); here they become 18x18 canvases with a 1px PAL.k outline like buildSprite,
// built once per look and cached (the Walk map only looks them up).
const lookOf = () => (S && S.player && S.player.look) || null;           // null = the default look
const lookKey = L => { const f = Object.assign({}, KEEPER_LOOKS.defaults, L || {}); return KEEPER_LOOKS.slots.map(k => f[k]).join('|'); };
const keeperCache = new Map(); let keeperBuilds = 0;
function keeperCanvas(grid){
  const c = document.createElement('canvas'); c.width = c.height = 18; const g = c.getContext('2d');
  const filled = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && grid[y][x] !== '.';
  g.fillStyle = PAL.k;
  for (let y = -1; y <= 16; y++) for (let x = -1; x <= 16; x++)
    if (!filled(x, y) && (filled(x-1, y) || filled(x+1, y) || filled(x, y-1) || filled(x, y+1))) g.fillRect(x+1, y+1, 1, 1);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const ch = grid[y][x]; if (ch === '.') continue; g.fillStyle = PAL[ch] || PAL.m; g.fillRect(x+1, y+1, 1, 1); }
  return c;
}
function keeperFrames(look){
  const key = lookKey(look); let f = keeperCache.get(key);
  if (f) return f;
  if (keeperCache.size > 48) keeperCache.delete(keeperCache.keys().next().value);   // picker previews make new looks; keep it small
  f = {}; for (const dir of ['down', 'up', 'right', 'left']) f[dir] = [0, 1].map(i => keeperCanvas(keeperGrid(look, dir, i)));
  keeperBuilds++; keeperCache.set(key, f); return f;
}
const keeperFrame = () => walk.to ? Math.floor(walk.prog * 2) % 2 : 0;    // idle = frame 0

/* ---------- follower: the partner walks one tile behind (MAPS_SLICE K.3/K.4) ---------- */
const fol = { x: null, y: null, fx: 0, fy: 0, from: null, to: null, facing: 'down' };
const followerOn = () => !!(S && S.settings && S.settings.follower !== false && pet());
// Load rule: the tile behind the keeper (opposite facing) if walkable, else the keeper's own tile (drawn underneath).
function placeFollower(){
  fol.from = fol.to = null;
  if (!followerOn()) { fol.x = fol.y = null; return; }
  const [dx, dy] = DIRS[S.world.facing] || DIRS.down;
  let x = S.world.x - dx, y = S.world.y - dy;
  if (solid(x, y)) { x = S.world.x; y = S.world.y; }
  fol.x = fol.fx = x; fol.y = fol.fy = y; fol.facing = S.world.facing;
}
function syncFollower(){ if (followerOn() ? fol.x == null : fol.x != null) placeFollower(); }
function followerStep(){                       // keeper started a step from walk.from: the follower moves onto that tile
  syncFollower(); if (fol.x == null) return;
  const tx = walk.from.x, ty = walk.from.y;
  if (fol.x === tx && fol.y === ty) return;    // it was under the keeper: stays, now one tile behind
  fol.from = { x: fol.x, y: fol.y }; fol.to = { x: tx, y: ty };
  fol.facing = dirName(tx - fol.x, ty - fol.y); fol.x = tx; fol.y = ty;
}
function followerBob(t){                       // normal: twice per step / every 500 ms idle; Tired: half speed
  const p = pet(), moving = !!(fol.to && walk.to);
  if (p && isFainted(p)) return moving ? S.steps % 2 : Math.floor(t / 1000) % 2;   // napping after a faint: half-speed bob
  return moving ? Math.floor(walk.prog * 2) % 2 : Math.floor(t / 500) % 2;
}
const followerAt = (tx, ty) => fol.x != null && followerOn() && ((fol.x === tx && fol.y === ty) || (Math.round(fol.fx) === tx && Math.round(fol.fy) === ty));
function toggleFollower(){
  S.settings.follower = S.settings.follower === false; placeFollower(); renderFollowerBtn(); save(); sfx('tap');
  toast(S.settings.follower ? 'Your partner walks with you.' : 'Your partner waits on the Pet tab.');
}

/* ---------- look picker #ovLook and the keeper's name (MAPS_SLICE K.2) ---------- */
const DEFAULT_PLAYER_NAME = 'Wayfarer';
const BAD_NAME_CH = /[\u0000-\u001f\u007f-\u009f<>{}]/g;
function cleanPlayerName(v){                   // nameEntry rules: drop control chars and < > { }, collapse spaces, max 10 code points
  const s = String(v == null ? '' : v).replace(BAD_NAME_CH, '').replace(/\s+/g, ' ').trim();
  return Array.from(s).slice(0, PPSave.PLAYER_NAME_MAX).join('').trim() || DEFAULT_PLAYER_NAME;
}
const playerName = () => (S && S.player && typeof S.player.name === 'string' && S.player.name.trim()) || DEFAULT_PLAYER_NAME;   // BATTLE §7.1 {player}
function renderKeeperName(){
  $('#keeperName').textContent = playerName();
  const k = $('#petKeeper'); if (!k) return;                  // Pet scene label (MAPS_SLICE K.2 v0.4.7): "KEEPER  Mo", textContent only
  k.textContent = ''; const b = document.createElement('b'); b.textContent = 'KEEPER'; k.append(b, document.createTextNode(playerName()));
  k.setAttribute('aria-label', 'Keeper ' + playerName());
}
const LOOK_ROWS = [['skin', '#lookSkin', 'Skin'], ['hair', '#lookHair', 'Hair'], ['hairCol', '#lookHairCol', 'Hair colour'],
  ['outfit', '#lookOutfit', 'Outfit'], ['outfitCol', '#lookOutfitCol', 'Outfit colour'], ['accent', '#lookAccent', 'Accent']];
const COLOUR_NAMES = { k:'black', p:'plum', r:'red', o:'orange', y:'yellow', l:'lime', g:'green', t:'teal', n:'navy', b:'blue', c:'sky', s:'ice',
  w:'white', h:'grey', m:'slate', d:'charcoal', 1:'tone 1', 2:'tone 2', 3:'tone 3', 4:'tone 4', 5:'tone 5', 6:'tone 6' };
const lookUI = { draft: null, newPlayer: false };
function openLook(newPlayer){
  if (!newPlayer && overlayOpen()) return false;
  clearMoves();
  lookUI.newPlayer = !!newPlayer;
  lookUI.draft = Object.assign({}, KEEPER_LOOKS.defaults, normalizeLook(S.player.look) || {});   // unknown extra keys ride along
  $('#lookTitle').textContent = newPlayer ? 'WHO ARE YOU?' : 'CHANGE LOOK';
  $('#lookCancel').hidden = !!newPlayer; $('#lookBtns').classList.toggle('one', !!newPlayer);
  $('#lookNameRow').hidden = false;            // Phase K: the name field is always shown (the interim rename until the Lodge)
  $('#lookName').value = S.player.name || DEFAULT_PLAYER_NAME;
  renderLook(); drawLookPreview(now());
  $('#ovLook').hidden = false; lockTabs(true); $('#ovLook .ov-inner').scrollTop = 0;
  return true;
}
function closeLook(){ $('#ovLook').hidden = true; lookUI.draft = null; if (allPets().length) lockTabs(false); }
function renderLook(){
  const d = lookUI.draft;
  for (const [slot, sel, label] of LOOK_ROWS) {
    const box = $(sel); box.innerHTML = '';
    for (const opt of KEEPER_LOOKS[slot]) {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.opt = opt;
      const on = d[slot] === opt; b.className = (slot === 'hair' || slot === 'outfit' ? 'preview' : 'swatch') + (on ? ' on' : '');
      b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', label + ': ' + (COLOUR_NAMES[opt] || opt));
      if (slot === 'hair' || slot === 'outfit') {
        const lk = Object.assign({}, d, { [slot]: opt }), src = keeperFrames(lk).down[0];
        const rows = slot === 'hair' ? 13 : 18;               // hair: head and shoulders (outline + the top 12 grid rows)
        const cv = document.createElement('canvas'); cv.width = 18; cv.height = rows; cv.style.width = '54px'; cv.style.height = (rows * 3) + 'px';
        ctx(cv).drawImage(src, 0, 0, 18, rows, 0, 0, 18, rows); b.append(cv);
      } else b.style.background = PAL[opt];
      b.addEventListener('click', () => { if (lookUI.draft[slot] === opt) return; lookUI.draft[slot] = opt; sfx('tap'); renderLook(); drawLookPreview(now()); });
      box.append(b);
    }
  }
}
const LOOK_TURN = ['down', 'right', 'up', 'left'];
function drawLookPreview(t){                   // the big keeper turns through the 4 facings once a second, walk frames alternating
  if (!lookUI.draft) return;
  const c = $('#lookPreview'), g = ctx(c), f = LOOK_TURN[Math.floor(t / 1000) % 4], fr = Math.floor(t / 250) % 2;
  g.clearRect(0, 0, 18, 18); g.drawImage(keeperFrames(lookUI.draft)[f][fr], 0, 0);
  c.dataset.facing = f; c.dataset.frame = fr;
}
function shuffleLook(){
  const pick = a => a[Math.random() * a.length | 0];
  for (const slot of KEEPER_LOOKS.slots) lookUI.draft[slot] = pick(KEEPER_LOOKS[slot]);
  sfx('tap'); renderLook(); drawLookPreview(now());
}
function lookDone(){
  S.player.look = Object.assign({}, lookUI.draft);
  S.player.name = cleanPlayerName($('#lookName').value);
  const wasNew = lookUI.newPlayer;
  closeLook(); save(); renderKeeperName(); sfx('befriend');
  if (wasNew) openStarter(); else toast('Looking good, ' + S.player.name + '!');
}

/* ---------- wild creatures: visible on the map, species chosen from the real-world environment ---------- */
const WILD_TARGET = 4;                          // creatures kept around the map (3 spawn at once, then top up to 4)
const WILD_LIFE_S = [150, 270];                 // seconds (of Walk-tab time) before a creature wanders off
const WILD_RESPAWN_S = [5, 12];                 // seconds between spawns while below the target
const WILD_STEP_MS = 520, WILD_IDLE_MS = [900, 3200], WILD_LEASH = 4;
const WILD_STAGE2_CHANCE = 0.05;                // wild second forms are rare (they skip the first evolution)
const ANY_SPECIES_CHANCE = 0.08;                // small share for any species, so nothing is impossible anywhere
const wild = { list: [], poofs: [], seq: 0, chase: null, started: false, clock: 0, nextSpawn: 0, auto: true };
let ENV = null;
const rnd = ([a, b]) => a + Math.random() * (b - a);
const envTags = () => (ENV && ENV.tags && ENV.tags.length) ? ENV.tags : ['meadow'];
// weatherOnly species (the vane line): weight 0 unless one of their tags is active, and never part of the any-species roll.
const weatherOk = (sp, tags) => !sp.weatherOnly || sp.weatherOnly.some(t => tags.includes(t));
const ANY_POOL = SPECIES.map((sp, i) => i).filter(i => !SPECIES[i].weatherOnly);
function speciesWeights(tags = envTags()){ return SPECIES.map(sp => weatherOk(sp, tags) ? tags.reduce((s, t) => s + ((sp.habitat || {})[t] || 0), 0) : 0); }
function spawnOdds(tags = envTags()){              // expected spawn probability per species for these tags
  const w = speciesWeights(tags), tot = w.reduce((a, b) => a + b, 0), any = i => ANY_POOL.includes(i) ? 1 / ANY_POOL.length : 0;
  return w.map((v, i) => tot ? (1 - ANY_SPECIES_CHANCE) * v / tot + ANY_SPECIES_CHANCE * any(i) : any(i));
}
function pickSpecies(tags = envTags()){
  const w = speciesWeights(tags), tot = w.reduce((a, b) => a + b, 0);
  if (!tot || Math.random() < ANY_SPECIES_CHANCE) return ANY_POOL[Math.random() * ANY_POOL.length | 0];
  let r = Math.random() * tot;
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; }
  return w.length - 1;
}
const pickStage = () => Math.random() < WILD_STAGE2_CHANCE ? 1 : 0;
const nextTo = (x, y, ch) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => MAP[y+dy] && MAP[y+dy][x+dx] === ch);
const roamable = (x, y) => !solid(x, y) && MAP[y][x] !== 'p';          // creatures keep to grass, off the path
function wildAt(x, y, except){ return wild.list.find(w => w !== except && ((w.x === x && w.y === y) || (w.to && w.from.x === x && w.from.y === y))); }
const playerOn = (x, y) => (S.world.x === x && S.world.y === y) || (walk.to && walk.from.x === x && walk.from.y === y);
function spawnSpot(sp){
  const pref = { grass: (x, y) => MAP[y][x] === 't', shore: (x, y) => nextTo(x, y, 'w'), woods: (x, y) => nextTo(x, y, 'T') }[SPECIES[sp].tiles || 'grass'];
  const best = [], ok = [];
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    if (!roamable(x, y) || wildAt(x, y) || Math.abs(x - S.world.x) + Math.abs(y - S.world.y) < 3 || (fol.x === x && fol.y === y)) continue;
    if (pref(x, y)) best.push([x, y]); else if (MAP[y][x] === 't') ok.push([x, y]);
  }
  const list = best.length ? best : ok;
  return list.length ? list[Math.random() * list.length | 0] : null;
}
function spawnWild(sp, stage, at){
  if (sp == null) sp = pickSpecies();
  if (stage == null) stage = pickStage();
  const spot = at || spawnSpot(sp); if (!spot) return null;
  const c = wild.clock;
  const w = { id: ++wild.seq, sp, stage, lv: wildLevel(stage, Math.random, 'proto', SPECIES[sp].id), x: spot[0], y: spot[1], hx: spot[0], hy: spot[1], fx: spot[0], fy: spot[1], from: null, to: null, t0: 0,
    born: c, life: rnd(WILD_LIFE_S) * 1000, idleUntil: c + rnd(WILD_IDLE_MS), phase: Math.random() * 3000, shyUntil: 0 };
  wild.list.push(w); return w;
}
function removeWild(w, poof){
  wild.list = wild.list.filter(o => o !== w);
  if (wild.chase === w.id) { wild.chase = null; walk.target = null; }
  if (poof) wild.poofs.push({ x: w.fx, y: w.fy, t: wild.clock });
}
function onScreen(w){ const c = $('#mapCanvas'), x = w.fx*TS - walk.cam.x, y = w.fy*TS - walk.cam.y; return x > -18 && y > -18 && x < c.width + 2 && y < c.height + 2; }
function updateWild(dt){
  const c = (wild.clock += dt * 1000);
  if (!wild.started) { wild.started = true; if (wild.auto) for (let i = 0; i < 3; i++) spawnWild(); wild.nextSpawn = c + rnd(WILD_RESPAWN_S) * 1000; }
  for (const w of wild.list.slice()) {
    if (w.to) {
      const k = clamp((c - w.t0) / WILD_STEP_MS, 0, 1);
      w.fx = w.from.x + (w.to.x - w.from.x) * k; w.fy = w.from.y + (w.to.y - w.from.y) * k;
      if (k >= 1) { w.fx = w.x; w.fy = w.y; w.to = null; w.idleUntil = c + rnd(WILD_IDLE_MS); }
      continue;
    }
    const chased = wild.chase === w.id;
    if (c - w.born > w.life && !chased) { removeWild(w, onScreen(w)); continue; }       // wandered off
    const far = Math.abs(w.x - S.world.x) > 11 || Math.abs(w.y - S.world.y) > 9;
    if (far && !onScreen(w) && c - w.born > 20000) { removeWild(w, false); continue; }
    if (c < w.idleUntil || chased && c > w.shyUntil) continue;                         // a chased creature waits for you
    const dirs = Object.values(DIRS).sort(() => Math.random() - 0.5);
    if (c < w.shyUntil) dirs.sort((a, b) => (Math.abs(w.x + b[0] - S.world.x) + Math.abs(w.y + b[1] - S.world.y)) - (Math.abs(w.x + a[0] - S.world.x) + Math.abs(w.y + a[1] - S.world.y)));
    const d = dirs.find(([dx, dy]) => { const nx = w.x + dx, ny = w.y + dy;
      return roamable(nx, ny) && Math.abs(nx - w.hx) + Math.abs(ny - w.hy) <= WILD_LEASH && !wildAt(nx, ny, w) && !playerOn(nx, ny); });
    if (!d) { w.idleUntil = c + 600; continue; }
    w.from = { x: w.x, y: w.y }; w.x += d[0]; w.y += d[1]; w.to = { x: w.x, y: w.y }; w.t0 = c;
  }
  if (wild.auto && (wild.list.length < 2 || (wild.list.length < WILD_TARGET && c >= wild.nextSpawn))) { spawnWild(); wild.nextSpawn = c + rnd(WILD_RESPAWN_S) * 1000; }
}
function drawWild(g, w, cx, cy, VW, VH, t){
  const x = Math.round(w.fx*TS - cx) - 1, y0 = Math.round(w.fy*TS - cy) - 2;
  if (x < -18 || y0 < -18 || x > VW || y0 > VH) return;
  const tt = t + w.phase, bob = w.to ? Math.floor(clamp((wild.clock - w.t0) / WILD_STEP_MS, 0, 1) * 2) % 2 : Math.floor(tt / 450) % 2;
  const age = wild.clock - w.born;
  g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(x + 3, Math.round(w.fy*TS - cy) + 14, 12, 2);
  if (age < 400) g.globalAlpha = age / 400;                              // fade in on spawn
  g.drawImage(SPR[w.sp][w.stage][(tt % 2800) < 120 ? 'b' : 'n'], x, y0 - bob);
  g.globalAlpha = 1;
  const gx = Math.round(w.fx), gy = Math.round(w.fy);
  if (MAP[gy] && MAP[gy][gx] === 't') g.drawImage(TILES.t, 0, 10, 16, 6, gx*TS - cx, gy*TS - cy + 10, 16, 6);
  if (w.stage > 0 && Math.floor(tt / 350) % 5 === 0) drawGlyph(g, 'spark', x + 14, y0 - 2);   // rare form twinkle
}

/* ---------- weather overlay (cheap, stateless pixel particles) ---------- */
const WX_RND = Array.from({ length: 360 }, (_, i) => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); });
function drawWeather(g, VW, VH, t, density = 1){   // density scales the drop/flake count (the Pet tab canvas is small)
  const tags = envTags(), has = k => tags.includes(k);
  if (has('night')) { g.fillStyle = 'rgba(16,18,52,.42)'; g.fillRect(0, 0, VW, VH); }
  if (has('fog')) { g.fillStyle = 'rgba(244,244,244,.18)'; g.fillRect(0, 0, VW, VH); }
  if (has('rain') || has('storm')) {
    if (!has('night')) { g.fillStyle = 'rgba(41,54,111,.22)'; g.fillRect(0, 0, VW, VH); }   // overcast
    const n = Math.round((has('storm') ? 120 : 85) * density); g.fillStyle = has('night') ? 'rgba(115,239,247,.75)' : 'rgba(115,239,247,.9)';
    for (let i = 0; i < n; i++) {
      const r = WX_RND, sp = 0.16 + r[i*3+2] * 0.08;
      const y = (r[i*3+1] * (VH + 12) + t * sp) % (VH + 12) - 6;
      const x = ((r[i*3] * (VW + 20) - y * 0.35) % (VW + 20) + VW + 20) % (VW + 20) - 10;
      g.fillRect(x | 0, y | 0, 1, 4); g.fillRect((x - 1) | 0, (y + 4) | 0, 1, 2);
    }
    if (has('storm')) { const k = t % 7300; if (k < 70 || (k > 160 && k < 210)) { g.fillStyle = 'rgba(244,244,244,.55)'; g.fillRect(0, 0, VW, VH); } }
  }
  if (has('snow')) {
    g.fillStyle = PAL.w;
    for (let i = 0, n = Math.round(60 * density); i < n; i++) {
      const r = WX_RND, sp = 0.012 + r[i*3+2] * 0.018, sz = r[i*3+2] > 0.7 ? 2 : 1;
      const y = (r[i*3+1] * (VH + 4) + t * sp) % (VH + 4) - 2;
      const x = ((r[i*3] * VW + Math.sin(t / 900 + i) * 4) % VW + VW) % VW;
      g.fillRect(x | 0, y | 0, sz, sz);
    }
  }
}

/* ---------- environment: badge, location card, details/picker ---------- */
const STATUS_TAG = { loading: '...', off: 'DEFAULT', denied: 'NO GPS', unavailable: 'NO GPS', offline: 'OFFLINE', manual: 'MANUAL' };
function renderEnv(){
  if (!ENV) return;
  $('#envText').textContent = ENV.label;
  $('#envSrc').textContent = STATUS_TAG[ENV.status] || '';
  $('#envBadge').setAttribute('aria-label', 'Wild area: ' + ENV.label + '. Tap for details.');
  if (!$('#ovEnv').hidden) renderEnvCard();
}
function onEnvChange(e){
  const before = ENV ? ENV.tags.join() : null;
  ENV = e; renderEnv();
  if (before !== null && before !== e.tags.join()) {      // new surroundings: let current creatures wander off soon
    for (const w of wild.list) w.life = Math.min(w.life, wild.clock - w.born + rnd([3000, 12000]));
    wild.nextSpawn = Math.min(wild.nextSpawn, wild.clock + 2000);
  }
}
function lockTabs(on){ $('#tabs').classList.toggle('locked', on); }
function openGeoAsk(){ if (overlayOpen()) return; clearMoves(); $('#ovGeo').hidden = false; lockTabs(true); }
function closeGeoAsk(){ $('#ovGeo').hidden = true; lockTabs(false); }
function useLocation(){
  PPEnv.setGeoPref('allow');
  if (!window.isSecureContext || !navigator.geolocation) { toast('Location needs https or localhost. Using a meadow.'); }
  PPEnv.refresh(true).then(e => {
    if (e.status === 'denied') toast('Location blocked. Using a meadow for now.');
    else if (e.status === 'offline') toast('Offline: using a meadow for now.');
    else if (e.source === 'location') toast('Wild area: ' + e.label);
  });
}
function openEnvCard(){ if (overlayOpen()) return; clearMoves(); renderEnvCard(); $('#ovEnv').hidden = false; lockTabs(true); }
function closeEnvCard(){ $('#ovEnv').hidden = true; lockTabs(false); }
function renderEnvCard(){
  const e = ENV; if (!e) return;
  $('#envCardLabel').textContent = e.label;
  $('#envCardTags').textContent = 'Signals: ' + e.tags.join(', ');
  const odds = spawnOdds(e.tags).map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
  $('#envCardLikely').textContent = 'Likely here: ' + odds.map(([v, i]) => SPECIES[i].stages[0].name + ' ' + Math.round(v * 100) + '%').join(', ');
  const ago = m => m < 1 ? 'just now' : m < 60 ? Math.round(m) + ' min ago' : Math.round(m / 60) + ' h ago';
  let src;
  if (e.source === 'manual') src = 'Picked place (debug override). Choose AUTO to go back.';
  else if (e.source === 'location') src = 'Near ' + e.coords + ' (rounded)' + (e.place ? ', ' + e.place : '') + '. Updated ' + ago((Date.now() - e.updated) / 60e3) + (e.status === 'partial' ? '. Some map data was unavailable.' : '.') + (e.status === 'loading' ? ' Looking around...' : '');
  else src = { denied: 'Location is blocked in the browser, so this is a default meadow (night from your clock).',
               unavailable: 'Location needs https or localhost, so this is a default meadow.',
               offline: 'Could not reach the weather/map services, so this is a default meadow.' }[e.status] || 'Location is off, so this is a default meadow (night from your clock).';
  $('#envCardSrc').textContent = src;
  const allowed = PPEnv.geoPref() === 'allow' && e.source !== 'default';
  $('#envUseLoc').textContent = allowed ? 'REFRESH' : 'USE MY LOCATION';
}
function buildPresetButtons(){
  const box = $('#envPresets'); box.innerHTML = '';
  const add = (key, name) => { const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = name; b.dataset.preset = key;
    b.addEventListener('click', () => { PPEnv.setOverride(key === 'auto' ? null : key); resetWild(); toast(key === 'auto' ? 'Back to your real surroundings' : 'Picked: ' + name); }); box.append(b); };
  add('auto', 'AUTO');
  Object.entries(PPEnv.PRESETS).forEach(([k, p]) => add(k, p.name));
}
function resetWild(){ wild.list = []; wild.poofs = []; wild.chase = null; wild.started = false; wild.auto = true; }

/* ---------- battle (BATTLE.md v0.3.1) ---------- */
// Meeting a wild creature (bump/tap/G) opens a turn-based battle; befriending is one of its actions (§2). The befriend bar
// reuses the old encounter elements (#tbar/#tzone/#tmark/#encGo/#encTries/#encName), now inside #ovBattle.
const enc = { tries: 3, zone: [0.4, 0.6], speed: 0.003, freezeUntil: 0, mark: 0, t0: 0, open: false, next: null };
const BEFRIEND_TRIES = 3;
// Where a team wipe wakes you (§7.2). Lantern House maps arrive with Phase M; until then every respawn is proto (3,3).
const RESPAWNS = {};
const RESPAWN_FALLBACK = { map: 'proto', x: 3, y: 3, facing: 'down' };
const moveName = id => (MOVES[id] || MOVES.wobble).name;
const petById = id => allPets().find(q => q.id === id) || null;
const ablePet = p => canBattle(p);
// Lead = the partner if able, otherwise the first able party member (§1).
function leadPet(){ const p = pet(); return ablePet(p) ? p : (S.party.find(ablePet) || null); }
function noBattleToast(){
  sfx('denied'); toast(S.party.some(q => isFainted(q)) ? 'Your team needs a rest first!' : 'Your team is too sleepy. REST first!');
}
function startEncounterIntro(sp, stage, wid, lv){
  clearMoves();
  if (!leadPet()) {                                        // nobody able: no battle, the creature turns shy (§1)
    noBattleToast(); const w = wid && wild.list.find(o => o.id === wid); if (w) { w.idleUntil = 0; w.shyUntil = wild.clock + 1500; }
    return;
  }
  enc.next = { sp: sp != null ? sp : pickSpecies(), stage: stage != null ? stage : pickStage(), wid: wid || null, lv: lv || null };
  walk.intro = now(); sfx('encounter');
}
function meetWild(w){ w.to = null; w.fx = w.x; w.fy = w.y; startEncounterIntro(w.sp, w.stage, w.id, w.lv); }
function openEncounter(){                                  // the intro flash ends here
  const nx = enc.next || { sp: pickSpecies(), stage: pickStage(), wid: null }; enc.next = null;
  const lv = nx.lv || wildLevel(nx.stage, Math.random, 'proto', SPECIES[nx.sp].id);   // forced encounters roll a proto level
  const w = nx.wid && wild.list.find(o => o.id === nx.wid);
  openBattle({ kind: 'wild', form: SPECIES[nx.sp].id + '/' + nx.stage, level: lv, wid: nx.wid, moves: w && w.moves });
}

const battle = { on: false, id: 0, kind: 'wild', trainerId: null, wid: null, foes: [], fi: 0, me: null, uses: {}, participants: [],
  fainted: new Set(), tries: BEFRIEND_TRIES, failedRuns: 0, turn: 0, state: 'IDLE', panel: 'busy', treat: false, result: null,
  newId: null, rng: Math.random, textMs: null, fx: [], levelUps: [], foeHealUsed: false, log: [] };
let msgSkip = null;
const alive = id => battle.on && battle.id === id;
const curFoe = () => battle.foes[battle.fi];
const activePet = () => battle.me && petById(battle.me.petId);
function makeFoe(form, level, moveIds){
  const [line, st] = form.split('/'), si = SP_INDEX[line], stage = +st, s = statsAt(form, level);
  const ids = (moveIds && moveIds.length ? moveIds : defaultMoves(form, level)).filter(id => MOVES[id]).slice(0, 4);
  return { form, si, species: line, stage, level, type: SPECIES[si].type, maxHp: s.hp, hp: s.hp, stats: s,
    stages: { atk: 0, def: 0, spd: 0 }, moves: (ids.length ? ids : ['wobble']).map(id => ({ id, uses: MOVES[id].uses == null ? Infinity : MOVES[id].uses })) };
}
const foeName = f => nameOf(f.si, f.stage);
const foeLabel = f => battle.kind === 'wild' ? 'Wild ' + foeName(f) : TRAINERS[battle.trainerId].name + "'s " + foeName(f);
const tr = () => TRAINERS[battle.trainerId] || null;
function textVars(extra){
  const t = tr(), f = curFoe(), p = activePet();
  return Object.assign({ player: playerName(), name: playerName(), pet: p ? petName(p) : '', foe: f ? foeName(f) : '',
    trainer: t ? t.name : '', title: t ? t.title : '' }, extra || {});
}
const btLine = (key, extra) => battleLine(key, textVars(extra));
const trLine = s => { const v = textVars(); return String(s).replace(/\{(player|name|pet|foe|trainer|title)\}/g, (m, k) => v[k]); };   // single pass
function usesOf(p){
  const u = battle.uses[p.id] || (battle.uses[p.id] = {});
  (p.moves || []).forEach(id => { if (!(id in u) && MOVES[id]) u[id] = MOVES[id].uses == null ? Infinity : MOVES[id].uses; });
  return u;
}
// Battlers for damage(): stats with the stage multiplier folded in, so effStat = max(1, floor(stat x mood x stage)) (§4).
function myBattler(){
  const p = activePet(), b = battlerOf(p), st = battle.me.stages;
  b.mood = battle.me.mood || b.mood;
  b.atk *= STAGE_MULT[st.atk]; b.def *= STAGE_MULT[st.def]; b.spd *= STAGE_MULT[st.spd]; b.hp = hpOf(p);
  return b;
}
function foeBattler(f){
  const st = f.stages;
  return { type: f.type, level: f.level, atk: f.stats.atk * STAGE_MULT[st.atk], def: f.stats.def * STAGE_MULT[st.def], spd: f.stats.spd * STAGE_MULT[st.spd], mood: null, hp: f.hp, maxHp: f.maxHp };
}
const effSpd = b => effStat(b, 'spd');
function setMyHp(p, hp){ const max = maxHpOf(p); hp = clamp(Math.round(hp), 0, max); if (hp >= max) delete p.hpNow; else p.hpNow = hp; }

/* --- open / close --- */
function openBattle(o){
  const lead = leadPet();
  if (!lead) { noBattleToast(); return false; }
  clearMoves(); closeSheet(null);
  const B = battle; B.id++;
  Object.assign(B, { on: true, kind: o.kind, trainerId: o.trainerId || null, wid: o.wid || null, fi: 0, uses: {}, participants: [],
    fainted: new Set(), tries: BEFRIEND_TRIES, failedRuns: 0, turn: 0, state: 'INTRO', treat: false, result: null, newId: null,
    fx: [], levelUps: [], foeHealUsed: false, log: [], storyMoves: !!(o.moves && o.moves.length) });
  if (o.kind === 'trainer') B.foes = TRAINERS[o.trainerId].team.map(m => makeFoe(m.form, m.level, m.moves));
  else B.foes = [makeFoe(o.form, o.level, o.moves)];
  B.participants = B.foes.map(() => new Set());
  B.me = { petId: lead.id, stages: { atk: 0, def: 0, spd: 0 }, mood: null };
  B.participants[0].add(lead.id);
  const f = curFoe(); markSeen(f.si, f.stage); save();
  enc.open = false; enc.speed = f.stage ? 0.0042 : 0.003;
  $('#encName').hidden = true; $('#btMsg').textContent = '';
  $('#btTwinkle').hidden = !(o.kind === 'wild' && f.stage > 0);
  renderBattleCards(); setPanel('busy');
  $('#ovBattle').hidden = false; lockTabs(true); fitAll(); fitBattle();
  battleIntro(B.id);
  return true;
}
async function battleIntro(id){
  const B = battle, p = activePet(), t = tr();
  B.fx.push({ who: 'foe', kind: 'pop', t0: now(), dur: 300 });
  if (B.kind === 'trainer') {
    await say(t.name + ': ' + trLine(t.lines.intro), id);                   // MAPS_SLICE §6.1 summon sequence
    if (!alive(id)) return; await say(btLine('trainerSummon'), id);
    if (!alive(id)) return; await say(btLine('trainerIntro'), id);
    if (!alive(id)) return; B.fx.push({ who: 'me', kind: 'pop', t0: now(), dur: 300 }); B.meShown = true;
    await say(btLine('playerSend'), id);
  } else {
    await say(btLine('wildAppear'), id);
    if (!alive(id)) return; B.fx.push({ who: 'me', kind: 'pop', t0: now(), dur: 300 }); B.meShown = true;
    await say(btLine('wildSend', { pet: petName(p) }), id);
  }
  if (alive(id)) toChoose();
}
function closeBattle(){
  const B = battle; if (!B.on) return;
  if (B.result === 'befriended' && B.newId) {               // optional nickname (skip = species name)
    const p = petById(B.newId), nk = cleanNick($('#encNick').value);
    if (p && nk && nk !== nameOf(spi(p), p.stage)) { p.nick = nk; toast(nameOf(spi(p), p.stage) + ' is now called ' + nk + '!'); }
  }
  $('#encName').hidden = true; $('#encNick').blur();
  B.on = false; B.state = 'IDLE'; msgSkip = null; closeSheet(null);
  $('#ovBattle').hidden = true; lockTabs(false);
  const w = B.wid && wild.list.find(o => o.id === B.wid);
  if (w) {
    if (B.result === 'befriended') removeWild(w, false);                       // it joined you
    else if (B.result === 'win' || B.result === 'fled') removeWild(w, true);   // it wandered off
    else { w.idleUntil = 0; w.shyUntil = wild.clock + 1500; }                   // run / team wipe: it stays and scoots away
  }
  if (B.result === 'run') toast('Got away safely.');
  if (B.result === 'tired') respawnAfterWipe();
  updateHUD(); save();
}
// §7.2 team wipe: back to world.respawn (proto 3,3 before Phase M). Nothing lost, nobody healed, timers keep running.
function respawnAfterWipe(){
  const r = RESPAWNS[S.world.respawn], at = r || RESPAWN_FALLBACK;
  if (MAPS_OK(at.map)) { S.world.map = at.map; S.world.x = at.x; S.world.y = at.y; S.world.facing = at.facing; walk.fx = at.x; walk.fy = at.y; walk.to = null; placeFollower(); }
  toast(r ? 'Your team fainted... you wake at the Lantern House. Rest by the beds.' : 'Your team fainted... let them nap, or REST on the Pet tab.');
}
const MAPS_OK = m => m === 'proto';
// Lantern House REST / interior `rest` step (Phase M calls this): every party pet to full HP, naps cleared.
function lanternRest(){ S.party.forEach(q => restPet(q, 'full')); updateHUD(); save(); }
function healTeam(){ S.party.concat(S.box).forEach(q => { delete q.hpNow; delete q.faintUntil; }); updateHUD(); save(); }
function battleKey(e){
  if (skipMsg() && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); return; }
  if (e.key === 'Escape') {
    if (!$('#ovSheet').hidden && !$('#shCancel').hidden) { closeSheet(null); return; }
    if (battle.panel === 'fight' || battle.panel === 'bef') { enc.open = false; setPanel('acts'); return; }
  }
  if (e.key === ' ' && battle.panel === 'bef' && battle.state === 'CHOOSE') { e.preventDefault(); encounterPress(); return; }
  if (battle.state !== 'CHOOSE' || battle.panel !== 'acts') return;
  const map = { '1':'fight', '2':'befriend', '3':'swap', '4':'bag', '5':'run', f:'fight', b:'befriend', s:'swap', r:'run', F:'fight', B:'befriend', S:'swap', R:'run' };
  if (map[e.key]) { e.preventDefault(); battleAct(map[e.key]); }
}

/* --- messages --- */
function say(text, id = battle.id){
  return new Promise(res => {
    if (!alive(id)) return res();
    $('#btMsg').textContent = text; battle.log.push(text);
    const ms = battle.textMs != null ? battle.textMs : (TEXT_MS[S.settings.textSpeed] || TEXT_MS.normal);
    let done = false; const fin = () => { if (done) return; done = true; clearTimeout(tm); if (msgSkip === fin) msgSkip = null; res(); };
    const tm = setTimeout(fin, ms); msgSkip = fin;
  });
}
function skipMsg(){ if (msgSkip) { msgSkip(); return true; } return false; }

/* --- panels & cards --- */
function setPanel(name){
  battle.panel = name;
  $('#btActs').hidden = name !== 'acts'; $('#btFight').hidden = name !== 'fight'; $('#btBef').hidden = name !== 'bef'; $('#btEnd').hidden = name !== 'end';
  $('#btBusy').hidden = name !== 'busy';
  if (name === 'acts') renderActs(); if (name === 'fight') renderFight();
}
function renderActs(){
  const wildB = battle.kind === 'wild';
  $('#btBefriendAct').hidden = !wildB; $('#btRun').hidden = !wildB;
  $('#btHearts').textContent = '\u2665'.repeat(battle.tries) + '\u2661'.repeat(BEFRIEND_TRIES - battle.tries);
  $('#btActs').classList.toggle('trainer', !wildB);
}
function typeChip(el, type){ el.textContent = type; el.className = 'type-chip t-' + type.toLowerCase(); }
function renderBattleCards(){
  const B = battle, f = curFoe(), p = activePet(); if (!f || !p) return;
  $('#btFoeName').textContent = foeName(f); $('#btFoeLv').textContent = 'Lv ' + f.level; typeChip($('#btFoeType'), f.type);
  const fh = $('#btFoeHp'); fh.style.width = (100 * f.hp / f.maxHp) + '%'; fh.classList.toggle('warn', f.hp / f.maxHp < 0.25);
  $('#btFoeStages').textContent = stageText(f.stages);
  const sp = SPECIES[spi(p)], hp = Math.ceil(hpOf(p)), mhp = maxHpOf(p);
  $('#btMeName').textContent = petName(p); $('#btMeLv').textContent = 'Lv ' + levelOf(p); typeChip($('#btMeType'), sp.type);
  const mh = $('#btMeHp'); mh.style.width = (100 * hp / mhp) + '%'; mh.classList.toggle('warn', hp / mhp < 0.25);
  $('#btMeHpTxt').textContent = hp + '/' + mhp;
  const m = B.me.mood || moodOf(p), chips = [];
  if (m.hungry) chips.push('HUNGRY'); if (m.sulky) chips.push('SULKY'); if (m.drowsy) chips.push('DROWSY');
  if (m.spirited) chips.push('SPIRITED'); if (m.glowing) chips.push('GLOWING');
  $('#btMood').textContent = [stageText(B.me.stages), chips.join(' ')].filter(Boolean).join(' ');
}
function stageText(st){ return ['atk', 'def', 'spd'].filter(k => st[k]).map(k => k.toUpperCase() + (st[k] > 0 ? '\u25b2' : '\u25bc') + Math.abs(st[k])).join(' '); }
// Type hint badge: shown once you've seen this move's effect on this type (S.dex.hits["move>TYPE"]).
function hintFor(mid, type){ const v = S.dex.hits && S.dex.hits[mid + '>' + type]; return v === 2 ? '2x' : v === 0.5 ? '\u00bd' : v === 0 ? '0' : ''; }
function renderFight(){
  const p = activePet(), u = usesOf(p), f = curFoe(), box = $('#btMoves'); box.textContent = '';
  const ids = (p.moves || []).filter(id => MOVES[id]);
  const out = ids.every(id => !(u[id] > 0));
  const list = out ? ['wobble'] : ids;
  for (let i = 0; i < 4; i++) {
    const id = list[i], b = document.createElement('button'); b.className = 'btn bt-move'; b.type = 'button';
    if (!id) { b.disabled = true; b.textContent = '-'; box.appendChild(b); continue; }
    const mv = MOVES[id], left = id === 'wobble' ? null : u[id];
    b.dataset.move = id; b.disabled = id !== 'wobble' && !(left > 0);
    const nm = document.createElement('span'); nm.className = 'mv-name'; nm.textContent = mv.name;
    const meta = document.createElement('span'); meta.className = 'mv-meta';
    const chip = document.createElement('span'); typeChip(chip, mv.type);
    const us = document.createElement('span'); us.className = 'mv-uses'; us.textContent = left == null ? '\u221e' : left + '/' + mv.uses;
    const pw = document.createElement('span'); pw.className = 'mv-pow'; pw.textContent = mv.power ? 'PWR ' + mv.power : 'STATUS';
    meta.append(chip, us, pw); b.append(nm, meta);
    const h = mv.power ? hintFor(id, f.type) : '';
    if (h) { const hb = document.createElement('span'); hb.className = 'mv-hint h-' + (h === '2x' ? 'up' : 'down'); hb.textContent = h; b.appendChild(hb); }
    b.addEventListener('click', () => { if (battle.state !== 'CHOOSE' || b.disabled) return; sfx('tap'); resolveTurn({ kind: 'fight', move: id }); });
    box.appendChild(b);
  }
}
function toChoose(){
  const B = battle; if (!B.on) return;
  B.state = 'CHOOSE';
  const p = activePet(); B.me.mood = moodOf(p);              // mood is read at the start of each turn
  B.foePlan = aiPick();                                       // the AI decides before (and without seeing) the player's action
  $('#btMsg').textContent = 'What will ' + petName(p) + ' do?';
  renderBattleCards(); setPanel('acts');
}

/* --- AI (§6) --- */
function aiPick(){
  const B = battle, f = curFoe(), me = myBattler(), t = tr(), kind = t ? t.ai : 'wild', rng = B.rng;
  if (kind === 'leader' && !B.foeHealUsed && t.items && t.items.heal_snack && f.hp < 0.3 * f.maxHp) return { item: 'heal_snack' };
  const avail = f.moves.filter(m => m.uses > 0); if (!avail.length) return { move: 'wobble' };
  const statusOk = kind !== 'leader' || B.turn + 1 <= 2;
  const score = m => {
    const mv = MOVES[m.id];
    if (mv.power > 0) return mv.power * mv.acc / 100 * typeMult(mv.type, me.type) * (mv.type === f.type ? 1.25 : 1);
    if (!statusOk) return 0;
    const e = mv.effect || {};
    if (e.heal) return f.hp > 0.6 * f.maxHp ? 0 : 20;
    const st = e.target === 'self' ? f.stages : B.me.stages, cur = st[e.stat] || 0;
    if ((e.stages > 0 && cur >= 3) || (e.stages < 0 && cur <= -3)) return 0;
    return Math.abs(e.stages) >= 2 && e.target === 'foe' ? 25 : 20;   // §6 example scores Brace Rock (+2 self) at 20, so 25 = a foe-targeted ±2
  };
  const sc = avail.map(m => ({ id: m.id, s: score(m) }));
  const weighted = () => { const tot = sc.reduce((a, x) => a + Math.max(x.s, 5), 0); let r = rng() * tot; for (const x of sc) { r -= Math.max(x.s, 5); if (r < 0) return x.id; } return sc[sc.length - 1].id; };
  const best = () => { const top = Math.max(...sc.map(x => x.s)), ties = sc.filter(x => x.s === top); return ties[Math.floor(rng() * ties.length)].id; };
  if (kind === 'wild') return { move: weighted() };
  return { move: rng() < (kind === 'leader' ? 0.85 : 0.70) ? best() : weighted() };
}

/* --- turn resolution (§1) --- */
async function resolveTurn(action){
  const B = battle, id = B.id; if (B.state !== 'CHOOSE') return;
  B.state = 'RESOLVE'; B.turn++; setPanel('busy');
  if (action.kind !== 'fight') {
    const ended = await playerAction(action, id); if (!alive(id)) return;
    if (ended) return;
    await foeAct(id);
  } else {
    const me = myBattler(), fo = foeBattler(curFoe()), ms = effSpd(me), fs = effSpd(fo);
    const meFirst = ms > fs || (ms === fs && B.rng() < 0.5);
    if (meFirst) { await doMove('me', action.move, id); if (alive(id) && curFoe().hp > 0 && hpOf(activePet()) > 0) await foeAct(id); }
    else { await foeAct(id); if (alive(id) && hpOf(activePet()) > 0 && curFoe().hp > 0) await doMove('me', action.move, id); }
  }
  if (alive(id)) endCheck(id);
}
async function foeAct(id){
  const B = battle, f = curFoe(), plan = B.foePlan || { move: 'wobble' };
  if (f.hp <= 0) return;
  if (plan.item === 'heal_snack') {
    B.foeHealUsed = true; const h = Math.ceil(0.4 * f.maxHp); f.hp = Math.min(f.maxHp, f.hp + h);
    sfx('heal'); renderBattleCards(); await say(tr().name + ' used a Heal Snack! ' + foeName(f) + ' feels better.', id); return;
  }
  await doMove('foe', plan.move, id);
}
// Returns true when the action ended the battle (the foe then doesn't act).
async function playerAction(a, id){
  const B = battle, p = activePet(), f = curFoe();
  if (a.kind === 'run') {
    const ms = effSpd(myBattler()), fs = effSpd(foeBattler(f));
    const pr = ms >= fs ? 1 : Math.min(1, 0.4 + 0.5 * ms / fs + 0.15 * B.failedRuns);
    if (B.rng() < pr) { await finish('run', id); return true; }
    B.failedRuns++; sfx('denied'); await say("Couldn't get away!", id); return false;
  }
  if (a.kind === 'befriend') return befriendTry(id);
  if (a.kind === 'swap') {
    await say(btLine('swapOut', { pet: petName(p) }), id); if (!alive(id)) return true;
    B.me = { petId: a.id, stages: { atk: 0, def: 0, spd: 0 }, mood: moodOf(petById(a.id)) }; B.participants[B.fi].add(a.id);
    B.fx.push({ who: 'me', kind: 'pop', t0: now(), dur: 300 }); renderBattleCards();
    await say(btLine(B.kind === 'wild' ? 'wildSend' : 'playerSend', { pet: petName(petById(a.id)) }), id);
    B.foePlan = aiPick(); return false;                    // the foe re-reads the new target's type (no peeking at the action itself)
  }
  if (a.kind === 'bag') {
    S.bag[a.item] = (S.bag[a.item] || 0) - 1; if (S.bag[a.item] <= 0) delete S.bag[a.item];
    if (a.item === 'heal_snack') {
      const q = petById(a.target) || p; setMyHp(q, hpOf(q) + Math.ceil(0.4 * maxHpOf(q))); sfx('heal'); renderBattleCards(); save();
      await say(petName(q) + ' ate a Heal Snack and feels better!', id);
    } else if (a.item === 'befriend_treat') { B.treat = true; sfx('heal'); await say(foeName(f) + ' sniffs the treat. It looks friendlier!', id); }
    return false;
  }
  return false;
}
async function befriendTry(id){
  const B = battle, f = curFoe(), m = enc.mark;
  enc.freezeUntil = now() + 500;
  if (m >= enc.zone[0] && m <= enc.zone[1]) {
    const np = newPet(f.si, f.stage, 'wild', f.level); markCaught(f.si, f.stage);   // befriending is never blocked by the cap, only its XP
    if (f.hp < f.maxHp) np.hpNow = f.hp;
    if (!B.storyMoves) np.moves = f.moves.map(x => x.id).filter(x => x !== 'wobble');       // keeps the foe's moves (§2)
    if (!np.moves.length) np.moves = defaultMoves(f.form, f.level);
    const toBox = S.party.length >= PPSave.PARTY_MAX; (toBox ? S.box : S.party).push(np);
    sfx('befriend'); xpChimeDelay = 0.75;
    const gx = grantExploreXp(pet(), BEFRIEND_XP); xpChimeDelay = 0; pet().happy = clamp(pet().happy + 5, 0, 100);
    B.newId = np.id; B.lastGx = gx; B.toBox = toBox; if (toBox) toast(nameOf(f.si, f.stage) + ' was sent to your box.');
    B.fx.push({ who: 'foe', kind: 'hearts', t0: now(), dur: 1500 });
    awardFoe(B.fi); save();
    await finish('befriended', id); return true;
  }
  B.tries--; renderActs();
  if (B.tries <= 0) { sfx('flee'); await finish('fled', id); return true; }
  sfx('miss'); B.fx.push({ who: 'foe', kind: 'shake', t0: now(), dur: 400 });
  await say('Missed! It looks curious...', id); return false;
}

async function doMove(side, mid, id){
  const B = battle, mine = side === 'me', p = activePet(), f = curFoe();
  const mv = MOVES[mid] || MOVES.wobble; if (!MOVES[mid]) mid = 'wobble';
  if (mine ? hpOf(p) <= 0 : f.hp <= 0) return;             // a Fainted user skips
  if (mid !== 'wobble') { if (mine) usesOf(p)[mid]--; else { const m = f.moves.find(x => x.id === mid); if (m) m.uses--; } }
  const uName = mine ? petName(p) : foeLabel(f), tName = mine ? foeLabel(f) : petName(p);
  B.fx.push({ who: side, kind: 'lunge', t0: now(), dur: 300 });
  await say(uName + ' used ' + mv.name + '!', id); if (!alive(id)) return;
  const e = mv.effect || null, selfOnly = mv.power === 0 && e && e.target === 'self';
  if (!selfOnly && !(B.rng() < mv.acc / 100)) { sfx('miss'); await say(uName + "'s attack missed!", id); return; }
  if (mv.power > 0) {
    const att = mine ? myBattler() : foeBattler(f), def = mine ? foeBattler(f) : myBattler();
    const r = damage({ power: mv.power, moveType: mv.type, att, def, rng: B.rng });
    const key = mid + '>' + def.type; if (S.dex.hits[key] !== r.mult) { S.dex.hits[key] = r.mult; }   // type hint seen
    if (r.mult === 0) { sfx('hitWeak'); await say("It doesn't affect " + tName + '...', id); return; }
    if (mine) { f.hp = Math.max(0, f.hp - r.dmg); } else { setMyHp(p, hpOf(p) - r.dmg); }
    B.fx.push({ who: mine ? 'foe' : 'me', kind: r.mult > 1 ? 'flash' : 'shake', t0: now(), dur: 400 });
    sfx(r.mult > 1 ? 'hitStrong' : r.mult < 1 ? 'hitWeak' : 'hit'); renderBattleCards(); if (!mine) save();
    if (r.crit) { await say('A lucky hit!', id); if (!alive(id)) return; }
    if (r.mult > 1) await say("It's very effective!", id); else if (r.mult < 1) await say("It's not very effective...", id);
    if (!alive(id)) return;
    const tgtDown = mine ? f.hp <= 0 : hpOf(p) <= 0;
    if (e) {
      if (e.heal) await healUser(side, e.heal, id);
      else if (e.target === 'self') await applyStage(side, e, id);
      else if (!tgtDown) await applyStage(mine ? 'foe' : 'me', e, id);
    }
    if (!alive(id)) return;
    if (tgtDown) await knockOut(mine ? 'foe' : 'me', id);
    else if (mine ? false : false) {}
    if (alive(id) && (mine ? hpOf(p) <= 0 : f.hp <= 0)) await knockOut(side, id);   // (no recoil moves today; kept for safety)
    return;
  }
  if (e && e.heal) await healUser(side, e.heal, id);
  else if (e) await applyStage(e.target === 'self' ? side : (mine ? 'foe' : 'me'), e, id);
}
async function healUser(side, frac, id){
  const B = battle, mine = side === 'me', p = activePet(), f = curFoe();
  const max = mine ? maxHpOf(p) : f.maxHp, cur = mine ? hpOf(p) : f.hp, nm = mine ? petName(p) : foeLabel(f);
  if (cur >= max) { await say(nm + ' is already full of energy!', id); return; }
  const h = Math.ceil(frac * max);
  if (mine) setMyHp(p, Math.min(max, cur + h)); else f.hp = Math.min(max, cur + h);
  sfx('heal'); renderBattleCards(); if (mine) save();
  await say(nm + ' got some HP back!', id);
}
async function applyStage(side, e, id){
  const B = battle, mine = side === 'me', st = mine ? B.me.stages : curFoe().stages, nm = mine ? petName(activePet()) : foeLabel(curFoe());
  const cur = st[e.stat] || 0, nx = clamp(cur + e.stages, -3, 3), S_ = e.stat.toUpperCase();
  if (nx === cur) { sfx('denied'); await say(nm + "'s " + S_ + " won't go any " + (e.stages > 0 ? 'higher' : 'lower') + '!', id); return; }
  st[e.stat] = nx; B.fx.push({ who: side, kind: e.stages > 0 ? 'up' : 'down', t0: now(), dur: 700 });
  sfx(e.stages > 0 ? 'statUp' : 'statDown'); renderBattleCards();
  const d = Math.abs(nx - cur);
  await say(nm + "'s " + S_ + (e.stages > 0 ? (d > 1 ? ' rose sharply!' : ' rose!') : (d > 1 ? ' fell sharply!' : ' fell!')), id);
}
async function knockOut(side, id){
  const B = battle;
  if (side === 'me') {
    const p = activePet(); if (B.fainted.has(p.id)) return;
    faintPet(p); B.fainted.add(p.id); save();                 // §7.2: hpNow 0 + the 20-minute nap, written right away
    B.fx.push({ who: 'me', kind: 'faint', t0: now(), dur: 400 }); sfx('tired'); renderBattleCards();
    await say(btLine('petFainted', { pet: petName(p) }), id);
  } else {
    const f = curFoe(); if (f.down) return; f.down = true;
    B.fx.push({ who: 'foe', kind: B.kind === 'wild' ? 'flee' : 'faint', t0: now(), dur: 600 });
    awardFoe(B.fi);
    if (B.kind === 'wild') { sfx('flee'); await say(foeName(f) + ' fainted and wanders off to rest.', id); }
    else { sfx('tired'); await say(btLine('foeFainted'), id); }
  }
}
// Battle XP (§7) for a defeated or befriended foe: every participant that is still able (not Fainted, HP > 0) gets the award.
function awardFoe(fi){
  const B = battle, f = B.foes[fi];
  for (const pid of B.participants[fi]) {
    const p = petById(pid); if (!p || isFainted(p) || hpOf(p) <= 0) continue;
    const r = grantBattleXp(p, battleXpAward({ Lf: f.level, Lown: levelOf(p), foeStage: f.stage, trainer: B.kind === 'trainer' }), true);
    if (r.to > r.from) {
      const old = B.levelUps.find(x => x.id === pid);
      if (old) old.to = r.to; else B.levelUps.push({ id: pid, from: r.from, to: r.to });
    }
  }
}
async function endCheck(id){
  const B = battle, f = curFoe(), p = activePet();
  if (f.hp <= 0) {
    if (B.kind === 'trainer' && B.fi < B.foes.length - 1) {
      B.fi++; const nf = curFoe(); B.participants[B.fi].add(p.id); markSeen(nf.si, nf.stage);
      if (hpOf(p) > 0) {
        B.fx.push({ who: 'foe', kind: 'pop', t0: now(), dur: 300 }); renderBattleCards();
        await say(btLine('trainerSend'), id); if (!alive(id)) return;
      } else { renderBattleCards(); }
    } else { await finish('win', id); return; }
  }
  if (hpOf(activePet()) <= 0) {
    const next = S.party.filter(q => q.id !== B.me.petId && ablePet(q));
    if (!next.length) { await finish('tired', id); return; }
    const pick = await swapSheet(true); if (!alive(id)) return;
    const q = petById(pick) || next[0];
    B.me = { petId: q.id, stages: { atk: 0, def: 0, spd: 0 }, mood: moodOf(q) }; B.participants[B.fi].add(q.id);
    B.fx.push({ who: 'me', kind: 'pop', t0: now(), dur: 300 }); renderBattleCards();
    await say(btLine(B.kind === 'wild' ? 'wildSend' : 'playerSend', { pet: petName(q) }), id);
    if (B.kind === 'trainer' && curFoe().hp > 0 && B.foeJustSent) {}
  }
  if (alive(id)) toChoose();
}
// Swap sheet: party with HP; Fainted ("FAINTED 12m") and too-sleepy pets greyed. forced = can't cancel.
function swapSheet(forced){
  const B = battle, items = S.party.map(q => {
    const badge = hpBadge(q), sleepy = q.energy < STAT_RULES.MOOD.minBattleNrg;
    return { label: petName(q) + '  Lv ' + levelOf(q), sub: 'HP ' + Math.ceil(hpOf(q)) + '/' + maxHpOf(q) + (badge ? '  ' + badge : '') + (sleepy && !isFainted(q) ? '  TOO SLEEPY' : '') + (q.id === B.me.petId ? '  (in battle)' : ''),
      hp: hpOf(q) / maxHpOf(q), disabled: q.id === B.me.petId || !ablePet(q), value: q.id };
  });
  return openSheet(forced ? 'Who goes next?' : 'Swap to which pet?', items, forced ? null : 'BACK');
}
async function bagSheet(){
  const B = battle, ids = Object.keys(S.bag || {}).filter(k => S.bag[k] > 0);
  if (!ids.length) { sfx('denied'); B.state = 'MSG'; await say('Your bag is empty.'); if (B.on) toChoose(); return; }
  const NAMES = { heal_snack: 'Heal Snack', befriend_treat: 'Befriend Treat' };
  const pick = await openSheet('Bag', ids.map(k => ({ label: (NAMES[k] || k.replace(/_/g, ' ')) + '  x' + S.bag[k], value: k })), 'BACK');
  if (!pick || !B.on) return;
  if (pick === 'heal_snack') {
    const tgt = await openSheet('Heal which pet?', S.party.map(q => ({ label: petName(q), sub: 'HP ' + Math.ceil(hpOf(q)) + '/' + maxHpOf(q) + (hpBadge(q) ? '  ' + hpBadge(q) : ''), hp: hpOf(q) / maxHpOf(q), value: q.id })), 'BACK');
    if (!tgt || !B.on) return;
    const q = petById(tgt);
    if (isFainted(q)) { sfx('denied'); B.state = 'MSG'; setPanel('busy'); await say(petName(q) + ' needs a proper rest.'); if (B.on) toChoose(); return; }   // item not used
    return resolveTurn({ kind: 'bag', item: pick, target: tgt });
  }
  if (pick === 'befriend_treat' && B.kind === 'wild') return resolveTurn({ kind: 'bag', item: pick });
  sfx('denied'); B.state = 'MSG'; setPanel('busy'); await say("Can't use that here yet."); if (B.on) toChoose();
}

/* --- end of battle: lines, RESULTS (§7), CLOSE --- */
async function finish(result, id){
  const B = battle, t = tr(); B.result = result; B.state = 'END'; setPanel('busy');
  if (result === 'run') { /* toast on close */ }
  else if (result === 'fled') { B.fx.push({ who: 'foe', kind: 'flee', t0: now(), dur: 600 }); await say('It wandered off...', id); }
  else if (result === 'befriended') {
    const nm = foeName(curFoe());
    await say(nm + ' befriended!', id); if (!alive(id)) return;
    await say(nm + ' joined your collection! ' + (B.lastGx ? '(+' + B.lastGx + ' XP)' : '(No XP: explored enough today)'), id);
    if (B.toBox && alive(id)) await say(nm + ' was sent to your box.', id);
  } else if (result === 'win' && t) {
    sfx('win'); await say(btLine('trainerWin'), id); if (!alive(id)) return; await say(t.name + ': ' + trLine(t.lines.win), id);
  } else if (result === 'win') { sfx('win'); }
  else if (result === 'tired') {
    if (t) { await say(btLine('trainerLose'), id); if (!alive(id)) return; await say(t.name + ': ' + trLine(t.lines.lose), id); }
    else await say(btLine('trainerLose'), id);
  }
  if (!alive(id)) return;
  await results(result, id); if (!alive(id)) return;
  // END panel: OK (and the optional nickname after a befriend).
  if (result === 'run') { closeBattle(); return; }
  $('#btEndTitle').textContent = { win: 'You won!', befriended: foeName(curFoe()) + ' befriended!', fled: 'It wandered off...', tired: 'Your team fainted...' }[result] || '';
  if (result === 'befriended') { $('#encNick').value = ''; $('#encNick').placeholder = foeName(curFoe()); $('#encName').hidden = false; }
  $('#btOk').textContent = result === 'befriended' ? 'YAY!' : 'OK';
  setPanel('end'); fitBattle();
}
async function results(result, id){
  const B = battle, t = tr(), won = result === 'win' || result === 'befriended';
  const parts = new Set(); B.participants.forEach(s => s.forEach(x => parts.add(x)));
  parts.forEach(pid => { const p = petById(pid); if (p) applyBattleCosts(p, { tired: B.fainted.has(pid), won }); });   // once, clamp 0..100
  if (result === 'win' && t) {
    const money = t.money != null ? t.money : 10 * Math.max(...t.team.map(m => m.level)) * (t.hall ? 3 : 1);
    S.money = (S.money || 0) + money; S.flags['trainer.' + B.trainerId] = true;
    if (t.hall && t.seal) { S.seals[t.seal] = Date.now(); }
    save();
    await say(playerName() + ' got ' + money + ' coins!', id); if (!alive(id)) return;
    if (t.hall && t.seal) { sfx('evoFanfare'); sfx('levelup', 0.9); await say('You earned the ' + sealName(t.seal) + '!', id); if (!alive(id)) return; }
  }
  for (const lu of B.levelUps) {
    const p = petById(lu.id); if (!p) continue;
    sfx('levelup'); await say(petName(p) + ' grew to Lv ' + lu.to + '!', id); if (!alive(id)) return;
    for (const e of levelMoves(p, lu.from, lu.to)) { await teachMove(p, e.id, s => say(s, id)); if (!alive(id)) return; }
  }
  B.levelUps = []; save(); updateHUD();
}
const sealName = id => ({ seal_fernbrook: 'Fernbrook Seal' }[id] || id.replace(/^seal_/, '').replace(/^./, c => c.toUpperCase()) + ' Seal');

/* --- learning moves (§3): after RESULTS, after evolving, and the §3.4 sheet --- */
// Learnset entries (all stages up to the current one) with from < lv <= to, one per level, not yet known.
function levelMoves(p, from, to){
  const form = SPECIES[spi(p)].id + '/' + p.stage, seen = new Set();
  return learnset(form).filter(e => e.lv > from && e.lv <= to && e.lv >= 1 && !(p.moves || []).includes(e.id) && !seen.has(e.lv) && seen.add(e.lv));
}
// Teach `mid`: a free slot learns it at once; full slots open the replace sheet ("Don't learn" allowed). `tell` shows a line.
async function teachMove(p, mid, tell){
  if (!MOVES[mid] || mid === 'wobble') return 'none';
  if (!Array.isArray(p.moves)) p.moves = [];
  if (p.moves.includes(mid)) return 'known';
  const nm = petName(p), mv = moveName(mid);
  if (p.moves.length < 4) { p.moves.push(mid); save(); sfx('learn'); await tell(nm + ' learned ' + mv + '!'); return 'learned'; }
  const items = p.moves.map((x, i) => ({ label: moveName(x), sub: MOVES[x].type + '  ' + (MOVES[x].power ? 'PWR ' + MOVES[x].power : 'STATUS'), value: 'slot' + i }));
  items.push({ label: "Don't learn", value: 'skip', cls: 'skip' });
  const v = await openSheet(nm + ' wants to learn ' + mv + ' (' + MOVES[mid].type + (MOVES[mid].power ? ', PWR ' + MOVES[mid].power : '') + '). Replace which move?', items, null);
  if (!v || v === 'skip') { sfx('tap'); await tell(nm + ' did not learn ' + mv + '.'); return 'declined'; }
  const slot = +v.slice(4), old = p.moves[slot]; p.moves[slot] = mid; save(); sfx('learn');
  await tell(nm + ' forgot ' + moveName(old) + ' and learned ' + mv + '!'); return 'learned';
}
const infoSheet = text => openSheet(text, [{ label: 'OK', value: 'ok' }], null);
// Level-ups outside battle (debug giveBx) and the §3.4 evolution-move offer run from here when no overlay is open.
const learnQ = [];
let learnBusy = false;
function pendingEvoStage(p){ const have = Array.isArray(p.evoMoves) ? p.evoMoves : []; for (let k = 1; k <= p.stage; k++) if (!have.includes(k)) return k; return 0; }
function evoMoveOf(p, k){ const e = (LEARNSETS[SPECIES[spi(p)].id + '/' + k] || []).find(x => x[0] === 0); return e ? e[1] : null; }
async function pumpLearn(){
  if (learnBusy || !S || overlayOpen() || walk.intro) return;
  const p = [...S.party, ...S.box].find(q => pendingEvoStage(q));
  if (p) {
    learnBusy = true;
    try {
      const k = pendingEvoStage(p), mid = evoMoveOf(p, k);
      if (mid && !(p.moves || []).includes(mid)) { await infoSheet(petName(p) + ' remembers something from evolving!'); await teachMove(p, mid, infoSheet); }
      if (!Array.isArray(p.evoMoves)) p.evoMoves = [];
      if (!p.evoMoves.includes(k)) p.evoMoves.push(k);
      save();
    } finally { learnBusy = false; }
    return;
  }
  if (learnQ.length) {
    learnBusy = true;
    try { const j = learnQ.shift(), q = petById(j.id); if (q) await teachMove(q, j.mid, infoSheet); } finally { learnBusy = false; }
  }
}

/* --- generic choice sheet (#ovSheet, above the battle and evolve overlays) --- */
let sheetResolve = null;
function openSheet(title, items, cancel){
  if (sheetResolve) closeSheet(null);
  return new Promise(res => {
    $('#shTitle').textContent = title;
    const list = $('#shList'); list.textContent = '';
    items.forEach(it => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sh-item' + (it.cls ? ' ' + it.cls : ''); b.disabled = !!it.disabled;
      const l = document.createElement('span'); l.className = 'sh-l'; l.textContent = it.label; b.appendChild(l);
      if (it.sub) { const s2 = document.createElement('span'); s2.className = 'sh-s'; s2.textContent = it.sub; b.appendChild(s2); }
      if (it.hp != null) { const bar = document.createElement('span'); bar.className = 'sh-hp'; const i = document.createElement('i'); i.style.width = clamp(it.hp * 100, 0, 100) + '%'; if (it.hp < 0.25) i.className = 'warn'; bar.appendChild(i); b.appendChild(bar); }
      b.addEventListener('click', () => { if (b.disabled) return; sfx('tap'); closeSheet(it.value); });
      list.appendChild(b);
    });
    const c = $('#shCancel'); c.hidden = !cancel; c.textContent = cancel || 'BACK';
    sheetResolve = res; $('#ovSheet').hidden = false;
  });
}
function closeSheet(v){ const r = sheetResolve; sheetResolve = null; $('#ovSheet').hidden = true; if (r) r(v); }

/* --- actions from the UI --- */
function battleAct(act){
  const B = battle; if (!B.on || B.state !== 'CHOOSE') return;
  if ((act === 'run' || act === 'befriend') && B.kind !== 'wild') { sfx('denied'); say("You can't walk away from a challenge!").then(() => { if (B.on && B.state === 'CHOOSE') $('#btMsg').textContent = 'What will ' + petName(activePet()) + ' do?'; }); return; }
  sfx('tap');
  if (act === 'fight') setPanel('fight');
  else if (act === 'befriend') openBefriendBar();
  else if (act === 'run') resolveTurn({ kind: 'run' });
  else if (act === 'swap') swapSheet(false).then(v => { if (v && B.on && B.state === 'CHOOSE') resolveTurn({ kind: 'swap', id: v }); });
  else if (act === 'bag') bagSheet();
}
function openBefriendBar(){
  const B = battle, f = curFoe(), p = activePet();
  const w = befriendWidth(f.hp / f.maxHp, f.stage, p.happy, B.treat), c = 0.2 + Math.random() * 0.6;
  enc.zone = [clamp(c - w / 2, 0, 1), clamp(c + w / 2, 0, 1)]; enc.t0 = now(); enc.freezeUntil = 0; enc.open = true;
  $('#tzone').style.left = (enc.zone[0] * 100) + '%'; $('#tzone').style.width = ((enc.zone[1] - enc.zone[0]) * 100) + '%';
  $('#encTries').textContent = '\u2665'.repeat(B.tries) + '\u2661'.repeat(BEFRIEND_TRIES - B.tries);
  setPanel('bef');
}
function encounterPress(){                                  // BEFRIEND press (button or Space) = the player's action
  const B = battle; if (!B.on || B.state !== 'CHOOSE' || B.panel !== 'bef') return;
  if (now() < enc.freezeUntil) return;
  enc.open = false; resolveTurn({ kind: 'befriend' });
}

/* --- drawing --- */
function fitBattle(){
  const c = $('#battleCanvas'), box = $('#btStage'); if (!c || !box || $('#ovBattle').hidden) return;
  const cw = box.clientWidth, ch = box.clientHeight; if (!cw || !ch) return;
  const s = Math.max(2, Math.min(Math.floor(ch / 44), Math.floor(cw / 56)));   // big integer scale: 18px sprites read at ~x6 on a 390 phone
  const lw = Math.max(56, Math.floor(cw / s)), lh = Math.max(40, Math.floor(ch / s));
  if (c.width !== lw || c.height !== lh) { c.width = lw; c.height = lh; }
  c.style.width = (lw * s) + 'px'; c.style.height = (lh * s) + 'px';
}
let btParts = [];
function drawBattle(t, dt){
  const B = battle, c = $('#battleCanvas'), g = ctx(c), W = c.width, H = c.height, f = curFoe(), p = activePet(); if (!f || !p) return;
  g.drawImage(makeBackdrop(backdropName(), H, skyMode(), W), 0, 0); drawWeather(g, W, H, t);
  // befriend marker
  if (enc.open && t >= enc.freezeUntil) enc.mark = (Math.sin((t - enc.t0) * enc.speed) + 1) / 2;
  $('#tmark').style.left = (enc.mark * 100) + '%';
  // grass pads
  const fx0 = W - 26, fy0 = Math.max(4, Math.round(H * 0.18)), mx0 = 6, my0 = H - 14 - 14;
  g.fillStyle = PAL.t; g.fillRect(fx0 - 2, fy0 + 15, 22, 3); g.fillRect(mx0 - 2, my0 + 15, 22, 3);
  B.fx = B.fx.filter(e => t - e.t0 < e.dur || e.kind === 'faint' || e.kind === 'flee');
  const drawMon = (who, si, stage, x0, y0, mirror) => {
    let x = x0, y = y0, mode = (t % 2600) < 130 ? 'b' : 'n', hide = false;
    y += Math.floor(t / 450) % 2;
    for (const e of B.fx) {
      if (e.who !== who) continue; const k = clamp((t - e.t0) / e.dur, 0, 1);
      if (e.kind === 'lunge') x += Math.round(Math.sin(k * Math.PI) * 6) * (who === 'me' ? 1 : -1);
      if (e.kind === 'shake') x += (Math.floor(t / 60) % 2) * 2 - 1;
      if (e.kind === 'flash') { x += (Math.floor(t / 60) % 2) * 2 - 1; if (Math.floor(t / 80) % 2 === 0) mode = 'w'; }
      if (e.kind === 'faint') { y += Math.round(k * 4); mode = 's'; }
      if (e.kind === 'flee') { x += Math.round((t - e.t0) / 20); if (x > W) hide = true; }
      if (e.kind === 'pop' && k < 1) { if (k < 0.3) hide = true; else y -= Math.round(Math.sin((k - 0.3) / 0.7 * Math.PI) * 3); }
      if ((e.kind === 'up' || e.kind === 'down') && k < 1) { g.fillStyle = e.kind === 'up' ? PAL.y : PAL.b; const ay = y0 - 4 - Math.round(k * 3) * (e.kind === 'up' ? 1 : -1);
        for (let i = 0; i < 3; i++) g.fillRect(x0 + 15 - (e.kind === 'up' ? i : 2 - i), ay + i, 1 + 2 * (e.kind === 'up' ? i : 2 - i), 1); }
      if (e.kind === 'hearts' && Math.random() < dt * 8) btParts.push({ type: Math.random() < .5 ? 'heart' : 'spark', x: x0 + Math.random() * 16, y: y0 + 6, vy: -12, life: 1 });
    }
    if (who === 'me' && !B.meShown) hide = true;
    if (hide) return;
    const img = SPR[si][stage][mode];
    if (mirror) { g.save(); g.translate(x + 18, y); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore(); } else g.drawImage(img, x, y);
  };
  drawMon('foe', f.si, f.stage, fx0, fy0, false);
  if (B.kind === 'wild' && f.stage > 0 && Math.floor(t / 350) % 5 === 0) drawGlyph(g, 'spark', fx0 + 14, fy0 - 2);   // rare form twinkle
  drawMon('me', spi(p), p.stage, mx0, my0, true);             // back view = mirrored
  btParts = btParts.filter(pt => (pt.life -= dt) > 0);
  btParts.forEach(pt => { pt.y += pt.vy * dt; drawGlyph(g, pt.type, pt.x, pt.y); });
}

/* ---------- evolution ---------- */
const evo = { active: false, t0: 0, sp: 0, from: 0, to: 1, done: false };
function startEvolution(force){
  const p = pet(); if (!p || p.stage >= 2) { toast('Already at final form!'); return; }
  if (!force && !canEvolve(p)) return;
  if (overlayOpen()) return;
  clearMoves();
  Object.assign(evo, { active: true, t0: now(), sp: spi(p), from: p.stage, to: p.stage + 1, done: false });
  $('#evoTitle').textContent = 'What? ' + petName(p) + ' is evolving!';
  $('#evoMsg').innerHTML = '&nbsp;'; $('#evoOk').hidden = true; sfx('evoBuild');
  $('#ovEvolve').hidden = false; $('#tabs').classList.add('locked'); fitAll();
}
function finishEvolution(){
  const p = pet(), oldMax = maxHpOf(p); p.stage = evo.to; if (p.xp < EVO_XP[evo.to-1]) p.xp = EVO_XP[evo.to-1];
  carryHpOnEvolve(p, oldMax);                // new form's stats right away; current HP keeps the same % (rounded up)
  p.happy = clamp(p.happy + 15, 0, 100); markCaught(evo.sp, p.stage); evo.done = true; sfx('evoFanfare');
  $('#evoTitle').textContent = 'Congratulations!';
  $('#evoMsg').textContent = nameOf(evo.sp, evo.from) + ' evolved into ' + nameOf(evo.sp, evo.to) + '!';
  // BATTLE §3.3: the evolution move first, then the new form's level moves it already passed (one per OK tap).
  const form = SPECIES[evo.sp].id + '/' + evo.to, L = levelOf(p), rows = LEARNSETS[form] || [];
  evo.pid = p.id; evo.evoStage = evo.to;
  evo.queue = [...rows.filter(e => e[0] === 0), ...rows.filter(e => e[0] >= 1 && e[0] <= L).sort((x, y) => x[0] - y[0])].map(e => ({ id: e[1], evo: e[0] === 0 }));
  if (!evo.queue.some(e => e.evo)) markEvoStage(p, evo.to);
  $('#evoOk').hidden = false; updateHUD(); save();
}
function markEvoStage(p, k){ if (!Array.isArray(p.evoMoves)) p.evoMoves = []; if (!p.evoMoves.includes(k)) p.evoMoves.push(k); save(); }
const evoTell = text => { $('#evoMsg').textContent = text; return Promise.resolve(); };
async function evoOkTap(){
  if (evo.busy) return;
  const p = petById(evo.pid);
  while (p && evo.queue && evo.queue.length) {
    const e = evo.queue.shift();
    if ((p.moves || []).includes(e.id)) { if (e.evo) markEvoStage(p, evo.evoStage); continue; }   // known: skip silently
    evo.busy = true; $('#evoOk').disabled = true;
    try { await teachMove(p, e.id, evoTell); } finally { evo.busy = false; $('#evoOk').disabled = false; }
    if (e.evo) markEvoStage(p, evo.evoStage);
    return;                                                   // one item per OK tap
  }
  evo.active = false; $('#ovEvolve').hidden = true; lockTabs(false); updateHUD();
}
function drawEvolution(t){
  const c = $('#evoCanvas'), g = ctx(c), e = t - evo.t0;
  g.fillStyle = PAL.k; g.fillRect(0,0,56,44);
  for (let i=0;i<8;i++){ g.fillStyle = i % 2 ? PAL.n : PAL.p; const r = ((e/30 + i*8) % 64); g.fillRect(28 - r/2|0, 22 - r/3|0, r|0, 1); g.fillRect(28 - r/2|0, 22 + r/3|0, r|0, 1); }
  const x = 19, y = 13, S_ = SPR[evo.sp];
  if (e < 3200) {
    const period = Math.max(50, 420 - e / 8);
    const showNew = Math.floor(e / period) % 2 === 1;
    g.drawImage(showNew ? S_[evo.to].w : S_[evo.from].w, x, y);
    for (let i=0;i<8;i++){ const a = e/300 + i * Math.PI/4, r = 22 - e/200; drawGlyph(g, 'spark', 27 + Math.cos(a)*r, 21 + Math.sin(a)*r*0.8); }
  } else {
    if (!evo.done) finishEvolution();
    g.drawImage(S_[evo.to][(t % 2800) < 130 ? 'b' : 'n'], x, y + Math.floor(t/400)%2);
    for (let i=0;i<6;i++){ const a = t/600 + i*Math.PI/3; if ((Math.floor(t/200)+i)%3) drawGlyph(g, 'spark', 27 + Math.cos(a)*20, 21 + Math.sin(a)*15); }
    if (e < 3800) { g.fillStyle = 'rgba(244,244,244,' + (1 - (e - 3200) / 600) + ')'; g.fillRect(0,0,56,44); }
  }
}

/* ---------- stats card (TYPES_STATS as-built 7) ---------- */
// One overlay any tab can open for a pet id (Pet tab, Pets tab; later the Walk follower, MAPS_SLICE K.4).
// Bars: the pet's stats at its level, each scaled to the highest value of that stat across all 42 forms at the same level.
// No moves row until battles ship.
const STAT_KEYS = [['hp', 'HP'], ['atk', 'ATK'], ['def', 'DEF'], ['spd', 'SPD']];
const statMaxCache = {};
function statMaxAt(L){
  if (statMaxCache[L]) return statMaxCache[L];
  const m = { hp: 1, atk: 1, def: 1, spd: 1 };
  SPECIES.forEach(sp => sp.stages.forEach((st, k) => { const s = statsAt(sp.id + '/' + k, L); if (s) for (const [key] of STAT_KEYS) m[key] = Math.max(m[key], s[key]); }));
  return (statMaxCache[L] = m);
}
const typesWhere = f => TYPES.filter(f);
function chartLine(type){
  const strong = typesWhere(d => typeMult(type, d) === 2), weak = typesWhere(a => typeMult(a, type) === 2);
  return { strong, weak };
}
function growText(p){
  if (p.stage >= 2) return { text: 'Final form', ready: false };
  const left = Math.max(0, EVO_XP[p.stage] - p.xp);
  if (left > 0) return { text: 'GROW ' + left + ' to next form', ready: false };
  if (care(p) < EVO_CARE[p.stage]) return { text: 'GROW done \u00b7 care ' + EVO_CARE[p.stage] + '+ to evolve', ready: false };
  return { text: 'Ready to evolve!', ready: true };
}
const statsCard = { id: null, t: 0 };
function openStatsCard(id){
  const p = allPets().find(q => q.id === (id || S.partnerId)); if (!p) return false;
  if (!$('#ovStats').hidden) { statsCard.id = p.id; renderStatsCard(); return true; }
  if (overlayOpen()) return false;
  clearMoves(); statsCard.id = p.id; statsCard.t = 0; renderStatsCard();
  $('#ovStats').hidden = false; lockTabs(true); sfx('tap');
  $('#scClose').focus({ preventScroll: true });
  return true;
}
function closeStatsCard(){ if ($('#ovStats').hidden) return; $('#ovStats').hidden = true; statsCard.id = null; lockTabs(false); updateHUD(); }
function renderStatsCard(){
  const p = allPets().find(q => q.id === statsCard.id); if (!p) { closeStatsCard(); return; }
  const si = spi(p), sp = SPECIES[si], L = levelOf(p), st = statsAt(formIdOf(p), L) || { hp: 1, atk: 1, def: 1, spd: 1 }, max = statMaxAt(L);
  spriteCanvas($('#scIcon'), si, p.stage);
  $('#scName').textContent = petName(p);
  $('#scSpecies').textContent = (cleanNick(p.nick) ? nameOf(si, p.stage) + ' \u00b7 ' : '') + '\u2605'.repeat(p.stage + 1) + '\u2606'.repeat(2 - p.stage);
  $('#scStatsHead').textContent = 'STATS AT LV ' + L + ' \u00b7 bar = best of 42 forms';
  const tb = $('#scType'); tb.textContent = sp.type; tb.className = 'type-badge t-' + sp.type;
  $('#scLv').textContent = 'Lv ' + L;
  const gt = growText(p), ge = $('#scGrow'); ge.textContent = gt.text; ge.classList.toggle('ready', gt.ready);
  const hp = Math.ceil(hpOf(p)), mhp = maxHpOf(p), badge = hpBadge(p), glowing = !badge && moodOf(p).glowing;   // FAINTED > TIRED > GLOWING
  $('#scHp').textContent = hp + '/' + mhp;
  const hb = $('#scHpBar'); hb.style.width = (100 * hp / mhp) + '%'; hb.classList.toggle('warn', hp / mhp < 0.25);
  const tag = $('#scTag'); tag.hidden = !(badge || glowing); tag.textContent = badge || 'GLOWING';
  tag.className = 'sc-tag ' + (badge ? (badge === 'TIRED' ? 'tired' : 'fainted') : 'glowing');
  const box = $('#scStats'); box.innerHTML = '';
  for (const [key, label] of STAT_KEYS) {
    const row = document.createElement('div'); row.className = 'sc-stat'; row.dataset.stat = key;
    row.innerHTML = '<span></span><div class="bar"><i></i></div><b></b>';
    row.children[0].textContent = label; row.children[2].textContent = st[key];
    row.querySelector('i').style.width = (100 * st[key] / max[key]).toFixed(1) + '%';
    box.append(row);
  }
  const ch = chartLine(sp.type), el = $('#scChart'); el.innerHTML = '';
  const part = (lab, list) => { const s = document.createElement('span'); s.className = 'seg'; s.append(lab + ' '); const e = document.createElement('em'); e.textContent = list.join(', '); s.append(e); return s; };
  el.append(part('Strong vs', ch.strong), ' \u00b7 ', part('Weak to', ch.weak));
}

/* ---------- start over (Settings) ---------- */
// Erases the game (PPSave.startOver: v2 + v1 + .bak + corrupt record; device prefs stay) and reloads into the fresh-start path.
// This page stops saving first; another open tab stops saving too once it sees the key gone or a different game (uid).
// Confirm is press-and-hold (RESET_HOLD_MS) on the red button with a fill bar; letting go early cancels. Touch, mouse and keyboard (Space/Enter).
const RESET_HOLD_MS = 1500;
let resetting = false, gameReplaced = false;
const hold = { t0: 0, raf: 0, by: null };
function openReset(){
  if (!$('#ovReset').hidden) return;
  // Start over lives in Settings: allow opening the confirm while #ovSettings is up; block if any other overlay is open.
  if (overlayOpen() && $('#ovSettings').hidden) return;
  clearMoves(); holdStop(); $('#ovReset').hidden = false; lockTabs(true); sfx('tap'); $('#resetCancel').focus({ preventScroll: true });
}
function closeReset(){ if ($('#ovReset').hidden || resetting) return; holdStop(); $('#ovReset').hidden = true; lockTabs(!$('#ovSettings').hidden); }   // back to Settings if it was opened there
function holdStart(by){
  if (resetting || hold.by) return;
  hold.by = by; hold.t0 = performance.now(); $('#resetGo').classList.add('holding');
  const step = () => {
    const k = Math.min(1, (performance.now() - hold.t0) / RESET_HOLD_MS);
    $('#resetFill').style.width = (k * 100) + '%';
    if (k >= 1) { hold.by = null; startOver(); return; }
    hold.raf = requestAnimationFrame(step);
  };
  hold.raf = requestAnimationFrame(step);
}
function holdStop(){ if (resetting) return; cancelAnimationFrame(hold.raf); hold.by = null; $('#resetGo').classList.remove('holding'); $('#resetFill').style.width = '0'; }
function startOver(){
  if (resetting) return; resetting = true;
  PPSave.startOver();
  location.reload();
}

/* ---------- collection ---------- */
function renderCollection(){
  const list = $('#ownedList'); list.innerHTML = '';
  $('#ownedCount').textContent = '(' + allPets().length + ')';
  const label = txt => { const d = document.createElement('div'); d.className = 'group-label'; d.textContent = txt; list.append(d); };
  const card = (p, inBox) => {
    const c = document.createElement('div'); c.className = 'card' + (inBox ? ' boxed' : '');
    const cv = document.createElement('canvas'); cv.width = cv.height = 18; spriteCanvas(cv, spi(p), p.stage);
    const info = document.createElement('div');
    info.innerHTML = '<div class="nm"></div><div class="sub"></div>';
    info.firstChild.textContent = petName(p);
    info.lastChild.textContent = (cleanNick(p.nick) ? nameOf(spi(p), p.stage) : SPECIES[spi(p)].type) + '  Lv ' + levelOf(p) + '  ' + '\u2605'.repeat(p.stage+1) + '\u2606'.repeat(2-p.stage);
    const hb = hpBadge(p); if (hb) { const t = document.createElement('span'); t.className = 'pc-badge ' + (hb === 'TIRED' ? 'tired' : 'fainted'); t.textContent = hb; info.lastChild.append(t); }
    const open = document.createElement('button'); open.type = 'button'; open.className = 'card-open'; open.setAttribute('aria-label', 'Stats for ' + petName(p));
    const ico = document.createElement('span'); ico.className = 'ico'; ico.append(cv); open.append(ico, info);
    open.addEventListener('click', () => openStatsCard(p.id));
    c.append(open);
    if (p.id === S.partnerId) { const s = document.createElement('span'); s.className = 'partner'; s.textContent = '\u2605 PARTNER'; c.append(s); }
    else { const b = document.createElement('button'); b.className = 'btn btn-play'; b.textContent = 'PARTNER';
      b.addEventListener('click', () => { sfx('tap'); makePartner(p.id); save(); updateHUD(); renderCollection(); toast(petName(p) + ' is your partner now!'); });
      c.append(b); }
    list.append(c);
  };
  if (S.box.length) label('PARTY ' + S.party.length + '/' + PPSave.PARTY_MAX);
  S.party.forEach(p => card(p, false));
  if (S.box.length) { label('BOX ' + S.box.length); S.box.forEach(p => card(p, true)); }
  const dex = $('#dexGrid'); dex.innerHTML = ''; let n = 0;
  const owned = new Set(allPets().map(p => p.species + '/' + p.stage));
  SPECIES.forEach((sp, si) => sp.stages.forEach((st, k) => {
    const f = formOf(si, k), seen = !!S.dex.seen[f] || owned.has(f); if (seen) n++;
    const cell = document.createElement('div'); cell.className = 'cell';
    const cv = document.createElement('canvas'); cv.width = cv.height = 18; spriteCanvas(cv, si, k, seen ? 'n' : 's');
    if (!seen && sp.weatherOnly) { drawGlyph(ctx(cv), 'cloud', 10, 1); cell.title = 'Only seen in wild weather'; }   // "check back in bad weather"
    const lb = document.createElement('div'); lb.textContent = seen ? st.name : '???'; if (!seen) lb.className = 'unk';
    cell.append(cv, lb); dex.append(cell);
  }));
  $('#dexCount').textContent = n + '/' + (SPECIES.length * 3);
}
// Partner = the pet on the Pet tab; it must be in the party. A box pet joins the party first; if the party is full,
// the last party member that isn't the partner moves to the top of the box.
function makePartner(id){
  const bi = S.box.findIndex(p => p.id === id);
  if (bi >= 0) {
    const [p] = S.box.splice(bi, 1);
    if (S.party.length >= PPSave.PARTY_MAX) {
      for (let i = S.party.length - 1; i >= 0; i--) if (S.party[i].id !== S.partnerId) { S.box.unshift(S.party.splice(i, 1)[0]); break; }
    }
    S.party.push(p);
  }
  if (S.party.some(p => p.id === id)) S.partnerId = id;
}

/* ---------- friends (stub) ---------- */
function friendCode(){
  let h = 2166136261 >>> 0; const str = S.uid + ':' + S.created;
  for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  let h2 = Math.imul(h ^ 0x5bd1e995, 2654435761) >>> 0;
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let out = '';
  for (let i=0;i<8;i++){ const v = i < 4 ? h : h2; out += A[(v >>> (5 * (i % 4))) & 31]; }
  return 'PXP-' + out.slice(0,4) + '-' + out.slice(4);
}

/* ---------- starter ---------- */
function openStarter(){
  const list = $('#starterList'); list.innerHTML = '';
  SPECIES.forEach((sp, i) => {
    if (!sp.starter) return;                     // wild-only lines can't be picked as a first pet
    const b = document.createElement('button'); b.className = 'starter';
    const cv = document.createElement('canvas'); cv.width = cv.height = 18; spriteCanvas(cv, i, 0);
    const d = document.createElement('div'); d.innerHTML = '<span></span><small></small>';
    d.firstChild.textContent = sp.stages[0].name + '  [' + sp.type + ']'; d.lastChild.textContent = sp.blurb;
    b.append(cv, d);
    b.addEventListener('click', () => { sfx('befriend'); const np = newPet(i, 0, 'starter'); S.party.push(np); S.partnerId = np.id; markCaught(i, 0); placeFollower(); save();
      $('#ovStarter').hidden = true; $('#tabs').classList.remove('locked'); updateHUD(); toast(sp.stages[0].name + ' joined you!'); });
    list.append(b);
  });
  $('#ovStarter').hidden = false; $('#tabs').classList.add('locked');
}

/* ---------- input ---------- */
function bindInput(){
  $$('#tabs button').forEach(b => b.addEventListener('click', () => { if (b.dataset.tab !== screen) sfx('tap'); showTab(b.dataset.tab); }));
  $('#settingsBtn').addEventListener('click', () => { if ($('#ovSettings').hidden) openSettings(); else closeSettings(); });
  $('#setClose').addEventListener('click', () => { sfx('tap'); closeSettings(); });
  $('#ovSettings').addEventListener('click', e => { if (e.target === e.currentTarget) closeSettings(); });
  $('#setSound').addEventListener('click', () => { const m = PPSound.toggle(); renderSoundRow(); if (!m) sfx('tap'); toast(m ? 'Sound off' : 'Sound on'); });
  $('#setFollower').addEventListener('click', () => { toggleFollower(); renderFollowerBtn(); });
  $('#setLook').addEventListener('click', () => { sfx('tap'); closeSettings(); openLook(false); });
  ['#evoOk', '#geoAllow', '#geoLater', '#envBadge', '#envUseLoc', '#envClose', '#copyCode'].forEach(id => $(id).addEventListener('click', () => sfx('tap')));
  $$('[data-act]').forEach(b => b.addEventListener('click', () => doAction(b.dataset.act)));
  $('#evolveBtn').addEventListener('click', () => startEvolution(false));
  $('#evoOk').addEventListener('click', evoOkTap);
  $('#petStatsBtn').addEventListener('click', () => openStatsCard(S.partnerId));
  $('#lookShuffle').addEventListener('click', shuffleLook);
  $('#lookDone').addEventListener('click', lookDone);
  $('#lookCancel').addEventListener('click', () => { sfx('tap'); closeLook(); });
  const ln = $('#lookName');
  ln.addEventListener('input', () => { const v = ln.value.replace(BAD_NAME_CH, ''); if (v !== ln.value) ln.value = v; });   // `<b>` can't be typed
  ln.addEventListener('focus', () => ln.select());
  ln.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ln.blur(); } });
  $('#startOver').addEventListener('click', openReset);
  $('#resetCancel').addEventListener('click', () => { sfx('tap'); closeReset(); });
  const rg = $('#resetGo');
  rg.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); try { rg.setPointerCapture(e.pointerId); } catch(err) {} holdStart('pointer'); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => rg.addEventListener(ev, () => { if (hold.by === 'pointer') holdStop(); }));
  rg.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); holdStart('key'); } else if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); });
  rg.addEventListener('keyup', e => { if ((e.key === ' ' || e.key === 'Enter') && hold.by === 'key') holdStop(); });
  rg.addEventListener('blur', () => { if (hold.by === 'key') holdStop(); });
  rg.addEventListener('contextmenu', e => e.preventDefault());   // long-press menu on phones
  $('#ovReset').addEventListener('click', e => { if (e.target === e.currentTarget) closeReset(); });
  window.addEventListener('storage', e => {                // another tab started over: say so once (this page has stopped saving)
    if ((e.key === PPSave.V2_KEY || e.key === null) && !resetting && S && allPets().length) {
      let o = null; try { o = JSON.parse(localStorage.getItem(PPSave.V2_KEY)); } catch(err) {}
      if (!o || o.uid !== S.uid) { if (!gameReplaced) toast('This game was reset in another tab. Reload to play the new one.'); gameReplaced = true; }
    }
  });
  $('#scClose').addEventListener('click', () => { sfx('tap'); closeStatsCard(); });
  $('#ovStats').addEventListener('click', e => { if (e.target === e.currentTarget) closeStatsCard(); });   // tap outside the card
  $('#encNick').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (battle.panel === 'end') closeBattle(); } });
  // battle (BATTLE §8)
  $$('[data-bact]').forEach(b => b.addEventListener('click', () => battleAct(b.dataset.bact)));
  $('#btFightBack').addEventListener('click', () => { if (battle.state === 'CHOOSE') { sfx('tap'); setPanel('acts'); } });
  $('#btBefBack').addEventListener('click', () => { if (battle.state === 'CHOOSE') { sfx('tap'); enc.open = false; setPanel('acts'); } });
  $('#encGo').addEventListener('click', encounterPress);
  $('#btOk').addEventListener('click', () => { if (battle.panel === 'end') { sfx('tap'); closeBattle(); } });
  $('#btMsg').addEventListener('click', skipMsg);
  $('#shCancel').addEventListener('click', () => { sfx('tap'); closeSheet(null); });
  $('#geoAllow').addEventListener('click', () => { closeGeoAsk(); useLocation(); });
  $('#geoLater').addEventListener('click', () => { PPEnv.setGeoPref('deny'); closeGeoAsk(); toast('OK! A meadow for now. Tap the area badge to change.'); });
  $('#envBadge').addEventListener('click', openEnvCard);
  $('#envUseLoc').addEventListener('click', () => { closeEnvCard(); useLocation(); });
  $('#envClose').addEventListener('click', closeEnvCard);
  buildPresetButtons();
  $('#copyCode').addEventListener('click', () => {
    const code = friendCode();
    const done = () => toast('Copied ' + code);
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(done, () => toast(code));
    else toast('Your code: ' + code);
  });
  // D-pad: press & hold. A quick tap still moves one tile.
  $$('.dp[data-dir]').forEach(b => {
    const dir = b.dataset.dir;
    const down = e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch(_) {} walk.dpad = dir; walk.queued = DIRS[dir]; b.classList.add('on'); };
    const up = e => { if (walk.dpad === dir) walk.dpad = null; b.classList.remove('on'); };
    b.addEventListener('pointerdown', down);
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev => b.addEventListener(ev, up));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  // Map: tap a tile to walk there, or drag to steer.
  const mc = $('#mapCanvas'); let ptr = null;
  mc.addEventListener('pointerdown', e => { e.preventDefault(); try { mc.setPointerCapture(e.pointerId); } catch(_) {} ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, dragged: false }; });
  mc.addEventListener('pointermove', e => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (Math.hypot(dx, dy) > 18) { ptr.dragged = true; walk.drag = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
  });
  const end = e => {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (!ptr.dragged && e.type === 'pointerup') {
      const r = mc.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * mc.width + walk.cam.x, y = (e.clientY - r.top) / r.height * mc.height + walk.cam.y;
      const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
      const w = wild.list.find(o => (o.x === tx && o.y === ty) || (Math.round(o.fx) === tx && Math.round(o.fy) === ty));
      if (w) { if (wild.chase !== w.id) sfx('notice'); wild.chase = w.id; walk.target = { x: w.x, y: w.y }; }       // tap a creature: walk up and meet it
      else if (followerAt(tx, ty)) { clearMoves(); openStatsCard(pet().id); }                                      // tap the follower: its stats card (K.4)
      else if (!solid(tx, ty)) { wild.chase = null; walk.target = { x: tx, y: ty }; }
    }
    walk.drag = null; ptr = null;
  };
  mc.addEventListener('pointerup', end); mc.addEventListener('pointercancel', end);
  // Keyboard (bonus)
  const KEYS = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right', W:'up', S:'down', A:'left', D:'right' };
  window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'Escape' && !$('#ovStats').hidden) { closeStatsCard(); return; }
    if (e.key === 'Escape' && !$('#ovReset').hidden) { closeReset(); return; }
    if (e.key === 'Escape' && !$('#ovSettings').hidden) { closeSettings(); return; }
    if (e.key === 'Escape' && !$('#ovLook').hidden && !lookUI.newPlayer) { closeLook(); return; }
    if (KEYS[e.key] && screen === 'walk') { e.preventDefault(); if (walk.key !== KEYS[e.key]) walk.queued = DIRS[KEYS[e.key]]; walk.key = KEYS[e.key]; return; }
    if (DEBUG) {                                 // debug keys only with ?debug=1
      if (e.key === 'e' || e.key === 'E') { startEvolution(true); return; }          // force evolve
      if (e.key === 'g' || e.key === 'G') { if (!overlayOpen()) { showTab('walk'); if (!overlayOpen()) startEncounterIntro(); } return; } // force encounter (spawn-weighted species)
      if (e.key === 'f' || e.key === 'F') { setFast(!fastMode); return; }          // toggle fast decay
      if (e.key === 'h' || e.key === 'H') { healTeam(); toast('Team healed (debug)'); return; }
    }
    if (!$('#ovSheet').hidden) { if (e.key === 'Escape' && !$('#shCancel').hidden) closeSheet(null); return; }
    if (!$('#ovBattle').hidden) { battleKey(e); return; }
    if ('1234'.includes(e.key)) showTab(['pet','walk','col','friends'][+e.key - 1]);
  });
  window.addEventListener('keyup', e => { if (KEYS[e.key] === walk.key) walk.key = null; });
  window.addEventListener('blur', clearMoves);
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
}

/* ---------- main loop ---------- */
let lastT = now(), tickAcc = 0;
function frame(t){
  const dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
  const p = pet();
  if (p && !overlayOpen()) {
    const sleeping = t < anim.sleepUntil, R = rate();
    allPets().forEach(q => {                         // every owned pet (party and box) gets hungry, not just the partner
      q.hunger = clamp(q.hunger - R.hunger * dt, 0, 100);
      q.happy = clamp(q.happy - R.happy * dt * (q.hunger < 20 ? 2 : 1), 0, 100);
      if (!(sleeping && q.id === S.partnerId)) q.energy = clamp(q.energy - R.energy * dt, 0, 100);   // only the resting partner is exempt
    });
    tickAcc += dt; if (tickAcc > 1) { tickAcc = 0; updateHUD(); }
  }
  if (p && $('#ovBattle').hidden) regenAll(dt);          // out of battle only
  if (S && screen === 'walk') {                  // the keeper walks with or without a partner; wild creatures only come with one
    if (!overlayOpen() || walk.intro) updateWalk(dt, t);
    if (p && !overlayOpen() && !walk.intro) updateWild(dt);
    drawMap(t);
  }
  if (!$('#ovLook').hidden) drawLookPreview(t);
  if (p) {
    if (screen === 'pet') { drawPetScene(t, dt); updateCareButtons(); }
    if (!$('#ovBattle').hidden) drawBattle(t, dt);
    else if (!overlayOpen()) pumpLearn();
    if (evo.active) drawEvolution(t);
    if (!$('#ovStats').hidden && (statsCard.t += dt) >= 1) { statsCard.t = 0; renderStatsCard(); }   // HP regen etc. stay live
  }
  requestAnimationFrame(frame);
}

/* ---------- HP regen (TYPES_STATS §7) ---------- */
// Out of battle every pet regains 10% of max HP per 10 real minutes (real time even in fast mode). Kept apart from the
// care decay above and in catchUp so it can't change FOOD/JOY/NRG.
function regenAll(sec){ if (S && sec > 0) allPets().forEach(q => { regenHp(q, sec); wakeIfRested(q); }); }   // regen keeps running during a faint nap (BATTLE §7.2)

/* ---------- offline catch-up ---------- */
// Applies `sec` seconds of away-time decay to every owned pet at the current rate mode.
// No time cap: the floor already protects players, so a pet is never pushed below 10 and stats
// already <= 10 stay put. (Joy uses the base rate here; the hunger<20 doubling is live-only.)
function catchUp(sec){
  if (!(sec > 0) || !S || !allPets().length) return;
  const R = rate();
  const dec = (v, amt) => v <= OFFLINE_FLOOR ? v : Math.max(OFFLINE_FLOOR, v - amt);
  allPets().forEach(p => { p.hunger = dec(p.hunger, sec*R.hunger); p.happy = dec(p.happy, sec*R.happy); p.energy = dec(p.energy, sec*R.energy); });
}
// A backgrounded tab pauses requestAnimationFrame (and the periodic save keeps bumping S.last),
// so catch up on return using the time the tab was actually hidden.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (hiddenAt && S) { const sec = (Date.now() - hiddenAt) / 1000; catchUp(sec); regenAll(sec); hiddenAt = 0; updateHUD(); save(); }
});

/* ---------- boot ---------- */
// The v2 key holds a save from a newer build: block play, write nothing (save() is a no-op), keep the save as-is.
function bootReadOnly(){
  readOnly = true; S = null;
  $('#ovNewer').hidden = false; $('#tabs').classList.add('locked');
  $('#newerReload').addEventListener('click', () => location.reload());
  window.PixelPets = Object.freeze({ readOnly: true, get debug(){ return DEBUG; }, get state(){ return null; } });
}
function boot(){
  $$('#tabs canvas').forEach(c => iconCanvas(c, ICONS[c.dataset.icon], PAL.y));
  fastMode = readFastPref(); renderFastTag(); $('#dbgTag').hidden = !DEBUG;
  $('#envPick').hidden = !DEBUG;               // "Pick a place" presets are debug-only
  renderSettingsGear(); renderSoundRow();
  ENV = PPEnv.init(onEnvChange, { allowOverride: DEBUG }); renderEnv();
  if (PPEnv.geoPref() === 'allow') PPEnv.refresh();
  setInterval(() => { PPEnv.tick(); if (!document.hidden && PPEnv.geoPref() === 'allow') PPEnv.refresh(); }, 5 * 60e3);
  PPSave.devCheck(); statsDevCheck();
  const L = PPSave.loadSave();
  if (L.readOnly) { bootReadOnly(); return; }
  S = L.state;                                       // migrated/normalized v2; nothing saved yet, so away-time is intact
  if (allPets().length) { const away = (Date.now() - S.last) / 1000; catchUp(away); regenAll(away); }
  if (solid(S.world.x, S.world.y)) { S.world.x = 3; S.world.y = 3; }
  walk.fx = S.world.x; walk.fy = S.world.y;
  bindInput();
  placeFollower(); renderFollowerBtn(); renderKeeperName();
  // New players pick a look (and a name) first, then a starter; a look already picked goes straight to the starter (K.2).
  if (!allPets().length) { if (!S.player.look) openLook(true); else openStarter(); }      // keeps S (uid, created, orphans)
  else { updateHUD(); if (!S.player.look) setTimeout(() => toast("New: pick your keeper's look on the Pet tab."), L.notice === 'recovered' ? 2700 : 900); }   // after the recovery notice, never over it
  if (L.notice === 'recovered') setTimeout(() => toast("Your save couldn't be read, so your older save was loaded."), 600);
  fitAll();
  if (fastMode) setTimeout(() => toast('FAST MODE ON (debug decay)'), 400);
  setInterval(save, 5000);
  requestAnimationFrame(t => { lastT = t; frame(t); });
  // Console hooks. Read-only ones are always there and can't change the game; anything that cheats
  // (XP, evolving, spawning, places, fast mode, live state) only works with ?debug=1.
  const copy = o => JSON.parse(JSON.stringify(o));
  const api = {
    get debug(){ return DEBUG; }, get fast(){ return fastMode; }, get rates(){ return { ...rate() }; },
    get state(){ return DEBUG ? S : copy(S); },                     // a snapshot unless debugging
    get env(){ return ENV && { ...ENV, tags: ENV.tags.slice() }; }, refreshEnv: () => PPEnv.refresh(true),
    get wild(){ return wild.list.map(w => ({ id: w.id, sp: w.sp, stage: w.stage, lv: w.lv, x: w.x, y: w.y, fx: w.fx, fy: w.fy, moving: !!w.to, shy: (w.shyUntil || 0) > wild.clock, name: nameOf(w.sp, w.stage) })); },
    get poofs(){ return wild.poofs.length; },
    spawnOdds: tags => spawnOdds(tags), cooldownLeft: act => cdLeft(pet(), act),
    get careXpToday(){ return xpToday(pet(), 'cx'); }, get exploreXpToday(){ return xpToday(pet(), 'ex'); },
    get muted(){ return PPSound.muted; }, careGain, showTab,
    moves: () => JSON.parse(JSON.stringify(MOVES)), learnset: f => learnset(f).map(e => ({ ...e })),
    defaultMoves: (f, L) => defaultMoves(f, L).slice(), befriendWidth,
    battleLine: (k, v) => battleLine(k, v),
    typeMult: (a, d) => typeMult(a, d), statsAt: (id, L) => { const s = statsAt(id, L); return s && { ...s }; },   // read-only, always public
    openStats: id => openStatsCard(id), closeStats: () => closeStatsCard(),          // UI only (the same as tapping STATS / CLOSE)
    get statsCard(){ return { open: !$('#ovStats').hidden, id: statsCard.id }; },
    get petScene(){ const c = $('#petCanvas'); return { backdrop: backdropName(), sky: skyMode(), tags: envTags().slice(), w: c.width, h: c.height, cssW: parseFloat(c.style.width)||0, cssH: parseFloat(c.style.height)||0 }; },
    get keeper(){ return { x: S.world.x, y: S.world.y, fx: walk.fx, fy: walk.fy, facing: S.world.facing, frame: keeperFrame(), moving: !!walk.to,
      look: Object.assign({}, KEEPER_LOOKS.defaults, lookOf() || {}), name: playerName(), builds: keeperBuilds }; },
    get follower(){ const p = pet(); return { on: followerOn(), shown: fol.x != null && followerOn(), x: fol.x, y: fol.y, fx: fol.fx, fy: fol.fy, facing: fol.facing,
      moving: !!fol.to, id: p ? p.id : null, tired: !!(p && isTired(p)), fainted: !!(p && isFainted(p)), bob: followerBob(now()), droop: p && isFainted(p) ? 1 : 0, under: fol.x === S.world.x && fol.y === S.world.y }; },
  };
  const cheats = {
    forceEvolve: () => startEvolution(true), forceEncounter: () => { showTab('walk'); if (!overlayOpen()) startEncounterIntro(); },
    forceBattle: (form, level) => {
      showTab('walk'); if (overlayOpen()) return;
      let f = form, lv = level;
      if (!f) { const sp = pickSpecies(), st = pickStage(); f = SPECIES[sp].id + '/' + st; lv = lv || wildLevel(st, Math.random, 'proto', SPECIES[sp].id); }
      const [line, st] = String(f).split('/'); if (SP_INDEX[line] == null || !SPECIES[SP_INDEX[line]].stages[+st]) return false;
      return openBattle({ kind: 'wild', form: f, level: lv || wildLevel(+st, Math.random, 'proto', line) });
    },
    forceTrainer: id => { if (!TRAINERS[id] || S.flags['trainer.' + id]) return false; showTab('walk'); if (overlayOpen()) return; return openBattle({ kind: 'trainer', trainerId: id }); },
    setHp: (who, n) => {
      if (!battle.on) return; if (who === 'foe') { const f = curFoe(); f.hp = clamp(Math.round(+n), 0, f.maxHp); }
      else { const p = activePet(); setMyHp(p, +n); } renderBattleCards(); save();
    },
    winBattle: () => { if (battle.on) finish('win', battle.id); }, loseBattle: () => { if (battle.on) finish('tired', battle.id); },
    healTeam, setFaint: (min = 20) => { const p = pet(); if (!p) return; if (min <= 0) { delete p.faintUntil; delete p.hpNow; } else faintPet(p, Date.now() - (20 - min) * 60000); updateHUD(); save(); },
    giveItem: (id, n = 1) => { S.bag[id] = (S.bag[id] || 0) + Math.max(0, n | 0); save(); return S.bag[id]; },
    setMoney: n => { S.money = Math.max(0, n | 0); save(); return S.money; },
    battle,
    setMoves: ids => { const p = pet(); if (!p) return; p.moves = (ids || []).filter(id => MOVES[id]).slice(0, 4); save(); return p.moves.slice(); },
    aiPick: () => battle.on ? aiPick() : null,   // tests: the AI's pick for the current turn (same rng as the battle)
    clearEvoMoves: () => { const p = pet(); if (!p) return; p.evoMoves = []; save(); },
    setEnv: x => { const e = PPEnv.setOverride(x); resetWild(); return e && { ...e }; },
    spawnWild: (sp, stage, x, y) => { const w = spawnWild(sp, stage, x != null ? [x, y] : null); return w && { id: w.id, sp: w.sp, stage: w.stage, lv: w.lv, x: w.x, y: w.y, name: nameOf(w.sp, w.stage) }; },
    clearWild: () => { wild.list = []; wild.poofs = []; wild.chase = null; wild.started = true; wild.auto = false; }, autoWild: () => resetWild(),
    pickSpecies: tags => pickSpecies(tags), pickStage: () => pickStage(),
    giveXp: n => { pet().xp += n; updateHUD(); }, setFast: on => setFast(on),
    giveBx: (n, learn) => { const p = pet(), r = grantBattleXp(p, n); if (learn) levelMoves(p, r.from, r.to).forEach(e => learnQ.push({ id: p.id, mid: e.id })); updateHUD(); save(); return r; },   // battle XP (Level); learn=true queues the level-up move prompts
    resetDailyCaps: () => { const p = pet(); if (!p) return; delete p.cx; delete p.ex; updateHUD(); save(); toast('Daily XP caps reset (debug)'); },
    makePartner: id => { makePartner(id); updateHUD(); save(); },
    setMapBackdrop: v => { const m = MAP_INFO[S.world.map] || (MAP_INFO[S.world.map] = {}); if (v == null) delete m.backdrop; else m.backdrop = v; return backdropName(); },
    enc, walk,
  };
  let warned = false;
  for (const [k, v] of Object.entries(cheats)) {
    if (DEBUG) { api[k] = v; continue; }
    if (typeof v === 'function') api[k] = () => { if (!warned) { warned = true; console.info('Kindle Wild: debug hooks need ?debug=1 in the URL.'); } return undefined; };
  }
  window.PixelPets = Object.freeze(api);
}
boot();
})();
