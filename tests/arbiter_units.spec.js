/* ARBITER_UNITS Build A (D837-D847): the five attune lines, the hum meter and STILL, the Echoes, boss battles, and the
   journal row. No map places a boss yet (the branch ships with the next area), so battles start from debug hooks. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot } = require('./helpers');

trackErrors(test, expect);

const IDS = ['tallybat', 'dimlamp', 'filecrow', 'cordhound', 'humwisp'];
const bxFor = L => 4 * (L - 1) ** 2;

// A save whose partner is one attune Walkling at tier 0 (or any species/stage asked for).
function unitSave(species, { stage = 0, level = 30, hum, still, extra } = {}) {
  const s = starterSave();
  const p = { id: 'unit1', species, stage, xp: 0, bx: bxFor(level), hunger: 90, happy: 90, energy: 95, nick: null, origin: 'wild', moves: [], evoMoves: [] };
  if (hum != null) p.hum = hum;
  if (still) p.still = true;
  s.party = [p];
  if (extra) s.party.push(...extra);
  s.partnerId = 'unit1';
  s.flags['story.tutorial_done'] = true;
  return s;
}

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.forceBoss === 'function');
}
// Battles in these checks skip message delays and use a fixed roll: no crits, the middle of the damage range.
async function fastBattle(page) {
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on);
  await page.evaluate(() => { PixelPets.battle.textMs = 1; PixelPets.battle.rng = () => 0.5; });
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 15000 });
}

test('the five lines are attune bosses, stay out of the wild, and keep the journal at 45', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const info = await page.evaluate(ids => {
    const rows = ids.map(id => {
      const i = SPECIES.findIndex(s => s.id === id), sp = SPECIES[i];
      return { id, i, type: sp.type, attune: !!sp.attune, boss: !!sp.boss, lab: !!sp.labOnly, names: sp.stages.map(s => s.name),
        totals: [0, 1, 2].map(k => { const b = BASE_STATS[id + '/' + k]; return b.hp + b.atk + b.def + b.spd; }),
        odds: PixelPets.spawnOdds(['night', 'city', 'storm', 'meadow'], 'proto')[i] };
    });
    return { rows, lastId: PPSave.SPECIES_IDS[PPSave.SPECIES_IDS.length - 1], forms: PPSave.FORM_IDS.length, v: PixelPets.state.v };
  }, IDS);
  expect(info.rows.map(r => r.i)).toEqual([20, 21, 22, 23, 24]);
  for (const r of info.rows) {
    expect(r).toMatchObject({ type: 'SHADE', attune: true, boss: true, lab: true, odds: 0 });
    expect(new Set(r.names).size).toBe(1);            // one name across all three tiers
    expect(r.totals).toEqual([192, 256, 320]);
  }
  expect(info.lastId).toBe('humwisp');
  expect(info.forms).toBe(75);
  expect(info.v).toBe(2);

  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('#dexGrid .cell');
  const grid = await page.evaluate(() => ({
    header: document.querySelector('#dexCount').textContent,
    bossCells: document.querySelectorAll('#dexGrid [data-form^="tallybat/"]').length,
    row: document.querySelector('#dexBoss') ? document.querySelector('#dexBoss').hidden : null,
  }));
  expect(grid.header).toContain('Out there 57');
  expect(grid.bossCells).toBe(0);
  expect(grid.row).toBe(true);                         // hidden until the branch opens or one is met
});

test('hum raises the tier with no GROW UP, STILL stops it, and the save keeps both', async ({ page }) => {
  await installSave(page.context(), unitSave('tallybat'), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.showTab('pet'));
  const start = await page.evaluate(() => ({
    lab: document.querySelector('.ss-grow-l').textContent, grow: document.querySelector('#evolveBtn').hidden,
    hint: document.querySelector('#evoHint').textContent }));
  expect(start).toEqual({ lab: 'HUM', grow: true, hint: 'Quiet · HUM 0/40 to Humming' });

  expect(await page.evaluate(() => PixelPets.addHum(39))).toEqual({ got: 39, hum: 39, stage: 0 });
  expect(await page.evaluate(() => PixelPets.addHum(1))).toEqual({ got: 1, hum: 40, stage: 1 });
  // The tier move arrives through the grow-up move queue, with its own line.
  await page.waitForFunction(() => /hears something new in the hum/.test(document.querySelector('#ovSheet') ? document.querySelector('#ovSheet').textContent : ''), null, { timeout: 10000 });
  await shot(page, 'arbiter-tier-up');

  await page.evaluate(() => PixelPets.toggleStill());
  expect(await page.evaluate(() => PixelPets.addHum(30))).toEqual({ got: 0, hum: 40, stage: 1 });
  const stilled = await page.evaluate(() => document.querySelector('#evoHint').textContent);
  expect(stilled).toBe('Humming · kept still. HUM stays at 40.');
  await page.evaluate(() => PixelPets.toggleStill());
  expect(await page.evaluate(() => PixelPets.addHum(100))).toEqual({ got: 60, hum: 100, stage: 2 });

  // installSave re-installs the fixture on every load, so read what the game wrote and run it back through normalizeV2.
  await page.evaluate(() => PixelPets.toggleStill());
  const saved = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2')), s = PPSave.normalizeV2(raw) || raw, p = s.party[0];
    return { hum: p.hum, still: p.still, stage: p.stage, v: s.v };
  });
  expect(saved).toEqual({ hum: 100, still: true, stage: 2, v: 2 });
});

test('a non-attune Walkling cannot hold hum or still', async ({ page }) => {
  const s = starterSave(); s.party[0].hum = 50; s.party[0].still = true;
  await installSave(page.context(), s, { quietDay: true });
  await gotoDebug(page);
  const p = await page.evaluate(() => { const q = PixelPets.state.party[0]; return { hum: 'hum' in q, still: 'still' in q, grow: document.querySelector('.ss-grow-l').textContent }; });
  expect(p).toEqual({ hum: false, still: false, grow: 'GROW' });
});

test('a boss opens at Humming, refuses befriending, shifts at half HP, and joins at Quiet', async ({ page }) => {
  await installSave(page.context(), unitSave('ember', { stage: 2, level: 45 }), { quietDay: true });
  await gotoDebug(page);
  expect(await page.evaluate(() => PixelPets.forceBoss('tallybat', 28))).toBe(true);
  await fastBattle(page);
  const open = await page.evaluate(() => Object.assign(PixelPets.bossState(), { want: Math.round(statsAt('tallybat/1', 28).hp * 1.5), tint: document.querySelector('#ovBattle').classList.contains('boss') }));
  expect(open).toMatchObject({ boss: true, shifted: false, stage: 1, tint: true });
  expect(open.maxHp).toBe(open.want);

  await page.click('#btBefriendAct');
  await expect(page.locator('#btMsg')).toHaveText('It only hears the hum. Wait.');
  expect(await page.evaluate(() => document.querySelector('#btBef').hidden)).toBe(true);

  // Drop it under half, then play a turn: the shift runs at the end of that turn.
  // A non-damaging move, so the boss is still standing when the turn ends.
  await page.evaluate(() => PixelPets.setHp('foe', Math.floor(PixelPets.bossState().maxHp * 0.45)));
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
  await page.evaluate(() => { PixelPets.turnNow('stoke_up'); });
  await page.waitForFunction(() => PixelPets.bossState() && PixelPets.bossState().shifted, null, { timeout: 15000 });
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE', null, { timeout: 15000 });
  const shifted = await page.evaluate(() => Object.assign(PixelPets.bossState(), { log: PixelPets.battle.log.slice() }));
  expect(shifted.stage).toBe(2);
  expect(shifted.moves).toContain('census_dive');
  expect(shifted.log).toContain('The hum rises. Tallybat answers it.');
  expect(shifted.zone).toBeLessThanOrEqual(0.6 * 0.75 + 1e-9);
  await shot(page, 'arbiter-boss-shift');

  await page.evaluate(() => PixelPets.forceBefriend());
  await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.result === 'befriended');
  const joined = await page.evaluate(() => {
    const q = PixelPets.state.party.find(p => p.species === 'tallybat');
    return q && { stage: q.stage, hum: q.hum, flag: !!PixelPets.state.flags['story.ans_tallybat'], moves: q.moves };
  });
  expect(joined).toMatchObject({ stage: 0, hum: 0, flag: true });
  expect(joined.moves).not.toContain('census_dive');
});

test('a boss that is not befriended goes back to its post until the next day', async ({ page }) => {
  await installSave(page.context(), unitSave('ember', { stage: 2, level: 45 }), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.forceBoss('dimlamp', 30));
  await fastBattle(page);
  await page.evaluate(() => PixelPets.winBattle());
  await page.waitForFunction(() => PixelPets.battle.state === 'END');
  await page.click('#btOk');
  await page.waitForFunction(() => !PixelPets.battle.on);
  const after = await page.evaluate(() => ({ rest: PixelPets.state.flags['story.ans_dimlamp_rest'], stamp: !!PixelPets.state.flags['daily.ans_dimlamp'] }));
  expect(after).toEqual({ rest: true, stamp: true });
  await page.evaluate(() => { PixelPets.state.flags['daily.ans_dimlamp'] = '2000-01-01'; PixelPets.fadeTick(); });
  const rolled = await page.evaluate(() => ({ rest: 'story.ans_dimlamp_rest' in PixelPets.state.flags, stamp: 'daily.ans_dimlamp' in PixelPets.state.flags }));
  expect(rolled).toEqual({ rest: false, stamp: false });
});

test('Echoes: Carrier Hum caps boosts, Recount copies once, Live Wire, Filed Away and Glow Share', async ({ page }) => {
  // Carrier Hum and Recount, through the stage code.
  await installSave(page.context(), unitSave('humwisp', { level: 30 }), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.forceBattle('volt/0', 30));
  await fastBattle(page);
  const cap = await page.evaluate(() => PixelPets.stageNow('foe', 'atk', 2));
  expect(cap.foe.atk).toBe(1);
  expect(await page.evaluate(() => PixelPets.battle.log.some(l => /^Humwisp's Echo: Carrier Hum!$/.test(l)))).toBe(true);
  await page.evaluate(() => PixelPets.loseBattle());
});

test('Echo: Recount copies the first foe boost, once', async ({ page }) => {
  await installSave(page.context(), unitSave('tallybat', { level: 30 }), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.forceBattle('volt/0', 30));
  await fastBattle(page);
  const one = await page.evaluate(() => PixelPets.stageNow('foe', 'spd', 1));
  expect(one).toEqual({ me: { atk: 0, def: 0, spd: 1 }, foe: { atk: 0, def: 0, spd: 1 } });
  const two = await page.evaluate(() => PixelPets.stageNow('foe', 'spd', 1));
  expect(two.me.spd).toBe(1);
  expect(two.foe.spd).toBe(2);
});

test('Echo: Live Wire makes only the first VOLT hit stronger', async ({ page }) => {
  await installSave(page.context(), unitSave('cordhound', { level: 30 }), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.forceBattle('tide/2', 50));
  await fastBattle(page);
  const hits = await page.evaluate(async () => {
    const f = () => PixelPets.battle.foes[0].hp, out = [];
    for (let i = 0; i < 2; i++) { const a = f(); await PixelPets.moveNow('me', 'zap_tap'); out.push(a - f()); }
    return out;
  });
  expect(hits[0]).toBeGreaterThan(hits[1] * 1.3);
});

test('Echo: Filed Away softens a repeat hit and Glow Share mends the user', async ({ page }) => {
  await installSave(page.context(), unitSave('filecrow', { level: 40 }), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.forceBattle('volt/0', 12));
  await fastBattle(page);
  const taken = await page.evaluate(async () => {
    const hp = () => hpOf(PixelPets.state.party[0]), out = [];
    let a = hp(); await PixelPets.moveNow('foe', 'zap_tap'); out.push(a - hp());
    a = hp(); await PixelPets.moveNow('foe', 'zap_tap'); out.push(a - hp());
    return out;
  });
  expect(taken[1]).toBe(Math.max(1, Math.ceil(taken[0] * 0.75)));
  await page.evaluate(() => PixelPets.loseBattle());
});

test('Echo: Glow Share heals a sixth of the damage dealt', async ({ page }) => {
  await installSave(page.context(), unitSave('dimlamp', { level: 30 }), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.forceBattle('volt/0', 30));
  await fastBattle(page);
  const r = await page.evaluate(async () => {
    PixelPets.setHp('me', 10);
    const foe = PixelPets.battle.foes[0], before = foe.hp;
    await PixelPets.moveNow('me', 'gloom_poke');
    return { dealt: before - foe.hp, mine: hpOf(PixelPets.state.party[0]) };
  });
  expect(r.mine).toBe(10 + Math.ceil(r.dealt / 6));
});

test('the stats card shows the Echo and a STILL button for an attune Walkling only', async ({ page }) => {
  await installSave(page.context(), unitSave('filecrow', { hum: 12 }), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.openStats(PixelPets.state.partnerId));
  await page.waitForSelector('#scStill:not([hidden])');
  await expect(page.locator('.sc-echo')).toContainText('Filed Away');
  await expect(page.locator('#scGrow')).toHaveText('Quiet · HUM 12/40 to Humming');
  await page.click('#scStill');
  await expect(page.locator('#scStill')).toHaveText('LISTEN');
  const box = await page.locator('#scStill').boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  await shot(page, 'arbiter-stats-card');
});
