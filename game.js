/* Walklings - game logic. No dependencies. (Identifiers keep the old name: window.PixelPets, pixelpets.* storage keys.) */
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
// PACING v0.1 §5 (locked by Vincent, Oct 8): decay by role, live and away. Partner x1, other party pets x0.5, box pets paused.
// The RATE values, FEED amount, floor and food per step are unchanged (still being revisited).
const ROLE_MULT = { partner: 1, party: 0.5, box: 0 };
const roleOf = q => q.id === S.partnerId ? 'partner' : S.party.includes(q) ? 'party' : 'box';
const roleMult = q => ROLE_MULT[roleOf(q)];
// PACING v0.1 §4 Warm Bowl: the first FEED of each local day (one per player) gives FOOD +15 on top and JOY +5 instead of +3.
const BOWL = { food: 15, joy: 5, flag: 'daily.warm_bowl' };
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
// CREATURES_SLICE §5 faded state: the same sprite with fadedCol(col) (light -> w, mid-light -> h, mid -> m, dark -> d); not a new form.
const FADE_KEY = { y: 'w', s: 'w', l: 'w', w: 'w', o: 'h', c: 'h', g: 'h', h: 'h', r: 'm', b: 'm', t: 'm', m: 'm', p: 'd', n: 'd', d: 'd', k: 'd' };
const PAL_KEY = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [v, k]));
const fadedCol = col => Object.fromEntries(Object.entries(col).map(([ch, v]) => [ch, PAL[FADE_KEY[PAL_KEY[v]]] || v]));
const FADED_SPR = {};
function sprSet(si, stage, faded){
  if (!faded) return SPR[si][stage];
  const k = si + '/' + stage;
  if (!FADED_SPR[k]) {
    const st = SPECIES[si].stages[stage], col = fadedCol(st.col), n = buildSprite(st.half, col, 'normal');
    FADED_SPR[k] = { n, b: buildSprite(st.half, col, 'blink'), w: SPR[si][stage].w, s: SPR[si][stage].s, u: SPECIES[si].uiHalo ? haloSprite(n, PAL.h) : null };
  }
  return FADED_SPR[k];
}
const isFaded = p => !!p && (+p.faded || 0) > 0;
const petSpr = p => sprSet(spi(p), p.stage, isFaded(p));

function ctx(c){ const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return g; }
function iconCanvas(c, grid, color){ const g = ctx(c); g.clearRect(0,0,c.width,c.height); g.fillStyle = color;
  grid.forEach((row,y) => [...row].forEach((ch,x) => { if (ch === '#') g.fillRect(x,y,1,1); })); }
// UI sprite (header, collection, dex, starter): dark species get their halo version on these dark cells.
function spriteCanvas(c, sp, stage, mode='n', faded=false){ const g = ctx(c), s = sprSet(sp, stage, faded); g.clearRect(0,0,c.width,c.height); g.drawImage(mode === 'n' && s.u ? s.u : s[mode], 0, 0); }

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
let saveTimer = 0, readOnly = false;              // a save from a newer build: play nothing, write nothing
// Once Start over has begun, nothing on this page may write again (pagehide / hidden / the 5 s timer fire while it reloads).
let resetting = false, gameReplaced = false;
function save(){ if (!S || readOnly || resetting) return; S.last = Date.now(); PPSave.writeV2(S); }
const allPets = () => [...S.party, ...S.box];
const pet = () => S.party.find(p => p.id === S.partnerId);
const nameOf = (sp, st) => SPECIES[sp].stages[st].name;
// Nicknames (CREATURES_SLICE §6): optional, offered after a befriend. Cleaned for display only; the saved string is never rewritten.
const NICK_MAX = 10;
const cleanNick = v => typeof v === 'string' ? v.normalize('NFKC').replace(/[^A-Za-z0-9 '.!?-]/g, '').replace(/\s+/g, ' ').trim().slice(0, NICK_MAX).trim() : '';
const petName = p => cleanNick(p.nick) || nameOf(spi(p), p.stage);
// Level comes from battle XP (p.bx, stats.js levelOf); growth XP (p.xp) only drives evolution.
const care = p => Math.round((p.hunger + p.happy + p.energy) / 3);
const canEvolve = p => !isFaded(p) && p.stage < 2 && p.xp >= EVO_XP[p.stage] && care(p) >= EVO_CARE[p.stage];
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
// the build id: tools/bump_build.py writes window.BUILD and the ?v= stamps together, so this line always matches them
function buildId(){ const m = document.querySelector('meta[name="kw-build"]'); return String(window.BUILD || (m && m.content) || ''); }
function renderBuild(){ const b = buildId(); $('#setBuild').textContent = b ? 'Build ' + b : ''; $('#setBuild').hidden = !b; }
function openSettings(){
  if (overlayOpen() && $('#ovSettings').hidden) return;
  if (!$('#ovSettings').hidden) return;
  clearMoves(); renderSoundRow(); renderFollowerBtn(); renderBuild();
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
  if (name === 'walk' && !PPEnv.geoPref() && allPets().length) openGeoAsk();     // first Walk visit with a partner: ask about location (once)
}
const overlayOpen = () => !$('#ovBattle').hidden || !$('#ovSheet').hidden || !$('#ovEvolve').hidden || !!scene || !$('#ovBasket').hidden || !$('#ovGeo').hidden || !$('#ovEnv').hidden || !$('#ovStats').hidden || !$('#ovReset').hidden || !$('#ovLook').hidden || !$('#ovSettings').hidden;

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
  const tb = $('#tabs'); if (tb) document.documentElement.style.setProperty('--tabs-h', tb.offsetHeight + 'px');   // the text box sits above the tab bar
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
  const p = pet(); $('#hdrLv').parentNode.hidden = !p;       // no "Lv 1" / stars before there's a partner
  if (!p) return;
  const st = SPECIES[spi(p)].stages[p.stage];
  $('#hdrName').textContent = cleanNick(p.nick) || st.name;
  $('#hdrLv').textContent = 'Lv ' + levelOf(p);
  $('#hdrStage').textContent = '\u2605'.repeat(p.stage + 1) + '\u2606'.repeat(2 - p.stage);
  spriteCanvas($('#hdrIcon'), spi(p), p.stage, 'n', isFaded(p));
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
  else if (isFaded(p)) { hint.textContent = 'Faded: ' + p.faded + ' good-care day' + (p.faded > 1 ? 's' : '') + ' to go (care 60+).'; hint.classList.remove('ready'); btn.hidden = true; }
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
// above 80 at a quarter (PLAY joy, REST energy).
// FEED (PACING Q2, design fa276b3): +40 with FOOD-only bands: full value below 80, a quarter at/above 80, piecewise across 80.
// So FEED from 20 / 50 / 80 ends at 60 / 82.5 / 90 (the Warm Bowl's +15 comes on top, outside the bands).
const GAIN_BANDS = [[50, 1], [80, 0.5], [Infinity, 0.25]];
const FEED_FOOD = 40, FEED_BANDS = [[80, 1], [Infinity, 0.25]];
function careGain(base, cur, bands = GAIN_BANDS){
  let v = cur, left = base;
  for (const [top, k] of bands) {
    if (left <= 0) break;
    if (v >= top) continue;
    const need = (top - v) / k;               // base points it takes to fill this band
    if (left <= need) { v += left * k; left = 0; } else { v = top; left -= need; }
  }
  return v - cur;
}
const bowlReady = () => !!S && S.flags[BOWL.flag] !== dayKey(Date.now());
let bowlToldDay = null;                      // "A Warm Bowl is ready" once per day, in memory only (PACING §4)
function bowlHint(ms = 1200){
  const p = pet(), d = dayKey(Date.now());
  if (!p || bowlToldDay === d || !bowlReady() || p.hunger >= 98) return;
  bowlToldDay = d; setTimeout(() => { const q = pet(); if (q && bowlReady() && q.hunger < 98 && !overlayOpen()) toast('A Warm Bowl is ready for ' + petName(q) + '.'); }, ms);
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
    const bowl = bowlReady();
    p.hunger = clamp(p.hunger + careGain(FEED_FOOD, p.hunger, FEED_BANDS) + (bowl ? BOWL.food : 0), 0, 100); p.happy = clamp(p.happy + (bowl ? BOWL.joy : 3), 0, 100);
    if (bowl) S.flags[BOWL.flag] = dayKey(Date.now());
    addPart('apple', pp.x + 6, pp.y - 4, 0, 4, 0.9);
    setTimeout(() => { for (let i=0;i<(bowl ? 4 : 3);i++) addPart('heart', pp.x + 2 + i*5, pp.y, (i-1)*4, -10); }, 600);
    anim.busyUntil = t + (bowl ? 1500 : 1100); msg = bowl ? 'Warm Bowl! ' + petName(p) + ' gobbles it up. +FOOD +JOY' : 'Yum! +FOOD';
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
  if (cx.xp >= CARE_XP_DAILY_CAP && !cx.told) { cx.told = true; sfx('cap', 0.6); if (!msg.startsWith('Warm Bowl')) msg = petName(p) + ' learned all it can from care today. Go for a walk!'; }
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
const MAP_INFO = {};                         // debug overrides only (setMapBackdrop); the real value is each map's `backdrop` (§11.1)
const BACKDROPS = ['town', 'route', 'meadow', 'grove'];
function backdropName(){ if (!S) return 'meadow'; const o = MAP_INFO[S.world.map], b = o && 'backdrop' in o ? o.backdrop : (WORLD[S.world.map] || {}).backdrop; return BACKDROPS.includes(b) ? b : 'meadow'; }
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
  g.drawImage(petSpr(p)[blink ? 'b' : 'n'], x, y + bob);
  if (!sleeping && (p.hunger < 25 || p.happy < 25 || p.energy < 25) && Math.floor(t/500)%2) drawGlyph(g, 'bang', x + 16, y - 2);
  if (sparkle.id === p.id && now() < sparkle.until) for (let i = 0; i < 3; i++) if (Math.floor(t / 180 + i) % 3 === 0) drawGlyph(g, 'spark', x - 2 + i * 8, y - 3 + (i % 2) * 6);   // colour back (§5)
  drawWeather(g, W, H, t, 0.18);                   // same night/fog/rain/storm/snow tint as the Walk map
  if (sleeping) {
    g.fillStyle = 'rgba(41,54,111,.55)'; g.fillRect(0, 0, W, H);
    g.fillStyle = PAL.w; g.fillRect(8, 5, 4, 4); g.fillStyle = PAL.k; g.fillRect(10, 5, 2, 2);
    if (Math.random() < dt * 2.5) addPart('z', x + 12, y, 3, -6, 1.4);
  }
  drawParticles(g, dt);
}

/* ---------- maps, objects, conditions (MAPS_SLICE Phase M + INTERIORS_DIALOG v1.0) ---------- */
// maps_slice.json + interiors.json (verbatim, via data/mapdata.js). INTERIORS' slicePatch swaps Hearthmoor's place-panel doors
// for room doors at load (maps_slice.json is never edited), then the four rooms join the outdoor maps.
const MD = MAPDATA, TS = 16;
const TILE_DEF = Object.assign({}, MD.maps_slice.tiles, MD.interiors.tiles);
const WORLD = (() => {
  const W = JSON.parse(JSON.stringify(MD.maps_slice.maps));
  for (const [id, pt] of Object.entries(MD.interiors.slicePatch.maps)) {
    const m = W[id]; Object.assign(m, JSON.parse(JSON.stringify(pt.set || {})));
    for (const o of pt.replaceObjs || []) { const k = m.objs.findIndex(x => x.id === o.id); if (k >= 0) m.objs[k] = JSON.parse(JSON.stringify(o)); else m.objs.push(JSON.parse(JSON.stringify(o))); }
  }
  Object.assign(W, JSON.parse(JSON.stringify(MD.interiors.maps)));
  for (const [id, m] of Object.entries(W)) { m.id = id; m.cells = m.grid.map(r => r.split('')); }
  return W;
})();
const SCENES = Object.assign({}, MD.maps_slice.scenes, MD.interiors.scenes);
for (const [id, t] of Object.entries(MD.maps_slice.trainers)) TRAINERS[id] = Object.assign({}, TRAINERS[id] || {}, t);   // §6 replaces the BATTLE examples
if (TRAINERS.hall1_fen) Object.assign(TRAINERS.hall1_fen, { map: 'fernbrook', x: 22, y: 6, facing: 'down', sight: 0, onWin: 'seal1' });
const NPC_LOOKS = Object.assign({}, KEEPER_SWAPS, MD.interiors.looks);
const LOOK_OF_NAME = Object.assign({ 'Hattie': 'villager', 'Odile': 'villager', 'Keeper Amos': 'villager', 'Associate Juniper': 'associate', 'Master Fen': 'fen',
  'Warden Ilse': 'ilse', 'Rook': 'rook', 'Mrs. Calloway': 'calloway', 'Tobin': 'associate', 'Fen': 'fen' }, MD.interiors.dialog.speakers);
const TRAINER_LOOK = { rival1_rook: 'rook', fern_associate: 'associate', hall1_fen: 'fen' };
const COUNTER = { ember: 'tide', tide: 'bloom', bloom: 'ember' };   // §6: TIDE beats EMBER, BLOOM beats TIDE, EMBER beats BLOOM
let CUR = WORLD.hearthmoor, MAP = CUR.cells, MW = CUR.w, MH = CUR.h;
let mapRT = { talked: new Set(), chat: new Set(), trig: {}, face: {}, pos: {} };   // per map visit, never saved
function useMap(id){
  CUR = WORLD[id] || WORLD.hearthmoor; MAP = CUR.cells; MW = CUR.w; MH = CUR.h;
  mapRT = { talked: new Set(), chat: new Set(), trig: {}, face: {}, pos: {} };
}
const isRoom = () => CUR.kind === 'interior';
const outdoorId = () => isRoom() ? CUR.outdoor : CUR.id;
// Conditions (§4): 'flag', '!flag', 'flag=value', 'seal:id', 'has:name', 'talked' (lines keys only). `live` = read scene pending too.
function flagOf(k, live){ if (live && scene && k in scene.view.flags) return scene.view.flags[k]; return S.flags[k]; }
function curName(live){ return live && scene && scene.view.name !== undefined ? scene.view.name : (S.player && S.player.name) || null; }
function cond(c, live, o){
  if (c === 'else') return true;
  let neg = false; if (c[0] === '!') { neg = true; c = c.slice(1); }
  let v;
  if (c === 'has:name') v = !!curName(live);
  else if (c.startsWith('seal:')) v = !!S.seals[c.slice(5)];
  else if (c === 'talked') v = !!(o && mapRT.talked.has(o.id));
  else { const k = c.indexOf('='); v = k >= 0 ? String(flagOf(c.slice(0, k), live)) === c.slice(k + 1) : !!flagOf(c, live); }
  return neg ? !v : v;
}
const BLOCK_KINDS = { npc: 1, trainer: 1, sign: 1, prop: 1, wild: 1 };
function present(o){
  if (o.when && !o.when.every(c => cond(c, false))) return false;
  if (o.kind === 'pickup' && S.flags['item.' + o.id]) return false;
  return true;
}
const objPos = o => mapRT.pos[o.id] || o;
function objAt(x, y, pred){ return CUR.objs.find(o => present(o) && (!pred || pred(o)) && objPos(o).x === x && objPos(o).y === y) || null; }
const blockerAt = (x, y) => objAt(x, y, o => BLOCK_KINDS[o.kind]);
const tileAt = (x, y) => (MAP[y] && MAP[y][x]) || 'T';
const solidTile = (x, y) => x < 0 || y < 0 || x >= MW || y >= MH || !(TILE_DEF[MAP[y][x]] || {}).walk;
const solid = (x, y) => solidTile(x, y) || !!blockerAt(x, y);
const warpAt = (x, y) => objAt(x, y, o => o.kind === 'warp');
const doorAt = (x, y) => objAt(x, y, o => o.kind === 'door');
const objName = o => o.kind === 'trainer' ? (TRAINERS[o.id] || {}).name || '' : o.name || '';
function npcLook(o){
  const key = o.look || (o.kind === 'trainer' ? (TRAINER_LOOK[o.id] || 'trainer') : LOOK_OF_NAME[o.name]) || 'villager';
  return NPC_LOOKS[key] || KEEPER_SWAPS.villager;
}
const talkable = o => !!o && (o.kind === 'npc' || o.kind === 'trainer' || o.kind === 'sign' || o.kind === 'wild' || (o.kind === 'prop' && !!o.lines));
// A saved position that is off the map, solid, on a warp or under a blocker loads on the map's safe tile (§3).
function safeSpot(){
  const w = S.world;
  if (!solid(w.x, w.y) && !warpAt(w.x, w.y)) return;
  const sf = CUR.safe || CUR.start || { x: 3, y: 3 }; w.x = sf.x; w.y = sf.y;
}

/* ---------- walk / map ---------- */
const DIRS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
const walk = { fx: 3, fy: 3, from: null, to: null, prog: 0, dpad: null, drag: null, key: null, queued: null, target: null,
  intro: 0, cam: { x: 0, y: 0 }, path: null, arrive: null };
function clearMoves(){ walk.dpad = walk.drag = walk.key = walk.queued = walk.target = null; walk.path = walk.arrive = null; wild.chase = null; $$('.dp').forEach(b => b.classList.remove('on')); }
const moveHeld = () => !!(walk.dpad || walk.key || walk.drag);

function targetDir(){
  if (walk.path) {                                  // tap-to-talk / tap a door: a BFS path (INTERIORS §4.2)
    const nx = walk.path[0];
    if (!nx) { walk.path = null; const a = walk.arrive; walk.arrive = null; if (a) a(); return null; }
    if (solid(nx.x, nx.y)) { walk.path = walk.arrive = null; return null; }
    walk.path.shift(); return [nx.x - S.world.x, nx.y - S.world.y];
  }
  const tg = walk.target; if (!tg) return null;
  const dx = tg.x - S.world.x, dy = tg.y - S.world.y;
  if (!dx && !dy) { walk.target = null; return null; }
  const opts = Math.abs(dx) >= Math.abs(dy) ? [[Math.sign(dx),0],[0,Math.sign(dy)]] : [[0,Math.sign(dy)],[Math.sign(dx),0]];
  for (const [ox,oy] of opts) if ((ox||oy) && !solid(S.world.x+ox, S.world.y+oy) && !warpBlocked(S.world.x+ox, S.world.y+oy)) return [ox,oy];
  walk.target = null; return null;
}
// BFS over walkable tiles (maps are at most 48x20) to the nearest of `goals`; returns the steps (excluding the start) or null.
function findPath(goals){
  const key = (x, y) => y * 64 + x, sx = S.world.x, sy = S.world.y, prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
  const isGoal = (x, y) => goals.some(g => g.x === x && g.y === y);
  if (isGoal(sx, sy)) return [];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of Object.values(DIRS)) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k) || solid(nx, ny) || wildAt(nx, ny) || (warpAt(nx, ny) && !isGoal(nx, ny))) continue;
      prev.set(k, [x, y]);
      if (isGoal(nx, ny)) { const out = []; let c = [nx, ny]; while (c && !(c[0] === sx && c[1] === sy)) { out.unshift({ x: c[0], y: c[1] }); c = prev.get(key(c[0], c[1])); } return out; }
      q.push([nx, ny]);
    }
  }
  return null;
}
const dirName = (dx, dy) => dx > 0 ? 'right' : dx < 0 ? 'left' : dy < 0 ? 'up' : 'down';
function warpBlocked(x, y){ const wp = warpAt(x, y); return !!(wp && wp.need && !cond(wp.need, false)); }
function tryStep(d){
  if (fade.busy || scene) return;
  const p = pet();                           // the keeper walks with or without a partner (MAPS_SLICE K.1)
  const nx = S.world.x + d[0], ny = S.world.y + d[1], dn = dirName(d[0], d[1]);
  const o = blockerAt(nx, ny);
  if (o) { const turned = S.world.facing !== dn; S.world.facing = dn; bumpObj(o, d, turned); return; }
  if (solidTile(nx, ny)) {
    S.world.facing = dn;
    const dr = doorAt(S.world.x, S.world.y);  // a door: step up from its doorstep into the wall (MAPS_SLICE §4)
    if (dr && dn === 'up' && tileAt(nx, ny) === 'H') enterDoor(dr);
    return;
  }
  if (warpBlocked(nx, ny)) { S.world.facing = dn; return; }   // the gate trigger one tile earlier tells you why
  const w = wildAt(nx, ny);
  if (w) { if (p && w.x === nx && w.y === ny) meetWild(w); return; }   // bump = encounter; a creature just leaving that tile blocks briefly
  walk.from = { x: S.world.x, y: S.world.y }; walk.to = { x: nx, y: ny }; walk.prog = 0;
  S.world.facing = dn;
  S.world.x = nx; S.world.y = ny;
  followerStep();
}
function onLand(){
  const p = pet();
  S.steps++; if (S.steps % 2 === 0) sfx('step');   // quiet footstep on every other step
  if (S.steps % 50 === 0) toast(S.steps + ' steps! Nice walk.');
  bump.talked = null;                        // §4.1: any completed step ends "just talked to"
  if (p) {                                   // energy/hunger/step XP only with a partner
    p.energy = clamp(p.energy - STEP_NRG, 0, 100); p.hunger = clamp(p.hunger - STEP_FOOD, 0, 100);
    p.sr = (+p.sr || 0) + 1;                 // per-pet step remainder, carried across sessions
    if (p.sr >= STEPS_PER_XP) { p.sr -= STEPS_PER_XP; grantExploreXp(p, 1); }
    updateHUD();
  }
  const x = S.world.x, y = S.world.y;
  const wp = warpAt(x, y);
  if (wp && !(wp.need && !cond(wp.need, false))) { if (wp.setFlag) S.flags[wp.setFlag] = true; warpTo({ map: wp.to, x: wp.tx, y: wp.ty, facing: wp.facing }); return; }
  const pk = objAt(x, y, o => o.kind === 'pickup');
  if (pk) {                                  // INVENTORY §8: clamped to the stack cap; the flag is set either way, so nothing loops
    const r = grantItem(pk.item, pk.n); S.flags['item.' + pk.id] = true; sfx('befriend');
    if (r.added) toast('Found ' + itemLabel(pk.item, r.added) + '!');
    if (r.lost) setTimeout(() => toast(BAG_FULL_MSG), r.added ? 1900 : 0);
    save();
  }
  if (checkTriggers()) return;
  if (checkSight()) return;
  checkChatter();
}
/* ---------- items (INVENTORY v1 §3): one catalog for the Bag, the Travel Shelf, battle, scene `give` and map pickups ---------- */
// use: where it works ('battle' and/or 'field'); target: needs a pet; cap: stack limit (enforced on grant, not on load); price in Acorns.
const ITEMS = {
  heal_snack:     { name: 'Heal Snack',     plural: 'Heal Snacks',     cap: 20, price: 50,  use: ['battle', 'field'], target: true,  heal: 0.4,  blurb: 'Restores some HP.' },
  hearty_snack:   { name: 'Hearty Snack',   plural: 'Hearty Snacks',   cap: 10, price: 150, use: ['battle', 'field'], target: true,  heal: 0.75, blurb: 'Restores a lot of HP.' },
  wake_tonic:     { name: 'Wake Tonic',     plural: 'Wake Tonics',     cap: 5,  price: 400, use: ['battle', 'field'], target: true,  blurb: 'Wakes a napping Walkling.' },
  befriend_treat: { name: 'Befriend Treat', plural: 'Befriend Treats', cap: 20, price: 80,  use: ['battle'],          target: false, blurb: 'Wild Walklings like it.' },
  energy_sip:     { name: 'Energy Sip',     plural: 'Energy Sips',     cap: 10, price: 60,  use: ['field'],           target: true,  blurb: 'A fizzy pick-me-up. NRG +40.' },
  joy_crumb:      { name: 'Joy Crumb',      plural: 'Joy Crumbs',      cap: 10, price: 40,  use: ['field'],           target: true,  blurb: 'A sweet treat. JOY +20.' },
};
const ITEM_ORDER = Object.keys(ITEMS);
const BAG_FULL_MSG = 'Bag is full; some were left behind.';
const itemLabel = (id, n) => { const it = ITEMS[id], one = it ? it.name : id, many = it ? it.plural : id; return n === 1 ? 'a ' + one : n + ' ' + many; };
const acorns = n => n + (n === 1 ? ' Acorn' : ' Acorns');      // INVENTORY §2: the save field stays `money`
const itemCount = id => (S && S.bag && S.bag[id]) || 0;
const warnedItems = new Set();
// Grant n of an item, clamped to the room left under its cap (overflow is lost). Unknown ids: a no-op that warns once.
function grantItem(id, n){
  const it = ITEMS[id]; n = Math.max(0, n | 0);
  if (!it) { if (!warnedItems.has(id)) { warnedItems.add(id); console.warn('Walklings: unknown item id "' + id + '" (nothing given).'); } return { added: 0, lost: 0, unknown: true }; }
  const added = Math.min(n, Math.max(0, it.cap - itemCount(id)));
  if (added) S.bag[id] = itemCount(id) + added;
  return { added, lost: n - added };
}
function takeItem(id){ const c = itemCount(id) - 1; if (c > 0) S.bag[id] = c; else delete S.bag[id]; }
// Why an item can't be used right now (null = it can). ctx 'battle' | 'field'; p = the target pet (if the item needs one).
function itemRefusal(id, p, ctx){
  const it = ITEMS[id];
  if (!it) return "Can't use that here yet.";
  if (itemCount(id) < 1) return 'Your bag is empty.';
  if (id === 'befriend_treat') {
    if (ctx !== 'battle' || !battle.on) return 'Save it for a wild battle.';
    if (battle.kind !== 'wild') return "Can't use that here.";
    if (battle.treat) return "It's already nibbling a treat.";
    return null;
  }
  if (!it.use.includes(ctx)) return "Can't use that here yet.";
  if (it.target && !p) return 'Pick a Walkling first.';
  const nm = petName(p);
  if (it.heal) { if (isFainted(p)) return nm + ' needs a proper rest.'; if (hpOf(p) >= maxHpOf(p)) return nm + ' is already at full HP.'; }
  if (id === 'wake_tonic' && !isFainted(p)) return nm + " isn't napping.";
  if (id === 'energy_sip' && p.energy >= 98) return nm + ' is already bright-eyed.';
  if (id === 'joy_crumb' && p.happy >= 98) return nm + ' is already beaming.';
  return null;
}
// INVENTORY §6: one function for the Bag and battle. Writes bag, hpNow/faintUntil/energy/happy (and the battle's treat) only.
function useItem(id, petId, ctx = 'field'){
  const p = petId ? petById(petId) : null, no = itemRefusal(id, p, ctx);
  if (no) return { ok: false, msg: no };
  const it = ITEMS[id]; takeItem(id);
  if (it.heal) { setMyHp(p, hpOf(p) + Math.ceil(it.heal * maxHpOf(p))); return { ok: true, msg: petName(p) + ' ate a ' + it.name + ' and feels better!' }; }
  if (id === 'wake_tonic') { delete p.faintUntil; setMyHp(p, Math.ceil(0.25 * maxHpOf(p))); return { ok: true, msg: petName(p) + ' blinks awake!' }; }
  if (id === 'energy_sip') { p.energy = clamp(p.energy + 40, 0, 100); return { ok: true, msg: petName(p) + ' perks right up! +NRG' }; }
  if (id === 'joy_crumb') { p.happy = clamp(p.happy + 20, 0, 100); return { ok: true, msg: petName(p) + ' munches happily. +JOY' }; }
  if (id === 'befriend_treat') { battle.treat = true; return { ok: true, msg: foeName(curFoe()) + ' sniffs the treat. It looks friendlier!' }; }
  return { ok: false, msg: "Can't use that here yet." };
}
// Triggers (§4): fire when a step ends within Manhattan r; once until the keeper ends a step outside the area (or the map changes).
function checkTriggers(){
  const x = S.world.x, y = S.world.y;
  for (const o of CUR.objs) {
    if (o.kind !== 'trigger') continue;
    const inside = present(o) && Math.abs(o.x - x) + Math.abs(o.y - y) <= (o.r || 0);
    if (!inside) { delete mapRT.trig[o.id]; continue; }
    if (mapRT.trig[o.id]) continue;
    mapRT.trig[o.id] = true; clearMoves(); runScene(o.scene); return true;
  }
  return false;
}
// Trainer sight lines (§6.1): 1..sight tiles in `facing` from the trainer, stopping before the first tile that isn't walkable or
// holds a present blocker (roaming creatures and the follower don't block). Checked only after a completed step (onLand), never on
// warp arrival, respawn, push or LEAVE; a trainer spots once (`spotted.<id>`) and only while unbeaten.
const SPOT_BANG_MS = 600, SPOT_STEP_MS = STEP_MS * 1.5;
const spot = { id: null, bang: false };
let sightShown = false;
function sightLine(o){
  const t = TRAINERS[o.id], d = t && DIRS[t.facing || 'down']; if (!d || !(t.sight > 0)) return [];
  const q = objPos(o), out = [];
  for (let i = 1; i <= t.sight; i++) {
    const x = q.x + d[0] * i, y = q.y + d[1] * i;
    if (solidTile(x, y) || blockerAt(x, y)) break;
    out.push({ x, y });
  }
  return out;
}
const canSpot = o => o.kind === 'trainer' && present(o) && !!TRAINERS[o.id] && !S.flags['trainer.' + o.id] && !S.flags['spotted.' + o.id];
function checkSight(){
  if (scene || fade.busy || walk.intro || overlayOpen() || !pet()) return false;
  const x = S.world.x, y = S.world.y;
  for (const o of CUR.objs) {
    if (!canSpot(o) || !sightLine(o).some(c => c.x === x && c.y === y)) continue;
    clearMoves(); runSteps([['spot', o.id], ['battle', o.id]], { npc: o }); return true;
  }
  return false;
}
// The walk-up: sfx notice + a "!" over the trainer for 600 ms, then it walks along its line (walk frames, STEP_MS x 1.5 per tile)
// until adjacent; the keeper turns to face it. The text box stays hidden until the intro line.
async function spotWalk(id){
  const o = CUR.objs.find(x => x.id === id), t = TRAINERS[id], d = t && DIRS[t.facing || 'down']; if (!o || !d) return;
  $('#ovScene').hidden = true;
  sfx('notice'); spot.id = id; spot.bang = true;
  await new Promise(r => setTimeout(r, SPOT_BANG_MS));
  spot.bang = false;
  let q = { x: objPos(o).x, y: objPos(o).y };
  while (scene && Math.abs(S.world.x - q.x) + Math.abs(S.world.y - q.y) > 1) {
    const nx = q.x + d[0], ny = q.y + d[1];
    if (solidTile(nx, ny) || (nx === S.world.x && ny === S.world.y)) break;
    const P = mapRT.pos[id] = { x: nx, y: ny, fx: q.x, fy: q.y, moving: true, facing: t.facing };
    await new Promise(res => { const t0 = now(), from = q; (function tick(){ const k = Math.min(1, (now() - t0) / SPOT_STEP_MS);
      P.fx = from.x + d[0] * k; P.fy = from.y + d[1] * k; if (k < 1 && scene) requestAnimationFrame(tick); else res(); })(); });
    q = { x: nx, y: ny };
  }
  mapRT.pos[id] = { x: q.x, y: q.y, facing: t.facing };
  S.world.facing = dirName(q.x - S.world.x, q.y - S.world.y);
  spot.id = null;
  if (scene) { $('#ovScene').hidden = false; sbRender('', ''); }
}
function updateWalk(dt, t){
  if (walk.intro) { if (t - walk.intro > 700) { walk.intro = 0; openEncounter(); } return; }
  if (walk.to) {
    walk.prog += dt * 1000 / STEP_MS;
    if (walk.prog >= 1) { walk.fx = walk.to.x; walk.fy = walk.to.y; walk.to = null; if (fol.to) { fol.fx = fol.x; fol.fy = fol.y; fol.to = null; } onLand(); }
    else { walk.fx = walk.from.x + (walk.to.x - walk.from.x) * walk.prog; walk.fy = walk.from.y + (walk.to.y - walk.from.y) * walk.prog;
      if (fol.to) { fol.fx = fol.from.x + (fol.to.x - fol.from.x) * walk.prog; fol.fy = fol.from.y + (fol.to.y - fol.from.y) * walk.prog; } }
  }
  if (!walk.to && !walk.intro && $('#ovBattle').hidden && !scene && !fade.busy) {
    let d = walk.queued || (walk.dpad && DIRS[walk.dpad]) || (walk.drag && DIRS[walk.drag]) || (walk.key && DIRS[walk.key]);
    walk.queued = null;
    if (d) { walk.target = null; walk.path = walk.arrive = null; wild.chase = null; }
    else if (wild.chase) {                     // tapped a creature: walk up to it, meet it when adjacent
      const w = wild.list.find(o => o.id === wild.chase);
      if (!w) wild.chase = null;
      else if (Math.abs(w.x - S.world.x) + Math.abs(w.y - S.world.y) === 1 && !w.to) { meetWild(w); return; }
      else walk.target = { x: w.x, y: w.y };
    }
    if (!d) d = targetDir();
    if (d) tryStep(d);
  }
  if (!moveHeld()) bump.held = false;
}
/* --- warps, doors and the fade (MAPS_SLICE §3, INTERIORS §3.1): 250 ms, input locked, save right after --- */
const FADE_MS = 250;
const fade = { busy: false, t0: 0 };
function warpTo(at, after){
  if (fade.busy) return; fade.busy = true; fade.t0 = now(); clearMoves();
  setTimeout(() => { arriveAt(at); }, FADE_MS / 2);
  setTimeout(() => { fade.busy = false; if (after) after(); }, FADE_MS);
}
function arriveAt(at){
  useMap(at.map);
  S.world.map = CUR.id; S.world.x = at.x; S.world.y = at.y; S.world.facing = at.facing || S.world.facing;
  walk.fx = at.x; walk.fy = at.y; walk.to = null; walk.from = null;
  resetWild(); bump.talked = null;
  placeFollower(); renderEnv(); save();
}
function enterDoor(dr){
  if (dr.need && !cond(dr.need, false)) { runSteps([['say', '', dr.deny || 'The door is locked.']]); return; }
  if (dr.to) { sfx('tap'); warpTo({ map: dr.to, x: dr.tx, y: dr.ty, facing: dr.facing || 'up' }); return; }
  if (dr.panel) openPlace(dr);
}
// MAPS_SLICE §9 place panels (Fernbrook keeps panels; Hearthmoor's became rooms). The Lantern House: the keeper's line -> REST / LEAVE;
// REST heals the team and makes this town the respawn (§7 beat 6). The Trial Hall panel arrives with Trial Hall #1.
function placeSteps(dr){
  if (dr.panel === 'lantern') {
    const who = dr.keeper || '';
    return [['say', who, 'Long walk from Hearthmoor? Rest a while.'],
      ['if', 'story.starter_received',
        [['choice', 'Let your team rest?', [['Rest a while', [['rest'], ['respawnHere'], ['say', '', 'You all doze in the lantern glow. Your team is rested.']]], ['Leave', []]]]],
        [['say', who, 'No team to rest yet? Come back with a friend.']]]];
  }
  if (dr.panel === 'hall1') {                          // §9 Fen's Trial Hall: BEGIN TRIAL runs hall1_fen (summon flow, then `seal1` on a win)
    const t = TRAINERS.hall1_fen;
    if (t && t.seal && S.seals[t.seal]) return [['say', 'Master Fen', 'Come back any time. The orchard remembers its friends.']];
    return [['say', 'Master Fen', t ? t.lines.intro : 'Roots first, then blossoms. Show me yours.'],
      ['choice', 'Begin the trial?', [['Begin trial', [['battle', 'hall1_fen']]], ['Leave', []]]]];
  }
  return [['say', '', 'Closed for now. Come back soon!']];
}
// After a place panel closes the keeper is still on its doorstep: a trigger there (the Hall's `teaser` after the Seal) plays now.
function openPlace(dr){ sfx('tap'); runSteps(placeSteps(dr), { npc: dr }).then(() => { if (!scene && !fade.busy && !overlayOpen()) checkTriggers(); }); }
function drawMap(t){
  const c = $('#mapCanvas'), g = ctx(c), p = pet();
  syncFollower();
  const VW = c.width, VH = c.height;
  const px_ = walk.fx * TS, py_ = walk.fy * TS;
  // INTERIORS §3.4: a map narrower/shorter than the canvas is centred, the rest filled with PAL.k
  walk.cam.x = MW * TS <= VW ? -Math.floor((VW - MW * TS) / 2) : Math.round(clamp(px_ + 8 - VW/2, 0, MW*TS - VW));
  walk.cam.y = MH * TS <= VH ? -Math.floor((VH - MH * TS) / 2) : Math.round(clamp(py_ + 8 - VH/2, 0, MH*TS - VH));
  const cx = walk.cam.x, cy = walk.cam.y, wf = Math.floor(t / 500) % 2;
  g.fillStyle = PAL.k; g.fillRect(0,0,VW,VH);
  for (let ty = Math.floor(cy/TS); ty <= Math.floor((cy+VH)/TS); ty++)
    for (let tx = Math.floor(cx/TS); tx <= Math.floor((cx+VW)/TS); tx++){
      if (tx<0||ty<0||tx>=MW||ty>=MH) continue;
      const ch = MAP[ty][tx]; const img = ch === 'w' ? TILES.w[wf] : ch === 'W' && tx % 2 ? TILES.W2 : TILES[ch] || TILES.g;
      g.drawImage(img, tx*TS - cx, ty*TS - cy);
      if (ch === '=') {                          // rug border where the rug ends
        g.fillStyle = PAL.p; const X = tx*TS - cx, Y = ty*TS - cy;
        if (tileAt(tx, ty-1) !== '=') g.fillRect(X, Y, 16, 1); if (tileAt(tx, ty+1) !== '=') g.fillRect(X, Y+15, 16, 1);
        if (tileAt(tx-1, ty) !== '=') g.fillRect(X, Y, 1, 16); if (tileAt(tx+1, ty) !== '=') g.fillRect(X+15, Y, 1, 16);
      }
    }
  for (const o of CUR.objs) if (o.kind === 'door' && present(o) && tileAt(o.x, o.y - 1) === 'H') g.drawImage(WART.door, o.x*TS - cx, (o.y-1)*TS - cy);
  if (sightShown) for (const o of CUR.objs) if (o.kind === 'trainer' && present(o)) {   // debug showSight(): tint every sight line
    g.fillStyle = canSpot(o) ? 'rgba(244,80,80,.35)' : 'rgba(160,160,160,.3)'; sightLine(o).forEach(c => g.fillRect(c.x*TS - cx, c.y*TS - cy, TS, TS)); }
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
    g.drawImage(petSpr(p)[(t % 3000) < 120 ? 'b' : 'n'], fx, fy - followerBob(t));
    grassOver(fol.fx, fol.fy);
  };
  // y-sorted so objects, creatures, the follower and the keeper overlap naturally (follower under the keeper on a shared tile)
  const ents = wild.list.map(w => ({ y: w.fy, draw: () => drawWild(g, w, cx, cy, VW, VH, t) }));
  for (const o of CUR.objs) if (present(o) && o.kind !== 'warp' && o.kind !== 'door' && o.kind !== 'trigger') {
    const q = objPos(o); ents.push({ y: (q.fy != null ? q.fy : q.y) - 0.02, draw: () => drawObj(g, o, cx, cy, VW, VH, t) });
  }
  if (fol.x != null && p) ents.push({ y: fol.fy, draw: drawFollower });
  ents.push({ y: walk.fy + 0.01, draw: drawPlayer });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
  wild.poofs = wild.poofs.filter(f => wild.clock - f.t < 500);
  for (const f of wild.poofs) { const k = (wild.clock - f.t) / 500, x = f.x*TS - cx, y = f.y*TS - cy;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy]) => drawGlyph(g, 'spark', x + 6 + dx*(3 + k*6), y + 6 + dy*(3 + k*6))); }
  drawBubbles(g, cx, cy, t);
  if (!isRoom()) drawWeather(g, VW, VH, t);   // weather tint is skipped indoors (INTERIORS §2.1)
  if (walk.intro) { const k = Math.floor((t - walk.intro) / 120) % 2; if (k) { g.fillStyle = PAL.w; g.fillRect(0,0,VW,VH); } }
  if (fade.busy) { const e = (now() - fade.t0) / (FADE_MS / 2); g.globalAlpha = clamp(e <= 1 ? e : 2 - e, 0, 1); g.fillStyle = PAL.k; g.fillRect(0,0,VW,VH); g.globalAlpha = 1; }
}
const WART = buildWorldArt();
function drawObj(g, o, cx, cy, VW, VH, t){
  const q = objPos(o), fx = q.fx != null ? q.fx : q.x, fy = q.fy != null ? q.fy : q.y, X = Math.round(fx * TS - cx), Y = Math.round(fy * TS - cy);
  if (X < -18 || Y < -24 || X > VW + 2 || Y > VH + 2) return;
  if (o.kind === 'npc' || o.kind === 'trainer') {
    const face = mapRT.face[o.id] || q.facing || (o.kind === 'trainer' ? (TRAINERS[o.id] || {}).facing : o.facing) || 'down';
    g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(X + 2, Y + 14, 12, 2);
    g.drawImage(keeperFrames(npcLook(o))[face][q.moving ? Math.floor(t / 130) % 2 : 0], X - 1, Y - 2);
  } else if (o.kind === 'sign') g.drawImage(WART.sign, X, Y);
  else if (o.kind === 'prop') { const a = WART[o.sprite]; if (a) g.drawImage(Array.isArray(a) ? a[Math.floor(t / 400) % 2] : a, X, Y); }
  else if (o.kind === 'pickup') g.drawImage(WART.pickup, X, Y - (Math.floor(t / 500) % 2));
  else if (o.kind === 'wild') { const [line, st] = String(o.form).split('/'), si = SP_INDEX[line]; if (si != null) g.drawImage(sprSet(si, +st || 0, (+o.faded || 0) > 0)[(t % 2800) < 120 ? 'b' : 'n'], X - 1, Y - 2 - (Math.floor(t / 600) % 2)); }
}

/* ---------- keeper (player) sprite: MAPS_SLICE K.1 ---------- */
// keeper.js composes 16x16 frames (keeperGrid); here they become 18x18 canvases with a 1px PAL.k outline like buildSprite,
// built once per look and cached (the Walk map only looks them up).
const lookOf = () => (S && S.player && S.player.look) || null;           // null = the default look
const lookKey = L => { const f = Object.assign({}, KEEPER_LOOKS.defaults, L || {}); return KEEPER_LOOKS.slots.map(k => f[k]).join('|') + (f.extra ? JSON.stringify(f.extra) : ''); };
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
const lookUI = { draft: null, newPlayer: false, resolve: null };
// Phase M (K.6): the picker never shows the name field (Ilse asks it in the Lodge; renaming is her `rename` scene).
// newPlayer = the intro's mirror (no CANCEL); a scene's lookPick resolves its promise instead of saving (a buffered write).
function openLook(newPlayer, resolve){
  if (!newPlayer && !resolve && overlayOpen()) return false;
  clearMoves();
  lookUI.newPlayer = !!newPlayer; lookUI.resolve = resolve || null;
  lookUI.draft = Object.assign({}, KEEPER_LOOKS.defaults, normalizeLook((scene && scene.view.look) || S.player.look) || {});   // unknown extra keys ride along
  $('#lookTitle').textContent = newPlayer ? 'WHO ARE YOU?' : 'CHANGE LOOK';
  $('#lookCancel').hidden = !!newPlayer; $('#lookBtns').classList.toggle('one', !!newPlayer);
  $('#lookNameRow').hidden = true;
  renderLook(); drawLookPreview(now());
  $('#ovLook').hidden = false; lockTabs(true); $('#ovLook .ov-inner').scrollTop = 0;
  if (resolve) armOptions();                // inside a scene (the intro / mirror): no accidental DONE from a text tap
  return true;
}
const lookPickStep = isIntro => new Promise(res => openLook(isIntro, res));
function closeLook(result){
  $('#ovLook').hidden = true; lookUI.draft = null; lockTabs(false);
  const r = lookUI.resolve; lookUI.resolve = null; if (r) r(result || null);
}
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
  const lk = Object.assign({}, lookUI.draft);
  sfx('befriend');
  if (lookUI.resolve) { closeLook(lk); return; }          // inside a scene: the scene commits it at its end
  S.player.look = lk; closeLook(); save(); toast('Looking good, ' + playerName() + '!');
}

/* ---------- talk, bump hint, chatter (MAPS_SLICE §4/§4.1, INTERIORS §4.2) ---------- */
const bump = { talked: null, at: -1e9, held: false, hideAt: 0 };
const BUMP_HINT_MS = 2000, HINT_LIFE_MS = 1500, CHATTER_MS = 2500;
function bumpObj(o, d, turned){
  if (o.kind === 'trainer' && !S.flags['trainer.' + o.id]) { interact(o); return; }   // an unbeaten trainer: its battle, never the hint
  if ((o.kind === 'npc' || o.kind === 'trainer') && bump.talked === o.id) { showBumpHint(o); return; }
  if (o.kind === 'prop' && !o.lines) return;                                          // silent props just block
  interact(o);
}
function showBumpHint(o){
  if (scene || overlayOpen() || bump.held || now() - bump.at < BUMP_HINT_MS) return;
  bump.at = now(); bump.held = true; bump.hideAt = now() + HINT_LIFE_MS; sfx('denied');
  const nm = objName(o), el = $('#bumpHint');
  el.textContent = "You can't walk through " + (nm || 'this') + '.'; el.hidden = false;
}
function hideBumpHint(){ $('#bumpHint').hidden = true; bump.hideAt = 0; }
const linesFor = o => { if (!o.lines) return null; for (const [k, v] of Object.entries(o.lines)) if (cond(k, false, o)) return v; return null; };
function scenePlayed(id){ const fl = (SCENES[id] || []).filter(st => st[0] === 'setFlag'); return fl.length > 0 && fl.every(st => S.flags[st[1]]); }
function faceKeeper(o){ const q = objPos(o); mapRT.face[o.id] = dirName(S.world.x - q.x, S.world.y - q.y); }
// Talk (bump, tap, the Talk button, Space/Enter). Doors enter; trainers battle until beaten, then say their win line.
function interact(o){
  if (scene || fade.busy || !o) return;
  if (o.kind === 'door') { enterDoor(o); return; }
  const ctx = { npc: o };
  if (o.kind === 'npc' || o.kind === 'trainer') faceKeeper(o);
  if (o.kind === 'trainer') {
    const t = TRAINERS[o.id];
    if (!S.flags['trainer.' + o.id]) return runSteps([['battle', o.id]], ctx);
    return runSteps([['say', t.name, t.lines.win]], ctx);
  }
  if (o.kind === 'sign') return runSteps([['say', '', o.text]], ctx);
  if (o.kind === 'wild') return o.scene ? runScene(o.scene, ctx) : undefined;
  if (o.scene && !scenePlayed(o.scene)) return runScene(o.scene, ctx);
  const line = linesFor(o);
  if (line == null) return o.scene ? runScene(o.scene, ctx) : undefined;
  mapRT.talked.add(o.id);
  if (line[0] === '@') return runScene(line.slice(1), ctx);
  return runSteps([['say', o.kind === 'prop' ? '' : objName(o), line]], ctx);
}
// What the keeper faces: a talkable object on the next tile, or the door of the doorstep you stand on (facing up).
function facingTarget(){
  if (!S || scene || fade.busy) return null;
  const [dx, dy] = DIRS[S.world.facing] || DIRS.down, nx = S.world.x + dx, ny = S.world.y + dy;
  const o = blockerAt(nx, ny); if (talkable(o)) return o;
  const dr = doorAt(S.world.x, S.world.y); if (dr && S.world.facing === 'up' && tileAt(nx, ny) === 'H') return dr;
  return null;
}
function talkFacing(){ const o = facingTarget(); if (!o) return false; clearMoves(); bump.talked = null; interact(o); return true; }
// Tap-to-talk: adjacent -> face it and talk; else walk to the nearest free neighbour (BFS), face it, talk. Doors: walk onto the doorstep.
function tapObject(o){
  const q = objPos(o);
  if (o.kind === 'door') {
    const go = () => { S.world.facing = 'up'; enterDoor(o); };
    if (S.world.x === o.x && S.world.y === o.y) { go(); return true; }
    const path = findPath([{ x: o.x, y: o.y }]); if (!path) return false;
    walk.target = null; walk.path = path; walk.arrive = go; return true;
  }
  const nb = Object.values(DIRS).map(([dx, dy]) => ({ x: q.x + dx, y: q.y + dy })).filter(c => !solid(c.x, c.y) || (c.x === S.world.x && c.y === S.world.y));
  const talk = () => { S.world.facing = dirName(q.x - S.world.x, q.y - S.world.y); bump.talked = null; interact(o); };
  if (Math.abs(q.x - S.world.x) + Math.abs(q.y - S.world.y) === 1) { talk(); return true; }
  const path = findPath(nb); if (!path) return false;
  walk.target = null; walk.path = path; walk.arrive = talk; return true;
}
// Ambient chatter (INTERIORS §4.2, decision 6): within Manhattan 2 after a step, once per NPC per visit, one bubble at a time.
const chat = { id: null, until: 0 };
function checkChatter(){
  if (scene || now() < chat.until) return;
  for (const o of CUR.objs) {
    if (!o.chatter || !present(o) || mapRT.chat.has(o.id)) continue;
    const q = objPos(o); if (Math.abs(q.x - S.world.x) + Math.abs(q.y - S.world.y) > 2) continue;
    const k = Object.keys(o.chatter).find(c => cond(c, false, o)); if (!k) continue;
    mapRT.chat.add(o.id); chat.id = o.id; chat.until = now() + CHATTER_MS;
    const el = $('#chatBubble'); el.textContent = o.chatter[k]; el.hidden = false; return;
  }
}
function drawBubbles(g, cx, cy, t){
  if (spot.bang && spot.id) {                          // §6.1 "!" bubble, 2px above the trainer's head
    const o = CUR.objs.find(x => x.id === spot.id);
    if (o) { const q = objPos(o), X = Math.round(q.x * TS - cx) + 4, Y = Math.round(q.y * TS - cy) - 15;
      g.fillStyle = PAL.k; g.fillRect(X, Y, 9, 12); g.fillStyle = PAL.w; g.fillRect(X + 1, Y + 1, 7, 10);
      g.fillStyle = PAL.r; g.fillRect(X + 3, Y + 2, 3, 5); g.fillRect(X + 3, Y + 8, 3, 2); }
  }
  const ft = !moveHeld() && !walk.to && facingTarget();
  if (ft && ft.kind !== 'door') { const q = objPos(ft); const X = q.x * TS - cx + 4, Y = q.y * TS - cy - 11 - (Math.floor(t / 400) % 2);
    WART.talk.forEach((r, j) => { for (let i = 0; i < 8; i++) if (r[i] !== '.') { g.fillStyle = PAL[r[i]]; g.fillRect(X + i, Y + j, 1, 1); } }); }
  const el = $('#chatBubble');
  if (!el.hidden) {
    const o = chat.id && CUR.objs.find(x => x.id === chat.id);
    if (!o || now() > chat.until || scene) { el.hidden = true; chat.id = null; }
    else { const c = $('#mapCanvas'), r = c.getBoundingClientRect(), wr = $('#mapWrap').getBoundingClientRect(), k = r.width / c.width, q = objPos(o);
      el.style.left = Math.round(r.left - wr.left + (q.x * TS - cx + 8) * k) + 'px'; el.style.top = Math.round(r.top - wr.top + (q.y * TS - cy - 2) * k) + 'px'; }
  }
  if (bump.hideAt && now() > bump.hideAt) hideBumpHint();
  const tb = $('#talkBtn'), on = !!facingTarget() && !overlayOpen();
  if (tb.classList.contains('ready') !== on) { tb.classList.toggle('ready', on); tb.setAttribute('aria-disabled', String(!on)); }
}

/* ---------- scene runner (MAPS_SLICE §8 + INTERIORS §4.3 rest/run) ---------- */
// Buffered writes: setFlag, give, givePet, respawnHere, lookPick, nameEntry and rest go to scene.pending and land in order at the
// scene's end (one save), or right before a battle. Reads inside the scene (if, tokens) see S + pending. The 5 s autosave never
// writes pending, so closing the tab mid-scene saves nothing from it. Text advances on tap only (a tap first completes the line).
let scene = null;
const TEXT_CPS = { slow: 30, normal: 60, fast: 120 };
const sbox = { resolve: null, text: '', t0: 0, full: true, cps: 60 };
const INTERACTIVE = ['choice', 'nameEntry', 'showBasket', 'lookPick', 'battle', 'encounter'];
const ABORT = { abort: true };
function runScene(id, ctx){ const steps = SCENES[id]; if (!steps) return Promise.resolve(); return runSteps(steps, Object.assign({ id }, ctx || {})); }
async function runSteps(steps, ctx = {}){
  if (scene || !S) return;
  scene = { id: ctx.id || '', npc: ctx.npc || null, who: '', pending: [], view: { flags: {}, name: undefined, pet: ctx.viewPet || null, nick: undefined },
    vars: { tags: [], line: null, suggest: null }, skip: false, deferRespawn: false, toasts: [], boxes: 0 };
  walk.target = walk.path = walk.arrive = walk.queued = null; wild.chase = null;   // held d-pad/keys survive (§4.1 "holding into it after")
  hideBumpHint(); $('#chatBubble').hidden = true; lockTabs(true);
  $('#ovScene').hidden = false; sbRender('', '');
  try { await execSteps(steps); } catch (e) { if (e !== ABORT) console.error(e); }
  endScene();
}
async function execSteps(steps){ for (const st of steps || []) { if (!scene) return; await execStep(st); } }
function commitPending(){ const P = scene.pending; scene.pending = []; for (const f of P) f(); }
function endScene(){
  const sc = scene; if (!sc) return;
  commitPending();
  if (sc.npc) delete mapRT.face[sc.npc.id];
  if (sc.npc && (sc.npc.kind === 'npc' || sc.npc.kind === 'trainer')) bump.talked = sc.npc.id;
  scene = null; sbox.resolve = null; tabGuardUntil = performance.now() + TAB_GUARD_MS;
  $('#ovScene').hidden = true; $('#sbChoices').innerHTML = ''; $('#sbName').hidden = true;
  lockTabs(false); placeFollower(); renderKeeperName(); updateHUD(); save();
  sc.toasts.forEach((m, i) => setTimeout(() => toast(m), i * 1900));
  for (const o of CUR.objs) if (o.kind === 'trigger' && !(Math.abs(o.x - S.world.x) + Math.abs(o.y - S.world.y) <= (o.r || 0))) delete mapRT.trig[o.id];
  if (sc.deferRespawn) respawnAfterWipe();
  else if (allPets().length && !PPEnv.geoPref() && screen === 'walk') openGeoAsk();   // first walk with a partner: ask about location (once)
}
const pend = f => scene.pending.push(f);
function viewPet(){ return scene && scene.view.pet ? scene.view.pet : pet(); }
function viewPetName(){
  const v = scene && scene.view, p = viewPet(); if (!p) return '';
  if (v && v.pet && v.nick !== undefined) return v.nick || nameOf(spi(p), p.stage);
  return petName(p);
}
// Tokens (§8 + INTERIORS {player} alias); single pass, so a name can never inject another token.
function expand(text){
  const p = viewPet(), sp = p ? SPECIES[spi(p)] : null, v = scene ? scene.vars : {};
  const line = (v && v.line) || flagOf('story.starter_line', true), rv = COUNTER[line] && SPECIES[SP_INDEX[COUNTER[line]]];
  const vals = { name: curName(true) || DEFAULT_PLAYER_NAME, player: curName(true) || DEFAULT_PLAYER_NAME, pet: viewPetName(), species: p ? nameOf(spi(p), p.stage) : '',
    type: sp ? sp.type : '', suggest: SPECIES[SP_INDEX[suggestLine(v)]].stages[0].name, rival: rv ? rv.stages[0].name : '', rivalType: rv ? rv.type : '' };
  return String(text).replace(/\{(name|player|pet|species|type|suggest|rival|rivalType)\}/g, (m, k) => vals[k]);
}
async function execStep(st){
  const [k, a, b, c, d] = st, sc = scene;
  switch (k) {
    case 'say': { if (sc.skip) return; sc.who = a; const tx = expand(b); sc.lastSay = tx; await sayBox(a, tx); return; }
    case 'choice': {
      sc.skip = false;
      const pick = await choiceBox(expand(a), b.map(o => o[0]));
      const opt = b[pick]; if (opt[2]) sc.vars.tags.push(opt[2]);
      $('#sbEcho').textContent = '\u203a ' + opt[0];
      await execSteps(opt[1]); return;
    }
    case 'nameEntry': { sc.skip = false; await nameBox(a, expand(b), c, d); return; }
    case 'showBasket': { sc.skip = false; sc.vars.suggest = suggestLine(sc.vars); sc.vars.line = await basketPick(a, sc.vars.suggest); sfx('befriend'); return; }
    case 'givePet': {
      const id = a === '$line' ? sc.vars.line : a, si = SP_INDEX[id]; if (si == null) return;
      const np = newPet(si, 0, 'starter'); sc.view.pet = np; sc.view.nick = undefined;
      pend(() => { S.party.push(np); S.partnerId = np.id; markCaught(si, 0); scene && scene.toasts.push(petName(np) + ' joined you!'); });
      return;
    }
    case 'setFlag': { const v = b === '$line' ? sc.vars.line : b; sc.view.flags[a] = v; pend(() => { S.flags[a] = v; }); return; }
    case 'give': pend(() => { const r = grantItem(a, b | 0); if (r.lost) { if (scene) scene.toasts.push(BAG_FULL_MSG); else toast(BAG_FULL_MSG); } }); return;
    case 'respawnHere': { const r = outdoorId(); pend(() => { if (r === 'hearthmoor' || r === 'fernbrook') S.world.respawn = r; }); return; }
    case 'lookPick': {
      sc.skip = false;
      const lk = await lookPickStep(sc.id === 'intro');
      if (lk) { sc.view.look = lk; pend(() => { S.player.look = lk; }); }
      return;
    }
    case 'rest': sfx('rest'); pend(() => { S.party.forEach(q => restPet(q, 'full')); scene && scene.toasts.push('Your team is rested.'); }); return;
    case 'run': await execSteps(SCENES[a]); return;
    case 'if': await execSteps(cond(a, true) ? b : c); return;
    case 'push': {
      const nx = S.world.x + a, ny = S.world.y + b;
      if (solid(nx, ny)) return;
      const ox = S.world.x, oy = S.world.y;
      S.world.x = nx; S.world.y = ny; walk.fx = nx; walk.fy = ny; walk.to = null;
      if (fol.x != null) { fol.from = fol.to = null; fol.x = fol.fx = ox; fol.y = fol.fy = oy; }   // the follower onto the keeper's old tile (K.3)
      return;
    }
    case 'spot': await spotWalk(a); return;
    case 'battle': { sc.skip = false; await sceneBattle(a); return; }
    case 'encounter': { sc.skip = false; await sceneEncounter(a); return; }
  }
}
// Ilse's pick: known from the answers so far (her "Then I think {suggest} would suit you." comes BEFORE the baskets open)
const SUGGEST_DEFAULT = 'ember';
function suggestLine(v){ const id = (v && v.suggest) || (v && v.tags && suggestOf(v.tags)) || SUGGEST_DEFAULT; return SP_INDEX[id] != null ? id : SUGGEST_DEFAULT; }
function suggestOf(tags){
  if (!tags.length) return null;
  const n = {}; tags.forEach(t => { n[t] = (n[t] || 0) + 1; });
  const top = Math.max(...Object.values(n)), best = Object.keys(n).filter(t => n[t] === top);
  return best.length === 1 ? best[0] : tags[tags.length - 1];      // tie -> the tag of the last answer
}
// §6.1 summon sequence: the trainer's intro line and "{trainer} has summoned {foe}!" in this text box, then the battle opens with
// its challenge line and "{player} summons {pet}!" in the battle message box.
async function sceneBattle(id){
  const t = TRAINERS[id]; if (!t) return;
  commitPending(); save();
  const team = trainerTeam(t), f0 = team[0], [ln, st] = f0.form.split('/');
  const sub = s => String(s).replace(/\{(player|name)\}/g, playerName());
  if (scene.lastSay !== sub(t.lines.intro)) await sayBox(t.name, sub(t.lines.intro));   // the Hall panel already opened with it
  await sayBox('', battleLine('trainerSummon', { trainer: t.name, foe: nameOf(SP_INDEX[ln], +st) }));
  $('#ovScene').hidden = true;
  S.flags['spotted.' + id] = true;                     // §6.1: set when the battle opens; a trainer never spots twice
  const res = await new Promise(resolve => { if (!openBattle({ kind: 'trainer', trainerId: id, mapIntro: true, onEnd: resolve })) resolve(null); });
  if (!scene) return;
  $('#ovScene').hidden = false; sbRender('', '');
  if (res == null) throw ABORT;
  if (res === 'tired') scene.deferRespawn = true;
  if (res === 'win' && t.onWin && SCENES[t.onWin]) await execSteps(SCENES[t.onWin]);
}
// A story creature (map obj kind 'wild'): a wild battle with its own form, level, moves, faded state and befriend bonus.
async function sceneEncounter(id){
  const o = CUR.objs.find(x => x.id === id); if (!o) return;
  commitPending(); save();
  $('#ovScene').hidden = true;
  const res = await new Promise(resolve => { if (!openBattle({ kind: 'wild', form: o.form, level: o.level, moves: o.moves, faded: o.faded, bonus: o.befriendBonus, story: o.id, onEnd: resolve })) resolve(null); });
  if (!scene) return;
  $('#ovScene').hidden = false; sbRender('', '');
  if (res == null) throw ABORT;
  if (res === 'tired') scene.deferRespawn = true;
}
const trainerTeam = t => t.team || (t.counterTeam && (t.counterTeam[S.flags['story.starter_line']] || t.counterTeam.ember)) || [];

/* --- the bottom text box (#ovScene) --- */
function sbRender(who, text){
  const look = who && (NPC_LOOKS[LOOK_OF_NAME[who]] || null);
  $('#sbWho').textContent = who || ''; $('#sbWho').hidden = !who;
  $('#sbText').textContent = text; $('#sbText').classList.toggle('narr', !who);
  const pc = $('#sbPortrait'), showP = !!look && window.innerWidth >= 360;
  pc.hidden = !showP; $('#sbox').classList.toggle('has-p', showP);
  if (showP) { const g = ctx(pc); g.clearRect(0, 0, 18, 18); g.drawImage(keeperFrames(look).down[0], 0, 0); }
}
function sayBox(who, text){
  return new Promise(res => {
    if (scene) { scene.boxes++; scene.who = who || ''; }
    sbRender(who, ''); $('#sbEcho').textContent = ''; $('#sbChoices').innerHTML = ''; $('#sbName').hidden = true;
    sbox.text = text; sbox.t0 = now(); sbox.full = false; sbox.cps = TEXT_CPS[S.settings.textSpeed] || 60; sbox.resolve = res; sbox.mode = 'say';
    $('#sbSkip').hidden = false; $('#sbNext').hidden = true;
  });
}
function sbTick(){                          // typewriter (from the frame loop; nothing here can block a tap)
  if (!sbox.resolve || sbox.full) return;
  const n = Math.floor((now() - sbox.t0) / 1000 * sbox.cps);
  if (n >= sbox.text.length) sbFull(); else $('#sbText').textContent = sbox.text.slice(0, n);
}
function sbFull(){ sbox.full = true; $('#sbText').textContent = sbox.text; $('#sbNext').hidden = sbox.mode !== 'say'; if (sbox.onFull) { const f = sbox.onFull; sbox.onFull = null; f(); } }
// Tap safety (Vincent's iPhone playtest, Design): while a scene is open a full-screen layer takes every tap (tabs + gear can't be
// hit); a plain line advances on a tap anywhere; choices, name fields, baskets and the look picker answer only with their own
// buttons, which ignore taps for OPT_ARM_MS after they appear; after a scene closes, tab/gear taps are ignored for TAB_GUARD_MS.
const OPT_ARM_MS = 500, TAB_GUARD_MS = 500;
let optArmAt = 0, tabGuardUntil = 0;
const armOptions = () => { optArmAt = performance.now() + OPT_ARM_MS; };
const tabsGuarded = () => !!scene || performance.now() < tabGuardUntil;
function sceneTap(){
  if (!scene || !sbox.resolve) return;
  if (!sbox.full) { sbFull(); return; }
  if (sbox.mode !== 'say') return;          // choices / name entry answer with their buttons
  const r = sbox.resolve; sbox.resolve = null; r();
}
function sceneSkip(){
  if (!scene || sbox.mode !== 'say' || !sbox.resolve) return;
  scene.skip = true; sfx('tap'); const r = sbox.resolve; sbox.resolve = null; r();
}
function choiceBox(prompt, labels){
  return new Promise(res => {
    if (scene) scene.boxes++;
    sbRender(scene.who, ''); $('#sbEcho').textContent = ''; $('#sbName').hidden = true; $('#sbSkip').hidden = true; $('#sbNext').hidden = true;
    sbox.text = prompt; sbox.t0 = now(); sbox.full = false; sbox.cps = TEXT_CPS[S.settings.textSpeed] || 60; sbox.mode = 'choice'; sbox.resolve = () => {};
    const box = $('#sbChoices'); box.innerHTML = ''; armOptions();
    labels.forEach((lb, i) => { const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'btn sb-choice'; bt.textContent = lb;
      bt.addEventListener('click', () => { if (!sbox.full) sbFull(); sfx('tap'); box.innerHTML = ''; sbox.resolve = null; res(i); }); box.append(bt); });
  });
}
const BAD_NICK_CH = /[\u0000-\u001f\u007f-\u009f<>{}]/g;
function nameBox(target, prompt, def, max){
  return new Promise(res => {
    if (scene) scene.boxes++;
    const p = viewPet(), species = p ? nameOf(spi(p), p.stage) : '';
    sbRender(scene.who, prompt); sbox.text = prompt; sbox.full = true; sbox.mode = 'name'; sbox.resolve = () => {}; armOptions();
    $('#sbEcho').textContent = ''; $('#sbChoices').innerHTML = ''; $('#sbSkip').hidden = true; $('#sbNext').hidden = true;
    const inp = $('#sbInput'); inp.maxLength = max || 10;
    inp.value = target === 'player' ? (curName(true) || def || DEFAULT_PLAYER_NAME) : species;
    $('#sbNameSkip').hidden = target !== 'partner'; $('#sbName').hidden = false;
    setTimeout(() => { try { inp.focus({ preventScroll: true }); inp.select(); } catch (e) {} }, 0);
    const done = skip => {
      $('#sbName').hidden = true; inp.blur(); sbox.resolve = null; sbox.nameDone = null; sfx('tap');
      if (target === 'player') {
        const v = Array.from(String(inp.value).replace(BAD_NICK_CH, '').replace(/\s+/g, ' ').trim()).slice(0, max || 10).join('').trim() || def || DEFAULT_PLAYER_NAME;
        scene.view.name = v; pend(() => { S.player.name = v; });
      } else {
        const v = skip ? '' : cleanNick(inp.value), nk = v && v !== species ? v : null;
        scene.view.nick = nk; const np = scene.view.pet; if (np) pend(() => { np.nick = nk; });
      }
      res();
    };
    sbox.nameDone = done;
  });
}
/* --- showBasket (#ovBasket): three lantern baskets, Ilse's pick glows; any basket can be chosen (§8) --- */
function basketPick(lines, suggest){
  return new Promise(res => {
    const ov = $('#ovBasket'), row = $('#bkRow'), card = $('#bkCard');
    const show = which => { armOptions();     // the card's YES / NOT YET and the basket row each ignore taps for 500 ms when drawn
      row.hidden = !!which; card.hidden = !which; $('#bkTitle').hidden = !!which;
      if (!which) return;
      const si = SP_INDEX[which], sp = SPECIES[si];
      spriteCanvas($('#bkBig'), si, 0); $('#bkName').textContent = sp.stages[0].name; typeChip($('#bkType'), sp.type); $('#bkLine').textContent = lines[which];
      $('#bkYes').onclick = () => { ov.hidden = true; res(which); };
      $('#bkNo').onclick = () => { sfx('tap'); show(null); };
    };
    row.innerHTML = '';
    for (const id of ['ember', 'tide', 'bloom']) {
      const si = SP_INDEX[id], b = document.createElement('button'); b.type = 'button'; b.className = 'basket' + (id === suggest ? ' pick' : ''); b.dataset.line = id;
      const cv = document.createElement('canvas'); cv.width = cv.height = 18; spriteCanvas(cv, si, 0);
      const nm = document.createElement('span'); nm.textContent = SPECIES[si].stages[0].name;
      b.append(cv, nm);
      if (id === suggest) { const tg = document.createElement('small'); tg.textContent = "Ilse's pick"; b.append(tg); }
      b.addEventListener('click', () => { sfx('tap'); show(id); }); row.append(b);
    }
    show(null); ov.hidden = false;
  });
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
// CREATURES_SLICE §3: authored spawn tables, rows [speciesId, baseWeight, minLv, maxLv]. Effective weight = base x (1 + 0.25 x the
// species' habitat sum over the active tags); weatherOnly rows weigh 0 unless their tag is active; no 8% any-species roll here.
const SPAWNS = {
  route1:    { stage2: 0.05, table: [['beetle', 30, 2, 4], ['mole', 20, 3, 5], ['crab', 12, 3, 5], ['moth', 15, 2, 4],
               ['dormouse', 10, 3, 5], ['gust', 6, 3, 5], ['frost', 2, 4, 5], ['vane', 8, 4, 6]] },
  fernbrook: { stage2: 0.05, table: [['beetle', 30, 6, 9], ['mole', 25, 7, 10], ['moth', 10, 6, 9], ['dormouse', 10, 7, 10],
               ['crab', 8, 7, 9], ['frost', 3, 7, 9], ['shade', 5, 7, 9], ['vane', 7, 7, 9]] },
};
const spawnKey = () => (CUR && CUR.spawns) || 'proto';
const habSum = (sp, tags) => tags.reduce((s, t) => s + ((sp.habitat || {})[t] || 0), 0);
function tableWeights(t, tags){ return t.table.map(([id, base]) => { const sp = SPECIES[SP_INDEX[id]]; return weatherOk(sp, tags) ? base * (1 + 0.25 * habSum(sp, tags)) : 0; }); }
// Old Meadow ('proto'): starter lines (ember, tide, bloom) weigh 0 until story.seal1, then x0.2, in the habitat pick and the 8% roll (MAPS_SLICE §11).
const starterMult = sp => !sp.starter ? 1 : (S.flags && S.flags['story.seal1']) ? 0.2 : 0;
function speciesWeights(tags = envTags()){ return SPECIES.map(sp => weatherOk(sp, tags) ? habSum(sp, tags) * starterMult(sp) : 0); }
const anyWeights = () => SPECIES.map((sp, i) => ANY_POOL.includes(i) ? starterMult(sp) : 0);
function spawnOdds(tags = envTags(), key = spawnKey()){   // expected spawn probability per species for these tags on this map's table
  const t = SPAWNS[key];
  if (t) {
    const w = tableWeights(t, tags), tot = w.reduce((a, b) => a + b, 0), out = SPECIES.map(() => 0);
    t.table.forEach(([id], k) => { out[SP_INDEX[id]] += tot ? w[k] / tot : 0; });
    return out;
  }
  const w = speciesWeights(tags), tot = w.reduce((a, b) => a + b, 0), aw = anyWeights(), atot = aw.reduce((a, b) => a + b, 0), any = i => aw[i] / atot;
  return w.map((v, i) => tot ? (1 - ANY_SPECIES_CHANCE) * v / tot + ANY_SPECIES_CHANCE * any(i) : any(i));
}
function pickW(w){
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0 && w[i] > 0) return i; }
  return w.findLastIndex(v => v > 0);
}
function pickSpecies(tags = envTags(), key = spawnKey()){
  const t = SPAWNS[key];
  if (t) return SP_INDEX[t.table[pickW(tableWeights(t, tags))][0]];
  const w = speciesWeights(tags), tot = w.reduce((a, b) => a + b, 0);
  if (!tot || Math.random() < ANY_SPECIES_CHANCE) return pickW(anyWeights());
  return pickW(w);
}
const pickStage = (key = spawnKey()) => Math.random() < ((SPAWNS[key] || {}).stage2 || WILD_STAGE2_CHANCE) ? 1 : 0;
// w.lv: a first form rolls uniformly in its table row's range; a second form (5%) rolls Lv 6-8 (§3); Old Meadow keeps the proto bands.
function wildLv(sp, stage, key = spawnKey()){
  const row = !stage && SPAWNS[key] && SPAWNS[key].table.find(r => r[0] === SPECIES[sp].id);
  return row ? row[2] + Math.floor(Math.random() * (row[3] - row[2] + 1)) : wildLevel(stage, Math.random, 'proto', SPECIES[sp].id);
}
const nextTo = (x, y, ch) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => MAP[y+dy] && MAP[y+dy][x+dx] === ch);
const inZone = (x, y) => !CUR.zones.length || CUR.zones.some(z => x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h);
// creatures roam only on t g f s inside a spawn zone, never on p or B (MAPS_SLICE §2)
const roamable = (x, y) => !solid(x, y) && !!(TILE_DEF[MAP[y][x]] || {}).roam && inZone(x, y) && !warpAt(x, y);
function wildAt(x, y, except){ return wild.list.find(w => w !== except && ((w.x === x && w.y === y) || (w.to && w.from.x === x && w.from.y === y))); }
const playerOn = (x, y) => (S.world.x === x && S.world.y === y) || (walk.to && walk.from.x === x && walk.from.y === y);
function spawnSpot(sp){
  const pref = { grass: (x, y) => MAP[y][x] === 't', shore: (x, y) => nextTo(x, y, 'w'), woods: (x, y) => nextTo(x, y, 'T') }[SPECIES[sp].tiles || 'grass'];
  const best = [], ok = [];
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    if (!roamable(x, y) || wildAt(x, y) || Math.abs(x - S.world.x) + Math.abs(y - S.world.y) < 3 || (fol.x === x && fol.y === y)) continue;
    if (MW > 24 && Math.abs(x - S.world.x) + Math.abs(y - S.world.y) > 10) continue;      // wide maps: within 10 tiles of you (§4)
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
  const w = { id: ++wild.seq, sp, stage, lv: wildLv(sp, stage), x: spot[0], y: spot[1], hx: spot[0], hy: spot[1], fx: spot[0], fy: spot[1], from: null, to: null, t0: 0,
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
// The chip names the place you're in (map display name from the slice data). The biome/weather tag shows only on maps with
// wild Walklings (where it changes who appears); towns and rooms show just their name.
const placeName = () => (CUR && CUR.name) || '';
const wildHere = () => !isRoom() && !!CUR.spawns;
function renderEnv(){
  const name = placeName(), wildy = wildHere() && !!ENV;
  $('#envText').textContent = wildy ? (name ? name + ' \u00b7 ' : '') + ENV.label : (name || (ENV ? ENV.label : ''));
  $('#envSrc').textContent = wildy ? (STATUS_TAG[ENV.status] || '') : '';
  $('#envBadge').classList.toggle('wild', wildy);
  $('#envBadge').setAttribute('aria-label', wildy ? name + '. Wild area: ' + ENV.label + ' (' + (STATUS_TAG[ENV.status] || '') + '). Tap for details.' : name + '. Tap for location details.');
  if (!ENV) return;
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
// Tabs stay locked until the starter is received (Phase M: the opening is played on the WALK tab), and while anything is open.
function lockTabs(on){ $('#tabs').classList.toggle('locked', !!on || (!!S && !allPets().length) || (!on && (!!scene || (typeof overlayOpen === 'function' && overlayOpen())))); }
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
function resetWild(){ wild.list = []; wild.poofs = []; wild.chase = null; wild.started = false; wild.auto = !!CUR.spawns; }   // Hearthmoor and rooms never spawn

/* ---------- battle (BATTLE.md v0.3.1) ---------- */
// Meeting a wild creature (bump/tap/G) opens a turn-based battle; befriending is one of its actions (§2). The befriend bar
// reuses the old encounter elements (#tbar/#tzone/#tmark/#encGo/#encTries/#encName), now inside #ovBattle.
const enc = { tries: 3, zone: [0.4, 0.6], speed: 0.003, freezeUntil: 0, mark: 0, t0: 0, open: false, next: null };
const BEFRIEND_TRIES = 3;
const moveName = id => (MOVES[id] || MOVES.wobble).name;
const petById = id => allPets().find(q => q.id === id) || null;
/* CREATURES_SLICE §5 recovery. Each faded pet keeps that day's care samples (p.fc = { d, sum, n }; additive, no save bump), one
   per minute while the game is open. At each daily rollover where that day's average care is >= 60, faded -= 1; at 0 the colour
   returns with a sparkle and (§6) the naming prompt: "It remembers who it is. What will you call it?" */
const FADE_CARE = 60, FADE_SAMPLE_MS = 60e3;
const fadeQ = [], sparkle = { id: null, until: 0 };
function fadeTick(sample){
  if (!S) return;
  const d = dayKey(Date.now());
  for (const p of allPets()) {
    if (!isFaded(p)) continue;
    if (!p.fc || typeof p.fc !== 'object') p.fc = { d, sum: 0, n: 0 };
    if (p.fc.d !== d) {
      const avg = p.fc.n ? p.fc.sum / p.fc.n : 0;
      if (avg >= FADE_CARE) p.faded = Math.max(0, (+p.faded || 0) - 1);
      p.fc = { d, sum: 0, n: 0 };
      if (!isFaded(p)) { delete p.faded; delete p.fc; fadeQ.push(p.id); save(); }
    }
    if (sample && isFaded(p)) { p.fc.sum += care(p); p.fc.n++; }
  }
  if (fadeQ.length && !scene && !battle.on && !overlayOpen()) colourBack(fadeQ.shift());
}
function colourBack(id){
  const p = petById(id); if (!p) return;
  sfx('levelup'); sparkle.id = id; sparkle.until = now() + 3000; updateHUD();
  const steps = [['say', '', "{pet}'s colour is back! It sparkles in the light."]];
  if (!cleanNick(p.nick)) steps.push(['nameEntry', 'partner', 'It remembers who it is. What will you call it?']);
  runSteps(steps, { viewPet: p });
}
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
  const lv = nx.lv || wildLv(nx.sp, nx.stage);                 // forced encounters roll this map's level
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
    fx: [], levelUps: [], foeHealUsed: false, log: [], storyMoves: !!(o.moves && o.moves.length), story: o.story || null, bonus: +o.bonus || 0, faded: +o.faded || 0 });
  B.mapIntro = !!o.mapIntro; B.onEnd = o.onEnd || null;           // mapIntro: the intro + summon lines were already said in the map text box (§6.1)
  if (o.kind === 'trainer') B.foes = trainerTeam(TRAINERS[o.trainerId]).map(m => makeFoe(m.form, m.level, m.moves));
  else { B.foes = [makeFoe(o.form, o.level, o.moves)]; if (B.faded) B.foes[0].faded = B.faded; }
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
    if (!B.mapIntro) {                                                       // debug forceTrainer only: no map text box to say them in
      await say(t.name + ': ' + trLine(t.lines.intro), id);                 // MAPS_SLICE §6.1 summon sequence
      if (!alive(id)) return; await say(btLine('trainerSummon'), id); if (!alive(id)) return;
    }
    await say(btLine('trainerIntro'), id);
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
  $('#encName').hidden = true; $('#encNick').blur(); $('#btSeal').hidden = true;
  B.on = false; B.state = 'IDLE'; msgSkip = null; closeSheet(null);
  $('#ovBattle').hidden = true; lockTabs(false);
  const w = B.wid && wild.list.find(o => o.id === B.wid);
  if (w) {
    if (B.result === 'befriended') removeWild(w, false);                       // it joined you
    else if (B.result === 'win' || B.result === 'fled') removeWild(w, true);   // it wandered off
    else { w.idleUntil = 0; w.shyUntil = wild.clock + 1500; }                   // run / team wipe: it stays and scoots away
  }
  if (B.result === 'run') toast('Got away safely.');
  const onEnd = B.onEnd; B.onEnd = null;
  if (B.result === 'tired' && !onEnd) respawnAfterWipe();   // in a scene the respawn waits for the scene's end (§6 rival1)
  updateHUD(); save();
  if (onEnd) onEnd(B.result);
}
// §7.2 team wipe: back to world.respawn's Lantern House (Hearthmoor: inside, by the beds; INTERIORS slicePatch respawnIn).
// Nothing lost, nobody healed, timers keep running.
function respawnAfterWipe(){
  const id = WORLD[S.world.respawn] ? S.world.respawn : 'hearthmoor', m = WORLD[id];
  const at = m.respawnIn ? m.respawnIn : Object.assign({ map: id }, m.respawn || m.safe);
  clearMoves(); arriveAt(at);
  toast(m.respawnIn ? 'Your team fainted... you wake at the Lantern House. Rest by the beds.'
    : 'Your team fainted... you wake at the ' + (m.name || 'town') + ' Lantern House door. Step inside to rest.');
}
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
  if (a.kind === 'bag') {                                // INVENTORY §3.2: checked before the turn, applied here (uses the turn)
    const r = useItem(a.item, a.target || null, 'battle');
    sfx(r.ok ? 'heal' : 'denied'); renderBattleCards(); save();
    await say(r.msg, id);
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
    if (B.faded) { np.faded = B.faded; np.fc = { d: dayKey(Date.now()), sum: 0, n: 0 }; }   // CREATURES_SLICE §5: faded: days left (additive field)
    if (B.story) S.flags['story.' + B.story] = true;                                          // a story creature: its flag is set on befriend only
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
  return openSheet(forced ? 'Who goes next?' : 'Swap to which Walkling?', items, forced ? null : 'BACK');
}
// The pet list for an item that needs a target (party, HP bars, FAINTED Nm / TIRED badges); `pre` is listed first and marked.
function itemTargetSheet(id, pre){
  const it = ITEMS[id], order = S.party.slice().sort((a, b) => (b.id === pre) - (a.id === pre));
  const title = id === 'wake_tonic' ? 'Wake which Walkling?' : it.heal ? 'Heal which Walkling?' : 'Give it to which Walkling?';
  return openSheet(title, order.map(q => ({ label: petName(q) + '  Lv ' + levelOf(q), sub: 'HP ' + Math.ceil(hpOf(q)) + '/' + maxHpOf(q) + (hpBadge(q) ? '  ' + hpBadge(q) : '')
    + (id === 'energy_sip' ? '  NRG ' + Math.round(q.energy) : id === 'joy_crumb' ? '  JOY ' + Math.round(q.happy) : ''), hp: hpOf(q) / maxHpOf(q), value: q.id, cls: q.id === pre ? 'sh-pre' : '' })), 'BACK');
}
// Battle BAG (INVENTORY §3.2): the catalog in order (count >= 1); a refusal says why and keeps the item and the turn.
async function bagSheet(){
  const B = battle, ids = ITEM_ORDER.filter(k => itemCount(k) > 0);
  const refuse = async msg => { sfx('denied'); B.state = 'MSG'; setPanel('busy'); await say(msg); if (B.on) toChoose(); };
  if (!ids.length) { sfx('denied'); B.state = 'MSG'; await say('Your bag is empty.'); if (B.on) toChoose(); return; }
  const pick = await openSheet('Bag', ids.map(k => ({ label: ITEMS[k].name + '  x' + itemCount(k), sub: ITEMS[k].blurb, value: k })), 'BACK');
  if (!pick || !B.on) return;
  const it = ITEMS[pick];
  if (!it.use.includes('battle')) return refuse("Can't use that here yet.");
  let tgt = null;
  if (it.target) { tgt = await itemTargetSheet(pick, B.me.petId); if (!tgt || !B.on) return; }
  const no = itemRefusal(pick, tgt ? petById(tgt) : null, 'battle');
  if (no) return refuse(no);
  return resolveTurn({ kind: 'bag', item: pick, target: tgt });
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
  if (result === 'befriended' && !battle.faded) { $('#encNick').value = ''; $('#encNick').placeholder = foeName(curFoe()); $('#encName').hidden = false; }   // a faded one is named when its colour returns (§6)
  $('#btOk').textContent = result === 'befriended' ? 'YAY!' : 'OK';
  setPanel('end'); fitBattle();
}
async function results(result, id){
  const B = battle, t = tr(), won = result === 'win' || result === 'befriended';
  const parts = new Set(); B.participants.forEach(s => s.forEach(x => parts.add(x)));
  parts.forEach(pid => { const p = petById(pid); if (p) applyBattleCosts(p, { tired: B.fainted.has(pid), won }); });   // once, clamp 0..100
  if (result === 'win' && t) {
    const money = t.money != null ? t.money : 10 * Math.max(...trainerTeam(t).map(m => m.level)) * (t.hall ? 3 : 1);
    S.money = (S.money || 0) + money; S.flags['trainer.' + B.trainerId] = true;
    if (t.hall && t.seal) { S.seals[t.seal] = Date.now(); }
    save();
    await say(playerName() + ' got ' + acorns(money) + '!', id); if (!alive(id)) return;
    if (t.hall && t.seal) { showSealCard(t.seal); sfx('evoFanfare'); sfx('levelup', 0.9); await say('You earned the ' + sealName(t.seal) + '!', id); if (!alive(id)) return; }
  }
  if (t && t.oneShot && (result === 'win' || result === 'tired')) {      // §6: Rook never repeats; the scene reads the result
    S.flags['story.rival1_done'] = true; S.flags['story.rival1_result'] = result === 'win' ? 'won' : 'lost'; save();
  }
  for (const lu of B.levelUps) {
    const p = petById(lu.id); if (!p) continue;
    sfx('levelup'); await say(petName(p) + ' grew to Lv ' + lu.to + '!', id); if (!alive(id)) return;
    for (const e of levelMoves(p, lu.from, lu.to)) { await teachMove(p, e.id, s => say(s, id)); if (!alive(id)) return; }
  }
  B.levelUps = []; save(); updateHUD();
}
// The Seal card (BATTLE §7 Trial Hall): the Seal's sprite plus its name, over the battle stage until the battle closes.
// Seal 1 art: Design ICONS_SEALS (5d59b34), ICON_ART.seal_fernbrook.grid, copied verbatim (gold rim, leaf on a white glint).
const SEAL_ART = { seal_fernbrook: [
  '.....oooooo.....',
  '...ooyyyyyyoo...',
  '..oyywwwyyyyyo..',
  '.oywwyyyyytttyo.',
  '.owyyyyyttlgtyo.',
  'oywyyyytlltgtyyo',
  'oyyyyytlltggtyyo',
  'oyyyytlltggtyyyo',
  'oyyyytltgggtyyyo',
  'oyyyyttgggtyyyoo',
  'oyyyypttttyyyyoo',
  '.oyypyyyyyyyyoo.',
  '.oypyyyyyyyyooo.',
  '..oyyyyyyyoooo..',
  '...ooyyyyoooo...',
  '.....oooooo.....',
] };
function showSealCard(id){
  const c = $('#btSealArt'), g = ctx(c); g.clearRect(0, 0, c.width, c.height);
  g.drawImage(keeperCanvas(SEAL_ART[id] || SEAL_ART.seal_fernbrook), 0, 0);
  $('#btSealName').textContent = sealName(id); $('#btSeal').hidden = false;
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
  const w = Math.min(0.6, befriendWidth(f.hp / f.maxHp, f.stage, p.happy, B.treat) + B.bonus), c = 0.2 + Math.random() * 0.6;   // story creatures: +bonus (Faded Fuzzwick +0.10)
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
  const drawMon = (who, si, stage, x0, y0, mirror, faded) => {
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
    const img = sprSet(si, stage, faded)[mode];
    if (mirror) { g.save(); g.translate(x + 18, y); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore(); } else g.drawImage(img, x, y);
  };
  drawMon('foe', f.si, f.stage, fx0, fy0, false, !!f.faded);
  if (B.kind === 'wild' && f.stage > 0 && Math.floor(t / 350) % 5 === 0) drawGlyph(g, 'spark', fx0 + 14, fy0 - 2);   // rare form twinkle
  drawMon('me', spi(p), p.stage, mx0, my0, true, isFaded(p));             // back view = mirrored
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
  spriteCanvas($('#scIcon'), si, p.stage, 'n', isFaded(p));
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
  if (resetting) return; resetting = true;      // save() is a no-op from here on, whatever fires before the page goes
  clearMoves(); clearInterval(saveTimer);
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
    const cv = document.createElement('canvas'); cv.width = cv.height = 18; spriteCanvas(cv, spi(p), p.stage, 'n', isFaded(p));
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

/* ---------- input ---------- */
function bindInput(){
  $$('#tabs button').forEach(b => b.addEventListener('click', () => { if (tabsGuarded()) return; if (b.dataset.tab !== screen) sfx('tap'); showTab(b.dataset.tab); }));
  $('#settingsBtn').addEventListener('click', () => { if (tabsGuarded()) return; if ($('#ovSettings').hidden) openSettings(); else closeSettings(); });
  // option buttons that just appeared ignore taps (capture phase, before their own handlers)
  for (const ev of ['click', 'pointerup']) document.addEventListener(ev, e => {
    if (performance.now() < optArmAt && e.target.closest && e.target.closest('#sbChoices button, #sbName button, #ovBasket button, #ovLook button')) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  $('#setClose').addEventListener('click', () => { sfx('tap'); closeSettings(); });
  $('#ovSettings').addEventListener('click', e => { if (e.target === e.currentTarget) closeSettings(); });
  $('#setSound').addEventListener('click', () => { const m = PPSound.toggle(); renderSoundRow(); if (!m) sfx('tap'); toast(m ? 'Sound off' : 'Sound on'); });
  $('#setFollower').addEventListener('click', () => { toggleFollower(); renderFollowerBtn(); });
  $('#setLook').addEventListener('click', () => { sfx('tap'); closeSettings(); openLook(false); });
  // scene text box (MAPS_SLICE §8): tap anywhere on the box or the map advances; SKIP jumps to the next interactive step
  $('#ovScene').addEventListener('pointerdown', e => { if (e.target.closest('button, input')) return; e.preventDefault(); sceneTap(); });
  $('#sbSkip').addEventListener('click', e => { e.stopPropagation(); sceneSkip(); });
  $('#sbOk').addEventListener('click', () => { if (sbox.nameDone) sbox.nameDone(false); });
  $('#sbNameSkip').addEventListener('click', () => { if (sbox.nameDone) sbox.nameDone(true); });
  const si = $('#sbInput');
  si.addEventListener('input', () => { const v = si.value.replace(BAD_NICK_CH, ''); if (v !== si.value) si.value = v; });
  si.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (sbox.nameDone) sbox.nameDone(false); } });
  $('#talkBtn').addEventListener('click', () => { if (!overlayOpen() && talkFacing()) sfx('tap'); });
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
    const down = e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch(_) {} walk.dpad = dir; walk.queued = DIRS[dir]; b.classList.add('on'); hideBumpHint(); };
    const up = e => { if (walk.dpad === dir) walk.dpad = null; b.classList.remove('on'); };
    b.addEventListener('pointerdown', down);
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev => b.addEventListener(ev, up));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  // Map: tap a tile to walk there, or drag to steer.
  const mc = $('#mapCanvas'); let ptr = null;
  mc.addEventListener('pointerdown', e => { e.preventDefault(); hideBumpHint(); if (scene) { sceneTap(); return; } try { mc.setPointerCapture(e.pointerId); } catch(_) {} ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, dragged: false }; });
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
      const o = objAt(tx, ty, q => talkable(q) || q.kind === 'door') || (tileAt(tx, ty) === 'H' && doorAt(tx, ty + 1));   // a door: its tile or the wall above it
      if (scene || fade.busy) { /* nothing */ }
      else if (w && pet()) { if (wild.chase !== w.id) sfx('notice'); wild.chase = w.id; walk.target = { x: w.x, y: w.y }; walk.path = walk.arrive = null; }   // tap a creature: walk up and meet it
      else if (followerAt(tx, ty)) { clearMoves(); openStatsCard(pet().id); }                                      // tap the follower: its stats card (K.4)
      else if (o) { wild.chase = null; tapObject(o); }                                                            // tap-to-talk (INTERIORS §4.2)
      else if (!solid(tx, ty)) { wild.chase = null; walk.path = walk.arrive = null; walk.target = { x: tx, y: ty }; }
    }
    walk.drag = null; ptr = null;
  };
  mc.addEventListener('pointerup', end); mc.addEventListener('pointercancel', end);
  // Keyboard (bonus)
  const KEYS = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right', W:'up', S:'down', A:'left', D:'right' };
  window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (scene && sbox.resolve) {                  // Space / Enter advance the text box; Escape does nothing during a choice
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) sceneTap(); return; }
    }
    if ((e.key === ' ' || e.key === 'Enter') && screen === 'walk' && !overlayOpen() && !e.repeat) { if (talkFacing()) { e.preventDefault(); return; } }
    if (e.key === 'Escape' && !$('#ovStats').hidden) { closeStatsCard(); return; }
    if (e.key === 'Escape' && !$('#ovReset').hidden) { closeReset(); return; }
    if (e.key === 'Escape' && !$('#ovSettings').hidden) { closeSettings(); return; }
    if (e.key === 'Escape' && !$('#ovLook').hidden && !lookUI.newPlayer) { closeLook(); return; }
    if (KEYS[e.key] && screen === 'walk') { e.preventDefault(); if (walk.key !== KEYS[e.key]) { walk.queued = DIRS[KEYS[e.key]]; hideBumpHint(); } walk.key = KEYS[e.key]; return; }
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
  // Back/forward cache: a page restored with an old game in memory reloads if its save was erased or replaced meanwhile.
  window.addEventListener('pageshow', e => {
    if (!e.persisted || !S || resetting) return;
    let o = null; try { o = JSON.parse(localStorage.getItem(PPSave.V2_KEY)); } catch(err) {}
    if (!o || o.uid !== S.uid) { resetting = true; location.reload(); }
  });
}

/* ---------- main loop ---------- */
let lastT = now(), tickAcc = 0;
function frame(t){
  const dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
  const p = pet();
  if (p && !overlayOpen()) {
    const sleeping = t < anim.sleepUntil, R = rate();
    allPets().forEach(q => {                         // decay by role (PACING §5): partner x1, party x0.5, box paused
      const k = roleMult(q); if (!k) return;
      q.hunger = clamp(q.hunger - R.hunger * k * dt, 0, 100);
      q.happy = clamp(q.happy - R.happy * k * dt * (q.hunger < 20 ? 2 : 1), 0, 100);
      if (!(sleeping && q.id === S.partnerId)) q.energy = clamp(q.energy - R.energy * k * dt, 0, 100);   // only the resting partner is exempt
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
  if (scene) sbTick();
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
  allPets().forEach(p => { const k = roleMult(p); if (!k) return;   // PACING §5: box pets never get their boxed time
    p.hunger = dec(p.hunger, sec*R.hunger*k); p.happy = dec(p.happy, sec*R.happy*k); p.energy = dec(p.energy, sec*R.energy*k); });
}
// A backgrounded tab pauses requestAnimationFrame (and the periodic save keeps bumping S.last),
// so catch up on return using the time the tab was actually hidden.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (hiddenAt && S) { const sec = (Date.now() - hiddenAt) / 1000; catchUp(sec); regenAll(sec); hiddenAt = 0; updateHUD(); save(); bowlHint(); }
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
  useMap(S.world.map); S.world.map = CUR.id; safeSpot(); resetWild(); renderEnv();
  walk.fx = S.world.x; walk.fy = S.world.y;
  bindInput();
  placeFollower(); renderFollowerBtn(); renderKeeperName();
  // Phase M (INTERIORS §3.3): a new game wakes in the home room and Ilse's intro runs at once (the look picker is inside it).
  // Closed mid-starter: Lodge doorstep with a nudge. Tabs stay locked until the starter; the opening plays on the WALK tab.
  const newGame = !allPets().length && !S.flags['story.intro_seen'];
  const late = L.notice === 'recovered' ? 2700 : 900;
  if (!allPets().length) { updateHUD(); showTab('walk'); lockTabs(false); if (newGame) setTimeout(() => runScene('intro'), 60); else setTimeout(() => toast('Ilse is waiting inside.'), late); }
  else {
    updateHUD(); bowlHint(!S.player.look || L.notice === 'recovered' ? 4600 : 1200);
    if (!S.player.look) setTimeout(() => toast("New: pick your keeper's look under the gear (Change look)."), late);   // after the recovery notice, never over it
    else if (!S.player.name && S.world.map === 'hearthmoor') setTimeout(() => toast('Warden Ilse would like a word at the Lodge.'), late);
  }
  if (L.notice === 'recovered') setTimeout(() => toast("Your save couldn't be read, so your older save was loaded."), 600);
  fitAll();
  if (fastMode) setTimeout(() => toast('FAST MODE ON (debug decay)'), 400);
  saveTimer = setInterval(save, 5000);
  setInterval(() => fadeTick(true), FADE_SAMPLE_MS); setInterval(() => fadeTick(false), 5000); fadeTick(false);
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
    spawnOdds: (tags, key) => spawnOdds(tags, key), cooldownLeft: act => cdLeft(pet(), act),
    get careXpToday(){ return xpToday(pet(), 'cx'); }, get exploreXpToday(){ return xpToday(pet(), 'ex'); },
    get muted(){ return PPSound.muted; }, careGain, showTab, get roleMult(){ return { ...ROLE_MULT }; }, get warmBowlReady(){ return bowlReady(); },
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
      if (!f) { const sp = pickSpecies(), st = pickStage(); f = SPECIES[sp].id + '/' + st; lv = lv || wildLv(sp, st); }
      const [line, st] = String(f).split('/'); if (SP_INDEX[line] == null || !SPECIES[SP_INDEX[line]].stages[+st]) return false;
      return openBattle({ kind: 'wild', form: f, level: lv || wildLevel(+st, Math.random, 'proto', line) });
    },
    showSight: (on = true) => { sightShown = !!on; return CUR.objs.filter(o => o.kind === 'trainer' && present(o)).map(o => ({ id: o.id, line: sightLine(o), canSpot: canSpot(o) })); },
    objPos: id => { const o = CUR.objs.find(x => x.id === id); if (!o) return null; const q = objPos(o); return { x: q.x, y: q.y, fx: q.fx, fy: q.fy, moving: !!q.moving, facing: mapRT.face[id] || q.facing || (TRAINERS[id] || {}).facing || o.facing || 'down' }; },
    forceTrainer: id => { if (!TRAINERS[id] || S.flags['trainer.' + id]) return false; showTab('walk'); if (overlayOpen()) return; return openBattle({ kind: 'trainer', trainerId: id }); },
    setHp: (who, n) => {
      if (!battle.on) return; if (who === 'foe') { const f = curFoe(); f.hp = clamp(Math.round(+n), 0, f.maxHp); }
      else { const p = activePet(); setMyHp(p, +n); } renderBattleCards(); save();
    },
    fadeTick: sample => fadeTick(!!sample), spriteColors: (form, faded) => { const [l, st] = form.split('/'), c = sprSet(SP_INDEX[l], +st, !!faded).n, d = c.getContext('2d').getImageData(0, 0, 18, 18).data, o = new Set();
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) o.add('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('')); return [...o]; }, get fadeQueue(){ return fadeQ.slice(); },
    winBattle: () => { if (battle.on) finish('win', battle.id); }, loseBattle: () => { if (battle.on) finish('tired', battle.id); },
    healTeam, setFaint: (min = 20) => { const p = pet(); if (!p) return; if (min <= 0) { delete p.faintUntil; delete p.hpNow; } else faintPet(p, Date.now() - (20 - min) * 60000); updateHUD(); save(); },
    giveItem: (id, n = 1) => { n |= 0; const c = Math.max(0, itemCount(id) + n); if (c) S.bag[id] = c; else delete S.bag[id]; save(); return c; },   // debug: no cap; a negative n trims (INVENTORY §6)
    useItem: (id, petId, ctx = 'field') => { const r = useItem(id, petId || (pet() && pet().id), ctx); if (r.ok) { updateHUD(); save(); } return r; },
    grantItem: (id, n) => { const r = grantItem(id, n); save(); return r; },
    setMoney: n => { S.money = Math.max(0, n | 0); save(); return S.money; },
    battle,
    setMoves: ids => { const p = pet(); if (!p) return; p.moves = (ids || []).filter(id => MOVES[id]).slice(0, 4); save(); return p.moves.slice(); },
    aiPick: () => battle.on ? aiPick() : null,   // tests: the AI's pick for the current turn (same rng as the battle)
    clearEvoMoves: () => { const p = pet(); if (!p) return; p.evoMoves = []; save(); },
    setEnv: x => { const e = PPEnv.setOverride(x); resetWild(); return e && { ...e }; },
    spawnWild: (sp, stage, x, y) => { const w = spawnWild(sp, stage, x != null ? [x, y] : null); return w && { id: w.id, sp: w.sp, stage: w.stage, lv: w.lv, x: w.x, y: w.y, name: nameOf(w.sp, w.stage) }; },
    clearWild: () => { wild.list = []; wild.poofs = []; wild.chase = null; wild.started = true; wild.auto = false; }, autoWild: () => resetWild(),
    pickSpecies: (tags, key) => pickSpecies(tags, key), pickStage: key => pickStage(key), wildLv: (sp, st, key) => wildLv(sp, st, key),
    spawnTables: () => JSON.parse(JSON.stringify(SPAWNS)),
    giveXp: n => { pet().xp += n; updateHUD(); }, setFast: on => setFast(on),
    giveBx: (n, learn) => { const p = pet(), r = grantBattleXp(p, n); if (learn) levelMoves(p, r.from, r.to).forEach(e => learnQ.push({ id: p.id, mid: e.id })); updateHUD(); save(); return r; },   // battle XP (Level); learn=true queues the level-up move prompts
    resetDailyCaps: () => { const p = pet(); if (!p) return; delete p.cx; delete p.ex; delete S.flags[BOWL.flag]; updateHUD(); save(); toast('Daily XP caps reset (debug)'); },
    away: h => { const sec = Math.max(0, +h || 0) * 3600; catchUp(sec); regenAll(sec); updateHUD(); save(); return allPets().map(q => ({ id: q.id, role: roleOf(q), hunger: q.hunger, happy: q.happy, energy: q.energy })); },   // PACING §6
    makePartner: id => { makePartner(id); updateHUD(); save(); },
    setMapBackdrop: v => { const m = MAP_INFO[S.world.map] || (MAP_INFO[S.world.map] = {}); if (v == null) delete m.backdrop; else m.backdrop = v; return backdropName(); },
    // Phase M (MAPS_SLICE §12): jump anywhere, set flags, run any scene
    goto: (map, x, y, facing) => { if (!WORLD[map] || scene) return false; clearMoves(); const m = WORLD[map], sp = m.start || m.safe;
      arriveAt({ map, x: x != null ? x : sp.x, y: y != null ? y : sp.y, facing: facing || 'down' }); return { map: S.world.map, x: S.world.x, y: S.world.y }; },
    setFlag: (k, v = true) => { if (v === null || v === false) delete S.flags[k]; else S.flags[k] = v; save(); return S.flags[k]; },
    runScene: id => { if (!SCENES[id] || scene) return false; showTab('walk'); runScene(id); return true; },
    endScene: () => { if (!scene) return false; scene.skip = true; return true; },
    // tests: expand a scene/dialog string the way a text box would; vars = scene vars (tags, line, suggest), pet = viewed pet
    expandText: (text, vars, viewPetObj) => { const keep = scene;
      if (!keep) scene = { vars: Object.assign({ tags: [], line: null, suggest: null }, vars || {}), view: { flags: {}, name: undefined, pet: viewPetObj || null, nick: undefined }, pending: [] };
      try { return expand(text); } finally { scene = keep; } },

    enc, walk,
  };
  // read-only map / scene / hint views (tests and the console); they can't change the game
  Object.defineProperty(api, 'mapInfo', { enumerable: true, get(){ return { id: CUR.id, w: MW, h: MH, room: isRoom(), outdoor: outdoorId(), backdrop: backdropName(),
    objs: CUR.objs.filter(present).map(o => ({ id: o.id, kind: o.kind, x: objPos(o).x, y: objPos(o).y, block: !!BLOCK_KINDS[o.kind] })) }; } });
  Object.defineProperty(api, 'scene', { enumerable: true, get(){ return scene && { id: scene.id, who: scene.who, boxes: scene.boxes, mode: sbox.mode, text: sbox.text, full: sbox.full,
    typing: !!sbox.resolve && !sbox.full, waiting: !!sbox.resolve, pending: scene.pending.length, skip: scene.skip }; } });
  Object.defineProperty(api, 'spot', { enumerable: true, get(){ return { id: spot.id, bang: spot.bang }; } });   // §6.1 walk-up in progress
  Object.defineProperty(api, 'sightLines', { enumerable: true, get(){ return Object.fromEntries(CUR.objs.filter(o => o.kind === 'trainer' && present(o)).map(o => [o.id, sightLine(o)])); } });
  Object.defineProperty(api, 'fading', { enumerable: true, get(){ return fade.busy; } });
  Object.defineProperty(api, 'optionsReady', { enumerable: true, get(){ return performance.now() >= optArmAt; } });   // option buttons accept taps (500 ms after they appear)
  Object.defineProperty(api, 'bumpHint', { enumerable: true, get(){ return $('#bumpHint').hidden ? null : $('#bumpHint').textContent; } });
  let warned = false;
  for (const [k, v] of Object.entries(cheats)) {
    if (DEBUG) { api[k] = v; continue; }
    if (typeof v === 'function') api[k] = () => { if (!warned) { warned = true; console.info('Walklings: debug hooks need ?debug=1 in the URL.'); } return undefined; };
  }
  window.PixelPets = Object.freeze(api);
}
boot();
})();
