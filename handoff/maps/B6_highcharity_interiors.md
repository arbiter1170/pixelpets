# B6 — High Charity interiors (14 rooms): TOUCH UP

Self-contained packet (design repo is private; data pasted). See BUILDING_VARIETY.md (same folder) for per-building looks.

## Goal
Worst floor numbers in the game (94–99 % one tile, mostly 1 prop) and nine rooms share one 9×7 box. Keep sizes (D84), give each room its own skin and signature props per BUILDING_VARIETY rows 10–24. If a 9×7 room cannot reach 1 prop / 12 floor and stay walkable, that is fine at 9×7 (needs only 2–3 props); quality over count. Flag (don't do) any room that truly needs a resize — that is a REBUILD and needs Vincent.

## Audit (origin/main 8338122)
| id | size | top floor | props | people | verdict | problems |
|---|---|---|---|---|---|---|
| `hc_airport_in` | 9x7 | '.' 97% | 1 | 1 | TOUCH UP | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_command_in` | 9x7 | '.' 97% | 1 | 1 | TOUCH UP | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_barracks_in` | 9x7 | '.' 97% | 1 | 1 | TOUCH UP | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_marina_in` | 9x7 | '.' 97% | 1 | 1 | TOUCH UP | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_school_in` | 9x7 | '.' 97% | 1 | 1 | TOUCH UP | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_bank_in` | 9x7 | '.' 97% | 1 | 1 | TOUCH UP | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_gym_in` | 9x7 | '.' 97% | 1 | 1 | TOUCH UP | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_lantern_in` | 9x7 | '.' 97% | 5 | 0 | TOUCH UP | one floor tile 97% >70% (D88); under target 10x12 |
| `hc_church_in` | 11x11 | '.' 95% | 5 | 1 | TOUCH UP | one floor tile 95% >70% (D88); props 5 < 1/12 floor (6); under target 10x12 |
| `hc_hall_in` | 11x11 | '.' 99% | 5 | 6 | TOUCH UP | one floor tile 99% >70% (D88); props 5 < 1/12 floor (6); under target 10x12 |
| `hc_arena_in` | 11x9 | '.' 98% | 2 | 1 | TOUCH UP | one floor tile 98% >70% (D88); props 2 < 1/12 floor (4); under target 10x12 |
| `hc_apt_in` | 7x6 | '.' 94% | 1 | 1 | TOUCH UP | one floor tile 94% >70% (D88); props 1 < 1/12 floor (1); under target 10x12 |
| `hc_mall_1` | 11x11 | '.' 99% | 3 | 1 | TOUCH UP | one floor tile 99% >70% (D88); props 3 < 1/12 floor (6); under target 10x12 |
| `hc_mall_2` | 11x11 | '.' 99% | 2 | 1 | TOUCH UP | one floor tile 99% >70% (D88); props 2 < 1/12 floor (6); under target 10x12 |

## Target size
Keep current size (D81/D82/D84; detail only).

## Files to touch
`data/highcharity.json` (`rooms`), `sprites.js`, mapdata.js.

## Acceptance criteria
- No two of the 14 rooms share a floor+wall skin; each has its signature prop.
- Base floor ≤ 70 % after variants; prop rule met; all NPCs/scenes (hc_council, hc_apt_nap, etc.) reachable.
- bump_build `--check` passes; wording check clean; `npx playwright test` green.

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

## Current data
(file `data/highcharity.json`)
#### `hc_airport_in` Airship Field (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hc_airport_in_mat` warp (4,6) highcharity
- `hc_quin` npc (2,3) quin
- `hc_airship_in` prop (6,3) airship

(file `data/highcharity.json`)
#### `hc_command_in` Sky-Dock Command (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hc_command_in_mat` warp (4,6) highcharity
- `hc_lumen` npc (2,3) petra
- `hc_council_trig` trigger (2,4) 
- `hc_console` prop (6,2) skydock_console

(file `data/highcharity.json`)
#### `hc_barracks_in` Keeper Barracks (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hc_barracks_in_mat` warp (4,6) highcharity
- `hc_rowan` npc (2,3) sorrel
- `hc_banner` prop (6,2) barracks_banner

(file `data/highcharity.json`)
#### `hc_marina_in` Canal Marina (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hc_marina_in_mat` warp (4,6) highcharity
- `hc_ness` npc (2,3) ness
- `hc_buoy_in` prop (6,3) marina_buoy

(file `data/highcharity.json`)
#### `hc_school_in` Lantern School (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hc_school_in_mat` warp (4,6) highcharity
- `hc_mae` npc (2,3) nessa
- `hc_desk` prop (6,3) school_desk

(file `data/highcharity.json`)
#### `hc_bank_in` Civic Bank (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hc_bank_in_mat` warp (4,6) highcharity
- `hc_ivo` npc (2,3) teller
- `hc_counter` prop (5,2) bank_counter

(file `data/highcharity.json`)
#### `hc_gym_in` Trial Gym (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hc_gym_in_mat` warp (4,6) highcharity
- `hc_sol` npc (4,3) sol
- `hc_gym_note` sign (2,4) 

(file `data/highcharity.json`)
#### `hc_lantern_in` Lantern House (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hc_lantern_in_mat` warp (4,6) highcharity
- `hc_bed_a` prop (1,2) rest_bed
- `hc_bed_b` prop (2,2) rest_bed
- `hc_bed_c` prop (3,2) rest_bed
- `hc_lantern_light` prop (6,2) floor_lantern
- `hc_lantern_note` sign (6,4) 

(file `data/highcharity.json`)
#### `hc_church_in` High Charity Chapel (11x11) current grid (origin/main 8338122)
```
###########
#WWWWWWWWW#
#.........#
#.........#
#.........#
#....=....#
#....=....#
#....=....#
#.........#
#.........#
#####m#####
```
Objects (id kind x,y sprite/look):
- `hc_church_in_mat` warp (5,10) highcharity
- `hc_vesper` npc (4,3) ivo
- `hc_altar` prop (5,2) altar
- `hc_pew_w` prop (2,5) pew
- `hc_pew_e` prop (8,5) pew
- `hc_pew_w2` prop (2,7) pew
- `hc_pew_e2` prop (8,7) pew

(file `data/highcharity.json`)
#### `hc_hall_in` Event Hall (11x11) current grid (origin/main 8338122)
```
###########
#WWWWWWWWW#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#####m#####
```
Objects (id kind x,y sprite/look):
- `hc_hall_in_mat` warp (5,10) highcharity
- `hc_nim` npc (1,3) nim
- `hc_sera` npc (3,3) sera
- `hc_otto` npc (5,3) otto
- `hc_bramble` npc (7,3) bramble
- `hc_willa` npc (9,3) willa
- `hc_brin` npc (5,8) brin
- `hc_booth_l` prop (2,5) hall_booth
- `hc_booth_s` prop (4,5) hall_booth
- `hc_booth_c` prop (6,5) hall_booth
- `hc_booth_d` prop (8,5) hall_booth
- `hc_hall_note` sign (2,8) 

(file `data/highcharity.json`)
#### `hc_arena_in` Charity Arena (11x9) current grid (origin/main 8338122)
```
###########
#WWWWWWWWW#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#####m#####
```
Objects (id kind x,y sprite/look):
- `hc_arena_in_mat` warp (5,8) highcharity
- `hc_nia` npc (5,3) nia
- `hc_rope_l` prop (2,4) arena_rope
- `hc_rope_r` prop (8,4) arena_rope

(file `data/highcharity.json`)
#### `hc_apt_in` Your Room (7x6) current grid (origin/main 8338122)
```
#######
#WWWWW#
#.....#
#.....#
#.....#
###m###
```
Objects (id kind x,y sprite/look):
- `hc_apt_in_mat` warp (3,5) highcharity
- `hc_oren` npc (5,2) oren
- `hc_apt_bed` prop (1,2) apt_bed

(file `data/highcharity.json`)
#### `hc_mall_1` Charity Mall (11x11) current grid (origin/main 8338122)
```
###########
#WWWWWWWWW#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#####m#####
```
Objects (id kind x,y sprite/look):
- `hc_mall_1_mat` warp (5,10) highcharity
- `hc_tess` npc (2,4) tess
- `hc_mann_a` prop (2,6) mannequin
- `hc_mann_b` prop (8,6) mannequin
- `hc_mall_up` warp (9,5) hc_mall_2
- `hc_mall_stairs` sign (8,4) 

(file `data/highcharity.json`)
#### `hc_mall_2` Charity Mall, Upstairs (11x11) current grid (origin/main 8338122)
```
###########
#WWWWWWWWW#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#.........#
#####m#####
```
Objects (id kind x,y sprite/look):
- `hc_mall_down` warp (9,5) hc_mall_1
- `hc_mall_up_sign` sign (5,3) 
- `hc_mann_c` prop (3,4) mannequin
- `hc_penn` npc (5,6) willa

