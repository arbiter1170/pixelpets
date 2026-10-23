/* HUSHWATER B0: a species id this client does not know stays in the party and the box. */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const PARTY = {
  id: 'petzz1',
  species: 'zzfuture',
  stage: 4,
  nick: null,
  origin: 'wild',
  xp: 3,
  bx: 4,
  hunger: 20,
  happy: 20,
  energy: 0,
  met: 1700000000000,
  moves: ['zzfuture-spark', 'zzfuture-spark'],
  evoMoves: [9],
  mark: 'keep-b0',
};
const BOXED = {
  id: 'petzz2',
  species: 'zzfuture',
  stage: 0,
  nick: null,
  origin: 'wild',
  xp: 1,
  bx: 2,
  hunger: 77,
  happy: 66,
  energy: 55,
  met: 1700000000001,
  moves: ['only-zz'],
  evoMoves: [1, 2, 9],
  mark: 'keep-b0-box',
};

function hushSave() {
  const save = starterSave();
  save.party = [
    PARTY,
    {
      id: 'petember',
      species: 'ember',
      stage: 0,
      nick: null,
      origin: 'starter',
      xp: 10,
      bx: 40,
      hunger: 80,
      happy: 80,
      energy: 90,
      met: 1700000000000,
      moves: ['tackle'],
      evoMoves: [],
    },
  ];
  save.partnerId = 'petzz1';
  save.box = [BOXED];
  save.orphans = [];
  save.steps = 40;
  save.flags['story.phone_got'] = true;
  save.settings.controls = 'modern';
  save.settings.textSpeed = 'fast';
  save.dex.seen['zzfuture/4'] = true;
  save.dex.seen['zzfuture/0'] = true;
  save.dex.caught['zzfuture/4'] = true;
  return save;
}

function samePet(got, want) {
  expect(got).toEqual(want);
}

test('unknown species stays, draws a fallback, and cannot lead', async ({ page }) => {
  test.setTimeout(60000);
  const seed = hushSave();
  await installSave(page.context(), seed, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party.length === 2);

  const loaded = await page.evaluate(() => {
    const s = window.PixelPets.state;
    const caught = (s.dex && s.dex.caught) || {};
    const joinedShown = (document.querySelector('#dexCount') || {}).textContent || '';
    return {
      v: s.v,
      orphans: s.orphans,
      party: s.party.find(p => p.id === 'petzz1'),
      box: s.box.find(p => p.id === 'petzz2'),
      partner: s.partnerId,
      statsNull: window.PixelPets.statsAt('zzfuture/4', 5),
      statsEmber: window.PixelPets.statsAt('ember/0', 5),
      name: document.querySelector('#hdrName').textContent,
      hint: document.querySelector('#evoHint').textContent,
      caughtKeys: Object.keys(caught),
      joinedShown,
    };
  });
  expect(loaded.v).toBe(2);
  expect(loaded.orphans).toEqual([]);
  expect(loaded.partner).toBe('petzz1');
  samePet(loaded.party, PARTY);
  samePet(loaded.box, BOXED);
  expect(loaded.statsNull).toBeNull();
  expect(loaded.statsEmber).toBeTruthy();
  expect(loaded.name).toBe('???');
  expect(loaded.hint).toBe('???');
  expect(loaded.caughtKeys).toContain('zzfuture/4');

  const round = await page.evaluate(save => {
    const once = PPSave.normalizeV2(JSON.parse(JSON.stringify(save)));
    const twice = PPSave.normalizeV2(JSON.parse(JSON.stringify(once)));
    return {
      onceParty: once.party.find(p => p.id === 'petzz1'),
      onceBox: once.box.find(p => p.id === 'petzz2'),
      twiceParty: twice.party.find(p => p.id === 'petzz1'),
      twiceBox: twice.box.find(p => p.id === 'petzz2'),
      orphans: once.orphans,
      v: once.v,
    };
  }, seed);
  samePet(round.onceParty, PARTY);
  samePet(round.onceBox, BOXED);
  samePet(round.twiceParty, PARTY);
  samePet(round.twiceBox, BOXED);
  expect(round.orphans).toEqual([]);
  expect(round.v).toBe(2);

  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('#dexGrid [data-form="zzfuture/4"]');
  const grid = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('#dexGrid .cell')];
    const paint = canvas => {
      const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let grey = 0;
      const raw = [];
      for (let i = 0; i < d.length; i += 4) {
        raw.push(d[i], d[i + 1], d[i + 2], d[i + 3]);
        if (d[i] === 0x94 && d[i + 1] === 0xb0 && d[i + 2] === 0xc2 && d[i + 3] > 0) grey++;
      }
      return { grey, raw };
    };
    const unk = document.querySelector('#dexGrid [data-form="zzfuture/4"]');
    const other = document.querySelector('#dexGrid [data-form="zzfuture/0"]');
    const party = document.querySelector('#partyBoard [data-id="petzz1"] canvas');
    const ember = document.querySelector('#partyBoard [data-id="petember"] canvas');
    const box = document.querySelector('#boxList [data-id="petzz2"]');
    const known = cells.filter(c => !String(c.dataset.form || '').startsWith('zzfuture/')).length;
    const header = document.querySelector('#dexCount').textContent;
    const caught = window.PixelPets.state.dex.caught;
    const joinedKnown = Object.keys(caught).filter(k => caught[k] && !String(k).startsWith('zzfuture/')).length;
    const slot = document.querySelector('#partyBoard [data-id="petzz1"] .slot-main');
    const slotBox = slot.getBoundingClientRect();
    const cellBox = unk.getBoundingClientRect();
    return {
      n: cells.length,
      known,
      header,
      joinedKnown,
      label: unk.textContent,
      other: other.textContent,
      state: unk.dataset.state,
      partyName: document.querySelector('#partyBoard [data-id="petzz1"] .slot-name').textContent,
      boxName: box.querySelector('.slot-name').textContent,
      orphan: document.querySelector('#orphanRow') ? document.querySelector('#orphanRow').textContent : '',
      party: paint(party),
      journal: paint(unk.querySelector('canvas')),
      ember: paint(ember),
      slotH: slotBox.height,
      slotW: slotBox.width,
      cellH: cellBox.height,
      cellW: cellBox.width,
    };
  });
  expect(grid.known).toBe(57);
  expect(grid.n).toBe(59);
  expect(grid.header).toContain('Out there 57');
  expect(grid.header).toContain('Joined ' + grid.joinedKnown);
  expect(grid.label).toContain('???');
  expect(grid.other).toContain('???');
  expect(grid.partyName).toBe('???');
  expect(grid.boxName).toBe('???');
  expect(grid.orphan).toBe('');
  expect(grid.party.grey).toBeGreaterThan(0);
  expect(grid.journal.raw).toEqual(grid.party.raw);
  expect(grid.ember.raw).not.toEqual(grid.party.raw);
  expect(grid.slotH).toBeGreaterThanOrEqual(44);
  expect(grid.slotW).toBeGreaterThanOrEqual(44);
  expect(grid.cellH).toBeGreaterThanOrEqual(44);
  expect(grid.cellW).toBeGreaterThanOrEqual(44);

  if (page.viewportSize().width === 390) {
    const dir = artifactsDir('screenshots');
    await page.locator('#partyBoard [data-id="petzz1"]').screenshot({ path: path.join(dir, 'hushwater-b0-party.png') });
    await page.locator('#dexGrid [data-form="zzfuture/4"]').screenshot({ path: path.join(dir, 'hushwater-b0-journal-cell.png') });
  }

  await page.locator('#dexGrid [data-form="zzfuture/4"]').tap({ timeout: 8000 });
  await expect(page.locator('#jnTitle')).toHaveText('???');
  await expect(page.locator('#jnType')).toHaveText('???');
  if (page.viewportSize().width === 390) {
    await page.locator('#ovJournal .ov-inner').screenshot({ path: path.join(artifactsDir('screenshots'), 'hushwater-b0-journal.png') });
  }
  await page.locator('#jnClose').tap({ timeout: 8000 });
  await expect(page.locator('#ovJournal')).toBeHidden();

  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party.length === 2, null, { timeout: 8000 });
  const again = await page.evaluate(() => {
    const s = window.PixelPets.state;
    return {
      party: s.party.find(p => p.id === 'petzz1'),
      box: s.box.find(p => p.id === 'petzz2'),
      orphans: s.orphans,
      v: s.v,
    };
  });
  samePet(again.party, PARTY);
  samePet(again.box, BOXED);
  expect(again.orphans).toEqual([]);
  expect(again.v).toBe(2);

  await page.evaluate(() => PixelPets.showTab('pet'));
  for (const act of ['feed', 'play', 'rest']) {
    await page.locator('#scr-pet [data-act="' + act + '"]').tap({ timeout: 8000 });
  }
  const careSize = await page.locator('#scr-pet [data-act="feed"]').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  expect(careSize.h).toBeGreaterThanOrEqual(44);
  expect(careSize.w).toBeGreaterThanOrEqual(44);

  await page.locator('#petStatsBtn').tap({ timeout: 8000 });
  await expect(page.locator('#scName')).toHaveText('???');
  await expect(page.locator('#scType')).toHaveText('???');
  await page.locator('#scClose').tap({ timeout: 8000 });

  await page.locator('#petKitBtn').tap({ timeout: 8000 });
  await expect(page.locator('#ovStats')).toBeVisible();
  await page.locator('#scClose').tap({ timeout: 8000 });

  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.evaluate(() => PixelPets.showTab('walk'));
  for (const [btn, ov, close] of [['#questBtn', '#ovQuest', '#questClose'], ['#mapBtn', '#ovMap', '#mapClose'], ['#walkBagBtn', '#ovBag', '#bagClose'], ['#gearFloat', '#ovSettings', '#setClose']]) {
    await page.locator(btn).tap({ timeout: 8000 });
    await expect(page.locator(ov)).toBeVisible();
    await page.waitForFunction(() => window.PixelPets.optionsReady !== false);
    await page.locator(close).tap({ timeout: 8000 });
    await expect(page.locator(ov)).toBeHidden();
  }
  await page.locator('#phoneBtn').tap({ timeout: 8000 });
  await expect(page.locator('#ovPhone')).toBeVisible();
  await page.locator('#ovPhone [data-app="friends"]').tap({ timeout: 8000 });
  await page.locator('#phoneClose').tap({ timeout: 8000 });

  const lead = await page.evaluate(() => {
    const p = PixelPets.state.party.find(q => q.id === 'petzz1');
    p.energy = 90;
    PixelPets.showTab('walk');
    const ok = PixelPets.forceBattle('tide/0', 3);
    return { ok, petId: PixelPets.battle && PixelPets.battle.me && PixelPets.battle.me.petId, energy: p.energy };
  });
  expect(lead.ok).toBe(true);
  expect(lead.petId).toBe('petember');
  await page.locator('#btMsg').tap({ timeout: 8000 });
  await page.locator('#btMsg').tap({ timeout: 8000 });
  await page.waitForFunction(() => window.PixelPets.battle && window.PixelPets.battle.state === 'CHOOSE', null, { timeout: 8000 });
  await page.locator('[data-bact="swap"]').tap({ timeout: 8000 });
  await page.waitForSelector('#ovSheet');
  const swap = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('#shList button')];
    const unk = buttons.find(b => b.textContent.includes('???'));
    const ember = buttons.find(b => (b.textContent || '').indexOf('???') < 0);
    return {
      unkDisabled: !!(unk && unk.disabled),
      unkText: unk ? unk.textContent : '',
      emberHere: !!ember,
    };
  });
  expect(swap.unkDisabled).toBe(true);
  expect(swap.unkText).not.toContain('in battle');
  expect(swap.emberHere).toBe(true);
});
