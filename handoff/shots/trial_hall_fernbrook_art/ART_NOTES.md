# Fernbrook Trial Hall (contested): art pass notes

This is the Sprites pass on the flagged Hall. It replaces the engineer draft art and records my calls on D1193 and D1195, which Vincent delegated to the art agent. You can preview it with `?debug=1&hall2=1`. With the flag off, the room is unchanged.

Sources: the inspiration brief (rule 9 step) and `handoff/specs/TRIAL_HALL_FERNBROOK_MAP.md` §5.3, §6, §8, §12 and §14.

What changed in code:
- `sprites.js`: the art in `HALL2_TILES` and `HALL2_ART`. Every key keeps its name and its 16x16 size. There is no new key, no new variant and no skin change.
- `tests/trial_hall_contested.spec.js`: T12 gains an upper cap (see D1195).

## D1195: the polished floor's value

**Call: yes, the Glimmerwell floor is lighter. On the T12 measure, east minus west is +21.4. The accepted band is above +20 and below +40.**

Measured at 320 from the door, as T12 measures it: mean greyscale luma of the painted walkable cells, rows 3-22.

| | Mean luma |
|---|---|
| East, x 9-14 (P, P variant, U, I, C) | **165.96** |
| West, x 1-6 (today's tiles) | **144.57** |
| East minus west | **+21.39** (the draft was about +27) |
| Whole east, solid planter ledges included | 153.3, against 141.2 for the west |

Per tile:

| Tile | Mean luma | Note |
|---|---|---|
| `hall_flag` (and its b and c variants) | 140.0 | |
| `hall_flag_worn` | 139.2 | |
| `glim_tile` / `glim_tile_b` (P) | 161.9 / 162.1 | draft: 172 / 165 |
| `glim_seam` (Z) | 151.1 | |
| `glim_step` (U) | 166.5 | draft: 163 |
| `hall_ledge_glim` / `_b` (M) | 114.3 / 116.9 | draft: 93 / 96. The brief asked for at least 105 |
| `glim_dais` (I) | 210.4 | draft: 229. The brief's band was 210-218; the cream `hall_dais` is 205 |
| `glim_dais_lip` (C) | 185.6 | the cream lip is 191 |

Why +21 and not the brief's +28:
- **+28 can't be reached without breaking the brief's own rules.**
  - The brief's material is an `h` field (170) with a 1 px `K` grout line (136) every 8 px. The grout covers 23% of the tile, so the tile comes out at 162, not the brief's estimate of 168.
  - PAL has no cool grey between `h` (170) and `w` (244). The only way to lift the field is more `w`, through a streak, a bevel or a bigger shine. Those are what made the draft read as glass or ice, and what the brief rules out as glare.
- **+21 is still above the +20 point where, per the brief, the halves merge at 320.**
  - T12 is deterministic (seeded variants and fixed art), so the margin doesn't drift between runs.
  - In colour, the halves also differ by temperature (cool blue-grey against warm green and brown) and by texture (a quiet grid against busy stone). See `value-split-door-320.png` (greyscale): the east half reads lighter and quieter, and the seam is the clearest line on screen.
- **The east half stays well under glare.** The dais is 210 against the cream dais at 205, so the halves differ by temperature, not brightness, as the brief wanted. The planter ledges went up from 93 to 114, so they no longer read as black bars.
- **Test change:** T12 keeps `> 20` and adds `< 40` (the brief's hard cap against glare). The comment cites D1195.

## D1193: holder spots

**Call: keep all three spots from §5.3.**
- `h1_local` (neutral): 8,20, on the seam, facing left.
- `h1_challenger`: 12,12, on the polish.
- `h1_cadet`: 3,5, on the Keeper half of the dais, facing right.

No overlay edit was needed, and `gen_mapdata` didn't need to run. Reasons:
- **Story reads in the art.** The neutral holder stands on the lip itself, at the head of the velvet rope, between the grout bucket and the old stone. The challenger stands on the cool grid between two lacquer tiers. The cadet stands on the cream Keeper dais, four tiles from Fen. Each holder's ground is their side's material.
- **Readability.** The holders' `k` outlines (luma 29) sit about 140 below the polished `h` field and about 180 below the cream dais. All three read at 320 in every state (see the door and dais shots).
- **The constraints still hold.**
  - T7: the sight lines are 7,20 to 5,20; 11,12 to 7,12; and 4,5 to 8,5.
  - T3 path lengths are 59 / 11 / 12 / 50.
  - T4 reach: the `4,2` pocket stays in the split and Keepers states, because the layout didn't change.
  - T8: Fen still turns the holder back.
  - No holder stands on a prop or a solid tile. 8,20 is `Z`, 12,12 is `P`, and 3,5 is `e`.

## The brief's three departures from the spec: all adopted

1. **An 8 px tile grid with soot pins, not one slab per tile.**
   - The spec contradicts itself here. §6.1 and §8.1 describe a bevelled slab with a streak; §6.2's ledger describes "a light grey 8 px grid with soot pins".
   - The slab draft read as glass panes and was the busiest surface on screen. The grid is quiet, reads as stone tile, and is unique among the rooms (§6.2).
2. **No red grip marks on the Glimmerwell steps.**
   - In the draft, the red marks read as tally marks.
   - The grip marks are now 1 px `m` dashes. Red is spent only on the enamel bands, the dais light strip, the banners, the plaque band and the rope, which keeps red as an accent (§6.3).
3. **The Keeper banner stays `J` green; it isn't faded to `D`.**
   - The wall-strip props stand on `g` moss (136). `D` cloth (165) disappeared against it. `J` (74) sits 62 below the moss.
   - The fading is carried by the gold (`y` to `A`), a `D` patch in `C` thread, and a fringe that is half gone.

## What changed from the draft (the brief's fixes 1-11)

**Tiles**
- **P:** a strict 8 px `K` grid, one `N` pin at the 16 px corner, and one 2 px `w` tick in the top-left cell. No bevel, no streak and no vein.
  - The variant (`glim_tile_b`) has a 3 px diagonal gleam in the top-right cell instead.
- **Z:** a straight 1 px `N` slab side and a 1 px `w` lip. It is no longer the full-height zigzag.
  - Everything irregular stays west of the lip: `I` stone, an `F` crack, a 3 px `C` grout smear, a `g`/`l` moss tuft, and two 1 px chips on the old stone's edge.
  - The `K` grid carries straight on into P.
- **U:** two light treads with `w` nosing. The first ends in a 1 px `K` riser, the second in an `N` foot. The grip marks are 1 px `m` dashes. U is clearly lighter than M (166 against 114).
  - Brief variance: the riser is `K`, not `m`, to keep the value up.
- **M:** a flat-clipped hedge (`l` top, `g`, `E` row), a `w`/`h` chrome rim (the brightest line), and a 5 px lacquer body (`d` gloss, `N`, a `V` band with an `r` gleam, `N`). A 1 px `E` gap separates boxes, so the row reads as identical modules.
  - The variant is a 3x3 `y` diamond outline, not a "+".
- **I and C:** the floor's own `K` grid and pin (an `m` pin here), in white, with a 1 px `h` shade at the foot of each cell.
  - The first try used `h` joints plus a 2 px edge shade. The doubled tile edge read as window mullions.
  - The lip is the top cell row, then a `w` nosing, a 1 px `V` light strip, an `h` riser and an `N` foot.
- **`hall_flag_worn`:** `hall_flag` with one `F` crack that moss (`g`/`l`) has found. Its value is held at 139.

**Props**
- **`banner_keeper_old`:** a swallowtail in `J`, the lantern and header faded to `A`, a `D` patch in `C` stitches, half a `C` fringe, and an oak pole with a `k` foot.
- **`keep_honour_board`:** a tall oak board with a `y` crest band. Names fade from `G` (oldest) to `A`, and the newest is `y`.
- **`banner_glim`:** 10 px wide, on a chrome rod. It has a `V` field, an `r` gleam on the left, `p` folds and shade, a straight `N` hem, and a small 3x3 diamond. It no longer reads as a framed picture.
  - **`banner_glim_stand`:** the same banner on a `w`/`h` pole with an `N` foot.
- **`banner_glim_half`:** the Keeper swallowtail, with a `V` corner clipped at the top right by a chrome clip and drooping diagonally (straight `N` hem, half a diamond).
- **`glim_plaque`:** a steel plate, smaller than the oak crest, with four `w` screws, a `V` band with a `y` diamond, and one engraved `K` line.
  - **`glim_plaque_covered`:** a `C` slip with a curling corner, `F` writing and an `F` tack. Steel and the band show at the edges.
- **`crest_cover`:** an `N` satin drape with `d` folds and an `m` sheen along the frame top, and a `V` tag on a `w` string. The `y` gold edge, the green band and the crest's own stand show below the hem.
  - The first try used a round top, which read as a head of hair.
- **The boards:**
  - `bulletin_keepers_x`: a warm oak frame, dark cork, uneven `C` slips in `F` ink, and one glossy `N`/`V` flyer with a honey mark.
  - `bulletin_glimmer_x`: a soot lacquer frame with a `d` gloss top, four equal posters (`V` header, `w`, `h`, a honey dot), and one ragged `C` slip.
  - The boards now differ by frame material and by value (the Keeper board is mid-tone, the Glimmerwell board dark).
- **`seam_rope`:** two chrome stanchions with `N` bases, and a 2 px `V`/`p` rope that sags between them. It all stays east of the old stone (x 6-14 in the tile), and it reads at 320.
- **`grout_bucket`:** an `N` pail of `C` grout with a `V` band, a `d` gloss line, a `C` drip down the side, and a steel trowel with an `F` handle on the floor.
- **`tile_crate`:** the oak Keeper crate with a `C` tag and two pried-up `h`/`w` slabs leaning out.
- **`glim_planter`:** a clean 10 px ball with an `l` spot at the top left, `g`, and an `E` crescent at the bottom right, on a lacquer cube (chrome rim, `d` gloss, `V` band).
- **`comfort_lamp_off`:** a `C`/`A` cloth with `F` folds, tied at the neck with an `F` cord. The lamp's `d` pole and `m` base still show.

## Checks

- **`tests/trial_hall_contested.spec.js` and `tests/art_pass.spec.js`, at 320, 375 and 390:** 29 passed, 0 failed, and 31 skipped by design (per-project `test.skip`).
  - trial_hall_contested: 20 passed, 16 skipped.
  - art_pass: 9 passed, 15 skipped.
  - The flag-off test passes: the live room is unchanged.
- **`node tools/scans/run.js`:** wording, decisions, gamejs_map and test_mistakes pass. symlinks fails only on the local `node_modules` link, as expected.
- **`python3 tools/gen_gamejs_map.py`:** run after the `sprites.js` edit.
- **Art rules:** PAL keys only, no new key, and no `Q` in any new grid (T11 counts 0). Keeper pieces stay in oak, `J`, `y`/`A`, `C`, `F` and `k`; Glimmerwell pieces stay in `N`, `V`/`r`/`p`, `y` marks, chrome `w`/`h`/`m` and `d`.

## Shots (deviceScaleFactor 2)

- **`art_sheet.png`:** every new tile and prop at 5x, grouped Keeper, seam and Glimmerwell. Each shows its mean luma.
- **`<state>-<spot>-<width>.png`:** each state (`split`, `keepers`, `glimmer`) at each spot (`door` is 7,22 facing up; `dais` is 7,6 facing up), at 390 and 320.
- **`value-split-door-320.png`:** the greyscale value check for D1195.

## Open questions

1. **Soot halo above the sconces, and a chrome rail on the Glimmerwell wall strip (brief §2).** Both are not done.
   - `keep_lamp_wall` is shared with other rooms, and `game.js` treats that sprite specially (lines ~5562 and ~7476). A soot version would need a new prop key and a sprite change in the overlay.
   - The rail would need a new wall-strip decal.
   - Both are outside "keep every key; variants only". Worth a small follow-up if Vincent wants them.
2. **`Q` in the room.** The reused `comfort_lamp` (not mine, and shared) still draws its four `Q` sparkle pixels. Spec §6.2 allows exactly that, but the brief says "Q is not used anywhere in this room". My art adds none. Whether the lamp's sparkle should change is a separate, shared-prop call.
3. **More separation needs a palette change.** If Vincent wants the brief's +28, the lever is a palette key: a cool grey between `h` and `w`. That would be a new PAL key, so it is red-adjacent and not something this pass can add. Otherwise the call stands at +21.
