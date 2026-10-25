/* Crash log, heartbeat fields, and the one-time crash note.
   The save stays pixelpets.save.v2 at v 2. The log is pp_crash_log only.
   A renderer crash is CDP Page.crash (Chromium). Ordinary reloads are page.reload.
   A page removed without pagehide is another Page.crash after the hidden mark is set,
   which is how a webview death leaves pp_alive behind. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, gotoGame } = require('./helpers');

const NOTE = 'The game closed unexpectedly. Tap Copy crash info in Settings.';
const HUD = ['#settingsBtn', '#gearFloat', '#dpad', '#tabs', '#envBadge', '#talkBtn', '#questBtn', '#phoneBtn', '#petStrip', '#joyRing', '#walkTip', '#mapBtn', '#repBtn', '#walkBagBtn', '#petFloat', '#colFloat'];

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

async function shown(page, sel) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el || (el.checkVisibility && !el.checkVisibility({ checkVisibilityCSS: true }))) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0 || r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) return null;
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, sel);
}

function watch(page) {
  page.ppErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') page.ppErrors.push(msg.text()); });
  page.on('pageerror', (err) => page.ppErrors.push(err.message));
}

async function boot(page) {
  watch(page);
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.v === 2, null, { timeout: 15000 });
}

async function install(context, mode) {
  const save = starterSave();
  if (mode === 'modern') save.settings.controls = 'modern';
  await installSave(context, save, { quietDay: true });
}

async function crashPage(page) {
  const context = page.context();
  // Page.crash kills that page's renderer. A context whose only page died closes with it,
  // so a blank page stays open and the next boot can still read localStorage.
  // Do not detach the CDP session: detach waits on the dead renderer and never returns.
  if (!context.pages().some((p) => p !== page && !p.isClosed())) {
    const keeper = await context.newPage();
    await keeper.goto('about:blank');
  }
  const client = await context.newCDPSession(page);
  const crashed = page.waitForEvent('crash', { timeout: 8000 });
  // The send often never resolves, because the renderer is already gone.
  client.send('Page.crash').catch(() => {});
  await crashed;
}

async function readyBeat(page) {
  await page.locator('#repBtn').click();
  await page.waitForTimeout(320);
  await page.locator('#repBack').click();
  await page.waitForFunction(() => {
    const d = JSON.parse(localStorage.getItem('pp_diag') || 'null');
    const a = JSON.parse(localStorage.getItem('pp_alive') || 'null');
    if (!d || !a || !Array.isArray(d.acts) || !d.acts.some((x) => /^repBtn@/.test(x))) return false;
    if (!a.wh || !a.ori || !Number.isFinite(a.dpr) || typeof a.swc !== 'boolean') return false;
    if (typeof a.sws !== 'string' || a.sws === 'unknown' || a.sws === '') return false;
    return Number.isFinite(a.tap);
  }, null, { timeout: 9000 });
}

async function noteLines(page) {
  return page.locator('#crashNoteText').evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getClientRects().length;
  });
}

async function assertNote(page) {
  const note = await shown(page, '#crashNote');
  expect(note).not.toBeNull();
  expect(await page.locator('#crashNoteText').textContent()).toBe(NOTE);
  expect(await noteLines(page)).toBeLessThanOrEqual(2);
  const ok = await shown(page, '#crashNoteOk');
  expect(ok).not.toBeNull();
  expect(ok.w).toBeGreaterThanOrEqual(44);
  expect(ok.h).toBeGreaterThanOrEqual(44);
  for (const sel of HUD) {
    const box = await shown(page, sel);
    if (!box) continue;
    expect(overlaps(note, box), sel).toBe(false);
  }
}

async function saveUntouched(page) {
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(sv.v).toBe(2);
  expect(sv.crashes).toBeUndefined();
  expect(JSON.stringify(sv).includes('pp_crash')).toBe(false);
  expect(JSON.stringify(sv).includes('crashNote')).toBe(false);
}

test('a renderer crash stays in the log, keeps its diag, and the note shows once', async ({ page }) => {
  test.setTimeout(90000);
  page.setDefaultTimeout(12000);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await install(page.context(), 'arcade');
  await boot(page);
  await readyBeat(page);
  expect(page.ppErrors).toEqual([]);
  const before = await page.evaluate(() => ({
    alive: JSON.parse(localStorage.getItem('pp_alive')),
    diag: JSON.parse(localStorage.getItem('pp_diag')),
    build: window.BUILD,
  }));
  expect(before.diag.wh).toBeTruthy();
  expect(before.diag.sws).toBeTruthy();
  await crashPage(page);

  const next = await page.context().newPage();
  await boot(next);
  expect(next.ppErrors).toEqual([]);
  await assertNote(next);
  const logged = await next.evaluate(() => JSON.parse(localStorage.getItem('pp_crash_log')));
  const row = logged.builds[before.build];
  expect(row.n).toBe(1);
  expect(row.seen).toBe(1);
  expect(row.first).toBe(row.last);
  expect(Number.isFinite(row.first)).toBe(true);
  const last = await next.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')));
  const entry = last[last.length - 1];
  expect(entry.reason).toBe('crash');
  expect(entry.wh).toBe(before.alive.wh);
  expect(entry.ori).toBe(before.alive.ori);
  expect(entry.dpr).toBe(before.alive.dpr);
  expect(entry.swc).toBe(before.alive.swc);
  expect(entry.sws).toBe(before.alive.sws);
  expect(entry.tap).toBe(before.alive.tap);
  await next.locator('#settingsBtn').click();
  await expect(next.locator('#ovSettings')).toBeVisible();
  const count = next.locator('#setCrashes');
  await expect(count).toBeVisible();
  await expect(count).toHaveText('Crashes on this build: 1');
  const fit = await count.evaluate((el) => ({ h: el.offsetHeight, s: el.scrollHeight, sw: el.scrollWidth, cw: el.clientWidth }));
  expect(fit.h).toBe(14);
  expect(fit.s).toBe(fit.h);
  expect(fit.sw).toBeLessThanOrEqual(fit.cw + 1);
  const copyBtn = next.locator('#setCrashCopy');
  await expect(copyBtn).toBeVisible();
  await copyBtn.scrollIntoViewIfNeeded();
  const copyBox = await shown(next, '#setCrashCopy');
  expect(copyBox).not.toBeNull();
  expect(copyBox.h).toBeGreaterThanOrEqual(44);
  expect(copyBox.w).toBeGreaterThanOrEqual(44);
  await copyBtn.click();
  await expect(next.locator('#toast')).toHaveText('Copied.');
  const payload = JSON.parse(await next.evaluate(() => navigator.clipboard.readText()));
  expect(payload.diagFrom).toBe('crash');
  expect(payload.diag.acts.some((a) => /^repBtn@/.test(a))).toBe(true);
  expect(payload.crashes).toBe(1);
  const mine = await next.evaluate(() => JSON.parse(localStorage.getItem('pp_diag')));
  expect(mine.acts.some((a) => /^repBtn@/.test(a))).toBe(false);
  await next.locator('#setClose').click();
  await next.locator('#crashNoteOk').click();
  expect(await shown(next, '#crashNote')).toBeNull();
  await saveUntouched(next);

  for (let i = 0; i < 5; i++) {
    await next.reload({ waitUntil: 'commit' });
    await next.waitForFunction(() => window.PixelPets && window.PixelPets.state, null, { timeout: 15000 });
    expect(await shown(next, '#crashNote')).toBeNull();
  }
  await next.evaluate(() => {
    localStorage.setItem('pp_reload', JSON.stringify({ reason: 'build', at: Date.now(), battleOn: false, build: String(window.BUILD || '') }));
  });
  await next.reload({ waitUntil: 'commit' });
  await next.waitForFunction(() => window.PixelPets && window.PixelPets.state, null, { timeout: 15000 });
  expect(await shown(next, '#crashNote')).toBeNull();
  let reasons = await next.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')).map((e) => e.reason));
  expect(reasons[reasons.length - 1]).toBe('build');
  expect(reasons).toContain('unknown');

  expect(next.ppErrors).toEqual([]);
  await next.evaluate(() => {
    localStorage.setItem('pp_hidden', JSON.stringify({ at: Date.now() }));
    localStorage.removeItem('pp_reload');
  });
  await crashPage(next);
  const fresh = await next.context().newPage();
  await boot(fresh);
  expect(fresh.ppErrors).toEqual([]);
  expect(await shown(fresh, '#crashNote')).toBeNull();
  const after = await fresh.evaluate(() => ({
    log: JSON.parse(localStorage.getItem('pp_crash_log')),
    last: JSON.parse(localStorage.getItem('pp_reload_last')),
    build: window.BUILD,
  }));
  expect(after.last[after.last.length - 1].reason).toBe('background');
  expect(after.last.some((e) => e.reason === 'crash')).toBe(false);
  expect(after.last.length).toBeLessThanOrEqual(5);
  const kept = after.log.builds[after.build];
  expect(kept.n).toBe(1);
  expect(kept.first).toBe(row.first);
  expect(kept.seen).toBe(1);
  await fresh.locator('#settingsBtn').click();
  await expect(fresh.locator('#setCrashes')).toHaveText('Crashes on this build: 1');
  await expect(fresh.locator('#setCrashCopy')).toBeVisible();
  await fresh.locator('#setCrashCopy').click();
  await expect(fresh.locator('#toast')).toHaveText('Copied.');
  const again = JSON.parse(await fresh.evaluate(() => navigator.clipboard.readText()));
  expect(again.diagFrom).toBe('crash');
  expect(again.diag.acts.some((a) => /^repBtn@/.test(a))).toBe(true);
  await saveUntouched(fresh);
});

test('the crash note shows once in modern controls and stays off the HUD', async ({ page }) => {
  test.setTimeout(60000);
  page.setDefaultTimeout(12000);
  await install(page.context(), 'modern');
  await boot(page);
  await page.waitForFunction(() => document.body.classList.contains('ctl-modern'), null, { timeout: 15000 });
  expect(page.ppErrors).toEqual([]);
  await crashPage(page);
  const next = await page.context().newPage();
  await boot(next);
  expect(next.ppErrors).toEqual([]);
  await expect(next.locator('body')).toHaveClass(/ctl-modern/);
  await assertNote(next);
  await next.locator('#crashNoteOk').click();
  expect(await shown(next, '#crashNote')).toBeNull();
  await next.reload({ waitUntil: 'commit' });
  await next.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  expect(await shown(next, '#crashNote')).toBeNull();
  const log = await next.evaluate(() => JSON.parse(localStorage.getItem('pp_crash_log')));
  const build = await next.evaluate(() => window.BUILD);
  expect(log.builds[build].n).toBe(1);
  expect(log.builds[build].seen).toBe(1);
  await saveUntouched(next);
  expect(next.ppErrors).toEqual([]);
});

test('a planned reload never shows the note and does not invent a crash', async ({ page }) => {
  await install(page.context(), 'arcade');
  await boot(page);
  expect(await shown(page, '#crashNote')).toBeNull();
  await page.evaluate(() => {
    localStorage.setItem('pp_reload', JSON.stringify({ reason: 'build', at: Date.now(), battleOn: false, build: String(window.BUILD || '') }));
  });
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  expect(await shown(page, '#crashNote')).toBeNull();
  const reason = await page.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')).pop().reason);
  expect(reason).toBe('build');
  expect(await page.evaluate(() => localStorage.getItem('pp_crash_log'))).toBeNull();
  await saveUntouched(page);
  expect(page.ppErrors).toEqual([]);
});

test('the crash log alone shows the count and the copy button', async ({ page }) => {
  await install(page.context(), 'arcade');
  await boot(page);
  await page.evaluate(() => {
    const b = window.BUILD;
    localStorage.setItem('pp_crash_log', JSON.stringify({ builds: { [b]: { n: 2, first: 10, last: 20, seen: 2 } } }));
    localStorage.setItem('pp_reload_last', JSON.stringify([{ reason: 'unknown', at: Date.now(), battleOn: false, build: b }]));
  });
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#ovSettings')).toBeVisible();
  const line = page.locator('#setCrashes');
  await expect(line).toBeVisible();
  await expect(line).toHaveText('Crashes on this build: 2');
  const fit = await line.evaluate((el) => ({ h: el.offsetHeight, s: el.scrollHeight }));
  expect(fit.h).toBe(14);
  expect(fit.s).toBe(fit.h);
  const btn = page.locator('#setCrashCopy');
  await expect(btn).toBeVisible();
  await btn.scrollIntoViewIfNeeded();
  const box = await shown(page, '#setCrashCopy');
  expect(box).not.toBeNull();
  expect(box.h).toBeGreaterThanOrEqual(44);
  expect(box.w).toBeGreaterThanOrEqual(44);
  expect(await shown(page, '#crashNote')).toBeNull();
  await saveUntouched(page);
  expect(page.ppErrors).toEqual([]);
});

test('fitAll does not clear the map canvas when the size stays the same', async ({ page }) => {
  await install(page.context(), 'arcade');
  await boot(page);
  await page.waitForFunction(() => {
    const c = document.querySelector('#mapCanvas');
    return c && c.width > 10 && c.height > 10;
  });
  const kept = await page.evaluate(() => {
    const c = document.querySelector('#mapCanvas');
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    g.fillStyle = '#ff00ff';
    g.fillRect(0, 0, 1, 1);
    window.dispatchEvent(new Event('resize'));
    const px = g.getImageData(0, 0, 1, 1).data;
    return { same: c.width === w && c.height === h, r: px[0], a: px[3] };
  });
  expect(kept.same).toBe(true);
  expect(kept.r).toBe(255);
  expect(kept.a).toBe(255);
  await saveUntouched(page);
  expect(page.ppErrors).toEqual([]);
});
