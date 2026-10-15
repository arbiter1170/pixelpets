# B5 — Hearthmoor, Keeper House and Cobblecrest interiors: TOUCH UP

Self-contained packet (design repo is private; data pasted). See BUILDING_VARIETY.md (same folder) for per-building looks.

## Goal
D84: no enlarging. Give each room its own `skin` (HOUSE_SKINS: floor + wall face + baseboard) per BUILDING_VARIETY rows 1–5, 8, 9; add `house_floor_a/b` plank variants and the `wall_shadow` decal (art row 9); add a `window_light` floor decal under windows, rugs with `rug_border`, and props to reach ≥ 1 per 12 floor cells (place on floor cells; keep the door-to-every-NPC path open). `hm_home_up`, `hm_hq_f1/f2`, `cc_hall_in` are the thinnest (1–5 props).

## Audit (origin/main 8338122)
| id | size | top floor | props | people | verdict | problems |
|---|---|---|---|---|---|---|
| `hm_home_in` | 9x8 | '.' 78% | 8 | 0 | TOUCH UP | one floor tile 78% >70% (D88); under target 10x12 |
| `hm_home_up` | 9x8 | '.' 89% | 2 | 1 | TOUCH UP | one floor tile 89% >70% (D88); props 2 < 1/12 floor (2); under target 10x12 |
| `hm_lodge_in` | 11x9 | '.' 80% | 8 | 2 | TOUCH UP | one floor tile 80% >70% (D88); under target 10x12 |
| `hm_lantern_in` | 9x7 | '.' 86% | 5 | 0 | TOUCH UP | one floor tile 86% >70% (D88); under target 10x12 |
| `hm_rook_in` | 7x6 | '.' 94% | 2 | 1 | TOUCH UP | one floor tile 94% >70% (D88); under target 10x12 |
| `hm_hq_f1` | 9x8 | '.' 89% | 1 | 3 | TOUCH UP | one floor tile 89% >70% (D88); props 1 < 1/12 floor (3); under target 10x12 |
| `hm_hq_f2` | 9x8 | '.' 89% | 1 | 2 | TOUCH UP | one floor tile 89% >70% (D88); props 1 < 1/12 floor (3); under target 10x12 |
| `cc_lantern_in` | 9x7 | '.' 86% | 6 | 0 | TOUCH UP | one floor tile 86% >70% (D88); under target 10x12 |
| `cc_hall_in` | 11x13 | ':' 96% | 5 | 3 | TOUCH UP | one floor tile 96% >70% (D88); props 5 < 1/12 floor (5) |

## Target size
Keep current size (D81/D82/D84; detail only).

## Files to touch
`data/interiors.json`, `data/civic.json`, `data/cobblecrest.json` (`rooms`), `sprites.js`, mapdata.js.

## Acceptance criteria
- No size change; each room's floor/wall skin differs from every other room.
- Base floor ≤ 70 % after variants; ≥ 1 prop / 12 floor; wall-shadow row under every wall face.
- Arrival, exits, scenes (intro, starter, rest beds) unchanged.
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
(file `data/interiors.json`)
#### `hm_home_in` Your Home (9x8) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#..===..#
#^.===..#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `home_mat` warp (4,7) hearthmoor
- `home_stairs` warp (1,5) hm_home_up
- `home_bed` prop (1,2) bed
- `home_terminal` prop (3,2) pet_terminal
- `home_glowbox` prop (5,2) glowbox
- `home_bookshelf` prop (7,2) bookshelf
- `home_table` prop (7,5) table_small
- `home_mirror` prop (3,6) mirror
- `home_note` sign (5,6) 
- `home_note_kept` sign (5,6) 

(file `data/interiors.json`)
#### `hm_home_up` Your Home, upstairs (9x8) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#..===..#
#^......#
#.......#
#########
```
Objects (id kind x,y sprite/look):
- `home_stairs_down` warp (1,5) hm_home_in
- `mom` npc (5,3) mom
- `up_bed` prop (7,2) bed
- `up_shelf` prop (2,2) bookshelf
- `mom_wake_at` trigger (4,5) 

(file `data/interiors.json`)
#### `hm_lodge_in` Warden's Lodge (11x9) current grid (origin/main 8338122)
```
###########
#WWWWWWWWW#
#.........#
#.........#
#.........#
#..=====..#
#..=====..#
#.........#
#####m#####
```
Objects (id kind x,y sprite/look):
- `lodge_mat` warp (5,8) hearthmoor
- `ilse_lodge` npc (5,3) ilse
- `ilse_lodge_after` npc (5,3) ilse
- `lodge_hello` trigger (5,6) 
- `lodge_name` trigger (5,6) 
- `lodge_lantern` prop (1,2) wall_lantern
- `lodge_basket_e` prop (3,2) basket
- `lodge_basket_t` prop (5,2) basket
- `lodge_basket_b` prop (7,2) basket
- `lodge_empty_a` prop (3,2) basket_empty
- `lodge_empty_b` prop (5,2) basket_empty
- `lodge_empty_c` prop (7,2) basket_empty
- `lodge_ledger` prop (9,2) bookshelf

(file `data/interiors.json`)
#### `hm_lantern_in` Lantern House (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#..===..#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `lantern_mat` warp (4,6) hearthmoor
- `lantern_bed_a` prop (1,2) rest_bed
- `lantern_bed_b` prop (2,2) rest_bed
- `lantern_bed_c` prop (3,2) rest_bed
- `lantern_light` prop (5,2) floor_lantern
- `lantern_note` sign (7,2) 

(file `data/interiors.json`)
#### `hm_rook_in` Rook's House (7x6) current grid (origin/main 8338122)
```
#######
#WWWWW#
#.....#
#.....#
#.....#
###m###
```
Objects (id kind x,y sprite/look):
- `rook_mat` warp (3,5) hearthmoor
- `mrs_calloway` npc (1,3) calloway
- `rook_table` prop (4,2) table_small
- `rook_shelf` prop (5,2) bookshelf

(file `data/civic.json`)
#### `hm_hq_f1` Keeper House (9x8) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#..===..#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hq_out` warp (4,7) hearthmoor
- `hq_up` warp (7,3) hm_hq_f2
- `hq_stair_sign` sign (7,4) 
- `hq_bram` npc (2,3) officer
- `hq_mo` npc (5,4) clerk
- `hq_wynn` npc (2,5) clerk

(file `data/civic.json`)
#### `hm_hq_f2` Keeper House, upstairs (9x8) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#..===..#
#.......#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `hq_down` warp (7,3) hm_hq_f1
- `hq_radio_sign` sign (2,4) 
- `hq_lumen` npc (4,3) captain
- `hq_rue` npc (2,3) officer

(file `data/cobblecrest.json`)
#### `cc_lantern_in` Cobblecrest Lantern House (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#..===..#
#.......#
####m####
```
Objects (id kind x,y sprite/look):
- `cc_lantern_mat` warp (4,6) cobblecrest
- `cc_bed_a` prop (1,2) rest_bed
- `cc_bed_b` prop (2,2) rest_bed
- `cc_bed_c` prop (3,2) rest_bed
- `cc_lantern_light` prop (5,2) floor_lantern
- `cc_lamp_rack` prop (7,2) miner_lamps
- `cc_lantern_note` sign (7,4) 

(file `data/cobblecrest.json`)
#### `cc_hall_in` Cobblecrest Trial Hall (11x13) current grid (origin/main 8338122)
```
###########
#WWWWWWWWW#
#X:::::::X#
#X:::=:::X#
#XXXX:XXXX#
#:::::::::#
#:::::::::#
#XXXX:XXXX#
#:::::::::#
#:::::::::#
#:::::::::#
#::::=::::#
#####m#####
```
Objects (id kind x,y sprite/look):
- `cc_hall_mat` warp (5,12) cobblecrest
- `hale` npc (5,2) hale
- `h2_lamp_l` prop (3,2) wall_lantern
- `h2_cairn` prop (7,2) cairn
- `h2_seam_b` prop (5,4) seam_stone
- `h2_sweeper` trainer (1,6) 
- `h2_seam_a` prop (5,7) seam_stone
- `h2_builder` trainer (9,9) 
- `h2_sign` sign (1,11) 

