/* NPC_RANKS (Vincent, Nov 2, 2026): every Keeper and Glimmerwell NPC shows rank, then name, wherever the name is shown.
   Display only: speaker strings in data, S.rep and S.phoneBook keys stay the raw names. One person, one name: old saves
   that met "Tobin" or "Hale" fold into "Associate Tobin" / "Master Hale" (copy only). Save stays pixelpets.save.v2, v 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function save(flags, extra) {
  const s = starterSave();
  s.settings.tips = false;
  s.settings.follower = false;
  Object.assign(s.flags, flags || {});
  if (extra) Object.assign(s, extra);
  return s;
}

async function boot(page, flags, extra) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(flags, extra), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

// One say step; returns the speaker tab text the dialog box shows.
async function speaker(page, who) {
  expect(await page.evaluate((w) => PixelPets.runSteps([['say', w, 'Hello.']]), who)).toBe(true);
  await page.waitForFunction(() => !!(window.PixelPets.scene && window.PixelPets.scene.full));
  await expect(page.locator('#sbWho')).toBeVisible();
  const out = await page.locator('#sbWho').textContent();
  const fits = await page.locator('#sbWho').evaluate((el) => el.scrollWidth <= el.clientWidth + 1 && el.getBoundingClientRect().right <= window.innerWidth);
  await page.evaluate(() => PixelPets.endScene());
  return { text: out, fits };
}

test('the dialog speaker tab shows rank, then name, and never a placeholder (Vincent decisions E, F, H)', async ({ page }) => {
  await boot(page);
  const want = {
    Fen: 'Master Fen', 'Master Fen': 'Master Fen', Hale: 'Master Hale', Marisol: 'Master Marisol',
    Tobin: 'Associate Tobin', Hollis: 'Associate Hollis', Quinn: 'Associate Quinn', Imogen: 'Field Lead Imogen',
    'Associate Juniper': 'Associate Juniper', 'Dorian Pell': 'Head of Acquisitions Dorian Pell',
    'Officer Ness': 'Officer Ness', 'Warden Ilse': 'Warden Ilse', 'Captain Lumen': 'Captain Lumen', 'Cadet Arlo': 'Cadet Arlo',
    // The D1159 ladder ranks (KEEPER_RANKS D893): a duty (Watch, Clerk, Archivist, Operator) moves to the contact card.
    'Watch Ivo': 'Constable Ivo', 'Clerk Wynn': 'Officer Wynn', 'Archivist Mo': 'Officer Mo', 'Operator Rue': 'Officer Rue',
    'Keeper Rowan': 'Sergeant Rowan', 'Keeper Pryce': 'Cadet Pryce', Sefton: 'Cadet Sefton', Ash: 'Cadet Sefton',
    // Hosts and shopkeepers are civilians: aligned to a side, never ranked, shown as before.
    'Keeper Amos': 'Keeper Amos', 'Keeper Quill': 'Keeper Quill', 'Watch Saffie': 'Watch Saffie', 'Host Della': 'Host Della',
    Mom: 'Mom', Morolow: 'Caleb', 'Clerk Nia': 'Clerk Nia',
  };
  for (const [raw, shown] of Object.entries(want)) {
    const got = await speaker(page, raw);
    expect(got.text, raw).toBe(shown);
    expect(got.fits, raw + ' fits the speaker tab').toBe(true);
  }
  await page.evaluate(() => PixelPets.runSteps([['say', 'Dorian Pell', 'Quarterly review.']]));
  await page.waitForFunction(() => !!(window.PixelPets.scene && window.PixelPets.scene.full));
  await shot(page, 'npc-ranks-speaker-dorian');
  await page.evaluate(() => PixelPets.endScene());
});

test('Rook: plain Rook, Junior Bright Rook with the lanyard, plain Rook once he quits (decision G)', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.shownName('Rook'))).toBe('Rook');
  await page.evaluate(() => PixelPets.setFlag('story.slice_end', true));
  expect(await page.evaluate(() => PixelPets.shownName('Rook'))).toBe('Junior Bright Rook');
  expect((await page.evaluate(() => PixelPets.holderLines('rival2_rook'))).intro).toBe('Junior Bright Rook wants a friendly match with Tester!');
  await page.evaluate(() => PixelPets.setFlag('story.rook_quit', true));
  expect(await page.evaluate(() => PixelPets.shownName('Rook'))).toBe('Rook');
});

test('battle lines say Master Fen, never Trial Master, and stack no titles (decision F)', async ({ page }) => {
  await boot(page);
  const fen = await page.evaluate(() => PixelPets.holderLines('hall1_fen'));
  expect(fen.label).toBe('Master Fen');
  expect(fen.intro).toBe('Master Fen wants a friendly match with Tester!');
  expect(fen.win).toBe('Tester won the match against Master Fen!');
  expect(fen.summon).toBe('Master Fen has summoned X!');
  for (const id of ['hall2_hale', 'hall3_marisol', 'fern_associate', 'r2_associate', 'r2_lead', 'bw_dorian']) {
    const l = await page.evaluate((h) => PixelPets.holderLines(h), id);
    if (!l) continue;   // a holder this build does not have
    expect(l.intro, id).not.toMatch(/Trial Master|Glimmerwell Associate|Glimmerwell Field Lead|  /);
    expect(l.intro.indexOf(l.label), id).toBe(0);
  }
  expect((await page.evaluate(() => PixelPets.holderLines('hall2_hale'))).label).toBe('Master Hale');
  expect((await page.evaluate(() => PixelPets.holderLines('bw_dorian'))).intro).toBe('Head of Acquisitions Dorian Pell wants a friendly match with Tester!');
  // A holder with no cast rank keeps its battle title as before.
  const pia = await page.evaluate(() => PixelPets.holderLines('route1_pia'));
  const piaTitle = await page.evaluate(() => (PixelPets.trainerFor('route1_pia') || {}).name);
  expect(pia.intro).toContain(piaTitle);
});

test('rankCheck: only the D1245 plaza placeholders pending, civilians unranked, only the D1160 flags; no label carries a placeholder', async ({ page }) => {
  await boot(page);
  const c = await page.evaluate(() => PixelPets.rankCheck());
  expect(c.missing).toEqual([]);
  expect(c.bad).toEqual([]);
  expect(c.battle).toEqual([]);
  // Every sworn Keeper has a ladder rank now (D1159). Only FERNBROOK_PLAZA's six rank-only placeholders stay pending,
  // waiting for Design's names (D1245; Vincent, Nov 3: option A).
  expect(c.placeholders.sort()).toEqual(['Associate', 'Bright Lead', 'Cadet', 'Constable', 'Junior Bright', 'Sergeant'].map((p) => p + ' (D1245)'));
  // Hosts and shopkeepers on a side are civilians: listed, never ranked.
  expect(c.civilians.sort()).toEqual(['Keeper Amos', 'Keeper Halvard', 'Keeper Marigold', 'Keeper Quill', 'Keeper Teague', 'Watch Saffie']);
  const civRanked = await page.evaluate(() => MAPDATA.reputation.cast.filter((e) => e.civilian && e.rank).map((e) => e.name));
  expect(civRanked).toEqual([]);
  // Every rank on a Keeper is on the ladder (or is a Hall Master's "Master").
  const ladder = ['Cadet', 'Constable', 'Officer', 'Sergeant', 'Captain', 'Commander', 'Warden', 'Master'];
  const offLadder = await page.evaluate((L) => MAPDATA.reputation.cast.filter((e) => e.faction === 'keepers' && e.rank && !L.includes(e.rank)).map((e) => e.name), ladder);
  expect(offLadder).toEqual([]);
  // A duty is only held by a Cadet, Constable or Officer (KEEPER_RANKS).
  const badDuty = await page.evaluate(() => MAPDATA.reputation.cast.filter((e) => e.duty && !['Cadet', 'Constable', 'Officer'].includes(e.rank)).map((e) => e.name));
  expect(badDuty).toEqual([]);
  const labels = await page.evaluate(() => MAPDATA.reputation.cast.map((e) => PixelPets.shownName(e.name)));
  for (const l of labels) expect(l).not.toMatch(/\[|\]/);
  expect(c.flagged.map((f) => f.replace(/ \(D1160\)$/, '')).sort()).toEqual(
    ['Clerk Mint', 'Clerk Nia', 'Clerk Penn', 'Floor Keeper Sol', 'Guide Tess', 'Keeper Scout', 'Porter Bram', 'Porter Quin', 'Reeve Tamsin']);
});

test('an old Tobin / Hale save keeps its trust and gets one ranked contact card each; keys only grow', async ({ page }) => {
  const before = save({ 'story.phone_got': true }, {
    rep: { Tobin: 61, Hale: 70 },
    phoneBook: { met: { Tobin: true, Hale: true }, fav: { Tobin: true } },
  });
  const beforeKeys = Object.keys(before).sort();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), before, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  const got = await page.evaluate(() => {
    const st = PixelPets.state;
    return {
      v: st.v, repOld: st.rep.Tobin, repNew: st.rep['Associate Tobin'], haleNew: st.rep['Master Hale'],
      metOld: st.phoneBook.met.Tobin, metNew: st.phoneBook.met['Associate Tobin'], favNew: st.phoneBook.fav['Associate Tobin'],
      getOld: PixelPets.repGet('Tobin'), getNew: PixelPets.repGet('Associate Tobin'),
      tobins: PixelPets.contacts().filter((c) => /Tobin/.test(c.name)).map((c) => c.name),
      keys: Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort(),
      ver: JSON.parse(localStorage.getItem('pixelpets.save.v2')).v,
    };
  });
  expect(got.v).toBe(2);
  expect(got.ver).toBe(2);
  expect(got.repOld).toBe(61);            // the old key stays
  expect(got.repNew).toBe(61);            // and the folded name reads the same number
  expect(got.haleNew).toBe(70);
  expect(got.metOld).toBe(true);
  expect(got.metNew).toBe(true);
  expect(got.favNew).toBe(true);
  expect(got.getOld).toBe(61);
  expect(got.getNew).toBe(61);
  expect(got.tobins).toEqual(['Associate Tobin']);
  for (const k of beforeKeys) expect(got.keys).toContain(k);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const shown = await page.locator('.contact-name').allTextContents();
  expect(shown.filter((n) => /Tobin/.test(n))).toEqual(['Associate Tobin']);
  expect(shown.filter((n) => /Hale/.test(n))).toEqual(['Master Hale']);
  await shot(page, 'npc-ranks-contacts');
});

test('a ranked Keeper with a duty shows rank first and the duty line on the contact card', async ({ page }) => {
  await boot(page, { 'story.phone_got': true }, { phoneBook: { met: { 'Watch Ivo': true }, fav: {} } });
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const ivo = page.locator('.contact-name', { hasText: 'Constable Ivo' });
  await expect(ivo).toBeVisible();
  await ivo.click();
  await expect(page.locator('.contact-card-name')).toHaveText('Constable Ivo');
  await expect(page.locator('.contact-duty')).toHaveText('Watch');
  expect(await page.locator('#ovPhone').innerText()).not.toMatch(/\[Rank\]/);
  const card = await page.locator('.contact-card-name').evaluate((el) => el.getBoundingClientRect().right <= window.innerWidth);
  expect(card).toBe(true);
  await shot(page, 'npc-ranks-card-ivo');
  expect(await page.evaluate(() => PixelPets.shownName('Officer Cald'))).toBe('Officer Cald');
});

test('a civilian host keeps the plain name and no duty line on the contact card', async ({ page }) => {
  await boot(page, { 'story.phone_got': true }, { phoneBook: { met: { 'Keeper Amos': true }, fav: {} } });
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const amos = page.locator('.contact-name', { hasText: 'Keeper Amos' });
  await expect(amos).toBeVisible();
  await amos.click();
  await expect(page.locator('.contact-card-name')).toHaveText('Keeper Amos');
  await expect(page.locator('.contact-duty')).toHaveCount(0);
  expect(await page.locator('#ovPhone').innerText()).not.toMatch(/\[Rank\]|Officer Amos|Constable Amos/);
  const fits = await page.locator('.contact-card-name').evaluate((el) => el.getBoundingClientRect().right <= window.innerWidth);
  expect(fits).toBe(true);
  await shot(page, 'npc-ranks-card-amos');
});

test('the Trial Hall cadet is Cadet Sefton; an old save that met Ash keeps the trust and contact; keys only grow', async ({ page }) => {
  const before = save({ 'story.phone_got': true }, { rep: { Ash: 58 }, phoneBook: { met: { Ash: true }, fav: {} } });
  const beforeKeys = Object.keys(before).sort();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), before, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  const got = await page.evaluate(() => {
    const st = PixelPets.state, l = PixelPets.holderLines('h1_cadet');
    return {
      v: st.v, repOld: st.rep.Ash, repNew: st.rep.Sefton, metNew: st.phoneBook.met.Sefton, label: l.label, intro: l.intro,
      grete: PixelPets.shownName('Grete Ash'), keys: Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort(),
    };
  });
  expect(got.v).toBe(2);
  expect(got.repOld).toBe(58);
  expect(got.repNew).toBe(58);
  expect(got.metNew).toBe(true);
  expect(got.label).toBe('Cadet Sefton');
  expect(got.intro).toBe('Cadet Sefton wants a friendly match with Tester!');
  expect(got.grete).toBe('Grete Ash');   // the Plaza sweeper is a different person and keeps her name
  for (const k of beforeKeys) expect(got.keys).toContain(k);
});
