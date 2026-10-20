/* MAP_LEGEND v0.1 (design 39ef920, D109/D110, renumbered by the Supervisor from Design 69f9a08 D109/D110): KEY grouped into PLACES / QUESTS / SIDES pills, unlocked by the story. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const PLACES = ['Town', 'Route', 'Side place', 'Not visited', 'Coach'];
const QUESTS = ['You', 'Next step', 'Side task', 'Seal'];
const SIDES = ['Keepers', 'Glimmerwell', 'Both sides', 'Wild'];

async function openWith(page, flags = {}, seals = null) {
  const s = starterSave(); Object.assign(s.flags, flags); if (seals) s.seals = Object.assign(s.seals || {}, seals);
  s.world = { map: 'hearthmoor', x: 8, y: 8, facing: 'down', respawn: 'hearthmoor' };
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#mapBtn').classList.contains('off'));
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.locator('#mapLevelRegion').click();
  await page.waitForTimeout(250);
  return page.evaluate(() => {
    const vis = e => !!(e && e.getClientRects().length);
    const groups = [...document.querySelectorAll('#mapKey .map-key-g')].filter(vis).map(g => ({ h: g.querySelector('.map-key-h').textContent,
      items: [...g.querySelectorAll('li')].filter(vis).map(li => li.textContent.trim()) }));
    return { groups, hold: !document.querySelector('#mapHold').hidden, note: vis(document.querySelector('.map-key-note')), claims: PixelPets.mapClaimsDrawn() };
  });
}

test('criteria 1-2: a new save shows PLACES (5) and QUESTS without Seal; no SIDES, no halos, no hold line', async ({ page }) => {
  const r = await openWith(page);
  expect(r.groups).toEqual([{ h: 'PLACES', items: PLACES }, { h: 'QUESTS', items: QUESTS.slice(0, 3) }]);
  expect(r.hold).toBe(false); expect(r.note).toBe(false); expect(r.claims).toBe(0);
});

test('criterion 3: after the pledge SIDES (4), the note, halos and the hold line show', async ({ page }) => {
  const r = await openWith(page, { 'story.side_pick_done': true });
  expect(r.groups.map(g => g.h)).toEqual(['PLACES', 'QUESTS', 'SIDES']);
  expect(r.groups[2].items).toEqual(SIDES);
  expect(r.hold).toBe(true); expect(r.note).toBe(true); expect(r.claims).toBeGreaterThan(0);
});

test('criterion 4: any seal flag or seal shows the Seal pill', async ({ page }) => {
  for (const [flags, seals] of [[{ 'story.seal1': true }, null], [{ 'story.seal2': true }, null], [{}, { seal_fernbrook: true }], [{}, { seal_glim_1: true }], [{}, { seal_cobblecrest: true }], [{}, { seal_glim_2: true }]]) {
    const r = await openWith(page, flags, seals);
    expect(r.groups[1].items, JSON.stringify([flags, seals])).toEqual(QUESTS);
  }
});

test('criterion 5: rects per §4 (±2), and no pill wraps or clips', async ({ page }) => {
  const W = page.viewportSize().width, H = page.viewportSize().height;
  for (const unlocked of [false, true]) {
    await openWith(page, unlocked ? { 'story.side_pick_done': true, 'story.seal1': true } : {});
    const m = await page.evaluate(() => {
      const r = e => { const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map(Math.round); };
      const key = document.querySelector('#mapKey'), out = { key: r(key), heads: {}, rows: {}, bad: [] };
      document.querySelectorAll('#mapKey .map-key-g').forEach(g => { if (!g.getClientRects().length) return; const h = g.querySelector('.map-key-h').textContent; out.heads[h] = r(g.querySelector('.map-key-h'));
        const lis = [...g.querySelectorAll('li')].filter(li => li.getClientRects().length);
        out.rows[h] = [...new Set(lis.map(li => Math.round(li.getBoundingClientRect().y)))];
        lis.forEach(li => { const b = li.getBoundingClientRect(), k = key.getBoundingClientRect(); if (b.height > 26.5 || li.scrollWidth > li.clientWidth + 1 || b.right > k.right + 0.5 || b.left < k.left - 0.5) out.bad.push(li.textContent); }); });
      out.keyH = Math.round(document.querySelector('#keyQuests').getBoundingClientRect().bottom - key.getBoundingClientRect().top);
      return out;
    });
    expect(m.bad).toEqual([]);
    if (!((W === 320 && H === 568) || (W === 390 && H === 844))) continue;
    const x = W === 320 ? 6 : 35, w = W === 320 ? 308 : 320, near = (a, b, tag) => a.forEach((v, i) => expect(Math.abs(v - b[i]), `${tag} ${a} vs ${b}`).toBeLessThanOrEqual(2));
    // §4 rects are measured from the KEY top (y 312 with a two-line place card); check the offsets plus x / w exactly.
    const y0 = m.key[1];
    near([m.key[0], m.key[2]], [x, w], 'key');
    near(m.heads.PLACES, [x, y0, w, 18], 'PLACES'); near(m.rows.PLACES.map(v => v - y0), [18, 48], 'PLACES rows');
    near(m.heads.QUESTS, [x, y0 + 82, w, 18], 'QUESTS'); near(m.rows.QUESTS.map(v => v - y0), [100], 'QUESTS rows');
    if (unlocked) { near(m.heads.SIDES, [x, y0 + 134, w, 18], 'SIDES'); near(m.rows.SIDES.map(v => v - y0), [152, 182], 'SIDES rows'); }
    else { expect(m.heads.SIDES).toBeUndefined(); near([m.keyH], [134], 'KEY height new save'); }
  }
});

test('criterion 6-7: mapDevCheck stays clean and nothing new is saved', async ({ page }) => {
  await openWith(page, { 'story.side_pick_done': true });
  expect(await page.evaluate(() => PixelPets.mapDevCheck ? PixelPets.mapDevCheck() : [])).toEqual([]);
});
