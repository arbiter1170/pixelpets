# Changelog

## 2026-10-13 21:28 ET — Save a copy before Start over (`20261013-2128`)

- Settings has Save a copy and Read a copy. The Start over dialog offers SAVE A COPY before the hold.
- The file is `walklings-save.json`, the same v2 save the game stores. Reading it replaces the game on this device and reloads. `v` stays 2.
- A file from a newer build, or a file that is not a save, is refused. The current game stays.
- With no Walklings yet, the gear stays tappable under the opening scene, so a wipe can be undone without finishing the intro.
- Device prefs (mute, location, debug) stay on this browser. They are not in the file.

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
