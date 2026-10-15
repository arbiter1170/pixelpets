# B1 — rx_f4 "The Arbiter Bay" pilot: EXPAND 18×12 → 14×22 (priority 1)

**Verdict:** EXPAND (decision D86: new grid, same ids/flags/objects; D83 bigger rooms not more floors; D88 70 % cap; D89 optional night tech). Self-contained: the design repo is private, everything needed is pasted here.

## Goal
The bay today is a bare 18×12 box (99 % one floor tile, 5 props). Make it a 14×22 portrait room (one 390 screen tall, short scroll at 320) with 5 zones, ~30 props, decals and floor variants, and ship the engine pieces every later batch reuses (E2, E1, E4, E5).

## Current state
Lives in `data/heights.json` → `maps.rx_f4`: fields `name, kind:"interior", outdoor:"fb_heights", backdrop:"town", w, h, spawns:null, zones:[], safe{x,y}, grid[], objs[], skin:"lab"`. Lab skin is `LAB_SKIN` in `sprites.js`: `{"remap":{"#":"lab_wall","W":"lab_wall_face","W2":"lab_wall_win",".":"lab_floor","=":"lab_runner","m":"lab_mat"},"override":{"rx_f4":{".":"lab_floor_bay"}}}`.

(file `data/heights.json`)
#### `rx_f4` The Arbiter Bay (18x12) current grid (origin/main 8338122)
```
##################
#WWW##########WWW#
#................#
#................#
#................#
#................#
#................#
#................#
#................#
#................#
#........m.......#
##################
```
Objects (id kind x,y sprite/look):
- `rx4_down` warp (9,10) rx_f3
- `rx_arbiter` prop (9,4) arbiter
- `rx_quinn` trainer (9,6) 
- `rx_bitlet` wild (6,5) 
- `rx4_side` prop (14,4) rx_terminal
- `rx_f4_plaque` sign (2,6) 
- `rx4_tank_a` prop (7,2) lab_tank
- `rx4_tank_b` prop (11,2) lab_tank


## Target: 14×22, zones
1. Airlock/decon (rows 17–20): exit mat, glass partition with 2-tile gap, a scanner each side, plaque.
2. Work floor (rows 9–16): 3-unit terminal bank on west wall, two workbenches, four tanks east, drains/scuffs, two sample shelves at south corners.
3. Cold wall (east, rows 5–7): three cold cabinets, side screen in front.
4. Arbiter dais (rows 2–4): cradle on a raised dais, a tank either side, cables to drains, two displays (a mint sprout under glass).
5. Off-limits (NE): locked staff door on the wall face, off-limits sign, hazard floor (not walkable).

## A. The pilot map

### A1. Size and grid (`w: 14, h: 22`)

```
   x 01234567890123
 0 ##############
 1 #WVWWWWWWWWVL#
 2 #.,..DDDD..xx#
 3 #..,.DDDD..xx#
 4 #~~~~DDDD~~~~#
 5 #o....||....o#
 6 #.....||.....#
 7 #..,..||..,..#
 8 #-----++-----#
 9 #.....||.....#
10 #.,...||...,.#
11 #.....||.....#
12 #..o..||..o..#
13 #.....||.....#
14 #-----++-----#
15 #.,...||.....#
16 #.....||..,..#
17 #gggg.||.gggg#
18 #.....||.....#
19 #..,..||..,..#
20 #.....mm.....#
21 ##############
```

### A2. Legend (map char → lab tile, walkable)

Add the new chars to `LAB_SKIN.remap` (E3 lookup, already built). All tiles are 16×16 PAL grids in `pilot.tiles` (new) or the lab skin (existing).

| Char | Tile | Walk |
|---|---|---|
| `#` | `lab_wall` | no |
| `W` | `lab_wall_face` | no |
| `V` | `lab_wall_win` | no |
| `L` | `lab_door_locked` | no |
| `.` | `lab_floor_bay` | yes |
| `,` | `lab_floor_scuff` | yes |
| `~` | `lab_floor_cable` | yes |
| `o` | `lab_floor_drain` | yes |
| `|` | `lab_guide_v` | yes |
| `-` | `lab_guide_h` | yes |
| `+` | `lab_guide_x` | yes |
| `x` | `lab_hazard` | no |
| `D` | `lab_dais` | yes |
| `g` | `lab_glass` | no |
| `m` | `lab_mat` | yes |

`lab_dais` is a raised floor (walkable). `lab_hazard` is the striped floor in front of the staff door and is **not** walkable. `lab_glass` is the decon partition (2-tile gap at x 5–8 on row 17, which holds the scanners at x 5 and 8, leaving x 6–7 open).

### A3. Objects (`objs`, all coords are tile x, y)

Existing ids (keep, move):

| id | kind | was | now | notes |
|---|---|---|---|---|
| `rx4_down` | warp | (9,10) | (6,20) | to `rx_f3` (14,4) up; add twin `rx4_down_b` at (7,20), same target |
| `rx_arbiter` | prop `arbiter` | (9,4) | (6,3) | on the dais; lines unchanged |
| `rx_quinn` | trainer | (9,6) | (8,7) | beside the aisle, aisle x 6–7 stays open |
| `rx_bitlet` | wild `byte/0` | (6,5) | (4,4) | by the cradle; `when ["!story.rx_bitlet"]`, scene unchanged |
| `rx4_side` | prop `rx_terminal` | (14,4) | (9,6) | side screen in front of the cold wall |
| `rx_f4_plaque` | sign (sprite `lab_plaque`) | (2,6) | (4,19) | text unchanged |
| `rx4_tank_a` | prop `lab_tank` | (7,2) | (5,2) | dais left |
| `rx4_tank_b` | prop `lab_tank` | (11,2) | (8,2) | dais right |

New objects (all props are solid, one tile):

| id | kind / sprite | at | lines (≤ 110 chars) |
|---|---|---|---|
| `rx4_display_a`, `rx4_display_b` | prop `lab_display` | (2,2), (3,2) | "A mint sprout under glass. The only plant up here." |
| `rx4_offlimits` | wall decal `lab_sign_offlimits` | (11,1) | none (drawn on the wall face) |
| `rx4_cold_a/b/c` | prop `lab_cold` | (12,5), (12,6), (12,7) | "Cold storage. Labels in a neat hand. Nothing loose." |
| `rx4_bank_a/b/c` | prop `lab_terminal_bank` | (1,9), (1,10), (1,11) | "Rows of readings. The line rises, slowly, then holds." |
| `rx4_bench_a/b` | prop `lab_workbench` | (3,12), (4,12) | "Tools in outlines on the bench. Every one is back in place." |
| `rx4_tank_c/d/e/f` | prop `lab_tank` | (10,10), (11,10), (10,12), (11,12) | "The tank hums. Mint, still, very clean." (same as a/b) |
| `rx4_shelf_w`, `rx4_shelf_e` | prop `lab_shelf_samples` | (1,15), (12,15) | "Sample racks. Each vial has a date and a name." |
| `rx4_scanner_w`, `rx4_scanner_e` | prop `lab_scanner` | (5,17), (8,17) | "The scanner glows mint as you pass. It finds nothing." |
| `rx4_staff_door` | sign (door drawn by tile `L` at (12,1)) | (12,3) | "Staff only. The keypad blinks red." |
| `rx4_tech` | npc, look `rx_tech`, name "Night Tech" | (2,12) | see A5 |

The staff door is **locked for good in this build**: it is not a warp, and nothing opens it. The keeper reads it by facing up from (12,4) onto the hazard strip; `rx4_staff_door` sits on (12,3) so the bump talks (talk on a solid tile, same as signs). The deny line is placeholder copy (D-later).

### A4. Walk rules

- Solid: `# W V L x g` tiles, every prop, every person. Everything else walks, decals included.
- Arrival: `rx_f3` → `rx3_up` changes `tx,ty` from (9,9) to **(6,19)**, facing up. `safe` becomes **(6,19)**.
- Path flow: mat (6–7,20) → decon gap (6–7,17) → aisle x 6–7 north → corridors rows 8 and 14 → side bays → dais foot (row 4). Every person and talkable prop has a walkable neighbour (design BFS passes; 216 walkable cells).
- Base tile `lab_floor_bay` is 60 % of walkable cells (cap 70 %, D88). With E5 the cap is measured after variants.

### A5. People

| Spot | Who | id | Notes |
|---|---|---|---|
| (4,4) | Bitlet | `rx_bitlet` | unchanged scene and flag |
| (8,7) | Quinn | `rx_quinn` | unchanged trainer |
| (2,12) | night tech | `rx4_tech` | new, optional, no battle, faces the bank (left) until talked to |
| (6,19) | keeper | (arrival) | from Records |

Night tech lines (`lines` keyed by flag, first match wins; all ≤ 110 chars):
- `story.heights_done`: "Quiet shift. The hum kept the same pace all night. I wrote that down too."
- `story.saw_arbiter`: "You saw it, then. I just log the numbers. Slow, steady, and nobody can name it."
- `else`: "Night shift. I watch the readings. Mind the tanks; they hum, but they are harmless."

### A6. Flags

No new story flags. Uses `story.rx_f3` (door), `story.rx_bitlet`, `story.saw_arbiter`, `story.heights_done` as today. Talking to `rx4_tech` adds the contact via the existing `noteContact` (D80). Save positions in `rx_f4` from the old 18×12 grid: on load, if the saved tile is solid or out of bounds, snap to `safe` (6,19).

### A7. Reduced-motion tank

`lab_tank` is two frames at 600 ms (`lab_tank.ms = 600`). Under `prefers-reduced-motion: reduce` every tank holds frame 0 (the prop draw path already does this). The six tanks share one clock, so they never strobe out of step. No screen shake or flash in this room.

## B. Engine pieces (all S)

| Id | Piece | Cost | Acceptance |
|---|---|---|---|
| E1 | Interior camera | S | In an interior bigger than the view, the camera follows the keeper and clamps at all four edges (no void shown); interiors smaller than the view stay centred. `rx_f4` at 14×22 scrolls vertically at 320×568 and 390×844 and never shows outside the grid. Uses the existing `walk.cam` math; add a test. |
| E2 | Bigger grids | S | No interior size cap in data, `tools/gen_mapdata.py`, validators or tests; a 14×22 (and a 30×30 test map) loads, walks and saves. The 24×20 limit applies only to the canvas view. Old saves resolve per A6. |
| E5 | Seeded tile variants | S | Variant = hash(map id, x, y) with weights per base tile (e.g. `lab_floor_bay` → `lab_floor_scuff`); same map always draws the same; nothing saved. Hand-placed chars in the grid win over variants. After variants the base tile is ≤ 70 % of walkable cells (D88); a check fails the build otherwise. |
| E4 | Decal layer | S | A walkable layer drawn after the floor and before props/people: cables (`~`), drains (`o`), guide lines (`| - +`). Decals never block, never change walk rules, have no animation (reduced-motion safe). Either a second grid or decal chars in the main grid resolved to floor + overlay. |

Build order: E2 → E1 → E4 → E5 → map data (A) → tests.


## New art (pasted 16×16 PAL grids; `.` transparent, no outline)
Add to `sprites.js` as tiles/props named exactly as below. Also needed but not drawn yet: `lab_mat` exists; `rx_tech` look for the Night Tech (draw an original lab-coat NPC using the existing look format and skin tones 1–6).
`lab_floor_scuff`
```
hhhhhhhhhhhhhhhh
hwwwwwwwhwwwwwww
hwsswwwwhwwwwwww
hwwwwwwwhwwwwhww
hwwwwwwwhwwwwwww
hwwwhhwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hhhhhhhhhhhhhhhh
hwwwwwwwhwwwwwww
hwwwwwwwhwsswwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwhwww
hwwhwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
```
`lab_floor_cable`
```
hhhhhhhhhhhhhhhh
hwwwwwwwhwwwwwww
hwsswwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
dmddddmddddmdddd
kkkkkkkkkkkkkkkk
hwwwwwwwhwwwwwww
hwwwwwwwhwsswwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
```
`lab_floor_drain`
```
hhhhhhhhhhhhhhhh
hwwwwwwwhwwwwwww
hwsswwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwmmmmmmmmwwww
hwwwmhdddddmwwww
hwwwmdkkkkdmwwww
hwwwmddddddmwwww
hhhhmdkkkkdmhhhh
hwwwmddddddmwwww
hwwwmddddddmwwww
hwwwmmmmmmmmwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
```
`lab_guide_v`
```
hhhhhhhllhhhhhhh
hwwwwwhslhwwwwww
hwsswwhllhwwwwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
hwwwwwhslhwwwwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
hhhhhhhllhhhhhhh
hwwwwwhslhwwwwww
hwwwwwhllhsswwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
hwwwwwhslhwwwwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
```
`lab_guide_h`
```
hhhhhhhhhhhhhhhh
hwwwwwwwhwwwwwww
hwsswwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hhhhhhhhhhhhhhhh
lslllslllslllsll
llllllllllllllll
hhhhhhhhhhhhhhhh
hwwwwwwwhwsswwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
hwwwwwwwhwwwwwww
```
`lab_guide_x`
```
hhhhhhhllhhhhhhh
hwwwwwhllhwwwwww
hwsswwhllhwwwwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
hhhhhhsssshhhhhh
llllllswwsllllll
llllllswwsllllll
hhhhhhsssshhhhhh
hwwwwwhllhsswwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
hwwwwwhllhwwwwww
```
`lab_hazard`
```
yyyykkkkyyyykkkk
yyykkkkyyyykkkky
yykkkkyyyykkkkyy
ykkkkyyyykkkkyyy
kkkkyyyykkkkyyyy
kkkyyyykkkkyyyyk
kkyyyykkkkyyyykk
kyyyykkkkyyyykkk
yyyykkkkyyyykkkk
yyykkkkyyyykkkky
yykkkkyyyykkkkyy
ykkkkyyyykkkkyyy
kkkkyyyykkkkyyyy
kkkyyyykkkkyyyyk
kkyyyykkkkyyyykk
kyyyykkkkyyyykkk
```
`lab_dais`
```
mmmmmmmmmmmmmmmm
mwwwwwwwwwwwwwwm
mhhhhhhhhhhhhhhm
mhhhhhhhhhhhhhhm
mhhhlhhhhhhlhhhm
mhhhhhhhhhhhhhhm
mhhhhhhhhhhhhhhm
mhhhhhhsshhhhhhm
mhhhhhhsshhhhhhm
mhhhhhhhhhhhhhhm
mhhhhhhhhhhhhhhm
mhhhlhhhhhhlhhhm
mhhhhhhhhhhhhhhm
mhhhhhhhhhhhhhhm
mhhhhhhhhhhhhhhm
mmmmmmmmmmmmmmmm
```
`lab_glass`
```
hhhhhhhhhhhhhhhh
hwwwwwwwhwwwwwww
mmmmmmmmmmmmmmmm
mssssssssssssssm
msswsssssswssssm
mssswsssssswsssm
msssswsssssssssm
mssssssssssssssm
mssssssssssssssm
mssssssssssssssm
mssssssssssssssm
mssssssssssssssm
mssssssssssssssm
mmmmmmmmmmmmmmmm
llllllllllllllll
hwwwwwwwhwwwwwww
```
`lab_door_locked`
```
wwwwwwwhwwwwwwww
wwwmmmmmmmmmmwww
wwwmhhhmmhhhmwww
wwwmhhhmmhhhmwww
wwwmhhhmmhhhmwww
wwwmhhhmmhhhmwww
wwwmrrrmmrrrmddw
wwwmrrrmmrrrmrdw
wwwmhhhmmhhhmdlw
wwwmhhhmmhhhmddw
wwwmhhhmmhhhmwww
wwwmhhhmmhhhmwww
hhhmhhhmmhhhmhhh
lllmhhhmmhhhmlll
hhhmhhhmmhhhmhhh
dddddddddddddddd
```
`lab_terminal_bank`
```
................
................
.mmmmmmmmmmmmmm.
.mddddddddddddm.
.mkskdkskdkskdm.
.mcccdllldcccdm.
.mcccdllldcccdm.
.mkkkdkkkdkkkdm.
.mddddddddddddm.
.mhwhwhwhwhwhhm.
.mhhhhhhhhhhhhm.
.mdlddddddddrdm.
.mkkkkkkkkkkkkm.
.mmmmmmmmmmmmmm.
.kkkkkkkkkkkkkk.
................
```
`lab_workbench`
```
................
..dddd..h.......
..dscd..w.ww....
..dccd..w.ll....
..dddd..l.llkkk.
wwwwwwwwwwwwwwww
wwwwwwwwwwwwwwww
wwwwwwwwwwwwwwww
hhhhhhhhhhhhhhhh
.mm..........mm.
.mm..........mm.
.mmhhhhhhhhhhmm.
.mm..........mm.
.mm..........mm.
.mm..........mm.
................
```
`lab_cold`
```
mmmcmmmmmmmmcmmm
mhddddddddddddhm
mhdwwwwwwwwwwdhm
mhdssssssssmsdhm
mhdscscscssmsdhm
mhdsbsbsbssssdhm
mhddddddddddddhm
mhhhhhhhhhhhhhhm
mhddddddddddddhm
mhdwwwwwwwwwwdhm
mhdssssssssmsdhm
mhdscscscssmsdhm
mhdsbsbsbssssdhm
mhddddddddddddhm
mhhhhhhhhhhhhhhm
mmmmmmmmmmmmmmmm
```
`lab_shelf_samples`
```
.mmmmmmmmmmmmmm.
.m.wc..wl..wc.m.
.m.cc..ll..cc.m.
.m.cc..ll..cc.m.
.mhhhhhhhhhhhhm.
.m............m.
.m.wl..ws..wl.m.
.m.ll..ss..ll.m.
.m.ll..ss..ll.m.
.mhhhhhhhhhhhhm.
.m............m.
.m.wc..ww..ww.m.
.m.cc..ww..ww.m.
.m.cc..ww..ww.m.
.mhhhhhhhhhhhhm.
.mmmmmmmmmmmmmm.
```
`lab_display`
```
................
................
......ssss......
.....swssss.....
.....wslsss.....
....sslsslss....
....sgsggsss....
....sssggsgs....
....sssggsss....
....sssggsss....
.....ssggss.....
.....ssggss.....
....hhhhhhhh....
...mmmmmmmmmm...
...mmmmmmmmmm...
...mmmmmmmmmm...
```
`lab_sign_offlimits`
```
................
................
................
..kkkkkkkkkkkk..
..krrrrrrrrrrk..
..krrrrrrrrrrk..
..kwwwwwwwwwwk..
..kwddddddddwk..
..kwwwwwwwwwwk..
..kwddddddwwwk..
..kwwwwwwwwwwk..
..kkkkkkkkkkkk..
................
................
................
................
```
`lab_plaque`
```
................
................
................
................
...mmmmmmmmmm...
...mhhhhhhhhm...
...mhddddddhm...
...mhhhhhhhhm...
...mhddddhhhm...
...mhhhhhhhhm...
...mmmmmmmmmm...
.......mm.......
.......mm.......
.......mm.......
.......mm.......
.......mm.......
```
`lab_scanner`
```
................
................
................
......mmmm......
......mlmm......
......mmmm......
...wwwwwwwwww...
...hhhhhhhhhh...
...hhsccccchh...
...hhcccccchh...
...hhhhhhhhhh...
...hhhhhhhhhh...
..dddddddddddd..
..dddddddddddd..
..dddddddddddd..
................
```

## Files to touch
`data/heights.json` (rx_f4 grid/objs/safe; rx_f3 `rx3_up` arrival → (6,19)), `sprites.js` (tiles, props, `LAB_SKIN.remap` new chars, `rx_tech` look), `game.js` (E1 camera clamp, E4 decal layer, E5 seeded variants + 70 % check, old-save snap), `tools/gen_mapdata.py` only if a size cap exists, `tests/` (14×22 and 30×30 camera/walk tests), regenerated `data/mapdata.js`, `index.html`/`version.json` via bump_build.

## Acceptance criteria

- From Records (`rx_f3`), the stair door lands at (6,19) facing up; the mat at (6,20)/(7,20) goes back to `rx_f3` (14,4).
- 320×568 and 390×844: camera follows, clamps at top and bottom, no black void; whole width visible.
- Walk the aisle from mat to dais foot; both corridors (rows 8, 14) reach the side bays.
- Every prop, the two scanners, the glass and the hazard strip block; decals (cables, drains, guide lines) walk.
- Talk to: Arbiter (lines per flag unchanged), side screen, plaque, displays, cold cabinets, terminal bank, benches, all six tanks, shelves, scanners: each shows its line.
- Staff door: facing up from (12,4) shows "Staff only. The keypad blinks red."; it never opens.
- Quinn battle still starts and the win flag is unchanged; Bitlet befriend still sets `story.rx_bitlet` and the scene plays.
- Night tech at (2,12): three lines by flag, each ≤ 110 chars; no battle; appears in Contacts after talking.
- Reduced motion on: all tanks still on frame 0; off: tanks animate in step.
- Floor variants look the same after reload and on a second device; base tile ≤ 70 % of walkable cells.
- A save made in the old 18×12 bay loads to a walkable tile (snaps to (6,19) if needed).
- No other map changes size or look (other RegenX floors keep their grids; skin only).
- Wording: no franchise words in new lines.

- Build stamp check passes; wording check clean; mapdata.js regenerated.

## Hard rules (apply to every packet)
1. **Original art only.** 16×16 tiles drawn as text grids using PAL keys from `sprites.js` (`k p r o y l g t n b c s w h m d`, skin tones `1`–`6` only for people); `.` = transparent; **no black outline** around sprites/tiles. No likeness to any existing game franchise (no copied creatures, buildings, UI, logos, layouts).
2. **Save keys additive only.** Never rename or remove a save key, map id, object id or story flag. Old saves must load; if a saved tile becomes solid/out of bounds, snap to the map's `safe` spot.
3. **One PR per batch**, from a branch named `maps/<batch>` (e.g. `maps/b1-rx-f4`). Never push to `main`; Vincent merges. **No force-push**, no rebasing pushed commits.
4. **Build stamp:** run `python3 tools/bump_build.py` before every commit; `python3 tools/bump_build.py --check` must pass.
5. **Map data:** edit the JSON in `data/*.json`, then run `python3 tools/gen_mapdata.py` to regenerate `data/mapdata.js` (never hand-edit mapdata.js).
6. **Wording check:** no franchise-like wording; never name the classic egg-shaped virtual-pet toy brand; creatures are **Walkling(s)**; region Amberwild, energy is **glow**, currency is **Acorns**. Lines ≤ 110 chars. Run the wording grep in README §5 on your diff.
7. **Design limits (settled):** D81 Act 1 towns are not reshaped (detail only); D82 portrait size only for new routes; D83 RegenX keeps 4 rooms (bigger, not more); D84 existing house interiors are enlarged only when rebuilt for a story beat; D85 size targets apply to new/rebuilt maps; D88 no single floor tile over 70 % of walkable cells (measured after seeded variants).
8. **Prefer TOUCH UP / EXPAND and graphic upgrades; REBUILD only when nothing else works.** No two buildings may look identical (see BUILDING_VARIETY.md).
9. No QA pass required (Vincent); still run the existing test suite (`npx playwright test`) and keep it green.

## Detail standard (from the private design spec, pasted)
- Props: ≥ 1 prop per 12 walkable floor tiles indoors; ≥ 6 props per screen. A prop = anything drawn on the floor (furniture, machines, signs, plants, crates, pickups).
- Landmarks: ≥ 3 per town (one nameable: well, statue, big tree, tower); one every 16 tiles of route.
- Floor variety: no floor tile > 70 % of walkable cells; each floor ≥ 2 variants (scuff/crack/stain/glint) picked by seeded hash(map id, x, y); hand-placed grid chars win.
- Decals: ≥ 4 per screen (cables, drains, guide lines, rugs, leaves, puddles); walkable, drawn between floor and props, never animated.
- Edges: baseboard / wall-shadow row under every wall face; rug borders; grass-to-path edge tiles; water/cliff edges never end on a plain square.
- Reuse: one prop id ≤ 4 per screen (except a designed row); no run > 6 identical tiles in a line without a variant/decal.
- View: 10×17.75 tiles at 320×568, 12.2×26.4 at 390×844 (32 CSS px tiles).
- Size targets (new/rebuilt only, w×h min/typical/max): interior 10×12 / 12×16 / 16×24; lab 14×20 / 14×22 / 20×30; dungeon 14×20 / 16×26 / 24×36; town 32×36 / 40×40 / 64×48; route 24×48 / 24×64 / 48×80.

## Engine pieces referenced (build in B1, reuse after)
E1 interior camera follows/clamps on maps bigger than view · E2 no size cap in data/tools/tests · E3 per-map skin (`LAB_SKIN`-style remap, exists) · E4 walkable decal layer · E5 seeded floor variants + 70 % check · E7 edge autotiling (wall shadow, path edges) · E8 animated props hold frame 0 under reduced motion · E11 (new, B4) per-building skin: extend the existing map field `roofs: {name:{x0,y0,x1,y1,col}}` additively with `wall`, `door`, `win`, `trim`, `shape` keys.
