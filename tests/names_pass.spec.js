/* NAMES_PASS (design specs/NAMES_PASS.md, D1730-D1769, settled by Vincent, Wed Nov 4, 2026): the placeholder-names pass.
   A rename is display only (D1768): the cast `label`, or `rank` + `given` for a ranked Keeper, in data/reputation.json, plus
   every line that says the old name. Ids, cast keys, S.rep keys, phone-book keys, flags and save keys never change. The save
   stays pixelpets.save.v2, v 2, with no new field; an old save from before the pass loads and shows the new names.
   Runs at 320, 375 and 390 with reduced motion; every test fails on a console error. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

// Raw speaker name (the key, unchanged) -> the name the player now sees.
const RENAMED = {
  'Vincent Chi': 'Jacob Chi',                // D1730
  'Warden Teodor': 'Sergeant Teodor',        // D1731
  'Keeper Amos': 'Host Amos',                // D1732
  'Keeper Marigold': 'Tailor Marigold',      // D1733
  'Keeper Teague': 'Grocer Teague',          // D1734
  'Keeper Quill': 'Grocer Quill',            // D1734
  'Keeper Halvard': 'Pedlar Halvard',        // D1735
  'Watch Saffie': 'Trader Saffie',           // D1736
  'Keeper Rowan': 'Sergeant Hume',           // D1737
  Constable: 'Constable Tarn',               // D1738 (the six Fernbrook plaza bodies)
  Sergeant: 'Sergeant Coyle',
  Cadet: 'Cadet Ewan',
  Associate: 'Associate Sabeth',
  'Bright Lead': 'Bright Lead Avery',
  'Junior Bright': 'Junior Bright Kip',
  'Dr. Ivo': 'Dr. Weller',                   // D1766
  'Teller Ivo': 'Teller Bodin',
  'Constable Rue': 'Constable Thale',
  'Dockhand Ness': 'Dockhand Garrick',
  'Sergeant Bram': 'Sergeant Drummond',
  'Porter Bram': 'Porter Dunmore',
  'Clerk Nia': 'Clerk Elda',
  'Porter Quin': 'Porter Aldous',
  Wynne: 'Brisa',
  Brin: 'Tove',
  Wren: 'Tilly',                             // D1767
  'Host Ines': 'Host Maudie',
  'Floor Keeper Sol': 'Floor Keeper Anselm',
  'Grete Ash': 'Grete Lindqvist',
};
// The namesakes each rename was made for keep their names.
const KEPT = {
  'Watch Ivo': 'Constable Ivo', 'Operator Rue': 'Officer Rue', 'Officer Ness': 'Officer Ness', Nia: 'Nia',
  'Mara Quill': 'Mara Quill', 'Keeper Moss': 'Constable Moss', 'Clerk Wynn': 'Officer Wynn', 'Host Della': 'Host Della',
};
// Old shown names that must not come back anywhere the player reads a name.
const OLD_SHOWN = ['Vincent Chi', 'Warden Teodor', 'Keeper Amos', 'Keeper Marigold', 'Keeper Teague', 'Keeper Quill',
  'Keeper Halvard', 'Watch Saffie', 'Sergeant Rowan', 'Sergeant Bram', 'Constable Rue', 'Clerk Nia', 'Host Ines'];

function save(flags, extra) {
  const s = starterSave();
  s.settings.tips = false;
  s.settings.follower = false;
  Object.assign(s.flags, flags || {});
  if (extra) Object.assign(s, extra);
  return s;
}

// An old save from before the pass: contacts and trust under the raw names, as build 20261103-1747 wrote them.
const OLD_MET = ['Vincent Chi', 'Keeper Amos', 'Keeper Marigold', 'Keeper Teague', 'Keeper Quill', 'Sergeant Bram', 'Wren',
  'Officer Ness'];
function oldSave() {
  const met = {}, rep = {};
  OLD_MET.forEach((n, i) => { met[n] = true; rep[n] = 52 + i; });
  return save({ 'story.phone_got': true, 'story.warden_met': true, 'story.lizzy_met': true },
    { rep, phoneBook: { met, fav: { 'Vincent Chi': true } } });
}

async function boot(page, s) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

// One say step; returns the speaker tab text and whether it fits on screen.
async function speaker(page, who, line) {
  expect(await page.evaluate(([w, l]) => PixelPets.runSteps([['say', w, l]]), [who, line || 'Hello.'])).toBe(true);
  await page.waitForFunction(() => !!(window.PixelPets.scene && window.PixelPets.scene.full));
  await expect(page.locator('#sbWho')).toBeVisible();
  const text = await page.locator('#sbWho').textContent();
  const fits = await page.locator('#sbWho').evaluate((el) => el.scrollWidth <= el.clientWidth + 1 && el.getBoundingClientRect().right <= window.innerWidth);
  return { text, fits };
}

async function talkWho(page, id) {
  expect(await page.evaluate((oid) => PixelPets.talkTo(oid), id), id).toBe(true);
  await page.waitForFunction(() => { const s = window.PixelPets.scene; return s && (s.mode === 'choice' || s.full); });
  await expect(page.locator('#sbWho')).toBeVisible();
  return page.locator('#sbWho').textContent();
}

test('every renamed person shows the new name in the dialog speaker tab; the namesakes keep theirs', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  for (const [raw, shown] of Object.entries(Object.assign({}, RENAMED, KEPT))) {
    const got = await speaker(page, raw);
    expect(got.text, raw).toBe(shown);
    expect(got.fits, raw + ' fits the speaker tab').toBe(true);
    await page.evaluate(() => PixelPets.endScene());
  }
  // The six plaza bodies are named now (D1738 answers D1245). Only POST_TRIAL_CRACKDOWN's unnamed Commander and Officer
  // (#288, D1198) stay pending: their names (D1740, D1744) are not built on main yet.
  const c = await page.evaluate(() => PixelPets.rankCheck());
  expect(c.placeholders.sort()).toEqual(['Commander (D1198)', 'Officer (D1198)']);
  expect(c.missing).toEqual([]);
  expect(c.bad).toEqual([]);
});

test('real talks: Host Amos at the Lantern House, Jacob Chi in the weir hut, Grocer Teague at the counter', async ({ page }) => {
  // story.chi_met: past ACT1_KEEPER_JOIN's first-step meeting (#303, T2), so a talk with the hut NPC is his own line.
  await boot(page, save({ 'story.warden_met': true, 'story.chi_met': true }));
  await page.evaluate(() => { PixelPets.clock.set('tue', 12, 0); PixelPets.clock.freeze(true); });
  await page.evaluate(() => PixelPets.goto('fb_lantern_in', 6, 4, 'up'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  expect(await talkWho(page, 'amos')).toBe('Host Amos');
  await page.evaluate(() => PixelPets.endScene());
  await page.evaluate(() => PixelPets.goto('hw_weir_hut_in', 4, 7, 'up'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  expect(await talkWho(page, 'chi_hut')).toBe('Jacob Chi');
  await shot(page, 'names-pass-jacob-chi');
  await page.evaluate(() => PixelPets.endScene());
  await page.evaluate(() => PixelPets.goto('hm_store', 2, 4, 'up'));
  await page.waitForFunction(() => !window.PixelPets.fading);
  expect(await page.evaluate(() => PixelPets.mapInfo.objs.map((o) => o.id))).toContain('hm_teague');
  const raw = await page.evaluate(() => MAPDATA.detail_zz_market.maps.hm_store.objs.find((o) => o.id === 'hm_teague').name);
  expect(raw).toBe('Keeper Teague');   // the raw name (the key) is unchanged
  expect(await talkWho(page, 'hm_teague')).toBe('Grocer Teague');
  await page.evaluate(() => PixelPets.endScene());
  expect(await page.evaluate(() => PixelPets.shownName('Keeper Teague'))).toBe('Grocer Teague');
  // The Fernbrook Lantern House door keeps the raw "Keeper Amos" (verbatim design data); it reaches the player through
  // the cast label, so the door's speaker reads Host Amos too.
  const door = await page.evaluate(() => MAPDATA.maps_slice.maps.fernbrook.objs.find((o) => o.id === 'fb_lantern').keeper);
  expect(door).toBe('Keeper Amos');
  expect(await page.evaluate((d) => PixelPets.shownName(d), door)).toBe('Host Amos');
});

test('an old save loads: the phone book, whereabouts and Standing show the new names; trust and contacts stay put', async ({ page }) => {
  await boot(page, oldSave());
  await page.evaluate(() => { PixelPets.clock.set('tue', 12, 0); PixelPets.clock.freeze(true); });
  // Phone book: the contacts stay on the raw keys (the favourite too) ...
  const people = await page.evaluate(() => PixelPets.contacts());
  const keys = people.map((p) => p.name);
  for (const n of OLD_MET) expect(keys, n).toContain(n);
  expect(people.find((p) => p.name === 'Vincent Chi').fav).toBe(true);
  // ... and the list shows the new names.
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const shownList = await page.locator('.contact-name').allTextContents();
  for (const n of OLD_MET) expect(shownList, n).toContain(RENAMED[n] || n);
  for (const n of OLD_SHOWN) expect(shownList).not.toContain(n);
  const chi = page.locator('.contact-name', { hasText: 'Jacob Chi' });
  await expect(chi).toBeVisible();
  await chi.click();
  await expect(page.locator('.contact-card-name')).toHaveText('Jacob Chi');
  const fits = await page.locator('.contact-card-name').evaluate((el) => el.getBoundingClientRect().right <= window.innerWidth);
  expect(fits).toBe(true);
  const phoneText = await page.locator('#ovPhone').innerText();
  for (const n of OLD_SHOWN) expect(phoneText).not.toContain(n);
  await shot(page, 'names-pass-contact-card');
  await page.locator('#phoneClose').click();
  // People (Standing tiers and whereabouts on each row).
  await page.locator('#repBtn').click();
  await expect(page.locator('#ovRep')).toBeVisible();
  const rows = await page.evaluate(() => [...document.querySelectorAll('#repList .rep-row')].map((row) => ({
    name: row.querySelector('.rep-name').textContent,
    tier: row.querySelector('.rep-tier').textContent,
    where: row.querySelector('.where-text') ? row.querySelector('.where-text').textContent : '',
  })));
  const byName = Object.fromEntries(rows.map((r) => [r.name, r]));
  for (const n of ['Vincent Chi', 'Keeper Amos', 'Keeper Teague', 'Keeper Quill', 'Sergeant Bram', 'Wren']) {
    expect(byName[RENAMED[n]], RENAMED[n] + ' listed').toBeTruthy();
    expect(byName[RENAMED[n]].tier).not.toBe('');
  }
  expect(byName['Grocer Teague'].where).toBe('Lamplight Provisions · AT WORK');
  expect(byName['Tilly'].where).toContain('Schoolhouse');
  const repText = await page.locator('#ovRep').innerText();
  for (const n of OLD_SHOWN) expect(repText).not.toContain(n);
  await shot(page, 'names-pass-people');
  // Whereabouts on the raw key still answer (keys never change).
  expect(await page.evaluate(() => PixelPets.whereNow('Keeper Marigold').place)).toBeTruthy();
  // Trust stayed on the raw keys.
  const rep = await page.evaluate((ns) => ns.map((n) => PixelPets.repGet(n)), OLD_MET);
  OLD_MET.forEach((n, i) => expect(rep[i], n).toBe(52 + i));
});

test('the save is unchanged: v 2, the same keys, raw names only, for a fresh save and an old one', async ({ page }) => {
  const SHOWN_NEW = Object.values(RENAMED).filter((n) => !['Brisa', 'Tove', 'Tilly'].includes(n));
  for (const [tag, s] of [['fresh', save()], ['old', oldSave()]]) {
    const before = JSON.parse(JSON.stringify(s));
    await boot(page, s);
    const raw = await page.evaluate(() => { PixelPets.repAdd('Keeper Amos', 0); return localStorage.getItem('pixelpets.save.v2'); });
    const after = JSON.parse(raw);
    expect(after.v, tag).toBe(2);
    for (const k of Object.keys(before)) expect(Object.keys(after), tag + ' keeps ' + k).toContain(k);
    if (before.phoneBook) {
      expect(Object.keys(after.phoneBook.met).sort(), tag).toEqual(Object.keys(before.phoneBook.met).sort());
      expect(Object.keys(after.phoneBook.fav).sort(), tag).toEqual(Object.keys(before.phoneBook.fav).sort());
    }
    for (const k of Object.keys(before.rep || {})) expect(after.rep[k], tag + ' rep ' + k).toBe(before.rep[k]);
    // Display only: no shown name is ever written to the save.
    for (const n of SHOWN_NEW) expect(raw, tag + ': ' + n).not.toContain(n);
    for (const k of Object.keys(after.rep || {})) expect(Object.values(RENAMED), tag + ' rep key ' + k).not.toContain(k);
    await page.evaluate(() => localStorage.clear());
  }
});
