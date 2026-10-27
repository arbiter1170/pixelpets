# ARBITER_UNITS: plan for the open decisions (D837-D853)

Branch `claude/answerers-decisions`, cut from `claude/answerers` (PR #205). Status: **plan only, nothing built**. Each item marked *Ask* needs a yes or a change from Vincent before it is built.

The 17 rows sort into three kinds:

| Kind | Rows | What it takes |
|---|---|---|
| Creative | D851 copy, D843 branch and reward, D853 clue reach | Lore work, new lair beats, rewritten copy (sections 1-4) |
| Tuning | D839 hum, D841 befriend width, D842 boss HP and levels, D845 stats | A measured playtest (section 5) |
| Confirm and close | D837, D838, D840, D844, D846, D847, D848, D849, D850, D852 | A yes moves each to the archive (section 6) |

## 1. The spine: the cradle's four words

The Signal Review already prints the line `COUNT. GATHER. LISTEN.` when a chipped Walkling reaches the cradle (`data/detail_signal.json:257`). Nobody explains it. The Answerers explain it without naming the emission: **each one is a word.**

| Word | Unit | Built to |
|---|---|---|
| COUNT | Tallybat | count Walklings for the Glow Census |
| GATHER | Dimlamp, Cordhound | Dimlamp draws Walklings in; Cordhound tethers and hauls them |
| LISTEN | Filecrow | hear and file everything, on every side |
| ANSWER | Humwisp | the word the cradle never printed: it carries the hum back |

This is why the cradle's line ends "IT IS NOT SAYING HELLO". The words are a work order, and the Answerers are the crew that walked off the job. The close should land on the line the cradle never finished. *Ask:* adopt this as the spine (it adds a story fact, so it needs a D row; see section 7).

Three threads woven through it:

- **A second net.** Operator Rue says "We own the poles from this hill to the coast. There is no other net." (`civic.json:448`). The Relay House at Brinewick's gate is an older one. On the Keepers path, Mo writes it down and Rue does not like it. On the Glimmerwell path, Quinn calls it "legacy coverage".
- **The twelfth lamp.** Rook delivered "Twelve more lamps" to the Census (`act1_route2.json:221`) and "Twelve Comfort Lamps for the seam" (`cobblecrest.json:425`). Dimlamp is the lamp that walked off his cart. Rook gets a beat on both paths. *Ask.*
- **Brinewick by sea.** Cordhound's yard is where the BRINEWICK DOCKS crates wait for a boat. That points Act 2 at the coast without opening it. Lumen's dark Brinewick light on the council board (`highcharity.json:1624`) is the Keepers half of the same hook.

## 2. Five lairs, five different beats

Today every lair is "read a clue, walk, talk, one battle". Each lair below gets its own small puzzle or moment built from systems that already exist. Effort is **data-only** (JSON in `data/detail_route3.json`) unless marked.

| Unit | Lair beat | Reuses | Effort |
|---|---|---|---|
| **Tallybat** (COUNT) | Four crate stacks at the tally gate. Tap them in the order the clue gives (the census post reads "4, 3, 1, 2"). A wrong tap: "It recounts." and the count resets. The fourth right tap wakes it. | `inc` counter, numeric `if`, `lines` keys, boss `when` | Data-only |
| **Dimlamp** (GATHER) | The Comfort Sanctuary is only lit at night (`phase:night`); by day, "The lamps are off. Come after dusk." The cot offers a choice. **Lie down** rests the party, then Dimlamp drifts over (`approach`) and the fight starts as an ambush. **Turn the lamps down** appears only after you have talked to both lamps; it opens the fight awake, and Dimlamp starts one stage lower. The tag reads LAMP COUNT 11 OF 12, so Rook appears afterward. | clock `cond`, `choice` 4th-element `when`, `approach`, `rest` | Data-only (the stage drop is a small engine change, or skip it) |
| **Filecrow** (LISTEN) | Three file cards lie in the ledger office: two true, one forged. At the perch, "Which file is false?" lists only the cards you found. The right answer gives a befriend treat and bond. A wrong one: "FILE PENDING." and it hops away for the day. One card is a ledger page with a blank where a name should be, mirroring Mo's blank page. | `pickup` flags, choice `when`, `give`, `bond` | Data-only |
| **Cordhound** (GATHER) | It paces the cargo yard (`patrol`) and stops only when you corner it. Paw prints and a chewed cord show where it has been. Crates stencilled BRINEWICK DOCKS, two lines about the tide schedule. | `patrol` on a `wild` | Data-only (confirm that patrol draws on a wild) |
| **Humwisp** (ANSWER) | The Relay House has a keeper first: a pilot-era operator (a trainer) behind a `need` door, a group battle in which Mo's or Quinn's Walkling fights beside you as an ally. Inside, the hum is loudest. If you befriended Bitlet, Bitlet's cursor finally types one new word to Humwisp. Last ambient line at the gate: Hale's "old Hale says hello" answered by silence. | trainer packs, `group` + `ally`, door `need`, `if story.rx_bitlet` | Data-only |

**Boss personality in battle (small engine, about 10 lines).** Today every boss says the same shift line and opens with a random move. Two fields per boss:
- `shiftLine`, e.g. Tallybat: "It counts you. It counts again."
- `opener`, e.g. Filecrow opens with Stamp Out and Dimlamp with Dim Hours.

These pass through `sceneEncounter` into `makeFoe`, which already accepts `opener`.

## 3. D843: "Quiet them, or keep them"

Mo's opener offers that choice, but today only befriending counts. Beating a boss just sends it back to its post, which reads as failure. Proposal (small engine, plus data and quests.js):

- `sceneEncounter` exposes the result to the scene (`enc.result`).
- Beating a boss after it has shifted sets `story.ans_<unit>_quiet`: it "goes still", off the books, and stops resting at its post. The `ans_four` and `ans_last` rows accept either flag.
- The close has three versions: all kept, all quieted, or a mix. Mo writes down what you chose ("Two kept. Three quiet. I wrote down which."); Quinn files it ("Five units accounted for. Two on lanyards.").
- **Reward.** Keep 500 Acorns once. Add a keepsake that is only a record: Mo's or Quinn's page in the journal row showing each unit as KEPT or QUIET. No Standing, because the quest rules forbid Standing grants from side quests.

*Ask:* build the quiet path. Without it, the choice in Mo's line should be cut.

## 4. D853 (clue reach) and the copy pass (D851)

**Reach gap fix.** Move clues to places each side is guaranteed to have visited, since Route 3 already requires each side's finale:
- Glimmerwell clues go to Signal Review sites: the quarry, the Wickerglen lamps and the Arbiter Bay briefing room. `story.gb_done` is required, so they cannot be missed. The RegenX lab clues become extras.
- The Keepers Humwisp clue moves from the Mahopac mast (needs `story.mom_sent`) to Lumen's council board in High Charity. After the council, the console already reads "Brinewick is marked. Its light is dark." The clue adds: "A second light, under it. Lit. Nobody marked it."

**Copy pass rules** (from the lore brief). Every placeholder line gets rewritten against these:
- Mo records and never crusades. Quinn is procedural, uses euphemism, and does not say "sweetie". Rook trails off with "...". Glimmerwell signs end on a sign-off.
- Never name the emission. Never call an Answerer a product or a sample. "Tuned" belongs to Testing.
- `say` up to 110 characters, ambient lines and toasts up to 40, choice labels up to 30. Every `@glimmer` variant sets the same flags.
- Mo's opener on the Keepers path follows Lumen's refusal to open the road, so it should say so: "Lumen kept the road dark. The road did not listen."
- "First relays" means the pilot years just before the chips, not ancient. Only the Arbiter is old.
- Fix the STILL toast mismatch. Code says "{pet} keeps still."; the spec says "goes quiet". Keep the code's line and update the spec.
- Names to settle: ROUTE 3 stays the map name, with "the Brinewick road" in signs. Proposed: Tally Gate, the Night Sanctuary (it's only lit at night), the Ledger Office, Dock Yard 3, the Relay House. The gate sign: "BRINEWICK · Not yet." (keep it; it echoes Rook).

## 5. Tuning (D839, D841, D842, D845): a measured playtest

Each value is one constant. Run every boss with the debug cheats and record:

| Measure | Target | Constant |
|---|---|---|
| Turns until the boss shifts, at the expected party level (24-27) | 4-6 | `BOSS_HP_MUL` 1.5 |
| BEFRIEND attempts after the shift | 2-4 | `befriendMul` 0.75 |
| Real days from a joined Quiet unit to Humming | 3-4 days of normal play | `HUM_GAIN`, `HUM_TIERS` |
| Days to Answering | about 2 weeks | same |
| Party wipes per boss for a prepared player | about 0-1 | boss levels 26-30 |

Defaults stay as built until the numbers say otherwise. D845 (stats 192/256/320) stays unless a boss is trivial at Quiet tier.

## 6. Confirm and close

These are built and either settled or green. A yes moves each to `archive/DECISIONS_SETTLED.md`:
- D837 names (settled in part; ids 20-24 are permanent once #205 merges)
- D838 tiers and STILL
- D840 Echoes
- D844 the journal row
- D846 typing
- D847 chips refuse an Answerer
- D848 the road gate
- D849 the split hold
- D850 the Route 3 wilds
- D852 the second Quinn. Consider giving her a distinct look key: today both Quinns share `quinn`.

## 7. Order of work and new rows

1. **Phase 1, data-only (this branch):** the D853 clue moves, the five lair beats, the copy pass (D851) and the Rook beat. Tests: extend `five_answer.spec.js` with each lair beat at 320, 375 and 390.
2. **Phase 2, small engine:** `enc.result` and the quiet path (D843), boss `shiftLine` and `opener`, then the close variants and the journal page.
3. **Phase 3, tuning:** the playtest table above. Adjust the constants and record the numbers in the rows.
4. **Phase 4:** archive the confirmed rows, update README, CHANGELOG and the spec, bump the build and open the PR.

New rows (from D854): the cradle-word spine, the twelfth lamp (Rook), the quiet path, and the lair names.

## Questions for Vincent

1. Use COUNT / GATHER / LISTEN / ANSWER as the spine?
2. The twelfth lamp: is Dimlamp the lamp off Rook's cart?
3. Build the quiet path (beating a boss counts), or cut "Quiet them" from Mo's line?
4. Night-only Sanctuary: OK that Dimlamp can only be met after dusk (in-game time, a 42-minute day)?
5. Keepsake reward: the KEPT / QUIET page, or Acorns only?
