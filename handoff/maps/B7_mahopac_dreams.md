# B7 — Mahopac observatory + dream rooms: TOUCH UP

Self-contained packet (design repo is private; data pasted). See BUILDING_VARIETY.md (same folder) for per-building looks.

## Goal
Small story rooms; keep size. Observatory: dome-ribbed wall, star-map floor, telescope, desk. Dreams are memory scenes: each gets its own soft palette skin (2004: cool blue-grey; party: warm yellow with streamers — already 60 %, add decals only; drive-through: night asphalt with painted lines + a menu board). Use only original, generic objects; no real brands or logos.

## Audit (origin/main 8338122)
| id | size | top floor | props | people | verdict | problems |
|---|---|---|---|---|---|---|
| `mahopac_obs` | 9x7 | '.' 100% | 1 | 0 | TOUCH UP | one floor tile 100% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `dream_2004` | 9x8 | '.' 97% | 2 | 0 | TOUCH UP | one floor tile 97% >70% (D88); props 2 < 1/12 floor (2); under target 10x12 |
| `dream_party` | 11x8 | '.' 60% | 5 | 0 | TOUCH UP | under target 10x12 |
| `dream_drive` | 9x7 | '.' 100% | 1 | 1 | TOUCH UP | one floor tile 100% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |

## Target size
Keep current size (D81/D82/D84; detail only).

## Files to touch
`data/mahopac.json`, `sprites.js`, mapdata.js.

## Acceptance criteria
- Base floor ≤ 70 %; scenes and warps unchanged; no brand names or logos anywhere.
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
(file `data/mahopac.json`)
#### `mahopac_obs` Breckenridge Observatory (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
####.####
```
Objects (id kind x,y sprite/look):
- `obs_out` warp (4,6) mahopac
- `obs_scope` prop (4,2) telescope

(file `data/mahopac.json`)
#### `dream_2004` Dream: 2004 (9x8) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#...=...#
#.......#
#.......#
#########
```
Objects (id kind x,y sprite/look):
- `pop_toy` prop (3,3) pop_toy
- `dream_toy_sign` sign (7,2) 

(file `data/mahopac.json`)
#### `dream_party` Dream: seventh birthday (11x8) current grid (origin/main 8338122)
```
###########
#WWWWWWWWW#
#ppppppppp#
#ppppppppp#
#.........#
#.........#
#.........#
###########
```
Objects (id kind x,y sprite/look):
- `pins` prop (5,3) pins
- `balloon_red` prop (2,5) balloon_r
- `balloon_yellow` prop (5,5) balloon_y
- `balloon_blue` prop (8,5) balloon_c
- `dream_party_sign` sign (1,4) 

(file `data/mahopac.json`)
#### `dream_drive` Dream: the drive-through (9x7) current grid (origin/main 8338122)
```
#########
#WWWWWWW#
#.......#
#.......#
#.......#
#.......#
#########
```
Objects (id kind x,y sprite/look):
- `dream_dad` npc (2,3) dad
- `fry_tray` prop (6,3) fry_tray
- `dream_dad_at` trigger (5,3) 

