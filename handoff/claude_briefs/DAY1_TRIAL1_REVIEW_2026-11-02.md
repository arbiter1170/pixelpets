# Day 1 to Trial 1 flow: Slice 0 review of open work (Mon Nov 2, 2026)

Read-only review for `handoff/claude_briefs/DAY1_TRIAL1_FLOW_BRIEF_2026-11-02.md` (PR #252), Slice 0. Checked against origin/main `eabac9b` at about 4:15 PM ET. Nothing was changed by the review. Lines are on main unless a ref is named.

The brief's code line hints have drifted. Current lines: `cond` game.js:4622, `condKey` 3973, `SCHED` and `CLOCK_SKIP` 4730-4731, `pickRow` 4770-4781, `whereNow` 5119, `REGION_MAP` 11871 (Fernbrook 11880), `matchHold` 11953, `plainStoryFlag` 17482, `applyCheckpoint` 17561, `trialReady` 3857.

## 1. Open work

| Ref | Behind main | Touches | Relevance to this flow |
|---|---|---|---|
| #248 `claude/handset-spec-base` | 8 | tests/handset_dark.spec.js, CHANGELOG, tests/README | none |
| #249 `claude/rook-lantern-walk` | 8 | game.js, index.html, version.json, GAMEJS_MAP, new spec | low (see 2) |
| #250 `claude/battle-tips-once` | 8 | game.js (tutorial and battle), index.html, version, GAMEJS_MAP, tutorial specs | none; adds only `story.tut_moves_seen` |
| #252 `chief/decisions-2026-11-02` | 5 | docs only | D1164 is booked twice (see 5) |
| #251 | merged | n/a | already on main |
| `claude/faction-pick-or-gate` (no PR) | 8 | game.js, quests.js, data/fernbrook_rooms.json, data/town_board.json, mapdata, fixtures, spec | core dependency |
| `claude/npc-ranks-side-badge` (no PR) | 5 | game.js, save.js, rep.js, standing.js, data/reputation.json, style.css | hold display; ranks for the Hall 1 holders |
| `claude/partner-day-intro` (no PR) | 8 | quests.js (Mom's chain), save.js, game.js (CLOCK_SKIP, SCENE_CAST), new data/detail_zz_partner_day.json, sprites.js | Vincent's intro work (D1020-D1023, D1029), waiting on rule 9 previews |

No PRs numbered #253 to #260 existed at review time.

**Merge churn.** A pairwise dry run (`git merge-tree`) shows every pair conflicting in `version.json`, `tools/GAMEJS_MAP.txt`, `CHANGELOG.md` and the `?v=` stamps in `index.html`. Pairs that both regenerate `data/mapdata.js` conflict there too. The fix is to regenerate on merge with `bump_build.py`, `gen_gamejs_map.py` and `gen_mapdata.py`.

The only real code conflict is **#249 against partner-day**, in game.js at `SCENE_CAST`/`CAST_AT_LOOK` (~8957) and `cutCastAt` (~9101). It is a small hand merge. quests.js merges cleanly between partner-day and the OR-gate branch.

## 2. Per PR and branch

**#249 (Rook walks you to the Lantern House)**
- It rewrites the lost branch of `SCENES.rival1`, the Hearthmoor east-gate match (`rook_gate`/`hm_rival1`, maps_slice.json:58,60, gated `starter_received & !rival1_done`). That match comes before Route 1, not after the crates.
- It reads `story.rival1_result` and sets `lantern.guide_heard`. It adds no story flags and no scene ids.
- There is no flag or ordering clash with this flow. The brief's warning that #249 "touches the same after-first-match beat" does not hold.
- Story should sign off on one overlap: D1143 also has "Rook at the Lantern House" on Fernbrook's last night, so the game would have two such beats.

**`claude/faction-pick-or-gate`**
- It adds `|` to `cond`, to `evalCond` (which also gains `&`), to `condKeyOk`, and to `plainStoryFlag` (which rejects `|`/`&`). Precedence is `|`, then `&`, then `!`, with no brackets.
- Gates it sets:
  - Hall door: `story.crates_seen | story.orchard_cleared` (D1153 as written; this flow changes it, see 4).
  - Route 2 warp and signs: `story.seal1` with `story.side_pick_done | story.orchard_cleared`.
  - Rook teaser.
  - Town-board Hall slips.
  - `heights` skipIf: `story.reached_cobblecrest | story.seal1 & !story.crates_seen`.
  - `STANDING_TAB_WHEN`.
- Nothing sets `crates_seen` or `pitch_*` yet, so players see no change.
- Two readers still lack `|`: `matchHold` (game.js:11955, plain and `!` flags only) and ribbit.js:154. Both read `a | b` as one flag name.

**`claude/npc-ranks-side-badge`**
- It reserves D1159-D1164 and records D1161 and D1164 as settled. **#252 also uses D1164**, for "the Act 5 capital is High Charity".
- D1163 sets one bar word, "BOTH SIDES", for every `split` hold. That covers Fernbrook, Route 2, Route 3, Brinewick and the Heights before `sm_done`, so the word alone cannot mark Fernbrook as specially contested.
- Under D1161, every Keeper needs a ladder rank or a placeholder. The three new Hall 1 holders need cast rows in data/reputation.json.

**`claude/partner-day-intro`**
- It moves `mom` and `mom_sent` to `hm_home_in` (5,4), with Mom downstairs.
- It adds NOT_STEPS entries (`story.lizzy_wake`, `story.home_dressed`, `story.home_walk`) and extends CLOCK_SKIP.
- The holder meets Lizzy in the opening scene. The later `lizzy_intro` becomes a reunion that still sets `story.lizzy_met`.
- The Mahopac and Lizzy slices must build on this branch.

## 3. Flags, gates and saves on main

**Conditions on main.** `cond` splits `&` only (game.js:4623). quests.js `evalCond` (372-380) handles neither `&` nor `|`. Any `|` gate shipped before the OR branch merges reads as one unknown flag, which is false. A door `need` written that way would stay locked forever.

**Fernbrook order today:**
1. `glimmer1`
2. `fen_intro`
3. `fb_side_pick` (9,10), gated `!side_pick_done & !orchard_cleared`
4. `orchard` (sets `orchard_cleared`)
5. Hall door (fernbrook_rooms.json:132)
6. `hall1_fen` (sets `seal1`)

`trialReady()` (3857) is true while the holder has not picked a side.

**Hold.** `fernbrook` is `split` (11880). `matchHold` cannot read `story.side=glimmer`. The validator (12083) allows only `keepers|glimmer|split|wild`.

**Saves.** Flags are a free-form object (save.js:280) with no migrator. `doneMask` (quests.js:387) counts a later done step as done for every earlier step.

| Flag a live save may hold | Set at | Read by |
|---|---|---|
| `story.mom_sent` | mahopac.json:222 | quests.js:212,215; mahopac.json:48-51; detail_wayup.json:59,204,216; interiors.json:77; town_board.json:73,80 |
| `story.reached_mahopac` | mahopac.json:48; detail_wayup.json:60,205,217 | quests.js:215,218; game.js:11907; civic.json:368 |
| `story.dream_woke` | mahopac.json:315 | quests.js:233,236; interiors.json:78,83,105; town_board.json:244 |
| `story.lizzy_met` | detail_lizzy.json:1219 (`lizzy_intro`, Hearthmoor (9,20), `starter_received & !lizzy_met`) | Lizzy bodies (detail_lizzy.json:507, :673), detail_zz_market.json:168,226; game.js:4884,8777; rook_crossroads.json:619 |
| `story.orchard_cleared` | maps_slice.json:257; glimmer_path.json ~461 | Hall door fernbrook_rooms.json:132; maps_slice.json:136-140; town_board.json:120,127; quests.js:100; `fb_side_pick` |
| `story.seal1` | maps_slice.json:263 | quests.js:96,104; act1_route2.json:279-284; game.js:3859; town_board.json:128-142 |
| `story.side_pick_done` | `side_pick` scene; debug game.js:17562 | quests.js:96; trialReady; standing.js:119; game.js:11974; highcharity.json:37-64 |

**What this means for the skips:**
- Almost every save holds `story.lizzy_met` before Fernbrook, so skipping on it would skip the class for everyone. The class needs its own done flag.
- `story.reached_mahopac` only means the holder stepped onto the trail. "Already did Mahopac" should read `story.dream_woke`.
- A main-chain step cannot reuse a side-chain id such as `mahopac`, because devCheck (quests.js:474) rejects ids that appear in both.
- `applyCheckpoint` (game.js:17561-17563) sets `side_pick_done` for any main step after `orchard`. That is wrong under D1142 and will seed the test saves incorrectly.

## 4. Hall door gate and D1153

D1153's door (`crates_seen | orchard_cleared`) would open on Day 1. Fen stands on the dais with no gate (`fen_hall`), and `trialReady` is true, so a holder could win Trial 1 before the home trip. A separate issue: `fen_orchard` stays outdoors while `!orchard_cleared` (maps_slice.json:140), so Fen would be in two places while she is meant to be away.

**Vincent's ruling (Mon Nov 2, ~4:20 PM ET): the door opens only after Lizzy's class.** Saves already past the old gate keep the door open through a read-only OR. That is save compatibility only, not a second way in. The full gate and its deny line are in `handoff/specs/DAY1_TRIAL1_FLOW.md`.

## 5. Risks and sequencing

1. D1153 must be amended rather than left to settle as written (Vincent ruled: the door opens after the class only).
2. D1164 is booked twice (#252 and `claude/npc-ranks-side-badge`). Renumber one before either merges.
3. Lizzy's class is a second meeting. The holder meets her in the opening scene (partner-day). The class gets its own done flag.
4. Merge order: the OR gate first (main has no `|`), then partner-day, then the visible slices. #249 and partner-day need the small hand merge in game.js.
5. Keeping Lizzy at the Schoolhouse means a first-matching `schedule` row on `school_lizzy` (pickRow 4770-4781; whereNow follows it). detail_lizzy.json is design-generated, so the change goes through an overlay or a code pin table. The class kids `school_kid_a`/`_b` also need to be kept there, or a class held at night would be empty.
6. The Fernbrook flip needs `matchHold` to read the picked side.
7. Hall 1 has no holders before Fen today. Three Keepers change the §7.5 arrival test and interact with D1128, and each needs a D1161 rank.

**Update, Mon Nov 2, 2026, ~5:15 PM ET:** items 1 and 2 are resolved on main. Vincent held D1153 (superseded by D1169) and ruled that the Hall door and the pick both come after the class (5:03 PM ET, #256). D1164 was renumbered: High Charity is now D1174 and the next free id is D1175 (09ed47c). Vincent also deprioritized old saves and approved the main-chain edit (5:05 PM ET, #257). See `handoff/specs/DAY1_TRIAL1_FLOW.md` v0.2.
