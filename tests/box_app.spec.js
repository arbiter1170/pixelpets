/* Box screen (reorder, release, orphans) and the installable app shell. */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

function saveShot(page, name) {
  const w = page.viewportSize().width;
  if (w === 375) return Promise.resolve();
  const dir = path.join('screenshots', 'box');
  fs.mkdirSync(dir, { recursive: true });
  return page.screenshot({ path: path.join(dir, name + '-' + w + '.png') });
}

trackErrors(test, expect);

function boxSave() {
  const save = starterSave();
  const a = save.party[0];
  a.nick = 'Pip';
  a.souvenir = 'pebble';
  save.party.push(Object.assign({}, a, { id: 'petsmoke2', nick: 'Nib', souvenir: 'leaf' }));
  save.box = [
    Object.assign({}, a, { id: 'petsmoke3', nick: 'Boxy', souvenir: 'shell' }),
    Object.assign({}, a, { id: 'petsmoke4', nick: 'Crate', souvenir: 'twig' }),
  ];
  save.orphans = [{ reason: 'unknown-species', from: 'v2.box[9]', at: 1, raw: { species: 'nope', nick: 'Ghost' } }];
  return save;
}

async function openList(page, save) {
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('col'));
  await page.waitForSelector('#ownedList .card');
}

test('the box can be reordered, and an extra field stays on the Walkling', async ({ page }) => {
  await openList(page, boxSave());
  const up = page.locator('#ownedList .card').first().locator('button', { hasText: 'UP' });
  await expect(up).toBeDisabled();
  const upBox = await up.boundingBox();
  expect(upBox.height).toBeGreaterThanOrEqual(44);
  await page.locator('#ownedList .card').first().locator('button', { hasText: 'DOWN' }).click();
  const order = await page.evaluate(() => PixelPets.state.party.map(p => ({ nick: p.nick, souvenir: p.souvenir })));
  expect(order.map(p => p.nick)).toEqual(['Nib', 'Pip']);
  expect(order.map(p => p.souvenir)).toEqual(['leaf', 'pebble']);
  const boxed = page.locator('#ownedList .card.boxed');
  await expect(boxed.first().locator('button', { hasText: 'UP' })).toBeDisabled();
  await boxed.first().locator('button', { hasText: 'DOWN' }).click();
  const lists = await page.evaluate(() => ({
    party: PixelPets.state.party.map(p => p.nick),
    box: PixelPets.state.box.map(p => ({ nick: p.nick, souvenir: p.souvenir })),
    v: PixelPets.state.v,
  }));
  expect(lists.party).toEqual(['Nib', 'Pip']);
  expect(lists.box.map(p => p.nick)).toEqual(['Crate', 'Boxy']);
  expect(lists.box.map(p => p.souvenir)).toEqual(['twig', 'shell']);
  expect(lists.v).toBe(2);
  await page.locator('#ownedList .card.orphan').scrollIntoViewIfNeeded();
  await saveShot(page, 'list');
});

test('release asks first, and an orphan row shows the raw data', async ({ page }) => {
  await openList(page, boxSave());
  const boxed = page.locator('#ownedList .card.boxed');
  await boxed.first().locator('button', { hasText: 'RELEASE' }).click();
  await expect(boxed.first().locator('.rel-note')).toContainText('Boxy');
  await saveShot(page, 'release');
  await boxed.first().locator('button', { hasText: 'KEEP THEM' }).click();
  expect(await page.evaluate(() => PixelPets.state.box.map(p => p.nick))).toEqual(['Boxy', 'Crate']);
  await page.locator('#ownedList .card.boxed').first().locator('button', { hasText: 'RELEASE' }).click();
  await page.locator('#ownedList .card.boxed').first().locator('button', { hasText: 'LET THEM GO' }).click();
  const after = await page.evaluate(() => ({
    box: PixelPets.state.box.map(p => p.nick),
    party: PixelPets.state.party.map(p => p.souvenir),
    v: PixelPets.state.v,
    orphan: document.querySelector('#ownedList .card.orphan').textContent,
  }));
  expect(after.box).toEqual(['Crate']);
  expect(after.party).toEqual(['pebble', 'leaf']);
  expect(after.v).toBe(2);
  expect(after.orphan).toMatch(/Ghost/);
  expect(after.orphan).toMatch(/unknown-species/);
  expect(after.orphan).toMatch(/nope/);
});

test('releasing the partner promotes the next Walkling, then the box', async ({ page }) => {
  await openList(page, boxSave());
  const lead = () => page.locator('#ownedList .card').first();
  await lead().locator('button', { hasText: 'RELEASE' }).click();
  await lead().locator('button', { hasText: 'LET THEM GO' }).click();
  const mid = await page.evaluate(() => ({
    party: PixelPets.state.party.map(p => p.nick),
    partner: PixelPets.state.party.find(p => p.id === PixelPets.state.partnerId).nick,
    box: PixelPets.state.box.map(p => p.nick),
  }));
  expect(mid).toEqual({ party: ['Nib'], partner: 'Nib', box: ['Boxy', 'Crate'] });
  await lead().locator('button', { hasText: 'RELEASE' }).click();
  await lead().locator('button', { hasText: 'LET THEM GO' }).click();
  const after = await page.evaluate(() => ({
    party: PixelPets.state.party.map(p => ({ nick: p.nick, souvenir: p.souvenir })),
    partner: PixelPets.state.partnerId,
    v: PixelPets.state.v,
  }));
  expect(after.party).toEqual([{ nick: 'Boxy', souvenir: 'shell' }]);
  expect(after.partner).toBe('petsmoke3');
  expect(after.v).toBe(2);
});

test('the game can be installed and opened offline', async ({ page }) => {
  await gotoGame(page);
  const linked = await page.evaluate(() => {
    const bare = href => (href || '').split('?')[0];
    return {
      man: bare(document.querySelector('link[rel="manifest"]') && document.querySelector('link[rel="manifest"]').getAttribute('href')),
      apple: bare(document.querySelector('link[rel="apple-touch-icon"]') && document.querySelector('link[rel="apple-touch-icon"]').getAttribute('href')),
      icon: bare(document.querySelector('link[rel="icon"]') && document.querySelector('link[rel="icon"]').getAttribute('href')),
    };
  });
  expect(linked).toEqual({ man: 'manifest.json', apple: 'icons/apple-touch-icon.png', icon: 'icons/icon-192.png' });
  const manifest = await (await page.request.get('/manifest.json')).json();
  expect(manifest.name).toBe('Walklings');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('./index.html');
  expect(manifest.icons.map(i => i.sizes)).toEqual(['192x192', '512x512']);
  const sw = await (await page.request.get('/sw.js')).text();
  expect(sw).toMatch(/version\.json/);
  expect(sw).not.toMatch(/open-meteo|overpass/i);
  const env = await (await page.request.get('/env.js')).text();
  expect(env).toMatch(/open-meteo/);
  expect(env).toMatch(/meadow/);
  for (const iconPath of ['/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png']) {
    const res = await page.request.get(iconPath);
    expect(res.ok(), iconPath).toBe(true);
    expect(res.headers()['content-type'] || '').toMatch(/png/);
  }
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 15000 });
  await page.context().setOffline(true);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.PixelPets && document.title === 'Walklings');
  await page.waitForTimeout(2000);
  expect(await page.locator('#app').isVisible()).toBe(true);
  page.ppErrors = page.ppErrors.filter(t => !/ERR_INTERNET_DISCONNECTED|Failed to load resource|net::ERR_/.test(t));
});
