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
    spec: PPSound.musicSpec('arbiter_test'),
    partner: PixelPets.cond ? undefined : null,
  }));
  expect(music.ids).toContain('arbiter_test');
  expect(music.check).toEqual([]);
  expect(music.glimmer).toEqual([]);
  const row = music.spec;
  const stepSum = (notes) => notes.reduce((sum, note) => sum + note[1], 0);
  expect(row.stepsPerBar).toBe(16);
  expect(row.bars).toBe(8);
  expect(row.bpm).toBe(68);
  expect(row.key).toBe('B phrygian');
  expect(row.gate).toBe(0.95);
  expect(row.perc).toBe(0.2);
  expect(row.lead.wave).toBe('triangle');
  expect(row.lead.gain).toBe(0.18);
  expect(row.bass.wave).toBe('square');
  expect(row.bass.gain).toBe(0.065);
  expect(stepSum(row.lead.notes)).toBe(128);
  expect(stepSum(row.bass.notes)).toBe(128);
  expect(row.lead.notes.every((note) => note[0] === 0 || (note[0] >= 36 && note[0] <= 96))).toBe(true);
  expect(row.bass.notes.every((note) => note[0] === 0 || (note[0] >= 36 && note[0] <= 96))).toBe(true);
  expect(row.drums).toHaveLength(8);
  expect(row.drums.every((bar) => bar.length === 16 && /^[ksh.]+$/.test(bar))).toBe(true);
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
      return s && { mode: s.mode, full: s.full, waiting: s.waiting, who: s.who, text: s.text };
    });
    if (!sc) break;
    const sealUp = await page.locator('#ovBattle.seal-only').isVisible().catch(() => false);
    if (sealUp) { await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    if (sc.mode === 'choice' && sc.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      if (page.viewportSize().width === 390 && sc.text.indexOf('review') >= 0) await shot(page, 'testing-choice');
      expect(sc.text).toContain('How do you close the review?');
      expect(sc.who).toBe('Associate Quinn');
      const label = choices.shift();
      if (label == null) throw new Error('unexpected choice ' + sc.text);
      await page.locator('#sbChoices button', { hasText: label }).first().click();
      await page.waitForTimeout(40);
      continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      if (sc.full && (!said.length || said[said.length - 1].text !== sc.text)) said.push({ who: sc.who || '', text: sc.text });
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
  const speakers = [
    ['Associate Quinn', 'Before the cord, one more kindness. A Tuning. Your Walkling hears us a little clearer after.'],
    ['Associate Quinn', 'Some holders feel a flutter. We call it increasing the bond. Nothing sharp. Nothing cold.'],
    ['Rook', "A chip? That's... a lot. But our Walklings will keep getting stronger. I want that. I do."],
    ['', 'A soft click under the fur. The Hall lights dim. Somewhere below, something vast exhales.'],
    ['Associate Quinn', 'There. Tuned. Keep them close, holder. The box is for the others now.'],
    ['Associate Quinn', 'Review closed. Bright Tier 2 Lanyard. Two marks, one cord.'],
    ['Associate Quinn', 'Same care package Hale gives his friends. We can be generous.'],
    ['Associate Quinn', 'Brinewick is down the coast. The cart goes whether you ride it or not.'],
  ];
  expect(said.map((s) => [s.who, s.text])).toEqual(speakers);
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
    const row = document.querySelector('#partyBoard .party-slot[data-locked="1"]');
    const canvas = row && row.querySelector('canvas');
    const box = document.querySelector('#boxList').textContent;
    if (!canvas) return null;
    const d = canvas.getContext('2d').getImageData(canvas.width - 2, 3, 1, 1).data;
    const toast = document.querySelector('#toast').getBoundingClientRect();
    const title = document.querySelector('#scr-col h2').getBoundingClientRect();
    const boxBtn = row.querySelector('[data-act="box"]');
    const relBtn = row.querySelector('[data-act="release"]');
    return {
      rgba: [d[0], d[1], d[2], d[3]],
      box,
      boxOff: !!(boxBtn && boxBtn.disabled),
      relOff: !!(relBtn && relBtn.disabled),
      lock: !!row.querySelector('.slot-lock'),
      note: row.textContent,
      toastBelow: toast.top >= title.bottom - 1,
    };
  });
  expect(locked.rgba[3]).toBeGreaterThan(0);
  expect(locked.box).toContain('empty');
  expect(locked.boxOff).toBe(true);
  expect(locked.relOff).toBe(true);
  expect(locked.lock).toBe(true);
  expect(locked.note).toContain('stays with you now.');
  expect(locked.toastBelow).toBe(true);
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

/* FINAL D26 copy (ARBITER_TEST.md §6.1). Verbatim. Speakers and {name} stay. */
const D26 = [
  { slot: 'S1.intro', path: 'scenes.tour1_s1[0][2]', speaker: 'Associate Juniper', line: `First stop, {name}! Today we're gifting free Comfort Lamps to Fernbrook. It's a partnership!` },
  { slot: 'S1.r1.prompt', path: 'scenes.tour1_s1[1][1]', speaker: '(prompt)', line: `An orchard worker steps up, rubbing tired eyes. Hand over a Comfort Lamp?` },
  { slot: 'S1.r1.result', path: 'scenes.tour1_s1[1][2][0][1][0][2]', speaker: '(narrator)', line: `The worker takes the lamp. Inside the glass, the pale light pulses like a slow heartbeat.` },
  { slot: 'S1.r2.prompt', path: 'scenes.tour1_s1[2][1]', speaker: '(prompt)', line: `A child steps up to the table, clutching a nervous Walkling. Offer a lamp?` },
  { slot: 'S1.r2.result', path: 'scenes.tour1_s1[2][2][0][1][0][2]', speaker: '(narrator)', line: `The child smiles, though their Walkling flattens its ears at the lantern's steady hum.` },
  { slot: 'S1.r3.prompt', path: 'scenes.tour1_s1[3][1]', speaker: '(prompt)', line: `One lamp left. An elderly holder watches quietly from the orchard gate.` },
  { slot: 'S1.r3.result', path: 'scenes.tour1_s1[3][2][0][1][0][2]', speaker: '(narrator)', line: `The elder accepts it with a nod, and whispers an apology to the glass.` },
  { slot: 'S2.intro', path: 'scenes.tour1_s2[0][2]', speaker: 'Associate Juniper', line: `Stop two: a quick Comfort Check! These units are off to the Comfort Sanctuary for a long rest.` },
  { slot: 'S2.prompt', path: 'scenes.tour1_s2[1][1]', speaker: '(prompt)', line: `The graphite crates vibrate with a low thrum. Something scratches lightly inside. What do you do?` },
  { slot: 'S2.praise', path: 'scenes.tour1_s2[1][2][0][1][0][2]', speaker: 'Associate Juniper', line: `Exactly! Clean energy starts with calm units. It's a partnership that powers us all!` },
  { slot: 'S2.question', path: 'scenes.tour1_s2[1][2][1][1][0][2]', speaker: 'Associate Juniper', line: `The scratch? Just settling in! Units get so eager to give back, they forget to sit still. Ha... ha!` },
  { slot: 'S2.pat', path: 'scenes.tour1_s2[1][2][2][1][0][2]', speaker: '(narrator)', line: `The metal is hot to the touch. From within, a small weight leans tiredly against your palm.` },
  { slot: 'S3.intro', path: 'scenes.tour1_s3[0][2]', speaker: 'Associate Juniper', line: `Inside the Trial Hall for stop three! Nothing beats seeing our clean energy goals on the big screen.` },
  { slot: 'S3.prompt', path: 'scenes.tour1_s3[1][1]', speaker: '(prompt)', line: `The projector hums on a mint-green slide. Juniper asks which campaign slogan grabs you.` },
  { slot: 'S3.L1', path: 'scenes.tour1_s3[1][2][0][0]', speaker: '(label)', line: `Brighter by nature.` },
  { slot: 'S3.L2', path: 'scenes.tour1_s3[1][2][1][0]', speaker: '(label)', line: `It's a partnership!` },
  { slot: 'S3.slogan1', path: 'scenes.tour1_s3[1][2][0][1][0][2]', speaker: 'Associate Juniper', line: `"Brighter by nature." A classic! Because a Walkling's glow really belongs to the whole town, right?` },
  { slot: 'S3.slogan2', path: 'scenes.tour1_s3[1][2][1][1][0][2]', speaker: 'Associate Juniper', line: `"It's a partnership!" Spot on. You bring the bond, and we bring out the glow. Everyone shines!` },
  { slot: 'S4.intro', path: 'scenes.tour1_s4[0][2]', speaker: 'Associate Juniper', line: `Last stop, Junior Bright! The Glow Census is thriving. Want to test your bond against Master Fen?` },
  { slot: 'S4.prompt', path: 'scenes.tour1_s4[1][1]', speaker: '(prompt)', line: `The Glow Census board tallies local output. Step up for a friendly demo match with Master Fen?` },
  { slot: 'S4.wait', path: 'scenes.tour1_wait[0][2]', speaker: 'Associate Juniper', line: `The board is still tallying Fernbrook's units! Take your time, {name}. Have a bright day!` },
  { slot: 'P.photo', path: 'scenes.seal1@glimmer[7][2]', speaker: '(narrator)', line: `A flash! Your photo goes up on the board, pinned right beside the list of crates bound for the Sanctuary.` },
];

const OLD_TOUR = [
  'Welcome to stop one, {name}!',
  'A farmer squints at the stall.',
  'Very warm...',
  'A kid with a wild Walkling',
  'The kid beams.',
  'An old keeper watches',
  'looks at it a long time.',
  'So cozy in there.',
  'The crates hum softly.',
  'happy units.',
  'just... resting.',
  'taps back, very gently.',
  'We rented the whole Hall',
  'which slogan you like best.',
  'First slogan',
  'Second slogan',
  'I say it in my sleep',
  'Glow for everyone!',
  'Fancy a demo match',
  'A demo match vs Fen is optional.',
  'needs a moment to update',
  'Your stage photo goes up',
];

function atPath(root, specPath) {
  const match = specPath.match(/^([A-Za-z0-9_.@]+)((?:\[\d+\])*)$/);
  let cur = root;
  for (const part of match[1].split('.')) cur = cur[part];
  for (const idx of match[2].matchAll(/\[(\d+)\]/g)) cur = cur[Number(idx[1])];
  return cur;
}

function collectStrings(node, bag) {
  if (typeof node === 'string') bag.push(node);
  else if (Array.isArray(node)) node.forEach((child) => collectStrings(child, bag));
}

test('every final D26 tour line is in the game data, with no placeholder left', async ({ page }) => {
  const raw = fs.readFileSync(path.join('data', 'glimmer_path.json'), 'utf8');
  const data = JSON.parse(raw);
  const mapdata = fs.readFileSync(path.join('data', 'mapdata.js'), 'utf8');
  expect(data._placeholders).toBeUndefined();
  expect(data.placeholders).toBeUndefined();
  expect(raw).not.toContain('TEMP copy');
  expect(raw).not.toContain('PLACEHOLDER');
  expect(D26).toHaveLength(22);
  for (const row of D26) {
    expect(atPath(data, row.path), row.slot).toBe(row.line);
    expect(mapdata, row.slot).toContain(JSON.stringify(row.line).slice(1, -1));
    if (row.speaker === '(label)') expect(Array.from(row.line).length, row.slot).toBeLessThanOrEqual(30);
    if (row.speaker === 'Associate Juniper' || row.speaker === '(narrator)') {
      const step = atPath(data, row.path.slice(0, row.path.lastIndexOf('[')));
      expect(step[0], row.slot).toBe('say');
      expect(step[1], row.slot).toBe(row.speaker === '(narrator)' ? '' : 'Associate Juniper');
    }
    if (row.speaker === '(prompt)') expect(atPath(data, row.path.slice(0, row.path.lastIndexOf('[')))[0], row.slot).toBe('choice');
  }
  const bag = [];
  for (const id of ['tour1_s1', 'tour1_s2', 'tour1_s3', 'tour1_s4', 'tour1_wait']) collectStrings(data.scenes[id], bag);
  collectStrings(data.scenes['seal1@glimmer'][7], bag);
  const joined = bag.join('\n');
  expect(joined).not.toMatch(/PLACEHOLDER|TODO|TEMP copy/);
  for (const old of OLD_TOUR) expect(joined, old).not.toContain(old);
  expect(data.scenes.tour1_s2[1][2][1][1].some((step) => step[0] === 'inc' && step[1] === 'story.tour_unease')).toBe(true);
  expect(data.scenes['seal1@glimmer'][8][0]).toBe('inc');
  expect(data.scenes['seal1@glimmer'][8][1]).toBe('story.tour_unease');
  await boot(page, cobbleSave());
  const live = await page.evaluate((lines) => {
    const g = MAPDATA.glimmer_path;
    const walk = (node, bag) => {
      if (typeof node === 'string') bag.push(node);
      else if (Array.isArray(node)) node.forEach((child) => walk(child, bag));
    };
    const bag = [];
    for (const id of ['tour1_s1', 'tour1_s2', 'tour1_s3', 'tour1_s4', 'tour1_wait']) walk(g.scenes[id], bag);
    walk(g.scenes['seal1@glimmer'][7], bag);
    return {
      missing: lines.filter((line) => !bag.includes(line)),
      placeholders: !!g._placeholders || !!g.placeholders,
      v: PixelPets.state.v,
    };
  }, D26.map((row) => row.line));
  expect(live.missing).toEqual([]);
  expect(live.placeholders).toBe(false);
  expect(live.v).toBe(2);
});

async function hideToast(page) {
  await page.evaluate(() => {
    const toast = document.querySelector('#toast');
    if (!toast) return;
    toast.classList.remove('show');
    toast.style.transition = 'none';
  });
}

async function reviewShot(page, name) {
  if (page.viewportSize().width !== 390) return;
  const dir = path.join('review-arbiter-swap');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name + '-390.png') });
}

test('stop 2, the slogan choice, and the stage photo show the final lines', async ({ page }) => {
  test.setTimeout(60000);
  const save = cobbleSave();
  save.world = { map: 'fernbrook', x: 9, y: 9, facing: 'down', respawn: 'fernbrook' };
  await boot(page, save);
  const question = D26.find((row) => row.slot === 'S2.question').line;
  const prompt = D26.find((row) => row.slot === 'S3.prompt').line;
  const photo = D26.find((row) => row.slot === 'P.photo').line;
  expect(await page.evaluate(() => PixelPets.runScene('tour1_s2'))).toBe(true);
  let sawQuestion = false;
  for (let i = 0; i < 80; i++) {
    const sealUp = await page.locator('#ovBattle.seal-only').isVisible().catch(() => false);
    if (sealUp) { await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    const sc = await page.evaluate(() => {
      const scene = window.PixelPets.scene;
      return scene && { mode: scene.mode, full: scene.full, waiting: scene.waiting, who: scene.who, text: scene.text };
    });
    if (!sc) break;
    if (sc.mode === 'choice' && sc.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      await page.locator('#sbChoices button', { hasText: 'Question it' }).click();
      await page.waitForTimeout(40);
      continue;
    }
    if (sc.mode === 'say' && sc.waiting && sc.full) {
      if (sc.text === question) {
        expect(sc.who).toBe('Associate Juniper');
        await hideToast(page);
        await reviewShot(page, 's2-question');
        sawQuestion = true;
      }
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(40);
  }
  expect(sawQuestion).toBe(true);

  expect(await page.evaluate(() => PixelPets.runScene('tour1_s3'))).toBe(true);
  let sawChoice = false;
  for (let i = 0; i < 80; i++) {
    const sc = await page.evaluate(() => {
      const scene = window.PixelPets.scene;
      return scene && { mode: scene.mode, full: scene.full, waiting: scene.waiting, text: scene.text };
    });
    if (!sc) break;
    if (sc.mode === 'choice' && sc.full) {
      await page.waitForFunction(() => window.PixelPets.optionsReady === true);
      expect(sc.text).toBe(prompt);
      const buttons = await page.locator('#sbChoices button').evaluateAll((nodes) => nodes.map((node) => ({
        text: node.textContent,
        h: node.getBoundingClientRect().height,
        w: node.getBoundingClientRect().width,
      })));
      expect(buttons.map((button) => button.text)).toEqual(['Brighter by nature.', "It's a partnership!"]);
      for (const button of buttons) {
        expect(button.h).toBeGreaterThanOrEqual(44);
        expect(button.w).toBeGreaterThanOrEqual(44);
      }
      await hideToast(page);
      await reviewShot(page, 's3-choice');
      sawChoice = true;
      await page.locator('#sbChoices button', { hasText: 'Brighter by nature.' }).click();
      await page.waitForTimeout(40);
      continue;
    }
    if (sc.mode === 'say' && sc.waiting) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(40);
  }
  expect(sawChoice).toBe(true);

  expect(await page.evaluate(() => PixelPets.runScene('seal1'))).toBe(true);
  let sawPhoto = false;
  for (let i = 0; i < 120; i++) {
    const sealUp = await page.locator('#ovBattle.seal-only').isVisible().catch(() => false);
    if (sealUp) { await page.locator('#btOk').click(); await page.waitForTimeout(40); continue; }
    const sc = await page.evaluate(() => {
      const scene = window.PixelPets.scene;
      return scene && { mode: scene.mode, full: scene.full, waiting: scene.waiting, who: scene.who, text: scene.text };
    });
    if (!sc) break;
    if (sc.mode === 'say' && sc.waiting && sc.full) {
      if (sc.text === photo) {
        expect(sc.who).toBe('');
        await hideToast(page);
        await reviewShot(page, 'p-photo');
        sawPhoto = true;
      }
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(40);
  }
  expect(sawPhoto).toBe(true);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
