# LANTERN_HOUSE_FERNBROOK: the Fernbrook Lantern House as the town's wire station (`fb_lantern_in`)

**Build (Tue Nov 3, 2026):** built on `claude/post-trial-crackdown` (build 20261103-0849). The curfew state is the crackdown night only (`story.crackdown & !story.post_trial_done`, D1333). The parquet tiles are `floor_parquet_oak*` (the name `floor_parquet` was taken). Rule 9: it does not merge until Vincent says yes to `handoff/shots/lantern_house_fernbrook/build/` (D1336).

Target path: `handoff/specs/LANTERN_HOUSE_FERNBROOK.md` (PUBLIC repo; not `docs/`). **Spec and previews only.** Nothing here is built: no game code or data changes. This is a room redesign (AGENTS rule 9), so **nothing builds or deploys until Vincent has seen the before/after previews (§10) and said yes.** The Supervisor sends them to him. All player text below is PLACEHOLDER; Story (June) writes the real lines.

## 1. Status and sources

| Item | Value |
|---|---|
| Status | Draft v0.1, Mon Nov 2, 2026, ~11:30 PM ET. Folds in Vincent's Beat 7 change (Mon Nov 2, ~10:55 PM ET): the President gives the curfew broadcast on the wire set, then the holder answers "He means well" / "He's hiding something" |
| Ask | Vincent, verbatim: "redesign that lantern house to look much important, high tech, civilians should be present and gathered around the TV" |
| Hosts | POST_TRIAL_CRACKDOWN (`handoff/specs/POST_TRIAL_CRACKDOWN.md`): scene `crackdown_lantern`, Beats 4-8 (§4), the curfew (§5), the wire set (§10). This spec updates those beats' tiles and props; see §11 |
| Builds on | main `f60f57d` and draft PR #261 (`claude/day1-trial1-build-gtkcop`, `fa9c044`): #261 adds `fb_burrsnout` 3,7, `fb_juniper_tl` 8,6 and triggers `fb_tl_amos` / `fb_tl_choice` at 5,13 to this room, and quest targets `fb_lantern_in` 6,4 (`quests.js:122,125`) |
| Read first | AGENTS.md rules 1, 2, 6, 8, 9, 10; `TRIAL_HALL_FERNBROOK_MAP.md` §6.3 (tone bible); `data/fernbrook_rooms.json` `maps.fb_lantern_in`; `sprites.js` `SKINS.fb_lantern` (main line 2066) and the INTERIOR_WALLS kit (`wallRow`, line 2010) |
| Skills | walklings-room-packet, gamedev-level-design, walklings-decision-ids, walklings-wording-check, walklings-dialog-camera |
| Previews | `handoff/shots/lantern_house_fernbrook/` (§10). "Before" is #261's build. "After" is the same build with this spec's grid, objects and **draft** art injected at load (not committed; Pia redraws) |
| Decision ids | **LH-1 to LH-5, ids pending: five ids at or above HIGH_CHARITY_LAYOUT's block, picked once that block is reserved (Vincent, Mon Nov 2, 2026, ~11:45 PM ET; design STORY_DECISIONS v0.65).** This spec first reserved LH-1-LH-5, which collide with Vincent's settled Seals calls (SEALS-K to SEALS-O, design STORY_DECISIONS v0.65), so they were withdrawn. Nothing here reads an id |

## 2. Diagnosis and goal

**Diagnosis (one line):** today the room reads as a calm orchard rest house (cream planks, apple crates, herbs, one small lamp), so nothing says "the town's civic heart" or "the Keepers' local station", and there is no screen big enough for a town to gather around; the 16x16 wire set the crackdown storyboard tried at (8,2) was off screen at 320 from the rug.

**Goal:** the same room, kept for rest, becomes Fernbrook's **wire station**: a monumental Keeper wire set on the door axis, flanked by relay racks and brass lamps, a switchboard, a green-and-gold runner from the door straight to the screen, oak parquet and benches. On a normal day it is an important, quiet public room. During the curfew the townsfolk shelter here and crowd around the set; in Beat 7 the President speaks from it.

## 3. Inspiration (walklings-room-packet step 2)

Done in-session on Mon Nov 2, 2026, ~11:10 PM ET (no sub-agent was available to this worker; the brief allowed doing it directly). Reference only; nothing is copied.

- **Mood:** a small-town telegraph office and public hall at night, where people go when something big is happening. Warm, handmade, a little proud. Its technology is built and maintained by hand: polished brass, oiled oak, cloth-wrapped cable, glass that glows.
- **References (situations, no places or brands):**
  - a village hall where everyone gathers round one wireless set for a national address;
  - a railway signal box (rows of levers and indicator lamps, a big board above the desk);
  - a telephone exchange with an operator at a jack board and patch cords;
  - a station concourse with one departure board everyone faces;
  - a courthouse aisle (a carpet runner on the axis, benches either side, the important thing at the end).
- **Layouts considered:**
  - **A. North wire wall on the door axis (picked).** A 48x48 set on the north wall at col 5, the door's column; racks and lamps mirrored either side; a runner from the mat to the screen; the crowd stands in front, leaving the aisle open.
  - B. A freestanding wire console in mid-room (rows 5-6), crowd south of it. Rejected: it hides Amos behind it, breaks the door-to-Amos sightline, and reads as furniture, not an institution.
  - C. Expand the room east to 14 or 16 wide and add a separate "wire hall". Rejected for now: at 390 the 12-wide room is shown whole at scale 2 (12.2 tiles visible); a wider room scrolls and loses the at-a-glance read, and every crackdown actor tile would need checking against a new grid. Kept as LH-4 option B.
- **Why A:** the holder enters on col 5 and looks straight up the runner at the glowing screen: the strongest "important" read the tile grid allows. Amos already stands at 6,3, right beside the set, so he becomes its operator without moving.
- **Pitfalls named, and what this spec does:**
  - "High tech" drifting into Glimmerwell gloss: no `V`, `N` or `Q` anywhere; no black lacquer, no chrome, no red light strip. Tech is oak, brass, green, and teal glow (§6).
  - A dark green room swallowing everything: the floor is light oak, the wall face is the only large green field, and the screen is the brightest value in the room.
  - Text unreadable at 320: the screen reads by shape (an emblem card, a face) not by words.
  - The crowd blocking play: every body is checked by a path model (§9).

## 4. Metrics (gamedev-level-design step 1)

| Metric | Value | Source |
|---|---|---|
| Room | 12 x 16 tiles (unchanged) | `fernbrook_rooms.json` |
| Room camera, 390 x 844 (modern) | scale 2; the whole room is on screen (12.2 x 21.5 tiles visible) | measured in #261's build (`roomZoomFor`) |
| Room camera, 320 x 568 (modern) | scale 2; **10.0 x 12.9 tiles** visible; follows the holder and clamps | measured |
| What 320 sees | holder at the door (5,14): rows ~3-16, so the set (rows 0-2) is **off screen**. Holder at row 6 or above: rows 0-12.9, the whole set and crowd **on screen** | `after-curfew-door-320.png`, `after-curfew-top-320.png` |
| Walk | 170 ms a step; NPC walks 120 ms a tile | walklings-dialog-npc-walk |
| Steps from the arrival tile 5,14 | wire set 11, Amos 11 (unchanged), beds 9-11 (unchanged), heal counter 12 (unchanged) | path model (§9) |

## 5. Layout at tile level

### 5.1 What stays and what changes

| Thing | Value | Changes? |
|---|---|---|
| Map id | `fb_lantern_in` | no |
| Size | 12 x 16 | no |
| Outside door | `fb_lantern` at fernbrook 5,5 | no (exterior untouched; rule 10) |
| Mat warp | `fb_lantern_mat` at 5,15 to fernbrook 5,5 facing down, in the dark bottom wall row | no |
| Arrival / `safe` | 5,14 | no |
| Keeper Amos | `amos` 6,3, `panel: lantern` | no (quest targets 6,4 stay valid) |
| Beds | `fb_bed_a/b/c` at 1,6 / 2,6 / 3,6, `@lantern_rest` | no (rule 10) |
| Skin | `fb_lantern` (id kept) | remap, decal, walk and wall row change (§8) |
| Wall windows | `wall.windows` [4, 7] | **[1, 9]** (the set and racks now cover 3-7) |
| Grid | rows 2-14 re-glyphed (§5.2); walls, mat, size the same | yes |
| Existing props | every id kept; `fb_lamp` moves 10,3 → 10,9 (the switchboard takes the north-east corner) | one move |
| #261 objects | `fb_burrsnout` 3,7, `fb_juniper_tl` 8,6, triggers at 5,13 | no (tiles stay free and reachable) |
| New objects | 13 props and 6 curfew bodies (§7) | yes |
| Retired ids | **none** | |

### 5.2 Grids

Before (main and #261; objects overlaid: `@` Amos, `c` heal counter, `l` lamp, `h` herb rack (9,4; `hh` at 3-4,4 is the hearth glyph), `B` beds, `a` apple crates, `t` table, `g` jug, `s` stool, `b` basket, `n` note):

```
    x 0123456789AB
y  0   ############
y  1   #WWWWWWWWWW#
y  2   #uvuvuvuvuv#
y  3   #..c..@...l#
y  4   #..hh....h.#
y  5   #..........#
y  6   #BBB.......#
y  7   #q..j..j.aa#
y  8   #..........#
y  9   #...===....#
y 10   #.s.===.t..#
y 11   #..q,..jg..#
y 12   #b..,.....n#
y 13   #j..,......#
y 14   #..........#
y 15   #####m######
```

After, glyphs only (`K` wire plinth, solid; `,` runner; `=` rug; `~` brass cable channel, a walkable decal; `u`/`v` window light and wall shadow; `q`/`j` leaf and apple-speck decals kept for Fernbrook warmth):

```
    x 0123456789AB
y  0   ############
y  1   #WWWWWWWWWW#
y  2   #uv.KKK.vu.#
y  3   #....,..~~~#
y  4   #....,.....#
y  5   #....,.....#
y  6   #....,.....#
y  7   #q...,.j...#
y  8   #....,.....#
y  9   #...===....#
y 10   #...===....#
y 11   #..q.,.j...#
y 12   #....,.....#
y 13   #j...,.....#
y 14   #....,.....#
y 15   #####m######
```

After, a normal day (new: `T` wire set, `R` relay racks, `o` brass lamps, `X` switchboard, `d` wire desk, `=` benches on row 8, `P` public wire box):

```
    x 0123456789AB
y  0   ############
y  1   #WWWWWWWWWW#
y  2   #uoRKTKRouX#
y  3   #..c.,@d~~~#
y  4   #....,...h.#
y  5   #....,.....#
y  6   #BBB.,.....#
y  7   #q...,.j.aa#
y  8   #.==.,.==..#
y  9   #...===...l#
y 10   #.s.===.t..#
y 11   #..q.,.jg..#
y 12   #b...,....n#
y 13   #j...,...P.#
y 14   #....,.....#
y 15   #####m######
```

After, the curfew (`1` resident child, `2` Odile, `3` resident, `4` Wynne, `5` older resident, `6` Tobin; all face up, toward the set):

```
    x 0123456789AB
y  0   ############
y  1   #WWWWWWWWWW#
y  2   #uoRKTKRouX#
y  3   #..c.,@d~~~#
y  4   #..21,.3.h.#
y  5   #....,.46..#
y  6   #BBB.,5....#
y  7   #q...,.j.aa#
y  8   #.==.,.==..#
y  9   #...===...l#
y 10   #.s.===.t..#
y 11   #..q.,.jg..#
y 12   #b...,....n#
y 13   #j...,...P.#
y 14   #....,.....#
y 15   #####m######
```

### 5.3 Zones

- **The wire wall (rows 0-3, cols 2-8):** the set on the axis; relay racks at 3 and 7; brass lamps at 2 and 8; Amos at 6,3 with his wire desk at 7,3 and the heal counter at 3,3. The holder's talk tiles stay open: 5,3 (the set), 6,4 and 5,3 (Amos).
- **The station corner (cols 8-10, rows 2-4):** the switchboard on the east wall, a brass cable channel from it along row 3 to Amos's desk, the herb rack kept.
- **The rest bay (cols 1-3, rows 3-8):** the three beds where they are, the heal counter, the benches' west pair; Burrsnout's cot tile (3,7) stays free.
- **The gathering floor (rows 4-6):** open on normal days; the curfew crowd stands here in a crescent, leaving the aisle (col 5) and Amos's tile (6,4) open.
- **The hall (rows 8-14):** runner, rug, two pairs of benches facing the set, the table and jug, the lamp, the note, and a public wire box by the door.

## 6. Tone: Keeper high tech

**The one-line read:** the wires are the Keepers' (STORY canon: the Keepers own the wires and the phones), so the most advanced thing in Fernbrook is also the most Keeper thing in it. Their technology is **made, not bought**: every machine sits in an oak cabinet with a brass bezel, rivets and a gold crest, the way the old Keepers would have built it.

| | Keeper high tech (this room) | Glimmerwell (stays out) |
|---|---|---|
| Material | oak `A` > `G` > `B` > `F`; brass `y`/`G`; deep green `J` lacquer on the wall face and the call box; porcelain insulators `w`/`h` | black lacquer `N`, chrome, polished slab |
| Tech cue | teal/cyan screen glow `t`/`c`/`s`; indicator lamps in `y`, `l`, `s` (and an off `B`); patch cords in `t`, `g`, `y`; cloth-wrapped wire `F`/`d` running into the wall | sparkle, red light strip, wine enamel |
| Light | one source, top-left: highlight top and left edges, shade bottom and right; the screen is the brightest value in the room | hard specular streaks |
| Shape | symmetric around the door axis; every machine a different handmade piece (rack, switchboard, desk, call box) | identical modular units |
| Motion (build, optional) | rack lamps blink on a slow 700 ms 2-frame beat; the Block News ticker crawls (500 ms); the President's mouth (260 ms). Reduced motion shows frame 0 | |

**Reconciling "high tech" with warm and handmade:** the room is high tech in what it *does* (a live picture from the capital, a line to every Keeper post) and handmade in what it *is made of*. That contrast is the Keepers' identity: old institution, real reach. It also sets up the crackdown honestly: the same wires that keep Fernbrook connected carry the Commander's curfew.

**Value check (T9):** in a greyscale capture at 320 from 5,6, the screen is the lightest large shape, the wall face the darkest band, and the floor mid.

## 7. Objects

`CURFEW` = `["story.crackdown", "!story.side_pick_done"]` (the POST_TRIAL_CRACKDOWN §5 read). `NOT_CURFEW` = `["!story.crackdown | story.side_pick_done"]`. No new save field anywhere: every gate is a read of existing or already-specced flags.

### 7.1 Props

| id | tile | sprite | `when` | lines (PLACEHOLDER) | new? |
|---|---|---|---|---|---|
| `fb_wire_set` | 5,2 | `wire_wall` (off) | NOT_CURFEW | "The Keepers' wire set. Block News comes on at the top of the hour." | **new** (POST_TRIAL's id, now at 5,2 and 48x48) |
| `fb_wire_set_live` | 5,2 | `wire_wall_news` (Block News loop) | CURFEW | "Block News. The curfew notice runs again and again." | **new** |
| `fb_relay_w`, `fb_relay_e` | 3,2 / 7,2 | `relay_rack` (2 frames) | | silent (decor; no neighbour needed) | **new** |
| `fb_lamp_w`, `fb_lamp_e` | 2,2 / 8,2 | `dais_lamp` (exists) | | "A brass oil lamp, polished bright." / "...Its twin is across the wire set." | **new** objects, existing art |
| `fb_switchboard` | 10,2 | `switchboard` | | "The switchboard. Every cord is a line to another Keeper post." | **new** |
| `fb_wire_desk` | 7,3 | `wire_desk` | | "Amos's desk. A wire handset and the night ledger." | **new** |
| `fb_bench_a`-`d` | 2,8 / 3,8 / 7,8 / 8,8 | `bloom_bench` (exists, Fernbrook's Trial Hall bench) | | "An oak bench facing the wire set." | **new** objects, existing art |
| `fb_callbox` | 9,13 | `wire_callbox` | | "A public wire box. Keeper business only, says the brass plate." | **new** |
| `fb_heal_counter`, `fb_herb_rack`, `fb_apple_a/b`, `fb_table`, `fb_jug`, `fb_stool`, `fb_basket`, `fb_lantern_note`, `fb_bed_a/b/c` | as today | as today | as today | as today | kept |
| `fb_lamp` | **10,9** (was 10,3) | `orchard_lamp` | | as today | moved |

### 7.2 Civilians (curfew only)

All six use `when: CURFEW`, `facing: up` (toward the set), lines PLACEHOLDER (June). New bodies, so the outdoor townsfolk keep their ids and stay hidden outside by POST_TRIAL §5's `when`.

| id | name | look | tile | line (PLACEHOLDER) | notes |
|---|---|---|---|---|---|
| `lh_res_kid` | Resident (PLACEHOLDER) | new look `lh_res_kid` (skin 4, spiky `d`, hoodie `g`, accent `y`) | 4,4 | "Is it on? I can't see!" | front row, by the aisle |
| `lh_odile` | Odile (exists outside: `odile`, maps_slice 27,9) | by name (`orchard_odile`, LOOK_OF_NAME) | 3,4 | "Hush now. Let the wire talk." | |
| `lh_res_b` | Resident (PLACEHOLDER) | new look `lh_res_b` (skin 1, bun `o`, sweater `p`, scarf) | 7,4 | "A curfew. In Fernbrook. Whatever next." | |
| `lh_wynne` | Wynne (exists: `fb_wynne`, stall 25,7) | `fb_wynne` | 7,5 | "My stall is still out there. Picked this morning, every one." | no shop indoors |
| `lh_res_c` | Resident (PLACEHOLDER) | new look `lh_res_c` (skin 5, short `w`, coat `m`, glasses) | 6,6 | "Forty years in this town. Never once a curfew." | "forty years" is PLACEHOLDER, not canon |
| `lh_tobin` | Tobin (exists: `fb_tobin`, a Glimmerwell hand, cast faction glimmer) | `associate` | 8,5 | "I just count crates. That is all I do." | a Glimmerwell local who stays when Glimmerwell runs; Story call (LH-3) |

- The three new looks are look entries built from the existing kit (no new art); "Resident" needs a `reputation.json` cast row (`faction: none`), which the boot check requires (seen in the previews).
- POST_TRIAL §7.2 `whereNow` for Wynne, Odile and Tobin changes from "home (curfew)" to "Lantern House (curfew)", and the marker rule (no step points at a hidden body) holds: the indoor bodies are live.
- **They don't block anything** (§9): the aisle (col 5), Amos's tile 6,4, the set's tile 5,3, every bed, the counter, the desk, the switchboard and the door all stay reachable in the curfew state.

## 8. Art for Pia (new vs existing; drafts in `draft_art_sheet.png` at 5x)

| Asset | New / existing | Size | Draft notes (PAL keys only) |
|---|---|---|---|
| `wire_wall` | **new** | 48x48, drawn bottom-centred on 5,2: covers cols 4-6, rows 0-2 | oak cabinet `A`/`G`/`F` with grain `B`; brass bezel `y` with four rivets; dark glass `d`/`k` with an `m` reflection; brass grille, two knobs, pilot lamp (off `B`); oak cornice; a gold-rimmed green roundel with a lantern (`y`, `J`, `C`) rising onto the cap row; porcelain insulators `w`/`h` with the wire `F`/`d` running out along the cap; a cable leaves the right foot toward the switchboard |
| `wire_wall_news` | **new**, 2 frames, 500 ms | 48x48 | screen `t` lit `c` top-left; gold Block News emblem box (lantern mark); headline bars `w`/`s`; a navy `n` ticker with gold dashes that crawls; a scan line; pilot `l` |
| `wire_wall_pres` | **new**, 2 frames, 260 ms (mouth) | 48x48 | **the President** as a simple bust: grey hair `h`/`w`, face `3` with `2` light and `4` shade, Keeper-green coat `J`, gold lapels, shoulder and pin `y`, white collar `w`; gold flag poles and green drapes either side; a lower-third caption strip `n`/`w` (no readable text). Look is a draft: Pia and Vincent decide it (LH-2) |
| `relay_rack` | **new**, 2 frames, 700 ms | 16x32 | oak cabinet, gold top edge, dark panel `d`, 4x3 indicator lamps `y`/`l`/`s`/`B`, brass vent, wire into the wall |
| `switchboard` | **new** | 16x32 | oak frame, terracotta `B` jack field with brass-rimmed jacks, patch cords `t`/`g`/`y`, oak ledge with keys, a cyan signal lamp on top |
| `wire_desk` | **new** | 16x16 | oak desk; brass candlestick handset; a green ledger with cream pages |
| `wire_callbox` | **new** | 16x32 | oak roof with a brass lamp; green `J` body lit `E`; glass `t`/`c` with a handset inside; brass plate |
| `floor_parquet`, `_b`, `_c` | **new** tiles (variants 0.18 / 0.14) | 16x16 | oak basket-weave: `G` field, `A` plank light, `B` joints; `_b` a knot, `_c` a worn patch. Low contrast (tone bible) |
| `wire_plinth` | **new** tile, solid | 16x16 | oak step with a brass line; under the set (mostly covered) |
| `cable_run` | **new** decal, walkable | 16x16 | a brass-studded oak cable channel on the floor |
| wall | kit, new row | | `wallRow('FyGJFyGFGcwF')`: cap oak-dark `F`, gold highlight `y`, oak lip `G`, **green face `J`**, shade `F`, **gold trim `y`**, oak baseboard `G`, glass `c`, shine `w`. Unique among every skin's wall row (checked against all 40 rows in `sprites.js`: 39 `wallRow` strings plus `house_home`'s object) |
| runner `,` | existing `rug_keep` | | the Keeper green-and-gold runner (Keeper House) |
| rug `=` | existing `rug_keeper` | | |
| mat `m` | existing `mat_keep` | | |
| lamps, benches, beds, counter, crates, herbs | existing (`dais_lamp`, `bloom_bench`, quilts, `heal_counter`, ...) | | |

**Palette ledger:** no new PAL keys. Keys used: `A B C E F G J y` (oak, brass, green), `t c s n` (screen), `d k m h w` (glass, iron, porcelain), `l g` (lamps, cords), skin tones `2 3 4`. `V`, `N`, `Q`, `r` and `p` are not used in the new art.

**Identity check:** no other interior pairs oak parquet with a green-and-gold wall; Keeper House (`house_hq`) is navy and slate, the Wardens' lodge cream over flagstone, the Trial Hall moss and bloom.

## 9. Readability and paths

- **390:** the whole room is on screen at scale 2, so the set, the crowd, Amos, the beds and the door are always visible together (`compare-390.png`).
- **320:** from the door the camera shows rows ~3-16 (the set is off screen, the crowd's backs and the glow from the runner lead the eye up). From row 6 or above the whole set, crest and crowd are on screen. **Beat 7 therefore walks the holder to 5,6** (in the aisle, among the crowd) before the set comes on; the text box then sits over rows ~9-13, below every speaker and the set (`after-pres-beat7-320.png`).
- **Taps:** every interactable is at least one tile from the next except the deliberate north row (lamp / rack / set / rack / lamp), where the racks are silent and the set's only talk tile is 5,3.
- **Path model** (BFS from 5,14, bodies solid, `when` evaluated; three states: normal after the pick, the curfew, and #261's Day 1 lantern evening):

| Check | Normal | Curfew | Day 1 evening (#261) |
|---|---|---|---|
| Unreachable floor cells | none | none | none |
| Interactables with no reachable neighbour | none | none | none |
| Steps to the wire set / Amos / beds a-b-c | 11 / 11 / 11-10-9 | 11 / 11 / 11-10-9 | 11 / 11 / 13-12-9 |
| Crackdown actor tiles free (5,10 6,10 4,13 6,13 5,13 5,6 6,7 6,4 5,3) | all | all | all |
| #261 tiles (3,7 Burrsnout, 8,6 Juniper) | free | free | occupied by their own bodies, reachable |

Before (today's room) passes the same model.

## 10. Previews (`handoff/shots/lantern_house_fernbrook/`)

| File | What |
|---|---|
| `compare-390.png` | before; after on a normal day; after in the curfew (the set on Block News, six townsfolk gathered); after in Beat 7 (the President on the set, three reaction emotes, "The President" text box) |
| `compare-320.png` | before at the door and at the north end; after on a normal day; the curfew from the door and from the north end; Beat 7 with the holder at 5,6 |
| `before-normal-{door,top}-{390,320}.png` | today's room (#261's build) |
| `after-normal-{door,top}-{390,320}.png` | normal day |
| `after-curfew-{door,top}-{390,320}.png` | curfew |
| `after-pres-beat7-{390,320}.png` | Beat 7: Fen 6,7, Commander 5,13, officers 4,13 and 6,13 cast in; `prop fb_wire_set_live wire_wall_pres`; emotes; one PLACEHOLDER line |
| `draft_art_sheet.png` | every new tile and prop at 5x, with the reused pieces |

How they were made: #261's build served locally; the grid, objects, `wall.windows`, three looks and the "Resident" cast row added to `MAPDATA` at load; the draft art appended to `sprites.js` at load (skin remap, decal, walk, variants and wall row patched); Playwright Chromium at 390x844 and 320x568, modern controls. **Zero console errors in all eight runs** (and in the art-sheet run); the save stayed `pixelpets.save.v2` with `v` 2.

## 11. Changes to POST_TRIAL_CRACKDOWN (made in this PR)

| Where | Was | Now |
|---|---|---|
| §3 cast | Block News (wire set) | Block News anchor, plus **The President** on the wire set (Beat 7) |
| Beat 4 | holder 5,10; Fen 6,10; officers 4,13, 6,13; Amos 6,3 | unchanged (all free in the new layout); the six townsfolk are already in place (they are room bodies, not casts) |
| Beat 5, 6 | Commander 5,13 | unchanged |
| Beat 7 | Amos walks to 7,3; holder 8,4; Fen 7,5; `prop fb_wire_set wire_set_on` at 8,2; Block News reads the curfew | **rewritten** (Vincent, Mon Nov 2, ~10:55 PM ET): Amos (6,3, beside the set) turns it on; Block News anchor opens; the picture cuts to the President, who reads the curfew, the leave-or-be-detained line and the Seal-gain ban; townsfolk react; the holder's choice "He means well" / "He's hiding something" moves `story.fen_lean`; Amos and Fen react. Holder 5,6, Fen 6,7. Props `fb_wire_set_live`: `wire_wall` → `wire_wall_news` → `wire_wall_pres` → back to `wire_wall_news` |
| Beat 8 | | unchanged |
| §5 | townsfolk "home (curfew)" | the indoor bodies (§7.2) are the shelter; outdoor ids still hidden |
| §10 | `wire_set`, `wire_set_on` 16x16 | `wire_wall`, `wire_wall_news`, `wire_wall_pres` 48x48 (this spec §8) |
| §11.1 T10 | wire set on screen at 320 | same check, at 5,6, with the President frame |
| §12 | | new row: Beat 7 vs Seals lore v3.1, resolved |

## 12. Acceptance tests (for the later build; `tests/lantern_house_fernbrook.spec.js`)

320, 375 and 390; reduced motion; zero console errors; save unchanged (`pixelpets.save.v2`, `v` 2, no new top-level field; only `story.fen_lean` changes, and only from the Beat 7 choice).

| # | Check |
|---|---|
| T1 | Ids: `fb_lantern_in`, `fb_lantern_mat` (5,15 → fernbrook 5,5), `safe` 5,14, `amos` 6,3, `fb_bed_a/b/c` 1-3,6 and every old prop id still exist; w x h is 12 x 16 |
| T2 | Rule 10: a bed `@lantern_rest` heals the party; Amos's `lantern` panel opens from 6,4 in both states |
| T3 | Path model (§9) in the normal, curfew and Day 1 evening states: no unreachable floor, every interactable has a reachable neighbour, the listed actor tiles are free |
| T4 | Curfew read true: the six bodies and `fb_wire_set_live` are present and `fb_wire_set` absent; false (and after the pick): the reverse |
| T5 | Walk mask: `K` solid, `~`, `,`, `=`, `u`, `v`, `q`, `j` walkable; the mat row unchanged |
| T6 | Wall kit: the room draws `fb_lantern__*` parts from row `FyGJFyGFGcwF`, windows at 1 and 9; no `V`, `N`, `Q` pixel in any new tile or prop (palette scan of the canvases) |
| T7 | Beat 7 at 320: with the holder at 5,6 the set's screen rect is fully inside `#mapCanvas` and clear of `#sbox` for every Block News and President line |
| T8 | Beat 7 choice: each answer changes only `story.fen_lean` (encoding per Seals lore v3.1); replaying the scene does not apply it twice |
| T9 | Value check (§6): greyscale capture at 320 from 5,6; the screen's mean value is the highest of any 3x2-tile region |
| T10 | Reduced motion: racks, ticker and the President's mouth stay on frame 0 |
| T11 | Markers: during the curfew, Wynne, Odile and Tobin's markers point at their Lantern House bodies, never at a hidden outdoor body |
| T12 | Wording scan on the data diff (walklings-wording-check) passes |

## 13. Conflicts

| # | With | Conflict | Default |
|---|---|---|---|
| 1 | POST_TRIAL Beat 7 (16x16 set at 8,2, holder 8,4) | the set moves to 5,2 and grows to 48x48 | Beat 7 rewritten (§11); holder 5,6, Fen 6,7 |
| 2 | Vincent's Beat 7 change vs Seals lore v3.1 | the old Beat 7 had Block News read the curfew; Seals lore v3.1 has the President and `story.fen_lean` | resolved: the President gives the broadcast and the choice moves `story.fen_lean` (Vincent, Mon Nov 2, 2026, ~10:55 PM ET) |
| 3 | AGENTS rule 10 | Lantern Houses keep beds and a guiding NPC | beds and Amos unchanged; the exterior is untouched |
| 4 | POST_TRIAL §5 (townsfolk hidden, "home (curfew)") | Vincent wants civilians at the TV | new indoor bodies; outdoor ids unchanged and still hidden; `whereNow` says "Lantern House (curfew)" |
| 5 | #261 (`fb_burrsnout` 3,7, `fb_juniper_tl` 8,6, triggers 5,13, quest targets 6,4) | | all kept free and reachable (§9); no #261 id changes |
| 6 | POST_TRIAL §12 row 8 (Rook optional in the Lantern House) | crowd space | if Story adds Rook, 6,5 or 9,6 is free |
| 7 | Tobin is a Glimmerwell hand (cast faction glimmer) | Glimmerwell is sent away in Beat 3 | default: Tobin stays as a resident, apart at 8,5; Story can swap him for a resident body (LH-3) |
| 8 | TRIAL_HALL_FERNBROOK_MAP §6.3 tone bible | "high tech" | Keeper materials only (§6) |
| 9 | Exterior `fb_lantern` | rule 10 exterior language | untouched |

## 14. Decisions (LH-1 to LH-5, ids pending)

Ids pending: five ids at or above HIGH_CHARITY_LAYOUT's block, picked once that block is reserved (Vincent, Mon Nov 2, 2026, ~11:45 PM ET; design STORY_DECISIONS v0.65). The first reservation, LH-1-LH-5, collided with Vincent's settled Seals calls and is withdrawn; the game repo's next free id is D1255 (D1253-D1254 are Design's, unused).

| Id | Colour | Call | Default |
|---|---|---|---|
| LH-1 | **red** (room redesign, rule 9) | The Fernbrook Lantern House becomes the town's wire station, as previewed: 48x48 wire set on the door axis, relay racks, lamps, switchboard, wire desk, call box, benches, Keeper runner and rug, oak parquet, green-and-gold wall row `FyGJFyGFGcwF`, windows 1 and 9; 12 x 16 kept; beds and Amos unchanged | As §5-§8; nothing builds before Vincent's yes on the previews |
| LH-2 | **red** (canon look) | The President on the wire set: a simple bust in the Keeper set's colours with a gold accent, after a Block News card; how he looks and whether he is named on screen | Draft bust as `wire_wall_pres`; speaker label "The President"; on-screen naming left to Story |
| LH-3 | yellow | Six townsfolk shelter in the Lantern House during the curfew (`lh_*` bodies: Odile, Wynne, Tobin and three "Resident" bodies with new kit looks), facing the set, reacting in Beat 7 by emote | Yes; Tobin included (Story may swap him) |
| LH-4 | yellow | Room size: keep 12 x 16 (A) or expand east to 14-16 wide for a separate wire hall (B) | A: 390 keeps the whole room on screen; no actor tiles move |
| LH-5 | green | All lines here are PLACEHOLDER for June; all art is draft for Pia | Ship nothing until both passes |
