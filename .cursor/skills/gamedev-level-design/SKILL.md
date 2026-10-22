---
name: 'Gamedev: Level design'
description: >-
  Use when Design plans a Walklings town, route or interior layout, its pacing,
  gating or critical path in the browser vanilla-JS game; walklings-* skills
  (esp. walklings-room-packet, walklings-quests) win on conflict.
---
# Level design

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. New state goes in as new keys (story flags on `S.flags`).
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- walklings-* skills, `AGENTS.md` and Design's packets win on any conflict with this skill.
- The player is a "holder" in all copy, comments and specs. Never use another title.

A map is a sequence of intended experiences delivered through space. Plan the structure, block it out in tiles, play it on a phone, then dress it. Room reskins, palette fixes and interior expansion packets follow walklings-room-packet.

## Core workflow

1. **Derive metrics first.** Know the holder's walk speed in tiles per second, and how many tiles are visible at 320, 375 and 390 px in each direction. Know the tap-to-move or d-pad reach, and NPC talk range. Size streets, gaps between NPCs, and distances to points of interest in those units.
2. **Block out in plain tiles.** Lay the whole map with placeholder tiles at the right size. Check flow, sightlines and reachability while changes are cheap.
3. **Define the critical path** (entry to the goal the current quest needs) and the path most holders will take. Hang optional corners, secrets and side jobs off it.
4. **Pace it.** Alternate busy and calm: a battle patch, then a bench or shop, then a new NPC. Don't string encounters wall to wall.
5. **Teach, then test.** Introduce a mechanic somewhere safe, let the holder practise, then test it. Difficulty rises in a sawtooth.
6. **Gate with intent.** Use story flags, items, bonds and time of day to control order. Guide with landmarks, light, paths and colour rather than invisible walls.
7. **Playtest on a phone width.** Note where people get lost, bored, stuck or tap the wrong thing. Fix the blockout, and dress only once it plays well.

## Patterns

### Pacing as data (a beat list you can review)

```js
const BEATS = [
  { area: 'square',  type: 'teach',  intensity: 0.1 },
  { area: 'field',   type: 'battle', intensity: 0.5 },
  { area: 'bench',   type: 'rest',   intensity: 0.1 },   // breather + reward
  { area: 'ridge',   type: 'battle', intensity: 0.8 },
  { area: 'shelter', type: 'rest',   intensity: 0.2 },   // save point before the peak
  { area: 'summit',  type: 'climax', intensity: 1.0 },
];
// Read the intensity column: it should rise overall but dip for rests, never flatline high.
```

### Gating graph, checked for soft-locks

```js
const AREAS = {
  square: { exits: [{ to: 'field' }, { to: 'shop' }] },
  shop:   { exits: [{ to: 'square' }], grants: 'story.has_lantern' },
  field:  { exits: [{ to: 'cave', needs: 'story.has_lantern' }] },
};
// Flood fill from the start, crossing an exit only once its `needs` flag has been granted
// somewhere already reachable. If the goal isn't reached, the path is soft-locked.
```

### Time-of-day gates

Treat "only open at night" or "NPC only here by day" as gates too. Every time gate needs three things: a reachable rest spot (bench or bed), a visible hint (sign, board or card), and a fallback so it never soft-locks. Waiting at a rest spot is a **local clock offset only**. It never skips the clock globally, and it is off in co-op. Follow the gate data format in Design's world clock packet.

## Readability on a phone

- On a 320 px screen the holder sees only a few tiles ahead. Put a landmark or sign in view at every junction.
- Keep doors, NPCs and interactables at least one tile apart so taps aren't ambiguous.
- Don't put key interactables under the HUD or safe-area insets at the screen edge.
- Telegraph one-way moves (ledges, one-way doors) before the holder commits.

## Pitfalls

- Dressing before it plays wastes art on a layout that will change.
- Ignoring metrics leaves walks that feel endless at a slow pace, or streets too tight to tap through.
- Flat pacing: all battles or all walking.
- Testing a mechanic before teaching it.
- Soft-locks, where a gate's flag or item is only obtainable past the gate. Validate the order, not just the connections.
- A time gate with no rest spot, no hint, or a wait that works in co-op.
- Nothing draws the eye, so holders wander. Use landmarks and leading paths.
- Using generated variety in place of authored pacing. Hand-author the places that matter.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/disciplines/level-design), Apache-2.0. Changes: trimmed and adapted for Walklings.
