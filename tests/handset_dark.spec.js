/* D1100, revised by Vincent (Nov 1, 2026): the cracked handset (CRACK//HAND) stays a green terminal. Glimmerwell shows
   only as accents: a wine and crimson outer ring on the shell, and a honey OFF-CREST kicker and .who names.
   Every other computed style, every rect, the copy, the glyph ink and the KEEPER1 phone must match main just before
   #243 merged (PRE_D1100; style.css is served from that commit on a second page). */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, artifactsDir } = require('./helpers');

trackErrors(test, expect);
test.use({ serviceWorkers: 'block' });   // page.route must see style.css on the baseline page

const GREEN_BG = 'rgb(7, 20, 14)';      // #07140e, the shell stays green-black
const GREEN_RULE = 'rgb(30, 107, 66)';  // #1e6b42, the border stays green
const GREEN_TEXT = 'rgb(215, 255, 200)'; // #d7ffc8, the title stays green
const WINE = 'rgb(150, 14, 22)';
const CRIMSON = 'rgb(200, 24, 24)';
const Y = 'rgb(255, 205, 117)';

// The only computed values allowed to differ from the merge base.
const ALLOWED = [
  { key: /DIV\.ov-inner\.phone-shell$/, pseudo: null, prop: 'box-shadow' },
  { key: /#phoneTitle\.ov-title$/, pseudo: '::before', prop: 'color' },
  { key: /#phoneTitle\.ov-title$/, pseudo: '::before', prop: 'caret-color' },
  { key: /#phoneTitle\.ov-title$/, pseudo: '::before', prop: /-color$|^outline-color$|^text-decoration-color$|^column-rule-color$|^border-.*-color$/ },
  { key: /\.who$/, pseudo: null, prop: /color$/ },
];
function allowed(key, pseudo, prop) {
  return ALLOWED.some((a) => a.key.test(key) && a.pseudo === pseudo
    && (a.prop instanceof RegExp ? a.prop.test(prop) : a.prop === prop));
}

let BASE_CSS = null;
function baseCss() {
  if (BASE_CSS) return BASE_CSS;
  const root = path.resolve(__dirname, '..');
  const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  // Pinned to main just before #243 merged. The merge base with origin/main only worked on the PR branch: once #243 is
  // in main, that merge base is the current commit and the accents can no longer be seen.
  BASE_CSS = git(['show', PRE_D1100 + ':style.css']);
  return BASE_CSS;
}
function gitOut(args) {
  return execFileSync('git', args, { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 1 << 28 });
}
const PRE_D1100 = 'ee78a20ad391031e8473088e6a80d05c110b4e42';   // main just before #243
const D1100_MERGE = '8c40044407f00124f2804609b187f47bdf98e8d4'; // #243's merge into main
const D1100_OLD = [
  '  box-shadow:0 0 0 3px #07140e,0 0 0 6px #5ee08a}',
  '#ovPhone.hack #phoneTitle::before{content:"OFF-CREST";color:#8ee8b0}',
  '#ovPhone.hack #phoneBody .who{color:#9dffc0}',
];
const D1100_NEW = [
  '  box-shadow:0 0 0 3px #07140e,0 0 0 5px #960e16,0 0 0 6px #c81818}',
  '#ovPhone.hack #phoneTitle::before{content:"OFF-CREST";color:#ffcd75}',
  '#ovPhone.hack #phoneBody .who{color:#ffcd75}',
];

function readySave() {
  const save = starterSave();
  Object.assign(save.flags, { 'story.reached_route1': true, 'story.starter_received': true, 'story.phone_got': true });
  save.world = { map: 'hearthmoor', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  return save;
}

async function basePage(context) {
  const css = baseCss();
  const p = await context.newPage();
  p.ppErrors = [];
  p.on('console', (msg) => { if (msg.type() === 'error') p.ppErrors.push(msg.text()); });
  p.on('pageerror', (err) => p.ppErrors.push(err.message));
  await p.route('**/style.css*', (r) => r.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: css }));
  return p;
}

// Opens the handset the way civic.spec.js does: keeper1 in the bag, then (for glimmer) the story pledge cracks it.
const FIXED_NOW = new Date('2026-11-02T15:00:00');   // both pages see the same clock, so time-seeded feeds match
async function openHandset(page, glimmer) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(FIXED_NOW);
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
}
async function openApp(page, app) {
  await page.locator('#phoneHome .phone-app[data-app="' + app + '"]').click();
  await expect(page.locator('#phonePane')).toBeVisible();
}
async function backHome(page) {
  await page.locator('#phoneBack').click();
  await expect(page.locator('#phoneHome')).toBeVisible();
}

// Rects, text and computed styles of every visible element in the overlay (plus ::before / ::after / ::placeholder).
async function snapshot(page) {
  return page.evaluate(() => {
    const ov = document.querySelector('#ovPhone');
    const out = [];
    [ov, ...ov.querySelectorAll('*')].forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const key = i + ':' + el.tagName + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
      const read = (cs) => { const o = {}; for (let j = 0; j < cs.length; j++) o[cs[j]] = cs.getPropertyValue(cs[j]); return o; };
      const pseudo = {};
      for (const ps of ['::before', '::after', '::placeholder']) {
        const pcs = getComputedStyle(el, ps);
        if (ps === '::placeholder' ? el.tagName === 'INPUT' : (pcs.content && pcs.content !== 'none' && pcs.content !== 'normal')) pseudo[ps] = read(pcs);
      }
      out.push({ key, rect: { x: r.x, y: r.y, w: r.width, h: r.height }, style: read(getComputedStyle(el)), pseudo, text: el === ov ? ov.innerText : null });
    });
    return out;
  });
}
function diffs(base, cur) {
  expect(cur.map((e) => e.key)).toEqual(base.map((e) => e.key));
  const out = [];
  base.forEach((b, i) => {
    const c = cur[i];
    if (JSON.stringify(b.rect) !== JSON.stringify(c.rect)) out.push(b.key + ' rect');
    if (b.text !== c.text) out.push(b.key + ' text');
    for (const p of Object.keys(b.style)) if (b.style[p] !== c.style[p] && !allowed(b.key, null, p)) out.push(b.key + ' ' + p + ' ' + b.style[p] + ' -> ' + c.style[p]);
    for (const [ps, st] of Object.entries(b.pseudo)) for (const p of Object.keys(st)) {
      const cv = c.pseudo[ps] && c.pseudo[ps][p];
      if (st[p] !== cv && !allowed(b.key, ps, p)) out.push(b.key + ps + ' ' + p + ' ' + st[p] + ' -> ' + cv);
    }
  });
  return out;
}
async function glyphInk(page) {
  return page.evaluate(() => [...document.querySelectorAll('#phoneHome .phone-glyph canvas')].map((c) => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const inks = new Set();
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) inks.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2] + ',' + d[i + 3]);
    return { glyph: c.parentElement.dataset.glyph, inks: [...inks].sort() };
  }));
}
async function shellShot(page, name) {
  if (!process.env.PP_ARTIFACTS) return;
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#toast')).opacity === '0', null, { timeout: 8000 });
  const box = await page.locator('#ovPhone .phone-shell').boundingBox();
  const vp = page.viewportSize();
  const x = Math.max(0, box.x - 10), y = Math.max(0, box.y - 10);
  const clip = { x, y, width: Math.min(vp.width - x, box.width + 20), height: Math.min(vp.height - y, box.height + 20) };
  await page.screenshot({ path: path.join(artifactsDir('glimmer_handset'), name + '-' + vp.width + '.png'), clip });
}

test('the cracked handset stays green with a wine and crimson ring and honey kicker and names', async ({ page }) => {
  await installSave(page.context(), readySave(), { quietDay: true });
  await openHandset(page, true);
  const got = await page.evaluate(() => {
    const cs = (sel, ps) => getComputedStyle(document.querySelector(sel), ps || null);
    const shell = cs('#ovPhone .phone-shell');
    const r = document.querySelector('#ovPhone .phone-shell').getBoundingClientRect();
    return { bg: shell.backgroundColor, border: shell.borderTopColor, shadow: shell.boxShadow, title: cs('#phoneTitle').color,
      kicker: cs('#phoneTitle', '::before').color, kickerText: cs('#phoneTitle', '::before').content, w: r.width, h: r.height };
  });
  expect(got.bg).toBe(GREEN_BG);
  expect(got.border).toBe(GREEN_RULE);
  expect(got.title).toBe(GREEN_TEXT);
  expect(got.kicker).toBe(Y);
  expect(got.kickerText).toBe('"OFF-CREST"');
  const rings = got.shadow.split(/,(?![^(]*\))/).map((s) => s.trim());
  expect(rings).toEqual([GREEN_BG + ' 0px 0px 0px 3px', WINE + ' 0px 0px 0px 5px', CRIMSON + ' 0px 0px 0px 6px']);
  // The wine and crimson rings together (3 px) stay well under 10% of the shell.
  expect(((got.w + 12) * (got.h + 12) - (got.w + 6) * (got.h + 6)) / (got.w * got.h)).toBeLessThan(0.1);
  await shellShot(page, 'after-home');

  await openApp(page, 'jobs');
  const who = await page.evaluate(() => [...document.querySelectorAll('#phoneBody .who')].map((el) => getComputedStyle(el).color));
  expect(who.length).toBeGreaterThan(0);
  expect(new Set(who)).toEqual(new Set([Y]));
  await shellShot(page, 'after-jobs');

  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(save.v).toBe(2);
});

test('style.css changes only the ring, the kicker and the names against the merge base', async () => {
  // #243's own diff (main just before it, to its merge) touches only the ring, the kicker and the names. Later
  // style.css work (e.g. the Nov 2 phone trim) can't break this half.
  const diff = gitOut(['diff', PRE_D1100, D1100_MERGE, '--', 'style.css']).split(/\r?\n/);
  const removed = diff.filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1));
  const added = diff.filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
  expect(removed).toEqual(D1100_OLD);
  expect(added.filter((l) => !l.startsWith('/*'))).toEqual(D1100_NEW);
  // Today's style.css still carries the three accents, with the crimson ring as the only use of #c81818. The PAL
  // custom-property line (`--Q:#c81818`, added by #241 with V and N) is a definition, not a use, so it isn't counted.
  const cur = fs.readFileSync(path.resolve(__dirname, '..', 'style.css'), 'utf8');
  const lines = cur.split(/\r?\n/);   // CRLF-tolerant (Windows core.autocrlf=true)
  for (const l of D1100_NEW) expect(lines, l).toContain(l);
  const uses = cur.replace(/--Q:\s*#c81818/gi, '');
  expect((uses.match(/#c81818/gi) || []).length).toBe(1);
});

test('only the accents differ from the merge base: layout, copy, ink and save unchanged, tap targets 44 px', async ({ page }) => {
  await installSave(page.context(), readySave(), { quietDay: true });
  const bp = await basePage(page.context());
  await openHandset(bp, true);
  await shellShot(bp, 'before-home');
  const b = { home: await snapshot(bp), ink: await glyphInk(bp) };
  for (const app of ['jobs', 'contacts', 'ribbit', 'sky', 'friends', 'board', 'news']) {
    await openApp(bp, app);
    if (app === 'jobs') await shellShot(bp, 'before-jobs');
    b[app] = await snapshot(bp);
    await backHome(bp);
  }
  const baseSave = await bp.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(bp.ppErrors, 'baseline page errors').toEqual([]);
  await bp.close();

  await openHandset(page, true);
  expect(diffs(b.home, await snapshot(page)), 'home').toEqual([]);
  expect(await glyphInk(page)).toEqual(b.ink);
  for (const app of ['jobs', 'contacts', 'ribbit', 'sky', 'friends', 'board', 'news']) {
    await openApp(page, app);
    expect(diffs(b[app], await snapshot(page)), app).toEqual([]);
    await backHome(page);
  }
  const taps = b.home.filter((e) => /\.phone-app(\.|$)|#phoneClose/.test(e.key));
  expect(taps.length).toBeGreaterThanOrEqual(9);   // eight apps and CLOSE (NOTES and GLOW removed Nov 2, 2026)
  for (const t of taps) { expect(t.rect.w, t.key).toBeGreaterThanOrEqual(44); expect(t.rect.h, t.key).toBeGreaterThanOrEqual(44); }
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(save.v).toBe(2);
  expect(Object.keys(save).sort()).toEqual(Object.keys(baseSave).sort());
  expect(Object.keys(save.flags).sort()).toEqual(Object.keys(baseSave.flags).sort());
});

test('the issued KEEPER1 phone looks exactly as it does on the merge base', async ({ page }) => {
  await installSave(page.context(), readySave(), { quietDay: true });
  const bp = await basePage(page.context());
  await openHandset(bp, false);
  const baseHome = await snapshot(bp);
  const baseInk = await glyphInk(bp);
  await openApp(bp, 'sky');
  const baseNotes = await snapshot(bp);
  expect(bp.ppErrors, 'baseline page errors').toEqual([]);
  await bp.close();

  await openHandset(page, false);
  const strict = (base, cur) => diffs(base, cur.map((e) => e)).concat(
    base.flatMap((be, i) => Object.keys(be.style).filter((p) => be.style[p] !== cur[i].style[p]).map((p) => be.key + ' ' + p)));
  expect(strict(baseHome, await snapshot(page)), 'home').toEqual([]);
  expect(await glyphInk(page)).toEqual(baseInk);
  await openApp(page, 'sky');
  expect(strict(baseNotes, await snapshot(page)), 'sky').toEqual([]);
});
