# ARBITER_UNITS v0.2: five that answer the hum

**Design scope, Oct 27, 2026. Nothing here is in the game yet.**

Vincent settled four calls on Oct 27:
1. The lairs live in the next area only.
2. Glimmerwell built these Walklings, and the hum woke them.
3. The tiers are Quiet, Humming and Answering.
4. Both paths attune the same way, and any holder can hush one.

The other calls stay open in D194–D204 (`OPEN_DECISIONS.md`). Nothing goes into `sprites.js`, `stats.js`, `moves.js`, `quests.js` or a map until those rows are settled.

Every choice below points at a system, flag, place or line that already exists. The `game.js` line numbers are from `main` at `e0d7531`.

| File | What it is |
|---|---|
| `ARBITER_UNITS.md` | This spec |
| `arbiter_units.json` | Paste-ready data. It holds the species art and `col`, `baseStats`, `learnsets`, the new moves, and for each unit its Echo, clue, lair need and boss settings. It also holds the hum and boss rules, the side chain, flags, lines and build order |
| `preview_journal.png`, `preview_map.png` | All 15 tiers, shown on journal navy (with the `uiHalo` rim) and on map grass |

## What changed from v0.1, and why

Three code surveys found these clashes. Each is fixed here:

| v0.1 said | The game says | v0.2 |
|---|---|---|
| "Glimmerwell built five Walklings" | Bitlet "woke when the cradle hummed" and is "not a product" (`heights.json` `_lore.bitlet`) | Glimmerwell built five **tools**. The hum **woke** them |
| Group name "the Signals" | "Signal" is the Keepers' phone word: Signaller Tamm, and Rue's "clean signal" | Keepers call them "the Answerers". Glimmerwell calls them "the Founder's Line" |
| Tiers Quiet / Listening / In tune | "Tuned" and "Tuning" belong to Arbiter Testing (D187). "Listening" is Mo's "child born already listening" (D36) | Quiet / Humming / Answering, from "A cursor answers the hum" |
| Clues at the Comfort Lamps and the census board | The lamps and census tent go away after `story.glen_cleared`. There is no census board on Route 2 | New clue props, added through `detail_*` overlays |
| Records and cradle clues for both sides | Keepers cannot enter the lab: `ht_lab` needs `heights_path=lab` | Twin clue objects, one per side, that set the same flag |
| Cordhound "paces the night carts" | The night carts belong to the smuggling ring. Fen: "Not Tobin's crates. No logo." | Cordhound tethered Glimmerwell's humming BRINEWICK DOCKS crates |
| Quinn says "sweetie" | That is Imogen's word. Quinn is calm and exact | Quinn's lines rewritten |
| Move "Cord Snap" | "Cold Snap" already exists | Renamed "Cord Lash" |
| Lairs in the next area, as placeholders | Settled the same way | The lair needs are now listed for the next area's one-pager |

## 1. Names

**Where they come from.** Glimmerwell built five tools:
- a Glow Census counter
- a Comfort Lamp
- a records filing unit
- a crate tether
- a vessel to carry the hum out of the bay

The Arbiter's hum woke them, the same way it woke Bitlet. Quinn's canon line "We do not know what it sends" still holds. Glimmerwell owns the shells, not the waking. The emission stays unnamed (D32). No player line calls them a product or a sample.

**Group names, by side.** These use the twin-object pattern.
- Glimmerwell says "the Founder's Line" and "units". Marlowe is the founder named in the Founder's Pick blurb. "units" is already their word for a Walkling (`standing.js` glossary).
- Keepers say "the Answerers", from Archivist Mo's books.

**Unit names.** Each name joins two words, like the existing lines. Each fits the 9-character `{species}` width, and none collides with a current name. The names read like final-form names (-hound, -owl), which suits a boss. Each name stays the same across all three tiers.

| Unit | Built as | Tie to the game |
|---|---|---|
| Tallybat | a Glow Census counter | Hollis's census on Route 2, and the Tour's census board |
| Hushlamp | a Comfort Lamp | The Wickerglen lamps "hum oddly". The glossary calls draining "glow sharing" |
| Ledgerowl | a records filing unit | RegenX Records: "An older note says THE ARBITER" |
| Cordhound | a crate tether | The BRINEWICK DOCKS crates that "hum like something asleep", and Rook's humming crates |
| Humwisp | a vessel for the hum | The cradle, and Testing's line "something vast exhales" |

Each unit gets a `LORE` line in `game.js` and a blurb in `sprites.js`. Both are in the JSON.

## 2. Tiers instead of growing up

The tiers are **Quiet (0) → Humming (1) → Answering (2)**. The tier is stored in `p.stage`. Form ids, `BASE_STATS`, `LEARNSETS`, `markCaught` and the ★☆ stars therefore keep working unchanged.

**Engine hooks:**
- **No growing up.** A species flag `attune: true` makes `canEvolve` (`game.js:281`) return false. That one change removes the GROW UP button, the `growup` tip and `startEvolution` for these species. An attune branch goes in `updateHUD` before `game.js:707`, and in `growText` (`game.js:7494`).
- **Tier-up.** Keep `oldMax`, set `p.stage`, call `carryHpOnEvolve` and `markCaught`, then `save()`. Do **not** mark `evoMoves`. `pumpLearn` (`game.js:7264`) then teaches the tier's level-0 move with no new code.
- **Animation.** Reuse the `drawEvolution` overlay with new copy: "{pet} is humming!" and "{pet} answers the hum! Same {species}. A brighter glow." No growing-up words.
- **Hum meter.** `p.hum` runs 0–100. It is additive and validated in `fixPet` (`save.js`, next to `faded`). Humming starts at 40 and Answering at 100. A HUM bar sits under NRG on PARTNER, copying the ALIGN bar from Arbiter Testing (`ss-align` and a body class toggled in `updateHUD`).

**What fills the hum:**

| Source | Gain | Hook |
|---|---|---|
| Win a battle it took part in | +4 | `results` (`game.js:7116`) |
| First arrival of the day at a place `mapHold` calls Glimmerwell | +6 | Same hook as `alignGlowOnArrive` on the Testing branch |
| First visit of the day to its own lair | +10 | In the next area |
| Humwisp is in the party | The other four gain ×1.5 | Humwisp's Echo |

**Hush.** A HUSH / LISTEN toggle on the stats card writes `p.hush`.
- While hushed, the meter stops filling. The tier never drops.
- The toasts are "{pet} goes quiet." and "{pet} listens again." Both are at most 40 characters.
- Archivist Mo's canon line frames the choice: "If you ever wear their crest, look at your own hands."
- Both sides attune at the same rate.

**How it fits Arbiter Testing:**
- These units carry no Tuning chip and have no `align`.
- The D188 lock does not apply, so they can go in the Walkling-box.
- Testing's `tune` step refuses attune species.

**Save:** `v` stays 2.
- `hum` and `hush` are new additive fields.
- Five ids are appended to `SPECIES_IDS` after `fetch`, adding 15 form ids.
- `tests/heights.spec.js` asserts `lastId 'fetch'` and `forms 48`, so it needs an update.

## 3. Echoes (passive powers)

Each Echo is left over from the job Glimmerwell built the tool for. An Echo works the same whether the unit is a boss or on your team. The battle line is "{pet}'s Echo: Recount!", and the stats card gets an ECHO row.

| Unit | Echo | Rule | Hook |
|---|---|---|---|
| Tallybat | **Recount** | The first time a foe raises its own stat, Tallybat raises the same stat by the same amount | `applyStage`, after the stage is written (`game.js:5630`) |
| Hushlamp | **Glow Share** | After dealing damage, heals one sixth of it | `doMove`, after the HP write (`game.js:5588-5592`) |
| Ledgerowl | **Filed Away** | Takes 25% less from a move that already hit it this battle | One `hitFoe` / `setMyHp` wrapper before HP is written |
| Cordhound | **Live Wire** | Its first VOLT hit in a battle has 1.5× power | `doMove`, before `damage()` |
| Humwisp | **Carrier Hum** | While it is out, foes cannot raise a stat above +1. Out of battle, the other four gain hum ×1.5 | `applyStage` clamp. `aiPick` must treat +1 as the cap (`game.js:5409`, `5422`) |

**Shape.** One `ECHOES` table keyed by species id, with optional `onStage`, `onHitTaken`, `onHitDealt` and `powerMul` hooks, and an `echoFor(battler)` helper. The closest existing patterns are `applySoftBerry` for on-damage and `applyEntrance` for on-entry. No Echo needs an end-of-turn hook.

**Signature moves.** These are taught at tiers 1 and 2. Every effect uses the two move-effect shapes that already exist.

| Unit | Tier 1 | Tier 2 |
|---|---|---|
| Tallybat | Head Count (foe DEF −2) | Census Dive (VOLT 75) |
| Hushlamp | Dim Hours (foe SPD −2) | **Lights Out** (SHADE 75, foe SPD −1; replaces Low Glow, so it does not stack heals with Glow Share) |
| Ledgerowl | Stamp Out (SHADE 55, own DEF +1) | Final Entry (SHADE 85) |
| Cordhound | **Cord Lash** (VOLT 55) | Grid Howl (SHADE 80, own SPD −1) |
| Humwisp | Cradle Pulse (VOLT 65) | Deep Hum (SHADE 95, own DEF −1) |

**Stats** follow the 192 / 256 / 320 rule that `tests/integrity_lib.js` enforces. A boss's extra toughness comes from a battle-only multiplier, never from base stats.

**Typing.** They are SHADE only, with VOLT moves for the electronic side. The `TYPE_CHART` stands: SHADE hits VOLT and SHADE hard, takes double from GUST and SHADE, and takes half from STONE and FROST.

## 4. Boss battles

**Setup.** Each boss is a placed `kind: 'wild'` object whose scene runs `["encounter", id]`, the same pattern as `rx_bitlet`. The object adds `boss: true`. `sceneEncounter` passes that into `openBattle` as `B.boss`.

**The fight:**
1. The boss opens at **Humming** (tier 1).
2. `makeFoe` gives it ×1.5 max HP for this battle only. `BASE_STATS` are untouched.
3. The AI plays at `leader` level, through an `aiPick` override when `B.boss` is set.
4. The music is `glimmer_battle`, with a cool tint class on `#ovBattle`.
5. **The shift.** At the end of any turn that leaves the boss at or under 50% HP, a hook placed right before `endCheck` (`game.js:5442`, `5455`) runs `setFoeTier(f, 2)`. That function:
   - updates the form, stage and stats
   - keeps the HP percentage
   - swaps the tier-2 move in for its weakest move
   - gives +1 to its highest stat
   - flashes, then calls `renderBattleCards`
   - fixes `#btTwinkle` and the rare-form sparkle (`game.js:7412`)

   The line is "The hum rises. {foe} answers it." `drawMon` reads `f.stage` every frame, so the new art shows at once.
6. **Befriending.**
   - Before the shift, BEFRIEND is refused with "It only hears the hum. Wait." (`battleAct` / `renderActs`, `game.js:5309`, `5326`).
   - After the shift, `befriendZoneWidth` (`game.js:7330`) multiplies the zone by `befriendMul` (0.75 to start).
   - The target is about 0.10 zone width at 25% HP, against a lead five levels lower. Tune it with `PixelPets.befriendOdds`.
   - The usual 3 tries stand.
7. **A loss, a run or a knockout** sets `story.sig_<id>_rest`. The day roll in `fadeTick` clears it, the same pattern as `buddy_pat_today` (`game.js:4971`). The object's `when` is `!story.sig_<id>_rest`, and the line is "It slips back to its post. The hum will call it out again tomorrow." No new condition type is needed.
8. **On befriend**, `befriendTry` (`game.js:5549`) takes a boss branch:
   - The unit joins at **Quiet** with `hum` 0.
   - Its moves are `defaultMoves(<id>/0, level)`, with empty `evoMoves`.
   - It has to earn its tiers again.
   - `story.sig_<id>` is set, because the object id is `sig_<id>`.

**Levels:** Tallybat 28, Hushlamp 30, Ledgerowl 31, Cordhound 32, Humwisp 34. That is above Hale's Lv 21–23 team, which fits the next area.

## 5. The quest branch

The lairs are in the next area (settled), so the branch ships with that area.

**Side chain "Five that answer".** It is one `SIDE_CHAINS` entry in `quests.js`. `CHAIN` does not change.

| Step | Done when | Notes |
|---|---|---|
| `sig_open` | `story.sig_open` | |
| `sig_four` | `story.sig_tallybat`, `story.sig_hushlamp`, `story.sig_ledgerowl` and `story.sig_cordhound` are all set | One step with four done flags, because the four can be cleared in any order (the implication rule at `quests.js:276`) |
| `sig_last_clue` | `story.sig_humwisp_clue` | |
| `sig_last` | `story.sig_humwisp` | |

The clue flags and the rest flags go in `NOT_STEPS`.

**Gate:** `story.cobble_end` plus the next area's arrival flag. Its name is a placeholder until the one-pager names it.

**Entry.** Each side has its own giver, and both set `story.sig_open`. The scenes live in `data/glimmer_path.json` as `sig_open` and `sig_open@glimmer`, so `glimmerDevCheck` covers them.
- **Keepers: Archivist Mo.** A line key `story.cobble_end&!story.sig_open` → `@sig_mo` sits ahead of the side key in `hq_mo` (`data/civic.json`).
- **Glimmerwell: Associate Quinn**, as an NPC in `cc_hall_in`. She appears after `story.arbiter_test_seen`, which comes from the Testing branch, or after `seal:seal_glim_2` if Testing is not merged. She needs an "Associate Quinn" cast row in `data/reputation.json`.

**Clues.** Each clue is reachable on both paths after `cobble_end`, and each points down the Brinewick road.

| Unit | Clue | Map and change |
|---|---|---|
| Tallybat | A census post left standing, still counting | `route2`, new prop through a `detail_*` overlay (`act1_route2` is verbatim) |
| Hushlamp | One lamp stand left lit: "The lamp count came up one short." | `route2_glen`, overlay |
| Ledgerowl | Glimmerwell: the locked file carts in Records. Keepers: Mo's archive shelf | `rx_f3` / Keeper House, twin objects keyed on `story.side`, same flag |
| Cordhound | A chewed tether trailing from the BRINEWICK DOCKS crates down the closed road | `cobblecrest` `cc_crates`, overlay |
| Humwisp (after the four) | Glimmerwell: the cradle. Keepers: the old mast in Mahopac picks up the hum | `rx_f4` / `mah_signal_mast`, twin objects |

The Arbiter Bay staff door (D92) stays closed and is not used.

**Lair needs for the next area's one-pager.** These are needs, not place names.

| Unit | Lair need |
|---|---|
| Tallybat | An outdoor tally gate where crates are counted |
| Hushlamp | A dim interior rest room, a "Comfort Sanctuary" |
| Ledgerowl | A shipping ledger office |
| Cordhound | The cargo yard where the BRINEWICK DOCKS crates end up |
| Humwisp | The place where the hum is loudest, the Act 2 hook |

Each lair has one boss tile, a prop that echoes its clue, and a Lantern House within reach.

**Close.** When `story.sig_all` is set, a closing scene plays with Mo or Quinn. The proposed reward is 10 Standing to your side, once, plus a journal line. The reward stays open in D200.

**Journal.**
- A `boss` species flag keeps the units out of `JOURNAL_FORMS`, so the journal still reads "Out there 45" (the same way `npcOnly` works).
- A row under the grid holds five slots. They show `???` until met, then the highest tier reached.
- The row is headed "ANSWERERS" or "FOUNDER'S LINE", depending on your side.

## 6. Build order

- **A. Engine, buildable now:**
  - `attune`, `hum` and hush
  - Echoes
  - boss battle and the shift
  - the journal row

  Test it with the debug `forceBattle`; no map is needed.
- **B. The next area's one-pager** carries the five lair needs from §5.
- **C. With the next area:** the side chain, the clue props, the entry scenes and the lairs.

Suggested tests:
- the stage totals
- spawn odds of 0, as with Bitlet
- a forced boss battle that shifts at half HP
- BEFRIEND refused before the shift
- the zone width after the shift
- tier-ups at hum 40 and hum 100, with no GROW UP button
- hush stops the meter
- the journal still reads "Out there 45"
- save `v` stays 2
