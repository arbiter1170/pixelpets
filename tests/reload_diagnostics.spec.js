/* Reload screen name and the script-error log. The log is pp_errors, never the save.
   The full list is only on a ?debug=1 page. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

async function boot(page, search) {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, search || '');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
}

test('a window error is logged outside the save and Settings shows one line', async ({ page }) => {
  await boot(page);
  const saveBefore = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#setError')).toBeHidden();
  await page.locator('#setClose').click();
  await page.locator('#repBtn').click();
  await expect(page.locator('#ovRep')).toBeVisible();
  await page.evaluate(() => {
    const err = new Error('diag boom');
    window.onerror('diag boom', 'diag.js', 1, 1, err);
  });
  const logged = await page.evaluate(() => JSON.parse(localStorage.getItem('pp_errors')));
  expect(logged).toHaveLength(1);
  expect(logged[0].message).toBe('diag boom');
  expect(logged[0].build).toBe(await page.evaluate(() => window.BUILD));
  expect(logged[0].screen).toBe('People');
  expect(String(logged[0].stack)).toContain('diag boom');
  expect(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'))).toBe(saveBefore);
  const sv = JSON.parse(saveBefore);
  expect(sv.v).toBe(2);
  expect(Object.keys(sv).some((k) => /error/i.test(k))).toBe(false);
  await page.evaluate(() => {
    localStorage.removeItem('pp_errors');
    for (let i = 0; i < 6; i++) window.onerror('mark ' + i, 'diag.js', 1, 1, new Error('mark ' + i));
  });
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('pp_errors')));
  expect(kept).toHaveLength(5);
  expect(kept[0].message).toBe('mark 1');
  expect(kept[4].message).toBe('mark 5');
  expect(await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'))).toBe(saveBefore);
  await page.locator('#repBack').click();
  await page.locator('#settingsBtn').click();
  const line = page.locator('#setError');
  await expect(line).toBeVisible();
  await expect(line).toHaveText(/^Last error: \d{1,2}:\d{2}\s?[AP]M, on People$/);
  await expect(line).not.toContainText('mark');
  const fit = await line.evaluate((el) => ({
    h: el.offsetHeight,
    s: el.scrollHeight,
    sw: el.scrollWidth,
    cw: el.clientWidth,
  }));
  expect(fit.h).toBe(14);
  expect(fit.s).toBe(fit.h);
  expect(fit.sw).toBeLessThanOrEqual(fit.cw + 1);
  const taps = await page.evaluate(() => [...document.querySelectorAll('#ovSettings button')].filter((b) => b.offsetParent).map((b) => {
    const r = b.getBoundingClientRect();
    return { id: b.id || b.textContent.trim(), w: r.width, h: r.height };
  }));
  expect(taps.length).toBeGreaterThan(5);
  for (const t of taps) {
    expect(t.h, t.id).toBeGreaterThanOrEqual(44);
    expect(t.w, t.id).toBeGreaterThanOrEqual(44);
  }
  const inner = await page.evaluate(() => {
    const el = document.querySelector('.settings-inner');
    return el.scrollWidth <= el.clientWidth + 1;
  });
  expect(inner).toBe(true);
});

test('the full error list shows only with ?debug=1', async ({ page }) => {
  await page.addInitScript(() => { sessionStorage.setItem('pixelpets.debug', '1'); });
  await boot(page);
  await page.evaluate(() => { window.onerror('hidden list', 'diag.js', 1, 1, new Error('hidden list')); });
  await page.locator('#dbgTag').click();
  await expect(page.locator('#ovDebug')).toBeVisible();
  await expect(page.locator('#dbgErrors')).toBeHidden();
  await expect(page.locator('#dbgErrorList li')).toHaveCount(0);
  await expect(page.locator('#dbgReloads')).toBeHidden();
  await expect(page.locator('#dbgReloadList li')).toHaveCount(0);
  await page.locator('#dbgClose').click();
  const fresh = await page.context().newPage();
  fresh.ppErrors = [];
  fresh.on('pageerror', (err) => fresh.ppErrors.push(err.message));
  await gotoGame(fresh, '?debug=1');
  await fresh.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await fresh.evaluate(() => {
    localStorage.removeItem('pp_errors');
    for (let i = 0; i < 5; i++) window.onerror('listed ' + i, 'diag.js', 1, 1, new Error('listed ' + i));
  });
  await fresh.locator('#dbgTag').click();
  await expect(fresh.locator('#dbgErrors')).toBeVisible();
  await expect(fresh.locator('#dbgErrorList li')).toHaveCount(5);
  await expect(fresh.locator('#dbgErrorList')).toContainText('listed 0');
  await expect(fresh.locator('#dbgErrorList')).toContainText('listed 4');
  await fresh.locator('#dbgClose').click();
  await fresh.evaluate(() => {
    const rows = [];
    for (let i = 0; i < 5; i++) rows.push({ reason: 'crash', at: i + 1, battleOn: false, screen: 'People', nav: 'navigate', standalone: false, sw: false, gap: 1000 + i, hid: i === 4, live: 10 + i, portraits: i, made: i, phase: 'hit' });
    localStorage.setItem('pp_reload_last', JSON.stringify(rows));
  });
  await fresh.locator('#dbgTag').click();
  await expect(fresh.locator('#dbgReloads')).toBeVisible();
  await expect(fresh.locator('#dbgReloadList li')).toHaveCount(5);
  await expect(fresh.locator('#dbgReloadList')).toContainText('nav navigate');
  await expect(fresh.locator('#dbgReloadList')).toContainText('hid yes');
  await expect(fresh.locator('#dbgReloadList')).toContainText('hid no');
  await expect(fresh.locator('#dbgReloadList')).toContainText('live 14');
  await expect(fresh.locator('#dbgReloadList')).toContainText('portraits 4');
  await expect(fresh.locator('#dbgReloadList')).toContainText('phase hit');
  await expect(fresh.locator('#dbgReloadList')).toContainText('standalone no');
  await fresh.locator('#dbgClose').click();
  await fresh.locator('#settingsBtn').click();
  await expect(fresh.locator('#setError')).toHaveText(/^Last error: \d{1,2}:\d{2}\s?[AP]M/);
  await expect(fresh.locator('#setError')).not.toContainText('listed 0');
  await expect(fresh.locator('#setReload')).toHaveText(/^Last reload: crash\?, /);
  await expect(fresh.locator('#setReload')).not.toContainText('navigate');
  await expect(fresh.locator('#setReload')).not.toContainText('standalone');
  await expect(fresh.locator('#setReload')).not.toContainText('home-screen');
  await fresh.locator('#setClose').click();
  await fresh.evaluate(() => { PixelPets.showTab('walk'); return PixelPets.forceBattle('tide/0', 3); });
  await fresh.waitForFunction(() => {
    const a = JSON.parse(localStorage.getItem('pp_alive') || 'null');
    return !!(a && a.battleOn === true && typeof a.phase === 'string' && a.phase);
  });
  const phase = await fresh.evaluate(() => JSON.parse(localStorage.getItem('pp_alive')).phase);
  expect(['hit', 'end', 'busy', 'acts', 'fight', 'bef']).toContain(phase);
  const beat = await fresh.evaluate(() => JSON.parse(localStorage.getItem('pp_alive')));
  expect(Number.isFinite(beat.live)).toBe(true);
  expect(Number.isFinite(beat.portraits)).toBe(true);
  expect(Number.isFinite(beat.made)).toBe(true);
  expect(fresh.ppErrors).toEqual([]);
});

test('an alive boot with no crumb records nav and standalone and says on People', async ({ page }) => {
  await boot(page);
  await page.locator('#repBtn').click();
  await page.waitForFunction(() => {
    const a = JSON.parse(localStorage.getItem('pp_alive') || 'null');
    return !!(a && a.screen === 'People' && a.battleOn === false && Number.isFinite(a.live) && Number.isFinite(a.portraits) && Number.isFinite(a.made));
  });
  const alive = await page.evaluate(() => localStorage.getItem('pp_alive'));
  await page.close();
  const fresh = await page.context().newPage();
  fresh.ppErrors = [];
  fresh.on('pageerror', (err) => fresh.ppErrors.push(err.message));
  await fresh.addInitScript((raw) => {
    localStorage.setItem('pp_alive', raw);
    localStorage.removeItem('pp_reload');
    localStorage.removeItem('pp_hidden');
  }, alive);
  await gotoGame(fresh);
  await fresh.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  const last = await fresh.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')));
  const entry = last[last.length - 1];
  expect(entry).toMatchObject({ reason: 'crash', battleOn: false, screen: 'People', hid: false });
  expect(['navigate', 'reload', 'back_forward', 'prerender']).toContain(entry.nav);
  expect(typeof entry.standalone).toBe('boolean');
  expect(typeof entry.sw).toBe('boolean');
  expect(Number.isFinite(entry.gap)).toBe(true);
  expect(Number.isFinite(entry.live)).toBe(true);
  expect(Number.isFinite(entry.portraits)).toBe(true);
  expect(Number.isFinite(entry.made)).toBe(true);
  const discarded = await fresh.evaluate(() => 'wasDiscarded' in document);
  if (discarded) expect(typeof entry.wasDiscarded).toBe('boolean');
  await fresh.locator('#settingsBtn').click();
  const line = fresh.locator('#setReload');
  await expect(line).toHaveText(/^Last reload: crash\?, \d{1,2}:\d{2}\s?[AP]M, on People$/);
  await expect(line).not.toContainText('home-screen');
  await expect(line).not.toContainText('navigate');
  const fit = await line.evaluate((el) => ({ h: el.offsetHeight, s: el.scrollHeight, sw: el.scrollWidth, cw: el.clientWidth }));
  expect(fit.h).toBe(14);
  expect(fit.s).toBe(fit.h);
  expect(fit.sw).toBeLessThanOrEqual(fit.cw + 1);
  const sv = await fresh.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  expect(JSON.parse(sv).v).toBe(2);
  expect(sv.includes('"portraits"')).toBe(false);
  expect(await fresh.evaluate(() => localStorage.getItem('pp_hidden'))).toBeNull();
  expect(fresh.ppErrors).toEqual([]);
});

test('an alive boot that was hidden is a background kill, not crash?', async ({ page }) => {
  await boot(page);
  await page.close();
  const fresh = await page.context().newPage();
  fresh.ppErrors = [];
  fresh.on('pageerror', (err) => fresh.ppErrors.push(err.message));
  await fresh.addInitScript(() => {
    localStorage.setItem('pp_alive', JSON.stringify({
      at: Date.now() - 8000, battleOn: false, build: 't', screen: 'People', phase: 'end', live: 4813, portraits: 70, made: 12,
    }));
    localStorage.setItem('pp_hidden', JSON.stringify({ at: Date.now() - 2000 }));
    localStorage.removeItem('pp_reload');
  });
  await gotoGame(fresh);
  await fresh.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  const last = await fresh.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')));
  const entry = last[last.length - 1];
  expect(entry.reason).toBe('background');
  expect(entry.reason).not.toBe('crash');
  expect(entry).toMatchObject({ battleOn: false, screen: 'People', phase: 'end', live: 4813, portraits: 70, made: 12, hid: true });
  expect(entry.hidAge).toBeGreaterThanOrEqual(0);
  expect(entry.gap).toBeGreaterThanOrEqual(0);
  expect(['navigate', 'reload', 'back_forward', 'prerender']).toContain(entry.nav);
  expect(typeof entry.standalone).toBe('boolean');
  expect(typeof entry.sw).toBe('boolean');
  const discarded = await fresh.evaluate(() => 'wasDiscarded' in document);
  if (discarded) expect(typeof entry.wasDiscarded).toBe('boolean');
  await fresh.locator('#settingsBtn').click();
  const line = fresh.locator('#setReload');
  await expect(line).toHaveText(/^Last reload: background kill, \d{1,2}:\d{2}\s?[AP]M, on People$/);
  await expect(line).not.toContainText('crash?');
  await expect(line).not.toContainText('navigate');
  await expect(line).not.toContainText('home-screen');
  const fit = await line.evaluate((el) => ({ h: el.offsetHeight, s: el.scrollHeight, sw: el.scrollWidth, cw: el.clientWidth }));
  expect(fit.h).toBe(14);
  expect(fit.s).toBe(fit.h);
  expect(fit.sw).toBeLessThanOrEqual(fit.cw + 1);
  const sv = await fresh.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  expect(JSON.parse(sv).v).toBe(2);
  expect(sv.includes('"live"')).toBe(false);
  expect(await fresh.evaluate(() => localStorage.getItem('pp_hidden'))).toBeNull();
  expect(fresh.ppErrors).toEqual([]);
});

// Hotfix (Oct 23): going hidden keeps the last alive beat, so a page killed in the background (no pagehide) reads as
// 'background' on the next boot instead of leaving no crumb at all. The kill is simulated by carrying the two marks over.
test('going hidden keeps the alive mark, so a kill while hidden reads as background', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => { const a = JSON.parse(localStorage.getItem('pp_alive') || 'null'); return !!(a && a.screen === 'Walk'); }, null, { timeout: 15000 });
  const marks = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    return { alive: localStorage.getItem('pp_alive'), hidden: localStorage.getItem('pp_hidden') };
  });
  expect(marks.alive, 'alive mark kept while hidden').not.toBeNull();
  expect(marks.hidden).not.toBeNull();
  await page.close();
  const fresh = await page.context().newPage();
  fresh.ppErrors = [];
  fresh.on('pageerror', (err) => fresh.ppErrors.push(err.message));
  await fresh.addInitScript((m) => {
    localStorage.setItem('pp_alive', m.alive);
    localStorage.setItem('pp_hidden', m.hidden);
    localStorage.removeItem('pp_reload');
  }, marks);
  await gotoGame(fresh);
  await fresh.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  const last = await fresh.evaluate(() => JSON.parse(localStorage.getItem('pp_reload_last')));
  expect(last[last.length - 1]).toMatchObject({ reason: 'background', screen: 'Walk', hid: true });
  expect(last[last.length - 1].hidAge).toBeGreaterThanOrEqual(0);
  expect(JSON.parse(await fresh.evaluate(() => localStorage.getItem('pixelpets.save.v2'))).v).toBe(2);
  expect(fresh.ppErrors).toEqual([]);
});
