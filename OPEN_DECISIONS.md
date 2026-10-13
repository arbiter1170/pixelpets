# Open decisions

Things that were built on a best guess, deviate from a plan, or need a person (Vincent or the designer) to confirm. Each row says what the code does today, so a decision can be made without reading the diff. When one is settled, move it to "Settled" with the date and the call, and update the code or plan if it changed.

Source: the first implementation pass of NEXT_PLAN (WP-C, WP-A, WP-B0), PR #3.

## Open

| # | Area | Decision needed | What the build does today | Where to change it |
|---|---|---|---|---|
| D1 | WP-B0 side pick | Should `side_pick` wait until both `glimmer1` and `fen_intro` have played (the plan) or fire at the gate regardless? | Fires at the orchard gate (9,10) on `!story.side_pick_done` and `!story.orchard_cleared`. Both camps pitch inside the scene. Reason: Fen is optional, and the gate is the only orchard entrance and the last tile before Tobin's sight line, so gating on `met_*` lets the player skip the fork | `fb_side_pick` in `data/glimmer_path.json` (`when`) |
| D2 | WP-B0 timing | Proceed with the glimmer engine and stub before the designer and Vincent deliver content and the Hall spike? | Engine and placeholder text shipped; the keepers path is unchanged. All glimmer dialog is placeholder | `data/glimmer_path.json` |
| D3 | WP-B Halls (BH) | What is the glimmer Hall gameplay ("sacrifices / tours")? | Stub only: a Glimmerwell-run review panel plus one battle with Fen's roster, `seals.seal_glim_1` "Bright Tier 1 Lanyard". Hall #2 has no glimmer twin yet | NEXT_PLAN "Hall replacement: design spike"; `hall1_fen@glimmer` |
| D4 | WP-B0 history | Record `story.beat.<scene>` for every scene that sets a `story.*` flag, or only scenes that have an `@glimmer` variant? | Every such scene (about 20 small flags per full playthrough), so a later switch never needs a back-fill | `isBeat()` / `noteBeat()` in `game.js` |
| D5 | WP-B0 Rook | Glimmer-path teaser: the lanyard-keyed twins `rook_fb_glim` and `fb_teaser_glim` reuse the base `teaser` scene (it still says "Route 2 opens in the next update" and Rook's keepers framing) | Works as a gate so `story.slice_end` lands; `teaser@glimmer` is B1 content | `data/glimmer_path.json` |
| D6 | WP-A numbers | Quarry weakened-creature befriend width is 0.17, the plan's target is 0.22. Everything else is within about 0.02 of the plan table | Left as is | `BEFRIEND_TUNE` in `moves.js` |
| D7 | WP-A | Show the WARY / FAIR / GOOD label (the plan called it optional)? Thresholds are 0.15 / 0.25 | Shown under the hearts | `oddsLabel` in `game.js` |
| D8 | WP-A | Optional extras not built: wary-shrink on a miss, a Settings "Easier befriending" toggle, KO mitigation. Build any? | None built | NEXT_PLAN WP-A |
| D9 | WP-A | The wary line is set once per battle and stays in the message box after BACK. Clear it? | Stays | `openBefriendBar` in `game.js` |
| D10 | WP-C copy and art | Objective text (24 steps, 110 chars max), place names, and `icon_quest` are placeholders. Need designer copy and a real icon | Placeholder text, a flag-like glyph | `CHAIN` in `quests.js`; `REGION_MAP.icon_quest` in `game.js` |
| D11 | WP-C behaviour | The objective cue and walk tip show before the starter (pointing at the Lodge) while the QUEST button stays hidden until then. After the first-steps tips, the walk tip is replaced by the objective text. Intended? | As described | `drawObjectiveCue`, `walkTipText` in `game.js` |
| D12 | WP-C scope | Side-task count (Faded Fuzzwick etc.) and per-side objective text are not built | Not built | NEXT_PLAN WP-C; needs B1-B4 for per-side text |
| D13 | Art | Lanyard art (16x16, tiers 1 and 2) is a placeholder drawn in code | Cyan cord with a white badge | `lanyardArt` in `game.js`; see DESIGN_HANDOFF |

## Not started, blocked on people

- BS (Standing, tiers, switch desks with cost and cooldown): needs tier names and numbers from the designer and Vincent.
- BH design spike: Vincent and the designer.
- B1-B4 glimmer content and Rook's R5 conversion: the designer's scenes and art.

## Settled

Recorded decisions (Vincent, Oct 13, 2026) live in the BACKLOG "Decisions recorded" list: Rook always leaves Glimmerwell; the side pick is at Fernbrook and switchable later with Standing; Trial Hall replacement is an open spike; capture "no combat performed" means full health in this encounter.
