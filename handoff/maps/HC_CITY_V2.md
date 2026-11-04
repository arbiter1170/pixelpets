# HC_CITY_V2: High Charity phase 1, "the capital, day one" (build notes)

Build of design `specs/HIGH_CHARITY_LAYOUT.md` **v0.2.1, phase 1 sections only** (design master 7a73461; the layout file is
unchanged since 131287e apart from the id table). D1268 (five chunks, phase 1 first) is settled red-yes; the open yellows are
built at their defaults behind their constants (§14.4). **Nothing reaches normal play:** `HC_CITY_V2 = false` in `game.js`;
the city is a preview on `?debug=1&hccity=2` only, and the preview never writes the save. The PR stays DRAFT until Vincent's
yes on the 390 previews (layout §0 preview gate, §13 test 10; AGENTS rules 3 and 9).

## How it is built

- **Source:** `tools/build_hc_city.py` reads the design layout JSON from the gitignored `design/` checkout
  (`--layout` to point elsewhere) and `data/highcharity.json` / `data/detail_b4.json` (kept roof looks), and writes
  `data/hc_city_v2.json`. `tools/gen_mapdata.py` wraps it as `data/hc_city_v2.js` (`window.PP_HC_V2`), **outside MAPDATA**, so
  `save.js` MAPS and normal players never see it. `index.html` and `sw.js` load the file; nothing reads it without the flag.
- **Merge:** `applyHcCity()` runs at the end of the `WORLD` build, after every overlay and object patch. Kept objects (50 ids:
  doors, signs, people, the board, the market, the coach warp and gate) are carried from the merged WORLD by id, so their lines,
  shops and patches survive; only map, tile and a few door fields change. 13 kept rooms keep their grids; their mats return to
  the moved doors (`matMoves`). Retired: `hc_apt_c` (locked, no room). The old outdoor dressing (puddles, litter) is dropped.
- **Checks in the tool** (it exits non-zero on any failure): chunk sizes, mouths paired, doors under a facade on a walk step,
  every door and mouth reachable from each arrival with every prop and body in place, **no one-wide choke** (Tarjan over the
  game grid with blockers), patrol legs on walk tiles off doors and mouths, tanks on kerb bays, per-chunk budgets, room walls
  closed, every room floor reached, every tap object tappable, line limits and a wording scan. In the game:
  `hcCityCheck()` (inside `PixelPets.charityCheck()`).
- **Flags:** `HC_CITY_V2` (ship switch), `HC_STREET_SOLID_BAYS`, `HC_TANK_POSTS`, `HC_GOV_HOUSE` (true inside the city).
  `?debug=1&hccity=2` turns the preview on for the tab, `?hccity=0` off. Plain `?debug=1` never does (172 specs use it).
- **Debug places** (Places list, preview only): one per chunk arrival and per new room; the Governor's House place seeds
  `story.act=2` (D1426) and the President's rooms place seeds `story.act=5` and `story.hc_gov_met`. `PixelPets.hcCity()` and `PixelPets.hcPlaceholders()` are debug-only.

## What is in it (phase 1)

| Chunk | Size | Objects | People | Tanks | Cars |
|---|---|---|---|---|---|
| `highcharity` Lantern Square | 64x40 | 113 | 12 | 3 | 10 |
| `hc_civic` Charter Hill | 64x48 | 85 | 6 | 3 | 8 |
| `hc_exchange` Exchange Quarter | 64x48 | 99 | 3 | 2 | 24 |
| `hc_waterfront` Lantern Quay | 64x40 | 55 | 3 | 1 | 6 |
| `hc_college` College Green | 48x48 | 43 | 2 | 0 | 0 |

Six paired mouths (five warps each, same offset, one tile inward), a gate arch and a district signpost inside each. Lamp posts
with the grey box on every median (tap: HB2), lit finials on every roof but the Muster Hall's, clipped planters, no litter.
Rooms: `hc_lantern_in` 16x22 (12 beds, the lantern wall, the lectern, the covered camera, the city lantern, the wire set,
Ines and the 5-Acorn note; respawn 8,19), `hc_news_1` and `hc_news_2` (wire room, HOLD spike, motto board, the Keeper
reader's office with WAIT and the waiting tray, the studio), `hc_gov_1` (lobby, two Keepers, the Governor's office, the
ORDERS DOWN chute's mouth), `hc_gov_3` (the President's rooms, every §7.3 prop, no Summit staging). Data: 85 KB.

## Inspiration briefs (rule 9, step 1)

Written by a sub-agent before the rooms were laid out; the rooms use only `PAL` and existing tile families (the five new skins
in `sprites.js` `HOUSE_SKINS`: `hc_lantern_grand`, `hc_news_1`, `hc_news_2`, `hc_gov_1`, `hc_gov_3`, each a new wall and
floor pair).

Inspiration only, for Design and the builder to translate into pixels with `PAL` (sprites.js:13) and the §7 palette ledger of `design/specs/HIGH_CHARITY_LAYOUT.md`. Ramps are written dark / mid / light; the mid is the ledger key. View widths assume about 12 tiles across at 390 and 10 at 320 (§6.3), with the follow camera centred on the player.

#### hc_lantern_in

- **Mood:** a warm, high hall of hundreds of small lights where you are safe to sleep and, without noticing, always in view of the wall.
- **References:** a great old railway-station waiting hall at dusk, warm and echoing; a long convalescent ward with two straight rows of iron beds; a church rack of votive candles, every flame the same height.
- **Light:** comes from the lantern wall across the far (north) end and falls toward the door; a second warm pool spreads round the city lantern at the centre (7,9). Shadows drop south of the beds, benches and counter. The hall is brightest at the wall and dimmest at the door.
- **Ramps:** sand floor `A` = `F` / `A` / `C` (the `C` band lies only in the wall's glow); cream walls `C` = `G` / `C` / `y`; warm trim `G` = `F` / `G` / `A`; lantern wall `y` = `G` frames / `y` panes / `w` flame cores.
- **Eye first:** at 390 (about x2-13 from the respawn at 8,19): Ines at her counter, then the bed column on the left, then the glow up the centre aisle. At 320 (about x3-12) the far bed column is cut off, so the near beds at x3 and Ines carry the healing read. The lantern wall comes into view only as you walk up the aisle, so the wall works as a reveal.
- **Reads as healing at a glance (rule 10):** beds come first and fill a whole side, each with the same pale, lit cover. Ines stands just inside the door, so she is the first person the holder meets, and her line ("Beds on the left, quiet on the right...") tells you where to rest. The house's shared healing mark (the same one as the exterior indicator) hangs behind her counter, and the 5-Acorn note sits on the counter. The wire set and the lectern stay smaller and lower in value than the beds: healing is the face of the room and the broadcast is the second layer.
- **Avoid:** anything in the centre aisle (x5-9) between the door and the lectern, and any glare that washes the bed covers into the floor. Keep the cloth over the camera dull (`F`/`G`) so it never reads as a bed or a seat.

#### hc_news_1

- **Mood:** busy, ink and paper, a room that never stops clacking and is proud of its plain words.
- **References:** an old newspaper wire room lined with clattering teleprinters; a post-office sorting hall with pigeon-holes and long tables; a printer's composing room with tidy cases of type.
- **Light:** cool and even, from high up on the north (printer) wall and falling south. The printer row is the brightest strip, the copy desks sit in mid light, and the front hall by the door is a step darker.
- **Ramps:** warm grey flag floor `I` = `m` / `I` / `h`; pale blue-grey walls `h` = `m` / `h` / `w`; slate wainscot `m` = `d` / `m` / `h`; paper and copy rolls = `h` / `w` / `w` with `k` for ink lines. The HOLD spike is plain `d`/`m` metal.
- **Eye first:** at both widths the entry at 7,15 faces the editor's desk and the motto board (x3-9). That is the first read: "WHO. WHERE. WHAT CHANGED." At 390 the HOLD spike (11,7) sits at the right edge of view; at 320 it is just off-screen, and the gap in the partition draws you north toward the printers.
- **Avoid:** copy rolls or paper stacks spilling into the partition gap at x6-7, which is the only path north. The spike's PERMITS slip must stay a quiet tap find, so give it no bright `w` or red.

#### hc_news_2

- **Mood:** quiet and stamped; nothing is cut or burned, the pages just wait in neat piles.
- **References:** a customs inspection office with rubber stamps, ink pads and in and out trays; a small local radio studio with one chair before a plain cloth backdrop; a records room of grey filing cabinets with the drawers all shut.
- **Light:** one low lamp over the reader's desk on the west side, falling east across the stamp table and the "waiting" tray. The studio past the partition is lit flat and dim from the front, and the cloth over the camera is the darkest shape there.
- **Ramps:** slate floor `K` = `d` / `K` / `h`; walls `h` = `m` / `h` / `w`; dark trim `d` = `k` / `d` / `m`; the camera cloth = `k` / `d` / `m`; stamps: READ AND RELEASED in `J`, WAIT in `r`, both small.
- **Eye first:** the holder arrives by the stairs at 12,12. At 320 (about x4-13) they see the filing cabinets and then the "waiting" tray and the stamp table; the reader's desk (x2-3) slides into view as they walk west. At 390 the reader's desk is just in view at the left, so the eye goes from desk to tray to the cabinets of pages that wait.
- **Avoid:** horror shorthand (ash, torn paper, red slashes, a dark cell look). The bias is what waits, so the room stays orderly and almost dull. Keep the partition gap at x7 clear.

#### hc_gov_1

- **Mood:** civil and polished, a lobby that greets you politely and makes sure orders only ever travel down.
- **References:** a town-hall lobby with a polished stone floor and a reception desk under a wall clock; a bank manager's panelled office with brass fittings; the brass mail slot of an old office block, worn bright by use.
- **Light:** daylight from the south entry, laid across the polished floor as a long pale streak heading north. The Governor's office to the east is a half step warmer and dimmer, so the brass chute's mouth on his desk catches the light.
- **Ramps:** warm grey floor `I` = `m` / `I` / `C` (the polish streak); sage walls `D` = `J` / `D` / `C`; Keeper green wainscot and runner `J` = `k` / `J` / `D`; brass chute = `F` / `G` / `y`.
- **Eye first:** at both widths: the Keeper desk and its two Keeper anchors, straight ahead of the door. At 390 the door gap to the office shows at the east edge; at 320 it does not, so lead the eye there with the `J` runner, laid as a straight line east.
- **Avoid:** a runner or wainscot green that matches the Keeper uniform, which would make the two anchors melt into the wall (rule 11: the Keeper set's palette is locked, so the room has to change around them). Keep the Keeper desk off the straight line from the door to the office gap.

#### hc_gov_3

- **Mood:** warm, small and too tidy: a kind parlour where everything is squared to the edge and one cup is out of place.
- **References:** a head teacher's study with children's drawings pinned in exact rows; a grandparent's front room kept only for visitors; a museum period room behind a rope, not a speck out of place.
- **Light:** a warm lamp at the desk (top centre), falling evenly toward the chair and the stairs. Leave no dark corners: the room hides nothing on its surface, and the even light does that job. The glass case over the roll ledger gets one `w` glint.
- **Ramps:** sand floor `A` = `G` / `A` / `C`; terracotta rug `B` = `F` / `B` / `A`, with an `r` rose border; cream walls `C` = `G` / `C` / `w`; warm trim `G` = `F` / `G` / `A`.
- **Eye first:** the holder comes up the stairs at 1,12. At 390 the whole room fits: the eye goes to The President behind the desk plate, then the empty chair facing him ("Everyone gets a chair"). At 320 (x0-9) the desk and chair still fit, the two cups on the low table sit just ahead of the arrival, and the LAMP STOCK stamp (10,10) waits off-screen as a find.
- **Avoid:** any red near the low table. Per the ledger the wine rim (`V`, `N`, `Q`) appears only on the one cup and the card, so keep `r` on the rug border away from the cups. Also keep out all Summit cues (no bell, no Seal door, no flag; X7), and leave a free tile in front of each tap find (cups, stamp, ledger, chute top) so taps never land on the rug edge.

## Spec match

| Spec item | Matched / Differs | Why it differs | Test |
|---|---|---|---|
| §3 five chunks, the json grids, kept ids, the moved buildings (D1268, D1270) | Matched | | `the city loads`; `a save inside a moved building` |
| §3.3 kept tiles: Event Hall 32,29, coach 32,37, hc_south 32,38, gate 32,36, Moss 30,36 | Matched | | `the coach still lands` |
| §4.1 boulevards: walkable carriageway, solid bays and medians, crosswalks (D1271) | Matched | new tiles C Z U M; `X` mouth cells take their street's tile (X is Cobblecrest's rock pillar in the game) | build tool checks |
| §4.2-4.5 lamp posts with the grey box, lanterns lit at noon, spotless parks | Matched, except the hum | the hum loop is iPhone audio, red (D1371): not built; the tap line ships | `player text` |
| §4.3 48 parked cars, the Glimmerwell bay left empty | Matched | cars sit on horizontal bay runs only (one car body) | `the city loads` |
| §4.4 9 tank posts, idle-lit, no guns (D1272) | Matched | PLACEHOLDER tank art (A24; POST_TRIAL_CRACKDOWN §10a art is not built) | `the city loads`; reduced motion |
| §5.1 coach arrival | Matched in data | the Hearthmoor coach tile (12,9) is a roof tile on main in both modes (earlier issue, for QA) | `the coach still lands` |
| §5.2 the Muster Hall exterior: chained door 10,29 with the keyed deny (`seals>=7`: "Chained. Ask the duty Keeper."), duty Keepers 8,29 / 12,29, notice 14,29, Board 21,26, dark roof (D1306, D1308) | Matched | the call and the Trial are phase 2 (`HC_TRIAL_HALL`) | `the Muster Hall stands chained` |
| §5.3 gates by path and act (D1266, D1276; layout v0.4, D1426, D1439) | Matched | Governor's House floor 1, Governor Merriden and the ORDERS DOWN chute: Keepers path from Act 2 (`story.act>=2`); floor 2 is not built yet; the President's rooms stay Act 5 and "after meeting the Governor" reads the new flag `story.hc_gov_met` (D1370) | `§5.3 gates` |
| §6.2 mouths | Matched | | `every mouth warps` |
| §6.4 budgets (D1280) | Matched | | `the city loads`; build tool |
| §6.4 / §13.7 perf: no frame over 33 ms at 390 on a mid phone | Differs | no in-game frame meter; headless 4x CPU throttle: chunks p95 17-50 ms, today's High Charity p95 33, today's Hearthmoor p95 67. Gate set at p95 <= 50 ms; the real-phone check is QA's | `@slow perf` |
| §7.1 grand Lantern House 16x22, 12 beds, respawn 8,19 (D1260, D1274) | Matched | the gallery (phase 2) stair is roped off | `the grand Lantern House` |
| §7.2 Block News House, two floors, open to both paths (D1255-D1257) | Matched | the Keeper reader stands at 1,6 (2,6 is his desk in the §7.2 grid) | `§5.3 gates` |
| §7.3 Governor's House floors 1 and 3, the President's rooms (D1261-D1263, D1266) | Matched | floor 1's stair goes to floor 3 until floor 2 lands (D1372); The President stands at 7,2 behind the desk (6,4 is the permit tray in the grid) | `§5.3 gates` |
| §8.1 fixed anchors | Matched | `still: true` keeps them off the wander rules | data |
| NPC_RANKS (D1159-D1163): every Keeper cast entry has a rank, a pending proposal or a flag | Matched by flag | the city's Keeper cast carries `rankFlag` D1374; Story sets the ranks | `the city loads` (rankCheck) |
| §8.2 scheduled townsfolk | Phase 2 | Child and Parent and the old holder stand at their day tiles as anchors (HB1, HB8); the Child moves from 14,25 (inside the Muster Hall now) to 17,25 | data |
| §8.3 the 10 foot patrol beats, pairs half a loop apart (D1273) | Matched | | data; `tickPatrol` |
| §11 HB1-HB13 stubs (HB14 is phase 2), HB15 | Matched | sample lines word for word, PLACEHOLDER; lines §11 does not give are marked (D1374) | `player text`; `the Muster Hall stands chained` |
| §13.3 old saves | Matched | the preview holds the save; `save.js` needs the city's sizes when HC_CITY_V2 ships | `old saves`; `the preview never writes the save` |
| Normal play unchanged | Matched | | `flag off` |

## PLACEHOLDER art (Pia redraws before HC_CITY_V2 flips)

Engineer drafts in `PAL` only, each with a small `y`/`d` corner tag; the list is `HC_PLACEHOLDER_ART` in `sprites.js`.
A01-A04 the street tiles (C, Z, U, M); A05 lantern wall; A22 gate arch; A24 Keeper tanks (escort, command); A25 the
runabout car (5 colours); A32+A33 lamp post with grey box; A34 roof finial; A35 Kindness Board; A36 Lantern Muster mural;
A64 lectern; A65 camera under a cloth; A66 wire printer; A67 HOLD spike; A68 motto board; A69 stamp table; A70 waiting tray;
A71 ORDERS DOWN chute (top, mouth); A72 roll ledger; A73 permit tray; A74 LAMP STOCK stamp; A75 teacups (the one `V` rim);
A76 the card (the one `Q` spark); A77 thank-you letters; A78 lantern pin; A79 desk plate; A92 Muster Hall roof and wall;
A93 chained door. A10-A12 (the grand Lantern House, Governor's House and Block News House facades) and the P1 facades use the
built roof kit for now. The President's look is a PLACEHOLDER NPC look (LH-2 is open). Sheet: `handoff/shots/hc_city_v2/placeholder_art_sheet.png`.

## Sign-off and merge (Tue Nov 3, 2026)

- **The 390 previews were approved** by the owner in the Claude Code session that built this, Tue Nov 3, 2026 (layout §0
  preview gate, §13 test 10). The owner also approved the merge in that session and asked Claude to merge it, overriding
  AGENTS rule 4 (the Chief of Staff merges) for this PR only.
- What that does and does not do: the code lands with `HC_CITY_V2 = false`, so players see no change. Flipping the flag
  still waits on Pia's art for the PLACEHOLDER rows and the ship-time items below.
- Ids: this build's own calls are **D1370-D1374** (renumbered from D1348-D1352 in design `specs/HC_PARADE.md` §15: #277
  claimed D1348-D1350 first).
- HC_PARADE (design, settled Tue Nov 3) builds on this city. Its Court move (D1354: the Keeper High Court to the Parade's
  south half, facing Muster Road) is queued for after this merge and is not in this PR.
- **Court move (branch `claude/hc-court-move`, layout v0.3, design 91ef326):** the city is rebuilt from the v0.3 json with
  `python3 tools/build_hc_city.py --layout <design>/specs/high_charity_layout.json`. `hc_court` is now box 26,21-38,25, door
  32,26, with wide steps (A14 PLACEHOLDER decals `hc_court_steps_w`/`hc_court_steps`/`hc_court_steps_e`) on rows 26-27 facing
  Muster Road; the old corner 2,38-14,44 is grass and the tool places nothing there (`VACANT`); the flag row reads its row from
  the layout's `flag_row` landmark. Test: `tests/hc_court_move.spec.js`. Shots: `handoff/shots/hc_court_move/`.

## Open, for the Chief of Staff

- D1371 (red): the grey-box hum. Default not built.
- D1370, D1372-D1374: this build's own calls (see `OPEN_DECISIONS.md`).
- At ship time: flip `HC_CITY_V2`, drop the save hold, and add the city's map sizes to `save.js` MAP_SIZE.
- The Hearthmoor coach tile (12,9) is a roof tile on main (both modes); the coach can't be stepped on today. For QA.
- The Dojo line fix (D1304) is a separate copy PR, as the layout says.

## v0.4 build (Wed Nov 4, 2026; branch `claude/high-charity-v04`, lands after #315)

Built from design `specs/HIGH_CHARITY_LAYOUT.md` v0.4.2 (design `master` 5809141). Still a preview: `HC_CITY_V2 = false`.

- **Roads are clear (§4.1):** the tool refuses a blocker on `C` or `Z`. Five props that phase 1's placement search had nudged onto
  carriageways now stand on sidewalk or grass.
- **HC_PARADE's stands are kept clear** (`PARADE_STANDS`, copied from #296's beat sheet): no car in Muster Road's cordon bays, no
  lamp or sign on a stand; the Court's sign is at 35,26. The parade scene itself stays #286/#296's.
- **§8.2 scheduled townsfolk:** nine bodies on schedule rows. Spec tiles that are solid or on a road are nudged: Child 14,25 to
  17,25; Parent 15,25 to 17,26; Student A's dusk 16,27 to 17,27; the shopper's Store Row 33,33 (a carriageway) to 36,33.
- **HB14** sealed sea gate at Lantern Quay 21,38 (`HC_SPIRE_ROAD_HOOK`, D1279). **P1 reuse props** on the Square and College Green.
- **Battle scenes:** each chunk draws its own (BATTLE_BACKDROPS_ACT2 §4).
- **Checks:** `tests/high_charity_v04.spec.js` runs the layout checker's rules over the merged game WORLD (§13.1).
- **Shots:** `handoff/shots/high_charity/` (before = `claude/route4`, after = this branch; 390 and 320, Modern, 11:00).

### Rule 9: rooms held (never built), with the previews Vincent needs to see

| Room | Packet | Why held |
|---|---|---|
| `hc_gov_2` Cabinet Room (twelve chairs, the charter under glass, the seating board, the map of towns) | layout §7.3; CABINET_AND_COUNCILS §4.1; WALK_BESIDE §2.1 | no grid in any packet; no inspiration pass; no preview |
| `hc_lantern_up` gallery | layout §7.1 | grid given; no inspiration pass; no preview |
| `hc_college_in` College Great Hall | layout §7.4 | no grid; no preview |
| `hc_trial_in` Muster Hall, `hc_trial_stone` Hall Stone room | layout §7.5 | blockouts only; also waits on the Hall 8 build (`HC_TRIAL_HALL`) |
| `hc_library_in`, the Dojo expansion | layout §7.4 (phase 3) | no grid; no preview |

Each needs, in order: the rule 9 inspiration pass (sub-agent or Gemini), Design's grid (the Cabinet Room has none), 390 before and
after previews, and Vincent's yes. Until then floor 1's stair goes straight to floor 3 (D1372).
