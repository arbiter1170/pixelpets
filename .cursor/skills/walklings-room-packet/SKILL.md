---
name: walklings-room-packet
description: >-
  Use when PixelPets Design writes a Walklings room reskin, layout change,
  palette fix or interior expansion packet.
---
# Walklings room packet

AGENTS.md rule 9 (Vincent, Oct 23, 2026) applies to every room redesign: reskins, layout changes and interior expansions. Nothing deploys until Vincent has seen before/after previews and said yes. Never throw textures together; the first Glimmerwell trial hall needed a huge rework because of that.

1. **Diagnose in one line** what reads wrong, e.g. "floor and walls are the same value, so it reads as one brick pile" or "too bright, with white tiles".
2. **Inspiration first.** Before choosing pixels, run an inspiration step with sub-agents or the Gemini model.
   - Gather the room's purpose, mood, real-world references and two or three layout ideas.
   - Record the brief in the packet.
   - Inspiration is reference only, never copied art.
3. **Translate the inspiration into Walklings' own assets.** Use PAL keys and the existing tile and prop kits only.
   - Pick a distinct identity: a floor, wall, trim and accent that no other room already uses.
   - Compare against every existing interior. No two rooms may look identical, in layout or in skin.
4. **Palette key ledger**: list the keys (A–K, P and onward) the packet uses or adds, and who owns each. The first PR to land defines a key, and nobody redefines it.
   - Walls MUST use the approved INTERIOR_WALLS kit, with the room's own wall colour table. The kit covers:
     - a 2-tile cap plus face, trim and baseboard
     - corners and door jambs
     - per-map window spots
     - the floor shadow
   - This is the standard for every interior.
5. **Keep what exists**: room ids, warps, NPC lines and quest flags.
   - Move arrival tiles with any new grid.
   - Furnish the room for its purpose, with no big empty floors.
   - Check that quest objects stay reachable.
6. **Acceptance tests and decisions**: list exact checks, plus decisions with colours and defaults. Get ids from `walklings-decision-ids`.
7. **Render a 390px before-and-after preview of EVERY room in the packet**, then follow `walklings-design-commit`.
   - The packet must state that nothing builds or deploys until Vincent has seen the previews and said yes.
   - The Supervisor sends the previews to Vincent.
