// BATTLE_ACORNS (D811-D817): a wild win pays clamp(2 x foe level, 4, 40) Acorns; a soft cap of 60 a day in S.care.wildAcorns
// (over it a quarter, at least 1). Befriend, wandered off and RUN pay nothing; holder payouts are unchanged.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function baseSave(extra) {
  const s = starterSave();   // player Tester
  s.settings.textSpeed = 'fast';
  s.money = 100;
  return Object.assign(s, extra || {});
}

async function boot(page, extra) {
  await installSave(page.context(), baseSave(extra), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

// Today's wild Acorns, seeded on today's care record.
function seedToday(page, n) {
  return page.evaluate(n => {
    const S = PixelPets.state, day = PixelPets.wildAcorns.day;
    S.care = Object.assign({ steps: 0, finds: 0, stepBond: 0, battleBond: 0, firstCare: false }, S.care && S.care.d === day ? S.care : {}, { d: day, wildAcorns: n });
    return PixelPets.wildAcorns.today;
  }, n);
}

// Every line #btMsg shows, in order.
function watchLines(page) {
  return page.evaluate(() => {
    window.__baLines = [];
    const m = document.querySelector('#btMsg');
    new MutationObserver(() => { const t = m.textContent.trim(); if (t && window.__baLines[window.__baLines.length - 1] !== t) window.__baLines.push(t); })
      .observe(m, { childList: true, characterData: true, subtree: true });
  });
}

async function openWild(page, form, level) {
  const ok = await page.evaluate(([f, l]) => {
    PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.showTab('walk'); PixelPets.healTeam();
    return PixelPets.forceBattle(f, l);
  }, [form, level]);
  expect(ok).toBeTruthy();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
  await watchLines(page);
}

async function closeEnd(page) {
  await page.evaluate(() => { PixelPets.battle.textMs = 0; });
  await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.panel === 'end', null, { timeout: 30000 });
  let title = null;
  if (await page.evaluate(() => PixelPets.battle.on)) {
    title = await page.evaluate(() => document.querySelector('#btEndTitle').textContent);
    await page.click('#btOk');
  }
  await page.waitForFunction(() => !PixelPets.battle.on, null, { timeout: 15000 });
  return title;
}

// Win a wild battle at the given level. Returns money and today's count before and after, the lines and the end title.
async function winWild(page, form, level) {
  const before = await page.evaluate(() => ({ money: PixelPets.state.money | 0, today: PixelPets.wildAcorns.today }));
  await openWild(page, form, level);
  await page.evaluate(() => PixelPets.winBattle());
  const title = await closeEnd(page);
  const after = await page.evaluate(() => ({ money: PixelPets.state.money | 0, today: PixelPets.wildAcorns.today, lines: window.__baLines.slice() }));
  return { paid: after.money - before.money, today: after.today, lines: after.lines, title };
}

const gotLines = lines => lines.filter(l => /got \d+ Acorns?!/.test(l));

test('T1 D811: a wild win pays 2 x level, floored at 4 and capped at 40, with one holder-style line', async ({ page }) => {
  await boot(page);
  await seedToday(page, 0);
  const r = await winWild(page, 'beetle/0', 5);
  expect(r.paid).toBe(10);
  expect(r.today).toBe(10);
  expect(gotLines(r.lines)).toEqual(['Tester got 10 Acorns!']);
  expect(r.title).toBe('You won!');
  await seedToday(page, 0);
  expect((await winWild(page, 'beetle/0', 25)).paid).toBe(40);
  await seedToday(page, 0);
  expect((await winWild(page, 'beetle/0', 1)).paid).toBe(4);
});

test('T2 D811: crossing the 60 a day soft cap pays a quarter, at least 1, and says "1 Acorn"', async ({ page }) => {
  await boot(page);
  await seedToday(page, 58);
  let r = await winWild(page, 'beetle/0', 5);
  expect([r.paid, r.today]).toEqual([10, 68]);
  r = await winWild(page, 'beetle/0', 5);
  expect([r.paid, r.today]).toEqual([2, 70]);
  r = await winWild(page, 'beetle/0', 2);
  expect(r.paid).toBe(1);
  expect(gotLines(r.lines)).toEqual(['Tester got 1 Acorn!']);
  expect(r.lines.some(l => /1 Acorns/.test(l))).toBe(false);
});

test('T3 D812: befriend, RUN and a loss pay nothing', async ({ page }) => {
  await boot(page);
  await seedToday(page, 0);
  const snap = () => page.evaluate(() => ({ money: PixelPets.state.money | 0, today: PixelPets.wildAcorns.today }));
  const start = await snap();
  // RUN.
  await openWild(page, 'beetle/0', 5);
  await page.locator('[data-bact="run"]').click();
  await closeEnd(page);
  expect(await snap()).toEqual(start);
  // A loss.
  await openWild(page, 'beetle/0', 5);
  await page.evaluate(() => PixelPets.loseBattle());
  await closeEnd(page);
  expect(await snap()).toEqual(start);
  // Befriend last (the new Walkling's card follows it). Any mark lands.
  await page.evaluate(() => PixelPets.healTeam());
  await openWild(page, 'beetle/0', 5);
  await page.locator('[data-bact="befriend"]').click();
  await page.waitForFunction(() => PixelPets.battle.panel === 'bef');
  await page.evaluate(() => { PixelPets.enc.zone = [0, 1]; PixelPets.enc.mark = 0.5; PixelPets.enc.open = true; });
  await page.locator('#encGo').click();
  await closeEnd(page);
  expect(await snap()).toEqual(start);
  expect(gotLines(await page.evaluate(() => window.__baLines))).toEqual([]);
});

test('T4 D815: a new day resets the count; bad saved values load as 0; the save stays v2 with no new top-level field', async ({ page }) => {
  await boot(page, { care: { d: '2026-10-01', steps: 0, finds: 0, stepBond: 0, battleBond: 0, firstCare: false, wildAcorns: 70 } });
  expect(await page.evaluate(() => PixelPets.wildAcorns.today)).toBe(0);
  await page.evaluate(() => PixelPets.setFlag('story.tutorial_done', true));   // already true: writes a normalised save
  const keysBefore = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  const r = await winWild(page, 'beetle/0', 5);
  expect([r.paid, r.today]).toEqual([10, 10]);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.care.wildAcorns).toBe(10);
  expect(Object.keys(saved).sort()).toEqual(keysBefore);
  // normalizeV2 on bad values: 'x' and -3 load as 0, 2.7 as 2.
  const norm = await page.evaluate(() => ['x', -3, 2.7].map(v => {
    const s = JSON.parse(localStorage.getItem('pixelpets.save.v2')); s.care.wildAcorns = v;
    return PPSave.normalizeV2(s).care.wildAcorns;
  }));
  expect(norm).toEqual([0, 0, 2]);
});

test('T5 D814: holder payouts are unchanged and do not count toward the wild day', async ({ page }) => {
  await boot(page);
  await seedToday(page, 0);
  const before = await page.evaluate(() => PixelPets.state.money | 0);
  await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0; PixelPets.healTeam(); return PixelPets.forceTrainer('route1_pia'); });
  await page.waitForFunction(() => PixelPets.battle.on, null, { timeout: 20000 });
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
  await page.evaluate(() => PixelPets.winBattle());
  await closeEnd(page);
  expect((await page.evaluate(() => PixelPets.state.money | 0)) - before).toBe(50);
  expect(await page.evaluate(() => PixelPets.wildAcorns.today)).toBe(0);
});

test('T6 D813: the Acorn chips show the new total after the win, with no toast', async ({ page }) => {
  await boot(page);
  await seedToday(page, 0);
  const r = await winWild(page, 'beetle/0', 5);
  expect(r.paid).toBe(10);
  const total = await page.evaluate(() => PixelPets.state.money | 0);
  const labels = await page.evaluate(() => ['hdrAcorns', 'fcAcorns'].map(id => { const e = document.getElementById(id); return e ? e.getAttribute('aria-label') : null; }).filter(Boolean));
  expect(labels.length).toBeGreaterThan(0);
  for (const l of labels) expect(l).toBe(total + ' Acorns');
  const toast = await page.evaluate(() => { const t = document.querySelector('#toast'); return t && t.classList.contains('show') ? t.textContent : ''; });
  expect(toast).not.toMatch(/Acorn/);
});

test('T7 D816: one payout per wild end; a co-op guest is paid nothing', async ({ page }) => {
  await boot(page);
  await seedToday(page, 0);
  const r = await winWild(page, 'beetle/0', 3);
  expect(r.paid).toBe(6);
  expect(gotLines(r.lines).length).toBe(1);
  // Co-op: battle.coop set before the win pays nothing (D331).
  const before = await page.evaluate(() => ({ money: PixelPets.state.money | 0, today: PixelPets.wildAcorns.today }));
  await openWild(page, 'beetle/0', 5);
  await page.evaluate(() => { PixelPets.battle.coop = true; PixelPets.winBattle(); });
  await closeEnd(page);
  const after = await page.evaluate(() => ({ money: PixelPets.state.money | 0, today: PixelPets.wildAcorns.today }));
  expect(after).toEqual(before);
});

test('T8 all: the constants match the packet and the quests check is clean', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.wildAcorns.dayCap)).toBe(60);
  expect(await page.evaluate(() => (window.PPQuests && PPQuests.devCheck) ? PPQuests.devCheck() : [])).toEqual([]);
});
