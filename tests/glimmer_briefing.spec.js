/* The Signal Review (GLIMMER_NEXT_QUEST, Q22). After Cobblecrest, a Glimmerwell save walks four steps. Keepers still see the council. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function reviewSave(extra, pet) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.side': 'glimmer',
    'story.side_pick_done': true,
    'story.seal1': true,
    'story.rook_pact': 'race',
    'story.route2_end': true,
    'story.reached_cobblecrest': true,
    'story.cobble_end': true,
  }, extra || {});
  if (pet) Object.assign(save.party[0], pet);
  save.world = { map: 'cobble_quarry', x: 16, y: 5, facing: 'up', respawn: 'fernbrook' };
  return save;
}

function chipped(align, happy) {
  return { chip: { on: true, at: 1, locked: true }, align: align, happy: happy == null ? 60 : happy };
}

async function boot(page, save) {
  await page.addInitScript(() => { window.PP_SIGNAL_FAST = true; });
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

async function playThrough(page, choices, prompts, says) {
  const left = choices.slice();
  const seen = new Set();
  for (let i = 0; i < 280; i++) {
    if (await page.locator('#ovSheet').isVisible().catch(() => false)) {
      await page.locator('#shList button').first().click();
      await page.waitForTimeout(40);
      continue;
    }
    if (await page.locator('#btOk').isVisible().catch(() => false)) {
      await page.locator('#btOk').click();
      await page.waitForTimeout(40);
      continue;
    }
    const st = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      const b = window.PixelPets.battle;
      return { scene: !!s, mode: s && s.mode, full: s && s.full, waiting: s && s.waiting, text: s && s.text, battle: !!(b && b.on), panel: b && b.panel };
    });
    if (!st.scene && !st.battle) return;
    if (st.battle) {
      if (st.panel !== 'acts' && st.panel !== 'end') {
        if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click();
        await page.waitForTimeout(40);
        continue;
      }
      await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.winBattle(); });
      await page.waitForTimeout(40);
      continue;
    }
    if (st.mode === 'choice' && st.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      if (prompts) prompts.push(st.text || '');
      const label = left.shift();
      if (!label) throw new Error('scene asked for a choice the test did not have: ' + st.text);
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(40);
      continue;
    }
    if (st.mode === 'say' && st.waiting) {
      if (says && st.text && !seen.has(st.text)) { seen.add(st.text); says.push(st.text); }
      await page.keyboard.press('Space');
      await page.waitForTimeout(20);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('scene did not finish');
}

test('a Glimmerwell save is pointed at the quarry, and Keepers still see the council @w1', async ({ page }) => {
  await boot(page, reviewSave());
  const start = await page.evaluate(() => ({
    quest: PixelPets.quest.id,
    text: PixelPets.quest.text,
    place: PixelPets.quest.place,
    map: PixelPets.quest.target && PixelPets.quest.target.map,
    v: PixelPets.state.v,
    check: PixelPets.questCheck,
    dorian: PixelPets.mapObjs.some(o => o.id === 'gb_dorian'),
  }));
  expect(start.check).toEqual([]);
  expect(start.quest).toBe('gb_invite');
  expect(start.text).toBe('Dorian Pell is back on the quarry stage. Glimmerwell has news.');
  expect(start.place).toBe('Quarry stage');
  expect(start.map).toBe('cobble_quarry');
  expect(start.v).toBe(2);
  expect(start.dorian).toBe(true);
  await page.evaluate(() => PixelPets.setSide('keepers'));
  const keepers = await page.evaluate(() => ({
    quest: PixelPets.quest.id,
    dorian: (() => { PixelPets.goto('cobble_quarry', 16, 5, 'up'); return PixelPets.mapObjs.some(o => o.id === 'gb_dorian'); })(),
  }));
  expect(keepers.quest).toBe('hc_council');
  expect(keepers.dorian).toBe(false);
  await page.evaluate(() => { PixelPets.setSide('glimmer'); PixelPets.setFlag('story.gb_invited', true); });
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('gb_relay');
  await page.evaluate(() => PixelPets.setSide('keepers'));
  expect(await page.evaluate(() => PixelPets.quest.id)).toBe('hc_council');
});

test('the chipped path moves ALIGN by five at each choice and the grants stay quiet', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, reviewSave({}, chipped(50, 60)));
  const before = await page.evaluate(() => ({ align: PixelPets.state.party[0].align, bond: PixelPets.bond.pts, g: PixelPets.standing.glimmer.points, k: PixelPets.standing.keepers.points }));
  expect(await page.evaluate(() => PixelPets.runScene('gb_invite'))).toBe(true);
  await playThrough(page, []);
  expect(await page.evaluate(() => PixelPets.goto('route2_glen', 12, 6, 'up') && PixelPets.runScene('gb_relay'))).toBe(true);
  if (page.viewportSize().width === 390) await shot(page, 'signal-relay');
  await playThrough(page, ['Let it hum']);
  expect(await page.evaluate(() => PixelPets.goto('route2', 25, 2, 'up') && PixelPets.runScene('gb_hollis'))).toBe(true);
  await playThrough(page, ['Tell Imogen']);
  expect(await page.evaluate(() => PixelPets.runScene('gb_escort'))).toBe(true);
  await playThrough(page, []);
  const locked = await page.evaluate(async () => {
    PixelPets.setFlag('story.gb_escort', null);
    PixelPets.goto('fb_heights', 4, 5, 'up');
    PixelPets.walkStep('up');
    const stayed = PixelPets.state.world.map;
    if (PixelPets.scene) PixelPets.endScene();
    PixelPets.setFlag('story.gb_escort', true);
    PixelPets.goto('fb_heights', 4, 5, 'up');
    PixelPets.walkStep('up');
    for (let i = 0; i < 40 && PixelPets.state.world.map === 'fb_heights'; i++) await new Promise(r => setTimeout(r, 50));
    const door = PixelPets.state.world.map;
    return { stayed: stayed, door: door };
  });
  expect(locked.stayed).toBe('fb_heights');
  expect(locked.door).toBe('rx_f1');
  expect(await page.evaluate(() => PixelPets.goto('rx_f4', 6, 6, 'up') && PixelPets.runScene('gb_briefing'))).toBe(true);
  if (page.viewportSize().width === 390) await shot(page, 'signal-briefing');
  await playThrough(page, ['Stand with Glimmerwell']);
  const after = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    const saved = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      align: p.align, happy: p.happy, bond: PixelPets.bond.pts, chip: !!(p.chip && p.chip.on),
      g: PixelPets.standing.glimmer.points, k: PixelPets.standing.keepers.points,
      quest: PixelPets.quest.id, v: PixelPets.state.v, savedV: saved.v,
      done: PixelPets.state.flags['story.gb_done'],
      read: PixelPets.state.flags['story.gb_read'],
      party: PixelPets.state.party.length,
      signal: PixelPets.signalOf(p.id),
    };
  });
  expect(after.align).toBe(before.align + 15);
  expect(after.g).toBe(before.g + 12);
  expect(after.k).toBe(before.k);
  expect(after.bond).toBe(before.bond + 1);
  expect(after.chip).toBe(true);
  expect(after.quest).toBe('end');
  expect(after.done).toBe(true);
  expect(after.read).toBe(true);
  expect(after.happy).toBeCloseTo(53, 0);
  expect(after.party).toBe(1);
  expect(after.v).toBe(2);
  expect(after.savedV).toBe(2);
  expect(after.signal).toBe(1);
});

test('calling it back and holding close pull ALIGN the other way @w1', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, reviewSave({ 'story.gb_invited': true }, chipped(50, 60)));
  expect(await page.evaluate(() => PixelPets.goto('route2_glen', 12, 6, 'up') && PixelPets.runScene('gb_relay'))).toBe(true);
  await playThrough(page, ['Call it back']);
  expect(await page.evaluate(() => PixelPets.runScene('gb_hollis'))).toBe(true);
  await playThrough(page, ['Keep it between us']);
  expect(await page.evaluate(() => PixelPets.runScene('gb_escort'))).toBe(true);
  await playThrough(page, []);
  expect(await page.evaluate(() => PixelPets.goto('rx_f4', 6, 6, 'up') && PixelPets.runScene('gb_briefing'))).toBe(true);
  await playThrough(page, ['Hold Pipkit close']);
  const got = await page.evaluate(() => ({
    align: PixelPets.state.party[0].align,
    g: PixelPets.standing.glimmer.points,
    k: PixelPets.standing.keepers.points,
    hold: PixelPets.state.flags['story.gb_hold'],
    back: PixelPets.state.flags['story.gb_relay_back'],
    kept: PixelPets.state.flags['story.gb_hollis_kept'],
    told: PixelPets.state.flags['story.gb_hollis_told'],
    hollis: (() => { PixelPets.setFlag('trainer.r2_associate', true); PixelPets.goto('route2', 24, 2, 'right'); return PixelPets.mapObjs.some(o => o.id === 'hollis_aside'); })(),
  }));
  expect(got.align).toBe(35);
  expect(got.g).toBe(10);
  expect(got.k).toBe(2);
  expect(got.hold).toBe(true);
  expect(got.back).toBe(true);
  expect(got.kept).toBe(true);
  expect(got.told).toBeFalsy();
  expect(got.hollis).toBe(true);
});

test('an unchipped save borrows a crate, and Not today still finishes', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, reviewSave());
  expect(await page.evaluate(() => PixelPets.runScene('gb_invite'))).toBe(true);
  await playThrough(page, []);
  const loan = await page.evaluate(() => {
    PixelPets.goto('route2_glen', 8, 6, 'up');
    return {
      loan: PixelPets.state.flags['story.gb_loan'],
      crate: PixelPets.mapObjs.some(o => o.id === 'gb_loan_crate' && o.art),
      party: PixelPets.state.party.length,
    };
  });
  expect(loan.loan).toBe(true);
  expect(loan.crate).toBe(true);
  expect(loan.party).toBe(1);
  await page.evaluate(() => {
    PixelPets.setFlag('story.gb_relay_done', true);
    PixelPets.setFlag('story.gb_hollis', true);
    PixelPets.setFlag('story.gb_escort', true);
  });
  expect(await page.evaluate(() => PixelPets.goto('rx_f4', 6, 6, 'up') && PixelPets.runScene('gb_briefing'))).toBe(true);
  if (page.viewportSize().width === 390) await shot(page, 'signal-tuning');
  await playThrough(page, ['Not today', 'Stand with Glimmerwell']);
  const once = await page.evaluate(() => ({
    asked: PixelPets.state.flags['story.gb_tune_asked'],
    chip: PixelPets.state.party.some(p => p.chip && p.chip.on),
    party: PixelPets.state.party.length,
    done: PixelPets.state.flags['story.gb_done'],
    align: PixelPets.state.party[0].align,
    v: PixelPets.state.v,
  }));
  expect(once.asked).toBe(true);
  expect(once.chip).toBe(false);
  expect(once.party).toBe(1);
  expect(once.done).toBe(true);
  expect(once.align == null).toBe(true);
  expect(once.v).toBe(2);
});

test('D161: the Signal Review ends on two choices, with no "I want out" and no offer line from Rook @w1', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, reviewSave({
    'story.gb_invited': true, 'story.gb_relay_done': true, 'story.gb_hollis': true, 'story.gb_escort': true, 'story.rc_climax': true,
  }, chipped(50, 40)));
  expect(await page.evaluate(() => PixelPets.goto('rx_f4', 6, 6, 'up') && PixelPets.runScene('gb_briefing'))).toBe(true);
  let labels = null;
  const says = [];
  for (let i = 0; i < 280 && !labels; i++) {
    if (await page.locator('#ovSheet').isVisible().catch(() => false)) { await page.locator('#shList button').first().click(); continue; }
    const st = await page.evaluate(() => { const s = window.PixelPets.scene; return { scene: !!s, mode: s && s.mode, full: s && s.full, waiting: s && s.waiting, text: s && s.text }; });
    if (!st.scene) break;
    if (st.mode === 'choice' && st.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      const now = await page.locator('#sbChoices button').allTextContents();
      if (now.some(t => t.indexOf('Stand with Glimmerwell') === 0)) { labels = now; break; }
      await page.locator('#sbChoices button').first().click(); continue;
    }
    if (st.mode === 'say' && st.waiting) { says.push(st.text); await page.keyboard.press('Space'); }
    await page.waitForTimeout(25);
  }
  expect(labels).toHaveLength(2);
  expect(labels.join('|')).not.toContain('I want out');
  expect(says.some(t => t.indexOf('Half your score') >= 0)).toBe(false);
  expect(await page.evaluate(() => PixelPets.side)).toBe('glimmer');
});

test('ALIGN stays inside 0 to 100, surge does not stack on GLOW, and JOY holds at 20 @w1', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, reviewSave({}, chipped(50, 60)));
  const cap = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.align = 50;
    const up = [1, 2, 3, 4].map(() => PixelPets.alignNudge('glimmer'));
    p.align = 50;
    const down = [1, 2, 3, 4].map(() => PixelPets.alignNudge('keepers'));
    p.align = 0;
    const floor = PixelPets.alignNudge('keepers');
    p.align = 98;
    const ceil = PixelPets.alignNudge('glimmer');
    const rng = () => 0.99;
    const def = { type: 'BLOOM', level: 20, atk: 20, def: 30 };
    const both = damage({ power: 40, moveType: 'EMBER', att: { type: 'EMBER', level: 20, atk: 40, def: 30, mood: { glowing: true }, signal: 1.1 }, def: def, rng: rng });
    const glow = damage({ power: 40, moveType: 'EMBER', att: { type: 'EMBER', level: 20, atk: 40, def: 30, mood: { glowing: true }, signal: 1 }, def: def, rng: rng });
    const surge = damage({ power: 40, moveType: 'EMBER', att: { type: 'EMBER', level: 20, atk: 40, def: 30, mood: {}, signal: 1.1 }, def: def, rng: rng });
    p.align = 10;
    p.happy = 40;
    p.hunger = 40;
    const bowl = PixelPets.warmBowlReady;
    const fed = PixelPets.careAct('feed');
    p.align = 80;
    p.happy = 20;
    return { up: up, down: down, floor: floor, ceil: ceil, both: both.dmg, glow: glow.dmg, surge: surge.dmg, fed: fed.happy, bowl: bowl };
  });
  expect(cap.up).toEqual([55, 60, 65, 70]);
  expect(cap.down).toEqual([45, 40, 35, 30]);
  expect(cap.floor).toBe(0);
  expect(cap.ceil).toBe(100);
  expect(cap.both).toBe(cap.surge);
  expect(cap.both).toBeGreaterThan(cap.glow);
  expect(cap.fed).toBe(40 + (cap.bowl ? 2.5 : 1.5));
  const opened = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.happy = 20;
    p.align = 80;
    PixelPets.battle.textMs = 0;
    return PixelPets.forceBattle('volt/0', 3);
  });
  expect(opened).toBe(true);
  await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE');
  await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.winBattle(); });
  await page.waitForFunction(() => PixelPets.battle.panel === 'end');
  expect(await page.evaluate(() => PixelPets.state.party[0].happy)).toBe(21);
  await page.locator('#btOk').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
  const opened2 = await page.evaluate(() => {
    PixelPets.healTeam();
    const p = PixelPets.state.party[0];
    p.happy = 22;
    p.align = 80;
    PixelPets.battle.textMs = 0;
    return PixelPets.forceBattle('volt/0', 3);
  });
  expect(opened2).toBe(true);
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE');
  await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.loseBattle(); });
  await page.waitForFunction(() => PixelPets.battle.panel === 'end');
  expect(await page.evaluate(() => PixelPets.state.party[0].happy)).toBe(20);
  await page.locator('#btOk').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
  if (await page.evaluate(() => !!PixelPets.scene)) await page.evaluate(() => PixelPets.endScene());
  const read = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.align = 80;
    p.happy = 25;
    const bond = PixelPets.bond.pts;
    return { bond: bond };
  });
  expect(await page.evaluate(() => PixelPets.runScene('gb_read'))).toBe(true);
  await playThrough(page, []);
  const afterRead = await page.evaluate(() => ({ happy: PixelPets.state.party[0].happy, bond: PixelPets.bond.pts, flag: PixelPets.state.flags['story.gb_read'] }));
  expect(afterRead.happy).toBe(20);
  expect(afterRead.bond).toBe(read.bond);
  expect(afterRead.flag).toBe(true);
});
