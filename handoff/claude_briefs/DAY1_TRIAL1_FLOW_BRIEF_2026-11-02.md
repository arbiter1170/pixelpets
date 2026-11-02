# Claude Code brief: Day 1 to Trial 1 flow (Mon Nov 2, 2026)

From the Chief of Staff, for Vincent to paste into his own Claude Code. Source: Vincent's direction of Mon Nov 2, 2026, 3:55 PM ET, and his add-ons at 3:58 PM ET, summarised in `OPEN_DECISIONS.md` under "NEW DIRECTION Nov 2, 3:55 PM (Vincent)". Paste the fenced block below.

```text
REPO AND BRANCH
Repo arbiter1170/pixelpets. Run `git fetch origin` first. Each slice below is ONE branch and ONE PR,
named claude/<topic> off origin/main (topics given per slice). Slice 2 reuses the existing branch
claude/faction-pick-or-gate instead of making a new one.

TASK
Vincent wants a new start to the game, from the crate scene to Trial 1, in this order:
1. The crate scene in Fernbrook (Tobin's crates).
2. Right after it, Master Fen comments on the holder's potential, tells them to go home for now,
   and leaves to talk with the local Keeper authorities about preparing holders for the
   "disturbances" in the Amberwild.
3. The holder goes home and does Mom's first Mahopac quest (today: the "Mom's trip" chain,
   quests.js:205-237, mom -> mom_chore -> mom_sent -> mahopac -> observatory -> dream steps ->
   dream_wake -> dream_study).
4. After it, the holder meets Lizzy during a live class at the Hearthmoor Schoolhouse
   (hm_school_in, data/detail_lizzy.json). She explains the struggle between the Keepers and
   Glimmerwell. That leads the holder back to Fernbrook.
5. Trial 1 at the Fernbrook Trial Hall is a big deal: several Keeper holders to beat before Fen.
6. New lore: beating a Trial lets a holder help "steer" a town toward one side. Fernbrook is
   contested when the holder first arrives, with clear signs of that everywhere, and the holder's
   actions later help decide whether it flips to the Keepers or to Glimmerwell.
In player text it is always "Fernbrook", "Trial Hall", "holder", capital-K "Keeper", "Acorns",
and Rook is a "competitor". Never "gym", "trainer", "coins", "rival" or any franchise name.

READ FIRST
AGENTS.md (all of it), CLAUDE.md, OPEN_DECISIONS.md (the "NEW DIRECTION Nov 2" section and the
Open table), archive/DECISIONS_SETTLED.md (section "Mon Nov 2, 2026: Vincent's rulings"),
tools/GAMEJS_MAP.txt before opening game.js.
Skills (the copies in your repo or the box library): walklings-quests, walklings-dialog-npc-walk,
gamedev-game-ai, gamedev-npc-decisions, walklings-deploy, walklings-wording-check,
walklings-pr-handback, walklings-decision-ids, walklings-qa-run, gamedev-save-systems.
Design spec (read-only, never commit it): FACTION_PICK_TIMING v0.2.4 (design commit ffada0b),
parts A-D and §7 build order; story/drafts/AFTER_TRIAL_PICK_ARC_SKETCH_2026-10-31.md.

SLICE 0: REVIEW OPEN WORK FIRST (no code, no branch; report and STOP)
Before building anything:
- `gh pr list --repo arbiter1170/pixelpets --state open` and `git branch -r`. At 4:05 PM ET Mon
  Nov 2 these were open: #248 handset test fix (claude/handset-spec-base), #249 Rook walks you to
  the Lantern House (claude/rook-lantern-walk; game.js, index.html, version.json), #250 battle tips
  once (claude/battle-tips-once; game.js, tutorial tests), #251 phone trim and water blink fix
  (claude/phone-trim-bridge-fix), this decisions PR (chief/decisions-2026-11-02). Branches without a
  PR: claude/faction-pick-or-gate (1 commit "Faction pick step 1: the live-save OR gate", 3 behind
  main; quests.js, tests/faction_or_gate.spec.js, fixtures, GAMEJS_MAP, version.json) and
  claude/npc-ranks-side-badge (reserves D1159-D1165: Keeper ranks, side NPCs, the "BOTH SIDES"
  split word for Fernbrook). Look for Vincent's intro-scene PR (it holds D1020-D1023 and D1029);
  none was open at 4:05 PM ET. List whatever is open when you start.
- For each one, `gh pr diff <n> --name-only` and read it. Report: overlapping files, overlapping
  story flags and scene ids, quest chain steps they move, version.json/GAMEJS_MAP churn, and any
  game-logic clash with this flow. Rook's Lantern House walk (#249) touches the same after-first-
  match beat this flow changes, so check it closely.
- Research and write up how these interact: story flags, cond() gates (game.js cond ~4589, quests.js
  evalCond ~372, condKey ~3940, plainStoryFlag ~17127; `|` splits before `&` before `!`), the
  faction pick (fb_side_pick, story.side_pick_done, story.orchard_cleared), mapHold/REGION_MAP
  ('fernbrook' is 'split' today, game.js ~12098), and saves (pixelpets.save.v2, additive through
  normalizeV2, no migrator). Name every flag a live save may already hold that this flow reorders
  (story.mom_sent, story.reached_mahopac, story.dream_woke, story.lizzy_met, story.orchard_cleared,
  story.seal1, story.side_pick_done).
STOP: post the findings as your reply (and in handoff/claude_briefs/DAY1_TRIAL1_REVIEW_<date>.md
on the slice 1 branch). Wait for Vincent before slice 1.

SLICE 1: SPEC (claude/day1-trial1-spec; NOT visible)
Write handoff/specs/DAY1_TRIAL1_FLOW.md (not docs/). It maps the new flow onto FACTION_PICK_TIMING
v0.2.4:
- What it REPLACES: the Day 1 "Two Lights" beats and "Fen with Russet at dusk" in Part A (now Fen's
  potential and go-home talk after the crates), and the Day 2 Hall 1 timing (the home trip, Mahopac
  and Lizzy now sit between the crates and Hall 1).
- What STAYS: the pick after Trial 1 (D1055), the settled reds D1141-D1143 and D1149-D1152 except
  where Vincent rules the new flow replaces them, D1144-D1148 and D1153-D1157 (settle 5:44 PM EST
  Nov 2), and the OR gates from claude/faction-pick-or-gate.
- The new main-chain order in quests.js, with every `when`/`done`/`skipIf` and the OR-gate read for
  each save kind (a1, a2, b, b', c, p, n from FACTION_PICK_TIMING §7, plus "already did Mahopac" and
  "already met Lizzy").
- For every step: the NPC needed, where that NPC is at each hour (SCHED rows, whereNow, game.js
  ~4721 and ~5110), and whether the step pins them in place or points to where they are now.
- The Hall door gate (today `story.orchard_cleared`, data/fernbrook_rooms.json:132; D1153 makes it
  `story.crates_seen | story.orchard_cleared`) and its deny line.
- The Trial Hall roster (Keeper holders before Fen) and how it fits D1128 (open, Fen balance).
- The town-steering idea: what state, when it changes, what the holder sees. Mark it red.
- Every new flag, scene id and quest id; every verbatim design file it would touch (AGENTS rule 8:
  only through a slicePatch replaceObjs overlay in data/fernbrook_rooms.json).
- A conflicts table (start from the list at the end of this brief).
Any new D id: reserve it with walklings-decision-ids (check main AND every origin branch; next free
on main after the decisions PR is D1175; D1159-D1165 are taken by claude/npc-ranks-side-badge and D1166-D1173 by #255).
STOP: open the PR, report, and wait for Vincent to approve the spec. Build nothing before that.

SLICE 2: OR GATE (claude/faction-pick-or-gate; NOT visible)
Merge origin/main INTO the branch (never rebase), resolve GAMEJS_MAP and version.json by
regenerating, run its tests, open the PR. Done: tests/faction_or_gate.spec.js passes at 390; every
existing save fixture loads the same; no player-visible change.

SLICE 3: SCHEDULE-AWARE QUEST POINTERS (claude/quest-npc-where; VISIBLE: tracker and marker)
Quest steps whose target is a person follow that person. Add a step field (for example
`npc: 'Lizzy'`) that resolves through the existing whereabouts system (whereNow, liveContactSpot,
SCHED rows, CLOCK_PLACE) instead of a fixed target; the tracker text says where they are now
("Lizzy is at the Schoolhouse"; "Lizzy is home in 5B"). Or the step pins the NPC in place while it is
active. The leak_ask quest already uses several givers (school_lizzy, f5_lizzy, diner_lizzy,
court_lizzy); reuse that pattern, don't invent a second system.
Done (explicit): tests/quest_npc_where.spec.js sets the clock to each schedule window (school hours,
evening, late night, weekend) for Mom, Lizzy, Fen and the Keeper authority NPC, and asserts that the
marker map and tile equal the tile where that NPC is actually standing, or that the NPC is present
at the step's fixed target. No step may point at an empty tile at any hour.

SLICE 4: AFTER THE CRATES (claude/crates-fen-home; VISIBLE)
Fen's potential line, "go home for now", and Fen leaving for the Keeper authorities, in data scenes.
Fen's whereabouts change while she is away (Slice 3 must show it). Hall door gate and deny line per
the approved spec. Old saves past the orchard are unaffected.

SLICE 5: MOM'S MAHOPAC QUEST ON THE MAIN CHAIN (claude/main-chain-mahopac; VISIBLE)
The main chain points home after the crates. Reuse the built Mom's trip and dream scenes; don't
rewrite them. A save that already finished Mahopac skips the step (OR read, no save write).

SLICE 6: LIZZY'S CLASS (claude/lizzy-class; VISIBLE)
A class scene at hm_school_in where Lizzy explains the Keepers and Glimmerwell, then points the
holder to Fernbrook. Class hours come from her schedule; the off-hours rule is the one Vincent picks
(question 2 below). Room layout changes need Vincent's previews first (AGENTS rule 9).

SLICE 7: CONTESTED FERNBROOK (claude/fernbrook-contested; VISIBLE)
Signs, props and NPC lines in Fernbrook that show the town is contested on the first visit, reading
the existing 'split' hold. Coordinate with claude/npc-ranks-side-badge (D1163 "BOTH SIDES"). Room
art or layout changes need Vincent's previews first (rule 9).

SLICE 8: THE TRIAL HALL ROSTER (claude/hall1-keepers; VISIBLE)
Several Keeper holders in fb_hall_in before Fen, as the approved spec sets. Rebalance with D1128
in mind; re-run the §7.5 arrival test (at least 6 of 12 wins against Fen at the expected level).

SLICE 9: TOWN STEERING (red; spec first, build only after Vincent approves it)
The state that records which side a Trial steered a town toward, and what flips. Save field is
additive in v2 only.

SLICE 10: QA (claude/day1-trial1-qa; NOT visible)
walklings-qa-run on the seven save kinds plus a fresh save, at 320, 375 and 390.

HOUSE RULES
- Saves: pixelpets.save.v2, v 2, additive through normalizeV2; no migrator, no renamed fields. A
  retired scene id stays in data (D1149 rule).
- Never push to main, rebase, force-push or delete a branch. If a push is rejected, merge
  origin/main into your branch and push again.
- Never commit design/, docs/ or pp_verify. Never edit verbatim design data (AGENTS rule 8; for
  example data/maps_slice.json, data/act1_route2.json, data/interiors.json); patch through the
  overlay. After any data/*.json edit run `python3 tools/gen_mapdata.py`.
- Every commit that deploys runs `python3 tools/bump_build.py` first (rule 5).
- Every visible slice ships before/after shots at 390 and 320 in handoff/shots/<topic>/.
- Palette lock (rule 11). 44 px taps.
- Run walklings-wording-check on every player-visible line, the PR body and the docs.
- Public repo: no Firebase project ids, no emails, no save files.
- Reds need Vincent (rule 3). Don't message anyone outside this session; report in the PR and in your reply.

DONE MEANS (every slice)
- `npm run test:agent -- tests/<feature>.spec.js` passes at 320, 375 and 390 with no console errors,
  plus the existing suites the slice touches (quests, faction_or_gate, tutorial_order, save tests).
- New system, scene step, save field or flow: a new tests/<feature>.spec.js.
- For slices 3-8: the NPC-schedule test from slice 3 still passes for every step the slice adds.
- `node tools/scans/decisions.js` passes; the spec file is updated if the build differs.
- A PR with the walklings-pr-handback body (CHANGELOG entry, spec match table, decision ids,
  wording table, "Skills used:" line). Do not merge.

STOP AND REPORT
Stop and report (don't guess) when: the spec is silent on something; a step would change a settled
red; a fix needs a verbatim design file; a test needs a save change that isn't additive; two open
PRs touch the same lines; or a slice would grow past one PR. After each slice, report the PR URL,
build id, tests run and anything unfinished, then wait.
```

## Conflicts with settled canon and specs (for the spec's conflicts table)

1. **D1143 (red, settled 2:35 PM ET today)** puts "Fen with Russet at dusk" in everyone's Day 1. The new flow sends the holder home after the crates. Vincent has to say which one wins.
2. **D1141 (red, settled today)** has Day 1's crate area open the Hall door. **D1153** (yellow, settles 5:44 PM EST) makes the door `story.crates_seen | story.orchard_cleared`. The new flow puts Mahopac and Lizzy before Hall 1, so the door gate and its deny line ("Tobin could use a hand with his crates first") need to change.
3. **FACTION_PICK_TIMING Part A and the Day 2 Hall 1 timing:** the "Two Lights" Day 1 beats and the day count move.
4. **Mom's trip and Mahopac** is a side chain today, open from `story.starter_received`. Live saves may have done it before Fernbrook. If it becomes a main step, those saves need an OR read and no save write.
5. **Lizzy:** she is met in Hearthmoor today (`story.lizzy_met`) and teaches weekdays 8 to 3 (SCHED, WORLD_CLOCK_TOWN D374-D378). `hm_lizzy` is in CLOCK_SKIP. A "live class" depends on the real clock, so off-hours players need a rule. LIZZY.md v0.2 (Lizzy part B) is the design source.
6. **Hall 1 sign:** "A Keepers' Hall. Master Fen." in Part B sits against a contested Fernbrook, and Fen's errand to the Keeper authorities ties her Hall to the Keepers.
7. **D1128** (red, open): Fen's balance. Extra Keeper holders before Fen add XP and change the §7.5 arrival test.
8. **Town steering** is new canon. It touches mapHold/REGION_MAP (Fernbrook 'split'), D1150 (everyone earns the Seal), D1151 (Route 2 waits for the pick) and the side-badge branch (D1159-D1165). It is red.
9. **Room changes** to the Trial Hall and Fernbrook need Vincent's previews (rule 9). `fb_hall_in` is in `data/fernbrook_rooms.json`; `data/maps_slice.json` is verbatim.
10. **Open PR #249** (Rook walks you to the Lantern House after his first match) changes the same early beats.
11. **Intro reds D1020-D1023 and D1029** are in Vincent's intro-scene PR and touch the home and Lodge scenes that come before this flow.
12. **Wording, not part of this flow:** `data/rook_crossroads.json:326` still says "Not as a rival." That file is design-generated (design `specs/rook_crossroads_build.py:80`, which still says "rival" at design 63fec75). The fix to "Not as a competitor" has to be made in the design build script and then regenerated. Don't hand-edit it.

## Questions only Vincent can answer (each with a default)

1. Does the new Day 1 replace D1143's "Fen with Russet at dusk" and the Two Lights beats that you settled at 2:35 PM? **Default:** yes, Fen's potential and go-home talk replaces them; the rest of D1141-D1152 stands.
2. Lizzy's class when the holder plays outside school hours (weekday evenings, nights, weekends)? **Default:** the class scene runs whenever the step is active (Lizzy is pinned at the Schoolhouse for it), and her normal schedule resumes after.
3. How many Keeper holders in the Trial Hall before Fen? **Default:** two, a level or two under Fen, and D1128 still decides Fen's own team.
4. When does Fernbrook flip? **Default:** its hold changes to the picked side at the faction pick result after Trial 1; other towns get their own spec later.
5. Saves that already finished Mahopac or already met Lizzy? **Default:** they skip those steps (read-only OR gate, no save write), and Mahopac stays reachable from the start as today.
