# Changelog

Newest first. The build stamp is `version.json` and the `?v=` on each script in `index.html`. Status of open work is `BACKLOG.md`. The queue is `NEXT_PLAN.md` §3.

## 20261014-0628 — Look and listen (Q20)

- Bright Tier 2 Lanyard is a real 16×16 badge: the tier-1 gold rim and mint field, with a second white mark. The procedural cord placeholder is gone.
- Three loops in `sfx.js`: `town_glimmer` (F Lydian, the company version of the town theme) while pledged to Glimmerwell, `quarry` on the Cobblecrest quarry, and `grove` in Wickerglen. High Charity's `charity`, `chapel`, and `arcade` still win. Dreams stay on `route`.
- Field Lead Imogen (blonde bob, mint dress, gold sash) and Associate Hollis (cyan curls, mint vest, cap) no longer share the generic associate coat.
- Rook wears a Junior Bright lanyard (mint cord, white-and-gold badge) from the glimmer side pick, and from the end of Fernbrook on either path. `story.rook_end` `"ally"` takes it off.
- Tests: `tests/look_listen.spec.js`. Reference sheet: `screenshots/look_listen/sheet.png`.

## 20261014-0614 — Planning and QA

- Recorded what `main` already has through PR #21 (stamp `20261014-0015` before this pass).
- Named the next four builds. Q19 Lantern Council (Keepers, High Charity, after `story.cobble_end`). Q20 look and listen (tier-2 lanyard, glimmer town loop, quarry loop, Wickerglen grove, Imogen, Hollis, Rook's lanyard). Q16 land the stranded Act 1 stack (`origin/cursor/keeper-hq-phone-0bb2` at `46113b2`). Q21 Capital Partnership Briefing (Glimmerwell, after that stack). Q17 box screen and Q18 installable app follow Q21.
- Added open decisions D37–D42 for those two missions. Defaults let Q19 start.
- Added `PixelPets.mapTrack(mapId)` and `tests/qa_gaps.spec.js`: map loops, the end card beside the Mahopac side objective, the live glimmer hall line, a fainted lead with someone still up, and the minigame dev check.

## 20261014-0015 — Debug panel (PR #21)

Settings → Debug takes the password Larson, any capitalization, and turns on the same tools as `?debug=1` without a reload. The panel jumps to story, side, and High Charity checkpoints, gives items, starts a wild battle with its stats shown, and sets faction and Standing. Lock turns it off. Covered by `tests/debug_mode.spec.js`.

## 20261013-2342 — High Charity (PR #19)

The Keeper capital. A lantern coach on Hearthmoor after the side pick. Five Event Hall games are a side quest from Warden Ilse, not a main-chain step. Original loops: `charity`, `chapel`, `arcade`.

## 20261013 — Lantern rest, Mahopac, faction music (PRs #18, #17, #15)

- A wipe holds the party in the Lantern House until they rest. The rest costs 5 Acorns. A keeper covers a short purse (D28).
- Mom's upstairs tasks and the Mahopac dream are an optional side chain. They never block the main story (D27). Extra keeper looks shipped with that chain.
- Glimmerwell fights, while the player is a Keeper, use `glimmer_first` and then `glimmer_battle`. Wild fights cycle `wild_skip`, `wild_romp`, and `wild_spark`. NPC lines key off pledge and Standing.

## Builds 1–3 (PRs #7, #8, #9)

- Build 1: doc accuracy and the first Playwright smokes.
- Build 2: Standing meters, Fernbrook pledge desks, the STANDING tab, designer quest copy, the signpost quest icon.
- Build 3: the Fernbrook side pick, the glimmer orchard, the Bright Pavilion Tour, the tier-1 lanyard, and `teaser@glimmer`.

## Not on main

Builds 4–6 (glimmer Route 2, the Cobblecrest Sacrifice stub, Rook's closer), Fernbrook Heights, the save copy before Start over, and the Keeper House with the Keeper1 phone are on `origin/cursor/keeper-hq-phone-0bb2`. Q16 lands them. Do not rewrite them.
