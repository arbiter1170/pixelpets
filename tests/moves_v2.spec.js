/* MOVES_V2 section 12. Players never load this file.
   Heavy checks run at 390. The damage number check (test 20) runs at every width. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');
const { ensureEmulator, releaseEmulator, EMU_PORTS, emuQuery } = require('./emu_shared');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

trackErrors(test, expect);

const NEW = ['foxfire_flick','droplet_dash','burrow_bounce','hilltop_huff','neon_zip','chill_nibble','puff_pirouette','mote_blink','pomme_bonk','loam_tunnel','clink_pinch','wick_flutter','vane_spin','doze_drift','ping_pulse','seed_fetch','basking_lash','spray_slide','hush_glide','lichen_lob','coal_nudge','brook_bop','clover_swat','gravel_skid','fizz_jolt','hoarfrost_tap','dandelion_dart','gloomstep','smoulder_stare','tidepool_rest','burr_tangle','whetstone','circuit_hum','frost_coat','dander_drift','dusk_shroud'];
const bx = L => 4 * (L - 1) * (L - 1);

function baseSave() {
  const s = starterSave();
  s.settings.effects = 'full';
  s.settings.textSpeed = 'fast';
  return s;
}
async function boot(page, save, search) {
  await installSave(page.context(), save || baseSave(), { quietDay: true });
  await gotoGame(page, search || '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
}
async function befriend(page) {
  await page.locator('[data-bact="befriend"]').click();
  await page.waitForFunction(() => PixelPets.battle.panel === 'bef');
  await page.evaluate(() => {
    PixelPets.enc.zone = [0, 1];
    PixelPets.enc.mark = 0.5;
    PixelPets.enc.open = true;
  });
  await page.locator('#encGo').click();
  await page.waitForFunction(() => PixelPets.battle.panel === 'end');
}
async function openWild(page, form, level) {
  await page.evaluate(({ form, level }) => {
    PixelPets.battle.textMs = 0;
    PixelPets.battle.animMs = 0;
    PixelPets.showTab('walk');
    PixelPets.healTeam();
    return PixelPets.forceBattle(form, level);
  }, { form, level });
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
}
function petRow(o) {
  const stage = o.stage || 0;
  return {
    id: o.id, species: o.species, stage, nick: null, origin: 'wild',
    xp: 0, bx: bx(o.level), hunger: 80, happy: 80, energy: 90, met: 1700000000000,
    moves: o.moves.slice(), evoMoves: stage === 0 ? [] : (stage === 1 ? [1] : [1, 2]),
  };
}

test('1 start sets, signatures and one new move per level', async ({ page }) => {
  await boot(page);
  const bad = await page.evaluate((ids) => {
    const moves = PixelPets.moves();
    const problems = [];
    ids.forEach((id) => { if (!moves[id]) problems.push('missing ' + id); });
    const lines = PixelPets.learnset('ember/0').length ? null : [];
    const seen = new Set();
    Object.keys(moves).forEach(() => {});
    const forms = [];
    for (let i = 0; i < 40; i++) {
      const row = PixelPets.learnset('ember/' + i);
      if (i === 0 && row.length) forms.push('ember');
    }
    const names = ['ember','tide','bloom','stone','volt','frost','gust','shade','beetle','mole','crab','moth','vane','dormouse','byte','fetch','skink','otter','owl','snail'];
    names.forEach((line) => {
      for (let st = 0; st < 3; st++) {
        const form = line + '/' + st;
        const known = PixelPets.learnset(form);
        if (!known.length) continue;
        const byLv = {};
        known.forEach((e) => { if (e.lv >= 2) (byLv[e.lv] = byLv[e.lv] || []).push(e.id); });
        Object.keys(byLv).forEach((lv) => { if (byLv[lv].length > 1) problems.push(form + ' lv ' + lv + ' has ' + byLv[lv].join(',')); });
        for (let L = 1; L <= 50; L++) {
          const m = PixelPets.defaultMoves(form, L);
          const sig = PixelPets.defaultMoves(line + '/0', 1)[0];
          if (m.length < 3 || m.length > 4) problems.push(form + ' L' + L + ' len ' + m.length);
          if (new Set(m).size !== m.length) problems.push(form + ' L' + L + ' dup');
          if (m.indexOf(sig) < 0) problems.push(form + ' L' + L + ' no sig');
          if (st === 0 && L <= 8 && m.length !== 3) problems.push(form + ' L' + L + ' stage0 ' + m.join(','));
          m.forEach((id) => { if (!moves[id]) problems.push('unknown ' + id); });
        }
      }
      seen.add(line);
    });
    if (lines) problems.push('learnset');
    return problems.slice(0, 12);
  }, NEW);
  expect(bad).toEqual([]);
});

test('2 starter FIGHT menu is 3 moves and every button is at least 44 px', async ({ page }) => {
  await boot(page);
  const moves = await page.evaluate(() => PixelPets.state.party[0].moves.slice());
  expect(moves.length).toBe(3);
  expect(moves[0]).toBe('foxfire_flick');
  await openWild(page, 'bloom/0', 3);
  await page.locator('[data-bact="fight"]').click();
  const box = page.locator('#btMoves button');
  await expect(box).toHaveCount(4);
  const info = await page.evaluate(() => [...document.querySelectorAll('#btMoves button')].map((b) => ({
    name: b.querySelector('.mv-name') ? b.querySelector('.mv-name').textContent : b.textContent,
    on: !b.disabled, h: b.getBoundingClientRect().height, sig: b.classList.contains('mv-sig'),
  })));
  expect(info.filter((b) => b.on).map((b) => b.name)).toEqual(['Foxfire Flick', 'Flick Flame', 'Stoke Up']);
  expect(info[3].name).toBe('-');
  expect(info[3].on).toBe(false);
  info.forEach((b) => expect(b.h).toBeGreaterThanOrEqual(44));
  expect(info[0].sig).toBe(true);
  const w = page.viewportSize().width;
  if (w === 390 || w === 320) {
    await page.screenshot({ path: path.join(artifactsDir('moves-v2'), 'fight-3-' + w + '.png') });
  }
});

test('3 a wild Lv2 keeps its start set when befriended', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'gust/0', 2);
  const foe = await page.evaluate(() => PixelPets.battle.foes[0].moves.map((m) => m.id));
  expect(foe).toEqual(await page.evaluate(() => PixelPets.defaultMoves('gust/0', 2)));
  await befriend(page);
  await page.locator('#btOk').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
  const got = await page.evaluate(() => {
    const p = PixelPets.state.party.concat(PixelPets.state.box).find((q) => q.species === 'gust' && q.origin === 'wild');
    return p && p.moves.slice();
  });
  expect(got).toEqual(foe.filter((id) => id !== 'wobble'));
});

test('4 old saves top up, a second load is the same, and v stays 2', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  const rows = [
    ['p1ember01', 'ember', 0, 5, ['bump', 'stoke_up', 'flick_flame'], ['bump', 'stoke_up', 'flick_flame', 'foxfire_flick'], false],
    ['p2gust001', 'gust', 0, 2, ['bump'], ['bump', 'puff_pirouette', 'puff_shot'], false],
    ['p3owl0001', 'owl', 0, 4, ['bump', 'night_veil'], ['bump', 'night_veil', 'hush_glide'], false],
    ['p4beetle1', 'beetle', 0, 3, ['bump', 'brace_rock'], ['bump', 'brace_rock', 'pomme_bonk'], false],
    ['p5bloom01', 'bloom', 0, 9, ['bump', 'sap_sip', 'seed_toss'], ['bump', 'sap_sip', 'seed_toss', 'burrow_bounce'], false],
    ['p6tide001', 'tide', 1, 14, ['ripple_jab', 'undertow', 'tumble_charge', 'puddle_stomp'], ['ripple_jab', 'undertow', 'tumble_charge', 'puddle_stomp'], true],
    ['p7stone01', 'stone', 2, 30, ['bump'], ['bump', 'hilltop_huff', 'sleet_pelt'], false],
    ['p8fetch01', 'fetch', 1, 18, ['sap_sip', 'seed_toss', 'fetch_dash'], ['sap_sip', 'seed_toss', 'fetch_dash', 'seed_fetch'], false],
    ['p9byte001', 'byte', 0, 3, ['bump', 'screen_glow'], ['bump', 'screen_glow', 'ping_pulse'], false],
  ];
  const s = baseSave();
  s.party = [petRow({ id: 'petsmoke1', species: 'ember', stage: 0, level: 5, moves: ['foxfire_flick', 'flick_flame', 'stoke_up'] })];
  s.box = rows.map((r) => petRow({ id: r[0], species: r[1], stage: r[2], level: r[3], moves: r[4] }));
  s.box.push(petRow({ id: 'punknown1', species: 'ember', stage: 0, level: 5, moves: ['not_a_real_move'] }));
  const day = new Date();
  const quiet = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0');
  s.flags['daily.hello'] = quiet;
  s.flags['daily.warm_bowl'] = quiet;
  await boot(page, s);
  const first = await page.evaluate(() => {
    PPSave.writeV2(PixelPets.state);
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    const byId = {};
    raw.box.concat(raw.party).forEach((p) => { byId[p.id] = p.moves.slice(); });
    return { v: raw.v, byId, flags: Object.keys(raw.flags).filter((k) => k.indexOf('sig_offer.') === 0) };
  });
  expect(first.v).toBe(2);
  expect(first.flags).toEqual([]);
  rows.forEach((r) => expect(first.byId[r[0]], r[0]).toEqual(r[5]));
  const refilled = first.byId.punknown1;
  expect(refilled).toEqual(await page.evaluate(() => PixelPets.defaultMoves('ember/0', 5)));
  // The boot script writes the fixture on every navigation. Put the written save back so the second load is that disk image.
  const disk = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.addInitScript((raw) => { localStorage.setItem('pixelpets.save.v2', raw); }, disk);
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  const second = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    const byId = {};
    raw.box.concat(raw.party).forEach((p) => { byId[p.id] = p.moves.slice(); });
    const keys = (o, pfx, out) => {
      if (!o || typeof o !== 'object') return;
      Object.keys(o).forEach((k) => { out.push(pfx + k); if (o[k] && typeof o[k] === 'object') keys(o[k], pfx + k + '.', out); });
    };
    const out = []; keys(raw, '', out);
    return { v: raw.v, byId, keys: out.sort() };
  });
  expect(second.v).toBe(2);
  expect(second.byId).toEqual(first.byId);
  const petKeys = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return raw.party.concat(raw.box).map((p) => Object.keys(p).sort());
  });
  const allow = ['bx', 'energy', 'evoMoves', 'happy', 'hunger', 'id', 'met', 'moves', 'nick', 'origin', 'species', 'stage', 'xp'];
  petKeys.forEach((keys) => expect(keys.filter((k) => allow.indexOf(k) < 0)).toEqual([]));
  expect(second.keys.filter((k) => k.indexOf('sig_offer') >= 0)).toEqual([]);
});

test('5 a free slot learns the rider and a full set can skip it', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  const s = baseSave();
  s.party[0].bx = bx(8);
  s.party[0].moves = ['foxfire_flick', 'flick_flame', 'stoke_up'];
  s.party[0].evoMoves = [];
  await boot(page, s);
  await page.evaluate(() => PixelPets.giveBx(4 * 64 - 4 * 49, true));
  await page.waitForFunction(() => PixelPets.state.party[0].moves.indexOf('coal_nudge') >= 0);
  await expect(page.locator('#shTitle')).toContainText('picked up');
  await expect(page.locator('#shTitle')).toContainText('Coal Nudge');
  expect(await page.locator('#shList button', { hasText: 'Skip it' }).count()).toBe(0);
  await page.locator('#shList button', { hasText: 'OK' }).click();
  await expect(page.locator('#ovSheet')).toBeHidden();
  expect(await page.evaluate(() => PixelPets.state.party[0].moves.slice())).toEqual(['foxfire_flick', 'flick_flame', 'stoke_up', 'coal_nudge']);

  const full = baseSave();
  full.party[0].id = 'petfull001';
  full.partnerId = 'petfull001';
  full.party[0].bx = bx(8);
  full.party[0].moves = ['foxfire_flick', 'flick_flame', 'stoke_up', 'bump'];
  full.party[0].evoMoves = [];
  await boot(page, full);
  await page.evaluate(() => PixelPets.giveBx(4 * 64 - 4 * 49, true));
  await expect(page.locator('#ovSheet')).toBeVisible();
  const labels = await page.locator('#shList button').allTextContents();
  expect(labels.join('\n')).not.toContain('Foxfire Flick');
  expect(labels.some((t) => t.indexOf('Skip it') >= 0)).toBe(true);
  await page.locator('#shList button', { hasText: 'Skip it' }).click();
  await expect(page.locator('#shTitle')).toContainText("didn't pick up");
  await page.locator('#shList button', { hasText: 'OK' }).click();
  await expect(page.locator('#ovSheet')).toBeHidden();
  expect(await page.evaluate(() => PixelPets.state.party[0].moves.slice())).toEqual(['foxfire_flick', 'flick_flame', 'stoke_up', 'bump']);
});

test('6 wild signature picks stay in band and match foes prefer their best move', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'gust/0', 4);
  const share = await page.evaluate(() => {
    const b = PixelPets.battle;
    b.foes[0].acted = true;
    let s = 7 >>> 0, n = 0;
    for (let i = 0; i < 200; i++) {
      b.rng = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s >>> 8) / 16777216; };
      const pick = PixelPets.aiPick();
      if (pick && pick.move === 'puff_pirouette') n++;
    }
    return n / 200;
  });
  expect(share).toBeGreaterThanOrEqual(0.35);
  expect(share).toBeLessThanOrEqual(0.7);
  await page.evaluate(() => PixelPets.battle.close());
  await page.waitForFunction(() => !PixelPets.battle.on);
  expect(await page.evaluate(() => PixelPets.forceTrainer('route1_pia'))).toBe(true);
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
  const prefer = await page.evaluate(() => {
    const b = PixelPets.battle;
    b.foes[0].acted = true;
    b.rng = () => 0;
    const best = PixelPets.aiPick().move;
    let same = 0;
    for (let i = 0; i < 40; i++) {
      let n = 0;
      b.rng = () => (n++ === 0 ? 0 : 0.2);
      if (PixelPets.aiPick().move === best) same++;
    }
    return { best, same };
  });
  expect(prefer.same).toBe(40);
});

test('7 FULL pushes the go and the hit, CALM only the mark, OFF neither', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  async function once(effects) {
    const s = baseSave();
    s.settings.effects = effects;
    await boot(page, s);
    await openWild(page, 'bloom/0', 4);
    await page.evaluate((effects) => {
      const b = PixelPets.battle;
      PixelPets.state.settings.effects = effects;
      b.animMs = null;
      b.textMs = 0;
      b.rng = () => 0.4;
      b.foePlan = { move: 'sap_sip' };
      b.fxLog = [];
      PixelPets.setHp('foe', 999);
    }, effects);
    const t0 = Date.now();
    await page.locator('[data-bact="fight"]').click();
    await page.locator('#btMoves button[data-move="foxfire_flick"]').click();
    await page.waitForFunction(() => PixelPets.battle.state !== 'CHOOSE');
    await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
    const dt = Date.now() - t0;
    const log = await page.evaluate(() => PixelPets.battle.fxLog.slice());
    await page.evaluate(() => PixelPets.battle.close());
    await page.waitForFunction(() => !PixelPets.battle.on);
    return { dt, log };
  }
  const full = await once('full');
  expect(full.log.indexOf('mvGo')).toBeGreaterThanOrEqual(0);
  expect(full.log.indexOf('mvHit')).toBeGreaterThan(full.log.indexOf('mvGo'));
  expect(full.dt).toBeLessThanOrEqual(700);
  const calm = await once('calm');
  expect(calm.log).toContain('mvMark');
  expect(calm.log).not.toContain('mvGo');
  expect(calm.log).not.toContain('mvHit');
  expect(calm.dt).toBeLessThanOrEqual(400);
  const off = await once('off');
  expect(off.log).not.toContain('mvGo');
  expect(off.log).not.toContain('mvHit');
  expect(off.log).not.toContain('mvMark');
  expect(off.dt).toBeLessThanOrEqual(250);
});

test('10 seeded turns keep the same log and rolls as the pinned fixture', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  test.setTimeout(180000);
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'moves_v2_parity.json'), 'utf8'));
  await boot(page);
  for (const row of fixture.rows) {
    await page.evaluate(() => {
      PixelPets.battle.textMs = 0;
      PixelPets.battle.animMs = 0;
      PixelPets.showTab('walk');
      PixelPets.healTeam();
      const p = PixelPets.state.party[0];
      p.energy = 90; p.hunger = 80; p.happy = 60; p.xp = 10; p.bx = 64;
      delete p.hpNow; delete p.faintUntil;
      PixelPets.forceBattle('tide/0', 8);
    });
    await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
    await page.evaluate((seed) => {
      const b = PixelPets.battle;
      b.log = [];
      window.__rolls = [];
      let s = seed >>> 0;
      b.rng = () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const v = (s >>> 8) / 16777216;
        window.__rolls.push(Math.round(v * 1e6) / 1e6);
        return v;
      };
      PixelPets.setMoves(['bump']);
      b.foes[0].moves = [{ id: 'bump', uses: 40 }];
    }, row.seed);
    for (let n = 0; n < 4; n++) {
      const alive = await page.evaluate(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE');
      if (!alive) break;
      await page.evaluate(() => {
        const b = PixelPets.battle;
        b.foePlan = { move: 'bump' };
        b.foes[0].moves = [{ id: 'bump', uses: 40 }];
        PixelPets.setMoves(['bump']);
        document.querySelector('[data-bact="fight"]').click();
        const btn = [...document.querySelectorAll('#btMoves button')].find((el) => el.dataset.move === 'bump');
        btn.click();
      });
      await page.waitForFunction(() => !PixelPets.battle.on || PixelPets.battle.state === 'CHOOSE' || PixelPets.battle.panel === 'end');
    }
    const got = await page.evaluate(() => ({
      log: PixelPets.battle.log.slice(),
      rolls: window.__rolls.slice(),
      result: PixelPets.battle.result,
      on: PixelPets.battle.on,
    }));
    expect(got.log, 'seed ' + row.seed).toEqual(row.log);
    expect(got.rolls, 'seed ' + row.seed).toEqual(row.rolls);
    expect(got.result).toBe(row.result);
    if (got.on) await page.evaluate(() => PixelPets.battle.close());
    await page.waitForFunction(() => !PixelPets.battle.on);
    for (let i = 0; i < 4; i++) {
      if (!(await page.locator('#ovSheet').isVisible())) break;
      const skip = page.locator('#shList button', { hasText: 'Skip' });
      if (await skip.count()) await skip.first().click();
      else await page.locator('#shList button').first().click();
    }
  }
});

test('11 one white frame per hit and 334 ms between onsets', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'bloom/0', 5);
  await page.evaluate(() => {
    const b = PixelPets.battle;
    b.animMs = null; b.textMs = 0; b.whites = []; b.foePlan = { move: 'sap_sip' };
  });
  await page.locator('[data-bact="fight"]').click();
  await expect(page.locator('#btFight')).toBeVisible();
  await page.evaluate(() => {
    const b = PixelPets.battle;
    b.rng = () => 0.2;
    b.foePlan = { move: 'sap_sip' };
    const f = b.foes && b.foes[0];
    if (f) { f.hp = 400; f.maxHp = 400; }
  });
  await page.locator('#btMoves button[data-move="foxfire_flick"]').click();
  await page.waitForFunction(() => PixelPets.battle.state !== 'CHOOSE');
  const samples = [];
  for (let i = 0; i < 80; i++) {
    samples.push(await page.evaluate(() => {
      const b = PixelPets.battle, v = b.view || {};
      return { white: !!v.white, t: v.t || 0 };
    }));
    await page.waitForTimeout(10);
  }
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on);
  const whites = await page.evaluate(() => (PixelPets.battle.whites || []).map((w) => ({ t0: w.t0, until: w.until })));
  expect(whites.length).toBeGreaterThanOrEqual(1);
  expect(whites.length).toBeLessThanOrEqual(2);
  for (let i = 1; i < whites.length; i++) expect(whites[i].t0 - whites[i - 1].t0).toBeGreaterThanOrEqual(334);
  whites.forEach((w) => expect(w.until - w.t0).toBeLessThanOrEqual(80));
  let flashes = 0;
  samples.forEach((s) => { if (s.white) flashes++; });
  expect(flashes).toBeLessThan(30);
});

test.describe('12 reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the canvas stays put and the tint only falls @w1', async ({ page }) => {
    const s = baseSave();
    s.settings.effects = 'full';
    await boot(page, s);
    await openWild(page, 'bloom/0', 4);
    await page.evaluate(() => { PixelPets.battle.animMs = null; PixelPets.battle.textMs = 0; PixelPets.battle.foePlan = { move: 'sap_sip' }; });
    await page.locator('[data-bact="fight"]').click();
    await page.locator('#btMoves button[data-move="foxfire_flick"]').click();
    let prev = -1, down = true, fell = false, moved = false;
    for (let i = 0; i < 25; i++) {
      const v = await page.evaluate(() => {
        const view = PixelPets.battle.view || { shakeX: 0, shakeY: 0, meX: 0, foeX: 0, meRest: 0, foeRest: 0, tint: 0 };
        return view;
      });
      if (v.shakeX || v.shakeY || v.meX !== v.meRest || v.foeX !== v.foeRest) moved = true;
      if (prev >= 0 && v.tint > prev + 0.02 && fell) down = false;
      if (prev >= 0 && v.tint < prev - 0.01) fell = true;
      prev = v.tint;
      await page.waitForTimeout(16);
    }
    expect(moved).toBe(false);
    expect(down).toBe(true);
    const overlap = await page.evaluate(() => {
      const stage = document.querySelector('#btStage').getBoundingClientRect();
      const ids = ['#btFoeHp', '#btMeHp', '#btMsg', '#btMoves'];
      return ids.some((sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return stage.bottom > r.top && stage.top < r.bottom && stage.right > r.left && stage.left < r.right;
      });
    });
    expect(overlap).toBe(false);
  });
});

test('13 a forced switch opens on an empty queue', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  const s = baseSave();
  s.party.push(petRow({ id: 'petsecond', species: 'tide', stage: 0, level: 5, moves: ['droplet_dash', 'ripple_jab', 'mist_veil'] }));
  // Two pets queue the party tip, which opens over the battle buttons once the walk has been calm for 600 ms.
  // A slow boot can give it that time, so this check plays with tips off.
  s.settings.tips = false;
  await boot(page, s);
  await openWild(page, 'ember/0', 8);
  await page.evaluate(() => {
    const b = PixelPets.battle;
    PixelPets.setHp('me', 1);
    b.foes[0].stats.spd = 500;
    b.foePlan = { move: 'flick_flame' };
    b.foes[0].moves = [{ id: 'flick_flame', uses: 10 }];
  });
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await expect(page.locator('#ovSheet')).toBeVisible();
  const q = await page.evaluate(() => PixelPets.battle.q.length);
  expect(q).toBe(0);
  await page.locator('#shList button:not([disabled])').click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' && PixelPets.battle.me.petId === 'petsecond');
});

test('14 running away leaves an empty queue and the walk view takes the next tap', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'gust/0', 2);
  await page.evaluate(() => {
    const b = PixelPets.battle;
    // pin the battle roll as tests 16, 18, 20 and 21 do: an unpinned roll (a miss, a crit, a speed tie) changes the lines before CHOOSE
    b.animMs = null; b.textMs = 0; b.rng = () => 0.5;
    b.foes[0].stats.spd = 1;
    b.foePlan = { move: 'puff_shot' };
    PixelPets.setHp('foe', 999);
    PixelPets.setHp('me', 999);
  });
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await page.waitForTimeout(40);
  await page.locator('#btMsg').click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
  await page.locator('[data-bact="run"]').click();
  await page.waitForFunction(() => !PixelPets.battle.on, null, { timeout: 8000 });
  const left = await page.evaluate(() => ({ q: PixelPets.battle.q.length, ff: PixelPets.battle.ff }));
  expect(left.q).toBe(0);
  expect(left.ff).toBe(false);
  await page.locator('#tabs button[data-tab="pet"]').click();
  await expect(page.locator('#scr-pet')).toBeVisible();
});

test('15 a catch opens the result only after the queue is empty', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'gust/0', 2);
  await page.evaluate(() => {
    PixelPets.battle.animMs = null;
    PixelPets.battle.textMs = 0;
    PixelPets.battle.foePlan = { move: 'puff_shot' };
    PixelPets.setHp('foe', 999);
    PixelPets.battle.rng = () => 0.4;
  });
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await page.waitForFunction(() => PixelPets.battle.state !== 'CHOOSE');
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
  await befriend(page);
  expect(await page.evaluate(() => PixelPets.battle.q.length)).toBe(0);
  await page.locator('#btOk').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
});

test('16 win and loss panels open on an empty queue', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'gust/0', 2);
  // pin the battle roll as tests 18, 20 and 21 do: a random miss would leave the foe up and the end panel shut
  await page.evaluate(() => { PixelPets.setHp('foe', 1); PixelPets.battle.foePlan = { move: 'puff_shot' }; PixelPets.battle.rng = () => 0.5; });
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await page.waitForFunction(() => PixelPets.battle.panel === 'end');
  expect(await page.evaluate(() => PixelPets.battle.q.length)).toBe(0);
  await page.locator('#btOk').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => PixelPets.battle.fx.length)).toBe(0);

  await openWild(page, 'ember/0', 12);
  await page.evaluate(() => {
    PixelPets.setHp('me', 1);
    const b = PixelPets.battle;
    b.foes[0].stats.spd = 400;
    b.foePlan = { move: 'flick_flame' };
    b.rng = () => 0.5;
  });
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await page.waitForFunction(() => PixelPets.battle.panel === 'end');
  expect(await page.evaluate(() => PixelPets.battle.q.length)).toBe(0);
  await page.locator('#btOk').click();
  await page.waitForFunction(() => !PixelPets.battle.on);
});

test('17 closeBattle during a wind-up resolves and the next battle runs', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'bloom/0', 3);
  await page.evaluate(() => { PixelPets.battle.animMs = null; PixelPets.battle.textMs = 0; });
  const pending = page.evaluate(() => {
    document.querySelector('[data-bact="fight"]').click();
    document.querySelector('#btMoves button').click();
    return PixelPets.battle.play(PixelPets.battle.id);
  });
  await page.waitForTimeout(30);
  await page.evaluate(() => PixelPets.battle.close());
  await pending;
  const after = await page.evaluate(() => ({ on: PixelPets.battle.on, q: PixelPets.battle.q.length, skip: false }));
  expect(after.on).toBe(false);
  expect(after.q).toBe(0);
  await openWild(page, 'bloom/0', 3);
  expect(await page.evaluate(() => PixelPets.battle.state)).toBe('CHOOSE');
});

test('18 hiding the page snaps the bars and the next line still takes a tap', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'bloom/0', 4);
  await page.evaluate(() => {
    const b = PixelPets.battle;
    // foxfire_flick is 95% accurate. A miss sets neither punch nor shown (and the foe's sap_sip heal sets no
    // punch), so the wait below would hang. Pin the roll so the move lands, as tests 20 and 21 do.
    b.animMs = null; b.textMs = 5000; b.rng = () => 0.5;
    b.foePlan = { move: 'sap_sip' };
    PixelPets.setHp('foe', 40);
  });
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button[data-move="foxfire_flick"]').click();
  await page.waitForFunction(() => PixelPets.battle.punch || PixelPets.battle.shown);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get() { return true; } });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
  });
  const snap = await page.evaluate(() => {
    const b = PixelPets.battle;
    const ghost = document.querySelector('#btFoeGhost');
    return {
      qText: b.q.filter((s) => s.k !== 'text').length,
      shake: b.view ? b.view.shakeX : 0,
      ghost: ghost ? ghost.style.width : '0',
      shown: b.shown,
    };
  });
  expect(snap.qText).toBe(0);
  expect(snap.shown).toBeFalsy();
  expect(parseFloat(snap.ghost) || 0).toBe(0);
  const line = await page.locator('#btMsg').innerText();
  await page.locator('#btMsg').click();
  await page.waitForFunction((prev) => document.querySelector('#btMsg').textContent !== prev, line, { timeout: 1500 });
  await page.evaluate(() => { PixelPets.battle.textMs = 0; });
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || PixelPets.battle.panel === 'end', null, { timeout: 8000 });
});

test('19 fast-forward does not leak and a queued bar keeps its snapshot', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'bloom/0', 4);
  await page.evaluate(() => {
    const b = PixelPets.battle;
    // foxfire_flick is 95% accurate; a miss never sets shown. Pin the roll as tests 16, 18, 20 and 21 do.
    b.animMs = null; b.textMs = 0; b.rng = () => 0.5;
    b.foePlan = { move: 'sap_sip' };
  });
  const before = await page.evaluate(() => document.querySelector('#btFoeHp').style.width);
  await page.locator('[data-bact="fight"]').click();
  const mid = await page.evaluate(async () => {
    document.querySelector('#btMoves button[data-move="foxfire_flick"]').click();
    const b = PixelPets.battle;
    for (let i = 0; i < 80; i++) {
      if (b.shown) {
        const width = document.querySelector('#btFoeHp').style.width;
        b.foes[0].hp = 1;
        return { saw: true, width: width, after: document.querySelector('#btFoeHp').style.width };
      }
      await new Promise((r) => setTimeout(r, 10));
    }
    return { saw: false, state: b.state };
  });
  expect(mid.saw).toBe(true);
  expect(mid.width).toBe(before);
  expect(mid.after).toBe(before);
  await page.locator('#btMsg').click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
  const after = await page.evaluate(() => document.querySelector('#btFoeHp').style.width);
  expect(after).not.toBe(before);
  await page.evaluate(() => PixelPets.battle.close());
  await openWild(page, 'bloom/0', 4);
  await page.evaluate(() => { PixelPets.battle.animMs = null; PixelPets.battle.textMs = 0; PixelPets.battle.ff = false; PixelPets.battle.rng = () => 0.5; });
  const t0 = await page.evaluate(() => performance.now());
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button').first().click();
  await page.waitForFunction(() => PixelPets.battle.hpShow || PixelPets.battle.state === 'CHOOSE');
  const dt = await page.evaluate((t) => performance.now() - t, t0);
  expect(dt).toBeGreaterThan(100);
});

const CUE_DIGIT_ROWS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
async function outlineAt(page) {
  return page.evaluate((rows) => {
    const c = document.querySelector('#battleCanvas');
    const g = c.getContext('2d');
    const img = g.getImageData(0, 0, c.width, c.height).data;
    const hex = (r, gv, b) => '#' + [r, gv, b].map((n) => n.toString(16).padStart(2, '0')).join('');
    const ink = { k: '#1a1c2c', y: '#ffcd75', w: '#f4f4f4', h: '#94b0c2' };
    const at = (x, y) => {
      if (x < 0 || y < 0 || x >= c.width || y >= c.height) return '';
      const i = (y * c.width + x) * 4;
      return hex(img[i], img[i + 1], img[i + 2]);
    };
    const boxes = typeof mvNumBoxes === 'function' ? mvNumBoxes() : [];
    const bits = rows;
    const n8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    let digits = 0, bad = 0;
    const samples = [];
    boxes.forEach((box) => {
      const sc = box.sc || 1, fill = ink[box.col] || ink.w, ox = box.ox || 0, oy = box.oy || 0;
      for (let ci = 0; ci < box.text.length; ci++) {
        const ch = bits[box.text.charCodeAt(ci) - 48];
        if (!ch) continue;
        for (let b = 0; b < 15; b++) if (ch[b] === '1') {
          const px = box.x + ox + ci * 4 * sc + (b % 3) * sc, py = box.y + oy + Math.floor(b / 3) * sc;
          for (let dy = 0; dy < sc; dy++) for (let dx = 0; dx < sc; dx++) {
            digits++;
            const got = at(px + dx, py + dy);
            if (got !== fill) { bad++; if (samples.length < 4) samples.push({ kind: 'fill', want: fill, got: got, x: px + dx, y: py + dy }); }
          }
          for (let n = 0; n < 8; n++) {
            const ox = n8[n][0] * sc, oy = n8[n][1] * sc;
            const nx = px + ox, ny = py + oy;
            const glyph = boxes.some((o) => {
              if (o !== box) return false;
              for (let cj = 0; cj < o.text.length; cj++) {
                const dh = bits[o.text.charCodeAt(cj) - 48];
                if (!dh) continue;
                for (let q = 0; q < 15; q++) if (dh[q] === '1') {
                  const gx = o.x + (o.ox || 0) + cj * 4 * sc + (q % 3) * sc, gy = o.y + (o.oy || 0) + Math.floor(q / 3) * sc;
                  if (nx >= gx && nx < gx + sc && ny >= gy && ny < gy + sc) return true;
                }
              }
              return false;
            });
            if (!glyph && at(nx, ny) !== ink.k) { bad++; if (samples.length < 6) samples.push({ kind: 'edge', want: ink.k, got: at(nx, ny), x: nx, y: ny }); }
          }
        }
      }
    });
    const probe = boxes[0] ? { at: at(boxes[0].x, boxes[0].y), shift: at(boxes[0].x + (boxes[0].ox || 0), boxes[0].y + (boxes[0].oy || 0)), ox: boxes[0].ox || 0, oy: boxes[0].oy || 0 } : null;
    return { digits, bad, boxes: boxes.map((b) => ({ x: b.x, y: b.y, text: b.text, col: b.col, sc: b.sc, ox: b.ox || 0, oy: b.oy || 0 })), samples, probe };
  }, CUE_DIGIT_ROWS);
}
// Debug hook for test 20: wraps mvNumTake and mvNumDraw (globals from mv_fx.js) to log every damage number the
// queue takes and whether a frame drew it. `lead` moves a number's start time that many ms ahead of the take, the
// way a rAF frame stamp can be a little earlier than the performance.now() of the task that took the number.
async function hookNumbers(page) {
  await page.evaluate(() => {
    const hook = { takes: [], lead: 0 };
    window.__mvNum = hook;
    const take = window.mvNumTake, draw = window.mvNumDraw;
    window.mvNumTake = function (who, n, look, t0) {
      const rec = { n: n, t0: t0 + hook.lead, drawn: false, sawEarly: false, droppedEarly: false };
      hook.takes.push(rec);
      return take.call(this, who, n, look, rec.t0);
    };
    window.mvNumDraw = function (g, W, H, vis, centres, t) {
      const out = draw.apply(this, arguments);
      hook.takes.forEach((rec) => {
        if (rec.drawn || rec.droppedEarly) return;
        if (t < rec.t0) rec.sawEarly = true;
        const slot = MV_NUM.find((sl) => sl.t0 === rec.t0);
        if (MV_LAST_NUM.some((box) => box.text === String(rec.n))) rec.drawn = true;
        else if (!slot || !slot.on) rec.droppedEarly = true;
      });
      return out;
    };
  });
}
test('20 damage digits keep a dark outline and every hit draws its number', async ({ page }) => {
  const s = baseSave();
  await boot(page, s);
  await hookNumbers(page);
  // meadow: the natural timing. snow: the number starts 50 ms after the take, so the first frames see a negative
  // age every time. Before the mvNumDraw fix a frame with a negative age dropped the number before its first draw.
  for (const [env, lead] of [['meadow', 0], ['snow', 50]]) {
    await page.evaluate((name) => { PixelPets.setMapBackdrop('route'); PixelPets.setEnv(name); }, env);
    await openWild(page, 'tide/0', 6);
    await page.evaluate((lead) => {
      const b = PixelPets.battle;
      b.animMs = null; b.textMs = 4000; b.rng = () => 0.5;
      b.foePlan = { move: 'mist_veil' };
      window.__mvNum.takes = []; window.__mvNum.lead = lead;
    }, lead);
    await page.locator('[data-bact="fight"]').click();
    await page.locator('#btMoves button[data-move="foxfire_flick"]').click();
    await page.waitForFunction(() => window.__mvNum.takes.some((r) => r.drawn || r.droppedEarly), null, { timeout: 15000 });
    const takes = await page.evaluate(() => window.__mvNum.takes.map((r) => ({ n: r.n, drawn: r.drawn, sawEarly: r.sawEarly, droppedEarly: r.droppedEarly })));
    expect(takes.length, env + ' numbers taken').toBe(1);
    expect(takes.filter((r) => r.droppedEarly), env + ' numbers dropped before their first draw').toEqual([]);
    expect(takes.every((r) => r.drawn), env + ' every number drawn ' + JSON.stringify(takes)).toBe(true);
    if (lead) expect(takes[0].sawEarly, env + ' a frame came before the number start').toBe(true);
    const first = await outlineAt(page);
    expect(first.digits, env + ' first ' + JSON.stringify(first.boxes)).toBeGreaterThan(8);
    expect(first.bad, env + ' first ' + JSON.stringify(first.probe) + ' ' + JSON.stringify(first.samples)).toBe(0);
    await page.waitForTimeout(300);
    const last = await outlineAt(page);
    expect(last.digits, env + ' last').toBeGreaterThan(8);
    expect(last.bad, env + ' last').toBe(0);
    await page.evaluate(() => PixelPets.battle.close());
    await page.waitForFunction(() => !PixelPets.battle.on);
  }
});

test('21 a super-effective white frame is one run of about 80 ms', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  // Record every frame the battle canvas draws, with the game's own draw clock (view.t), instead of sampling
  // view.white from the test on the wall clock: an 80 ms window could fall between two samples under load.
  await page.evaluate(() => {
    const b = PixelPets.battle;
    let cur = b.view;
    window.__t21Frames = [];
    Object.defineProperty(b, 'view', {
      configurable: true,
      get() { return cur; },
      set(v) { cur = v; if (v) window.__t21Frames.push({ t: v.t, white: !!v.white }); },
    });
  });
  let shot = false;
  for (const effects of ['full', 'off']) {
    await page.evaluate((effects) => { PixelPets.state.settings.effects = effects; }, effects);
    await openWild(page, 'bloom/0', 4);
    await page.evaluate(() => {
      const b = PixelPets.battle;
      // Pin the roll as tests 16, 18, 19 and 20 do. foxfire_flick is 95% accurate (a miss draws no white frame)
      // and a 1-in-16 lucky hit knocks this 32 HP foe out, so the battle never returns to CHOOSE.
      // textMs 200 (players get 600+ or a tap): with 0, effects OFF has no stop after the hit, so the rest of the
      // turn ran as back-to-back 0 ms timers and, under load, no frame was drawn inside the 80 ms window.
      b.animMs = null; b.textMs = 200; b.whites = []; b.foePlan = { move: 'sap_sip' }; b.rng = () => 0.5;
      window.__t21Frames.length = 0;
    });
    await page.locator('[data-bact="fight"]').click();
    await page.locator('#btMoves button[data-move="foxfire_flick"]').click();
    if (effects === 'full' && !shot) {
      shot = true;
      await page.waitForFunction(() => window.__t21Frames.some((f) => f.white), null, { polling: 'raf', timeout: 5000 });
      await page.screenshot({ path: path.join(artifactsDir('moves-v2'), 'super-hit-390.png') });
    }
    await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on);
    const got = await page.evaluate(() => ({
      runs: (PixelPets.battle.whites || []).map((w) => ({ t0: w.t0, until: w.until })),
      frames: window.__t21Frames.slice(),
    }));
    const runs = got.runs.map((w) => w.until - w.t0);
    expect(runs, effects).toHaveLength(1);
    expect(runs[0], effects).toBeGreaterThanOrEqual(70);
    expect(runs[0], effects).toBeLessThanOrEqual(90);
    // The canvas drew at least one white frame, the white frames are one unbroken run, and each one sits inside
    // the recorded window on the game's clock.
    const lit = got.frames.map((f, i) => (f.white ? i : -1)).filter((i) => i >= 0);
    const w = got.runs[0];
    expect(lit.length, effects + ' white frames drawn; frame times from t0: ' + JSON.stringify(got.frames.filter((f) => f.t > w.t0 - 100 && f.t < w.until + 100).map((f) => Math.round(f.t - w.t0)))).toBeGreaterThan(0);
    expect(lit[lit.length - 1] - lit[0] + 1, effects + ' one run').toBe(lit.length);
    lit.forEach((i) => {
      expect(got.frames[i].t, effects).toBeGreaterThanOrEqual(w.t0);
      expect(got.frames[i].t, effects).toBeLessThan(w.until);
    });
    const inside = got.frames.filter((f) => f.t >= w.t0 && f.t < w.until);
    expect(inside.every((f) => f.white), effects + ' every frame inside the window is white').toBe(true);
    await page.evaluate(() => PixelPets.battle.close());
    await page.waitForFunction(() => !PixelPets.battle.on);
  }
});

test('22 one screen-wide flash clock skips a stacked white frame', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  await boot(page);
  await openWild(page, 'bloom/0', 4);
  const logged = await page.evaluate(async () => {
    const b = PixelPets.battle;
    b.textMs = 0; b.animMs = null; b.whites = []; b.fxLog = []; b.flashAt = null;
    b.shown = { who: 'foe:0', hpFrom: 40, hpTo: 30, max: 40 };
    const hit = (n) => {
      b.step('contact', { who: 'foe:0', atk: 'me', type: 'EMBER', mult: 2, crit: false, variant: 'super' });
      b.step('stop', { ms: 60 });
      b.step('hp', { who: 'foe:0' });
      b.step('num', { who: 'foe:0', n: n, look: 'super' });
    };
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    hit(8);
    const first = b.play(b.id);
    await sleep(120);
    hit(6);
    await first;
    await b.play(b.id);
    const apart = { whites: (b.whites || []).map((w) => w.t0), log: b.fxLog.slice() };
    b.flashAt = null; b.whites = []; b.fxLog = [];
    hit(4); hit(3);
    await b.play(b.id);
    return { apart, back: { whites: (b.whites || []).map((w) => w.t0), log: b.fxLog.slice() } };
  });
  for (const part of [logged.apart, logged.back]) {
    expect(part.log.filter((x) => x === 'mvHit').length).toBe(2);
    expect(part.log.filter((x) => x === 'num').length).toBe(2);
    expect(part.log.filter((x) => x === 'shake').length).toBeGreaterThanOrEqual(1);
    if (part.whites.length >= 2) expect(part.whites[1] - part.whites[0]).toBeGreaterThanOrEqual(334);
    else expect(part.whites.length).toBe(1);
  }
});

test('8 move names stay short and off the banned list', async ({ page }) => {
  await boot(page);
  const bad = await page.evaluate((ids) => {
    const moves = PixelPets.moves();
    const ban = /fainted|evolve|coins|appeared|\bdex\b|Go,/i;
    return ids.filter((id) => !moves[id] || moves[id].name.length > 14 || ban.test(moves[id].name));
  }, NEW);
  expect(bad).toEqual([]);
});

test('9 a full set is offered its signature once, and Skip is final', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, '390 only');
  const s = baseSave();
  s.box = [petRow({ id: 'boxfull01', species: 'tide', stage: 1, level: 14, moves: ['ripple_jab', 'undertow', 'tumble_charge', 'puddle_stomp'] })];
  await boot(page, s);
  expect(await page.locator('#ovSheet').isVisible()).toBe(false);
  await openWild(page, 'gust/0', 2);
  expect(await page.locator('#ovSheet').isVisible()).toBe(false);
  await page.evaluate(() => PixelPets.battle.close());
  await page.waitForFunction(() => !PixelPets.battle.on);
  await page.evaluate(() => PixelPets.withdrawPet('boxfull01', 1));
  await expect(page.locator('#ovSheet')).toBeVisible();
  const title = await page.locator('#shTitle').innerText();
  expect(title).toContain('Droplet Dash');
  await page.locator('#shList button', { hasText: 'Skip it' }).click();
  await expect(page.locator('#shTitle')).toContainText("didn't pick up");
  await page.locator('#shList button', { hasText: 'OK' }).click();
  await expect(page.locator('#ovSheet')).toBeHidden();
  const after = await page.evaluate(() => {
    const p = PixelPets.state.party.find((q) => q.id === 'boxfull01');
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { moves: p.moves.slice(), flag: raw.flags['sig_offer.boxfull01'] === true, v: raw.v };
  });
  expect(after.moves).toEqual(['ripple_jab', 'undertow', 'tumble_charge', 'puddle_stomp']);
  expect(after.flag).toBe(true);
  expect(after.v).toBe(2);
  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  await page.waitForTimeout(400);
  expect(await page.locator('#ovSheet').isVisible()).toBe(false);
});

/* Co-op half of test 22. coopBattle / coopEnd do not relay a hit onto the other phone,
   so each phone checks the one screen-wide clock on its own canvas. */
test.describe('22 co-op flash clock', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  const BASE = 'http://127.0.0.1:' + (process.env.PP_PORT || '8080');
  let env = null;
  test.beforeAll(async ({}, info) => {
    test.skip(info.project.name !== '390', '390 only');
    test.setTimeout(600000);
    await ensureEmulator();
    env = await initializeTestEnvironment({ projectId: 'demo-walklings', database: { host: '127.0.0.1', port: EMU_PORTS.database, rules: fs.readFileSync('database.rules.json', 'utf8') } });
    await env.withSecurityRulesDisabled(async (ctx) => { await ctx.database().ref('roomCodes/AMB4RQ').set({ on: true }); });
  });
  test.afterAll(async () => {
    try { if (env) await env.cleanup(); } catch (e) {}
    releaseEmulator();
  });
  test('two phones landing hits close together keep one clock each', async ({ page, browser }, info) => {
    test.skip(info.project.name !== '390', '390 only');
    const a = page;
    await boot(a, baseSave(), '?cloud=emu&debug=1' + emuQuery());
    const bCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, baseURL: BASE });
    const b = await bCtx.newPage();
    b.ppErrors = [];
    await boot(b, (() => { const s = baseSave(); s.uid = 'smoketest0002'; return s; })(), '?cloud=emu&debug=1' + emuQuery());
    async function join(p) {
      await p.locator('#settingsBtn').click();
      await p.locator('#setRoomCode').click();
      await p.locator('#roomCodeInput').fill('AMB-4RQ');
      await p.locator('#roomJoin').click();
      await p.waitForFunction(() => window.PixelPets.net && window.PixelPets.net.room, null, { timeout: 15000 });
      if (await p.locator('#setClose').isVisible()) await p.locator('#setClose').click();
      if (await p.locator('#roomCodeOv').isVisible()) await p.locator('#roomCodeOv button', { hasText: 'CLOSE' }).click();
    }
    await join(a); await join(b);
    async function arm(p) {
      await p.evaluate(() => {
        PixelPets.showTab('walk');
        PixelPets.healTeam();
        PixelPets.battle.textMs = 0;
        PixelPets.battle.animMs = null;
        PixelPets.forceBattle('bloom/0', 4);
      });
      await p.waitForFunction(() => PixelPets.battle.state === 'CHOOSE');
    }
    await arm(a); await arm(b);
    const seq = () => {
      const btl = PixelPets.battle;
      btl.whites = []; btl.fxLog = []; btl.flashAt = null;
      btl.shown = { who: 'foe:0', hpFrom: 40, hpTo: 28, max: 40 };
      const t0 = Date.now();
      const hit = (n) => {
        btl.step('contact', { who: 'foe:0', atk: 'me', type: 'EMBER', mult: 2, crit: false, variant: 'super' });
        btl.step('stop', { ms: 60 });
        btl.step('hp', { who: 'foe:0' });
        btl.step('num', { who: 'foe:0', n: n, look: 'super' });
      };
      hit(8);
      const pending = btl.play(btl.id);
      return new Promise((resolve) => {
        setTimeout(() => {
          hit(5);
          pending.then(() => btl.play(btl.id)).then(() => {
            resolve({
              t0: t0,
              whites: (btl.whites || []).map((w) => w.t0),
              hits: btl.fxLog.filter((x) => x === 'mvHit').length,
              nums: btl.fxLog.filter((x) => x === 'num').length,
              shakes: btl.fxLog.filter((x) => x === 'shake').length,
            });
          });
        }, 80);
      });
    };
    const [ra, rb] = await Promise.all([a.evaluate(seq), b.evaluate(seq)]);
    expect(Math.abs(ra.t0 - rb.t0)).toBeLessThan(100);
    for (const part of [ra, rb]) {
      expect(part.hits).toBe(2);
      expect(part.nums).toBe(2);
      expect(part.shakes).toBeGreaterThanOrEqual(1);
      if (part.whites.length >= 2) expect(part.whites[1] - part.whites[0]).toBeGreaterThanOrEqual(334);
      else expect(part.whites.length).toBe(1);
    }
    await bCtx.close();
  });
});
