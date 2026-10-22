---
name: 'Gamedev: Performance optimization'
description: >-
  Use when Walklings drops frames, stutters, drains battery or loads slowly on
  phones in the browser vanilla-JS canvas game; measure first, then fix one
  bottleneck; walklings-* skills win on conflict.
---
# Performance optimization

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. New state goes in as new keys (story flags on `S.flags`).
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- The player is a "holder" in all copy, comments and specs. Never use another title.

Performance work is measurement, not tricks: **profile, find the one bottleneck, fix it, measure again.** Don't optimize code you haven't measured.

## Core workflow

1. **Set the target and reproduce it.** 60 fps is 16.7 ms per frame and 30 fps is 33.3 ms. Find a repeatable worst case, such as a busy town square, battle start or a map change.
2. **Profile on phone-like conditions.** Use Chrome DevTools Performance with 4x–6x CPU throttling and a phone viewport, plus a real phone via remote debugging when you can. Read the frame: scripting, rendering/painting, GC, and long tasks.
3. **Find the side that's slow.** If scripting dominates, look at game logic, allocations and pathfinding. If paint or raster dominates, look at canvas draw count, overdraw, filters and big DOM repaints.
4. **Fix the biggest cost first, preferring an algorithmic win:** do less work, cache, run it less often, or skip offscreen work.
5. **Re-measure the same scene with the same throttling.** Keep or revert based on numbers.
6. **Set budgets so it stays fixed.** Give each subsystem a ms slice and cap asset sizes.
7. **Report numbers:** before and after frame time, the bottleneck, and the fix. Never just "should be faster". Say if you only measured on desktop.

## Frame budget at 60 fps (16.7 ms)

Roughly: logic and AI about 4 ms, drawing about 6 ms, UI/DOM about 2 ms, with the rest as slack. Phones throttle when hot, so leave headroom. When a slice blows its budget, that slice is the target.

## High-value fixes for a canvas game

- **Cache static layers.** Draw unchanging tile layers once to an offscreen canvas per map and blit that each frame. Don't redraw hundreds of tiles.
- **Draw from atlases.** Use `drawImage` with source rects from a few sheets. Avoid per-frame `shadowBlur`, `filter`, gradients and `getImageData`.
- **Draw only what's on screen.** Cull sprites and tiles outside the camera rect.
- **Use integer coordinates.** Sub-pixel positions cost more and blur pixel art.
- **Don't allocate in the loop.** Don't create arrays, objects or closures per frame in hot paths. Reuse scratch objects and pool short-lived things (particles, damage numbers).
- **Keep DOM updates out of the loop.** Update UI only on change (see Gamedev: Game UI/UX). Avoid reading layout (`offsetWidth`) right after writing styles.
- **Throttle expensive work.** Repath on a timer, not every frame. Do world-clock and NPC schedule ticks at a coarse rate.
- **Pause when hidden.** Stop the loop and audio on `visibilitychange`, and use `requestAnimationFrame`, never `setInterval`, for drawing.
- **Watch load cost.** Compress PNGs, lazy-load maps or audio not needed at boot, and keep the boot path short. Phones on cellular feel every 100 KB.

```js
// Simple pool: reuse instead of create/discard each frame.
const pool = [];
const acquire = () => pool.pop() ?? { x: 0, y: 0, life: 0, active: false };
const release = p => { p.active = false; pool.push(p); };
```

```js
// Cheap in-game frame meter for a debug overlay (dev builds only).
let acc = 0, frames = 0, worst = 0, last = performance.now();
function meter(now) { const ms = now - last; last = now; acc += ms; frames++;
  worst = Math.max(worst, ms);
  if (acc > 1000) { debugLine(`avg ${(acc/frames).toFixed(1)}ms worst ${worst.toFixed(1)}ms`);
    acc = frames = worst = 0; } }
```

## Pitfalls

- Optimizing without profiling. The obvious suspect is usually wrong.
- Measuring only on a fast desktop. Throttle, or use a real phone.
- Fixing scripting when paint is the bottleneck, or the reverse.
- Polishing a hot line when an O(n²) loop or full-map scan every frame is the real cost.
- Garbage spikes from per-frame allocation, which show up as periodic hitches.
- Leaving the loop running in a background tab, which drains the battery.
- No budgets, so performance silently regresses. Add a perf note to QA checks when a change touches the draw loop.
- Optimizing a prototype before it's fun.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/disciplines/performance-optimization), Apache-2.0. Changes: trimmed and adapted for Walklings.
