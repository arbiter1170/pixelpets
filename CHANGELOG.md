# Changelog

Newest first. The build stamp is `version.json` and the `?v=` on each script in `index.html`. Status of open work is `BACKLOG.md`. The queue is `NEXT_PLAN.md` §3. Agent skills are in `.cursor/skills/README.md`.

## 2026-10-16 00:22 ET: Lantern rooms use a warm floor (build 20261016-0022)

- What changed and why: The Hearthmoor and High Charity Lantern Houses were too bright. Seven palette keys were appended (sand, terracotta, cream, sage, dark sage, warm shadow, warm trim). Hearthmoor now has a sand checker floor, cream walls, and a dark sage wainscot. High Charity keeps the clinic grid, now on sand tiles with sage grout and sage walls. The window glow stays the bright accent. Cobblecrest's lantern room is unchanged. The old white floor and wall tiles stay defined, so the Hearthmoor lantern exterior is unchanged. Save `v` stays 2. No id was renumbered.
- Files touched: `sprites.js`, `tests/lantern_palette.spec.js`, `tests/README.md`, `README.md`, `handoff/maps/BUILDING_VARIETY.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-0022.
- Tests run and result (widths, checks): `PP_PORT=8804 npm test` exit 1. 837 passed, 12 skipped, 3 failed (18.8m), at 320, 375, and 390. The 3 failures are the pre-existing `tests/maps_b6.spec.js:289` check: it expects `lab_floor` at `rx_f1` (9, 8) and reads `lab_inlay_mint`. That check already fails on main. `tests/lantern_palette.spec.js` passed at all three widths, with no console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Green. The packet set the colours and the two skins. No new decision id. D88 still caps one floor tile at 70 percent, and all three lantern rooms stay under that cap.
- Anything left unfinished: The private design copy of BUILDING_VARIETY was not in this workspace. The handoff copy in this repo has the new floor wording for rows 3 and 23. The `maps_b6` lab-floor check is left as it is on main.

## 2026-10-15 23:40 ET: High Charity rooms merged with current main (build 20261015-2340)

- What changed and why: Merged current `main` (B1, the Q28 plan, B5, B2 and B7). `sprites.js` and `game.js` merged cleanly. `data/mapdata.js` was regenerated, not hand-merged. `OPEN_DECISIONS.md` keeps D92, D94, D95, D99, D100 and D102. `tests/maps_b7.spec.js` keeps this branch's 27 shared skins and main's four lab floor variant keys. Save `v` stays 2. No id was renumbered.

## 2026-10-15 23:25 ET: Observatory and dream rooms merged with current main (build 20261015-2325)

- What changed and why: Merged current `main` (B1, the Q28 plan, B5 house interiors and B2 RegenX floors). `sprites.js` and `game.js` merged cleanly, so the B7 skins sit beside the house skins and B2's lab skin. `data/mapdata.js` was regenerated, not hand-merged. `OPEN_DECISIONS.md` keeps D92, D99, D94, D95 and D102. `tests/maps_b7.spec.js` now expects the four lab floor variant keys B2 added (bay, plain, focus, records). Save `v` stays 2. No id was renumbered.

## 2026-10-15 23:00 ET: RegenX floors merged with current main again (build 20261015-2300)

- What changed and why: Merged current `main` (map pass B1, the Q28 plan, and the B5 house interiors). `sprites.js` keeps main's `HOUSE_SKINS` and `SKINS` and this branch's `LAB_SKIN` (Focus Wing and Records floors, new lab chars). `data/mapdata.js` was regenerated, not hand-merged. `OPEN_DECISIONS.md` keeps D92, D99, D94 and D95. `tests/README.md` keeps both paragraphs. The B5 lab check in `tests/maps_b5.spec.js` now reads the plain floor at (8, 9), because B2 put a mint inlay on (9, 8). Full `npm test`: 813 passed, 3 failed (that check), then the fixed specs passed 93/93. Save `v` stays 2. No id was renumbered.

## 2026-10-15 20:41 ET: RegenX floors brought up to current main (build 20261015-2041)

- What changed and why: Merged current `main`. The lobby, Focus Wing, and Records stay 14×22. Outdoor grass variants and building paint from main stay, because this branch did not replace that draw path. The overlay loader is the one already on `main`. `data/mapdata.js` was regenerated. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `OPEN_DECISIONS.md` (D94 and D95 kept), `data/mapdata.js` (regenerated), `index.html` and `version.json` (restamped). `game.js` merged cleanly.
- Commit(s) + build id: build 20261015-2041.
- Tests run and result (widths, checks): recorded in the pull request after this stamp.
- Decisions made (colour + reasoning): D94 and D95 stay the placeholder lines. No id was renumbered.
- Anything left unfinished: the acceptance suite on this stamp.

## 2026-10-15 22:50 ET: House interiors merged with current main again (build 20261015-2250)

- What changed and why: Merged current `main` (map pass B1 and the Q28 plan). Conflicts were only in `CHANGELOG.md`, `OPEN_DECISIONS.md` (D92 and D99 both kept), `index.html` and `version.json` (restamped). `data/mapdata.js` was regenerated and did not change. Save `v` stays 2. No id was renumbered.

## 2026-10-15 20:44 ET: High Charity rooms brought up to the updated dream branch (build 20261015-2044)

- What changed and why: Merged the updated observatory branch, which already contains the updated house branch and current `main`. Outdoor grass and building paint stay. High Charity skins stay beside the house, observatory, and dream skins in one `SKINS` table. `data/mapdata.js` was regenerated with `detail_b4` through `detail_b7`. Save `v` stays 2.
- Files touched: merge of the dream branch. Conflicts: `sprites.js` (kept both tile sets, both skin rows, and both prop sets), `OPEN_DECISIONS.md` (D100 kept beside D102 and main's later rows), `tests/README.md` (both spec rows), `data/mapdata.js` (regenerated), `index.html` and `version.json` (restamped). `game.js` merged cleanly.
- Commit(s) + build id: build 20261015-2044.
- Tests run and result (widths, checks): recorded in the pull request after this stamp. The dream-room spec counts every skin in the shared table, which is 27 once the fourteen High Charity rooms are included.
- Decisions made (colour + reasoning): D100 stays. D101 was not needed. No id was renumbered.
- Anything left unfinished: the acceptance suite on this stamp.

## 2026-10-15 20:42 ET: Observatory and dream rooms brought up to the updated house branch (build 20261015-2042)

- What changed and why: Merged the updated house-interior branch (which already contains current `main`) into this branch. Outdoor grass and building paint stay. House skins and the observatory and dream skins stay in one `SKINS` table. `data/mapdata.js` was regenerated with `detail_b4`, `detail_b5`, and `detail_b7`. Save `v` stays 2. A following merge of `origin/main` is already contained in that house branch.
- Files touched: merge of the house branch. Conflicts: `OPEN_DECISIONS.md` (D102 kept beside D99 and main's later rows), `data/mapdata.js` (regenerated), `index.html` and `version.json` (restamped). `sprites.js` and `game.js` merged cleanly.
- Commit(s) + build id: build 20261015-2042.
- Tests run and result (widths, checks): recorded in the pull request after this stamp.
- Decisions made (colour + reasoning): D102 stays the dream-prop placeholder. D99 stays. No id was renumbered.
- Anything left unfinished: the acceptance suite on this stamp.

## 2026-10-15 20:40 ET: House interiors brought up to current main (build 20261015-2040)

- What changed and why: Merged current `main`. Outdoor grass variants, path-edge fringe, and per-building paint stay. The nine house rooms still use their own floors and walls. The `data/detail_*.json` loader is the one already on `main` (the same hook as PR #57). This branch does not add a second loader. `data/mapdata.js` was regenerated, not hand-merged. Save `v` stays 2. These rooms are not resized by an overlay, so the overlay size fix stays on PR #57.
- Files touched: merge of `main`. Conflicts: `game.js` (outdoor path kept, house skins kept), `data/mapdata.js` (regenerated), `OPEN_DECISIONS.md` (D99 kept beside main's later rows), `README.md` (house sentence and the north-trail sentence), `index.html` and `version.json` (restamped).
- Commit(s) + build id: build 20261015-2040.
- Tests run and result (widths, checks): recorded in the pull request after this stamp. The two tap-to-walk checks that used Rook's floor now use the upstairs room, because the new stove, stool, plant, and shelf sit on the old route.
- Decisions made (colour + reasoning): D99 stays the house-prop placeholder. No id was renumbered.
- Anything left unfinished: the acceptance suite on this stamp.

## 2026-10-15 — Q28 plan brought up to current main (docs only, no new build stamp)

- Merged current `main`. The map pass still reserves D92–D103 and those ids are not renumbered. D104 is already taken on main, so the next free id is D138. D127–D136 stay reserved by Design. D137 is the north-trail sign. B4's exterior pass is on main.

## 2026-10-15 20:35 ET: Map pass B1 brought up to current main (build 20261015-2035)

- What changed and why: Merged current `main` into this branch with a merge commit. Main already loads `data/detail_*.json` (map pass B4), so this branch keeps that one overlay loader and keeps the save fix that reads an overlay's `set.w/h`. Save `v` stays 2. No map was resized or redrawn.
- Files touched: merge of `main`. Conflicts: `OPEN_DECISIONS.md` (kept the D92 staff-door row and main's later rows), `index.html` and `version.json` (took main's script list, including `debug_ui.js`, then restamped).
- Commit(s) + build id: build 20261015-2035.
- Tests run and result (widths, checks): recorded in the pull request after this stamp.
- Decisions made (colour + reasoning): no new id. D92 stays the staff-door placeholder. Main's later ids were not renumbered.
- Anything left unfinished: the acceptance suite on this stamp.

## 2026-10-15 18:01 ET: North trail sign no longer blocks the exit
- What changed and why: The Hearthmoor north-trail signs stood on (8, 1), the only walk into the gap in the north trees. A sign blocks the tile it stands on, so the player could not reach the north exit at (9, 0), and could not walk back out after a visit. Both signs now stand on the grass at (10, 1). The warp still needs `story.mom_sent`. The closed-trail trigger stays at (9, 1). The sign text is unchanged. Save `v` stays 2.
- Files touched: `data/mahopac.json`, `data/mapdata.js`, `tests/mahopac.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261015-1820.
- Tests run and result (widths, checks): `npm test` (build check plus Playwright) — 771 passed, 12 skipped, exit 0, at 320, 375, and 390. `tests/mahopac.spec.js` walks through (8, 1) onto (9, 1) while the trail is shut, confirms a step toward (9, 0) stays in Hearthmoor, then opens the gate and warps to Mahopac (9, 14). No console errors in that run. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D137, green. (10, 1) is walkable grass south of the right path tile, clear of the warp, the closed trigger, and the return tile at (9, 1). The grass further east has no objects.
- Anything left unfinished: none.

## 2026-10-15 16:28 ET: Minigame smoke shots use the shared helper
- What changed and why: `tests/sfx_minigames.spec.js` wrote screenshots to hard-coded `/opt/cursor/artifacts/screenshots`, which fails on the box. It now uses the shared `shot` helper (`test-results/screenshots`, same as the other specs). No gameplay change.
- Files touched: `tests/sfx_minigames.spec.js`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261015-1628.
- Tests run and result (widths, checks): `tests/sfx_minigames.spec.js` at 320, 375, and 390 — 3 passed. Full `npm test` — 768 passed, 12 skipped, exit 0 (15.9m).

## 2026-10-15 13:45 ET: Tap-to-walk around obstacles
- What changed and why: A tap on open ground under the walk map now follows a 4-direction path around solids, people, and other blockers. A tap on a solid tile or a silent prop walks to the nearest open tile beside it. If nothing can be reached, the game says "Can't get there from here." A blocked next step (a patrol, or a wild on the path) searches once more from that tile. Tap-to-talk, doors, the d-pad, drag, the keyboard, and wild chase are unchanged. An open warp tile is still walked onto. A gated warp is not. Save `v` stays 2.
- Files touched: `game.js`, `tests/pathfinding.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261015-1345.
- Tests run and result (widths, checks): `npm test` (build check plus Playwright) — 690 passed, 6 skipped, exit 0, at 320, 375, and 390. `tests/pathfinding.spec.js` checks the path around a person, the unreachable toast, talk, a silent prop, a door, an open warp, wild chase, a blocked next step, and that `findPath` is inert without `?debug=1`. No console errors in that run.
- Decisions made (colour + reasoning): Vincent approved on Oct 15: walk onto an open warp, keep door taps, 4 directions only, no path cue, the toast text above, leave wild chase greedy, and keep gated warps blocked. D125, green: a read-only `PixelPets.findPath` on the debug surface, inert without `?debug=1`. D126, green: a solid tap does not stand on a neighbouring warp, and equal-length neighbours break ties in `DIRS` order (up, down, left, right).
- Anything left unfinished: `pathBeside` still has its own search. Wild chase stays on the straight-line step, as settled.

## 2026-10-15: P0 fix, bare page (Lv 1, all 0) after a reload
- What changed and why: Vincent's iPhone landed on the bare page (PARTNER, Lv 1, FOOD/JOY/NRG/GROW 0, no pet) right after a trainer fight. GitHub Pages ignores `?v=`, so a cached older `index.html` can load the newest scripts. `bindInput()` then called `addEventListener` on `#questSideMore` / `#questDoneToggle` (added in #66), which older pages lack. `boot()` threw before the first HUD paint. Nothing is written before boot finishes, so the save was not changed. Fix: those binds and the stat strip counts are null-safe; if `boot()` still throws, the page reloads once with a fresh `?b=` (sessionStorage guard, no loop); `sw.js` revalidates pages (`cache: 'no-cache'`). No save change.
- Files touched: `game.js`, `sw.js`, `tests/p0_stale_page.spec.js`, `tests/p0_trainer_win.spec.js`, `tests/fixtures/index_1158.html`, `tests/README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261015-1336.
- Anything left unfinished: The tests do not show why the page reloaded at that moment (an iOS tab reload or the new-build bar). The fix makes any reload onto a stale page boot correctly.

## 2026-10-15 11:36 ET: NPC-only Fetchling line
- What changed and why: Added the BLOOM line `fetch` (Fetchling, Harvestail, Hearthound) so a later packet can give Lizzy the partner Buddy. Vincent approved the line as written and that a keeper can never get one. It is not in any wild table, habitat roll, or starter basket. The journal still counts 45 forms.
- Files touched: `sprites.js`, `stats.js`, `moves.js`, `save.js`, `game.js`, `tests/fetch_line.spec.js`, `tests/heights.spec.js`, `tests/README.md`, `README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `OPEN_DECISIONS.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261015-1120.
- Tests run and result (widths, checks): `npm test` (build check plus Playwright) — 561 passed, 6 skipped, exit 0, at 320, 375, and 390. `tests/fetch_line.spec.js` checks stats, learnsets, art, a zero wild chance, starters, the journal at 45, and growing up. No console errors in that run.
- Decisions made (colour + reasoning): D121, green. Leave the NPC-only line out of the journal grid, the Out there count, and the stats-card best-of set, so a keeper still sees 45 forms. The form ids are still appended on the save table. Steadfast Paw uses the existing self DEF +1 effect, the same shape as Mist Veil.
- Anything left unfinished: Lizzy and Buddy are not placed. No map, scene, or town change.

## 2026-10-15 — UX review (green): header acorns, progressbars and canvas labels, debug panel out of the player DOM

- Modern walk acorn chip (Design, green): acorn icon + count on the area badge's row (y 6, 44 tall), just left of the gear, read-only, styled like the header count. At 320 the badge text clamps first, and the chip fades with the badge in scenes and is covered in battle.
- Header: an acorn icon and count sit left of the Lv badge and follow `money` live (checked every 120 ms; the label reads "N Acorns"). Shown wherever the header is (arcade everywhere, modern on PARTNER / WALKLINGS; NAV_MODERN hides the header on the modern walk screen).
- Accessibility: FOOD / JOY / NRG / GROW and every HP bar (encounter cards, stats cards) are `role=progressbar` with `aria-valuemin/max/now` and an `aria-label`, kept in sync. The walk map, care scene and encounter canvases are `role=img` with live labels (area and partner; partner, level and care; foe, level and HP).
- Debug: the debug overlay (#ovDebug, incl. "Agent tools") is no longer in index.html. Its markup is in `debug_ui.js` and game.js adds it only in a debug session, removing it when debug is turned off. `sw.js` now also caches `debug_ui.js` and `data/nav_art.js` (nav_art.js was missing from the offline shell).
- Tests: `tests/ux_review.spec.js`.

## 2026-10-15 — Several active side quests on the NEXT STEP panel (QUEST_MULTI, D106)

- The SIDE card shows the tracked chain (`SIDE · N`, `TRACKED` when two or more); every other active chain is a 44 px row with TRACK (2 rows under 360 px, 3 at 360+, then `+N more`); DONE folds to `DONE · N  >` with two or more side chains. The region map draws a solid ring for the tracked chain and dim dots for the rest; the walk cue follows the tracked chain only; finishing the tracked chain auto-tracks the next with "Now tracking: <label>". The map key's Side task entry shows only while a side quest exists (D110). Saves: additive `ui.sideTracked` / `ui.sideSeen`, `v` stays 2. Mom's gating unchanged. New hooks: `PixelPets.sideActive`, `regionMapMarks`; debug-only `trackSide`, `debugSideChains`. Green follow-ups: dim dots get a 1 px navy outline (6x6 at 390 px and up, 4x4 below); when the tracked side quest shares the main step's area, a solid 2 px side-blue ring sits 3 px outside the unchanged main ring (no dot there), and the map card adds `Side: <label>` under NEXT at 360 px and up. Design's Side task pill decision is D110. Test: `tests/quest_multi.spec.js`.

## 2026-10-15 — Standing numbers D14–D17 settled as built (Vincent)

- Docs only. Tiers 0 / 10 / 25 / 45 / 70 with the current names, switch keeps half the points, one switch per Seal chapter, `joinMinTier` 0. No code change.

## 2026-10-15 — STAT_DISPLAY v0.1: one NRG / GROW strip for PARTNER and WALK (design 39ef920)

- One `#statStrip` under the header (0,52,W,56; `<main>` from y 108) on PARTNER and WALK: NRG bar + number, GROW bar + number, `EXPLORE n/30` once, and a right slot that reads `CARE n/25` on PARTNER and `STEPS n` on WALK. Hidden on WALKLINGS, QUEST and modern WALK.
- Removed the NRG / GROW rows from the PARTNER stats, `#dailyXp` ("Today: care XP … explore XP …") and the WALK `.walk-hud` (the duplicate `TODAY 0/30`). No save fields, caps or toasts change. Placement is D120 (settled: Vincent approved Design's default). Tests: `tests/stat_display.spec.js`.

## 2026-10-15 — MAP_LEGEND v0.1: the region-map KEY in PLACES / QUESTS / SIDES pills, unlocked by the story (design 39ef920, 69f9a08)

- The 13 KEY rows become three pill groups: PLACES (Town, Route, Side place, Not visited, Coach), QUESTS (You, Next step, Side task, Seal) and SIDES (Keepers, Glimmerwell, Both sides, Wild, plus the trim note). Labels and swatches are unchanged.
- SIDES, the claim halos and the place-card hold line wait for `story.side_pick_done` (D109, settled: Vincent approved the default). The Seal pill waits for any seal flag or seal that `nodeSeal()` reads. Side task is always shown (D110, green). No save fields. Tests: `tests/map_legend.spec.js`; `tests/map.spec.js` key check per state.

## 2026-10-15 11:39 ET: Static data, wording and sound checks
- What changed and why: The suite only played through the game, so a bad warp, a missing move id or a banned word showed up only if a playthrough happened to hit it. These specs check the data itself. No gameplay or map data changed.
- Files touched: `tests/integrity_lib.js`, `tests/data_integrity.spec.js`, `tests/wording_guard.spec.js`, `tests/sfx_minigames.spec.js`, `tests/README.md`, `OPEN_DECISIONS.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build `20261015-1139` on `tests/data-integrity`.
- Tests run and result (widths, checks): `npm test` at 320, 375 and 390. Mapdata sync, composed exits and safe tiles, learnsets, stage totals 192/256/320, shell files, wording guard, and a muted reduced-motion pass of every minigame. Console errors: none on the new smoke. Two existing lines stay `test.fixme` (the High Charity south warp, the Civic Bank sign).
- Decisions made (colour + reasoning): D122–D124, green. Leave the south warp and the bank sign as they are and record them. Say, sign and quest lines stay at 110 after token widths, choice labels at 30. This guard does not add a 40-character cap for toasts or blurbs, because several live toasts are already longer and Standing already checks its own.
- Anything left unfinished: The south warp still lands on a house wall. The Civic Bank sign still has a banned word. Both are `test.fixme` until someone changes that data.

## 2026-10-15 — Modern QUEST button shows a main mark and a side mark

- What changed and why: In modern controls, an open main step lights a gold pip on the top right of QUEST, and an open side quest lights a tide-blue pip on the top left. The shape is Design's approved nav badge pip (it was drawn and unused). Gold matches the MAIN card. Tide blue matches the SIDE card. A dark ring keeps the blue mark readable on the blue button. The idle last step does not light a main mark. The pip stays after the panel is opened. The button still pulses until that main step has been opened. Arcade keeps the signpost icon. No new save field. `v` stays 2.
- Files touched: `game.js`, `tests/controls.spec.js`, `README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `OPEN_DECISIONS.md`, `tests/README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Decisions: D105, green. The pip colors follow the quest cards. The idle last step stays unmarked. D92–D104 stay with Design's reservation, so this call is not D92.
- Commit build id: `20261015-1107` (restamped after merging main, which was `20261015-1005`).
- Tests: `tests/controls.spec.js` (modern marks, press, reduced motion, panel, main only, side only, neither; arcade signpost). Widths 320, 375, 390.

## 2026-10-15 — Map pass B4 phase 2: seeded grass, puddles and leaf litter, props toward 6 per screen (build 20261015-1005), branch `cursor/maps-b4-exteriors-7807`

- What changed: all 11 outdoor maps opt in to E5 seeded variants through `data/detail_b4.json` (`"variants": true`). Plain grass `g` becomes `grass_b` (18 %), `grass_c` (12 %) or `flower_patch` (5 %) by hash of map, x and y; hand-placed chars (`f`, `t`, paths, roofs) never change, the same map always looks the same and nothing is saved. 229 `kind: "decal"` objects lay puddles and leaf litter (leaf litter beside trees, bushes, stumps and logs) on plain grass, or gravel in the quarry: drawn, never blocking, never talking, never animated, and off warps, door fronts, objects, the safe tile and the cells the specs walk. 122 more silent props bring every 320 screen (10x17 tiles) to 6 props, signs or pickups, except six screens with no free cell left (High Charity x0-9 y11-28, Route 2 x2-12 y0-17, 4-5 props). New props stand only on free walkable cells off paths, spawn zones, sight lines, patrols and door fronts. No map resized; no warp or door moved.
- D88 check: `devChecks().floorCap` and `PixelPets.floorShare(id)` now cover outdoor maps with `variants`. Top tile after variants: Mahopac grass 53 % (was 87 %), Fernbrook Heights 54 % (was 88 %), every outdoor map 58 % or less. Lab maps unchanged (rx_f4: 216 walkable cells, bay floor 53 %).
- Engine: `labTileName` and `labFloorShare` keep the lab path and add an outdoor table (`OUTDOOR_SKIN.variants` in `sprites.js`); a decal object counts as its decal in the floor share. The ground behind a cut roof takes the same grass variant as its cell. `PixelPets.exteriors(id)` also lists decals and `PixelPets.exteriorCell(x, y)` reports the cut-roof ground (both null without `?debug=1`); `tileInfo` shows outdoor variants and decals.
- Saves: no new fields; `v` stays 2.
- Tests: `tests/maps_b4.spec.js` (5 new checks, the overlay check widened for `variants` and decals).

## 2026-10-15 — Map pass B4 phase 1: building exteriors, path edges, outdoor props (build 20261015-0942), branch `cursor/maps-b4-exteriors-7807`

- What changed: every building on the outdoor maps (`handoff/maps/BUILDING_VARIETY.md` rows 1-27, 29 buildings) has its own roof, wall, door, windows, trim, roof shape and at least one porch prop, so no two buildings in a town look alike. That covers Hearthmoor, Fernbrook (Lantern House, Bloom Trial Hall), Cobblecrest, the fifteen High Charity blocks, the Mahopac observatory and the Fernbrook Heights RegenX front and tunnel mouth. Outdoor paths get a grass fringe where they meet grass (E7). 185 silent props: four 32x32 town landmarks (lantern post, well, statue, signal mast) and at least three landmarks per town, a route landmark about every 16 tiles, fences, rocks, flowerbeds, stumps and hay. No map size, warp, door or design-copy change; all of it is in `data/detail_b4.json`.
- Engine: a `roofs` entry may also name `roof`, `wall`, `door`, `win`, `trim` and `shape` (E11). An entry without these draws as before; `col` keeps working, the Cobblecrest hall keeps its stepped slate, and the faction ridge follows a shaped roof's outline. 32x32 prop art stands bottom-centred on its one cell. New read-only `PixelPets.exteriors(id)` and `PixelPets.exteriorCell(x, y)` (null without `?debug=1`).
- Art: original PAL grids in `sprites.js` (`EXTERIOR_ART`): 25 roofs, 24 walls, 17 doors, 19 window and wall pieces, 6 roof features, 41 porch and outdoor props, 7 big landmarks, 8 path edges. `grass_b`, `grass_c`, `flower_patch`, `puddle` and `leaf_litter` are drawn but not placed yet (phase 2).
- Saves: no new fields; `v` stays 2. A save standing where a prop now stands loads on the map's safe tile.
- Tests: `tests/maps_b4.spec.js`.

## 2026-10-15 08:55 ET — Map pass B1: rx_f4 acceptance gaps and overlay-resized saves (build 20261015-0910; save fix first stamped 20261015-0853), branch `cursor/maps-b1-rx-f4-7807`

- What changed and why: the rx_f4 pilot (PR #51) already ships the B1 packet's map, art and engine pieces E1/E2/E4/E5, so B1 adds only what the packet's acceptance list still lacked. The map-pass overlay hook (`data/detail_*.json`, applied last) is rebased onto the pilot. `save.js` now sizes a map from an overlay's `slicePatch.maps[id].set.w/h`, so a map that a later batch grows through its overlay keeps saved spots past the old edge (it clamped them to the old size before). No map changes size or look in this build; rx_f4 draws the same as on `main`. Merged with `main` after PR #52 (stamp 20261015-0910).
- Tests: `tests/maps_b1.spec.js` covers Quinn's group fight started by talking in the bay (the win plays `rx_done`, which sets `story.rx_done` and `story.heights_done`); Bitlet's scene from the bay and a befriend setting `story.rx_bitlet`; the Arbiter's four lines by flag; the same floor variants in a second browser context; the E1 camera in modern controls (whole width, centred when the bay fits); and an overlay that grows `rx_f2` and loads a save past its old bottom edge. `tests/helpers.js` gains `withOverlay()` for fixture overlays.
- Saves: no new fields; `v` stays 2.
- Decisions: D92 (open) for the staff-door deny line, which is placeholder copy.

## 2026-10-15 — Design's approved green copy replaces the leftover control, welcome and rename placeholders

- Settings toasts: 'Arcade controls. Pad and Talk button.', 'Modern controls. Tap to walk or talk.', 'Joystick on.', 'Joystick off.'. The step-8 toast is 'Keep walking. Wild Walklings hide in the grass.' in both layouts. `WELCOME_LINE` (after 14 h away) is '{pet} missed you! Welcome back.'. Rename: '{name} likes the new name!' on success; '{name} is back to its own name.' (species name) when a blank box, or the species name typed in, clears the nickname (D57); 'Pick a name first.' when the input is rejected (every character filtered) or blank with no nickname to clear, and the editor stays open. Town-board placeholders unchanged. Design's answers to the PR #52 flags: the welcome-back line is '{pet} missed you! Welcome back.'; clearing a nickname back to the species name shows '{name} is back to its own name.'; the arcade step-8 toast matches modern ('Keep walking. Wild Walklings hide in the grass.'). Tests: `tests/care_tools.spec.js`, `tests/controls.spec.js` (Settings toasts, toast fit at 320/375/390 in both layouts).

## 2026-10-15 09:35 ET: observatory and dream rooms get their own skins

- What changed and why: Breckenridge Observatory and the three dream rooms keep their size. The observatory gets a dome-ribbed wall, a star-map floor, and a desk beside the existing telescope. The 2004 memory is cool blue-grey. The birthday room stays warm yellow and gains streamer decals only. The drive-through is night asphalt with painted lines and a plain menu board. The outdoor Mahopac map is unchanged. Save `v` stays 2.
- Files touched: `sprites.js`, `data/detail_b7.json`, `data/mapdata.js`, `tests/maps_b7.spec.js`, `tests/README.md`, `OPEN_DECISIONS.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build `20261015-0935`.
- Tests run and result: `PP_PORT=8107 npm test` at 320, 375 and 390. 534 passed, 6 skipped, 0 failed (12.2m). The 6 skips are the town-board checks that only run at 320.
- Decisions made: D102 (green). New prop lines are neutral stand-ins.
- Anything left unfinished: Rooms were not enlarged. The outdoor observatory still uses the shared roof; the dome, slit and mast on that building wait for the outdoor Mahopac edit. The drive-through has three talkable props, which meets one per twelve floor tiles on this small lane.

## 2026-10-15 09:40 ET: High Charity rooms get their own floors and walls

- What changed and why: The fourteen High Charity rooms keep their size (D84) and gain a skin each: own floor, wall face and baseboard, seeded variants, a wall-shadow row under the windows, and the signature props from the building list. No two of them share a floor and wall. The lab skin and the nine house skins are unchanged. `data/highcharity.json` is not edited; the room edits live in `data/detail_b6.json`.
- Files touched: `sprites.js`, `data/detail_b6.json`, `data/mapdata.js`, `tests/maps_b6.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build `20261015-0940`.
- Tests run and result: `PP_PORT=8106 npm test` at 320, 375 and 390. 537 passed, 6 skipped, 0 failed (13.0m). The 6 skips are the town-board checks that only run at 320.
- Decisions made: D100 (green). New prop lines are neutral stand-ins. D101 was not needed.
- Anything left unfinished: Rooms were not enlarged. A 9×7 room that cannot hold both the prop count and a clear path would have been named here; each room met the count and stayed walkable.

## 2026-10-15 — RegenX lobby, Focus Wing, and Records at 14x22 (build 20261015-0907)

- What changed and why: `rx_f1`, `rx_f2`, and `rx_f3` expand from 18x12 to 14x22 so the lab matches the Arbiter bay. Every old object id, flag, and warp id stays; only coordinates move. The lobby keeps the white floor and adds a mint inlay, waiting benches, empty white planters, and a visitor screen. The Focus Wing has pale blue grout, a pale blue stripe, quiet booths, a whiteboard, and sound panels. Records has amber grout, an amber stripe, a shelving run, sorting tables, file carts, and a dim lamp. `"variants": true` and `"fitWidth": true` turn on the existing floor check and the interior camera. `rx_f4` is unchanged except `rx4_down` and `rx4_down_b`, which land on the Records north stair at (6, 4). `rx3_up` still lands on the bay at (6, 19). The Heights lab door arrives on the lobby mat at (6, 19).
- Files touched: `data/heights.json`, `data/mapdata.js`, `sprites.js`, `tests/maps_b2.spec.js`, `tests/rx_f4_pilot.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: branch `cursor/maps-b2-regenx-floors-7807`, build `20261015-0907`.
- Tests run and result: `PP_PORT=8102 npm test` at 320, 375, and 390. 528 passed, 6 skipped, 0 failed. The skips are the 320-only town-board cases when the 390 project runs. Console errors stayed at zero on the new specs.
- Decisions made (green): D94 lobby prop lines and D95 Focus Wing and Records prop lines are short placeholders. The white lamp reuses the Heights lamp line.
- Anything left unfinished: none. Save `v` stays 2. An old position on a solid tile snaps to (6, 19) with the existing safe-spot rule.
- Depends on the Arbiter Bay pilot already on main (PR #51, build 20261015-0817). This branch also carries the `data/detail_*.json` overlay hook from `30ff864`.

## 2026-10-15 09:02 ET: house interiors get their own floors and walls

- What changed and why: The nine Hearthmoor, Keeper House and Cobblecrest rooms keep their size (D84) and gain a house skin each: own floor, wall face and baseboard, plank variants, a wall-shadow row under the windows, and props enough for one per twelve floor cells. The lab skin is unchanged. The verbatim design copies are not edited; the room edits live in `data/detail_b5.json`.
- Files touched: `sprites.js`, `game.js`, `data/detail_b5.json`, `data/mapdata.js`, `tests/maps_b5.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build `20261015-0902`.
- Tests run and result: `PP_PORT=8105 npm test` at 320, 375 and 390. 525 passed, 6 skipped, 0 failed (12.3m). The 6 skips are the town-board checks that only run at 320.
- Decisions made: D99 (green). New prop lines are neutral stand-ins.
- Anything left unfinished: Rooms were not enlarged. The seam stones in the Cobblecrest Trial Hall still block the only gap in each pillar row until those scenes clear them.
- Anything left unfinished: the acceptance suite on this stamp.

## 2026-10-15 — Map pass plan, Q28 (docs only, no new build stamp)

- Q28 is the map pass from `handoff/maps/`. The Arbiter Bay pilot is already on main (PR #51): the 14×22 lab, the interior camera, bigger grids, seeded floor variants and decals. B1 is a gap check against that, not a second build. Vincent cleared B2–B7. B8 waits until B5's house skins exist, and then for his go. Plan table in `NEXT_PLAN.md` §3.
- Decision ids for the batches start at D92. D90 is the debug-save acceptance and D91 is the byte-line learnset, both already on main. D92–D103 stay reserved per batch and are not renumbered. D104 is already taken on main (Design's D96–D104 block). The next free id is D138. D127–D136 are reserved by Design, and D137 is used.

## 2026-10-15 — rx_f4 pilot: the Arbiter Bay at 14x22 (BUILD_RX_F4_PILOT, design 6263382), branch `rx-f4-pilot`

- What changed: `rx_f4` goes from 18x12 to 14x22 with Design's `pilot` grid and lab tiles (verbatim from `fernbrook_heights_art.json`). Every existing id is kept; the objects move to the spec's coords (A3) and the new props, the locked staff door, the off-limits wall decal and the optional night tech (`rx4_tech`, D89) are added with their lines. `rx_f3` → `rx3_up` lands at (6,19) facing up; `safe` is (6,19); a second mat warp `rx4_down_b` at (7,20).
- Engine (in order): E2 no interior size cap (a 30x30 test map loads, walks and saves); E1 interior camera: maps with `"fitWidth": true` show their full width and scroll vertically, clamped at every edge (other maps unchanged); E4 decal layer: cables, drains and guide lines are drawn as an overlay on the floor and never block; E5 seeded variants: hash(map, x, y) turns 14 % of plain bay floor into scuffs on maps with `"variants": true`, hand-placed chars win, nothing saved. Lab-skin maps get their own walk table (`LAB_SKIN.walk`), so `g` is glass there and grass elsewhere.
- D88 check: `devChecks().floorCap` fails if one floor tile covers more than 70 % of a rebuilt map's walkable cells (rx_f4: 51 % after variants).
- Saves: no new fields. An old bay position on a now-solid tile snaps to (6,19) via the existing safe-spot rule; save `v` stays 2. Tanks share one clock and hold frame 0 under reduced motion.
- Decisions: D81–D89 mirrored as settled from MAP_SCALE_DETAIL; D90 (debug-save marking accepted, D69 closed); D91 (byte-line learnset, green). Next free id D92.
- Tests: `tests/rx_f4_pilot.spec.js` (the spec's QA list C plus E1/E2/E4/E5); `tests/heights.spec.js` updated for the new coords.

## 2026-10-15 — Map handoff packets (docs only, no new build stamp)

- Added `handoff/maps/`: audit (`AUDIT.md` / `AUDIT.csv`), `BUILDING_VARIETY.md`, and self-contained B1–B8 map upgrade packets for outside build agents. Design data is pasted in each packet. No game code change.

## 2026-10-15 — Modern navigation mode (Q26), branch `modern-nav` (build stamped on the branch)

- What changed and why: Vincent's modern controls (PR #37 scope) with Design's NAV_MODERN v0.1 layout. Settings → Controls swaps ARCADE / MODERN at once; Joystick row in modern (off by default, D71). A new game asks Arcade or Modern after the look picker (D76). Modern: full-screen 2x map, floating QUEST / BAG / MAP, gear / PHONE, PARTNER / WALKLINGS, area name, tip band, partner strip, WALK back buttons. One `body.nav-locked` lock. Edge arrows stay clear of the buttons. Arcade unchanged. WALKLINGS screen headers: TEAM and WALKLING-BOX; sheet and board buttons TO TEAM / TO WALKLING-BOX (NM-Y3). Design's v0.2 pixel art for every nav button, the banner, strip and tip frames and the joystick, in every state (D77); icon-only, switchable with `NAV_ICON_ONLY`.
- Save: `settings.controls` ('arcade' | 'modern', bad or missing = arcade) and `settings.joystick` (boolean, default false), filled in `normalizeV2`. `v` stays 2.
- Decision ids renumbered from PR #37: joystick D63 → D71, landscape D64 → D72, copy D62 → D70 (PR #43 owns D62–D65). New: D76–D79.
- Art: every modern nav button, the banner, partner strip and tip band frames, and the joystick are painted from Design's NAV_MODERN v0.2 pixel art (`data/nav_art.js`, from `nav_art.json`), with normal, pressed, disabled, locked, pulse and reduced-motion states (D77). Buttons are icon-only; `NAV_ICON_ONLY = false` in `game.js` brings the text back. WALKLINGS uses the paw icon from PR #39.
- QA (Oct 15): the Contacts ALL / FAVORITES tabs are 44 px tall (were 40). Space on the last line of Ness's `phone_grant`: could not reproduce in Chromium (Space advances every line, arcade and modern, focused button or not); added a guard that eats the keyup after a Space or Enter that advanced a text box, so a focused button cannot fire on release, plus a test.
- Design green calls (Oct 15): the tip band is one line (28 px) when the text fits and two lines (44 px, clamped with an ellipsis) when it does not; it grows up from the partner strip and the map gives up the space. The joystick ring sits 8 px above the band and moves with it; toasts sit above the ring (or the band) in the free map area. D70 copy stays PLACEHOLDER.
- QA Oct 15 (PR #48): arcade no longer shows the WALK back button (a later display:flex beat the hide). In modern the gear shows its locked art and takes no taps while a scene blocks Settings (any scene once you have a partner); the opening scene keeps it live (NAV_MODERN G3). The area badge is a 44 px tap target in both layouts with the same look. The tip band re-measures when the text, the width or the font changes (it measured with fallback glyphs, then ellipsized), so the real Route 1 tip is two lines. A ?debug=1 load shows DEBUG SAVE in Settings at once.
- D70 settled (Vincent approved Design's copy): the first-walk prompt is "How do you like to walk?" with ARCADE / MODERN buttons, each with its sub-line (choice buttons can now carry one). The reminder, the modern default tip and the modern early-steps tip use the approved text. The Settings toasts and the step-8 modern toast stay PLACEHOLDER (no approved text).
- Tests: `tests/controls.spec.js`; pp_verify `verify_modern_nav`.

## 2026-10-15 — D18 Standing cap settled; D73 story writer (docs only, no new build stamp)

- D18 (Standing daily cap) settled green: cap left unbuilt and folded into the Standing pass, placeholder 5 per side per day. Row moved to `archive/DECISIONS_SETTLED.md`.
- D73 story writer (yellow, Waiting on Vincent): recommend no new writer for now; Design keeps the story, supported by a story bible skill and a QA lore check on story PRs. Revisit if D62–D65 scoping slips.
- Next free decision id is D81 (updated Oct 15 after the D69+ renumbering). D62–D68 remain reserved by open PRs #43 and Q26; D70+ for #39/#40/#41 D60 renumbers. No game code change.

## 20261015-0000 — Partner kit and worn adornments

- On the partner tab, STATS and KIT sit above FEED and use the same buttons as FEED, PLAY, and REST. KIT opens Customize & Gear. BAG stays on the Walk map only.
- The five adornments stay `bell`, `ribbon`, `scarf`, `leaf`, and `star`. They are drawn on the body: Lodge bell, Hall ribbon, Hearth scarf, Orchard sprig, Amber star. The names and the KIT label are D75. More adornments from quests are not built. The five stay free.
- Save `v` stays 2. `index.html` script tags changed, so the stamp was `20261015-0000`; restamped on the Oct 15 merge from main.

## 20261014-2346 — Phone icons, contacts, and the bag

- The Keeper1 home is an icon grid: Contacts, Notes, Walklings, Friends, KeeperUAV, Ribbit, and BOARD. The cracked handset keeps that grid. KeeperUAV is still Botnet on the thin shell. Walklings opens the WALKLINGS tab.
- Contacts lists each person you have met, one card per name. A finished scene that names them counts. Quest dialog (a scene, a line that starts a scene, or a catch scene) is marked QUEST. Every met person opens a card. FAV sorts them first. FAVORITES shows only those. `phoneBook` is `{ met, fav }`. That rule is D80.
- The bag opens when a Keeper1 or a Cracked Handset is inside. Those two items have icons. Save `v` stays 2. TB-3, Q22, Brinewick, Hall #3, and Seal 3 are not built.

## 2026-10-15 01:05 ET — Debug-mode leak fix (red, approved by Vincent; build 20261015-0101)

- The console no longer prints the debug password when a hook runs without debug, and README no longer names it.
- `pixelpets.debug` now lives in sessionStorage: debug lasts one tab session (`?debug=1` or the Settings password). Boot removes the old localStorage key, so a normal player never keeps debug.
- A save written in a debug session gains the additive field `debugSave: true` (validated in `save.js`, default false), and Settings shows `DEBUG SAVE` on the build line. Save `v` stays 2. A separate save key was considered and not used: 18 existing suites seed `pixelpets.save.v2` under `?debug=1` and read it back (D69; D70–D70 are taken by PR #43 and Q26).
- Tests: pp_verify `verify_debug_leak` (new), the full pp_verify run and `npm test`.

## 20261014-2349 — RegenX lab and the floating computer

- RegenX is four different rooms: a rug lobby, a Focus Wing with benches and a vial rack, a Records room, and a darker Arbiter bay. Nia, Cal, Dr. Ivo, Quinn, the wardens, the techs, and the records lead have their own looks. The new lines are D74.
- Bitlet, Hoverbyte, and Archivolt are the VOLT line `byte`. Bitlet floats in the Arbiter bay and can be befriended. That sets `story.rx_bitlet` and does not gate the Heights quest. `labOnly` keeps the line out of the wild roll. Save `v` stays 2. The journal counts 45 forms.
- Lab skin (FERNBROOK_HEIGHTS §3, design b9dadef; build 20261015-0148, restamped in the fix commit): the four RegenX rooms carry `"skin": "lab"` and draw white lab floors, walls, windows, a mint runner and a grey mat in place of the house planks, so they match the "white lab" text. The Arbiter Bay floor has a mint dot, and two humming tanks stand either side of the cradle (600 ms frames, still under reduced motion). The RegenX exterior is unchanged.
- Bitlet's stray lower spark is gone (the mirrored half drew it twice). The befriend lines call it "the little monitor", matching "No name on a tag".
- PR #40's decision is D74 (it was D60 in the PR body, which clashes with Fen's second talk on main).
- Q22, TB-3, Brinewick, Hall #3, and Seal 3 are not built.

## 2026-10-14 — Modern and arcade controls scoped (no new build stamp)

- Q26 is scoped and not started, from Vincent's Oct 15 sketch. Arcade is today's layout. Modern fills the walk screen with the map and drops the header, the HUD, the d-pad, the Talk button, and the tab bar there. QUEST, BAG, and MAP float top left, Settings and PHONE top right, WALKLINGS and PARTNER bottom right, the area name top centre, and the partner's name, Lv, and three bars run along the bottom. A translucent four-way joystick is a Settings option, off by default. Tap and walk-up stay the way you talk. A new game asks in the house, after the look picker, before the exit mat. An old save stays on the pad. The copy is D70, the joystick default is D71, and landscape is D72. Save `v` stays 2. No Playwright spec. `index.html` did not change, so `version.json` is unchanged. The next build stays Q19.

## 2026-10-14 — Agent rules for Cline, Claude, and AGENTS.md (no new build stamp)

- Added `.clinerules`, `CLAUDE.md`, and `AGENTS.md` with the same consolidated rules: Oct 13 Cursor/Grok build rules, the Oct 9 Supervisor / engineer / designer / QA handoff, `DESIGNER_PROMPT` role constraints, and the three `.cursor/skills` bodies.
- Indexed them from `BACKLOG.md` and `.cursor/skills/README.md`. No game code change.

## 2026-10-14 — Phone QA on the Glimmerwell pledge (no new build stamp)

- A play from a new game through the Glimmerwell pledge, the Hall hold, and Nia in the RegenX lobby. The bag threw when it tried to draw Keeper1 or the Cracked Handset, so BAG did nothing. Both handsets now have icons. Key items show their note and have no USE button. Cracked Notes are signed Handset.
- The walk tip stayed on the east-gate wild after that step was no longer the quest. It now follows the current objective. Fen's second talk, before the orchard is cleared, is one line (D60). The Hall-versus-Heights split after the pledge is D61 and was not reordered.
- The look picker's DONE button stays on a 320-wide screen. The name row stays hidden. Save `v` stays 2. `index.html` script tags did not change, so `version.json` is unchanged. `tests/qa_play.spec.js` covers the bag, the tip, the phone shell, Fen's line, and DONE.

## 20261014-1314 — Quest cards, the Route 1 stop, and party buttons that stay

- The WALKLINGS tab keeps MOVE, TO BOX, PARTNER, RELEASE, and TO PARTY labeled. The care timer was clearing every `data-act` button, including those.
- NEXT STEP shows a gold MAIN card and a blue SIDE card. Each has Objective, the place, and a status: ACTIVE, BLOCKED, or OPEN. DONE lists the last three finished main steps. SHOW ON MAP and CLOSE stay at the bottom.
- The phone side quest says to explore. It does not name the handset. Officer Ness stands at Route 1 (3, 7) the whole time. Talking to him, or three steps that do not close the distance, makes him bump into you. The Keeper1 is free and required for every trainer, by mandate of the Keeper High Court. Those lines are D59.
- Warden Ilse gives the first Walkling so a young trainer can learn to defend themselves, and she hopes you join the Keepers and use it for good. That speech is D58.
- Save `v` stays 2. TB-3, Q22, Brinewick, Hall #3, and Seal 3 are not built.

## 2026-10-14 — Town boards TB-1 and the two squares (no new build stamp)

- Empty boards stand in Hearthmoor (8, 7), Fernbrook (8, 6), Cobblecrest (16, 9), High Charity (31, 17), and Mahopac (11, 8). Fernbrook also has the Comfort flyer at (9, 6). Hearthmoor rows 7 and 9 and Fernbrook rows 6 and 7 are the squares. The phone app is BOARD, and the pane title is TOWN BOARD. Reports are marked PLACEHOLDER. Slips and bounties stay empty. A glimmer pledge still reads the Lantern Post in Hearthmoor. Cobblecrest becomes Bright Notice after the quarry buyout. Save `v` stays 2. This commit did not change script tags. After merging main, the live stamp is `20261014-1100`.
- The board sprites are the grids in `data/town_board_art.json`. `tests/town_board.spec.js` covers the empty piles, the mastheads, and the phone app at 320. Brinewick, Hall #3, Seal 3, Q22, and TB-3 are not built.

## 20261014-1100 — Keep both the party board and the care tools

- Q20 stays look and listen. Q21 stays the Lantern Council, with D50–D55. Q22 stays the Capital Partnership Briefing, and it is not built.
- Rename, the Vol slider, and the welcome-back line are Q23, Q24, and Q25. The open lines are D56 and D57.
- The stats card has RENAME and GEAR. The Walkling sheet NAME field stores a nickname with the same rule: empty, or the species name, clears `nick`. The sheet does not toast. Save `v` stays 2.
- At the time of that commit, town boards were still described as blocked on D37–D49. The town-list calls are settled on this branch, and TB-1 is in the game here. Brinewick still waits on a one-pager.

## 2026-10-14 — Town-board calls settled (no new build stamp)

- Vincent settled the town-list D37 and D38–D49. Every current town gets a board, and so does every future town, including Brinewick when its map exists. Routes, Wickerglen, Old Meadow, the quarry, the Heights, RegenX, and the tunnels do not. Mahopac gets an uncrested board at (11, 8) and no slips for a while. The phone pins a slip. The NPC's yes is the accept. KeeperUAV stays the blank watch desk for now and later carries faction-related abilities. The first build is empty boards, live reports, and the phone app. It is not in the game. Save `v` stays 2. `version.json` stays `20261014-0942`.
- Daily Standing (D18) is wanted, and it should arrive slowly. The cap is still open, so it stays unbuilt.
- "S11 - yes" is recorded as D11: the objective cue before the starter stays. The region-map D37 is still open. Q22, Brinewick, Hall #3, and Seal 3 stay unbuilt. No new Playwright spec.

## 2026-10-14 — Documentation audit (no new build stamp)

- Status lines that still called finished work the next build are corrected. Builds 4–6, the Sacrifice stub, Rook's closer, the Walkling-sheet rename, the STANDING tab, and `LANYARD_TIER2` are in the game. The quest chain is 26 rows with 10 glimmer overrides. The bottom tabs are PARTNER, WALK, WALKLINGS, and QUEST. The look picker has 8 hair styles, 14 hair colours, 6 outfits, and 5 accessories. Save `v` stays 2. `index.html` did not change, so `version.json` stays `20261014-0942`.
- D37 is recorded as a collision and is not renumbered. The open-table row is the region-map claim list, already in the game. The town-board row is which maps get a board, and it is not built. The next free id at that writing was D56. Q22, Brinewick, Hall #3, and Seal 3 stay unbuilt.
- The designer prompt no longer asks for Route 2, Cobblecrest, or R5 as if they lived off `main`, and it no longer asks for a Standing tab or a tier-2 lanyard that already shipped. No new Playwright spec.

## 20261014-0942 — Party board, look and listen, Lantern Council

- The WALKLINGS tab is six party slots, then the box, then LEFT BEHIND, then the journal. MOVE reorders the party. TO BOX and TO PARTY move one Walkling. RELEASE asks first and will not drop the last Walkling. Releasing the partner promotes the next party member, or the first boxed Walkling when the party is empty. LEFT BEHIND shows the nick, the reason, and the raw data. Hunger pauses in the box. The sheet can use a field snack, rename, reorder moves, hold a Soft Berry, Bracer Band, or Kin Ribbon, pick an accessory, and set a call (Charge, Brace, Dart, or Greet). Save `v` stays 2.
- Look and listen (Q20): `seal_glim_2` is `LANYARD_TIER2`. Imogen and Hollis have their own looks. Rook wears a lanyard once Glimmerwell has claimed him, and it comes off when he converts. `town_glimmer`, `quarry`, and `grove` play from `trackFor`. The player look picker still has no lanyard.
- The Lantern Council (Q21) is in Sky-Dock Command after Cobblecrest, Keepers only. The quest row covers the Event Hall pointer until the council is done. The Seals are named in dialog. Brinewick stays dark. `hc_council_k` is 10 Keepers Standing, once. Town boards keep Q19 and D37–D49. The council calls are D50–D55. The Capital Partnership Briefing is Q22 and is not built.
- Tests at 320, 375, and 390: `tests/box_app.spec.js`, `tests/party_board.spec.js`, `tests/party_qa.spec.js`, `tests/walkling_sheet.spec.js`, `tests/deploy_held.spec.js`, `tests/look_listen.spec.js`, `tests/lantern_council.spec.js`, `tests/qa_gaps.spec.js`. Standing at 320.

## Documentation skills

- Skills live in `.cursor/skills/`. The index is `.cursor/skills/README.md`. `walklings-quests` covers side quests, town-board slips, and bounties. `walklings-docs` covers backlog, changelog, next steps, and the other status docs.
- Q23, Q24, and Q25 are in the game: rename, the music volume slider, and the welcome-back line. Q20–Q22 stay look and listen, the Lantern Council, and the unbuilt Capital Partnership Briefing. TB-1 is on main. TB-3 is not started. Brinewick still waits on a one-pager.
- The older systems list and the tech-debt notes now match that: the box, the orphan row, the installable app, and the save copy are in the game. The quest skill matches `evalCond`, Mom's last step `dream_study`, and the KeeperUAV and Botnet job lines.

## 20261014-1027 — Rename, music volume, welcome back

- STATS → RENAME changes a nickname you already gave. The cleaning is the same 10-character set. An empty field, or the species name, clears `nick`. CANCEL and Escape leave the old name. Save `v` stays 2.
- The Vol slider sits beside Music. It runs 0–100 and stores `settings.musicVol` from 0 to 1. Music on/off stays its own switch. A 0 level is silent and leaves Music ON. The iPhone silent-switch listen-through is still open.
- Fourteen hours away, the partner tab says the Walkling waited, after the daily hello. A shorter gap says nothing. FOOD and JOY still stop at 20. NRG still stops at 10.
- These three were first written as Q20–Q22 and D50–D51. Those ids already belong to look and listen, the Lantern Council, and the Capital Partnership Briefing. They are Q23–Q25, D56, and D57.
- Tests: `tests/care_tools.spec.js`. Shots: `screenshots/care/`. Town boards stay blocked on D37–D49. Brinewick still waits on a one-pager.

## 20261014-0751 — Box screen and installable app (Q17, Q18)

- The WALKLINGS tab labels the party, then WALKLING-BOX, then LEFT BEHIND. UP and DOWN reorder inside that list. RELEASE asks, then LET THEM GO removes the Walkling. Releasing the partner promotes the next party member, or the first boxed Walkling when the party is empty.
- An orphan row shows the reason and the raw data that could not be migrated. Unknown fields stay on the Walkling. Save `v` stays 2.
- `manifest.json` and `sw.js` cache the same-origin shell so the game can be added to the home screen and opened offline. `version.json` stays on the network. Location lookups are still a network call and still fall back to meadow. The icon is a sprout Walkling.
- Tests: `tests/box_app.spec.js`. Shots: `screenshots/box/`. Brinewick still waits on a one-pager.

## Older entries

See [`archive/CHANGELOG_2026-10-14_and_earlier.md`](archive/CHANGELOG_2026-10-14_and_earlier.md).
