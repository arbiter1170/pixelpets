/* Extra QA for the party board, Walkling sheet, held items, and battle send-outs.
   Players never load this file. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

function pet(id, species, extra) {
  return Object.assign({
    id, species, stage: 0, xp: 10, bx: 64, hunger: 80, happy: 70, energy: 90,
    nick: null, origin: 'wild', moves: ['bump', 'flick_flame'], evoMoves: [],
  }, extra);
}

function saveWith(party, extra) {
  const save = starterSave();
  save.party = party;
  save.partnerId = party[0].id;
  save.dex.seen = {};
  save.dex.caught = {};
  party.concat(extra && extra.box || []).forEach((p) => {
    const f = p.species + '/' + p.stage;
    save.dex.seen[f] = true;
    save.dex.caught[f] = true;
  });
  save.flags['story.intro_seen'] = true;
  save.flags['story.starter_received'] = true;
  save.flags['story.starter_line'] = 'ember';
  return Object.assign(save, extra || {});
}

async function boot(page, save, search) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, search || '');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0]);
}

async function battleReady(page, save) {
  await boot(page, save, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.forceBattle === 'function');
  await page.evaluate(() => { PixelPets.battle.textMs = 0; });
}

test('journal counts and silhouettes stay on the WALKLINGS tab', async ({ page }) => {
  const save = saveWith([
    pet('pember', 'ember', { origin: 'starter' }),
  ], { dex: undefined });
  save.dex = {
    seen: { 'ember/0': true, 'volt/0': true },
    caught: { 'ember/0': true },
    legacy: [],
    hits: {},
  };
  await boot(page, save);
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('#partyBoard [data-slot="5"]');
  const grid = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('#dexGrid .cell')];
    const unmet = cells.filter((c) => c.dataset.state === 'unmet');
    return {
      n: cells.length,
      slots: document.querySelectorAll('#partyBoard [data-slot]').length,
      header: document.querySelector('#dexCount').textContent,
      joined: document.querySelector('[data-form="ember/0"]').dataset.state,
      met: document.querySelector('[data-form="volt/0"]').dataset.state,
      unmet: unmet.length,
      unmetButtons: unmet.filter((c) => c.tagName === 'BUTTON').length,
      unmetMark: unmet.every((c) => c.querySelector('.unk') && c.querySelector('.unk').textContent === '???'),
      locked: document.querySelector('#tabs').classList.contains('locked'),
    };
  });
  expect(grid.n).toBe(45);
  expect(grid.slots).toBe(6);
  expect(grid.header).toContain('Joined 1');
  expect(grid.header).toContain('Met 1');
  expect(grid.header).toContain('Out there 45');
  expect(grid.joined).toBe('joined');
  expect(grid.met).toBe('met');
  expect(grid.unmet).toBe(43);
  expect(grid.unmetButtons).toBe(0);
  expect(grid.unmetMark).toBe(true);
  expect(grid.locked).toBe(false);
  await shot(page, 'qa-journal');
});

test('deposit, withdraw, release, and a full-party partner swap keep the partner in the party', async ({ page }) => {
  const party = ['ember', 'tide', 'bloom', 'stone', 'volt', 'frost'].map((species, i) => pet('p' + i, species, { origin: i ? 'wild' : 'starter', keepsake: 'k' + i }));
  const save = saveWith(party, { box: [pet('pbox', 'beetle', { keepsake: 'boxy' })] });
  await boot(page, save, '?debug=1');
  const moved = await page.evaluate(() => {
    const out = {};
    out.badPartner = depositPet('p0');
    out.bench = makePartner('pbox');
    const s = PixelPets.state;
    out.partnerInParty = s.party.some((p) => p.id === s.partnerId);
    out.partner = s.partnerId;
    out.boxed = s.box.map((p) => ({ id: p.id, keepsake: p.keepsake }));
    out.partyIds = s.party.map((p) => p.id);
    const full = s.party.length === 6;
    out.full = full;
    out.refuse = withdrawPet(s.box[0].id, s.party.length);
    const slot = s.party.findIndex((p) => p.id === s.partnerId);
    out.oldPartner = s.partnerId;
    out.incoming = s.box[0] && s.box[0].id;
    out.swap = withdrawPet(out.incoming, slot);
    out.afterPartner = s.partnerId;
    out.afterParty = s.party.map((p) => p.id);
    out.boxIds = s.box.map((p) => p.id);
    out.keepsake = s.party.concat(s.box).every((p) => typeof p.keepsake === 'string');
    const spare = s.party.find((p) => p.id !== s.partnerId);
    out.released = spare ? releasePet(spare.id) : false;
    out.spareGone = spare ? !s.party.concat(s.box).some((p) => p.id === spare.id) : false;
    return out;
  });
  expect(moved.badPartner).toBe(false);
  expect(moved.partnerInParty).toBe(true);
  expect(moved.partner).toBe('pbox');
  expect(moved.full).toBe(true);
  expect(moved.refuse).toBe(false);
  expect(moved.swap).toBe(true);
  expect(moved.afterPartner).toBe(moved.incoming);
  expect(moved.afterParty).toContain(moved.afterPartner);
  expect(moved.boxIds).toContain(moved.oldPartner);
  expect(moved.boxIds).not.toContain(moved.afterPartner);
  expect(moved.keepsake).toBe(true);
  expect(moved.released).toBe(true);
  expect(moved.spareGone).toBe(true);
});

test('a full bag keeps the held item and the Walkling', async ({ page }) => {
  const save = saveWith([
    pet('pember', 'ember', { origin: 'starter' }),
    pet('pstone', 'stone', { held: 'soft_berry' }),
  ]);
  save.bag = { soft_berry: 10 };
  await boot(page, save);
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.locator('.party-slot[data-id="pstone"] [data-act="release"]').tap();
  await page.locator('.party-slot[data-id="pstone"] [data-act="yes"]').tap();
  const after = await page.evaluate(() => {
    const s = PixelPets.state;
    const still = s.party.find((p) => p.id === 'pstone');
    return { still: !!still, held: still && still.held, bag: s.bag.soft_berry, toast: document.querySelector('#toast').textContent };
  });
  expect(after.still).toBe(true);
  expect(after.held).toBe('soft_berry');
  expect(after.bag).toBe(10);
  expect(after.toast).toContain("Bag can't hold");
});

test('the sheet heals a boxed Walkling, refuses a full one, and renames', async ({ page }) => {
  const save = saveWith([
    pet('pember', 'ember', { origin: 'starter', nick: 'Pip' }),
  ], { box: [pet('pstone', 'stone', { hpNow: 6 })] });
  save.bag = { heal_snack: 2 };
  await boot(page, save);
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.locator('.box-row[data-id="pstone"] .slot-main').tap();
  await expect(page.locator('#ovWalkling')).toBeVisible();
  await expect(page.locator('#tabs')).toHaveClass(/locked/);
  await page.locator('#wlUse .wl-item button', { hasText: 'USE' }).click();
  const healed = await page.evaluate(() => {
    const p = PixelPets.state.box[0];
    return { hp: p.hpNow == null ? 'full' : p.hpNow, bag: PixelPets.state.bag.heal_snack || 0 };
  });
  expect(healed.bag).toBe(1);
  expect(healed.hp === 'full' || healed.hp > 6).toBe(true);

  await page.locator('#wlClose').click();
  await page.locator('.party-slot[data-id="pember"] .slot-main').tap();
  const why = page.locator('#wlUse .wl-why');
  await expect(why).toContainText(/full HP/i);
  const before = await page.evaluate(() => PixelPets.state.bag.heal_snack);
  await page.locator('#wlUse .wl-item button', { hasText: 'USE' }).click();
  expect(await page.evaluate(() => PixelPets.state.bag.heal_snack)).toBe(before);

  await page.locator('#wlNick').fill('');
  await page.locator('#wlNickSet').click();
  expect(await page.evaluate(() => PixelPets.state.party[0].nick)).toBe(null);
  const box = await page.evaluate(() => {
    const ov = document.querySelector('#ovWalkling .ov-inner');
    return { overflow: ov.scrollWidth > ov.clientWidth + 1, gear: !!document.querySelector('#wlExtras [data-call="dart"]') };
  });
  expect(box.overflow).toBe(false);
  expect(box.gear).toBe(true);
  await page.locator('#wlExtras [data-call="dart"]').click();
  expect(await page.evaluate(() => PixelPets.state.party[0].deploy.call)).toBe('dart');
  await shot(page, 'qa-sheet');
});

test('the bag will not use up a holdable item', async ({ page }) => {
  const save = saveWith([pet('pember', 'ember', { origin: 'starter' })]);
  save.bag = { soft_berry: 1, heal_snack: 1 };
  save.flags['story.side_pick_done'] = true;
  await boot(page, save);
  await page.evaluate(() => {
    const b = document.querySelector('#petBagBtn');
    if (b) b.hidden = false;
  });
  await page.locator('#petBagBtn').click();
  await expect(page.locator('#ovBag')).toBeVisible();
  const row = page.locator('#bagList .bag-row', { hasText: 'Soft Berry' });
  await expect(row).toContainText('(hold)');
  await expect(row.locator('button', { hasText: 'USE' })).toHaveCount(0);
  const left = await page.evaluate(() => {
    const r = useItem('soft_berry', PixelPets.state.party[0].id, 'field');
    return { ok: r.ok, bag: PixelPets.state.bag.soft_berry, held: PixelPets.state.party[0].held || null };
  });
  expect(left.ok).toBe(false);
  expect(left.bag).toBe(1);
  expect(left.held).toBe(null);
  await shot(page, 'qa-bag');
});

test('hold swaps back, and a boxed relief cannot lead', async ({ page }) => {
  const save = saveWith([
    pet('pember', 'ember', { origin: 'starter', energy: 0 }),
    pet('ptide', 'tide', { energy: 90 }),
  ], { box: [pet('pbox', 'bloom', { energy: 90, deploy: { call: 'dart', relief: true } })] });
  save.bag = { soft_berry: 1, bracer_band: 1 };
  await battleReady(page, save);
  const held = await page.evaluate(() => {
    const id = PixelPets.state.party[1].id;
    const a = holdItem(id, 'soft_berry');
    const b = holdItem(id, 'bracer_band');
    const s = PixelPets.state;
    return { a: a.ok, b: b.ok, held: s.party[1].held, berry: s.bag.soft_berry || 0, band: s.bag.bracer_band || 0 };
  });
  expect(held.a).toBe(true);
  expect(held.b).toBe(true);
  expect(held.held).toBe('bracer_band');
  expect(held.berry).toBe(1);
  expect(held.band).toBe(0);

  await page.evaluate(() => PixelPets.forceBattle('tide/0', 3));
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE');
  const lead = await page.evaluate(() => ({
    id: PixelPets.battle.me.petId,
    box: PixelPets.state.box.map((p) => p.id),
    deposit: depositPet('ptide'),
  }));
  expect(lead.id).toBe('ptide');
  expect(lead.box).toContain('pbox');
  expect(lead.deposit).toBe(false);
});

test('battle swap stays in the party, resets stages, and skips a boxed id', async ({ page }) => {
  const save = saveWith([
    pet('pember', 'ember', { origin: 'starter', held: 'bracer_band', deploy: { call: 'dart', line: 'Custom line' } }),
    pet('ptide', 'tide', { energy: 5, hpNow: 4 }),
  ], { box: [pet('pbox', 'bloom')] });
  await battleReady(page, save);
  await page.evaluate(() => PixelPets.forceBattle('stone/0', 3));
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE');
  const opened = await page.evaluate(() => ({
    id: PixelPets.battle.me.petId,
    spd: PixelPets.battle.me.stages.spd,
    log: PixelPets.battle.log.slice(),
  }));
  expect(opened.id).toBe('pember');
  expect(opened.spd).toBe(2);
  expect(opened.log.some((line) => line.includes('slips in ahead'))).toBe(true);
  expect(opened.log.some((line) => line === 'Custom line')).toBe(false);

  await page.locator('[data-bact="swap"]').click();
  const rows = await page.locator('#shList .sh-item').evaluateAll((els) => els.map((el) => ({
    text: el.textContent,
    disabled: el.disabled,
  })));
  expect(rows).toHaveLength(2);
  expect(rows.map((r) => r.text).join(' ')).not.toMatch(/Sproutbun/);
  const sleepy = rows.find((r) => r.text.includes('LOW NRG'));
  expect(sleepy && sleepy.disabled).toBe(false);

  await page.locator('#shCancel').click();
  await page.evaluate(() => {
    const q = PixelPets.state.party[1];
    q.hpNow = 0;
    q.faintUntil = Date.now() + 600000;
  });
  await page.locator('[data-bact="swap"]').click();
  const fainted = await page.locator('#shList .sh-item').evaluateAll((els) => els.map((el) => el.disabled));
  expect(fainted).toEqual([true, true]);
  await page.locator('#shCancel').click();

  const illegal = await page.evaluate(async () => {
    const before = PixelPets.battle.me.petId;
    await resolveTurn({ kind: 'swap', id: 'pbox' });
    return { before, after: PixelPets.battle.me.petId, state: PixelPets.battle.state };
  });
  expect(illegal.after).toBe(illegal.before);

  await page.evaluate(() => {
    const q = PixelPets.state.party[1];
    delete q.faintUntil;
    delete q.hpNow;
    q.energy = 90;
    q.deploy = { call: 'brace' };
    PixelPets.battle.state = 'CHOOSE';
  });
  await page.evaluate(async () => { await resolveTurn({ kind: 'swap', id: 'ptide' }); });
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || PixelPets.battle.result);
  const swapped = await page.evaluate(() => ({
    id: PixelPets.battle.me.petId,
    stages: PixelPets.battle.me.stages,
  }));
  expect(swapped.id).toBe('ptide');
  expect(swapped.stages).toEqual({ atk: 0, def: 1, spd: 0 });
  await shot(page, 'qa-swap');
});

test('greet and the kin ribbon widen only a wild battle, and a berry ignores a hit that is already under half', async ({ page }) => {
  const save = saveWith([
    pet('pember', 'ember', { origin: 'starter', happy: 60, held: 'soft_berry' }),
  ]);
  await battleReady(page, save);
  await page.evaluate(() => PixelPets.forceBattle('tide/0', 3));
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE');
  const widths = await page.evaluate(() => {
    const plain = befriendZoneWidth();
    PixelPets.state.party[0].deploy = { call: 'greet' };
    const greet = befriendZoneWidth();
    PixelPets.state.party[0].held = 'kin_ribbon';
    const both = befriendZoneWidth();
    const p = PixelPets.state.party[0];
    const max = maxHpOf(p);
    p.hpNow = Math.ceil(max / 2) - 1;
    p.held = 'soft_berry';
    const before = hpOf(p);
    const fired = applySoftBerry(p, before);
    return { plain, greet, both, fired, held: p.held, hp: hpOf(p) };
  });
  expect(widths.greet - widths.plain).toBeCloseTo(0.04, 5);
  expect(widths.both - widths.plain).toBeCloseTo(0.08, 5);
  expect(widths.fired).toBe(false);
  expect(widths.held).toBe('soft_berry');
  expect(widths.hp).toBeGreaterThan(0);

  const started = await page.evaluate(() => {
    PixelPets.battle.textMs = 0;
    PixelPets.battle.on = false;
    document.querySelector('#ovBattle').hidden = true;
    PixelPets.state.party[0].deploy = { call: 'greet' };
    PixelPets.state.party[0].held = 'kin_ribbon';
    return PixelPets.forceTrainer('rival1_rook');
  });
  expect(started).not.toBe(false);
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on && PixelPets.battle.kind === 'trainer' && PixelPets.battle.state === 'CHOOSE');
  const trainer = await page.evaluate(() => {
    const withGear = befriendZoneWidth();
    delete PixelPets.state.party[0].deploy;
    delete PixelPets.state.party[0].held;
    const plain = befriendZoneWidth();
    return { withGear, plain, kind: PixelPets.battle.kind };
  });
  expect(trainer.kind).toBe('trainer');
  expect(trainer.withGear).toBeCloseTo(trainer.plain, 5);
});
