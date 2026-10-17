/* Eight SuperGrok loops (D168, D169): catalog, shape, slot routing, and the debug Music row.
   Headless Chromium often leaves the AudioContext suspended. music() still returns true and
   records musicWant. When state is running after a tap, musicTrack must match; otherwise musicWant. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const NEW = ['trial', 'rival', 'hall', 'harbour', 'route3', 'lab', 'dream', 'episode_end'];
const STEPS = { trial: 16, rival: 16, hall: 8, harbour: 8, route3: 8, lab: 8, dream: 8, episode_end: 8 };

async function boot(page, search) {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, search);
  await page.waitForFunction(() => window.PixelPets && window.BUILD);
}

test('the eight loops are in the catalog and musicCheck is clean', async ({ page }) => {
  await boot(page, '');
  const got = await page.evaluate((ids) => ({
    check: PixelPets.musicCheck(),
    ids: PixelPets.musicIds(),
    v: PixelPets.state.v,
  }), NEW);
  expect(got.check).toEqual([]);
  expect(got.v).toBe(2);
  for (const id of NEW) expect(got.ids).toContain(id);
});

test('each new loop loads', async ({ page }) => {
  await boot(page, '');
  // The boot save is muted, and unlock ignores a tap while muted. Unmute first, then tap a visible control.
  await page.evaluate(() => { PPSound.setMuted(false); PPSound.setMusic(true, true); });
  await page.locator('#tabs button[data-tab="walk"]').click();
  const rows = await page.evaluate((ids) => ids.map((id) => {
    const ok = PPSound.music(id);
    return { id, ok, track: PPSound.musicTrack, want: PPSound.musicWant, state: PPSound.state };
  }), NEW);
  for (const row of rows) {
    expect(row.ok, row.id).toBe(true);
    if (row.state === 'running') expect(row.track, row.id).toBe(row.id);
    else expect(row.want, row.id).toBe(row.id);
  }
});

test('each new loop has eight bars, in-range notes, and drum letters', async ({ page }) => {
  await boot(page, '');
  const rows = await page.evaluate((ids) => {
    const sum = (notes) => notes.reduce((s, n) => s + n[1], 0);
    const notesOk = (notes) => notes.every((n) => n[0] === 0 || (n[0] >= 36 && n[0] <= 96));
    return ids.map((id) => {
      const t = PPSound.musicSpec(id);
      return {
        id,
        bars: t && t.bars,
        steps: t && t.stepsPerBar,
        lead: t && sum(t.lead.notes),
        bass: t && sum(t.bass.notes),
        leadOk: !!(t && notesOk(t.lead.notes)),
        bassOk: !!(t && notesOk(t.bass.notes)),
        drumsOk: !!(t && t.drums.length === t.bars && t.drums.every((bar) => /^[ksh.]+$/.test(bar) && bar.length === t.stepsPerBar)),
      };
    });
  }, NEW);
  for (const row of rows) {
    const steps = STEPS[row.id];
    expect(row.bars, row.id).toBe(8);
    expect(row.steps, row.id).toBe(steps);
    expect(row.lead, row.id).toBe(8 * steps);
    expect(row.bass, row.id).toBe(8 * steps);
    expect(row.leadOk, row.id).toBe(true);
    expect(row.bassOk, row.id).toBe(true);
    expect(row.drumsOk, row.id).toBe(true);
  }
});

test('Hall leaders, Rook, the halls, the lab, and the dream rooms take the new loops', async ({ page }) => {
  await boot(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true);
  const got = await page.evaluate(() => {
    const battle = (id) => PixelPets.battleTrack('trainer', id);
    const map = (id) => PixelPets.mapTrack(id);
    const keepers = {
      fen: battle('hall1_fen'),
      hale: battle('hall2_hale'),
      fenVar: battle('hall1_fen@glimmer'),
      haleVar: battle('hall2_hale@glimmer'),
      r1: battle('rival1_rook'),
      r2: battle('rival2_rook'),
      r3: battle('rival3_rook'),
      lead: battle('r2_lead'),
      cc: map('cc_hall_in'),
      fb: map('fb_hall_in'),
      lab: ['rx_f1', 'rx_f2', 'rx_f3', 'rx_f4', 'sm_yard'].map(map),
      dreams: ['dream_2004', 'dream_party', 'dream_drive'].map(map),
      hearth: map('hearthmoor'),
      route2: map('route2'),
      hc: map('highcharity'),
      event: map('hc_hall_in'),
      den: map('sm_den'),
      hold: map('sm_hold'),
      tunnel: map('sm_tunnel'),
    };
    PixelPets.setSide('glimmer');
    const glimmer = {
      fen: battle('hall1_fen'),
      hale: battle('hall2_hale'),
      r1: battle('rival1_rook'),
      r2: battle('rival2_rook'),
      r3: battle('rival3_rook'),
      lead: battle('r2_lead'),
      hearth: map('hearthmoor'),
      den: map('sm_den'),
      event: map('hc_hall_in'),
      route2: map('route2'),
      cc: map('cc_hall_in'),
      yard: map('sm_yard'),
    };
    PixelPets.setSide('keepers');
    PixelPets.setFlag('music.glimmer_fought', false);
    const started = PixelPets.forceTrainer('rival2_rook');
    return {
      keepers,
      glimmer,
      started: started === true,
      fought: !!PixelPets.state.flags['music.glimmer_fought'],
      want: PPSound.musicWant,
    };
  });
  expect(got.keepers.fen).toBe('trial');
  expect(got.keepers.hale).toBe('trial');
  expect(got.keepers.fenVar).toBe('trial');
  expect(got.keepers.haleVar).toBe('trial');
  expect(got.keepers.r1).toBe('rival');
  expect(got.keepers.r2).toBe('rival');
  expect(got.keepers.r3).toBe('rival');
  expect(got.keepers.lead).toBe('glimmer_first');
  expect(got.keepers.cc).toBe('hall');
  expect(got.keepers.fb).toBe('hall');
  expect(got.keepers.lab).toEqual(['lab', 'lab', 'lab', 'lab', 'lab']);
  expect(got.keepers.dreams).toEqual(['dream', 'dream', 'dream']);
  expect(got.keepers.hearth).toBe('town');
  expect(got.keepers.route2).toBe('route');
  expect(got.keepers.hc).toBe('charity');
  expect(got.keepers.event).toBe('arcade');
  expect(got.keepers.den).toBe('town');
  expect(got.keepers.hold).toBe('town');
  expect(got.keepers.tunnel).toBe('town');
  expect(got.glimmer.fen).toBe('trial');
  expect(got.glimmer.hale).toBe('trial');
  expect(got.glimmer.r1).toBe('rival');
  expect(got.glimmer.r2).toBe('rival');
  expect(got.glimmer.r3).toBe('rival');
  expect(got.glimmer.lead).toBe('battle');
  expect(got.glimmer.hearth).toBe('town_glimmer');
  expect(got.glimmer.den).toBe('town_glimmer');
  expect(got.glimmer.event).toBe('arcade');
  expect(got.glimmer.route2).toBe('route');
  expect(got.glimmer.cc).toBe('hall');
  expect(got.glimmer.yard).toBe('lab');
  expect(got.started).toBe(true);
  expect(got.fought).toBe(false);
  expect(got.want).toBe('rival');
});

test('the debug Music row lists the eight new loops, and only in a debug session', async ({ page }) => {
  await boot(page, '');
  expect(await page.evaluate(() => !!document.querySelector('#dbgMusic'))).toBe(false);
  await page.goto('/?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  expect(await page.evaluate(() => !!document.querySelector('#dbgMusic'))).toBe(false);
  await page.locator('#dbgTag').click();
  await expect(page.locator('#dbgMusic')).toBeVisible();
  const ids = await page.locator('#dbgMusicId option').evaluateAll((opts) => opts.map((o) => o.value));
  expect(ids.slice(0, NEW.length)).toEqual(NEW);
  for (const id of ['town', 'route', 'battle', 'grove']) expect(ids).toContain(id);
  const play = await page.locator('#dbgMusicPlay').boundingBox();
  const back = await page.locator('#dbgMusicBack').boundingBox();
  expect(play.height).toBeGreaterThanOrEqual(44);
  expect(play.width).toBeGreaterThanOrEqual(44);
  expect(back.height).toBeGreaterThanOrEqual(44);
  expect(back.width).toBeGreaterThanOrEqual(44);
  await page.locator('#dbgMusicId').selectOption('harbour');
  await page.locator('#dbgMusicPlay').click();
  expect(await page.evaluate(() => PPSound.musicWant)).toBe('harbour');
  await page.locator('#dbgMusicBack').click();
  expect(await page.evaluate(() => PPSound.musicWant)).toBe('town');
  await page.locator('#dbgMusic').scrollIntoViewIfNeeded();
  if (page.viewportSize().width === 390) await shot(page, 'debug-music');
});
