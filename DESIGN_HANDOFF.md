# Designer hand-off: art and writing needed (Oct 13, 2026)

For the designer. The paste-ready assignment for a designer bot is [DESIGNER_PROMPT.md](DESIGNER_PROMPT.md) (what to produce, where to look, and the engine that has shipped since this file was written). This file is the background: voice, sizes, and the request list. Read `NEXT_PLAN.md` WP-B for the engineering detail behind a request.

What is being built, in one paragraph: (1) a **Quest button** next to the D-pad (shipped); (2) **harder, level-scaled befriending** (shipped); (3) a **side pick at Fernbrook** between the **Keepers** and **Glimmerwell Co.**, with **Standing**, **switch desks**, and a **glimmer-path version** of the remaining Act 1 story. Fernbrook glimmer and the Bright Pavilion Tour are shipped (Build 3). Next writing is still Route 2, Cobblecrest, the Cobblecrest Sacrifice, and Rook's R5, and that copy already exists on the stranded branch. **Rook stays with Glimmerwell if the player does; he converts only on the Keepers path** (D23).

Oct 14 look-and-listen (Q20) has shipped: `seal_glim_2` is `LANYARD_TIER2` (gold rim, mint field, two white marks), `town_glimmer` / `quarry` / `grove` are loops in `sfx.js`, Imogen and Hollis have their own looks in `data/act1_route2.json`, and Rook wears a lanyard accessory after the glimmer pledge (and after Fernbrook on either path) until `story.rook_end` is `ally`. Tour stop lines are still writing (D26), not art. Sacrifice props stay blocked on D24.

Decisions already made (Vincent, Oct 13, evening): the pick is at Fernbrook and is switchable later; Standing tracks regard per faction; Hall slot 1 is the Bright Pavilion Tour (built); Hall slot 2 is the Sacrifice with Quota as the free floor (not built); Rook stays if the player is Glimmerwell and converts if the player is Keepers. The morning "Rook always leaves" / "Halls undefined" notes are superseded. Section 6 now asks for the Sacrifice one-pager and Tour stop copy, not a from-scratch Hall spike.

## 1. Reference examples in this repo

Look at these before drawing or writing. Everything the game has today came through the same hand-off shape: a spec with `decisions`, requests, looks, speakers and new names, then data copied verbatim into the game.

### Hand-off format (best single example)
- `data/cobblecrest.json`: the most complete past hand-off. Read its `_about`, `decisions`, `artRequests` (id / what / priority must-should-could), `looks`, `speakers`, `newNames`, `engineAsks`, `friendSlots`, `scenes`, `trainers`, `flags`.
- `data/act1_route2.json`: the same shape for Route 2 (`decisions`, `scenes`, `trainers`, `spawnTables`, `slicePatch`).
- `data/maps_slice.json`, `data/interiors.json`: the original slice (`scenes`, `trainers`, `tiles`, `maps`, `dialog` rules).

### Writing examples
| Want to see | Look at |
|---|---|
| Step-based scene scripts (`say`, `choice`, `if`, `setFlag`, `give`, `battle`) | `data/maps_slice.json` `scenes`: `rival1`, `glimmer1`, `fen_intro`, `orchard`, `seal1`, `teaser` |
| A scene with branching choices | `data/act1_route2.json` `scenes.lead_intro`; `data/cobblecrest.json` `scenes.quarry_buyout`, `seam_a`, `hale_trial`, and the patched `route2_end` (the `rook_pact` choice) |
| Glimmerwell's voice | `glimmer1`, `lead_intro`, `glen_cleared`, `quarry_buyout` (Juniper, Imogen, Dorian Pell) and the `fern_associate` trainer lines |
| Keepers' voice | `fen_intro`, `orchard`, `seal1` (Fen), `hale_trial`, `seal2` (Hale) |
| Rook's voice, and his doubts | `rival1`, `teaser`, `glen_cleared`, `quarry_buyout`, `brinewick_hook`, and `rival2_rook` in `data/cobblecrest.json` |
| Trainer lines (intro / win / lose) | `trainers` blocks in `data/maps_slice.json`, `act1_route2.json`, `cobblecrest.json` |
| Ambient NPC chatter (<= 40 chars) and the dialog rules | `data/interiors.json` `dialog` (`lineMax` 110, `chatterMax` 40, `tokenLen`, `speakers`, `tokenAlias`); NPC `lines` keys in `fernbrook` objs (e.g. `odile`, `juniper`) |
| Battle strings | `BATTLE_TEXT` in `moves.js` (around line 1475) |
| Item names and blurbs | `ITEMS` in `game.js` (around line 996) |
| Journal lore lines and species notes | `blurb` fields in `sprites.js` (`SPECIES`), and the journal copy in `game.js` |
| New-name lists | `newNames` in `data/cobblecrest.json` |
| Tone decision already agreed | `data/act1_route2.json` `decisions.4_tone`: the energy draining is only hinted at |

### Art examples (all pixel art is drawn as text grids)
| Want to see | Look at |
|---|---|
| Palette (16 colours plus 6 skin tones) | `PAL` at the top of `sprites.js` (keys: `k p r o y l g t n b c s w h m d` and `1`-`6`) |
| 16x16 item icon (grid of PAL keys, `.` = transparent) | `ITEM_ART` in `game.js` (around line 885; `heal_snack` etc.) |
| 16x16 Seal card art | `SEAL_ART` in `game.js` (around line 2909): `seal_fernbrook`, `seal_cobblecrest` (gold rim, glint, one motif) |
| 8x8 colour icons / emotes | `GLYPH` in `sprites.js` (around line 253): `acorn`, `star`, `emote_bang`, `emote_heart`, `emote_sleep` |
| 8x8 HUD icons for the D-pad buttons | `REGION_MAP.icon_map` and `icon_bag` in `game.js` (around line 2590; the book icon is drawn from `ICONS.book`, see line 2670) |
| World props and tiles (16x16, drawn with `px()` calls) | `buildWorldArt()` in `sprites.js` (around line 447): `glimmer_stand`, `crate`, `rubble`, `sign`, `door`, `bed` |
| People (keepers and NPCs: look = skin, hair, hairCol, outfit, outfitCol, accent) | `KEEPER_LOOKS` and `KEEPER_SWAPS` in `keeper.js` (around line 441 and 465): `associate` (Glimmerwell mint coat, white scarf), `fen`, `rook` (spiky orange hair, blue hoodie); new looks in `data/interiors.json` `looks` and `data/cobblecrest.json` `looks` (`hale`, `dorian`, `tamsin`, `dottie`) |
| Creature art (8-wide half sprites, mirrored, 3 stages each) | `SPECIES` in `sprites.js`. No new creatures are requested here |
| How it looks on screen | `screenshots/` (`inventory/inv_shelf_390.png`, `inventory/inv_bag_390.png` for item icons; `emotes/*`; `battle_trainer_390.png`; `13_walk_hud.png`, `2_walk_map.png` for the walk screen and D-pad; `pet_scene_*`, `cloud/*` for panels) |
| Font | `fonts/Jersey15.woff2` (Jersey 15, OFL), see `fonts/README.md`. Text must fit at 320 px wide |
| Sound jingles (synthesized, no audio files) | `sfx.js`; STINGERS v0.1 is described in `BACKLOG.md` ("STINGERS v0.1") |

Past art requests with priorities and how they were described: `data/cobblecrest.json` `artRequests`.

## 2. Constraints

### Art
- **Palette only.** Use the `PAL` keys in `sprites.js`. No new colours. Skin tones `1`-`6` are for people.
- **Formats.** Tiles and props 16x16. Item icons and Seal cards 16x16. HUD icons and glyphs 8x8. Creatures not requested. The game adds a 1 px dark outline to sprites automatically, so do not draw it.
- **Deliver as grids.** Arrays of strings, one character per pixel, `.` for transparent. Same as the `ITEM_ART` and `SEAL_ART` examples. A readable PNG preview per asset is welcome but the grid is the source of truth.
- **People are looks, not new sprites.** Describe a person as a look (`skin`, `hair` in short/long/spiky/bun, `hairCol`, `outfit` in coat/hoodie/tunic, `outfitCol`, `accent`, optional `extra` colour swaps). See `data/cobblecrest.json` `looks`. Only ask for new keeper art (a new hair or outfit shape, a lanyard overlay) if the existing options cannot do it.
- **Readable on a small phone.** The walk map is ~150 px tall at 320x568. Props must read at 16x16 against grass, path and town tiles. The Quest icon must read at 24 px on a dark button.
- **Reduced motion.** Anything animated needs a still fallback.

### Writing
- **One `say` line <= 110 characters.** Ambient chatter <= 40. (`interiors.json` `dialog`.)
- **Tokens:** `{name}` (player, <= 10 chars), `{player}` (alias), `{pet}` (partner, <= 10), `{rival}` (<= 9), `{species}`, `{type}`, `{foe}`, `{trainer}`, `{title}`. The line checker fails on an empty substitution, a double space or a leftover `{token}`.
- **Speakers** must map to a look (`dialog.speakers` / the `speakers` block of a data file). An empty speaker `""` is narration.
- **Step vocabulary available to scenes:** `say`, `choice` (label, steps), `if` (condition, then, else), `setFlag`, `give` (item, n), `battle` (trainer id), `encounter`, `run` (another scene), `rest`, `respawnHere`, `nameEntry`, `lookPick`. Conditions: `flag`, `!flag`, `flag=value`, `seal:id`, `has:name`. Coming with this work: an `inc` step for counters, numeric conditions (`flag>=2`), a `standing` step (`["standing", "glimmer", 5]`), and optional conditions on a `choice` option. Write scenes assuming those exist; the implementer adds them. A scene can be marked as a variant of another (`name@glimmer`); the game picks it automatically when the player is pledged to Glimmerwell.
- **Tone.** Cozy and a little funny. Never cruel on screen. Glimmerwell's harm to wild Walklings is hinted at, not shown (agreed: `act1_route2.json` `decisions.4_tone`). Short sentences, concrete nouns, present tense in narration.
- **No empty-calorie additions.** Match the existing punctuation: straight quotes escaped in JSON, `...` for a trailing-off beat, no double spaces.

### Voice guide (derived from the existing script)
- **Glimmerwell Co.** Relentlessly cheerful corporate. Harm is always described as comfort. Signature phrases already in the game: "Have a bright day!", "Brighter by nature.", "Clean energy", "It's a partnership!", "units" (for Walklings), "relocating", "Comfort Sanctuary", "Comfort Lamps", "Glow Census", "Quarterly targets", "Junior Bright", "Head of Acquisitions", "Tired is just relaxed with bad lighting." Never villainous in tone; they believe it. People: Associate Juniper (brochures), Associate Tobin, Associate Hollis (census), Field Lead Imogen (breezy, "sweetie"), Dorian Pell (grand, Head of Acquisitions).
- **Keepers.** Warm, grounded, craft-and-care metaphors. Fen: roots, blossoms, orchards ("Roots first, then blossoms."). Hale: stone, patience, the kettle is always on. Amos: Lantern House keeper. Ilse: the Warden, kind and a little wry.
- **Rook.** Breezy, competitive ("Race you!"), proud, loyal to his supervisor. His doubts arrive as unfinished sentences ("It does. Right?"). Orange spiky hair; calls the player by `{name}`.
- **The player** is mostly silent. Choices are short (<= 30 chars per option label so they fit the button).

## 3. Art requests

Priority: **must** blocks the work package, **should** is wanted for launch, **could** is polish. WP = the work package in `NEXT_PLAN.md`. Ids are proposals; rename freely, but keep them stable once approved.

| Id | What | Size | Where it appears | Priority | WP |
|---|---|---|---|---|---|
| `icon_quest` | HUD icon for the QUEST button: reads as "next step" (flag, signpost or "!"). Same style as `icon_map`, `icon_bag`, `icon_book` | 8x8 | D-pad, top-right cell | **delivered** (Build 2, signpost) | C |
| `cue_chevron` | The bobbing "go here" marker. Today it is drawn in code as four yellow blocks with a dark outline; a proper glyph is welcome | 8x8 (or 5x5) | Above the objective tile on the walk map | should | C |
| `cue_arrow_{up,right,down,left}` | Edge-of-map arrow pointing toward an off-screen objective | 8x8 x4 | Walk map edge | should | C |
| `befriend_odds_{low,fair,good}` | Three tiny pips or faces that show how likely a befriend is | 8x8 x3 | Befriend panel, optional | could | A |
| `emblem_keepers` | Keepers emblem (lantern or leaf) | 8x8 | Standing tab, switch desk | must | B |
| `emblem_glimmer` | Glimmerwell emblem (mint bulb or spark) | 8x8 | Standing tab, switch desk | must | B |
| `tier_{keepers,glimmer}_{0..4}` | Five tier badges per faction (the tier names are a writing task below) | 8x8 x10 | Standing tab, Friends tab keeper line | should | B |
| `seal_glim_1`, `seal_glim_2` | Glimmerwell "lanyard tier" cards, same family as `seal_fernbrook` / `seal_cobblecrest`, in mint/white (`l s w`) with a gold rim | 16x16 x2 | Card shown after a win; Bag/Journal later | **both delivered.** Tier 1 Build 3. Tier 2 is `LANYARD_TIER2` (Q20) | B |
| `glimmer_pavilion` | Pop-up Glimmerwell office in Fernbrook (door tile plus a sign or awning), for the glimmer path's Hall slot. Final shape depends on the Hall-replacement design (section 6) | 16x16 tile set | Fernbrook | should | B |
| `switch_desk_glimmer` | Glimmerwell "pledge" counter or kiosk (mint, brochure rack) where the player switches to Glimmerwell | 16x16 | Fernbrook, Cobblecrest, Route towns | must | B |
| `switch_desk_keepers` | Keepers equivalent. Probably the existing Lantern House keeper; if a separate prop is better, a pledge board | 16x16 | Lantern Houses | could | B |
| `lanyard_overlay` | A mint Junior Bright lanyard on the player keeper while pledged to Glimmerwell (accent swap or overlay) | 16x16 frames x4 facings x2 | Player sprite | could | B |
| `rook_lanyard` | Rook with a mint lanyard (carried over from the Cobblecrest list; `artRequests.rook_lanyard`) | look swap | Rook after Fernbrook | should | B |
| `rook_lanyard_off` | Rook with the lanyard gone (post-conversion) | look swap | After Rook's R5 beat | should | B |
| `npc_imogen`, `npc_hollis` | Distinct looks for Field Lead Imogen and Associate Hollis (today both use the generic `associate` look) | looks | Route 2, Wickerglen | should | B |
| `npc_tourguide` | A Glimmerwell tour guide look (only if "tours" is chosen, section 6) | look | TBD | could | B |
| `comfort_lamp_tinted` | Variants of the existing lamp stand for a Hall-replacement stop (only if needed) | 16x16 | TBD | could | B |
| Hall-replacement props | Depends entirely on the design in section 6 (tour stops, a sacrifice altar or bowl, a quota board). Do not draw until the loop is approved | 16x16 | TBD | blocked | B |
| `item_glimmer_*` | Icons for any glimmer-only items (names are a writing task) | 16x16 | Bag, shop | could | B |
| `stinger_standing_up` | A short jingle spec for "a faction's regard went up a tier" (notes and timings in the same style as the STINGERS v0.1 table; the engine synthesizes it) | spec | Tier-up moment | should | B |
| `town_loop_glimmer` | OPTIONAL variant of the town loop for Glimmerwell-run spots (too cheerful, slightly off) | spec | Pavilion, switch desk | could | B |

Not requested: new creatures, new maps (the glimmer path reuses the existing maps), new tiles.

## 4. Writing requests

Counts are rough budgets so the work can be scoped. A "line" is one `say` of <= 110 chars. IDs are proposals. Each scene should come with its branch conditions spelled out (see the Rook tree in `NEXT_PLAN.md` for the structure).

### 4a. Faction identity (do first; everything else hangs on it)
1. **Faction names and tier names.** Five tiers per faction, working names in `NEXT_PLAN.md`: Keepers: Stranger, Friend, Trusted, Hall Friend, Warden's Ally. Glimmerwell: Guest, Associate, Junior Bright, Bright Lead, Founder's Pick. Confirm or replace. Each needs a one-line blurb (<= 40 chars) for the Standing tab and a tier-up toast (<= 40 chars).
2. **A one-page Glimmerwell glossary** (their phrases for: Walklings, draining, relocating, the player, the Halls, Rook, Standing). Keep inside the existing voice.
3. **A one-paragraph statement of what each faction asks of the player and what the player gets**, in-fiction. This anchors the Standing sources: Keepers regard care and kindness; Glimmerwell regards output and quotas (proposal in `NEXT_PLAN.md`).

### 4b. The Fernbrook pick (WP-B, phase B0/B1) — **shipped in Build 3**

Scenes below are in `data/glimmer_path.json`. Left: Tour stop copy (recipients, slogans, Comfort Check, Census board, stage photo) and the real name of `tour.doubt`. Do not rewrite the engine steps.
| Scene id | Beat | Lines | Branching |
|---|---|---|---|
| `side_pick` | After both camps are met: Fen asks for help at the crates, Juniper and Tobin offer a Junior Bright trial lanyard. Ends in a choice plus a "Really?" confirm. Must say the player can change course later at a cost | 14-18 + choice + confirm | Sets the side |
| `side_pick` neutral lines | What Fen, Juniper and Tobin say if the player walks away mid-choice | 4-6 | None |
| `orchard@glimmer` | The orchard beat from the glimmer side: the player helps pack crates, Fen confronts them, 2-3 flavour choices | 12-16 | `standing` +; sets `story.orchard_cleared` |
| `fern_associate@glimmer` trainer lines | Tobin as a friendly sparring partner (intro / win / lose) | 3 | None |
| Fen as the holdout (trainer lines for the glimmer path) | His intro / win / lose when the player comes at his Hall as Glimmerwell's helper | 3 | None |
| Ambient (`lines` keys) | Keeper Amos, Odile, Juniper, Fen, Hattie, Ilse: a Keepers-regard variant and a Glimmerwell-regard variant each (<= 40 chars, ambient chatter) | 10-14 | By side or tier |

### 4c. The switch (WP-B, phase BS) — **engine shipped in Build 2**

Desk *copy* (letter, review, welcome) is still placeholder (OPEN_DECISIONS D19). Write those lines; do not add new map objects.
| Scene id | Beat | Lines |
|---|---|---|
| `switch_desk_glimmer` | The Glimmerwell associate's desk: first visit, repeat visit, "not enough regard yet, try this first", cooldown refusal, confirm | 10-14 |
| `switch_desk_keepers` | The Keepers' desk (Lantern House keeper), same set | 10-14 |
| `switch_bridge_to_glimmer`, `switch_bridge_to_keepers` | Short bridging scene after a switch, one per direction | 4-6 each |
| Catch-up lines | Short lines that later scenes can drop in when the player did earlier beats under the other side ("You helped pack those crates, didn't you?"). One per major beat (orchard, Hall slot #1, Wickerglen lamps, the quarry sale) per direction | 8-10 |

### 4d. Route 2 and Wickerglen, glimmer variants (phase B2) — **implementer copy is on main; replace that prose**
| Scene id | Beat | Lines | Notes |
|---|---|---|---|
| `glimmer2@glimmer` | The Glow Census, the player as a volunteer | 5-6 | |
| `lead_intro@glimmer` | Imogen welcomes you; 3 choices on how to log the lamps (go along, ask why, quietly uncomfortable). The last gives Rook a bond point | 10-14 | `rook_bond` + |
| `faded2@glimmer` | The grey Pebblit, seen from the glimmer side | 3-5 | Keep the encounter flow |
| `glen_cleared@glimmer` | The lamps click off when `{pet}` bumps the stand; Imogen praises the player; Rook's doubts show; 3 Befriend Treats | 12-16 | `rook_bond` choice |
| `route2_end@glimmer` | The gate and the Cobblecrest invitation. Keep the `together` / `race` choice and its flags | 8-10 | `story.rook_pact` |

### 4e. Cobblecrest, glimmer variants (phase B3) — **stub is on main; the one-pager replaces it**
| Scene id | Beat | Lines |
|---|---|---|
| `cobble_arrive@glimmer` | Arrival with Rook as a fellow Junior Bright (reads `rook_pact`) | 5-6 |
| `quarry_buyout@glimmer` | The player on stage beside Dorian; Hale loses; Rook's private objection ("units") | 18-24 |
| `rival2_rook` lines, glimmer | Rook's intro / win / lose when the player is pledged to Glimmerwell | 3 |
| Hall slot #2, glimmer | **Sacrifice**, Quota as the free floor (D3). Write the one-pager, then the scenes | TBD |
| `seam_a`, `seam_b` | Shared; check they still read correctly for a glimmer player | 0-2 |

### 4f. Rook's tree (WP-B, phases B2 to B4)
**D23:** Keepers path, Rook eventually converts to good. Glimmerwell path, Rook stays. Not bond-gated. No follow-or-stay fork.
- R2 `teaser@glimmer`: **shipped** (Build 3). Do not say he leaves.
- R3 and R4 variants: included in 4d and 4e (Build 4 / 5). Bond may flavour a line; it must not gate R5.
- **R5, two variants not four, already written off `main`:** Keepers `brinewick_hook` (`story.rook_end` `"ally"`); `brinewick_hook@glimmer` (`"stays"`). Both set `story.cobble_end`. No free-switch bridge. Tone confirmation is D25.
- Keepers-path post-conversion ambient, if he becomes an ally: 6-8. Glimmer-path colleague ambient is optional.

### 4g. Quest objectives (WP-C) — **shipped in Build 2**

Do not rewrite the 24 rows. Glimmer `hall1` already names the Tour. Add Route 2 / Cobblecrest glimmer lines only if a new beat would read wrong.
The Quest button needs one short objective per step of the story chain. For each step: **text <= 110 chars** (what to do, written as a gentle pointer, not a command), and a **place line <= 24 chars** ("Fernbrook, east side"). The chain is in `NEXT_PLAN.md` WP-C. Roughly 30 steps from "Go to the Warden's Lodge" through "Cobblecrest, Hale's Hall", plus an end-of-content line. Add glimmer variants only where the wording differs. Also needed: two or three "stuck" lines (all Walklings tired: "Rest at a Lantern House first").

### 4h. Standing and Standing-adjacent UI strings
- Tab names, empty states, "pledged to {faction}" label, a one-line explanation of Standing (<= 90 chars).
- Switch confirm text for each direction, "can't switch yet" reasons (cooldown, not enough regard), the tier-up toast for each tier.

### 4i. Befriending (WP-A)
- `befriendWary`: the one-line hint when the creature is untouched. Three alternates so it doesn't repeat. Examples of the shape only: "It's wary. Wear it down first." (<= 40 chars, battle-panel width).
- One line for the first-ever untouched attempt outside the tutorial, and one that fires after three misses.

### 4j. Items, names and journal
- Names and blurbs for any glimmer-only item or shop entry (<= 20 chars name, <= 40 chars blurb; see `ITEMS`): optional "Comfort"-themed consumables.
- A `newNames` list of any new place, NPC, trainer or class names, as in `data/cobblecrest.json`.
- Optional journal lore for anything new.

### 4k. Trainers on the glimmer path
Intro / win / lose lines for each trainer whose framing changes (Tobin, Fen as holdout, the Cobblecrest juniors, Hale as holdout, Rook #2). Follow the format in the existing `trainers` blocks (`lines.intro`, `lines.win`, `lines.lose`).

## 5. How to deliver

1. **One JSON file** in the shape of `data/cobblecrest.json`: `spec`, `version`, `status`, `_about`, `decisions`, `scenes`, `trainers`, `looks`, `speakers`, `flags` (every flag a scene sets or reads, with a one-line note), `reusedFlags`, `newNames`, `artRequests` (with the status of each: delivered / blocked), and `engineAsks` for anything the scene vocabulary cannot do. Suggested path: `data/glimmer_path.json`.
2. **Art as grids** in one file (suggested `data/glimmer_art.json`: `{ "<id>": { "size": [w, h], "grid": ["..."] } }`) plus optional PNG previews. The implementer copies grids verbatim into `sprites.js` / `game.js`, as was done for `seal_fernbrook`.
3. **Sound specs** as a short table (notes, timings, voices) like the STINGERS v0.1 table.
4. **Check your own lines**: <= 110 chars, no leftover tokens, speakers all mapped, every flag in `flags`.
5. **Approval**: Vincent approves per phase, as with Route 2 and Cobblecrest (`status` records the approval).
6. Deliver per phase so the build is never blocked on all of it. **Now:** Tour stop copy (4b leftover), the Sacrifice one-pager, and desk copy (4c). Route 2, Cobblecrest, and R5 (4d–4f) already have implementer scenes on `main`. Replace that prose. Do not write a second set.

## 6. Open design questions where the designer is needed

1. **Tour stop copy (D26).** Recipients, slogans, Comfort Check lines, Census-board lines, the stage photo, and the real name of `tour.doubt`. The four-stop Tour engine is already in Fernbrook.
2. **Cobblecrest Sacrifice one-pager (D24).** Slot 2 is Sacrifice, Quota as the free floor. One page: what the player gives up in 5–10 minutes, the floor so they cannot soft-lock, how Quota substitutes, what it grants (`story.seal2`, `seals.seal_glim_2`, Standing). Cheerful-and-sinister; completable with a tired party. Then write the scenes. Slot 1 (Tour) is done.
3. **Standing tiers and what they unlock.** Working names shipped. What each unlocks (lines, shop entries, titles) is still open. Nothing story-critical may be gated on Standing.
4. **Switch-desk copy (D19).** Engine is in. Write the letter, review, welcome, and "think about it" lines.
5. **Rook after R5 (D25).** Keepers convert: ally or parted, and how much of him do we see later? Glimmer stay: colleague lines only, no quit.
6. **Completionists.** After switching, can the player also complete the other faction's trials and hold both kinds of seals? Proposal: yes, optional.
