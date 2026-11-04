/* SPRITE_ANIM v0.1 (design specs/SPRITE_ANIM.md, D2070-D2089; red, held for Vincent): battle sprites take a pose frame.
   Players never load this file. Every test runs at 320, 375 and 390 in Modern controls; the reduced-motion block emulates
   prefers-reduced-motion. Draw checks call the debug hook drawBattleAt(t) inside one evaluate, so the rAF loop cannot draw
   in between. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);
const SAVE_KEY = 'pixelpets.save.v2';

function animSave(line, stage, effects) {
  const s = starterSave();
  s.party = [{ id: 'sa1', species: line, stage: stage || 0, xp: 0, bx: 4 * 8 * 8, hunger: 90, happy: 90, energy: 95, nick: null, origin: 'starter', moves: [], evoMoves: [] }];
  s.partnerId = 'sa1';
  s.settings.controls = 'modern';
  s.settings.effects = effects || 'full';
  s.settings.textSpeed = 'fast';
  return s;
}
async function boot(page, { line = 'ember', stage = 0, effects = 'full' } = {}) {
  await installSave(page.context(), animSave(line, stage, effects), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && PixelPets.debug === true && PixelPets.state && PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
}
async function open(page, foe = 'ember/2') {
  await page.evaluate((foe) => { const b = PixelPets.battle; if (b.on) b.close(); PixelPets.healTeam(); PixelPets.setMoves(['bump']); return PixelPets.forceBattle(foe, 2); }, foe);
  await page.waitForFunction(() => PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE', null, { timeout: 20000 });
  await page.evaluate(() => {
    const b = PixelPets.battle; b.animMs = null; b.textMs = 300; b.rng = () => 0.2; b.fxLog = []; b.whites = []; b.flashAt = null;
    const f = b.foes && b.foes[0]; if (f) { f.hp = 400; f.maxHp = 400; }
    b.foePlan = { move: 'wobble' };
  });
}
// Frames each battler drew at these times (drawBattleAt(t) with B.fx and B.punch as set by `setup`).
function framesAt(page, times, setup) {
  return page.evaluate(([times, setup]) => {
    const B = PixelPets.battle, out = [];
    B.fx.length = 0; B.punch = null; B.calm = null; B.white = null; B.hold = 0; B.ff = false;
    if (setup === 'punch') B.punch = { who: 'me', tgt: 'foe:0', type: 'EMBER', variant: 'normal', mode: 'full', t0: 100000 };
    if (setup === 'calm') { B.fx.push({ who: 'me', kind: 'lunge', t0: 100000, dur: 300 }); B.calm = { who: 'foe', type: 'EMBER', t0: 100300, ms: 240 }; }
    if (setup === 'hearts') B.fx.push({ who: 'foe', kind: 'hearts', t0: 100000, dur: 1500 });
    for (const t of times) { const fr = PixelPets.drawBattleAt(t); out.push([t, fr.me, fr.foe]); }
    B.fx.length = 0; B.punch = null; B.calm = null;
    return out;
  }, [times, setup || null]);
}
const setEffects = (page, v) => page.evaluate((v) => { PixelPets.state.settings.effects = v; }, v);

test('SPRITE_ANIM T1: every frame of every form renders 18x18 in PAL, rows are 16 high and 8 or 16 wide', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const pal = new Set(Object.values(PAL).map((h) => h.toLowerCase())), bad = [];
    // the faded state: FADE_KEY's targets plus eyes and outline, and any key FADE_KEY leaves alone (as fadedStage does, e.g. F)
    const dim = new Set(['w', 'h', 'm', 'd', 'k'].map((c) => PAL[c].toLowerCase()));
    for (const k in PAL) if (!(k in SA.fade.key)) dim.add(PAL[k].toLowerCase());
    let frames = 0, forms = 0;
    SPECIES.forEach((sp, si) => sp.stages.forEach((st, k) => {
      const row = SPRITE_ANIM[sp.id + '/' + k];
      if (!row) { bad.push(sp.id + '/' + k + ': no row'); return; }
      forms++;
      for (const f of SA.frames) {
        const fr = row[f], g = fr && (fr.half || fr.full || fr.grid), w = fr && fr.half ? 8 : 16;
        if (!g || g.length !== 16 || g.some((r) => r.length !== w)) bad.push(sp.id + '/' + k + ' ' + f + ': size');
        for (const faded of [false, true]) {
          const set = saSet(si, k, faded, f);
          for (const m of ['n', 'b', 'w']) {
            const img = set && set[m];
            if (!img || img.width !== 18 || img.height !== 18) { bad.push(sp.id + '/' + k + ' ' + f + ' ' + m + ': not 18x18'); continue; }
            const c = document.createElement('canvas'); c.width = 18; c.height = 18; const g2 = c.getContext('2d'); g2.drawImage(img, 0, 0);
            const d = g2.getImageData(0, 0, 18, 18).data; let opaque = 0;
            for (let i = 0; i < d.length; i += 4) {
              if (!d[i + 3]) continue; opaque++;
              if (d[i + 3] !== 255) { bad.push(sp.id + '/' + k + ' ' + f + ': alpha'); break; }
              const hx = '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
              if (!pal.has(hx)) { bad.push(sp.id + '/' + k + ' ' + f + ': off-PAL ' + hx); break; }
              if (faded && m !== 'w' && !dim.has(hx)) { bad.push(sp.id + '/' + k + ' ' + f + ': faded frame not faded ' + hx); break; }
            }
            if (!opaque) bad.push(sp.id + '/' + k + ' ' + f + ' ' + m + ': empty');
            frames++;
          }
        }
      }
    }));
    return { bad, frames, forms, species: SPECIES.length };
  });
  expect(r.bad).toEqual([]);
  expect(r.forms).toBe(SPECIES_FORMS);
  expect(r.frames).toBe(SPECIES_FORMS * 5 * 2 * 3);
});
const SPECIES_FORMS = 87;   // 29 lines x 3 stages on main (the four Route 4 lines from #315 included)

test('SPRITE_ANIM T2: OFF is today\'s draw, pixel for pixel; FULL and CALM differ only where a frame is posed', async ({ page }) => {
  await boot(page, { effects: 'off' });
  await open(page, 'bloom/2');
  const r = await page.evaluate(() => {
    const c = document.getElementById('battleCanvas'), g = c.getContext('2d'), B = PixelPets.battle, res = {};
    B.fx.length = 0; B.punch = null; B.calm = null;
    const grab = (t) => { PixelPets.drawBattleAt(t); return Array.from(g.getImageData(0, 0, c.width, c.height).data); };
    for (const t of [200000, 200600, 201300, 202640]) {   // a blink frame (2600 * 78 + 0..130 ms) and three idle times
      SA.on = true; const a = grab(t); const fa = Object.assign({}, B.view.frames);
      SA.on = false; const b = grab(t);
      SA.on = true;
      let diff = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
      res[t] = { diff, frames: fa, n: a.length };
    }
    return res;
  });
  for (const t of Object.keys(r)) {
    expect(r[t].n).toBeGreaterThan(0);
    expect(r[t].diff, 'OFF differs from today at t=' + t).toBe(0);
    expect(r[t].frames).toEqual({ foe: 'base', me: 'base' });
  }
  // FULL at a breathe time is not today's draw (the frame changed), so the pixel compare above is a real check
  await setEffects(page, 'full');
  const full = await page.evaluate(() => {
    const c = document.getElementById('battleCanvas'), g = c.getContext('2d'), B = PixelPets.battle;
    const grab = (t) => { PixelPets.drawBattleAt(t); return Array.from(g.getImageData(0, 0, c.width, c.height).data); };
    SA.on = true; const a = grab(200600); const fr = Object.assign({}, B.view.frames); SA.on = false; const b = grab(200600); SA.on = true;
    let diff = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
    return { diff, fr };
  });
  expect(full.fr.me).toBe('breathe');
  expect(full.diff).toBeGreaterThan(0);
});

test('SPRITE_ANIM T3: the idle clock: FULL breathes every 500 ms (foe out of step), CALM and OFF keep today\'s idle', async ({ page }) => {
  await boot(page);
  await open(page);
  const full = await framesAt(page, [300000, 300250, 300500, 300750, 301000]);
  expect(full.map((x) => x[1])).toEqual(['base', 'base', 'breathe', 'breathe', 'base']);
  expect(full.map((x) => x[2])).toEqual(['base', 'breathe', 'breathe', 'base', 'base']);
  for (const fx of ['calm', 'off']) {
    await setEffects(page, fx);
    const r = await framesAt(page, [300000, 300250, 300500, 300750, 301000]);
    expect(new Set(r.flatMap((x) => [x[1], x[2]]))).toEqual(new Set(['base']));
  }
});

test('SPRITE_ANIM T4: FULL attack and hit frames follow the punch clock (wind-up 0-80, strike to contact + stop, flinch after)', async ({ page }) => {
  await boot(page);
  await open(page);
  const r = await framesAt(page, [100000, 100040, 100079, 100080, 100139, 100219, 100140, 100230, 100439, 100441, 100600], 'punch');
  const at = Object.fromEntries(r.map(([t, me, foe]) => [t - 100000, { me, foe }]));
  expect(at[0].me).toBe('windup'); expect(at[40].me).toBe('windup'); expect(at[79].me).toBe('windup');
  expect(at[80].me).toBe('strike'); expect(at[139].me).toBe('strike'); expect(at[219].me).toBe('strike');   // EMBER stop 80: strike to 220
  expect(at[139].foe).not.toBe('hit'); expect(at[140].foe).toBe('hit'); expect(at[439].foe).toBe('hit');    // hit 140 + (80 + 60 + 160)
  expect(at[441].foe).not.toBe('hit'); expect(at[230].me).not.toBe('strike'); expect(at[600].me).not.toBe('windup');
});

test('SPRITE_ANIM T5: a real FULL turn feeds the frames from the step queue (go, windup, contact, knock)', async ({ page }) => {
  await boot(page);
  await open(page);
  // Every drawn frame: its clock, both battlers' frames and the punch it read. A loaded machine may skip the 80 ms wind-up
  // window, so each frame is checked against the pose its own time asks for, and the flinch (260 ms for Bump) must be seen.
  await page.evaluate(() => {
    window.__saTicks = [];
    const tick = () => { const B = PixelPets.battle, v = B.view, P = B.punch;
      if (v && v.frames) window.__saTicks.push([v.t, v.frames.me, v.frames.foe, P ? P.who : null, P ? P.t0 : null, P ? P.mode : null]);
      if (B.on) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await page.locator('[data-bact="fight"]').click();
  await page.locator('#btMoves button[data-move="bump"]').click();
  await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on, null, { timeout: 20000 });
  const r = await page.evaluate(() => ({ ticks: window.__saTicks, log: PixelPets.battle.fxLog.slice() }));
  expect(r.log).toContain('mvHit');
  const mine = r.ticks.filter((x) => x[3] === 'me' && x[5] === 'full');
  expect(mine.length).toBeGreaterThan(0);
  const t0 = mine[0][4], wrong = [];
  let hits = 0;
  for (const [t, me, foe, who, pt0] of mine) {
    if (pt0 !== t0) continue;
    const d = t - t0;
    if (d >= 0 && d < 80 && me !== 'windup') wrong.push(d + ' ms: me ' + me);
    if (d >= 80 && d < 140 && me !== 'strike') wrong.push(d + ' ms: me ' + me);
    if (d >= 140 && d < 310 && foe !== 'hit') wrong.push(d + ' ms: foe ' + foe);
    if (foe === 'hit') hits++;
  }
  expect(wrong).toEqual([]);
  expect(hits).toBeGreaterThan(0);   // the partner's Bump lands: the foe flinches (the foe's Wobble answers after)
});

test('SPRITE_ANIM T6: CALM holds the strike for the lunge and the flinch for the calm mark, never a wind-up; happy on hearts', async ({ page }) => {
  await boot(page, { effects: 'calm' });
  await open(page);
  const r = await framesAt(page, [100000, 100150, 100299, 100300, 100450, 100539, 100700], 'calm');
  const at = Object.fromEntries(r.map(([t, me, foe]) => [t - 100000, { me, foe }]));
  expect(at[0].me).toBe('strike'); expect(at[299].me).toBe('strike'); expect(at[300].me).toBe('base');
  expect(at[300].foe).toBe('hit'); expect(at[539].foe).toBe('hit'); expect(at[700].foe).toBe('base');
  expect(r.some(([, me, foe]) => me === 'windup' || me === 'breathe' || foe === 'breathe')).toBe(false);
  for (const fx of ['calm', 'full', 'off']) {
    await setEffects(page, fx);
    const h = await framesAt(page, [100500], 'hearts');
    expect(h[0][2]).toBe(fx === 'off' ? 'base' : 'happy');
  }
});

test.describe('SPRITE_ANIM reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('SPRITE_ANIM T7: reduced motion with Effects FULL plays CALM: no breathe, no wind-up; a real turn still flinches', async ({ page }) => {
    await boot(page, { effects: 'full' });
    await open(page);
    expect(await page.evaluate(() => PixelPets.auraMode())).toBe('calm');
    const idle = await framesAt(page, [300000, 300500, 300750]);
    expect(new Set(idle.flatMap((x) => [x[1], x[2]]))).toEqual(new Set(['base']));
    await page.evaluate(() => {
      window.__saSeen = { me: [], foe: [] };
      const tick = () => { const v = PixelPets.battle.view; if (v && v.frames) for (const w of ['me', 'foe']) { const a = window.__saSeen[w], f = v.frames[w]; if (f && a[a.length - 1] !== f) a.push(f); } if (PixelPets.battle.on) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    await page.locator('[data-bact="fight"]').click();
    await page.locator('#btMoves button[data-move="bump"]').click();
    await page.waitForFunction(() => PixelPets.battle.state === 'CHOOSE' || !PixelPets.battle.on, null, { timeout: 20000 });
    const seen = await page.evaluate(() => window.__saSeen);
    expect(seen.me).toContain('strike');
    expect(seen.foe).toContain('hit');
    expect(seen.me).not.toContain('windup');
    expect(seen.me).not.toContain('breathe');
  });
});

test('SPRITE_ANIM T8: the save is unchanged (same key, v 2, no new fields) after a battle with frames', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => JSON.parse(JSON.stringify(PixelPets.state)));
  await open(page);
  await framesAt(page, [100000, 100100, 100300], 'punch');
  await page.evaluate(() => PixelPets.battle.close());
  await page.waitForFunction((k) => !!localStorage.getItem(k), SAVE_KEY);
  const after = await page.evaluate((k) => ({ s: JSON.parse(JSON.stringify(PixelPets.state)), stored: JSON.parse(localStorage.getItem(k)), keys: Object.keys(localStorage) }), SAVE_KEY);
  expect(after.stored.v).toBe(2);
  expect(after.s.v).toBe(2);
  expect(JSON.stringify(after.stored)).not.toMatch(/sprite_?anim|"pose"|"frame"/i);
  expect(Object.keys(after.s).sort()).toEqual(Object.keys(before).sort());
  expect(Object.keys(after.s.settings).sort()).toEqual(Object.keys(before.settings).sort());
  expect(JSON.stringify(after.s)).not.toMatch(/sprite_?anim|"pose"|"frame"/i);
  expect(after.keys.filter((k) => /anim|pose/i.test(k))).toEqual([]);
});
