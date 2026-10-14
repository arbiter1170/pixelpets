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
/* Stat decay. PACING v0.3 §2 (Q1 approved by Vincent, Oct 9; ships with the CARE_LOOP cheap slice):
   FOOD drops 3/h with a decay floor of 20, live AND away (100 -> 20 in ~27 h). JOY keeps its 20 h rate, its floor moves to 20
   too, and it drains x2 while Hungry (FOOD < 25), live and away. NRG is unchanged (24 h, away floor 10, live clamp 0).
   The floors are decay-only: action costs (walking, PLAY, REST, battle) still clamp at 0. */
const FOOD_RULES = { perHour: 3, floor: 20, hungry: 25 };
const HOURS_TO_EMPTY = { happy: 20, energy: 24 };
const perSec = h => 100 / (h * 3600);
const REAL_RATE = { hunger: FOOD_RULES.perHour / 3600, happy: perSec(HOURS_TO_EMPTY.happy), energy: perSec(HOURS_TO_EMPTY.energy) };
const FAST_RATE = { hunger: 0.05, happy: 1/12, energy: 1/25 };   // debug fast mode: FOOD = real x60 (PACING §6); JOY/NRG unchanged
const JOY_FLOOR = 20;              // JOY decay floor (live and away)
const OFFLINE_FLOOR = 10;          // NRG catch-up floor (unchanged)
const decayTo = (v, amt, floor) => v <= floor ? v : Math.max(floor, v - amt);   // a stat already at/below the floor stays put
// PACING v0.1 §5 (locked by Vincent, Oct 8): decay by role, live and away. Partner x1, other party pets x0.5, box pets paused.
// The RATE values, FEED amount, floor and food per step are unchanged (still being revisited).
const ROLE_MULT = { partner: 1, party: 0.5, box: 0 };
const roleOf = q => q.id === S.partnerId ? 'partner' : S.party.includes(q) ? 'party' : 'box';
const roleMult = q => ROLE_MULT[roleOf(q)];
// PACING v0.1 §4 Warm Bowl: the first FEED of each local day (one per player) gives FOOD +15 on top and JOY +5 instead of +3.
const BOWL = { food: 15, joy: 5, flag: 'daily.warm_bowl' };
const FAST_KEY = 'pixelpets.fast'; // debug fast mode, kept out of the save schema
const DEBUG_KEY = 'pixelpets.debug';   // ?debug=1 turns debug tools on (remembered), ?debug=0 off. Settings → Debug accepts the password too.
const DEBUG_PASSWORD = 'larson';       // the gate word is "Larson"; any capitalization works
function readDebugPref(){
  let on = false;
  try { on = localStorage.getItem(DEBUG_KEY) === '1'; } catch(e) {}
  const q = new URLSearchParams(location.search).get('debug');
  if (q !== null) { on = q === '1' || q === 'true'; try { if (on) localStorage.setItem(DEBUG_KEY, '1'); else localStorage.removeItem(DEBUG_KEY); } catch(e) {} }
  return on;
}
let DEBUG = readDebugPref();     // E/G/F keys, fast mode, "Pick a place" and the cheat console hooks need this
function writeDebugPref(on){ try { if (on) localStorage.setItem(DEBUG_KEY, '1'); else localStorage.removeItem(DEBUG_KEY); } catch(e) {} }
function syncDebugQuery(on){
  try {
    const q = new URLSearchParams(location.search);
    if (on) { if (q.get('debug') === '0') q.delete('debug'); }
    else q.delete('debug');
    const rest = q.toString();
    history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
  } catch(e) {}
}
function setDebugEnabled(on){
  const next = !!on;
  if (!next && fastMode) { fastMode = false; storeFastPref(false); renderFastTag(); }
  DEBUG = next;
  writeDebugPref(DEBUG);
  syncDebugQuery(DEBUG);
  const dbg = $('#dbgTag'); if (dbg) dbg.hidden = !DEBUG;
  const pick = $('#envPick'); if (pick) pick.hidden = !DEBUG;
  if (PPEnv.allowOverride) PPEnv.allowOverride(DEBUG);
  renderDebugGate();
  return DEBUG;
}
let fastMode = false;
const rate = () => fastMode ? FAST_RATE : REAL_RATE;   // points lost per second, every owned pet

/* Care balance. Cooldowns are per pet, stored as last-use Date.now() stamps in p.cd (missing = ready),
   so reloading can't skip them. Fast mode shrinks them by the same ratio as the food rate (~1/57.6). */
const CARE_CD_MIN = { feed: 20, play: 10, rest: 15 };            // real-mode cooldown, minutes (REST 15m: BATTLE §7.3 Q1, Vincent)
const FAST_CD_SCALE = 1 / 60;                                   // fast mode: FEED 20 s, PLAY 10 s, REST 15 s (PACING §6, no longer tied to the FOOD rate)
const CARE_XP = { feed: 2, play: 5, rest: 1 };                   // XP per care action (before the daily cap)
const CARE_XP_DAILY_CAP = 25;      // per pet per local calendar day (feed/play/rest)
const STEPS_PER_XP = 5;            // walking: 1 XP per 5 steps, remainder kept per pet in p.sr
const BEFRIEND_XP = 5;             // shares the explore cap below
const EXPLORE_XP_DAILY_CAP = 30;   // per pet per local day, shared by walking + befriending XP (p.ex)
const STEP_MS = 170;
const STEP_NRG = 0;               // walking no longer drains NRG (FOOD per step still applies)
const STEP_FOOD = 0.05;           // FOOD per step (PACING v0.3: was 0.15; 100 steps = -5)

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
// Cosmetic Walkling accessories: an 8x8 overlay anchored at the top-right of the 18px sprite. Not keeper slots.
const PET_ACC_IDS = ['bell', 'ribbon', 'scarf', 'leaf', 'star'];
const PET_ACC_ART = {
  bell: ['..yy....', '.yyyy...', '.ywyy...', 'yyyyyyy.', 'yyryyyy.', '.yyyyy..', '..yyy...', '...y....'],
  ribbon: ['rr...rr.', 'rrr.rrr.', 'ryyyyr..', '.ryyyr..', '..rrr...', '...r....', '...r....', '...r....'],
  scarf: ['ooooooo.', 'oyyyooo.', '.oooooo.', '..yyo...', '...oo...', '...oo...', '...oo...', '...yy...'],
  leaf: ['..ll....', '.llll...', 'lllll...', 'lglgl...', '.llll...', '..ll....', '...l....', '....l...'],
  star: ['...y....', '..yyy...', '.yyyyy..', 'yyyyyyy.', '.yyyyy..', '..y.y...', '.y...y..', '........'],
};
function drawPetAccessory(g, name, x, y, faded){
  const grid = PET_ACC_ART[name]; if (!grid) return;
  const ox = x + 10, oy = y;
  g.fillStyle = faded ? PAL.h : PAL.m;
  for (let row = 0; row < 8; row++) {
    const line = grid[row] || '';
    for (let col = 0; col < 8; col++) {
      const ch = line[col]; if (!ch || ch === '.') continue;
      if (!faded) g.fillStyle = PAL[ch] || PAL.m;
      g.fillRect(ox + col, oy + row, 1, 1);
    }
  }
}
// UI sprite (header, collection, dex, starter): dark species get their halo version on these dark cells.
// acc is a pet accessory id. Silhouettes (mode 's') skip it. Faded pets draw it in grey.
function spriteCanvas(c, sp, stage, mode='n', faded=false, acc=null){
  const g = ctx(c), s = sprSet(sp, stage, faded); g.clearRect(0,0,c.width,c.height); g.drawImage(mode === 'n' && s.u ? s.u : s[mode], 0, 0);
  if (mode !== 's' && acc) drawPetAccessory(g, acc, 0, 0, !!faded);
}

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
function renderMusicRow(){
  const on = !S || S.settings.music !== false, b = $('#setMusic');
  if (!b) return;
  b.setAttribute('aria-pressed', String(on));
  $('#setMusicVal').textContent = on ? 'ON' : 'OFF';
}
function toggleMusic(){
  if (!S) return;
  S.settings.music = S.settings.music === false;
  PPSound.setMusic(S.settings.music, true);
  renderMusicRow(); save(); sfx('tap');
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
  if (overlayOpen() && $('#ovSettings').hidden && allPets().length) return;
  if (!$('#ovSettings').hidden) return;
  clearMoves(); renderSoundRow(); renderMusicRow(); renderFollowerBtn(); renderBuild(); renderDebugGate();
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
  if (name === 'col') {
    if (S && !S.flags['story.journal_opened']) { S.flags['story.journal_opened'] = true; save(); }
    renderCollection();
  }
  if (name === 'friends') { $('#friendCode').textContent = friendCode(); renderKeeperName(); }
  fitAll();
  if (name === 'walk' && !PPEnv.geoPref() && allPets().length) openGeoAsk();     // first Walk visit with a partner: ask about location (once)
}
const overlayOpen = () => !$('#ovBattle').hidden || !$('#ovSheet').hidden || !$('#ovEvolve').hidden || !!scene || !$('#ovBasket').hidden || !$('#ovGeo').hidden || !$('#ovEnv').hidden || !$('#ovStats').hidden || !$('#ovWalkling').hidden || !$('#ovReset').hidden || !$('#ovCopy').hidden || !$('#ovPhone').hidden || !$('#ovLook').hidden || !$('#ovSettings').hidden || !$('#ovBag').hidden || !$('#ovShop').hidden || !$('#ovMap').hidden || !$('#ovJournal').hidden || !$('#ovQuest').hidden || !$('#ovPlay').hidden || !$('#ovDebug').hidden || PPCloud.overlayOpen();

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
function fitAll(){ fitBattle(); if (!$('#ovMap').hidden) fitRegionMap();
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
  document.body.classList.toggle('no-pets', !allPets().length);
  syncBagBtns();
  syncJournalBtn();
  syncQuestBtn();
  syncSide();
  syncWalkTip();
  const p = pet(); $('#hdrLv').parentNode.hidden = !p;       // no "Lv 1" / stars before there's a partner
  if (!p) return;
  const st = SPECIES[spi(p)].stages[p.stage];
  $('#hdrName').textContent = cleanNick(p.nick) || st.name;
  $('#hdrLv').textContent = 'Lv ' + levelOf(p);
  $('#hdrStage').textContent = '\u2605'.repeat(p.stage + 1) + '\u2606'.repeat(2 - p.stage);
  spriteCanvas($('#hdrIcon'), spi(p), p.stage, 'n', isFaded(p), p.accessory);
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
  if (p.stage >= 2) { hint.textContent = 'Fully grown! Keep exploring.'; hint.classList.remove('ready'); btn.hidden = true; }
  else if (isFaded(p)) { hint.textContent = 'Faded: ' + p.faded + ' good-care day' + (p.faded > 1 ? 's' : '') + ' to go (care 60+).'; hint.classList.remove('ready'); btn.hidden = true; }
  else if (canEvolve(p)) { hint.textContent = petName(p) + ' is ready to grow up!'; hint.classList.add('ready'); btn.hidden = false; }
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
  if (helloDue()) return;                    // the hello plays first and calls this when it's done (CARE_LOOP §7 / eng notes §3.9)
  bowlToldDay = d; setTimeout(() => { const q = pet(); if (q && bowlReady() && q.hunger < 98 && !overlayOpen()) toast('A Warm Bowl is ready for ' + petName(q) + '.'); }, ms);
}
function dayKey(ms){ const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
// Local Monday of the week containing ms, as YYYY-MM-DD. High Charity's arena prize uses it.
function weekKey(ms){
  const d = new Date(ms == null ? Date.now() : ms);
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  local.setDate(local.getDate() - ((local.getDay() + 6) % 7));
  return dayKey(local.getTime());
}
/* CARE_LOOP F, cheap slice: the hello of the day. Once per local day (flags['daily.hello'] = dayKey), on the PARTNER tab, queued behind
   everything else: never over a scene, overlay, battle, the starter intro or a toast that's still up (boot notices, colour-back,
   the naming nudge). One of three time-of-day lines (copy table §7; evening covers night in this slice) plus the two-hearts
   balloon; the "!" hides meanwhile. Audio is locked until the first tap, so the chirp waits for that tap. Then the Warm Bowl hint. */
const HELLO_FLAG = 'daily.hello';
const HELLO_LINES = { morning: 'Morning! {pet} stretches and wiggles over to you.', midday: '{pet} perks up. You\'re back!', evening: '{pet} curls up beside you. Long day?' };
const helloSlot = (h = new Date().getHours()) => h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'midday' : 'evening';
const hello = { until: 0, quietUntil: 0, chirp: 0 };
const helloDue = () => !!S && !!pet() && !!S.flags['story.starter_received'] && S.flags[HELLO_FLAG] !== dayKey(Date.now());
function pumpHello(){
  const t = now();
  if (!helloDue() || screen !== 'pet' || overlayOpen() || t < hello.quietUntil || t < anim.busyUntil || $('#toast').classList.contains('show')) return false;
  const p = pet(); S.flags[HELLO_FLAG] = dayKey(Date.now());
  toast(HELLO_LINES[helloSlot()].replace('{pet}', petName(p)));
  const from = queueEmote('emote_hearts', 150, 1600); hello.until = from + 1600;
  if (PPSound.state === 'running') sfx(chirpName(p)); else hello.chirp = Date.now();   // first tap plays it (eng notes §2)
  helloBonus(p); save();
  bowlToldDay = null; setTimeout(() => bowlHint(0), 2000);
  return true;
}
function helloBonus(p){ addBond(p, BOND.hello); }
/* CARE_LOOP E, cheap slice: bond. Stored as points on the Walkling (p.bond, only ever goes up), shown as 5 hearts in the PARTNER
   scene: Bond 1-5 at 0 / 20 / 60 / 120 / 200 points. Only the partner earns it. Sources (eng notes §3.1, Design's defaults):
   first care of the day +3, the hello +1, pats +1 (max 5 a day), each walk find +2, every 100 steps together +1 (max 3 a day),
   a battle won or a befriend it took part in +1 (max 3 a day). One unlock in this slice: at Bond 3 it does a little stretch now
   and then while idle (no battle perk). A bond-up is announced on the PARTNER tab, queued like the hello. */
const BOND = { at: [0, 20, 60, 120, 200], firstCare: 3, hello: 1, pat: 1, patDay: 5, find: 2, steps: 100, stepDay: 3, battle: 1, battleDay: 3, stretchAt: 3 };
const bondPts = p => (p && Number.isFinite(p.bond) && p.bond > 0) ? Math.floor(p.bond) : 0;
const bondLevel = p => BOND.at.filter(v => bondPts(p) >= v).length;     // 1..5
const bondUps = [];                          // pending "closer now" lines: { id, n }
function addBond(p, n){
  if (!p || !S || p.id !== S.partnerId || !(n > 0)) return 0;
  const before = bondLevel(p); p.bond = bondPts(p) + n;
  const after = bondLevel(p); if (after > before) bondUps.push({ id: p.id, n: after });
  return n;
}
function pumpBondUp(){
  if (!bondUps.length || screen !== 'pet' || overlayOpen() || now() < anim.busyUntil || now() < hello.until || now() < hello.quietUntil || $('#toast').classList.contains('show')) return;
  const u = bondUps.shift(), p = petById(u.id); if (!p || p.id !== S.partnerId) return;
  while (bondUps.length && bondUps[0].id === u.id) u.n = Math.max(u.n, bondUps.shift().n);   // two at once: say the latest
  toast('You and ' + petName(p) + ' are closer now. Bond ' + u.n + '!'); queueEmote('emote_hearts', 100, 1600); sfx(chirpName(p)); sfx(chirpName(p), 0.16);
}
const chirpName = p => 'chirp_' + String((SPECIES[spi(p)] || {}).type || 'PLAIN').toLowerCase();
window.addEventListener('pointerup', () => { if (hello.chirp && Date.now() - hello.chirp < 60000) { hello.chirp = 0; const p = pet(); if (p) setTimeout(() => sfx(chirpName(p)), 40); } }, { capture: true, passive: true });
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
  if (to > from && !quiet) { sfx('stinger_levelup', xpChimeDelay); toast(petName(p) + ' reached Lv ' + to + '!'); }
  return { gained: p.bx - before, from, to };
}
const grantCareXp = (p, n) => grantCapped(p, 'cx', CARE_XP_DAILY_CAP, n);
// Explore XP (walking + befriending). Shows the one-time "explored enough" toast when the cap is reached.
function grantExploreXp(p, n){
  const g = grantCapped(p, 'ex', EXPLORE_XP_DAILY_CAP, n), r = exploreXpToday(p);
  if (r.xp >= EXPLORE_XP_DAILY_CAP && !r.told) { r.told = true; const msg = petName(p) + ' has explored enough for today. Rest up!';
    if (findStep) setTimeout(() => { sfx('cap'); toast(msg); }, 1900); else { sfx('cap', xpChimeDelay + 0.3); toast(msg); } }
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
const anim = { busyUntil: 0, jumpUntil: 0, sleepUntil: 0, parts: [], emotes: [] };
/* CARE_LOOP plumbing (§7 build order): a small emote queue over the partner on the PARTNER tab. Each balloon waits for the one
   before it, so the Warm Bowl, the hello and (later) bond-ups never draw on top of each other. */
function queueEmote(glyph, delayMs = 0, durMs = 1500){
  const t = now(), last = anim.emotes.reduce((m, e) => Math.max(m, e.until), 0);
  const from = Math.max(t + delayMs, last + 120); anim.emotes.push({ glyph, from, until: from + durMs }); return from;
}
const emoteNow = t => anim.emotes.find(e => t >= e.from && t < e.until) || null;
// Per-day record helper: obj[k] = { d: dayKey, ...init } for today (fresh on a new local day, or if missing/broken).
function dayRec(obj, k, init){
  const d = dayKey(Date.now());
  if (!obj[k] || typeof obj[k] !== 'object' || obj[k].d !== d) obj[k] = Object.assign({ d }, init);
  return obj[k];
}
const careDay = () => {
  const c = dayRec(S, 'care', { steps: 0, finds: 0, stepBond: 0, battleBond: 0, firstCare: false, minigameBond: 0, mg: { lantern: 0, shells: 0, chirp: 0, dash: 0, pairs: 0, hop: 0, relay: 0, seek: 0 } });
  if (!Number.isInteger(c.minigameBond) || c.minigameBond < 0) c.minigameBond = 0;
  if (c.minigameBond > 3) c.minigameBond = 3;
  const ids = ['lantern', 'shells', 'chirp', 'dash', 'pairs', 'hop', 'relay', 'seek'];
  if (!c.mg || typeof c.mg !== 'object' || Array.isArray(c.mg)) c.mg = {};
  for (const id of ids) { const n = c.mg[id]; c.mg[id] = Number.isInteger(n) && n > 0 ? Math.min(3, n) : 0; }
  for (const k of Object.keys(c.mg)) if (!ids.includes(k)) delete c.mg[k];
  return c;
};
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
    if (bowl) { S.flags[BOWL.flag] = dayKey(Date.now()); queueEmote('emote_hearts', 600, 1500); }   // two-hearts balloon (ICONS_SEALS Q6), on the emote queue
    addPart('apple', pp.x + 6, pp.y - 4, 0, 4, 0.9);
    setTimeout(() => { for (let i=0;i<(bowl ? 4 : 3);i++) addPart('heart', pp.x + 2 + i*5, pp.y, (i-1)*4, -10); }, 600);
    anim.busyUntil = t + (bowl ? 1500 : 1100); msg = bowl ? 'Warm Bowl! ' + petName(p) + ' gobbles it up. +FOOD +JOY' : 'Yum! +FOOD';
  } else if (act === 'play') {
    if (isFainted(p)) { sfx('denied'); return toast(petName(p) + ' is worn out and needs rest. REST, or wait ' + faintMinLeft(p) + 'm.'); }   // BATTLE §7.2
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
  const cday = careDay(); if (!cday.firstCare) { cday.firstCare = true; addBond(p, BOND.firstCare); }   // bond: first care of the day
  sfx(act); xpChimeDelay = 0.45;
  const xp = grantCareXp(p, CARE_XP[act]), cx = careXpToday(p); xpChimeDelay = 0;
  if (cx.xp >= CARE_XP_DAILY_CAP && !cx.told) { cx.told = true; sfx('cap', 0.6); if (!msg.startsWith('Warm Bowl')) msg = petName(p) + ' learned all it can from care today. Go for a walk!'; }
  else if (act === 'play' && xp) msg += ' +' + xp + 'XP';
  const careKey = 'story.care_' + act;
  if (!S.flags[careKey]) {
    S.flags[careKey] = true;
    const nm = petName(p);
    if (!String(msg).startsWith('Warm Bowl') && !(cx.xp >= CARE_XP_DAILY_CAP)) {
      msg = act === 'feed' ? nm + ' crunches the first bite and looks up at you.'
        : act === 'play' ? nm + ' bounces in a little circle. First game!'
        : nm + ' curls up for the first nap with you.';
    }
    queueEmote(act === 'rest' ? 'emote_sleep' : 'emote_heart', act === 'rest' ? 200 : 500);
  }
  toast(msg);
  updateHUD(); save();
}

/* CARE_LOOP A, cheap slice: tap to pat and tickle (no rub zones). Tap the partner on the PARTNER tab: a happy squint, a chirp
   pitched by type, a heart, +1 JOY (flat, max +10 a day, no care XP). 4 taps within 1.5 s = a tickle (giggle + roll). 10 touches
   within 10 s = it hops away for 3 s and ignores taps. Asleep (REST) or napping after a faint: a sleepy grumble, no JOY.
   Pats never set anim.busyUntil, so FEED/PLAY taps are never swallowed. The hit box is the sprite padded to >= 44 CSS px. */
const PAT = { joyDay: 10, tickleN: 4, tickleMs: 1500, huffN: 10, huffMs: 10000, awayMs: 3000, hitCss: 44 };
const touch = { taps: [], squintUntil: 0, rollFrom: 0, rollUntil: 0, awayFrom: 0, awayUntil: 0, lastMsg: '' };
const patRec = p => dayRec(p, 'pat', { n: 0, joy: 0, bond: 0 });
function patBond(p, r){ if (r.bond < BOND.patDay) { r.bond++; addBond(p, BOND.pat); } }
function petHit(cx, cy){
  const c = $('#petCanvas'), r = c.getBoundingClientRect(), k = r.width / c.width, t = now();
  if (t < touch.awayUntil) return false;
  const pp = petPos(t < anim.sleepUntil ? anim.sleepUntil : t), mx = r.left + (pp.x + 8) * k, my = r.top + (pp.y + 8) * k;
  const half = Math.max(8 * k + 4, PAT.hitCss / 2);
  return Math.abs(cx - mx) <= half && Math.abs(cy - my) <= half;
}
function patPet(){
  const p = pet(), t = now(); if (!p || t < touch.awayUntil) return;
  hello.chirp = 0;                            // this tap's own chirp stands in for the hello's waiting one
  touch.taps = touch.taps.filter(x => t - x < PAT.huffMs); touch.taps.push(t);
  const pp = petPos(t), name = petName(p);
  if (t < anim.sleepUntil || isFainted(p)) { sfx('denied'); return say(name + ' mumbles and keeps napping.'); }
  if (touch.taps.length >= PAT.huffN) {           // too many: it hops away for a moment, then comes back
    touch.taps = []; touch.awayFrom = t; touch.awayUntil = t + PAT.awayMs; sfx(chirpName(p), 0); return say(name + ' hops away for a moment.');
  }
  const r = patRec(p); r.n++;
  if (r.joy < PAT.joyDay) { r.joy++; p.happy = clamp(p.happy + 1, 0, 100); }
  patBond(p, r);
  const recent = touch.taps.filter(x => t - x <= PAT.tickleMs).length;
  if (recent >= PAT.tickleN && t >= touch.rollUntil) {   // tickle fit: giggle + a roll
    touch.rollFrom = t; touch.rollUntil = t + 800; touch.squintUntil = t + 900;
    sfx(chirpName(p)); sfx(chirpName(p), 0.14);
    for (let i = 0; i < 3; i++) addPart(i % 2 ? 'spark' : 'heart', pp.x + 2 + i * 5, pp.y, (i - 1) * 6, -12);
    say(name + ' giggles and rolls over!');
  } else {
    touch.squintUntil = t + 500; sfx(chirpName(p));
    addPart('heart', pp.x + 6, pp.y - 2, 0, -10, 0.9);
    if (t >= touch.rollUntil) say(name + ' leans into the pat.');
  }
  updateHUD(); save();
  function say(m){ if (touch.lastMsg !== m || !$('#toast').classList.contains('show')) toast(m); touch.lastMsg = m; }
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
  const away = t < touch.awayUntil;               // hopped away after too many pats: off to the side, little hops, then back
  if (away) { const k = Math.min(1, (t - touch.awayFrom) / 300, (touch.awayUntil - t) / 300); x += Math.round((x < W / 2 ? 18 : -18) * k); bob = -Math.round(Math.abs(Math.sin(t / 140)) * 3); }
  if (t < anim.jumpUntil) bob = -Math.round(Math.abs(Math.sin((anim.jumpUntil - t) / 1200 * Math.PI * 3)) * 7);
  if (sleeping) bob = 0;
  g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(x + 3, y + 17, 12, 2);
  const blink = sleeping || (t % 3200) < 140 || t < touch.squintUntil;   // a pat: happy squint (the blink frame)
  const img = petSpr(p)[blink ? 'b' : 'n'];
  const stT = bondLevel(p) >= BOND.stretchAt && !sleeping && !away && t >= anim.busyUntil && t >= touch.rollUntil ? (t + 5000) % 14000 : -1;   // Bond 3: a stretch every 14 s
  anim.stretching = stT >= 0 && stT < 700;
  if (anim.stretching) {                       // long and low (eyes shut), then a tall reach, then back
    if (stT < 420) g.drawImage(petSpr(p).b, x - 2, y + bob + 3, 20, 13); else g.drawImage(img, x, y + bob - 2, 16, 18);
  } else if (t < touch.rollUntil) {                       // tickle roll: four crisp quarter turns
    const q = Math.min(3, Math.floor((t - touch.rollFrom) / 200));
    g.save(); g.translate(x + 8, y + bob + 8); g.rotate(q * Math.PI / 2); g.drawImage(img, -8, -8); g.restore();
  } else { g.drawImage(img, x, y + bob); if (p.accessory) drawPetAccessory(g, p.accessory, x, y + bob, isFaded(p)); }
  anim.bangOn = !sleeping && t >= hello.until && (p.hunger < 25 || p.happy < 25 || p.energy < 25);   // (debug hook reads it)
  if (anim.bangOn && Math.floor(t/500)%2) drawGlyph(g, 'bang', x + 16, y - 2);   // the "!" hides while the hello plays (CARE_LOOP §7)
  if (sparkle.id === p.id && now() < sparkle.until) for (let i = 0; i < 3; i++) if (Math.floor(t / 180 + i) % 3 === 0) drawGlyph(g, 'spark', x - 2 + i * 8, y - 3 + (i % 2) * 6);   // colour back (§5)
  drawWeather(g, W, H, t, 0.18);                   // same night/fog/rain/storm/snow tint as the Walk map
  if (sleeping) {
    g.fillStyle = 'rgba(41,54,111,.55)'; g.fillRect(0, 0, W, H);
    g.fillStyle = PAL.w; g.fillRect(8, 5, 4, 4); g.fillStyle = PAL.k; g.fillRect(10, 5, 2, 2);
    if (Math.random() < dt * 2.5) addPart('z', x + 12, y, 3, -6, 1.4);
  }
  drawParticles(g, dt);
  const lv = bondLevel(p), hx = Math.round(W / 2) - 14;   // bond: 5 small hearts, top centre (between STATS and the keeper badge)
  for (let i = 0; i < 5; i++) { const gl = GLYPH.heart; for (let j = 0; j < gl.length; j++) for (let k = 0; k < 5; k++) if (gl[j][k] !== '.') { g.fillStyle = i < lv ? PAL.r : PAL.k; g.globalAlpha = i < lv ? 1 : 0.35; g.fillRect(hx + i * 6 + k, 2 + j, 1, 1); } }
  g.globalAlpha = 1;
  if (c.dataset.bond !== String(lv)) { c.dataset.bond = String(lv); c.setAttribute('role', 'img'); c.setAttribute('aria-label', petName(p) + ', bond ' + lv + ' of 5'); }
  const em = emoteNow(t); if (em) drawGlyph(g, em.glyph, x + 5, Math.max(0, y + bob - 13));   // queued balloon (Warm Bowl, hello) over the particles (ICONS_SEALS Q6)
  if (anim.emotes.length && t > anim.emotes[anim.emotes.length - 1].until) anim.emotes = [];
}

/* ---------- maps, objects, conditions (MAPS_SLICE Phase M + INTERIORS + ACT1_ROUTE2 + COBBLECREST) ---------- */
// Verbatim JSON via data/mapdata.js. Merge order matches the checkers: maps_slice, interiors slicePatch,
// act1_route2 slicePatch then its maps, interiors rooms, cobblecrest route2Patch then its maps and rooms.
const MD = MAPDATA, TS = 16;
const TILE_DEF = Object.assign({}, MD.maps_slice.tiles, MD.interiors.tiles, (MD.cobblecrest && MD.cobblecrest.tiles) || {}, (MD.cobblecrest && MD.cobblecrest.roomTiles) || {}, (MD.highcharity && MD.highcharity.tiles) || {});
function applyMapPatch(W, patch){
  if (!patch || !patch.maps) return;
  for (const [id, pt] of Object.entries(patch.maps)) {
    const m = W[id]; if (!m) continue;
    if (pt.set) Object.assign(m, JSON.parse(JSON.stringify(pt.set)));
    if (pt.gridRows) for (const [y, row] of Object.entries(pt.gridRows)) m.grid[+y] = row;
    for (const o of pt.replaceObjs || []) {
      const copy = JSON.parse(JSON.stringify(o)), k = m.objs.findIndex(x => x.id === o.id);
      if (k >= 0) m.objs[k] = copy; else m.objs.push(copy);
    }
    for (const o of pt.addObjs || []) m.objs.push(JSON.parse(JSON.stringify(o)));
  }
}
const WORLD = (() => {
  const W = JSON.parse(JSON.stringify(MD.maps_slice.maps));
  applyMapPatch(W, MD.interiors.slicePatch);
  if (MD.act1_route2) { applyMapPatch(W, MD.act1_route2.slicePatch); Object.assign(W, JSON.parse(JSON.stringify(MD.act1_route2.maps))); }
  Object.assign(W, JSON.parse(JSON.stringify(MD.interiors.maps)));
  // INVENTORY §5: the Travel Shelf at (6,2) in the Lantern House (data copies stay verbatim, so it's added here).
  if (W.hm_lantern_in && !W.hm_lantern_in.objs.some(o => o.id === 'travel_shelf'))
    W.hm_lantern_in.objs.push({ kind: 'prop', id: 'travel_shelf', x: 6, y: 2, sprite: 'travel_shelf', name: 'the Travel Shelf',
      shop: ['heal_snack', 'hearty_snack', 'wake_tonic', 'befriend_treat', 'energy_sip', 'joy_crumb'], lines: { else: 'Travel Shelf · Leave Acorns, take a snack. — I.' } });
  if (MD.cobblecrest) {
    applyMapPatch(W, MD.cobblecrest.route2Patch);
    Object.assign(W, JSON.parse(JSON.stringify(MD.cobblecrest.maps)));
    Object.assign(W, JSON.parse(JSON.stringify(MD.cobblecrest.rooms)));
  }
  if (MD.glimmer_path) applyMapPatch(W, MD.glimmer_path.slicePatch);   // WP-B: the faction fork (ours, objects only, no new maps)
  if (MD.mahopac) { applyMapPatch(W, MD.mahopac.slicePatch); Object.assign(W, JSON.parse(JSON.stringify(MD.mahopac.maps))); }
  if (MD.highcharity) {
    applyMapPatch(W, MD.highcharity.slicePatch);
    Object.assign(W, JSON.parse(JSON.stringify(MD.highcharity.maps)));
    Object.assign(W, JSON.parse(JSON.stringify(MD.highcharity.rooms)));
  }
  if (MD.heights) {                                                    // Fernbrook Heights: new maps plus the north gap on Fernbrook
    Object.assign(W, JSON.parse(JSON.stringify(MD.heights.maps)));
    applyMapPatch(W, MD.heights.slicePatch);
  }
  if (MD.civic) {                                                      // Keeper House, officers, the Route 1 phone
    Object.assign(W, JSON.parse(JSON.stringify(MD.civic.maps)));
    applyMapPatch(W, MD.civic.slicePatch);
  }
  if (MD.town_board) applyMapPatch(W, MD.town_board.slicePatch);       // town boards last: squares, then the posts
  for (const [id, m] of Object.entries(W)) { m.id = id; m.cells = m.grid.map(r => r.split('')); }
  return W;
})();
const SCENES = Object.assign({}, MD.maps_slice.scenes, MD.interiors.scenes);
if (MD.act1_route2) Object.assign(SCENES, MD.act1_route2.slicePatch.scenes || {}, MD.act1_route2.scenes);
if (MD.cobblecrest) Object.assign(SCENES, MD.cobblecrest.route2Patch.scenes || {}, MD.cobblecrest.scenes);
if (MD.glimmer_path) Object.assign(SCENES, MD.glimmer_path.scenes || {});
if (MD.mahopac) Object.assign(SCENES, MD.mahopac.scenes || {});
if (MD.highcharity) Object.assign(SCENES, MD.highcharity.scenes || {});
if (MD.heights) Object.assign(SCENES, MD.heights.scenes || {});
if (MD.civic) Object.assign(SCENES, MD.civic.scenes || {});
for (const src of [MD.maps_slice, MD.act1_route2, MD.cobblecrest, MD.glimmer_path, MD.mahopac, MD.highcharity, MD.heights, MD.civic]) if (src && src.trainers) for (const [id, t] of Object.entries(src.trainers)) TRAINERS[id] = Object.assign({}, TRAINERS[id] || {}, t);
if (TRAINERS.hall1_fen) Object.assign(TRAINERS.hall1_fen, { map: 'fernbrook', x: 22, y: 6, facing: 'down', sight: 0, onWin: 'seal1' });
// WP-B0 (NEXT_PLAN engine asks 1-2): the faction pledge. `story.side` absent = keepers, so every older save plays as before.
// A scene `X@glimmer` runs instead of `X`, and a trainer `id@glimmer` is merged over `id` (lines merged too), while the side is glimmer.
// The design JSON stays verbatim: variants live in data/glimmer_path.json. Objects use `when: ["story.side=glimmer"]` as usual.
const SIDE_DEFAULT = 'keepers';
const TRAINERS_BASE = {}; for (const [id, t] of Object.entries(TRAINERS)) if (!id.includes('@')) TRAINERS_BASE[id] = t;
// Glimmerwell is the company faction. A Keeper hears them as the dark side: first meeting and their battles use the sinister loops.
const FACTION = { fern_associate: 'glimmer', r2_associate: 'glimmer', r2_lead: 'glimmer', rival2_rook: 'glimmer', hall1_fen: 'keepers', hall2_hale: 'keepers' };
for (const [id, f] of Object.entries(FACTION)) if (TRAINERS_BASE[id]) TRAINERS_BASE[id].faction = f;
function trainerFaction(id){ const t = TRAINERS_BASE[id] || TRAINERS[id]; return (t && t.faction) || null; }
function side(){ if (!S) return SIDE_DEFAULT; const v = flagOf('story.side', true); return v === 'glimmer' ? 'glimmer' : SIDE_DEFAULT; }
// The first trial (Keepers Hall, or the glimmer Tour's hall panel) waits on Fernbrook Heights, unless this save already earned Seal 1.
function trialReady(){
  if (!S) return false;
  if (S.flags['story.heights_done'] || S.flags['story.seal1']) return true;
  if (S.seals && (S.seals.seal_fernbrook || S.seals.seal_glim_1)) return true;
  // A save that never picked a side already missed the gate (it closes once the orchard is open).
  return !S.flags['story.side_pick_done'];
}
const sceneSteps = id => {
  if (id === 'lantern_rest') return lanternBedSteps();   // runtime: the whole party, and a few Acorns when someone is hurt
  const s = side(); return (s !== SIDE_DEFAULT && SCENES[id + '@' + s]) || SCENES[id];
};
let sideApplied = null;
function syncSide(){                                   // cheap; called every frame and before a battle inside a scene
  const s = side(); if (s === sideApplied) return; sideApplied = s;
  for (const [id, base] of Object.entries(TRAINERS_BASE)) {
    const ov = s !== SIDE_DEFAULT ? TRAINERS[id + '@' + s] : null;
    TRAINERS[id] = ov ? Object.assign({}, base, ov, { lines: Object.assign({}, base.lines || {}, ov.lines || {}) }) : base;
  }
}
// A story beat = a scene that writes a story.* flag. When one finishes, `story.beat.<id>` records which side played it
// (first play wins), so later scenes can add a catch-up line after a switch without back-filling old saves.
const beatCache = {};
function isBeat(id){
  if (id in beatCache) return beatCache[id];
  const walk = n => Array.isArray(n) && ((n[0] === 'setFlag' && typeof n[1] === 'string' && n[1].startsWith('story.')) || n.some(walk));
  return (beatCache[id] = Object.keys(SCENES).some(k => (k === id || k.startsWith(id + '@')) && walk(SCENES[k])));
}
// Recorded only when this run actually wrote a story.* flag (a "Think about it" exit from side_pick is not a played beat).
const storyWrites = () => scene ? Object.keys(scene.view.flags).filter(k => k.startsWith('story.')).length : 0;
function noteBeat(id, before){ if (!scene || !isBeat(id) || storyWrites() <= before) return; const k = 'story.beat.' + id, s = side(); pend(() => { if (!S.flags[k]) S.flags[k] = s; }); }
// Dev check for data/glimmer_path.json (engine ask 7): the line rules the design checker applies (lineMax after the longest
// token values, no double space, no unknown token), every `X@side` variant has a base `X`, a variant scene writes the same
// story.* flags as its base (the gates stay shared), and objects/steps point at scenes that exist. Returns problems (empty = pass).
function glimmerDevCheck(){
  const G = MD.glimmer_path, bad = []; if (!G) return bad;
  const dl = MD.interiors.dialog, MAX = dl.lineMax || 110, TOK = dl.tokenLen || {};
  const story = steps => { const out = new Set(), walk = n => { if (!Array.isArray(n)) return; if (n[0] === 'setFlag' && typeof n[1] === 'string' && n[1].startsWith('story.')) out.add(n[1]); n.forEach(walk); }; walk(steps); return out; };
  const line = (where, s) => {
    if (typeof s !== 'string') return;
    const long = s.replace(/\{(\w+)\}/g, (m, k) => { if (!(k in TOK)) { bad.push(where + ': unknown token ' + m); return ''; } return 'x'.repeat(TOK[k]); });
    if (/  /.test(s)) bad.push(where + ': double space');
    if (Array.from(long).length > MAX) bad.push(where + ': over ' + MAX + ' after tokens (' + Array.from(long).length + ')');
  };
  const walkSteps = (where, n) => { if (!Array.isArray(n)) return;
    if (n[0] === 'say') line(where, n[2]);
    else if (n[0] === 'choice') {
      line(where, n[1]);
      for (const o of n[2] || []) {
        line(where, o[0]);
        if (typeof o[0] === 'string' && Array.from(o[0]).length > 30) bad.push(where + ': choice label over 30 (' + Array.from(o[0]).length + ')');
        walkSteps(where, o[1]);
      }
      return;
    }
    else if (n[0] === 'run' && !SCENES[n[1]]) bad.push(where + ': run of unknown scene ' + n[1]);
    else if (n[0] === 'battle' && !TRAINERS[n[1]]) bad.push(where + ': battle with unknown trainer ' + n[1]);
    else if (n[0] === 'seal' && !SEAL_ART[n[1]]) bad.push(where + ': unknown seal ' + n[1]);
    n.forEach(x => walkSteps(where, x)); };
  for (const [id, steps] of Object.entries(G.scenes || {})) {
    walkSteps('scene ' + id, steps);
    const at = id.indexOf('@'); if (at < 0) continue;
    const base = SCENES[id.slice(0, at)]; if (!base) { bad.push('scene ' + id + ': no base scene'); continue; }
    const want = story(base), got = story(steps); for (const f of want) if (!got.has(f)) bad.push('scene ' + id + ': does not set ' + f);
  }
  for (const [id, t] of Object.entries(G.trainers || {})) {
    const at = id.indexOf('@'); if (at >= 0 && !TRAINERS_BASE[id.slice(0, at)]) bad.push('trainer ' + id + ': no base trainer');
    for (const [k, v] of Object.entries(t.lines || {})) line('trainer ' + id + '.' + k, v);
    for (const [k, v] of Object.entries(t.panel || {})) if (k !== 'who') line('trainer ' + id + '.panel.' + k, v);
  }
  for (const [mid, pt] of Object.entries((G.slicePatch && G.slicePatch.maps) || {})) {
    if (!WORLD[mid]) { bad.push('patch of unknown map ' + mid); continue; }
    for (const o of [].concat(pt.addObjs || [], pt.replaceObjs || [])) {
      if (o.scene && !SCENES[o.scene]) bad.push('obj ' + o.id + ': unknown scene ' + o.scene);
      for (const v of Object.values(o.lines || {})) line('obj ' + o.id, v);
      if (o.text) line('obj ' + o.id, o.text);
    }
  }
  // Ambient lines and the gate walk-away toasts are chatter-sized (<= 40), on top of the 110-character say rule.
  const shortLine = (where, s) => { line(where, s); if (typeof s === 'string' && Array.from(s).length > 40) bad.push(where + ': over 40 (' + Array.from(s).length + ')'); };
  for (const [id, bag] of Object.entries(G.lines || {})) {
    if (!bag || typeof bag !== 'object') continue;
    for (const [k, v] of Object.entries(bag)) if (typeof v === 'string') shortLine('lines.' + id + '.' + k, v);
  }
  (G.walkAway || []).forEach((s, i) => shortLine('walkAway ' + i, s));
  // BS: `["standing", side, n|null, oneShotId]` steps name a real side, and a null amount names a grant in STANDING_CFG.grants.
  const walkStanding = (where, n) => { if (!Array.isArray(n)) return;
    if (n[0] === 'standing') { if (!PPStanding.isSide(n[1])) bad.push(where + ': standing step with unknown side ' + n[1]);
      if (n[2] == null && !(n[3] in STANDING_CFG.grants)) bad.push(where + ': standing step needs an amount or a known grant id (' + n[3] + ')'); }
    n.forEach(x => walkStanding(where, x)); };
  for (const [id, steps] of Object.entries(SCENES)) walkStanding('scene ' + id, steps);
  const loy = G.loyalty || {};
  const condKey = c => {
    if (typeof c !== 'string' || !c) return false;
    return c.split('&').every(part => {
      if (!part || part === 'else' || part === 'talked' || part === 'has:name') return !!part;
      const s = part[0] === '!' ? part.slice(1) : part;
      return s === 'talked' || s === 'has:name' || s.startsWith('seal:') || /^(standing\.(keepers|glimmer)|[A-Za-z0-9_.]+)(>=|<=|>|<|=).+$/.test(s) || /^[A-Za-z0-9_.]+$/.test(s);
    });
  };
  for (const [id, bag] of Object.entries(loy.npcs || {})) {
    if (!bag || typeof bag !== 'object' || id.startsWith('_')) continue;
    for (const [k, v] of Object.entries(bag)) {
      if (typeof v !== 'string') continue;
      if (!condKey(k)) bad.push('loyalty.npcs.' + id + ': bad condition ' + k);
      shortLine('loyalty.npcs.' + id + '.' + k, v);
    }
  }
  for (const [id, keys] of Object.entries(loy.trainers || {})) {
    if (id.startsWith('_')) continue;
    if (!TRAINERS_BASE[id] && !TRAINERS[id]) bad.push('loyalty trainer ' + id + ': unknown');
    for (const [key, bag] of Object.entries(keys || {})) {
      if (key.startsWith('_') || !bag || typeof bag !== 'object') continue;
      for (const [c, v] of Object.entries(bag)) if (typeof v === 'string') {
        if (!condKey(c)) bad.push('loyalty.trainers.' + id + '.' + key + ': bad condition ' + c);
        line('loyalty.trainers.' + id + '.' + key + '.' + c, v);
      }
    }
  }
  for (const [id, steps] of Object.entries(loy.preface || {})) {
    if (id.startsWith('_')) continue;
    if (!SCENES[id]) bad.push('loyalty preface of unknown scene ' + id);
    walkSteps('loyalty.preface.' + id, steps);
  }
  return bad;
}
// Fernbrook Heights: line length on our scenes, and every group trainer fields two Walklings.
function heightsDevCheck(){
  const H = MD.heights, bad = []; if (!H) return bad;
  const dl = MD.interiors.dialog, MAX = dl.lineMax || 110;
  const walk = (where, n) => {
    if (!Array.isArray(n)) return;
    if (n[0] === 'say' && typeof n[2] === 'string') {
      if (/  /.test(n[2])) bad.push(where + ': double space');
      if (Array.from(n[2]).length > MAX) bad.push(where + ': over ' + MAX);
    }
    if (n[0] === 'battle' && !TRAINERS[n[1]]) bad.push(where + ': unknown trainer ' + n[1]);
    n.forEach(x => walk(where, x));
  };
  for (const [id, steps] of Object.entries(H.scenes || {})) walk('scene ' + id, steps);
  for (const [id, t] of Object.entries(H.trainers || {})) {
    if (t.group && (!t.team || t.team.length < 2)) bad.push('trainer ' + id + ': a group battle needs two Walklings');
    if (t.ally && !TRAINERS[t.ally]) bad.push('trainer ' + id + ': missing ally ' + t.ally);
    for (const [k, v] of Object.entries(t.lines || {})) if (typeof v === 'string' && Array.from(v).length > MAX) bad.push('trainer ' + id + '.' + k + ': over ' + MAX);
  }
  const base = new Set(), glim = new Set();
  const grab = (steps, into) => { const w = n => { if (!Array.isArray(n)) return; if (n[0] === 'setFlag' && typeof n[1] === 'string' && n[1].startsWith('story.')) into.add(n[1]); n.forEach(w); }; w(steps); };
  grab(H.scenes.know_us, base); grab(H.scenes['know_us@glimmer'], glim);
  for (const f of base) if (!glim.has(f)) bad.push('know_us@glimmer does not set ' + f);
  return bad;
}
/* ---------- Standing (GLIMMER_PATH v0.2 BS; every name and number comes from STANDING_CFG in standing.js) ---------- */
// S.standing = { keepers, glimmer } (save.js clamps it on load). Writes go through setStanding() so the tier-up toast fires
// once per tier reached (`standing.top.<side>` remembers the highest tier toasted). Inside a scene the `standing` step is
// buffered like setFlag: scene.view.standing holds the live value for cond() until the scene commits.
const SC_STANDING = STANDING_CFG;
function standingOf(sd, live){
  if (live && scene && scene.view.standing && sd in scene.view.standing) return scene.view.standing[sd];
  return S && S.standing ? (S.standing[sd] | 0) : 0;
}
function setStanding(sd, pts){
  if (!PPStanding.isSide(sd)) return null;
  if (!S.standing || typeof S.standing !== 'object') S.standing = { keepers: 0, glimmer: 0 };
  const before = S.standing[sd] | 0, after = PPStanding.clampPts(pts);
  S.standing[sd] = after;
  const t1 = PPStanding.tierOf(after), topKey = 'standing.top.' + sd;
  if (t1 > PPStanding.tierOf(before) && t1 > (+S.flags[topKey] || 0)) {
    S.flags[topKey] = t1;
    const msg = PPStanding.tierInfo(sd, after).toast;
    if (scene) scene.toasts.push(msg); else toast(msg);
  }
  return after;
}
const addStanding = (sd, n) => setStanding(sd, standingOf(sd, false) + (Number(n) || 0));
// The pledge changes (Q3 default): the side you leave keeps floor(n / costDiv), the side you join is unchanged, story.side
// is rewritten, story.switches counts, story.switch_chapter / story.switch_at record when (the per-chapter cooldown).
// `free` skips the cost. Vincent (Oct 13, 2026) settled R5 without a follow-or-stay fork: on the Keepers path Rook
// eventually converts to good, and on the Glimmerwell path he stays with Glimmerwell. That beat is not in this build.
// Never touches seals, lanyards, progression flags, story.rook_bond or story.beat.*.
function switchSide(to, opts){
  if (!PPStanding.isSide(to)) return false;
  const from = S.flags['story.side'] === 'glimmer' ? 'glimmer' : SIDE_DEFAULT;   // the saved pledge (a scene's live view may already say `to`)
  if (to === from) return false;
  if (!(opts && opts.free)) setStanding(from, PPStanding.switchCost(standingOf(from, false)));
  S.flags['story.side'] = to;
  if (to === 'glimmer') ensureCrackedPhone();
  S.flags['story.switches'] = (+S.flags['story.switches'] || 0) + 1;
  S.flags['story.switch_chapter'] = PPStanding.chapterOf(S.flags);
  S.flags['story.switch_at'] = Date.now();
  syncSide(); save();
  return true;
}
const standingView = () => { const out = {}; for (const sd of PPStanding.SIDES) { const i = PPStanding.tierInfo(sd, standingOf(sd, false)); out[sd] = { points: i.points, tier: i.tier, name: i.name }; }
  return Object.assign(out, { side: side(), switches: +S.flags['story.switches'] || 0, chapter: PPStanding.chapterOf(S.flags), canSwitch: PPStanding.canSwitch(S.flags, S.standing, side(), null).ok && !scene && !(battle && battle.on) }); };
// Pledge desks (Q3 default): an option on an existing NPC panel, only after the side pick, never mid-scene or mid-battle,
// and only where it would be a switch. The steps are built when the panel opens so the cost line shows live numbers.
const deskOpen = to => !!(S && S.flags['story.side_pick_done'] && PPStanding.isSide(to) && side() !== to && !scene && !(battle && battle.on));
function pledgeDeskSteps(to){
  const W = SC_STANDING.switch, from = side(), who = W.desks[to].who, F = SC_STANDING.sides;
  const can = PPStanding.canSwitch(S.flags, S.standing, from, to);
  if (!can.ok) return [['say', who, W.refused]];
  const pts = standingOf(from, false);
  const costLine = PPStanding.fill(W.costLine, { side: F[from].short, from: pts, to: PPStanding.switchCost(pts) });
  return [['say', '', W.letter[to]],
    ['choice', W.confirm + ' ' + costLine, [
      [W.yes, [['pledge', to], ['say', '', W.review[from]], ['say', who, W.welcome[to]]]],
      [W.no, [['say', who, W.wait]]]]]];
}
const NPC_LOOKS = Object.assign({}, KEEPER_SWAPS, MD.interiors.looks);
if (MD.act1_route2 && MD.act1_route2.looks) for (const [k, v] of Object.entries(MD.act1_route2.looks)) if (!k.startsWith('_')) NPC_LOOKS[k] = v;
NPC_LOOKS.regenx = { skin: '2', hair: 'bun', hairCol: 's', outfit: 'coat', outfitCol: 'w', accent: 'c' };
if (MD.cobblecrest && MD.cobblecrest.looks) for (const [k, v] of Object.entries(MD.cobblecrest.looks)) if (!k.startsWith('_')) NPC_LOOKS[k] = v;
if (MD.mahopac && MD.mahopac.looks) for (const [k, v] of Object.entries(MD.mahopac.looks)) if (!k.startsWith('_')) NPC_LOOKS[k] = v;
const LOOK_OF_NAME = Object.assign({ 'Hattie': 'villager', 'Odile': 'villager', 'Keeper Amos': 'villager', 'Associate Juniper': 'associate', 'Master Fen': 'fen',
  'Warden Ilse': 'ilse', 'Rook': 'rook', 'Mrs. Calloway': 'calloway', 'Tobin': 'associate', 'Fen': 'fen' }, MD.interiors.dialog.speakers, (MD.cobblecrest && MD.cobblecrest.speakers) || {});
if (NPC_LOOKS.hale) LOOK_OF_NAME.Hale = LOOK_OF_NAME.Hale || 'hale';
if (MD.act1_route2 && MD.act1_route2.speakers) for (const [k, v] of Object.entries(MD.act1_route2.speakers)) if (typeof v === 'string') LOOK_OF_NAME[k] = v;
if (MD.glimmer_path && MD.glimmer_path.speakers) for (const [k, v] of Object.entries(MD.glimmer_path.speakers)) if (typeof v === 'string' && !LOOK_OF_NAME[k]) LOOK_OF_NAME[k] = v;
if (MD.mahopac && MD.mahopac.speakers) for (const [k, v] of Object.entries(MD.mahopac.speakers)) if (typeof v === 'string') LOOK_OF_NAME[k] = v;
if (MD.highcharity && MD.highcharity.looks) for (const [k, v] of Object.entries(MD.highcharity.looks)) if (!k.startsWith('_')) NPC_LOOKS[k] = v;
if (MD.highcharity && MD.highcharity.speakers) for (const [k, v] of Object.entries(MD.highcharity.speakers)) if (typeof v === 'string') LOOK_OF_NAME[k] = v;
if (MD.civic && MD.civic.looks) for (const [k, v] of Object.entries(MD.civic.looks)) if (v && typeof v === 'object') NPC_LOOKS[k] = v;
if (MD.civic && MD.civic.speakers) for (const [k, v] of Object.entries(MD.civic.speakers)) if (typeof v === 'string') LOOK_OF_NAME[k] = v;
if (MD.heights && MD.heights.looks) for (const [k, v] of Object.entries(MD.heights.looks)) if (v && typeof v === 'object' && !k.startsWith('_')) NPC_LOOKS[k] = v;
if (MD.heights && MD.heights.speakers) for (const [k, v] of Object.entries(MD.heights.speakers)) if (typeof v === 'string') LOOK_OF_NAME[k] = v;
// Ilse's lodge chat grows three optional rows. The design JSON stays verbatim; the letter is High Charity's side quest.
(function wireIlseLetter(){
  const steps = SCENES.ilse_chat; if (!steps) return;
  const ch = steps.find(s => s[0] === 'choice'); if (!ch || !Array.isArray(ch[2])) return;
  const opts = ch[2];
  const extra = [
    ['Read the letter', [['run', 'hc_invite']], null, ['story.side_pick_done', '!story.hc_invite']],
    ['Where is the coach?', [['say', 'Warden Ilse', 'The lantern coach is the grass just south of this door.']], null, ['story.hc_invite', '!story.hc_games>=5']],
    ['About the hall', [['run', 'hc_ilse_done']], null, ['story.hc_clear_lantern', 'story.hc_clear_shells', 'story.hc_clear_chirp', 'story.hc_clear_dash', 'story.hc_clear_pairs']],
  ];
  for (let i = extra.length - 1; i >= 0; i--) if (!opts.some(o => o[0] === extra[i][0])) opts.unshift(extra[i]);
})();
// Build 3: side-keyed ambient lines. New keys win; a leftover `else` stays behind them so it only shows if both side keys miss.
(function applyGlimmerLines(){
  const G = MD.glimmer_path; if (!G || !G.lines || !WORLD.fernbrook) return;
  const byId = {}; for (const o of WORLD.fernbrook.objs) byId[o.id] = o;
  const put = (o, bag) => {
    if (!o || !bag || typeof bag !== 'object') return;
    const lines = {};
    for (const [k, v] of Object.entries(bag)) if (typeof v === 'string') lines[k] = v;
    for (const [k, v] of Object.entries(o.lines || {})) if (!(k in lines)) lines[k] = v;
    o.lines = lines;
  };
  put(byId.juniper, G.lines.juniper);
  put(byId.odile, G.lines.odile);
  put(byId.tobin_glim, G.lines.tobin_glim);
  put(byId.fen_after, G.lines.fen_after);
})();
// Loyalty lines (Keepers and Glimmerwell). More specific keys are merged in front; the side lines already on the NPC stay as the fallback.
// `story.side` absent still means Keepers, so keeper-facing keys use `!story.side=glimmer` (the same test the side lines use).
(function applyLoyalty(){
  const L = MD.glimmer_path && MD.glimmer_path.loyalty; if (!L) return;
  // One-shot intros (`!story.met_*`, or any line that runs a scene with `@`) stay in front. The Keeper House
  // on Hearthmoor (data/civic.json, written on the HQ branch) depends on that order. Rank lines slot in
  // after those intros and do not replace a key the NPC already has.
  const introKey = (k, v) => k.startsWith('!story.met_') || (typeof v === 'string' && v.charAt(0) === '@');
  const front = (o, bag) => {
    if (!o || !bag || typeof bag !== 'object') return;
    const intro = [], rest = [];
    for (const [k, v] of Object.entries(o.lines || {})) (introKey(k, v) ? intro : rest).push([k, v]);
    // Civic officers already carry their own standing ladder. Keep that copy in front. Other NPCs
    // (Juniper, Odile) take the loyalty keys first so rank lines beat the older side chatter.
    const ownLadder = rest.some(([k]) => k.startsWith('standing.'));
    const lines = {};
    for (const [k, v] of intro) lines[k] = v;
    const rank = [];
    for (const [k, v] of Object.entries(bag)) if (typeof v === 'string' && !(k in lines)) rank.push([k, v]);
    const tail = ownLadder ? rank : rest;
    const lead = ownLadder ? rest : rank;
    for (const [k, v] of lead) if (!(k in lines)) lines[k] = v;
    for (const [k, v] of tail) if (!(k in lines)) lines[k] = v;
    o.lines = lines;
  };
  const byId = {};
  for (const m of Object.values(WORLD)) for (const o of m.objs || []) if (o.id && !byId[o.id]) byId[o.id] = o;
  for (const [id, bag] of Object.entries(L.npcs || {})) {
    if (id.startsWith('_') || !bag || typeof bag !== 'object') continue;
    if (id === 'amos' && MD.glimmer_path.lines) {
      const lines = {};
      for (const [k, v] of Object.entries(bag)) if (typeof v === 'string') lines[k] = v;
      for (const [k, v] of Object.entries(MD.glimmer_path.lines.amos || {})) if (!(k in lines) && typeof v === 'string') lines[k] = v;
      MD.glimmer_path.lines.amos = lines;
      continue;
    }
    front(byId[id], bag);
  }
  for (const [id, steps] of Object.entries(L.preface || {})) {
    if (id.startsWith('_') || !Array.isArray(steps) || !SCENES[id]) continue;
    SCENES[id].unshift(...steps);
  }
})();
function trainerLine(id, key){
  syncSide();
  const t = TRAINERS[id];
  const L = MD.glimmer_path && MD.glimmer_path.loyalty;
  const bag = L && L.trainers && L.trainers[id] && L.trainers[id][key];
  if (bag && typeof bag === 'object') {
    for (const [c, v] of Object.entries(bag)) if (typeof v === 'string' && cond(c, true)) return v;
  }
  const line = t && t.lines && t.lines[key];
  return typeof line === 'string' ? line : '';
}
function objById(id){
  for (const m of Object.values(WORLD)) { const o = (m.objs || []).find(x => x.id === id); if (o) return o; }
  return null;
}
// The rank line from data/glimmer_path.json loyalty.npcs, ignoring whatever the map object already says.
// Used for Keeper House ids that may arrive with the civic build (hq_bram and the watch) before this branch sees them.
function loyaltyBagLine(id){
  const L = MD.glimmer_path && MD.glimmer_path.loyalty;
  const bag = L && L.npcs && L.npcs[id];
  if (!bag || typeof bag !== 'object') return null;
  for (const [k, v] of Object.entries(bag)) if (typeof v === 'string' && cond(k, false)) return v;
  return null;
}
// Point the new keeper outside, then (after Rook) toward the grass. Appended here so the design JSON stays verbatim.
if (SCENES.starter) SCENES.starter.push(
  ['say', 'Warden Ilse', 'When you step outside, take the east path. Rook is waiting by the gate.'],
  ['say', 'Warden Ilse', 'Wild Walklings wander in the grass. Walk up to one, and it may come with you.']);
if (SCENES.rival1) SCENES.rival1.push(
  ['say', 'Rook', 'The gate is right there. Go on, the road is yours.'],
  ['say', '', 'A wild Walkling waits in the grass, just off the path.']);
// BS Standing grants on the Keepers path (spec engineAsks.standingGrants): the orchard win and Seal #1. Amounts come from
// STANDING_CFG.grants (a null amount = look the one-shot id up there); the glimmer twins carry theirs in glimmer_path.json.
if (SCENES.orchard) SCENES.orchard.push(['standing', 'keepers', null, 'orchard_k']);
if (SCENES.seal1) SCENES.seal1.push(['standing', 'keepers', null, 'seal1_k']);
const TRAINER_LOOK = { rival1_rook: 'rook', rival2_rook: 'rook', fern_associate: 'associate', hall1_fen: 'fen', r2_associate: 'hollis', r2_lead: 'imogen', hall2_hale: 'hale',
  rx_wardens: 'regenx', rx_techs: 'regenx', rx_records: 'regenx', rx_quinn: 'regenx', rx_cal_ally: 'regenx',
  sm_lookouts: 'villager', sm_haulers: 'villager', sm_mara: 'villager', sm_jed_ally: 'villager' };
const COUNTER = { ember: 'tide', tide: 'bloom', bloom: 'ember' };   // §6: TIDE beats EMBER, BLOOM beats TIDE, EMBER beats BLOOM
let CUR = WORLD.hearthmoor, MAP = CUR.cells, MW = CUR.w, MH = CUR.h;
let mapRT = { talked: new Set(), chat: new Set(), trig: {}, face: {}, pos: {} };   // per map visit, never saved
function useMap(id){
  CUR = WORLD[id] || WORLD.hearthmoor; MAP = CUR.cells; MW = CUR.w; MH = CUR.h;
  mapRT = { talked: new Set(), chat: new Set(), trig: {}, face: {}, pos: {} };
  patrolClock = 0;
}
const isRoom = () => CUR.kind === 'interior';
// Explicit map.music wins (High Charity). Otherwise: quarry and grove have their own loops, dreams stay on
// route, and a Glimmerwell pledge swaps the shared town loop for town_glimmer. Keepers towns stay on town.
function trackFor(map){
  if (!map) return null;
  if (map.music && PPSound.musicIds().includes(map.music)) return map.music;
  if (map.id === 'cobble_quarry') return 'quarry';
  if (map.dream) return 'route';
  if (map.backdrop === 'grove') return 'grove';
  const townish = map.kind === 'interior' || map.backdrop === 'town';
  if (townish) return side() === 'glimmer' ? 'town_glimmer' : 'town';
  if (map.backdrop === 'route' || map.backdrop === 'meadow') return 'route';
  return null;
}
// Wild fights cycle three cheerful loops. Glimmerwell fights, while pledged to the Keepers, use the dark loops:
// the first one is the slow sting, later ones the driving minor theme. Keeper trials and route kids stay on `battle`.
const WILD_TRACKS = ['wild_skip', 'wild_romp', 'wild_spark'];
let wildTune = 0;
function battleTrack(kind, trainerId){
  if (kind === 'wild') return WILD_TRACKS[wildTune % WILD_TRACKS.length];
  if (kind === 'trainer' && trainerFaction(trainerId) === 'glimmer' && side() !== 'glimmer')
    return (S && S.flags['music.glimmer_fought']) ? 'glimmer_battle' : 'glimmer_first';
  return 'battle';
}
function takeBattleTrack(kind, trainerId){
  const id = battleTrack(kind, trainerId);
  if (kind === 'wild') wildTune++;
  if (kind === 'trainer' && trainerFaction(trainerId) === 'glimmer' && side() !== 'glimmer' && S) S.flags['music.glimmer_fought'] = true;
  return id;
}
const outdoorId = () => isRoom() ? CUR.outdoor : CUR.id;
// Conditions (§4): 'flag', '!flag', 'flag=value', 'seal:id', 'has:name', 'talked' (lines keys only). `live` = read scene pending too.
// WP-B0: numeric 'flag>=n', 'flag<=n', 'flag>n', 'flag<n' (an unset flag counts as 0) for counters written by the `inc` step.
function flagOf(k, live){ if (live && scene && k in scene.view.flags) return scene.view.flags[k]; return S.flags[k]; }
function curName(live){ return live && scene && scene.view.name !== undefined ? scene.view.name : (S.player && S.player.name) || null; }
function cond(c, live, o){
  if (typeof c === 'string' && c.includes('&')) return c.split('&').every(part => part && cond(part, live, o));
  if (c === 'else') return true;
  let neg = false; if (c[0] === '!') { neg = true; c = c.slice(1); }
  let v;
  if (c === 'has:name') v = !!curName(live);
  else if (c.startsWith('seal:')) v = !!S.seals[c.slice(5)];
  else if (c === 'talked') v = !!(o && mapRT.talked.has(o.id));
  else {
    const m = /^(.*?)(>=|<=|>|<|=)(.*)$/.exec(c);
    if (!m) v = !!flagOf(c, live);
    else if (m[2] === '=') v = String(flagOf(m[1], live)) === m[3];
    else { // BS: 'standing.<side>' compares the TIER (not points) so lines and options can key on it; else a numeric flag
      const sk = m[1].startsWith('standing.') ? m[1].slice(9) : null;
      const n = sk && PPStanding.isSide(sk) ? PPStanding.tierOf(standingOf(sk, live)) : (Number(flagOf(m[1], live)) || 0), r = Number(m[3]);
      v = m[2] === '>=' ? n >= r : m[2] === '<=' ? n <= r : m[2] === '>' ? n > r : n < r; }
  }
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
// Rook wears a Junior Bright lanyard once Glimmerwell has claimed him: on the glimmer path from the side
// pick, and on either path after Fernbrook (story.slice_end) or the quarry sale. Conversion (rook_end ally) takes it off.
function rookWithLanyard(look){
  if (!S || !S.flags || S.flags['story.rook_end'] === 'ally') return look;
  const glimmer = S.flags['story.side'] === 'glimmer';
  const show = (glimmer && S.flags['story.side_pick_done']) || S.flags['story.slice_end'] || S.flags['story.quarry_bought'];
  if (!show) return look;
  return Object.assign({}, look, { accent: 'l', accessory: 'lanyard' });
}
function npcLook(o){
  const key = o.look || (o.kind === 'trainer' ? (TRAINER_LOOK[o.id] || 'trainer') : LOOK_OF_NAME[o.name]) || 'villager';
  const look = NPC_LOOKS[key] || KEEPER_SWAPS.villager;
  if (key === 'rook') return rookWithLanyard(look);
  return look;
}
const talkable = o => !!o && (o.kind === 'npc' || o.kind === 'trainer' || o.kind === 'sign' || o.kind === 'wild' || (o.kind === 'prop' && (!!o.lines || !!o.board)));
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
  if (lanternHold() && lanternDoorHere()) {   // a wipe left you on Fernbrook's lantern door: you may turn back into it, not walk off
    S.world.facing = dn; clearMoves(); sfx('denied');
    const door = lanternDoorHere(); runSteps(placeSteps(door), { npc: door }); return;
  }
  if (warpBlocked(nx, ny)) { S.world.facing = dn; return; }   // the gate trigger one tile earlier tells you why
  const w = wildAt(nx, ny);
  if (w) { if (p && w.x === nx && w.y === ny) meetWild(w); return; }   // bump = encounter; a creature just leaving that tile blocks briefly
  walk.from = { x: S.world.x, y: S.world.y }; walk.to = { x: nx, y: ny }; walk.prog = 0;
  S.world.facing = dn;
  S.world.x = nx; S.world.y = ny;
  followerStep();
}
function earlyWalk(){
  const p = pet();
  if (!p || !S.flags['story.starter_received'] || S.flags['story.early_done']) return;
  if (S.flags['story.early_steps'] == null && S.steps > 1) { S.flags['story.early_done'] = true; return; }
  const n = (+S.flags['story.early_steps'] || 0) + 1;
  S.flags['story.early_steps'] = n;
  const nm = petName(p);
  if (n === 1) toast(nm + ' trots along. The east path leads out of town.');
  else if (n === 8) toast('Keep holding the pad. Wild Walklings like the grass.');
  else if (n === 16 && !S.flags['story.rival1_done']) toast('Rook is waiting by the east gate.');
  if (n >= 16) S.flags['story.early_done'] = true;
  if (n === 1 || n === 8 || n === 16) save();
}
function onLand(){
  const p = pet();
  S.steps++; if (S.steps % 2 === 0) sfx('step');   // quiet footstep on every other step
  earlyWalk();
  let found = false;
  bump.talked = null;                        // §4.1: any completed step ends "just talked to"
  if (p) {                                   // energy/hunger/step XP only with a partner
    p.energy = clamp(p.energy - STEP_NRG, 0, 100); p.hunger = clamp(p.hunger - STEP_FOOD, 0, 100);
    p.sr = (+p.sr || 0) + 1;                 // per-pet step remainder, carried across sessions
    const cday = careDay(); cday.steps++;     // steps together today (bond, walk finds)
    if (cday.steps % BOND.steps === 0 && cday.stepBond < BOND.stepDay) { cday.stepBond++; addBond(p, 1); }
    found = walkFind(p, cday);
    findStep = found;                        // the explore-cap toast waits for the find's toast this step
    if (p.sr >= STEPS_PER_XP) { p.sr -= STEPS_PER_XP; grantExploreXp(p, 1); }
    findStep = false;
    updateHUD();
  }
  if (S.steps % 50 === 0 && !found) toast(S.steps + ' steps! Nice walk.');   // a find says more than the step count
  const x = S.world.x, y = S.world.y;
  const wp = warpAt(x, y);
  if (wp && !(wp.need && !cond(wp.need, false))) {
    if (lanternHold() && LANTERN_ROOMS[CUR.id]) { blockLanternExit(); return; }   // the mat stays shut until the party rests
    if (wp.setFlag) S.flags[wp.setFlag] = true; warpTo({ map: wp.to, x: wp.tx, y: wp.ty, facing: wp.facing }); return;
  }
  const pk = objAt(x, y, o => o.kind === 'pickup');
  if (pk) {                                  // INVENTORY §8: clamped to the stack cap; the flag is set either way, so nothing loops
    const r = grantItem(pk.item, pk.n); S.flags['item.' + pk.id] = true; sfx(r.added ? 'stinger_item' : 'denied');
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
const ITEM_ART = {
  heal_snack: [
    '................',
    '................',
    '................',
    '.....ooooooo....',
    '...ooyyyyyyyoo..',
    '..oyyyrryrryyyo.',
    '..oywyrrrrryyyo.',
    '..oyyyyrrryyyyo.',
    '..oyyyyyryyyyyo.',
    '..roooyyyyyooor.',
    '..rrrooooooorrr.',
    '...rrrrrrrrrrr..',
    '.....rrrrrrr....',
    '................',
    '................',
    '................',
  ],
  hearty_snack: [
    '................',
    '................',
    '.....ooooooo....',
    '...ooyyyyyyyoo..',
    '..oyyyrryrryyyo.',
    '..oywyrrrrryyyo.',
    '..oyyyyrrryyyyo.',
    '..oyyyyyryyyyyo.',
    '..roooyyyyyooor.',
    '..rrrooooooorrr.',
    '..prrrrrrrrrrrp.',
    '..oyyyyyyyyyyyo.',
    '..roooooooooorr.',
    '...rrrrrrrrrrr..',
    '................',
    '................',
  ],
  wake_tonic: [
    '................',
    '.......pp.......',
    '.......pp.......',
    '......oyoo......',
    '.....oyyoor.....',
    '.....oyooor.....',
    '......gggg......',
    '.....oyyooor....',
    '....oyyyooooo...',
    '....oywyoooor...',
    '....oyyooooor...',
    '....oyooooorr...',
    '.....ooooorr....',
    '......orrrr.....',
    '................',
    '................',
  ],
  befriend_treat: [
    '................',
    '................',
    '................',
    '................',
    '.y...........y..',
    '.yy..rrrrrr.yy..',
    '.yyyrwwrrrrryyy.',
    '.yyyrwrrrrrryyy.',
    '.yyyrrrrrrrpyyy.',
    '.yy..rrrrpp..yy.',
    '.y...........y..',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  energy_sip: [
    '................',
    '.....w....w.....',
    '.....ww...ww....',
    '......w....w....',
    '................',
    '................',
    '...ccccccccc....',
    '...csssssssc....',
    '...cccccccccccc.',
    '...csccccccc..c.',
    '...csccccccc..c.',
    '...cscccccccccc.',
    '...ccccccccc....',
    '....bbbbbbb.....',
    '................',
    '................',
  ],
  joy_crumb: [
    '................',
    '.......rr.......',
    '.......rr.......',
    '.....wwwwww.....',
    '....wwcwwlww....',
    '...wwwwwrwwww...',
    '...wlwwwwwcww...',
    '..wwwwrwwwwwww..',
    '..hwwwwwlwwwwh..',
    '...ohohohohoh...',
    '...oohohohoho...',
    '....ohohohoh....',
    '....oooooooo....',
    '................',
    '................',
    '................',
  ],
  atten_vial: [
    '................',
    '................',
    '......yyyy......',
    '.....yyyyyy.....',
    '......yyyy......',
    '......cwwc......',
    '.....cllllc.....',
    '....llwwllll....',
    '....llllllll....',
    '....lwwwwwll....',
    '....llllllll....',
    '....llwwllll....',
    '.....llllll.....',
    '......cccc......',
    '................',
    '................',
  ],
  atten_plans: [
    '................',
    '................',
    '.wwwwwwwwwwwww..',
    '.wwwwwwwswwwww..',
    '.wkbbbwwswwkkb..',
    '.wwwwwwwswwwww..',
    '.wwbkkwwswwbkw..',
    '.wwwwwwwswwww...',
    '.wwwkbbwswwwss..',
    '.wwwwwwwswwss...',
    '.wwwwwwwwss.....',
    '..wwwwwwww......',
    '................',
    '................',
    '................',
    '................',
  ],
  route_page: [
    '................',
    '.yyyyyyyyyy.....',
    'yyyyyyyyyyyyy...',
    'yykkkkkyyyyyyyo.',
    'yyyyyyyyyyyyyyo.',
    'yykkkkkyyyyyoo..',
    'yyyyyyyyyyyyyy..',
    'oyykkkkkyyyyyo..',
    'yyyyyyyyyyyyy...',
    'yykkkyyyyyyo....',
    'yyyyyyyyyyyy....',
    '.yyyyyyyyy......',
    '..yyyyyyy.......',
    '................',
    '................',
    '................',
  ],
  soft_berry: [
    '................',
    '................',
    '................',
    '......ggg.......',
    '.....ggggg......',
    '.....rrrrr......',
    '....rrrrrrr.....',
    '....rryyrrr.....',
    '....rrrrrrr.....',
    '.....rrrrr......',
    '......rrr.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  bracer_band: [
    '................',
    '................',
    '................',
    '................',
    '...oooooooooo...',
    '..oyyyyyyyyyyo..',
    '..oyyyymmyyyyo..',
    '..oyyyyyyyyyyo..',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  kin_ribbon: [
    '................',
    '................',
    '..rr.......rr...',
    '.rrrr.....rrrr..',
    '.rrwrrrrrrrwrr..',
    '..rrrrrrrrrrr...',
    '....rryyyrr.....',
    '.....yyyyy......',
    '......yyy.......',
    '.......y........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};
// Item icons: Design ICONS_SEALS item_* grids, drawn via keeperCanvas at 36 CSS px.
const ITEMS = {
  heal_snack:     { name: 'Heal Snack',     plural: 'Heal Snacks',     cap: 20, price: 50,  use: ['battle', 'field'], target: true,  heal: 0.4,  blurb: 'Restores 40% HP.' },
  hearty_snack:   { name: 'Hearty Snack',   plural: 'Hearty Snacks',   cap: 10, price: 150, use: ['battle', 'field'], target: true,  heal: 0.75, blurb: 'Restores 75% HP.' },
  wake_tonic:     { name: 'Wake Tonic',     plural: 'Wake Tonics',     cap: 5,  price: 400, use: ['battle', 'field'], target: true,  blurb: 'Wakes a worn-out Walkling at 25% HP.' },
  befriend_treat: { name: 'Befriend Treat', plural: 'Befriend Treats', cap: 20, price: 80,  use: ['battle'],          target: false, blurb: 'Wild battles only. Easier to befriend.' },
  energy_sip:     { name: 'Energy Sip',     plural: 'Energy Sips',     cap: 10, price: 60,  use: ['field'],           target: true,  blurb: 'A fizzy pick-me-up. NRG +40.' },
  joy_crumb:      { name: 'Joy Crumb',      plural: 'Joy Crumbs',      cap: 10, price: 40,  use: ['field'],           target: true,  blurb: 'A sweet treat. JOY +20.' },
  soft_berry:     { name: 'Soft Berry',     plural: 'Soft Berries',    cap: 10, price: 80,  use: ['field'],           target: false, hold: true, blurb: 'Heals once when a hit drops HP under half.' },
  bracer_band:    { name: 'Bracer Band',    plural: 'Bracer Bands',    cap: 5,  price: 200, use: ['field'],           target: false, hold: true, blurb: 'Held. Charge, Brace or Dart starts at +2 on the way in.' },
  kin_ribbon:     { name: 'Kin Ribbon',     plural: 'Kin Ribbons',     cap: 5,  price: 120, use: ['field'],           target: false, hold: true, blurb: 'Held. Wild befriending is a little easier.' },
  atten_vial:     { name: 'Atten Vial',     plural: 'Atten Vials',     cap: 3,  price: 0,   use: ['field'],           target: false, key: true, keyNote: 'A sealed RegenX vial. It stays in the bag.', blurb: 'RegenX Atten. It sharpens focus.' },
  atten_plans:    { name: 'Atten Plans',    plural: 'Atten Plans',     cap: 1,  price: 0,   use: ['field'],           target: false, key: true, keyNote: 'RegenX brewing notes. They stay in the bag.', blurb: 'How to brew Atten cheaply.' },
  route_page:     { name: 'Route Page',     plural: 'Route Pages',     cap: 1,  price: 0,   use: ['field'],           target: false, key: true, keyNote: 'A night-cart list. It stays in the bag.', blurb: 'Names the carts. Walklings, not apples.' },
  keeper1:       { name: 'Keeper1',        plural: 'Keeper1s',        cap: 1,  price: 0,   use: ['field'],           target: false, key: true, keyNote: 'Your issued phone. Open PHONE on the pad.', blurb: 'Free. The wires stay with the Keepers.' },
  cracked_phone:  { name: 'Cracked Handset', plural: 'Cracked Handsets', cap: 1, price: 0, use: ['field'], target: false, key: true, keyNote: 'No crest. Open PHONE.', blurb: 'A thin Glimmerwell handset. Still on their wires.' },
};
const ITEM_ORDER = Object.keys(ITEMS);
const BAG_FULL_MSG = 'Bag is full, so some were left behind.';
const itemLabel = (id, n) => { const it = ITEMS[id], one = it ? it.name : id, many = it ? it.plural : id; return n === 1 ? 'a ' + one : n + ' ' + many; };
const acorns = n => n + (n === 1 ? ' Acorn' : ' Acorns');      // INVENTORY §2: the save field stays `money`
const itemCount = id => (S && S.bag && S.bag[id]) || 0;
const warnedItems = new Set();
// Grant n of an item, clamped to the room left under its cap (overflow is lost). Unknown ids: a no-op that warns once.
function ensureCrackedPhone(){
  if (!S || S.flags['story.side'] !== 'glimmer' || itemCount('cracked_phone')) return;
  grantItem('cracked_phone', 1);
}
function grantItem(id, n){
  const it = ITEMS[id]; n = Math.max(0, n | 0);
  if (!it) { if (!warnedItems.has(id)) { warnedItems.add(id); console.warn('Walklings: unknown item id "' + id + '" (nothing given).'); } return { added: 0, lost: 0, unknown: true }; }
  const added = Math.min(n, Math.max(0, it.cap - itemCount(id)));
  if (added) S.bag[id] = itemCount(id) + added;
  return { added, lost: n - added };
}
/* CARE_LOOP D, cheap slice: walk finds. Twice a day, at 60 and 140 steps walked together (both before the 150-step
   "explored enough" toast), the partner digs something up: a toast at that step, no dig animation, no keepsakes.
   Loot: 60% Acorns (10-25), 25% a Joy Crumb or a Heal Snack (Acorns instead if that stack is full), 15% Acorns
   (the keepsake share, Q10 deferred). +2 bond. Counted on S.care (finds, steps), per local day. */
const FINDS = { at: [60, 140], acornMin: 10, acornMax: 25, items: ['joy_crumb', 'heal_snack'] };
let findStep = false, findRng = Math.random;
function walkFind(p, cday){
  if (!FINDS.at.includes(cday.steps) || cday.finds >= FINDS.at.length) return false;
  cday.finds++;
  const r = findRng(); let what = null;
  if (r >= 0.6 && r < 0.85) { const id = FINDS.items[findRng() < 0.5 ? 0 : 1]; if (grantItem(id, 1).added) what = itemLabel(id, 1); }
  if (!what) { const n = FINDS.acornMin + Math.floor(findRng() * (FINDS.acornMax - FINDS.acornMin + 1)); S.money = (S.money || 0) + n; what = acorns(n); }
  addBond(p, BOND.find); sfx('stinger_item');
  toast(petName(p) + ' dug something up! Found ' + what + '.'); save();
  return true;
}
function takeItem(id){ const c = itemCount(id) - 1; if (c > 0) S.bag[id] = c; else delete S.bag[id]; }
// Why an item can't be used right now (null = it can). ctx 'battle' | 'field'; p = the target pet (if the item needs one).
function itemRefusal(id, p, ctx){
  const it = ITEMS[id];
  if (!it) return "Can't use that here yet.";
  if (itemCount(id) < 1) return 'Your bag is empty.';
  if (it.hold) return 'Hold it on a Walkling. The bag does not use it up.';
  if (id === 'befriend_treat') {
    if (ctx !== 'battle' || !battle.on) return 'Save it for a wild battle.';
    if (battle.kind !== 'wild') return "Can't use that here.";
    if (battle.treat) return "It's already nibbling a treat.";
    return null;
  }
  if (it.key) return it.keyNote || 'That stays in the bag.';
  if (!it.use.includes(ctx)) return ctx === 'battle' ? "Can't use that in battle." : "Can't use that here yet.";
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
// HOLD moves one from the bag onto the pet. The old held item comes back first; a full stack refuses and changes nothing.
function holdItem(petId, itemId){
  const p = petById(petId), it = ITEMS[itemId];
  if (!p) return { ok: false, msg: 'No Walkling.' };
  if (!it || !it.hold) return { ok: false, msg: "That can't be held." };
  if (itemCount(itemId) < 1) return { ok: false, msg: 'Your bag is empty.' };
  if (p.held) {
    const back = grantItem(p.held, 1);
    if (!back.added) {
      const old = ITEMS[p.held] ? ITEMS[p.held].name : p.held;
      return { ok: false, msg: "Bag can't hold the " + old + '.' };
    }
  }
  takeItem(itemId);
  p.held = itemId;
  return { ok: true, msg: petName(p) + ' holds ' + it.name + '.' };
}
function unholdItem(petId){
  const p = petById(petId);
  if (!p || !p.held) return { ok: false, msg: 'Nothing to take back.' };
  const id = p.held, it = ITEMS[id];
  const back = grantItem(id, 1);
  if (!back.added) return { ok: false, msg: "Bag can't hold more." };
  delete p.held;
  return { ok: true, msg: 'Took back ' + (it ? it.name : id) + '.' };
}
function setAccessory(petId, name){
  const p = petById(petId);
  if (!p) return { ok: false, msg: 'No Walkling.' };
  if (name == null || name === 'none' || name === '') { delete p.accessory; return { ok: true, msg: petName(p) + ' wears nothing.' }; }
  if (!PET_ACC_IDS.includes(name)) return { ok: false, msg: "That isn't an accessory." };
  p.accessory = name;
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  return { ok: true, msg: petName(p) + ' wears a ' + label + '.' };
}
// Triggers (§4): fire when a step ends within Manhattan r; once until the keeper ends a step outside the area (or the map changes).
let walkAwayI = 0;   // which gate toast to show next; not saved (one line each time you step off after "Think about it")
function checkArriveTriggers(){
  const x = S.world.x, y = S.world.y;
  for (const o of CUR.objs) {
    if (o.kind !== 'trigger' || !o.arrive) continue;
    const inside = present(o) && Math.abs(o.x - x) + Math.abs(o.y - y) <= (o.r || 0);
    if (!inside || mapRT.trig[o.id]) continue;
    mapRT.trig[o.id] = true; clearMoves(); runScene(o.scene); return true;
  }
  return false;
}
function checkTriggers(){
  const x = S.world.x, y = S.world.y;
  for (const o of CUR.objs) {
    if (o.kind !== 'trigger') continue;
    const inside = present(o) && Math.abs(o.x - x) + Math.abs(o.y - y) <= (o.r || 0);
    if (!inside) {
      if (o.id === 'fb_side_pick' && mapRT.trig[o.id] && !S.flags['story.side_pick_done']) {
        const lines = (MD.glimmer_path && MD.glimmer_path.walkAway) || [];
        if (lines.length) { toast(lines[walkAwayI % lines.length]); walkAwayI++; }
      }
      delete mapRT.trig[o.id];
      continue;
    }
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
let patrolClock = 0;
function tickPatrol(dt){
  if (!CUR || scene || fade.busy || (battle && battle.on) || overlayOpen()) return;
  patrolClock += dt;
  if (patrolClock < 0.7) return;
  patrolClock = 0;
  for (const o of CUR.objs) {
    const path = o.patrol;
    if (!path || !path.length || !present(o)) continue;
    const cur = mapRT.pos[o.id] || { x: o.x, y: o.y };
    const slot = (o._pi || 0) % path.length, dest = path[slot];
    if (cur.x === dest[0] && cur.y === dest[1]) { o._pi = slot + 1; continue; }
    const sx = Math.sign(dest[0] - cur.x), sy = Math.sign(dest[1] - cur.y);
    const nx = cur.x + (sx || 0), ny = cur.y + (sy && !sx ? sy : 0);
    const face = sx ? (sx < 0 ? 'left' : 'right') : (sy < 0 ? 'up' : 'down');
    if (solidTile(nx, ny) || blockerAt(nx, ny) || (nx === S.world.x && ny === S.world.y)) { o._pi = slot + 1; continue; }
    mapRT.pos[o.id] = { x: nx, y: ny, fx: nx, fy: ny, facing: face };
    mapRT.face[o.id] = face;
  }
}
function updateWalk(dt, t){
  if (walk.intro) { if (t - walk.intro > 700) { walk.intro = 0; openEncounter(); } return; }
  if (walk.to) {
    walk.prog += dt * 1000 / STEP_MS;
    if (walk.prog >= 1) { walk.fx = walk.to.x; walk.fy = walk.to.y; walk.to = null; if (fol.to) { fol.fx = fol.x; fol.fy = fol.y; fol.to = null; } onLand(); }
    else { walk.fx = walk.from.x + (walk.to.x - walk.from.x) * walk.prog; walk.fy = walk.from.y + (walk.to.y - walk.from.y) * walk.prog;
      if (fol.to) { fol.fx = fol.from.x + (fol.to.x - fol.from.x) * walk.prog; fol.fy = fol.from.y + (fol.to.y - fol.from.y) * walk.prog; } }
  }
  tickFrozen(t);
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
  tickPatrol(dt);
}
/* --- warps, doors and the fade (MAPS_SLICE §3, INTERIORS §3.1): 250 ms, input locked, save right after --- */
const FADE_MS = 250;
const fade = { busy: false, t0: 0 };
function warpTo(at, after){
  if (fade.busy) return; fade.busy = true; fade.t0 = now(); clearMoves();
  setTimeout(() => { arriveAt(at); }, FADE_MS / 2);
  setTimeout(() => { fade.busy = false; if (after) after(); }, FADE_MS);
}
let musicHold = false;   // closeBattle plays the return loop itself (after stingers); a wipe's arriveAt must not start it early
function arriveAt(at){
  useMap(at.map);
  S.world.map = CUR.id; S.world.x = at.x; S.world.y = at.y; S.world.facing = at.facing || S.world.facing;
  walk.fx = at.x; walk.fy = at.y; walk.to = null; walk.from = null;
  resetWild(); if (CUR.id === 'route1') S.flags['story.reached_route1'] = true; bump.talked = null; markMapSeen();
  placeFollower(); placeGuide(); renderEnv(); noteBoardTown(); save();
  if (!musicHold) { const theme = trackFor(CUR); if (theme) PPSound.music(theme); }
}
function enterDoor(dr){
  if (dr.need && !cond(dr.need, false)) { runSteps([['say', '', dr.deny || 'The door is locked.']]); return; }
  if (dr.to) { sfx('tap'); warpTo({ map: dr.to, x: dr.tx, y: dr.ty, facing: dr.facing || 'up' }); return; }
  if (dr.panel) openPlace(dr);
}
// MAPS_SLICE §9 place panels (Fernbrook keeps panels; Hearthmoor's became rooms). The Lantern House: the keeper's line -> REST / LEAVE;
// REST heals the whole party and makes this town the respawn (§7 beat 6). Hurt parties pay a few Acorns. After a wipe the door
// stays shut until that rest. The Trial Hall panel arrives with Trial Hall #1.
function lanternGreet(who){
  const fallback = 'Long walk from Hearthmoor? Rest a while.';
  if (who !== 'Keeper Amos') return fallback;
  const amos = MD.glimmer_path && MD.glimmer_path.lines && MD.glimmer_path.lines.amos;
  if (!amos) return fallback;
  for (const [k, v] of Object.entries(amos)) if (typeof v === 'string' && cond(k, false)) return v;
  return fallback;
}
// Build 3: on the glimmer path the Hall door is the Bright Pavilion Tour. Stops 1-3 are map triggers; stop 4 (this panel)
// is the optional Fen match. Keepers still get the trial exactly as before.
function glimmerHallSteps(t, pn){
  const who = (pn && pn.who) || 'Associate Juniper';
  if ((t && t.seal && S.seals[t.seal]) || S.flags['story.seal1'])
    return [['say', who, (pn && pn.again) || "Your file's complete, partner! Have a bright day!"]];
  if (!S.flags['story.tour1_s1'] || !S.flags['story.tour1_s2'] || !S.flags['story.tour1_s3']) return [['run', 'tour1_wait']];
  return [['run', 'tour1_s4']];
}
function placeSteps(dr){
  if (dr.panel === 'lantern') {
    const who = dr.keeper || '';
    const hold = lanternHold();
    const opts = [lanternRestOption()];
    // BS: the Keepers' Pledge desk is this keeper's panel (STANDING_CFG.switch.desks.keepers), shown only when it would be a switch.
    if (who === SC_STANDING.switch.desks.keepers.who && deskOpen('keepers')) opts.push([SC_STANDING.switch.option, pledgeDeskSteps('keepers')]);
    opts.push(hold
      ? ['Not yet', [['say', who, 'The door stays shut until the party is rested.']]]
      : ['Leave', []]);
    const greet = hold
      ? 'Your team is worn out. A rest costs ' + LANTERN_REST_COST + ' Acorns and heals everyone.'
      : lanternGreet(who);
    return [['say', who, greet],
      ['if', 'story.starter_received',
        [['choice', hold ? 'Rest the whole party?' : 'Let your team rest?', opts]],
        [['say', who, 'No team to rest yet? Come back with a friend.']]]];
  }
  if (dr.panel === 'hall1') {                          // §9 Fen's Trial Hall: BEGIN TRIAL runs hall1_fen (summon flow, then `seal1` on a win)
    // WP-B0 Hall stub (engine ask 5): the side-merged trainer may carry a `panel` {who, greet, ask, begin, again}; its `seal`
    // and `onWin` scene (resolved per side) do the rest. Glimmer Hall slot 1 is the Tour; the Keepers trial is unchanged.
    // Heights: the trial is not offered until "get to know us" is done. A save that already has the Seal is left alone.
    syncSide();
    const t = TRAINERS.hall1_fen, pn = (t && t.panel) || {};
    if (!trialReady()) return sceneSteps('trial_wait') || [['say', 'Master Fen', 'The trial can wait. Walk the Heights first.']];
    if (side() === 'glimmer') return glimmerHallSteps(t, pn);
    if (t && ((t.seal && S.seals[t.seal]) || S.flags['trainer.hall1_fen'])) return [['say', pn.who || 'Master Fen', pn.again || 'Come back any time. The orchard remembers its friends.']];
    return [['say', pn.who || 'Master Fen', pn.greet || trainerLine('hall1_fen', 'intro') || 'Roots first, then blossoms. Show me yours.'],
      ['choice', pn.ask || 'Begin the trial?', [[pn.begin || 'Begin trial', [['battle', 'hall1_fen']]], ['Leave', []]]]];
  }
  return [['say', '', 'Closed for now. Come back soon!']];
}
// After a place panel closes the keeper is still on its doorstep: a trigger there (the Hall's `teaser` after the Seal) plays now.
function openPlace(dr){ sfx('tap'); runSteps(placeSteps(dr), { npc: dr }).then(() => { if (!scene && !fade.busy && !overlayOpen()) checkTriggers(); }); }
// Keeper towns wear gold and green. Glimmerwell ground wears mint. The stripe sits on the roof edge and the wall foot.
function factionOfMap(id){
  if (!id) return null;
  if (/^rx_/.test(id) || id === 'route2_glen') return 'glimmer';
  if (id === 'cobblecrest' || id === 'cobble_quarry' || id.indexOf('cc_') === 0) return (S && S.flags['story.quarry_bought']) ? 'glimmer' : 'keepers';
  if (id === 'highcharity' || id.indexOf('hc_') === 0) return 'keepers';   // the capital wears the same gold and green as Hearthmoor
  if (id === 'hearthmoor' || id.indexOf('hm_') === 0 || id === 'fernbrook' || id === 'route1' || id === 'route2') return 'keepers';
  return null;
}
function drawFactionBand(g, ch, tx, ty, X, Y){
  const fac = factionOfMap(CUR.id);
  if (!fac || (ch !== 'R' && ch !== 'H')) return;
  const ridge = fac === 'glimmer' ? PAL.c : PAL.y, band = fac === 'glimmer' ? PAL.l : PAL.g;
  if (ch === 'R' && tileAt(tx, ty - 1) !== 'R') { g.fillStyle = ridge; g.fillRect(X, Y, 16, 2); g.fillStyle = band; g.fillRect(X, Y + 2, 16, 1); }
  if (ch === 'H' && tileAt(tx, ty + 1) !== 'H') { g.fillStyle = band; g.fillRect(X + 2, Y + 13, 12, 2); }
}
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
      const ch = MAP[ty][tx]; let img = ch === 'w' ? TILES.w[wf] : ch === 'W' && tx % 2 ? TILES.W2 : TILES[ch] || TILES.g;
      if (ch === 'R' && CUR.roofs) for (const r of Object.values(CUR.roofs)) if (r && tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1 && TILES['R' + r.col]) img = TILES['R' + r.col];
      g.drawImage(img, tx*TS - cx, ty*TS - cy);
      drawFactionBand(g, ch, tx, ty, tx*TS - cx, ty*TS - cy);
      if (ch === '=') {                          // rug border where the rug ends
        g.fillStyle = PAL.p; const X = tx*TS - cx, Y = ty*TS - cy;
        if (tileAt(tx, ty-1) !== '=') g.fillRect(X, Y, 16, 1); if (tileAt(tx, ty+1) !== '=') g.fillRect(X, Y+15, 16, 1);
        if (tileAt(tx-1, ty) !== '=') g.fillRect(X, Y, 1, 16); if (tileAt(tx+1, ty) !== '=') g.fillRect(X+15, Y, 1, 16);
      }
    }
  for (const o of CUR.objs) if (o.kind === 'door' && present(o) && tileAt(o.x, o.y - 1) === 'H') g.drawImage(WART.door, o.x*TS - cx, (o.y-1)*TS - cy);
  drawCobbleTrim(g, cx, cy, t);
  if (sightShown) for (const o of CUR.objs) if (o.kind === 'trainer' && present(o)) {   // debug showSight(): tint every sight line
    g.fillStyle = canSpot(o) ? 'rgba(244,80,80,.35)' : 'rgba(160,160,160,.3)'; sightLine(o).forEach(c => g.fillRect(c.x*TS - cx, c.y*TS - cy, TS, TS)); }
  if (walk.target) { g.strokeStyle = PAL.y; g.lineWidth = 1; g.strokeRect(walk.target.x*TS - cx + .5, walk.target.y*TS - cy + .5, 15, 15); }
  const grassOver = (fx, fy) => { const gx = Math.round(fx), gy = Math.round(fy); if (MAP[gy] && MAP[gy][gx] === 't') g.drawImage(TILES.t, 0, 10, 16, 6, gx*TS - cx, gy*TS - cy + 10, 16, 6); };
  const drawPlayer = () => {                 // the keeper (MAPS_SLICE K.1): 2 walk frames, 1px bob only while moving
    const fr = keeperFrame(), sc = CUR.dream === 'young' ? 12 : CUR.dream === 'child' ? 15 : 18;
    const sx = Math.round(px_ - cx) - 1 + (18 - sc) / 2, sy = Math.round(py_ - cy) - 2 - fr + (18 - sc);
    g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(sx + 3, Math.round(py_ - cy) + 14, Math.max(8, sc - 6), 2);
    g.drawImage(keeperFrames(shownLook())[S.world.facing][fr], sx, sy, sc, sc);
    grassOver(walk.fx, walk.fy);
  };
  const drawFollower = () => {               // the partner, one tile behind (K.3); Tired = slower, lower bob
    const fx = Math.round(fol.fx * TS - cx) - 1, fy = Math.round(fol.fy * TS - cy) - 2 + (isFainted(p) ? 1 : 0);
    if (fx < -18 || fy < -18 || fx > VW || fy > VH) return;
    g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(fx + 3, Math.round(fol.fy * TS - cy) + 14, 12, 2);
    const bob = followerBob(t);
    g.drawImage(petSpr(p)[(t % 3000) < 120 ? 'b' : 'n'], fx, fy - bob);
    if (p.accessory) drawPetAccessory(g, p.accessory, fx, fy - bob, isFaded(p));
    if (earlyBuddy() && Math.floor(t / 400) % 5 === 0) drawGlyph(g, 'heart', fx + 10, fy - 12 - bob);
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
  drawDream(g, VW, VH, t);
  drawObjectiveCue(g, cx, cy, t);
  if (walk.intro) { const k = Math.floor((t - walk.intro) / 120) % 2; if (k) { g.fillStyle = PAL.w; g.fillRect(0,0,VW,VH); } }
  if (fade.busy) { const e = (now() - fade.t0) / (FADE_MS / 2); g.globalAlpha = clamp(e <= 1 ? e : 2 - e, 0, 1); g.fillStyle = PAL.k; g.fillRect(0,0,VW,VH); g.globalAlpha = 1; }
}
// Cobblecrest only: ridge, chimney, windows and corner stones outside; banners, warm light and flagstone flecks inside.
// Shared roof and wall tiles also draw Hearthmoor and Fernbrook, so this pass never edits those sprites.
function drawCobbleTrim(g, cx, cy, t){
  const town = CUR.id === 'cobblecrest', lantern = CUR.id === 'cc_lantern_in', hall = CUR.id === 'cc_hall_in';
  if (!town && !lantern && !hall) return;
  const slate = (x, y) => {
    if (!CUR.roofs) return false;
    for (const r of Object.values(CUR.roofs)) if (r && x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1 && r.col === 'm') return true;
    return false;
  };
  const doorWall = (x, y) => CUR.objs.some(o => o.kind === 'door' && present(o) && o.x === x && o.y === y + 1);
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const ch = MAP[ty][tx], X = tx * TS - cx, Y = ty * TS - cy;
    if (town && ch === 'R') {
      const up = tileAt(tx, ty - 1) === 'R', down = tileAt(tx, ty + 1) === 'R', left = tileAt(tx - 1, ty) === 'R';
      if (!up) { g.fillStyle = slate(tx, ty) ? PAL.w : PAL.y; g.fillRect(X, Y, 16, 2); g.fillStyle = PAL.k; g.fillRect(X, Y + 2, 16, 1); }
      if (!down) { g.fillStyle = PAL.k; g.fillRect(X, Y + 14, 16, 2); }
      if (!up && !left) {
        g.fillStyle = PAL.m; g.fillRect(X + 2, Y + 1, 4, 6);
        g.fillStyle = PAL.k; g.fillRect(X + 2, Y + 1, 4, 1);
        g.fillStyle = PAL.d; g.fillRect(X + 5, Y + 2, 1, 5);
        if (Math.floor(t / 320) % 2 === 0) { g.fillStyle = PAL.h; g.fillRect(X + 3, Y, 1, 1); }
      }
    } else if (town && ch === 'H' && !doorWall(tx, ty)) {
      if (tileAt(tx, ty + 1) !== 'H') {
        g.fillStyle = PAL.k; g.fillRect(X + 4, Y + 4, 8, 7);
        g.fillStyle = PAL.c; g.fillRect(X + 5, Y + 5, 6, 5);
        g.fillStyle = PAL.s; g.fillRect(X + 5, Y + 5, 2, 2);
        g.fillStyle = PAL.k; g.fillRect(X + 7, Y + 5, 1, 5); g.fillRect(X + 5, Y + 7, 6, 1);
        g.fillStyle = PAL.g; g.fillRect(X + 4, Y + 11, 8, 2);
        g.fillStyle = PAL.l; g.fillRect(X + 5, Y + 11, 2, 1);
      }
      if (tileAt(tx - 1, ty) !== 'H' && tileAt(tx - 1, ty) !== 'R') { g.fillStyle = PAL.w; g.fillRect(X, Y, 2, 16); }
      if (tileAt(tx + 1, ty) !== 'H' && tileAt(tx + 1, ty) !== 'R') { g.fillStyle = PAL.w; g.fillRect(X + 14, Y, 2, 16); }
    } else if ((lantern || hall) && ch === 'W' && tx % 2 === 0 && tx > 0 && tx < MW - 1) {
      const col = tx % 4 === 0 ? PAL.r : PAL.o;
      g.fillStyle = PAL.k; g.fillRect(X + 5, Y + 2, 6, 8);
      g.fillStyle = col; g.fillRect(X + 6, Y + 3, 4, 6);
      g.fillStyle = PAL.y; g.fillRect(X + 7, Y + 5, 2, 2);
      g.fillStyle = PAL.m; g.fillRect(X + 7, Y + 1, 2, 2);
    } else if (lantern && (ch === '.' || ch === '=') && (tx * 3 + ty * 5) % 4 === 0) {
      g.fillStyle = PAL.h; g.fillRect(X + 2, Y + 12, 3, 1); g.fillRect(X + 11, Y + 4, 1, 2);
    } else if (hall && ch === ':') {
      if ((tx + ty) % 3 === 0) { g.fillStyle = PAL.d; g.fillRect(X + 2, Y + 12, 5, 2); }
      if ((tx * 2 + ty) % 5 === 0) { g.fillStyle = PAL.h; g.fillRect(X + 11, Y + 3, 2, 2); }
    } else if (hall && ch === 'X') { g.fillStyle = PAL.y; g.fillRect(X + 4, Y + 6, 8, 1); }
  }
  if (town) for (const o of CUR.objs) if (o.kind === 'door' && present(o)) {
    const X = o.x * TS - cx, Y = o.y * TS - cy;
    g.fillStyle = PAL.o; g.fillRect(X + 3, Y + 12, 10, 3); g.fillStyle = PAL.y; g.fillRect(X + 4, Y + 12, 8, 1);
  }
  if (lantern || hall) {
    g.save(); g.globalAlpha = 0.4; g.fillStyle = PAL.y;
    for (const o of CUR.objs) if (o.sprite === 'floor_lantern' || o.sprite === 'wall_lantern') {
      const X = o.x * TS - cx, Y = o.y * TS - cy;
      g.fillRect(X - 2, Y + 10, 20, 12); g.fillRect(X + 2, Y + 6, 12, 8);
    }
    g.restore();
  }
}
/* ---------- next-step cue (NEXT_PLAN WP-C): replaces the Hearthmoor-only exit chevron ---------- */
// The objective comes from quests.js (flags only, nothing saved). On the current map a yellow arrow bobs above the target
// tile; off-screen it becomes an arrow at the viewport edge; on another map it points at the exit that starts the
// shortest route there (BFS over warps and doors). Hidden during scenes, battles and the walk-in flash.
const questState = () => ({ flags: S.flags, seals: S.seals, pets: allPets().length });
const HC_CLEAR_FLAGS = ['story.hc_clear_lantern', 'story.hc_clear_shells', 'story.hc_clear_chirp', 'story.hc_clear_dash', 'story.hc_clear_pairs'];
const HC_QUEST = {
  id: 'hc_games',
  text: "Ilse's letter points to High Charity. Play all five Event Hall games with your Walkling.",
  place: 'High Charity Event Hall',
  glimmerText: "Ilse wrote anyway. High Charity's Event Hall has five games for you and your Walkling.",
  glimmerPlace: 'High Charity Event Hall',
  target: { map: 'highcharity', x: 32, y: 29 },
};
// The main chain stays put. This pointer only replaces the idle `end` card, and only until all five games are cleared.
const questCurrent = () => {
  if (!S || typeof PPQuests === 'undefined') return null;
  const q = PPQuests.current(questState());
  if (!q || q.id !== 'end' || !S.flags['story.hc_invite'] || HC_CLEAR_FLAGS.every(f => S.flags[f])) return q;
  const g = side() === 'glimmer';
  return { id: HC_QUEST.id, text: g ? HC_QUEST.glimmerText : HC_QUEST.text, place: g ? HC_QUEST.glimmerPlace : HC_QUEST.place, target: HC_QUEST.target, variant: g ? 'glimmer' : undefined };
};
const ARROW_DOWN = ['..###..', '..###..', '..###..', '#######', '.#####.', '..###..', '...#...'];   // 7x7, drawn 1 px per cell with a PAL.k outline
const ARROW = (() => {
  const H = ARROW_DOWN.length, W = ARROW_DOWN[0].length, at = (x, y) => ARROW_DOWN[y][x] === '#';
  const grid = f => { const out = []; for (let y = 0; y < (f.h); y++) { let r = ''; for (let x = 0; x < f.w; x++) r += f.px(x, y) ? '#' : '.'; out.push(r); } return out; };
  return {
    down: ARROW_DOWN,
    up: grid({ w: W, h: H, px: (x, y) => at(x, H - 1 - y) }),
    right: grid({ w: H, h: W, px: (x, y) => at(y, x) }),
    left: grid({ w: H, h: W, px: (x, y) => at(y, H - 1 - x) }),
  };
})();
function drawArrow(g, grid, x, y, col){
  const filled = (gx, gy) => gy >= 0 && gy < grid.length && gx >= 0 && gx < grid[0].length && grid[gy][gx] === '#';
  g.fillStyle = PAL.k;
  for (let gy = -1; gy <= grid.length; gy++) for (let gx = -1; gx <= grid[0].length; gx++)
    if (!filled(gx, gy) && (filled(gx - 1, gy) || filled(gx + 1, gy) || filled(gx, gy - 1) || filled(gx, gy + 1))) g.fillRect(x + gx, y + gy, 1, 1);
  g.fillStyle = col;
  for (let gy = 0; gy < grid.length; gy++) for (let gx = 0; gx < grid[0].length; gx++) if (grid[gy][gx] === '#') g.fillRect(x + gx, y + gy, 1, 1);
}
// Shortest route between maps over warps and doors (gating ignored: the chain's flags open the way). Cached; the graph is static.
const routeCache = new Map();
function routeExit(from, to){
  const key = from + '>' + to; if (routeCache.has(key)) return routeCache.get(key);
  const exits = id => ((WORLD[id] && WORLD[id].objs) || []).filter(o => (o.kind === 'warp' || o.kind === 'door') && o.to && WORLD[o.to]);
  let found = null;
  if (from !== to && WORLD[from] && WORLD[to]) {
    const prev = { [from]: null }, q = [from];
    while (q.length && !found) { const id = q.shift(); for (const o of exits(id)) { if (o.to in prev) continue; prev[o.to] = { id, o }; if (o.to === to) { found = o.to; break; } q.push(o.to); } }
    if (found) { let n = found; while (prev[n] && prev[n].id !== from) n = prev[n].id; found = prev[n] ? prev[n].o : null; }
  }
  routeCache.set(key, found); return found;
}
// Where an objective is on this map: its tile, or the exit toward it; null when nothing points anywhere.
// The first-wild guide picks its own grass tile.
function pointOnMap(q){
  if (!q || !q.target) return null;
  if (q.target.map === CUR.id) {
    const gw = q.follow === 'guide' ? wild.list.find(w => w.guide) : null;
    return gw ? { x: gw.x, y: gw.y, here: true } : { x: q.target.x, y: q.target.y, here: true };
  }
  const ex = routeExit(CUR.id, q.target.map); return ex ? { x: ex.x, y: ex.y, here: false } : null;
}
function restBedCue(){
  if (!CUR || !LANTERN_ROOMS[CUR.id]) return null;
  let best = null, bestD = 1e9;
  for (const o of CUR.objs) {
    if (o.kind !== 'prop' || o.sprite !== 'rest_bed' || !present(o)) continue;
    const d = Math.abs(o.x - S.world.x) + Math.abs(o.y - S.world.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  return best ? { x: best.x, y: best.y, here: true } : null;
}
function questPointOnMap(){ return pointOnMap(questCurrent()); }
const sideQuest = () => (S && typeof PPQuests !== 'undefined' && PPQuests.sideCurrent) ? PPQuests.sideCurrent(questState()) : null;
function sidePointOnMap(){ return pointOnMap(sideQuest()); }
function drawCuePoint(g, pt, col, cx, cy, t, VW, VH, shift){
  if (!pt) return;
  if (pt.x === Math.round(walk.fx) && pt.y === Math.round(walk.fy)) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bob = reduce ? 0 : (Math.floor(t / 280) % 2 ? 0 : 2);
  const X = pt.x * TS - cx, Y = pt.y * TS - cy;
  if (X > -TS && Y > -TS && X < VW && Y < VH) {
    if (Y - 13 >= 0) drawArrow(g, ARROW.down, X + 5 + shift, Y - 12 - bob, col);
    else drawArrow(g, ARROW.up, X + 5 + shift, Y + TS + 1 + bob, col);
    return;
  }
  const px = walk.fx * TS + 8 - cx, py = walk.fy * TS + 8 - cy, dx = X + 8 - px, dy = Y + 8 - py;
  const m = 6, kx = dx ? ((dx > 0 ? VW - m : m) - px) / dx : Infinity, ky = dy ? ((dy > 0 ? VH - m : m) - py) / dy : Infinity;
  const k = Math.min(kx, ky), ex = clamp(px + dx * k, m, VW - m), ey = clamp(py + dy * k, m, VH - m);
  const dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), gr = ARROW[dir];
  const nudge = reduce ? 0 : bob, ox = dir === 'right' ? nudge : dir === 'left' ? -nudge : 0, oy = dir === 'down' ? nudge : dir === 'up' ? -nudge : 0;
  drawArrow(g, gr, Math.round(ex - gr[0].length / 2 + ox + shift), Math.round(ey - gr.length / 2 + oy), col);
}
function drawObjectiveCue(g, cx, cy, t){
  if (!S || scene || walk.intro || (battle && battle.on) || fade.busy) return;
  const c = $('#mapCanvas'), VW = c.width, VH = c.height;
  if (lanternHold()) { drawCuePoint(g, restBedCue(), PAL.y, cx, cy, t, VW, VH, 0); return; }   // a wipe points at a bed, not the way out
  const main = questPointOnMap(), side = sidePointOnMap();
  drawCuePoint(g, main, PAL.y, cx, cy, t, VW, VH, 0);
  if (!side) return;
  const same = main && side.x === main.x && side.y === main.y;
  drawCuePoint(g, side, PAL.c, cx, cy, t, VW, VH, same ? 7 : 0);
}
const WART = buildWorldArt();
function drawObj(g, o, cx, cy, VW, VH, t){
  const q = objPos(o), fx = q.fx != null ? q.fx : q.x, fy = q.fy != null ? q.fy : q.y, X = Math.round(fx * TS - cx), Y = Math.round(fy * TS - cy);
  if (X < -18 || Y < -24 || X > VW + 2 || Y > VH + 2) return;
  if (o.kind === 'npc' || o.kind === 'trainer') {
    const face = mapRT.face[o.id] || q.facing || (o.kind === 'trainer' ? (TRAINERS[o.id] || {}).facing : o.facing) || 'down';
    const fr = q.moving ? Math.floor(t / (o.frozen ? 900 : 130)) % 2 : 0;
    const img = keeperFrames(npcLook(o))[face][fr];
    g.fillStyle = 'rgba(26,28,44,.35)'; g.fillRect(X + 2, Y + 14, 12, 2);
    if (o.frozen) {                          // a time echo: the same step, a pixel out of date
      const echo = Math.floor(t / 900) % 2 ? 1 : -1;
      g.globalAlpha = 0.35; g.drawImage(img, X - 1 + echo, Y - 2); g.globalAlpha = 0.9;
    }
    g.drawImage(img, X - 1, Y - 2); g.globalAlpha = 1;
  } else if (o.kind === 'sign') g.drawImage(WART.sign, X, Y);
  else if (o.kind === 'prop') { const a = WART[o.sprite]; if (a) g.drawImage(Array.isArray(a) ? a[Math.floor(t / 400) % 2] : a, X, Y); }
  else if (o.kind === 'pickup') g.drawImage(WART.pickup, X, Y - (Math.floor(t / 500) % 2));
  else if (o.kind === 'wild') { const [line, st] = String(o.form).split('/'), si = SP_INDEX[line]; if (si != null) g.drawImage(sprSet(si, +st || 0, (+o.faded || 0) > 0)[(t % 2800) < 120 ? 'b' : 'n'], X - 1, Y - 2 - (Math.floor(t / 600) % 2)); }
}

/* ---------- keeper (player) sprite: MAPS_SLICE K.1 ---------- */
// keeper.js composes 16x16 frames (keeperGrid); here they become 18x18 canvases with a 1px PAL.k outline like buildSprite,
// built once per look and cached (the Walk map only looks them up).
const lookOf = () => (S && S.player && S.player.look) || null;           // null = the default look
// Glimmerwell standing shows on the body: the Arbiter's emission has been in that bloodline a long time.
// Tier 0 is unchanged. Higher tiers pick up silver and mint. The save's look is not rewritten.
function shownLook(){
  const base = lookOf();
  if (!S || side() !== 'glimmer') return base;
  const tier = PPStanding.tierOf(standingOf('glimmer', false));
  if (!tier) return base;
  const L = Object.assign({}, KEEPER_LOOKS.defaults, base || {});
  L.accent = tier >= 4 ? 's' : 'c';
  if (tier >= 2) L.outfitCol = 's';
  if (tier >= 3) L.hairCol = 'h';
  return L;
}
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
function earlyBuddy(){
  if (!S || !pet() || !S.flags['story.starter_received'] || S.flags['story.early_done']) return false;
  const n = +S.flags['story.early_steps'] || 0;
  return n > 0 && n < 16;
}
function followerBob(t){                       // normal: twice per step / every 500 ms idle; Tired: half speed
  const p = pet(), moving = !!(fol.to && walk.to);
  let b;
  if (p && isFainted(p)) b = moving ? S.steps % 2 : Math.floor(t / 1000) % 2;   // napping after a faint: half-speed bob
  else b = moving ? Math.floor(walk.prog * 2) % 2 : Math.floor(t / 500) % 2;
  if (earlyBuddy()) b += Math.floor(t / 180) % 2;
  return b;
}
const followerAt = (tx, ty) => fol.x != null && followerOn() && ((fol.x === tx && fol.y === ty) || (Math.round(fol.fx) === tx && Math.round(fol.fy) === ty));
function toggleFollower(){
  S.settings.follower = S.settings.follower === false; placeFollower(); renderFollowerBtn(); save(); sfx('tap');
  toast(S.settings.follower ? 'Your partner walks with you.' : 'Your partner waits on the Partner tab.');
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
  ['outfit', '#lookOutfit', 'Outfit'], ['outfitCol', '#lookOutfitCol', 'Outfit colour'], ['accent', '#lookAccent', 'Accent'],
  ['accessory', '#lookAccessory', 'Accessory']];
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
      const on = d[slot] === opt; b.className = (slot === 'hair' || slot === 'outfit' || slot === 'accessory' ? 'preview' : 'swatch') + (on ? ' on' : '');
      b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', label + ': ' + (COLOUR_NAMES[opt] || opt));
      if (slot === 'hair' || slot === 'outfit' || slot === 'accessory') {
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
// A pushable dream prop follows a fixed circuit. Each bump pops and advances one tile. The last step runs rollScene.
function rollProp(o){
  if (!o || !o.roll || scene) return;
  const circuit = o.circuit || []; if (!circuit.length || !o.rollScene) return;
  if (S.flags['story.dream_toy']) return;
  const step = +S.flags[o.rollFlag] || 0;
  if (step >= circuit.length) { runScene(o.rollScene); return; }
  const nxt = circuit[(step + 1) % circuit.length], nx = nxt[0], ny = nxt[1];
  const q = objPos(o);
  if (solidTile(nx, ny) || (nx === S.world.x && ny === S.world.y) || blockerAt(nx, ny)) { sfx('denied'); return; }
  sfx('pop');
  mapRT.pos[o.id] = { x: nx, y: ny, fx: nx, fy: ny, facing: dirName(nx - q.x, ny - q.y) };
  S.flags[o.rollFlag] = step + 1; save();
  if (step + 1 >= circuit.length) runScene(o.rollScene);
}
// Mahopac's time-stuck people: one slow step along a short loop, then a long freeze.
function tickFrozen(t){
  if (!CUR || scene || fade.busy) return;
  for (const o of CUR.objs) {
    if (!o.frozen || !present(o) || !o.loop || !o.loop.length) continue;
    let q = mapRT.pos[o.id];
    if (!q) q = mapRT.pos[o.id] = { x: o.x, y: o.y, fx: o.x, fy: o.y, facing: o.facing || 'down', moving: false, next: t + 1200, step: 0 };
    if (q.to) {
      q.prog = Math.min(1, (t - q.t0) / 1400);
      q.fx = q.fromX + (q.to.x - q.fromX) * q.prog; q.fy = q.fromY + (q.to.y - q.fromY) * q.prog; q.moving = true;
      if (q.prog >= 1) {
        if (q.to.x === S.world.x && q.to.y === S.world.y) { q.fx = q.x; q.fy = q.y; q.to = null; q.moving = false; q.next = t + 600; }
        else { q.x = q.to.x; q.y = q.to.y; q.fx = q.x; q.fy = q.y; q.to = null; q.moving = false; q.next = t + 2800; }
      }
      continue;
    }
    if (t < (q.next || 0)) continue;
    q.step = ((q.step || 0) + 1) % o.loop.length;
    const nx = o.loop[q.step][0], ny = o.loop[q.step][1];
    if ((nx === q.x && ny === q.y) || solidTile(nx, ny) || (nx === S.world.x && ny === S.world.y) || blockerAt(nx, ny)) { q.next = t + 2800; continue; }
    q.fromX = q.x; q.fromY = q.y; q.to = { x: nx, y: ny }; q.t0 = t; q.prog = 0;
    q.facing = dirName(nx - q.x, ny - q.y); mapRT.face[o.id] = q.facing;
  }
}
function bumpObj(o, d, turned){
  if (o.roll) { rollProp(o); return; }
  if (o.kind === 'trainer' && !S.flags['trainer.' + o.id]) { interact(o); return; }   // an unbeaten trainer: its battle, never the hint
  if ((o.kind === 'npc' || o.kind === 'trainer') && bump.talked === o.id) { showBumpHint(o); return; }
  if (o.kind === 'prop' && !o.lines && !o.board) return;                             // silent props just block
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
function scenePlayed(id){ const fl = (sceneSteps(id) || []).filter(st => st[0] === 'setFlag'); return fl.length > 0 && fl.every(st => S.flags[st[1]]); }
function faceKeeper(o){ const q = objPos(o); mapRT.face[o.id] = dirName(S.world.x - q.x, S.world.y - q.y); }
// Talk (bump, tap, the Talk button, Space/Enter). Doors enter; trainers battle until beaten, then say their win line.
function interact(o){
  if (scene || fade.busy || !o) return;
  if (o.kind === 'door') { enterDoor(o); return; }
  if (o.booth) { openBooth(o); return; }
  if (o.roll) { rollProp(o); return; }
  const ctx = { npc: o };
  if (o.kind === 'npc' || o.kind === 'trainer') faceKeeper(o);
  if (o.kind === 'trainer') {
    const t = TRAINERS[o.id];
    if (!S.flags['trainer.' + o.id]) return runSteps([['battle', o.id]], ctx);
    return runSteps([['say', t.name, trainerLine(o.id, 'win')]], ctx);
  }
  if (o.kind === 'sign') return runSteps([['say', '', o.text]], ctx);
  if (o.board) return openTownBoard();
  if (o.shop) { if (!S.flags['story.starter_received']) return runSteps([['say', '', SHELF_EMPTY]], ctx); openShop(o.shop, shopHeading(o)); return; }
  if (o.kind === 'wild') return o.scene ? runScene(o.scene, ctx) : undefined;
  if (o.scene && !scenePlayed(o.scene)) return runScene(o.scene, ctx);
  const line = linesFor(o);
  if (line == null) return o.scene ? runScene(o.scene, ctx) : undefined;
  mapRT.talked.add(o.id);
  if (line[0] === '@') return runScene(line.slice(1), ctx);
  // BS: Glimmerwell's Pledge desk is Juniper's own panel (STANDING_CFG.switch.desks.glimmer), offered after her line.
  if (o.id === SC_STANDING.switch.desks.glimmer.npc && deskOpen('glimmer'))
    return runSteps([['say', objName(o), line], ['choice', SC_STANDING.switch.ask, [[SC_STANDING.switch.option, pledgeDeskSteps('glimmer')], ['Leave', []]]]], ctx);
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
    if (o) { const q = objPos(o); drawGlyph(g, 'emote_bang', Math.round(q.x * TS - cx) + 4, Math.round(q.y * TS - cy) - 15); }
  }
  const fp = pet();                                    // Zz over a napping (Fainted) follower (ICONS_SEALS Q6)
  if (fol.x != null && fp && followerOn() && isFainted(fp) && !scene) drawGlyph(g, 'emote_sleep', Math.round(fol.fx * TS - cx) + 4, Math.round(fol.fy * TS - cy) - 15);
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
function runScene(id, ctx){ const steps = sceneSteps(id); if (!steps) return Promise.resolve(); return runSteps(steps, Object.assign({ id, beat: id }, ctx || {})); }
async function runSteps(steps, ctx = {}){
  if (scene || !S) return;
  scene = { id: ctx.id || '', npc: ctx.npc || null, who: '', pending: [], view: { flags: {}, name: undefined, pet: ctx.viewPet || null, nick: undefined },
    vars: { tags: [], line: null, suggest: null }, skip: false, deferRespawn: false, toasts: [], boxes: 0 };
  walk.target = walk.path = walk.arrive = walk.queued = null; wild.chase = null;   // held d-pad/keys survive (§4.1 "holding into it after")
  hideBumpHint(); $('#chatBubble').hidden = true; lockTabs(true);
  $('#ovScene').hidden = false; document.body.classList.add('scene-on'); sbRender('', '');
  cueFactionMusic(ctx, steps);
  try { await execSteps(steps); if (ctx.beat) noteBeat(ctx.beat, 0); } catch (e) { if (e !== ABORT) console.error(e); }
  endScene();
}
// A Keeper's first meeting with Glimmerwell, and the walk-up to one of their battles, drops the town loop for the dark sting.
const GLIMMER_MEET = { glimmer1: 1, faded1: 1 };
function cueFactionMusic(ctx, steps){
  if (!scene || !S || side() === 'glimmer') return;
  const hit = (steps || []).find(st => Array.isArray(st) && st[0] === 'battle' && trainerFaction(st[1]) === 'glimmer');
  if (hit) {
    scene.musicCue = battleTrack('trainer', hit[1]);
    PPSound.music(scene.musicCue, { fadeOut: 180, fadeIn: 140 });
    return;
  }
  const id = (ctx && (ctx.id || ctx.beat)) || '';
  if (GLIMMER_MEET[id] && !S.flags['music.glimmer_met']) {
    scene.musicCue = 'glimmer_first';
    S.flags['music.glimmer_met'] = true;
    PPSound.music('glimmer_first', { fadeOut: 450, fadeIn: 500 });
  }
}
async function execSteps(steps){ for (const st of steps || []) { if (!scene) return; await execStep(st); } }
async function playScene(id){ const steps = sceneSteps(id); if (!steps) return; const n = storyWrites(); await execSteps(steps); noteBeat(id, n); }   // nested: `run` steps, onWin
function commitPending(){ const P = scene.pending; scene.pending = []; for (const f of P) f(); if (S && S.flags['story.side'] === 'glimmer') ensureCrackedPhone(); syncSide(); }
function endScene(){
  const sc = scene; if (!sc) return;
  const cue = sc.musicCue;
  commitPending();
  clearCast(sc);
  if (sc.npc) delete mapRT.face[sc.npc.id];
  if (sc.npc && (sc.npc.kind === 'npc' || sc.npc.kind === 'trainer')) bump.talked = sc.npc.id;
  scene = null; sbox.resolve = null; tabGuardUntil = performance.now() + TAB_GUARD_MS;
  $('#ovScene').hidden = true; document.body.classList.remove('scene-on'); $('#sbChoices').innerHTML = ''; $('#sbName').hidden = true;
  lockTabs(false); placeFollower(); renderKeeperName(); updateHUD(); save();
  sc.toasts.forEach((m, i) => setTimeout(() => toast(m), i * 1900));
  for (const o of CUR.objs) if (o.kind === 'trigger' && !(Math.abs(o.x - S.world.x) + Math.abs(o.y - S.world.y) <= (o.r || 0))) delete mapRT.trig[o.id];
  if (sc.deferRespawn) respawnAfterWipe();
  else {
    checkArriveTriggers();   // only triggers marked arrive (a dream warp landing on the next scene)
    if (allPets().length && !PPEnv.geoPref() && screen === 'walk') openGeoAsk();   // first walk with a partner: ask about location (once)
  }
  if (sc.id === 'rival1') placeGuide();
  if (cue && !(battle && battle.on) && PPSound.musicWant === cue) {
    const back = trackFor(CUR); if (back && back !== cue) PPSound.music(back, { fadeOut: 400, fadeIn: 500 });
  }
}
const pend = f => scene.pending.push(f);
// Scene cast: someone a scene brings into a room who has no map object there. MAPS_SLICE §8 `starter`: "The door bangs open.
// Rook skids in" (the Lodge has only Ilse, and outdoor rook_home lives on the Hearthmoor map), so nothing drew him. He appears on
// the first line that names him or that he speaks, just inside the door mat, facing the keeper, and leaves when the scene ends.
// A plain npc pushed into CUR.objs for the scene only: drawn, blocking and listed like any other; never saved.
const SCENE_CAST = { starter: [{ id: 'rook_lodge', name: 'Rook', look: 'rook', map: 'hm_lodge_in' }] };
function castOnSay(who, text){
  const cast = scene && SCENE_CAST[scene.id]; if (!cast) return;
  for (const c of cast) {
    if (c.map !== CUR.id || CUR.objs.some(o => o.id === c.id)) continue;
    if (who !== c.name && !new RegExp('\\b' + c.name + '\\b').test(text || '')) continue;
    const at = castSpot(); if (!at) continue;
    const dx = S.world.x - at.x, dy = S.world.y - at.y;
    const o = { kind: 'npc', id: c.id, name: c.name, look: c.look, x: at.x, y: at.y, cast: true,
      facing: Math.abs(dx) >= Math.abs(dy) && dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up') };
    CUR.objs.push(o); (scene.cast = scene.cast || []).push({ objs: CUR.objs, o });
  }
}
function castSpot(){                         // a free floor tile next to the door mat (the room's exit warp), else near it
  const mat = CUR.objs.find(o => o.kind === 'warp') || { x: S.world.x, y: S.world.y + 1 };
  const free = (x, y) => !solid(x, y) && !(x === S.world.x && y === S.world.y) && !(x === fol.x && y === fol.y);
  for (const [dx, dy] of [[1, -1], [-1, -1], [0, -1], [2, -1], [-2, -1], [1, -2], [-1, -2]]) if (free(mat.x + dx, mat.y + dy)) return { x: mat.x + dx, y: mat.y + dy };
  return null;
}
function clearCast(sc){ for (const { objs, o } of sc.cast || []) { const i = objs.indexOf(o); if (i >= 0) objs.splice(i, 1); } sc.cast = null; }
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
    case 'say': { if (sc.skip) return; sc.who = a; const tx = expand(b); sc.lastSay = tx; castOnSay(a, tx); await sayBox(a, tx); return; }
    case 'choice': {
      sc.skip = false;
      const opts = b.filter(o => o[3] == null || [].concat(o[3]).every(x => cond(x, true)));   // WP-B0: optional 4th element `when` hides an option until earned
      if (!opts.length) return;
      const pick = await choiceBox(expand(a), opts.map(o => o[0]));
      const opt = opts[pick]; if (opt[2]) sc.vars.tags.push(opt[2]);
      $('#sbEcho').textContent = '\u203a ' + opt[0];
      await execSteps(opt[1]); return;
    }
    case 'nameEntry': { sc.skip = false; await nameBox(a, expand(b), c, d); return; }
    case 'showBasket': { sc.skip = false; sc.vars.suggest = suggestLine(sc.vars); sc.vars.line = await basketPick(a, sc.vars.suggest); sfx('befriend'); return; }
    case 'givePet': {
      const id = a === '$line' ? sc.vars.line : a, si = SP_INDEX[id]; if (si == null) return;
      const np = newPet(si, 0, 'starter'); np.metPlace = 'Hearthmoor'; sc.view.pet = np; sc.view.nick = undefined;
      pend(() => { S.party.push(np); S.partnerId = np.id; markCaught(si, 0); scene && scene.toasts.push((cleanNick(scene.view.pet === np && scene.view.nick) || petName(np)) + ' joined you!'); });   // the nickname given later in the same scene, else the species
      return;
    }
    case 'setFlag': { const v = b === '$line' ? sc.vars.line : b; sc.view.flags[a] = v; pend(() => { S.flags[a] = v; }); return; }
    case 'inc': { const n = (Number(flagOf(a, true)) || 0) + (b == null ? 1 : Number(b) || 0); sc.view.flags[a] = n; pend(() => { S.flags[a] = n; }); return; }   // WP-B0 counters (Rook bond)
    // BS: ["standing", side, n | null, oneShotId?]. null n = STANDING_CFG.grants[oneShotId]. With an id, `standing.got.<id>`
    // guards the grant so a replayed scene never grants twice. Buffered like setFlag; cond() sees the live value meanwhile.
    case 'standing': {
      if (!PPStanding.isSide(a)) return;
      const n = b == null ? (SC_STANDING.grants[c] | 0) : (Number(b) || 0), got = c ? 'standing.got.' + c : null;
      if (!n || (got && flagOf(got, true))) return;
      if (got) sc.view.flags[got] = true;
      sc.view.standing = sc.view.standing || {}; sc.view.standing[a] = PPStanding.clampPts(standingOf(a, true) + n);
      pend(() => { if (got) { if (S.flags[got]) return; S.flags[got] = true; } addStanding(a, n); });
      return;
    }
    // BS: ["pledge", side, free?]: switch the pledge to `side` (the Pledge desk's Yes). Buffered; later lines see the new side.
    case 'pledge': { if (!PPStanding.isSide(a)) return; sc.view.flags['story.side'] = a; pend(() => { switchSide(a, { free: !!b }); }); return; }
    case 'give': if (ITEMS[a] && (b | 0) > 0) sfx('stinger_item'); pend(() => { const r = grantItem(a, b | 0); if (r.lost) { if (scene) scene.toasts.push(BAG_FULL_MSG); else toast(BAG_FULL_MSG); } }); return;
    case 'respawnHere': { const r = outdoorId(); pend(() => { if (r === 'hearthmoor' || r === 'fernbrook' || r === 'cobblecrest' || r === 'highcharity') S.world.respawn = r; }); return; }
    case 'play': {
      sc.skip = false;
      $('#ovScene').hidden = true;
      let res = { quit: true, clear: false, score: 0 };
      try {
        res = await PPMinigames.play(a, {
          onOpen: () => { try { PPSound.music('arcade', { fadeOut: 180, fadeIn: 180 }); } catch (e) {} },
          onClose: () => { const th = trackFor(CUR); if (th) PPSound.music(th, { fadeOut: 180, fadeIn: 220 }); },
        });
      } catch (e) { res = { quit: true, clear: false, score: 0 }; }
      if (!scene) return;
      $('#ovScene').hidden = false; document.body.classList.add('scene-on'); sbRender('', '');
      for (const [who, text] of PPMinigames.finish(a, res)) { if (!scene) return; await sayBox(who, expand(text)); }
      return;
    }
    // Lantern rest only (home naps stay on `rest`, free). Heals the whole party. A hurt party pays LANTERN_REST_COST;
    // a shortfall is covered so a wipe at 0 Acorns cannot trap you. Sets scene.view flag lantern.rest for the next line.
    case 'payRest': {
      if (!partyNeedsLanternRest()) { sc.view.flags['lantern.rest'] = 'full'; setRestDue(false); sfx('rest'); return; }
      if ((S.money | 0) >= LANTERN_REST_COST) { S.money = (S.money | 0) - LANTERN_REST_COST; sc.view.flags['lantern.rest'] = 'paid'; }
      else sc.view.flags['lantern.rest'] = 'covered';
      S.party.forEach(q => restPet(q, 'full')); setRestDue(false); sfx('rest'); return;
    }
    case 'lookPick': {
      sc.skip = false;
      const lk = await lookPickStep(sc.id === 'intro');
      if (lk) { sc.view.look = lk; pend(() => { S.player.look = lk; }); }
      return;
    }
    case 'rest': sfx('rest'); pend(() => { S.party.forEach(q => restPet(q, 'full')); scene && scene.toasts.push('Your team is rested.'); }); return;
    case 'run': await playScene(a); return;
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
    // Build 3: ["seal", id] grants a lanyard without a battle (the Tour's skip path). A Hall win already set it and showed the card.
    case 'seal': {
      const id = a; if (!id || !SEAL_ART[id]) return;
      const already = !!(S.seals && S.seals[id]);
      pend(() => { if (!S.seals[id]) S.seals[id] = Date.now(); });
      if (sc.skip || already || (battle && battle.on)) return;
      await presentFieldSeal(id);
      return;
    }
    case 'bond': { const n = Number(a) || 0; if (n) pend(() => { const p = pet(); if (p) addBond(p, n); }); return; }
    case 'sfx': { if (a) sfx(a); return; }
    case 'chirp': { const p = viewPet(); if (p) sfx(chirpName(p)); return; }
    case 'warp': {
      if (!a || !WORLD[a]) return;
      commitPending();   // the position save inside the warp must not outrun this scene's flags
      await new Promise(res => {
        const at = { map: a, x: b | 0, y: c | 0, facing: d || 'down' };
        if (fade.busy) { arriveAt(at); res(); return; }
        warpTo(at, res);
      });
      return;
    }
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
  syncSide();                                          // a `setFlag story.side` earlier in this scene picks the side's trainer
  const t = TRAINERS[id]; if (!t) return;
  commitPending(); save();
  const team = trainerTeam(t), f0 = team[0], [ln, st] = f0.form.split('/');
  const sub = s => String(s).replace(/\{(player|name)\}/g, playerName());
  const intro = trainerLine(id, 'intro');
  if (scene.lastSay !== sub(intro)) await sayBox(t.name, sub(intro));   // the Hall panel already opened with it
  await sayBox('', battleLine('trainerSummon', { trainer: t.name, foe: nameOf(SP_INDEX[ln], +st) }));
  $('#ovScene').hidden = true;
  S.flags['spotted.' + id] = true;                     // §6.1: set when the battle opens; a trainer never spots twice
  const res = await new Promise(resolve => { if (!openBattle({ kind: 'trainer', trainerId: id, mapIntro: true, onEnd: resolve })) resolve(null); });
  if (!scene) return;
  $('#ovScene').hidden = false; document.body.classList.add('scene-on'); sbRender('', '');
  if (res == null) throw ABORT;
  if (res === 'tired') scene.deferRespawn = true;
  if (res === 'win' && t.onWin && sceneSteps(t.onWin)) await playScene(t.onWin);
  if (res === 'win' && id === 'hc_tourney') await grantTourneyPrize();
}
async function grantTourneyPrize(){
  const key = weekKey();
  if (S.flags['weekly.hc_tourney'] === key) { await sayBox('Clerk Nia', "You already have this week's ribbon. The match was still lovely."); return; }
  const r = grantItem('hearty_snack', 1);
  if (r.added < 1) { await sayBox('Clerk Nia', "Your bag can't hold the snack. Make room and the prize will wait."); return; }
  S.money = (S.money || 0) + 40;
  S.flags['weekly.hc_tourney'] = key;
  sfx('stinger_item'); save();
  await sayBox('Clerk Nia', "This week's prize is a Hearty Snack and 40 Acorns.");
}
function openDuo(o){
  const who = o.name || '';
  if (!S.flags['story.hc_invite']) return runSteps([['say', '', "The booths are covered. A note: bring Ilse's letter, then come play."]], { npc: o });
  if (!pet()) return runSteps([['say', who, 'Come back with your Walkling.']], { npc: o });
  const c = careDay();
  const games = [['Rope Hop', 'hop'], ['Flag Relay', 'relay'], ['Sniff Seek', 'seek']].filter(([, id]) => (c.mg[id] || 0) < 3);
  if (!games.length) return runSteps([['say', who, 'The two-keeper booth is tired. Come back tomorrow.']], { npc: o });
  return runSteps([
    ['say', who, 'Pass the phone. Your Walkling takes the left. A friend takes the right.'],
    ['choice', 'Which game?', games.map(([label, id]) => [label, [['play', id]]]).concat([['Not now', [['say', who, "We'll keep your seat."]]]])],
  ], { npc: o });
}
function openBooth(o){
  if (!o || !o.booth) return;
  if (o.booth === 'duo') return openDuo(o);
  if (!PPMinigames.RULE[o.booth]) return;
  const id = o.booth, who = o.name || '';
  if (!S.flags['story.hc_invite']) return runSteps([['say', '', "The booths are covered. A note: bring Ilse's letter, then come play."]], { npc: o });
  if (!pet()) return runSteps([['say', who, 'Come back with your Walkling.']], { npc: o });
  if ((careDay().mg[id] || 0) >= 3) return runSteps([['say', who, 'This booth is tired. Come back tomorrow.']], { npc: o });
  return runSteps([
    ['say', who, PPMinigames.RULE[id]],
    ['choice', 'Play a round?', [
      ['Play', [['play', id]]],
      ['Not now', [['say', who, "We'll keep your seat."]]],
    ]],
  ], { npc: o });
}
// A story creature (map obj kind 'wild'): a wild battle with its own form, level, moves, faded state and befriend bonus.
async function sceneEncounter(id){
  const o = CUR.objs.find(x => x.id === id); if (!o) return;
  commitPending(); save();
  $('#ovScene').hidden = true;
  const res = await new Promise(resolve => { if (!openBattle({ kind: 'wild', form: o.form, level: o.level, moves: o.moves, faded: o.faded, bonus: o.befriendBonus, story: o.id, onEnd: resolve })) resolve(null); });
  if (!scene) return;
  $('#ovScene').hidden = false; document.body.classList.add('scene-on'); sbRender('', '');
  if (res == null) throw ABORT;
  if (res === 'tired') scene.deferRespawn = true;
}
const trainerTeam = t => t.team || (t.counterTeam && (t.counterTeam[S.flags['story.starter_line']] || t.counterTeam.ember)) || [];

/* --- the bottom text box (#ovScene) --- */
function sbRender(who, text){
  const key = who && LOOK_OF_NAME[who];
  const look = key ? npcLook({ look: key, name: who }) : null;
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
for (const src of [MD.act1_route2, MD.cobblecrest]) if (src && src.spawnTables) for (const [k, v] of Object.entries(src.spawnTables)) if (!k.startsWith('_')) SPAWNS[k] = v;
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
// w.lv: a first form rolls uniformly in its table row's range. A second form on Route 1 / Fernbrook stays Lv 6-8.
// On a high-level table (row min above 8: Route 2, Wickerglen, the quarry) the second form uses that same range.
function wildLv(sp, stage, key = spawnKey()){
  const row = SPAWNS[key] && SPAWNS[key].table.find(r => r[0] === SPECIES[sp].id);
  if (row && (!stage || row[2] > 8)) return row[2] + Math.floor(Math.random() * (row[3] - row[2] + 1));
  return wildLevel(stage, Math.random, 'proto', SPECIES[sp].id);
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
// One nearby wild on Hearthmoor after Rook's first battle, until it is met or the keeper already has a second friend.
const GUIDE_SPOTS = [[20, 9], [18, 9], [19, 7], [18, 7]];
function placeGuide(){
  if (!S || CUR.id !== 'hearthmoor' || !S.flags['story.rival1_done'] || S.flags['story.first_wild_met'] || allPets().length >= 2) return null;
  if (wild.list.some(w => w.guide)) return null;
  const spot = GUIDE_SPOTS.find(([x, y]) => {
    const ch = tileAt(x, y);
    return (ch === 'g' || ch === 't' || ch === 'f') && !solid(x, y) && !playerOn(x, y) && !wildAt(x, y) && !(fol.x === x && fol.y === y);
  });
  if (!spot) return null;
  const id = COUNTER[S.flags['story.starter_line']] || 'tide', sp = SP_INDEX[id];
  if (sp == null) return null;
  const w = spawnWild(sp, 0, spot);
  if (!w) return null;
  w.lv = 3; w.guide = true; w.life = 1e12;
  return w;
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
    if (!w.guide && c - w.born > w.life && !chased) { removeWild(w, onScreen(w)); continue; }       // wandered off
    const far = Math.abs(w.x - S.world.x) > 11 || Math.abs(w.y - S.world.y) > 9;
    if (!w.guide && far && !onScreen(w) && c - w.born > 20000) { removeWild(w, false); continue; }
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
  if (w.guide) drawGlyph(g, 'spark', x + 4, y0 - 7 - (Math.floor(tt / 280) % 2));
  const gx = Math.round(w.fx), gy = Math.round(w.fy);
  if (MAP[gy] && MAP[gy][gx] === 't') g.drawImage(TILES.t, 0, 10, 16, 6, gx*TS - cx, gy*TS - cy + 10, 16, 6);
  if (w.stage > 0 && Math.floor(tt / 350) % 5 === 0) drawGlyph(g, 'spark', x + 14, y0 - 2);   // rare form twinkle
}

// Dream maps (Mahopac memories): a plum wash and slow sparks, indoors or out. The keeper is drawn smaller.
function drawDream(g, VW, VH, t){
  if (!CUR || !CUR.dream) return;
  g.fillStyle = 'rgba(93,39,93,.28)'; g.fillRect(0, 0, VW, VH);
  g.fillStyle = 'rgba(115,239,247,.12)'; g.fillRect(0, 0, VW, VH);
  g.fillStyle = 'rgba(244,244,244,.9)';
  for (let i = 0; i < 16; i++) {
    const r = WX_RND, sp = 0.008 + r[(i * 3 + 2) % 360] * 0.016;
    const y = (r[(i * 3 + 1) % 360] * (VH + 4) + t * sp) % (VH + 4) - 2;
    const x = (r[(i * 3) % 360] * VW + Math.sin(t / 1400 + i) * 6) % VW;
    g.fillRect(x | 0, y | 0, 1, 1);
    if (r[(i * 3 + 2) % 360] > 0.55) g.fillRect((x | 0) + 1, (y | 0), 1, 1);
  }
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
  $('#envBadge').setAttribute('aria-label', wildy ? name + '. Around here: ' + ENV.label + ' (' + (STATUS_TAG[ENV.status] || '') + '). Tap for details.' : name + '. Tap for location details.');
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
    else if (e.source === 'location') toast('Around here: ' + e.label);
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
// Mid-battle the bench can step in with HP left and no faint nap. NRG under 10 still blocks *starting* a battle
// (canBattle), but it must not: a playtest had the starter faint and the rest of the party, still standing, skipped,
// with the loss line saying the whole party had fainted.
const canStepIn = p => !!p && !isFainted(p) && hpOf(p) > 0;
// Lead = the partner if able, else the party member marked relief if able, else the first able party member.
function leadPet(){
  const p = pet();
  if (ablePet(p)) return p;
  const relief = S.party.find(q => q.deploy && q.deploy.relief === true && ablePet(q));
  return relief || S.party.find(ablePet) || null;
}
function noBattleToast(){
  sfx('denied');
  toast(S.party.some(canStepIn) ? 'Your team is too sleepy. REST first!' : 'Your team needs a rest first!');
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
  // WP-A: the Hearthmoor guide wild keeps a gentle first befriend (+guide bonus, no wary hint).
  openBattle({ kind: 'wild', form: SPECIES[nx.sp].id + '/' + nx.stage, level: lv, wid: nx.wid, moves: w && w.moves, guide: !!(w && w.guide), bonus: w && w.guide ? BEFRIEND_TUNE.guide : 0 });
}

const battle = { on: false, id: 0, kind: 'wild', trainerId: null, wid: null, foes: [], fi: 0, me: null, uses: {}, participants: [],
  fainted: new Set(), tries: BEFRIEND_TRIES, failedRuns: 0, turn: 0, state: 'IDLE', panel: 'busy', treat: false, result: null,
  newId: null, rng: Math.random, textMs: null, fx: [], levelUps: [], foeHealUsed: false, log: [] };
let msgSkip = null;
const alive = id => battle.on && battle.id === id;
function curFoe(){
  const B = battle;
  if (B.group && B.slots && B.slots.length) {
    let i = B.slots[B.aim];
    if (!B.foes[i] || B.foes[i].hp <= 0) {
      const s = B.slots.findIndex(j => B.foes[j] && B.foes[j].hp > 0);
      if (s >= 0) { B.aim = s; i = B.slots[s]; }
    }
    return B.foes[i] || B.foes[0];
  }
  return B.foes[B.fi];
}
const groupLiving = () => !!(battle.group && battle.slots && battle.slots.some(i => battle.foes[i] && battle.foes[i].hp > 0));
const activePet = () => battle.me && petById(battle.me.petId);
function makeFoe(form, level, moveIds, opener){
  const [line, st] = form.split('/'), si = SP_INDEX[line], stage = +st, s = statsAt(form, level);
  const ids = (moveIds && moveIds.length ? moveIds : defaultMoves(form, level)).filter(id => MOVES[id]).slice(0, 4);
  return { form, si, species: line, stage, level, type: SPECIES[si].type, maxHp: s.hp, hp: s.hp, stats: s,
    stages: { atk: 0, def: 0, spd: 0 }, opener: opener || null, acted: false,
    moves: (ids.length ? ids : ['wobble']).map(id => ({ id, uses: MOVES[id].uses == null ? Infinity : MOVES[id].uses })) };
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
// Soft Berry: one heal when a foe's hit crosses from at least half HP to under half, still standing.
function applySoftBerry(p, before){
  if (!p || p.held !== 'soft_berry') return false;
  const max = maxHpOf(p), after = hpOf(p);
  if (!(before >= max / 2 && after > 0 && after < max / 2)) return false;
  setMyHp(p, after + Math.ceil(0.25 * max));
  delete p.held;
  return true;
}

/* --- open / close --- */
function openBattle(o){
  const lead = leadPet();
  if (!lead) { noBattleToast(); return false; }
  clearMoves(); closeSheet(null);
  const B = battle; B.id++;
  Object.assign(B, { on: true, kind: o.kind, trainerId: o.trainerId || null, wid: o.wid || null, fi: 0, uses: {}, participants: [],
    fainted: new Set(), tries: BEFRIEND_TRIES, failedRuns: 0, turn: 0, state: 'INTRO', treat: false, result: null, newId: null, journalNew: null,
    fx: [], levelUps: [], foeHealUsed: false, log: [], storyMoves: !!(o.moves && o.moves.length), story: o.story || null, bonus: +o.bonus || 0, faded: +o.faded || 0, guide: !!o.guide, wary: false,
    group: false, slots: null, aim: 0, bench: 0, ally: null, allyName: '' });
  B.mapIntro = !!o.mapIntro; B.onEnd = o.onEnd || null;           // mapIntro: the intro + summon lines were already said in the map text box (§6.1)
  if (o.kind === 'trainer') B.foes = trainerTeam(TRAINERS[o.trainerId]).map(m => makeFoe(m.form, m.level, m.moves, m.opener));
  else { B.foes = [makeFoe(o.form, o.level, o.moves)]; if (B.faded) B.foes[0].faded = B.faded; }
  B.participants = B.foes.map(() => new Set());
  B.me = { petId: lead.id, stages: { atk: 0, def: 0, spd: 0 }, mood: null };
  B.participants[0].add(lead.id);
  // Group battle: two foes on the field at once. The rest wait on the bench. An optional ally Walkling fights beside you.
  if (o.kind === 'trainer') {
    const t = TRAINERS[o.trainerId];
    if (t && t.group && B.foes.length >= 2) {
      B.group = true; B.slots = [0, 1]; B.aim = 0; B.bench = 2;
      B.participants[1].add(lead.id);
    }
    if (t && t.ally && TRAINERS[t.ally]) {
      const am = trainerTeam(TRAINERS[t.ally])[0];
      if (am) { B.ally = makeFoe(am.form, am.level, am.moves); B.allyName = TRAINERS[t.ally].name; }
    }
  }
  const f = curFoe(); markSeen(f.si, f.stage); save();
  enc.open = false; enc.speed = befriendSpeed(f.stage, f.level);   // WP-A: faster marker at higher levels (+1.2%/Lv, cap +35%)
  $('#encName').hidden = true; $('#btMsg').textContent = '';
  $('#btTwinkle').hidden = !(o.kind === 'wild' && f.stage > 0);
  renderBattleCards(); setPanel('busy');
  $('#ovBattle').hidden = false; lockTabs(true); fitAll(); fitBattle();
  PPSound.music(takeBattleTrack(o.kind, o.trainerId), { fadeOut: 150, delay: 350, fadeIn: 100 });
  battleIntro(B.id);
  return true;
}
const DEPLOY_CALLS = ['charge', 'brace', 'dart', 'greet'];
const CALL_STAT = { charge: 'atk', brace: 'def', dart: 'spd' };
const CALL_STOCK = { charge: 'rushes in!', brace: 'plants its feet!', dart: 'slips in ahead!', greet: 'looks ready to make a friend!' };
const CALL_LABEL = { charge: 'Charge', brace: 'Brace', dart: 'Dart', greet: 'Greet' };
function bumpStage(st, stat, n){
  const cur = st[stat] || 0, nx = clamp(cur + n, -3, 3);
  if (nx !== cur) st[stat] = nx;
  return nx !== cur;
}
// Stages on the way in. A bracer doubles Charge/Brace/Dart (or ATK +1 otherwise) and does not also add the call's +1.
// The spoken line is the stock call line with a bracer; otherwise deploy.line when the player wrote one.
async function applyEntrance(p, id){
  const B = battle;
  if (!B.on || !B.me || !p) return;
  const call = p.deploy && DEPLOY_CALLS.includes(p.deploy.call) ? p.deploy.call : null;
  const bracer = p.held === 'bracer_band';
  if (!bracer && !call) return;
  const st = B.me.stages;
  let rose = false;
  if (bracer) {
    if (call === 'charge') rose = bumpStage(st, 'atk', 2);
    else if (call === 'brace') rose = bumpStage(st, 'def', 2);
    else if (call === 'dart') rose = bumpStage(st, 'spd', 2);
    else rose = bumpStage(st, 'atk', 1);
  } else if (CALL_STAT[call]) rose = bumpStage(st, CALL_STAT[call], 1);
  if (rose) { B.fx.push({ who: 'me', kind: 'up', t0: now(), dur: 700 }); sfx('statUp'); }
  renderBattleCards();
  const custom = !bracer && p.deploy && typeof p.deploy.line === 'string' && p.deploy.line ? p.deploy.line : '';
  const text = custom || (petName(p) + ' ' + (CALL_STOCK[call] || CALL_STOCK.charge));
  await say(text, id == null ? B.id : id);
}
async function battleIntro(id){
  const B = battle, p = activePet(), t = tr();
  sendOutFx('foe');
  if (B.kind === 'trainer') {
    if (!B.mapIntro) {                                                       // debug forceTrainer only: no map text box to say them in
      await say(t.name + ': ' + trLine(trainerLine(B.trainerId, 'intro')), id);   // MAPS_SLICE §6.1 summon sequence
      if (!alive(id)) return; await say(btLine('trainerSummon'), id); if (!alive(id)) return;
    }
    await say(btLine('trainerIntro'), id);
    if (!alive(id)) return; sendOutFx('me'); B.meShown = true;
    await say(btLine('playerSend'), id);
    if (alive(id)) await applyEntrance(activePet(), id);
    if (alive(id) && B.group) {
      await say('Two at once. You move first. TARGET picks who you hit.', id);
      if (alive(id) && B.ally) await say(B.allyName + ' sends ' + foeName(B.ally) + ' in beside you.', id);
    }
  } else {
    await say(btLine('wildAppear'), id);
    if (!alive(id)) return; sendOutFx('me'); B.meShown = true;
    await say(btLine('wildSend', { pet: petName(p) }), id);
    if (alive(id)) await applyEntrance(activePet(), id);
  }
  if (alive(id)) toChoose();
}
function closeBattle(){
  const B = battle; if (!B.on) return;
  if (B.result === 'befriended' && B.newId && !$('#encName').hidden) {   // optional nickname (skip = species name); never read while the row is hidden (a faded one is named later)
    const p = petById(B.newId), nk = cleanNick($('#encNick').value);
    if (p && nk && nk !== nameOf(spi(p), p.stage)) { p.nick = nk; toast(nameOf(spi(p), p.stage) + ' is now called ' + nk + '!'); }
  }
  $('#encName').hidden = true; $('#encNick').value = ''; $('#encNick').blur(); $('#btSeal').hidden = true;   // no nickname carries over to the next befriend
  const f2 = $('#btFoe2Row'), al = $('#btAllyRow'), aim = $('#btAim');
  if (f2) f2.hidden = true; if (al) al.hidden = true; if (aim) aim.hidden = true;
  B.on = false; B.state = 'IDLE'; msgSkip = null; closeSheet(null);
  $('#ovBattle').hidden = true; lockTabs(false);
  const w = B.wid && wild.list.find(o => o.id === B.wid);
  if (w) {
    if (B.result === 'befriended') removeWild(w, false);                       // it joined you
    else if (B.result === 'win' || B.result === 'fled') removeWild(w, true);   // it wandered off
    else { w.idleUntil = 0; w.shyUntil = wild.clock + 1500; }                   // run / team wipe: it stays and scoots away
    if (w.guide && (B.result === 'befriended' || B.result === 'win' || B.result === 'fled')) S.flags['story.first_wild_met'] = true;
  }
  const cele = B.journalNew; B.journalNew = null;
  if (B.result === 'run') toast('You slipped away safely.');
  const onEnd = B.onEnd; B.onEnd = null;
  musicHold = true;
  if (B.result === 'tired' && !onEnd) respawnAfterWipe();   // in a scene the respawn waits for the scene's end (§6 rival1)
  musicHold = false;
  updateHUD(); save();
  if (onEnd) onEnd(B.result);
  const back = trackFor(CUR); if (back) PPSound.music(back, { fadeOut: 300, minDelay: 800, fadeIn: 600, restart: true, afterStingers: true });
  if (cele && !onEnd && !scene) openJournalEntry(Object.assign({ celebrate: true }, cele));
}
// A Lantern House rest heals the whole party. Hurt Walklings cost a few Acorns (OPEN_DECISIONS D28). Home naps stay free (`rest`).
const LANTERN_REST_COST = 5;
const LANTERN_ROOMS = { hm_lantern_in: 1, cc_lantern_in: 1, hc_lantern_in: 1 };
function partyNeedsLanternRest(){ return !!(S && S.party && S.party.some(p => Number.isFinite(p.hpNow))); }
function setRestDue(on){ if (!S || !S.world) return; if (on) S.world.restDue = true; else delete S.world.restDue; }
// After a wipe, the party has to rest before leaving. Clears itself once nobody is hurt (regen, a debug heal).
function lanternHold(){
  if (!S || !S.world || S.world.restDue !== true) return false;
  if (!partyNeedsLanternRest()) { setRestDue(false); save(); return false; }
  return true;
}
function lanternDoorHere(){
  if (!S || !CUR) return null;
  return CUR.objs.find(o => o.kind === 'door' && o.panel === 'lantern' && present(o) && o.x === S.world.x && o.y === S.world.y) || null;
}
function lanternRestOption(){
  const hurt = partyNeedsLanternRest();
  const label = hurt ? 'Rest (' + LANTERN_REST_COST + ' Acorns)' : 'Rest a while';
  return [label, [
    ['payRest'], ['respawnHere'],
    ['if', 'lantern.rest=paid',
      [['say', '', 'You leave ' + LANTERN_REST_COST + ' Acorns. You all doze in the lantern glow. Your team is rested.']],
      [['if', 'lantern.rest=covered',
        [['say', '', "You're short on Acorns. The keeper covers the fee, and everyone wakes up rested."]],
        [['say', '', 'Your team is already rested. This Lantern House will remember you.']]]]],
  ]];
}
function lanternBedSteps(){
  const hold = lanternHold();
  const opts = [lanternRestOption(), hold
    ? ['Not yet', [['say', '', 'The door stays shut until the party is rested. Face a bed and talk to it.']]]
    : ['Not now', []]];
  return [
    ['say', '', hold
      ? 'Your team is worn out. These beds rest everyone, for ' + LANTERN_REST_COST + ' Acorns.'
      : 'Three soft beds under a warm lantern.'],
    ['if', 'story.starter_received',
      [['choice', hold ? 'Rest the whole party?' : 'Let your team rest?', opts]],
      [['say', '', 'The beds look cosy, but you have no one to tuck in yet.']]],
  ];
}
// Stepped onto the exit mat while the party still owes a rest. After they rest, the step they were blocked from finishes.
function blockLanternExit(){
  clearMoves(); sfx('denied');
  const map = CUR.id;
  runSteps(lanternBedSteps(), { id: 'lantern_rest' }).then(() => {
    if (scene || fade.busy || !S || CUR.id !== map || lanternHold()) return;
    const wp = warpAt(S.world.x, S.world.y);
    if (wp && !(wp.need && !cond(wp.need, false))) warpTo({ map: wp.to, x: wp.tx, y: wp.ty, facing: wp.facing });
  });
}
// The design JSON still says the rest is free. Players read the cost, so the signs are patched here.
(function patchLanternSigns(){
  const put = (map, id, text) => { const o = WORLD[map] && WORLD[map].objs.find(x => x.id === id); if (o) o.text = text; };
  const n = LANTERN_REST_COST;
  put('hearthmoor', 'hm_sign_lantern', 'LANTERN HOUSE · Rest the whole party. ' + n + ' Acorns.');
  put('hm_lantern_in', 'lantern_note', 'A note on the shelf: "Rest the whole party. ' + n + ' Acorns. — I."');
  put('cc_lantern_in', 'cc_lantern_note', 'A note by the door: "Rest the whole party. ' + n + ' Acorns. The quarry is dusty. — Cobblecrest"');
})();
// §7.2 team wipe: back to world.respawn's Lantern House (Hearthmoor: inside, by the beds; INTERIORS slicePatch respawnIn).
// Nothing lost. Nobody is healed until they rest the whole party, and the way out stays shut until they do.
function respawnAfterWipe(){
  const id = WORLD[S.world.respawn] ? S.world.respawn : 'hearthmoor', m = WORLD[id];
  const at = m.respawnIn ? m.respawnIn : Object.assign({ map: id }, m.respawn || m.safe);
  setRestDue(true); clearMoves(); arriveAt(at);
  const door = lanternDoorHere();
  if (door) openPlace(door);
  else runSteps(lanternBedSteps(), { id: 'lantern_rest' });
}
// Lantern House REST / interior `rest` step (Phase M calls this): every party pet to full HP, naps cleared.
function lanternRest(){ S.party.forEach(q => restPet(q, 'full')); updateHUD(); save(); }
function healTeam(){ S.party.concat(S.box).forEach(q => { delete q.hpNow; delete q.faintUntil; }); updateHUD(); save(); }
let sealWait = null;   // resolves the field Seal card (Tour skip); the battle card uses the battle's own OK
function dismissSealCard(){ if (!sealWait) return false; const f = sealWait; sealWait = null; f(); return true; }
function battleKey(e){
  if (sealWait && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); sfx('tap'); dismissSealCard(); return; }
  if (skipMsg() && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); return; }
  if (e.key === 'Escape') {
    if (!$('#ovSheet').hidden && !$('#shCancel').hidden) { closeSheet(null); return; }
    if (battle.panel === 'fight') { setPanel('acts'); return; }
    if (battle.panel === 'bef') { leaveBefriendBar(); return; }
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
  const aim = $('#btAim'); if (aim) aim.hidden = !(battle.group && battle.on);
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
  const row = $('#btFoe2Row');
  if (row) {
    let other = null;
    if (B.group && B.slots) B.slots.forEach((fi, s) => { if (s !== B.aim && B.foes[fi] && B.foes[fi].hp > 0) other = B.foes[fi]; });
    row.hidden = !other;
    if (other) {
      $('#btFoe2Name').textContent = foeName(other) + '  Lv ' + other.level;
      const h = $('#btFoe2Hp'); h.style.width = (100 * other.hp / other.maxHp) + '%'; h.classList.toggle('warn', other.hp / other.maxHp < 0.25);
    }
  }
  const allyRow = $('#btAllyRow');
  if (allyRow) {
    const a = B.ally;
    allyRow.hidden = !(a && a.hp > 0);
    if (a && a.hp > 0) {
      $('#btAllyName').textContent = (B.allyName || 'Ally') + "'s " + foeName(a);
      const h = $('#btAllyHp'); h.style.width = (100 * a.hp / a.maxHp) + '%'; h.classList.toggle('warn', a.hp / a.maxHp < 0.25);
    }
  }
}
function stageText(st){ return ['atk', 'def', 'spd'].filter(k => st[k]).map(k => k.toUpperCase() + (st[k] > 0 ? '\u25b2' : '\u25bc') + Math.abs(st[k])).join(' '); }
// Type hint badge: shown once you've seen this move's effect on this type (S.dex.hits["move>TYPE"]).
function hintFor(mid, type){ const v = S.dex.hits && S.dex.hits[mid + '>' + type]; return v === 2 ? '2x' : v === 0.5 ? '\u00bd' : v === 0 ? '0' : ''; }
function renderFight(){
  const p = activePet(), u = usesOf(p), f = curFoe(), box = $('#btMoves'); box.textContent = '';
  let ids = (p.moves || []).filter(id => MOVES[id]);
  const opener = p.deploy && typeof p.deploy.opener === 'string' && ids.includes(p.deploy.opener) ? p.deploy.opener : null;
  if (opener) ids = [opener].concat(ids.filter(id => id !== opener));
  const out = ids.every(id => !(u[id] > 0));
  const list = out ? ['wobble'] : ids;
  for (let i = 0; i < 4; i++) {
    const id = list[i], b = document.createElement('button'); b.className = 'btn bt-move' + (opener && id === opener && !out ? ' mv-open' : ''); b.type = 'button';
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
  $('#btMsg').textContent = 'What should ' + petName(p) + ' do?';
  renderBattleCards(); setPanel('acts');
}

/* --- AI (§6) --- */
function aiPick(){
  const B = battle, f = curFoe(), me = myBattler(), t = tr(), kind = t ? t.ai : 'wild', rng = B.rng;
  // COBBLECREST opener: that member's first action after it enters (Brace Rock), if the move has uses and the stat isn't capped.
  if (f.opener && !f.acted) {
    const slot = f.moves.find(m => m.id === f.opener && m.uses > 0), mv = MOVES[f.opener];
    if (slot && mv) {
      const e = mv.effect || {}, st = e.target === 'self' ? f.stages : B.me.stages, cur = (e.stat && st[e.stat]) || 0;
      if (!((e.stages > 0 && cur >= 3) || (e.stages < 0 && cur <= -3))) return { move: f.opener };
    }
  }
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
  if (B.group) {
    if (action.kind !== 'fight') {
      const ended = await playerAction(action, id); if (!alive(id) || ended) return;
    } else await doMove('me', action.move, id);
    if (alive(id) && hpOf(activePet()) > 0 && groupLiving()) await allyAct(id);
    if (alive(id) && hpOf(activePet()) > 0 && groupLiving()) await foesGroupAct(id);
    if (alive(id)) endCheck(id);
    return;
  }
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
function groupLivingNow(){ return groupLiving(); }
async function allyAct(id){
  const B = battle, a = B.ally;
  if (!a || a.hp <= 0 || !groupLivingNow()) return;
  let best = 0, hp = Infinity;
  B.slots.forEach((fi, s) => { const f = B.foes[fi]; if (f && f.hp > 0 && f.hp < hp) { hp = f.hp; best = s; } });
  const f = B.foes[B.slots[best]]; if (!f || f.hp <= 0) return;
  await say(B.allyName + "'s " + foeName(a) + ' tries Bump!', id); if (!alive(id)) return;
  const r = damage({ power: MOVES.bump.power, moveType: MOVES.bump.type, att: foeBattler(a), def: foeBattler(f), rng: B.rng });
  if (r.mult === 0) { await say("It didn't do a thing...", id); return; }
  f.hp = Math.max(0, f.hp - r.dmg);
  sfx(r.mult > 1 ? 'hitStrong' : 'hit'); renderBattleCards();
  if (r.mult > 1) { await say('That hit hard!', id); if (!alive(id)) return; }
  if (f.hp <= 0) { B.aim = best; await knockOut('foe', id); }
}
async function foesGroupAct(id){
  const B = battle;
  for (let s = 0; s < B.slots.length; s++) {
    if (!alive(id) || hpOf(activePet()) <= 0) return;
    const f = B.foes[B.slots[s]]; if (!f || f.hp <= 0) continue;
    B.aim = s; B.foePlan = aiPick(); await foeAct(id);
  }
}
async function groupField(id){
  const B = battle, p = activePet();
  let sent = false;
  for (let s = 0; s < B.slots.length; s++) {
    const f = B.foes[B.slots[s]];
    if (f && f.hp > 0) continue;
    if (B.bench < B.foes.length) {
      const ni = B.bench++;
      B.slots[s] = ni;
      const nf = B.foes[ni];
      if (!B.participants[ni]) B.participants[ni] = new Set();
      if (p) B.participants[ni].add(p.id);
      markSeen(nf.si, nf.stage);
      B.aim = s; sent = true;
    }
  }
  if (!groupLiving()) { await finish('win', id); return false; }
  if (!B.foes[B.slots[B.aim]] || B.foes[B.slots[B.aim]].hp <= 0) {
    const s = B.slots.findIndex(i => B.foes[i] && B.foes[i].hp > 0);
    if (s >= 0) B.aim = s;
  }
  if (sent && alive(id)) { sendOutFx('foe'); renderBattleCards(); await say(btLine('trainerSend'), id); }
  return alive(id);
}
async function foeAct(id){
  const B = battle, f = curFoe(), plan = B.foePlan || { move: 'wobble' };
  if (f.hp <= 0) return;
  f.acted = true;
  if (plan.item === 'heal_snack') {
    B.foeHealUsed = true; const h = Math.ceil(0.4 * f.maxHp); f.hp = Math.min(f.maxHp, f.hp + h);
    sfx('heal'); renderBattleCards(); await say(tr().name + ' shares a Heal Snack! ' + foeName(f) + ' feels better.', id); return;
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
    B.failedRuns++; sfx('denied'); await say("Couldn't slip away!", id); return false;
  }
  if (a.kind === 'befriend') return befriendTry(id);
  if (a.kind === 'swap') {
    const next = S.party.find(q => q.id === a.id);
    if (!next || next.id === p.id || !canStepIn(next)) { sfx('denied'); await say("They can't come in.", id); return false; }
    await say(btLine('swapOut', { pet: petName(p) }), id); if (!alive(id)) return true;
    B.me = { petId: next.id, stages: { atk: 0, def: 0, spd: 0 }, mood: moodOf(next) }; B.participants[B.fi].add(next.id);
    sendOutFx('me'); renderBattleCards();
    await say(btLine(B.kind === 'wild' ? 'wildSend' : 'playerSend', { pet: petName(next) }), id);
    if (!alive(id)) return true;
    await applyEntrance(next, id);
    if (!alive(id)) return true;
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
    const form = formOf(f.si, f.stage), journalNew = !S.dex.caught[form];
    const np = newPet(f.si, f.stage, 'wild', f.level); np.metPlace = metPlaceName(); markCaught(f.si, f.stage);   // befriending is never blocked by the cap, only its XP
    if (f.hp < f.maxHp) np.hpNow = f.hp;
    if (!B.storyMoves) np.moves = f.moves.map(x => x.id).filter(x => x !== 'wobble');       // keeps the foe's moves (§2)
    if (!np.moves.length) np.moves = defaultMoves(f.form, f.level);
    if (B.faded) { np.faded = B.faded; np.fc = { d: dayKey(Date.now()), sum: 0, n: 0 }; }   // CREATURES_SLICE §5: faded: days left (additive field)
    if (B.story) S.flags['story.' + B.story] = true;                                          // a story creature: its flag is set on befriend only
    const firstWild = !S.flags['story.first_wild_met'];
    S.flags['story.first_wild_met'] = true;
    if (journalNew) B.journalNew = { si: f.si, stage: f.stage, id: np.id, firstWild };
    const toBox = S.party.length >= PPSave.PARTY_MAX; (toBox ? S.box : S.party).push(np);
    sfx('stinger_befriend'); xpChimeDelay = 0.75;
    const gx = grantExploreXp(pet(), BEFRIEND_XP); xpChimeDelay = 0; pet().happy = clamp(pet().happy + 5, 0, 100);
    B.newId = np.id; B.lastGx = gx; B.toBox = toBox; if (toBox) toast(nameOf(f.si, f.stage) + ' went to your Walkling-box.');
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
  await say(uName + ' tries ' + mv.name + '!', id); if (!alive(id)) return;
  const e = mv.effect || null, selfOnly = mv.power === 0 && e && e.target === 'self';
  if (!selfOnly && !(B.rng() < mv.acc / 100)) { sfx('miss'); await say(uName + ' just misses!', id); return; }
  if (mv.power > 0) {
    const att = mine ? myBattler() : foeBattler(f), def = mine ? foeBattler(f) : myBattler();
    const r = damage({ power: mv.power, moveType: mv.type, att, def, rng: B.rng });
    const key = mid + '>' + def.type; if (S.dex.hits[key] !== r.mult) { S.dex.hits[key] = r.mult; }   // type hint seen
    if (r.mult === 0) { sfx('hitWeak'); await say("It didn't do a thing to " + tName + '...', id); return; }
    let berry = false;
    if (mine) f.hp = Math.max(0, f.hp - r.dmg);
    else {
      const before = hpOf(p);
      setMyHp(p, before - r.dmg);
      berry = applySoftBerry(p, before);
    }
    B.fx.push({ who: mine ? 'foe' : 'me', kind: r.mult > 1 ? 'flash' : 'shake', t0: now(), dur: 400 });
    sfx(r.mult > 1 ? 'hitStrong' : r.mult < 1 ? 'hitWeak' : 'hit');
    if (berry && battle.on) sfx('heal');
    renderBattleCards(); if (!mine) save();
    if (r.crit) { await say('A lucky hit!', id); if (!alive(id)) return; }
    if (r.mult > 1) await say("That hit hard!", id); else if (r.mult < 1) await say("It barely felt that...", id);
    if (!alive(id)) return;
    if (berry) { await say(petName(p) + "'s Soft Berry eases the hit!", id); if (!alive(id)) return; }
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
  await say(nm + ' feels a little better!', id);
}
async function applyStage(side, e, id){
  const B = battle, mine = side === 'me', st = mine ? B.me.stages : curFoe().stages, nm = mine ? petName(activePet()) : foeLabel(curFoe());
  const cur = st[e.stat] || 0, nx = clamp(cur + e.stages, -3, 3), S_ = e.stat.toUpperCase();
  if (nx === cur) { sfx('denied'); await say(nm + "'s " + S_ + " can't get any " + (e.stages > 0 ? 'higher' : 'lower') + '!', id); return; }
  st[e.stat] = nx; B.fx.push({ who: side, kind: e.stages > 0 ? 'up' : 'down', t0: now(), dur: 700 });
  sfx(e.stages > 0 ? 'statUp' : 'statDown'); renderBattleCards();
  const d = Math.abs(nx - cur);
  await say(nm + "'s " + S_ + (e.stages > 0 ? (d > 1 ? ' went way up!' : ' went up!') : (d > 1 ? ' dropped a lot!' : ' dropped!')), id);
}
// A new pet coming out on a side replaces that side's worn-out silhouette. The 'faint'/'flee' fx are kept on purpose (the worn-out pet
// stays a grey silhouette, 4 px down, until it leaves), so without this the next pet sent out (forced swap, a trainer's next Walkling)
// was drawn as the grey silhouette too (Vincent's playtest).
function sendOutFx(who){ const B = battle; B.fx = B.fx.filter(e => !(e.who === who && (e.kind === 'faint' || e.kind === 'flee'))); B.fx.push({ who, kind: 'pop', t0: now(), dur: 300 }); }
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
    awardFoe(Math.max(0, B.foes.indexOf(f)));
    if (B.kind === 'wild') { sfx('flee'); await say(foeName(f) + ' is worn out and wanders off to rest.', id); }
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
  if (B.group) { if (!(await groupField(id))) return; }
  else if (f.hp <= 0) {
    if (B.kind === 'trainer' && B.fi < B.foes.length - 1) {
      B.fi++; const nf = curFoe(); B.participants[B.fi].add(p.id); markSeen(nf.si, nf.stage);
      if (hpOf(p) > 0) {
        sendOutFx('foe'); renderBattleCards();
        await say(btLine('trainerSend'), id); if (!alive(id)) return;
      } else { sendOutFx('foe'); renderBattleCards(); }
    } else { await finish('win', id); return; }
  }
  if (hpOf(activePet()) <= 0) {
    const next = S.party.filter(q => q.id !== B.me.petId && canStepIn(q));
    if (!next.length) { await finish('tired', id); return; }
    const pick = await swapSheet(true); if (!alive(id)) return;
    const q = petById(pick) || next[0];
    B.me = { petId: q.id, stages: { atk: 0, def: 0, spd: 0 }, mood: moodOf(q) }; B.participants[B.fi].add(q.id);
    sendOutFx('me'); renderBattleCards();
    await say(btLine(B.kind === 'wild' ? 'wildSend' : 'playerSend', { pet: petName(q) }), id);
    if (alive(id)) await applyEntrance(q, id);
    if (B.kind === 'trainer' && curFoe().hp > 0 && B.foeJustSent) {}
  }
  if (alive(id)) toChoose();
}
// Swap sheet: anyone in the party with HP who isn't napping. Low NRG is marked, not a lock (see canStepIn). forced = can't cancel.
function swapSub(q){
  const B = battle, badge = hpBadge(q), step = canStepIn(q), sleepy = step && q.energy < STAT_RULES.MOOD.minBattleNrg;
  let sub = 'HP ' + Math.ceil(hpOf(q)) + '/' + maxHpOf(q);
  if (badge) sub += '  ' + badge;
  if (sleepy) sub += '  LOW NRG';
  const call = q.deploy && CALL_LABEL[q.deploy.call];
  if (call) sub += '  ' + call;
  if (q.held) sub += '  ' + (ITEMS[q.held] ? ITEMS[q.held].name : q.held);
  if (q.deploy && q.deploy.note) sub += '  ' + q.deploy.note;
  if (B.me && q.id === B.me.petId) sub += '  (in battle)';
  return sub;
}
function swapSheet(forced){
  const B = battle, items = S.party.map(q => ({
    label: petName(q) + '  Lv ' + levelOf(q), sub: swapSub(q),
    hp: hpOf(q) / maxHpOf(q), disabled: q.id === B.me.petId || !canStepIn(q), value: q.id,
  }));
  return openSheet(forced ? 'Who goes next?' : 'Swap to which Walkling?', items, forced ? null : 'BACK');
}
/* ---------- MAP v0 (design/specs/MAP_V0.md): "where am I?" region map ---------- */
// Nodes, interiors and icons started from design/specs/map_v0.json. No fast travel and no zoom.
// Faction claims, the key, the coach link and tap-to-read were added later (OPEN_DECISIONS D37).
const MAP_HOLD_LINE = {
  keepers: 'The Keepers hold this place.',
  glimmer: 'Glimmerwell holds this place.',
  split: 'Both sides keep a claim.',
  wild: 'Wild country. No faction holds it.',
};
const REGION_MAP = {
  title: 'THE AMBERWILD', unknownLabel: '???', unknownBlurb: "You haven't been here yet.",
  nodes: {
    hearthmoor:    { kind: 'town',  col: 2,  row: 6, label: 'HEARTHMOOR',  labelAt: 'below', blurb: 'Hill village of keepers. Home.',
      hold: [{ id: 'keepers', line: 'Home. The Keepers hold this town.' }] },
    route1:        { kind: 'route', col: 6,  row: 7, label: 'ROUTE 1',     labelAt: 'below', blurb: 'Hearthmoor to Fernbrook, by the stream.', path: [[2, 6], [4, 7], [8, 7], [10, 6]],
      hold: [{ id: 'keepers', line: 'The Keeper watch holds this road.' }] },
    proto:         { kind: 'side',  col: 4,  row: 9, label: 'OLD MEADOW',  labelAt: 'below', blurb: 'Wild, quiet, a little overgrown.', path: [[4, 7], [4, 9]],
      hold: [{ id: 'wild' }] },
    fernbrook:     { kind: 'town',  col: 10, row: 6, label: 'FERNBROOK',   labelAt: 'below', blurb: 'Orchard village. Bloom Trial Hall.',
      hold: [{ id: 'split', line: 'Keepers keep the town. Glimmerwell keeps a stand.' }] },
    route2:        { kind: 'route', col: 14, row: 5, label: 'ROUTE 2',     labelAt: 'below', blurb: 'Fernbrook to Cobblecrest, past a creek.', path: [[10, 6], [12, 5], [16, 5], [17, 6]],
      hold: [{ id: 'split', line: 'Keepers keep the road. Glimmerwell runs the Census.' }] },
    route2_glen:   { kind: 'side',  col: 12, row: 2, label: 'WICKERGLEN',  labelAt: 'above', blurb: 'A sleepy hollow between the roots.', path: [[12, 5], [12, 2]],
      hold: [{ id: 'glimmer', line: 'Glimmerwell holds the glen.' }] },
    cobblecrest:   { kind: 'town',  col: 17, row: 6, label: 'COBBLECREST', labelAt: 'below', blurb: 'Quarry town. Stone Trial Hall.',
      hold: [{ id: 'glimmer', when: ['story.quarry_bought'], line: 'Glimmerwell holds the town. The vote passed.' }, { id: 'keepers', line: 'The Keepers hold the town.' }] },
    cobble_quarry: { kind: 'side',  col: 17, row: 3, label: 'QUARRY',      labelAt: 'above', blurb: 'Pebblits nap in the old seam.', path: [[17, 6], [17, 3]],
      hold: [{ id: 'glimmer', when: ['story.quarry_bought'], line: 'Glimmerwell holds the quarry.' }, { id: 'keepers', line: "The quarry is still the town's." }] },
    mahopac:       { kind: 'town',  col: 2,  row: 3, label: 'MAHOPAC',     labelAt: 'below', blurb: 'Time-snagged woods. Breckenridge Observatory.', path: [[2, 6], [2, 3]],
      hold: [{ id: 'wild' }] },
    // The capital sits above Mahopac, reached by the lantern coach, so the two towns no longer share a tile.
    highcharity:   { kind: 'town',  col: 2,  row: 1, label: 'HIGH CHARITY', labelAt: 'right', blurb: 'Keeper capital. Lanterns on every roof.', path: [[2, 6], [4, 3], [2, 1]], link: 'coach',
      hold: [{ id: 'keepers', line: 'The Keepers hold the capital.' }] },
    fb_heights:    { kind: 'side',  col: 10, row: 3, label: 'HEIGHTS',     labelAt: 'left', blurb: 'Ridge north of Fernbrook. A lab, and old tunnels.', path: [[10, 6], [10, 3]],
      hold: [{ id: 'split', when: ['story.sm_done'], line: 'The watch opened the tunnels. The lab remains.' }, { id: 'glimmer', line: "Glimmerwell's lab sits on the ridge." }] },
  },
  // §5 visited rule: S.mapSeen first (Q2 default: yes), else these story flags; hearthmoor always.
  flags: { route1: ['story.reached_fernbrook'], fernbrook: ['story.reached_fernbrook'], route2: ['story.reached_route2'], route2_glen: ['story.reached_glen'],
           cobblecrest: ['story.reached_cobblecrest'], cobble_quarry: ['story.reached_quarry'], proto: [], mahopac: ['story.reached_mahopac'], highcharity: ['story.hc_arrived'], fb_heights: ['story.know_us'] },
  interiors: { hm_home_in: 'hearthmoor', hm_home_up: 'hearthmoor', hm_lodge_in: 'hearthmoor', hm_lantern_in: 'hearthmoor', hm_rook_in: 'hearthmoor', hm_hq_f1: 'hearthmoor', hm_hq_f2: 'hearthmoor', cc_lantern_in: 'cobblecrest', cc_hall_in: 'cobblecrest',
    mahopac_obs: 'mahopac', dream_2004: 'mahopac', dream_party: 'mahopac', dream_drive: 'mahopac',
    hc_airport_in: 'highcharity', hc_command_in: 'highcharity', hc_barracks_in: 'highcharity', hc_marina_in: 'highcharity', hc_school_in: 'highcharity', hc_bank_in: 'highcharity',
    hc_gym_in: 'highcharity', hc_lantern_in: 'highcharity', hc_church_in: 'highcharity', hc_hall_in: 'highcharity', hc_arena_in: 'highcharity', hc_apt_in: 'highcharity', hc_mall_1: 'highcharity', hc_mall_2: 'highcharity',
    rx_f1: 'fb_heights', rx_f2: 'fb_heights', rx_f3: 'fb_heights', rx_f4: 'fb_heights', sm_yard: 'fb_heights', sm_tunnel: 'fb_heights', sm_hold: 'fb_heights', sm_den: 'fb_heights' },
  icon_map: { grid: ['wwwhhrwr', 'wwwhhwrw', 'wwwhhrwr', 'wwwhrwww', 'wwwhhwww', 'wwrhhwww', 'wrwhhwww', 'wwwhhwww'] },
  icon_bag: { grid: ['..oooo..', '.o....o.', 'rrrrrrrr', 'rorrrror', 'rryyyyrr', 'rryrryrr', 'prrrrrrp', '.pppppp.'] },
  icon_quest: { grid: ['.yyyyy..', '.yyyyyy.', '.yyyyyyy', '.yyyyyy.', '.yyyyy..', '...oo...', '...oo...', '.wwwwww.'] },   // designer's icon_quest (Build 2): yellow arrow signpost, reads on navy
};
// §4: the node for a map id: itself; else the room's own `outdoor` field; else the interiors table; else its door-mat warp's `to`.
function nodeOf(id){
  const N = REGION_MAP.nodes; if (!id) return null; if (N[id]) return id;
  const m = WORLD[id]; if (!m) return N[REGION_MAP.interiors[id]] ? REGION_MAP.interiors[id] : null;
  if (m.outdoor && N[m.outdoor]) return m.outdoor;
  if (N[REGION_MAP.interiors[id]]) return REGION_MAP.interiors[id];
  const mat = (m.objs || []).find(o => o.kind === 'warp' && N[o.to]); return mat ? mat.to : null;
}
function markMapSeen(){ const n = nodeOf(S && S.world && S.world.map); if (!n) return; if (!S.mapSeen || typeof S.mapSeen !== 'object') S.mapSeen = {}; S.mapSeen[n] = 1; }
function mapVisited(id, cur){
  if (!WORLD[id]) return false;                                   // not built in this build: always ??? (§5, test 8)
  if (id === cur || id === 'hearthmoor') return true;
  if (S.mapSeen && S.mapSeen[id]) return true;
  return (REGION_MAP.flags[id] || []).some(f => !!S.flags[f]);
}
const mapReady = () => !!S && screen === 'walk' && !overlayOpen() && !fade.busy && !tabsGuarded() && !(battle && battle.on);
let mapOffShown = null;
function syncMapBtn(){ const off = !mapReady(), b = $('#mapBtn'); if (!b || off === mapOffShown) return; mapOffShown = off; b.classList.toggle('off', off); b.setAttribute('aria-disabled', off ? 'true' : 'false'); }
const mapUI = { t0: 0, cur: null, sel: null };
// First matching rule wins. `flags` lets the dev check try a save without touching S. Unvisited places stay ??? on the parchment.
function matchHold(id, flags){
  const n = REGION_MAP.nodes[id], F = flags || (S && S.flags) || {};
  const ok = c => String(c)[0] === '!' ? !F[String(c).slice(1)] : !!F[c];
  for (const rule of (n && n.hold) || []) if (!rule.when || rule.when.every(ok)) return rule;
  return { id: 'wild', line: MAP_HOLD_LINE.wild };
}
function mapHold(id, flags){ return matchHold(id, flags).id; }
function holdLine(id, flags){ const rule = matchHold(id, flags); return rule.line || MAP_HOLD_LINE[rule.id] || MAP_HOLD_LINE.wild; }
function nodeSeal(id){
  if (!S) return false;
  const seals = S.seals || {}, f = S.flags || {};
  if (id === 'fernbrook') return !!(seals.seal_fernbrook || seals.seal_glim_1 || f['story.seal1']);
  if (id === 'cobblecrest') return !!(seals.seal_cobblecrest || seals.seal_glim_2 || f['story.seal2']);
  return false;
}
function nodePoint(n){ return [n.col * 16 + 8, n.row * 16 + 8]; }
function nodeGeom(id){
  const n = REGION_MAP.nodes[id]; if (!n) return null;
  const [x, y] = nodePoint(n), known = mapVisited(id, mapUI.cur), label = known ? n.label : REGION_MAP.unknownLabel;
  const out = n.kind === 'town' ? 22 : 18;                       // clear of the claim halo, the you-ring and the quest ring
  let lx = x, ly = y, align = 'center';
  if (n.labelAt === 'right') { lx = x + out; align = 'left'; }
  else if (n.labelAt === 'left') { lx = x - out; align = 'right'; }
  else ly = y + (n.labelAt === 'above' ? -out : out);
  return { id, x, y, lx, ly, align, label, known, kind: n.kind };
}
function paintPlaceCard(){
  const id = mapUI.sel, geo = id && nodeGeom(id), known = !!(geo && geo.known);
  let name = REGION_MAP.unknownLabel, blurb = REGION_MAP.unknownBlurb;
  if (known) {
    const outdoor = (WORLD[id] && WORLD[id].name) || REGION_MAP.nodes[id].label;
    const room = id === mapUI.cur && S.world.map !== id && WORLD[S.world.map] && WORLD[S.world.map].name;
    name = (room ? outdoor + ' · ' + WORLD[S.world.map].name : outdoor).toUpperCase();
    blurb = REGION_MAP.nodes[id].blurb;
  }
  $('#mapTitle').textContent = REGION_MAP.title;
  $('#mapPlaceName').textContent = name;
  $('#mapPlaceBlurb').textContent = blurb;
  const here = $('#mapHere'); if (here) here.hidden = !(id && id === mapUI.cur);
  const holdEl = $('#mapHold');
  if (holdEl) {
    holdEl.hidden = !known;
    holdEl.textContent = known ? holdLine(id) : '';
    holdEl.className = 'map-hold' + (known ? ' hold-' + mapHold(id) : '');
    if (known) holdEl.dataset.hold = mapHold(id); else delete holdEl.dataset.hold;
  }
  const kk = $('#keyKeepers'), kg = $('#keyGlimmer');
  if (kk) kk.textContent = SC_STANDING.sides.keepers.short;
  if (kg) kg.textContent = SC_STANDING.sides.glimmer.short;
  const pledge = $('#mapPledge');
  if (pledge) {
    const picked = !!(S.flags && S.flags['story.side_pick_done']);
    pledge.hidden = !picked;
    if (picked) pledge.textContent = 'Your pledge: ' + SC_STANDING.sides[side()].short;
  }
  const q = questCurrent(), mq = $('#mapQuest');
  if (mq) { mq.hidden = !(q && q.target); if (q && q.target) mq.textContent = 'NEXT: ' + q.place; }
  const heard = (id === mapUI.cur ? 'You are in ' : '') + name + '. ' + blurb + (known ? ' ' + holdLine(id) : '');
  $('#mapSr').textContent = heard;
}
function openMap(){
  if (!mapReady()) { sfx('denied'); return; }
  clearMoves(); markMapSeen();
  mapUI.cur = nodeOf(S.world.map); mapUI.sel = mapUI.cur; mapUI.t0 = performance.now();
  paintPlaceCard();
  fitRegionMap(); $('#ovMap').hidden = false; lockTabs(true); sfx('tap'); drawRegionMap(performance.now());
}
function closeMap(){ if ($('#ovMap').hidden) return; $('#ovMap').hidden = true; lockTabs(false); sfx('tap'); }
function selectMapNode(id){
  if (!REGION_MAP.nodes[id] || mapUI.sel === id) return;
  mapUI.sel = id; paintPlaceCard(); sfx('tap');
}
function mapNodeAt(px, py){
  let best = null, bestD = 1e9;
  const g = ctx($('#regionCanvas'));
  g.font = '14px ' + getComputedStyle(document.documentElement).getPropertyValue('--font');
  for (const id in REGION_MAP.nodes) {
    const geo = nodeGeom(id); if (!geo) continue;
    const icon = Math.hypot(px - geo.x, py - geo.y);
    g.textAlign = geo.align; const tw = g.measureText(geo.label).width;
    const left = geo.align === 'left' ? geo.lx : geo.align === 'right' ? geo.lx - tw : geo.lx - tw / 2;
    const onLabel = px >= left - 2 && px <= left + tw + 2 && Math.abs(py - geo.ly) <= 9;
    const d = onLabel ? 0 : icon;
    if ((icon <= 18 || onLabel) && d < bestD) { bestD = d; best = id; }
  }
  return best;
}
function mapNudge(dir){
  const from = REGION_MAP.nodes[mapUI.sel || mapUI.cur]; if (!from) return;
  let best = null, bestD = 1e9;
  for (const id in REGION_MAP.nodes) {
    if (id === (mapUI.sel || mapUI.cur)) continue;
    const n = REGION_MAP.nodes[id], dx = n.col - from.col, dy = n.row - from.row;
    const ok = dir === 'left' ? dx < 0 && Math.abs(dy) <= Math.abs(dx) + 1
      : dir === 'right' ? dx > 0 && Math.abs(dy) <= Math.abs(dx) + 1
      : dir === 'up' ? dy < 0 && Math.abs(dx) <= Math.abs(dy) + 1
      : dy > 0 && Math.abs(dx) <= Math.abs(dy) + 1;
    if (!ok) continue;
    const d = Math.hypot(dx, dy);
    if (d < bestD) { bestD = d; best = id; }
  }
  if (best) selectMapNode(best);
}
function fitRegionMap(){                                           // whole-number scale only: 2x if there's room for 640 px, else 1x (§2)
  const c = $('#regionCanvas'), k = Math.min(window.innerWidth, 480) >= 640 ? 2 : 1, dpr = Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
  c.style.width = 320 * k + 'px'; c.style.height = 192 * k + 'px';
  if (c.width !== 320 * dpr) { c.width = 320 * dpr; c.height = 192 * dpr; }
}
function mapDevCheck(){
  const bad = [], ok = ['keepers', 'glimmer', 'split', 'wild'], ids = Object.keys(REGION_MAP.nodes);
  for (const id of ids) {
    const n = REGION_MAP.nodes[id];
    if (!Array.isArray(n.hold) || !n.hold.length) bad.push(id + ': hold');
    for (const rule of n.hold || []) {
      if (ok.indexOf(rule.id) < 0) bad.push(id + ': ' + rule.id);
      if (rule.line && Array.from(rule.line).length > 70) bad.push(id + ': line');
    }
    if (ok.indexOf(mapHold(id, {})) < 0) bad.push(id + ': resolve');
    const [x, y] = nodePoint(n);
    if (x < 20 || x > 300 || y < 20 || y > 172) bad.push(id + ': off parchment');
    const out = n.kind === 'town' ? 22 : 18, tw = n.label.length * 6;
    let left = x - tw / 2, right = x + tw / 2, top = y - 8, bot = y + 8;
    if (n.labelAt === 'right') { left = x + out; right = left + tw; }
    else if (n.labelAt === 'left') { right = x - out; left = right - tw; }
    else if (n.labelAt === 'above') { top = y - out - 8; bot = y - out + 8; }
    else { top = y + out - 8; bot = y + out + 8; }
    if (left < 4 || right > 316 || top < 4 || bot > 188) bad.push(id + ': label');
  }
  const pair = (a, b) => { const [ax, ay] = nodePoint(REGION_MAP.nodes[a]), [bx, by] = nodePoint(REGION_MAP.nodes[b]); return Math.hypot(ax - bx, ay - by); };
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (pair(ids[i], ids[j]) < 28) bad.push('close: ' + ids[i] + ' ' + ids[j]);
  if (mapHold('cobblecrest', {}) !== 'keepers' || mapHold('cobblecrest', { 'story.quarry_bought': true }) !== 'glimmer') bad.push('cobble');
  if (mapHold('cobble_quarry', {}) !== 'keepers' || mapHold('cobble_quarry', { 'story.quarry_bought': true }) !== 'glimmer') bad.push('quarry');
  if (mapHold('fb_heights', {}) !== 'glimmer' || mapHold('fb_heights', { 'story.sm_done': true }) !== 'split') bad.push('heights');
  if (mapHold('fernbrook', {}) !== 'split' || mapHold('route2', {}) !== 'split' || mapHold('route2_glen', {}) !== 'glimmer') bad.push('fork');
  if (mapHold('hearthmoor', {}) !== 'keepers' || mapHold('highcharity', {}) !== 'keepers' || mapHold('route1', {}) !== 'keepers') bad.push('keepers');
  if (mapHold('proto', {}) !== 'wild' || mapHold('mahopac', {}) !== 'wild') bad.push('wild');
  if (REGION_MAP.nodes.highcharity.link !== 'coach') bad.push('coach');
  return bad;
}
function drawRegionMap(t){
  const c = $('#regionCanvas'), g = ctx(c), k = c.width / 320, N = REGION_MAP.nodes, cur = mapUI.cur;
  g.setTransform(k, 0, 0, k, 0, 0); g.imageSmoothingEnabled = false;
  const R = (x, y, w, h, col) => { g.fillStyle = PAL[col]; g.fillRect(Math.round(x), Math.round(y), w, h); };
  R(0, 0, 320, 192, 'o'); R(2, 2, 316, 188, 'y');                                 // parchment, 2 px orange edge
  [[30, 40], [70, 150], [150, 30], [200, 140], [255, 45], [290, 160], [120, 100]].forEach(([x, y]) => { R(x, y, 4, 1, 'o'); R(x + 1, y - 1, 2, 1, 'o'); });   // faint hill ticks (decoration)
  const P = ([cc, rr]) => [cc * 16 + 8, rr * 16 + 8];
  const seg = (a, b, col, dashed) => {                                              // 3 px pixel line between grid points (no anti-aliasing)
    const [x0, y0] = P(a), [x1, y1] = P(b), n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) { if (dashed && Math.floor(i / 4) % 2) continue; R(Math.round(x0 + (x1 - x0) * i / n) - 1, Math.round(y0 + (y1 - y0) * i / n) - 1, 3, 3, col); }
  };
  const discW = (cx, cy, r, yy) => { const dy = yy - cy; if (dy * dy > r * r + r * 0.8) return null; return Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8)); };
  const fillDisc = (cx, cy, r, col, side) => {
    for (let y = cy - r; y <= cy + r; y++) {
      const w = discW(cx, cy, r, y); if (w == null) continue;
      let x0 = cx - w, x1 = cx + w;
      if (side < 0) x1 = Math.min(x1, cx); if (side > 0) x0 = Math.max(x0, cx + 1);
      if (x1 >= x0) R(x0, y, x1 - x0 + 1, 1, col);
    }
  };
  const stipple = (cx, cy, r, col, side) => {
    for (let y = -r; y <= r; y++) {
      const w = discW(cx, cy, r, cy + y); if (w == null) continue;
      for (let x = -w; x <= w; x++) {
        if (side < 0 && x > 0) continue; if (side > 0 && x < 0) continue;
        if (((x + y) & 3) === 0) R(cx + x, cy + y, 1, 1, col);
      }
    }
  };
  const band = (cx, cy, r, col, side) => {                                          // a gold ridge through the claim, still visible beside the icon
    for (let dy = -1; dy <= 0; dy++) {
      const y = cy + dy, w = discW(cx, cy, r, y); if (w == null) continue;
      let x0 = cx - w, x1 = cx + w;
      if (side < 0) x1 = Math.min(x1, cx); if (side > 0) x0 = Math.max(x0, cx + 1);
      if (x1 >= x0) R(x0, y, x1 - x0 + 1, 1, col);
    }
  };
  // Visited claims only, so a ??? place does not give away who holds it. Green and gold match Keeper roofs; cyan and mint match Glimmerwell ground.
  const claim = (cx, cy, r, hold) => {
    fillDisc(cx, cy, r + 1, 'd', 0);
    if (hold === 'split') { fillDisc(cx, cy, r, 'g', -1); fillDisc(cx, cy, r, 'c', 1); band(cx, cy, r, 'y', -1); stipple(cx, cy, r, 'l', 1); return; }
    if (hold === 'keepers') { fillDisc(cx, cy, r, 'g', 0); band(cx, cy, r, 'y', 0); return; }
    fillDisc(cx, cy, r, 'c', 0); stipple(cx, cy, r, 'l', 0);
  };
  const sealMark = (cx, cy, right) => {                                             // orange wax stamp; parchment yellow would hide a gold one
    const x = cx + (right ? 16 : -24), y = cy - 22;                               // Cobblecrest's road enters from the upper left
    R(x + 3, y, 1, 1, 'k'); R(x + 2, y + 1, 3, 1, 'k'); R(x + 1, y + 2, 5, 1, 'k');
    R(x, y + 3, 7, 1, 'k'); R(x + 1, y + 3, 5, 1, 'o'); R(x + 3, y + 3, 1, 1, 'w');
    R(x + 1, y + 4, 5, 1, 'k'); R(x + 2, y + 5, 3, 1, 'k'); R(x + 3, y + 6, 1, 1, 'k');
  };
  const brackets = (cx, cy, r) => {
    const L = 4;
    R(cx - r, cy - r, L, 2, 'k'); R(cx - r, cy - r, 2, L, 'k');
    R(cx + r - L + 1, cy - r, L, 2, 'k'); R(cx + r - 1, cy - r, 2, L, 'k');
    R(cx - r, cy + r - 1, L, 2, 'k'); R(cx - r, cy + r - L + 1, 2, L, 'k');
    R(cx + r - L + 1, cy + r - 1, L, 2, 'k'); R(cx + r - 1, cy + r - L + 1, 2, L, 'k');
  };
  const vis = {}; for (const id in N) vis[id] = mapVisited(id, cur);
  const claimR = { town: 14, side: 11, route: 9 };
  for (const id in N) if (vis[id] && mapHold(id) !== 'wild') { const n = N[id], [x, y] = P([n.col, n.row]); claim(x, y, claimR[n.kind] || 10, mapHold(id)); }
  for (const id in N) {
    const pth = N[id].path; if (!pth) continue;
    const coach = N[id].link === 'coach';
    for (let i = 0; i < pth.length - 1; i++) seg(pth[i], pth[i + 1], vis[id] ? (coach ? 'g' : 'o') : 'h', !vis[id] || coach);
  }
  const disc = (cx, cy, r, col) => fillDisc(cx, cy, r, col, 0);
  const ring = (cx, cy, r, col) => { for (let a = 0; a < 360; a += 2) { const x = Math.round(cx + r * Math.cos(a * Math.PI / 180)), y = Math.round(cy + r * Math.sin(a * Math.PI / 180)); R(x - 1, y - 1, 2, 2, col); } };
  g.font = '14px ' + getComputedStyle(document.documentElement).getPropertyValue('--font'); g.textBaseline = 'middle';
  for (const id in N) {
    const n = N[id], geo = nodeGeom(id), x = geo.x, y = geo.y, v = vis[id];
    if (n.kind === 'town') { R(x - 8, y - 8, 17, 17, v ? 'k' : 'm'); R(x - 7, y - 7, 15, 15, v ? 'r' : 'h'); if (v) R(x - 7, y - 7, 15, 4, 'o'); }
    else if (n.kind === 'side') { disc(x, y, 7, v ? 'k' : 'm'); disc(x, y, 6, v ? 't' : 'h'); }   // teal, so green on the parchment means Keepers only
    else { disc(x, y, 4, v ? 'k' : 'm'); disc(x, y, 3, v ? 'p' : 'h'); }
    if (v && nodeSeal(id)) sealMark(x, y, id === 'cobblecrest');
    g.textAlign = geo.align; g.fillStyle = PAL[v ? 'k' : 'm']; g.fillText(geo.label, geo.lx, geo.ly);
  }
  // North is up: Heights, the glen, the quarry and the capital all sit toward the top of the parchment.
  R(300, 8, 1, 5, 'k'); R(304, 8, 1, 5, 'k'); R(301, 9, 1, 1, 'k'); R(302, 10, 1, 1, 'k'); R(303, 11, 1, 1, 'k'); R(302, 14, 1, 4, 'k');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blink = reduce || Math.floor((t - mapUI.t0) / 500) % 2 === 0;
  if (cur && N[cur] && blink) {                                                      // 500 ms on / 500 ms off; steady with reduced motion (§4)
    const [x, y] = P([N[cur].col, N[cur].row]); ring(x, y, 11, 'b');
    R(x - 1, y - 19, 3, 3, 'r');                                                    // small down-arrow 13-19 px above the node: stem...
    for (let i = 0; i < 4; i++) R(x - 3 + i, y - 16 + i, 7 - 2 * i, 1, 'r');       // ...and point
  }
  // WP-C: the objective's node gets a red ring on the same blink (wider when it shares the node with the blue "you are here").
  const q = questCurrent(), qn = q && q.target ? nodeOf(q.target.map) : null;
  if (qn && N[qn] && blink) { const [x, y] = P([N[qn].col, N[qn].row]); ring(x, y, qn === cur ? 15 : 12, 'r'); }
  const sq = sideQuest(), sn = sq && sq.target ? nodeOf(sq.target.map) : null;
  if (sn && N[sn] && sn !== qn && blink) { const [x, y] = P([N[sn].col, N[sn].row]); ring(x, y, sn === cur ? 15 : 12, 'c'); }
  if (mapUI.sel && N[mapUI.sel] && mapUI.sel !== cur) { const [x, y] = P([N[mapUI.sel].col, N[mapUI.sel].row]); brackets(x, y, 16); }
  g.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---------- Bag overlay (INVENTORY §6) ---------- */
let bagSel = 0;
function paintAcorn(c){ if (!c) return; const g = ctx(c); g.clearRect(0,0,c.width,c.height); drawGlyph(g, 'acorn', 0, 0); }
function paintStar(c){ const g = ctx(c); g.clearRect(0,0,c.width,c.height); drawGlyph(g, 'star', 0, 0); }
function paintUiIcons(){
  $$('.ico-star').forEach(paintStar);
  $$('.ico-dp').forEach(c => iconCanvas(c, ICONS[c.dataset.icon], PAL.w));
  $$('.ico-hud').forEach(c => {
    if (c.dataset.hud === 'icon_phone') { iconCanvas(c, ICONS.phone, PAL.y); return; }
    if (c.dataset.hud === 'icon_book') { iconCanvas(c, ICONS.book, PAL.y); return; }
    const gr = (REGION_MAP[c.dataset.hud] || {}).grid; if (!gr) return; const g = ctx(c); g.clearRect(0,0,8,8);
    gr.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } })); });
  paintAcorn($('#bagAcorn')); paintAcorn($('#shopAcorn'));
}
function bagVisible(){ return !!(S && S.flags && S.flags['story.starter_received'] && pet() && !scene); }
function journalVisible(){ return !!(S && S.flags && S.flags['story.starter_received'] && pet() && !scene && !(battle && battle.on)); }
const phoneOwned = () => !!(S && S.flags && S.flags['story.phone_got']);
const phoneHack = () => phoneOwned() && side() === 'glimmer' && itemCount('cracked_phone') > 0;
function syncJournalBtn(){
  const b = $('#phoneBtn'); if (!b) return;
  const on = journalVisible() && phoneOwned();
  b.hidden = !on;
  b.classList.toggle('pulse', on && !S.phoneOpened);
}
// Town Board (TB-1). The paper follows who holds the town. story.side does not restyle Hearthmoor.
// sky: tags are the live env card. Everything else is a scene condition.
function boardTownKnown(id){ return !!(id && MD.town_board && MD.town_board.towns && MD.town_board.towns[id]); }
function boardCond(c){
  if (typeof c === 'string' && c.slice(0, 4) === 'sky:') { const tags = (ENV && ENV.tags) || []; return tags.indexOf(c.slice(4)) >= 0; }
  return cond(c, false);
}
function boardTownHere(){
  if (!CUR) return '';
  if (boardTownKnown(CUR.id)) return CUR.id;
  if (CUR.kind === 'interior' && boardTownKnown(CUR.outdoor)) return CUR.outdoor;
  return '';
}
function noteBoardTown(){
  if (!S || !CUR) return;
  if (!S.board || typeof S.board !== 'object' || Array.isArray(S.board)) S.board = { lastTown: '' };
  if (typeof S.board.lastTown !== 'string') S.board.lastTown = '';
  const id = boardTownHere(); if (id) S.board.lastTown = id;
}
function boardCopy(id){
  const town = boardTownKnown(id) ? MD.town_board.towns[id] : null;
  if (!town) return { masthead: '', slogan: '', reports: [] };
  let masthead = typeof town.masthead === 'string' ? town.masthead : '', slogan = typeof town.slogan === 'string' ? town.slogan : '';
  for (const sl of town.sleeves || []) {
    if (!sl || !sl.when || !sl.when.every(boardCond)) continue;
    if (typeof sl.masthead === 'string') masthead = sl.masthead;
    if (typeof sl.slogan === 'string') slogan = sl.slogan;
    break;
  }
  const reports = (town.reports || []).filter(r => r && (!r.when || !r.when.length || r.when.every(boardCond))).map(r => String(r.text || ''));
  const sky = MD.town_board && MD.town_board.weather;
  if (sky && sky.text && (!sky.when || !sky.when.length || sky.when.every(boardCond))) reports.push(String(sky.text));
  return { masthead, slogan, reports };
}
function townBoardView(){
  const blank = Object.freeze({ map: '', masthead: '', slogan: '', reports: Object.freeze([]), slips: Object.freeze([]), bounties: Object.freeze([]), lastTown: '' });
  if (!S) return blank;
  const last = (S.board && typeof S.board.lastTown === 'string') ? S.board.lastTown : '';
  const here = boardTownHere();
  const map = here || (boardTownKnown(last) ? last : '');
  const copy = map ? boardCopy(map) : { masthead: '', slogan: '', reports: [] };
  return Object.freeze({
    map, masthead: copy.masthead, slogan: copy.slogan,
    reports: Object.freeze(copy.reports.slice()),
    slips: Object.freeze([]), bounties: Object.freeze([]), lastTown: last,
  });
}
function renderTownBoard(body){
  const view = townBoardView(), pack = MD.town_board || {}, empty = pack.empty || {};
  body.dataset.town = view.map || '';
  const add = (cls, text) => { if (!text) return; const p = document.createElement('p'); p.className = cls; p.textContent = text; body.appendChild(p); };
  if (!boardTownHere()) add('board-away', pack.away || 'You are between towns.');
  add('board-mast', view.masthead);
  add('board-slogan', view.slogan);
  view.reports.forEach(text => add('board-report', text));
  add('board-pile', 'Slips');
  add('board-empty', empty.slips || 'No slips are pinned up.');
  add('board-pile', 'Bounties');
  add('board-empty', empty.bounties || 'No creature is named today.');
}
function showTownBoardPane(){
  const body = $('#phoneBody'), friends = $('#phoneFriends'), owned = phoneOwned();
  body.hidden = false; friends.hidden = true; body.innerHTML = '';
  const paneTitle = $('#phonePaneTitle');
  if (paneTitle) { paneTitle.hidden = !owned; paneTitle.textContent = 'TOWN BOARD'; }
  renderTownBoard(body);
  $('#phoneHome').hidden = true; $('#phonePane').hidden = false;
  const back = $('#phoneBack'); if (back) back.hidden = !owned;
}
function openTownBoard(){
  if (!S || scene || fade.busy || overlayOpen()) return;
  clearMoves();
  const owned = phoneOwned(), hack = phoneHack(), ov = $('#ovPhone');
  ov.classList.toggle('hack', !!hack);
  ov.classList.toggle('board-post', !owned);
  if (owned) {
    $('#phoneTitle').textContent = hack ? 'CRACK//HAND' : 'KEEPER1';
    $('#phoneJobs').textContent = hack ? 'BOTNET' : 'KEEPERUAV';
    $('#phoneFoot').textContent = hack ? 'Still on their wires. Talk quiet.' : 'Copied to the Lantern desk.';
  } else $('#phoneTitle').textContent = 'TOWN BOARD';
  showTownBoardPane();
  ov.hidden = false; lockTabs(true); sfx('tap');
}
function openPhone(){
  if (!journalVisible() || !phoneOwned() || overlayOpen()) { sfx('denied'); return; }
  if (!S.phoneOpened) { S.phoneOpened = true; save(); }
  const hack = phoneHack(), ov = $('#ovPhone');
  ov.classList.toggle('hack', hack);
  ov.classList.remove('board-post');
  const back = $('#phoneBack'); if (back) back.hidden = false;
  const paneTitle = $('#phonePaneTitle'); if (paneTitle) paneTitle.hidden = true;
  $('#phoneTitle').textContent = hack ? 'CRACK//HAND' : 'KEEPER1';
  $('#phoneJobs').textContent = hack ? 'BOTNET' : 'KEEPERUAV';
  $('#phoneFoot').textContent = hack ? 'Still on their wires. Talk quiet.' : 'Copied to the Lantern desk.';
  $('#phoneHome').hidden = false; $('#phonePane').hidden = true;
  clearMoves(); ov.hidden = false; lockTabs(true); sfx('tap'); syncJournalBtn();
}
function closePhone(){
  if ($('#ovPhone').hidden) return;
  $('#ovPhone').hidden = true; $('#ovPhone').classList.remove('board-post');
  const back = $('#phoneBack'); if (back) back.hidden = false;
  const paneTitle = $('#phonePaneTitle'); if (paneTitle) paneTitle.hidden = true;
  lockTabs(false);
}
function renderRibbit(body){
  const api = window.PPRibbit;
  const feed = (api && api.feed) ? api.feed({
    flags: (S && S.flags) || {},
    side: side(),
    map: (CUR && CUR.id) || '',
    uid: (S && S.uid) || '',
    day: dayKey(Date.now()),
  }) : { trending: [], posts: [] };
  const trend = document.createElement('div');
  trend.className = 'ribbit-trend';
  const lab = document.createElement('span');
  lab.className = 'ribbit-trend-lab';
  lab.textContent = 'TRENDING';
  trend.appendChild(lab);
  (feed.trending || []).forEach(t => {
    const chip = document.createElement('span');
    chip.className = 'ribbit-tag';
    const tag = document.createElement('b');
    tag.textContent = t.tag || '';
    const n = document.createElement('small');
    n.textContent = String(t.count);
    chip.append(tag, document.createTextNode(' '), n);
    trend.appendChild(chip);
  });
  body.appendChild(trend);
  (feed.posts || []).forEach(post => {
    const row = document.createElement('article');
    row.className = 'ribbit-post';
    if (post.id) row.dataset.id = String(post.id);
    const top = document.createElement('div');
    top.className = 'ribbit-top';
    const desk = document.createElement('b');
    desk.className = 'ribbit-desk';
    desk.textContent = post.desk || post.name || '';
    const handle = document.createElement('span');
    handle.className = 'ribbit-handle';
    handle.textContent = '@' + (post.handle || '');
    top.append(desk, handle);
    const text = document.createElement('p');
    text.className = 'ribbit-text';
    text.textContent = post.text || '';
    const chirps = document.createElement('span');
    chirps.className = 'ribbit-chirps';
    const c = post.chirps | 0;
    chirps.textContent = c === 1 ? '1 chirp' : c + ' chirps';
    row.append(top, text, chirps);
    body.appendChild(row);
  });
  const foot = document.createElement('p');
  foot.className = 'ribbit-foot';
  foot.textContent = 'Ribbit rides the Keeper wires.';
  body.appendChild(foot);
}
function phoneApp(id){
  if (id === 'journal') { closePhone(); showTab('col'); return; }
  if (id === 'board') { showTownBoardPane(); sfx('tap'); return; }
  const paneTitle = $('#phonePaneTitle'); if (paneTitle) paneTitle.hidden = true;
  const hack = phoneHack();
  const body = $('#phoneBody'), friends = $('#phoneFriends');
  body.hidden = id === 'friends'; friends.hidden = id !== 'friends';
  body.innerHTML = '';
  const add = (who, text) => { const p = document.createElement('p'); if (who) { const b = document.createElement('b'); b.className = 'who'; b.textContent = who; p.appendChild(b); p.appendChild(document.createTextNode('  ' + text)); } else p.textContent = text; body.appendChild(p); };
  if (id === 'contacts') {
    add('Officer Ness', 'Route 1 watch. Issued your Keeper1.');
    add('Sergeant Bram', 'Keeper House door. Rank matters to him.');
    add('Captain Lumen', 'Upstairs. KeeperUAV jobs wait on her desk.');
    if (S.flags['story.met_fen']) add('Master Fen', side() === 'glimmer' ? 'She still keeps a chair for you.' : 'Orchard. Roots and blossoms.');
    if (side() === 'glimmer') add('Clerk Mint', 'Cracked handsets. She does not do warranties.');
  } else if (id === 'notes') {
    if (hack) {
      add('unnamed', 'the crest phone copies every note. this one too, probably.');
      add('unnamed', 'jobs and parts will list here when the board wakes up.');
    } else {
      add('Lantern desk', 'Your Keeper1 is active. We can read this. That is the service.');
      add('Lantern desk', 'Free handset. The poles stay with the Keepers.');
    }
  } else if (id === 'jobs') {
    if (hack) {
      add('BOTNET', 'Dark-market parts: the shelf is empty.');
      add('BOTNET', 'Augment slot: empty. The leak is not a menu.');
      add('BOTNET', 'Jobs: none posted. Come back later.');
    } else {
      add('KEEPERUAV', 'Lantern check, Fernbrook. Reward later.');
      add('KEEPERUAV', 'Count the Route 2 lamps. Not live yet.');
      add('KEEPERUAV', 'No jobs are open. The desk is warming up.');
    }
  } else if (id === 'ribbit') {
    renderRibbit(body);
  } else if (id === 'friends') {
    $('#friendCode').textContent = friendCode(); renderKeeperName();
  }
  $('#phoneHome').hidden = true; $('#phonePane').hidden = false;
  sfx('tap');
}
function openJournalTab(){ openPhone(); }
/* ---------- QUEST button + NEXT STEP panel (NEXT_PLAN WP-C) ---------- */
// Same visibility rules as BOOK. Pulses while the current objective differs from the one the panel was last opened on
// (S.questSeen, additive), so every new beat invites a tap once and then goes quiet.
const questVisible = () => journalVisible();
function syncQuestBtn(){
  const b = $('#questBtn'); if (!b) return;
  const on = questVisible(), q = on ? questCurrent() : null;
  b.classList.toggle('off', !on);
  b.classList.toggle('pulse', !!q && S.questSeen !== q.id);
}
let questTab = 'next';   // 'next' | 'standing'; the panel always opens on NEXT STEP
function openQuest(){
  if (!questVisible() || overlayOpen()) { sfx('denied'); return; }
  const q = questCurrent(); if (!q) return;
  clearMoves();
  if (S.questSeen !== q.id) { S.questSeen = q.id; save(); }
  questTab = 'next'; renderQuest(q);
  $('#ovQuest').hidden = false; lockTabs(true); armOptions(); sfx('tap'); syncQuestBtn();
  $('#questClose').focus({ preventScroll: true });
}
function closeQuest(){
  if ($('#ovQuest').hidden) return;
  $('#ovQuest').hidden = true; lockTabs(false);
}
function renderQuest(q){
  $('#questText').textContent = q.text;
  $('#questPlace').textContent = q.place || '';
  const sideQ = sideQuest();
  const sl = $('#questSideLabel'), stx = $('#questSide'), sp = $('#questSidePlace');
  if (sl) sl.hidden = !sideQ;
  if (stx) { stx.hidden = !sideQ; stx.textContent = sideQ ? sideQ.text : ''; }
  if (sp) { sp.hidden = !sideQ; sp.textContent = sideQ ? (sideQ.place || '') : ''; }
  // Stuck-state guard: after a loss the objective stays put; say what to do first when nobody can battle (spec questStuck[0]).
  const stuck = S.party.length > 0 && !leadPet();
  const note = $('#questNote'); note.hidden = !stuck; note.textContent = stuck ? PPQuests.STUCK[0] : '';
  const list = $('#questDone'); list.textContent = '';
  for (const e of PPQuests.completed(questState(), 3)) { const li = document.createElement('li'); li.textContent = e.text; list.appendChild(li); }
  renderQuestTabs();
}
// STANDING tab (BS): a second tab beside NEXT STEP, hidden until the side pick. Read-only: two rows (one per side) with the
// emblem, tier name, blurb, a bar to the next tier and a PLEDGED marker; strings and numbers all from STANDING_CFG.
const standingTabVisible = () => !!(S && S.flags['story.side_pick_done']);
function renderQuestTabs(){
  const on = standingTabVisible(); if (!on) questTab = 'next';
  const tabs = $('#questTabs'); tabs.hidden = !on;
  $('#questTabStanding').textContent = SC_STANDING.tab.label;
  const st = questTab === 'standing';
  $('#questTabNext').classList.toggle('on', !st); $('#questTabNext').setAttribute('aria-selected', String(!st));
  $('#questTabStanding').classList.toggle('on', st); $('#questTabStanding').setAttribute('aria-selected', String(st));
  $('#questTitle').textContent = st ? SC_STANDING.tab.label : 'NEXT STEP';
  $('#questPaneNext').hidden = st; $('#questPaneStanding').hidden = !st;
  const mapBtn = $('#questMap'); mapBtn.hidden = st || !(questCurrent() || {}).target;
  mapBtn.parentElement.classList.toggle('one', mapBtn.hidden);   // CLOSE alone spans the row
  if (st) renderStanding();
}
function renderStanding(){
  const T = SC_STANDING.tab, sd = side(), rows = $('#stRows'); rows.textContent = '';
  const quiet = PPStanding.SIDES.every(k => standingOf(k, false) <= SC_STANDING.min);
  $('#stPledged').textContent = quiet ? T.empty : PPStanding.fill(T.pledged, { faction: SC_STANDING.sides[sd].name });
  $('#stExplain').textContent = T.explain;
  for (const k of PPStanding.SIDES) {
    const i = PPStanding.tierInfo(k, standingOf(k, false)), F = SC_STANDING.sides[k], pledged = k === sd;
    const row = document.createElement('div'); row.className = 'st-row' + (pledged ? ' pledged' : ''); row.dataset.side = k;
    const em = document.createElement('canvas'); em.className = 'st-emblem'; em.width = em.height = 8; em.setAttribute('aria-hidden', 'true');
    const g = ctx(em); (SC_STANDING.art['emblem_' + k] || []).forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
    const body = document.createElement('div');
    const head = document.createElement('div'); head.className = 'st-head';
    const sideEl = document.createElement('span'); sideEl.className = 'st-side'; sideEl.textContent = F.short.toUpperCase();
    const tier = document.createElement('b'); tier.className = 'st-tier'; tier.textContent = i.name;
    head.append(sideEl, tier);
    if (pledged) { const mk = document.createElement('span'); mk.className = 'st-mark'; mk.textContent = T.marker; head.append(mk); }
    const blurb = document.createElement('p'); blurb.className = 'st-blurb'; blurb.textContent = i.blurb;
    const barRow = document.createElement('div'); barRow.className = 'st-barrow';
    const bar = document.createElement('div'); bar.className = 'bar'; bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', String(i.from)); bar.setAttribute('aria-valuemax', String(i.next == null ? SC_STANDING.max : i.next)); bar.setAttribute('aria-valuenow', String(i.points));
    const fill = document.createElement('i'); fill.className = 'st-fill-' + k; fill.style.width = Math.round(i.frac * 100) + '%'; bar.append(fill);
    const num = document.createElement('small'); num.textContent = i.next == null ? i.points + ' / ' + SC_STANDING.max : i.points + ' / ' + i.next;
    barRow.append(bar, num);
    body.append(head, blurb, barRow); row.append(em, body); rows.append(row);
  }
}
function questTabTo(name){ if (name === 'standing' && !standingTabVisible()) return; if (questTab === name) return; questTab = name; sfx('tap'); renderQuestTabs(); }
function questShowOnMap(){ closeQuest(); if (mapReady()) openMap(); }
const WALK_TIP_DEFAULT = 'Hold the pad, tap a tile, or drag on the map. Tap people to talk, and walk up to a <b class="tg">wild Walkling</b> to meet it!';
const escapeHtml = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
function walkTipText(){
  if (!S || !S.flags['story.starter_received']) return WALK_TIP_DEFAULT;
  if (lanternHold() && LANTERN_ROOMS[CUR.id]) return 'Your team is worn out. Face a bed and talk to it. A rest costs ' + LANTERN_REST_COST + ' Acorns.';
  if (lanternHold() && lanternDoorHere()) return 'Your team is worn out. Talk to the keeper. A rest costs ' + LANTERN_REST_COST + ' Acorns.';
  const n = +S.flags['story.early_steps'] || 0;
  if (!S.flags['story.early_done'] && n < 8 && !S.flags['story.reached_route1']) return 'Hold the pad to walk. The east path leads out of town.';
  if (!S.flags['story.first_wild_met'] && allPets().length < 2) return 'The east gate leads out. Walk up to a wild Walkling to meet it.';
  const q = questCurrent();                       // WP-C: the objective stands in for the generic tip while the story has a next step
  if (q && q.target) return escapeHtml(q.text);
  return WALK_TIP_DEFAULT;
}
function syncWalkTip(){
  const el = $('#walkTip'); if (!el) return;
  const html = walkTipText();
  if (el.innerHTML !== html) el.innerHTML = html;
}
function syncBagBtns(){
  const on = bagVisible() && !(battle && battle.on);
  const w = $('#walkBagBtn'), p = $('#petBagBtn');
  if (w) w.hidden = !on; if (p) p.hidden = !on;
}
function openBag(){
  if (!bagVisible() || overlayOpen()) return;
  clearMoves(); bagSel = 0; renderBag(); $('#ovBag').hidden = false; lockTabs(true); sfx('tap');
}
function closeBag(){
  if ($('#ovBag').hidden) return;
  $('#ovBag').hidden = true; lockTabs(false); updateHUD();
}
function renderBag(){
  if (!S) return;
  paintAcorn($('#bagAcorn')); paintAcorn($('#shopAcorn'));
  $('#bagMoney').textContent = String(S.money | 0);
  const list = $('#bagList'), empty = $('#bagEmpty');
  list.textContent = '';
  const ids = ITEM_ORDER.filter(k => itemCount(k) > 0);
  empty.hidden = ids.length > 0;
  if (!ids.length) { bagSel = 0; return; }
  if (bagSel >= ids.length) bagSel = ids.length - 1;
  ids.forEach((id, i) => {
    const it = ITEMS[id], battleOnly = it.use.length === 1 && it.use[0] === 'battle';
    const holdable = !!it.hold;
    const row = document.createElement('div'); row.className = 'bag-row' + (battleOnly || holdable ? ' battle-only' : '') + (i === bagSel ? ' sel' : '');
    row.setAttribute('role', 'option'); row.dataset.id = id; row.dataset.i = String(i);
    const ico = document.createElement('canvas'); ico.width = ico.height = 18; ico.className = 'bag-ico' + (battleOnly ? ' grey' : '');
    ctx(ico).drawImage(keeperCanvas(ITEM_ART[id]), 0, 0);
    const meta = document.createElement('div'); meta.className = 'bag-meta';
    const nm = document.createElement('div'); nm.className = 'bag-name';
    nm.textContent = it.name + ' \u00d7' + itemCount(id);
    if (battleOnly || holdable) { const tag = document.createElement('span'); tag.className = 'bag-tag'; tag.textContent = battleOnly ? '(battle only)' : '(hold)'; nm.appendChild(tag); }
    const bl = document.createElement('div'); bl.className = 'bag-blurb'; bl.textContent = it.blurb;
    meta.append(nm, bl);
    row.append(ico, meta);
    if (!battleOnly && !holdable) {
      const use = document.createElement('button'); use.type = 'button'; use.className = 'btn bag-use'; use.textContent = 'USE';
      use.addEventListener('click', e => { e.stopPropagation(); bagSel = i; useBagItem(id); });
      row.appendChild(use);
    }
    row.addEventListener('click', () => { bagSel = i; $$('.bag-row').forEach((r, j) => r.classList.toggle('sel', j === bagSel)); });
    list.appendChild(row);
  });
  const sel = list.children[bagSel]; if (sel) sel.scrollIntoView({ block: 'nearest' });
}
async function useBagItem(id){
  if ($('#ovBag').hidden || !ITEMS[id]) return;
  const it = ITEMS[id];
  if (it.hold) { sfx('denied'); toast('Hold it on a Walkling. The bag does not use it up.'); return; }
  if (!it.use.includes('field')) { sfx('denied'); toast(id === 'befriend_treat' ? 'Save it for a wild battle.' : "Can't use that here yet."); return; }
  let tgt = null;
  if (it.target) {
    tgt = await itemTargetSheet(id, S.partnerId);
    if (!tgt || $('#ovBag').hidden) return;
  }
  const r = useItem(id, tgt, 'field');
  sfx(r.ok ? (id === 'joy_crumb' || id === 'befriend_treat' ? 'tap' : 'heal') : 'denied');
  toast(r.msg); if (r.ok) save();
  renderBag(); updateHUD();
}
function bagKey(e){
  if ($('#ovBag').hidden || !$('#ovSheet').hidden) return false;
  const ids = ITEM_ORDER.filter(k => itemCount(k) > 0);
  if (e.key === 'Escape') { closeBag(); return true; }
  if (e.key === 'ArrowDown') { if (ids.length) { bagSel = Math.min(ids.length - 1, bagSel + 1); renderBag(); } return true; }
  if (e.key === 'ArrowUp') { if (ids.length) { bagSel = Math.max(0, bagSel - 1); renderBag(); } return true; }
  if (e.key === 'Enter') {
    const id = ids[bagSel]; if (id && !ITEMS[id].hold && !(ITEMS[id].use.length === 1 && ITEMS[id].use[0] === 'battle')) useBagItem(id);
    return true;
  }
  return false;
}

/* ---------- Travel Shelf shop (INVENTORY §5) ---------- */
const SHELF_LINE = 'Travel Shelf \u00b7 Leave Acorns, take a snack. \u2014 I.';
const SHELF_EMPTY = "Empty for now. Ilse restocks once you've a partner.";
let shopIds = [], shopSel = 0;
// The Travel Shelf keeps its fixed title. A stall whose welcome line names the shop (Dottie's "Welcome to Cairnside Supplies!") uses that name.
function shopHeading(o){
  const line = o && o.lines && o.lines.else;
  const m = typeof line === 'string' && /^Welcome to ([^!]+)!/.exec(line);
  return m ? m[1] : 'Travel Shelf';
}
function openShop(ids, title){
  if (!S || overlayOpen()) return;
  clearMoves(); shopIds = (ids || ITEM_ORDER).filter(k => ITEMS[k]); shopSel = 0;
  $('#shopTitle').textContent = title || 'Travel Shelf';
  const flav = $('#shopFlavour');
  if (flav) flav.textContent = title && title !== 'Travel Shelf' ? 'Snacks for the road.' : 'Leave Acorns, take a snack. \u2014 I.';
  renderShop(); $('#ovShop').hidden = false; lockTabs(true); sfx('tap');
}
function closeShop(){ if ($('#ovShop').hidden) return; $('#ovShop').hidden = true; lockTabs(false); updateHUD(); }
function renderShop(){
  if (!S) return;
  paintAcorn($('#shopAcorn')); $('#shopMoney').textContent = String(S.money | 0);
  const list = $('#shopList'); list.textContent = '';
  shopIds.forEach((id, i) => {
    const it = ITEMS[id];
    const row = document.createElement('div'); row.className = 'bag-row shop-row' + (i === shopSel ? ' sel' : ''); row.dataset.id = id;
    const ico = document.createElement('canvas'); ico.width = ico.height = 18; ico.className = 'bag-ico';
    ctx(ico).drawImage(keeperCanvas(ITEM_ART[id]), 0, 0);
    const meta = document.createElement('div'); meta.className = 'bag-meta';
    const nm = document.createElement('div'); nm.className = 'bag-name'; nm.textContent = it.name;
    const own = document.createElement('div'); own.className = 'bag-blurb shop-own'; own.textContent = '\u00d7' + itemCount(id) + ' owned';
    meta.append(nm, own);
    const pr = document.createElement('div'); pr.className = 'shop-price'; pr.textContent = String(it.price);
    const buy = document.createElement('button'); buy.type = 'button'; buy.className = 'btn bag-use shop-buy'; buy.textContent = 'BUY';
    buy.addEventListener('click', e => { e.stopPropagation(); shopSel = i; buyItem(id); });
    row.addEventListener('click', () => { shopSel = i; $$('.shop-row').forEach((r, j) => r.classList.toggle('sel', j === shopSel)); });
    row.append(ico, meta, pr, buy); list.appendChild(row);
  });
  const sel = list.children[shopSel]; if (sel) sel.scrollIntoView({ block: 'nearest' });
}
// One BUY = one item. Bag full first (it's the clearer reason), then Acorns; a refusal changes nothing.
function buyItem(id){
  const it = ITEMS[id]; if (!it || !S) return { ok: false, msg: '' };
  let msg = null;
  if (itemCount(id) >= it.cap) msg = "Bag can't hold more.";
  else if ((S.money | 0) < it.price) msg = 'Not enough Acorns.';
  if (msg) { sfx('denied'); toast(msg); return { ok: false, msg }; }
  S.money = (S.money | 0) - it.price; S.bag[id] = itemCount(id) + 1;
  sfx('tap'); msg = '+1 ' + it.name; toast(msg); save();
  if (!$('#ovShop').hidden) renderShop();
  return { ok: true, msg };
}
function shopKey(e){
  if ($('#ovShop').hidden) return false;
  if (e.key === 'Escape') { closeShop(); return true; }
  if (e.key === 'ArrowDown') { shopSel = Math.min(shopIds.length - 1, shopSel + 1); renderShop(); return true; }
  if (e.key === 'ArrowUp') { shopSel = Math.max(0, shopSel - 1); renderShop(); return true; }
  if (e.key === 'Enter') { if (!e.repeat && shopIds[shopSel]) buyItem(shopIds[shopSel]); return true; }
  return false;
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
  const pick = await openSheet('Bag', ids.map(k => ({ label: ITEMS[k].name + '  x' + itemCount(k), sub: ITEMS[k].blurb, value: k, art: k })), 'BACK');
  if (!pick || !B.on) return;
  const it = ITEMS[pick];
  if (!it.use.includes('battle')) return refuse("Can't use that in battle.");
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
    if (B.toBox && alive(id)) await say(nm + ' went to your Walkling-box.', id);
  } else if (result === 'win' && t) {
    sfx('win'); await say(btLine('trainerWin'), id); if (!alive(id)) return; await say(t.name + ': ' + trLine(trainerLine(B.trainerId, 'win')), id);
  } else if (result === 'win') { sfx('win'); }
  else if (result === 'tired') {
    if (t) { await say(btLine('trainerLose'), id); if (!alive(id)) return; await say(t.name + ': ' + trLine(trainerLine(B.trainerId, 'lose')), id); }
    else await say(btLine('trainerLose'), id);
  }
  if (!alive(id)) return;
  await results(result, id); if (!alive(id)) return;
  // END panel: OK (and the optional nickname after a befriend).
  if (result === 'run') { closeBattle(); return; }
  $('#btEndTitle').textContent = { win: 'You won!', befriended: foeName(curFoe()) + ' befriended!', fled: 'It wandered off...', tired: 'Your team is worn out...' }[result] || '';
  if (result === 'befriended' && !battle.faded) { $('#encNick').value = ''; $('#encNick').placeholder = foeName(curFoe()); $('#encName').hidden = false; }   // a faded one is named when its colour returns (§6)
  $('#btOk').textContent = result === 'befriended' ? 'YAY!' : 'OK';
  setPanel('end'); fitBattle();
}
async function results(result, id){
  const B = battle, t = tr(), won = result === 'win' || result === 'befriended';
  const parts = new Set(); B.participants.forEach(s => s.forEach(x => parts.add(x)));
  parts.forEach(pid => { const p = petById(pid); if (p) applyBattleCosts(p, { tired: B.fainted.has(pid), won }); });   // once, clamp 0..100
  if (won && parts.has(S.partnerId)) { const cday = careDay(); if (cday.battleBond < BOND.battleDay) { cday.battleBond++; addBond(pet(), BOND.battle); } }   // bond: won / befriended together
  if (result === 'win' && t) {
    const money = t.money != null ? t.money : 10 * Math.max(...trainerTeam(t).map(m => m.level)) * (t.hall ? 3 : 1);
    if (money > 0) S.money = (S.money || 0) + money;
    S.flags['trainer.' + B.trainerId] = true;
    if (t.hall && t.seal) { S.seals[t.seal] = Date.now(); }
    save();
    if (money > 0) { await say(playerName() + ' got ' + acorns(money) + '!', id); if (!alive(id)) return; }
    if (t.hall && t.seal) { showSealCard(t.seal); sfx('stinger_seal'); await say('You earned the ' + sealName(t.seal) + '!', id); if (!alive(id)) return; }
  }
  if (t && t.oneShot && (result === 'win' || result === 'tired')) {      // true = Rook #1; a string prefix is a later one-shot (Rook #2)
    const prefix = t.oneShot === true ? 'story.rival1' : t.oneShot;
    S.flags[prefix + '_done'] = true; S.flags[prefix + '_result'] = result === 'win' ? 'won' : 'lost'; save();
  }
  for (const lu of B.levelUps) {
    const p = petById(lu.id); if (!p) continue;
    sfx('stinger_levelup'); await say(petName(p) + ' reached Lv ' + lu.to + '!', id); if (!alive(id)) return;
    for (const e of levelMoves(p, lu.from, lu.to)) { await teachMove(p, e.id, s => say(s, id)); if (!alive(id)) return; }
  }
  B.levelUps = []; save(); updateHUD();
}
// The Seal card (BATTLE §7 Trial Hall): the Seal's sprite plus its name, over the battle stage until the battle closes.
// Seal 1 art: Design ICONS_SEALS (5d59b34), ICON_ART.seal_fernbrook.grid, copied verbatim (gold rim, leaf on a white glint).
const SEAL_ART = { seal_cobblecrest: [
  '.......oo.......',
  '.....ooyyoo.....',
  '...oowyddyyoo...',
  '.oowwddddddyyoo.',
  'oywdddddwhdddyyo',
  'oydddddhhhmdddyo',
  'oyddddddddddddyo',
  'oydddwhhhdddddyo',
  'oyddhhhhmmddddyo',
  'oyddddddddddddyo',
  'oydddwhhhhhdddyo',
  'oyydhhhhhhmmdyoo',
  '.ooyydmmmmdyooo.',
  '...ooyyddyooo...',
  '.....ooyyoo.....',
  '.......oo.......',
], seal_fernbrook: [
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
// Build 3: delivered 16x16 Bright Tier 1 lanyard. Gold rim, mint field, one white mark.
// Tier 2 is the same badge with two white marks.
const LANYARD_TIER1 = [
  '.....oooooo.....',
  '...ooyyyyyyoo...',
  '..oyyssssslyyo..',
  '.oyssssssllllyo.',
  '.oyssssslllllyo.',
  'oyssssswwlllllyo',
  'oysssslwwlllllyo',
  'oysssllwwlllllyo',
  'oysslllwwlllllyo',
  'oysllllwwllllyoo',
  'oylllllwwllllyoo',
  '.oylllllllllyoo.',
  '.oylllllllyyooo.',
  '..oyyllllyoooo..',
  '...ooyyyyoooo...',
  '.....oooooo.....',
];
const LANYARD_TIER2 = [
  '.....oooooo.....',
  '...ooyyyyyyoo...',
  '..oyywsssswyyo..',
  '.oyswwssslwwlyo.',
  '.oyswwssllwwlyo.',
  'oysswwslllwwllyo',
  'oysswwllllwwllyo',
  'oysswwllllwwllyo',
  'oysswwllllwwllyo',
  'oyslwwllllwwlyoo',
  'oyllwwllllwwlyoo',
  '.oylwwllllwwyoo.',
  '.oylwwllllyyooo.',
  '..oyywlllyoooo..',
  '...ooyyyyoooo...',
  '.....oooooo.....',
];
SEAL_ART.seal_glim_1 = LANYARD_TIER1; SEAL_ART.seal_glim_2 = LANYARD_TIER2;
function showSealCard(id){
  const c = $('#btSealArt'), g = ctx(c); g.clearRect(0, 0, c.width, c.height);
  g.drawImage(keeperCanvas(SEAL_ART[id] || SEAL_ART.seal_fernbrook), 0, 0);
  $('#btSealName').textContent = sealName(id); $('#btSeal').hidden = false;
}
// The Tour can finish without a battle. Same Seal card, over a quiet stage, until OK / Space.
async function presentFieldSeal(id){
  showSealCard(id); sfx('stinger_seal');
  const ov = $('#ovBattle');
  ov.classList.add('seal-only'); ov.hidden = false;
  $('#encName').hidden = true;
  $('#btEndTitle').textContent = 'You earned the ' + sealName(id) + '!';
  $('#btOk').textContent = 'OK';
  setPanel('end'); fitBattle();
  await new Promise(resolve => { sealWait = resolve; });
  $('#btSeal').hidden = true; ov.classList.remove('seal-only'); ov.hidden = true;
  if (!battle.on) setPanel('busy');
}
const SEAL_NAMES = { seal_fernbrook: 'Fernbrook Seal', seal_cobblecrest: 'Cobblecrest Seal', seal_glim_1: 'Bright Tier 1 Lanyard', seal_glim_2: 'Bright Tier 2 Lanyard' };
const sealName = id => SEAL_NAMES[id] || id.replace(/^seal_/, '').replace(/^./, c => c.toUpperCase()) + ' Seal';

/* --- learning moves (§3): after RESULTS, after evolving, and the §3.4 sheet --- */
// Learnset entries (all stages up to the current one) with from < lv <= to, one per level, not yet known.
function levelMoves(p, from, to){
  const form = SPECIES[spi(p)].id + '/' + p.stage, seen = new Set();
  return learnset(form).filter(e => e.lv > from && e.lv <= to && e.lv >= 1 && !(p.moves || []).includes(e.id) && !seen.has(e.lv) && seen.add(e.lv));
}
// Teach `mid`: a free slot learns it at once; full slots open the replace sheet ("Skip it" allowed). `tell` shows a line.
async function teachMove(p, mid, tell){
  if (!MOVES[mid] || mid === 'wobble') return 'none';
  if (!Array.isArray(p.moves)) p.moves = [];
  if (p.moves.includes(mid)) return 'known';
  const nm = petName(p), mv = moveName(mid);
  if (p.moves.length < 4) { p.moves.push(mid); save(); sfx('learn'); await tell(nm + ' picked up ' + mv + '!'); return 'learned'; }
  const items = p.moves.map((x, i) => ({ label: moveName(x), sub: MOVES[x].type + '  ' + (MOVES[x].power ? 'PWR ' + MOVES[x].power : 'STATUS'), value: 'slot' + i }));
  items.push({ label: "Skip it", value: 'skip', cls: 'skip' });
  const v = await openSheet(nm + ' wants to pick up ' + mv + ' (' + MOVES[mid].type + (MOVES[mid].power ? ', PWR ' + MOVES[mid].power : '') + '). Replace which move?', items, null);
  if (!v || v === 'skip') { sfx('tap'); await tell(nm + " didn't pick up " + mv + '.'); return 'declined'; }
  const slot = +v.slice(4), old = p.moves[slot]; p.moves[slot] = mid; save(); sfx('learn');
  await tell(nm + ' let go of ' + moveName(old) + ' and picked up ' + mv + '!'); return 'learned';
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
      if (mid && !(p.moves || []).includes(mid)) { await infoSheet(petName(p) + ' remembers something from growing up!'); await teachMove(p, mid, infoSheet); }
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
      if (it.art && ITEM_ART[it.art]) { const ico = document.createElement('canvas'); ico.width = ico.height = 18; ico.className = 'bag-ico'; ctx(ico).drawImage(keeperCanvas(ITEM_ART[it.art]), 0, 0); b.appendChild(ico); b.classList.add('has-ico'); }
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
  if ((act === 'run' || act === 'befriend') && B.kind !== 'wild') { sfx('denied'); say("You can't walk away from a challenge!").then(() => { if (B.on && B.state === 'CHOOSE') $('#btMsg').textContent = 'What should ' + petName(activePet()) + ' do?'; }); return; }
  sfx('tap');
  if (act === 'aim' && B.group && B.slots) {
    const n = B.slots.length;
    for (let k = 1; k <= n; k++) {
      const s = (B.aim + k) % n;
      if (B.foes[B.slots[s]] && B.foes[B.slots[s]].hp > 0) { B.aim = s; break; }
    }
    renderBattleCards();
    $('#btMsg').textContent = 'Target: ' + foeName(curFoe());
    return;
  }
  if (act === 'fight') setPanel('fight');
  else if (act === 'befriend') openBefriendBar();
  else if (act === 'run') resolveTurn({ kind: 'run' });
  else if (act === 'swap') swapSheet(false).then(v => { if (v && B.on && B.state === 'CHOOSE') resolveTurn({ kind: 'swap', id: v }); });
  else if (act === 'bag') bagSheet();
}
// WP-A: the zone reads the foe's HP, its level against the lead's, and whether a turn has passed (befriendWidth ctx);
// story creatures add B.bonus (Faded Fuzzwick +0.10, the guide wild +0.08). Cap 0.6. An untouched foe says so once per battle.
function befriendCtx(){ const B = battle, f = curFoe(), p = activePet(); return { foeLv: f.level, leadLv: levelOf(p), engaged: B.turn > 0 }; }
function befriendZoneWidth(){
  const B = battle, f = curFoe(), p = activePet();
  let extra = 0;
  if (B.kind === 'wild' && p) {
    if (p.deploy && p.deploy.call === 'greet') extra += 0.04;
    if (p.held === 'kin_ribbon') extra += 0.04;
  }
  return Math.min(0.6, befriendWidth(f.hp / f.maxHp, f.stage, p.happy, B.treat, befriendCtx()) + B.bonus + extra);
}
let waryTurn = 0;   // which of the three wary lines the next untouched foe gets
const oddsLabel = w => w < 0.15 ? { t: 'WARY', c: 'r' } : w < 0.25 ? { t: 'FAIR', c: 'y' } : { t: 'GOOD', c: 'l' };
function openBefriendBar(){
  const B = battle, f = curFoe();
  const w = befriendZoneWidth(), c = 0.2 + Math.random() * 0.6;
  enc.zone = [clamp(c - w / 2, 0, 1), clamp(c + w / 2, 0, 1)]; enc.t0 = now(); enc.freezeUntil = 0; enc.open = true;
  $('#tzone').style.left = (enc.zone[0] * 100) + '%'; $('#tzone').style.width = ((enc.zone[1] - enc.zone[0]) * 100) + '%';
  $('#encTries').textContent = '\u2665'.repeat(B.tries) + '\u2661'.repeat(BEFRIEND_TRIES - B.tries);
  const od = oddsLabel(w), oe = $('#encOdds'); if (oe) { oe.textContent = od.t; oe.className = 'bef-odds odds-' + od.c; }
  if (f.hp >= f.maxHp && !B.wary && !B.guide && !B.bonus) { B.wary = BEFRIEND_WARY_LINES[waryTurn++ % BEFRIEND_WARY_LINES.length]; $('#btMsg').textContent = B.wary; }   // rotates per battle (GLIMMER_PATH v0.2)
  setPanel('bef');
}
// BACK / Escape from the bar. The wary line is once per battle, but it should not stay in the box after you leave.
function leaveBefriendBar(){
  enc.open = false;
  const B = battle, p = activePet();
  if (p && B.wary && $('#btMsg').textContent === B.wary) $('#btMsg').textContent = 'What should ' + petName(p) + ' do?';
  setPanel('acts');
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
    if (who === 'me' && mode !== 's' && p && p.accessory) drawPetAccessory(g, p.accessory, x, y, !!faded);
  };
  if (B.group && B.slots) {
    let other = null;
    B.slots.forEach((fi, s) => { if (s !== B.aim && B.foes[fi] && B.foes[fi].hp > 0) other = B.foes[fi]; });
    if (other) drawMon('foe2', other.si, other.stage, Math.max(0, fx0 - 18), fy0 + 4, false, !!other.faded);
    if (B.ally && B.ally.hp > 0) drawMon('ally', B.ally.si, B.ally.stage, mx0 + 18, my0 + 2, true, false);
  }
  drawMon('foe', f.si, f.stage, fx0, fy0, false, !!f.faded);
  if (B.kind === 'wild' && f.stage > 0 && Math.floor(t / 350) % 5 === 0) drawGlyph(g, 'spark', fx0 + 14, fy0 - 2);   // rare form twinkle
  drawMon('me', spi(p), p.stage, mx0, my0, true, isFaded(p));             // back view = mirrored
  if (B.fx.some(e => e.kind === 'hearts' && t - e.t0 < e.dur)) drawGlyph(g, 'emote_heart', fx0 + 5, Math.max(0, fy0 - 13));   // befriend success (ICONS_SEALS Q6)
  btParts = btParts.filter(pt => (pt.life -= dt) > 0);
  btParts.forEach(pt => { pt.y += pt.vy * dt; drawGlyph(g, pt.type, pt.x, pt.y); });
}

/* ---------- evolution ---------- */
const evo = { active: false, t0: 0, sp: 0, from: 0, to: 1, done: false };
function startEvolution(force){
  const p = pet(); if (!p || p.stage >= 2) { toast('Already fully grown!'); return; }
  if (!force && !canEvolve(p)) return;
  if (overlayOpen()) return;
  clearMoves();
  Object.assign(evo, { active: true, t0: now(), sp: spi(p), from: p.stage, to: p.stage + 1, done: false });
  $('#evoTitle').textContent = 'Oh? ' + petName(p) + ' is growing up!';
  $('#evoMsg').innerHTML = '&nbsp;'; $('#evoOk').hidden = true; sfx('evoBuild');
  $('#ovEvolve').hidden = false; $('#tabs').classList.add('locked'); fitAll();
}
function finishEvolution(){
  const p = pet(), oldMax = maxHpOf(p); p.stage = evo.to; if (p.xp < EVO_XP[evo.to-1]) p.xp = EVO_XP[evo.to-1];
  carryHpOnEvolve(p, oldMax);                // new form's stats right away; current HP keeps the same % (rounded up)
  p.happy = clamp(p.happy + 15, 0, 100); markCaught(evo.sp, p.stage); evo.done = true; sfx('stinger_evolve');
  $('#evoTitle').textContent = 'Look at that!';
  $('#evoMsg').textContent = (cleanNick(p.nick) || nameOf(evo.sp, evo.from)) + ' grew into ' + nameOf(evo.sp, evo.to) + '!';   // the nickname if set, like the toasts
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
  if (p.stage >= 2) return { text: 'Fully grown', ready: false };
  const left = Math.max(0, EVO_XP[p.stage] - p.xp);
  if (left > 0) return { text: 'GROW ' + left + ' to next form', ready: false };
  if (care(p) < EVO_CARE[p.stage]) return { text: 'GROW done \u00b7 care ' + EVO_CARE[p.stage] + '+ to grow up', ready: false };
  return { text: 'Ready to grow up!', ready: true };
}
const statsCard = { id: null, t: 0, gear: false };
function clearGearBox(){
  statsCard.gear = false;
  const box = $('#scGearBox'), b = $('#scGear');
  if (box) { box.hidden = true; box.textContent = ''; }
  if (b) b.setAttribute('aria-pressed', 'false');
}
function openStatsCard(id){
  const p = allPets().find(q => q.id === (id || S.partnerId)); if (!p) return false;
  if (statsCard.id !== p.id) clearGearBox();
  if (!$('#ovStats').hidden) { statsCard.id = p.id; renderStatsCard(); return true; }
  if (overlayOpen()) return false;
  clearMoves(); statsCard.id = p.id; statsCard.t = 0; renderStatsCard();
  $('#ovStats').hidden = false; lockTabs(true); sfx('tap');
  $('#scClose').focus({ preventScroll: true });
  return true;
}
function closeStatsCard(){ if ($('#ovStats').hidden) return; $('#ovStats').hidden = true; statsCard.id = null; clearGearBox(); lockTabs(false); updateHUD(); }
function ensureDeploy(p){ if (!p.deploy || typeof p.deploy !== 'object' || Array.isArray(p.deploy)) p.deploy = {}; return p.deploy; }
function pruneDeploy(p){ if (p.deploy && !Object.keys(p.deploy).length) delete p.deploy; }
function cleanGearText(v){ return String(v == null ? '' : v).replace(/[<>{}]/g, '').trim().slice(0, 40); }
function setCall(p, call){
  const d = ensureDeploy(p);
  if (DEPLOY_CALLS.includes(call)) d.call = call; else delete d.call;
  pruneDeploy(p);
}
function setOpener(p, id){
  const d = ensureDeploy(p);
  if (typeof id === 'string' && id && (p.moves || []).includes(id)) d.opener = id; else delete d.opener;
  pruneDeploy(p);
}
function setDeployText(p, key, v){
  const d = ensureDeploy(p), t = cleanGearText(v);
  if (t) d[key] = t; else delete d[key];
  pruneDeploy(p);
}
function setRelief(p, on){
  if (on) {
    for (const q of S.party.concat(S.box)) {
      if (q === p || !q.deploy || q.deploy.relief !== true) continue;
      delete q.deploy.relief;
      if (!Object.keys(q.deploy).length) delete q.deploy;
    }
    ensureDeploy(p).relief = true;
  } else if (p.deploy) { delete p.deploy.relief; pruneDeploy(p); }
}
function commitGear(id, opts){
  save(); updateHUD();
  if (typeof openWalklingSheet === 'function' && $('#ovWalkling') && !$('#ovWalkling').hidden && !(opts && opts.keep)) { openWalklingSheet(id); return; }
  if (typeof renderCollection === 'function') renderCollection();
  if (opts && opts.keep) return;
  if ($('#ovStats').hidden || statsCard.id !== id || !statsCard.gear) return;
  const p = petById(id), box = $('#scGearBox');
  renderStatsCard();
  if (p && box) { box.textContent = ''; fillWalklingExtras(box, p); box.hidden = false; }
}
function fillWalklingExtras(container, pet){
  if (!container || !pet) return;
  const lab = text => { const d = document.createElement('div'); d.className = 'gear-lab'; d.textContent = text; return d; };
  const row = () => { const d = document.createElement('div'); d.className = 'gear-row'; return d; };
  const live = () => petById(pet.id) || pet;
  const press = (btn, on) => btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  const after = (r, keep) => {
    sfx(r && r.ok === false ? 'denied' : 'tap');
    if (r && r.msg) toast(r.msg);
    commitGear(pet.id, keep ? { keep: true } : null);
  };

  container.appendChild(lab(pet.held && ITEMS[pet.held] ? 'HOLD · ' + ITEMS[pet.held].name : 'HOLD'));
  const holds = row();
  const owned = ITEM_ORDER.filter(id => ITEMS[id] && ITEMS[id].hold && itemCount(id) > 0);
  if (!owned.length) { const n = document.createElement('div'); n.className = 'gear-note'; n.textContent = 'No holdable items.'; holds.appendChild(n); }
  owned.forEach(id => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm'; b.dataset.hold = id; b.textContent = ITEMS[id].name;
    b.addEventListener('click', () => after(holdItem(live().id, id)));
    holds.appendChild(b);
  });
  const take = document.createElement('button'); take.type = 'button'; take.className = 'btn sm'; take.dataset.act = 'unhold'; take.textContent = 'TAKE BACK';
  take.addEventListener('click', () => after(unholdItem(live().id)));
  holds.appendChild(take);
  container.appendChild(holds);

  container.appendChild(lab('ACCESSORY'));
  const accs = row();
  [['none', 'None']].concat(PET_ACC_IDS.map(id => [id, id.charAt(0).toUpperCase() + id.slice(1)])).forEach(([id, name]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm'; b.dataset.acc = id; b.textContent = name;
    press(b, (pet.accessory || 'none') === id);
    b.addEventListener('click', () => after(setAccessory(live().id, id)));
    accs.appendChild(b);
  });
  container.appendChild(accs);

  container.appendChild(lab('CALL'));
  const calls = row();
  [['none', 'None']].concat(DEPLOY_CALLS.map(id => [id, CALL_LABEL[id]])).forEach(([id, name]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm'; b.dataset.call = id; b.textContent = name;
    press(b, (pet.deploy && pet.deploy.call || 'none') === id);
    b.addEventListener('click', () => { setCall(live(), id === 'none' ? '' : id); after({ ok: true }); });
    calls.appendChild(b);
  });
  container.appendChild(calls);

  container.appendChild(lab('OPENER'));
  const sel = document.createElement('select'); sel.dataset.gear = 'opener';
  const none = document.createElement('option'); none.value = ''; none.textContent = 'None'; sel.appendChild(none);
  (pet.moves || []).forEach(id => { if (!MOVES[id]) return; const o = document.createElement('option'); o.value = id; o.textContent = MOVES[id].name; sel.appendChild(o); });
  sel.value = pet.deploy && (pet.moves || []).includes(pet.deploy.opener) ? pet.deploy.opener : '';
  sel.addEventListener('change', () => { setOpener(live(), sel.value); after({ ok: true }); });
  container.appendChild(sel);

  const rel = document.createElement('label'); rel.className = 'gear-check';
  const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.gear = 'relief'; cb.checked = !!(pet.deploy && pet.deploy.relief);
  cb.addEventListener('change', () => { setRelief(live(), cb.checked); after({ ok: true }); });
  rel.append(cb, document.createTextNode(' Relief'));
  container.appendChild(rel);

  const field = (key, title) => {
    container.appendChild(lab(title));
    const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 40; inp.dataset.gear = key;
    inp.value = (pet.deploy && pet.deploy[key]) || '';
    inp.addEventListener('change', () => {
      const q = live(); setDeployText(q, key, inp.value); inp.value = (q.deploy && q.deploy[key]) || '';
      after({ ok: true }, true);
    });
    container.appendChild(inp);
  };
  field('line', 'LINE');
  field('note', 'NOTE');
}
function paintStatsInto(prefix, p, opt){
  const si = spi(p), sp = SPECIES[si], L = levelOf(p), st = statsAt(formIdOf(p), L) || { hp: 1, atk: 1, def: 1, spd: 1 }, max = statMaxAt(L);
  spriteCanvas($('#' + prefix + 'Icon'), si, p.stage, 'n', isFaded(p), p.accessory);
  $('#' + prefix + 'Name').textContent = petName(p);
  const species = nameOf(si, p.stage), stars = '\u2605'.repeat(p.stage + 1) + '\u2606'.repeat(2 - p.stage);
  $('#' + prefix + 'Species').textContent = ((opt && opt.alwaysSpecies) || cleanNick(p.nick) ? species + ' \u00b7 ' : '') + stars;
  $('#' + prefix + 'StatsHead').textContent = 'STATS AT LV ' + L + ' \u00b7 bar = best of 42 forms';
  const tb = $('#' + prefix + 'Type'); tb.textContent = sp.type; tb.className = 'type-badge t-' + sp.type;
  $('#' + prefix + 'Lv').textContent = 'Lv ' + L;
  const gt = growText(p), ge = $('#' + prefix + 'Grow'); ge.textContent = gt.text; ge.classList.toggle('ready', gt.ready);
  const hp = Math.ceil(hpOf(p)), mhp = maxHpOf(p), badge = hpBadge(p), glowing = !badge && moodOf(p).glowing;   // FAINTED > TIRED > GLOWING
  $('#' + prefix + 'Hp').textContent = hp + '/' + mhp;
  const hb = $('#' + prefix + 'HpBar'); hb.style.width = (100 * hp / mhp) + '%'; hb.classList.toggle('warn', hp / mhp < 0.25);
  const tag = $('#' + prefix + 'Tag'); tag.hidden = !(badge || glowing); tag.textContent = badge || 'GLOWING';
  tag.className = 'sc-tag ' + (badge ? (badge === 'TIRED' ? 'tired' : 'fainted') : 'glowing');
  const box = $('#' + prefix + 'Stats'); box.innerHTML = '';
  for (const [key, label] of STAT_KEYS) {
    const row = document.createElement('div'); row.className = 'sc-stat'; row.dataset.stat = key;
    row.innerHTML = '<span></span><div class="bar"><i></i></div><b></b>';
    row.children[0].textContent = label; row.children[2].textContent = st[key];
    row.querySelector('i').style.width = (100 * st[key] / max[key]).toFixed(1) + '%';
    box.append(row);
  }
  const ch = chartLine(sp.type), el = $('#' + prefix + 'Chart'); el.innerHTML = '';
  const part = (lab, list) => { const s = document.createElement('span'); s.className = 'seg'; s.append(lab + ' '); const e = document.createElement('em'); e.textContent = list.join(', '); s.append(e); return s; };
  el.append(part('Strong vs', ch.strong), ' \u00b7 ', part('Weak to', ch.weak));
}
function renderStatsCard(){
  const p = allPets().find(q => q.id === statsCard.id); if (!p) { closeStatsCard(); return; }
  paintStatsInto('sc', p);
  const gbtn = $('#scGear'), gbox = $('#scGearBox');
  if (gbtn) gbtn.setAttribute('aria-pressed', statsCard.gear ? 'true' : 'false');
  if (gbox) gbox.hidden = !statsCard.gear;
}

/* ---------- Walkling sheet (party menu, one pet) ---------- */
// Field snacks the sheet may use on this pet, including one in the box. Battle BAG stays party-only.
const WALK_FIELD_ITEMS = ['heal_snack', 'hearty_snack', 'wake_tonic', 'energy_sip', 'joy_crumb'];
const walklingSheet = { id: null, t: 0, busy: false };
// Swap two party indexes. Another slice may define reorderParty first; this only fills the gap.
if (typeof reorderParty !== 'function') {
  window.reorderParty = function(id, toIndex){
    if (!S) return false;
    const from = S.party.findIndex(q => q.id === id), to = toIndex | 0;
    if (from < 0 || to < 0 || to >= S.party.length || from === to) return false;
    const tmp = S.party[from]; S.party[from] = S.party[to]; S.party[to] = tmp;
    return true;
  };
}
function callReorderParty(id, toIndex){
  if (typeof reorderParty === 'function') return reorderParty(id, toIndex);
  if (typeof window.reorderParty === 'function') return window.reorderParty(id, toIndex);
  return false;
}
function depositPetLocal(id, nextId){
  if (!S || S.party.length < 2) return false;
  const i = S.party.findIndex(q => q.id === id);
  if (i < 0) return false;
  if (id === S.partnerId) {
    if (!nextId || !S.party.some(q => q.id === nextId && q.id !== id)) return false;
    S.partnerId = nextId;
  }
  S.box.unshift(S.party.splice(i, 1)[0]);
  if (!S.party.some(q => q.id === S.partnerId) && S.party[0]) S.partnerId = S.party[0].id;
  return true;
}
function withdrawPetLocal(id){
  if (!S || S.party.length >= PPSave.PARTY_MAX) return false;
  const i = S.box.findIndex(q => q.id === id);
  if (i < 0) return false;
  S.party.push(S.box.splice(i, 1)[0]);
  return true;
}
function paintWalklingStats(p){ paintStatsInto('wl', p, { alwaysSpecies: true }); }
function sheetBtn(label, cls, onClick, opt){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (cls ? ' ' + cls : ''); b.textContent = label;
  if (opt && opt.aria) b.setAttribute('aria-label', opt.aria);
  if (opt && opt.span) b.classList.add('span');
  if (opt && opt.disabled) b.disabled = true;
  b.addEventListener('click', onClick);
  return b;
}
function renderWalklingActions(p){
  const box = $('#wlActions'); box.textContent = '';
  const sec = txt => { const d = document.createElement('div'); d.className = 'wl-sec'; d.textContent = txt; box.appendChild(d); };
  if (p.id !== S.partnerId) box.appendChild(sheetBtn('PARTNER', 'btn-play', () => partnerFromSheet(p.id), { span: true }));
  const pi = S.party.findIndex(q => q.id === p.id);
  if (pi >= 0) {
    sec('MOVE');
    box.appendChild(sheetBtn('UP', '', () => shiftParty(p.id, -1), { aria: 'Party up', disabled: pi <= 0 }));
    box.appendChild(sheetBtn('DOWN', '', () => shiftParty(p.id, 1), { aria: 'Party down', disabled: pi >= S.party.length - 1 }));
    box.appendChild(sheetBtn('TO BOX', '', () => { depositFromSheet(p.id); }, { span: true }));
  } else box.appendChild(sheetBtn('TO PARTY', 'btn-play', () => { withdrawFromSheet(p.id); }, { span: true }));
}
function renderWalklingMoves(p){
  const box = $('#wlMoves'); box.textContent = '';
  const lab = document.createElement('div'); lab.className = 'wl-sec'; lab.textContent = 'MOVES'; box.appendChild(lab);
  const moves = Array.isArray(p.moves) ? p.moves.slice(0, 4) : [];
  if (!moves.length) { const empty = document.createElement('p'); empty.className = 'wl-why'; empty.textContent = 'No moves yet.'; box.appendChild(empty); return; }
  moves.forEach((mid, i) => {
    const mv = MOVES[mid] || { name: mid, type: '', power: 0 };
    const row = document.createElement('div'); row.className = 'wl-mv';
    const meta = document.createElement('div'); meta.className = 'meta';
    const nm = document.createElement('b'); nm.textContent = mv.name;
    const sub = document.createElement('span'); sub.textContent = (mv.type || '') + '  PWR ' + (mv.power || 0);
    meta.append(nm, sub);
    const up = sheetBtn('UP', '', () => swapWalklingMove(p.id, i, i - 1), { aria: 'Move ' + mv.name + ' up', disabled: i === 0 });
    const down = sheetBtn('DOWN', '', () => swapWalklingMove(p.id, i, i + 1), { aria: 'Move ' + mv.name + ' down', disabled: i === moves.length - 1 });
    row.append(meta, up, down); box.appendChild(row);
  });
}
function walklingFieldItems(){
  return WALK_FIELD_ITEMS.filter(id => {
    const it = ITEMS[id];
    return it && !it.key && id !== 'befriend_treat' && it.target && it.use.includes('field') && itemCount(id) > 0;
  });
}
function renderWalklingUse(p){
  const box = $('#wlUse'); box.textContent = '';
  const lab = document.createElement('div'); lab.className = 'wl-sec'; lab.textContent = 'USE'; box.appendChild(lab);
  const ids = walklingFieldItems();
  if (!ids.length) { const empty = document.createElement('p'); empty.className = 'wl-why'; empty.textContent = 'No field snacks in the bag.'; box.appendChild(empty); return; }
  ids.forEach(id => {
    const it = ITEMS[id], why = itemRefusal(id, p, 'field');
    const row = document.createElement('div'); row.className = 'wl-item'; row.dataset.item = id;
    const meta = document.createElement('div');
    const nm = document.createElement('b'); nm.textContent = it.name;
    const sub = document.createElement('div'); sub.className = 'wl-why' + (why ? ' no' : ''); sub.textContent = why || it.blurb;
    meta.append(nm, sub);
    row.append(meta, sheetBtn('USE', 'btn-play', () => applySheetItem(id, p.id)));
    box.appendChild(row);
  });
}
function renderWalklingRelease(p){
  const box = $('#wlRelease'); box.textContent = '';
  if (typeof releasePet !== 'function') return;
  box.appendChild(sheetBtn('RELEASE', 'btn-danger', () => { releaseFromSheet(p.id); }, { span: true }));
}
function renderWalklingExtras(p){
  const box = $('#wlExtras'); if (!box) return; box.textContent = '';
  if (typeof fillWalklingExtras === 'function') fillWalklingExtras(box, p);
}
function renderWalklingSheet(){
  const p = allPets().find(q => q.id === walklingSheet.id);
  if (!p) { closeWalklingSheet(); return; }
  paintWalklingStats(p);
  renderWalklingActions(p);
  const nickEl = $('#wlNick');
  if (nickEl && document.activeElement !== nickEl) nickEl.value = cleanNick(p.nick);
  renderWalklingMoves(p);
  renderWalklingUse(p);
  renderWalklingRelease(p);
  renderWalklingExtras(p);
}
function openWalklingSheet(id){
  if (!S) return false;
  const p = allPets().find(q => q.id === id);
  if (!p) return false;
  if (!$('#ovWalkling').hidden) { walklingSheet.id = p.id; walklingSheet.t = 0; renderWalklingSheet(); return true; }
  if (overlayOpen()) return false;
  clearMoves(); walklingSheet.id = p.id; walklingSheet.t = 0; renderWalklingSheet();
  $('#ovWalkling').hidden = false; lockTabs(true); sfx('tap');
  const c = $('#wlClose'); if (c) c.focus({ preventScroll: true });
  return true;
}
window.openWalklingSheet = openWalklingSheet;
function closeWalklingSheet(){
  const ov = $('#ovWalkling'); if (!ov || ov.hidden) return;
  if (!$('#ovSheet').hidden) closeSheet(null);
  ov.hidden = true; walklingSheet.id = null; walklingSheet.busy = false;
  lockTabs(false); updateHUD();
}
function partnerFromSheet(id){
  const p = petById(id); if (!p || $('#ovWalkling').hidden) return;
  sfx('tap'); makePartner(id); save(); updateHUD(); renderCollection();
  toast(petName(petById(id) || p) + ' is your partner now!');
  if (!$('#ovWalkling').hidden) renderWalklingSheet();
}
function shiftParty(id, dir){
  const i = S.party.findIndex(q => q.id === id), to = i + dir;
  if (i < 0 || to < 0 || to >= S.party.length || $('#ovWalkling').hidden) return;
  sfx('tap'); callReorderParty(id, to); save(); updateHUD(); renderCollection();
  if (!$('#ovWalkling').hidden) renderWalklingSheet();
}
function swapWalklingMove(id, i, j){
  const p = petById(id);
  if (!p || !Array.isArray(p.moves) || j < 0 || j >= p.moves.length || $('#ovWalkling').hidden) return;
  const t = p.moves[i]; p.moves[i] = p.moves[j]; p.moves[j] = t;
  sfx('tap'); save(); renderWalklingMoves(p);
}
function applySheetItem(itemId, petId){
  const p = petById(petId); if (!p || $('#ovWalkling').hidden) return;
  const r = useItem(itemId, petId, 'field');
  sfx(r.ok ? (itemId === 'joy_crumb' ? 'tap' : 'heal') : 'denied');
  toast(r.msg);
  if (r.ok) { save(); updateHUD(); renderCollection(); }
  const q = petById(petId);
  if (!$('#ovWalkling').hidden && q) { paintWalklingStats(q); renderWalklingUse(q); }
}
function commitWalklingNick(){
  const p = petById(walklingSheet.id); if (!p || $('#ovWalkling').hidden) return;
  const nick = cleanNick($('#wlNick').value);
  p.nick = nick || null; $('#wlNick').value = nick;
  sfx('tap'); save(); updateHUD(); renderCollection(); paintWalklingStats(p);
}
// Confirm, then depositPet(id, nextPartnerId) when that function exists. nextPartnerId is null when they are not the partner.
async function depositFromSheet(id){
  if (walklingSheet.busy || $('#ovWalkling').hidden) return;
  const p = petById(id);
  if (!p || !S.party.some(q => q.id === id)) return;
  if (typeof depositPet !== 'function' && S.party.length < 2) { sfx('denied'); toast('The party needs one Walkling.'); return; }
  walklingSheet.busy = true;
  try {
    const yes = await openSheet('Send ' + petName(p) + ' to the box? Hunger pauses in the box.', [{ label: 'TO BOX', value: 'yes' }], 'BACK');
    if (yes !== 'yes' || $('#ovWalkling').hidden) return;
    let nextId = null;
    if (p.id === S.partnerId) {
      const rest = S.party.filter(q => q.id !== p.id);
      if (rest.length) {
        nextId = await openSheet('Who becomes your partner?', rest.map(q => ({ label: petName(q) + '  Lv ' + levelOf(q), value: q.id })), 'BACK');
        if (!nextId || $('#ovWalkling').hidden) return;
      } else if (typeof depositPet !== 'function') { sfx('denied'); toast('The party needs one Walkling.'); return; }
    }
    if (typeof depositPet === 'function') depositPet(p.id, nextId);
    else if (!depositPetLocal(p.id, nextId)) { sfx('denied'); toast('The party needs one Walkling.'); return; }
    save(); updateHUD(); renderCollection();
    if (S.box.some(q => q.id === p.id)) toast(petName(petById(p.id) || p) + ' is in the box. Hunger pauses there.');
    if (!$('#ovWalkling').hidden && petById(walklingSheet.id)) renderWalklingSheet();
  } finally { walklingSheet.busy = false; }
}
// Boxed pets only. withdrawPet(id, slot) runs after a slot 0-5 pick; otherwise push onto the party when there is room.
async function withdrawFromSheet(id){
  if (walklingSheet.busy || $('#ovWalkling').hidden) return;
  const p = petById(id);
  if (!p || S.party.some(q => q.id === id)) return;
  walklingSheet.busy = true;
  try {
    if (typeof withdrawPet === 'function') {
      const items = [];
      for (let i = 0; i < PPSave.PARTY_MAX; i++) {
        const occ = S.party[i];
        items.push({ label: 'Slot ' + (i + 1) + (occ ? ' \u00b7 ' + petName(occ) : ' \u00b7 empty'), value: i });
      }
      const slot = await openSheet('Which party slot?', items, 'BACK');
      if (slot == null || $('#ovWalkling').hidden) return;
      withdrawPet(id, slot);
    } else if (!withdrawPetLocal(id)) { sfx('denied'); toast('The party is full.'); return; }
    save(); updateHUD(); renderCollection();
    if (S.party.some(q => q.id === id) && typeof withdrawPet !== 'function') toast(petName(petById(id) || p) + ' joined the party.');
    if (!$('#ovWalkling').hidden && petById(walklingSheet.id)) renderWalklingSheet();
  } finally { walklingSheet.busy = false; }
}
async function releaseFromSheet(id){
  if (walklingSheet.busy || typeof releasePet !== 'function' || $('#ovWalkling').hidden) return;
  const p = petById(id); if (!p) return;
  walklingSheet.busy = true;
  try {
    const yes = await openSheet('Release ' + petName(p) + '?', [{ label: 'RELEASE', value: 'yes' }], 'BACK');
    if (yes !== 'yes' || $('#ovWalkling').hidden) return;
    const heldId = p.held;
    if (!releasePet(id)) {
      sfx('denied');
      const it = ITEMS[heldId];
      toast(it && itemCount(heldId) >= it.cap ? "Bag can't hold the " + it.name + '.' : "You can't let your only Walkling go.");
      return;
    }
    save(); renderCollection(); updateHUD();
    if (!petById(id)) closeWalklingSheet();
    else if (!$('#ovWalkling').hidden) renderWalklingSheet();
  } finally { walklingSheet.busy = false; }
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
  // ONLINE_SAVES (only when the cloud path is on): Start over also erases the cloud copy, and the confirm says so.
  if (PPCloud.enabled) $('#resetMsg').textContent = 'Start over? Your Walklings will be gone for good, on this device and in your cloud backup.';
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
  if (PPCloud.enabled) { $('#resetHint').textContent = 'Erasing your cloud backup...'; PPCloud.startOver(() => PPSave.startOver()).then(() => location.reload()); return; }
  PPSave.startOver();
  location.reload();
}

/* ---------- save copy (v2 JSON file; v stays 2) ---------- */
// Settings and the Start over dialog can download the live save. Read a copy replaces this device's game and reloads.
const COPY_WHY = { bad: "That file isn't a Walklings save.", newer: 'That save is from a newer Walklings.', big: 'That file is too big to read.', storage: "Couldn't store that copy." };
let copyPending = null;
function exportText(){
  if (!S || readOnly) return null;
  save();
  return JSON.stringify(S);
}
function downloadCopy(){
  const text = exportText();
  if (!text) { toast('No game to copy'); return false; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = 'walklings-save.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('Copy saved');
  return true;
}
function openCopy(){
  if (!$('#ovCopy').hidden || readOnly) return;
  copyPending = null;
  $('#copyMsg').textContent = 'This replaces the game on this device with the one in the file.';
  $('#copyPick').hidden = false; $('#copyYes').hidden = true;
  $('#ovCopy').hidden = false; lockTabs(true); sfx('tap');
  $('#copyCancel').focus({ preventScroll: true });
}
function closeCopy(){
  if ($('#ovCopy').hidden || resetting) return;
  copyPending = null; $('#ovCopy').hidden = true; lockTabs(!$('#ovSettings').hidden);
}
function stageCopy(text){
  const parsed = PPSave.readCopy(text);
  if (!parsed.ok) { toast(COPY_WHY[parsed.reason] || COPY_WHY.bad); return false; }
  copyPending = parsed.state;
  const n = parsed.state.party.length + parsed.state.box.length;
  const name = parsed.state.player && parsed.state.player.name;
  const pets = n === 1 ? '1 Walkling.' : n + ' Walklings.';
  $('#copyMsg').textContent = (name ? "Bring back " + name + "'s game? " : 'Bring this game back? ') + pets;
  $('#copyPick').hidden = true; $('#copyYes').hidden = false;
  return true;
}
function confirmCopy(){
  if (!copyPending || resetting) return;
  const state = copyPending; copyPending = null;
  resetting = true; clearMoves(); clearInterval(saveTimer);
  if (!PPSave.installCopy(state)) { resetting = false; toast(COPY_WHY.storage); return; }
  location.reload();
}

/* ---------- collection / journal album ---------- */
const LORE = {
  ember: 'Pipkits nap beside warm hearths and wake up ready to chase.',
  tide: 'Drizzlets keep to quiet water and hum when the rain starts.',
  bloom: 'Sproutbuns hide in tall grass until a patient keeper sits down.',
  stone: 'Pebblits nap on cobbles and show miners where the seam is kind.',
  volt: 'Zipmites gather under lanterns and street lamps after dark.',
  frost: 'Chillbits drift in with the first snow and leave a small hum behind.',
  gust: 'Puffkins ride the high wind and land only when the air goes still.',
  shade: 'Duskmotes curl up in doorways and open one eye after sunset.',
  beetle: 'Pomlets shell themselves in fallen fruit and keep the orchard rows.',
  mole: 'Loamlets dig soft tunnels and leave a seed in every one.',
  crab: 'Clinkits line their burrows with beach glass from the stream.',
  moth: 'Fuzzwicks follow any warm glow, even a miner\'s old lamp.',
  vane: 'Vanelets turn with the weather and are rarely seen on a calm day.',
  dormouse: 'Dozmice hum in the cold and glow faintly when the path is dark.',
};
function metPlaceName(){
  const id = isRoom() ? outdoorId() : (CUR && CUR.id);
  const m = id && WORLD[id];
  return String((m && m.name) || (CUR && CUR.name) || 'the wild').slice(0, 40);
}
function journalPet(si, stage){
  const id = SPECIES[si].id;
  return allPets().find(p => p.species === id && p.stage === stage) || null;
}
function metLine(p){
  if (!p) return 'You met them on a walk.';
  if (p.origin === 'starter') return 'Warden Ilse trusted them to you in Hearthmoor.';
  if (typeof p.metPlace === 'string' && p.metPlace) return 'You met them while walking in ' + p.metPlace + '.';
  return 'You met them on a walk.';
}
function openJournalEntry(o){
  if (!$('#ovJournal').hidden) return;
  if (overlayOpen()) return;
  const sp = SPECIES[o.si], st = sp && sp.stages[o.stage]; if (!sp || !st) return;
  const form = formOf(o.si, o.stage), caught = !!S.dex.caught[form];
  const p = o.id ? petById(o.id) : journalPet(o.si, o.stage);
  spriteCanvas($('#jnIcon'), o.si, o.stage, 'n', !!(p && isFaded(p)), p && p.accessory);
  $('#jnTitle').textContent = st.name;
  $('#jnStars').textContent = '\u2605'.repeat(o.stage + 1) + '\u2606'.repeat(2 - o.stage);
  const chip = $('#jnType'); chip.textContent = sp.type; chip.className = 'type-badge t-' + sp.type;
  $('#jnBlurb').textContent = sp.blurb || '';
  const lore = LORE[sp.id] || '';
  $('#jnLore').hidden = !lore; $('#jnLore').textContent = lore;
  let met = caught ? metLine(p) : "You've seen one. It hasn't joined you yet.";
  if (o.celebrate && o.firstWild) met += ' Your first wild page.';
  $('#jnMet').textContent = met;
  $('#jnKicker').hidden = !o.celebrate;
  $('#jnClose').textContent = o.celebrate ? 'YAY!' : 'CLOSE';
  $('#ovJournal').hidden = false; lockTabs(true);
  if (!o.celebrate) sfx('tap');
  $('#jnClose').focus({ preventScroll: true });
}
function closeJournal(){
  if ($('#ovJournal').hidden) return;
  $('#ovJournal').hidden = true; lockTabs(false); sfx('tap');
}
// Party board on the WALKLINGS tab (field only). Pets move as the same object, so HP, moves, bond,
// faint and any unknown fields stay put. The partner stays in the party (makePartner). Hunger in the
// box is already paused (role multiplier 0). Releasing never clears dex.caught.
let boardUi = null;
function partyField(){ return !!(S && !readOnly && !battle.on); }
function reorderParty(id, toIndex){
  if (!partyField()) return false;
  const from = S.party.findIndex(p => p.id === id);
  if (from < 0 || !Number.isInteger(toIndex) || toIndex < 0 || toIndex >= S.party.length || from === toIndex) return false;
  const p = S.party[from];
  S.party[from] = S.party[toIndex];
  S.party[toIndex] = p;
  return true;
}
function depositPet(id, newPartnerId){
  if (!partyField()) return false;
  const i = S.party.findIndex(p => p.id === id);
  if (i < 0 || S.party.length + S.box.length <= 1 || S.party.length <= 1) return false;
  if (S.partnerId === id) {
    if (typeof newPartnerId !== 'string' || newPartnerId === id || !S.party.some(p => p.id === newPartnerId)) return false;
  }
  const [p] = S.party.splice(i, 1);
  S.box.unshift(p);
  if (S.partnerId === id) S.partnerId = newPartnerId;
  return true;
}
function withdrawPet(id, slotIndex){
  if (!partyField()) return false;
  const bi = S.box.findIndex(p => p.id === id), max = PPSave.PARTY_MAX;
  if (bi < 0 || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= max) return false;
  // Empty slot: append. The party stays dense, so the pet lands in the first open slot.
  // A full party has no empty slot and can only swap with someone already there.
  if (slotIndex >= S.party.length) {
    if (S.party.length >= max) return false;
    S.party.push(S.box.splice(bi, 1)[0]);
    return true;
  }
  const [p] = S.box.splice(bi, 1), occ = S.party[slotIndex];
  S.party[slotIndex] = p;
  S.box.splice(bi, 0, occ);
  if (occ.id === S.partnerId) S.partnerId = p.id;
  return true;
}
function releasePet(id){
  if (!partyField()) return false;
  if (S.party.length + S.box.length <= 1) return false;
  const pi = S.party.findIndex(p => p.id === id);
  const bi = pi < 0 ? S.box.findIndex(p => p.id === id) : -1;
  if (pi < 0 && bi < 0) return false;
  const p = pi >= 0 ? S.party[pi] : S.box[bi], wasPartner = S.partnerId === id;
  if (typeof p.held === 'string') {
    const it = ITEMS[p.held];
    if (!it || itemCount(p.held) >= it.cap || !grantItem(p.held, 1).added) return false;
  }
  if (pi >= 0) S.party.splice(pi, 1); else S.box.splice(bi, 1);
  if (!S.party.length && S.box.length) S.party.push(S.box.shift());
  if (S.party.length && (wasPartner || !S.party.some(q => q.id === S.partnerId))) {
    S.partnerId = S.party[pi >= 0 ? Math.min(pi, S.party.length - 1) : 0].id;
  }
  return true;
}
window.reorderParty = reorderParty;
window.depositPet = depositPet;
window.withdrawPet = withdrawPet;
window.releasePet = releasePet;
window.makePartner = makePartner;
window.useItem = useItem;
window.holdItem = holdItem;
window.resolveTurn = resolveTurn;
window.befriendZoneWidth = befriendZoneWidth;
window.applySoftBerry = applySoftBerry;
window.hpOf = hpOf;
window.maxHpOf = maxHpOf;

function openBoardPet(id){
  const open = typeof openWalklingSheet === 'function' ? openWalklingSheet : window.openWalklingSheet;
  if (typeof open === 'function') open(id); else openStatsCard(id);
}
function boardButton(label, act, on, cls){
  const b = document.createElement('button'); b.type = 'button'; b.dataset.act = act; b.textContent = label;
  if (cls) b.className = cls;
  b.addEventListener('click', on);
  return b;
}
function boardActs(){ const d = document.createElement('div'); d.className = 'slot-acts'; return d; }
function boardNote(text){ const p = document.createElement('p'); p.className = 'slot-confirm'; p.textContent = text; return p; }
function closeBoard(){ boardUi = null; if (screen === 'col') renderCollection(); sfx('tap'); }
function openBoard(ui){ boardUi = ui; if (screen === 'col') renderCollection(); sfx('tap'); }
function refreshBoard(msg){
  boardUi = null; save(); updateHUD();
  if (screen === 'col') renderCollection();
  if (msg) toast(msg);
  sfx('tap');
}
function denyBoard(msg){ toast(msg); sfx('denied'); }
function boardMove(id){
  if (!partyField()) return denyBoard('Finish the battle first.');
  if (boardUi && boardUi.kind === 'move' && boardUi.id === id) return closeBoard();
  openBoard({ kind: 'move', id });
}
function boardDepositAsk(id){
  if (!partyField()) return denyBoard('Finish the battle first.');
  if (!S.party.some(p => p.id === id)) return;
  if (S.party.length + S.box.length <= 1 || S.party.length <= 1) return denyBoard('Keep at least one Walkling with you.');
  openBoard({ kind: 'deposit', id });
}
function boardDeposit(id, newPartnerId){
  const p = petById(id);
  if (!depositPet(id, newPartnerId)) return denyBoard('Pick who stays with you.');
  refreshBoard((p ? petName(p) : 'They') + ' is in the box.');
}
function boardWithdrawAsk(id){
  if (!partyField()) return denyBoard('Finish the battle first.');
  if (!S.box.some(p => p.id === id)) return;
  if (S.party.length >= PPSave.PARTY_MAX) return openBoard({ kind: 'withdraw', id });
  const p = petById(id);
  if (!withdrawPet(id, S.party.length)) return denyBoard('The party is full.');
  refreshBoard((p ? petName(p) : 'They') + ' joined the party.');
}
function boardWithdraw(id, slot){
  const p = petById(id);
  if (!withdrawPet(id, slot)) return denyBoard('That slot is full.');
  refreshBoard((p ? petName(p) : 'They') + ' joined the party.');
}
function boardReleaseAsk(id){
  if (!partyField()) return denyBoard('Finish the battle first.');
  if (!petById(id)) return;
  if (S.party.length + S.box.length <= 1) return denyBoard("You can't let your only Walkling go.");
  openBoard({ kind: 'release', id });
}
function boardRelease(id){
  const p = petById(id), name = p ? petName(p) : 'They';
  if (!releasePet(id)) {
    const it = p && ITEMS[p.held];
    if (it && itemCount(p.held) >= it.cap) return denyBoard("Bag can't hold the " + it.name + '.');
    return denyBoard("You can't let your only Walkling go.");
  }
  refreshBoard(name + ' headed off on their own.');
}
function boardPartner(id){
  if (!partyField()) return denyBoard('Finish the battle first.');
  if (!petById(id) || id === S.partnerId) return;
  makePartner(id);
  const p = pet();
  refreshBoard((p ? petName(p) : 'They') + ' is your partner now!');
}
function boardReorder(id, to){
  if (!reorderParty(id, to)) return denyBoard("Can't move them there.");
  refreshBoard();
}
function slotCopy(p){
  const info = document.createElement('div'); info.className = 'slot-copy';
  const nm = document.createElement('div'); nm.className = 'slot-nm'; nm.textContent = petName(p);
  if (p.id === S.partnerId) { const t = document.createElement('span'); t.className = 'partner-tag'; t.textContent = 'PARTNER'; nm.append(t); }
  const sub = document.createElement('div'); sub.className = 'slot-sub';
  sub.textContent = 'Lv ' + levelOf(p) + '  ' + '\u2605'.repeat(p.stage + 1) + '\u2606'.repeat(2 - p.stage);
  const hb = hpBadge(p);
  if (hb) { const b = document.createElement('span'); b.className = 'pc-badge ' + (hb === 'TIRED' ? 'tired' : 'fainted'); b.textContent = hb; sub.append(b); }
  info.append(nm, sub);
  return info;
}
function slotMain(p){
  const b = document.createElement('button'); b.type = 'button'; b.className = 'slot-main';
  b.setAttribute('aria-label', petName(p) + ', open');
  const cv = document.createElement('canvas'); cv.width = cv.height = 18;
  spriteCanvas(cv, spi(p), p.stage, 'n', isFaded(p), p.accessory);
  b.append(cv, slotCopy(p));
  b.addEventListener('click', () => openBoardPet(p.id));
  return b;
}
function partyActs(p){
  const acts = boardActs();
  acts.append(boardButton('MOVE', 'move', () => boardMove(p.id)));
  acts.append(boardButton('TO BOX', 'box', () => boardDepositAsk(p.id)));
  const partner = boardButton('PARTNER', 'partner', () => boardPartner(p.id));
  if (p.id === S.partnerId) { partner.disabled = true; partner.setAttribute('aria-pressed', 'true'); }
  acts.append(partner, boardButton('RELEASE', 'release', () => boardReleaseAsk(p.id), 'act-danger'));
  return acts;
}
function movePanel(p, index){
  const wrap = document.createElement('div');
  wrap.append(boardNote('Move ' + petName(p) + ' to another slot.'));
  const acts = boardActs();
  const up = boardButton('UP', 'up', () => boardReorder(p.id, index - 1));
  const down = boardButton('DOWN', 'down', () => boardReorder(p.id, index + 1));
  if (index <= 0) up.disabled = true;
  if (index >= S.party.length - 1) down.disabled = true;
  acts.append(up, down);
  S.party.forEach((q, i) => {
    if (i === index) return;
    const b = boardButton('SLOT ' + (i + 1), 'slot', () => boardReorder(p.id, i));
    b.dataset.index = String(i);
    b.setAttribute('aria-label', 'Swap with slot ' + (i + 1));
    acts.append(b);
  });
  acts.append(boardButton('BACK', 'back', closeBoard));
  wrap.append(acts);
  return wrap;
}
function depositPanel(p){
  const wrap = document.createElement('div');
  wrap.append(boardNote('Hunger pauses in the box.'));
  const acts = boardActs();
  if (p.id === S.partnerId) {
    wrap.append(boardNote('Who stays with you?'));
    S.party.forEach(q => {
      if (q.id === p.id) return;
      const b = boardButton(petName(q), 'stay', () => boardDeposit(p.id, q.id), 'act-go');
      b.dataset.partner = q.id;
      acts.append(b);
    });
  } else acts.append(boardButton('SEND', 'send', () => boardDeposit(p.id), 'act-go'));
  acts.append(boardButton('BACK', 'back', closeBoard));
  wrap.append(acts);
  return wrap;
}
function releasePanel(p){
  const wrap = document.createElement('div');
  wrap.append(boardNote('Let ' + petName(p) + ' go? They leave your party and your box.'));
  const acts = boardActs();
  acts.append(boardButton('RELEASE', 'yes', () => boardRelease(p.id), 'act-danger'));
  acts.append(boardButton('BACK', 'back', closeBoard));
  wrap.append(acts);
  return wrap;
}
function boxActs(p){
  const acts = boardActs();
  const to = boardButton('TO PARTY', 'party', () => boardWithdrawAsk(p.id), 'act-go');
  if (S.party.length >= PPSave.PARTY_MAX) to.setAttribute('aria-label', 'Swap into the party');
  acts.append(to, boardButton('PARTNER', 'partner', () => boardPartner(p.id)));
  acts.append(boardButton('RELEASE', 'release', () => boardReleaseAsk(p.id), 'act-danger'));
  return acts;
}
function withdrawWait(){
  const wrap = document.createElement('div');
  wrap.append(boardNote('Tap a party slot to swap.'));
  const acts = boardActs();
  acts.append(boardButton('BACK', 'back', closeBoard));
  wrap.append(acts);
  return wrap;
}
function partySlot(p, index){
  const row = document.createElement('div'); row.className = 'pet-row party-slot';
  row.dataset.slot = String(index); row.dataset.id = p.id;
  row.append(slotMain(p));
  const ui = boardUi && boardUi.id === p.id ? boardUi : null;
  if (ui && ui.kind === 'deposit') row.append(depositPanel(p));
  else if (ui && ui.kind === 'release') row.append(releasePanel(p));
  else if (ui && ui.kind === 'move') row.append(movePanel(p, index));
  else row.append(partyActs(p));
  if (boardUi && boardUi.kind === 'withdraw') {
    const extra = boardActs();
    const into = boardButton('SWAP', 'into', () => boardWithdraw(boardUi.id, index));
    into.setAttribute('aria-label', 'Swap into slot ' + (index + 1));
    extra.append(into); row.append(extra);
  }
  return row;
}
function emptySlot(index){
  const row = document.createElement('div'); row.className = 'party-slot empty'; row.dataset.slot = String(index);
  if (boardUi && boardUi.kind === 'withdraw' && index === S.party.length && S.party.length < PPSave.PARTY_MAX) {
    const b = boardButton('HERE', 'into', () => boardWithdraw(boardUi.id, index), 'act-go');
    b.setAttribute('aria-label', 'Bring into empty slot ' + (index + 1));
    row.append(b);
  } else { row.textContent = 'EMPTY'; row.setAttribute('aria-label', 'Empty party slot ' + (index + 1)); }
  return row;
}
function boxRow(p){
  const row = document.createElement('div'); row.className = 'pet-row box-row'; row.dataset.id = p.id;
  row.append(slotMain(p));
  const ui = boardUi && boardUi.id === p.id ? boardUi : null;
  if (ui && ui.kind === 'release') row.append(releasePanel(p));
  else if (ui && ui.kind === 'withdraw') row.append(withdrawWait());
  else row.append(boxActs(p));
  return row;
}
function renderCollection(){
  if (boardUi && !allPets().some(p => p.id === boardUi.id)) boardUi = null;
  const list = $('#ownedList'); list.innerHTML = '';
  $('#ownedCount').textContent = '(' + allPets().length + ')';
  const label = txt => { const d = document.createElement('div'); d.className = 'group-label'; d.textContent = txt; list.append(d); };
  label('PARTY ' + S.party.length + '/' + PPSave.PARTY_MAX);
  const board = document.createElement('div'); board.id = 'partyBoard'; board.className = 'party-board';
  for (let i = 0; i < PPSave.PARTY_MAX; i++) board.append(S.party[i] ? partySlot(S.party[i], i) : emptySlot(i));
  list.append(board);
  label('BOX ' + S.box.length);
  const box = document.createElement('div'); box.id = 'boxList'; box.className = 'box-list';
  if (!S.box.length) { const e = document.createElement('div'); e.className = 'box-empty'; e.textContent = 'The box is empty.'; box.append(e); }
  else S.box.forEach(p => box.append(boxRow(p)));
  list.append(box);
  if (S.orphans && S.orphans.length) {
    const wrap = document.createElement('div'); wrap.id = 'orphanRow'; wrap.className = 'orphan-row';
    const head = document.createElement('div');
    head.textContent = 'LEFT BEHIND ' + S.orphans.length;
    wrap.append(head);
    S.orphans.forEach(o => {
      const raw = o && o.raw;
      const who = raw && typeof raw === 'object' ? (raw.nick || raw.species || raw.sp) : null;
      const nm = document.createElement('div'); nm.className = 'slot-nm'; nm.textContent = who ? String(who) : 'A lost Walkling';
      const sub = document.createElement('div'); sub.className = 'slot-sub';
      sub.textContent = (o && o.reason ? String(o.reason) : 'could not be kept') + (o && o.from ? ' · ' + o.from : '');
      const dump = document.createElement('div'); dump.className = 'raw';
      let text = '';
      try { text = JSON.stringify(raw); } catch (e) { text = String(raw); }
      dump.textContent = text.length > 180 ? text.slice(0, 177) + '...' : text;
      wrap.append(nm, sub, dump);
    });
    list.append(wrap);
  }
  renderDexGrid();
}
function renderDexGrid(){
  const dex = $('#dexGrid'); dex.innerHTML = '';
  const owned = new Set(allPets().map(p => p.species + '/' + p.stage));
  const seen = (S.dex && S.dex.seen) || {}, caught = (S.dex && S.dex.caught) || {};
  const joined = Object.keys(caught).filter(k => caught[k]).length;
  let met = 0;
  SPECIES.forEach((sp, si) => sp.stages.forEach((st, k) => {
    const f = formOf(si, k), flagCaught = !!caught[f], flagSeen = !!seen[f], owns = owned.has(f);
    const state = (flagCaught || owns) ? 'joined' : flagSeen ? 'met' : 'unmet';
    if (state === 'met') met++;
    const known = state !== 'unmet';
    const cell = document.createElement(known ? 'button' : 'div');
    cell.className = 'cell' + (known ? ' dex-cell' : '');
    cell.dataset.form = f; cell.dataset.state = state;
    if (known) {
      cell.type = 'button';
      cell.setAttribute('aria-label', st.name + ', journal page');
      cell.addEventListener('click', () => openJournalEntry({ si, stage: k }));
    }
    const who = known ? journalPet(si, k) : null;
    const cv = document.createElement('canvas'); cv.width = cv.height = 18;
    spriteCanvas(cv, si, k, known ? 'n' : 's', !!(who && isFaded(who)), who && who.accessory);
    if (!known && sp.weatherOnly) { drawGlyph(ctx(cv), 'cloud', 10, 1); cell.title = 'Only seen in wild weather'; }   // "check back in bad weather"
    const lb = document.createElement('div'); lb.textContent = known ? st.name : '???'; if (!known) lb.className = 'unk';
    cell.append(cv, lb); dex.append(cell);
  }));
  $('#dexCount').textContent = 'Joined ' + joined + ' · Met ' + met + ' · Out there ' + (SPECIES.length * 3);
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
  return 'WLK-' + out.slice(0,4) + '-' + out.slice(4);   // display prefix only (was PXP-); derived from uid+created, nothing stored. A future ADD parser must accept both PXP- and WLK-
}

/* ---------- debug panel (Settings password "Larson", or ?debug=1) ---------- */
// Checkpoints reconcile one chain's story flags so the objective becomes that step, then stand beside its target.
// A save that already has Walklings keeps story.intro_seen and story.starter_received: a reload would put them back.
// Main checkpoints do not touch the Mom / Mahopac side chain. Side checkpoints do not rewind the main story.
// Extras only add the flags that open that place (High Charity).
const DEBUG_EXTRAS = {
  hc_plaza: { place: 'High Charity plaza', text: 'Keeper capital. The invite is open.', map: 'highcharity', x: 32, y: 20, facing: 'down',
    flags: ['story.intro_seen', 'story.starter_received', 'story.side_pick_done', 'story.hc_invite'] },
  hc_hall: { place: 'Event Hall', text: 'The five High Charity games.', map: 'hc_hall_in', x: 5, y: 9, facing: 'up',
    flags: ['story.intro_seen', 'story.starter_received', 'story.side_pick_done', 'story.hc_invite', 'story.hc_arrived', 'story.hc_greeted'] },
};
const DEBUG_SEALS = {
  'story.seal1': { keepers: 'seal_fernbrook', glimmer: 'seal_glim_1' },
  'story.seal2': { keepers: 'seal_cobblecrest', glimmer: 'seal_glim_2' },
};
const DEBUG_TRAINER_GATES = [
  ['story.rival1_done', 'rival1_rook'],
  ['story.glen_cleared', 'r2_lead'],
  ['story.seal1', 'hall1_fen'],
  ['story.quarry_bought', 'rival2_rook'],
  ['story.seal2', 'hall2_hale'],
];
function debugWhy(reason){
  return {
    scene: 'Finish the scene first.', battle: 'Finish the battle first.', busy: 'Close the other window first.',
    team: 'Your team cannot battle yet.', form: 'That Walkling is not in the game.', spot: 'No open grass for a Walkling here.',
    unknown: 'Unknown checkpoint.', map: 'That place is not in the game.', save: 'No save is loaded.',
  }[reason] || 'Could not do that.';
}
function debugOut(msg, quiet){
  const el = $('#dbgOut');
  if (el) { el.hidden = !msg; el.textContent = msg || ''; }
  if (msg && !quiet) toast(msg.length > 90 ? msg.slice(0, 87) + '...' : msg);
}
function debugBusy(){
  if (!S) return 'save';
  if (scene) return 'scene';
  if (battle.on) return 'battle';
  if (fade.busy || !$('#ovReset').hidden || !$('#ovEvolve').hidden || !$('#ovSheet').hidden || !$('#ovPlay').hidden) return 'busy';
  if (PPCloud.overlayOpen && PPCloud.overlayOpen()) return 'busy';
  return null;
}
function renderDebugGate(){
  const b = $('#setDebug'), v = $('#setDebugVal'), g = $('#dbgGate');
  if (!b) return;
  const open = !!(g && !g.hidden && !DEBUG);
  b.setAttribute('aria-expanded', String(open));
  if (v) v.textContent = DEBUG ? 'ON' : 'OFF';
  if (DEBUG && g) g.hidden = true;
}
function tryDebugUnlock(){
  const raw = ($('#dbgPass') && $('#dbgPass').value || '').trim();
  const msg = $('#dbgMsg');
  if (raw.toLowerCase() !== DEBUG_PASSWORD) {
    if (msg) { msg.hidden = false; msg.textContent = 'Wrong password.'; }
    sfx('denied');
    return false;
  }
  if ($('#dbgPass')) $('#dbgPass').value = '';
  if (msg) msg.hidden = true;
  setDebugEnabled(true);
  toast('Debug mode on.');
  if (!$('#ovSettings').hidden) $('#ovSettings').hidden = true;
  openDebug();
  return true;
}
function closeDebug(){
  const el = $('#ovDebug');
  if (!el || el.hidden) return;
  el.hidden = true;
  lockTabs(false);
}
function openDebug(){
  if (!DEBUG) return;
  const el = $('#ovDebug');
  if (!el || !el.hidden) return;
  if (scene || !$('#ovReset').hidden || !$('#ovEvolve').hidden || !$('#ovSheet').hidden || !$('#ovPlay').hidden) return;
  if (PPCloud.overlayOpen && PPCloud.overlayOpen()) return;
  if (!$('#ovSettings').hidden) $('#ovSettings').hidden = true;
  buildDebugUi();
  renderDebugPanel();
  el.hidden = false;
  lockTabs(true);
  const c = $('#dbgClose'); if (c) c.focus({ preventScroll: true });
}
function dismissForDebug(){
  for (const id of ['ovDebug', 'ovSettings', 'ovQuest', 'ovMap', 'ovBag', 'ovShop', 'ovStats', 'ovJournal', 'ovEnv', 'ovGeo', 'ovBasket', 'ovPhone', 'ovCopy', 'ovPlay']) {
    const el = $('#' + id); if (el) el.hidden = true;
  }
  if ($('#ovLook') && !$('#ovLook').hidden && !(lookUI && lookUI.newPlayer)) $('#ovLook').hidden = true;
  lockTabs(false);
}
function plainStoryFlag(c){
  if (typeof c !== 'string' || c[0] === '!' || /[=<>]/.test(c) || c.startsWith('seal:') || c.startsWith('pets')) return null;
  return c.startsWith('story.') ? c : null;
}
function reconcileChain(chain, i){
  const keep = new Set(), drop = new Set();
  for (let k = 0; k < i; k++) for (const c of chain[k].done || []) { const f = plainStoryFlag(c); if (f) keep.add(f); }
  for (let k = i; k < chain.length; k++) for (const c of chain[k].done || []) { const f = plainStoryFlag(c); if (f) drop.add(f); }
  const sticky = new Set();
  if (allPets().length) { sticky.add('story.intro_seen'); sticky.add('story.starter_received'); }
  for (const f of drop) if (!keep.has(f) && !sticky.has(f)) delete S.flags[f];
  for (const f of keep) S.flags[f] = true;
}
function chainTarget(chain, i){
  let t = chain[i] && chain[i].target;
  if (!t) for (let k = i - 1; k >= 0; k--) if (chain[k].target) { t = chain[k].target; break; }
  return t ? { map: t.map, x: t.x, y: t.y } : null;
}
function ensureDebugStarter(){
  if (!S.party.length) {
    const line = (typeof S.flags['story.starter_line'] === 'string' && SP_INDEX[S.flags['story.starter_line']] != null) ? S.flags['story.starter_line'] : 'ember';
    S.flags['story.starter_line'] = line;
    const p = newPet(SP_INDEX[line], 0, 'starter', STAT_RULES.STARTER_LEVEL);
    S.party.push(p); S.partnerId = p.id; markCaught(SP_INDEX[line], 0);
  } else if (!S.party.some(p => p.id === S.partnerId)) S.partnerId = S.party[0].id;
  return pet();
}
function readyParty(){
  if (S.flags['story.starter_received'] || allPets().length) ensureDebugStarter();
  for (const q of S.party) {
    q.hunger = Math.max(+q.hunger || 0, 80);
    q.happy = Math.max(+q.happy || 0, 80);
    q.energy = Math.max(+q.energy || 0, 80);
    delete q.hpNow; delete q.faintUntil;
  }
  setRestDue(false);
}
function debugStand(map, x, y){
  useMap(map);
  const spots = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [0, -2], [2, 0], [-2, 0]];
  const face = (dx, dy) => dy > 0 ? 'up' : dy < 0 ? 'down' : dx > 0 ? 'left' : 'right';
  for (const [dx, dy] of spots) {
    const nx = x + dx, ny = y + dy;
    if (!solid(nx, ny) && !warpAt(nx, ny) && !blockerAt(nx, ny)) return { x: nx, y: ny, facing: (dx || dy) ? face(dx, dy) : 'down' };
  }
  const m = WORLD[map], sp = (m && (m.safe || m.start)) || { x: 1, y: 1 };
  return { x: sp.x, y: sp.y, facing: sp.facing || 'down' };
}
function debugRespawn(mapId){
  let id = mapId; const seen = new Set();
  while (WORLD[id] && WORLD[id].kind === 'interior' && WORLD[id].outdoor && !seen.has(id)) { seen.add(id); id = WORLD[id].outdoor; }
  const m = WORLD[id];
  return m && (m.respawn || m.respawnIn) ? id : null;
}
function syncDebugSeals(){
  for (const [flag, bySide] of Object.entries(DEBUG_SEALS)) {
    if (S.flags[flag]) { const seal = bySide[side()] || bySide.keepers; if (seal && !S.seals[seal]) S.seals[seal] = Date.now(); }
    else for (const seal of Object.values(bySide)) delete S.seals[seal];
  }
}
function syncDebugTrainers(){
  for (const k of Object.keys(S.flags)) if (k.startsWith('trainer.') || k.startsWith('spotted.')) delete S.flags[k];
  for (const [flag, tid] of DEBUG_TRAINER_GATES) if (S.flags[flag]) S.flags['trainer.' + tid] = true;
}
function debugCheckpointList(){
  const row = (e, chain) => ({ id: e.id, chain, place: e.place, text: e.text, map: e.target ? e.target.map : null, x: e.target ? e.target.x : null, y: e.target ? e.target.y : null });
  return PPQuests.CHAIN.map(e => row(e, 'main'))
    .concat(PPQuests.SIDE.map(e => row(e, 'side')))
    .concat(Object.entries(DEBUG_EXTRAS).map(([id, e]) => ({ id, chain: 'extra', place: e.place, text: e.text, map: e.map, x: e.x, y: e.y })));
}
function applyCheckpoint(id){
  const busy = debugBusy(); if (busy) return { ok: false, reason: busy };
  const mainI = PPQuests.CHAIN.findIndex(e => e.id === id);
  const sideI = PPQuests.SIDE.findIndex(e => e.id === id);
  const extra = DEBUG_EXTRAS[id];
  if (mainI < 0 && sideI < 0 && !extra) return { ok: false, reason: 'unknown' };
  if (mainI >= 0) {
    reconcileChain(PPQuests.CHAIN, mainI);
    const orchardAt = PPQuests.CHAIN.findIndex(e => e.id === 'orchard');
    if (orchardAt >= 0 && mainI > orchardAt) { if (!S.flags['story.side_pick_done']) S.flags['story.side_pick_done'] = true; }
    else if (orchardAt >= 0 && mainI <= orchardAt) delete S.flags['story.side_pick_done'];
    if (!S.flags['story.seal1']) { delete S.flags['story.tour1_s1']; delete S.flags['story.tour1_s2']; delete S.flags['story.tour1_s3']; }
    if (S.flags['story.rival1_done']) S.flags['story.early_done'] = true;
    syncDebugSeals();
    syncDebugTrainers();
  } else if (sideI >= 0) {
    reconcileChain(PPQuests.SIDE, sideI);
    S.flags['story.intro_seen'] = true;
    S.flags['story.starter_received'] = true;
  } else for (const f of extra.flags) S.flags[f] = true;
  if (S.flags['story.starter_received'] || allPets().length) readyParty();
  else setRestDue(false);
  syncSide();
  const target = mainI >= 0 ? chainTarget(PPQuests.CHAIN, mainI) : sideI >= 0 ? chainTarget(PPQuests.SIDE, sideI) : { map: extra.map, x: extra.x, y: extra.y };
  if (target && !WORLD[target.map]) return { ok: false, reason: 'map' };
  dismissForDebug();
  showTab('walk');
  if (target) {
    const spot = debugStand(target.map, target.x, target.y);
    const resp = debugRespawn(target.map);
    if (resp) S.world.respawn = resp;
    arriveAt({ map: target.map, x: spot.x, y: spot.y, facing: spot.facing });
  }
  const q = questCurrent();
  if (q && mainI >= 0) S.questSeen = q.id;
  updateHUD(); renderKeeperName(); save();
  const sq = sideQuest();
  const entry = mainI >= 0 ? PPQuests.CHAIN[mainI] : sideI >= 0 ? PPQuests.SIDE[sideI] : extra;
  toast('Checkpoint: ' + (entry.place || id));
  return { ok: true, id, chain: mainI >= 0 ? 'main' : sideI >= 0 ? 'side' : 'extra', quest: q && q.id, sideQuest: sq && sq.id, map: S.world.map, x: S.world.x, y: S.world.y, side: side() };
}
function encounterPreview(speciesOrForm, level, stage, hpFrac){
  let form = String(speciesOrForm || ''), st = stage | 0;
  if (form.includes('/')) st = +form.split('/')[1];
  else {
    if (SP_INDEX[form] == null) return null;
    st = clamp(st, 0, SPECIES[SP_INDEX[form]].stages.length - 1);
    form = form + '/' + st;
  }
  const parts = form.split('/'), line = parts[0];
  if (SP_INDEX[line] == null || !SPECIES[SP_INDEX[line]].stages[+parts[1]]) return null;
  st = +parts[1];
  const L = clamp((level | 0) || 1, 1, STAT_RULES.LEVEL_CAP);
  const stats = statsAt(form, L); if (!stats) return null;
  const frac = hpFrac == null || hpFrac === '' ? 1 : clamp(+hpFrac, 0.01, 1);
  const hpNow = Math.max(1, Math.min(stats.hp, Math.round(stats.hp * frac)));
  const moves = defaultMoves(form, L);
  const lead = pet(), joy = lead ? lead.happy : 60, leadLv = lead ? levelOf(lead) : L;
  const width = Math.min(0.6, befriendWidth(frac, st, joy, false, { foeLv: L, leadLv, engaged: frac < 1 }));
  return {
    form, species: line, stage: st, name: nameOf(SP_INDEX[line], st), type: SPECIES[SP_INDEX[line]].type,
    level: L, maxHp: stats.hp, hp: hpNow, atk: stats.atk, def: stats.def, spd: stats.spd,
    moves: moves.slice(), moveNames: moves.map(mid => (MOVES[mid] || {}).name || mid),
    odds: { width: +width.toFixed(3), label: oddsLabel(width).t },
  };
}
function spawnEncounter(opts){
  opts = opts || {};
  const busy = debugBusy(); if (busy) return { ok: false, reason: busy };
  const prev = opts.form ? encounterPreview(opts.form, opts.level, null, opts.hpFrac) : encounterPreview(opts.species || opts.sp || 'ember', opts.level, opts.stage || 0, opts.hpFrac);
  if (!prev) return { ok: false, reason: 'form' };
  if (!leadPet()) return { ok: false, reason: 'team' };
  if (opts.onMap) {
    const w = spawnWild(SP_INDEX[prev.species], prev.stage, null);
    if (!w) return { ok: false, reason: 'spot', preview: prev };
    w.lv = prev.level;
    return { ok: true, onMap: true, id: w.id, x: w.x, y: w.y, preview: prev };
  }
  dismissForDebug();
  showTab('walk');
  const opened = openBattle({ kind: 'wild', form: prev.form, level: prev.level });
  if (!opened) return { ok: false, reason: 'battle', preview: prev };
  const f = curFoe();
  if (f && prev.hp < prev.maxHp) { f.hp = prev.hp; renderBattleCards(); }
  return { ok: true, preview: prev, foe: f && { form: f.form, name: foeName(f), type: f.type, level: f.level, hp: f.hp, maxHp: f.maxHp, atk: f.stats.atk, def: f.stats.def, spd: f.stats.spd, moves: f.moves.map(m => m.id) } };
}
function setFaction(sd, opts){
  if (sd !== 'keepers' && sd !== 'glimmer') return { ok: false, reason: 'side' };
  if (sd === 'keepers') delete S.flags['story.side']; else S.flags['story.side'] = 'glimmer';
  if (!opts || opts.picked !== false) S.flags['story.side_pick_done'] = true;
  syncSide(); save();
  return { ok: true, side: side(), picked: !!S.flags['story.side_pick_done'] };
}
function debugGiveItem(id, n = 1){
  n |= 0; const c = Math.max(0, itemCount(id) + n);
  if (c) S.bag[id] = c; else delete S.bag[id];
  save(); return c;
}
function debugSetHp(who, n){
  if (!battle.on) return false;
  if (who === 'foe') { const f = curFoe(); if (!f) return false; f.hp = clamp(Math.round(+n), 0, f.maxHp); }
  else { const p = activePet(); if (!p) return false; setMyHp(p, +n); }
  renderBattleCards(); save(); return true;
}
function debugSetCare(o){
  o = o || {};
  const list = o.all ? allPets() : [pet()].filter(Boolean);
  for (const p of list) {
    if (o.hunger != null) p.hunger = clamp(+o.hunger, 0, 100);
    if (o.happy != null) p.happy = clamp(+o.happy, 0, 100);
    if (o.energy != null) p.energy = clamp(+o.energy, 0, 100);
  }
  updateHUD(); save();
  return list.map(p => ({ id: p.id, hunger: p.hunger, happy: p.happy, energy: p.energy }));
}
function debugSetLevel(n, petId){
  const p = petId ? petById(petId) : pet(); if (!p) return null;
  const L = clamp(n | 0, 1, STAT_RULES.LEVEL_CAP);
  p.bx = STAT_RULES.bxForLevel(L);
  updateHUD(); save();
  return { id: p.id, level: levelOf(p), bx: p.bx };
}
function debugSetTextSpeed(v){
  if (!['slow', 'normal', 'fast'].includes(v)) return S.settings.textSpeed;
  S.settings.textSpeed = v; save(); return v;
}
function debugHeal(){
  healTeam(); setRestDue(false); updateHUD(); save();
  return true;
}
function fillKit(){
  debugHeal();
  for (const q of allPets()) { q.hunger = 100; q.happy = 100; q.energy = 100; }
  for (const id of ITEM_ORDER) S.bag[id] = ITEMS[id].cap;
  S.money = Math.max(S.money | 0, 999);
  updateHUD(); save();
  return { money: S.money | 0, bag: Object.assign({}, S.bag) };
}
function debugSnapshot(){
  const q = questCurrent(), p = pet(), foe = battle.on ? curFoe() : null, sq = sideQuest();
  return {
    debug: DEBUG, fast: fastMode,
    map: S.world && S.world.map, x: S.world && S.world.x, y: S.world && S.world.y, facing: S.world && S.world.facing,
    side: side(), standing: standingView(),
    quest: q && { id: q.id, text: q.text, place: q.place },
    sideQuest: sq && { id: sq.id, text: sq.text, place: sq.place },
    flags: Object.keys(S.flags).filter(k => k.startsWith('story.')).sort(),
    seals: Object.keys(S.seals || {}),
    money: S.money | 0, bag: Object.assign({}, S.bag || {}),
    party: S.party.map(q => ({ id: q.id, species: q.species, stage: q.stage, level: levelOf(q), hp: Math.ceil(hpOf(q)), maxHp: maxHpOf(q), hunger: +q.hunger, happy: +q.happy, energy: +q.energy })),
    partner: p && p.id,
    hold: !!(S.world && S.world.restDue),
    battle: foe ? { state: battle.state, kind: battle.kind, panel: battle.panel, foe: { form: foe.form, name: foeName(foe), type: foe.type, level: foe.level, hp: foe.hp, maxHp: foe.maxHp, atk: foe.stats.atk, def: foe.stats.def, spd: foe.stats.spd, moves: foe.moves.map(m => m.id) } } : null,
    scene: scene ? scene.id : null,
  };
}
function debugCatalog(){
  return {
    checkpoints: debugCheckpointList(),
    items: ITEM_ORDER.map(id => ({ id, name: ITEMS[id].name, cap: ITEMS[id].cap, price: ITEMS[id].price })),
    species: SPECIES.map(sp => ({ id: sp.id, type: sp.type, stages: sp.stages.map(st => st.name) })),
    factions: ['keepers', 'glimmer'],
    maps: Object.keys(WORLD),
    trainers: Object.keys(TRAINERS_BASE),
    scenes: Object.keys(SCENES),
    booths: (window.PPMinigames && PPMinigames.RULE) ? Object.keys(PPMinigames.RULE) : [],
  };
}
function devChecks(){
  return {
    quest: PPQuests.devCheck(MAPDATA),
    glimmer: glimmerDevCheck(),
    standing: PPStanding.devCheck(),
    befriend: befriendDevCheck(),
    charity: highCharityDevCheck(),
    music: PPSound.musicCheck(),
    minigames: (window.PPMinigames && PPMinigames.devCheck) ? PPMinigames.devCheck() : [],
    heights: heightsDevCheck(),
    ribbit: (window.PPRibbit && PPRibbit.devCheck) ? PPRibbit.devCheck() : ['PPRibbit missing'],
    map: mapDevCheck(),
  };
}
function debugFlagValue(raw){
  const s = String(raw == null ? '' : raw).trim();
  if (s === '' || s === 'true') return true;
  if (s === 'false' || s === 'null') return null;
  if (/^-?\d+$/.test(s)) return +s;
  return s;
}
function readEncOpts(){
  return { species: $('#dbgSpecies').value, stage: +$('#dbgStage').value, level: +$('#dbgLevel').value, hpFrac: +$('#dbgHp').value };
}
function renderEncPreview(){
  const el = $('#dbgEncStats'); if (!el || !$('#dbgSpecies') || !$('#dbgSpecies').value) return;
  const o = readEncOpts();
  const p = encounterPreview(o.species, o.level, o.stage, o.hpFrac);
  el.textContent = p
    ? p.name + '  ·  ' + p.type + '  ·  Lv ' + p.level + '\nHP ' + p.hp + '/' + p.maxHp + '  ATK ' + p.atk + '  DEF ' + p.def + '  SPD ' + p.spd + '\nMoves: ' + (p.moveNames.join(', ') || 'none') + '\nBefriend: ' + p.odds.label + ' (' + p.odds.width + ')'
    : 'Pick a Walkling.';
}
let debugUiBuilt = false;
function fillSelect(sel, rows){
  sel.textContent = '';
  for (const r of rows) { const o = document.createElement('option'); o.value = r.value; o.textContent = r.label; sel.append(o); }
}
function addGroup(sel, label, rows){
  const g = document.createElement('optgroup'); g.label = label;
  for (const r of rows) { const o = document.createElement('option'); o.value = r.value; o.textContent = r.label; g.append(o); }
  sel.append(g);
}
function buildDebugUi(){
  if (debugUiBuilt) return; debugUiBuilt = true;
  const list = debugCheckpointList();
  addGroup($('#dbgCheckpoint'), 'Story', list.filter(e => e.chain === 'main').map(e => ({ value: e.id, label: e.place + ' · ' + e.id })));
  addGroup($('#dbgCheckpoint'), 'Side', list.filter(e => e.chain === 'side').map(e => ({ value: e.id, label: e.place + ' · ' + e.id })));
  addGroup($('#dbgCheckpoint'), 'Places', list.filter(e => e.chain === 'extra').map(e => ({ value: e.id, label: e.place + ' · ' + e.id })));
  fillSelect($('#dbgItem'), ITEM_ORDER.map(id => ({ value: id, label: ITEMS[id].name })));
  fillSelect($('#dbgSpecies'), SPECIES.map(sp => ({ value: sp.id, label: sp.stages[0].name + ' · ' + sp.type })));
  fillSelect($('#dbgStage'), [{ value: '0', label: 'First form' }, { value: '1', label: 'Second form' }, { value: '2', label: 'Third form' }]);
  fillSelect($('#dbgHp'), [{ value: '1', label: 'HP 100%' }, { value: '0.75', label: 'HP 75%' }, { value: '0.5', label: 'HP 50%' }, { value: '0.25', label: 'HP 25%' }, { value: '0.1', label: 'HP 10%' }]);
  fillSelect($('#dbgMap'), Object.keys(WORLD).sort().map(id => ({ value: id, label: ((WORLD[id].name || id) + ' · ' + id) })));
  fillSelect($('#dbgTrainer'), Object.keys(TRAINERS_BASE).sort().map(id => ({ value: id, label: ((TRAINERS_BASE[id].name || id) + ' · ' + id) })));
  fillSelect($('#dbgTextSpeed'), [{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }]);
  const booths = (window.PPMinigames && PPMinigames.RULE) ? Object.keys(PPMinigames.RULE) : [];
  fillSelect($('#dbgBooth'), booths.map(id => ({ value: id, label: id })));
  $('#dbgLevel').value = '5';
  $('#dbgItemN').value = '1';
  $('#dbgPetLevel').value = '5';
  $('#dbgHours').value = '8';
  $('#dbgFlag').value = 'story.met_fen';
  $('#dbgFlagVal').value = 'true';
  $('#dbgScene').value = 'orchard';
}
function renderDebugPanel(){
  if (!S) return;
  const view = standingView();
  $('#dbgKeepersNow').textContent = view.keepers.points + ' · ' + view.keepers.name;
  $('#dbgGlimmerNow').textContent = view.glimmer.points + ' · ' + view.glimmer.name;
  $('#dbgKeepersPts').value = String(view.keepers.points);
  $('#dbgGlimmerPts').value = String(view.glimmer.points);
  $('#dbgSideKeepers').setAttribute('aria-pressed', String(side() === 'keepers'));
  $('#dbgSideGlimmer').setAttribute('aria-pressed', String(side() === 'glimmer'));
  $('#dbgFast').textContent = fastMode ? 'FAST ON' : 'FAST OFF';
  $('#dbgFast').setAttribute('aria-pressed', String(!!fastMode));
  if ($('#dbgTextSpeed').options.length) $('#dbgTextSpeed').value = S.settings.textSpeed || 'normal';
  $('#dbgAcorns').value = String(S.money | 0);
  const live = $('#dbgLive'), hpBox = $('#dbgBattleHp');
  if (battle.on && curFoe()) {
    const f = curFoe(), p = activePet(), st = f.stats;
    let line = foeName(f) + '  Lv ' + f.level + '  ' + f.type + '\nHP ' + f.hp + '/' + f.maxHp + '  ATK ' + st.atk + '  DEF ' + st.def + '  SPD ' + st.spd;
    if (p) {
      const L = levelOf(p), mine = statsAt(formIdOf(p), L);
      line += '\n' + petName(p) + '  Lv ' + L + '  HP ' + Math.ceil(hpOf(p)) + '/' + maxHpOf(p);
      if (mine) line += '  ATK ' + mine.atk + '  DEF ' + mine.def + '  SPD ' + mine.spd;
    }
    live.hidden = false; live.textContent = line; hpBox.hidden = false;
    $('#dbgFoeHp').value = String(f.hp);
    if (p) $('#dbgMyHp').value = String(Math.ceil(hpOf(p)));
  } else { live.hidden = true; hpBox.hidden = true; }
  renderEncPreview();
}
function bindDebugUi(){
  $('#setDebug').addEventListener('click', () => {
    sfx('tap');
    if (DEBUG) { closeSettings(); openDebug(); return; }
    const g = $('#dbgGate'); g.hidden = !g.hidden; renderDebugGate();
    if (!g.hidden) $('#dbgPass').focus();
  });
  $('#dbgUnlock').addEventListener('click', tryDebugUnlock);
  $('#dbgPass').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); tryDebugUnlock(); } });
  $('#dbgTag').addEventListener('click', () => { if (!DEBUG) return; if ($('#ovDebug').hidden) openDebug(); else closeDebug(); });
  $('#dbgClose').addEventListener('click', () => { sfx('tap'); closeDebug(); });
  $('#ovDebug').addEventListener('click', e => { if (e.target === e.currentTarget) closeDebug(); });
  $('#dbgLock').addEventListener('click', () => { setDebugEnabled(false); closeDebug(); toast('Debug mode off.'); });
  $('#dbgGoCheckpoint').addEventListener('click', () => {
    const r = applyCheckpoint($('#dbgCheckpoint').value);
    if (!r.ok) debugOut(debugWhy(r.reason));
  });
  $('#dbgGiveItem').addEventListener('click', () => {
    const id = $('#dbgItem').value, n = Math.max(1, $('#dbgItemN').value | 0), c = debugGiveItem(id, n);
    debugOut((ITEMS[id] ? ITEMS[id].name : id) + ' ×' + c + '.');
  });
  $('#dbgSetAcorns').addEventListener('click', () => {
    S.money = Math.max(0, $('#dbgAcorns').value | 0); save(); debugOut(acorns(S.money) + '.');
  });
  for (const id of ['dbgSpecies', 'dbgStage', 'dbgLevel', 'dbgHp']) {
    const el = $('#' + id); if (!el) continue;
    el.addEventListener('change', renderEncPreview); el.addEventListener('input', renderEncPreview);
  }
  $('#dbgSpawnEnc').addEventListener('click', () => {
    const r = spawnEncounter(readEncOpts());
    if (!r.ok) debugOut(debugWhy(r.reason));
  });
  $('#dbgPlaceWild').addEventListener('click', () => {
    const r = spawnEncounter(Object.assign({ onMap: true }, readEncOpts()));
    if (!r.ok) { debugOut(debugWhy(r.reason)); return; }
    dismissForDebug(); showTab('walk');
    toast(r.preview.name + ' is on the map.');
  });
  $('#dbgSideKeepers').addEventListener('click', () => { const r = setFaction('keepers'); renderDebugPanel(); toast('Pledged to ' + STANDING_CFG.sides[r.side].name + '.'); });
  $('#dbgSideGlimmer').addEventListener('click', () => { const r = setFaction('glimmer'); renderDebugPanel(); toast('Pledged to ' + STANDING_CFG.sides[r.side].name + '.'); });
  const setMeter = (sd, input) => {
    const n = setStanding(sd, +$(input).value);
    if (n == null) return;
    save(); renderDebugPanel(); toast(STANDING_CFG.sides[sd].short + ' standing ' + n + '.');
  };
  $('#dbgSetKeepers').addEventListener('click', () => setMeter('keepers', '#dbgKeepersPts'));
  $('#dbgSetGlimmer').addEventListener('click', () => setMeter('glimmer', '#dbgGlimmerPts'));
  $('#dbgHeal').addEventListener('click', () => { debugHeal(); toast('Team healed.'); });
  $('#dbgFillCare').addEventListener('click', () => { debugSetCare({ hunger: 100, happy: 100, energy: 100, all: true }); toast('Care filled.'); });
  $('#dbgFast').addEventListener('click', () => { setFast(!fastMode); renderDebugPanel(); });
  $('#dbgSetLevel').addEventListener('click', () => { const r = debugSetLevel(+$('#dbgPetLevel').value); if (r) debugOut('Partner Lv ' + r.level + '.'); });
  $('#dbgResetCaps').addEventListener('click', () => { const p = pet(); if (!p) return; delete p.cx; delete p.ex; delete S.flags[BOWL.flag]; updateHUD(); save(); toast('Daily XP caps reset.'); });
  $('#dbgSkip').addEventListener('click', () => {
    const sec = Math.max(0, +$('#dbgHours').value || 0) * 3600;
    catchUp(sec); regenAll(sec); updateHUD(); save(); debugOut('Skipped ' + (+$('#dbgHours').value || 0) + ' h.');
  });
  $('#dbgWarp').addEventListener('click', () => {
    const map = $('#dbgMap').value;
    const busy = debugBusy(); if (busy) { debugOut(debugWhy(busy)); return; }
    if (!WORLD[map]) { debugOut(debugWhy('map')); return; }
    dismissForDebug(); showTab('walk');
    const m = WORLD[map], sp = m.start || m.safe || { x: 1, y: 1 };
    arriveAt({ map, x: sp.x, y: sp.y, facing: sp.facing || 'down' });
    toast('Now in ' + (m.name || map) + '.');
  });
  $('#dbgRunScene').addEventListener('click', () => {
    const id = $('#dbgScene').value.trim();
    if (!sceneSteps(id) || scene) { debugOut(scene ? debugWhy('scene') : 'No scene "' + id + '".'); return; }
    dismissForDebug(); showTab('walk'); runScene(id);
  });
  $('#dbgSetFlag').addEventListener('click', () => {
    const k = $('#dbgFlag').value.trim(); if (!k) return;
    const v = debugFlagValue($('#dbgFlagVal').value);
    if (v === null) delete S.flags[k]; else S.flags[k] = v;
    save(); syncSide(); debugOut(k + ' = ' + String(S.flags[k]));
  });
  $('#dbgClearFlag').addEventListener('click', () => {
    const k = $('#dbgFlag').value.trim(); if (!k) return;
    delete S.flags[k]; save(); syncSide(); debugOut('Cleared ' + k + '.');
  });
  $('#dbgForceTrainer').addEventListener('click', () => {
    const id = $('#dbgTrainer').value;
    const busy = debugBusy(); if (busy) { debugOut(debugWhy(busy)); return; }
    if (!TRAINERS[id]) { debugOut('Unknown trainer.'); return; }
    if ($('#dbgRematch').checked) delete S.flags['trainer.' + id];
    else if (S.flags['trainer.' + id]) { debugOut('Already beaten. Turn on rematch.'); return; }
    dismissForDebug(); showTab('walk');
    if (!openBattle({ kind: 'trainer', trainerId: id })) debugOut('Could not start that battle.');
  });
  $('#dbgWin').addEventListener('click', () => { if (!battle.on) { debugOut('No battle is open.'); return; } closeDebug(); finish('win', battle.id); });
  $('#dbgLose').addEventListener('click', () => { if (!battle.on) { debugOut('No battle is open.'); return; } closeDebug(); finish('tired', battle.id); });
  $('#dbgSetFoeHp').addEventListener('click', () => { if (debugSetHp('foe', +$('#dbgFoeHp').value)) renderDebugPanel(); });
  $('#dbgSetMyHp').addEventListener('click', () => { if (debugSetHp('me', +$('#dbgMyHp').value)) renderDebugPanel(); });
  $('#dbgKit').addEventListener('click', () => { const r = fillKit(); debugOut('Kit ready. ' + acorns(r.money) + '.'); });
  $('#dbgSight').addEventListener('click', () => { sightShown = !sightShown; debugOut(sightShown ? 'Sight lines on.' : 'Sight lines off.'); });
  $('#dbgEndScene').addEventListener('click', () => { if (!scene) { debugOut('No scene is open.'); return; } scene.skip = true; closeDebug(); });
  $('#dbgTextSpeed').addEventListener('change', () => debugSetTextSpeed($('#dbgTextSpeed').value));
  $('#dbgBoothGo').addEventListener('click', () => {
    const id = $('#dbgBooth').value;
    const busy = debugBusy(); if (busy) { debugOut(debugWhy(busy)); return; }
    dismissForDebug(); showTab('walk');
    const o = Object.values(WORLD).reduce((a, m) => a.concat(m.objs || []), []).find(x => x.booth === id);
    if (!o) { debugOut('No booth for ' + id + '.'); return; }
    openBooth(o);
  });
  $('#dbgClearHold').addEventListener('click', () => { debugHeal(); toast('Lantern hold cleared.'); });
  $('#dbgChecks').addEventListener('click', () => {
    const d = devChecks();
    const bad = Object.entries(d).reduce((a, [k, v]) => a.concat((v || []).map(s => k + ': ' + s)), []);
    debugOut(bad.length ? bad.join('\n') : 'All dev checks passed.', true);
    if (!bad.length) toast('All dev checks passed.');
  });
  $('#dbgSnap').addEventListener('click', () => {
    const text = JSON.stringify(debugSnapshot(), null, 2);
    debugOut(text, true); toast('Snapshot ready.');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(() => {});
  });
}

/* ---------- input ---------- */
function bindInput(){
  $$('#tabs button').forEach(b => b.addEventListener('click', () => {
    if (tabsGuarded()) return;
    if (b.dataset.tab === 'quest') { openQuest(); return; }
    if (b.dataset.tab !== screen) sfx('tap');
    showTab(b.dataset.tab);
  }));
  $('#settingsBtn').addEventListener('click', () => {
    if (!$('#ovCopy').hidden || !$('#ovReset').hidden) return;
    if (tabsGuarded() && allPets().length) return;
    if ($('#ovSettings').hidden) openSettings(); else closeSettings();
  });
  // option buttons that just appeared ignore taps (capture phase, before their own handlers)
  for (const ev of ['click', 'pointerup']) document.addEventListener(ev, e => {
    if (performance.now() < optArmAt && e.target.closest && e.target.closest('#sbChoices button, #sbName button, #ovBasket button, #ovLook button, #ovQuest button')) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  $('#setClose').addEventListener('click', () => { sfx('tap'); closeSettings(); });
  $('#ovSettings').addEventListener('click', e => { if (e.target === e.currentTarget) closeSettings(); });
  $('#setSound').addEventListener('click', () => { const m = PPSound.toggle(); renderSoundRow(); if (!m) sfx('tap'); toast(m ? 'Sound off' : 'Sound on'); });
  $('#setMusic').addEventListener('click', toggleMusic);
  $('#setFollower').addEventListener('click', () => { toggleFollower(); renderFollowerBtn(); });
  $('#setLook').addEventListener('click', () => { sfx('tap'); closeSettings(); openLook(false); });
  bindDebugUi();
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
  $('#petCanvas').addEventListener('pointerdown', e => { if (screen === 'pet' && !overlayOpen() && petHit(e.clientX, e.clientY)) { e.preventDefault(); patPet(); } });   // CARE_LOOP A: pats
  $('#petBagBtn').addEventListener('click', () => openBag());
  $('#walkBagBtn').addEventListener('click', () => openBag());
  $('#phoneBtn').addEventListener('click', openPhone);
  $('#phoneClose').addEventListener('click', () => { sfx('tap'); closePhone(); });
  $('#phoneBack').addEventListener('click', () => { sfx('tap'); const paneTitle = $('#phonePaneTitle'); if (paneTitle) paneTitle.hidden = true; $('#phoneHome').hidden = false; $('#phonePane').hidden = true; });
  $$('#phoneHome .phone-app').forEach(b => b.addEventListener('click', () => phoneApp(b.dataset.app)));
  $('#questBtn').addEventListener('click', openQuest);
  $('#questTabNext').addEventListener('click', () => questTabTo('next'));
  $('#questTabStanding').addEventListener('click', () => questTabTo('standing'));
  $('#questClose').addEventListener('click', () => { sfx('tap'); closeQuest(); });
  $('#questMap').addEventListener('click', questShowOnMap);
  $('#ovQuest').addEventListener('click', e => { if (e.target === e.currentTarget) closeQuest(); });
  $('#mapBtn').addEventListener('click', openMap);
  $('#mapClose').addEventListener('click', () => closeMap());
  $('#ovMap').addEventListener('click', e => { if (e.target === e.currentTarget) closeMap(); });   // the dark margin closes; the parchment stays up so a place can be read
  $('#regionCanvas').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = mapNodeAt((e.clientX - r.left) * 320 / r.width, (e.clientY - r.top) * 192 / r.height);
    if (id) selectMapNode(id);
  });
  $('#bagClose').addEventListener('click', () => closeBag());
  $('#ovBag').addEventListener('click', e => { if (e.target === e.currentTarget) closeBag(); });
  $('#shopClose').addEventListener('click', () => closeShop());
  $('#ovShop').addEventListener('click', e => { if (e.target === e.currentTarget) closeShop(); });
  $('#lookShuffle').addEventListener('click', shuffleLook);
  $('#lookDone').addEventListener('click', lookDone);
  $('#lookCancel').addEventListener('click', () => { sfx('tap'); closeLook(); });
  const ln = $('#lookName');
  ln.addEventListener('input', () => { const v = ln.value.replace(BAD_NAME_CH, ''); if (v !== ln.value) ln.value = v; });   // `<b>` can't be typed
  ln.addEventListener('focus', () => ln.select());
  ln.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ln.blur(); } });
  $('#startOver').addEventListener('click', openReset);
  $('#setCopy').addEventListener('click', () => { sfx('tap'); downloadCopy(); });
  $('#setRead').addEventListener('click', openCopy);
  $('#resetCopy').addEventListener('click', () => { sfx('tap'); downloadCopy(); });
  $('#copyCancel').addEventListener('click', () => { sfx('tap'); closeCopy(); });
  $('#copyPick').addEventListener('click', () => { sfx('tap'); $('#copyFile').click(); });
  $('#copyYes').addEventListener('click', () => { sfx('tap'); confirmCopy(); });
  $('#copyFile').addEventListener('change', () => {
    const f = $('#copyFile').files && $('#copyFile').files[0];
    $('#copyFile').value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => stageCopy(String(reader.result || ''));
    reader.onerror = () => toast(COPY_WHY.bad);
    reader.readAsText(f);
  });
  $('#ovCopy').addEventListener('click', e => { if (e.target === e.currentTarget) closeCopy(); });
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
  const gearBtn = $('#scGear');
  if (gearBtn) gearBtn.addEventListener('click', () => {
    const p = allPets().find(q => q.id === statsCard.id); if (!p) return;
    statsCard.gear = !statsCard.gear; sfx('tap');
    gearBtn.setAttribute('aria-pressed', statsCard.gear ? 'true' : 'false');
    const box = $('#scGearBox'); if (!box) return;
    box.hidden = !statsCard.gear; box.textContent = '';
    if (statsCard.gear) fillWalklingExtras(box, p);
  });
  $('#ovStats').addEventListener('click', e => { if (e.target === e.currentTarget) closeStatsCard(); });   // tap outside the card
  $('#wlClose').addEventListener('click', () => { sfx('tap'); closeWalklingSheet(); });
  $('#wlNickSet').addEventListener('click', () => commitWalklingNick());
  $('#wlNick').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commitWalklingNick(); }
    if (e.key === 'Escape') { e.preventDefault(); closeWalklingSheet(); }
  });
  $('#wlNick').addEventListener('change', () => { if (!$('#ovWalkling').hidden) commitWalklingNick(); });
  $('#ovWalkling').addEventListener('click', e => { if (e.target === e.currentTarget) closeWalklingSheet(); });
  $('#jnClose').addEventListener('click', () => closeJournal());
  $('#ovJournal').addEventListener('click', e => { if (e.target === e.currentTarget) closeJournal(); });
  $('#encNick').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (battle.panel === 'end') closeBattle(); } });
  // battle (BATTLE §8)
  $$('[data-bact]').forEach(b => b.addEventListener('click', () => battleAct(b.dataset.bact)));
  $('#btFightBack').addEventListener('click', () => { if (battle.state === 'CHOOSE') { sfx('tap'); setPanel('acts'); } });
  $('#btBefBack').addEventListener('click', () => { if (battle.state === 'CHOOSE') { sfx('tap'); leaveBefriendBar(); } });
  $('#encGo').addEventListener('click', encounterPress);
  $('#btOk').addEventListener('click', () => { if (dismissSealCard()) { sfx('tap'); return; } if (battle.panel === 'end') { sfx('tap'); closeBattle(); } });
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
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (window.PPMinigames && PPMinigames.keyDown(e)) { e.preventDefault(); return; }
    if (scene && sbox.resolve && $('#ovCopy').hidden && $('#ovSettings').hidden && $('#ovReset').hidden && $('#ovDebug').hidden && $('#ovPhone').hidden) {                  // Space / Enter advance the text box; Escape does nothing during a choice
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) sceneTap(); return; }
    }
    if ((e.key === ' ' || e.key === 'Enter') && screen === 'walk' && !overlayOpen() && !e.repeat) { if (talkFacing()) { e.preventDefault(); return; } }
    if (e.key === 'Escape' && !$('#ovStats').hidden) { closeStatsCard(); return; }
    if (e.key === 'Escape' && !$('#ovJournal').hidden) { closeJournal(); return; }
    if (e.key === 'Escape' && !$('#ovPhone').hidden) { closePhone(); return; }
    if (e.key === 'Escape' && !$('#ovCopy').hidden) { closeCopy(); return; }
    if (e.key === 'Escape' && !$('#ovReset').hidden) { closeReset(); return; }
    if (e.key === 'Escape' && !$('#ovDebug').hidden) { closeDebug(); return; }
    if (e.key === 'Escape' && !$('#ovSettings').hidden) { closeSettings(); return; }
    if (e.key === 'Escape' && !$('#ovLook').hidden && !lookUI.newPlayer) { closeLook(); return; }
    if (!$('#ovMap').hidden && KEYS[e.key]) { e.preventDefault(); if (!e.repeat) mapNudge(KEYS[e.key]); return; }   // arrows read the parchment; they must not walk the keeper underneath
    if (e.key === 'Escape' && !$('#ovMap').hidden) { e.preventDefault(); closeMap(); return; }
    if (e.key === 'Escape' && !$('#ovQuest').hidden) { e.preventDefault(); closeQuest(); return; }
    if (bagKey(e)) { e.preventDefault(); return; }
    if (shopKey(e)) { e.preventDefault(); return; }
    if (KEYS[e.key] && screen === 'walk') { e.preventDefault(); if (walk.key !== KEYS[e.key]) { walk.queued = DIRS[KEYS[e.key]]; hideBumpHint(); } walk.key = KEYS[e.key]; return; }
    if (DEBUG) {                                 // debug keys only with ?debug=1
      if (e.key === 'e' || e.key === 'E') { startEvolution(true); return; }          // force evolve
      if (e.key === 'g' || e.key === 'G') { if (!overlayOpen()) { showTab('walk'); if (!overlayOpen()) startEncounterIntro(); } return; } // force encounter (spawn-weighted species)
      if (e.key === 'f' || e.key === 'F') { setFast(!fastMode); return; }          // toggle fast decay
      if (e.key === 'h' || e.key === 'H') { healTeam(); toast('Team healed (debug)'); return; }
    }
    if (!$('#ovSheet').hidden) { if (e.key === 'Escape' && !$('#shCancel').hidden) closeSheet(null); return; }
    if (e.key === 'Escape' && !$('#ovWalkling').hidden) { closeWalklingSheet(); return; }
    if (!$('#ovBattle').hidden) { battleKey(e); return; }
    if ('123'.includes(e.key)) showTab(['pet','walk','col'][+e.key - 1]);
    if (e.key === '4') { openQuest(); return; }
  });
  window.addEventListener('keyup', e => { if (window.PPMinigames) PPMinigames.keyUp(e); if (KEYS[e.key] === walk.key) walk.key = null; });
  const playStop = $('#playStop'); if (playStop) playStop.addEventListener('click', () => PPMinigames.stop());
  const playP1 = $('#playP1'), playP2 = $('#playP2');
  if (playP1) playP1.addEventListener('pointerdown', e => { e.preventDefault(); PPMinigames.press(0); });
  if (playP2) playP2.addEventListener('pointerdown', e => { e.preventDefault(); PPMinigames.press(1); });
  window.addEventListener('blur', clearMoves);
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); PPSound.pauseMusic(); } else PPSound.resumeMusic(); });
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
      q.hunger = decayTo(q.hunger, R.hunger * k * dt, FOOD_RULES.floor);
      q.happy = decayTo(q.happy, R.happy * k * dt * (q.hunger < FOOD_RULES.hungry ? 2 : 1), JOY_FLOOR);
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
  if (S && screen === 'walk') { syncMapBtn(); syncJournalBtn(); syncQuestBtn(); syncSide(); syncWalkTip(); }
  if (!$('#ovMap').hidden) drawRegionMap(t);
  if (!$('#ovLook').hidden) drawLookPreview(t);
  if (scene) sbTick();
  if (p) {
    if (screen === 'pet') { pumpHello(); pumpBondUp(); drawPetScene(t, dt); updateCareButtons(); }
    if (!$('#ovBattle').hidden) drawBattle(t, dt);
    else if (!overlayOpen()) pumpLearn();
    syncBagBtns();                                        // BAG chrome: hidden during scenes, battles and before the starter (INVENTORY §6)
    if (evo.active) drawEvolution(t);
    if (!$('#ovStats').hidden && (statsCard.t += dt) >= 1) { statsCard.t = 0; renderStatsCard(); }   // HP regen etc. stay live
    if (!$('#ovWalkling').hidden && (walklingSheet.t += dt) >= 1) {
      walklingSheet.t = 0;
      const q = allPets().find(x => x.id === walklingSheet.id);
      if (!q) closeWalklingSheet(); else paintWalklingStats(q);
    }
  }
  requestAnimationFrame(frame);
}

/* ---------- HP regen (TYPES_STATS §7) ---------- */
// Out of battle every pet regains 10% of max HP per 10 real minutes (real time even in fast mode). Kept apart from the
// care decay above and in catchUp so it can't change FOOD/JOY/NRG.
function regenAll(sec){ if (S && sec > 0) allPets().forEach(q => { regenHp(q, sec); wakeIfRested(q); }); }   // regen keeps running during a faint nap (BATTLE §7.2)

/* ---------- offline catch-up ---------- */
// Applies `sec` seconds of away-time decay to every owned pet at the current rate mode.
// No time cap: the floors protect players (FOOD and JOY 20, NRG 10) and stats already at/below them stay put.
// Same rule as live decay (PACING v0.3), including JOY x2 for the part of the time FOOD is under 25.
function catchUp(sec){
  if (!(sec > 0) || !S || !allPets().length) return;
  const R = rate();
  allPets().forEach(p => { const k = roleMult(p); if (!k) return;   // PACING §5: box pets never get their boxed time
    const fr = R.hunger * k, f0 = p.hunger;
    const hungrySec = f0 < FOOD_RULES.hungry ? sec : Math.max(0, sec - (f0 - FOOD_RULES.hungry) / fr);   // JOY x2 only after FOOD crosses 25 (PACING §2)
    p.hunger = decayTo(f0, sec * fr, FOOD_RULES.floor);
    p.happy = decayTo(p.happy, (sec + hungrySec) * R.happy * k, JOY_FLOOR);
    p.energy = decayTo(p.energy, sec * R.energy * k, OFFLINE_FLOOR); });
}
// A backgrounded tab pauses requestAnimationFrame (and the periodic save keeps bumping S.last),
// so catch up on return using the time the tab was actually hidden.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (hiddenAt && S) { const sec = (Date.now() - hiddenAt) / 1000; catchUp(sec); regenAll(sec); hiddenAt = 0; updateHUD(); save(); bowlHint(); }
});

/* ---------- online saves (cloud.js; a no-op unless cloud_config.js holds a config) ---------- */
// Summary of a save string for the "which game to keep" choice: partner, pet count, Seals, last played. Never touches storage.
function cloudSummary(raw){
  let o = null; try { o = JSON.parse(raw); } catch(e) {}
  if (!o || typeof o !== 'object' || o.v !== 2) return null;
  const s = PPSave.normalizeV2(o, Date.now()), p = s.party.find(q => q.id === s.partnerId) || s.party[0];
  return { partner: p ? petName(p) : null, sp: p ? spi(p) : null, stage: p ? p.stage : 0, pets: s.party.length + s.box.length,
    seals: Object.values(s.seals).filter(Boolean).length, last: s.last, player: s.player.name };
}
function startCloud(){
  PPCloud.start({
    getState: () => (readOnly || resetting) ? null : S,
    save, toast, sfx, summary: cloudSummary,
    drawPet: (cv, sp, st) => spriteCanvas(cv, sp, st, 'n'),
    busy: () => overlayOpen(),
    beforeOverlay: () => { clearMoves(); lockTabs(true); },
    afterOverlay: () => lockTabs(!$('#ovSettings').hidden),
    // adopt a cloud save: this page stops writing, the v2 key gets the cloud copy as-is (its `last` keeps away-time decay), reload
    adopt: raw => { if (resetting) return; resetting = true; clearMoves(); clearInterval(saveTimer); try { localStorage.setItem(PPSave.V2_KEY, raw); } catch(e) {} location.reload(); },
  });
}

/* ---------- new-build check ---------- */
// GitHub Pages caches index.html for ~10 min, so a phone can keep an old build. version.json (written by tools/bump_build.py,
// always equal to window.BUILD) is fetched with a unique ?t= on boot and when the tab comes back (at most once a minute).
// A different id shows a small notice; tapping it saves and reloads. Silent on any error; queued while an overlay is open.
const buildChk = { at: 0, ready: null, gone: null };
function checkBuild(force){
  const t = Date.now();
  if (readOnly || !window.BUILD || typeof fetch !== 'function' || (!force && t - buildChk.at < 60e3)) return Promise.resolve(null);
  buildChk.at = t;
  return fetch('version.json?t=' + t, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => {
    const b = j && typeof j.build === 'string' ? j.build : null;
    if (b && b !== window.BUILD && b !== buildChk.gone) buildChk.ready = b;
    pumpBuildBar(); return b;
  }).catch(() => null);
}
function pumpBuildBar(){
  const el = $('#buildBar'); if (!el) return;
  const show = !!buildChk.ready && !readOnly && !overlayOpen();
  if (el.hidden === show) el.hidden = !show;
}
// Reload URL that skips the Pages cache for index.html: same path, a fresh b= first (an old b= dropped), every other param
// (debug, fast, cloud...) kept in order, the hash kept. Params are only ever read by name, so b= is inert.
function freshUrl(build){
  const q = new URLSearchParams(location.search); q.delete('b');
  const rest = q.toString(), b = encodeURIComponent((build || 'x') + '.' + Date.now().toString(36));
  return location.pathname + '?b=' + b + (rest ? '&' + rest : '') + location.hash;
}
// After such a reload, tidy b= out of the address bar (DEBUG / fast / cloud already read their params at load).
function dropBuildParam(){
  try { const q = new URLSearchParams(location.search); if (!q.has('b')) return; q.delete('b'); const rest = q.toString();
    history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash); } catch(e) {}
}
function startBuildCheck(){
  const el = $('#buildBar'); if (!el) return;
  $('#buildGo').addEventListener('click', () => { save(); location.replace(freshUrl(buildChk.ready)); });
  dropBuildParam();
  $('#buildX').addEventListener('click', () => { buildChk.gone = buildChk.ready; buildChk.ready = null; pumpBuildBar(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkBuild(); });
  setInterval(pumpBuildBar, 500);
  setTimeout(() => checkBuild(), 1500);              // after boot settles; never blocks it
}

/* ---------- boot ---------- */
// The v2 key holds a save from a newer build: block play, write nothing (save() is a no-op), keep the save as-is.
function bootReadOnly(){
  readOnly = true; S = null;
  $('#ovNewer').hidden = false; $('#tabs').classList.add('locked');
  $('#newerReload').addEventListener('click', () => location.reload());
  window.PixelPets = Object.freeze({ readOnly: true, get debug(){ return DEBUG; }, get state(){ return null; } });
}
function highCharityDevCheck(){
  const bad = [];
  const m = WORLD.highcharity;
  if (!m) return ['missing highcharity'];
  if (m.w !== 64 || m.h !== 40) bad.push('size ' + m.w + 'x' + m.h);
  if (!m.grid || m.grid.length !== 40 || m.grid.some(r => r.length !== 64)) bad.push('grid');
  if (!TILE_DEF.P || !TILE_DEF.P.walk || !TILE_DEF.D || !TILE_DEF.D.walk || !TILE_DEF.A || !TILE_DEF.A.walk) bad.push('tiles');
  for (const d of (m.objs || []).filter(o => o.kind === 'door' && o.to)) {
    if (!WORLD[d.to]) bad.push('door ' + d.id);
    if (!m.grid[d.y - 1] || m.grid[d.y - 1][d.x] !== 'H') bad.push('door wall ' + d.id);
    if (!(TILE_DEF[m.grid[d.y][d.x]] || {}).walk) bad.push('door step ' + d.id);
  }
  const booths = ((WORLD.hc_hall_in && WORLD.hc_hall_in.objs) || []).filter(o => o.booth).map(o => o.booth).sort().join(',');
  if (booths !== 'chirp,dash,duo,lantern,pairs,shells') bad.push('booths ' + booths);
  if (!SCENES.hc_invite || !SCENES.hc_gate || !SCENES.hc_arena_ask || !TRAINERS.hc_tourney) bad.push('scenes');
  if (!TRAINERS.hc_tourney || TRAINERS.hc_tourney.money !== 0) bad.push('tourney purse');
  if (m.music !== 'charity' || !WORLD.hc_church_in || WORLD.hc_church_in.music !== 'chapel' || !WORLD.hc_hall_in || WORLD.hc_hall_in.music !== 'arcade') bad.push('music map');
  const mc = PPSound.musicCheck && PPSound.musicCheck();
  if (mc && mc.length) bad.push('music ' + mc.join(','));
  if (typeof PPMinigames === 'undefined' || !PPMinigames.devCheck) bad.push('minigames');
  else { const mg = PPMinigames.devCheck(); if (mg.length) bad.push(mg.join(',')); }
  for (const f of ['story.hc_invite', 'story.hc_arrived', 'story.hc_greeted', 'story.hc_games', 'story.hc_tonic',
    'story.hc_clear_lantern', 'story.hc_clear_shells', 'story.hc_clear_chirp', 'story.hc_clear_dash', 'story.hc_clear_pairs',
    'story.hc_clear_hop', 'story.hc_clear_relay', 'story.hc_clear_seek'])
    if (!PPQuests.NOT_STEPS.includes(f)) bad.push('not step ' + f);
  if (!REGION_MAP.nodes.highcharity) bad.push('region');
  return bad;
}
PPMinigames.bind({
  careDay, grantItem, addBond, save, pet, sfx, toast, updateHUD, playerName, acorns, itemLabel,
  BAG_FULL_MSG, fitCanvas, state: () => S,
  party: () => (S && S.party) ? S.party.slice() : [],
  spd: p => { if (!p) return 48; const lv = p.guest ? (p.level || 5) : levelOf(p); const s = statsAt((p.species || 'tide') + '/' + (p.stage || 0), lv); return s ? s.spd : 48; },
  monName: p => { if (!p) return 'Walkling'; if (p.guest) return p.nick; return petName(p); },
});
function registerInstall(){
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
function boot(){
  $$('#tabs canvas').forEach(c => {
    if (c.dataset.icon === 'quest' && REGION_MAP.icon_quest) {
      const gr = REGION_MAP.icon_quest.grid, g = ctx(c); g.clearRect(0, 0, 8, 8);
      gr.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
      return;
    }
    iconCanvas(c, ICONS[c.dataset.icon], PAL.y);
  });
  paintUiIcons();
  fastMode = readFastPref(); renderFastTag(); $('#dbgTag').hidden = !DEBUG;
  $('#envPick').hidden = !DEBUG;               // "Pick a place" presets are debug-only
  renderSettingsGear(); renderSoundRow();
  ENV = PPEnv.init(onEnvChange, { allowOverride: DEBUG }); renderEnv();
  if (PPEnv.geoPref() === 'allow') PPEnv.refresh();
  setInterval(() => { PPEnv.tick(); if (!document.hidden && PPEnv.geoPref() === 'allow') PPEnv.refresh(); }, 5 * 60e3);
  registerInstall();
  PPSave.devCheck(); statsDevCheck();
  { const bb = befriendDevCheck(); if (bb.length) console.error('Walklings: befriend width check failed:', bb.join('; ')); }
  { const qb = PPQuests.devCheck(MAPDATA); if (qb.length) console.error('Walklings: quest chain check failed:', qb.join('; ')); }
  { const gb = glimmerDevCheck(); if (gb.length) console.error('Walklings: glimmer path check failed:', gb.join('; ')); }
  { const hb = heightsDevCheck(); if (hb.length) console.error('Walklings: heights check failed:', hb.join('; ')); }
  { const sb = PPStanding.devCheck(); if (sb.length) console.error('Walklings: standing config check failed:', sb.join('; ')); }
  { const hcb = highCharityDevCheck(); if (hcb.length) console.error('Walklings: high charity check failed:', hcb.join('; ')); }
  { const rb = window.PPRibbit && PPRibbit.devCheck ? PPRibbit.devCheck() : ['PPRibbit missing']; if (rb.length) console.error('Walklings: ribbit check failed:', rb.join('; ')); }
  { const mb = mapDevCheck(); if (mb.length) console.error('Walklings: map check failed:', mb.join('; ')); }
  window.ITEMS = ITEMS;   // save.js validates pet.held against the catalog; ITEMS lives in this file
  const L = PPSave.loadSave();
  if (L.readOnly) { bootReadOnly(); return; }
  S = L.state;                                       // migrated/normalized v2; nothing saved yet, so away-time is intact
  if (S.flags['story.side'] === 'glimmer') ensureCrackedPhone();
  if (allPets().length) { const away = (Date.now() - S.last) / 1000; catchUp(away); regenAll(away); }
  useMap(S.world.map); S.world.map = CUR.id; safeSpot(); resetWild(); renderEnv(); markMapSeen(); noteBoardTown();
  walk.fx = S.world.x; walk.fy = S.world.y;
  bindInput();
  placeFollower(); placeGuide(); renderFollowerBtn(); renderKeeperName();
  // Phase M (INTERIORS §3.3): a new game wakes in the home room and Ilse's intro runs at once (the look picker is inside it).
  // Closed mid-starter: Lodge doorstep with a nudge. Tabs stay locked until the starter; the opening plays on the WALK tab.
  const newGame = !allPets().length && !S.flags['story.intro_seen'];
  const late = L.notice === 'recovered' ? 2700 : 900;
  if (!allPets().length) { updateHUD(); showTab('walk'); lockTabs(false); if (newGame) setTimeout(() => runScene('intro'), 60); else setTimeout(() => toast('Ilse is waiting inside.'), late); }
  else {
    updateHUD(); hello.quietUntil = now() + (!S.player.look || L.notice === 'recovered' ? 4600 : 1400); bowlHint(!S.player.look || L.notice === 'recovered' ? 4600 : 1200);
    if (!S.player.look) setTimeout(() => toast("New: pick your keeper's look under the gear (Change look)."), late);   // after the recovery notice, never over it
    else if (!S.player.name && S.world.map === 'hearthmoor') setTimeout(() => toast('Warden Ilse would like a word at the Lodge.'), late);
  }
  if (L.notice === 'recovered') setTimeout(() => toast("Your save couldn't be read, so your older save was loaded."), 600);
  fitAll();
  if (fastMode) setTimeout(() => toast('FAST MODE ON (debug decay)'), 400);
  PPSound.setMusic(S.settings.music !== false);
  PPSound.musicVol = typeof S.settings.musicVol === 'number' ? S.settings.musicVol : 0.5;
  const theme = trackFor(CUR); if (theme) PPSound.music(theme);   // records the loop; the first tap starts it
  saveTimer = setInterval(save, 5000);
  startCloud();
  startBuildCheck();
  setInterval(() => fadeTick(true), FADE_SAMPLE_MS); setInterval(() => fadeTick(false), 5000); fadeTick(false);
  requestAnimationFrame(t => { lastT = t; frame(t); });
  // Console hooks. Read-only ones are always there and can't change the game; anything that cheats
  // (XP, evolving, spawning, places, fast mode, live state) only works with ?debug=1.
  const copy = o => JSON.parse(JSON.stringify(o));
  const api = {
    get debug(){ return DEBUG; }, get fast(){ return fastMode; }, get rates(){ return { ...rate() }; }, get finds(){ return { at: FINDS.at.slice(), today: S && S.care ? { ...S.care } : null }; }, setFindRng: f => { if (DEBUG) findRng = typeof f === 'function' ? f : Math.random; }, get bond(){ const p = pet(); return p ? { pts: bondPts(p), level: bondLevel(p), at: BOND.at.slice(), today: S.care ? { ...S.care } : null, pending: bondUps.slice(), stretching: !!anim.stretching } : null; }, addBond: n => DEBUG ? addBond(pet(), n) : 0, get touch(){ const p = pet(), t = now(); return { pat: p && p.pat ? { ...p.pat } : null, squint: t < touch.squintUntil, roll: t < touch.rollUntil, away: t < touch.awayUntil, box: (() => { const c = $('#petCanvas'), r = c.getBoundingClientRect(), k = r.width / c.width, pp = petPos(t), half = Math.max(8 * k + 4, PAT.hitCss / 2); return { cx: r.left + (pp.x + 8) * k, cy: r.top + (pp.y + 8) * k, half }; })() }; }, resetHello: () => { delete S.flags[HELLO_FLAG]; save(); }, get hello(){ return { due: helloDue(), day: S && S.flags[HELLO_FLAG] || null, slot: helloSlot(), playing: now() < hello.until, chirpWaiting: !!hello.chirp }; }, helloLines: HELLO_LINES,
    get state(){ return DEBUG ? S : copy(S); },                     // a snapshot unless debugging
    get env(){ return ENV && { ...ENV, tags: ENV.tags.slice() }; }, refreshEnv: () => PPEnv.refresh(true),
    get wild(){ return wild.list.map(w => ({ id: w.id, sp: w.sp, stage: w.stage, lv: w.lv, x: w.x, y: w.y, fx: w.fx, fy: w.fy, moving: !!w.to, shy: (w.shyUntil || 0) > wild.clock, guide: !!w.guide, name: nameOf(w.sp, w.stage) })); },
    get poofs(){ return wild.poofs.length; },
    spawnOdds: (tags, key) => spawnOdds(tags, key), cooldownLeft: act => cdLeft(pet(), act),
    get careXpToday(){ return xpToday(pet(), 'cx'); }, get exploreXpToday(){ return xpToday(pet(), 'ex'); },
    get muted(){ return PPSound.muted; }, careGain, showTab, reorderParty, depositPet, withdrawPet, releasePet, get roleMult(){ return { ...ROLE_MULT }; }, get warmBowlReady(){ return bowlReady(); },
    moves: () => JSON.parse(JSON.stringify(MOVES)), learnset: f => learnset(f).map(e => ({ ...e })),
    defaultMoves: (f, L) => defaultMoves(f, L).slice(), befriendWidth,
    battleLine: (k, v) => battleLine(k, v),
    typeMult: (a, d) => typeMult(a, d), statsAt: (id, L) => { const s = statsAt(id, L); return s && { ...s }; },   // read-only, always public
    openStats: id => openStatsCard(id), closeStats: () => closeStatsCard(),          // UI only (the same as tapping STATS / CLOSE)
    get statsCard(){ return { open: !$('#ovStats').hidden, id: statsCard.id }; },
    get petScene(){ const c = $('#petCanvas'); return { backdrop: backdropName(), sky: skyMode(), tags: envTags().slice(), w: c.width, h: c.height, cssW: parseFloat(c.style.width)||0, cssH: parseFloat(c.style.height)||0 }; },
    get keeper(){ return { x: S.world.x, y: S.world.y, fx: walk.fx, fy: walk.fy, facing: S.world.facing, frame: keeperFrame(), moving: !!walk.to,
      look: Object.assign({}, KEEPER_LOOKS.defaults, shownLook() || {}), name: playerName(), builds: keeperBuilds }; },
    get follower(){ const p = pet(); return { on: followerOn(), shown: fol.x != null && followerOn(), x: fol.x, y: fol.y, fx: fol.fx, fy: fol.fy, facing: fol.facing,
      moving: !!fol.to, id: p ? p.id : null, tired: !!(p && isTired(p)), fainted: !!(p && isFainted(p)), bob: followerBob(now()), droop: p && isFainted(p) ? 1 : 0, under: fol.x === S.world.x && fol.y === S.world.y }; },
  };
  const cheats = {
    runSteps: steps => { showTab('walk'); if (overlayOpen()) return false; runSteps(steps); return true; },   // debug: play ad-hoc scene steps (STINGERS test 14)
    forceEvolve: () => startEvolution(true), forceEncounter: () => { showTab('walk'); if (!overlayOpen()) startEncounterIntro(); },
    forceBattle: (form, level) => {
      showTab('walk'); if (overlayOpen()) return;
      let f = form, lv = level;
      if (!f) { const sp = pickSpecies(), st = pickStage(); f = SPECIES[sp].id + '/' + st; lv = lv || wildLv(sp, st); }
      const [line, st] = String(f).split('/'); if (SP_INDEX[line] == null || !SPECIES[SP_INDEX[line]].stages[+st]) return false;
      return openBattle({ kind: 'wild', form: f, level: lv || wildLevel(+st, Math.random, 'proto', line) });
    },
    showSight: (on = true) => { sightShown = !!on; return CUR.objs.filter(o => o.kind === 'trainer' && present(o)).map(o => ({ id: o.id, line: sightLine(o), canSpot: canSpot(o) })); },
    objPos: id => { const o = CUR.objs.find(x => x.id === id); if (!o) return null; const q = objPos(o); return { present: present(o), x: q.x, y: q.y, fx: q.fx, fy: q.fy, moving: !!q.moving, facing: mapRT.face[id] || q.facing || (TRAINERS[id] || {}).facing || o.facing || 'down' }; },
    forceTrainer: id => { if (!TRAINERS[id] || S.flags['trainer.' + id]) return false; showTab('walk'); if (overlayOpen()) return; return openBattle({ kind: 'trainer', trainerId: id }); },
    setHp: (who, n) => debugSetHp(who, n),
    fadeTick: sample => fadeTick(!!sample), spriteColors: (form, faded) => { const [l, st] = form.split('/'), c = sprSet(SP_INDEX[l], +st, !!faded).n, d = c.getContext('2d').getImageData(0, 0, 18, 18).data, o = new Set();
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) o.add('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('')); return [...o]; }, get fadeQueue(){ return fadeQ.slice(); },
    winBattle: () => { if (battle.on) finish('win', battle.id); }, loseBattle: () => { if (battle.on) finish('tired', battle.id); },
    healTeam, setFaint: (min = 20) => { const p = pet(); if (!p) return; if (min <= 0) { delete p.faintUntil; delete p.hpNow; } else faintPet(p, Date.now() - (20 - min) * 60000); updateHUD(); save(); },
    giveItem: (id, n = 1) => debugGiveItem(id, n),   // debug: no cap; a negative n trims (INVENTORY §6)
    useItem: (id, petId, ctx = 'field') => { const r = useItem(id, petId || (pet() && pet().id), ctx); if (r.ok) { updateHUD(); save(); } return r; },
    grantItem: (id, n) => { const r = grantItem(id, n); save(); return r; },
    buyItem: id => buyItem(id),
    openShop: () => openShop(),
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
    openBooth: id => {
      showTab('walk'); if (scene || overlayOpen()) return false;
      const o = Object.values(WORLD).reduce((a, m) => a.concat(m.objs || []), []).find(x => x.booth === id);
      if (!o) return false; openBooth(o); return true;
    },
    applyPlay: (id, res) => PPMinigames.finish(id, Object.assign({ quit: false, clear: false, score: 0 }, res || {})),
    goto: (map, x, y, facing) => { if (!WORLD[map] || scene) return false; clearMoves(); const m = WORLD[map], sp = m.start || m.safe;
      arriveAt({ map, x: x != null ? x : sp.x, y: y != null ? y : sp.y, facing: facing || 'down' }); return { map: S.world.map, x: S.world.x, y: S.world.y }; },
    setFlag: (k, v = true) => { if (v === null || v === false) delete S.flags[k]; else S.flags[k] = v; save(); syncSide(); return S.flags[k]; },
    setSide: s => { if (s == null || s === SIDE_DEFAULT) delete S.flags['story.side']; else S.flags['story.side'] = String(s); if (S.flags['story.side'] === 'glimmer') ensureCrackedPhone(); save(); syncSide(); return side(); },   // WP-B0
    runScene: id => { if (!sceneSteps(id) || scene) return false; showTab('walk'); runScene(id); return true; },
    // BS debug: set one meter outright (tier-up toasts fire as in play), switch the pledge directly (free = no cost), or open a desk's steps.
    setStanding: (sd, n) => { const r = setStanding(sd, n); if (r != null) { save(); if (!$('#ovQuest').hidden) renderQuestTabs(); } return r; },
    switchSide: (to, free) => switchSide(to, { free: !!free }),
    pledgeDesk: to => { if (!deskOpen(to) || overlayOpen()) return false; showTab('walk'); runSteps(pledgeDeskSteps(to)); return true; },
    storyTails: () => ({ starter: (SCENES.starter || []).slice(-2), rival1: (SCENES.rival1 || []).slice(-2) }),
    rollWildTrack: () => takeBattleTrack('wild'),
    endScene: () => { if (!scene) return false; scene.skip = true; return true; },
    // tests: expand a scene/dialog string the way a text box would; vars = scene vars (tags, line, suggest), pet = viewed pet
    expandText: (text, vars, viewPetObj) => { const keep = scene;
      if (!keep) scene = { vars: Object.assign({ tags: [], line: null, suggest: null }, vars || {}), view: { flags: {}, name: undefined, pet: viewPetObj || null, nick: undefined }, pending: [] };
      try { return expand(text); } finally { scene = keep; } },

    checkpoint: id => applyCheckpoint(id),
    checkpoints: () => debugCheckpointList(),
    encounterPreview: (speciesOrForm, level, stage, hpFrac) => encounterPreview(speciesOrForm, level, stage, hpFrac),
    spawnEncounter: opts => spawnEncounter(opts),
    setFaction: (sd, opts) => setFaction(sd, opts),
    setCare: o => debugSetCare(o),
    setLevel: (n, petId) => debugSetLevel(n, petId),
    fillKit: () => fillKit(),
    debugSnapshot: () => debugSnapshot(),
    debugCatalog: () => debugCatalog(),
    devChecks: () => devChecks(),
    setTextSpeed: v => debugSetTextSpeed(v),
    clearHold: () => debugHeal(),
    checkBuild: () => checkBuild(true),          // debug/tests: fetch version.json now (skips the 60 s throttle); resolves to its build id or null
    enc, walk,
  };
  // read-only map / scene / hint views (tests and the console); they can't change the game
  Object.defineProperty(api, 'mapInfo', { enumerable: true, get(){ return { id: CUR.id, w: MW, h: MH, room: isRoom(), outdoor: outdoorId(), backdrop: backdropName(), dream: CUR.dream || null,
    objs: CUR.objs.filter(present).map(o => ({ id: o.id, kind: o.kind, x: objPos(o).x, y: objPos(o).y, block: !!BLOCK_KINDS[o.kind], frozen: !!o.frozen })) }; } });
  Object.defineProperty(api, 'scene', { enumerable: true, get(){ return scene && { id: scene.id, who: scene.who, boxes: scene.boxes, mode: sbox.mode, text: sbox.text, full: sbox.full,
    typing: !!sbox.resolve && !sbox.full, waiting: !!sbox.resolve, pending: scene.pending.length, skip: scene.skip }; } });
  Object.defineProperty(api, 'spot', { enumerable: true, get(){ return { id: spot.id, bang: spot.bang }; } });   // §6.1 walk-up in progress
  Object.defineProperty(api, 'sightLines', { enumerable: true, get(){ return Object.fromEntries(CUR.objs.filter(o => o.kind === 'trainer' && present(o)).map(o => [o.id, sightLine(o)])); } });
  Object.defineProperty(api, 'mapObjs', { enumerable: true, get(){ return CUR.objs.filter(present).map(o => ({ kind: o.kind, id: o.id, x: objPos(o).x, y: objPos(o).y, sprite: o.sprite || null, shop: o.shop ? o.shop.slice() : null, art: !!(o.sprite && WART[o.sprite]) })); } });   // debug: what the current map shows
  Object.defineProperty(api, 'emotes', { enumerable: true, get(){ const fp = pet(), t = performance.now();
    return { bang: !!(spot.bang && spot.id), sleep: !!(fol.x != null && fp && followerOn() && isFainted(fp) && !scene),
      heart: !!(battle.on && battle.fx && battle.fx.some(e => e.kind === 'hearts' && now() - e.t0 < e.dur)), hearts: !!(emoteNow(t) && emoteNow(t).glyph === 'emote_hearts'), emote: emoteNow(t) ? emoteNow(t).glyph : null, petBang: !!anim.bangOn, fol: fol.x != null ? { fx: fol.fx, fy: fol.fy } : null }; } });   // debug: which Q6 emotes are showing
  Object.defineProperty(api, 'fading', { enumerable: true, get(){ return fade.busy; } });
  Object.defineProperty(api, 'optionsReady', { enumerable: true, get(){ return performance.now() >= optArmAt; } });   // option buttons accept taps (500 ms after they appear)
  Object.defineProperty(api, 'bumpHint', { enumerable: true, get(){ return $('#bumpHint').hidden ? null : $('#bumpHint').textContent; } });
  // WP-C: the current objective (read-only), the point the cue draws on this map, and the chain's dev check.
  Object.defineProperty(api, 'townBoard', { enumerable: true, get(){ return townBoardView(); } });
  Object.defineProperty(api, 'quest', { enumerable: true, get(){ const q = questCurrent(); return q && { id: q.id, text: q.text, place: q.place, target: q.target ? { ...q.target } : null,
    seen: S.questSeen === q.id, point: questPointOnMap(), done: PPQuests.completed(questState(), 3).map(e => e.id), pulse: $('#questBtn').classList.contains('pulse') }; } });
  Object.defineProperty(api, 'sideQuest', { enumerable: true, get(){ const q = PPQuests.sideCurrent(questState()); return q && { id: q.id, text: q.text, place: q.place, target: q.target ? { ...q.target } : null, point: sidePointOnMap() }; } });
  api.townFaction = id => factionOfMap(id || (CUR && CUR.id));
  api.mapHold = (id, flags) => mapHold(id, flags);
  api.mapCheck = () => mapDevCheck();
  api.phoneHack = () => phoneHack();
  Object.defineProperty(api, 'questCheck', { enumerable: true, get(){ return PPQuests.devCheck(MAPDATA); } });
  Object.defineProperty(api, 'lanternRest', { enumerable: true, get(){
    return { cost: LANTERN_REST_COST, due: !!(S && S.world && S.world.restDue === true), hurt: partyNeedsLanternRest() };
  } });
  // WP-B0: the pledged side, which scene id / trainer a base id resolves to right now, and the data file's dev check (read-only).
  Object.defineProperty(api, 'side', { enumerable: true, get(){ return side(); } });
  api.sceneFor = id => { const s = side(); return s !== SIDE_DEFAULT && SCENES[id + '@' + s] ? id + '@' + s : (SCENES[id] ? id : null); };
  api.trainerFor = id => { syncSide(); const t = TRAINERS[id]; return t ? copy({ name: t.name, seal: t.seal || null, onWin: t.onWin || null, lines: t.lines || {}, panel: t.panel || null }) : null; };
  Object.defineProperty(api, 'glimmerCheck', { enumerable: true, get(){ return glimmerDevCheck(); } });
  api.musicCheck = () => PPSound.musicCheck();
  api.mapTrack = id => trackFor(id && WORLD[id]);
  api.spriteLook = id => {
    const o = objById(id);
    const look = o ? npcLook(o) : (NPC_LOOKS[id] ? npcLook({ look: id, name: id }) : null);
    if (!look) return null;
    return { skin: look.skin || null, hair: look.hair || null, hairCol: look.hairCol || null, outfit: look.outfit || null, outfitCol: look.outfitCol || null, accent: look.accent || null, accessory: look.accessory || 'none' };
  };
  api.sealArt = id => (SEAL_ART[id] || []).slice();
  api.sealName = id => sealName(id);
  api.lookGrid = id => {
    const o = objById(id);
    const look = o ? npcLook(o) : (NPC_LOOKS[id] ? npcLook({ look: id, name: id }) : null);
    return look ? keeperGrid(look, 'down', 0) : null;
  };
  api.paintPreview = () => {
    const scale = 8;
    const grids = [SEAL_ART.seal_glim_1, SEAL_ART.seal_glim_2, api.lookGrid('imogen'), api.lookGrid('hollis'), api.lookGrid('juniper'), api.lookGrid('rook')];
    if (grids.some(g => !g)) return false;
    const sheet = document.getElementById('artSheet') || document.createElement('canvas');
    sheet.id = 'artSheet';
    sheet.width = grids.length * 18 * scale;
    sheet.height = 18 * scale;
    sheet.style.cssText = 'position:fixed;left:0;top:0;z-index:50;background:#1a1c2c';
    if (!sheet.parentNode) document.body.appendChild(sheet);
    const g = sheet.getContext('2d');
    g.imageSmoothingEnabled = false;
    grids.forEach((grid, i) => g.drawImage(keeperCanvas(grid), i * 18 * scale, 0, 18 * scale, 18 * scale));
    return true;
  };
  api.musicIds = () => PPSound.musicIds();
  api.battleTrack = (kind, trainerId) => battleTrack(kind, trainerId);
  api.wildTracks = () => WILD_TRACKS.slice();
  api.npcLine = id => id === 'amos' ? lanternGreet('Keeper Amos') : (objById(id) ? linesFor(objById(id)) : null);
  api.loyaltyLine = id => loyaltyBagLine(id);
  api.trainerLine = (id, key) => trainerLine(id, key);
  Object.defineProperty(api, 'heightsCheck', { enumerable: true, get(){ return heightsDevCheck(); } });
  Object.defineProperty(api, 'trialReady', { enumerable: true, get(){ return trialReady(); } });
  Object.defineProperty(api, 'heights', { enumerable: true, get(){ return { path: S && S.flags['story.heights_path'] || null, done: !!(S && S.flags['story.heights_done']), know: !!(S && S.flags['story.know_us']) }; } });
  // BS (read-only): both meters with tier index and name, the pledge, the switch count, and whether the desk would allow a switch now.
  Object.defineProperty(api, 'standing', { enumerable: true, get(){ return standingView(); } });
  api.standingCfg = () => copy(STANDING_CFG);
  api.standingCheck = () => PPStanding.devCheck();
  // WP-A: zone width and a rough per-press chance for a situation, without playing. opts: { stage, joy, treat, leadLv, engaged, bonus }
  api.befriendOdds = (foeLv, hpFrac, opts = {}) => { const o = Object.assign({ stage: 0, joy: 60, treat: false, leadLv: foeLv, engaged: hpFrac < 1, bonus: 0 }, opts);
    const width = Math.min(0.6, befriendWidth(hpFrac, o.stage, o.joy, o.treat, { foeLv, leadLv: o.leadLv, engaged: o.engaged }) + o.bonus);
    return { width: +width.toFixed(3), chance: +befriendHitChance(width).toFixed(3), speed: befriendSpeed(o.stage, foeLv), label: oddsLabel(width).t }; };
  api.befriendCheck = () => befriendDevCheck();
  api.weekKey = ms => weekKey(ms);
  api.charityCheck = () => highCharityDevCheck();
  api.exportSave = () => exportText();
  api.importSave = text => { if (!stageCopy(text)) return false; confirmCopy(); return true; };
  let warned = false;
  for (const [k, v] of Object.entries(cheats)) {
    if (typeof v === 'function') {
      api[k] = (...args) => {
        if (!DEBUG) {
          if (!warned) { warned = true; console.info('Walklings: debug hooks need ?debug=1 in the URL, or Settings → Debug with the password Larson.'); }
          return undefined;
        }
        return v(...args);
      };
    } else {
      Object.defineProperty(api, k, { enumerable: true, configurable: true, get(){ return DEBUG ? v : undefined; } });
    }
  }
  window.PixelPets = Object.freeze(api);
  window.holdItem = holdItem;
  window.unholdItem = unholdItem;
  window.setAccessory = setAccessory;
  window.fillWalklingExtras = fillWalklingExtras;
}
boot();
})();
