# DAY1_TRIAL1_FLOW: from the crates to Trial 1 (Slice 1 spec)

Target path: `handoff/specs/DAY1_TRIAL1_FLOW.md` (PUBLIC repo; not `docs/`). Spec only: nothing here is built, and nothing builds before Vincent approves this spec. All player text below is PLACEHOLDER; Story writes the real lines.

## 1. Status and sources

| Item | Value |
|---|---|
| Status | Draft v0.2, Mon Nov 2, 2026, ~5:15 PM ET: v0.1 plus Vincent's 5:03 and 5:05 PM ET rulings (R9-R12, main `OPEN_DECISIONS.md` "NEW DIRECTION Nov 2", PRs #256 and #257). Waits for the Supervisor's review before Slice 2. |
| Brief | `handoff/claude_briefs/DAY1_TRIAL1_FLOW_BRIEF_2026-11-02.md` on `pr252` (`chief/decisions-2026-11-02`, fadb984), SLICE 1 section |
| Rulings | pr252 `OPEN_DECISIONS.md` "NEW DIRECTION Nov 2, 3:55 PM (Vincent)"; Open rows D1144-D1148, D1153-D1157; pr252 `archive/DECISIONS_SETTLED.md` "Mon Nov 2, 2026: Vincent's rulings" (D1141-D1143, D1149-D1152 settled 2:35 PM ET) |
| Vincent's rulings in this session | R1-R8, Mon Nov 2, 2026, ~4:20 PM ET, Vincent, in this Claude Code session (table below). SETTLED direction. |
| Design source | FACTION_PICK_TIMING v0.2.4, design commit `ffada0b` (parts A-D, §7). Cited by id, flag and section only. |
| Code base | origin/main `eabac9b`. Branch refs: `#253` = `claude/faction-pick-or-gate` c9eed5e (now PR #253); `pd` = `claude/partner-day-intro` b5a45a7 (no PR); `ranks` = `claude/npc-ranks-side-badge` 6f3c600 (no PR); `#249` = `claude/rook-lantern-walk` f5ce1bc |
| Cites | `file:N` is origin/main unless a ref is given. UNVERIFIED marks a claim not checked in code. |

| R | Vincent's ruling (R1-R8 ~4:20 PM ET, this session; R9-R12 5:03-5:05 PM ET, recorded on main) | Spec home |
|---|---|---|
| R1 | Keep both on Day 1: D1143's Fen with Russet at dusk and the Two Lights beats stay. Fen's potential / go-home talk comes after (next morning, before the holder leaves Fernbrook); she then leaves to talk with the local Keeper authorities. | §2, §6; D1166 |
| R2 | Lizzy's class runs at any hour while its step is active: Lizzy and the class kids are pinned at `hm_school_in`; normal schedules resume after. | §6; D1168 |
| R3 | Three Keeper holders in `fb_hall_in` before Fen, each with a D1161 rank. D1128 still decides Fen's team; §7.5 arrival test is re-run. | §8; D1170 |
| R4 | Fernbrook's hold flips to the picked side at the pick result after Trial 1. Full town steering stays red (Slice 9). | §9; D1171, D1173 |
| R5 | The Hall door opens only after Lizzy's class (amends D1153 for new saves). Saves already past the old gate (`story.orchard_cleared` or `story.seal1`) keep it open through a read-only OR. | §7; D1169 |
| R6 | The holder meets Lizzy in the opening scene (`pd`), then again at the class. The class is not a first meeting; its skip flag is a new done flag, never `story.lizzy_met`. | §4, §6; D1168 |
| R7 | The class is a quest: Mom insists. Main-chain order after the crates: Fen's go-home talk, Mom's Mahopac quest (main chain), Mom insists on the class, the class, Fernbrook (door open), three Keeper holders, Fen, the pick (D1055, Part D, D1142). | §4; D1167 |
| R8 | A save that already finished Mahopac (`story.dream_woke` or `story.dream_study`, not `story.reached_mahopac`) gets Fen's variant line that sends them straight to the class; Mom's insistence step is skipped. Mahopac stays reachable from the start. | §4, §5; D1167 |
| R9 | 5:03 PM ET: "Picking a side should be after the class, same with hall door." The Hall door and the pick both come after Lizzy's class. D1153 is HELD (superseded by D1169); D1172 is answered NO. | §5, §7; D1169, D1172 |
| R10 | 5:05 PM ET: "Not worried about old saves right now." Q5 and Q7 are deprioritized: take the simplest save-safe option (no save writes, `v` stays 2, no migrator) and spend no effort on old-save edge cases. | §5, §8, §9 |
| R11 | 5:05 PM ET: "Ok to edit main quest chain." The main CHAIN rows in §4 are approved; `orchard` keeps its position. | §4; Q11 |
| R12 | Ship Slices 4a-6 as one merge. | §15; Q12 |

## 2. The flow in one table

| # | Beat | Where | Who | Trigger | Sets |
|---|---|---|---|---|---|
| 1 | Part A, Day 1 (FPT A1-A6 as settled by D1141/D1143): stand, Fen's intro, crate taps and Tobin's tally, Fen with Russet, Two Lights, Fen at dusk | `fernbrook` (orchard gate 9,14; orchard 10,9) | Juniper, Fen, Tobin, Russet | FPT Part A objects (not built) | `story.met_glimmerwell`, `story.met_fen`, lean counters, **`story.crates_seen`** |
| 2 | NEW A7: next morning (curtain/narration only, D1155), Fen's potential and "go home for now"; she leaves for the Keeper authorities | `fernbrook`, orchard (10,9) | Fen | Runs on from A6; fallback NPC `fen_morning` + exit trigger (§6) | **`story.fen_sent_home`**; variant also sets **`story.class_sent`** (R8) |
| 3 | Mom's Mahopac quest (built side chain, unchanged scenes) | home, `hm_home_in` (5,4) on `pd`; north trail; `mahopac_obs`; dreams | Mom, Ilse (later) | main step `home_trip` mirrors side chain `mom` | existing `story.mom_met` ... `story.dream_woke` |
| 4 | Mom insists on Lizzy's class | `hm_home_in` (5,4) on `pd` | Mom | Mom's `lines` key, plus an insert at the end of `mom_wake` | **`story.class_sent`** |
| 5 | Lizzy's class: she explains the Keepers vs Glimmerwell struggle and points the holder to Fernbrook | `hm_school_in` (Lizzy 10,3; kids 3,4 and 6,4) | Lizzy, Buddy, Pip, Wren | `school_lizzy` lines key while the step is active; any hour (R2) | **`story.lizzy_class`** (and `story.lizzy_met` if unset, Q4) |
| 6 | Fen is back; Hall door opens | `fernbrook` (22,6) | Fen (`fen_hall` 7,4) | door `need` (§7) | none |
| 7 | Three Keeper holders | `fb_hall_in` | `h1_keeper_a/b/c` | sight or walk-up | `trainer.h1_keeper_a/b/c` |
| 8 | Hall 1: Fen (FPT Part B; Seal for everyone, D1150) | `fb_hall_in` (7,4) | Fen | hall1 panel | `story.seal1`, `seals.seal_fernbrook` |
| 9 | Pitches, the morning cart, the pick (FPT Parts C, D; D1142) | `fernbrook`, `fb_side_pick` (9,10) | Amos, Juniper, Fen, Rook | as FPT | `story.side`, `story.side_pick_done`, `story.orchard_cleared`; Fernbrook hold flips (D1171) |

## 3. What it replaces and what stays

FACTION_PICK_TIMING v0.2.4 parts:

| Part | Now |
|---|---|
| A. Day 1 crate area | **Stays** whole (R1), Part A guard of FPT §7.2 included. **Adds** A7 (row 2 above). |
| The Hall door | **Changed** (§7): no longer opens on `story.crates_seen`; opens on `story.lizzy_class` (new saves) or the old-save reads. |
| B. "Day 2", Hall 1 | **Moved later:** the home trip and the class now sit between Day 1 and Hall 1, so "Day 2" is no longer literal. **Adds** three Keeper holders (§8). Fen's pre-pick intro and Seal line stay. |
| C. The two pitches | **Stay**, after Hall 1. |
| D. The morning cart and the pick | **Stay**. The result also flips Fernbrook's hold (§9). |
| §7 build order | Step 1 (OR gate) is #253 and goes first. Step 3's Part A becomes Slice 4a here (§15). |
| §7.4 save kinds | Reused, plus three kinds (§5). |
| §7.5 Fen arrival test | **Re-run** with the holders' XP and the Mahopac trip (§8). |

D1141-D1157:

| Id | Colour | Now | Reason |
|---|---|---|---|
| D1141 | red, settled | **Amended** by D1167/D1169 | The crate area is still required before the Hall door, but no longer enough: Fen's talk, Mahopac and the class come between. The pick half (pitches and cart before the pick) stands. |
| D1142 | red, settled | **Stands** | Pick after Trial 1 at `fb_side_pick`, result sets the side, `story.side_pick_done` and `story.orchard_cleared` together. D1171 adds the hold flip at the same result. |
| D1143 | red, settled | **Amended** by D1166 (adds) | Every staged beat stays (R1). Adds Fen's morning talk and her absence; Hall 1 is no longer on Day 2. |
| D1144 | yellow | **Stands** | STANDING opens on the pick or both pitches. |
| D1145 | yellow | **Stands**, and binds the class | No line asks the holder to join a side before Hall 1: Lizzy explains the struggle, she does not recruit. |
| D1146 | yellow | **Stands** | Lean counters stay flavour. |
| D1147 | yellow | **Stands** | No spar; Fen at dusk stays on Day 1. |
| D1148 | yellow | **Stands** | Both cart tasks before the last night. |
| D1149 | red, settled | **Stands** | Juniper's task is `tour1_s1`. |
| D1150 | red, settled | **Stands** | Seal for everyone at Hall 1. |
| D1151 | red, settled | **Stands** | Route 2 waits for the pick (#253 overlay). |
| D1152 | red, settled | **Stands** | `heights` skipIf on #253 `quests.js:98`. |
| D1153 | yellow | **HELD, superseded by D1169** (Vincent, 5:03 PM ET, R9) | `story.crates_seen` does not open the door or the open slip; the door opens after the class. |
| D1154 | yellow | **Stands** | Wick errand is Day 1, unchanged. |
| D1155 | green | **Stands**, and covers A7 | "Next morning" is narration and `curtain` only. |
| D1156 | yellow | **Stands** | Every gate here is a read; nothing is written at load. |
| D1157 | green | **Stands** | Route 3 unchanged. |

## 4. New main-chain order in quests.js

Rules: the existing side chain `mom` (`quests.js:206-238`) keeps every id, flag, `when` and `done` (AGENTS rule 2). `devCheck` rejects an id used in both CHAIN and SIDE (`quests.js:474`, `:481`), so the main chain gets **new wrapper ids** whose `done` reads the side chain's flags. Every new row carries the old-order guard as two separate `when` entries, `'!story.side_pick_done'` and `'!story.orchard_cleared'` (FPT §7.2 style; `when` is AND across entries), so a1, a2, b, b' and c never see them. `doneMask` (`quests.js:387`) marks a row done when any later row is done, so a2/b' (orchard done) and b/c (Seal 1 done) imply every new row with no write. Note: walklings-quests says the main CHAIN "stays untouched"; R7 overrides that for these rows only.

| Order | id | when | done | skipIf | target / npc | Text (PLACEHOLDER) |
|---|---|---|---|---|---|---|
| (kept) | `fen` (`:93`) | none | `story.met_fen` | none | fernbrook 10,9 | as built |
| (kept) | `heights` (#253 `:98`) | `story.side_pick_done` | `story.heights_done` | D1152 string | as built | as built |
| new | `crates` (FPT §7.4 fallback) | guard | `story.crates_seen` | none | fernbrook 9,14 (Tobin's tally) | PLACEHOLDER: help Tobin at the orchard gate |
| new | `fen_home` | guard, `story.crates_seen` | `story.fen_sent_home` | none | `npc: 'Master Fen'`; fixed fernbrook 10,9 | PLACEHOLDER: Fen wants a word in the orchard |
| new | `home_trip` | guard | `story.dream_woke \| story.dream_study` | none | `mirror: 'mom'` (shows the active `mom` side step); fallback `pd` hm_home_in 5,4 | PLACEHOLDER: head home, Mom has plans |
| new | `mom_class` | guard, `story.fen_sent_home` | `story.class_sent` | none | `npc: 'Mom'`; `pd` hm_home_in 5,4 | PLACEHOLDER: Mom wants a word |
| new | `lizzy_class` | guard, `story.class_sent` | `story.lizzy_class` | none | `npc: 'Lizzy'` (pinned, §6); hm_school_in 10,3 | PLACEHOLDER: Lizzy's class at the Schoolhouse |
| changed | `orchard` (`:100`) | **add** `story.side_pick_done` | `story.orchard_cleared` | none | as built | as built |
| new | `hall1_keepers` | `!story.side=glimmer` | `trainer.h1_keeper_a`, `trainer.h1_keeper_b`, `trainer.h1_keeper_c` | none | fernbrook 22,6 | PLACEHOLDER: three Keeper holders wait in the Hall |
| (kept) | `hall1` (`:104`) | none | `story.seal1` | none | fernbrook 22,6 | text may change (Story) |

Notes:
- `orchard` gains `when: ['story.side_pick_done']`. Today it sits before `hall1` and is done only on `story.orchard_cleared`, which D1142 now sets at the pick, after Hall 1; without the `when` a new save would stall on it. It must stay in its array position: moving it after `hall1` would let a2/b' (orchard done) imply `hall1` done through `doneMask`. a1 still sees it as today. FPT §7 step 4 owns the chain; flagged to Design (Q11).
- `fen_home` needs `story.crates_seen` in `when` so the pointer stays on `crates` until Part A ends; `mom_class` needs `story.fen_sent_home` and `lizzy_class` needs `story.class_sent`, so no row points ahead of the story.
- R8 variant: Fen's scene sets `story.class_sent` when `story.dream_woke | story.dream_study` holds, so `home_trip` and `mom_class` are both done at once and the pointer lands on `lizzy_class`. A save that is mid-trip (`story.mom_sent` or `story.reached_mahopac` only) gets the normal talk; `home_trip` mirrors its live side step.
- `mirror` (new field, Slice 5): while `home_trip` is the current main row, `current()` returns the active step of the side chain whose first id is `mom` (its text, place, target), keeping id `home_trip`; `sideActive` (`quests.js:401`) leaves the `mom` chain out while it is mirrored, so the card never shows twice. `dream_study` (tell Ilse) stays a side step after `home_trip` is done.
- `npc` (new field, Slice 3): generalises `liveStep` (`game.js:4896`, today only `leak_ask`) to any step with `npc`; the static `target` stays as fallback and for `devCheck`.
- `hall1_keepers`: `when` excludes a Glimmer save (old Glimmer a1/a2 saves run the Tour, `glimmerHallSteps` `game.js:6751`). `trainer.*` flags are not `story.*`, so `devCheck` and `plainStoryFlag` ignore them; debug checkpoints set them through `DEBUG_TRAINER_GATES` (`game.js:17388`, add `['story.seal1', 'h1_keeper_a']` and the other two).
- No new NOT_STEPS: `story.fen_sent_home`, `story.class_sent`, `story.lizzy_class` are all `done` flags. Each is listed in its data file's `flags` map (walklings-quests).
- `pd` moves Mom's `mom` and `mom_sent` targets to `hm_home_in` (5,4) (`pd` `quests.js:207`, `:213`) and Mom's object downstairs (`pd` `data/detail_zz_partner_day.json:286`). Every Mom row above assumes `pd` has merged (§15).

Side chain and main chain together (side rows unchanged):

| Side step (`quests.js`) | done | Main row that reads it |
|---|---|---|
| `mom` `:206`, `mom_chore`, `mom_sent` `:212` | `story.mom_met`, `story.mom_chore`, `story.mom_sent` | `home_trip` (mirrored) |
| `mahopac`, `observatory`, `dream_toy`, `dream_party`, `dream_dad` | `story.reached_mahopac` ... `story.dream_dad` | `home_trip` (mirrored) |
| `dream_wake` `:233` | `story.dream_woke` (`data/mahopac.json:315`) | `home_trip` done |
| `dream_study` `:236` | `story.dream_study` (`data/mahopac.json:331`) | `home_trip` done (OR); stays a side card |

## 5. Save kinds

Door `need` (§7): `story.lizzy_class | story.orchard_cleared | story.seal1` (R9: the pick alone never opens it). Fixtures: #253 `tests/fixtures/or_gate_kinds.js` (seven kinds plus cuts); three kinds added here.

| Kind | Flags (short) | Chain resumes at | Door | The OR term that reads |
|---|---|---|---|---|
| a1 | picked; no orchard, no Seal 1 | `heights` (or `orchard`), as today; new rows hidden by guard | **shut** (D1172 NO, R9) until the orchard clears it, as today | `story.orchard_cleared`. Old-save edge case, deprioritized (R10): no extra work |
| a2 | picked, orchard; no Seal 1 | `hall1_keepers`, then `hall1` | open | `story.orchard_cleared` |
| b | Seal 1, orchard; not picked | past Fernbrook | open | `story.orchard_cleared` (and `story.seal1`) |
| b' | orchard; not picked, no Seal 1 | `hall1_keepers`, then `hall1` | open | `story.orchard_cleared` |
| c | picked, Seal 1 | past Fernbrook | open | `story.seal1` (and the other two) |
| p | mid-Fernbrook, none of pick/orchard/Seal 1/crates | `crates` (Part A), then the new flow | shut until `story.lizzy_class` | `story.lizzy_class` |
| n | new-build save, no Fernbrook flags yet | `fernbrook` row, then the new flow | shut until the class | `story.lizzy_class` |
| fresh | brand-new game on the `pd` build: `story.lizzy_wake`, then `story.lizzy_met` at the plaza reunion | `wake`, then as n | shut until the class | `story.lizzy_class` |
| Mahopac done | p/n plus `story.dream_woke` (or `story.dream_study`) | after `fen_home`: `lizzy_class` (Fen's variant set `story.class_sent`; `home_trip`, `mom_class` done) | shut until the class | `story.lizzy_class` |
| Lizzy in the opening only | p/n plus `story.lizzy_wake`, no `story.lizzy_met` | as n; at the class, `school_lizzy` shows on `story.lizzy_met \| story.class_sent` | shut until the class | `story.lizzy_class` |

Read-only tells (FPT §7.4, unchanged): old picked order `story.side_pick_done & !story.crates_seen`; old never-picked `story.orchard_cleared & !story.side_pick_done`. This flow adds one: new-flow Fen away `story.fen_sent_home & !story.lizzy_class`. Nothing is written at load; `v` stays 2; `normalizeV2` is untouched (all new keys live in free-form `S.flags`).

The OR terms are a save-compat read, **not a second route**: on a new-flow save, `story.orchard_cleared` and `story.seal1` are only ever written after Hall 1 (D1142, D1150), so they cannot open the door before the class. The pick (`story.side_pick_done`) is not a term (R9). Per R10 this is the simplest save-safe reading: no writes, `v` 2, no migrator, and no further old-save work.

## 6. NPC whereabouts per step

| NPC | Today | Step(s) | Pin or follow |
|---|---|---|---|
| Fen | `fen_orchard` fernbrook 10,9, `when ["!story.orchard_cleared"]` (`maps_slice.json:140`, verbatim); `fen_hall` fb_hall_in 7,4, no `when` (`fernbrook_rooms.json:98`); no SCHED rows; `whereNow` has no row for her (returns null) | `fen`, A1-A7, `fen_home`, `hall1` | Fixed bodies, gated so she is in **one** place: `fen_orchard` restated in the overlay with `when ["!story.orchard_cleared", "!story.fen_sent_home"]`; `fen_hall` gets `when ["!story.fen_sent_home \| story.lizzy_class"]`; FPT Part A/C/D Fen objects carry their own guards |
| Fen, away | none | between `fen_home` and `lizzy_class` | **Not drawn anywhere** (default, Q2). `whereNow('Master Fen')` returns state `work`, place PLACEHOLDER ("away on Keeper business") while `story.fen_sent_home & !story.lizzy_class`. If Story places her, the candidate is Keeper House upstairs (`hm_hq_f2`, `data/civic.json:268`); no new place is invented |
| Mom | main: `interiors.json:71` hm_home_up 5,3 (verbatim); `pd`: hm_home_in 5,4, `lines` keyed by flag (`pd` `detail_zz_partner_day.json:286-303`); `whereNow` fixed 'home' (`game.js:5120`); `pd` casts her upstairs only for `mom_wake` (`pd` `game.js:8994`) | `home_trip`, `mom_class` | Always present (no schedule): the step points at her fixed tile. Add `lines` key `"story.fen_sent_home & !story.class_sent": "@mom_class"` right after the `!story.dream_woke` key (`pd` `:303`), before `!story.dream_study`, plus an insert at the end of `mom_wake` (`data/mahopac.json:302-316`) that runs `mom_class` when `story.fen_sent_home` holds (cutscene insert, no edit to the scene) |
| Lizzy | `hm_lizzy` hearthmoor 9,20 (`detail_lizzy.json:154`, CLOCK_SKIP `game.js:4731`); `school_lizzy` hm_school_in 10,3, `when ["story.lizzy_met"]`, rows weekday school / Tue-Thu diner / Sat court / home 5B (`detail_lizzy.json:500-518`); `pd` adds `hm_lizzy_pre` and the cast `lizzy_wake` (CLOCK_SKIP `pd` `game.js:4743`) | `lizzy_class` | **Pinned**: a first schedule row `{"when": "story.class_sent & !story.lizzy_class", "map": "hm_school_in", "x": 10, "y": 3, "facing": "down", "state": "work", "place": "Schoolhouse"}`. Rows are read by `cond()` (`rowWhen` `game.js:4769`; first match wins, `pickRow` `:4770`). `school_lizzy` and `school_buddy` `when` become `["story.lizzy_met \| story.class_sent"]`; `hm_lizzy`/`hm_buddy` gain `"!story.class_sent \| story.lizzy_class"` so she is never at the plaza and the school at once. Her `lines` get `"story.class_sent & !story.lizzy_class": "@lizzy_class"` ahead of the `leak_ask` key. Schedule resumes when `story.lizzy_class` is set |
| Buddy | follows Lizzy (`game.js:4881`) | `lizzy_class` | follows the pin |
| Pip, Wren (class kids) | `school_kid_a`/`school_kid_b`, weekday school at 2,4 nudged to 3,4 and 6,4 (`detail_lizzy.json:466-497`; `CLOCK_NUDGE` `game.js:4732-4735`), court after school, else off-map | `lizzy_class` | **Pinned** with the same first row (map hm_school_in 2,4; the nudge places them), so the room is never empty |
| Keeper authority NPC | not identified. Candidates in the game today: Captain Lumen (`hm_hq_f2`, `civic.json:318`), Constable Rue (fernbrook 4,9, `civic.json:88`) | none (no step targets them) | Default: nobody is pinned; Story names them (Q3). If staged, they follow their current body and Slice 3's test covers them |
| Tobin | `fern_associate` fernbrook 9,14 (`maps_slice.json:141`, `:185`); FPT makes him the tally, battle only for a1 | `crates` | Fixed (Part A tally prop) |
| Three Hall holders | new | `hall1_keepers` | Fixed `kind: "trainer"` objects in `fb_hall_in`; always present until beaten |

Fen's go-home talk "before the holder leaves Fernbrook" (R1), default (Q9): the A6 dusk scene ends with a `curtain` to morning and runs `fen_home` at once. Fallbacks for a save that stops between the two: NPC `fen_morning` at fernbrook 10,9, `when ["story.crates_seen", "!story.fen_sent_home", "!story.side_pick_done", "!story.orchard_cleared"]`, scene `fen_home`; and a trigger beside `fb_west` (0,8; `maps_slice.json:129`) with the same `when`. Tiles that reach `fb_west` are UNVERIFIED.

## 7. Hall door gate

| Item | Value |
|---|---|
| Today | `fb_hall` need `story.orchard_cleared` (`fernbrook_rooms.json:132`; verbatim copy `maps_slice.json:131` stays as written) |
| #253 | `story.crates_seen \| story.orchard_cleared` (#253 `fernbrook_rooms.json:133`). Safe to merge as is: nothing sets `story.crates_seen` yet. **Wrong for this flow** once Part A writes it |
| New `need` | `story.lizzy_class \| story.orchard_cleared \| story.seal1` (R9, D1172 NO: `story.side_pick_done` is not a term; one string; `\|` splits first, AND-free, so reader order cannot change it) |
| Where | `fernbrook_rooms.json` slicePatch `replaceObjs` `fb_hall` only. Lands in the **first PR that writes `story.crates_seen`** (Slice 4a), so #253's string never opens the door on a new save |
| Deny | Keyed deny (small engine change at `game.js:6733`, which today takes one string): `{"!story.crates_seen": <June's v0.2.3 deny line, FPT §2.1>, "else": "PLACEHOLDER: The Hall is shut. A note: Fen is away on Keeper business."}`, picked with the NPC `lines` reader. Fallback if Vincent prefers no engine change: one PLACEHOLDER line (Q10) |
| Town board (`town_board.json:116-129`; #253 `:117-128`) | `fb_hall_latched`: `when ["!story.crates_seen", "!story.lizzy_class", "!story.orchard_cleared", "!story.seal1"]`, June's FPT copy. NEW `fb_hall_away`: `when ["story.crates_seen", "!story.lizzy_class", "!story.orchard_cleared", "!story.seal1"]`, PLACEHOLDER text (Fen away). `fb_hall_open`: `when ["story.lizzy_class \| story.orchard_cleared", "!story.seal1"]`. Latched + away together are the exact opposite of open before Seal 1 |
| Dependency | #253 must merge first: `cond()` on main splits `&` only (`game.js:4623`), so the `\|` string would read as one flag name and shut the door on every save, and the boot validator would log an error |

## 8. Trial Hall roster

| Item | Value |
|---|---|
| Ids | `h1_keeper_a`, `h1_keeper_b`, `h1_keeper_c` (new `trainers` entries in `fernbrook_rooms.json`, which the `TRAINERS` merge already reads, `game.js:3842`; objs in `fb_hall_in` `fernbrook_rooms.json:55-124`). `FACTION` (`game.js:3852`): `keepers` |
| Pattern | Hall 2's crew: `h2_sweeper`, `h2_builder` before `hall2_hale` (`cobblecrest.json:285-287`, `:319-368`): two Walklings each, sight 8, `ai: basic` |
| Positions | TBD on the tiered path from the mat (7,23) to the dais (7,4), on walkable tiles beside the t1-t6 props (`fernbrook_rooms.json:117-122`). No prop moves. If any layout change is wanted, rule 9 previews first |
| Names, looks, lines | PLACEHOLDER (Story). Rank per D1161(E): `[Rank] PLACEHOLDER` until Design assigns (D1159 pattern on `ranks`) |
| Level band | Relative to Fen's lowest level F1 (today 12, `moves.js:1778`; 10 under D1128's default): holders at F1-2 to F1, Hall 2's spacing. Numbers are PLACEHOLDER until D1128 rules and §7.5 passes |
| Fen gate | Fen's walk-up (`MATCH_WALKUP` `game.js:6258`) and the hall1 panel (`game.js:6775-6791`) also need all three `trainer.h1_keeper_*` flags, unless `story.seal1` or a Fernbrook Seal is held, or the save is Glimmer. Deny line PLACEHOLDER. Applies to every Keepers save without Seal 1 (Q5, deprioritized by R10: no old-save special case) |
| D1128 | Still open and still decides Fen's team. The holders add XP before Fen, the Heights XP now comes after Hall 1 (FPT §7.5), and the Mahopac trip now sits before Hall 1 |
| §7.5 | Re-run after Slice 8: one CLEAN new-flow run, party level recorded at the Hall door, 12 tries at Fen, pass at 6 or more wins |

## 9. Fernbrook contested, and the flip at the pick

| Item | Value |
|---|---|
| State today | `REGION_MAP.nodes.fernbrook.hold = [{ id: 'split', ... }]` (`game.js:11880-11881`); validator asserts `mapHold('fernbrook', {}) === 'split'` (`game.js:12107`) |
| Why it can't read the pick | `matchHold` (`game.js:11953`) tests each `when` entry with a flag-only `ok` (`:11955`): `'flag'` or `'!flag'`. `'story.side=glimmer'` reads as a flag of that literal name (always false), and `\|` is not read |
| Minimal additive change (default) | (1) Teach `ok` the `k=v` form, as `evalCond` does (`quests.js:372`). (2) Put two rules before `split`: `{ id: 'glimmer', when: ['story.side_pick_done', 'story.seal1', 'story.side=glimmer'], line: PLACEHOLDER }`, `{ id: 'keepers', when: ['story.side_pick_done', 'story.seal1', '!story.side=glimmer'], line: PLACEHOLDER }`. On a new save both flags first hold at the pick result (D1142). No save write. `{}` still resolves to `split`. Add validator asserts for both flips |
| Alternative | Per-side flags written by the pick result (new saves only); old c saves stay `split` |
| Live-save effect (Q7, deprioritized by R10) | Read stays the method (no writes, simplest save-safe option). The read flips old c saves on load. A Glimmer hold turns on the daily hum gain (`game.js:767`) and align glow (`game.js:4122`) in Fernbrook for c-glimmer saves |
| D1163 | The `ranks` bar shows "BOTH SIDES" for `split`; after the flip it shows the side word. Slice 7's signs read the same hold |
| ribbit.js | Its `cond` (`ribbit.js:152-159`) reads `!`, `=` and bare flags only: no `\|`, no `&`. Nothing here gives it an OR string |
| Steering | The general system (which Trial steers which town, what flips, what the holder sees) is **red**, D1173, Slice 9 spec first |

## 10. New flags, scene ids, quest ids, files

All additive (AGENTS rule 2); nothing renamed or removed; no retired scene id.

| Kind | Id | Written by / used by |
|---|---|---|
| flag | `story.crates_seen` | FPT Part A A6 (already named by FPT; #253 reads it) |
| flag | `story.fen_sent_home` | scene `fen_home` |
| flag | `story.class_sent` | scene `mom_class`; scene `fen_home` (R8 variant) |
| flag | `story.lizzy_class` | scene `lizzy_class` |
| flag | `trainer.h1_keeper_a/b/c` | battle wins (engine) |
| scene | `fen_home` (one scene, `if` on `story.dream_woke \| story.dream_study` for the variant) | NPC `fen_morning`, exit trigger, A6 run-on |
| scene | `mom_class` | Mom's `lines`; `mom_wake` insert |
| scene | `lizzy_class` (opens with `run lizzy_intro` when `!story.lizzy_met`, Q4) | `school_lizzy` |
| quest | `crates`, `fen_home`, `home_trip`, `mom_class`, `lizzy_class`, `hall1_keepers` (main CHAIN) | checked unused on main, #253, `pd`, `ranks`, pr252 |
| object | `fen_morning`, the exit trigger, `fb_hall_away` slip, `h1_keeper_a/b/c` | §6, §7, §8 |
| data file | `data/detail_zz_day1.json` (new, game-owned overlay for Hearthmoor and school objects; joins the `names` tuple in `tools/gen_mapdata.py`) | §6 |

Verbatim design files (AGENTS rule 8), touched only through overlays:

| File | Object | Overlay |
|---|---|---|
| `data/maps_slice.json` | `fb_hall` `:131` (already replaced at boot), `fen_orchard` `:140`, `fern_associate` `:141` (FPT) | `fernbrook_rooms.json` slicePatch `replaceObjs` (applied after every detail patch, `game.js:3823-3826`) |
| `data/interiors.json` | Mom `:71` | none needed: `pd` removes and re-adds her through its own overlay |
| `data/act1_route2.json`, `data/cobblecrest.json` | none | none |

Not on the rule 8 list but kept byte-identical by choice: `data/detail_lizzy.json` (LIZZY.md v0.2 packet) and `data/mahopac.json` (changes go in `detail_zz_day1.json` and a cutscene insert). After any `data/*.json` edit: `python3 tools/gen_mapdata.py`.

## 11. Tests

Every spec: 320, 375 and 390; reduced motion; zero console errors; FPT §7.3 snapshot (after-load byte-identical to before-load; `v` 2); `questCheck` `[]`. Run with `npm run test:agent -- tests/<file> [--project=390]`.

| Slice | New spec | Asserts |
|---|---|---|
| 3 | `tests/quest_npc_where.spec.js` | For Mom, Lizzy, Fen (incl. away) and any staged Keeper authority NPC, at school hours, evening, late night and weekend: marker map and tile equal the NPC's standing tile, or the NPC stands on the step's fixed target. No step points at an empty tile at any hour |
| 4a | `tests/fb_part_a.spec.js` | Part A guard per FPT §7.2; `story.crates_seen` set; door still shut after Part A (new string) |
| 4 | `tests/fen_home.spec.js` | A6 runs on into `fen_home`; fallback NPC and exit trigger; Fen never present on two maps at once (scan WORLD with `present()` across flag states); keyed deny lines; board slips |
| 5 | `tests/main_chain_mahopac.spec.js` | `home_trip` mirrors each `mom` step and the side card hides; R8 variant skips `mom_class`; `story.reached_mahopac` alone does not trigger the variant |
| 6 | `tests/lizzy_class.spec.js` | Class at weekday 10:00, 21:00, 03:00 and Saturday: Lizzy, Buddy, Pip and Wren in hm_school_in; plaza Lizzy hidden; schedules resume after; `leak_ask` still reaches her |
| 4a-6 | `tests/hall_door_gate.spec.js` | Door and slips for every kind in §5 |
| 4a-6 | `tests/day1_flow.spec.js` | Fresh save from the crates to the open door, one tap per accept |
| 4a-6 | `tests/day1_save_kinds.spec.js` | §5 table via `PixelPets.gateRead`/`condRead` (#253 hooks), extending #253's fixtures with `mahopac_done`, `lizzy_opening_only`, `fresh` |
| 8 | `tests/hall1_keepers.spec.js` | Three holders, Fen gated until all three, a2/b' path, Glimmer save untouched |
| 8b | `tests/fernbrook_flip.spec.js` | `split` before the pick; side word after; validator passes |

Existing suites the slices touch: `quests`, `faction_or_gate` (#253), `tutorial_order`, `glimmer_fernbrook`, `lizzy`, `mahopac`, `whereabouts`, `world_clock`, `quest_multi`, `partner_day` (`pd`).

**applyCheckpoint fix** (`game.js:17552`; the bad lines are `:17561-17563`, #253 `:17574`): any main checkpoint after `orchard` sets `story.side_pick_done`, and `reconcileChain` keeps `story.orchard_cleared`, so a checkpoint at `hall1` builds an old b'/a2 save, not a new-flow one. Fix: for checkpoints at or before `hall1`, drop `story.side_pick_done`, `story.orchard_cleared` and `story.heights_done`; after `hall1`, set `story.side_pick_done` and `story.orchard_cleared` together (D1142). Test: checkpoint `hall1` gives `trialReady` true, the door open by `story.lizzy_class`, no pick.

## 12. Conflicts

| # | Conflict | Resolution |
|---|---|---|
| 1 | D1143 puts Fen with Russet at dusk on Day 1; the flow sends the holder home | R1: both stay; go-home talk is A7 (D1166) |
| 2 | D1141/D1153 door and June's "crates first" deny line | R5: door on the class (D1169); June's line kept for `!story.crates_seen` only |
| 3 | FPT Part A and Day 2 Hall 1 timing | §3 |
| 4 | Mom's trip is a side chain open from `story.starter_received`; live saves did it early | Wrapper rows + OR read (R8); no write |
| 5 | Lizzy's real-clock class; `hm_lizzy` in CLOCK_SKIP | R2 pin rows (§6) |
| 6 | Hall 1 sign "A Keepers' Hall" (FPT Part B) vs contested Fernbrook; Fen's errand ties her Hall to the Keepers | Open, Q8 |
| 7 | D1128 Fen balance (red, open) | §8; §7.5 re-run |
| 8 | Town steering new canon (REGION_MAP, D1150, D1151, `ranks`) | Flip only (D1171); system red (D1173) |
| 9 | Room changes need previews (rule 9) | Holders placed without layout change; any change gets previews |
| 10 | #249 Rook walks you to the Lantern House after his first match (Hearthmoor) | Low risk, no shared flags (`rook_walk` cast ids only). A second "Rook at a Lantern House" beat beside D1143's; Story signs off |
| 11 | Intro reds D1020-D1023, D1029 (Vincent's intro work) | `pd` carries them; merge order below |
| 12 | `data/rook_crossroads.json:326` used the banned word for competitor | Fixed outside this flow: game PR #254 (the game file is hand-kept, so the line is edited there and `data/mapdata.js` regenerated) and design commit 680c32d (`specs/rook_crossroads_build.py:80`) |
| 13 | D1164 was double-booked (High Charity vs `ranks` map holds) | Resolved on main (09ed47c): High Charity is **D1174**; `ranks` keeps D1159-D1165 |
| 14 | `pd` moves Mom downstairs and adds the opening Lizzy; Slices 5 and 6 build on it | Merge order: #253, then `pd`, then the visible slices |
| 15 | #253 door string `story.crates_seen \| story.orchard_cleared` is wrong for this flow | Replace in Slice 4a, the first PR that writes `story.crates_seen` |
| 16 | `matchHold` and `ribbit.js:152` cannot read `\|` | §9: `=` only for matchHold; no OR strings to ribbit |
| 17 | `applyCheckpoint` sets the pick for steps after `orchard` | §11 fix |
| 18 | walklings-quests: "the main CHAIN is shipped and stays untouched" | Approved by Vincent (R11, 5:05 PM ET) for these rows; `orchard` keeps its position. The Supervisor updates the skill line |
| 19 | Slices 4a-6 each leave a new save at a shut door until the class ships | Merge 4a, 4, 5, 6 as one merge (R12) |
| 20 | FPT Parts B-D (Hall 1 intro, pitches, cart, pick) are not built | This flow's pick and flip wait on them (§15) |

## 13. Decision ids

Reserved with walklings-decision-ids at about 4:38 PM ET over origin/main, pr252 and all 258 origin branches: `claude/npc-ranks-side-badge` holds D1159-D1165. **Reserved here: D1166-D1173.** Main since recorded D1174 (Act 5 capital is High Charity, formerly the double-booked D1164); **next free id is D1175** (main `OPEN_DECISIONS.md:37-39`).

| Id | Colour | Call | Status |
|---|---|---|---|
| D1166 | red | Day 1 keeps D1143's Fen with Russet at dusk and the Two Lights beats; Fen's potential and go-home talk is a new beat the next morning, before the holder leaves Fernbrook; she then leaves for the local Keeper authorities. Amends D1143 (adds) | **SETTLED** (R1), Mon Nov 2, 2026, ~4:20 PM ET, Vincent, in this Claude Code session |
| D1167 | red | Main-chain order after the crates: Fen's talk, Mom's Mahopac quest (main chain through wrapper rows), Mom insists, the class, the door, three holders, Fen, the pick. A save with `story.dream_woke` or `story.dream_study` gets Fen's variant and skips Mom's step; Mahopac stays open from the start. Amends D1141 | **SETTLED** (R7, R8), same time |
| D1168 | red | Lizzy's class is a quest, runs at any hour while active with Lizzy and the kids pinned, uses the new done flag `story.lizzy_class`, and is not a first meeting | **SETTLED** (R2, R6, R7), same time |
| D1169 | red | The Hall door opens only after the class on new saves; old saves past the old gate keep it open by a read-only OR (a save-compat read, not a second route). Amends D1153 for new saves | **SETTLED** (R5), same time. D1153 is HELD, superseded by this row (R9, 5:03 PM ET) |
| D1170 | red | Three Keeper holders in the Trial Hall before Fen, each with a D1161 rank; D1128 still decides Fen's team; §7.5 re-run | **SETTLED** (R3), same time. Required-for-all default is Q5 |
| D1171 | red | Fernbrook's hold flips to the picked side at the pick result after Trial 1 | **SETTLED** (R4), same time. Read method and live-save effect are Q7 |
| D1172 | yellow | Kind a1 (picked, orchard not cleared): does `story.side_pick_done` also open the Hall door? | **SETTLED: NO** (Vincent, Mon Nov 2, 2026, 5:03 PM ET, R9). The door opens only after the class; the pick is not a door term |
| D1173 | red | Town steering: the state that records which side a Trial steered a town toward, what flips, and what the holder sees | **Open**. Spec first (Slice 9); build only after Vincent approves |

## 14. Open questions (each with a default)

| Q | Question | Default |
|---|---|---|
| Q1 | Kind a1: does `story.side_pick_done` open the door (D1172)? | **Answered NO** (R9) |
| Q2 | Where is Fen while away? | Not drawn; whereabouts "away on Keeper business" (PLACEHOLDER); candidate if drawn: Keeper House upstairs (`hm_hq_f2`) |
| Q3 | Who is "the local Keeper authority", and is anyone shown with Fen? | Nobody on screen; Story names them later |
| Q4 | A save at the class without `story.lizzy_met` (met only in the opening): how does the reunion play? | The class scene runs the built `lizzy_intro` first, which sets `story.lizzy_met`; Story may trim it |
| Q5 | Are the three holders required before Fen for every Keepers save without Seal 1 (incl. a2, b')? | **Deprioritized** (R10): yes, with no old-save special case |
| Q6 | Holder names, looks, ranks, lines and team forms | Story and Design; `[Rank] PLACEHOLDER` until then |
| Q7 | Flip by read (old c saves flip on load, Glimmer hold effects included) or by a flag the result writes (new saves only)? | **Deprioritized** (R10): read, the simplest save-safe option (§9) |
| Q8 | Hall 1 sign "A Keepers' Hall" in a contested town | Keep FPT Part B's sign; the Hall is Fen's, the town is split |
| Q9 | Go-home talk staging: A6 runs on into it, plus a fallback NPC and an exit trigger? | Yes |
| Q10 | Keyed deny (engine change) or one deny line? | Keyed |
| Q11 | `orchard` row gains `when: ['story.side_pick_done']` (FPT §7 step 4 owns the chain) | **Approved** (R11): main-chain edit OK, `orchard` keeps its position; Design confirms in FPT |
| Q12 | Ship Slices 4a-6 as one merge train? | **Approved** (R12): one merge |
| Q13 | Mom's insistence: at the end of the wake scene as well as on her line? | Both |
| Q14 | Class staging: holder watches from the back, kids at their desks, no room change | Yes (no rule 9 trigger) |
| Q15 | Who builds FPT Part A? | Slice 4a here, from FPT §7 step 3 (Day 1 part only) |

## 15. Build order

Merge order of what exists: **#253 (OR gate) -> `pd` (partner day, Vincent's intro reds) -> `ranks` (before Slices 7 and 8)**. Each slice is one branch and one PR; nothing visible builds before this spec is approved.

| Slice | Branch | Visible | Depends on | Content |
|---|---|---|---|---|
| 2 | `claude/faction-pick-or-gate` (#253) | no | none | Merge origin/main in, regenerate, tests, PR (already open) |
| 3 | `claude/quest-npc-where` | yes (tracker, marker) | #253 | `npc:` field, generalised `liveStep`, Fen's away whereabouts hook, the test |
| 4a | `claude/fb-part-a` (new) | yes | #253, D1141-D1157 settled | FPT Part A A1-A6 with the §7.2 guard; `crates` row; **door string D1169**; slips; first writer of `story.crates_seen` |
| 4 | `claude/crates-fen-home` | yes | 4a, 3 | A7 `fen_home` (+ R8 variant), `fen_morning`, exit trigger, Fen's `when` gates, keyed deny, `fb_hall_away` |
| 5 | `claude/main-chain-mahopac` | yes | 4, `pd` | `home_trip` with `mirror`, `mom_class` row, Mom's line and wake insert |
| 6 | `claude/lizzy-class` | yes | 5, `pd` | `lizzy_class` scene, pin rows, body gates, `detail_zz_day1.json`. Ship 4a-6 as one merge (R12) |
| 7 | `claude/fernbrook-contested` | yes | 6, `ranks` | Signs, props and lines reading `split`; previews if art changes (rule 9) |
| 8 | `claude/hall1-keepers` | yes | 6, `ranks`, D1128 | Three holders, Fen gate, `hall1_keepers` row, `DEBUG_TRAINER_GATES`, §7.5 re-run |
| 8b | `claude/fernbrook-flip` (new) | yes (map, bar) | FPT Parts B-D (pick result) | `matchHold` `=`, two hold rules, validator, test |
| 9 | spec only | no | none | Town steering, D1173 (red) |
| 10 | `claude/day1-trial1-qa` | no | 2-8b | walklings-qa-run on a1, a2, b, b', c, p, n, fresh, Mahopac done, Lizzy-opening-only at 320, 375, 390 |

The `applyCheckpoint` fix (§11) ships with Slice 4a, the first slice whose checkpoints would otherwise build the wrong save.
