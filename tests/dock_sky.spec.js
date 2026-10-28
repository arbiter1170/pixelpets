// D858 dock sky (Vincent, Oct 27, 2026): day/night and weather between MAP and the partner buttons, never over a button.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save(arcade) {
  const s = starterSave();
  s.settings.controls = arcade ? 'arcade' : 'modern';
  s.settings.follower = false;
  s.settings.tips = false;
  s.flags['story.phone_got'] = true;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  return s;
}

async function boot(page, arcade) {
  await installSave(page.context(), save(arcade), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

// Glyph, temperature and the two neighbours, in CSS px. A hidden part is null.
function readSky(page) {
  return page.evaluate(() => {
    const r = sel => { const e = document.querySelector(sel); if (!e || !e.offsetParent) return null; const b = e.getBoundingClientRect(); return b.width ? { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height } : null; };
    const sky = document.querySelector('#fcSky');
    return { shown: !!sky && !sky.hidden && !!sky.offsetParent, label: sky ? sky.getAttribute('aria-label') : '', glyph: r('#fcSkyGlyph'), temp: r('#fcSkyTemp'),
      map: r('#mapBtn'), heart: r('#petFloat'), chipGlyph: r('#thChip #clockGlyph'), chipTemp: r('#thChip #thTemp') };
  });
}

function clear(d) {
  const parts = [d.glyph, d.temp].filter(Boolean);
  for (const p of parts) {
    expect(p.l).toBeGreaterThanOrEqual(d.map.r + 2);
    expect(p.r).toBeLessThanOrEqual(d.heart.l - 2);
  }
}

test('dock sky: glyph between MAP and the heart, 2 px clear, with no weather', async ({ page }) => {
  test.skip(page.viewportSize().width > page.viewportSize().height, 'dock is portrait only');
  await boot(page);
  await page.waitForFunction(() => document.body.classList.contains('mhc-frame') && !document.querySelector('#fcSky').hidden);
  const d = await readSky(page);
  expect(d.shown).toBe(true);
  expect(d.glyph.w).toBe(16);
  expect(d.glyph.h).toBe(16);
  clear(d);
  expect(d.label).toMatch(/^(Dawn|Day|Dusk|Night)$/);
  expect(d.temp).toBeNull();
});

test('dock sky: weather shows its glyph, and the temperature only where it fits', async ({ page }) => {
  test.skip(page.viewportSize().width > page.viewportSize().height, 'dock is portrait only');
  await boot(page);
  await page.evaluate(() => PixelPets.setEnv({ tags: ['rain'], temp: 12 }));
  await page.waitForFunction(() => /12/.test(document.querySelector('#fcSky').getAttribute('aria-label') || ''));
  const d = await readSky(page);
  expect(d.label).toMatch(/^(Rain|Night), 12°$/);
  clear(d);
  if (page.viewportSize().width >= 375) expect(d.temp).not.toBeNull();
  else expect(d.temp).toBeNull();   // 320: the 16 px glyph fills the gap; the temperature stays off
  // The chip's own glyph and temperature stay off under the dock (the sky has its slot).
  expect(d.chipGlyph).toBeNull();
  expect(d.chipTemp).toBeNull();
});

test('dock sky: arcade has no dock and no sky slot', async ({ page }) => {
  await boot(page, true);
  const d = await readSky(page);
  expect(d.shown).toBe(false);
});
