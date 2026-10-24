/* CARE_SHORTCUTS v0.1.1: REST fills NRG, and FEED / PLAY / REST / HEAL on every party card. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const LINES = ['ember', 'tide', 'bloom', 'stone', 'volt', 'frost'];

function pet(id, species, extra) {
  return Object.assign({
    id, species, stage: 0, xp: 10, hunger: 80, happy: 60, energy: 50,
    nick: null, origin: 'wild', moves: ['bump'],
  }, extra || {});
}

function partySave(n, extra) {
  const save = starterSave();
  const count = n || 5;
  save.party = LINES.slice(0, count).map((species, i) => pet('p' + i, species, {
    origin: i ? 'wild' : 'starter',
    hunger: 80,
    happy: 60,
    energy: 40,
  }));
  save.partnerId = 'p0';
  save.box = [pet('pbox', 'beetle', { energy: 40, hunger: 50, happy: 50 })];
  save.money = 80;
  save.bag = { energy_sip: 2, heal_snack: 1 };
  save.settings.tips = true;
  save.flags['story.care_feed'] = true;
  save.flags['story.care_play'] = true;
  save.flags['story.care_rest'] = true;
  save.flags['story.tutorial_done'] = true;
  save.flags['story.unlock_party'] = true;
  save.flags['story.unlock_party_moves'] = true;
  save.flags['story.unlock_party_order'] = true;
  save.dex = { seen: {}, caught: {}, legacy: [], hits: {} };
  LINES.slice(0, count).concat(['beetle']).forEach((species) => {
    save.dex.seen[species + '/0'] = true;
    save.dex.caught[species + '/0'] = true;
  });
  if (extra) Object.assign(save, extra);
  if (extra && extra.flags) save.flags = Object.assign(save.flags, extra.flags);
  if (extra && extra.party) save.party = extra.party;
  if (extra && extra.bag) save.bag = extra.bag;
  return save;
}

async function boot(page, save, search) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, search || '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
}

async function openCol(page, save) {
  await boot(page, save);
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('#partyBoard .slot-care [data-act="heal"]');
}

test('REST fills NRG, keeps the old refusal, and the Sip fills NRG', async ({ page }) => {
  test.setTimeout(60000);
  const save = partySave(2);
  save.party[0].energy = 0;
  save.party[0].hunger = 80;
  await boot(page, save);
  await page.evaluate(() => PixelPets.setMoney(80));
  const keysBefore = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());
  await page.evaluate(() => PixelPets.showTab('pet'));
  await page.locator('#scr-pet [data-act="rest"]').click();
  await expect(page.locator('#toast')).toHaveText('Zzz... +ENERGY');
  await expect(page.locator('#scr-pet [data-act="rest"] .cdt')).toHaveText('30m');
  const rested = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      energy: p.energy,
      hunger: p.hunger,
      cd: PixelPets.cooldownLeft('rest'),
      v: raw.v,
      keys: Object.keys(raw).sort(),
      box: PixelPets.roleMult.box,
    };
  });
  expect(rested.energy).toBeGreaterThan(99.5);
  expect(rested.hunger).toBeGreaterThan(69);
  expect(rested.hunger).toBeLessThanOrEqual(70);
  expect(rested.cd).toBeGreaterThan(29 * 60000);
  expect(rested.cd).toBeLessThanOrEqual(30 * 60000);
  expect(rested.v).toBe(2);
  const added = rested.keys.filter((k) => keysBefore.indexOf(k) < 0);
  expect(added.filter((k) => k !== 'care')).toEqual([]);
  expect(rested.box).toBe(0);

  await page.waitForTimeout(3200);
  const refused = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.energy = 98;
    p.hunger = 80;
    delete p.hpNow;
    delete p.faintUntil;
    delete p.cd;
    document.querySelector('#scr-pet [data-act="rest"]').click();
    return {
      energy: p.energy,
      hunger: p.hunger,
      hpNow: p.hpNow == null ? null : p.hpNow,
      faint: p.faintUntil == null,
      cd: (p.cd && p.cd.rest) || 0,
      toast: document.querySelector('#toast').textContent,
    };
  });
  expect(refused.toast).toBe('Not sleepy right now.');
  expect(refused.energy).toBeCloseTo(98, 1);
  expect(refused.hunger).toBeCloseTo(80, 1);
  expect(refused.cd).toBe(0);
  expect(refused.faint).toBe(true);

  const hurtBefore = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.energy = 98;
    p.hunger = 80;
    p.hpNow = 4;
    p.faintUntil = Date.now() + 12 * 60000;
    delete p.cd;
    return { hp: hpOf(p), max: maxHpOf(p) };
  });
  await page.locator('#scr-pet [data-act="rest"]').click();
  await expect(page.locator('#toast')).toHaveText('Zzz... +ENERGY +HP');
  const hurt = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { energy: p.energy, hp: hpOf(p), nap: p.faintUntil, hunger: p.hunger };
  });
  expect(hurt.energy).toBeGreaterThan(99.5);
  expect(hurt.nap == null).toBe(true);
  expect(hurt.hunger).toBeLessThanOrEqual(70);
  expect(hurt.hp).toBeGreaterThanOrEqual(Math.min(hurtBefore.max, hurtBefore.hp + hurtBefore.max * 0.5) - 0.2);

  await page.waitForTimeout(3200);
  await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.energy = 10;
    delete p.cd;
    PixelPets.setFast(true);
    PixelPets.showTab('pet');
  });
  await page.locator('#scr-pet [data-act="rest"]').click();
  const fast = await page.evaluate(() => PixelPets.cooldownLeft('rest'));
  expect(fast).toBeGreaterThan(28000);
  expect(fast).toBeLessThanOrEqual(30000);
  await expect(page.locator('#scr-pet [data-act="rest"] .cdt')).toHaveText(/^0:(29|30)$/);

  const sip = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.energy = 10;
    const low = PixelPets.useItem('energy_sip', p.id, 'field');
    const filled = p.energy;
    p.energy = 98;
    const high = PixelPets.useItem('energy_sip', p.id, 'field');
    const battle = PixelPets.useItem('energy_sip', p.id, 'battle');
    return { low, filled, high, battle, left: PixelPets.state.bag.energy_sip || 0 };
  });
  expect(sip.low.ok).toBe(true);
  expect(sip.low.msg).toContain('perks right up');
  expect(sip.filled).toBeGreaterThan(99.5);
  expect(sip.high.ok).toBe(false);
  expect(sip.high.msg).toContain('already bright-eyed');
  expect(sip.battle.ok).toBe(false);
  expect(sip.battle.msg).toMatch(/battle/i);
  expect(sip.left).toBe(1);

  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#walkBagBtn').click();
  await expect(page.locator('.bag-row[data-id="energy_sip"] .bag-blurb')).toHaveText('A fizzy pick-me-up. Fills NRG.');
  await page.keyboard.press('Escape');

  const boxBefore = await page.evaluate(() => {
    PixelPets.state.party.forEach((p) => { p.energy = 20; });
    return PixelPets.state.box[0].energy;
  });
  expect(await page.evaluate(() => PixelPets.runScene('home_bed'))).toBe(true);
  await playScene(page, ['Nap a while']);
  await expect(page.locator('#toast')).toContainText('Your team is rested.');
  const bed = await page.evaluate(() => ({
    party: PixelPets.state.party.map((p) => p.energy),
    box: PixelPets.state.box[0].energy,
    lines: [...document.querySelectorAll('button, p, h2, #toast, #walkTip')].map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim()).filter((t) => /bed/i.test(t) && /NRG/i.test(t)),
  }));
  expect(bed.party.every((n) => n > 99.5)).toBe(true);
  expect(bed.box).toBeCloseTo(boxBefore, 1);
  for (const line of bed.lines) expect(line).toContain('NRG to 100');
});

test('every party card can FEED, PLAY, REST and HEAL on that Walkling', async ({ page }) => {
  test.setTimeout(60000);
  await openCol(page, partySave(5));
  const shape = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#partyBoard .party-slot[data-id]')];
    const labels = cards.map((row) => [...row.querySelectorAll('.slot-care button')].map((b) => b.textContent.replace(/\s+/g, '')));
    return {
      cards: cards.length,
      labels,
      boxCare: document.querySelectorAll('.box-row .slot-care').length,
      emptyCare: document.querySelectorAll('.party-slot.empty .slot-care').length,
      partner: PixelPets.state.partnerId,
    };
  });
  expect(shape.cards).toBe(5);
  expect(shape.labels).toEqual([
    ['FEED', 'PLAY', 'REST', 'HEALFULL'],
    ['FEED', 'PLAY', 'REST', 'HEALFULL'],
    ['FEED', 'PLAY', 'REST', 'HEALFULL'],
    ['FEED', 'PLAY', 'REST', 'HEALFULL'],
    ['FEED', 'PLAY', 'REST', 'HEALFULL'],
  ]);
  expect(shape.boxCare).toBe(0);
  expect(shape.emptyCare).toBe(0);
  expect(shape.partner).toBe('p0');

  const before = await page.evaluate(() => PixelPets.state.party.map((p) => ({ id: p.id, hunger: p.hunger, energy: p.energy })));
  await page.locator('.party-slot[data-id="p1"] [data-act="feed"]').click();
  await expect(page.locator('#toast')).toHaveText('Yum! +FOOD');
  const fed = await page.evaluate(() => ({
    hunger: PixelPets.state.party.map((p) => p.hunger),
    partner: PixelPets.state.partnerId,
    cd: PixelPets.state.party[1].cd && PixelPets.state.party[1].cd.feed,
    partnerCd: PixelPets.state.party[0].cd && PixelPets.state.party[0].cd.feed,
  }));
  expect(fed.hunger[1]).toBeGreaterThan(before[1].hunger);
  expect(fed.hunger[0]).toBeCloseTo(before[0].hunger, 1);
  expect(fed.partner).toBe('p0');
  expect(fed.cd).toBeGreaterThan(0);
  expect(fed.partnerCd || 0).toBe(0);
  await expect(page.locator('.party-slot[data-id="p1"] [data-act="feed"] .cdt')).toHaveText('20m');

  const name = (await page.locator('.party-slot[data-id="p1"] .slot-name').innerText()).split('\n')[0].trim();
  await page.locator('.party-slot[data-id="p1"] [data-act="feed"]').click({ force: true });
  await expect(page.locator('#toast')).toHaveText(name + ' is still digesting. Feed again in 20m.');
  expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe('p0');

  const both = await page.evaluate(() => {
    const food = PixelPets.state.party[3].hunger;
    document.querySelector('.party-slot[data-id="p2"] [data-act="rest"]').click();
    document.querySelector('.party-slot[data-id="p3"] [data-act="feed"]').click();
    return {
      rest: PixelPets.state.party[2].energy,
      restCd: !!(PixelPets.state.party[2].cd && PixelPets.state.party[2].cd.rest),
      fed: PixelPets.state.party[3].hunger > food + 1,
      feedCd: !!(PixelPets.state.party[3].cd && PixelPets.state.party[3].cd.feed),
      partner: PixelPets.state.partnerId,
    };
  });
  expect(both.rest).toBeGreaterThan(99.5);
  expect(both.restCd).toBe(true);
  expect(both.fed).toBe(true);
  expect(both.feedCd).toBe(true);
  expect(both.partner).toBe('p0');

  await page.locator('.party-slot[data-id="p0"] [data-act="heal"]').click({ force: true });
  await expect(page.locator('#toast')).toContainText('already at full HP');
  await expect(page.locator('#ovSheet')).toBeHidden();

  await page.evaluate(() => { PixelPets.state.party[1].hpNow = 4; });
  await page.locator('.party-slot[data-id="p1"] [data-act="heal"]').click({ force: true });
  const who = await page.locator('.party-slot[data-id="p1"] .slot-name').innerText();
  const partnerName = await page.locator('.party-slot[data-id="p0"] .slot-name').innerText();
  await expect(page.locator('#shTitle')).toHaveText('Heal ' + who);
  expect(who).not.toBe(partnerName);
  await page.locator('#shCancel').click();
  await expect(page.locator('#ovSheet')).toBeHidden();

  const busy = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.energy = 40;
    p.happy = 40;
    delete p.cd;
    document.querySelector('.party-slot[data-id="p0"] [data-act="play"]').click();
    const afterPlay = p.energy;
    document.querySelector('.party-slot[data-id="p0"] [data-act="rest"]').click();
    const partnerBlocked = p.energy < 90;
    document.querySelector('.party-slot[data-id="p1"] [data-act="rest"]').click();
    return {
      afterPlay,
      partnerBlocked,
      other: PixelPets.state.party[1].energy,
      partner: PixelPets.state.partnerId,
    };
  });
  expect(busy.afterPlay).toBeLessThan(40);
  expect(busy.partnerBlocked).toBe(true);
  expect(busy.other).toBeGreaterThan(99.5);
  expect(busy.partner).toBe('p0');

  await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    if (p.cd) delete p.cd.play;
    p.happy = 40;
    p.energy = 40;
    PixelPets.showTab('walk');
  });
  await page.evaluate(() => PixelPets.applyCtl('modern', false));
  await page.locator('#petStrip').click();
  await expect(page.locator('#careTray .ct-care [data-act]')).toHaveCount(4);
  await expect(page.locator('#careTray .slot-care')).toHaveCount(0);
  await page.waitForTimeout(1300);
  await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    p.happy = 40;
    p.energy = 50;
    if (p.cd) delete p.cd.play;
  });
  const trayBefore = await page.evaluate(() => PixelPets.state.party[1].hunger);
  await page.locator('#careTray [data-act="play"]').click();
  const tray = await page.evaluate(() => ({
    other: PixelPets.state.party[1].hunger,
    partner: PixelPets.state.partnerId,
    joy: PixelPets.state.party[0].happy,
  }));
  expect(tray.other).toBeCloseTo(trayBefore, 1);
  expect(tray.partner).toBe('p0');
  expect(tray.joy).toBeGreaterThan(40);

  await page.evaluate(() => PixelPets.showTab('col'));
  const hunger = await page.evaluate(() => PixelPets.state.party[1].hunger);
  await page.evaluate(() => PixelPets.forceBattle('tide/0', 3));
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on);
  await page.evaluate(() => document.querySelector('.party-slot[data-id="p1"] [data-act="feed"]').click());
  await expect(page.locator('#toast')).toHaveText('Finish the battle first.');
  const during = await page.evaluate(() => {
    const care = document.querySelector('.party-slot[data-id="p1"] [data-act="feed"]').getBoundingClientRect();
    const move = document.querySelector('.party-slot[data-id="p0"] [data-act="move"]').getBoundingClientRect();
    return { hunger: PixelPets.state.party[1].hunger, care: care.width, move: move.width };
  });
  expect(during.hunger).toBeCloseTo(hunger, 1);
  expect(during.care).toBe(0);
  expect(during.move).toBe(0);
});

test('care buttons fit at phone width and a full party can scroll to the last row', async ({ page }) => {
  await openCol(page, partySave(6));
  const lay = await page.evaluate(() => {
    const scr = document.querySelector('#scr-col');
    const buttons = [...document.querySelectorAll('#partyBoard .slot-care button')];
    const boxes = buttons.map((b) => {
      const r = b.getBoundingClientRect();
      const tn = [...b.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      const range = document.createRange();
      range.selectNodeContents(tn);
      const tr = range.getBoundingClientRect();
      return {
        label: tn.textContent.trim(),
        w: r.width,
        h: r.height,
        fit: tr.width > 0 && tr.left >= r.left - 1 && tr.right <= r.right + 1 && tr.top >= r.top - 1 && tr.bottom <= r.bottom + 1,
      };
    });
    const scrBox = scr.getBoundingClientRect();
    const last = document.querySelector('#partyBoard .party-slot[data-id="p5"] .slot-care [data-act="heal"]');
    const wasBelow = last.getBoundingClientRect().bottom > scrBox.bottom + 1;
    last.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = last.getBoundingClientRect();
    const s = scr.getBoundingClientRect();
    return {
      n: buttons.length,
      minW: Math.min.apply(null, boxes.map((b) => b.w)),
      minH: Math.min.apply(null, boxes.map((b) => b.h)),
      labels: boxes.every((b) => b.fit && (b.label === 'FEED' || b.label === 'PLAY' || b.label === 'REST' || b.label === 'HEAL')),
      overflow: scr.scrollWidth - scr.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scrolls: scr.scrollHeight > scr.clientHeight + 1,
      wasBelow,
      reached: r.height >= 44 && r.top >= s.top - 1 && r.bottom <= s.bottom + 2,
    };
  });
  expect(lay.n).toBe(24);
  expect(lay.minW).toBeGreaterThanOrEqual(44);
  expect(lay.minH).toBeGreaterThanOrEqual(44);
  expect(lay.labels).toBe(true);
  expect(lay.overflow).toBeLessThanOrEqual(1);
  expect(lay.pageOverflow).toBeLessThanOrEqual(1);
  expect(lay.reached).toBe(true);
  if (page.viewportSize().width === 320) {
    expect(lay.scrolls).toBe(true);
    expect(lay.wasBelow).toBe(true);
  }

  const dir = artifactsDir('care-shortcuts');
  const width = page.viewportSize().width;
  if (width === 390 || width === 320) {
    await page.evaluate(() => {
      PixelPets.state.party[1].hpNow = 8;
      PixelPets.state.party[1].cd = { feed: Date.now() };
      PixelPets.showTab('col');
      const scr = document.querySelector('#scr-col');
      if (scr) scr.scrollTop = 0;
    });
    await page.locator('#scr-col').screenshot({ path: path.join(dir, 'party-care-' + width + '.png') });
    if (width === 390) {
      await page.locator('.party-slot[data-id="p1"]').screenshot({ path: path.join(dir, 'party-card-390.png') });
    }
  }
});

test('partner care from a card counts for the care lesson, and another card does not', async ({ page }) => {
  test.setTimeout(60000);
  const save = partySave(2, {
    flags: { 'story.tut_care': 'wait', 'story.tut_care_step': 'C2' },
  });
  save.party[0].hunger = 40;
  save.party[0].happy = 40;
  save.party[0].energy = 40;
  save.party[1].hunger = 40;
  await boot(page, save);
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('.party-slot[data-id="p1"] [data-act="feed"]');
  await page.evaluate(() => {
    PixelPets.applyCtl('modern', false);
    PixelPets.showTab('walk');
  });
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => PixelPets.lesson().card === 'C2');
  const otherBefore = await page.evaluate(() => PixelPets.state.party[1].hunger);
  await page.evaluate(() => document.querySelector('.party-slot[data-id="p1"] [data-act="feed"]').click());
  await page.waitForTimeout(400);
  const missed = await page.evaluate(() => ({
    card: PixelPets.lesson().card,
    hunger: PixelPets.state.party[1].hunger,
    partner: PixelPets.state.partnerId,
  }));
  expect(missed.card).toBe('C2');
  expect(missed.hunger).toBeGreaterThan(otherBefore);
  expect(missed.partner).toBe('p0');
  await page.evaluate(() => document.querySelector('.party-slot[data-id="p0"] [data-act="feed"]').click());
  await page.waitForFunction(() => PixelPets.lesson().card === 'C3', null, { timeout: 8000 });
  expect(await page.evaluate(() => PixelPets.state.partnerId)).toBe('p0');
});
