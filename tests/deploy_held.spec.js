/* Held items, accessories, and deploy fields (save stays v2). */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function pet(extra) {
  return Object.assign({
    stage: 0,
    xp: 10,
    bx: 64,
    hunger: 80,
    happy: 80,
    energy: 90,
    nick: null,
    origin: 'wild',
    moves: ['bump', 'stoke_up', 'flick_flame'],
    evoMoves: [],
  }, extra);
}

async function boot(page, save, search) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, search || '');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party.length > 0);
}

test('a v2 save without the new fields loads them absent @w1', async ({ page }) => {
  const save = starterSave();
  save.party[0].keepsake = 'pebble';
  await boot(page, save);
  const view = await page.evaluate(() => {
    const p = window.PixelPets.state.party[0];
    return { v: window.PixelPets.state.v, keys: Object.keys(p), keepsake: p.keepsake, held: p.held, accessory: p.accessory, deploy: p.deploy };
  });
  expect(view.v).toBe(2);
  expect(view.keepsake).toBe('pebble');
  expect(view.keys).not.toContain('held');
  expect(view.keys).not.toContain('accessory');
  expect(view.keys).not.toContain('deploy');
  expect(view.held).toBeUndefined();
  expect(view.accessory).toBeUndefined();
  expect(view.deploy).toBeUndefined();
});

test('invalid held, accessory, and deploy values are dropped and only one relief remains @w1', async ({ page }) => {
  const save = starterSave();
  save.party = [
    pet({
      id: 'petsmoke1', species: 'ember', origin: 'starter', keepsake: 'pebble',
      held: 'heal_snack', accessory: 'cape',
      deploy: { call: 'nope', opener: 'not_a_move', line: '  <hi>  ', relief: true, bonus: 1 },
    }),
    pet({
      id: 'petsmoke2', species: 'tide',
      held: 'soft_berry', accessory: 'ribbon',
      deploy: { call: 'dart', opener: 'bump', relief: true, note: 'a'.repeat(45) + '<>{}' },
    }),
  ];
  save.partnerId = 'petsmoke1';
  save.box = [
    pet({
      id: 'petsmoke3', species: 'bloom',
      deploy: { call: 'greet', relief: true },
    }),
  ];
  await boot(page, save);
  const view = await page.evaluate(() => {
    const s = window.PixelPets.state;
    return { v: s.v, party: s.party, box: s.box };
  });
  expect(view.v).toBe(2);
  expect(view.party[0].keepsake).toBe('pebble');
  expect(view.party[0].held).toBeUndefined();
  expect(view.party[0].accessory).toBeUndefined();
  expect(view.party[0].deploy).toEqual({ line: 'hi', relief: true });
  expect(view.party[1].held).toBe('soft_berry');
  expect(view.party[1].accessory).toBe('ribbon');
  expect(view.party[1].deploy.call).toBe('dart');
  expect(view.party[1].deploy.opener).toBe('bump');
  expect(view.party[1].deploy.relief).toBeUndefined();
  expect(view.party[1].deploy.note).toBe('a'.repeat(40));
  expect(view.box[0].deploy).toEqual({ call: 'greet' });
});

test('holdItem moves one from the bag and unhold at the cap leaves it held @w1', async ({ page }) => {
  const save = starterSave();
  save.bag = { soft_berry: 1 };
  await boot(page, save, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.holdItem === 'function');
  const held = await page.evaluate(() => {
    const id = PixelPets.state.party[0].id;
    const refused = PixelPets.useItem('soft_berry', id, 'field');
    const afterUse = PixelPets.state.bag.soft_berry || 0;
    const msg = holdItem(id, 'soft_berry');
    const s = PixelPets.state;
    return { refused, afterUse, msg, held: s.party[0].held, bag: s.bag.soft_berry || 0 };
  });
  expect(held.refused.ok).toBe(false);
  expect(held.afterUse).toBe(1);
  expect(held.msg.ok).toBe(true);
  expect(held.held).toBe('soft_berry');
  expect(held.bag).toBe(0);

  const back = await page.evaluate(() => {
    const s = PixelPets.state;
    s.bag.soft_berry = 10;
    const msg = unholdItem(s.party[0].id);
    return { msg, held: s.party[0].held, bag: s.bag.soft_berry };
  });
  expect(back.msg.ok).toBe(false);
  expect(back.msg.msg).toBeTruthy();
  expect(back.held).toBe('soft_berry');
  expect(back.bag).toBe(10);
});

test('GEAR sets call, relief, accessory, opener, and note @w1', async ({ page }) => {
  const save = starterSave();
  save.bag = { soft_berry: 1 };
  save.party.push(pet({ id: 'petsmoke2', species: 'tide', moves: ['bump', 'ripple_jab'] }));
  await boot(page, save, '?debug=1');
  await page.evaluate(() => openWalklingSheet('petsmoke2'));
  await expect(page.locator('#ovWalkling')).toBeVisible();
  await expect(page.locator('#wlExtras')).toBeVisible();
  await page.locator('#wlExtras [data-call="dart"]').click();
  await page.locator('#wlExtras [data-gear="relief"]').click();
  await page.locator('#wlExtras [data-acc="bell"]').click();
  await page.locator('#wlExtras [data-gear="opener"]').selectOption('bump');
  const note = page.locator('#wlExtras [data-gear="note"]');
  await note.fill('hello<>friend');
  await note.blur();
  await page.locator('[data-hold="soft_berry"]').click();
  await page.waitForFunction(() => {
    const p = window.PixelPets.state.party[1];
    return p && p.held === 'soft_berry' && p.deploy && p.deploy.call === 'dart' && p.deploy.relief === true;
  });
  const view = await page.evaluate(() => {
    const s = window.PixelPets.state;
    return {
      lead: { deploy: s.party[0].deploy || null, accessory: s.party[0].accessory || null },
      pet: s.party[1],
      bag: s.bag.soft_berry || 0,
    };
  });
  expect(view.pet.deploy.call).toBe('dart');
  expect(view.pet.deploy.relief).toBe(true);
  expect(view.pet.deploy.opener).toBe('bump');
  expect(view.pet.deploy.note).toBe('hellofriend');
  expect(view.pet.accessory).toBe('bell');
  expect(view.pet.held).toBe('soft_berry');
  expect(view.bag).toBe(0);
  expect(view.lead.deploy == null || view.lead.deploy.relief !== true).toBe(true);
});

test('relief leads, a bracer doubles Dart, and the swap sheet stays the party @w1', async ({ page }) => {
  const save = starterSave();
  save.party.push(pet({ id: 'petsmoke2', species: 'tide' }));
  save.box = [pet({ id: 'petsmoke3', species: 'bloom', energy: 90 })];
  await boot(page, save, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.forceBattle === 'function');
  await page.evaluate(() => {
    const s = PixelPets.state;
    s.party[0].energy = 0;
    s.party[1].energy = 90;
    s.party[1].held = 'bracer_band';
    s.party[1].deploy = { call: 'dart', relief: true, note: 'ready', line: 'Onward Pip' };
    PixelPets.battle.textMs = 0;
    PixelPets.forceBattle('tide/0', 3);
  });
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE');
  const lead = await page.evaluate(() => ({
    id: PixelPets.battle.me.petId,
    stages: PixelPets.battle.me.stages,
    log: PixelPets.battle.log.slice(),
  }));
  expect(lead.id).toBe('petsmoke2');
  expect(lead.stages).toEqual({ atk: 0, def: 0, spd: 2 });
  expect(lead.log.some((line) => line.includes('slips in ahead'))).toBe(true);
  expect(lead.log.some((line) => line.includes('Onward Pip'))).toBe(false);

  await page.locator('[data-bact="swap"]').click();
  await expect(page.locator('#ovSheet')).toBeVisible();
  await expect(page.locator('#shCancel')).toBeVisible();
  const rows = await page.locator('#shList .sh-item').evaluateAll((els) => els.map((el) => ({
    label: el.querySelector('.sh-l').textContent,
    sub: el.querySelector('.sh-s').textContent,
  })));
  expect(rows).toHaveLength(2);
  expect(rows.map((r) => r.label).join(' ')).not.toContain('Sproutbun');
  expect(rows.map((r) => r.sub).join(' | ')).toContain('Dart');
  expect(rows.map((r) => r.sub).join(' | ')).toContain('Bracer Band');
  expect(rows.map((r) => r.sub).join(' | ')).toContain('ready');
});

test('a custom call line, opener, and Soft Berry heal in battle @w1', async ({ page }) => {
  const save = starterSave();
  save.party[0].moves = ['bump', 'stoke_up', 'flick_flame'];
  save.party[0].evoMoves = [];
  save.party[0].bx = 64;
  save.party[0].held = 'soft_berry';
  save.party[0].deploy = { call: 'charge', line: 'Hello there', opener: 'stoke_up' };
  await boot(page, save, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.forceBattle === 'function');
  await page.evaluate(() => {
    PixelPets.battle.textMs = 0;
    PixelPets.forceBattle('tide/0', 2);
  });
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.state === 'CHOOSE');
  const entrance = await page.evaluate(() => ({
    stages: PixelPets.battle.me.stages,
    log: PixelPets.battle.log.slice(),
  }));
  expect(entrance.stages.atk).toBe(1);
  expect(entrance.stages.def).toBe(0);
  expect(entrance.stages.spd).toBe(0);
  expect(entrance.log.some((line) => line === 'Hello there')).toBe(true);
  expect(entrance.log.some((line) => line.includes('rushes in'))).toBe(false);

  await page.locator('[data-bact="fight"]').click();
  const first = page.locator('#btMoves button').first();
  await expect(first).toHaveAttribute('data-move', 'stoke_up');
  await expect(first).toHaveClass(/mv-open/);

  const plan = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    const max = maxHpOf(p);
    const start = Math.ceil(max / 2);
    MOVES.bump.power = 1;
    const foe = PixelPets.battle.foes[0];
    foe.moves = [{ id: 'bump', uses: 20 }];
    foe.hp = foe.maxHp = 999;
    PixelPets.battle.foePlan = { move: 'bump' };
    PixelPets.battle.rng = () => 0.5;
    PixelPets.setHp('me', start);
    return { max, start, heal: Math.ceil(0.25 * max) };
  });
  await page.locator('#btMoves button[data-move="stoke_up"]').click();
  await page.waitForFunction(() => {
    const B = PixelPets.battle;
    return B.turn > 0 && (B.state === 'CHOOSE' || B.result);
  });
  const after = await page.evaluate(() => {
    const p = PixelPets.state.party[0];
    return { held: p.held, hp: hpOf(p), log: PixelPets.battle.log.slice() };
  });
  expect(after.held).toBeUndefined();
  expect(after.log.some((line) => line.includes('Soft Berry'))).toBe(true);
  expect(after.hp).toBe(plan.start - 1 + plan.heal);
});
