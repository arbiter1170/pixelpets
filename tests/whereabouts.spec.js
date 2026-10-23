/* STORES_AND_TOWN_LIFE P1. Whereabouts on PEOPLE and on a contact card.
   The in-game clock only. Nothing is written to the save. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, artifactsDir } = require('./helpers');

trackErrors(test, expect);

const MET = ['Lizzy', 'Pip', 'Wren', 'Ossabell', 'Mr. Gristle', 'Keeper Teague', 'Keeper Quill', 'Mom', 'Dad', 'Warden Ilse', 'Officer Ness', 'Rook'];

function save() {
  const s = starterSave();
  s.settings.controls = 'modern';
  s.flags['story.phone_got'] = true;
  s.flags['story.lizzy_met'] = true;
  s.phoneBook = { met: {}, fav: {} };
  for (const name of MET) s.phoneBook.met[name] = true;
  return s;
}

async function boot(page) {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && typeof window.PixelPets.whereNow === 'function');
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function at(page, day, hh, mm) {
  await page.evaluate(({ day, hh, mm }) => {
    PixelPets.clock.set(day, hh, mm);
    PixelPets.clock.freeze(true);
  }, { day, hh, mm });
}

function rows(page) {
  return page.evaluate(() => [...document.querySelectorAll('#repList .rep-row')].map(row => ({
    name: row.querySelector('.rep-name').textContent,
    tier: row.querySelector('.rep-tier').textContent,
    where: row.querySelector('.where-text') ? row.querySelector('.where-text').textContent : '',
    icon: !!row.querySelector('.where-icon'),
  })));
}

function alive(page) {
  return page.evaluate(() => {
    const o = JSON.parse(localStorage.getItem('pp_alive') || 'null');
    return o && o.live;
  });
}

async function snap(page, locator, name) {
  if (page.viewportSize().width !== 390) return;
  const dir = artifactsDir('p1');
  await locator.screenshot({ path: path.join(dir, name + '.png') });
}

test('whereabouts follow the clock, the gate, and the panels', async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  await at(page, 'tue', 10, 0);
  await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));
  await page.locator('#repBtn').click();
  await expect(page.locator('#ovRep')).toBeVisible();
  await expect(page.locator('#repFoot')).toHaveText('Only people who trust you share where they are.');

  let list = await rows(page);
  const byName = () => Object.fromEntries(list.map(r => [r.name, r]));
  let got = byName();
  for (const name of MET) expect(got[name], name + ' listed').toBeTruthy();
  expect(got['Cook Hesper']).toBeUndefined();
  expect(got.Lizzy.where).toBe('Schoolhouse · AT WORK');
  expect(got.Pip.where).toBe('Schoolhouse · AT SCHOOL');
  expect(got.Wren.where).toBe('Schoolhouse · AT SCHOOL');
  expect(got.Ossabell.where).toBe('home, 5B · ASLEEP');
  expect(got['Mr. Gristle'].where).toBe('the lobby · AT WORK');
  expect(got['Keeper Teague'].where).toBe('Lamplight Provisions · AT WORK');
  expect(got['Keeper Quill'].where).toBe('home (off the map) · ASLEEP');
  expect(got.Mom.where).toBe('home · AT HOME');
  expect(got.Dad.where).toBe('home · AT HOME');
  expect(got.Mom.tier).toBe('close');
  expect(got.Dad.tier).toBe('close');
  expect(got.Lizzy.icon).toBe(true);
  expect(got.Mom.icon).toBe(true);
  expect(got.Dad.icon).toBe(true);
  expect(got['Warden Ilse'].where).toBe("Warden's Lodge · AT WORK");
  expect(got['Officer Ness'].where).toBe('Hearthmoor · AT WORK');
  expect(got.Rook.where).toBe('Hearthmoor · OUT AND ABOUT');
  expect(got['Warden Ilse'].icon).toBe(true);
  expect(got['Officer Ness'].icon).toBe(true);
  expect(got.Rook.icon).toBe(true);
  const icons = await page.evaluate(() => {
    const src = name => {
      const row = [...document.querySelectorAll('#repList .rep-row')].find(r => r.querySelector('.rep-name').textContent === name);
      const img = row && row.querySelector('.where-icon');
      return img ? img.getAttribute('src') : '';
    };
    return { mom: src('Mom'), teague: src('Keeper Teague'), ilse: src('Warden Ilse'), ness: src('Officer Ness') };
  });
  expect(icons.mom.length).toBeGreaterThan(20);
  expect(icons.ilse).toBe(icons.teague);
  expect(icons.ness).toBe(icons.teague);
  expect(icons.mom).not.toBe(icons.teague);
  if (page.viewportSize().width === 390) {
    const dir = artifactsDir('p2a');
    await page.locator('.rep-row', { hasText: 'Mom' }).screenshot({ path: path.join(dir, 'mom_people_row.png') });
  }

  const live1 = await alive(page);
  await page.locator('#repBack').click();
  await expect(page.locator('#ovRep')).toBeHidden();
  await page.locator('#repBtn').click();
  await expect(page.locator('#ovRep')).toBeVisible();
  expect(await alive(page)).toBe(live1);

  const offMap = await page.evaluate(() => PixelPets.whereNow('Lizzy'));
  expect(offMap.source).toBe('intent');
  expect(offMap.place).toBe('Schoolhouse');
  await page.evaluate(() => PixelPets.goto('hm_school_in'));
  const onMap = await page.evaluate(() => PixelPets.whereNow('Lizzy'));
  expect(onMap.source).toBe('placed');
  expect(onMap.line).toBe('Schoolhouse · AT WORK');
  await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));

  await at(page, 'tue', 17, 30);
  await expect(page.locator('.rep-row', { hasText: 'Lizzy' }).locator('.where-text')).toHaveText('the diner · AT THE DINER');
  list = await rows(page);
  got = Object.fromEntries(list.map(r => [r.name, r]));
  expect(got.Pip.where).toBe('Lanternball Court · OUT AND ABOUT');
  expect(got.Wren.where).toBe('Lanternball Court · OUT AND ABOUT');
  expect(got['Mr. Gristle'].where).toBe('the lobby · AT HOME');
  expect(got.Mom.where).toBe('home · AT HOME');
  expect(got.Dad.where).toBe('home · AT HOME');
  const homeIcon = await page.evaluate(() => {
    const src = name => {
      const row = [...document.querySelectorAll('#repList .rep-row')].find(r => r.querySelector('.rep-name').textContent === name);
      const img = row && row.querySelector('.where-icon');
      return img ? img.getAttribute('src') : '';
    };
    return { mom: src('Mom'), gristle: src('Mr. Gristle'), rook: src('Rook'), pip: src('Pip') };
  });
  expect(homeIcon.mom).toBe(homeIcon.gristle);
  expect(homeIcon.rook).toBe(homeIcon.pip);
  expect(got.Ossabell.where).toBe('home, 5B · ASLEEP');
  expect(got['Keeper Quill'].where).toBe('home (off the map) · ASLEEP');
  expect(got['Keeper Teague'].where).toBe('Lamplight Provisions · AT WORK');
  const branch = await page.evaluate(() => ({
    pip: PixelPets.whereNow('Pip').source,
    lizzy: PixelPets.whereNow('Lizzy').source,
  }));
  expect(branch.pip).toBe('placed');
  expect(branch.lizzy).toBe('intent');

  await at(page, 'tue', 23, 0);
  list = await rows(page);
  got = Object.fromEntries(list.map(r => [r.name, r]));
  expect(got.Lizzy.where).toBe('home, 5B · ASLEEP');
  expect(got.Pip.where).toBe('home (off the map) · ASLEEP');
  expect(got.Wren.where).toBe('home (off the map) · ASLEEP');
  expect(got['Mr. Gristle'].where).toBe('the lobby · ASLEEP');
  expect(got.Ossabell.where).toBe('home, 5B · AT HOME');
  expect(got['Keeper Quill'].where).toBe('Lamplight Provisions · AT WORK');
  expect(got['Keeper Teague'].where).toBe('home (off the map) · ASLEEP');
  expect(got.Mom.where).toBe('home · AT HOME');
  expect(got.Dad.where).toBe('home · AT HOME');
  expect(got['Warden Ilse'].where).toBe("Warden's Lodge · AT WORK");
  expect(got['Officer Ness'].where).toBe('Hearthmoor · AT WORK');
  expect(got.Rook.where).toBe('Hearthmoor · OUT AND ABOUT');
  expect(list.some(r => r.name === 'Cook Hesper')).toBe(false);

  await page.evaluate(() => PixelPets.lizzyWalk(true));
  await expect(page.locator('.rep-row', { hasText: 'Lizzy' }).locator('.where-text')).toHaveText('on the way to 5B · OUT AND ABOUT');
  const walked = await page.evaluate(() => PixelPets.whereNow('Lizzy'));
  expect(walked.source).toBe('walk');
  expect(walked.place).toBe('on the way to 5B');
  const saved = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  expect(saved).not.toContain('on the way to 5B');
  expect(saved).not.toContain('whereabouts');
  expect(JSON.parse(saved).v).toBe(2);

  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
  await at(page, 'tue', 10, 0);
  await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));
  expect(await page.evaluate(() => PixelPets.whereNow('Lizzy').place)).toBe('Schoolhouse');

  await page.evaluate(() => PixelPets.repAdd('Mr. Gristle', -25));
  await page.locator('#repBtn').click();
  await expect(page.locator('#ovRep')).toBeVisible();
  const cool = page.locator('.rep-row', { hasText: 'Mr. Gristle' });
  await expect(cool.locator('.where-text')).toHaveText('Keeps to themself.');
  await expect(cool.locator('.where-icon')).toBeVisible();
  expect(await cool.locator('.where-text').innerText()).not.toContain('lobby');
  await expect(page.locator('.rep-row', { hasText: 'Lizzy' }).locator('.where-text')).toHaveText('Schoolhouse · AT WORK');
  await snap(page, page.locator('#repList'), 'people_rows');
  const fitRows = await page.evaluate(() => [...document.querySelectorAll('#repList .where-line, #repList .where-text, #repFoot')].filter(n => n.offsetParent).map(n => {
    const cs = getComputedStyle(n);
    return { fs: cs.fontSize, sw: n.scrollWidth, cw: n.clientWidth, cls: n.className, ellipsis: cs.textOverflow, ws: cs.whiteSpace };
  }));
  for (const n of fitRows) {
    expect(n.sw, n.cls).toBeLessThanOrEqual(n.cw + 1);
    if (n.cls.includes('where')) {
      expect(n.ellipsis, n.cls).not.toBe('ellipsis');
      expect(n.ws, n.cls).not.toBe('nowrap');
    }
  }
  expect(fitRows.filter(n => n.cls.includes('where-line')).every(n => n.fs === '16px')).toBe(true);

  await page.locator('.rep-row', { hasText: 'Lizzy' }).locator('.rep-face-btn').click();
  await expect(page.locator('#repCard .where-text')).toHaveText('Now: Schoolhouse · AT WORK');
  await expect(page.locator('#repList')).toBeHidden();
  await snap(page, page.locator('#repCard'), 'person_card');
  const fitCardPeople = await page.evaluate(() => {
    const n = document.querySelector('#repCard .where-line');
    return { fs: getComputedStyle(n).fontSize, sw: n.scrollWidth, cw: n.clientWidth };
  });
  expect(fitCardPeople.fs).toBe('16px');
  expect(fitCardPeople.sw).toBeLessThanOrEqual(fitCardPeople.cw + 1);
  const back = await page.locator('#repBack').boundingBox();
  expect(back.height).toBeGreaterThanOrEqual(44);

  await page.locator('#repBack').click();
  await page.locator('.rep-row', { hasText: 'Mom' }).locator('.rep-face-btn').click();
  await expect(page.locator('#repCard .where-text')).toHaveText('Now: home · AT HOME');
  const momCard = await page.evaluate(() => {
    const n = document.querySelector('#repCard .where-line');
    const t = document.querySelector('#repCard .where-text');
    const cs = getComputedStyle(t);
    return { fs: getComputedStyle(n).fontSize, sw: n.scrollWidth, cw: n.clientWidth, ellipsis: cs.textOverflow, ws: cs.whiteSpace };
  });
  expect(momCard.fs).toBe('16px');
  expect(momCard.sw).toBeLessThanOrEqual(momCard.cw + 1);
  expect(momCard.ellipsis).not.toBe('ellipsis');
  expect(momCard.ws).not.toBe('nowrap');
  await page.locator('#repBack').click();
  await page.locator('#repBack').click();
  await expect(page.locator('#ovRep')).toBeHidden();

  await page.locator('#phoneBtn').click();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const listPlace = await page.locator('.contact-row', { hasText: 'Lizzy' }).locator('.contact-place').innerText();
  expect(listPlace).not.toContain('Now:');
  expect(listPlace).not.toContain('·');
  const gristleList = await page.locator('.contact-row', { hasText: 'Mr. Gristle' }).locator('.contact-place').innerText();
  expect(gristleList).not.toContain('Keeps to themself');
  await page.locator('.contact-main', { hasText: 'Lizzy' }).click();
  await expect(page.locator('.contact-card .where-text')).toHaveText('Now: Schoolhouse · AT WORK');
  await page.locator('[data-contact-back]').click();
  await page.locator('.contact-main', { hasText: 'Mom' }).click();
  await expect(page.locator('.contact-card .where-text')).toHaveText('Now: home · AT HOME');
  const momPhone = await page.evaluate(() => {
    const n = document.querySelector('.contact-card .where-line');
    const t = document.querySelector('.contact-card .where-text');
    const cs = getComputedStyle(t);
    return { fs: getComputedStyle(n).fontSize, sw: n.scrollWidth, cw: n.clientWidth, ellipsis: cs.textOverflow, ws: cs.whiteSpace };
  });
  expect(momPhone.fs).toBe('16px');
  expect(momPhone.sw).toBeLessThanOrEqual(momPhone.cw + 1);
  expect(momPhone.ellipsis).not.toBe('ellipsis');
  expect(momPhone.ws).not.toBe('nowrap');
  await page.locator('[data-contact-back]').click();
  await page.locator('.contact-main', { hasText: 'Mr. Gristle' }).click();
  await expect(page.locator('.contact-card .where-text')).toHaveText('Keeps to themself.');
  expect(await page.locator('.contact-card .where-text').innerText()).not.toContain('lobby');
  await snap(page, page.locator('.contact-card'), 'contact_card');
  const fitCard = await page.evaluate(() => {
    const n = document.querySelector('.contact-card .where-line');
    const box = document.querySelector('#phoneBody');
    return {
      fs: getComputedStyle(n).fontSize,
      sw: n.scrollWidth,
      cw: n.clientWidth,
      bodySw: box.scrollWidth,
      bodyCw: box.clientWidth,
    };
  });
  expect(fitCard.fs).toBe('16px');
  expect(fitCard.sw).toBeLessThanOrEqual(fitCard.cw + 1);
  expect(fitCard.bodySw).toBeLessThanOrEqual(fitCard.bodyCw + 1);
  const listBtn = await page.locator('[data-contact-back]').boundingBox();
  expect(listBtn.height).toBeGreaterThanOrEqual(44);

  await page.locator('#phoneClose').click();
  const liveCard = await alive(page);
  await page.locator('#phoneBtn').click();
  await page.locator('.phone-app[data-app="contacts"]').click();
  await page.locator('.contact-main', { hasText: 'Lizzy' }).click();
  await expect(page.locator('.contact-card .where-text')).toBeVisible();
  await page.locator('#phoneClose').click();
  expect(await alive(page)).toBe(liveCard);

  await page.evaluate(() => PixelPets.showTab('walk'));
  await at(page, 'tue', 10, 0);
  await page.evaluate(() => PixelPets.goto('route1', 4, 8, 'down'));
  const nessRoute = await page.evaluate(() => PixelPets.whereNow('Officer Ness'));
  expect(nessRoute).toMatchObject({ state: 'work', place: 'Route 1', line: 'Route 1 · AT WORK', now: 'Now: Route 1 · AT WORK', source: 'post' });
  await page.evaluate(() => PixelPets.goto('hm_school_in'));
  const nessOff = await page.evaluate(() => PixelPets.whereNow('Officer Ness'));
  expect(nessOff.line).toBe('Hearthmoor · AT WORK');
  expect(nessOff.place).toBe('Hearthmoor');
  await page.locator('#repBtn').click();
  await expect(page.locator('.rep-row', { hasText: 'Officer Ness' }).locator('.where-text')).toHaveText('Hearthmoor · AT WORK');
  await page.evaluate(() => PixelPets.goto('route1', 4, 8, 'down'));
  await page.locator('#repBack').click();
  await expect(page.locator('#ovRep')).toBeHidden();
  await page.locator('#repBtn').click();
  await expect(page.locator('.rep-row', { hasText: 'Officer Ness' }).locator('.where-text')).toHaveText('Route 1 · AT WORK');
  const nessFace = page.locator('.rep-row', { hasText: 'Officer Ness' }).locator('.rep-face-btn');
  await nessFace.click();
  await expect(page.locator('#repCard .where-text')).toHaveText('Now: Route 1 · AT WORK');
  await page.locator('#repBack').click();
  await page.locator('#repBack').click();

  await page.evaluate(() => PixelPets.goto('cobble_quarry', 10, 12, 'up'));
  await page.locator('#repBtn').click();
  await expect(page.locator('.rep-row', { hasText: 'Rook' }).locator('.where-text')).toHaveText('Cobblecrest Quarry · OUT AND ABOUT');
  const quarry = await page.evaluate(() => {
    const w = PixelPets.whereNow('Rook');
    const row = [...document.querySelectorAll('#repList .rep-row')].find(r => r.querySelector('.rep-name').textContent === 'Rook');
    const n = row.querySelector('.where-line');
    const t = row.querySelector('.where-text');
    const cs = getComputedStyle(t);
    const saved = localStorage.getItem('pixelpets.save.v2');
    return {
      line: w.line, now: w.now, state: w.state, place: w.place, source: w.source,
      fs: getComputedStyle(n).fontSize, sw: n.scrollWidth, cw: n.clientWidth,
      ellipsis: cs.textOverflow, ws: cs.whiteSpace, v: JSON.parse(saved).v,
      savedLine: saved.indexOf('Cobblecrest Quarry') >= 0 || saved.indexOf('OUT AND ABOUT') >= 0,
    };
  });
  expect(quarry.line).toBe('Cobblecrest Quarry · OUT AND ABOUT');
  expect(quarry.now).toBe('Now: Cobblecrest Quarry · OUT AND ABOUT');
  expect(quarry.state).toBe('out');
  expect(quarry.place).toBe('Cobblecrest Quarry');
  expect(quarry.source).toBe('story');
  expect(quarry.fs).toBe('16px');
  expect(quarry.sw).toBeLessThanOrEqual(quarry.cw + 1);
  expect(quarry.ellipsis).not.toBe('ellipsis');
  expect(quarry.ws).not.toBe('nowrap');
  expect(quarry.v).toBe(2);
  expect(quarry.savedLine).toBe(false);
  await page.locator('.rep-row', { hasText: 'Rook' }).locator('.rep-face-btn').click();
  await expect(page.locator('#repCard .where-text')).toHaveText('Now: Cobblecrest Quarry · OUT AND ABOUT');
  await page.locator('#repBack').click();
  await page.locator('#repBack').click();

  await page.evaluate(() => {
    PixelPets.setFlag('story.rival1_done', true);
    PixelPets.setFlag('story.cobble_arrived', true);
    PixelPets.setFlag('story.quarry_bought', true);
    PixelPets.goto('hearthmoor', 8, 8, 'down');
  });
  const between = await page.evaluate(() => PixelPets.whereNow('Rook'));
  expect(between).toMatchObject({ state: 'home', place: 'home (off the map)', line: 'home (off the map) · AT HOME', now: 'Now: home (off the map) · AT HOME', source: 'between' });
  await at(page, 'tue', 23, 0);
  const asleep = await page.evaluate(() => PixelPets.whereNow('Rook'));
  expect(asleep).toMatchObject({ state: 'asleep', place: 'home (off the map)', line: 'home (off the map) · ASLEEP', now: 'Now: home (off the map) · ASLEEP' });
  const ilseNight = await page.evaluate(() => PixelPets.whereNow('Warden Ilse'));
  expect(ilseNight.line).toBe("Warden's Lodge · AT WORK");
  await page.locator('#repBtn').click();
  await expect(page.locator('.rep-row', { hasText: 'Rook' }).locator('.where-text')).toHaveText('home (off the map) · ASLEEP');
  await page.evaluate(() => PixelPets.repAdd('Rook', -20));
  await page.locator('#repBack').click();
  await expect(page.locator('#ovRep')).toBeHidden();
  await page.locator('#repBtn').click();
  await expect(page.locator('.rep-row', { hasText: 'Rook' }).locator('.where-text')).toHaveText('Keeps to themself.');
  const coolRook = await page.evaluate(() => {
    const w = PixelPets.whereNow('Rook');
    const row = [...document.querySelectorAll('#repList .rep-row')].find(r => r.querySelector('.rep-name').textContent === 'Rook');
    return { line: w.line, now: w.now, state: w.state, tier: PixelPets.repTier('Rook'), icon: !!row.querySelector('.where-icon') };
  });
  expect(coolRook.tier).toBe('cool');
  expect(coolRook.line).toBe('Keeps to themself.');
  expect(coolRook.now).toBe('Keeps to themself.');
  expect(coolRook.state).toBe('private');
  expect(coolRook.icon).toBe(true);
  expect(coolRook.line).not.toContain('Quarry');
  await page.locator('.rep-row', { hasText: 'Rook' }).locator('.rep-face-btn').click();
  await expect(page.locator('#repCard .where-text')).toHaveText('Keeps to themself.');
  await page.locator('#repBack').click();
  await page.locator('#repBack').click();
  await page.locator('#phoneBtn').click();
  await page.locator('.phone-app[data-app="contacts"]').click();
  const rookList = await page.locator('.contact-row', { hasText: 'Rook' }).locator('.contact-place').innerText();
  expect(rookList).not.toContain('Keeps to themself');
  await page.locator('.contact-main', { hasText: 'Rook' }).click();
  await expect(page.locator('.contact-card .where-text')).toHaveText('Keeps to themself.');
  await page.locator('#phoneClose').click();

  await page.locator('#clockChip').click();
  const hour = await page.locator('#clockCard').innerText();
  expect(hour).toContain('Tuesday');
  expect(hour).toContain("Who's where: tap the compass, or a contact.");
  for (const name of ['Lizzy', 'Pip', 'Wren', 'Ossabell', 'Mr. Gristle']) expect(hour).not.toContain(name);
});

test('lizzyWalk stays inert without debug', async ({ page }) => {
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page);
  await page.waitForFunction(() => window.PixelPets && typeof window.PixelPets.whereNow === 'function');
  expect(await page.evaluate(() => PixelPets.debug)).toBe(false);
  expect(await page.evaluate(() => PixelPets.lizzyWalk(true))).toBeUndefined();
  const place = await page.evaluate(() => {
    const w = PixelPets.whereNow('Lizzy');
    return w && w.place;
  });
  expect(place).not.toBe('on the way to 5B');
});
