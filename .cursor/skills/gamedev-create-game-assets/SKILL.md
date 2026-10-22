---
name: 'Gamedev: Create game assets'
description: >-
  Use when Design or PixelPets plans, makes, sources or checks Walklings
  pixel-art sprites, tiles, icons or UI art for the browser vanilla-JS game (art
  brief, asset list, pixel checks, provenance); walklings-* skills (esp.
  walklings-room-packet) win on conflict.
---
# Create game assets

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. New state goes in as new keys (story flags on `S.flags`).
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- The player is a "holder" in all copy, comments and specs. Never use another title.

Turn the game's visual intent into a consistent, game-ready set of pixel-art assets. Image generation is one tool inside a controlled pipeline, never proof that an asset can ship. Room reskins, palette fixes and interior packets follow walklings-room-packet.

## Core workflow

1. **Inspect before inventing.** Look at the existing sprites, tiles, palette (`PAL`), tile size, sheet layout, naming, and how the art reads at phone widths. Keep the existing direction unless a redesign is asked for.
2. **Lock the technical frame.** Record tile and sprite size, frames per animation, facing set, anchor (usually bottom-centre), palette, outline rule, transparency, and the scale the art is drawn at on 320–390 px screens.
3. **Name the visual system in concrete terms:** shape language, silhouette, value structure, palette roles, outline and edge treatment, light direction, and detail density. Use these words, never "in the style of" another game or a living artist.
4. **Keep an asset list.** In the brief or packet, list every asset with its states and variants, size, anchor, source (made by us or by a tool), licence, and approval status. Mark placeholders clearly.
5. **Approve one target first.** Make one hero sprite or a small style board and judge it at real game scale over a real map background before producing a set.
6. **Produce families, not one-offs.** Reuse the approved target as the reference. Keep palette, view, proportions, light and outline fixed across the family.
7. **Clean up deterministically.** Crop, size, anchor, slice and name with ordinary image tools. Never trust a generated grid, transparency or frame alignment without checking it.
8. **Check in the game.** Draw with `imageSmoothingEnabled = false` and integer scaling. Look at it on a phone width in motion, over light and dark tiles, and at night tint if day/night is on.
9. **Record provenance** for every shipped file.

## Pixel-art rules

- Treat generated output as a draft only. Enforce a true pixel grid: remove blended pseudo-pixels, stray single pixels, banding, and colours outside the palette.
- Resize only with nearest-neighbour, and only by whole multiples.
- Animation frames share one canvas size and one anchor. Identity, volume, outline and baseline must not drift between frames.
- Test tiles in a repeated 3×3 block for seams before approval.
- Keep text and buttons as code or DOM, not baked into images, so copy can change and stays crisp.

## Checks to run (describe the result in the PR)

- **Size:** every frame is exactly the expected width and height, and the sheet divides evenly into frames.
- **Alpha:** the background is truly transparent (not near-white), and edges have no semi-transparent fringe unless intended.
- **Colour count:** unique colours stay within the palette budget, and every colour maps to a palette role.
- **Grid:** no off-grid or half pixels, and the outline is a consistent width.
- **Contact sheet:** lay all frames side by side at 1x, 2x and 3x, nearest-neighbour, over a checkerboard and over a real map tile. Look for drift, clipping and silhouettes that don't read.

## Rights and "nothing copied"

- Every shipped asset is made by us or comes from a source whose terms allow it. Record the creator or tool, date, licence and any attribution text.
- Don't treat "free", "found online" or "generated" as a licence. Check the terms at the original source.
- Don't trace, recolour or closely imitate sprites, characters, creatures or UI from other games. Don't use franchise or brand names in prompts, file names or briefs.
- When terms are unclear, flag it for Vincent rather than guessing.

## Pitfalls

- One-off prompts that drift in palette, scale or light from the rest of the set.
- Calling an asset done from a preview alone, without in-game, phone-width inspection.
- Blurry art from smoothing, CSS resizing or non-integer scale.
- Missing provenance on a shipped file.
- Baked-in labels or mockup frames in generated images.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/disciplines/create-game-assets), Apache-2.0. Changes: trimmed and adapted for Walklings.
