/* PARTNER_UI D245–D257. Acceptance in the settled packet, sections 1–20. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

function saveWith(extra, settings) {
  const s = starterSave();
  s.player.name = 'Wayfarer';
  s.flags['story.phone_got'] = true;
  s.settings.controls = 'modern';
  if (extra) Object.assign(s.party[0], extra);
  if (settings) Object.assign(s.settings, settings);
  return s;
}

async function boot(page, extra, search, settings) {
  await installSave(page.context(), saveWith(extra, settings), { quietDay: true });
  await gotoGame(page, search || '');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state && window.PixelPets.state.party[0]);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

const rgbAt = (page, sel, x, y) => page.evaluate(({ sel, x, y }) => {
  const c = document.querySelector(sel);
  const d = c.getContext('2d').getImageData(x, y, 1, 1).data;
  return { w: c.width, h: c.height, glyph: c.dataset.glyph || '', rgb: [d[0], d[1], d[2], d[3]] };
}, { sel, x, y });

function near(got, want, tol) {
  return Math.abs(got - want) <= tol;
}

test('lower card has five bars, the spec icons, and the card rects', async ({ page }) => {
  await boot(page, { hunger: 78, happy: 99, energy: 85, xp: 40, stage: 1 });
  const W = page.viewportSize().width;
  const keys = ['hp', 'food', 'joy', 'nrg', 'grow'];
  const card = {
    320: { hp: [54, 66, 14.8], food: [84.8, 100.8, 14.8], joy: [119.6, 131.6, 14.8], nrg: [150.4, 162.4, 14.8], grow: [181.2, 193.2, 14.8] },
    390: { hp: [54, 66, 28.8], food: [98.8, 114.8, 28.8], joy: [147.6, 159.6, 28.8], nrg: [192.4, 204.4, 28.8], grow: [237.2, 249.2, 28.8] },
  }[W];
  const lay = await page.evaluate(() => {
    const strip = document.querySelector('#petStrip');
    const r = el => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
    const keys = ['hp', 'food', 'joy', 'nrg', 'grow'];
    const bars = keys.map(k => {
      const icon = strip.querySelector('.ico-' + k);
      const bar = strip.querySelectorAll('.ps-bar')[keys.indexOf(k)];
      const fill = bar.querySelector('i');
      return { icon: r(icon), bar: r(bar), low: fill.classList.contains('low'), warn: fill.classList.contains('warn') };
    });
    const name = strip.querySelector('.ps-top');
    const pet = document.querySelector('#petFloat').getBoundingClientRect();
    const sr = strip.getBoundingClientRect();
    return {
      h: sr.height, rightGap: pet.left - sr.right,
      overflow: strip.scrollWidth > strip.clientWidth + 1,
      nameH: name.getBoundingClientRect().height,
      aria: strip.getAttribute('aria-label'),
      growW: document.querySelector('#stripGrow').style.width,
      foodW: document.querySelector('#stripFood').style.width,
      bars,
      iconsBlink: !!strip.querySelector('canvas.low, canvas.ps-ico.low'),
    };
  });
  expect(lay.h).toBeGreaterThanOrEqual(43);
  expect(lay.h).toBeLessThanOrEqual(45);
  expect(Math.abs(lay.rightGap - 6)).toBeLessThanOrEqual(1);
  expect(lay.overflow).toBe(false);
  expect(lay.nameH).toBeLessThan(24);
  expect(lay.aria).toBe('Partner Emberfox, Lv 5. HP 37 of 37, Food 78, joy 99, energy 85, grow 5 of 24.');
  expect(parseFloat(lay.growW)).toBeCloseTo(100 * 64 / 2116, 2);
  expect(parseFloat(lay.foodW)).toBeCloseTo(78, 2);
  expect(lay.iconsBlink).toBe(false);
  lay.bars.forEach(b => expect(b.low).toBe(false));
  if (card) {
    keys.forEach((k, i) => {
      const [ix, bx, bw] = card[k];
      expect(near(lay.bars[i].icon.x, ix, 1), k + ' icon x ' + lay.bars[i].icon.x).toBe(true);
      expect(near(lay.bars[i].bar.x, bx, 1), k + ' bar x ' + lay.bars[i].bar.x).toBe(true);
      expect(near(lay.bars[i].bar.w, bw, 1), k + ' bar w ' + lay.bars[i].bar.w).toBe(true);
      expect(lay.bars[i].bar.w).toBeGreaterThanOrEqual(14);
      expect(near(lay.bars[i].icon.w, k === 'food' ? 14 : 10, 0.5)).toBe(true);
      expect(lay.bars[i].low).toBe(false);
    });
    expect(lay.bars[0].warn).toBe(false);
    expect(lay.bars[0].icon.x).toBeLessThan(lay.bars[1].icon.x);
  }
  const hpMark = await rgbAt(page, '#petStrip .ico-hp', 0, 0);
  const hpCore = await rgbAt(page, '#petStrip .ico-hp', 2, 2);
  const food = await rgbAt(page, '#petStrip .ico-food', 3, 0);
  const leaf = await rgbAt(page, '#petStrip .ico-food', 4, 0);
  const joy = await rgbAt(page, '#petStrip .ico-joy', 1, 0);
  const nrg = await rgbAt(page, '#petStrip .ico-nrg', 3, 0);
  const grow = await rgbAt(page, '#petStrip .ico-grow', 2, 0);
  expect(hpMark).toMatchObject({ w: 5, h: 5, glyph: 'ico_hp', rgb: [167, 240, 112, 255] });
  expect(hpCore.rgb).toEqual([244, 244, 244, 255]);
  expect(food).toMatchObject({ w: 7, h: 7, glyph: 'ico_food', rgb: [86, 108, 134, 255] });
  expect(leaf.rgb).toEqual([56, 183, 100, 255]);
  expect(joy).toMatchObject({ w: 5, h: 5, glyph: 'ico_joy', rgb: [177, 62, 83, 255] });
  expect(nrg).toMatchObject({ w: 5, h: 5, glyph: 'ico_nrg', rgb: [115, 239, 247, 255] });
  expect(grow).toMatchObject({ w: 5, h: 5, glyph: 'ico_grow' });
  expect(grow.rgb[3]).toBe(255);
  if (W === 390) await page.locator('#petStrip').screenshot({ path: path.join(artifactsDir(), 'partner_lower_card_390.png') });
});

test('a low FOOD bar blinks and GROW does not, and the strip opens the care tray @w1', async ({ page }) => {
  await boot(page, { hunger: 10, happy: 10, energy: 10, xp: 10, stage: 0, hpNow: 1 });
  await page.locator('#petStrip').click();
  await expect(page.locator('#careTray')).toBeVisible();
  await page.locator('#ctStats').click();
  await expect(page.locator('#ovStats')).toBeVisible();
  const low = await page.evaluate(() => ({
    food: document.querySelector('#stripFood').classList.contains('low'),
    joy: document.querySelector('#stripJoy').classList.contains('low'),
    nrg: document.querySelector('#stripNrg').classList.contains('low'),
    grow: document.querySelector('#stripGrow').classList.contains('low'),
    hpWarn: document.querySelector('#stripHp').classList.contains('warn'),
    hpLow: document.querySelector('#stripHp').classList.contains('low'),
    screen: document.body.dataset.screen,
  }));
  expect(low.food && low.joy && low.nrg).toBe(true);
  expect(low.grow).toBe(false);
  expect(low.hpWarn).toBe(true);
  expect(low.hpLow).toBe(false);
  expect(low.screen).toBe('walk');
});

test('icons match the grids, and the alert badges stay off the card and PARTNER @w1', async ({ page }) => {
  await boot(page);
  const glyphs = await page.evaluate(() => ({
    food: GLYPH.ico_food.slice(),
    joy: GLYPH.ico_joy.slice(),
    nrg: GLYPH.ico_nrg.slice(),
    grow: GLYPH.ico_grow.slice(),
    pencil: GLYPH.ico_pencil.slice(),
    apple: GLYPH.apple.slice(),
    heart: GLYPH.heart.slice(),
    badge_food: GLYPH.badge_food.slice(),
    badge_rest: GLYPH.badge_rest.slice(),
    used: [...document.querySelectorAll('#petStrip canvas, #scr-pet canvas, #statStrip canvas')].map(c => c.dataset.glyph),
  }));
  expect(glyphs.food).toEqual(['...mgg.', '...m...', '.rr.rr.', 'rwrrrrr', 'rwrrrrr', 'rrrrrrr', '.rr.rr.']);
  expect(glyphs.joy).toEqual(['.r.r.', 'rwrrr', 'rrrrr', '.rrr.', '..r..']);
  expect(glyphs.nrg).toEqual(['...ss', '..ss.', '.ssss', '..ss.', '.s...']);
  expect(glyphs.grow).toEqual(['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.']);
  expect(glyphs.pencil).toEqual(['....r', '...yr', '..yy.', '.yy..', 'h....']);
  expect(glyphs.apple).toEqual(['..t..', '.rrr.', 'rrrwr', 'rrrrr', '.rrr.']);
  expect(glyphs.heart).toEqual(['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..']);
  expect(glyphs.badge_food).toEqual(['.....', 'y.y.y', 'ooooo', '.ooo.', '..o..']);
  expect(glyphs.badge_rest).toEqual(['wwww.', '..w..', '.w...', 'wwww.', '.....']);
  expect(glyphs.used).not.toContain('badge_food');
  expect(glyphs.used).not.toContain('badge_rest');
});

test('PARTNER strip icons and body icons, and 320 fits without scrolling', async ({ page }) => {
  await boot(page, { stage: 1, xp: 40 });
  await page.evaluate(() => PixelPets.showTab('pet'));
  const W = page.viewportSize().width;
  const info = await page.evaluate(() => {
    const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
    const scr = document.querySelector('#scr-pet');
    const care = scr.querySelector('.actions:last-of-type');
    const btns = ['#petStatsBtn', '#petKitBtn', '[data-act="feed"]', '[data-act="play"]', '[data-act="rest"]'].map(s => {
      const el = document.querySelector(s);
      const b = el.getBoundingClientRect();
      return { h: b.height, t: parseFloat(getComputedStyle(el).fontSize), on: b.bottom <= scr.getBoundingClientRect().bottom + 1 && b.top >= scr.getBoundingClientRect().top - 1 };
    });
    return {
      stripHidden: getComputedStyle(document.querySelector('#statStrip')).display === 'none',
      nrg: r(document.querySelector('#scr-pet .stat:has(#barEnergyPet) .ico-nrg')),
      grow: r(document.querySelector('#scr-pet .stat:has(#barXpPet) .ico-grow')),
      food: document.querySelector('.stats .ico-food').dataset.glyph,
      joy: document.querySelector('.stats .ico-joy').dataset.glyph,
      feed: document.querySelector('[data-act="feed"] canvas').dataset.glyph,
      play: document.querySelector('[data-act="play"] canvas').dataset.glyph,
      rest: document.querySelector('[data-act="rest"] canvas').dataset.glyph,
      heal: document.querySelector('[data-act="heal"] canvas').dataset.glyph,
      scroll: scr.scrollHeight - scr.clientHeight,
      btns,
      hint: document.querySelector('#evoHint').textContent,
      xp: document.querySelector('#valXp').textContent,
      bar: document.querySelector('#barXp').style.width,
      gear: document.querySelector('#petKitBtn').textContent.trim(),
      gearAria: document.querySelector('#petKitBtn').getAttribute('aria-label'),
    };
  });
  expect(info.food).toBe('ico_food');
  expect(info.joy).toBe('ico_joy');
  expect(info.feed).toBe('ico_food');
  expect(info.play).toBe('ico_joy');
  expect(info.rest).toBe('ico_nrg');
  expect(info.heal).toBe('ico_hp');
  expect(info.xp).toBe('5');
  expect(parseFloat(info.bar)).toBeCloseTo(100 * 64 / 2116, 2);
  expect(info.hint).toBe('Next form at Lv 24. Now Lv 5.');
  expect(info.gear).toBe('GEAR');
  expect(info.gearAria).toBe('Gear for Emberfox');
  expect(info.scroll).toBeLessThanOrEqual(1);
  expect(info.stripHidden).toBe(true);
  info.btns.forEach(b => { expect(b.h).toBeGreaterThanOrEqual(44); expect(b.on).toBe(true); });
  expect(info.nrg[2]).toBeGreaterThanOrEqual(8);
  expect(info.grow[2]).toBeGreaterThanOrEqual(8);
  if (W === 390) {
    const block = await page.locator('#scr-pet .care-block').boundingBox();
    const care = await page.locator('#scr-pet .actions.care4').boundingBox();
    await page.screenshot({
      path: path.join(artifactsDir(), 'partner_screen_390.png'),
      clip: { x: 0, y: block.y, width: 390, height: Math.min(care.y + care.height - block.y, 844 - block.y) },
    });
  }
});

test('arcade PARTNER at 320 keeps the care row on screen', async ({ page }) => {
  test.skip(page.viewportSize().width !== 320, '320 only');
  await boot(page, null, '', { controls: 'arcade' });
  await page.evaluate(() => PixelPets.showTab('pet'));
  const fit = await page.evaluate(() => {
    const ids = ['#barHpPet', '#barHunger', '#barHappy', '#petStatsBtn', '#petKitBtn', '[data-act="feed"]', '[data-act="play"]', '[data-act="rest"]', '[data-act="heal"]'];
    return {
      scroll: document.querySelector('#scr-pet').scrollHeight - document.querySelector('#scr-pet').clientHeight,
      on: ids.every(s => { const b = document.querySelector(s).getBoundingClientRect(); return b.height >= 16 && b.top >= -1 && b.bottom <= window.innerHeight + 1; }),
      tall: ['#petStatsBtn', '#petKitBtn', '[data-act="feed"]', '[data-act="play"]', '[data-act="rest"]', '[data-act="heal"]'].every(s => document.querySelector(s).getBoundingClientRect().height >= 44),
    };
  });
  expect(fit.scroll).toBeLessThanOrEqual(1);
  expect(fit.on).toBe(true);
  expect(fit.tall).toBe(true);
});

test('STATS popup is INTERACT and GEAR, and INTERACT returns to PARTNER', async ({ page }) => {
  await boot(page);
  await page.locator('#petStrip').click();
  await page.locator('#ctStats').click();
  const row = await page.evaluate(() => {
    const a = document.querySelector('#scRename');
    const g = document.querySelector('#scGear');
    const card = document.querySelector('#ovStats').innerText;
    const cs = el => getComputedStyle(el);
    return {
      at: a.textContent.trim(), gt: g.textContent.trim(),
      ah: a.getBoundingClientRect().height, gh: g.getBoundingClientRect().height,
      af: parseFloat(cs(a).fontSize), gf: parseFloat(cs(g).fontSize),
      play: g.classList.contains('btn-play'),
      aria: a.getAttribute('aria-label'),
      rename: /RENAME/.test(card),
      screen: document.body.dataset.screen,
    };
  });
  expect(row.at).toBe('INTERACT');
  expect(row.gt).toBe('GEAR');
  expect(row.ah).toBeGreaterThanOrEqual(56);
  expect(row.gh).toBeGreaterThanOrEqual(56);
  expect(row.af).toBe(22);
  expect(row.gf).toBe(22);
  expect(row.play).toBe(true);
  expect(row.aria).toBe('Care for Pipkit');
  expect(row.rename).toBe(false);
  expect(row.screen).toBe('walk');
  if (page.viewportSize().width === 390) {
    await page.locator('#ovStats .ov-inner').screenshot({ path: path.join(artifactsDir(), 'partner_stats_popup_390.png') });
  }
  await page.locator('#scRename').click();
  await expect(page.locator('#ovStats')).toBeHidden();
  await expect(page.locator('#scr-pet')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.screen)).toBe('pet');
});

test('a Walkling that is not the partner has no INTERACT', async ({ page }) => {
  await boot(page, null, '?debug=1');
  await page.evaluate(() => {
    PixelPets.fillParty();
    PixelPets.openStats(PixelPets.state.party[1].id);
  });
  await expect(page.locator('#ovStats')).toBeVisible();
  await expect(page.locator('#scRename')).toBeHidden();
  const span = await page.evaluate(() => {
    const acts = document.querySelector('#scActs');
    const gear = document.querySelector('#scGear').getBoundingClientRect();
    const box = acts.getBoundingClientRect();
    return { one: acts.classList.contains('one'), gear: gear.width, box: box.width };
  });
  expect(span.one).toBe(true);
  expect(span.gear).toBeGreaterThan(span.box * 0.8);
});

test('GEAR name row and the header pencil open the name editor', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('pet'));
  await page.locator('#petKitBtn').click();
  await expect(page.locator('#scGearBox')).toBeVisible();
  await expect(page.locator('#scNameBtn')).toContainText('Pipkit');
  const pencil = await page.locator('#scNameEdit').boundingBox();
  expect(pencil.height).toBeGreaterThanOrEqual(44);
  expect(await page.locator('#scNameEdit').getAttribute('aria-label')).toBe('Rename Pipkit');
  await page.locator('#scNameBtn').click();
  await expect(page.locator('#scNick')).toBeVisible();
  await page.locator('#scNickCancel').click();
  await expect(page.locator('#scNick')).toBeHidden();
  await page.locator('#scGear').click();
  await page.locator('#scName').click();
  await expect(page.locator('#scNick')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#scNick')).toBeHidden();
  await expect(page.locator('#ovStats')).toBeVisible();
});

test('PARTNER GEAR opens the gear view, and CLOSE stays on the current screen', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('pet'));
  const before = await page.locator('#petKitBtn').boundingBox();
  await page.locator('#petKitBtn').click();
  await expect(page.locator('#ovKit')).toHaveCount(0);
  await expect(page.locator('#ovStats')).toBeVisible();
  await expect(page.locator('#scGearBox')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.screen)).toBe('pet');
  await page.locator('#scClose').click();
  await expect(page.locator('#ovStats')).toBeHidden();
  expect(await page.evaluate(() => document.body.dataset.screen)).toBe('pet');
  await page.locator('#petStatsBtn').click();
  await page.locator('#ovStats').click({ position: { x: 2, y: 2 } });
  await expect(page.locator('#ovStats')).toBeHidden();
  expect(await page.evaluate(() => document.body.dataset.screen)).toBe('pet');
  await page.locator('#petStatsBtn').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ovStats')).toBeHidden();
  expect(await page.evaluate(() => document.body.dataset.screen)).toBe('pet');
  expect(before.height).toBeGreaterThanOrEqual(44);
});

test('WALK, the lower card, INTERACT, then STATS restores gear and scroll once', async ({ page }) => {
  await boot(page);
  await page.locator('#petStrip').click();
  await page.locator('#ctStats').click();
  await page.locator('#scGear').click();
  await expect(page.locator('#scGearBox')).toBeVisible();
  await page.waitForTimeout(50);
  const y = await page.evaluate(() => {
    const inner = document.querySelector('#ovStats .ov-inner');
    const max = inner.scrollHeight - inner.clientHeight;
    inner.scrollTop = Math.min(40, max);
    return inner.scrollTop;
  });
  expect(y).toBeGreaterThan(0);
  await page.evaluate(() => document.querySelector('#scRename').click());
  await expect(page.locator('#scr-pet')).toBeVisible();
  await page.locator('#petStatsBtn').click();
  await expect(page.locator('#scGearBox')).toBeVisible();
  await page.waitForTimeout(50);
  const back = await page.evaluate(() => document.querySelector('#ovStats .ov-inner').scrollTop);
  expect(Math.abs(back - y)).toBeLessThanOrEqual(1);
  await page.locator('#scClose').click();
  expect(await page.evaluate(() => document.body.dataset.screen)).toBe('pet');
  await page.locator('#petStatsBtn').click();
  await expect(page.locator('#scGearBox')).toBeHidden();
  const top = await page.evaluate(() => document.querySelector('#ovStats .ov-inner').scrollTop);
  expect(top).toBe(0);
});

test('leaving PARTNER, a scene, a battle, a grow up, or a partner change opens STATS fresh', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  test.setTimeout(60000);
  await boot(page, { xp: 40, stage: 0 }, '?debug=1');
  await page.waitForTimeout(600);
  const fresh = async () => {
    await page.evaluate(() => { if (!document.querySelector('#ovBattle').hidden) document.querySelector('#btOk').click(); });
    await page.evaluate(() => PixelPets.showTab('pet'));
    await page.locator('#petStatsBtn').click();
    await expect(page.locator('#ovStats')).toBeVisible();
    await expect(page.locator('#scGearBox')).toBeHidden();
    await page.locator('#scClose').click();
  };
  const arm = async () => {
    await page.evaluate(() => PixelPets.showTab('walk'));
    await page.locator('#petStrip').click();
    await page.locator('#ctStats').click();
    await page.locator('#scGear').click();
    await page.evaluate(() => document.querySelector('#scRename').click());
    if (await page.locator('#ovStats').isVisible()) {
      await page.waitForTimeout(600);
      await page.evaluate(() => document.querySelector('#scRename').click());
    }
    await expect(page.locator('#scr-pet')).toBeVisible();
  };
  await arm();
  await page.locator('#scr-pet .scr-back').click();
  await fresh();

  await arm();
  await page.evaluate(async () => {
    PixelPets.showTab('walk');
    if (window.PPEnv && PPEnv.setGeoPref) PPEnv.setGeoPref('deny');
    const p = PixelPets.runSteps([['say', 'Mo', 'Hello']]);
    PixelPets.endScene();
    await p;
  });
  await fresh();

  await arm();
  await page.evaluate(() => { PixelPets.forceBattle('ember/0', 3); PixelPets.winBattle(); });
  await page.locator('#btOk').click({ timeout: 5000 }).catch(() => {});
  await fresh();

  await arm();
  await page.evaluate(() => PixelPets.forceEvolve());
  await page.locator('#evoOk').click();
  await page.locator('#evoOk').click();
  await fresh();

  await arm();
  await page.evaluate(() => { PixelPets.fillParty(); PixelPets.makePartner(PixelPets.state.party[1].id); });
  await fresh();
});

test('a guarded tab denies INTERACT and leaves the popup open', async ({ page }) => {
  test.skip(page.viewportSize().width !== 390, 'one width');
  await boot(page, null, '?debug=1');
  const denied = await page.evaluate(async () => {
    PixelPets.showTab('walk');
    if (window.PPEnv && PPEnv.setGeoPref) PPEnv.setGeoPref('deny');
    const p = PixelPets.runSteps([['say', 'Mo', 'Hello']]);
    PixelPets.endScene();
    await p;
    PixelPets.openStats(PixelPets.state.partnerId);
    document.querySelector('#scRename').click();
    return { open: !document.querySelector('#ovStats').hidden, screen: document.body.dataset.screen };
  });
  expect(denied.open).toBe(true);
  expect(denied.screen).toBe('walk');
});

test('HOLDER badge, Friends wording, and the save stay as they are @w1', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.showTab('pet'));
  const badge = await page.evaluate(() => {
    const k = document.querySelector('#petKeeper');
    return { text: k.textContent, aria: k.getAttribute('aria-label') };
  });
  expect(badge.text).toBe('HOLDERWayfarer');
  expect(badge.aria).toBe('Holder Wayfarer');
  expect(badge.text).not.toContain('KEEPER');
  const keys = await page.evaluate(() => {
    const a = PixelPets.exportSave();
    const b = PixelPets.exportSave();
    const oa = JSON.parse(a), ob = JSON.parse(b);
    delete oa.last; delete ob.last;
    return { v: ob.v, same: JSON.stringify(oa) === JSON.stringify(ob), ui: b.includes('uiReturn') };
  });
  expect(keys.v).toBe(2);
  expect(keys.same).toBe(true);
  expect(keys.ui).toBe(false);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await page.locator('#phoneBtn').click();
  await page.locator('[data-app=friends]').click();
  const friends = await page.locator('#phoneFriends').innerText();
  expect(friends).toContain('HOLDER');
  expect(friends).toContain('YOUR HOLDER CODE');
  expect(friends).not.toMatch(/KEEPER/);
});
