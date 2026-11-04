# HC_PARADE: the President's parade in High Charity (build notes)

Build of design `specs/HC_PARADE.md` **v0.3.1** (D1353-D1369, all settled Tue Nov 3, 2026, the reds by Vincent; v0.3.1 adds
D1424, D1428, D1430, D1438 and D1442, settled by Vincent the same day). It rides on HIGH_CHARITY phase 1 (`handoff/maps/HC_CITY_V2.md`) and stays behind the same switch: **nothing reaches
normal play.** `HC_CITY_V2 = false`; the parade exists only in the city preview (`?debug=1&hccity=2`), which never writes the
save. Plain `?debug=1` and normal play keep `hc_gate` (Keeper Moss's welcome) exactly as on main.

## When it plays (v0.3.1, D1430)

- **The first arrival keeps `hc_gate`** (Keeper Moss's welcome) exactly as on main, in the city preview too: the build no longer
  re-points the kept `hc_gate` trigger (32,36) at the parade.
- **The parade plays on a later Lantern Coach arrival** after the holder has met the Governor: the `load` trigger
  `hc_parade_start` sits on the coach landing tile only (32,37, `r` 0) and needs `story.hc_greeted & story.hc_gov_met &
  !story.hc_parade_seen & !story.hc_parade_square`. Walking onto the Square from another district or out of a door never plays it.
- **The Governor-met flag is the city's existing `story.hc_gov_met`** (D1370, already a not-step flag in `quests.js` and the
  city's `notStepFlags`; it also gates the President's stair with `story.act>=5`). It replaces HC_PARADE v0.3.1 §0's PLACEHOLDER
  `story.gov_met`; no new flag. The Act 2 Governor meeting (Design's packet, in progress) will set it; it is **not built**, so in
  normal play nothing sets it yet and **the parade is unreachable** until that scene lands. Today only the city preview's debug
  places set it: the Act 5 places (`hc2_gov`, `hc2_pres`, which land indoors) and `hc2_parade` (`?debug=1&hccity=2`: the greeted
  flags plus `story.hc_gov_met`, landing on the coach stop). Tests seed it.
- **Old saves:** a save with `story.hc_greeted` and no `story.hc_gov_met` plays nothing on load; a save with
  `story.hc_parade_seen` never sees the parade again.

## How it is built

- **Source:** `tools/hc_parade.py` holds the beat sheet (tiles, casts, waves, lines, pools) and compiles it. `tools/build_hc_city.py`
  imports it after the chunks are dressed, so its output (scenes `hc_parade` and `hc_parade_hill`, `castAt`, looks, the two
  `load` triggers, the reputation rows, the not-step flags) lands in `data/hc_city_v2.json` with the rest of the city. Run:
  `python3 tools/build_hc_city.py --layout <design>/specs/high_charity_layout.json && python3 tools/gen_mapdata.py` (the ROTOR_CRAFT
  frames are read from `<design>/specs/rotor_craft_preview/rotor_craft_frames.json` next to the layout, or `--rotor`).
  The build fails on a beat tile that is not walkable or a line over 110.
- **The Court move (§3.1, D1354)** is main's #287 (HIGH_CHARITY_LAYOUT v0.3, design 91ef326): box 26,21-38,25, door 32,26,
  wide steps on rows 26-27 facing Muster Road, the old corner left as grass. This build stages on it and adds nothing to the
  layout; the Court's sign (33,26, on the top step) is hidden for the scene so the close guards can stand there.
- **Engine (§9).** E1-E5 come from `claude/post-trial-crackdown` (merged into this branch, see the PR). New, all inert unless a
  scene uses them:
  - **E7** flying layer: a prop with `fly: true` draws after people and roofs, `alt` px up, with its `shadow` on the ground; it
    never blocks (`drawFlyers`, `blockerAt`).
  - **E8** `["emoteAll", ids, glyph, ms]`: one emote on every listed actor in the same frame (the clap).
  - **E10** a trigger with `load: true` plays when its map loads (boot, or an arrival once the fade clears) while the holder
    stands within `r`. `hc_parade_start` on the Square's coach landing (32,37, `r` 0; see "When it plays") and
    `hc_parade_resume` on Charter Hill (`story.hc_parade_square & !story.hc_parade_seen`).
  - `["camera", id | null]` (owner's direction, Tue Nov 3): the view follows a scene actor instead of the holder; a switch
    eases over 400 ms (reduced motion and SKIP cut); the scene's end always hands the view back.
  - Staging helpers: `["hide", "people"]` keeps a map's own people and parked tanks off until the scene ends (the Square's
    townsfolk, Moss, the patrols); `walkTo {line: true}` walks a straight lane (a parade column, a flyer); `{ghost: true}`
    lets a staging walk pass other scene actors; a say step with `{face: false}` keeps the portrait frame empty (D1356).
  - `["hcFight", n, spec]` (§5): the street battle. Picks an ally and two foes at random from the side's pools (`hcRng`,
    `Math.random`), never the same actor twice in the series, stages them by the holder, and runs a group battle with the ally
    (`TRAINERS` ally, Bump only). Foes are level-matched to the lead (lv, lv-1..lv+1). A win sets `story.hc_sf_<n>` and the
    foes are led off; a loss restores the team, says the ally's "Get up. Again.", clears the rematch mark and starts the same
    battle again (no Acorns lost, no flag). Picks are not saved.
    **Led away (v0.3.1, D1442, D1425):** with `leadOff` on the side's pool (the Keepers path), after each win a fresh guard
    from the ally pool steps in behind the first beaten supporter and walks them off the street (`walkTo {with}`; both drop at the
    lane's end). No blood, no guns. The Glimmer path is unchanged (its beaten guards walk off). Eight guards cover three allies
    and three escorts.
- **Debug (only with `?debug=1`):** `PixelPets.hcParade()` (who is on the map, tanks in view, hidden bodies, the last pick, the
  guard and supporter pairs led away),
  `PixelPets.hcParadeRng(list)` (a fixed pick sequence for tests).

## Beat sheet (compiled; `tools/hc_parade.py`)

Holder spots: Part 1 Keepers 21,23 (front of the crowd) / Glimmer 21,24 (behind it). Part 2 Keepers 28,30 (front edge) /
Glimmer 28,34 (the back). Reduced motion and SKIP snap every walk and skip every wait (the cutscene runtime); the curtain cuts;
art holds frame 0; emotes still show. SKIP still stops at each battle.

| # | Map | Beat | Steps | Mode |
|---|---|---|---|---|
| 1.1 | highcharity | Coach lands after the Governor meeting (load trigger on the coach landing 32,37; D1430) | `hide people`; `music anthem_march` (PLACEHOLDER, silent); walk to 32,36; narration | tap |
| 1.2 | | Officers A and B step in at 31,35 / 33,35 | `castAt`; the side's Officer A line | tap |
| 1.3-1.4 | | Seven civilians on row 23, five cordon posts in the kerb bays (row 22); the holder walked to the spot with Officer A | `castAt`, `walkAll {with}` | auto |
| 1.5 w1 | | Two rotor craft (ROTOR_CRAFT §6.1, D1392): A over the crowd row (23) with its beam one tile ahead, B three tiles behind and a row north (22), altitude 24, 100 ms a tile, leaving east | fly props, `walkAll {line, with, drop}` | auto |
| 1.5 w2 | | Officer column, two abreast, eight | `walkAll {line, ms 160, drop}` | auto |
| 1.5 w3 | | Escort tank, then command tank (2 in view max) | `keeper_tank_r`, `keeper_tank_cmd_r`, ms 280 | auto |
| 1.5 w4 | | Second column | as w2 | auto |
| 1.5 w5-1.6 | | **The view rides with the car** (`camera pr_car`, owner's direction) until it stops before the holder; the hand at the window; Officer A raises a hand; the crowd claps at once | `prop hc_pcar_hand_r`, `emote emote_hand`, `emoteAll emote_clap` | auto |
| 1.7 | | The view hands back to the holder (`camera null`, a 400 ms ease); the car turns north up Charter Avenue (off view) | `walkAll {line}` to 53,20 then 53,8, drop | auto |
| 1.5 w6 | | Escort tank, last column | | auto |
| 1.7 | | "The President speaks at the Court. Citizens will attend." The crowd walks east | `walkAll {line, drop}` | tap, auto |
| 1.8 | | Curtain; `story.hc_parade_square`; warp to hc_civic | `curtain on`, `setFlag`, `warp` (commits the flag) | auto |
| 2.1-2.2 | hc_civic | Muster Road packed: 12 civilians (six in vests), 26 crowd strips on both sidewalks, the far road ends and the back rows (six more close in on the road behind the car once it stops, so the aisle stays open while it drives), tanks at both road ends (4,31 / 60,31), the rotor craft hovering over the Court facing the crowd (altitude 36 over 32,25, its down-beam on the cell behind the President's step; ROTOR_CRAFT §6.2), four guards behind the cordon (row 28 / row 29), Officers A and B | `castAt` behind the curtain | auto |
| 2.3 | | Four Officers march in along the road and file into the Court door (dropped) | BFS walks to 32,26 | auto |
| 2.4 | | **The view rides with the car** from Charter Avenue (54,31; `camera pr_car2`) up the road to 33,31, four close guards beside it; door open; the President (16x16 back-lit prop) walks with them to the top of the steps (32,26; guards 30/31/33/34,26); the view follows him (`camera pr_pres`) and holds him in view through the speech | | auto |
| 2.5 | | A civilian steps toward the cordon; a guard steps across: "Citizen. Back."; `anthem_dark` (PLACEHOLDER, silent) | | auto, tap |
| 2.6 | | The speech, seven lines S1-S7 (below), "The President", no portrait | `say {face: false}` | tap |
| 2.7 | | Officer A's hand; the crowd claps | `emoteAll` | auto |
| 2.8 | | **He goes back into the Court before the battles** (owner's direction); the view eases back to the holder; the guards stay | `camera null`, walk, drop | auto |
| 3.1-3.3 | | Three street battles (between them, the packet's line endings); Keepers path: a guard leads the first beaten supporter away after each (D1442) | `hcFight 1..3` | battle |
| 3 end K | | Officer A walks up; thanks and hand-off (HOOK, D1363; line D2131); Moss's letter line if `!story.hc_invite` | | tap |
| 3 end G | | "Not here. Run!"; the holder runs west along row 34; curtain; Lantern Quay north edge (22,1); HOOK (D1362; line D2131); the letter line | `warp hc_waterfront` | tap |
| end | | `story.hc_parade_seen`, `story.hc_greeted` | | |
| resume | hc_civic | `hc_parade_hill` alone: the stage, then the speech if no battle is won yet, else the one-line re-stage (D2131) and the next battle | E10 | |

**The speech (§4 v0.3.1; D1424, D1428, D1438).** Story's words (STORY_LINES D2130, Nov 4, 2026; S2 and S7 signed as built). The speech promises force against
people; no line touches Glimmerwell's business (D1424). The draft line is dropped (D1428).

| # | Line |
|---|---|
| S1 | "Citizens of High Charity. You were afraid, and you asked me for order. Today you will see it." |
| S2 | "From today, a Keeper stands on every road and at every Hall. Look up, and you will see us." |
| S3 | "Picking Day has run since the Great War. From today, it is closed to civilians, until order returns." (D1429) |
| S4 | "Our schools will begin again at the first page. Every lesson will serve the lantern." |
| S5 | "Stand with Glimmerwell in our streets, and you will be fined. Stand there again, and you will be jailed." |
| S6 | "And to those in wine vests among us today: we see you." |
| S7 | "Keepers. Into the crowd." |

**Budgets (§9, T7).** Square: 2 Officers + 7 civilians + one wave (8 marchers or 4 guards) = 17 people at most; the parked tanks
are hidden for the scene, so at most 2 tanks are in view. Charter Hill: 2 + 12 + 4 guard line + 4 marchers = 22, then the
4 close guards and the President after the marchers drop = 23. Measured peak: 22 people, 2 tanks in view.

## Inspiration briefs (rule 9, step 1; written by a sub-agent before the art was drawn)

Inspiration only: the PLACEHOLDER pixels in `sprites.js` `addHcParadeArt` use `PAL` keys only. Pia redraws them.

#### Keeper rotor craft

(Superseded for the pixels by Design's own ROTOR_CRAFT v0.1.1 draft frames, D1385-D1394, which the build carries in; the brief
is kept because the engineer fallback in `sprites.js` was drawn from it.)

- **Mood:** a civic lantern that flies. It is slow, polite and always overhead. It never chases; it simply stays.
- **References:** a heavy single-rotor utility helicopter seen from above; a 1930s fire-brigade engine in deep lacquer with brass rails; the caged lamp room at the top of a lighthouse.
- **Silhouette and size:** about 48x32. A round, bus-like cabin at the front, a tapering tail boom and a small tail rotor. The main rotor is a thin flat ellipse about 44 px wide, laid over the top. Skids, not wheels. The caged nose lantern is about 6x6, low on the nose. The ground shadow is a separate oval about 40x10 in `k` at 30-40% alpha.
- **Ramps:** hull `J` = `k` / `J` / `D`. A cream belly band `C` = `A` / `C` / `w`. Brass trim and rails = `F` / `G` / `y`. Glass = `d` / `m` with one `h` glint. Rotor blades `d`, with a smear in `m`/`h`. The lantern core is `y` with a `w` centre. Light from above: the belly one step darker.
- **Frames/motion notes:** fly left and fly right are mirrors. The rotor has 4 frames (0°, 45° smear, 90°, 135° smear) at about 70 ms. The beam reuses `tank_beam`. Reduced motion: one static rotor frame.
- **Reads at a glance:** green, cream and brass means Keeper; a small lantern crest on the side door. A light that watches.
- **Avoid:** anything that could read as a gun: pods, stub wings, nose probes, open side doors with figures leaning out; a predator nose, camouflage, any red.

#### The President's car

- **Mood:** silent, glossy and slow. Everything else on the boulevard moves out of its way.
- **References:** a 1930s state limousine with a long bonnet and sweeping front wings; a closed, lacquered mail coach; a grand piano's black-green gloss with one clean reflection.
- **Silhouette and size:** about 48x24 in the brief; **built at 64x32** after Vincent's preview review (relayed Tue Nov 3): four tiles long, an armoured cabin and a large rear window so the gloved hand reads. Bonnet about 18 px, cabin about 16 px, boot about 10 px. Two pennant staffs rise from the front wings. A 3x3 crest on the rear door. The roofline stays below a standing Keeper's head.
- **Ramps:** body `J` = `k` / `J` / `D`, one `w` streak down the bonnet. Tinted glass opaque `k` / `d`. Chrome = `m` / `h` / `w`. Crest and pennant tips `y` over `F`.
- **Frames/motion notes:** drive left / right mirror, a 2-frame wheel hint. Hand still: the rear window drops and one cream `C` glove shows, the only pale thing on the glass. Door open: a `k` interior and one `y` step light.
- **Reads at a glance:** the longest, darkest and shiniest shape on the street, with a flash of gold on its nose.
- **Avoid:** flags or crests that echo a real country; red or wine; more gold than the crest and pennant tips; outriders holding anything.

#### Crowd strip

- **Mood:** many people, one rhythm. The crowd is happy on time.
- **References:** a stadium terrace seen from the back row; a field of round cabbage heads in tidy rows; the back row of a school photo.
- **Silhouette and size:** 64x16. Two staggered rows of heads from behind; shoulders join into one band, no ground showing.
- **Ramps:** hair from `k`, `d`, `F`, `5`, `G`, `y`; skin only as necks; coats muted (`m` / `I` / `A` / `B` / `h`). Lower in value than the parade.
- **Frames/motion notes:** frame 2 bobs 1 px and every third head raises its hands (the clap), all in unison. Variant A plain; B two lantern pennants on sticks; C one vest in the front row and a child on someone's shoulders.
- **Reads at a glance:** a texture of round heads, not a list of people.
- **Avoid:** faces, readable signs, red, any head larger than the rest, gaps in the shoulder band.

#### The President, minimal

- **Mood:** half-seen and calm. A shape everyone faces and nobody quite sees.
- **References:** a figure on a balcony in front of a bright window; a conductor seen from the back of a stage-lit hall; a tall chess piece against a lamp.
- **Silhouette and size:** 16x16. A long coat to mid-shin, a neat head, arms close. No face pixels at all.
- **Ramps:** body `k` / `d` / `m` (`m` only in the folds). A 1 px rim on the head, shoulders and one sleeve in `y`, `C` at the brightest point; the light comes from the Court's doors behind him.
- **Frames/motion notes:** walk 2 frames; only the hem and feet change. Reduced motion: the standing frame.
- **Reads at a glance:** the darkest thing on bright steps, at the centre of a ring of green.
- **Avoid:** eyes or a mouth; any shorthand for a real leader (moustache, sash, medals, epaulettes); crowns; a halo; red, wine, soot or crimson.

#### Mint vest (superseded: the vest is now wine, see below)

- **Mood:** a bright, friendly badge of belonging; easy to spot in a crowd, which is the point and the risk.
- **References:** a volunteer's high-visibility vest at a fun run; a shop assistant's pastel tabard; a team bib over everyday clothes.
- **Ramps:** no `PAL` key is a true mint; build it from `s` (#73eff7), shade `t`, highlight `w`, as the Glimmerwell lanyard cards do; one wine `V` button ties it to Glimmerwell. Keep `g` and `l` off the body (they drift toward Keeper green).
- **Reads at a glance:** the lightest coloured torso on screen; opposite to Keeper `J`/`D` in hue and value.
- **Avoid:** `g` or `l` as the body colour, crimson `Q`, any text.
- **Note from the brief writer:** Glimmerwell's palette moved to wine `V`, soot `N` and crimson `Q` (v0.3.1). Whether mint is still the supporters' mark under rule 11 is for Design or the Chief of Staff to confirm; the vest is built from the look kit (`outfit: 'vest'`, `outfitCol: 's'`, accent `V`) so a colour change is one line in `tools/hc_parade.py`.
- **Owner's direction (Tue Nov 3, 2026, in the build session): "Mint vest doesn't fit anymore, needs respect."** The
  supporters' vest now stays inside Glimmerwell's locked set (AGENTS rule 11): body wine `V`, trim soot `N`, no crimson `Q`
  (kept for the bag, card and sparkle). One civilian's red cardigan became orange so nothing else in the crowd reads as a
  vest. The crowd strip's one supporter wears the same wine. Checked by `tests/hc_parade.spec.js` (rule 11 test).

## PLACEHOLDERs (nothing here is final)

| What | Where | Note |
|---|---|---|
| Rotor craft ("Lantern Rotor", D1386): hover, fly, front view, shadows, down-beam | Design's ROTOR_CRAFT v0.1.1 draft frames (`specs/rotor_craft_preview/rotor_craft_frames.json`), carried by the build tool into `data/hc_city_v2.json` `art` and painted on first draw (`keeper_rotor_*`, `rotor_shadow*`, `rotor_beam_down`) | Pia redraws (D1394: Vincent sees her frame sheet and these stills before the build merges). The engineer draft `hc_rotor_*` stays only as the fallback when the frames file is absent. The dark `_off` keys and the optional lantern-out at the speech's end (§6.2 H4, Story's call) are not used |
| The President's armoured car, 64x32 (r/l, wheel frames, the raised glove at the rear window, door open) | `hc_pcar_r/_l`, `_move`, `hc_pcar_hand_r`, `hc_pcar_door_l` | enlarged after the preview review (relayed); Pia redraws |
| The President, 16x16 back-lit, walk 2 | `hc_president`, `hc_president_move` | his full look waits (D1356) |
| Crowd strips ×3, 2 frames, clap frame | `hc_crowd_a/b/c` | |
| Court steps | `hc_court_step` decal | layout A14 (P0); the facade itself uses the roof kit (`roof_slab_h`, `wall_columns`) |
| Clap and raised-hand balloons | `GLYPH.emote_clap`, `emote_hand` (city only) | |
| Civilian and vest looks | `hc_pr_civ_1..6`, `hc_pr_mv_1..6` | look kit parts only |
| Keeper tanks, beam, cordon | crackdown draft art (`keeper_tank_*`, `lantern_cordon`) | reused, as §8 says |
| Music `anthem_march`, `anthem_dark` | `music` steps | KEEPER_ANTHEM (D1375-D1384) is not built; the steps name the cues and play nothing; the city loop keeps playing. No new sound (rule 3) |
| Grey-box hum on each speech line | not built | red, D1371 (HC phase 1) |
| Every line but the speech and the D2131 lines | `tools/hc_parade.py` | the packet's §2-§5 lines verbatim, PLACEHOLDER until Story signs them (D1358); the speech is Story's S1-S7 (D2130) |
| The Governor-met flag | `story.hc_gov_met` (`GOV_MET` in `tools/hc_parade.py`; D1370) | replaces §0's PLACEHOLDER `story.gov_met`; the Act 2 Governor scene sets it, not built |
| Officer A / Officer B | cast labels | FRIEND SLOT names (§7) |
| The re-stage line, the two HOOK lines, Officer A's thanks | `RESTAGE`, Part 3 ends | Story's (D2131): "Muster Road is still packed. The guards push into the crowd again.", "Street's clear. You held the line, holder. Keep your Keeper1 close.", "Nobody followed you down. Up on the hill, the bells ring again." The HOOKs promise nothing (D1362, D1363) |
| Street-battle teams | `FIGHT.pools[side].team` | Story and Design (§5, open); level-matched within 1 |

## Open, for the Chief of Staff

- **The parade is unreachable in normal play** until the Act 2 Governor scene (Design's packet, in progress) sets
  `story.hc_gov_met`.
- **Moss's letter line at the parade's end** (`!story.hc_invite`, folded in by v0.2 when the parade replaced `hc_gate`) is kept;
  now that `hc_gate` plays first it only repeats for a holder who still has no invite. Story may drop it.
- **Reload during Part 1:** Part 1 writes no flag before the warp, so a reload replays it only while the save still has the
  holder on the coach stop; if the save has the holder elsewhere on the Square, the next coach arrival plays it.

- **E1-E5 ride on `claude/post-trial-crackdown`** (no PR yet when this was built; merged in with a merge commit). If the crackdown
  PR lands first this merges cleanly; if it is reworked, this branch re-merges it. Its `OPEN_DECISIONS.md` header claims
  D1333-D1339 and D1340-D1346, which main already gives to #268 (D1333-D1347): a collision for that branch's owner, not
  renumbered here.
- ~~Mint vests under rule 11~~: settled by the owner, Tue Nov 3: wine `V` with soot `N` (see the brief note above).
- **At ship time** (with HC_CITY_V2): `save.js` must size the city's maps, or a save on Charter Hill loads at the Hearthmoor
  Lantern House and E10's boot path never sees Charter Hill. In the preview the resume is exercised by arriving on Charter Hill.
