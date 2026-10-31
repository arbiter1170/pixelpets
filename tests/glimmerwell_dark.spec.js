/* GLIMMERWELL_PALETTE v0.3.1 option (b). Wine V, soot N, crimson Q.
   The devCheck fails above 10% Q or a soot band under 6 px (horizontal runs of 2 or more).
   Art targets are tighter: the Associate bag stays at or under 3.5%, every other locked look at or under 1.7%.
   Widths are the Playwright projects (320, 375, 390). Save stays pixelpets.save.v2 with v 2 and gains no field. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const WINE = 'rgb(150, 14, 22)';
const ICE = 'rgb(115, 239, 247)';

async function boot(page, save, search) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, search || '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && window.BUILD);
}

test('locked looks stay under the crimson cap and the soot band, and the save is unchanged', async ({ page }) => {
  const save = starterSave();
  save.settings.follower = false;
  const beforeKeys = Object.keys(save).sort();
  await boot(page, save);
  const report = await page.evaluate(() => {
    const pal = PixelPets.glimmerPalette();
    const look = PixelPets.keeper.look;
    const frames = PixelPets.artTally('comfort_lamp');
    const board = PixelPets.artTally('bulletin_glimmer')[0];
    const flyer = PixelPets.artTally('flyer_glimmer')[0];
    const desk = PixelPets.artTally('switch_desk_glimmer')[0];
    const ring = PixelPets.artTally('relay_ring');
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      problems: PixelPets.devChecks().palette,
      pal,
      look: { outfitCol: look.outfitCol, accent: look.accent, accessory: look.accessory, hem: look.hem || null },
      frames, board, flyer, desk, ring,
      v: raw.v,
      keys: Object.keys(raw).sort(),
      savedLook: raw.player.look,
    };
  });
  expect(report.problems).toEqual([]);
  expect(report.pal.problems).toEqual([]);
  const worst = {};
  for (const fr of report.pal.frames) {
    const share = fr.op ? fr.q / fr.op : 0;
    if (!worst[fr.name] || share > worst[fr.name].share) worst[fr.name] = { share, band: fr.band };
    if (fr.band < (worst[fr.name].minBand == null ? 99 : worst[fr.name].minBand)) worst[fr.name].minBand = fr.band;
    else if (worst[fr.name].minBand == null) worst[fr.name].minBand = fr.band;
  }
  for (const [name, row] of Object.entries(worst)) {
    let min = 99;
    for (const fr of report.pal.frames) if (fr.name === name && fr.band < min) min = fr.band;
    expect(min, name + ' soot band').toBeGreaterThanOrEqual(6);
    const cap = name === 'associate' ? 0.035 : 0.017;
    expect(row.share, name + ' Q').toBeLessThanOrEqual(cap);
  }
  expect(report.look).toEqual({ outfitCol: 't', accent: 'r', accessory: 'none', hem: null });
  expect(report.pal.defaults).toEqual({ outfitCol: 't', accent: 'r', accessory: 'none' });
  expect(report.pal.outfitCol).not.toContain('V');
  expect(report.pal.accent).not.toContain('Q');
  expect(report.pal.accent).not.toContain('N');
  expect(report.pal.holderOutfit).toBe('c');
  expect(report.savedLook).toEqual(save.player.look);
  expect(report.v).toBe(2);
  expect(report.keys).toEqual(beforeKeys);
  for (const frame of report.frames) {
    expect(frame['#c81818']).toBe(4);
    expect(frame['#a7f070']).toBeGreaterThan(0);
    expect(frame['#f4f4f4']).toBeGreaterThan(0);
    expect(frame['#ffcd75']).toBeGreaterThan(0);
  }
  expect(report.board['#960e16']).toBeGreaterThan(0);
  expect(report.board['#c81818'] || 0).toBe(0);
  expect(report.board['#ffcd75']).toBeGreaterThan(0);
  expect(report.flyer['#c81818'] || 0).toBe(0);
  expect(report.flyer['#960e16']).toBeGreaterThan(0);
  expect(report.desk['#c81818'] || 0).toBe(0);
  expect(report.desk['#960e16']).toBeGreaterThan(0);
  expect(report.desk['#18140f']).toBeGreaterThan(0);
  for (const frame of report.ring) {
    expect(frame['#c81818']).toBeGreaterThan(0);
    expect(frame['#ffcd75']).toBeGreaterThan(0);
  }
});

test('the legend is two sentences, each on its own line, and the hold label stays ice', async ({ page }) => {
  const save = starterSave();
  save.flags['story.side_pick_done'] = true;
  save.settings.follower = false;
  await boot(page, save, '');
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => !document.querySelector('#mapBtn').classList.contains('off'));
  await page.locator('#mapBtn').click();
  await page.waitForSelector('#ovMap:not([hidden])');
  await page.locator('#mapLevelRegion').click();
  const note = await page.evaluate(() => {
    const el = document.querySelector('.map-key-note');
    const lines = [];
    for (const n of el.childNodes) {
      if (n.nodeType !== 3) continue;
      const text = n.textContent.trim();
      if (!text) continue;
      const r = document.createRange();
      r.selectNodeContents(n);
      lines.push({ text, w: r.getBoundingClientRect().width });
    }
    const probe = document.createElement('p');
    probe.className = 'map-hold hold-glimmer';
    probe.textContent = 'Glimmerwell';
    document.body.appendChild(probe);
    const hold = getComputedStyle(probe).color;
    const sw = getComputedStyle(document.querySelector('.sw-glimmer'));
    probe.remove();
    return { lines, box: el.clientWidth, h: el.getBoundingClientRect().height, hold, sw: sw.backgroundColor, ring: sw.boxShadow };
  });
  expect(note.lines.map(l => l.text)).toEqual(['Gold and green: Keeper roofs.', 'Red and black: Glimmerwell ground.']);
  for (const line of note.lines) expect(line.w).toBeLessThanOrEqual(note.box);
  expect(note.h).toBeLessThanOrEqual(40);
  expect(note.hold).toBe(ICE);
  expect(note.sw).toBe(WINE);
  expect(note.ring).toContain('26, 28, 44');
});

test('a lanyard accent clamps on screen only and standing tint still wins', async ({ page }) => {
  const save = starterSave();
  save.settings.follower = false;
  save.player.look = { skin: '3', hair: 'short', hairCol: 'p', outfit: 'coat', outfitCol: 't', accent: 'r', accessory: 'lanyard' };
  save.flags['story.side'] = 'glimmer';
  save.flags['story.side_pick_done'] = true;
  save.standing = { keepers: 0, glimmer: 0 };
  const before = JSON.parse(JSON.stringify(save));
  await boot(page, save);
  const got = await page.evaluate(() => {
    const tier0 = PixelPets.keeper.look.accent;
    PixelPets.state.standing.glimmer = 10;
    const tier1 = PixelPets.keeper.look.accent;
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { tier0, tier1, saved: raw.player.look, keys: Object.keys(raw).sort(), v: raw.v };
  });
  expect(got.tier0).toBe('N');
  expect(got.tier1).toBe('c');
  expect(got.saved.accent).toBe('r');
  expect(got.saved.accessory).toBe('lanyard');
  expect(got.saved.outfitCol).toBe('t');
  expect(got.v).toBe(2);
  expect(got.keys.sort()).toEqual(Object.keys(before).sort());
});

test('reduced motion still passes the palette check', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const save = starterSave();
  save.settings.follower = false;
  await boot(page, save);
  const got = await page.evaluate(() => ({
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    palette: PixelPets.devChecks().palette,
  }));
  expect(got.reduce).toBe(true);
  expect(got.palette).toEqual([]);
});
