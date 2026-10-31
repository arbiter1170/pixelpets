/* D1100 A: the cracked handset (CRACK//HAND) in Glimmerwell's dark colours.
   Soot shell and panels, wine rules and rings, one thin crimson outer ring, w text, y kicker and .who names,
   soot or wine app tiles with w ink. Colour only: layout, copy and the KEEPER1 phone match the merge base
   with origin/main (style.css and game.js are served from that commit on a second page). */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, artifactsDir } = require('./helpers');

trackErrors(test, expect);
test.use({ serviceWorkers: 'block' });   // page.route must see style.css and game.js on the baseline page

const SOOT = 'rgb(24, 20, 15)';
const WINE = 'rgb(150, 14, 22)';
const CRIMSON = 'rgb(200, 24, 24)';
const W = 'rgb(244, 244, 244)';
const Y = 'rgb(255, 205, 117)';
const W_DIM = 'rgba(244, 244, 244, 0.6)';   // placeholder and disabled text: w at 60%

// Every hex the old green terminal used, as computed-style rgb triples. None may survive under #ovPhone.hack.
const OLD_GREENS = ['#1e6b42', '#3dce78', '#5ee08a', '#d7ffc8', '#c8f7cf', '#b7ebc8', '#8ee8b0', '#9dffc0',
  '#07140e', '#0c1f16', '#0a1a12', '#04100c', '#0a1610', '#101c16', '#123224', '#143222', '#1c7a45', '#0e3a22',
  '#245c3c', '#1a3d2c', '#7eae90', '#8fb9a0', '#e7ffe8', '#f4fff6', '#030c08'];
const tripleOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
const OLD_TRIPLES = OLD_GREENS.map(tripleOf).concat(['94, 224, 138', '3, 12, 8']);

const COLOUR_PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color',
  'border-bottom-color', 'border-left-color', 'border-block-start-color', 'border-block-end-color',
  'border-inline-start-color', 'border-inline-end-color', 'outline-color', 'box-shadow', 'text-decoration-color',
  'text-emphasis-color', 'caret-color', 'column-rule-color', '-webkit-text-fill-color', '-webkit-text-stroke-color',
  'fill', 'stroke', 'accent-color', 'scrollbar-color', 'flood-color', 'lighting-color', 'stop-color'];

const isColourProp = (p) => COLOUR_PROPS.includes(p) || /-color$/.test(p);

// Baseline files from the merge base with origin/main (never from the branch tip).
let BASE = null;
function baseFiles() {
  if (BASE) return BASE;
  const root = path.resolve(__dirname, '..');
  const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  const mergeBase = git(['merge-base', 'HEAD', 'origin/main']).trim();
  BASE = { css: git(['show', mergeBase + ':style.css']), game: git(['show', mergeBase + ':game.js']) };
  return BASE;
}

function readySave() {
  const save = starterSave();
  Object.assign(save.flags, { 'story.reached_route1': true, 'story.starter_received': true, 'story.phone_got': true });
  save.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  return save;
}

// A second page in the same context that loads style.css and game.js from the merge base.
async function basePage(context) {
  const base = baseFiles();
  const p = await context.newPage();
  p.ppErrors = [];
  p.on('console', (msg) => { if (msg.type() === 'error') p.ppErrors.push(msg.text()); });
  p.on('pageerror', (err) => p.ppErrors.push(err.message));
  await p.route('**/style.css*', (r) => r.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: base.css }));
  await p.route('**/game.js*', (r) => r.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: base.game }));
  return p;
}

// Opens the handset the way civic.spec.js does: keeper1 in the bag, then (for glimmer) the story pledge cracks it.
async function openHandset(page, glimmer) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runSteps === 'function');
  const steps = [['give', 'keeper1', 1]];
  if (glimmer) steps.push(['setFlag', 'story.side', 'glimmer'], ['setFlag', 'story.side_pick_done', true], ['standing', 'glimmer', null, 'sp_pick']);
  expect(await page.evaluate((s) => PixelPets.runSteps(s), steps)).toBe(true);
  await playScene(page, []);
  await page.waitForFunction(() => !PixelPets.scene);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => PixelPets.phoneHack())).toBe(!!glimmer);
  expect(await page.evaluate(() => document.querySelector('#ovPhone').classList.contains('hack'))).toBe(!!glimmer);
}

async function openApp(page, app) {
  await page.locator('#phoneHome .phone-app[data-app="' + app + '"]').click();
  await expect(page.locator('#phonePane')).toBeVisible();
}
async function backHome(page) {
  await page.locator('#phoneBack').click();
  await expect(page.locator('#phoneHome')).toBeVisible();
}

// Rects, text and computed styles of every visible element in the overlay (plus ::before / ::placeholder).
async function snapshot(page) {
  return page.evaluate((colourProps) => {
    const ov = document.querySelector('#ovPhone');
    const out = [];
    const els = [ov, ...ov.querySelectorAll('*')];
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const key = i + ':' + el.tagName + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
      const cs = getComputedStyle(el);
      const style = {};
      for (let j = 0; j < cs.length; j++) style[cs[j]] = cs.getPropertyValue(cs[j]);
      const pseudo = {};
      for (const ps of ['::before', '::after', '::placeholder']) {
        const pcs = getComputedStyle(el, ps);
        if (ps === '::placeholder' ? el.tagName === 'INPUT' : (pcs.content && pcs.content !== 'none' && pcs.content !== 'normal')) {
          pseudo[ps] = {};
          for (let j = 0; j < pcs.length; j++) pseudo[ps][pcs[j]] = pcs.getPropertyValue(pcs[j]);
        }
      }
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      out.push({ key, rect: { x: r.x, y: r.y, w: r.width, h: r.height }, style, pseudo, ownText,
        text: el === ov ? ov.innerText : null });
    });
    return { els: out, colourProps };
  }, COLOUR_PROPS);
}

// Every colour value the overlay computes, as flat strings, for the "no old green" and "crimson once" checks.
function colourValues(snap) {
  const vals = [];
  for (const e of snap.els) {
    for (const p of Object.keys(e.style)) if (isColourProp(p)) vals.push({ key: e.key, prop: p, v: e.style[p] });
    for (const [ps, st] of Object.entries(e.pseudo)) for (const p of Object.keys(st)) if (isColourProp(p)) vals.push({ key: e.key + ps, prop: p, v: st[p] });
  }
  return vals;
}
function oldGreenHits(snap) {
  return colourValues(snap).filter(({ v }) => OLD_TRIPLES.some((t) => v.includes('(' + t)));
}

// Every non-colour computed property must match between base and branch (colour only, no layout change).
function nonColourDiffs(base, cur) {
  expect(cur.els.map((e) => e.key)).toEqual(base.els.map((e) => e.key));
  const diffs = [];
  base.els.forEach((b, i) => {
    const c = cur.els[i];
    for (const k of ['x', 'y', 'w', 'h']) if (Math.abs(b.rect[k] - c.rect[k]) > 0.01) diffs.push(b.key + ' rect.' + k + ' ' + b.rect[k] + ' -> ' + c.rect[k]);
    for (const p of Object.keys(b.style)) {
      if (isColourProp(p)) continue;
      if (b.style[p] !== c.style[p]) diffs.push(b.key + ' ' + p + ' ' + b.style[p] + ' -> ' + c.style[p]);
    }
  });
  return diffs;
}

async function glyphInk(page) {
  return page.evaluate(() => [...document.querySelectorAll('#phoneHome .phone-glyph canvas')].map((c) => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const inks = new Set();
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) inks.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2] + ',' + d[i + 3]);
    return { glyph: c.parentElement.dataset.glyph, inks: [...inks] };
  }));
}

// Inject one of every element class the hack rules colour, so the sweep covers rules a fresh save never shows.
async function addFixtures(page) {
  await page.evaluate(() => {
    const body = document.querySelector('#phoneBody');
    const box = document.createElement('div'); box.id = 'zzFixtures';
    box.innerHTML = '<div class="board-mast">M</div><article class="board-slip"><b class="board-slip-title">T</b><button class="btn" type="button">B</button></article>'
      + '<article class="phone-job"><button class="btn btn-play" type="button">P</button><button class="btn" type="button" disabled>D</button></article>'
      + '<article class="ribbit-post ribbit-mine"><div class="ribbit-top"><b class="ribbit-desk">D</b><span class="ribbit-handle">@h</span></div><p class="ribbit-text">x</p><small class="ribbit-chirps">c</small><small class="ribbit-foot">f</small></article>'
      + '<div class="ribbit-trend"><span class="ribbit-trend-lab">L</span><span class="ribbit-tag"><b>t</b><small>s</small></span></div>'
      + '<div class="phone-note"><p>n</p><small class="phone-note-stamp">S</small></div><p class="sky-foot">s</p><p class="glow-advice">g</p>'
      + '<div class="contact-row"><button class="contact-main" type="button"><span class="contact-meta"><span class="contact-name">N</span><span class="contact-place">P</span><span class="contact-quest">Q</span><span class="contact-ready">READY</span></span></button><button class="btn contact-star" type="button" aria-pressed="true">*</button></div>'
      + '<div class="contact-card"><p class="contact-card-name">C</p><p class="where-line">W</p><p class="contact-line">L</p><p class="contact-empty">E</p></div>'
      + '<p><b class="who">Who</b>  line</p>';
    body.appendChild(box);
  });
}

async function hackPanes(page) {
  const snaps = { home: await snapshot(page) };
  for (const app of ['notes', 'jobs', 'contacts', 'ribbit', 'sky', 'glow', 'friends', 'board']) {
    await openApp(page, app);
    snaps[app] = await snapshot(page);
    await backHome(page);
  }
  await openApp(page, 'notes');
  await addFixtures(page);
  await page.evaluate(() => { const i = document.querySelector('#friendInput'); if (i) i.disabled = true; });
  snaps.fixtures = await snapshot(page);
  await page.locator('#phoneFriends').evaluate((el) => { el.hidden = false; });
  snaps.friendsShown = await snapshot(page);
  await page.evaluate(() => { document.querySelector('#zzFixtures').remove(); const i = document.querySelector('#friendInput'); if (i) i.disabled = false; });
  await page.locator('#phoneFriends').evaluate((el) => { el.hidden = true; });
  await backHome(page);
  return snaps;
}

async function shellShot(page, name) {
  if (!process.env.PP_ARTIFACTS) return;
  await page.waitForFunction(() => !document.querySelector('#toast.show'), null, { timeout: 8000 });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#toast')).opacity === '0', null, { timeout: 8000 });
  const box = await page.locator('#ovPhone .phone-shell').boundingBox();
  const vp = page.viewportSize();
  const x = Math.max(0, box.x - 10), y = Math.max(0, box.y - 10);
  const clip = { x, y, width: Math.min(vp.width - x, box.width + 20), height: Math.min(vp.height - y, box.height + 20) };
  await page.screenshot({ path: path.join(artifactsDir('glimmer_handset'), name + '-' + vp.width + '.png'), clip });
}

test('the cracked handset wears soot, wine, one crimson ring, w text and y names', async ({ page }) => {
  await installSave(page.context(), readySave(), { quietDay: true });
  await openHandset(page, true);
  const got = await page.evaluate(() => {
    const cs = (sel, ps) => getComputedStyle(document.querySelector(sel), ps || null);
    const shell = cs('#ovPhone .phone-shell');
    return {
      overlay: cs('#ovPhone').backgroundColor,
      shellBg: shell.backgroundColor,
      shellBorder: [shell.borderTopColor, shell.borderRightColor, shell.borderBottomColor, shell.borderLeftColor],
      shellShadow: shell.boxShadow,
      top: cs('#ovPhone .phone-top').backgroundColor,
      topRule: cs('#ovPhone .phone-top').borderBottomColor,
      title: cs('#phoneTitle').color,
      kicker: cs('#phoneTitle', '::before').color,
      kickerText: cs('#phoneTitle', '::before').content,
      foot: cs('#phoneFoot').color,
      footRule: cs('#phoneFoot').borderLeftColor,
      labs: [...document.querySelectorAll('#ovPhone .phone-lab')].map((el) => getComputedStyle(el).color),
      bars: [...document.querySelectorAll('#ovPhone .phone-signal i')].map((el) => getComputedStyle(el).backgroundColor),
      close: [cs('#phoneClose').color, cs('#phoneClose').backgroundColor],
      tiles: [...document.querySelectorAll('#ovPhone .phone-glyph')].map((el) => {
        const r = el.getBoundingClientRect();
        return { glyph: el.dataset.glyph, bg: getComputedStyle(el).backgroundColor, ring: getComputedStyle(el).boxShadow, top: Math.round(r.top), left: r.left };
      }),
      shellRect: (() => { const r = document.querySelector('#ovPhone .phone-shell').getBoundingClientRect(); return { w: r.width, h: r.height }; })(),
    };
  });
  expect(got.overlay).toBe('rgba(24, 20, 15, 0.96)');
  expect(got.shellBg).toBe(SOOT);
  expect(got.shellBorder).toEqual([WINE, WINE, WINE, WINE]);
  expect(got.top).toBe(SOOT);
  expect(got.topRule).toBe(WINE);
  expect(got.title).toBe(W);
  expect(got.kicker).toBe(Y);
  expect(got.kickerText).toBe('"OFF-CREST"');
  expect(got.foot).toBe(W);
  expect(got.footRule).toBe(WINE);
  expect(new Set(got.labs)).toEqual(new Set([W]));
  expect(new Set(got.bars)).toEqual(new Set([WINE]));
  expect(got.close).toEqual([W, SOOT]);

  // One thin crimson ring, outermost, 1 px wide, under 10% of the shell's area.
  const rings = got.shellShadow.split(/,(?![^(]*\))/).map((s) => s.trim());
  expect(rings).toEqual([SOOT + ' 0px 0px 0px 3px', WINE + ' 0px 0px 0px 5px', CRIMSON + ' 0px 0px 0px 6px']);
  const { w, h } = got.shellRect;
  const ringArea = (w + 12) * (h + 12) - (w + 10) * (h + 10);
  expect(ringArea / (w * h)).toBeLessThan(0.1);

  // Tiles: soot or wine, wine ring, and neighbours in a row never share a fill.
  for (const t of got.tiles) {
    expect([SOOT, WINE], t.glyph).toContain(t.bg);
    expect(t.ring.startsWith(WINE + ' 0px 0px 0px 2px'), t.glyph).toBe(true);
  }
  const rows = {};
  got.tiles.forEach((t) => { (rows[t.top] = rows[t.top] || []).push(t); });
  for (const row of Object.values(rows)) {
    row.sort((a, b) => a.left - b.left);
    for (let i = 1; i < row.length; i++) expect(row[i].bg, row[i - 1].glyph + ' / ' + row[i].glyph).not.toBe(row[i - 1].bg);
  }
  expect(new Set(got.tiles.map((t) => t.bg))).toEqual(new Set([SOOT, WINE]));

  // Glyph ink: every painted pixel is w.
  for (const g of await glyphInk(page)) expect(g.inks, g.glyph).toEqual(['244,244,244,255']);
  await shellShot(page, 'after-home');

  // Notes: .who names in y, note cards soot with a wine ring.
  await openApp(page, 'notes');
  const notes = await page.evaluate(() => ({
    who: [...document.querySelectorAll('#phoneBody .who')].map((el) => getComputedStyle(el).color),
    p: [...document.querySelectorAll('#phoneBody > p')].map((el) => getComputedStyle(el).backgroundColor),
    body: getComputedStyle(document.querySelector('#phoneBody')).color,
  }));
  expect(notes.who.length).toBeGreaterThan(0);
  expect(new Set(notes.who)).toEqual(new Set([Y]));
  expect(new Set(notes.p)).toEqual(new Set([SOOT]));
  expect(notes.body).toBe(W);
  await shellShot(page, 'after-notes');
  await backHome(page);

  // Every pane plus a fixture of every coloured class: no old green, crimson only on the shell ring,
  // and every element with its own text uses w (or w at 60% for disabled) or y.
  const snaps = await hackPanes(page);
  for (const [pane, snap] of Object.entries(snaps)) {
    expect(oldGreenHits(snap), pane).toEqual([]);
    const crimson = colourValues(snap).filter(({ v }) => v.includes('(200, 24, 24'));
    expect(crimson.map((c) => c.key.replace(/^\d+:/, '') + ' ' + c.prop), pane).toEqual(['DIV.ov-inner.phone-shell box-shadow']);
    const offText = snap.els.filter((e) => e.ownText && ![W, Y, W_DIM].includes(e.style.color)).map((e) => e.key + ' ' + e.style.color);
    expect(offText, pane + ' text off the w / y pairs').toEqual([]);
    const offFill = snap.els.filter((e) => !/\.contact-face/.test(e.key) && ![SOOT, WINE, 'rgba(0, 0, 0, 0)', 'rgba(24, 20, 15, 0.96)'].includes(e.style['background-color']))
      .map((e) => e.key + ' ' + e.style['background-color']);
    expect(offFill, pane + ' fills off soot / wine').toEqual([]);
  }
  const fx = snaps.fixtures.els;
  const pick = (cls) => fx.find((e) => e.key.split('.').includes(cls));
  expect(pick('contact-ready').style['background-color']).toBe(WINE);
  expect(pick('contact-ready').style.color).toBe(W);
  expect(pick('contact-star').style['background-color']).toBe(WINE);
  expect(pick('ribbit-mine').style['box-shadow']).toBe(WINE + ' 0px 0px 0px 2px');
  expect(pick('board-slip').style['box-shadow']).toBe(WINE + ' 0px 0px 0px 2px');
  expect(pick('phone-job').style['background-color']).toBe(SOOT);
  expect(pick('btn-play').style['background-color']).toBe(WINE);
  expect(pick('who').style.color).toBe(Y);
  const input = snaps.friendsShown.els.find((e) => e.key.endsWith('INPUT#friendInput'));
  expect(input.style['background-color']).toBe(SOOT);
  expect(input.style['border-top-color']).toBe(WINE);

  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(save.v).toBe(2);
});

test('no #ovPhone.hack rule in style.css keeps an old green, and KEEPER1 rules match the merge base', async () => {
  const css = fs.readFileSync(path.resolve(__dirname, '..', 'style.css'), 'utf8');
  const rulesOf = (text, re) => text.split('\n').filter((l) => re.test(l));
  const hackRules = rulesOf(css, /#ovPhone\.hack/);
  expect(hackRules.length).toBeGreaterThan(60);
  const hackText = hackRules.join('\n') + '\n' + css.slice(css.indexOf('#ovPhone.hack .phone-shell{'), css.indexOf('#ovPhone.hack .phone-top{'));
  for (const hex of OLD_GREENS) expect(hackText.toLowerCase(), hex).not.toContain(hex);
  expect(hackText).not.toMatch(/rgba\(94,224,138|rgba\(3,12,8/);
  expect((hackText.match(/#c81818/gi) || []).length).toBe(1);
  const keeper = /#ovPhone:not\(\.hack\)/;
  expect(rulesOf(css, keeper)).toEqual(rulesOf(baseFiles().css, keeper));
});

test('colour only: layout, copy and save match the merge base, tap targets stay 44 px', async ({ page }) => {
  await installSave(page.context(), readySave(), { quietDay: true });
  const bp = await basePage(page.context());
  await openHandset(bp, true);
  await shellShot(bp, 'before-home');
  const baseHome = await snapshot(bp);
  await openApp(bp, 'notes');
  await shellShot(bp, 'before-notes');
  const baseNotes = await snapshot(bp);
  await backHome(bp);
  await openApp(bp, 'jobs');
  const baseJobs = await snapshot(bp);
  const baseSave = await bp.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  const baseKeys = await bp.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pixelpets.')).sort());
  expect(bp.ppErrors, 'baseline page errors').toEqual([]);
  await bp.close();

  await openHandset(page, true);
  const curHome = await snapshot(page);
  await openApp(page, 'notes');
  const curNotes = await snapshot(page);
  await backHome(page);
  await openApp(page, 'jobs');
  const curJobs = await snapshot(page);

  expect(nonColourDiffs(baseHome, curHome), 'home').toEqual([]);
  expect(nonColourDiffs(baseNotes, curNotes), 'notes').toEqual([]);
  expect(nonColourDiffs(baseJobs, curJobs), 'jobs').toEqual([]);

  // Copy unchanged: overlay text, kicker and the fixed strings.
  for (const [b, c] of [[baseHome, curHome], [baseNotes, curNotes], [baseJobs, curJobs]]) expect(c.els[0].text).toBe(b.els[0].text);
  const kick = (s) => s.els.find((e) => e.key.endsWith('#phoneTitle.ov-title')).pseudo['::before'].content;
  expect(kick(curHome)).toBe(kick(baseHome));
  expect(curHome.els[0].text).toContain('CRACK//HAND');
  expect(curHome.els[0].text).toContain('BOTNET');
  expect(curHome.els[0].text).toContain('Still on their wires. Talk quiet.');

  // Tap targets.
  const taps = curHome.els.filter((e) => /\.phone-app$|#phoneClose/.test(e.key));
  expect(taps.length).toBe(10);
  for (const t of taps) { expect(t.rect.w, t.key).toBeGreaterThanOrEqual(44); expect(t.rect.h, t.key).toBeGreaterThanOrEqual(44); }

  // Save unchanged: same key, v 2, same fields as the merge base after the same steps.
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(save.v).toBe(2);
  expect(Object.keys(save).sort()).toEqual(Object.keys(baseSave).sort());
  expect(Object.keys(save.flags).sort()).toEqual(Object.keys(baseSave.flags).sort());
  expect(save.bag).toEqual(baseSave.bag);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pixelpets.')).sort())).toEqual(baseKeys);
});

test('the issued KEEPER1 phone looks exactly as it does on the merge base', async ({ page }) => {
  await installSave(page.context(), readySave(), { quietDay: true });
  const bp = await basePage(page.context());
  await openHandset(bp, false);
  const baseHome = await snapshot(bp);
  const baseInk = await glyphInk(bp);
  await openApp(bp, 'notes');
  const baseNotes = await snapshot(bp);
  expect(bp.ppErrors, 'baseline page errors').toEqual([]);
  await bp.close();

  await openHandset(page, false);
  const curHome = await snapshot(page);
  expect(await glyphInk(page)).toEqual(baseInk);
  await openApp(page, 'notes');
  const curNotes = await snapshot(page);
  for (const [b, c, pane] of [[baseHome, curHome, 'home'], [baseNotes, curNotes, 'notes']]) {
    expect(c.els.map((e) => e.key), pane).toEqual(b.els.map((e) => e.key));
    const diffs = [];
    b.els.forEach((be, i) => {
      const ce = c.els[i];
      if (JSON.stringify(be.rect) !== JSON.stringify(ce.rect)) diffs.push(be.key + ' rect');
      for (const p of Object.keys(be.style)) if (be.style[p] !== ce.style[p]) diffs.push(be.key + ' ' + p);
      for (const [ps, st] of Object.entries(be.pseudo)) for (const p of Object.keys(st)) if (!ce.pseudo[ps] || ce.pseudo[ps][p] !== st[p]) diffs.push(be.key + ps + ' ' + p + ' ' + st[p] + ' -> ' + (ce.pseudo[ps] && ce.pseudo[ps][p]));
      if (be.text !== ce.text) diffs.push(be.key + ' text');
    });
    expect(diffs, pane).toEqual([]);
  }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
});
