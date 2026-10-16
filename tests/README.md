# Walklings smoke tests

Small browser checks so a later change can show the game still boots on a phone width. Players never load this folder. There is no GitHub Actions workflow yet: run the suite locally. A new spec also gets a row in this file, and the status docs follow `.cursor/skills/walklings-docs/SKILL.md`. The Oct 14 documentation audit added no spec. Recording the town-board calls the same day added no spec. TB-1 is covered by `tests/town_board.spec.js`. Scoping modern and arcade controls (Q26) added no spec. `tests/controls.spec.js` covers it: arcade on an old save, every modern button, switching both ways, and the joystick.

## How to run

From a clean clone, in the repo root:

```
npm install
npx playwright install chromium
npm test
```

`npm test` runs `python3 tools/bump_build.py --check` (must exit 0) and then Playwright. Chromium only, one width at a time, against a local static server (`python3 -m http.server`, port 8080). Set `PP_URL` to point at another origin instead, for example the live site:

```
PP_URL=https://arbiter1170.github.io/pixelpets/ npm test
```

When `PP_URL` is set, the config does not start a server. `PP_PORT` changes the local port.

Projects (CSS pixels, mobile Chromium: `isMobile`, `hasTouch`):

| Project | Viewport | deviceScaleFactor |
|---|---|---|
| 320 | 320×568 | 2 |
| 375 | 375×667 | 2 |
| 390 | 390×844 | 3 |

Screenshots are written to `test-results/screenshots/` (gitignored): the walk screen with the QUEST button (`walk-quest-<width>.png`), the open next-step panel (`quest-panel-<width>.png`), and from Build 2 the STANDING tab (`standing-tab-<width>.png`), the Pledge desk confirm step (`switch-confirm-<width>.png`), the quest panel with the designer copy on each side (`quest-panel-keepers-<width>.png`, `quest-panel-glimmer-<width>.png`) and the d-pad icons (`quest-icon-<width>.png`). Reference copies of the Build 2 set live in `screenshots/standing/`.

Shared helpers are in `tests/helpers.js`: `starterSave()` (the v2 seed used below), `installSave(page, save)`, `gotoGame(page, query)`, `trackErrors(test, expect)` (the console-error assertion), `boxesOverlap`, `shot(page, name)`, and `playScene(page, choices, onChoice)` (presses Space through plain lines and clicks `#sbChoices` buttons by label once `PixelPets.optionsReady` is true; returns the prompts it saw).

A console message of type `error`, or any uncaught page error, fails the test.

## What each check covers

`tests/smoke.spec.js`:

| Test | Brief check | What it asserts |
|---|---|---|
| boot, build stamp, and dev checks | a, b | Fresh context (empty localStorage). `window.BUILD` equals `version.json`'s `build`. `PixelPets` exists. The opening scene starts. `questCheck`, `glimmerCheck`, `befriendCheck()`, `standingCheck()`, `mapCheck()`, and `heightsCheck` return no problems. |
| befriend odds stay inside the tuning range | d (numbers) | `befriendOdds(3, 1)` and `befriendOdds(18, 0.25)` have `width` in 0.06–0.6. The quarry call is 0.181 (0.18 at 2 decimal places). Lv 16 and Lv 19 at 25% HP are recorded as 0.196 and 0.174. |
| quest button opens the next-step panel | c | A v2 save past the starter. `#questBtn` is the bottom-bar tab (the old Friends slot), at least 44 CSS px, inside the viewport, and it does not overlap the d-pad. A tap opens `#ovQuest`. The panel text equals `PixelPets.quest.text`. Escape closes it. CLOSE closes it after `PixelPets.optionsReady`. |
| befriend bar opens and BACK returns to the battle menu | d (bar) | `?debug=1`, `forceBattle('tide/0', 3)`. Waits until `PixelPets.battle.state` is `CHOOSE` and the menu panel is up (no fixed sleep). BEFRIEND opens the bar: the zone has a width and the marker has been drawn. BACK returns to the battle menu. |
| glimmer side swaps the orchard scene and restores keepers | e | `sceneFor('side_pick')` and `sceneFor('orchard')` resolve. `setSide('glimmer')` makes the orchard, Route 2 lead, Wickerglen clear, Cobblecrest arrival, Hale's trial, and the Brinewick hook resolve to their `@glimmer` ids. `setSide('keepers')` restores the base ids. |
| settings can save a copy, and cancel does not wipe the game | Build 7 | A seeded save. Settings shows Save a copy and Read a copy, and the build line is in the viewport. Save a copy downloads v2 JSON with the party and `story.side`. A short hold on START OVER, then Cancel, leaves the same `uid`, party, side, and `v`. |
| a minimal v2 save without faction or quest fields still loads as v2 | f | Seed is only `{v:2}`. After load, `PixelPets.side` is `keepers`. The save written back (the 5 s autosave; the seed had no `party`) still has `v: 2` and no `questSeen` or `story.side`. |

`tests/maps_b5.spec.js` (house interiors): the nine Hearthmoor, Keeper House and Cobblecrest rooms keep their size and old object ids, each floor and wall skin is different, the wall-shadow row sits under the windows, the floor cap stays at or under 70 percent, new props are reachable and say their line, exits still land on the old tiles, a save on a wall snaps to safe, and the lab bay's floor share is unchanged. Save `v` stays 2.

`tests/maps_b6.spec.js` (High Charity interiors): the fourteen rooms keep their size and old object ids, each floor and wall skin is different, the wall-shadow row sits under the windows, the floor cap stays at or under 70 percent, new props are reachable and say their line, exits and the mall stair still land on the old tiles, a save on a wall snaps to safe, and the lab bay's floor share is unchanged. Save `v` stays 2.
`tests/maps_b7.spec.js` (observatory and dreams): Breckenridge Observatory, the 2004 memory, the birthday room and the drive-through keep their size and old object ids. Each has its own floor and wall. The wall-shadow row sits under the windows. Star ticks, streamers and lane paint are walkable decals. The floor cap stays at or under 70 percent (the birthday room by decals, the others after variants). New props are reachable and say their line. The observatory door still leaves to Mahopac. A save standing on the new desk snaps to safe. The outdoor Mahopac map, the lab bay and a house floor are unchanged. Save `v` stays 2.

`tests/map.spec.js` (region map): the key lists towns, routes, side places, you, the next step, the side task, the coach, Keepers, Glimmerwell, both sides, wild, and Seals. Hearthmoor reads as Keepers. An unvisited Route 1 tap stays `???` and leaves the map open. Arrow keys change the reading and, if one is still held when the map closes, do not walk the keeper. With debug, `mapHold` follows the buyout and `story.sm_done`, High Charity's `townFaction` is `keepers`, Fernbrook's card says Glimmerwell, and an indoor card names the room. Screenshots: `region-map-home`, `region-map-claims`, `region-map-key`.

`tests/standing.spec.js` (Build 2; all with `?debug=1` and the starter save unless noted):

| Test | What it asserts |
|---|---|
| fresh save: both meters 0, tier 0, v stays 2; old save without standing loads the same | A v2 starter save with no `standing` key loads with `PixelPets.state.v` 2 and `state.standing` `{keepers: 0, glimmer: 0}`; `PixelPets.standing` reads points 0, tier 0 and the tier 0 name from `standingCfg()` on both sides, side `keepers`, 0 switches, `canSwitch` false; `standingCheck()` is empty. |
| a saved standing is clamped to the range; a non-object becomes 0/0 | `standing: {keepers: 250, glimmer: -5}` loads as `max` / `min`. In a second browser context `standing: 'x'` loads as 0/0. |
| thresholds and tier-up toasts come from the config, once per tier | `setStanding` at each threshold and one below it gives the tier the config says; the toast text is the tier's `toast`, shown once (a 0 to tier 2 jump shows only tier 2's toast). `['if', 'standing.keepers>=2', ...]` resolves on the live view. |
| side_pick Yes (keepers) grants once; a replay does not grant again | Playing `side_pick` and choosing Yes adds `grants.sp_pick` to keepers and sets `standing.got.sp_pick`. Running the scene again leaves the points unchanged. |
| switching halves the side you leave, counts, and is refused again until the next Seal | Keepers 30 / glimmer 12, pledged keepers. Juniper's Pledge desk shows the letter, then "Really? Keepers Standing 30 → 15" (screenshot). Yes: keepers 15, glimmer 12, side `glimmer`, `story.switches` 1, `sceneFor('orchard')` is `orchard@glimmer`, flags, seals, party and quest id unchanged. A second desk visit in the same chapter shows `switch.refused`. Setting `story.seal1` reopens it; `switchSide('keepers')` gives switches 2 and glimmer 6. |
| the desk is hidden before the side pick and unavailable in a battle; the Lantern panel offers it | Before `story.side_pick_done` Juniper's talk has no Pledge desk option and `pledgeDesk()` returns false. After the pick (keepers) Juniper offers it; pledged glimmer, Keeper Amos's Lantern panel lists "Pledge desk". In a battle `PixelPets.standing.canSwitch` is false and `pledgeDesk` returns false. |
| STANDING tab: hidden before the pick, two rows after it, 44 px tabs, no overflow | `#questTabs` hidden before the pick; after it both tabs are at least 44 px tall. The STANDING pane has two rows, the pledged row carries the PLEDGED marker, a 70%-wide bar at the mid-tier points, the emblem canvas has painted pixels, nothing overflows the viewport (screenshot). With both meters at 0 the empty line shows. |
| quest copy: every step shows the designer text on both sides; lengths and dev check hold | The chain table (26 rows, 10 glimmer overrides, including Heights, the Sacrifice line, and Rook's cart) is compared with `PixelPets.quest` text and place for each step on each side; text ≤ 110 and place ≤ 24 chars; `questCheck` is empty; the panel DOM matches (screenshots). |
| the quest icon is the delivered signpost and the other d-pad icons are unchanged | The painted `icon_quest`, `icon_map` and `icon_bag` canvases match the expected 8x8 grids pixel by pixel (screenshot). |

Seeded saves set `pixelpets.geo` to `deny` (so the location card does not cover Walk) and `pixelpets.mute` to `1`. They also stamp `daily.hello` and `daily.warm_bowl` for today so the boot toasts do not fire. The fresh-boot test does not seed a save. The minimal-save test seeds only `{v:2}`.

## Dev-check return shapes

All four mean "no failures" when the list is empty. Boot already `console.error`s a non-empty list, which fails these tests on its own.

- **`PixelPets.questCheck`** (getter, not a function). Returns the array from `PPQuests.devCheck(MAPDATA)` in `quests.js`: a list of problem strings. Empty array means every `story.*` flag the map data writes is a main-chain step, a side-chain step (`PPQuests.SIDE`), or on `NOT_STEPS`, ids are unique, objective text fits 110 characters, and the last main step can never be done.

`tests/mahopac.spec.js` covers the optional Mom / Mahopac dream: the look picker has 8 hair styles, 14 hair colours, 6 outfits and 5 accessories (old colour-only looks still migrate), the side objective shows under the main step, clearing Mom's table adds 4 bond, Mahopac's three people are frozen and there are no trainers, pushing the 2004 toy moves it and pops, and the balloon memory continues through Dad into waking upstairs. The north trail signs stand at (10, 1). Walking through (8, 1) onto (9, 1) still plays the closed line, a step toward (9, 0) stays in Hearthmoor, and after Mom opens the trail that same step warps to Mahopac (9, 14) and sets `story.reached_mahopac`. Save `v` stays 2.
- **`PixelPets.glimmerCheck`** (getter). Returns the array from `glimmerDevCheck()` in `game.js`: a list of problem strings. Empty array means `data/glimmer_path.json` lines fit after tokens, choice labels are at most 30 characters, ambient lines and walk-away toasts are at most 40, variants have a base scene, and those variants set the same `story.*` flags as the base.

`tests/heights.spec.js` plays the side-pick offer into Fernbrook Heights (Keepers tunnels, Glimmerwell lab), checks the trial stays shut until `story.heights_done`, and opens a group battle (two foes, TARGET). It also checks the VOLT line Bitlet: three stages, lab-only so the wild roll stays at 0, the Arbiter bay object, and a battle that names Bitlet. Save `v` stays 2. The save form-id table now ends at `fetch` (48 form ids). The journal still counts 45.

`tests/fetch_line.spec.js` checks the NPC-only BLOOM line Fetchling, Harvestail, and Hearthound: base stats, learnsets, Fetch Dash and Steadfast Paw, the side-view art, a zero wild chance on every spawn table, starter baskets still ember/tide/bloom, the journal still at 45 with no fetch cell, and a Fetchling growing up at 40 then 120 growth points and learning Fetch Dash then Steadfast Paw. Save `v` stays 2. Screenshot: `fetch-line-<width>.png`.

`tests/maps_b4.spec.js` (map pass B4 phases 1 and 2, all three widths, `?debug=1`) checks that `data/detail_b4.json` really lands: only `set` (`variants: true` on every map, plus `roofs` on towns) and `addObjs`, the merged `roofs` equal the overlay, every new prop and decal is on its map once with art, the Hearthmoor lantern post at (14,16) blocks, and the Cobblecrest hall and the five old High Charity roofs keep their `col` and corners. On each town (Hearthmoor 5, Fernbrook 2, Cobblecrest 4, High Charity 15, Mahopac 1, Fernbrook Heights 2 buildings) every roof cell and wall door belongs to a styled building, each has a wall, art and a porch prop within 3 tiles, and no two share roof, shape, wall, door, windows and porch prop. On all 11 outdoor maps the safe tile is free, no new prop sits on a solid tile, and the people, signs, pickups, doors and warps reachable from the safe tile are the same with and without the new props. A save standing on the Mahopac signal mast loads on (9,14). `PixelPets.exteriorCell` shows the path fringe beside grass and none mid-path, the faction ridge on a flat roof and on the outline of a cut one, styled walls, and the Lodge and RegenX doors; every `EXTERIOR_ART` grid is 16x16 (32x32 big) PAL keys and registered at that size. Phase 2: on every outdoor map plain grass shows `g`, `grass_b`, `grass_c` or `flower_patch` and every other char draws as itself, the pattern is the same after a reload, and the save holds no variant or decal data (`v` 2). `devChecks().floorCap` is empty and `floorShare` is 70 % or less on all 11 maps; Mahopac (232 walkable cells) and Fernbrook Heights (280) would be over 80 % plain grass without variants; rx_f4 still has 216 walkable cells under 70 %. Every puddle and leaf-litter decal is 16x16 art on plain grass (quarry gravel), not blocking, off warps, door fronts, objects and the safe tile; Talk facing one does nothing and the player walks onto it. Every 10x17 screen has 6 props, signs or pickups (High Charity 2 and Route 2 4 screens at 4-5, no free cell), and no B4 object cuts a trainer's sight line short. Cut-roof ground on the towns shows the grass variants. Both views return null without `?debug=1`.

`tests/group_battle.spec.js` checks a normal trainer is not a group fight, TARGET wraps, both foes swing in one turn, Cal joins Quinn, a win sets the trainer flag without the story scene, a loss does not, and Heights Standing grants once per faction.

`tests/glimmer_fernbrook.spec.js` (Build 3) plays the Fernbrook glimmer path: Keepers pick leaves the orchard battle in place, an old save past the orchard does not see the gate, "Think about it" sets no flag and stepping off toasts one walk-away line, the glimmer pick runs the orchard and the four Tour stops, a worn-out party and a lost match can still finish at stop 4, and the optional win grants `tour1_match` once. Screenshots (320 and 390) cover the side pick, the orchard, each Tour stop, and the lanyard card.

`tests/phone_contacts.spec.js` opens the Keeper1 icon grid (Walklings, not Journal), lists Officer Ness, Rook, Sergeant Bram, and Warden Ilse after those meetings, hides Hattie until you talk to her, opens a QUEST card, stores a FAV in `phoneBook`, and opens the bag with a Keeper1 and a Cracked Handset inside. Save `v` stays 2.

`tests/civic.spec.js` issues the Keeper1 on the Route 1 side quest, opens the phone (KeeperUAV, then Botnet after a cracked handset), enters the Keeper House, and checks that Officer Bren patrols. Officer Ness is already at Route 1 (3, 7). Walking into him, or three steps that do not close the distance, runs `phone_grant`. The quest card splits MAIN and SIDE, and the side line says to explore. It also walks the Hearthmoor east path onto Route 1, checks the cut tree and the moved town sign, and checks that Officer Cald stands beside that gate. Save `v` stays 2.

`tests/ribbit.spec.js` checks that the Ribbit feed is stable, that the quarry sale has its own line, and that the phone shows Block News and Chirp Worldwide.

`tests/town_board.spec.js` (TB-1) checks the 320 project: a v2 save with `story.phone_got` and a partner, empty slip and bounty piles, PLACEHOLDER on every report, Hearthmoor's THE LANTERN POST (unchanged when `story.side` is glimmer), Cobblecrest's BRIGHT NOTICE after `story.quarry_bought`, Mahopac's empty masthead, a High Charity board, and no board of their own on Route 1, Wickerglen, Old Meadow, the quarry, or Fernbrook Heights. The phone has BOARD (`data-app=board`) and KeeperUAV (`data-app=jobs`). `PixelPets.state.v` stays 2.

`tests/save_copy.spec.js` (Build 7) downloads the v2 save from the Start over dialog, wipes, and reads the file back (same party, `story.side`, and `v` 2). A newer file, a v1 file, a file that is not JSON, and a file over the size cap are refused and the current game stays.

`tests/glimmer_route2.spec.js` (Build 4) plays the Census volunteer scene (only the quiet log sets `story.rook_bond`), the grey Pebblit line, Wickerglen's three treats and flags, both the together and race pacts, and checks Keepers Route 2 still uses the base scenes.

`tests/glimmer_cobble.spec.js` (Builds 5–6) checks race arrival and the Cobblecrest respawn, Rook's glimmer battle lines, the buyout flag, the Sacrifice quota, the snack that stays in the bag, the review battle, and R5 (`"ally"` vs `"stays"`, including a high `story.rook_bond`). Both closers set `story.cobble_end`. The Keepers line is the one where he gets off the cart.
- **`PixelPets.standingCheck()`** (function). Returns the array from `PPStanding.devCheck()` in `standing.js`: a list of problem strings. Empty array means `STANDING_CFG` is well formed (first threshold equals `min`, thresholds rise and stay within `max`, one tier per threshold on each side, blurbs and toasts fit 40 chars, grants are positive integers, `costDiv` is an integer ≥ 1). The scene-side check (every `standing` step names a known side and, when its amount is null, a known grant id) is part of `glimmerCheck`.
- **`PixelPets.befriendCheck()`** (function). Returns the array from `befriendDevCheck()` in `moves.js`: a list of problem strings. Empty array means zone width does not rise with foe level, does not fall as HP falls, and stays inside the floor and cap.

`PixelPets.befriendOdds(foeLv, hpFrac, opts)` returns `{ width, chance, speed, label }`. `width` and `chance` are numbers rounded to 3 decimal places. Defaults: stage 0, joy 60, no treat, lead level equal to the foe, engaged when `hpFrac < 1`, bonus 0.

`tests/lantern_rest.spec.js` (all with `?debug=1`): after a wipe the Hearthmoor Lantern House offers a 5 Acorn rest for the whole party, "Not yet" leaves the door mat shut, resting pays and then lets you out, and the outdoor sign states the cost. With 0 Acorns the keeper covers the fee and still heals the party. Fernbrook's lantern door will not let a wiped party walk off until that rest. A home nap stays free, a hurt party pays 5 Acorns at the beds, and a party already at full HP rests without paying.

`PixelPets.lanternRest` (getter) returns `{ cost, due, hurt }`. `cost` is the Acorn price. `due` is true after a wipe until the party no longer needs a rest. `hurt` is true when any party Walkling is missing HP.

## Standing hooks

`PixelPets.standing` (getter, read-only copy) returns `{ keepers: { points, tier, name }, glimmer: { points, tier, name }, side, switches, chapter, canSwitch }`. `PixelPets.standingCfg()` returns a copy of `STANDING_CFG`. With `?debug=1` only: `PixelPets.setStanding(side, points)` (clamps, saves, toasts a new tier), `PixelPets.switchSide(to, free)` (`free` skips the cost) and `PixelPets.pledgeDesk(to)` (opens the desk scene as the NPC would; returns false when the desk is not open). Without debug these three return `undefined`.

## Debug panel

`tests/debug_mode.spec.js` covers Settings → Debug. The password is Larson (any capitalization). A wrong word leaves `PixelPets.debug` false and `giveItem` returns `undefined`. The right word turns debug on without a reload (`pixelpets.debug` is `1`, the DBG tag shows, the panel opens). Lock turns it off again.

With debug already on (`?debug=1`):

| Test | What it asserts |
|---|---|
| checkpoint, item, faction, standing | The panel's GO on `hall1` sets the earlier story flags, not `story.seal1`, marks the side pick done, and lands on `fernbrook` with quest id `hall1`. GIVE adds Heal Snacks. Glimmerwell sets `story.side` and the side pick. Keepers standing 40 matches `standingCfg()` tier math. |
| encounter stats and spawn | The preview text matches `encounterPreview('stone', 8, 0, 0.5)`. START BATTLE opens a wild battle at that level, type, and HP. |
| catalog, side checkpoint, kit, checks | `debugCatalog().checkpoints` includes `hall1`, `mom` and `hc_plaza`. `checkpoint('mom')` is the side chain and lands in `hm_home_up` without finishing Rook. `fillKit` fills the bag and at least 999 Acorns. `setLevel(12)` sticks. `devChecks()` arrays are empty. `debugSnapshot()` names the map. |

`checkpoint(id)` reconciles that chain only. Main steps do not rewind Mom / Mahopac. Side steps do not rewind the main story. A save that already has Walklings keeps `story.intro_seen` and `story.starter_received`. `hc_plaza` and `hc_hall` only add the flags that open those places.
`tests/box_app.spec.js` (Q17 and Q18) reorders the party with MOVE then DOWN and keeps an extra field (`souvenir`) on the Walkling. The box order stays put. RELEASE asks first; BACK leaves the boxed Walkling, and the confirm RELEASE removes them. Releasing the partner promotes the next party member, then the first boxed Walkling. `#orphanRow` shows the nick, the reason, and the raw species, and it has no buttons. Save `v` stays 2. The install test checks the manifest, the Apple icon, that `sw.js` names `version.json` and does not name the location hosts, and that a reload with the network off still opens the shell.

`tests/party_board.spec.js` checks the six slots, the 42-cell journal, the quiet orphan count, reorder, deposit, withdraw, the last-Walkling release refusal, a full party of six, and that MOVE, TO BOX, PARTNER, RELEASE, and TO PARTY stay labeled after the care timer. `tests/party_qa.spec.js` and `tests/walkling_sheet.spec.js` cover the sheet. `tests/deploy_held.spec.js` covers held items and the battle calls.

`tests/look_listen.spec.js` (Q20) checks the Tier 2 lanyard grid, Imogen and Hollis, Rook's lanyard, and that `mapTrack` returns `town_glimmer`, `quarry`, and `grove`. `tests/lantern_council.spec.js` (Q21) checks the Keepers council after Cobblecrest, the one-time `hc_council_k` grant, and that a glimmer save never takes that quest. `tests/qa_gaps.spec.js` checks quest pointers that the earlier smoke left open, including the council row after Cobblecrest.

`tests/qa_play.spec.js` (the Oct 14 phone pass) checks the 320, 375, and 390 projects. The intro look picker's DONE button is inside the viewport and the name row stays hidden. A glimmer save past the orchard, with the first wild unmet, shows the Heights objective in the walk tip. The bag lists Keeper1 and the Cracked Handset, tells you to open PHONE, and offers no USE on those rows. The cracked Notes are signed Handset, and the phone shell fits the viewport. Fen's second talk is one line. Save `v` stays 2.

`tests/care_tools.spec.js` (Q23, Q24, Q25) renames the partner from STATS. `N<ib>  2` is stored as `Nib 2`, and the party slot's label matches. Escape leaves that name. Typing the species name clears `nick`. Save `v` stays 2. The Vol slider writes `settings.musicVol` and does not flip Music on/off. The build line stays in view. `PixelPets.away(13)` shows no welcome line. `PixelPets.away(14)` says the partner waited. FOOD and JOY stay at or above 20, and NRG stays at or above 10. Screenshots: `screenshots/care/`.

`tests/partner_kit.spec.js` checks the partner tab at 320: STATS and KIT sit above FEED, use the care-button chrome, and stay on screen. The partner tab has no BAG. The Walk map still opens the bag. KIT opens Customize & Gear. Lodge bell sets `accessory` to `bell` and save `v` stays 2. Every form's five adornments change the sprite and sit on the body, including a faded Walkling drawn in grey. Screenshots: `screenshots/partner/`.

`tests/controls.spec.js` (Q26 modern navigation): a save with no `settings.controls` stays arcade; modern hides the header, HUD, d-pad, TALK and tabs, fills `#app` with the map, keeps every floating button at least 44 px with no overlap, and each one opens and closes its target; Settings switches both ways and moved nodes go home; the joystick sets `walk.dpad` and ignores a tap. The modern QUEST button paints a gold pip for an open main step and a tide-blue pip for an open side quest, keeps both after the panel is opened, and drops each when that quest is done (the idle last step has no main pip). Arcade keeps the 8x8 signpost and names the same quests. Screenshot: `quest-marks-<width>.png`.

`tests/pathfinding.spec.js` (modern tap-to-walk): a free-tile tap in Rook's house walks around Mrs. Calloway to the tile behind her. A tap on a walled-in corner stays put and toasts "Can't get there from here." Tapping her still opens talk. Tapping Fernbrook's silent lantern stand walks to the nearest open tile beside it and does not start a scene. Tapping the home door still enters. Tapping the exit mat walks onto the open warp. A wild tap still sets a greedy chase. A wild placed on the next step is walked around, and the keeper does not meet it. `PixelPets.findPath` returns a path with `?debug=1` and returns `undefined` without it. Save `v` stays 2. Screenshot: `tap-path-around-<width>.png`.

`tests/quest_multi.spec.js` (QUEST_MULTI, D106): two side chains show `SIDE · 2` with a TRACK row; TRACK switches the card, ring and cue and survives reload; Mom's gating is unchanged; auto-track toast; old saves and a bad tracked id; the 2/3 row cap with `+N more` at 320/375/390 in arcade and modern (rects, 44 px targets); folded DONE; no side quest hides the card and the Side task key (D110); the pulse for a new chain; main card unchanged; devCheck labels; debug hooks inert without `?debug=1`.

`tests/p0_stale_page.spec.js` (P0, build 20261015-1305 report): a cached older `index.html` (the real 20261015-1158 page in `tests/fixtures/`) with the newest scripts must still boot the saved partner (no bare Lv 1 / all-0 page) and leave the save as it was. Fails on 20261015-1305.
`tests/p0_trainer_win.spec.js` (P0 regression): wins a trainer fight move by move; the partner, XP, uid and the beaten flag survive, with no reload and no console errors.

`tests/data_integrity.spec.js` does not boot the game. It regenerates `data/mapdata.js` in a temp copy and checks it matches, then checks the composed world: every warp and door target map exists, the target tile is in bounds and walkable, every safe tile is walkable, and object ids are unique on each map. Learnset and trainer move ids must exist, and each species stage totals 192, 256 and 320 (stage 0 and 1 are the stage-2 line times 0.6 and 0.8, largest remainder). Every file named in `sw.js` must exist. A broken fixture is reported for each of those checks. `hc_south` is `test.fixme` (it lands on a house wall).

`tests/wording_guard.spec.js` checks player-visible say lines, choice labels, signs, toasts and blurbs: the banned-word list, the toy-brand pattern (built from character codes), say and sign and quest lines at most 110 after token widths, choice labels at most 30, no double space, and no unknown `{token}`. The ids `isFainted` and `dexGrid` are exempt. The Civic Bank sign is `test.fixme`.

`tests/sfx_minigames.spec.js` loads a seeded save with sound off and reduced motion on, at 320, 375 and 390. `PPSound.play('step')` stays silent. Each minigame opens and closes with no console error. Screenshot: `minigame-<width>.png`.
