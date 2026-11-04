/* PUBLIC_LORE_SCRUB (Vincent, Tue Nov 3, 2026): three live text fixes that ship with the public-repo lore scrub.
   1. Master Fen's Glimmer-pick line drops "After last night," (the crackdown night is not on main yet; PR #288 brings it back).
   2. The Glimmerwell Associate in the Fernbrook plaza walks a Loamlet (mole/0, the Fernbrook Lantern House's Burrsnout line),
      not a Bitlet: Bitlet stays in the RegenX lab.
   3. The Brinewick lanyard story no longer says Master Marisol keeps her own Seal (Glimmer holders who beat her earn it).
   Runs at 320, 375 and 390 with reduced motion. Zero console errors (trackErrors). Save stays pixelpets.save.v2, v 2, no new keys. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const FEN_LINE = "Go on, then. You won my Seal fairly. I can't say you're wrong.";
const MARISOL_LINE = "Master Marisol's Seal went to the holder, lanyard clipped to it. Output was ours. Have a bright day!";

function save() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  Object.assign(s.flags, {
    'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true,
    'story.unlock_sides': true, 'story.unlock_rep': true, 'story.unlock_phone': true,
  });
  s.world = { map: 'fernbrook', x: 27, y: 12, facing: 'down', respawn: 'hearthmoor' };
  return s;
}

async function boot(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => { PixelPets.clock.set('tue', 10, 0); PixelPets.showTab('walk'); PixelPets.clearWild(); });
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

const saved = (page) => page.evaluate(() => {
  const r = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
  return { v: r.v, keys: Object.keys(r).sort(), flags: Object.keys(r.flags).sort() };
});

test("Fen's Glimmer-pick line has no crackdown reference yet", async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const swaps = MAPDATA.detail_zz_day1.lineSwaps.filter((s) => s.scene === 'orchard@glimmer' && s.when === 'story.seal1');
    return { to: swaps.map((s) => s.to), raw: JSON.stringify(MAPDATA.detail_zz_day1) };
  });
  expect(r.to).toContainEqual([['say', 'Master Fen', FEN_LINE]]);
  expect(r.raw).not.toContain('After last night');
  expect(FEN_LINE.length).toBeLessThanOrEqual(110);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('the plaza Associate walks a Loamlet, and no npc outside the lab is a Bitlet', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.setFlag('story.reached_fernbrook', true));   // setFlag saves: the baseline is the game's own save
  const before = await saved(page);
  const r = await page.evaluate(() => {
    const o = WORLD.fernbrook.objs.find((n) => n.id === 'fbp_associate_pet');
    const byteNpcs = [];
    for (const [mid, m] of Object.entries(WORLD)) for (const n of m.objs || []) if (n.kind === 'npc' && n.pet === 'byte/0') byteNpcs.push(mid + ':' + n.id);
    return { name: o.name, pet: o.pet, real: !!BASE_STATS[o.pet], present: !!(PixelPets.objPos('fbp_associate_pet') || {}).present, byteNpcs };
  });
  expect(r).toMatchObject({ name: 'Loamlet', pet: 'mole/0', real: true, present: true });
  expect(r.byteNpcs).toEqual([]);
  // Talking to it still shows the shared Glimmerwell Walkling line, with no speaker label.
  expect(await page.evaluate(() => PixelPets.talkTo('fbp_associate_pet'))).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full, null, { timeout: 4000 });
  await expect(page.locator('#sbText')).toBeVisible();
  const line = await page.evaluate(() => ({ who: PixelPets.scene.who || '', text: PixelPets.scene.text }));
  expect(line.who).toBe('');
  expect(line.text).toMatch(/Glimmerwell/);
  expect(line.text).not.toMatch(/Bitlet/);
  await page.evaluate(() => PixelPets.endScene());
  await page.waitForFunction(() => !PixelPets.scene);
  await page.evaluate(() => PixelPets.setFlag('story.reached_fernbrook', true));
  const after = await saved(page);
  expect(after).toEqual(before);
  expect(after.v).toBe(2);
});

test("the Brinewick lanyard story gives Marisol's Seal to the holder", async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const st = MAPDATA.news.stories.find((s) => s.id === 'nw-brinewick-lanyard');
    return { body: st.body, raw: JSON.stringify(MAPDATA.news) };
  });
  expect(r.body).toContain(MARISOL_LINE);
  expect(r.raw).not.toMatch(/keeps her own Seal/);
  for (const b of r.body) expect(b.length).toBeLessThanOrEqual(110);
  const words = /\b(faint(ed)?|evolv\w*|coins?|appeared|trainers?)\b|go, [a-z]+!|\w+dex\b/i;
  for (const t of [FEN_LINE, MARISOL_LINE, 'Loamlet']) expect(t).not.toMatch(words);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
