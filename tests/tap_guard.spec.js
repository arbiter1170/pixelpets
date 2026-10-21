/* A dialog-closing touch must not press a button in the panel that same touch opened.
   390, touch. Save stays pixelpets.save.v2 with v 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function save() {
  const s = starterSave();
  s.settings.follower = false;
  s.player.name = 'Tester';
  s.party[0].nick = 'Pipkit';
  s.party.push({
    id: 'petsmoke2', species: 'tide', stage: 0, xp: 10,
    hunger: 80, happy: 60, energy: 90, nick: 'Brook', origin: 'wild',
  });
  return s;
}

async function boot(page) {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function dialogPoint(page, where) {
  const box = await page.locator('#sbox').boundingBox();
  const y = box.y + box.height * 0.72;
  const x = where === 'left' ? box.x + 28 : where === 'right' ? box.x + box.width - 28 : box.x + box.width / 2;
  return { x, y };
}

async function holdTouch(page, x, y, ms) {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, radiusX: 1, radiusY: 1, id: 1 }],
    modifiers: 0,
  });
  await page.waitForTimeout(ms);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
    modifiers: 0,
  });
  await client.detach();
}

async function showSay(page, steps) {
  const ok = await page.evaluate(s => {
    localStorage.setItem('pixelpets.geo', 'deny');
    return PixelPets.runSteps(s);
  }, steps);
  expect(ok).toBe(true);
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'say' && PixelPets.scene.full);
}

function geoSnap(page) {
  return page.evaluate(() => ({
    open: !document.querySelector('#ovGeo').hidden,
    pref: localStorage.getItem('pixelpets.geo'),
    v: PixelPets.state.v,
  }));
}

function tuneSnap(page) {
  return page.evaluate(() => ({
    open: !document.querySelector('#ovSheet').hidden,
    title: document.querySelector('#shTitle').textContent,
    chips: (PixelPets.state.party || []).map(p => (p.nick || p.species) + '=' + !!(p.chip && p.chip.on)),
    done: !!PixelPets.state.flags['story.arbiter_test_done'],
    v: PixelPets.state.v,
  }));
}

async function settleClick(page) {
  await page.waitForTimeout(400);
}

async function geoPoints(page, line) {
  await showSay(page, line);
  await page.evaluate(() => localStorage.removeItem('pixelpets.geo'));
  await page.keyboard.press('Space');
  await page.waitForSelector('#ovGeo:not([hidden])');
  const buttons = await page.evaluate(() => ['#geoAllow', '#geoLater'].map(id => {
    const r = document.querySelector(id).getBoundingClientRect();
    return { name: id, x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }));
  await page.evaluate(() => { document.querySelector('#ovGeo').hidden = true; localStorage.setItem('pixelpets.geo', 'deny'); });
  await page.waitForFunction(() => !PixelPets.scene && document.querySelector('#ovGeo').hidden);
  return buttons;
}

test('a touch that closes a line does not answer the location ask', async ({ page }, info) => {
  test.skip(info.project.name !== '390', '390 touch');
  test.setTimeout(90000);
  await boot(page);
  const line = [['say', '', 'The lane is quiet for a moment.']];
  const buttons = await geoPoints(page, line);
  const spots = [
    ['left', null], ['centre', null], ['right', null],
    ['allow', buttons[0]], ['later', buttons[1]],
  ];

  for (const [where, fixed] of spots) {
    await showSay(page, line);
    await page.evaluate(() => localStorage.removeItem('pixelpets.geo'));
    const pt = fixed || await dialogPoint(page, where);
    await page.touchscreen.tap(pt.x, pt.y);
    await page.waitForSelector('#ovGeo:not([hidden])');
    await settleClick(page);
    const after = await geoSnap(page);
    expect(after.open, where).toBe(true);
    expect(after.pref, where).toBe(null);
    expect(after.v, where).toBe(2);
    await page.evaluate(() => { document.querySelector('#ovGeo').hidden = true; localStorage.setItem('pixelpets.geo', 'deny'); });
    await page.waitForFunction(() => !PixelPets.scene && document.querySelector('#ovGeo').hidden);
  }

  await showSay(page, line);
  await page.evaluate(() => localStorage.removeItem('pixelpets.geo'));
  const close = await dialogPoint(page, 'centre');
  await page.touchscreen.tap(close.x, close.y);
  await page.waitForSelector('#ovGeo:not([hidden])');
  await settleClick(page);
  const later = page.locator('#geoLater');
  const bb = await later.boundingBox();
  await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await expect(page.locator('#ovGeo')).toBeHidden();
  const chosen = await geoSnap(page);
  expect(chosen.pref).toBe('deny');
  expect(chosen.open).toBe(false);
  expect(chosen.v).toBe(2);
});

test('a held touch that closes a line does not answer the location ask', async ({ page }, info) => {
  test.skip(info.project.name !== '390', '390 touch');
  test.setTimeout(90000);
  await boot(page);
  const line = [['say', '', 'The lane is quiet for a moment.']];
  const buttons = await geoPoints(page, line);
  const spots = [
    ['left', null], ['centre', null], ['right', null],
    ['allow', buttons[0]], ['later', buttons[1]],
  ];

  for (const [where, fixed] of spots) {
    for (const ms of [150, 400, 600]) {
      await showSay(page, line);
      await page.evaluate(() => localStorage.removeItem('pixelpets.geo'));
      const pt = fixed || await dialogPoint(page, where);
      await holdTouch(page, pt.x, pt.y, ms);
      await page.waitForSelector('#ovGeo:not([hidden])');
      await settleClick(page);
      const after = await geoSnap(page);
      const label = where + ' ' + ms;
      expect(after.open, label).toBe(true);
      expect(after.pref, label).toBe(null);
      expect(after.v, label).toBe(2);
      await page.evaluate(() => { document.querySelector('#ovGeo').hidden = true; localStorage.setItem('pixelpets.geo', 'deny'); });
      await page.waitForFunction(() => !PixelPets.scene && document.querySelector('#ovGeo').hidden);
    }
  }
});

test('a touch that closes a line does not pick a tune', async ({ page }, info) => {
  test.skip(info.project.name !== '390', '390 touch');
  test.setTimeout(90000);
  await boot(page);
  const steps = [
    ['say', 'Associate Quinn', 'Before the cord, one more kindness. A Tuning.'],
    ['tune', 'pick'],
  ];
  const before = ['Pipkit=false', 'Brook=false'];

  for (const where of ['left', 'centre', 'right']) {
    await showSay(page, steps);
    const pt = await dialogPoint(page, where);
    await page.touchscreen.tap(pt.x, pt.y);
    await page.waitForSelector('#ovSheet:not([hidden])');
    await settleClick(page);
    const after = await tuneSnap(page);
    expect(after.open, where).toBe(true);
    expect(after.title, where).toBe('Who hears us clearer?');
    expect(after.chips, where).toEqual(before);
    expect(after.done, where).toBe(false);
    expect(after.v, where).toBe(2);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !PixelPets.scene && document.querySelector('#ovSheet').hidden);
  }

  await showSay(page, steps);
  await page.keyboard.press('Space');
  await page.waitForSelector('#ovSheet:not([hidden])');
  await settleClick(page);
  const back = page.locator('#shCancel');
  await expect(back).toBeVisible();
  const bb = await back.boundingBox();
  await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await expect(page.locator('#ovSheet')).toBeHidden();
  const picked = await tuneSnap(page);
  expect(picked.chips).toEqual(before);
  expect(picked.done).toBe(false);
  expect(picked.v).toBe(2);
  await page.waitForFunction(() => !PixelPets.scene);

  await showSay(page, steps);
  await page.keyboard.press('Space');
  await page.waitForSelector('#ovSheet:not([hidden])');
  await page.locator('#shCancel').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#ovSheet')).toBeHidden();
  const keyed = await tuneSnap(page);
  expect(keyed.chips).toEqual(before);
  expect(keyed.done).toBe(false);
  expect(keyed.v).toBe(2);
});

test('a held touch that closes a line does not pick a tune', async ({ page }, info) => {
  test.skip(info.project.name !== '390', '390 touch');
  test.setTimeout(90000);
  await boot(page);
  const steps = [
    ['say', 'Associate Quinn', 'Before the cord, one more kindness. A Tuning.'],
    ['tune', 'pick'],
  ];
  const before = ['Pipkit=false', 'Brook=false'];

  for (const where of ['left', 'centre', 'right']) {
    for (const ms of [150, 400, 600]) {
      await showSay(page, steps);
      const pt = await dialogPoint(page, where);
      await holdTouch(page, pt.x, pt.y, ms);
      await page.waitForSelector('#ovSheet:not([hidden])');
      await settleClick(page);
      const after = await tuneSnap(page);
      const label = where + ' ' + ms;
      expect(after.open, label).toBe(true);
      expect(after.title, label).toBe('Who hears us clearer?');
      expect(after.chips, label).toEqual(before);
      expect(after.done, label).toBe(false);
      expect(after.v, label).toBe(2);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !PixelPets.scene && document.querySelector('#ovSheet').hidden);
    }
  }
});
