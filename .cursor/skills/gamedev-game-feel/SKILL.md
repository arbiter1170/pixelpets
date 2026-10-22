---
name: 'Gamedev: Game feel'
description: >-
  Use when a Walklings action (battle hit, pickup, level-up, pet reaction,
  button tap) works but feels flat in the browser vanilla-JS game; adds juice
  without touching game rules; walklings-* skills win on conflict.
---
# Game feel

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. New state goes in as new keys (story flags on `S.flags`).
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- The player is a "holder" in all copy, comments and specs. Never use another title.

Game feel is layered, brief and exaggerated feedback on top of a working mechanic. It never changes the mechanic.

## Core principle

One satisfying impact is several tiny responses within about 100 ms: a sound, a few particles, a short hit-stop, a flash, a nudge, a small shake, and a number pop. Two rules:
1. Exaggerate briefly, then return to rest.
2. Scale the feedback to how much the event matters. A step is not a final battle.

## Core workflow

1. **Confirm the event hooks exist** (`onHit`, `onPickup`, `onLevelUp`, `onFaint`, `onTap`). Add them first if they're missing.
2. **Pick 2–3 feedback channels per event.** Add until it reads, then stop.
3. **Ease motion.** Use overshoot for a "pop" and ease-out to settle. Linear looks robotic.
4. **Save hit-stop and shake for real impact.** Keep them short and never on routine actions.
5. **Keep feedback off the game state.** Shake moves the draw offset, not the pet or the camera target. Hit-stop pauses the animation clock, not battle logic or input buffering.
6. **Use tiers.** Define small, medium and large presets and assign each event a tier.
7. **Verify by playing on a phone width.** Does it fire, return to rest, avoid blocking taps, and stay comfortable? Report what you saw.

## Patterns

### Screen shake from decaying trauma

```js
let trauma = 0, t = 0;
function addTrauma(a) { trauma = Math.min(1, trauma + a); }   // hits add, never reset
function shakeOffset(dt) {
  if (trauma <= 0 || settings.reduceMotion) return { x: 0, y: 0 };
  trauma = Math.max(0, trauma - 1.2 * dt);
  const s = trauma * trauma; t += dt * 30;                    // quadratic: gentle when small
  return { x: Math.round(6 * s * Math.sin(t * 1.7)),          // smooth, not random each frame
           y: Math.round(4 * s * Math.sin(t * 2.3)) };        // whole pixels for pixel art
}
// In draw(): ctx.save(); ctx.translate(off.x, off.y); drawWorld(); ctx.restore(); drawHud();
```

### Hit-stop on real time

```js
let freezeUntil = 0;
function hitStop(ms = 80) { freezeUntil = performance.now() + ms; }
function loop(now) {
  const animDt = now < freezeUntil ? 0 : dt;   // animations pause...
  updateAnimations(animDt);
  handleInput();                               // ...taps still register and buffer
  requestAnimationFrame(loop);
}
```

### Squash, stretch and overshoot

```js
const easeOutBack = x => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
function pop(sprite, ms = 180) {
  sprite.scaleX = 1.3; sprite.scaleY = 0.7;
  tween(ms, k => { const e = easeOutBack(k);
    sprite.scaleX = 1.3 + (1 - 1.3) * e; sprite.scaleY = 0.7 + (1 - 0.7) * e; });
}
```

### Tiered feedback bundle

```js
const TIERS = {
  small:  { sfx: 'tick', trauma: 0.1 },
  medium: { sfx: 'hit',  trauma: 0.3, stop: 50,  sparks: 6 },
  large:  { sfx: 'boom', trauma: 0.6, stop: 110, sparks: 20, flash: 60 },
};
function feedback(tier, x, y) { const f = TIERS[tier]; playSfx(f.sfx); addTrauma(f.trauma);
  if (f.stop) hitStop(f.stop); if (f.sparks) sparks(x, y, f.sparks); if (f.flash) flash(f.flash); }
```

## Pitfalls

- A hit-stop timer that runs on the paused clock never resumes. Use `performance.now()`.
- Hit-stop on every frame of a multi-hit move locks the game. Trigger it once per impact.
- Feedback that never returns to rest (scale stuck at 1.1, shake that never decays).
- Over-juicing routine actions. Honour `prefers-reduced-motion` plus an in-game reduce-shake/flash setting, and keep flashes short and not strobing.
- Feedback that blocks taps. Keep it short and let input through.
- Sub-pixel shake or scale on pixel art shimmers. Round offsets.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/disciplines/game-feel), Apache-2.0. Changes: trimmed and adapted for Walklings.
