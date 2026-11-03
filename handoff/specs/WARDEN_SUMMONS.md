# WARDEN_SUMMONS v0.1: Warden Ilse sends for the holder after the crackdown night

> **Merged into RENDEZVOUS_VINCENT (Vincent, Tue Nov 3, 2026, 9:56 AM ET).** That spec wins on the outcome: Ilse **phones** the holder (D1404), is distraught at the President at the Lodge, and sends the holder to Vincent; the pick waits for the report (D1403). Kept from this spec: the keyed town lines on Route 1 and in Hearthmoor (now D1417), the old-save guard on the pick gate (in D1403), and hooking Ilse's lines in by overlay (`interiors.json` untouched; D1418). The ids this spec first reserved (D1340-D1346, now mapped to D1396, D1403, D1395, D1404, D1403, D1417, D1418) collided with #268 and are withdrawn. Read the rest as background.

Spec only, PUBLIC repo. Nothing here is built beyond the lead engineer's placeholder (§7). Every player line is PLACEHOLDER for
June (Story). Staging a scene every player sees is red, so the real quest waits on Vincent's calls in §11.

## 1. Status and sources

| Item | Value |
|---|---|
| Status | v0.1, Tue Nov 3, 2026. Draft for the Chief of Staff and Vincent |
| Ask | Vincent, Tue Nov 3, 2026, on POST_TRIAL_CRACKDOWN: "There should be no pick yet, need placeholder and to spec a quest from the warden in starting area who summons the keeper back home to meet her." ("keeper" there means the player character, the holder) |
| Builds on | `handoff/specs/POST_TRIAL_CRACKDOWN.md` v0.3.1 (Beat 8, §5, §6, §7); the lead engineer's placeholder on `claude/post-trial-crackdown` (§7 below), including D1395 (Vincent: the only change from the spec is that the pick doesn't come right at the dawn release; the §5 curfew order stands until the pick) |
| Canon read | design `STORY.md`: §3a (ladder Captain < Commander < Warden < High Court < President; "the President and every Keeper commander know"; Wardens and the High Court are in the dark; Captain Lumen and Warden Ilse decide for the holder in Act 5, at a Lantern House, in a scene); §3a "a Warden keeps a whole district (a Lodge, its Lantern House and its holders)"; §4 (Ilse gives the starter); §6 (Ilse keeps a dream ledger; Mom never says "Professor"); design `specs/STORY_DECISIONS.md` D970, D978, D979 |
| Game data read | `data/interiors.json` `hm_lodge_in` (11x9; `ilse_lodge_after` at 5,3, lines `!has:name` > `story.dream_woke` > `else`; `ilse_chat`; `lodge_ledger` prop at 9,2); `data/mahopac.json` `ilse_gate`/`ilse_dreams`; `data/detail_zz_partner_day.json` `ilseAfter`; `data/cutscene_intro.json`; `data/maps_slice.json` `starter`; `data/detail_wayup.json` (sign "WARDEN'S LODGE · Warden Ilse Marrow"); `data/civic.json` (Ness, Cald, Bren); `data/glimmer_path.json` `fb_side_pick`; `quests.js` CHAIN `hall1`..`teaser`; `game.js` `whereNow` |
| Specs read | `handoff/specs/DAY1_TRIAL1_FLOW.md` §4, §5, §6, §16; `handoff/specs/LANTERN_HOUSE_FERNBROOK.md` (Amos 6,3, wire desk 7,3) |
| Decision ids | D1396-D1418 reserved here (§11). Next free after: **D1347** |
| Skills used | walklings-story-craft, walklings-quests, walklings-wording-check |

## 2. The quest on one page

| | |
|---|---|
| **Want** | Go home and tell Warden Ilse what happened in Fernbrook. |
| **Pressure** | A Commander shut Fen's Hall and kept the holder indoors overnight; Fernbrook is on the wire, and the holder doesn't know whose side the law is on. |
| **Turn** | The ladder works upward too: a Warden outranks a Commander, and Ilse takes Fen's letter seriously. The Keepers who keep people are still there. |
| **Bottleneck** | Ilse's meeting at the Lodge (`story.warden_met`), then the faction pick (D1142), on the default back at the orchard gate (§6). Flags carried: `story.crackdown`, `story.hall1_shut`, `story.warden_met`. |
| **Hook** | Ilse's letter has gone up the ladder. Who reads it first? (Seed only: canon §3a says Commanders empty the lamp cases before they reach the Court. Payoff: Act 5, Ilse and Lumen decide.) |

## 3. Cast and voice cards

| Who | Where | Want / fear | Verbal habit | Never says | To a young holder |
|---|---|---|---|---|---|
| **Warden Ilse Marrow** (`ilse_lodge_after`) | `hm_lodge_in` 5,3, fixed | wants her holders safe and the lantern's promise kept; fears the Keepers forgetting what they're for | lantern and road images ("Trust is a slow lantern"); asks for "the shape" of things, as with dreams; short, warm sentences | anything of the cover-up (she doesn't know it, D979); "Professor"; a bad word about the Keepers as a whole; who to pick | steady, proud, never talks down |
| **Keeper Amos** (`amos`) | `fb_lantern_in` 6,3, wire desk 7,3 | wants the Lantern House to be a safe place again; fears it became a cell last night | quiet, practical, ledger talk | that the Commander was right | gentle, a little ashamed |
| **Master Fen** (she) | `fen_dawn` fernbrook 10,9 (orchard gate) for the whole trip | wants her Hall back and her holder treated fairly; angry at the boots | plant talk: roots, pruning, seasons | a bad word about the Keepers as a whole | warm, protective |
| **Mom** (`mom`) | `hm_home_in` 5,4, fixed (`whereNow` "home") | wants her child home and fed | small jobs, kettle, "love" | "Professor" | plain warmth. Optional detour, never a target |
| **Lizzy** | her schedule (school, diner, court, home 5B) | | | | Optional one line where her schedule puts her; never a target, so her schedule never blocks the quest |
| Officer Ness (`r1_ness`), Keeper Halvard (`r1_halvard`), Officer Cald (`hm_cald`), Hattie (`hattie`) | Route 1 3,7 and 5,7; Hearthmoor 17,7 and 4,13 | below the top they believe they protect people (§3a) | Ness and Cald clipped ("Citizen."); Halvard a trader; Hattie a gossip | that the order was wrong | one keyed line each |

**Fen's whereabouts.** She stays in Fernbrook at the orchard gate (`fen_dawn`, `when ["story.post_trial_done", "!story.side_pick_done", "!story.orchard_cleared"]`) from the dawn release until the pick. `whereNow('Master Fen')` reads "the orchard gate" in that window. She does not travel: her Hall is shut and her trees need her.

## 4. Beats (the real quest)

Lines are PLACEHOLDER, each 110 characters or fewer; choice labels 30 or fewer; chatter 40 or fewer. One tap per line.

### Beat 1. The wire at dawn (`fb_lantern_in`, end of `crackdown_lantern`, after the dawn narration)

The holder stands at 5,10 when the night ends. `walkTo player 6,4` (Amos's open talk tile); Fen stays at 6,7 facing up.

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Keeper Amos | {name}. A wire came in at first light, for you. From the Lodge in Hearthmoor. |
| (narration) | The wire reads: Come home to the Lodge. I want to hear it from you. Warden Ilse Marrow. |
| Master Fen | She answered. Good. Go and tell her all of it, the way it happened. |
| Master Fen | I'll be at the orchard gate. Curfew or no curfew, the trees still need me. |
| Keeper Amos | You're free to go at dawn. Route 1 is open. Safe road, {name}. |

Then `setFlag story.post_trial_done` and `setFlag story.warden_called` (as the placeholder already does).

### Beat 2. Fernbrook after the release (outside, keyed lines only)

| Who | Key | Line (PLACEHOLDER) |
|---|---|---|
| Master Fen (`fen_dawn`) | `story.warden_called & !story.warden_met` | Go on. Ilse doesn't send wires for nothing. |
| Constable Rue (4,9) | same | Home to Hearthmoor, citizen? Walk easy. |
| Associate Juniper (`juniper_east` 30,8) | unchanged | her east-road pitch (POST_TRIAL_CRACKDOWN §6), still open |

### Beat 3. The walk home along Route 1 (keyed lines only, no new bodies)

| Who | Key | Line (PLACEHOLDER) |
|---|---|---|
| Officer Ness (`r1_ness` 3,7) | `story.warden_called & !story.warden_met` | Fernbrook's all over the wire. Orders are orders. The Warden's expecting you. |
| Keeper Halvard (`r1_halvard` 5,7) | same | A curfew in Fernbrook. In my day a lantern meant an open door. |

### Beat 4. Hearthmoor (keyed lines; Mom and Lizzy optional)

| Who | Key | Line (PLACEHOLDER) |
|---|---|---|
| Officer Cald (`hm_cald` 17,7) | `story.warden_called & !story.warden_met` | Warden's expecting you. Straight up to the Lodge, citizen. |
| Hattie (4,13) | same | Is it true about Fernbrook? Everyone shut in at night, the wire set said! |
| Mom (`mom`, home) | same, ahead of her other keys | You're home! I heard about Fernbrook. Lodge first, love. Then come and eat. |
| Mom chatter | same | Lodge first, love. |
| Lizzy (wherever her row puts her) | same | You were in Fernbrook last night? Tell me everything later! |

### Beat 5. The Lodge (scene `warden_meet`, `hm_lodge_in`)

Talking to Ilse with `story.warden_called & !story.warden_met` plays it. The holder walks 5,7 to 5,4, facing up; Ilse at 5,3 faces down.

| Speaker | Line (PLACEHOLDER) |
|---|---|
| Warden Ilse | There you are. Fen's letter came on the night wire. Now I want it from you. |
| Warden Ilse | Tell me the shape of it, the way you'd tell me a dream. |
| (choice, hub) | **"The Commander"** / **"My Seal"** / **"That's all of it"** |
| Ilse (Commander) | A Commander shut a Hall and kept a Hall Master indoors. He answers to a Warden for that. |
| Ilse (Commander) | I'll write it up the ladder today. Every word, in my own hand. |
| Ilse (Seal) | Show me. ...Still warm. A Seal knows whose it is, whatever glove holds it. |
| (back to the hub until "That's all of it") | |
| Warden Ilse | You stayed calm, you kept your Walklings close, and you came home. That was right. |
| Warden Ilse | The Keepers are meant to keep people. When one of us forgets, the rest of us remember. |
| Warden Ilse | Here's my ask. Don't let one bad night choose your side for you. Or one good one. |
| (choice) | **"I'll choose for myself"** / **"What would you do?"** |
| Ilse (choose) | Good. That's the only answer I'd write down. |
| Ilse (ask) | I chose the lantern long ago. That's mine. Yours has to be yours. |
| Warden Ilse | Fen is waiting at the orchard gate. Go back to Fernbrook when you're ready. |
| (narration) | Ilse opens her ledger to a fresh page and writes: Fernbrook. |

Then `bond` (amount PLACEHOLDER, Q6) and `setFlag story.warden_met`. The hub follows walklings-story-craft's return-to-hub talk: both
topics are optional, so the critical path stands without them. The second choice differs in kind (act vs ask) and its effect is felt
in the next line. Ilse never says who to pick, never praises or blames the President, and never hints at the cover-up.

**Lore drip.** After `story.warden_met`, the `lodge_ledger` prop (9,2) adds the key `story.warden_met`: "Ilse's ledger. A fresh page
headed Fernbrook, with Fen's letter pinned beside it." (PLACEHOLDER, tier 2). Payoff: Act 5, Ilse and Lumen's decision (Story).

### Beat 6. Hand-back to the pick (default, option A)

| Who | Key | Line (PLACEHOLDER) |
|---|---|---|
| Master Fen (`fen_dawn`) | `story.warden_met & !story.side_pick_done` | You saw Ilse? Good. Then let's settle the rest, here at the gate. |
| `pick` row text | | Back to Fernbrook. Fen is waiting at the orchard gate for your answer. |

## 5. Quest rows, flags, saves

### 5.1 Chain rows (`quests.js` main CHAIN; this spec's only CHAIN change is the new row)

| Order | id | when | done | target | Text (PLACEHOLDER) / place |
|---|---|---|---|---|---|
| (kept) | `post_trial` | as built | `story.post_trial_done` | crackdown build | crackdown build |
| **new** | `warden_summons` | `story.warden_called`, `!story.side_pick_done`, `!story.orchard_cleared` | `story.warden_met` | `npc: 'Warden Ilse'`, `npcIds ['ilse_lodge_after']`, `hm_lodge_in` 5,3 | Warden Ilse has sent for you. Go home to Hearthmoor and see her at the Lodge. / Warden's Lodge |
| (kept) | `pick` | as built | as built | fernbrook 9,10 (`npcIds ['fen_dawn']`) | text changes (Beat 6) |

`doneMask`: a later row done (the pick) implies `warden_summons` done; `story.warden_met` is only written after `story.post_trial_done`, so it can't
imply an earlier row out of order. Old kinds a1, a2, b, b', c and old Glimmer saves never see the row (`!side_pick_done`, `!orchard_cleared`, and they
never get `story.warden_called`).

### 5.2 Flags

| Flag | Kind | Written by | Read by |
|---|---|---|---|
| `story.warden_called` | new; not a `done` flag, so it needs a `NOT_STEPS` entry or `devCheck` fails boot | `crackdown_lantern` tail (Beat 1) | `warden_summons` `when`; Ilse's lines key; Beat 2-4 keyed lines |
| `story.warden_met` | new; `done` of `warden_summons` | end of `warden_meet` | `fb_side_pick` gate (with the guard, D1403); Fen's Beat 6 line; ledger prop; Ilse's chat override |

Save stays `pixelpets.save.v2`, `v` 2; both keys live in free-form `S.flags`, additive; `normalizeV2` untouched; nothing written at load;
`S.seals` untouched. The two choices in Beat 5 write no flag.

### 5.3 Pick gate and the old-save guard (D1403)

`fb_side_pick` `when` gains `"story.warden_met | !story.crackdown"`, not a bare `story.warden_met`. Reason: live saves from #261's placeholder have
`story.post_trial_done` with no `story.crackdown` and no `story.warden_called`. With a bare `story.warden_met` gate they get the `pick` cue at a
trigger that never fires: a dead end. With the guard, a save that skipped the crackdown also skips the summons, matching POST_TRIAL_CRACKDOWN T8
and R10 (no old-save work). The placeholder in the working tree already uses this guard on both the trigger and the `pick` row; W5 locks it in.

### 5.4 Ilse's lines key (rule 8: `data/interiors.json` stays verbatim)

Put `"story.warden_called & !story.warden_met": "@warden_meet"` into `ilse_lodge_after.lines` after `!has:name` and ahead of `story.dream_woke`,
through an overlay `objPatch` or a code wrap like `wireIlseLetter` (`game.js:4382`), never by editing the file. A save with `story.dream_woke` and no
`story.dream_study` gets `warden_meet` first and `ilse_dreams` on the next talk.

## 6. Where the pick happens now (red, D1403)

| Option | What | For | Against |
|---|---|---|---|
| **A (default)** | Back to the orchard gate: built `fb_side_pick` 9,10 and built `side_pick` scene; gate waits on `story.warden_met` (with the guard). Ilse sends the holder back | Keeps D1142's place and result, the hold flip (D1171), Juniper's east-road pitch and Tobin's staging. Smallest change: the placeholder already does it | Route 1 walked twice; the old "at dawn" wording no longer fits (fixed in Beat 6) |
| B | At the Lodge, with Ilse: the pick plays in `hm_lodge_in` after `warden_meet` | No walk back; a strong scene | Glimmerwell has no voice in a Keeper Lodge, so the balance ledger fails; moves a settled red pick (D1142); Fernbrook's hold would flip from another town; restages `side_pick` |
| C | Later still: "no pick yet" read as "not in this stretch"; the pick waits on a further beat Vincent names | Takes Vincent's words most literally | Act 1 stalls: Route 2 (D1151), the Heights and `tobin_crates` all wait on the pick; needs a new opener and a new beat spec |

Sub-variant of A for Vincent: the pick trigger moves to Fernbrook's west entrance (by `fb_west`, 0,8) so it meets the holder on the way back. Not
the default: it moves a settled tile, and the scene's actor tiles and Tobin's sight line are tuned for 9,10.

## 7. Placeholder build vs the real quest

| Piece | Placeholder (lead engineer, now) | Real quest (this spec) adds |
|---|---|---|
| The wire | Amos hands it over after the dawn narration, one PLACEHOLDER line; sets `post_trial_done`, `warden_called` | Beat 1: Amos's lines, the wire text, Fen's two lines |
| Quest row | `warden_summons` with the text in §5.1 | same row; checked against doneMask and old kinds (§5.1) |
| Lodge | short PLACEHOLDER `warden_meet`; sets `warden_met` | Beat 5: the hub, the ask, the ledger page, bond |
| Pick | `fb_side_pick` and the `pick` row wait on `story.warden_met \| !story.crackdown` (the guard, already in the working tree) | D1403 confirms the guard; Fen's Beat 6 line; new `pick` text |
| World | nothing | keyed lines on Route 1 and in Hearthmoor (Beats 2-4); Mom and Lizzy optional; ledger prop; `ilse_chat` override (§9 row 6) |
| Whereabouts | Ilse fixed at the Lodge | Fen's `whereNow` row "the orchard gate"; the marker test (§8) |

**NPC whereabouts (Vincent's rule: the needed NPC is always there, or the marker shows where).** Ilse is the only target: fixed at
`hm_lodge_in` 5,3 at every hour once `story.starter_received`, no schedule, no hours on the Lodge door. From Fernbrook or Route 1 the
cross-map pointer leads west, as `home_trip` does for `hm_home_in`. Edge: if her rep tier is cool or hostile, `whereNow` returns private,
so the marker must use the row's fixed target, not `whereNow`. Fen is fixed at the orchard gate for the pick. Mom and Lizzy are never targets.

## 8. Tests (`tests/warden_summons.spec.js`; 320, 375, 390; reduced motion; zero console errors)

| # | Check |
|---|---|
| W1 | A new-flow save that ends `crackdown_lantern` has `story.post_trial_done` and `story.warden_called`; `PixelPets.quest.id` is `warden_summons`; the marker target is `hm_lodge_in` 5,3 |
| W2 | Before `story.warden_met`, walking onto fernbrook 9,10 does not start `side_pick`; after it, it does |
| W3 | Talking to Ilse with `warden_called & !warden_met` plays `warden_meet` and sets `story.warden_met`; the quest moves to `pick` |
| W4 | `story.dream_woke & !story.dream_study`: first talk plays `warden_meet`, the next plays `ilse_dreams` |
| W5 | A #261-placeholder save (`post_trial_done`, no `crackdown`, no `warden_called`) never shows `warden_summons` and can run the pick (D1403) |
| W6 | Kinds a1, a2, b, b', c and an old Glimmer save never show the row; `questCheck` is `[]` for each |
| W7 | Every hour of a weekday with `warden_called & !warden_met`: Ilse present at 5,3, Fen at `fen_dawn`, no marker on a hidden body; with Ilse's rep tier forced cool the marker still lands on the Lodge |
| W8 | Every new line 110 or fewer, labels 30 or fewer, chatter 40 or fewer; the wording scan is clean; choice buttons at least 44 px tall at all three widths |
| W9 | Save: key `pixelpets.save.v2`, `v` 2, only the two new flags added, `S.seals` unchanged; a reload mid-trip (in Hearthmoor) keeps the row and the marker |
| W10 | `devCheck` passes (`story.warden_called` in `NOT_STEPS`); single tap advances every line; SKIP and reduced motion leave no fractional tiles |
| W11 | After `warden_met`, `ilse_chat` no longer says "kind to her orchard" and the ledger prop shows the Fernbrook page |

Plus a `tests/README.md` row, and the spec-match table in the PR naming the test for each of D1396-D1418.

## 9. Conflicts

| # | With | Conflict | Default |
|---|---|---|---|
| 1 | POST_TRIAL_CRACKDOWN §6 hand-off and D1203 | §6 has the pick at the orchard gate at dawn, right after the release; its `pick` text reads "at dawn" | the summons sits between; the place stays (option A); "at dawn" is dropped (Beat 6). D1203's pitch placement is unchanged |
| 2 | D1142 (red, settled: the pick) | Vincent's "no pick yet" | place and result kept under A; B and C move it and need Vincent (D1403) |
| 3 | POST_TRIAL_CRACKDOWN §2 bottleneck and D1200 | the curfew read ran to the pick | Kept: the curfew read runs to the pick (D1395 only moves the pick), so the trip home happens under the curfew order (posts, notice, plaza `curfew`, townsfolk indoors); the Hall stays shut (`story.hall1_shut`) |
| 4 | FPT pitches (Part C, as moved by the crackdown) | Amos pitches inside the night before; Juniper on the east road at dawn | unchanged; Juniper stays at 30,8 until the pick, so her pitch can come before or after the trip; STANDING still opens on the pick or both pitches (D1144) |
| 5 | Rook (`rook_fb` fernbrook 22,8, `when` Fernbrook Seal & `!story.slice_end`) | he stands at the Hall door from Seal 1 through the crackdown and the trip; his `teaser` row comes after the pick | the crackdown build hides `rook_fb` while `story.crackdown & !story.side_pick_done`; no Rook in the summons. Optional (Story): a competitor cameo on Route 1, not in the default |
| 6 | `ilse_chat` (`interiors.json:221`) | "Fen wrote to me. She says you were kind to her orchard." reads wrong after the crackdown | an override keyed `story.warden_met` (D1418), file untouched |
| 7 | Rule 8, verbatim `data/interiors.json` | the new lines key and ledger line | overlay or code wrap only (§5.4) |
| 8 | #261 live saves | a bare `story.warden_met` gate strands them | the guard (§5.3, D1403) |
| 9 | Mahopac dreams (`ilse_gate`) | both want Ilse's first talk | `warden_meet` first (§5.4) |
| 10 | Ilse's High Charity letter (`hc_invite`, after the pick) | two "Ilse sends for you" beats close together | no change; flagged for Story's wording |
| 11 | Canon §3a, D979, D978 | Ilse must stay in the dark for Act 5 | she knows only Fen's letter and what the holder tells her; no line hints at the President's trade |
| 12 | walklings-quests: the main CHAIN "stays untouched" | a new CHAIN row | Vincent's Nov 3 ruling asks for the quest; recorded in D1396 |

## 10. Seeds and payoffs

| Seed | Where | Payoff |
|---|---|---|
| Fen writes to the Warden (crackdown Beat 8) | crackdown | paid here: the wire and Ilse's first line |
| Ilse's letter goes up the ladder | Beat 5 | Act 5: Ilse and Lumen decide (STORY §3a); whether the letter reached the Court is Story's call |
| The ledger page "Fernbrook" | `lodge_ledger` prop | Act 5 (Story) |
| "A Seal knows whose it is" | Beat 5 (optional) | SEALS-C, already settled |

## 11. Decisions (D1396-D1418)

Raised Tue Nov 3, 2026. Red rows go to Vincent privately through the Chief of Staff; yellow waits for a vote; green is decided and noted.

| Id | Colour | Call | Default |
|---|---|---|---|
| D1396 | **red** (staging, canon) | The Warden summons quest: Amos's wire at dawn, the walk home, `warden_meet` at the Lodge, the new CHAIN row `warden_summons`, flags `story.warden_called` and `story.warden_met`; Fen waits at the orchard gate | As §4 and §5 |
| D1403 | **red** (moves or keeps the pick, D1142) | Where and when the pick happens now | Option A: orchard gate, built scene, after `story.warden_met` (§6) |
| D1395 | **red** (canon) | What Ilse knows and says: Fen's letter and the holder's account only; "a Commander answers to a Warden"; she writes it up the ladder with no named reader or outcome; she hands the side choice back and does not lobby | As Beat 5 |
| D1404 | yellow | How the wire arrives: a paper wire Amos hands over at the wire desk, or a message on the Keeper1 phone | Amos (no phone work) |
| D1403 | yellow (save safety) | Pick gate `story.warden_met \| !story.crackdown`, so saves that skipped the crackdown skip the summons | Yes |
| D1417 | yellow | Keyed lines on Route 1 and in Hearthmoor (Ness, Halvard, Cald, Hattie, Mom; Lizzy optional), no new bodies or flags | Yes, Lizzy optional |
| D1418 | green | All lines PLACEHOLDER for June; `ilse_chat` override and the ledger line via overlay; Fen's `whereNow` row "the orchard gate" | Yes; nothing past the placeholder ships before June's pass |

## 12. Open questions (each with a default)

| # | Question | Default |
|---|---|---|
| Q1 | Where does the pick live (D1403)? Does "no pick yet" mean later than this quest? | Option A; C only if Vincent names the later beat |
| Q2 | Is Fernbrook in Ilse's district, or does Fen write to her because the holder is in Ilse's ledger? | Never said; Ilse only says "Fen's letter came" |
| Q3 | Who does Ilse write to (the High Court, a Commander's superior, the Governor)? | "Up the ladder", no name, no outcome in Act 1 |
| Q4 | Does Ilse react to the holder's broadcast answer (`story.fen_lean`)? | No; nothing here reads it |
| Q5 | Does Ilse still hope the holder joins the Keepers (her starter line)? | Not here; she hands the choice back (balance ledger) |
| Q6 | Reward? | `bond`, amount PLACEHOLDER (`ilse_dreams` gives 4) plus the ledger page; no Acorns, no Standing |
| Q7 | Rook during the trip? | Absent; `rook_fb` hidden during the night (conflict 5) |
| Q8 | Mom and Lizzy lines? | Mom yes, one keyed line and chatter; Lizzy optional |
| Q9 | Time of day: the trip runs on the real clock | No line after the wire says "dawn" or "morning"; Beat 2 lines are time-free in the build |
| Q10 | Does the `side_pick` scene's opening assume it follows the night directly? | Story checks its first lines when the summons ships |
