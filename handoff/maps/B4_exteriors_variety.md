# B4 — Building exteriors + outdoor detail (towns, routes): TOUCH UP

Self-contained packet (design repo is private; data pasted). See BUILDING_VARIETY.md (same folder) for per-building looks.

## Goal
Two goals. (1) **No two buildings alike** — implement E11 (extend `roofs` entries with `roof, wall, door, win, trim` keys, additive; faction trim from `factionOfMap()` still draws on top) and give every building its exterior from BUILDING_VARIETY.md (rows 1–27). (2) **Outdoor detail without reshaping** (D81 towns, D82 routes keep their size): grass variants `grass_b`, `grass_c`, `flower_patch` via E5 seeds; path edge tiles `path_edge_n/s/e/w` + 4 corners (E7 autotile); landmarks — Hearthmoor lantern post, Fernbrook well, Cobblecrest statue, Mahopac signal mast (32×32 each, original); routes get a landmark every 16 tiles (big tree, stone marker, footbridge, signpost); decals (puddle, leaf_litter). Mahopac (87 % grass, 1 prop) and Fernbrook Heights (88 % grass, 5 props) get the heaviest pass: fences, rocks, flowerbeds, the `regenx_facade` 32×32 on fb_heights.

## Audit (origin/main 8338122)
| id | size | top floor | props | people | verdict | problems |
|---|---|---|---|---|---|---|
| `hearthmoor` | 24x20 | 'g' 65% | 3 | 3 | TOUCH UP | only 3 props; under target 32x36 |
| `fernbrook` | 32x20 | 'g' 51% | 7 | 6 | TOUCH UP | under target 32x36 |
| `cobblecrest` | 32x20 | 'g' 63% | 10 | 7 | TOUCH UP | under target 32x36 |
| `highcharity` | 64x40 | 'g' 61% | 19 | 4 | OK | - |
| `mahopac` | 20x16 | 'g' 87% | 1 | 3 | TOUCH UP | one floor tile 87% >70% (D88); only 1 props; under target 32x36 |
| `route1` | 48x20 | 'g' 64% | 6 | 3 | TOUCH UP | under target 24x48 |
| `route2` | 48x20 | 'g' 53% | 7 | 6 | TOUCH UP | under target 24x48 |
| `route2_glen` | 24x20 | 'g' 65% | 8 | 2 | TOUCH UP | under target 24x48 |
| `proto` | 24x20 | 'g' 54% | 1 | 0 | TOUCH UP | only 1 props; under target 24x48 |
| `cobble_quarry` | 32x20 | 'c' 43% | 6 | 8 | TOUCH UP | under target 24x48 |
| `fb_heights` | 24x16 | 'g' 88% | 5 | 1 | TOUCH UP | one floor tile 88% >70% (D88); only 5 props; under target 24x48 |

## Target size
Keep current size (D81/D82/D84; detail only).

## Files to touch
`data/*.json` (`roofs` entries, new prop objs on walkable cells, never change grid size or warps), `sprites.js` (tiles/props listed in BUILDING_VARIETY), `game.js` (E11 roof/wall/door lookup, E7 path edges), mapdata.js.

## Acceptance criteria
- Every building on every town map has a unique combination (roof+wall+door+window+porch prop); a screenshot of each town shows no two alike.
- Towns ≥ 3 landmarks; routes ≥ 1 landmark / 16 tiles; ≥ 6 props per screen.
- Grass/path top tile ≤ 70 % after variants.
- No map changes size, no warp/door coordinates change.
- Faction roof trim still shows.
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
(file `data/maps_slice.json`)
#### `hearthmoor` Hearthmoor (24x20) current grid (origin/main 8338122)
```
TTTTTTTTTTTTTTTTTTTTTTTT
TgggggggggggggTgggggTTTT
TgRRRRgTRRRRRRgRRRRgTTTT
TgRRRRggRRRRRRgRRRRgTTTT
TgHHHHggRRRRRRgHHHHgTTTT
TggpggggHHHHHHggpgggTTTT
TfgpgggggggpggggpgggTTTT
TggpggfggggpgfggpgggTTTT
Tggppppppppppppppppppppp
TgggggggggggggpgggggTTTT
TggggggggfggggpRRRRgTTTT
TgFFFgFFggggggpRRRRgTTTT
TgFffffFgssssspHHHHgTTTT
TgFffffFgswwwspppgggTTTT
TgFffffFgswwwsgggfggTTTT
TgFFFFFFgswwwsggggggTTTT
TggggggggsssssgggTggTTTT
TTgggfggggggfgggggTgTTTT
TgTggggggggggggggggTTTTT
TTTTTTTTTTTTTTTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `hm_home` door (3,5) 
- `hm_lodge` door (11,6) 
- `hm_lantern` door (16,13) 
- `hm_rook` door (16,5) 
- `hm_east` warp (23,8) route1
- `hm_sign_town` sign (19,9) 
- `hm_sign_lodge` sign (12,7) 
- `hm_sign_lantern` sign (17,13) 
- `hattie` npc (4,13) 
- `rook_home` npc (17,6) 
- `rook_gate` npc (22,8) 
- `hm_gate` trigger (21,8) 
- `hm_rival1` trigger (21,8) 

(file `data/maps_slice.json`)
#### `fernbrook` Fernbrook (32x20) current grid (origin/main 8338122)
```
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
TTggggggggggTTgggggRRRRRRRRggggT
TggRRRRRRggggggggggRRRRRRRRgTTgT
TggRRRRRRggfgggggggRRRRRRRRggTgT
TggHHHHHHggggggfgggRRRRRRRRggggT
TggggpgggggggggggggHHHHHHHHggggT
TggggpggggfgggggggggggpggggggggT
TggggpgggggggggggfggggpggggfgggT
pppppppppppppppppppppppppppppppT
TggggggggggggggggggggggggggggggT
TgFFFFFFFgFFFFFFFgggggggggggggTT
TgFtttttttttttttFggssssssttttggT
TgFtTtTtTtTtTtTtFggswwwwsttttfgT
TgFtttttttttttttFggswwwwsttttggT
TgFtttttttttttttFggswwwwsttttggT
TgFtTtTtTtTtTtTtFggswwwwsttttggT
TgFtttttttttttttFggssssssttttggT
TgFtttttttttttttFTgggggggggggTgT
TgFFFFFFFFFFFFFFFgTgggggggggggTT
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `fb_west` warp (0,8) route1
- `fb_lantern` door (5,5) 
- `fb_hall` door (22,6) 
- `fb_sign_town` sign (2,7) 
- `fb_sign_hall` sign (24,7) 
- `fb_sign_route2` sign (29,7) 
- `fb_lantern_stand` prop (13,6) glimmer_stand
- `fb_crate_a` prop (14,16) crate
- `fb_crate_b` prop (15,16) crate
- `juniper` npc (14,6) 
- `faded_fuzzwick` wild (13,7) 
- `fen_orchard` npc (10,9) 
- `fern_associate` trainer (9,14) 
- `odile` npc (27,9) 
- `fb_snack` pickup (28,16) 
- `rook_fb` npc (22,8) 
- `fb_glimmer` trigger (13,8) 
- `fb_teaser` trigger (22,6) 

(file `data/cobblecrest.json`)
#### `cobblecrest` Cobblecrest (32x20) current grid (origin/main 8338122)
```
TTTTTTTTTKKKKKKKcKKKKTTTTTTTTTTT
TggggggggKKKKKKcccKKKRRRRRRRRTTT
TgRRRRRRgKKKKKKcccKKKRRRRRRRRggT
TgRRRRRRggfggKKcccKKgRRRRRRRRggT
TgHHHHHHgggggggcccgggHHHHHHHHggT
TggggpggggcccccccccccHHHHHHHHggT
TggggpggggcccccccccccfggpggggggT
TTTggpggggcccccccccccgggpggggggT
pppppppppppppppppppppppppppppppT
TTTgggggggcccccccccccggggggggggT
TgggggggggcccccccccccggggggggggT
TgggggggRRRRgggggggggRRRRggggggT
TgggggggRRRRgggggggggRRRRggggggT
TgggggggHHHHgggggggggHHHHggggggT
TgfggggggggfgggggggggggggggfgggT
TggggggggggTTggggfggggsssssssggT
TgggTTgggggTTgggggggfgswwwwwsggT
TgggTTggggggggggggggggsssssssggT
TgggfggggggggggggggggggggfgggggT
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `cc_west` warp (0,8) route2
- `cc_north` warp (16,0) cobble_quarry
- `cc_lantern` door (5,5) cc_lantern_in
- `cc_hall` door (24,6) cc_hall_in
- `cc_sign_town` sign (4,7) 
- `cc_sign_hall` sign (26,7) 
- `cc_sign_quarry` sign (18,4) 
- `cc_sign_quarry_sold` sign (18,4) 
- `cc_sign_east` sign (29,7) 
- `cc_crates` prop (30,8) crate
- `cc_cairn` prop (18,6) cairn
- `cc_stall_l` prop (11,6) stall_counter
- `cc_stall_r` prop (13,6) stall_counter
- `dottie` npc (12,6) 
- `rook_cc` npc (3,7) 
- `cc_arrive` trigger (2,8) 
- `cc_miner` npc (14,10) 
- `pim` npc (7,10) 
- `tamsin` npc (19,9) 
- `ally_a` npc (27,14) 
- `cc_snack` pickup (2,14) 
- `rook_hook` npc (25,7) 
- `cc_hook` trigger (24,7) 

(file `data/highcharity.json`)
#### `highcharity` High Charity (64x40) current grid (origin/main 8338122)
```
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
TgggAAAAAAAAAAAAAAAAAAAgggRRRRRRRRRRRRRgggAAAAAAAAAAAAAAAAAAAggT
TgggAAAAAAAAAAAAAAAAAAAgggRRRRRRRRRRRRRgggAAAAAAAAAAAAAAAAAAAggT
TgggAAAAAAAAAAAAAAAAAAAgggHHHHHHHHHHHHHgggAAAAAAAAAAAAAAAAAAAggT
TgggAAAAAAAAAAAAAAAAAAAPPPPPPPPPPPPPPPPPPgAAAAAAAAAAAAAAAAAAAggT
TgggggggggggggggPggggggggggggggPPPggggggPgggggRRRRRRRRRRRRRggggT
TgggggggggggggggPgggggggggRRRRRRRRRRRRRgPgggggRRRRRRRRRRRRRggggT
TgggggggggggggggPgggggggggRRRRRRRRRRRRRgPgggggRRRRRRRRRRRRRggggT
TgggRRRRRRRRRRRgPgggggggggHHHHHHHHHHHHHgPgggggHHHHHHHHHHHHHggggT
TgggRRRRRRRRRRRgPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPggggggT
TgggHHHHHHHHHHHgPgRRRRRRRRRggggPPPgggggPPggggggggggggggggggggggT
TggggggggPggggggPgRRRRRRRRRggggPPPgggggPPggggggggggggggggggggggT
TwwwwwwggPggggggggHHHHHHHHHggggPPPgggggPRRRRRRRRRRRggggggggggggT
TwwwwwwggPggggggggggggPPPPPPgggPPPgggggPRRRRRRRRRRRggggggggggggT
TwwwwwwsgPggggRRRRRRRRRggggPgggPPPgggggPHHHHHHHHHHHggggggggggggT
TwwwwwwsgPggggRRRRRRRRRggggPgggPPPgggggPPPPPPPgggggggggggggggggT
TwwwwwwsgPggggHHHHHHHHHggggPgggPPPgggggPgggggggggggggggggggggggT
TwwwwwwsDDDDDgggggPggggggggPgggPPPgggggPgggggggggggggggggggggggT
TwwwwwwsDDDDDgggggPggggggggPgggPPPgggggPgggggggggggggggggggggggT
TwwwwwwsPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPggggggT
TwwwwwwsPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPggggggT
TwwwwwwsPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPggggggT
TwwwRRRRRRRRRgRRRRRRRgRRRRRRRggPPPgffffggggggggggggggggggggggggT
TwwwRRRRRRRRRgRRRRRRRgRRRRRRRggPPPgffffggggggggggggggggggggggggT
TwwwHHHHHHHHHgHHHHHHHgHHHHHHHggPPPgffffggggggggggggggggggggggggT
TwwwwwwsPPPPPPPPPPPPPPPPPPPPPPPPPPPggggggggggggggggggggggggggggT
TwwwwwRRRRRRRRRRRgggggggggRRRRRRRRRRRRRgggggRRRRRRRRRRRggggggggT
TwwwwwRRRRRRRRRRRgggggggggRRRRRRRRRRRRRgggggRRRRRRRRRRRggggggggT
TwwwwwHHHHHHHHHHHgggggggggHHHHHHHHHHHHHgggggHHHHHHHHHHHggggggggT
TgggggggPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPggggggT
TggggggggggggggggggggggggggggggPPPgggggggggggggggggggggggggggggT
TgggggggggggggggggRRRRRRRRRggggPPPgggggggggggggggggggggggggggggT
TgggggggggggggggggRRRRRRRRRggggPPPggggggggggggggRRRRRRRRRRRRRggT
TgggggggggggggggggHHHHHHHHHggggPPPggggggggggggggRRRRRRRRRRRRRggT
TgggggggggggggggggggggPPPPPPPPPPPPPPPPPPPPPPPPPgHHHHHHHHHHHHHggT
TgggggggggggggggggggggPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPggggT
TggggggggggggggggggggggggggggggPPPgggggggggggggggggggggggggggggT
TggggggggggggggggggggggggggggggPPPgggggggggggggggggggggggggggggT
TggggggggggggggggggggggggggggggPPPgggggggggggggggggggggggggggggT
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `hc_airport` door (32,4) hc_airport_in
- `hc_command` door (32,9) hc_command_in
- `hc_barracks` door (9,11) hc_barracks_in
- `hc_church` door (52,9) hc_church_in
- `hc_gym` door (22,13) hc_gym_in
- `hc_marina` door (18,17) hc_marina_in
- `hc_arena` door (45,15) hc_arena_in
- `hc_apt` door (8,25) hc_apt_in
- `hc_apt_b` door (17,25) 
- `hc_apt_c` door (25,25) 
- `hc_school` door (11,29) hc_school_in
- `hc_hall` door (32,29) hc_hall_in
- `hc_bank` door (49,29) hc_bank_in
- `hc_lantern` door (22,34) hc_lantern_in
- `hc_mall` door (55,35) hc_mall_1
- `hc_south` warp (32,38) hearthmoor
- `hc_gate` trigger (32,36) 
- `hc_moss` npc (30,36) moss
- `hc_shop` npc (30,22) mira
- `hc_stall_l` prop (29,23) stall_counter
- `hc_stall_r` prop (31,23) hall_booth
- `hc_baker` npc (36,23) cole
- `hc_kite` npc (38,23) kit
- `hc_airship` prop (8,3) airship
- `hc_buoy` prop (10,18) marina_buoy
- `hc_sign_plaza` sign (34,20) 
- `hc_snack` pickup (16,36) 
- `hc_sign_church` sign (53,10) 
- `hc_sign_school` sign (12,30) 
- `hc_sign_bank` sign (50,30) 
- `hc_sign_arena` sign (46,16) 
- `hc_sign_barracks` sign (10,12) 
- `hc_sign_command` sign (33,10) 
- `hc_sign_airport` sign (33,5) 
- `hc_sign_marina` sign (19,18) 
- `hc_sign_mall` sign (56,36) 
- `hc_sign_apt` sign (7,25) 
- `hc_sign_gym` sign (23,14) 
- `hc_sign_lantern` sign (23,35) 
- `hc_sign_hall` sign (33,30) 

(file `data/mahopac.json`)
#### `mahopac` Mahopac (20x16) current grid (origin/main 8338122)
```
TTTTTTTTTTTTTTTTTTTT
TggggggggggggggggggT
TgfffggggggggggfffgT
TggggggggggggggggggT
TggRRRRRggggggwwgggT
TggRRRRRggggggwwgggT
TggHHHHHggggggwwgggT
TggggpggggggggssgggT
TggggpppppppppssgggT
TggggggggggggggggggT
TgggfgggggggggfggggT
TggggggggggggggggggT
TggggggggggggggggggT
TggggggggpgggggggggT
TggggggggpgggggggggT
TTTTTTTTTpTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `mah_south` warp (9,15) hearthmoor
- `mah_obs` door (5,7) mahopac_obs
- `mah_sign` sign (4,7) 
- `nora` npc (8,10) nora
- `cal` npc (12,9) cal
- `bess` npc (2,9) bess

(file `data/maps_slice.json`)
#### `route1` Route 1 (48x20) current grid (origin/main 8338122)
```
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
TTTgggggggggggggggggggggggggggwwggggggggggggggTT
TTggttttttgggggggggggTTTggttsswwggggTTgggtttttTT
TgggttttttgggTTggggggTTTggttsswwgggggTgggtttttgT
TgggttttttgggTTgfggggTTTggttsswwgggggggggtttttgT
TgggttttttgggggggggggTTTggttsswwgggggggggtttttgT
TgggttttttggggggggggggggggttsswwgggfgggggggggggT
TgggggggggggggggggggggggggggggwwgggggggggggggggT
ppppppppppppppppppppppppppppppBBpppppppppppppppp
TggggggggggggggggggggggggfggggwwgggggggfgggggggT
TggfggggggggggggggggggggggggggwwggggggggggfggggT
TggggggggggtttttttttggggggggsswwsttttttttggggggT
TggggggggggtttttttttgggTTTggsswwsttttttttggggggT
TggggggggggtttttttttgggTTTggsswwsttttttttgggTTTT
TggggggggggtttttttttgggTTTggsswwsttttttttgggTTTT
TgggggfggggtttttttttgggTTTggsswwsttttttttgggTTTT
TggggggggggtttttttttggggggggggwwsttttttttgggTTTT
TTggggpgggggggggggggggggggggggwwggggggggggggTTTT
TTTgggpggTggggggggggTgggggggggwwgggggggggggggggT
TTTTTTpTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `r1_west` warp (0,8) hearthmoor
- `r1_east` warp (47,8) fernbrook
- `r1_sign_west` sign (2,7) 
- `r1_sign_stream` sign (29,9) 
- `r1_sign_east` sign (45,7) 
- `r1_south` warp (6,19) proto
- `r1_sign_meadow` sign (5,18) 
- `route1_pia` trainer (10,6) 
- `route1_tam` trainer (32,11) 
- `route1_ollie` trainer (42,7) 
- `r1_snack` pickup (2,16) 
- `r1_treat` pickup (45,3) 

(file `data/act1_route2.json`)
#### `route2` Route 2 (48x20) current grid (origin/main 8338122)
```
TTTTTTTTTTTTTTTTTTTTTTTTpTTTTTTTTTTTTTTTTTTTTTTT
TTTggggggggggswwsggggTTgpgTTggggggggggTTggTTTTTT
TTgttttttttggswwsggggTTTpTTTggttttttttggggTTTTTT
TggtttTttttggswwsggggTTTpTTTggtttTttttggggfgggTT
TggttttttttggswwsggggTTTpTTTggttttttttggggggggTT
TggttttttTtggswwsggggTTTpTTTggttttttttggggggggTT
TggttttttttggswwsggggTTTpTTTgfgggggggggggfgggggT
TggggggggggggswwsggggTTTpTTTgggggggggggggggggggT
ppppppppppppppBBpppppppppppppppppppppppppppppppT
TggggggggggggswwsgggggggggggggggggggggggggggggTT
TggggggggggggswwsgggfgggggggfgggggggggggggggggTT
TggggggggggggswwstttgggggggggggtttttttttttggggTT
TggttttttttggswwstttgtttttttgggtttttttttttgggggT
TggttttttttggswwstttgtttttttgggttttTttttttgggggT
TggtttTttttggswwstttgtttTtttgggtttttTtttttgggggT
TggttttttttggswwstttgtttttttgggtttttttttttgggggT
TTgttttttttggswwstttgtttttttgggtttttttttttgggggT
TTfggggggggggswwsgggggfgggggggggggggggggggggTTTT
TTTggggggggggswwsgggggggggggggggggggggggggggTTTT
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `r2_west` warp (0,8) fernbrook
- `r2_glen` warp (24,0) route2_glen
- `r2_sign_west` sign (2,7) 
- `r2_sign_creek` sign (13,9) 
- `r2_sign_glen` sign (23,9) 
- `r2_sign_east` sign (45,7) 
- `r2_gate` prop (46,8) glimmer_gate
- `r2_rockhound` trainer (10,10) 
- `r2_skipper` trainer (18,6) 
- `r2_associate` trainer (24,2) 
- `hollis_aside` npc (25,1) 
- `r2_stargazer` trainer (38,6) 
- `r2_snack` pickup (3,17) 
- `r2_treat` pickup (44,3) 
- `rook_r2` npc (44,8) 
- `r2_census` trigger (24,8) 
- `r2_end` trigger (43,8) 

(file `data/act1_route2.json`)
#### `route2_glen` Wickerglen (24x20) current grid (origin/main 8338122)
```
TTTTTTTTTTTTTTTTTTTTTTTT
TTTgggggggTTgTTggggggTTT
TTggggggggfgggfgggttttTT
TggggggfgggggggggfttttgT
TgggggggggggggggggttttgT
TggggggggggggggggggggggT
TggggggggggggggggggggggT
TggggggggfggpggfgggggggT
TgggggfgggggpgggggfggggT
TgggggggggggpggggggggggT
TgggggggggggpggggggggggT
TgssssstttggpggtttttttgT
TgswwwstttTgpgTtttttttgT
TgswwwstttTgpgTtttTtttgT
TgswwwstttTgpgTtttttttgT
TgssssstttTgpgTtttttttgT
TgtttttttgTgpgTtttttttgT
TTtttttttgTgpgTgggggggTT
TTTgggggggTgpgTggggggTTT
TTTTTTTTTTTTpTTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `glen_south` warp (12,19) route2
- `glen_sign` sign (13,17) 
- `glen_lamp_w` prop (8,4) comfort_lamp
- `glen_lamp_n` prop (12,2) comfort_lamp
- `glen_lamp_e` prop (16,4) comfort_lamp
- `glen_tent` prop (6,6) census_tent
- `glen_crate_a` prop (17,7) crate
- `glen_crate_b` prop (18,7) crate
- `r2_lead` trainer (12,5) 
- `faded_pebblit` wild (15,5) 
- `glen_snack` pickup (20,16) 
- `glen_intro` trigger (12,10) 

(file `data/maps_slice.json`)
#### `proto` Old Meadow (24x20) current grid (origin/main 8338122)
```
TTTpTTTTTTTTTTTTTTTTTTTT
TggpgggttttgggTTggggtttT
TgfpggtttttggggggfgttttT
TggppppppppppppppgggtttT
TggpggggggggwwwgpgggggTT
TttpgTTggfggwwwgpggtttgT
TttpgTggggggwwwwpggttttT
TttpggggttttgwwgpggttttT
TggpggggttttggggpgggggTT
TggpppppppppppppppppgggT
TfggggggpgggggggggfpgggT
TgtttgggpgggTTgggggpgtgT
TgttttggpgggTTggwwwpttgT
TgttttggpggggggwwwwpttgT
TggtttggpgfggggwwwgpggTT
TgggggggppppppppppppgggT
TTggfgggggtttttggggggggT
TggggTTgggttttttgggfgggT
TggggggggggtttggggggTTTT
TTTTTTTTTTTTTTTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `om_north` warp (3,0) route1
- `om_sign` sign (4,1) 

(file `data/cobblecrest.json`)
#### `cobble_quarry` Cobblecrest Quarry (32x20) current grid (origin/main 8338122)
```
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
KKKKKKKKKKKKKKKKcKKKKKKKKKKKKKKK
KKccccccccccccccccccccccccccccKK
KKttttttccccccccccccccccttttttKK
KKttttttccccccccccccccccttttttKK
KKttttttccccccccccccccccttttttKK
KKccccccccccccccccccccccccccccKK
KKccccccccccccccccccccccccccccKK
KKccccccccccccccccccccccccccccKK
KKKKKKKKKKKKKKKcccKKKKKKKKKKKKKK
KKttttttttccccccccccccttttttttKK
KKttttttttccccccccccccttttttttKK
KKttttttttccccccccccccttttttttKK
KKtsssssstccccccccccccttttttttKK
KKtswwwwstccccccccccccttttttttKK
KKtswwwwstccccccccccccggggggggKK
KKtsssssstccccccccccccggggggggKK
KKggggggggccccccccccccggggggggKK
KKggggggggccccccccccccggggggggKK
KKKKKKKKKKKKKKKKcKKKKKKKKKKKKKKK
```
Objects (id kind x,y sprite/look):
- `q_south` warp (16,19) cobblecrest
- `q_sign_seam` sign (16,1) 
- `q_gate` prop (16,1) glimmer_gate
- `tobin_gate` npc (17,2) 
- `q_stage_l` prop (15,4) stage_bunting
- `q_stage_r` prop (17,4) stage_bunting
- `dorian_q` npc (16,4) 
- `hale_q` npc (13,6) 
- `tamsin_q` npc (19,6) 
- `rook_q` npc (17,7) 
- `q_buyout` trigger (16,9) 
- `juniper_q` npc (14,17) 
- `q_sketcher` trainer (11,16) 
- `q_mason` trainer (20,13) 
- `q_hearty` pickup (3,4) 
- `q_sip` pickup (28,4) 

(file `data/heights.json`)
#### `fb_heights` Fernbrook Heights (24x16) current grid (origin/main 8338122)
```
TTTTTTTTTTTTTTTTTTTTTTTT
TggggggggggggggggggggggT
TgRRRRRgggggggRRRRRggggT
TgHHHHHgggggggHHHHHggggT
TgHHHHHgggggggHHHHHggggT
TgpppppgggggggpppppggggT
TgggpgggggggggggpggggggT
TgggpgggggggggggpggggggT
TgggpppppppppppppggggggT
TggggggggggpgggggggggggT
TggggggggggpgggggggggggT
TggggggggggpgggggggggggT
TggggggggggpgggggggggggT
TggggggggggpgggggggggggT
TggggggggggpgggggggggggT
TTTTTTTTTTppTTTTTTTTTTTT
```
Objects (id kind x,y sprite/look):
- `ht_south` warp (11,15) fernbrook
- `ht_lab` door (4,5) rx_f1
- `ht_tunnel` door (16,5) sm_yard
- `ht_sign` sign (12,10) 
- `ht_stock` prop (13,10) crate
- `ht_kit` npc (14,11) villager
- `ht_snacks` pickup (10,12) 
- `ht_rx` sign (6,6) 
- `ht_pylon` prop (2,6) rx_pylon

