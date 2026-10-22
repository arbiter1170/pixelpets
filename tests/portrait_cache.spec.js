/* People and Contacts list portraits. The front-frame cache plus reused list canvases
   should make a repeat People open allocate almost nothing. Measured at 390. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

function countCanvases(page) {
  return page.addInitScript(() => {
    window.__canvasMade = 0;
    const ce = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, opts) {
      const el = ce.call(this, tag, opts);
      if (String(tag).toLowerCase() === 'canvas') window.__canvasMade++;
      return el;
    };
  });
}

test('repeat People opens allocate almost no new canvases', async ({ page }, info) => {
  test.skip(info.project.name !== '390', 'canvas count is measured at 390');
  test.setTimeout(60000);
  await countCanvases(page);
  const save = starterSave();
  save.flags['story.phone_got'] = true;
  await installSave(page.context(), save, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true && typeof PixelPets.contacts === 'function');
  const met = await page.evaluate(() => {
    const names = new Set();
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (Array.isArray(o.objs)) o.objs.forEach((x) => { if (x && typeof x.name === 'string' && x.name) names.add(x.name); });
      Object.values(o).forEach((v) => { if (v && typeof v === 'object') walk(v); });
    };
    walk(MAPDATA);
    const S = PixelPets.state;
    S.phoneBook = S.phoneBook || { met: {}, fav: {} };
    S.phoneBook.met = S.phoneBook.met || {};
    S.phoneBook.fav = S.phoneBook.fav || {};
    for (const n of names) {
      const key = n.replace(/[<>{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (key) S.phoneBook.met[key] = true;
    }
    return PixelPets.contacts().length;
  });
  expect(met).toBeGreaterThan(10);
  await page.evaluate(() => PixelPets.showTab('walk'));
  const made = () => page.evaluate(() => window.__canvasMade);
  const peopleDeltas = [];
  for (let i = 0; i < 5; i++) {
    const before = await made();
    await page.locator('#repBtn').click();
    await expect(page.locator('#ovRep')).toBeVisible();
    await expect(page.locator('#repList .rep-row').first()).toBeVisible();
    peopleDeltas.push((await made()) - before);
    if (i === 0) {
      const paint = await page.evaluate(() => {
        const faces = [...document.querySelectorAll('#repList canvas.rep-face')];
        const rows = document.querySelectorAll('#repList .rep-row').length;
        const sample = faces[0];
        const data = sample.getContext('2d').getImageData(0, 0, sample.width, sample.height).data;
        let ink = false;
        for (let p = 3; p < data.length; p += 4) if (data[p] > 0) { ink = true; break; }
        return { faces: faces.length, rows, ink, contacts: PixelPets.contacts().length };
      });
      expect(paint.ink).toBe(true);
      expect(paint.faces).toBe(paint.rows);
      expect(paint.rows).toBe(paint.contacts);
    }
    await page.locator('#repBack').click();
    await expect(page.locator('#ovRep')).toBeHidden();
    await page.locator('#phoneBtn').click();
    await page.locator('.phone-app[data-app="contacts"]').click();
    await expect(page.locator('#phoneBody .contact-row').first()).toBeVisible();
    if (i === 0) {
      const contacts = await page.evaluate(() => {
        const faces = [...document.querySelectorAll('#phoneBody canvas.contact-face')];
        const rows = document.querySelectorAll('#phoneBody .contact-row').length;
        const sample = faces[0];
        const data = sample.getContext('2d').getImageData(0, 0, sample.width, sample.height).data;
        let ink = false;
        for (let p = 3; p < data.length; p += 4) if (data[p] > 0) { ink = true; break; }
        return { faces: faces.length, rows, ink };
      });
      expect(contacts.ink).toBe(true);
      expect(contacts.faces).toBe(contacts.rows);
    }
    await page.locator('#phoneClose').click();
    await expect(page.locator('#ovPhone')).toBeHidden();
  }
  // A warm open creates about zero canvases: one front frame per look, and the row canvases are pooled.
  // 2 is slack for a single new look, not another portrait set.
  console.log('PP portrait canvases ' + peopleDeltas.join(','));
  expect(Math.max(...peopleDeltas.slice(1)), 'canvases on People opens ' + peopleDeltas.join(',')).toBeLessThanOrEqual(2);
  const same = await page.evaluate(() => {
    const look = PixelPets.keeper.look;
    const face = window.keeperFace(look);
    const full = window.keeperFrames(look).down[0];
    const A = face.getContext('2d').getImageData(0, 0, 18, 18).data;
    const B = full.getContext('2d').getImageData(0, 0, 18, 18).data;
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
  });
  expect(same).toBe(true);
  const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('pixelpets.save.v2')));
  expect(sv.v).toBe(2);
});
