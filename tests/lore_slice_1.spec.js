/* LORE_DISCOVERY slice 1 (D2280-D2296): Lizzy's optional weekday lesson, its evening fallback at 5B, the homework row to the
   plaza plaque and back, Archivist Mo's shelf as a talk menu (his lines and the key order untouched), three chatter lines and
   the Journal notes list. Modern controls, reduced motion, 320 / 375 / 390, zero console errors. Save stays
   pixelpets.save.v2, v 2: the new flags are additive story.* keys and nothing else in the save changes shape. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, withOverlay } = require('./helpers');

trackErrors(test, expect);

const NEW_FLAGS = ['story.lizzy_war', 'story.lizzy_war_plaque', 'story.lizzy_war_done', 'story.mo_shelf_arbiter', 'story.mo_shelf_five', 'story.mo_shelf_war'];
const CLASS_DONE = { 'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'story.leak5b_seen': true, 'story.leak5b_yes': true };
const KEEPER = { 'story.met_mo': true, 'story.side': 'keepers', 'story.side_pick_done': true, 'story.keeper_cadet': true };
const TOAST = 'Written in your Journal.';

function save(flags, opts = {}) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.controls = 'modern';
  Object.assign(s.flags, flags || {});
  if (opts.standing) s.standing = Object.assign({ keepers: 0, glimmer: 0 }, opts.standing);
  return s;
}
async function boot(page, s, opts = {}) {
  if (opts.overlay) await withOverlay(page, opts.overlay.data, opts.overlay.key);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}
async function at(page, day, hh, mm = 0) {
  await page.evaluate(([d, h, m]) => { PixelPets.clock.set(d, h, m); PixelPets.clock.freeze(true); }, [day, hh, mm]);
}
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const present = (page, id) => page.evaluate(i => PixelPets.mapObjs.some(o => o.id === i), id);
const line = (page, id) => page.evaluate(i => PixelPets.npcLine(i), id);
const side = (page, chain) => page.evaluate(c => PixelPets.sideActive.find(a => a.chain === c) || null, chain);
async function talk(page, id) {
  expect(await page.evaluate(i => PixelPets.talkTo(i), id), id).toBe(true);
}
// Plays the open scene to its end; choices take the first label in `picks` that is offered. Returns [speaker, text] per line
// and ['>', label] per pick, and checks every choice button is 44 px tall or more at this width.
async function drive(page, picks = [], ms = 60000) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) { await page.waitForTimeout(120); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.keyboard.press('Space'); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const btns = page.locator('#sbChoices button:visible');
      const labels = (await btns.allTextContents()).map(t => t.trim());
      for (let i = 0; i < labels.length; i++) {
        const b = await btns.nth(i).boundingBox();
        expect(b.height, 'choice "' + labels[i] + '" height').toBeGreaterThanOrEqual(44);
        expect(b.x + b.width, 'choice "' + labels[i] + '" inside the screen').toBeLessThanOrEqual(page.viewportSize().width + 0.5);
      }
      // Picks are used in order: the next one is taken when offered (a menu that returns asks again).
      const pick = picks.length && labels.includes(picks[0]) ? picks.shift() : (picks.find(p => labels.includes(p)) || labels[0]);
      lines.push(['?', sc.text], ['>', pick]);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.waitForTimeout(30); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const texts = lines => lines.filter(l => l[0] !== '>' && l[0] !== '?').map(l => l[1]);

test.describe('LORE_DISCOVERY slice 1: Lizzy\'s war lesson (D2280-D2283, D2287)', () => {
  test('T1: the lesson plays on a weekday by day after the class, once, and sets story.lizzy_war to the choice', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, save(CLASS_DONE));
    const main0 = await page.evaluate(() => PixelPets.quest && PixelPets.quest.id);
    await at(page, 'mon', 10);
    await goto(page, 'hm_school_in', 10, 5, 'up');
    expect(await present(page, 'school_lizzy')).toBe(true);
    expect(await line(page, 'school_lizzy')).toBe('@lz_war');
    await talk(page, 'school_lizzy');
    expect(await sceneId(page)).toBe('lz_war');
    const lines = await drive(page, ['Read the old books']);
    const t = texts(lines);
    expect(t[0]).toBe('A new word is up on the chalkboard: THE GREAT WAR. Pip and Tilly are already arguing about it.');
    expect(t).toContain('The book gives them one line, Pip. Then the page stops. Picking Day started right after.');
    expect(t).toContain('Good. Archivist Mo keeps the old books at the Keeper House. Wash your hands first.');
    expect(t[t.length - 1]).toBe("Homework. Read the plaque in the plaza, then tell me who the next holder is. No, Buddy doesn't count.");
    expect(lines.filter(l => l[0] === '>')).toEqual([['>', 'Read the old books']]);
    expect(lines.find(l => l[0] === '?')[1]).toBe("Where's the part nobody wrote?");
    expect(lines.find(l => /partnership started/.test(l[1]))[0]).toBe('Wren');
    expect(await page.evaluate(() => PixelPets.shownName('Wren'))).toBe('Tilly');   // the pupil Wren is shown as Tilly (D1767)
    expect(texts(lines).length).toBeLessThanOrEqual(9);
    const f = await flags(page);
    expect(f['story.lizzy_war']).toBe('read');
    expect(f['story.lizzy_war_done']).toBeFalsy();
    // Once only: the next tap is her built line, and the lesson key never matches again.
    expect(await line(page, 'school_lizzy')).not.toMatch(/^@lz_war/);
    expect(await page.evaluate(() => PixelPets.quest && PixelPets.quest.id)).toBe(main0);
    expect((await stored(page)).v).toBe(2);
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  });

  test('T2: no lesson before the class, at the weekend or after school; the weekend court is Lizzy\'s own line', async ({ page }) => {
    await boot(page, save({ 'story.lizzy_met': true, 'story.leak5b_seen': true, 'story.leak5b_yes': true }));
    await at(page, 'tue', 10);
    await goto(page, 'hm_school_in', 10, 5, 'up');
    expect(await line(page, 'school_lizzy')).not.toMatch(/lz_war/);   // the class is not done: the built line stands
    await page.evaluate(() => PixelPets.setFlag('story.lizzy_class', true));
    expect(await line(page, 'school_lizzy')).toBe('@lz_war');
    await at(page, 'sat', 10);
    await goto(page, 'hearthmoor', 14, 29, 'down');
    expect(await present(page, 'court_lizzy')).toBe(true);
    expect(await line(page, 'court_lizzy')).toBe('Saturday hoops. First to five.');
    await at(page, 'mon', 16);   // after school she is home at 5B, but it is not evening yet
    await goto(page, 'hm_flats_5', 13, 5, 'up');
    expect(await present(page, 'f5_lizzy')).toBe(true);
    expect(await line(page, 'f5_lizzy')).not.toMatch(/lz_war/);
    expect((await flags(page))['story.lizzy_war']).toBeUndefined();
  });

  test('T3: the evening fallback at 5B plays the short lesson and sets the same flag', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, save(CLASS_DONE));
    await at(page, 'sat', 20);
    await goto(page, 'hm_flats_5', 13, 5, 'up');
    expect(await line(page, 'f5_lizzy')).toBe('@lz_war_home');
    await talk(page, 'f5_lizzy');
    expect(await sceneId(page)).toBe('lz_war_home');
    const lines = await drive(page, ['Ask someone old']);
    const t = texts(lines);
    expect(t[0]).toBe('Lizzy is marking at her desk. The card on top says THE GREAT WAR.');
    expect(t).toContain('Good. Ask the old ones. Della at the Lantern House knows who they are.');
    expect(t.length).toBeLessThanOrEqual(8);
    expect((await flags(page))['story.lizzy_war']).toBe('ask');
    expect(await line(page, 'f5_lizzy')).not.toMatch(/^@lz_war/);
  });

  test('T4: the chalkboard hints at the lesson, at the evening fallback, then shows the wiped line', async ({ page }) => {
    await boot(page, save({ 'story.lizzy_met': true }));
    await at(page, 'mon', 10);
    await goto(page, 'hm_school_in', 4, 3, 'up');
    expect(await line(page, 'school_board')).toBe('BE KIND. FEED FIRST. ASK BEFORE YOU PET. Written in Lizzy\'s round chalk letters.');
    await page.evaluate(() => PixelPets.setFlag('story.lizzy_class', true));
    expect(await line(page, 'school_board')).toBe('NEW LESSON TODAY: THE GREAT WAR. Ask Ms. Lizzy.');
    await at(page, 'sat', 11);
    await goto(page, 'hm_school_in', 4, 3, 'up');
    expect(await line(page, 'school_board')).toBe('NEW LESSON: THE GREAT WAR. Weekdays, 8 to 3. Or knock at 5B after supper. - L.');
    await page.evaluate(() => PixelPets.setFlag('story.lizzy_war', 'ask'));
    expect(await line(page, 'school_board')).toBe("THE GREAT WAR, in Lizzy's hand. A line under it is wiped. Then: PICKING DAY, and a question mark.");
    await page.evaluate(() => PixelPets.setFlag('story.lizzy_class', null));
    await page.evaluate(() => PixelPets.setFlag('story.lizzy_war', null));
    expect(await line(page, 'school_board')).toBe('Back at 3. - L.');   // the built away line is untouched
  });
});

test.describe('LORE_DISCOVERY slice 1: the homework row, the sticker and the Journal note (D2284-D2286)', () => {
  test('T5: the row points at the plaque, then at Lizzy; the return gives the sticker, a Journal note, and closes the row', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, save(Object.assign({}, CLASS_DONE, { 'story.lizzy_war': 'read' })));
    const main0 = await page.evaluate(() => PixelPets.quest && PixelPets.quest.id);
    let row = await side(page, 'lz_history');
    expect(row).toMatchObject({ label: "Lizzy's homework", id: 'lz_history', place: 'Hearthmoor Plaza', target: { map: 'hm_plaza', x: 12, y: 12 } });
    expect(row.text).toBe('Read the plaque under the lantern statue in Hearthmoor Plaza.');
    await goto(page, 'hm_plaza', 12, 13, 'up');
    expect(await line(page, 'hmp_plaque')).toBe('@lz_war_plaque');
    await talk(page, 'hmp_plaque');
    let t = texts(await drive(page));
    expect(t).toEqual(['A stone Keeper holds a lantern over the water. The plaque reads: KEEP THE LIGHT FOR THE NEXT HOLDER.',
      "That's Lizzy's homework. She'll want the answer in your own words."]);
    expect((await flags(page))['story.lizzy_war_plaque']).toBe(true);
    expect(await line(page, 'hmp_plaque')).toBe('A stone Keeper holds a lantern over the water. The plaque reads: KEEP THE LIGHT FOR THE NEXT HOLDER.');
    row = await side(page, 'lz_history');
    expect(row).toMatchObject({ id: 'lz_history_back', text: 'Tell Lizzy who the next holder is.', place: 'Ms. Lizzy, Hearthmoor' });
    // Back to Lizzy wherever she is: the board-game night at the diner carries the same key as the Schoolhouse and 5B.
    await at(page, 'thu', 18);
    await goto(page, 'hm_diner', 6, 5, 'up');
    expect(await present(page, 'diner_lizzy')).toBe(true);
    expect(await line(page, 'diner_lizzy')).toBe('@lz_war_back');
    const crumbs0 = await page.evaluate(() => (PixelPets.state.bag || {}).joy_crumb | 0);
    await talk(page, 'diner_lizzy');
    t = texts(await drive(page));
    expect(t).toContain('And keep reading. A missing page is a clue too.');
    expect(t[t.length - 1]).toMatch(/^Lizzy presses a gold star sticker onto \S.*\. It stays on for almost a minute\.$/);
    expect(t[t.length - 1]).not.toContain('{pet}');
    await expect(page.locator('#toast')).toContainText(TOAST);
    const f = await flags(page);
    expect(f['story.lizzy_war_done']).toBe(true);
    expect(await page.evaluate(() => (PixelPets.state.bag || {}).joy_crumb | 0)).toBe(crumbs0 + 1);
    expect(await side(page, 'lz_history')).toBeNull();
    expect(await line(page, 'diner_lizzy')).toBe('Board night. Pull up a crate.');
    expect(await page.evaluate(() => PixelPets.quest && PixelPets.quest.id)).toBe(main0);
    // The Journal note shows under the Journal grid on the WALKLINGS tab, and fits the width.
    await page.evaluate(() => PixelPets.showTab('col'));
    await expect(page.locator('#notesHead')).toBeVisible();
    await expect(page.locator('#journalNotes li')).toHaveText(["Lizzy's war lesson: the book gives Walklings one line, then the page stops. Picking Day came after."]);
    const box = await page.locator('#journalNotes li').first().boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 0.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  });

  test('T6: the ask answer changes the return line; the plaque is its built line before the homework', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page, save(Object.assign({}, CLASS_DONE)));
    await goto(page, 'hm_plaza', 12, 13, 'up');
    expect(await line(page, 'hmp_plaque')).toBe('A stone Keeper holds a lantern over the water. The plaque reads: KEEP THE LIGHT FOR THE NEXT HOLDER.');
    expect(await side(page, 'lz_history')).toBeNull();
    await page.evaluate(() => { PixelPets.setFlag('story.lizzy_war', 'ask'); PixelPets.setFlag('story.lizzy_war_plaque', true); });
    await at(page, 'wed', 9);
    await goto(page, 'hm_school_in', 10, 5, 'up');
    expect(await line(page, 'school_lizzy')).toBe('@lz_war_back');
    await talk(page, 'school_lizzy');
    const t = texts(await drive(page));
    expect(t).toContain('And keep asking the old ones. They forget what nobody asks them.');
    expect(t).not.toContain('And keep reading. A missing page is a clue too.');
    expect((await flags(page))['story.lizzy_war_done']).toBe(true);
  });
});

test.describe('LORE_DISCOVERY slice 1: Mo\'s shelf (D2288, D2289, D2291)', () => {
  test('T7: a Keeper hears Mo\'s line, then the menu; each shelf reads, notes once, and comes back to the menu', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, save(KEEPER, { standing: { keepers: 12 } }));
    await goto(page, 'hm_hq_f1', 3, 7, 'up');
    const before = await page.evaluate(() => { const o = window.WORLD.hm_hq_f1.objs.find(x => x.id === 'hq_mo'); return { keys: Object.keys(o.lines), after: o.after }; });
    expect(before.after).toBe('lore_mo_shelf');
    expect(before.keys.some(k => /lizzy|mo_shelf/.test(k))).toBe(false);   // his lines are not touched
    expect(await line(page, 'hq_mo')).toBe('The shelf is open to a Keeper. Read.');
    await talk(page, 'hq_mo');
    const lines = await drive(page, ['The war shelf', 'The Arbiter page', 'Not now']);
    const picks = lines.filter(l => l[0] === '>').map(l => l[1]);
    expect(picks).toEqual(['The war shelf', 'The Arbiter page', 'Not now']);
    const t = texts(lines);
    expect(t[0]).toBe('The shelf is open to a Keeper. Read.');
    expect(t).toContain('In the war, one Hall Stone was carried whole to the capital. It is still in chains. My page on why is blank.');
    expect(t).toContain('One old book says someone nearly gathered eight Seals. It does not say who. I do not guess.');
    expect(t).toContain('The emission has no name. The oldest page leaves that space empty.');
    expect(t).not.toContain('The hum woke all five. My books call them the Answerers. The page on what they answer stays blank.');
    expect(t[t.length - 1]).toBe('The shelf keeps.');
    expect(lines.filter(l => l[0] === '?').map(l => l[1])).toEqual(['Which shelf?', 'Which shelf?', 'Which shelf?']);
    let f = await flags(page);
    expect(f['story.mo_shelf_war']).toBe(true);
    expect(f['story.mo_shelf_arbiter']).toBe(true);
    expect(f['story.mo_shelf_five']).toBeUndefined();
    // Re-entry: the menu opens again on the next talk; a re-read writes no second note.
    await talk(page, 'hq_mo');
    const again = await drive(page, ['The war shelf', 'Not now']);
    expect(again.filter(l => l[0] === '>').map(l => l[1])).toEqual(['The war shelf', 'Not now']);
    // After the five are open the Arbiter page adds them, and their note.
    await page.evaluate(() => PixelPets.setFlag('story.ans_open', true));
    await page.evaluate(() => PixelPets.setFlag('story.ans_all', true));
    await page.evaluate(() => PixelPets.setFlag('story.ans_humwisp', true));
    await talk(page, 'hq_mo');
    const five = texts(await drive(page, ['The Arbiter page', 'Not now']));
    expect(five).toContain('The hum woke all five. My books call them the Answerers. The page on what they answer stays blank.');
    f = await flags(page);
    expect(f['story.mo_shelf_five']).toBe(true);
    await page.evaluate(() => PixelPets.showTab('col'));
    await expect(page.locator('#journalNotes li')).toHaveText([
      "Mo's old books: the Arbiter has been emitting for ages. Its emission has no name.",
      "Mo's old books: five that answer a hum, the Answerers. What they answer is a blank page.",
      "Mo's war shelf: one Hall Stone sits in chains in the capital. His page on why is blank."]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await stored(page)).v).toBe(2);
  });

  test('T8: no menu for a citizen or a Glimmerwell holder, and none while his intro or a scene key runs', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, save({ 'story.met_mo': true }));
    await goto(page, 'hm_hq_f1', 3, 7, 'up');
    await talk(page, 'hq_mo');
    let lines = await drive(page);
    expect(texts(lines)).toEqual(['Citizen. Old books stay on the shelf.']);
    expect(lines.some(l => l[0] === '?')).toBe(false);
    await page.evaluate(() => { PixelPets.setFlag('story.side', 'glimmer'); PixelPets.setFlag('story.side_pick_done', true); });
    await talk(page, 'hq_mo');
    lines = await drive(page);
    expect(lines.some(l => l[0] === '?')).toBe(false);
    await page.evaluate(() => { PixelPets.setFlag('story.side', 'keepers'); PixelPets.setFlag('story.met_mo', null); });
    await page.evaluate(() => PixelPets.setStanding('keepers', 12));
    expect(await line(page, 'hq_mo')).toBe('@hq_mo');
    await talk(page, 'hq_mo');
    lines = await drive(page);
    expect(texts(lines)[0]).toBe('I keep the old books. Some of them are not comfortable.');
    expect(lines.some(l => l[1] === 'Which shelf?')).toBe(false);
    expect((await flags(page))['story.met_mo']).toBe(true);
  });

  test('T9: the walk-beside repeat key keeps its place before standing.keepers>=1 and the menu still follows it', async ({ page }) => {
    test.setTimeout(90000);
    // The settled hq_mo patch exactly as the walk-beside overlay carries it (WALK_BESIDE §3.3, D1961), applied at boot.
    const wb = { objPatch: { hq_mo: { linesBefore: { anchorKey: 'standing.keepers>=1', add: { 'story.wb_cut & !story.side=glimmer': 'Both lines are still in the tin.' } } } } };
    await boot(page, save(Object.assign({ 'story.wb_cut': 'asked' }, KEEPER), { standing: { keepers: 12 } }), { overlay: { data: wb, key: 'detail_zz_walk_beside' } });
    await goto(page, 'hm_hq_f1', 3, 7, 'up');
    const keys = await page.evaluate(() => Object.keys(window.WORLD.hm_hq_f1.objs.find(x => x.id === 'hq_mo').lines));
    const i = keys.indexOf('story.wb_cut & !story.side=glimmer');
    expect(i).toBeGreaterThan(keys.indexOf('story.side=glimmer'));
    expect(i).toBeLessThan(keys.indexOf('standing.keepers>=1'));
    expect(keys.filter(k => k.startsWith('story.') && !k.startsWith('story.side=') && !k.startsWith('story.wb_cut')).every(k => keys.indexOf(k) < i)).toBe(true);
    await talk(page, 'hq_mo');
    const lines = await drive(page, ['Not now']);
    expect(texts(lines)[0]).toBe('Both lines are still in the tin.');
    expect(lines.filter(l => l[0] === '?').map(l => l[1])).toEqual(['Which shelf?']);
  });
});

test.describe('LORE_DISCOVERY slice 1: chatter (D2290)', () => {
  async function walkBy(page, map, x, y, dir) {
    await page.waitForTimeout(2700);   // one bubble at a time: the last one holds the street for CHATTER_MS (2.5 s)
    await goto(page, map, x, y, dir);
    await page.evaluate(() => { const el = document.querySelector('#chatBubble'); if (el) { el.hidden = true; el.textContent = ''; } });
    await page.evaluate(d => PixelPets.walkStep(d), dir);
    await page.waitForTimeout(700);
    return page.evaluate(() => { const el = document.querySelector('#chatBubble'); return el && !el.hidden ? el.textContent : null; });
  }
  test('T10: Pip and Tilly bark the lesson while the homework is open; Della after any lesson; none before', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page, save(CLASS_DONE));
    await at(page, 'mon', 16);   // after school: Pip and Tilly are on the court
    expect(await walkBy(page, 'hearthmoor', 16, 28, 'down')).toBeNull();
    await page.evaluate(() => PixelPets.setFlag('story.lizzy_war', 'ask'));
    expect(await walkBy(page, 'hearthmoor', 16, 28, 'down')).toMatch(/^(Where were the Walklings\? Nobody'll say!|I asked Tuft about the war\. Tuft yawned\.)$/);
    const chat = await page.evaluate(() => {
      const of = id => { for (const m of Object.values(window.WORLD)) { const o = (m.objs || []).find(x => x.id === id); if (o) return o.chatter; } return null; };
      return { pip: of('court_pip'), wren: of('court_wren') };
    });
    expect(chat.pip).toEqual({ 'story.lizzy_war & !story.lizzy_war_done': "Where were the Walklings? Nobody'll say!" });
    expect(chat.wren).toEqual({ 'story.lizzy_war & !story.lizzy_war_done': 'I asked Tuft about the war. Tuft yawned.' });
    expect(await walkBy(page, 'hm_lantern_in', 4, 5, 'up')).toBe('The old ones rest here too. Ask gently.');
    await page.evaluate(() => PixelPets.setFlag('story.lizzy_war_done', true));
    expect(await walkBy(page, 'hearthmoor', 16, 28, 'down')).toBeNull();
    expect(await walkBy(page, 'hm_lantern_in', 4, 5, 'up')).toBe('The old ones rest here too. Ask gently.');
    const school = await page.evaluate(() => {
      PixelPets.goto('hm_school_in', 7, 11, 'up');
      const of = id => { for (const m of Object.values(window.WORLD)) { const o = (m.objs || []).find(x => x.id === id); if (o) return o.chatter; } return null; };
      return { a: of('school_kid_a'), b: of('school_kid_b') };
    });
    for (const c of [school.a, school.b]) if (c) expect(Object.keys(c)).toEqual(['story.lizzy_war & !story.lizzy_war_done']);
    for (const s of [chat.pip, chat.wren]) for (const v of Object.values(s)) expect(Array.from(v).length).toBeLessThanOrEqual(40);
    // Chatter writes no flag.
    const f = await flags(page);
    expect(Object.keys(f).filter(k => NEW_FLAGS.includes(k)).sort()).toEqual(['story.lizzy_war', 'story.lizzy_war_done']);
  });
});

test.describe('LORE_DISCOVERY slice 1: saves (D2281)', () => {
  test('T11: an old save loads unchanged; the full slice adds only its story.* keys and keeps the save shape', async ({ page }) => {
    test.setTimeout(120000);
    const old = save({ 'story.class_sent': true, 'story.lizzy_met': true, 'story.lizzy_class': true, 'story.seal1': true, 'story.post_trial_done': true, 'story.met_mo': true });
    await boot(page, old, { oldSave: true });
    await page.evaluate(() => { PixelPets.setFlag('story.leak5b_seen', true); PixelPets.setFlag('story.leak5b_yes', true); });   // setFlag saves
    const s0 = await stored(page);
    expect(s0.v).toBe(2);
    expect(Object.keys(s0.flags).filter(k => NEW_FLAGS.includes(k))).toEqual([]);
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
    expect(await page.evaluate(() => document.querySelector('#journalNotes').hidden && document.querySelector('#notesHead').hidden)).toBe(true);
    // Play the slice end to end, then compare the stored save with the one before.
    await at(page, 'fri', 11);
    await goto(page, 'hm_school_in', 10, 5, 'up');
    await talk(page, 'school_lizzy');
    await drive(page, ['Ask someone old']);
    await goto(page, 'hm_plaza', 12, 13, 'up');
    await talk(page, 'hmp_plaque');
    await drive(page);
    await goto(page, 'hm_school_in', 10, 5, 'up');
    await talk(page, 'school_lizzy');
    await drive(page);
    await page.evaluate(() => PixelPets.setFlag('story.tutorial_done', true));   // setFlag saves
    const s1 = await stored(page);
    expect(s1.v).toBe(2);
    // Walking into rooms the old save had not seen adds the engine's own room log (floorSeen); the slice adds no top-level key.
    expect(Object.keys(s1).filter(k => !(k in s0) && k !== 'floorSeen')).toEqual([]);
    expect(Object.keys(s0).filter(k => !(k in s1))).toEqual([]);
    // Engine bookkeeping rides along with any play (story.beat.* scene marks, story.unlock_* panel unlocks, daily.*); the slice's own keys are three.
    const added = Object.keys(s1.flags).filter(k => !(k in s0.flags));
    expect(added.filter(k => !k.startsWith('daily.') && !k.startsWith('standing.') && !k.startsWith('story.beat.') && !k.startsWith('story.unlock_')).sort()).toEqual(['story.lizzy_war', 'story.lizzy_war_done', 'story.lizzy_war_plaque']);
    expect(s1.flags['story.lizzy_war']).toBe('ask');
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  });
});
