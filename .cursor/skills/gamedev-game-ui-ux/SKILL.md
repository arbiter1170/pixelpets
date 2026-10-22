---
name: 'Gamedev: Game UI/UX'
description: >-
  Use when building or fixing Walklings HUD, menus, overlays, phone apps or
  dialog boxes in the browser vanilla-JS game at phone widths; walklings-*
  skills (esp. walklings-qa) win on conflict.
---
# Game UI/UX

## Walklings adaptation

- Plain vanilla JS: `game.js` and the other root `.js` files, data in `data/*.json`, and `index.html`. No engine, no library, no bundler. Translate any idea here into that stack; never add a dependency to get it.
- Mobile-first: everything must work at phone widths of 320, 375 and 390 px using taps alone. Keyboard is a bonus, never required.
- The save stays `pixelpets.save.v2` with `v: 2`. Do not add a migrator or bump `v`. New state goes in as new keys (story flags on `S.flags`).
- No franchise or brand names, and nothing copied from other games. Describe mechanics in our own words and make our own art.
- walklings-* skills and `AGENTS.md` win on any conflict with this skill.
- The player is a "holder" in all copy, comments and specs. Never use another title.

Covers HUDs, menus and overlays that stay correct on every phone: layout, scaling, safe areas, screen flow, and how UI hears about game state. QA procedure (seeded saves, Playwright checks) belongs to walklings-qa and walklings-qa-run.

## Core workflow

1. **Lay out relative, not absolute.** Use CSS flex or grid, percentages, and anchoring to edges and corners. On canvas, compute positions from the current width and height. Hard-coded pixel positions break at the next width.
2. **Pick one scaling rule for the game view.** Use integer scaling of the pixel canvas, with `image-rendering: pixelated` and `imageSmoothingEnabled = false`. Size the backing store with `devicePixelRatio`. Decide what extra width shows (more map, or margins).
3. **Respect the safe area.** Use `<meta name="viewport" content="..., viewport-fit=cover">` and pad with `env(safe-area-inset-*)` so notches and rounded corners never cover a button or text.
4. **Tap first.** Make targets at least about 44×44 CSS px with spacing between them. No hover-only affordances, no double-tap or long-press as the only path. Every screen needs a visible back or close.
5. **Model screens as a stack.** Push an overlay (pause over map), pop to resume. Only the top screen gets input and drawing priority.
6. **Drive the HUD from events, not polling.** Update when `hp`, Acorns or quest state actually change.
7. **Verify at 320, 375 and 390 px.** Check portrait, plus landscape if supported. Look for clipped text, overlapping buttons, and anything under the notch. Report what you saw at each width.

## Patterns

### Screen stack

```js
const screens = [];
function pushScreen(s) { screens.at(-1)?.blur?.(); screens.push(s); s.open(); }
function popScreen()   { screens.pop()?.close(); screens.at(-1)?.focus?.(); }
function topScreen()   { return screens.at(-1); }
// Input handlers route to topScreen() only. "Back" is always popScreen().
```

### Event-driven HUD

```js
const bus = new EventTarget();
function setHp(pet, hp) {
  pet.hp = hp;
  bus.dispatchEvent(new CustomEvent('hp', { detail: pet }));
}
bus.addEventListener('hp', e => renderHpBar(e.detail));   // only when it changes
// Avoid: rewriting DOM text every frame inside the game loop.
```

### Safe-area padding

```css
.hud { padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right))
                max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left)); }
```

## Accessibility and readability

- Text must be readable on a 320 px phone. Don't shrink fonts to fit; wrap, or shorten the copy (see the line limits in walklings-quests).
- Never signal state by colour alone. Pair it with an icon, shape or text.
- Keep contrast high over busy pixel backgrounds by using a panel behind text.
- If keyboard is supported, show a visible focus ring and give each screen a sensible first focus. It stays optional.

## Pitfalls

- Absolute positions tuned to one phone.
- No safe-area handling, so the HUD sits under the notch or home bar.
- Tiny tap targets or targets packed edge to edge.
- Menu flow as boolean flags (`isPaused`, `inBag`, ...). Use the stack.
- Polling game state every frame to redraw DOM, which costs battery and frame time.
- Strings hard-coded inside layout code. Keep copy in data so it can change without layout edits.
- Blurry pixel art from non-integer scaling or CSS resizing.

---
Adapted from gamedev-skills/awesome-gamedev-agent-skills (skills/disciplines/game-ui-ux), Apache-2.0. Changes: trimmed and adapted for Walklings.
