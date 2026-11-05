# PLAYTEST_GATE packet v0.1: the suite that says a build is safe for playtesters with real saves

Status: test plan only. No game code, no tests in this PR. A second agent builds the suite from this file.
Base: `origin/main` 21892b6 (#332), build `20261104-1627`. Every expected value below was read on that build by a throwaway
probe (deleted, never committed) at 390, and the load and settle rows again at 320. Where the game and a source spec disagree
with each other or with a design note, the value here is what the build does, and the gap is under **Open questions**.

Rules that win over this packet: `AGENTS.md`, `CLAUDE.md`, `tests/README.md` and the `walklings-*` skills.

## 0. What the gate is

One Playwright suite, `tests/playtest_gate/`, run on every PR before it is merged. It passes only if a holder's real save, of
each of the seven Act 1 kinds below, still loads without anything written to it at load beyond a named list, with zero
errors, and if the story's newest steps (the Keeper join, a town changing hands, Kilnmouth, the Cabinet stair) still walk at
both phone widths. The repo has no CI workflow, so "run on every PR" means the PR author runs it and
pastes the `PP_TEST RESULT` line into the PR's "How it was tested" (see Open question Q7).

Run it with:

```
npm run test:agent -- tests/playtest_gate/ --project=320 --project=390
```

Never pipe it. Read failures with `grep -n` on `test-logs/run.log` or `tail -n 40`.

## 1. Files the builder adds

| File | What it holds |
| --- | --- |
| `tests/playtest_gate/gate_fixtures.js` | The seven save kinds (imported, not copied), the stage fixtures of §4 (flag sets copied verbatim from the named spec lines, with a comment naming the source line), the allowed-change list of §3.3, the expected tables of §§3-6. No `.spec.js` suffix. |
| `tests/playtest_gate/gate_lib.js` | The seeder (§3.1), the settle (§3.2), the diff (§3.3), the error and network guard (§3.4), the game.js splice (§6.3). No `.spec.js` suffix. |
| `tests/playtest_gate/g1_load.spec.js` | §3: every kind loads, settles and reloads clean. Runs without `?debug=1`, as a real holder does. |
| `tests/playtest_gate/g2_walk.spec.js` | §§4-5: per-kind reads and the four walk steps (`?debug=1`). |
| `tests/playtest_gate/g3_harden.spec.js` | §6: the SEALS kill switch false path and sway on old saves, including two towns flipping at once. |
| `tests/playtest_gate/manual_saves.js` | §7: prints a named stage fixture as save JSON for QA to load on a real iPhone. Not a spec. |
| `tests/README.md` | One row for the suite (the builder's PR, not this one). |

Every file must pass `tools/scans/run.js` (pp_test runs it first): no hard-coded `/opt/cursor/artifacts` path and no baseline
from `git show HEAD:` (`tools/scans/test_mistakes.js`).

Every spec file starts with:

```js
test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name === '375', 'PLAYTEST_GATE runs at 320 and 390 only');
});
```

No row carries `@slow` or `@w1` (the config hides `@slow` from the default run and `@w1` from 390).

## 2. Saves, widths and controls

### 2.1 The seven save kinds

Imported from `tests/fixtures/or_gate_kinds.js` (`KINDS`, `SEVEN`, `readGates`, `OBJ_GATES`, `BOARD_SLIPS`, `TELLS`), the same
fixtures `tests/day1_save_kinds.spec.js` and `tests/faction_or_gate.spec.js` use. Each is `starterSave()` from
`tests/helpers.js` with `Object.assign(s.flags, kind.flags)` and `s.seals = { ...kind.seals }`.

Flag groups (lines 5-12 of `or_gate_kinds.js`):

| Group | Flags |
| --- | --- |
| FB | `story.reached_route1: true`, `story.reached_fernbrook: true` |
| MET | `story.met_glimmerwell: true`, `story.met_fen: true` |
| PICK_K | `story.side_pick_done: true`, `story.side: 'keepers'` |
| PATH_K | `story.know_us: true`, `story.heights_path: 'tunnels'` |
| ORCH | `story.orchard_cleared: true` |
| SEAL1 | `story.seal1: true` |

| Kind | Flags on top of `starterSave()` | Seals | Picked a side? |
| --- | --- | --- | --- |
| `a1` | FB, MET, PICK_K, PATH_K | none | yes |
| `a2` | `a1` + ORCH | none | yes |
| `b` | FB, MET, ORCH, SEAL1 | `seal_fernbrook` | no |
| `b'` | FB, MET, ORCH | none | no |
| `c` | FB, MET, PICK_K, PATH_K, ORCH, SEAL1, `story.heights_done: true` | `seal_fernbrook` | yes |
| `p` | FB, MET | none | no |
| `n` | none (the starter flags only) | none | no |

The starter flags (every kind): `story.intro_seen`, `story.starter_received`, `story.starter_line: 'ember'`,
`story.tutorial_done`. Starter settings: `controls: 'modern'`, `textSpeed: 'fast'`, `music: false`, `musicVol: 0`,
`follower: true`, `battleAnims: true`. World: `hearthmoor` 8,8. Party: one `ember`, id `petsmoke1`.

The Glimmer cuts `a1_glimmer` and `c_glimmer` (same file, lines 24 and 26) are used only in §6. They are `a1` and `c` with
PICK_G (`story.side: 'glimmer'`) and PATH_G (`story.heights_path: 'lab'`) in place of PICK_K and PATH_K; `c_glimmer`'s
seals are `{ seal_glim_1: true }` (the tag, no `seal_fernbrook`).

**Real old saves.** The gate seeds every kind as a real old save: no `story.ilse_call_old` marker, so a picked kind (`a1`,
`a2`, `c`, both Glimmer cuts) meets the ACT1_KEEPER_JOIN §9 old-save move at load (`game.js` 6753-6778, run at 20508), as a
playtester's save would. Do not use `installSave()` for the gate's seeding (§3.1 says why).

**Never a real save.** Every fixture is built in the spec from `starterSave()` and the flag sets named here. No file read from
outside `tests/`, no save pasted from a player, no export from a live device.

### 2.2 Widths, controls, motion

- Projects `320` (320x568, dsf 2) and `390` (390x844, dsf 3) from `playwright.config.js`. `375` is skipped (§1).
- Modern controls on every fixture (`starterSave()` already sets `controls: 'modern'`; the stage fixtures set it again, as
  their source specs do). No row opts into Arcade.
- `g1_load`: reduced motion `reduce` at 320 and `no-preference` at 390 (`test.use({ reducedMotion })` by project name), so
  both motion paths load every kind. `g2_walk` and `g3_harden`: `reduce` at both widths; each spec asserts
  `matchMedia('(prefers-reduced-motion: reduce)').matches` once after boot.

## 3. Hard checks on every case

### 3.1 Seeding (all three spec files)

One init script per test, added with `context.addInitScript(fn, raw)` before the first `page.goto`:

1. Only if `sessionStorage.getItem('pp_gate_seeded')` is empty: set it to `'1'`, then
   `localStorage.setItem('pixelpets.save.v2', raw)`, `localStorage.setItem('pixelpets.geo', 'deny')`,
   `localStorage.setItem('pixelpets.mute', '1')`. A reload in the same tab must read what the game stored, not the seed again
   (this is why `installSave()` is not used: it re-seeds on every navigation and adds `story.ilse_call_old`).
2. Every load: `window.ppGateWrites = []`, `window.ppAtBoot = undefined`, `window.ppSeedRaw = raw`.
3. Every load: define `window.PixelPets` with a getter and setter (`configurable: true`); the first set copies
   `localStorage.getItem('pixelpets.save.v2')` into `window.ppAtBoot`. The game sets `window.PixelPets` last in boot, after
   the load, the old-save move and the load-time saves.
4. Every load: wrap `Storage.prototype.setItem`; for the key `pixelpets.save.v2` push
   `{ booted: window.ppAtBoot !== undefined, t: performance.now(), raw: v }`.

`raw` is made in Node: build the fixture, set `s.last = Date.now()`, stamp `s.flags['daily.hello']` and
`s.flags['daily.warm_bowl']` to today's local date `YYYY-MM-DD` (the format `installSave`'s `quietDay` writes), then
`JSON.stringify(s)`. The **before copy** is `JSON.parse(raw)`: a deep copy taken before the page opens.

URLs: `./` for `g1_load` (no debug), `./?debug=1` for `g2_walk` and `g3_harden`, `./?debug=1&hccity=2` only for the Cabinet
row. No `?cloud=` parameter anywhere. Boot wait: `gotoGame()`'s `window.PixelPets && window.BUILD`, then
`window.ppAtBoot !== undefined`; under `?debug=1` also `PixelPets.debug === true && PixelPets.state`.

### 3.2 Settle

After boot: wait (timeout 10 s) until `ppGateWrites.filter(w => w.booted).length` reaches 1 for `b`, `b'`, `p`, `n` and 2
for a picked kind (the tip write of §3.3, then the autosave). The last of those is the 5 s autosave (`saveTimer`, `game.js`
20545). Then `window.dispatchEvent(new Event('pagehide'))` (the game saves on pagehide, `game.js` 20168) and read
`localStorage.getItem('pixelpets.save.v2')`: the **stored copy**. Measured at both widths: the autosave lands 5.0 s after the
`window.PixelPets` set; the tip write 0.26-0.65 s after it.

### 3.3 No flag or save field written at load (PG-4 to PG-7)

**Before boot (`booted: false` writes).** `b`, `b'`, `p`, `n`: none, and `ppAtBoot === ppSeedRaw` byte for byte. `a1`, `a2`,
`c`: exactly one, the old-save move. Parsed, it adds only paths named in the first table below (values may still differ
there: `board.lastTown` is `""` in this write) plus the first six flags of the second table, and changes no seeded value
except `last` and the care fade.

**After boot, before the autosave.** `b`, `b'`, `p`, `n`: none. `a1`, `a2`, `c`: exactly one (the "sides" tip card's first
show, `unlockOpen`, `game.js` 3253-3261), adding only `story.unlock_sides: true`.

**Stored copy against the before copy.** Diff every path (objects by key, arrays by position, `JSON.stringify` for leaves).
The test fails on any removed key, any changed type, any changed value and any added key except exactly these:

| Path | Allowed | Value on this build |
| --- | --- | --- |
| `v` | must stay `2` | `2` |
| `last` | changed, a number not below the seed's | (time) |
| `party[i].hunger`, `.happy`, `.energy` | changed, a number, `<=` seed and `>=` seed − 1 | care fade |
| `party[i].met` | added | `1700000000000` |
| `party[i].bx` | added | `64` |
| `party[i].moves` | added | `["foxfire_flick","flick_flame","stoke_up"]` |
| `party[i].evoMoves` | added | `[]` |
| `player.look.accessory` | added | `"none"` |
| `settings.effects` | added | `"full"` |
| `settings.joystick` | added | `false` |
| `settings.mapZoom` | added | `2` |
| `settings.tips` | added | `true` |
| `settings.showOthers` | added | `"on"` |
| `steps` | added | `0` |
| `standing` | added | `{"keepers":0,"glimmer":0}` |
| `board` | added | `{"lastTown":"hearthmoor"}` |
| `phoneBook` | added | `{"met":{},"fav":{}}` |
| `rep` | added | `{}` |
| `repJoins` | added | `0` |
| `ui` | added | `{}` |
| `eggs` | added | `{"incubators":[{"egg":null}],"held":[]}` |
| `debugSave` | added | `false` in `g1_load`; `true` under `?debug=1` |
| `mapSeen` | added | `{"hearthmoor":1}` |
| `meta` | added | `{"migratedFrom":null,"migratedAt":null,"backup":null,"legacy":{}}` |

Picked kinds only (`a1`, `a2`, `c`), added flags (`story.side` stays `'keepers'`):

| Flag | Value |
| --- | --- |
| `story.keeper_cadet` | `true` |
| `story.orchard_lean` | `'open'` |
| `story.fen_lean` | `1` |
| `story.sway_fernbrook` | `3` |
| `story.cover_done` | `true` |
| `story.ilse_call_old` | `true` |
| `story.unlock_sides` | `true` |

`b`, `b'`, `p`, `n` gain no flag at all: no `story.sway_*`, no `story.unlock_*`, no `daily.*`. A `daily.*` stamp is part of the
seed (§3.1) and must come back unchanged.

The table values are pinned: if a later build changes a default, the gate fails and the PR that changed it updates this list
in the same PR, with a line in its CHANGELOG entry. Do not widen the list with a wildcard.

**Reload (every kind).** After the settle, `page.reload()` in the same tab (the seed does not run again). Then: zero
`booted: false` writes; `ppAtBoot` equals the stored copy from before the reload except `last` and the care fade; no
`booted: true` write in the first 4 s (the tip is not shown twice); for picked kinds the seven flags above unchanged and the
old-save toast absent from `PixelPets.toasts` 4 s after boot (read it in a `?debug=1` reload in `g2_walk`, §5.1). Measured on
`a1`, `b`, `c` and `n`: no write before boot and none in the first 4 s on the second load.

### 3.4 Errors and network (PG-8, PG-3)

- `page.on('console')` type `error` and `page.on('pageerror')` collect into one list; `afterEach` expects it to equal `[]`
  (as `trackErrors` in `tests/helpers.js`). **No allowlist.** The probe saw zero on every row at both widths, including the
  splice, the preview and the switch; if a build needs one, that is a finding for the PR, not a gate edit.
- `page.on('request')` collects every URL; `afterEach` expects none to match
  `/gstatic\.com\/firebasejs|googleapis\.com|firebaseio\.com|firebaseapp\.com/`. `cloud.js` keeps the cloud off for an
  automated browser (`navigator.webdriver`), so the suite never signs in or writes to `walklings-4cc89`. One `g1_load` row
  per width also expects `page.evaluate(() => PPCloud.info().enabled)` to be `false`.

## 4. Stage fixtures (for the steps none of the seven kinds can reach)

None of the seven kinds can reach Kilnmouth or the Cabinet, and four of them cannot reach the Keeper join (§5.1). The walk
steps run on these synthetic fixtures, copied verbatim from the named lines, seeded by §3.1 (not `installSave`), with the
§3.3 diff rule replaced by each step's own save assertions. Each fixture also gets `daily.hello` and `daily.warm_bowl`
stamped as in §3.1.

| Id | Source (copy these lines) | Flags | World | Seals and extras |
| --- | --- | --- | --- | --- |
| SF-JOIN | `tests/act1_keeper_join.spec.js` 14-36 (`AFTER_NIGHT`, `joinSave`) | `AFTER_NIGHT` | `fb_lantern_in` 5,13 facing down, respawn `fernbrook` | `seal_fernbrook: 1700000000000`; standing 0/0; party xp 4000; money 40 |
| SF-KM | `tests/kilnmouth_seat.spec.js` 37-56 and `save()` 63-72 | `MET` (line 56) | `km_road` 27,2 facing up | the three town Seals at 1700000000000; follower off; tips off; xp 4000; bx 3136 |
| SF-CAB-OPEN | `tests/cabinet.spec.js` 31-59 and `save()` 62-72 | `SEAT` (line 59) | `hearthmoor` 11,7 | `seal_fernbrook`, `seal_cobblecrest`, `seal_brinewick`, `seal_glim_1` at 1700000000000; `standing: { keepers: 10, glimmer: 0 }` |
| SF-CAB-DENY | same | `A2` (line 53) | same | same |
| SF-E6(f, k) | `tests/kilnmouth_seat.spec.js` 37-61 and `save()` 63-72 | `SEATED` + `story.act: 3`, `story.km_seat_pick: 'town'`, `story.km_permit_to: 'warden'`, `story.km_council: true`, `story.km_settled: true`, `story.km_lease: 'ended'`, `story.km_springs: 'warm'`, `story.km_hall_lit: true`, `story.sway_fernbrook: f`, `story.sway_kilnmouth: k` (a `null` deletes the key, as the source `save()` does) | `kilnmouth` 27,37 facing up | as SF-KM |

SF-JOIN: `data/detail_zz_weir_hut.json` exists on this build, so no stand-in room is needed; if the builder's base lacks it,
copy `hutStandIn()` and its `withOverlay` call from `act1_keeper_join.spec.js` 39-53.

Scenes are played with the `drive(page, picks)` loop of `act1_keeper_join.spec.js` 74-104 (copied into `gate_lib.js`):
it waits for a full line before tapping, so it is safe at 320 under load.

## 5. The walk, per save kind (`g2_walk.spec.js`)

### 5.0 Per-kind reads at load (every kind, both widths)

Boot under `?debug=1`, then `PixelPets.showTab('walk')`; wait until `PixelPets.toasts` holds the old-save toast (picked kinds,
timeout 6 s; it shows 3.2 s after boot) or 4000 ms (others). Then read and expect:

| Kind | `quest.id` | `mapHold('fernbrook')` | `holdLine('fernbrook')` | `sway('fernbrook')` | `hasSeal('seal_fernbrook')` | `sealsHeld()` | Old-save toast |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `a1` | `heights` | `keepers` | The Keepers hold the town now. The orchard stays rooted. | 3 | false | 0 | yes |
| `a2` | `heights` | `keepers` | (as `a1`) | 3 | false | 0 | yes |
| `b` | `teaser` | `split` | Keepers keep the town. Glimmerwell keeps a stand. | 0 | true | 1 | no |
| `b'` | `hall1_holders` | `split` | (as `b`) | 0 | false | 0 | no |
| `c` | `teaser` | `keepers` | (as `a1`) | 3 | true | 1 | yes |
| `p` | `crates` | `split` | (as `b`) | 0 | false | 0 | no |
| `n` | `rival1` | `split` | (as `b`) | 0 | false | 0 | no |

The old-save toast is exactly `You're a Keeper Cadet now. See Ilse.` For every kind also: `PixelPets.act === 1`;
`PixelPets.scene === null`; `PixelPets.mapInfo.id === 'hearthmoor'`; `questCheck` and `glimmerCheck` both `[]`;
`townFaction('fernbrook') === 'keepers'`, `townFaction('cobblecrest') === 'keepers'`, `townFaction('kilnmouth') === null`;
`mapHold('kilnmouth') === 'split'`, `holdLine('kilnmouth') === 'Both sides keep a claim.'`, `sway('kilnmouth') === 0`.

`b` reads `split` and `a1`/`a2` read `keepers` on a real old save. `tests/day1_save_kinds.spec.js` reads `split` for `a1`
and `a2` because its fixtures carry the `story.ilse_call_old` marker (no move). Both are right for their seeds; see Q1.

### 5.1 W1: the Act 1 Keeper join

| Kind | What runs | Why |
| --- | --- | --- |
| `a1`, `a2`, `c` | the old-save move (§3.3 keys, the §5.0 toast, no scene); then `page.reload()` in the same tab, wait 4000 ms: `PixelPets.toasts` does not contain the toast, `PixelPets.scene === null`, the seven flags unchanged | a save that picked a side joins at load, once (ACT1_KEEPER_JOIN §9, `game.js` 6753-6778) |
| `b`, `b'` | skip | no join beat is reachable on this build: `fb_side_pick` needs `!story.orchard_cleared`, and the `ilse_call` quest row needs `story.post_trial_done` and `story.crackdown`, which neither kind has. See Q2. |
| `p`, `n` | skip | before the Hall 1 trial; the join comes after `story.post_trial_done` |

Stage fixture SF-JOIN (the first two beats of `act1_keeper_join.spec.js` T1):

1. Boot under `?debug=1`; `showTab('walk')`. Expect `quest.id === 'ilse_call'` and
   `gateRead('fernbrook', 'fb_east').whenOk === false`.
2. `goto('fernbrook', 5, 6, 'down')`, wait for `mapInfo.id === 'fernbrook' && !fading`; `walkStep('down')`; wait 380 ms.
   Expect `scene.id === 'ilse_call'`.
3. `drive(page, ['Answer'])`. Expect `story.warden_called === true` and `quest.id === 'warden_summons'`.
4. `goto('hm_lodge_in', 5, 5, 'down')`; `talkTo('ilse_lodge_after') === true`; `scene.id === 'warden_meet'`; `drive(page)`.
5. Expect `story.warden_met === true`, `story.side_pick_done` undefined, `quest.id === 'chi_meet'`,
   `quest.target` deep-equals `{ map: 'route2_glen', x: 22, y: 4 }`, `gateRead('fernbrook', 'fb_east').open === true`.
6. Stored copy: `v === 2`, every key of the before copy's `flags` still present, `story.warden_called` and
   `story.warden_met` stored `true`.

Measured: 7.3 s at 390.

### 5.2 W2: one town changes hands

The seven kinds stay in Act 1 and cannot change a town's hands: the only switch is Act 3 (`standing.js` 60-62, `openAct: 3`),
and Fernbrook's `townFaction` is fixed `'keepers'` whatever its hold (`factionOfMap`, `game.js` 7446-7458; see Q3). Their
step is the §5.0 reading. They skip the flip.

Stage row on SF-E6(`null`, 2) (one town only, Kilnmouth):

1. Boot under `?debug=1`. Expect `mapHold('kilnmouth') === 'keepers'`, `townFaction('kilnmouth') === 'keepers'`,
   `holdLine('kilnmouth') === 'Kilnmouth sits its own seat. The Keepers walk its lanes.'`.
2. `PixelPets.switchSide('glimmer', true)` returns `true` (the debug free switch, as `kilnmouth_seat.spec.js` K-T6).
3. Expect `sway('kilnmouth') === 0`, `mapHold('kilnmouth') === 'split'`, `townFaction('kilnmouth') === null`,
   `holdLine('kilnmouth') === 'Kilnmouth sits its seat. Both sides wait at the springs.'`, `story.switched_a3 === true`,
   `PixelPets.side === 'glimmer'`, no `story.sway_fernbrook` key in `PixelPets.state.flags`.
4. Stored copy: `v === 2`, `flags['story.sway_kilnmouth'] === 0`, no `story.sway_fernbrook` key.

### 5.3 W3: Kilnmouth arrival

The seven kinds skip: Route 4 east bars until `story.km_assigned` (Act 2, after the Governor's posting). Their check: after
the §3.2 settle, no stored flag key starts with `story.km_` and `story.reached_kilnmouth` is absent; stored `mapSeen` has no
`kilnmouth` or `km_road` key.

Stage row on SF-KM (frozen clock):

1. Boot under `?debug=1`. `const c = await page.evaluate(() => { PixelPets.clock.set('tue', 10, 0); return PixelPets.clock.freeze(true); })`.
   Expect `c.day === 'tue'`, `c.hh === 10`. (The offset lives in `localStorage` `pixelpets.clockDebug`, not in the save.)
2. `showTab('walk')`, `clearWild()`, `goto('km_road', 27, 1, 'up')`, wait for `mapInfo.id === 'km_road' && !fading`,
   `clearWild()`, `walkStep('up')`; wait (timeout 10 s) for `mapInfo.id === 'kilnmouth' && !fading`.
3. Expect `state.world` map `kilnmouth`, x 27, y 38, facing `up`; `story.reached_kilnmouth === true`; `story.km_visits === 1`;
   `story.km_visit_day === (c.week - 1) * 7 + 1` (Tuesday is day 1 of the game week; measured 582 in week 84);
   `quest.id === 'km_reeve'`; `mapHold('kilnmouth') === 'split'`; `townFaction('kilnmouth') === null`;
   `holdLine('kilnmouth') === 'Both sides keep a claim.'`; `scene === null`.
4. Stored copy (the arrival saves at once, `kmArrive`, `game.js` 13220): `v === 2`, `story.reached_kilnmouth === true`,
   `story.km_visits === 1`.

Measured: 0.7 s.

### 5.4 W4: the Cabinet stair (#332)

The stair is tested in `tests/cabinet.spec.js` C-T2 (lines 172-195); `kilnmouth_seat.spec.js` does not walk it. The Cabinet
floors exist only in the city preview (`?debug=1&hccity=2`; `HC_CITY_V2 = false`, `game.js` 92 and 104), and in that preview
`save()` never writes (`previewActive()`, `game.js` 400-413; toast `City preview: not saved`). So this step proves the stair
and proves the preview leaves a real save alone.

The seven kinds skip (Act 1; the stair needs Act 2, `story.thr_chip_rumour` and the parade). Their check, in the §5.0 boot:
`PixelPets.goto('hc_gov_1', 2, 2, 'left') === false` (no Cabinet without the preview).

Stage row on SF-CAB-OPEN, URL `./?debug=1&hccity=2`, fresh context (the preview choice sticks in `sessionStorage`
`pixelpets.hccity`):

1. Boot; `rawBefore = localStorage.getItem('pixelpets.save.v2')`; `showTab('walk')`; `clearWild()`.
2. `goto('hc_gov_1', 2, 2, 'down')`; `talkTo('hc_gov_keeper_b') === true`; `drive(page)`; the first line said is
   `Go on up, holder.`
3. `goto('hc_gov_1', 2, 2, 'left')`; `walkStep('left')`; poll `state.world` to `{ map: 'hc_gov_2', x: 1, y: 3 }`.
   Expect `quest.id === 'cab_seat'`, `townFaction('hc_gov_2') === 'keepers'`.
4. Dispatch `pagehide`, wait 5500 ms (one autosave tick). Expect `localStorage.getItem('pixelpets.save.v2') === rawBefore`
   and `PixelPets.toasts` to contain `City preview: not saved`.

Stage row on SF-CAB-DENY, same URL: steps 1-2 with the first line not `Go on up, holder.`; then step 3's walk opens a scene
whose only line is `Cabinet in session. Members only.` and `state.world` stays `{ map: 'hc_gov_1', x: 2, y: 2 }`; step 4
the same.

Measured: 6.7 s (open, with the 5.5 s wait).

## 6. Hardening (`g3_harden.spec.js`)

### 6.1 Two towns flipping at the same moment (E6)

`switchSide` moves every `story.sway_*` key the save holds by `swayShift` (-2), clamped to -3..3, and creates none
(`game.js` 4441-4471, ACT1_KEEPER_JOIN §8 E6). One test per row on SF-E6(f, k): boot under `?debug=1`, read, call
`PixelPets.switchSide('glimmer', true)` (expect `true`), read again, then read the stored copy.

| f, k before | f, k after | Fernbrook hold | Kilnmouth hold | `townFaction('kilnmouth')` |
| --- | --- | --- | --- | --- |
| 3, 2 | 1, 0 | `keepers` -> `split` | `keepers` -> `split` | `keepers` -> `null` |
| 2, -1 | 0, -3 | `keepers` -> `split` | `split` -> `glimmer` | `null` -> `glimmer` |
| -2, -3 | -3, -3 | `glimmer` -> `glimmer` | `glimmer` -> `glimmer` | `glimmer` -> `glimmer` |
| 3, 3 | 1, 1 | `keepers` -> `split` | `keepers` -> `split` | `keepers` -> `null` |
| 1, absent | -1, absent | `split` -> `split` | `split` -> `split` | `null` -> `null` |
| absent, 2 | absent, 0 | `split` -> `split` | `keepers` -> `split` | `keepers` -> `null` |
| absent, absent | absent, absent | `split` -> `split` | `split` -> `split` | `null` -> `null` |

Hold lines (exact): Fernbrook (a Cadet's) `keepers` = `The Keepers hold the town now. The orchard stays rooted.`,
`split` = `Keepers walk the lanes. Glimmerwell keeps the gate.`, `glimmer` = `Glimmerwell holds the town now. Lanterns on
every gate.` Kilnmouth (after the council) `keepers` = `Kilnmouth sits its own seat. The Keepers walk its lanes.`, `split` =
`Kilnmouth sits its seat. Both sides wait at the springs.`, `glimmer` = `Glimmerwell holds the town. The water's warm
again.`

Every row also: `townFaction('fernbrook') === 'keepers'` before and after (Q3); `PixelPets.act === 3`;
`story.switched_a3` absent before, `true` after; `PixelPets.side` `keepers` -> `glimmer`; the set of `story.sway_*` keys
identical before and after; stored `v === 2` and the stored sway values equal the "after" column.

### 6.2 Sway on old saves

| Save | Expect after load (debug reads, then the §3.2 stored copy) |
| --- | --- |
| `b`, `b'`, `p`, `n` (no `story.sway_*`, never picked) | no `story.sway_*` key; `sway('fernbrook') === 0`; hold `split`. After `switchSide('glimmer', true)`: still no `story.sway_*` key, hold `split`. |
| `a1`, `a2`, `c` (picked Keepers) | `story.sway_fernbrook === 3` written once by the move; hold `keepers` |
| `a1_glimmer` (picked Glimmerwell, no Seal) | the move writes `story.side: 'keepers'`, `story.keeper_cadet: true`, `story.orchard_lean: 'pack'`, `story.fen_lean: -1`, `story.sway_fernbrook: -2`, `story.cover_done: true`, `story.ilse_call_old: true`; `quest.id === 'heights'`; hold `glimmer`; `hasSeal('seal_fernbrook') === false`, `sealsHeld() === 0` |
| `c_glimmer` (picked Glimmerwell, tag Seal) | the same seven writes; `quest.id === 'teaser'`; hold `glimmer`; `hasSeal('seal_fernbrook') === true`, `sealsHeld() === 1` |
| SF-E6(`null`, `null`) (Act 3 Cadet, no sway keys) | `sway('fernbrook') === 0`, `sway('kilnmouth') === 0`, both holds `split`; after the switch no `story.sway_*` key exists |

For the two Glimmer cuts, one clean (no `?debug=1`) load-and-settle row each: the §3.3 rule applies with these values in place
of the Keeper ones, plus `story.unlock_sides: true`; `story.side` is the one allowed changed value (`'glimmer'` -> `'keepers'`,
by assignment: `story.switches` stays absent); `bag` gains no `cracked_phone`; `seals` unchanged. Measured: exactly that
diff, one write before boot, the tip write and the autosave after it, and a clean reload.

### 6.3 The SEALS kill switch, false path

`SEALS_BOTH_PATHS` is a `const` (`game.js` 780) with **no override hook** (no URL flag, no `PixelPets` setter, no
`localStorage` key). It is read at `game.js` 782-783 (`hasSeal`, `sealsHeld`), 8122 (quest state), 10283 (the Seal scene
step), 17077 (the Seal card cord tier) and 20274 (the cloud summary), and passed as `both` to `standing.js` `hasSealIn` /
`sealsHeldIn` and to `quests.js` `evalCond` (598-599, `st.both !== false`).

The gate runs the false path with **no game change**, by a served-copy splice in the test, the pattern already used by
`tests/intro_cutscene.spec.js` 55-63:

```js
await page.route('**/game.js*', async (route) => {
  const res = await route.fetch();
  const body = await res.text();
  const hits = body.split('const SEALS_BOTH_PATHS = true;').length - 1;
  if (hits !== 1) throw new Error('SEALS_BOTH_PATHS splice: expected 1 match, got ' + hits);
  await route.fulfill({ status: 200, body: body.replace('const SEALS_BOTH_PATHS = true;', 'const SEALS_BOTH_PATHS = false;'),
    headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } });
});
```

The thrown error must fail the test (a renamed or re-worded line is a gate failure, not a silent pass). A debug-gated hook in
the game would be the cleaner way; it is not built and is not invented here (Q4).

Rows (one test per kind; each boots once with the switch on and once off, in fresh contexts, under `?debug=1`):

| Kind | `readGates` diff, on vs off | `hasSeal('seal_fernbrook')` on / off | `sealsHeld()` on / off | `quest.id` on / off |
| --- | --- | --- | --- | --- |
| `a1`, `a2`, `b'`, `p`, `n`, `a1_glimmer` | none | false / false | 0 / 0 | unchanged |
| `b`, `c` | none | true / true | 1 / 1 | unchanged |
| `c_glimmer` | exactly `fernbrook:rook_fb` and `fernbrook:fb_teaser`, `true` -> `false` | true / false | 1 / 1 | `teaser` / `teaser` |

`readGates` is `or_gate_kinds.js`'s, called as `page.evaluate(readGates, { objs: OBJ_GATES, slips: BOARD_SLIPS, tells: TELLS })`.

What must still work with the switch false, checked on `c_glimmer` and `n` in `g3_harden` without `?debug=1` (one test each):
the boot, the §3.3 write rules (with §6.2's values for `c_glimmer`), the §3.2 settle, zero console and page errors, and
`questCheck`/`glimmerCheck` empty (read in the debug rows above). The `c_glimmer` dead end (quest `teaser` with its two
objects gone) is recorded, not failed: it is Q5.

Measured: about 0.5 s per boot.

## 7. Manual only (QA, not automated)

Playwright cannot see a real iPhone's frame rate or its audio unlock (`tests/README.md`, "What this is not"). QA runs these on
every gate build that touches Kilnmouth, scenes, music or rendering, and on the first build handed to playtesters.

**Setup.** On the desktop: `npm run iphone -- --lan`; it prints the address to type in Safari. iPhone SE (2nd or 3rd
generation) with Display Zoom set to Zoomed (Settings > Display & Brightness > Display Zoom), which gives a 320-wide page;
check with Safari Web Inspector (Mac: Develop > the iPhone > the page) by typing `innerWidth` in the console: `320`. Ring
switch off silent, volume up, Low Power Mode off. Use a Safari Private tab, so no holder's own save on the phone is
touched. Load a stage save: on the desktop `node tests/playtest_gate/manual_saves.js <id>` prints the save JSON; in the
iPhone page's Web Inspector console run `PixelPets.importSave(<that JSON as a string>)`, which replaces the tab's game with it
and reloads.

**M1. Frame rate at 320 on Kilnmouth.** Fixtures: SF-KM, and the `IN_TOWN`, `STORMED`, `CURFEW` and `MORNING` states of
`tests/kilnmouth.spec.js` 42-46 (the builder adds them to `manual_saves.js` as `km_in_town`, `km_stormed`, `km_curfew`,
`km_morning`, world `kilnmouth` 27,37). For each: open `?debug=1`, Web Inspector > Timelines, enable Rendering Frames and
JavaScript & Events, record 20 s while walking a loop of the plaza (10 taps across the map and back), stop.
- Skins, sky and overlays: each state shows its own look (storm, curfew, morning) with no flicker or missing tiles.
- Walk-beside: on `km_road` (SF-KM), stand still within two tiles of a wild for 3 s until `It walks beside you a while.`,
  then walk 12 steps; record the same 20 s.
- Pass line (proposed default, Q6): median frame <= 16.7 ms, no more than 5 % of frames over 33 ms, no frame over 100 ms.
  Write each state's three numbers into the QA run note with the build id.

**M2. Scene music after the first tap.** Settings: Music ON, volume above 0 (the stage fixtures have Music off; turn it on
in Settings, which is itself a tap, then reload once and do not touch the screen).
1. Fresh load of `?debug=1`, no touch. In the console:
   `PixelPets.runSteps([['music','ledger'],['say','Warden Ilse','Sit, Cadet.'],['say','Warden Ilse','Good work.']])`.
2. Expect silence, `PPSound.musicWant === 'ledger'`, `PPSound.musicTrack === null`.
3. Tap the dialog box once. Expect the loop audible within 1 s and `PPSound.musicTrack === 'ledger'`.

**M3. Scene music after a reload.** Right after M2, press Safari's reload. Repeat M2 steps 1-3 exactly: silence until the
first tap, then `ledger` within 1 s. Then lock the phone for 10 s, unlock, tap once: the loop comes back within 1 s.

Record pass or fail for M1-M3 with the build id from Settings' Build line.

## 8. Runtime budget

Measured on this build (Chromium, the Linux cloud VM): boot 0.4-0.6 s; one load-and-settle row 7.5 s; one debug read row 1.5-4.5
s; pp_test's own steps (scans, build check, RTDB rules test) about 10 s. Playwright runs one file per worker at a time (no
`fullyParallel`), `workers: 2`.

| File | Rows per width | Estimate per width |
| --- | --- | --- |
| `g1_load` | 7 kinds load, settle and reload (about 10.5 s each), 1 cloud-off check | 75 s |
| `g2_walk` | 7 kinds read (3 with a reload), SF-JOIN, W2, SF-KM, SF-CAB open and deny, the PG-18 row | 55 s |
| `g3_harden` | 7 E6 rows, 5 old-sway rows (2 with a settle), 9 SEALS rows (two boots each), 2 switch-off settles | 65 s |

About 390 s of work across six file-and-width jobs on two workers: about 3.3 min wall plus 10 s.

**Budget:** the `time=` on the `PP_TEST RESULT` line must be at most **240 s** for
`npm run test:agent -- tests/playtest_gate/ --project=320 --project=390`, with `failed=0` and `flaky=0` (a retry pass does
not count as a pass for the gate).

**If over 240 s, split in this order:** (1) move the SEALS rows out of `g3_harden` into `g4_seals.spec.js` so three workers'
worth of files balance; (2) run the gate as two commands, one per `--project`, each with its own budget of 150 s; (3) report
it in the PR. Never shorten the settle below the first autosave, never drop a kind or a width, and never tag gate rows
`@slow`.

## 9. Acceptance lines (for the builder's spec-match table)

- **PG-1** The suite is `tests/playtest_gate/` with the files of §1; it runs at 320 and 390, skips 375 with the §1 reason,
  and has no `@slow` or `@w1` row.
- **PG-2** Every fixture is synthetic: `starterSave()` plus the flag sets of §2.1 and §4, copied from the named lines. No
  real player save is read anywhere.
- **PG-3** Seeding follows §3.1 (once per tab, before copy = the seeded string, `geo` deny, `mute` 1, no `?cloud=`); no
  request to a Firebase host; `PPCloud.info().enabled === false`.
- **PG-4** All seven kinds boot at both widths with `window.PixelPets` set and the save still under `pixelpets.save.v2`,
  `v === 2`.
- **PG-5** Writes before boot: none for `b`, `b'`, `p`, `n` (`ppAtBoot` identical to the seed); exactly one (the move) for
  `a1`, `a2`, `c`. Writes after boot and before the autosave: none for the four, one (`story.unlock_sides`) for the three.
- **PG-6** After the §3.2 settle, the stored copy differs from the before copy only by the §3.3 table (and, for picked
  kinds, the seven flags); no key removed, no type changed, no other value changed, no other key added.
- **PG-7** A reload after the settle writes nothing before boot, does not run the move again and does not show its toast.
- **PG-8** Zero console errors and zero page errors in every row, with no allowlist.
- **PG-9** The §5.0 reads hold for every kind at both widths (quest, both towns' holds and lines, sway, `townFaction`,
  Seals, act, scene, map, `questCheck`, `glimmerCheck`, the toast).
- **PG-10** W1: the picked kinds' move matches §5.1; SF-JOIN plays `ilse_call` and `warden_meet` to `chi_meet` with
  `fb_east` open and the save kept additive.
- **PG-11** W2: on SF-E6(`null`, 2) the switch turns Kilnmouth from `keepers` to `split` with the §5.2 values and stored
  `story.sway_kilnmouth === 0`.
- **PG-12** W3: SF-KM's frozen-clock arrival writes `story.reached_kilnmouth`, `story.km_visits` 1 and the computed
  `story.km_visit_day`, at 27,38; the seven kinds carry no `story.km_*` key and no Kilnmouth `mapSeen` key.
- **PG-13** W4: in the `hccity=2` preview SF-CAB-OPEN climbs to `hc_gov_2` 1,3 and SF-CAB-DENY gets
  `Cabinet in session. Members only.`; the stored save is byte-identical before and after both walks; without the preview
  `goto('hc_gov_1', ...)` is `false`.
- **PG-14** E6: all seven rows of §6.1 match, including absent keys staying absent.
- **PG-15** Old-save sway: the §6.2 rows match, including both Glimmer cuts' seven move values and the §3.3 rule with
  `story.side` as the only changed value.
- **PG-16** SEALS false: the splice matches exactly once or fails; the §6.3 table matches; `c_glimmer` and `n` load and
  settle clean with the switch off.
- **PG-17** `npm run test:agent -- tests/playtest_gate/ --project=320 --project=390` reports `failed=0`, `flaky=0` and
  `time=` at most 240 s, or the PR shows the §8 split.
- **PG-18** `manual_saves.js` prints each of `sf_km`, `km_in_town`, `km_stormed`, `km_curfew`, `km_morning` as save JSON
  that the game accepts: one `g2_walk` row requires the module, and for each id
  `page.evaluate(t => PPSave.readCopy(t).ok, json)` is `true` (`PixelPets.importSave` is not called, so nothing reloads).
- **PG-19** `tests/README.md` has the gate's row; the builder's PR carries a spec-match table naming the test for each PG
  line, and its own CHANGELOG entry. M1-M3 are listed in the PR as manual, not run by the suite.

## 10. Open questions (no D or Q ids reserved; the Chief of Staff routes them)

- **Q1. A Keeper pick with no Seal flips Fernbrook at load.** The move writes `story.sway_fernbrook: 3` for any Keeper pick
  (`game.js` 6766, comment "D1545 A: the town stays as it was"). That keeps the town as it was only for a save with
  `story.seal1`: `c` reads `keepers` before and after. For `a1` and `a2` (picked, no Seal) the town read `split` before the
  move and reads `keepers` after it, so a playtester's Fernbrook changes hands on the first load; `a1_glimmer` goes `split` ->
  `glimmer`. Intended? Default: the gate asserts the build as it is (`keepers`, `glimmer`) and the question goes to Story.
  Yellow.
- **Q2. `b` and `b'` have no way to join.** Both have `story.orchard_cleared` and no `story.crackdown`, so neither
  `fb_side_pick` nor the `ilse_call` row can start; they never become Cadets on this build. Is that a softlock for real saves
  of that kind, or is a later beat meant to reach them? Default: the gate skips W1 for them with this reason. Yellow.
- **Q3. Fernbrook's `townFaction` never changes.** `factionOfMap` returns `'keepers'` for `fernbrook` whatever its hold, so
  only Kilnmouth (and Cobblecrest via `story.quarry_bought`) changes `townFaction`. If a Glimmer-held Fernbrook should read
  `glimmer` there, that is a game change. Default: the gate asserts `'keepers'`. Yellow.
- **Q4. No override hook for `SEALS_BOTH_PATHS`.** The gate uses a test-side splice of the served `game.js` (§6.3). The
  minimal alternative is a debug-only override (inert without `?debug=1`, per AGENTS.md rule 7); it is a game change, and its
  name and shape are for the engineer who builds it, not this packet. Default: the splice. Green if the splice is accepted;
  a hook needs its own clearance.
- **Q5. Switch false leaves `c_glimmer` at a dead end.** With `SEALS_BOTH_PATHS` false, a save holding only the
  `seal_glim_1` tag loses `rook_fb` and `fb_teaser` while its quest still points at `teaser`. Is that an accepted cost of the
  kill switch, or must the false path keep the read alias? Default: the gate records it, does not fail on it. Red if the
  answer changes how Seals read (core functionality).
- **Q6. The M1 pass line.** 16.7 ms median, 5 % over 33 ms, none over 100 ms is a proposed default from
  `gamedev-performance-optimization` (60 frames a second). Who signs it off, and does a 320 iPhone SE on Display Zoom stand in
  for a true 320 phone? Default: as written. Yellow.
- **Q7. "Run on every PR" has no runner.** There is no CI workflow. Default: the PR author runs §0's command and pastes the
  `PP_TEST RESULT` line; the Chief of Staff checks it before merging. A hosted CI run would be spending or a new service.
  Red if hosted.
- **Q8. The Cabinet stair spec.** The launch note pointed at `tests/kilnmouth_seat.spec.js`; the stair is walked in
  `tests/cabinet.spec.js` C-T2, which this packet uses. Default: as written. Green.
- **Q9. Two widths, not three.** AGENTS.md asks a feature spec for 320, 375 and 390. The gate is not a feature; the launch
  asked 320 and 390. Default: 375 skipped with a reason. Green.
- **Q10. Stage fixtures inside the gate.** None of the seven kinds reaches Kilnmouth or the Cabinet, so W3 and W4 run on
  copies of fixtures from `kilnmouth_seat.spec.js` and `cabinet.spec.js`. Keep them in the gate, or leave those walks to
  their own specs and keep only the seven kinds' negative checks? Default: keep them (about 15 s per width). Green.
- **Q11. Other save kinds.** The seven are the Act 1 kinds. Older shapes already have their own load specs (for example
  `tests/mahopac_dreams.spec.js`'s seven kinds, pre-D1167 to Act 5). Should the gate import those too? Default: not in v0.1.
  Yellow.

## 11. Sources read

`AGENTS.md`; `CLAUDE.md`; `tests/README.md` (How to run, iPhone emulation, the rows for the specs below); `tests/helpers.js`;
`tests/fixtures/or_gate_kinds.js`; `tests/day1_save_kinds.spec.js`; `tests/faction_or_gate.spec.js`;
`tests/act1_keeper_join.spec.js`; `tests/kilnmouth.spec.js`; `tests/kilnmouth_seat.spec.js`; `tests/cabinet.spec.js`;
`tests/seals_both_paths.spec.js`; `tests/intro_cutscene.spec.js` 40-80; `tests/scene_music_act2.spec.js`;
`tests/walk_beside.spec.js` header; `game.js` (ranges cited above); `standing.js`; `quests.js` 598-599; `clock.js`;
`cloud.js` header; `sfx.js` audio unlock; `playwright.config.js`; `tools/pp_test.js`; `tools/scans/`. Skills:
`gamedev-save-systems`, `gamedev-performance-optimization`, `gamedev-game-ui-ux`, `walklings-pr-handback`,
`walklings-wording-check`.
