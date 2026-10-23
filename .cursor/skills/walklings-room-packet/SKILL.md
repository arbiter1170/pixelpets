---
name: walklings-room-packet
description: >-
  Use when PixelPets Design writes a Walklings room reskin, palette fix or
  interior expansion packet.
---
# Walklings room packet

1. **Diagnose in one line** what reads wrong, e.g. "floor and walls are the same value, so it reads as one brick pile" or "too bright, with white tiles".
2. **Pick a distinct identity**: a floor, wall, trim and accent that no other room already uses. Compare against every existing reskinned interior. No two rooms may look identical, in layout or in skin.
3. **Palette key ledger**: list the keys (A–K, P and onward) the packet uses or adds, and who owns each. The first PR to land defines a key, and nobody redefines it. Walls MUST use the approved INTERIOR_WALLS kit (2-tile cap plus face, trim and baseboard, corners, door jambs, per-map window spots, floor shadow), with the room's own wall colour table. This is the standard for every interior.
4. **Keep what exists**: room ids, warps, NPC lines and quest flags. Move arrival tiles with any new grid. Furnish the room for its purpose (no big empty floors), and check that quest objects stay reachable.
5. **Acceptance tests and decisions**: list exact checks, plus decisions with colours and defaults. Get ids from `walklings-decision-ids`.
6. **Render a 390px before-and-after preview**, then follow `walklings-design-commit`. The Supervisor sends the preview to Vincent before any build.
