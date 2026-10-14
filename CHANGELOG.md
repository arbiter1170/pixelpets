# Changelog

Newest first. The build stamp is `version.json` and the `?v=` on each script in `index.html`. Status of open work is `BACKLOG.md`. The queue is `NEXT_PLAN.md` §3.

## 20261014-0831 — Planning notes kept with Act 1

- Merged current `main` into this branch. Act 1 stays. The QA checks stay.
- The next-build order is unresolved. `main` names the box screen. This branch still carries the Lantern Council, look-and-listen, and briefing specs, and none of those three are built here.

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

Act 1, including Builds 4–6, Fernbrook Heights, the save copy, the Keeper House, Ribbit, and the open east gate, landed on `main` after the notes above were written. The entries below are that landing's own log. The next-build order is unresolved.

## 2026-10-13 23:47 ET — East gate and the Hearthmoor watch (`20261013-2347`)

- The tree on the grass south of Hearthmoor's east path is cut. The town sign stands one tile south of that grass, so the walk out to Route 1 is open.
- Officer Bren's patrol reaches the east end of the road. Officer Cald stands just north of the gate. Officer Ness still keeps the Keeper House door.

## 2026-10-13 22:55 ET — Keeper House and Keeper1 (`20261013-2255`)

- Hearthmoor roofs wear gold and green. Glimmerwell ground (the glen, and Cobblecrest after the quarry buyout) wears mint. Officer Bren patrols the Hearthmoor road. Fernbrook, Route 2, the glen, and Cobblecrest each have a watch officer. Clerk Mint appears in Cobblecrest after that buyout.
- The Keeper House, south of the road, has two floors. Sergeant Bram, Archivist Mo, and Clerk Wynn are downstairs. Captain Lumen and Operator Rue are upstairs. Citizens are asked to step back. Keepers are welcomed, more warmly as Standing rises. A Glimmerwell pledge is kept in the doorway.
- The first side quest is on Route 1. Two officers stop you and issue a Keeper1. The wires, the poles, and the companies stay with the Keepers. A blue chevron marks that quest. The main quest chevron stays yellow.
- BOOK is now PHONE. QUEST moved to the bottom bar. The phone has Contacts, Notes, Journal, Friends, and KeeperUAV. Notes say the Lantern desk can read them. KeeperUAV's job board is a placeholder.
- Joining Glimmerwell puts a Cracked Handset in the bag. While you carry it on that pledge, the phone becomes the thin CRACK//HAND and KeeperUAV becomes Botnet, also a placeholder.
- Higher Glimmerwell Standing tints your keeper with mint, then silver. Archivist Mo's books fear a child born already listening. That generation is not in the game.

## 2026-10-13 23:18 ET — Ribbit (`20261013-2318`)

- The phone has Ribbit, a read-only feed. Block News and Chirp Worldwide post about the towns. Local notes and the trending row change with the day, the place you are standing, and the story so far. You cannot post.

## 2026-10-13 21:28 ET — Save a copy before Start over (`20261013-2128`)

- Settings has Save a copy and Read a copy. The Start over dialog offers SAVE A COPY before the hold.
- The file is `walklings-save.json`, the same v2 save the game stores. Reading it replaces the game on this device and reloads. `v` stays 2.
- A file from a newer build, or a file that is not a save, is refused. The current game stays.
- With no Walklings yet, the gear stays tappable under the opening scene, so a wipe can be undone without finishing the intro.
- Device prefs (mute, location, debug) stay on this browser. They are not in the file.

## Tests for the last three commits

Smoke now checks Standing and Heights as well as the quest, glimmer, and befriend lists. It also checks that the Act 1 glimmer scenes swap back to the Keepers scenes, and that Cancel after a short hold does not wipe. Route 2 covers both gate choices, the grey Pebblit line, and that only the quiet Census log gives Rook a bond point. Cobblecrest covers the buyout, the snack that stays in the bag, the review battle, and both Rook closers (a high bond still leaves him with Glimmerwell). The save-copy spec round-trips the file and refuses a newer save, a v1 file, a non-save, and an oversized file. Next builds stay the box screen, then the installable app. Brinewick still needs a one-pager.

## 2026-10-13 19:50 ET — Route 2 glimmer, Cobblecrest Sacrifice stub, Rook R5 (`20261013-1950`)

- Glimmerwell Route 2: Census volunteer (`lead_intro@glimmer`). The quiet log gives Rook one bond point. Wickerglen still bumps the lamps, pays 3 Befriend Treats, and opens the same gates.
- Glimmerwell Cobblecrest: arrival still reads together or race. The buyout puts you beside Dorian. Hale loses the seam. Rook objects to "units", then you battle him.
- Hall slot 2 is a Sacrifice stub. Offer a snack (it stays in the bag), say three names for the free quota, or face Hale. Closing it grants the Bright Tier 2 Lanyard (placeholder art), 2 Hearty Snacks, 1 Wake Tonic, and `story.seal2`. The real cost is still open.
- Rook's closer: on the Keepers path he gets off the cart (`story.rook_end` "ally"). On the Glimmerwell path he stays ("stays"). Both paths set `story.cobble_end` and show the same Brinewick coming-later card. Bond does not gate it.
- Planning docs (`NEXT_PLAN`, `BACKLOG`, `OPEN_DECISIONS`, `README`, the designer handoff) now record Builds 4–6 as shipped and name the next three coding builds: export before Start over, the box screen, and an installable app. Brinewick still needs a one-pager.

## 2026-10-13 18:39 ET — Fernbrook Heights (`20261013-1839`)

- North of Fernbrook, before the first trial. After the side pick, Fen (Keepers) or Juniper and Tobin (Glimmerwell) offer "get to know us" and tell you to stock up.
- Keepers: a smuggling yard, tunnel, crate hold, and broker's den. Jed the clerk helps. After the haulers step aside, Officer Ken of the Fernbrook watch interviews each Walkling with you. They hop toward the orchard. Mara Quill keeps the route page. Nobody is hurt.
- Glimmerwell: the RegenX lab, four floors. Atten really does help a Walkling focus. The staff are decent people. The Arbiter is ancient Glimmerwell technology. It emits something slowly. Nobody can name the emission, or why the machine was built. Nia Voss and Cal Dunn are inside the lab and on Glimmerwell's side. Associate Quinn waits in the bay.
- Standing: the offer, each cleared floor or room, Ken's interview, and the finale add points only to that path's faction, once each.
- `story.heights_done` gates the Trial Hall panel and the Tour's first stop. A save that already has `story.seal1`, or that never picked a side, is not sent back.
- Group battles: two foes at once, you move first, TARGET chooses, and on the last fight an ally Walkling hits the weakest foe. Foes still hit you. Levels sit under Fen's trial: the door is about Lv 4-5, the last fight is Lv 6, so a partner around Lv 7 can clear it with the two Heal Snacks Kit hands over.
- The company name in the game is RegenX. Vincent also wrote PharmaX in the same note; that spelling is not used.
