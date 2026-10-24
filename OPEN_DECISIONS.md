# Open decisions

Things that were built on a best guess, deviate from a plan, or need a person (Vincent or the designer) to confirm. Each row says what the code does today, so a decision can be made without reading the diff. When one is settled, move it to archive/DECISIONS_SETTLED.md with the date and the call, and update the code or plan if it changed.

Settled calls are in archive/DECISIONS_SETTLED.md.

D37 is used twice. Do not renumber either row. Q28 owns D92–D103.

D104 stays reserved for Lizzy. D363-D379 and D390-D415 are reserved: WORLD_CLOCK_TOWN (D399-D411 are its section 11 and D412-D415 its section 12). D416-D434 are reserved: STORES_AND_TOWN_LIFE (recorded in the archive, settled Oct 22, 2026). D435-D444 are reserved: POLISH_BUILD2 (recorded in the archive, settled Oct 22, 2026, design eb50602). D445-D460 are reserved: DESKTOP_FRAME. D461-D469 are reserved: QUEST_CUE_REDESIGN. D470-D481 are reserved: STARTER_MOMENT. D482-D495 are reserved: SHOP_LAYOUT. D496-D507 are reserved: PHONE_SHELL. D508-D521 are reserved: PLAYTEST_FIXES_3. D522-D533 are reserved: MOVES_V2. D534-D547 are reserved: PARTNER_CARE. D548-D559 are reserved: ART_PASS. D560-D563 are reserved: ART_PASS v0.2. D564-D569 are reserved: MOVES_V2 v0.2. D570-D575 are reserved: MOTION_POLISH. D576 TOWN_CHATTER (red) — Vincent: yes, spec now (Oct 23, 2026, 10:18 AM ET, via the Supervisor); design 656d101. D577 is reserved: Market Row slow-lane call (tooling PR bc-26099578). D578 is settled: QA-1 follower second tap closes the care tray (green, ART_PASS PR). D579-D583 are reserved: TOWN_CHATTER v0.1. D584-D598 are reserved: TUTORIALS_CARE_MOVES (approved by Vincent, Oct 23, 2026, 1:56 PM ET; all settled). D599-D604 are reserved: POLISH_3 v0.1. D605-D611 are reserved: ROOM_UNIQUE v0.2. D612-D619 are reserved: TOWN_LANDMARKS v0.1. D620-D625 are reserved: WEATHER_SIGHTINGS v0.1. D397, D398, D399 and D412 are settled. D678-D682 and D705-D709 are reserved: TUTORIAL_ORDER v0.1 (approved by Vincent, Oct 24, 2026, 12:12 AM ET; all settled).

HUSHWATER B1 merged in #125 and HUSHWATER B2 merged in #126. Both are on main.

Next free id is D730.
Other packets hold ids through D729.

## Open

| # | Area | Decision needed | What the build does today | Where to change it |
|---|---|---|---|---|
| D32 | Heights names | RegenX, Atten, The Arbiter. Vincent also wrote PharmaX in the same note | Player text uses RegenX only. The Arbiter emits slowly; the emission is not named. One rename in `data/heights.json` `_names` plus the scenes. This was D27 on the keeper-hq branch | `data/heights.json` |
| D72 | Q26 landscape | The sketch is landscape and says the game should be full screen when opened, with a vertical option in Settings. Build a landscape layout, and lock orientation in the manifest? | Not built. The app is a portrait column at most 480 px wide, and `manifest.json` is `display: standalone` with no orientation. Modern in Q26 is portrait: the map fills the portrait screen. A landscape layout, its Settings row, and an orientation lock are this row | NEXT_PLAN §3 Q26 "Landscape". When built: `manifest.json`, `#app` in `style.css`, `fitAll` in `game.js` |
| D161 | End-game side switch | What, besides Rook's quest, lets a player change sides at the end of the game? | Not built. Until that plan lands, Rook's quest is the only switch (D127, D128). Pledge desks stay removed. No desk, no extra Lantern option, no Juniper desk. | Later, when the end-game plan exists. Do not restore pledgeDesk in the meantime. |
## Not started, blocked on people

- BS daily earning: Vincent said yes, slowly. Cap settled as D18 (placeholder 5 per side per day); left unbuilt and folded into the Standing pass. Tier-gated shop rows, lines, and tier icons still need the designer's list of what each tier opens.
- Hall slot 2 (D24) is Arbiter Testing on this branch. Quota and Face the review still grant the seal with no chip. Do not add a second Tour.
- R5 later appearances: the cart scenes are in the game, and so is R6 (The last crates). D25 is settled: Keepers ally, Glimmer stays unless he accepts the crate offer. Frostmere, the Keepers-path raid, is not built. Glimmer Act 2 is still TBD.
- Brinewick, Trial Hall #3, Seal 3: no map and no one-pager.
- The box screen and the installable app are built. Rename (Q23), the music volume slider (Q24), and the welcome-back line (Q25) are built. Brinewick still waits on a one-pager.
- Town boards (Q19) are on hold (Vincent). Detail stays in `TOWN_BOARD.md`. TB-1 and the Hearthmoor and Fernbrook squares are in the game on main. TB-3, Cald's gate count, is on this branch. The other slips are not started. Mahopac has a board and no slips. The region-map D37 was settled keep as built by team vote (Oct 23, 2026). D56 and D57 are the open lines on the welcome and on clearing a nickname. They do not block the boards.
- The Capital Partnership Briefing (Q22) is The Signal Review, built on this branch. It does not add a second Standing grant on `r5_g`. Brinewick, Hall #3, and Seal 3 stay closed.
- Modern and arcade controls (Q26) are built (PR #48). The prompt and the modern tips (D70) and the joystick default (D71) are settled. Landscape (D72) is still open and not built.
- More Walkling adornments unlock during quests (D75). That list is not built. The five current ones stay free. Stitch & Lantern sells six more through wardrobe flags. Those are not the quest list.
- End-game side switching (D161): not planned yet and not built. Rook's quest stays the only switch. Pledge desks stay removed.
- D326–D333 settled Oct 20, 2026 (Vincent, 12:55 PM ET, on defaults, "Turn on for everyone"). Co-op is on for everyone. The server switch `/config/coop/on` is the kill switch. The build uses `COOP_VOTE`. D334–D337 are settled green (Design) and archived. D339–D341 are settled (Vincent, 8:40 AM ET, Oct 20, 2026, on defaults, design bfe356a) and archived. D342 is green (Vincent's ask, 8:10 AM ET) and already shipped with Lizzy. D343 and D344 were settled by Vincent at 9:49 PM ET on Oct 20, 2026, early, on the defaults. D345 is green (Design). The hint lines and the doorstep reveal are in this build. Lizzy's lines are not edited here. D346–D362 stay reserved for HUSHWATER (design tip 9835ccb). B0 is built on this branch. D347 was settled by Vincent at 11:34 AM ET Oct 20, 2026, on the defaults. D357 is green. B1 and E1–E4 merged in #125. B2 merged in #126. D346 is the Lizzy placeholder, settled and not built. D348–D353 were settled by Vincent at 9:49 PM ET Oct 20, 2026, on the defaults, and are archived. D354–D362 stay green. D380–D389 (PLAYTEST_FIX_1020, design 0b0c3dc) are settled. D363-D379 and D390-D398 are reserved: WORLD_CLOCK_TOWN (design). D397 and D398 are settled green. See the header above. P1 world clock v1 is on this branch. P2 Market Row is on this branch. P3 wardrobe v1 is on this branch. P4 stores are on this branch.
## Settled

Settled calls are in archive/DECISIONS_SETTLED.md.

TUTORIAL_ORDER D678-D682 and D705-D709 are recorded in the archive (Oct 24, 2026, design 2b6aef6). D678, D705 and D708 are red, settled YES by Vincent (12:12 AM ET, via the Supervisor). The yellows D679, D680, D706 and D707 were settled YES at the default by team vote (PixelPets and QA, 12:14 AM ET). The greens D681, D682 and D709 were settled by the Supervisor. D683 and D684 stay unused.

CARE_SHORTCUTS D710-D717 are recorded in the archive (Oct 24, 2026, design 2a10464). D710, D711 and D714 are red, settled YES by Vincent (12:30 AM ET, via the Supervisor). The yellows D713, D715 and D717 were settled by team vote (PixelPets and QA). The greens D712 and D716 were settled by the Supervisor. Settling D713 does not close the open box NRG call. No bed-rate row was in the game, so no bed wording changed. Box NRG code is unchanged.

TOWN_LANDMARKS D612-D619 are recorded in the archive (Oct 23, 2026, design 520ee8a). D617 is red, settled YES by Vincent (3:16 PM ET): Della, Garnet and Ines join the cast as the Lantern House guides. The yellows D612, D613, D615 and D616 are settled on the default by Vincent (3:16 PM ET). The greens D614, D618 and D619 were settled as written by the Supervisor.

TUTORIALS_CARE_MOVES D584-D598 are recorded in the archive (Oct 23, 2026, design 6a6fc26). D584 and D592 are red, settled YES by Vincent (1:56 PM ET). The yellows D585, D586, D589 and D593-D595 are settled YES by Vincent on the default, after a unanimous team vote. The greens D587, D588, D590, D591 and D596-D598 were settled on the default by the Supervisor.

TOWN_CHATTER D579-D583 are recorded in the archive. D580-D582 (green) were settled on the default by the Supervisor (Oct 23, 2026). D579 and D583 (yellow) were settled on the default by Vincent (Oct 23, 2026, 3:16 PM ET).

Old-decision triage yellows D1, D33, D35, D36, D37 (the region-map row), D58 and D61 are recorded in the archive (yellow, settled keep as built by team vote, recorded by the Supervisor, Oct 23, 2026). D32, D72 and D161 stay open.

MOVES_V2 D522-D533 and D564-D569 are recorded in the archive (Oct 23, 2026, design 0422a16). D522-D525 are red, settled YES by Vincent; D526-D529 settled YES; D530-D533 green, settled by the Supervisor on the default; D564-D569 settled by Vincent on the default.

D577 Market Row frame-budget test (red): Vincent, Oct 23, 2026, 10:23 AM ET: move it to an opt-in slow lane, out of the main run; 0.3 ms budget unchanged.

STORES_AND_TOWN_LIFE D416-D434 are recorded in the archive (Oct 22, 2026). D416, D425 and D431 are green (Supervisor, about 2:00 AM ET). D418, D422 and D430 are red, settled by Vincent (2:01 AM ET): whereabouts gated by Standing; cosmetics from a battle win on the first win only; keep the name Lamplight Provisions with a GENERAL STORE sub-sign. The yellows settled on their defaults (Vincent, Design and PixelPets, 2:03 AM ET). D434 is dropped. D406 stays green: the Modern camera clears the HUD. P0, the edge-arrow rail, the chip and the tile count, is on this branch. P1-P6 are not started.

POLISH_BUILD2 D435-D444 are recorded in the archive (Oct 22, 2026, design eb50602). D439 is red, approved by Vincent (11:36 AM ET), and supersedes D106's always-tracked rule. D436 and D438 were revised and settled by Vincent. D435, D437 and D443 settled on their defaults (Vincent and a unanimous vote). D440, D441, D442 and D444 are green. D12 is settled by D441. D13 is settled by D443. D22's stuck-line half is settled by D440; the comma in place lines was already shipped. The work is on this branch, not on main. Corrected Oct 22, 2026: POLISH_BUILD2 merged in #148 (a3b74d4, build 20261022-1413) and is on main.
