# Changelog

Newest first. The build stamp is `version.json` and the `?v=` on each script in `index.html`. Status of open work is `BACKLOG.md`. The queue is `NEXT_PLAN.md` §3. Agent skills are in `.cursor/skills/README.md`.

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
- Q23, Q24, and Q25 are in the game: rename, the music volume slider, and the welcome-back line. Q20–Q22 stay look and listen, the Lantern Council, and the unbuilt Capital Partnership Briefing. TB-1 is in the game on this branch. TB-3 is not started. Brinewick still waits on a one-pager.
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

## 2026-10-14 08:06 ET — Region map claims and a key (`20261014-0806`)

- The region map shows who holds each place you have visited: green and gold for the Keepers, cyan and mint for Glimmerwell, a split disc where both keep a claim, and bare parchment for wild country. Places you have not reached stay `???`.
- A key under the parchment names towns, routes, side places, you, the next step, the side task, the lantern coach, both factions, wild country, and Seals.
- Tap a place to read it. The card names the room when you are indoors. Arrows move that reading and do not walk you. CLOSE, Escape, or the dark margin puts the map away.
- High Charity is the lantern coach, drawn as a green dashed line, and it no longer sits on Mahopac. Its roofs wear Keeper gold and green. A wax stamp marks Fernbrook and Cobblecrest once that Seal is earned. After the pledge, the map names your side.

## 2026-10-13 23:47 ET — East gate and the Hearthmoor watch (`20261013-2347`)

- The tree on the grass south of Hearthmoor's east path is cut. The town sign stands one tile south of that grass, so the walk out to Route 1 is open.
- Officer Bren's patrol reaches the east end of the road. Officer Cald stands just north of the gate. Officer Ness still keeps the Keeper House door.

## 2026-10-13 22:55 ET — Keeper House and Keeper1 (`20261013-2255`)

- Hearthmoor roofs wear gold and green. Glimmerwell ground (the glen, and Cobblecrest after the quarry buyout) wears mint. Officer Bren patrols the Hearthmoor road. Fernbrook, Route 2, the glen, and Cobblecrest each have a watch officer. Clerk Mint appears in Cobblecrest after that buyout.
- The Keeper House, south of the road, has two floors. Sergeant Bram, Archivist Mo, and Clerk Wynn are downstairs. Captain Lumen and Operator Rue are upstairs. Citizens are asked to step back. Keepers are welcomed, more warmly as Standing rises. A Glimmerwell pledge is kept in the doorway.
- The first side quest is on Route 1. Two officers stop you and issue a Keeper1. The wires, the poles, and the companies stay with the Keepers. A blue chevron marks that quest. The main quest chevron stays yellow.
- BOOK is now PHONE. QUEST moved to the bottom bar. The phone has Contacts, Notes, Journal, Friends, and KeeperUAV. Notes say the Lantern desk can read them. KeeperUAV's job board is a placeholder.
- Joining Glimmerwell puts a Cracked Handset in the bag. While you carry it on that pledge, the phone becomes the thin CRACK//HAND and KeeperUAV becomes Botnet, also a placeholder.
- Higher Glimmerwell Standing tints your keeper with mint, then silver. Archivist Mo's books fear a child born already listening. That generation is not in the game.

## 2026-10-13 23:18 ET — Ribbit (`20261013-2318`)

- The phone has Ribbit, a read-only feed. Block News and Chirp Worldwide post about the towns. Local notes and the trending row change with the day, the place you are standing, and the story so far. You cannot post.

## 2026-10-13 21:28 ET — Save a copy before Start over (`20261013-2128`)

- Settings has Save a copy and Read a copy. The Start over dialog offers SAVE A COPY before the hold.
- The file is `walklings-save.json`, the same v2 save the game stores. Reading it replaces the game on this device and reloads. `v` stays 2.
- A file from a newer build, or a file that is not a save, is refused. The current game stays.
- With no Walklings yet, the gear stays tappable under the opening scene, so a wipe can be undone without finishing the intro.
- Device prefs (mute, location, debug) stay on this browser. They are not in the file.

## Tests for the last three commits

Smoke now checks Standing and Heights as well as the quest, glimmer, and befriend lists. It also checks that the Act 1 glimmer scenes swap back to the Keepers scenes, and that Cancel after a short hold does not wipe. Route 2 covers both gate choices, the grey Pebblit line, and that only the quiet Census log gives Rook a bond point. Cobblecrest covers the buyout, the snack that stays in the bag, the review battle, and both Rook closers (a high bond still leaves him with Glimmerwell). The save-copy spec round-trips the file and refuses a newer save, a v1 file, a non-save, and an oversized file. The box screen and the installable app are in the game (`20261014-0751`). Brinewick still needs a one-pager.

## 2026-10-13 19:50 ET — Route 2 glimmer, Cobblecrest Sacrifice stub, Rook R5 (`20261013-1950`)

- Glimmerwell Route 2: Census volunteer (`lead_intro@glimmer`). The quiet log gives Rook one bond point. Wickerglen still bumps the lamps, pays 3 Befriend Treats, and opens the same gates.
- Glimmerwell Cobblecrest: arrival still reads together or race. The buyout puts you beside Dorian. Hale loses the seam. Rook objects to "units", then you battle him.
- Hall slot 2 is a Sacrifice stub. Offer a snack (it stays in the bag), say three names for the free quota, or face Hale. Closing it grants the Bright Tier 2 Lanyard (placeholder art), 2 Hearty Snacks, 1 Wake Tonic, and `story.seal2`. The real cost is still open.
- Rook's closer: on the Keepers path he gets off the cart (`story.rook_end` "ally"). On the Glimmerwell path he stays ("stays"). Both paths set `story.cobble_end` and show the same Brinewick coming-later card. Bond does not gate it.
- Planning docs (`NEXT_PLAN`, `BACKLOG`, `OPEN_DECISIONS`, `README`, the designer handoff) now record Builds 4–6 as shipped and name the next three coding builds: export before Start over, the box screen, and an installable app. Brinewick still needs a one-pager.

## 2026-10-13 18:39 ET — Fernbrook Heights (`20261013-1839`)

- North of Fernbrook, before the first trial. After the side pick, Fen (Keepers) or Juniper and Tobin (Glimmerwell) offer "get to know us" and tell you to stock up.
- Keepers: a smuggling yard, tunnel, crate hold, and broker's den. Jed the clerk helps. After the haulers step aside, Officer Ken of the Fernbrook watch interviews each Walkling with you. They hop toward the orchard. Mara Quill keeps the route page. Nobody is hurt.
- Glimmerwell: the RegenX lab, four floors. Atten really does help a Walkling focus. The staff are decent people. The Arbiter is ancient Glimmerwell technology. It emits something slowly. Nobody can name the emission, or why the machine was built. Nia Voss and Cal Dunn are inside the lab and on Glimmerwell's side. Associate Quinn waits in the bay.
- Standing: the offer, each cleared floor or room, Ken's interview, and the finale add points only to that path's faction, once each.
- `story.heights_done` gates the Trial Hall panel and the Tour's first stop. A save that already has `story.seal1`, or that never picked a side, is not sent back.
- Group battles: two foes at once, you move first, TARGET chooses, and on the last fight an ally Walkling hits the weakest foe. Foes still hit you. Levels sit under Fen's trial: the door is about Lv 4-5, the last fight is Lv 6, so a partner around Lv 7 can clear it with the two Heal Snacks Kit hands over.
- The company name in the game is RegenX. Vincent also wrote PharmaX in the same note; that spelling is not used.
