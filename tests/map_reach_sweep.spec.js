/* One shared sweep for the walk-to-every-person and prop checks.
   Runs at 320 only (@w1). Maps and spoken lines came from maps_b2, maps_b3,
   maps_b5, maps_b6, maps_b7, maps_b8 and keeper_hq. A missing map fails the
   count check. Save stays pixelpets.save.v2 with v 2. */
const { test, expect } = require('@playwright/test');
const { starterSave, installSave, trackErrors, gotoGame } = require('./helpers');

trackErrors(test, expect);

const LINES_B2 = [
  ['rx_f1', 2, 12, 'up', 'A white bench.'],
  ['rx_f1', 1, 4, 'up', 'A white planter.'],
  ['rx_f1', 10, 7, 'up', 'A visitor screen.'],
  ['rx_f1', 11, 6, 'up', 'REGENX LOBBY.'],
  ['rx_f2', 10, 6, 'up', 'A whiteboard.'],
  ['rx_f2', 2, 13, 'up', 'A quiet booth.'],
  ['rx_f2', 2, 6, 'up', 'FOCUS WING.'],
  ['rx_f3', 4, 11, 'up', 'A sorting table.'],
  ['rx_f3', 1, 15, 'up', 'A file cart.'],
  ['rx_f3', 8, 9, 'up', 'A dim lamp.'],
  ['rx_f3', 1, 10, 'up', 'A shelf of folders.'],
  ['rx_f3', 2, 5, 'up', 'RECORDS.'],
];
const LINES_B3 = [
  ['sm_yard', 6, 8, 'up', 'A wooden cart. Nothing in it.'],
  ['sm_yard', 6, 3, 'up', 'Crates stacked against the rock.'],
  ['sm_tunnel', 4, 5, 'up', 'A sealed barrel.'],
  ['sm_tunnel', 1, 6, 'up', 'A coil of rope.'],
  ['sm_tunnel', 2, 3, 'up', 'A timber brace in the rock.'],
  ['sm_yard', 1, 3, 'up', 'An empty lantern hook.'],
  ['sm_den', 8, 5, 'up', 'A plain desk.'],
  ['sm_den', 9, 5, 'up', 'A shut ledger.'],
  ['sm_den', 10, 5, 'up', 'A small lamp. The flame is still.'],
];
const LINES_B5 = [
  ['hm_home_in', 6, 6, 'right', 'A pot of leaves sits by the wall.'],
  ['hm_home_up', 6, 3, 'up', 'A wooden chest. The lid is shut.'],
  ['hm_home_up', 2, 6, 'left', 'A small pot of leaves.'],
  ['hm_home_up', 6, 4, 'right', 'A low stool beside the bed.'],
  ['hm_home_up', 6, 6, 'right', 'A small lamp by the bed.'],
  ['hm_lodge_in', 1, 5, 'up', 'The hearth is lit. The flame stays low.'],
  ['hm_lodge_in', 9, 7, 'up', 'A broad table with a folded map.'],
  ['hm_lantern_in', 2, 5, 'left', 'A short bench along the wall.'],
  ['hm_rook_in', 2, 2, 'left', 'A small stove and a kettle.'],
  ['hm_rook_in', 5, 3, 'down', 'A shelf of small cups and ribbons.'],
  ['hm_rook_in', 3, 4, 'right', 'A pot of leaves on the floor.'],
  ['hm_rook_in', 3, 4, 'left', 'A stool by the wall.'],
  ['hm_hq_f1', 1, 6, 'up', 'A notice board. The slips are pinned in a row.'],
  ['hm_hq_f1', 5, 13, 'down', 'A row of hooks. One coat hangs here.'],
  ['hm_hq_f1', 10, 9, 'up', 'A standing lamp. The shade is warm.'],
  ['hm_hq_f1', 1, 12, 'down', 'A bench under the window.'],
  ['hm_hq_f1', 4, 8, 'up', 'A wooden crate.'],
  ['hm_hq_f2', 1, 3, 'up', 'The radio set. A small lamp glows on the dial.'],
  ['hm_hq_f2', 7, 9, 'down', 'A table with a chart of the roads.'],
  ['hm_hq_f2', 7, 12, 'up', 'A stool by the wall.'],
  ['hm_hq_f2', 6, 4, 'up', 'A lamp by the stair.'],
  ['hm_hq_f2', 10, 8, 'up', 'A pot of leaves by the chart.'],
  ['cc_lantern_in', 6, 3, 'up', 'A pick hangs on the wall.'],
  ['cc_lantern_in', 2, 5, 'left', 'A stool by the beds.'],
  ['cc_hall_in', 2, 9, 'up', 'A stone plinth. The top is empty.'],
  ['cc_hall_in', 8, 9, 'up', 'A stone plinth, the same cut as the pillars.'],
  ['cc_hall_in', 7, 10, 'right', 'A low stone plinth along the aisle.'],
];
const LINES_B6 = [
  ['hc_airport_in', 1, 3, 'up', 'A board of winds. The marks are painted.'],
  ['hc_airport_in', 2, 5, 'left', 'A crate lashed for the next lift.'],
  ['hc_airport_in', 7, 5, 'up', 'A second crate. The lid is shut.'],
  ['hc_airport_in', 6, 4, 'up', 'The boarding board. Dusk, if the wind stays kind.'],
  ['hc_command_in', 5, 3, 'up', 'A second console. Its lamps stay dim.'],
  ['hc_command_in', 7, 3, 'up', 'The end of the console row.'],
  ['hc_command_in', 6, 4, 'right', 'A table with a chart of the docks.'],
  ['hc_barracks_in', 5, 3, 'right', 'A bunk. The blanket is folded.'],
  ['hc_barracks_in', 5, 4, 'right', 'A bunk in the row. The pillow is thin.'],
  ['hc_barracks_in', 5, 5, 'right', 'The end bunk. A yellow stitch on the blanket.'],
  ['hc_barracks_in', 2, 5, 'left', 'A metal locker. The door is shut.'],
  ['hc_marina_in', 7, 3, 'up', 'A small boat on a rack. The hull is dry.'],
  ['hc_marina_in', 2, 5, 'left', 'A folded net. It smells like the canal.'],
  ['hc_marina_in', 6, 5, 'right', 'A coil of rope beside the rack.'],
  ['hc_school_in', 7, 3, 'up', 'A chalk board. The lesson is wiped clean.'],
  ['hc_school_in', 5, 4, 'right', 'A desk in the row. The top is clear.'],
  ['hc_school_in', 5, 5, 'right', 'Another desk. A chalk stub sits in the groove.'],
  ['hc_bank_in', 6, 3, 'up', 'A grille over the counter window.'],
  ['hc_bank_in', 7, 3, 'up', 'A heavy door. The wheel does not turn.'],
  ['hc_gym_in', 6, 3, 'right', 'A practice mat. The floor gives under it.'],
  ['hc_gym_in', 2, 5, 'left', 'A mat along the court line.'],
  ['hc_gym_in', 5, 4, 'right', 'A mat by the far line.'],
  ['hc_gym_in', 3, 4, 'left', 'Practice floor. No Seals. Wipe your boots.'],
  ['hc_lantern_in', 2, 4, 'left', 'A shelf of folded cloth and small jars.'],
  ['hc_church_in', 1, 4, 'up', 'A candle stand. The flame holds steady.'],
  ['hc_church_in', 9, 4, 'up', 'A second stand. The wax is warm.'],
  ['hc_hall_in', 4, 2, 'right', 'A low stage. The boards are set in a pattern.'],
  ['hc_hall_in', 2, 7, 'left', 'A chair facing the stage.'],
  ['hc_hall_in', 8, 7, 'right', 'Another chair, set a little apart.'],
  ['hc_arena_in', 1, 5, 'down', 'A short stand facing the sand.'],
  ['hc_arena_in', 3, 5, 'down', 'A seat in the stands.'],
  ['hc_arena_in', 7, 5, 'down', 'Another seat. The row faces the ring.'],
  ['hc_arena_in', 9, 5, 'down', 'The end of the stands.'],
  ['hc_apt_in', 4, 3, 'right', 'A small desk by the wall.'],
  ['hc_mall_1', 5, 3, 'up', 'A small fountain. The water holds still.'],
  ['hc_mall_1', 1, 7, 'down', 'A stall with folded cloth.'],
  ['hc_mall_1', 3, 7, 'down', 'A stall of small jars.'],
  ['hc_mall_1', 7, 7, 'down', 'A stall under a striped awning.'],
  ['hc_mall_1', 9, 7, 'down', 'A stall of paper bags.'],
  ['hc_mall_2', 1, 3, 'up', 'A coat stall. The hangers are empty.'],
  ['hc_mall_2', 7, 3, 'up', 'A scarf stall. The colours are quiet.'],
  ['hc_mall_2', 1, 7, 'down', 'A stall of folded coats.'],
  ['hc_mall_2', 3, 7, 'down', 'A stall of buttons and thread.'],
  ['hc_mall_2', 7, 5, 'down', 'A bench. A Walkling can sit.'],
];
const LINES_B7 = [
  ['mahopac_obs', 2, 5, 'up', 'A desk under the dome. A blank page waits.'],
  ['mahopac_obs', 6, 5, 'up', 'A stool pulled up to the desk.'],
  ['mahopac_obs', 1, 4, 'down', 'A small lamp. The shade is warm.'],
  ['mahopac_obs', 6, 3, 'right', 'A rolled star chart. The ink is pale.'],
  ['mahopac_obs', 6, 5, 'right', 'A small case. The lid is shut.'],
  ['dream_2004', 2, 6, 'left', 'Wooden blocks, stacked and still.'],
  ['dream_2004', 6, 6, 'right', 'A low shelf. A round plush sits on it.'],
  ['dream_2004', 2, 2, 'left', 'A small lamp by the wall.'],
  ['dream_2004', 6, 4, 'right', 'A soft cushion on the floor.'],
  ['dream_party', 5, 4, 'up', 'Bowling pins, waiting. The balloons are the ones asking.'],
  ['dream_2004', 7, 3, 'up', 'You are very small. Push the toy. It pops as it rolls.'],
  ['dream_drive', 4, 3, 'up', 'A menu board. The pictures are plain shapes.'],
  ['dream_drive', 2, 4, 'left', 'A short post by the lane. No name on it.'],
];
const LINES_B8 = [
  ['fb_lantern_in', 3, 4, 'up', 'A wooden counter. A bowl of water sits on it.'],
  ['fb_lantern_in', 10, 4, 'up', 'A small lamp. The shade is warm.'],
  ['fb_lantern_in', 8, 4, 'right', 'Herbs hang here to dry.'],
  ['fb_lantern_in', 9, 8, 'up', 'A crate of orchard apples.'],
  ['fb_lantern_in', 7, 10, 'right', 'A low table. The top is clear.'],
  ['fb_lantern_in', 9, 11, 'left', 'A jug of pressed apples. The lid is on.'],
  ['fb_lantern_in', 2, 12, 'left', 'A basket lined with leaves.'],
  ['fb_hall_in', 4, 4, 'up', 'A lamp by the flower dais.'],
  ['fb_hall_in', 2, 7, 'up', 'A stand of pale ribbons.'],
  ['fb_hall_in', 3, 8, 'left', 'A hedge in a low planter.'],
  ['fb_hall_in', 3, 18, 'left', 'A tall urn. It holds cut stems.'],
  ['fb_hall_in', 13, 18, 'right', 'A round pot of cut blooms.'],
  ['fb_hall_in', 4, 21, 'up', 'A bowl of loose petals.'],
  ['fb_hall_in', 9, 22, 'up', 'A basket of pink blooms.'],
  ['fb_hall_in', 2, 22, 'up', 'A bench along the path.'],
  ['fb_hall_in', 1, 22, 'up', 'A jar of dried petals.'],
  ['fb_hall_in', 14, 22, 'up', 'A stool pulled off the path.'],
  ['fb_hall_in', 4, 21, 'down', 'A flat cushion off the mat.'],
  ['fb_hall_in', 13, 8, 'up', "A lamp in the top hedge. Fen's dais is one more step up."],
  ['fb_hall_in', 3, 10, 'up', 'Tall blooms, staked one by one.'],
  ['fb_hall_in', 12, 12, 'up', 'A little spout keeps the lily trough full.'],
  ['fb_hall_in', 4, 14, 'up', 'Herbs drying on a rack. Sage, mint and something sharp.'],
  ['fb_hall_in', 9, 16, 'up', 'Rose cuttings, potted to grow on.'],
  ['fb_hall_in', 6, 18, 'up', 'A basket of seed packets. Each row is labelled by hand.'],
];
const LINES_HQ = [
  ['hm_hq_f1', 10, 6, 'right', 'Every box has a tag. Every tag has a date. That is the job.'],
  ['hm_hq_f1', 10, 13, 'right', 'First week. I polish boots and learn the roster.'],
  ['hm_hq_f2', 4, 3, 'down', 'Three check-ins this hour. The quiet ones always call last.'],
  ['hm_hq_f2', 10, 10, 'left', 'I mark the roads we walk. The map is never quite done.'],
  ['hm_hq_f1', 11, 3, 'up', 'STAIRS · Captain Lumen and the radio, upstairs.'],
  ['hm_hq_f2', 4, 3, 'up', 'RADIO · Every Keeper1 checks in. Even the quiet ones.'],
];

const PACKS = [
  { mode: 'b5', rooms: [
    { id: 'hm_home_in', ax: 4, ay: 6 },
    { id: 'hm_home_up', ax: 2, ay: 5 },
    { id: 'hm_lodge_in', ax: 5, ay: 7 },
    { id: 'hm_lantern_in', ax: 4, ay: 5 },
    { id: 'hm_rook_in', ax: 3, ay: 4 },
    { id: 'cc_lantern_in', ax: 4, ay: 5 },
  ] },
  { mode: 'hall', rooms: [{ id: 'cc_hall_in', ax: 5, ay: 11 }] },
  { mode: 'b7', rooms: [
    { id: 'mahopac_obs', ax: 4, ay: 5 },
    { id: 'dream_2004', ax: 4, ay: 6 },
    { id: 'dream_party', ax: 5, ay: 6 },
    { id: 'dream_drive', ax: 5, ay: 3 },
  ] },
  { mode: 'b8', rooms: [
    { id: 'fb_lantern_in', ax: 5, ay: 14 },
    { id: 'fb_hall_in', ax: 7, ay: 22 },
  ] },
  { mode: 'hq', rooms: [
    { id: 'hm_hq_f1', ax: 6, ay: 14 },
    { id: 'hm_hq_f2', ax: 10, ay: 4 },
  ] },
  { mode: 'b6', rooms: [
    { id: 'hc_airport_in', ax: 4, ay: 5 },
    { id: 'hc_command_in', ax: 4, ay: 5 },
    { id: 'hc_barracks_in', ax: 4, ay: 5 },
    { id: 'hc_marina_in', ax: 4, ay: 5 },
    { id: 'hc_school_in', ax: 4, ay: 5 },
    { id: 'hc_bank_in', ax: 4, ay: 5 },
    { id: 'hc_gym_in', ax: 4, ay: 5 },
    { id: 'hc_lantern_in', ax: 4, ay: 5 },
    { id: 'hc_church_in', ax: 5, ay: 9 },
    { id: 'hc_hall_in', ax: 5, ay: 9 },
    { id: 'hc_arena_in', ax: 5, ay: 7 },
    { id: 'hc_apt_in', ax: 3, ay: 4 },
    { id: 'hc_mall_1', ax: 5, ay: 9 },
    { id: 'hc_mall_2', ax: 9, ay: 6 },
  ] },
  { mode: 'b2', rooms: [
    { id: 'rx_f1', ax: 6, ay: 19, w: 14, h: 22 },
    { id: 'rx_f2', ax: 6, ay: 19, w: 14, h: 22 },
    { id: 'rx_f3', ax: 6, ay: 19, w: 14, h: 22 },
  ] },
  { mode: 'b3', rooms: [
    { id: 'sm_yard', ax: 9, ay: 9, w: 18, h: 12 },
    { id: 'sm_tunnel', ax: 9, ay: 9, w: 18, h: 12 },
    { id: 'sm_hold', ax: 9, ay: 9, w: 18, h: 12 },
    { id: 'sm_den', ax: 9, ay: 9, w: 18, h: 12 },
  ] },
];

function save() {
  const s = starterSave();
  s.settings.follower = false;
  return s;
}

async function boot(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installSave(page.context(), save(), { quietDay: true });
  await gotoGame(page, '?debug=1');
  await page.waitForFunction(() => window.PixelPets && window.PixelPets.debug === true);
  await page.evaluate(() => PixelPets.showTab('walk'));
}

async function say(page) {
  await expect.poll(() => page.evaluate(() => {
    if (PixelPets.fading) return false;
    if (PixelPets.scene && PixelPets.scene.text) return true;
    const w = PixelPets.state.world;
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[w.facing] || [0, 1];
    return PixelPets.mapObjs.some((o) => o.x === w.x + d[0] && o.y === w.y + d[1]);
  })).toBe(true);
  if (!(await page.evaluate(() => !!(PixelPets.scene && PixelPets.scene.text)))) {
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('#talkBtn');
      if (btn && !btn.hidden && !btn.disabled) { btn.click(); return true; }
      return false;
    });
    if (!clicked) await page.keyboard.press('Space');
  }
  await expect.poll(() => page.evaluate(() => (PixelPets.scene && PixelPets.scene.text) || '')).not.toBe('');
  const text = await page.evaluate(() => PixelPets.scene.text);
  for (let i = 0; i < 8 && await page.evaluate(() => !!PixelPets.scene); i++) await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => !PixelPets.scene)).toBe(true);
  return text;
}

test('shared map sweep reaches every person and prop @w1', async ({ page }) => {
  test.setTimeout(240000);
  await boot(page);
  const report = await page.evaluate((packs) => {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    function flags(extra) {
      Object.assign(PixelPets.state.flags, extra);
    }
    function reach(room, mode) {
      PixelPets.goto(room.id, room.ax, room.ay, 'up');
      const info = PixelPets.mapInfo;
      const objs = info.objs;
      const block = new Set(objs.filter((o) => o.block).map((o) => o.x + ',' + o.y));
      const warps = new Set(objs.filter((o) => o.kind === 'warp').map((o) => o.x + ',' + o.y));
      const seen = new Set([room.ax + ',' + room.ay]);
      const q = [[room.ax, room.ay]];
      const W = room.w || info.w;
      const H = room.h || info.h;
      while (q.length) {
        const [x, y] = q.shift();
        const stopWarp = mode !== 'b2' && mode !== 'b3' && warps.has(x + ',' + y) && !(x === room.ax && y === room.ay);
        if (stopWarp) continue;
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k)) continue;
          if (mode === 'b2' || mode === 'b3') {
            if (PixelPets.tileInfo(nx, ny).blocked) continue;
          } else if (PixelPets.tileInfo(nx, ny).solid || block.has(k)) continue;
          seen.add(k);
          q.push([nx, ny]);
        }
      }
      const adj = (x, y) => dirs.some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
      const missed = [];
      if (mode === 'b2') {
        objs.filter((o) => o.block).forEach((o) => { if (!adj(o.x, o.y)) missed.push(o.id); });
        objs.filter((o) => !o.block && (o.kind === 'warp' || o.kind === 'door' || o.kind === 'pickup' || o.kind === 'trigger')).forEach((o) => {
          if (!seen.has(o.x + ',' + o.y)) missed.push(o.id);
        });
      } else if (mode === 'b3') {
        objs.forEach((o) => {
          const neigh = adj(o.x, o.y);
          if (o.block ? !neigh : !seen.has(o.x + ',' + o.y)) missed.push(o.id);
        });
      } else if (mode === 'hq') {
        objs.forEach((o) => {
          if (o.kind !== 'npc' && o.kind !== 'sign' && o.kind !== 'warp') return;
          const ok = o.kind === 'warp' ? seen.has(o.x + ',' + o.y) : adj(o.x, o.y);
          if (!ok) missed.push(o.id);
        });
      } else {
        const doorKinds = mode === 'b8' ? ['npc', 'sign', 'prop', 'warp'] : ['npc', 'trainer', 'sign', 'prop', 'warp'];
        if (mode === 'b6') doorKinds.push('trigger');
        objs.forEach((o) => {
          if (doorKinds.indexOf(o.kind) < 0) return;
          const onTile = o.kind === 'warp' || o.kind === 'trigger';
          if (!(onTile ? seen.has(o.x + ',' + o.y) : adj(o.x, o.y))) missed.push(o.id);
        });
      }
      const tally = { npc: 0, trainer: 0, sign: 0, prop: 0, warp: 0 };
      const ids = { npc: [], trainer: [], sign: [], prop: [], warp: [] };
      objs.forEach((o) => {
        if (!tally.hasOwnProperty(o.kind)) return;
        tally[o.kind]++;
        ids[o.kind].push(o.id);
      });
      Object.keys(ids).forEach((k) => ids[k].sort());
      return { id: room.id, mode, missed, tally, ids };
    }
    const out = [];
    for (const pack of packs) {
      if (pack.mode === 'hall') flags({ 'story.h2_seam_a': true, 'story.h2_seam_b': true });
      if (pack.mode === 'b6') flags({ 'story.cobble_end': true });
      if (pack.mode === 'b2') flags({
        'story.side': 'glimmer', 'story.side_pick_done': true, 'story.rx_enter': true, 'story.saw_arbiter': true,
        'story.rx_f1': true, 'story.rx_f2': true, 'story.rx_f3': true,
      });
      if (pack.mode === 'b3') flags({
        'story.side_pick_done': true, 'story.heights_path': 'tunnels', 'story.sm_yard': true, 'story.early_done': true,
      });
      for (const room of pack.rooms) out.push(reach(room, pack.mode === 'hall' ? 'b5' : pack.mode));
    }
    return out;
  }, PACKS);

  const required = PACKS.reduce((acc, pack) => acc.concat(pack.rooms.map((r) => r.id)), []);
  expect(report.map((r) => r.id)).toEqual(required);
  for (const row of report) {
    expect(row.missed, row.id + ' unreachable').toEqual([]);
    expect(row.tally.npc + row.tally.trainer + row.tally.sign + row.tally.prop, row.id + ' empty').toBeGreaterThan(0);
  }
  // Literal tallies from a full pass. A skipped map, or a map that dropped a person or prop, fails here.
  const COUNTS = {
    hm_home_in: { npc: 0, trainer: 0, sign: 1, prop: 7, warp: 2 },
    hm_home_up: { npc: 1, trainer: 0, sign: 0, prop: 6, warp: 1 },
    hm_lodge_in: { npc: 1, trainer: 0, sign: 0, prop: 7, warp: 1 },
    hm_lantern_in: { npc: 1, trainer: 0, sign: 1, prop: 6, warp: 1 },
    hm_rook_in: { npc: 1, trainer: 0, sign: 0, prop: 6, warp: 1 },
    cc_lantern_in: { npc: 1, trainer: 0, sign: 1, prop: 7, warp: 1 },
    cc_hall_in: { npc: 1, trainer: 2, sign: 1, prop: 5, warp: 1 },
    mahopac_obs: { npc: 0, trainer: 0, sign: 0, prop: 6, warp: 1 },
    dream_2004: { npc: 2, trainer: 0, sign: 1, prop: 10, warp: 0 },
    dream_party: { npc: 0, trainer: 0, sign: 1, prop: 4, warp: 0 },
    dream_drive: { npc: 1, trainer: 0, sign: 0, prop: 3, warp: 0 },
    fb_lantern_in: { npc: 1, trainer: 0, sign: 1, prop: 12, warp: 1 },
    fb_hall_in: { npc: 1, trainer: 0, sign: 1, prop: 24, warp: 1 },
    hm_hq_f1: { npc: 5, trainer: 0, sign: 1, prop: 41, warp: 2 },
    hm_hq_f2: { npc: 4, trainer: 0, sign: 1, prop: 28, warp: 1 },
    hc_airport_in: { npc: 1, trainer: 0, sign: 0, prop: 4, warp: 1 },
    hc_command_in: { npc: 1, trainer: 0, sign: 0, prop: 4, warp: 1 },
    hc_barracks_in: { npc: 1, trainer: 0, sign: 0, prop: 5, warp: 1 },
    hc_marina_in: { npc: 1, trainer: 0, sign: 0, prop: 4, warp: 1 },
    hc_school_in: { npc: 1, trainer: 0, sign: 0, prop: 4, warp: 1 },
    hc_bank_in: { npc: 1, trainer: 0, sign: 0, prop: 3, warp: 1 },
    hc_gym_in: { npc: 1, trainer: 0, sign: 1, prop: 3, warp: 1 },
    hc_lantern_in: { npc: 1, trainer: 0, sign: 1, prop: 5, warp: 1 },
    hc_church_in: { npc: 1, trainer: 0, sign: 0, prop: 7, warp: 1 },
    hc_hall_in: { npc: 6, trainer: 0, sign: 1, prop: 7, warp: 1 },
    hc_arena_in: { npc: 1, trainer: 0, sign: 0, prop: 6, warp: 1 },
    hc_apt_in: { npc: 1, trainer: 0, sign: 0, prop: 2, warp: 1 },
    hc_mall_1: { npc: 1, trainer: 0, sign: 1, prop: 7, warp: 2 },
    hc_mall_2: { npc: 1, trainer: 0, sign: 1, prop: 6, warp: 1 },
    rx_f1: { npc: 1, trainer: 1, sign: 1, prop: 18, warp: 1 },
    rx_f2: { npc: 2, trainer: 1, sign: 1, prop: 23, warp: 1 },
    rx_f3: { npc: 0, trainer: 1, sign: 1, prop: 25, warp: 1 },
    sm_yard: { npc: 0, trainer: 1, sign: 0, prop: 17, warp: 1 },
    sm_tunnel: { npc: 1, trainer: 0, sign: 0, prop: 14, warp: 1 },
    sm_hold: { npc: 0, trainer: 1, sign: 0, prop: 20, warp: 1 },
    sm_den: { npc: 0, trainer: 1, sign: 0, prop: 15, warp: 1 },
  };
  for (const row of report) {
    const want = COUNTS[row.id];
    expect(want, row.id + ' was skipped').toBeTruthy();
    expect(row.tally, row.id).toEqual(want);
  }

  // The reach pass sets story.side to glimmer for the lab floors. Default Keeper lines need the unset side.
  await page.evaluate(() => {
    PixelPets.setSide(null);
    PixelPets.setFlag('story.reached_mahopac', false);
  });

  const exact = LINES_B3.concat(LINES_B5, LINES_B6, LINES_B7, LINES_B8, LINES_HQ);
  for (const row of exact) {
    await page.evaluate((at) => PixelPets.goto(at[0], at[1], at[2], at[3]), row);
    await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true);
    expect(await say(page), row[0] + ' ' + row[1] + ',' + row[2]).toBe(row[4]);
  }
  for (const row of LINES_B2) {
    await page.evaluate((at) => PixelPets.goto(at[0], at[1], at[2], at[3]), row);
    await expect.poll(() => page.evaluate(() => !PixelPets.fading)).toBe(true);
    expect(await say(page), row[0] + ' ' + row[1] + ',' + row[2]).toContain(row[4]);
  }
  await page.evaluate(() => PixelPets.goto('hm_lantern_in', 1, 3, 'up'));
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => (PixelPets.scene && PixelPets.scene.text) || '')).toBe('Three soft beds under a warm lantern.');
  if (await page.evaluate(() => PixelPets.scene && !PixelPets.scene.full)) await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => PixelPets.scene && PixelPets.scene.mode === 'choice')).toBeTruthy();
  await page.waitForFunction(() => window.PixelPets.optionsReady === true);
  await page.locator('#sbChoices button', { hasText: 'Not now' }).click();
  await page.waitForFunction(() => !PixelPets.scene);

  await page.evaluate(() => { PixelPets.setSide('glimmer'); PixelPets.goto('hm_hq_f1', 10, 6, 'right'); });
  expect(await say(page)).toBe('Hands where I can see them. Thank you.');
  await page.evaluate(() => { PixelPets.setSide('keepers'); PixelPets.setStanding('keepers', 10); PixelPets.goto('hm_hq_f1', 10, 13, 'right'); });
  expect(await say(page)).toBe('You are on the board! I am only on the tea rota.');
  await page.evaluate(() => { PixelPets.setFlag('story.reached_mahopac', true); PixelPets.goto('hm_hq_f2', 10, 10, 'left'); });
  expect(await say(page)).toBe('You walked the north trail? Draw me what you saw.');

  const nap = await page.evaluate(() => {
    PixelPets.goto('hc_apt_in', 1, 3, 'up');
    const bed = PixelPets.mapObjs.find((o) => o.id === 'hc_apt_bed');
    const respawn = PixelPets.tileInfo(2, 3);
    return { bed: bed && { x: bed.x, y: bed.y, art: bed.art }, respawnSolid: respawn.solid, v: PixelPets.state.v };
  });
  expect(nap.bed).toEqual({ x: 1, y: 2, art: true });
  expect(nap.respawnSolid).toBe(false);
  expect(nap.v).toBe(2);
});
