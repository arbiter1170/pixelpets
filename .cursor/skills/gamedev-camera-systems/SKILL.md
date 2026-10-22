---
name: 'Gamedev: Camera systems'
description: >-
  Use when building or fixing the Walklings top-down map camera (follow,
  deadzone, edges, door transitions, shake) in the browser vanilla-JS canvas
  game; walklings-* skills win on conflict.
---
# Camera systems

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. New state goes in as new keys (story flags on `S.flags`).
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- The player is a "holder" in all copy, comments and specs. Never use another title.

A top-down pixel-art camera should keep the holder readable, never show past the map edge, never shimmer, and never fight the shake. It is drawn in JS as a world-to-screen offset (`ctx.translate(-camX, -camY)`).

## Core workflow

1. **Decide what the camera serves.** On a top-down map, centre the holder with a small deadzone and lead slightly toward travel. In interiors smaller than the screen, centre the room and don't scroll.
2. **Follow smoothly and independent of frame rate.** Use exponential smoothing, not a fixed `lerp(a, b, 0.1)` per frame, which changes with fps.
3. **Add a deadzone** so tiny steps don't nudge the view.
4. **Look ahead** a little in the facing or travel direction, eased so it doesn't whip.
5. **Clamp to map bounds** using the viewport size, so the view (not just its centre) stays inside. Remember the viewport is narrow at 320 px.
6. **Snap to whole pixels** when drawing, to stop pixel-art shimmer.
7. **Update after movement.** Move the holder, then the camera, then draw. Otherwise the camera lags a frame and jitters.
8. **Verify at 320, 375 and 390 px.** Walk into corners and map edges, through doors, and at low fps (CPU throttling). Check for jitter, edge peeking and whip-pans, and report what you saw.

## Patterns

### Smooth follow with deadzone, look-ahead and bounds

```js
const cam = { x: 0, y: 0, fx: 0, fy: 0 };   // fx/fy = focus point
function updateCamera(dt, holder, map, viewW, viewH) {
  const dzX = 24, dzY = 16;                                // deadzone half-extents, px
  const dx = holder.x - cam.fx, dy = holder.y - cam.fy;
  cam.fx += Math.sign(dx) * Math.max(0, Math.abs(dx) - dzX);
  cam.fy += Math.sign(dy) * Math.max(0, Math.abs(dy) - dzY);
  const lead = 12;                                         // look-ahead, px
  const tx = cam.fx + holder.faceX * lead - viewW / 2;
  const ty = cam.fy + holder.faceY * lead - viewH / 2;
  const k = 1 - Math.exp(-8 * dt);                         // same feel at any fps
  cam.x += (tx - cam.x) * k;  cam.y += (ty - cam.y) * k;
  // Clamp the VIEW to the map; centre maps smaller than the screen.
  cam.x = map.w <= viewW ? (map.w - viewW) / 2 : Math.min(Math.max(cam.x, 0), map.w - viewW);
  cam.y = map.h <= viewH ? (map.h - viewH) / 2 : Math.min(Math.max(cam.y, 0), map.h - viewH);
}
// Draw with whole pixels, shake added last:
// ctx.translate(-Math.round(cam.x) + shake.x, -Math.round(cam.y) + shake.y);
```

### Door and map transitions

On a door, warp or respawn, **hard-cut**. Set `cam.x/y` and `fx/fy` straight to the new target, then fade. Don't let smoothing whip across the map.

### Shake is an additive offset

Shake (see Gamedev: Game feel) is added after follow and clamp, at draw time. It never moves the follow target, so follow and shake don't fight.

## Pitfalls

- A per-frame constant lerp feels floaty at 30 fps and snappy at 120 fps. Use `1 - exp(-rate*dt)`.
- Following before the holder moves causes one-frame lag jitter.
- Clamping the centre instead of the view shows black past the edge.
- No deadzone makes the camera twitch with every step.
- Sub-pixel camera positions make tiles shimmer and seams appear. Round when drawing.
- Smoothing across a teleport whips the camera over the map. Hard-cut instead.
- Ignoring narrow phones: a lead or deadzone tuned at 390 px can push the holder off-centre at 320 px. Scale them to the viewport.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/disciplines/camera-systems), Apache-2.0. Changes: trimmed and adapted for Walklings.
