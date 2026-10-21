/* ROOK_FORESHADOW: the doorstep lines render, both paths set story.slice_end once, and each new line fits one dialog page at 320. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const KEEPERS = [
  'You beat Fen? Me too! Well... almost.',
  'So. Being late on partner day. The jingle. The mint sticker. That was all one thing.',
  'Glimmerwell picked me for "Junior Bright". They asked in spring. I said yes that morning.',
  "Don't make the Lizzy face. It's clean energy, Tester. It's a real chance for me.",
  'And their crews cleared the rockslide overnight. Race you up Route 2!',
  'East of town, the Route 2 path is open.',
];

const GLIMMER = [
  "You got your Tier 1? Took you long enough. I'm going for Bright of the Month.",
  "Yeah, I'm in too. Since spring. Partner day, the jingle, the sticker: all them.",
  "Tobin's fast kid from your town? Me. I wanted to tell you myself. Too late, huh?",
  'Imogen says the Route 2 Census needs volunteers. First one there gets the good clipboard.',
  'Race you! ...Hey. Did those Pomlets look kind of grey to you? Never mind. Lighting.',
  'Route 2 is open now. Keep heading east!',
];

const OTHER = [
  "Hup, hup! Brighter by... warming up!",
  "Ilse's handing out partners today! Bet I get mine first. Somebody says I've got potential.",
  "Did I miss it? I got held up. Don't ask. Aw, you picked! Then I'll take... that one!",
  'Hey, wait up! Me and {rival} have been practising. Ten whole minutes. I had a coach.',
  "Okay, okay, you're good. Race you to Fernbrook! Somebody's waiting for me.",
  "Race you to Fernbrook! I'm meeting someone. Last one there feeds the other's Walkling!",
  'If you see Rook, tell him supper keeps. And that his friend in mint called again.',
  'A fast kid from your town said yes. Just saying.',
];

async function boot(page) {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
  await page.evaluate(() => document.fonts.ready);
}

async function readPage(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#sbText');
    const box = document.querySelector('#sbox');
    const r = box.getBoundingClientRect();
    return {
      textFits: el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1,
      onScreen: r.top >= -1 && r.bottom <= window.innerHeight + 1 && r.left >= -1 && r.right <= window.innerWidth + 1,
    };
  });
}

async function playSays(page) {
  const lines = [];
  const fits = [];
  for (let i = 0; i < 40; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      if (!s) return null;
      return { mode: s.mode, full: s.full, waiting: s.waiting, text: s.text };
    });
    if (!sc) return { lines, fits };
    if (sc.mode !== 'say') throw new Error('unexpected mode ' + sc.mode);
    if (!sc.waiting) { await page.waitForTimeout(30); continue; }
    if (!sc.full) {
      await page.keyboard.press('Space');
      await page.waitForFunction(() => {
        const s = window.PixelPets.scene;
        return s && s.full;
      });
      continue;
    }
    lines.push(sc.text);
    fits.push(await readPage(page));
    const prev = sc.text;
    await page.keyboard.press('Space');
    await page.waitForFunction((text) => {
      const s = window.PixelPets.scene;
      return !s || s.text !== text;
    }, prev);
  }
  throw new Error('scene did not end');
}

test('rook teaser lines render on both paths and set story.slice_end once', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  const before = await page.evaluate(() => {
    const count = (steps) => {
      let n = 0;
      const walk = (node) => {
        if (!Array.isArray(node)) return;
        if (node[0] === 'setFlag' && node[1] === 'story.slice_end') n += 1;
        node.forEach(walk);
      };
      walk(steps);
      return n;
    };
    return {
      v: PixelPets.state.v,
      side: PixelPets.sceneFor('teaser'),
      end: PixelPets.state.flags['story.slice_end'],
      keepers: count(MAPDATA.act1_route2.slicePatch.scenes.teaser),
      glimmer: count(MAPDATA.glimmer_path.scenes['teaser@glimmer']),
      checks: PixelPets.questCheck,
    };
  });
  expect(before.v).toBe(2);
  expect(before.side).toBe('teaser');
  expect(before.end).toBeUndefined();
  expect(before.keepers).toBe(1);
  expect(before.glimmer).toBe(1);
  expect(before.checks).toEqual([]);
  const live = await page.evaluate(() => ({
    rook: PixelPets.npcLine('rook_home'),
    tobin: MAPDATA.glimmer_path.scenes.side_pick[6][2],
  }));
  expect(live.rook).toBe("Ilse's handing out partners today! Bet I get mine first. Somebody says I've got potential.");
  expect(live.tobin).toBe('A fast kid from your town said yes. Just saying.');

  expect(await page.evaluate(() => PixelPets.runScene('teaser'))).toBe(true);
  const kept = await playSays(page);
  expect(kept.lines).toEqual(KEEPERS);
  for (const fit of kept.fits) {
    expect(fit.textFits).toBe(true);
    expect(fit.onScreen).toBe(true);
  }
  const mid = await page.evaluate(() => PixelPets.state.flags['story.slice_end']);
  expect(mid).toBe(true);

  await page.evaluate(() => {
    PixelPets.setFlag('story.slice_end', false);
    PixelPets.setSide('glimmer');
  });
  expect(await page.evaluate(() => PixelPets.sceneFor('teaser'))).toBe('teaser@glimmer');
  expect(await page.evaluate(() => PixelPets.runScene('teaser'))).toBe(true);
  const glim = await playSays(page);
  expect(glim.lines).toEqual(GLIMMER);
  for (const fit of glim.fits) {
    expect(fit.textFits).toBe(true);
    expect(fit.onScreen).toBe(true);
  }
  const after = await page.evaluate(() => ({
    end: PixelPets.state.flags['story.slice_end'],
    v: PixelPets.state.v,
    checks: PixelPets.questCheck,
  }));
  expect(after.end).toBe(true);
  expect(after.v).toBe(2);
  expect(after.checks).toEqual([]);

  if (page.viewportSize().width !== 320) return;
  for (const line of OTHER) {
    expect(await page.evaluate((text) => PixelPets.runSteps([['say', 'Rook', text]]), line)).toBe(true);
    const seen = await playSays(page);
    expect(seen.lines.length).toBe(1);
    expect(seen.fits[0].textFits).toBe(true);
    expect(seen.fits[0].onScreen).toBe(true);
  }
});
