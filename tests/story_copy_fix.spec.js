/* STORY_COPY_FIX (design tip 1c70e8a). Signed lines, the Dojo label, the Lantern sign,
   the rest button, Rook, and one Master Marisol. Save stays pixelpets.save.v2 with v 2. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const HOUSE = 'LANTERN HOUSE · Rest and recover. 5 Acorns, or what you have.';
const MARKERS = ['hm_lantern_sign', 'cc_lantern_sign', 'fb_lantern_sign', 'hc_lantern_sign', 'bw_lantern_sign'];

function dayStamp() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function save(flags, extra) {
  const s = starterSave();
  s.settings.tips = false;
  s.settings.follower = false;
  s.settings.music = false;
  s.settings.textSpeed = 'fast';
  s.flags['daily.hello'] = dayStamp();
  s.flags['daily.warm_bowl'] = dayStamp();
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

async function showLines(page, want, choices) {
  const left = (choices || []).slice();
  const seen = [];
  const deadline = Date.now() + 25000;
  while (seen.length < want.length && Date.now() < deadline) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, full: s.full, text: s.text || '' };
    });
    if (!sc) throw new Error('scene ended before ' + want[seen.length]);
    if (sc.mode === 'choice') {
      await page.waitForFunction(() => {
        const s = window.PixelPets.scene;
        return !!(s && s.mode === 'choice' && s.full && window.PixelPets.optionsReady === true);
      });
      const label = left.shift();
      if (!label) throw new Error('choice "' + sc.text + '" had no answer');
      await page.locator('#sbChoices button', { hasText: label }).click();
      continue;
    }
    if (sc.mode === 'say' && !sc.full) {
      await page.waitForFunction(() => {
        const s = window.PixelPets.scene;
        return !s || s.full || s.mode !== 'say';
      }, null, { timeout: 5000 });
      continue;
    }
    if (sc.mode === 'say') {
      if (sc.text.indexOf(want[seen.length]) >= 0) {
        await expect(page.locator('#sbText')).toBeVisible();
        await expect(page.locator('#sbText')).toContainText(want[seen.length]);
        seen.push(want[seen.length]);
      }
      await page.keyboard.press('Space');
      await page.waitForTimeout(30);
      continue;
    }
    await page.waitForTimeout(30);
  }
  expect(seen).toEqual(want);
  await page.evaluate(() => PixelPets.endScene());
}

async function tapLine(page, id, text) {
  expect(await page.evaluate((nid) => PixelPets.talkTo(nid), id)).toBe(true);
  await page.waitForFunction((bit) => {
    const s = window.PixelPets.scene;
    return !!(s && s.full && (s.text || '') === bit);
  }, text);
  await expect(page.locator('#sbText')).toBeVisible();
  await expect(page.locator('#sbText')).toHaveText(text);
  const box = await page.locator('#sbText').boundingBox();
  expect(box && box.width).toBeGreaterThan(8);
  expect(box && box.height).toBeGreaterThan(8);
  await page.evaluate(() => PixelPets.endScene());
}

test('signed scene lines and tap lines read the new copy', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, {
    'story.dream_woke': true,
    'story.mom_met': true,
    'story.mom_chore': true,
    'story.mom_sent': true,
    'story.reached_mahopac': true,
    'story.dream_started': true,
    'story.dream_toy': true,
    'story.dream_party': true,
    'story.dream_dad': true,
    'story.phone_got': true,
  });
  expect(await page.evaluate(() => PixelPets.runScene('mom_wake'))).toBe(true);
  await showLines(page, ['Go see Warden Ilse at the Lodge.'], ['A toy, then Dad']);

  expect(await page.evaluate(() => PixelPets.runScene('ilse_dreams'))).toBe(true);
  await showLines(page, ["Dreams are part of a Warden's work, too."]);

  expect(await page.evaluate(() => PixelPets.runScene('hc_council'))).toBe(true);
  await showLines(page, ['We are opening it.', 'A small light beside it flickers on.', 'THE ROAD AHEAD · Route 3 to Brinewick']);

  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await showLines(page, ['Choose with care. This road is a long one.']);

  expect(await page.evaluate(() => PixelPets.runScene('brinewick_hook'))).toBe(true);
  await showLines(page, ['The Brinewick road stays shut while crates are loaded.']);

  await page.evaluate(() => PixelPets.setSide('glimmer'));
  expect(await page.evaluate(() => PixelPets.runScene('brinewick_hook'))).toBe(true);
  await showLines(page, ['The Brinewick road stays shut while crates are loaded.']);

  await page.evaluate(() => PixelPets.setSide('keepers'));
  expect(await page.evaluate(() => PixelPets.runScene('gb_briefing'))).toBe(true);
  await showLines(page, ['THE ROAD AHEAD · Route 3 to Brinewick'], ['Not today', 'close']);

  await tapLine(page, 'hc_sign_gym', 'DOJO · Practice before a real Hall. Stones, tides, and blooms are all welcome.');
  await tapLine(page, 'mom', 'Tell Warden Ilse what you dreamed. She gave you your Walkling.');
  await page.evaluate(() => PixelPets.setFlag('story.hc_council_done', true));
  await tapLine(page, 'hc_lumen', 'The coast road is lit. Ships still fly.');
  await tapLine(page, 'hc_sol', 'No Seal here. Hall Masters keep those.');

  await page.locator('#questBtn').click();
  await expect(page.locator('#ovQuest')).toBeVisible();
  await expect(page.locator('#questSide')).toBeVisible();
  await expect(page.locator('#questSide')).toHaveText('Tell Warden Ilse about the dream.');
  await expect(page.locator('#questSidePlace')).toHaveText("Warden's Lodge");
  const keys = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  expect(keys).not.toContain('v3');
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});

test('the Dojo map label and the room title', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.goto('hc_gym_in', 4, 5, 'down'));
  await expect(page.locator('#thPlace')).toBeVisible();
  await expect(page.locator('#thPlace')).toHaveText('Dojo');
  expect(await page.evaluate(() => PixelPets.previewMap('room', 'hc_gym_in'))).toBe(true);
  await expect(page.locator('#ovMap')).toBeVisible();
  await expect(page.locator('#mapTitle')).toBeVisible();
  await expect(page.locator('#mapTitle')).toHaveText('DOJO');
  const town = await page.evaluate(() => {
    PixelPets.previewMap('town', 'highcharity');
    const layer = PixelPets.mapLayer();
    const hit = (layer.buildings || []).find((b) => b.to === 'hc_gym_in');
    return hit ? hit.label : '';
  });
  expect(town).toBe('DOJO');
});

test('the Lantern sign and all five marker taps', async ({ page }) => {
  await boot(page);
  await tapLine(page, 'hm_sign_lantern', HOUSE);
  for (const id of MARKERS) {
    expect(await page.evaluate((nid) => PixelPets.npcLine(nid), id)).toBe(HOUSE);
    await tapLine(page, id, HOUSE);
  }
});

async function reachChoice(page) {
  for (let i = 0; i < 12; i++) {
    const mode = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && s.mode;
    });
    if (mode === 'choice') {
      await page.waitForFunction(() => window.PixelPets.scene && window.PixelPets.scene.full && window.PixelPets.optionsReady === true);
      return;
    }
    if (mode === 'say') {
      await page.waitForFunction(() => window.PixelPets.scene && window.PixelPets.scene.full);
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(40);
  }
  throw new Error('the rest choice did not open');
}

async function takeRest(page, label, bit, left) {
  await reachChoice(page);
  const btn = page.locator('#sbChoices button', { hasText: new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') });
  await expect(btn).toBeVisible();
  const box = await btn.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
  await btn.click();
  await page.waitForFunction((needle) => {
    const s = window.PixelPets.scene;
    return !!(s && s.mode === 'say' && s.full && (s.text || '').indexOf(needle) >= 0);
  }, bit);
  await expect(page.locator('#sbText')).toBeVisible();
  await expect(page.locator('#sbText')).toContainText(bit);
  expect(await page.evaluate(() => PixelPets.state.money)).toBe(left);
  await page.evaluate(() => PixelPets.endScene());
}

async function hurt(page, money) {
  await page.evaluate((n) => {
    PixelPets.state.money = n;
    PixelPets.state.party[0].hpNow = 4;
  }, money);
}

test('the rest choice names the Acorns it takes, on the bed and at the door', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, { 'story.early_done': true }, { money: 0 });
  await hurt(page, 0);
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  await takeRest(page, 'Rest (free)', 'The Keeper covers the fee', 0);
  expect(await page.evaluate(() => PixelPets.lanternRest.hurt)).toBe(false);

  await hurt(page, 1);
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  await takeRest(page, 'Rest (1 Acorn)', 'You leave 1 Acorn', 0);

  await hurt(page, 3);
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  await takeRest(page, 'Rest (3 Acorns)', 'You leave 3 Acorns', 0);

  await hurt(page, 5);
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  await takeRest(page, 'Rest (5 Acorns)', 'You leave 5 Acorns', 0);

  await hurt(page, 55);
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  await takeRest(page, 'Rest (5 Acorns)', 'You leave 5 Acorns', 50);

  await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    delete p.hpNow;
    p.energy = 100;
    PixelPets.state.money = 55;
  });
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  await takeRest(page, 'Rest a while', 'already rested', 55);

  async function doorRest(money, label, bit, left, full) {
    await page.evaluate(({ money: n, full: done }) => {
      PixelPets.state.money = n;
      const p = PixelPets.state.party[0];
      if (done) { delete p.hpNow; p.energy = 100; }
      else p.hpNow = 4;
      const d = window.WORLD.hearthmoor.objs.find((o) => o.id === 'hm_lantern');
      d.panel = 'lantern';
      d.keeper = '';
      delete d.to;
      PixelPets.talkTo('hm_lantern');
    }, { money, full });
    await takeRest(page, label, bit, left);
  }
  await doorRest(0, 'Rest (free)', 'The Keeper covers the fee', 0, false);
  await doorRest(1, 'Rest (1 Acorn)', 'You leave 1 Acorn', 0, false);
  await doorRest(3, 'Rest (3 Acorns)', 'You leave 3 Acorns', 0, false);
  await doorRest(5, 'Rest (5 Acorns)', 'You leave 5 Acorns', 0, false);
  await doorRest(55, 'Rest (5 Acorns)', 'You leave 5 Acorns', 50, false);
  await doorRest(55, 'Rest a while', 'already rested', 55, true);
});

test('the switch tip is not offered', async ({ page }) => {
  const s = save({ 'story.rc_climax': true, 'story.act': 5 });
  s.settings.tips = true;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForTimeout(1200);
  await expect(page.locator('#unlockCard')).toBeHidden();
  await expect(page.getByText('Switching sides')).toBeHidden();
});

async function bark(page, flags, line) {
  await page.evaluate((f) => {
    Object.assign(PixelPets.state.flags, f);
    PixelPets.goto('hearthmoor', 8, 8, 'down');
    PixelPets.goto('brinewick', 13, 9, 'left');
  }, flags);
  await page.evaluate(() => PixelPets.walkStep('left'));
  if (!line) {
    await page.waitForTimeout(300);
    await expect(page.locator('#chatBubble')).toBeHidden();
    return;
  }
  await expect(page.locator('#chatBubble')).toBeVisible();
  await expect(page.locator('#chatBubble')).toHaveText(line);
  await expect(page.locator('#chatBubble')).toBeHidden({ timeout: 4000 });
  await page.evaluate(() => PixelPets.walkStep('right'));
  await page.evaluate(() => PixelPets.walkStep('left'));
  await page.waitForTimeout(200);
  await expect(page.locator('#chatBubble')).toBeHidden();
}

test('the Chandlery names itself and does not borrow Ilse\'s line', async ({ page }) => {
  await boot(page, { 'story.reached_brinewick': true });
  await page.evaluate(() => PixelPets.goto('bw_store_in', 5, 5, 'up'));
  expect(await page.evaluate(() => PixelPets.talkTo('bw_chandler'))).toBe(true);
  await expect(page.locator('#ovShop')).toBeVisible();
  await expect(page.locator('#shopTitle')).toBeVisible();
  await expect(page.locator('#shopTitle')).toHaveText('CHANDLERY');
  await expect(page.locator('#shopFlavour')).toBeVisible();
  await expect(page.locator('#shopFlavour')).toHaveText('Snacks for the road.');
  const flavour = await page.locator('#shopFlavour').innerText();
  expect(flavour).not.toMatch(/Leave Acorns, take a snack|— I\.|Welcome to|Lantern stays lit|Rope, tins/);
  const close = page.locator('#shopClose');
  await expect(close).toBeVisible();
  const box = await close.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
});

test('the Brinewick town key names the Chandlery', async ({ page }) => {
  await boot(page, { 'story.reached_brinewick': true });
  expect(await page.evaluate(() => PixelPets.previewMap('town', 'brinewick'))).toBe(true);
  await expect(page.locator('#ovMap')).toBeVisible();
  await expect(page.locator('#mapLayerKey')).toBeVisible();
  const key = await page.locator('#mapLayerKey').innerText();
  expect(key).toContain('Chandlery');
  expect(key).not.toContain('General Store');
  const label = await page.evaluate(() => {
    const layer = PixelPets.mapLayer();
    const hit = (layer.buildings || []).find((b) => b.door === 'bw_store');
    return hit ? hit.label : '';
  });
  expect(label).toBe('CHANDLERY');
  expect(await page.evaluate(() => PixelPets.previewMap('town', 'hearthmoor'))).toBe(true);
  await expect(page.locator('#mapLayerKey')).toContainText('General Store');
});

test('the Brinewick Lantern note names the same cost as the sign', async ({ page }) => {
  await boot(page, { 'story.reached_brinewick': true });
  await page.evaluate(() => PixelPets.goto('bw_lantern_in', 8, 6, 'right'));
  await tapLine(page, 'bw_lantern_note', 'A note by the door: "Rest a while. Dry coats on the left. A rest costs 5 Acorns, or what you have. Brinewick"');
});

test('Rook leaves Cobblecrest, and his Brinewick lines fire once', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, { 'story.rc_climax': true, 'story.cobble_end': true, 'story.route3_open': true });
  const opened = await page.evaluate(() => {
    PixelPets.goto('cobblecrest', 27, 7, 'right');
    const o = PixelPets.mapObjs.find((x) => x.id === 'rook_after') || null;
    return { spot: o, reached: !!PixelPets.state.flags['story.reached_brinewick'], ep1: !!PixelPets.state.flags['story.ep1_end'] };
  });
  expect(opened.reached).toBe(false);
  expect(opened.ep1).toBe(false);
  expect(opened.spot).toEqual(expect.objectContaining({ x: 28, y: 7 }));
  expect(await page.evaluate(() => PixelPets.runScene('rook_after'))).toBe(true);
  await showLines(page, ["The road's open now, and so is Brinewick's gate."]);

  const reached = await page.evaluate(() => {
    PixelPets.setFlag('story.reached_brinewick', true);
    PixelPets.goto('cobblecrest', 27, 7, 'right');
    return {
      spot: PixelPets.mapObjs.find((o) => o.id === 'rook_after') || null,
      ep1: !!PixelPets.state.flags['story.ep1_end'],
    };
  });
  expect(reached.ep1).toBe(false);
  expect(reached.spot).toBeNull();

  const afterCard = await page.evaluate(() => {
    PixelPets.setFlag('story.ep1_end', true);
    PixelPets.goto('cobblecrest', 27, 7, 'right');
    return PixelPets.mapObjs.find((o) => o.id === 'rook_after') || null;
  });
  expect(afterCard).toBeNull();
  expect(await page.evaluate(() => PixelPets.runScene('bw_ep1_end'))).toBe(true);
  await showLines(page, ['EPISODE 1 COMPLETE']);
  const stillGone = await page.evaluate(() => {
    PixelPets.goto('cobblecrest', 27, 7, 'right');
    const text = (window.PixelPets.scene && window.PixelPets.scene.text) || '';
    return { spot: PixelPets.mapObjs.find((o) => o.id === 'rook_after') || null, text };
  });
  expect(stillGone.spot).toBeNull();
  expect(stillGone.text).not.toContain("The road's open");

  await page.evaluate(() => PixelPets.setFlag('story.brine_arrived', true));
  await bark(page, { 'story.brine_arrived': true }, "Lanyard's straight. My stomach isn't.");
  await bark(page, { 'story.brine_arrived': true, 'story.rook_quit': true }, 'No lanyard. Feels lighter. Feels weird.');
  await bark(page, { 'story.brine_arrived': true, 'story.brine_depot': true }, 'You heard it hum too. Right?');
  await bark(page, { 'story.brine_arrived': true, 'story.brine_depot': true, 'story.brine_freed': true }, '');

  await page.evaluate(() => {
    PixelPets.setFlag('story.brine_freed', null);
    PixelPets.setFlag('story.brine_manifest', 'signed');
  });
  await tapLine(page, 'rook_bw_wait', 'You signed it, and it still came with you. Good.');
  await page.evaluate(() => {
    PixelPets.setFlag('story.brine_manifest', 'open');
    PixelPets.setFlag('story.brine_freed', true);
  });
  await tapLine(page, 'rook_bw_wait', 'You opened it. ...Okay. Okay. I\'m staying close.');
});

test('an old Marisol save folds into one Master Marisol', async ({ page }) => {
  const before = save({ 'story.phone_got': true }, {
    rep: { Marisol: 73 },
    phoneBook: { met: { Marisol: true }, fav: { Marisol: true } },
  });
  const beforeKeys = Object.keys(before).sort();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), before, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  const folded = await page.evaluate(() => ({
    v: PixelPets.state.v,
    repOld: PixelPets.state.rep.Marisol,
    repNew: PixelPets.state.rep['Master Marisol'],
    metOld: PixelPets.state.phoneBook.met.Marisol,
    metNew: PixelPets.state.phoneBook.met['Master Marisol'],
    favOld: PixelPets.state.phoneBook.fav.Marisol,
    favNew: PixelPets.state.phoneBook.fav['Master Marisol'],
    getOld: PixelPets.repGet('Marisol'),
    getNew: PixelPets.repGet('Master Marisol'),
    check: PixelPets.repCheck(),
    both: window.PPRep.devCheck(['Marisol', 'Master Marisol']),
    people: PixelPets.contacts().filter((c) => /Marisol/.test(c.name)).map((c) => c.name),
    keys: Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort(),
  }));
  expect(folded.v).toBe(2);
  expect(folded.repOld).toBe(73);
  expect(folded.repNew).toBe(73);
  expect(folded.metOld).toBe(true);
  expect(folded.metNew).toBe(true);
  expect(folded.favOld).toBe(true);
  expect(folded.favNew).toBe(true);
  expect(folded.getOld).toBe(73);
  expect(folded.getNew).toBe(73);
  expect(folded.check.filter((row) => /Marisol/.test(row))).toEqual([]);
  expect(folded.both).toEqual([]);
  expect(folded.people).toEqual(['Master Marisol']);
  expect(folded.keys).toEqual(beforeKeys);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#phoneBtn').click();
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.locator('.phone-app[data-app="contacts"]').click();
  await expect(page.locator('.contact-name', { hasText: 'Master Marisol' })).toBeVisible();
  const shown = await page.locator('.contact-name').allTextContents();
  expect(shown.filter((n) => /Marisol/.test(n))).toEqual(['Master Marisol']);
});

test('dead copy and the Heights lines stay where the sign-off put them', async ({ page }) => {
  const read = (rel) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'));
  const act1 = read('data/act1_route2.json');
  const cobble = read('data/cobblecrest.json');
  const slice = read('data/maps_slice.json');
  const rooms = read('data/interiors.json');
  const say = (steps, bit) => steps.some((st) => Array.isArray(st) && st[0] === 'say' && String(st[2] || '').indexOf(bit) >= 0);
  expect(say(act1.scenes.route2_end, "Master Hale's Trial Hall.")).toBe(true);
  expect(say(cobble.scenes.brinewick_hook, 'The Brinewick road stays shut while crates are loaded.')).toBe(true);
  expect(cobble.decisions['5_end']).toBe('Cobblecrest ends at the shut Brinewick road (story.cobble_end). Route 3 opens on story.route3_open.');
  const sign = slice.maps.hearthmoor.objs.find((o) => o.id === 'hm_sign_lantern');
  expect(sign.text).toBe(HOUSE);
  const mom = rooms.maps.hm_home_up.objs.find((o) => o.id === 'mom');
  expect(mom.lines['!story.dream_study']).toBe('Tell Warden Ilse what you dreamed. She gave you your Walkling.');
  const heights = fs.readFileSync(path.join(__dirname, '..', 'data/heights.json'), 'utf8');
  expect(heights).toContain('Glimmerwell calls it ancient, and will not say why it was built. RegenX never knew.');
  expect(heights).toContain('The Arbiter is an ancient Glimmerwell cradle in the top bay.');
  await boot(page);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
