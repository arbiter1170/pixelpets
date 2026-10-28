// Phone apps part 1 (Vincent, Oct 28, 2026; D859-D863): Rematch Line in CONTACTS, FIELD NOTES in NOTES, SKY (Far Sky +
// Night Desk) and GLOW (care monitor + Lantern Pass). Both handsets read the same facts in their own voice. Save stays v2.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function readySave(extra) {
  const s = starterSave();
  s.settings.tips = false;
  Object.assign(s.flags, {
    'story.tutorial_done': true, 'story.phone_got': true, 'story.reached_route1': true,
    'story.rival1_done': true, 'trainer.route1_pia': true, 'rematch.route1_pia': true,
  }, extra || {});
  s.world = { map: 'route1', x: 8, y: 9, facing: 'down', respawn: 'hearthmoor' };
  return s;
}

async function boot(page, extra) {
  await installSave(page.context(), readySave(extra), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function openApp(page, app) {
  if (await page.locator('#ovPhone').isHidden()) await page.locator('#phoneBtn').click();
  else await page.locator('#phoneBack').click();
  await expect(page.locator('#phoneHome')).toBeVisible();
  await page.locator(`.phone-app[data-app="${app}"]`).click();
  await expect(page.locator('#phonePane')).toBeVisible();
}

async function hack(page) {
  await page.evaluate(() => { PixelPets.giveItem('cracked_phone', 1); PixelPets.setSide('glimmer'); PixelPets.showTab('walk'); });
}

test('the home grid has SKY and GLOW, fits the phone, and every glyph paints', async ({ page }) => {
  await boot(page);
  await page.locator('#phoneBtn').click();
  const apps = await page.locator('#phoneHome .phone-app').evaluateAll(els => els.map(el => el.dataset.app));
  expect(apps.slice(-2)).toEqual(['sky', 'glow']);
  const fit = await page.evaluate(() => {
    const shell = document.querySelector('#ovPhone .phone-shell'), home = document.querySelector('#phoneHome');
    const painted = [...document.querySelectorAll('#phoneHome .phone-glyph canvas')].every(c => c.getContext('2d').getImageData(0, 0, 8, 8).data.some((v, i) => i % 4 === 3 && v > 0));
    const small = [...document.querySelectorAll('#phoneHome .phone-app')].filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length;
    return { x: shell.scrollWidth <= shell.clientWidth + 1 && home.scrollWidth <= home.clientWidth + 1, painted, small };
  });
  expect(fit).toEqual({ x: true, painted: true, small: 0 });
});

test('Rematch Line: a pending rematch shows READY and the relay line, in each handset voice @w1', async ({ page }) => {
  await boot(page);
  await openApp(page, 'contacts');
  const row = page.locator('.contact-row', { has: page.locator('.contact-ready') });
  await expect(row).toHaveCount(1);
  await row.locator('.contact-main').click();
  await expect(page.locator('.contact-card .contact-ready')).toHaveText('READY');
  await expect(page.locator('.contact-card .contact-line')).toHaveText(/^Lantern desk relay: Back for more\? My kites are still up, .+!$/);
  await page.locator('#phoneClose').click();
  await hack(page);
  await openApp(page, 'contacts');
  await page.locator('.contact-row', { has: page.locator('.contact-ready') }).locator('.contact-main').click();
  await expect(page.locator('.contact-card .contact-line')).toHaveText(/^Intercepted: /);
});

test('Rematch Line: no READY while the party still needs a rest, or once the rematch is spent @w1', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { const S = PixelPets.state; S.party[0].hpNow = 1; S.world.restDue = true; });   // a worn-out party: restDue holds while someone is hurt
  await openApp(page, 'contacts');
  await expect(page.locator('.contact-ready')).toHaveCount(0);
  await page.evaluate(() => { const S = PixelPets.state; delete S.party[0].hpNow; delete S.world.restDue; PixelPets.setFlag('rematch.route1_pia', false); });
  await openApp(page, 'contacts');
  await expect(page.locator('.contact-ready')).toHaveCount(0);
});

test('Field Notes: finished steps, newest first; the Keeper1 stamps COPIED, the cracked handset blacks words out', async ({ page }) => {
  await boot(page);
  await openApp(page, 'notes');
  const notes = page.locator('.phone-note');
  expect(await notes.count()).toBeGreaterThanOrEqual(2);
  await expect(notes.first().locator('.phone-note-stamp')).toHaveText('COPIED');
  const plain = await notes.first().locator('.phone-note-text').textContent();
  expect(plain).not.toContain('█');
  await page.locator('#phoneClose').click();
  await hack(page);
  await openApp(page, 'notes');
  await expect(page.locator('.phone-note').first().locator('.phone-note-stamp')).toHaveText('REDACTED BY SENDER');
  expect(await page.locator('.phone-note-text').allTextContents()).toContainEqual(expect.stringContaining('█'));
});

test('SKY: hour, sky and a forecast line; the late hours add the night line and a Night Desk post on Ribbit', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.clock.set('tue', 14, 0));
  await openApp(page, 'sky');
  await expect(page.locator('.sky-hour')).toHaveText(/^Tuesday, 14:00, /);
  await expect(page.locator('.sky-now')).toBeVisible();
  await expect(page.locator('.sky-stir')).toBeVisible();
  await expect(page.locator('.sky-night')).toHaveCount(0);
  await expect(page.locator('.sky-foot')).toHaveText('Keepers forecast. Walk kindly.');
  await openApp(page, 'ribbit');
  await expect(page.locator('.ribbit-handle', { hasText: '@nightdesk' })).toHaveCount(0);
  await page.evaluate(() => PixelPets.clock.set('tue', 23, 0));
  await openApp(page, 'sky');
  await expect(page.locator('.sky-night')).toHaveText('Late hours. Let your Walkling sleep.');
  await openApp(page, 'ribbit');
  await expect(page.locator('.ribbit-handle', { hasText: '@nightdesk' })).toHaveCount(1);
});

test('GLOW: partner stats, bond, calm advice, and the Lantern House that wakes you, in each voice', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { const S = PixelPets.state, p = S.party.find(q => q.id === S.partnerId); p.hunger = 20; p.happy = 90; p.energy = 90; });
  await openApp(page, 'glow');
  await expect(page.locator('.glow-stats')).toHaveText(/^Food 20 {2}Joy 90 {2}Energy 90$/);
  await expect(page.locator('.glow-advice')).toHaveText('Lantern desk: A snack would help.');
  await expect(page.locator('.glow-lantern')).toHaveText("You wake at Hearthmoor's Lantern House.");
  await expect(page.locator('.glow-bed')).toHaveText('Beds are open to every holder.');
  await page.locator('#phoneClose').click();
  await hack(page);
  await openApp(page, 'glow');
  await expect(page.locator('.glow-advice')).toHaveText('Glimmerwell: Unit output: dipping. Refuel recommended.');
  await expect(page.locator('.glow-bed')).toHaveText('Beds open to all. Rest restores your units.');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')).v)).toBe(2);
});

// Rule 10 and D863: placeholder lines state only known facts. Every Lantern House has beds at every standing tier,
// and no line hints at unbuilt plans (Rain Pause, augments) or a new glow fact.
const NOT_CANON = /Doorway only|held for you|pause for that|Augment|glow levels|Glow is rising|shares a little glow|glow up/i;

test('GLOW: beds are open at every Keepers tier, in both voices (rule 10)', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.setStanding('keepers', 50));
  expect(await page.evaluate(() => PixelPets.standing.keepers.tier)).toBeGreaterThanOrEqual(2);
  await openApp(page, 'glow');
  await expect(page.locator('.glow-bed')).toHaveText('Beds are open to every holder.');
  await page.locator('#phoneClose').click();
  await hack(page);
  await openApp(page, 'glow');
  await expect(page.locator('.glow-bed')).toHaveText('Beds open to all. Rest restores your units.');
});

test('SKY, GLOW, the shelf and the Night Desk carry no placeholder hints, day or night, in either voice', async ({ page }) => {
  await boot(page);
  const read = async () => {
    const out = [];
    for (const app of ['sky', 'glow', 'jobs', 'ribbit']) { await openApp(page, app); out.push(app + ': ' + await page.locator('#phoneBody').innerText()); }
    await page.locator('#phoneClose').click();
    return out.join('\n');
  };
  await page.evaluate(() => PixelPets.clock.set('tue', 23, 0));
  const keeper = await read();
  expect(keeper).toContain('@nightdesk');
  expect(keeper).not.toMatch(NOT_CANON);
  await hack(page);
  const hacked = await read();
  expect(hacked).toContain('Night readings logged.');
  expect(hacked).toContain('The leak is not a menu.');
  expect(hacked).not.toMatch(NOT_CANON);
});
