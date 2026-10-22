/* POLISH_BUILD2 P1 quest screen, D439 tracking, plus the P4 handset line and P6 Marigold card. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const LIME = [167, 240, 112];
const INK = [26, 28, 44];
const SKY = [65, 166, 246];

function save(extra, patch) {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  Object.assign(s.flags, extra || {});
  if (patch) patch(s);
  return s;
}

const THREE = {
  'story.leak5b_seen': true,
};
const FRESH = {
  'story.phone_got': true,
  'story.mom_met': true,
  'story.mom_chore': true,
  'story.mom_sent': true,
  'story.reached_mahopac': true,
  'story.dream_started': true,
  'story.dream_toy': true,
  'story.dream_party': true,
  'story.dream_dad': true,
  'story.dream_woke': true,
  'story.dream_study': true,
  'story.leak5b_seen': false,
  'story.cobble_end': false,
};

async function boot(page, s) {
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#questBtn').classList.contains('off'));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function openPanel(page) {
  await page.locator('#questBtn').click();
  await page.waitForSelector('#ovQuest:not([hidden])');
  await page.waitForFunction(() => PixelPets.optionsReady);
}

async function closePanel(page) {
  await page.locator('#questClose').click();
  await page.waitForSelector('#ovQuest', { state: 'hidden' });
}

async function frame(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test('three side quests show the 3 badge, and TRACK moves the card', async ({ page }) => {
  const s = save(THREE, (row) => { row.ui = { sideTracked: 'leak_ask', sideSeen: ['phone', 'mom', 'leak_ask'] }; });
  await boot(page, s);
  const badge = await page.evaluate(() => {
    const c = document.querySelector('#questBtn .nav-art');
    if (!c) return null;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const at = (x, y) => [d[(y * c.width + x) * 4], d[(y * c.width + x) * 4 + 1], d[(y * c.width + x) * 4 + 2]];
    return { frame: at(0, 0), ink: at(8, 10), fill: at(4, 10), w: c.width };
  });
  expect(badge.frame).toEqual(LIME);
  expect(badge.ink).toEqual(INK);
  expect(badge.fill).toEqual(SKY);
  await openPanel(page);
  await expect(page.locator('#questSideLabel')).toHaveText('SIDE \u00b7 3');
  await expect(page.locator('#questSideStatus')).toHaveText('ACTIVE');
  await expect(page.locator('#questSideTrack')).toHaveText('TRACKED');
  await expect(page.locator('#questSideTrack')).toHaveClass(/on/);
  await expect(page.locator('#questMainTrack')).toHaveText('TRACK');
  const sideBox = await page.locator('#questSideTrack').boundingBox();
  const mainBox = await page.locator('#questMainTrack').boundingBox();
  const rowBox = await page.locator('#questSideRows .q-track').first().boundingBox();
  expect(sideBox.height).toBeGreaterThanOrEqual(44);
  expect(mainBox.height).toBeGreaterThanOrEqual(44);
  expect(rowBox.height).toBeGreaterThanOrEqual(44);
  expect(sideBox.width).toBeGreaterThanOrEqual(100);
  const before = await page.evaluate(() => ({ id: PixelPets.sideQuest.id, map: PixelPets.sideQuest.target.map }));
  expect(before.id).toBe('leak_ask');
  await page.locator('#questSideRows .q-row[data-chain="mom"] .q-track').click();
  await expect(page.locator('#questSide')).toHaveText('Mom is upstairs. She wants to meet your Walkling.');
  await expect(page.locator('#questSideTrack')).toHaveText('TRACKED');
  const after = await page.evaluate(() => ({
    id: PixelPets.sideQuest.id,
    map: PixelPets.sideQuest.target.map,
    tracked: PixelPets.state.ui.sideTracked,
    v: PixelPets.state.v,
  }));
  expect(after.id).toBe('mom');
  expect(after.map).toBe('hm_home_up');
  expect(after.tracked).toBe('mom');
  expect(after.v).toBe(2);
  expect(before.map).not.toBe(after.map);
  await closePanel(page);
  await page.evaluate(() => PixelPets.goto('route2', 24, 8, 'down'));
  await frame(page);
  const followed = await page.evaluate(() => (PixelPets.cueChips() || []).some(c => c.tracked));
  expect(followed).toBe(true);
});

test('TRACKED clears every lime mark, and TRACK on MAIN stores main', async ({ page }) => {
  const s = save(THREE, (row) => { row.ui = { sideTracked: 'leak_ask', sideSeen: ['phone', 'mom', 'leak_ask'] }; });
  await boot(page, s);
  await openPanel(page);
  const keysBefore = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  await page.locator('#questSideTrack').click();
  await expect(page.locator('#questSideTrack')).toHaveText('TRACK');
  await expect(page.locator('#questMainTrack')).toHaveText('TRACK');
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('none');
  await page.locator('#questMainTrack').click();
  await expect(page.locator('#questMainTrack')).toHaveText('TRACKED');
  const stored = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: row.v, t: row.ui && row.ui.sideTracked, keys: Object.keys(row).sort() };
  });
  expect(stored.v).toBe(2);
  expect(stored.t).toBe('main');
  expect(stored.keys).toEqual(keysBefore);
  await page.locator('#questMainTrack').click();
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('none');
  await closePanel(page);
  await page.evaluate(() => { PixelPets.cueLayout(null); PixelPets.goto('route2', 24, 8, 'down'); });
  await frame(page);
  const walk = await page.evaluate(() => {
    const chips = PixelPets.cueChips() || [];
    const c = document.querySelector('#mapCanvas'), g = c.getContext('2d');
    const lime = chips.some(ch => {
      const d = g.getImageData(ch.x - 5, ch.y, 1, 1).data;
      return d[0] === 167 && d[1] === 240 && d[2] === 112;
    });
    return { tracked: chips.some(ch => ch.tracked), lime, n: chips.length };
  });
  expect(walk.tracked).toBe(false);
  expect(walk.lime).toBe(false);
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.locator('#mapLevelRegion').click();
  await page.waitForFunction(() => PixelPets.regionMapMarks);
  const region = await page.evaluate(() => {
    const c = document.querySelector('#regionCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let lime = false;
    for (let i = 0; i < d.length; i += 4) if (d[i] === 167 && d[i + 1] === 240 && d[i + 2] === 112) { lime = true; break; }
    return { tracked: PixelPets.regionMapMarks.tracked, lime };
  });
  expect(region.tracked).toBeNull();
  expect(region.lime).toBe(false);
  await page.locator('#mapClose').click();
  await page.waitForSelector('#ovMap', { state: 'hidden' });
  await page.evaluate(() => PixelPets.goto('hm_home_up', 4, 5, 'down'));
  await page.locator('#mapBtn').click();
  await page.waitForFunction(() => PixelPets.mapLayer() && PixelPets.mapLayer().level === 'room');
  const room = await page.evaluate(() => PixelPets.mapLayer().rings.map(r => r.kind));
  expect(room).not.toContain('side');
  expect(room).not.toContain('tracked_main');
  await page.locator('#mapLevelTown').click();
  await page.waitForFunction(() => PixelPets.mapLayer().level === 'town');
  const town = await page.evaluate(() => PixelPets.mapLayer().rings.map(r => r.kind));
  expect(town).not.toContain('side');
  expect(town).not.toContain('tracked_main');
  await page.locator('#mapClose').click();
  const btn = await page.evaluate(() => {
    const c = document.querySelector('#questBtn .nav-art');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let i = 0; i < d.length; i += 4) if (d[i] === 167 && d[i + 1] === 240 && d[i + 2] === 112) return true;
    return false;
  });
  expect(btn).toBe(false);
});

test('an unset save still tracks the first side chain', async ({ page }) => {
  const s = save();
  delete s.ui;
  await boot(page, s);
  const st = await page.evaluate(() => ({
    id: PixelPets.sideQuest && PixelPets.sideQuest.id,
    stored: (JSON.parse(localStorage.getItem('pixelpets.save.v2')).ui || {}).sideTracked,
    v: PixelPets.state.v,
  }));
  expect(st.id).toBe('phone');
  expect(st.stored).toBeUndefined();
  expect(st.v).toBe(2);
});

test('nothing tracked stays gold until TRACK on the main card', async ({ page }) => {
  await boot(page, save(FRESH));
  await page.evaluate(() => PixelPets.goto('hearthmoor', 2, 2, 'down'));
  await frame(page);
  const gold = await page.evaluate(() => {
    const chips = PixelPets.cueChips() || [];
    const c = document.querySelector('#mapCanvas'), g = c.getContext('2d');
    const scan = (ch) => {
      const fill = g.getImageData(ch.x - 5, ch.y, 1, 1).data;
      const d = g.getImageData(ch.x - 4, ch.y - 6, 8, 12).data;
      let gold = false;
      for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 205 && d[i + 2] === 117) gold = true;
      return { tracked: !!ch.tracked, lime: fill[0] === 167 && fill[1] === 240 && fill[2] === 112, gold };
    };
    return { n: chips.length, rows: chips.map(scan), pick: PixelPets.state.ui && PixelPets.state.ui.sideTracked };
  });
  expect(gold.pick == null || gold.pick === undefined).toBe(true);
  expect(gold.n).toBeGreaterThan(0);
  expect(gold.rows.some(r => r.tracked)).toBe(false);
  expect(gold.rows.some(r => r.lime)).toBe(false);
  expect(gold.rows.some(r => r.gold)).toBe(true);
  await openPanel(page);
  await expect(page.locator('#questSideCard')).toBeHidden();
  await page.locator('#questMainTrack').click();
  expect(await page.evaluate(() => PixelPets.state.ui.sideTracked)).toBe('main');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
  await closePanel(page);
  await frame(page);
  const lime = await page.evaluate(() => {
    const chips = PixelPets.cueChips() || [];
    const c = document.querySelector('#mapCanvas'), g = c.getContext('2d');
    return chips.filter(ch => ch.tracked).map(ch => {
      const d = g.getImageData(ch.x - 5, ch.y, 1, 1).data;
      return [d[0], d[1], d[2]];
    });
  });
  expect(lime.length).toBeGreaterThan(0);
  expect(lime[0]).toEqual(LIME);
});

test('Handset notes point at BOTNET', async ({ page }) => {
  const s = save({
    'story.phone_got': true,
    'story.side': 'glimmer',
    'story.side_pick_done': true,
  }, (row) => { row.bag = { cracked_phone: 1, keeper1: 1 }; });
  await boot(page, s);
  await page.locator('#phoneBtn').click();
  await page.waitForSelector('#ovPhone:not([hidden])');
  await page.locator('.phone-app[data-app="notes"]').click();
  const notes = await page.locator('#phoneBody').innerText();
  expect(notes).toContain('Jobs and parts live under BOTNET, not here.');
  expect(notes).not.toContain('board wakes up');
  expect(notes).toContain('The crest phone copies every note.');
});

test("Marigold's card names Stitch & Lantern, and a cool tier stays private", async ({ page }) => {
  const s = save({ 'story.phone_got': true }, (row) => {
    row.phoneBook = { met: { 'Keeper Marigold': true }, fav: {} };
  });
  await boot(page, s);
  const live = await page.evaluate(() => PixelPets.whereNow('Keeper Marigold'));
  expect(live.now).toBe('Now: Stitch & Lantern \u00b7 AT WORK');
  expect(live.source).toBe('fixed');
  await page.locator('#phoneBtn').click();
  await page.locator('.phone-app[data-app="contacts"]').click();
  await page.locator('.contact-main', { hasText: 'Keeper Marigold' }).click();
  await expect(page.locator('.contact-card .where-text')).toHaveText('Now: Stitch & Lantern \u00b7 AT WORK');
  await page.evaluate(() => PixelPets.repAdd('Keeper Marigold', -30));
  await page.locator('[data-contact-back]').click();
  await page.locator('.contact-main', { hasText: 'Keeper Marigold' }).click();
  const cool = await page.evaluate(() => PixelPets.whereNow('Keeper Marigold'));
  expect(cool.source).toBe('private');
  await expect(page.locator('.contact-card .where-text')).toHaveText('Keeps to themself.');
});
