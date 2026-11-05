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
  s.settings.controls = 'modern';   // the shared starter save picks arcade; this spec plays in Modern controls
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

// NAMES_PASS G8, G9 (D1766; Vincent, Wed Nov 4, 2026): "Cal -> Jory and Kit -> Mabry each get their own key; the
// Mahopac-dream Cal and the other Kit keep their names." The renamed body's raw name is the new key; NPC ids, the look,
// the scene, the ally id rx_cal_ally and story.met_cal stay. save.js SPLIT_KEYS copies an old shared mark to the new key once, only
// when the save reached the renamed person; the old key stays with the person who keeps the name.
const SPLIT = [
  { shown: 'Jory', old: 'Cal', file: 'heights', map: 'rx_f2', id: 'rx_cal', at: [5, 10], look: 'rx_cal' },
  { shown: 'Mabry', old: 'Kit', file: 'highcharity', map: 'highcharity', id: 'hc_kite', at: [37, 23], look: 'kit' },
];
const KEPT_SPLIT = [
  { shown: 'Cal', file: 'mahopac', map: 'mahopac', id: 'cal', look: 'cal' },
  { shown: 'Kit', file: 'heights', map: 'fb_heights', id: 'ht_kit', at: [14, 12], look: 'stockup_kit' },
];

test('G8, G9: Jory and Mabry have their own keys; the dream Cal and the Heights Kit keep theirs', async ({ page }) => {
  await boot(page);
  for (const n of ['Jory', 'Mabry', 'Cal', 'Kit']) {
    const got = await speaker(page, n);
    expect(got.text, n).toBe(n);
    expect(got.fits, n + ' fits the speaker tab').toBe(true);
    await page.evaluate(() => PixelPets.endScene());
  }
  const data = await page.evaluate(([split, kept]) => {
    const obj = (r) => { const d = MAPDATA[r.file]; const m = (d.maps && d.maps[r.map]) || (d.rooms && d.rooms[r.map]); return m.objs.find((o) => o.id === r.id); };
    const all = split.concat(kept).map((r) => { const o = obj(r); return { id: r.id, name: o.name, look: o.look, speaker: MAPDATA[r.file].speakers[o.name] }; });
    const cast = MAPDATA.reputation.cast.map((e) => e.name);
    return { all, cast, ally: MAPDATA.heights.trainers.rx_cal_ally.name, scene: MAPDATA.heights.scenes.rx_cal.filter((st) => st[0] === 'say').map((st) => st[1]),
      metFlag: MAPDATA.heights.scenes.rx_cal.some((st) => st[0] === 'setFlag' && st[1] === 'story.met_cal'),
      first: MAPDATA.heights.scenes.rx_cal[0][2], stock: MAPDATA.heights.scenes.stock_up[0][1] };
  }, [SPLIT, KEPT_SPLIT]);
  for (const r of SPLIT.concat(KEPT_SPLIT)) {
    const got = data.all.find((x) => x.id === r.id);
    expect(got.name, r.id + ' raw name (its key)').toBe(r.shown);   // the NPC id stays; the key is the shown name
    expect(got.look, r.id + ' look').toBe(r.look);
    expect(got.speaker || r.look, r.id + ' portrait').toBe(r.look);   // the dialog portrait is the body's own look
    expect(data.cast, r.shown + ' cast entry').toContain(r.shown);
  }
  expect(data.ally).toBe('Jory');                           // the lab fight's ally (id rx_cal_ally unchanged)
  expect(new Set(data.scene)).toEqual(new Set(['Jory']));
  expect(data.first).toContain("I'm Jory.");
  expect(data.metFlag).toBe(true);                          // the flag keeps its name
  expect(data.stock).toBe('Kit');
});

test('G8, G9: real talks show Jory on the RegenX floor, Mabry at the kite stall and Kit at the Heights crate', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, save({ 'story.know_us': true, 'story.rx_enter': true, 'story.rx_f1': true, 'story.hc_arrived': true }));
  await page.evaluate(() => { PixelPets.clock.set('tue', 12, 0); PixelPets.clock.freeze(true); });
  for (const r of [SPLIT[0], SPLIT[1], KEPT_SPLIT[1]]) {
    expect(await page.evaluate(([m, x, y]) => PixelPets.goto(m, x, y, 'left'), [r.map, r.at[0], r.at[1]]), r.map).toBeTruthy();
    await page.waitForFunction(() => !window.PixelPets.fading);
    expect(await talkWho(page, r.id), r.id).toBe(r.shown);
    await shot(page, 'names-split-' + r.shown.toLowerCase());
    await page.evaluate(() => PixelPets.endScene());
  }
  // One phone card each: Jory and Kit are met by name, the dream Cal and Mabry are their own cards.
  const names = (await page.evaluate(() => PixelPets.contacts())).map((p) => p.name);
  expect(names).toContain('Jory');
  expect(names).toContain('Mabry');
  expect(names).toContain('Kit');
  expect(names).not.toContain('Cal');                       // the dream Cal was never met in this save
});

// An old save from before the split: the shared marks sit under Cal and Kit.
function oldSplitSave(flags) {
  return save(Object.assign({ 'story.phone_got': true }, flags), {
    rep: { Cal: 61, Kit: 58 }, phoneBook: { met: { Cal: true, Kit: true }, fav: { Cal: true, Kit: true } },
  });
}

test('G8, G9: an old save that met the ally and the kite seller copies Cal to Jory and Kit to Mabry once; old keys stay', async ({ page }) => {
  await boot(page, oldSplitSave({ 'story.met_cal': true, 'story.hc_arrived': true }));
  const out = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('pixelpets.save.v2')) || PixelPets.state;
    const st = PixelPets.state;
    const twice = PPSave.normalizeV2(JSON.parse(JSON.stringify(st)));
    return { v: st.v, rep: st.rep, met: st.phoneBook.met, fav: st.phoneBook.fav, flags: { cal: st.flags['fold.Cal'], kit: st.flags['fold.Kit'] }, twice, onDisk: s.v };
  });
  expect(out.v).toBe(2);
  expect(out.onDisk).toBe(2);
  expect(out.met).toMatchObject({ Cal: true, Kit: true, Jory: true, Mabry: true });   // old keys stay; new keys added
  expect(out.fav).toMatchObject({ Cal: true, Kit: true, Jory: true, Mabry: true });
  expect(out.rep).toMatchObject({ Cal: 61, Kit: 58, Jory: 61, Mabry: 58 });
  expect(out.flags).toEqual({ cal: true, kit: true });
  expect(out.twice.phoneBook).toEqual({ met: out.met, fav: out.fav });              // a second load changes nothing
  // Unfavourite Jory, load again: the fold never runs twice, so the star stays off; Cal keeps his.
  const again = await page.evaluate(() => {
    const s = JSON.parse(JSON.stringify(PixelPets.state));
    delete s.phoneBook.fav.Jory;
    const n = PPSave.normalizeV2(s);
    return { jory: n.phoneBook.fav.Jory, cal: n.phoneBook.fav.Cal };
  });
  expect(again).toEqual({ jory: undefined, cal: true });
  // The phone shows both people.
  const names = (await page.evaluate(() => PixelPets.contacts())).map((p) => p.name);
  for (const n of ['Jory', 'Mabry', 'Cal', 'Kit']) expect(names, n).toContain(n);
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const shownList = await page.locator('.contact-name').allTextContents();
  for (const n of ['Jory', 'Mabry']) expect(shownList, n).toContain(n);
  await shot(page, 'names-split-contacts');
});

test('G8, G9: an old save that never reached the ally or High Charity copies nothing; the marks stay with Cal and Kit', async ({ page }) => {
  const before = oldSplitSave({});
  await boot(page, before);
  const out = await page.evaluate(() => {
    const st = PixelPets.state;
    return { v: st.v, rep: st.rep, met: st.phoneBook.met, fav: st.phoneBook.fav, cal: st.flags['fold.Cal'], kit: st.flags['fold.Kit'] };
  });
  expect(out.v).toBe(2);
  expect(out.rep).toEqual(before.rep);
  expect(out.met).toEqual(before.phoneBook.met);
  expect(out.fav).toEqual(before.phoneBook.fav);
  expect([out.cal, out.kit]).toEqual([true, true]);   // decided once: a later Jory or Mabry never takes a dream Cal's star
  // A fresh save gets no fold marks at all.
  const fresh = await page.evaluate(() => {
    const s = JSON.parse(JSON.stringify(PixelPets.state));
    s.rep = {}; s.phoneBook = { met: {}, fav: {} };
    for (const k of Object.keys(s.flags)) if (k.startsWith('fold.')) delete s.flags[k];
    return Object.keys(PPSave.normalizeV2(s).flags).filter((k) => k.startsWith('fold.'));
  });
  expect(fresh).toEqual([]);
});
