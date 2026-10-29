/* PLAYTEST_FIXES_3: bed NRG, Lantern respawn, picker icon, party tips. QA-2 and QA-4 live here too. */
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame, playScene, artifactsDir } = require('./helpers');

trackErrors(test, expect);

function pet(extra) {
  return Object.assign({
    id: 'petsmoke2', species: 'tide', stage: 0, xp: 30, hunger: 80, happy: 60, energy: 90,
    nick: null, origin: 'wild', moves: ['wobble'],
  }, extra || {});
}

async function reloadSaved(page) {
  const raw = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.context().addInitScript((saved) => { localStorage.setItem('pixelpets.save.v2', saved); }, raw);
  await page.reload();
  await page.waitForFunction(() => window.PixelPets && window.BUILD);
}

async function boot(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function wipe(page) {
  const nrg = await page.evaluate(() => {
    PixelPets.battle.textMs = 0;
    PixelPets.showTab('walk');
    PixelPets.clearWild();
    PixelPets.forceBattle('tide/0', 3);
    return PixelPets.state.party.map((p) => p.energy);
  });
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.on && PixelPets.battle.state === 'CHOOSE');
  await page.evaluate(() => {
    const t = Date.now();
    for (const p of PixelPets.state.party) { p.hpNow = 0; p.faintUntil = t + 20 * 60000; }
    // This helper checks the wake-up, not the first-visit guide (D618).
    PixelPets.setFlag('lantern.guide_heard', true);
    PixelPets.loseBattle();
  });
  await page.waitForFunction(() => PixelPets.battle && PixelPets.battle.panel === 'end');
  const mid = await page.evaluate(() => ({
    money: PixelPets.state.money | 0,
    nrg: PixelPets.state.party.map((p) => p.energy),
    respawn: PixelPets.state.world.respawn,
  }));
  await page.locator('#btOk').click();
  await page.waitForFunction(() => PixelPets.battle && !PixelPets.battle.on && !PixelPets.fading && !PixelPets.scene, null, { timeout: 15000 });
  return { nrgBefore: nrg, mid };
}

test('a bed fills NRG to 100, and the partner nap still has its own line', async ({ page }) => {
  const save = starterSave();
  save.party[0].energy = 20;
  save.party.push(pet({ energy: 20 }));
  save.money = 55;
  await boot(page, save);
  expect(await page.evaluate(() => PixelPets.runScene('home_bed'))).toBe(true);
  await playScene(page, ['Nap a while']);
  await expect(page.locator('#toast')).toContainText('Your team is rested.');
  const home = await page.evaluate(() => PixelPets.state.party.map((p) => ({ energy: p.energy, hp: p.hpNow })));
  expect(home.map((p) => p.hp)).toEqual([undefined, undefined]);
  expect(home[0].energy).toBeGreaterThan(99.9);
  expect(home[1].energy).toBeGreaterThan(99.9);

  await page.evaluate(() => { PixelPets.state.party.forEach((p) => { p.energy = 20; }); });
  expect(await page.evaluate(() => PixelPets.runScene('hc_apt_nap'))).toBe(true);
  await playScene(page, ['Nap']);
  expect(await page.evaluate(() => PixelPets.state.party.every((p) => p.energy > 99.9))).toBe(true);

  await page.evaluate(() => { PixelPets.state.party[0].hpNow = 4; PixelPets.state.party.forEach((p) => { p.energy = 20; }); });
  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  await playScene(page, ['Rest (5 Acorns)']);
  const paid = await page.evaluate(() => ({
    money: PixelPets.state.money,
    energy: PixelPets.state.party.map((p) => p.energy),
    hurt: PixelPets.state.party.some((p) => Number.isFinite(p.hpNow)),
  }));
  expect(paid.money).toBe(50);
  expect(paid.hurt).toBe(false);
  expect(paid.energy[0]).toBeGreaterThan(99.9);
  expect(paid.energy[1]).toBeGreaterThan(99.9);

  expect(await page.evaluate(() => PixelPets.runScene('lantern_rest'))).toBe(true);
  await page.evaluate(() => { PixelPets.state.party.forEach((p) => { p.energy = 20; }); });
  const before = await page.evaluate(() => PixelPets.state.money);
  await playScene(page, ['Rest a while']);   // the label was built while the team was rested; the fee is read at the tap
  const free = await page.evaluate(() => ({ money: PixelPets.state.money, energy: PixelPets.state.party.map((p) => p.energy) }));
  expect(free.money).toBe(before - 5);   // D875: an energy-only rest costs 5 Acorns
  expect(free.energy[0]).toBeGreaterThan(99.9);
  expect(free.energy[1]).toBeGreaterThan(99.9);

  await page.evaluate(() => { PixelPets.state.party[0].energy = 100; PixelPets.showTab('pet'); });
  await page.locator('#scr-pet [data-act="rest"]').click();
  await expect(page.locator('#toast')).toContainText('Not sleepy right now.');
});

test('the Lanterns card waits out the rest prompt and comes back in the same place', async ({ page }) => {
  const save = starterSave();
  save.money = 55;
  save.party[0].hpNow = 4;
  save.party[0].energy = 40;
  save.settings.controls = 'modern';
  save.world = { map: 'hm_lantern_in', x: 1, y: 3, facing: 'up', respawn: 'hearthmoor' };
  await boot(page, save);
  await page.keyboard.press('Space');
  await playScene(page, ['Rest (5 Acorns)']);
  await expect(page.locator('#unlockTitle')).toHaveText('Lanterns', { timeout: 4000 });
  const first = await page.locator('#unlockCard').boundingBox();
  const saved = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene);
  await expect(page.locator('#unlockCard')).toBeHidden();
  for (let i = 0; i < 6; i++) {
    const mode = await page.evaluate(() => PixelPets.scene && PixelPets.scene.mode);
    if (mode === 'choice') break;
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);
  }
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.optionsReady === true);
  await expect(page.locator('#sbText')).toContainText('Let your team rest?');
  const hits = await page.evaluate(() => [...document.querySelectorAll('#sbChoices button')].map((b) => {
    const r = b.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { text: b.textContent, ok: el === b || b.contains(el) };
  }));
  expect(hits.map((h) => h.text)).toEqual(expect.arrayContaining(['Rest a while', 'Not now']));
  expect(hits.every((h) => h.ok)).toBe(true);
  await page.locator('#sbChoices button', { hasText: 'Not now' }).click();
  await page.waitForFunction(() => !PixelPets.scene);
  const mid = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  await expect(page.locator('#unlockCard')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#unlockTitle')).toHaveText('Lanterns');
  const again = await page.locator('#unlockCard').boundingBox();
  expect(Math.abs(again.x - first.x)).toBeLessThan(2);
  expect(Math.abs(again.y - first.y)).toBeLessThan(2);
  const shown = await page.evaluate(() => localStorage.getItem('pixelpets.save.v2'));
  expect(shown).toBe(mid);
  expect(shown).not.toBe(saved);
  await page.locator('#unlockSkip').click();
  await expect(page.locator('#unlockCard')).toBeHidden();
  await reloadSaved(page);
  await page.waitForTimeout(1200);
  await expect(page.locator('#unlockCard')).toBeHidden();
});

function lanternPaidSave(controls) {
  const save = starterSave();
  save.money = 55;
  save.party[0].hpNow = 4;
  save.settings.controls = controls;
  save.settings.tips = true;
  save.world = { map: 'hm_lantern_in', x: 1, y: 3, facing: 'up', respawn: 'hearthmoor' };
  return save;
}

async function paidLanternRest(page, controls) {
  await boot(page, lanternPaidSave(controls));
  await page.keyboard.press('Space');
  await playScene(page, ['Rest (5 Acorns)']);
  await expect(page.locator('#unlockTitle')).toHaveText('Lanterns', { timeout: 4000 });
  expect(await page.evaluate(() => PixelPets.state.money | 0)).toBe(50);
}

async function hitAt(page, sel) {
  return page.evaluate((sel) => {
    const b = document.querySelector(sel);
    if (!b) return { ok: false, id: null };
    const r = b.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { ok: el === b || !!(el && b.contains(el)), id: el && (el.id || (el.closest && el.closest('[id]') && el.closest('[id]').id)) };
  }, sel);
}

test('QA-4: the Lanterns card never covers TALK in arcade at 320', async ({ page }) => {
  test.setTimeout(90000);
  const width = page.viewportSize().width;
  if (width === 320) {
    await paidLanternRest(page, 'arcade');
    await expect(page.locator('#unlockBody')).toHaveText('Rest at a Lantern to heal your team. Lose a battle and you wake at the closest Lantern House.');
    await expect(page.locator('#unlockSkip')).toHaveText('GOT IT');
    const talk = await hitAt(page, '#talkBtn');
    expect(talk).toEqual({ ok: true, id: 'talkBtn' });
    const clear = await page.evaluate(() => {
      const card = document.querySelector('#unlockCard').getBoundingClientRect();
      const talk = document.querySelector('#talkBtn').getBoundingClientRect();
      const gap = Math.min(card.right, talk.right) - Math.max(card.left, talk.left);
      const overlap = gap > 0 && card.bottom > talk.top && card.top < talk.bottom;
      return { overlap, w: document.querySelector('#unlockCard').offsetWidth, h: document.querySelector('#unlockCard').offsetHeight };
    });
    expect(clear.overlap).toBe(false);
    expect(clear.w).toBeGreaterThanOrEqual(280);
    const before = clear;
    await page.locator('#talkBtn').click();
    await page.waitForFunction(() => PixelPets.scene);
    for (let i = 0; i < 6; i++) {
      const mode = await page.evaluate(() => PixelPets.scene && PixelPets.scene.mode);
      if (mode === 'choice') break;
      await page.keyboard.press('Space');
      await page.waitForTimeout(50);
    }
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'choice' && PixelPets.optionsReady === true);
    await expect(page.locator('#sbText')).toContainText('Let your team rest?');
    for (const label of ['Rest a while', 'Not now']) {
      const hit = await page.evaluate((label) => {
        const b = [...document.querySelectorAll('#sbChoices button')].find((el) => el.textContent === label);
        const r = b.getBoundingClientRect();
        const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { ok: el === b || b.contains(el), text: b.textContent };
      }, label);
      expect(hit).toEqual({ ok: true, text: label });
    }
    await page.locator('#sbChoices button', { hasText: 'Not now' }).click();
    await page.waitForFunction(() => !PixelPets.scene);
    await expect(page.locator('#unlockCard')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('#unlockTitle')).toHaveText('Lanterns');
    const again = await page.evaluate(() => {
      const card = document.querySelector('#unlockCard');
      return { w: card.offsetWidth, h: card.offsetHeight };
    });
    expect(again).toEqual({ w: before.w, h: before.h });
    const back = await hitAt(page, '#talkBtn');
    expect(back.ok).toBe(true);
    await page.locator('#unlockSkip').click();
    await expect(page.locator('#unlockCard')).toBeHidden();
    await reloadSaved(page);
    await page.waitForTimeout(1200);
    await expect(page.locator('#unlockCard')).toBeHidden();
    expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);

    await paidLanternRest(page, 'modern');
    await expect(page.locator('#talkBtn')).toBeHidden();
    await expect(page.locator('#unlockSkip')).toHaveText('GOT IT');
    await expect(page.locator('#unlockBody')).toHaveText('Rest at a Lantern to heal your team. Lose a battle and you wake at the closest Lantern House.');
    return;
  }

  await paidLanternRest(page, 'arcade');
  await expect(page.locator('#unlockSkip')).toHaveText('GOT IT');
  const talk = await hitAt(page, '#talkBtn');
  expect(talk).toEqual({ ok: true, id: 'talkBtn' });
  const overlap = await page.evaluate(() => {
    const card = document.querySelector('#unlockCard').getBoundingClientRect();
    const talk = document.querySelector('#talkBtn').getBoundingClientRect();
    return card.bottom > talk.top && card.top < talk.bottom && card.right > talk.left && card.left < talk.right;
  });
  expect(overlap).toBe(false);
});

test('a loss wakes the team at the nearest Lantern House with no Acorn cost', async ({ page }) => {
  test.setTimeout(90000);
  const save = starterSave();
  save.money = 55;
  save.party[0].energy = 40;
  save.world.respawn = 'hearthmoor';
  save.flags['story.reached_cobblecrest'] = true;
  await boot(page, save);
  await page.evaluate(() => PixelPets.goto('cc_hall_in', 5, 11, 'up'));
  const hall = await wipe(page);
  await expect(page.locator('#toast')).toContainText('Back at the Cobblecrest Lantern House.');
  if (page.viewportSize().width === 390) {
    await page.screenshot({ path: path.join(artifactsDir('playtest-fixes-3'), 'respawn-toast-390.png') });
  }
  const cc = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id, money: PixelPets.state.money | 0, respawn: PixelPets.state.world.respawn,
    hurt: PixelPets.state.party.some((p) => Number.isFinite(p.hpNow)),
    due: PixelPets.lanternRest.due, scene: !!PixelPets.scene,
    nrg: PixelPets.state.party.map((p) => p.energy),
  }));
  expect(cc.map).toBe('cc_lantern_in');
  expect(cc.money).toBe(55);
  expect(cc.respawn).toBe('hearthmoor');
  expect(cc.hurt).toBe(false);
  expect(cc.due).toBe(false);
  expect(cc.scene).toBe(false);
  expect(cc.nrg.length).toBe(hall.mid.nrg.length);
  cc.nrg.forEach((n, i) => expect(Math.abs(n - hall.mid.nrg[i])).toBeLessThan(0.5));
  await page.evaluate(() => PixelPets.goto('cc_lantern_in', 4, 5, 'down'));
  await page.evaluate(() => PixelPets.walkStep('down'));
  await page.waitForFunction(() => PixelPets.mapInfo.id === 'cobblecrest' && !PixelPets.fading);
  const keys = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort());

  await page.evaluate(() => {
    PixelPets.setFlag('story.reached_fernbrook', true);
    PixelPets.setFlag('story.reached_cobblecrest', true);
    PixelPets.state.world.respawn = 'cobblecrest';
    PixelPets.goto('route2', 10, 8, 'down');
  });
  await wipe(page);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('cc_lantern_in');

  await page.evaluate(() => {
    PixelPets.state.world.respawn = 'hearthmoor';
    PixelPets.goto('route2', 10, 8, 'down');
  });
  await wipe(page);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('fb_lantern_in');

  await page.evaluate(() => {
    PixelPets.setFlag('story.reached_cobblecrest', false);
    PixelPets.setFlag('story.reached_fernbrook', true);
    if (PixelPets.state.mapSeen) delete PixelPets.state.mapSeen.cobblecrest;
    PixelPets.state.world.respawn = 'hearthmoor';
    PixelPets.goto('hw_cut', 8, 8, 'down');
  });
  await wipe(page);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('fb_lantern_in');

  await page.evaluate(() => PixelPets.goto('dream_party', 4, 4, 'down'));
  await wipe(page);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('hm_lantern_in');

  await page.evaluate(() => {
    PixelPets.setFlag('story.reached_fernbrook', true);
    PixelPets.goto('sm_den', 4, 4, 'down');
  });
  await wipe(page);
  expect(await page.evaluate(() => PixelPets.mapInfo.id)).toBe('fb_lantern_in');

  await page.evaluate(() => {
    PixelPets.state.world.respawn = null;
    PixelPets.setFlag('story.reached_fernbrook', false);
    PixelPets.goto('route1', 8, 8, 'down');
  });
  await wipe(page);
  const fresh = await page.evaluate(() => ({
    map: PixelPets.mapInfo.id,
    v: PixelPets.state.v,
    keys: Object.keys(JSON.parse(localStorage.getItem('pixelpets.save.v2'))).sort(),
    money: PixelPets.state.money | 0,
  }));
  expect(fresh.map).toBe('hm_lantern_in');
  expect(fresh.v).toBe(2);
  expect(fresh.money).toBe(55);
  expect(fresh.keys).toEqual(keys);
});

test('the post-capture picker shows each Walkling icon', async ({ page }) => {
  const save = starterSave();
  await boot(page, save);
  await page.evaluate(() => {
    PixelPets.fillParty();
    PixelPets.state.party.forEach((p, i) => { p.nick = 'Pet' + i; });
    PixelPets.state.party[2].faded = 1;
    PixelPets.offerCatchRoom();
  });
  await expect(page.locator('#shTitle')).toHaveText('Who goes to the box?');
  const rows = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('#shList .sh-item')];
    const px = (c) => [...c.getContext('2d').getImageData(0, 0, 18, 18).data].join(',');
    return {
      n: buttons.length,
      rows: buttons.map((b) => {
        const r = b.getBoundingClientRect();
        const ico = b.querySelector('canvas.bag-ico');
        const label = b.querySelector('.sh-l');
        return {
          text: label.textContent,
          h: r.height,
          ico: ico ? { w: ico.width, h: ico.height, has: b.classList.contains('has-ico') } : null,
          line: label.scrollHeight <= 24,
          pixels: ico ? px(ico) : '',
        };
      }),
    };
  });
  expect(rows.n).toBe(6);
  for (const row of rows.rows) {
    expect(row.h).toBeGreaterThanOrEqual(52);
    expect(row.h).toBeLessThan(56);
    expect(row.ico).toEqual({ w: 18, h: 18, has: true });
    expect(row.line).toBe(true);
  }
  const healthy = rows.rows.find((r) => r.text.indexOf('Pet0') === 0);
  const faded = rows.rows.find((r) => r.text.indexOf('Pet2') === 0);
  expect(faded.pixels).not.toBe(healthy.pixels);
  expect(faded.pixels.length).toBeGreaterThan(10);
  if (page.viewportSize().width === 320) {
    await page.screenshot({ path: path.join(artifactsDir('playtest-fixes-3'), 'picker-320.png') });
  }
  await page.locator('#shList .sh-item', { hasText: 'Pet2' }).click();
  const moved = await page.evaluate(() => ({
    box: PixelPets.state.box.map((p) => p.nick),
    party: PixelPets.state.party.map((p) => p.nick),
  }));
  expect(moved.box).toContain('Pet2');
  expect(moved.party).not.toContain('Pet2');
  expect(moved.party).toHaveLength(6);
});

async function ringHits(page, sel) {
  await expect(page.locator('#tutRing')).toBeVisible();
  return page.evaluate((sel) => {
    const ring = document.querySelector('#tutRing').getBoundingClientRect();
    const t = document.querySelector(sel).getBoundingClientRect();
    const ox = Math.min(ring.right, t.right) - Math.max(ring.left, t.left);
    const oy = Math.min(ring.bottom, t.bottom) - Math.max(ring.top, t.top);
    return ox > 8 && oy > 8;
  }, sel);
}

test('the party tip chain rings its targets, and SKIP marks all three', async ({ page }) => {
  test.setTimeout(60000);
  const width = page.viewportSize().width;
  const modes = width === 375 ? ['modern'] : ['modern', 'arcade'];
  for (const mode of modes) {
    const save = starterSave();
    save.settings.controls = mode;
    save.settings.tips = true;
    save.party.push(pet({ id: 'petb', nick: 'Brook', xp: 80 }));
    await boot(page, save);
    await expect(page.locator('#unlockTitle')).toHaveText('Your Party', { timeout: 4000 });
    const partySel = mode === 'modern' ? '#colFloat' : '#tabs button[data-tab="col"]';
    expect(await ringHits(page, partySel)).toBe(true);
    await page.locator('#unlockShow').click();
    await expect(page.locator('#unlockTitle')).toHaveText('View moves');
    expect(await ringHits(page, '#partyBoard .party-slot[data-slot="1"] .slot-main')).toBe(true);
    await page.locator('#unlockShow').click();
    await expect(page.locator('#unlockTitle')).toHaveText('Move up');
    expect(await page.locator('#unlockSkip')).toHaveText('GOT IT');
    expect(await ringHits(page, '#wlActions [aria-label="Party up"]')).toBe(true);
    const order = await page.evaluate(() => PixelPets.state.party.map((p) => p.id));
    await page.locator('#wlActions [aria-label="Party up"]').click();
    const swapped = await page.evaluate(() => PixelPets.state.party.map((p) => p.id));
    expect(swapped[0]).toBe(order[1]);
    expect(swapped[1]).toBe(order[0]);
    await expect(page.locator('#unlockCard')).toBeVisible();
    await page.locator('#unlockSkip').click();
    await expect(page.locator('#unlockCard')).toBeHidden();
    await expect(page.locator('#ownedList .group-label').first()).toHaveText('Party 2/6');
  }

  const skip = starterSave();
  skip.settings.controls = 'modern';
  skip.party.push(pet({ id: 'petc', nick: 'Cinder' }));
  await boot(page, skip);
  await expect(page.locator('#unlockTitle')).toHaveText('Your Party', { timeout: 4000 });
  await page.locator('#unlockSkip').click();
  await expect(page.locator('#unlockCard')).toBeHidden();
  const flags = await page.evaluate(() => ({
    a: PixelPets.state.flags['story.unlock_party'] === true,
    b: PixelPets.state.flags['story.unlock_party_moves'] === true,
    c: PixelPets.state.flags['story.unlock_party_order'] === true,
  }));
  expect(flags).toEqual({ a: true, b: true, c: true });
  await page.waitForTimeout(1200);
  await expect(page.locator('#unlockCard')).toBeHidden();

  const vet = starterSave();
  vet.party.push(pet({ id: 'petd' }));
  vet.party.push(pet({ id: 'pete', species: 'bloom' }));
  await boot(page, vet);
  await expect(page.locator('#unlockTitle')).toHaveText('Your Party', { timeout: 4000 });
  await page.locator('#unlockSkip').click();
  await reloadSaved(page);
  await page.waitForTimeout(1200);
  await expect(page.locator('#unlockCard')).toBeHidden();

  const quiet = starterSave();
  quiet.settings.tips = false;
  quiet.party.push(pet({ id: 'petf' }));
  await boot(page, quiet);
  await page.waitForTimeout(1200);
  await expect(page.locator('#unlockCard')).toBeHidden();
});
