# MAP_AUDIT — every map vs MAP_SCALE_DETAIL (D81–D89)

Measured Thu Oct 15, 2026 ~8 AM ET from game `origin/main` 8338122 (read-only `git show`). Floor share = most common walkable char ÷ walkable cells (walls `# W T H R X` excluded). Props = objs of kind prop/sign/pickup/shop; people = npc/trainer/wild.
Verdict policy: D81 (Act 1 towns detail only), D82 (portrait for new routes only), D83 (bigger RegenX rooms, not more), D84 (houses enlarged only when rebuilt), D85 targets for new/rebuilt, D86 rx_f4 pilot 14×22, D87 tunnel rock skin, D88 70 % floor cap, D89 night tech. Vincent (Oct 15): prefer TOUCH UP / EXPAND / graphics; REBUILD only as a last resort — **no map is marked REBUILD**; rx_f4's pilot keeps all ids so it is an EXPAND. 'under target' on frozen maps is informational only.
Totals: 51 maps — TOUCH UP 41, OK 1, EXPAND 4, NEW BUILD 5. Glimmer Path adds no map (it patches Fernbrook objects; covered by B4).

| id | name | built | type | WxH | target | top floor | props | ppl | verdict | batch | problems |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `hearthmoor` | Hearthmoor | yes | town | 24x20 | keep (new-build target 40x40) | 'g' 65% | 3 | 3 | **TOUCH UP** | B4 | only 3 props; under target 32x36 |
| `route1` | Route 1 | yes | route | 48x20 | keep (new-build target 24x64) | 'g' 64% | 6 | 3 | **TOUCH UP** | B4 | under target 24x48 |
| `fernbrook` | Fernbrook | yes | town | 32x20 | keep (new-build target 40x40) | 'g' 51% | 7 | 6 | **TOUCH UP** | B4 | under target 32x36 |
| `proto` | Old Meadow | yes | route | 24x20 | keep (new-build target 24x64) | 'g' 54% | 1 | 0 | **TOUCH UP** | B4 | only 1 props; under target 24x48 |
| `hm_home_in` | Your Home | yes | interior | 9x8 | keep (new-build target 12x16) | '.' 78% | 8 | 0 | **TOUCH UP** | B5 | one floor tile 78% >70% (D88); under target 10x12 |
| `hm_home_up` | Your Home, upstairs | yes | interior | 9x8 | keep (new-build target 12x16) | '.' 89% | 2 | 1 | **TOUCH UP** | B5 | one floor tile 89% >70% (D88); props 2 < 1/12 floor (2); under target 10x12 |
| `hm_lodge_in` | Warden's Lodge | yes | interior | 11x9 | keep (new-build target 12x16) | '.' 80% | 8 | 2 | **TOUCH UP** | B5 | one floor tile 80% >70% (D88); under target 10x12 |
| `hm_lantern_in` | Lantern House | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 86% | 5 | 0 | **TOUCH UP** | B5 | one floor tile 86% >70% (D88); under target 10x12 |
| `hm_rook_in` | Rook's House | yes | interior | 7x6 | keep (new-build target 12x16) | '.' 94% | 2 | 1 | **TOUCH UP** | B5 | one floor tile 94% >70% (D88); under target 10x12 |
| `hm_hq_f1` | Keeper House | yes | interior | 9x8 | keep (new-build target 12x16) | '.' 89% | 1 | 3 | **TOUCH UP** | B5 | one floor tile 89% >70% (D88); props 1 < 1/12 floor (3); under target 10x12 |
| `hm_hq_f2` | Keeper House, upstairs | yes | interior | 9x8 | keep (new-build target 12x16) | '.' 89% | 1 | 2 | **TOUCH UP** | B5 | one floor tile 89% >70% (D88); props 1 < 1/12 floor (3); under target 10x12 |
| `route2` | Route 2 | yes | route | 48x20 | keep (new-build target 24x64) | 'g' 53% | 7 | 6 | **TOUCH UP** | B4 | under target 24x48 |
| `route2_glen` | Wickerglen | yes | route | 24x20 | keep (new-build target 24x64) | 'g' 65% | 8 | 2 | **TOUCH UP** | B4 | under target 24x48 |
| `cobblecrest` | Cobblecrest | yes | town | 32x20 | keep (new-build target 40x40) | 'g' 63% | 10 | 7 | **TOUCH UP** | B4 | under target 32x36 |
| `cobble_quarry` | Cobblecrest Quarry | yes | route | 32x20 | keep (new-build target 24x64) | 'c' 43% | 6 | 8 | **TOUCH UP** | B4 | under target 24x48 |
| `cc_lantern_in` | Cobblecrest Lantern House | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 86% | 6 | 0 | **TOUCH UP** | B5 | one floor tile 86% >70% (D88); under target 10x12 |
| `cc_hall_in` | Cobblecrest Trial Hall | yes | interior | 11x13 | keep (new-build target 12x16) | ':' 96% | 5 | 3 | **TOUCH UP** | B5 | one floor tile 96% >70% (D88); props 5 < 1/12 floor (5) |
| `highcharity` | High Charity | yes | town | 64x40 | keep (new-build target 40x40) | 'g' 61% | 19 | 4 | **OK** | B4 | - |
| `hc_airport_in` | Airship Field | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 97% | 1 | 1 | **TOUCH UP** | B6 | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_command_in` | Sky-Dock Command | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 97% | 1 | 1 | **TOUCH UP** | B6 | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_barracks_in` | Keeper Barracks | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 97% | 1 | 1 | **TOUCH UP** | B6 | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_marina_in` | Canal Marina | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 97% | 1 | 1 | **TOUCH UP** | B6 | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_school_in` | Lantern School | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 97% | 1 | 1 | **TOUCH UP** | B6 | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_bank_in` | Civic Bank | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 97% | 1 | 1 | **TOUCH UP** | B6 | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_gym_in` | Trial Gym | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 97% | 1 | 1 | **TOUCH UP** | B6 | one floor tile 97% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `hc_lantern_in` | Lantern House | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 97% | 5 | 0 | **TOUCH UP** | B6 | one floor tile 97% >70% (D88); under target 10x12 |
| `hc_church_in` | High Charity Chapel | yes | interior | 11x11 | keep (new-build target 12x16) | '.' 95% | 5 | 1 | **TOUCH UP** | B6 | one floor tile 95% >70% (D88); props 5 < 1/12 floor (6); under target 10x12 |
| `hc_hall_in` | Event Hall | yes | interior | 11x11 | keep (new-build target 12x16) | '.' 99% | 5 | 6 | **TOUCH UP** | B6 | one floor tile 99% >70% (D88); props 5 < 1/12 floor (6); under target 10x12 |
| `hc_arena_in` | Charity Arena | yes | interior | 11x9 | keep (new-build target 12x16) | '.' 98% | 2 | 1 | **TOUCH UP** | B6 | one floor tile 98% >70% (D88); props 2 < 1/12 floor (4); under target 10x12 |
| `hc_apt_in` | Your Room | yes | interior | 7x6 | keep (new-build target 12x16) | '.' 94% | 1 | 1 | **TOUCH UP** | B6 | one floor tile 94% >70% (D88); props 1 < 1/12 floor (1); under target 10x12 |
| `hc_mall_1` | Charity Mall | yes | interior | 11x11 | keep (new-build target 12x16) | '.' 99% | 3 | 1 | **TOUCH UP** | B6 | one floor tile 99% >70% (D88); props 3 < 1/12 floor (6); under target 10x12 |
| `hc_mall_2` | Charity Mall, Upstairs | yes | interior | 11x11 | keep (new-build target 12x16) | '.' 99% | 2 | 1 | **TOUCH UP** | B6 | one floor tile 99% >70% (D88); props 2 < 1/12 floor (6); under target 10x12 |
| `mahopac` | Mahopac | yes | town | 20x16 | keep (new-build target 40x40) | 'g' 87% | 1 | 3 | **TOUCH UP** | B4 | one floor tile 87% >70% (D88); only 1 props; under target 32x36 |
| `mahopac_obs` | Breckenridge Observatory | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 100% | 1 | 0 | **TOUCH UP** | B7 | one floor tile 100% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `dream_2004` | Dream: 2004 | yes | interior | 9x8 | keep (new-build target 12x16) | '.' 97% | 2 | 0 | **TOUCH UP** | B7 | one floor tile 97% >70% (D88); props 2 < 1/12 floor (2); under target 10x12 |
| `dream_party` | Dream: seventh birthday | yes | interior | 11x8 | keep (new-build target 12x16) | '.' 60% | 5 | 0 | **TOUCH UP** | B7 | under target 10x12 |
| `dream_drive` | Dream: the drive-through | yes | interior | 9x7 | keep (new-build target 12x16) | '.' 100% | 1 | 1 | **TOUCH UP** | B7 | one floor tile 100% >70% (D88); props 1 < 1/12 floor (2); under target 10x12 |
| `fb_heights` | Fernbrook Heights | yes | route | 24x16 | keep (new-build target 24x64) | 'g' 88% | 5 | 1 | **TOUCH UP** | B4 | one floor tile 88% >70% (D88); only 5 props; under target 24x48 |
| `rx_f1` | RegenX Lobby | yes | lab | 18x12 | 14x22 | '.' 85% | 2 | 2 | **EXPAND** | B2 | one floor tile 85% >70% (D88); props 2 < 1/12 floor (12); under target 14x20 |
| `rx_f2` | RegenX Focus Wing | yes | lab | 18x12 | 14x22 | '.' 88% | 5 | 3 | **EXPAND** | B2 | one floor tile 88% >70% (D88); props 5 < 1/12 floor (12); under target 14x20 |
| `rx_f3` | RegenX Records | yes | lab | 18x12 | 14x22 | '.' 83% | 5 | 1 | **EXPAND** | B2 | one floor tile 83% >70% (D88); props 5 < 1/12 floor (12); under target 14x20 |
| `rx_f4` | The Arbiter Bay | yes | lab | 18x12 | 14x22 | '.' 99% | 5 | 2 | **EXPAND** | B1 | one floor tile 99% >70% (D88); props 5 < 1/12 floor (12); under target 14x20 |
| `sm_yard` | Heights Yard | yes | dungeon | 18x12 | keep (new-build target 16x26) | '.' 99% | 0 | 1 | **TOUCH UP** | B3 | one floor tile 99% >70% (D88); props 0 < 1/12 floor (12); under target 14x20 |
| `sm_tunnel` | Smuggler Tunnel | yes | dungeon | 18x12 | keep (new-build target 16x26) | '.' 99% | 1 | 1 | **TOUCH UP** | B3 | one floor tile 99% >70% (D88); props 1 < 1/12 floor (12); under target 14x20 |
| `sm_hold` | Crate Hold | yes | dungeon | 18x12 | keep (new-build target 16x26) | '.' 99% | 1 | 2 | **TOUCH UP** | B3 | one floor tile 99% >70% (D88); props 1 < 1/12 floor (12); under target 14x20 |
| `sm_den` | Broker's Den | yes | dungeon | 18x12 | keep (new-build target 16x26) | '.' 99% | 0 | 1 | **TOUCH UP** | B3 | one floor tile 99% >70% (D88); props 0 < 1/12 floor (12); under target 14x20 |
| `fb_lantern_in` | Fernbrook Lantern House (Keeper Amos) | no | interior | - | 12x16 | - | - | - | **NEW BUILD** | B8 | no map data yet; build to D85 target + detail standard |
| `fb_hall_in` | Fernbrook Bloom Trial Hall (Master Fen) | no | interior | - | 16x24 | - | - | - | **NEW BUILD** | B8 | no map data yet; build to D85 target + detail standard |
| `route3` | Route 3 (Cobblecrest -> Brinewick) | no | route | - | 24x64 | - | - | - | **NEW BUILD** | B4 | no map data yet; build to D85 target + detail standard |
| `brinewick` | Brinewick (harbour town, Seal 3) | no | town | - | 40x40 | - | - | - | **NEW BUILD** | B4 | no map data yet; build to D85 target + detail standard |
| `cc_cottages` | Cobblecrest cottage interiors | no | interior | - | 12x16 | - | - | - | **NEW BUILD** | B5 | no map data yet; build to D85 target + detail standard |

Main findings: 36 of 46 built maps break the 70 % floor cap (D88); all 14 High Charity rooms sit at 94–99 % one tile with 1–5 props; the 8 RegenX/tunnel rooms are one 18×12 box; every building outdoors uses the same roof/wall tiles (see handoff BUILDING_VARIETY.md). Not built and without a spec yet: Route 3, Brinewick, Cobblecrest cottages (NEW BUILD when their specs land).
