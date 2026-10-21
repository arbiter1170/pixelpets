/* Asset converters (CV1, CV2, CV3). Does not boot the game and does not touch a save.
   Fixtures are the small PNG and MIDI files in tests/fixtures/assets/. */
const { test, expect } = require('@playwright/test');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FIX = path.join(__dirname, 'fixtures', 'assets');

function run(args) {
  return spawnSync('python3', args, { cwd: ROOT, encoding: 'utf8' });
}

function py(script, args) {
  return run(['-c', script, ...(args || [])]);
}

/* sfx.js musicCheck, on one converted loop: lead and bass step sums, drum bars, drum letters. */
function musicCheck(id, track) {
  const bad = [];
  const need = track.bars * track.stepsPerBar;
  for (const voice of ['lead', 'bass']) {
    const sum = track[voice].notes.reduce((total, note) => total + note[1], 0);
    if (sum !== need) bad.push(id + ' ' + voice + ' ' + sum + '!=' + need);
  }
  if (track.drums.length !== track.bars) bad.push(id + ' drum bars');
  track.drums.forEach((bar, i) => {
    if (bar.length !== track.stepsPerBar || /[^ksh.]/.test(bar)) bad.push(id + ' drum ' + i);
  });
  return bad;
}

function noteRange(track) {
  const notes = [];
  for (const voice of ['lead', 'bass']) {
    for (const [pitch] of track[voice].notes) {
      if (pitch !== 0) notes.push(pitch);
    }
  }
  return notes;
}

test('palette png round-trips with zero unknown colours @w1', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'walklings-assets-'));
  const tile = run(['tools/png2grid.py', '--tile', '--id', 'tile_ok', path.join(FIX, 'tile_ok.png')]);
  expect(tile.status, tile.stderr).toBe(0);
  expect(tile.stderr).toContain('unknown 0');
  const tileJson = JSON.parse(tile.stdout);
  expect(tileJson.tile_ok).toHaveLength(16);
  expect(tileJson.tile_ok[0]).toHaveLength(16);
  expect(tileJson.tile_ok[0][0]).toBe('.');
  expect(tileJson.tile_ok.join('')).toContain('A');
  expect(tileJson.tile_ok.join('')).toContain('1');

  const tilePath = path.join(dir, 'tile.json');
  fs.writeFileSync(tilePath, tile.stdout);
  const preview = path.join(dir, 'tile.png');
  const preview4 = path.join(dir, 'tile4.png');
  expect(run(['tools/grid2png.py', '--id', 'tile_ok', '--scale', '1', '--out', preview, tilePath]).status).toBe(0);
  expect(run(['tools/grid2png.py', '--id', 'tile_ok', '--scale', '4', '--out', preview4, tilePath]).status).toBe(0);
  const back = run(['tools/png2grid.py', '--tile', '--id', 'tile_ok', preview]);
  expect(back.status, back.stderr).toBe(0);
  expect(back.stderr).toContain('unknown 0');
  expect(JSON.parse(back.stdout).tile_ok).toEqual(tileJson.tile_ok);
  const scaled = py(
    'import json,sys\n'
    + 'sys.path.insert(0,"tools")\n'
    + 'import assetlib\n'
    + 'rows=json.load(open(sys.argv[1]))["tile_ok"]\n'
    + 'w,h,px=assetlib.read_png(sys.argv[2])\n'
    + 'scale=4\n'
    + 'assert (w,h)==(16*scale,16*scale)\n'
    + 'for y,row in enumerate(rows):\n'
    + '  for x,ch in enumerate(row):\n'
    + '    expect=(0,0,0,0) if ch=="." else assetlib._rgb(assetlib.PAL[ch])+(255,)\n'
    + '    for dy in range(scale):\n'
    + '      for dx in range(scale):\n'
    + '        assert px[(y*scale+dy)*w+x*scale+dx]==expect, (x,y)\n'
    + 'print("unknown 0")\n',
    [tilePath, preview4]
  );
  expect(scaled.status, scaled.stderr).toBe(0);
  expect(scaled.stdout).toContain('unknown 0');

  const creature = run(['tools/png2grid.py', '--creature', '--id', 'creature_ok', path.join(FIX, 'creature_ok.png')]);
  expect(creature.status, creature.stderr).toBe(0);
  expect(creature.stderr).toContain('unknown 0');
  const body = JSON.parse(creature.stdout).creature_ok;
  expect(body.half).toHaveLength(16);
  expect(body.half.every(row => row.length === 8)).toBe(true);
  expect(body.col.a).toBe('o');
  expect(body.col.x).toBe('r');
  const halfOnly = path.join(dir, 'creature.json');
  fs.writeFileSync(halfOnly, JSON.stringify({ creature_ok: { half: body.half, col: body.col } }));
  const creaturePng = path.join(dir, 'creature.png');
  const creature4 = path.join(dir, 'creature4.png');
  expect(run(['tools/grid2png.py', '--id', 'creature_ok', '--scale', '1', '--out', creaturePng, halfOnly]).status).toBe(0);
  expect(run(['tools/grid2png.py', '--id', 'creature_ok', '--scale', '4', '--out', creature4, halfOnly]).status).toBe(0);
  const creatureBack = run(['tools/png2grid.py', '--tile', '--id', 'creature_ok', creaturePng]);
  expect(creatureBack.status, creatureBack.stderr).toBe(0);
  expect(creatureBack.stderr).toContain('unknown 0');
  expect(JSON.parse(creatureBack.stdout).creature_ok).toEqual(body.rows);

  const keeper = run(['tools/png2grid.py', '--keeper', '--id', 'keeper_ok', path.join(FIX, 'keeper_ok.png')]);
  expect(keeper.status, keeper.stderr).toBe(0);
  expect(keeper.stderr).toContain('unknown 0');
  const strip = JSON.parse(keeper.stdout).keeper_ok;
  expect(strip).toHaveLength(16);
  expect(strip[0]).toHaveLength(96);
  const keeperPath = path.join(dir, 'keeper.json');
  fs.writeFileSync(keeperPath, keeper.stdout);
  const keeperPng = path.join(dir, 'keeper.png');
  expect(run(['tools/grid2png.py', '--id', 'keeper_ok', '--scale', '1', '--out', keeperPng, keeperPath]).status).toBe(0);
  const keeperBack = run(['tools/png2grid.py', '--keeper', '--id', 'keeper_ok', keeperPng]);
  expect(keeperBack.status, keeperBack.stderr).toBe(0);
  expect(keeperBack.stderr).toContain('unknown 0');
  expect(JSON.parse(keeperBack.stdout).keeper_ok).toEqual(strip);

  const prop = run(['tools/png2grid.py', '--prop', '--cells', '2x1', '--id', 'prop_ok', path.join(FIX, 'prop_ok.png')]);
  expect(prop.status, prop.stderr).toBe(0);
  expect(prop.stderr).toContain('unknown 0');
  const propJson = JSON.parse(prop.stdout);
  expect(propJson.prop_ok).toHaveLength(16);
  expect(propJson.prop_ok[0]).toHaveLength(32);
  expect(propJson.prop_ok_0).toHaveLength(16);
  expect(propJson.prop_ok_1[0]).toHaveLength(16);
  const propPath = path.join(dir, 'prop.json');
  fs.writeFileSync(propPath, prop.stdout);
  const propPng = path.join(dir, 'prop.png');
  expect(run(['tools/grid2png.py', '--id', 'prop_ok', '--scale', '1', '--out', propPng, propPath]).status).toBe(0);
  const propBack = run(['tools/png2grid.py', '--prop', '--cells', '2x1', '--id', 'prop_ok', propPng]);
  expect(propBack.status, propBack.stderr).toBe(0);
  expect(propBack.stderr).toContain('unknown 0');
  expect(JSON.parse(propBack.stdout).prop_ok).toEqual(propJson.prop_ok);

  const badColour = run(['tools/png2grid.py', '--tile', '--id', 'bad', path.join(FIX, 'bad_colour.png')]);
  expect(badColour.status).not.toBe(0);
  expect(badColour.stderr).toMatch(/unknown [1-9]/);

  const badSize = run(['tools/png2grid.py', '--tile', '--id', 'bad', path.join(FIX, 'bad_size.png')]);
  expect(badSize.status).not.toBe(0);
  expect(badSize.stderr).toContain('wrong size');

  const badMirror = run(['tools/png2grid.py', '--creature', '--id', 'bad', path.join(FIX, 'bad_mirror.png')]);
  expect(badMirror.status).not.toBe(0);
  expect(badMirror.stderr).toContain('not mirror-symmetric');
});

test('music literal matches musicCheck and stays in midi 36-96 @w1', () => {
  const converted = run([
    'tools/midi2music.py', '--json', '--id', 'loop_ok', '--steps-per-bar', '8',
    path.join(FIX, 'loop_ok.mid'),
  ]);
  expect(converted.status, converted.stderr).toBe(0);
  const track = JSON.parse(converted.stdout).loop_ok;
  expect(musicCheck('loop_ok', track)).toEqual([]);
  expect(track.bars * track.stepsPerBar).toBe(16);
  expect(track.lead.notes.reduce((sum, note) => sum + note[1], 0)).toBe(16);
  expect(track.bass.notes.reduce((sum, note) => sum + note[1], 0)).toBe(16);
  expect(track.drums).toEqual(['k.h.s.h.', 'k.h.s.h.']);
  const pitches = noteRange(track);
  expect(Math.min(...pitches)).toBe(36);
  expect(Math.max(...pitches)).toBe(96);
  for (const pitch of pitches) {
    expect(pitch).toBeGreaterThanOrEqual(36);
    expect(pitch).toBeLessThanOrEqual(96);
  }
  expect(track.lead.notes).toEqual([[60, 4], [0, 4], [96, 8]]);
  expect(track.bpm).toBe(120);
  expect(track.key).toBe('C major');

  const pasted = run([
    'tools/midi2music.py', '--id', 'loop_ok', '--steps-per-bar', '8',
    path.join(FIX, 'loop_ok.mid'),
  ]);
  expect(pasted.status, pasted.stderr).toBe(0);
  expect(pasted.stdout).toContain('[60,4]');
  expect(pasted.stdout).toContain('[0,4]');
  expect(pasted.stdout).toContain('[96,8]');
  expect(pasted.stdout).toContain("'k.h.s.h.'");

  const poly = run(['tools/midi2music.py', '--json', '--steps-per-bar', '8', path.join(FIX, 'poly.mid')]);
  expect(poly.status).not.toBe(0);
  expect(poly.stderr).toContain('polyphonic');

  const range = run(['tools/midi2music.py', '--json', '--steps-per-bar', '8', path.join(FIX, 'range.mid')]);
  expect(range.status).not.toBe(0);
  expect(range.stderr).toContain('out of range');
  expect(range.stderr).toContain('36-96');

  const overflow = run([
    'tools/midi2music.py', '--json', '--bars', '1', '--steps-per-bar', '8',
    path.join(FIX, 'loop_ok.mid'),
  ]);
  expect(overflow.status).not.toBe(0);
  expect(overflow.stderr).toContain('overflow');
});
