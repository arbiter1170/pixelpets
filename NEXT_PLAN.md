# Walklings: what's next (scoping, Oct 13, 2026)

Scope only. Nothing here is built. Written for hand-off to an implementing agent. Source of truth for status is `BACKLOG.md`; this file turns it plus the Oct 13 playtest feedback into work packages with files, numbers and acceptance checks.

Sizes follow BACKLOG: S = an evening, M = a few sessions, L = needs new infrastructure or a lot of content.

## Document map (start here)

| Document | For | What it is |
|---|---|---|
| `NEXT_PLAN.md` (this file) | The implementing agent | Work packages, engine changes, files, numbers, acceptance checks |
| `DESIGN_HANDOFF.md` | The designer (art + writing) | Every art asset and every piece of writing the work packages need, with specs, priorities, the voice guide, and pointers to past examples |
| `BACKLOG.md` | Everyone | Status and priority order. Points at both documents above |

Past examples of art and writing, for both the implementer and the designer, are indexed in `DESIGN_HANDOFF.md` section 1 ("Reference examples in this repo"). Short version: pixel art lives in `sprites.js`, `keeper.js` and the `ITEM_ART` / `SEAL_ART` blocks in `game.js`; writing lives in the `scenes`, `trainers` and `dialog` blocks of `data/*.json` and `BATTLE_TEXT` in `moves.js`; and `data/cobblecrest.json` is the best single example of a complete designer hand-off (it carries its own `artRequests`, `looks`, `speakers`, `newNames`, `decisions`).

## Decisions (Vincent, Oct 13, 2026)

1. **Rook always leaves Glimmerwell**, in every path. Confirmed.
2. **The second area is Fernbrook.** That is where the side is picked. Confirmed.
3. **The side is not permanent.** The player can switch back after Fernbrook. This needs a **Standing** mechanism per faction, and the impact of switching needs scoping (done below in WP-B, "Standing and switching").
4. **What replaces the Trial Halls on the Glimmerwell path: "sacrifices / tours", gameplay not yet defined.** Treated as an open design spike (WP-B, "Hall replacement: design spike"). The build proceeds with a stub so nothing is blocked. The Keepers path keeps the Trial Halls as built.
5. **Capture:** "no combat performed" = the creature is at full health in this encounter. No global "never fought" rule.
6. **Art and writing needs are compiled for the designer** in `DESIGN_HANDOFF.md`.

## 0. Where the build stands

Playable end to end: Hearthmoor opening, starter, Rook #1, Route 1 (three trainers), Fernbrook (Glimmer stand, Faded Fuzzwick, orchard crates, Trial Hall #1 / Fernbrook Seal), Route 2 + Wickerglen, Cobblecrest + quarry (Rook #2, Trial Hall #2 / Cobblecrest Seal). Story currently ends at `story.cobble_end` ("COMING LATER · Brinewick").

Systems done: care loop and bond, real-time stat decay, battles (types, moves, learnsets, AI tiers, faint nap), befriend timing bar, stats card, journal, bag/shop, Lantern House respawns, region map, sound/music/stingers, save v2 (additive fields), cloud save Phase 1 (off).

Story shape today (this matters for the faction work): **Glimmerwell Co. is the antagonist** (comfort lamps that drain wild Walklings, "relocating" Fen's orchard Walklings, buying the Cobblecrest quarry). Rook is already a Glimmerwell "Junior Bright" by the end of Fernbrook and gets his lanyard in Cobblecrest, with doubts seeded in Wickerglen and the quarry. The good path (Fen, Hale, the Halls, the Lantern Houses) is the only path.

## 1. Backlog audit: not yet implemented

Grouped by what blocks what. "Doc" items are bookkeeping only.

### 1a. Story and content
| Item | State | Source |
|---|---|---|
| Brinewick, Trial Hall #3 (Marisol) and everything after | Only a hook scene (`brinewick_hook`) and a locked road. No map, no learnsets planned past Hale's Lv 21-23 team | BACKLOG item 3, `data/cobblecrest.json` |
| Rook vote Q3 (when Rook joined Junior Bright) | Open; written default is "right after Fernbrook" | BACKLOG Route 2 progress |
| Friend slots (Juniper, Tobin, Ally A in Cobblecrest) | Need design | `cobblecrest.json` `friendSlots` |
| Paragon, Calm Towers, weather-reading skills | Explicitly not decided / out of Episode 1 | `cobblecrest.json` decisions 3, 4 |
| Per-species blurbs for every form; desert/sand line | Left | BACKLOG item 5 |
| Optional creature ideas S1-S3 (night bloomers, lantern lure, dex habitat hints) | Not built | BACKLOG item 5b |

### 1b. Systems
| Item | State | Size |
|---|---|---|
| Friends v1: offline trade code, then backend + visit, then live trades | Stub, no backend (3a/3b/3c) | L |
| Online saves Phase 2 (Link Google, sign out, multi-device) | Phase 1 built with `cloud_config.js` = null. Blocked on Vincent: Firebase project, web config, privacy wording | L |
| Eggs | `eggs` save section exists, empty; no game code | M |
| Box screen: reorder, release, proper UI; orphan recovery UI | Box is a list; orphans invisible | M |
| Rename an existing Walkling | Left from Nicknames | S |
| Installable app (manifest + service worker, offline) | Not started | S-M |
| Export/backup before Start over | Left | S |
| Music volume slider, iPhone listen-through; MUSIC Q1 (iOS silent switch) | Open with Vincent | S |
| Wild creatures not persisted across reload | By design for now | S |
| Small-viewport map at 320x568 (~150 px tall) | Known cramped | S-M |
| Overpass reliability / proxy for real-world tags | Open | M |

### 1c. Balance and pacing (all "open" in BACKLOG)
- Pacing re-tune against real play, harsh comeback floor, "Welcome back" message (stats sit at 10 after ~14 h away).
- Chores grow with collection size (non-partners decay but can't be cared for without swapping partner).
- Midnight double-dip on daily caps (rolling 24 h window would close it).
- Wild second forms skip an evolution stage when befriended.
- Walking has no low-NRG warning.
- **Befriend difficulty: now a playtest item, see WP-A.**

### 1d. Quality
- Device testing is Chromium emulation only (iOS Safari, Android Chrome untested: touch, safe areas, audio unlock, localStorage).
- Doc hygiene: the top of `BACKLOG.md` still says "BATTLE v0.3 now being built" and "Left for Phase M: placing Pia/Fen on real maps". Both shipped. The README also predates Route 2 / Cobblecrest in places. One S pass to clean up.
- No automated tests. Only in-page dev checks (`PPSave.devCheck()`, `statsDevCheck()`). Design's `*_check.py` scripts referenced in the data files are not in this repo. WP-A, WP-B and WP-C each add a small check; see their acceptance sections.

## 2. Playtest feedback work packages

Recommended order: **WP-C (quest indicator) -> WP-A (capture) -> WP-B (factions, phased)**.
- WP-C first because it is small, helps every playtester immediately, and WP-B needs per-side objective text.
- WP-A is independent and small; ship it any time. Do it before WP-B so the bad-path "calmed by lamps" mechanic (optional, see WP-B) has a tuned baseline.
- WP-B is the large one and needs Design/writing input. It is split so each phase is playable.

---

## WP-A. Capture should be harder, and scale with encounter level (M-)

### Current behaviour (read from the code)
- `befriendWidth(hpFrac, stage, joy, treat)` in `moves.js:1516`:
  `max(0.06, min(0.50, base * (0.5 + (1 - hpFrac)) + joy/1000 + (treat ? 0.08 : 0)))`, `base` = 0.22 (first form) or 0.14 (second form).
- `openBefriendBar()` in `game.js:3030` adds the story bonus (`B.bonus`, Faded Fuzzwick +0.10), caps at 0.6, and places a zone of that width at a random centre in 0.2..0.8 on a 0..1 bar.
- The marker is a sine, `enc.speed` 0.003 (first form) or 0.0042 (second form). Three tries (`BEFRIEND_TRIES`). Three misses = the creature leaves (`finish('fled')`).
- `befriendTry()` in `game.js:2428` is a hit if the marker is inside the zone.
- **Level never enters the formula.** A Lv 2 Route 1 creature and a Lv 19 quarry creature have identical odds.
- At full HP and joy 60 the zone is 0.17 wide; at 50% HP it is 0.28; at 20% HP it is 0.35. A predictable sine marker means a patient player lands almost every try. Untouched creatures are barely harder than damaged ones.
- The only gate on timing is HP. The player never needs to fight first.

### Goal (from playtest)
1. Befriending an untouched creature, including the first turn of the battle, should be clearly harder than befriending one you have fought.
2. Difficulty should rise with the encounter's level.
3. The early tutorial must still be passable: the Hearthmoor "guide" wild (`placeGuide()`, Lv 3, `story.first_wild_met`) is most players' first befriend.

Confirmed interpretation: "no combat performed" = the foe is still at full HP in this encounter. That needs no new state: `f.hp === f.maxHp`. There is no global "has the player ever fought" rule.

### Proposed design
Keep the pure function in `moves.js`, add a context argument, keep old call sites working.

```
befriendWidth(hpFrac, stage, joy, treat, ctx)   // ctx = { foeLv, leadLv, engaged }
  hpTerm   = 0.30 + 1.20 * (1 - hpFrac)         // full HP 0.30 (was 0.50), half 0.90, 20% 1.26
  levelMul = clamp(1 - 0.03 * (foeLv - 2) - 0.03 * max(0, foeLv - leadLv), 0.45, 1.10)
  engaged  = any turn has passed this encounter -> x1.10 (small credit for being in the fight)
  width    = max(0.06, min(0.50, base * hpTerm * levelMul * engaged + joy/1000 + treat))
```

Starting numbers are a proposal, not a decision. Tune against this target table (per-press hit chance for a random press; skilled timing improves it, which is why speed also scales):

| Situation | Today | Target |
|---|---|---|
| Hearthmoor guide wild (Lv 3), untouched | ~0.20 | ~0.20 (keep: add a `guide` bonus so the tutorial stays gentle) |
| Route 1 (Lv 2-5), untouched, same level | ~0.17 | ~0.10-0.12 |
| Route 1, foe at <= 50% HP | ~0.28 | ~0.20 |
| Route 1, foe at <= 25% HP | ~0.33 | ~0.30 |
| Route 2 (Lv 12-15), untouched | ~0.17 | ~0.07 (floor 0.06 applies) |
| Route 2, weakened to <= 50% | ~0.28 | ~0.15 |
| Quarry (Lv 16-19), untouched | ~0.17 | 0.06 (floor) |
| Quarry, weakened to <= 25% | ~0.33 | ~0.22 |

Also scale the other two levers, which matter more than width against a predictable sine:
- **Marker speed** by level: `speed = base * (1 + 0.012 * (foeLv - 2))`, capped at +35%.
- **Optional: tries.** Keep 3 hearts. A miss could shrink the next zone by 10% (the creature gets wary). Only add this if width and speed alone feel too soft after tuning.

Keep unchanged: Befriend Treat (+0.08), the Faded Fuzzwick `+0.10`, the 0.06 floor, the 0.50/0.60 caps, befriend XP.

UI/feedback so the change reads as designed rather than random:
- A one-line hint on the BEFRIEND panel when the foe is untouched: wording from `BATTLE_TEXT` in `moves.js` (it has wording rules; add a key such as `befriendWary`: "It's wary. Wear it down first."). Show it once per battle, on opening the bar.
- Optional: tint the zone or show 1-3 pips for odds (low / fair / good) so the player learns the HP and level relationship.
- First-ever untouched befriend attempt (outside the guide): the existing first-time hint pattern in battle (see `screenshots/battle_hint_*.png`) is the place.

Known interaction to design around: a foe knocked to 0 HP "wanders off" and cannot be befriended (`endCheck` -> `finish('win')` for wild). Harder odds make players chip damage more, so accidental KOs will increase. Decide whether to add a mitigation (a weak/non-lethal move for the starters, or "can't be KO'd below 1 HP while the befriend bar has not been tried"). Not required for this package, but flag it to the playtesters.

### Files
`moves.js` (`befriendWidth`, `BATTLE_TEXT`), `game.js` (`openBefriendBar`, `enc.speed` assignment in `openBattle` ~line 2193, call sites at 3032, the `PixelPets.befriendWidth` hook ~3718), `README.md` (Levels/befriend text), no save changes.

### Tasks
1. Add `ctx` to `befriendWidth`; thread `foeLv` (`f.level`), `leadLv` (`levelOf(activePet())`), `engaged` (`B.turn > 0`) from `openBefriendBar`.
2. Guide-wild bonus: story creatures already pass `bonus`; give `placeGuide()`'s spawn a `guide` flag path to `openBattle({bonus})` so Lv 3 first meet stays ~0.20. (`w.guide` is already set; see `game.js:2235`.)
3. Scale `enc.speed` by level in `openBattle`.
4. Add the wary hint line and the once-per-battle gate.
5. Debug hook `PixelPets.befriendOdds(foeLv, hpFrac, opts)` returning width and a rough per-press probability, so the table above can be printed in the console without playing.
6. Dev check beside `statsDevCheck()`: width is non-increasing in `foeLv`, non-decreasing as `hpFrac` falls, and respects the 0.06 floor and 0.50 cap.
7. Re-tune using the table; record final numbers in README under Levels/befriend.

### Acceptance
- `befriendOdds` reproduces the target table within tolerance for Route 1, Route 2 and the quarry.
- Guide wild at Hearthmoor is still befriendable on the first or second try by a new player (check with `?debug=1`, `forceBattle` at Lv 3).
- With no damage dealt, a Route 2 creature is clearly harder than a Route 1 creature at the same joy (screenshot the bar at 320 and 390 px).
- Faded Fuzzwick and Faded Pebblit stay obtainable (they are story pickups; `B.bonus` still applies).
- No save changes; old saves load.

### Risks / questions
- Hard difficulty on a care-first, kid-friendly game: keep the floor and consider a Settings "Easier befriending" toggle (see section 4).
- Interaction with Rook's three-treat gift and the Travel Shelf price for Befriend Treats: treats become more valuable. Check the price in `ITEMS`.

---

## WP-B. "Pick a side" in the second area: Keepers vs Glimmerwell (L, phased)

### Playtest request
After the player has a Walkling, the second area (Fernbrook) lets them pick between:
- **Good faction** = the story as implemented (default).
- **Bad faction** = new flavor content, dialog and story options.
- **Rook always converts at some point**; this needs branching trees.

Answers (Oct 13): Rook always leaves Glimmerwell; the pick happens at Fernbrook; the side can be switched back later, which needs a **Standing** mechanism per faction; Trial Hall replacements are "sacrifices / tours" with gameplay still to be designed.

### Naming (internal)
Player-facing, Glimmerwell never calls itself bad (its voice is relentlessly cheerful corporate: "Have a bright day!", "units", "partnership"). Internally: `story.side` = `"keepers"` (good, default) or `"glimmer"` (bad). Treat an absent value as `keepers`, so every existing save is unaffected, and so that anything that reads it is safe in saves made before this feature.

### Decision point: where and how
Fernbrook already stages both factions side by side, which makes it the natural fork:
- Glimmerwell: `juniper` + `fb_lantern_stand` (trigger `fb_glimmer` -> scene `glimmer1`), `fern_associate` trainer at (9,14), crates at (14,16) and (15,16) (`story.orchard_cleared` removes them).
- Keepers: `fen_orchard` at (10,9) (scene `fen_intro`), `fb_hall`, Keeper Amos at the Lantern House.

Proposed: a new scene `side_pick` fires once, after `glimmer1` and `fen_intro` have both played (`story.met_glimmerwell` and `story.met_fen`), when the player walks to the crates. It is a two-sided pitch (Fen asks for help stopping the crates; Juniper/Tobin offer a Junior Bright trial lanyard and say the orchard Walklings will be "comfier" in a Sanctuary), then a `choice`. It sets `story.side` and `story.side_pick_done`. Make the choice legible: a line that this decides who the player travels with, and a confirm step ("Really?" Yes / Think about it). The pick is **not** permanent (see "Standing and switching"), but the confirm step stays, and the scene should say the player can change course later at a cost.
- Choosing **Keepers** continues exactly as today (`orchard` -> `fern_associate` battle opens the orchard, etc.).
- Choosing **Glimmer** runs the glimmer variant of the orchard beat and Hall #1 (see the content inventory below).
- Optional: the player can step away from the choice and talk to either camp first. Until `story.side_pick_done`, both camps' lines are neutral.

### Design principle: branch the content, not the progression skeleton
The good path's flags gate real things: the Fernbrook Hall door (`story.orchard_cleared`), the Route 2 gate and rubble (`story.seal1`), the Cobblecrest gate (`story.rook_pact`), Lantern respawns, region-map visited rules, `story.slice_end` and others. The glimmer path **sets the same progression flags** (`story.orchard_cleared`, `story.seal1`, `story.glen_cleared`, `story.rook_saw_lamps`, `story.quarry_bought`, `story.seal2`, `story.cobble_end`) from its own scenes. That keeps maps, gates, the quest chain (WP-C), the region map and Lantern Houses working with no per-side forks. What differs is who the player talks to, what the dialog says, who the player fights and why, and what rewards appear.

### Engine asks (all small, additive, no save version bump)
1. `side()` helper in `game.js`: `S.flags['story.side'] || 'keepers'`. Debug hook to set it.
2. **Side-aware scene resolution.** `data/maps_slice.json`, `act1_route2.json` and `cobblecrest.json` are verbatim design copies (the README and BACKLOG say not to edit them; `game.js` already appends lines on top). So: when a scene id `X` runs and `SCENES['X@glimmer']` exists and `side() === 'glimmer'`, run that instead. Same for trainers (`TRAINERS['id@glimmer']`, merged over the base). Objects can already use `when`; glimmer-only NPCs use `when: ["story.side=glimmer"]`, keepers-only ones `["!story.side=glimmer"]`.
3. **Counters and gated choices for Rook's tree and Standing.** Add an `inc` step (`["inc", "story.rook_bond", 1]`), numeric conditions in `cond()` (`story.rook_bond>=2`), and an optional 4th element on `choice` options (`when`) so an option can hide until earned. Standing (below) reuses the same pieces: a `standing` step and a `standing.<faction>>=<tier>` condition. Today `cond()` supports `flag`, `!flag`, `flag=value`, `seal:id`, `has:name`, `talked`, and `choice` options carry only `[label, steps, tag?]` (see `game.js:735`, `:1657`).
4. New data file `data/glimmer_path.json` (same shapes as the others: `maps` patches via `slicePatch`-style `addObjs`/`replaceObjs`, `scenes`, `trainers`, `flags`). Register it in `tools/gen_mapdata.py` (`names`), the merge order near `game.js:667-704`, and `save.js` `MAP_SIZE` if it adds maps. It adds scenes, trainers and objects only. No new map is required for v1.
5. Hall panels are hard-coded (`dr.panel === 'hall1'` in `game.js:1182`; Hale's is a scene). The glimmer-path replacement for the Halls is **not designed yet** (see "Hall replacement: design spike"). Build a thin, swappable stub: one panel or scene per Hall slot that runs a placeholder scene plus one battle through the existing summon flow and `onWin` mechanism, and sets the shared progression flags. The stub is replaced when the spike lands, without touching the gates.
6. Seals: the glimmer path earns a lanyard tier instead of a Seal. Keep `S.seals` as the store (key e.g. `seal_glim_1`) so the Seal card and the stingers work; add a sprite and a display name in `sealName()` and the card art. Also set `story.seal1`/`story.seal2` so gates stay shared. Needs new 16x16 art from Design. Earned seals and lanyards are permanent: switching sides never removes them.
8. **Standing and the switch desk** (new, from the Oct 13 decisions): `S.standing`, a `standing` step, tier conditions, a switch panel, and per-beat side history. Detailed in "Standing and switching" below.
7. Keep the line verifier honest: the existing checks (no empty substitution, no double space, no leftover `{token}`, `lineMax` 110, token lengths from `interiors.json` `dialog`) must run over the new file's scenes, trainers and NPC lines too.

### Glimmer-path content inventory (mirror each good-path beat)

Tone constraint already agreed (`act1_route2.json` decision 4): the energy draining is only hinted at. Keep the bad path cozy-sinister, not cruel: cheerful jargon, ironic euphemism, small moral nudges, never gore or on-screen harm.

| Good-path beat | Glimmer variant (id suffix `@glimmer` unless new) | Content to write |
|---|---|---|
| Fernbrook: `glimmer1`, `fen_intro` | Both stay neutral until the pick | Add `side_pick` (new) |
| Orchard crates + `fern_associate` battle opens the orchard | `orchard@glimmer`, `fern_associate@glimmer` | Player helps pack crates (2-3 choice beats, flavor only); Tobin is friendly; Fen confronts the player. Sets `story.orchard_cleared` |
| Hall #1 (`hall1_fen`, Fernbrook Seal) | **Glimmer Hall slot #1: gameplay TBD (tours / sacrifices, see the design spike).** Stub until then: a Glimmerwell-run review scene plus one battle | Final content depends on the spike. Stub reuses Fen's roster with new intro/win/lose lines. Reward: Bright Tier 1 lanyard + glimmer-flavored gift items. Sets `story.seal1` and `seals.seal_glim_1` |
| Fernbrook ambient (Amos, Odile) | `lines` keys with `story.side=glimmer` | 1-2 lines each, colder tone from keepers |
| `teaser` (Rook: "Junior Bright") | `teaser@glimmer` | Rook is a rival colleague, competing for "Bright of the Month", not a sidekick |
| Route 2: `glimmer2`, `lead_intro` (Imogen) | `lead_intro@glimmer` | Player is a Census volunteer; choices on how to log the lamps (compliant / curious / quietly uncomfortable). Last one gives Rook a bond point |
| Wickerglen `faded2`, `glen_cleared` (the lamps click off, Rook gives 3 treats) | `glen_cleared@glimmer`, `faded2@glimmer` | The player's Walkling still bumps the stand (keep, it is the nudge), but Imogen praises the player; Rook's doubts show. Gifts and treats equivalent. Sets `story.glen_cleared`, `story.rook_saw_lamps` |
| `route2_end` and `rook_pact` choice | `route2_end@glimmer` | Same `together` / `race` flags so `cobble_arrive` still reads |
| Cobblecrest: `quarry_buyout` | `quarry_buyout@glimmer` | Player is on stage beside Dorian; Hale is the one who loses; "Was my training wrong?" moves to Rook's quiet doubt beat. Rook battle #2 stays (`rival2_rook`, `oneShot: story.rival2`) but its lines change |
| Hall #2: `hale_trial`, `seam_a/b`, `seal2` | **Glimmer Hall slot #2: gameplay TBD (see the design spike).** Stub until then | Sets `story.seal2` and `seals.seal_glim_2`. The seam puzzles (`seam_a/b`) are shared by both sides |
| `brinewick_hook` | `brinewick_hook@glimmer` | Rook is on the cart; this is where his arc converges (see the Rook tree below) |

Estimated volume: roughly 12-16 new scenes (glimmer variants plus `side_pick`, the two pavilion panels, Rook beats), 2-3 trainer line overrides, 8-12 NPC `lines` keys, 2 new lanyard/seal sprites, 1-2 new glimmer-only items or shop entries (needs Design). Dialog needs writing review: this is the largest unknown in the package.

Optional systems flavor (after WP-A lands): **glimmer-path wild Walklings near Comfort Lamps count as "calmed"**, giving a capture-width bonus and a visible desaturated look in battle (the faded sprite already exists). It makes the cheerful bad path mechanically tempting and morally ironic. Do not build until WP-A numbers are settled.

### Rook: always converts, branching tree

Today: Rook #1 (Hearthmoor, rival) -> teaser (Fernbrook: "Junior Bright") -> Wickerglen (doubts: "That... didn't look like counting.") -> Cobblecrest (lanyard, battle #2, "Was my training... wrong?") -> Brinewick hook (the humming crate). No conversion yet; the arc is set up to flip.

Confirmed (Oct 13): **in both paths Rook ends up leaving Glimmerwell.** That is the only way "always converts" holds when the glimmer player is also on Glimmerwell's side. So conversion is a fixed convergence node, and what differs is how the player relates to it.

State (all additive flags, no save bump):
- `story.rook_arc`: integer 0-5, the beat Rook has reached (so quest text and scenes can read it).
- `story.rook_bond`: 0-3 counter (independent of Standing and of which side is pledged; switching never resets it), incremented by specific choices in both paths (inc/numeric cond from engine ask 3).
- `story.rook_end`: `"ally"` / `"rival"` / `"parted"`, written once at the conversion node.

Beat map (R = Rook beat, same ids for both paths; the content branches by `story.side`):

| Beat | Where | Keepers path | Glimmer path | Branch inputs |
|---|---|---|---|---|
| R1 | Hearthmoor, rival1 | As today | Same | `rival1_result` |
| R2 | Fernbrook teaser | As today | `teaser@glimmer`: colleague/rival | `side` |
| R3 | Wickerglen | As today (he gives treats, doubts) | Doubts, asks the player to keep quiet or to agree. A choice adds bond or not | `rook_bond` +1 |
| R4 | Quarry (rival2) | He loses or wins; "Was my training wrong?" on a loss | He sides with Dorian on stage, then privately objects to "units" | `rival2_result`, `rook_bond` +1 |
| R5 | Brinewick road (replace/extend `brinewick_hook`) | **Conversion node.** Rook quits Glimmerwell on the cart | **Conversion node.** Same event, seen from the other side | `side`, `rook_bond` |

R5 outcomes were the tree to write. **Vincent (Oct 13, 2026) replaced this tree.** Keepers path: Rook eventually converts to good. Glimmerwell path: Rook stays with Glimmerwell. Bond does not gate it, and there is no follow-or-stay fork. The scene is not built. The old tree is kept below so the rejected plan stays visible:

R5 outcomes (rejected Oct 13, 2026; do not build):
- Keepers + bond >= 2: Rook returns the lanyard, joins as an ally (`rook_end = ally`; he can be a recurring friend NPC, a future double-battle partner, or a gift item).
- Keepers + bond < 2: he leaves quietly, apologises later (`rook_end = parted`); the player can still reconcile on the next map.
- Glimmer + bond >= 2: he warns the player first, then quits; the player gets a **fork**: follow Rook (a free switch to `keepers`, no Standing penalty, with a bridging scene) or stay (`rook_end = rival`: Rook becomes a recurring rival who fights the player). Since switching is now allowed any time (see below), "stay" is not a lock-in either: the player can still switch later at a desk.
- Glimmer + bond < 2: he quits angrily, a clean rival, no fork offered.

Rules to keep the tree safe:
- Every branch reaches R5. No path leaves Rook unconverted.
- Progression gates still use the shared flags, so skipping or losing any battle never blocks the story (a loss already wakes the player at a Lantern House with a retry).
- `rook_pact` (`together` / `race`) stays as an input to `cobble_arrive`; do not repurpose it.
- Rook's look (`KEEPER_SWAPS`, spiky hair) is shared; add an optional lanyard-off look for after R5 (Design art request).

### Standing and switching (Oct 13 decision: the side is switchable, needs Standing)

Goal: the pick at Fernbrook is a commitment with consequences, not a lock. Standing is how a faction's regard for the player is tracked, and it is what makes switching cost something and mean something. Everything below is a scoping proposal; the numbers are placeholders to tune.

**Data (additive, no save bump).** `S.standing = { keepers: n, glimmer: n }`, integers 0-100, both always tracked, normalised in `save.js` (`fill(s, 'standing', isObj, {})` like `bag`/`seals`/`flags`, clamp on load). `story.side` stays the *pledge* ("which faction are you currently working for"). Each faction has 5 tiers (0-4) from thresholds, for example 0 / 10 / 25 / 45 / 70.
- Keepers tiers (working names): Stranger, Friend, Trusted, Hall Friend, Warden's Ally.
- Glimmerwell tiers (lanyard names): Guest, Associate, Junior Bright, Bright Lead, Founder's Pick.
(Names are a Design/writing task, see `DESIGN_HANDOFF.md`.)

**Earning.** Three sources, all capped so it can't be ground:
1. **Story choices and beats**: a `standing` step in scenes, `["standing", "glimmer", 5, "beatId"]`. The fourth argument is a one-shot guard (writes `standing.got.<beatId>`) so replays and re-triggers never double-grant.
2. **Faction activities** (the Hall replacement; see the spike). Completing a tour or a sacrifice grants standing and a lanyard tier or seal.
3. **Optional daily loop idea, to decide**: Keepers regard care (bond, care streak, journal pages); Glimmerwell regards output (befriends, battles won, steps). This links Standing to the game's core loop and makes Standing visible outside story scenes. Cap it per day like care XP (e.g. 5 per faction per local day) to prevent grind.

**What Standing does.** Tiers gate content, not progression:
- Faction shop entries and gift items, NPC line variants (`lines` keys can use `standing.glimmer>=2`), quest text, titles shown on the Friends tab keeper line.
- At most small, optional perks (design TBD). Do not gate any story gate, Hall slot or Lantern House on Standing.

**Switching.**
- Where: a "switch desk" per faction in each town (Keepers: the Lantern House keeper, e.g. Keeper Amos; Glimmerwell: the stand associate, e.g. Juniper). It is a normal NPC panel, same pattern as the Lantern House panel.
- Available any time after `story.side_pick_done` and once Fernbrook's pick is made. Not mid-battle or mid-scene.
- Cost (proposal): the faction being left loses half its current Standing (floor 0); the faction being joined keeps what it has; a new pledge needs at least tier 1 with the faction being joined (a brief "prove it" step otherwise: a one-time small activity). Add a cooldown (for example one switch per in-game chapter, or 24 real hours) so players cannot flip-flop to farm both.
- Rook's R5 "follow Rook" option is a free switch with no cost, as a special case.
- A switch writes `story.side`, increments `story.switches`, and runs a short bridging scene per direction.

**Impact audit, what reads `story.side` and what happens when it changes:**

| Thing | On switch |
|---|---|
| Progression flags and gates (`orchard_cleared`, `seal1`, `seal2`, `rook_pact`, Lantern respawn, region map) | **Unchanged.** Shared by both paths, so a switch can never block or reset the story |
| Scenes not yet played | Play the *current* side's variant when triggered (`@glimmer` resolution is evaluated at trigger time) |
| Scenes already played (one-shot flags set) | Do not replay. Tonal mismatch risk: later scenes can read `story.beat.<id>` = which side played that beat and add one catch-up line ("You helped pack those crates, didn't you?"). Record this from B0 so no back-fill is needed |
| Seals / lanyards already earned (`S.seals`) | **Permanent**, both kinds can coexist |
| Hall / Hall-replacement trials already completed | Stay done. Completing the *other* faction's trial after switching is optional and grants that faction's tier and lanyard (design question for the spike: do we want completionists to hold both) |
| Rook (`rook_bond`, `rook_arc`, `rook_end`) | Independent of the pledge. His R5 beat reads both `side` at that moment and `rook_bond` |
| Standing | Per above: left faction halved, joined faction kept |
| NPC `lines`, shops, quest text | Re-evaluated live on the next interaction; no cache to invalidate |
| Saves / cloud | Additive fields only: `S.standing`, `story.side`, `story.side_pick_done`, `story.switches`, `story.beat.*`, `standing.got.*`. Old saves have none of these and read as `keepers`, tier 0, never switched |

Edge cases to test: switching in the middle of Route 2 with `glen_cleared` unset; switching after `slice_end`; switching with every Hall slot done; first switch right after picking; a wipe (loss) mid-switch scene; old saves past Cobblecrest.

### Hall replacement: design spike (sacrifices / tours, gameplay undefined)

The glimmer path has no gym equivalent yet. Vincent's note: "sacrifices / tours", gameplay unclear. This is a design task before it is a build task. It blocks B1's Hall content and B3's second Hall, not B0, Standing or the Rook arc.

Constraints any answer must satisfy:
- Must set the shared progression flag for its slot (`story.seal1` for slot #1, `story.seal2` for #2) so the gates stay shared.
- Must grant Standing and a permanent lanyard/seal item stored in `S.seals`.
- Must be completable with a worn-out party (a loss wakes the player at a Lantern House and retry is allowed).
- Tone stays cheerful and sinister (the draining is only hinted at); no on-screen harm.
- Should reuse existing engines where possible (scene runner, choices, battles, shops, the walk map) because a new minigame engine is a large cost.

Candidate shapes to evaluate (not decisions):

| Candidate | Loop | Reuses | Risk |
|---|---|---|---|
| **Tour** | A guided multi-stop route through a town or map. At each stop a short scene and a choice (praise, question, comply), sometimes a battle. The "score" is Standing earned | Scene runner, `choice`, trigger objects with `when`, region map pointer from WP-C | Reads as a fetch quest unless stops vary |
| **Sacrifice** | The faction asks the player to give something up for standing: Acorns, an item stack, a day of the daily XP cap, or temporarily benching a Walkling. Choices with visible cost | `give`/bag/money steps (a negative `take` step is new and small), scene choices | Must feel like a story choice, not a tax. Needs a floor so players can't soft-lock their economy |
| **Quota** | Glimmerwell sets targets (befriend N Walklings, win N battles, walk N steps) for a tier | Existing counters and daily caps | Encourages grinding. Pairs naturally with the "output" Standing loop above |
| **Audit battle** | Keep a battle as the capstone, but dressed as a review or an acquisition audit (Fen and Hale defend) | The existing trainer and summon flow | The least new work, and the fallback if the spike runs long |

Deliverable from the spike: a one-page loop description per Hall slot (what the player does in 5-10 minutes, what it costs, what it grants, how it ends) approved by Vincent. Until then the build uses the stub from engine ask 5, with the "Audit battle" shape as the default placeholder. The Keepers path keeps the Trial Halls exactly as built unless told otherwise.

### Phasing

| Phase | What | Size | Playable result |
|---|---|---|---|
| B0 | Engine asks 1-5 (side helper, `@glimmer` resolution, `inc` / numeric cond / gated choice options, `glimmer_path.json` wired into build and verifier, swappable Hall stub). `side_pick` with a placeholder glimmer orchard beat. Records `story.beat.<id>` from the start. Old-save default checked | M | The fork exists and does not break anything; the glimmer branch is a stub that reaches the same gates |
| BS | Standing (`S.standing`, `standing` step and tier conds, save normalisation, tier names) and the switch desks with cost and cooldown, impact audit table checked by test. Standing panel (a second tab in the WP-C quest overlay) | M | Standing visible and earned from scenes; the player can switch sides and back without breaking anything |
| BH | **Hall replacement design spike** (Vincent + Design). No code | design | One-page loop per Hall slot, approved |
| B1 | Fernbrook glimmer content: orchard, Hall slot #1 per the spike, ambient lines, lanyard tier 1 | M | Full glimmer Fernbrook |
| B2 | Route 2 + Wickerglen glimmer content, Rook R3 | M | Glimmer through Route 2 |
| B3 | Cobblecrest glimmer content, Hall slot #2 per the spike, Rook R4 | M | Glimmer through Cobblecrest |
| B4 | Rook conversion R5 and its fork, with both paths' `rook_end` outcomes, end-card text | M | Complete both arcs |

Ship B0 and BS first and look at them before writing B1-B4 content. B2 and B4 do not depend on the spike; B1 and B3 Hall content does. Content phases B1-B4 are mostly data and dialog and can be split across agents once B0 is in.

### Acceptance
- A save with no `story.side` plays exactly as today (checked on a fresh save through Cobblecrest and on an old save already past Fernbrook).
- Picking each side at Fernbrook reaches Cobblecrest with the same progression flags set; every gate (Hall door, Route 2 rubble/warp, Cobblecrest gate, Lantern respawn, region map visited rule) opens.
- For both sides, Rook reaches R5 with a defined `rook_end`; there is no dead end (test with the debug hooks: `forceTrainer`, `winBattle`, `loseBattle`, flag setting).
- Switching sides at any point after Fernbrook (including in the middle of Route 2, and with every Hall slot done) never blocks progression, never removes a seal or lanyard, and applies the Standing cost and cooldown. The impact table above is verified row by row (debug hooks to set `side`, Standing and flags).
- Standing saves, loads, clamps and survives old saves; the `standing` step's one-shot guard prevents double grants.
- Line verifier passes over all new text.
- WP-C's objective text exists for every glimmer beat (see WP-C task 3).

### Risks / open design points
- Tone: a "bad faction" in a kids' care game. Keep it satirical and mild.
- Reversible choice: the risk moves to tonal continuity (scenes already played under the other side) and to flip-flopping for rewards. Mitigations are the per-beat side history, the cost, and the cooldown. Rebalance the numbers after a playtest.
- The Hall replacement is undefined. The stub must stay trivially replaceable.
- Combinatorics. Do not let the player-side matrix multiply per-NPC content; use `lines` keys for ambient flavor and put the real writing into the scenes in the table above.
- Fen, Hale and the Halls being fought as obstacles on the glimmer path needs Design sign-off (both are sympathetic characters).
- Do Lantern Houses still serve glimmer players? Proposal: yes (it is the respawn and rest mechanic; avoid losing safety), with colder Keeper Amos lines.

---

## WP-C. "Next step" indicator next to the D-pad (S-M)

### Current state
There is no objective or quest system. What exists are one-off hints:
- `walkTipText()` (`game.js:2688`) under the D-pad: only covers the first steps and first wild.
- `drawExitCue()` (`game.js:1312`): a yellow chevron at Hearthmoor's east path until `story.reached_route1`. Hard-coded.
- `#journalBtn` pulses until the journal is opened.
- Everything after Route 1 relies on the player guessing (Fernbrook has Glimmer stand, Fen, Hall, Tobin; the Hall door is latched until the orchard is cleared; Route 2's rubble opens on the Seal).

The D-pad's top-right cell is free: `index.html:62-70` places BOOK (top-left), BAG (bottom-left), MAP (bottom-right); `style.css:115-116` defines `.dpc.bl`, `.dpc.br`, `.dpc.tl` and no `.dpc.tr`. The buttons are 52 px cells with an 8x8 canvas icon each (`data-hud`, `REGION_MAP.icon_*` grids in `game.js:2575+`).

### Design
**Button.** `#questBtn` with class `dpc tr` (`grid-column:3; grid-row:1`), an 8x8 `icon_quest` pixel glyph (flag or "!" on a scroll) and the label `QUEST`. It follows the same rules as BOOK: hidden until `story.starter_received`, hidden during scenes, battles and overlays (`journalVisible()` is the model). It pulses (reuse `.dpc.pulse`, which already has a reduced-motion fallback) whenever the current objective has changed since the player last opened the panel (`S.questSeen` = last seen objective id; additive field).

**Panel.** Tap opens `#ovQuest` (a small overlay in the pattern of `#ovBag` / `#ovMap`, with `lockTabs`, Esc to close, 500 ms tap guard):
- Title `NEXT STEP`.
- One or two lines of objective text (<= 110 chars, same `lineMax` as dialog).
- A place line ("Fernbrook · east side").
- `SHOW ON MAP` (opens the region map with the objective node ringed) and `CLOSE`.
- Under it, the last 2-3 completed steps, dimmed.

**Where to point.** Three cheap layers, all driven by the same objective's `target`:
1. On the walk map: replace `drawExitCue` with a general `drawObjectiveCue`: a bobbing chevron above the target tile when it is on the current map, and an edge arrow at the viewport edge when it is off-screen. If the target is on another map, point at the warp that starts the shortest route (BFS over `warp` objects in `WORLD`; the region map nodes in `REGION_MAP.nodes` already give the adjacency).
2. On the region map: a blinking ring on the target node, using the same blink as the current-location marker.
3. `walkTipText()`: when no special tip applies, show the objective text instead of the generic tip.

**Data.** New `quests.js` (pure data plus `currentObjective(flags, side)`, so it is testable and not hidden in the 3,800-line `game.js`). Each entry: `{ id, side?, when: [conds], text, place, target: { map, x, y } }`, using the existing `cond()` syntax. The current objective is the first entry whose `when` is satisfied and whose `done` is not. **Stateless: it is derived entirely from flags**, so there is no migration and old saves land on the right step immediately.

Initial chain from the flags that exist today (confirm exact order against the scenes `intro`, `starter`, `gate_home`):
1. No starter yet -> go through Warden Ilse's intro and pick a Walkling (Lodge).
2. Starter received, `rival1_done` unset -> head for the east gate (Rook is there).
3. Rook beaten/lost -> meet a wild Walkling by the east path (`story.first_wild_met`).
4. `story.reached_route1` unset -> take the east path to Route 1. (Replaces the `drawExitCue` chevron.)
5. Route 1 -> `story.reached_fernbrook` (east end).
6. Fernbrook: `met_glimmerwell` -> `met_fen` -> `faded_fuzzwick` (optional, exclude from the chain, show as a side task) -> `orchard_cleared` (the crates) -> `seal1` (the Hall) -> `slice_end` (the east edge).
7. Route 2: `reached_route2` -> `met_census` -> `reached_glen` -> `met_lead` -> `glen_cleared` -> `route2_end` (the quarry gate).
8. Cobblecrest: `reached_cobblecrest` -> `cobble_arrived` -> `reached_quarry` -> `quarry_bought` (the buyout scene) -> `seal2` (Hale's Hall) -> `cobble_end`.
9. End of content: "That is all for now. Explore, fill the Journal, grow your friends." (`story.cobble_end`).

Not on the chain: the Faded Fuzzwick/Pebblit, trainers by sight, pickups. List them under a "Side tasks" count later (v2) rather than as the headline.

Per-side text: when WP-B lands, entries get a `side` field and glimmer variants. Because the glimmer path sets the same progression flags, one `when`/`done` chain serves both; only `text` and `place` differ.

Stuck-state guard: after a trainer loss the objective stays the same, with a one-line "Rest at a Lantern House first" if the party is all tired/fainted.

### Files
`index.html` (button, overlay), `style.css` (`.dpc.tr`, overlay), `game.js` (button sync like `syncJournalBtn`, panel, replace `drawExitCue`, `walkTipText`, region-map ring, debug hook), new `quests.js` (add the script tag with the cache-busting `?v=` stamp via `tools/bump_build.py`).

### Tasks
1. `quests.js`: the chain above, `currentObjective()`, text <= 110 chars, no tokens that can be empty.
2. Button, `icon_quest` grid, show/hide and pulse rules, `S.questSeen`.
3. Panel overlay with `SHOW ON MAP`, completed list; keyboard Esc.
4. Cue rendering: on-map chevron and edge arrow; cross-map warp pointer (BFS over `WORLD` warps); remove the Hearthmoor-only `drawExitCue`.
5. Region map ring for the target node.
6. `walkTipText()` falls back to the objective.
7. Debug hook `PixelPets.quest()` (read-only: current objective) and, in debug only, `setFlag(k, v)` for walking the chain.
8. Dev check that every `story.*` flag written by `setFlag` in `maps_slice.json`, `act1_route2.json` and `cobblecrest.json` is either a `done` condition of some entry or on an explicit "not a step" list, so future content cannot silently fall off the chain.
9. Screenshots at 320x568, 390x844: button in the free corner, pulse, panel open, edge arrow.

### Acceptance
- On a fresh save, the button appears after the starter and the panel says where to go; each beat updates it without a reload.
- Old save at Cobblecrest shows the Cobblecrest objective immediately (no migration).
- Tap target >= 44 px at 320 wide, no overlap with the d-pad, does not show during scenes/battles/overlays, honours `prefers-reduced-motion`.
- Cross-map: standing in Hearthmoor with the objective in Fernbrook points at the east exit.
- Dev check passes: no story flag orphaned from the chain.

### Standing in the quest panel (once WP-B's BS phase lands)
The quest overlay gets a second tab, STANDING: two rows (Keepers, Glimmerwell), each with a tier name, a small bar to the next tier, and a marker for the pledged side. It is read-only; switching happens at the switch desks. Until BS ships the tab is hidden. The objective text can read the pledge (`story.side`) through the `side` field on `quests.js` entries.

### Questions
See section 4 (pointer strength, Settings toggle).

---

## 3. Suggested sequencing and cross-package notes

1. **WP-C** (S-M). Unblocks playtesting for everyone. Do not wait on Design.
2. **WP-A** (M-). Independent. Do right after WP-C or in parallel (different files, except a shared `README.md` line).
3. **WP-B0, then BS** (M each). Engine, the fork, then Standing and switching. Unblocked (the Rook and Fernbrook decisions are made). Run the **BH design spike in parallel** with Vincent and the designer.
4. **WP-B1..B4** (M each). Content-heavy. Needs the designer's writing and art (`DESIGN_HANDOFF.md`); the Hall content in B1 and B3 also needs the spike.
5. Doc hygiene pass (S) at any point.
6. Then back to the standing backlog by priority: Brinewick and Hall #3 (the story's next map), Friends v1, installable app, box screen, balance re-tune.

Conventions for whoever implements (from `README.md` and `BACKLOG.md`):
- No build step; all paths relative; fonts self-hosted; no new network use.
- Save changes are additive through `normalizeV2` and do not bump `v` (still 2). New keys here: `S.questSeen`, `S.standing` (one new object section, filled by `normalizeV2`), `story.side`, `story.side_pick_done`, `story.switches`, `story.beat.*`, `standing.got.*`, `story.rook_*` (flags).
- Run `python3 tools/bump_build.py` before committing code changes (it stamps `index.html` and `version.json`). Regenerate `data/mapdata.js` with `python3 tools/gen_mapdata.py` after editing any `data/*.json`.
- Do not edit the verbatim design JSON for story edits; add new data in new files or append in `game.js`, as done for Cobblecrest and the journal album.
- Debug hooks stay inert without `?debug=1`; read-only hooks are always on.
- Update `BACKLOG.md` (progress lines) and `README.md` (befriend numbers, controls, quest button) with each package.
- Use real viewports for screenshots: 320x568, 390x844 (existing `screenshots/` folders show the pattern).

## 4. Still open (defaults taken unless answered)

Resolved Oct 13: Rook always leaves; second area = Fernbrook; side is switchable with Standing; capture = full health in this encounter; art and writing go to the designer (`DESIGN_HANDOFF.md`). Remaining:

1. **Hall replacement gameplay** (sacrifices / tours): undefined. Needs the design spike (WP-B, BH). Default until then: stub with an "audit battle". Which faction's trials are "sacrifices" and which are "tours"? It reads as either could apply to the glimmer path; the Keepers path keeps the Halls unless told otherwise.
2. **Standing numbers and sources:** tiers (5 per faction, thresholds 0/10/25/45/70), the daily-loop idea (care for Keepers, output for Glimmerwell), switch cost (halve the faction left) and cooldown. All proposals.
3. **Do completionists get both factions' trial rewards** after switching? Default: yes, optional, with that faction's tier granted.
4. **Capture difficulty option:** add a Settings "Easier befriending" toggle? Default: no for now.
5. **Quest pointer strength:** exact tile chevron plus edge arrow (default) or text-only? Settings toggle to turn pointing off? Default: on.
6. **Glimmer-only mechanics:** the "calmed by lamps" capture bonus and glimmer-only shop items, or text only for v1? Default: text only; mechanics in a later pass.
7. **Owner of the dialog writing pass.** `DESIGN_HANDOFF.md` is written to be handed to the designer for both art and writing; confirm they also own the dialog.
