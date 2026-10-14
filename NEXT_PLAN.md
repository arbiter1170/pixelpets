# Walklings: what's next (queue, Oct 14, 2026)

Implementing-agent handoff. Source of truth for status is `BACKLOG.md`. Q16 landed the Act 1 stack. Q17 the party board, Q18 the installable app, Q20 look and listen, and Q21 the Lantern Council are built. Q23 rename, Q24 the music volume slider, and Q25 the welcome-back line are built. Q26, modern and arcade controls, is scoped and not started. The next build stays Q19, town boards. The town-list calls are settled. TB-1 and the Hearthmoor and Fernbrook squares are in the game on main. TB-3 is the next unbuilt board step. Detail is in `TOWN_BOARD.md`. Q22, the Capital Partnership Briefing, is not built. Do not rebuild Builds 4–6. Agent skills are indexed in `.cursor/skills/README.md`. Which branch held which piece is in `BRANCH_LOG.md`.

Sizes follow BACKLOG: S = an evening, M = a few sessions, L = needs new infrastructure or a lot of content.

## Document map (start here)

| Document | For | What it is |
|---|---|---|
| `NEXT_PLAN.md` (this file) | The implementing agent | Work-package detail. Q16 is done. Q17, Q18, Q20, Q21, Q23, Q24, and Q25 are built. Q19 town boards: TB-1 and the Hearthmoor and Fernbrook squares are on main. TB-3 is not started. Q22 is not built. Q26, modern and arcade controls, is scoped and not started |
| `.cursor/skills/README.md` | Every agent | Skill index. Quest work uses `walklings-quests`. Status docs use `walklings-docs`. A phone playthrough and the check that follows it use `walklings-qa` |
| `TOWN_BOARD.md` | The implementing agent | Town bulletin boards and the Town Board phone app. Calls settled. TB-1 and the Hearthmoor and Fernbrook squares are on main. TB-3 is not started |
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

5. **Rook after Glimmerwell (D23).** If the player joins Glimmerwell, Rook stays with Glimmerwell. If the player stays with the Keepers, Rook eventually converts to good. Not bond-gated. No follow-or-stay fork. Supersedes "Rook always leaves" and the bond tree below. The R5 scene is on `main` (`ally` / `stays`).
6. **Hall replacements (D3).** Fernbrook slot 1 is the Bright Pavilion Tour (on `main`). Cobblecrest slot 2 is the Sacrifice, with Quota as the free floor. The stub is on `main`. Keepers keep the Trial Halls. The Audit battle is the Tour's optional last stop.

## 0. Where the build stands

Live stamp is `version.json`.

Playable end to end on the **Keepers** path: Hearthmoor opening, starter, Rook #1, Route 1 (three trainers), Fernbrook (Glimmer stand, Faded Fuzzwick, orchard crates, Trial Hall #1 / Fernbrook Seal), Route 2 + Wickerglen, Cobblecrest + quarry (Rook #2, Trial Hall #2 / Cobblecrest Seal). After `story.cobble_end`, the Lantern Council plays in Sky-Dock Command, then the end card. Brinewick, Hall #3, and Seal 3 stay closed.

Playable on the **Glimmerwell** path through Cobblecrest: orchard gate `side_pick`, crate-packing orchard (no Tobin battle), Bright Pavilion Tour, then the glimmer Route 2 scenes, the Sacrifice stub, and Rook staying (`story.rook_end` `"stays"`). That path ends at `story.cobble_end` ("COMING LATER · Brinewick"). The council is Keepers only. Fernbrook Heights gates the first trial unless the save already has Seal 1.

Also on `main` since the Oct 13 handoff: Glimmerwell and wild battle music plus loyalty-keyed talk (PR #15), the Mahopac dream side chain and extra keeper looks (PR #17, D27), a 5-Acorn Lantern rest that holds a wiped party indoors (PR #18, D28), High Charity with the Event Hall games (PR #19 and PR #22), and a password-gated debug panel (PR #21).

On `main` with this landing: Fernbrook Heights, glimmer Route 2, the Sacrifice stub, Rook's closer, the save copy before Start over, the Keeper House with the Keeper1 phone, Ribbit, and the open east gate. Those had lived on `origin/cursor/keeper-hq-phone-0bb2` (tip `46113b2`; the documented Q16 commit was `d43dde7`). GitHub had marked PRs #11, #12, #13, #14, and #16 merged because each merged into the previous feature branch, not into `main`. The provenance log is `BRANCH_LOG.md`.

Systems done: care loop and bond, real-time stat decay, battles (types, moves, learnsets, AI tiers, faint nap), level-scaled befriend bar, stats card, journal, bag/shop, Lantern House respawns, region map, QUEST / NEXT STEP, Standing meters and Fernbrook Pledge desks, sound/music/stingers, save v2 (additive fields), cloud save Phase 1 (off). Playwright smokes live in `tests/` (no CI workflow yet).

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
| Box screen: reorder, release, proper UI; orphan recovery UI | Built (Q17). WALKLINGS tab: UP/DOWN, RELEASE, LEFT BEHIND | M |
| Rename an existing Walkling | Built (Q23). STATS → RENAME and the Walkling sheet. Empty or the species name clears `nick` (D57). A faded Walkling with no nick is also asked when its colour returns | S |
| Installable app (manifest + service worker, offline) | Built (Q18). `manifest.json` and `sw.js` | S-M |
| Export/backup before Start over | Built (Build 7). Save a copy / Read a copy | S |
| Music volume slider, iPhone listen-through; MUSIC Q1 (iOS silent switch) | Slider built (Q24). `settings.musicVol` is 0 to 1. The iPhone listen-through is still open | S |
| Wild creatures not persisted across reload | By design for now | S |
| Small-viewport map at 320x568 (~150 px tall) | Known cramped. Q26 is the scoped answer: modern hides the d-pad and gives that height to the map. Not started | S-M |
| Overpass reliability / proxy for real-world tags | Open | M |

### 1c. Balance and pacing (all "open" in BACKLOG)
- Pacing re-tune against real play. Welcome back is built (Q25): 14 hours away, one line on the partner tab (D56). FOOD and JOY floor at 20. NRG still floors at 10.
- Chores grow with collection size (non-partners decay but can't be cared for without swapping partner).
- Midnight double-dip on daily caps (rolling 24 h window would close it).
- Wild second forms skip an evolution stage when befriended.
- Walking has no low-NRG warning.
- **Befriend difficulty: now a playtest item, see WP-A.**

### 1d. Quality
- Device testing is Chromium emulation only (iOS Safari, Android Chrome untested: touch, safe areas, audio unlock, localStorage).
- Doc hygiene (Q7) is done. An Oct 14 audit corrected later status lines that still called finished work the next build: the WP-B header, the Sacrifice and R5 "not built" lines, the nickname leftover, this "no automated tests" line, the designer prompt's "off main" phases, and the README look picker and tier-2 art. The D37 number collision is recorded in `OPEN_DECISIONS.md` and is not renumbered.
- Playwright smokes live in `tests/` at 320, 375, and 390. There is still no GitHub Actions workflow. In-page dev checks (`questCheck`, `glimmerCheck`, `befriendCheck`, `standingCheck`, `mapCheck`, `heightsCheck`) run at boot. Design's `*_check.py` scripts referenced in the data files are not in this repo.

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

**Status: B0 through B4 are on `main`.** Do not rebuild them. The Sacrifice is a stub (D24). Tour stop copy is still placeholder (D26). Section 3 is the live queue.

### Playtest request
After the player has a Walkling, the second area (Fernbrook) lets them pick between:
- **Good faction** = the story as implemented (default).
- **Bad faction** = new flavor content, dialog and story options.
- **Rook's ending follows the player's pledge** (D23, evening): Keepers path, he eventually converts to good; Glimmerwell path, he stays. Not bond-gated.

Answers (Oct 13, evening): the pick happens at Fernbrook; the side can be switched later (Standing, Build 2); Hall slot 1 is the Tour (built); Hall slot 2 is the Sacrifice with Quota as the free floor (stub on `main`; the real cost is D24). The morning "Rook always leaves" note is superseded.

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
5. Hall panels are hard-coded (`dr.panel === 'hall1'` in `game.js`; Hale's is a scene). **Slot 1 is the Bright Pavilion Tour** (Build 3): four walk-map stops, optional Fen match at stop 4, `seal1@glimmer` grants `seals.seal_glim_1`. **Slot 2 is the Sacrifice** (Quota as the free floor): the stub is on `main`. The real cost is D24. Do not add another audit-battle stub or a second Tour. Keepers Halls stay as built.
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

R5 outcomes were the tree to write. **Vincent (Oct 13, 2026) replaced this tree.** Keepers path: Rook eventually converts to good. Glimmerwell path: Rook stays with Glimmerwell. Bond does not gate it, and there is no follow-or-stay fork. The two scenes are on `main` (`ally` / `stays`). The old tree is kept below so the rejected plan stays visible:

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

### Hall replacement: design spike (sacrifices / tours)

**Status (D3):** slot 1 is the Bright Pavilion Tour (on `main`, Build 3; Tour stop *copy* is still placeholder). Slot 2 is the Sacrifice, Quota as the free floor. The stub is on `main`. The Keepers path keeps the Trial Halls. The one-page Sacrifice loop replaces that stub. It does not block the box screen.

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
| B2 | Route 2 + Wickerglen glimmer, Rook R3 | M | **On `main`.** Do not rewrite |
| B3 | Cobblecrest glimmer, Hall slot 2 Sacrifice, Rook R4 | M | **Stub on `main`.** Real cost still D24 |
| B4 | Rook R5 on the Brinewick road (D23, no bond fork) | M | **On `main`** (`ally` / `stays`) |

Q16 lands B2–B4 together with Heights, the save copy, and the Keeper House. It does not wait on the Sacrifice page. The real cost replaces the stub later.

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

**Status: shipped** (PR #3 first pass; Build 2 designer copy and `icon_quest`). Left: side-task count (D12).

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

## 3. Oct 14 queue

Q16 is done. Q17, Q18, Q20, Q21, Q23, Q24, and Q25 are shipped. The next build stays Q19, town boards. Q26, modern and arcade controls, is scoped and not started. The town-list D37 and D38–D49 are settled. TB-1 and the Hearthmoor and Fernbrook squares are in the game on main. TB-3 is the next unbuilt board step and is not started. The open-table D37 is the region-map claim list and shares that number. Q22, the Capital Partnership Briefing, is not built. A code PR stamps with `python3 tools/bump_build.py`, runs Playwright at 320 / 375 / 390, and updates BACKLOG / README / OPEN_DECISIONS / CHANGELOG / this file in the same PR. Status-doc edits follow `.cursor/skills/walklings-docs/SKILL.md`.

### Q16 — Land the stranded Act 1 stack — **done**

Landed on `main` from `origin/cursor/keeper-hq-phone-0bb2`, including the commits after `d43dde7` (Ribbit, the open east gate, the officer off the guide grass). This was a merge, not a rewrite. The content below under "Reference: Builds 4–6" is what that branch already played.

Keep everything `main` gained after Build 3:

| PR | Keep |
|---|---|
| #15 | `glimmer_first`, `glimmer_battle`, `wild_skip` / `wild_romp` / `wild_spark`, and the `loyalty` block in `data/glimmer_path.json` |
| #17 | `data/mahopac.json`, the extra keeper looks, Mom's side chain, the sky-blue side arrow |
| #18 | `LANTERN_REST_COST` (5 Acorns), the post-wipe door hold, the keeper covering a short purse. While a rest is owed, the bed arrow wins over the side-quest arrow |
| #19 | `data/highcharity.json`, `minigames.js`, the lantern coach, the five Event Hall games |

This landing added:

| Piece | Where it lives on that branch |
|---|---|
| Fernbrook Heights, group battles, Standing on those beats | `data/heights.json`, `tests/heights.spec.js`. `story.heights_done` gates the Hall panel and Tour stop 1. A save that already has `story.seal1`, or that never picked a side, is not sent back |
| Builds 4–6 | `data/glimmer_path.json`, `tests/glimmer_route2.spec.js`, `tests/glimmer_cobble.spec.js` |
| Save copy before Start over | Settings downloads `walklings-save.json` and can read that file back. `tests/save_copy.spec.js`. `v` stays 2 |
| Keeper House, town officers, Keeper1 | `data/civic.json`, `tests/civic.spec.js`. QUEST moves to `#questBtn` on the bottom bar. PHONE is `#phoneBtn`. A cracked handset comes with joining Glimmerwell |

`git merge-tree` on 14 Oct 2026 conflicts in these 15 files: `BACKLOG.md`, `DESIGNER_PROMPT.md`, `DESIGN_HANDOFF.md`, `NEXT_PLAN.md`, `OPEN_DECISIONS.md`, `README.md`, `data/glimmer_path.json`, `data/mapdata.js`, `game.js`, `index.html`, `quests.js`, `save.js`, `sprites.js`, `tools/gen_mapdata.py`, `version.json`. `style.css`, `tests/README.md`, `tests/glimmer_fernbrook.spec.js`, and `tests/smoke.spec.js` auto-merge.

Decision ids used to collide. `main` already uses D27 (Mahopac, settled) and D28 (lantern rest, open). The keeper-hq branch used D27–D31 for other calls. Those rows are D32–D36. D27 and D28 were not overwritten.

| Old id on that branch | On main | Call |
|---|---|---|
| D27 | D32 | RegenX vs the PharmaX name in the same note. Player text uses RegenX |
| D28 | D33 | Heights good-path plot after the note stopped at the smuggling ring |
| D29 | D34 | Group battles v1: two foes, TARGET, ally hits on the last fight only |
| D30 | D35 | Officer Ken interviews the Pomlet, Pebblit, and Fuzzwick, then lets them walk |
| D31 | D36 | Glimmerwell Standing tints the walk sprite. The saved look is not rewritten. No birth system |

After the merge, register every new `data/*.json` in `tools/gen_mapdata.py` and regenerate `data/mapdata.js`. Stamp with `python3 tools/bump_build.py`. Run `npm test`.

Acceptance:

- A Keepers save still walks Route 2 and Cobblecrest, and Hale's trial is unchanged.
- A glimmer save at `story.seal1` reaches `story.cobble_end` with `story.seal2` set and `story.rook_end` `"stays"`.
- A save that already has `story.seal1` is not sent back through Heights.
- High Charity's coach, Mahopac's side steps, the 5-Acorn rest, and the faction music still work.
- The quest control and the phone both exist, and Friends is still reachable.
- Old saves load. `v` stays 2.
- `npm test` covers the landed suites and `tests/highcharity.spec.js`, `tests/mahopac.spec.js`, `tests/lantern_rest.spec.js`, `tests/faction_music.spec.js`.

Leave Brinewick, Friends, a second Sacrifice, and daily Standing out of this PR.

### Q17 — Box screen — M — **shipped**

The WALKLINGS tab is six party slots, then the box, then LEFT BEHIND. MOVE reorders the party. TO BOX and TO PARTY move one Walkling. RELEASE asks first and will not drop the last Walkling. LEFT BEHIND shows each orphan's reason and raw data. The Walkling sheet adds field item use, nicknames, move order, held items (Soft Berry, Bracer Band, Kin Ribbon), accessories, and a call card. Battle SWAP stays the party. Save `v` stays 2. Unknown fields stay on the Walkling.

### Q18 — Installable app — S–M — **shipped**

Shipped. `manifest.json` and `sw.js` let the game be added to the home screen and opened offline. The worker caches same-origin files only. `version.json` stays on the network so a newer deploy can still announce itself. No new network calls. Fonts stay self-hosted. The optional location lookup stays a network call and still falls back to meadow when it cannot run. The icon is a sprout Walkling on `#1a1c2c` (`icons/icon-192.png`, `icons/icon-512.png`, `icons/apple-touch-icon.png`).

### Q19 — Town boards — scoped

Q17 and Q18 are already in the game. The town-list calls are settled. TB-1 is in the game on main: empty boards, live reports, the phone app, and no slips. The Hearthmoor crossing and the Fernbrook forecourt are on main too. Mahopac has a board and no slips. Every future town gets a board with its map. KeeperUAV stays the blank watch desk for now and later carries faction-related abilities. The open-table D37 is the region-map claim list and shares that number. The scope is [TOWN_BOARD.md](TOWN_BOARD.md). A future quest uses `.cursor/skills/walklings-quests/SKILL.md`.

TB-1 is the empty board, the reports, and the phone app. The Hearthmoor and Fernbrook squares from TB-2 landed with it. TB-3 is the next unbuilt board step: one slip (Cald's gate count). It is not started. No quest is wired. KeeperUAV stays the blank watch desk.

### Q20 — Look and listen — M — **shipped**

`seal_glim_2` is the `LANYARD_TIER2` grid (gold rim, mint field, two white marks). Field Lead Imogen and Associate Hollis have their own keeper looks on Route 2. Rook's portrait wears the lanyard accessory once Glimmerwell has claimed him, and drops it when `story.rook_end` is `"ally"`. The player look picker still has no lanyard. `trackFor` plays `town_glimmer` in a Glimmerwell town, `quarry` in the quarry, and `grove` on a grove backdrop. An explicit `map.music` still wins. Tests: `tests/look_listen.spec.js`.

### Q21 — Lantern Council — M — **shipped**

Keepers only, in Sky-Dock Command, after `story.cobble_end`. Drafted under Q19; town boards own that number, so this is Q21. The scene is `hc_council`. The quest row sits between `hook` and `end` and covers the Event Hall pointer until `story.hc_council_done`. The Seals are named in dialog. The chart names the coastal road and leaves its light dark. `hc_council_k` grants 10 Keepers Standing once. A glimmer pledge never sees the council. Calls: D50–D55. Tests: `tests/lantern_council.spec.js`.

### Q22 — Capital Partnership Briefing — M — **not built**

The glimmer counterpart after Cobblecrest. Not in the game. Do not stack another grant on `r5_g`. Do not open Brinewick, Hall #3, or Seal 3.

### Q23 — Rename a Walkling you already have — S — **shipped**

STATS → RENAME, and the Walkling sheet NAME field. Both use the same cleaning: 10 characters, letters, digits, spaces, and ' . ! ? -. An empty field, or the species name, stores `nick` as null (D57). Escape or CANCEL on the stats card leaves the old name. The sheet writes the same value without the toast. Save `v` stays 2.

### Q24 — Music volume — S — **shipped**

The Vol slider sits beside Music, 0–100. The save stores `settings.musicVol` from 0 to 1, and the Music on/off switch is unchanged. A 0 level is silent while Music stays ON. On a 320-wide screen, Start over stays in view. The iPhone silent-switch listen-through is still open.

### Q25 — Welcome back — S — **shipped**

Fourteen hours away, once the partner tab is clear of the daily hello, the line is "{pet} waited while you were away." A shorter gap says nothing. FOOD and JOY still floor at 20. NRG still floors at 10. The hours and the sentence are D56. Save `v` stays 2.

### Q26 — Modern and arcade controls — S–M — **scoped, not started**

Not in the game. The next build stays Q19. This package can land beside the boards. No new art. Save `v` stays 2. The sentences are D62 and stay marked placeholder until Vincent signs them.

#### What the walk screen does today

`#scr-walk` is a column: the HUD, the area badge, `#mapWrap` (`flex: 1`), then `.walk-ctl` (the d-pad plus `#walkTip`). `#dpad` is a 3×3 grid of 52 px cells (`style.css`). The cross is Up, Left, Talk (`#talkBtn`), Right, Down. The corners are PHONE (`#phoneBtn`, top-left, hidden until `story.phone_got`), BAG (`#walkBagBtn`, bottom-left, hidden until the starter), and MAP (`#mapBtn`, bottom-right). The top-right cell is empty. QUEST is `#questBtn` on the bottom tab bar.

`#talkBtn` calls `talkFacing()` and gains `.ready` when `facingTarget()` is set. The map already moves without the pad: tap a tile, drag to steer (`walk.drag`), tap a person, door, sign, or wild Walkling (`tapObject`), or walk into them (`bumpObj` calls `interact`). Arrows, WASD, and Space or Enter stay.

`fitAll()` in `game.js` sizes `#mapCanvas` from `#mapWrap`'s box, at an integer scale, capped at 384×320. Hiding the d-pad returns its height (3 × 52 px, plus the 2 px gaps, about 160 px) to that box. On a 320×568 phone the map is about 150 px tall today.

#### Arcade

Today's layout. The d-pad, the Talk button, and the tip under the pad stay. Keyboard stays. A save with no `settings.controls` is arcade.

#### Modern

Hide the four arrows and `#talkBtn`. Leave the nodes in the page so arcade can show them again.

The map grows by the d-pad's height. `applyControls()` sets `body.ctl-modern` and calls `fitAll()`.

PHONE, BAG, and MAP are the same three buttons, moved into an empty `#floatCtl` inside `#mapWrap`. They sit absolute in the same corners: phone top-left, bag bottom-left, map bottom-right, 52 px (at least 44), 6 px inset. The layer itself has `pointer-events: none`. The buttons keep pointer events, so a tap on the map still walks and a tap on a button does not.

Visibility stays as it is. Phone waits for `story.phone_got`. Bag waits for the starter. Map keeps `.off` until the region map is ready. The phone pulse stays.

There is no Talk button. Tap and walk-up already call `interact`. The speech bubble over a faced NPC stays. Space and Enter still call `talkFacing()`. Do not add a second talk path.

QUEST stays on the tab bar. The empty top-right cell does not become a fourth float.

`#walkTip` stays in `.walk-ctl`, under the map. Hiding the d-pad leaves that one line, so the objective, the lantern warning, and the early hint still show. In modern, the default tip and the early-steps line do not say "Hold the pad" (D62). The quest text from `walkTipText()` is the same in both layouts. In modern the bump hint sits above the bottom buttons (`bottom: 64px`) so it does not cover BAG and MAP.

During a scene, fade `#floatCtl` the way `body.scene-on .walk-ctl` fades the pad today, so the buttons do not sit on the text box.

Modern does not add a virtual stick. Walking is the tap, the drag, and the keyboard that already exist.

#### Settings

One row in `.set-list`, under Follower and above Change look. The label is Controls. The value is ARCADE or MODERN. A click swaps, toasts, calls `save()`, and calls `applyControls()`. CLOSE stays outside the scrolling list, so a 320-wide screen still shows CLOSE. The gear already opens during the opening scene, and the row works then too.

#### Save

`settings.controls` is `"arcade"` or `"modern"`. `normalizeV2` fills a missing or any other value as `"arcade"`, so an old save keeps the pad and is not asked. `v` stays 2. There is no migration. `defaultStateV2` may omit the key. The prompt writes it.

#### First character, still in the house

A new game wakes in `hm_home_in` and runs `intro` (`data/maps_slice.json`). The look picker is the mirror step, `["lookPick"]`, before the door note. Add `["controlPick"]` immediately after it. The house exit is the mat warp `home_mat` at (4, 7). The scene holds the player until the step answers, so the pick happens before they can walk out.

`controlPick` uses the scene choice buttons. SKIP is hidden, and the step clears `scene.skip`. The labels are Arcade and Modern. The prompt and the reminder live in `game.js` with a `/* PLACEHOLDER: needs copy from Vincent */` comment, so the JSON step has no extra lines. The prompt is the choice text. After the click, the step says the reminder, then returns, and the door note follows.

The step writes `S.settings.controls` and calls `applyControls()` before the scene ends. The scene-end save persists it. A reload before `story.intro_seen` replays `intro` and asks again. Start over runs `intro` again, so it asks again. A save that already has `story.intro_seen` is not asked.

The step is not a story flag and does not write `$line`. Add the name to the `INTERACTIVE` list in `game.js`. Regenerate with `python3 tools/gen_mapdata.py`.

Placeholder copy (D62), each line at most 110 characters, each button label at most 30:

| Where | Text |
|---|---|
| Prompt | Arcade: the pad and a Talk button. Modern: a bigger map. Tap people to talk. The gear switches this. |
| Buttons | Arcade, Modern |
| Reminder, after the pick | You can switch any time. The gear in the corner is Settings. |
| Modern default tip | Tap a tile, or drag on the map. Tap people to talk, and walk up to a wild Walkling to meet it! |
| Modern early tip | Tap the ground to walk. The east path leads out of town. |
| Toasts | Arcade controls. / Modern controls. Tap the map to walk. |

Arcade keeps `WALK_TIP_DEFAULT` and the early line "Hold the pad to walk. The east path leads out of town."

#### Files

| File | Change |
|---|---|
| `index.html` | The Settings row, and an empty `#floatCtl` inside `#mapWrap` |
| `style.css` | `body.ctl-modern` and `body.ctl-arcade` |
| `game.js` | `applyControls`, the settings row, `controlPick` in `execStep`, the modern tip strings, and a boot call before `fitAll()` |
| `save.js` | Fill `settings.controls` |
| `data/maps_slice.json` | `["controlPick"]` after `["lookPick"]` in `intro` |
| `data/mapdata.js` | Regenerated |
| `tests/controls.spec.js` | The checks below. Add a row to `tests/README.md` in that same change |

#### Acceptance

- A fresh game, after DONE on the look picker, is still on `hm_home_in`, `story.intro_seen` is still unset, and Arcade and Modern are on screen. SKIP does not pass them.
- Modern hides the arrows and `#talkBtn`. PHONE, BAG, and MAP sit on the map corners, each at least 44 px, and they do not overlap each other or the tab bar. Bag stays hidden before the starter. Phone stays hidden before `story.phone_got`.
- At 320×568, `#mapWrap` is at least 120 px taller in modern than in arcade.
- In modern, tapping the home note, or walking into it, still talks. Space still talks when the keeper faces it.
- Arcade still has the pad, the Talk button, and the same corner buttons in the grid. The quest-button overlap check in `tests/smoke.spec.js` still passes on a save with no `settings.controls`.
- Settings swaps the layout immediately, the choice survives a reload, and `v` stays 2.
- A save with no `settings.controls` loads as arcade and does not open the prompt.
- Arrows and WASD walk in both layouts.
- `npm test` at 320, 375, and 390. Stamp with `python3 tools/bump_build.py` because `index.html` changes.

#### Leave out

Battle controls, the partner tab, and the tab bar stay as they are. QUEST does not move. The Talk button stays in arcade. No new icons.

### Hold

Brinewick, Trial Hall #3, and Seal 3 wait on a one-pager that does not exist. Friends v1 starts at offline trade codes. Q16 no longer blocks it, and it is not ahead of Q19. The phone still shows ADD (COMING SOON) and three empty slots. The real Sacrifice cost (D24) replaces the stub; it is not a second Tour. Daily Standing (D18) and a trainer rematch after a loss stay off unless Vincent asks. `canSpot` still requires `!spotted.<id>`. Q26 is scoped above. It is not on this hold list.

### Parallel, does not unblock Q19

Designer: Tour stop copy and the real `tour.doubt` name (D26); the switch-desk letter, review, and welcome (D19); the Sacrifice one-pager (D24), which replaces the stub. Tier-2 lanyard art, Imogen, Hollis, and Rook's lanyard are in the game (Q20). D13 is the player look picker, which still has no lanyard. Route 2, Cobblecrest, and R5 already have implementer copy on `main`. Replace that copy. Do not write a second set.

Vincent: Standing numbers D14–D17 are due Thu Oct 15 and are still the Build 2 guesses. Daily earning is wanted and slow, and D18 still needs a cap before it is built. The 5-Acorn rest (D28) and the Firebase project plus the privacy line are also open. The town-list rows are settled. The open-table D37 is the region-map claim list, already in the game, and it shares that number. Do not renumber it.

### Reference: Builds 4–6 as they play on main

Do not rebuild these. They are the acceptance content for the glimmer half of Q16. The Keepers Route 2 scenes stay verbatim; the branch adds `@glimmer` twins in `data/glimmer_path.json`.

### Build 4 — Route 2 + Wickerglen glimmer (WP-B2) — on main; do not rebuild

The Keepers Route 2 scenes stay verbatim; `@glimmer` twins are in `data/glimmer_path.json`.

| Scene | Job | Must set |
|---|---|---|
| `lead_intro@glimmer` | Player is a Census volunteer. Three choices: go along / ask why / quietly uncomfortable | Same `story.*` flags as `lead_intro`. Quiet choice may `inc` `story.rook_bond` |
| `faded2@glimmer` | Grey Pebblit, glimmer framing | Same encounter + flags as `faded2` |
| `glen_cleared@glimmer` | `{pet}` still bumps the stand. Imogen praises. Rook doubts | `story.glen_cleared`, `story.rook_saw_lamps`, same gifts as base (3 Befriend Treats) |
| `route2_end@glimmer` | Gate + Cobblecrest invite | Keep `together` / `race` and `story.rook_pact` so `cobble_arrive` still reads |

Do not write `glimmer2@glimmer` unless the volunteer framing cannot be a `lines` key. Quest glimmer rows for these steps already exist in `quests.js`. If Design has not delivered copy, ship with marked placeholders the way Tour stops did — do not block the PR on prose.

Acceptance: a glimmer save at `story.seal1` + `story.slice_end` walks Route 2 and Wickerglen, hits the same gates as Keepers, `glimmerCheck` is empty, 320 + 390 screenshots of each new scene. Keepers Route 2 is unchanged. Old saves past Wickerglen see no new trigger.

Tests: `tests/glimmer_route2.spec.js`, same helpers as `tests/glimmer_fernbrook.spec.js`.

### Build 5 — Cobblecrest glimmer + Hall slot 2 Sacrifice (WP-B3) — stub on main; do not rebuild

The landing shipped the stub this section allowed. The snack stays in the bag, the quota is three spoken names, and Hale's review is optional. All three set `story.seal2` and `seals.seal_glim_2`. Do not invent a second Tour. The real cost is still D24 and replaces the stub after Q16.

| Scene | Job |
|---|---|
| `cobble_arrive@glimmer` | Rook as fellow Junior Bright. Still reads `story.rook_pact` |
| `quarry_buyout@glimmer` | Player beside Dorian; Hale loses the quarry; Rook privately objects to "units". Sets `story.quarry_bought` |
| `rival2_rook@glimmer` | Intro / win / lose only. Same `oneShot` and team |
| Hall slot 2 | Sacrifice. Quota is the free floor (if the player cannot pay the cost, they do a befriend / win / walk target instead). Sets `story.seal2`, grants `seals.seal_glim_2`. The card art is `LANYARD_TIER2` (Q20). The real cost is still D24 |
| `seal2@glimmer` | Match base gifts (`hearty_snack` x2, `wake_tonic` x1) unless `decisions` records a swap |
| `seam_a` / `seam_b` | Shared. Catch-up `if` only if a glimmer player would be confused |

Acceptance: glimmer path reaches `story.cobble_end` hook with `seal2` set; Keepers Hale trial untouched; switching after Seal #1 never blocks the quarry or Hall; `glimmerCheck` empty.

### Build 6 — Rook R5 / Act 1 closer (WP-B4) — on main; do not rebuild

Rule is settled (D23). `main` has two variants of `brinewick_hook`, not four.

- Keepers: Rook leaves Glimmerwell. As built, `story.rook_end` is `"ally"` (parted is still D25). Also writes `story.cobble_end`.
- Glimmerwell: Rook stays. `story.rook_end` is `"stays"`. No quit, no follow-or-stay fork, no free switch. Same progression flags.

Do not wait on bond. `story.rook_bond` may still increment on Route 2 / quarry choices (flavour); it must not gate R5.

After this build both paths end at the same "COMING LATER · Brinewick" card. Brinewick / Hall #3 / Seal 3 is a later map and needs a spec that does not exist yet.

The Oct 13 line "do not start the installable app until Builds 4–6 close" is superseded. Q16 landed those builds. Q17 and Q18 are built. Brinewick and Friends stay on hold. Trainer sight lines still do not re-arm after a loss (`canSpot` requires `!spotted.<id>`).

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

1. **Sacrifice loop (D24).** `main` has the stub (snack stays in the bag, three spoken names, optional Hale review). Still open: the real cost, and whether Quota should be a befriend / win / walk target. It replaces the stub.
2. **Standing numbers and sources (D14–D18):** tiers 0/10/25/45/70, switch halves the side left, one switch per Seal-count chapter, `joinMinTier` 0. Daily earning not built. All still proposals in `STANDING_CFG`.
3. **Completionists:** after switching, can the player also finish the other faction's trial? Default: yes, optional, with that faction's tier granted.
4. **Capture extras (D6–D8):** quarry width 0.18 vs target 0.22 left as is; WARY/FAIR/GOOD shown; no Easier toggle, no miss-shrink, no KO mitigation.
5. **Quest pointer:** tile chevron plus edge arrow. Settings toggle to turn pointing off? Default: on. Side-task count not built (D12).
6. **Glimmer-only mechanics:** calmed-by-lamps capture bonus and glimmer shop items. Default: text only for v1.
7. **Tour stop copy and `tour.doubt` name (D2 / D26).** Engine is in; words are marked `PLACEHOLDER`.
8. **R5 tone (D25).** `main` writes Keepers `"ally"` and Glimmerwell `"stays"`. Still open: parted instead of ally, and whether he appears later as a colleague.
9. **Town boards (town-list D37, D38–D49).** Settled Oct 14, 2026. TB-1 and the Hearthmoor and Fernbrook squares are in the game on main. TB-3 is not started. The region-map claim list uses the same D37, is already in the game, and is still open. Do not renumber either row. The next free id is D63. D56 is the welcome-back line. D57 is clearing a nickname. D58 is Ilse's lodge speech. D59 is the Route 1 explore line and the Keeper1 stop. D60 is Fen's second talk. D61 is the Hall line against the Heights quest after a Glimmerwell pledge. D62 is the modern and arcade control copy. Daily Standing (D18) is yes and slow, with no cap yet.
10. **Capital Partnership Briefing (Q22).** Not built. The Keepers council is Q21 and is in the game. Do not add a second grant on `r5_g`.
11. **Welcome back (D56) and clearing a nickname (D57).** Q25 uses 14 hours and one sentence. Q23 clears `nick` when the field is empty or equals the species name, on the stats card and on the Walkling sheet. Both lines are still placeholders.
12. **Modern and arcade controls (Q26, D62).** Scoped, not started. Arcade keeps the d-pad and the Talk button. Modern hides that pad, floats PHONE, BAG, and MAP, and gives the height to the map. The prompt and the modern tips are placeholders.
