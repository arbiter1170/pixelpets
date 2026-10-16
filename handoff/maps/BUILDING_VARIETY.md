# BUILDING_VARIETY — no two buildings alike

Rule (Vincent, Oct 15 2026): every building gets its own exterior (roof colour **or** shape, wall material, door, windows, trim, plus at least one porch prop: sign, planter, fence, bench, lamp) **and** a distinct interior (own floor skin + wall skin + one signature prop). Buildings of the same chain (the four Lantern Houses) share only the lantern sign; everything else differs.

Today: every house outdoors is the same `R` roof + `H` wall tile (only colour tweaks via the map field `roofs:{name:{x0,y0,x1,y1,col}}` on Cobblecrest's hall and five High Charity civic roofs, all blue `b`), and every interior uses the same `.` plank floor. Faction trim (Keeper gold/green, Glimmerwell cyan/mint, painted by `factionOfMap()` in game.js) must stay on top of whatever is chosen below.

**Mechanism (E11, built in B4):** extend `roofs` entries additively: `{x0,y0,x1,y1,col, roof:"roof_thatch", wall:"wall_stone", door:"door_arch_r", win:"win_round", trim:"o"}`. Missing keys = today's look. Interiors pick skins via the existing per-map `skin` field (LAB_SKIN pattern): add `HOUSE_SKINS` keyed by skin name → remap `#`, `W`, `.`.

All art: 16×16 PAL text grids, `.` transparent, no outline, original.

| # | Building (map / door id) | Exterior: what makes it unique | Interior: skin + signature | Art needed |
|---|---|---|---|---|
| 1 | Your Home (hearthmoor `hm_home` → `hm_home_in`) | warm red-tile roof (`r`), cream plaster wall, round window, green door, flower box | `house_floor_a` honey planks, rag rug with border, bed + mirror | roof_tile_r, wall_plaster, win_round, door_plain_g, planter_box |
| 2 | Warden's Lodge (`hm_lodge` → `hm_lodge_in`) | steep dark-green shingle roof, log walls, double door, antler-free carved wood sign "LODGE", hitching fence | warm flagstone floor, timber-board walls on a Keeper-green wainscot, green/gold runner, hearth, map table | roof_shingle_g, wall_log, door_double, sign_lodge, fence_post |
| 3 | Lantern House, Hearthmoor (`hm_lantern` → `hm_lantern_in`) | gold roof (`y`), white wall, hanging lantern sign (chain brand), bench | warm sand checker floor, cream-and-sage walls, three rest beds with quilts in different colours | roof_gold, lantern_sign (shared), bench_long |
| 4 | Rook's House (`hm_rook` → `hm_rook_in`) | orange-red roof, brick wall, crooked chimney, bike/cart by door | honey planks, rose sprig wallpaper, kitchen corner, Rook's trophy shelf | roof_tile_o, wall_brick, chimney, cart_prop |
| 5 | Keeper House (civic `hm_hq_f1/f2`) | slate-blue roof, stone wall, banner with Keeper gold/green, two lamps | stone flags floor + carpet runner, notice board, stair landing | roof_slate_b, wall_stone, banner_keeper, lamp_post, floor_flag |
| 6 | Lantern House, Fernbrook (`fb_lantern`, planned `fb_lantern_in`) | moss-green thatch roof, timber frame, lantern sign, apple crate | orchard-wood floor, Amos's heal counter, drying herbs | roof_thatch_g, wall_timber, apple_crate |
| 7 | Bloom Trial Hall (`fb_hall`, planned `fb_hall_in`) | wide pink-flower gable roof (`p`), arched door, hedge planters | hedge zig-zag, flower dais (keep Appendix layout) | roof_gable_p, door_arch, hedge_planter, floor_moss |
| 8 | Lantern House, Cobblecrest (`cc_lantern` → `cc_lantern_in`) | flat slate roof, rough stone wall, lantern sign, cart rail | cobble floor + rug, ore-lamp, pick on wall | wall_rough, floor_cobble |
| 9 | Stone Trial Hall (`cc_hall` → `cc_hall_in`; roof `m` today) | stepped slate roof (keep `m`), pillar front (`X`), carved slab sign | `:` hall floor → add 2 variants + slab inlays, stone plinths | floor_hall_b/c, plinth |
| 10 | Airship Field (hc `hc_airport_in`) | blue roof (today) + windsock, hangar ribs | painted pad lines, crates, weather board | windsock, floor_pad_line |
| 11 | Sky-Dock Command (`hc_command_in`) | tall flat roof with mast, glass band windows | console row, chart table | mast, win_band, console |
| 12 | Keeper Barracks (`hc_barracks_in`) | long gable, Keeper banner, rack of practice poles | bunks in a row (designed row), lockers | bunk, locker |
| 13 | High Charity Chapel (`hc_church_in`) | tall pointed roof, round rose window (abstract, no religious symbols beyond a bell), bell | long benches, aisle runner, candle stands (still frame) | roof_point, win_rose, bell, pew |
| 14 | Trial Gym (`hc_gym_in`) | arched roof, banner, training dummies outside | sprung floor with court lines, mats | floor_court, mat, dummy |
| 15 | Canal Marina (`hc_marina_in`) | blue-green boathouse roof on piles, rope coils | plank dock floor, boat on rack, nets | rope_coil, boat_rack, net |
| 16 | Charity Arena (`hc_arena_in`) | round drum walls, flags | sand floor, stands rows | floor_sand_ring, stands |
| 17–19 | Apartments A/B/C (`hc_apt`, `hc_apt_b`, `hc_apt_c`) | same block, but each door/balcony differs: A plant balcony, B laundry line, C bike + blue door | only A has an interior (`hc_apt_in` "Your Room"): own rug + desk | balcony_plant, laundry_line, door_blue |
| 20 | Lantern School (`hc_school_in`) | clock gable, yellow walls, slate board sign | desks in rows, chalk board | clock_face, desk_school |
| 21 | Event Hall (`hc_hall_in`) | blue civic roof + bunting | parquet floor, stage, chairs | floor_parquet, stage, bunting |
| 22 | Civic Bank (`hc_bank_in`) | columns, heavy door, Acorn emblem | marble check floor, counter with grille, vault door | floor_marble, vault_door, acorn_emblem |
| 23 | Lantern House, High Charity (`hc_lantern_in`) | teal roof, tall windows, lantern sign | warm tiled clinic floor, beds | floor_clinic |
| 24 | Charity Mall (`hc_mall_1/2`) | glass front, awnings in 3 colours | shop stalls, fountain, escalator-free stair | awning_r/b/y, stall, fountain_small |
| 25 | Breckenridge Observatory (mahopac `mah_obs`) | dome roof, slit, signal mast (landmark) | dusk-violet boards with brass compass inlay, night dome on walnut | roof_dome, telescope, floor_starmap |
| 26 | RegenX facade (fb_heights `ht_lab`) | white front, mint sign (art row 13, 32×32) | lab skin (B1/B2), each floor own accent | regenx_facade |
| 27 | Tunnel mouth (fb_heights `ht_tunnel`) | timber-braced rock mouth, lantern hook | rock skin (B3) | tunnel_mouth |

Planned (NEW BUILD later): Brinewick buildings, Cobblecrest cottages — apply the same rule from day one.
