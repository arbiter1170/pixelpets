// MODERN_HUD_CLEAR dock (D778/D789): portrait modern walk, 156 px dock, no HUD over the map.
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.settings.follower = false;
  s.settings.tips = false;
  s.settings.textSpeed = 'fast';
  s.flags['story.phone_got'] = true;
  s.flags['story.early_done'] = true;
  s.flags['story.tutorial_done'] = true;
  s.money = 40;
  return s;
}

async function boot(page) {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
}

test('portrait modern dock: chip in row 1, buttons 44 px, 0 px over the map', async ({ page }, info) => {
  const w = page.viewportSize().width;
  test.skip(w > page.viewportSize().height, 'dock is portrait only');
  await boot(page);
  // Frame class is on automatically in modern portrait walk; force it for certainty.
  await page.evaluate(() => { if (window.PixelPets && PixelPets.setHudPads) PixelPets.setHudPads(true); });
  await page.waitForFunction(() => document.body.classList.contains('mhc-frame') && document.querySelector('#fcDock') && !document.querySelector('#fcDock').hidden);

  const d = await page.evaluate(() => {
    const r = el => {
      if (!el || el.hidden) return null;
      const b = el.getBoundingClientRect();
      if (!(b.width >= 8 && b.height >= 8)) return null;
      return { x: b.left, y: b.top, w: b.width, h: b.height, right: b.right, bottom: b.bottom };
    };
    const mw = r(document.querySelector('#mapCanvas'));
    const dock = r(document.querySelector('#fcDock'));
    const chip = r(document.querySelector('#thChip'));
    const gear = r(document.querySelector('#gearFloat'));
    const phone = r(document.querySelector('#phoneBtn'));
    const quest = r(document.querySelector('#questBtn'));
    const partner = r(document.querySelector('#petFloat'));
    const strip = r(document.querySelector('#petStrip'));
    const tip = document.querySelector('#fcTip');
    const overs = [];
    for (const [id, br] of [['thChip', chip], ['gearFloat', gear], ['phoneBtn', phone], ['questBtn', quest], ['petFloat', partner], ['petStrip', strip]]) {
      if (!br || !mw) continue;
      const ox = Math.max(0, Math.min(br.right, mw.right) - Math.max(br.x, mw.x));
      const oy = Math.max(0, Math.min(br.bottom, mw.bottom) - Math.max(br.y, mw.y));
      if (ox > 1 && oy > 1) overs.push({ id, ox, oy });
    }
    return {
      frame: document.body.classList.contains('mhc-frame'),
      modern: document.body.classList.contains('ctl-modern'),
      map: mw, dock, chip, gear, phone, quest, partner, strip,
      tipShown: !!(tip && tip.offsetParent),
      overs,
      chipParent: document.querySelector('#thChip') && document.querySelector('#thChip').parentElement.id,
      questParent: document.querySelector('#questBtn') && document.querySelector('#questBtn').parentElement.id,
    };
  });

  expect(d.modern).toBe(true);
  expect(d.frame).toBe(true);
  expect(d.dock).toBeTruthy();
  expect(d.dock.h).toBeGreaterThanOrEqual(150);
  expect(d.chipParent).toBe('fcDockChip');
  expect(d.questParent).toBe('fcDockR2Left');
  expect(d.chip.h).toBeGreaterThanOrEqual(44);
  expect(d.chip.w).toBeGreaterThanOrEqual(44);
  expect(d.gear.h).toBeGreaterThanOrEqual(44);
  expect(d.quest.h).toBeGreaterThanOrEqual(44);
  expect(d.partner.h).toBeGreaterThanOrEqual(44);
  expect(d.tipShown).toBe(false);
  expect(d.overs).toEqual([]);
  expect(d.chip.x).toBeLessThan(d.phone.x);
  expect(d.phone.x).toBeLessThan(d.gear.x);
  expect(d.quest.x).toBeLessThan(d.partner.x);
  expect(d.map.bottom).toBeLessThanOrEqual(d.dock.y + 2);
});

test('portrait modern dock: toast stays in the chip slot and a new step cues once', async ({ page }) => {
  const w = page.viewportSize().width;
  test.skip(w > page.viewportSize().height, 'dock is portrait only');
  await boot(page);
  await page.evaluate(() => { if (window.PixelPets && PixelPets.setHudPads) PixelPets.setHudPads(true); });
  await page.waitForFunction(() => document.body.classList.contains('mhc-frame'));

  const slot = await page.evaluate(() => {
    PixelPets.debugToast('Found 3 Hearty Snacks!');
    const toast = document.querySelector('#toast');
    const acorns = document.querySelector('#fcAcorns');
    const chip = document.querySelector('#thChip');
    const hour = document.querySelector('#thHour');
    const quest = document.querySelector('#questBtn');
    const dock = document.querySelector('#fcDock');
    const map = document.querySelector('#mapCanvas');
    const tr = toast.getBoundingClientRect();
    const ar = acorns.getBoundingClientRect();
    const cr = chip.getBoundingClientRect();
    const hr = hour.getBoundingClientRect();
    const qr = quest.getBoundingClientRect();
    const dr = dock.getBoundingClientRect();
    const mr = map.getBoundingClientRect();
    const overlap = (a, b) => a && b && Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) > 1
      && Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) > 1;
    return {
      text: toast.textContent,
      shown: toast.classList.contains('show'),
      pe: getComputedStyle(toast).pointerEvents,
      overAcorns: overlap(tr, ar),
      overChip: overlap(tr, cr),
      overHour: overlap(tr, hr),
      overQuest: overlap(tr, qr),
      overMap: overlap(tr, mr),
      inDock: tr.top >= dr.top - 1 && tr.bottom <= dr.bottom + 1,
    };
  });
  expect(slot.shown).toBe(true);
  expect(slot.text).toBe('Found 3 Hearty Snacks!');
  expect(slot.pe).toBe('none');
  expect(slot.overAcorns).toBe(false);
  expect(slot.overChip).toBe(false);
  expect(slot.overHour).toBe(false);
  expect(slot.overQuest).toBe(false);
  expect(slot.overMap).toBe(false);
  expect(slot.inDock).toBe(true);

  const step = await page.evaluate(() => {
    const before = document.querySelector('#toast').textContent;
    PixelPets.setFlag('story.rival1_done', true);
    PixelPets.giveXp(0);
    return { before, after: document.querySelector('#toast').textContent, quest: document.querySelector('#questText') ? true : false };
  });
  expect(step.after).toBe(step.before);
  await page.waitForFunction(() => (document.querySelector('#toast').textContent || '').indexOf('New step:') === 0, null, { timeout: 8000 });
  const card = await page.evaluate(() => {
    document.querySelector('#questBtn').click();
    const hint = document.querySelector('#questHint');
    const text = document.querySelector('#questText').textContent;
    return { text, hint: hint && !hint.hidden ? hint.textContent : '' };
  });
  expect(card.text.length).toBeGreaterThan(20);
  expect(card.hint).toContain('east gate');
  await page.locator('#questClose').click();
  await page.waitForFunction(() => !document.querySelector('#toast').classList.contains('show'), null, { timeout: 8000 });
  const paged = await page.evaluate(() => {
    PixelPets.debugToast(('North ').repeat(40).trim());
    return document.querySelector('#toast').textContent;
  });
  expect(paged.endsWith('...'), paged).toBe(true);
  expect(paged.includes('east path opens again today'), paged).toBe(false);
});

test('portrait modern dock: care tray toast sits in the tray band', async ({ page }) => {
  const w = page.viewportSize().width;
  test.skip(w > page.viewportSize().height, 'dock is portrait only');
  await boot(page);
  await page.evaluate(() => { if (window.PixelPets && PixelPets.setHudPads) PixelPets.setHudPads(true); });
  await page.locator('#petStrip').click();
  await page.waitForFunction(() => document.body.classList.contains('ct-open'));
  const d = await page.evaluate(() => {
    PixelPets.careAct('feed');
    const toast = document.querySelector('#toast').getBoundingClientRect();
    const tray = document.querySelector('#careTray').getBoundingClientRect();
    const close = document.querySelector('#ctClose').getBoundingClientRect();
    const feed = document.querySelector('#careTray .btn-feed').getBoundingClientRect();
    const map = document.querySelector('#mapCanvas').getBoundingClientRect();
    const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) > 1
      && Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) > 1;
    return {
      feedH: feed.height,
      closeH: close.height,
      overMap: overlap(toast, map),
      overClose: overlap(toast, close),
      inTray: toast.top >= tray.top - 2 && toast.bottom <= tray.top + 48,
      text: document.querySelector('#toast').textContent,
    };
  });
  expect(d.feedH).toBeGreaterThanOrEqual(44);
  expect(d.closeH).toBeGreaterThanOrEqual(44);
  expect(d.overMap).toBe(false);
  expect(d.overClose).toBe(false);
  expect(d.inTray).toBe(true);
  expect(d.text.length).toBeGreaterThan(0);
});

// Hotfix (Oct 27, 2026): in scenes the dock keeps z 12 so the gear stays above the scene layer (NAV_MODERN G3), and its opaque
// band covered the scene text box (z 9). The box now sits above the dock. G3: with no partner yet (the opening scene) the gear
// still takes taps; with a partner, gearBlocked() locks it during scenes as before.
async function bootScene(page, pets) {
  const s = save();
  if (!pets) { s.party = []; s.partnerId = null; delete s.flags['story.starter_received']; }
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.waitForFunction(() => document.querySelector('#mapCanvas').width > 0);
  await page.evaluate(() => { if (window.PixelPets && PixelPets.setHudPads) PixelPets.setHudPads(true); });
  await page.waitForFunction(() => document.body.classList.contains('mhc-frame'));
  expect(await page.evaluate(() => PixelPets.runScene('gate_home'))).toBe(true);
  await page.waitForFunction(() => !document.querySelector('#ovScene').hidden && document.querySelector('#sbText').textContent.length > 10);
  return page.evaluate(() => {
    const box = document.querySelector('#sbox').getBoundingClientRect();
    const dock = document.querySelector('#floatCtl').getBoundingClientRect();
    const gear = document.querySelector('#gearFloat').getBoundingClientRect();
    const hit = document.elementFromPoint(gear.left + gear.width / 2, gear.top + gear.height / 2);
    const seen = el => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
    return { boxTop: box.top, boxBottom: box.bottom, dockTop: dock.top, locked: document.body.classList.contains('gear-locked'),
      gearHit: !!(hit && (hit.id === 'gearFloat' || hit.closest('#gearFloat'))),
      gearSeen: seen(document.querySelector('#gearFloat')), phoneSeen: seen(document.querySelector('#phoneBtn')), questSeen: seen(document.querySelector('#questBtn')) };
  });
}

for (const pets of [false, true]) {
  test(`portrait modern dock: a scene text box sits above the dock (${pets ? 'with a partner: gear locked' : 'opening scene: gear takes taps'})`, async ({ page }) => {
    const w = page.viewportSize().width;
    test.skip(w > page.viewportSize().height, 'dock is portrait only');
    const d = await bootScene(page, pets);
    expect(d.boxBottom).toBeLessThanOrEqual(d.dockTop + 1);
    expect(d.boxTop).toBeGreaterThanOrEqual(0);
    expect(d.locked).toBe(pets);
    expect(d.gearHit).toBe(!pets);
    expect(d.gearSeen).toBeGreaterThan(0.9);       // G3: the gear stays shown in scenes
    expect(d.phoneSeen).toBeLessThan(0.1);         // the rest of the dock fades as before
    expect(d.questSeen).toBeLessThan(0.1);
  });
}
