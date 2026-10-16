/* Build 2 checks: Standing meter, side switching, STANDING tab, quest copy and the quest icon. See tests/README.md.
   Every tier name and number is read from the game's STANDING_CFG (PixelPets.standingCfg()), never typed here, so a changed
   answer to Q2/Q3 only moves the constant. The quest copy table below IS a copy of the spec, on purpose: it proves the
   shipped text matches the designer's rows. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, shot, playScene } = require('./helpers');

trackErrors(test, expect);

const SIDE_PICK_FLAGS = { 'story.reached_fernbrook': true, 'story.met_glimmerwell': true, 'story.met_fen': true, 'story.side_pick_done': true };

async function gotoDebug(page) {
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets.debug === true && typeof window.PixelPets.setStanding === 'function');
}

test('fresh save: both meters 0, tier 0, v stays 2; old save without standing loads the same', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  const r = await page.evaluate(() => ({ st: PixelPets.standing, cfg: PixelPets.standingCfg(), check: PixelPets.standingCheck(), v: PixelPets.state.v, saved: PixelPets.state.standing }));
  expect(r.check).toEqual([]);
  expect(r.v).toBe(2);
  expect(r.saved).toEqual({ keepers: 0, glimmer: 0 });
  for (const sd of ['keepers', 'glimmer']) {
    expect(r.st[sd].points).toBe(0);
    expect(r.st[sd].tier).toBe(0);
    expect(r.st[sd].name).toBe(r.cfg.sides[sd].tiers[0].name);
  }
  expect(r.st.side).toBe('keepers');
  expect(r.st.switches).toBe(0);
  expect(r.st.canSwitch).toBe(false);   // no side pick yet
});

test('a saved standing is clamped to the range; a non-object becomes 0/0', async ({ page, browser }) => {
  const save = starterSave(); save.standing = { keepers: 250, glimmer: -5 };
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page);
  const a = await page.evaluate(() => ({ st: PixelPets.state.standing, cfg: PixelPets.standingCfg(), top: PixelPets.standing.keepers, v: PixelPets.state.v }));
  expect(a.st).toEqual({ keepers: a.cfg.max, glimmer: a.cfg.min });
  expect(a.v).toBe(2);
  expect(a.top.tier).toBe(a.cfg.thresholds.length - 1);
  expect(a.top.name).toBe(a.cfg.sides.keepers.tiers[a.cfg.thresholds.length - 1].name);
  // a second, fresh context (the open page would save its own state back on unload)
  const ctx = await browser.newContext({ viewport: page.viewportSize(), isMobile: true, hasTouch: true });
  const bad = starterSave(); bad.standing = 'nope';
  await installSave(ctx, bad, { quietDay: true });
  const p2 = await ctx.newPage();
  const errs = []; p2.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p2.on('pageerror', (e) => errs.push(e.message));
  await gotoGame(p2);
  const b = await p2.evaluate(() => ({ st: PixelPets.state.standing, v: PixelPets.state.v, view: PixelPets.standing }));
  expect(b.st).toEqual({ keepers: 0, glimmer: 0 });
  expect(b.v).toBe(2);
  expect(b.view.keepers.tier).toBe(0);
  expect(errs).toEqual([]);
  await ctx.close();
});

test('thresholds and tier-up toasts come from the config, once per tier', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const cfg = await page.evaluate(() => PixelPets.standingCfg());
  const T = cfg.thresholds;   // 0/10/25/45/70 by default
  const probes = [[T[1] - 1, 0], [T[1], 1], [T[2] - 1, 1], [T[2], 2], [T[3], 3], [T[4], 4], [cfg.max, 4]];
  for (const [pts, tier] of probes) {
    const r = await page.evaluate((n) => { PixelPets.setStanding('keepers', 0); return { pts: PixelPets.setStanding('keepers', n), tier: PixelPets.standing.keepers.tier }; }, pts);
    expect(r.pts).toBe(pts);
    expect(r.tier).toBe(tier);
  }
  // Toasts: a fresh meter, then tier 1 exactly once (flag standing.top.keepers remembers it).
  await page.evaluate(() => { PixelPets.setFlag('standing.top.keepers', null); PixelPets.setStanding('glimmer', 0); PixelPets.setStanding('keepers', 0); });
  const toastAfter = async (fn, arg) => page.evaluate(([src, a]) => { const el = document.querySelector('#toast'); el.textContent = ''; el.classList.remove('show'); (new Function('a', src))(a); return { text: el.textContent, show: el.classList.contains('show') }; }, [fn, arg]);
  const t1 = await toastAfter("PixelPets.setStanding('glimmer', a)", T[1]);
  expect(t1.show).toBe(true);
  expect(t1.text).toBe(cfg.sides.glimmer.tiers[1].toast);
  const again = await toastAfter("PixelPets.setStanding('glimmer', 0); PixelPets.setStanding('glimmer', a)", T[1]);
  expect(again.show).toBe(false);
  const t2 = await toastAfter("PixelPets.setStanding('glimmer', a)", T[2]);
  expect(t2.text).toBe(cfg.sides.glimmer.tiers[2].toast);
  const k4 = await toastAfter("PixelPets.setStanding('keepers', a)", T[4]);
  expect(k4.text).toBe(cfg.sides.keepers.tiers[4].toast);
  // tier cond(): standing.<side>>=n compares the tier, not the points
  const conds = await page.evaluate(() => PixelPets.runSteps([['if', 'standing.keepers>=4', [['setFlag', 'test.k4', true]], []], ['if', 'standing.glimmer>=3', [['setFlag', 'test.g3', true]], [['setFlag', 'test.g3', 'no']]]]));
  expect(conds).toBe(true);
  await page.waitForFunction(() => !window.PixelPets.scene);
  const flags = await page.evaluate(() => ({ k4: PixelPets.state.flags['test.k4'], g3: PixelPets.state.flags['test.g3'] }));
  expect(flags.k4).toBe(true);
  expect(flags.g3).toBe('no');
});

test('side_pick Yes (keepers) grants once; a replay does not grant again', async ({ page }) => {
  const save = starterSave(); Object.assign(save.flags, { 'story.reached_fernbrook': true, 'story.met_glimmerwell': true });
  save.world = { map: 'fernbrook', x: 9, y: 9, facing: 'down', respawn: 'fernbrook' };
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  const cfg = await page.evaluate(() => PixelPets.standingCfg());
  const before = await page.evaluate(() => PixelPets.standing.keepers.points);
  expect(before).toBe(0);
  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await playScene(page, ['Open the crates with Fen', 'Yes, the Keepers']);
  const after = await page.evaluate(() => ({ st: PixelPets.standing, got: PixelPets.state.flags['standing.got.sp_pick'], side: PixelPets.side, picked: PixelPets.state.flags['story.side_pick_done'] }));
  expect(after.st.keepers.points).toBe(cfg.grants.sp_pick + 2);
  expect(after.st.glimmer.points).toBe(0);
  expect(after.got).toBe(true);
  expect(after.side).toBe('keepers');
  expect(after.picked).toBe(true);
  // replay (debug): the same choice path, no second grant
  expect(await page.evaluate(() => PixelPets.runScene('side_pick'))).toBe(true);
  await playScene(page, ['Open the crates with Fen', 'Yes, the Keepers']);
  expect(await page.evaluate(() => PixelPets.standing.keepers.points)).toBe(cfg.grants.sp_pick + 2);
});

test('switching halves the side you leave and stays shut until the next Seal', async ({ page }) => {
  const save = starterSave(); Object.assign(save.flags, SIDE_PICK_FLAGS, { 'story.side': 'keepers', 'story.orchard_cleared': true, 'story.rook_bond': 2, 'story.rc_climax': true });
  save.standing = { keepers: 30, glimmer: 12 };
  save.world = { map: 'fernbrook', x: 5, y: 6, facing: 'down', respawn: 'fernbrook' };
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  const cfg = await page.evaluate(() => PixelPets.standingCfg());
  const before = await page.evaluate(() => ({ quest: PixelPets.quest.id, canSwitch: PixelPets.standing.canSwitch, via: PixelPets.standing.via, orchard: PixelPets.sceneFor('orchard') }));
  expect(before.canSwitch).toBe(true);
  expect(before.via).toBe('rook');
  expect(before.orchard).toBe('orchard');
  expect(await page.evaluate(() => typeof PixelPets.pledgeDesk)).toBe('undefined');
  // The cost is the same half-points rule. Rook's own confirm line is covered in rook_crossroads.spec.js.
  expect(await page.evaluate(() => PixelPets.switchSide('glimmer'))).toBe(true);
  const after = await page.evaluate(() => ({ st: PixelPets.standing, side: PixelPets.side, f: PixelPets.state.flags, seals: PixelPets.state.seals, quest: PixelPets.quest.id, orchard: PixelPets.sceneFor('orchard') }));
  expect(after.st.keepers.points).toBe(Math.floor(30 / cfg.switch.costDiv));
  expect(after.st.glimmer.points).toBe(12);
  expect(after.side).toBe('glimmer');
  expect(after.f['story.side']).toBe('glimmer');
  expect(after.f['story.switches']).toBe(1);
  expect(after.f['story.switch_via']).toBe('rook');
  expect(after.st.switches).toBe(1);
  expect(after.f['story.orchard_cleared']).toBe(true);
  expect(after.f['story.seal1']).toBeUndefined();
  expect(after.f['story.seal2']).toBeUndefined();
  expect(after.seals).toEqual({});
  expect(after.f['story.rook_bond']).toBe(2);
  expect(after.quest).toBe(before.quest);
  expect(after.orchard).toBe('orchard@glimmer');
  expect(after.st.canSwitch).toBe(false);
  // the next Seal opens a new chapter; a free debug switch does not halve
  await page.evaluate(() => PixelPets.setFlag('story.seal1', true));
  expect(await page.evaluate(() => PixelPets.standing.canSwitch)).toBe(true);
  expect(await page.evaluate(() => PixelPets.standing.chapter)).toBe(1);
  const free = await page.evaluate(() => {
    const beforePts = PixelPets.standing.glimmer.points;
    const ok = PixelPets.switchSide('keepers', true);
    return { ok, glimmer: PixelPets.standing.glimmer.points, beforePts, side: PixelPets.side };
  });
  expect(free.ok).toBe(true);
  expect(free.side).toBe('keepers');
  expect(free.glimmer).toBe(free.beforePts);
  expect(await page.evaluate(() => PixelPets.switchSide('glimmer'))).toBe(true);
  const back = await page.evaluate(() => ({ st: PixelPets.standing, side: PixelPets.side }));
  expect(back.side).toBe('glimmer');
  expect(back.st.switches).toBe(3);
  expect(back.st.keepers.points).toBe(Math.floor(Math.floor(30 / cfg.switch.costDiv) / cfg.switch.costDiv));
  expect(back.st.glimmer.points).toBe(12);
});

test('Pledge desks are gone; Rook says not yet until the crates, and a battle blocks the offer', async ({ page }) => {
  const save = starterSave();
  save.world = { map: 'fernbrook', x: 5, y: 6, facing: 'up', respawn: 'fernbrook' };
  await installSave(page.context(), save, { quietDay: true });
  await gotoDebug(page);
  const cfg = await page.evaluate(() => PixelPets.standingCfg());
  expect(await page.evaluate(() => typeof PixelPets.pledgeDesk)).toBe('undefined');
  expect(await page.evaluate(() => PixelPets.standing.canSwitch)).toBe(false);
  expect(await page.evaluate(() => PixelPets.rookOffer('glimmer'))).toBe(true);
  await page.waitForFunction(() => { const s = window.PixelPets.scene; return s && s.mode === 'say' && s.full; });
  expect(await page.evaluate(() => PixelPets.scene.text)).toBe(cfg.switch.rook.notYet);
  await playScene(page);
  await page.evaluate(() => { PixelPets.setFlag('story.met_glimmerwell', true); PixelPets.showTab('walk'); PixelPets.goto('fernbrook', 14, 7, 'up'); });
  await page.waitForFunction(() => !window.PixelPets.fading);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => { const s = window.PixelPets.scene; return s && s.full; });
  expect(await page.evaluate(() => PixelPets.scene.mode)).toBe('say');
  await playScene(page, []);
  await page.evaluate(() => { PixelPets.setFlag('story.side_pick_done', true); PixelPets.setSide('keepers'); });
  await page.keyboard.press('Space');
  await page.waitForFunction(() => { const s = window.PixelPets.scene; return s && s.full; });
  expect(await page.evaluate(() => PixelPets.scene.mode)).toBe('say');
  await playScene(page, []);
  await page.evaluate(() => { PixelPets.setSide('glimmer'); PixelPets.goto('fb_lantern_in', 6, 4, 'up'); });
  await page.waitForFunction(() => !window.PixelPets.fading);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => { const s = window.PixelPets.scene; return s && s.full && s.waiting; });
  await page.keyboard.press('Space');
  await page.waitForFunction(() => { const s = window.PixelPets.scene; return s && s.mode === 'choice' && s.full; });
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  const lantern = await page.locator('#sbChoices button').allTextContents();
  expect(lantern).toContain('Rest a while');
  expect(lantern.join('\n')).not.toContain('Pledge desk');
  await page.locator('#sbChoices button', { hasText: 'Leave' }).click();
  await page.waitForFunction(() => !window.PixelPets.scene);
  expect(await page.evaluate(() => PixelPets.forceBattle('tide/0', 3))).toBe(true);
  await page.waitForFunction(() => { const b = window.PixelPets.battle; return b && b.on && b.state === 'CHOOSE'; }, null, { timeout: 15000 });
  const inBattle = await page.evaluate(() => ({ offer: PixelPets.rookOffer('keepers'), can: PixelPets.standing.canSwitch }));
  expect(inBattle.offer).toBe(false);
  expect(inBattle.can).toBe(false);
});

test('STANDING tab: hidden before the pick, two rows after it, 44 px tabs, no overflow', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => { const b = document.querySelector('#questBtn'); return b && !b.hidden; });
  await page.locator('#questBtn').tap();
  await expect(page.locator('#ovQuest')).toBeVisible();
  await expect(page.locator('#questTabs')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovQuest')).toBeHidden();
  const cfg = await page.evaluate(() => PixelPets.standingCfg());
  await page.evaluate((T) => { PixelPets.setFlag('story.side_pick_done', true); PixelPets.setSide('glimmer'); PixelPets.setStanding('keepers', 7); PixelPets.setStanding('glimmer', T[2] + 3); }, cfg.thresholds);
  await page.locator('#questBtn').tap();
  await expect(page.locator('#ovQuest')).toBeVisible();
  await expect(page.locator('#questTabs')).toBeVisible();
  const tabs = await page.evaluate(() => [...document.querySelectorAll('.q-tab')].map((b) => { const r = b.getBoundingClientRect(); return { text: b.textContent, h: r.height, w: r.width }; }));
  expect(tabs.length).toBe(2);
  expect(tabs[1].text).toBe(cfg.tab.label);
  for (const t of tabs) { expect(t.h).toBeGreaterThanOrEqual(44); expect(t.w).toBeGreaterThanOrEqual(44); }
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  await page.locator('#questTabStanding').tap();
  await expect(page.locator('#questPaneStanding')).toBeVisible();
  await expect(page.locator('#questPaneNext')).toBeHidden();
  await expect(page.locator('#questMap')).toBeHidden();
  const view = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.st-row')].map((r) => ({
      side: r.dataset.side, pledged: r.classList.contains('pledged'), emblem: !!r.querySelector('canvas.st-emblem'),
      tier: r.querySelector('.st-tier').textContent, blurb: r.querySelector('.st-blurb').textContent,
      bar: r.querySelector('.bar i').style.width, mark: (r.querySelector('.st-mark') || {}).textContent || null,
      rect: (() => { const b = r.getBoundingClientRect(); return { x: b.x, right: b.right, bottom: b.bottom }; })(),
    }));
    const inner = document.querySelector('.quest-inner');
    return { rows, title: document.querySelector('#questTitle').textContent, pledged: document.querySelector('#stPledged').textContent, explain: document.querySelector('#stExplain').textContent,
      overflowX: inner.scrollWidth > inner.clientWidth + 1, innerRight: inner.getBoundingClientRect().right, vw: window.innerWidth, vh: window.innerHeight,
      emblemPx: (() => { const c = document.querySelector('.st-row[data-side="keepers"] canvas'); const d = c.getContext('2d').getImageData(0, 0, 8, 8).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; })() };
  });
  expect(view.title).toBe(cfg.tab.label);
  expect(view.rows.map((r) => r.side)).toEqual(['keepers', 'glimmer']);
  expect(view.rows[0].tier).toBe(cfg.sides.keepers.tiers[0].name);
  expect(view.rows[0].blurb).toBe(cfg.sides.keepers.tiers[0].blurb);
  expect(view.rows[0].bar).toBe(Math.round(7 / cfg.thresholds[1] * 100) + '%');
  expect(view.rows[1].tier).toBe(cfg.sides.glimmer.tiers[2].name);
  expect(view.rows[1].pledged).toBe(true);
  expect(view.rows[1].mark).toBe(cfg.tab.marker);
  expect(view.rows[0].pledged).toBe(false);
  expect(view.rows[0].mark).toBeNull();
  expect(view.rows.every((r) => r.emblem)).toBe(true);
  expect(view.emblemPx).toBe(cfg.art.emblem_keepers.join('').replace(/\./g, '').length);
  expect(view.pledged).toBe(cfg.tab.pledged.replace('{faction}', cfg.sides.glimmer.name));
  expect(view.explain).toBe(cfg.tab.explain);
  expect(view.overflowX).toBe(false);
  expect(view.innerRight).toBeLessThanOrEqual(view.vw + 1);
  for (const r of view.rows) { expect(r.rect.x).toBeGreaterThanOrEqual(0); expect(r.rect.right).toBeLessThanOrEqual(view.vw + 1); expect(r.rect.bottom).toBeLessThanOrEqual(view.vh + 1); }
  await page.evaluate(() => { const t = document.querySelector('#toast'); t.style.transition = 'none'; t.classList.remove('show'); });   // the debug setStanding toast, not part of the tab
  await expect(page.locator('#toast')).toHaveCSS('opacity', '0');
  await shot(page, 'standing-tab');
  // back to NEXT STEP, and the empty line when nobody has any Standing
  await page.locator('#questTabNext').tap();
  await expect(page.locator('#questPaneNext')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => { PixelPets.setStanding('keepers', 0); PixelPets.setStanding('glimmer', 0); });
  await page.locator('#questBtn').tap();
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  await page.locator('#questTabStanding').tap();
  expect(await page.locator('#stPledged').textContent()).toBe(cfg.tab.empty);
});

// The designer's rows (GLIMMER_PATH v0.2), copied here so the shipped copy is checked against the spec.
const COPY = {
  wake: ['Good morning! Look around your room, then read the note by the door.', 'Hearthmoor, home'],
  lodge: ["Someone small is waiting at the Warden's Lodge. Ilse has a Walkling for you.", "Warden's Lodge"],
  rival1: ['Rook is bouncing by the east gate. Go and say hello.', 'Hearthmoor, east gate'],
  first_wild: ['A wild Walkling is nosing through the grass by the east path. Walk up gently.', 'Hearthmoor, east path'],
  route1: ['Route 1 starts past the east gate. Take your Walkling for a stroll.', 'Hearthmoor, east path'],
  fernbrook: ["Follow the stream east along Route 1. Fernbrook's orchards are at the far end.", 'Route 1, east end'],
  glimmer: ["There's a shiny new stand in the square. See what all the fuss is about.", 'Fernbrook square'],
  fen: ['Master Fen is out in the orchard, west of the square. She looks worried.', 'Fernbrook orchard'],
  heights: ['Get to know us. North in the Heights, Walklings are moved at night. Stock up first.', 'Fernbrook Heights', 'Get to know us. Copy Atten from RegenX. A floating computer woke in the top bay.', 'Fernbrook Heights'],
  orchard: ['Tobin is stacking crates by the orchard gate. Help the Pomlets out.', 'Orchard gate', 'Tobin needs a hand packing crates at the orchard gate.', 'Orchard gate'],
  hall1: ['The Trial Hall doors are open. Challenge Master Fen for the Fernbrook Seal.', 'Fernbrook Trial Hall', "Juniper's partnership tour ends at the Trial Hall. Fen's match is optional.", 'Fernbrook Trial Hall'],
  teaser: ['Rook has news, waiting outside the Trial Hall.', 'Trial Hall doorstep', 'Rook is lurking outside the Trial Hall. Probably about Bright of the Month.', 'Trial Hall doorstep'],
  route2: ['The rubble east of Fernbrook is cleared. Route 2 is waiting.', 'Fernbrook, east edge'],
  census: ['Follow Route 2 east. Glimmerwell has set something up halfway along.', 'Route 2, halfway', 'The Glow Census tent is halfway along Route 2. They need volunteers.', 'Route 2, halfway'],
  glen: ['A little path heads north off Route 2, into Wickerglen.', 'Route 2, north path'],
  lead: ['Find Field Lead Imogen among the lamps in Wickerglen.', 'Wickerglen', 'Report to Field Lead Imogen among the lamps in Wickerglen.', 'Wickerglen'],
  glen_cleared: ['The Comfort Lamps hum oddly. Battle Field Lead Imogen beneath them.', 'Wickerglen lamps', 'Imogen wants to see your team in action, right under the Comfort Lamps.', 'Wickerglen lamps'],
  route2_end: ['Rook is waiting by the gate at the east end of Route 2.', 'Route 2, east gate'],
  cobblecrest: ['The gate is open. Cobblecrest is just to the east.', 'Route 2, east gate'],
  cobble_arrive: ["Rook is waiting just inside Cobblecrest's west gate.", 'Cobblecrest, west gate'],
  quarry: ["There's an open house at the quarry, up the north road.", 'Cobblecrest, north road'],
  buyout: ["Walk up to the stage. Rook's supervisor is about to speak.", 'Quarry stage', 'Join Dorian Pell on the stage. Big day for the quarry!', 'Quarry stage'],
  hall2: ["Hale's Hall is open. Challenge Master Hale for the Cobblecrest Seal.", 'Cobblecrest Hall', 'Your second review is a Sacrifice. The free quota still closes it.', 'Cobblecrest Hall'],
  hook: ['Rook is outside the Hall with news from the quarry.', "Outside Hale's Hall", 'Rook is by the Brinewick cart. He is staying with Glimmerwell.', "Outside Hale's Hall"],
  hc_council: ['High Charity called a Lantern Council. Bring both Seals to Sky-Dock Command.', 'High Charity, sky-dock'],
  end: ["That's all for now. Explore, fill the Journal, and grow your friendships.", 'The Amberwild'],
};

test('quest copy: every step shows the designer text on both sides; lengths and dev check hold', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoDebug(page);
  const seen = await page.evaluate(() => {
    const Q = window.PPQuests, out = { ids: Q.CHAIN.map((e) => e.id), check: Q.devCheck(MAPDATA), rows: {} };
    // step i is current once the previous step's done flags hold (later progress implies the earlier steps)
    Q.CHAIN.forEach((e, i) => {
      const flags = {}; if (i > 0) for (const c of Q.CHAIN[i - 1].done) flags[c] = true;
      for (const c of e.when || []) {
        if (c[0] === '!') continue;
        const eq = c.indexOf('=');
        if (eq >= 0) flags[c.slice(0, eq)] = c.slice(eq + 1);
        else flags[c] = true;
      }
      const st = (side) => ({ flags: Object.assign({ 'story.side': side }, flags), seals: {}, pets: 1 });
      const k = Q.current(st('keepers')), g = Q.current(st('glimmer'));
      out.rows[e.id] = { kid: k && k.id, ktext: k && k.text, kplace: k && k.place, gid: g && g.id, gtext: g && g.text, gplace: g && g.place };
    });
    return out;
  });
  expect(seen.check).toEqual([]);
  expect(seen.ids).toEqual(Object.keys(COPY));
  let overrides = 0;
  for (const [id, row] of Object.entries(COPY)) {
    const r = seen.rows[id];
    expect(r.kid, id).toBe(id);
    expect(r.ktext, id).toBe(row[0]);
    expect(r.kplace, id).toBe(row[1]);
    if (id === 'hc_council') {
      expect(r.gid, id).toBe('end');
      expect(r.gtext).toBe(COPY.end[0]);
      expect(r.gplace).toBe(COPY.end[1]);
    } else {
      expect(r.gid, id).toBe(id);
      expect(r.gtext, id + '@glimmer').toBe(row[2] || row[0]);
      expect(r.gplace, id + '@glimmer').toBe(row[3] || row[1]);
    }
    if (row[2]) overrides++;
    for (const t of [row[0], row[2]].filter(Boolean)) expect(Array.from(t).length, id).toBeLessThanOrEqual(110);
    for (const p of [row[1], row[3]].filter(Boolean)) expect(Array.from(p).length, id).toBeLessThanOrEqual(24);
  }
  expect(overrides).toBe(10);
  // and the panel itself shows the side's text (keepers, then glimmer) for the orchard step
  await page.evaluate(() => { PixelPets.setFlag('story.met_fen', true); PixelPets.setFlag('story.reached_fernbrook', true); PixelPets.setFlag('story.met_glimmerwell', true); PixelPets.showTab('walk'); });
  await page.waitForFunction(() => { const b = document.querySelector('#questBtn'); return b && !b.hidden && window.PixelPets.quest.id === 'orchard'; });
  await page.locator('#questBtn').tap();
  expect(await page.locator('#questText').textContent()).toBe(COPY.orchard[0]);
  expect(await page.locator('#questPlace').textContent()).toBe(COPY.orchard[1]);
  await shot(page, 'quest-panel-keepers');
  await page.keyboard.press('Escape');
  await page.evaluate(() => { PixelPets.setFlag('story.side_pick_done', true); PixelPets.setSide('glimmer'); });
  await page.locator('#questBtn').tap();
  expect(await page.locator('#questText').textContent()).toBe(COPY.heights[2]);
  expect(await page.locator('#questPlace').textContent()).toBe(COPY.heights[3]);
  await shot(page, 'quest-panel-glimmer');
  await page.keyboard.press('Escape');
});

// The designer's icon_quest, and the untouched icon_map / icon_bag grids (byte-identical to the Build 1 values).
const ICON_QUEST = ['.yyyyy..', '.yyyyyy.', '.yyyyyyy', '.yyyyyy.', '.yyyyy..', '...oo...', '...oo...', '.wwwwww.'];
const ICON_MAP = ['wwwhhrwr', 'wwwhhwrw', 'wwwhhrwr', 'wwwhrwww', 'wwwhhwww', 'wwrhhwww', 'wrwhhwww', 'wwwhhwww'];
const ICON_BAG = ['..oooo..', '.o....o.', 'rrrrrrrr', 'rorrrror', 'rryyyyrr', 'rryrryrr', 'prrrrrrp', '.pppppp.'];
const PAL_HEX = { y: '#ffcd75', o: '#ef7d57', w: '#f4f4f4', h: '#94b0c2', r: '#b13e53', p: '#5d275d' };

test('the quest icon is the delivered signpost and the other d-pad icons are unchanged', async ({ page }) => {
  await installSave(page.context(), starterSave(), { quietDay: true });
  await gotoGame(page);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => { const b = document.querySelector('#questBtn'); return b && !b.hidden; });
  const grids = await page.evaluate(() => {
    const read = (sel) => { const c = document.querySelector(sel); const d = c.getContext('2d').getImageData(0, 0, 8, 8).data, rows = [];
      for (let y = 0; y < 8; y++) { let r = ''; for (let x = 0; x < 8; x++) { const i = (y * 8 + x) * 4; r += d[i + 3] ? '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('') + ',' : '.,'; } rows.push(r); } return rows; };
    return { quest: read('#questBtn canvas'), map: read('#mapBtn canvas'), bag: read('#walkBagBtn canvas'), size: (() => { const r = document.querySelector('#questBtn canvas').getBoundingClientRect(); return { w: r.width, h: r.height }; })() };
  });
  const expand = (grid) => grid.map((row) => [...row].map((ch) => (ch === '.' ? '.' : PAL_HEX[ch])).join(',') + ',');
  expect(grids.quest).toEqual(expand(ICON_QUEST));
  expect(grids.map).toEqual(expand(ICON_MAP));
  expect(grids.bag).toEqual(expand(ICON_BAG));
  expect(grids.size.w).toBeGreaterThanOrEqual(16);   // drawn at least 2x on the button (reads at 24 px on the dark cell)
  await shot(page, 'quest-icon');
});
