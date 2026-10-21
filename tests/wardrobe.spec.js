/* WORLD_CLOCK_TOWN P3. Stitch & Lantern wardrobe v1.
   Save stays pixelpets.save.v2 with v 2. New data is wardrobe.* flags only. */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const FREE_ACC = ['none', 'glasses', 'bow', 'cap', 'scarf'];
const FREE_COL = ['t', 'b', 'g', 'p', 'n', 'r', 'm'];
const FREE_GEAR = ['None', 'Lodge bell', 'Hall ribbon', 'Hearth scarf', 'Orchard sprig', 'Amber star'];

function save(extra) {
  const s = starterSave();
  s.settings.follower = false;
  s.player.name = 'Tester';
  s.party[0].nick = 'Pipkit';
  s.money = 0;
  if (extra) Object.assign(s, extra);
  return s;
}

function secondPet(s) {
  s.party.push({
    id: 'petsmoke2', species: 'tide', stage: 0, xp: 10,
    hunger: 80, happy: 60, energy: 90, nick: 'Brook', origin: 'wild',
  });
  return s;
}

async function boot(page, s) {
  await installSave(page.context(), s || save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function openFromMarigold(page) {
  await page.evaluate(() => PixelPets.goto('hm_wardrobe', 9, 3, 'up'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  await page.keyboard.press('Space');
  await page.waitForSelector('#ovWardrobe:not([hidden])');
}

test('every form wears each new accessory', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.adornCheck())).toEqual([]);
});

test('holder layers draw in every facing and frame', async ({ page }) => {
  await boot(page);
  const missing = await page.evaluate(() => {
    const bad = [];
    const paint = (hair, outfit, acc, facing, fr) => {
      const look = Object.assign({}, KEEPER_LOOKS.defaults, { hair, outfit, accessory: acc });
      const c = window.keeperFrames(look)[facing][fr];
      return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    };
    for (const acc of ['sash', 'satchel', 'goggles', 'beanie']) {
      for (const hair of KEEPER_LOOKS.hair) {
        for (const outfit of KEEPER_LOOKS.outfit) {
          for (const facing of ['down', 'right', 'up', 'left']) {
            for (const fr of [0, 1]) {
              const bare = paint(hair, outfit, 'none', facing, fr);
              const worn = paint(hair, outfit, acc, facing, fr);
              let diff = 0;
              for (let i = 0; i < worn.length; i += 4) {
                if (worn[i] !== bare[i] || worn[i + 1] !== bare[i + 1] || worn[i + 2] !== bare[i + 2] || worn[i + 3] !== bare[i + 3]) diff++;
              }
              if (diff < 1) bad.push(acc + ' ' + hair + ' ' + outfit + ' ' + facing + ' ' + fr);
            }
          }
        }
      }
    }
    return bad.slice(0, 8);
  });
  expect(missing).toEqual([]);
});

test('BUY refuses 119 Acorns and takes 120 for the Wick charm', async ({ page }) => {
  const s = save();
  s.money = 119;
  await boot(page, s);
  await openFromMarigold(page);
  const keysBefore = await page.evaluate(() => Object.keys(PixelPets.state).sort());
  await page.locator('.ward-item[data-id="wick_charm"] .ward-act').click();
  await expect(page.locator('#toast')).toHaveText('Not enough Acorns.');
  const denied = await page.evaluate(() => ({
    money: PixelPets.state.money,
    flag: PixelPets.state.flags['wardrobe.wick_charm'] === true,
    worn: PixelPets.state.party[0].accessory || 'none',
    btn: document.querySelector('.ward-item[data-id="wick_charm"] .ward-act').textContent,
  }));
  expect(denied).toEqual({ money: 119, flag: false, worn: 'none', btn: 'BUY' });

  await page.evaluate(() => { PixelPets.state.money = 120; });
  await page.locator('.ward-item[data-id="wick_charm"] .ward-act').click();
  await expect(page.locator('#toast')).toHaveText('Wick charm is yours.');
  const bought = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return {
      money: PixelPets.state.money,
      flag: PixelPets.state.flags['wardrobe.wick_charm'] === true,
      saved: raw.flags['wardrobe.wick_charm'] === true,
      v: raw.v,
      worn: PixelPets.state.party[0].accessory || 'none',
      btn: document.querySelector('.ward-item[data-id="wick_charm"] .ward-act').textContent,
      keys: Object.keys(PixelPets.state).sort(),
      rawKeys: Object.keys(raw).sort(),
    };
  });
  expect(bought.money).toBe(0);
  expect(bought.flag).toBe(true);
  expect(bought.saved).toBe(true);
  expect(bought.v).toBe(2);
  expect(bought.worn).toBe('none');
  expect(bought.btn).toBe('WEAR');
  expect(bought.keys).toEqual(keysBefore);
  expect(bought.rawKeys).toEqual(keysBefore);
  expect(bought.keys).not.toContain('wardrobe');

  await page.locator('.ward-item[data-id="wick_charm"] .ward-act').click();
  const held = await page.evaluate(() => PixelPets.state.party[0].accessory || 'none');
  expect(held).toBe('none');
  await page.waitForTimeout(450);
  await page.locator('.ward-item[data-id="wick_charm"] .ward-act').click();
  await expect(page.locator('#toast')).toHaveText('Pipkit wears the Wick charm.');
  expect(await page.evaluate(() => PixelPets.state.party[0].accessory)).toBe('wick_charm');

  if (page.viewportSize().width === 390) {
    fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
    await page.screenshot({ path: '/opt/cursor/artifacts/wardrobe-walkling-390.png' });
    await page.locator('#ovWardrobe .ward-tabs button[data-tab="holder"]').click();
    await page.screenshot({ path: '/opt/cursor/artifacts/wardrobe-holder-390.png' });
    await page.locator('#wardDone').click();
    await page.evaluate(() => PixelPets.showTab('pet'));
    await page.screenshot({ path: '/opt/cursor/artifacts/wardrobe-worn-390.png' });
  }
});

test('a paid Walkling item moves to the next wearer', async ({ page }) => {
  const s = secondPet(save());
  s.flags['wardrobe.fern_scarf'] = true;
  s.party[0].accessory = 'fern_scarf';
  await boot(page, s);
  await openFromMarigold(page);
  await page.locator('.ward-chip', { hasText: 'Brook' }).click();
  await page.locator('.ward-item[data-id="fern_scarf"] .ward-act').click();
  await expect(page.locator('#toast')).toHaveText('Fern scarf moved to Brook.');
  const worn = await page.evaluate(() => ({
    a: PixelPets.state.party[0].accessory || 'none',
    b: PixelPets.state.party[1].accessory || 'none',
  }));
  expect(worn).toEqual({ a: 'none', b: 'fern_scarf' });
});

test('release puts a paid item back on the rack and keeps the flag', async ({ page }) => {
  const s = secondPet(save());
  s.money = 40;
  s.flags['wardrobe.clover_crown'] = true;
  s.party[0].accessory = 'clover_crown';
  await boot(page, s);
  await page.evaluate(() => window.releasePet('petsmoke1'));
  await expect(page.locator('#toast')).toHaveText('Clover crown is back on the rack.');
  const kept = await page.evaluate(() => ({
    flag: PixelPets.state.flags['wardrobe.clover_crown'] === true,
    money: PixelPets.state.money,
    left: PixelPets.state.party.map(p => p.nick),
    v: PixelPets.state.v,
  }));
  expect(kept.flag).toBe(true);
  expect(kept.money).toBe(40);
  expect(kept.left).toEqual(['Brook']);
  expect(kept.v).toBe(2);
  await openFromMarigold(page);
  await expect(page.locator('.ward-item[data-id="clover_crown"] .ward-act')).toHaveText('WEAR');
  await page.locator('.ward-item[data-id="clover_crown"] .ward-act').click();
  await expect(page.locator('#toast')).toHaveText('Brook wears the Clover crown.');
  expect(await page.evaluate(() => PixelPets.state.party[0].accessory)).toBe('clover_crown');
});

test('CHANGE LOOK, shuffle and GEAR hide an unowned paid item', async ({ page }) => {
  await boot(page);
  const refused = await page.evaluate(() => setAccessory(PixelPets.state.party[0].id, 'wick_charm'));
  expect(refused).toEqual({ ok: false });
  const lists = await page.evaluate(() => ({
    acc: lookChoices('accessory'),
    col: lookChoices('outfitCol'),
  }));
  expect(lists.acc).toEqual(FREE_ACC);
  expect(lists.col).toEqual(FREE_COL);

  await page.locator('#settingsBtn').click();
  await page.locator('#setLook').click();
  await page.waitForSelector('#ovLook:not([hidden])');
  const buttons = await page.evaluate(() => ({
    acc: [...document.querySelectorAll('#lookAccessory button')].map(b => b.dataset.opt),
    col: [...document.querySelectorAll('#lookOutfitCol button')].map(b => b.dataset.opt),
  }));
  expect(buttons.acc).toEqual(FREE_ACC);
  expect(buttons.col).toEqual(FREE_COL);
  for (let i = 0; i < 8; i++) await page.locator('#lookShuffle').click();
  const picked = await page.evaluate(() => ({
    acc: document.querySelector('#lookAccessory button.on').dataset.opt,
    col: document.querySelector('#lookOutfitCol button.on').dataset.opt,
  }));
  expect(FREE_ACC).toContain(picked.acc);
  expect(FREE_COL).toContain(picked.col);
  await page.locator('#lookDone').click();
  await page.evaluate(() => PixelPets.showTab('pet'));
  await page.locator('#petKitBtn').click();
  await expect(page.locator('#scGearBox [data-acc]')).toHaveText(FREE_GEAR);
});

test('the picker fits a phone and keeps 44px targets', async ({ page }) => {
  await boot(page);
  await openFromMarigold(page);
  const fit = await page.evaluate(() => {
    const done = document.querySelector('#wardDone').getBoundingClientRect();
    const grid = document.querySelector('#wardGrid');
    const buttons = [...document.querySelectorAll('#ovWardrobe button')].map(b => {
      const r = b.getBoundingClientRect();
      return { h: r.height, w: r.width, t: b.textContent };
    });
    return {
      doneTop: done.top,
      doneBottom: done.bottom,
      view: document.documentElement.clientHeight,
      scrolls: grid.scrollHeight > grid.clientHeight + 1,
      small: buttons.filter(b => b.h < 44 || b.w < 44).map(b => b.t),
      title: document.querySelector('#wardTitle').textContent,
      v: PixelPets.state.v,
    };
  });
  expect(fit.title).toBe('STITCH & LANTERN');
  expect(fit.doneTop).toBeGreaterThan(0);
  expect(fit.doneBottom).toBeLessThanOrEqual(fit.view + 1);
  expect(fit.scrolls).toBe(true);
  expect(fit.small).toEqual([]);
  expect(fit.v).toBe(2);
});

test('the six prop lines are the P3 copy', async ({ page }) => {
  await boot(page);
  const lines = await page.evaluate(() => {
    const objs = MAPDATA.detail_zz_market.maps.hm_wardrobe.objs;
    const ids = ['ward_counter', 'ward_rack_a', 'ward_rack_b', 'ward_mirror', 'ward_curtain', 'ward_hat', 'ward_sash'];
    const out = {};
    ids.forEach(id => { out[id] = objs.find(o => o.id === id).lines.else; });
    out.marigold = objs.find(o => o.id === 'hm_marigold').lines.else;
    return out;
  });
  expect(lines).toEqual({
    ward_counter: 'A cutting table, deep in Keeper green sash cloth.',
    ward_rack_a: 'Sashes, satchels and beanies, all in your size.',
    ward_rack_b: 'Scarves and crowns, sized for Walklings.',
    ward_mirror: 'A tall mirror. Keeper Marigold does the fittings.',
    ward_curtain: 'A fitting curtain, both halves hung now.',
    ward_hat: 'A hat stand. Goggles and a lamp cap on the pegs.',
    ward_sash: 'Sash thread in Keeper green and gold.',
    marigold: 'Stitch & Lantern. Try anything on. Your Walkling too.',
  });
});
