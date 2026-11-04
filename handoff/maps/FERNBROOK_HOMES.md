# FERNBROOK_HOMES: three enterable NPC homes on a new south lane

**Status: needs Vincent's yes on previews (rule 9).** Built on branch `claude/fernbrook-homes`; nothing deploys until Vincent has seen the previews in `handoff/shots/fernbrook_homes/` and said yes. Decision ids D1248-D1252.

Vincent's ask: "We also need a branch opened to add more NPC homes at the bottom of Fernbrook." Asked how, he chose **enterable homes with interiors**. That makes each home a room design under AGENTS.md rule 9.

## 1. Inspiration (written before any pixels)

Rule 9 asks for inspiration from sub-agents or the Gemini model. Neither was available in this build session (no sub-agent tool, no Gemini access), so the brief below was written by the build agent itself from the room-packet checklist. Design may re-run the step with a sub-agent or Gemini before Vincent looks; that is open question Q1 in §8.

**Town read.** Fernbrook is the orchard town: thatch roofs, timber walls, apples, baskets, the stream pond. The south lane should read as the quiet back street where the orchard folk live: cottages a little lower and plainer than the Lantern House and the Bloom Trial Hall, gardens in front, a small pond at the end. Inspiration (reference only, never copied): cider-press barns in old apple country, sod-roofed picker cottages, a painted-floor sewing loft with quilts airing on a line.

**How the three homes split.** One warm and busy (work), one bright and cluttered (family), one cool and still (craft). Each gets its own roof, wall, door, window, trim, shape and porch outside, and its own floor, wall row, rug, mat and signature prop inside.

### 1a. Press House (home A, west)
- **Who lives there (role only):** the Cider Presser.
- **Mood:** warm, sticky-sweet and busy; amber light, a working kitchen that smells of apples.
- **Layout zones:** press corner (NW, stone flags under the bench and barrels), hearth and woodpile (NE), table on a braided rug (centre), bed nook (SW), jug shelf and basket (E side), mat (S).
- **Signature props:** two barrels and the press bench (`barrel`, `kitchen_counter`), apple crate, cider jugs, hearth with woodpile.
- **PAL keys:** G (honey boards), F (seams, cap), B (knots, lip), I (flagstone), r (apple-red trim), o (rug), y (highlight).
- **Differs from:** the Fernbrook Lantern House (cream C planks, herbs, three quilt beds) by its dark honey boards, stone work corner and red trim; from the Bloom Hall by having no green at all indoors; from Hearthmoor's homes (`hm_home_in` pine boards and plaster, `hm_rook_in` rose wallpaper and Calloway boards) by the barrels and press corner and the honey-and-red palette.

### 1b. Picker's Cottage (home B, middle)
- **Who lives there:** the Apple Picker and the Young Picker (a child).
- **Mood:** bright, sunny and a bit cluttered; a family home where baskets pile up by the door.
- **Layout zones:** bunk corner with two beds (NW), stove (N), basket wall with crates (NE), play rug with a small table, a game table and a beanbag (centre), laundry and coat pegs (W), a Walkling corner with bowl and bed (SE), mat (S).
- **Signature props:** stacked orchard baskets and apple crates, two single beds, the domino table and beanbag, the Walkling bed and water bowl.
- **PAL keys:** y (sunny parquet), A (parquet lines), C (cream wall face), E (sage cap), g and D (leaf rug), l (highlight).
- **Differs from:** every other room by its sunny herringbone parquet (the only y-and-A parquet in the game) and the leaf rug; from the Press House by having no stone and no hearth; from `hm_home_in` by the bunk pair and the basket wall; from `hm_rook_in` by having no kitchen corner or trophy shelf.

### 1c. Stitcher's Loft (home C, east)
- **Who lives there:** the Quilt Stitcher.
- **Mood:** cool, soft and still; north light on painted blue-grey boards, quilts folded everywhere.
- **Layout zones:** sewing table and lamp under the windows (N), dress form and curtain rail (NE), patchwork rug with folded quilts (centre-west), wardrobe and mirror (E), bed (SW), yarn and laundry baskets (S), mat (S).
- **Signature props:** the dress form (`mannequin`), three folded quilts (`quilt_c`, `quilt_r`, `quilt_y`), sewing table (`desk_small`), the patchwork rug.
- **PAL keys:** h (painted boards), K (board seams), w (wall face), m (cap), p (plum trim and frames), the rug's r y b l p o squares with w stitches.
- **Differs from:** all warm rooms in town by its cool painted floor; from `house_loft` (white and cream boards) by the blue-grey paint and plum trim; from `hm_wardrobe` (Stitch & Lantern shop, herringbone H and G) because it is a home, not a shop: one dress form, no racks, no counter.

### 1d. Outside (the lane)
- A gap in the south tree line at x17-18 opens onto a new lane that runs east-west under the three cottages.
- Front: each cottage has a short path stub to the lane and two porch props.
- South of the lane: a fenced flower patch (west, the Hedge Trimmer's work), two orchard trees (middle), a small pond with a sand bank (east). No tall grass and no zone, so no wild Walklings on the lane.
- Residents outside: the Hedge Trimmer by the flower patch and the Windfall Gatherer under the trees.

## 2. What is built
Overlay `data/detail_zzz_fernbrook_homes.json` (sorts after every other detail overlay). It `set`s only `w` and `h`, replaces `gridRows` 18-31, adds roofs with `addRoofs` (the lantern and hall roofs stay) and appends objects whose ids all start `fbh_`. It sets no `zones` (the plaza branch owns them), uses no `replaceObjs`, and edits no verbatim design file.

### 2a. Grid rows (Fernbrook, 32 wide, h 20 -> 32)

```
18 TgFFFFFFFFFFFFFFFgggggggggggggTT
19 TTgggggggggggggggppTTTTTTTTTTTTT
20 TggfgggggggggggggppggggggggfgggT
21 TgRRRRRRggRRRRRRgppgggRRRRRRgggT
22 TgRRRRRRggRRRRRRgppgggRRRRRRgggT
23 TgHHHHHHggHHHHHHgppgggHHHHHHgggT
24 TgggpgggggggpggggppgggggpgggggfT
25 TgppppppppppppppppppppppppppppgT
26 TggggggfgggggggggggggggfgggggggT
27 TgFFFgFFFggggggggggggssssssggggT
28 TgFfffffFggTgggggggggswwwwsggggT
29 TgFfffffFgggggTggggggswwwwsggggT
30 TgFFFFFFFggggggggggggssssssggggT
31 TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```

- **Only change above the old edge:** row 18, x18, tree `T` -> grass `g`. Row 18 was `TgFFFFFFFFFFFFFFFgTgggggggggggTT`. That joins the existing x17-18 grass strip beside the orchard fence (rows 10-18) to the new gate. The orchard fence x2-16 is untouched.
- **The gate:** row 19 (the old south tree line) becomes path at x17-18 and grass at x2-16 (a two-tile back-garden strip under the orchard fence, so the props behind the west cottages leave no pockets). Its trees stay at x0-1 and x19-31.
- **Note for the plaza branch:** `gridRows` replaces whole rows. If the plaza overlay also edits row 18, whichever overlay sorts later wins the whole row (this one, `detail_zzz_`, sorts last). The second branch to merge should restate row 18 as the plaza's row with x18 = `g`.
- Old saves: no coordinate in rows 0-17 moved; Fernbrook's `safe` (5,6) and `respawn` are unchanged.

### 2b. Building variety (BUILDING_VARIETY.md rows 28-30)

| Roof id | Cells | Roof | Shape | Wall | Door | Window | Trim | Porch |
|---|---|---|---|---|---|---|---|---|
| `fbh_press` | x2-7, roof rows 21-22, wall row 23 | `roof_thatch_y` | `gable+chimney` | `wall_batten_o` | `door_barn` | `win_lamp` | `r` | `fbh_press_porch_barrel`, `fbh_press_porch_hay` |
| `fbh_picker` | x10-15, roof rows 21-22, wall row 23 | `roof_tile_r` | `steep` | `wall_yellow` | `door_red` | `win_round` | `g` | `fbh_picker_porch_basket`, `fbh_picker_porch_crate` |
| `fbh_stitch` | x22-27, roof rows 21-22, wall row 23 | `roof_shingle_p` | `gable+bunting` | `wall_plaster` | `door_tall_t` | `win_tall` | `p` | `fbh_stitch_porch_line`, `fbh_stitch_porch_planter` |

Doors sit on the wall row (Market Row style) and are entered from the step below: `fbh_press` (4,23), `fbh_picker` (12,23), `fbh_stitch` (24,23). Each step (x,24) has a `door_step` decal.

### 2c. Lane objects

| Id | Kind | Tile | Sprite / target |
|---|---|---|---|
| `fbh_press` | door | 4,23 |  -> fbh_press_in |
| `fbh_picker` | door | 12,23 |  -> fbh_picker_in |
| `fbh_stitch` | door | 24,23 |  -> fbh_stitch_in |
| `fbh_lane_sign` | sign | 19,20 |   |
| `fbh_press_porch_barrel` | prop | 1,24 | barrel  |
| `fbh_press_porch_hay` | prop | 7,24 | hay_bale  |
| `fbh_picker_porch_basket` | prop | 10,24 | orchard_basket  |
| `fbh_picker_porch_crate` | prop | 14,24 | crate  |
| `fbh_stitch_porch_line` | prop | 29,23 | laundry_line  |
| `fbh_stitch_porch_planter` | prop | 22,24 | planter_geranium  |
| `fbh_gate_post` | prop | 19,21 | fence_post  |
| `fbh_woodpile_out` | prop | 8,22 | woodpile  |
| `fbh_cart` | prop | 20,23 | cart_prop  |
| `fbh_bush_w` | prop | 1,27 | bush  |
| `fbh_bush_e` | prop | 30,27 | bush  |
| `fbh_log` | prop | 9,27 | log  |
| `fbh_windfalls` | prop | 13,27 | apple_crate  |
| `fbh_stump` | prop | 16,29 | stump  |
| `fbh_bench` | prop | 19,29 | bench_long  |
| `fbh_flowers_w` | prop | 3,20 | flower_clump  |
| `fbh_flowers_e` | prop | 29,20 | flower_clump  |
| `fbh_back_bush_a` | prop | 5,20 | bush  |
| `fbh_back_planter` | prop | 7,20 | planter_round  |
| `fbh_rain_barrel` | prop | 9,21 | barrel  |
| `fbh_kindling` | prop | 8,23 | crate  |
| `fbh_back_flowers` | prop | 11,20 | flower_clump  |
| `fbh_back_bush_b` | prop | 13,20 | bush  |
| `fbh_back_bush_c` | prop | 21,20 | bush  |
| `fbh_lane_flowers` | prop | 20,26 | flower_clump  |
| `fbh_step_press` | decal | 4,24 | door_step  |
| `fbh_step_picker` | decal | 12,24 | door_step  |
| `fbh_step_stitch` | decal | 24,24 | door_step  |
| `fbh_leaf_3_26` | decal | 3,26 | leaf_litter  |
| `fbh_leaf_12_26` | decal | 12,26 | leaf_litter  |
| `fbh_leaf_26_26` | decal | 26,26 | leaf_litter  |
| `fbh_leaf_15_20` | decal | 15,20 | leaf_litter  |
| `fbh_puddle_20_27` | decal | 20,27 | puddle  |
| `fbh_puddle_10_26` | decal | 10,26 | puddle  |

## 3. Skins (sprites.js)

All three use the shared INTERIOR_WALLS kit with their own wall row, the shared `wall_shadow` and `window_light` decals, and floor tiles in `FERNBROOK_HOMES_TILES`, which are recolours of existing grids (no new PAL key, no outside art):

| Skin | `.` floor (+ `_b`, `_c`) | Other | Rug `=` | Mat | Decal | Wall row (c C L f F T B S R G W D) | Source grid |
|---|---|---|---|---|---|---|---|
| `fbh_press` | `floor_press` | `,` `press_flag` (+ `_b`, `_c`) | `rug_press` | `mat_press` | `j` apple_speck | `FyBGBrFFFcwB` | coach_plank (A->G, G->B), hall_flag (E->F), rug_kitchen |
| `fbh_picker` | `floor_picker` | | `rug_picker` | `mat_picker` | `q` leaf_orchard | `ElFCDgEFGcwB` | house_wardrobe herringbone in y/A, boards 8 px; rug_fern (g->D, l->g) |
| `fbh_stitch` | `floor_stitch` | | `rug_patch` | `mat_stitch` | `j` leaf_scatter | `mhdwhpmdpcsp` | floor_loft (w->h, C->K); patchwork of 8 px squares in r b p l with a w running stitch |

Measured: floor share 42 % / 52 % / 53 % (D88 cap 70 %), props 15 / 16 / 13 for 111 / 109 / 109 walkable tiles (need 10 / 10 / 10), at least 4 decals each, no prop sprite used more than 4 times, no run of more than 6 identical cells.

## 4. Rooms

### 4a. `fbh_press_in`: Press House (12x14, skin `fbh_press`, windows [3, 8])

```
############
#WWWWWWWWWW#
#uvuvuvuvuv#
#,,,,......#
#,,,,......#
#,,,,..j...#
#..........#
#....===...#
#....===...#
#...j......#
#.j.....j..#
#......j...#
#......j...#
#####m######
```

Mat `fbh_press_mat` at 5,13 returns to Fernbrook 4,24 facing down. Arrival tile 5,12.

| Prop | Tile | Sprite | Line |
|---|---|---|---|
| `fbh_press_barrel_a` | 1,3 | `barrel` | A barrel of pressed apples. It smells sweet. |
| `fbh_press_barrel_b` | 2,3 | `barrel` | This barrel is still empty. |
| `fbh_press_bench` | 3,3 | `kitchen_counter` | The press bench. Sticky to the touch. |
| `fbh_press_jug_a` | 4,3 | `cider_jug` | A jug of fresh cider. The cork is in. |
| `fbh_press_crate` | 1,5 | `apple_crate` | Apples waiting for the press. |
| `fbh_hearth` | 9,3 | `hearth` | A low fire. A pot of something warm sits on it. |
| `fbh_woodpile` | 10,3 | `woodpile` | Split apple wood. It burns sweet. |
| `fbh_press_table` | 6,7 | `table_kitchen` | A table with two cups and an apple core. |
| `fbh_press_stool_a` | 5,7 | `stool` |  |
| `fbh_press_stool_b` | 7,7 | `stool` |  |
| `fbh_press_rack` | 1,8 | `coat_rack` | An apron hangs here. It has seen a lot of apples. |
| `fbh_press_jug_b` | 10,7 | `cider_jug` | Last week's cider. It has a little fizz now. |
| `fbh_press_bed` | 1,11 | `bed_quilt_o` | A neat bed with an orange quilt. |
| `fbh_press_basket` | 10,11 | `basket` | Clean cloths for straining. |
| `fbh_press_pot` | 10,12 | `plant_pot` | A little apple seedling in a pot. |

### 4b. `fbh_picker_in`: Picker's Cottage (14x12, skin `fbh_picker`, windows [3, 10])

```
##############
#WWWWWWWWWWWW#
#uvuvuvuvuvuv#
#............#
#............#
#...====.....#
#...====..q..#
#............#
#.q..........#
#.......q....#
#............#
######m#######
```

Mat `fbh_picker_mat` at 6,11 returns to Fernbrook 12,24 facing down. Arrival tile 6,10.

| Prop | Tile | Sprite | Line |
|---|---|---|---|
| `fbh_picker_bed_a` | 1,3 | `bed_single_g` | A bed with a green blanket. Grown-up size. |
| `fbh_picker_bed_b` | 2,3 | `bed_single_b` | A small bed. There is an apple core under the pillow. |
| `fbh_picker_stove` | 6,3 | `stove` | The stove is warm. Something with apples in it. |
| `fbh_picker_basket_a` | 9,3 | `orchard_basket` | An empty picking basket, ready for the morning. |
| `fbh_picker_basket_b` | 10,3 | `orchard_basket` | Another picking basket. The handle is mended. |
| `fbh_picker_crate_a` | 11,3 | `apple_crate` | Today's apples, sorted big to small. |
| `fbh_picker_crate_b` | 12,3 | `apple_crate` | The small ones. They go to the press. |
| `fbh_picker_crate_c` | 12,5 | `crate` | An empty crate, stacked for tomorrow. |
| `fbh_picker_table` | 4,5 | `table_small` | A small table. Somebody left a half-eaten apple. |
| `fbh_picker_game` | 6,6 | `domino_table` | A game left halfway through. Nobody is winning. |
| `fbh_picker_beanbag` | 7,5 | `beanbag` | A squashy seat. It has been sat on a lot. |
| `fbh_picker_pegs` | 1,6 | `coat_pegs` | Two coats, one big and one small. |
| `fbh_picker_laundry` | 1,9 | `laundry_basket` | Washing with grass stains on every knee. |
| `fbh_picker_plant` | 12,7 | `plant_pot_big` | A leafy plant by the window. |
| `fbh_picker_petbed` | 12,9 | `dog_bed_big` | A Walkling bed. Warm, and a bit hairy. |
| `fbh_picker_bowl` | 11,10 | `water_bowl` | A water bowl, filled to the brim. |

### 4c. `fbh_stitch_in`: Stitcher's Loft (11x15, skin `fbh_stitch`, windows [3, 7])

```
###########
#WWWWWWWWW#
#uvuvuvuvu#
#.........#
#.........#
#.===.....#
#.===..j..#
#.===.....#
#.........#
#.........#
#.....j...#
#...j.....#
#..j......#
#.........#
#####m#####
```

Mat `fbh_stitch_mat` at 5,14 returns to Fernbrook 24,24 facing down. Arrival tile 5,13.

| Prop | Tile | Sprite | Line |
|---|---|---|---|
| `fbh_stitch_lamp` | 3,3 | `lamp_stand` | A reading lamp, angled at the sewing table. |
| `fbh_stitch_desk` | 4,3 | `desk_small` | The sewing table. Thread, chalk and a thimble. |
| `fbh_stitch_form` | 8,3 | `mannequin` | A dress form wearing half a jacket. |
| `fbh_stitch_curtain` | 9,3 | `mr_curtain` | A curtain on a rail. Fabric scraps hang behind it. |
| `fbh_quilt_a` | 2,5 | `quilt_c` | A blue quilt, folded in four. |
| `fbh_quilt_b` | 3,6 | `quilt_r` | A red quilt. The corner is not finished yet. |
| `fbh_quilt_c` | 4,7 | `quilt_y` | A yellow quilt, soft as a cushion. |
| `fbh_stitch_wardrobe` | 9,6 | `wardrobe` | A wardrobe full of folded fabric. |
| `fbh_stitch_mirror` | 9,8 | `mirror` | A tall mirror for fittings. |
| `fbh_stitch_easel` | 1,9 | `easel` | Pattern sketches. Squares, and more squares. |
| `fbh_stitch_bed` | 1,12 | `bed_single_p` | A bed under a patchwork cover. |
| `fbh_stitch_yarn` | 8,12 | `basket` | A basket of yarn balls. |
| `fbh_stitch_laundry` | 9,12 | `laundry_basket` | Quilts waiting to be aired. |

## 5. Residents (placeholders, D1251)

Role labels only, no given names; none collides with an existing NPC name (checked with `rg` over `data/`, `game.js`, `quests.js`, `keeper.js`, `news.js`). Each has a `data/reputation.json` cast entry (faction none, base 50) because contacts and rep are keyed by name. Looks are civilian (no Keeper green coat, no Glimmerwell wine or soot; AGENTS rule 11). Lines are neutral town life: no faction pick, no Trial, no story fact.

| Id | Label | Where | Look | Line | Chatter |
|---|---|---|---|---|---|
| `fbh_presser` | Cider Presser | fbh_press_in 4,4 | `fbh_presser` (skin 4, hair short, hairCol d, outfit vest, outfitCol o, accent y) | First pressing of the day. Mind the floor, it gets sticky by noon. | Apples in, cider out. |
| `fbh_picker_res` | Apple Picker | fbh_picker_in 9,4 | `fbh_picker_res` (skin 2, hair pony, hairCol r, outfit tunic, outfitCol l, accent r, accessory satchel) | Up the ladder at dawn, home by supper. The baskets never stay empty for long. | Ladder's by the door. |
| `fbh_young_picker` | Young Picker | fbh_picker_in 9,7 | `fbh_young_picker` (skin 2, hair spiky, hairCol r, outfit hoodie, outfitCol y, accent g, accessory cap) | I picked up forty apples today! They were on the ground, but it still counts. | Forty apples! |
| `fbh_stitcher` | Quilt Stitcher | fbh_stitch_in 4,4 | `fbh_stitcher` (skin 5, hair bun, hairCol h, outfit sweater, outfitCol p, accent w, accessory glasses) | Every square in that rug was a shirt once. Sit if you like, just not on the pins. | Mind the pins. |
| `fbh_hedger` | Hedge Trimmer | fernbrook 4,26 | `fbh_hedger` (skin 3, hair buzz, hairCol n, outfit vest, outfitCol t, accent o, accessory goggles) | One snip too many and the whole hedge sulks. I go slow. | Snip, snip. |
| `fbh_gatherer` | Windfall Gatherer | fernbrook 13,28 | `fbh_gatherer` (skin 6, hair curls, hairCol k, outfit dress, outfitCol y, accent r, accessory scarf) | Windfalls go to the press. The bruised ones go to the Walklings. Nobody minds. | Windfalls! |

## 6. Previews (rule 9)

`handoff/shots/fernbrook_homes/`, each at 320x568 and 390x844:
- `before-south_edge-*.png`: Fernbrook's south edge before this build (origin/main eabac9b).
- `after-south_edge-*.png`: the same spot after, with the gate.
- `after-lane_west-*.png`, `after-lane_mid-*.png`, `after-lane_east-*.png`: the lane, the three cottages, the flower patch and the pond.
- `after-press_in-*.png`, `after-picker_in-*.png`, `after-stitch_in-*.png`: the three rooms.

## 7. Decisions

| Id | Colour | Call |
|---|---|---|
| D1248 | red, open | Vincent's yes on the previews before deploy (rule 9) **SETTLED by Vincent (Tue Nov 3, 2026, 7:52 AM ET):** yes: the three south-lane homes deploy (rule 9 previews approved) |
| D1249 | red, settled | Vincent's ask and choice: enterable NPC homes at the bottom of Fernbrook (archive) |
| D1250 | red, open | Fernbrook grows south to 32x32: exception to D81, precedent D170; settles with D1248 **SETTLED by Vincent (Tue Nov 3, 2026, 7:52 AM ET):** yes: Fernbrook grows south to 32x32 (exception to D81, settles with D1248) |
| D1251 | green, Design sign-off | Placeholder resident labels, looks, lines, room names and the lane sign |
| D1252 | green, engineer | Three homes not four, the gate at x17-18 with back gardens on row 19 x2-16, on-wall doors, the flower patch, trees and pond |

## 8. Open questions

- **Q1 (rule 9 inspiration step):** no sub-agent or Gemini was available in the build session, so §1 was written by the build agent. Default: Design reviews §1 (or re-runs it) before Vincent sees the previews.
- **Q2:** three homes or four? Default three (a fourth only fits with 4-wide houses, which would look cramped next to the 6-wide Lantern House).
- **Q3:** should the lane show the "contested Fernbrook" signs that #255 slice 7 plans? Default: no; slice 7 owns that dressing and can add to the lane by id.
- **Q4:** the lane has no zone, so no wild Walklings. Default: keep it a quiet street; the plaza branch owns Fernbrook's `zones`.
- **Q5:** real names and lines for the six residents (D1251); room names and the lane sign text are placeholders too.

## 9. Conflict note: open work that touches Fernbrook (checked Mon Nov 2, 2026)

Per the NEW DIRECTION (Vincent, 3:55 PM ET; open PRs reviewed for Day 1 and Trial 1 conflicts). This branch keeps every Fernbrook change in its own overlay, `data/detail_zzz_fernbrook_homes.json`, and does not touch `data/fernbrook_rooms.json`, `fb_hall_in`, `REGION_MAP.nodes.fernbrook.hold`, any story flag, `cond()` gate, quest step, the faction pick or the save.

| Planned work | What it touches | Overlap with this branch | Risk |
|---|---|---|---|
| #255 slice 7, contested Fernbrook (`claude/fernbrook-contested`) | new signs, props and NPC lines on `fernbrook` reading the `split` hold | Both add objects to `fernbrook` (this branch: ids `fbh_*` on rows 19-31 only). Both move the `tests/tap_interact.spec.js` counts and probably the `maps_b4` props-per-screen sweep | Low: count pins need a re-add at merge; slice 7 may want its signs on the lane too (Q3) |
| #255 slice 8, `fb_hall_in` roster (three Keeper holders) | `data/fernbrook_rooms.json` `trainers` entries and `fb_hall_in` objs | None in data. Both move the `tap_interact` counts (the `trainer` and `talk` keys) | Low: count pins |
| #255 slice 8b, the hold flip at the pick | `REGION_MAP.nodes.fernbrook.hold`, `matchHold` (`game.js` ~11880-11960) | This branch edits one nearby line, `REGION_MAP.interiors` (`fbh_*_in: 'fernbrook'`). The new rooms resolve to the `fernbrook` node, so they follow the flip | Low: separate lines; no logic shared |
| #255 Fernbrook room edits in `data/fernbrook_rooms.json` | its `slicePatch` runs after every detail overlay | If it ever `set`s Fernbrook `w`/`h` or `gridRows` 18+, it would override this overlay | Low today: #255 plans only `replaceObjs` there |
| Fernbrook stream-field plaza (other branch, D1243-D1247) | rows 9-18, x17-30, and `zones` | Row 18: this branch replaces the whole row to open x18. If the plaza also edits row 18, the later-sorting overlay wins the whole row (this one sorts last) | Medium: whoever merges second restates row 18 with both edits |

Residents' lines are neutral town life: none mentions the faction pick, a side, the Trial, or Fen, so the re-sequenced Day 1 flow does not touch them. Saves: no new field; the save stays `pixelpets.save.v2` with `v` 2.
