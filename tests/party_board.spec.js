/* WALKLINGS tab: six party slots, the box, and the journal of 57 forms. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function pet(id, species, extra) {
  return Object.assign({
    id, species, stage: 0, xp: 10, hunger: 80, happy: 60, energy: 90,
    nick: null, origin: 'wild', moves: ['bump'],
  }, extra);
}

function boardSave(extra) {
  const save = starterSave();
  save.party = [
    pet('pember', 'ember', { origin: 'starter', mark: 'ember', hpNow: 4, bond: 2, moves: ['bump', 'flick_flame'] }),
    pet('ptide', 'tide', { mark: 'tide', hpNow: 3, bond: 5 }),
    pet('pbloom', 'bloom', { mark: 'bloom' }),
  ];
  save.partnerId = 'pember';
  save.box = [pet('pstone', 'stone', { mark: 'stone', held: 'soft_berry' })];
  save.orphans = [{ reason: 'unknown-species', from: 'v2.box[9]', at: 1, raw: { species: 'nope' } }];
  save.dex = {
    seen: { 'ember/0': true, 'tide/0': true, 'bloom/0': true, 'stone/0': true, 'volt/0': true },
    caught: { 'ember/0': true, 'tide/0': true, 'bloom/0': true, 'stone/0': true },
    legacy: [],
    hits: {},
  };
  save.flags['story.intro_seen'] = true;
  save.flags['story.starter_received'] = true;
  save.flags['story.starter_line'] = 'ember';
  return Object.assign(save, extra || {});
}

function fullSave() {
  const save = boardSave();
  save.orphans = [];
  const lines = ['ember', 'tide', 'bloom', 'stone', 'volt', 'frost'];
  save.party = lines.map((species, i) => pet('p' + i, species, { origin: i ? 'wild' : 'starter', mark: species }));
  save.partnerId = 'p0';
  save.box = [pet('pbox', 'beetle', { mark: 'beetle' })];
  save.dex.seen = {};
  save.dex.caught = {};
  lines.forEach((species) => { save.dex.seen[species + '/0'] = true; save.dex.caught[species + '/0'] = true; });
  save.dex.seen['beetle/0'] = true;
  save.dex.caught['beetle/0'] = true;
  return save;
}

async function openCol(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('#partyBoard [data-slot="5"]');
}

test('journal grid, six slots, and the quiet orphan row', async ({ page }) => {
  await openCol(page, boardSave());
  const grid = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('#dexGrid .cell')];
    const ember = document.querySelector('#dexGrid [data-form="ember/0"]');
    const met = document.querySelector('#dexGrid [data-form="volt/0"]');
    const unmet = cells.filter((c) => c.dataset.state === 'unmet');
    const scr = document.querySelector('#scr-col');
    const box = document.querySelector('#boxList').getBoundingClientRect().top;
    const orph = document.querySelector('#orphanRow');
    const dex = document.querySelector('#dexGrid').getBoundingClientRect().top;
    const short = [...document.querySelectorAll('#ownedList button')].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && (r.height < 43 || r.width < 43);
    }).map((b) => b.textContent);
    return {
      n: cells.length,
      slots: document.querySelectorAll('#partyBoard [data-slot]').length,
      emberTag: ember && ember.tagName,
      emberState: ember && ember.dataset.state,
      metTag: met && met.tagName,
      metState: met && met.dataset.state,
      metName: met && met.textContent,
      unmet: unmet.length,
      unmetButtons: unmet.filter((c) => c.tagName === 'BUTTON').length,
      unmetHuh: unmet.every((c) => { const d = c.querySelector('div'); return d && d.textContent === '???' && d.classList.contains('unk'); }),
      vaneTitle: (document.querySelector('#dexGrid [data-form="vane/0"]') || {}).title || '',
      header: document.querySelector('#dexCount').textContent,
      joined: Object.values(PixelPets.state.dex.caught).filter(Boolean).length,
      orphan: orph ? orph.textContent : '',
      orphanButtons: orph ? orph.querySelectorAll('button').length : -1,
      order: box < (orph ? orph.getBoundingClientRect().top : 0) && (orph ? orph.getBoundingClientRect().top : 0) < dex,
      overflow: scr.scrollWidth - scr.clientWidth,
      short,
    };
  });
  expect(grid.slots).toBe(6);
  expect(grid.n).toBe(57);
  expect(grid.emberTag).toBe('BUTTON');
  expect(grid.emberState).toBe('joined');
  expect(grid.metTag).toBe('BUTTON');
  expect(grid.metState).toBe('met');
  expect(grid.metName).toContain('Zipmite');
  expect(grid.unmet).toBeGreaterThan(0);
  expect(grid.unmetButtons).toBe(0);
  expect(grid.unmetHuh).toBe(true);
  expect(grid.vaneTitle).toMatch(/weather/i);
  expect(grid.header).toContain('Joined ' + grid.joined);
  expect(grid.header).toContain('Out there 57');
  expect(grid.orphan).toContain('1');
  expect(grid.orphan).toContain('unknown-species');
  expect(grid.orphanButtons).toBe(0);
  expect(grid.order).toBe(true);
  expect(grid.overflow).toBeLessThanOrEqual(1);
  expect(grid.short).toEqual([]);

  await page.locator('#dexGrid [data-form="volt/0"]').tap();
  await expect(page.locator('#ovJournal')).toBeVisible();
  await expect(page.locator('#jnMet')).toContainText(/hasn't joined/i);
  await page.locator('#jnClose').tap();
  await expect(page.locator('#ovJournal')).toBeHidden();
});

test('reorder, deposit, withdraw, and release keep the pet and the journal', async ({ page }) => {
  await openCol(page, boardSave());
  const report = await page.evaluate(() => {
    const ids = () => PixelPets.state.party.map((p) => p.id);
    const out = {};
    const before = ids();
    const ember = PixelPets.state.party.find((p) => p.id === 'pember');
    const snap = { id: ember.id, mark: ember.mark, hp: ember.hpNow, moves: ember.moves.slice(), bond: ember.bond };
    out.reorder = reorderParty(before[0], 1);
    out.after = ids();
    const moved = PixelPets.state.party[1];
    out.moved = { id: moved.id, mark: moved.mark, hp: moved.hpNow, moves: moved.moves.slice(), bond: moved.bond };
    out.snap = snap;
    out.partner = PixelPets.state.partnerId;
    out.badId = reorderParty('missing', 0);
    out.badIndex = reorderParty(before[0], 9);
    reorderParty(before[0], 0);
    const partyBefore = ids();
    const boxBefore = PixelPets.state.box.map((p) => p.id);
    out.depPartner = depositPet(PixelPets.state.partnerId);
    out.partySame = ids().join() === partyBefore.join();
    out.boxSame = PixelPets.state.box.map((p) => p.id).join() === boxBefore.join();
    out.partnerSame = PixelPets.state.partnerId === 'pember';
    const tide = PixelPets.state.party.find((p) => p.id === 'ptide');
    out.tideBefore = { id: tide.id, mark: tide.mark, bond: tide.bond, hp: tide.hpNow };
    out.dep = depositPet('ptide');
    out.box0 = PixelPets.state.box[0] && { id: PixelPets.state.box[0].id, mark: PixelPets.state.box[0].mark, bond: PixelPets.state.box[0].bond, hp: PixelPets.state.box[0].hpNow };
    out.tideInParty = ids().includes('ptide');
    const slot = PixelPets.state.party.length;
    out.withdraw = withdrawPet('pstone', slot);
    out.stone = PixelPets.state.party[slot] && { id: PixelPets.state.party[slot].id, mark: PixelPets.state.party[slot].mark, held: PixelPets.state.party[slot].held };
    out.stoneInBox = PixelPets.state.box.some((p) => p.id === 'pstone');
    const caught = JSON.parse(JSON.stringify(PixelPets.state.dex.caught));
    out.releaseStone = releasePet('pstone');
    out.stoneGone = !PixelPets.state.party.concat(PixelPets.state.box).some((p) => p.id === 'pstone');
    out.bag = PixelPets.state.bag.soft_berry || 0;
    out.caughtSame = JSON.stringify(PixelPets.state.dex.caught) === JSON.stringify(caught);
    out.releaseTide = releasePet('ptide');
    out.tideGone = !PixelPets.state.party.concat(PixelPets.state.box).some((p) => p.id === 'ptide');
    out.depOk = depositPet('pember', 'pbloom');
    out.partnerNow = PixelPets.state.partnerId;
    out.emberBoxed = PixelPets.state.box[0] && PixelPets.state.box[0].id;
    out.emberMark = PixelPets.state.box[0] && PixelPets.state.box[0].mark;
    out.releaseBloom = releasePet('pbloom');
    out.releaseLast = releasePet('pember');
    out.left = PixelPets.state.party.map((p) => p.id);
    out.boxLeft = PixelPets.state.box.map((p) => p.id);
    out.caughtEmber = !!PixelPets.state.dex.caught['ember/0'];
    out.caughtStone = !!PixelPets.state.dex.caught['stone/0'];
    PixelPets.showTab('col');
    const cell = document.querySelector('#dexGrid [data-form="stone/0"]');
    out.stoneCell = cell && cell.tagName;
    out.stoneState = cell && cell.dataset.state;
    return out;
  });
  expect(report.reorder).toBe(true);
  expect(report.after).toEqual(['ptide', 'pember', 'pbloom']);
  expect(report.moved).toEqual(report.snap);
  expect(report.snap.mark).toBe('ember');
  expect(report.snap.moves).toEqual(['bump', 'flick_flame']);
  expect(report.snap.bond).toBe(2);
  expect(report.partner).toBe('pember');
  expect(report.badId).toBe(false);
  expect(report.badIndex).toBe(false);
  expect(report.depPartner).toBe(false);
  expect(report.partySame).toBe(true);
  expect(report.boxSame).toBe(true);
  expect(report.partnerSame).toBe(true);
  expect(report.dep).toBe(true);
  expect(report.box0).toEqual(report.tideBefore);
  expect(report.tideBefore.mark).toBe('tide');
  expect(report.tideBefore.bond).toBe(5);
  expect(report.tideInParty).toBe(false);
  expect(report.withdraw).toBe(true);
  expect(report.stone).toEqual({ id: 'pstone', mark: 'stone', held: 'soft_berry' });
  expect(report.stoneInBox).toBe(false);
  expect(report.releaseStone).toBe(true);
  expect(report.stoneGone).toBe(true);
  expect(report.bag).toBe(1);
  expect(report.caughtSame).toBe(true);
  expect(report.releaseTide).toBe(true);
  expect(report.tideGone).toBe(true);
  expect(report.depOk).toBe(true);
  expect(report.partnerNow).toBe('pbloom');
  expect(report.emberBoxed).toBe('pember');
  expect(report.emberMark).toBe('ember');
  expect(report.releaseBloom).toBe(true);
  expect(report.releaseLast).toBe(false);
  expect(report.left).toEqual(['pember']);
  expect(report.boxLeft).toEqual([]);
  expect(report.caughtEmber).toBe(true);
  expect(report.caughtStone).toBe(true);
  expect(report.stoneCell).toBe('BUTTON');
  expect(report.stoneState).toBe('joined');
});

test('a full party cannot gain a seventh Walkling', async ({ page }) => {
  await openCol(page, fullSave());
  const report = await page.evaluate(() => {
    const before = PixelPets.state.party.map((p) => p.id);
    const refused = withdrawPet('pbox', PixelPets.state.party.length);
    const swapped = withdrawPet('pbox', 0);
    const after = PixelPets.state.party.map((p) => ({ id: p.id, mark: p.mark }));
    const boxed = PixelPets.state.box.map((p) => ({ id: p.id, mark: p.mark }));
    return { before, refused, swapped, after, boxed, n: PixelPets.state.party.length };
  });
  expect(report.before).toHaveLength(6);
  expect(report.refused).toBe(false);
  expect(report.n).toBe(6);
  expect(report.swapped).toBe(true);
  expect(report.after).toHaveLength(6);
  expect(report.after[0]).toEqual({ id: 'pbox', mark: 'beetle' });
  expect(report.boxed[0]).toEqual({ id: 'p0', mark: 'ember' });
  expect(report.after.map((p) => p.id)).not.toContain('p0');
});

test('box and release confirms are thumb buttons', async ({ page }) => {
  await openCol(page, boardSave());
  await page.locator('.party-slot[data-id="ptide"] [data-act="box"]').tap();
  await expect(page.locator('.party-slot[data-id="ptide"] .slot-confirm')).toContainText(/hunger pauses in the box/i);
  const confirmShort = await page.evaluate(() => [...document.querySelectorAll('.party-slot[data-id="ptide"] button')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.height < 43 || r.width < 43;
  }).map((b) => b.textContent));
  expect(confirmShort).toEqual([]);
  await page.locator('.party-slot[data-id="ptide"] [data-act="send"]').tap();
  await expect.poll(async () => page.evaluate(() => PixelPets.state.box[0] && PixelPets.state.box[0].id)).toBe('ptide');

  await page.locator('.party-slot[data-id="pember"] [data-act="move"]').tap();
  await page.locator('.party-slot[data-id="pember"] [data-act="down"]').tap();
  await expect.poll(async () => page.evaluate(() => PixelPets.state.party.map((p) => p.id))).toEqual(['pbloom', 'pember']);

  await page.locator('.box-row[data-id="pstone"] [data-act="release"]').tap();
  await page.locator('.box-row[data-id="pstone"] [data-act="yes"]').tap();
  const after = await page.evaluate(() => ({
    ids: PixelPets.state.party.concat(PixelPets.state.box).map((p) => p.id),
    caught: PixelPets.state.dex.caught['stone/0'],
    bag: PixelPets.state.bag.soft_berry || 0,
    cell: document.querySelector('#dexGrid [data-form="stone/0"]').tagName,
  }));
  expect(after.ids).not.toContain('pstone');
  expect(after.caught).toBe(true);
  expect(after.bag).toBe(1);
  expect(after.cell).toBe('BUTTON');

  await page.locator('.party-slot[data-id="pember"] .slot-main').tap();
  await expect(page.locator('#ovWalkling')).toBeVisible();
  await page.locator('#wlClose').tap();
  await expect(page.locator('#ovWalkling')).toBeHidden();
});

test('party actions stay labeled after the care timer', async ({ page }) => {
  await openCol(page, boardSave());
  await page.waitForFunction(() => document.querySelector('#scr-pet [data-act="feed"]').dataset.cd === '');
  const labels = await page.evaluate(() => ({
    move: document.querySelector('.party-slot[data-id="pember"] [data-act="move"]').textContent,
    box: document.querySelector('.party-slot[data-id="ptide"] [data-act="box"]').textContent,
    partner: document.querySelector('.party-slot[data-id="pbloom"] [data-act="partner"]').textContent,
    release: document.querySelector('.box-row[data-id="pstone"] [data-act="release"]').textContent,
    party: document.querySelector('.box-row[data-id="pstone"] [data-act="party"]').textContent,
  }));
  expect(labels).toEqual({ move: 'MOVE', box: 'TO WALKLING-BOX', partner: 'PARTNER', release: 'RELEASE', party: 'TO TEAM' });
  await page.locator('.party-slot[data-id="pember"] [data-act="move"]').tap();
  await expect(page.locator('.party-slot[data-id="pember"] [data-act="up"]')).toBeVisible();
  await expect(page.locator('.party-slot[data-id="pember"] [data-act="down"]')).toBeVisible();
});
