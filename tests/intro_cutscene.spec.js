/* INTRO_CUTSCENE (D799-D810): the Lodge `starter` scene staged as a cutscene, with the speakers' sprites at 4x in the box.
   One test per row T1-T12 of the packet's tests table. Rows run at 390 unless they name widths (T2 and T12 run at all three).

   game.js is one closure, so the staging internals (scene, sbox, cutRT, cutCurtainK, CUR, mapRT, walk, keeperFrames,
   cutsceneMiss) are not window globals. As the design preview harness does, the served copy of game.js gets one read hook
   (window.__ic.ev) just before boot(); the file on disk is unchanged. A frame recorder reads the internals on every
   animation frame, so a walk's in-between positions and the curtain's slide are seen, not guessed from polling. */
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

test.use({ serviceWorkers: 'block' });   // a service worker would serve game.js past the read hook on a second load
trackErrors(test, expect);

const BOOT_HOOK = 'try {\n  boot();\n';
const LINE = {
  hello: 'There you are. Come in.',
  named: 'Tester. The road will test that name.',
  storm: 'A storm catches you on the hill path.',
  learn: 'Learn each other.',
  door: 'The door bangs open.',
  thatOne: 'Then I\'ll take... that one!',
  scoop: 'Rook scoops up the',
  gate: 'Meet me at the east gate!',
  thatBoy: 'That boy. Now you each have someone',
  feed: 'Feed them. Let them rest.',
  sayHello: 'Say hello?',
};
// COUNTER: pick ember and Rook takes tide, tide -> bloom, bloom -> ember. The tile under that basket, and its prop id.
const ROOK_TILE = { ember: [5, 3], tide: [7, 3], bloom: [3, 3] };
const ROOK_BASKET = { ember: 'lodge_basket_t', tide: 'lodge_basket_b', bloom: 'lodge_basket_e' };
const BASKETS = ['lodge_basket_e', 'lodge_basket_t', 'lodge_basket_b'];
const LOOK_BASE = { skin: '3', hair: 'short', hairCol: 'p', outfit: 'coat', outfitCol: 't', accent: 'r' };

/* ---------- boot ---------- */
function lodgeSave(look) {
  const s = starterSave();
  s.party = [];
  s.partnerId = null;
  s.box = [];
  s.dex = { seen: {}, caught: {}, legacy: [], hits: {} };
  delete s.flags['story.starter_received'];
  delete s.flags['story.starter_line'];
  s.flags['story.intro_seen'] = true;
  s.flags['story.tutorial_done'] = true;
  s.settings = Object.assign({}, s.settings, { textSpeed: 'fast', follower: true });
  s.world = { map: 'hm_lodge_in', x: 5, y: 7, facing: 'up', respawn: 'hearthmoor' };
  s.player.name = 'Tester';
  if (look) s.player.look = Object.assign({}, look);
  return s;
}

async function exposeInternals(page) {
  await page.route('**/game.js*', async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    const at = body.indexOf(BOOT_HOOK);
    if (at >= 0 && body.indexOf(BOOT_HOOK, at + 1) < 0) body = body.slice(0, at) + 'window.__ic = { ev: s => eval(s) };\n' + body.slice(at);
    await route.fulfill({ status: 200, body, headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
  });
}

// `dataPatch` is JS run right after data/mapdata.js defines MAPDATA (a served copy only; data/ on disk is unchanged).
async function patchMapdata(page, dataPatch) {
  await page.route('**/data/mapdata.js*', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()) + '\n' + dataPatch + '\n';
    await route.fulfill({ status: 200, body, headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
  });
}

// Boot at the Lodge door mat. enterLodge() then steps up onto (5,7), the `lodge_hello` trigger, which runs `starter`.
async function bootLodge(page, { look = null, reduced = false, dataPatch = null } = {}) {
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  await exposeInternals(page);
  if (dataPatch) await patchMapdata(page, dataPatch);
  await installSave(page.context(), lodgeSave(look), { quietDay: true });
  await gotoGame(page, '?debug=1');
  expect(await page.evaluate(() => typeof window.__ic), 'read hook: boot() line in game.js moved').toBe('object');
  await page.evaluate(() => { PixelPets.showTab('walk'); PixelPets.goto('hm_lodge_in', 5, 8, 'up'); });
  await page.waitForFunction(() => !PixelPets.fading && !PixelPets.scene && PixelPets.mapInfo.id === 'hm_lodge_in');
}

async function enterLodge(page) {
  const r = await page.evaluate(() => PixelPets.walkStep('up'));
  expect(r).toMatchObject({ ok: true, map: 'hm_lodge_in', x: 5, y: 7, scene: true });
  expect(await page.evaluate(() => PixelPets.scene && PixelPets.scene.id)).toBe('starter');
}

// A second (or reduced-motion) run in its own context, with the same phone settings and its own error list.
async function freshPage(browser, testInfo, { reduced = false } = {}) {
  const u = testInfo.project.use;
  const context = await browser.newContext({
    viewport: u.viewport, deviceScaleFactor: u.deviceScaleFactor, isMobile: u.isMobile, hasTouch: u.hasTouch, baseURL: u.baseURL,
    serviceWorkers: 'block', reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  page.ppErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') page.ppErrors.push(msg.text()); });
  page.on('pageerror', (err) => page.ppErrors.push(err.message));
  return page;
}

async function closeFresh(page) {
  const errs = page.ppErrors.slice();
  await page.context().close();
  expect(errs, 'console errors / page errors (extra run):\n' + errs.join('\n')).toEqual([]);
}

const ev = (page, expr) => page.evaluate((s) => window.__ic.ev(s), expr);

/* ---------- frame recorder (one sample per animation frame, inside the game's closure) ---------- */
const REC = (bands) => `(() => {
  const R = window.__icRec = { frames: [], taps: [], skips: [], warns: [], on: true };
  window.addEventListener('pointerdown', () => R.taps.push(performance.now()), true);
  $('#sbSkip').addEventListener('click', () => R.skips.push(performance.now()), true);
  const warn = console.warn; console.warn = (...a) => { R.warns.push(a.join(' ')); return warn.apply(console, a); };
  const c = $('#mapCanvas'), K = PAL.k, kr = parseInt(K.slice(1, 3), 16), kg = parseInt(K.slice(3, 5), 16), kb = parseInt(K.slice(5, 7), 16);
  const rd = id => { const o = CUR.objs.find(q => q.id === id); if (!o) return null; const q = objPos(o);
    return { x: q.x, y: q.y, fx: q.fx != null ? q.fx : q.x, fy: q.fy != null ? q.fy : q.y, f: mapRT.face[id] || q.facing || o.facing || null }; };
  // Count non-PAL-k pixels in the first and last 24 rows of the room's drawn rect, in the columns over tiles 0-2 and 8-10
  // (no actor stands or walks there in this scene). Same rect as drawCurtain.
  const band = () => { const VW = c.width, VH = c.height, cx = walk.cam.x, cy = walk.cam.y;
    const x0 = Math.max(0, -cx), x1 = Math.min(VW, MW * TS - cx), y0 = Math.max(0, -cy), y1 = Math.min(VH, MH * TS - cy);
    const d = c.getContext('2d').getImageData(0, 0, VW, VH).data, cols = []; let top = 0, bot = 0, n = 0;
    for (let x = x0 + 2; x < x0 + 44; x += 3) cols.push(x);
    for (let x = x1 - 44; x < x1 - 2; x += 3) cols.push(x);
    const isK = i => d[i] === kr && d[i + 1] === kg && d[i + 2] === kb;
    for (const x of cols) for (let r = 0; r < 24; r++) { n++; if (!isK(((y0 + r) * VW + x) * 4)) top++; if (!isK(((y1 - 1 - r) * VW + x) * 4)) bot++; }
    return { top, bot, n }; };
  (function tick(){ if (!R.on) return;
    const frac = Object.entries(mapRT.pos).filter(([id, P]) => P && (P.fx % 1 || P.fy % 1)).map(([id]) => id);
    if (walk.fx % 1 || walk.fy % 1) frac.push('player');
    R.frames.push({ t: performance.now(), on: !!scene, busy: cutRT.busy, sbH: $('#sbox').hidden, ovH: $('#ovScene').hidden,
      mode: sbox.mode, text: sbox.text || '', k: cutCurtainK(), ilse: rd('ilse_lodge'), rook: rd('rook_lodge'), rival: rd('rival_pet'),
      partner: rd('partner'), me: { x: S.world.x, y: S.world.y, fx: walk.fx, fy: walk.fy, f: S.world.facing }, frac,
      em: sceneEmotes.map(e => e.who + ':' + e.glyph), band: ${bands ? 'band()' : 'null'} });
    requestAnimationFrame(tick); })();
})()`;
async function startRec(page, { bands = false } = {}) { await ev(page, REC(bands)); }
async function stopRec(page) {
  return page.evaluate(() => { const R = window.__icRec; R.on = false; return { frames: R.frames, taps: R.taps, skips: R.skips, warns: R.warns }; });
}

/* ---------- the scene driver (taps and buttons only, like a player) ---------- */
const STATE = `({ on: !!scene, id: scene && scene.id, busy: cutRT.busy, mode: sbox.mode, text: sbox.text || '', full: !!sbox.full,
  waiting: !!sbox.resolve, who: scene ? scene.who : '', basket: !$('#ovBasket').hidden, name: !$('#sbName').hidden,
  choices: $('#sbChoices').querySelectorAll('button').length })`;

async function tapScreen(page) {   // a tap on the scene layer away from the text box (walks hide the box but keep the layer)
  const vp = page.viewportSize();
  await page.touchscreen.tap(Math.round(vp.width / 2), Math.round(vp.height * 0.3));
}

// onBox(st) runs once per box when it is fully shown; onBusy(st) runs while a staged walk or wait holds the scene.
// skip(st) true: answer that say line with SKIP instead of a tap.
async function play(page, { line = 'ember', hello = null, skip = null, onBox = null, onBusy = null } = {}) {
  const stops = [];
  const seen = new Set();
  for (let i = 0; i < 600; i++) {
    const st = await ev(page, STATE);
    if (!st.on) return stops;
    if (st.busy) {
      if (onBusy) await onBusy(st); else await page.waitForTimeout(25);
      continue;
    }
    if (st.basket) {
      if (stops[stops.length - 1] !== 'basket') stops.push('basket');
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      if (await page.locator('#bkRow').isVisible()) {
        await page.locator('.basket[data-line="' + line + '"]').click();
        await page.waitForFunction(() => PixelPets.optionsReady === true);
      }
      await page.locator('#bkYes').click();
      await page.waitForFunction(() => document.getElementById('ovBasket').hidden === true, null, { timeout: 5000 });
      continue;
    }
    const key = (st.name ? 'name' : st.mode) + '|' + st.text;
    if (st.name) {
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      if (onBox && !seen.has(key)) { seen.add(key); await onBox(Object.assign({}, st, { mode: 'name' })); continue; }
      if (stops[stops.length - 1] !== 'name') stops.push('name');
      await page.locator('#sbOk').click();
      await page.waitForFunction(() => document.getElementById('sbName').hidden === true);
      continue;
    }
    if (st.mode === 'choice' && st.choices) {
      await page.waitForFunction(() => PixelPets.optionsReady === true && PixelPets.scene && PixelPets.scene.full);
      if (onBox && !seen.has(key)) { seen.add(key); await onBox(st); continue; }
      if (stops[stops.length - 1] !== 'choice:' + st.text) stops.push('choice:' + st.text);
      const label = hello && st.text.indexOf(LINE.sayHello) >= 0 ? hello : null;
      const btn = label ? page.locator('#sbChoices button', { hasText: label }).first() : page.locator('#sbChoices button').first();
      await btn.click();
      await page.waitForTimeout(40);
      continue;
    }
    if (st.mode === 'say' && st.waiting) {
      if (!st.full) { await page.locator('#sbText').tap(); await page.waitForTimeout(30); continue; }
      if (onBox && !seen.has(key)) { seen.add(key); await onBox(st); continue; }
      if (skip && skip(st)) await page.locator('#sbSkip').click();
      else await page.locator('#sbText').tap();
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('starter scene did not end; stops=' + stops.join(' | '));
}
const kinds = (stops) => stops.map((s) => (s.indexOf('choice:') === 0 ? 'choice' : s));

/* ---------- box reads ---------- */
// Which sprite the portrait canvas holds: its 18x18 pixels compared with keeperFrames(look).right[0] for each speaker.
const BOX = `(() => {
  const same = (a, b) => { const x = a.getContext('2d').getImageData(0, 0, 18, 18).data, y = b.getContext('2d').getImageData(0, 0, 18, 18).data;
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false; return true; };
  const npc = n => keeperFrames(npcLook({ look: LOOK_OF_NAME[n], name: n })).right[0];
  const pc = $('#sbPortrait'), r = e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
  const box = $('#sbox'), whoEl = $('#sbWho'), tx = $('#sbText');
  let is = 'none';
  if (!pc.hidden) is = same(pc, npc('Warden Ilse')) ? 'ilse' : same(pc, npc('Rook')) ? 'rook' : same(pc, keeperFrames(shownLook()).right[0]) ? 'holder' : 'other';
  const tr = r(tx), hit = document.elementFromPoint(tr.x + tr.w / 2, tr.y + Math.min(tr.h, 20) / 2);
  return { who: scene ? scene.who : null, label: whoEl.hidden ? null : whoEl.textContent, mode: sbox.mode, text: sbox.text,
    big: box.classList.contains('has-big'), p: box.classList.contains('has-p'), pHidden: pc.hidden, is,
    cw: pc.width, ch: pc.height, pad: getComputedStyle(box).paddingLeft, render: getComputedStyle(pc).imageRendering,
    box: r(box), port: r(pc), whoR: whoEl.hidden ? null : r(whoEl), textR: tr, textOnTop: !!(hit && box.contains(hit)) };
})()`;
const overlap = (a, b) => (!a || !b ? 0
  : Math.max(0, Math.min(a.r, b.r) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.y, b.y)));

// The portrait as drawn on screen: sample the middle of each 4x4 CSS block of an element screenshot against the frame.
async function portraitOnScreen(page, frameExpr) {
  const shot = await page.locator('#sbPortrait').screenshot();
  return page.evaluate(async ([b64, expr]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const shotD = g.getImageData(0, 0, c.width, c.height).data;
    const fd = window.__ic.ev(expr).getContext('2d').getImageData(0, 0, 18, 18).data, s = c.width / 18;
    let opaque = 0, ok = 0;
    for (let i = 0; i < 324; i++) {
      if (fd[i * 4 + 3] !== 255) continue;
      opaque++;
      const x = i % 18, y = (i / 18) | 0, j = (Math.floor((y + 0.5) * s) * c.width + Math.floor((x + 0.5) * s)) * 4;
      if (Math.abs(shotD[j] - fd[i * 4]) <= 2 && Math.abs(shotD[j + 1] - fd[i * 4 + 1]) <= 2 && Math.abs(shotD[j + 2] - fd[i * 4 + 2]) <= 2) ok++;
    }
    return { w: img.width, h: img.height, opaque, ok };
  }, [shot.toString('base64'), frameExpr]);
}

const at = (o) => (o ? [o.x, o.y] : null);
const onTile = (o, x, y) => !!o && o.x === x && o.y === y && o.fx === x && o.fy === y;
const firstIdx = (frames, fn, from = 0) => { for (let i = from; i < frames.length; i++) if (fn(frames[i])) return i; return -1; };

/* ---------- T1 ---------- */
test('T1 D799, D805: entering the Lodge runs starter; Ilse steps to (5,4), the holder walks to (5,5), and the box hides while they walk', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(90000);
  await bootLodge(page);
  await startRec(page);
  await enterLodge(page);
  await play(page);
  const { frames } = await stopRec(page);

  const iHello = firstIdx(frames, (f) => f.mode === 'say' && f.text.startsWith(LINE.hello) && !f.busy);
  expect(iHello, 'Ilse\'s first line never showed').toBeGreaterThan(0);
  // B1: Ilse glides one tile down from (5,3) before her line; the box is hidden and the scene layer is not.
  const b1 = frames.slice(0, iHello).filter((f) => f.on && f.busy);
  expect(b1.length).toBeGreaterThan(3);
  expect(b1.every((f) => f.sbH && !f.ovH)).toBe(true);
  expect(b1.some((f) => f.ilse && f.ilse.fy > 3 && f.ilse.fy < 4)).toBe(true);
  expect(frames.slice(0, iHello).every((f) => !f.ilse || (f.ilse.fx === 5 && f.ilse.fy >= 3 && f.ilse.fy <= 4))).toBe(true);
  const h = frames[iHello];
  expect(onTile(h.ilse, 5, 4)).toBe(true);
  expect(h.ilse.f).toBe('down');
  expect(onTile(h.me, 5, 7)).toBe(true);
  expect(h.sbH).toBe(false);

  // B3: after her line the holder walks (5,7) -> (5,5), the box hidden again; on the next line the holder faces up at (5,5).
  const iNamed = firstIdx(frames, (f) => f.mode === 'say' && f.text.startsWith(LINE.named) && !f.busy, iHello);
  expect(iNamed).toBeGreaterThan(iHello);
  const b3 = frames.slice(iHello, iNamed).filter((f) => f.busy);
  expect(b3.length).toBeGreaterThan(3);
  expect(b3.every((f) => f.sbH && !f.ovH)).toBe(true);
  expect(b3.some((f) => f.me.fy > 5 && f.me.fy < 7 && f.me.fy % 1 !== 0)).toBe(true);
  const n = frames[iNamed];
  expect(onTile(n.me, 5, 5)).toBe(true);
  expect(n.me.f).toBe('up');
  expect(onTile(n.ilse, 5, 4)).toBe(true);
  expect(n.sbH).toBe(false);
  // Away from the staged stretches the box shows on every frame of the scene.
  expect(frames.filter((f) => f.on && !f.busy).every((f) => !f.sbH && !f.ovH)).toBe(true);
});

/* ---------- T2 ---------- */
test('T2 D800, D804: Ilse\'s lines show her sprite at 4x beside a wide text column, at every width', async ({ page }) => {
  test.setTimeout(90000);
  await bootLodge(page);
  await enterLodge(page);
  const ilse = [];
  let first = null;
  let shot = null;
  await play(page, {
    onBox: async (st) => {
      if (st.who !== 'Warden Ilse') return;
      const b = await ev(page, BOX);
      ilse.push(b);
      if (!first && st.mode === 'say' && st.text.startsWith(LINE.hello)) {
        first = b;
        shot = await portraitOnScreen(page, 'keeperFrames(npcLook({ look: LOOK_OF_NAME["Warden Ilse"], name: "Warden Ilse" })).right[0]');
      }
    },
  });
  expect(first, 'Ilse\'s first line was not measured').not.toBeNull();
  // The 18x18 keeper frame (Ilse's own, facing right) at 72x72 CSS px, pixelated: exactly 4x.
  expect([first.cw, first.ch]).toEqual([18, 18]);
  expect(first.is).toBe('ilse');
  expect(first.pHidden).toBe(false);
  expect(first.port.w).toBeCloseTo(72, 0);
  expect(first.port.h).toBeCloseTo(72, 0);
  expect(first.render).toBe('pixelated');
  expect(shot.opaque).toBeGreaterThan(40);
  expect(shot.ok).toBe(shot.opaque);
  expect(first.big).toBe(true);
  expect(first.p).toBe(false);
  expect(first.pad).toBe('88px');
  expect(first.textR.w).toBeGreaterThanOrEqual(200);
  expect(first.textOnTop, 'the text box is covered on screen').toBe(true);
  // The speaker tab sits beside the portrait (to its right), never over it.
  expect(first.label).toBe('Warden Ilse');
  expect(overlap(first.whoR, first.port)).toBe(0);
  expect(first.whoR.x).toBeGreaterThanOrEqual(first.port.r);
  // Every Ilse box (lines and the two questions) keeps the portrait; her longest line stays within 200 px.
  expect(ilse.length).toBeGreaterThanOrEqual(10);
  for (const b of ilse) {
    expect(b.big && !b.pHidden && b.is === 'ilse', 'no Ilse portrait on: ' + b.text).toBe(true);
    expect(b.textR.w).toBeGreaterThanOrEqual(200);
    expect(b.box.h, 'box height on: ' + b.text).toBeLessThanOrEqual(200);
    expect(overlap(b.whoR, b.port)).toBe(0);
  }
  const longest = ilse.filter((b) => b.mode === 'say').sort((a, b) => b.text.length - a.text.length)[0];
  expect(longest.text.length).toBeGreaterThan(75);
  expect(longest.box.h).toBeLessThanOrEqual(200);
  expect(longest.textOnTop).toBe(true);
});

/* ---------- T3 ---------- */
test('T3 D800: Rook shows Rook, narration shows none, Ilse\'s storm question shows Ilse, and Hattie keeps the 36 px frame after', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(90000);
  await bootLodge(page);
  await enterLodge(page);
  const boxes = [];
  await play(page, { onBox: async () => { boxes.push(await ev(page, BOX)); } });

  const rook = boxes.filter((b) => b.who === 'Rook');
  expect(rook.length).toBe(2);
  for (const b of rook) {
    expect(b.big && !b.pHidden).toBe(true);
    expect(b.is).toBe('rook');
    expect(b.label).toBe('Rook');
    expect(overlap(b.whoR, b.port)).toBe(0);
  }
  const narr = boxes.filter((b) => b.mode === 'say' && !b.who);
  expect(narr.length).toBeGreaterThanOrEqual(3);
  expect(narr.map((b) => b.text)).toEqual(expect.arrayContaining([expect.stringContaining(LINE.door), expect.stringContaining(LINE.scoop)]));
  for (const b of narr) {
    expect(b.pHidden, 'portrait on narration: ' + b.text).toBe(true);
    expect(b.big || b.p).toBe(false);
    expect(b.label).toBeNull();
  }
  const storm = boxes.find((b) => b.mode === 'choice' && b.text.startsWith(LINE.storm));
  expect(storm).toBeTruthy();
  expect(storm.big && !storm.pHidden).toBe(true);
  expect(storm.is).toBe('ilse');
  expect(storm.label).toBe('Warden Ilse');

  // After the scene, an NPC line outside `starter` keeps the old 2x keeper frame (36 px, .has-p, facing down).
  await page.evaluate(() => PixelPets.goto('hearthmoor', 4, 12, 'down'));
  await page.waitForFunction(() => !PixelPets.fading && PixelPets.mapInfo.id === 'hearthmoor');
  expect(await page.evaluate(() => PixelPets.talkTo('hattie'))).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.text);
  const hattie = await ev(page, `(() => { const b = ${BOX};
    b.isHattie = (() => { const a = $('#sbPortrait').getContext('2d').getImageData(0, 0, 18, 18).data,
      f = keeperFrames(npcLook({ look: LOOK_OF_NAME.Hattie, name: 'Hattie' })).down[0].getContext('2d').getImageData(0, 0, 18, 18).data;
      for (let i = 0; i < a.length; i++) if (a[i] !== f[i]) return false; return true; })();
    return b; })()`);
  expect(hattie.label).toBe('Hattie');
  expect(hattie.p).toBe(true);
  expect(hattie.big).toBe(false);
  expect(hattie.pHidden).toBe(false);
  expect(hattie.port.w).toBeCloseTo(36, 0);
  expect(hattie.port.h).toBeCloseTo(36, 0);
  expect(hattie.pad).toBe('56px');
  expect(hattie.isHattie).toBe(true);
  for (let i = 0; i < 10 && await page.evaluate(() => !!PixelPets.scene); i++) {
    await page.locator('#sbText').tap();
    await page.waitForTimeout(60);
  }
  await page.waitForFunction(() => !PixelPets.scene);
});

/* ---------- T4 ---------- */
const HOLDER_FRAME = 'keeperFrames(shownLook()).right[0]';
// The holder portrait on a narrator prompt: holder's name in the tab, sprite at 4x, equal to the map's own frame.
async function holderBox(page) {
  const b = await ev(page, `(() => { const b = ${BOX};
    const px = c => c.getContext('2d').getImageData(0, 0, 18, 18).data, eq = (x, y) => { for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false; return true; };
    const mapLook = Object.assign({}, KEEPER_LOOKS.defaults, PixelPets.keeper.look);   // the look the map draws the holder with
    b.mapFrame = eq(px($('#sbPortrait')), px(keeperFrames(mapLook).right[0]));
    b.shown = Object.assign({}, KEEPER_LOOKS.defaults, shownLook());
    b.saved = Object.assign({}, S.player.look);
    return b; })()`);
  b.screen = await portraitOnScreen(page, HOLDER_FRAME);
  return b;
}
function expectHolder(b, what) {
  expect(b.label, what).toBe('Tester');
  expect(b.big && !b.pHidden, what).toBe(true);
  expect(b.is, what).toBe('holder');
  expect(b.mapFrame, what + ': portrait differs from the map sprite').toBe(true);
  expect(b.port.w).toBeCloseTo(72, 0);
  expect(b.port.h).toBeCloseTo(72, 0);
  expect(b.screen.opaque).toBeGreaterThan(40);
  expect(b.screen.ok, what + ': portrait on screen is not the frame at 4x').toBe(b.screen.opaque);
}
const sameFrame = (page, a, b) => ev(page, `(() => { const x = keeperFrames(Object.assign({}, KEEPER_LOOKS.defaults, ${JSON.stringify(a)})).right[0].getContext('2d').getImageData(0, 0, 18, 18).data,
  y = keeperFrames(Object.assign({}, KEEPER_LOOKS.defaults, ${JSON.stringify(b)})).right[0].getContext('2d').getImageData(0, 0, 18, 18).data;
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false; return true; })()`);
// A one-question scene with the `starter` id, so its portrait table applies (the next narrator prompt after a scene).
async function promptScene(page, steps) {
  await ev(page, `(runSteps(${JSON.stringify(steps)}, { id: 'starter' }), 0)`);
}

test('T4 D800: narrator prompts show the holder at 4x, following the look as the map shows it', async ({ page, browser }, testInfo) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(240000);
  const LOOKS = [
    { skin: '1', hair: 'short', hairCol: 'p', outfit: 'coat', outfitCol: 't', accent: 'r' },
    { skin: '5', hair: 'bun', hairCol: 'y', outfit: 'coat', outfitCol: 'g', accent: 'c' },
    { skin: '3', hair: 'buzz', hairCol: 'd', outfit: 'coat', outfitCol: 'b', accent: 'o' },
  ];
  // Three looks: the hello choice and the partner-name prompt show that look's frame at 4x.
  for (const look of LOOKS) {
    const p = await freshPage(browser, testInfo);
    await bootLodge(p, { look });
    await enterLodge(p);
    const seen = {};
    const stops = await play(p, {
      skip: () => true,
      onBox: async (st) => {
        if (st.mode === 'choice' && st.text.includes(LINE.sayHello)) seen.hello = await holderBox(p);
        if (st.mode === 'name') seen.name = await holderBox(p);
      },
    });
    expect(kinds(stops)).toEqual(['choice', 'choice', 'basket', 'choice', 'name']);
    for (const k of ['hello', 'name']) {
      expect(seen[k], k + ' prompt not seen for ' + JSON.stringify(look)).toBeTruthy();
      expectHolder(seen[k], k + ' ' + look.skin + look.hair);
      expect(await sameFrame(p, seen[k].shown, look), 'shownLook is not the save look').toBe(true);
    }
    expect(await sameFrame(p, LOOKS[0], look) === (look === LOOKS[0])).toBe(true);   // the three looks really differ
    await closeFresh(p);
  }

  // One holder through the rest: the lanyard mask, a look changed between scenes, a look picked in the scene, the Glimmerwell tint.
  const lanyard = Object.assign({}, LOOK_BASE, { accessory: 'lanyard' });
  await bootLodge(page, { look: lanyard });
  await enterLodge(page);
  let hello = null;
  await play(page, {
    skip: () => true,
    onBox: async (st) => {
      if (st.mode === 'choice' && st.text.includes(LINE.sayHello)) {
        hello = await holderBox(page);
        await page.evaluate(() => PixelPets.endScene());
      }
    },
  });
  expect(hello).toBeTruthy();
  expectHolder(hello, 'lanyard, not owned');
  expect(hello.saved.accessory).toBe('lanyard');
  expect(hello.shown.accessory).toBe('none');               // masked on the map, so masked in the portrait
  expect(await sameFrame(page, hello.shown, lanyard)).toBe(false);

  // Between scenes: Settings > Change look, a new hairstyle, DONE. The next narrator prompt shows it.
  await page.waitForFunction(() => !PixelPets.scene && window.__ic.ev('!gearBlocked()'));
  await page.locator('#settingsBtn').click();
  await page.locator('#setLook').click();
  await expect(page.locator('#ovLook')).toBeVisible();
  await page.locator('#lookHair button[data-opt="bun"]').click();
  await page.locator('#lookDone').click();
  await expect(page.locator('#ovLook')).toBeHidden();
  expect(await page.evaluate(() => PixelPets.state.player.look.hair)).toBe('bun');
  await promptScene(page, [['choice', 'Ready to go?', [['Yes', []]]]]);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.scene.full && PixelPets.optionsReady);
  const between = await holderBox(page);
  expectHolder(between, 'look changed between scenes');
  expect(between.shown.hair).toBe('bun');
  expect(await sameFrame(page, between.shown, hello.shown)).toBe(false);
  await page.locator('#sbChoices button').first().click();
  await page.waitForFunction(() => !PixelPets.scene);

  // In the same scene: the mirror (`lookPick`) then a prompt. The pick shows at once on the map and in the portrait;
  // the save gets it only when the scene ends.
  await promptScene(page, [['lookPick'], ['choice', 'Ready to go?', [['Yes', []]]]]);
  await expect(page.locator('#ovLook')).toBeVisible();
  await page.waitForFunction(() => PixelPets.optionsReady === true);
  await page.locator('#lookHair button[data-opt="pony"]').click();
  await page.locator('#lookDone').click();
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.scene.full && PixelPets.optionsReady);
  const picked = await holderBox(page);
  expectHolder(picked, 'look picked in this scene');
  expect(picked.shown.hair).toBe('pony');
  expect(await page.evaluate(() => PixelPets.keeper.look.hair)).toBe('pony');   // the map sprite already wears it
  expect(picked.saved.hair).toBe('bun');                                        // S.player.look not yet
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'))).player.look.hair).toBe('bun');
  await page.locator('#sbChoices button').first().click();
  await page.waitForFunction(() => !PixelPets.scene);
  expect(await page.evaluate(() => PixelPets.state.player.look.hair)).toBe('pony');

  // Glimmerwell standing tier 3 (lanyard owned, tint on): the portrait shows the tinted, lanyarded holder, as the map does.
  await page.evaluate(() => {
    PixelPets.setSide('glimmer');
    PixelPets.setFlag('story.side_pick_done', true);
    PixelPets.setStanding('glimmer', PixelPets.standingCfg().thresholds[3]);
    PixelPets.state.player.look.accessory = 'lanyard';
  });
  await promptScene(page, [['choice', 'Ready to go?', [['Yes', []]]]]);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.scene.full && PixelPets.optionsReady);
  const tint = await holderBox(page);
  expectHolder(tint, 'Glimmerwell tint');
  expect(tint.shown).toMatchObject({ accessory: 'lanyard', accent: 'c', outfitCol: 's', hairCol: 'h' });
  expect(await sameFrame(page, tint.shown, tint.saved)).toBe(false);           // the tint really changes the sprite
  await page.locator('#sbChoices button').first().click();
  await page.waitForFunction(() => !PixelPets.scene);
});

/* ---------- T5 ---------- */
test('T5 D806: Rook enters on the mat, walks under the counter pick\'s basket, empties it, and his Walkling hops out beside him', async ({ page, browser }, testInfo) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(180000);
  for (const line of ['ember', 'tide', 'bloom']) {
    const p = line === 'ember' ? page : await freshPage(browser, testInfo);
    await bootLodge(p);
    await startRec(p);
    await enterLodge(p);
    const got = {};
    await play(p, {
      line,
      skip: (st) => !st.text.includes(LINE.learn) && !got.learn,
      onBox: async (st) => {
        if (st.text.includes(LINE.learn)) got.learn = true;
        const read = () => ev(p, `({ rook: (() => { const o = CUR.objs.find(q => q.id === 'rook_lodge'); return o && Object.assign(objPos(o), { cast: !!o.cast }); })(),
          rival: (() => { const o = CUR.objs.find(q => q.id === 'rival_pet'); return o && objPos(o); })(),
          baskets: Object.fromEntries(CUR.objs.filter(o => /^lodge_basket_/.test(o.id)).map(o => [o.id, o.sprite])) })`);
        if (st.text.startsWith(LINE.door)) got.door = await read();
        if (st.text.includes(LINE.thatOne)) got.thatOne = await read();
        if (st.text.startsWith(LINE.scoop)) got.scoop = await read();
        if (st.text.includes(LINE.gate)) got.gate = await read();
      },
    });
    const { frames, warns } = await stopRec(p);
    // Placed on the mat by castAt before the narrator's line (castOnSay no longer picks a tile beside the mat).
    const iDoor = firstIdx(frames, (f) => f.text.startsWith(LINE.door));
    const iRook = firstIdx(frames, (f) => !!f.rook);
    expect(iRook, line).toBeGreaterThan(0);
    expect(iRook, line + ': Rook was not on the map before "The door bangs open"').toBeLessThan(iDoor);
    expect(onTile(frames[iRook].rook, 5, 8)).toBe(true);
    expect(frames[iRook].rook.f).toBe('up');
    expect(at(got.door.rook)).toEqual([5, 8]);
    expect(at(got.thatOne.rook)).toEqual([5, 8]);
    for (const id of BASKETS) expect(got.thatOne.baskets[id]).toBe('basket');
    // After "that one!" he stands under the counter pick's basket, and only that basket shows empty.
    const [rx, ry] = ROOK_TILE[line];
    expect(at(got.scoop.rook), line).toEqual([rx, ry]);
    expect(got.scoop.rook.fx === rx && got.scoop.rook.fy === ry).toBe(true);
    for (const id of BASKETS) expect(got.scoop.baskets[id], line + ' ' + id).toBe(id === ROOK_BASKET[line] ? 'basket_empty' : 'basket');
    // rival_pet hops out on a tile next to him.
    expect(got.gate.rival, line + ': no rival_pet').toBeTruthy();
    expect(Math.abs(got.gate.rival.x - rx) + Math.abs(got.gate.rival.y - ry)).toBe(1);
    expect(at(got.gate.rook)).toEqual([rx, ry]);
    expect(warns.filter((w) => /walkTo|anchor not found/.test(w))).toEqual([]);
    if (p !== page) await closeFresh(p);
  }
});

/* ---------- T6 ---------- */
test('T6 D807: Rook leaves through the door with his Walkling, gone before "That boy."; after the scene he waits at the east gate', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(90000);
  await bootLodge(page);
  await startRec(page);
  await enterLodge(page);
  let boy = null;
  await play(page, {
    onBox: async (st) => {
      if (st.text.startsWith(LINE.thatBoy)) {
        boy = await ev(page, `({ ids: CUR.objs.map(o => o.id), pos: Object.keys(mapRT.pos), cast: (scene.cast || []).map(c => c.o.id) })`);
      }
    },
  });
  const { frames } = await stopRec(page);
  const iGate = firstIdx(frames, (f) => f.text.includes(LINE.gate) && !f.busy);
  const iBoy = firstIdx(frames, (f) => f.text.startsWith(LINE.thatBoy));
  expect(iGate).toBeGreaterThan(0);
  expect(iBoy).toBeGreaterThan(iGate);
  const exit = frames.slice(iGate, iBoy);
  expect(exit.some((f) => f.busy && f.sbH)).toBe(true);
  const lastRook = exit.filter((f) => f.rook).pop();
  const lastRival = exit.filter((f) => f.rival).pop();
  // Their last step: Rook onto the mat, rival_pet onto the tile behind him; both leave on arrival (dropped in the same frame).
  expect(at(lastRook.rook)).toEqual([5, 8]);
  expect(lastRook.rook.fy).toBeGreaterThan(7);
  expect(at(lastRival.rival)).toEqual([5, 7]);
  expect(lastRival.rival.fy).toBeGreaterThan(6);
  const walking = exit.filter((f) => f.busy && f.rook && f.rival);
  expect(walking.length).toBeGreaterThan(10);
  expect(walking.every((f) => Math.abs(f.rook.fx - f.rival.fx) + Math.abs(f.rook.fy - f.rival.fy) <= 1.0001)).toBe(true);
  expect(frames[iBoy].rook).toBeNull();
  expect(frames[iBoy].rival).toBeNull();
  expect(boy.ids).not.toContain('rook_lodge');
  expect(boy.ids).not.toContain('rival_pet');
  expect(boy.pos).not.toContain('rook_lodge');
  expect(boy.pos).not.toContain('rival_pet');
  expect(boy.cast).toEqual(['partner']);

  // After the scene: the flag rows show three empty baskets, and the staged prop swap is undone.
  const lodge = await page.evaluate(() => PixelPets.mapObjs.filter((o) => /^lodge_(basket|empty)_/.test(o.id)).map((o) => [o.id, o.x, o.y, o.sprite]));
  expect(lodge.sort()).toEqual([
    ['lodge_empty_a', 3, 2, 'basket_empty'], ['lodge_empty_b', 5, 2, 'basket_empty'], ['lodge_empty_c', 7, 2, 'basket_empty'],
  ]);
  expect(await ev(page, `CUR.objs.filter(o => /^lodge_basket_/.test(o.id)).map(o => o.sprite)`)).toEqual(['basket', 'basket', 'basket']);
  expect(await page.evaluate(() => PixelPets.state.flags['story.starter_received'])).toBe(true);
  await page.evaluate(() => PixelPets.goto('hearthmoor', 15, 7, 'down'));
  await page.waitForFunction(() => !PixelPets.fading && PixelPets.mapInfo.id === 'hearthmoor');
  const gate = await page.evaluate(() => PixelPets.mapObjs.find((o) => o.id === 'rook_gate'));
  expect(gate).toMatchObject({ kind: 'npc', x: 22, y: 8 });
});

/* ---------- T7 ---------- */
test('T7 D808: one tap halves what is left of Rook\'s walk, a second tap lands him at once, and nothing is left between tiles', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(90000);
  await bootLodge(page);
  await startRec(page);
  await enterLodge(page);
  const done = { b8: false, b10: false };
  await play(page, {
    onBusy: async (st) => {
      const r = await ev(page, `(() => { const o = CUR.objs.find(q => q.id === 'rook_lodge'); return o ? objPos(o) : null; })()`);
      if (!done.b8 && st.text.includes(LINE.thatOne) && r && r.y <= 6) { done.b8 = true; await tapScreen(page); return; }
      if (!done.b10 && st.text.includes(LINE.gate) && r && (r.x !== ROOK_TILE.ember[0] || r.y !== ROOK_TILE.ember[1])) {
        done.b10 = true; await tapScreen(page); await tapScreen(page); return;
      }
      await page.waitForTimeout(10);
    },
  });
  const { frames, taps } = await stopRec(page);
  expect(done).toEqual({ b8: true, b10: true });
  // Rook's travelled distance (tiles) at time t, from the recorded positions.
  const walkOf = (txt) => {
    const i0 = firstIdx(frames, (f) => f.busy && f.text.includes(txt));
    const i1 = firstIdx(frames, (f) => !f.busy, i0);
    const seg = frames.slice(i0, i1);
    let d = 0;
    const dist = [0];
    for (let i = 1; i < seg.length; i++) {
      const a = seg[i - 1].rook, b = seg[i].rook;
      d += a && b ? Math.abs(b.fx - a.fx) + Math.abs(b.fy - a.fy) : 0;
      dist.push(d);
    }
    const distAt = (t) => { let k = 0; while (k + 1 < seg.length && seg[k + 1].t <= t) k++; return dist[k]; };
    return { i0, i1, t0: seg[0].t, t1: frames[i1].t, seg, distAt, end: frames[i1] };
  };
  // B8, 7 tiles: one tap after two tiles. The time left is about half what the pace so far predicts.
  const b8 = walkOf(LINE.thatOne);
  const tap1 = taps.find((t) => t > b8.t0 && t < b8.t1);
  expect(tap1, 'the B8 tap did not land during the walk').toBeTruthy();
  expect(taps.filter((t) => t > b8.t0 && t < b8.t1).length).toBe(1);
  const p8 = b8.distAt(tap1);
  expect(p8).toBeGreaterThan(0.5);
  expect(p8).toBeLessThanOrEqual(4);
  const perTile = (tap1 - b8.t0) / p8;
  const predicted = perTile * (7 - p8), left = b8.t1 - tap1;
  expect(left / predicted, `B8: ${Math.round(left)} ms left after one tap vs ${Math.round(predicted)} ms at full pace`).toBeGreaterThan(0.3);
  expect(left / predicted).toBeLessThan(0.8);
  expect(onTile(b8.end.rook, 5, 3)).toBe(true);
  expect(b8.end.frac, 'a cast left between tiles after B8').toEqual([]);
  // B10, 7 tiles: two taps right after he sets off. He lands on the mat almost at once and leaves.
  const b10 = walkOf(LINE.gate);
  const both = taps.filter((t) => t > b10.t0 && t < b10.t1);
  expect(both.length).toBe(2);
  const p10 = b10.distAt(both[1]);
  expect(7 - p10).toBeGreaterThanOrEqual(3);
  const atOnce = b10.t1 - both[1], doublePace = (7 - p10) * (perTile / 2);
  expect(atOnce, `B10: ${Math.round(atOnce)} ms after the second tap (double pace would be ${Math.round(doublePace)} ms)`).toBeLessThan(200);
  expect(atOnce).toBeLessThan(doublePace * 0.6);
  expect(b10.end.rook).toBeNull();
  expect(b10.end.rival).toBeNull();
  expect(b10.end.frac, 'a cast left between tiles after B10').toEqual([]);
  // Every staged walk of the run (Ilse, the holder, both of Rook's) ends with everyone on whole tiles,
  // and the staging is reset when the scene ends.
  const ends = frames.map((f, i) => (i > 0 && frames[i - 1].busy && !f.busy ? f : null)).filter(Boolean);
  expect(ends.length).toBeGreaterThanOrEqual(4);
  expect(ends.map((f) => f.frac)).toEqual(ends.map(() => []));
  const after = await ev(page, `({ k: cutCurtainK(), busy: cutRT.busy, speed: cutRT.speed, end: cutRT.end, box: $('#sbox').hidden, scene: !!scene })`);
  expect(after).toEqual({ k: 0, busy: false, speed: 1, end: false, box: false, scene: false });
});

/* ---------- T8 ---------- */
test('T8 D808: SKIP on Ilse\'s first line reaches the first question in under 300 ms, and still stops at every question', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(90000);
  await bootLodge(page);
  await startRec(page);
  await enterLodge(page);
  const stops = await play(page, { skip: () => true });
  const { frames, skips } = await stopRec(page);
  expect(kinds(stops)).toEqual(['choice', 'choice', 'basket', 'choice', 'name']);
  const iHello = firstIdx(frames, (f) => f.text.startsWith(LINE.hello));
  const s0 = skips[0];
  expect(frames[iHello].t).toBeLessThan(s0);
  const iQ = firstIdx(frames, (f) => f.mode === 'choice' && f.text.startsWith(LINE.storm));
  expect(iQ).toBeGreaterThan(iHello);
  expect(frames[iQ].t - s0, 'SKIP to the first question').toBeLessThan(300);
  expect(onTile(frames[iQ].ilse, 5, 4)).toBe(true);
  expect(onTile(frames[iQ].me, 5, 5)).toBe(true);
  expect(frames[iQ].me.f).toBe('up');
  expect(frames[iQ].k).toBe(0);                                   // the curtain cut, not slid
  // After SKIP every later walk and wait snaps: the box never hides again, and Rook still comes and goes.
  const later = frames.filter((f) => f.t > s0);
  expect(later.some((f) => f.busy || f.sbH && f.on)).toBe(false);
  expect(later.filter((f) => f.on).every((f) => f.k === 0 || f.k === 1)).toBe(true);
  const final = await page.evaluate(() => ({ objs: PixelPets.mapObjs.map((o) => o.id), got: PixelPets.state.flags['story.starter_received'] }));
  expect(final.objs).not.toContain('rook_lodge');
  expect(final.got).toBe(true);
});

/* ---------- T9 ---------- */
test('T9 D809: reduced motion snaps every walk and cuts the curtain; portraits and emotes still show', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(90000);
  await bootLodge(page, { reduced: true });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await startRec(page);
  await enterLodge(page);
  const big = [];
  const got = {};
  await play(page, {
    onBox: async (st) => {
      if (st.who === 'Warden Ilse' || st.who === 'Rook') big.push(await ev(page, BOX));
      if (st.text.startsWith(LINE.hello)) got.hello = await ev(page, `({ ilse: objPos(CUR.objs.find(o => o.id === 'ilse_lodge')), me: [S.world.x, S.world.y] })`);
      if (st.text.startsWith(LINE.scoop)) got.scoop = await ev(page, `objPos(CUR.objs.find(o => o.id === 'rook_lodge'))`);
    },
  });
  const { frames } = await stopRec(page);
  const sceneFrames = frames.filter((f) => f.on);
  expect(sceneFrames.length).toBeGreaterThan(30);
  const fr = sceneFrames.filter((f) => f.frac.length);
  expect(fr.map((f) => f.frac.join(',')), 'positions between tiles under reduced motion').toEqual([]);
  expect(sceneFrames.filter((f) => f.k !== 0 && f.k !== 1).map((f) => f.k)).toEqual([]);
  expect(sceneFrames.some((f) => f.k === 1)).toBe(true);
  expect(sceneFrames.some((f) => f.busy)).toBe(false);             // walks land in one frame; the box never hides
  // The staging still happens, only without motion.
  expect(at(got.hello.ilse)).toEqual([5, 4]);
  expect(at(got.scoop)).toEqual(ROOK_TILE.ember);
  expect(onTile(sceneFrames[sceneFrames.length - 1].me, 5, 5)).toBe(true);
  // Portraits and emotes are not motion: they show.
  expect(big.length).toBeGreaterThanOrEqual(10);
  expect(big.every((b) => b.big && !b.pHidden && (b.is === 'ilse' || b.is === 'rook'))).toBe(true);
  expect(big.some((b) => b.is === 'rook')).toBe(true);
  const em = new Set(sceneFrames.flatMap((f) => f.em));
  for (const e of ['ilse_lodge_any:emote_wave', 'rook_lodge:emote_bang', 'rival_pet:emote_laugh', 'ilse_lodge_any:emote_clap']) expect(em.has(e), e).toBe(true);
});

/* ---------- T10 ---------- */
test('T10 D803: the curtain bars are PAL k on the room\'s top and bottom 24 rows during B1 and B8, room colours after B3 and B11', async ({ page, browser }, testInfo) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(150000);
  await bootLodge(page);
  await startRec(page, { bands: true });
  await enterLodge(page);
  await play(page);
  const { frames } = await stopRec(page);
  // A frame's pixels are the last drawn frame, so only frames whose curtain value matches the one before are compared.
  const steady = (from, to, k) => { const out = [];
    for (let i = Math.max(1, from); i < to; i++) if (frames[i].on && frames[i].k === k && frames[i - 1].k === k) out.push(frames[i]);
    return out; };
  const iHello = firstIdx(frames, (f) => f.text.startsWith(LINE.hello));
  const iNamed = firstIdx(frames, (f) => f.text.startsWith(LINE.named));
  const iThatOne = firstIdx(frames, (f) => f.busy && f.text.includes(LINE.thatOne));
  const iScoop = firstIdx(frames, (f) => f.text.startsWith(LINE.scoop));
  const iDoor = firstIdx(frames, (f) => f.text.startsWith(LINE.door));
  const iFeed = firstIdx(frames, (f) => f.text.startsWith(LINE.feed));
  const iEnd = firstIdx(frames, (f) => !f.on, iFeed);
  expect(Math.min(iHello, iNamed, iThatOne, iScoop, iDoor, iFeed, iEnd)).toBeGreaterThan(0);
  const dark = (f) => f.band.top === 0 && f.band.bot === 0;
  const room = (f) => f.band.top === f.band.n && f.band.bot === f.band.n;
  const b1 = steady(0, iHello, 1).filter((f) => f.busy);
  const b8 = steady(iThatOne, iScoop, 1).filter((f) => f.busy);
  expect(b1.length, 'no full-curtain frame during B1').toBeGreaterThan(2);
  expect(b8.length, 'no full-curtain frame during B8').toBeGreaterThan(2);
  expect(b1.filter((f) => !dark(f)).map((f) => f.band)).toEqual([]);
  expect(b8.filter((f) => !dark(f)).map((f) => f.band)).toEqual([]);
  // Between the bars' slide-out after B3 and Rook's door beat, and after B11 to the scene's end: room colours, no PAL k.
  const afterB3 = steady(iNamed, iDoor, 0);
  const afterB11 = steady(iFeed, iEnd, 0);
  expect(afterB3.length).toBeGreaterThan(5);
  expect(afterB11.length).toBeGreaterThan(5);
  expect(afterB3.filter((f) => !room(f)).map((f) => f.band)).toEqual([]);
  expect(afterB11.filter((f) => !room(f)).map((f) => f.band)).toEqual([]);
  // The bars slide (250 ms): the run shows values between 0 and 1 on the way in and out.
  expect(frames.some((f) => f.k > 0 && f.k < 1)).toBe(true);

  // Reduced motion: cutCurtainK() is only ever 0 or 1, and the pixels agree.
  const r = await freshPage(browser, testInfo, { reduced: true });
  await bootLodge(r, { reduced: true });
  await startRec(r, { bands: true });
  await enterLodge(r);
  await play(r);
  const rf = (await stopRec(r)).frames.filter((f) => f.on);
  expect(rf.filter((f) => f.k !== 0 && f.k !== 1).map((f) => f.k)).toEqual([]);
  expect(rf.some((f) => f.k === 1) && rf.some((f) => f.k === 0)).toBe(true);
  const rSteady = rf.filter((f, i) => i > 0 && rf[i - 1].k === f.k);
  expect(rSteady.filter((f) => (f.k === 1 ? !dark(f) : !room(f))).map((f) => [f.k, f.band])).toEqual([]);
  await closeFresh(r);
});

/* ---------- T11 ---------- */
test('T11 D810: the cutscene data splices with no misses, and a scene missing an anchor line still plays to its end', async ({ page, browser }, testInfo) => {
  test.skip(page.viewportSize().width !== 390, 'runs at 390');
  test.setTimeout(120000);
  await bootLodge(page);
  const info = await ev(page, `({ cut: cutsceneMiss.slice(), sm: starterMomentMiss.slice(), quests: PPQuests.devCheck(MAPDATA), qc: PixelPets.questCheck,
    keys: Object.keys(MAPDATA).filter(k => k.startsWith('cutscene_')), staged: (() => { const n = {}; const walk = s => { for (const st of s || []) {
      if (!Array.isArray(st)) continue; if (['walkTo', 'wait', 'curtain', 'castAt', 'prop'].includes(st[0])) n[st[0]] = (n[st[0]] || 0) + 1;
      if (st[0] === 'if') { walk(st[2]); walk(st[3]); } if (st[0] === 'choice') for (const o of st[2] || []) walk(o[1]); } }; walk(SCENES.starter); return n; })() })`);
  expect(info.keys).toEqual(['cutscene_intro']);
  expect(info.cut).toEqual([]);
  expect(info.sm).toEqual([]);
  expect(await page.evaluate(() => PixelPets.starterMoment().misses)).toEqual([]);
  expect(info.quests).toEqual([]);
  expect(info.qc).toEqual([]);
  expect(info.staged).toEqual({ curtain: 4, walkTo: 4, wait: 2, castAt: 1, prop: 1 });   // all six inserts landed

  // A served copy of the data with Ilse's "That boy." line taken out of the scene: that insert (curtain off) misses,
  // the rest still land, and the scene plays to its end with the curtain reset there.
  const p = await freshPage(browser, testInfo);
  await bootLodge(p, {
    dataPatch: `(() => { const drop = s => { for (let i = s.length - 1; i >= 0; i--) { const st = s[i]; if (!Array.isArray(st)) continue;
      if (st[0] === 'say' && String(st[2]).indexOf(${JSON.stringify(LINE.thatBoy)}) === 0) s.splice(i, 1);
      else if (st[0] === 'if') { drop(st[2] || []); drop(st[3] || []); } } }; drop(MAPDATA.maps_slice.scenes.starter); })();`,
  });
  const miss = await ev(p, `({ cut: cutsceneMiss.slice(), sm: starterMomentMiss.slice() })`);
  expect(miss.cut.length).toBe(1);
  expect(miss.cut[0]).toContain(LINE.thatBoy);
  expect(miss.sm).toEqual([]);
  await startRec(p);
  await enterLodge(p);
  const stops = await play(p);
  const { frames, warns } = await stopRec(p);
  expect(kinds(stops)).toEqual(['choice', 'choice', 'basket', 'choice', 'name']);
  expect(frames.some((f) => f.text.startsWith(LINE.thatBoy))).toBe(false);
  expect(frames.some((f) => f.text.startsWith(LINE.feed))).toBe(true);
  expect(warns.filter((w) => /walkTo/.test(w))).toEqual([]);
  const end = await ev(p, `({ scene: !!scene, k: cutCurtainK(), busy: cutRT.busy, box: $('#sbox').hidden, got: S.flags['story.starter_received'],
    ids: CUR.objs.map(o => o.id) })`);
  expect(end).toMatchObject({ scene: false, k: 0, busy: false, box: false, got: true });
  expect(end.ids).not.toContain('rook_lodge');
  expect(end.ids).not.toContain('rival_pet');
  await closeFresh(p);
});

/* ---------- T12 ---------- */
test('T12 all: the save stays v2 with the same keys and flags as the unstaged scene; game.js parses; no console errors', async ({ page, browser }, testInfo) => {
  test.setTimeout(150000);
  execFileSync(process.execPath, ['--check', path.join(__dirname, '..', 'game.js')], { stdio: 'pipe' });
  const run = async (p, dataPatch) => {
    await bootLodge(p, { dataPatch });
    const before = await p.evaluate(() => ({ keys: Object.keys(localStorage).filter((k) => k.startsWith('pixelpets.save')), save: JSON.parse(localStorage.getItem('pixelpets.save.v2')) }));
    await startRec(p);
    await enterLodge(p);
    const stops = await play(p);
    const { warns } = await stopRec(p);
    await p.waitForFunction(() => !PixelPets.scene);
    const after = await p.evaluate(() => ({ keys: Object.keys(localStorage).filter((k) => k.startsWith('pixelpets.save')), save: JSON.parse(localStorage.getItem('pixelpets.save.v2')) }));
    return { before, after, stops, warns };
  };
  const staged = await run(page, null);
  // The same scene with no data/cutscene_*.json in the served data: the scene as STARTER_MOMENT left it.
  const p = await freshPage(browser, testInfo);
  const plain = await run(p, 'delete MAPDATA.cutscene_intro;');
  expect(await ev(p, `SCENES.starter.some(s => s[0] === 'curtain')`)).toBe(false);
  await closeFresh(p);

  for (const r of [staged, plain]) {
    expect(r.before.keys).toEqual(['pixelpets.save.v2']);
    expect(r.after.keys).toEqual(['pixelpets.save.v2']);
    expect(r.after.save.v).toBe(2);
    expect(Object.keys(r.after.save).sort()).toEqual(Object.keys(r.before.save).sort());
    expect(r.after.save.flags['story.starter_received']).toBe(true);
  }
  expect(kinds(staged.stops)).toEqual(kinds(plain.stops));
  expect(Object.keys(staged.after.save).sort()).toEqual(Object.keys(plain.after.save).sort());
  // No new flag: the staged scene leaves exactly the flags the unstaged one does, with the same story values.
  expect(Object.keys(staged.after.save.flags).sort()).toEqual(Object.keys(plain.after.save.flags).sort());
  for (const k of Object.keys(plain.after.save.flags).filter((f) => f.startsWith('story.'))) {
    expect(staged.after.save.flags[k], k).toEqual(plain.after.save.flags[k]);
  }
  expect(staged.warns.filter((w) => /walkTo|anchor not found/.test(w))).toEqual([]);
});
