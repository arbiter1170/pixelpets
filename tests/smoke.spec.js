/* Phone smoke checks for Walklings. See tests/README.md.
   Widths come from the Playwright projects (320, 375, 390). Fail on any console error or page error. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { SHOTS, starterSave, installSave, trackErrors, gotoGame, boxesOverlap } = require('./helpers');

trackErrors(test, expect);

test('boot, build stamp, and dev checks @w1', async ({ page }) => {
  await gotoGame(page);
  await page.waitForFunction(() => {
    const s = window.PixelPets.scene;
    return s && s.id === 'intro';
  }, null, { timeout: 10000 });
  const report = await page.evaluate(async () => {
    const res = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    const body = await res.json();
    const problems = (list) => (Array.isArray(list) ? list : ['not an array']);
    return {
      build: window.BUILD,
      version: body.build,
      quest: problems(window.PixelPets.questCheck),
      glimmer: problems(window.PixelPets.glimmerCheck),
      music: problems(window.PixelPets.musicCheck()),
      befriend: problems(window.PixelPets.befriendCheck()),
      standing: problems(window.PixelPets.standingCheck()),
      map: problems(window.PixelPets.mapCheck()),
      heights: problems(window.PixelPets.heightsCheck),
      hasApi: typeof window.PixelPets === 'object',
    };
  });
  expect(report.hasApi).toBe(true);
  expect(report.build).toBe(report.version);
  expect(report.quest, 'questCheck').toEqual([]);
  expect(report.glimmer, 'glimmerCheck').toEqual([]);
  expect(report.music, 'musicCheck').toEqual([]);
  expect(report.befriend, 'befriendCheck').toEqual([]);
  expect(report.standing, 'standingCheck').toEqual([]);
  expect(report.map, 'mapCheck').toEqual([]);
  expect(report.heights, 'heightsCheck').toEqual([]);
});

test('befriend odds stay inside the tuning range @w1', async ({ page }) => {
  await gotoGame(page);
  const odds = await page.evaluate(() => ({
    early: PixelPets.befriendOdds(3, 1),
    quarry: PixelPets.befriendOdds(18, 0.25),
    q16: PixelPets.befriendOdds(16, 0.25),
    q19: PixelPets.befriendOdds(19, 0.25),
  }));
  for (const row of [odds.early, odds.quarry]) {
    expect(typeof row.width).toBe('number');
    expect(row.width).toBeGreaterThanOrEqual(0.06);
    expect(row.width).toBeLessThanOrEqual(0.6);
  }
  expect(odds.quarry.width).toBeCloseTo(0.181, 3);
  expect(Math.round(odds.quarry.width * 100) / 100).toBe(0.18);
  expect(odds.q16.width).toBeCloseTo(0.196, 3);
  expect(odds.q19.width).toBeCloseTo(0.174, 3);
});

test('quest button opens the next-step panel', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => {
    const b = document.querySelector('#questBtn');
    if (!b || b.hidden) return false;
    const r = b.getBoundingClientRect();
    return r.width >= 44 && r.height >= 44;
  });
  const layout = await page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { id: el.id || '', x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const quest = box(document.querySelector('#questBtn'));
    const dpc = [...document.querySelectorAll('.dpc')].filter((el) => !el.hidden && el.id !== 'questBtn').map(box);
    const dp = [...document.querySelectorAll('.dp')].filter((el) => !el.hidden).map(box);
    return { quest, dpc, dp };
  });
  expect(layout.quest.width).toBeGreaterThanOrEqual(44);
  expect(layout.quest.height).toBeGreaterThanOrEqual(44);
  const vp = page.viewportSize();
  expect(layout.quest.y).toBeGreaterThanOrEqual(0);
  expect(layout.quest.y + layout.quest.height).toBeLessThanOrEqual(vp.height + 1);
  expect(layout.quest.x).toBeGreaterThanOrEqual(0);
  expect(layout.quest.x + layout.quest.width).toBeLessThanOrEqual(vp.width + 1);
  for (const other of layout.dpc.concat(layout.dp)) {
    expect(boxesOverlap(layout.quest, other), 'quest overlaps ' + (other.id || 'a d-pad cell')).toBe(false);
  }
  fs.mkdirSync(SHOTS, { recursive: true });
  const width = String(vp.width);
  await page.screenshot({ path: path.join(SHOTS, 'walk-quest-' + width + '.png') });
  await page.locator('#questBtn').tap();
  await expect(page.locator('#ovQuest')).toBeVisible();
  const shown = await page.locator('#questText').textContent();
  const apiText = await page.evaluate(() => PixelPets.quest.text);
  expect(shown).toBe(apiText);
  expect(apiText.length).toBeGreaterThan(0);
  await page.screenshot({ path: path.join(SHOTS, 'quest-panel-' + width + '.png') });
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovQuest')).toBeHidden();
  await page.locator('#questBtn').tap();
  await expect(page.locator('#ovQuest')).toBeVisible();
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  await page.locator('#questClose').tap();
  await expect(page.locator('#ovQuest')).toBeHidden();
});

test('befriend bar opens and BACK returns to the battle menu', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.forceBattle === 'function');
  const opened = await page.evaluate(() => PixelPets.forceBattle('tide/0', 3));
  expect(opened).toBe(true);
  await page.waitForFunction(() => {
    const b = window.PixelPets.battle;
    return b && b.on && b.state === 'CHOOSE' && b.panel === 'acts';
  }, null, { timeout: 15000 });
  await page.locator('#btBefriendAct').tap();
  await page.waitForFunction(() => {
    const bef = document.querySelector('#btBef');
    const zone = document.querySelector('#tzone');
    const mark = document.querySelector('#tmark');
    const enc = window.PixelPets.enc;
    if (!bef || bef.hidden || !zone || !enc || !enc.open) return false;
    return parseFloat(zone.style.width) > 0 && mark && mark.style.left !== '';
  });
  await expect(page.locator('#tbar')).toBeVisible();
  await expect(page.locator('#btBefBack')).toBeVisible();
  await page.locator('#btBefBack').tap();
  await page.waitForFunction(() => {
    const b = window.PixelPets.battle;
    const bef = document.querySelector('#btBef');
    const acts = document.querySelector('#btActs');
    return b && b.state === 'CHOOSE' && b.panel === 'acts' && bef.hidden && acts && !acts.hidden;
  });
});

test('glimmer side swaps the orchard scene and restores keepers @w1', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.setSide === 'function');
  const before = await page.evaluate(() => ({
    sidePick: PixelPets.sceneFor('side_pick'),
    orchard: PixelPets.sceneFor('orchard'),
    side: PixelPets.side,
  }));
  expect(before.sidePick).toBe('side_pick');
  expect(before.orchard).toBe('orchard');
  expect(before.side).toBe('keepers');
  const glimmer = await page.evaluate(() => {
    PixelPets.setSide('glimmer');
    return {
      orchard: PixelPets.sceneFor('orchard'),
      lead: PixelPets.sceneFor('lead_intro'),
      glen: PixelPets.sceneFor('glen_cleared'),
      arrive: PixelPets.sceneFor('cobble_arrive'),
      hall: PixelPets.sceneFor('hale_trial'),
      hook: PixelPets.sceneFor('brinewick_hook'),
      side: PixelPets.side,
    };
  });
  expect(glimmer.orchard).toBe('orchard@glimmer');
  expect(glimmer.lead).toBe('lead_intro@glimmer');
  expect(glimmer.glen).toBe('glen_cleared@glimmer');
  expect(glimmer.arrive).toBe('cobble_arrive@glimmer');
  expect(glimmer.hall).toBe('hale_trial@glimmer');
  expect(glimmer.hook).toBe('brinewick_hook@glimmer');
  expect(glimmer.side).toBe('glimmer');
  const back = await page.evaluate(() => {
    PixelPets.setSide('keepers');
    return {
      orchard: PixelPets.sceneFor('orchard'),
      lead: PixelPets.sceneFor('lead_intro'),
      hall: PixelPets.sceneFor('hale_trial'),
      hook: PixelPets.sceneFor('brinewick_hook'),
      side: PixelPets.side,
    };
  });
  expect(back.orchard).toBe('orchard');
  expect(back.lead).toBe('lead_intro');
  expect(back.hall).toBe('hale_trial');
  expect(back.hook).toBe('brinewick_hook');
  expect(back.side).toBe('keepers');
});

test('settings can save a copy, and cancel does not wipe the game', async ({ page }) => {
  const save = starterSave();
  save.flags['story.side'] = 'glimmer';
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets.state && window.PixelPets.state.party[0]);
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#setCopy')).toBeVisible();
  await expect(page.locator('#setRead')).toBeVisible();
  await expect(page.locator('#setBuild')).toBeInViewport();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#setCopy').click(),
  ]);
  const file = JSON.parse(await fs.promises.readFile(await download.path(), 'utf8'));
  expect(file.v).toBe(2);
  expect(file.party[0].id).toBe('petsmoke1');
  expect(file.flags['story.side']).toBe('glimmer');
  await page.locator('#startOver').click();
  await expect(page.locator('#resetCopy')).toBeVisible();
  await page.locator('#resetGo').hover();
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.up();
  expect(await page.evaluate(() => PixelPets.state.uid)).toBe('smoketest0001');
  await page.locator('#resetCancel').click();
  await expect(page.locator('#ovReset')).toBeHidden();
  const kept = await page.evaluate(() => ({
    uid: PixelPets.state.uid,
    id: PixelPets.state.party[0].id,
    side: PixelPets.state.flags['story.side'],
    v: PixelPets.state.v,
  }));
  expect(kept.uid).toBe('smoketest0001');
  expect(kept.id).toBe('petsmoke1');
  expect(kept.side).toBe('glimmer');
  expect(kept.v).toBe(2);
});

test('a minimal v2 save without faction or quest fields still loads as v2 @w1', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('pixelpets.save.v2', JSON.stringify({ v: 2 }));
  });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets.side === 'keepers');
  // The 5 s autosave writes the normalized state back. The seed was only {v:2}, so `party` proves a write happened.
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('pixelpets.save.v2');
    if (!raw) return false;
    try {
      const o = JSON.parse(raw);
      return o && o.v === 2 && Array.isArray(o.party) && o.flags && typeof o.flags === 'object' && !Object.prototype.hasOwnProperty.call(o, 'questSeen') && o.player;
    } catch (e) { return false; }
  }, null, { timeout: 15000 });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(saved.v).toBe(2);
  expect(saved.flags['story.side']).toBeUndefined();
  expect(await page.evaluate(() => PixelPets.side)).toBe('keepers');
});
