# B2 — RegenX floors rx_f1–rx_f3: EXPAND 18×12 → 14×22

Self-contained packet (design repo is private; data pasted). See BUILDING_VARIETY.md (same folder) for per-building looks.

## Goal
Apply the B1 pattern to the other three RegenX rooms (D83: keep four rooms, make each bigger; D85 lab target 14×22). Keep every object id, flag and warp id; move coords only. Each floor gets its own accent so they don't read as copies:
- `rx_f1` Lobby: reception desk, waiting benches, plant-free white planters, visitor sign-in screen, guide line from door to lift/stairs; floor accent `lab_floor` + mint inlay.
- `rx_f2` Focus Wing: rows of quiet booths (designed row), a whiteboard, sound panels on wall face; accent pale blue stripe.
- `rx_f3` Records: shelving runs (designed row), a sorting table, file carts, a dim archive lamp; accent amber floor stripe.
Zones per room: entry (south, rows 17–20), work floor (rows 9–16), feature wall (rows 5–7), the stair up to the next floor (north). Stairs: arrival at the south mat, stairs up at the north wall, so the lab reads as a climb. Update the matching arrival coords on the floor below/above (e.g. `rx2_up` lands on rx_f3's new south mat, `rx4_down` targets rx_f3's new north stair).

## Audit (origin/main 8338122)
| id | size | top floor | props | people | verdict | problems |
|---|---|---|---|---|---|---|
| `rx_f1` | 18x12 | '.' 85% | 2 | 2 | EXPAND | one floor tile 85% >70% (D88); props 2 < 1/12 floor (12); under target 14x20 |
| `rx_f2` | 18x12 | '.' 88% | 5 | 3 | EXPAND | one floor tile 88% >70% (D88); props 5 < 1/12 floor (12); under target 14x20 |
| `rx_f3` | 18x12 | '.' 83% | 5 | 1 | EXPAND | one floor tile 83% >70% (D88); props 5 < 1/12 floor (12); under target 14x20 |

## Target size
14×22 (lab typical; min 14×20).

## Files to touch
`data/heights.json` (rx_f1–f3 grids/objs/safe, warps between floors and `ht_lab` arrival), `sprites.js` (any new lab props, accent tiles), regenerated `data/mapdata.js`, tests.

## Acceptance criteria
- Each room 14×20 to 14×22, BFS-walkable from arrival to every person, talkable prop and both stairs.
- Base floor tile ≤ 70 % after variants; ≥ 1 prop / 12 walkable cells; ≥ 4 decals per screen.
- All old object ids present; old saves snap to `safe`.
- The three rooms are visibly different (accent, signature props).
- Requires B1 merged (E1/E2/E4/E5).
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
(file `data/heights.json`)
#### `rx_f1` RegenX Lobby (18x12) current grid (origin/main 8338122)
```
##################
#WWWWWWWWWWWWWWWW#
#................#
#..=..........=..#
#..=..........=..#
#................#
#....========....#
#....========....#
#................#
#................#
#........m.......#
##################
```
Objects (id kind x,y sprite/look):
- `rx1_out` warp (9,10) fb_heights
- `rx1_up` door (9,3) rx_f2
- `rx1_in` trigger (9,8) 
- `rx_nia` npc (4,6) nia
- `rx_wardens` trainer (13,6) 
- `rx1_desk` prop (3,2) rx_desk
- `rx_f1_plaque` sign (15,4) 

(file `data/heights.json`)
#### `rx_f2` RegenX Focus Wing (18x12) current grid (origin/main 8338122)
```
##################
#WWWWWWWWWWWWWWWW#
#................#
#..====....====..#
#..====....====..#
#................#
#................#
#................#
#................#
#................#
#........m.......#
##################
```
Objects (id kind x,y sprite/look):
- `rx2_down` warp (9,10) rx_f1
- `rx2_up` door (14,3) rx_f3
- `rx_cal` npc (5,6) cal
- `rx_ivo` npc (4,4) ivo
- `rx_techs` trainer (12,7) 
- `rx2_heal` pickup (7,8) 
- `rx2_bench_a` prop (3,2) lab_bench
- `rx2_bench_b` prop (11,2) lab_bench
- `rx2_rack` prop (15,2) rx_rack
- `rx_f2_plaque` sign (2,6) 

(file `data/heights.json`)
#### `rx_f3` RegenX Records (18x12) current grid (origin/main 8338122)
```
##################
#WWWWWWWWWWWWWWWW#
#................#
#................#
#................#
#..============..#
#..============..#
#................#
#................#
#................#
#........m.......#
##################
```
Objects (id kind x,y sprite/look):
- `rx3_down` warp (9,10) rx_f2
- `rx3_up` door (14,3) rx_f4
- `rx3_term` trigger (8,5) 
- `rx_records` trainer (12,6) 
- `rx3_heal` pickup (6,8) 
- `rx3_shelf_a` prop (3,2) rx_shelf
- `rx3_shelf_b` prop (6,2) rx_shelf
- `rx3_screen` prop (11,2) rx_terminal
- `rx_f3_plaque` sign (2,6) 

