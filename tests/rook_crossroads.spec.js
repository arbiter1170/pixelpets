/* Rook's Crossroads: both factions, the switch, and the stay path. See tests/README.md. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function cobbleSave(extraFlags, extra) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.side_pick_done': true,
    'story.cobble_end': true,
    'story.quarry_bought': true,
    'story.seal1': true,
    'story.seal2': true,
    'story.slice_end': true,
  }, extraFlags || {});
  save.seals = { seal_cobblecrest: 1, seal_fernbrook: 1 };
  save.world = { map: 'cobblecrest', x: 27, y: 7, facing: 'right', respawn: 'cobblecrest' };
  save.ui = { sideSeen: ['phone', 'mom'], sideTracked: 'rc_meet' };
  if (extra) Object.assign(save, extra);
  return save;
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.rookOffer === 'function');
  await page.evaluate(() => PixelPets.setLevel(50));
}

// Plays a scene that may open a battle. Records say lines and choice prompts. A win is forced once.
async function playLog(page, choices, opts) {
  const left = choices.slice();
  const says = [];
  const prompts = [];
  const options = [];   // every choice label shown, in order
  let won = false;
  let foes = null;
  let shotSay = false;
  let shotChoice = false;
  const opt = opts || {};
  for (let i = 0; i < 240; i++) {
    const st = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      const b = window.PixelPets.battle;
      return {
        scene: !!s,
        mode: s && s.mode,
        full: s && s.full,
        waiting: s && s.waiting,
        text: s && s.text,
        battle: !!(b && b.on),
        panel: b && b.panel,
        foes: b && b.on ? (b.foes || []).map(f => ({ form: f.form, level: f.level })) : null,
      };
    });
    if (!st.scene && !st.battle) return { says, prompts, foes, options };
    if (await page.locator('#btOk').isVisible().catch(() => false)) {
      await page.locator('#btOk').click();
      await page.waitForTimeout(30);
      continue;
    }
    if (st.battle) {
      if (st.foes && st.foes.length) foes = st.foes;
      if (!won) {
        if (st.panel !== 'acts' && st.panel !== 'end') {
          if (await page.locator('#btMsg').isVisible().catch(() => false)) await page.locator('#btMsg').click();
          await page.waitForTimeout(30);
          continue;
        }
        await page.evaluate(() => { PixelPets.battle.textMs = 0; PixelPets.winBattle(); });
        won = true;
        await page.waitForTimeout(40);
        continue;
      }
    }
    if (st.mode === 'choice' && st.full && !st.battle) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      if (opt.shotChoice && !shotChoice && st.text && st.text.indexOf(opt.shotChoice) >= 0) {
        shotChoice = true;
        await shot(page, opt.shotName || 'rc-switch-confirm');
      }
      options.push(...await page.locator('#sbChoices button').allTextContents());
      const label = left.shift();
      if (!label) throw new Error('choice "' + st.text + '" but the test had no answer left');
      prompts.push(st.text);
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(30);
      continue;
    }
    if (st.mode === 'say' && st.waiting && !st.battle) {
      if (!says.length || says[says.length - 1] !== st.text) says.push(st.text);
      if (opt.shotSay && !shotSay) { shotSay = true; await shot(page, opt.shotSay); }
      await page.keyboard.press('Space');
      await page.waitForTimeout(25);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('scene did not finish');
}

test('Keepers free the crates, fight Tobin, and Hale pays the road snacks', async ({ page }) => {
  test.setTimeout(120000);
  const save = cobbleSave({
    'story.side': 'keepers',
    'story.rook_end': 'ally',
  }, { questSeen: 'hc_council', standing: { keepers: 0, glimmer: 0 } });
  await boot(page, save);
  const start = await page.evaluate(() => ({
    quest: PixelPets.quest.id,
    v: PixelPets.state.v,
    check: PixelPets.questCheck,
    can: PixelPets.standing.canSwitch,
    pulse: document.querySelector('#questBtn').classList.contains('pulse'),
    side: PixelPets.sideActive.find(a => a.chain === 'rc_meet'),
  }));
  expect(start.v).toBe(2);
  expect(start.check).toEqual([]);
  expect(start.quest).toBe('hc_council');
  expect(start.can).toBe(false);
  expect(start.pulse).toBe(true);
  expect(start.side.label).toBe('The last crates');
  expect(start.side.text).toContain('Brinewick road sign');
  await page.locator('#questBtn').tap();
  await expect(page.locator('#ovQuest')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovQuest')).toBeHidden();
  expect(await page.evaluate(() => document.querySelector('#questBtn').classList.contains('pulse'))).toBe(false);

  const placed = await page.evaluate(() => {
    PixelPets.goto('cobblecrest', 27, 7, 'right');
    return PixelPets.mapObjs.filter(o => o.id === 'rook_road').map(o => ({ x: o.x, y: o.y }));
  });
  expect(placed).toEqual([{ x: 28, y: 7 }]);
  expect(await page.evaluate(() => PixelPets.runScene('rook_road'))).toBe(true);
  await playLog(page, ["Let's free them"], { shotSay: 'rc-rook-dialog' });
  const met = await page.evaluate(() => ({
    start: PixelPets.state.flags['story.rc_start'],
    quit: PixelPets.state.flags['story.rook_quit'],
    end: PixelPets.state.flags['story.rook_end'],
    look: PixelPets.spriteLook('rook'),
  }));
  expect(met.start).toBe(true);
  expect(met.quit).toBe('r5');
  expect(met.end).toBe('ally');
  expect(met.look.accessory).toBe('none');

  const crates = await page.evaluate(() => {
    PixelPets.goto('cobble_quarry', 24, 8, 'up');
    return PixelPets.mapObjs.filter(o => String(o.id).indexOf('rc_crate_') === 0).map(o => ({ id: o.id, x: o.x, y: o.y, art: o.art }));
  });
  expect(crates.map(c => c.id).sort()).toEqual(['rc_crate_1', 'rc_crate_2', 'rc_crate_3']);
  expect(crates.every(c => c.art)).toBe(true);
  await shot(page, 'rc-crate');
  for (const id of ['rc_crate_1', 'rc_crate_2', 'rc_crate_3']) {
    expect(await page.evaluate(n => PixelPets.runScene(n), id)).toBe(true);
    await playLog(page, []);
  }
  expect(await page.evaluate(() => PixelPets.state.flags['story.rc_freed'])).toBe(3);

  expect(await page.evaluate(() => PixelPets.runScene('rc_gate'))).toBe(true);
  await playLog(page, ['Not ever']);
  const freed = await page.evaluate(() => ({
    end: PixelPets.state.flags['story.rc_end'],
    climax: PixelPets.state.flags['story.rc_climax'],
    side: PixelPets.side,
    keepers: PixelPets.standing.keepers.points,
    switches: PixelPets.state.flags['story.switches'] || 0,
    quest: PixelPets.quest.id,
  }));
  expect(freed.end).toBe('freed');
  expect(freed.climax).toBe(true);
  expect(freed.side).toBe('keepers');
  expect(freed.keepers).toBe(10);
  expect(freed.switches).toBe(0);
  expect(freed.quest).toBe('hc_council');

  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  await playLog(page, ['About the seam']);
  const wrap = await page.evaluate(() => ({
    done: PixelPets.state.flags['story.rc_done'],
    bag: PixelPets.state.bag,
    quest: PixelPets.quest.id,
    v: PixelPets.state.v,
    check: PixelPets.questCheck,
    toast: document.querySelector('#toast').textContent,
    chains: PixelPets.sideActive.map(a => a.chain),
  }));
  expect(wrap.done).toBe(true);
  expect(wrap.bag.befriend_treat).toBe(3);
  expect(wrap.bag.hearty_snack).toBe(2);
  expect(wrap.quest).toBe('hc_council');
  expect(wrap.v).toBe(2);
  expect(wrap.check).toEqual([]);
  expect(wrap.toast).toBe('Now tracking: Explore Route 1');
  expect(wrap.chains).not.toContain('rc_meet');
});

test('D161: a Glimmerwell player cannot walk away with Rook; he pleads, then fights, and the score stands', async ({ page }) => {
  test.setTimeout(120000);
  const save = cobbleSave({
    'story.side': 'glimmer',
    'story.rook_end': 'stays',
  }, { questSeen: 'end', standing: { keepers: 0, glimmer: 24 } });
  await boot(page, save);
  const before = await page.evaluate(() => ({
    scene: PixelPets.sceneFor('rook_road'),
    look: PixelPets.spriteLook('rook').accessory,
    row: PixelPets.sideActive.find(a => a.chain === 'rc_meet'),
    quest: PixelPets.quest.id,
  }));
  expect(before.scene).toBe('rook_road@glimmer');
  expect(before.look).toBe('lanyard');
  expect(before.row.text).toContain('lanyard');
  expect(before.quest).toBe('gb_invite');
  expect(await page.evaluate(() => PixelPets.runScene('rook_road'))).toBe(true);
  await playLog(page, ["I'll do my job"]);
  const quit = await page.evaluate(() => ({
    quit: PixelPets.state.flags['story.rook_quit'],
    end: PixelPets.state.flags['story.rook_end'],
    look: PixelPets.spriteLook('rook').accessory,
  }));
  expect(quit.quit).toBeUndefined();
  expect(quit.end).toBe('stays');
  expect(quit.look).toBe('lanyard');
  for (const id of ['rc_crate_1', 'rc_crate_2', 'rc_crate_3']) {
    expect(await page.evaluate(n => PixelPets.runScene(n), id)).toBe(true);
    await playLog(page, ['Stamp: BRINEWICK']);
  }
  expect(await page.evaluate(() => PixelPets.standing.glimmer.points)).toBe(30);
  expect(await page.evaluate(() => PixelPets.runScene('rc_gate'))).toBe(true);
  // No side switch until Act 5 (Vincent, Oct 28, 2026): no "Walk away?" choice, no cost line, no standing offer.
  const gate = await playLog(page, []);
  expect(gate.prompts.some(p => p.indexOf('Walk away') >= 0 || p.indexOf('Really?') >= 0)).toBe(false);
  expect(gate.says).toContain('{name}. Walk away with me, right now. The Pebblits go home to the seam.'.replace('{name}', await page.evaluate(() => PixelPets.state.player.name || 'Wayfarer')));
  expect(gate.says.some(t => t.indexOf('It costs you') >= 0 || t.indexOf('The offer stands') >= 0)).toBe(false);
  expect(gate.foes).not.toBeNull();
  const after = await page.evaluate(() => ({
    side: PixelPets.side,
    switches: PixelPets.state.flags['story.switches'],
    glimmer: PixelPets.standing.glimmer.points,
    end: PixelPets.state.flags['story.rc_end'],
    rook: PixelPets.state.flags['story.rook_end'],
    can: PixelPets.standing.canSwitch,
    v: PixelPets.state.v,
  }));
  expect(after.side).toBe('glimmer');
  expect(after.switches).toBeUndefined();
  expect(after.glimmer).toBe(40);   // 30 + rc_shipped_g; nothing halved
  expect(after.end).toBe('shipped');
  expect(after.rook).toBe('stays');
  expect(after.can).toBe(false);
  expect(after.v).toBe(2);
});

test('a Glimmerwell player who stays fights Rook at levels 21, 22 and 23', async ({ page }) => {
  test.setTimeout(120000);
  const save = cobbleSave({
    'story.side': 'glimmer',
    'story.rook_end': 'stays',
    'story.rc_start': true,
    'story.rc_c1': true,
    'story.rc_c2': true,
    'story.rc_c3': true,
    'story.rc_stamped': 3,
  }, { standing: { keepers: 0, glimmer: 16 }, money: 0 });
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.runScene('rc_gate'))).toBe(true);
  const gate = await playLog(page, []);   // D161: no walk-away choice; Rook pleads, then fights
  expect(gate.foes).toEqual([
    { form: 'moth/1', level: 21 },
    { form: 'gust/1', level: 22 },
    { form: 'tide/1', level: 23 },
  ]);
  const shipped = await page.evaluate(() => ({
    end: PixelPets.state.flags['story.rc_end'],
    side: PixelPets.side,
    glimmer: PixelPets.standing.glimmer.points,
    rook: PixelPets.state.flags['story.rook_end'],
    money: PixelPets.state.money,
  }));
  expect(shipped.end).toBe('shipped');
  expect(shipped.side).toBe('glimmer');
  expect(shipped.glimmer).toBe(26);
  expect(shipped.rook).toBe('stays');
  expect(shipped.money).toBe(230);
  expect(await page.evaluate(() => PixelPets.runScene('rc_wrap_juniper'))).toBe(true);
  const wrap = await playLog(page, []);
  expect(wrap.says.some(s => s.indexOf('got 300 Acorns') >= 0)).toBe(true);
  const bag = await page.evaluate(() => ({
    bag: PixelPets.state.bag,
    money: PixelPets.state.money,
    done: PixelPets.state.flags['story.rc_done'],
    v: PixelPets.state.v,
  }));
  expect(bag.bag.energy_sip).toBe(2);
  expect(bag.bag.joy_crumb).toBe(2);
  expect(bag.money).toBe(530);
  expect(bag.done).toBe(true);
  expect(bag.v).toBe(2);
});

test('D161: Rook has no "About sides" offer and his debug offer says wait; an old desk save is marked desk', async ({ page }) => {
  test.setTimeout(90000);
  const save = cobbleSave({
    'story.side': 'keepers',
    'story.rc_climax': true,
    'story.rc_end': 'freed',
    'story.rook_bond': 4,
  }, { standing: { keepers: 20, glimmer: 4 } });
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.runScene('rook_after'))).toBe(true);
  const talk = await playLog(page, ['See you']);
  expect(talk.options).toContain('See you');
  expect(talk.options).not.toContain('About sides');
  expect(await page.evaluate(() => PixelPets.standing.canSwitch)).toBe(false);
  expect(await page.evaluate(() => PixelPets.rookOffer('glimmer'))).toBe(true);
  const offer = await playLog(page, []);
  const wait = await page.evaluate(() => PixelPets.standingCfg().switch.rook.wait);
  expect(offer.says).toEqual([wait]);
  const once = await page.evaluate(() => ({ side: PixelPets.side, switches: PixelPets.state.flags['story.switches'], keepers: PixelPets.standing.keepers.points, bond: PixelPets.state.flags['story.rook_bond'] }));
  expect(once).toEqual({ side: 'keepers', switches: undefined, keepers: 20, bond: 4 });

  const old = cobbleSave({
    'story.side': 'keepers',
    'story.rc_climax': true,
    'story.switches': 1,
    'story.switch_chapter': 2,
    'story.rook_bond': 3,
    'story.orchard_cleared': true,
  }, { standing: { keepers: 15, glimmer: 12 } });
  const ctx = await page.context().browser().newContext({ viewport: page.viewportSize(), isMobile: true, hasTouch: true });
  await installSave(ctx, old, { quietDay: true });
  const p2 = await ctx.newPage();
  const errs = [];
  p2.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p2.on('pageerror', e => errs.push(e.message));
  await gotoGame(p2, '?debug=1');
  await p2.waitForFunction(() => window.PixelPets.debug === true);
  const loaded = await p2.evaluate(() => ({
    via: PixelPets.state.flags['story.switch_via'],
    switches: PixelPets.state.flags['story.switches'],
    bond: PixelPets.state.flags['story.rook_bond'],
    orchard: PixelPets.state.flags['story.orchard_cleared'],
    keepers: PixelPets.state.standing.keepers,
    glimmer: PixelPets.state.standing.glimmer,
    v: PixelPets.state.v,
    rook: PixelPets.state.flags['story.rook_end'],
    chapter: PixelPets.standing.chapter,
  }));
  expect(loaded.via).toBe('desk');
  expect(loaded.switches).toBe(1);
  expect(loaded.bond).toBe(3);
  expect(loaded.orchard).toBe(true);
  expect(loaded.keepers).toBe(15);
  expect(loaded.glimmer).toBe(12);
  expect(loaded.v).toBe(2);
  expect(loaded.rook).toBeUndefined();
  expect(loaded.chapter).toBe(2);
  expect(await p2.evaluate(() => PixelPets.rookOffer('glimmer'))).toBe(true);
  await p2.waitForFunction(() => { const s = window.PixelPets.scene; return s && s.full && s.mode === 'say'; });
  expect(await p2.evaluate(() => PixelPets.scene.text)).toBe(await p2.evaluate(() => PixelPets.standingCfg().switch.rook.refused));
  await p2.evaluate(() => PixelPets.setFlag('story.seal3', true));
  expect(await p2.evaluate(() => PixelPets.standing.chapter)).toBe(3);
  expect(errs).toEqual([]);
  await ctx.close();
});

test('a save with no crate flags still loads at v2 @w1', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  const r = await page.evaluate(() => ({
    v: PixelPets.state.v,
    check: PixelPets.questCheck,
    quest: PixelPets.quest.id,
    rc: Object.keys(PixelPets.state.flags).filter(k => k.indexOf('story.rc_') === 0),
    via: PixelPets.state.flags['story.switch_via'],
  }));
  expect(r.v).toBe(2);
  expect(r.check).toEqual([]);
  expect(r.quest).toBe('rival1');
  expect(r.rc).toEqual([]);
  expect(r.via).toBeUndefined();
});
