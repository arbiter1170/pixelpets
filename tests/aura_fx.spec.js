/* STORES_AND_TOWN_LIFE P3a. Effects on the walk map and in the wardrobe.
   Save stays pixelpets.save.v2 with v 2. New data is the aura pet field and settings.effects. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

function save(extra) {
  const s = starterSave();
  s.player.name = 'Tester';
  s.party[0].nick = 'Pipkit';
  s.money = 0;
  s.settings.follower = true;
  s.settings.music = false;
  s.settings.tips = false;
  if (extra) Object.assign(s, extra);
  return s;
}

async function boot(page, s, search) {
  const q = search == null ? '?debug=1' : search;
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, q);
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.state);
  if (q.indexOf('debug=1') >= 0) await page.waitForFunction(() => window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function frame(page, n) {
  await page.evaluate((n) => new Promise((resolve) => {
    let left = n || 2;
    const step = () => { if (--left <= 0) resolve(0); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), n || 2);
}

function ink(page) {
  return page.evaluate(() => {
    const c = document.querySelector('#wardPreview');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const n = { o: 0, y: 0, r: 0, s: 0, px: 0 };
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200) continue;
      n.px++;
      if (d[i] === 0xef && d[i + 1] === 0x7d && d[i + 2] === 0x57) n.o++;
      if (d[i] === 0xff && d[i + 1] === 0xcd && d[i + 2] === 0x75) n.y++;
      if (d[i] === 0xb1 && d[i + 1] === 0x3e && d[i + 2] === 0x53) n.r++;
      if (d[i] === 0x73 && d[i + 1] === 0xef && d[i + 2] === 0xf7) n.s++;
    }
    return n;
  });
}

test.describe('effects', () => {
  trackErrors(test, expect);

  test('devGrant is absent without the debug flag', async ({ page }) => {
    await boot(page, save(), '');
    expect(await page.evaluate(() => PixelPets.devGrant)).toBeUndefined();
    expect(await page.evaluate(() => window.devGrant)).toBeUndefined();
    expect(await page.evaluate(() => document.documentElement.innerHTML.indexOf('devGrant') >= 0)).toBe(false);
  });

  test('the debug grant sets a Walkling look and marks the save @w1', async ({ page }) => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
    const getter = "Object.defineProperty(api, 'devGrant', { get(){ return DEBUG ? devGrant : undefined; } })";
    expect(src).toContain(getter);
    expect(src.match(/devGrant/g)).toEqual(['devGrant', 'devGrant', 'devGrant']);
    expect(src).toMatch(/function devGrant\(id\)\{/);
    expect(src).not.toMatch(/api\.devGrant\s*=/);
    expect(src).not.toMatch(/window\.devGrant/);
    expect(src).not.toMatch(/'dev' \+ 'Grant'/);
    expect(src).toContain('PixelPets[dbgGrant.dataset.api]');
    const dbg = fs.readFileSync(path.join(__dirname, '..', 'debug_ui.js'), 'utf8');
    expect(dbg).toContain('data-api="devGrant"');
    expect(dbg.match(/devGrant/g)).toEqual(['devGrant']);
    const fnAt = src.indexOf('function devGrant(id){');
    const fn = src.slice(fnAt, src.indexOf('\n  }', fnAt) + 4);
    expect(fn).not.toMatch(/localhost|127\.0\.0\.1|github\.io/);
    expect(getter).not.toMatch(/localhost|127\.0\.0\.1|github\.io/);
    expect(src).toMatch(/AURA_FX/);
    expect(src).not.toMatch(/id: 'kilnsmoke'/);
    const fol = src.slice(src.indexOf('const drawFollower = () =>'), src.indexOf('const ents = wild.list'));
    expect(fol.indexOf('drawAura')).toBeGreaterThan(fol.indexOf('fx < -18'));
    expect(src).toMatch(/document\.hidden/);
    expect(src.indexOf('function drawPetScene')).toBeGreaterThan(0);
    const scene = src.slice(src.indexOf('function drawPetScene('), src.indexOf('function drawPetScene(') + 4000);
    expect(scene).not.toMatch(/drawAura\(/);
    expect(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')).not.toMatch(/devGrant/);

    await boot(page, save(), '?debug=1');
    const granted = await page.evaluate(() => {
      const ember = PixelPets.devGrant('emberwake');
      const bell = PixelPets.devGrant('bell');
      const beanie = PixelPets.devGrant('beanie');
      const kiln = PixelPets.devGrant('kilnsmoke');
      const fly = PixelPets.devGrant('lanternfly');
      return {
        ember, bell, beanie, kiln, fly,
        flags: {
          ember: PixelPets.state.flags['wardrobe.emberwake'] === true,
          bell: PixelPets.state.flags['wardrobe.bell'] === true,
          kiln: PixelPets.state.flags['wardrobe.kilnsmoke'] === true,
          fly: PixelPets.state.flags['wardrobe.lanternfly'] === true,
          beanie: PixelPets.state.flags['wardrobe.beanie'] === true,
        },
        debugSave: PixelPets.state.debugSave === true,
        v: PixelPets.state.v,
        onWindow: window.devGrant,
      };
    });
    expect(granted.ember).toBe(true);
    expect(granted.bell).toBe(true);
    expect(granted.beanie).toBe(false);
    expect(granted.kiln).toBe(true);
    expect(granted.fly).toBe(true);
    expect(granted.flags).toEqual({ ember: true, bell: true, kiln: true, fly: true, beanie: false });
    expect(granted.debugSave).toBe(true);
    expect(granted.onWindow).toBeUndefined();
    expect(granted.v).toBe(2);
  });

  test('an unknown aura is dropped and settings.effects fills in', async ({ page }) => {
    await boot(page, save(), '?debug=1');
    const out = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
      raw.party[0].aura = 'nope';
      raw.settings.effects = 'loud';
      const bad = PPSave.normalizeV2(JSON.parse(JSON.stringify(raw)));
      raw.party[0].aura = 'emberwake';
      raw.settings.effects = 'calm';
      const kept = PPSave.normalizeV2(JSON.parse(JSON.stringify(raw)));
      return {
        v: bad.v,
        nope: Object.prototype.hasOwnProperty.call(bad.party[0], 'aura'),
        loud: bad.settings.effects,
        kept: kept.party[0].aura,
        calm: kept.settings.effects,
      };
    });
    expect(out.v).toBe(2);
    expect(out.nope).toBe(false);
    expect(out.loud === 'full' || out.loud === 'calm').toBe(true);
    expect(out.kept).toBe('emberwake');
    expect(out.calm).toBe('calm');
  });

  test('reduced motion is CALM and OFF still draws nothing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await boot(page, save(), '?debug=1');
    const first = await page.evaluate(() => ({ setting: PixelPets.aura.setting, mode: PixelPets.aura.mode }));
    expect(first.setting).toBe('calm');
    expect(first.mode).toBe('calm');
    const forced = await page.evaluate(() => {
      PixelPets.state.settings.effects = 'full';
      const calm = PixelPets.aura.mode;
      PixelPets.state.settings.effects = 'off';
      return { calm, off: PixelPets.aura.mode };
    });
    expect(forced).toEqual({ calm: 'calm', off: 'off' });
  });

  test('EFFECTS cycles, saves, and the row is at least 44 px', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await boot(page, save(), '?debug=1');
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#setEffectsVal')).toHaveText('FULL');
    const box = await page.locator('#setEffects').boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
    await page.locator('#setEffects').click();
    await expect(page.locator('#setEffectsVal')).toHaveText('CALM');
    await page.locator('#setEffects').click();
    await expect(page.locator('#setEffectsVal')).toHaveText('OFF');
    await page.locator('#setEffects').click();
    await expect(page.locator('#setEffectsVal')).toHaveText('FULL');
    await page.locator('#setEffects').click();
    await expect(page.locator('#setEffectsVal')).toHaveText('CALM');
    const stored = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
      const again = PPSave.normalizeV2(JSON.parse(JSON.stringify(raw)));
      return { effects: raw.settings.effects, again: again.settings.effects, v: raw.v };
    });
    expect(stored).toEqual({ effects: 'calm', again: 'calm', v: 2 });
    await page.locator('#setClose').click();
  });

  test('Emberwake waits for the first seal and is bought once', async ({ page }) => {
    await boot(page, save(), '?debug=1');
    await page.evaluate(() => openWardrobe());
    await expect(page.locator('.ward-item[data-id="emberwake"]')).toHaveCount(0);
    await expect(page.locator('.ward-item[data-id="lanternfly"]')).toHaveCount(0);
    await page.evaluate(() => {
      PixelPets.state.flags['story.seal1'] = true;
      PixelPets.state.money = 100;
      openWardrobe();
    });
    await expect(page.locator('.ward-item[data-id="emberwake"]')).toHaveCount(1);
    const act = await page.locator('.ward-item[data-id="emberwake"] .ward-act').boundingBox();
    expect(act.height).toBeGreaterThanOrEqual(44);
    expect(act.width).toBeGreaterThanOrEqual(44);
    await expect(page.locator('.ward-item[data-id="emberwake"] .ward-state')).toHaveText('2400 Acorns');
    await page.locator('.ward-item[data-id="emberwake"] .ward-act').click();
    await expect(page.locator('#toast')).toHaveText('Not enough Acorns.');
    expect(await page.evaluate(() => PixelPets.state.flags['wardrobe.emberwake'] === true)).toBe(false);
    await page.evaluate(() => { PixelPets.state.money = 2400; });
    await page.locator('#ovWardrobe .ward-money, #wardMoney').first().waitFor();
    await page.locator('.ward-item[data-id="emberwake"] .ward-act').click();
    await expect(page.locator('#toast')).toHaveText('Emberwake is yours.');
    const bought = await page.evaluate(() => ({
      money: PixelPets.state.money | 0,
      flag: PixelPets.state.flags['wardrobe.emberwake'] === true,
      v: PixelPets.state.v,
    }));
    expect(bought).toEqual({ money: 0, flag: true, v: 2 });
    await expect(page.locator('.ward-item[data-id="emberwake"] .ward-act')).toHaveText('WEAR');
    await page.waitForTimeout(450);
    await page.locator('.ward-item[data-id="emberwake"] .ward-act').click();
    await expect(page.locator('#toast')).toHaveText('Pipkit shows Emberwake.');
    expect(await page.evaluate(() => PixelPets.state.party[0].aura)).toBe('emberwake');
    await expect(page.locator('.ward-item[data-id="emberwake"] .ward-act')).toHaveText('WORN');
    await page.locator('.ward-item[data-id="emberwake"] .ward-act').click();
    expect(await page.evaluate(() => PixelPets.state.money | 0)).toBe(0);
  });

  test('Lanternfly motes are bought once at the Lantern Market', async ({ page }) => {
    const s = save();
    s.money = 3000;
    await boot(page, s, '?debug=1');
    const opened = await page.evaluate(() => {
      const o = PixelPets.mapInfo && PixelPets.goto('highcharity', 2, 2, 'down');
      const npc = (PixelPets.mapInfo.objs || []).find(x => x.id === 'hc_shop');
      if (!npc) return { ok: false, reason: 'npc', at: o };
      const tries = [
        [npc.x, npc.y + 1, 'up'],
        [npc.x, npc.y - 1, 'down'],
        [npc.x + 1, npc.y, 'left'],
        [npc.x - 1, npc.y, 'right'],
      ];
      for (const t of tries) {
        const info = PixelPets.tileInfo(t[0], t[1]);
        if (info && info.walk && !info.blocked) {
          PixelPets.goto('highcharity', t[0], t[1], t[2]);
          return { ok: true, x: t[0], y: t[1], facing: t[2] };
        }
      }
      return { ok: false, reason: 'tile', npc };
    });
    expect(opened.ok, JSON.stringify(opened)).toBe(true);
    await page.keyboard.press('Space');
    await page.waitForSelector('#ovShop:not([hidden])');
    await expect(page.locator('#shopTitle')).toHaveText('Lantern Market');
    const row = page.locator('.shop-row[data-id="lanternfly"]');
    await expect(row).toBeVisible();
    const buy = row.locator('.shop-buy');
    const buyBox = await buy.boundingBox();
    expect(buyBox.height).toBeGreaterThanOrEqual(44);
    await buy.click();
    await expect(page.locator('#toast')).toHaveText('Lanternfly motes is yours.');
    const once = await page.evaluate(() => ({
      money: PixelPets.state.money | 0,
      flag: PixelPets.state.flags['wardrobe.lanternfly'] === true,
      v: PixelPets.state.v,
    }));
    expect(once).toEqual({ money: 0, flag: true, v: 2 });
    await expect(buy).toHaveText('OWNED');
    await buy.click({ force: true });
    expect(await page.evaluate(() => PixelPets.state.money | 0)).toBe(0);
    await page.evaluate(() => { document.querySelector('#ovShop').hidden = true; openWardrobe(); });
    await expect(page.locator('.ward-item[data-id="lanternfly"]')).toHaveCount(1);
    await expect(page.locator('.ward-item[data-id="emberwake"]')).toHaveCount(0);
  });

  test('caps hold, the wardrobe preview draws, and a panel hides the map effect', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await boot(page, save(), '?debug=1');
    const problems = await page.evaluate(() => PixelPets.auraCheck());
    expect(problems).toEqual([]);
    const caps = await page.evaluate(() => PixelPets.aura.caps);
    expect(caps).toEqual({ emberwake: 6, kilnsmoke: 5, lanternfly: 3, frame: 12 });

    await page.evaluate(() => {
      PixelPets.state.settings.effects = 'full';
      PixelPets.devGrant('emberwake');
      setAura(PixelPets.state.partnerId, 'emberwake');
      PixelPets.goto('hearthmoor', 16, 13, 'down');
    });
    await frame(page, 3);
    const ember = await page.evaluate(() => PixelPets.aura);
    expect(ember.mode).toBe('full');
    expect(ember.on.emberwake).toBeGreaterThan(0);
    expect(ember.on.emberwake).toBeLessThanOrEqual(6);
    expect(ember.live).toBeLessThanOrEqual(12);
    expect(ember.drawn).toBeGreaterThan(0);
    expect(ember.drawn).toBeLessThanOrEqual(12);

    await page.locator('#settingsBtn').click();
    await frame(page, 2);
    expect(await page.evaluate(() => PixelPets.aura.drawn)).toBe(0);
    await page.locator('#setClose').click();

    await page.evaluate(() => openWardrobe());
    await page.locator('.ward-item[data-id="emberwake"] .ward-art').click();
    await page.evaluate(() => { PixelPets.state.settings.effects = 'off'; });
    await frame(page, 2);
    const bare = (await ink(page)).o;
    await page.evaluate(() => { PixelPets.state.settings.effects = 'full'; });
    await frame(page, 2);
    const worn = await ink(page);
    expect(worn.o).toBeGreaterThan(bare);
    await page.evaluate(() => { PixelPets.state.settings.effects = 'off'; });
    await frame(page, 2);
    expect((await ink(page)).o).toBe(bare);
    await page.locator('#wardDone').click();

    await page.evaluate(() => {
      PixelPets.state.settings.effects = 'full';
      PixelPets.devGrant('lanternfly');
      setAura(PixelPets.state.partnerId, 'lanternfly');
      PixelPets.clock.set('tue', 12, 0);
    });
    await frame(page, 3);
    const day = await page.evaluate(() => PixelPets.aura);
    expect(day.on.lanternfly).toBeGreaterThan(0);
    expect(day.on.lanternfly).toBeLessThanOrEqual(3);
    expect(day.drawn).toBeLessThanOrEqual(12);
    await page.evaluate(() => { openWardrobe(); PixelPets.clock.set('tue', 12, 0); });
    await page.locator('.ward-item[data-id="lanternfly"] .ward-art').click();
    await frame(page, 2);
    const dayInk = await ink(page);
    await page.evaluate(() => PixelPets.clock.set('tue', 21, 0));
    await frame(page, 2);
    const nightInk = await ink(page);
    expect(nightInk.s).toBeGreaterThan(dayInk.s);
    await page.locator('#wardDone').click();

    await page.evaluate(() => {
      PixelPets.state.settings.effects = 'full';
      PixelPets.devGrant('kilnsmoke');
      setAura(PixelPets.state.partnerId, 'kilnsmoke');
      PixelPets.goto('hearthmoor', 16, 14, 'down');
    });
    await page.evaluate(() => {
      PixelPets.walkStep('down');
      PixelPets.walkStep('down');
      PixelPets.walkStep('down');
      PixelPets.walkStep('right');
    });
    await frame(page, 2);
    const trail = await page.evaluate(() => PixelPets.aura);
    expect(trail.on.kilnsmoke).toBeGreaterThan(0);
    expect(trail.on.kilnsmoke).toBeLessThanOrEqual(5);
    expect(trail.live).toBeLessThanOrEqual(12);

    await page.evaluate(() => { PixelPets.state.settings.effects = 'calm'; });
    await frame(page, 2);
    const calm = await page.evaluate(() => PixelPets.aura);
    expect(calm.mode).toBe('calm');
    expect(calm.live).toBeLessThanOrEqual(1);
    expect(calm.drawn).toBeLessThanOrEqual(1);

    const moved = await page.evaluate(() => {
      const s = PixelPets.state;
      s.party.push({
        id: 'petsmoke2', species: 'tide', stage: 0, xp: 10,
        hunger: 80, happy: 60, energy: 90, nick: 'Brook', origin: 'wild',
      });
      s.settings.effects = 'full';
      setAura(s.party[0].id, 'emberwake');
      const r = setAura('petsmoke2', 'emberwake');
      return { ok: r && r.ok, moved: !!(r && r.moved), a: s.party[0].aura || null, b: s.party[1].aura };
    });
    expect(moved.ok).toBe(true);
    expect(moved.moved).toBe(true);
    expect(moved.a).toBe(null);
    expect(moved.b).toBe('emberwake');

    const battle = await page.evaluate(() => PixelPets.spawnEncounter({ species: 'tide', stage: 0, level: 3, hpFrac: 1 }));
    expect(battle.ok).toBe(true);
    await frame(page, 2);
    expect(await page.evaluate(() => PixelPets.aura.drawn)).toBe(0);
  });

  test('the preview keeps drawing from the same canvases @w1', async ({ page }, info) => {
    test.skip(info.project.name !== '320', 'counted once');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await boot(page, save(), '?debug=1');
    await page.evaluate(() => {
      PixelPets.state.settings.effects = 'full';
      PixelPets.devGrant('emberwake');
      setAura(PixelPets.state.partnerId, 'emberwake');
      PixelPets.goto('hearthmoor', 16, 13, 'down');
    });
    const read = () => page.evaluate(() => ({ live: PixelPets.canvases, made: PixelPets.canvasMade }));
    await frame(page, 90);
    const before = await read();
    await frame(page, 600);
    const afterFrames = await read();
    expect(afterFrames.made).toBe(before.made);

    await page.locator('#settingsBtn').click();
    await page.locator('#setClose').click();
    await page.locator('#settingsBtn').click();
    await page.locator('#setClose').click();
    const afterSettings = await read();
    expect(afterSettings.made).toBe(afterFrames.made);

    await page.locator('#repBtn').click();
    await expect(page.locator('#ovRep:not([hidden])')).toBeVisible();
    await page.locator('#repBack').click();
    const peopleOnce = await read();
    await page.locator('#repBtn').click();
    await page.locator('#repBack').click();
    const afterPeople = await read();
    expect(afterPeople.made).toBe(peopleOnce.made);

    await page.evaluate(() => { PixelPets.state.settings.effects = 'off'; openWardrobe(); });
    const openOff = await read();
    await page.locator('#wardDone').click();
    const closedOff = await read();
    await page.evaluate(() => { PixelPets.state.settings.effects = 'full'; openWardrobe(); });
    const openOn = await read();
    await frame(page, 30);
    const preview = await read();
    expect(preview.made).toBe(openOn.made);
    await page.locator('#wardDone').click();
    const afterWard = await read();
    expect(openOn.made - closedOff.made).toBe(openOff.made - afterPeople.made);
    expect(afterWard.made).toBe(openOn.made);
    expect(afterFrames.made - before.made).toBe(0);
    console.log('PP_AURA_CANVAS ' + JSON.stringify({
      before: before.made,
      after600: afterFrames.made,
      settings: afterSettings.made,
      peopleOnce: peopleOnce.made,
      peopleTwice: afterPeople.made,
      wardOff: openOff.made,
      wardClosed: closedOff.made,
      wardOn: openOn.made,
      preview: preview.made,
      wardDone: afterWard.made,
    }));
  });
});
