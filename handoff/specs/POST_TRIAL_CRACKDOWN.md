# POST_TRIAL_CRACKDOWN: the Keeper crackdown after Trial 1 (the D1175 slot)

Target path: `handoff/specs/POST_TRIAL_CRACKDOWN.md` (PUBLIC repo; not `docs/`). **Spec only.** Nothing here is built. It fills the post-Trial quest slot Vincent reserved as D1175 (#261: `post_trial` row, done on `story.post_trial_done`). Staging a scene every player sees is red, so nothing builds before Vincent rules on the red rows (§13) and has seen the storyboard (§9). All player text below is PLACEHOLDER; June (Story) writes the real lines.

## 1. Status and sources

| Item | Value |
|---|---|
| Status | Draft v0.1, Mon Nov 2, 2026, ~11:45 PM ET |
| Ask | Vincent's eight-beat outline (via Morgan), plus his clarification: the Seal-gain ban never blocks the player. The holder already has the Fernbrook Seal. The ban is world news and NPC reactions only, foreshadowing that the Keepers do bad things too |
| Builds on | Draft PR #261 (`claude/day1-trial1-build-gtkcop`, bc38b01): the `post_trial` and `pick` rows, `sceneTails.seal1`, the `fb_side_pick` trigger, Fen's whereabouts, and the D1171 flip. Main has #249 (Rook's Lantern House walk). `#261 file:N` cites that branch |
| Canon read | design repo `STORY.md` v0.7.8: §2 Seals and levels, §2a Solvane, §3 Keepers, §3a Government and power, §9 Trial Halls; `specs/KEEPER_RANKS.md`; FACTION_PICK_TIMING Parts C-D and June's drafts (`story/drafts/*2026-10-31.md`). None of them has a crackdown, curfew or police action in Fernbrook: this is new canon |
| Decisions read | D1142, D1144, D1145, D1150, D1151, D1155, D1170, D1171, D1173, D1174, D1175 (and #261's D1186-D1188) |
| Skills | walklings-story-craft, walklings-dialog-camera, walklings-dialog-npc-walk, walklings-cutscene, gamedev-level-design, walklings-decision-ids, walklings-wording-check |
| Storyboard | `handoff/shots/post_trial_crackdown/` (§9): three beats rendered in #261's build at 390 and 320, with draft art injected at runtime (not committed) |
| Decision ids | D1197-D1209, reserved in this PR (§13) |

## 2. The quest on one page (walklings-story-craft §1)

| | |
|---|---|
| **Want** | The holder just won the Fernbrook Seal and wants to use it. |
| **Pressure** | A Keeper Commander shuts the town: Trials stopped, a curfew, Glimmerwell sent away, and the holder told to leave. |
| **Turn** | The Keepers are not one thing. Fen, a Keeper, defies the Commander; Amos is ashamed; the officers just follow orders. The law the holder trusted can be bent at the top. |
| **Bottleneck** | Dawn at the orchard gate: the faction pick (D1142), exactly as built. Flags carried: `story.crackdown`, `story.post_trial_done`, the two pitches. |
| **Hook** | A Commander is asking High Charity to stop Seals in Fernbrook. Why do Seals scare him? (D1199: what a Seal unlocks.) |

Canon fit (STORY §3a, CANON): "the President and every Keeper commander know power is being stonewalled; everyone below them believes they protect people." Wardens outrank Commanders and are not in on it. So this Commander can be heavy-handed with no one ever saying why. Fen can appeal over his head to the Warden and stay a loyal Keeper, and the beat seeds Act 5, where Captain Lumen and Warden Ilse decide.

## 3. Cast and voice cards

| Who | Id (new unless noted) | Look | Want / fear | Verbal habit | Never says | To a young holder |
|---|---|---|---|---|---|---|
| The Commander | `cd_cmdr` (cast); name PLACEHOLDER (D1198) | Keeper set (rule 11). New silhouette: long coat in deep Keeper green `J`, peaked cap, gold shoulder (the look kit has `cap`; a peaked cap may need Pia, §10) | wants order he can report upward; fears holders who can sway a town | short orders; calls everyone by role ("Holder." "Master Fen.") | "please"; any reason why | talks past them to Fen |
| Officers | `cd_off_a`, `cd_off_b` (cast) | existing `officer` look (`data/civic.json:7`) | want the night to end quietly; fear the Commander | "Orders." Repeat what they were told | their own opinion | stiff, not cruel |
| Master Fen | `fen_hall` / cast `cd_fen` (exists) | `fen` | wants her Hall and her holder treated fairly; fears the Keepers forgetting what they're for | plant talk: roots, pruning, seasons | a bad word about the Keepers as a whole | warm, protective |
| Keeper Amos | `amos` (exists, `fb_lantern_in` 6,3) | as built | wants the Lantern House to stay a safe place; fears it becoming a cell | quiet, practical, ledger talk | that the Commander is right | gentle, apologetic |
| Constable Rue | `fb_constable` (exists, fernbrook 4,9) | as built | keep Fernbrook calm; fears losing the town's trust | "Citizen." | defiance out loud | one quiet kind word |
| Associate Juniper | `juniper` (exists, 14,6) | as built | keep her targets; fears being blamed | Glimmer words: "relocating", "partnership", "Brighter by nature!" | sorry | bright sales voice, even while running |
| Block News (wire set) | prop `fb_wire_set` | new prop (§10) | | anchor voice, flat and calm | | |
| Townsfolk | `odile`, `fb_wynne`, `fb_tobin` (exist) | as built | go home safe | one short line each, or none | | |

## 4. Beat-by-beat script

**Conventions.**
- Tiles are `x,y`.
- "Auto" beats hide the text box: one tap doubles the pace, a second ends the beat. SKIP and reduced motion snap every walk.
- Every speaker stands on a drawn tile, never on a door mat.
- NPCs walk at 120 ms a tile, the holder at 170 ms (walklings-dialog-npc-walk).
- Map refs: `fernbrook` is 32x20, with the road on row 8, the Hall door at 22,6, the Lantern House door at 5,5, the east exit and rubble at 31,8, and the west exit at 0,8. `fb_lantern_in` is 12x16, with arrival at 5,14 and the mat at 5,15.
- Lines are PLACEHOLDER, each 110 characters or fewer, and wording-checked.

**Two scenes, so a reload never loses its place:**
- `crackdown_street` (Beats 1-3) on `fernbrook`. It sets `story.crackdown` at its end, just before the warp.
- `crackdown_lantern` (Beats 4-8) in `fb_lantern_in`. It sets `story.post_trial_done` at its end.
- A save that quits in the street replays Beats 1-3 on its next exit from the Hall. A save that quits inside replays Beats 4-8 on its next entry (§7.3).

### Beat 0. The trigger

- The holder wins Hall 1, gets the Seal (D1150), and walks out of the Trial Hall.
- New trigger `cd_start` at fernbrook 22,6 r0 (the same tile and pattern as `fb_teaser`). Its `when`:
  `["story.seal1", "!story.crackdown", "!story.side_pick_done", "!story.orchard_cleared", "!story.side=glimmer"]`.
- #261's `sceneTails.seal1` placeholder (Fen's "come to the orchard gate" line plus `setFlag story.post_trial_done`) is **replaced**: the tail keeps only a Fen line pointing the holder outside. Story writes it.
- Camera: the holder arrives at 22,7. Curtain bars on.

### Beat 1. The Watch Coaches roll in (street, auto then talk)

| Step | Who | Move / action | Camera |
|---|---|---|---|
| 1a | holder | `walkTo player 21,8`: steps down to the road | follows the holder |
| 1b | Watch Coach A | `castAt cd_coach_a 1,8 right`, then `walkTo cd_coach_a 17,8` (a prop gliding; prototype, §11 S2) | the coach enters the right of the frame at 390; at 320 the camera stays on the holder and the coach slides in from the left edge |
| 1c | Watch Coach B | `castAt cd_coach_b 1,8 right`, then `walkTo cd_coach_b 12,8` | |
| 1d | Commander | `castAt cd_cmdr 17,9 right`, then `walkTo cd_cmdr 22,9`, facing up | the speaker nudge (D171) keeps him clear of the box |
| 1e | officers | `walkAll` (new, §11): `cd_off_a` 17,7 to 20,8; `cd_off_b` 18,9 to 24,8 | |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| (narration) | Iron wheels grind on the road. Two Watch Coaches roll into Fernbrook, lanterns blazing. |
| Commander | By order of the Keepers, this square is closed. Everyone home. Now. |
| Commander | Glimmerwell staff will pack up and leave Fernbrook tonight. |
| Associate Juniper | We have a permit! ...Fine. Fine! Glimmerwell is relocating. |
| Commander | Holder. All Trials in Fernbrook are stopped, as of now. |
| Commander | And that Seal? Master Fen gave it. I can see it taken back just as fast. |

The threat is words only. The Seal is never removed (`S.seals` and `story.seal1` stay; D1150, D1201).

### Beat 2. Fen steps out of the Hall (street)

| Step | Who | Move | Camera |
|---|---|---|---|
| 2a | Fen | `castAt cd_fen 22,7 down` (out of the Hall door), then `walkTo cd_fen 22,8` (between the holder and the Commander), facing down | the nudge keeps Fen above the box |
| 2b | holder | faces Fen (`face` on the next line) | |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Master Fen | Commander. Stand down. That Seal was won fair, in my Hall, in front of my roots. |
| Commander | Master Fen. Your Hall is closed. |
| Master Fen | {name}. Go to the Lantern House. Amos will keep you. I'll be right behind you. |

### Beat 3. Escort; Glimmerwell flees east; the street empties (street, auto)

| Step | Who | Move | Note |
|---|---|---|---|
| 3a | townsfolk and Juniper | `walkAll`: Juniper 14,6 to 30,8 (east, toward the rubble); Wynne 25,7 to 26,5; Odile 27,9 to 28,11; Juniper's stand `fb_lantern_stand` swaps to empty (`prop`) | when `story.crackdown` is set at 3e, their `when`s hide them. They are hidden, never `drop`ped: dropping a real map NPC removes it for the session |
| 3b | Constable Rue | stays at 4,9 | one line as the holder passes |
| 3c | escort | `walkAll`: `cd_cmdr` to 6,8; `cd_off_a` to 7,7; `cd_off_b` to 9,8; then `walkTo player 5,6 {with: cd_fen}` | the camera follows the holder west along row 8; the storyboard's Beat 3 frame is 13,8 |
| 3d | Watch Coach A | `walkTo cd_coach_a 10,8`, trailing (optional, cut if the glide prototype fails) | |
| 3e | | `setFlag story.crackdown`; `curtain off`; `warp fb_lantern_in 5,14` | |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Associate Juniper | (running) Brighter by nature! Brighter... somewhere else! |
| Constable Rue | (quietly) Orders came from over my head, citizen. Go on in. Keep your head down. |
| Officer | Walk. |

Walklings are not under curfew: the wild follow spawns stay. In the storyboard a wild Walkling wanders through the empty street, which helps the mood.

### Beat 4. "You can't leave" (Lantern House)

Re-cast after the warp (casts don't cross maps; #249 pattern, main `game.js:4532-4548`).

| Step | Who | Move | Camera |
|---|---|---|---|
| 4a | holder | `walkTo player 5,10` (onto the rug) | ROOM_ZOOM interior: scale 2; 390 shows the whole room width, 320 shows 10 x 12.9 tiles |
| 4b | Fen | `castAt cd_fen 5,14 up`, then `walkTo cd_fen 6,10` | |
| 4c | officers | `castAt cd_off_a 5,14`, `walkTo 4,13`; `castAt cd_off_b 5,14`, `walkTo 6,13`. Both stand across the door | |
| 4d | Amos | stays at 6,3 behind his counter | |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Officer | You'll stay in here tonight, holder. You can't leave. |
| Master Fen | Can't leave? A Lantern House is for rest, not for keeping people. On what law? |
| Officer | The Commander's word is the law tonight. |
| Master Fen | Then let's settle it the old way. Your Walkling and mine, right here. |

Fen's challenge is a line, not a battle: no forced battle in a cutscene (walklings-cutscene), and Beat 5 cuts it off.

### Beat 5. The Commander's order (Lantern House)

| Step | Who | Move |
|---|---|---|
| 5a | Commander | `castAt cd_cmdr 5,14 up`, then `walkTo cd_cmdr 5,13` (between the officers) |
| 5b | holder | faces down |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Commander | Nobody battles in my town tonight. |
| Commander | New order. You and Master Fen leave Fernbrook at first light. Stay, and you're both arrested. |
| Master Fen | You'd arrest a Hall Master in her own town? Listen to yourself. |
| Commander | A Seal says a holder can help run things here. Fernbrook doesn't need the help. |

"Immediately" becomes "at first light". The coaches don't run at night, and it gives the pick its dawn (D1142, FPT Part D). Default D1203; Vincent can make it "now" (then §6 option B).

### Beat 6. "The Seal only matters if you comply" (Lantern House)

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Officer | The Seal only matters if you comply. |
| Officer | And stay clear of Glimmerwell. Folk who help them get a name for it. Then we come asking. |

Words only: no `rep` or Standing step fires here.

### Beat 7. The wire set (Lantern House)

| Step | Who | Move | Camera |
|---|---|---|---|
| 7a | Amos | `walkTo amos 7,3` | |
| 7b | holder, Fen | `walkTo player 8,4`, then `walkTo cd_fen 7,5`, so the wire set at **8,2** is on screen. From the rug (5,10) at 320 the camera shows rows 3.5-16, so a set at row 2 would be off screen (seen in the storyboard) | follows the holder up |
| 7c | wire set | `prop fb_wire_set wire_set_on` | |
| 7d | | lines | |
| 7e | wire set | `prop fb_wire_set wire_set` (off) | |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Keeper Amos | Hush, all of you. The wire's on. |
| Block News | A curfew is in force in Fernbrook after a disruption at the plaza this evening. |
| Block News | Anyone who doesn't live in Fernbrook must leave by morning or be detained. |
| Block News | The Commander is working with High Charity on a rule: no more Seals won in Fernbrook. |
| Keeper Amos | No more Seals here? Then the Hall is just a garden. |
| Master Fen | They can't take the one you've earned, {name}. Hold onto that. |

The ban is world news only (Vincent's clarification): the holder's progress is untouched (D1201). Other holders feel it later, through Block News stories and NPC lines (§7.4). "Plaza" assumes `claude/fernbrook-plaza` merges first; if not, Story says "the square" (§12, row 9).

### Beat 8. The night (Lantern House)

| Step | Who | Move |
|---|---|---|
| 8a | Commander, officers | `walkAll` to 5,14, then `drop` (they leave; the casts end) |
| 8b | | Amos's beds: the built `rest` step (heals the team; no clock change) |
| 8c | | `curtain on`; narration; `setFlag story.post_trial_done`; `curtain off` |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Commander | First light. Not a minute after. |
| Master Fen | I'm writing to the Warden tonight. A Commander doesn't outrank the lantern's law. |
| Keeper Amos | The beds are made. Rest your team. I'll keep the lamp low. |
| (narration) | First light comes grey over the orchard. (D1155: "next morning" is narration and curtain only) |

## 5. The town at dawn (the curfew)

The curfew is **a read, not a flag**: `story.crackdown & !story.side_pick_done`. It starts when the street scene ends and lifts at the pick result, the same moment the hold flips (D1171).

| Object | Tile | `when` | Line / role |
|---|---|---|---|
| Townsfolk (`odile`, `fb_wynne`, `fb_tobin`, `juniper` at 14,6, `fb_lantern_stand`, and the plaza cast if merged) | as built | add `"!story.crackdown \| story.side_pick_done"` | home; `whereNow` says "home (curfew)" |
| `cd_post_lantern` officer (new) | fernbrook 6,6 | `["story.crackdown", "!story.side_pick_done"]` | PLACEHOLDER: "First light means now, holder. West road or east road." |
| `cd_post_hall` officer (new) | fernbrook 21,7 | same | PLACEHOLDER: "The Trial Hall is closed by order." |
| `cd_cordon_hall` prop (new, `lantern_cordon`) | fernbrook 23,7 | same | |
| `cd_notice` (new sign, `curfew_notice`) | fernbrook 7,6 | same | PLACEHOLDER: "CURFEW. Residents indoors. Visitors leave Fernbrook by morning. By order of the Commander." |
| `fb_hall` door | 22,6 | keyed `deny` adds `"story.crackdown & !story.side_pick_done": "PLACEHOLDER: Closed by order of the Commander."` | the Hall reopens after the pick as a place (D1206) |
| `fen_dawn` (new Fen body) | fernbrook 10,9 (the orchard) | `["story.post_trial_done", "!story.side_pick_done", "!story.orchard_cleared"]` | points the holder at the gate; the built pick follows |
| `juniper_east` (new body of Juniper) | fernbrook 30,8, beside the rubble | `["story.crackdown", "!story.side_pick_done"]` | her pitch (§6) |
| Constable Rue | 4,9 | unchanged | a curfew-keyed line |
| Watch Coaches | | not on the map at dawn | |

The new bodies don't block the path: the road (row 8) stays open from the Lantern House to the gate (9,10) and to 30,8. They are checked the same way as the Hall spec's path model (T5).

## 6. Hand-off to the pick

**Default (option A, D1203): the pick stays at `fb_side_pick` (9,10) at dawn, as built (D1142).**
- The crackdown replaces FPT Part D's "morning cart" days: Fen's count and Juniper's lamps (`story.count_done`, `story.lamps_done`) can't run under curfew.
- #261 already gates the pick on `seal1`, `lizzy_class` and `post_trial_done`, not on Part D's flags, so no trigger change is needed.

| Thing | Where it goes |
|---|---|
| Where the holder ends up | asleep in `fb_lantern_in`; wakes there at dawn (the holder stands at 5,10 when the scene ends) |
| Amos's pitch (FPT Part C, `story.pitch_k`) | **moves inside, the night before**: optional talk with Amos after Beat 8 (his `lines` key `story.post_trial_done & !story.pitch_k`) |
| Juniper's pitch (`story.pitch_g`) | **moves to the east road at dawn**: `juniper_east` at 30,8, on the far side of the rubble path, where her crew camp is |
| STANDING | still opens on the pick or both pitches (D1144) |
| The pick | `fb_side_pick` 9,10, built scene, built result: `story.side`, `side_pick_done`, `orchard_cleared` (D1142; a Keepers pick still goes through Tobin's battle, D1187) |
| After the pick | the curfew lifts (the read ends); the hold flips (D1171). Glimmer pick: Route 2 opens east (D1151). Keepers pick: the Lantern Coach opens toward High Charity (as FPT) |

How the crackdown changes the two pitches (Story writes the lines; these are the arguments):

| | Before (FPT Part C) | After the crackdown |
|---|---|---|
| Amos (Keepers) | "Both are watching. Walk beside, not ahead." | **On the back foot, and honest:** "What you saw isn't the Keepers. It's one Commander. Fen's gone over his head. Walk with us and help fix it from inside." |
| Juniper (Glimmerwell) | warm beds, a vet, "Glimmerwell fixes things" | **Uses the crackdown:** "They locked a whole town indoors. We'd never." But she also shows Glimmerwell's side: "Our insurers advised a strategic relocation. The locals? They'll be fine." |

Options considered:
- **B. The pick moves to the road out of town.** Leaving by the west road means Keepers, the east road Glimmerwell, and the officers walk you to the edge. Strong, but it moves a settled red pick (D1142), rebuilds the built `side_pick` scene, and makes Route 2 the choice itself (D1151). Not the default.
- **C. The pick happens in the Lantern House at night**, with Fen and Amos. It loses the dawn at the orchard gate that FPT and June wrote toward. Not the default.

## 7. Quests, markers, flags and saves

### 7.1 Chain rows (quests.js, main CHAIN)

| Order | id | when | done | target | Text (PLACEHOLDER) |
|---|---|---|---|---|---|
| after `hall1` | **`crackdown_street`** (new) | `story.seal1`, `!story.side_pick_done`, `!story.orchard_cleared` | `story.crackdown` | fixed: `fb_hall_in` 7,22 (the way out), then fernbrook 22,7 | Something's happening outside the Trial Hall. |
| then | `post_trial` (#261, id kept) | as #261 | `story.post_trial_done` | `npc: 'Keeper Amos'`, fallback `fb_lantern_in` 5,13 | Get to the Lantern House. |
| then | `pick` (#261, kept) | as #261 | as #261 | fernbrook 9,10 (`npc: 'Master Fen'`, `npcIds ['fen_dawn']`) | Meet Fen at the orchard gate at first light. |
| side, optional | `pitches` (FPT Part C card) | `story.post_trial_done`, `!story.side_pick_done` | `story.pitch_k & story.pitch_g` | Amos (Lantern House), Juniper (30,8) | Two people want a word before you go. |

`doneMask` (#261 `quests.js:387`): `post_trial` done implies `crackdown_street` done, so saves that ran #261's placeholder (`post_trial_done` with no `crackdown`) skip the crackdown, as R10 wants: no old-save work.

### 7.2 Markers follow people through the curfew

- **`whereNow` rows (curfew only).**
  - Fen: "Lantern House" from `story.crackdown` until `post_trial_done`, then "the orchard gate".
  - Juniper: "east road".
  - Wynne, Odile, Tobin: "home (curfew)".
  - Amos: unchanged.
- **Quest marker targets.** #261's `npcSpot`/`liveStep` already point a step at a live body, so the `post_trial` and `pick` markers land on Amos indoors and on `fen_dawn` at the gate.
- **Schedules.** No Fernbrook NPC has schedule rows (#261 `game.js:4848`), so the curfew only adds `when`s.
- **New test.** `quest_npc_where` gets a curfew case: at every hour of a weekday between `story.crackdown` and the pick, no marker points at a hidden body.

### 7.3 Flags and save safety

| Flag | Kind | Written by | Read by |
|---|---|---|---|
| `story.crackdown` | **new**, `done` flag of `crackdown_street` | end of `crackdown_street` | the curfew read, objects, deny, whereabouts |
| `story.post_trial_done` | #261 (D1175) | end of `crackdown_lantern` (moved from #261's `sceneTails.seal1`) | `pick`, `fb_side_pick` |
| `story.pitch_k`, `story.pitch_g` | FPT Part C names (not built) | Amos's and Juniper's pitch scenes | `pitches`, STANDING (D1144) |

- **Save.** Save stays `pixelpets.save.v2`, `v` 2. No migrator; nothing written at load; no new top-level field. The Seal is never removed: no `delete S.seals`, `story.seal1` untouched.
- **Resume.**
  - A save that quits after Beat 3 (`story.crackdown`, no `post_trial_done`) wakes wherever `S.world` committed, which is the Lantern House after the warp.
  - A trigger `cd_resume` at `fb_lantern_in` 5,13 r1 replays `crackdown_lantern` (`when ["story.crackdown", "!story.post_trial_done"]`). The officer at 6,6 also points there.
- **Guards.**
  - Old orders (a1 and c picked, a Glimmer save) never see the crackdown: the trigger needs `!side_pick_done`, `!orchard_cleared` and `!side=glimmer`.
  - b' saves (orchard cleared, no Seal) skip it too. Per R10, no special case.

### 7.4 World news and reactions (the ban, as world, not rule)

Data only (`data/news.json` `when` gates; `news.js`):
- Block News: "Fernbrook curfew" (`when story.crackdown`).
- Block News: "Seal ban proposed" (`when story.crackdown`).
- Block News: "Curfew lifted" (`when story.side_pick_done`).

Two NPC lines in other towns after the pick (PLACEHOLDER, Story): a holder in Cobblecrest who meant to try Fernbrook next, and Archivist Mo on what a Seal used to mean. No gate, cap or level rule changes anywhere.

## 8. Canon and tone checks

| Risk | Check | What the spec does |
|---|---|---|
| Fen defies Keeper police but must stay a Keeper (D1170) | STORY §3a: Wardens outrank Commanders and aren't in the cover-up | Fen appeals **up** the ladder ("I'm writing to the Warden"), never against the Keepers as a whole. Her line: "A Commander doesn't outrank the lantern's law." |
| The Keepers look heavy-handed right before the pick (balance) | the pick needs two fair options | Ledger below. Default: Amos owns it, the officers are uneasy, Rue is kind, Fen defies from inside. Glimmerwell runs and leaves locals, and Juniper spins it. Telemetry later: the pick ratio before and after (no new code; QA notes it) |
| "Tanks" in a cozy pet game | STORY transport: Lantern Coach, lantern airships, Glimmerwell carts. No guns anywhere in canon | **Watch Coaches** (D1202): armoured Keeper coaches in green lacquer and iron, with a lantern searchlight turret. No barrel, no gun. Optional sky beat: a patrol skiff from Sky-Dock Command (not in this spec's art) |
| Curfew and ban vs town steering (D1173, red, open) | steering is "which side a Trial steered a town toward" | The curfew is scene-scoped (crackdown to pick) and the ban is world news; neither writes town state. D1173 stays untouched. If Vincent picks Seal option A (D1199), Seals become the steering key, and this beat is the first sign of it |
| Tone and age | STORY.md:137-144 says the audience is 16-28 with "no blood on screen, ever"; walklings-story-craft says all-ages ("no peril without hope") | Pitched for both: no weapon drawn, no one taken away on screen, no Walkling harmed. "Arrested" and "detained" appear as words only. Hope arrives in the same scene (Fen's appeal, Amos's beds). The audience conflict is flagged to Morgan (§12, row 11) |
| The Commander is in on the cover-up (canon) | STORY §3a | The line never says it. He just doesn't value Seals: a seed only |
| The Seal threat | D1150 | words only; the Seal is never removed |
| Rook | a competitor (walklings-story-craft) | not in the default script (optional, §12 row 8) |

**Balance ledger.** How each side reads before the pick (target: roughly even):

| Beat | Keepers look | Glimmerwell looks |
|---|---|---|
| 1 | heavy-handed (Commander) | scared, permit-waving (Juniper) |
| 2 | brave (Fen) | |
| 3 | uneasy, kind (Rue); cold (escort) | runs and leaves the locals behind |
| 4-6 | officers stiff; Fen principled | |
| 7 | Amos ashamed; the ban sounds unfair | blamed for the "disruption" |
| Night/dawn | Amos honest about it | Juniper exploits it, and admits relocating |

## 9. Storyboard (code-drawn, 390 and 320)

In `handoff/shots/post_trial_crackdown/`:
- `storyboard-390.png`, `storyboard-320.png`: Beat 1 (the Commander at the Hall door, the coaches on the road), Beat 3 (the escort; the street empties; Juniper at the east end), Beat 5 (the Commander and officers across the Lantern House door).
- Full screens: `beat{1,3,5}-*-{390,320}.png`.
- `draft_art_sheet.png`: the Watch Coach, the wire set off and on, the curfew notice and the lantern cordon at 5x.

How they were made:
- #261's build, with the cast and props added to `MAPDATA` at load, plus draft art and a draft Commander look.
- **Zero console errors**, once the new names had `reputation.json` cast entries: the reputation check fails without them, so the build must add them.

Findings from the storyboard (already folded in above):
1. **The Commander needs a silhouette.** With the officer look plus grey hair he reads as one more officer. A long coat and a peaked cap are needed (§10).
2. **The wire set was off screen at 320** from the rug, so in Beat 7 the holder walks up to it.
3. **The Watch Coach at 32x32** reads as a heavy coach, not a cart. A wider vehicle would read better, but the draw code is only known to handle 32 px wide (cull margin, #261 `game.js:8219`; UNVERIFIED wider). Default 32x32; a two-cell coach (front and back props) is an option.

## 10. Art (Pia) and story (June)

**Tone (same language as TRIAL_HALL_FERNBROOK_MAP §6.3).** The crackdown is the Keeper material language **made institutional**: the same green, gold and oak, now with iron bands, bars, rivets and a searchlight. Nothing glossy, nothing red: it must still read as Keeper, just heavy. Glimmerwell in this quest is only Juniper and her emptied stand.

| Asset | New / existing | Size | Draft (storyboard) | Notes |
|---|---|---|---|---|
| `watch_coach` | **new** | 32x32 prop (`drawArt`, bottom-centred) | green lacquer `J` body with `E` shade; `m`/`d` iron bands; barred `h` windows; a painted gold crest; brass lantern turret (`y`, `F` cage) with a `C`/`y` beam; iron wheels with brass hubs; a front plough plate | needs a facing-right copy (or a flip) and, optionally, 2 wheel frames. No gun shapes |
| Commander look | **new** (look entry) | keeper look | coat `J`, accent `y`, hair `h` (draft) | needs a silhouette: long coat, peaked cap (the look kit has `cap`; a peaked one may be new), gold shoulder. Inside the Keeper set (rule 11) |
| Officer look | existing `officer` | | | optional: a cap, to read as on duty |
| `wire_set`, `wire_set_on` | **new** | 16x16 | an oak cabinet with a brass grille; teal screen `t`/`s`, `w` text lines when on | a Keeper object: the wires are Keeper-owned (STORY §3) |
| `curfew_notice` | **new** | 16x16 sign | a green board with a gold frame, hand-lettered | |
| `lantern_cordon` | **new** | 16x16 | two oak posts, a green and gold bar, a hanging lantern | the Keeper answer to Glimmerwell's velvet rope |
| empty Glimmerwell stand | **new** swap for `fb_lantern_stand` | 16x16 | | the stand left behind |
| Juniper, Fen, Amos, Rue, townsfolk | existing | | | |

June (Story):
- about 45 lines across the two scenes, the dawn pitches and the officers' posts;
- voice cards (§3);
- the Commander's name (D1198);
- the plaza wording;
- three Block News stories and two NPC reactions;
- sign-off on the balance ledger.

## 11. Slices and rough effort

| Slice | Who | Content | Effort |
|---|---|---|---|
| S0 | Vincent | rule on the red rows (D1197-D1203) and look at the storyboard | |
| S1 | June | lines, voice cards, names; the balance pass | 1-2 days |
| S2 | engineer | **engine, small:** (a) a `walkAll` step (parallel walks; wraps the existing internal `walkCast`, #261 `game.js:9224`); (b) prototype a prop glide with `walkTo` (vehicles; UNVERIFIED today); (c) keyed `deny` entry for the Hall; (d) `whereNow` curfew rows | 1 day |
| S3 | Pia | the art in §10 | 2 days |
| S4 | engineer | **data build:** `data/detail_zz_crackdown.json` (scenes, objects, `when`s, triggers, the `sceneTails.seal1` change); chain rows; `reputation.json` cast entries; `news.json` stories; `python3 tools/gen_mapdata.py`. Previews from a patched copy of main at 320, 375 and 390 before the PR | 2 days |
| S5 | engineer and QA | tests (§11.1); walklings-qa-run on saves n, fresh, "Mahopac done", a2/b' (skip), c (never) | 1 day |

About 7-9 working days in all. It can ship after #261 merges. It doesn't depend on the Trial Hall redesign, though both read the same hold.

### 11.1 Acceptance tests (`tests/post_trial_crackdown.spec.js`)

320, 375 and 390; reduced motion; zero console errors; save unchanged (`v` 2; only `story.crackdown`, `story.post_trial_done` and the pitch flags are added; `S.seals` unchanged).

| # | Check |
|---|---|
| T1 | A new-flow save that wins Hall 1 plays `crackdown_street` on leaving the Hall; actor tiles after each auto beat match §4 |
| T2 | `story.crackdown` is set only at the end of Beat 3; quitting before that replays the street on the next exit |
| T3 | `crackdown_lantern` runs on arrival; quitting before Beat 8 replays it via `cd_resume`; `story.post_trial_done` is set at its end |
| T4 | During the curfew read, the townsfolk are hidden, the officers and notice are present, and the Hall door shows the curfew deny |
| T5 | Paths: the road stays open from 5,6 to 9,10 and to 30,8; no new body on a path tile |
| T6 | `pick` points at `fen_dawn`; the built pick runs; after the result the curfew read is false, the townsfolk are back and the hold flips (D1171) |
| T7 | The Seal is never removed: `S.seals.seal_fernbrook` and `story.seal1` are unchanged through the whole quest |
| T8 | Guards: a1, c and Glimmer saves never trigger the crackdown; a save with #261's `post_trial_done` and no `crackdown` skips it |
| T9 | Tap x2, a second tap ends the beat, SKIP snaps walks, and reduced motion has no fractional tiles; `cutsceneMiss` empty |
| T10 | At 320, the wire set is on screen in Beat 7 and every speaker is clear of the text box |
| T11 | Markers: at every hour of a weekday during the curfew, no step points at a hidden body |

## 12. Conflicts

| # | With | Conflict | Default |
|---|---|---|---|
| 1 | #261 `sceneTails.seal1` | its placeholder sets `story.post_trial_done` right after the Seal | the tail keeps a Fen line only; the flag moves to the end of `crackdown_lantern` |
| 2 | #261 `post_trial` row | text "Master Fen has one more thing for you in the Trial Hall", target `fen_hall` | text and target change (§7.1); id and `done` kept; a new `crackdown_street` row goes before it |
| 3 | D1142 (red, settled) | pick at `fb_side_pick` after `count_done`, `lamps_done` and `last_night` (FPT Part D) | place and result kept; Part D's morning cart is replaced by the crackdown night (D1203, red) |
| 4 | D1151 (Route 2 waits for the pick) | Glimmerwell "flees east into the next map" while Route 2 is closed | the actors walk to 30,8 and are hidden at the rubble ("their crew camp past the slide"); the holder's exit still waits for the pick. That fits the open sign after the pick: "Rockslide cleared by Glimmerwell Co." |
| 5 | D1171 (the flip) | | the curfew lifts at the same read (`side_pick_done`); no clash |
| 6 | D1173 (red, open) | curfew and ban vs town steering | no town state is written (§8) |
| 7 | TRIAL_HALL_FERNBROOK_MAP (this PR) | the Hall closes during the curfew | closed by `deny` only during the curfew; open after the pick, so the hold-flipped Hall is visible (D1206) |
| 8 | #249 Rook ("Race you to Fernbrook! I'm meeting someone.") and FPT Part D ("Rook at the Lantern House door") | where is Rook during the curfew? | optional: Rook is also stuck in the Lantern House overnight, a competitor who teases and then helps (Story; not in the default script) |
| 9 | `claude/fernbrook-plaza` (no PR) | its `after` phase (Seal 1, no pick) is exactly the curfew window; the broadcast names "the plaza" | plaza cast hidden by the curfew read; "plaza" in the broadcast only if that branch merges first |
| 10 | Vincent's beat 5, "leave immediately" | | "at first light" (D1203); "now" is option B in §6 |
| 11 | Audience: STORY.md says 16-28; the skill says all-ages | | written to pass both (§8); flagged for Morgan to settle with Design |
| 12 | Keeper ranks (D1161 on `ranks`, #262) | the Commander's title | "Commander" is a canon ladder rank (KEEPER_RANKS); the name is PLACEHOLDER (D1198) |

## 13. Decisions (D1197-D1209)

Checked with walklings-decision-ids on Mon Nov 2, 2026, ~11:45 PM ET:
- This PR already holds D1189-D1196 (TRIAL_HALL_FERNBROOK_MAP), and #261 holds through D1189.
- No other branch or the design repo uses D1197 or higher.
- **Reserved: D1197-D1209.** Next free when #263 merged: D1210. After Vincent's renumbering (Mon Nov 2, 2026, ~11:15 PM ET: Design D1210-D1242, plaza and homes D1243-D1252; design STORY_DECISIONS v0.65 reserves D1253-D1254, unused), **next free: D1255**.

| Id | Colour | Call | Default |
|---|---|---|---|
| D1197 | **red** (canon, staging) | The crackdown happens, as §4: after Trial 1 a Keeper Commander with Watch Coaches and officers closes Fernbrook, stops its Trials, sends Glimmerwell away, threatens the holder's Seal and orders the holder and Fen out. Fen defies him and appeals to the Warden. Fills D1175 | As §4 |
| D1198 | **red** (canon, naming) | Who the Commander is: canon rank Commander (above the town's Captain; STORY §3a, in on the cover-up, never said). Name, look and whether he comes back | Rank "Commander", name PLACEHOLDER (Story), returns in Act 2 or 5 (Story) |
| D1199 | **red** (canon) | **What a Seal unlocks.** **A. The town's voice:** a Seal is a key to the town's matters: a seat and a say at its town meeting (the `fb_sign_meeting` sign at fernbrook 20,9 already exists), and later the lever of town steering (D1173). That's why a Commander who wants towns quiet hates Seals. **B. Solvane's lock:** the Halls were set up with the first Keepers (STORY §2a: Solvane set up the Keepers), and each Seal is one piece of an old key; enough Seals open the way to the Stormbell Spire in Act 5. **C. The Masters' archive:** each Seal opens the Hall's record room behind the dais, where Masters keep town records and copies of lamp cases (the cases Commanders empty, STORY §3a), the paper trail for the President choice | **A** (lowest canon cost, matches Vincent's beat 5, explains the ban). A and B can stack later. No mechanic until D1173 |
| D1200 | **red** (curfew) | The curfew: scene-scoped from the end of the street scene to the pick result; residents indoors, visitors out by first light; a read, not a flag; lifts at the pick | As §5 |
| D1201 | **red** (ban) | The Seal-gain ban is world news and NPC reaction only (Vincent's clarification). It never blocks the player, never removes a Seal, never changes a cap or gate | As §7.4 |
| D1202 | **red** (naming, tone) | No "tanks": **Watch Coaches**, armoured Keeper coaches with a lantern searchlight, no guns. Alternatives: "Lantern Wagons", or a patrol skiff from Sky-Dock Command landing in the square | Watch Coach |
| D1203 | **red** (amends D1142, FPT) | Hand-off: "leave at first light" (not "now"). The pick stays at `fb_side_pick` at dawn as built; FPT Part D's morning cart is replaced by the crackdown night; Amos's pitch moves into the Lantern House and Juniper's to the east road | Option A (§6) |
| D1204 | yellow (step kinds) | New `walkAll` step (parallel walks), and vehicles gliding as props via `walkTo` (prototype) | Add both; if the glide fails, the coaches appear behind a fade |
| D1205 | yellow | The wire set: a Keeper "wire set" prop in each Lantern House that plays Block News as `say` lines, plus three Block News stories in the NEWS app (data only) | Yes; only Fernbrook's for now |
| D1206 | yellow | The Trial Hall during and after the curfew: closed by `deny` during it, open as a place after the pick (TRIAL_HALL_FERNBROOK_MAP §7 stays visible) | Yes |
| D1207 | yellow | Fernbrook NPCs and the plaza cast hidden during the curfew read; officers posted at 6,6 and 21,7; notice and cordon | As §5 |
| D1208 | green | All lines in this spec are PLACEHOLDER for June | Ship nothing until June's pass |
| D1209 | yellow | Balance: the ledger in §8 is the target, and June signs it off before the build; QA watches the pick ratio on the next live build | Yes |
