/* WORLD_CLOCK_TOWN P1. The in-game clock, schedules, the school door, the chip, and Wait until.
   Save v stays 2. The debug offset is outside the save. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene } = require('./helpers');

trackErrors(test, expect);

function save(flags, world) {
  const s = starterSave();
  s.settings.follower = false;
  if (flags) Object.assign(s.flags, flags);
  if (world) s.world = Object.assign({ facing: 'down', respawn: 'hearthmoor' }, world);
  return s;
}

async function boot(page, s, search) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, search == null ? '?debug=1' : search);
  if (String(search == null ? '?debug=1' : search).indexOf('debug=1') >= 0)
    await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function at(page, day, hh, mm) {
  return page.evaluate(({ day, hh, mm }) => PixelPets.clock.set(day, hh, mm), { day, hh, mm });
}

function ids(page) {
  return page.evaluate(() => PixelPets.mapInfo.objs.map(o => o.id + '@' + o.x + ',' + o.y));
}

async function face(page, map, x, y, facing) {
  await page.evaluate(({ map, x, y, facing }) => PixelPets.goto(map, x, y, facing), { map, x, y, facing });
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  return page.evaluate(() => ({ id: PixelPets.scene.id, text: PixelPets.scene.text }));
}

test('the clock math, the debug hook, and the save stay put', async ({ page }) => {
  await boot(page, save());
  const math = await page.evaluate(() => {
    const C = window.PPClock, ep = C.EPOCH, ms = C.MS;
    const atMin = n => C.reading(ep + n * ms);
    const mon = atMin(0), dawn = atMin(5 * 60), day = atMin(7 * 60), dusk = atMin(18 * 60), night = atMin(20 * 60);
    const late = atMin(4 * 60 + 59), tue = atMin(24 * 60 + 8 * 60 + 30), next = C.reading(ep + 42 * 60 * 1000);
    const week2 = C.reading(ep + 7 * 1440 * ms);
    return {
      mon: mon.day + ' ' + mon.hh + ':' + mon.mm + ' ' + mon.phase + ' w' + mon.week,
      late: late.phase, dawn: dawn.phase, day: day.phase, dusk: dusk.phase, night: night.phase,
      tue: { day: tue.day, hh: tue.hh, mm: tue.mm, phase: tue.phase, windows: tue.windows },
      next: next.day + ' ' + next.hh + ':' + next.mm,
      week2: week2.week,
      wx: C.match('wx:rain'), weather: C.weatherAt(),
      dayTerm: C.match('day:tue'),
    };
  });
  expect(math.mon).toBe('mon 0:0 night w1');
  expect(math.late).toBe('night');
  expect(math.dawn).toBe('dawn');
  expect(math.day).toBe('day');
  expect(math.dusk).toBe('dusk');
  expect(math.night).toBe('night');
  expect(math.tue).toEqual({ day: 'tue', hh: 8, mm: 30, phase: 'day', windows: ['school'] });
  expect(math.next).toBe('tue 0:0');
  expect(math.week2).toBe(2);
  expect(math.wx).toBe(false);
  expect(math.weather).toBe(null);

  const intro = await page.evaluate(() => {
    PixelPets.goto('hearthmoor', 8, 18, 'down');
    const liz = PixelPets.mapInfo.objs.find(o => o.id === 'hm_lizzy');
    return { liz: liz && [liz.x, liz.y], place: PixelPets.clock.place('Lizzy') };
  });
  expect(intro.liz).toEqual([9, 20]);
  expect(intro.place).toBe(null);

  const pinned = await at(page, 'tue', 8, 30);
  expect(pinned.day).toBe('tue');
  expect(pinned.hh).toBe(8);
  expect(pinned.mm).toBe(30);
  expect(pinned.phase).toBe('day');
  expect(pinned.windows).toEqual(['school']);
  expect(pinned.weather).toBe(null);
  expect(pinned.week).toBeGreaterThan(0);
  const bowl = await page.evaluate(() => PixelPets.warmBowlReady);
  await page.evaluate(() => PixelPets.clock.freeze(true));
  await page.waitForTimeout(2000);
  const held = await page.evaluate(() => {
    const n = PixelPets.clock.now();
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      hh: n.hh, mm: n.mm, day: n.day, weather: n.weather, bowl: PixelPets.warmBowlReady,
      v: PixelPets.state.v, clockKey: 'clock' in PixelPets.state, saveV: raw.v, saveClock: 'clock' in raw,
      debugKey: localStorage.getItem('pixelpets.clockDebug') != null,
      lampsNight: window.PPClock.lampsOn(),
    };
  });
  expect(held.day).toBe('tue');
  expect(held.hh).toBe(8);
  expect(held.mm).toBe(30);
  expect(held.weather).toBe(null);
  expect(held.bowl).toBe(bowl);
  expect(held.v).toBe(2);
  expect(held.clockKey).toBe(false);
  expect(held.saveV).toBe(2);
  expect(held.saveClock).toBe(false);
  expect(held.debugKey).toBe(true);
  expect(held.lampsNight).toBe(false);
  await page.evaluate(() => PixelPets.clock.freeze(false));
  const cleared = await page.evaluate(() => {
    PixelPets.clock.clear();
    const n = PixelPets.clock.now(), pure = window.PPClock.reading(Date.now());
    return {
      day: n.day === pure.day && n.hh === pure.hh && n.mm === pure.mm,
      gone: localStorage.getItem('pixelpets.clockDebug') == null,
    };
  });
  expect(cleared.day).toBe(true);
  expect(cleared.gone).toBe(true);
});

test('schedules, away notes, the school door, and the quest pointer', async ({ page }) => {
  const s = save({ 'story.lizzy_met': true });
  s.ui = { sideTracked: 'leak_ask' };
  await boot(page, s);
  await at(page, 'tue', 8, 30);
  const school = await page.evaluate(() => {
    const place = name => PixelPets.clock.place(name);
    const intent = name => PixelPets.clock.intent(name);
    PixelPets.goto('hm_school_in', 7, 11, 'up');
    const here = PixelPets.mapInfo.objs.map(o => o.id + '@' + o.x + ',' + o.y);
    PixelPets.goto('hm_flats_5', 2, 6, 'down');
    const home = PixelPets.mapInfo.objs.map(o => o.id + '@' + o.x + ',' + o.y);
    return {
      liz: place('Lizzy'), bud: place('Buddy'), pip: place('Pip'), wren: place('Wren'),
      oss: place('Ossabell'), gri: place('Mr. Gristle'),
      board: PixelPets.npcLine('school_board'),
      classLine: PixelPets.npcLine('school_lizzy'),
      here, home,
    };
  });
  expect(school.liz).toMatchObject({ map: 'hm_school_in', x: 10, y: 3, id: 'school_lizzy' });
  expect(school.bud).toMatchObject({ map: 'hm_school_in', x: 9, y: 3, id: 'school_buddy' });
  expect(school.pip).toMatchObject({ map: 'hm_school_in', x: 3, y: 4, id: 'school_kid_a' });
  expect(school.wren).toMatchObject({ map: 'hm_school_in', x: 6, y: 4, id: 'school_kid_b' });
  expect(school.oss).toMatchObject({ map: 'hm_flats_5', x: 5, y: 4, id: 'f5_ossabell' });
  expect(school.gri).toMatchObject({ map: 'hm_flats_lobby', x: 6, y: 9, id: 'flats_landlord' });
  expect(school.board).toBe('BE KIND. FEED FIRST. ASK BEFORE YOU PET. Written in Lizzy\'s round chalk letters.');
  expect(school.classLine).toBe('Class is out! Want to help me wipe the board? Buddy already tried. Now it\'s muddy.');
  expect(school.here).toContain('school_lizzy@10,3');
  expect(school.here).not.toContain('f5_lizzy_away@13,3');
  expect(school.home).toContain('f5_lizzy_away@13,3');
  expect(school.home.some(s => s.startsWith('f5_lizzy@'))).toBe(false);

  await at(page, 'tue', 10, 0);
  const office = await page.evaluate(() => PixelPets.clock.place('Mr. Gristle'));
  expect(office).toMatchObject({ map: 'hm_flats_lobby', x: 7, y: 9 });

  await at(page, 'tue', 17, 30);
  const diner = await page.evaluate(() => ({
    intent: PixelPets.clock.intent('Lizzy'),
    place: PixelPets.clock.place('Lizzy'),
  }));
  expect(diner.intent.map).toBe('hm_diner');
  expect(diner.place).toMatchObject({ map: 'hm_diner', x: 6, y: 3, id: 'diner_lizzy' });

  await at(page, 'sat', 10, 0);
  const court = await page.evaluate(() => ({
    intent: PixelPets.clock.intent('Lizzy'),
    place: PixelPets.clock.place('Lizzy'),
    pip: PixelPets.clock.place('Pip'),
  }));
  expect(court.intent).toMatchObject({ map: 'hearthmoor', x: 14, y: 31 });
  expect(court.place).toMatchObject({ map: 'hearthmoor', x: 14, y: 31, id: 'court_lizzy' });
  expect(court.pip).toBe(null);

  await at(page, 'mon', 5, 30);
  const dawn = await page.evaluate(() => ({
    intent: PixelPets.clock.intent('Ossabell'),
    place: PixelPets.clock.place('Ossabell'),
    phase: PixelPets.clock.now().phase,
  }));
  expect(dawn.phase).toBe('dawn');
  expect(dawn.intent.map).toBe('hm_diner');
  expect(dawn.place).toMatchObject({ map: 'hm_diner', x: 3, y: 3, id: 'diner_ossabell' });

  await at(page, 'sun', 21, 0);
  const night = await page.evaluate(() => {
    PixelPets.goto('hm_flats_5', 2, 6, 'down');
    const home = PixelPets.mapInfo.objs.map(o => o.id + '@' + o.x + ',' + o.y);
    PixelPets.goto('hm_school_in', 7, 11, 'up');
    const here = PixelPets.mapInfo.objs.map(o => o.id);
    return {
      liz: PixelPets.clock.place('Lizzy'),
      bud: PixelPets.clock.place('Buddy'),
      pip: PixelPets.clock.place('Pip'),
      gri: PixelPets.clock.place('Mr. Gristle'),
      board: PixelPets.npcLine('school_board'),
      home, here,
      night: PixelPets.env.tags.indexOf('night') >= 0,
    };
  });
  expect(night.liz).toMatchObject({ map: 'hm_flats_5', x: 13, y: 3, id: 'f5_lizzy' });
  expect(night.bud.id).toBe('f5_buddy');
  expect(night.pip).toBe(null);
  expect(night.gri).toMatchObject({ x: 6, y: 9 });
  expect(night.board).toBe('Back at 3. - L.');
  expect(night.home).toContain('f5_lizzy@13,3');
  expect(night.home.some(s => s.startsWith('f5_lizzy_away@'))).toBe(false);
  expect(night.here).not.toContain('school_lizzy');
  expect(night.night).toBe(true);

  const closed = await face(page, 'hm_flats_lobby', 5, 9, 'right');
  expect(closed.text).toBe('Office is closed. Knock anyway.');
  await playScene(page, []);

  await at(page, 'tue', 8, 30);
  const dayTags = await page.evaluate(() => PixelPets.env.tags.indexOf('night') >= 0);
  expect(dayTags).toBe(false);

  const door = await face(page, 'hm_school_in', 10, 4, 'up');
  expect(door.id).toBe('leak_school');
  expect(door.text).toBe('The bathroom in 5B has a drip. It hits the bucket and keeps going.');
  await playScene(page, []);
  const after = await page.evaluate(() => ({
    seen: !!PixelPets.state.flags['story.leak5b_seen'],
    yes: !!PixelPets.state.flags['story.leak5b_yes'],
    v: PixelPets.state.v,
  }));
  expect(after.seen).toBe(true);
  expect(after.yes).toBe(false);
  expect(after.v).toBe(2);

  const again = await face(page, 'hm_school_in', 10, 4, 'up');
  expect(again.id).toBe('leak_ask');
  await playScene(page, ['Not right now']);
  const quest = await page.evaluate(() => {
    const q = PixelPets.sideQuest;
    const atSchool = q && q.target;
    PixelPets.clock.set('sun', 21, 0);
    const home = PixelPets.sideQuest && PixelPets.sideQuest.target;
    return { id: q.id, text: q.text, place: q.place, atSchool, home };
  });
  expect(quest.id).toBe('leak_ask');
  expect(quest.text).toBe('Find Lizzy: Schoolhouse (MON-FRI, day) or home, 5B (evenings)');
  expect(quest.place).toBe('School or 5B');
  expect(quest.atSchool).toMatchObject({ map: 'hm_school_in', x: 10, y: 3 });
  expect(quest.home).toMatchObject({ map: 'hm_flats_5', x: 13, y: 3 });
});

test('the header chip stays tappable and names who is about', async ({ page }) => {
  await boot(page, save({ 'story.lizzy_met': true }));
  await at(page, 'tue', 8, 30);
  await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));
  const box = await page.locator('#clockChip').boundingBox();
  const vp = page.viewportSize();
  expect(box).toBeTruthy();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);
  expect(await page.locator('#clockLabel').textContent()).toBe('TUE 8:30');
  expect(await page.locator('#clockChip').getAttribute('aria-label')).toBe('Tuesday, 8:30, day');
  await page.locator('#clockChip').click();
  await expect(page.locator('#ovClock')).toBeVisible();
  const card = await page.locator('#clockCard').innerText();
  expect(card).toContain('Tuesday');
  expect(card).toContain('8:30, day');
  expect(card).toContain('Lizzy, Schoolhouse');
  expect(card).toContain('Pip, Schoolhouse');
  expect(card).toContain('Wren, Schoolhouse');
  expect(card).toContain('Ossabell, home, 5B');
  expect(card).toContain('Mr. Gristle, the lobby');
  const close = await page.locator('#clockClose').boundingBox();
  expect(close.height).toBeGreaterThanOrEqual(44);
  await page.locator('#clockClose').click();
  await expect(page.locator('#ovClock')).toBeHidden();
});

test('modern controls keep the chip on the walk screen', async ({ page }) => {
  const s = save({ 'story.lizzy_met': true });
  s.settings.controls = 'modern';
  await boot(page, s);
  await at(page, 'tue', 8, 30);
  const box = await page.locator('#clockChip').boundingBox();
  const vp = page.viewportSize();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
  const hidden = await page.evaluate(() => getComputedStyle(document.getElementById('top')).display === 'none');
  expect(hidden).toBe(true);
  expect(await page.locator('#clockLabel').textContent()).toBe('TUE 8:30');
});

test('dawn and dusk tint the outdoor map, and night stays the dark wash', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, save({ 'story.lizzy_met': true }));
  await page.evaluate(() => PixelPets.goto('hearthmoor', 8, 8, 'down'));
  async function sample(day, hh) {
    await at(page, day, hh, 0);
    await page.waitForTimeout(80);
    return page.evaluate(() => {
      const c = document.getElementById('mapCanvas');
      const g = c.getContext('2d');
      const pts = [[8, 8], [c.width >> 1, c.height >> 1], [c.width - 8, 24]];
      return pts.map(([x, y]) => Array.from(g.getImageData(x | 0, y | 0, 1, 1).data).join(','));
    });
  }
  const dawn = await sample('mon', 5);
  const day = await sample('tue', 12);
  const dusk = await sample('mon', 19);
  const night = await sample('sun', 21);
  expect(dawn.join('|')).not.toBe(day.join('|'));
  expect(dusk.join('|')).not.toBe(day.join('|'));
  expect(night.join('|')).not.toBe(day.join('|'));
  const tags = await page.evaluate(() => PixelPets.env.tags.slice());
  expect(tags).toContain('night');
});

test('Wait until skips ahead, stays out of the save, and is hidden in a party', async ({ page }) => {
  const s = save({ 'story.lizzy_met': true, 'story.leak5b_seen': true });
  s.ui = { sideTracked: 'leak_ask' };
  await boot(page, s);
  await at(page, 'tue', 8, 30);
  const plain = await face(page, 'hm_flats_lobby', 1, 8, 'up');
  expect(plain.text).toBe('A lobby bench, one leg shimmed with folded rent notices.');
  const prompts = await playScene(page, []);
  expect(prompts).toEqual([]);

  const asked = await face(page, 'hm_flats_5', 15, 2, 'right');
  expect(asked.text).toBe('Lizzy\'s bed, coral quilt. A big golden dent where Buddy sleeps.');
  const waited = await playScene(page, ['Wait until...']);
  expect(waited).toEqual(['Wait here?']);
  const after = await page.evaluate(() => {
    const n = PixelPets.clock.now();
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { day: n.day, hh: n.hh, mm: n.mm, place: PixelPets.clock.place('Lizzy'), v: raw.v, clock: 'clock' in raw };
  });
  expect(after.day).toBe('tue');
  expect(after.hh).toBe(15);
  expect(after.mm).toBe(0);
  expect(after.place).toMatchObject({ map: 'hm_flats_5', id: 'f5_lizzy' });
  expect(after.v).toBe(2);
  expect(after.clock).toBe(false);

  await page.reload({ waitUntil: 'commit' });
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  const restored = await page.evaluate(() => {
    PixelPets.showTab('walk');
    const n = PixelPets.clock.now();
    return { day: n.day, hh: n.hh, mm: n.mm };
  });
  // The debug pin is outside the save and keeps running. The wait offset is memory only, so a reload is not still 15:00.
  expect(restored.day).toBe('tue');
  expect(restored.hh).toBe(8);
  expect(restored.mm).toBeGreaterThanOrEqual(30);
  expect(restored.mm).toBeLessThan(40);

  await page.evaluate(() => {
    localStorage.setItem('pixelpets.net', JSON.stringify({ party: { code: 'x' } }));
    PixelPets.clock.set('tue', 8, 30);
  });
  const party = await face(page, 'hm_flats_5', 15, 2, 'right');
  expect(party.text).toBe('Lizzy\'s bed, coral quilt. A big golden dent where Buddy sleeps.');
  expect(await playScene(page, [])).toEqual([]);
});

test('a clock in the address is ignored unless debug is on', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('pixelpets.clockDebug', JSON.stringify(86400000 * 40));
  });
  await boot(page, save(), '?clock=tue-0830');
  const live = await page.evaluate(() => {
    const n = PixelPets.clock.now(), pure = window.PPClock.reading(Date.now());
    return {
      same: n.day === pure.day && n.hh === pure.hh && n.mm === pure.mm,
      set: PixelPets.clock.set('tue', 8, 30),
      freeze: PixelPets.clock.freeze(true),
      clear: PixelPets.clock.clear(),
    };
  });
  expect(live.same).toBe(true);
  expect(live.set).toBeUndefined();
  expect(live.freeze).toBeUndefined();
  expect(live.clear).toBeUndefined();
});

test('?debug=1&clock=tue-0830 opens on Tuesday morning', async ({ page }) => {
  await boot(page, save(), '?debug=1&clock=tue-0830');
  const n = await page.evaluate(() => PixelPets.clock.now());
  expect(n.day).toBe('tue');
  expect(n.hh).toBe(8);
  expect(n.mm).toBe(30);
  expect(n.phase).toBe('day');
  expect(n.windows).toEqual(['school']);
  expect(await page.locator('#clockLabel').textContent()).toBe('TUE 8:30');
});
