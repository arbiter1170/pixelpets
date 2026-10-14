# Walklings: what's next (handoff after Builds 4–6, Oct 13, 2026)

Implementing-agent handoff. Source of truth for status is `BACKLOG.md`. This file keeps the work-package detail (files, numbers, acceptance) and, in section 3, a review of what shipped recently plus the next steps. The Oct 13 morning line "Scope only. Nothing here is built" is no longer true. This branch's stamp is `20261013-2347`. GitHub Pages follows `main`, which does not yet include Heights or Builds 4–6.

Sizes follow BACKLOG: S = an evening, M = a few sessions, L = needs new infrastructure or a lot of content.

## Document map (start here)

| Document | For | What it is |
|---|---|---|
| `NEXT_PLAN.md` (this file) | The implementing agent | Work-package detail. Section 3 records what shipped through civic (`20261013-2224`) and names the next builds: the box screen, then the installable app |
| `DESIGN_HANDOFF.md` | The designer (art + writing) | Every art asset and every piece of writing the work packages need, with specs, priorities, the voice guide, and pointers to past examples |
| `BACKLOG.md` | Everyone | Status and priority order. Points at both documents above |

Past examples of art and writing, for both the implementer and the designer, are indexed in `DESIGN_HANDOFF.md` section 1 ("Reference examples in this repo"). Short version: pixel art lives in `sprites.js`, `keeper.js` and the `ITEM_ART` / `SEAL_ART` blocks in `game.js`; writing lives in the `scenes`, `trainers` and `dialog` blocks of `data/*.json` and `BATTLE_TEXT` in `moves.js`; and `data/cobblecrest.json` is the best single example of a complete designer hand-off (it carries its own `artRequests`, `looks`, `speakers`, `newNames`, `decisions`).

## Decisions (Vincent, Oct 13, 2026)

Morning (recorded in the first pass):

1. **The second area is Fernbrook.** That is where the side is picked. Confirmed.
2. **The side is not permanent.** The player can switch back after Fernbrook. Standing per faction is built (Build 2). Numbers in `STANDING_CFG` are still open (OPEN_DECISIONS D14–D17).
3. **Capture:** "no combat performed" = the creature is at full health in this encounter. No global "never fought" rule.
4. **Art and writing** go to the designer (`DESIGN_HANDOFF.md`, `DESIGNER_PROMPT.md`).

Evening (Build 3, supersede the morning notes):

5. **Rook after Glimmerwell (D23).** If the player joins Glimmerwell, Rook stays with Glimmerwell. If the player stays with the Keepers, Rook eventually converts to good. Not bond-gated. No follow-or-stay fork. Supersedes "Rook always leaves" and the bond tree below. The R5 scenes shipped in Build 6 (`story.rook_end` `"ally"` on Keepers, `"stays"` on Glimmerwell). Tone confirmation is still D25.
6. **Hall replacements (D3).** Fernbrook slot 1 is the Bright Pavilion Tour (built, Build 3). Cobblecrest slot 2 is the Sacrifice, Quota as the free floor. Build 5 shipped a stub that sets `story.seal2` and `seals.seal_glim_2`. The real cost is still D24. Keepers keep the Trial Halls. The Audit battle is the Tour's optional last stop.

## 0. Where the build stands

This branch: `20261013-2347`. GitHub Pages still follows `main`, which does not yet include Fernbrook Heights or these scenes. The live site still shows BOOK and FRIENDS.

Playable end to end on the **Keepers** path: Hearthmoor opening, starter, Rook #1, Route 1 (three trainers), Fernbrook (Glimmer stand, Faded Fuzzwick, side pick, Heights smuggling tunnels, orchard crates, Trial Hall #1 / Fernbrook Seal), Route 2 + Wickerglen, Cobblecrest + quarry (Rook #2, Trial Hall #2 / Cobblecrest Seal), then Rook's R5 (`brinewick_hook`: he gets off the cart, `story.rook_end` `"ally"`). Story ends at `story.cobble_end` ("COMING LATER · Brinewick").

Playable on the **Glimmerwell** path through the same Act 1 maps: orchard gate `side_pick`, Heights RegenX lab, crate-packing orchard, Bright Pavilion Tour (four stops; optional Fen match), Bright Tier 1 Lanyard, `teaser@glimmer`, then Route 2 and Wickerglen as a Census volunteer, Cobblecrest buyout beside Dorian, Sacrifice stub (Quota or a narrative snack, optional Hale review), Bright Tier 2 Lanyard, and `brinewick_hook@glimmer` (`story.rook_end` `"stays"`). Same gates and the same coming-later card.

Systems done: care loop and bond, real-time stat decay, battles (types, moves, learnsets, AI tiers, faint nap, group battles), level-scaled befriend bar, stats card, journal, bag/shop, Lantern House respawns, region map, QUEST / NEXT STEP (bottom-bar `#questBtn`; PHONE is `#phoneBtn`), Standing meters and Fernbrook Pledge desks, the Keeper House, town officers, and the Keeper1 phone (Q15), sound/music/stingers, save v2 (additive fields), a downloadable v2 save copy (Build 7), cloud save Phase 1 (off). Playwright covers smoke, Heights, group battles, the glimmer Act 1 path, the save copy, and civic (`tests/civic.spec.js`; no CI workflow yet).

Story shape today: **Glimmerwell Co. is the antagonist** on the Keepers path and a cheerful employer on the glimmer path. Rook is a Junior Bright colleague on glimmer Fernbrook (`teaser@glimmer` does not say he leaves). The Keepers path (Fen, Hale, the Halls, the Lantern Houses) is still the default for any save that never picked a side.

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
| Export/backup before Start over | **Shipped (Build 7).** Settings and the Start over dialog download `walklings-save.json`. Read a copy replaces this device's game. `v` stays 2 | S |
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

**Status: shipped** (PR #3, first pass). Numbers still open (D6–D8). Do not rebuild. Tune only if Vincent answers D6.

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

**Status: B0, BS, and B1–B4 shipped** (Fernbrook, Route 2, the Cobblecrest Sacrifice stub, and Rook R5). See section 3. Next numbered builds are the box screen, then the installable app.

### Playtest request
After the player has a Walkling, the second area (Fernbrook) lets them pick between:
- **Good faction** = the story as implemented (default).
- **Bad faction** = new flavor content, dialog and story options.
- **Rook's ending follows the player's pledge** (D23, evening): Keepers path, he eventually converts to good; Glimmerwell path, he stays. Not bond-gated.

Answers (Oct 13, evening): the pick happens at Fernbrook; the side can be switched later (Standing, Build 2); Hall slot 1 is the Tour (built); Hall slot 2 is the Sacrifice with Quota as the free floor (stub built in Build 5; real cost still open). The morning "Rook always leaves" note is superseded.

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
5. Hall panels are hard-coded (`dr.panel === 'hall1'` in `game.js`; Hale's is a scene). **Slot 1 is the Bright Pavilion Tour** (Build 3): four walk-map stops, optional Fen match at stop 4, `seal1@glimmer` grants `seals.seal_glim_1`. **Slot 2 is the Sacrifice** (Quota as the free floor): the Build 5 stub is in `hale_trial@glimmer`. Replace the cost when the one-pager lands. Do not add a second Tour. Keepers Halls stay as built.
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

**Settled (Oct 13 evening, D23):** conversion is **not** a fixed convergence. Keepers path: Rook eventually converts to good. Glimmerwell path: Rook stays with Glimmerwell. Not bond-gated, and there is no follow-or-stay fork. The morning "always leaves" tree below is the rejected plan; keep it only so older notes are readable. Write R5 against D23.

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
| R5 | Brinewick road (replace/extend `brinewick_hook`) | Rook leaves Glimmerwell | Rook stays with Glimmerwell | `side` only (no bond gate) |

R5 outcomes were the tree to write. **Vincent (Oct 13, 2026) replaced this tree.** Keepers path: Rook eventually converts to good. Glimmerwell path: Rook stays with Glimmerwell. Bond does not gate it, and there is no follow-or-stay fork. Build 6 wrote that as `story.rook_end` `"ally"` and `"stays"`. The old tree is kept below so the rejected plan stays visible:

R5 outcomes (rejected Oct 13, 2026; do not build):
- Keepers + bond >= 2: Rook returns the lanyard, joins as an ally (`rook_end = ally`; he can be a recurring friend NPC, a future double-battle partner, or a gift item).
- Keepers + bond < 2: he leaves quietly, apologises later (`rook_end = parted`); the player can still reconcile on the next map.
- Glimmer + bond >= 2: he warns the player first, then quits; the player gets a **fork**: follow Rook (a free switch to `keepers`, no Standing penalty, with a bridging scene) or stay (`rook_end = rival`: Rook becomes a recurring rival who fights the player). Since switching is now allowed any time (see below), "stay" is not a lock-in either: the player can still switch later at a desk.
- Glimmer + bond < 2: he quits angrily, a clean rival, no fork offered.

Rules to keep the tree safe:
- Every branch reaches R5. The Keepers path converts him; the Glimmerwell path leaves him with the company. No path may skip the Brinewick-road beat or drop `story.cobble_end`.
- Progression gates still use the shared flags, so skipping or losing any battle never blocks the story (a loss already wakes the player at a Lantern House with a retry).
- `rook_pact` (`together` / `race`) stays as an input to `cobble_arrive`; do not repurpose it.
- Rook's look (`KEEPER_SWAPS`, spiky hair) is shared. Lanyard-off look is Keepers-path only (after he converts). Glimmer-path Rook keeps the lanyard.

### Standing and switching (Oct 13 decision: the side is switchable, needs Standing)

**Status: shipped in Build 2** (`standing.js`, Fernbrook Pledge desks, STANDING tab). Numbers and desk copy are still open (D14–D22). The text below is the original spec; the live rules live in `STANDING_CFG`.

**Data (additive, no save bump).** `S.standing = { keepers: n, glimmer: n }`, integers 0-100, both always tracked, normalised in `save.js` (`fill(s, 'standing', isObj, {})` like `bag`/`seals`/`flags`, clamp on load). `story.side` stays the *pledge* ("which faction are you currently working for"). Each faction has 5 tiers (0-4) from thresholds, for example 0 / 10 / 25 / 45 / 70.
- Keepers tiers (working names): Stranger, Friend, Trusted, Hall Friend, Warden's Ally.
- Glimmerwell tiers (lanyard names): Guest, Associate, Junior Bright, Bright Lead, Founder's Pick.
(Names are a Design/writing task, see `DESIGN_HANDOFF.md`.)

**Earning.** Three sources, all capped so it can't be ground:
1. **Story choices and beats**: a `standing` step in scenes, `["standing", "glimmer", 5, "beatId"]`. The fourth argument is a one-shot guard (writes `standing.got.<beatId>`) so replays and re-triggers never double-grant.
2. **Faction activities** (the Hall replacement; see the spike). Completing a tour or a sacrifice grants standing and a lanyard tier or seal.
3. **Optional daily loop idea, to decide**: Keepers regard care (bond, care streak, journal pages); Glimmerwell regards output (befriends, battles won, steps). This links Standing to the game's core loop and makes Standing visible outside story scenes. Cap it per day like care XP (e.g. 5 per faction per local day) to prevent grind.

**What Standing does.** Tiers gate content, not progression:
- Faction shop entries and gift items, NPC line variants (`lines` keys can use `standing.glimmer>=2`), quest text, titles shown on the keeper line in the phone's Friends app.
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

### Hall replacement: design spike (sacrifices / tours)

**Status (D3):** slot 1 is the Bright Pavilion Tour (built, Build 3; Tour stop *copy* is still placeholder). Slot 2 is the Sacrifice, Quota as the free floor. Build 5 shipped a stub (narrative snack, spoken three-name quota, optional `hall2_hale@glimmer` battle) that sets `story.seal2` and `seals.seal_glim_2`. The one-page real cost is still open (D24) and replaces the stub; it does not unblock the maps. The Keepers path keeps the Trial Halls.

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

Deliverable left: a one-page Sacrifice loop for Cobblecrest slot 2 (5–10 minutes, cost, Quota floor, grants, how it ends). Slot 1's Tour is already in the game.

### Phasing

| Phase | What | Size | Status |
|---|---|---|---|
| B0 | Engine, `side_pick`, placeholder orchard / Hall stub | M | **Shipped** (PR #3) |
| BS | Standing, switch desks, STANDING tab | M | **Shipped** (Build 2, PR #8). Numbers open |
| BH | Hall replacement design | design | **Slot 1 + 2 called** (D3). Sacrifice one-pager still needed |
| B1 | Fernbrook glimmer: orchard, Tour, teaser, lanyard tier 1 | M | **Shipped** (Build 3, PR #9). Tour stop copy still placeholder |
| B2 | Route 2 + Wickerglen glimmer, Rook R3 | M | **Shipped** (Build 4) |
| B3 | Cobblecrest glimmer, Hall slot 2 Sacrifice stub, Rook R4 | M | **Shipped** (Build 5). Real Sacrifice cost still D24 |
| B4 | Rook R5 on the Brinewick road (D23, no bond fork) | M | **Shipped** (Build 6). As-built `"ally"` / `"stays"`; D25 still confirms tone |

B2 did not wait on the Sacrifice page. B3 shipped the stub so the Hall still closes. B4 is the two `brinewick_hook` variants.

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

**Status: shipped** (PR #3 first pass; Build 2 designer copy and `icon_quest`). Civic moved `#questBtn` onto the bottom tab bar and replaced BOOK with PHONE (`#phoneBtn`). The layout notes below are the original spec. Left: side-task count (D12).

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

## 3. Review, what shipped, and what is next

### What shipped recently (player-facing, newest last)

| When | Build | What the player can do |
|---|---|---|
| PR #3 | Engine | Quest button, harder befriending, side pick, `@glimmer` scene swap |
| Build 1 (PR #7) | Docs + Playwright | No version bump. Smoke tests at 320 / 375 / 390 |
| Build 2 (PR #8, `20261013-1611`) | Standing | Meters, Pledge desks, STANDING tab, designer quest copy |
| Build 3 (PR #9, `20261013-1718`) | Fernbrook glimmer | Bright Pavilion Tour, Tier 1 lanyard, `teaser@glimmer` |
| PR #10 | Docs | NEXT_PLAN no longer says "nothing is built" or "Rook always leaves" |
| Heights (PR #11, `20261013-1839`) | Before the first trial | Keepers smuggling tunnels; Glimmerwell RegenX lab (Atten, The Arbiter emits slowly); group battles |
| PR #12 (`20261013-1933`) | Heights follow-up | Group-battle tests, Standing on Heights beats, Officer Ken's interviews |
| Builds 4–6 (`20261013-1950`) | Act 1 glimmer | Route 2 glimmer, Cobblecrest glimmer, Sacrifice stub, Rook R5 |
| Build 7 (`20261013-2128`) | Save copy | Download the v2 save before Start over, and read that file back |
| Civic (`20261013-2255`) | Keeper town | Keeper House, town officers, Keeper1 phone, cracked handset |
| Ribbit (`20261013-2318`) | Phone feed | Block News, Chirp Worldwide, local notes, trending |
| **This branch** (`20261013-2347`) | **East gate** | Cut the tree south of Hearthmoor's east path, move the town sign off that grass, Bren's patrol reaches the gate, Officer Cald stands north of the path, off the guide tiles |

Heights sits in front of the trial: `story.heights_done` gates the Hall panel and Tour stop 1. A save that already has `story.seal1`, or that never picked a side, is not sent back. That did not replace Builds 4–6. Those three are now in `data/glimmer_path.json`. Keepers Route 2 and Cobblecrest design JSON stay verbatim; the new scenes overlay them. `brinewick_hook` is the exception: the Keepers closer replaces the Cobblecrest base so Rook converts, and `brinewick_hook@glimmer` is the stay.

`story.rook_end` and `story.rook_bond` are on `NOT_STEPS` in `quests.js` (branch values, not chain steps). `story.cobble_end` is still the `hook` step.

### Build 4 — Route 2 + Wickerglen glimmer — shipped

| Scene | As built |
|---|---|
| `lead_intro@glimmer` | Census volunteer. Go along / Ask why / Keep it quiet. Quiet path `inc` `story.rook_bond` 1. Sets `story.met_lead` |
| `faded2@glimmer` | Grey Pebblit, then the same `faded_pebblit` encounter. Base sets no `story.*` flag here |
| `glen_cleared@glimmer` | `{pet}` bumps the stand. Imogen praises. Rook doubts and gives 3 Befriend Treats. Sets `story.rook_saw_lamps` and `story.glen_cleared`. Standing glimmer +5 (`glen_g`) |
| `route2_end@glimmer` | Together / race still writes `story.rook_pact`, then `story.route2_end` |

No `glimmer2@glimmer`. Seam and census objects stay shared. Tests: `tests/glimmer_route2.spec.js`.

### Build 5 — Cobblecrest glimmer + Sacrifice stub — shipped

The Sacrifice one-pager was still late, so this is the stub the plan allowed. It is not a second Tour, and it does not remove items or Acorns.

| Scene | As built |
|---|---|
| `cobble_arrive@glimmer` | Reads `story.rook_pact` (race, together, or a plain welcome). `respawnHere`. Sets `story.cobble_arrived` |
| `quarry_buyout@glimmer` | Player beside Dorian. Hale loses the seam. Rook objects to "units". `battle rival2_rook`. Sets `story.quarry_bought`. Standing glimmer +5 (`quarry_g`) |
| `rival2_rook@glimmer` | Intro / win / lose only |
| `hale_trial@glimmer` | If `seal:seal_glim_2`, Quinn says the file is complete. Else: "Set a snack down" (the snack stays in the bag), "Meet the quota" (three names, no fee), or "Face the review" (`battle hall2_hale`). Snack and quota `run seal2` |
| `hall2_hale@glimmer` | `seal` `seal_glim_2`, `onWin` `seal2`. Keepers `hall2_hale` stays `seal_cobblecrest` |
| `seal2@glimmer` | `seal seal_glim_2`, `hearty_snack` x2, `wake_tonic` x1, Standing glimmer +5 (`seal2_g`), `story.seal2` |
| `seam_a` / `seam_b` | Shared. Not forked |

Tier-2 art is still `lanyardArt(2)`, name "Bright Tier 2 Lanyard" (D13). Tests: `tests/glimmer_cobble.spec.js`.

### Build 6 — Rook R5 — shipped

Two variants, not four. Not bond-gated. `story.rook_bond` still increments on the quiet Census choice and does not gate this beat.

- Keepers `brinewick_hook` (replaces the Cobblecrest base): Rook gets off the cart. `story.rook_end` `"ally"`. Coming-later card. `story.cobble_end`. Standing keepers +5 (`r5_k`).
- `brinewick_hook@glimmer`: Rook stays. A crate hums. He will not ask why. `story.rook_end` `"stays"`. Same card and `story.cobble_end`. Standing glimmer +5 (`r5_g`).

Both paths end on the same "COMING LATER · Brinewick" card.

### Documentation review (this pass)

These files match the code through civic (`20261013-2224`):

| Document | What it says now |
|---|---|
| `NEXT_PLAN.md` | Section 0 and this section. Civic shipped. Next numbered builds are Build 8 (box screen) and Build 9 (installable app). The real Sacrifice cost and R5 tone stay open |
| `BACKLOG.md` | Q8–Q12 and Q15 are built. Next numbered builds are Q13 (box screen) and Q14 (installable app) |
| `OPEN_DECISIONS.md` | D24, D25, D26, D31, and Brinewick stay open. The cart scenes, the Sacrifice stub, and the Keeper House tint are in |
| `README.md` | Bottom tabs are Pet / Walk / Pets / Quest. The Keeper House and the Keeper1 phone are in. Settings can save and read a v2 copy |
| `CHANGELOG.md` | Player-facing notes for civic, the save copy, Heights, and Builds 4–6 |
| `DESIGN_HANDOFF.md`, `DESIGNER_PROMPT.md` | Route 2, Cobblecrest, and R5 are in the game. Design replaces copy and the Sacrifice cost; it does not invent the flags. Those files were not edited in this pass |
| `tests/README.md` | Smoke, Heights, group battles, glimmer Act 1, the save copy, and `tests/civic.spec.js` |

Still stale on purpose: Tour stop lines marked `PLACEHOLDER`, desk letter/review/welcome (D19), and `STANDING_CFG` numbers (D14–D17). Do not treat those as shipped writing. `DESIGN_HANDOFF.md` still places `icon_quest` on the d-pad's top-right cell and tier badges on the Friends tab. That file was not edited here.

### Next steps

Act 1's glimmer branch is closed enough to play. Do not invent Brinewick, Hall #3, or Seal 3 until someone writes a one-pager (map, trial, what the humming crate is). The Arbiter's emission stays unnamed. Archivist Mo records the fear that it has been leaking through bloodlines for a very long time. A child born already listening is not built (D31).

**People, in parallel (not a numbered build):**

- Designer: Tour stop copy and the real `tour.doubt` name (D26); the Sacrifice one-pager that replaces the stub (D24: a real cost, a floor that cannot soft-lock, how Quota substitutes); tier-2 lanyard art (D13); switch-desk letter/review/welcome (D19). The Build 4–6 lines are playable implementer copy. Replace the words, keep the flags, gifts, and `standing` ids.
- Vincent: confirm R5 as-built (`"ally"` / `"stays"`) or name the change (D25); Standing numbers D14–D17; Firebase project + privacy line; attorney names; Tour recipients / slogans.

**Next coding builds** (unblocked; none of them is a new region):

### Build 7 — Export a save before Start over — shipped

Settings has Save a copy and Read a copy. The Start over dialog has SAVE A COPY before the hold. The file is the v2 JSON (`walklings-save.json`). Reading it runs `normalizeV2` and replaces this device's game, then reloads. `v` stays 2. A fresh game (no Walklings yet) can open the gear under the opening scene, so a wipe can be undone without finishing Ilse's intro. Device prefs stay out of the file. Tests: `tests/save_copy.spec.js`.

### Civic — Keeper House and Keeper1 — shipped

Backlog Q15, not a numbered Build. Hearthmoor is visibly the Keepers' town: gold and green roofs, a patrolling officer, and a two-floor Keeper House (`hm_hq_f1` / `hm_hq_f2`). Officer Bren's walk reaches the east gate. Officer Cald stands on the grass just north of it. The tree at (20, 9) is cut so the first wild can stand there, and the town sign is moved to (19, 10) so it does not block that grass. Fernbrook, Route 2, the glen, and Cobblecrest each have a watch officer. Clerk Mint appears in Cobblecrest after `story.quarry_bought`. Glimmerwell ground (the glen, and Cobblecrest after that buyout) uses mint. Route 1's side quest sets `story.phone_got` and gives `keeper1`. QUEST is `#questBtn` on the bottom bar. PHONE is `#phoneBtn`. Friends moved into the phone. A cracked handset comes with joining Glimmerwell (`side_pick` and `ensureCrackedPhone`) and, while that pledge is carrying it, switches the shell to CRACK//HAND and Botnet. KeeperUAV and Botnet are placeholder boards. `shownLook` tints the keeper silver and mint at Glimmerwell Standing tiers. The generational "born already listening" fear is lore in Archivist Mo's scene (D31), not a birth system. Tests: `tests/civic.spec.js`.

### Build 8 — Box screen — M — **next**

The box is a list under the party. Reorder, release, and a proper box UI. Orphans in `orphans` stay invisible until this has a recovery row. Do not bump `v`.

### Build 9 — Installable app — S-M

`manifest` plus a service worker so the game can sit on a home screen and open offline. No new network calls. Fonts stay self-hosted.

After those, or instead if Vincent writes the page first: Brinewick / Hall #3 (needs the spec), then Friends v1 starting at offline trade codes (BACKLOG 3a). Leave trainer rematch-after-loss off unless Vincent asks (`canSpot` still requires `!spotted.<id>`).

PR #9's description mentioned re-arming trainer sight lines after a loss. That change is **not** in the tree. Leave it off unless Vincent asks. It is a playtest tweak, not story.

Conventions for whoever implements (from `README.md` and `BACKLOG.md`):
- No build step; all paths relative; fonts self-hosted; no new network use.
- Save changes are additive through `normalizeV2` and do not bump `v` (still 2). New keys here: `S.questSeen`, `S.standing` (one new object section, filled by `normalizeV2`), `story.side`, `story.side_pick_done`, `story.switches`, `story.beat.*`, `standing.got.*`, `story.rook_*` (flags).
- Run `python3 tools/bump_build.py` before committing code changes (it stamps `index.html` and `version.json`). Regenerate `data/mapdata.js` with `python3 tools/gen_mapdata.py` after editing any `data/*.json`.
- Do not edit the verbatim design JSON for story edits; add new data in new files or append in `game.js`, as done for Cobblecrest and the journal album.
- Debug hooks stay inert without `?debug=1`; read-only hooks are always on.
- Update `BACKLOG.md` (progress lines) and `README.md` (befriend numbers, controls, quest button) with each package.
- Use real viewports for screenshots: 320x568, 390x844 (existing `screenshots/` folders show the pattern).

## 4. Still open (defaults taken unless answered)

Settled Oct 13: Fernbrook is the pick; side is switchable with Standing; capture = full health in this encounter; Hall slot 1 = Tour, slot 2 = Sacrifice (Quota floor); Rook stays if the player is Glimmerwell and converts if the player is Keepers; art and writing go to the designer.

Remaining:

1. **Sacrifice loop (D24).** The stub is in: a narrative snack (item not removed), a spoken three-name quota, and an optional Hale review. Still open: the real cost, and whether Quota should be a befriend / win / walk target instead of three spoken names.
2. **Standing numbers and sources (D14–D18):** tiers 0/10/25/45/70, switch halves the side left, one switch per Seal-count chapter, `joinMinTier` 0. Daily earning not built. All still proposals in `STANDING_CFG`.
3. **Completionists:** after switching, can the player also finish the other faction's trial? Default: yes, optional, with that faction's tier granted.
4. **Capture extras (D6–D8):** quarry width 0.18 vs target 0.22 left as is; WARY/FAIR/GOOD shown; no Easier toggle, no miss-shrink, no KO mitigation.
5. **Quest pointer:** tile chevron plus edge arrow. Settings toggle to turn pointing off? Default: on. Side-task count not built (D12).
6. **Glimmer-only mechanics:** calmed-by-lamps capture bonus and glimmer shop items. Default: text only for v1.
7. **Tour stop copy and `tour.doubt` name (D2 / D26).** Engine is in; words are marked `PLACEHOLDER`.
8. **R5 tone (D25).** As-built: Keepers `"ally"`, Glimmerwell `"stays"`. Still open: parted instead of ally, and whether he appears later as a colleague.
