/* Breckenridge Observatory: the side marker sits on the telescope, and still shows after a dream is left early.
   The room is dusk-violet boards under a night dome. Key P is new. The Keeper HQ is not built. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const WARM = { A: '#c9925e', B: '#a8674a', C: '#e3d3ac', D: '#9fae86', E: '#5f6e4f', F: '#5c4033', G: '#b5845a' };
const ROOM = { H: '#b9877a', I: '#9c9382', J: '#2f5a3e' };
const P = '#9686a8';
const NAVY = '#29366f';
const CYAN = '#41a6f6';
const GRID = '#3b5dc9';
const TICK = '#73eff7';

function save() {
  const s = starterSave();
  s.settings.follower = false;
  s.settings.controls = 'arcade';
  s.ui = { sideTracked: 'mom' };
  Object.assign(s.flags, {
    'story.mom_met': true,
    'story.mom_chore': true,
    'story.mom_sent': true,
    'story.reached_mahopac': true,
  });
  return s;
}

async function boot(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

test('the marker shows on the telescope, and after leaving a dream early', async ({ page }) => {
  await boot(page);
  const seen = await page.evaluate(async () => {
    const CYAN = [0x41, 0xa6, 0xf6];
    const settle = () => new Promise(r => {
      const tick = () => {
        if (PixelPets.fading) requestAnimationFrame(tick);
        else requestAnimationFrame(() => requestAnimationFrame(r));
      };
      tick();
    });
    const cue = (tx, ty) => {
      const c = document.querySelector('#mapCanvas');
      const X = tx * 16 - PixelPets.walk.cam.x;
      const Y = ty * 16 - PixelPets.walk.cam.y;
      const boxes = [[3, -14], [10, -14], [3, 16], [10, 16]];
      let best = 0;
      for (const [ox, oy] of boxes) {
        const x0 = Math.max(0, X + ox), y0 = Math.max(0, Y + oy);
        const x1 = Math.min(c.width, X + ox + 14), y1 = Math.min(c.height, Y + oy + 12);
        if (x1 <= x0 || y1 <= y0) continue;
        const d = c.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] === CYAN[0] && d[i + 1] === CYAN[1] && d[i + 2] === CYAN[2]) n++;
        }
        if (n > best) best = n;
      }
      return best;
    };
    const snap = () => {
      const q = PixelPets.sideQuest;
      return q ? { id: q.id, point: q.point, text: q.text } : null;
    };
    const stand = async (id, x, y) => {
      PixelPets.goto(id, x, y, 'up');
      PixelPets.clearWild();
      await settle();
      PixelPets.clearWild();
      await settle();
      return { here: snap(), cyan: null };
    };
    const inside = await stand('mahopac_obs', 4, 5);
    inside.cyan = cue(4, 2);
    inside.exit = cue(4, 6);
    PixelPets.setFlag('story.dream_started', true);
    await settle();
    const midIn = { here: snap(), cyan: cue(4, 2) };
    const town = await stand('mahopac', 5, 9);
    town.cyan = cue(5, 7);
    const trail = await stand('hearthmoor', 9, 3);
    trail.cyan = cue(9, 0);
    PixelPets.setFlag('story.dream_study', true);
    PixelPets.setFlag('story.phone_got', true);
    const done = await stand('mahopac_obs', 4, 5);
    done.cyan = cue(4, 2);
    const copy = {};
    for (const id of ['observatory', 'dream_toy', 'dream_party', 'dream_dad']) {
      const step = PPQuests.SIDE.find(e => e.id === id);
      copy[id] = { text: step.text, via: step.via || null, target: step.target };
    }
    return {
      v: PixelPets.state.v,
      check: PixelPets.questCheck,
      inside, midIn, town, trail, done, copy,
    };
  });

  expect(seen.v).toBe(2);
  expect(seen.check).toEqual([]);
  expect(seen.inside.here).toMatchObject({ id: 'observatory', point: { x: 4, y: 2, here: true } });
  expect(seen.inside.here.point).not.toMatchObject({ x: 4, y: 6 });
  expect(seen.inside.cyan).toBeGreaterThanOrEqual(18);
  expect(seen.inside.exit).toBeLessThan(8);
  expect(seen.midIn.here).toMatchObject({ id: 'dream_toy', point: { x: 4, y: 2, here: true } });
  expect(seen.midIn.cyan).toBeGreaterThanOrEqual(18);
  expect(seen.town.here).toMatchObject({ id: 'dream_toy', point: { x: 5, y: 7, here: false } });
  expect(seen.town.cyan).toBeGreaterThanOrEqual(18);
  expect(seen.trail.here).toMatchObject({ id: 'dream_toy', point: { x: 9, y: 0, here: false } });
  expect(seen.trail.cyan).toBeGreaterThanOrEqual(18);
  expect(seen.done.here).toBeNull();
  expect(seen.done.cyan).toBeLessThan(8);
  expect(seen.copy.observatory.text).toBe('Step into Breckenridge Observatory. The lens is waiting.');
  expect(seen.copy.observatory.target).toEqual({ map: 'mahopac_obs', x: 4, y: 2 });
  expect(seen.copy.observatory.via).toBeNull();
  expect(seen.copy.dream_toy.text).toBe('You are small again. Push the popping toy around the rug.');
  expect(seen.copy.dream_party.text).toBe('Pop the balloons at your seventh birthday.');
  expect(seen.copy.dream_dad.text).toBe('Sit with Dad at the MacRonalds drive-through.');
  for (const id of ['dream_toy', 'dream_party', 'dream_dad']) {
    expect(seen.copy[id].via).toEqual({ map: 'mahopac_obs', x: 4, y: 2 });
  }
});

test('the observatory draws dusk-violet boards under a night dome', async ({ page }) => {
  await boot(page);
  const setup = await page.evaluate(({ warm, room, violet }) => {
    const px = (tile, x, y) => {
      const d = buildTiles()[tile].getContext('2d').getImageData(x, y, 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(n => n.toString(16).padStart(2, '0')).join('');
    };
    const tiles = buildTiles();
    const skin = HOUSE_SKINS.obs;
    const names = []
      .concat(Object.values(skin.remap), Object.values(skin.decal))
      .concat(Object.keys(skin.variants))
      .concat([].concat(...Object.values(skin.variants)).map(row => row[0]));
    const share = PixelPets.floorShare('mahopac_obs');
    return {
      v: PixelPets.state.v,
      cap: PixelPets.devChecks().floorCap,
      share: { tile: share.tile, share: share.share },
      warm: Object.fromEntries(Object.keys(warm).map(k => [k, PAL[k]])),
      room: Object.fromEntries(Object.keys(room).map(k => [k, PAL[k]])),
      P: PAL.P, K: PAL.K,
      missing: names.filter(n => !tiles[n]),
      exteriorNameFree: !tiles.wall_obs,
      skin,
      dreams: {
        toy: HOUSE_SKINS.dream_2004.remap,
        party: HOUSE_SKINS.dream_party.remap,
        drive: HOUSE_SKINS.dream_drive.remap,
      },
      hq: HOUSE_SKINS.house_hq.remap,
      old: { star: px('floor_star', 0, 0), dome: px('wall_dome', 4, 4), rib: px('wall_dome', 0, 0), tick: px('star_tick', 2, 8) },
    };
  }, { warm: WARM, room: ROOM, violet: P });

  expect(setup.v).toBe(2);
  expect(setup.cap).toEqual([]);
  expect(setup.share.share).toBeLessThanOrEqual(0.7);
  expect(setup.warm).toEqual(WARM);
  expect(setup.room).toEqual(ROOM);
  expect(setup.P).toBe(P);
  expect(setup.K).toBe('#7a8aa0');
  expect(setup.missing).toEqual([]);
  expect(setup.exteriorNameFree).toBe(true);
  expect(setup.skin.remap).toEqual({ '#': 'wall_obs_dome', W: 'wall_obs_face', W2: 'wall_obs_win', '.': 'floor_dusk' });
  expect(setup.skin.decal).toEqual({ v: 'wall_shadow_obs', u: 'window_light_obs', z: 'star_tick_brass' });
  expect(setup.skin.variants.floor_dusk.map(row => row[0])).toEqual(['floor_dusk_b', 'floor_dusk_c']);
  expect(setup.dreams.toy['.']).toBe('floor_mist');
  expect(setup.dreams.party['.']).toBe('floor_party');
  expect(setup.dreams.drive['.']).toBe('floor_asphalt');
  expect(setup.hq['.']).toBe('floor_keep');
  expect(setup.hq['#']).toBe('wall_keep');
  expect(setup.old).toEqual({ star: NAVY, dome: NAVY, rib: '#333c57', tick: TICK });

  const drawn = await page.evaluate(async ({ violet, navy, brass, walnut, cream, foot, stile, grid, tick }) => {
    const hex = (x, y) => {
      const c = document.querySelector('#mapCanvas');
      const d = c.getContext('2d').getImageData(x, y, 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(n => n.toString(16).padStart(2, '0')).join('');
    };
    const at = (tx, ty, ox, oy) => hex(tx * 16 - PixelPets.walk.cam.x + ox, ty * 16 - PixelPets.walk.cam.y + oy);
    const settle = () => new Promise(r => {
      const tick = () => {
        if (PixelPets.fading) requestAnimationFrame(tick);
        else requestAnimationFrame(() => requestAnimationFrame(r));
      };
      tick();
    });
    PixelPets.goto('mahopac_obs', 4, 5, 'up');
    await settle();
    const banned = [];
    const watch = (tx, ty, ox, oy, where) => {
      const got = at(tx, ty, ox, oy);
      if (got === grid || got === tick) banned.push(where + ' ' + got);
    };
    watch(2, 3, 2, 2, 'floor');
    watch(4, 0, 4, 8, 'wall');
    watch(2, 1, 2, 3, 'face');
    return {
      floor: { tile: PixelPets.tileInfo(2, 3).tile, fill: at(2, 3, 2, 2) },
      face: PixelPets.tileInfo(2, 1).tile,
      navy: at(2, 1, 2, 3),
      rib: at(2, 1, 8, 3),
      rail: at(2, 1, 2, 9),
      wain: at(2, 1, 2, 12),
      stile: at(2, 1, 4, 12),
      foot: at(2, 1, 2, 15),
      win: PixelPets.tileInfo(3, 1).tile,
      frame: at(3, 1, 5, 1),
      pane: at(3, 1, 6, 2),
      star: at(3, 1, 7, 3),
      cap: at(4, 0, 4, 0),
      wall: at(4, 0, 4, 8),
      centre: at(4, 0, 8, 8),
      shade: { decal: PixelPets.tileInfo(2, 2).decal, fill: at(2, 2, 0, 0) },
      compass: { decal: PixelPets.tileInfo(1, 3).decal, bar: at(1, 3, 4, 8), hub: at(1, 3, 7, 8), board: at(1, 3, 2, 2) },
      banned,
      expect: { violet, navy, brass, walnut, cream, foot, stile },
    };
  }, { violet: P, navy: NAVY, brass: WARM.G, walnut: WARM.F, cream: WARM.C, foot: '#1a1c2c', stile: WARM.B, grid: GRID, tick: TICK });

  expect(drawn.banned).toEqual([]);
  expect(drawn.floor.tile.startsWith('floor_dusk')).toBe(true);
  expect(drawn.floor.fill).toBe(P);
  expect(drawn.face).toBe('obs__face');
  expect(drawn.navy).toBe(WARM.G);
  expect(drawn.rib).toBe(WARM.G);
  expect(drawn.rail).toBe('#ffcd75');
  expect(drawn.wain).toBe(WARM.G);
  expect(drawn.stile).toBe(WARM.G);
  expect(drawn.foot).toBe(WARM.F);
  expect(drawn.win).toBe('obs__face_win');
  expect(drawn.frame).toBe(WARM.F);
  expect(drawn.pane).toBe('#ffcd75');
  expect(drawn.star).toBe(NAVY);
  expect(drawn.cap).toBe(WARM.F);
  expect(drawn.wall).toBe(WARM.F);
  expect(drawn.centre).toBe(WARM.F);
  expect(drawn.shade).toEqual({ decal: 'wall_shadow_obs', fill: WARM.F });
  expect(drawn.compass.decal).toBe('star_tick_brass');
  expect(drawn.compass.bar).toBe(WARM.G);
  expect(drawn.compass.hub).toBe(WARM.C);
  expect(drawn.compass.board).toBe(P);
  expect(await page.evaluate(() => PixelPets.state.v)).toBe(2);
});
