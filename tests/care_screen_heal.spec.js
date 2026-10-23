/* CARE_SCREEN_HEAL: one stat block under the scene, HEAL picker, whole-number HP labels. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function saveWith(pet, bag, settings) {
  const s = starterSave();
  s.player.name = 'Wayfarer';
  if (pet) Object.assign(s.party[0], pet);
  if (bag) s.bag = bag;
  if (settings) Object.assign(s.settings, settings);
  return s;
}

async function boot(page, pet, bag, search, settings) {
  await installSave(page.context(), saveWith(pet, bag, settings), { quietDay: true });
  await gotoGame(page, search || '');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('pet'));
}

const BAG = { heal_snack: 3, hearty_snack: 1, wake_tonic: 1 };

async function measure(page) {
  return page.evaluate(() => {
    const q = s => document.querySelector(s), ps = q('#scr-pet'), R = e => e.getBoundingClientRect();
    const btns = [...ps.querySelectorAll('.actions.care4 .btn')];
    const rows = [...ps.querySelectorAll('.care-block .stat')].filter(s => s.offsetParent);
    const bars = rows.map(s => Math.round(R(s.querySelector('.bar')).width));
    const over = btns.filter(b => b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1).map(b => b.dataset.act);
    const labs = [...ps.querySelectorAll('.stat-lab')].filter(s => s.offsetParent && s.scrollWidth > s.clientWidth + 1).map(s => s.textContent.trim());
    const st = q('#statStrip');
    return {
      scroll: ps.scrollHeight - ps.clientHeight,
      scene: Math.round(R(q('#petCanvas')).height),
      tight: ps.classList.contains('pet-tight'),
      btnW: Math.floor(Math.min(...btns.map(b => R(b).width))),
      btnH: Math.floor(Math.min(...btns.map(b => R(b).height))),
      n: btns.length,
      acts: btns.map(b => b.dataset.act),
      overflow: over.concat(labs),
      bars,
      strip: !!(st && st.offsetParent),
      last: Math.round(btns.length ? R(btns[btns.length - 1]).bottom : 0),
      vh: window.innerHeight,
      labels: rows.map(s => s.querySelector('.stat-lab').textContent.trim()),
      hpText: q('.st-hp b').textContent,
      v: PixelPets.state.v,
    };
  });
}

test('the block order, equal bars, a hidden strip, and no scroll at the measured size', async ({ page }) => {
  const w = page.viewportSize().width;
  if (w === 390) await page.setViewportSize({ width: 390, height: 664 });
  await boot(page, { hunger: 55, happy: 57, energy: 29, xp: 119, hpNow: 6 });
  const m = await measure(page);
  expect(m.v).toBe(2);
  expect(m.labels).toEqual(['HP', 'FOOD', 'JOY', 'NRG', 'GROW']);
  expect(m.hpText).toBe('');
  expect(new Set(m.bars).size).toBe(1);
  expect(m.bars[0]).toBeGreaterThan(0);
  expect(m.strip).toBe(false);
  expect(m.scroll).toBeLessThanOrEqual(0);
  expect(m.n).toBe(4);
  expect(m.acts).toEqual(['feed', 'play', 'rest', 'heal']);
  expect(m.btnW).toBeGreaterThanOrEqual(44);
  expect(m.btnH).toBeGreaterThanOrEqual(44);
  expect(m.overflow).toEqual([]);
  expect(m.last).toBeLessThanOrEqual(m.vh);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await expect(page.locator('#statStrip')).toBeVisible();
});

test('a chipped partner shows ALIGN between NRG and GROW and still fits at 320 @w1', async ({ page }) => {
  test.skip(page.viewportSize().width !== 320, '320 only');
  await boot(page, { hunger: 55, happy: 57, energy: 29, xp: 119, hpNow: 6, chip: { on: true, locked: true }, align: 40 });
  const m = await measure(page);
  expect(m.labels).toEqual(['HP', 'FOOD', 'JOY', 'NRG', 'ALIGN', 'GROW']);
  expect(new Set(m.bars).size).toBe(1);
  expect(m.strip).toBe(false);
  expect(m.scroll).toBeLessThanOrEqual(0);
  expect(m.btnW).toBeGreaterThanOrEqual(44);
  expect(m.btnH).toBeGreaterThanOrEqual(44);
  expect(m.overflow).toEqual([]);
  expect(m.last).toBeLessThanOrEqual(568);
});

test('HEAL lists the bag, greys a refusal, and BACK uses nothing @w1', async ({ page }) => {
  await boot(page, { hpNow: 8 }, BAG);
  const before = await page.evaluate(() => ({
    bag: Object.assign({}, PixelPets.state.bag),
    cx: JSON.stringify(PixelPets.state.party[0].cx || null),
    bond: PixelPets.state.party[0].bond || 0,
    hp: PixelPets.state.party[0].hpNow,
  }));
  await page.locator('#scr-pet [data-act="heal"]').click();
  await expect(page.locator('#ovSheet')).toBeVisible();
  await expect(page.locator('#shTitle')).toHaveText(/^Heal /);
  const rows = await page.evaluate(() => [...document.querySelectorAll('#shList .sh-item')].map(b => ({
    label: b.querySelector('.sh-l').textContent,
    sub: b.querySelector('.sh-s').textContent,
    off: b.disabled,
    h: b.getBoundingClientRect().height,
  })));
  expect(rows.map(r => r.label)).toEqual(['Heal Snack x3', 'Hearty Snack x1', 'Wake Tonic x1']);
  expect(rows[0].sub).toBe('Restores 40% HP.');
  expect(rows[0].off).toBe(false);
  expect(rows[1].sub).toBe('Restores 75% HP.');
  expect(rows[2].off).toBe(true);
  expect(rows[2].sub).toMatch(/isn't napping\.$/);
  rows.forEach(r => expect(r.h).toBeGreaterThanOrEqual(44));
  const back = await page.locator('#shCancel').boundingBox();
  expect(back.height).toBeGreaterThanOrEqual(44);
  await page.locator('#shCancel').click();
  await expect(page.locator('#ovSheet')).toBeHidden();
  await expect(page.locator('#toast')).toHaveText('');
  const after = await page.evaluate(() => ({
    bag: Object.assign({}, PixelPets.state.bag),
    cx: JSON.stringify(PixelPets.state.party[0].cx || null),
    bond: PixelPets.state.party[0].bond || 0,
    hp: PixelPets.state.party[0].hpNow,
  }));
  expect(after.bag).toEqual(before.bag);
  expect(after.cx).toBe(before.cx);
  expect(after.bond).toBe(before.bond);
  // Out-of-battle regen keeps adding a crumb of HP. BACK must not heal; a real snack moves HP by whole points.
  expect(Math.abs(after.hp - before.hp)).toBeLessThan(0.05);
});

test('a Heal Snack closes the picker, toasts, and adds no care XP @w1', async ({ page }) => {
  await boot(page, { hpNow: 8 }, BAG);
  const before = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { cx: JSON.stringify(p.cx || null), hp: p.hpNow, max: maxHpOf(p) };
  });
  await page.locator('#scr-pet [data-act="heal"]').click();
  await page.locator('#shList .sh-item', { hasText: 'Heal Snack' }).click();
  await expect(page.locator('#ovSheet')).toBeHidden();
  await expect(page.locator('#toast')).toContainText('ate a Heal Snack and feels better!');
  const got = await page.evaluate(() => ({
    n: PixelPets.state.bag.heal_snack,
    cx: JSON.stringify(PixelPets.state.party[0].cx || null),
    hp: PixelPets.state.party[0].hpNow,
    care: document.querySelector('#petCare').textContent,
  }));
  expect(got.n).toBe(2);
  expect(got.cx).toBe(before.cx);
  expect(got.care).toBe('0/25');
  // useItem heals with the existing ceil-then-round. Regen then adds a fraction, so the save sits just above that whole number.
  const healed = Math.round(before.hp + Math.ceil(0.4 * before.max));
  expect(got.hp).toBeGreaterThan(healed - 0.001);
  expect(got.hp).toBeLessThan(healed + 0.25);
});

test('an empty bag names the store from the map, and a renamed store follows @w1', async ({ page }) => {
  await boot(page, { hpNow: 8 }, {}, '?debug=1');
  await page.locator('#scr-pet [data-act="heal"]').click();
  const live = await page.evaluate(() => WORLD.hm_store.name);
  const row = page.locator('#shList .sh-item');
  await expect(row).toHaveCount(1);
  await expect(row.locator('.sh-l')).toHaveText('No healing items.');
  await expect(row.locator('.sh-s')).toHaveText(live + ' sells them.');
  await expect(row).toBeDisabled();
  await page.evaluate(() => { WORLD.hm_store.name = 'North Lantern Shop'; });
  await page.locator('#shCancel').click();
  await page.locator('#scr-pet [data-act="heal"]').click();
  await expect(page.locator('#shList .sh-s')).toHaveText('North Lantern Shop sells them.');
});

test('full HP shows FULL, stays tappable, and does not open the picker @w1', async ({ page }) => {
  await boot(page, {}, BAG);
  const btn = page.locator('#scr-pet [data-act="heal"]');
  await expect(btn).toContainText('FULL');
  await expect(btn).toHaveClass(/cooldown/);
  await expect(btn).toHaveAttribute('aria-label', /is at full HP$/);
  await btn.click({ force: true });   // FULL sets aria-disabled; a real tap still runs healTap
  await expect(page.locator('#ovSheet')).toBeHidden();
  await expect(page.locator('#toast')).toContainText('is already at full HP.');
  expect(await page.evaluate(() => PixelPets.state.bag.heal_snack)).toBe(3);
});

test('a nap greys the snacks and a Wake Tonic ends it @w1', async ({ page }) => {
  await boot(page, { hpNow: 0, faintUntil: Date.now() + 14 * 60000 }, BAG);
  await expect(page.locator('#petBadge')).toContainText(/RESTING/);
  await page.locator('#scr-pet [data-act="heal"]').click();
  const rows = await page.evaluate(() => [...document.querySelectorAll('#shList .sh-item')].map(b => ({
    label: b.querySelector('.sh-l').textContent,
    sub: b.querySelector('.sh-s').textContent,
    off: b.disabled,
  })));
  expect(rows[0].off).toBe(true);
  expect(rows[0].sub).toMatch(/needs a proper rest\.$/);
  expect(rows[1].off).toBe(true);
  expect(rows[2].label).toBe('Wake Tonic x1');
  expect(rows[2].off).toBe(false);
  await page.locator('#shList .sh-item', { hasText: 'Wake Tonic' }).click();
  await expect(page.locator('#toast')).toContainText('blinks awake!');
  const woke = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { nap: !!p.faintUntil, hp: p.hpNow, tonic: PixelPets.state.bag.wake_tonic || 0, cx: JSON.stringify(p.cx || null) };
  });
  expect(woke.nap).toBe(false);
  expect(woke.tonic).toBe(0);
  expect(woke.hp).toBeGreaterThan(0);
  expect(woke.cx).toBe('null');
});

test('fractional HP aria labels are whole numbers and the save keeps the fraction @w1', async ({ page }) => {
  await boot(page, { hpNow: 1.6 }, {}, '?debug=1');
  // Regen ticks between turns. Each check sets 1.6 and reads in the same turn, so the label is ceil (2) and the save stays 1.6.
  const labels = await page.evaluate(async () => {
    const p = PixelPets.state.party[0];
    p.hpNow = 1.6;
    PixelPets.showTab('pet');
    await Promise.resolve();
    return {
      hp: p.hpNow,
      mx: maxHpOf(p),
      care: document.querySelector('#careHp').getAttribute('aria-label'),
      strip: document.querySelector('#petStrip').getAttribute('aria-label'),
    };
  });
  const whole = 'HP 2 of ' + labels.mx;
  expect(labels.hp).toBe(1.6);
  expect(labels.care).toBe(whole);
  expect(labels.strip).toContain(whole);
  expect(labels.care).not.toContain('HP 1 of');
  expect(labels.care).not.toMatch(/\d+\.\d/);
  const card = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.hpNow = 1.6;
    PixelPets.openStats(p.id);
    return {
      hp: p.hpNow,
      text: document.querySelector('#scHp').textContent,
      now: document.querySelector('#scHpBar').parentNode.getAttribute('aria-valuenow'),
    };
  });
  expect(card.hp).toBe(1.6);
  expect(card.text).toBe('2/' + labels.mx);
  expect(card.now).toBe('2');
  const slot = await page.evaluate(() => {
    PixelPets.closeStats();
    const p = PixelPets.state.party[0];
    p.hpNow = 1.6;
    PixelPets.showTab('col');
    const row = document.querySelector('.party-slot .slot-main') || document.querySelector('.party-slot');
    return { hp: p.hpNow, label: row ? row.getAttribute('aria-label') : '' };
  });
  expect(slot.hp).toBe(1.6);
  expect(slot.label).toContain(whole);
  expect(slot.label).not.toMatch(/HP \d+\.\d/);
  const started = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.hpNow = 1.6;
    PixelPets.battle.textMs = 0; PixelPets.battle.animMs = 0;
    return PixelPets.forceBattle('byte/0', 5);
  });
  expect(started).toBe(true);
  const battle = page.locator('#battleCanvas');
  await expect(battle).toHaveAttribute('aria-label', new RegExp('HP 2 of ' + labels.mx));
  expect(await battle.getAttribute('aria-label')).not.toMatch(/\d+\.\d/);
  expect(await page.evaluate(() => PixelPets.state.party[0].hpNow)).toBe(1.6);
});
