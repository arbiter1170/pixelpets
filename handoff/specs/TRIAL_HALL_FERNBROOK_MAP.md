# TRIAL_HALL_FERNBROOK_MAP: the contested Fernbrook Trial Hall (`fb_hall_in`)

Target path: `handoff/specs/TRIAL_HALL_FERNBROOK_MAP.md` (PUBLIC repo; not `docs/`). **Spec only.** Nothing here is built. This is a room redesign (AGENTS rule 9), so **nothing builds or deploys until Vincent has seen the before/after previews (§10) and said yes.** The Supervisor sends them to him. All player text below is PLACEHOLDER; Story writes the real lines.

## 1. Status and sources

| Item | Value |
|---|---|
| Status | Draft v0.2, Mon Nov 2, 2026, ~11:30 PM ET. v0.2 answers "the two sides look a little rubbery": a tone bible (§6.3), redrawn draft art with material and light cues (§8, `draft_art_sheet.png`), and Keeper wall dressing (honour board, oil sconces). v0.1 was earlier the same evening. Waits on Morgan (Chief of Staff), then Vincent (rule 9 previews, red rows D1189, D1190, D1192). |
| Ask | Vincent: the Hall must read as a contested building, and its design language must show the power struggle between the Keepers and Glimmerwell. |
| Builds on | Draft PR #261 (`claude/day1-trial1-build-gtkcop`, bc38b01): the three mixed holders `h1_cadet`, `h1_challenger`, `h1_local`, the sign "FERNBROOK TRIAL HALL · Master Fen", and the Fernbrook hold flip (D1171). Positions and line numbers marked "#261" are on that branch. |
| Read first | `handoff/specs/DAY1_TRIAL1_FLOW.md` (§8 roster as amended by D1170, §9 flip; #261 carries v0.4), `data/fernbrook_rooms.json` (`fb_hall_in`), `REGION_MAP.nodes.fernbrook` (main `game.js:11880`; #261 `game.js:12069-12073`), `.cursor/skills/gamedev-level-design`, `.cursor/skills/walklings-room-packet`, `.cursor/skills/walklings-decision-ids` |
| Code base | origin/main `041c592` and #261 `bc38b01` |
| Previews | `handoff/shots/trial_hall_fernbrook/` (§10). "Before" is #261's build. "After" is the same build with this spec's grid and objects, plus **draft** art injected at runtime (not committed; Pia redraws). |
| Decision ids | D1189-D1196, reserved in this PR (§14) |

## 2. Diagnosis and goal

**Diagnosis (one line):** today the Hall reads as one calm flower garden, so nothing in the room says Fernbrook is contested; the fight lives only in signs outside and in the holders' lines.

**Goal:** the room itself makes the argument. The old Keeper hall (worn stone, the Keeper crest, old banners) is being taken over by Glimmerwell (sponsor banners, Comfort Lamps, polished tile laid over the old stone, a "brought to you by" plaque). **One vertical seam splits the room:** the west half stays Keeper, the east half is Glimmerwell-branded. The holder climbs the zig-zag path and crosses that seam on every tier, so the choice is felt before it is made. After the pick, the room shows who won.

## 3. Inspiration (walklings-room-packet step 2)

Run with a sub-agent on Mon Nov 2, 2026, ~10:15 PM ET. Reference only; nothing is copied.

- **Mood:** an old garden hall caught halfway through a takeover. One side is quiet, worn and green. The other is shiny, loud, red and black.
- **References (situations, no places or brands):**
  - a historic railway hall with a retail refit (new fittings bolted onto old structure);
  - a stadium naming-rights swap (new sign over old, old one peeking out);
  - a church nave half cleaned under scaffolding (a hard line where "clean" stops);
  - a heritage pub bought by a chain (warm wood next to cold glow);
  - a square with one half repaved (a crisp material edge at the floor);
  - a shared notice board (hand-written slips under glossy posters);
  - roadworks rope and stanchions ("not ours yet").
- **Layouts considered:**
  - A. **Vertical seam (picked).**
  - B. Diagonal creep from the door. Rejected: on a tile grid it becomes a sawtooth and blurs on a phone.
  - C. Tiers (lower ledges Glimmerwell, upper Keeper). Rejected: it reads as progress, not a contest, and never shows both sides on one screen.
- **Why A:** the room is 16 wide and the 320 view is 10 tiles, so the camera can only scroll 0 to 6 tiles. A seam between x 7 and x 8 is always on screen at both widths (§9). The zig-zag crosses it six times.
- **Pitfalls the brief named, and what this spec does:**
  - Red on black is low contrast on a phone. The Glimmerwell floor is a light polished grey; red appears only as thin accents.
  - Texture noise. One texture per half, with the detail kept at the seam.
  - Mirror symmetry looks like decoration. Glimmerwell is straight, gridded and repeated; the Keeper side is irregular and worn.
  - Text can't be read at 320. The crest shape and the lamp shape are the icons.

## 4. Metrics (gamedev-level-design step 1)

| Metric | Value | Source |
|---|---|---|
| Room | 16 x 24 tiles, 16 px tiles | `fernbrook_rooms.json` |
| Room camera, 390 x 844 (modern) | scale 2; canvas 195 x 344 px = **12.2 x 21.5 tiles** | measured in #261's build (`roomZoomFor`, `game.js:1794`) |
| Room camera, 320 x 568 (modern) | scale 2; canvas 160 x 206 px = **10.0 x 12.9 tiles** | measured |
| Camera x range | 390: 0 to 3.8 tiles; 320: 0 to 6 tiles | 16 minus the visible width |
| Walk | 170 ms a step (about 5.9 tiles a second); a hop is 255 ms | `STEP_MS` `game.js:108`, `HOP_MS` |
| Holder sight | cadet 5, challenger 5, local 6 (`trainers` rows on #261, `data/detail_zz_day1.json`) | #261 |
| Path lengths the tests pin | door (7,22) to below Fen (7,5): **59** steps, 0 hops; back down: **11**, 6 hops; to the mat: **12**; door to (7,8): **50** | `tests/art_pass.spec.js:87-93` |
| Run rule | no more than 6 identical painted tiles in a row or column | `tests/maps_b8.spec.js:102-117` |

## 5. Layout at tile level

### 5.1 What stays and what changes

| Thing | Value | Changes? |
|---|---|---|
| Map id | `fb_hall_in` | no |
| Outside door | `fb_hall` at fernbrook 22,6 (`need` and `deny` as #261) | no |
| Mat warp | `fb_hall_mat` at 7,23 to fernbrook 22,6 facing down | no |
| Arrival / `safe` | 7,22 | no |
| Fen | `fen_hall` at 7,4, `look: fen`, `panel: hall1`, #261's `when`. Fen stays a Keeper (D1170) and stands on the Keeper half of the dais, under the crest | no |
| Skin | `fb_hall` (walls, wall colour row `DCECDpgEEcsJ`, windows 4, 7, 11, hop `V`) | adds six glyphs (§8.1) |
| Walk mask | every cell keeps its walk / solid / hop value | no (checked cell by cell, §12) |
| Grid | west half (x 0-7) and rows 0-2, 23 byte-identical; east half (x 8-14, rows 3-22) re-glyphed | yes |
| Holders | ids unchanged; three positions move (below) | positions only |
| Props | every existing prop id kept; 13 gain a `when` (12 east-half props and `fb_hall_lamp_w`); 3 move; 36 new objects | yes |
| Retired ids | **none** | |

### 5.2 Grids

Before (main and #261, `data/fernbrook_rooms.json`):

```
    x 0123456789012345
y  0   ################
y  1   #WWWWWWWWWWWWWW#
y  2   #uvuvuvuvuvuvuv#
y  3   #f;;;;;;;;;;;;f#
y  4   #ffddddddddddff#
y  5   #ffeeeeeeeeeeff#
y  6   #;;aaaaaaaaaa;;#
y  7   #aaaaJJVJJJJJJJ#
y  8   #;;f;;q;;j;;f;;#
y  9   #GGGGGGVGGGaaaa#
y 10   #,,f,,j,,q,,f,,#
y 11   #aaaaLLVLLLLLLL#
y 12   #b:fb:qb:jb:fb:#
y 13   #QQQQQQVQQQaaaa#
y 14   #qkkkfkkkjkkkkq#
y 15   #aaaaOOVOOOOOOO#
y 16   #jzzzzzzzzzzzzq#
y 17   #NNNNNNVNNNaaaa#
y 18   #;f;;;;;;;;;;f;#
y 19   #TTTTaaaTTTTTTT#
y 20   #f::q,,,:::j::f#
y 21   #q:j:,,,::q:j:q#
y 22   #:j:q,,,:q:j:::#
y 23   #######m########
```

After. West half and rows 0-2 and 23 unchanged. New glyphs, east half only: `P` polished tile, `Z` seam tile, `U` polished step, `M` Glimmerwell planter ledge, `I` polished dais, `C` polished dais lip (§8.1):

```
    x 0123456789012345
y  0   ################
y  1   #WWWWWWWWWWWWWW#
y  2   #uvuvuvuvuvuvuv#
y  3   #f;;;;;;ZPPPPPP#
y  4   #ffdddddIIIIIPP#
y  5   #ffeeeeeCCCCCPP#
y  6   #;;aaaaaUUUUUPP#
y  7   #aaaaJJVMMMMMMM#
y  8   #;;f;;q;ZPPPPPP#
y  9   #GGGGGGVMMMUUUU#
y 10   #,,f,,j,ZPPPPPP#
y 11   #aaaaLLVMMMMMMM#
y 12   #b:fb:qbZPPPPPP#
y 13   #QQQQQQVMMMUUUU#
y 14   #qkkkfkkZPPPPPP#
y 15   #aaaaOOVMMMMMMM#
y 16   #jzzzzzzZPPPPPP#
y 17   #NNNNNNVMMMUUUU#
y 18   #;f;;;;;ZPPPPPP#
y 19   #TTTTaaaMMMMMMM#
y 20   #f::q,,,ZPPPPPP#
y 21   #q:j:,,,ZPPPPPP#
y 22   #:j:q,,,ZPPPPPP#
y 23   #######m########
```

### 5.3 The holders and Fen

The critical path zig-zags: up through the hedge gap (x 5-7, row 19), east along row 18, up at x 11-14, west along row 16, and so on, to the top tier (row 6) and Fen on the dais. Rows 8 to 18 are one-tile corridors. **A holder must never stand where it cuts a corridor**, because a beaten holder still blocks its tile. Each spot below is in a pocket or a wide area and was checked with the path model (§12).

| Holder (#261 id) | Role (D1170) | #261 spot | New spot | Faces | Sees (in-engine `sightLines`) | Why here |
|---|---|---|---|---|---|---|
| `h1_local` | neutral Fernbrook holder | 13,18 | **8,20** | left (as #261) | 7,20 6,20 5,20 | Stands **on the seam** in the entrance garden, at the end of the rope line: the first thing you meet is someone who belongs to neither side. Sight covers the whole entry path, so the match can't be missed |
| `h1_challenger` | Glimmerwell-leaning local | 12,12 | **12,12** (no move) | left (as #261) | 11,12 to 7,12 | Already on the Glimmerwell half, in the east pocket of row 12, on polished tile between two lacquer planter tiers |
| `h1_cadet` | Keeper cadet | 12,8 | **3,5** | **right** (was left) | 4,5 to 8,5 | Moves from the Glimmerwell half to the **Keeper half of the dais**: the Keeper cadet guards the Keeper master. Not on the path; 4 tiles from Fen |
| Fen | Master Fen | 7,4 | 7,4 | down | | Keeper dais half, under the crest (7,2), one tile from the seam and the plaque (8,2) |

Facing lives on the `trainers` rows in #261's `data/detail_zz_day1.json`, not on the map object: only `h1_cadet.facing` changes (`left` to `right`). The order bottom to top stays neutral, then challenger, then cadet (#261's order).

Fen's gate (#261 `hallCrewDone`) still needs all three beaten. The cadet's sight on row 5 can be stepped around along row 4, but that changes nothing: Fen sends the holder back until the cadet is beaten.

## 6. Contested design language

### 6.1 The split

| Element | West half: the old Keeper hall (x 1-7) | Seam (x 7 / x 8) | East half: Glimmerwell (x 8-14) |
|---|---|---|---|
| Floor | today's tiers: moss, flagstone (now with a cracked, mossy variant), path, boards, earth, stepping stones; petal and leaf scatter | `Z`: the first polished tile has a lifted bright lip (`w`), a soot shadow (`N`) and moss (`g`/`l`) poking through a warm crack (`F`) | `P`: one large polished slab per tile: `h` field, `w` bevel light top-left, `K` bevel shade bottom-right, `m` joint, a diagonal `w` reflection streak (variant: a subtle `K` vein instead). No scatter |
| Ledges | today's flower hedges, each tier its own flower | the hop column `V` (x 7) stays on the Keeper side, untouched | `M`: identical black lacquer planter boxes with a chrome rim, a wine enamel band and a flat-clipped hedge top. Every tier the same |
| Steps (gaps) | today's `hall_step` | | `U`: two polished treads with chrome nosing and small red anti-slip marks. Light, so they read as walkable, not as ledge |
| Dais | cream `hall_dais`, Fen stands here | the dais is split in half (x 3-7 cream, x 8-12 white) | `I` / `C`: white polished slab and lip |
| North wall row (y 2) | oil sconces (1,2) (6,2); two old mended Keeper banners (2,2) (5,2); an oak honour board with names in gold leaf (3,2); the Keeper crest (7,2) | **the crest and the plaque side by side** (7,2) (8,2), right above Fen | half-hung Glimmerwell banner over an old Keeper banner (9,2); sponsor banner (12,2) |
| Lamps | old `dais_lamp` (4,3) | | Comfort Lamps: (11,3) (13,7) (14,8) (14,18) (14,20) |
| Planters | `hedge_planter`, urns, pots as today | | `glim_planter`: one clipped ball per black box (13,10) (13,16) |
| Notice boards | Keeper board (3,20): hand-written slips, one Glimmerwell flyer pinned over a corner | | Glimmerwell board (10,20): glossy posters, one Keeper slip hanging on in a corner |
| Work in progress | | a chrome stanchion with a red velvet rope on the seam (8,21); the neutral holder stands at its end (8,20) | grout bucket and trowel (9,20); sample stand (12,20) |

The walls are not split. The Hall keeps its INTERIOR_WALLS kit and its wall colour row. The building is still the old Keeper hall; Glimmerwell has only resurfaced the floor and hung its things. That keeps the wall kit rule (room packet step 4) and keeps the story honest.

**No line on any board or poster asks the holder to join a side** (D1145). Posters describe; they don't recruit.

### 6.2 Palette key ledger (room packet step 4)

No new PAL keys. Every key below already exists in `sprites.js` (`PAL`, line 13). Owners as today.

| Side | Keys | Use |
|---|---|---|
| Keeper | existing hall tiles; `J` deep Keeper green, `y` gold, `D` sage and `A` sand (faded banner), `C` cream (hand-written slips), `F` warm shadow | crest, old banners, slips, crack |
| Glimmerwell (GLIMMERWELL_PALETTE v0.3.1, D1080) | `N` soot, `V` wine, `y` honey marks, `Q` crimson **accent only** (the Comfort Lamp's 4 sparkle px, one pin on the covered plaque; never text, never a fill) | banners, planters, plaque, board, rope, bucket |
| Glimmerwell floor | `h` field, `w` gloss and lip, `m` tile edges, `K` slate inner lines, `N` / `V` pins | `P`, `Z`, `U`, `I`, `C` |
| Green through the seam | `g`, `l` | moss in `Z` |

Distinct from every other room: no interior uses a light grey 8 px grid with soot pins (`floor_marble` is a large `h`/`w` checker, `floor_lobby_tile` is near-white, `floor_sealed` is flat white), and no room splits its floor in two.

### 6.3 Tone bible (v0.2)

**Why v0.1 looked rubbery.** Every v0.1 draft used flat, single-value fills with even outlines and no light direction. The Glimmerwell ledges were saturated lime boxes on black. Nothing said what anything was made of, so both halves read as moulded plastic. The fix is in the materials, not in more props.

**The one-line read: living versus sterile.**
- The Keeper half is alive, handmade and worn: kept by the same hands for years.
- The Glimmerwell half is new, bought and installed this month: clean, cold and identical.

**Rules for both halves:**
- One light source, top-left (the north windows): highlight top and left edges, shade bottom and right.
- At least three values per material.
- No dark outline inside a tile; outline only where a form meets the floor.
- Every new piece of art gets a 5x look on the art sheet before it goes in the room.

| | Keeper (west) | Glimmerwell (east) |
|---|---|---|
| Story the room tells | looked after for years; mended, not replaced | delivered and installed this month; replaced, not mended |
| Shape | irregular, chipped, asymmetric; each tier its own plants | straight, modular, repeated; every tile and planter identical |
| Materials (PAL ramps) | oak `G` > `A` > `F`; gold leaf `y`/`A`; mended cloth `D`/`E` with `C` thread; cracked flagstone `I` with `F` cracks; moss `E`/`g`/`l`; oil light `y` | polished slab `w`/`h`/`K` with `m` joints; black lacquer `N` with `d` gloss; chrome `w`/`h`/`m`; wine enamel `V` with `p`/`r` edge; red velvet `V`/`p`; mint glass (Comfort Lamp) |
| Light | warm and soft: window light on the north strip, oil sconces; no specular shine | hard specular shine: a diagonal gloss streak on slabs, 1 px chrome lines, a red light strip under the dais lip |
| Texture density | texture across the whole surface (cracks, grain, moss, petals), low contrast | clean fields; detail only at edges and joints, high contrast |
| Wear | patches, stitches, faded names, frayed fringe | none. Damage shows only where it meets the old stone: chips, a grout smear, moss through the crack |
| Words and signs | hand-lettered slips with a tack, gold-leaf names, chalk | engraved steel plate, a stamped honey diamond logo, printed posters all one size |
| Repetition | never the same prop twice in a row | the same planter, lamp and banner, repeated on purpose |
| Green | living and varied: moss, flowers, herbs | clipped into geometry: flat-top boxes, perfect balls |
| Red | none | accent only: enamel bands, nosing marks, light strip, plaque inlay. `Q` only in the Comfort Lamp sparkle |
| Motion (build, optional) | oil sconces flicker on an uneven 2-frame beat | Comfort Lamps sparkle all on the same beat; reduced motion shows frame 0 |

**Value check.** In a greyscale screenshot at 320, each half must still be identifiable: the Keeper half mid-to-dark and busy, the Glimmerwell half light and quiet (T12).

**Not proposed: light pools under the Comfort Lamps.** Tiles can't flip with the hold (D1194), so a pool would keep glowing after the Keepers cover the lamps. If the engine later gets a light layer or hold-based tiles, pools are the next step.

The same language carries outside the Hall. POST_TRIAL_CRACKDOWN (`handoff/specs/POST_TRIAL_CRACKDOWN.md`) uses it for the Keeper officers and their vehicles.

## 7. Before and after the pick

### 7.1 The read

Every prop that changes reads **the same hold as D1171**: the `REGION_MAP.nodes.fernbrook.hold` rules on #261 (`game.js:12071-12073`):

| State | Hold id | `when` (copied from the hold rules) |
|---|---|---|
| contested | `split` | `["!story.side_pick_done \| !story.seal1"]` |
| Glimmerwell holds | `glimmer` | `["story.side_pick_done", "story.seal1", "story.side=glimmer"]` |
| Keepers hold | `keepers` | `["story.side_pick_done", "story.seal1", "!story.side=glimmer"]` |
| contested + Glimmerwell holds | not `keepers` | `["!story.side_pick_done \| !story.seal1 \| story.side=glimmer"]` |
| contested + Keepers hold | not `glimmer` | `["!story.side_pick_done \| !story.seal1 \| !story.side=glimmer"]` |

`cond()` already reads `|`, `!` and `k=v` (#261 `game.js:4738`), so these strings need no engine change. D1191 (yellow) proposes a one-line `hold:<node>=<id>` term so the props read `mapHold()` itself and can never drift from the rules; the strings above are the fallback.

On a new save the hold flips only at the pick result, after Seal 1 and the post-Trial slot (D1142, D1175). **So every holder fights Trial 1 in the contested Hall**; the flipped Hall is what they see when they come back. Saves are untouched: no new flag, nothing written, `v` stays 2.

### 7.2 What changes, at a glance

| | Contested (during Trial 1) | Keepers hold | Glimmerwell holds |
|---|---|---|---|
| Floor and ledges | split (§6) | **still split** (D1194): the polish stays, pried tiles are crated | still split; west keeps its moss |
| Crest (7,2) | crest | crest | covered by a black cloth with a red tag |
| Plaque (8,2) | "brought to you by" plaque | a hand-lettered slip pinned over it | plaque |
| North wall | sconces, honour board and two old Keeper banners west; half-hung banner at the seam; sponsor banner east | all Keeper; the seam banner hangs straight; east sponsor banner down | sponsor banners everywhere; sconces and honour board taken down |
| Lamps | dais lamp west, Comfort Lamps east | dais lamps both sides; one Comfort Lamp left switched off under a cloth | Comfort Lamps both sides; old lamps boxed by the door |
| East props | Glimmerwell planters, stand, lamps | today's flower props come back (hedges, pot, bowl, basket, bench, stool, spout, tier lamp) | Glimmerwell props |
| Boards | each side's board, each with one poster from the other side | both boards Keeper | both boards Glimmerwell |
| Seam work | rope line and grout bucket | gone; crate of pried-up tiles | gone |

### 7.3 Every object, with its `when`

Generated from the checked layout. "Shows when" names a row of §7.1. Holder and Fen lines are #261's and Story's. New lines are PLACEHOLDER; each is 110 characters or fewer, and the wording scan is clean.

| id | x,y | sprite | shows when | status | line (PLACEHOLDER, Story) |
|---|---|---|---|---|---|
| `fen_hall` | 7,4 | `fen` | own when (unchanged) | kept | (#261 / Story) |
| `fb_hall_lamp_w` | 4,3 | `dais_lamp` | contested + Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_lamp_e` | 11,3 | `dais_lamp` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_ribbon_w` | 2,6 | `ribbon_stand` | always | kept | (unchanged) |
| `fb_hall_ribbon_e` | 13,6 | `ribbon_stand` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_hedge_a` | 2,8 | `hedge_planter` | always | kept | (unchanged) |
| `fb_hall_hedge_b` | 13,10 | `hedge_planter` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_hedge_c` | 2,12 | `hedge_planter` | always | kept | (unchanged) |
| `fb_hall_hedge_d` | 13,16 | `hedge_planter` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_urn` | 2,18 | `bloom_urn` | always | kept | (unchanged) |
| `fb_hall_pot` | 14,18 | `bloom_pot` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_bowl_w` | 4,20 | `petal_bowl` | always | kept | (unchanged) |
| `fb_hall_bowl_e` | 12,20 | `petal_bowl` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_basket` | 9,20 | `bloom_basket` | Keepers hold | kept (moved from 9,21; when added) | (unchanged) |
| `fb_hall_bench_w` | 2,22 | `bloom_bench` | always | kept (moved from 2,21) | (unchanged) |
| `fb_hall_bench_e` | 12,21 | `bloom_bench` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_jar` | 1,22 | `petal_jar` | always | kept (moved from 1,21) | (unchanged) |
| `fb_hall_stool` | 14,21 | `bloom_stool` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_cushion` | 4,22 | `petal_cushion` | always | kept | (unchanged) |
| `fb_hall_t6_lamp` | 13,7 | `orchard_lamp` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_t5_pot` | 3,9 | `plant_pot` | always | kept | (unchanged) |
| `fb_hall_t4_spout` | 12,11 | `fountain_small` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_t3_herbs` | 4,13 | `herb_rack` | always | kept | (unchanged) |
| `fb_hall_t2_pot` | 9,15 | `bloom_pot` | Keepers hold | kept (when added) | (unchanged) |
| `fb_hall_t1_basket` | 6,17 | `orchard_basket` | always | kept | (unchanged) |
| `fb_hall_note` | 10,22 | `sign` | always | kept | (unchanged) |
| `h1_local` | 8,20 | `h1_local` | always | kept (moved from 13,18) | (#261 / Story) |
| `h1_challenger` | 12,12 | `h1_challenger` | always | kept | (#261 / Story) |
| `h1_cadet` | 3,5 | `h1_cadet` | always | kept (moved from 12,8) | (#261 / Story) |
| `fb_hall_banner_k1` | 2,2 | `banner_keeper_old` | contested + Keepers hold | NEW | An old Keeper banner. The gold lantern is faded. Someone mended the hem by hand. |
| `fb_hall_banner_k2` | 5,2 | `banner_keeper_old` | contested + Keepers hold | NEW | Another old Keeper banner. The fringe is half gone. |
| `fb_hall_banner_k1_g` | 2,2 | `banner_glim` | Glimmerwell holds | NEW | A Glimmerwell banner, black and red. It hangs where the Keeper banner was. |
| `fb_hall_banner_k2_g` | 5,2 | `banner_glim` | Glimmerwell holds | NEW | Another Glimmerwell banner. The hooks are new. |
| `fb_hall_sconce_w1` | 1,2 | `keep_lamp_wall` | contested + Keepers hold | NEW | An oil lamp in an old iron bracket. The wall above it is dark with soot. |
| `fb_hall_honour` | 3,2 | `keep_honour_board` | contested + Keepers hold | NEW | An oak board with names in gold leaf. Most have faded. The last one is still bright. |
| `fb_hall_sconce_w2` | 6,2 | `keep_lamp_wall` | contested + Keepers hold | NEW | An oil lamp. Someone trims the wick every morning. |
| `fb_hall_crest` | 7,2 | `keep_insignia` | contested + Keepers hold | NEW | The Keeper crest, carved into the old stone. |
| `fb_hall_crest_cover` | 7,2 | `crest_cover` | Glimmerwell holds | NEW | A black cloth hangs over the old crest. A small red tag says: 'Under renovation.' |
| `fb_hall_plaque` | 8,2 | `glim_plaque` | contested + Glimmerwell holds | NEW | A new plate, bolted beside the crest: 'FERNBROOK TRIAL HALL. Brought to you by Glimmerwell Co.' |
| `fb_hall_plaque_k` | 8,2 | `glim_plaque_covered` | Keepers hold | NEW | A hand-lettered slip is pinned over the new plate. It just says: 'Fernbrook Trial Hall.' |
| `fb_hall_banner_half` | 9,2 | `banner_glim_half` | contested only | NEW | A Glimmerwell banner, pinned up at one corner. Under it, an old Keeper banner still shows. |
| `fb_hall_banner_half_g` | 9,2 | `banner_glim` | Glimmerwell holds | NEW | A Glimmerwell banner, pinned up straight now. |
| `fb_hall_banner_half_k` | 9,2 | `banner_keeper_old` | Keepers hold | NEW | The old Keeper banner, hanging straight again. |
| `fb_hall_banner_g1` | 12,2 | `banner_glim` | contested + Glimmerwell holds | NEW | A Glimmerwell banner. Black, red and very clean. |
| `fb_hall_clamp_w` | 4,3 | `comfort_lamp` | Glimmerwell holds | NEW | A Comfort Lamp where the old dais lamp stood. It hums a little. |
| `fb_hall_clamp_e` | 11,3 | `comfort_lamp` | contested + Glimmerwell holds | NEW | A Comfort Lamp by the dais. Its glass is spotless. |
| `fb_hall_banner_g2` | 13,6 | `banner_glim_stand` | contested + Glimmerwell holds | NEW | A Glimmerwell banner on a stand, where the ribbons were. |
| `fb_hall_clamp_t6` | 13,7 | `comfort_lamp` | contested + Glimmerwell holds | NEW | A Comfort Lamp clipped to the top planter. Fen's dais is one more step up. |
| `fb_hall_clamp_8` | 14,8 | `comfort_lamp` | contested + Glimmerwell holds | NEW | A Comfort Lamp. A small red tag hangs off it. |
| `fb_hall_clamp_8_off` | 14,8 | `comfort_lamp_off` | Keepers hold | NEW | A Comfort Lamp, switched off, with a cloth thrown over it. |
| `fb_hall_planter_g1` | 13,10 | `glim_planter` | contested + Glimmerwell holds | NEW | A black planter with one round, clipped shrub. Every one is the same. |
| `fb_hall_planter_g2` | 13,16 | `glim_planter` | contested + Glimmerwell holds | NEW | Another black planter. The shrub is trimmed into a perfect ball. |
| `fb_hall_clamp_18` | 14,18 | `comfort_lamp` | contested + Glimmerwell holds | NEW | A Comfort Lamp. The floor under it shines. |
| `fb_hall_board_k` | 3,20 | `bulletin_keepers_x` | contested only | NEW | The Keeper board, all hand-written slips. A Glimmerwell flyer is pinned over one corner. |
| `fb_hall_board_k_k` | 3,20 | `bulletin_keepers` | Keepers hold | NEW | The Keeper board. Only hand-written slips now. |
| `fb_hall_board_k_g` | 3,20 | `bulletin_glimmer` | Glimmerwell holds | NEW | Glimmerwell posters cover the old Keeper board, edge to edge. |
| `fb_hall_board_g` | 10,20 | `bulletin_glimmer_x` | contested only | NEW | A Glimmerwell board of bright posters, all one size. One hand-written Keeper slip hangs on in a corner. |
| `fb_hall_board_g_g` | 10,20 | `bulletin_glimmer` | Glimmerwell holds | NEW | A Glimmerwell board. Every poster is new. |
| `fb_hall_board_g_k` | 10,20 | `bulletin_keepers` | Keepers hold | NEW | The posters are gone. Keeper slips are pinned up in their place. |
| `fb_hall_rope` | 8,21 | `seam_rope` | contested only | NEW | A rope line where the new tile starts. A tag: 'Glimmerwell Co. works. Mind the polish.' |
| `fb_hall_grout` | 9,20 | `grout_bucket` | contested only | NEW | A bucket of grout and a trowel. The work isn't finished. |
| `fb_hall_tilecrate` | 14,22 | `tile_crate` | Keepers hold | NEW | A crate of shiny tiles, pried up and stacked. |
| `fb_hall_lampbox` | 13,22 | `keep_crate` | Glimmerwell holds | NEW | A crate of the old hall lamps, boxed up by the door. |
| `fb_hall_stand` | 12,20 | `glimmer_stand` | contested + Glimmerwell holds | NEW | A Glimmerwell stand with neat rows of samples. Nobody is minding it. |
| `fb_hall_clamp_21` | 14,20 | `comfort_lamp` | contested + Glimmerwell holds | NEW | A Comfort Lamp by the door. It's the first thing you see. |

## 8. Tiles and props for Pia (Sprites)

### 8.1 New tiles (16 x 16, opaque, `TILES`; skin `fb_hall`)

| Glyph | Tile | Variants | Walk | Draft used in the previews | What Pia should keep |
|---|---|---|---|---|---|
| `P` | `glim_tile` | `glim_tile_b` 0.35 (a subtle `K` vein, no streak) | 1 | one slab: `h` field, `w` bevel light top and left, `K` bevel shade bottom and right, `m` joint right and bottom, a 2 px diagonal `w` reflection streak | light value, big clean field, one hard gloss |
| `Z` | `glim_seam` | none (vertical runs are 3 or fewer) | 1 | a slab whose left 4-5 px are the old `I` flagstone with an uneven, chipped edge, `F` cracks, `g`/`l`/`E` moss and a `C` grout smear; then an `N` slab side and a `w` lifted lip | the slab must read as laid on top of the old floor, and the old floor as alive |
| `U` | `glim_step` | none (runs of 5 or fewer) | 1 | two `h` treads, each with a `w` chrome nosing and `m` shadow; `V` 2 px anti-slip marks at the ends | must read as walkable steps, clearly lighter than `M` |
| `M` | `hall_ledge_glim` | `hall_ledge_glim_b` 0.45 (stamped honey logo) | 0 | flat-clipped hedge top (`l` clipped edge, `g`, `E` texture, `E` gap between boxes); `w`/`h` chrome rim; `N` lacquer box with a `d` gloss stripe; `V` enamel band with an `r` gleam; `k` foot shadow | **needs the variant:** rows 7, 11, 15, 19 have 7 in a row, over the run limit of 6 |
| `I` | `glim_dais` | none | 1 | white `w` marble with `K`/`h` veins, `h` joints | white marble, plainly not the cream Keeper dais |
| `C` | `glim_dais_lip` | none | 1 | marble top, `h`/`K` riser, `m` line, a 1 px `V` light strip, `N` foot | light: an earlier soot draft read as a wall across the dais |

Skin entries (build): `remap` P `glim_tile`, Z `glim_seam`, U `glim_step`, M `hall_ledge_glim`, I `glim_dais`, C `glim_dais_lip`; `walk` P 1, Z 1, U 1, M 0, I 1, C 1; `variants` as above. The six glyphs have no engine-wide meaning: `game.js` and `sprites.js` have no `=== 'P'` style test on them, and the shared tile table only defines `P` (High Charity plaza stone, walk true), which the skin's walk table overrides anyway (`tileWalks`, `game.js:4753`). West half: `hall_flag_worn`, a cracked, mossy variant of `hall_flag` (variant weight 0.25; in the v0.2 previews). It only shows on the west, because the east half has no `hall_flag` cells.

### 8.2 New props (16 x 16, `WART`)

The 5x look is in `handoff/shots/trial_hall_fernbrook/draft_art_sheet.png`.

| Sprite | Side | Draft v2 (previews) | Notes for Pia |
|---|---|---|---|
| `banner_keeper_old` | Keeper | `banner_keeper` faded (`g` to `D`, `y` to `A`), `E` fold shade, a `G` patch with `F` stitches, `C` frayed fringe | faded and mended, not torn |
| `keep_honour_board` | Keeper | oak (`G` frame, `F` board, `B` foot), a gold-leaf crest band, five name lines in faded `A` and the latest in bright `y` | lore prop, history: who has held this Hall. No names are written |
| `banner_glim` | Glimmerwell | chrome rod, `N` header bar, `V` cloth with `p` folds, a honey diamond logo with a `w` glint, a straight `N` hem (no fringe) | corporate: a straight cut against the Keeper swallowtail and fringe |
| `banner_glim_stand` | Glimmerwell | `banner_glim` on a chrome pole and base | the floor version (13,6) |
| `banner_glim_half` | seam | `banner_keeper_old` with a `V` banner clipped at one corner by a chrome clip, drooping across it | the seam on the wall |
| `glim_plaque` | Glimmerwell | brushed steel (`h`, `m` frame, `w` screws), a `V` enamel strip with honey lettering, engraved `K` lines | engraved, never painted; no crimson text |
| `glim_plaque_covered` | Keepers hold | the plaque under a slightly curled `C` paper slip with `F` writing and an `F` tack | the Keepers' answer to the plaque |
| `crest_cover` | Glimmerwell holds | the crest under a black satin cloth (`N`, `d`/`k` folds) with a `V` tag | |
| `bulletin_keepers_x` | seam | `bulletin_keepers` plus a glossy `N`/`V` poster with a honey mark | |
| `bulletin_glimmer_x` | seam | `bulletin_glimmer` plus a hand-cut `C` slip with uneven edges, `F` writing and a tack | |
| `seam_rope` | Glimmerwell | chrome stanchion (`w`/`h`/`m`) with a red velvet rope (`V`/`p`) sagging to the floor | velvet rope, not plain rope: the brand's idea of a barrier |
| `grout_bucket` | seam | `N` bucket, `V` band, `d` gloss, `C` grout, a steel trowel with an `F` handle | |
| `tile_crate` | Keepers hold | an oak Keeper crate (`G`/`A`/`F`/`B`) with prised-up slabs at angles and a `C` tag | |
| `glim_planter` | Glimmerwell | a dithered topiary ball on a lacquer cube with a chrome rim, `V` band and honey dot | |
| `comfort_lamp_off` | Keepers hold | `comfort_lamp` unlit, with a `C`/`A` cloth and `F` folds | |

### 8.3 Reused as they are

`keep_insignia`, `keep_lamp_wall`, `banner_keeper` (via the faded copy), `bulletin_keepers`, `bulletin_glimmer`, `comfort_lamp` (two frames; reduced motion uses frame 0), `glimmer_stand`, `keep_crate`, `dais_lamp`, and every existing `fb_hall` tile and prop.

Total new art: 6 tiles, 3 variants (`glim_tile_b`, `hall_ledge_glim_b`, `hall_flag_worn`) and 15 props.

## 9. Readability at 390 and 320

| Check | 390 | 320 |
|---|---|---|
| Seam on screen | always: the camera's x range is 0 to 3.8, so x 8 sits at screen tile 4.2 to 8 of 12.2 | always: x range 0 to 6, so x 8 sits at screen tile 2 to 8 of 10 |
| At the door (7,22) | rows 2.5 to 24, so everything below the wall: both boards, the rope, the neutral holder, all east tiers | rows 11 to 23: both boards (3,20) (10,20), the neutral holder (8,20), the rope, the bottom four tiers |
| At the dais (7,6) | crest, plaque, Fen, cadet, every tier | rows 0 to 12: crest and plaque, Fen, the cadet (3,5), the top tiers |
| Holders on screen when they see you | yes, all three | neutral: in the door view. Challenger: you arrive on row 12 at x 11-14, where the camera is clamped right (x 6-16). Cadet: you arrive on row 6 at x 1-4, where the camera is clamped left (x 0-10) |
| Fen clear | the tile below Fen (7,5) and the dais row stay free; the nearest new object is the cadet, 4 tiles away; the crest and plaque are on the wall row, 2 tiles up | same |
| Paths clear | path lengths unchanged (59 / 11 / 12 / 50); no object on a corridor tile; every object has a reachable neighbour to read it from | same |
| Tap spacing | no new object is next to the door mat (7,23); the rope (8,21) is diagonal to the arrival tile | same |
| HUD | under the modern dock nothing covers the map (D785) | same |
| Contrast | the light polished floor keeps dark-haired holders readable; red is accent only; the walkable steps `U` are lighter than the solid planters `M` | same |

## 10. Mockups and previews

### 10.1 ASCII mockups

Legend: `#` wall, `-` wall-light strip, `D` door mat, `.` Keeper floor, `%` Keeper hedge ledge, `^` Keeper step, `v` hop, `o` Keeper dais, `|` seam tile, `:` Glimmerwell polish, `X` Glimmerwell planter ledge, `=` Glimmerwell step, `0` Glimmerwell dais, `*` prop, `F` Fen, `1` neutral holder, `2` Glimmerwell-leaning challenger, `3` Keeper cadet.

Contested (during Trial 1):

```
    x 0123456789012345
y  0   ################
y  1   ################
y  2   #***-*****--*--#
y  3   #...*...|::*:::#
y  4   #..ooooF00000::#
y  5   #..3oooo00000::#
y  6   #.*^^^^^=====*:#
y  7   #^^^^%%vXXXXX*X#
y  8   #.*.....|:::::*#
y  9   #%%*%%%vXXX====#
y 10   #.......|::::*:#
y 11   #^^^^%%vXXXXXXX#
y 12   #.*.....|:::2::#
y 13   #%%%*%%vXXX====#
y 14   #.......|::::::#
y 15   #^^^^%%vXXXXXXX#
y 16   #.......|::::*:#
y 17   #%%%%%*vXXX====#
y 18   #.*.....|:::::*#
y 19   #%%%%^^^XXXXXXX#
y 20   #..**...1**:*:*#
y 21   #.......*::::::#
y 22   #**.*...|:*::::#
y 23   #######D########
```

Keepers hold:

```
    x 0123456789012345
y  0   ################
y  1   ################
y  2   #***-*****-----#
y  3   #...*...|::*:::#
y  4   #..ooooF00000::#
y  5   #..3oooo00000::#
y  6   #.*^^^^^=====*:#
y  7   #^^^^%%vXXXXX*X#
y  8   #.*.....|:::::*#
y  9   #%%*%%%vXXX====#
y 10   #.......|::::*:#
y 11   #^^^^%%vXXXX*XX#
y 12   #.*.....|:::2::#
y 13   #%%%*%%vXXX====#
y 14   #.......|::::::#
y 15   #^^^^%%vX*XXXXX#
y 16   #.......|::::*:#
y 17   #%%%%%*vXXX====#
y 18   #.*.....|:::::*#
y 19   #%%%%^^^XXXXXXX#
y 20   #..**...1**:*::#
y 21   #.......|:::*:*#
y 22   #**.*...|:*:::*#
y 23   #######D########
```

Glimmerwell holds:

```
    x 0123456789012345
y  0   ################
y  1   ################
y  2   #-*--*-***--*--#
y  3   #...*...|::*:::#
y  4   #..ooooF00000::#
y  5   #..3oooo00000::#
y  6   #.*^^^^^=====*:#
y  7   #^^^^%%vXXXXX*X#
y  8   #.*.....|:::::*#
y  9   #%%*%%%vXXX====#
y 10   #.......|::::*:#
y 11   #^^^^%%vXXXXXXX#
y 12   #.*.....|:::2::#
y 13   #%%%*%%vXXX====#
y 14   #.......|::::::#
y 15   #^^^^%%vXXXXXXX#
y 16   #.......|::::*:#
y 17   #%%%%%*vXXX====#
y 18   #.*.....|:::::*#
y 19   #%%%%^^^XXXXXXX#
y 20   #..**...1:*:*:*#
y 21   #.......|::::::#
y 22   #**.*...|:*::*:#
y 23   #######D########
```

### 10.2 Code-drawn previews (390 and 320)

In `handoff/shots/trial_hall_fernbrook/`:

- `compare-390.png`, `compare-320.png`: before, contested, Keepers hold and Glimmerwell holds, at the door and at the dais.
- `draft_art_sheet.png`: every new tile and prop at 5x, grouped Keeper, seam and Glimmerwell, beside the existing art they sit with.
- Full screens: `before-split-{door,mid,dais}-{390,320}.png`, `after-split-{door,mid,dais}-{390,320}.png`, `after-keep-{door,dais}-{390,320}.png`, `after-glim-{door,dais}-{390,320}.png`.

How they were made:

- The real game (#261's build) at 390 x 844 and 320 x 568, modern controls.
- For "after", Playwright adds this spec's grid and objects to `MAPDATA` at load, plus the draft tiles and props from §8, drawn in `PAL` with `px()`.
- Nothing in the game repo was changed. Zero console errors in every run.
- The draft art (v2) is a stand-in for Pia's, not a proposal to ship. It is there to show the materials and values §6.3 asks for.

## 11. Build notes (for the later build PR, not this one)

1. `data/fernbrook_rooms.json` `fb_hall_in`: replace rows 3-22 with §5.2's after grid (west half byte-identical); add the 36 objects and the 13 `when`s from §7.3; move `fb_hall_basket`, `fb_hall_bench_w`, `fb_hall_jar` and the three holders.
2. #261's `data/detail_zz_day1.json`: `trainers.h1_cadet.facing` becomes `right`.
3. `sprites.js`: the art from §8 and the six `fb_hall` skin entries. No new PAL keys.
4. Optional (D1191): the `hold:` term in `cond()`.
5. `python3 tools/gen_mapdata.py`; `python3 tools/gen_gamejs_map.py` if `game.js` changes; `python3 tools/bump_build.py`.
6. Order: after #261 merges, because the holders, the sign and the flip come from it. It can share Slice 7 (`claude/fernbrook-contested`) or ship on its own branch.

## 12. Acceptance tests

New spec `tests/trial_hall_contested.spec.js`: 320, 375 and 390; reduced motion; zero console errors; save unchanged (`v` 2, nothing written on entering or leaving the Hall, in every state).

| # | Check |
|---|---|
| T1 | Walk mask: every cell of `fb_hall_in` has the same walk value as before, and `V` stays at x 7 on rows 7-17 |
| T2 | West half and rows 0-2 and 23 match the before grid exactly |
| T3 | `art_pass` path lengths unchanged in all three states: up 59 (0 hops), down 11 (6 hops), mat 12, door to (7,8) 50 |
| T4 | In each state (contested, Keepers, Glimmerwell), every present object has a reachable floor neighbour from the door; the only unreachable floor cell is (1,18), as today |
| T5 | No two present objects share a tile in any state; the object sets match §7.3 per state |
| T6 | The prop state matches `mapHold('fernbrook')` for the save kinds a1, a2, b, b', c-keepers, c-glimmer, p, n, fresh (DAY1_TRIAL1_FLOW §5) |
| T7 | `sightLines`: `h1_local` covers 7,20 6,20 5,20; `h1_challenger` covers 11,12 to 7,12; `h1_cadet` covers 4,5 to 8,5 |
| T8 | Fen still refuses until all three holders are beaten (#261's check, re-run on the new spots) |
| T9 | At 320 and 390, from the door and from (7,6), the seam column x 8 is inside the canvas; from (7,6) Fen and the cadet are fully on screen |
| T10 | Painted runs no longer than 6 (`maps_b8` rule; `M` needs its variant), floor share 0.7 or less, `maps_b8` and `interior_walls` unchanged for `fb_hall_in` |
| T11 | Every new art key exists in `TILES`/`WART`; the art scan counts `Q` within limits (D1080) |
| T12 | Value check (§6.3): in a greyscale capture at 320 from the door, the mean value of the east-half floor is clearly lighter than the west half, and the seam column is visible |

Suites touched: `maps_b8`, `art_pass`, `interior_walls`, `room_zoom_all`, `map_reach_sweep`, `match_marker`, `day1_flow` (#261). None should need a change except for the holders' new spots.

## 13. Conflicts and dependencies

| # | Item | Resolution / default |
|---|---|---|
| 1 | #261 places the holders at 13,18 / 12,12 / 12,8 | This spec moves two of them (§5.3). Default: the build of this spec moves them, after #261 merges. #261 is not asked to change |
| 2 | The room's place name is "Bloom Trial Hall" (map `name`, `fb_hall_note` "BLOOM TRIAL HALL. Master Fen waits on the dais.", the REGION_MAP blurb) while the outside sign is "FERNBROOK TRIAL HALL · Master Fen" (#261) | Naming is red: **D1192**. Default: no change here; the outside sign stays as #261 wrote it; the plaque line uses "FERNBROOK TRIAL HALL" to match the sign |
| 3 | `claude/fernbrook-plaza` (no PR) builds its own contested plaza with a Keeper cadet `fbp_cadet` and its own phase reader | Report only. One contested-town read is better than two: this spec reads the D1171 hold, not a new phase. The plaza's cadet and `h1_cadet` should be one person or clearly two (Story) |
| 4 | Rule 9: room redesigns need previews and Vincent's yes | §10; D1189 is red |
| 5 | Old Glimmer saves run the Bright Pavilion Tour here | Unaffected: the Tour is Fen's panel text (`glimmerHallSteps`, #261 `game.js:6927`), which this spec doesn't touch. T6 covers c-glimmer |
| 6 | `maps_b8` expects the room's default floor to be `hall_moss` | Unchanged: `.`/`:` still map to `hall_moss` |

## 14. Decisions (D1189-D1196)

Next free id checked with walklings-decision-ids on Mon Nov 2, 2026, ~10:15 PM ET:

- origin/main's header says D1175.
- Unmerged work already holds D1175-D1188: #261 records D1175 and reserves D1186-D1188; `claude/fernbrook-plaza` uses D1175-D1179; `claude/fernbrook-homes` uses D1179-D1185.
- The design repo's highest id is D1159.
- So this spec reserves **D1189-D1196**, and the next free id becomes D1197.

| Id | Colour | Call | Default |
|---|---|---|---|
| D1189 | **red** | Redesign `fb_hall_in` as a contested building: west half the old Keeper hall, east half resurfaced and branded by Glimmerwell, a seam down the middle, a "brought to you by" plaque beside the Keeper crest. This adds canon (Glimmerwell has physically renovated half of a Keeper Trial Hall) and is a rule 9 room redesign | Waits for Vincent's yes on the §10 previews. Nothing builds before |
| D1190 | **red** | The Hall's look follows Fernbrook's hold after the pick (§7). If Glimmerwell holds the town, the Keeper crest is covered while Fen, a Keeper, still runs the Hall. This changes the Hall's role after Trial 1 | Props flip with the hold; Fen stays (D1170) |
| D1191 | yellow | Add a `hold:<node>=<id>` condition term that reads `mapHold()`, or copy the hold rules into each prop's `when` | Add the term (one branch in `cond()`); the copied strings are the fallback and are what the previews used |
| D1192 | **red** (naming) | The room is named "Bloom Trial Hall" inside (place chip, `fb_hall_note`, map blurb) and "FERNBROOK TRIAL HALL" on the outside sign | No change in this spec; Vincent picks one name |
| D1193 | yellow | Holder spots: neutral `h1_local` on the seam (8,20), challenger stays (12,12), Keeper cadet on the Keeper dais half (3,5) facing right | As §5.3 |
| D1194 | green | The floor and ledges stay split after the pick; only props flip. A hold-based skin swap is out of scope | Yes |
| D1195 | yellow | Glimmerwell's floor is a light polished grey with a soot/wine grid, not a soot field; red is accent only | Yes (contrast) |
| D1196 | green | The new prop lines are PLACEHOLDER (§7.3) and Story replaces them; none asks the holder to join a side (D1145) | Ship the drafts until Story's pass |
