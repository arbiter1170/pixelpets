/* MAHOPAC_DREAMS v0.1 (design repo, private; D1940-D1951): the two built-drift fixes (G1, G2), Mom's walk north (§4), the
   lens moment (§3), the loyalist's echo at the lens (§5.2) and the Mahopac epilogue card (§4.5).
   data/mahopac.json, data/detail_zzzz_mahopac_dreams.json, game.js, standing.js, quests.js, sfx.js.
   Every new line is PLACEHOLDER. Save stays pixelpets.save.v2, v 2, four additive story.* keys; nothing written at load.
   Gates nothing in the game sets yet (story.seal4/5, story.ilse_ledger, story.solvane_met, the endings) are seeded here.
   Modern controls; 320, 375, 390 (@w1 rows at 320 only); reduced motion; zero console errors. §11 T1-T12. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const DATA = path.join(__dirname, '..', 'data');
const MAH = JSON.parse(fs.readFileSync(path.join(DATA, 'mahopac.json'), 'utf8'));

// Act 1 done through the dream and Ilse; a Keepers Cadet who went undercover (D1562), posted in Act 2.
const DREAMED = {
  'story.reached_route1': true, 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true,
  'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_started': true,
  'story.dream_toy': true, 'story.dream_party': true, 'story.dream_dad': true, 'story.dream_woke': true, 'story.dream_study': true,
  'story.lizzy_met': true, 'story.seal1': true, 'story.phone_got': true,
};
const POSTED = Object.assign({}, DREAMED, {
  'story.crackdown': true, 'story.post_trial_done': true, 'story.warden_called': true, 'story.warden_met': true, 'story.chi_done': true,
  'story.shift_g': true, 'story.orchard_lean': 'pack', 'story.orchard_cleared': true, 'story.sway_fernbrook': -2, 'story.ilse_call2': true,
  'story.keeper_cadet': true, 'story.cover': 'glimmer', 'story.side': 'keepers', 'story.side_pick_done': true, 'story.seal2': true,
  'story.seal3': true, 'story.route3_open': true, 'story.ep1_end': true, 'story.ilse_call3': true, 'story.a2_called': true,
  'story.cover_done': true, 'story.rpt_1': 'told', 'story.rpt_2': 'told', 'story.rpt_3': 'told', 'story.hc_council_done': true,
  'story.gov_posted': true, 'story.cv_mom_walk': true, 'story.cv_mom': 'told', 'story.cv_mom_day': null,
});
// Between Seal 4 and Seal 5 (nothing in the game sets story.seal4 yet: seeded).
const SEAL4 = Object.assign({}, POSTED, { 'story.seal4': true });
// Act 5, after the Ledger Night and the Spire (story.ilse_ledger and story.solvane_met: later builds, seeded).
const ACT5 = Object.assign({}, POSTED, { 'story.seal4': true, 'story.seal5': true, 'story.ilse_ledger': true, 'story.solvane_met': true });

function save(flags, world, seals) {
  const s = starterSave();
  s.settings.controls = 'modern';   // Vincent, Nov 4: Modern for every test
  s.settings.textSpeed = 'fast';
  s.settings.follower = false;
  Object.assign(s.flags, flags);
  for (const [k, v] of Object.entries(s.flags)) if (v === null) delete s.flags[k];
  s.world = Object.assign({ map: 'hm_home_in', x: 5, y: 6, facing: 'up', respawn: 'hearthmoor' }, world || {});
  s.seals = seals || { seal_fernbrook: 1700000000000, seal_glim_1: 1700000000000, seal_glim_2: 1700000000000, seal_glim_3: 1700000000000 };
  s.standing = { keepers: 10, glimmer: 0 };
  return s;
}
async function boot(page, s, opts = {}) {
  if (opts.reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
  if (opts.once) {   // a reload keeps what the game wrote (installSave writes the seed on every load)
    await page.context().addInitScript(() => { if (sessionStorage.getItem('md_seeded')) window.__mdKeep = localStorage.getItem('pixelpets.save.v2'); });
    await installSave(page.context(), s, { quietDay: true, oldSave: !!opts.oldSave });
    await page.context().addInitScript(() => { if (window.__mdKeep) localStorage.setItem('pixelpets.save.v2', window.__mdKeep); sessionStorage.setItem('md_seeded', '1'); });
  } else await installSave(page.context(), s, { quietDay: true, oldSave: !!opts.oldSave });
  await gotoGame(page, opts.search != null ? opts.search : '?debug=1');
  if (opts.search != null) return;
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && typeof PixelPets.talkTo === 'function' && PixelPets.state);
  await page.evaluate(() => { PixelPets.showTab('walk'); if (PixelPets.clearWild) PixelPets.clearWild(); });
}
const flags = page => page.evaluate(() => Object.assign({}, PixelPets.state.flags));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
const sceneId = page => page.evaluate(() => PixelPets.scene && PixelPets.scene.id);
const ids = page => page.evaluate(() => PixelPets.mapObjs.map(o => o.id));
async function goto(page, map, x, y, facing) {
  await page.evaluate(([m, x, y, f]) => PixelPets.goto(m, x, y, f), [map, x, y, facing || 'down']);
  await page.waitForFunction(m => PixelPets.mapInfo.id === m && !PixelPets.fading, map);
}
// Modern controls: a tap on a person or prop walks over and talks.
async function tapTile(page, x, y) {
  await expect.poll(() => page.evaluate(async () => {
    const a = Object.assign({}, PixelPets.walk.cam);
    await new Promise(r => setTimeout(r, 120));
    const b = PixelPets.walk.cam;
    return a.x === b.x && a.y === b.y;
  }), { timeout: 5000 }).toBe(true);
  const r = await page.evaluate(({ x, y }) => {
    const mc = document.querySelector('#mapCanvas'), b = mc.getBoundingClientRect(), cam = PixelPets.walk.cam;
    const cx = b.left + ((x * 16 + 8 - cam.x) / mc.width) * b.width, cy = b.top + ((y * 16 + 8 - cam.y) / mc.height) * b.height;
    const opt = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 };
    mc.dispatchEvent(new PointerEvent('pointerdown', opt));
    mc.dispatchEvent(new PointerEvent('pointerup', opt));
    return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
  }, { x, y });
  expect(r, 'tile ' + x + ',' + y + ' on screen').toBe(true);
}
// Plays the open scene to its end; records each line [who, text] and each choice ['>', pick, labels, prompt].
async function drive(page, picks = [], ms = 90000, onLine = null) {
  const until = Date.now() + ms, lines = [];
  let last = null;
  while (Date.now() < until) {
    const sc = await page.evaluate(() => PixelPets.scene && { mode: PixelPets.scene.mode, full: PixelPets.scene.full, waiting: PixelPets.scene.waiting, text: PixelPets.scene.text, who: PixelPets.scene.who });
    if (!sc) { await page.waitForTimeout(150); if (!(await page.evaluate(() => !!PixelPets.scene))) return lines; continue; }
    if (sc.mode === 'choice') {
      if (!sc.full) { await page.waitForTimeout(40); continue; }
      if (!(await page.locator('#sbChoices button:visible').count())) { await page.waitForTimeout(40); continue; }
      await page.waitForFunction(() => PixelPets.optionsReady === true);
      const labels = (await page.locator('#sbChoices button').allTextContents()).map(t => t.trim());
      for (const b of await page.locator('#sbChoices button').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
      const pick = picks.find(p => labels.includes(p)) || labels[0];
      lines.push(['>', pick, labels, sc.text]);
      await page.locator('#sbChoices button', { hasText: pick }).first().click();
      await page.waitForTimeout(40); continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (!sc.full) { await page.waitForTimeout(40); continue; }
      const key = sc.who + '|' + sc.text;
      if (key !== last) { lines.push([sc.who || '', sc.text]); last = key; if (onLine) await onLine(sc, lines.length - 1); }
      await page.keyboard.press('Space'); await page.waitForTimeout(30); continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('scene did not end');
}
const says = lines => lines.filter(l => l[0] !== '>').map(l => l[1]);
// The day's hello and the built unlock bookkeeping (story.unlock_*, written at boot by the phone and panels) are not this packet's.
const noDaily = f => Object.fromEntries(Object.entries(f).filter(([k]) => !/^daily\.|^story\.unlock_/.test(k)));
const MD_FLAGS = ['story.mom_mah_ask', 'story.mom_mahopac', 'story.lens_note', 'story.lens_seen'];

test.describe('MD-1: the two built-drift fixes (G1 D1951, G2 D1949)', () => {
  test('G1: mahopac.json says the chain is required; the keys stay @w1', async () => {
    expect(MAH.status).toBe('playable story chain. Required on new saves (D1167, quests.js home_trip). Telling Ilse stays optional.');
    expect(MAH.decisions['1_optional']).toBe('Was optional (D27). Since D1167 the dream is a main-chain step on new saves. Old saves that skipped it still load and go on.');
    expect(Object.keys(MAH.decisions)).toEqual(['1_optional', '2_ilse', '3_dream_art', '4_no_conflict']);
    expect(MAH.status).not.toMatch(/optional after|does not gate/i);
  });

  test('T5 (G2): Dad shows no place line on PEOPLE; Mom still reads home · AT HOME', async ({ page }) => {
    const s = save({ 'story.phone_got': true, 'story.lizzy_met': true }, { map: 'hearthmoor', x: 8, y: 8, facing: 'down' }, {});
    s.phoneBook = { met: { Mom: true, Dad: true, Lizzy: true }, fav: {} };
    await boot(page, s);
    expect(await page.evaluate(() => PixelPets.whereNow('Dad'))).toBeNull();
    expect((await page.evaluate(() => PixelPets.whereNow('Mom'))).line).toBe('home · AT HOME');
    await page.locator('#repBtn').click();
    await expect(page.locator('#ovRep')).toBeVisible();
    const row = name => page.locator('.rep-row').filter({ has: page.locator('.rep-name', { hasText: new RegExp('^' + name + '$') }) });
    await expect(row('Dad')).toHaveCount(1);
    await expect(row('Dad').locator('.where-line')).toHaveCount(0);
    await expect(row('Mom').locator('.where-text')).toHaveText('home · AT HOME');
    await shot(page, 'mahopac-dad-people');
    await row('Dad').locator('.rep-face-btn').click();
    await expect(page.locator('#repCard')).toBeVisible();
    await expect(page.locator('#repCard .where-line')).toHaveCount(0);
    await expect(page.locator('#repCard .rep-name')).toHaveText('Dad');
  });

  // T1: old saves of every kind load with v 2, the same flags, nothing written at load; the quest still resolves.
  const OLD = {
    'pre-D1167, skipped Mahopac': [{ 'story.reached_route1': true, 'story.reached_fernbrook': true, 'story.met_fen': true, 'story.seal1': true }, { map: 'fernbrook', x: 12, y: 8, facing: 'down' }],
    'Mahopac done': [DREAMED, { map: 'hm_home_in', x: 5, y: 6, facing: 'up' }],
    'mid-dream (the birthday done)': [{ 'story.mom_met': true, 'story.mom_chore': true, 'story.mom_sent': true, 'story.reached_mahopac': true, 'story.dream_started': true, 'story.dream_toy': true, 'story.dream_party': true }, { map: 'dream_drive', x: 5, y: 3, facing: 'left' }],
    'Act 2 before Seal 4': [POSTED, { map: 'hm_home_in', x: 5, y: 6, facing: 'up' }],
    'Act 5, With the Warden': [Object.assign({}, ACT5, { 'story.rpt_4': 'kept' }), { map: 'mahopac_obs', x: 4, y: 5, facing: 'up' }],
    'Act 5, the loyalist': [Object.assign({}, ACT5, { 'story.warden_cut': true }), { map: 'mahopac_obs', x: 4, y: 5, facing: 'up' }],
    'Act 5, the switcher': [Object.assign({}, ACT5, { 'story.switched_a3': true, 'story.ilse_p0': true }), { map: 'mahopac_obs', x: 4, y: 5, facing: 'up' }],
  };
  for (const [name, [f, world]] of Object.entries(OLD)) {
    test(`T1: ${name} loads unchanged @w1`, async ({ page }) => {
      const s = save(f, world, name.indexOf('pre-D1167') === 0 ? {} : undefined);
      await boot(page, s, { oldSave: true });
      const want = noDaily(Object.assign({}, s.flags));
      await page.waitForTimeout(400);
      const st = await stored(page);
      expect(st.v).toBe(2);
      expect(noDaily(st.flags)).toEqual(want);
      expect(noDaily(await flags(page))).toEqual(want);
      for (const k of MD_FLAGS) expect(st.flags[k] === undefined || st.flags[k] === s.flags[k], k).toBe(true);
      expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
      expect(typeof (await page.evaluate(() => PixelPets.quest && PixelPets.quest.id))).toBe('string');
    });
  }
});

// ---- MD-2: Mom's walk north (§4, D1944, D1945) ----
const MV1 = {
  told: 'You told me the truth at supper. I wanted to see one more true thing.',
  cover: "A better offer, you said at supper. Up here, nobody's offering anything.",
  quiet: "You didn't answer me at supper. That's all right. Nobody talks much up here.",
  pin: "A Keeper pin, and now a lens. You've had a busy year, love.",
};
const MV2 = 'Go on, then. Show me how it works.';
const MO3 = 'You walk north together. Maze trots ahead and waits at every bend.';
const LOOK = {
  'The drive-through': ['told', ['The glass blooms for you, not for her: the drive-through, the tray light, the seat beside you.',
    'You tell her. The fries, the tray light, the talk about someday.', 'The MacRonalds one.', "Mom opens her mouth to say something. Then she doesn't.",
    'Neither of you says the next thing. The lens hums. On the sill, Maze sighs in her sleep.',
    "Right. The kettle won't keep itself. Don't stay up here too long.", 'She squeezes your shoulder on the way out. The door creaks shut behind her.']],
  'Nothing much': ['held', ['The glass blooms for you, not for her: the drive-through, the tray light, the seat beside you.',
    'All right.', 'She looks at the glass a long time anyway, as if it might bloom for her.',
    'Neither of you says the next thing. The lens hums. On the sill, Maze sighs in her sleep.',
    "Right. The kettle won't keep itself. Don't stay up here too long.", 'She squeezes your shoulder on the way out. The door creaks shut behind her.']],
};
const REPEAT = { told: 'Thank you for the lens, love.', held: 'That lens. I keep thinking about it.' };
// The built daily snack (ACT2_COVER_STORY D1696) plays before the offer when due; these runs mark today's as given.
const TODAY = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
const FED = { 'story.cv_mom_day': TODAY };
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
async function noraBark(page) {
  await goto(page, 'mahopac', 9, 12, 'up');
  await page.waitForTimeout(300);
  if (await sceneId(page)) await drive(page);   // a story call for the seeded act may open on arrival
  await page.waitForTimeout(2600);              // one bubble at a time (CHATTER_MS)
  await page.evaluate(() => PixelPets.walkStep('up'));
  await expect(page.locator('#chatBubble')).toBeVisible();
  return (await page.locator('#chatBubble').textContent()).trim();
}

test.describe("MD-2: Mom's walk north (D1944, D1945)", () => {
  test('T2: the offer shows on Mom\'s tap only while its key holds; "Not today" writes nothing @w1', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, save(SEAL4));
    const qid = await page.evaluate(() => PixelPets.quest.id);
    expect(await sceneId(page)).toBeFalsy();   // never auto-plays on entering home
    const offer = async () => { await page.evaluate(() => PixelPets.talkTo('mom')); const id = await sceneId(page); await drive(page, ['Not now', 'Not today']); return id; };
    for (const [k, v] of [['story.seal4', null], ['story.seal5', true], ['story.cv_mom', null], ['story.dream_woke', null], ['story.mom_mah_ask', true]]) {
      const was = (await flags(page))[k];
      await page.evaluate(([k, v]) => PixelPets.setFlag(k, v), [k, v]);
      expect(await offer(), 'no offer with ' + k + '=' + v).not.toBe('mom_lens_offer');
      await page.evaluate(([k, v]) => PixelPets.setFlag(k, v === undefined ? null : v), [k, was]);
    }
    const before = noDaily((await stored(page)).flags);
    await page.evaluate(() => PixelPets.talkTo('mom'));
    expect(await sceneId(page)).toBe('mom_lens_offer');
    const lines = await drive(page, ['Not today']);
    const ch = lines.find(l => l[0] === '>');
    expect(ch[2]).toEqual(['Walk with her', 'Not today']);
    expect(ch[3]).toBe("Walk north with me? I'd like to see this lens of yours.");
    expect(says(lines).slice(-1)).toEqual(['Another day, then. The lens will keep.']);
    const after = noDaily((await stored(page)).flags);
    delete before['story.cv_mom_day']; delete after['story.cv_mom_day'];   // the built daily snack may play first
    expect(after).toEqual(before);
    await page.evaluate(() => PixelPets.talkTo('mom'));
    expect(await sceneId(page)).toBe('mom_lens_offer');   // still in her talk next time (no dead end)
    await drive(page, ['Not today']);
    expect(await page.evaluate(() => PixelPets.quest.id)).toBe(qid);   // never a main-chain row
    expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
  });

  for (const [variant, extra, pick] of [
    ['told', {}, 'The drive-through'],
    ['cover', { 'story.cv_mom': 'cover' }, 'Nothing much'],
    ['quiet', { 'story.cv_mom': 'quiet' }, 'The drive-through'],
    ['pin', { 'story.cv_mom': 'quiet', 'story.cover': null, 'story.cv_mom_walk': null }, 'Nothing much'],
  ]) {
    test(`T3/T4: ${variant}: walk north, MV1, the lens, ${pick}; the silence; flags once; repeats`, async ({ page }) => {
      test.setTimeout(150000);
      const reduce = variant === 'cover';
      await boot(page, save(Object.assign({}, SEAL4, extra, FED)), { reduce });
      if (variant === 'told') await tapTile(page, 5, 4);   // Modern: tap Mom
      else await page.evaluate(() => PixelPets.talkTo('mom'));
      await expect.poll(() => sceneId(page), { timeout: 15000 }).toBe('mom_lens_offer');
      const walk = await drive(page, ['Walk with her']);
      expect(says(walk)).toEqual([MO3, MV1[variant], MV2]);
      expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('mahopac_obs');
      const k = await page.evaluate(() => PixelPets.keeper);
      expect([k.x, k.y, k.facing]).toEqual([4, 4, 'up']);
      if (reduce) expect(Number.isInteger(k.fx) && Number.isInteger(k.fy)).toBe(true);
      const mom = (await page.evaluate(() => PixelPets.mapObjs)).find(o => o.id === 'mom_obs');
      expect([mom.x, mom.y]).toEqual([5, 2]);
      expect((await stored(page)).flags['story.mom_mah_ask']).toBe(true);   // written at the warp
      expect((await stored(page)).flags['story.mom_mahopac']).toBeUndefined();
      if (variant === 'told') await shot(page, 'mahopac-mom-lens');
      await tapTile(page, 4, 2);   // Modern: tap the lens
      await expect.poll(() => sceneId(page), { timeout: 15000 }).toBe('mom_lens_look');
      let hush = null;
      const look = await drive(page, [pick], 90000, async (sc) => {
        if (/^Neither of you/.test(sc.text)) hush = await page.evaluate(() => ({ cue: PixelPets.scene.music, want: PPSound.musicWant }));
        if (/^The MacRonalds/.test(sc.text) || /^Neither of you/.test(sc.text)) expect(await noOverflow(page)).toBe(true);
      });
      expect(says(look)).toEqual(LOOK[pick][1]);
      const ch = look.find(l => l[0] === '>');
      expect(ch[2]).toEqual(['The drive-through', 'Nothing much']);
      expect(ch[3]).toBe('What does it show you?');
      expect(hush).toEqual({ cue: 'hush', want: null });   // T4: the music falls silent on MV9
      expect(await page.evaluate(() => PPSound.musicWant)).toBe('town');   // the room's loop after the scene
      const f = await flags(page);
      expect(f['story.mom_mahopac']).toBe(LOOK[pick][0]);
      expect(await ids(page)).not.toContain('mom_obs');   // she went home
      const st = await stored(page);
      expect(st.v).toBe(2);
      expect(st.flags['story.mom_mahopac']).toBe(LOOK[pick][0]);
      // The lens is the built lens again; her repeat at home; Nora's chatter (DA4).
      await page.evaluate(() => PixelPets.talkTo('obs_scope'));
      expect(says(await drive(page))).toEqual(['The lens is quiet. It remembers you, and it lets you leave.']);
      expect(await noraBark(page)).toBe("Your mom waved. I'm still waving back.");
      await goto(page, 'hm_home_in', 5, 6, 'up');
      await page.evaluate(() => PixelPets.talkTo('mom'));
      expect(says(await drive(page, ['Not now']))[0]).toBe(REPEAT[LOOK[pick][0]]);
      await page.evaluate(() => PixelPets.setFlag('story.seal5', true));   // Act 3: Nora is BUILT again; Supper's repeat returns
      expect(await noraBark(page)).toBe('Still waving. The minute will not end.');
      expect(st.flags['story.mom_mah_ask']).toBe(true);
      expect(await page.evaluate(() => PixelPets.questCheck)).toEqual([]);
    });
  }

  test('T3: an interrupted walk resumes in the Observatory; talking to Mom replays from MV1 and nothing is written twice @w1', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page, save(Object.assign({}, SEAL4, FED)), { once: true });
    await page.evaluate(() => PixelPets.talkTo('mom'));
    await drive(page, ['Walk with her']);
    await page.reload({ waitUntil: 'commit' });
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state);
    await page.evaluate(() => PixelPets.showTab('walk'));
    expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('mahopac_obs');
    expect(await ids(page)).toContain('mom_obs');
    await page.evaluate(() => PixelPets.talkTo('mom_obs'));
    expect(await sceneId(page)).toBe('mom_lens');
    expect(says(await drive(page))).toEqual([MV1.told, MV2]);
    await page.evaluate(() => PixelPets.talkTo('obs_scope'));
    await expect.poll(async () => { const m = await page.evaluate(() => PixelPets.scene && PixelPets.scene.mode); if (m !== 'choice') await page.keyboard.press('Space'); return m; }, { timeout: 20000 }).toBe('choice');
    await page.reload({ waitUntil: 'commit' });   // closed mid-scene: nothing written
    await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state);
    await page.evaluate(() => PixelPets.showTab('walk'));
    expect((await flags(page))['story.mom_mahopac']).toBeUndefined();
    await page.evaluate(() => PixelPets.talkTo('obs_scope'));
    expect(await sceneId(page)).toBe('mom_lens_look');
    await drive(page, ['Nothing much']);
    expect((await stored(page)).flags['story.mom_mahopac']).toBe('held');
    await page.evaluate(() => PixelPets.talkTo('obs_scope'));
    expect(await sceneId(page)).not.toBe('mom_lens_look');
    await drive(page);
    expect((await stored(page)).flags['story.mom_mahopac']).toBe('held');
  });
});

// ---- Lines (T5, T11): read from the data, so a later edit is checked too ----
const DET = JSON.parse(fs.readFileSync(path.join(DATA, 'detail_zzzz_mahopac_dreams.json'), 'utf8'));
const COVER = JSON.parse(fs.readFileSync(path.join(DATA, 'detail_zzz_act2_cover.json'), 'utf8'));
const MOM_SCENES = ['mom_lens_offer', 'mom_lens', 'mom_lens_look'];
const LENS_SCENES = ['lens_note', 'lens_step', 'lens_moment', 'lens_look', 'lens_sill', 'mahopac_card'];
function linesOf(steps, out = []) {   // [{ who, text, kind }] for every say, choice prompt and label in a step list
  for (const st of steps || []) {
    if (!Array.isArray(st)) continue;
    if (st[0] === 'say') out.push({ who: st[1], text: st[2], kind: 'say' });
    else if (st[0] === 'choice') {
      out.push({ who: st[3] || '', text: st[1], kind: 'say' });
      for (const [label, body] of st[2]) { out.push({ who: '', text: label, kind: 'label' }); linesOf(body, out); }
    } else if (st[0] === 'if') { linesOf(st[2], out); linesOf(st[3], out); }
  }
  return out;
}
const len = t => Array.from(String(t).replace(/\{[a-z]+\}/gi, '0123456789')).length;   // Len counts each {token} as 10
const momRepeats = () => Object.values(DET.objPatch.mom.linesBefore.add).filter(l => l[0] !== '@');
const PLACE_WORDS = ['father', 'dad', 'gone', 'away', 'left', 'leave', 'died', 'dead', 'passed', 'late', 'lost', 'miss', 'missed',
  'would have', 'used to', 'back then', 'these days', 'wherever', 'still', 'anymore'];
const hasWord = (t, w) => new RegExp('\\b' + w.replace(/ /g, '\\s+') + '\\b', 'i').test(t);

test.describe('MD lines: the D1921 scan and the line limits (T5, T11)', () => {
  test('T5: Mom names nobody and places nobody in this packet\'s lines and the rewrites; Supper\'s other Mom lines never say father or dad @w1', async () => {
    const mine = MOM_SCENES.flatMap(id => linesOf(MAH.scenes[id])).filter(l => l.who === 'Mom').map(l => l.text).concat(momRepeats());
    expect(mine.length).toBeGreaterThanOrEqual(10);
    // ACT2_COVER_STORY v0.1.2's rewrites that are built (the third, Mom after a switch, is Act 3 and not built).
    const rewrites = ['A Keeper pin. Look at you. Sit down before supper goes cold.', 'Hm. A better offer. They always sound good at the door.'];
    const coverMom = Object.values(COVER.scenes).flatMap(st => linesOf(st)).filter(l => l.who === 'Mom').map(l => l.text)
      .concat(Object.values(COVER.objPatch.mom.linesBefore.add).filter(l => l[0] !== '@'));
    for (const r of rewrites) expect(coverMom).toContain(r);
    for (const t of mine.concat(rewrites)) for (const w of PLACE_WORDS) expect(hasWord(t, w), JSON.stringify(t) + ' has ' + w).toBe(false);
    for (const t of coverMom) for (const w of ['father', 'dad']) expect(hasWord(t, w), JSON.stringify(t) + ' has ' + w).toBe(false);
    const all = MOM_SCENES.concat(LENS_SCENES).flatMap(id => linesOf(MAH.scenes[id] || [])).map(l => l.text);
    for (const t of all) expect(hasWord(t, 'father'), t).toBe(false);
  });

  test('T11: every new line meets its limit; the wording scan finds nothing @w1', async () => {
    const lines = MOM_SCENES.concat(LENS_SCENES).flatMap(id => linesOf(MAH.scenes[id] || []));
    expect(lines.length).toBeGreaterThan(20);
    for (const l of lines) {
      if (l.kind === 'label') expect(len(l.text), l.text).toBeLessThanOrEqual(30);
      else expect(len(l.text), l.text).toBeLessThanOrEqual(110);
      expect(l.text, 'double space').not.toMatch(/ {2}/);
      expect(l.text).not.toMatch(/\b(faint(ed)?|evolv\w*|coins?|appeared|go, [a-z]+!|[a-z]+dex|trainers?|chip|alien|god)\b/i);
      expect(l.text).not.toMatch(/[‘’“”]/);   // straight quotes
      for (const m of String(l.text).match(/\{[a-z]+\}/gi) || []) expect(['{pet}', '{name}', '{date}']).toContain(m);
    }
    for (const t of momRepeats()) expect(len(t), t).toBeLessThanOrEqual(40);
    const nora = MAH.maps.mahopac.objs.find(o => o.id === 'nora');
    for (const t of Object.values(nora.chatter)) expect(len(t), t).toBeLessThanOrEqual(40);
  });
});
