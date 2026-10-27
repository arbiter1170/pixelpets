# ARBITER_UNITS v0.1: the Signals

Design draft, Oct 27, 2026. Not in the game. Status: **waiting on Vincent** for D194–D204 in `OPEN_DECISIONS.md`. Nothing here goes into `sprites.js`, `stats.js`, `moves.js`, `quests.js` or a map until those rows are settled. Species ids are permanent once they ship (save v2 form ids), and the next area has no one-pager yet. Both are red items.

Files in this folder:

| File | What it is |
|---|---|
| `ARBITER_UNITS.md` | This spec |
| `arbiter_units.json` | Paste-ready data: `species` (art halves and `col`), `baseStats`, `learnsets`, `moves`, `units` (lore, Signal, clue, boss), `lines`, `flags`, `engineAsks`, `newNames` |
| `preview_journal.png` | All 15 tiers on journal navy with the `uiHalo` rim |
| `preview_map.png` | The same tiers on map grass, no halo |

## 1. What they are

Glimmerwell built five Walklings to carry the Arbiter's hum out of the lab. Glimmerwell calls them units, the word it already uses for every Walkling. The Keepers call them the Signals. Each one is a single Walkling with one name. It does not grow up into a new form. Instead it has three **attunement tiers**: Quiet, Listening, and In tune. Each tier changes its look a little and unlocks a new move. The tier rises as the Walkling hears the Arbiter more clearly.

They are rare, one of each, and met only as boss encounters at the end of a side branch off the main quest. Think of a once-per-save guardian, not a wild roll.

Lore guard rails (D32, D36): the Arbiter "emits slowly" and the emission is never named. In player text it is only "the hum". These units do not explain the Arbiter. They hint that it is reaching further than the lab.

## 2. The five

All five are SHADE type and carry VOLT moves for their electronic side (D203). Stats follow the house rule of 192, 256 and 320 per tier (D202). Their edge comes from level, a Signal, and their signature moves.

| Unit | Role | Final tier HP / ATK / DEF / SPD | Signal (passive) | Tier 1 move | Tier 2 move | Clue site (exists today) | Boss |
|---|---|---|---|---|---|---|---|
| **Tallybat** | Speed and debuffs | 65 / 80 / 60 / 115 | **Recount**: copies the first stat raise a foe makes | Head Count (SHADE, foe DEF −2) | Census Dive (VOLT 75) | Route 2, the Glow Census board | Lv 28, first |
| **Hushlamp** | Wall and healer | 95 / 70 / 95 / 60 | **Comfort Glow**: heals 10% on a turn it uses a non-damaging move | Dim Hours (SHADE, foe SPD −2) | Low Glow (SHADE 60, heals 20%) | Wickerglen, the Comfort Lamps | Lv 30 |
| **Ledgerowl** | Bulky attacker | 85 / 80 / 90 / 65 | **Filed Away**: takes 25% less from a move that already hit it | Stamp Out (SHADE 55, self DEF +1) | Final Entry (SHADE 85) | RegenX Records room | Lv 31 |
| **Cordhound** | Fast striker | 60 / 100 / 55 / 105 | **Live Wire**: its first VOLT hit has 1.5× power | Cord Snap (VOLT 55) | Grid Howl (SHADE 80, self SPD −1) | Cobblecrest Quarry crate yard | Lv 32 |
| **Humwisp** | Glass cannon, last | 55 / 120 / 50 / 95 | **Carrier Hum**: foes cannot boost a stat past +1 | Cradle Pulse (VOLT 65) | Deep Hum (SHADE 95, self DEF −1) | The Arbiter bay cradle, after the other four | Lv 34, final |

The SHADE matchups already in `TYPE_CHART` stand. SHADE hits VOLT and SHADE hard. A SHADE body takes double from GUST and SHADE moves, and half from STONE and FROST moves. The boss levels sit above Hale's Lv 21–23 team, so they suit the area after Cobblecrest.

### Look per tier

Every tier is an 8-wide half that the game mirrors, using `PAL` keys only (no new colours). The game draws the outline. All five set `uiHalo`, because their bodies are dark.

- **Tallybat**: a plum bat with navy wing skin and lime wing edges. Listening adds a white tally mark and cyan wing veins. In tune adds a cyan ear tip and a fuller trace.
- **Hushlamp**: lime lamp glass and a grey cap on a round, dark body. Listening adds cyan traces. In tune adds white feet and a white rim on the glass.
- **Ledgerowl**: a slate owl with a pale screen face, lime ear tufts and gold feet. Listening adds dark file stripes. In tune widens the body and adds a lime chest bar.
- **Cordhound**: a navy pup with a grey muzzle, lime ear tips and a cord tail ending in a gold plug. Listening adds collar traces. In tune adds taller ears and a doubled plug.
- **Humwisp**: a navy teardrop with a white and cyan screen mouth and cyan sparks. Listening widens it. In tune adds lime sparks around the outline.

The shared language is cyan circuitry that grows with each tier, and lime as the Arbiter-touched accent. That echoes the Bitlet line and the Arbiter cradle's cursor.

## 3. Attunement instead of growing up (D195, D196)

- A new species flag, `attune: true`, removes the GROW UP button and `canEvolve` for that species. The stage number still holds the tier, so `formIdOf`, `BASE_STATS`, `LEARNSETS` and the journal keep working unchanged.
- A new additive per-pet field, `hum`, runs from 0 to 100. Tier 1 arrives at 40 and tier 2 at 100. Save `v` stays 2. Unattuned pets have no `hum` key.
- Hum sources (defaults): +5 for a trainer win with it in battle, +3 for a wild battle, +10 on the first visit each day to a place `mapHold` calls Glimmerwell, and +20 once at its own clue site after its boss is done.
- A tier-up is automatic. It plays one narration line and teaches the tier's lv 0 move, the same way a grow-up move is taught:
  > {pet} hums in tune with something far off. Same {species}. A new glow.
- The pet tab hint reads "Hum 52/100 · In tune at 100" in place of the GROW line. The stars stay.
- Every player line avoids the banned words. The word for the change is "in tune", never a growing-up word.

## 4. Harder to befriend (D198)

- `befriendMul: 0.6` on each species narrows the befriend zone to 60% of the usual width. The `0.6` overall cap in `befriendZoneWidth` still applies afterwards.
- A boss can only be befriended after its shift (section 5). Before then, BEFRIEND shows a fixed wary line: "It only hears the hum. Wait for the shift."
- Befriend Treat, the Kin Ribbon and the greet call still help. The existing tries limit stays.

## 5. Boss encounters (D199)

Each boss is a wild battle with a new `boss: true` option on the map object.

1. It opens at tier 1 (Listening), at its boss level, with its tier 1 moves.
2. At half HP it **shifts**. The art swaps to tier 2, it learns the tier 2 move, and it gains +1 to its highest stat. The line reads "The hum rises. {foe} is in tune now." This is the moment the player sees attunement happen.
3. Befriending opens after the shift.
4. If the boss is worn out, or the player leaves, it goes back to its post: "It slips back to its post. The hum will call it out again tomorrow." `daily.sig_<id>` holds the rematch until the next day. Nothing is lost for good.
5. A befriended unit joins at **tier 0 (Quiet)**, with `hum` 0. Away from its post the hum goes quiet, so the player earns the tiers back. This keeps a Lv 30 boss from arriving fully powered.

## 6. The quest branch (D200)

A side branch, not a main-chain step, offered once `story.cobble_end` is set and the player reaches the next area.

- **Clues** sit at places that exist today, where Glimmerwell already works: the Glow Census board, the Comfort Lamps, the Records room, the quarry crate yard, and the Arbiter cradle. Reading one sets `story.sig_<id>_clue` and points to the boss.
- **Bosses** wait at five sites in the next area. They are marked `[NEXT AREA SITE 1..5]` until that area's one-pager exists. No place names are invented here.
- **Order**: Tallybat, Hushlamp, Ledgerowl and Cordhound in any order. Humwisp's clue needs all four `story.sig_<id>_done` flags.
- **Both sides, same flags.** On the Keepers path, Archivist Mo asks you to quiet the hum. On the Glimmerwell path, Associate Quinn asks you to "recall five units". Each `@glimmer` scene sets the same `story.*` flags as its base, as the engine requires. Draft lines are in `arbiter_units.json` `lines` and are marked placeholder.
- `story.sig_all` closes the branch. A reward is left open for Design, in D200.

## 7. Journal (D201)

The units stay out of the 45-form count. A SIGNALS row sits below the grid with one slot per unit, shown as `???` until met. Each slot shows that unit's current tier with the existing star pips. `secret` keeps them out of `JOURNAL_FORMS`, the same way `npcOnly` does for the Fetchling line.

## 8. Arbiter Testing overlap (D204)

These units carry a factory chip. It is not the Tuning chip from Arbiter Testing (D24, D187–D190). They do not get `chip.locked`, so they can go to the Walkling-box. Quinn's Tuning cannot be run on one. `align` does not apply to them. `hum` is their meter.

## 9. Engine asks, in build order

1. `attune`, `hum`, and the tier-up path (D195, D196).
2. `befriendMul` and the post-shift befriend gate (D198).
3. Boss battles and the shift (D199).
4. Signals: one passive per species, read in `damage()`, `applyStage()` and the end of a turn (D197).
5. The SIGNALS journal row (D201).
6. The quest branch, once the next area's one-pager exists (D200).

Suggested tests, following the repo's existing specs: a data check that each unit totals 192, 256 and 320; spawn odds of 0 everywhere, as for Bitlet; a forced boss battle that shifts at half HP; befriend width at 0.6×; tier-up at hum 40 and 100 with no GROW UP button; the journal still reading "Out there 45"; and save `v` staying 2.
