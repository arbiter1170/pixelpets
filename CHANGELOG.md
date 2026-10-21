# Changelog

Newest first. The build stamp is `version.json` and the `?v=` on each script in `index.html`. Status of open work is `BACKLOG.md`. The queue is `NEXT_PLAN.md` §3. Agent skills are in `.cursor/skills/README.md`.

## 2026-10-21 08:51 ET: Shared overlay open-guard (build 20261021-0851)

- What changed and why: The tap that closes a line could still press a button in the location card or the tune sheet when those open on that same tap. `guardOverlayOpen` is now the one shared helper. It accepts a tap only when that tap's pointerdown or touchstart landed inside the panel after it opened. A lift with no such start is ignored however long the finger was held. The wardrobe picker, the location card, every sheet, and the other panels a line or a button can open use it. Choices, the name buttons, the basket, the look picker and the quest panel keep their 500 ms window and also ignore a finger that was already down. Keyboard Space and Enter still work. Save stays `pixelpets.save.v2` with `v` 2. Green bug fix. No new id.
- Files touched: `game.js`, `cloud.js`, `tests/tap_guard.spec.js`, `tests/README.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261021-0851. `python3 tools/bump_build.py --check` exit 0.
- Tests run and result (widths, checks): `node tools/pp_test.js` on tap_guard, wardrobe, tap_interact, walkling_sheet, arbiter_test, glimmer_briefing, look_keys, look_listen, mahopac, qa_play, controls, smoke, hushwater_b0, deploy_held, qa_gaps, market_row, quest_multi, and civic. PP_TEST RESULT: PASS exit=0 passed=369 failed=0 flaky=0 skipped=12 time=283s. RTDB_RULES RESULT: PASS. The new touch checks run at 390. Widths 320, 375 and 390. Console errors: none (a spec fails the run on a console error).
- Decisions made (colour + reasoning): Green. No new id. No id was renumbered. Next free id stays D397.
- Anything left unfinished: P4 stores are not started. Database rules are not deployed. The client is not deployed.

## 2026-10-21 07:33 ET: Wardrobe gesture guard (build 20261021-0733)

- What changed and why: A finger already down when Stitch & Lantern opens was still buying if it lifted after 350ms. The picker now takes a tap only when that tap's pointerdown or touchstart landed inside it after it opened. A lift with no such start is ignored however long it was held. Keyboard Space and Enter still work. The check is `guardOverlayOpen`, so other overlays can use it later. Save stays `pixelpets.save.v2` with `v` 2. Green bug fix. No new id.
- Files touched: `game.js`, `tests/wardrobe.spec.js`, `tests/README.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261021-0733. `python3 tools/bump_build.py --check` exit 0.
- Tests run and result (widths, checks): `node tools/pp_test.js` on wardrobe, market_row, tap_interact, and smoke. PP_TEST RESULT: PASS exit=0 passed=68 failed=0 flaky=0 skipped=4 time=71s. RTDB_RULES RESULT: PASS. The touch checks run at 390. Widths 320, 375 and 390. Console errors: none (a spec fails the run on a console error).
- Decisions made (colour + reasoning): Green. No new id. No id was renumbered. Next free id stays D397.
- Anything left unfinished: `#ovGeo` can still open on the same closing tap when location is unset. A scene step that opens `#ovSheet` on that same turn (the tune pick) can too. Those are noted and not changed. P4 stores are not started. Database rules are not deployed. The client is not deployed.

## 2026-10-21 07:21 ET: Wardrobe ghost tap (build 20261021-0721)

- What changed and why: The tap that closes Keeper Marigold's line was also clicking the wardrobe card underneath. The picker now ignores pointer, touch and click for 350ms after it opens. Keyboard Space and Enter are left alone. Save stays `pixelpets.save.v2` with `v` 2. Green bug fix. No new id.
- Files touched: `game.js`, `tests/wardrobe.spec.js`, `tests/market_row.spec.js`, `tests/coop_r2.spec.js`, `tests/README.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261021-0721. `python3 tools/bump_build.py --check` exit 0.
- Tests run and result (widths, checks): `node tools/pp_test.js` on wardrobe, market_row, tap_interact, and smoke. PP_TEST RESULT: PASS exit=0 passed=67 failed=0 flaky=0 skipped=2 time=61s. RTDB_RULES RESULT: PASS. The ghost-tap check runs at 390. Widths 320, 375 and 390. Console errors: none (a spec fails the run on a console error).
- Decisions made (colour + reasoning): Green. No new id. No id was renumbered. Next free id stays D397.
- Anything left unfinished: `#ovGeo` can still open on the same closing tap when location is unset. A scene step that opens `#ovSheet` on that same turn (the tune pick) can too. Those are noted and not changed. P4 stores are not started. Database rules are not deployed. The client is not deployed.

## 2026-10-21 07:00 ET: Parked Coach roof merge and holder label (build 20261021-0700)

- What changed and why: Merged `origin/main` (Parked Coach barrel roof, #129, fc7b020) into wardrobe v1. Kept the `roof_coach` tile, diner rows 29-32, the door at (4, 31) and the mat landing `ty` 32, plus every P3 wardrobe change. `data/mapdata.js` was regenerated from the merged JSON. The look picker preview label is now "Your holder". Lowercase keeper is banned. Green wording fix. No new id. Save stays `pixelpets.save.v2` with `v` 2.
- Files touched: `data/detail_zz_market.json`, `data/mapdata.js`, `sprites.js`, `tests/market_row.spec.js`, `index.html`, `version.json`, `CHANGELOG.md`.
- Commit(s) + build id: merge of fc7b020, build 20261021-0700. `python3 tools/bump_build.py --check` exit 0.
- Tests run and result (widths, checks): `node tools/pp_test.js` on wardrobe, market_row, world_clock, house_reskin, map_layers, interior_walls, look_keys, look_listen, mahopac, lizzy, and smoke. PP_TEST RESULT: PASS exit=0 passed=192 failed=0 flaky=0 skipped=0 time=123s. RTDB_RULES RESULT: PASS. Widths 320, 375 and 390. Console errors: none (a spec fails the run on a console error).
- Decisions made (colour + reasoning): Green. No new id. No id was renumbered. Next free id stays D397.
- Anything left unfinished: P4 stores are not started. Database rules are not deployed. The client is not deployed. Rules for project walklings-4cc89 go out before the client merge.

## 2026-10-21 06:33 ET: Wardrobe v1 (build 20261021-0633)

- What changed and why: WORLD_CLOCK_TOWN P3. Keeper Marigold opens Stitch & Lantern. Six Walkling adornments and four holder pieces are for sale, and four outfit colours (Sky, Yellow, Lime, White) cost 60 Acorns. The seven outfit colours already in the game stay free. A paid Walkling item has one wearer. Releasing that Walkling puts the item back on the rack and keeps the flag. CHANGE LOOK, the intro mirror, shuffle and GEAR ADORN list free and owned items only. Closing the picker writes the holder look once when you are in a shared room. The room rules also let skink, otter, owl and snail join. Save stays `pixelpets.save.v2` with `v` 2. The only new data are `wardrobe.*` flags.
- Files touched: `game.js`, `keeper.js`, `save.js`, `net.js`, `database.rules.json`, `index.html`, `style.css`, `data/detail_zz_market.json`, `data/mapdata.js`, `tools/rtdb_rules_test.js`, `tests/wardrobe.spec.js`, `tests/coop_r2.spec.js`, `tests/market_row.spec.js`, `tests/mahopac.spec.js`, `tests/lizzy.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `version.json`, `screenshots/partner/adornments-320.png`.
- Commit(s) + build id: this branch, build 20261021-0633. `data/mapdata.js` was regenerated. `python3 tools/bump_build.py --check` exit 0.
- Tests run and result (widths, checks): `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1465 failed=0 flaky=0 skipped=116 time=1277s. RTDB_RULES RESULT: PASS. `tests/coop_r2.spec.js` and `tests/play_together.spec.js` were also run in separate processes before that (PASS, 11 and 27). Widths 320, 375 and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (a spec fails the run on a console error).
- Decisions made (colour + reasoning): D395 and D396 are SETTLED, green, on Design's defaults, by the Supervisor on Oct 21, 2026. D363-D379 and D390-D396 stay reserved. Next free id is D397. No id was renumbered. D75 stays open. The six shop adornments are not that quest list.
- Anything left unfinished: P4 stores are not started. Database rules are not deployed. The client is not deployed. Rules for project walklings-4cc89 go out before the client merge.

## 2026-10-21 03:52 ET: Keeper Teague, hm_ looks, and Undertow (build 20261021-0352)

- What changed and why: Design tip bb5b716. The Lamplight day clerk is Keeper Teague (`hm_teague`), with look `hm_teague` and a cast row of their own beside Keeper Quill. High Charity's Keeper Rowan stays, including the `sorrel` portrait and the old reputation row. Market Row look keys now use the `hm_` prefix: `hm_quill`, `hm_teague`, `hm_marigold`, `hm_hesper`, `hm_arlo`, `hm_diner_regular`, `hm_court_regular`. The diner regular and court regular ids stay. Lichlet (`snail/0`) learns Undertow at level 12 instead of Boulder Drop, so a wild Screeback does not learn Boulder Drop twice. Screeback (`snail/1`) still learns Boulder Drop at level 0. Wren stays at (17, 31). The busy store and diner floors stay. Save stays `pixelpets.save.v2` with `v` 2. No new save key.
- Files touched: `data/detail_zz_market.json`, `data/reputation.json`, `data/mapdata.js`, `moves.js`, `tests/market_row.spec.js`, `tests/hushwater.spec.js`, `tests/README.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261021-0352. `origin/main` was already contained (a9f187f). No merge commit. `data/mapdata.js` was regenerated.
- Tests run and result (widths, checks): `node tools/pp_test.js` on market_row, world_clock, house_reskin, interior_walls, hushwater, look_keys, reputation, and highcharity. PP_TEST RESULT: PASS exit=0 passed=147 failed=0 flaky=0 skipped=0 time=105s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (a spec fails the run on a console error). High Charity's Keeper Rowan still resolves to `sorrel`.
- Decisions made (colour + reasoning): No new id. No id was renumbered. Next free id is D395. The name, the `hm_` prefix, and Undertow follow design tip bb5b716. D391 busy floors stay.
- Anything left unfinished: P3 wardrobe and P4 stores are not started. The clock card still lists Lizzy, Pip, Wren, Ossabell, and Mr. Gristle. The clerk was not on that card.

## 2026-10-21 03:44 ET: Market Row court tiles and look keys (build 20261021-0344)

- What changed and why: Green fixes on the Market Row branch. On a weekday after school, Pip stays on court tile (16, 31) and Wren stands on (17, 31), so both show. The Market Row look keys are namespaced `mr_quill`, `mr_rowan`, `mr_marigold`, `mr_hesper`, `mr_arlo`, `mr_diner_regular` and `mr_court_regular`. Each is defined once. The busy store and diner floors stay as D391 approved them. Save stays `pixelpets.save.v2` with `v` 2. No new save key.
- Files touched: `data/detail_zz_market.json`, `data/detail_lizzy.json`, `data/mapdata.js`, `tests/market_row.spec.js`, `tests/README.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261021-0344. `origin/main` was already contained (a9f187f). No merge commit. `data/mapdata.js` was regenerated.
- Tests run and result (widths, checks): `node tools/pp_test.js` on market_row, world_clock, house_reskin, interior_walls, hushwater, look_keys, and reputation. PP_TEST RESULT: PASS exit=0 passed=117 failed=0 flaky=0 skipped=0 time=72s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (a spec fails the run on a console error). `highcharity` and `civic` were not run; those files were not edited.
- Decisions made (colour + reasoning): No new id. No id was renumbered. Next free id is D395. Splitting the court tiles is green. Namespacing the new look keys is green. D391 busy floors stay. The Lamplight clerk is still named Keeper Rowan until Design sends a new name. High Charity's Keeper Rowan is unchanged.
- Anything left unfinished: The Lamplight clerk still shares the name Keeper Rowan, the portrait fallback, and the reputation row with High Charity. P3 and P4 are not started.

## 2026-10-21 03:00 ET: Hearthmoor Market Row (build 20261021-0300)

- What changed and why: WORLD_CLOCK_TOWN P2. Hearthmoor grows from 24x24 to 24x34. Rows 0-22 stay. Row 23 opens at x9-10 onto Market Row: Lamplight Provisions, Stitch & Lantern, the Parked Coach, and Lanternball Court. The store sells the usual snacks. Keeper Rowan has the day shift and Keeper Quill the night shift. Keeper Marigold says the racks are still going up. There is no wardrobe shop, no clothing price, and no wardrobe flag. The diner serves Coach Stew (30), Berry Stack (40) and Hearth Plate (70). A Walkling at FOOD 98 or more hears "Too full." The day's Warm Bowl is free there too. A court hoop says "Take a shot. The hoop lantern flares." It does not start a game. Lizzy, Pip, Wren and Ossabell now land on the diner and the court when their P1 rows say so. Officer Bren steps off the road for the lunch hour and sits in the diner. Interiors no longer take the lamp wash, so the lodge shade stays `#5c4033` at every clock time. Dawn, dusk and night still wash outdoor maps. Screeback (`snail/1`) learns Boulder Drop, a STONE move, in place of Shell Roll. Save stays `pixelpets.save.v2` with `v` 2. No new save key. Co-op Hearthmoor is 24 by 34 so a spot on the row is in bounds.
- Files touched: `game.js`, `sprites.js`, `moves.js`, `net.js`, `data/detail_zz_market.json`, `data/detail_hushwater.json`, `data/reputation.json`, `data/mapdata.js`, `tests/market_row.spec.js`, `tests/world_clock.spec.js`, `tests/house_reskin.spec.js`, `tests/interior_walls.spec.js`, `tests/tap_interact.spec.js`, `tests/hushwater.spec.js`, `tests/civic.spec.js`, `tests/hearthmoor_polish.spec.js`, `tests/lizzy.spec.js`, `tests/map_layers.spec.js`, `tests/maps_b4.spec.js`, `tests/maps_b7.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261021-0300. `data/mapdata.js` was regenerated.
- Tests run and result (widths, checks): `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1440 failed=0 flaky=0 skipped=114 time=1276s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (a spec fails the run on a console error). `tests/house_reskin.spec.js` samples the lodge floor at Tuesday 12:00 and Sunday 21:00. Both read `#5c4033`.
- Decisions made (colour + reasoning): D363-D379 and D390-D394 stay settled. No new id. No id was renumbered. Next free id is D395. P2 is on this branch. P3 and P4 are not started. Meal prices sit inside D366 (30-70): Coach Stew 30, Berry Stack 40, Hearth Plate 70. That split is green. Interior floors stay unwashed because D376 names outdoor dawn, dusk and night washes, and the lamp disc was tinting the lodge floor. That fix is green. Boulder Drop on Screeback is green: it is the STONE move the other STONE stage-1 lines already learn at that step. Diner seats were shifted off the aisle so a tap can reach the counter. That is green. Each new building has one porch prop so the variety check still holds. Court chalk is a flat decal on the gravel. The B4 prop-density windows stay on the original 24 rows. The town-map tile size for Hearthmoor is 15, 13 and 10. Specs that watch Officer Bren pin Tuesday 10:00, because lunch takes him off the road. Those are green.
- Anything left unfinished: P3 wardrobe (picker, BUY, WEAR, clothing prices, wardrobe flags) and P4 stores are not started. The court shot does not keep score. FRIEND SLOT lines for the diner regular and the court regular stay placeholders.

## 2026-10-21 01:01 ET: World clock v1 (build 20261021-0101)

- What changed and why: WORLD_CLOCK_TOWN P1. One in-game day is 42 real minutes, counted from a fixed epoch, so the clock is not stored. The header chip shows the day and time. On modern controls it sits under the phone button, so the Hearthmoor north trail and the phone stay tappable. At 320 the arcade chip stacks the glyph over the time so the debug button stays clear. Tap it for who is about. Dawn and dusk wash outdoor maps. Night keeps the dark overlay, and the night tag follows the game clock (20:00–05:00). Lamps are on from 19:00 to 06:00. Lizzy (and Buddy), Pip, Wren, Ossabell and Mr. Gristle follow schedules. A test map that reuses those names is left alone. During school hours, talking to Lizzy in the classroom sets the same leak flag as the bucket. Away notes are tap-only. When the tracked side step is the leak and that person is off this map, a rest spot can offer Wait until. It is hidden in a party and it is not saved. Weather stays a stub (`wx:` is always false). Daily care, the Warm Bowl, and the daily hello stay on the real calendar. The Hearthmoor and Old Meadow signs say holders. The look toast says holder and stays within 40 characters. Save stays `pixelpets.save.v2` with `v` 2. No new top-level key. P2, P3 and P4 are not in this build.
- Files touched: `clock.js`, `game.js`, `env.js`, `index.html`, `style.css`, `quests.js`, `data/detail_lizzy.json`, `data/maps_slice.json`, `data/mapdata.js`, `tests/world_clock.spec.js`, `tests/lizzy.spec.js`, `tests/leak5b.spec.js`, `tests/tap_interact.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: 6c89e03, 904abdb, and the merge of origin/main 9653148 (HUSHWATER B2, PR #126), build 20261021-0101. `data/mapdata.js` was regenerated, not hand-merged. `SPECIES_IDS` keeps B2's append (skink, otter, owl, snail). The clock stores nothing in the save.
- Tests run and result (widths, checks): After merging origin/main 9653148, `node tools/pp_test.js` on world_clock, hushwater, hushwater_b0, data_integrity, lizzy, look_keys, save_copy, and smoke. PP_TEST RESULT: PASS exit=0 passed=156 failed=0 flaky=0 skipped=3 time=91s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error). The full suite is left for the Supervisor on main.
- Decisions made (colour + reasoning): D363–D379 and D390–D394 are reserved for WORLD_CLOCK_TOWN and archived as written (those rows still say Not built). D380–D389 stay PLAYTEST_FIX_1020. No id was renumbered. Next free id is D395. Tile nudges for Pip, Wren, Ossabell and Mr. Gristle are green and noted in the PR. The holder toast and the two signs are green copy.
- Anything left unfinished: P2 Market Row, P3 wardrobe, and P4 stores are not started. The diner and the Lanternball Court are not maps yet, so those schedule rows are skipped and the person stays on a map you can reach. Two FRIEND SLOT students are not placed.

## 2026-10-21 00:11 ET: Hushwater species, twelve forms (build 20261021-0011)

- What changed and why: HUSHWATER B2 (design e7ee796, A1 art signed off). Four lines, twelve forms: skink (Tindlet, Cinderskink, Kilncrest), otter (Rimelet, Frostrill, Spraymane), owl (Hushlet, Quillhush, Vesperowl), snail (Lichlet, Screeback, Cairnshell). The signed-off halves are appended in `sprites.js` verbatim. Stage totals are 192 / 256 / 320. Learnsets use moves already in the game. `SPECIES_IDS` appends skink, otter, owl, snail. Save stays `pixelpets.save.v2` with `v` 2. No new key and no new pet field. The journal is 57. The form table is 60 ids. The three Hushwater spawn tables roll the new lines at Lv 19–23. Fenna, Nils and Ottilie appear. Each has a reputation cast row (faction none, base 50), the same way Keeper Scout does, so the cast check stays quiet. `hw_arrive_w` moved from (1,10) to (2,10), so the first step in from Wickerglen plays the arrive line. The Fallstair rope stays at (11,1). The mouth stays (11,0).
- Files touched: `sprites.js`, `stats.js`, `moves.js`, `save.js`, `data/detail_hushwater.json`, `data/reputation.json`, `data/mapdata.js`, `tests/hushwater.spec.js`, `tests/data_integrity.spec.js`, `tests/look_keys.spec.js`, `tests/walkling_sheet.spec.js`, `tests/party_board.spec.js`, `tests/party_qa.spec.js`, `tests/hushwater_b0.spec.js`, `tests/fetch_line.spec.js`, `tests/heights.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261021-0011.
- Tests run and result (widths, checks): `node tools/pp_test.js` on hushwater, data_integrity, look_keys, walkling_sheet, party_board, party_qa, hushwater_b0, fetch_line, and heights at 390. PP_TEST RESULT: PASS exit=0 passed=49 failed=0 flaky=0 skipped=1 time=33s. RTDB_RULES RESULT: PASS. `npm run test:agent` PP_TEST RESULT: FAIL exit=1 passed=1396 failed=1 flaky=0 skipped=115 time=1202s. The one failure was `coop_r2` "hidden tab greys the partner and drops at 60 s" because WebKit was not installed in this environment. After `npx playwright install webkit`, `node tools/pp_test.js tests/coop_r2.spec.js` PP_TEST RESULT: PASS exit=0 passed=10 failed=0 flaky=0 skipped=20 time=47s. RTDB_RULES RESULT: PASS. `node tools/pp_test.js tests/play_together.spec.js` PP_TEST RESULT: PASS exit=0 passed=27 failed=0 flaky=0 skipped=54 time=268s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none on the passing specs (a spec fails the run on a console error).
- Decisions made (colour + reasoning): D347 stays settled (Vincent, 11:34 AM ET Oct 20, 2026, on the defaults). The 12 forms are in this build. D355, D356 and D362 are green and settled: the stat totals, the learnset shape, and appending the four species ids. D350: `hw_arrive_w` is now (2,10), one step inside the Wickerglen landing. D352: the Fallstair mouth is (11,0) and the rope stays at (11,1). D346 stays the Lizzy placeholder, settled and not built. No new id. No id was renumbered. D380–D389 stay PLAYTEST_FIX_1020. Next free id is D363, then D390.
- Anything left unfinished: the Lizzy slot (D346) is not built. The backdrop rebuild (Design M1) is not in this branch. The optional map pieces (weir, spray, stair-rope art) are not in this build. The maps still use the existing props.
## 2026-10-20 22:15 ET: Hushwater maps, gates, and a fresh id when two pets share one (build 20261020-2215)

- What changed and why: HUSHWATER B1 plus engine rows E1–E4 (design tip 9835ccb, status only; content matches 64764b0). Three outdoor maps sit on the stream between the quarry and Wickerglen. Both ends stay shut until `story.cobble_end`. Spawn rows whose species this client does not know are skipped, so the tables roll the species already in the game at Lv 19–23. Fenna, Nils and Ottilie stay out of the world until their forms exist (B2). A reload inside Hushwater stays on that map. The region map names the place HUSHWATER. `story.hw_reached` is listed with the other flags that are not chain steps, so the quest check stays quiet. Keeper Scout has a cast row, the same way Ally A does, because the camp names that scout. If an unknown-species pet's id matches another pet, that pet gets a new id. Every other field stays. The pet is not dropped. Ids stay unique across the party and the box. Save stays `pixelpets.save.v2` with `v` 2. No new key and no new pet field.
- Files touched: `data/detail_hushwater.json`, `data/mapdata.js`, `data/reputation.json`, `game.js`, `save.js`, `quests.js`, `tests/hushwater.spec.js`, `tests/tap_interact.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261020-2215. Merged origin/main (#124, b1f2152, build 20261020-2201) and restamped 20261020-2301. `data/mapdata.js` was regenerated.
- Tests run and result (widths, checks): `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1383 failed=0 flaky=0 skipped=114 time=1216s. RTDB_RULES RESULT: PASS. After merging #124: `node tools/pp_test.js tests/hushwater.spec.js tests/tap_interact.spec.js tests/rook_foreshadow.spec.js tests/glimmer_fernbrook.spec.js tests/data_integrity.spec.js tests/smoke.spec.js` PP_TEST RESULT: PASS exit=0 passed=102 failed=0 flaky=0 skipped=3 time=82s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error). `tests/hushwater.spec.js` covers the gates, both-way walk, the first step in, the rope, the hidden holders, the filtered spawn tables, a reload in `hw_cut`, the region card, and the duplicate-id guard.
- Decisions made (colour + reasoning): D348–D353 were yellow and are settled by Vincent at 9:49 PM ET Oct 20, 2026, early, on the defaults. They are archived. D346 stays the Lizzy placeholder, settled and not built. D347 stays settled on the defaults (B0). D354–D362 stay green. D346–D362 stay reserved for HUSHWATER. No new id. No id was renumbered. Next free id is D363, then D390.
- Anything left unfinished: B2 (the 12 forms) and the Lizzy slot (D346) are not built. The backdrop rebuild (Design M1) is not in this branch; the node sits on the existing picture. The west arrive trigger shares the Wickerglen landing tile, so that line plays after a step off and back. The Fallstair rope in the data is one tile south of the (11,0) line in D352. Both are left as written.

## 2026-10-20 22:01 ET: Rook hint lines and the doorstep reveal (build 20261020-2201)

- What changed and why: ROOK_FORESHADOW (design bfe356a, status stamp 9835ccb). Rook hints at the sign-up before the Trial Hall doorstep, and both paths hear the reveal there. Tobin no longer names him at the pledge. Save stays `pixelpets.save.v2` with `v` 2. No new key. Lizzy's lines are not edited.
- Files touched: `data/interiors.json`, `data/maps_slice.json`, `data/glimmer_path.json`, `data/act1_route2.json`, `data/detail_wayup.json`, `data/mapdata.js`, `tests/rook_foreshadow.spec.js`, `tests/README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261020-2201.
- Tests run and result (widths, checks): `node tools/pp_test.js` on rook_foreshadow, glimmer_fernbrook, standing, smoke, rook_crossroads, wording_guard, data_integrity, lizzy, reputation, heights, glimmer_route2, debug_mode, controls, quest_multi, town_board_gate, faction_music, look_listen, house_reskin, heart_alert, fetch_line, civic, arbiter_test, and maps_b4. PP_TEST RESULT: PASS exit=0 passed=524 failed=0 flaky=0 skipped=10 time=369s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. At 320x568 each new line fit one dialog page. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D339–D341 were already settled by Vincent at 8:40 AM ET on Oct 20, 2026, on the defaults. D342 is green and already shipped with Lizzy. D343 and D344 were settled by Vincent at 9:49 PM ET on Oct 20, 2026, early, on the defaults. D345 is green (Design). No new id. No id was renumbered. Next free id is D363, then D390. Syncing Rook's two lines in `detail_wayup.json` is green: that overlay copies the whole NPC and applies last, so the settled lines would not play otherwise.
- Anything left unfinished: the design checker runs after merge. The post-reveal arc is unchanged.

## 2026-10-20 14:51 ET: Warden lodge sign says holders (build 20261020-1451)

- What changed and why: The Hearthmoor lodge sign `hm_sign_lodge` now says "New holders, knock and come in." Design settled this green copy fix with no new decision id. Save stays `pixelpets.save.v2` with `v` 2. No new key.
- Files touched: `data/maps_slice.json`, `data/detail_wayup.json`, `data/mapdata.js`, `tests/wording_guard.spec.js`, `tests/README.md`, `index.html`, `version.json`, `CHANGELOG.md`.
- Commit(s) + build id: beec157, build 20261020-1451. The Supervisor merged main (#122 build 20261020-1433) into it and restamped it 20261020-1459.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/wording_guard.spec.js tests/smoke.spec.js tests/data_integrity.spec.js` PP_TEST RESULT: PASS exit=0 passed=93 failed=0 flaky=0 skipped=6 time=30s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. `git grep -n "New keepers"` returns nothing. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): green, settled by Design. No new id. No id was renumbered.
- Anything left unfinished: none from this build.

## 2026-10-20 14:33 ET: Unknown species stays in the party and the box (build 20261020-1433)

- What changed and why: HUSHWATER B0 (design tip 64764b0, acceptance 11). A species id this client does not know stays in the party or the box, keeps its moves and journal keys, and draws a fallback picture. The journal names it ???. It is not battle-ready: it cannot lead, and SWAP skips it. Save stays `pixelpets.save.v2` with `v` 2. No new field. A v1 unknown index and an already-orphaned row still stay in orphans. B1, E1–E4 and B2 are not in this build. Out there stays 45. Merged origin/main (PRs #119, #120 and #121) and kept both sides.
- Files touched: `save.js`, `sprites.js`, `stats.js`, `game.js`, `tests/hushwater_b0.spec.js`, `tests/README.md`, `OPEN_DECISIONS.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: this branch, build 20261020-1433. Merge of origin/main at f1cccdc.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/hushwater_b0.spec.js tests/smoke.spec.js tests/wording_guard.spec.js tests/data_integrity.spec.js tests/save_copy.spec.js tests/box_app.spec.js tests/party_board.spec.js tests/party_qa.spec.js tests/unlock.spec.js tests/partner_ui.spec.js` PP_TEST RESULT: PASS exit=0 passed=210 failed=0 flaky=0 skipped=12 time=142s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `node tools/pp_test.js tests/play_together.spec.js` on its own PP_TEST RESULT: PASS exit=0 passed=27 failed=0 flaky=0 skipped=54 time=271s. RTDB_RULES RESULT: PASS. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error). `python3` hushwater_check.py FAIL: packet files missing (detail_hushwater.json is not in the packet copy). It exits before the row checks. Rows outside B0 were not built.
- Decisions made (colour + reasoning): D347 was settled by Vincent at 11:34 AM ET Oct 20, 2026, on the defaults. D357 is green. No new id. No id was renumbered. D346–D362 stay reserved for HUSHWATER. D380–D389 shipped on main in #121 and stay those ids. Next free id is D363, then D390.
- Anything left unfinished: B1, E1–E4 and the 12 forms (B2) are not built.

## 2026-10-20 13:22 ET: North lane, HP bar, and a light phone tile (build 20261020-1322)

- What changed and why: PLAYTEST_FIX_1020 (design 0b0c3dc, tip 64764b0). Hearthmoor stays 24 by 24. The north trail is a three-tile mouth at (8, 2), (9, 2) and (10, 2), with a grass lane on x 8–10 down to the row 7 path. Warden's Lodge door is (15, 6) and Rook's House door is (20, 5). Coming back from Mahopac lands at (9, 3). The Mahopac quest step points at (9, 2). Mahopac tiles and sight lines stay. The partner card leads with an HP bar and shows no numbers. Under a quarter the bar uses PAL r and does not blink. The card's aria-label says HP and the two counts after the level. The Keepers phone tile plate is PAL w. The Glimmerwell phone tile stays dark. D380 (the Settings build line) already shipped in #118 and this build does not change that CSS. Save stays `pixelpets.save.v2` with `v` 2. No new key.
- Files touched: `data/detail_wayup.json`, `data/mapdata.js`, `data/nav_art.js`, `game.js`, `index.html`, `quests.js`, `style.css`, `version.json`, `tests/mahopac_lane.spec.js`, `tests/mahopac.spec.js`, `tests/maps_b4.spec.js`, `tests/maps_b5.spec.js`, `tests/obs_fix.spec.js`, `tests/pathfinding.spec.js`, `tests/stair_marker.spec.js`, `tests/tap_interact.spec.js`, `tests/partner_ui.spec.js`, `tests/play_together.spec.js`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `tests/README.md`, `TOWN_BOARD.md`, `CHANGELOG.md`.
- Commit(s) + build id: 4bc2837, build 20261020-1322. The Supervisor merged main (#120 build 20261020-1302, #119 build 20261020-1344) into it and restamped it 20261020-1359.
- Tests run and result (widths, checks): `python3` packet checker `playtest_fix_1020_check: PASS`. `node tools/pp_test.js` on mahopac_lane, mahopac, maps_b4, maps_b5, obs_fix, pathfinding, stair_marker, tap_interact, partner_ui, smoke, wording_guard, data_integrity, and map_layers: PP_TEST RESULT: PASS exit=0 passed=267 failed=0 flaky=0 skipped=12 time=130s. RTDB_RULES RESULT: PASS. Widths 320x568, 375x667, and 390x844. `node tools/pp_test.js tests/play_together.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=24 failed=0 flaky=0 skipped=0 time=267s. RTDB_RULES RESULT: PASS. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D381, D384 and D386 settled by Vincent at 11:47 AM ET Oct 20, 2026, on the defaults (lane overlay as written; HP bar option A, no numbers; phone plate PAL w). D380 shipped in #118. D382, D383, D385, D387 and D388 are green as called. D389 stays a spare and nothing was built for it. D346 and D347 (HUSHWATER) are recorded as settled by Vincent at 11:34 AM ET Oct 20, 2026. No new id. No id was renumbered. Next free id is D363, then D390.
- Anything left unfinished: D389 is unused. D348–D353 stay on the HUSHWATER vote. PR #119 (The Signal Review) and PR #120 (co-op on by default) were still open when this branch was cut from fb7c702.

## 2026-10-20 13:02 ET: Co-op defaults on for everyone (build 20261020-1302)

- What changed and why: Vincent said "Turn on for everyone" at 12:55 PM ET on Oct 20, 2026. `COOP_CFG.on` now defaults to true. `?coop=0` is an off override and wins, including on the local emulator. `PPNet.coopOn()` is still `COOP_CFG.on === true && coopFlag === true`, so `/config/coop/on` stays the kill switch. D326–D333 are settled on the `COOP_VOTE` defaults. A host create of a whole party must carry a valid invite for a non-null guest: the guest `.validate` requires `invites/{guest}` in the same new data or already in root, plus the same mutual-friend and no-block checks the invites rule uses. Save stays `pixelpets.save.v2` with `v` 2. No new save field.
- Files touched: `net.js`, `database.rules.json`, `tools/rtdb_rules_test.js`, `tests/play_together.spec.js`, `tests/README.md`, `index.html`, `version.json`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `CHANGELOG.md`.
- Commit(s) + build id: this branch, build 20261020-1302.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/coop_r2.spec.js` PP_TEST RESULT: PASS exit=0 passed=10 failed=0 flaky=0 skipped=20 time=47s. RTDB_RULES RESULT: PASS. 10 emulator tests ran (390 project; 320 and 375 skip the file; the 320 width is inside the 390 run). `node tools/pp_test.js tests/play_together.spec.js` PP_TEST RESULT: PASS exit=0 passed=27 failed=0 flaky=0 skipped=54 time=266s. RTDB_RULES RESULT: PASS. 27 emulator tests ran (390 project). `node tools/pp_test.js tests/smoke.spec.js` PP_TEST RESULT: PASS exit=0 passed=21 failed=0 flaky=0 skipped=0 time=29s. RTDB_RULES RESULT: PASS. `node tools/pp_test.js tests/wording_guard.spec.js` PP_TEST RESULT: PASS exit=0 passed=27 failed=0 flaky=0 skipped=3 time=9s. RTDB_RULES RESULT: PASS. `node tools/pp_test.js tests/data_integrity.spec.js` PP_TEST RESULT: PASS exit=0 passed=42 failed=0 flaky=0 skipped=3 time=10s. RTDB_RULES RESULT: PASS. The rules block deny 19–24 is 66 party checks, the original 63 plus the forged uninvited guest, the same-write invite, and that party's delete. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D326–D333 were yellow and are settled by Vincent (Oct 20, 2026, 12:55 PM ET, on defaults, "Turn on for everyone"). The guest-invite `.validate` is green: it closes a parent-write bypass in the parties rules Vincent already cleared. No new id. No id was renumbered. The next free id is D363.
- Anything left unfinished: the Supervisor publishes `database.rules.json` after merge. The Firebase CLI is not logged in here. Team-up battle and the REJOIN button are still later builds.

## 2026-10-20 12:35 ET: The Signal Review (build 20261020-1235)

- What changed and why: Q22, the Capital Partnership Briefing, is The Signal Review. After Cobblecrest, a Glimmerwell save walks four steps: the quarry stage, the Wickerglen lamps, Route 2, and the Arbiter Bay briefing. Keepers still get the Lantern Council. `hc_council` is `noImply`, so a later Glimmerwell step does not mark that council done. ALIGN moves ±5 only at the four choice points. Grants `gb_relay_g` (+2 glimmer), `gb_callback_k` (+2 keepers), and `gb_brief_g` (+10 glimmer) move Standing only. A Bright-linked chipped Walkling surges at x1.10, taking the higher of GLOW and the surge. Care JOY is halved in Strain. The read drops JOY by 10 once, floor 20, and bond stays put. Bright-linked participants lose 2 JOY after a battle, floor 20. `{chip}` is the first chipped Walkling's name. Associate Juniper opens the RegenX stairs for the briefing. Save stays `pixelpets.save.v2` with `v` 2. New flags are additive.
- Files touched: `quests.js`, `standing.js`, `stats.js`, `game.js`, `sprites.js`, `data/detail_signal.json`, `data/mapdata.js`, `tests/glimmer_briefing.spec.js`, `tests/standing.spec.js`, `tests/lantern_council.spec.js`, `tests/highcharity.spec.js`, `tests/rook_crossroads.spec.js`, `tests/tap_interact.spec.js`, `tests/integrity_lib.js`, `tests/README.md`, `README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `index.html`, `version.json`, `CHANGELOG.md`. Merged `origin/main` at fb7c702 (co-op build 1 and the Settings build line).
- Commit(s) + build id: this branch, build 20261020-1235. The Supervisor merged main (#120, build 20261020-1302) into it and restamped it 20261020-1344.
- Tests run and result (widths, checks): `node tools/pp_test.js` PP_TEST RESULT: FAIL exit=1 passed=1345 failed=1 flaky=0 skipped=109 time=1168s. The one failure was `coop_r2.spec.js` "hidden tab greys the partner and drops at 60 s" because the WebKit binary was not installed. After `npx playwright install webkit`, `node tools/pp_test.js tests/coop_r2.spec.js --project=390 -g "hidden tab greys"` PP_TEST RESULT: PASS exit=0 passed=1 failed=0 flaky=0 skipped=0 time=20s. RTDB_RULES RESULT: PASS on both. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): no new id. D306–D310 stay settled by Vincent, 10:42 AM ET Oct 20, 2026, on defaults (vote closed early). Next free id is D363. D346–D362 stay reserved for HUSHWATER, with D346 and D347 settled by Vincent at 11:34 AM ET Oct 20. D380–D389 stay reserved for PLAYTEST_FIX_1020. Main's id lines were kept.
- Anything left unfinished: Brinewick, Hall #3, and Seal 3 stay closed. A side switch through Rook's offer still nudges ALIGN, which is the existing switch rule. One playthrough can take three of the four ±5 choices, because Stand with Glimmerwell and Hold close share one menu. The 0–100 cap is covered by four successive nudges.

## 2026-10-20 11:49 ET: Settings build line no longer clips (build 20261020-1149)

- What changed and why: PLAYTEST_FIX_1020 item D380 (green, design 9510519). The Settings build line wraps instead of clipping, and the CLOSE button keeps its height. Save stays `pixelpets.save.v2` with `v` 2. No new key. D380 had no open row, so no decision file changed. No id was renumbered. D380–D389 stay reserved.
- Files touched: `style.css`, `tests/settings_build_line.spec.js`, `tests/README.md`, `index.html`, `version.json`, `CHANGELOG.md`.
- Commit(s) + build id: this branch, build 20261020-1149. The Supervisor merged main (#117, build 20261020-1137) into it and restamped it 20261020-1155.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/smoke.spec.js tests/settings_build_line.spec.js` PP_TEST RESULT: PASS exit=0 passed=24 failed=0 flaky=0 skipped=0 time=33s. RTDB_RULES RESULT: PASS. Widths 320x568, 375x667, and 390x664. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D380 is green (design 9510519). No row was added.
- Anything left unfinished: none from this build.

## 2026-10-20 11:37 ET: Decision ids after HUSHWATER, and D306–D310 settled (build 20261020-1137)

- What changed and why: Supervisor docs fix during the PR #117 review. The next free decision id is D363, not D346. D346–D362 are reserved for HUSHWATER (design b01136b): D346–D347 are red, waiting for Vincent; D348–D353 are yellow, a team vote closing Thu Oct 22, 2026, about 11:25 AM ET; D354–D362 are green, settled by Design. D380–D389 are reserved for PLAYTEST_FIX_1020. D306–D310 (GLIMMER_NEXT_QUEST) are recorded as settled by Vincent, 10:42 AM ET Oct 20, 2026, on defaults (design 512809c). No code change. Save `v` stays 2.
- Files touched: `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html` and `version.json` (stamp only).
- Commit(s) + build id: this branch, build 20261020-1137.
- Tests run and result (widths, checks): `python3 tools/bump_build.py --check` exit 0. Affected specs rerun with `node tools/pp_test.js` (coop_r2, play_together, smoke, cloud_off, lizzy, data_integrity, wording_guard); result in the PR comment.
- Decisions made (colour + reasoning): no new id from this PR. Reservations copied from the design repo. No id was renumbered. Next free id D363.
- Anything left unfinished: none.

## 2026-10-20 11:09 ET: Walk group groundwork behind the co-op switch (build 20261020-1109)

- What changed and why: COOP_R2 Build 1 adds the parties rules, WALK TOGETHER, the JOIN / NOT NOW sheet, LEAVE GROUP, the GROUP n/max strip, and the 60 s grace window. Creates and updates under `parties` need `/config/coop/on`. Deletes stay open. `COOP_CFG.on` stays false unless `?coop=1` or the emulator, and `PPNet.coopOn()` still needs both that flag and the server switch. Yellows D326–D333 sit in `COOP_VOTE` until the vote closes Thu Oct 22, 2026, 8:00 AM ET. The device key `pixelpets.net` may hold `party`. Save stays `pixelpets.save.v2` with `v` 2. No new save field. Field Lead Imogen's route schedule line says partner. D339–D341 settled Oct 20, 2026 (Vincent, 8:40 AM ET, on defaults, design bfe356a) and nothing was built for them.
- Files touched: `net.js`, `game.js`, `index.html`, `style.css`, `database.rules.json`, `tools/rtdb_rules_test.js`, `tests/coop_r2.spec.js`, `tests/play_together.spec.js`, `tests/README.md`, `data/act1_route2.json`, `data/mapdata.js`, `version.json`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `CHANGELOG.md`.
- Commit(s) + build id: this branch, build 20261020-1109.
- Tests run and result (widths, checks): `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1326 failed=0 flaky=0 skipped=108 time=1157s. RTDB_RULES RESULT: PASS. `PASS: COOP_R2 party rules 63/63`. Widths 320, 375, and 390. On the 390 project, 10 coop_r2 tests ran and 24 play_together tests ran. The 320 and 375 projects skip those two files. The 320 width is inside the coop_r2 390 run. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D326–D333 stay yellow, built on the packet defaults in `COOP_VOTE`. D334–D337 are green, settled by Design. D339–D341 are red, settled by Vincent on the defaults, and not built. D342 and D345 stay green. D343 and D344 stay yellow until Thu Oct 22, 2026, about 8:15 AM ET. No new id. No id was renumbered. The next free id is D346.
- Anything left unfinished: team-up battle, REJOIN, and the ROOK foreshadow scenes. The Supervisor publishes `database.rules.json` after merge. The idle-read budget in the spec says 12; this build asserts 14 for 2 friends and 2 other holders.

## 2026-10-20 09:04 ET: 30 s and 60 s presence polls, and the co-op kill switch (build 20261020-0904)

- What changed and why: Play together keeps one listener on `/config/net` and one on `/config/coop/on`. Hidden holders poll every 30 s, with one probe when a holder first shows up. Friends and blocks poll every 60 s, and also at once when the Friends tab opens, on ADD or REMOVE, when a holder card opens, and when the tab is visible again. A visible tab and `pageshow` re-subscribe those two listeners. If the presence node is already gone, that return also bounces the socket. Position writes, the 400 ms send gap, heartbeat, repair, and `onDisconnect` stay as they are. A hidden tab still drops the node at once and goes offline after 60 seconds. `PPNet.coop` holds the switch listener. `PPNet.coopOn()` is false when the value is missing or false. `COOP_CFG.on` ships false unless `?coop=1` or the emulator is in use. There is no co-op entry point. The rules file is unchanged: the live config rule already covers `/config/coop/on`. Save stays `pixelpets.save.v2` with `v` 2. No new key. D298–D305 settled Oct 20, 2026 (Vincent, 7:55 AM ET, on defaults). D306–D310 stay on a team vote, closing Thu Oct 22, 2026, 7:50 AM ET. D311–D315 settled green. D316–D325 settled Oct 20, 2026 (Vincent, 8:14 AM ET, on defaults). The plan is rung 2, a team-up battle, for an invite-only playtest. Co-op play is not built. D326–D337 are reserved for COOP_PARTIES (design ce027b9), pending. D338 (LIZZY_PEER_PASS) settled Oct 20, 2026 (Vincent's direction, 8:08 AM ET): the holder, Lizzy and Rook grew up together, the same age. No numeric age in game text, and nothing on main changes. D339–D345 are reserved for ROOK_FORESHADOW (design 1288acc), open, deadline Thu Oct 22, 2026, about 8:15 AM ET. The next free id is D346. The Play together rules were published on Oct 19, 2026. Merged main at f52eaa8 (Lizzy wording, builds 20261020-0828 and 20261020-0838) and kept both sides.
- Files touched: `net.js`, `tests/play_together.spec.js`, `tests/README.md`, `index.html`, `version.json`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `CHANGELOG.md`, `tools/rtdb_rules_test.js`.
- Commit(s) + build id: this branch, build 20261020-0904. Merge of origin/main at f52eaa8.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/play_together.spec.js tests/lizzy.spec.js tests/reputation.spec.js tests/data_integrity.spec.js tests/wording_guard.spec.js tests/smoke.spec.js` PP_TEST RESULT: PASS exit=0 passed=165 failed=0 flaky=0 skipped=54 time=310s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D316–D325 were already settled by Vincent (Oct 20, 2026, 8:14 AM ET, on defaults). The 30 s hidden poll and the 60 s friends poll follow COOP_R2 §2.4. No new id. No id was renumbered. The next free id is D346. D306–D310 stay on the vote until Thu Oct 22, 2026, 7:50 AM ET. D338 is settled and changes no game text. D339–D345 stay open. D326–D337 stay reserved.
- Anything left unfinished: co-op play is not built. The parties node, WALK TOGETHER, and the group strip are the next build. Design's packet still owns the D326–D337 lines.

## 2026-10-20 08:38 ET: Imogen's Bright Lead line leads with partner (build 20261020-0838)

- What changed and why: LIZZY_PEER_PASS v0.2 (design 36e4b22) numbers the other-NPC lines L17–L20. L17, L19, and L20 already matched. L18, Field Lead Imogen's loyalty intro, now leads with partner: "Partner, a Bright Lead doesn't need the speech. Let's be brief." Save stays `pixelpets.save.v2` with `v` 2. No new key.
- Files touched: `data/glimmer_path.json`, `data/mapdata.js`, `index.html`, `version.json`, `CHANGELOG.md`.
- Commit(s) + build id: this branch, build 20261020-0838.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/lizzy.spec.js tests/reputation.spec.js tests/data_integrity.spec.js tests/wording_guard.spec.js tests/smoke.spec.js` PP_TEST RESULT: PASS exit=0 passed=141 failed=0 flaky=0 skipped=6 time=63s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): L17–L20 are green, settled by the Supervisor (Oct 20, 2026), as recorded in design 36e4b22. No decision file was edited. No id was renumbered.
- Anything left unfinished: the unbuilt P6 story lines, the school desk rewrite, and the Rook foreshadow rows.

## 2026-10-20 08:28 ET: Lizzy talks to the holder as an equal (build 20261020-0828)

- What changed and why: Vincent's direction (Tue Oct 20, 2026, 8:08 AM ET, cleared by the Supervisor at 8:23 AM ET) makes Lizzy and her sisters speak to the holder as an equal and an old friend. Sixteen built lines change: fifteen in `data/detail_lizzy.json` and Lizzy's warm letter line in `data/reputation.json`. First meetings read as "where have you been?". L17–L20 (design 36e4b22), settled green, change Field Lead Imogen's two lines to partner, the Cairnside shopkeeper's line to friend, and Mrs. Calloway's hello. Ilse's young holder line and the birthday-dream lines stay. D338 is settled the same morning: the holder, Lizzy and Rook grew up together, the same age. No built line changes for it, and the unbuilt school desk lines are not added. The Rook foreshadow rows stay unbuilt. Save stays `pixelpets.save.v2` with `v` 2. No new key.
- Files touched: `data/detail_lizzy.json`, `data/reputation.json`, `data/glimmer_path.json`, `data/cobblecrest.json`, `data/interiors.json`, `data/mapdata.js`, `tests/lizzy.spec.js`, `index.html`, `version.json`, `CHANGELOG.md`, `BACKLOG.md`, `README.md`, `tests/README.md`.
- Commit(s) + build id: this branch, build 20261020-0828.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/lizzy.spec.js tests/leak5b.spec.js tests/reputation.spec.js tests/data_integrity.spec.js tests/wording_guard.spec.js tests/smoke.spec.js` PP_TEST RESULT: PASS exit=0 passed=153 failed=0 flaky=0 skipped=6 time=83s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. At 320x568 every changed line stays inside the dialog box. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): The peer pass is green, settled by Vincent (Oct 20, 2026, 8:08 AM ET). L17–L20 are green (Supervisor, Oct 20, 2026; design 36e4b22). D338 is settled by Vincent: same age, nothing in the built game changes. D339–D345 stay open and are not built. No decision file was edited. No id was renumbered.
- Anything left unfinished: the unbuilt P6 story lines, the school desk rewrite, and the Rook foreshadow rows. Imogen's schedule line in the route data still says sweetie; it was outside this packet.

## 2026-10-20 07:55 ET: Region backdrop on, edge rings clear, and three settled lines (build 20261020-0755)

- What changed and why: Vincent approved the red at 7:35 AM ET on Tue Oct 20, 2026: ship the script-built region backdrop (MAP_LAYERS §9, option (b), D271). `REGION_BACKDROP` is true, so REGION draws `region_backdrop.png` under the places, paths, rings and labels. Fog and ??? stay. With debug, forcing the flag off restores the parchment. On ROOM and TOWN, an edge label that would sit under the you-ring or the quest ring is padded inward, so the LIFT tag in Amberhill Flats 5B and the east ??? label in Hearthmoor stay clear. Same branch, Supervisor request the same morning: D211, D218 and D244 are recorded as settled by Vincent at 7:37 AM ET (presets only, no web push, no grow-up level gate). D297, a green Design call at 7:46 AM ET, puts the "East: Route 1" hint back on the Hearthmoor sign and on the first line of `gate_look`. The MAP blurb stays "Hill village of the Keepers. Home." Hale's Trial Hall line says Keeper, the faction. D298–D315 were reserved for GLIMMER_NEXT_QUEST (design d116af5). The same morning settled D298–D305 (Vincent, 7:55 AM ET, on defaults) and D311–D315 (green). D306–D310 stayed on a team vote. Nothing from that block is built in this entry. Save stays `pixelpets.save.v2` with `v` 2. No new key.
- Files touched: `game.js`, `index.html`, `version.json`, `data/civic.json`, `data/cobblecrest.json`, `data/mapdata.js`, `tests/map_layers.spec.js`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `README.md`, `tests/README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`. The three reference shots stay out of the repo (no spec writes or reads `screenshots/map-layers/`).
- Commit(s) + build id: this branch, build 20261020-0755.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/map_layers.spec.js tests/map.spec.js tests/map_legend.spec.js tests/quest_multi.spec.js tests/smoke.spec.js tests/wording_guard.spec.js tests/data_integrity.spec.js tests/town_board_gate.spec.js` PP_TEST RESULT: PASS exit=0 passed=200 failed=0 flaky=0 skipped=10 time=92s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D271 was already YES. Vincent approved turning the backdrop on (Oct 20, 2026, 7:35 AM ET, red, MAP_LAYERS §9 option (b)). D211, D218 and D244 are settled by Vincent (Oct 20, 2026, 7:37 AM ET). D297 is the green Design call for the sign hint (Oct 20, 2026, 7:46 AM ET). D298–D315 were reserved for GLIMMER_NEXT_QUEST (design d116af5). The same morning settled D298–D305 (Vincent, 7:55 AM ET, on defaults) and D311–D315 (green). D306–D310 stayed on a team vote, closing Thu Oct 22, 2026, 7:50 AM ET. No rows were added. No id was renumbered. The next free id is D346. The edge-label pad is green: it keeps the existing tags readable.
- Anything left unfinished: none from this build.

## 2026-10-20 05:00 ET: Room and town maps, with the region parchment left as it is (build 20261020-0500)

- What changed and why: MAP_LAYERS D258–D275, settled by Vincent on Oct 19, 2026, 9:52 PM ET. MAP has ROOM, TOWN and REGION, each 44 px tall. Indoors it opens on ROOM. Outdoors it opens on TOWN, and ROOM is greyed. SHOW ON MAP still opens REGION. ROOM draws the floor, thin walls, openings, and OUT, UP, DOWN, LIFT or DOOR. TOWN draws the outdoor place, roofs, doors and edge exits. A floor you have not stood on reads ???. A building you have not entered keeps a grey roof and its name. An exit to a place you have not visited reads ???. SEE MAP, SEE INSIDE and BACK TO ME are view only. The you-ring blinks about once a second, and stays steady when motion is reduced. The High Charity room is Trial Hall (id `hc_gym_in` unchanged). Hearthmoor's line, on the map and on the town sign, is "Hill village of the Keepers. Home." Save stays `pixelpets.save.v2` with `v` 2. No new key. Fog uses the existing `floorSeen` map from D224. The cleaned Amberwild picture is in the game. `REGION_BACKDROP` stays false, so REGION still draws today's parchment and hill ticks.
- Files touched: `game.js`, `style.css`, `index.html`, `version.json`, `region_backdrop.png`, `data/civic.json`, `data/highcharity.json`, `data/mapdata.js`, `tests/map_layers.spec.js`, `tests/map.spec.js`, `tests/map_legend.spec.js`, `tests/quest_multi.spec.js`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `README.md`, `tests/README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`.
- Commit(s) + build id: this branch, build 20261020-0500.
- Tests run and result (widths, checks): `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1311 failed=0 flaky=0 skipped=84 time=1130s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error). No test timeout was raised.
- Decisions made (colour + reasoning): D258–D275 were already settled by Vincent (Oct 19, 2026, 9:52 PM ET). Greens as written. Yellows D259, D260, D262, D265 and D266 on the default. D271 is YES: the cleaned picture ships. This branch keeps `REGION_BACKDROP` false until Vincent turns that constant on. D272's carve-out is this one PNG. No new id. The next free id stays D297.
- Anything left unfinished: turning `REGION_BACKDROP` on. The draw path and the file are in the game. REGION looks the same as before until that constant changes.

## 2026-10-20 03:02 ET: Rematch after a rest, and party-list stat bars (build 20261020-0302)

- What changed and why: REMATCH_PARTY_STATS D276–D296, settled by Vincent on Oct 19, 2026. A whole-party wipe against a battle NPC that is not a one-shot sets `rematch.<id>`. After the Lantern House rest, walking through that sight line starts the battle again (notice, "!", walk-up), with two steps of grace after arrival or the heal. The NPC says a rematch line instead of the intro. A win pays once and clears the mark. Neighbour Rook and the other one-shots do not re-arm. Fen and Hale stay walk-up and open with the rematch line. TEAM and WALKLING-BOX rows show HP, NRG, FOOD, JOY, GROW and XP to the right of the name. The bars do not blink and do not take taps. FEED, PLAY and REST keep the icon on the same line as the word. The bond hearts stay clear of the HOLDER badge. Hale's intro and Tobin's intro say Keeper. Save stays `pixelpets.save.v2` with `v` 2. The only new save data is the `rematch.<id>` flag.
- Files touched: `game.js`, `style.css`, `sprites.js`, `data/cobblecrest.json`, `data/glimmer_path.json`, `data/mapdata.js`, `index.html`, `version.json`, `tests/rematch_party.spec.js`, `tests/care_tools.spec.js`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `README.md`, `tests/README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`.
- Commit(s) + build id: this branch, build 20261020-0302.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/rematch_party.spec.js` PP_TEST RESULT: PASS exit=0 passed=16 failed=0 flaky=0 skipped=14 time=35s. `node tools/pp_test.js tests/care_tools.spec.js tests/party_board.spec.js tests/partner_ui.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=20 failed=0 flaky=0 skipped=1 time=24s. Full suite: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1284 failed=0 flaky=0 skipped=84 time=1123s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error). No test timeout was raised.
- Decisions made (colour + reasoning): D276–D296 were already settled by Vincent (Oct 19, 2026, 10:39 PM ET). No new id. The next free id stays D297. Rematch lines live in `game.js` because the map JSON stays verbatim. Hale's one word and Tobin's one word are the only data-file edits.
- Anything left unfinished: none from this packet.

## 2026-10-20 01:18 ET: Partner card, INTERACT, and the gear view match the spec (build 20261020-0118)

- What changed and why: PARTNER_UI D245–D257, settled by Vincent on Oct 19, 2026, now follow the packet. The modern lower card (`#petStrip`) shows FOOD, JOY, NRG and GROW, with the apple, heart, bolt and star just left of the bars. GROW does not blink. PARTNER keeps NRG and GROW on the strip and FOOD and JOY in the body, with the same icons, and the strip bars are 12 px narrower. FEED, PLAY and REST show the apple, heart and bolt. The STATS row is INTERACT (grey) and GEAR (lime, full care-button size). INTERACT shows only for the partner and opens PARTNER. Rename is the NAME row in the gear view, and the pencil beside the header name. PARTNER GEAR opens that view. CLOSE, an outside tap and Escape stay on the current screen. One return point lives in memory only. The pet-scene badge reads HOLDER. Friends already said HOLDER. Your Room (`hc_apt_in`) stays scale 2 at 320, and the view shifts so the left wall clears the button column. The bed stays clear. Save `v` stays 2. No new save field.
- Files touched: `sprites.js`, `game.js`, `index.html`, `style.css`, `tests/partner_ui.spec.js`, `tests/partner_kit.spec.js`, `tests/care_tools.spec.js`, `tests/stat_display.spec.js`, `tests/room_zoom.spec.js`, `tests/room_zoom_all.spec.js`, `version.json`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `README.md`, `tests/README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`.
- Commit(s) + build id: this branch, build 20261020-0118.
- Tests run and result (widths, checks): `npm run test:agent tests/room_zoom.spec.js tests/room_zoom_all.spec.js` PP_TEST RESULT: PASS exit=0 passed=7 failed=0 flaky=0 skipped=2 time=17s. Full suite: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1268 failed=0 flaky=0 skipped=70 time=1303s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D245–D257 were already settled by Vincent (Oct 19, 2026). The archive rows for D245–D247 and D249–D255 are the packet text. No new id. The next free id stays D297. D75 stays open for the five adornment names. The button label is GEAR (D253).
- Anything left unfinished: acceptance item 7 still says the PARTNER body carries the bowl. The settled refinement, and acceptance item 5, use the apple. This build uses the apple. The design checker does not run from the packet folder, because that folder is not the game repo.

## 2026-10-20 00:29 ET: Partner screen icons, INTERACT, GEAR, and Your Room at 320 (build 20261020-0029)

- What changed and why: PARTNER_UI D245–D257, settled by Vincent on Oct 19, 2026. FOOD shows a 7×7 apple. NRG and REST show a 5×5 cyan bolt, and the bolt paints `z` if it will not render. JOY keeps the heart and GROW keeps the star. The alert badges stay the bowl and `z`. The GROW bar is total over goal, so 40 of 120 fills a third, and a full form stays full. The pet-scene badge reads HOLDER. Friends already said HOLDER and YOUR HOLDER CODE. The stats card name control reads INTERACT. GEAR sits on the PARTNER screen and does not lock the tabs. The kit overlay is gone from the new page. An older cached page can still open it. Your Room (`hc_apt_in`) stays scale 2 at 320 so the left round buttons clear the bed. Save `v` stays 2. No new save fields.
- Files touched: `sprites.js`, `game.js`, `index.html`, `style.css`, `tests/partner_ui.spec.js`, `tests/partner_kit.spec.js`, `tests/deploy_held.spec.js`, `tests/room_zoom.spec.js`, `tests/room_zoom_all.spec.js`, `version.json`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `README.md`, `tests/README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`.
- Commit(s) + build id: this branch, build 20261020-0029.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/partner_ui.spec.js tests/partner_kit.spec.js tests/care_tools.spec.js tests/deploy_held.spec.js tests/stat_display.spec.js tests/room_zoom.spec.js tests/ux_review.spec.js tests/p0_stale_page.spec.js tests/heart_alert.spec.js` PP_TEST RESULT: PASS exit=0 passed=116 failed=0 flaky=0 skipped=4 time=90s. `node tools/pp_test.js tests/room_zoom_all.spec.js` PP_TEST RESULT: PASS exit=0 passed=3 failed=0 flaky=0 skipped=0 time=15s. Full suite: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1254 failed=0 flaky=0 skipped=66 time=1117s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error). The named timeout tests did not fail, so their timeouts were not raised.
- Decisions made (colour + reasoning): D245–D257 were already settled by Vincent (Oct 19, 2026). No new id. The next free id stays D297. D75 stays open; the button it describes is now GEAR. The packet file was not on this machine, so D246, D247 and D249–D255 record the shipped behavior from the settled notes.
- Anything left unfinished: the lower-card layout follows the partner FOOD and JOY rows plus the existing NRG and GROW strip. The mock images were not on this machine.

## 2026-10-19 23:29 ET: Merge main (play together) into the room-zoom void fix (build 20261019-2329)

- What changed and why: Merged `origin/main` at `388723a` (PR #104, play together, build 20261019-2246) and kept both sides. Holders on one room code can still see each other. The black void, the room canvas, and the pilaster slack stay. `index.html` and `version.json` take the new stamp 20261019-2329, later than 2246. Save `v` stays 2. D276–D296 stay reserved. The next free id is D297.
- Files touched: merge of `main`, restamp of `index.html` and `version.json`, `CHANGELOG.md`, `BACKLOG.md`, `NEXT_PLAN.md`.
- Commit(s) + build id: merge commit on `cursor/room-zoom-void-audit-6434`, build 20261019-2329.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/room_zoom.spec.js tests/room_zoom_all.spec.js tests/play_together.spec.js` PP_TEST RESULT: PASS exit=0 passed=28 failed=0 flaky=0 skipped=44 time=273s. RTDB_RULES RESULT: PASS. Full suite: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1234 failed=0 flaky=0 skipped=62 time=1105s. RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): no new id. D236 stays overridden (black void). D276–D296 stay reserved for REMATCH_PARTY_STATS. The next free id is D297.
- Anything left unfinished: none from this merge.

## 2026-10-19 23:12 ET: Merge main (tour skip, group-battle wait, tank window) into the room-zoom void fix (build 20261019-2312)

- What changed and why: Merged `origin/main` at `4afcb69` (PR #107 tour SKIP TOUR and tip SHOW ME, PR #108 group-battle wait, PR #109 tank window and 2 workers) and kept both sides. The black void, the room canvas, and the pilaster slack stay. `index.html` and `version.json` take the new stamp 20261019-2312, later than 2202. Save `v` stays 2.
- Files touched: merge of `main`, restamp of `index.html` and `version.json`, `CHANGELOG.md`.
- Commit(s) + build id: merge commit on `cursor/room-zoom-void-audit-6434`, build 20261019-2312.
- Tests run and result (widths, checks): Full suite after the merge: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1212 failed=0 flaky=0 skipped=18 time=955s. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): no new id. D236 stays overridden (black void). D258–D275 stay reserved for MAP_LAYERS. The next free id is D276.
- Anything left unfinished: PR #104 (play together) is still open and also edits `game.js`. It was not on `main`.

## 2026-10-19 22:01 ET: Merge main (stair flights, battle no-reload) into the room-zoom void fix (build 20261019-2201)

- What changed and why: Merged `origin/main` at `786c0ea` (PR #105 stair flights, build 20261019-2157, and PR #106 battle no-reload, build 20261019-2143) and kept both sides. The room canvas, the black void, and the pilaster slack stay. Stair art and the battle reload guard stay. `index.html` and `version.json` take the new stamp 20261019-2201, later than 2157. Save `v` stays 2.
- Files touched: merge of `main`, restamp of `index.html` and `version.json`, `CHANGELOG.md`, `BACKLOG.md`, `NEXT_PLAN.md`.
- Commit(s) + build id: merge commit on `cursor/room-zoom-void-audit-6434`, build 20261019-2201.
- Tests run and result (widths, checks): After the merge, `node tools/pp_test.js tests/room_zoom.spec.js tests/room_zoom_all.spec.js tests/stair_marker.spec.js tests/battle_no_reload.spec.js` PP_TEST RESULT: PASS exit=0 passed=22 failed=0 flaky=0 skipped=2 time=100s (the 2 skips are the cloud timing check at 320 and 375). Full suite: `npm run test:agent` PP_TEST RESULT: FAIL exit=1 passed=1205 failed=1 flaky=0 skipped=18 time=1838s. The one failure was `[375] tests/group_battle.spec.js:134` (a 10s wait for the win). The same test passed at 320 and 390 in that run. Rerun: `node tools/pp_test.js tests/group_battle.spec.js` PP_TEST RESULT: PASS exit=0 passed=21 failed=0 flaky=0 skipped=0 time=13s. Stair glint still passes on screen with the room scale (home is 3 at 390). `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error). Widths 320, 375, and 390.
- Decisions made (colour + reasoning): no new id. D236 stays overridden (black void). D258–D275 stay reserved for MAP_LAYERS. The next free id is D276.
- Anything left unfinished: PR #104 (play together) is still open and also edits `game.js`. It was not on `main`.

## 2026-10-19 21:31 ET: Room zoom void and every interior (build 20261019-2131)

- What changed and why: Vincent's playtest (Oct 19, 9:13 PM ET) put leftover room edges back to the black void. That overrides D236. No new decision id. Main later reserved D258–D275 for MAP_LAYERS, so the next free id is D276. Small interiors still zoom in whole steps, up to twice the outdoor scale, in the band above the buttons and the partner strip, so a bottom door is not hidden under that strip. A keeper pilaster counts as wall for the one-tile width slack. Flat 5B keeps slack 0: a walkable mat sits on the edge. Fit-width rooms, including the Arbiter Bay, are unchanged. The scale still snaps at the black midpoint of the warp, including stairs and the walk back outside, and outdoors returns to the outdoor scale. Save `v` stays 2.
- Files touched: `game.js`, `tests/room_zoom.spec.js`, `tests/room_zoom_all.spec.js`, `index.html`, `version.json`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `tests/README.md`, `CHANGELOG.md`.
- Commit(s) + build id: build 20261019-2131.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/room_zoom_all.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=1 failed=0 flaky=0 skipped=0 time=5s. `node tools/pp_test.js tests/room_zoom.spec.js tests/interior_walls.spec.js tests/maps_b5.spec.js tests/maps_b8.spec.js tests/pathfinding.spec.js tests/rx_f4_pilot.spec.js tests/house_reskin.spec.js tests/controls.spec.js` PP_TEST RESULT: PASS exit=0 passed=171 failed=0 flaky=0 skipped=0 time=200s. Full suite: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1190 failed=0 flaky=0 skipped=16 time=1715s. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): no new id. D236 stays the settled row. Vincent overrode it Oct 19, 2026, 9:13 PM ET: black void. D258–D275 stay reserved for MAP_LAYERS. The next free id is D276.
- Anything left unfinished: PR #104 (play together) is still open and also edits `game.js`. It was not on `main`, so it is not in this branch.
## 2026-10-19 22:46 ET: Play together review fixes (build 20261019-2246)

- What changed and why: Supervisor review of PR #104. The emote-rate test loads `database.rules.json` into the `demo-walklings` namespace in `beforeAll`; the emulator only applied the rules to `demo-walklings-default-rtdb`, so the game's namespace ran open. "Joined. Say hi!" now shows once the holder is placed; before, `paintChrome()` hid it straight after it appeared. Settings: Show other holders sits with its ON / FRIENDS / SOLO switch, below Room code and Blocked holders. After merging main's `workers: 2` (PR #109), `tests/play_together.spec.js` runs only in the 390 project: two workers had run the 320/375 and 390 copies side by side on one emulator and room code, and one copy's teardown stopped the emulator under the other (34 failed at 320). 34 and 40 open their own 320 and 375 pages. BACKLOG logs a P2: recreating your own holder node skips the 2 s emote gap and the `pt` throttle (modified client only; invite-only playtest).
- Files touched: `net.js`, `tests/play_together.spec.js`, `tests/README.md`, `BACKLOG.md`, `OPEN_DECISIONS.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: on `cursor/play-together-p1-3c2a`, build 20261019-2246.
- Tests run and result (widths, checks): `python3 tools/bump_build.py --check` exit 0. `tests/play_together.spec.js`, `tests/cloud_off.spec.js`, `tests/smoke.spec.js` and the RTDB rules check; see the PR body.
- Decisions made (colour + reasoning): no new id. D276–D296 reserved: REMATCH_PARTY_STATS, next free D297.
- Anything left unfinished: the rules were not deployed from this branch. Corrected Oct 20, 2026: the Play together rules were published on Oct 19, 2026.

## 2026-10-19 22:31 ET: rx_f4 tank test samples the full window; suite runs 2 workers (test and config only, no build)

- What changed and why: `tests/rx_f4_pilot.spec.js:208` (QA 9 / A7, tank frames) failed on main at all widths. The test compared only the first and last samples of a 700 ms window, but the tanks flip every 600 ms (`A.lab_tank`, 2 frames, `ms 600`). A window starting in the last 100 ms of a frame spans two flips and reads the same frame, and boot timing landed there almost every time. The game is fine. The watch now samples every animation frame for at least 1300 ms, more than two periods, and asserts exactly 1 distinct frame per tank cell under reduced motion, and exactly 2 per cell otherwise, flipping in step. `playwright.config.js` goes from `workers: 1` to `workers: 2` (`fullyParallel` stays false). The full suite takes about 890 s on 2 workers against about 1700 s on 1. No game code. Save `v` stays 2.
- Files touched: `tests/rx_f4_pilot.spec.js`, `playwright.config.js`, `tests/README.md`, `CHANGELOG.md`.
- Commit(s) + build id: branch `test/rx-f4-window-2workers`. No build stamp: nothing deployed changes, and `python3 tools/bump_build.py --check` exits 0.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/rx_f4_pilot.spec.js` 5 of 5 PASS (passed=39 each, 320, 375, 390, 30–32 s). Full `npm run test:agent` (2 workers from the config): PP_TEST RESULT: PASS exit=0 passed=1209 failed=0 flaky=0 skipped=18 time=965s. Earlier 2-worker full runs on the group_battle branch: 891, 890 and 889 s, no group_battle flakes.
- Decisions made (colour + reasoning): no new id. Green, test and config only.
- Anything left unfinished: none.

## 2026-10-19 22:14 ET: Merge main (PR #105 stair flights, #106 battle no-reload, #107 tour fix) into Play together (build 20261019-2214)

- What changed and why: Supervisor catch-up of PR #104. Merged `origin/main` at `89b146d` (live 20261019-2202) and kept both sides. `game.js`, `cloud.js`, `save.js`, `sprites.js`, `style.css`, `README.md` and `tests/README.md` auto-merged. `index.html` and `version.json` (stamps only) keep this branch's script list, with `net.js`, and the new stamp. CHANGELOG keeps both sides' entries. `archive/DECISIONS_SETTLED.md` and the Settled list in `OPEN_DECISIONS.md` keep D195–D208 and D220–D230. The id headers take main's line: D258–D275 reserved for MAP_LAYERS, next free D276, plus D195–D208 (Play together) settled. `python3 tools/gen_mapdata.py` made no change beyond main's.
- Files touched: merge of `main`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `NEXT_PLAN.md`, `BACKLOG.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: merge commit on `cursor/play-together-p1-3c2a`, build 20261019-2214.
- Tests run and result (widths, checks): `python3 tools/bump_build.py --check` exit 0. Scoped specs: see the PR comment.
- Decisions made (colour + reasoning): no new id. Next free D276. This PR uses no D258+ id.
- Anything left unfinished: the rules were not deployed from this branch. Corrected Oct 20, 2026: the Play together rules were published on Oct 19, 2026.

## 2026-10-19 22:11 ET: Play together hold fixes (build 20261019-2211)

- What changed and why: Merged current `origin/main` and kept both sides. A second emote inside 2 s is refused: the send and the direct write share one queue, and `lastEmoteAt` keeps the gap after the emote is cleared. Rules reject a string in place of a friend, info, or block map, a key longer than 128 characters, a second WLK- code for one holder, and a move that writes only `x`. Realtime Database rules have no child count, so the 12 friend slots stay in the client and each key is a uid. "Joined. Say hi!" clears itself and stays hidden in SOLO. Nameplates stack when two holders share a tile. Settings shows the ON / FRIENDS / SOLO switch once, and the status line reads Room 1 · 1 here. Save `v` stays 2. The next free id stays D258. D195–D208 stay the Play together rows.
- Files touched: `database.rules.json`, `net.js`, `style.css`, `tools/rtdb_rules_test.js`, `tests/play_together.spec.js`, `review-play-together/`, `index.html`, `version.json`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `tests/README.md`, `CHANGELOG.md`, plus the merge of `main`.
- Commit(s) + build id: build 20261019-2211.
- Tests run and result (widths, checks): `python3 tools/bump_build.py --check` exit 0. Scoped: `npm run test:agent -- tests/play_together.spec.js --project=390 -g "17 to 20 emote"` PP_TEST RESULT: PASS exit=0 passed=1 failed=0 flaky=0 skipped=0 time=12s, plus RTDB_RULES RESULT: PASS. `npm run test:agent -- tests/play_together.spec.js --project=390 --project=320` then failed one friends-list race; after the fix, `npm run test:agent -- tests/play_together.spec.js --project=390 -g "4 to 8 see|38 wording"` PP_TEST RESULT: PASS exit=0 passed=2 failed=0 flaky=0 skipped=0 time=20s, plus RTDB_RULES RESULT: PASS. Full suite: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1208 failed=0 flaky=0 skipped=55 time=1909s, plus RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. The layout check also ran at 320. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): no new id. D195–D208 stay settled. The next free id stays D258.
- Anything left unfinished: the Supervisor still publishes the rules (`firebase deploy --only database --project walklings-4cc89`). This commit does not deploy them.

## 2026-10-19 22:09 ET: group_battle test waits on the real battle state (test only, no build)

- What changed and why: `tests/group_battle.spec.js:134` ("clearing both foes wins…") failed about half the time under `--workers=2` (3 of 6 runs before the fix, 0 of 3 with 1 worker). It timed out in `playTurn` waiting for the action panel. After turn 1 the state was CHOOSE but `PixelPets.battle.panel` was already `fight`, because the last forced `#btMsg` tap of the previous turn landed on FIGHT once the panel swapped back under it. `playTurn` now accepts the move list already open and clicks FIGHT only when the panel is `acts`. The win loop waits for the real CHOOSE state with `waitForFunction` before `setHp('foe', 1)`, instead of skipping the HP drop when the state was not there yet. No fixed sleeps. No game code. `playwright.config.js` stays at `workers: 1`. Save `v` stays 2.
- Files touched: `tests/group_battle.spec.js`, `CHANGELOG.md`.
- Commit(s) + build id: branch `test/group-battle-wait`. No build stamp: test only, nothing deployed changes, and `python3 tools/bump_build.py --check` exit 0 on build 20261019-2157.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/group_battle.spec.js --workers=2` 10 of 10 PASS (21 tests each, 10–13 s), 1 worker 5 of 5 PASS (14–15 s), no flakes. Full `npm run test:agent -- --workers=2` on 71502f1 plus the fix: PASS passed=1187 failed=0 flaky=0 skipped=16 891 s; PASS passed=1187 failed=0 flaky=0 skipped=16 890 s; FAIL passed=1186 failed=1 flaky=0 skipped=16 889 s, the one failure `[320] rx_f4_pilot.spec.js:208` (tank frames), which also fails on main and is not from this change. One more run was thrown out because its local http.server on 8804 died mid-run (connection refused). After merging `origin/main` 786c0ea: group_battle with `--workers=2` 3 of 3 PASS, and `battle_no_reload.spec.js` plus `group_battle.spec.js` with 1 worker PASS passed=28 skipped=2.
- Decisions made (colour + reasoning): no new id. Green, test only.
- Anything left unfinished: `rx_f4_pilot.spec.js:208` is triaged separately (sampling-window bug in the test), not fixed here.

## 2026-10-19 22:02 ET: Tour SKIP TOUR and tip SHOW ME fixes (build 20261019-2202)

- What changed and why: Vincent's Oct 19 playtest. (1) After SHOW ME, a tap that missed PARTNER, or landed low on the partner-screen card, ended the whole tour. SKIP TOUR was an invisible full-width 336x44 strip (flex stretch, no border) and the only button on tap steps, so it also took focus. SKIP TOUR is now a small left-aligned target, focus goes to the ringed button, and a mid-tour skip needs a second tap within 3 s ("TAP AGAIN TO SKIP"). Escape still skips at once. (2) The Lanterns tip SHOW ME did nothing (no action, and the ring sat on the exit mat because its id says "lantern"). A healed party now sees GOT IT only. A hurt party's SHOW ME walks to a Lantern bed (rest prompt) or the Lantern House door, or opens MAP when no Lantern is on the map. (3) SHOW ME audit: rep, phone, quests and letter now open the compass, the phone and QUEST. moral and switch (nothing to ring) show GOT IT only. sides and growup unchanged. Save `v` stays 2. No new flags.
- Files touched: `game.js`, `style.css`, `tests/tutorial.spec.js`, `tests/unlock.spec.js`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: branch `fix/tutorial-skip-showme`, first stamped 20261019-2143 (same id as PR #106, so restamped after merging main with #106 and #105), build 20261019-2202.
- Tests run and result (widths, checks): see the PR. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green, approved by Vincent. No new id.
- Anything left unfinished: none.

## 2026-10-19 21:57 ET: Up flights open into three rows of PAL.k (design d106bca) (build 20261019-2157)

- What changed and why: Supervisor review of PR #105 held the merge. The acceptance is solid black across rows 0–2 of every up flight, and the art had rows 0–1. Per design d106bca, `stair_home`, `lab_stair` and `step_up` now have PAL.k on rows 0–2 at the same x span (2–13; the narrowing corners stay clear). The light tread edge moves from row 2 to row 3, so the top tread face is row 4 and the riser stays on row 5. The glint art is unchanged on rows 3–4, just under the opening (D222 refinement). Down wells are unchanged. Save `v` stays 2.
- Files touched: `sprites.js`, `tests/stair_marker.spec.js`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: `cursor/stair-marker-2d51`, build 20261019-2157.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/stair_marker.spec.js tests/hearthmoor_polish.spec.js tests/maps_b4.spec.js tests/smoke.spec.js` PP_TEST RESULT: PASS exit=0 passed=75 failed=0 flaky=0 skipped=0 time=128s (320/375/390). `stair_marker` asserts rows 0–2 PAL.k in the tile art and on screen at `hm_home_in` (1,5) and `hm_hq_f1` (12,3), and on every other up flight it covers (`hc_mall_1`, `rx_f1`, `rx_f2`, `rx_f3`, `sm_tunnel`). The lit-glint read moves to row 4, because row 3 is the white tread edge. On the old art the spec fails ("home: rows 0-2 PAL.k"). `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green, design d106bca. No new id. Next free D276.
- Anything left unfinished: none.

## 2026-10-19 21:49 ET: Merge main (P0 battle no-reload hotfix, PR #106) into Stair flights; MAP_LAYERS ids reserved (build 20261019-2149)

- What changed and why: Merged `origin/main` at `8128377` (PR #106, build 20261019-2143) into `cursor/stair-marker-2d51`. `game.js`, `cloud.js` and `tests/README.md` auto-merged. `index.html` and `version.json` (stamps only) take main's side and the new stamp. CHANGELOG keeps both entries. `python3 tools/gen_mapdata.py` made no change. Header-only id note (Supervisor): D258–D275 reserved for MAP_LAYERS (design 57dee5a). The next free id is D276, in `OPEN_DECISIONS.md`, `NEXT_PLAN.md` and `BACKLOG.md`. No rows added. Save `v` stays 2.
- Files touched: merge of `main`, `OPEN_DECISIONS.md`, `NEXT_PLAN.md`, `BACKLOG.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: merge commit on `cursor/stair-marker-2d51`, build 20261019-2149.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/stair_marker.spec.js tests/hearthmoor_polish.spec.js tests/lizzy.spec.js tests/civic.spec.js tests/maps_b4.spec.js tests/obs_fix.spec.js tests/battle_no_reload.spec.js tests/smoke.spec.js` PP_TEST RESULT: PASS exit=0 passed=151 failed=0 flaky=0 skipped=2 time=291s (320/375/390). `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): no new id. Next free D276 (D258–D275 reserved for MAP_LAYERS).
- Anything left unfinished: none from the merge.

## 2026-10-19 21:43 ET: P0 hotfix: nothing reloads the page under a battle, plus a reload breadcrumb (build 20261019-2143)

- What changed and why: Vincent (iPhone Safari, 21:27 ET): "During battles, I've had safari refresh three times, making trainer battles impossible to progress through." A battle is never saved mid-fight, so any reload restarts a trainer. Two code paths could reload under a battle. (1) Cloud adopt (PR #99, live since 17:53 ET): when the first cloud compare timed out, `cloud.js` retried it every 10 s with no battle check, and a quiet adopt called `location.reload()` straight away (`game.js` startCloud `adopt`). Now `sync()` skips the compare while `busy()` (any overlay or `battle.on`), and `adopt` itself refuses under an overlay or battle. The next tick after the battle compares, so local changes from the battle become the existing "which game to keep" prompt and are never thrown away. (2) The "New build ready" bar was polled every 500 ms, so it stayed over the first ≤500 ms of a battle (over the foe card) and a tap reloaded. `openBattle` now hides it at once, `pumpBuildBar` also checks `battle.on`, and `#buildGo` ignores taps under an overlay or battle. Diagnostics: every reload or replace path writes localStorage `pp_reload` {reason, at, battleOn, build} first (cloud, build, boot, startover, copy, bfcache, newer); pagehide/beforeunload with none writes 'unknown'. `pp_alive` is set while visible and cleared on hide, so a boot with `pp_alive` but no `pp_reload` logs 'crash'. Boot moves the entry to `pp_reload_last` (last 5) and Settings shows "Last reload: cloud, 9:22 PM, in battle" under the build line. Measured: 12 battles in a row at 390 show flat heap (5.5 -> 6.1 MB), DOM, canvases, intervals and rAF, so a memory kill is unlikely. Save `v` stays 2 (the new keys are outside the save).
- Files touched: `game.js`, `cloud.js`, `index.html`, `tests/battle_no_reload.spec.js` (new), `tests/README.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: branch `hotfix/battle-no-reload`, build 20261019-2143.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/battle_no_reload.spec.js tests/p0_trainer_win.spec.js tests/group_battle.spec.js tests/cloud_off.spec.js tests/ios_reload.spec.js tests/save_copy.spec.js tests/smoke.spec.js` PP_TEST RESULT: PASS exit=0 passed=85 failed=0 flaky=0 skipped=2 time=138s (widths 320, 375, 390; the 2 skips are the cloud timing check at 320/375, run at 390 only). The cloud check fails on the unguarded code (a compare ran under the battle). `python3 tools/bump_build.py --check` exit 0. Console errors: none.
- Decisions made (colour + reasoning): green, P0 hotfix approved by the Supervisor. No new id.
- Anything left unfinished: no mid-battle checkpoint (a reload still restarts the fight; now nothing in the game triggers one under a battle).

## 2026-10-19 20:59 ET: Stair flights, door steps, and a black up-opening (build 20261019-2059)

- What changed and why: Stairs read as flights. `stair_home`, `stair_loft`, and `lab_stair` are full tiles. Other floor changes use `step_up` or `step_down`. A soft glint sits on the far tread (blank four frames, lit two, 500 ms) and stays on the blank frame after that floor is in optional `floorSeen`. Up flights open into PAL.k so they read into the next room. Down flights keep the dark well. Every enterable door gets a stone step on the doorstep. The Flats step stays at (15, 18), off the sign and the lantern post, including the polish cells (14, 18) and (18, 19). Bren's beat (1, 7)–(1, 9) has no marker. The observatory exit is `mat_dusk`. Save `v` stays 2. Merged main and kept online saves, room zoom, Modern taps, the grow-up tip, and Hearthmoor polish (sign at (14, 18), lantern at (18, 19), Bren's beat (1, 7)–(1, 9)).
- Files touched: `sprites.js`, `game.js`, `save.js`, `data/detail_wayin.json`, `data/mapdata.js`, `tests/stair_marker.spec.js`, `tests/README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261019-2059, after merging main (online saves, room zoom, Modern taps, the grow-up tip, and Hearthmoor polish). Earlier stamps on this branch were 20261019-1950 and 20261019-2052.
- Tests run and result (widths, checks): After merging main, focused overlap specs `npm run test:agent -- tests/stair_marker.spec.js tests/hearthmoor_polish.spec.js tests/lizzy.spec.js tests/civic.spec.js tests/obs_fix.spec.js tests/room_zoom.spec.js tests/unlock.spec.js tests/dream_toy.spec.js tests/tap_interact.spec.js tests/cloud_off.spec.js` PP_TEST RESULT: PASS exit=0 passed=153 failed=0 flaky=0 skipped=0 time=340s. Full suite: `npm run test:agent` PP_TEST RESULT: FAIL exit=1 passed=1195 failed=1 flaky=0 skipped=16 time=1764s. Widths 320, 375, and 390. The one failure was `[375] tests/group_battle.spec.js:134` (a 10s wait for the win). Rerun: `npm run test:agent -- tests/group_battle.spec.js` PP_TEST RESULT: PASS exit=0 passed=21 failed=0 flaky=0 skipped=0 time=13s. An earlier full run on this branch, before room zoom and polish, failed `maps_b4` (glint frames sized as a list, door steps counted as puddles) and `obs_fix` (the dusk mat missing from the skin remap). Those checks now keep the puddle rules and expect `mat_dusk`. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D220–D230 settled by Vincent, Oct 19, 2026, 7:14 PM ET, on the defaults. A refinement of D222 (Lissett, CCO, via Vincent, 7:21 PM ET, no new id): the top of every up flight is solid PAL.k. No new id. D231–D239 stay with ROOM_ZOOM on main. The next free id is D258.
- Anything left unfinished: Frostmere is not built. Glimmer Act 2 is still TBD. Online saves Phase 2 is still next. Hearthmoor polish (PR #100) is merged. The Flats sign stays at (14, 18) and the lantern post at (18, 19). The door step stays at (15, 18), a walkable cell, so the sign still reads from the door step. No marker sits on the sign, the lantern, or Bren's beat (1, 7)–(1, 9).

## 2026-10-19 20:16 ET: Merge online saves into Play together (build 20261019-2016)

- What changed and why: Merged `origin/main` (PR #99, online saves Phase 1, build 20261019-1759) and kept both sides. Anonymous cloud backup stays on. The root `.read` and `.write` rules are false, and the Play together child rules replace that branch's full closure. Those child rules were published on Oct 19, 2026. `?cloud=emu` still loads the pinned SDK. Live Firebase hosts stay unroutable in the suite. Save `v` stays 2.
- Files touched: merge of `main`, `cloud.js`, `cloud_config.js`, `database.rules.json`, `firebase.json`, `playwright.config.js`, `tests/cloud_off.spec.js`, `index.html`, `version.json`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `tests/README.md`, `CHANGELOG.md`.
- Commit(s) + build id: build 20261019-2016.
- Tests run and result (widths, checks): `npm run test:agent -- tests/cloud_off.spec.js tests/play_together.spec.js` PP_TEST RESULT: PASS exit=0 passed=36 failed=0 flaky=0 skipped=39 time=252s, plus RTDB_RULES RESULT: PASS. Full suite: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1166 failed=0 flaky=0 skipped=55 time=1817s, plus RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. Console errors: none (the specs fail the run on a console error). `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): no new id. D195–D208 stay settled.
- Anything left unfinished: the Supervisor still publishes the rules (`firebase deploy --only database --project walklings-4cc89`). Online saves Phase 2 is not this build.

## 2026-10-19 19:33 ET: Play together, see each other (build 20261019-1933)

- What changed and why: Holders with the same room code see each other on Hearthmoor and Route 1. SAY sends a set emote or phrase. A tap opens a holder card (WAVE, MUTE, BLOCK). Settings gains Play together when the shared walk is on: Show other holders (ON, FRIENDS, SOLO), the room code, and Blocked holders. Friends is twelve slots and a mutual add by WLK- code (old PXP- codes are accepted). No free text is stored in a room node. Trading is not in this build (D198). Save `v` stays 2. The only new save field is optional `settings.showOthers`. The device key `pixelpets.net` holds the room code, mutes, and blocks, and Start over clears it. The parent `/hidden/{target}` list is not readable. A holder can read only a known `/hidden/{target}/{blocker}` child. Rules are in the repo. They were published on Oct 19, 2026.
- Files touched: `database.rules.json`, `firebase.json`, `tools/rtdb_rules_test.js`, `tools/pp_test.js`, `package.json`, `cloud.js`, `net.js`, `game.js`, `save.js`, `sprites.js`, `style.css`, `index.html`, `tests/play_together.spec.js`, `review-play-together/`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `tests/README.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261019-1933.
- Tests run and result (widths, checks): `python3 tools/bump_build.py --check` exit 0. Design packet checker `PLAY_TOGETHER_P1 check: PASS`. Scoped run before the stamp: `npm run test:agent -- tests/play_together.spec.js` PP_TEST RESULT: PASS exit=0 passed=21 failed=0 flaky=0 skipped=39 time=247s, plus RTDB_RULES RESULT: PASS. Full suite: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1151 failed=0 flaky=0 skipped=55 time=2335s, plus RTDB_RULES RESULT: PASS. Widths 320, 375, and 390. The layout check also ran at 320. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D195–D199 settled with Q1 (Vincent, Oct 19, 2026, ~5:06 PM ET). D200–D207 were yellow and Vincent approved each packet default at about 6:21 PM ET. D208 is the green tech default. No id was renumbered. The next free id stays D258. Yellow rows stay behind `NET_CFG` and `NET_TEXT`.
- Anything left unfinished: the Supervisor still publishes the rules (`firebase deploy --only database --project walklings-4cc89`). Friends as Phone contacts, preset-phrase mail, and a Phone unread badge are reserved on the device key and are not built. Trading stays out (D198). Frostmere is not built. Glimmer Act 2 is still TBD. Online saves Phase 2 (Link Google) is not this build.

## 2026-10-19 20:09 ET: Merge main (online saves Phase 1) into Hearthmoor movement polish (build 20261019-2009)

- What changed and why: Merged `origin/main` at `f17b830` (PR #99, online saves Phase 1, build 20261019-1759) into this branch and kept both sides. CHANGELOG keeps both entries. `index.html` and `version.json` take main's side and the new stamp 20261019-2009, later than 1759. `python3 tools/gen_mapdata.py` made no further change. Save `v` stays 2.
- Files touched: merge of `main`, restamp of `index.html` and `version.json`, `CHANGELOG.md`.
- Commit(s) + build id: merge commit on `cursor/hearthmoor-movement-polish`, build 20261019-2009.
- Tests run and result (widths, checks): `python3 tools/bump_build.py --check` exit 0. Full suite after the merge: `npm run test:agent` PP_TEST RESULT: FAIL exit=1 passed=1156 failed=1 flaky=0 skipped=16 time=1699s. The one failure was `[320] tests/rx_f4_pilot.spec.js:208` (tank frames). On main `f17b830` on the same box, `npm run test:agent -- tests/rx_f4_pilot.spec.js -g "tanks hold"` gives PP_TEST RESULT: FAIL exit=1 passed=0 failed=3 at all three widths, so that failure is already on main.
- Decisions made (colour + reasoning): no new id. Next free stays D195.
- Anything left unfinished: none from the merge.

## 2026-10-19 18:56 ET: Hearthmoor movement polish (build 20261019-1856)

- What changed and why: Vincent's playtest found column 18 outside Amberhill Flats read as one clipped stack, and Officer Bren kept walking into the keeper. The lantern post moves from (18,18) to (18,19). The Flats sign moves from (18,16) to (14,18), in front of the Flats wall left of the door, so it reads from the School Lane path at (14,19) and from the door step. Before, it could only be read from (18,14) on the Lantern House strip. The leaf litter stays at (18,15). Bren's beat was the whole main road, (4,8) to (18,8). It is now (1,7) to (1,9) in the west yard, off every path, door front and sign tile. `tickPatrol` makes a patrolling NPC wait while the keeper is within 2 tiles, and face the keeper when beside them. Walk toasts were checked: none sets an input lock (toasts are `pointer-events:none`, and no toast calls `clearMoves`). The stop came from walking into Bren, which is bump-to-talk. A new spec holds the walk through the "Nice walk" toast. Save `v` stays 2. No new flags. No new player copy.
- Files touched: `data/detail_lizzy.json`, `data/civic.json`, `data/mapdata.js`, `game.js`, `tests/hearthmoor_polish.spec.js` (new), `tests/lizzy.spec.js`, `tests/maps_b4.spec.js`, `tests/civic.spec.js`, `tests/README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261019-1856.
- Tests run and result (widths, checks): `npm run test:agent -- tests/hearthmoor_polish.spec.js tests/civic.spec.js tests/lizzy.spec.js tests/maps_b4.spec.js` PP_TEST RESULT: PASS exit=0 passed=108 failed=0 flaky=0 skipped=0 time=172s. Full suite: PP_TEST RESULT: FAIL exit=1 passed=1140 failed=2 flaky=0 skipped=16 time=1702s. The only failure was `[375,390] tests/rx_f4_pilot.spec.js:208` (tank frames). It also fails on unchanged main (build 20261019-1722) at all three widths on this box, so it is not from this change. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error). Hearthmoor reachable cells (BFS from (3,6), blocked tiles excluded, rival and side flags set): 255 on main, 256 here.
- Decisions made (colour + reasoning): green, cleared by the Supervisor. No new id. Next free stays D195.
- Anything left unfinished: `hm_board` (8,7) sits on the row 7 path tiles, but that plaza is from `town_board.json`, and the row 8 road beside it stays open, so it was left. `hm_bush_w` (1,10) seals a 5-cell dead-end strip at x 1, rows 11 to 15. No walking line goes there, so it was left.

## 2026-10-19 20:05 ET: Grow-up tip stays away after the partner grows up (build 20261019-2005)

- What changed and why: The growing up tip (D180) could open on WALK after the partner had already grown up, and SHOW ME landed on the Pet tab with no GROW UP button. The tip is offered only when the partner is ready. Growing up marks `story.unlock_growup` and drops the queued tip. An older save whose starter has already grown up (on the team or in the box) is marked seen on load. A wild Walkling does not count. Replay tips still clears the flag and can show the card again while the partner is ready. Save `v` stays 2. No new decision id.
- Files touched: `game.js`, `save.js`, `tests/unlock.spec.js`, `tests/README.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`, `review-growup-tip/walk-after-growup-390.png`.
- Commit(s) + build id: build 20261019-2005.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/unlock.spec.js` PP_TEST RESULT: PASS exit=0 passed=24 failed=0 flaky=0 skipped=0 time=104s (320, 375, 390). Full suite: PP_TEST RESULT: PASS exit=0 passed=1157 failed=0 flaky=0 skipped=16 time=1661s. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error). Shot: `review-growup-tip/walk-after-growup-390.png`.
- Decisions made (colour + reasoning): no new id. D180 stays settled. Green bug fix.
- Anything left unfinished: none.

## 2026-10-19 19:55 ET: Interior room zoom (build 20261019-1955)

- What changed and why: Small interiors draw larger, in whole steps, up to twice the outdoor scale. Fit-width rooms, including the Arbiter Bay, stay on the width-fit camera with void bars. A room that fits is still centred. A larger one still follows and clamps. The scale snaps when arrival fits the map, at the black midpoint of the 250 ms warp. Leftover edges use the skin's wall cap colour. Buttons, the tip, dialogs and toasts stay screen-size. World art stays crisp. A tap still lands on the tile under the finger. Save `v` stays 2. Merged `origin/main` (PR #99, online saves Phase 1, build 20261019-1759) and kept both sides. No map grid changed.
- Files touched: `game.js`, `tests/room_zoom.spec.js`, `index.html`, `version.json`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `tests/README.md`, `CHANGELOG.md`.
- Commit(s) + build id: build 20261019-1955.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/room_zoom.spec.js` PP_TEST RESULT: PASS exit=0 passed=3 failed=0 flaky=0 skipped=0 time=4s. Full suite: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1148 failed=0 flaky=0 skipped=16 time=2035s. Widths 320, 375, and 390. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): D231–D239 settled. D233 and D236 are yellow. Vincent, Oct 19, 2026, 7:38 PM ET, approved the defaults: one tile of width slack only when both edge columns are solid wall, and leftover edges use the wall cap colour (void when a skin has no wall table). No id was renumbered. The next free id is D240.
- Anything left unfinished: Design's ROOM_ZOOM.md, room_zoom.json and the 390 mocks were not on this machine, so the rows follow the approved summary. Stair and door glint was not on main yet, so it is not checked at 3x and 4x here.

## 2026-10-19 19:54 ET: Modern taps push the toy and pop balloons (build 20261019-1954)

- What changed and why: A Modern tap on the popping toy only walked up beside it, and Arcade TALK stayed off. A roll prop now counts as talkable, so the tap walks up and pushes, and TALK pushes too. The dream_toy marker follows the toy. Birthday balloons are scene-only props, so the same tap skipped them. A Modern tap now selects any object with an interaction (scene, shop, booth, panel, and the kinds that already talked). The balloon tap walks up and pops it. The Heights supply crate is the only shop with no lines, and a tap opens it. Arcade TALK and d-pad bumps are unchanged for those scene-only and shop-only props. Progress stays in the existing story flags. Save `v` stays 2. Merged `origin/main` (PR #99, online saves Phase 1) after that stamp.
- Files touched: `game.js`, `quests.js`, `tests/dream_toy.spec.js`, `tests/tap_interact.spec.js`, `tests/README.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261019-1954, after merging PR #99. The earlier stamp on this branch was 20261019-1925.
- Tests run and result (widths, checks): after merging PR #99, `npm run test:agent` PP_TEST RESULT: FAIL exit=1 passed=1159 failed=1 flaky=0 skipped=16 time=1638s. Widths 320, 375, and 390. The one failure was `[320] tests/group_battle.spec.js:134` (a 10s wait for the win). The same check passed at 375 and 390 in that run. Rerun: `npm run test:agent -- tests/group_battle.spec.js --project=320` PP_TEST RESULT: PASS exit=0 passed=7 failed=0 flaky=0 skipped=0 time=5s. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): green. The toy fix was settled by the Supervisor. Vincent, Oct 19, 2026, 7:17 PM ET, added the balloon and the interactable audit. No new decision id. `OPEN_DECISIONS.md` on this branch still names D195 as the next free id.
- Anything left unfinished: a few older tiles still have no free stand (listed in the PR). Arcade still does not pop a balloon by bumping it or with TALK. That behaviour was already the case.

## 2026-10-19 17:59 ET: Merge main into online saves Phase 1 (build 20261019-1759)

- What changed and why: Merged `origin/main` (PR #98, Arbiter Test music and the final tour copy, build 20261019-1722) into the Phase 1 branch and kept both sides. The stamp is 20261019-1759, later than 20261019-1722. `data/glimmer_path.json` arrived with main's `data/mapdata.js`; regenerating mapdata made no further change. Save `v` stays 2. The next free id stays D195.
- Files touched: merge of `main`, restamp of `index.html` and `version.json`, `CHANGELOG.md`.
- Commit(s) + build id: build 20261019-1759.
- Tests run and result (widths, checks): `python3 tools/bump_build.py --check` exit 0. Full suite: PP_TEST RESULT: PASS exit=0 passed=1145 failed=0 flaky=0 skipped=16 time=1605s. Widths 320, 375, and 390.
- Decisions made (colour + reasoning): no new id. Next free stays D195.
- Anything left unfinished: Phase 2 (Link Google, sign out, a second device, the privacy line). The Realtime Database lock on that branch is replaced by the Play together rules on this branch.

## 2026-10-19 17:22 ET: Arbiter Test music and final tour copy (build 20261019-1722)

- What changed and why: `MUSIC.arbiter_test` is the Design-approved v2b literal (D164 / D189): B phrygian, 68 BPM, 8 bars, 16 steps per bar, triangle lead at 0.18, square bass at 0.065. It was generated with `tools/midi2music.py` and matches the approved JSON. The Bright Pavilion Tour stops, the wait line, and the stage photo use the final D26 lines, spoken by Associate Juniper. The placeholder keys for those lines are gone. Main's D194 QUEST board rows are kept. Save `v` stays 2.
- Files touched: `sfx.js`, `data/glimmer_path.json`, `data/mapdata.js`, `game.js`, `style.css`, `tests/arbiter_test.spec.js`, `tests/glimmer_fernbrook.spec.js`, `tests/maps_b8.spec.js`, `tests/town_board_gate.spec.js`, `review-arbiter-swap/`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `tests/README.md`, `TOWN_BOARD.md`, `DESIGNER_PROMPT.md`, `DESIGN_HANDOFF.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261019-1722.
- Tests run and result (widths, checks): Full suite after the main merge: `npm run test:agent` PP_TEST RESULT: PASS exit=0 passed=1130 failed=0 flaky=0 skipped=16 time=1624s. Widths 320, 375, and 390. The earlier failures in `tests/maps_b8.spec.js` (the Glow Census wait line) and `tests/town_board_gate.spec.js` (the QUEST board rows) were fixed and rerun: `npm run test:agent -- tests/maps_b8.spec.js tests/town_board_gate.spec.js` PP_TEST RESULT: PASS exit=0 passed=20 failed=0 flaky=0 skipped=4 time=35s. No known timing flake failed, so none was rerun alone. `python3 tools/bump_build.py --check` exit 0. Console errors: none (the specs fail the run on a console error).
- Decisions made (colour + reasoning): no new id. D26 copy is final (yellow, already settled). D164 delivered the `arbiter_test` row (already settled). D194 stays the settled QUEST-tab row from main. The next free id is D195.
- Anything left unfinished: Frostmere is not built. Glimmer Act 2 is still TBD.

## 2026-10-19 17:18 ET: Online saves Phase 1 on (build 20261019-1718)

- What changed and why: Phase 1 is ON. `cloud_config.js` holds the public web config for project `walklings-4cc89`. Anonymous sign-in backs up `saves/{uid}`. The Settings row reads "This browser only: link Google to keep it safe". `database.rules.json` locks the Realtime Database until a later multiplayer phase. Automated tests ignore that config when `navigator.webdriver` is set and cannot resolve the Firebase hosts, so they never create users or write documents. Save `v` stays 2.
- Files touched: `cloud_config.js`, `cloud.js`, `database.rules.json`, `firebase.json`, `playwright.config.js`, `tests/cloud_off.spec.js`, `index.html`, `version.json`, `AGENTS.md`, `README.md`, `tests/README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `review-cloud-on/`.
- Commit(s) + build id: build 20261019-1718.
- Tests run and result (widths, checks): `npm run test:agent -- tests/cloud_off.spec.js` PP_TEST RESULT: PASS exit=0 passed=15 failed=0 flaky=0 skipped=0 time=6s (320, 375, 390). `npm run test:agent -- tests/smoke.spec.js tests/save_copy.spec.js` PP_TEST RESULT: PASS exit=0 passed=27 failed=0 flaky=0 skipped=0 time=42s. Full suite: PP_TEST RESULT: PASS exit=0 passed=1139 failed=0 flaky=0 skipped=16 time=1592s. `python3 tools/bump_build.py --check` exit 0. One live smoke from localhost in a throwaway profile: anonymous sign-in, `saves/{uid}` rev 1 then rev 2, a write to another uid denied, the Settings row read "This browser only: link Google to keep it safe", and Delete cloud save removed the doc. Shots: `review-cloud-on/` at 390×844.
- Decisions made (colour + reasoning): no new id. Phase 1 shipped quietly was already settled (Vincent, Oct 8, 2026). Next free stays D195. Green: the suite forces the live project off.
- Anything left unfinished: Phase 2 (Link Google, sign out, a second device, the privacy line). The Realtime Database stays locked.

## 2026-10-19 16:17 ET: Accepted board slips on the QUEST tab (build 20261019-1617)

- What changed and why: An accepted town-board slip is a read-only row on the QUEST tab after the side rows, once the player says yes (`story.board_<chain>_yes`). A pin alone stays off the panel. The row shows the slip name and the current step, and it leaves when `_done` is set. Decline never lists it. Those rows count in the SIDE heading and in the QUEST pulse. Pins stay out of `SIDE_CHAINS`. The pin list and the map chevron are unchanged. Save `v` stays 2. No new flags.
- Files touched: `game.js`, `index.html`, `style.css`, `tests/town_board_gate.spec.js`, `tests/README.md`, `TOWN_BOARD.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261019-1617.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/town_board_gate.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=2 failed=0 flaky=0 skipped=0 time=12s. `node tools/pp_test.js tests/quest_multi.spec.js` PP_TEST RESULT: PASS exit=0 passed=51 failed=0 flaky=0 skipped=0 time=57s. Full suite: PP_TEST RESULT: FAIL exit=1 passed=1122 failed=2 flaky=0 skipped=16 time=1614s. The two failures were `[320] tests/group_battle.spec.js:134` (a 10s wait for the win) and `[390] tests/rx_f4_pilot.spec.js:208` (tank frames). Reruns: `node tools/pp_test.js tests/group_battle.spec.js --project=320` PP_TEST RESULT: PASS exit=0 passed=7 failed=0 flaky=0 skipped=0 time=5s. `node tools/pp_test.js tests/rx_f4_pilot.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=13 failed=0 flaky=0 skipped=0 time=13s. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D194 yellow, Vincent, Oct 19, 2026, about 4:05 PM ET. It narrows D40. Bounties still held (D47) follow D194 when they land. No id was renumbered. The next free id is D195.
- Anything left unfinished: the rest of the slip catalog, a Mahopac slip, and bounties. The bounty heading stays empty.

## 2026-10-19 13:54 ET: Testing choice speaker, lock buttons, collection toast (build 20261019-1354)

- What changed and why: The Hall review choice "How do you close the review?" is spoken by Associate Quinn. Rook still has only the chip aside, and the click line stays narration. A locked Walkling's TO WALKLING-BOX and RELEASE are greyed, and the slot says they stay. The lock mark sits on a yellow plate and beside the name. On WALKLINGS the stay toast sits above the tab bar, under the collection title. Save `v` stays 2.
- Files touched: `data/glimmer_path.json`, `data/mapdata.js`, `game.js`, `style.css`, `tests/arbiter_test.spec.js`, `README.md`, `tests/README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261019-1354.
- Tests run and result (widths, checks): `npm run test:agent -- tests/arbiter_test.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=7 failed=0 flaky=0 skipped=0 time=7s. Full suite: PP_TEST RESULT: FAIL exit=1 passed=1123 failed=1 flaky=0 skipped=16 time=1873s. The one failure was `[320] tests/group_battle.spec.js:134` (a 10s wait for the win). Rerun: `npm run test:agent -- tests/group_battle.spec.js --project=320` PP_TEST RESULT: PASS exit=0 passed=7 failed=0 flaky=0 skipped=0 time=5s. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): no new id. D188 already locks box, release, and trade. This makes the party slot show that. Next free stays D194.
- Anything left unfinished: Design still owes the Testing MIDI (D164). Tour slogans stay placeholders. Frostmere is not built. Glimmer Act 2 is still TBD.

## 2026-10-19 13:16 ET: Arbiter Testing and holder wording (build 20261019-1316)

- What changed and why: Hall slot 2 on the Glimmer path is Arbiter Testing. One chosen Walkling is chipped, locked in the party, and starts at align 50. Quota and Face the review still grant the seal with no chip. PARTNER shows ALIGN under NRG only when the partner is chipped. Glimmer stay at R6 leaves Rook's quit unset and keeps the lanyard. Accepting his crate offer writes `story.rook_quit` `"offer"`. Player-facing copy says holder. Code ids stay. Save `v` stays 2. `tour.doubt` is read once into `story.tour_unease` and the old key stays on disk.
- Files touched: `data/glimmer_path.json`, `data/rook_crossroads.json`, `data/maps_slice.json`, `data/civic.json`, `data/mapdata.js`, `game.js`, `save.js`, `sfx.js`, `quests.js`, `index.html`, `style.css`, `tests/arbiter_test.spec.js`, `tests/glimmer_cobble.spec.js`, `tests/glimmer_fernbrook.spec.js`, `tests/rook_crossroads.spec.js`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `README.md`, `tests/README.md`, `DESIGNER_PROMPT.md`, `DESIGN_HANDOFF.md`, `version.json`.
- Commit(s) + build id: build 20261019-1316.
- Tests run and result (widths, checks): `npm run test:agent -- tests/arbiter_test.spec.js tests/glimmer_cobble.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=15 failed=0 flaky=0 skipped=0 time=17s. `npm run test:agent -- tests/glimmer_fernbrook.spec.js tests/rook_crossroads.spec.js tests/stat_display.spec.js tests/music_tracks.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=19 failed=0 flaky=0 skipped=0 time=60s. `npm run test:agent -- tests/party_qa.spec.js tests/standing.spec.js` PP_TEST RESULT: PASS exit=0 passed=51 failed=0 flaky=0 skipped=0 time=58s. Full suite after the Cald merge: PP_TEST RESULT: PASS exit=0 passed=1124 failed=0 flaky=0 skipped=16 time=1594s. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D24, D25, D187, D188, D189, and D191 are red. D26, D190, D192, and D193 are yellow. Vincent, Oct 19, 2026, YES TO ALL. No new id. Next free stays D194. D127 and D130 keep their numbers. D25 supersedes the Episode 1 always-quit clause.
- Anything left unfinished: Design still owes the Testing MIDI (D164). The row in the game is a stub in that shape. Tour slogans and recipients stay placeholders. Frostmere is not built. Glimmer Act 2 is still TBD. Cald's gate count is on main and is merged into this branch. D73, D80, D104, and D142–D147 stay as that build settled them.
## 2026-10-19 11:48 ET: Cald's gate count (build 20261019-1148)

- What changed and why: After Rook's battle, Hearthmoor hangs one slip, Gate count. Go see them pins Officer Cald. His yes sends you to the east sign. The sign confirms the post is still standing. Telling him finishes the slip and adds 2 bond. Decline sets nothing. Other towns have no slips. The bounty heading stays empty. The main quest id does not change. Save `v` stays 2. D73, D80, D104, and D142–D147 are settled. The next free id stays D187. No id was renumbered. `cond()` is unchanged.
- Files touched: `quests.js`, `game.js`, `style.css`, `data/civic.json`, `data/town_board.json`, `data/mapdata.js`, `tests/town_board_gate.spec.js`, `tests/integrity_lib.js`, `tests/README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `TOWN_BOARD.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`, `.cursor/skills/walklings-quests/SKILL.md`, `.cursor/skills/walklings-quests/REFERENCE.md`, `.cursor/skills/walklings-docs/SKILL.md`.
- Commit(s) + build id: build 20261019-1148.
- Tests run and result (widths, checks): `npm run test:agent -- tests/town_board.spec.js --project=320` PP_TEST RESULT: PASS exit=0 passed=3 failed=0 flaky=0 skipped=0 time=3s. `npm run test:agent -- tests/town_board_gate.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=2 failed=0 flaky=0 skipped=0 time=7s. Full suite: PP_TEST RESULT: PASS exit=0 passed=1103 failed=0 flaky=0 skipped=16 time=1960s. An earlier full run failed two 375 checks (`group_battle` battle menu, `rx_f4_pilot` tank frames) that passed at 320 and 390 in that same run; `npm run test:agent -- tests/group_battle.spec.js tests/rx_f4_pilot.spec.js --project=375` then passed (PP_TEST RESULT: PASS exit=0 passed=20 failed=0 flaky=0 skipped=0 time=16s). `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D73 yellow: no dedicated story writer; Design owns story copy. D80 approved as shipped (phone contacts). D104 stays reserved for Lizzy; Q28 keeps D92–D103. D142 green: `env:<tag>` recorded, `cond()` unchanged. D143 green: Morolow onstage. D144 yellow settled yes: Ossabell one night line. D145 yellow settled yes: gate school on `story.slice_end`. D146 green: reuse Clerk Wynn. D147 yellow: foreshadow only, no follow-up. Reward for the slip is bond 2 (green, no new id).
- Anything left unfinished: the rest of the slip catalog, a Mahopac slip, and bounties. D142 does not add `env:` to `cond()`.

## 2026-10-18 04:53 ET: Engineering gaps (build 20261018-0453)

- What changed and why: Upstairs, the school, and both flats rooms stay on the Hearthmoor node, and the map check fails if that link breaks. Full-run waits no longer depend on the typewriter frame or a wall-clock hop timer. Tour shots go to `PP_ART` or a temp directory. Daily explore XP and the bad-save check use the browser's own day. Save `v` stays 2. No new rooms and no new art.
- Files touched: `game.js`, `minigames.js`, `tests/helpers.js`, `tests/map.spec.js`, `tests/maps_b2.spec.js`, `tests/maps_b5.spec.js`, `tests/maps_b8.spec.js`, `tests/rx_f4_pilot.spec.js`, `tests/highcharity.spec.js`, `tests/group_battle.spec.js`, `tests/ios_reload.spec.js`, `tests/tutorial.spec.js`, `tests/unlock.spec.js`, `tests/stat_display.spec.js`, `tests/save_copy.spec.js`, `tests/look_keys.spec.js`, `tests/README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261018-0453.
- Tests run and result (widths, checks): scoped specs at 320, 375 and 390. `TZ=UTC` and `TZ=America/New_York` both passed `stat_display` and `save_copy`. Full suite, twice: PP_TEST RESULT: PASS exit=0 passed=1101 failed=0 flaky=0 skipped=12 time=1519s. PP_TEST RESULT: PASS exit=0 passed=1101 failed=0 flaky=0 skipped=12 time=1514s. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D168 and D169 settled. Vincent, Oct 18, 2026, approved as shipped. No new id. Next free stays D187.
- Anything left unfinished: D80, the D104 overlap, and D142–D147 stay open and unrenumbered. `dream_2004` and `fb_lantern_in` were not edited.

## 2026-10-17 09:44 ET: The leak choice is narration (build 20261017-0944)

- What changed and why: "How do you fix this?" no longer wears Mr. Gristle's name. The three answers stay the same, including "Make him fix it", so the prompt is narration. Standing and trust are unchanged. Save `v` stays 2.
- Files touched: `data/detail_lizzy.json`, `data/mapdata.js`, `game.js`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261017-0944.
- Tests run and result (widths, checks): `npm run test:agent -- tests/leak5b.spec.js` at 320, 375 and 390. PP_TEST RESULT: PASS exit=0 passed=12 failed=0 flaky=0 skipped=0 time=39s. Other choices do not pass a speaker, so their nameplates are unchanged.
- Decisions made (colour + reasoning): no new id. The spec prompt stays "How do you fix this?"; only the speaker nameplate is cleared.
- Anything left unfinished: none.

## 2026-10-17 08:28 ET: Compass tour step and unlock tips (build 20261017-0828)

- What changed and why: The opening tour points at the compass before the last card. A save already on that last card skips it. Nine later tips (trust, the phone, a side, a side quest, a big choice, switching sides, a letter, a Lantern, and growing up) each show once, 600 ms after the walk screen is quiet. SKIP or a tap outside puts one away. Settings has Tips on/off and Replay tips. Save `v` stays 2.
- Files touched: `game.js`, `save.js`, `quests.js`, `index.html`, `style.css`, `tests/unlock.spec.js`, `tests/tutorial.spec.js`, `tests/quest_multi.spec.js`, `tests/reputation.spec.js`, `README.md`, `tests/README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261017-0828.
- Tests run and result (widths, checks): `npm run test:agent` at 320, 375 and 390. PP_TEST RESULT: PASS exit=0 passed=1092 failed=0 flaky=0 skipped=12 time=1864s. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D180, already settled. No new id. Design still adds the T12r row to `design/specs/TUTORIAL.md` (that file is not in this repo).
- Anything left unfinished: none on this packet.

## 2026-10-17 08:17 ET: The leak in 5B, one moral choice (build 20261017-0817)

- What changed and why: Inspecting the bucket starts "The leak in 5B". Lizzy asks you to talk to Mr. Gristle. Take it to the Keepers, make him fix it, or leave it. That choice grants Standing and trust once, through `data/moral_quests.json`. The court path is Clerk Wynn, then Constable Rue. Both endings pay Hearty Snack ×2 and stop the drip. Save `v` stays 2.
- Files touched: `data/moral_quests.json`, `data/detail_lizzy.json`, `data/civic.json`, `data/reputation.json`, `data/mapdata.js`, `tools/gen_mapdata.py`, `game.js`, `quests.js`, `tests/leak5b.spec.js`, `README.md`, `tests/README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261017-0817.
- Tests run and result (widths, checks): `npm run test:agent -- tests/leak5b.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=4 failed=0 flaky=0 skipped=0 time=13s. Widths 320 and 375 follow with the last packet.
- Decisions made (colour + reasoning): D177 (red, the one Standing grant from a quest, only through `moral_quests.json`) and D182, both already settled. No new id.
- Anything left unfinished: the compass tour step and the unlock tips.

## 2026-10-17 08:10 ET: Flat 5B is 18 by 16, and Buddy is home (build 20261017-0810)

- What changed and why: Amberhill Flats 5B grows from 14 by 12 to 18 by 16. The bathroom, the three bedrooms, the drip, and Buddy's bed are in. Lizzy and Buddy are home only after you have met her, and Buddy also sits beside her desk at school. Patting him plays a short pet sound and gives 1 bond once a day. Windows sit on the face row at columns 3, 9 and 15. Morolow's floor is redrawn as calm planks (7 px boards, a dark groove, a few paint flecks) because the supplied tile broke the plank rule. Lizzy's room and Ossabell's room keep the honey floor. Save `v` stays 2.
- Files touched: `data/detail_lizzy.json`, `data/mapdata.js`, `sprites.js`, `game.js`, `sfx.js`, `quests.js`, `tests/lizzy.spec.js`, `tests/interior_walls.spec.js`, `README.md`, `tests/README.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261017-0810.
- Tests run and result (widths, checks): `npm run test:agent -- tests/lizzy.spec.js tests/interior_walls.spec.js --project=390` PP_TEST RESULT: PASS exit=0 passed=9 failed=0 flaky=0 skipped=0 time=17s. The other two widths follow with the later packets. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D173 and D181, settled earlier, built here. D184's plank rule applied to `floor_paint_plank` only. No new decision id. D177, D180 and D182 stay for the next commits on this branch.
- Anything left unfinished: the leak quest, the moral step, and the unlock tips.

## 2026-10-17 06:48 ET: Merged the reputation work (PR #91) into the floor fix (build 20261017-0648)

- What changed and why: Merged `main` (Lizzy B, the reputation work, build 20261017-0510) and kept the calm floors. `data/mapdata.js` was regenerated. Floors only: flat 5B (`hm_flats_5`) still uses `floor_honey`. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `BACKLOG.md`, `NEXT_PLAN.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md` (both sides kept: D162–D167 and D170–D182 from `main`, then D184–D186), `README.md` and `tests/README.md` (the floor wording on top of `main`), `CHANGELOG.md` (both sides kept), `index.html` (`main`, restamped), `version.json`.
- Commit(s) + build id: build 20261017-0648.
- Tests run and result (widths, checks): `floors_check.py` on the merged tree: PASS (18 rooms, 54 tiles through png2grid, no brick/block, calm, D88 <= 70 %, unique across 40 interiors). Full `npm run test:agent` at 320, 375, and 390: PP_TEST RESULT: FAIL exit=1 passed=1061 failed=4 flaky=0 skipped=12 time=2977s. All four failures were timeouts in a slow run: `[320] maps_b2.spec.js:142` and `[390] rx_f4_pilot.spec.js:149` (5 s waits for scene text), `[375] highcharity.spec.js:252` (60 s test timeout), and `[390] glimmer_fernbrook.spec.js:124`. Each passed 5 of 5 when rerun alone at that width, so they are recorded as flakes. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): kept both sides. No id was renumbered. D183 is unused. The next free id is D187.
- Anything left unfinished: flat 5B is left for a later rebuild.

## 2026-10-17 04:45 ET: Calm floors in 18 interiors (build 20261017-0419)

- What changed and why: Eighteen interiors get the approved calm floors (FLOOR_FIX). Each floor is a main tile plus two accents at weights 0.22 and 0.18, so one tile stays at or under 70 percent of the walkable cells. Walls, walkability, props, rugs, grids, and warps stay as they are. The old floor tiles stay defined. Flat 5B still uses the honey floor. Save `v` stays 2. No new palette keys.
- Files touched: `sprites.js`, `tests/floor_fix.spec.js`, `tests/floor_fix_grids.json`, `tests/floor_fix_expect.json`, `tests/house_reskin.spec.js`, `tests/lantern_palette.spec.js`, `tests/maps_b3.spec.js`, `tests/maps_b6.spec.js`, `tests/maps_b7.spec.js`, `tests/obs_fix.spec.js`, `README.md`, `tests/README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261017-0419.
- Tests run and result (widths, checks): `npm run test:agent` at 320, 375, and 390. PP_TEST RESULT: PASS exit=0 passed=1008 failed=0 flaky=0 skipped=12 time=1542s. The suite's console-error check passed. `python3 tools/bump_build.py --check` exit 0. `floors_check.py` on the approved packet: PASS (18 rooms, 54 tiles, no brick/block, calm, D88 <= 70 %, unique across 40 interiors).
- Decisions made (colour + reasoning): D184, D185, and D186 were yellow and are settled. Vincent, Oct 17, 2026, 3:16 AM ET, default: yes to the plank rule, the three stone floors, and the three named rooms (Rook's oak boards, the loft's white boards, the observatory's dusk-violet boards). No id was renumbered. The next free id is D187. D168–D169 stay the music test calls. Flat 5B is left for a later rebuild.
- Anything left unfinished: Lizzy's flat 5B (`hm_flats_5`) still uses `floor_honey`. A later pass rebuilds that room.

## 2026-10-17 05:10 ET: Merged Lizzy A (PR #90) into the reputation branch (build 20261017-0510)

- What changed and why: Merged `main` (Lizzy A: English Lizzy, the dialog box clears the speaker, Hearthmoor 24 by 24; build 20261017-0404) and kept the reputation work. `data/mapdata.js` was regenerated. Save `v` stays 2. Merge-integration test fix: the strict reputation cast check logs a console error for any speaker missing from `data/reputation.json`, and `tests/dialog_clear.spec.js` (from PR #90) used a made-up speaker, Fern, so all of its tests failed after the merge. The test now uses Cass, who is in the cast and has the same name length; Pip and Wren were already in the cast. Every assertion, position and box check is unchanged. The cast check and the game data are unchanged.
- Files touched: merge of `main`; `tests/dialog_clear.spec.js`. Conflicts: `BACKLOG.md` (main's id text, plus the reputation line reworded to "in the game (Lizzy B, PR #91)"), `tests/README.md` (both paragraphs kept), `CHANGELOG.md` (both sides kept), `index.html` (this branch, restamped), `version.json`, `data/mapdata.js` (regenerated).
- Commit(s) + build id: build 20261017-0510.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/dialog_clear.spec.js tests/reputation.spec.js tests/tutorial.spec.js tests/maps_b3.spec.js` at 320, 375, and 390: PP_TEST RESULT: PASS exit=0 passed=81 failed=0 flaky=0 skipped=0 time=148s. Full `npm run test:agent`: PP_TEST RESULT: FAIL exit=1 passed=1060 failed=2 flaky=0 skipped=12 time=2666s. Both failures were 30 s timeouts in a slow run, recorded as flakes: `[390] map.spec.js:26` (page load timed out) and `[375] maps_b8.spec.js:265`. Each passed 5 of 5 when rerun alone at that width. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): kept both sides. No id was renumbered. The next free id stays D183, as on `main`.
- Anything left unfinished: none on this branch. Q19 stays the queue.

## 2026-10-17 04:03 ET: Merged the interior wall kit into the reputation branch (build 20261017-0403)

- What changed and why: Merged `main` (every interior uses the shared wall kit, build 20261017-0352) and kept the reputation work. `data/mapdata.js` was regenerated. Save `v` stays 2. This restamp is the build on the branch.
- Files touched: merge of `main`. Conflicts: `BACKLOG.md`, `CHANGELOG.md`, `index.html`, `version.json`, `data/mapdata.js` (regenerated).
- Commit(s) + build id: build 20261017-0403.
- Tests run and result (widths, checks): full `npm run test:agent` after the merge: PP_TEST RESULT: PASS exit=0 passed=1035 failed=0 flaky=0 skipped=12 time=1853s at 320, 375, and 390.
- Decisions made (colour + reasoning): kept both sides. No decision file edited. The next free id stays D170, as on `main`.
- Anything left unfinished: none on this branch. Q19 stays the queue.

## 2026-10-17 03:36 ET: Letter lines stay behind later story talk (build 20261017-0336)

- What changed and why: The High Charity letter still answers by trust (D174), and it no longer covers a later line. Captain Lumen's council still starts, and after it he still says the road stays dark. Usual side and standing lines stay behind the letter. Save `v` stays 2.
- Files touched: `game.js`, `index.html`, `tests/reputation.spec.js`, `README.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261017-0336.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/reputation.spec.js tests/lantern_council.spec.js --project=390` PASS exit=0 passed=13. Full `npm run test:agent` on that commit: PP_TEST RESULT: PASS exit=0 passed=1032 failed=0 flaky=0 skipped=12 time=1460s at 320, 375, and 390.
- Decisions made (colour + reasoning): green. The letter sits in front of everyday chatter and behind a later story flag. No decision file edited.
- Anything left unfinished: none on this branch. Q19 stays the queue.

## 2026-10-17 03:08 ET: Merged the music loops into the reputation branch (build 20261017-0308)

- What changed and why: Merged `main` (the eight music loops, build 20261017-0208) and kept the reputation work. `data/mapdata.js` was regenerated. Save `v` stays 2. This restamp is the build on the branch.
- Files touched: merge of `main`. Conflicts: `BACKLOG.md`, `CHANGELOG.md`, `index.html`, `version.json`, `data/mapdata.js` (regenerated).
- Commit(s) + build id: build 20261017-0308.
- Tests run and result (widths, checks): full `npm run test:agent` after the merge.
- Decisions made (colour + reasoning): kept both sides. No decision file edited. The next free id stays D170, as on `main`.
- Anything left unfinished: none on this branch. Q19 stays the queue.

## 2026-10-17 03:07 ET: Letter lines by trust (build 20261017-0307)

- What changed and why: Once the High Charity letter is open, Lizzy, Rook, and Captain Lumen answer it from how much they trust you (D174). The five lines are the samples in `data/reputation.json`. Captain Lumen at 55 is warm for the Keepers and neutral for Glimmerwell. Lines you have not reached yet stay in front of the letter. The map files are unchanged. Save `v` stays 2.
- Files touched: `game.js`, `index.html`, `tests/reputation.spec.js`, `tests/README.md`, `README.md`, `BACKLOG.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261017-0307.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/reputation.spec.js --project=390 -g "letter lines"` PASS exit=0 passed=1.
- Decisions made (colour + reasoning): builds settled D174. The Rook's Crossroads letter uses the same High Charity samples and the same `story.hc_invite` gate. No decision file edited.
- Anything left unfinished: none on this branch. Q19 stays the queue.

## 2026-10-17 03:06 ET: Acorn chip plate (build 20261017-0306)

- What changed and why: The modern walk acorn chip is a nav plate (D179), 44 px tall, with the new acorn and a yellow number. A gain turns the plate blue for 300 ms. Reduced motion skips that, and the first time the count is drawn it does not flash. The header, the bag, and the shop keep the small acorn icon. 99999 still fits inside 48 cells. Save `v` stays 2.
- Files touched: `game.js`, `index.html`, `style.css`, `data/nav_art.js`, `tests/reputation.spec.js`, `tests/README.md`, `README.md`, `BACKLOG.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261017-0306.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/reputation.spec.js tests/ux_review.spec.js --project=390` PASS exit=0 passed=16. The acorn tests at 320 and 390 PASS exit=0 passed=10. `python3 design/specs/nav_art_check.py` PASS.
- Decisions made (colour + reasoning): builds settled D179. The wide plate is a 9-slice frame (left 19, mid 1, right 3), not a 22 px button. No decision file edited.
- Anything left unfinished: letter lines by trust are the next packet on this branch.

## 2026-10-17 02:59 ET: Compass button and the PEOPLE list (build 20261017-0259)

- What changed and why: The compass opens PEOPLE (D176). On the modern walk screen it sits at the top of the left column and QUEST, BAG and MAP move down one slot. In the header it is the first button, 44 px so the tap target matches the gear. PEOPLE lists people you have met, most recent first, with a face, a 0-100 bar and a tier word. Fixed people sit at the end with a lock. An empty list says "Nobody yet. Go say hi." A face opens a card with the stored number, the tier word, and source lines from data. That source list is empty until later quests add rows. Save `v` stays 2.
- Files touched: `game.js`, `index.html`, `style.css`, `data/nav_art.js`, `tests/reputation.spec.js`, `tests/README.md`, `README.md`, `BACKLOG.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261017-0259.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/reputation.spec.js --project=390` PASS exit=0 passed=8. Same spec plus `tests/ux_review.spec.js` at 320: PASS exit=0 passed=15. `tests/controls.spec.js` at 320 and 390: PASS exit=0 passed=42.
- Decisions made (colour + reasoning): builds settled D176. The spec asked for a 32 px header compass "like the settings button"; that button is 44 px and tap targets stay at least 44 px, so the compass is 44. No decision file edited.
- Anything left unfinished: the acorn chip and letter lines are the next packets on this branch.

## 2026-10-17 02:50 ET: Reputation numbers, join penalty, and trust checks (build 20261017-0250)

- What changed and why: Each person you can meet has a 0-100 reputation (D174, D175, D178). Rook starts at 40. Mom and Dad stay at 100. Warden Ilse and Clerk Wynn stay at 50. Joining a side, or switching through Rook, lowers met people of the other side by 10 once. The save stays v2 (`S.rep`, `S.repJoins`).
- Files touched: `data/reputation.json`, `data/mapdata.js`, `tools/gen_mapdata.py`, `rep.js`, `save.js`, `game.js`, `index.html`, `sw.js`, `tests/reputation.spec.js`, `tests/README.md`, `README.md`, `BACKLOG.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261017-0250.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/reputation.spec.js --project=390` — PP_TEST RESULT: PASS exit=0 passed=5 failed=0 flaky=0 skipped=0 time=3s.
- Decisions made (colour + reasoning): builds settled D174, D175, D178. No decision file edited. Twenty-one map contacts missing from the cast table were added as faction none, base 50, so the startup check can pass without inventing a side.
- Anything left unfinished: the compass, PEOPLE list, acorn chip, and letter lines are the next packets on this branch.

## 2026-10-17 03:04 ET: Hearthmoor grows south to School Lane (D170)

- What changed and why: Hearthmoor grows from 24 by 20 to 24 by 24. Rows 0-18 stay put, and so does every door, warp, sign, respawn, and prop. The new path is School Lane. Lizzy stands at (9, 20) facing up, and Buddy stands at (10, 20) facing up. You walk down the lane and talk to her from the grass above. The intro box does not cover her. Save `v` stays 2.
- Files touched: `data/maps_slice.json`, `data/mapdata.js`, `data/detail_lizzy.json`, `tests/lizzy.spec.js`, `tests/README.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261017-0304, restamped 20261017-0306 after merging the music loops from main, and 20261017-0404 after merging main with the interior wall kit (PR #89).
- Tests run and result (widths, checks): `npm run test:agent` at 320, 375, and 390 after merging the music loops: PP_TEST RESULT: PASS exit=0 passed=1029 failed=0 flaky=0 skipped=12 time=1475s. After merging main with PR #89 (build 20261017-0404): PP_TEST RESULT: FAIL exit=1 passed=1030 failed=2 flaky=0 skipped=12 time=3125s. Both failures were 30 s timeouts in an unusually slow run (about twice the usual time), recorded as flakes: `[320] maps_b5.spec.js:159` (the door reaches every person) and `[390] group_battle.spec.js:77` (one turn). Each passed 5 of 5 when rerun alone at that width, and `node tools/pp_test.js tests/maps_b5.spec.js` at 320, 375, and 390 gave PP_TEST RESULT: PASS exit=0 passed=12 failed=0 flaky=0 skipped=0 time=46s. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D170 red, settled by Vincent Oct 17, 2026. Reshapes an Act 1 town, the exception to D81. No new id. No id was renumbered.
- Anything left unfinished: the other Lizzy packets are not this PR.

## 2026-10-17 02:57 ET: Dialog box clears the speaker (D171)

- What changed and why: When a person on the map would stand under the text box, the box moves to the top. If the top would cover them too, the view eases over 150 ms so they sit in the top of the screen, clamped to the map. Reduced motion jumps. Narration, the phone, and a letter overlay stay at the bottom. A say step can force `{"box":"top"|"bottom"}`. The choice stays put for a run of lines from the same speaker. Save `v` stays 2.
- Files touched: `game.js`, `style.css`, `tests/dialog_clear.spec.js`, `tests/README.md`, `README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261017-0257.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/dialog_clear.spec.js` at 320, 375, and 390. PP_TEST RESULT: PASS exit=0 passed=24 failed=0 flaky=0 skipped=0 time=34s. No console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D171 red, settled by Vincent Oct 17, 2026. No new id. No id was renumbered.
- Anything left unfinished: the Hearthmoor south rows (D170) are the next commit on this branch. The other Lizzy packets are not this PR.

## 2026-10-17 02:40 ET: Lizzy speaks English (D172)

- What changed and why: Lizzy understands Spanish and answers in English. Four lines in her intro change: the greeting, "kiddo", "Oh, he is.", and the snack line. Her sisters' Spanish is unchanged. The other nine rewrites are story lines that are not in the game. Save `v` stays 2. Settled rows D162–D167 and D170–D182 are recorded. The next free id is D183. D168–D169 stay reserved for the music test build.
- Files touched: `data/detail_lizzy.json`, `data/mapdata.js`, `tests/lizzy.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261017-0240.
- Tests run and result (widths, checks): `node tools/pp_test.js tests/lizzy.spec.js` at 320, 375, and 390. PP_TEST RESULT: PASS exit=0 passed=18 failed=0 flaky=0 skipped=0. No console errors.
- Decisions made (colour + reasoning): D172 green, settled by Vincent Oct 17, 2026. D162–D167 and D170–D182 recorded as settled. No new id. D168–D169 left for the music build. No id was renumbered.
- Anything left unfinished: the dialog-box rule (D171) and the Hearthmoor south rows (D170) are the next commits on this branch. The other Lizzy packets are not this PR.

## 2026-10-17 02:19 ET: Interior wall kit on every room (build 20261017-0352)

- What changed and why: Every interior now uses the shared two-tile wall kit, in that skin's own colours. Your Home already had it. The other 39 rooms gain the cap, face, trim, baseboard, corners, folds, windows, door jambs, and the floor shadow. Floors, grids, warps, props, and walkability stay as they are. Save `v` stays 2.
- Files touched: `sprites.js`, `game.js`, `data/detail_b5.json`, `data/detail_b6.json`, `data/detail_b7.json`, `data/detail_lizzy.json`, `data/fernbrook_rooms.json`, `data/heights.json`, `data/mapdata.js`, `tests/interior_walls.spec.js`, `tests/house_reskin.spec.js`, `tests/lantern_palette.spec.js`, `tests/obs_fix.spec.js`, `tests/maps_b2.spec.js`, `tests/maps_b3.spec.js`, `tests/maps_b5.spec.js`, `tests/maps_b7.spec.js`, `tests/maps_b8.spec.js`, `tests/controls.spec.js`, `README.md`, `tests/README.md`, `NEXT_PLAN.md`, `BACKLOG.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261017-0352 (first stamped 20261017-0219; restamped after merging main with PR #88 and fixing two test races).
- Tests run and result (widths, checks): before the main merge, `PP_TEST RESULT: PASS exit=0 passed=990 failed=0 flaky=0 skipped=12 time=1469s` at 320, 375, and 390. After merging main with PR #88 (0183fa1): `PP_TEST RESULT: FAIL exit=1 passed=1004 failed=1 flaky=0 skipped=12 time=1647s`; the one failure was a race in `tests/controls.spec.js` (the quest-button dots were read before the button redrew). Two test-only fixes in `tests/controls.spec.js`: the quest-button test now polls until the dots repaint before reading them, and the green-copy Settings test waits until the previous toast is gone and the row can be clicked instead of fixed 2.6 s waits. Every check is kept. `tests/controls.spec.js` at 320, 375, and 390, three runs each: 9 of 9 runs pass (189 passed, 0 failed). `python3 tools/bump_build.py --check` exit 0. Interior-wall checker: `PASS (39 PR 2 rooms, 33 skins, 40 interiors)`.
- Decisions made (colour + reasoning): green. D151, D152, and D153 stay settled. No new id. No id was renumbered. The next free id is D170 (D168–D169 are the music test calls from PR #88).
- Anything left unfinished: none from this kit. Next work stays Q19, town boards.

## 2026-10-17 02:08 ET: Eight music loops for a listening test (build 20261017-0208)

- What changed and why: The eight SuperGrok loops are in `MUSIC`. Trial Hall leaders play `trial`, Rook plays `rival` (before the Glimmerwell check, and a Rook fight does not set `music.glimmer_fought`), the two Trial Hall rooms play `hall`, the RegenX floors and the Heights yard play `lab`, and dream rooms play `dream`. `harbour`, `route3`, and `episode_end` have no map yet and play from the debug Music row. The other loops are unchanged. Save `v` stays 2.
- Files touched: `sfx.js`, `game.js`, `debug_ui.js`, `data/cobblecrest.json`, `data/fernbrook_rooms.json`, `data/heights.json`, `data/mapdata.js`, `tests/music_tracks.spec.js`, `tests/faction_music.spec.js`, `tests/qa_gaps.spec.js`, `tests/look_listen.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261017-0208.
- Tests run and result (widths, checks): `npm run test:agent` at 320, 375, and 390. PP_TEST RESULT: PASS exit=0 passed=1002 failed=0 flaky=0 skipped=12 time=1428s. `python3 tools/bump_build.py --check` exit 0. The suite's console-error check passed.
- Decisions made (colour + reasoning): D168 and D169 are yellow, built for Vincent's listening test. He settles them after he listens. No id was renumbered. Next free id is D170.
- Anything left unfinished: Brinewick, Route 3, and the Episode 1 card are not built, so `harbour`, `route3`, and `episode_end` have no map slot. `town` and `wild_skip` already shared a drum set on main; that pair was left as it was.

## 2026-10-16 16:12 ET: Lantern House test follows D127 (build 20261016-1612)

- What changed and why: `tests/maps_b8.spec.js` (from PR #78) still expected Amos to offer "Pledge desk" to a Glimmerwell player. D127 removed the desks, so the test now checks the desk is absent. `tests/README.md` says the same.
- Files touched: `tests/maps_b8.spec.js`, `tests/README.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-1612.
- Tests run and result (widths, checks): full `npm run test:agent` before this fix: 984 passed, 3 failed (this test at 320/375/390), 12 skipped. After: `maps_b8.spec.js`, `standing.spec.js`, `rook_crossroads.spec.js` rerun.
- Decisions made (colour + reasoning): green; follows D127. No id was renumbered.
- Anything left unfinished: none.

## 2026-10-16 15:39 ET: Decision-id check for Rook's Crossroads (build 20261016-1539)

- What changed and why: Supervisor id check. D161 (end-game side switch, open) does not collide: the design repo's asset-handoff calls start one past it at D162–D167. The next-free-id notes said D162; they now say D168.
- Files touched: `OPEN_DECISIONS.md`, `NEXT_PLAN.md`, `BACKLOG.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-1539.
- Tests run and result (widths, checks): `npm run test:agent`; `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green. D161 kept; no id was renumbered. Vincent, Oct 16, 2026: pledge desks stay removed and Rook's quest is the only switch until the end game.
- Anything left unfinished: D162–D167 rows still need adding to the game repo's decision files.

## 2026-10-16 15:33 ET: Rook's Crossroads merged with current main; desks stay removed (build 20261016-1533)

- What changed and why: Merged current `main` (first-time tour, wall kit, heart alert, Fernbrook rooms, Lizzy). Pledge desks stay removed. Rook's quest is still the only way to switch sides, both ways (D127, D128). End-game switching is an open follow-up (D161) and is not built. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `game.js`, `quests.js`, `tools/gen_mapdata.py`, `tests/integrity_lib.js`, `tests/standing.spec.js` (Lantern room, still no Pledge desk), `CHANGELOG.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `README.md`, `index.html`, `version.json` (restamped), `data/mapdata.js` (regenerated).
- Commit(s) + build id: build 20261016-1533.
- Tests run and result (widths, checks): `PP_PORT=8801 npx playwright test tests/rook_crossroads.spec.js tests/standing.spec.js tests/quest_multi.spec.js` exit 0. 93 passed, 0 failed (2.3m), at 320, 375, and 390. No console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Vincent, Oct 16, 2026: desks stay removed. D127 stands. D128 stays both ways. D161 is open and not built. No id was renumbered. The next free id is D162.
- Anything left unfinished: The end-game switch (D161) is not planned. Frostmere is not built. This branch is not on `main`.

## 2026-10-16 14:05 ET: First-time tour merged with current main (build 20261016-1405)

- What changed and why: Merged current `main` after PR #84 (Your Home wall kit), PR #83 (heart alert), PR #78 and PR #87. The tour is unchanged. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `CHANGELOG.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md` (both kept), `NEXT_PLAN.md` (main's wording, which already names D157–D160), `index.html`, `version.json` (restamped), `data/mapdata.js` (regenerated).
- Commit(s) + build id: build 20261016-1405.
- Tests run and result (widths, checks): `npm run test:agent`; `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green. D157–D160 checked against main and open PRs; no collision. No id was renumbered.
- Anything left unfinished: none from the merge.

## 2026-10-16 09:52 ET: First-time tour after the starter (build 20261016-0952)

- What changed and why: After the starter scene, a new game offers a 14-step tour of the screen and of FEED, PLAY and REST. SKIP and SKIP TOUR end it from any card. Settings has a Tutorial row whose value is REPLAY. The first run's care buttons are real. A replay only highlights them. The save stays v2. Two flags were added: `story.tutorial_done` and `story.tutorial_step`. A save already past the opening is marked done on load. The daily hello waits until the next day. D157–D160 are settled. No id was renumbered.
- Files touched: `game.js`, `index.html`, `style.css`, `save.js`, `tests/helpers.js`, `tests/tutorial.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261016-0952.
- Tests run and result (widths, checks): `PP_PORT=8093 npm test` exit 0 after merging main (the Dream 2004 toy). 903 passed, 12 skipped, 0 failed (20.8m), at 320, 375, and 390. `tests/tutorial.spec.js` passed at all three widths, with no console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Settled by Vincent on Oct 16, 2026. D157 skippable. D158 fires when the starter scene closes, and an older save is marked done. D159 two additive flags, save v stays 2. D160 real care on the first run, highlight only on replay.
- Anything left unfinished: The heart-button glow (D154) is not on main, so step T8 uses the shorter line. When that alert ships, merge main. The Playwright walk ends a one-line scene in the Lodge. It does not play the full starter.

## 2026-10-16 13:13 ET: Home wall kit merged with current main (build 20261016-1313)

- What changed and why: Merged current `main` (PR #78 Fernbrook rooms, PR #83 heart alert, PR #87 asset converters). Your Home still draws the shared wall kit; the heart-alert `care` debug hook and the door-on-wall draw from main are kept next to the wall shadow.
- Files touched: merge of `main`. Conflicts: `game.js` (both kept), `CHANGELOG.md`, `README.md`, `OPEN_DECISIONS.md` (both kept), `BACKLOG.md`, `NEXT_PLAN.md` (main's wording, which already names D151–D153 as settled), `data/mapdata.js` (regenerated), `index.html`, `version.json` (restamped).
- Commit(s) + build id: build 20261016-1313.
- Tests run and result (widths, checks): `npm run test:agent`; `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green. No id was renumbered.
- Anything left unfinished: the other rooms are the next pass.

## 2026-10-16 12:15 ET: Asset converters for palette grids and music loops

- What changed and why: Three tools turn outside art into the forms the game already stores. `png2grid.py` maps a PNG onto palette keys. `midi2music.py` turns a MIDI file into a music-loop literal. `grid2png.py` draws that grid back to a 1× or 4× preview. No game art, player text, or save field changes. Save `v` stays 2.
- Files touched: `tools/png2grid.py`, `tools/midi2music.py`, `tools/grid2png.py`, `tools/assetlib.py`, `tests/asset_converters.spec.js`, `tests/fixtures/assets/`, `tests/README.md`, `CHANGELOG.md`.
- Commit(s) + build id: no new build stamp. Game files are unchanged, so the live id stays `20261016-1138`.
- Tests run and result (widths, checks): `PP_PORT=8799 npm test` exit 0. 951 passed, 12 skipped (22.0m), at 320, 375 and 390. `tests/asset_converters.spec.js` passed at all three widths. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green. Vincent approved the asset handoff, including these converters, on Oct 16, 2026. No id was taken or renumbered.
- Anything left unfinished: the tools are not wired into a deploy. Episode 1 art is still not in the game.

## 2026-10-16 10:17 ET: Home wall kit merged with current main (build 20261016-1017)

- What changed and why: Merged current main, which holds the RegenX look keys and the 2004 memory (the toy rolls from any side, Mom cooks, Dad watches, and that room has no partner). Your Home still draws the shared wall kit. `data/mapdata.js` was regenerated. Save `v` stays 2. The next free id stays D161. D138–D147 stay unrecorded.
- Files touched: merge of `main`. Conflicts: `CHANGELOG.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `OPEN_DECISIONS.md` (both sides kept), `data/mapdata.js` (regenerated), `index.html`, `version.json` (restamped).
- Commit(s) + build id: build 20261016-1017.
- Tests run and result (widths, checks): `PP_PORT=8094 npm test` exit 0. 891 passed, 12 skipped, 0 failed (20.1m), at 320, 375, and 390. `tests/interior_walls.spec.js`, `tests/dream_toy.spec.js`, and `tests/look_keys.spec.js` passed at all three widths, with no console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green. D151, D152 and D153 stay settled. No id was renumbered.
- Anything left unfinished: The other rooms are the next pass. Upstairs lists windows at columns 3 and 5, and that list is not drawn until the loft skin opts in.

## 2026-10-16 09:53 ET: Your Home draws the shared wall kit (build 20261016-0953)

- What changed and why: Your Home stays 9 by 8, with the same warps, props and honey floor. Its wall is now the shared two-tile kit: a warm cap, a pale face, trim, a baseboard, two windows, and a floor shadow under the face. Other reskinned rooms keep their colours. Upstairs stays the loft skin, so the two rooms do not match. Its window list is stored for the later room pass. Save `v` stays 2.
- Files touched: `sprites.js`, `game.js`, `data/detail_b5.json`, `data/mapdata.js`, `tests/interior_walls.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-0953.
- Tests run and result (widths, checks): `PP_PORT=8093 npm test` exit 0. 879 passed, 12 skipped, 0 failed (19.7m), at 320, 375, and 390. `tests/interior_walls.spec.js` passed at all three widths, with no console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Vincent settled D151, D152 and D153 on the defaults (two-tile walls, a window list per map, one colour table per skin). Green: upstairs stays `house_loft` so the loft colours stay and no two rooms match. No id was renumbered. The next free id is D161.
- Anything left unfinished: The other rooms (loft, Lantern House, Rook's House, the Lodge, the Keeper House, the observatory) are the next pass. Upstairs already lists windows at columns 3 and 5, and that list is not drawn until the loft skin opts in.

## 2026-10-16 11:38 ET: Merge Fernbrook rooms and the heart alert (build 20261016-1138)

- What changed and why: Merged `origin/main` after PR #78 (Fernbrook Lantern House, Bloom Trial Hall) and PR #83 (heart alert). Overlay maps from `detail_*` files and `fernbrook_rooms` both load. The school hall, the flats lobby, and flat 5B are unchanged. The id notes now follow main: the next free id is D161. D138–D141 stay the settled Lizzy calls, D142–D147 have no recorded rows, and no id was renumbered. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `game.js`, `tests/integrity_lib.js`, `tests/maps_b7.spec.js` (32 skinned rooms), `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `tests/README.md`, `data/mapdata.js` (regenerated), `index.html`, `version.json` (restamped).
- Commit(s) + build id: build 20261016-1138.
- Tests run and result (widths, checks): `PP_PORT=8811 npm test`; `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green. No id was renumbered.
- Anything left unfinished: The INTERIOR_WALLS kit reaches these three rooms in PR 2.

## 2026-10-16 10:26 ET: Merge the 2004-memory toy fix (build 20261016-1026)

- What changed and why: Merged `origin/main` again after PR #81. In the 2004 memory the pop-toy answers a bump from any side, Mom cooks, Dad watches the set, and no partner follows into that room. The school hall, the flats lobby, and flat 5B stay as the review left them. Save `v` stays 2. The next free id stays D142.
- Files touched: merge of `main`. `data/detail_b7.json`, `data/mahopac.json`, `data/mapdata.js` (regenerated), `game.js`, `sprites.js`, `tests/dream_toy.spec.js`, `tests/maps_b7.spec.js`, `index.html`, `version.json`, `CHANGELOG.md`.
- Commit(s) + build id: build 20261016-1026.
- Tests run and result (widths, checks): `PP_PORT=8806 npm test` exit 0. 903 passed, 12 skipped, 0 failed (20.6m), at 320, 375, and 390. The suite fails a run that logs a console error, and this run did not. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green. The toy fix already shipped on `main`. No id was renumbered.
- Anything left unfinished: Sister scenes, family dinners, school lessons, and the landlord and field-day quests stay out of this build.

## 2026-10-16 09:58 ET: Calm the school hall, the flats lobby, and flat 5B (build 20261016-0958)

- What changed and why: Vincent's review of the schoolhouse and flats. The lobby no longer has a red brick band across the middle or a full-width brick row at the door. Those tiles are speckled terrazzo, and the door mat stays. The school hallway under the red runner is cream linoleum. Flat 5B's hall walls drop the repeated brick courses for cream plaster with one dado. The kitchen stays terracotta, the bedroom stays wood, and the game room stays navy carpet, so the three rooms stay distinct from each other and from the other houses. Merged `origin/main` at build 20261016-0922, which renamed the Heights looks to `rx_nia`, `rx_cal`, and `rx_ivo`. The next free id stays D142. D138–D141 and D148–D150 stay settled. Save `v` stays 2.
- Files touched: `sprites.js`, `data/mapdata.js` (regenerated), `README.md`, `tests/README.md`, `CHANGELOG.md`, `index.html`, `version.json`, plus the merge of `main` (`data/heights.json`, `tests/look_keys.spec.js`, `tests/heights.spec.js`, `BACKLOG.md`, `NEXT_PLAN.md`, `OPEN_DECISIONS.md`, `.cursor/skills/walklings-docs/SKILL.md`).
- Commit(s) + build id: build 20261016-0958.
- Tests run and result (widths, checks): `PP_PORT=8805 npm test` exit 0. 897 passed, 12 skipped, 0 failed (20.3m), at 320, 375, and 390. The suite fails a run that logs a console error, and this run did not. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green. Vincent rejected the busy brick floors and approved the rest of the schoolhouse and flats. No new D id. No id was renumbered.
- Anything left unfinished: Sister scenes, family dinners, school lessons, and the landlord and field-day quests stay out of this build. The coach cell (12, 9) is still the Keeper House roof from an earlier patch.
## 2026-10-16 11:14 ET: Lantern House planks merged with the heart alert (build 20261016-1114)

- What changed and why: Merged current `main` (PR #83, heart alert). Fernbrook rooms unchanged. `data/mapdata.js` regenerated. Save `v` stays 2. The next free id stays D151.
- Files touched: merge of `main`. Conflicts: `CHANGELOG.md`, `NEXT_PLAN.md` (both kept), `index.html`, `version.json` (restamped).
- Commit(s) + build id: build 20261016-1114.
- Tests run and result (widths, checks): `PP_PORT=8817 npm test`; `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Green. No id was renumbered.
- Anything left unfinished: Real prop copy can still replace the D103 lines.

## 2026-10-16 10:24 ET: Lantern House planks merged with current main (build 20261016-1024)

- What changed and why: Merged current `main` (build 20261016-0947), which keeps the dream pop-toy answering a bump from any side. The Fernbrook Lantern House floor stays the calm cream planks, rug, quilt runner, and thin hearth from build 20261016-0957. The Bloom Trial Hall is unchanged. `data/mapdata.js` was regenerated. Save `v` stays 2. The next free id stays D151.
- Files touched: merge of `main`. Conflicts: `data/mapdata.js` (regenerated), `index.html`, `version.json` (restamped). `sprites.js` and `game.js` merged cleanly.
- Commit(s) + build id: build 20261016-1024.
- Tests run and result (widths, checks): `PP_PORT=8820 npm test` exit 0. 906 passed, 12 skipped, 0 failed (20.5m), at 320, 375, and 390. No console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Green. No id was renumbered.
- Anything left unfinished: Real prop copy can still replace the D103 lines.

## 2026-10-16 09:57 ET: Fernbrook Lantern House floor is calm orchard planks (build 20261016-0957)

- What changed and why: Vincent rejected the Lantern House floor. The short dark courses read as a brick pile, the same look he turned down for Calloway and the Lodge. The floor is now wide cream planks, with the rug kept, a short quilt runner, and a two-tile brick hearth in front of the counter. Brick is only that thin lip. The Bloom Trial Hall is unchanged. The planks stay distinct from the Hearthmoor lantern checker and the Cobblecrest cobble floor. Merged `main` at build 20261016-0922. Save `v` stays 2. The next free id stays D151.
- Files touched: `sprites.js`, `data/fernbrook_rooms.json`, `data/mapdata.js`, `tests/maps_b8.spec.js`, `tests/README.md`, `CHANGELOG.md`, `NEXT_PLAN.md`, `index.html`, `version.json`, plus the merge of `main` (`data/heights.json`, `tests/look_keys.spec.js`, `tests/heights.spec.js`, `OPEN_DECISIONS.md`, `BACKLOG.md`, `.cursor/skills/walklings-docs/SKILL.md`).
- Commit(s) + build id: build 20261016-0957.
- Tests run and result (widths, checks): `PP_PORT=8819 npm test` exit 0. 900 passed, 12 skipped, 0 failed (20.2m), at 320, 375, and 390. No console errors. `python3 tools/bump_build.py --check` exit 0. `tests/maps_b8.spec.js` also passed 18 at `PP_PORT=8818`.
- Decisions made (colour + reasoning): Green. Vincent's review set the floor. No new D or Q id. D103 placeholders stay. No id was renumbered.
- Anything left unfinished: Real prop copy can still replace the D103 lines.

## 2026-10-16 08:59 ET: Fernbrook Lantern House and Bloom Trial Hall (build 20261016-0859)

- What changed and why: Vincent approved the two new Fernbrook rooms. The Lantern House is 12 by 16, with an orchard-wood floor, Keeper Amos at the heal counter, three quilt beds, a herb rack, apple crates and a table. The Bloom Trial Hall is 16 by 24. A hedge path zig-zags to the flower dais, where Master Fen stands. Each room has its own skin. Neither reuses the lantern, Calloway, Lodge, observatory or Keeper House floor. The outdoor doors keep their panel ids and also warp in. If the room map is missing, the panel still opens. Amos still rests the party and still offers the Pledge desk. Fen still starts the trial. A save inside either room loads. Save `v` stays 2. D103 is the placeholder prop lines. The next free id is D151.
- Files touched: `data/fernbrook_rooms.json`, `data/mapdata.js`, `sprites.js`, `game.js`, `save.js`, `tests/integrity_lib.js`, `tools/gen_mapdata.py`, `tests/maps_b8.spec.js`, `tests/maps_b7.spec.js`, `tests/standing.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-0859.
- Tests run and result (widths, checks): `PP_PORT=8817 npm test` exit 0. 894 passed, 12 skipped, 0 failed (20.3m), at 320, 375, and 390. No console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Green. D103 was already reserved for this batch. The new prop lines are placeholders. No id was renumbered. Houses were not enlarged. The lab stays four rooms.
- Anything left unfinished: Real prop copy can replace the D103 lines. The outdoor Fernbrook map is unchanged.

## 2026-10-16 10:11 ET: Heart alert merged with the dream pop-toy fix (build 20261016-1011)

- What changed and why: Merged current `main` (PR #81). In the 2004 memory, the pop-toy answers a bump from any side, Mom cooks, and Dad watches TV. The modern heart alert stays. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `index.html` and `version.json` (restamped).
- Commit(s) + build id: build 20261016-1011.
- Tests run and result (widths, checks): `PP_PORT=8794 npm test` exit 0. 912 passed, 12 skipped (20.4m), at 320, 375 and 390. `tests/heart_alert.spec.js` passed at all three widths. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): green. No id was renumbered.
- Anything left unfinished: Arcade still has no heart alert. D151–D153 belong to another branch.

## 2026-10-16 09:48 ET: The modern heart pulses when food or rest is low (build 20261016-0948)

- What changed and why: On modern controls, the square heart button pulses when the partner's food or rest is low. Food under 25 is an orange ring and a bowl badge. Food at or under 20 pulses faster. Rest under 25 is a blue ring and a z badge. Rest under 10, or a nap, pulses faster. Both low alternates the ring and shows both badges. One FEED or one REST clears that side. The 3 second REST sleep holds the ring still. A polite live region speaks once when a state starts, and stays quiet on load if it was already on. Reduced motion holds a steady ring. A hidden tab pauses the pulse. Arcade has no alert. Save `v` stays 2.
- Files touched: `game.js`, `style.css`, `sprites.js`, `index.html`, `tests/heart_alert.spec.js`, `screenshots/heart/`, `README.md`, `tests/README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `version.json`.
- Commit(s) + build id: build 20261016-0948.
- Tests run and result (widths, checks): `PP_PORT=8793 npm test` exit 0. 906 passed, 12 skipped (20.1m), at 320, 375 and 390. `tests/heart_alert.spec.js` passed at all three widths, with no console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D154, D155 and D156 were settled by Vincent on Oct 16, 2026. Building that spec is green. No id was renumbered. Save `v` stays 2. Arcade stays without the alert, as D154 says.
- Anything left unfinished: Arcade has no heart button, so it has no alert. D151–D153 belong to another branch.

## 2026-10-16 09:46 ET: Rook's Crossroads, the last crates (build 20261016-0946)

- What changed and why: After Cobblecrest, Rook waits on the east road. The side quest "The last crates" sends you to three quarry crates. He quits Glimmerwell on every path (`story.rook_quit`). `story.rook_end` is left as saved. Keepers free the crates and fight Associate Tobin. A Glimmerwell player can walk away with Rook (half the company score, then the Keepers) or stay and fight him. Hale or Juniper pays the wrap-up. Side switching is only through Rook. Fernbrook Pledge desks are gone. Save `v` stays 2. Merged current `main` (RegenX look keys, build 20261016-0922) and restamped.
- Files touched: `data/rook_crossroads.json`, `data/mapdata.js`, `tools/gen_mapdata.py`, `standing.js`, `quests.js`, `save.js`, `game.js`, `sprites.js`, `tests/integrity_lib.js`, `tests/standing.spec.js`, `tests/rook_crossroads.spec.js`, `tests/quest_multi.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `DESIGN_HANDOFF.md`, `DESIGNER_PROMPT.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-0946 (restamped after merging main's 20261016-0922).
- Tests run and result (widths, checks): `PP_PORT=8801 npm test` exit 0. 897 passed, 12 skipped, 0 failed (20.2m), at 320, 375, and 390, after merging main. No console errors in the new specs. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D127 red, Vincent: switching is only through this Rook quest. D128 Vincent: both ways, with the "I won't watch" warning. D129 Vincent: the chapter cooldown stays. D130 red, Vincent: he quits in Episode 1 on every path; `rook_quit` is additive. D131 Vincent: half-points, free only via debug. D132 green: `story.seal3` joins `chapterOf` when Brinewick writes it. Seal 3 is not built. D133 green: `switch_desk_glimmer` retired, pixels kept. D134 yellow, Vincent: `rival3_rook` is Rook battle 3 of 7; Keepers get no Rook battle here. D135 green: the listed rewards. D136 green: the lanyard comes off when `story.rook_quit` is set. D19 and D20 are closed by D127 and D133. No id was renumbered. The next free id stays D151.
- Anything left unfinished: Frostmere is not built. Ally vs parted stays D25. Brinewick and Seal 3 are not built. This branch is not on `main`.

## 2026-10-16 09:45 ET: RegenX looks no longer redraw Vesper, Clerk Nia and Cal; doc corrections (build 20261016-0922)

- What changed and why: PR #40 added RegenX looks keyed `nia`, `cal` and `ivo` in `data/heights.json`. Heights looks load last, so they replaced High Charity's `nia` (Clerk Nia) and `ivo` (Keeper Vesper) and Mahopac's `cal` (the kite kid). The Heights keys are now `rx_nia`, `rx_cal` and `rx_ivo`, with the RegenX NPCs and speakers pointed at them. New `tests/look_keys.spec.js` fails when two data files define the same look key. Docs: corrected the D73/D80 note, removed the duplicate open D71 row, marked Q26 built (D72 still open), the walklings-docs skill now points at the OPEN_DECISIONS header for the next id, and the next free id is D151.
- Files touched: `data/heights.json`, `data/mapdata.js` (regenerated), `tests/heights.spec.js`, `tests/look_keys.spec.js`, `tests/README.md`, `OPEN_DECISIONS.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `.cursor/skills/walklings-docs/SKILL.md`, `index.html`, `version.json`, `CHANGELOG.md`.
- Commit(s) + build id: build 20261016-0922.
- Tests run and result (widths, checks): `npm test` exit 0 (882 passed, 12 skipped) at 320, 375 and 390.
- Decisions made (colour + reasoning): green, bug fix from the after-the-fact audit of #37 and #39–#41, approved by Vincent. No D or Q id renumbered. `mahopac.json` not touched.
- Anything left unfinished: the speaker map still resolves the name "Cal" to one look for both Cals (name collision, audit items 7–8, not in scope).

## 2026-10-16 08:56 ET: Hearthmoor Schoolhouse and Amberhill Flats (build 20261016-0856)

- What changed and why: Vincent approved packet P3 v2 on Design's defaults. Hearthmoor stays 24 by 20. The schoolhouse and the flats sit on the empty south tiles. Each of the three rooms has its own skin. The lift panel lists floors 1 through 6, and only 5B is a real map. Both lift doors open after Lizzy's intro. Lizzy, Buddy, Ossabell, Morelou, Pip, Wren, and Mr. Gristle are in. Morolow has a look and is not on a map yet. The intro plays once after the starter, branches on Rook, and gives two Heal Snacks. Buddy is a Walkling beside Lizzy. He is never a phone contact and never a battle. Family lines use cooking, music, and Spanish. The game names no real place. Five south props move so the new walls can land. Save `v` stays 2. Lizzy stands one tile east in the hall, and Ossabell one tile east in the kitchen, so the only doorway into each room stays open. A door drawn on a wall is entered from the grass south of it. Two art names already existed (`floor_honey`, `bunk`), so those pictures stay as they were. The rooms still differ by their walls and the other floors.
- Files touched: `data/detail_lizzy.json`, `data/mapdata.js`, `game.js`, `sprites.js`, `keeper.js`, `quests.js`, `tests/lizzy.spec.js`, `tests/maps_b4.spec.js`, `tests/maps_b7.spec.js`, `tests/integrity_lib.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-0856.
- Tests run and result (widths, checks): `PP_PORT=8803 npm test` exit 0. 891 passed, 12 skipped, 0 failed (20.2m), at 320, 375, and 390. The suite fails a run that logs a console error, and this run did not. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): D111–D119 and D138–D141, Vincent, Oct 16 2026, Design's defaults. D111 red: two buildings, placement A, the map stays 24 by 20. D118: six floors on the panel, only 5B is real. D119: flower clip, Hearthmoor Schoolhouse, Amberhill Flats, Mr. Gristle. D138 green: kids use full-size looks. D139 green: the flower clip is NPC-only. D140 yellow: one overlay plus the engine notes. D141 green: five props move, nothing else. D142–D147 are unused. The next free id is D142. No id was renumbered.
- Anything left unfinished: Sister scenes, family dinners, school lessons, and the landlord and field-day quests stay out of this build. The coach cell (12, 9) is the Keeper House roof from an earlier patch, so the approach is the path beside it.

## 2026-10-16 ET: Keeper House merged with current main (build 20261016-0304)

- What changed and why: Merged current `main`, which now holds PR #74 (lantern, Calloway, Lodge and observatory rooms) and PR #75 (the `maps_b6` lab-floor check fix). `data/mapdata.js` was regenerated. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `CHANGELOG.md` (both sides kept), `data/mapdata.js` (regenerated), `index.html`, `version.json` (restamped).
- Commit(s) + build id: build 20261016-0304.
- Tests run and result (widths, checks): recorded in the pull request.
- Decisions made (colour + reasoning): green. No id was renumbered.

## 2026-10-16 02:16 ET: Keeper House is a two-floor command centre (build 20261016-0216)

- What changed and why: Vincent approved the bigger Keeper House. The ground floor is 14 by 16 and the upstairs is 12 by 14. It is still two floors. Both floors share ashlar walls, a navy and gold wainscot, a slate lozenge, and a vertical Keeper runner. The archive, front desk, and quarters use square tiles. The radio room and the evidence corner use an ops mat. The briefing room and the captain's office use sage carpet. Lamps and radio racks hold a still glow. Existing ids, warps, NPC lines, and flags stay. Arrival tiles move with the new grids. Constable Corwin, Cadet Orrin, Signaller Tamm, and Scout Linnea stand at their stations. The upstairs prop table lists 28 props, and every listed row is placed. Save `v` stays 2. D149 was free and is settled. D150 was already settled for the observatory floor. Key K is appended once and completes that call. A–J and P are not redefined.
- Files touched: `data/civic.json`, `data/detail_b5.json`, `data/mapdata.js`, `sprites.js`, `game.js`, `tests/keeper_hq.spec.js`, `tests/maps_b5.spec.js`, `tests/maps_b4.spec.js`, `tests/civic.spec.js`, `tests/house_reskin.spec.js`, `tests/obs_fix.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `handoff/maps/BUILDING_VARIETY.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-0216.
- Tests run and result (widths, checks): `PP_PORT=8823 npm test` exit 1. 852 passed, 12 skipped, 3 failed (18.8m), at 320, 375, and 390. The 3 failures are the pre-existing `tests/maps_b6.spec.js:289` check: it expects `lab_floor` at `rx_f1` (9, 8) and reads `lab_inlay_mint`. That check already fails on main. `tests/keeper_hq.spec.js` passed at all three widths, with no console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Red, Vincent approved. D149: 14 by 16 and 12 by 14, two floors, ids stay, save `v` stays 2. D150: key K `#7a8aa0` appended once. That id was already settled for P on the rooms change. K completes the same call. D88 still caps one floor tile at 70 percent. Both Keeper floors stay under 55 percent.
- Anything left unfinished: The upstairs header says 33 props and the table lists 28. The table is what was placed. This branch stacks on the rooms PR and is not on `main`. The `maps_b6` lab-floor check is left as it is on main.

## 2026-10-16 ET: Lantern and house rooms merged with current main (build 20261016-0243)

- What changed and why: Merged current `main` (PR #75, which fixes the `tests/maps_b6.spec.js:289` lab-floor check). `data/mapdata.js` was regenerated. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `CHANGELOG.md` (both sides kept), `index.html`, `version.json` (restamped).
- Commit(s) + build id: build 20261016-0243.
- Tests run and result (widths, checks): recorded in the pull request.
- Decisions made (colour + reasoning): green. No id was renumbered.

## 2026-10-16 01:30 ET: Breckenridge Observatory points at the telescope (build 20261016-0130)

- What changed and why: Vincent approved the observatory packet. The Mom's-trip marker inside Breckenridge Observatory now sits on the telescope. The three dream steps keep a way back to that lens, so leaving a dream early still shows a marker. The room is dusk-violet floorboards with a brass compass inlay, under a night-navy dome on a walnut wainscot. Palette key P is appended once. The Keeper HQ is not built, and key K is not added. The outdoor observatory wall keeps its own tile. The quest card text is unchanged. Save `v` stays 2. D148 and D150 were free and are settled. No id was renumbered.
- Files touched: `quests.js`, `game.js`, `sprites.js`, `tests/obs_fix.spec.js`, `tests/maps_b7.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `archive/DECISIONS_SETTLED.md`, `BACKLOG.md`, `NEXT_PLAN.md`, `handoff/maps/BUILDING_VARIETY.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-0130.
- Tests run and result (widths, checks): `PP_PORT=8811 npm test` exit 1. 846 passed, 12 skipped, 3 failed (18.6m), at 320, 375, and 390. The 3 failures are the pre-existing `tests/maps_b6.spec.js:289` check: it expects `lab_floor` at `rx_f1` (9, 8) and reads `lab_inlay_mint`. That check already fails on main. `tests/obs_fix.spec.js` passed at all three widths, with no console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Yellow, Vincent approved. D148: the observatory step targets the telescope, and the three dream steps carry `via`. D150: append P `#9686a8` only. The Keeper HQ and key K stay out of this build. D88 still caps one floor tile at 70 percent.
- Anything left unfinished: The Keeper HQ is not built. The private design copy was not in this workspace. The handoff copy of BUILDING_VARIETY row 25 has the new interior wording. The `maps_b6` lab-floor check is left as it is on main.

## 2026-10-16 00:50 ET: Rook's House and the Warden's Lodge get their own rooms (build 20261016-0050)

- What changed and why: Vincent approved the Calloway and Warden's Lodge reskins on top of the lantern palette. Keys A–G stay as they are. Three shared keys were appended once: dusty rose, warm grey flagstone, and deep Keeper green. Rook's House (`hm_rook_in`) now has honey planks and rose sprig wallpaper over a honey wainscot. The Warden's Lodge (`hm_lodge_in`) now has warm flagstone, timber-board walls, a Keeper-green wainscot, and a green runner with gold edges. The Keeper House rooms stay stone flags and ink planks. The old brick and log tiles stay defined, so the exteriors are unchanged. Save `v` stays 2. No id was renumbered.
- Files touched: `sprites.js`, `tests/house_reskin.spec.js`, `tests/README.md`, `README.md`, `handoff/maps/BUILDING_VARIETY.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-0050.
- Tests run and result (widths, checks): `PP_PORT=8807 npm test` exit 1. 840 passed, 12 skipped, 3 failed (18.8m), at 320, 375, and 390. The 3 failures are the pre-existing `tests/maps_b6.spec.js:289` check: it expects `lab_floor` at `rx_f1` (9, 8) and reads `lab_inlay_mint`. That check already fails on main. `tests/house_reskin.spec.js` and `tests/lantern_palette.spec.js` passed at all three widths, with no console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Green. Vincent approved both packets. The packets set the colours and the two skins. No new decision id. D88 still caps one floor tile at 70 percent.
- Anything left unfinished: The private design copies were not in this workspace. The handoff copy in this repo has the new interior wording for rows 2 and 4. The `maps_b6` lab-floor check is left as it is on main.

## 2026-10-16 00:22 ET: Lantern rooms use a warm floor (build 20261016-0022)

- What changed and why: The Hearthmoor and High Charity Lantern Houses were too bright. Seven palette keys were appended (sand, terracotta, cream, sage, dark sage, warm shadow, warm trim). Hearthmoor now has a sand checker floor, cream walls, and a dark sage wainscot. High Charity keeps the clinic grid, now on sand tiles with sage grout and sage walls. The window glow stays the bright accent. Cobblecrest's lantern room is unchanged. The old white floor and wall tiles stay defined, so the Hearthmoor lantern exterior is unchanged. Save `v` stays 2. No id was renumbered.
- Files touched: `sprites.js`, `tests/lantern_palette.spec.js`, `tests/README.md`, `README.md`, `handoff/maps/BUILDING_VARIETY.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: build 20261016-0022.
- Tests run and result (widths, checks): `PP_PORT=8804 npm test` exit 1. 837 passed, 12 skipped, 3 failed (18.8m), at 320, 375, and 390. The 3 failures are the pre-existing `tests/maps_b6.spec.js:289` check: it expects `lab_floor` at `rx_f1` (9, 8) and reads `lab_inlay_mint`. That check already fails on main. `tests/lantern_palette.spec.js` passed at all three widths, with no console errors. `python3 tools/bump_build.py --check` exit 0.
- Decisions made (colour + reasoning): Green. The packet set the colours and the two skins. No new decision id. D88 still caps one floor tile at 70 percent, and all three lantern rooms stay under that cap.
- Anything left unfinished: The private design copy of BUILDING_VARIETY was not in this workspace. The handoff copy in this repo has the new floor wording for rows 3 and 23. The `maps_b6` lab-floor check is left as it is on main.

## 2026-10-16 01:23 ET: Tunnel rooms merged with current main again (build 20261016-0123)

- What changed and why: Merged current `main` (the iOS reload fix, PR #75). `game.js` took main's skin drawing; `sprites.js` keeps the house skins and the tunnel skin. `data/mapdata.js` was regenerated. Leftover conflict markers committed earlier in `CHANGELOG.md` and `OPEN_DECISIONS.md` were removed, keeping both sides. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `CHANGELOG.md`, `index.html`, `version.json` (restamped).
- Commit(s) + build id: build 20261016-0123.
- Tests run and result (widths, checks): recorded in the pull request after this stamp.
- Decisions made (colour + reasoning): green. No id was renumbered.
## 2026-10-15 20:47 ET: Tunnel rooms brought up to current main (build 20261015-2047)

- What changed and why: Merged current `main`. The four smuggler rooms still share one rock skin. Outdoor maps with no skin keep outdoor grass variants; they do not go through the lab glass remap. The lab bay still uses the lab skin. The overlay loader is the one already on `main`. `data/mapdata.js` was regenerated. Save `v` stays 2.
- Files touched: merge of `main`. Conflicts: `game.js` (outdoor path kept, tunnel skin kept), `data/mapdata.js` (regenerated), `OPEN_DECISIONS.md` (D96 kept beside main's later rows), `index.html` and `version.json` (restamped).
- Commit(s) + build id: build 20261015-2047.
- Tests run and result (widths, checks): recorded in the pull request after this stamp.
- Decisions made (colour + reasoning): D96 stays the tunnel-prop placeholder. No id was renumbered. The four rooms were left on the shared rock skin.
## 2026-10-16 00:21 ET: iPhone no longer reloads an open game (build 20261016-0021)

- What changed and why: Safari on iPhone was reloading the game every few minutes during play. A new service worker called `skipWaiting` and `clients.claim`, and iOS reloads a page when that worker takes the tab (a Pages deploy, or Safari installing the worker again). The one-shot boot reload only remembered itself in `sessionStorage`, which iOS drops across `location.replace`, so a bad boot could fire again. Page fetches also used a manual redirect, which Safari rejects and retries. Music left every finished WebAudio node connected, and Safari does not collect those, so the tab grew until iOS killed it. The worker now waits until the next visit. The boot retry also stops when the address already has `?b=boot.`. A changed `version.json` still only shows the notice. Finished notes disconnect. Save `v` stays 2.
- Files touched: `sw.js`, `game.js`, `sfx.js`, `tests/ios_reload.spec.js`, `tests/maps_b6.spec.js`, `tests/README.md`, `README.md`, `BACKLOG.md`, `CHANGELOG.md`, `index.html`, `version.json`.
- Commit(s) + build id: 4c422c5, build 20261016-0021.
- Tests run and result (widths, checks): `PP_PORT=8803 npm test` exited 0. 849 passed, 12 skipped, 19.5 minutes, widths 320, 375 and 390. An earlier run on this branch exited 1 (846 passed, 3 failed): `tests/maps_b6.spec.js` still read `rx_f1` (9, 8), a mint inlay since B2. That check now reads (8, 9), the same plain floor the B5 spec uses.
- Decisions made (colour + reasoning): green. A bug fix. The notice still waits for a tap. No new player-facing words. No id was renumbered.
- Anything left unfinished: a real iPhone is the only place that can show the Safari controller reload and the memory kill. Desktop Chromium covers the guards.

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

## 2026-10-15 09:21 ET: tunnel rooms wear rock (D87), branch `cursor/maps-b3-tunnels-7807`

- What changed and why: The four smuggler rooms (`sm_yard`, `sm_tunnel`, `sm_hold`, `sm_den`) keep their 18×12 grids and stop painting house planks. `TUNNEL_SKIN` uses the same remap, walk, decal, and seeded-variant path as `LAB_SKIN`. `#` is rock, `W` is the rock face, `.` is stone with gravel and damp variants. The yard has a sky patch and a cart, the tunnel has timber braces and drips, the hold has crate rows, and the den has a rug, desk, ledger, and lamp. Paths from each arrival to each exit and to every person stay open. Save `v` stays 2.
- Files touched: `sprites.js`, `game.js`, `data/heights.json`, `data/mapdata.js`, `index.html`, `version.json`, `tests/maps_b3.spec.js`, `tests/README.md`, `README.md`, `OPEN_DECISIONS.md`, `CHANGELOG.md`.
- Commit(s) + build id: this commit, build `20261015-0921`.
- Tests run and result: `PP_PORT=8103 npm test` at 320, 375, and 390. 522 passed, 6 skipped, 0 failed. No console errors.
- Decisions made: D87 built (rock skin, same grids). D96 green: short placeholder lines on the new props until Design writes them. Wall tiles use the same seeded mix as the floor so a rock row is not one repeating stamp. The lab tables and the lab draw results are unchanged.
- Anything left unfinished: the tunnel-mouth exterior on Fernbrook Heights is still the old door (row 27 of the variety list is an exterior; this batch is the four rooms). Prop lines are placeholders (D96).
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
