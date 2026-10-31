/* Look creator labels stay fully visible, and a hat clips hair above its brim (D414 F3).
   The hat rule is render-only. Save stays pixelpets.save.v2 with v 2.
   Phone widths come from the Playwright projects. The 390 project also opens a 1280x800 window with no touch. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const ROOT = path.join(__dirname, '..');
const LABELS = ['SKIN', 'HAIR STYLE', 'HAIR COLOUR', 'OUTFIT', 'OUTFIT COLOUR', 'ACCENT', 'ACCESSORY'];
const HAIR = ['short', 'long', 'spiky', 'bun', 'bob', 'pony', 'curls', 'buzz'];
const OUTFITS = ['coat', 'hoodie', 'tunic', 'vest', 'sweater', 'dress'];
const FACINGS = ['down', 'right', 'up', 'left'];
const HATS = ['cap', 'beanie'];
const NO_HAT = ['none', 'glasses', 'bow', 'scarf', 'sash', 'satchel', 'goggles', 'lanyard'];
// Synthetic cap wearer for the brim rule. The live Associate Hollis look is HOLLIS_LIVE (scarf, no cap).
const HOLLIS = { skin: '1', hair: 'curls', hairCol: 'c', outfit: 'vest', outfitCol: 'l', accent: 'w', accessory: 'cap' };
const HOLLIS_LIVE = { skin: '1', hair: 'curls', hairCol: 'c', outfit: 'vest', outfitCol: 'V', accent: 'N', accessory: 'scarf' };
const RING = 5; // .swatch.on / .preview.on outer box-shadow
const BASELINE = path.join(__dirname, 'fixtures', 'keeper_130f118.js');
const V5 = {
  down: ['.......tt.......', '.....rrrrrr.....', '....rrrrrrrr....', '...tttttttttt...'],
  right: ['....tt..........', '....rrrrrr......', '...rrrrrrttt....', '...tttttt.......'],
  up: ['.......tt.......', '.....rrrrrr.....', '....rrrrrrrr....', '...tttttttttt...'],
};

function baseURL() {
  return process.env.PP_URL || ('http://127.0.0.1:' + (process.env.PP_PORT || '8080'));
}

function loadKeeper(src) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(src + '\nthis.api={keeperGrid,KEEPER_ACCESSORIES,KEEPER_HAIR,KEEPER_ART,KEEPER_OUTFITS,KEEPER_LOOKS};', context, { filename: 'keeper.js' });
  return context.api;
}

function paintCell(layers, sw, y, x) {
  let c = '.';
  for (const g of layers) if (g[y][x] !== '.') c = g[y][x];
  return c === '.' ? '.' : (sw[c] || c);
}

// The rule off: every layer, including hair. The rule on: hair is left out above the brim.
function composed(K, look, facing, frame, clip) {
  const L = Object.assign({}, K.KEEPER_LOOKS.defaults, look || {});
  const B = K.KEEPER_LOOKS.base;
  const f = facing === 'left' ? 'right' : facing;
  const hair = K.KEEPER_HAIR[L.hair][f][frame];
  const body = K.KEEPER_ART[f][frame];
  const outfit = K.KEEPER_OUTFITS[L.outfit][f][frame];
  const acc = L.accessory && L.accessory !== 'none' ? K.KEEPER_ACCESSORIES[L.accessory] : null;
  const hat = acc ? acc[f][frame] : null;
  const sw = Object.assign({}, L.extra || {}, { [B.skin]: L.skin, [B.hairCol]: L.hairCol, [B.outfitCol]: L.outfitCol, [B.accent]: L.accent });
  const line = acc && acc.hatLine && acc.hatLine[f];
  const brim = clip && line ? line[frame] : null;
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    const useHair = brim == null || y >= brim;
    const layers = useHair ? [body, outfit, hair] : [body, outfit];
    if (hat) layers.push(hat);
    for (let x = 0; x < 16; x++) r += paintCell(layers, sw, y, x);
    rows.push(facing === 'left' ? r.split('').reverse().join('') : r);
  }
  return { rows, brim, body, hat, f };
}

test('a hat clips hair above the brim and every other look matches the build before the rule @w1', () => {
  const now = loadKeeper(fs.readFileSync(path.join(ROOT, 'keeper.js'), 'utf8'));
  // Pinned to main 130f118. After this branch merges, HEAD is the new art, so git show HEAD would fail the check below.
  const old = loadKeeper(fs.readFileSync(BASELINE, 'utf8'));
  const fails = [];
  const bad = (msg) => { if (fails.length < 12) fails.push(msg); else fails.push(''); };

  expect(now.KEEPER_ACCESSORIES.cap.hatLine).toEqual({ down: [4, 4], right: [4, 4], up: [4, 4] });
  expect(now.KEEPER_ACCESSORIES.beanie.hatLine).toEqual({ down: [3, 3], right: [3, 3], up: [3, 3] });
  for (const id of NO_HAT) {
    if (id === 'none') continue;
    expect(now.KEEPER_ACCESSORIES[id].hatLine, id).toBeUndefined();
  }
  expect(Object.keys(now.KEEPER_ACCESSORIES).filter(id => now.KEEPER_ACCESSORIES[id].hatLine).sort()).toEqual(['beanie', 'cap']);

  for (const facing of ['down', 'right', 'up']) {
    for (const fr of [0, 1]) {
      const rows = now.KEEPER_ACCESSORIES.beanie[facing][fr];
      expect(rows.slice(0, 4), facing + fr).toEqual(V5[facing]);
      expect(rows.slice(4).every(r => r === '................'), facing + ' empty ' + fr).toBe(true);
    }
  }
  expect(old.KEEPER_ACCESSORIES.beanie.down[0][0]).not.toBe(V5.down[0]);
  expect(old.KEEPER_ACCESSORIES.beanie.hatLine).toBeUndefined();

  const colours = { skin: '6', hairCol: 'y', outfitCol: 't', accent: 'r' };
  let hats = 0;
  let plain = 0;
  for (const accessory of HATS) {
    for (const hair of HAIR) {
      for (const outfit of OUTFITS) {
        for (const facing of FACINGS) {
          for (const frame of [0, 1]) {
            hats++;
            const look = Object.assign({ hair, outfit, accessory }, colours);
            const got = now.keeperGrid(look, facing, frame);
            const on = composed(now, look, facing, frame, true);
            const off = composed(now, look, facing, frame, false);
            if (JSON.stringify(got) !== JSON.stringify(on.rows)) bad(accessory + ' ' + hair + ' ' + outfit + ' ' + facing + frame + ' != clip composite');
            const brim = on.brim;
            if (brim == null) bad(accessory + ' missing brim');
            for (let y = 0; y < 16; y++) {
              if (y >= brim && got[y] !== off.rows[y]) bad(accessory + ' ' + hair + ' ' + facing + frame + ' row ' + y + ' changed below the brim');
              if (y < brim && got[y].includes('y')) bad(accessory + ' ' + hair + ' ' + facing + frame + ' hair above the brim: ' + got[y]);
            }
            if (on.hat) {
              for (let y = 0; y < brim; y++) {
                for (let x = 0; x < 16; x++) {
                  if (on.body[y][x] !== '.' && on.hat[y][x] === '.') bad(accessory + ' ' + facing + frame + ' skin outside the hat at ' + x + ',' + y);
                }
              }
            }
            if (accessory === 'cap') {
              const was = old.keeperGrid(look, facing, frame);
              for (let y = brim; y < 16; y++) if (got[y] !== was[y]) bad('cap ' + hair + ' ' + facing + frame + ' row ' + y + ' != build before the rule');
            }
          }
        }
      }
    }
  }
  for (const accessory of NO_HAT) {
    for (const hair of HAIR) {
      for (const outfit of OUTFITS) {
        for (const facing of FACINGS) {
          for (const frame of [0, 1]) {
            plain++;
            const look = Object.assign({ hair, outfit, accessory }, colours);
            const got = now.keeperGrid(look, facing, frame);
            const was = old.keeperGrid(look, facing, frame);
            // GLIMMERWELL_PALETTE v0.3.1 recolours the lanyard card (honey y to crimson Q, at most 2 Q a frame).
            // Every other non-hat accessory still matches the pinned 130f118 grids.
            if (accessory !== 'lanyard' && JSON.stringify(got) !== JSON.stringify(was)) bad(accessory + ' ' + hair + ' ' + outfit + ' ' + facing + frame + ' changed without a hat');
            if (JSON.stringify(got) !== JSON.stringify(composed(now, look, facing, frame, true).rows)) bad(accessory + ' composite');
          }
        }
      }
    }
  }
  const hollis = now.keeperGrid(HOLLIS, 'down', 0);
  if (JSON.stringify(hollis) !== JSON.stringify(composed(now, HOLLIS, 'down', 0, true).rows)) bad('hollis clip');
  if (hollis.slice(0, 4).some(r => r.includes('c'))) bad('hollis hair above the cap');
  if (!hollis.slice(4).some(r => r.includes('c'))) bad('hollis lost the curls under the cap');
  const extra = { skin: '2', hair: 'bun', hairCol: 'h', outfit: 'coat', outfitCol: 'p', accent: 'y', accessory: 'none', extra: { o: 'g' } };
  if (JSON.stringify(now.keeperGrid(extra, 'left', 1)) !== JSON.stringify(old.keeperGrid(extra, 'left', 1))) bad('extra swap changed');
  const capped = Object.assign({}, extra, { accessory: 'cap' });
  if (JSON.stringify(now.keeperGrid(capped, 'up', 0)) !== JSON.stringify(composed(now, capped, 'up', 0, true).rows)) bad('cap with an extra swap');
  if (JSON.stringify(now.keeperGrid(null, 'down', 0)) !== JSON.stringify(old.keeperGrid(null, 'down', 0))) bad('default look changed');

  const lan = { hair: 'short', outfit: 'coat', accessory: 'lanyard', skin: '6', hairCol: 'y', outfitCol: 't', accent: 'r' };
  for (const facing of FACINGS) {
    for (const frame of [0, 1]) {
      const rows = now.keeperGrid(lan, facing, frame);
      const q = rows.join('').split('Q').length - 1;
      if (q > 2) bad('lanyard ' + facing + frame + ' has ' + q + ' Q');
      if (old.keeperGrid(lan, facing, frame).join('').includes('Q')) bad('old lanyard already had Q');
    }
  }
  if (!now.keeperGrid(lan, 'down', 0).join('').includes('Q')) bad('lanyard down card lost its Q');

  const reported = fails.filter(Boolean);
  expect(reported, reported.join('\n')).toEqual([]);
  expect(hats).toBe(HATS.length * HAIR.length * OUTFITS.length * FACINGS.length * 2);
  expect(plain).toBe(NO_HAT.length * HAIR.length * OUTFITS.length * FACINGS.length * 2);
});

async function boot(page, search) {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, search || '');
  await page.waitForFunction(() => window.PixelPets && window.BUILD && window.PixelPets.state && window.PixelPets.state.v === 2);
}

async function openLook(page) {
  await page.locator('#settingsBtn').click();
  await page.locator('#setLook').click();
  await expect(page.locator('#ovLook')).toBeVisible();
}

function stableSave(raw) {
  const save = JSON.parse(raw);
  delete save.last;
  delete save.debugSave;
  return save;
}

async function readLabels(page) {
  const labs = page.locator('#ovLook .look-scroll .look-lb');
  const n = await labs.count();
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(await labs.nth(i).evaluate((el) => {
      const row = el.closest('.look-row');
      if (row.hidden || el.offsetParent === null) return { hidden: true, text: el.textContent };
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      const r = el.getBoundingClientRect();
      const prev = row.previousElementSibling;
      const prevOn = prev && !prev.hidden && prev.offsetParent !== null;
      const pr = prevOn ? prev.getBoundingClientRect() : null;
      const controls = row.querySelector('.swatches, .previews, input');
      const cr = controls ? controls.getBoundingClientRect() : null;
      const scroll = document.querySelector('#ovLook .look-scroll').getBoundingClientRect();
      const card = document.querySelector('#ovLook .look-card').getBoundingClientRect();
      return {
        hidden: false,
        text: el.textContent,
        top: r.top, bottom: r.bottom, left: r.left, right: r.right,
        prevBottom: pr ? pr.bottom : null,
        controlsTop: cr ? cr.top : null,
        scroll: { top: scroll.top, bottom: scroll.bottom, left: scroll.left, right: scroll.right },
        card: { top: card.top, bottom: card.bottom, left: card.left, right: card.right },
      };
    }));
  }
  return out;
}

async function assertLabels(page) {
  const rows = await readLabels(page);
  const shown = rows.filter(r => !r.hidden);
  expect(rows.filter(r => r.hidden).map(r => r.text)).toEqual(['NAME']);
  expect(shown.map(r => r.text)).toEqual(LABELS);
  for (const row of shown) {
    expect(row.top, row.text + ' above the scroll').toBeGreaterThanOrEqual(row.scroll.top - 0.5);
    expect(row.bottom, row.text + ' below the scroll').toBeLessThanOrEqual(row.scroll.bottom + 0.5);
    expect(row.left, row.text + ' left of the scroll').toBeGreaterThanOrEqual(row.scroll.left - 0.5);
    expect(row.right, row.text + ' right of the scroll').toBeLessThanOrEqual(row.scroll.right + 0.5);
    expect(row.top, row.text + ' above the card').toBeGreaterThanOrEqual(row.card.top - 0.5);
    expect(row.bottom, row.text + ' below the card').toBeLessThanOrEqual(row.card.bottom + 0.5);
    if (row.prevBottom != null) {
      expect(row.top - row.prevBottom, row.text + ' gap').toBeGreaterThanOrEqual(6);
      expect(row.top, row.text + ' under the ring').toBeGreaterThanOrEqual(row.prevBottom + 5);
    }
    if (row.controlsTop != null) expect(row.controlsTop - row.bottom, row.text + ' above its row').toBeGreaterThanOrEqual(6);
  }
  const fit = await page.evaluate(() => {
    const sw = document.querySelector('#ovLook .swatch').getBoundingClientRect();
    const pv = document.querySelector('#ovLook .preview').getBoundingClientRect();
    const buttons = [...document.querySelectorAll('#ovLook button')].filter(b => b.offsetParent).map(b => {
      const r = b.getBoundingClientRect();
      return { w: r.width, h: r.height, id: b.id || b.getAttribute('aria-label') || '' };
    });
    const done = document.querySelector('#lookDone').getBoundingClientRect();
    const ward = document.querySelectorAll('#ovWardrobe .look-lb').length;
    return {
      sw: { w: sw.width, h: sw.height },
      pv: { w: pv.width, h: pv.height },
      small: buttons.filter(b => b.w < 44 || b.h < 44),
      doneTop: done.top,
      doneBottom: done.bottom,
      view: document.documentElement.clientHeight,
      ward,
    };
  });
  expect(Math.round(fit.sw.w)).toBe(44);
  expect(Math.round(fit.sw.h)).toBe(44);
  expect(fit.pv.w).toBeGreaterThanOrEqual(60);
  expect(fit.pv.h).toBeGreaterThanOrEqual(60);
  expect(fit.small).toEqual([]);
  expect(fit.doneTop).toBeGreaterThanOrEqual(0);
  expect(fit.doneBottom).toBeLessThanOrEqual(fit.view + 1);
  expect(fit.ward).toBe(0);
}

async function assertFirstColumnRings(page) {
  const rows = page.locator('#ovLook .look-scroll .look-row');
  const n = await rows.count();
  for (let i = 0; i < n; i++) {
    const btn = rows.nth(i).locator('button').first();
    if (await btn.count()) await btn.click();
  }
  const fit = await page.evaluate((ring) => {
    const card = document.querySelector('#ovLook .look-card');
    const cr = card.getBoundingClientRect();
    const cs = getComputedStyle(card);
    const innerLeft = cr.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
    const innerRight = cr.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight);
    const bad = [];
    const buttons = [...document.querySelectorAll('#ovLook .look-scroll .swatch, #ovLook .look-scroll .preview')];
    for (const b of buttons) {
      const r = b.getBoundingClientRect();
      const name = b.getAttribute('aria-label') || b.dataset.opt || '';
      if (r.left - ring < innerLeft - 0.5) bad.push(name + ' left ' + (r.left - ring) + ' < ' + innerLeft);
      if (r.right + ring > innerRight + 0.5) bad.push(name + ' right ' + (r.right + ring) + ' > ' + innerRight);
      if (r.width < 44 || r.height < 44) bad.push(name + ' ' + r.width + 'x' + r.height);
    }
    const firstOn = [...document.querySelectorAll('#ovLook .look-scroll .look-row')].filter(row => row.offsetParent).every(row => {
      const b = row.querySelector('button');
      return !b || b.classList.contains('on');
    });
    return { bad, firstOn, n: buttons.length };
  }, RING);
  expect(fit.n).toBeGreaterThan(0);
  expect(fit.firstOn).toBe(true);
  expect(fit.bad, fit.bad.join('\n')).toEqual([]);
}

async function shotCard(page, name) {
  await page.locator('#ovLook .look-lb', { hasText: /^OUTFIT COLOUR$/ }).evaluate((el) => {
    const sc = el.closest('.look-scroll');
    const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
    sc.scrollTop = Math.max(0, top - 16);
  });
  await page.locator('#ovLook .look-card').screenshot({ path: path.join(artifactsDir(), name) });
}

async function capPreview(page) {
  await page.locator('#lookHair button[data-opt="curls"]').click();
  await page.locator('#lookHairCol button[data-opt="y"]').click();
  await page.locator('#lookAccessory button[data-opt="cap"]').click();
  const seen = new Set();
  let hairBelow = false;
  const above = [];
  const start = Date.now();
  while (Date.now() - start < 5200 && (seen.size < 8 || !hairBelow)) {
    const sample = await page.evaluate(() => {
      const c = document.querySelector('#lookPreview');
      const data = c.getContext('2d').getImageData(0, 0, 18, 18).data;
      const yellowAt = (y) => {
        for (let x = 0; x < 18; x++) {
          const i = (y * 18 + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a > 200 && r > 240 && g > 180 && g < 230 && b > 90 && b < 150) return true;
        }
        return false;
      };
      const high = [];
      for (let y = 0; y < 5; y++) if (yellowAt(y)) high.push(y);
      let low = false;
      for (let y = 5; y < 18; y++) if (yellowAt(y)) low = true;
      return { key: c.dataset.facing + c.dataset.frame, high, low };
    });
    seen.add(sample.key);
    if (sample.high.length && above.length < 6) above.push(sample.key + ':' + sample.high.join(','));
    if (sample.low) hairBelow = true;
    await page.waitForTimeout(100);
  }
  expect(above, 'yellow hair above the cap').toEqual([]);
  expect(seen.size, 'facings and frames seen: ' + [...seen].join(' ')).toBe(8);
  expect(hairBelow, 'curls stay visible under the cap').toBe(true);
}

async function wearAndCancel(page) {
  // The first autosave fills normalizeV2 fields (look.accessory, meta, moves). Wait for that write, then compare.
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('pixelpets.save.v2');
    if (!raw) return false;
    let s;
    try { s = JSON.parse(raw); } catch (e) { return false; }
    return !!(s && s.v === 2 && s.meta && s.player && s.player.look && s.player.look.accessory === 'none');
  }, null, { timeout: 15000 });
  const before = stableSave(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2')));
  await capPreview(page);
  await page.locator('#lookAccessory button[data-opt="none"]').click();
  await page.locator('#lookCancel').click();
  await expect(page.locator('#ovLook')).toBeHidden();
  const after = stableSave(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2')));
  expect(after.v).toBe(2);
  expect(after.player.look).toEqual(before.player.look);
  expect(after).toEqual(before);
}

async function creatorPass(page, shotName) {
  await boot(page, '');
  await openLook(page);
  await assertLabels(page);
  await assertFirstColumnRings(page);
  await shotCard(page, shotName);
  await wearAndCancel(page);
}

test('look labels are fully visible and a cap hides the hair above the brim', async ({ page, browser }) => {
  test.setTimeout(120000);
  const width = page.viewportSize().width;
  await creatorPass(page, 'creator_' + width + '.png');
  if (width !== 390) return;
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
    baseURL: baseURL(),
  });
  const desk = await ctx.newPage();
  const errors = [];
  desk.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  desk.on('pageerror', (err) => errors.push(err.message));
  try {
    await creatorPass(desk, 'creator_1280.png');
    expect(errors, 'desktop console errors:\n' + errors.join('\n')).toEqual([]);
  } finally {
    await ctx.close();
  }
});

test('every accessory on every hair style, and Hollis wears the cap rule', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one sheet');
  test.setTimeout(60000);
  const now = loadKeeper(fs.readFileSync(path.join(ROOT, 'keeper.js'), 'utf8'));
  await boot(page, '?debug=1');
  await page.waitForFunction(() => window.keeperFrames && window.PixelPets.lookGrid);
  const sheet = await page.evaluate(({ hairs, acc }) => {
    const scale = 4;
    const cell = 18 * scale;
    const left = 88;
    const top = 22;
    const c = document.createElement('canvas');
    c.width = left + hairs.length * cell + 8;
    c.height = top + acc.length * cell + 8;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#1a1c2c';
    g.fillRect(0, 0, c.width, c.height);
    g.font = '12px sans-serif';
    g.fillStyle = '#ffcd75';
    g.textBaseline = 'middle';
    hairs.forEach((h, i) => g.fillText(h, left + i * cell + 4, 11));
    const lookA = { skin: '6', hair: 'curls', hairCol: 'y', outfit: 'coat', outfitCol: 't', accent: 'r', accessory: 'cap' };
    const a = window.keeperFrames(lookA);
    const b = window.keeperFrames(Object.assign({}, lookA));
    const none = window.keeperFrames(Object.assign({}, lookA, { accessory: 'none' }));
    const cache = { same: a === b && a.down[0] === b.down[0], diff: a !== none && a.down[0] !== none.down[0] };
    acc.forEach((id, row) => {
      g.fillStyle = '#c7cfdd';
      g.fillText(id, 6, top + row * cell + cell / 2);
      hairs.forEach((hair, col) => {
        const x = left + col * cell;
        const y = top + row * cell;
        g.fillStyle = (row + col) % 2 ? '#c7cfdd' : '#9aa5b4';
        g.fillRect(x, y, cell, cell);
        const src = window.keeperFrames({
          skin: '6', hair, hairCol: 'y', outfit: 'coat', outfitCol: 't', accent: 'r', accessory: id,
        }).down[0];
        g.drawImage(src, x, y, cell, cell);
      });
    });
    return { url: c.toDataURL('image/png'), cache, hollis: window.PixelPets.lookGrid('hollis') };
  }, { hairs: HAIR, acc: ['none', 'glasses', 'bow', 'cap', 'scarf', 'sash', 'satchel', 'goggles', 'beanie', 'lanyard'] });
  expect(sheet.cache).toEqual({ same: true, diff: true });
  // Live Hollis wears the soot scarf and no cap (GLIMMERWELL_PALETTE v0.3.1), so the curls stay in the top rows.
  expect(sheet.hollis).toEqual(now.keeperGrid(HOLLIS_LIVE, 'down', 0));
  expect(sheet.hollis.slice(0, 4).some(r => r.includes('c'))).toBe(true);
  const capped = now.keeperGrid(HOLLIS, 'down', 0);
  expect(capped.slice(0, 4).some(r => r.includes('c'))).toBe(false);
  expect(capped.slice(4).some(r => r.includes('c'))).toBe(true);
  const png = Buffer.from(sheet.url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(artifactsDir(), 'accessory_hair_390.png'), png);
});
