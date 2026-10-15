# Changelog

Newest first. The build stamp is `version.json` and the `?v=` on each script in `index.html`. Status of open work is `BACKLOG.md`. The queue is `NEXT_PLAN.md` §3. Agent skills are in `.cursor/skills/README.md`.


## 2026-10-15 — D18 Standing cap settled; D73 story writer (docs only, no new build stamp)

- D18 (Standing daily cap) settled green: cap left unbuilt and folded into the Standing pass, placeholder 5 per side per day. Row moved to `archive/DECISIONS_SETTLED.md`.
- D73 story writer (yellow, Waiting on Vincent): recommend no new writer for now; Design keeps the story, supported by a story bible skill and a QA lore check on story PRs. Revisit if D62–D65 scoping slips.
- Next free decision id is D74. D62–D68 remain reserved by open PRs #43 and Q26; D70+ for #39/#40/#41 D60 renumbers. No game code change.

## 2026-10-15 01:05 ET — Debug-mode leak fix (red, approved by Vincent; build 20261015-0101)

- The console no longer prints the debug password when a hook runs without debug, and README no longer names it.
- `pixelpets.debug` now lives in sessionStorage: debug lasts one tab session (`?debug=1` or the Settings password). Boot removes the old localStorage key, so a normal player never keeps debug.
- A save written in a debug session gains the additive field `debugSave: true` (validated in `save.js`, default false), and Settings shows `DEBUG SAVE` on the build line. Save `v` stays 2. A separate save key was considered and not used: 18 existing suites seed `pixelpets.save.v2` under `?debug=1` and read it back (D69; D62–D68 are taken by PR #43 and Q26).
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
