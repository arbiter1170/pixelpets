/* Outside UX review (Oct 15): header acorns, progressbar semantics, canvas labels, and the debug panel kept out of the player DOM. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, boxesOverlap } = require('./helpers');

trackErrors(test, expect);

async function boot(page, save, q) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
}
const rect = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e || !e.offsetWidth) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right }; }, sel);

for (const mode of ['arcade', 'modern']) {
  test(`header acorns sit next to Lv, update live and fit without overlaps (${mode})`, async ({ page }) => {
    const s = starterSave(); s.money = 99999; s.party[0].nick = 'Longnamed1'; s.settings.controls = mode;
    await boot(page, s, '?debug=1');
    await page.evaluate(() => PixelPets.showTab('pet'));   // modern hides the header on the walk screen only (NAV_MODERN)
    await expect(page.locator('#hdrAcornN')).toHaveText('99999');
    await expect(page.locator('#hdrAcorns')).toHaveAttribute('aria-label', '99999 Acorns');
    const vw = page.viewportSize().width;
    const r = { a: await rect(page, '#hdrAcorns'), lv: await rect(page, '#top .lv'), gear: await rect(page, '#settingsBtn'), name: await rect(page, '#hdrName'), tag: await rect(page, '#dbgTag'), env: await rect(page, '#envBadge') };
    expect(r.a).not.toBeNull();
    expect(r.a.x).toBeGreaterThanOrEqual(0); expect(r.a.right).toBeLessThanOrEqual(vw);
    expect(r.a.right).toBeLessThanOrEqual(r.lv.x + 1);            // left of the Lv badge
    for (const k of ['lv', 'gear', 'name', 'tag', 'env']) if (r[k]) expect(boxesOverlap(r.a, r[k]), k).toBe(false);
    const clip = await page.evaluate(() => { const b = document.querySelector('#hdrAcornN'); return b.scrollWidth > b.clientWidth + 1; });
    expect(clip).toBe(false);
    await page.evaluate(() => PixelPets.setMoney(7));
    await expect(page.locator('#hdrAcornN')).toHaveText('7');
    await expect(page.locator('#hdrAcorns')).toHaveAttribute('aria-label', '7 Acorns');
    await page.evaluate(() => PixelPets.setMoney(1));
    await expect(page.locator('#hdrAcorns')).toHaveAttribute('aria-label', '1 Acorn');
    if (mode === 'arcade') {                                         // the walk screen keeps the header in arcade; the env badge sits below it
      await page.evaluate(() => PixelPets.showTab('walk'));
      const a = await rect(page, '#hdrAcorns'), env = await rect(page, '#envBadge');
      expect(a).not.toBeNull(); if (env) expect(boxesOverlap(a, env)).toBe(false);
    }
  });
}

test('FOOD / JOY / NRG / GROW / HP bars are progressbars that follow the values', async ({ page }) => {
  await boot(page, starterSave(), '?debug=1');
  await page.evaluate(() => PixelPets.showTab('pet'));
  const read = () => page.evaluate(() => Object.fromEntries(['barHunger', 'barHappy', 'barEnergy', 'barXp', 'wBarEnergy'].map(id => { const b = document.getElementById(id).parentNode;
    return [id, [b.getAttribute('role'), b.getAttribute('aria-valuemin'), b.getAttribute('aria-valuemax'), b.getAttribute('aria-valuenow'), b.getAttribute('aria-label')]]; })));
  const a = await read();
  expect(a.barHunger).toEqual(['progressbar', '0', '100', String(Math.round(await page.evaluate(() => PixelPets.state.party[0].hunger))), 'Food']);
  expect(a.barHappy[4]).toBe('Joy'); expect(a.barEnergy[4]).toBe('Energy'); expect(a.barXp[4]).toBe('Growth'); expect(a.wBarEnergy[4]).toBe('Energy');
  for (const v of Object.values(a)) expect(v[0]).toBe('progressbar');
  await page.evaluate(() => { PixelPets.state.party[0].hunger = 33; });
  await expect.poll(async () => (await read()).barHunger[3]).toBe('33');
  // HP: the encounter cards and the stats card
  expect(await page.evaluate(() => PixelPets.forceBattle('byte/0', 5))).toBe(true);
  await expect(page.locator('#ovBattle')).toBeVisible();
  const hp = await page.evaluate(() => ['btFoeHp', 'btMeHp'].map(id => { const b = document.getElementById(id).parentNode; return [b.getAttribute('role'), b.getAttribute('aria-valuemin'), b.getAttribute('aria-valuemax'), b.getAttribute('aria-valuenow'), b.getAttribute('aria-label')]; }));
  expect(hp[0][0]).toBe('progressbar'); expect(hp[0][4]).toBe('Bitlet HP'); expect(+hp[0][3]).toBe(+hp[0][2]);
  expect(hp[1][0]).toBe('progressbar'); expect(hp[1][4]).toBe('Pipkit HP');
});

test('the overworld, care and encounter canvases describe what they show', async ({ page }) => {
  await boot(page, starterSave(), '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#mapCanvas')).toHaveAttribute('role', 'img');
  await expect(page.locator('#mapCanvas')).toHaveAttribute('aria-label', 'Hearthmoor. Pipkit walks with you.');
  await page.evaluate(() => PixelPets.goto('route1', 4, 8, 'right'));
  await expect(page.locator('#mapCanvas')).toHaveAttribute('aria-label', /^Route 1\. Pipkit walks with you\.$/);
  await expect(page.locator('#petCanvas')).toHaveAttribute('aria-label', /^Your partner Pipkit, Lv 5\. Food \d+, joy \d+, energy \d+\.$/);
  await page.evaluate(() => PixelPets.forceBattle('byte/0', 5));
  await expect(page.locator('#battleCanvas')).toHaveAttribute('aria-label', /^Wild Bitlet, Lv 5, HP (\d+) of \1\. Pipkit, HP \d+ of \d+\.$/);
});

test('the debug panel is not in the player DOM; it appears only in a debug session and leaves when debug is turned off', async ({ page }) => {
  await boot(page, starterSave());
  const plain = await page.evaluate(() => ({ ov: !!document.querySelector('#ovDebug'), agent: document.body.innerHTML.includes('Agent tools'), ids: document.querySelectorAll('[id^="dbg"]').length, tag: document.querySelector('#dbgTag').hidden }));
  expect(plain.ov).toBe(false); expect(plain.agent).toBe(false); expect(plain.tag).toBe(true);
  expect(plain.ids).toBeLessThanOrEqual(5);   // only the Settings gate (gate, password, unlock, message) and the hidden DBG tag
  const html = await (await page.request.get('/index.html')).text();
  expect(html).not.toContain('Agent tools'); expect(html).not.toContain('id="ovDebug"');
  // a debug session builds it on demand
  await boot(page, starterSave(), '?debug=1');
  expect(await page.evaluate(() => !!document.querySelector('#ovDebug'))).toBe(false);   // not until it opens
  await page.locator('#dbgTag').click();
  await expect(page.locator('#ovDebug')).toBeVisible();
  await expect(page.locator('#dbgAgent summary')).toHaveText('Agent tools');
  await page.locator('#dbgLock').click();
  await expect.poll(() => page.evaluate(() => !!document.querySelector('#ovDebug'))).toBe(false);
  expect(await page.evaluate(() => document.querySelector('#dbgTag').hidden)).toBe(true);
});

test('modern walk acorn chip: badge row, y 6, 44 tall, left of the gear, read-only, badge clamps first, hides with the badge', async ({ page }) => {
  const s = starterSave(); s.money = 99999; s.settings.controls = 'modern';
  s.world = { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' };
  await boot(page, s, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#fcAcornN')).toHaveText('99999');
  await expect(page.locator('#fcAcorns')).toHaveAttribute('aria-label', '99999 Acorns');
  await page.waitForTimeout(300);
  const vw = page.viewportSize().width;
  const c = await rect(page, '#fcAcorns'), gear = await rect(page, '#gearFloat'), env = await rect(page, '#envBadge');
  expect(Math.round(c.y)).toBe(6); expect(Math.round(c.height)).toBe(44);
  expect(c.right).toBeLessThanOrEqual(gear.x + 0.5); expect(gear.x - c.right).toBeLessThanOrEqual(8);   // immediately left of the gear
  expect(c.right).toBeLessThanOrEqual(vw);
  expect(boxesOverlap(c, env)).toBe(false);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#fcAcorns')).pointerEvents)).toBe('none');
  expect(await page.evaluate(() => document.querySelector('#fcAcorns').tagName)).toBe('DIV');
  const icon = await page.evaluate(() => { const b = document.querySelector('#fcAcornN'), h = document.querySelector('#hdrAcornN'); return [getComputedStyle(b).color === getComputedStyle(h).color, getComputedStyle(b).fontSize === getComputedStyle(h).fontSize, b.scrollWidth <= b.clientWidth + 1]; });
  expect(icon).toEqual([true, true, true]);
  // a long area name: the badge text clamps, the chip stays whole
  await page.evaluate(() => { document.querySelector('#envText').textContent = 'The Very Long Glimmerwell Orchard Gate Road'; });
  await page.waitForTimeout(300);
  const c2 = await rect(page, '#fcAcorns'), env2 = await rect(page, '#envBadge');
  expect(boxesOverlap(c2, env2)).toBe(false); expect(Math.round(c2.width)).toBe(Math.round(c.width));
  // live
  await page.evaluate(() => PixelPets.setMoney(7)); await expect(page.locator('#fcAcornN')).toHaveText('7');
  // dialog: fades with the badge
  await page.evaluate(() => PixelPets.runScene('phone_grant'));
  await page.waitForTimeout(400);
  const op = await page.evaluate(() => [getComputedStyle(document.querySelector('#fcAcorns')).opacity, getComputedStyle(document.querySelector('#fcTop')).opacity]);
  expect(op).toEqual(['0', '0']);
});

test('modern walk acorn chip hides in battle like the badge', async ({ page }) => {
  const s = starterSave(); s.settings.controls = 'modern';
  await boot(page, s, '?debug=1');
  await page.evaluate(() => PixelPets.forceEncounter());
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on, null, { timeout: 8000 });
  await page.waitForTimeout(400);
  const vis = await page.evaluate(() => { const v = sel => { const e = document.querySelector(sel), r = e.getBoundingClientRect(), top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!(e.offsetWidth && getComputedStyle(e).opacity !== '0' && (top === e || e.contains(top))); }; return [v('#envBadge'), v('#fcAcorns')]; });
  expect(vis).toEqual([false, false]);
});
