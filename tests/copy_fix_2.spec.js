/* COPY_FIX_2. Lantern sign and council light, the flat 5 Acorns lines, and Mo's open line.
   Widths are the Playwright projects (320, 375, 390). Save stays pixelpets.save.v2 with v 2.
   This build adds no save field. */
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const HOUSE = 'LANTERN HOUSE · Rest and recover. 5 Acorns, or what you have.';
const CONSOLE_ON = 'Brinewick is marked. Its light is on.';
const CONSOLE_ELSE = 'A board of little lights. Each one is a ship, not a weapon.';
const D1 = 'Your team is worn out. A rest costs 5 Acorns, or what you have, and heals everyone.';
const D2 = 'Your team is worn out. These beds rest everyone, for 5 Acorns, or what you have.';
const D3 = 'A note on the shelf: "Rest the whole party. 5 Acorns, or what you have. — I."';
const D4 = 'A note by the door: "Rest the whole party. 5 Acorns, or what you have. The quarry is dusty. — Cobblecrest"';
const D5 = 'A note by the shelf: "Rest the whole party. 5 Acorns, or what you have. — Amos"';
const D7 = 'Welcome in. Talk to a bed and your whole team rests and heals, for 5 Acorns, or what you have.';
const D8 = 'Your team is worn out. Face a bed and talk to it. A rest is 5 Acorns, or what you have.';
const D9 = 'Your team is worn out. Talk to the Keeper. A rest costs 5 Acorns, or what you have.';
const D10 = D8;
const D11 = 'Rest the whole party. 5 Acorns, or what you have. The city can wait. — High Charity';
const MO = 'Long before the lamps, they built tools to carry it. A counter, a lamp, a crow, a tether, a wisp.';
const QUINN = 'Before the chips, we built five relays. A counter, a lamp, a crow, a tether, a wisp.';
const MARKERS = ['hm_lantern_sign', 'cc_lantern_sign', 'fb_lantern_sign', 'hc_lantern_sign', 'bw_lantern_sign'];
const HOSTS = ['hm_lantern_host', 'cc_lantern_host', 'hc_lantern_host', 'amos', 'bw_lantern_host'];
const NOTES = [
  ['lantern_note', D3],
  ['cc_lantern_note', D4],
  ['fb_lantern_note', D5],
  ['hc_lantern_note', D11],
];

function save(flags, extra) {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.textSpeed = 'fast';
  s.settings.tips = false;
  s.party[0].hpNow = 4;
  s.world.restDue = true;
  s.money = 20;
  Object.assign(s.flags, { 'story.early_done': true }, flags || {});
  if (extra) Object.assign(s, extra);
  return s;
}

async function boot(page, flags, controls) {
  const s = save(flags);
  if (controls) s.settings.controls = controls;
  await installSave(page.context(), s, { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function shown(page, sel) {
  const loc = page.locator(sel);
  await expect(loc).toBeVisible();
  const box = await loc.boundingBox();
  expect(box, sel).toBeTruthy();
  expect(box.width).toBeGreaterThan(8);
  expect(box.height).toBeGreaterThan(8);
  return box;
}

async function untilText(page, want) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const sc = await page.evaluate(() => {
      const s = window.PixelPets.scene;
      return s && { mode: s.mode, full: s.full, text: s.text || '' };
    });
    if (!sc) throw new Error('scene ended before ' + want);
    if (sc.mode === 'say' && sc.full && sc.text === want) {
      await shown(page, '#sbText');
      await expect(page.locator('#sbText')).toContainText(want);
      return;
    }
    if (sc.mode === 'say' && sc.full) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(40);
      continue;
    }
    await page.waitForTimeout(40);
  }
  const stuck = await page.evaluate(() => {
    const s = window.PixelPets.scene;
    return s && { mode: s.mode, full: s.full, text: s.text || '' };
  });
  throw new Error('did not see ' + want + ' (scene ' + JSON.stringify(stuck) + ')');
}

async function endScene(page) {
  await page.evaluate(() => { if (window.PixelPets.scene) window.PixelPets.endScene(); });
}

async function armHold(page) {
  await page.evaluate(() => {
    window.PixelPets.state.party[0].hpNow = 4;
    window.PixelPets.state.world.restDue = true;
  });
}

function flatFive(text) {
  return String(text || '').includes('5 Acorns.') && !String(text).includes(', or what you have');
}

test('b the High Charity wall sign matches every other Lantern House sign', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => PixelPets.talkTo('hc_sign_lantern'));
  await untilText(page, HOUSE);
  await endScene(page);
  await page.evaluate(() => PixelPets.talkTo('hm_sign_lantern'));
  await untilText(page, HOUSE);
  await endScene(page);
  for (const id of MARKERS) {
    await page.evaluate((nid) => PixelPets.talkTo(nid), id);
    await untilText(page, HOUSE);
    expect(await page.evaluate((nid) => PixelPets.npcLine(nid), id)).toBe(HOUSE);
    await endScene(page);
  }
});

test('c the council board light is on after the council, and the else line stays', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => PixelPets.npcLine('hc_console'))).toBe(CONSOLE_ELSE);
  await page.evaluate(() => PixelPets.talkTo('hc_console'));
  await untilText(page, CONSOLE_ELSE);
  await endScene(page);
  await page.evaluate(() => PixelPets.setFlag('story.hc_council_done', true));
  expect(await page.evaluate(() => PixelPets.npcLine('hc_console'))).toBe(CONSOLE_ON);
  await page.evaluate(() => PixelPets.talkTo('hc_console'));
  await untilText(page, CONSOLE_ON);
});

test('d1 the hold greet on a lantern door panel', async ({ page }) => {
  await boot(page);
  await armHold(page);
  const fern = await page.evaluate(() => {
    PixelPets.goto('fernbrook', 5, 5, 'down');
    return PixelPets.walkStep('down');
  });
  expect(fern.scene).toBe(true);
  await untilText(page, D1);
  expect(D1.length).toBeLessThan(110);
  await endScene(page);
  // Hearthmoor's hm_lantern is a room warp with no lantern panel, so placeSteps does not run.
  const hearth = await page.evaluate(() => {
    PixelPets.state.party[0].hpNow = 4;
    PixelPets.state.world.restDue = true;
    PixelPets.goto('hearthmoor', 16, 13, 'down');
    return PixelPets.walkStep('down');
  });
  expect(hearth.scene).toBe(false);
  expect(hearth.map).toBe('hearthmoor');
});

test('d2 the bed and the exit mat say the hold line', async ({ page }) => {
  await boot(page);
  await armHold(page);
  await page.evaluate(() => {
    PixelPets.goto('hm_lantern_in', 4, 5, 'up');
    PixelPets.talkTo('lantern_bed_a');
  });
  await untilText(page, D2);
  await endScene(page);
  await armHold(page);
  const step = await page.evaluate(() => {
    PixelPets.goto('hm_lantern_in', 4, 5, 'down');
    return PixelPets.walkStep('down');
  });
  expect(step.scene).toBe(true);
  await untilText(page, D2);
});

test('d3 d4 d5 d11 the room notes, and d6 matches the Fernbrook file', async ({ page }) => {
  await boot(page);
  for (const [id, line] of NOTES) {
    await endScene(page);
    await page.evaluate((nid) => PixelPets.talkTo(nid), id);
    await untilText(page, line);
  }
  const file = JSON.parse(fs.readFileSync('data/fernbrook_rooms.json', 'utf8'));
  const note = file.maps.fb_lantern_in.objs.find((o) => o.id === 'fb_lantern_note');
  expect(note.text).toBe(D5);
});

test('d7 each host says the cost line', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  for (const id of HOSTS) {
    await endScene(page);
    await page.evaluate((nid) => PixelPets.talkTo(nid), id);
    await untilText(page, D7);
    expect(D7.length).toBeLessThanOrEqual(110);
    await endScene(page);
  }
});

test('d8 and d9 hold hints show in full in the walk tip', async ({ page }) => {
  await boot(page, null, 'arcade');
  await armHold(page);
  await page.evaluate(() => PixelPets.goto('hm_lantern_in', 4, 4, 'down'));
  await expect.poll(() => page.evaluate(() => document.querySelector('#walkTip').textContent)).toBe(D8);
  await shown(page, '#walkTip');
  const room = await page.evaluate(() => {
    const el = document.querySelector('#walkTip');
    const cs = getComputedStyle(el);
    const ellipsis = cs.textOverflow === 'ellipsis' && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    return { text: el.textContent, ellipsis };
  });
  expect(room.text).toBe(D8);
  expect(room.text.length).toBeLessThan(90);
  expect(room.text.includes('...')).toBe(false);
  expect(room.ellipsis).toBe(false);

  await armHold(page);
  await page.evaluate(() => PixelPets.goto('fernbrook', 5, 5, 'down'));
  await expect.poll(() => page.evaluate(() => document.querySelector('#walkTip').textContent)).toBe(D9);
  await shown(page, '#walkTip');
  const door = await page.evaluate(() => {
    const el = document.querySelector('#walkTip');
    const cs = getComputedStyle(el);
    const ellipsis = cs.textOverflow === 'ellipsis' && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    return { text: el.textContent, ellipsis };
  });
  expect(door.text).toBe(D9);
  expect(door.text.length).toBeLessThan(90);
  expect(door.text.includes('...')).toBe(false);
  expect(door.ellipsis).toBe(false);
});

test('d10 the room toast shows the hold hint once and in full', async ({ page }) => {
  test.setTimeout(20000);
  await boot(page, null, 'modern');
  await page.waitForFunction(() => !document.querySelector('#toast').classList.contains('show'), null, { timeout: 8000 });
  await armHold(page);
  const got = await page.evaluate(async (line) => {
    const t = document.querySelector('#toast');
    PixelPets.state.party[0].hpNow = 4;
    PixelPets.state.world.restDue = true;
    PixelPets.goto('hearthmoor', 8, 8, 'down');
    PixelPets.goto('hm_lantern_in', 4, 4, 'down');
    const pages = [];
    let shows = 0;
    let prev = false;
    let last = '';
    let saw = null;
    const t0 = performance.now();
    while (performance.now() - t0 < 5600) {
      const op = parseFloat(getComputedStyle(t).opacity) || 0;
      const show = t.classList.contains('show') && op > 0.9;
      const text = t.textContent || '';
      if (show && !prev) shows++;
      if (show && text && text !== last) pages.push(text);
      if (show) last = text;
      if (!show) last = '';
      if (show && !saw) {
        const b = t.getBoundingClientRect();
        saw = { w: b.width, h: b.height, op };
      }
      prev = show;
      await new Promise((r) => setTimeout(r, 100));
    }
    return { shows, pages, joined: pages.join(' '), saw, len: line.length };
  }, D10);
  expect(got.shows).toBe(1);
  expect(got.joined).toBe(D10);
  expect(D10.length).toBeLessThan(90);
  expect(got.pages.some((p) => p.includes('...'))).toBe(false);
  expect(got.saw && got.saw.w).toBeGreaterThan(8);
  expect(got.saw.h).toBeGreaterThan(8);
  // #toast hides by fading opacity to 0. Playwright still counts that box as visible.
  await expect.poll(() => page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#toast')).opacity) || 0)).toBe(0);
});

test('e Mo says long before the lamps, and Quinn\'s line stays', async ({ page }) => {
  test.setTimeout(45000);
  await boot(page);
  expect(await page.evaluate(() => PixelPets.runScene('ans_open'))).toBe(true);
  await untilText(page, MO);
  const script = await page.evaluate(() => PixelPets.sceneScript('ans_open').filter((st) => st[0] === 'say').map((st) => st[2]));
  expect(script.some((s) => /chip/i.test(s))).toBe(false);
  expect(script).toContain(MO);

  await page.evaluate(() => PixelPets.setSide('glimmer'));
  const glimmer = await page.evaluate(() => PixelPets.sceneScript('ans_open').filter((st) => st[0] === 'say').map((st) => st[2]));
  expect(glimmer).toContain(QUINN);
  await endScene(page);
  expect(await page.evaluate(() => PixelPets.runScene('ans_open'))).toBe(true);
  await untilText(page, QUINN);
});

test('lantern signs and the hosts\' first lines do not say a flat 5 Acorns', async ({ page }) => {
  test.setTimeout(60000);
  await boot(page);
  const notes = [];
  for (const [id] of NOTES) {
    await endScene(page);
    await page.evaluate((nid) => PixelPets.talkTo(nid), id);
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
    notes.push(await page.evaluate(() => PixelPets.scene.text));
    await endScene(page);
  }
  await page.evaluate(() => PixelPets.talkTo('bw_lantern_note'));
  await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.full);
  notes.push(await page.evaluate(() => PixelPets.scene.text));
  await endScene(page);
  const marks = await page.evaluate((ids) => ids.map((id) => PixelPets.npcLine(id)), MARKERS.concat(['hm_sign_lantern']));
  const firsts = [];
  for (const id of HOSTS) {
    await endScene(page);
    await page.evaluate((nid) => PixelPets.talkTo(nid), id);
    await page.waitForFunction(() => PixelPets.scene && PixelPets.scene.mode === 'say' && PixelPets.scene.full);
    firsts.push(await page.evaluate(() => PixelPets.scene.text));
    await endScene(page);
  }
  const all = notes.concat(marks, firsts);
  expect(all.filter(flatFive)).toEqual([]);
});

test('reduced motion still shows the sign and the hold tip', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, null, 'arcade');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.evaluate(() => PixelPets.talkTo('hc_sign_lantern'));
  await untilText(page, HOUSE);
  await endScene(page);
  await armHold(page);
  await page.evaluate(() => PixelPets.goto('hm_lantern_in', 4, 4, 'down'));
  await expect.poll(() => page.evaluate(() => document.querySelector('#walkTip').textContent)).toBe(D8);
  await shown(page, '#walkTip');
});

test('reading a sign leaves the save at v2 with the same keys', async ({ page }) => {
  await boot(page);
  await page.waitForFunction(() => {
    try { return JSON.parse(localStorage.getItem('pixelpets.save.v2')).v === 2
      && JSON.parse(localStorage.getItem('pixelpets.save.v2')).debugSave === true; }
    catch (e) { return false; }
  }, null, { timeout: 12000 });
  const before = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: raw.v, keys: Object.keys(raw).sort(), flags: Object.keys(raw.flags || {}).sort() };
  });
  expect(before.v).toBe(2);
  await page.evaluate(() => PixelPets.talkTo('hc_sign_lantern'));
  await untilText(page, HOUSE);
  await endScene(page);
  const after = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('pixelpets.save.v2'));
    return { v: raw.v, keys: Object.keys(raw).sort(), flags: Object.keys(raw.flags || {}).sort() };
  });
  expect(after.v).toBe(2);
  expect(after.keys).toEqual(before.keys);
  expect(after.flags).toEqual(before.flags);
});
