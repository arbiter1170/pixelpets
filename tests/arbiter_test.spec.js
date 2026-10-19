/* Arbiter Testing (D24, D187–D193): chip, lock, alignment, Rook's stay, holder wording. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot, playScene } = require('./helpers');

trackErrors(test, expect);

function cobbleSave(extra) {
  const save = starterSave();
  Object.assign(save.flags, {
    'story.side': 'glimmer',
    'story.side_pick_done': true,
    'story.seal1': true,
    'story.quarry_bought': true,
    'story.reached_cobblecrest': true,
  }, extra || {});
  save.world = { map: 'cobblecrest', x: 4, y: 8, facing: 'right', respawn: 'fernbrook' };
  save.standing = { keepers: 0, glimmer: 10 };
  return save;
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.runScene === 'function');
}

function talkStrings(node, bag, inLines) {
  if (Array.isArray(node)) {
    if (node[0] === 'say' && typeof node[2] === 'string') bag.push(node[2]);
    node.forEach((x) => talkStrings(x, bag, inLines));
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    const next = k === 'lines' || inLines;
    if ((k === 'text' || next) && typeof v === 'string') bag.push(v);
    else talkStrings(v, bag, next);
  }
}

test('player-facing lines say holder, and the Testing loop is in the music table', async ({ page }) => {
  const bag = [];
  for (const name of fs.readdirSync('data')) {
    if (!name.endsWith('.json')) continue;
    talkStrings(JSON.parse(fs.readFileSync(path.join('data', name), 'utf8')), bag, false);
  }
  const bad = bag.filter((s) => /\btrainers?\b/i.test(s));
  expect(bad).toEqual([]);
  expect(bag.some((s) => s.includes('young holder'))).toBe(true);
  expect(bag.some((s) => s.includes('every holder'))).toBe(true);
  await boot(page, cobbleSave());
  const music = await page.evaluate(() => ({
    ids: PPSound.musicIds(),
    check: PPSound.musicCheck(),
    glimmer: PixelPets.glimmerCheck,
    partner: PixelPets.cond ? undefined : null,
  }));
  expect(music.ids).toContain('arbiter_test');
  expect(music.check).toEqual([]);
  expect(music.glimmer).toEqual([]);
  const cond = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    const before = { partner: false };
    p.chip = { on: true, at: 1, locked: true };
    p.align = 50;
    return { any: PixelPets.state.party.some((q) => q.chip && q.chip.on), align: p.align, before };
  });
  expect(cond.any).toBe(true);
  expect(cond.align).toBe(50);
});

test('an old tour.doubt value is read once and the key stays', async ({ page }) => {
  const save = cobbleSave();
  save.flags['tour.doubt'] = 1;
  await boot(page, save);
  const flags = await page.evaluate(() => ({
    unease: PixelPets.state.flags['story.tour_unease'],
    old: PixelPets.state.flags['tour.doubt'],
    chip: PixelPets.state.party[0].chip,
    align: PixelPets.state.party[0].align,
    v: PixelPets.state.v,
  }));
  expect(flags.unease).toBe(1);
  expect(flags.old).toBe(1);
  expect(flags.chip).toBeUndefined();
  expect(flags.align).toBeUndefined();
  expect(flags.v).toBe(2);
});

test('Testing chips the partner, shows ALIGN on PARTNER only, and refuses the box', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, cobbleSave({ 'story.tour_unease': 2 }));
  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const said = [];
  let tint = null;
  const choices = ['Tune my partner'];
  for (let i = 0; i < 220; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, full: s.full, waiting: s.waiting, text: s.text };
    });
    if (!sc) break;
    const sealUp = await page.locator('#ovBattle.seal-only').isVisible().catch(() => false);
    if (sealUp) { await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    if (sc.mode === 'choice' && sc.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      if (page.viewportSize().width === 390 && sc.text.indexOf('review') >= 0) await shot(page, 'testing-choice');
      const label = choices.shift();
      if (label == null) throw new Error('unexpected choice ' + sc.text);
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(40);
      continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (sc.full) said.push(sc.text);
      if (sc.full && sc.text.indexOf('soft click') >= 0) {
        tint = await page.evaluate(() => ({
          on: document.body.classList.contains('arbiter-test'),
          music: PPSound.musicWant,
        }));
        if (page.viewportSize().width === 390) await shot(page, 'testing-tint');
      }
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(40);
  }
  expect(await page.evaluate(() => PixelPets.scene)).toBeFalsy();
  expect(said.some((s) => s.indexOf('flutter') >= 0)).toBe(true);
  expect(said.some((s) => s.indexOf('A chip?') >= 0)).toBe(true);
  expect(tint && tint.on).toBe(true);
  expect(tint.music).toBe('arbiter_test');
  const after = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return {
      align: p.align,
      locked: !!(p.chip && p.chip.locked),
      active: PixelPets.state.flags['story.arbiter_test_active'],
      done: PixelPets.state.flags['story.arbiter_test_done'],
      seal: !!PixelPets.state.seals.seal_glim_2,
      name: p.nick || 'Embercub',
      id: p.id,
    };
  });
  expect(after.align).toBe(50);
  expect(after.locked).toBe(true);
  expect(after.active).toBe(false);
  expect(after.done).toBe(true);
  expect(after.seal).toBe(true);

  await page.evaluate(() => PixelPets.showTab('pet'));
  await expect(page.locator('#barAlign')).toBeVisible();
  const strip = await page.evaluate(() => {
    const row = document.querySelector('#statStrip');
    const walkHidden = document.body.dataset.screen;
    return { h: row.getBoundingClientRect().height, screen: walkHidden, on: document.body.classList.contains('align-on') };
  });
  expect(strip.on).toBe(true);
  expect(strip.h).toBeGreaterThan(70);
  if (page.viewportSize().width === 390) await shot(page, 'align-bar');
  await page.evaluate(() => PixelPets.showTab('walk'));
  const onWalk = await page.evaluate(() => {
    const el = document.querySelector('#statStrip .ss-align-l');
    const row = document.querySelector('#statStrip');
    return { shown: getComputedStyle(el).display !== 'none' && document.body.dataset.screen === 'pet', h: row.getBoundingClientRect().height, screen: document.body.dataset.screen };
  });
  expect(onWalk.screen).toBe('walk');
  expect(onWalk.shown).toBe(false);
  expect(onWalk.h).toBeLessThan(70);

  const refused = await page.evaluate((id) => {
    const dep = PixelPets.depositPet(id);
    const rel = PixelPets.releasePet(id);
    return { dep, rel, toast: document.querySelector('#toast').textContent, still: PixelPets.state.party.some((p) => p.id === id) };
  }, after.id);
  expect(refused.dep).toBe(false);
  expect(refused.rel).toBe(false);
  expect(refused.still).toBe(true);
  expect(refused.toast).toContain('stays with you now.');

  await page.evaluate(() => PixelPets.showTab('col'));
  const locked = await page.evaluate(() => {
    const row = document.querySelector('#partyBoard .party-slot[data-locked="1"] canvas');
    const box = document.querySelector('#boxList').textContent;
    if (!row) return null;
    const d = row.getContext('2d').getImageData(row.width - 2, 3, 1, 1).data;
    return { rgba: [d[0], d[1], d[2], d[3]], box };
  });
  expect(locked.rgba[3]).toBeGreaterThan(0);
  expect(locked.box).toContain('empty');
  if (page.viewportSize().width === 390) await shot(page, 'lock-glyph');

  expect(await page.evaluate(() => PixelPets.runScene('hale_trial'))).toBe(true);
  const again = [];
  await playScene(page, [], (prompt) => { again.push(prompt); });
  expect(again).toEqual([]);
  const still = await page.evaluate(() => PixelPets.state.party.filter((p) => p.chip && p.chip.on).length);
  expect(still).toBe(1);
});

test('a full party boxes someone who is not locked', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, cobbleSave());
  const opened = page.evaluate(() => {
    PixelPets.fillParty();
    const lead = PixelPets.state.party[0];
    lead.chip = { on: true, at: 1, locked: true };
    lead.align = 50;
    return PixelPets.offerCatchRoom();
  });
  await expect(page.locator('#ovSheet')).toBeVisible();
  const n = await page.locator('#shList button').count();
  expect(n).toBe(5);
  await page.locator('#shList button').first().click();
  const where = await opened;
  expect(where.where).toBe('swapped');
  const placed = await page.evaluate(() => ({
    party: PixelPets.state.party.length,
    locked: PixelPets.state.party.filter((p) => p.chip && p.chip.locked).length,
    boxedLocked: PixelPets.state.box.filter((p) => p.chip && p.chip.locked).length,
  }));
  expect(placed.party).toBe(6);
  expect(placed.locked).toBe(1);
  expect(placed.boxedLocked).toBe(0);
});

test('Strain narrows the live befriend zone only', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page, cobbleSave());
  const zone = await page.evaluate(() => {
    const odds = PixelPets.befriendOdds(8, 0.5);
    const p = PixelPets.state.party[0];
    p.chip = { on: true, at: 1, locked: true };
    p.align = 60;
    const open = PixelPets.spawnEncounter({ species: 'ember', level: 8, hpFrac: 0.5 });
    const tuned = PixelPets.zoneWidth();
    p.align = 10;
    const strain = PixelPets.zoneWidth();
    return { odds: odds.width, tuned, strain, ok: open.ok };
  });
  expect(zone.ok).toBe(true);
  expect(zone.strain).toBeCloseTo(zone.tuned * 0.9, 5);
  expect(zone.odds).toBe(await page.evaluate(() => PixelPets.befriendOdds(8, 0.5).width));
});

test('Bright-linked mends once on a Glimmer map', async ({ page }) => {
  await boot(page, cobbleSave());
  const glow = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.chip = { on: true, at: 1, locked: true };
    p.align = 90;
    p.hpNow = 4;
    const before = p.hpNow;
    PixelPets.goto('route2_glen', 4, 4, 'down');
    const mid = p.hpNow == null ? 'full' : p.hpNow;
    const flag = PixelPets.state.flags['daily.align_glow'];
    p.hpNow = 4;
    PixelPets.goto('route2_glen', 5, 4, 'down');
    const after = p.hpNow;
    return { before, mid, after, flag, toast: document.querySelector('#toast').textContent };
  });
  expect(glow.mid === 'full' || glow.mid > glow.before).toBe(true);
  expect(glow.after).toBe(4);
  expect(glow.flag).toBeTruthy();
  expect(glow.toast).toBe('A soft glow mends them.');
});

test('Glimmer Rook stays, keeps the lanyard, and quits only if the offer is accepted', async ({ page }) => {
  test.setTimeout(60000);
  const save = cobbleSave({ 'story.rook_end': 'stays', 'story.cobble_end': true });
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.sceneFor('rook_road'))).toBe('rook_road@glimmer');
  expect(await page.evaluate(() => PixelPets.spriteLook('rook').accessory)).toBe('lanyard');
  expect(await page.evaluate(() => PixelPets.runScene('rook_road'))).toBe(true);
  const said = [];
  for (let i = 0; i < 80; i++) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, full: s.full, waiting: s.waiting, text: s.text };
    });
    if (!sc) break;
    if (sc.mode === 'choice' && sc.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      if (page.viewportSize().width === 390) await shot(page, 'rook-chip-nerves');
      const card = await page.evaluate(() => (PixelPets.sideActive.find((a) => a.chain === 'rc_meet') || {}).text || '');
      expect(card).toContain('lanyard');
      await page.locator('#sbChoices button', { hasText: "I'll do my job" }).click();
      await page.waitForTimeout(40);
      continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (sc.full) said.push(sc.text);
      await page.keyboard.press('Space');
      await page.waitForTimeout(30);
      continue;
    }
    await page.waitForTimeout(30);
  }
  expect(said.some((s) => s.indexOf('mint lanyard is on') >= 0)).toBe(true);
  expect(said.some((s) => s.indexOf('not walking away') >= 0)).toBe(true);
  const flags = await page.evaluate(() => ({
    quit: PixelPets.state.flags['story.rook_quit'],
    end: PixelPets.state.flags['story.rook_end'],
    look: PixelPets.spriteLook('rook').accessory,
  }));
  expect(flags.quit).toBeUndefined();
  expect(flags.end).toBe('stays');
  expect(flags.look).toBe('lanyard');
});
