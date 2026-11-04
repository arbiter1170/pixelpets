# POST_TRIAL_CRACKDOWN v0.3.1: the Keeper crackdown after Trial 1 (the D1175 slot)

**Build (Tue Nov 3, 2026):** built on `claude/post-trial-crackdown` (build 20261103-1156) with the defaults Vincent accepted, plus his one change D1395: the pick doesn't come right at the dawn release. Warden Ilse phones and debriefs the holder first (RENDEZVOUS_VINCENT beats 1-2); townsfolk return by day once she calls (D1405); posts, notice and cordon stand until the pick (`handoff/specs/WARDEN_SUMMONS.md`). Staging changes found in play are D1416 in `OPEN_DECISIONS.md`.

**B-2 (Tue Nov 3, 2026): Vincent's lore rulings applied on top of this build** (rows marked **[B-2]**). D1431: Glimmerwell's permit stands; the Commander checks it ("Permit's in order.") and Juniper moves her stand to the east road by her own choice; nobody orders the company out, and the Commander's force stays on people (the curfew, the shut Hall, holders). D1442: one arrest on screen: a Keeper leads the plaza's Junior Bright (an existing crowd actor) off the west edge; no blood, no guns. D1443: the curfew post says "The order stands until the pick." (the curfew itself lifts at dawn). D1433: Fen went to the Keeper authorities about the Amberwild disturbances, so her dawn line names the Amberwild, not crates. Fen's Glimmer-pick line keeps "After last night," only when `story.crackdown` is set. Every new line is PLACEHOLDER for Story. Test: `tests/crackdown_rulings.spec.js`.

**Design copy, v0.3.1 on top of Claude's v0.3** (game branch `claude/fernbrook-trial-hall-spec-acsv52` @ `44370c0`; v0.3 is `15c269d`, `44370c0` only fixes its times; v0.2 was `263956e`; game `main` 505e835 still has
v0.1). Design repo, Mon Nov 2, 2026, about 11:40 PM EST. One version, not two: this file is Claude's v0.3 text with **only** the Seals
alignment laid on top (Vincent, Mon Nov 2, 2026, 11:05 PM EST, defaults accepted: the settled Seals calls SEALS-A to SEALS-AD win over
this spec's own rows), marked **[v0.3.1]**. Claude's tanks with no gun, the D1202 and D1204 wording, the President on the set, Fen as she, the
Lantern House layout and every engine and test row are kept. Canon: design `STORY.md` v0.7.10 (§2 "What Seals are", §12 names),
Story's `handoff/story/SEALS_LORE_2026-11-02.md` v3.1 (§5, §5.1, §7, §8). Ids: `specs/STORY_DECISIONS.md` v0.65.

## 0. [v0.3.1] Alignment with the Seals calls

**Where Claude's v0.3 already matches (kept as is):** the President speaks the broadcast in the Lantern House (SEALS-W);
the holder's "He means well" / "He's hiding something" choice writes `story.fen_lean` (SEALS-AA; its later use: private design STORY.md §3); Fen is she
throughout; the Seal is never removed (SEALS-N: nothing lost); the crackdown fills the post-Trial slot before the pick on every save
(SEALS-G); the ban is world news only and never blocks the player (Vincent's clarification); the curfew read ends at the pick (the
hold flip); no Seal unlock mechanic is built (SEALS-B and SEALS-C settle the meaning, not new code). Ids for each are in §13.

**Exact edits for Claude on `claude/fernbrook-trial-hall-spec-acsv52` (`handoff/specs/POST_TRIAL_CRACKDOWN.md` at 44370c0, same lines as 15c269d;
line numbers on that tip; this file shows each one applied):**

| # | Where (44370c0) | Today | Becomes | Why |
|---|---|---|---|---|
| A1 | `:12` Canon read | design `STORY.md` v0.7.8 ... "this is new canon" | design `STORY.md` v0.7.10 §2 "What Seals are" (the crackdown is canon there) and SEALS_LORE v3.1 | STORY v0.7.9-v0.7.10 |
| A2 | `:86` | Commander: "By order of the Keepers, this square is closed. Everyone home. Now." | "By order of High Charity, this square is closed. Everyone home. Now." | SEALS lore §8: the order comes from High Charity; the Governor's office signs it (D1236, SEALS-AB) |
| A3 | `:89` | "Holder. All Trials in Fernbrook are stopped, as of now." | "Holder. This Hall is shut. Unvetted holders were tested here." | the public reason (STORY §2, SEALS-G); no more "never says why" for the public reason |
| A4 | `:90`-`:92` | "And that Seal? ... taken back just as fast." and "The threat is words only." | the Seal threat with the "Hand it over" / "Keep it" choice; either way the Seal goes dull in his hand and comes back ("Keep your trinket"); the choice moves `story.fen_lean` (Beat 1 below) | D1223 (SEALS-N), Fen's lean (D1228, D1235) |
| A5 | `:35` Commander "Never says" | "please"; any reason why | "please"; the real reason (story detail: private design STORY.md §2) | he gives the public reason |
| A6 | `:156`, `:160` | "You and Master Fen leave Fernbrook at first light. Stay, and you're both arrested." / "Immediately becomes at first light" | "You and Master Fen stay in this house tonight. Step outside before dawn, and you're both arrested." / note: the night ends in the dawn release | D1222 (SEALS-M, Vincent: fine as written) |
| A7 | `:190` | "Anyone who doesn't live in Fernbrook will leave by morning, or be detained. It's for everyone's good." | "So, from tonight, Fernbrook keeps a curfew from dusk to dawn. Stay in. Keep your Walklings close." | D1222, D1231; SEALS lore §5.1 |
| A8 | `:191` | "And High Charity will hear a proposal: no more Seals won in Fernbrook for now. Calm first. Good night." | "And no new Seals will be given in Fernbrook until further notice. A Seal is a promise. We keep it carefully." then "A Seal is not for sale. Not to anyone. Remember that." | the ban is in force through the Governor's office, not a proposal (D1221, D1237, D1236); "not for sale" (D1238) |
| A9 | `:195` | Fen: "They can't take the one you've earned, {name}. Hold onto that." | keep, and add before the choice Fen: "Not for sale. Then who's been buying?" | SEALS lore §5.1 |
| A10 | `:212`, `:215` | "First light. Not a minute after." / "First light comes grey over the orchard." | Commander: "Dusk to dawn. Not a minute before." / narration "At dawn the curfew lifts. Fen and {name} are let go." | the dawn release (D1222) |
| A11 | `:224` | officer post: "First light means now, holder. West road or east road." | **[B-2]** "The order stands until the pick." (PLACEHOLDER; was "Curfew's lifted at the pick, holder. Not before.") | no "leave" order (D1222); D1443 |
| A12 | `:227` | notice: "... Visitors leave Fernbrook by morning. By order of the Commander." | "CURFEW. Dusk to dawn. Residents indoors. By order of High Charity." | D1222, D1236 |
| A13 | `:228` | Hall deny "Closed by order of the Commander." keyed to the curfew read; "reopens after the pick (D1206)" | keyed to Story's `story.hall1_shut` (set with `story.crackdown`): "Shut by order of High Charity." Stays shut on both paths until Fen's Act 2 turn | D1224 (SEALS-O) supersedes D1206 |
| A14 | `:270` | "Meet Fen at the orchard gate at first light." | "Meet Fen at the orchard gate at dawn." | wording follows the dawn release |
| A15 | `:27`, `:319`, `:559` | Hook "(D1199: what a Seal unlocks)"; D1199 options A/B/C, default A | Hook: "A Seal is not for sale. So who's been buying?"; D1199 superseded by D1211 and D1212 (a Seal opens its Hall Stone room; all eight: private design STORY.md §2, SEALS-C); option A not taken | settled Seals calls |
| A16 | §13 rows D1197-D1209 | all open | the disposition table in §13 below | D1242 |
| A17 | `:17`, `:42`, `:546` and LANTERN_HOUSE_FERNBROOK | D1220-D1224 for the Lantern House | **id collision:** D1220-D1224 are settled Seals calls (SEALS-K to SEALS-O). The Chief of Staff renumbers them (STORY_DECISIONS v0.65, C10). Until then, cite LANTERN_HOUSE_FERNBROOK by section, not id | walklings-decision-ids |
| A18 | `:41`, `:173` set | the 48x48 wire wall `fb_wire_set_live` (LANTERN_HOUSE_FERNBROOK §7, its red "D1220") | call it "the Lantern House TV" in prose; keep the wire wall if Vincent says yes to that room redesign, else fall back to the built `tv_set` sprite (`mahopac.json:141`), as D1231 says | D1231 (SEALS-W) |
| A19 | `:42` speaker label | "The President" (name on screen is Story's call) | same; the name **Judas Accord** is now cleared for player text (D1241); the Governor is **Alexandros Merriden** (D1240) | name check done |


Target path: `handoff/specs/POST_TRIAL_CRACKDOWN.md` (PUBLIC repo; not `docs/`). **Spec only.** Nothing here is built. It fills the post-Trial quest slot Vincent reserved as D1175 (#261: `post_trial` row, done on `story.post_trial_done`). Staging a scene every player sees is red, so nothing builds before Vincent rules on the red rows (§13) and has seen the storyboard (§9). All player text below is PLACEHOLDER; June (Story) writes the real lines.

## 1. Status and sources

| Item | Value |
|---|---|
| Status | **v0.3.1 (Design, Mon Nov 2, 2026, about 11:40 PM EST): the Seals alignment (§0) on top of Claude's v0.3 (`claude/fernbrook-trial-hall-spec-acsv52` @ `44370c0`; v0.3 is `15c269d`, `44370c0` only fixes its times).** Draft v0.3: Beat 7 rewritten for Vincent's change (the President on the wire set, then the `story.fen_lean` choice) and the Lantern House tiles moved to LANTERN_HOUSE_FERNBROOK (Mon Nov 2, 2026, ~11:08 PM ET). v0.2 (Mon Nov 2, 2026, ~10:46 PM ET) makes the Keeper tanks a showpiece (§10a): an inspiration brief, a detailed 64x40 design with every frame, two variants, the arrival prototyped in the engine and recorded at 390 and 320, five small engine changes, and tests. v0.1 was Mon Nov 2, ~11:45 PM ET |
| Ask | Vincent's eight-beat outline (via Morgan), plus his clarification: the Seal-gain ban never blocks the player. The holder already has the Fernbrook Seal. The ban is world news and NPC reactions only, foreshadowing that the Keepers do bad things too |
| Builds on | Draft PR #261 (`claude/day1-trial1-build-gtkcop`, bc38b01): the `post_trial` and `pick` rows, `sceneTails.seal1`, the `fb_side_pick` trigger, Fen's whereabouts, and the D1171 flip. Main has #249 (Rook's Lantern House walk). `#261 file:N` cites that branch |
| Canon read | **[v0.3.1]** design repo `STORY.md` v0.7.10: §2 "What Seals are" (the crackdown, the President's broadcast, the dawn release), §2a, §3 Keepers, §3a Government and power, §9 Trial Halls, §12 names; Story's SEALS_LORE v3.1; `specs/KEEPER_RANKS.md`; FACTION_PICK_TIMING Parts C-D |
| Decisions read | D1142, D1144, D1145, D1150, D1151, D1155, D1170, D1171, D1173, D1174, D1175 (and #261's D1186-D1188) |
| Skills | walklings-story-craft, walklings-dialog-camera, walklings-dialog-npc-walk, walklings-cutscene, gamedev-level-design, walklings-decision-ids, walklings-wording-check |
| Storyboard | `handoff/shots/post_trial_crackdown/` (§9, §10a): three beats rendered in #261's build at 390 and 320; the tank arrival recorded as GIFs; a tank frame sheet. All draft art, injected at runtime (not committed) |
| Decision ids | D1197-D1209, reserved in this PR (§13; **[v0.3.1]** each marked superseded or still open). Seals calls D1210-D1239 and D1240-D1242 are in design `specs/STORY_DECISIONS.md`. No new id |
| Lantern House | The room for Beats 4-8 is redesigned as Fernbrook's wire station in `handoff/specs/LANTERN_HOUSE_FERNBROOK.md` (its ids D1220-D1224 collide with the Seals calls; §0 A17; Mon Nov 2, 2026, ~11:30 PM ET). Beat 7 is rewritten there and here for Vincent's change (the President on the wire set, then a choice; Mon Nov 2, ~10:55 PM ET). The Lantern House tiles, props and townsfolk below follow that spec |

## 2. The quest on one page (walklings-story-craft §1)

| | |
|---|---|
| **Want** | The holder just won the Fernbrook Seal and wants to use it. |
| **Pressure** | A Keeper Commander shuts Fen's Hall, threatens the holder's Seal, and walks Fen and the holder to the Lantern House for a dusk-to-dawn curfew; Glimmerwell is sent away. **[v0.3.1]** |
| **Turn** | The Keepers are not one thing. Fen, a Keeper, defies the Commander; Amos is ashamed; the officers just follow orders. The law the holder trusted can be bent at the top. |
| **Bottleneck** | **[v0.3.1]** At dawn the curfew lifts and Fen and the holder are let go; then the orchard gate: the faction pick (D1142), exactly as built. Flags carried: `story.crackdown`, `story.post_trial_done`, the two pitches. |
| **Hook** | **[v0.3.1]** "A Seal is not for sale." So who's been buying? (the answer: private design STORY.md §3a; never said in Act 1) |

Canon fit (STORY §3a, CANON; story detail: private design STORY.md §3a): the Commander's private motive is never said, and the Wardens, who outrank Commanders, do not share it. So this Commander can be heavy-handed with only the public reason said aloud (**[v0.3.1]** "unvetted holders were tested here", STORY §2). Fen can appeal over his head to the Warden and stay a loyal Keeper, and the beat seeds a later act (story detail: private design STORY.md §3a).

## 3. Cast and voice cards

| Who | Id (new unless noted) | Look | Want / fear | Verbal habit | Never says | To a young holder |
|---|---|---|---|---|---|---|
| The Commander | `cd_cmdr` (cast); name PLACEHOLDER (D1198) | Keeper set (rule 11). New silhouette: long coat in deep Keeper green `J`, peaked cap, gold shoulder (the look kit has `cap`; a peaked cap may need Pia, §10) | wants order he can report upward; fears holders who can sway a town | short orders; calls everyone by role ("Holder." "Master Fen.") | "please"; the real reason (**[v0.3.1]** he does give the public one) | talks past them to Fen |
| Officers | `cd_off_a`, `cd_off_b` (cast) | existing `officer` look (`data/civic.json:7`) | want the night to end quietly; fear the Commander | "Orders." Repeat what they were told | their own opinion | stiff, not cruel |
| Master Fen | `fen_hall` / cast `cd_fen` (exists) | `fen` | wants her Hall and her holder treated fairly; fears the Keepers forgetting what they're for | plant talk: roots, pruning, seasons | a bad word about the Keepers as a whole | warm, protective |
| Keeper Amos | `amos` (exists, `fb_lantern_in` 6,3) | as built | wants the Lantern House to stay a safe place; fears it becoming a cell | quiet, practical, ledger talk | that the Commander is right | gentle, apologetic |
| Constable Rue | `fb_constable` (exists, fernbrook 4,9) | as built | keep Fernbrook calm; fears losing the town's trust | "Citizen." | defiance out loud | one quiet kind word |
| Associate Juniper | `juniper` (exists, 14,6) | as built | keep her targets; fears being blamed | Glimmer words: "partnership", "Brighter by nature!"; **[B-2]** her permit is in order and she moves because a curfew is bad for business (D1431) | sorry | bright sales voice, even while packing up |
| Block News (the Lantern House TV; **[v0.3.1]** §0 A18) | props `fb_wire_set` / `fb_wire_set_live` at 5,2 (LANTERN_HOUSE_FERNBROOK §7) | new 48x48 prop | | anchor voice, flat and calm; one opening line | | |
| The President (on the wire set) | speaker label "The President" (**[v0.3.1]** Judas Accord, name cleared, D1241; on-screen naming is Story's call) | bust on `wire_wall_pres` (draft, D1221) | wants the town quiet and calm | calm, reasonable, fatherly; "for your safety" | **why**. His real aims: private design STORY.md §3a; never reveal them | addresses "Fernbrook", never the holder |
| Townsfolk at the set | `lh_odile`, `lh_wynne`, `lh_tobin`, `lh_res_kid`, `lh_res_b`, `lh_res_c` (new bodies, LANTERN_HOUSE_FERNBROOK §7.2) | as built / kit looks | stay safe; hear the news | one short line each | | |
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

### Beat 1. The Keeper tanks roll in (street, auto then talk)

This beat **ran in the engine** (§10a.6): #261's build with the §10a engine changes patched in at load, draft art, zero console errors, and every actor on its tile at the end. The tanks are §10a's.

| Step | Who | Move / action | Camera |
|---|---|---|---|
| 1a | | `curtain on`; `wait 300` | the holder stays at the Hall door (22,7), facing down |
| 1b | the light first | `castAt cd_beam 4,8` (the searchlight beam, a cast prop) and `castAt cd_tank_a 3,8` (the command tank), then `walkTo cd_beam 20,8 {with: cd_tank_a, ms: 300}`: the beam leads and the tank follows one tile behind | at 320 and 390 the beam crosses the left edge first, then the tank. It stops with the pool of light on the holder |
| 1c | | `castAt cd_dust 16,8` (dust behind the treads); `wait 500` | |
| 1d | the escort tank | `castAt cd_tank_b 3,8`, then `walkTo cd_tank_b 13,8 {ms: 260}` | it parks off screen behind the first at 320 |
| 1e | the hatch | `prop cd_tank_a keeper_tank_cmd_r_hatch1`, `wait 220`, `hatch2`, `wait 220`, `hatch3`, `wait 700`, then back to `keeper_tank_cmd_r` | the Commander rises out of the turret |
| 1f | Commander, officers | `castAt cd_cmdr 20,9`, `cd_off_a 15,9`, `cd_off_b 16,7`, then `walkAll [[cd_cmdr,22,9],[cd_off_a,21,9],[cd_off_b,24,8]]` | the speaker nudge (D171) keeps him clear of the box (seen at 320) |
| 1g | holder | after the Commander's first line, `walkTo player 21,8` (steps down to the road to face him, freeing 22,7 for Fen) | |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| (narration) | A white beam slides up the road. Then the ground starts to hum. |
| Commander | By order of High Charity, this square is closed. Everyone home. Now. |
| Commander | **[B-2]** Glimmerwell. Your permit. |
| Associate Juniper | Right here. Signed in the capital, stamped and current. |
| (narration) | The Commander reads it under the tank's lamp, then hands it back. |
| Commander | Permit's in order. Your stand can stay. The square still closes. |
| Associate Juniper | A curfew's no good for business. We'll set up out on the east road tonight. |

**[B-2]** D1431 replaces "Glimmerwell staff will pack up and leave Fernbrook tonight." / "We have a permit! ...Fine. Fine! Glimmerwell is relocating.": the permit stands and the move is Juniper's own call.
| Commander | Holder. This Hall is shut. Unvetted holders were tested here. |
| Commander | A Seal is the Keepers' to give, {name}. And ours to take back. |
| (choice) | **"Hand it over"** / **"Keep it"** |
| Master Fen (keep it) | Take it, then. Watch it go dull in your hand. It knows whose it is. |
| (narration) | The Seal sits in the Commander's glove. Its shine goes out. |
| Commander | Dull as a button. Keep your trinket. |
| (toast) | The Seal hums. Then it's quiet. |

**[v0.3.1]** The Seal threat follows SEALS-N and SEALS lore §5 beat 3, §8. Either answer ends with the Seal in the Commander's
hand for a moment; it goes dull (it is tuned to its pair, SEALS-C) and he hands it back. **Nothing is lost:** `S.seals` and `story.seal1`
stay. Fen's line plays on "Keep it"; on "Hand it over" the holder holds it out and the narration follows. The choice
writes only `story.fen_lean` ("Keep it" pulls her toward the holder's side, SEALS lore §7), with Story's v3.1 encoding. Because
`crackdown_street` replays if the save quits before 3e, the `inc` must not apply twice (walklings-quests guard; the build picks the
guard). The Fen line in Beat 2 ("That Seal was won fair") now answers the dull Seal. Both labels are 30 characters or fewer.
Lines are PLACEHOLDER; the narration and toast are within 110 and 40.

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

### Beat 3. Escort; Juniper moves east; one arrest; the street empties (street, auto)

| Step | Who | Move | Note |
|---|---|---|---|
| 3a | townsfolk and Juniper | `walkAll`: Juniper 14,6 to 30,8 (east, toward the rubble); Wynne 25,7 to 26,5; Odile 27,9 to 28,11; Juniper's stand `fb_lantern_stand` swaps to empty (`prop`) | when `story.crackdown` is set at 3e, their `when`s hide them. They are hidden, never `drop`ped: dropping a real map NPC removes it for the session |
| 3a2 | **[B-2]** the arrest (D1442) | after Juniper's line: `walkAll` the plaza's `fbp_junior_bright` to 25,8 and its Walkling `fbp_junior_bright_pet` to 26,8; two lines; then `walkTo cd_off_b 0,8 {with: fbp_junior_bright, drop: true}` and `walkTo fbp_junior_bright_pet 0,8 {drop: true}` (off the west edge; one after the other, because the officer and the Junior Bright fill the only gap past Fen and the Commander); narration | `drop` on a real map NPC now only hides it until the scene ends (game.js `cutWalkTo`, `present`), so the plaza has the Junior Bright back after the pick; `cd_off_b` is out of the later escort walks |
| 3b | Constable Rue | stays at 4,9 | one line as the holder passes |
| 3c | escort | `walkAll`: `cd_cmdr` to 6,8; `cd_off_a` to 7,7; `cd_off_b` to 9,8; then `walkTo player 5,6 {with: cd_fen}` | the camera follows the holder west along row 8; the storyboard's Beat 3 frame is 13,8 |
| 3d | the tanks | stay parked on the road, lanterns sweeping (idle frames); dropped at the warp | |
| 3e | | `setFlag story.crackdown`; **[v0.3.1]** `setFlag story.hall1_shut` (Story's name, SEALS lore §5 beat 2); `curtain off`; `warp fb_lantern_in 5,14` | |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Associate Juniper | **[B-2]** Brighter by nature! Find us on the east road, Fernbrook! (was "Brighter... somewhere else!") |
| Junior Bright | **[B-2]** You can't shut a Trial Hall! Glimmerwell would never lock a town indoors! |
| Commander | Out after my order, and shouting at my Keepers. Take that one in. |
| (narration) | A Keeper leads the Junior Bright away down the west road. Their Walkling trots close behind. |
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
| 4d | Amos | stays at 6,3, beside the wire set (LANTERN_HOUSE_FERNBROOK §5) | |
| 4e | townsfolk, set | already in place: six `lh_*` bodies facing the set (curfew `when`, not casts); `prop fb_wire_set_live wire_wall` (the set is dark until Beat 7) | |

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
| Commander | New order. You and Master Fen stay in this house tonight. Step out before dawn, and you're both arrested. |
| Master Fen | You'd arrest a Hall Master in her own town? Listen to yourself. |
| Commander | A Seal says a holder can help run things here. Fernbrook doesn't need the help. |

**[v0.3.1]** No "leave" order: the night ends in the dawn release (SEALS-M; Vincent: fine as written). The pick keeps its dawn
at the orchard gate (FPT Part D). "Leave at first light" and §6 option B ("now") are superseded (§13).

### Beat 6. "The Seal only matters if you comply" (Lantern House)

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Officer | The Seal only matters if you comply. |
| Officer | And stay clear of Glimmerwell. Folk who help them get a name for it. Then we come asking. |

Words only: no `rep` or Standing step fires here.

### Beat 7. The Lantern House TV: the President speaks (Lantern House)

Vincent's change (Mon Nov 2, 2026, ~10:55 PM ET): Block News cuts to the President, who gives the curfew broadcast; then the holder answers. Room, tiles and art: `handoff/specs/LANTERN_HOUSE_FERNBROOK.md` (the set is a 48x48 wire wall at **5,2**, on the door axis, beside Amos).

| Step | Who | Move | Camera |
|---|---|---|---|
| 7a | holder, Fen | `walkTo player 5,6 up` (into the aisle, among the townsfolk), then `walkTo cd_fen 6,7 up` | follows the holder up. At 320, from row 6 the camera shows rows 0-12.9, so the whole set is on screen (`lantern_house_fernbrook/after-pres-beat7-320.png`); from the rug (5,10) it would not be |
| 7b | Amos | faces up; `prop fb_wire_set_live wire_wall_news` (he turns it on) | |
| 7c | | Block News anchor line; then narration; `prop fb_wire_set_live wire_wall_pres` (the picture cuts to the President) | |
| 7d | townsfolk | after the ban line: `emote lh_odile emote_bang`, `emote lh_res_kid emote_ask`, `emote lh_res_b emote_dots`, `emote lh_tobin emote_dots` (a reaction is enough; no walks) | |
| 7e | holder | `choice` (two labels, each 30 characters or fewer) | |
| 7f | set | `prop fb_wire_set_live wire_wall_news` (back to the Block News card; it stays on all night, the scene's swap ends with the scene) | |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Keeper Amos | Hush, all of you. The wire's on. |
| Block News | Block News, evening edition. We go now to the capital. |
| (narration) | The picture flickers and cuts to the President. |
| The President | Good evening, Fernbrook. For your safety, a curfew is in force tonight. |
| The President | So, from tonight, Fernbrook keeps a curfew from dusk to dawn. Stay in. Keep your Walklings close. |
| The President | And no new Seals will be given in Fernbrook until further notice. A Seal is a promise. We keep it carefully. |
| The President | Every Seal ever earned is written down in High Charity, as it was in the Great War. It will stay that way. |
| The President | A Seal is not for sale. Not to anyone. Remember that. |
| The President | The Keepers keep you, and I keep the Keepers. Good night. Be kind in the streets. |
| Master Fen | Not for sale. Then who's been buying? |
| (choice) | **"He means well"** / **"He's hiding something"** |
| Keeper Amos (means well) | Maybe. He's always sounded kind. Kind isn't the same as right. |
| Keeper Amos (hiding) | Careful who hears you say that. ...But I heard it too. |
| Master Fen | They can't take the one you've earned, {name}. Hold onto that. |

- **The choice writes only `story.fen_lean`** (Seals lore v3.1, pending its design commit): "He means well" and "He's hiding something" move it in opposite directions with `inc` (exact encoding, sign and step: PLACEHOLDER until v3.1 lands). No other new flag; the save stays `pixelpets.save.v2`, `v` 2. Nothing in this quest reads `story.fen_lean`; its later use: private design STORY.md §3.
- **His voice:** calm, reasonable, never says why. His real aims: private design STORY.md §3a; the scene never reveals them. The speaker label is "The President"; whether his name appears on screen is Story's call.
- **[v0.3.1]** The broadcast lines are Story's SEALS lore §5.1 (PLACEHOLDER; Story may trim the first line). The ban is in force "until further notice", signed by the Governor's office (Governor Merriden is in the dark, SEALS-AB), not a proposal. The ban is world news only (Vincent's clarification): the holder's progress is untouched (D1201). Other holders feel it later, through Block News stories and NPC lines (§7.4). "Fernbrook" stands in for "the plaza" so the line doesn't depend on `claude/fernbrook-plaza` (§12, row 9).
- Amos's and Fen's reactions can key on the choice with `if story.fen_lean...` reads (PLACEHOLDER: the condition follows v3.1's encoding).

### Beat 8. The night (Lantern House)

| Step | Who | Move |
|---|---|---|
| 8a | Commander, officers | `walkAll` to 5,14, then `drop` (they leave; the casts end) |
| 8b | | Amos's beds: the built `rest` step (heals the team; no clock change) |
| 8c | | `curtain on`; narration; `setFlag story.post_trial_done`; `curtain off` |

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Commander | Dusk to dawn. Not a minute before. |
| Master Fen | I'm writing to the Warden tonight. A Commander doesn't outrank the lantern's law. |
| Keeper Amos | The beds are made. Rest your team. I'll keep the lamp low. |
| (narration) | At dawn the curfew lifts. Fen and {name} are let go. (D1155: "next morning" is narration and curtain only) |

**[v0.3.1]** The dawn release (SEALS-M): the curfew lifts at dawn and Fen and the holder are let go. Fen's dawn line is angry and short. **[B-2]** D1433: Fen went to the Keeper authorities about the disturbances out in the Amberwild (Day 1's built line), so it reads "I asked them for help with the Amberwild. They sent boots. I won't forget it." (PLACEHOLDER; was "...help with the crates..."). The curfew **order** (the read below) still ends at the pick.

## 5. The town at dawn (the curfew)

The curfew is **a read, not a flag**: `story.crackdown & !story.side_pick_done`. It starts when the street scene ends and lifts at the pick result, the same moment the hold flips (D1171). **[v0.3.1]** On screen, the night ends in the dawn release (Fen and the holder walk out at dawn); the officers and notice stand until the pick, and the Hall stays shut after it (`story.hall1_shut`).

| Object | Tile | `when` | Line / role |
|---|---|---|---|
| Townsfolk (`odile`, `fb_wynne`, `fb_tobin`, `juniper` at 14,6, `fb_lantern_stand`, and the plaza cast if merged) | as built | add `"!story.crackdown \| story.side_pick_done"` | hidden outside. Odile, Wynne and Tobin shelter in the Lantern House as new bodies (`lh_*`, LANTERN_HOUSE_FERNBROOK §7.2); `whereNow` says "Lantern House (curfew)" for them, "home (curfew)" for the rest |
| `cd_post_lantern` officer (new) | fernbrook 6,6 | `["story.crackdown", "!story.side_pick_done"]` | PLACEHOLDER: **[B-2]** "The order stands until the pick." (D1443) |
| `cd_post_hall` officer (new) | fernbrook 21,7 | same | PLACEHOLDER: "The Trial Hall is closed by order." |
| `cd_cordon_hall` prop (new, `lantern_cordon`) | fernbrook 23,7 | same | |
| `cd_notice` (new sign, `curfew_notice`) | fernbrook 7,6 | same | PLACEHOLDER: "CURFEW. Dusk to dawn. Residents indoors. By order of High Charity." |
| `fb_hall` door | 22,6 | **[v0.3.1]** keyed `deny` adds `"story.hall1_shut": "PLACEHOLDER: Shut by order of High Charity."` | the Hall stays shut on both paths until Fen's Act 2 turn (D1224 supersedes D1206). Fen's built rematch and town-board slips that send the holder to the Hall need deny lines (SEALS lore §5) |
| `fen_dawn` (new Fen body) | fernbrook 10,9 (the orchard) | `["story.post_trial_done", "!story.side_pick_done", "!story.orchard_cleared"]` | points the holder at the gate; the built pick follows |
| `juniper_east` (new body of Juniper) | fernbrook 30,8, beside the rubble | `["story.crackdown", "!story.side_pick_done"]` | her pitch (§6) |
| Constable Rue | 4,9 | unchanged | a curfew-keyed line |
| Keeper tanks | | not on the map at dawn (their casts end with the street scene) | |

The new bodies don't block the path: the road (row 8) stays open from the Lantern House to the gate (9,10) and to 30,8. They are checked the same way as the Hall spec's path model (T5).

## 6. Hand-off to the pick

**Default (option A, D1203): the pick stays at `fb_side_pick` (9,10) at dawn, as built (D1142).**
- The crackdown replaces FPT Part D's "morning cart" days: Fen's count and Juniper's lamps (`story.count_done`, `story.lamps_done`) can't run under curfew.
- #261 already gates the pick on `seal1`, `lizzy_class` and `post_trial_done`, not on Part D's flags, so no trigger change is needed.

| Thing | Where it goes |
|---|---|
| Where the holder ends up | asleep in `fb_lantern_in`; let go there at dawn (**[v0.3.1]** the dawn release, D1222; the holder stands at 5,10 when the scene ends) |
| Amos's pitch (FPT Part C, `story.pitch_k`) | **moves inside, the night before**: optional talk with Amos after Beat 8 (his `lines` key `story.post_trial_done & !story.pitch_k`) |
| Juniper's pitch (`story.pitch_g`) | **moves to the east road at dawn**: `juniper_east` at 30,8, on the far side of the rubble path, where her crew camp is |
| STANDING | still opens on the pick or both pitches (D1144) |
| The pick | `fb_side_pick` 9,10, built scene, built result: `story.side`, `side_pick_done`, `orchard_cleared` (D1142; a Keepers pick still goes through Tobin's battle, D1187) |
| After the pick | the curfew lifts (the read ends); the hold flips (D1171). Glimmer pick: Route 2 opens east (D1151). Keepers pick: the Lantern Coach opens toward High Charity (as FPT) |

How the crackdown changes the two pitches (Story writes the lines; these are the arguments):

| | Before (FPT Part C) | After the crackdown |
|---|---|---|
| Amos (Keepers) | "Both are watching. Walk beside, not ahead." | **[v0.3.1]** SEALS lore: "The order came from High Charity. I don't like it either. I still keep." **On the back foot, and honest:** "What you saw isn't the Keepers. It's one Commander. Fen's gone over his head. Walk with us and help fix it from inside." |
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
| then | `pick` (#261, kept) | as #261 | as #261 | fernbrook 9,10 (`npc: 'Master Fen'`, `npcIds ['fen_dawn']`) | Meet Fen at the orchard gate at dawn. |
| side, optional | `pitches` (FPT Part C card) | `story.post_trial_done`, `!story.side_pick_done` | `story.pitch_k & story.pitch_g` | Amos (Lantern House), Juniper (30,8) | Two people want a word before you go. |

`doneMask` (#261 `quests.js:387`): `post_trial` done implies `crackdown_street` done, so saves that ran #261's placeholder (`post_trial_done` with no `crackdown`) skip the crackdown, as R10 wants: no old-save work.

### 7.2 Markers follow people through the curfew

- **`whereNow` rows (curfew only).**
  - Fen: "Lantern House" from `story.crackdown` until `post_trial_done`, then "the orchard gate".
  - Juniper: "east road".
  - Wynne, Odile, Tobin: "Lantern House (curfew)" (their `lh_*` bodies; LANTERN_HOUSE_FERNBROOK §7.2).
  - Amos: unchanged.
- **Quest marker targets.** #261's `npcSpot`/`liveStep` already point a step at a live body, so the `post_trial` and `pick` markers land on Amos indoors and on `fen_dawn` at the gate.
- **Schedules.** No Fernbrook NPC has schedule rows (#261 `game.js:4848`), so the curfew only adds `when`s.
- **New test.** `quest_npc_where` gets a curfew case: at every hour of a weekday between `story.crackdown` and the pick, no marker points at a hidden body.

### 7.3 Flags and save safety

| Flag | Kind | Written by | Read by |
|---|---|---|---|
| `story.crackdown` | **new**, `done` flag of `crackdown_street` | end of `crackdown_street` | the curfew read, objects, whereabouts |
| `story.hall1_shut` | **[v0.3.1]** Story's name (SEALS lore §5 beat 2, D1224) | end of `crackdown_street`, with `story.crackdown` | the Hall door deny; cleared only at Fen's Act 2 turn (not this quest) |
| `story.post_trial_done` | #261 (D1175) | end of `crackdown_lantern` (moved from #261's `sceneTails.seal1`) | `pick`, `fb_side_pick` |
| `story.fen_lean` | Seals lore v3.1; hidden | **[v0.3.1]** the Beat 1 Seal choice and the Beat 7 choice (`inc`, encoding PLACEHOLDER) | nothing in this quest; Fen's first Act 2 return |
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
- Block News: "New Seals paused in Fernbrook" (`when story.crackdown`; **[v0.3.1]** the ban is in force, not proposed).
- Block News: "Curfew lifted" (`when story.side_pick_done`).

Two NPC lines in other towns after the pick (PLACEHOLDER, Story): a holder in Cobblecrest who meant to try Fernbrook next, and Archivist Mo on what a Seal used to mean. No gate, cap or level rule changes anywhere.

## 8. Canon and tone checks

| Risk | Check | What the spec does |
|---|---|---|
| Fen defies Keeper police but must stay a Keeper (D1170) | STORY §3a: Wardens outrank Commanders (the rest: private design STORY.md §3a) | Fen appeals **up** the ladder ("I'm writing to the Warden"), never against the Keepers as a whole. Her line: "A Commander doesn't outrank the lantern's law.". **D1190 adds a later beat for Fen after the curfew event** (Vincent, Mon Nov 2, 2026, 10:19 PM ET; story detail: private design STORY.md §3), tied to the hidden flag `story.fen_lean` (per Seals lore v3.1, pending design commit): the player's choices move it, including "He means well" / "He's hiding something" after the President's curfew broadcast; what it drives later: private design STORY.md §3. **Ruled (Vincent, Mon Nov 2, 2026, ~10:53 PM ET):** Block News cuts to the President, who gives the curfew broadcast on the TV; the "He means well" / "He's hiding something" choice follows it. Beat 7's script is rewritten on the Lantern House branch |
| The Keepers look heavy-handed right before the pick (balance) | the pick needs two fair options | Ledger below. Default: Amos owns it, the officers are uneasy, Rue is kind, Fen defies from inside. Glimmerwell runs and leaves locals, and Juniper spins it. Telemetry later: the pick ratio before and after (no new code; QA notes it) |
| "Tanks" in a cozy pet game | STORY transport: Lantern Coach, lantern airships, Glimmerwell carts. No guns anywhere in canon | **They are tanks, with no gun** (D1202; §10a): a low hull on treads with a dominant turret, but the turret carries a great caged searchlight lantern and a loudhailer bell. It threatens by watching and ordering. Green lacquer, iron and brass: unmistakably Keeper, never Glimmerwell's gloss and red |
| Curfew and ban vs town steering (D1173, red, open) | steering is "which side a Trial steered a town toward" | The curfew is scene-scoped (crackdown to pick) and the ban is world news; neither writes town state. D1173 stays untouched. **[v0.3.1]** D1199 is superseded (D1211, D1212), so Seals are not the steering key |
| Tone and age | STORY.md:137-144 says the audience is 16-28 with "no blood on screen, ever"; walklings-story-craft says all-ages ("no peril without hope") | **[B-2]** The audience is 16-28 (settled). No blood, no guns, no weapon drawn, no Walkling harmed. One arrest on screen (D1442): a Keeper leads one Glimmerwell supporter, the Junior Bright, away for defying the order; their Walkling goes with them. Hope arrives in the same scene (Fen's appeal, Amos's beds) |
| The Commander's private motive (canon; story detail: private design STORY.md §3a) | STORY §3a | The line never says it. He just doesn't value Seals: a seed only |
| The Seal threat | D1150, **[v0.3.1]** D1223 | it goes dull in his hand and comes back; the Seal is never removed |
| Rook | a competitor (walklings-story-craft) | not in the default script (optional, §12 row 8) |

**Balance ledger.** How each side reads before the pick (target: roughly even):

| Beat | Keepers look | Glimmerwell looks |
|---|---|---|
| 1 | heavy-handed (Commander; the dull Seal) | **[B-2]** permit in order, moves by choice (Juniper); one supporter arrested |
| 2 | brave (Fen) | |
| 3 | uneasy, kind (Rue); cold (escort) | **[B-2]** sets up on the east road; the arrest makes Glimmerwell's crowd the wronged side |
| 4-6 | officers stiff; Fen principled | |
| 7 | Amos ashamed; the ban sounds unfair | blamed for the "disruption" |
| Night/dawn | Amos honest about it | Juniper exploits it ("We'd never.") |

## 9. Storyboard (code-drawn, 390 and 320)

In `handoff/shots/post_trial_crackdown/`:
- `storyboard-390.png`, `storyboard-320.png`: Beat 1 (the Commander at the Hall door, the tanks on the road), Beat 3 (the escort; the street empties; Juniper at the east end), Beat 5 (the Commander and officers across the Lantern House door).
- Full screens: `beat{1,3,5}-*-{390,320}.png`.
- `draft_art_sheet.png`: both tanks, the wire set off and on, the curfew notice and the lantern cordon at 4x.
- **The tanks** (§10a): `tank_sheet.png` (every frame at 4x), `tanks-arrival-390.gif` and `tanks-arrival-320.gif` (the arrival, recorded in the engine), and `tanks-storyboard-{390,320}.png` (four stills: the light, parked, the hatch, the Commander's line).

How they were made:
- #261's build, with the cast and props added to `MAPDATA` at load, plus draft art and a draft Commander look.
- **Zero console errors**, once the new names had `reputation.json` cast entries: the reputation check fails without them, so the build must add them.

Findings from the storyboard (already folded in above):
1. **The Commander needs a silhouette.** With the officer look plus grey hair he reads as one more officer. A long coat and a peaked cap are needed (§10).
2. **The wire set was off screen at 320** from the rug, so in Beat 7 the holder walks up to it.
3. **The vehicle.** v0.1's 32x32 coach read as a cart. The tank is now 64x40 (§10a). The engine draws it, but its fixed cull margin made wide art pop at the screen edges, so §10a.5 adds a width-aware cull, verified in the arrival recording.

## 10. Art (Pia) and story (June)

**Tone (same language as TRIAL_HALL_FERNBROOK_MAP §6.3).** The crackdown is the Keeper material language **made institutional**: the same green, gold and oak, now with iron bands, bars, rivets and a searchlight. Nothing glossy, nothing red: it must still read as Keeper, just heavy. Glimmerwell in this quest is only Juniper and her emptied stand.

| Asset | New / existing | Size | Draft (storyboard) | Notes |
|---|---|---|---|---|
| Keeper tanks (`keeper_tank*`, `tank_beam_*`, `tank_dust`) | **new** | 64x40, plus a 96x40 beam | see §10a | the showpiece of the quest |
| Commander look | **new** (look entry) | keeper look | coat `J`, accent `y`, hair `h` (draft) | needs a silhouette: long coat, peaked cap (the look kit has `cap`; a peaked one may be new), gold shoulder. Inside the Keeper set (rule 11) |
| Officer look | existing `officer` | | | optional: a cap, to read as on duty |
| `wire_wall`, `wire_wall_news`, `wire_wall_pres` | **new** | 48x48 on 5,2 | was a 16x16 `wire_set` at 8,2. Now the Lantern House wire wall: off, a Block News card (2 frames) and the President's bust (2 frames), with relay racks, a switchboard, a wire desk and a call box | LANTERN_HOUSE_FERNBROOK §8 and its `draft_art_sheet.png` |
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

## 10a. The Keeper tanks (vehicle packet)

Vincent wants a lot of attention and detail on the tanks. They are the image of this quest: the first time the Keepers' law arrives as a machine. This section is the packet for them: inspiration, design, every frame, choreography, engine needs, tests. Draft art and an engine prototype back every claim. Nothing here ships until Pia redraws it and Vincent says yes.

### 10a.1 Inspiration (run with a sub-agent, Mon Nov 2, 2026; reference only)

- **Pillars**
  - **Silhouette:** low, wide, heavy. A long tread loop, a flat riveted hull and a squat dome turret set back, wider than a house door.
  - **Materials:** the Keeper craft made institutional. Dark green lacquer held down by iron straps, gold rivet rows, oak trim and brass lamp rings. Matte and hand-painted, never glossy.
  - **No gun, still a threat:** it threatens by **watching and ordering**. A caged eye that can light anyone, a bell that announces rules, a mass that blocks a street, and a slow, unstoppable approach.
  - **Stays Keeper:** warm palette, a hand-painted crest, lantern culture (kin to High Charity's airships), pennants. Glimmerwell's black-and-red gloss and hard wedges are kept out.
- **References (situations, not designs):**
  - a steam traction engine (brass bands, a short rear stack, slow ceremonial weight);
  - a riveted early armoured car (plate seams, slit visors, a domed turret);
  - a lighthouse lamp (stepped glass rings in a brass cage);
  - a lacquered steam fire pump (gold-leaf lining; a civic, proud vehicle);
  - a river monitor (low hull, round turret);
  - a barred prison van ("the law owns this");
  - a searchlight on a yoke;
  - a ceremonial coach (a crest on the door panel).
- **Pitfalls named, and what the design does:**
  - **Too toy-like.** It stays low, wide and dark, with small wheels.
  - **Reads as a train, bus or tractor.** No window row; a short rear stack; a full tread loop with sprocket teeth; the turret dominates the top line.
  - **The lamp reads as a cannon.** The lantern is a drum wider than it is deep, shown as a glowing ringed disc with cage bars across it; the loudhailer is a flared bell angled up.

### 10a.2 The design (draft v2; `tank_sheet.png`)

**Size:** 64x40 px, bottom-centred on one cell (`drawArt`). On the map it spans about 4 tiles wide and 2.5 tall: bigger than any NPC and as wide as the Lantern House door is far from its well. Side view; drawn facing left and mirrored for right.

| Part | Pixels (draft) | Notes for Pia |
|---|---|---|
| Ground shadow | the engine's own shadow colour, a 54 px tapering ellipse | |
| Tread loop | `k` loop with `d` belt; links alternate `m`/`k` every 3 px on the top and bottom runs; the top run sags 1 px between wheels | the links scroll 1 px a frame when driving |
| Running gear | front idler (plain iron, `d`/`m`), rear drive sprocket (`m`, 8 tooth notches), five road wheels (`k` rim, `m` face, `y` brass hub bolt) | hub bolts rotate when driving |
| Oak fender | `G` rail with an `A` lit front run and an `F` edge, casting a `k` shadow onto the top run | separates the hull from the treads |
| Hull | low trapezoid, front sloped 5 px, rear 3 px; deep green lacquer `J`; iron glacis `d` with a lit `m` edge and gold `y` rivets every 3 rows | dark: green close to black |
| Panels | three lacquer panels split by two iron straps (`d`/`m`) with `y` rivets every 3 px; `E` bevel on top, `d` shade below; the deck edge lit `D` at the front-left | one light, top-left |
| Front | vision slit (`k`, with 1 px `y`: someone inside); a front running lantern (`A` ring, `w`/`y`) | for the night arrival |
| Trim line | command: gold `y` along the hull; escort: iron `m` | |
| Side plate | command: crest (gold rim, cream field, painted lantern, `A` laurel band); escort: cream order plate with 3 ticks, plus mud dither `F` on the lower hull | |
| Oak rack | three staves (`F`/`G`), brass end posts, a rope coil | |
| Rear stack | `d`/`m`, with an `A`/`y` brass cap ring | steam rises from here |
| Turret | a broad squat dome set back (25 px wide), `J` with `E`/`D` lit top-left and `k` shade right, a rivet ring on an iron base | dominates the top line |
| Hatch | `F`/`G` lid with a `y` hinge; open: lid upright with the crest painted on its underside | the Commander rises from here |
| **Great lantern** | on the turret front, on an iron yoke: `A` brass ring (command: a second `y` ring), `C` pale ring, `y` glow, a 2x2 `w` hot core, two `F` cage bars across the face, a `J` hood | **the read at 1x:** "a glowing ringed disc on a dark tank lump". Off: a `G`/`C` lens |
| Loudhailer | a flared bell angled up beside the lantern (command: brass `A`/`y`; escort: iron `m`/`h`) | a bell, never a tube |
| Pennant | an oak pole at the turret's rear; command: a long double-tailed `J` pennant with `y` border and tails; escort: a short `J` flag | |
| Searchlight beam | a separate 96x40 sprite: a cone from the lens forward and down, cream `rgba(244,236,214,.32)` with a brighter core, and a warm pool where it lands | the only translucent art; cast one tile ahead of the tank so its narrow end meets the lens |
| Dust | 3 frames of dithered `A` puffs at 55% alpha | behind the treads when a tank stops |

**PAL keys used:** `J E D k d m h w y A G F C` and the engine's shadow rgba. **No `V`, `N` or `Q`:** nothing Glimmerwell.

### 10a.3 Frames

| Sprite key | Frames | Timing | What moves |
|---|---|---|---|
| `keeper_tank_cmd_{l,r}`, `keeper_tank_{l,r}` (parked) | 6 | 350 ms | the lantern yaws left, centre, right (held 700 ms each); the pennant flutters every frame; one steam puff on the last frame |
| `..._move` (driving) | 4 | 150 ms | links scroll, hub bolts turn, the sprocket teeth step, the hull bobs 1 px on frame 3 and the turret lags a frame behind it, steam puffs grow and drift up and back |
| `keeper_tank_cmd_{l,r}_hatch1..3` | 3 stills | swapped by `prop` steps, 220 ms apart | the lid flips up; cap and face appear; shoulders and a hand on the rim |
| `keeper_tank_cmd_off_r`, `keeper_tank_off_r` | 1 | | lantern dark, for the dawn |
| `tank_beam_{l,r}` | 1 | | static. A sweep is optional (3 positions) |
| `tank_dust` | 3 | 160 ms | |

**Reduced motion** (`artFrame`): every animated sprite holds frame 0. The tanks still arrive (SKIP and reduced motion snap walks, so they appear parked). No flashing in any mode.

### 10a.4 The two tanks

| | Command tank (`cd_tank_a`) | Escort tank (`cd_tank_b`) |
|---|---|---|
| Who rides it | the Commander (emerges from the hatch) | officers |
| Side plate | crest with laurel band | order plate, mud |
| Trim | gold line | iron line |
| Lantern | bigger (second gold ring) | standard |
| Loudhailer | brass | iron |
| Pennant | long, double-tailed, gold | short |

One base sprite; the variant is a palette swap plus a few overlay pixels.

### 10a.5 Engine needs (all prototyped in the arrival recording)

Each change below was patched into #261's `game.js` **only as it was served to the test browser** (the repo is untouched). The recorded arrival ran with them and zero console errors.

| # | Change | Where (#261) | Size |
|---|---|---|---|
| E1 | `castAt` can cast a **prop**: a `CAST_AT_LOOK` (or `SCENE_CAST`) entry with `sprite` pushes `{kind: 'prop', sprite}` instead of an NPC | `cutCastAt`, `game.js:9263` | 1 line |
| E2 | `walkTo` takes a per-tile **`ms`** for non-holder walkers (tanks roll at 260-300 ms a tile, not 120) | `cutWalkTo`, `game.js:9306` | 1 line |
| E3 | Props show their **`_move` frames while moving** (`mapRT.pos[id].moving`) | `drawObj` prop branch, `game.js:8238` | 1 line |
| E4 | **Width-aware cull**: the margin is `(artWidth - 16) / 2 + 10`, so 64- and 96-wide art doesn't pop at the screen edges (it does today: the margin is a fixed 26 px left and 10 px right) | `drawObj`, `game.js:8219` | 2 lines |
| E5 | **`walkAll`** step: parallel walks, each a `cutWalkTo` | `execStep`, beside `walkTo` (`game.js:9601`) | 1 line |
| E6 | **Footprint** (not prototyped): a prop field `footprint: [w, h]` so a parked tank blocks the 3-4 cells it covers, not just its anchor cell. Only matters if a tank stays parked where people walk; in this spec they are cast for the scene only | `blockerAt`, `game.js:4795` | small |

E1-E5 are D1204 (yellow). Glide, `with` and `drop` already work on props: `glideCast` writes `mapRT.pos` for any object.

### 10a.6 The arrival as it ran (Beat 1)

Recorded in #261's build at 390 and 320 (`tanks-arrival-390.gif`, `tanks-arrival-320.gif`; ~13 s; the real clock put it in late evening, which suits it):

1. **The light comes first.** The beam crosses the left edge and slides up the road a tile every 300 ms; the command tank follows one tile behind it (`with`). It stops with the pool of light on the holder at the Hall door.
2. **Dust** puffs behind the treads; the escort tank rolls up and parks behind (off screen at 320).
3. **The hatch** opens in three steps and the Commander rises with a hand on the rim.
4. **The Commander and two officers** step out together (`walkAll`) and fan out around the holder. The first line plays with the box clear of the speaker.

All seven cast actors ended on their target tiles: `cd_beam` 20,8, `cd_tank_a` 19,8, `cd_dust` 16,8, `cd_tank_b` 13,8, `cd_cmdr` 22,9, `cd_off_a` 21,9, `cd_off_b` 24,8.

Further ideas from the brief, not yet in the default (Story and Design pick):
- the beam sweeps three positions and each NPC it hits flinches and steps back;
- house windows go dark one by one after the curfew line;
- a "the ground hums" text cue in place of sound. Sound is red: iPhone audio.

### 10a.7 Tests for the tanks (add to `tests/post_trial_crackdown.spec.js`)

| # | Check |
|---|---|
| V1 | Every tank sprite key exists in `WART`, with frame counts and `ms` as in §10a.3 |
| V2 | While a tank's `mapRT.pos` is `moving`, `drawObj` picks the `_move` key; parked, the idle key |
| V3 | Width-aware cull: with the camera placed so a tank's anchor cell is 1-2 tiles off screen, its visible half still draws (pixel read on the canvas edge) |
| V4 | After Beat 1, actor tiles match §10a.6. SKIP and reduced motion land every tank in one frame; no fractional positions |
| V5 | Reduced motion: the tank frame stays 0 over 2 s |
| V6 | No tank cast remains after the street scene ends (`clearCast`) |
| V7 | Q and red keys: no `V`/`N`/`Q` pixels in any tank sprite (the art scan) |

## 11. Slices and rough effort

| Slice | Who | Content | Effort |
|---|---|---|---|
| S0 | Vincent | rule on the red rows still open (**[v0.3.1]** D1198, D1200-D1202, D1203's pitch placement) and look at the storyboard | |
| S1 | June | lines, voice cards, names; the balance pass; **[v0.3.1]** the Seal-threat choice and its two branches, the dawn-release lines, the Hall deny lines | 1.5-2.5 days |
| S2 | engineer | **engine, small (E1-E5, each a line or two, all prototyped):** prop casts, per-tile `ms`, `_move` frames, width-aware cull, `walkAll` (§10a.5). Plus the keyed `deny` entry for the Hall (**[v0.3.1]** on `story.hall1_shut`, and on Fen's rematch and the board slips) and the `whereNow` curfew rows | 1.5 days |
| S3 | Pia | **the tanks** (§10a: 2 variants x 2 facings; 6 idle + 4 drive + 3 hatch frames; beam; dust), plus the rest of §10 | 4-5 days (the tanks are about 3 of them) |
| S4 | engineer | **data build:** `data/detail_zz_crackdown.json` (scenes, objects, `when`s, triggers, the `sceneTails.seal1` change); chain rows; `reputation.json` cast entries; `news.json` stories; `python3 tools/gen_mapdata.py`. Previews from a patched copy of main at 320, 375 and 390 before the PR | 2 days |
| S5 | engineer and QA | tests (§11.1); walklings-qa-run on saves n, fresh, "Mahopac done", a2/b' (skip), c (never) | 1 day |

**[v0.3.1] About 10-12 working days in all** (v0.3 was 9-11: +0.5 day June, +0.5 day engineer for the Seal choice, the dawn release and the shut Hall; about 0.5-1 day less art if the TV falls back to the built `tv_set`), with the tanks as the largest art item. It can ship after #261 merges. It doesn't depend on the Trial Hall redesign, though both read the same hold.

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
| T10 | At 320, with the holder at 5,6, the wire set (5,2) is fully on screen for every Block News and President line and every speaker is clear of the text box (LANTERN_HOUSE_FERNBROOK T7) |
| T12 | **[v0.3.1]** The Beat 1 and Beat 7 choices change only `story.fen_lean`, once each even after a replay; all labels are 30 characters or fewer; after Beat 1 `S.seals.seal_fernbrook` is unchanged |
| T13 | **[v0.3.1]** After the pick, on both sides, the Hall door still shows the `story.hall1_shut` deny; the curfew read is false |
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
| 7 | TRIAL_HALL_FERNBROOK_MAP (this PR) | the Hall closes during the curfew | **[v0.3.1]** shut by `story.hall1_shut` on both paths until Fen's Act 2 turn (D1224 supersedes D1206); the hold-flipped Hall is seen from outside only |
| 8 | #249 Rook ("Race you to Fernbrook! I'm meeting someone.") and FPT Part D ("Rook at the Lantern House door") | where is Rook during the curfew? | optional: Rook is also stuck in the Lantern House overnight, a competitor who teases and then helps (Story; not in the default script) |
| 9 | `claude/fernbrook-plaza` (no PR) | its `after` phase (Seal 1, no pick) is exactly the curfew window; the broadcast names "the plaza" | plaza cast hidden by the curfew read; "plaza" in the broadcast only if that branch merges first |
| 10 | Vincent's beat 5, "leave immediately" | | **[v0.3.1]** superseded: the dawn release (D1222) |
| 11 | Audience | | **[B-2]** settled: 16-28 (§8); one arrest on screen is allowed (D1442) |
| 12 | Keeper ranks (D1161 on `ranks`, #262) | the Commander's title | "Commander" is a canon ladder rank (KEEPER_RANKS); the name is PLACEHOLDER (D1198) |
| 13 | Seals lore v3.1 (**[v0.3.1]** settled as D1210-D1239) | v0.2's Beat 7 had Block News read the curfew, with no President and no `story.fen_lean` | **resolved** by Vincent (Mon Nov 2, 2026, ~10:55 PM ET): the President gives the broadcast on the wire set and the holder's answer moves `story.fen_lean` (Beat 7) |
| 14 | The Lantern House redesign (LANTERN_HOUSE_FERNBROOK; its "D1220" collides, §0 A17) | the set moves from 8,2 to 5,2; the room gains townsfolk | Beats 4-8 updated here; every actor tile checked free in the new layout |

## 13. Decisions (D1197-D1209)

**[v0.3.1] Dispositions** (Vincent, Mon Nov 2, 2026, 11:05 PM EST, defaults accepted, direct to Design: the settled Seals calls
win; design `specs/STORY_DECISIONS.md` v0.65). All thirteen were raised Mon Nov 2, 2026 (v0.1, game #263) with no deadline written;
red rows wait for Vincent. No new id.

| Id | Colour | Disposition | Default (still open rows) |
|---|---|---|---|
| D1197 | red | **Superseded** by D1216 (SEALS-G, the crackdown before the pick) and D1222 (SEALS-M, the scene and the dawn release). The tanks stay under D1202; Fen's Warden letter stays as flavour | - |
| D1198 | red | **Still open** (the Commander's name, look, return) | Rank "Commander", name PLACEHOLDER (Story), returns in Act 2 or 5 |
| D1199 | red | **Superseded** by D1211 (SEALS-B, a Seal opens its Hall Stone room; all eight: private design STORY.md §2) and D1212 (SEALS-C, tuned to its pair). None of A/B/C; A not taken | - |
| D1200 | red | **Still open**, reworded to D1222 and D1231: the curfew runs dusk to dawn; the night ends in the dawn release; the curfew order (the read `story.crackdown & !story.side_pick_done`) ends at the pick. "Visitors out by first light" is dropped | As §5 |
| D1201 | red | **Still open**, default unchanged; the ban's wording follows D1221, D1236 and D1237 (in force "until further notice", signed by the Governor's office) | As §7.4 |
| D1202 | red | **Still open** (Claude's wording: tanks with no gun) | Shape as §10a; "Keeper tank" in narration, PLACEHOLDER |
| D1203 | red | **Partly superseded:** "leave at first light" by D1222 (the dawn release). **Still open:** the pick stays at `fb_side_pick` at dawn; FPT Part D's morning cart is replaced by the night; Amos's pitch moves inside and Juniper's to the east road | Option A (§6) |
| D1204 | yellow | **Still open** (E1-E5) | Add E1-E5 |
| D1205 | yellow | **Broadcast superseded** by D1231 (SEALS-W, the President on the Lantern House TV). **Still open:** the Block News card and three NEWS stories (data only) | Yes; only Fernbrook's for now |
| D1206 | yellow | **Superseded** by D1224 (SEALS-O): the Hall stays shut on both paths until Fen's Act 2 turn (`story.hall1_shut`) | - |
| D1207 | yellow | **Still open** | As §5 |
| D1208 | green | **Still open** | Ship nothing until June's pass |
| D1209 | yellow | **Still open**; the ledger adds the dull-Seal beat | Yes |

**Claude's original rows (v0.3, kept for the record):**

Checked with walklings-decision-ids on Mon Nov 2, 2026, ~11:45 PM ET:
- This PR already holds D1189-D1196 (TRIAL_HALL_FERNBROOK_MAP), and #261 holds through D1189.
- No other branch or the design repo uses D1197 or higher.
- **Reserved: D1197-D1209.** Next free when #263 merged: D1210. After Vincent's renumbering (Mon Nov 2, 2026, ~11:15 PM ET: Design D1210-D1242, plaza and homes D1243-D1252; design STORY_DECISIONS v0.65 reserves D1253-D1254, unused), **next free: D1255**.

| Id | Colour | Call | Default |
|---|---|---|---|
| D1197 | **red** (canon, staging) | The crackdown happens, as §4: after Trial 1 a Keeper Commander arrives with two Keeper tanks (§10a) and officers, closes Fernbrook, stops its Trials, sends Glimmerwell away, threatens the holder's Seal (words only) and orders the holder and Fen out. Fen defies him and appeals to the Warden. Fills D1175 | As §4 |
| D1198 | **red** (canon, naming) | Who the Commander is: canon rank Commander (above the town's Captain; STORY §3a; his private motive is never said). Name, look and whether he comes back | Rank "Commander", name PLACEHOLDER (Story), returns in Act 2 or 5 (Story) |
| D1199 | **red** (canon) | **What a Seal unlocks.** **A. The town's voice:** a Seal is a key to the town's matters: a seat and a say at its town meeting (the `fb_sign_meeting` sign at fernbrook 20,9 already exists), and later the lever of town steering (D1173). That's why a Commander who wants towns quiet hates Seals. **B. An old lock:** each Seal is one piece of an old key; enough Seals open a later-act place (story detail: private design STORY.md §2a). **C. The Masters' archive:** each Seal opens the Hall's record room behind the dais, where Masters keep town records and copies of lamp cases (why they matter later: private design STORY.md §3a) | **A** (lowest canon cost, matches Vincent's beat 5, explains the ban). A and B can stack later. No mechanic until D1173 |
| D1200 | **red** (curfew) | The curfew: scene-scoped from the end of the street scene to the pick result; residents indoors, visitors out by first light; a read, not a flag; lifts at the pick | As §5 |
| D1201 | **red** (ban) | The Seal-gain ban is world news and NPC reaction only (Vincent's clarification). It never blocks the player, never removes a Seal, never changes a cap or gate | As §7.4 |
| D1202 | **red** (naming, tone) | **The vehicles are tanks with no gun** (§10a): low hull, treads, dominant turret, but the turret carries a caged searchlight lantern and a loudhailer bell. What the game calls them: "tank" in narration and lines (Vincent's word), or a Keeper name ("Watch Tank", "Lantern Tank") | Shape as §10a. Name: "Keeper tank" in narration, PLACEHOLDER until Vincent picks |
| D1203 | **red** (amends D1142, FPT) | Hand-off: "leave at first light" (not "now"). The pick stays at `fb_side_pick` at dawn as built; FPT Part D's morning cart is replaced by the crackdown night; Amos's pitch moves into the Lantern House and Juniper's to the east road | Option A (§6) |
| D1204 | yellow (step kinds, engine) | E1-E5 of §10a.5: prop casts, per-tile `ms`, `_move` frames, width-aware cull, `walkAll`. All prototyped (the arrival recording). E6 footprint only if a tank stays parked where people walk | Add E1-E5 |
| D1205 | yellow | The wire set: a Keeper "wire set" prop in each Lantern House that plays Block News as `say` lines, plus three Block News stories in the NEWS app (data only) | Yes; only Fernbrook's for now |
| D1206 | yellow | The Trial Hall during and after the curfew: closed by `deny` during it, open as a place after the pick (TRIAL_HALL_FERNBROOK_MAP §7 stays visible) | Yes |
| D1207 | yellow | Fernbrook NPCs and the plaza cast hidden during the curfew read; officers posted at 6,6 and 21,7; notice and cordon | As §5 |
| D1208 | green | All lines in this spec are PLACEHOLDER for June | Ship nothing until June's pass |
| D1209 | yellow | Balance: the ledger in §8 is the target, and June signs it off before the build; QA watches the pick ratio on the next live build | Yes |
