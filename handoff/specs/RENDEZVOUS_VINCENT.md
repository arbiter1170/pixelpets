# RENDEZVOUS_VINCENT v0.1: Ilse's call, the Vincent rendezvous, and the road to the pick (D1395, D1396)

**Spec only; nothing is built.** Drafted Tue Nov 3, 2026; **every §7 default approved by Vincent (Tue Nov 3, 2026, 8:38 AM ET)**. D1396 (the umbrella) stays open until the quest is built. Target: `handoff/specs/RENDEZVOUS_VINCENT.md` (public game repo, not `docs/`). All player text is PLACEHOLDER for Story. Staging every player sees is red: nothing builds before Vincent rules on §7.

> **Merged with WARDEN_SUMMONS (Vincent, Tue Nov 3, 2026, 9:56 AM ET).** `claude/post-trial-crackdown` also carries a WARDEN_SUMMONS spec (Amos's wire, back to Fen for the pick). Vincent ruled that this spec wins on the outcome:
> - Ilse **phones** the holder.
> - At the Lodge she is **distraught at the President** and sends the holder to Vincent.
> - The pick waits for the report.
>
> From WARDEN_SUMMONS we keep the keyed town lines on Route 1 and in Hearthmoor, the old-save guard on the pick gate, and the way Ilse's lines are hooked in (overlay or code wrap; `interiors.json` stays untouched).
>
> **Flag mapping:** this spec's `story.ilse_called` and `story.ilse_debrief` are the crackdown branch's `story.warden_called` and `story.warden_met`, and the build uses those names.
>
> **Build split:**
> - The crackdown session ships the crackdown plus Ilse's call and the debrief (beats 1-2).
> - The Trial Hall session builds the rendezvous, the two shifts and the report (beats 3-5) on top of that branch (`claude/rendezvous-vincent`). It then moves the pick gate to `story.rdv_done | !story.crackdown`.

> **D1428 (Vincent, Tue Nov 3, 2026, settled, default A).** The draft line is dropped. The Keeper shift's sheet is an unlabelled list (no "roll" heading, no "call-up", no "muster"); NPC Vincent no longer says "That's mustering."; this spec no longer seeds a later speech line. Ids unchanged.

## 1. Status and sources

| Item | Value |
|---|---|
| Status | Draft v0.1, Tue Nov 3, 2026. Copy: Story (June). Design: Iris. Build: PixelPets |
| Ask | D1395 (settled): no pick straight after the crackdown; Ilse phones, debriefs the holder at home, sends them on a quest that starts the pick. D1396 (open, umbrella): scope that quest, with Vincent, an unaligned Glimmerwell agent, and "a sense of going undercover" in both factions |
| Builds on | POST_TRIAL_CRACKDOWN v0.3.1 (not built: dawn release, §5 curfew read, §6 hand-off); DAY1_TRIAL1_FLOW (built `side_pick` at `fb_side_pick` 9,10; D1175 gate); TRIAL_HALL_FERNBROOK_MAP §7.1 (`story.fen_lean`) |
| Canon | design `STORY.md` @6ca4cb8: §2 "What Seals are" (the roll's call-up clause, the buy-back stall), §3a (Wardens are not in the cover-up), §6, §7, §12; `CHIP_SECRECY` §1, §3, §4; FPT D1146 |
| Ids | D1395 (settled) and D1396 (umbrella, open) moved from D1353-D1354 off Design's HC_PARADE block. This spec reserves **D1397-D1410**; next free **D1411** (checked against game main, every origin branch and design master b11348f, Tue Nov 3, 2026, about 8:30 AM ET) |
| Rooms | **None new.** Built maps only: `fb_lantern_in`, `fernbrook`, `route1`, `hm_lodge_in`. Rule 9 does not apply. Tiles marked UNVERIFIED need a path check |

## 2. Inspiration: three shapes

| | Shape | For | Against |
|---|---|---|---|
| **A (default)** | **Two trial shifts.** Both sides are courting the undecided holder, so both will open a door. Ilse's runner note gets you onto a Keeper curfew round; Vincent's Guest pass onto a Glimmerwell crew. Each shift shows one thing that side keeps quiet | Reuses the two pitches every holder gets (D1141, D1144); fair to both sides; no new place | Two scenes to write |
| B | **The courier:** carry one sealed parcel from Glimmerwell's camp to a Keeper post and back | Cheapest | Reads as a fetch quest, and like smuggling |
| C | **The bridge watch:** stake out the Route 1 bridge overnight and follow one cart | Strong mood | Shows only one side; needs new carts |

**Default A:** it is the only shape where the holder sees both sides firsthand before choosing.

## 3. The flow

Want: understand what happened in Fernbrook. Pressure: both sides want an answer. Turn: each side has a back room. Bottleneck: the built pick. Hook: "They don't buy old Seals to hang on a wall."

| # | Beat | Where | What happens | Sets |
|---|---|---|---|---|
| 1 | **The call** | `fernbrook`, first step out of the Lantern House after the dawn release | After Fen's dawn line, the Keeper1 rings: a call card with Ilse's face, one tap ANSWER. Fen's letter reached her (built canon: "Fen wrote to me"). The Keeper1 is on the wire, so she keeps it short: "Come home to the Lodge. Not on the wire." No phone (`!story.phone_got`): Amos passes the message on | `story.ilse_called` |
| 2 | **The debrief** | `hm_lodge_in`, Ilse 5,3 | Ilse is distraught at the President's order, never at the Keepers as a whole: tanks in Fen's town, a Hall shut, not one Warden asked. She can't search her own Commanders' tents. Vincent can see both sides; he has told her true things before (implied: her opening "Ask what it costs" came from him). She gives the holder a **runner's note** for the Commander's desk | `story.ilse_debrief` |
| 3 | **The rendezvous** | `route1` stream bank under the bridge (sand about 28-29,11-14, UNVERIFIED; STREAM BANK sign 29,9) | "No poles down here. The wire can't hear the water." His plan: take a shift with each side. He gives a **Guest pass** for Juniper's crew. He stays behind (he'd be recognised) | `story.rdv_met` |
| 4a | **Glimmerwell shift** (day) | `fernbrook` east road, Juniper's camp by the rubble (Juniper 30,8; props UNVERIFIED) | Pack three lamp crates (built crate-tap pattern). The holder sees a **buy-back ledger** ("OLD SEALS: 3 bought. Fair Acorns."), a crew Walkling back from a "free check-up" who **answers a beat late**, and the cart's back door: "Partners only, sweetie." (a natural blocker). Choice: "Ask about the cart" / "Keep packing" | `story.shift_g`, `story.pitch_g` |
| 4b | **Keeper shift** (night, by curtain) | `fernbrook` curfew posts 6,6 and 21,7; a field desk by the Hall cordon (about 20,7, UNVERIFIED) | Amos's pitch becomes "walk the lamp round with me". Curtain to evening (narration, never the real clock). The holder leaves Ilse's note on the Commander's desk and reads an unlabelled list (D1428): names of holders with Seals, no heading, and at the foot "By order of High Charity. Copies to Wardens: none." (PLACEHOLDER). Their own name is the newest line. Choice: "Tell Amos" / "Keep it quiet" | `story.shift_k`, `story.pitch_k` |
| 5 | **The report** | stream bank | A hub talk ("The roll" / "The ledger" / "That's all"). Vincent adds to each: the roll was a war list once; his own Walkling answers a beat late since its check-up. "I won't pick for you. Fen's at the orchard gate." He leaves | `story.rdv_done` |
| 6 | **The pick, as built** | orchard gate, 9,10 | The built `side_pick` runs unchanged. Fernbrook's hold flips only at its result (D1171, D1173); the curfew read ends | (built) |

The shifts run in either order. Budget: **about 60 text boxes** for the whole quest; the hook audit flags Act 1 reading load.

**Why the secrets fit canon.** *Keepers:* the Seal roll began as a Great War muster roll and its call-up law "was never struck out" (SEALS-L, Y); Wardens are kept in the dark (§3a), so Ilse's distress is earned. Nobody in this quest says what the list is for (D1428). The President's Seal trade is **not** shown, so Fen's "Then who's been buying?" stays open. *Glimmerwell:* the both-path buy-back (it "never says why") plus one CHIP_SECRECY hint (a Walkling who answers late after a visit). **No line names the chip, the Tuning, an implant or a relay**, because this save is not Glimmer-side.

## 4. Vincent

| | |
|---|---|
| Role | A Glimmerwell field agent (title PLACEHOLDER; label "Vincent"). Unaligned in practice: he passes true things to people on both sides |
| Stance | Against Glimmerwell buying Seals and what waits behind "Partners only" (he has stood at that door, never past it). Against the Keepers' martial order: tanks, curfews, a list of every holder with a Seal. Never says which side is right |
| Motive | His Walkling came back from a free check-up a beat late. He says no more |
| Off the wire | No Keeper1, so he is never in CONTACTS (and his name stays out of `S.phoneBook`) |
| Look (PAL, rule 11) | Glimmerwell set, worn down: soot `N` long coat, wine `V` scarf, lanyard pocketed, no crimson `Q` showing; hair `k`; skin from `1`-`6`; neutral bag `d` (Pia checks it against WARDROBE_SHOP's palette lock) |
| Voice | Wants holders who look before they choose; fears being the reason someone gets hurt. Short, dry, plain. Never says "chip" or which side to pick. Talks level to a child |
| Overlap | Ashlee Ironclaw is also unaligned and works both sides. Keep them distinct: she is research and the Arbiter; he is people and what doors hide |

Sample lines (PLACEHOLDER, each 110 characters or fewer, wording-checked):
1. "So Ilse sent you. Good. No poles down here. The wire can't hear the water."
2. "I wear their colours, holder. I don't wear all their plans."
3. "Both sides want you. So both will open a door. Walk through each one. Look at what they don't show you."
4. "They don't buy old Seals to hang on a wall. Ask what a free check-up costs."
5. "My Walkling went in for a free check-up last spring. She still comes when I call. A beat late."
6. "Tanks for a crate dispute. A roll of every holder with a Seal. That's not keeping." (D1428: "That's mustering." cut)

**Naming (D1399, open).** "Vincent" is the owner's own pick and also his first name. It still needs the STORY §12 registry and wording check. Default: keep it (names can be filled in later). Settle it before the build: `S.rep` is keyed by NPC name, so a later rename needs an alias in `normalizeV2`.

## 5. Flags and save

New `story.*` flags in `S.flags`. The save stays `pixelpets.save.v2` with `v` 2: no new top-level field, no migrator, no write at load.

| Flag | Set by | Read by |
|---|---|---|
| `story.ilse_called` | answering the call, or Amos's fallback | the Lodge cue; townsfolk back by day (D1405) |
| `story.ilse_debrief` | end of the debrief | Vincent's body at the stream bank |
| `story.rdv_met` | end of the rendezvous | the shift entries |
| `story.shift_g`, `story.shift_k` | end of each shift | the report |
| `story.pitch_g`, `story.pitch_k` | each shift (FPT names, not built) | STANDING (D1144) |
| `story.rdv_done` | end of the report | the pick trigger |

**Chain rows** after `post_trial`, before `pick`. Each `when` is `story.crackdown`, `!story.side_pick_done`, `!story.orchard_cleared` (PLACEHOLDER text):
- `ilse_debrief`, done on `story.ilse_debrief`: "Warden Ilse wants you home. Go to the Warden's Lodge."
- `rdv_meet`, done on `story.rdv_met`: "Meet Vincent at the Route 1 stream bank."
- `rdv_shifts`, done on `story.shift_g & story.shift_k`: "Work one shift for each side. Keep your eyes open."
- `rdv_report`, done on `story.rdv_done`: "Tell Vincent what you saw."

**Old and mid-way saves.**
- **Already picked:** every new row and object is guarded off, and `doneMask` marks the rows done.
- **#261 placeholder saves** (`post_trial_done`, no `crackdown`): these skip the rows, and the pick's new term lets them pick as they do today.
- **Mid-crackdown:** the crackdown's own `cd_resume`. The call fires on the first step outside after `post_trial_done`.
- **Mid-rendezvous:** each flag is a checkpoint. An unanswered call rings again. A shift replays from its start. Vincent waits until `rdv_done`.

**Leans.** By default this quest does **not** move `story.fen_lean`. Canon gives it three inputs (the Seal threat, the broadcast reply, the pick; SEALS-S, D1228), so a fourth would amend a red call (D1407). The D1146 counters are flavour only. Each shift choice can `inc` `story.lean_keep` or `story.lean_fix`, which changes one line of Vincent's farewell (fixed thresholds, since `cond()` can't compare two flags).

## 6. Where the pick fires now

The pick is the **built `side_pick` at `fb_side_pick` (9,10)**, with its result unchanged. Its trigger gains one `when` entry: `"story.rdv_done | !story.crackdown"`. To amend when this settles:
- **D1142:** on crackdown saves, the pick also waits for `story.rdv_done`.
- **D1175:** the post-Trial slot is now crackdown, call, debrief and rendezvous. `story.post_trial_done` still marks the end of the night.
- **D1203** (already amended): Amos's pitch becomes the Keeper shift and Juniper's east-road pitch the Guest shift.
- **D1141:** the two shifts meet "both pitches before the pick".
- **POST_TRIAL_CRACKDOWN:** in §6, `fen_dawn` now points home ("The Warden rang you too? Go. I'll be at the gate."), and the `pick` row's text changes.

## 7. Decisions (D1397-D1410 reserved; D1396 is the umbrella)

| Id | Colour | Call | Default |
|---|---|---|---|
| D1397 | red | Shape: two trial shifts (§2 A) | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1398 | red | Vincent's canon: Glimmerwell field agent, unaligned in Act 1, no Keeper1, Walkling "a beat late", old channel to Ilse | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1399 | red | NPC name "Vincent" (owner's pick, matches his first name); registry check; surname later | keep **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1400 | red | Meeting place: Route 1 stream bank (built tiles) | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1401 | red | Keeper secret: a district call-up roll from High Charity, no copies to Wardens; never the Seal trade | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1402 | red | Glimmerwell secret: buy-back ledger, the "beat late" Walkling, the "Partners only" door; no chip named | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1403 | red | Pick stays built at 9,10; trigger adds `story.rdv_done \| !story.crackdown`; amends D1141, D1142, D1175 | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1404 | yellow | Ilse's call: new call card (one tap; no new sound, no vibration, so no iPhone audio red); Amos fallback | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1405 | yellow | Townsfolk return by day once `story.ilse_called` (D1200); posts and notice stand until the pick | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1406 | yellow | Shifts in either order; the night shift is curtain time, never the real clock | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1407 | red | Should the rendezvous move `story.fen_lean`? (amends D1228) | no **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1408 | yellow | Shift choices `inc` the D1146 counters; flavour only | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1409 | green | Flags, rows and save guards as §5 | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |
| D1410 | green | About 60 text boxes; tests as §8 | yes **SETTLED** (Vincent, Tue Nov 3, 2026, 8:38 AM ET) |

## 8. Acceptance tests (`tests/rendezvous_vincent.spec.js`)

Run every test at 320, 375 and 390, with reduced motion on (the card is static and walks snap), and with zero console errors.
1. After the crackdown, the first step outside shows the call card. ANSWER is at least 44 px and inside the viewport, and it sets `story.ilse_called`. With no phone, Amos's fallback sets the flag.
2. The debrief sets `story.ilse_debrief`, and `findPath` reaches Vincent from both ends of Route 1.
3. Both shifts open after `story.rdv_met`, in either order, and each sets its `shift_` and `pitch_` flag.
4. The pick stays closed until `story.rdv_done`. `mapHold('fernbrook')` is `split` until the pick result (D1171, D1173).
5. On a picked save no new object shows. A #261 placeholder save gets no call and can still pick. `questCheck` returns `[]`.
6. A reload at each flag boundary resumes at the right step.
7. The save key is unchanged, `state.v === 2`, and there are no new top-level keys. The quest leaves `story.fen_lean` unchanged.
8. Scanning the new scenes finds no `chip|tuning|implant|relay|under the fur` and no banned words. Line limits hold: `say` 110, choices 30, quest text 110.

## 9. Open questions for Vincent

1. Two trial shifts as the shape? **Default: yes.**
2. After Act 1, does Vincent stay unaligned? **Default: yes; he returns in Act 2 on both paths as an informant (Story scopes it).**
3. Keep the name "Vincent"? **Default: keep; surname later.**
4. Is the holder's own name on the list too strong for Act 1? **Default: keep it.** (D1428: no draft line; the list stays unlabelled.)
5. Should the rendezvous move Fen's lean? **Default: no.**
6. Was Vincent behind Ilse's "Ask what it costs"? **Default: yes, implied only.**
7. Rook cameo at Juniper's camp? **Default: no (scope).**
