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
    // Keepers whose ladder rank waits on Vincent (D1159) show their plain name, never a placeholder.
    'Keeper Amos': 'Keeper Amos', 'Watch Ivo': 'Watch Ivo', 'Clerk Wynn': 'Clerk Wynn',
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

test('rankCheck lists only the pending ranks (D1159) and the flagged NPCs (D1160); no label carries a placeholder', async ({ page }) => {
  await boot(page);
  const c = await page.evaluate(() => PixelPets.rankCheck());
  expect(c.missing).toEqual([]);
  expect(c.bad).toEqual([]);
  expect(c.battle).toEqual([]);
  // Every pending name that is in the cast (16 today; Ash too once #261's Trial Hall holders land) is listed, and only those.
  const pend = await page.evaluate(() => {
    const R = MAPDATA.reputation, names = new Set(R.cast.map((e) => e.name));
    return Object.keys(R.ranks.pending).filter((n) => names.has(n)).sort();
  });
  expect(pend.length).toBeGreaterThanOrEqual(16);
  expect(c.placeholders.map((p) => p.replace(/ \((D1159|D1245)\)$/, '')).sort()).toEqual(pend);
  // D1159: Keepers waiting for Vincent's OK on a rank. D1245: FERNBROOK_PLAZA's rank-only placeholders, waiting for Design's names (Vincent, Nov 3).
  const PLAZA = ['Associate', 'Bright Lead', 'Cadet', 'Constable', 'Junior Bright', 'Sergeant'];
  for (const p of c.placeholders) expect(p).toMatch(PLAZA.includes(p.replace(/ \(D\d+\)$/, '')) ? /\(D1245\)$/ : /\(D1159\)$/);
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

test('a Keeper still waiting on a rank shows the plain name on the contact card; the town board signs rank first', async ({ page }) => {
  await boot(page, { 'story.phone_got': true }, { phoneBook: { met: { 'Watch Ivo': true }, fav: {} } });
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const ivo = page.locator('.contact-name', { hasText: 'Watch Ivo' });
  await expect(ivo).toBeVisible();
  await ivo.click();
  await expect(page.locator('.contact-card-name')).toHaveText('Watch Ivo');
  await expect(page.locator('.contact-duty')).toHaveCount(0);   // the duty line comes with the rank, once Vincent OKs it
  expect(await page.locator('#ovPhone').innerText()).not.toMatch(/\[Rank\]/);
  const card = await page.locator('.contact-card-name').evaluate((el) => el.getBoundingClientRect().right <= window.innerWidth);
  expect(card).toBe(true);
  await shot(page, 'npc-ranks-card-ivo');
  expect(await page.evaluate(() => PixelPets.shownName('Officer Cald'))).toBe('Officer Cald');
});
